/* global $, APP, config*/

var XMPP = require('../../xmpp/xmpp');
var Moderator = require('../../xmpp/moderator');

//FIXME: use LoginDialog to add retries to XMPP.connect method used when
// anonymous domain is not enabled

/**
 * Creates new <tt>Dialog</tt> instance.
 * @param callback <tt>function(Strophe.Connection, Strophe.Status)</tt> called
 *        when we either fail to connect or succeed(check Strophe.Status).
 * @param obtainSession <tt>true</tt> if we want to send ConferenceIQ to Jicofo
 *        in order to create session-id after the connection is established.
 * @constructor
 */
function Dialog(callback, obtainSession) {

    var self = this;

    var stop = false;

    var connection = APP.xmpp.createConnection();

    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString("dialog.passwordRequired");
    message += '</h2>' +
        '<input name="username" type="text" ' +
        'placeholder="user@domain.net" autofocus>' +
        '<input name="password" ' +
        'type="password" data-i18n="[placeholder]dialog.userPassword"' +
        ' placeholder="user password">';

    var okButton = APP.translation.generateTranslatonHTML("dialog.Ok");

    var cancelButton = APP.translation.generateTranslatonHTML("dialog.Cancel");

    var states = {
        login: {
            html: message,
            buttons: [
                { title: okButton, value: true},
                { title: cancelButton, value: false}
            ],
            focus: ':input:first',
            submit: function (e, v, m, f) {
                e.preventDefault();
                if (v) {
                    var jid = f.username;
                    var password = f.password;
                    if (jid && password) {
                        stop = false;
                        connection.reset();
                        connDialog.goToState('connecting');
                        connection.connect(jid, password, stateHandler);
                    }
                } else {
                    // User cancelled
                    stop = true;
                    callback();
                }
            }
        },
        connecting: {
            title: APP.translation.translateString('dialog.connecting'),
            html:   '<div id="connectionStatus"></div>',
            buttons: [],
            defaultButton: 0
        },
        finished: {
            title: APP.translation.translateString('dialog.error'),
            html:   '<div id="errorMessage"></div>',
            buttons: [
                {
                    title: APP.translation.translateString('dialog.retry'),
                    value: 'retry'
                },
                {
                    title: APP.translation.translateString('dialog.Cancel'),
                    value: 'cancel'
                },
            ],
            defaultButton: 0,
            submit: function (e, v, m, f) {
                e.preventDefault();
                if (v === 'retry')
                    connDialog.goToState('login');
                else
                    callback();
            }
        }
    };

    var connDialog
        = APP.UI.messageHandler.openDialogWithStates(states,
                { persistent: true, closeText: '' }, null);

    var stateHandler = function (status, message) {
        if (stop) {
            return;
        }

        var translateKey = "connection." + XMPP.getStatusString(status);
        var statusStr = APP.translation.translateString(translateKey);

        // Display current state
        var connectionStatus =
            connDialog.getState('connecting').find('#connectionStatus');

        connectionStatus.text(statusStr);

        switch (status) {
            case XMPP.Status.CONNECTED:

                stop = true;
                if (!obtainSession) {
                    callback(connection, status);
                    return;
                }
                // Obtaining session-id status
                connectionStatus.text(
                    APP.translation.translateString(
                        'connection.FETCH_SESSION_ID'));

                // Authenticate with Jicofo and obtain session-id
                var roomName = APP.UI.generateRoomName();

                // Jicofo will return new session-id when connected
                // from authenticated domain
                connection.sendIQ(
                    Moderator.createConferenceIq(roomName),
                    function (result) {

                        connectionStatus.text(
                            APP.translation.translateString(
                                'connection.GOT_SESSION_ID'));

                        stop = true;

                        // Parse session-id
                        Moderator.parseSessionId(result);

                        callback(connection, status);
                    },
                    function (error) {
                        console.error("Auth on the fly failed", error);

                        stop = true;

                        var errorMsg =
                            APP.translation.translateString(
                                'connection.GET_SESSION_ID_ERROR') +
                                $(error).find('>error').attr('code');

                        self.displayError(errorMsg);

                        connection.disconnect();
                    });

                break;
            case XMPP.Status.AUTHFAIL:
            case XMPP.Status.CONNFAIL:
            case XMPP.Status.DISCONNECTED:

                stop = true;

                callback(connection, status);

                var errorMessage = statusStr;

                if (message)
                {
                    errorMessage += ': ' + message;
                }
                self.displayError(errorMessage);

                break;
            default:
                break;
        }
    };

    /**
     * Displays error message in 'finished' state which allows either to cancel
     * or retry.
     * @param message the final message to be displayed.
     */
    this.displayError = function (message) {

        var finishedState = connDialog.getState('finished');

        var errorMessageElem = finishedState.find('#errorMessage');
        errorMessageElem.text(message);

        connDialog.goToState('finished');
    };

    /**
     * Closes LoginDialog.
     */
    this.close = function () {
        stop = true;
        connDialog.close();
    };
}

var LoginDialog = {

    /**
     * Displays login prompt used to establish new XMPP connection. Given
     * <tt>callback(Strophe.Connection, Strophe.Status)</tt> function will be
     * called when we connect successfully(status === CONNECTED) or when we fail
     * to do so. On connection failure program can call Dialog.close() method in
     * order to cancel or do nothing to let the user retry.
     * @param callback <tt>function(Strophe.Connection, Strophe.Status)</tt>
     *        called when we either fail to connect or succeed(check
     *        Strophe.Status).
     * @param obtainSession <tt>true</tt> if we want to send ConferenceIQ to
     *        Jicofo in order to create session-id after the connection is
     *        established.
     * @returns {Dialog}
     */
    show: function (callback, obtainSession) {
        return new Dialog(callback, obtainSession);
    }
};

module.exports = LoginDialog;