// @flow

import {
    ADD_REACTIONS_MESSAGE,
    CLEAR_REACTIONS_MESSAGE,
    PUSH_REACTION,
    SEND_REACTION,
    SET_REACTIONS_MESSAGE,
    SET_REACTION_QUEUE
} from './actionTypes';
import { type ReactionEmojiProps } from './constants';

/**
 * Sets the reaction queue.
 *
 * @param {Array} value - The new queue.
 * @returns {Function}
 */
export function setReactionQueue(value: Array<ReactionEmojiProps>) {
    return {
        type: SET_REACTION_QUEUE,
        value
    };
}

/**
 * Appends the reactions message to the chat and resets the state.
 *
 * @returns {void}
 */
export function flushReactionsToChat() {
    return {
        type: CLEAR_REACTIONS_MESSAGE
    };
}

/**
 * Adds a new reaction to the reactions message.
 *
 * @param {boolean} value - The new reaction.
 * @returns {Object}
 */
export function addReactionsMessage(value: string) {
    return {
        type: SET_REACTIONS_MESSAGE,
        reaction: value
    };
}

/**
 * Adds a new reaction to the reactions message.
 *
 * @param {boolean} value - Reaction to be added to queue.
 * @returns {Object}
 */
export function pushReaction(value: string) {
    return {
        type: PUSH_REACTION,
        reaction: value
    };
}

/**
 * Removes a reaction from the queue.
 *
 * @param {number} uid - Id of the reaction to be removed.
 * @returns {void}
 */
export function removeReaction(uid: number) {
    return (dispatch: Function, getState: Function) => {
        const queue = getState()['features/reactions'].queue;

        dispatch(setReactionQueue(queue.filter(reaction => reaction.uid !== uid)));
    };
}


/**
 * Sends a reaction message to everyone in the conference.
 *
 * @param {string} reaction - The reaction to send out.
 * @returns {{
 *     type: SEND_REACTION,
 *     reaction: string
 * }}
 */
export function sendReaction(reaction: string) {
    return {
        type: SEND_REACTION,
        reaction
    };
}

/**
 * Adds a reactions message to the chat.
 *
 * @param {string} message - The reactions message to add to chat.
 * @returns {{
 *     type: ADD_REACTIONS_MESSAGE,
 *     message: string
 * }}
 */
export function addReactionsMessageToChat(message: string) {
    return {
        type: ADD_REACTIONS_MESSAGE,
        message
    };
}
