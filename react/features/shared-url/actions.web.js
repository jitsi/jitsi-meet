// @flow

import { openDialog } from '../base/dialog/actions';
import { SharedURLDialog } from '../shared-url/components';

import { SET_SHARED_URL_STATUS, TOGGLE_SHARED_URL, SET_DISABLE_BUTTON } from './actionTypes';

/**
 * Updates the current known status of the shared URL.
 *
 * @param {string} status - The current status of the URL being shared.
 * @returns {{
 *     type: SET_SHARED_URL_STATUS,
 *     status: string
 * }}
 */
export function setSharedURLStatus(status: string) {
    return {
        type: SET_SHARED_URL_STATUS,
        status
    };
}


/**
 * Disabled share URL button.
 *
 * @param {boolean} disabled - The current state of the share URL button.
 * @returns {{
 *     type: SET_DISABLE_BUTTON,
 *     disabled: boolean
 * }}
 */
export function setDisableButton(disabled: boolean) {
    return {
        type: SET_DISABLE_BUTTON,
        disabled
    };
}

/**
 * Starts the flow for starting or stopping a shared video.
 *
 * @returns {{
 *     type: TOGGLE_SHARED_URL
 * }}
 */
export function toggleSharedURL() {
    return {
        type: TOGGLE_SHARED_URL
    };
}

/**
 * Displays the dialog for entering the video link.
 *
 * @param {Function} onPostSubmit - The function to be invoked when a valid link is entered.
 * @returns {Function}
 */
export function showSharedURLDialog(onPostSubmit: ?Function) {
    return openDialog(SharedURLDialog, { onPostSubmit });
}
