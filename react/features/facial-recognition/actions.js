// @flow
import { getLocalVideoTrack } from '../base/tracks';

import 'image-capture';
import './createImageBitmap';

import {
    ADD_FACIAL_EXPRESSION,
    SET_FACIAL_RECOGNITION_ALLOWED,
    UPDATE_CAMERA_TIME_TRACKER
} from './actionTypes';
import { sendFacialExpression, detectFacialExpression, sendCameraTimeTrackerUpdate } from './functions';
import logger from './logger';

let intervalTime = -1;
let interval = null;
let imageCapture;
let worker;
let duplicateConsecutiveExpressions = 0;

export let cameraMuted = true;
const outputCanvas = document.createElement('canvas');

/**
 * Loads the worker that predicts the facial expression.
 *
 * @returns {void}
 */
export function loadWorker() {
    return function(dispatch: Function, getState: Function) {
        if (window.Worker) {
            worker = new Worker('libs/facialExpressionWorker.js', { name: 'Facial Expression Worker' });
            worker.onmessage = function(e: Object) {
                const { type, value } = e.data;

                if (type === 'tf-backend' && value) {
                    if (value === 'webgl') {
                        intervalTime = 1000;
                    } else if (value === 'cpu') {
                        intervalTime = 3000;
                    }
                    interval = setInterval(() => detectFacialExpression(worker, imageCapture), intervalTime);
                }

                if (type === 'facial-expression' && value) {
                    const state = getState();
                    const { lastFacialExpression } = state['features/facial-recognition'];

                    if (value === lastFacialExpression) {
                        duplicateConsecutiveExpressions++;
                    } else {
                        console.log('!!!', value);
                        dispatch(addFacialExpression(value, duplicateConsecutiveExpressions + 1));
                        sendFacialExpression(lastFacialExpression, duplicateConsecutiveExpressions + 1);
                        duplicateConsecutiveExpressions = 0;
                    }
                }
            };
        } else {
            logger.debug('Browser does not support web workers');
        }
    };
}

/**
 * Adds a new expression to the store.
 *
 * @param  {string} facialExpression - Facial expression to be added.
 * @param  {number} duration - Duration in seconds of the facial expression.
 * @returns {Object}
 */
export function addFacialExpression(facialExpression: string, duration: number) {
    return {
        type: ADD_FACIAL_EXPRESSION,
        facialExpression,
        duration
    };
}

/**
 * Starts the recognition and detection of face expressions.
 *
 * @param  {Object} stream - Video stream.
 * @returns {Function}
 */
export function startFacialRecognition() {
    return async function(dispatch: Function, getState: Function) {
        if (interval || (worker === undefined || worker === null)) {
            return;
        }


        const state = getState();
        const localVideoTrack = getLocalVideoTrack(state['features/base/tracks']);

        if (localVideoTrack === undefined) {
            return;
        }

        const stream = localVideoTrack.jitsiTrack.getOriginalStream();

        if (stream === null) {
            return;
        }
        logger.log('Start face recognition');

        console.log('START');
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, width } = firstVideoTrack.getSettings() ?? firstVideoTrack.getConstraints();

        // $FlowFixMe
        imageCapture = new ImageCapture(firstVideoTrack);

        outputCanvas.width = parseInt(width, 10);
        outputCanvas.height = parseInt(height, 10);
        if (intervalTime === -1) {
            detectFacialExpression(worker, imageCapture);
        } else {
            interval = setInterval(() => detectFacialExpression(worker, imageCapture), intervalTime);
        }
        try {
            dispatch(updateCameraTimeTracker(false));
        } catch (e) {
            console.error(e);
            cameraMuted = false;
        }
    };
}

/**
 * Stops the recognition and detection of face expressions.
 *
 * @returns {void}
 */
export function stopFacialRecognition() {
    return function(dispatch: Function, getState: Function) {
        if (interval === null) {
            clearInterval(interval);
            imageCapture = null;
            interval = null;

            return;
        }
        console.log('STOP1');
        clearInterval(interval);
        imageCapture = null;
        interval = null;
        const state = getState();
        const { lastFacialExpression } = state['features/facial-recognition'];

        dispatch(addFacialExpression(lastFacialExpression, duplicateConsecutiveExpressions + 1));
        sendFacialExpression(lastFacialExpression, duplicateConsecutiveExpressions + 1);
        duplicateConsecutiveExpressions = 0;
        dispatch(updateCameraTimeTracker(true));
        console.log('STOP2');
        logger.log('Stop face recognition');
    };
}

/**
 * Resets the track in the image capture.
 *
 * @returns {void}
 */
export function resetTrack() {
    return function(dispatch: Function, getState: Function) {
        const state = getState();
        const { jitsiTrack: localVideoTrack } = getLocalVideoTrack(state['features/base/tracks']);
        const stream = localVideoTrack.getOriginalStream();
        const firstVideoTrack = stream.getVideoTracks()[0];

        // $FlowFixMe
        imageCapture = new ImageCapture(firstVideoTrack);

    };
}

/**
 * Changes the track from the image capture.
 *
 * @param  {Object} track - The track that will be in the new image capture.
 * @returns {void}
 */
export function changeTrack(track: Object) {
    const { jitsiTrack } = track;
    const stream = jitsiTrack.getOriginalStream();
    const firstVideoTrack = stream.getVideoTracks()[0];

    // $FlowFixMe
    imageCapture = new ImageCapture(firstVideoTrack);
}

/**
 * Sets the facial recognition allowed.
 *
 * @param  {boolean} allowed - The current state.
 * @returns {Object}
 */
export function setFacialRecognitionAllowed(allowed: boolean) {
    return {
        type: SET_FACIAL_RECOGNITION_ALLOWED,
        payload: allowed
    };
}

/**
 * Sets the camera time tracker on or off.
 *
 * @param  {boolean} muted - The state of the camera.
 * @returns {Object}
 */
export function updateCameraTimeTracker(muted: boolean) {
    const lastCameraUpdate = new Date().getTime();

    sendCameraTimeTrackerUpdate(muted, lastCameraUpdate);

    return {
        type: UPDATE_CAMERA_TIME_TRACKER,
        muted,
        lastCameraUpdate
    };
}
