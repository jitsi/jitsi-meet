import { IVirtualBackgroundAdvancedConfig } from '../../base/config/configType';
import { VIRTUAL_BACKGROUND_TYPE } from '../../virtual-background/constants';
import logger from '../../virtual-background/logger';
import { IVirtualBackground } from '../../virtual-background/reducer';

import BackgroundFrameProcessor from './BackgroundFrameProcessor';
import { IDeviceCapabilities } from './DeviceTierDetector';
import WorkerSegmentationBackend from './backend/WorkerSegmentationBackend';
import Canvas2DCompositor from './compositor/Canvas2DCompositor';
import { ICompositor } from './compositor/ICompositor';
import WebGLCompositor from './compositor/WebGLCompositor';
import InsertableStreamsPipeline from './pipeline/InsertableStreamsPipeline';
import {
    CLEAR_TIMEOUT,
    SET_TIMEOUT,
    TIMEOUT_TICK,
    timerWorkerScript
} from './workers/TimerWorker';

/**
 * Segmentation canvas dimensions for the V1 landscape TFLite model. Fixed by the model's
 * input tensor shape — the V1 path always runs inference on a 256x144 canvas.
 */
const V1_SEG_WIDTH = 256;
const V1_SEG_HEIGHT = 144;

/**
 * V2-specific constructor options — bundled so the V1 positional signature stays unchanged.
 * Presence of this object on the constructor is the V1/V2 discriminator.
 */
export interface IV2EffectInit {
    capabilities: IDeviceCapabilities;
    enableV2: boolean;
    vbConfig?: IVirtualBackgroundAdvancedConfig;
}


/**
 * Virtual background stream effect.
 *
 * When {@code enableV2} is false (default), the class behaves identically to the original V1
 * engine: main-thread TFLite WASM inference, Canvas 2D compositing, TimerWorker frame driver.
 *
 * When {@code enableV2} is true, the constructor delegates to the pipeline/backend/compositor
 * abstraction: Worker-based inference, WebGL compositing, and insertable streams (with
 * captureStream fallback). The captureStream fallback reuses the shared video/canvas/timer.
 */
export default class JitsiStreamBackgroundEffect {
    _backend: WorkerSegmentationBackend | null = null;
    _enableV2: boolean;
    _inputVideoElement: HTMLVideoElement;
    _maskFrameTimerWorker: Worker | null = null;
    _model: any;
    _options: { height: number; virtualBackground: IVirtualBackground; width: number; };
    _outputCanvasCtx: CanvasRenderingContext2D | null = null;
    _outputCanvasElement: HTMLCanvasElement;
    _pipeline: InsertableStreamsPipeline | null = null;
    _processor: BackgroundFrameProcessor | null = null;
    _segmentationMask: ImageData;
    _segmentationMaskCanvas: HTMLCanvasElement;
    _segmentationMaskCtx: CanvasRenderingContext2D | null;
    _segmentationPixelCount: number;
    _stream: any;
    _virtualImage: HTMLImageElement;
    _virtualVideo: HTMLVideoElement;

    /**
     * Resolves when V2 async initialization completes. V1 resolves immediately.
     */
    initPromise: Promise<void> = Promise.resolve();

    /**
     * Called once when V2 inference fails persistently mid-session.
     *
     * @param {Function} cb - Failure callback, or null to clear.
     */
    set onInferenceFailure(cb: (() => void) | null) {
        if (this._processor) {
            this._processor.onInferenceFailure = cb;
        }
    }

