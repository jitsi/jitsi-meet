// @flow

import { SET_ACTIVE_MODAL_ID } from './actionTypes';

/**
 * Action to set the ID of the active modal (or undefined if needs to be hidden).
 *
 * @param {string} activeModalId - The new modal ID or undefined.
 * @param {Object} modalProps - The props to pass to the modal.
 * @returns {{
 *     activeModalId: string,
 *     type: SET_ACTIVE_MODAL_ID
 * }}
 */
export function setActiveModalId(activeModalId: ?string, modalProps: Object = {}) {
    return {
        activeModalId,
        modalProps,
        type: SET_ACTIVE_MODAL_ID
    };
}
