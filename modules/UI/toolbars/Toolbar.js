/* global APP, $, config, interfaceConfig */
/* jshint -W101 */
var messageHandler = require("../util/MessageHandler");
var BottomToolbar = require("./BottomToolbar");
var PanelToggler = require("../side_pannels/SidePanelToggler");
var Authentication = require("../authentication/Authentication");
var UIUtil = require("../util/UIUtil");
var AnalyticsAdapter = require("../../statistics/AnalyticsAdapter");
var Feedback = require("../Feedback");
var UIEvents = require("../../../service/UI/UIEvents");

var roomUrl = null;
var recordingToaster = null;
var emitter = null;

var buttonHandlers = {
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
        return toggleRecording();
    },
    "toolbar_button_security": function () {
        emitter.emit(UIEvents.ROOM_LOCK_CLICKED);
    },
    "toolbar_button_link": function () {
        AnalyticsAdapter.sendEvent('toolbar.invite.clicked');
        return Toolbar.openLinkDialog();
    },
    "toolbar_button_chat": function () {
        AnalyticsAdapter.sendEvent('toolbar.chat.toggled');
        return BottomToolbar.toggleChat();
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
        return APP.desktopsharing.toggleScreenSharing();
    },
    "toolbar_button_fullScreen": function() {
        AnalyticsAdapter.sendEvent('toolbar.fullscreen.enabled');
        UIUtil.buttonClick("#toolbar_button_fullScreen", "icon-full-screen icon-exit-full-screen");
        return Toolbar.toggleFullScreen();
    },
    "toolbar_button_sip": function () {
        AnalyticsAdapter.sendEvent('toolbar.sip.clicked');
        return callSipButtonClicked();
    },
    "toolbar_button_dialpad": function () {
        AnalyticsAdapter.sendEvent('toolbar.sip.dialpad.clicked');
        return dialpadButtonClicked();
    },
    "toolbar_button_settings": function () {
        AnalyticsAdapter.sendEvent('toolbar.settings.toggled');
        PanelToggler.toggleSettingsMenu();
    },
    "toolbar_button_hangup": function () {
        AnalyticsAdapter.sendEvent('toolbar.hangup');
        return hangup();
    },
    "toolbar_button_login": function () {
        AnalyticsAdapter.sendEvent('toolbar.authenticate.login.clicked');
        Toolbar.authenticateClicked();
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
                    APP.xmpp.logout(function (url) {
                        if (url) {
                            window.location.href = url;
                        } else {
                            hangup();
                        }
                    });
                }
            });
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

/**
 * Hangs up this call.
 */
function hangup() {
    var conferenceDispose = function () {
        APP.xmpp.disposeConference();

        if (config.enableWelcomePage) {
            setTimeout(function() {
                window.localStorage.welcomePageDisabled = false;
                window.location.pathname = "/";
            }, 3000);
        }
    };

    if (Feedback.isEnabled())
    {
        // If the user has already entered feedback, we'll show the window and
        // immidiately start the conference dispose timeout.
        if (Feedback.feedbackScore > 0) {
            Feedback.openFeedbackWindow();
            conferenceDispose();

        }
        // Otherwise we'll wait for user's feedback.
        else
            Feedback.openFeedbackWindow(conferenceDispose);
    }
    else {
        conferenceDispose();

        // If the feedback functionality isn't enabled we show a thank you
        // dialog.
        APP.UI.messageHandler.openMessageDialog(null, null, null,
            APP.translation.translateString("dialog.thankYou",
                {appName:interfaceConfig.APP_NAME}));
    }
}

/**
 * Starts or stops the recording for the conference.
 */
function toggleRecording(predefinedToken) {
    APP.xmpp.toggleRecording(function (callback) {
        if (predefinedToken) {
            callback(UIUtil.escapeHtml(predefinedToken));
            return;
        }

        var msg = APP.translation.generateTranslationHTML(
            "dialog.recordingToken");
        var token = APP.translation.translateString("dialog.token");
        APP.UI.messageHandler.openTwoButtonDialog(null, null, null,
                '<h2>' + msg + '</h2>' +
                '<input name="recordingToken" type="text" ' +
                ' data-i18n="[placeholder]dialog.token" ' +
                'placeholder="' + token + '" autofocus>',
            false,
            "dialog.Save",
            function (e, v, m, f) {
                if (v) {
                    var token = f.recordingToken;

                    if (token) {
                        callback(UIUtil.escapeHtml(token));
                    }
                }
            },
            null,
            function () { },
            ':input:first'
        );
    }, Toolbar.setRecordingButtonState);
}

function dialpadButtonClicked() {
    //TODO show the dialpad box
}

function callSipButtonClicked() {
    var defaultNumber
        = config.defaultSipNumber ? config.defaultSipNumber : '';

    var sipMsg = APP.translation.generateTranslationHTML(
        "dialog.sipMsg");
    messageHandler.openTwoButtonDialog(null, null, null,
        '<h2>' + sipMsg + '</h2>' +
        '<input name="sipNumber" type="text"' +
        ' value="' + defaultNumber + '" autofocus>',
        false,
        "dialog.Dial",
        function (e, v, m, f) {
            if (v) {
                var numberInput = f.sipNumber;
                if (numberInput) {
                    APP.xmpp.dial(numberInput, 'fromnumber', APP.conference.roomName, APP.conference.sharedKey);
                }
            }
        },
        null, null, ':input:first'
    );
}

