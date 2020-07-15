// @flow

import { toState } from '../../base/redux';

import ScreenshotCaptureEffect from './ScreenshotCaptureEffect';

/**
 * Creates a new instance of ScreenshotCaptureEffect.
 *
 * @param {Object | Function} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {Promise<ScreenshotCaptureEffect>}
 */
export function createScreenshotCaptureEffect(stateful: Object | Function) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('ScreenshotCaptureEffect not supported!'));
    }

    return Promise.resolve(new ScreenshotCaptureEffect(toState(stateful)));
}
