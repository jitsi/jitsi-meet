/* global APP, JitsiMeetJS, config */
//FIXME:
import LoginDialog from './modules/UI/authentication/LoginDialog';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

/**
 * Try to open connection using provided credentials.
 * @param {string} [id]
 * @param {string} [password]
 * @returns {Promise<JitsiConnection>} connection if
 * everything is ok, else error.
 */
function connect(id, password) {
    let connection = new JitsiMeetJS.JitsiConnection(null, null, config);

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

        connection.connect({id, password});
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
 * @param {boolean} [retry] if we should show auth dialog
 * on PASSWORD_REQUIRED error.
 *
 * @returns {Promise<JitsiConnection>}
 */
export function openConnection({id, password, retry}) {
    return connect(id, password).catch(function (err) {
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
