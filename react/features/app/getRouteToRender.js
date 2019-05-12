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

    return new Promise(resolve => {
        // First, check if the current endpoint supports WebRTC. We are
        // intentionally not performing the check for mobile browsers because:
        // - the WelcomePage is mobile ready;
        // - if the URL points to a conference, getDeepLinkingPage will take
        //   care of it.
        if (!isMobileBrowser && !JitsiMeetJS.isWebRtcSupported()) {
            route.component = UnsupportedDesktopBrowser;
            resolve(route);

            return;
        }

        if (isRoomValid(room)) {
            if (isMobileApp) {
                route.component = Conference;
                resolve(route);
            } else {
                // Update the location if it doesn't match. This happens when a
                // room is joined from the welcome page. The reason for doing
                // this instead of using the history API is that we want to load
                // the config.js which takes the room into account.
                const { locationURL } = state['features/base/connection'];

                // eslint-disable-next-line no-negated-condition
                if (window.location.href !== locationURL.href) {
                    route.href = locationURL.href;
                    resolve(route);
                } else {
                    // Maybe show deep-linking, otherwise go to Conference.
                    getDeepLinkingPage(state).then(component => {
                        route.component = component || Conference;
                        resolve(route);
                    });
                }
            }

            return;
        }

        if (!isWelcomePageUserEnabled(state)) {
            // Web: if the welcome page is disabled, go directly to a random
            // room.

            let href = window.location.href;

            href.endsWith('/') || (href += '/');
            route.href = href + generateRoomWithoutSeparator();
        } else if (isWelcomePageAppEnabled(state)) {
            // Mobile: only go to the welcome page if enabled.

            route.component = WelcomePage;
        }

        resolve(route);
    });
}
