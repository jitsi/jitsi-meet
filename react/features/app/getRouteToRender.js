// @flow

import { generateRoomWithoutSeparator } from 'js-utils/random';
import type { Component } from 'react';

import { isRoomValid } from '../base/conference';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { Platform } from '../base/react';
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
    const { room } = state['features/base/conference'];
    const isMobileApp = navigator.product === 'ReactNative';
    const isMobileBrowser
        = !isMobileApp && (Platform.OS === 'android' || Platform.OS === 'ios');
    const route: Route = {
        component: BlankPage,
        href: undefined
    };

    const joiningValidRoom = isRoomValid(room);

    // Mobile custom routing
    if (isMobileApp) {
        if (joiningValidRoom) {
            route.component = Conference;
        } else if (isWelcomePageAppEnabled(state)) {
            route.component = WelcomePage;
        }

        return Promise.resolve(route);
    }

    // Web custom routing when trying to join a meeting. There are essentially
    // two possible handled routes here: welcome page and conference.

    // We are intentionally not performing the check for mobile browsers because:
    // - the WelcomePage is mobile ready;
    // - if the URL points to a conference, getDeepLinkingPage will take
    //   care of it.
    const isUnsupportedBrowser
        = !isMobileBrowser && !JitsiMeetJS.isWebRtcSupported();

    if (joiningValidRoom) {
        // Update the location if it doesn't match. This happens when a room is
        // joined from the welcome page. The reason for doing this instead of
        // using the history API is that we want to load the config.js which
        // takes the room into account.
        const { locationURL } = state['features/base/connection'];

        if (window.location.href !== locationURL.href) {
            route.href = locationURL.href;

            return Promise.resolve(route);
        }

        return getDeepLinkingPage(state)
            .then(component => {
                if (component) {
                    route.component = component;
                } else if (isUnsupportedBrowser) {
                    route.component = UnsupportedDesktopBrowser;
                } else {
                    route.component = Conference;
                }

                return Promise.resolve(route);
            });
    }

    // Web custom routing when trying to view the welcome page
    if (isWelcomePageUserEnabled(state)) {
        if (isUnsupportedBrowser) {
            route.component = UnsupportedDesktopBrowser;
        } else {
            route.component = WelcomePage;
        }
    } else {
        // Web: if the welcome page is disabled, go directly to a random room.

        let href = window.location.href;

        href.endsWith('/') || (href += '/');
        route.href = href + generateRoomWithoutSeparator();
    }

    return Promise.resolve(route);
}
