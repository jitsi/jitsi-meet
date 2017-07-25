import { isRoomValid } from '../base/conference';
import { RouteRegistry } from '../base/react';
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
export function _getRouteToRender(stateOrGetState) {
    const state
        = typeof stateOrGetState === 'function'
            ? stateOrGetState()
            : stateOrGetState;
    const { room } = state['features/base/conference'];
    let component;

    if (isRoomValid(room)) {
        component = Conference;
    } else {
        // The value of the App prop welcomePageEnabled was stored in redux in
        // saghul's PR. But I removed the redux state, action, action type, etc.
        // because I didn't like the name. We are not using the prop is a
        // React-ive way anyway so it's all the same difference.
        const { app } = state['features/app'];

        component = app && app.props.welcomePageEnabled ? WelcomePage : null;
    }

    return RouteRegistry.getRouteByComponent(component);
}
