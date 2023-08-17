import { maybeRedirectToWelcomePage } from '../app/actions.web';
import { IStore } from '../app/types';
import { openDialog } from '../base/dialog/actions';
import { browser } from '../base/lib-jitsi-meet';
import { appendURLHashParam } from '../base/util/uri';

import { CANCEL_LOGIN } from './actionTypes';
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
 * Cancels authentication, closes {@link WaitForOwnerDialog}
 * and navigates back to the welcome page only in the case of authentication required error.
 * We can be showing the dialog while lobby is enabled and participant is still waiting there and hiding this dialog
 * should do nothing.
 *
 * @returns {Function}
 */
export function cancelWaitForOwner() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const { authRequired } = getState()['features/base/conference'];

        authRequired && dispatch(maybeRedirectToWelcomePage());
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
            // We have already shown the prejoin screen, no need to show it again after obtaining the token.
            let url = appendURLHashParam(tokenAuthServiceUrl, 'skipPrejoin', 'true');

            if (browser.isElectron()) {
                url = appendURLHashParam(url, 'electron', 'true');
                window.open(url, '_blank');
            } else {
                window.location.href = url;
            }
        };

        // Show warning for leaving conference only when in a conference.
        if (!browser.isElectron() && getState()['features/base/conference'].conference) {
            dispatch(openDialog(LoginQuestionDialog, {
                handler: () => {
                    // Give time for the dialog to close.
                    setTimeout(() => redirect, 500);
                }
            }));
        } else {
            redirect();
        }
    };
}
