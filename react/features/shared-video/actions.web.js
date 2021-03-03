// @flow

import { openDialog } from '../base/dialog/actions';
import { SharedVideoDialog } from '../shared-video/components';

import { SET_SHARED_VIDEO_STATUS, TOGGLE_SHARED_VIDEO, SET_DISABLE_BUTTON } from './actionTypes';

/**
 * Updates the current known status of the shared video.
 *
 * @param {string} status - The current status of the video being shared.
 * @returns {{
 *     type: SET_SHARED_VIDEO_STATUS,
 *     status: string
 * }}
 */
export function setSharedVideoStatus(status: string) {
    return {
        type: SET_SHARED_VIDEO_STATUS,
        status
    };
}


/**
 * Disabled share video button.
 *
 * @param {boolean} disabled - The current state of the share video button.
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
 *     type: TOGGLE_SHARED_VIDEO
 * }}
 */
export function toggleSharedVideo() {
    return {
        type: TOGGLE_SHARED_VIDEO
    };
}

/**
 * Displays the dialog for entering the video link.
 *
 * @param {Function} onPostSubmit - The function to be invoked when a valid link is entered.
 * @returns {Function}
 */
export function showSharedVideoDialog(onPostSubmit: ?Function) {
    return openDialog(SharedVideoDialog, { onPostSubmit });
}
