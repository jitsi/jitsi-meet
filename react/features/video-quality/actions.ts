import { IStore } from '../app/types';

import {
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_LARGE_VIDEO,
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_SCREEN_SHARING_FILMSTRIP,
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_STAGE_FILMSTRIP,
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_TILE_VIEW,
    SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_VERTICAL_FILMSTRIP,
    SET_PREFERRED_VIDEO_QUALITY
} from './actionTypes';
import { MAX_VIDEO_QUALITY, VIDEO_QUALITY_LEVELS } from './constants';
import logger from './logger';

/**
 * Sets the max frame height that should be received for the large video.
 *
 * @param {number} maxReceiverVideoQuality - The max video frame height to
 * receive.
 * @returns {{
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_LARGE_VIDEO,
 *     maxReceiverVideoQuality: number
 * }}
 */
export function setMaxReceiverVideoQualityForLargeVideo(maxReceiverVideoQuality: number) {
    return {
        type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_LARGE_VIDEO,
        maxReceiverVideoQuality
    };
}

/**
 * Sets the max frame height that should be received for the screen sharing filmstrip particpant.
 *
 * @param {number} maxReceiverVideoQuality - The max video frame height to
 * receive.
 * @returns {{
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_SCREEN_SHARING_FILMSTRIP,
 *     maxReceiverVideoQuality: number
 * }}
 */
export function setMaxReceiverVideoQualityForScreenSharingFilmstrip(maxReceiverVideoQuality: number) {
    return {
        type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_SCREEN_SHARING_FILMSTRIP,
        maxReceiverVideoQuality
    };
}

/**
 * Sets the max frame height that should be received from remote videos for the stage filmstrip.
 *
 * @param {number} maxReceiverVideoQuality - The max video frame height to
 * receive.
 * @returns {{
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_STAGE_FILMSTRIP,
 *     maxReceiverVideoQuality: number
 * }}
 */
export function setMaxReceiverVideoQualityForStageFilmstrip(maxReceiverVideoQuality: number) {
    return {
        type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_STAGE_FILMSTRIP,
        maxReceiverVideoQuality
    };
}

/**
 * Sets the max frame height that should be received from remote videos in tile view.
 *
 * @param {number} maxReceiverVideoQuality - The max video frame height to
 * receive.
 * @returns {{
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_TILE_VIEW,
 *     maxReceiverVideoQuality: number
 * }}
 */
export function setMaxReceiverVideoQualityForTileView(maxReceiverVideoQuality: number) {
    return {
        type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_TILE_VIEW,
        maxReceiverVideoQuality
    };
}

/**
 * Sets the max frame height that should be received from remote videos for the vertical filmstrip.
 *
 * @param {number} maxReceiverVideoQuality - The max video frame height to
 * receive.
 * @returns {{
 *     type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_VERTICAL_FILMSTRIP,
 *     maxReceiverVideoQuality: number
 * }}
 */
export function setMaxReceiverVideoQualityForVerticalFilmstrip(maxReceiverVideoQuality: number) {
    return {
        type: SET_MAX_RECEIVER_VIDEO_QUALITY_FOR_VERTICAL_FILMSTRIP,
        maxReceiverVideoQuality
    };
}

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
 * Sets the maximum video size the local participant should send and receive from
 * remote participants.
 *
 * @param {number} frameHeight - The user preferred max frame height for send and
 * receive video.
 * @returns {void}
 */
export function setVideoQuality(frameHeight: number) {
    return (dispatch: IStore['dispatch']) => {
        if (frameHeight < VIDEO_QUALITY_LEVELS.LOW) {
            logger.error(`Invalid frame height for video quality - ${frameHeight}`);

            return;
        }

        dispatch(setPreferredVideoQuality(Math.min(frameHeight, MAX_VIDEO_QUALITY)));
    };
}
