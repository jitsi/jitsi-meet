import { VIRTUAL_BACKGROUND_TYPE } from '../../virtual-background/constants';

import {
    CLEAR_TIMEOUT,
    SET_TIMEOUT,
    TIMEOUT_TICK,
    timerWorkerScript
} from './TimerWorker';

export interface IBackgroundEffectOptions {
    height: number;
    virtualBackground: {
        backgroundType?: string;
        blurValue?: number;
        virtualSource?: string;
    };
    width: number;
}

/**
 * Represents a modified MediaStream that adds visual effects to the video background.
 * JitsiStreamBackgroundEffect performs real-time processing of the original video stream
 * using TensorFlow.js for segmentation and Canvas API for rendering.
 *
 * It supports high-performance frame scheduling using the requestVideoFrameCallback (RVFC) API
 * with a reliable WebWorker-based setTimeout fallback for browsers that don't support RVFC.
 */
export default class JitsiStreamBackgroundEffect {
    _model: any;
    _options: IBackgroundEffectOptions;
    _stream: any;
    _segmentationPixelCount: number;
    _inputVideoElement: HTMLVideoElement;
    _maskFrameTimerWorker: Worker;
    _outputCanvasElement: HTMLCanvasElement;
    _outputCanvasCtx: CanvasRenderingContext2D | null;
    _segmentationMaskCtx: CanvasRenderingContext2D | null;
    _segmentationMask: ImageData;
    _segmentationMaskCanvas: HTMLCanvasElement;
    _virtualImage: HTMLImageElement;
    _virtualVideo: HTMLVideoElement;

    /**
     * Feature flag indicating if the browser supports and is currently using
     * the requestVideoFrameCallback API for frame scheduling.
     */
    _isUsingRVFC: boolean;

    /**
     * Optional callback ID for the requestVideoFrameCallback API,
     * used for cleanup when stopping the effect.
     */
    _frameCallbackId?: number;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {Object} model - Pre-loaded TensorFlow.js segmentation model.
     * @param {Object} options - Configuration for segmentation dimensions and effect type.
     */
    constructor(model: Object, options: IBackgroundEffectOptions) {
        this._options = options;

        if (this._options.virtualBackground.backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE) {
            this._virtualImage = document.createElement('img');
            this._virtualImage.crossOrigin = 'anonymous';
            this._virtualImage.src = this._options.virtualBackground.virtualSource ?? '';
        }
        this._model = model;
        this._segmentationPixelCount = this._options.width * this._options.height;

        // Bind event handlers to ensure correct 'this' context in callbacks.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);
        this._renderMask = this._renderMask.bind(this);

        // Workaround for Firefox issue where canvas context needs to be initialized
        // before being used in a worker or as a capture stream source.
        // https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');
    }

    /**
     * EventHandler for the maskFrameTimerWorker WebWorker.
     * This provides a consistent 30fps heartbeat for legacy browsers where
     * requestVideoFrameCallback is not available.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onMaskFrameTimer(response: { data: { id: number; }; }) {
        if (response.data.id === TIMEOUT_TICK && !this._isUsingRVFC) {
            this._renderMask();

            // Schedule the next tick to maintain the frame loop.
            this._maskFrameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: 1000 / 30 // Target 30fps baseline
            });
        }
    }

    /**
     * Performs post-processing on the segmentation mask, combining the foreground
     * video with the selected background (image or blur) using Canvas composite operations.
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

        // Set output dimensions to match the source video track.
        this._outputCanvasElement.height = height;
        this._outputCanvasElement.width = width;
        this._outputCanvasCtx.globalCompositeOperation = 'copy';

        // 1. Draw the segmentation mask onto the main canvas.
        // We apply a slight blur to the mask edges for smoother transitions between user and background.
        this._outputCanvasCtx.filter = backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE ? 'blur(4px)' : 'blur(8px)';
        this._outputCanvasCtx?.drawImage(
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

        // 2. Prepare to draw the foreground video inside the mask.
        this._outputCanvasCtx.globalCompositeOperation = 'source-in';
        this._outputCanvasCtx.filter = 'none';

        // @ts-ignore
        this._outputCanvasCtx?.drawImage(this._inputVideoElement, 0, 0);

        // 3. Draw the background effect (image or blur) behind the masked user.
        this._outputCanvasCtx.globalCompositeOperation = 'destination-over';
        if (backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE) {
            this._outputCanvasCtx?.drawImage(
                backgroundType === VIRTUAL_BACKGROUND_TYPE.IMAGE
                    ? this._virtualImage : this._virtualVideo,
                0,
                0,
                this._outputCanvasElement.width,
                this._outputCanvasElement.height
            );
        } else {
            this._outputCanvasCtx.filter = `blur(${this._options.virtualBackground.blurValue}px)`;

            // Gaussian blur is applied to the original video frame to create the "blur background" effect.
            // @ts-ignore
            this._outputCanvasCtx?.drawImage(this._inputVideoElement, 0, 0);
        }
    }

    /**
     * Executes the segmentation model inference and updates the internal mask data.
     * Maps the model's float32 output to the alpha channel of the segmentation mask.
     *
     * @returns {void}
     */
    runInference() {
        this._model._runInference();
        const outputMemoryOffset = this._model._getOutputMemoryOffset() / 4;

        for (let i = 0; i < this._segmentationPixelCount; i++) {
            const person = this._model.HEAPF32[outputMemoryOffset + i];

            // Mapping model confidence (0-1) to alpha transparency (0-255).
            // This allows for semi-transparent edge blending.
            this._segmentationMask.data[(i * 4) + 3] = 255 * person;
        }
        this._segmentationMaskCtx?.putImageData(this._segmentationMask, 0, 0);
    }

