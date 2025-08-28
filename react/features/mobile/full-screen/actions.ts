import { NativeEventSubscription } from 'react-native';

import { _SET_IMMERSIVE_SUBSCRIPTION } from './actionTypes';

/**
 * Sets the change event listener to be used with react-native-immersive's API.
 *
 * @param {Function} subscription - The function to be used with
 * react-native-immersive's API as the change event listener.
 * @protected
 * @returns {{
 *     type: _SET_IMMERSIVE_SUBSCRIPTION,
 *     subscription: ?NativeEventSubscription
 * }}
 */
export function _setImmersiveSubscription(subscription?: NativeEventSubscription) {
    return {
        type: _SET_IMMERSIVE_SUBSCRIPTION,
        subscription
    };
}
