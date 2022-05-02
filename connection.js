/* global APP, JitsiMeetJS, config */

import { jitsiLocalStorage } from '@jitsi/js-utils';
import Logger from '@jitsi/logger';

import { redirectToTokenAuthService } from './modules/UI/authentication/AuthHandler';
import { LoginDialog } from './react/features/authentication/components';
import { isTokenAuthEnabled } from './react/features/authentication/functions';
import {
    connectionEstablished,
    connectionFailed
} from './react/features/base/connection/actions';
import { openDialog } from './react/features/base/dialog/actions';
import { setJWT } from './react/features/base/jwt';
import {
    JitsiConnectionErrors,
    JitsiConnectionEvents
} from './react/features/base/lib-jitsi-meet';
import { isFatalJitsiConnectionError } from './react/features/base/lib-jitsi-meet/functions';
import { getCustomerDetails } from './react/features/jaas/actions.any';
import { isVpaasMeeting, getJaasJWT } from './react/features/jaas/functions';
import { setPrejoinDisplayNameRequired } from './react/features/prejoin/actions';
const logger = Logger.getLogger(__filename);

/**
 * The feature announced so we can distinguish jibri participants.
 *
 * @type {string}
 */
export const DISCO_JIBRI_FEATURE = 'http://jitsi.org/protocol/jibri';

/**
 * Checks if we have data to use attach instead of connect. If we have the data
 * executes attach otherwise check if we have to wait for the data. If we have
 * to wait for the attach data we are setting handler to APP.connect.handler
 * which is going to be called when the attach data is received otherwise
 * executes connect.
 *
 * @param {string} [id] user id
 * @param {string} [password] password
 * @param {string} [roomName] the name of the conference.
 */
function checkForAttachParametersAndConnect(id, password, connection) {
    if (window.XMPPAttachInfo) {
        APP.connect.status = 'connecting';

        // When connection optimization is not deployed or enabled the default
        // value will be window.XMPPAttachInfo.status = "error"
        // If the connection optimization is deployed and enabled and there is
        // a failure the value will be window.XMPPAttachInfo.status = "error"
        if (window.XMPPAttachInfo.status === 'error') {
            connection.connect({
                id,
                password
            });

            return;
        }

        const attachOptions = window.XMPPAttachInfo.data;

        if (attachOptions) {
            connection.attach(attachOptions);
            delete window.XMPPAttachInfo.data;
        } else {
            connection.connect({
                id,
                password
            });
        }
    } else {
        APP.connect.status = 'ready';
        APP.connect.handler
            = checkForAttachParametersAndConnect.bind(
                null,
                id, password, connection);
    }
}

/**
 * Try to open connection using provided credentials.
 * @param {string} [id]
 * @param {string} [password]
 * @param {string} [roomName]
 * @returns {Promise<JitsiConnection>} connection if
 * everything is ok, else error.
 */
