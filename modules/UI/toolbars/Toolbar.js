/* global APP, $, config, interfaceConfig */
/* jshint -W101 */
var messageHandler = require("../util/MessageHandler");
var UIUtil = require("../util/UIUtil");
var AnalyticsAdapter = require("../../statistics/AnalyticsAdapter");
var UIEvents = require("../../../service/UI/UIEvents");

var roomUrl = null;
var recordingToaster = null;
var emitter = null;


/**
 * Opens the invite link dialog.
 */
function openLinkDialog () {
    var inviteAttributes;

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

// Sets the state of the recording button
function setRecordingButtonState (recordingState) {
    let selector = $('#toolbar_button_record');

    if (recordingState === 'on') {
        selector.removeClass("icon-recEnable");
        selector.addClass("icon-recEnable active");

        $("#largeVideo").toggleClass("videoMessageFilter", true);
        let recordOnKey = "recording.on";
        $('#videoConnectionMessage').attr("data-i18n", recordOnKey);
        $('#videoConnectionMessage').text(APP.translation.translateString(recordOnKey));

        setTimeout(function(){
            $("#largeVideo").toggleClass("videoMessageFilter", false);
            $('#videoConnectionMessage').css({display: "none"});
        }, 1500);

        recordingToaster = messageHandler.notify(
            null, "recording.toaster", null,
            null, null,
            {timeOut: 0, closeButton: null, tapToDismiss: false}
        );
    } else if (recordingState === 'off') {
        selector.removeClass("icon-recEnable active");
        selector.addClass("icon-recEnable");

        $("#largeVideo").toggleClass("videoMessageFilter", false);
        $('#videoConnectionMessage').css({display: "none"});

        if (recordingToaster) {
            messageHandler.remove(recordingToaster);
        }
    } else if (recordingState === 'pending') {
        selector.removeClass("icon-recEnable active");
        selector.addClass("icon-recEnable");

        $("#largeVideo").toggleClass("videoMessageFilter", true);
        let recordPendingKey = "recording.pending";
        $('#videoConnectionMessage').attr("data-i18n", recordPendingKey);
        $('#videoConnectionMessage').text(APP.translation.translateString(recordPendingKey));
        $('#videoConnectionMessage').css({display: "block"});
    }
}

const buttonHandlers = {
    "toolbar_button_mute": function () {
        if (APP.conference.audioMuted) {
            AnalyticsAdapter.sendEvent('toolbar.audio.unmuted');
            emitter.emit(UIEvents.AUDIO_MUTED, false);
        } else {
            AnalyticsAdapter.sendEvent('toolbar.audio.muted');
            emitter.emit(UIEvents.AUDIO_MUTED, true);
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
    "toolbar_button_record": function () {
        AnalyticsAdapter.sendEvent('toolbar.recording.toggled');
        emitter.emit(UIEvents.RECORDING_TOGGLE);
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
    "toolbar_button_prezi": function () {
        AnalyticsAdapter.sendEvent('toolbar.prezi.clicked');
        emitter.emit(UIEvents.PREZI_CLICKED);
    },
    "toolbar_button_etherpad": function () {
        AnalyticsAdapter.sendEvent('toolbar.etherpad.clicked');
        emitter.emit(UIEvents.ETHERPAD_CLICKED);
    },
    "toolbar_button_desktopsharing": function () {
        if (APP.desktopsharing.isUsingScreenStream) {
            AnalyticsAdapter.sendEvent('toolbar.screen.disabled');
        } else {
            AnalyticsAdapter.sendEvent('toolbar.screen.enabled');
        }
        APP.desktopsharing.toggleScreenSharing();
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
var defaultToolbarButtons = {
    'microphone': '#toolbar_button_mute',
    'camera': '#toolbar_button_camera',
    'desktop': '#toolbar_button_desktopsharing',
    'security': '#toolbar_button_security',
    'invite': '#toolbar_button_link',
    'chat': '#toolbar_button_chat',
    'prezi': '#toolbar_button_prezi',
    'etherpad': '#toolbar_button_etherpad',
    'fullscreen': '#toolbar_button_fullScreen',
    'settings': '#toolbar_button_settings',
    'hangup': '#toolbar_button_hangup'
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
        UIUtil.hideDisabledButtons(defaultToolbarButtons);

        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
    },

    /**
     * Updates the room invite url.
     */
    updateRoomUrl (newRoomUrl) {
        roomUrl = newRoomUrl;

        // If the invite dialog has been already opened we update the information.
        var inviteLink = document.getElementById('inviteLinkRef');
        if (inviteLink) {
            inviteLink.value = roomUrl;
            inviteLink.select();
            $('#inviteLinkRef').parent()
                .find('button[value=true]').prop('disabled', false);
        }
    },

    /**
     * Disables and enables some of the buttons.
     */
    setupButtonsFromConfig () {
        if (UIUtil.isButtonEnabled('prezi')) {
            $("#toolbar_button_prezi").css({display: "none"});
        }
    },

    /**
     * Unlocks the lock button state.
     */
    unlockLockButton () {
        if ($("#toolbar_button_security").hasClass("icon-security-locked"))
            UIUtil.buttonClick("#toolbar_button_security", "icon-security icon-security-locked");
    },

    /**
     * Updates the lock button state to locked.
     */
    lockLockButton () {
        if ($("#toolbar_button_security").hasClass("icon-security"))
            UIUtil.buttonClick("#toolbar_button_security", "icon-security icon-security-locked");
    },

    /**
     * Shows or hides authentication button
     * @param show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    showAuthenticateButton (show) {
        if (UIUtil.isButtonEnabled('authentication') && show) {
            $('#authentication').css({display: "inline"});
        }
        else {
            $('#authentication').css({display: "none"});
        }
    },

    // Shows or hides the 'recording' button.
    showRecordingButton (show) {
        if (UIUtil.isButtonEnabled('recording') && show) {
            $('#toolbar_button_record').css({display: "inline-block"});
        }
        else {
            $('#toolbar_button_record').css({display: "none"});
        }
    },

    // checks whether recording is enabled and whether we have params
    // to start automatically recording
    checkAutoRecord () {
        if (UIUtil.isButtonEnabled('recording') && config.autoRecord) {
            emitter.emit(UIEvents.RECORDING_TOGGLE, UIUtil.escapeHtml(config.autoRecordToken));
        }
    },

    // checks whether desktop sharing is enabled and whether
    // we have params to start automatically sharing
    checkAutoEnableDesktopSharing () {
        if (UIUtil.isButtonEnabled('desktop')
                && config.autoEnableDesktopSharing) {
            APP.desktopsharing.toggleScreenSharing();
        }
    },

    // Shows or hides SIP calls button
    showSipCallButton (show) {
        if (APP.conference.sipGatewayEnabled && UIUtil.isButtonEnabled('sip') && show) {
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
            var selector = $('#toolbar_auth_identity');
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
     * Sets the state of the button. The button has blue glow if desktop
     * streaming is active.
     * @param active the state of the desktop streaming.
     */
    changeDesktopSharingButtonState (active) {
        var button = $("#toolbar_button_desktopsharing");
        if (active) {
            button.addClass("glow");
        } else {
            button.removeClass("glow");
        }
    },

    updateRecordingState (state) {
        setRecordingButtonState(state);
    }
};

export default Toolbar;
