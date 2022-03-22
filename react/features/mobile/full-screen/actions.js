// @flow

import { _SET_IMMERSIVE_LISTENER } from './actionTypes';

/**
 * Sets the change event listener to be used with react-native-immersive's API.
 *
 * @param {Function} [listener] - The function to be used with
 * react-native-immersive's API as the change event listener.
 * @protected
 * @returns {{
 *     type: _SET_IMMERSIVE_LISTENER,
 *     listener: ?Function
 * }}
 */
export function _setImmersiveListener(listener: ?Function) {
    return {
        type: _SET_IMMERSIVE_LISTENER,
        listener
    };
}
