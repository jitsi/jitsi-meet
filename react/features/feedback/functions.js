// @flow

import logger from './logger';

/**
 * Sends feedback metadata to JaaS endpoints.
 *
 * @param {string} url - The JaaS metadata endpoint URL.
 * @param {Object} feedbackData - The feedback data object.
 * @returns {Promise}
 */
export async function sendFeedbackToJaaSRequest(url: string, feedbackData: Object) {
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

