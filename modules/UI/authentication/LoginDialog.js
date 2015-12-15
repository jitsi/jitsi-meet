/* global $, APP, config*/

var messageHandler = require('../util/MessageHandler');

//FIXME: use LoginDialog to add retries to XMPP.connect method used when
// anonymous domain is not enabled

function Dialog(successCallback, cancelCallback) {
    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString("dialog.passwordRequired");
    message += '</h2>' +
        '<input name="username" type="text" ';
    if (config.hosts.authdomain) {
        message += 'placeholder="user identity" autofocus>';
    } else {
        message += 'placeholder="user@domain.net" autofocus>';
    }
    message += '<input name="password" ' +
        'type="password" data-i18n="[placeholder]dialog.userPassword"' +
        ' placeholder="user password">';

    var okButton = APP.translation.generateTranslationHTML("dialog.Ok");

    var cancelButton = APP.translation.generateTranslationHTML("dialog.Cancel");

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
                        connDialog.goToState('connecting');
                        successCallback(jid, password);
                    }
                } else {
                    // User cancelled
                    cancelCallback();
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
                if (v === 'retry') {
                    connDialog.goToState('login');
                } else {
                    cancelCallback();
                }
            }
        }
    };

    var connDialog = messageHandler.openDialogWithStates(
        states, { persistent: true, closeText: '' }, null
    );

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
    show: function (successCallback, cancelCallback) {
        return new Dialog(successCallback, cancelCallback);
    },

    showExternalAuthDialog: function (url, callback) {
        var dialog = messageHandler.openCenteredPopup(
            url, 910, 660,
            // On closed
            callback
        );

        if (!dialog) {
            messageHandler.openMessageDialog(null, "dialog.popupError");
        }

        return dialog;
    }
};

module.exports = LoginDialog;
