import { v4 as uuidv4 } from 'uuid';

import { IReduxState } from '../app/types';
import { REACTIONS_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import { getLocalParticipant } from '../base/participants/functions';
import { extractFqnFromPath } from '../dynamic-branding/functions.any';

import { IReactionEmojiProps, REACTIONS, ReactionThreshold, SOUNDS_THRESHOLDS } from './constants';
import logger from './logger';

/**
 * Returns the queue of reactions.
 *
 * @param {Object} state - The state of the application.
 * @returns {Array}
 */
export function getReactionsQueue(state: IReduxState): Array<IReactionEmojiProps> {
    return state['features/reactions'].queue;
}

/**
 * Returns chat message from reactions buffer.
 *
 * @param {Array} buffer - The reactions buffer.
 * @returns {string}
 */
export function getReactionMessageFromBuffer(buffer: Array<string>): string {
    return buffer.map<string>(reaction => REACTIONS[reaction].message).reduce((acc, val) => `${acc}${val}`);
}

/**
 * Returns reactions array with uid.
 *
 * @param {Array} buffer - The reactions buffer.
 * @returns {Array}
 */
export function getReactionsWithId(buffer: Array<string>): Array<IReactionEmojiProps> {
    return buffer.map<IReactionEmojiProps>(reaction => {
        return {
            reaction,
            uid: uuidv4()
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
export async function sendReactionsWebhook(state: IReduxState, reactions: Array<string>) {
    const { webhookProxyUrl: url } = state['features/base/config'];
    const { conference } = state['features/base/conference'];
    const { jwt } = state['features/base/jwt'];
    const { connection } = state['features/base/connection'];
    const jid = connection?.getJid();
    const localParticipant = getLocalParticipant(state);

    const headers = {
        ...jwt ? { 'Authorization': `Bearer ${jwt}` } : {},
        'Content-Type': 'application/json'
    };


    const reqBody = {
        meetingFqn: extractFqnFromPath(),
        sessionId: conference?.sessionId,
        submitted: Date.now(),
        reactions,
        participantId: localParticipant?.jwtId,
        participantName: localParticipant?.name,
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
function getUniqueReactions(reactions: Array<string>): Array<string> {
    return [ ...new Set(reactions) ];
}

/**
 * Returns frequency of given reaction in array.
 *
 * @param {Array} reactions - Array of reactions.
 * @param {string} reaction - Reaction to get frequency for.
 * @returns {number}
 */
function getReactionFrequency(reactions: Array<string>, reaction: string): number {
    return reactions.filter(r => r === reaction).length;
}

/**
 * Returns the threshold number for a given frequency.
 *
 * @param {number} frequency - Frequency of reaction.
 * @returns {number}
 */
function getSoundThresholdByFrequency(frequency: number): number {
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
export function getReactionsSoundsThresholds(reactions: Array<string>): Array<ReactionThreshold> {
    const unique = getUniqueReactions(reactions);

    return unique.map<ReactionThreshold>(reaction => {
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
export function isReactionsEnabled(state: IReduxState): boolean {
    const { disableReactions } = state['features/base/config'];

    if (navigator.product === 'ReactNative') {
        return !disableReactions && getFeatureFlag(state, REACTIONS_ENABLED, true);
    }

    return !disableReactions;
}
