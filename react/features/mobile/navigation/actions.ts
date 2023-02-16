import { RELOAD_NOW_INITIATED, SET_ROOT_NAVIGATION } from './actionTypes';


/**
 * A reload was initiated.
 *
 * @param {Object} initiated - Reload started.
 *
 * @returns {{
 *     initiated: initiated,
 *     type: RELOAD_NOW_INITIATED
 * }}
 */
export function reloadNowInitiated(initiated: boolean) {
    return {
        initiated,
        type: RELOAD_NOW_INITIATED
    };
}

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
