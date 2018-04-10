/* @flow */

import { toState } from '../base/redux';
import { getDeeplinkingPage } from '../deeplinking';
import {
    PluginRequiredBrowser,
    UnsupportedDesktopBrowser
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
 * @returns {Promise<ReactElement>|void}
 * @type {Function[]}
 */
const _INTERCEPT_COMPONENT_RULES = [
    getDeeplinkingPage,
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
