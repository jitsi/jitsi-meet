// @flow

import { SET_LAST_N } from './actionTypes';

/**
 * Sets the last-n, i.e., the number of remote videos to be requested from the bridge for the conference.
 *
 * @param {number} lastN - The number of remote videos to be requested.
 * @returns {{
 *     type: SET_LAST_N,
 *     lastN: number
 * }}
 */
export function setLastN(lastN: number) {
    return {
        type: SET_LAST_N,
        lastN
    };
}
