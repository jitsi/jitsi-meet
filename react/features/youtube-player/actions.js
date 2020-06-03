// @flow

import { openDialog } from '../base/dialog';

import {
    SET_SHARED_VIDEO_STATUS,
    SET_SHARED_VIDEO_OWNER,
    SET_TOOLBOX_VISIBLE } from './actionTypes';
import { EnterVideoLinkPrompt } from './components';

/**
 * Updates the current known status of the shared YouTube video.
 *
 * @param {string} status - The current status of the YouTube video being shared.
 * @param {value} time - The current position of the YouTube video being shared.
 * @returns {{
 *     type: SET_SHARED_VIDEO_STATUS,
 *     status: string,
 *     time: string
 * }}
 */
export function setSharedVideoStatus(status: string, time: string) {
    return {
        type: SET_SHARED_VIDEO_STATUS,
        status,
        time
    };
}

/**
 * Updates the current id of the participant sharing the youtube video.
 *
 * @param {string} ownerId - The id of the participant.
 * @returns {{
 *     type: SET_SHARED_VIDEO_OWNER,
 *     ownerId: string
 * }}
 */
export function setSharedVideoOwner(ownerId: string) {
    return {
        type: SET_SHARED_VIDEO_OWNER,
        ownerId
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
        type: 'TOGGLE_SHARED_VIDEO'
    };
}

/**
 * Displays the prompt for entering the youtube video link.
 *
 * @param {Function} onPostSubmit - The function to be invoked when a valid link is entered.
 * @returns {Function}
 */
export function showEnterVideoLinkPrompt(onPostSubmit: ?Function) {
    return openDialog(EnterVideoLinkPrompt, { onPostSubmit });
}

/**
 * Shows/hides the toolbox.
 *
 * @param {boolean} visible - True to show the toolbox or false to hide it.
 * @returns {{
 *     type: SET_TOOLBOX_VISIBLE,
 *     visible: boolean
 * }}
 */
export function setToolboxVisible(visible: boolean): Object {
    return {
        type: SET_TOOLBOX_VISIBLE,
        visible
    };
}
