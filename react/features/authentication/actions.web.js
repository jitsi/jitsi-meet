// @flow

import { maybeRedirectToWelcomePage } from '../app/actions';
import { hideDialog, openDialog } from '../base/dialog/actions';

import {
    CANCEL_LOGIN
} from './actionTypes';
import { WaitForOwnerDialog, LoginDialog } from './components';

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
    return (dispatch: Function) => {
        dispatch(maybeRedirectToWelcomePage());
    };
}

/**
 * Hides a authentication dialog where the local participant
 * should authenticate.
 *
 * @returns {Function}.
 */
export function hideLoginDialog() {
    return hideDialog(LoginDialog);
}

/**
 * Shows a authentication dialog where the local participant
 * should authenticate.
 *
 * @returns {Function}.
 */
export function openLoginDialog() {
    return openDialog(LoginDialog);
}

/**
 * Shows a notification dialog that authentication is required to create the.
 * Conference, so the local participant should authenticate or wait for a
 * host.
 *
 * @returns {Function}.
 */
export function openWaitForOwnerDialog() {
    return openDialog(WaitForOwnerDialog);
}


