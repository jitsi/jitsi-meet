// @flow
import { getLocalParticipant } from '../base/participants';
import { extractFqnFromPath } from '../dynamic-branding';

import { DETECT_FACE, FACE_BOX_EVENT_TYPE, SEND_IMAGE_INTERVAL_MS } from './constants';
import logger from './logger';

let canvas;
let context;

if (typeof OffscreenCanvas === 'undefined') {
    canvas = document.createElement('canvas');
    context = canvas.getContext('2d');
}

/**
 * Sends the facial expression with its duration to all the other participants.
 *
 * @param {Object} conference - The current conference.
 * @param  {string} facialExpression - Facial expression to be sent.
 * @param {number} duration - The duration of the facial expression in seconds.
 * @returns {void}
 */
export function sendFacialExpressionToParticipants(
        conference: Object,
        facialExpression: string,
        duration: number
): void {
    try {
        conference.sendEndpointMessage('', {
            type: 'facial_expression',
            facialExpression,
            duration
        });
    } catch (err) {
        logger.warn('Could not broadcast the facial expression to the other participants', err);
    }

}

/**
 * Sends the face box to all the other participants.
 *
 * @param {Object} conference - The current conference.
 * @param  {Object} faceBox - Face box to be sent.
 * @returns {void}
 */
export function sendFaceBoxToParticipants(
        conference: Object,
        faceBox: Object
): void {
    try {
        conference.sendEndpointMessage('', {
            type: FACE_BOX_EVENT_TYPE,
            faceBox
        });
    } catch (err) {
        logger.warn('Could not broadcast the face box to the other participants', err);
    }
}

/**
 * Sends the facial expression with its duration to xmpp server.
 *
 * @param {Object} conference - The current conference.
 * @param  {string} facialExpression - Facial expression to be sent.
 * @param {number} duration - The duration of the facial expression in seconds.
 * @returns {void}
 */
export function sendFacialExpressionToServer(
        conference: Object,
        facialExpression: string,
        duration: number
): void {
    try {
        conference.sendFacialExpression({
            facialExpression,
            duration
        });
    } catch (err) {
        logger.warn('Could not send the facial expression to xmpp server', err);
    }
}

/**
 * Sends facial expression to backend.
 *
 * @param  {Object} state - Redux state.
 * @returns {boolean} - True if sent, false otherwise.
 */
export async function sendFacialExpressionsWebhook(state: Object) {
    const { webhookProxyUrl: url } = state['features/base/config'];
    const { conference } = state['features/base/conference'];
    const { jwt } = state['features/base/jwt'];
    const { connection } = state['features/base/connection'];
    const jid = connection.getJid();
    const localParticipant = getLocalParticipant(state);
    const { facialExpressionsBuffer } = state['features/facial-recognition'];

    if (facialExpressionsBuffer.length === 0) {
        return false;
    }

    const headers = {
        ...jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
        'Content-Type': 'application/json'
    };

    const reqBody = {
        meetingFqn: extractFqnFromPath(),
        sessionId: conference.sessionId,
        submitted: Date.now(),
        emotions: facialExpressionsBuffer,
        participantId: localParticipant.jwtId,
        participantName: localParticipant.name,
        participantJid: jid
    };

    if (url) {
        try {
            const res = await fetch(`${url}/emotions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(reqBody)
            });

            if (res.ok) {
                return true;
            }
            logger.error('Status error:', res.status);
        } catch (err) {
            logger.error('Could not send request', err);
        }
    }

    return false;
}


/**
 * Sends the image data a canvas from the track in the image capture to the face recognition worker.
 *
 * @param {Worker} worker - Face recognition worker.
 * @param {Object} imageCapture - Image capture that contains the current track.
 * @param {number} threshold - Movement threshold as percentage for sharing face coordinates.
 * @returns {Promise<void>}
 */
export async function sendDataToWorker(
        worker: Worker,
        imageCapture: Object,
        threshold: number = 10
): Promise<void> {
    if (imageCapture === null || imageCapture === undefined) {
        return;
    }

    let imageBitmap;
    let image;

    try {
        imageBitmap = await imageCapture.grabFrame();
    } catch (err) {
        logger.warn(err);

        return;
    }

    if (typeof OffscreenCanvas === 'undefined') {
        canvas.width = imageBitmap.width;
        canvas.height = imageBitmap.height;
        context.drawImage(imageBitmap, 0, 0);

        image = context.getImageData(0, 0, imageBitmap.width, imageBitmap.height);
    } else {
        image = imageBitmap;
    }

    worker.postMessage({
        type: DETECT_FACE,
        image,
        threshold
    });

    imageBitmap.close();
}

/**
 * Gets face box for a participant id.
 *
 * @param {string} id - The participant id.
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function getFaceBoxForId(id: string, state: Object) {
    return state['features/facial-recognition'].faceBoxes[id];
}

/**
 * Gets the video object position for a participant id.
 *
 * @param {Object} state - The redux state.
 * @param {string} id - The participant id.
 * @returns {string} - CSS object-position in the shape of '{horizontalPercentage}% {verticalPercentage}%'.
 */
export function getVideoObjectPosition(state: Object, id: string) {
    const faceBox = getFaceBoxForId(id, state);

    if (faceBox) {
        const { right, width } = faceBox;

        return `${right - (width / 2)}% 50%`;
    }

    return '50% 50%';
}

/**
 * Gets the video object position for a participant id.
 *
 * @param {Object} state - The redux state.
 * @returns {number} - Number of miliseconds for doing face detection.
 */
export function getDetectionInterval(state: Object) {
    const { faceCoordinatesSharing } = state['features/base/config'];

    return Math.min(faceCoordinatesSharing?.captureInterval || SEND_IMAGE_INTERVAL_MS);
}
