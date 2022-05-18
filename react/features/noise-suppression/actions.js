// @flow

import { SET_NOISE_SUPPRESSION_STATE, TOGGLE_NOISE_SUPPRESSION } from './actionTypes';

/**
 * Updates the noise suppression active state.
 *
 * @param {boolean} noiseSuppressionActive - is noise suppression active
 * @returns {{
 *      type: SET_NOISE_SUPPRESSION_STATE,
 *      captureFrameRate: number
 * }}
 */
export function setNoiseSuppressionState(noiseSuppressionActive: boolean) {
    return {
        type: SET_NOISE_SUPPRESSION_STATE,
        isNoiseSuppressionActive: noiseSuppressionActive
    };
}

/**
 * Signals that noise suppression action has been triggered.
 *
 * @returns {{
 *     type: TOGGLE_NOISE_SUPPRESSION,
 * }}
 */
export function toggleNoiseSuppression() {
    return {
        type: TOGGLE_NOISE_SUPPRESSION
    };
}
