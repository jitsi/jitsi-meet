/* @flow */

import { isRoomValid } from '../base/conference';
import { RouteRegistry } from '../base/react';
import { Conference } from '../conference';
import { Entryway } from '../welcome';

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
    const { room } = state['features/base/conference'];
    const component = isRoomValid(room) ? Conference : Entryway;

    return RouteRegistry.getRouteByComponent(component);
}