    /**
     * Creates a new background effect instance.
     *
     * @param {Object} model - Loaded TFLite WASM module (V1) or undefined (V2).
     * @param {IVirtualBackground} virtualBackground - Active virtual background Redux slice
     * (background type, blur value, image source).
     * @param {IV2EffectInit} [v2Init] - V2-specific setup payload. When present, activates
     * the V2 pipeline.
     */
    constructor(
            model: any,
            virtualBackground: IVirtualBackground,
            v2Init?: IV2EffectInit) {
        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');

        this._enableV2 = Boolean(v2Init?.enableV2);

        if (this._enableV2 && v2Init) {
            const { capabilities, vbConfig } = v2Init;

            this._backend = new WorkerSegmentationBackend(capabilities);

            let compositor: ICompositor;
            const webglCanvas = document.createElement('canvas');
            const webglCompositor = new WebGLCompositor(webglCanvas);

            if (webglCompositor.isAvailable) {
                compositor = webglCompositor;
            } else {
                logger.debug('[VirtualBackground] WebGL unavailable — using Canvas 2D fallback');
                compositor = new Canvas2DCompositor();
            }

            this._processor = new BackgroundFrameProcessor({
                backend: this._backend,
                compositor,
                vbConfig,
                virtualBackground
            });

            const useIS = vbConfig?.useInsertableStreams !== false
                && InsertableStreamsPipeline.isSupported();

            // V2 with insertable streams uses the dedicated pipeline. Without IS, _pipeline
            // stays null and startEffect falls back to the shared _setupCaptureStream +
            // _startTimerLoop path, still driving _processor (worker + WebGL) every tick.
            if (useIS) {
                this._pipeline = new InsertableStreamsPipeline();
            }

            logger.debug(
                `[VirtualBackground] V2 effect created — backend: ${this._backend.capabilities.backend}`
                + `, pipeline: ${useIS ? 'insertable-streams' : 'capture-stream'}`
                + `, compositor: ${compositor instanceof WebGLCompositor ? 'webgl' : 'canvas-2d'}`
            );

            return;
        }

        this._options = {
            height: V1_SEG_HEIGHT,
            virtualBackground,
            width: V1_SEG_WIDTH
        };
        this._model = model;
        this._segmentationPixelCount = V1_SEG_WIDTH * V1_SEG_HEIGHT;

        if (virtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE) {
            this._virtualImage = document.createElement('img');
            this._virtualImage.crossOrigin = 'anonymous';
            this._virtualImage.src = virtualBackground.virtualSource ?? '';
        }

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} True if this effect can run on this track.
     */
    isEnabled(jitsiLocalTrack: any) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }

    /**
     * Starts the effect on the given camera stream.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} The stream with the applied effect.
     */
    startEffect(stream: MediaStream) {
        if (this._enableV2 && this._pipeline && this._processor) {
            this.initPromise = this._processor.init();
            this.initPromise.catch(() => undefined);

            return this._pipeline.start(stream, this._processor);
        }

        const captureStream = this._setupCaptureStream(stream);

        if (this._enableV2 && this._processor) {
            this.initPromise = this._processor.init();
            this.initPromise.catch(() => undefined);

            this._startTimerLoop(async () => {
                const result = await this._processor?.processFrame(this._inputVideoElement);

                if (result && this._outputCanvasCtx) {
                    this._outputCanvasCtx.drawImage(result, 0, 0);
                } else if (this._outputCanvasCtx) {
                    this._outputCanvasCtx.drawImage(
                        this._inputVideoElement, 0, 0,
                        this._outputCanvasElement.width, this._outputCanvasElement.height
                    );
                }
            });
        } else {
            this._segmentationMask = new ImageData(this._options.width, this._options.height);
            this._segmentationMaskCanvas = document.createElement('canvas');
            this._segmentationMaskCanvas.width = this._options.width;
            this._segmentationMaskCanvas.height = this._options.height;
            this._segmentationMaskCtx = this._segmentationMaskCanvas.getContext('2d');

            this._startTimerLoop(() => this._renderMask());
        }

        return captureStream;
    }

    /**
     * Stops the frame pipeline. Keeps the V2 processor + backend alive so the next
     * startEffect (e.g. on unmute) can process frames immediately without a re-init
     * window in which raw camera frames would be passed through.
     *
     * @returns {void}
     */
    stopEffect() {
        if (this._enableV2 && this._pipeline) {
            this._pipeline.stop().catch(() => undefined);
        } else {
            this._stopTimerLoop();
            this._inputVideoElement.onloadeddata = null;
            this._inputVideoElement.srcObject = null;
        }
    }

    /**
     * Pre-initialises the V2 backend. No-op for V1 (model is loaded in the factory).
     *
     * @returns {Promise<void>}
     */
    async init(): Promise<void> {
        if (this._processor) {
            await this._processor.init();
        }
    }

    /**
     * Sets up the video element and output canvas for captureStream-based frame processing.
     * Used by both V1 and V2 captureStream paths.
     *
     * @private
     * @param {MediaStream} stream - Camera stream.
     * @returns {MediaStream} The captureStream output.
     */
    _setupCaptureStream(stream: MediaStream): MediaStream {
        this._stream = stream;
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        this._outputCanvasElement.width = parseInt(String(width), 10);
        this._outputCanvasElement.height = parseInt(String(height), 10);
        this._outputCanvasCtx = this._outputCanvasElement.getContext('2d');
        this._inputVideoElement.width = parseInt(String(width), 10);
        this._inputVideoElement.height = parseInt(String(height), 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = stream;

        // autoplay is unreliable for out-of-DOM elements on srcObject reassignment.
        this._inputVideoElement.play().catch(() => undefined);

        return this._outputCanvasElement.captureStream(parseInt(String(frameRate), 10));
    }

    /**
     * Starts a TimerWorker that calls the given callback on each tick. The next tick is
     * scheduled after the callback completes (sequential). Used by both V1 and V2.
     *
     * @private
     * @param {Function} onTick - Callback to invoke on each timer tick.
     * @returns {void}
     */
    _startTimerLoop(onTick: () => void | Promise<void>): void {
        this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'VirtualBackground timer' });
        this._maskFrameTimerWorker.onmessage = (response: MessageEvent) => {
            if (response.data.id === TIMEOUT_TICK) {
                Promise.resolve(onTick()).then(() => {
                    this._maskFrameTimerWorker?.postMessage({
                        id: SET_TIMEOUT,
                        timeMs: 1000 / 30
                    });
                });
            }
        };

        if (this._inputVideoElement.readyState >= 2) {
            this._maskFrameTimerWorker.postMessage({ id: SET_TIMEOUT, timeMs: 1000 / 30 });
        } else {
            this._inputVideoElement.onloadeddata = () => {
                this._maskFrameTimerWorker?.postMessage({ id: SET_TIMEOUT, timeMs: 1000 / 30 });
            };
        }
    }

    /**
     * Stops and terminates the timer worker.
     *
     * @private
     * @returns {void}
     */
    _stopTimerLoop(): void {
        if (this._maskFrameTimerWorker) {
            this._maskFrameTimerWorker.postMessage({ id: CLEAR_TIMEOUT });
            this._maskFrameTimerWorker.terminate();
            this._maskFrameTimerWorker = null;
        }
    }

    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onMaskFrameTimer(response: { data: { id: number; }; }) {
        if (response.data.id === TIMEOUT_TICK) {
            this._renderMask();
        }
    }

    /**
     * Represents the run post processing.
     *
     * @returns {void}
     */
    runPostProcessing() {

        const track = this._stream.getVideoTracks()[0];
        const { height, width } = track.getSettings() ?? track.getConstraints();
        const { backgroundType } = this._options.virtualBackground;

        if (!this._outputCanvasCtx) {
            return;
        }

        this._outputCanvasElement.height = height;
        this._outputCanvasElement.width = width;
        this._outputCanvasCtx.globalCompositeOperation = 'copy';

        // Draw segmentation mask.

        // Smooth out the edges.
        this._outputCanvasCtx.filter = backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE ? 'blur(4px)' : 'blur(8px)';
        this._outputCanvasCtx?.drawImage( // @ts-ignore
            this._segmentationMaskCanvas,
            0,
            0,
            this._options.width,
            this._options.height,
            0,
            0,
            this._inputVideoElement.width,
            this._inputVideoElement.height
        );
        this._outputCanvasCtx.globalCompositeOperation = 'source-in';
        this._outputCanvasCtx.filter = 'none';

        // Draw the foreground video.
        // @ts-ignore
        this._outputCanvasCtx?.drawImage(this._inputVideoElement, 0, 0);

        // Draw the background.
        this._outputCanvasCtx.globalCompositeOperation = 'destination-over';
        if (backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE) {
            this._outputCanvasCtx?.drawImage( // @ts-ignore
                backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE
                    ? this._virtualImage : this._virtualVideo,
                0,
                0,
                this._outputCanvasElement.width,
                this._outputCanvasElement.height
            );
        } else {
            this._outputCanvasCtx.filter = `blur(${this._options.virtualBackground.blurValue}px)`;

            // @ts-ignore
            this._outputCanvasCtx?.drawImage(this._inputVideoElement, 0, 0);
        }
    }

    /**
     * Represents the run Tensorflow Interference.
     *
     * @returns {void}
     */
    runInference() {
        this._model._runInference();
        const outputMemoryOffset = this._model._getOutputMemoryOffset() / 4;

        for (let i = 0; i < this._segmentationPixelCount; i++) {
            const person = this._model.HEAPF32[outputMemoryOffset + i];

            // Sets only the alpha component of each pixel.
            this._segmentationMask.data[(i * 4) + 3] = 255 * person;

        }
        this._segmentationMaskCtx?.putImageData(this._segmentationMask, 0, 0);
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        this.resizeSource();
        this.runInference();
        this.runPostProcessing();
    }

    /**
     * Represents the resize source process.
     *
     * @returns {void}
     */
    resizeSource() {
        this._segmentationMaskCtx?.drawImage( // @ts-ignore
            this._inputVideoElement,
            0,
            0,
            this._inputVideoElement.width,
            this._inputVideoElement.height,
            0,
            0,
            this._options.width,
            this._options.height
        );

        const imageData = this._segmentationMaskCtx?.getImageData(
            0,
            0,
            this._options.width,
            this._options.height
        );
        const inputMemoryOffset = this._model._getInputMemoryOffset() / 4;

        for (let i = 0; i < this._segmentationPixelCount; i++) {
            this._model.HEAPF32[inputMemoryOffset + (i * 3)] = Number(imageData?.data[i * 4]) / 255;
            this._model.HEAPF32[inputMemoryOffset + (i * 3) + 1] = Number(imageData?.data[(i * 4) + 1]) / 255;
            this._model.HEAPF32[inputMemoryOffset + (i * 3) + 2] = Number(imageData?.data[(i * 4) + 2]) / 255;
        }
    }
}
