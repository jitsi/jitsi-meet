// @flow

import { openDialog } from '../base/dialog';
import { SET_SHARED_VIDEO_STATUS, TOGGLE_SHARED_VIDEO } from '../shared-video/actionTypes';
import { SharedVideoDialog } from '../shared-video/components';


/**
 * Updates the current known status of the shared YouTube video.
 *
 * @param {string} status - The current status of the YouTube video being
 * shared.
 * @returns {{
 *     type: SET_SHARED_VIDEO_STATUS,
 *     status: string
 * }}
 */
export function setSharedVideoStatus(status) {
    return {
        type: SET_SHARED_VIDEO_STATUS,
        status
    };
}

/**
 * Starts the flow for starting or stopping a shared YouTube video.
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
 * Displays the dialog for entering the youtube video link.
 *
 * @param {Function} onPostSubmit - The function to be invoked when a valid link is entered.
 * @returns {Function}
 */
export function showSharedVideoDialog(onPostSubmit: ?Function) {
    return openDialog(SharedVideoDialog, { onPostSubmit });
}
