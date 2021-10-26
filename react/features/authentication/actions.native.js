// @flow

import type { Dispatch } from 'redux';

import { appNavigate } from '../app/actions';
import { conferenceLeft } from '../base/conference/actions';
import { connectionFailed } from '../base/connection/actions.native';
import { set } from '../base/redux';

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
    return (dispatch: Dispatch<any>, getState: Function) => {
        dispatch({ type: CANCEL_LOGIN });

        // XXX The error associated with CONNECTION_FAILED was marked as
        // recoverable by the authentication feature  and, consequently,
        // recoverable-aware features such as mobile's external-api did not
        // deliver the CONFERENCE_FAILED to the SDK clients/consumers (as
        // a reaction to CONNECTION_FAILED). Since the
        // app/user is going to navigate to WelcomePage, the SDK
        // clients/consumers need an event.
        const { error, passwordRequired }
            = getState()['features/base/connection'];

        passwordRequired
            && dispatch(
                connectionFailed(
                    passwordRequired,
                    set(error, 'recoverable', false)));
    };
}

/**
 * Cancels {@link WaitForOwnerDialog}. Will navigate back to the welcome page.
 *
 * @returns {Function}
 */
export function cancelWaitForOwner() {
    return (dispatch: Dispatch<any>, getState: Function) => {
        dispatch(stopWaitForOwner());

        // XXX The error associated with CONFERENCE_FAILED was marked as
        // recoverable by the feature room-lock and, consequently,
        // recoverable-aware features such as mobile's external-api did not
        // deliver the CONFERENCE_FAILED to the SDK clients/consumers. Since the
        // app/user is going to nativate to WelcomePage, the SDK
        // clients/consumers need an event.
        const { authRequired } = getState()['features/base/conference'];

        authRequired && dispatch(conferenceLeft(authRequired));

        dispatch(appNavigate(undefined));
    };
}


