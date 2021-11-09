
import { generateRoomWithoutSeparator } from '@jitsi/js-utils/random';

import { isRoomValid } from '../base/conference';
import { isSupportedBrowser } from '../base/environment';
import { toState } from '../base/redux';
import { Conference } from '../conference';
import { getDeepLinkingPage } from '../deep-linking';
import { UnsupportedDesktopBrowser } from '../unsupported-browser';
import { BlankPage, isWelcomePageUserEnabled, WelcomePage } from '../welcome';

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Function|Object)} stateful - THe redux store, state, or
 * {@code getState} function.
 * @returns {Promise<Object>}
 */
export function _getRouteToRender(stateful) {
    const state = toState(stateful);

    return _getWebConferenceRoute(state) || _getWebWelcomePageRoute(state);
}

/**
 * Returns the {@code Route} to display when trying to access a conference if
 * a valid conference is being joined.
 *
 * @param {Object} state - The redux state.
 * @returns {Promise|undefined}
 */
function _getWebConferenceRoute(state) {
    if (!isRoomValid(state['features/base/conference'].room)) {
        return;
    }

    const route = _getEmptyRoute();

    // Update the location if it doesn't match. This happens when a room is
    // joined from the welcome page. The reason for doing this instead of using
    // the history API is that we want to load the config.js which takes the
    // room into account.
    const { locationURL } = state['features/base/connection'];

    if (window.location.href !== locationURL.href) {
        route.href = locationURL.href;

        return Promise.resolve(route);
    }

    return getDeepLinkingPage(state)
        .then(deepLinkComponent => {
            if (deepLinkComponent) {
                route.component = deepLinkComponent;
            } else if (isSupportedBrowser()) {
                route.component = Conference;
            } else {
                route.component = UnsupportedDesktopBrowser;
            }

            return route;
        });
}

/**
 * Returns the {@code Route} to display when trying to access the welcome page.
 *
 * @param {Object} state - The redux state.
 * @returns {Promise<Object>}
 */
function _getWebWelcomePageRoute(state) {
    const route = _getEmptyRoute();

    if (isWelcomePageUserEnabled(state)) {
        if (isSupportedBrowser()) {
            route.component = WelcomePage;
        } else {
            route.component = UnsupportedDesktopBrowser;
        }
    } else {
        // Web: if the welcome page is disabled, go directly to a random room.

        let href = window.location.href;

        href.endsWith('/') || (href += '/');
        route.href = href + generateRoomWithoutSeparator();
    }

    return Promise.resolve(route);
}

/**
 * Returns the default {@code Route}.
 *
 * @returns {Object}
 */
function _getEmptyRoute() {
    return {
        component: BlankPage,
        href: undefined
    };
}
