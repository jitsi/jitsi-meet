import { isRoomValid } from '../base/conference';
import { RouteRegistry } from '../base/react';
import { Conference } from '../conference';
import { WelcomePage } from '../welcome';

import { _configureLoggingLevels } from './functions.common';


/**
 * Finish initialization of app. Once the web APP has been refactored this might
 * need to be moved.
 *
 * @returns {void}
 */
export function init() {
    // FIXME The logging config should be part of the global config and thus
    // initialized elsewhere. We are adding this here as a stopgap to make
    // debugging more pleasant.
    const config = {
        defaultLogLevel: 'trace',
        'modules/xmpp/strophe.util.js': 'log',
        'modules/statistics/CallStats.js': 'info'
    };

    _configureLoggingLevels(config);
}

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Object|Function)} stateOrGetState - Redux state or Regux getState()
 * method.
 * @returns {Route}
 */
export function _getRouteToRender(stateOrGetState) {
    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;
    const room = state['features/base/conference'].room;
    const component = isRoomValid(room) ? Conference : WelcomePage;

    return RouteRegistry.getRouteByComponent(component);
}

