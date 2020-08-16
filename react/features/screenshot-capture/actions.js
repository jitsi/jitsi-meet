// @flow

import { getLocalVideoTrack } from '../../features/base/tracks';
import { createScreenshotCaptureEffect } from '../stream-effects/screenshot-capture';

import { SET_SCREENSHOT_CAPTURE } from './actionTypes';
import logger from './logger';

let ongoingEffect;

/**
 * Marks the on-off state of screenshot captures.
 *
 * @param {boolean} enabled - Whether to turn screen captures on or off.
 * @returns {{
    *      type: START_SCREENSHOT_CAPTURE,
    *      payload: enabled
    * }}
*/
function setScreenshotCapture(enabled) {
    return {
        type: SET_SCREENSHOT_CAPTURE,
        payload: enabled
    };
}

/**
* Action that toggles the screenshot captures.
*
* @param {boolean} enabled - Bool that represents the intention to start/stop screenshot captures.
* @returns {Promise}
*/
export function toggleScreenshotCaptureEffect(enabled: boolean) {
    return async function(dispatch: (Object) => Object, getState: () => any) {
        const state = getState();

        if (state['features/screenshot-capture'].capturesEnabled !== enabled) {
            const { jitsiTrack } = getLocalVideoTrack(state['features/base/tracks']);

            if (!ongoingEffect) {
                ongoingEffect = await createScreenshotCaptureEffect(state);
            }

            // Screenshot capture effect doesn't return a modified stream. Therefore, we don't have to
            // switch the stream at the conference level, starting/stopping the effect will suffice here.
            if (enabled) {
                try {
                    await ongoingEffect.startEffect(
                        jitsiTrack.getOriginalStream(),
                        jitsiTrack.videoType
                    );
                    dispatch(setScreenshotCapture(enabled));
                } catch {

                    // Handle promise rejection from {@code startEffect} due to stream type not being desktop.
                    logger.error('Unsupported stream type.');
                }
            } else {
                ongoingEffect.stopEffect();
                dispatch(setScreenshotCapture(enabled));
            }
        }

        return Promise.resolve();
    };
}
