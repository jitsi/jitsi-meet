// @flow

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';

import { OPEN_CHAT } from './actionTypes';

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
        dispatch({ participant,
            type: OPEN_CHAT });
        VideoLayout.onResize();
    };
}
