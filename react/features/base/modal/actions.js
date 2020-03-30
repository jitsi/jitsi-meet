// @flow

import { SET_ACTIVE_MODAL_ID } from './actionTypes';

/**
 * Action to set the ID of the active modal (or undefined if needs to be hidden).
 *
 * @param {string} activeModalId - The new modal ID or undefined.
 * @returns {{
 *     activeModalId: string,
 *     type: SET_ACTIVE_MODAL_ID
 * }}
 */
export function setActiveModalId(activeModalId: ?string) {
    return {
        activeModalId,
        type: SET_ACTIVE_MODAL_ID
    };
}
