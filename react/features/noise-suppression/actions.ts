import { SET_NOISE_SUPPRESSION_STATE, TOGGLE_NOISE_SUPPRESSION } from './actionTypes';
import { isNoiseSuppressionActive } from './functions';

/**
 * Updates the noise suppression active state.
 *
 * @param {boolean} active - Is noise suppression active.
 * @returns {{
 *      type: SET_NOISE_SUPPRESSION_STATE,
 *      active: boolean
 * }}
 */
export function setNoiseSuppressionState(active: boolean) : any {
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
export function toggleNoiseSuppression() : any {
    return {
        type: TOGGLE_NOISE_SUPPRESSION
    };
}

/**
 * Turns off noise suppression if it's already enabled
 *
 * @returns {Function}
 */
 export function turnOffNoiseSuppression() : Function {
    return async (dispatch: Function, getState: Function) => {
        if (isNoiseSuppressionActive(getState())) {
            await dispatch(toggleNoiseSuppression());
        }
    };
 }