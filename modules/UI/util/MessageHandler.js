/* global $, APP, toastr */

import UIUtil from './UIUtil';
import jitsiLocalStorage from '../../util/JitsiLocalStorage';

/**
 * Flag for enable/disable of the notifications.
 * @type {boolean}
 */
let notificationsEnabled = true;

/**
 * Flag for enabling/disabling popups.
 * @type {boolean}
 */
let popupEnabled = true;

/**
 * Currently displayed two button dialog.
 * @type {null}
 */
let twoButtonDialog = null;

/**
 * Generates html for dont show again checkbox.
 * @param {object} options options
 * @param {string} options.id the id of the checkbox.
 * @param {string} options.textKey the key for the text displayed next to
 * checkbox
 * @param {boolean} options.checked if true the checkbox is foing to be checked
 * by default.
 * @returns {string}
 */
function generateDontShowCheckbox(options) {
    if(!isDontShowAgainEnabled(options)) {
        return "";
    }

    let checked
        = (options.checked === true) ? "checked" : "";
    return `<br />
        <label>
            <input type='checkbox' ${checked} id='${options.id}' />
            <span data-i18n='${options.textKey}'></span>
        </label>`;
}

/**
 * Checks whether the dont show again checkbox was checked before.
 * @param {object} options - options for dont show again checkbox.
 * @param {string} options.id the id of the checkbox.
 * @param {string} options.localStorageKey the key for the local storage. if
 * not provided options.id will be used.
 * @returns {boolean} true if the dialog mustn't be displayed and
 * false otherwise.
 */
function dontShowTheDialog(options) {
    if(isDontShowAgainEnabled(options)) {
        if(jitsiLocalStorage.getItem(options.localStorageKey || options.id)
            === "true") {
            return true;
        }
    }
    return false;
}

/**
 * Wraps the submit function to process the dont show again status and store
 * it.
 * @param {object} options - options for dont show again checkbox.
 * @param {string} options.id the id of the checkbox.
 * @param {Array} options.buttonValues The button values that will trigger
 * storing he checkbox value
 * @param {string} options.localStorageKey the key for the local storage. if
 * not provided options.id will be used.
 * @param {Function} submitFunction the submit function to be wrapped
 * @returns {Function} wrapped function
 */
function dontShowAgainSubmitFunctionWrapper(options, submitFunction) {
    if(isDontShowAgainEnabled(options)) {
        return (...args) => {
            console.debug(args, options.buttonValues);
            //args[1] is the value associated with the pressed button
            if(!options.buttonValues || options.buttonValues.length === 0
                || options.buttonValues.indexOf(args[1]) !== -1 ) {
                let checkbox = $(`#${options.id}`);
                if (checkbox.length) {
                    jitsiLocalStorage.setItem(
                        options.localStorageKey || options.id,
                        checkbox.prop("checked"));
                }
            }
            submitFunction(...args);
        };
    } else {
        return submitFunction;
    }
}

/**
 * Check whether dont show again checkbox is enabled or not.
 * @param {object} options - options for dont show again checkbox.
 * @returns {boolean} true if enabled and false if not.
 */
function isDontShowAgainEnabled(options) {
    return typeof options === "object";
}

