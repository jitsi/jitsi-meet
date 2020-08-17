// @flow

import { TOGGLE_CHAT } from './actionTypes';

export * from './actions.any';

/**
 * Toggles display of the chat panel.
 *
 * @returns {Function}
 */
export function toggleChat() {
    return function(dispatch: (Object) => Object) {
        dispatch({ type: TOGGLE_CHAT });
    };
}
