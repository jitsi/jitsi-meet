import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { JitsiRecordingConstants } from '../base/lib-jitsi-meet';
import { toState } from '../base/redux/functions';
import { getActiveSession } from '../recording/functions';
import { isScreenVideoShared } from '../screen-share/functions';

import ScreenshotCaptureSummary from './ScreenshotCaptureSummary';

/**
 * Creates a new instance of ScreenshotCapture.
 *
 * @param {Object | Function} stateful - The redux store, state, or
 * {@code getState} function.
 * @returns {Promise<ScreenshotCapture>}
 */
export function createScreenshotCaptureSummary(stateful: IStateful) {
    if (!MediaStreamTrack.prototype.getSettings && !MediaStreamTrack.prototype.getConstraints) {
        return Promise.reject(new Error('ScreenshotCaptureSummary not supported!'));
    }

    return new ScreenshotCaptureSummary(toState(stateful));
}

/**
 * Checks if the screenshot capture is enabled based on the config.
 *
 * @param {Object} state - Redux state.
 * @param {boolean} checkSharing - Whether to check if screensharing is on.
 * @param {boolean} checkRecording - Whether to check is recording is on.
 * @returns {boolean}
 */
export function isScreenshotCaptureEnabled(state: IReduxState, checkSharing?: boolean, checkRecording?: boolean) {
    const { screenshotCapture } = state['features/base/config'];

    if (!screenshotCapture?.enabled) {
        return false;
    }

    if (checkSharing && !isScreenVideoShared(state)) {
        return false;
    }

    if (checkRecording) {
        // Feature enabled always.
        if (screenshotCapture.mode === 'always') {
            return true;
        }

        // Feature enabled only when recording is also on.
        return Boolean(getActiveSession(state, JitsiRecordingConstants.mode.FILE));
    }

    return true;

}
