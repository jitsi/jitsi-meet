import {
    SET_AUDIO_MUTED,
    SET_CAMERA_FACING_MODE,
    SET_VIDEO_MUTED
} from './actionTypes';
import { CAMERA_FACING_MODE } from './constants';
import './middleware';
import './reducer';

/**
 * Action to change the local audio muted state.
 *
 * @param {boolean} muted - If local audio is muted.
 * @returns {{
 *      type: SET_AUDIO_MUTED,
 *      muted: boolean
 *  }}
 */
export function setAudioMuted(muted) {
    return {
        type: SET_AUDIO_MUTED,
        muted
    };
}

/**
 * Action to change the facing mode of the local video camera.
 *
 * @param {CAMERA_FACING_MODE} cameraFacingMode - Camera facing mode.
 * @returns {{
 *      type: SET_CAMERA_FACING_MODE,
 *      cameraFacingMode: CAMERA_FACING_MODE
 *  }}
 */
export function setCameraFacingMode(cameraFacingMode) {
    return {
        type: SET_CAMERA_FACING_MODE,
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

        return dispatch(setAudioMuted(!muted));
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

        return dispatch(setCameraFacingMode(cameraFacingMode));
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

        return dispatch(setVideoMuted(!muted));
    };
}

/**
 * Action to change the local video muted state.
 *
 * @param {boolean} muted - If local video is muted.
 * @returns {{
 *      type: SET_VIDEO_MUTED,
 *      muted: boolean
 *  }}
 */
export function setVideoMuted(muted) {
    return {
        type: SET_VIDEO_MUTED,
        muted
    };
}
