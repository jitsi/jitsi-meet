
import { getLogger } from 'jitsi-meet-logger';
import {
    drawBokehEffect,
    load
} from '@tensorflow-models/body-pix';

import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    SET_INTERVAL,
    timerWorkerScript
} from './TimerWorker';

const logger = getLogger(__filename);

/**
 * This promise represents the loading of the BodyPix model that is used
 * to extract person segmentation. A multiplier of 0.25 is used to for
 * improved performance on a larger range of CPUs.
 */
const bpModelPromise = load(0.25);

/**
 * Represents a modified MediaStream that adds blur to video background.
 * <tt>JitsiStreamBlurEffect</tt> does the processing of the original
 * video stream.
 */
class JitsiStreamBlurEffect {

    /**
     *
     * Represents a modified video MediaStream track.
     *
     * @class
     * @param {BodyPix} bpModel - BodyPix model
     */
    constructor(bpModel) {
        this._bpModel = bpModel;

        this._outputCanvasElement = document.createElement('canvas');
        this._maskCanvasElement = document.createElement('canvas');
        this._inputVideoElement = document.createElement('video');

        this._renderVideo = this._renderVideo.bind(this);
        this._renderMask = this._renderMask.bind(this);

        this._videoFrameTimerWorker = new Worker(timerWorkerScript);
        this._maskFrameTimerWorker = new Worker(timerWorkerScript);

        this._onMaskFrameTimer = this._onMaskFrameTimer.bind(this);
        this._onVideoFrameTimer = this._onVideoFrameTimer.bind(this);
        this._videoFrameTimerWorker.onmessage = this._onVideoFrameTimer;
        this._maskFrameTimerWorker.onmessage = this._onMaskFrameTimer;
    }

    /**
     * EventHandler onmessage for the videoFrameTimerWorker WebWorker
     *
     * @private
     * @param {EventHandler} response - onmessage EventHandler parameter
     * @returns {void}
     */
    _onVideoFrameTimer(response) {
        switch (response.data.id) {
        case INTERVAL_TIMEOUT: {
            this._renderVideo();
            break;
        }
        }
    }

    /**
     * EventHandler onmessage for the maskFrameTimerWorker WebWorker
     *
     * @private
     * @param {EventHandler} response - onmessage EventHandler parameter
     * @returns {void}
     */
    _onMaskFrameTimer(response) {
        switch (response.data.id) {
        case INTERVAL_TIMEOUT: {
            this._renderMask();
            break;
        }
        }
    }

    /**
     * Starts loop to capture video frame and render the segmentation mask.
     *
     * @param {MediaStream} stream - Stream to be used for processing
     *
     * @returns {void}
     */
    startEffect(stream) {
        this._stream = stream;

        const firstVideoTrack = this._stream.getVideoTracks()[0];
        const { height, frameRate, width } = firstVideoTrack.getSettings
            ? firstVideoTrack.getSettings() : firstVideoTrack.getConstraints();

        if (!firstVideoTrack.getSettings && !firstVideoTrack.getConstraints) {
            throw new Error('JitsiStreamBlurEffect not supported!');
        }

        this._frameRate = frameRate;
        this._height = height;
        this._width = width;

        this._outputCanvasElement.width = width;
        this._outputCanvasElement.height = height;

        this._maskCanvasElement.width = this._width;
        this._maskCanvasElement.height = this._height;

        this._inputVideoElement.width = width;
        this._inputVideoElement.height = height;

        this._maskCanvasContext = this._maskCanvasElement.getContext('2d');

        this._inputVideoElement.autoplay = true;
        this._inputVideoElement.srcObject = this._stream;

        this._videoFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 1000 / this._frameRate
        });

        this._maskFrameTimerWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: 200
        });
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
     * Get the modified stream.
     *
     * @returns {MediaStream}
     */
    getStreamWithEffect() {
        return this._outputCanvasElement.captureStream(this._frameRate);
    }

    /**
     * Loop function to render the video frame input and draw blur effect.
     *
     * @private
     * @returns {void}
     */
    _renderVideo() {
        if (this._bpModel) {
            this._maskCanvasContext.drawImage(this._inputVideoElement,
                                                0,
                                                0,
                                                this._width,
                                                this._height);

            if (this._segmentationData) {

                drawBokehEffect(this._outputCanvasElement,
                                this._inputVideoElement,
                                this._segmentationData,
                                7, // Constant for background blur, integer values between 0-20
                                7); // Constant for edge blur, integer values between 0-20
            }
        } else {
            this._outputCanvasElement
                .getContext('2d')
                .drawImage(this._inputVideoElement,
                                                0,
                                                0,
                                                this._width,
                                                this._height);
        }
    }

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    _renderMask() {
        if (this._bpModel) {
            this._bpModel.estimatePersonSegmentation(this._maskCanvasElement,
                                                    32, // Chose 32 for better performance
                                                    0.75) // Represents probability that a pixel belongs to a person
                .then(value => {
                    this._segmentationData = value;
                });
        }
    }

    /**
     * Checks if the local track supports this effect.
     *
     * @param {JitsiLocalTrack} jitsiLocalTrack - Track to apply effect
     *
     * @returns {boolean} Returns true if this effect can run on the specified track
     * false otherwise
     */
    isEnabled(jitsiLocalTrack) {
        return jitsiLocalTrack.isVideoTrack();
    }
}

/**
 * Creates a new instance of JitsiStreamBlurEffect.
 *
 * @returns {Promise<JitsiStreamBlurEffect>}
 */
export function createBlurEffect() {
    return bpModelPromise
        .then(bpmodel =>
            Promise.resolve(new JitsiStreamBlurEffect(bpmodel))
        )
        .catch(error => {
            logger.error('Failed to load BodyPix model. Fallback to original stream!', error);
            throw error;
        });
}
