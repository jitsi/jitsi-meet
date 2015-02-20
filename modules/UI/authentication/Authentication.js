/* Initial "authentication required" dialog */
var authDialog = null;
/* Loop retry ID that wits for other user to create the room */
var authRetryId = null;
var authenticationWindow = null;

var Authentication = {
    openAuthenticationDialog: function (roomName, intervalCallback, callback) {
        // This is the loop that will wait for the room to be created by
        // someone else. 'auth_required.moderator' will bring us back here.
        authRetryId = window.setTimeout(intervalCallback , 5000);
        // Show prompt only if it's not open
        if (authDialog !== null) {
            return;
        }
        // extract room name from 'room@muc.server.net'
        var room = roomName.substr(0, roomName.indexOf('@'));

        var title = APP.translation.generateTranslatonHTML("dialog.Stop",
            "Stop");
        var defMsg = 'Authentication is required to create room:<br/><b>' +
            room +
            '</b></br> You can either authenticate to create the room or ' +
            'just wait for someone else to do so.';
        var msg = APP.translation.generateTranslatonHTML("dialog.AuthMsg",
            defMsg, {room: room});
        var button = APP.translation.generateTranslatonHTML(
            "dialog.Authenticate", "Authenticate");
        var buttons = {};
        buttons.authenticate = {title: button, value: "authNow"};

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
    closeAuthenticationWindow:function () {
        if (authenticationWindow) {
            authenticationWindow.close();
            authenticationWindow = null;
        }
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
            APP.UI.messageHandler.closeDialog();
            authDialog = null;
        }
    },
    createAuthenticationWindow: function (callback, url) {
        authenticationWindow = APP.UI.messageHandler.openCenteredPopup(
            url, 910, 660,
            // On closed
            function () {
                // Close authentication dialog if opened
                if (authDialog) {
                    messageHandler.closeDialog();
                    authDialog = null;
                }
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