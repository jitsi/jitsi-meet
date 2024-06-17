// @ts-expect-error
import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';
import { IStore } from '../app/types';

import { OPEN_CHAT } from './actionTypes';
import { closeChat } from './actions.any';

export * from './actions.any';

/**
 * Displays the chat panel.
 *
 * @param {Object} participant - The recipient for the private chat.
 * @param {Object} _disablePolls - Used on native.
 * @returns {{
 *     participant: Participant,
 *     type: OPEN_CHAT
 * }}
 */
export function openChat(participant?: Object, _disablePolls?: boolean) {
    return function(dispatch: IStore['dispatch']) {
        dispatch({
            participant,
            type: OPEN_CHAT
        });
    };
}

/**
 * Toggles display of the chat panel.
 *
 * @returns {Function}
 */
export function toggleChat() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const isOpen = getState()['features/chat'].isOpen;

        if (isOpen) {
            dispatch(closeChat());
        } else {
            dispatch(openChat());
        }

        // Recompute the large video size whenever we toggle the chat, as it takes chat state into account.
        VideoLayout.onResize();
    };
}

/**
 * Adds a reaction to a message.
 *
 * @param {string} participantID - The ID of the participant to whom the reaction is directed.
 * @param {string} reactionType - The type of reaction (e.g., 'like').
 * @returns {Function}
 */
export function addReaction(participantID: string, reactionType: string) {
    return function(dispatch: IStore['dispatch']) {
        dispatch({
            type: 'ADD_REACTION',
            participantID,
            reactionType
        });
    };
}