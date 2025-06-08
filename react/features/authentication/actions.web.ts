import { maybeRedirectToWelcomePage } from '../app/actions.web';
import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import { browser } from '../base/lib-jitsi-meet';

import { CANCEL_LOGIN, STOP_WAIT_FOR_OWNER } from './actionTypes';
import LoginQuestionDialog from './components/web/LoginQuestionDialog';

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
 * Cancels waiting for the owner and closes {@link WaitForOwnerDialog}.
 *
 * @returns {Function}
 */
export function cancelWaitForOwner() {
    return {
        type: STOP_WAIT_FOR_OWNER
    };
}

/**
 * Redirect to the default location (e.g. Welcome page).
 *
 * @returns {Function}
 */
export function redirectToDefaultLocation() {
    return (dispatch: IStore['dispatch']) => dispatch(maybeRedirectToWelcomePage());
}

/**
 * Opens token auth URL page.
 *
 * @param {string} tokenAuthServiceUrl - Authentication service URL.
 *
 * @returns {Function}
 */
export function openTokenAuthUrl(tokenAuthServiceUrl: string): any {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const redirect = () => {
            if (browser.isElectron()) {
                window.open(tokenAuthServiceUrl, '_blank');
            } else {
                window.location.href = tokenAuthServiceUrl;
            }
        };

        // Show warning for leaving conference only when in a conference.
        if (!browser.isElectron() && getState()['features/base/conference'].conference) {
            dispatch(openDialog(LoginQuestionDialog, {
                handler: () => {
                    // Give time for the dialog to close.
                    setTimeout(() => redirect(), 500);
                }
            }));
        } else {
            redirect();
        }
    };
}
