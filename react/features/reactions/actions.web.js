// @flow

import {
    SHOW_SOUNDS_NOTIFICATION,
    TOGGLE_REACTIONS_VISIBLE
} from './actionTypes.ts';

/**
 * Toggles the visibility of the reactions menu.
 *
 * @returns {Object}
 */
export function toggleReactionsMenuVisibility() {
    return {
        type: TOGGLE_REACTIONS_VISIBLE
    };
}

/**
 * Displays the disable sounds notification.
 *
 * @returns {Object}
 */
export function displayReactionSoundsNotification() {
    return {
        type: SHOW_SOUNDS_NOTIFICATION
    };
}
