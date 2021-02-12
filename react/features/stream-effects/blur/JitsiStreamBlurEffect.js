// @flow
import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';

const segmentationWidth = 160;
const segmentationHeight = 96;
const _segmentationPixelCount = segmentationWidth * segmentationHeight;
/**
 * Represents a modified MediaStream that adds blur to video background.
 * <tt>JitsiStreamBlurEffect</tt> does the processing of the original
 * video stream.
 */

export default class JitsiStreamBlurEffect {
    _bpModel: Object;
    _inputVideoElement: HTMLVideoElement;
    _inputVideoCanvasElement: HTMLCanvasElement;
    _onMaskFrameTimer: Function;
    _maskFrameTimerWorker: Worker;
    _maskInProgress: boolean;
    _outputCanvasElement: HTMLCanvasElement;
    _renderMask: Function;
    _segmentationData: Object;
    isEnabled: Function;
    startEffect: Function;
    stopEffect: Function;

    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {BodyPix} bpModel - BodyPix model.
     */
    constructor(bpModel: Object) {
        this._bpModel = bpModel;
        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);

        // Workaround for FF issue https://bugzilla.mozilla.org/show_bug.cgi?id=1388974
        this._outputCanvasElement = document.createElement('canvas');
        this._outputCanvasElement.getContext('2d');
        this._inputVideoElement = document.createElement('video');
        this._inputVideoCanvasElement = document.createElement('canvas');
    }


    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    async _onMaskFrameTimer(response: Object) {
       if (response.data.id === TIMEOUT_TICK) {
            await this._renderMask();
       }
    }


    runPostProcessing() {

        this._outputCanvasCtx.globalCompositeOperation = 'copy'

        //draw segmentation mask
        this._outputCanvasCtx.filter = 'blur(25px)' // FIXME Does not work on Safari
        this._outputCanvasCtx.drawImage(
            this._segmentationMaskCanvas,
            0,
            0,
            segmentationWidth,
            segmentationHeight,
            0,
            0,
            this._inputVideoElement.width,
            this._inputVideoElement.height
        )

        this._outputCanvasCtx.globalCompositeOperation = 'source-in'
        this._outputCanvasCtx.filter = 'none'
        this._outputCanvasCtx.drawImage(this._inputVideoElement, 0, 0)

        this._outputCanvasCtx.globalCompositeOperation = 'destination-over'
        this._outputCanvasCtx.filter = 'blur(25px)' // FIXME Does not work on Safari
        this._outputCanvasCtx.drawImage(this._inputVideoElement, 0, 0)

    }

    runTFLiteInference() {
        this._bpModel._runInference()
        const outputMemoryOffset = this._bpModel._getOutputMemoryOffset() / 4

        for (let i = 0; i < _segmentationPixelCount; i++) {
            const background = this._bpModel.HEAPF32[outputMemoryOffset + i * 2]
            const person = this._bpModel.HEAPF32[outputMemoryOffset + i * 2 + 1]
            const shift = Math.max(background, person)
            const backgroundExp = Math.exp(background - shift)
            const personExp = Math.exp(person - shift)

            // Sets only the alpha component of each pixel
            this._segmentationMask.data[i * 4 + 3] =
                (255 * personExp) / (backgroundExp + personExp) // softmax
        }
        this._segmentationMaskCtx.putImageData(this._segmentationMask, 0, 0)
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */

    _renderMask() {
        this.resizeSource()
        this.runTFLiteInference();
        this.runPostProcessing();

        this._maskFrameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 30
        });
    }

    resizeSource() {
        this._segmentationMaskCtx.drawImage(
            this._inputVideoElement,
            0,
            0,
            this._inputVideoElement.width,
            this._inputVideoElement.height,
            0,
            0,
            segmentationWidth,
            segmentationHeight
        )

        const imageData = this._segmentationMaskCtx.getImageData(
            0,
            0,
            segmentationWidth,
            segmentationHeight
        )
        const inputMemoryOffset = this._bpModel._getInputMemoryOffset() / 4
        for (let i = 0; i < _segmentationPixelCount; i++) {
            this._bpModel.HEAPF32[inputMemoryOffset + i * 3] = imageData.data[i * 4] / 255
            this._bpModel.HEAPF32[inputMemoryOffset + i * 3 + 1] =
                imageData.data[i * 4 + 1] / 255
            this._bpModel.HEAPF32[inputMemoryOffset + i * 3 + 2] =
                imageData.data[i * 4 + 2] / 255
        }
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
    isEnabled(jitsiLocalTrack: Object) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream: MediaStream) {
        this._maskFrameTimerWorker = new Worker(timerWorkerScript, { name: 'Blur effect worker' });
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();
        this._segmentationMask = new ImageData(segmentationWidth, segmentationHeight);
        this._segmentationMaskCanvas = document.createElement('canvas');
        this._segmentationMaskCanvas.width = segmentationWidth;
        this._segmentationMaskCanvas.height = segmentationHeight;
        this._segmentationMaskCtx = this._segmentationMaskCanvas.getContext('2d');
        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
        this._outputCanvasCtx = this._outputCanvasElement.getContext('2d')
        this._inputVideoCanvasElement.width = parseInt(width, 10);
        this._inputVideoCanvasElement.height = parseInt(height, 10);
        this._inputVideoElement.width = parseInt(width, 10);
        this._inputVideoElement.height = parseInt(height, 10);
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = stream;
        this._inputVideoElement.onloadeddata = () => {
            this._maskFrameTimerWorker.postMessage({
                id: SET_TIMEOUT,
                timeMs: 1000 / 30
            });
        };
        //final output
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
