/* eslint-disable lines-around-comment */
import './createImageBitmap';
// @ts-ignore
import { getCurrentConference } from '../base/conference/functions';
import { getLocalParticipant, getParticipantCount } from '../base/participants/functions';
// @ts-ignore
import { getLocalVideoTrack } from '../base/tracks/functions';
import { getBaseUrl } from '../base/util/helpers';

import {
    ADD_FACE_EXPRESSION,
    ADD_TO_FACE_EXPRESSIONS_BUFFER,
    CLEAR_FACE_EXPRESSIONS_BUFFER,
    START_FACE_LANDMARKS_DETECTION,
    STOP_FACE_LANDMARKS_DETECTION,
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
    sendFaceExpressionsWebhook
} from './functions';
import logger from './logger';

declare const APP: any;

/**
 * Object containing  a image capture of the local track.
 */
let imageCapture: ImageCapture | null = null;

/**
 * Object where the face landmarks worker is stored.
 */
let worker: Worker | null = null;

/**
 * The last face expression received from the worker.
 */
let lastFaceExpression: string | null = null;

/**
 * The last face expression timestamp.
 */
let lastFaceExpressionTimestamp: number | null = null;

/**
 * How many duplicate consecutive expression occurred.
 * If a expression that is not the same as the last one it is reset to 0.
 */
let duplicateConsecutiveExpressions = 0;

/**
 * Variable that keeps the interval for sending expressions to webhook.
 */
let webhookSendInterval: number | null = null;

/**
 * Variable that keeps the interval for detecting faces in a frame.
 */
let detectionInterval: number | null = null;

/**
 * Loads the worker that detects the face landmarks.
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
        let workerUrl = `${baseUrl}face-landmarks-worker.min.js`;

        const workerBlob = new Blob([ `importScripts("${workerUrl}");` ], { type: 'application/javascript' });

        workerUrl = window.URL.createObjectURL(workerBlob);
        worker = new Worker(workerUrl, { name: 'Face Recognition Worker' });
        worker.onmessage = function({ data }: MessageEvent<any>) {
            const { faceExpression, faceBox } = data;

            if (faceExpression) {
                if (faceExpression === lastFaceExpression) {
                    duplicateConsecutiveExpressions++;
                } else {
                    if (lastFaceExpression && lastFaceExpressionTimestamp) {
                        dispatch(addFaceExpression(
                            lastFaceExpression,
                            duplicateConsecutiveExpressions + 1,
                            lastFaceExpressionTimestamp
                        ));
                    }
                    lastFaceExpression = faceExpression;
                    lastFaceExpressionTimestamp = Date.now();
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

            APP.API.notifyFaceLandmarkDetected(faceBox, faceExpression);
        };

        const { faceLandmarks } = getState()['features/base/config'];
        const detectionTypes = [
            faceLandmarks?.enableFaceCentering && DETECTION_TYPES.FACE_BOX,
            faceLandmarks?.enableFaceExpressionsDetection && DETECTION_TYPES.FACE_EXPRESSIONS
        ].filter(Boolean);

        worker.postMessage({
            type: INIT_WORKER,
            baseUrl,
            detectionTypes
        });

        dispatch(startFaceLandmarksDetection());
    };
}

/**
 * Starts the recognition and detection of face expressions.
 *
 * @param {Track | undefined} track - Track for which to start detecting faces.
 * @returns {Function}
 */
export function startFaceLandmarksDetection(track?: any) {
    return async function(dispatch: Function, getState: Function) {
        if (!worker) {
            return;
        }

        const state = getState();
        const { recognitionActive } = state['features/face-landmarks'];

        if (recognitionActive) {
            logger.log('Face recognition already active.');

            return;
        }

        const localVideoTrack = track || getLocalVideoTrack(state['features/base/tracks']);

        if (localVideoTrack === undefined) {
            logger.warn('Face landmarks detection is disabled due to missing local track.');

            return;
        }

        const stream = localVideoTrack.jitsiTrack.getOriginalStream();

        dispatch({ type: START_FACE_LANDMARKS_DETECTION });
        logger.log('Start face recognition');

        const firstVideoTrack = stream.getVideoTracks()[0];
        const { faceLandmarks } = state['features/base/config'];

        imageCapture = new ImageCapture(firstVideoTrack);

        detectionInterval = window.setInterval(() => {

            if (worker && imageCapture) {
                sendDataToWorker(
                    worker,
                    imageCapture,
                    faceLandmarks?.faceCenteringThreshold
                ).then(status => {
                    if (!status) {
                        dispatch(stopFaceLandmarksDetection());
                    }
                });
            }
        }, getDetectionInterval(state));

        if (faceLandmarks?.enableFaceExpressionsDetection) {
            webhookSendInterval = window.setInterval(async () => {
                const result = await sendFaceExpressionsWebhook(getState());

                if (result) {
                    dispatch(clearFaceExpressionBuffer());
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
export function stopFaceLandmarksDetection() {
    return function(dispatch: Function, getState: Function) {
        const { recognitionActive } = getState()['features/face-landmarks'];

        if (!recognitionActive) {
            return;
        }

        if (lastFaceExpression && lastFaceExpressionTimestamp) {
            dispatch(
                addFaceExpression(
                    lastFaceExpression,
                    duplicateConsecutiveExpressions + 1,
                    lastFaceExpressionTimestamp
                )
            );
            duplicateConsecutiveExpressions = 0;
            lastFaceExpression = null;
            lastFaceExpressionTimestamp = null;
        }


        webhookSendInterval && window.clearInterval(webhookSendInterval);
        detectionInterval && window.clearInterval(detectionInterval);
        webhookSendInterval = null;
        detectionInterval = null;
        imageCapture = null;

        dispatch({ type: STOP_FACE_LANDMARKS_DETECTION });
        logger.log('Stop face recognition');
    };
}

/**
 * Adds a new face expression and its duration.
 *
 * @param  {string} faceExpression - Face expression to be added.
 * @param  {number} duration - Duration in seconds of the face expression.
 * @param  {number} timestamp - Duration in seconds of the face expression.
 * @returns {Object}
 */
function addFaceExpression(faceExpression: string, duration: number, timestamp: number) {
    return function(dispatch: Function, getState: Function) {
        const finalDuration = duration * getDetectionInterval(getState()) / 1000;

        dispatch({
            type: ADD_FACE_EXPRESSION,
            faceExpression,
            duration: finalDuration,
            timestamp
        });
    };
}

/**
 * Adds a face expression with its timestamp to the face expression buffer.
 *
 * @param  {Object} faceExpression - Object containing face expression string and its timestamp.
 * @returns {Object}
 */
export function addToFaceExpressionsBuffer(faceExpression: Object) {
    return {
        type: ADD_TO_FACE_EXPRESSIONS_BUFFER,
        faceExpression
    };
}

/**
 * Clears the face expressions array in the state.
 *
 * @returns {Object}
 */
function clearFaceExpressionBuffer() {
    return {
        type: CLEAR_FACE_EXPRESSIONS_BUFFER
    };
}
