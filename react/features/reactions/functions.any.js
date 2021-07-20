// @flow

import uuid from 'uuid';

import { getLocalParticipant } from '../base/participants';
import { extractFqnFromPath } from '../dynamic-branding/functions';

import { REACTIONS } from './constants';
import logger from './logger';

/**
 * Returns the queue of reactions.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getReactionsQueue(state: Object) {
    return state['features/reactions'].queue;
}

/**
 * Returns chat message from reactions buffer.
 *
 * @param {Array} buffer - The reactions buffer.
 * @returns {string}
 */
export function getReactionMessageFromBuffer(buffer: Array<string>) {
    return buffer.map(reaction => REACTIONS[reaction].message).reduce((acc, val) => `${acc}${val}`);
}

/**
 * Returns reactions array with uid.
 *
 * @param {Array} buffer - The reactions buffer.
 * @returns {Array}
 */
export function getReactionsWithId(buffer: Array<string>) {
    return buffer.map<Object>(reaction => {
        return {
            reaction,
            uid: uuid.v4()
        };
    });
}

/**
 * Sends reactions to the backend.
 *
 * @param {Object} state - The redux state object.
 * @param {Array} reactions - Reactions array to be sent.
 * @returns {void}
 */
export async function sendReactionsWebhook(state: Object, reactions: Array<?string>) {
    const { webhookProxyUrl: url } = state['features/base/config'];
    const { conference } = state['features/base/conference'];
    const { jwt } = state['features/base/jwt'];
    const { locationURL } = state['features/base/connection'];
    const localParticipant = getLocalParticipant(state);

    const headers = {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
    };


    const reqBody = {
        meetingFqn: extractFqnFromPath(locationURL.pathname),
        sessionId: conference.sessionId,
        submitted: Date.now(),
        reactions,
        participantId: localParticipant.id,
        participantName: localParticipant.name
    };

    if (url) {
        try {
            const res = await fetch(`${url}/reactions`, {
                method: 'POST',
                headers,
                body: JSON.stringify(reqBody)
            });

            if (!res.ok) {
                logger.error('Status error:', res.status);
            }
        } catch (err) {
            logger.error('Could not send request', err);
        }
    }
}
