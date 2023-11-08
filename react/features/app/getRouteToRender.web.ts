// @ts-expect-error
import { generateRoomWithoutSeparator } from '@jitsi/js-utils/random';

import { getTokenAuthUrl } from '../authentication/functions.web';
import { IStateful } from '../base/app/types';
import { isRoomValid } from '../base/conference/functions';
import { isSupportedBrowser } from '../base/environment/environment';
import { browser } from '../base/lib-jitsi-meet';
import { toState } from '../base/redux/functions';
import { parseURIString } from '../base/util/uri';
import Conference from '../conference/components/web/Conference';
import { getDeepLinkingPage } from '../deep-linking/functions';
import UnsupportedDesktopBrowser from '../unsupported-browser/components/UnsupportedDesktopBrowser';
import BlankPage from '../welcome/components/BlankPage.web';
import WelcomePage from '../welcome/components/WelcomePage.web';
import { getCustomLandingPageURL, isWelcomePageEnabled } from '../welcome/functions';

import { IReduxState } from './types';

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Function|Object)} stateful - THe redux store, state, or
 * {@code getState} function.
 * @returns {Promise<Object>}
 */
export function _getRouteToRender(stateful: IStateful) {
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
function _getWebConferenceRoute(state: IReduxState) {
    const room = state['features/base/conference'].room;

    if (!isRoomValid(room)) {
        return;
    }

    const route = _getEmptyRoute();
    const config = state['features/base/config'];

    // if we have auto redirect enabled, and we have previously logged in successfully
    // let's redirect to the auth url to get the token and login again
    if (!browser.isElectron() && config.tokenAuthUrl && config.tokenAuthUrlAutoRedirect
            && state['features/authentication'].tokenAuthUrlSuccessful
            && !state['features/base/jwt'].jwt && room) {
        const { locationURL = { href: '' } as URL } = state['features/base/connection'];
        const { tenant } = parseURIString(locationURL.href) || {};
        const { startAudioOnly } = config;

        return getTokenAuthUrl(startAudioOnly, config, room, tenant, false, locationURL)
            .then((url: string | undefined) => {
                route.href = url;

                return route;
            })
            .catch(() => Promise.resolve(route));
    }

    // Update the location if it doesn't match. This happens when a room is
    // joined from the welcome page. The reason for doing this instead of using
    // the history API is that we want to load the config.js which takes the
    // room into account.
    const { locationURL } = state['features/base/connection'];

    if (window.location.href !== locationURL?.href) {
        route.href = locationURL?.href;

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
function _getWebWelcomePageRoute(state: IReduxState) {
    const route = _getEmptyRoute();

    if (isWelcomePageEnabled(state)) {
        if (isSupportedBrowser()) {
            const customLandingPage = getCustomLandingPageURL(state);

            if (customLandingPage) {
                route.href = customLandingPage;
            } else {
                route.component = WelcomePage;
            }
        } else {
            route.component = UnsupportedDesktopBrowser;
        }
    } else {
        // Web: if the welcome page is disabled, go directly to a random room.
        const url = new URL(window.location.href);

        url.pathname += generateRoomWithoutSeparator();
        route.href = url.href;
    }

    return Promise.resolve(route);
}

/**
 * Returns the default {@code Route}.
 *
 * @returns {Object}
 */
function _getEmptyRoute(): {
    component: React.ReactNode;
    href?: string;
    } {
    return {
        component: BlankPage,
        href: undefined
    };
}
