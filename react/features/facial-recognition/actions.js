// @flow
import { getConferenceTimestamp } from '../base/conference/functions';
import { getLocalVideoTrack } from '../base/tracks';

import 'image-capture';
import './createImageBitmap';

import {
    ADD_FACIAL_EXPRESSION,
    SET_FACIAL_RECOGNITION_ALLOWED,
    SET_TF_BACKEND,
    UPDATE_CAMERA_TIME_TRACKER
} from './actionTypes';
import { sendFacialExpression, detectFacialExpression, sendCameraTimeTrackerUpdate } from './functions';
import logger from './logger';

let intervalTime = -1;
let interval;
let imageCapture;
let worker;
const outputCanvas = document.createElement('canvas');

/**
 * Loads the worker that predicts the facial expression.
 *
 * @returns {void}
 */
export function loadWorker() {
    return function(dispatch: Function) {
        if (window.Worker) {
            worker = new Worker('libs/facialExpressionWorker.js', { name: 'Facial Expression Worker' });
            worker.onmessage = function(e) {
                const { type, value } = e.data;

                if (type === 'tf-backend' && value !== undefined) {
                    if (value === 'webgl') {
                        intervalTime = 1000;
                    } else if (value === 'cpu') {
                        intervalTime = 3000;
                    }
                    interval = setInterval(() => detectFacialExpression(worker, imageCapture), intervalTime);
                }

                if (type === 'facial-expression' && value !== null && value !== undefined) {
                    console.log('!!!', value);
                    dispatch(addFacialExpression(value));
                    sendFacialExpression(value);
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
 * @param  {Object} facialExpression - Facial expression to be added.
 * @returns {Object}
 */
export function addFacialExpression(facialExpression: Object) {
    return {
        type: ADD_FACIAL_EXPRESSION,
        payload: facialExpression
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
        if (interval) {
            return;
        }

        if (worker === undefined || worker === null) {
            return;
        }
        logger.log('Start face recognition');

        const state = getState();
        const localVideoTrack = getLocalVideoTrack(state['features/base/tracks']);

        if (localVideoTrack === undefined) {
            dispatch(stopFacialRecognition());

            return;
        }

        const stream = localVideoTrack.jitsiTrack.getOriginalStream();

        if (stream === null) {
            dispatch(stopFacialRecognition());

            return;
        }
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, width } = firstVideoTrack.getSettings() ?? firstVideoTrack.getConstraints();

        imageCapture = new ImageCapture(firstVideoTrack);

        outputCanvas.width = parseInt(width, 10);
        outputCanvas.height = parseInt(height, 10);
        dispatch(updateCameraTimeTracker(false));

        if (intervalTime === -1) {
            detectFacialExpression(worker, imageCapture);
        } else {
            interval = setInterval(() => detectFacialExpression(worker, imageCapture), intervalTime);
        }
    };
}

/**
 * Stops the recognition and detection of face expressions.
 *
 * @returns {void}
 */
export function stopFacialRecognition() {
    return function(dispatch: Function) {
        if (interval) {
            logger.log('Stop face recognition');
            clearInterval(interval);
            imageCapture = null;
            interval = null;
            dispatch(updateCameraTimeTracker(true));
        }
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
    return function(dispatch: Function, getState: Function) {
        const state = getState();
        const lastCameraUpdate = getConferenceTimestamp(state)
            ? new Date().getTime() - getConferenceTimestamp(state)
            : 0;

        sendCameraTimeTrackerUpdate(muted, lastCameraUpdate);

        return dispatch({
            type: UPDATE_CAMERA_TIME_TRACKER,
            muted,
            lastCameraUpdate
        });
    };
}
