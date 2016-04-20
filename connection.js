/* global APP, JitsiMeetJS, config */
//FIXME:
import LoginDialog from './modules/UI/authentication/LoginDialog';

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

    let connectionConfig = config;

    connectionConfig.bosh += '?room=' + roomName;
    let connection
        = new JitsiMeetJS.JitsiConnection(null, config.token, config);

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
            console.error("CONNECTION FAILED:", err);
            reject(err);
        }

        checkForAttachParametersAndConnect(id, password, connection);
    });
}

/**
 * Show Authentication Dialog and try to connect with new credentials.
 * If failed to connect because of PASSWORD_REQUIRED error
 * then ask for password again.
 * @returns {Promise<JitsiConnection>}
 */
function requestAuth() {
    return new Promise(function (resolve, reject) {
        let authDialog = LoginDialog.showAuthDialog(
            function (id, password) {
                connect(id, password).then(function (connection) {
                    authDialog.close();
                    resolve(connection);
                }, function (err) {
                    if (err === ConnectionErrors.PASSWORD_REQUIRED) {
                        authDialog.displayError(err);
                    } else {
                        authDialog.close();
                        reject(err);
                    }
                });
            }
        );
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

    let predefinedLogin = window.localStorage.getItem("xmpp_login");
    let predefinedPassword = window.localStorage.getItem("xmpp_password");

    if (!id && predefinedLogin && predefinedLogin.length > 0) {
        id = predefinedLogin;
    }

    if (!password && predefinedPassword && predefinedPassword.length > 0) {
        password = predefinedPassword;
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
                return requestAuth();
            }
        } else {
            throw err;
        }
    });
}
