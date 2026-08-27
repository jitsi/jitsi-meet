import { Linking } from 'react-native';

import { appNavigate } from '../app/actions.native';
import { IStore } from '../app/types';
import { conferenceLeft } from '../base/conference/actions';
import { connectionFailed } from '../base/connection/actions.native';
import { hideDialog, openDialog } from '../base/dialog/actions';
import { set } from '../base/redux/functions';

import { CANCEL_LOGIN, SET_TOKEN_AUTH_PENDING } from './actionTypes';
import { stopWaitForOwner } from './actions.any';
import LoginRetryDialog from './components/native/LoginRetryDialog';
import logger from './logger';

export * from './actions.any';

/**
 * Cancels {@ink LoginDialog}.
 *
 * @returns {{
 *     type: CANCEL_LOGIN
 * }}
 */
export function cancelLogin() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        dispatch({ type: CANCEL_LOGIN });

        // XXX The error associated with CONNECTION_FAILED was marked as
        // recoverable by the authentication feature  and, consequently,
        // recoverable-aware features such as mobile's external-api did not
        // deliver the CONFERENCE_FAILED to the SDK clients/consumers (as
        // a reaction to CONNECTION_FAILED). Since the
        // app/user is going to navigate to WelcomePage, the SDK
        // clients/consumers need an event.
        const { error = { recoverable: undefined }, passwordRequired }
            = getState()['features/base/connection'];

        passwordRequired
            && dispatch(
                connectionFailed(
                    passwordRequired,
                    set(error, 'recoverable', false) as any));
    };
}

/**
 * Cancels {@link WaitForOwnerDialog}. Will navigate back to the welcome page.
 *
 * @returns {Function}
 */
export function cancelWaitForOwner() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        dispatch(stopWaitForOwner());

        // XXX The error associated with CONFERENCE_FAILED was marked as
        // recoverable by the feature room-lock and, consequently,
        // recoverable-aware features such as mobile's external-api did not
        // deliver the CONFERENCE_FAILED to the SDK clients/consumers. Since the
        // app/user is going to navigate to WelcomePage, the SDK
        // clients/consumers need an event.
        const { authRequired } = getState()['features/base/conference'];

        if (authRequired) {
            dispatch(conferenceLeft(authRequired));

            // in case we are showing lobby and on top of it wait for owner
            // we do not want to navigate away from the conference
            dispatch(appNavigate(undefined));
        }
    };
}

/**
 * Hides {@link LoginRetryDialog}.
 *
 * @returns {Action}
 */
export function hideLoginRetryDialog() {
    return hideDialog('LoginRetryDialog', LoginRetryDialog);
}

/**
 * Opens {@link LoginRetryDialog} which warns the user that they are not
 * connected to the meeting because the external login was not completed.
 *
 * @returns {Action}
 */
export function openLoginRetryDialog() {
    return openDialog('LoginRetryDialog', LoginRetryDialog);
}

/**
 * Redirect to the default location (e.g. Welcome page).
 *
 * @returns {Function}
 */
export function redirectToDefaultLocation() {
    return (dispatch: IStore['dispatch']) => dispatch(appNavigate(undefined));
}

/**
 * Sets whether an external token authentication (started by opening
 * {@code tokenAuthUrl} in the system browser) is pending. While the flag is
 * set, returning to the foreground without a connection means the login was
 * abandoned and {@link LoginRetryDialog} is shown.
 *
 * @param {boolean} pending - Whether the external login is pending.
 * @returns {{
 *     type: SET_TOKEN_AUTH_PENDING,
 *     pending: boolean
 * }}
 */
export function setTokenAuthPending(pending: boolean) {
    return {
        type: SET_TOKEN_AUTH_PENDING,
        pending
    };
}

/**
 * Opens token auth URL page.
 *
 * @param {string} tokenAuthServiceUrl - Authentication service URL.
 *
 * @returns {Function}
 */
export function openTokenAuthUrl(tokenAuthServiceUrl: string) {
    return (dispatch: IStore['dispatch']) => {
        dispatch(setTokenAuthPending(true));

        // Show the dialog right away, behind the browser: if the login is
        // completed, the deep link triggers a new connection attempt which
        // dismisses it; if the login is abandoned, it is what the user finds
        // when they return. The app may be put into picture-in-picture while
        // the browser is up, in which case no AppState change is emitted on
        // return, so the dialog cannot be reliably shown at that point.
        dispatch(openLoginRetryDialog());

        Linking.openURL(tokenAuthServiceUrl)
            .catch(error => logger.error('Failed to open token auth URL', error));
    };
}

/**
 * Not used.
 *
 * @param {string} tokenAuthServiceUrl - Authentication service URL.
 * @returns {Promise<any>} Resolves.
 */
export function loginWithPopup(tokenAuthServiceUrl: string): Promise<any> {
    return Promise.resolve(tokenAuthServiceUrl);
}

/**
 * Not used. There is no inline login popup on native.
 *
 * @returns {void}
 */
export function closeLoginPopup() {
    // No-op on native.
}
