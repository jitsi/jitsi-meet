import { IStore } from '../app/types';
import { checkIfCanJoin } from '../base/conference/actions';
import { IJitsiConference } from '../base/conference/reducer';
import { hideDialog, openDialog } from '../base/dialog/actions';

import {
    LOGIN,
    LOGOUT,
    SET_TOKEN_AUTH_URL_SUCCESS,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FINISHED,
    UPGRADE_ROLE_STARTED, WAIT_FOR_OWNER
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
        conference: IJitsiConference) {
    return (dispatch: IStore['dispatch']) => {
        const process
            = conference.authenticateAndUpgradeRole({
                id,
                password,

                onLoginSuccessful() {
                // When the login succeeds, the process has completed half
                // of its job (i.e. 0.5).
                    return dispatch(_upgradeRoleFinished(process, 0.5));
                }
            });

        dispatch(_upgradeRoleStarted(process));
        process.then(
            /* onFulfilled */ () => dispatch(_upgradeRoleFinished(process, 1)),
            /* onRejected */ (error: any) => {
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
        thenableWithCancel: Object,
        progressOrError: number | any) {
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
        progress = 0;
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
function _upgradeRoleStarted(thenableWithCancel: Object) {
    return {
        type: UPGRADE_ROLE_STARTED,
        thenableWithCancel
    };
}

/**
 * Hides an authentication dialog where the local participant
 * should authenticate.
 *
 * @returns {Function}
 */
export function hideLoginDialog() {
    return hideDialog(LoginDialog);
}

/**
 * Login.
 *
 * @returns {{
*     type: LOGIN
* }}
*/
export function login() {
    return {
        type: LOGIN
    };
}

/**
* Logout.
*
* @returns {{
*     type: LOGOUT
* }}
*/
export function logout() {
    return {
        type: LOGOUT
    };
}

/**
 * Opens {@link WaitForOnwerDialog}.
 *
 * @protected
 * @returns {Action}
 */
export function openWaitForOwnerDialog() {
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
 * Called when Jicofo rejects to create the room for anonymous user. Will
 * start the process of "waiting for the owner" by periodically trying to join
 * the room every five seconds.
 *
 * @returns {Function}
 */
export function waitForOwner() {
    return (dispatch: IStore['dispatch']) =>
        dispatch({
            type: WAIT_FOR_OWNER,
            handler: () => dispatch(checkIfCanJoin()),
            timeoutMs: 5000
        });
}

/**
 * Opens {@link LoginDialog} which will ask to enter username and password
 * for the current conference.
 *
 * @protected
 * @returns {Action}
 */
export function openLoginDialog() {
    return openDialog(LoginDialog);
}

/**
 * Updates the config with new options.
 *
 * @param {boolean} value - The new value.
 * @returns {Function}
 */
export function setTokenAuthUrlSuccess(value: boolean) {
    return {
        type: SET_TOKEN_AUTH_URL_SUCCESS,
        value
    };
}
