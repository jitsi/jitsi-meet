// @flow

import * as faceapi from 'face-api.js';

import { getLocalVideoTrack } from '../base/tracks';

import {
    SET_FACIAL_RECOGNITION_MODELS_LOADED,
    ADD_FACIAL_EXPRESSION,
    SET_FACIAL_RECOGNITION_ALLOWED
} from './actionTypes';
import { changeFacialExpression } from './functions';
import logger from './logger';

let interval;
let imageCapture;
const outputCanvas = document.createElement('canvas');

/**
 * Sets the state of the models for the face api.
 *
 * @param  {boolean} loaded - The state of the models.
 * @returns {Object}
 */
function setFacialRecognitionModelsLoaded(loaded: boolean) {
    return {
        type: SET_FACIAL_RECOGNITION_MODELS_LOADED,
        payload: loaded
    };
}

/**
 * Adds a new expression to the store.
 *
 * @param  {string} facialExpression - Facial expression to be added.
 * @returns {Object}
 */
export function addFacialExpression(facialExpression: string) {
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
export function maybeStartFacialRecognition() {
    return async function(dispatch: Function, getState: Function) {
        if (interval) {
            return;
        }
        console.log('START');

        const state = getState();
        const localVideoTrack = getLocalVideoTrack(state['features/base/tracks']);

        if (localVideoTrack === undefined) {
            stopFacialRecognition();

            return;
        }

        const stream = localVideoTrack.jitsiTrack.getOriginalStream();

        if (stream === null) {
            stopFacialRecognition();

            return;
        }

        const { facialRecognitionModelsLoaded } = state['features/facial-recognition'];

        if (!facialRecognitionModelsLoaded) {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri('/libs');
                await faceapi.nets.faceExpressionNet.loadFromUri('/libs');

                dispatch(setFacialRecognitionModelsLoaded(true));
            } catch {
                logger.debug('Failed to load faceapi nets, unable to start facial recognition');
                dispatch(setFacialRecognitionModelsLoaded(false));
            }
        }
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, width } = firstVideoTrack.getSettings() ?? firstVideoTrack.getConstraints();

        imageCapture = new ImageCapture(firstVideoTrack);

        outputCanvas.width = parseInt(width, 10);
        outputCanvas.height = parseInt(height, 10);
        interval = setInterval(() => dispatch(testDetectFacialExpression()), 1000);

    };
}

/**
 * Stops the recognition and detection of face expressions.
 *
 * @returns {void}
 */
export function stopFacialRecognition() {
    if (interval) {
        console.log('STOP');
        clearInterval(interval);
        imageCapture = null;
        interval = null;
    }
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
 * Detects facial expression.
 *
 * @returns {Function}
 */
export function testDetectFacialExpression() {
    return async function(dispatch: Function, getState: Function) {
        const outputCanvasContext = outputCanvas.getContext('2d');
        let imageBitmap;

        try {
            imageBitmap = await imageCapture.grabFrame();
        } catch (err) {
            return;
        }

        outputCanvasContext.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height);
        const detections = await faceapi.detectSingleFace(
            outputCanvas,
            new faceapi.TinyFaceDetectorOptions()
        ).withFaceExpressions();

        // $FlowFixMe - Flow does not (yet) support method calls in optional chains.
        const facialExpression = detections?.expressions.asSortedArray()[0].expression;
        const state = getState();
        const lastExpression = state['features/facial-recognition'].lastFacialExpression;

        if (facialExpression !== undefined && facialExpression !== lastExpression) {
            console.log('!!!', facialExpression);
            dispatch(addFacialExpression(facialExpression));
            changeFacialExpression(facialExpression);
        }
    };

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
