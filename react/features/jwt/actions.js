/* @flow */

import { SET_TOKEN_DATA } from './actionTypes';

/**
 * Sets new token data in Redux store.
 *
 * @param {TokenData} tokenData - Instance of TokenData class.
 * @returns {Object}
 */
export function setTokenData(tokenData: Object) {
    return {
        type: SET_TOKEN_DATA,
        tokenData
    };
}
