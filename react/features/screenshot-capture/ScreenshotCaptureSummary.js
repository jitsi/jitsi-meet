// @flow

import resemble from 'resemblejs';
import 'image-capture';
import './createImageBitmap';

import { createScreensharingCaptureTakenEvent, sendAnalytics } from '../analytics';
import { getCurrentConference } from '../base/conference';
import { extractFqnFromPath } from '../dynamic-branding';

import {
    CLEAR_INTERVAL,
    INTERVAL_TIMEOUT,
    PERCENTAGE_LOWER_BOUND,
    POLL_INTERVAL,
    SET_INTERVAL
} from './constants';
import { processScreenshot } from './processScreenshot';
import { timerWorkerScript } from './worker';

declare var interfaceConfig: Object;
declare var ImageCapture: any;

/**
 * Effect that wraps {@code MediaStream} adding periodic screenshot captures.
 * Manipulates the original desktop stream and performs custom processing operations, if implemented.
 */
export default class ScreenshotCaptureSummary {
    _state: Object;
    _currentCanvas: HTMLCanvasElement;
    _currentCanvasContext: CanvasRenderingContext2D;
    _handleWorkerAction: Function;
    _initScreenshotCapture: Function;
    _imageCapture: any;
    _streamWorker: Worker;
    _streamHeight: any;
    _streamWidth: any;
    _storedImageData: ImageData;

    /**
     * Initializes a new {@code ScreenshotCaptureEffect} instance.
     *
     * @param {Object} state - The redux state.
     */
    constructor(state: Object) {
        this._state = state;
        this._currentCanvas = document.createElement('canvas');
        this._currentCanvasContext = this._currentCanvas.getContext('2d');

        // Bind handlers such that they access the same instance.
        this._handleWorkerAction = this._handleWorkerAction.bind(this);
        this._initScreenshotCapture = this._initScreenshotCapture.bind(this);
        this._streamWorker = new Worker(timerWorkerScript, { name: 'Screenshot capture worker' });
        this._streamWorker.onmessage = this._handleWorkerAction;
    }

    /**
     * Starts the screenshot capture event on a loop.
     *
     * @param {Track} track - The track that contains the stream from which screenshots are to be sent.
     * @returns {Promise} - Promise that resolves once effect has started or rejects if the
     * videoType parameter is not desktop.
     */
    start(track: Object) {
        const { videoType } = track;
        const stream = track.getOriginalStream();

        if (videoType !== 'desktop') {
            return;
        }
        const desktopTrack = stream.getVideoTracks()[0];
        const { height, width }
            = desktopTrack.getSettings() ?? desktopTrack.getConstraints();

        this._streamHeight = height;
        this._streamWidth = width;
        this._currentCanvas.height = parseInt(height, 10);
        this._currentCanvas.width = parseInt(width, 10);
        this._imageCapture = new ImageCapture(desktopTrack);

        this._initScreenshotCapture();
    }

    /**
     * Stops the ongoing {@code ScreenshotCaptureEffect} by clearing the {@code Worker} interval.
     *
     * @returns {void}
     */
    stop() {
        this._streamWorker.postMessage({ id: CLEAR_INTERVAL });
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
    async _initScreenshotCapture() {
        const imageBitmap = await this._imageCapture.grabFrame();

        this._currentCanvasContext.drawImage(imageBitmap, 0, 0, this._streamWidth, this._streamHeight);
        const imageData = this._currentCanvasContext.getImageData(0, 0, this._streamWidth, this._streamHeight);

        this._storedImageData = imageData;
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
     * Method that processes the screenshot.
     *
     * @private
     * @param {ImageData} imageData - The image data of the new screenshot.
     * @returns {void}
     */
    _doProcessScreenshot(imageData) {
        sendAnalytics(createScreensharingCaptureTakenEvent());

        const conference = getCurrentConference(this._state);
        const sessionId = conference.getMeetingUniqueId();
        const { connection } = this._state['features/base/connection'];
        const jid = connection.getJid();
        const timestamp = Date.now();
        const { jwt } = this._state['features/base/jwt'];
        const meetingFqn = extractFqnFromPath();

        this._storedImageData = imageData;

        processScreenshot(this._currentCanvas, {
            jid,
            jwt,
            sessionId,
            timestamp,
            meetingFqn
        });
    }

    /**
     * Screenshot handler.
     *
     * @private
     * @returns {void}
     */
    async _handleScreenshot() {
        const imageBitmap = await this._imageCapture.grabFrame();

        this._currentCanvasContext.drawImage(imageBitmap, 0, 0, this._streamWidth, this._streamHeight);
        const imageData = this._currentCanvasContext.getImageData(0, 0, this._streamWidth, this._streamHeight);

        resemble(imageData)
            .compareTo(this._storedImageData)
            .setReturnEarlyThreshold(PERCENTAGE_LOWER_BOUND)
            .onComplete(resultData => {
                if (resultData.rawMisMatchPercentage > PERCENTAGE_LOWER_BOUND) {
                    this._doProcessScreenshot(imageData);
                }
            });
    }
}
