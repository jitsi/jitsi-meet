// @flow
import { createVideoAvatarEffect } from '../stream-effects/video-avatar';

import { VIDEO_AVATAR_ENABLED } from './actionTypes';

/**
 * Signals the local participant activate the virtual background video or not.
 *
 * @param {Object} options - Represents the virtual background setted options.
 * @param {Object} jitsiTrack - Represents the jitsi track that will have backgraund effect applied.
 * @returns {Promise}
 */
export function toggleVideoAvatarEffect(options: Object, jitsiTrack: Object) {
    return async function(dispatch: (Object) => Object) {
        await dispatch(videoAvatarEnabled(options.enabled));

        // await dispatch(setVirtualBackground(options));
        // const state = getState();

        if (jitsiTrack) {
            try {
                if (options.enabled) {
                    await jitsiTrack.setEffect(await createVideoAvatarEffect());
                } else {
                    await jitsiTrack.setEffect(undefined);
                    dispatch(videoAvatarEnabled(false));
                }
            } catch (error) {
                dispatch(videoAvatarEnabled(false));

                // logger.error('Error on apply background effect:', error);
            }
        }
    };
}

/**
 * Signals the local participant that the background effect has been enabled.
 *
 * @param {boolean} backgroundEffectEnabled - Indicate if virtual background effect is activated.
 * @returns {{
 *      type: BACKGROUND_ENABLED,
 *      backgroundEffectEnabled: boolean
 * }}
 */
export function videoAvatarEnabled(backgroundEffectEnabled: boolean) {
    return {
        type: VIDEO_AVATAR_ENABLED,
        backgroundEffectEnabled
    };
}
