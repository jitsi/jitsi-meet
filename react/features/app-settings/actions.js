// @flow

import { HIDE_APP_SETTINGS, SHOW_APP_SETTINGS } from './actionTypes';

/**
 * Redux-signals the request to hide the app settings modal.
 *
 * @returns {{
 *     type: HIDE_APP_SETTINGS
 * }}
 */
export function hideAppSettings() {
    return {
        type: HIDE_APP_SETTINGS
    };
}

/**
 * Redux-signals the request to open the app settings modal.
 *
 * @returns {{
 *     type: SHOW_APP_SETTINGS
 * }}
 */
export function showAppSettings() {
    return {
        type: SHOW_APP_SETTINGS
    };
}
