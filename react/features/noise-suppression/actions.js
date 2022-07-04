// @flow

import { SET_NOISE_SUPPRESSION_STATE, TOGGLE_NOISE_SUPPRESSION } from './actionTypes';

/**
 * Updates the noise suppression active state.
 *
 * @param {boolean} active - Is noise suppression active.
 * @returns {{
 *      type: SET_NOISE_SUPPRESSION_STATE,
 *      captureFrameRate: number
 * }}
 */
export function setNoiseSuppressionState(active: boolean) {
    return {
        type: SET_NOISE_SUPPRESSION_STATE,
        active
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
