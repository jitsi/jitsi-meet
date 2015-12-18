/* global $, APP, config*/

var messageHandler = require('../util/MessageHandler');

function getPasswordInputHtml() {
    let placeholder = config.hosts.authdomain
        ? "user identity"
        : "user@domain.net";
    let passRequiredMsg = APP.translation.translateString(
        "dialog.passwordRequired"
    );
    return `
        <h2 data-i18n="dialog.passwordRequired">${passRequiredMsg}</h2>
        <input name="username" type="text" placeholder=${placeholder} autofocus>
        <input name="password" type="password"
    data-i18n="[placeholder]dialog.userPassword"
    placeholder="user password">
        `;
}

function toJid(id) {
    if (id.indexOf("@") >= 0) {
        return id;
    }

    let jid = id.concat('@');
    if (config.hosts.authdomain) {
        jid += config.hosts.authdomain;
    } else {
        jid += config.hosts.domain;
    }

    return jid;
}

function cancelButton() {
    return {
        title: APP.translation.generateTranslationHTML("dialog.Cancel"),
        value: false
    };
}

function Dialog(successCallback, cancelCallback) {
    let loginButtons = [{
        title: APP.translation.generateTranslationHTML("dialog.Ok"),
        value: true
    }];
    let finishedButtons = [{
        title: APP.translation.translateString('dialog.retry'),
        value: 'retry'
    }];

    // show "cancel" button only if cancelCallback provided
    if (cancelCallback) {
        loginButtons.push(cancelButton());
        finishedButtons.push(cancelButton());
    }

    const states = {
        login: {
            html: getPasswordInputHtml(),
            buttons: loginButtons,
            focus: ':input:first',
            submit: function (e, v, m, f) {
                e.preventDefault();
                if (v) {
                    let jid = f.username;
                    let password = f.password;
                    if (jid && password) {
                        connDialog.goToState('connecting');
                        successCallback(toJid(jid), password);
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
            buttons: finishedButtons,
            defaultButton: 0,
            submit: function (e, v, m, f) {
                e.preventDefault();
                if (v === 'retry') {
                    connDialog.goToState('login');
                } else {
                    // User cancelled
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

const LoginDialog = {

    showAuthDialog: function (successCallback, cancelCallback) {
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
    },

    showAuthRequiredDialog: function (roomName, onAuthNow) {
        var title = APP.translation.generateTranslationHTML(
            "dialog.WaitingForHost"
        );
        var msg = APP.translation.generateTranslationHTML(
            "dialog.WaitForHostMsg", {room: roomName}
        );

        var buttonTxt = APP.translation.generateTranslationHTML(
            "dialog.IamHost"
        );
        var buttons = [{title: buttonTxt, value: "authNow"}];

        return APP.UI.messageHandler.openDialog(
            title,
            msg,
            true,
            buttons,
            function (e, submitValue) {

                // Do not close the dialog yet
                e.preventDefault();

                // Open login popup
                if (submitValue === 'authNow') {
                    onAuthNow();
                }
            }
        );
    }
};

export default LoginDialog;
