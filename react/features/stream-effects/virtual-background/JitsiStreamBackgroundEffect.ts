import { VIRTUAL_BACKGROUND_TYPE } from '../../virtual-background/constants';
import logger from '../../virtual-background/logger';


import {
    CLEAR_TIMEOUT,
    SET_TIMEOUT,
    TIMEOUT_TICK,
    timerWorkerScript
} from './TimerWorker';

export interface IBackgroundEffectOptions {
    height: number;
    measurePerformance?: boolean;
    virtualBackground: {
        backgroundType?: string;
        blurValue?: number;
        virtualSource?: string;
    };
    width: number;
}

/**
 * Represents a modified MediaStream that adds effects to video background.
 * <tt>JitsiStreamBackgroundEffect</tt> does the processing of the original
 * video stream.
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

    // Performance metrics used for evaluating TFLite model performance against newer models
    // Tracks the total time taken for inferences across a batch of frames
    _inferenceTimeSum: number;
    // Tracks the total time taken for post processing across a batch of frames
    _postProcessingTimeSum: number;
    // Tracks the number of frames processed in the current interval
    _frameCount: number;
    // Timestamp (in ms) of the last reported logging event
    _lastReportTime: number;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {Object} model - Meet model.
     * @param {Object} options - Segmentation dimensions.
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

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d', { willReadFrequently: true });
        this._inputVideoElement = document.createElement('video');

        // Initialize performance metric tracking variables for the effect
        this._inferenceTimeSum = 0;
        this._postProcessingTimeSum = 0;
        this._frameCount = 0;
        this._lastReportTime = performance.now();
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

        if (this._outputCanvasElement.height !== height) {
            this._outputCanvasElement.height = height;
        }
        if (this._outputCanvasElement.width !== width) {
            this._outputCanvasElement.width = width;
        }
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

        if (this._options.measurePerformance) {
            const inferenceStart = performance.now();

            this.runInference();
            const inferenceEnd = performance.now();

            this._inferenceTimeSum += (inferenceEnd - inferenceStart);

            const postProcessingStart = performance.now();

            this.runPostProcessing();
            const postProcessingEnd = performance.now();

            this._postProcessingTimeSum += (postProcessingEnd - postProcessingStart);

            this._frameCount++;

            if (this._frameCount >= 30) {
                const now = performance.now();
                const elapsedMs = now - this._lastReportTime;

                const fps = (this._frameCount / elapsedMs) * 1000;
                const avgInference = this._inferenceTimeSum / this._frameCount;
                const avgPostProcessing = this._postProcessingTimeSum / this._frameCount;

                logger.debug(
                    `[VB] Avg inference: ${avgInference.toFixed(2)} ms, `
                    + `Avg post-processing: ${avgPostProcessing.toFixed(2)} ms | FPS: ${fps.toFixed(1)}`
                );

                this._inferenceTimeSum = 0;
                this._postProcessingTimeSum = 0;
                this._frameCount = 0;
                this._lastReportTime = now;
            }
        } else {
            this.runInference();
            this.runPostProcessing();
        }

        this._maskFrameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 30
        });
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

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
    isEnabled(jitsiLocalTrack: any) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream: MediaStream) {
        this._stream = stream;
        this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Blur effect worker' });
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
        const firstVideoTrack = this._stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        this._segmentationMask = new ImageData(this._options.width, this._options.height);
        this._segmentationMaskCanvas = document.createElement('canvas');
        this._segmentationMaskCanvas.width = this._options.width;
        this._segmentationMaskCanvas.height = this._options.height;
        this._segmentationMaskCtx = this._segmentationMaskCanvas.getContext('2d', { willReadFrequently: true });

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
        this._outputCanvasCtx = this._outputCanvasElement.getContext('2d', { willReadFrequently: true });
        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = this._stream;
        this._inputVideoElement.onloadeddata = () => {
            this._lastReportTime = performance.now();
            this._maskFrameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: 1000 / 30
            });
        };

        return this._outputCanvasElement.captureStream(parseInt(frameRate, 10));
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this._maskFrameTimerWorker.postMessage({
            id: CLEAR_TIMEOUT
        });

        this._maskFrameTimerWorker.terminate();
    }
}
