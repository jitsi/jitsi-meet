// @flow

import { SET_SCREEN_AUDIO_SHARE_STATE, SET_SCREENSHARE_CAPTURE_FRAME_RATE } from './actionTypes';

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
