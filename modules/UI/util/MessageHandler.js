/* global $, APP */

import { jitsiLocalStorage } from '@jitsi/js-utils';
import Logger from 'jitsi-meet-logger';

import {
    NOTIFICATION_TIMEOUT,
    showErrorNotification,
    showNotification,
    showWarningNotification
} from '../../../react/features/notifications';

const logger = Logger.getLogger(__filename);

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
    if (!isDontShowAgainEnabled(options)) {
        return '';
    }

    const checked
        = options.checked === true ? 'checked' : '';


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
    if (isDontShowAgainEnabled(options)) {
        if (jitsiLocalStorage.getItem(options.localStorageKey || options.id)
            === 'true') {
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
    if (isDontShowAgainEnabled(options)) {
        return (...args) => {
            logger.debug(args, options.buttonValues);

            // args[1] is the value associated with the pressed button
            if (!options.buttonValues || options.buttonValues.length === 0
                || options.buttonValues.indexOf(args[1]) !== -1) {
                const checkbox = $(`#${options.id}`);

                if (checkbox.length) {
                    jitsiLocalStorage.setItem(
                        options.localStorageKey || options.id,
                        checkbox.prop('checked'));
                }
            }
            submitFunction(...args);
        };
    }

    return submitFunction;

}

/**
 * Check whether dont show again checkbox is enabled or not.
 * @param {object} options - options for dont show again checkbox.
 * @returns {boolean} true if enabled and false if not.
 */
function isDontShowAgainEnabled(options) {
    return typeof options === 'object';
}

const messageHandler = {
    OK: 'dialog.OK',
    CANCEL: 'dialog.Cancel',

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
    openTwoButtonDialog(options) {
        const {
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
            dontShowAgain
        } = options;

        let { classes } = options;

        if (!popupEnabled || twoButtonDialog) {
            return null;
        }

        if (dontShowTheDialog(dontShowAgain)) {
            // Maybe we should pass some parameters here? I'm not sure
            // and currently we don't need any parameters.
            submitFunction();

            return null;
        }

        const buttons = [];

        const leftButton = leftButtonKey
            ? APP.translation.generateTranslationHTML(leftButtonKey)
            : APP.translation.generateTranslationHTML('dialog.Submit');

        buttons.push({ title: leftButton,
            value: true });

        const cancelButton
            = APP.translation.generateTranslationHTML('dialog.Cancel');

        buttons.push({ title: cancelButton,
            value: false });

        let message = msgString;

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
            buttons,
            defaultButton,
            focus,
            loaded: loadedFunction,
            promptspeed: 0,
            classes,
            submit: dontShowAgainSubmitFunctionWrapper(dontShowAgain,
                (e, v, m, f) => { // eslint-disable-line max-params
                    twoButtonDialog = null;
                    if (v && submitFunction) {
                        submitFunction(e, v, m, f);
                    }
                }),
            close(e, v, m, f) { // eslint-disable-line max-params
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
    openDialog(// eslint-disable-line max-params
            titleKey,
            msgString,
            persistent,
            buttons,
            submitFunction,
            loadedFunction,
            closeFunction,
            dontShowAgain) {
        if (!popupEnabled) {
            return;
        }

        if (dontShowTheDialog(dontShowAgain)) {
            // Maybe we should pass some parameters here? I'm not sure
            // and currently we don't need any parameters.
            submitFunction();

            return;
        }

        const args = {
            title: this._getFormattedTitleString(titleKey),
            persistent,
            buttons,
            defaultButton: 1,
            promptspeed: 0,
            loaded() {
                if (loadedFunction) {
                    // eslint-disable-next-line prefer-rest-params
                    loadedFunction.apply(this, arguments);
                }

                // Hide the close button
                if (persistent) {
                    $('.jqiclose', this).hide();
                }
            },
            submit: dontShowAgainSubmitFunctionWrapper(
                dontShowAgain, submitFunction),
            close: closeFunction,
            classes: this._getDialogClasses()
        };

        if (persistent) {
            args.closeText = '';
        }

        const dialog = $.prompt(
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
        const $titleString = $('<h2>');

        $titleString.addClass('aui-dialog2-header-main');
        $titleString.attr('data-i18n', titleKey);

        return $('<div>').append($titleString)
            .html();
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
            close: 'aui-hide',
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
    openDialogWithStates(statesObject, options, translateOptions) {
        if (!popupEnabled) {
            return;
        }
        const { classes, size } = options;
        const defaultClasses = this._getDialogClasses(size);

        options.classes = Object.assign({}, defaultClasses, classes);
        options.promptspeed = options.promptspeed || 0;

        for (const state in statesObject) { // eslint-disable-line guard-for-in
            const currentState = statesObject[state];

            if (currentState.titleKey) {
                currentState.title
                    = this._getFormattedTitleString(currentState.titleKey);
            }
        }
        const dialog = $.prompt(statesObject, options);

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
    // eslint-disable-next-line max-params
    openCenteredPopup(url, w, h, onPopupClosed) {
        if (!popupEnabled) {
            return;
        }

        const l = window.screenX + (window.innerWidth / 2) - (w / 2);
        const t = window.screenY + (window.innerHeight / 2) - (h / 2);
        const popup = window.open(
            url, '_blank',
            String(`top=${t}, left=${l}, width=${w}, height=${h}`));

        if (popup && onPopupClosed) {
            const pollTimer = window.setInterval(() => {
                if (popup.closed !== false) {
                    window.clearInterval(pollTimer);
                    onPopupClosed();
                }
            }, 200);
        }

        return popup;
    },

    /**
     * Shows an error dialog to the user.
     *
     * @param {object} props - The properties to pass to the
     * showErrorNotification action.
     */
    showError(props) {
        APP.store.dispatch(showErrorNotification(props));
    },

    /**
     * Shows a warning dialog to the user.
     *
     * @param {object} props - The properties to pass to the
     * showWarningNotification action.
     */
    showWarning(props) {
        APP.store.dispatch(showWarningNotification(props));
    },

    /**
     * Displays a notification about participant action.
     * @param displayName the display name of the participant that is
     * associated with the notification.
     * @param displayNameKey the key from the language file for the display
     * name. Only used if displayName is not provided.
     * @param cls css class for the notification
     * @param messageKey the key from the language file for the text of the
     * message.
     * @param messageArguments object with the arguments for the message.
     * @param optional configurations for the notification (e.g. timeout)
     */
    participantNotification( // eslint-disable-line max-params
            displayName,
            displayNameKey,
            cls,
            messageKey,
            messageArguments,
            timeout = NOTIFICATION_TIMEOUT) {
        APP.store.dispatch(showNotification({
            descriptionArguments: messageArguments,
            descriptionKey: messageKey,
            titleKey: displayNameKey,
            title: displayName
        },
        timeout));
    },

    /**
     * Displays a notification.
     *
     * @param {string} titleKey - The key from the language file for the title
     * of the notification.
     * @param {string} messageKey - The key from the language file for the text
     * of the message.
     * @param {Object} messageArguments - The arguments for the message
     * translation.
     * @returns {void}
     */
    notify(titleKey, messageKey, messageArguments) {
        this.participantNotification(
            null, titleKey, null, messageKey, messageArguments);
    },

    enablePopups(enable) {
        popupEnabled = enable;
    },

    /**
     * Returns true if dialog is opened
     * false otherwise
     * @returns {boolean} isOpened
     */
    isDialogOpened() {
        return Boolean($.prompt.getCurrentStateName());
    }
};

export default messageHandler;
