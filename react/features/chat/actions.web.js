// @flow

import type { Dispatch } from 'redux';

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';

import { OPEN_CHAT, OPEN_CHAT_BACKGROUND, SET_CHAT_BACKGROUND } from './actionTypes';
import { closeChat, closeChatBackground } from './actions.any';

export * from './actions.any';

/**
 * Displays the chat panel.
 *
 * @param {Object} participant - The recipient for the private chat.
 * @returns {{
 *     participant: Participant,
 *     type: OPEN_CHAT
 * }}
 */
export function openChat(participant: Object) {
    return function(dispatch: (Object) => Object) {
        dispatch({
            participant,
            type: OPEN_CHAT
        });
    };
}

/**
 * Displays the chat background panel.
 *
 * @param {Object} participant - The recipient for the private chat.
 * @returns {{
 *     participant: Participant,
 *     type: OPEN_CHAT_BACKGROUND
 * }}
 */
export function openChatBackground(participant: Object) {
    return function(dispatch: (Object) => Object) {
        dispatch({
            participant,
            type: OPEN_CHAT_BACKGROUND
        });
    };
}

/**
 * Displays the chat background panel.
 *
 * @param {Object} chatBackgroundImage - The chat background image.
 * @returns {{
 *     participant: chatBackgroundImage,
 *     type: SET_CHAT_BACKGROUND
 * }}
 */
export function setChatBackground(chatBackgroundImage: Object) {
    return function(dispatch: (Object) => Object) {
        dispatch({
            chatBackgroundImage,
            type: SET_CHAT_BACKGROUND
        });
    };
}

/**
 * Toggles display of the chat panel.
 *
 * @returns {Function}
 */
export function toggleChat() {
    return (dispatch: Dispatch<any>, getState: Function) => {
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
 * Toggles display of the chat background.
 *
 * @returns {Function}
 */
export function toggleChatBackground() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const isBackgroundOpen = getState()['features/chat'].isBackgroundOpen;

        if (isBackgroundOpen) {
            dispatch(closeChatBackground());
        } else {
            dispatch(openChatBackground());
        }

        // Recompute the large video size whenever we toggle the chat, as it takes chat state into account.
        VideoLayout.onResize();
    };
}
