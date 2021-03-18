// @flow

import { maybeRedirectToWelcomePage } from '../app/actions';
import { checkIfCanJoin } from '../base/conference/actions';
import { hideDialog, openDialog } from '../base/dialog/actions';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    WAIT_FOR_OWNER
} from './actionTypes';
import { WaitForOwnerDialog, LoginDialog } from './components/web';


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
 * Hides a authentication dialog where the local participant
 * should authenticate.
 *
 * @returns {Function}.
 */
export function hideLoginDialog() {
    return hideDialog(LoginDialog);
}

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
 * Called when Jicofo rejects to create the room for anonymous user. Will
 * start the process of "waiting for the owner" by periodically trying to join
 * the room every five seconds.
 *
 * @returns {Function}
 */
export function waitForOwner() {
    return (dispatch: Function) =>
        dispatch({
            type: WAIT_FOR_OWNER,
            handler: () => dispatch(checkIfCanJoin()),
            timeoutMs: 5000
        });
}

/**
 * Stops waiting for the conference owner.
 *
 * @returns {{
 *     type: STOP_WAIT_FOR_OWNER,
 *     error: Object
 * }}
 */
export function stopWaitForOwner() {
    return {
        type: STOP_WAIT_FOR_OWNER
    };
}


