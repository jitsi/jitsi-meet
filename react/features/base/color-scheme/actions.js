// @flow

import { SET_COLOR_SCHEME } from './actionTypes';

/**
 * Dispatches a Redux action to set the color scheme of the app/sdk.
 *
 * @param {Object} colorScheme - The color scheme to set.
 * @returns {{
 *     type: SET_COLOR_SCHEME,
 *     colorScheme: Object
 * }}
 */
export function setColorScheme(colorScheme: Object): Object {
    return {
        type: SET_COLOR_SCHEME,
        colorScheme
    };
}
