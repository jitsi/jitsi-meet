/* global $, APP, JitsiMeetJS */

import UIEvents from '../../../service/UI/UIEvents';


/**
 * Substate for password
 * @type {{LOCKED: string, UNLOCKED: string}}
 */
const States = {
    LOCKED: 'locked',
    UNLOCKED: 'unlocked'
};

/**
 * Class representing view for Invite dialog
 * @class InviteDialogView
 */
export default class InviteDialogView {
    constructor(model) {
        let InviteAttributesKey = 'inviteUrlDefaultMsg';
        let title = APP.translation.translateString(InviteAttributesKey);

        this.unlockHint = "unlockHint";
        this.lockHint = "lockHint";
        this.model = model;

        if (this.model.inviteUrl === null) {
            this.inviteAttributes = (
                `data-i18n="[value]inviteUrlDefaultMsg" value="${title}"`
            );
        } else {
            let encodedInviteUrl = this.model.getEncodedInviteUrl();
            this.inviteAttributes = `value="${encodedInviteUrl}"`;
        }

        this.initDialog();
    }

    /**
     * Initialization of dialog property
     */
    initDialog() {
        let dialog = {};
        dialog.closeFunction = this.closeFunction.bind(this);
        dialog.submitFunction = this.submitFunction.bind(this);
        dialog.loadedFunction = this.loadedFunction.bind(this);

        let titleKey = "dialog.shareLink";
        let titleString = APP.translation.generateTranslationHTML(titleKey);

        dialog.titleKey = titleKey;
        dialog.titleString = titleString;
        this.dialog = dialog;

        this.dialog.states = this.getStates();
    }

    /**
     * Event handler for submitting dialog
     * @param e
     * @param v
     */
    submitFunction(e, v) {
        if (v && this.model.inviteUrl) {
            JitsiMeetJS.analytics.sendEvent('toolbar.invite.button');
        }
        else {
            JitsiMeetJS.analytics.sendEvent('toolbar.invite.cancel');
        }
    }

    /**
     * Event handler for load dialog
     * @param event
     */
    loadedFunction(event) {
        if (this.model.inviteUrl) {
            document.getElementById('inviteLinkRef').select();
        } else {
            if (event && event.target) {
                $(event.target).find('button[value=true]')
                    .prop('disabled', true);
            }
        }
    }

    /**
     * Event handler for closing dialog
     * @param e
     * @param v
     * @param m
     * @param f
     */
    closeFunction(e, v, m, f) {
        if(!v && !m && !f)
            JitsiMeetJS.analytics.sendEvent('toolbar.invite.close');
    }

    /**
     * Returns all states of the dialog
     * @returns {{}}
     */
    getStates() {
        let {
            titleString
        } = this.dialog;

        let states = {};

        states[States.UNLOCKED] = {
            title: titleString,
            html: this.getShareLinkBlock() + this.getAddPasswordBlock()
        };
        states[States.LOCKED] = {
            title: titleString,
            html: this.getShareLinkBlock() + this.getPasswordBlock()
        };

        return states;
    }

    /**
     * Layout for invite link input
     * @returns {string}
     */
    getShareLinkBlock() {
        let copyKey = 'dialog.copy';
        let copyText = APP.translation.translateString(copyKey);
        let roomLockDescKey = 'roomLocked';
        let roomLockDesc = APP.translation.translateString(roomLockDescKey);
        let roomUnlockKey = 'roomUnlocked';
        let roomUnlock = APP.translation.translateString(roomUnlockKey);

        return (
            `<div class="input-control">
                <label class="input-control__label for="inviteLinkRef">
                    ${this.dialog.titleString}
                </label>
                <div class="input-control__container">
                    <input class="input-control__input" id="inviteLinkRef"
                           type="text" ${this.inviteAttributes} readonly>
                    <button id="copyInviteLink" data-i18n="${copyKey}"
                            class="button-control button-control_light">
                        ${copyText}
                    </button>
                </div>
                <p class="input-control__hint ${this.lockHint}">
                   <span class="icon-security-locked"></span>
                   <span data-i18n="${roomLockDescKey}">${roomLockDesc}</span>
                </p>
                <p class="input-control__hint ${this.unlockHint}">
                   <span class="icon-security"></span>
                   <span data-i18n="${roomUnlockKey}">${roomUnlock}</span>
                </p>
            </div>`
        );
    }

    /**
     * Layout for adding password input
     * @returns {string}
     */
    getAddPasswordBlock() {
        let addPassKey = 'dialog.addPassword';
        let addPassText = APP.translation.translateString(addPassKey);
        let addKey = 'dialog.add';
        let addText = APP.translation.translateString(addKey);

        return (`
            <div class="input-control">
                <label class="input-control__label
                       for="newPasswordInput"
                       data-i18n="${addPassKey}">${addPassText}</label>
                <div class="input-control__container">
                    <input class="input-control__input" id="newPasswordInput"
                           type="text">
                    <button id="addPasswordBtn" id="inviteDialogAddPassword"
                            disabled data-i18n="${addKey}"
                            class="button-control button-control_light">
                        ${addText}
                    </button>
                </div>
            </div>
        `);
    }