var Toolbar = {
    init (eventEmitter) {
        emitter = eventEmitter;
        UIUtil.hideDisabledButtons(defaultToolbarButtons);

        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
    },

    authenticateClicked () {
        Authentication.focusAuthenticationWindow();
        if (!APP.xmpp.isExternalAuthEnabled()) {
            Authentication.xmppAuthenticate();
            return;
        }
        // Get authentication URL
        if (!APP.xmpp.isMUCJoined()) {
            APP.xmpp.getLoginUrl(APP.conference.roomName, function (url) {
                // If conference has not been started yet - redirect to login page
                window.location.href = url;
            });
        } else {
            APP.xmpp.getPopupLoginUrl(APP.conference.roomName, function (url) {
                // Otherwise - open popup with authentication URL
                var authenticationWindow = Authentication.createAuthenticationWindow(
                    function () {
                        // On popup closed - retry room allocation
                        APP.xmpp.allocateConferenceFocus(
                            APP.conference.roomName,
                            function () { console.info("AUTH DONE"); }
                        );
                    }, url);
                if (!authenticationWindow) {
                    messageHandler.openMessageDialog(
                        null, "dialog.popupError");
                }
            });
        }
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
     * Opens the invite link dialog.
     */
    openLinkDialog () {
        var inviteAttributes;

        if (roomUrl === null) {
            inviteAttributes = 'data-i18n="[value]roomUrlDefaultMsg" value="' +
            APP.translation.translateString("roomUrlDefaultMsg") + '"';
        } else {
            inviteAttributes = "value=\"" + encodeURI(roomUrl) + "\"";
        }
        messageHandler.openTwoButtonDialog("dialog.shareLink",
            null, null,
            '<input id="inviteLinkRef" type="text" ' +
                inviteAttributes + ' onclick="this.select();" readonly>',
            false,
            "dialog.Invite",
            function (e, v) {
                if (v && roomUrl) {
                    emitter.emit(UIEvents.USER_INVITED, roomUrl);
                }
            },
            function (event) {
                if (roomUrl) {
                    document.getElementById('inviteLinkRef').select();
                } else {
                    if (event && event.target)
                        $(event.target)
                            .find('button[value=true]').prop('disabled', true);
                }
            }
        );
    },

    /**
     * Toggles the application in and out of full screen mode
     * (a.k.a. presentation mode in Chrome).
     */
    toggleFullScreen () {
        var fsElement = document.documentElement;

        if (!document.mozFullScreen && !document.webkitIsFullScreen) {
            //Enter Full Screen
            if (fsElement.mozRequestFullScreen) {
                fsElement.mozRequestFullScreen();
            }
            else {
                fsElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            //Exit Full Screen
            if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else {
                document.webkitCancelFullScreen();
            }
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

    // Sets the state of the recording button
    setRecordingButtonState (recordingState) {
        var selector = $('#toolbar_button_record');

        if (recordingState === 'on') {
            selector.removeClass("icon-recEnable");
            selector.addClass("icon-recEnable active");

            $("#largeVideo").toggleClass("videoMessageFilter", true);
            var recordOnKey = "recording.on";
            $('#videoConnectionMessage').attr("data-i18n", recordOnKey);
            $('#videoConnectionMessage').text(APP.translation.translateString(recordOnKey));

            setTimeout(function(){
                $("#largeVideo").toggleClass("videoMessageFilter", false);
                $('#videoConnectionMessage').css({display: "none"});
            }, 1500);

            recordingToaster = messageHandler.notify(null, "recording.toaster", null,
                null, null, {timeOut: 0, closeButton: null, tapToDismiss: false});
        } else if (recordingState === 'off') {
            selector.removeClass("icon-recEnable active");
            selector.addClass("icon-recEnable");

            $("#largeVideo").toggleClass("videoMessageFilter", false);
            $('#videoConnectionMessage').css({display: "none"});

            if (recordingToaster)
                messageHandler.remove(recordingToaster);

        } else if (recordingState === 'pending') {
            selector.removeClass("icon-recEnable active");
            selector.addClass("icon-recEnable");

            $("#largeVideo").toggleClass("videoMessageFilter", true);
            var recordPendingKey = "recording.pending";
            $('#videoConnectionMessage').attr("data-i18n", recordPendingKey);
            $('#videoConnectionMessage').text(APP.translation.translateString(recordPendingKey));
            $('#videoConnectionMessage').css({display: "block"});
        }
    },

    // checks whether recording is enabled and whether we have params
    // to start automatically recording
    checkAutoRecord () {
        if (UIUtil.isButtonEnabled('recording') && config.autoRecord) {
            toggleRecording(config.autoRecordToken);
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
        if (APP.xmpp.isSipGatewayEnabled() && UIUtil.isButtonEnabled('sip') && show) {
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
    }
};

export default Toolbar;
