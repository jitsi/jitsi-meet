/* global APP, $, buttonClick, config, lockRoom, interfaceConfig, setSharedKey,
 Util */
/* jshint -W101 */
var messageHandler = require("../util/MessageHandler");
var BottomToolbar = require("./BottomToolbar");
var Prezi = require("../prezi/Prezi");
var Etherpad = require("../etherpad/Etherpad");
var PanelToggler = require("../side_pannels/SidePanelToggler");
var Authentication = require("../authentication/Authentication");
var UIUtil = require("../util/UIUtil");
var AuthenticationEvents
    = require("../../../service/authentication/AuthenticationEvents");
var AnalyticsAdapter = require("../../statistics/AnalyticsAdapter");

var roomUrl = null;
var sharedKey = '';
var UI = null;
var recordingToaster = null;

var buttonHandlers = {
    "toolbar_button_mute": function () {
        if (APP.RTC.localAudio.isMuted()) {
            AnalyticsAdapter.sendEvent('toolbar.audio.unmuted');
        } else {
            AnalyticsAdapter.sendEvent('toolbar.audio.muted');
        }
        return APP.UI.toggleAudio();
    },
    "toolbar_button_camera": function () {
        if (APP.RTC.localVideo.isMuted()) {
            AnalyticsAdapter.sendEvent('toolbar.video.enabled');
        } else {
            AnalyticsAdapter.sendEvent('toolbar.video.disabled');
        }
        return APP.UI.toggleVideo();
    },
    /*"toolbar_button_authentication": function () {
        return Toolbar.authenticateClicked();
    },*/
    "toolbar_button_record": function () {
        AnalyticsAdapter.sendEvent('toolbar.recording.toggled');
        return toggleRecording();
    },
    "toolbar_button_security": function () {
        if (sharedKey) {
            AnalyticsAdapter.sendEvent('toolbar.lock.disabled');
        } else {
            AnalyticsAdapter.sendEvent('toolbar.lock.enabled');
        }
        return Toolbar.openLockDialog();
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
        return Prezi.openPreziDialog();
    },
    "toolbar_button_etherpad": function () {
        AnalyticsAdapter.sendEvent('toolbar.etherpad.clicked');
        return Etherpad.toggleEtherpad(0);
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

function hangup() {
    APP.xmpp.disposeConference();
    if(config.enableWelcomePage) {
        setTimeout(function() {
            window.localStorage.welcomePageDisabled = false;
            window.location.pathname = "/";
        }, 10000);

    }

    var title = APP.translation.generateTranslationHTML(
        "dialog.sessTerminated");
    var msg = APP.translation.generateTranslationHTML(
        "dialog.hungUp");
    var button = APP.translation.generateTranslationHTML(
        "dialog.joinAgain");
    var buttons = [];
    buttons.push({title: button, value: true});

    UI.messageHandler.openDialog(
        title,
        msg,
        true,
        buttons,
        function(event, value, message, formVals) {
            window.location.reload();
            return false;
        }
    );
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

/**
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    var currentSharedKey = '';
    if (lock)
        currentSharedKey = sharedKey;

    APP.xmpp.lockRoom(currentSharedKey, function (res) {
        // password is required
        if (sharedKey) {
            console.log('set room password');
            Toolbar.lockLockButton();
        }
        else {
            console.log('removed room password');
            Toolbar.unlockLockButton();
        }
    }, function (err) {
        console.warn('setting password failed', err);
        messageHandler.showError("dialog.lockTitle",
            "dialog.lockMessage");
        Toolbar.setSharedKey('');
    }, function () {
        console.warn('room passwords not supported');
        messageHandler.showError("dialog.warning",
            "dialog.passwordNotSupported");
        Toolbar.setSharedKey('');
    });
}

/**
 * Invite participants to conference.
 */
function inviteParticipants() {
    if (roomUrl === null)
        return;

    var sharedKeyText = "";
    if (sharedKey && sharedKey.length > 0) {
        sharedKeyText =
            APP.translation.translateString("email.sharedKey",
                {sharedKey: sharedKey});
        sharedKeyText = sharedKeyText.replace(/\n/g, "%0D%0A");
    }

    var supportedBrowsers = "Chromium, Google Chrome " +
        APP.translation.translateString("email.and") + " Opera";
    var conferenceName = roomUrl.substring(roomUrl.lastIndexOf('/') + 1);
    var subject = APP.translation.translateString("email.subject",
        {appName:interfaceConfig.APP_NAME, conferenceName: conferenceName});
    var body = APP.translation.translateString("email.body",
        {appName:interfaceConfig.APP_NAME, sharedKeyText: sharedKeyText,
            roomUrl: roomUrl, supportedBrowsers: supportedBrowsers});
    body = body.replace(/\n/g, "%0D%0A");

    if (window.localStorage.displayname) {
        body += "%0D%0A%0D%0A" + window.localStorage.displayname;
    }

    if (interfaceConfig.INVITATION_POWERED_BY) {
        body += "%0D%0A%0D%0A--%0D%0Apowered by jitsi.org";
    }

    window.open("mailto:?subject=" + subject + "&body=" + body, '_blank');
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
                    APP.xmpp.dial(
                        numberInput, 'fromnumber', UI.getRoomName(), sharedKey);
                }
            }
        },
        null, null, ':input:first'
    );
}

