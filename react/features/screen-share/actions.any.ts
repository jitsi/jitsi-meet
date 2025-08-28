import {
    SET_SCREENSHARE_CAPTURE_FRAME_RATE
} from './actionTypes';

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
