/* global APP, JitsiMeetJS, config */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import AuthHandler from './modules/UI/authentication/AuthHandler';
import jitsiLocalStorage from './modules/util/JitsiLocalStorage';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

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
    if(window.XMPPAttachInfo){
        APP.connect.status = "connecting";
        // When connection optimization is not deployed or enabled the default
        // value will be window.XMPPAttachInfo.status = "error"
        // If the connection optimization is deployed and enabled and there is
        // a failure the value will be window.XMPPAttachInfo.status = "error"
        if(window.XMPPAttachInfo.status === "error") {
            connection.connect({id, password});
            return;
        }

        var attachOptions = window.XMPPAttachInfo.data;
        if(attachOptions) {
            connection.attach(attachOptions);
            delete window.XMPPAttachInfo.data;
        } else {
            connection.connect({id, password});
        }
    } else {
        APP.connect.status = "ready";
        APP.connect.handler = checkForAttachParametersAndConnect.bind(null,
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

    let connectionConfig = Object.assign({}, config);

    connectionConfig.bosh += '?room=' + roomName;
    let connection
        = new JitsiMeetJS.JitsiConnection(null, config.token, connectionConfig);

    return new Promise(function (resolve, reject) {
        connection.addEventListener(
            ConnectionEvents.CONNECTION_ESTABLISHED, handleConnectionEstablished
        );
        connection.addEventListener(
            ConnectionEvents.CONNECTION_FAILED, handleConnectionFailed
        );

        function unsubscribe() {
            connection.removeEventListener(
                ConnectionEvents.CONNECTION_ESTABLISHED,
                handleConnectionEstablished
            );
            connection.removeEventListener(
                ConnectionEvents.CONNECTION_FAILED,
                handleConnectionFailed
            );
        }

        function handleConnectionEstablished() {
            unsubscribe();
            resolve(connection);
        }

        function handleConnectionFailed(err) {
            unsubscribe();
            logger.error("CONNECTION FAILED:", err);
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
export function openConnection({id, password, retry, roomName}) {

    let usernameOverride
        = jitsiLocalStorage.getItem("xmpp_username_override");
    let passwordOverride
        = jitsiLocalStorage.getItem("xmpp_password_override");

    if (usernameOverride && usernameOverride.length > 0) {
        id = usernameOverride;
    }

    if (passwordOverride && passwordOverride.length > 0) {
        password = passwordOverride;
    }

    return connect(id, password, roomName).catch(function (err) {
        if (!retry) {
            throw err;
        }

        if (err === ConnectionErrors.PASSWORD_REQUIRED) {
            // do not retry if token is not valid
            if (config.token) {
                throw err;
            } else {
                return AuthHandler.requestAuth(roomName, connect);
            }
        } else {
            throw err;
        }
    });
}
