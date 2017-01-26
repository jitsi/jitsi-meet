/* global $, APP, JitsiMeetJS */
const logger = require("jitsi-meet-logger").getLogger(__filename);

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
        this.unlockHint = "unlockHint";
        this.lockHint = "lockHint";
        this.model = model;

        if (this.model.inviteUrl === null) {
            this.inviteAttributes = `data-i18n="[value]inviteUrlDefaultMsg"`;
        } else {
            this.inviteAttributes
                = `value="${this.model.getEncodedInviteUrl()}"`;
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
        let doneMsg = APP.translation.generateTranslationHTML('dialog.done');
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
        let classes = 'button-control button-control_light copyInviteLink';
        return (
            `<div class="form-control">
                <label class="form-control__label" for="inviteLinkRef"
                    data-i18n="${this.dialog.titleKey}"></label>
                <div class="form-control__container">
                    <input class="input-control inviteLink"
                           id="inviteLinkRef" type="text"
                           ${this.inviteAttributes} readonly>
                    <button data-i18n="dialog.copy" class="${classes}"></button>
                </div>
                <p class="form-control__hint ${this.lockHint}">
                   <span class="icon-security-locked"></span>
                   <span data-i18n="dialog.roomLocked"></span>
                </p>
                <p class="form-control__hint ${this.unlockHint}">
                   <span class="icon-security"></span>
                   <span data-i18n="roomUnlocked"></span>
                </p>
            </div>`
        );
    }

    /**
     * Layout for adding password input
     * @returns {string}
     */
    getAddPasswordBlock() {
        let html;

        if (this.model.isModerator) {
            html = (`
            <div class="form-control">
                <label class="form-control__label"
                       for="newPasswordInput" data-i18n="dialog.addPassword">
               </label>
                <div class="form-control__container">
                    <input class="input-control"
                           id="newPasswordInput"
                           type="text" 
                           data-i18n="[placeholder]dialog.createPassword">
                    <button id="addPasswordBtn" id="inviteDialogAddPassword"
                            disabled data-i18n="dialog.add"
                            class="button-control button-control_light">
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
        let password = this.model.getPassword();
        let { isModerator } = this.model;

        if (isModerator) {
            return (`
                <div class="form-control">
                    <label class="form-control__label"
                           data-i18n="dialog.passwordLabel"></label>
                    <div class="form-control__container">
                        <p>
                            <span class="form-control__text"
                                  data-i18n="dialog.currentPassword"></span>
                            <span id="inviteDialogPassword"
                                  class="form-control__em">
                                ${password}
                            </span>
                        </p>
                        <a class="link form-control__right"
                           id="inviteDialogRemovePassword"
                           data-i18n="dialog.removePassword"></a>
                    </div>
                </div>
            `);
        } else {
            return (`
                <div class="form-control">
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
        let boundSetPassword = this._setPassword.bind(this);
        $(document).on('click', addPasswordBtn, boundSetPassword);
        let boundDisablePass = this.disableAddPassIfInputEmpty.bind(this);
        $(document).on('keypress', newPasswordInput, boundDisablePass);

        // We need to handle keydown event because impromptu
        // is listening to it too for closing the dialog
        $(newPasswordInput).on('keydown', (e) => {
            if (e.keyCode === ENTER_KEY) {
                e.stopPropagation();
                this._setPassword();
            }
        });
    }

    /**
     * Marking room as locked
     * @private
     */
    _setPassword() {
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
                    logger.error('error when copy the text');
                }
            }
        });
    }

    /**
     * Method syncing the view and the model
     */
    updateView() {
        let pass = this.model.getPassword();
        let { isModerator } = this.model;
        if (this.model.getRoomLocker().lockedElsewhere || !pass) {
            $('#inviteDialogPassword').attr("data-i18n", "passwordSetRemotely");
            APP.translation.translateElement($('#inviteDialogPassword'));
        } else {
            $('#inviteDialogPassword').removeAttr("data-i18n");
            $('#inviteDialogPassword').text(pass);
        }

        // if we are not moderator we cannot remove password
        if (isModerator)
            $('#inviteDialogRemovePassword').show();
        else
            $('#inviteDialogRemovePassword').hide();

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