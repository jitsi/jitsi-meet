import { IReduxState } from '../app/types';
import { IJitsiConference } from '../base/conference/reducer';
import { getLocalParticipant } from '../base/participants/functions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';

import { FACE_BOX_EVENT_TYPE, FACE_LANDMARKS_EVENT_TYPE, SEND_IMAGE_INTERVAL_MS } from './constants';
import logger from './logger';
import { FaceBox, FaceLandmarks } from './types';

/**
 * Sends the face landmarks to other participants via the data channel.
 *
 * @param {any} conference - The current conference.
 * @param  {FaceLandmarks} faceLandmarks - Face landmarks to be sent.
 * @returns {void}
 */
export function sendFaceExpressionToParticipants(conference: any, faceLandmarks: FaceLandmarks): void {
    try {
        conference.sendEndpointMessage('', {
            type: FACE_LANDMARKS_EVENT_TYPE,
            faceLandmarks
        });
    } catch (err) {
        logger.warn('Could not broadcast the face landmarks to the other participants', err);
    }

}

/**
 * Sends the face box to all the other participants.
 *
 * @param {any} conference - The current conference.
 * @param  {FaceBox} faceBox - Face box to be sent.
 * @returns {void}
 */
export function sendFaceBoxToParticipants(
        conference: any,
        faceBox: FaceBox
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
 * Sends the face landmarks to prosody.
 *
 * @param {any} conference - The current conference.
 * @param  {FaceLandmarks} faceLandmarks - Face landmarks to be sent.
 * @returns {void}
 */
export function sendFaceExpressionToServer(conference: IJitsiConference | undefined,
        faceLandmarks: FaceLandmarks): void {
    try {
        conference?.sendFaceLandmarks(faceLandmarks);
    } catch (err) {
        logger.warn('Could not send the face landmarks to prosody', err);
    }
}

/**
 * Sends face landmarks to backend.
 *
 * @param  {Object} state - Redux state.
 * @returns {boolean} - True if sent, false otherwise.
 */
export async function sendFaceExpressionsWebhook(state: IReduxState) {
    const { webhookProxyUrl: url } = state['features/base/config'];
    const { conference } = state['features/base/conference'];
    const { jwt } = state['features/base/jwt'];
    const { connection } = state['features/base/connection'];
    const jid = connection?.getJid();
    const localParticipant = getLocalParticipant(state);
    const { faceLandmarksBuffer } = state['features/face-landmarks'];

    if (faceLandmarksBuffer.length === 0) {
        return false;
    }

    const headers = {
        ...jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
        'Content-Type': 'application/json'
    };

    const reqBody = {
        meetingFqn: extractFqnFromPath(),
        sessionId: conference?.getMeetingUniqueId(),
        submitted: Date.now(),
        emotions: faceLandmarksBuffer,
        participantId: localParticipant?.jwtId,
        participantName: localParticipant?.name,
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
 * Gets face box for a participant id.
 *
 * @param {string} id - The participant id.
 * @param {IReduxState} state - The redux state.
 * @returns {Object}
 */
function getFaceBoxForId(id: string, state: IReduxState) {
    return state['features/face-landmarks'].faceBoxes[id];
}

/**
 * Gets the video object position for a participant id.
 *
 * @param {IReduxState} state - The redux state.
 * @param {string} id - The participant id.
 * @returns {string} - CSS object-position in the shape of '{horizontalPercentage}% {verticalPercentage}%'.
 */
export function getVideoObjectPosition(state: IReduxState, id?: string) {
    const faceBox = id && getFaceBoxForId(id, state);

    if (faceBox) {
        const { right, width } = faceBox;

        if (right && width) {
            return `${right - (width / 2)}% 50%`;
        }
    }

    return '50% 50%';
}

/**
 * Gets the video object position for a participant id.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {number} - Number of milliseconds for doing face detection.
 */
export function getDetectionInterval(state: IReduxState) {
    const { faceLandmarks } = state['features/base/config'];

    return Math.max(faceLandmarks?.captureInterval || SEND_IMAGE_INTERVAL_MS);
}
