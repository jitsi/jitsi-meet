// @flow

import { toState } from '../base/redux';

import ScreenshotCaptureSummary from './ScreenshotCaptureSummary';

/**
 * Creates a new instance of ScreenshotCapture.
 *
 * @param {Object | Function} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {Promise<ScreenshotCapture>}
 */
export function createScreenshotCaptureSummary(stateful: Object | Function) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('ScreenshotCaptureSummary not supported!'));
    }

    return new ScreenshotCaptureSummary(toState(stateful));
}
