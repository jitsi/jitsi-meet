// @flow
import 'image-capture';
import './createImageBitmap';

import { getCurrentConference } from '../base/conference';
import { getLocalParticipant, getParticipantCount } from '../base/participants';
import { getLocalVideoTrack } from '../base/tracks';
import { getBaseUrl } from '../base/util';

import {
    ADD_FACIAL_EXPRESSION,
    ADD_TO_FACIAL_EXPRESSIONS_BUFFER,
    CLEAR_FACIAL_EXPRESSIONS_BUFFER,
    START_FACIAL_RECOGNITION,
    STOP_FACIAL_RECOGNITION,
    UPDATE_FACE_COORDINATES
} from './actionTypes';
import {
    DETECTION_TYPES,
    INIT_WORKER,
    WEBHOOK_SEND_TIME_INTERVAL
} from './constants';
import {
    getDetectionInterval,
    sendDataToWorker,
    sendFaceBoxToParticipants,
    sendFacialExpressionsWebhook
} from './functions';
import logger from './logger';

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
 * The last facial expression timestamp.
 */
let lastFacialExpressionTimestamp;

/**
 * How many duplicate consecutive expression occurred.
 * If a expression that is not the same as the last one it is reset to 0.
 */
let duplicateConsecutiveExpressions = 0;

/**
 * Variable that keeps the interval for sending expressions to webhook.
 */
let webhookSendInterval;

/**
 * Variable that keeps the interval for detecting faces in a frame.
 */
let detectionInterval;

/**
 * Loads the worker that predicts the facial expression.
 *
 * @returns {void}
 */
export function loadWorker() {
    return function(dispatch: Function, getState: Function) {
        if (worker) {
            logger.info('Worker has already been initialized');

            return;
        }

        if (navigator.product === 'ReactNative') {
            logger.warn('Unsupported environment for face recognition');

            return;
        }

        const baseUrl = `${getBaseUrl()}libs/`;
        let workerUrl = `${baseUrl}facial-expressions-worker.min.js`;

        const workerBlob = new Blob([ `importScripts("${workerUrl}");` ], { type: 'application/javascript' });

        workerUrl = window.URL.createObjectURL(workerBlob);
        worker = new Worker(workerUrl, { name: 'Face Recognition Worker' });
        worker.onmessage = function(e: Object) {
            const { faceExpression, faceBox } = e.data;

            if (faceExpression) {
                if (faceExpression === lastFacialExpression) {
                    duplicateConsecutiveExpressions++;
                } else {
                    if (lastFacialExpression && lastFacialExpressionTimestamp) {
                        dispatch(addFacialExpression(
                            lastFacialExpression,
                            duplicateConsecutiveExpressions + 1,
                            lastFacialExpressionTimestamp
                        ));
                    }
                    lastFacialExpression = faceExpression;
                    lastFacialExpressionTimestamp = Date.now();
                    duplicateConsecutiveExpressions = 0;
                }
            }

            if (faceBox) {
                const state = getState();
                const conference = getCurrentConference(state);
                const localParticipant = getLocalParticipant(state);

                if (getParticipantCount(state) > 1) {
                    sendFaceBoxToParticipants(conference, faceBox);
                }

                dispatch({
                    type: UPDATE_FACE_COORDINATES,
                    faceBox,
                    id: localParticipant.id
                });
            }
        };

        const { enableFacialRecognition, faceCoordinatesSharing } = getState()['features/base/config'];
        const detectionTypes = [
            faceCoordinatesSharing?.enabled && DETECTION_TYPES.FACE_BOX,
            enableFacialRecognition && DETECTION_TYPES.FACE_EXPRESSIONS
        ].filter(Boolean);

        worker.postMessage({
            type: INIT_WORKER,
            baseUrl,
            detectionTypes
        });

        dispatch(startFacialRecognition());
    };
}

/**
 * Starts the recognition and detection of face expressions.
 *
 * @param {Track | undefined} track - Track for which to start detecting faces.
 * @returns {Function}
 */
export function startFacialRecognition(track) {
    return async function(dispatch: Function, getState: Function) {
        if (!worker) {
            return;
        }

        const state = getState();
        const { recognitionActive } = state['features/facial-recognition'];

        if (recognitionActive) {
            logger.log('Face recognition already active.');

            return;
        }

        const localVideoTrack = track || getLocalVideoTrack(state['features/base/tracks']);

        if (localVideoTrack === undefined) {
            logger.warn('Facial recognition is disabled due to missing local track.');

            return;
        }

        const stream = localVideoTrack.jitsiTrack.getOriginalStream();

        dispatch({ type: START_FACIAL_RECOGNITION });
        logger.log('Start face recognition');

        const firstVideoTrack = stream.getVideoTracks()[0];
        const { enableFacialRecognition, faceCoordinatesSharing } = state['features/base/config'];

        imageCapture = new ImageCapture(firstVideoTrack);

        detectionInterval = setInterval(() => {
            sendDataToWorker(
                worker,
                imageCapture,
                faceCoordinatesSharing?.threshold
            );
        }, getDetectionInterval(state));

        if (enableFacialRecognition) {
            webhookSendInterval = setInterval(async () => {
                const result = await sendFacialExpressionsWebhook(getState());

                if (result) {
                    dispatch(clearFacialExpressionBuffer());
                }
            }, WEBHOOK_SEND_TIME_INTERVAL);
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
        if (lastFacialExpression && lastFacialExpressionTimestamp) {
            dispatch(
                addFacialExpression(
                    lastFacialExpression,
                    duplicateConsecutiveExpressions + 1,
                    lastFacialExpressionTimestamp
                )
            );
        }

        clearInterval(webhookSendInterval);
        clearInterval(detectionInterval);

        duplicateConsecutiveExpressions = 0;
        webhookSendInterval = null;
        detectionInterval = null;
        imageCapture = null;

        dispatch({ type: STOP_FACIAL_RECOGNITION });
        logger.log('Stop face recognition');
    };
}

/**
 * Adds a new facial expression and its duration.
 *
 * @param  {string} facialExpression - Facial expression to be added.
 * @param  {number} duration - Duration in seconds of the facial expression.
 * @param  {number} timestamp - Duration in seconds of the facial expression.
 * @returns {Object}
 */
function addFacialExpression(facialExpression: string, duration: number, timestamp: number) {
    return function(dispatch: Function, getState: Function) {
        const finalDuration = duration * getDetectionInterval(getState()) / 1000;

        dispatch({
            type: ADD_FACIAL_EXPRESSION,
            facialExpression,
            duration: finalDuration,
            timestamp
        });
    };
}

/**
 * Adds a facial expression with its timestamp to the facial expression buffer.
 *
 * @param  {Object} facialExpression - Object containing facial expression string and its timestamp.
 * @returns {Object}
 */
export function addToFacialExpressionsBuffer(facialExpression: Object) {
    return {
        type: ADD_TO_FACIAL_EXPRESSIONS_BUFFER,
        facialExpression
    };
}

/**
 * Clears the facial expressions array in the state.
 *
 * @returns {Object}
 */
function clearFacialExpressionBuffer() {
    return {
        type: CLEAR_FACIAL_EXPRESSIONS_BUFFER
    };
}
