// @flow

import {
    ETHERPAD_INITIALIZED,
    SET_DOCUMENT_EDITING_STATUS,
    TOGGLE_DOCUMENT_EDITING
} from './actionTypes';

/**
 * Dispatches an action to set whether document editing has started or stopped.
 *
 * @param {boolean} editing - Whether or not a document is currently being
 * edited.
 * @returns {{
 *    type: SET_DOCUMENT_EDITING_STATUS,
 *    editing: boolean
 * }}
 */
export function setDocumentEditingState(editing: boolean) {
    return {
        type: SET_DOCUMENT_EDITING_STATUS,
        editing
    };
}

/**
 * Dispatches an action to set Etherpad as having been initialized.
 *
 * @returns {{
 *    type: ETHERPAD_INITIALIZED
 * }}
 */
export function setEtherpadHasInitialzied() {
    return {
        type: ETHERPAD_INITIALIZED
    };
}

/**
 * Dispatches an action to show or hide Etherpad.
 *
 * @returns {{
 *    type: TOGGLE_DOCUMENT_EDITING
 * }}
 */
export function toggleDocument() {
    return {
        type: TOGGLE_DOCUMENT_EDITING
    };
}
