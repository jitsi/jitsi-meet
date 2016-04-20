/* global APP, $, config, interfaceConfig */
/* jshint -W101 */
import messageHandler from '../util/MessageHandler';
import UIUtil from '../util/UIUtil';
import AnalyticsAdapter from '../../statistics/AnalyticsAdapter';
import UIEvents from '../../../service/UI/UIEvents';

let roomUrl = null;
let emitter = null;


/**
 * Opens the invite link dialog.
 */
function openLinkDialog () {
    let inviteAttributes;

    if (roomUrl === null) {
        inviteAttributes = 'data-i18n="[value]roomUrlDefaultMsg" value="' +
            APP.translation.translateString("roomUrlDefaultMsg") + '"';
    } else {
        inviteAttributes = "value=\"" + encodeURI(roomUrl) + "\"";
    }
    messageHandler.openTwoButtonDialog(
        "dialog.shareLink", null, null,
        `<input id="inviteLinkRef" type="text" ${inviteAttributes} onclick="this.select();" readonly>`,
        false, "dialog.Invite",
        function (e, v) {
            if (v && roomUrl) {
                emitter.emit(UIEvents.USER_INVITED, roomUrl);
            }
        },
        function (event) {
            if (roomUrl) {
                document.getElementById('inviteLinkRef').select();
            } else {
                if (event && event.target) {
                    $(event.target).find('button[value=true]').prop('disabled', true);
                }
            }
        }
    );
}

const buttonHandlers = {
    "toolbar_button_mute": function () {
        let sharedVideoManager = APP.UI.getSharedVideoManager();

        if (APP.conference.audioMuted) {
            // If there's a shared video with the volume "on" and we aren't
            // the video owner, we warn the user
            // that currently it's not possible to unmute.
            if (sharedVideoManager
                && sharedVideoManager.isSharedVideoVolumeOn()
                && !sharedVideoManager.isSharedVideoOwner()) {
                UIUtil.animateShowElement(
                    $("#unableToUnmutePopup"), true, 5000);
            }
            else {
                AnalyticsAdapter.sendEvent('toolbar.audio.unmuted');
                emitter.emit(UIEvents.AUDIO_MUTED, false, true);
            }
        } else {
            AnalyticsAdapter.sendEvent('toolbar.audio.muted');
            emitter.emit(UIEvents.AUDIO_MUTED, true, true);
        }
    },
    "toolbar_button_camera": function () {
        if (APP.conference.videoMuted) {
            AnalyticsAdapter.sendEvent('toolbar.video.enabled');
            emitter.emit(UIEvents.VIDEO_MUTED, false);
        } else {
            AnalyticsAdapter.sendEvent('toolbar.video.disabled');
            emitter.emit(UIEvents.VIDEO_MUTED, true);
        }
    },
    "toolbar_button_security": function () {
        emitter.emit(UIEvents.ROOM_LOCK_CLICKED);
    },
    "toolbar_button_link": function () {
        AnalyticsAdapter.sendEvent('toolbar.invite.clicked');
        openLinkDialog();
    },
    "toolbar_button_chat": function () {
        AnalyticsAdapter.sendEvent('toolbar.chat.toggled');
        emitter.emit(UIEvents.TOGGLE_CHAT);
    },
    "toolbar_button_etherpad": function () {
        AnalyticsAdapter.sendEvent('toolbar.etherpad.clicked');
        emitter.emit(UIEvents.ETHERPAD_CLICKED);
    },
    "toolbar_button_sharedvideo": function () {
        AnalyticsAdapter.sendEvent('toolbar.sharedvideo.clicked');
        emitter.emit(UIEvents.SHARED_VIDEO_CLICKED);
    },
    "toolbar_button_desktopsharing": function () {
        if (APP.conference.isSharingScreen) {
            AnalyticsAdapter.sendEvent('toolbar.screen.disabled');
        } else {
            AnalyticsAdapter.sendEvent('toolbar.screen.enabled');
        }
        emitter.emit(UIEvents.TOGGLE_SCREENSHARING);
    },
    "toolbar_button_fullScreen": function() {
        AnalyticsAdapter.sendEvent('toolbar.fullscreen.enabled');
        UIUtil.buttonClick("#toolbar_button_fullScreen", "icon-full-screen icon-exit-full-screen");
        emitter.emit(UIEvents.FULLSCREEN_TOGGLE);
    },
    "toolbar_button_sip": function () {
        AnalyticsAdapter.sendEvent('toolbar.sip.clicked');
        showSipNumberInput();
    },
    "toolbar_button_dialpad": function () {
        AnalyticsAdapter.sendEvent('toolbar.sip.dialpad.clicked');
        dialpadButtonClicked();
    },
    "toolbar_button_settings": function () {
        AnalyticsAdapter.sendEvent('toolbar.settings.toggled');
        emitter.emit(UIEvents.TOGGLE_SETTINGS);
    },
    "toolbar_button_hangup": function () {
        AnalyticsAdapter.sendEvent('toolbar.hangup');
        emitter.emit(UIEvents.HANGUP);
    },
    "toolbar_button_login": function () {
        AnalyticsAdapter.sendEvent('toolbar.authenticate.login.clicked');
        emitter.emit(UIEvents.AUTH_CLICKED);
    },
    "toolbar_button_logout": function () {
        AnalyticsAdapter.sendEvent('toolbar.authenticate.logout.clicked');
        // Ask for confirmation
        messageHandler.openTwoButtonDialog(
            "dialog.logoutTitle",
            null,
            "dialog.logoutQuestion",
            null,
            false,
            "dialog.Yes",
            function (evt, yes) {
                if (yes) {
                    emitter.emit(UIEvents.LOGOUT);
                }
            }
        );
    }
};
const defaultToolbarButtons = {
    'microphone': '#toolbar_button_mute',
    'camera':     '#toolbar_button_camera',
    'desktop':    '#toolbar_button_desktopsharing',
    'security':   '#toolbar_button_security',
    'invite':     '#toolbar_button_link',
    'chat':       '#toolbar_button_chat',
    'etherpad':   '#toolbar_button_etherpad',
    'fullscreen': '#toolbar_button_fullScreen',
    'settings':   '#toolbar_button_settings',
    'hangup':     '#toolbar_button_hangup'
};

