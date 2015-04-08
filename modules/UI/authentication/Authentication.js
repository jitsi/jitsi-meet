/* global $, APP*/

var LoginDialog = require('./LoginDialog');
var Moderator = require('../../xmpp/moderator');

/* Initial "authentication required" dialog */
var authDialog = null;
/* Loop retry ID that wits for other user to create the room */
var authRetryId = null;
var authenticationWindow = null;

var Authentication = {
    openAuthenticationDialog: function (roomName, intervalCallback, callback) {
        // This is the loop that will wait for the room to be created by
        // someone else. 'auth_required.moderator' will bring us back here.
        authRetryId = window.setTimeout(intervalCallback, 5000);
        // Show prompt only if it's not open
        if (authDialog !== null) {
            return;
        }
        // extract room name from 'room@muc.server.net'
        var room = roomName.substr(0, roomName.indexOf('@'));

        var title
            = APP.translation.generateTranslatonHTML("dialog.WaitingForHost");
        var msg
            = APP.translation.generateTranslatonHTML(
                    "dialog.WaitForHostMsg", {room: room});

        var buttonTxt
            = APP.translation.generateTranslatonHTML("dialog.IamHost");
        var buttons = [];
        buttons.push({title: buttonTxt, value: "authNow"});

        authDialog = APP.UI.messageHandler.openDialog(
            title,
            msg,
            true,
            buttons,
            function (onSubmitEvent, submitValue) {

                // Do not close the dialog yet
                onSubmitEvent.preventDefault();

                // Open login popup
                if (submitValue === 'authNow') {
                    callback();
                }
            }
        );
    },
    closeAuthenticationWindow: function () {
        if (authenticationWindow) {
            authenticationWindow.close();
            authenticationWindow = null;
        }
    },
    xmppAuthenticate: function () {

        var loginDialog = LoginDialog.show(
            function (connection, state) {
                if (!state) {
                    // User cancelled
                    loginDialog.close();
                    return;
                } else if (state == APP.xmpp.Status.CONNECTED) {

                    loginDialog.close();

                    Authentication.stopInterval();
                    Authentication.closeAuthenticationDialog();

                    // Close the connection as anonymous one will be used
                    // to create the conference. Session-id will authorize
                    // the request.
                    connection.disconnect();

                    var roomName = APP.UI.generateRoomName();
                    Moderator.allocateConferenceFocus(roomName, function () {
                        // If it's not "on the fly" authentication now join
                        // the conference room
                        if (!APP.xmpp.getMUCJoined()) {
                            APP.UI.checkForNicknameAndJoin();
                        }
                    });
                }
            }, true);
    },
    focusAuthenticationWindow: function () {
        // If auth window exists just bring it to the front
        if (authenticationWindow) {
            authenticationWindow.focus();
            return;
        }
    },
    closeAuthenticationDialog: function () {
        // Close authentication dialog if opened
        if (authDialog) {
            authDialog.close();
            authDialog = null;
        }
    },
    createAuthenticationWindow: function (callback, url) {
        authenticationWindow = APP.UI.messageHandler.openCenteredPopup(
            url, 910, 660,
            // On closed
            function () {
                // Close authentication dialog if opened
                Authentication.closeAuthenticationDialog();
                callback();
                authenticationWindow = null;
            });
        return authenticationWindow;
    },
    stopInterval: function () {
        // Clear retry interval, so that we don't call 'doJoinAfterFocus' twice
        if (authRetryId) {
            window.clearTimeout(authRetryId);
            authRetryId = null;
        }
    }
};

module.exports = Authentication;