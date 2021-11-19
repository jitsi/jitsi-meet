// @flow
import { getLocalVideoTrack } from '../base/tracks';

import 'image-capture';
import './createImageBitmap';

import {
    ADD_FACIAL_EXPRESSION,
    SET_DETECTION_TIME_INTERVAL,
    START_FACIAL_RECOGNITION,
    STOP_FACIAL_RECOGNITION
} from './actionTypes';
import { sendDataToWorker } from './functions';
import logger from './logger';

/**
 * Time used for detection interval when facial expressions worker uses webgl backend.
 */
const WEBGL_TIME_INTERVAL = 1000;

/**
 * Time used for detection interval when facial expression worker uses cpu backend.
 */
const CPU_TIME_INTERVAL = 6000;

/**
 * Object containing  a image capture of the local track.
 */
let imageCapture;

/**
 * Object where the facial expression worker is stored.
 */
let worker;

/**
 * The last facial expression received from the worker.
 */
let lastFacialExpression;

/**
 * How many duplicate consecutive expression occurred.
 * If a expression that is not the same as the last one it is reset to 0.
 */
let duplicateConsecutiveExpressions = 0;

/**
 * Loads the worker that predicts the facial expression.
 *
 * @returns {void}
 */
export function loadWorker() {
    return function(dispatch: Function) {
        if (!window.Worker) {
            logger.warn('Browser does not support web workers');

            return;
        }
        worker = new Worker('libs/facial-expressions-worker.min.js', { name: 'Facial Expression Worker' });
        worker.onmessage = function(e: Object) {
            const { type, value } = e.data;

            // receives a message indicating what type of backend tfjs decided to use.
            // it is received after as a response to the first message sent to the worker.
            if (type === 'tf-backend' && value) {
                let detectionTimeInterval = -1;

                if (value === 'webgl') {
                    detectionTimeInterval = WEBGL_TIME_INTERVAL;
                } else if (value === 'cpu') {
                    detectionTimeInterval = CPU_TIME_INTERVAL;
                }
                dispatch(setDetectionTimeInterval(detectionTimeInterval));
            }

            // receives a message with the predicted facial expression.
            if (type === 'facial-expression') {
                sendDataToWorker(worker, imageCapture);
                if (!value) {
                    return;
                }
                if (value === lastFacialExpression) {
                    duplicateConsecutiveExpressions++;
                } else {
                    lastFacialExpression
                    && dispatch(addFacialExpression(lastFacialExpression, duplicateConsecutiveExpressions + 1));
                    lastFacialExpression = value;
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
        if (worker === undefined || worker === null) {
            return;
        }
        const state = getState();
        const { recognitionActive } = state['features/facial-recognition'];

        if (recognitionActive) {
            return;
        }
        const localVideoTrack = getLocalVideoTrack(state['features/base/tracks']);

        if (localVideoTrack === undefined) {
            return;
        }
        const stream = localVideoTrack.jitsiTrack.getOriginalStream();

        if (stream === null) {
            return;
        }
        dispatch({ type: START_FACIAL_RECOGNITION });
        logger.log('Start face recognition');
        const firstVideoTrack = stream.getVideoTracks()[0];

        // $FlowFixMe
        imageCapture = new ImageCapture(firstVideoTrack);

        sendDataToWorker(worker, imageCapture);

    };
}

/**
 * Stops the recognition and detection of face expressions.
 *
 * @returns {void}
 */
export function stopFacialRecognition() {
    return function(dispatch: Function, getState: Function) {
        const state = getState();
        const { recognitionActive } = state['features/facial-recognition'];

        if (!recognitionActive) {
            imageCapture = null;

            return;
        }
        imageCapture = null;
        worker.postMessage({
            id: 'CLEAR_TIMEOUT'
        });

        lastFacialExpression
        && dispatch(addFacialExpression(lastFacialExpression, duplicateConsecutiveExpressions + 1));
        duplicateConsecutiveExpressions = 0;
        dispatch({ type: STOP_FACIAL_RECOGNITION });
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
 * Adds a new facial expression and its duration.
 *
 * @param  {string} facialExpression - Facial expression to be added.
 * @param  {number} duration - Duration in seconds of the facial expression.
 * @returns {Object}
 */
function addFacialExpression(facialExpression: string, duration: number) {
    return function(dispatch: Function, getState: Function) {
        const { detectionTimeInterval } = getState()['features/facial-recognition'];
        let finalDuration = duration;

        if (detectionTimeInterval !== -1) {
            finalDuration *= detectionTimeInterval / 1000;
        }
        dispatch({
            type: ADD_FACIAL_EXPRESSION,
            facialExpression,
            duration: finalDuration
        });
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
