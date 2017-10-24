/* @flow */

import { Platform } from '../base/react';
import { toState } from '../base/redux';
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
     * This rule describes case when user opens application using mobile
     * browser. In order to promote the app, we choose to suggest the mobile
     * app even if the browser supports the app (e.g. Google Chrome with
     * WebRTC support on Android).
     *
     * @param {Object} state - The redux state of the app.
     * @returns {UnsupportedMobileBrowser|void} If the rule is satisfied then
     * we should intercept existing component by UnsupportedMobileBrowser.
     */
    // eslint-disable-next-line no-unused-vars
    state => {
        const OS = Platform.OS;

        if (OS === 'android' || OS === 'ios') {
            const mobileAppPromo
                = typeof interfaceConfig === 'object'
                    && interfaceConfig.MOBILE_APP_PROMO;

            return (
                typeof mobileAppPromo === 'undefined' || Boolean(mobileAppPromo)
                    ? UnsupportedMobileBrowser
                    : NoMobileApp);
        }
    },
    state => {
        const { webRTCReady } = state['features/base/lib-jitsi-meet'];

        switch (typeof webRTCReady) {
        case 'boolean':
            if (webRTCReady === false) {
                return UnsupportedDesktopBrowser;
            }
            break;

        case 'undefined':
            // If webRTCReady is not set, then we cannot base a decision on it.
            break;

        default:
            return PluginRequiredBrowser;
        }
    }
];

/**
 * Determines which route is to be rendered in order to depict a specific redux
 * store.
 *
 * @param {(Object|Function)} stateOrGetState - The redux state or
 * {@link getState} function.
 * @returns {Route}
 */
export function _getRouteToRender(stateOrGetState: Object | Function) {
    const route = _super_getRouteToRender(stateOrGetState);

    // Intercepts route components if any of component interceptor rules is
    // satisfied.
    route.component = _interceptComponent(stateOrGetState, route.component);

    return route;
}

/**
 * Intercepts route components based on a {@link _INTERCEPT_COMPONENT_RULES}.
 *
 * @param {Object|Function} stateOrGetState - The redux state or
 * {@link getState} function.
 * @param {ReactElement} component - Current route component to render.
 * @private
 * @returns {ReactElement} If any of the pre-defined rules is satisfied, returns
 * intercepted component.
 */
function _interceptComponent(
        stateOrGetState: Object | Function,
        component: React$Element<*>) {
    let result;
    const state = toState(stateOrGetState);

    for (const rule of _INTERCEPT_COMPONENT_RULES) {
        result = rule(state);
        if (result) {
            break;
        }
    }

    return result || component;
}

/**
 * Returns application name.
 *
 * @returns {string} The application name.
 */
export function getName() {
    return interfaceConfig.APP_NAME;
}
