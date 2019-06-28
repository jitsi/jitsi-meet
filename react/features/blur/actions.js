// @flow

import { getJitsiMeetGlobalNS } from '../base/util';
import { getLocalVideoTrack } from '../../features/base/tracks';

import {
    BLUR_DISABLED,
    BLUR_ENABLED
} from './actionTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
* Signals the local participant is switching between blurred or
* non blurred video.
*
* @param {boolean} enabled - If true enables video blur, false otherwise
*
* @returns {Promise}
*/
export function toggleBlurEffect(enabled: boolean) {
    return function(dispatch: (Object) => Object, getState: () => any) {
        if (getState()['features/blur'].blurEnabled !== enabled) {
            const videoTrack = getLocalVideoTrack(getState()['features/base/tracks']).jitsiTrack;

            return getJitsiMeetGlobalNS().effects.createBlurEffect()
                .then(blurEffectInstance =>
                    videoTrack.enableEffect(enabled, blurEffectInstance)
                        .then(() => {
                            enabled ? dispatch(blurEnabled()) : dispatch(blurDisabled());
                        })
                        .catch(error => {
                            enabled ? dispatch(blurDisabled()) : dispatch(blurEnabled());
                            logger.log('enableEffect failed with error:', error);
                        })
                )
                .catch(error => {
                    dispatch(blurDisabled());
                    logger.log('createBlurEffect failed with error:', error);
                });
        }
    };
}

/**
 * Signals the local participant that the blur has been enabled
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
 * Signals the local participant that the blur has been disabled
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
