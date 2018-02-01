// @flow

import {
    _SET_PIP_LISTENERS,
    REQUEST_PIP_MODE
} from './actionTypes';

/**
 * Sets the listeners for the PiP related events.
 *
 * @param {Array} listeners - Array of listeners to be set.
 * @protected
 * @returns {{
 *     type: _SET_PIP_LISTENERS,
 *     listeners: Array
 * }}
 */
export function _setListeners(listeners: ?Array<any>) {
    return {
        type: _SET_PIP_LISTENERS,
        listeners
    };
}

/**
 * Requests Picture-in-Picture mode.
 *
 * @public
 * @returns {{
 *     type: REQUEST_PIP_MODE
 * }}
 */
export function requestPipMode() {
    return {
        type: REQUEST_PIP_MODE
    };
}
