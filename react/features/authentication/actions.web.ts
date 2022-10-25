import { maybeRedirectToWelcomePage } from '../app/actions.web';
import { IStore } from '../app/types';
import { hideDialog, openDialog } from '../base/dialog/actions';

import {
    CANCEL_LOGIN
} from './actionTypes';
import LoginDialog from './components/web/LoginDialog';
import WaitForOwnerDialog from './components/web/WaitForOwnerDialog';

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
 * Shows a notification dialog that authentication is required to create the.
 * Conference.
 * This is used for external auth.
 *
 * @param {string} room - The room name.
 * @param {Function} onAuthNow - The function to be invoked when external authentication.
 *
 * @returns {Function}.
 */
export function openAuthDialog(room: String, onAuthNow?: Function) {
    return openDialog(WaitForOwnerDialog, {
        room,
        onAuthNow
    });
}


