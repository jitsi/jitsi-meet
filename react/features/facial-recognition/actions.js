// @flow
import { getLocalVideoTrack } from '../base/tracks';

import 'image-capture';
import './createImageBitmap';

import {
    ADD_FACIAL_EXPRESSION,
    SET_FACIAL_RECOGNITION_ALLOWED,
    SET_DETECTION_TIME_INTERVAL,
    UPDATE_CAMERA_TIME_TRACKER
} from './actionTypes';
import { sendFacialExpression, sendDataToWorker } from './functions';
import logger from './logger';

let interval = null;
let imageCapture;
let worker;
let duplicateConsecutiveExpressions = 0;
const outputCanvas = document.createElement('canvas');

/**
 * Loads the worker that predicts the facial expression.
 *
 * @returns {void}
 */
export function loadWorker() {
    return function(dispatch: Function, getState: Function) {
        if (!window.Worker) {
            logger.debug('Browser does not support web workers');

            return;
        }
        worker = new Worker('libs/facialExpressionWorker.js', { name: 'Facial Expression Worker' });
        worker.onmessage = function(e: Object) {
            const { type, value } = e.data;

            // receives a message indicating what type of backend tfjs decided to use.
            // it is received after as a response to the first message sent to the worker.
            if (type === 'tf-backend' && value) {
                let detectionTimeInterval = -1;

                if (value === 'webgl') {
                    detectionTimeInterval = 1000;
                } else if (value === 'cpu') {
                    detectionTimeInterval = 3000;
                }
                dispatch(setDetectionTimeInterval(detectionTimeInterval));
                interval = setInterval(() => sendDataToWorker(worker, imageCapture), detectionTimeInterval);
            }

            // receives a message with the predicted facial expression.
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
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, width } = firstVideoTrack.getSettings() ?? firstVideoTrack.getConstraints();

        // $FlowFixMe
        imageCapture = new ImageCapture(firstVideoTrack);
        outputCanvas.width = parseInt(width, 10);
        outputCanvas.height = parseInt(height, 10);
        const { detectionTimeInterval } = state['features/facial-recognition'];
        const facialRecognitionModelsLoaded = detectionTimeInterval !== -1;

        if (facialRecognitionModelsLoaded) {
            interval = setInterval(() => sendDataToWorker(worker, imageCapture), detectionTimeInterval);
        } else {
            sendDataToWorker(worker, imageCapture);
        }

        dispatch(updateCameraTimeTracker(false));

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
        clearInterval(interval);
        imageCapture = null;
        interval = null;
        const state = getState();
        const { lastFacialExpression } = state['features/facial-recognition'];

        dispatch(updateCameraTimeTracker(true));
        dispatch(addFacialExpression(lastFacialExpression, duplicateConsecutiveExpressions + 1));
        sendFacialExpression(lastFacialExpression, duplicateConsecutiveExpressions + 1);
        duplicateConsecutiveExpressions = 0;
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
 * Changes the track from the image capture with a given one.
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
 * Sets if the facial recognition is allowed or not.
 *
 * @param  {boolean} allowed - The current state.
 * @returns {Object}
 */
export function setFacialRecognitionAllowed(allowed: boolean) {
    return {
        type: SET_FACIAL_RECOGNITION_ALLOWED,
        allowed
    };
}

/**
 * Adds a new expression to the store.
 *
 * @param  {string} facialExpression - Facial expression to be added.
 * @param  {number} duration - Duration in seconds of the facial expression.
 * @returns {Object}
 */
function addFacialExpression(facialExpression: string, duration: number) {
    return {
        type: ADD_FACIAL_EXPRESSION,
        facialExpression,
        duration
    };
}

/**
 * Sets the time interval for the detection worker post message.
 *
 * @param  {number} time - The time interval.
 * @returns {Object}
 */
function setDetectionTimeInterval(time: number) {
    return {
        type: SET_DETECTION_TIME_INTERVAL,
        time
    };
}

/**
 * Updates the camera time tracker with the current state of the camera.
 *
 * @param  {boolean} muted - The state of the camera.
 * @returns {Object}
 */
function updateCameraTimeTracker(muted: boolean) {
    return {
        type: UPDATE_CAMERA_TIME_TRACKER,
        muted,
        lastCameraUpdate: new Date().getTime()
    };
}
