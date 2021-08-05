// @flow

import * as faceapi from 'face-api.js';

import { getLocalVideoTrack } from '../base/tracks';

import { SET_FACIAL_RECOGNITION_MODELS_LOADED, ADD_FACIAL_EXPRESSION } from './actionTypes';
import { detectFacialExpression } from './functions';
import logger from './logger';

let interval;
const videoElement = document.createElement('video');
const outputCanvas = document.createElement('canvas');

/**
 * @param  {boolean} loaded
 */
function setFacialRecognitionModelsLoaded(loaded: boolean) {
    return {
        type: SET_FACIAL_RECOGNITION_MODELS_LOADED,
        payload: loaded
    };
}

/**
 * @param  {string} facialExpression
 */
export function addFacialExpression(facialExpression: string) {
    return {
        type: ADD_FACIAL_EXPRESSION,
        payload: facialExpression
    };
}

/**
 */
export function maybeStartFacialRecognition(track) {
    return async function(dispatch: Function, getState: Function) {
        if (interval) {
            return;
        }
        console.log('STAAART');

        const state = getState();
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

        // const { jitsiTrack: localVideoTrack } = getLocalVideoTrack(state['features/base/tracks']);
        const stream = track.getOriginalStream();
        const firstVideoTrack = stream.getVideoTracks()[0];
        const { height, width } = firstVideoTrack.getSettings() ?? firstVideoTrack.getConstraints();

        outputCanvas.width = parseInt(width, 10);
        outputCanvas.height = parseInt(height, 10);

        videoElement.width = parseInt(width, 10);
        videoElement.height = parseInt(height, 10);
        videoElement.autoplay = true;
        videoElement.srcObject = stream;

        videoElement.onloadeddata = () => {
            interval = setInterval(() => detectFacialExpression(dispatch, videoElement, outputCanvas), 5000);
        };
        document.body.append(videoElement);

    };
}
/**
 */
export function stopFacialRecognition() {
    console.log('STOP');
    clearInterval(interval);
    videoElement.onloadeddata = null;
    interval = null;
}

/**
 */
export function resetTrack() {
    return function(dispatch: Function, getState: Function) {
        console.log('RESET');
        videoElement.onloadeddata = null;
        const state = getState();
        const { jitsiTrack: localVideoTrack } = getLocalVideoTrack(state['features/base/tracks']);
        const stream = localVideoTrack.getOriginalStream();

        videoElement.srcObject = stream;
    };
}
