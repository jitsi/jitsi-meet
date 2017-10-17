/* @flow */

import { isRoomValid } from '../base/conference';
import { RouteRegistry } from '../base/react';
import { toState } from '../base/redux';
import { Conference } from '../conference';
import { WelcomePage } from '../welcome';

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Object|Function)} stateOrGetState - Redux state or Regux getState()
 * method.
 * @returns {Route}
 */
export function _getRouteToRender(stateOrGetState: Object | Function) {
    const { room } = toState(stateOrGetState)['features/base/conference'];
    const component = isRoomValid(room) ? Conference : WelcomePage;

    return RouteRegistry.getRouteByComponent(component);
}
