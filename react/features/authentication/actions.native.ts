import { Linking } from 'react-native';

import { appNavigate } from '../app/actions.native';
import { IStore } from '../app/types';
import { conferenceLeft } from '../base/conference/actions';
import { connectionFailed } from '../base/connection/actions.native';
import { set } from '../base/redux/functions';

import { CANCEL_LOGIN } from './actionTypes';
import { stopWaitForOwner } from './actions.any';

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
 * Redirect to the default location (e.g. Welcome page).
 *
 * @returns {Function}
 */
export function redirectToDefaultLocation() {
    return (dispatch: IStore['dispatch']) => dispatch(appNavigate(undefined));
}

/**
 * Opens token auth URL page.
 *
 * @param {string} tokenAuthServiceUrl - Authentication service URL.
 *
 * @returns {Function}
 */
export function openTokenAuthUrl(tokenAuthServiceUrl: string) {
    return () => {
        Linking.openURL(tokenAuthServiceUrl);
    };
}
