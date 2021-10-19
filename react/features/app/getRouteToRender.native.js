
import { isRoomValid } from '../base/conference';
import { toState } from '../base/redux';
import { ConferenceNavigationContainer } from '../conference';
import { isWelcomePageAppEnabled } from '../welcome';
import { BlankPage, WelcomePage } from '../welcome/components';

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {(Function|Object)} stateful - THe redux store, state, or
 * {@code getState} function.
 * @returns {Promise<Object>}
 */
export function _getRouteToRender(stateful) {
    const state = toState(stateful);

    return _getMobileRoute(state);
}

/**
 * Returns the {@code Route} to display on the React Native app.
 *
 * @param {Object} state - The redux state.
 * @returns {Promise}
 */
function _getMobileRoute(state) {
    const route = _getEmptyRoute();

    if (isRoomValid(state['features/base/conference'].room)) {
        route.component = ConferenceNavigationContainer;
    } else if (isWelcomePageAppEnabled(state)) {
        route.component = WelcomePage;
    } else {
        route.component = BlankPage;
    }

    return Promise.resolve(route);
}

/**
 * Returns the default {@code Route}.
 *
 * @returns {Object}
 */
function _getEmptyRoute() {
    return {
        component: BlankPage,
        href: undefined
    };
}
