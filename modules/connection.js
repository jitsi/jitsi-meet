/* global APP, JitsiMeetJS, config */

import LoginDialog from './UI/authentication/LoginDialog';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

function connect(id, password) {
    let connection = new JitsiMeetJS.JitsiConnection(null, null, {
        hosts: config.hosts,
        bosh: config.bosh,
        clientNode: config.clientNode
    });

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
