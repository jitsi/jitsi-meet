// @flow

import type { Dispatch } from 'redux';

import { maybeRedirectToWelcomePage } from '../app/actions';
import { checkIfCanJoin, conferenceLeft } from '../base/conference/actions';
import { openDialog, hideDialog } from '../base/dialog/actions';

import {
    CANCEL_LOGIN,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    UPGRADE_ROLE_STARTED,
    WAIT_FOR_OWNER
} from './actionTypes';
import { WaitForOwnerDialog, LoginDialog } from './components';
import logger from './logger';


/**
 * Shows a notification dialog that authentication is required to create the.
 * Conference, so the local participant should authenticate or wait for a
 * host.
 *
 * @param {Function} onAuthNow - The callback to invoke if the local
 * participant wants to authenticate.
 *
 * @returns {Function}.
 */
export function openWaitForOwnerDialog(onAuthNow: ?Function) {
    return openDialog(WaitForOwnerDialog, {
        onAuthNow
    });
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
    return dispatch => {
        const process
            = conference.authenticateAndUpgradeRole({
                id,
                password,
                onLoginSuccessful() {
                // When the login succeeds, the process has completed half
                // of its job (i.e. 0.5).
                    return dispatch(upgradeRoleFinished(process, 0.5));
                }
            });

        dispatch(upgradeRoleStarted(process));
        process.then(
            /* onFulfilled */ () => dispatch(upgradeRoleFinished(process, 1)),
            /* onRejected */ error => {
                // The lack of an error signals a cancellation.
                if (error.authenticationError || error.connectionError) {
                    logger.error('authenticateAndUpgradeRole failed', error);
                }

                dispatch(upgradeRoleFinished(process, error));
            });

        return process;
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
function upgradeRoleStarted(thenableWithCancel) {
    return {
        type: UPGRADE_ROLE_STARTED,
        thenableWithCancel
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
function upgradeRoleFinished(
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


