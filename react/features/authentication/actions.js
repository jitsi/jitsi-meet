import { openDialog } from '../base/dialog/actions';
import { checkIfCanJoin } from '../base/conference/actions';
import {
    CANCEL_LOGIN,
    CANCEL_WAIT_FOR_OWNER,
    STOP_WAIT_FOR_OWNER,
    UPGRADE_ROLE_FAILED,
    UPGRADE_ROLE_STARTED,
    UPGRADE_ROLE_SUCCESS,
    WAIT_FOR_OWNER
} from './actionTypes';
import { LoginDialog, WaitForOwnerDialog } from './components';

/**
 * Instantiates new {@link JitsiAuthConnection} and uses it to authenticate and
 * upgrade role of the current conference user to moderator which will allow to
 * create and join new conference on XMPP password + guest access configuration.
 * See {@link LoginDialog} description for more info.
 *
 * @param {string} id - XMPP user's id eg. user@domain.com.
 * @param {string} userPassword - The user's password.
 * @param {JitsiConference} conference - The conference for which user's role
 * will be upgraded.
 * @returns {function({dispatch: Function, getState: Function})}
 */
export function authenticateAndUpgradeRole(id, userPassword, conference) {
    return (dispatch, getState) => {
        const authConnection = conference.createAuthenticationConnection();

        dispatch(_upgradeRoleStarted(authConnection));

        const { password: roomPassword }
            = getState()['features/base/conference'];

        authConnection.authenticateAndUpgradeRole({
            id,
            password: userPassword,
            roomPassword
        })
        .then(() => {
            dispatch(_upgradeRoleSuccess());
        })
        .catch(error => {
            // Lack of error means the operation was canceled, so no need to log
            // that on error level.
            if (error.error) {
                console.error('upgradeRoleFailed', error);
            }
            dispatch(_upgradeRoleFailed(error));
        });
    };
}

/**
 * Cancels {@ink LoginDialog}.
 *
 * @returns {{
 *      type: CANCEL_LOGIN
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
 *      type: CANCEL_WAIT_FOR_OWNER
 * }}
 */
export function cancelWaitForOwner() {
    return {
        type: CANCEL_WAIT_FOR_OWNER
    };
}

/**
 * Stops waiting for conference owner and clears any pending timeout.
 *
 * @returns {{
 *      type: STOP_WAIT_FOR_OWNER
 * }}
 */
export function clearWaitForOwnerTimeout() {
    return {
        type: STOP_WAIT_FOR_OWNER
    };
}

/**
 * Sets a delayed "wait for owner" handler function.
 *
 * @param {Function} handler - The "wait for owner" handler function.
 * @param {number} waitMs - The delay in milliseconds.
 *
 * @private
 * @returns {{
 *      type: WAIT_FOR_OWNER,
 *      handler: Function,
 *      timeoutMs: number
 * }}
 */
function _setWaitForOwnerTimeout(handler, waitMs) {
    return {
        type: WAIT_FOR_OWNER,
        handler,
        timeoutMs: waitMs
    };
}

/**
 * Displays {@link LoginDialog} which will ask to enter username and password
 * for the current conference.
 *
 * @protected
 * @returns {{
 *     type: OPEN_DIALOG,
 *     component: LoginDialog,
 *     props: React.PropTypes
 * }}
 */
export function _showLoginDialog() {
    return openDialog(LoginDialog, { });
}

/**
 * Displays {@link WaitForOnwerDialog}.
 *
 * @protected
 * @returns {{
 *     type: OPEN_DIALOG,
 *     component: WaitForOwnerDialog,
 *     props: React.PropTypes
 * }}
 */
export function _showWaitForOwnerDialog() {
    return openDialog(WaitForOwnerDialog, { });
}

/**
 * Emits an error which occurred during {@link authenticateAndUpgradeRole}.
 *
 * @param {Object} error - Check the docs of {@link JitsiAuthConnection} in
 * lib-jitsi-meet for more details about the error's structure.
 *
 * @private
 * @returns {{
 *      type: UPGRADE_ROLE_FAILED,
 *      error: Object
 * }}
 */
function _upgradeRoleFailed(error) {
    return {
        type: UPGRADE_ROLE_FAILED,
        error
    };
}

/**
 * Signals that the role upgrade process has been started using given
 * {@link JitsiAuthConnection} instance.
 *
 * @param {JitsiAuthConnection} authenticationConnection - The authentication
 * connection instance that can be used to cancel the process.
 *
 * @private
 * @returns {{
 *      type: UPGRADE_ROLE_STARTED,
 *      authConnection: JitsiAuthConnection
 * }}
 */
function _upgradeRoleStarted(authenticationConnection) {
    return {
        type: UPGRADE_ROLE_STARTED,
        authConnection: authenticationConnection
    };
}

/**
 * Signals that the role upgrade process has been completed successfully.
 *
 * @private
 * @returns {{
 *      type: UPGRADE_ROLE_SUCCESS
 * }}
 */
function _upgradeRoleSuccess() {
    return {
        type: UPGRADE_ROLE_SUCCESS
    };
}

/**
 * Called when Jicofo rejects to create the room for anonymous user. Will
 * start the process of "waiting for the owner" by periodically trying to join
 * the room every five seconds.
 *
 * @returns {function({ dispatch: Function})}
 */
export function waitForOwner() {
    return dispatch => {
        dispatch(
            _setWaitForOwnerTimeout(
                () => dispatch(checkIfCanJoin()),
                5000));
    };
}
