// @flow

import pixelmatch from 'pixelmatch';

import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    PIXEL_LOWER_BOUND,
    POLL_INTERVAL,
    SET_INTERVAL
} from './constants';

import { getCurrentConference } from '../../base/conference';
import { processScreenshot } from './processScreenshot';
import { timerWorkerScript } from './worker';

declare var interfaceConfig: Object;

/**
 * Effect that wraps {@code MediaStream} adding periodic screenshot captures.
 * Manipulates the original desktop stream and performs custom processing operations, if implemented.
 */
export default class ScreenshotCaptureEffect {
    _state: Object;
    _currentCanvas: HTMLCanvasElement;
    _currentCanvasContext: CanvasRenderingContext2D;
    _videoElement: HTMLVideoElement;
    _handleWorkerAction: Function;
    _initScreenshotCapture: Function;
    _streamWorker: Worker;
    _streamHeight: any;
    _streamWidth: any;
    _storedImageData: Uint8ClampedArray;

    /**
     * Initializes a new {@code ScreenshotCaptureEffect} instance.
     *
     * @param {Object} state - The redux state.
     */
    constructor(state: Object) {
        this._state = state;
        this._currentCanvas = document.createElement('canvas');
        this._currentCanvasContext = this._currentCanvas.getContext('2d');
        this._videoElement = document.createElement('video');

        // Bind handlers such that they access the same instance.
        this._handleWorkerAction = this._handleWorkerAction.bind(this);
        this._initScreenshotCapture = this._initScreenshotCapture.bind(this);
        this._streamWorker = new Worker(timerWorkerScript, { name: 'Screenshot capture worker' });
        this._streamWorker.onmessage = this._handleWorkerAction;
    }

    /**
     * Starts the screenshot capture event on a loop.
     *
     * @param {MediaStream} stream - The desktop stream from which screenshots are to be sent.
     * @param {string} videoType - The type of the media stream.
     * @returns {Promise} - Promise that resolves once effect has started or rejects if the
     * videoType parameter is not desktop.
     */
    startEffect(stream: MediaStream, videoType: string) {
        return new Promise<void>((resolve, reject) => {
            if (videoType !== 'desktop') {
                reject();
            }
            const desktopTrack = stream.getVideoTracks()[0];
            const { height, width }
                = desktopTrack.getSettings() ?? desktopTrack.getConstraints();

            this._streamHeight = height;
            this._streamWidth = width;
            this._currentCanvas.height = parseInt(height, 10);
            this._currentCanvas.width = parseInt(width, 10);
            this._videoElement.height = parseInt(height, 10);
            this._videoElement.width = parseInt(width, 10);
            this._videoElement.srcObject = stream;
            this._videoElement.play();

            // Store first capture for comparisons in {@code this._handleScreenshot}.
            this._videoElement.addEventListener('loadeddata', this._initScreenshotCapture);
            resolve();
        });
    }

    /**
     * Stops the ongoing {@code ScreenshotCaptureEffect} by clearing the {@code Worker} interval.
     *
     * @returns {void}
     */
    stopEffect() {
        this._streamWorker.postMessage({ id: CLEAR_INTERVAL });
        this._videoElement.removeEventListener('loadeddata', this._initScreenshotCapture);
    }

    /**
     * Method that is called as soon as the first frame of the video loads from stream.
     * The method is used to store the {@code ImageData} object from the first frames
     * in order to use it for future comparisons based on which we can process only certain
     * screenshots.
     *
     * @private
     * @returns {void}
     */
    _initScreenshotCapture() {
        const storedCanvas = document.createElement('canvas');
        const storedCanvasContext = storedCanvas.getContext('2d');

        storedCanvasContext.drawImage(this._videoElement, 0, 0, this._streamWidth, this._streamHeight);
        const { data } = storedCanvasContext.getImageData(0, 0, this._streamWidth, this._streamHeight);

        this._storedImageData = data;
        this._streamWorker.postMessage({
            id: SET_INTERVAL,
            timeMs: POLL_INTERVAL
        });
    }

    /**
     * Handler of the {@code EventHandler} message that calls the appropriate method based on the parameter's id.
     *
     * @private
     * @param {EventHandler} message - Message received from the Worker.
     * @returns {void}
     */
    _handleWorkerAction(message: Object) {
        return message.data.id === INTERVAL_TIMEOUT && this._handleScreenshot();
    }

    /**
     * Method that decides whether an image should be processed based on a preset pixel lower bound.
     *
     * @private
     * @param {integer} nbPixels - The number of pixels of the candidate image.
     * @returns {boolean} - Whether the image should be processed or not.
     */
    _shouldProcessScreenshot(nbPixels: number) {
        return nbPixels >= PIXEL_LOWER_BOUND;
    }

    /**
     * Screenshot handler.
     *
     * @private
     * @returns {void}
     */
    _handleScreenshot() {
        this._currentCanvasContext.drawImage(this._videoElement, 0, 0, this._streamWidth, this._streamHeight);
        const { data } = this._currentCanvasContext.getImageData(0, 0, this._streamWidth, this._streamHeight);
        const diffPixels = pixelmatch(data, this._storedImageData, null, this._streamWidth, this._streamHeight);

        if (this._shouldProcessScreenshot(diffPixels)) {
            const conference = getCurrentConference(this._state);
            const sessionId = conference.getMeetingUniqueId();
            const { connection, timeEstablished } = this._state['features/base/connection'];
            const jid = connection.getJid();
            const timeLapseSeconds = timeEstablished && Math.floor((Date.now() - timeEstablished) / 1000);
            const { jwt } = this._state['features/base/jwt'];

            this._storedImageData = data;
            processScreenshot(this._currentCanvas, {
                jid,
                jwt,
                sessionId,
                timeLapseSeconds
            });
        }
    }
}
