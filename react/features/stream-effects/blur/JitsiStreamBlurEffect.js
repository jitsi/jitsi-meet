// @flow

import * as StackBlur from 'stackblur-canvas';

import {
    CLEAR_TIMEOUT,
    TIMEOUT_TICK,
    SET_TIMEOUT,
    timerWorkerScript
} from './TimerWorker';

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

    /**
     * Loop function to render the background mask.
     *
     * @private
     * @returns {void}
     */
    async _renderMask() {
        if (!this._maskInProgress) {
            this._maskInProgress = true;
            this._bpModel.segmentPerson(this._inputVideoElement, {
                internalResolution: 'low', // resized to 0.5 times of the original resolution before inference
                maxDetections: 1, // max. number of person poses to detect per image
                segmentationThreshold: 0.7, // represents probability that a pixel belongs to a person
                flipHorizontal: false,
                scoreThreshold: 0.2
            }).then(data => {
                this._segmentationData = data;
                this._maskInProgress = false;
            });
        }
        const inputCanvasCtx = this._inputVideoCanvasElement.getContext('2d');

        inputCanvasCtx.drawImage(this._inputVideoElement, 0, 0);

        const currentFrame = inputCanvasCtx.getImageData(
            0,
            0,
            this._inputVideoCanvasElement.width,
            this._inputVideoCanvasElement.height
        );

        if (this._segmentationData) {
            const blurData = new ImageData(currentFrame.data.slice(), currentFrame.width, currentFrame.height);

            StackBlur.imageDataRGB(blurData, 0, 0, currentFrame.width, currentFrame.height, 12);

            for (let x = 0; x < this._outputCanvasElement.width; x++) {
                for (let y = 0; y < this._outputCanvasElement.height; y++) {
                    const n = (y * this._outputCanvasElement.width) + x;

                    if (this._segmentationData.data[n] === 0) {
                        currentFrame.data[n * 4] = blurData.data[n * 4];
                        currentFrame.data[(n * 4) + 1] = blurData.data[(n * 4) + 1];
                        currentFrame.data[(n * 4) + 2] = blurData.data[(n * 4) + 2];
                        currentFrame.data[(n * 4) + 3] = blurData.data[(n * 4) + 3];
                    }
                }
            }
        }
        this._outputCanvasElement.getContext('2d').putImageData(currentFrame, 0, 0);
        this._maskFrameTimerWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: 1000 / 30
        });
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

        this._outputCanvasElement.width = parseInt(width, 10);
        this._outputCanvasElement.height = parseInt(height, 10);
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
