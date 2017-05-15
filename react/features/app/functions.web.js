/* @flow */

import Logger from 'jitsi-meet-logger';

import { isRoomValid } from '../base/conference';
import JitsiMeetJS from '../base/lib-jitsi-meet';
import { Platform, RouteRegistry } from '../base/react';
import { Conference } from '../conference';
import {
    NoMobileApp,
    PluginRequiredBrowser,
    UnsupportedDesktopBrowser,
    UnsupportedMobileBrowser
} from '../unsupported-browser';
import { WelcomePage } from '../welcome';

import KeyboardShortcut
    from '../../../modules/keyboardshortcut/keyboardshortcut';
import JitsiMeetLogStorage from '../../../modules/util/JitsiMeetLogStorage';

declare var APP: Object;
declare var interfaceConfig: Object;
declare var loggingConfig: Object;

/**
 * Array of rules defining whether we should {@link _interceptComponent} to
 * render.
 *
 * @private
 * @param {Object} state - Object containing current Redux state.
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
     * @param {Object} state - Redux state of the app.
     * @returns {UnsupportedMobileBrowser|void} If the rule is satisfied then
     * we should intercept existing component by UnsupportedMobileBrowser.
     */
    () => {
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
            // If webRTCReady is not set, then we cannot use it to take a
            // decision.
            break;

        default:
            return PluginRequiredBrowser;
        }
    }
];

export { getLocationContextRoot, _parseURIString } from './functions.native';

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Object|Function)} stateOrGetState - Redux state or Regux getState()
 * method.
 * @returns {Route}
 */
export function _getRouteToRender(stateOrGetState: Object | Function) {
    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;

    // If mobile browser page was shown, there is no need to show it again.
    const { room } = state['features/base/conference'];
    const component = isRoomValid(room) ? Conference : WelcomePage;
    const route = RouteRegistry.getRouteByComponent(component);

    // Intercepts route components if any of component interceptor rules
    // is satisfied.
    route.component = _interceptComponent(state, component);

    return route;
}

/**
 * Temporary solution. Later we'll get rid of global APP and set its properties
 * in redux store.
 *
 * @param {Object} state - Snapshot of current state of redux store.
 * @returns {void}
 */
export function init(state: Object) {
    _initLogging();

    APP.keyboardshortcut = KeyboardShortcut;

    const { jwt } = state['features/jwt'];

    // Force enable the API if jwt token is passed because most probably
    // jitsi meet is displayed inside of wrapper that will need to communicate
    // with jitsi meet.
    APP.API.init(jwt ? { forceEnable: true } : undefined);

    APP.translation.init();
}

/**
 * Initializes logging in the app.
 *
 * @private
 * @returns {void}
 */
function _initLogging() {
    // Create the LogCollector and register it as the global log transport. It
    // is done early to capture as much logs as possible. Captured logs will be
    // cached, before the JitsiMeetLogStorage gets ready (statistics module is
    // initialized).
    if (!APP.logCollector && !loggingConfig.disableLogCollector) {
        APP.logCollector = new Logger.LogCollector(new JitsiMeetLogStorage());
        Logger.addGlobalTransport(APP.logCollector);
        JitsiMeetJS.addGlobalLogTransport(APP.logCollector);
    }
}

/**
 * Intercepts route components based on a {@link _INTERCEPT_COMPONENT_RULES}.
 *
 * @param {Object|Function} stateOrGetState - Either Redux state object or
 * getState() function.
 * @param {ReactElement} component - Current route component to render.
 * @private
 * @returns {ReactElement} If any of the pre-defined rules is satisfied, returns
 * intercepted component.
 */
function _interceptComponent(
        stateOrGetState: Object,
        component: ReactElement<*>) {
    let result;
    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;

    for (const rule of _INTERCEPT_COMPONENT_RULES) {
        result = rule(state);
        if (result) {
            break;
        }
    }

    return result || component;
}
