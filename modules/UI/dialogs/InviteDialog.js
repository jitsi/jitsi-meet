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
        // TODO: Add translations
        return (
            `<div class="input-control">
                <label class="input-control__label for="inviteLinkRef">
                    ${this.dialog.titleString}
                </label>
                <div class="input-control__container">
                    <input class="input-control__input" id="inviteLinkRef"
                           type="text" ${this.inviteAttributes} readonly>
                    <button id="copyInviteLink"
                            class="button-control button-control_light">
                        Copy
                    </button>
                </div>
                <p class="input-control__hint">
                    This call is locked. New callers must have
                    the link and enter the password to join.
                </p>
            </div>`
        );
    }

    getAddPasswordBlock() {
        return (`
            <div class="input-control">
                <label class="input-control__label
                       for="newPasswordInput">Add password</label>
                <div class="input-control__container">
                    <input class="input-control__input" id="newPasswordInput"
                           type="text">
                    <button id="addPasswordBtn" id="inviteDialogAddPassword"
                            disabled
                            class="button-control button-control_light">
                        Add
                    </button>
                </div>
            </div>
        `);
    }

    getPasswordBlock() {
        let { password } = this;
        return (`
            <div class="input-control">
                <label class="input-control__label">Password</label>
                <div class="input-control__container">
                    <p class="input-control__text">
                        The current password is
                        <span id="inviteDialogPassword"
                              class="input-control__em">
                            ${password}
                        </span>
                    </p>
                    <a class="link input-control__right"
                       id="inviteDialogRemovePassword"
                       href="#">
                       Remove password
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
                this.updateView();
                $.prompt.goToState(States.LOCKED);
            };

            if(newPass) {
                this.emitter.emit(UIEvents.LOCK_ROOM, newPass, addPassCb);
            }
        });
        $('#inviteDialogRemovePassword').on('click', () => {
            let removePassCb = () => {
                this.password = null;
                this.updateView();
                $.prompt.goToState(States.UNLOCKED);
            };

            this.emitter.emit(UIEvents.UNLOCK_ROOM, removePassCb);
        });
        $passInput.keyup(this.disableAddPassIfInputEmpty.bind(this));
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

    updateView() {
        $('#inviteDialogPassword').text(this.password);
        $('#newPasswordInput').val('');
        this.disableAddPassIfInputEmpty();
    }
}