/* global $, APP, JitsiMeetJS */

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
        let inviteAttributesKey = 'inviteUrlDefaultMsg';
        let title = APP.translation.translateString(inviteAttributesKey);

        this.unlockHint = "unlockHint";
        this.lockHint = "lockHint";
        this.model = model;

        if (this.model.inviteUrl === null) {
            this.inviteAttributes = (
                `data-i18n="[value]${inviteAttributesKey}" value="${title}"`
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

        dialog.titleKey = "dialog.shareLink";
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
        } else {
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
        $(document).off('click', '.copyInviteLink', this.copyToClipboard);

        if(!v && !m && !f)
            JitsiMeetJS.analytics.sendEvent('toolbar.invite.close');
    }

    /**
     * Returns all states of the dialog
     * @returns {{}}
     */
    getStates() {
        let {
            titleKey
        } = this.dialog;
        let doneKey = 'dialog.done';
        let doneMsg = APP.translation.translateString(doneKey);
        let states = {};
        let buttons = {};
        buttons[`${doneMsg}`] = true;

        states[States.UNLOCKED] = {
            titleKey,
            html: this.getShareLinkBlock() + this.getAddPasswordBlock(),
            buttons
        };
        states[States.LOCKED] = {
            titleKey,
            html: this.getShareLinkBlock() + this.getPasswordBlock(),
            buttons
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
        let roomLockDescKey = 'dialog.roomLocked';
        let roomLockDesc = APP.translation.translateString(roomLockDescKey);
        let roomUnlockKey = 'roomUnlocked';
        let roomUnlock = APP.translation.translateString(roomUnlockKey);
        let classes = 'button-control button-control_light copyInviteLink';
        let title = APP.translation.translateString(this.dialog.titleKey);
        return (
            `<div class="input-control">
                <label class="input-control__label" for="inviteLinkRef"
                    data-i18n="${this.dialog.titleKey}">
                        ${title}
                </label>
                <div class="input-control__container">
                    <input class="input-control__input inviteLink"
                           id="inviteLinkRef" type="text"
                           ${this.inviteAttributes} readonly>
                    <button data-i18n="${copyKey}"
                            class="${classes}">
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
        let hintKey = 'dialog.createPassword';
        let hintMsg = APP.translation.translateString(hintKey);
        let html;

        if (this.model.isModerator) {
            html = (`
            <div class="input-control">
                <label class="input-control__label
                       for="newPasswordInput"
                       data-i18n="${addPassKey}">${addPassText}</label>
                <div class="input-control__container">
                    <input class="input-control__input" id="newPasswordInput"
                           type="text" placeholder="${hintMsg}">
                    <button id="addPasswordBtn" id="inviteDialogAddPassword"
                            disabled data-i18n="${addKey}"
                            class="button-control button-control_light">
                        ${addText}
                    </button>
                </div>
            </div>
        `);
        } else {
            html = '';
        }

        return html;
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
                           data-i18n="${removePassKey}">
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
        let {
            submitFunction,
            loadedFunction,
            closeFunction
        } = this.dialog;

        let states = this.getStates();
        let initial = this.model.roomLocked ? States.LOCKED : States.UNLOCKED;

        APP.UI.messageHandler.openDialogWithStates(states, {
            submit: submitFunction,
            loaded: loadedFunction,
            close: closeFunction,
            size: 'medium'
        });
        $.prompt.goToState(initial);

        this.registerListeners();
        this.updateView();
    }

    /**
     * Setting event handlers
     * used in dialog
     */
    registerListeners() {
        const ENTER_KEY = 13;
        let addPasswordBtn = '#addPasswordBtn';
        let copyInviteLink = '.copyInviteLink';
        let newPasswordInput = '#newPasswordInput';
        let removePassword = '#inviteDialogRemovePassword';

        $(document).on('click', copyInviteLink, this.copyToClipboard);
        $(removePassword).on('click', () => {
            this.model.setRoomUnlocked();
        });
        let boundSetPassword = this.setPassword.bind(this);
        $(document).on('click', addPasswordBtn, boundSetPassword);
        let boundDisablePass = this.disableAddPassIfInputEmpty.bind(this);
        $(document).on('keypress', newPasswordInput, boundDisablePass);

        // We need to handle keydown event because impromptu
        // is listening to it too for closing the dialog
        $(newPasswordInput).on('keydown', (e) => {
            if (e.keyCode === ENTER_KEY) {
                e.stopPropagation();
                this.setPassword();
            }
        });
    }

    setPassword() {
        let $passInput = $('#newPasswordInput');
        let newPass = $passInput.val();

        if(newPass) {
            this.model.setRoomLocked(newPass);
        }
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
        $('.inviteLink').each(function () {
            let $el = $(this).closest('.jqistate');

            // TOFIX: We can select only visible elements
            if($el.css('display') === 'block') {
                this.select();

                try {
                    document.execCommand('copy');
                    this.blur();
                }
                catch (err) {
                    console.error('error when copy the text');
                }
            }
        });
    }

    /**
     * Method syncing the view and the model
     */
    updateView() {
        let pass = this.model.getPassword();
        if (!pass)
            pass = APP.translation.translateString("passwordSetRemotely");

        $('#inviteDialogPassword').attr("data-i18n", "passwordSetRemotely");
        $('#inviteDialogPassword').text(pass);
        $('#newPasswordInput').val('');
        this.disableAddPassIfInputEmpty();

        this.updateInviteLink();

        $.prompt.goToState(
            (this.model.isLocked())
                ? States.LOCKED
                : States.UNLOCKED);

        let roomLocked = `.${this.lockHint}`;
        let roomUnlocked = `.${this.unlockHint}`;

        let showDesc = this.model.isLocked() ? roomLocked : roomUnlocked;
        let hideDesc = !this.model.isLocked() ? roomLocked : roomUnlocked;

        $(showDesc).show();
        $(hideDesc).hide();
    }

    /**
     * Updates invite link
     */
    updateInviteLink() {
        // If the invite dialog has been already opened we update the
        // information.
        let inviteLink = document.querySelectorAll('.inviteLink');
        let list = Array.from(inviteLink);
        list.forEach((inviteLink) => {
            inviteLink.value = this.model.inviteUrl;
            inviteLink.select();
        });

        $('#inviteLinkRef').parent()
            .find('button[value=true]').prop('disabled', false);
    }
}