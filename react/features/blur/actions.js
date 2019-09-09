// @flow

import { getLocalVideoTrack } from '../../features/base/tracks';

import { BLUR_DISABLED, BLUR_ENABLED } from './actionTypes';
import { getBlurEffect } from './functions';
import logger from './logger';

/**
* Signals the local participant is switching between blurred or non blurred video.
*
* @param {boolean} enabled - If true enables video blur, false otherwise.
* @returns {Promise}
*/
export function toggleBlurEffect(enabled: boolean) {
    return function(dispatch: (Object) => Object, getState: () => any) {
        const state = getState();

        if (state['features/blur'].blurEnabled !== enabled) {
            const { jitsiTrack } = getLocalVideoTrack(state['features/base/tracks']);

            return getBlurEffect()
                .then(blurEffectInstance =>
                    jitsiTrack.setEffect(enabled ? blurEffectInstance : undefined)
                        .then(() => {
                            enabled ? dispatch(blurEnabled()) : dispatch(blurDisabled());
                        })
                        .catch(error => {
                            enabled ? dispatch(blurDisabled()) : dispatch(blurEnabled());
                            logger.error('setEffect failed with error:', error);
                        })
                )
                .catch(error => {
                    dispatch(blurDisabled());
                    logger.error('getBlurEffect failed with error:', error);
                });
        }

        return Promise.resolve();
    };
}

/**
 * Signals the local participant that the blur has been enabled.
 *
 * @returns {{
 *      type: BLUR_ENABLED
 * }}
 */
export function blurEnabled() {
    return {
        type: BLUR_ENABLED
    };
}

/**
 * Signals the local participant that the blur has been disabled.
 *
 * @returns {{
 *      type: BLUR_DISABLED
 * }}
 */
export function blurDisabled() {
    return {
        type: BLUR_DISABLED
    };
}
