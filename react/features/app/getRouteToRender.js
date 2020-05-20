// @flow

import { generateRoomWithoutSeparator } from 'js-utils/random';
import type { Component } from 'react';

import { isRoomValid } from '../base/conference';
import { isSupportedBrowser } from '../base/environment';
import { toState } from '../base/redux';
import { Conference } from '../conference';
import { getDeepLinkingPage } from '../deep-linking';
import { UnsupportedDesktopBrowser } from '../unsupported-browser';
import {
    BlankPage,
    WelcomePage,
    isWelcomePageAppEnabled,
    isWelcomePageUserEnabled
} from '../welcome';

/**
 * Object describing application route.
 *
 * @typedef {Object} Route
 * @property {Component} component - React Component constructor.
 * @property {string|undefined} href - New location, in case navigation involves
 * a location change.
 */
export type Route = {
    component: Class<Component<*>>,
    href: ?string
};

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Function|Object)} stateful - THe redux store, state, or
 * {@code getState} function.
 * @returns {Promise<Route>}
 */
export function _getRouteToRender(stateful: Function | Object): Promise<Route> {
    const state = toState(stateful);

    if (navigator.product === 'ReactNative') {
        return _getMobileRoute(state);
    }

    return _getWebConferenceRoute(state) || _getWebWelcomePageRoute(state);
}

/**
 * Returns the {@code Route} to display on the React Native app.
 *
 * @param {Object} state - The redux state.
 * @returns {Promise<Route>}
 */
function _getMobileRoute(state): Promise<Route> {
    const route = _getEmptyRoute();

    if (isRoomValid(state['features/base/conference'].room)) {
        route.component = Conference;
    } else if (isWelcomePageAppEnabled(state)) {
        route.component = WelcomePage;
    } else {
        route.component = BlankPage;
    }

    return Promise.resolve(route);
}

/**
 * Returns the {@code Route} to display when trying to access a conference if
 * a valid conference is being joined.
 *
 * @param {Object} state - The redux state.
 * @returns {Promise<Route>|undefined}
 */
function _getWebConferenceRoute(state): ?Promise<Route> {
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
 * @returns {Promise<Route>}
 */
function _getWebWelcomePageRoute(state): Promise<Route> {
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
 * @returns {Route}
 */
function _getEmptyRoute(): Route {
    return {
        component: BlankPage,
        href: undefined
    };
}
