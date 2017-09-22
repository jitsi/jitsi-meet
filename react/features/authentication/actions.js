/* @flow */

import { checkIfCanJoin } from '../base/conference';
import { openDialog } from '../base/dialog';

import {
    CANCEL_LOGIN,
    CANCEL_WAIT_FOR_OWNER,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    UPGRADE_ROLE_LOGIN_OK,
    UPGRADE_ROLE_STARTED,
    WAIT_FOR_OWNER
} from './actionTypes';
import { LoginDialog, WaitForOwnerDialog } from './components';

const logger = require('jitsi-meet-logger').getLogger(__filename);

/**
 * Initiates authenticating and upgrading the role of the local participant to
 * moderator which will allow to create and join a new conference on an XMPP
 * password + guest access configuration. Refer to {@link LoginDialog} for more
 * info.
 *
 * @param {string} id - The XMPP user's ID (e.g. user@domain.com).
 * @param {string} password - The XMPP user's password.
 * @param {JitsiConference} conference - The conference for which the local
 * participant's role will be upgraded.
 * @returns {function({ dispatch: Dispatch, getState: Function })}
 */
export function authenticateAndUpgradeRole(
        id: string,
        password: string,
        conference: Object) {
    return (dispatch: Dispatch, getState: Function) => {
        const { password: roomPassword }
            = getState()['features/base/conference'];
        const process
            = conference.authenticateAndUpgradeRole({
                id,
                password,
                roomPassword,

                onLoginSuccessful() {
                    return dispatch({ type: UPGRADE_ROLE_LOGIN_OK });
                }
            });

        dispatch(_upgradeRoleStarted(process));
        process.then(
            /* onFulfilled */ () => dispatch(_upgradeRoleFinished()),
            /* onRejected */ error => {
                // The lack of an error signals a cancellation.
                if (error.authenticationError || error.connectionError) {
                    logger.error('authenticateAndUpgradeRole failed', error);
                }

                dispatch(_upgradeRoleFinished(error));
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
    return {
        type: CANCEL_LOGIN
    };
}

/**
 * Cancels {@link WaitForOwnerDialog}. Will navigate back to the welcome page.
 *
 * @returns {{
 *     type: CANCEL_WAIT_FOR_OWNER
 * }}
 */
export function cancelWaitForOwner() {
    return {
        type: CANCEL_WAIT_FOR_OWNER
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
 * @param {Object} error - If <tt>undefined</tt>, then the process of
 * authenticating and upgrading the local participant's role has succeeded;
 * otherwise, it has failed with the specified error. Refer to
 * {@link JitsiConference#authenticateAndUpgradeRole} in lib-jitsi-meet for the
 * error details.
 * @private
 * @returns {{
 *     type: UPGRADE_ROLE_FINISHED,
 *     error: ?Object
 * }}
 */
function _upgradeRoleFinished(error: ?Object) {
    if (error) {
        // Make the specified error object resemble an Error instance (to the
        // extent that jitsi-meet needs it).
        const {
            authenticationError,
            connectionError,
            ...other
        } = error;

        error = { // eslint-disable-line no-param-reassign
            name: authenticationError || connectionError,
            ...other
        };
    }

    return {
        type: UPGRADE_ROLE_FINISHED,
        error
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
 * @returns {function({ dispatch: Dispatch })}
 */
export function waitForOwner() {
    return (dispatch: Dispatch) =>
        dispatch({
            type: WAIT_FOR_OWNER,
            handler: () => dispatch(checkIfCanJoin()),
            timeoutMs: 5000
        });
}
