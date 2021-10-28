// @flow

import uuid from 'uuid';

import { getFeatureFlag, REACTIONS_ENABLED } from '../base/flags';
import { getLocalParticipant } from '../base/participants';
import { extractFqnFromPath } from '../dynamic-branding/functions';

import { REACTIONS, SOUNDS_THRESHOLDS } from './constants';
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
    const { connection } = state['features/base/connection'];
    const jid = connection.getJid();
    const localParticipant = getLocalParticipant(state);

    const headers = {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json'
    };


    const reqBody = {
        meetingFqn: extractFqnFromPath(),
        sessionId: conference.sessionId,
        submitted: Date.now(),
        reactions,
        participantId: localParticipant.jwtId,
        participantName: localParticipant.name,
        participantJid: jid
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

/**
 * Returns unique reactions from the reactions buffer.
 *
 * @param {Array} reactions - The reactions buffer.
 * @returns {Array}
 */
function getUniqueReactions(reactions: Array<string>) {
    return [ ...new Set(reactions) ];
}

/**
 * Returns frequency of given reaction in array.
 *
 * @param {Array} reactions - Array of reactions.
 * @param {string} reaction - Reaction to get frequency for.
 * @returns {number}
 */
function getReactionFrequency(reactions: Array<string>, reaction: string) {
    return reactions.filter(r => r === reaction).length;
}

/**
 * Returns the threshold number for a given frequency.
 *
 * @param {number} frequency - Frequency of reaction.
 * @returns {number}
 */
function getSoundThresholdByFrequency(frequency) {
    for (const i of SOUNDS_THRESHOLDS) {
        if (frequency <= i) {
            return i;
        }
    }

    return SOUNDS_THRESHOLDS[SOUNDS_THRESHOLDS.length - 1];
}

/**
 * Returns unique reactions with threshold.
 *
 * @param {Array} reactions - The reactions buffer.
 * @returns {Array}
 */
export function getReactionsSoundsThresholds(reactions: Array<string>) {
    const unique = getUniqueReactions(reactions);

    return unique.map<Object>(reaction => {
        return {
            reaction,
            threshold: getSoundThresholdByFrequency(getReactionFrequency(reactions, reaction))
        };
    });
}

/**
 * Whether or not the reactions are enabled.
 *
 * @param {Object} state - The Redux state object.
 * @returns {boolean}
 */
export function isReactionsEnabled(state: Object) {
    const { disableReactions } = state['features/base/config'];

    if (navigator.product === 'ReactNative') {
        return !disableReactions && getFeatureFlag(state, REACTIONS_ENABLED, true);
    }

    return !disableReactions;
}
