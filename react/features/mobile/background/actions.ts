import { NativeEventSubscription } from 'react-native';

import { APP_STATE_CHANGED, EVENT_SUBSCRIPTION } from './actionTypes';

/**
 * Sets subscription for a native event.
 *
 * @param {Function} subscription - Subscription for the native event.
 * @protected
 * @returns {{
 *     type: EVENT_SUBSCRIPTION,
 *     subscription: NativeEventSubscription
 * }}
 */
export function eventSubscription(subscription?: NativeEventSubscription) {
    return {
        type: EVENT_SUBSCRIPTION,
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
