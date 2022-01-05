// @flow

import type { Dispatch } from 'redux';

import { appNavigate } from '../app/actions';

import { OPEN_DESKTOP_APP, OPEN_WEB_APP } from './actionTypes';

/**
 * Continue to the conference page.
 *
 * @returns {Function}
 */
export function openWebApp() {
    return (dispatch: Dispatch<any>) => {
        // In order to go to the web app we need to skip the deep linking
        // interceptor. OPEN_WEB_APP action should set launchInWeb to true in
        // the redux store. After this when appNavigate() is called the
        // deep linking interceptor will be skipped (will return undefined).
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
