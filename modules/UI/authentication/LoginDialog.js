/* global $, APP, config */

import { toJid } from '../../../react/features/base/connection/functions';
import {
    JitsiConnectionErrors
} from '../../../react/features/base/lib-jitsi-meet';

/**
 * Build html for "password required" dialog.
 * @returns {string} html string
 */
function getPasswordInputHtml() {
    const placeholder = config.hosts.authdomain
        ? 'user identity'
        : 'user@domain.net';

    return `
        <input name="username" type="text"
               class="input-control"
               placeholder=${placeholder} autofocus>
        <input name="password" type="password"
               class="input-control"
               data-i18n="[placeholder]dialog.userPassword">`;
}

/**
 * Generate cancel button config for the dialog.
 * @returns {Object}
 */
function cancelButton() {
    return {
        title: APP.translation.generateTranslationHTML('dialog.Cancel'),
        value: false
    };
}

/**
 * Auth dialog for JitsiConnection which supports retries.
 * If no cancelCallback provided then there will be
 * no cancel button on the dialog.
 *
 * @class LoginDialog
 * @constructor
 *
 * @param {function(jid, password)} successCallback
 * @param {function} [cancelCallback] callback to invoke if user canceled.
 */
function LoginDialog(successCallback, cancelCallback) {
    const loginButtons = [ {
        title: APP.translation.generateTranslationHTML('dialog.Ok'),
        value: true
    } ];
    const finishedButtons = [ {
        title: APP.translation.generateTranslationHTML('dialog.retry'),
        value: 'retry'
    } ];

    // show "cancel" button only if cancelCallback provided
    if (cancelCallback) {
        loginButtons.push(cancelButton());
        finishedButtons.push(cancelButton());
    }

    const states = {
        login: {
            buttons: loginButtons,
            focus: ':input:first',
            html: getPasswordInputHtml(),
            titleKey: 'dialog.passwordRequired',

            submit(e, v, m, f) { // eslint-disable-line max-params
                e.preventDefault();
                if (v) {
                    const jid = f.username;
                    const password = f.password;

                    if (jid && password) {
                        // eslint-disable-next-line no-use-before-define
                        connDialog.goToState('connecting');
                        successCallback(toJid(jid, config.hosts), password);
                    }
                } else {
                    // User cancelled
                    cancelCallback();
                }
            }
        },
        connecting: {
            buttons: [],
            defaultButton: 0,
            html: '<div id="connectionStatus"></div>',
            titleKey: 'dialog.connecting'
        },
        finished: {
            buttons: finishedButtons,
            defaultButton: 0,
            html: '<div id="errorMessage"></div>',
            titleKey: 'dialog.error',

            submit(e, v) {
                e.preventDefault();
                if (v === 'retry') {
                    // eslint-disable-next-line no-use-before-define
                    connDialog.goToState('login');
                } else {
                    // User cancelled
                    cancelCallback();
                }
            }
        }
    };
    const connDialog = APP.UI.messageHandler.openDialogWithStates(
        states,
        {
            closeText: '',
            persistent: true,
            zIndex: 1020
        },
        null
    );

    /**
     * Displays error message in 'finished' state which allows either to cancel
     * or retry.
     * @param error the key to the error to be displayed.
     * @param options the options to the error message (optional)
     */
    this.displayError = function(error, options) {

        const finishedState = connDialog.getState('finished');

        const errorMessageElem = finishedState.find('#errorMessage');

        let messageKey;

        if (error === JitsiConnectionErrors.PASSWORD_REQUIRED) {
            // this is a password required error, as login window was already
            // open once, this means username or password is wrong
            messageKey = 'dialog.incorrectPassword';
        } else {
            messageKey = 'dialog.connectErrorWithMsg';

            if (!options) {
                options = {};// eslint-disable-line no-param-reassign
            }

            options.msg = error;
        }

        errorMessageElem.attr('data-i18n', messageKey);

        APP.translation.translateElement($(errorMessageElem), options);

        connDialog.goToState('finished');
    };

    /**
     *  Show message as connection status.
     * @param {string} messageKey the key to the message
     */
    this.displayConnectionStatus = function(messageKey) {
        const connectingState = connDialog.getState('connecting');

        const connectionStatus = connectingState.find('#connectionStatus');

        connectionStatus.attr('data-i18n', messageKey);
        APP.translation.translateElement($(connectionStatus));
    };

    /**
     * Closes LoginDialog.
     */
    this.close = function() {
        connDialog.close();
    };
}

export default {

    /**
     * Show new auth dialog for JitsiConnection.
     *
     * @param {function(jid, password)} successCallback
     * @param {function} [cancelCallback] callback to invoke if user canceled.
     *
     * @returns {LoginDialog}
     */
    showAuthDialog(successCallback, cancelCallback) {
        return new LoginDialog(successCallback, cancelCallback);
    },

    /**
     * Show notification that external auth is required (using provided url).
     * @param {string} url URL to use for external auth.
     * @param {function} callback callback to invoke when auth popup is closed.
     * @returns auth dialog
     */
    showExternalAuthDialog(url, callback) {
        const dialog = APP.UI.messageHandler.openCenteredPopup(
            url, 910, 660,

            // On closed
            callback
        );

        if (!dialog) {
            APP.UI.messageHandler.showWarning({
                descriptionKey: 'dialog.popupError',
                titleKey: 'dialog.popupErrorTitle'
            });
        }

        return dialog;
    },

    /**
     * Shows a notification that authentication is required to create the
     * conference, so the local participant should authenticate or wait for a
     * host.
     *
     * @param {string} room - The name of the conference.
     * @param {function} onAuthNow - The callback to invoke if the local
     * participant wants to authenticate.
     * @returns dialog
     */
    showAuthRequiredDialog(room, onAuthNow) {
        const msg = APP.translation.generateTranslationHTML(
            '[html]dialog.WaitForHostMsg',
            { room }
        );
        const buttonTxt = APP.translation.generateTranslationHTML(
            'dialog.IamHost'
        );
        const buttons = [ {
            title: buttonTxt,
            value: 'authNow'
        } ];

        return APP.UI.messageHandler.openDialog(
            'dialog.WaitingForHost',
            msg,
            true,
            buttons,
            (e, submitValue) => {
                // Do not close the dialog yet.
                e.preventDefault();

                // Open login popup.
                if (submitValue === 'authNow') {
                    onAuthNow();
                }
            }
        );
    }
};
