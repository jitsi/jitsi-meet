/* global APP */

import { RouteRegistry } from '../base/react';

import { WelcomePage } from './components';
import { generateRoomWithoutSeparator } from './roomnameGenerator';

/**
 * Register route for WelcomePage.
 */
RouteRegistry.register({
    component: WelcomePage,
    onEnter,
    path: '/'
});

/**
 * If the Welcome page/screen is disabled, generates a (random) room (name) so
 * that the Welcome page/screen is skipped and the Conference page/screen is
 * presented instead.
 *
 * @param {Object} nextState - The next Router state.
 * @param {Function} replace - The function to redirect to another path.
 * @returns {void}
 */
function onEnter(nextState, replace) {
    if (typeof APP !== 'undefined' && !APP.settings.isWelcomePageEnabled()) {
        const room = generateRoomWithoutSeparator();

        replace(`/${room}`);
    }
}
