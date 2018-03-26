import { SET_SHARED_VIDEO_STATUS, TOGGLE_SHARED_VIDEO } from './actionTypes';

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
