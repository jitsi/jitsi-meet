/* @flow */

import { RouteRegistry } from '../base/react';

import { WelcomePage } from './components';
import {
    generateRoomWithoutSeparator,
    isWelcomePageAppEnabled,
    isWelcomePageUserEnabled
} from './functions';

/**
 * Register route for <tt>WelcomePage</tt>.
 */
RouteRegistry.register({
    component: WelcomePage,
    onEnter,
    path: '/'
});

/**
 * Skips the <tt>WelcomePage</tt> if it is disabled (by the app or the user).
 *
 * @param {Object} store - The redux store.
 * @param {Function} replace - The function to redirect to another path.
 * @returns {void}
 */
function onEnter({ getState }, replace) {
    if (isWelcomePageAppEnabled(getState)) {
        isWelcomePageUserEnabled(getState)
            || replace(`/${generateRoomWithoutSeparator()}`);
    } else {
        replace(undefined);
    }
}
