/* @flow */

import type { Dispatch } from 'redux';

import {
    SET_AUDIO_MUTED,
    SET_CAMERA_FACING_MODE,
    SET_VIDEO_AVAILABLE,
    SET_VIDEO_MUTED,
    TOGGLE_CAMERA_FACING_MODE
} from './actionTypes';
import { CAMERA_FACING_MODE } from './constants';

/**
 * Action to set the muted state of the local audio.
 *
 * @param {boolean} muted - True if the local audio is to be muted or false if
 * the local audio is to be unmuted.
 * @returns {{
 *      type: SET_AUDIO_MUTED,
 *      muted: boolean
 *  }}
 */
export function setAudioMuted(muted: boolean) {
    return {
        type: SET_AUDIO_MUTED,
        muted
    };
}

/**
 * Action to set the facing mode of the local camera.
 *
 * @param {CAMERA_FACING_MODE} cameraFacingMode - The camera facing mode to set.
 * @returns {{
 *      type: SET_CAMERA_FACING_MODE,
 *      cameraFacingMode: CAMERA_FACING_MODE
 *  }}
 */
export function setCameraFacingMode(cameraFacingMode: CAMERA_FACING_MODE) {
    return {
        type: SET_CAMERA_FACING_MODE,
        cameraFacingMode
    };
}

/**
 * Action to adjust the availability of the local video.
 *
 * @param {boolean} available - True if the local video is to be marked as
 * available or false if the local video is not available.
 * @returns {{
 *      type: SET_VIDEO_AVAILABLE,
 *      available: boolean
 *  }}
 */
export function setVideoAvailable(available: boolean) {
    return {
        type: SET_VIDEO_AVAILABLE,
        available
    };
}

/**
 * Action to set the muted state of the local video.
 *
 * @param {boolean} muted - True if the local video is to be muted or false if
 * the local video is to be unmuted.
 * @returns {{
 *      type: SET_VIDEO_MUTED,
 *      muted: boolean
 *  }}
 */
export function setVideoMuted(muted: boolean) {
    return {
        type: SET_VIDEO_MUTED,
        muted
    };
}

/**
 * Toggles the mute state of the local audio track(s).
 *
 * @returns {Function}
 */
export function toggleAudioMuted() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const muted = getState()['features/base/media'].audio.muted;

        return dispatch(setAudioMuted(!muted));
    };
}

/**
 * Toggles the camera facing mode. Most commonly, for example, mobile devices
 * such as phones have a front/user-facing and a back/environment-facing
 * cameras. In contrast to setCameraFacingMode, allows the toggling to be
 * optimally and/or natively implemented without the overhead of separate reads
 * and writes of the current/effective camera facing mode.
 *
 * @returns {{
 *     type: TOGGLE_CAMERA_FACING_MODE
 * }}
 */
export function toggleCameraFacingMode() {
    return {
        type: TOGGLE_CAMERA_FACING_MODE
    };
}

/**
 * Toggles the mute state of the local video track(s).
 *
 * @returns {Function}
 */
export function toggleVideoMuted() {
    return (dispatch: Dispatch<*>, getState: Function) => {
        const muted = getState()['features/base/media'].video.muted;

        return dispatch(setVideoMuted(!muted));
    };
}
