/* global APP, config, JitsiMeetJS, Promise */

import LoginDialog from './LoginDialog';
import UIUtil from '../util/UIUtil';
import {openConnection} from '../../../connection';

const ConferenceEvents = JitsiMeetJS.events.conference;
const ConnectionErrors = JitsiMeetJS.errors.connection;

let externalAuthWindow;
let authRequiredDialog;

/**
 * Authenticate using external service or just focus
 * external auth window if there is one already.
 *
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function doExternalAuth (room, lockPassword) {
    if (externalAuthWindow) {
        externalAuthWindow.focus();
        return;
    }
    if (room.isJoined()) {
        room.getExternalAuthUrl(true).then(function (url) {
            externalAuthWindow = LoginDialog.showExternalAuthDialog(
                url,
                function () {
                    externalAuthWindow = null;
                    room.join(lockPassword);
                }
            );
        });
    } else {
        // If conference has not been started yet
        // then  redirect to login page
        room.getExternalAuthUrl().then(UIUtil.redirect);
    }
}

/**
 * Authenticate on the server.
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function doXmppAuth (room, lockPassword) {
    let loginDialog = LoginDialog.showAuthDialog(function (id, password) {
        // auth "on the fly":
        // 1. open new connection with proper id and password
        // 2. connect to the room
        // (this will store sessionId in the localStorage)
        // 3. close new connection
        // 4. reallocate focus in current room
        openConnection({id, password, roomName: room.getName()}).then(
        function (connection) {
            // open room
            let newRoom = connection.initJitsiConference(
                room.getName(), APP.conference._getConferenceOptions()
            );

            loginDialog.displayConnectionStatus(
                APP.translation.translateString('connection.FETCH_SESSION_ID')
            );

            newRoom.room.moderator.authenticate().then(function () {
                connection.disconnect();

                loginDialog.displayConnectionStatus(
                    APP.translation.translateString('connection.GOT_SESSION_ID')
                );

                // authenticate conference on the fly
                room.join(lockPassword);

                loginDialog.close();
            }).catch(function (error, code) {
                connection.disconnect();

                console.error('Auth on the fly failed', error);

                let errorMsg = APP.translation.translateString(
                    'connection.GET_SESSION_ID_ERROR'
                );

                loginDialog.displayError(errorMsg + code);
            });
        }, function (err) {
            loginDialog.displayError(err);
        });
    }, function () { // user canceled
        loginDialog.close();
    });
}

/**
 * Authenticate for the conference.
 * Uses external service for auth if conference supports that.
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function authenticate (room, lockPassword) {
    if (room.isExternalAuthEnabled()) {
        doExternalAuth(room, lockPassword);
    } else {
        doXmppAuth(room, lockPassword);
    }
}

/**
 * De-authenticate local user.
 *
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 * @returns {Promise}
 */
function logout (room) {
    return new Promise(function (resolve) {
        room.room.moderator.logout(resolve);
    }).then(function (url) {
        // de-authenticate conference on the fly
        if (room.isJoined()) {
            room.join();
        }

        return url;
    });
}

/**
 * Notify user that authentication is required to create the conference.
 * @param {JitsiConference} room
 * @param {string} [lockPassword] password to use if the conference is locked
 */
function requireAuth(room, lockPassword) {
    if (authRequiredDialog) {
        return;
    }

    authRequiredDialog = LoginDialog.showAuthRequiredDialog(
        room.getName(), authenticate.bind(null, room, lockPassword)
    );
}

/**
 * Close auth-related dialogs if there are any.
 */
function closeAuth() {
    if (externalAuthWindow) {
        externalAuthWindow.close();
        externalAuthWindow = null;
    }

    if (authRequiredDialog) {
        authRequiredDialog.close();
        authRequiredDialog = null;
    }
}

function showXmppPasswordPrompt(roomName, connect) {
    return new Promise(function (resolve, reject) {
        let authDialog = LoginDialog.showAuthDialog(
            function (id, password) {
                connect(id, password, roomName).then(function (connection) {
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
 * Show Authentication Dialog and try to connect with new credentials.
 * If failed to connect because of PASSWORD_REQUIRED error
 * then ask for password again.
 * @param {string} [roomName] name of the conference room
 * @param {function(id, password, roomName)} [connect] function that returns
 * a Promise which resolves with JitsiConnection or fails with one of
 * ConnectionErrors.
 * @returns {Promise<JitsiConnection>}
 */
function requestAuth(roomName, connect) {
    return showXmppPasswordPrompt(roomName, connect);
}


export default {
    authenticate,
    requireAuth,
    requestAuth,
    closeAuth,
    logout
};
