// @flow

import { SET_DENOISE_STATE
} from './actionTypes';

/**
 * Updates the capture frame rate for screenshare in redux.
 *
 * @param {number} isDenoiseActive - The frame rate to be used for screenshare.
 * @returns {{
 *      type: SET_DENOISE_STATE,
 *      captureFrameRate: number
 * }}
 */
export function setDenoiseState(isDenoiseActive: boolean) {
    return {
        type: SET_DENOISE_STATE,
        isDenoiseActive
    };
}
