// @flow

import { OPEN_CHAT } from './actionTypes';

export * from './actions.any';

/**
 * Displays the chat panel.
 *
 * @param {Object} participant - The recipient for the private chat.
 *
 * @returns {{
 *     participant: Participant,
 *     type: OPEN_CHAT
 * }}
 */
export function openChat(participant: Object) {
    return {
        participant,
        type: OPEN_CHAT
    };
}
