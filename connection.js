/* global APP, JitsiMeetJS, config */

import Logger from 'jitsi-meet-logger';
import { jitsiLocalStorage } from 'js-utils';

import AuthHandler from './modules/UI/authentication/AuthHandler';
import {
    connectionEstablished,
    connectionFailed
} from './react/features/base/connection';
import {
    isFatalJitsiConnectionError,
    JitsiConnectionErrors,
    JitsiConnectionEvents
} from './react/features/base/lib-jitsi-meet';

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
function connect(id, password, roomName) {
    const connectionConfig = Object.assign({}, config);
    const { issuer, jwt } = APP.store.getState()['features/base/jwt'];

    // Use Websocket URL for the web app if configured. Note that there is no 'isWeb' check, because there's assumption
    // that this code executes only on web browsers/electron. This needs to be changed when mobile and web are unified.
    let serviceUrl = connectionConfig.websocket || connectionConfig.bosh;

    serviceUrl += `?room=${roomName}`;

    // FIXME Remove deprecated 'bosh' option assignment at some point(LJM will be accepting only 'serviceUrl' option
    //  in future). It's included for the time being for Jitsi Meet and lib-jitsi-meet versions interoperability.
    connectionConfig.serviceUrl = connectionConfig.bosh = serviceUrl;

    const connection
        = new JitsiMeetJS.JitsiConnection(
            null,
            jwt && issuer && issuer !== 'anonymous' ? jwt : undefined,
            connectionConfig);

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
            const { issuer, jwt } = APP.store.getState()['features/base/jwt'];

            if (err === JitsiConnectionErrors.PASSWORD_REQUIRED
                    && (!jwt || issuer === 'anonymous')) {
                return AuthHandler.requestAuth(roomName, connect);
            }
        }

        throw err;
    });
}
