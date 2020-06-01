// @flow

import {
    SET_MINIMIZED_ENABLED
} from './actionTypes';

/**
 * Sets whether the minimized is enabled.
 *
 * @param {boolean} enabled - Whether the minimized is enabled.
 * @returns {{
 *     type: SET_MINIMIZED_ENABLED,
 *     enabled: boolean
 * }}
 */
export function setMinimizedEnabled(enabled: boolean) {
    return {
        type: SET_MINIMIZED_ENABLED,
        enabled
    };
}
