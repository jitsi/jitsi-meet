import { NativeEventSubscription } from 'react-native';

import { APP_STATE_CHANGED, _SET_APP_STATE_SUBSCRIPTION } from './actionTypes';

/**
 * Sets subscription for app state.
 *
 * @param {Function} subscription - Subscription for the native event.
 * @private
 * @returns {{
 *     type: _SET_APP_STATE_SUBSCRIPTION,
 *     subscription: NativeEventSubscription
 * }}
 */
export function _setAppStateSubscription(subscription?: NativeEventSubscription) {
    return {
        type: _SET_APP_STATE_SUBSCRIPTION,
        subscription
    };
}

/**
 * Signals that the App state has changed (in terms of execution state). The
 * application can be in 3 states: 'active', 'inactive' and 'background'.
 *
 * @param {string} appState - The new App state.
 * @public
 * @returns {{
 *     type: APP_STATE_CHANGED,
 *     appState: string
 * }}
 * @see {@link https://facebook.github.io/react-native/docs/appstate.html}
 */
export function appStateChanged(appState: string) {
    return {
        type: APP_STATE_CHANGED,
        appState
    };
}
