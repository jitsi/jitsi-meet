import { Dispatch } from 'redux';

import { SET_NOISE_SUPPRESSION_ENABLED } from './actionTypes';
import { isNoiseSuppressionEnabled } from './functions';

/**
 * Updates the noise suppression active state.
 *
 * @param {boolean} enabled - Is noise suppression enabled.
 * @returns {{
 *      type: SET_NOISE_SUPPRESSION_STATE,
 *      enabled: boolean
 * }}
 */
export function setNoiseSuppressionEnabled(enabled: boolean) : any {
    return {
        type: SET_NOISE_SUPPRESSION_ENABLED,
        enabled
    };
}

/**
 *  Enabled/disable noise suppression depending on the current state.
 *
 * @returns {Function}
 */
export function toggleNoiseSuppression() : any {
    return (dispatch: Dispatch, getState: Function) => {
        if (isNoiseSuppressionEnabled(getState())) {
            dispatch(setNoiseSuppressionEnabled(false));
        } else {
            dispatch(setNoiseSuppressionEnabled(true));
        }
    };
}

/**
 * Turns off noise suppression if it's already enabled.
 *
 * @returns {Function}
 */
export function turnOffNoiseSuppression() : Function {
    return async (dispatch: Dispatch, getState: Function) => {
        if (isNoiseSuppressionEnabled(getState())) {
            await dispatch(setNoiseSuppressionEnabled(false));
        }
    };
}
