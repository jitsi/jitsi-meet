/* global JitsiMeetJS, APP */

import LoginDialog from './LoginDialog';
import UIEvents from '../../../service/UI/UIEvents';
import UIUtil from '../util/UIUtil';
import {openConnection} from '../../../connection';

const ConferenceEvents = JitsiMeetJS.events.conference;

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
        openConnection({id, password}).then(function (connection) {
            // open room
            let newRoom = connection.initJitsiConference(room.getName());

            loginDialog.displayConnectionStatus(
                APP.translation.translateString('connection.FETCH_SESSION_ID')
            );

            newRoom.room.moderator.authenticate().then(function () {
                connection.disconnect();

                loginDialog.displayConnectionStatus(
                    APP.translation.translateString('connection.GOT_SESSION_ID')
                );

                if (room.isJoined()) {
                    // just reallocate focus if already joined
                    room.room.moderator.allocateConferenceFocus();
                } else {
                    // or join
                    room.join(lockPassword);
                }

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
        doXmppAuth();
    }
}

/**
 * Notify user that authentication is required to create the conference.
 */
function requireAuth(roomName) {
    if (authRequiredDialog) {
        return;
    }

    authRequiredDialog = LoginDialog.showAuthRequiredDialog(
        roomName, authenticate
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


export default {
    authenticate,
    requireAuth,
    closeAuth
};
