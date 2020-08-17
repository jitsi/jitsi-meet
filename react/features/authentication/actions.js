// @flow

import type { Dispatch } from 'redux';

import { appNavigate } from '../app/actions';
import { checkIfCanJoin, conferenceLeft } from '../base/conference';
import { connectionFailed } from '../base/connection';
import { openDialog } from '../base/dialog';
import { set } from '../base/redux';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    UPGRADE_ROLE_STARTED,
    WAIT_FOR_OWNER
} from './actionTypes';
import { LoginDialog, WaitForOwnerDialog } from './components';
import logger from './logger';

/**
 * Initiates authenticating and upgrading the role of the local participant to
 * moderator which will allow to create and join a new conference on an XMPP
 * password + guest access configuration. Refer to {@link LoginDialog} for more
 * info.
 *
 * @param {string} id - The XMPP user's ID (e.g. {@code user@domain.com}).
 * @param {string} password - The XMPP user's password.
 * @param {JitsiConference} conference - The conference for which the local
 * participant's role will be upgraded.
 * @returns {Function}
 */
export function authenticateAndUpgradeRole(
        id: string,
        password: string,
        conference: Object) {
    return (dispatch: Dispatch<any>, getState: Function) => {
        const { password: roomPassword }
            = getState()['features/base/conference'];
        const process
            = conference.authenticateAndUpgradeRole({
                id,
                password,
                roomPassword,

                onLoginSuccessful() {
                    // When the login succeeds, the process has completed half
                    // of its job (i.e. 0.5).
                    return dispatch(_upgradeRoleFinished(process, 0.5));
                }
            });

        dispatch(_upgradeRoleStarted(process));
        process.then(
            /* onFulfilled */ () => dispatch(_upgradeRoleFinished(process, 1)),
            /* onRejected */ error => {
                // The lack of an error signals a cancellation.
                if (error.authenticationError || error.connectionError) {
                    logger.error('authenticateAndUpgradeRole failed', error);
                }

                dispatch(_upgradeRoleFinished(process, error));
            });

        return process;
    };
}

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

/**
 * Opens {@link LoginDialog} which will ask to enter username and password
 * for the current conference.
 *
 * @protected
 * @returns {Action}
 */
export function _openLoginDialog() {
    return openDialog(LoginDialog);
}

/**
 * Opens {@link WaitForOnwerDialog}.
 *
 * @protected
 * @returns {Action}
 */
export function _openWaitForOwnerDialog() {
    return openDialog(WaitForOwnerDialog);
}

/**
 * Stops waiting for the conference owner.
 *
 * @returns {{
 *     type: STOP_WAIT_FOR_OWNER
 * }}
 */
export function stopWaitForOwner() {
    return {
        type: STOP_WAIT_FOR_OWNER
    };
}

/**
 * Signals that the process of authenticating and upgrading the local
 * participant's role has finished either with success or with a specific error.
 *
 * @param {Object} thenableWithCancel - The process of authenticating and
 * upgrading the local participant's role.
 * @param {Object} progressOrError - If the value is a {@code number}, then the
 * process of authenticating and upgrading the local participant's role has
 * succeeded in one of its two/multiple steps; otherwise, it has failed with the
 * specified error. Refer to {@link JitsiConference#authenticateAndUpgradeRole}
 * in lib-jitsi-meet for the error details.
 * @private
 * @returns {{
 *     type: UPGRADE_ROLE_FINISHED,
 *     error: ?Object,
 *     progress: number
 * }}
 */
function _upgradeRoleFinished(
        thenableWithCancel,
        progressOrError: number | Object) {
    let error;
    let progress;

    if (typeof progressOrError === 'number') {
        progress = progressOrError;
    } else {
        // Make the specified error object resemble an Error instance (to the
        // extent that jitsi-meet needs it).
        const {
            authenticationError,
            connectionError,
            ...other
        } = progressOrError;

        error = {
            name: authenticationError || connectionError,
            ...other
        };
        progress = authenticationError ? 0.5 : 0;
    }

    return {
        type: UPGRADE_ROLE_FINISHED,
        error,
        progress,
        thenableWithCancel
    };
}

/**
 * Signals that a process of authenticating and upgrading the local
 * participant's role has started.
 *
 * @param {Object} thenableWithCancel - The process of authenticating and
 * upgrading the local participant's role.
 * @private
 * @returns {{
 *     type: UPGRADE_ROLE_STARTED,
 *     thenableWithCancel: Object
 * }}
 */
function _upgradeRoleStarted(thenableWithCancel) {
    return {
        type: UPGRADE_ROLE_STARTED,
        thenableWithCancel
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
    return (dispatch: Dispatch<any>) =>
        dispatch({
            type: WAIT_FOR_OWNER,
            handler: () => dispatch(checkIfCanJoin()),
            timeoutMs: 5000
        });
}
