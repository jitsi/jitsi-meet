import { SET_ROOT_NAVIGATION } from './actionTypes';


/**
 * Sets root navigation.
 *
 * @param {Object} ready - Root navigation is ready.
 *
 * @returns {{
 *     ready: ready,
 *     type: SET_ROOT_NAVIGATION
 * }}
 */
export function setRootNavigation(ready: boolean) {
    return {
        ready,
        type: SET_ROOT_NAVIGATION
    };
}