var Toolbar = (function (my) {

    my.init = function (ui) {
        UIUtil.hideDisabledButtons(defaultToolbarButtons);

        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
        UI = ui;
        // Update login info
        APP.xmpp.addListener(
            AuthenticationEvents.IDENTITY_UPDATED,
            function (authenticationEnabled, userIdentity) {

                var loggedIn = false;
                if (userIdentity) {
                    loggedIn = true;
                }

                Toolbar.showAuthenticateButton(authenticationEnabled);

                if (authenticationEnabled) {
                    Toolbar.setAuthenticatedIdentity(userIdentity);

                    Toolbar.showLoginButton(!loggedIn);
                    Toolbar.showLogoutButton(loggedIn);
                }
            }
        );
    };

    /**
     * Sets shared key
     * @param sKey the shared key
     */
    my.setSharedKey = function (sKey) {
        sharedKey = sKey;
    };

    my.authenticateClicked = function () {
        Authentication.focusAuthenticationWindow();
        if (!APP.xmpp.isExternalAuthEnabled()) {
            Authentication.xmppAuthenticate();
            return;
        }
        // Get authentication URL
        if (!APP.xmpp.isMUCJoined()) {
            APP.xmpp.getLoginUrl(UI.getRoomName(), function (url) {
                // If conference has not been started yet - redirect to login page
                window.location.href = url;
            });
        } else {
            APP.xmpp.getPopupLoginUrl(UI.getRoomName(), function (url) {
                // Otherwise - open popup with authentication URL
                var authenticationWindow = Authentication.createAuthenticationWindow(
                    function () {
                        // On popup closed - retry room allocation
                        APP.xmpp.allocateConferenceFocus(
                            APP.UI.getRoomName(),
                            function () { console.info("AUTH DONE"); }
                        );
                    }, url);
                if (!authenticationWindow) {
                    messageHandler.openMessageDialog(
                        null, "dialog.popupError");
                }
            });
        }
    };

    /**
     * Updates the room invite url.
     */
    my.updateRoomUrl = function (newRoomUrl) {
        roomUrl = newRoomUrl;

        // If the invite dialog has been already opened we update the information.
        var inviteLink = document.getElementById('inviteLinkRef');
        if (inviteLink) {
            inviteLink.value = roomUrl;
            inviteLink.select();
            $('#inviteLinkRef').parent()
                .find('button[value=true]').prop('disabled', false);
        }
    };

    /**
     * Disables and enables some of the buttons.
     */
    my.setupButtonsFromConfig = function () {
        if (UIUtil.isButtonEnabled('prezi')) {
            $("#toolbar_button_prezi").css({display: "none"});
        }
    };

    /**
     * Opens the lock room dialog.
     */
    my.openLockDialog = function () {
        // Only the focus is able to set a shared key.
        if (!APP.xmpp.isModerator()) {
            if (sharedKey) {
                messageHandler.openMessageDialog(null,
                    "dialog.passwordError");
            } else {
                messageHandler.openMessageDialog(null, "dialog.passwordError2");
            }
        } else {
            if (sharedKey) {
                messageHandler.openTwoButtonDialog(null, null,
                    "dialog.passwordCheck",
                    null,
                    false,
                    "dialog.Remove",
                    function (e, v) {
                        if (v) {
                            Toolbar.setSharedKey('');
                            lockRoom(false);
                        }
                    });
            } else {
                var msg = APP.translation.generateTranslationHTML(
                    "dialog.passwordMsg");
                var yourPassword = APP.translation.translateString(
                    "dialog.yourPassword");
                messageHandler.openTwoButtonDialog(null, null, null,
                    '<h2>' + msg + '</h2>' +
                        '<input name="lockKey" type="text"' +
                        ' data-i18n="[placeholder]dialog.yourPassword" ' +
                        'placeholder="' + yourPassword + '" autofocus>',
                    false,
                    "dialog.Save",
                    function (e, v, m, f) {
                        if (v) {
                            var lockKey = f.lockKey;

                            if (lockKey) {
                                Toolbar.setSharedKey(
                                    UIUtil.escapeHtml(lockKey));
                                lockRoom(true);
                            }
                        }
                    },
                    null, null, 'input:first'
                );
            }
        }
    };

    /**
     * Opens the invite link dialog.
     */
    my.openLinkDialog = function () {
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
                if (v) {
                    if (roomUrl) {
                        inviteParticipants();
                    }
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
    };

    /**
     * Opens the settings dialog.
     * FIXME: not used ?
     */
    my.openSettingsDialog = function () {
        var settings1 = APP.translation.generateTranslationHTML(
            "dialog.settings1");
        var settings2 = APP.translation.generateTranslationHTML(
            "dialog.settings2");
        var settings3 = APP.translation.generateTranslationHTML(
            "dialog.settings3");

        var yourPassword = APP.translation.translateString(
            "dialog.yourPassword");

        messageHandler.openTwoButtonDialog(null,
            '<h2>' + settings1 + '</h2>' +
                '<input type="checkbox" id="initMuted">' +
                settings2 + '<br/>' +
                '<input type="checkbox" id="requireNicknames">' +
                 settings3 +
                '<input id="lockKey" type="text" placeholder="' + yourPassword +
                '" data-i18n="[placeholder]dialog.yourPassword" autofocus>',
            null,
            null,
            false,
            "dialog.Save",
            function () {
                document.getElementById('lockKey').focus();
            },
            function (e, v) {
                if (v) {
                    if ($('#initMuted').is(":checked")) {
                        // it is checked
                    }

                    if ($('#requireNicknames').is(":checked")) {
                        // it is checked
                    }
                    /*
                    var lockKey = document.getElementById('lockKey');

                    if (lockKey.value) {
                        setSharedKey(lockKey.value);
                        lockRoom(true);
                    }
                    */
                }
            }
        );
    };

    /**
     * Toggles the application in and out of full screen mode
     * (a.k.a. presentation mode in Chrome).
     */
    my.toggleFullScreen = function () {
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
    };
    /**
     * Unlocks the lock button state.
     */
    my.unlockLockButton = function () {
        if ($("#toolbar_button_security").hasClass("icon-security-locked"))
            UIUtil.buttonClick("#toolbar_button_security", "icon-security icon-security-locked");
    };
    /**
     * Updates the lock button state to locked.
     */
    my.lockLockButton = function () {
        if ($("#toolbar_button_security").hasClass("icon-security"))
            UIUtil.buttonClick("#toolbar_button_security", "icon-security icon-security-locked");
    };

    /**
     * Shows or hides authentication button
     * @param show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    my.showAuthenticateButton = function (show) {
        if (UIUtil.isButtonEnabled('authentication') && show) {
            $('#authentication').css({display: "inline"});
        }
        else {
            $('#authentication').css({display: "none"});
        }
    };

    // Shows or hides the 'recording' button.
    my.showRecordingButton = function (show) {
        if (UIUtil.isButtonEnabled('recording') && show) {
            $('#toolbar_button_record').css({display: "inline-block"});
        }
        else {
            $('#toolbar_button_record').css({display: "none"});
        }
    };

    // Sets the state of the recording button
    my.setRecordingButtonState = function (recordingState) {
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
    };

    // checks whether recording is enabled and whether we have params to start automatically recording
    my.checkAutoRecord = function () {
        if (UIUtil.isButtonEnabled('recording') && config.autoRecord) {
            toggleRecording(config.autoRecordToken);
        }
    };

    // Shows or hides SIP calls button
    my.showSipCallButton = function (show) {
        if (APP.xmpp.isSipGatewayEnabled() && UIUtil.isButtonEnabled('sip') && show) {
            $('#toolbar_button_sip').css({display: "inline-block"});
        } else {
            $('#toolbar_button_sip').css({display: "none"});
        }
    };

    // Shows or hides the dialpad button
    my.showDialPadButton = function (show) {
        if (UIUtil.isButtonEnabled('dialpad') && show) {
            $('#toolbar_button_dialpad').css({display: "inline-block"});
        } else {
            $('#toolbar_button_dialpad').css({display: "none"});
        }
    };

    /**
     * Displays user authenticated identity name(login).
     * @param authIdentity identity name to be displayed.
     */
    my.setAuthenticatedIdentity = function (authIdentity) {
        if (authIdentity) {
            var selector = $('#toolbar_auth_identity');
            selector.css({display: "list-item"});
            selector.text(authIdentity);
        } else {
            $('#toolbar_auth_identity').css({display: "none"});
        }
    };

    /**
     * Shows/hides login button.
     * @param show <tt>true</tt> to show
     */
    my.showLoginButton = function (show) {
        if (UIUtil.isButtonEnabled('authentication') && show) {
            $('#toolbar_button_login').css({display: "list-item"});
        } else {
            $('#toolbar_button_login').css({display: "none"});
        }
    };

    /**
     * Shows/hides logout button.
     * @param show <tt>true</tt> to show
     */
    my.showLogoutButton = function (show) {
        if (UIUtil.isButtonEnabled('authentication') && show) {
            $('#toolbar_button_logout').css({display: "list-item"});
        } else {
            $('#toolbar_button_logout').css({display: "none"});
        }
    };

    /**
     * Sets the state of the button. The button has blue glow if desktop
     * streaming is active.
     * @param active the state of the desktop streaming.
     */
    my.changeDesktopSharingButtonState = function (active) {
        var button = $("#toolbar_button_desktopsharing");
        if (active) {
            button.addClass("glow");
        } else {
            button.removeClass("glow");
        }
    };

    return my;
}(Toolbar || {}));

module.exports = Toolbar;
