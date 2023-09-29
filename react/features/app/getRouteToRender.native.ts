
import RootNavigationContainer from '../mobile/navigation/components/RootNavigationContainer';

const route = {
    component: RootNavigationContainer,
    href: undefined
};

/**
 * Determines which route is to be rendered in order to depict a specific Redux
 * store.
 *
 * @param {any} _stateful - Used on web.
 * @returns {Promise<Object>}
 */
export function _getRouteToRender(_stateful?: any) {
    return Promise.resolve(route);
}
