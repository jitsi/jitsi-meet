import { IStore } from '../app/types';
import { getLocalJitsiDesktopTrack } from '../base/tracks/functions';

import { SET_SCREENSHOT_CAPTURE } from './actionTypes';
import { createScreenshotCaptureSummary } from './functions';
import logger from './logger';

let screenshotSummary: any;

/**
 * Marks the on-off state of screenshot captures.
 *
 * @param {boolean} enabled - Whether to turn screen captures on or off.
 * @returns {{
    *      type: START_SCREENSHOT_CAPTURE,
    *      payload: enabled
    * }}
*/
function setScreenshotCapture(enabled: boolean) {
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
    return async function(dispatch: IStore['dispatch'], getState: IStore['getState']) {
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
                    const jitsiTrack = getLocalJitsiDesktopTrack(state);

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
