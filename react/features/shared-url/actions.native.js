// @flow

import { openDialog } from '../base/dialog';

import { SET_SHARED_URL_STATUS, TOGGLE_SHARED_URL } from './actionTypes';
import { SharedURLDialog } from './components/native';

/**
 * Updates the current known status of the shared video.
 *
 * @param {string} sharedURL - The id of the video to be shared.
 * @param {string} status - The current status of the video being shared.
 * @param {string} ownerId - The participantId of the user sharing the video.
 * @returns {{
 *     type: SET_SHARED_URL_STATUS,
 *     ownerId: string,
 *     status: string,
 *     sharedURL: string
 * }}
 */
export function setSharedURLStatus(sharedURL: string, status: string, ownerId: string) {
    return {
        type: SET_SHARED_URL_STATUS,
        ownerId,
        status,
        sharedURL
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
 * Displays the prompt for entering the URL.
 *
 * @param {Function} onPostSubmit - The function to be invoked when a valid link is entered.
 * @returns {Function}
 */
export function showSharedURLDialog(onPostSubmit: ?Function) {
    return openDialog(SharedURLDialog, { onPostSubmit });
}
