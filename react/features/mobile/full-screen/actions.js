// @flow

import { _SET_IMMERSIVE_LISTENER } from './actionTypes';

/**
 * Sets the listener to be used with React Native's Immersive API.
 *
 * @param {Function} listener - Function to be set as the change event listener.
 * @protected
 * @returns {{
 *     type: _SET_IMMERSIVE_LISTENER,
 *     listener: Function
 * }}
 */
export function _setImmersiveListener(listener: ?Function) {
    return {
        type: _SET_IMMERSIVE_LISTENER,
        listener
    };
}
