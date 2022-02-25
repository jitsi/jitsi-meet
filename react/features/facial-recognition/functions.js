// @flow
import { getLocalParticipant } from '../base/participants';
import { extractFqnFromPath } from '../dynamic-branding';

import { SET_TIMEOUT } from './constants';
import logger from './logger';

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
 * Sends the image data a canvas from the track in the image capture to the facial expression worker.
 *
 * @param {Worker} worker - Facial expression worker.
 * @param {Object} imageCapture - Image capture that contains the current track.
 * @returns {Promise<void>}
 */
export async function sendDataToWorker(
        worker: Worker,
        imageCapture: Object
): Promise<void> {
    if (imageCapture === null || imageCapture === undefined) {
        return;
    }
    let imageBitmap;

    try {
        imageBitmap = await imageCapture.grabFrame();
    } catch (err) {
        logger.warn(err);

        return;
    }

    worker.postMessage({
        type: SET_TIMEOUT,
        imageBitmap
    });
}
