/* global APP, $, config, interfaceConfig, JitsiMeetJS */

import UIEvents from '../../../service/UI/UIEvents';

const States = {
    LOCKED: 'locked',
    UNLOCKED: 'unlocked'
};

export default class InviteDialog {
    constructor(options) {
        let InviteAttributesKey = 'roomUrlDefaultMsg';
        let title = APP.translation.translateString(InviteAttributesKey);

        this.password = options.password;
        this.roomUrl = options.roomUrl || null;
        this.emitter = options.emitter || null;
        this.unlockHint = "unlockHint";
        this.lockHint = "lockHint";

        if (this.roomUrl === null) {
            this.inviteAttributes = (
                `data-i18n="[value]roomUrlDefaultMsg" value="${title}"`
            );
        } else {
            let encodedRoomUrl = encodeURI(this.roomUrl);
            this.inviteAttributes = `value="${encodedRoomUrl}"`;
        }

        this.initDialog();
    }

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

    submitFunction(e, v) {
        if (v && this.roomUrl) {
            JitsiMeetJS.analytics.sendEvent('toolbar.invite.button');
            this.emitter.emit(UIEvents.USER_INVITED, this.roomUrl);
        }
        else {
            JitsiMeetJS.analytics.sendEvent('toolbar.invite.cancel');
        }
    }

    loadedFunction(event) {
        if (this.roomUrl) {
            document.getElementById('inviteLinkRef').select();
        } else {
            if (event && event.target) {
                $(event.target).find('button[value=true]')
                    .prop('disabled', true);
            }
        }
    }

    closeFunction(e, v, m, f) {
        if(!v && !m && !f)
            JitsiMeetJS.analytics.sendEvent('toolbar.invite.close');
    }

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
                <p class="input-control__hint ${this.lockHint}"
                   data-i18n="${roomLockDescKey}">
                    ${roomLockDesc}
                </p>
                <p class="input-control__hint ${this.unlockHint}"
                   data-i18n="${roomUnlockKey}">
                    ${roomUnlock}
                </p>
            </div>`
        );
    }

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

    getPasswordBlock() {
        let { password } = this;
        let removePassKey = 'dialog.removePassword';
        let removePassText = APP.translation.translateString(removePassKey);
        let currentPassKey = 'dialog.currentPassword';
        let currentPassText = APP.translation.translateString(currentPassKey);
        let passwordKey = "dialog.passwordLabel";
        let passwordText = APP.translation.translateString(passwordKey);

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
    }

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

        let initialState = this.password ? States.LOCKED : States.UNLOCKED;

        APP.UI.messageHandler.openDialogWithStates(states, {
            submit: submitFunction,
            loaded: loadedFunction,
            close: closeFunction,
            buttons,
            size: 'medium'
        });
        $.prompt.goToState(initialState);
        this.updateView(!!this.password);

        this.setHandlers();
    }

    setHandlers() {
        let $passInput = $('#newPasswordInput');
        let $addPassBtn = $('#addPasswordBtn');

        $('#copyInviteLink').on('click', this.copyToClipboard);
        $addPassBtn.on('click', () => {
            let newPass = $passInput.val();
            let addPassCb = () => {
                this.password = newPass;
                $.prompt.goToState(States.LOCKED);
                this.updateView(!!this.password);
            };

            if(newPass) {
                this.emitter.emit(UIEvents.LOCK_ROOM, newPass, addPassCb);
            }
        });
        $('#inviteDialogRemovePassword').on('click', () => {
            let removePassCb = () => {
                this.password = null;
                $.prompt.goToState(States.UNLOCKED);
                this.updateView(!!this.password);
            };

            this.emitter.emit(UIEvents.UNLOCK_ROOM, removePassCb);
        });
        $passInput.keyup(this.disableAddPassIfInputEmpty.bind(this));
        let updateViewUnlocked = this.updateView.bind(this, false);
        let updateViewLocked = this.updateView.bind(this, true);
        APP.UI.addListener(UIEvents.ROOM_UNLOCKED, updateViewUnlocked);
        APP.UI.addListener(UIEvents.ROOM_LOCKED, updateViewLocked);
    }

    disableAddPassIfInputEmpty() {
        let $passInput = $('#newPasswordInput');
        let $addPassBtn = $('#addPasswordBtn');

        if(!$passInput.val()) {
            $addPassBtn.prop('disabled', true);
        } else {
            $addPassBtn.prop('disabled', false);
        }
    }

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

    updateView(roomLocked) {
        $('#inviteDialogPassword').text(this.password);
        $('#newPasswordInput').val('');
        this.disableAddPassIfInputEmpty();

        let roomLockedDesc = `.${this.lockHint}`;
        let roomUnlockedDesc = `.${this.unlockHint}`;

        let showDesc = roomLocked ? roomLockedDesc : roomUnlockedDesc;
        let hideDesc = !roomLocked ? roomLockedDesc : roomUnlockedDesc;

        $(showDesc).show();
        $(hideDesc).hide();
    }
}