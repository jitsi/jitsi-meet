// @flow

import {
    TOGGLE_REACTIONS_VISIBLE
} from './actionTypes';

/**
 * Toggles the visibility of the reactions menu.
 *
 * @returns {Function}
 */
export function toggleReactionsMenuVisibility() {
    return {
        type: TOGGLE_REACTIONS_VISIBLE
    };
}