var messageHandler = {
    OK: "dialog.OK",
    CANCEL: "dialog.Cancel",

    /**
     * Shows a message to the user.
     *
     * @param titleKey the key used to find the translation of the title of the
     * message, if a message title is not provided.
     * @param messageKey the key used to find the translation of the message
     * @param i18nOptions the i18n options (optional)
     * @param closeFunction function to be called after
     * the prompt is closed (optional)
     * @return the prompt that was created, or null
     */
    openMessageDialog:
        function(titleKey, messageKey, i18nOptions, closeFunction) {
        if (!popupEnabled)
            return null;

        let dialog = $.prompt(
            APP.translation.generateTranslationHTML(messageKey, i18nOptions),
            {
            title: this._getFormattedTitleString(titleKey),
            persistent: false,
            promptspeed: 0,
            classes: this._getDialogClasses(),
            close: function (e, v, m, f) {
                if(closeFunction)
                    closeFunction(e, v, m, f);
            }
        });
        APP.translation.translateElement(dialog, i18nOptions);
        return $.prompt.getApi();
    },
    /**
     * Shows a message to the user with two buttons: first is given as a
     * parameter and the second is Cancel.
     *
     * @param titleKey the key for the title of the message
     * @param msgKey the key for the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is
     *        persistent or not
     * @param leftButton the fist button's text
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully
     *        loaded
     * @param closeFunction function to be called after the prompt is closed
     * @param focus optional focus selector or button index to be focused after
     *        the dialog is opened
     * @param defaultButton index of default button which will be activated when
     *        the user press 'enter'. Indexed from 0.
     * @param {object} dontShowAgain - options for dont show again checkbox.
     * @param {string} dontShowAgain.id the id of the checkbox.
     * @param {string} dontShowAgain.textKey the key for the text displayed
     * next to checkbox
     * @param {boolean} dontShowAgain.checked if true the checkbox is foing to
     * be checked
     * @param {Array} dontShowAgain.buttonValues The button values that will
     * trigger storing the checkbox value
     * @param {string} dontShowAgain.localStorageKey the key for the local
     * storage. if not provided dontShowAgain.id will be used.
     * @return the prompt that was created, or null
     */
    openTwoButtonDialog: function(options) {
        let {
            titleKey,
            msgKey,
            msgString,
            leftButtonKey,
            submitFunction,
            loadedFunction,
            closeFunction,
            focus,
            size,
            defaultButton,
            wrapperClass,
            classes,
            dontShowAgain
        } = options;

        if (!popupEnabled || twoButtonDialog)
            return null;

        if(dontShowTheDialog(dontShowAgain)) {
            // Maybe we should pass some parameters here? I'm not sure
            // and currently we don't need any parameters.
            submitFunction();
            return null;
        }

        var buttons = [];

        var leftButton = leftButtonKey ?
            APP.translation.generateTranslationHTML(leftButtonKey) :
            APP.translation.generateTranslationHTML('dialog.Submit');
        buttons.push({ title: leftButton, value: true});

        var cancelButton
            = APP.translation.generateTranslationHTML("dialog.Cancel");
        buttons.push({title: cancelButton, value: false});

        var message = msgString;
        if (msgKey) {
            message = APP.translation.generateTranslationHTML(msgKey);
        }
        message += generateDontShowCheckbox(dontShowAgain);
        classes = classes || this._getDialogClasses(size);
        if (wrapperClass) {
            classes.prompt += ` ${wrapperClass}`;
        }

        twoButtonDialog = $.prompt(message, {
            title: this._getFormattedTitleString(titleKey),
            persistent: false,
            buttons: buttons,
            defaultButton: defaultButton,
            focus: focus,
            loaded: loadedFunction,
            promptspeed: 0,
            classes,
            submit: dontShowAgainSubmitFunctionWrapper(dontShowAgain,
                function (e, v, m, f) {
                    twoButtonDialog = null;
                    if (v && submitFunction) {
                        submitFunction(e, v, m, f);
                    }
                }),
            close: function (e, v, m, f) {
                twoButtonDialog = null;
                if (closeFunction) {
                    closeFunction(e, v, m, f);
                }
            }
        });
        APP.translation.translateElement(twoButtonDialog);
        return $.prompt.getApi();
    },

    /**
     * Shows a message to the user with two buttons: first is given as a
     * parameter and the second is Cancel.
     *
     * @param titleKey the key for the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is
     *        persistent or not
     * @param buttons object with the buttons. The keys must be the name of the
     *        button and value is the value that will be passed to
     *        submitFunction
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully
     *        loaded
     * @param closeFunction function to be called on dialog close
     * @param {object} dontShowAgain - options for dont show again checkbox.
     * @param {string} dontShowAgain.id the id of the checkbox.
     * @param {string} dontShowAgain.textKey the key for the text displayed
     * next to checkbox
     * @param {boolean} dontShowAgain.checked if true the checkbox is foing to
     * be checked
     * @param {Array} dontShowAgain.buttonValues The button values that will
     * trigger storing the checkbox value
     * @param {string} dontShowAgain.localStorageKey the key for the local
     * storage. if not provided dontShowAgain.id will be used.
     */
    openDialog: function (titleKey, msgString, persistent, buttons,
        submitFunction, loadedFunction, closeFunction, dontShowAgain) {
        if (!popupEnabled)
            return;

        if(dontShowTheDialog(dontShowAgain)) {
            // Maybe we should pass some parameters here? I'm not sure
            // and currently we don't need any parameters.
            submitFunction();
            return;
        }

        let args = {
            title: this._getFormattedTitleString(titleKey),
            persistent: persistent,
            buttons: buttons,
            defaultButton: 1,
            promptspeed: 0,
            loaded: loadedFunction,
            submit: dontShowAgainSubmitFunctionWrapper(
                dontShowAgain, submitFunction),
            close: closeFunction,
            classes: this._getDialogClasses()
        };

        if (persistent) {
            args.closeText = '';
        }

        let dialog = $.prompt(
            msgString + generateDontShowCheckbox(dontShowAgain), args);
        APP.translation.translateElement(dialog);
        return $.prompt.getApi();
    },

    /**
     * Returns the formatted title string.
     *
     * @return the title string formatted as a div.
     */
    _getFormattedTitleString(titleKey) {
        let $titleString = $('<h2>');
        $titleString.addClass('aui-dialog2-header-main');
        $titleString.attr('data-i18n',titleKey);
        return $('<div>').append($titleString).html();
    },

    /**
     * Returns the dialog css classes.
     *
     * @return the dialog css classes
     */
    _getDialogClasses(size = 'small') {
        return {
            box: '',
            form: '',
            prompt: `dialog aui-layer aui-dialog2 aui-dialog2-${size}`,
            close: 'aui-icon aui-icon-small aui-iconfont-close-dialog',
            fade: 'aui-blanket',
            button: 'button-control',
            message: 'aui-dialog2-content',
            buttons: 'aui-dialog2-footer',
            defaultButton: 'button-control_primary',
            title: 'aui-dialog2-header'
        };
    },

    /**
     * Shows a dialog with different states to the user.
     *
     * @param statesObject object containing all the states of the dialog.
     * @param options impromptu options
     * @param translateOptions options passed to translation
     */
    openDialogWithStates: function (statesObject, options, translateOptions) {
        if (!popupEnabled)
            return;
        let { classes, size } = options;
        let defaultClasses = this._getDialogClasses(size);
        options.classes = Object.assign({}, defaultClasses, classes);
        options.promptspeed = options.promptspeed || 0;

        for (let state in statesObject) {
            let currentState = statesObject[state];
            if(currentState.titleKey) {
                currentState.title
                    = this._getFormattedTitleString(currentState.titleKey);
            }
        }
        let dialog = $.prompt(statesObject, options);
        APP.translation.translateElement(dialog, translateOptions);
        return $.prompt.getApi();
    },

    /**
     * Opens new popup window for given <tt>url</tt> centered over current
     * window.
     *
     * @param url the URL to be displayed in the popup window
     * @param w the width of the popup window
     * @param h the height of the popup window
     * @param onPopupClosed optional callback function called when popup window
     *        has been closed.
     *
     * @returns {object} popup window object if opened successfully or undefined
     *          in case we failed to open it(popup blocked)
     */
    openCenteredPopup: function (url, w, h, onPopupClosed) {
        if (!popupEnabled)
            return;

        var l = window.screenX + (window.innerWidth / 2) - (w / 2);
        var t = window.screenY + (window.innerHeight / 2) - (h / 2);
        var popup = window.open(
            url, '_blank',
            'top=' + t + ', left=' + l + ', width=' + w + ', height=' + h + '');
        if (popup && onPopupClosed) {
            var pollTimer = window.setInterval(function () {
                if (popup.closed !== false) {
                    window.clearInterval(pollTimer);
                    onPopupClosed();
                }
            }, 200);
        }

        return popup;
    },

    /**
     * Shows a dialog prompting the user to send an error report.
     *
     * @param titleKey the title of the message
     * @param msgKey the text of the message
     * @param error the error that is being reported
     */
    openReportDialog: function(titleKey, msgKey, error) {
        this.openMessageDialog(titleKey, msgKey);
        console.log(error);
        //FIXME send the error to the server
    },

    /**
     *  Shows an error dialog to the user.
     * @param titleKey the title of the message.
     * @param msgKey the text of the message.
     */
    showError: function(titleKey, msgKey) {

        if (!titleKey) {
            titleKey = "dialog.oops";
        }
        if (!msgKey) {
            msgKey = "dialog.defaultError";
        }
        messageHandler.openMessageDialog(titleKey, msgKey);
    },

    /**
     * Displays a notification.
     * @param displayName the display name of the participant that is
     * associated with the notification.
     * @param displayNameKey the key from the language file for the display
     * name. Only used if displayName i not provided.
     * @param cls css class for the notification
     * @param messageKey the key from the language file for the text of the
     * message.
     * @param messageArguments object with the arguments for the message.
     * @param options object with language options.
     */
    notify: function(displayName, displayNameKey, cls, messageKey,
                     messageArguments, options) {

        // If we're in ringing state we skip all toaster notifications.
        if(!notificationsEnabled || APP.UI.isOverlayVisible())
            return;

        var displayNameSpan = '<span class="nickname" ';
        if (displayName) {
            displayNameSpan += ">" + UIUtil.escapeHtml(displayName);
        } else {
            displayNameSpan += "data-i18n='" + displayNameKey + "'>";
        }
        displayNameSpan += "</span>";
        let element = toastr.info(
            displayNameSpan + '<br>' +
            '<span class=' + cls + ' data-i18n="' + messageKey + '"' +
                (messageArguments?
                    " data-i18n-options='"
                        + JSON.stringify(messageArguments) + "'"
                    : "") + "></span>", null, options);
        APP.translation.translateElement(element);
        return element;
    },

    /**
     * Removes the toaster.
     * @param toasterElement
     */
    remove: function(toasterElement) {
        toasterElement.remove();
    },

    /**
     * Enables / disables notifications.
     */
    enableNotifications: function (enable) {
        notificationsEnabled = enable;
    },

    enablePopups: function (enable) {
        popupEnabled = enable;
    },

    /**
     * Returns true if dialog is opened
     * false otherwise
     * @returns {boolean} isOpened
     */
    isDialogOpened: function () {
        return !!$.prompt.getCurrentStateName();
    }
};

module.exports = messageHandler;
