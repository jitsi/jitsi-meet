// @flow

import { getAppProp } from '../base/app';
import { toState } from '../base/redux';
import { getServerURL } from '../base/settings';

/**
 * Retrieves the default URL for the app. This can either come from a prop to
 * the root App component or be configured in the settings.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState}
 * function.
 * @returns {string} - Default URL for the app.
 */
export function getDefaultURL(stateful: Function | Object) {
    const state = toState(stateful);
    const { app } = state['features/base/app'];

    // If the execution environment provides a Location abstraction (e.g. a Web
    // browser), then we'll presume it's the one and only base URL it can be on.
    const windowLocation = app.getWindowLocation();

    if (windowLocation) {
        const href = windowLocation.toString();

        if (href) {
            return href;
        }
    }

    return getAppProp(state, 'defaultURL') || getServerURL(state);
}
