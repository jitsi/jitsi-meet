import { maybeRedirectToWelcomePage } from '../app/actions.web';
import { IStore } from '../app/types';

import {
    CANCEL_LOGIN,
    LOGIN,
    LOGOUT
} from './actionTypes';

export * from './actions.any';

/**
 * Cancels {@ink LoginDialog}.
 *
 * @returns {{
 *     type: CANCEL_LOGIN
 * }}
 */
export function cancelLogin() {
    return {
        type: CANCEL_LOGIN
    };
}

/**
 * Cancels authentication, closes {@link WaitForOwnerDialog}
 * and navigates back to the welcome page.
 *
 * @returns {Function}
 */
export function cancelWaitForOwner() {
    return (dispatch: IStore['dispatch']) => {
        dispatch(maybeRedirectToWelcomePage());
    };
}

/** .
 * Redirect to the default location (e.g. Welcome page).
 *
 * @returns {Function}
 */
export function redirectToDefaultLocation() {
    return (dispatch: IStore['dispatch']) => dispatch(maybeRedirectToWelcomePage());
}

/**
 * Login.
 *
 * @returns {{
 *     type: LOGIN
 * }}
 */
export function login() {
    return {
        type: LOGIN
    };
}

/**
 * Logout.
 *
 * @returns {{
 *     type: LOGOUT
 * }}
 */
export function logout() {
    return {
        type: LOGOUT
    };
}
