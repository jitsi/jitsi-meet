// @flow

import { getLocalVideoTrack } from '../../features/base/tracks';


import { SET_SCREENSHOT_CAPTURE } from './actionTypes';
import { createScreenshotCaptureSummary } from './functions';
import logger from './logger';

let screenshotSummary;

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
export function toggleScreenshotCaptureSummary(enabled: boolean) {
    return async function(dispatch: (Object) => Object, getState: () => any) {
        const state = getState();

        if (state['features/screenshot-capture'].capturesEnabled !== enabled) {
            if (!screenshotSummary) {
                try {
                    screenshotSummary = await createScreenshotCaptureSummary(state);
                } catch (err) {
                    logger.error('Cannot create screenshotCaptureSummary', err);
                }
            }

            if (enabled) {
                try {
                    const { jitsiTrack } = getLocalVideoTrack(state['features/base/tracks']);

                    await screenshotSummary.start(jitsiTrack);
                    dispatch(setScreenshotCapture(enabled));
                } catch {

                    // Handle promise rejection from {@code start} due to stream type not being desktop.
                    logger.error('Unsupported stream type.');
                }
            } else {
                screenshotSummary.stop();
                dispatch(setScreenshotCapture(enabled));
            }
        }

        return Promise.resolve();
    };
}