export async function connect(id, password, roomName) {
    const connectionConfig = Object.assign({}, config);
    const state = APP.store.getState();
    let { jwt } = state['features/base/jwt'];
    const { iAmRecorder, iAmSipGateway } = state['features/base/config'];

    if (!iAmRecorder && !iAmSipGateway && isVpaasMeeting(state)) {
        await APP.store.dispatch(getCustomerDetails());

        if (!jwt) {
            jwt = await getJaasJWT(state);
            APP.store.dispatch(setJWT(jwt));
        }
    }

    // Use Websocket URL for the web app if configured. Note that there is no 'isWeb' check, because there's assumption
    // that this code executes only on web browsers/electron. This needs to be changed when mobile and web are unified.
    let serviceUrl = connectionConfig.websocket || connectionConfig.bosh;

    serviceUrl += `?room=${roomName}`;

    connectionConfig.serviceUrl = serviceUrl;

    if (connectionConfig.websocketKeepAliveUrl) {
        connectionConfig.websocketKeepAliveUrl += `?room=${roomName}`;
    }

    const connection = new JitsiMeetJS.JitsiConnection(null, jwt, connectionConfig);

    if (config.iAmRecorder) {
        connection.addFeature(DISCO_JIBRI_FEATURE);
    }

    return new Promise((resolve, reject) => {
        connection.addEventListener(
            JitsiConnectionEvents.CONNECTION_ESTABLISHED,
            handleConnectionEstablished);
        connection.addEventListener(
            JitsiConnectionEvents.CONNECTION_FAILED,
            handleConnectionFailed);
        connection.addEventListener(
            JitsiConnectionEvents.CONNECTION_FAILED,
            connectionFailedHandler);
        connection.addEventListener(
            JitsiConnectionEvents.DISPLAY_NAME_REQUIRED,
            displayNameRequiredHandler
        );

        /* eslint-disable max-params */
        /**
         *
         */
        function connectionFailedHandler(error, message, credentials, details) {
        /* eslint-enable max-params */
            APP.store.dispatch(
                connectionFailed(
                    connection, {
                        credentials,
                        details,
                        message,
                        name: error
                    }));

            if (isFatalJitsiConnectionError(error)) {
                connection.removeEventListener(
                    JitsiConnectionEvents.CONNECTION_FAILED,
                    connectionFailedHandler);
            }
        }

        /**
         *
         */
        function unsubscribe() {
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                handleConnectionEstablished);
            connection.removeEventListener(
                JitsiConnectionEvents.CONNECTION_FAILED,
                handleConnectionFailed);
        }

        /**
         *
         */
        function handleConnectionEstablished() {
            APP.store.dispatch(connectionEstablished(connection, Date.now()));
            unsubscribe();
            resolve(connection);
        }

        /**
         *
         */
        function handleConnectionFailed(err) {
            unsubscribe();
            logger.error('CONNECTION FAILED:', err);
            reject(err);
        }

        /**
         * Marks the display name for the prejoin screen as required.
         * This can happen if a user tries to join a room with lobby enabled.
         */
        function displayNameRequiredHandler() {
            APP.store.dispatch(setPrejoinDisplayNameRequired());
        }

        checkForAttachParametersAndConnect(id, password, connection);
    });
}

/**
 * Open JitsiConnection using provided credentials.
 * If retry option is true it will show auth dialog on PASSWORD_REQUIRED error.
 *
 * @param {object} options
 * @param {string} [options.id]
 * @param {string} [options.password]
 * @param {string} [options.roomName]
 * @param {boolean} [retry] if we should show auth dialog
 * on PASSWORD_REQUIRED error.
 *
 * @returns {Promise<JitsiConnection>}
 */
export function openConnection({ id, password, retry, roomName }) {
    const usernameOverride
        = jitsiLocalStorage.getItem('xmpp_username_override');
    const passwordOverride
        = jitsiLocalStorage.getItem('xmpp_password_override');

    if (usernameOverride && usernameOverride.length > 0) {
        id = usernameOverride; // eslint-disable-line no-param-reassign
    }
    if (passwordOverride && passwordOverride.length > 0) {
        password = passwordOverride; // eslint-disable-line no-param-reassign
    }

    return connect(id, password, roomName).catch(err => {
        if (retry) {
            const { jwt } = APP.store.getState()['features/base/jwt'];

            if (err === JitsiConnectionErrors.PASSWORD_REQUIRED && !jwt) {
                return requestAuth(roomName);
            }
        }

        throw err;
    });
}

/**
 * Show Authentication Dialog and try to connect with new credentials.
 * If failed to connect because of PASSWORD_REQUIRED error
 * then ask for password again.
 * @param {string} [roomName] name of the conference room
 *
 * @returns {Promise<JitsiConnection>}
 */
function requestAuth(roomName) {
    const config = APP.store.getState()['features/base/config'];

    if (isTokenAuthEnabled(config)) {
        // This Promise never resolves as user gets redirected to another URL
        return new Promise(() => redirectToTokenAuthService(roomName));
    }

    return new Promise(resolve => {
        const onSuccess = connection => {
            resolve(connection);
        };

        APP.store.dispatch(
            openDialog(LoginDialog, { onSuccess,
                roomName })
        );
    });
}
