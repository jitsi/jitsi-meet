import { IReduxState } from '../app/types';
import { isVpaasMeeting } from '../jaas/functions';

import logger from './logger';

/**
 * Sends feedback metadata to JaaS endpoints.
 *
 * @param {string|undefined} url - The JaaS metadata endpoint URL.
 * @param {Object} feedbackData - The feedback data object.
 * @returns {Promise}
 */
export async function sendFeedbackToJaaSRequest(url: string | undefined, feedbackData: {
    jwt?: string; meetingFqn: string; message?: string; score?: number;
    sessionId: string; tenant?: string; userId?: string;
}) {
    if (!url) {
        throw new TypeError('Trying to send jaas feedback request to an undefined URL!');
    }

    const {
        jwt,
        sessionId,
        meetingFqn,
        score,
        message,
        userId,
        tenant
    } = feedbackData;
    const headers = {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
    };
    const data = {
        sessionId,
        meetingFqn,
        userId,
        tenant,
        submitted: new Date().getTime(),
        rating: score,
        comments: message
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(data)
        });

        if (!res.ok) {
            logger.error('Status error:', res.status);
        }
    } catch (err) {
        logger.error('Could not send request', err);
    }
}

/**
 * Returns whether jaas feedback metadata should be send or not.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {boolean} - True if jaas feedback metadata should be send and false otherwise.
 */
export function shouldSendJaaSFeedbackMetadata(state: IReduxState) {
    const { jaasFeedbackMetadataURL } = state['features/base/config'];

    return Boolean(isVpaasMeeting(state) && jaasFeedbackMetadataURL);
}

