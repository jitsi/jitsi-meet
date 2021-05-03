// @flow

import { openDialog } from '../base/dialog/actions';
import { SharedVideoDialog } from '../shared-video2/components';

import { SET_SHARED_VIDEO_STATUS2, TOGGLE_SHARED_VIDEO2, SET_DISABLE_BUTTON2 } from './actionTypes';

/**
 * Updates the current known status of the shared video.
 *
 * @param {string} status - The current status of the video being shared.
 * @returns {{
 *     type: SET_SHARED_VIDEO_STATUS2,
 *     status: string
 * }}
 */
export function setSharedVideoStatus(status: string) {
    return {
        type: SET_SHARED_VIDEO_STATUS2,
        status
    };
}


/**
 * Disabled share video button.
 *
 * @param {boolean} disabled - The current state of the share video button.
 * @returns {{
 *     type: SET_DISABLE_BUTTON2,
 *     disabled: boolean
 * }}
 */
export function setDisableButton(disabled: boolean) {
    return {
        type: SET_DISABLE_BUTTON2,
        disabled
    };
}

/**
 * Starts the flow for starting or stopping a shared video.
 *
 * @returns {{
 *     type: TOGGLE_SHARED_VIDEO2
 * }}
 */
export function toggleSharedVideo() {
    return {
        type: TOGGLE_SHARED_VIDEO2
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
