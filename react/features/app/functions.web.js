/* @flow */

import { Platform } from '../base/react';
import { toState } from '../base/redux';
import {
    DeeplinkingDesktopPage,
    isDeeplinkingEnabled,
    shouldShowDeeplinkingPage
} from '../deeplinking';

import {
    NoMobileApp,
    PluginRequiredBrowser,
    UnsupportedDesktopBrowser,
    UnsupportedMobileBrowser
} from '../unsupported-browser';

import {
    // eslint-disable-next-line camelcase
    _getRouteToRender as _super_getRouteToRender
} from './getRouteToRender';

declare var APP: Object;
declare var interfaceConfig: Object;
declare var loggingConfig: Object;

/**
 * Array of rules defining whether we should {@link _interceptComponent} to
 * render.
 *
 * @private
 * @param {Object} state - Object containing current redux state.
 * @returns {ReactElement|void}
 * @type {Function[]}
 */
const _INTERCEPT_COMPONENT_RULES = [

    /**
     * This rule describes case when user opens application using a
     * browser. In order to promote the app, we choose to suggest the desktop
     * app even if the browser supports the web app.
     *
     * @param {Object} state - The redux state of the app.
     * @returns {Promise<DeeplinkingDesktopPage|undefined>} - If the rule is
     * satisfied then we should intercept existing component by
     * DeeplinkingDesktopPage.
     */
    state => {
        const { launchInWeb } = state['features/deeplinking'];

        if (!isDeeplinkingEnabled() || launchInWeb) {
            return Promise.resolve();
        }

        const OS = Platform.OS;

        if (OS === 'android' || OS === 'ios') { // mobile
            // TODO return the page for mobile.
            return Promise.resolve();
        }

        // desktop
        return shouldShowDeeplinkingPage().then(
            // eslint-disable-next-line no-confusing-arrow
            show => show ? DeeplinkingDesktopPage : undefined);
    },

    /**
     * This rule describes case when user opens application using mobile
     * browser and is attempting to join a conference. In order to promote the
     * app, we choose to suggest the mobile app even if the browser supports the
     * app (e.g. Google Chrome with WebRTC support on Android).
     */
    // eslint-disable-next-line no-unused-vars
    state => {
        const OS = Platform.OS;
        const { room } = state['features/base/conference'];
        const isUsingMobileBrowser = OS === 'android' || OS === 'ios';

        /**
         * Checking for presence of a room is done so that interception only
         * occurs when trying to enter a meeting but pages outside of meeting,
         * like WelcomePage, can still display.
         */
        if (room && isUsingMobileBrowser) {
            const mobileAppPromo
                = typeof interfaceConfig === 'object'
                    && interfaceConfig.MOBILE_APP_PROMO;

            return Promise.resolve(
                typeof mobileAppPromo === 'undefined' || Boolean(mobileAppPromo)
                    ? UnsupportedMobileBrowser
                    : NoMobileApp);
        }

        return Promise.resolve();
    },
    state => {
        const { webRTCReady } = state['features/base/lib-jitsi-meet'];

        switch (typeof webRTCReady) {
        case 'boolean':
            if (webRTCReady === false) {
                return Promise.resolve(UnsupportedDesktopBrowser);
            }
            break;

        case 'undefined':
            // If webRTCReady is not set, then we cannot base a decision on it.
            break;

        default:
            return Promise.resolve(PluginRequiredBrowser);
        }

        return Promise.resolve();
    }
];

/**
 * Determines which route is to be rendered in order to depict a specific redux
 * store.
 *
 * @param {(Object|Function)} stateOrGetState - The redux state or
 * {@link getState} function.
 * @returns {Promise<Route>}
 */
export function _getRouteToRender(stateOrGetState: Object | Function): Object {
    const route = _super_getRouteToRender(stateOrGetState);

    // Intercepts route components if any of component interceptor rules is
    // satisfied.
    return _interceptComponent(stateOrGetState, route.component).then(
        (component: React$Element<*>) => {
            route.component = component;

            return route;
        }, () => Promise.resolve(route));
}

/**
 * Intercepts route components based on a {@link _INTERCEPT_COMPONENT_RULES}.
 *
 * @param {Object|Function} stateOrGetState - The redux state or
 * {@link getState} function.
 * @param {ReactElement} component - Current route component to render.
 * @private
 * @returns {Promise<ReactElement>} If any of the pre-defined rules is
 * satisfied, returns intercepted component.
 */
function _interceptComponent(
        stateOrGetState: Object | Function,
        component: React$Element<*>) {
    const state = toState(stateOrGetState);

    const promises = [];

    _INTERCEPT_COMPONENT_RULES.forEach(rule => {
        promises.push(rule(state));
    });

    return Promise.all(promises).then(
        results =>
            results.find(result => typeof result !== 'undefined') || component,
        () => Promise.resolve(component));
}

/**
 * Returns application name.
 *
 * @returns {string} The application name.
 */
export function getName() {
    return interfaceConfig.APP_NAME;
}
