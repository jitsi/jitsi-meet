// @flow

import { SET_E2EE_KEY } from './actionTypes';

/**
 * Dispatches an action to set the E2EE key.
 *
 * @param {string|undefined} key - The new key to be used for E2EE.
 * @returns {Object}
 */
export function setE2EEKey(key: ?string) {
    return {
        type: SET_E2EE_KEY,
        key
    };
}
