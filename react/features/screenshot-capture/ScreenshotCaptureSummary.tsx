import 'image-capture';
import './createImageBitmap';

import { createScreensharingCaptureTakenEvent } from '../analytics/AnalyticsEvents';
import { sendAnalytics } from '../analytics/functions';
import { IReduxState } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getRemoteParticipants } from '../base/participants/functions';
import { getBaseUrl } from '../base/util/helpers';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';

import {
    CLEAR_TIMEOUT,
    POLL_INTERVAL,
    SCREENSHOT_QUEUE_LIMIT,
    SET_TIMEOUT,
    TIMEOUT_TICK
} from './constants';
import logger from './logger';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { processScreenshot } from './processScreenshot';

declare let ImageCapture: any;

/**
 * Effect that wraps {@code MediaStream} adding periodic screenshot captures.
 * Manipulates the original desktop stream and performs custom processing operations, if implemented.
 */
export default class ScreenshotCaptureSummary {
    _state: IReduxState;
    _initializedRegion: boolean;
    _imageCapture: ImageCapture;
    _streamWorker: Worker;
    _queue: Blob[];

    /**
     * Initializes a new {@code ScreenshotCaptureEffect} instance.
     *
     * @param {Object} state - The redux state.
     */
    constructor(state: IReduxState) {
        this._state = state;

        // Bind handlers such that they access the same instance.
        this._handleWorkerAction = this._handleWorkerAction.bind(this);
        const baseUrl = `${getBaseUrl()}libs/`;

        let workerUrl = `${baseUrl}screenshot-capture-worker.min.js`;

        // @ts-ignore
        const workerBlob = new Blob([ `importScripts("${workerUrl}");` ], { type: 'application/javascript' });

        // @ts-ignore
        workerUrl = window.URL.createObjectURL(workerBlob);
        this._streamWorker = new Worker(workerUrl, { name: 'Screenshot capture worker' });
        this._streamWorker.onmessage = this._handleWorkerAction;

        this._initializedRegion = false;
        this._queue = [];
    }

    /**
     * Make a call to backend for region selection.
     *
     * @returns {void}
     */
    async _initRegionSelection() {
        const { _screenshotHistoryRegionUrl } = this._state['features/base/config'];
        const conference = getCurrentConference(this._state);
        const sessionId = conference?.getMeetingUniqueId();
        const { jwt } = this._state['features/base/jwt'];

        if (!_screenshotHistoryRegionUrl) {
            return;
        }

        const headers = {
            ...jwt && { 'Authorization': `Bearer ${jwt}` }
        };

        try {
            await fetch(`${_screenshotHistoryRegionUrl}/${sessionId}`, {
                method: 'POST',
                headers
            });
        } catch (err) {
            logger.warn(`Could not create screenshot region: ${err}`);

            return;
        }


        this._initializedRegion = true;
    }

    /**
     * Starts the screenshot capture event on a loop.
     *
     * @param {JitsiTrack} jitsiTrack - The track that contains the stream from which screenshots are to be sent.
     * @returns {Promise} - Promise that resolves once effect has started or rejects if the
     * videoType parameter is not desktop.
     */
    async start(jitsiTrack: any) {
        if (!window.OffscreenCanvas) {
            logger.warn('Can\'t start screenshot capture, OffscreenCanvas is not available');

            return;
        }
        const { videoType, track } = jitsiTrack;

        if (videoType !== 'desktop') {
            return;
        }
        this._imageCapture = new ImageCapture(track);

        if (!this._initializedRegion) {
            await this._initRegionSelection();
        }
        this.sendTimeout();
    }

    /**
     * Stops the ongoing {@code ScreenshotCaptureEffect} by clearing the {@code Worker} interval.
     *
     * @returns {void}
     */
    stop() {
        this._streamWorker.postMessage({ id: CLEAR_TIMEOUT });
    }

    /**
     * Sends to worker the imageBitmap for the next timeout.
     *
     * @returns {Promise<void>}
     */
    async sendTimeout() {
        let imageBitmap: ImageBitmap | undefined;

        if (!this._imageCapture.track || this._imageCapture.track.readyState !== 'live') {
            logger.warn('Track is in invalid state');
            this.stop();

            return;
        }

        try {
            imageBitmap = await this._imageCapture.grabFrame();
        } catch (e) {
            // ignore error
        }

        this._streamWorker.postMessage({
            id: SET_TIMEOUT,
            timeMs: POLL_INTERVAL,
            imageBitmap
        });
    }

    /**
     * Handler of the {@code EventHandler} message that calls the appropriate method based on the parameter's id.
     *
     * @private
     * @param {EventHandler} message - Message received from the Worker.
     * @returns {void}
     */
    _handleWorkerAction(message: { data: { id: number; imageBlob?: Blob; }; }) {
        const { id, imageBlob } = message.data;

        this.sendTimeout();
        if (id === TIMEOUT_TICK && imageBlob && this._queue.length < SCREENSHOT_QUEUE_LIMIT) {
            this._doProcessScreenshot(imageBlob);
        }
    }

    /**
     * Method that processes the screenshot.
     *
     * @private
     * @param {Blob} imageBlob - The blob for the current screenshot.
     * @returns {void}
     */
    _doProcessScreenshot(imageBlob: Blob) {
        this._queue.push(imageBlob);
        sendAnalytics(createScreensharingCaptureTakenEvent());

        const conference = getCurrentConference(this._state);
        const sessionId = conference?.getMeetingUniqueId();
        const { connection } = this._state['features/base/connection'];
        const jid = connection?.getJid();
        const timestamp = Date.now();
        const { jwt } = this._state['features/base/jwt'];
        const meetingFqn = extractFqnFromPath();
        const remoteParticipants = getRemoteParticipants(this._state);
        const participants: Array<string | undefined> = [];

        participants.push(getLocalParticipant(this._state)?.id);
        remoteParticipants.forEach(p => participants.push(p.id));

        processScreenshot(imageBlob, {
            jid,
            jwt,
            sessionId,
            timestamp,
            meetingFqn,
            participants
        }).then(() => {
            const index = this._queue.indexOf(imageBlob);

            if (index > -1) {
                this._queue.splice(index, 1);
            }
        });
    }
}
