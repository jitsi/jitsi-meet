// @flow

import {
    SET_DOCUMENT_EDITING_STATUS,
    SET_DOCUMENT_URL,
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
 * Dispatches an action to set the shared document URL.
 *
 * @param {string} documentUrl - The shared document URL.
 * @returns {{
 *    type: SET_DOCUMENT_URL,
 *    documentUrl: string
 * }}
 */
export function setDocumentUrl(documentUrl: ?string) {
    return {
        type: SET_DOCUMENT_URL,
        documentUrl
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
