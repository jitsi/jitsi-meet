// @flow

import VideoLayout from '../../../modules/UI/videolayout/VideoLayout';

import { TOGGLE_CHAT, SET_CHAT_POSITION } from './actionTypes';

export * from './actions.any';

/**
 * Toggles display of the chat side panel while also taking window
 * resize into account.
 *
 * @returns {Function}
 */
export function toggleChat() {
    return function(dispatch: (Object) => Object) {
        dispatch({ type: TOGGLE_CHAT });
        VideoLayout.onResize();
    };
}

/**
 * Sets new chat position.
 *
 * @param {boolean} onTheLeft - controls whether
 * chat will be rendered on the left or at the bottom
 * @returns {Function}
 */
export function setChatPosition(onTheLeft: boolean) {
    return function(dispatch: (Object) => Object) {
        dispatch({
            type: SET_CHAT_POSITION,
            onTheLeft
        });
    };
}

