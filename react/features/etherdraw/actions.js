// @flow

import {
    ETHERDRAW_INITIALIZED,
    SET_DRAW_EDITING_STATUS,
    TOGGLE_DRAW_EDITING
} from './actionTypes';

/**
 * Dispatches an action to set whether document editing has started or stopped.
 *
 * @param {boolean} editing - Whether or not a document is currently being
 * edited.
 * @returns {{
 *    type: SET_DRAW_EDITING_STATUS,
 *    editing: boolean
 * }}
 */
export function setDrawEditingState(editing: boolean) {
    return {
        type: SET_DRAW_EDITING_STATUS,
        editing
    };
}

/**
 * Dispatches an action to set Etherdraw as having been initialized.
 *
 * @returns {{
 *    type: ETHERDRAW_INITIALIZED
 * }}
 */
export function setEtherdrawHasInitialzied() {
    return {
        type: ETHERDRAW_INITIALIZED
    };
}

/**
 * Dispatches an action to show or hide Etherdraw.
 *
 * @returns {{
 *    type: TOGGLE_DRAW_EDITING
 * }}
 */
export function toggleDraw() {
    return {
        type: TOGGLE_DRAW_EDITING
    };
}
