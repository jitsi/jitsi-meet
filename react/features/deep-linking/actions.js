/* @flow */

import { appNavigate } from '../app';

import { OPEN_DESKTOP_APP, OPEN_WEB_APP } from './actionTypes';

/**
 * Continue to the conference page.
 *
 * @returns {Function}
 */
export function openWebApp() {
    return (dispatch: Dispatch<*>) => {
        dispatch({ type: OPEN_WEB_APP });
        dispatch(appNavigate());
    };
}

/**
 * Opens the desktop app.
 *
 * @returns {{
 *     type: OPEN_DESKTOP_APP
 * }}
 */
export function openDesktopApp() {
    return {
        type: OPEN_DESKTOP_APP
    };
}
