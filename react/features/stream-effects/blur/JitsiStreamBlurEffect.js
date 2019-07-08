
import { drawBokehEffect } from '@tensorflow-models/body-pix';

import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    SET_INTERVAL,
    timerWorkerScript
} from './TimerWorker';

/**
 * Represents a modified MediaStream that adds blur to video background.
 * <tt>JitsiStreamBlurEffect</tt> does the processing of the original
 * video stream.
 */
export default class JitsiStreamBlurEffect {
    /**
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {BodyPix} bpModel - BodyPix model.
     */
    constructor(bpModel) {
        this._bpModel = bpModel;

        // Bind event handler so it is only bound once for every instance.
        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);
        this._onVideoFrameTimer = this._onVideoFrameTimer.bind(this);

        this._outputCanvasElement = document.createElement('canvas');
        this._maskCanvasElement = document.createElement('canvas');
        this._inputVideoElement = document.createElement('video');

        this._videoFrameTimerWorker = new Worker(timerWorkerScript);
        this._maskFrameTimerWorker = new Worker(timerWorkerScript);
        this._videoFrameTimerWorker.onmessage = this._onVideoFrameTimer;
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
    }

    /**
     * EventHandler onmessage for the videoFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onVideoFrameTimer(response) {
        if (response.data.id === INTERVAL_TIMEOUT) {
            this._renderVideo();
        }
    }

    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker.
     *
     * @private
     * @param {EventHandler} response - The onmessage EventHandler parameter.
     * @returns {void}
     */
    _onMaskFrameTimer(response) {
        if (response.data.id === INTERVAL_TIMEOUT) {
            this._renderMask();
        }
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing.
     * @returns {MediaStream} - The stream with the applied effect.
     */
    startEffect(stream) {
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, frameRate, width }
            = firstVideoTrack.getSettings ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        this._frameRate = frameRate;
        this._height = height;
        this._width = width;

        this._outputCanvasElement.width = width;
        this._outputCanvasElement.height = height;

        this._maskCanvasElement.width = width;
        this._maskCanvasElement.height = height;

        this._maskCanvasContext = this._maskCanvasElement.getContext('2d');
        this._inputVideoElement.width = width;
        this._inputVideoElement.height = height;
        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = stream;

        this._videoFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 1000 / this._frameRate
        });
        this._maskFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 200
        });

        return this._outputCanvasElement.captureStream(this._frameRate);
    }

    /**
     * Stops the capture and render loop.
     *
     * @returns {void}
     */
    stopEffect() {
        this._videoFrameTimerWorker.postMessage({
            id: CLEAR_INTERVAL
        });
        this._maskFrameTimerWorker.postMessage({
            id: CLEAR_INTERVAL
        });
    }

    /**
     * Loop function to render the video frame input and draw blur effect.
     *
     * @private
     * @returns {void}
     */
    _renderVideo() {
        this._maskCanvasContext.drawImage(this._inputVideoElement, 0, 0, this._width, this._height);
        if (this._segmentationData) {
            drawBokehEffect(
                this._outputCanvasElement,
                this._inputVideoElement,
                this._segmentationData,
                7, // Constant for background blur, integer values between 0-20
                7 // Constant for edge blur, integer values between 0-20
            );
        }
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        this._bpModel.estimatePersonSegmentation(
            this._maskCanvasElement,
            32, // Chose 32 for better performance
            0.75 // Represents probability that a pixel belongs to a person
        )
        .then(value => {
            this._segmentationData = value;
        });
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect.
     * @returns {boolean} - Returns true if this effect can run on the specified track
     * false otherwise.
     */
    isEnabled(jitsiLocalTrack) {
        return jitsiLocalTrack.isVideoTrack() && jitsiLocalTrack.videoType === 'camera';
    }
}