    /**
     * Recursive rendering loop. Orchestrates resizing, inference, and post-processing.
     * When RVFC is active, this function is perfectly synchronized with the browser's
     * compositing rate, resulting in significantly lower CPU and GPU overhead compared to setTimeout.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        this.resizeSource();
        this.runInference();
        this.runPostProcessing();

        if (this._isUsingRVFC) {
            // Re-schedule via RVFC for the next available frame.
            // RVFC guarantees that the callback fires exactly when a new frame is ready for display.
            // @ts-ignore
            this._frameCallbackId = this._inputVideoElement.requestVideoFrameCallback(this._renderMask);
        }
    }

    /**
     * Prepares the input frame for the segmentation model by resizing it and 
     * normalizing pixel values into the model's shared memory buffer.
     *
     * @returns {void}
     */
    resizeSource() {
        // Draw input frame to a small hidden canvas used for model input.
        this._segmentationMaskCtx?.drawImage(
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

        // Normalizing 0-255 values to 0.0-1.0 floats for the engine.
        for (let i = 0; i < this._segmentationPixelCount; i++) {
            this._model.HEAPF32[inputMemoryOffset + (i * 3)] = Number(imageData?.data[i * 4]) / 255;
            this._model.HEAPF32[inputMemoryOffset + (i * 3) + 1] = Number(imageData?.data[(i * 4) + 1]) / 255;
            this._model.HEAPF32[inputMemoryOffset + (i * 3) + 2] = Number(imageData?.data[(i * 4) + 2]) / 255;
        }
    }

    /**
     * Checks if the local track supports the virtual background effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to check.
     * @returns {boolean} - True if it's a camera video track.
     */
    isEnabled(jitsiLocalTrack: any) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }

    /**
     * Initializes the background effect pipeline and starts the frame processing loop.
     *
     * @param {MediaStream} stream - Source video stream from the camera.
     * @returns {MediaStream} - The processed output stream ready for use in Jitsi.
     */
    startEffect(stream: MediaStream) {
        this._stream = stream;

        // Initialize a WebWorker for robust scheduling fallback in legacy browsers.
        this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Blur effect worker' });
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
        
        const firstVideoTrack = this._stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        // Canvas setup for intermediate segmentation and final compositing.
        this._segmentationMask = new ImageData(this._options.width, this._options.height);
        this._segmentationMaskCanvas = document.createElement('canvas');
        this._segmentationMaskCanvas.width = this._options.width;
        this._segmentationMaskCanvas.height = this._options.height;
        this._segmentationMaskCtx = this._segmentationMaskCanvas.getContext('2d');

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
        this._outputCanvasCtx = this._outputCanvasElement.getContext('2d');

        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = this._stream;

        this._inputVideoElement.onloadeddata = () => {
            // Determine if the client browser supports the modern requestVideoFrameCallback API.
            // RVFC is superior because it provides accurate video presentation timestamps and
            // eliminates redundant processing of frames that won't be displayed.
            this._isUsingRVFC = 'requestVideoFrameCallback' in HTMLVideoElement.prototype;

            if (this._isUsingRVFC) {
                // @ts-ignore
                this._frameCallbackId = this._inputVideoElement.requestVideoFrameCallback(this._renderMask);
            } else {
                // Fallback: Start the manual heartbeat through the WebWorker.
                this._maskFrameTimerWorker.postMessage({
                    id: SET_TIMEOUT,
                    timeMs: 1000 / 30
                });
            }
        };

        // Capture local stream for transmission at the original track's framerate.
        // This stream will be used as the new video source for the Jitsi meeting.
        return this._outputCanvasElement.captureStream(parseInt(frameRate, 10));
    }

    /**
     * Properly tears down the effect pipeline, stopping loops and terminating workers
     * to prevent memory leaks or background CPU usage.
     *
     * @returns {void}
     */
    stopEffect() {
        if (this._frameCallbackId !== undefined && 'cancelVideoFrameCallback' in HTMLVideoElement.prototype) {
            // Stop the RVFC loop if active.
            // @ts-ignore
            this._inputVideoElement.cancelVideoFrameCallback(this._frameCallbackId);
        }

        // Clean up the fallback WebWorker logic.
        this._maskFrameTimerWorker.postMessage({
            id: CLEAR_TIMEOUT
        });

        this._maskFrameTimerWorker.terminate();
    }
}