function dialpadButtonClicked() {
    //TODO show the dialpad box
}

function showSipNumberInput () {
    let defaultNumber = config.defaultSipNumber
        ? config.defaultSipNumber
        : '';

    let sipMsg = APP.translation.generateTranslationHTML("dialog.sipMsg");
    messageHandler.openTwoButtonDialog(
        null, null, null,
        `<h2>${sipMsg}</h2>
            <input name="sipNumber" type="text" value="${defaultNumber}" autofocus>`,
        false, "dialog.Dial",
        function (e, v, m, f) {
            if (v && f.sipNumber) {
                emitter.emit(UIEvents.SIP_DIAL, f.sipNumber);
            }
        },
        null, null, ':input:first'
    );
}

const Toolbar = {
    init (eventEmitter) {
        emitter = eventEmitter;
        // The toolbar is enabled by default.
        this.enabled = true;
        this.toolbarSelector = $("#header");

        UIUtil.hideDisabledButtons(defaultToolbarButtons);

        Object.keys(buttonHandlers).forEach(
            buttonId => $(`#${buttonId}`).click(buttonHandlers[buttonId])
        );
    },
    /**
     * Enables / disables the toolbar.
     * @param {e} set to {true} to enable the toolbar or {false}
     * to disable it
     */
    enable (e) {
        this.enabled = e;
        if (!e && this.isVisible())
            this.hide(false);
    },
    /**
     * Indicates if the bottom toolbar is currently enabled.
     * @return {this.enabled}
     */
    isEnabled() {
        return this.enabled;
    },
    /**
     * Updates the room invite url.
     */
    updateRoomUrl (newRoomUrl) {
        roomUrl = newRoomUrl;

        // If the invite dialog has been already opened we update the
        // information.
        let inviteLink = document.getElementById('inviteLinkRef');
        if (inviteLink) {
            inviteLink.value = roomUrl;
            inviteLink.select();
            $('#inviteLinkRef').parent()
                .find('button[value=true]').prop('disabled', false);
        }
    },

    /**
     * Unlocks the lock button state.
     */
    unlockLockButton () {
        if ($("#toolbar_button_security").hasClass("icon-security-locked"))
            UIUtil.buttonClick("#toolbar_button_security",
                                "icon-security icon-security-locked");
    },

    /**
     * Updates the lock button state to locked.
     */
    lockLockButton () {
        if ($("#toolbar_button_security").hasClass("icon-security"))
            UIUtil.buttonClick("#toolbar_button_security",
                                "icon-security icon-security-locked");
    },

    /**
     * Shows or hides authentication button
     * @param show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    showAuthenticateButton (show) {
        if (UIUtil.isButtonEnabled('authentication') && show) {
            $('#authentication').css({display: "inline"});
        } else {
            $('#authentication').css({display: "none"});
        }
    },

    showEtherpadButton () {
        if (!$('#toolbar_button_etherpad').is(":visible")) {
            $('#toolbar_button_etherpad').css({display: 'inline-block'});
        }
    },

    // Shows or hides the 'shared video' button.
    showSharedVideoButton () {
        if (UIUtil.isButtonEnabled('sharedvideo')
                && config.disableThirdPartyRequests !== true) {
            $('#toolbar_button_sharedvideo').css({display: "inline-block"});
        } else {
            $('#toolbar_button_sharedvideo').css({display: "none"});
        }
    },

    // checks whether desktop sharing is enabled and whether
    // we have params to start automatically sharing
    checkAutoEnableDesktopSharing () {
        if (UIUtil.isButtonEnabled('desktop')
            && config.autoEnableDesktopSharing) {
            emitter.emit(UIEvents.TOGGLE_SCREENSHARING);
        }
    },

    // Shows or hides SIP calls button
    showSipCallButton (show) {
        if (APP.conference.sipGatewayEnabled()
            && UIUtil.isButtonEnabled('sip') && show) {
            $('#toolbar_button_sip').css({display: "inline-block"});
        } else {
            $('#toolbar_button_sip').css({display: "none"});
        }
    },

    // Shows or hides the dialpad button
    showDialPadButton (show) {
        if (UIUtil.isButtonEnabled('dialpad') && show) {
            $('#toolbar_button_dialpad').css({display: "inline-block"});
        } else {
            $('#toolbar_button_dialpad').css({display: "none"});
        }
    },

    /**
     * Displays user authenticated identity name(login).
     * @param authIdentity identity name to be displayed.
     */
    setAuthenticatedIdentity (authIdentity) {
        if (authIdentity) {
            let selector = $('#toolbar_auth_identity');
            selector.css({display: "list-item"});
            selector.text(authIdentity);
        } else {
            $('#toolbar_auth_identity').css({display: "none"});
        }
    },

    /**
     * Shows/hides login button.
     * @param show <tt>true</tt> to show
     */
    showLoginButton (show) {
        if (UIUtil.isButtonEnabled('authentication') && show) {
            $('#toolbar_button_login').css({display: "list-item"});
        } else {
            $('#toolbar_button_login').css({display: "none"});
        }
    },

    /**
     * Shows/hides logout button.
     * @param show <tt>true</tt> to show
     */
    showLogoutButton (show) {
        if (UIUtil.isButtonEnabled('authentication') && show) {
            $('#toolbar_button_logout').css({display: "list-item"});
        } else {
            $('#toolbar_button_logout').css({display: "none"});
        }
    },

    /**
     * Update the state of the button. The button has blue glow if desktop
     * streaming is active.
     */
    updateDesktopSharingButtonState () {
        let button = $("#toolbar_button_desktopsharing");
        if (APP.conference.isSharingScreen) {
            button.addClass("glow");
        } else {
            button.removeClass("glow");
        }
    },

    /**
     * Marks video icon as muted or not.
     * @param {boolean} muted if icon should look like muted or not
     */
    markVideoIconAsMuted (muted) {
        $('#toolbar_button_camera').toggleClass("icon-camera-disabled", muted);
    },

    /**
     * Marks audio icon as muted or not.
     * @param {boolean} muted if icon should look like muted or not
     */
    markAudioIconAsMuted (muted) {
        $('#toolbar_button_mute').toggleClass("icon-microphone",
            !muted).toggleClass("icon-mic-disabled", muted);
    },

    /**
     * Indicates if the toolbar is currently hovered.
     * @return {true} if the toolbar is currently hovered, {false} otherwise
     */
    isHovered() {
        this.toolbarSelector.find('*').each(function () {
            let id = $(this).attr('id');
            if ($(`#${id}:hover`).length > 0) {
                return true;
            }
        });
        if ($("#bottomToolbar:hover").length > 0) {
            return true;
        }
        return false;
    },

    /**
     * Returns true if this toolbar is currently visible, or false otherwise.
     * @return <tt>true</tt> if currently visible, <tt>false</tt> - otherwise
     */
    isVisible() {
        return this.toolbarSelector.is(":visible");
    },

    /**
     * Hides the toolbar with animation or not depending on the animate
     * parameter.
     */
    hide() {
        this.toolbarSelector.hide(
            "slide", { direction: "up", duration: 300});
    },

    /**
     * Shows the toolbar with animation or not depending on the animate
     * parameter.
     */
    show() {
        this.toolbarSelector.show(
            "slide", { direction: "up", duration: 300});
    }
};

export default Toolbar;
