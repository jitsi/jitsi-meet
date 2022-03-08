import 'image-capture';

import { getCurrentConference } from '../base/conference';
import { getLocalParticipant, getParticipantCount } from '../base/participants';
import { getLocalVideoTrack } from '../base/tracks';
import { getBaseUrl } from '../base/util';
import '../facial-recognition/createImageBitmap';

import {
    START_FACE_RECOGNITION,
    STOP_FACE_RECOGNITION,
    UPDATE_FACE_COORDINATES
} from './actionTypes';
import {
    FACE_BOX_MESSAGE,
    SEND_IMAGE_INTERVAL_MS
} from './constants';
import { sendDataToWorker, sendFaceBoxToParticipants } from './functions';
import logger from './logger';

/**
 * Interval object for sending new image data to worker.
 */
let interval;

/**
 * Object containing  a image capture of the local track.
 */
let imageCapture;

/**
 * Object where the face centering worker is stored.
 */
let worker;

/**
 * Loads the worker.
 *
 * @returns {Function}
 */
export function loadWorker() {
    return async function(dispatch: Function, getState: Function) {
        if (navigator.product === 'ReactNative') {
            logger.warn('Unsupported environment for face centering');

            return;
        }

        const baseUrl = getBaseUrl();
        let workerUrl = `${baseUrl}libs/face-centering-worker.min.js`;

        const workerBlob = new Blob([ `importScripts("${workerUrl}");` ], { type: 'application/javascript' });

        workerUrl = window.URL.createObjectURL(workerBlob);
        worker = new Worker(workerUrl, { name: 'Face Centering Worker' });
        worker.onmessage = function(e: Object) {
            const { type, value } = e.data;

            // receives a message with the face(s) bounding box.
            if (type === FACE_BOX_MESSAGE) {
                const state = getState();
                const conference = getCurrentConference(state);
                const localParticipant = getLocalParticipant(state);

                if (getParticipantCount(state) > 1) {
                    sendFaceBoxToParticipants(conference, value);
                }

                dispatch({
                    type: UPDATE_FACE_COORDINATES,
                    faceBox: value,
                    id: localParticipant.id
                });
            }
        };

        dispatch(startFaceRecognition());
    };
}

/**
 * Starts the recognition and detection of face position.
 *
 * @param {Track | undefined} track - Track for which to start detecting faces.
 *
 * @returns {Function}
 */
export function startFaceRecognition(track) {
    return async function(dispatch: Function, getState: Function) {
        if (!worker) {
            return;
        }
        const state = getState();
        const { recognitionActive } = state['features/face-centering'];

        if (recognitionActive) {
            logger.log('Face centering already active.');

            return;
        }

        const localVideoTrack = track || getLocalVideoTrack(state['features/base/tracks']);

        if (!localVideoTrack) {
            logger.warn('Face centering is disabled due to missing local track.');

            return;
        }

        dispatch({ type: START_FACE_RECOGNITION });
        logger.log('Start face recognition');

        const stream = localVideoTrack.jitsiTrack.getOriginalStream();
        const firstVideoTrack = stream.getVideoTracks()[0];

        imageCapture = new ImageCapture(firstVideoTrack);
        const { disableLocalVideoFlip, faceCoordinatesSharing } = state['features/base/config'];

        interval = setInterval(() => {
            sendDataToWorker(worker, imageCapture, faceCoordinatesSharing?.threshold, !disableLocalVideoFlip);
        }, faceCoordinatesSharing?.captureInterval || SEND_IMAGE_INTERVAL_MS);
    };
}

/**
 * Stops the recognition and detection of face position.
 *
 * @returns {Function}
 */
export function stopFaceRecognition() {
    return function(dispatch: Function) {
        clearInterval(interval);
        interval = null;
        imageCapture = null;

        dispatch({ type: STOP_FACE_RECOGNITION });
        logger.log('Stop face recognition');
    };
}
