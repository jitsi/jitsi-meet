// @flow

import { getLocalVideoTrack } from '../../features/base/tracks';

import {
    GREEN_SCREEN_DISABLED,
    GREEN_SCREEN_ENABLED,
    GREEN_SCREEN_CHANGED,
    GREEN_SCREEN_MASK_UPDATED
} from './actionTypes';
import { getGreenScreenEffect } from './functions';
import logger from './logger';

/**
* Signals the local participant is switching between green screened or non green screened video.
*
* @param {boolean} enabled - If true enables video green screen, false otherwise.
* @returns {Promise}
*/
export function toggleGreenScreenEffect(enabled: boolean) {
    return function(dispatch: (Object) => Object, getState: () => any) {
        const state = getState();

        if (state['features/green-screen/settings'].enabled !== enabled) {
            const localVideo = getLocalVideoTrack(state['features/base/tracks']);

            if (!localVideo || !localVideo.jitsiTrack) {
                // This occurs when enabling the green screen from the welcome page.
                // Handle gracefully and do not reverse the desired effect.
                // There may be a better way to handle this.
                dispatch(enabled ? greenScreenEnabled() : greenScreenDisabled());
                logger.warn('Unable to find local video track');

                return Promise.resolve();
            }

            return getGreenScreenEffect(getState, dispatch)
                .then(greenScreenEffectInstance =>
                    localVideo.jitsiTrack.setEffect(enabled ? greenScreenEffectInstance : undefined)
                        .then(() => {
                            enabled ? dispatch(greenScreenEnabled()) : dispatch(greenScreenDisabled());
                        })
                        .catch(error => {
                            enabled ? dispatch(greenScreenDisabled()) : dispatch(greenScreenEnabled());
                            logger.error('setEffect failed with error:', error);
                        })
                )
                .catch(error => {
                    dispatch(greenScreenDisabled());
                    logger.error('getGreenScreenEffect failed with error:', error);
                });
        }

        return Promise.resolve();
    };
}

/**
 *  Signals that the green screen data has changed.
 *
 * @param {Object} imageData - Raw file input.
 * @returns {{
 *      type: GREEN_SCREEN_CHANGED
 * }}
 */
export function greenScreenUpdated(imageData: Object) {
    return {
        type: GREEN_SCREEN_CHANGED,
        data: imageData
    };
}


/**
 *  Signals that the green screen mask has changed.
 *
 * @param {Object} imageData - Processed file input.
 * @returns {{
 *      type: GREEN_SCREEN_MASK_UPDATED
 * }}
 */
export function greenScreenMaskUpdated(imageData: Object) {
    return {
        type: GREEN_SCREEN_MASK_UPDATED,
        data: imageData
    };
}

/**
 * Signals the local participant that the green screen has been enabled.
 *
 * @returns {{
 *      type: GREEN_SCREEN_ENABLED
 * }}
 */
export function greenScreenEnabled() {
    return {
        type: GREEN_SCREEN_ENABLED
    };
}

/**
 * Signals the local participant that the green screen has been disabled.
 *
 * @returns {{
 *      type: GREEN_SCREEN_DISABLED
 * }}
 */
export function greenScreenDisabled() {
    return {
        type: GREEN_SCREEN_DISABLED
    };
}
