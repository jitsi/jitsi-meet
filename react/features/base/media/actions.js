import {
    AUDIO_MUTED_CHANGED,
    CAMERA_FACING_MODE_CHANGED,
    VIDEO_MUTED_CHANGED
} from './actionTypes';
import { CAMERA_FACING_MODE } from './constants';
import './middleware';
import './reducer';

/**
 * Action to signal the change in local audio muted state.
 *
 * @param {boolean} muted - If local audio is muted.
 * @returns {{
 *      type: AUDIO_MUTED_CHANGED,
 *      muted: boolean
 *  }}
 */
export function audioMutedChanged(muted) {
    return {
        type: AUDIO_MUTED_CHANGED,
        muted
    };
}

/**
 * Action to signal the change in facing mode of local video camera.
 *
 * @param {CAMERA_FACING_MODE} cameraFacingMode - Camera facing mode.
 * @returns {{
 *      type: CAMERA_FACING_MODE_CHANGED,
 *      cameraFacingMode: CAMERA_FACING_MODE
 *  }}
 */
export function cameraFacingModeChanged(cameraFacingMode) {
    return {
        type: CAMERA_FACING_MODE_CHANGED,
        cameraFacingMode
    };
}

/**
 * Toggles the mute state of the local audio track(s).
 *
 * @returns {Function}
 */
export function toggleAudioMuted() {
    return (dispatch, getState) => {
        const muted = getState()['features/base/media'].audio.muted;

        return dispatch(audioMutedChanged(!muted));
    };
}

/**
 * Toggles the camera between front and rear (user and environment).
 *
 * @returns {Function}
 */
export function toggleCameraFacingMode() {
    return (dispatch, getState) => {
        let cameraFacingMode
            = getState()['features/base/media'].video.facingMode;

        cameraFacingMode
            = cameraFacingMode === CAMERA_FACING_MODE.USER
                ? CAMERA_FACING_MODE.ENVIRONMENT
                : CAMERA_FACING_MODE.USER;

        return dispatch(cameraFacingModeChanged(cameraFacingMode));
    };
}

/**
 * Toggles the mute state of the local video track(s).
 *
 * @returns {Function}
 */
export function toggleVideoMuted() {
    return (dispatch, getState) => {
        const muted = getState()['features/base/media'].video.muted;

        return dispatch(videoMutedChanged(!muted));
    };
}

/**
 * Action to signal the change in local video muted state.
 *
 * @param {boolean} muted - If local video is muted.
 * @returns {{
 *      type: VIDEO_MUTED_CHANGED,
 *      muted: boolean
 *  }}
 */
export function videoMutedChanged(muted) {
    return {
        type: VIDEO_MUTED_CHANGED,
        muted
    };
}
