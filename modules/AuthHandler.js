/* global JitsiMeetJS */

import LoginDialog from './UI/authentication/LoginDialog';
import UIEvents from '../service/UI/UIEvents';
import UIUtil from './UI/util/UIUtil';
import {openConnection} from './connection';

const ConferenceEvents = JitsiMeetJS.events.conference;

let externalAuthWindow;
let authRequiredDialog;

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

            newRoom.on(ConferenceEvents.CONFERENCE_FAILED, function (err) {
                connection.disconnect();
                loginDialog.displayError(err);
            });
            // FIXME finish "on the fly" auth
            room.room.moderator.allocateConferenceFocus(function () {
                connection.disconnect();
                loginDialog.close();
            });

        }, function (err) {
            loginDialog.displayError(err);
        });
    }, function () { // user canceled
        loginDialog.close();
    });
}

function authenticate (room, lockPassword) {
    if (room.isExternalAuthEnabled()) {
        doExternalAuth(room, lockPassword);
    } else {
        doXmppAuth();
    }
}

function requireAuth(roomName) {
    if (authRequiredDialog) {
        return;
    }

    authRequiredDialog = LoginDialog.showAuthRequiredDialog(
        roomName, authenticate
    );
}

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
