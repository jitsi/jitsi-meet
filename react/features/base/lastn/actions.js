// @flow

import { SET_APPLIED_LAST_N, SET_CONFIG_LAST_N } from './actionTypes';

/**
 * Sets the applicable last-n, i.e., the number of remote videos to be requested from the bridge for the conference.
 *
 * @param {number} appliedLastN - The number of remote videos to be requested.
 * @returns {{
 *     type: SET_APPLIED_LAST_N,
 *     appliedLastN: number
 * }}
 */
export function setAppliedLastN(appliedLastN: number) {
    return {
        type: SET_APPLIED_LAST_N,
        appliedLastN
    };
}

/**
 * Sets the configured last-n, i.e., the number of remote videos to be requested from the bridge for the conference
 * considering the user's configuration, e.g., videoQualitySlider.
 *
 * @param {number} configLastN - The number of remote videos to be requested.
 * @returns {{
 *     type: SET_CONFIG_LAST_N,
 *     configLastN: number
 * }}
*/
export function setConfigLastN(configLastN: number) {
    return {
        type: SET_CONFIG_LAST_N,
        configLastN
    };
}
