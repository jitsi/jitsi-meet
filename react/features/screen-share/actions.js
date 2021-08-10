// @flow

import { openDialog } from '../base/dialog/actions';
import { browser } from '../base/lib-jitsi-meet';
import { shouldHideShareAudioHelper } from '../base/settings';
import { toggleScreensharing } from '../base/tracks';

import { SET_SCREEN_AUDIO_SHARE_STATE, SET_SCREENSHARE_CAPTURE_FRAME_RATE } from './actionTypes';
import { ShareAudioDialog } from './components';
import ShareMediaWarningDialog from './components/ShareScreenWarningDialog';
import { isAudioOnlySharing, isScreenVideoShared } from './functions';

/**
 * Updates the current known status of the shared video.
 *
 * @param {boolean} isSharingAudio - Is audio currently being shared or not.
 * @returns {{
 *     type: SET_SCREEN_AUDIO_SHARE_STATE,
 *     isSharingAudio: boolean
 * }}
 */
export function setScreenAudioShareState(isSharingAudio: boolean) {
    return {
        type: SET_SCREEN_AUDIO_SHARE_STATE,
        isSharingAudio
    };
}

/**
 * Updates the capture frame rate for screenshare in redux.
 *
 * @param {number} captureFrameRate - The frame rate to be used for screenshare.
 * @returns {{
 *      type: SET_SCREENSHARE_CAPTURE_FRAME_RATE,
 *      captureFrameRate: number
 * }}
 */
export function setScreenshareFramerate(captureFrameRate: number) {
    return {
        type: SET_SCREENSHARE_CAPTURE_FRAME_RATE,
        captureFrameRate
    };
}

/**
 * Start the audio only screen sharing flow. Function will switch between off and on states depending on the context.
 *
 * @param {Object} state - The state of the application.
 * @returns {void}
 */
export function startAudioScreenShareFlow() {
    return (dispatch: Object => Object, getState: () => any) => {
        const state = getState();
        const audioOnlySharing = isAudioOnlySharing(state);

        // If we're already in a normal screen sharing session, warn the user.
        if (isScreenVideoShared(state)) {
            dispatch(openDialog(ShareMediaWarningDialog, { _isAudioScreenShareWarning: true }));

            return;
        }

        // If users opted out of the helper dialog toggle directly.
        // If we're in an electron environment the helper dialog is not needed as there's only one option
        // available for audio screen sharing, namely full window audio.
        // If we're already sharing audio, toggle off.
        if (shouldHideShareAudioHelper(state) || browser.isElectron() || audioOnlySharing) {
            // We don't want to explicity set the screens share state, by passing undefined we let the
            // underlying logic decide if it's on or off.
            dispatch(toggleScreensharing(undefined, true));

            return;
        }

        dispatch(openDialog(ShareAudioDialog));
    };
}

/**
 * Start normal screen sharing flow.Function will switch between off and on states depending on the context, and if
 * not explicity told otherwise.
 *
 * @param {boolean} enabled - Explicitly set the screen sharing state. This has been kept for backward compatibility
 * with the external API exposed by the iframe, even though it might not be used.
 * @returns {void}
 */
export function startScreenShareFlow(enabled: boolean) {
    return (dispatch: Object => Object, getState: () => any) => {
        const state = getState();
        const audioOnlySharing = isAudioOnlySharing(state);

        // If we're in an audio screen sharing session, warn the user.
        if (audioOnlySharing) {
            dispatch(openDialog(ShareMediaWarningDialog, { _isAudioScreenShareWarning: false }));

            return;
        }

        dispatch(toggleScreensharing(enabled));
    };
}