    /**
     * Layout for password (when room is locked)
     * @returns {string}
     */
    getPasswordBlock() {
        let { password, isModerator } = this.model;
        let removePassKey = 'dialog.removePassword';
        let removePassText = APP.translation.translateString(removePassKey);
        let currentPassKey = 'dialog.currentPassword';
        let currentPassText = APP.translation.translateString(currentPassKey);
        let passwordKey = "dialog.passwordLabel";
        let passwordText = APP.translation.translateString(passwordKey);

        if (isModerator) {
            return (`
                <div class="input-control">
                    <label class="input-control__label"
                           data-i18n="${passwordKey}">${passwordText}</label>
                    <div class="input-control__container">
                        <p class="input-control__text"
                           data-i18n="${currentPassKey}">
                            ${currentPassText}
                            <span id="inviteDialogPassword"
                                  class="input-control__em">
                                ${password}
                            </span>
                        </p>
                        <a class="link input-control__right"
                           id="inviteDialogRemovePassword"
                           href="#" data-i18n="${removePassKey}">
                           ${removePassText}
                       </a>
                    </div>
                </div>
            `);
        } else {
            return (`
                <div class="input-control">
                    <p>A participant protected this call with a password.</p>
                </div>
            `);
        }

    }



    /**
     * Opening the dialog
     */
    open() {
        let leftButton;
        let {
            states,
            submitFunction,
            loadedFunction,
            closeFunction
        } = this.dialog;

        let buttons = [];
        let leftButtonKey = "dialog.Invite";
        let cancelButton
            = APP.translation.generateTranslationHTML("dialog.Cancel");
        buttons.push({title: cancelButton, value: false});

        leftButton = APP.translation.generateTranslationHTML(leftButtonKey);
        buttons.push({ title: leftButton, value: true});

        let initial = this.model.password ? States.LOCKED : States.UNLOCKED;

        APP.UI.messageHandler.openDialogWithStates(states, {
            submit: submitFunction,
            loaded: loadedFunction,
            close: closeFunction,
            buttons,
            size: 'medium'
        });
        $.prompt.goToState(initial);

        this.setupListeners();
        this.updateView();
    }

    /**
     * Setting event handlers
     * used in dialog
     */
    setupListeners() {
        let $passInput = $('#newPasswordInput');
        let $addPassBtn = $('#addPasswordBtn');

        $('#copyInviteLink').on('click', this.copyToClipboard);
        $addPassBtn.on('click', () => {
            let newPass = $passInput.val();
            let addPassCb = () => {
                this.model.password = newPass;
                $.prompt.goToState(States.LOCKED);
                this.updateView();
            };

            if(newPass) {
                APP.UI.emitEvent(UIEvents.LOCK_ROOM, newPass, addPassCb);
            }
        });
        $('#inviteDialogRemovePassword').on('click', () => {
            let removePassCb = () => {
                this.model.removePassword();
                $.prompt.goToState(States.UNLOCKED);
                this.updateView();
            };

            APP.UI.emitEvent(UIEvents.UNLOCK_ROOM, removePassCb);
        });
        $passInput.keyup(this.disableAddPassIfInputEmpty.bind(this));
        let updateView = this.updateView.bind(this);
        APP.UI.addListener(UIEvents.ROOM_UNLOCKED, updateView);
        APP.UI.addListener(UIEvents.ROOM_LOCKED, updateView);
    }

    /**
     * Checking input and if it's empty then
     * disable add pass button
     */
    disableAddPassIfInputEmpty() {
        let $passInput = $('#newPasswordInput');
        let $addPassBtn = $('#addPasswordBtn');

        if(!$passInput.val()) {
            $addPassBtn.prop('disabled', true);
        } else {
            $addPassBtn.prop('disabled', false);
        }
    }

    /**
     * Copying text to clipboard
     */
    copyToClipboard() {
        let inviteLink = document.getElementById('inviteLinkRef');

        if (inviteLink && inviteLink.select) {
            inviteLink.select();

            try {
                document.execCommand('copy');
                inviteLink.blur();
            }
            catch (err) {
                console.error('error when copy the text');
            }
        }
    }

    /**
     * Method syncing the view and the model
     * @param roomLocked
     */
    updateView() {
        $('#inviteDialogPassword').text(this.model.password);
        $('#newPasswordInput').val('');
        this.disableAddPassIfInputEmpty();

        let roomLocked = `.${this.lockHint}`;
        let roomUnlocked = `.${this.unlockHint}`;

        let showDesc = this.model.roomLocked ? roomLocked : roomUnlocked;
        let hideDesc = !this.model.roomLocked ? roomLocked : roomUnlocked;

        $(showDesc).show();
        $(hideDesc).hide();
    }
}