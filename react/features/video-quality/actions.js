// @flow

import type { Dispatch } from 'redux';

import { SET_MAX_RECEIVER_VIDEO_QUALITY, SET_PREFERRED_VIDEO_QUALITY } from './actionTypes';
import { VIDEO_QUALITY_LEVELS } from './constants';
import logger from './logger';

/**
 * Sets the max frame height the user prefers to send and receive from the
 * remote participants.
 *
 * @param {number} preferredVideoQuality - The max video resolution to send and
 * receive.
 * @returns {{
 *     type: SET_PREFERRED_VIDEO_QUALITY,
 *     preferredVideoQuality: number
 * }}
 */
export function setPreferredVideoQuality(preferredVideoQuality: number) {
    return {
        type: SET_PREFERRED_VIDEO_QUALITY,
        preferredVideoQuality
    };
}

/**
 * Sets the max frame height that should be received from remote videos.
 *
 * @param {number} maxReceiverVideoQuality - The max video frame height to
 * receive.
 * @returns {{
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY,
 *     maxReceiverVideoQuality: number
 * }}
 */
export function setMaxReceiverVideoQuality(maxReceiverVideoQuality: number) {
    return {
        type: SET_MAX_RECEIVER_VIDEO_QUALITY,
        maxReceiverVideoQuality
    };
}


/**
 * Sets the maximum video size the local participant should send and receive from
 * remote participants.
 *
 * @param {number} frameHeight - The user preferred max frame height for send and
 * receive video.
 * @returns {void}
 */
export function setVideoQuality(frameHeight: number) {
    return (dispatch: Dispatch<any>) => {
        if (frameHeight < VIDEO_QUALITY_LEVELS.LOW) {
            logger.error(`Invalid frame height for video quality - ${frameHeight}`);

            return;
        }

        dispatch(setPreferredVideoQuality(Math.min(frameHeight, VIDEO_QUALITY_LEVELS.HIGH)));
    };
}
