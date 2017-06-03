/* @flow */

import { RouteRegistry } from '../base/react';

import { WelcomePage } from './components';
import { generateRoomWithoutSeparator } from './roomnameGenerator';

declare var APP: Object;
declare var config: Object;

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
    // The disabling of the Welcome page by redirecting to a random room name is
    // a feature (1) we have on Web/React and (2) we do not want on mobile/React
    // Native (at the time of this writing).
    if (typeof APP === 'object'

            // TODO Technically, there is features/base/config now so it is
            // preferable to read config(uration) values from there and not rely
            // on a global variable. However, the redux store is not available
            // here at the time of this writing. Given the current (1) Web
            // exclusivity of the feature and (2) the reliance on other global
            // variables (e.g. APP), go with the global variable for now in
            // order to minimize the effort involved.
            && !(config.enableWelcomePage
                && APP.settings.isWelcomePageEnabled())) {
        const room = generateRoomWithoutSeparator();

        replace(`/${room}`);
    }
}
