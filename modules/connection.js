/* global APP, JitsiMeetJS, config */

import LoginDialog from './UI/authentication/LoginDialog';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

export function openConnection({retry, id, password}) {
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
            ConnectionEvents.CONNECTION_FAILED, onConnectionFailed
        );
        let authDialog;

        function unsubscribe() {
            connection.removeEventListener(
                ConnectionEvents.CONNECTION_ESTABLISHED,
                handleConnectionEstablished
            );
            connection.removeEventListener(
                ConnectionEvents.CONNECTION_FAILED, onConnectionFailed
            );
            if (authDialog) {
                authDialog.close();
            }
        }

        function handleConnectionEstablished() {
            unsubscribe();
            resolve(connection);
        }

        function handleConnectionFailed(err) {
            unsubscribe();
            reject(err);
        }

        function onConnectionFailed (err) {
            console.error("CONNECTION FAILED:", err);

            if (!retry) {
                handleConnectionFailed(err);
                return;
            }

            // retry only if auth failed
            if (err !== ConnectionErrors.PASSWORD_REQUIRED) {
                handleConnectionFailed(err);
                return;
            }

            // do not retry if token is not valid
            if (config.token) {
                handleConnectionFailed(err);
                return;
            }

            // ask for password and try again

            if (authDialog) {
                authDialog.displayError(err);
                return;
            }

            authDialog = LoginDialog.showAuthDialog(
                function (id, password) {
                    connection.connect({id, password});
                }
            );
        }

        connection.connect(id, password);
    });
}
