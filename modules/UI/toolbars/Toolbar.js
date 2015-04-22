/* global APP,$, buttonClick, config, lockRoom,
   setSharedKey, Util */
var messageHandler = require("../util/MessageHandler");
var BottomToolbar = require("./BottomToolbar");
var Prezi = require("../prezi/Prezi");
var Etherpad = require("../etherpad/Etherpad");
var PanelToggler = require("../side_pannels/SidePanelToggler");
var Authentication = require("../authentication/Authentication");
var UIUtil = require("../util/UIUtil");
var AuthenticationEvents
    = require("../../../service/authentication/AuthenticationEvents");

var roomUrl = null;
var sharedKey = '';
var UI = null;

var buttonHandlers =
{
    "toolbar_button_mute": function () {
        return APP.UI.toggleAudio();
    },
    "toolbar_button_camera": function () {
        return APP.UI.toggleVideo();
    },
    /*"toolbar_button_authentication": function () {
        return Toolbar.authenticateClicked();
    },*/
    "toolbar_button_record": function () {
        return toggleRecording();
    },
    "toolbar_button_security": function () {
        return Toolbar.openLockDialog();
    },
    "toolbar_button_link": function () {
        return Toolbar.openLinkDialog();
    },
    "toolbar_button_chat": function () {
        return BottomToolbar.toggleChat();
    },
    "toolbar_button_prezi": function () {
        return Prezi.openPreziDialog();
    },
    "toolbar_button_etherpad": function () {
        return Etherpad.toggleEtherpad(0);
    },
    "toolbar_button_desktopsharing": function () {
        return APP.desktopsharing.toggleScreenSharing();
    },
    "toolbar_button_fullScreen": function()
    {
        UIUtil.buttonClick("#fullScreen", "icon-full-screen icon-exit-full-screen");
        return Toolbar.toggleFullScreen();
    },
    "toolbar_button_sip": function () {
        return callSipButtonClicked();
    },
    "toolbar_button_dialpad": function () {
        return dialpadButtonClicked();
    },
    "toolbar_button_settings": function () {
        PanelToggler.toggleSettingsMenu();
    },
    "toolbar_button_hangup": function () {
        return hangup();
    },
    "toolbar_button_login": function () {
        Toolbar.authenticateClicked();
    },
    "toolbar_button_logout": function () {
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

function hangup() {
    APP.xmpp.disposeConference();
    if(config.enableWelcomePage)
    {
        setTimeout(function()
        {
            window.localStorage.welcomePageDisabled = false;
            window.location.pathname = "/";
        }, 10000);

    }

    var title = APP.translation.generateTranslatonHTML(
        "dialog.sessTerminated");
    var msg = APP.translation.generateTranslatonHTML(
        "dialog.hungUp");
    var button = APP.translation.generateTranslatonHTML(
        "dialog.joinAgain");
    var buttons = [];
    buttons.push({title: button, value: true});

    UI.messageHandler.openDialog(
        title,
        msg,
        true,
        buttons,
        function(event, value, message, formVals)
        {
            window.location.reload();
            return false;
        }
    );
}

/**
 * Starts or stops the recording for the conference.
 */

function toggleRecording() {
    APP.xmpp.toggleRecording(function (callback) {
        var msg = APP.translation.generateTranslatonHTML(
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
    }, Toolbar.setRecordingButtonState, Toolbar.setRecordingButtonState);
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
        if (sharedKey)
        {
            console.log('set room password');
            Toolbar.lockLockButton();
        }
        else
        {
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
};

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

function dialpadButtonClicked()
{
    //TODO show the dialpad window
}

function callSipButtonClicked()
{
    var defaultNumber
        = config.defaultSipNumber ? config.defaultSipNumber : '';

    var sipMsg = APP.translation.generateTranslatonHTML(
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
    },

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
        if (!APP.xmpp.getMUCJoined()) {
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
        if (config.disablePrezi)
        {
            $("#prezi_button").css({display: "none"});
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
                var msg = APP.translation.generateTranslatonHTML(
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
        var inviteAttreibutes;

        if (roomUrl === null) {
            inviteAttreibutes = 'data-i18n="[value]roomUrlDefaultMsg" value="' +
            APP.translation.translateString("roomUrlDefaultMsg") + '"';
        } else {
            inviteAttreibutes = "value=\"" + encodeURI(roomUrl) + "\"";
        }
        messageHandler.openTwoButtonDialog("dialog.shareLink",
            null, null,
            '<input id="inviteLinkRef" type="text" ' +
                inviteAttreibutes + ' onclick="this.select();" readonly>',
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
        var settings1 = APP.translation.generateTranslatonHTML(
            "dialog.settings1");
        var settings2 = APP.translation.generateTranslatonHTML(
            "dialog.settings2");
        var settings3 = APP.translation.generateTranslatonHTML(
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
        if ($("#lockIcon").hasClass("icon-security-locked"))
            UIUtil.buttonClick("#lockIcon", "icon-security icon-security-locked");
    };
    /**
     * Updates the lock button state to locked.
     */
    my.lockLockButton = function () {
        if ($("#lockIcon").hasClass("icon-security"))
            UIUtil.buttonClick("#lockIcon", "icon-security icon-security-locked");
    };

    /**
     * Shows or hides authentication button
     * @param show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    my.showAuthenticateButton = function (show) {
        if (show) {
            $('#authentication').css({display: "inline"});
        }
        else {
            $('#authentication').css({display: "none"});
        }
    };

    // Shows or hides the 'recording' button.
    my.showRecordingButton = function (show) {
        if (!config.enableRecording) {
            return;
        }

        if (show) {
            $('#recording').css({display: "inline"});
        }
        else {
            $('#recording').css({display: "none"});
        }
    };

    // Sets the state of the recording button
    my.setRecordingButtonState = function (isRecording) {
        var selector = $('#recordButton');
        if (isRecording) {
            selector.removeClass("icon-recEnable");
            selector.addClass("icon-recEnable active");
        } else {
            selector.removeClass("icon-recEnable active");
            selector.addClass("icon-recEnable");
        }
    };

    // Shows or hides SIP calls button
    my.showSipCallButton = function (show) {
        if (APP.xmpp.isSipGatewayEnabled() && show) {
            $('#sipCallButton').css({display: "inline-block"});
        } else {
            $('#sipCallButton').css({display: "none"});
        }
    };

    // Shows or hides the dialpad button
    my.showDialPadButton = function (show) {
        if (show) {
            $('#dialPadButton').css({display: "inline-block"});
        } else {
            $('#dialPadButton').css({display: "none"});
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
        if (show) {
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
        if (show) {
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
        var button = $("#desktopsharing > a");
        if (active)
        {
            button.addClass("glow");
        }
        else
        {
            button.removeClass("glow");
        }
    };

    return my;
}(Toolbar || {}));

module.exports = Toolbar;