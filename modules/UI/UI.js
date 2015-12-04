/* global Strophe, APP, $, config, interfaceConfig, toastr */
/* jshint -W101 */
var UI = {};

var VideoLayout = require("./videolayout/VideoLayout.js");
var AudioLevels = require("./audio_levels/AudioLevels.js");
var Prezi = require("./prezi/Prezi.js");
var Etherpad = require("./etherpad/Etherpad.js");
var Chat = require("./side_pannels/chat/Chat.js");
var Toolbar = require("./toolbars/Toolbar");
var ToolbarToggler = require("./toolbars/ToolbarToggler");
var BottomToolbar = require("./toolbars/BottomToolbar");
var ContactList = require("./side_pannels/contactlist/ContactList");
var Avatar = require("./avatar/Avatar");
var EventEmitter = require("events");
var SettingsMenu = require("./side_pannels/settings/SettingsMenu");
var Settings = require("./../settings/Settings");
var PanelToggler = require("./side_pannels/SidePanelToggler");
UI.messageHandler = require("./util/MessageHandler");
var messageHandler = UI.messageHandler;
var Authentication  = require("./authentication/Authentication");
var UIUtil = require("./util/UIUtil");
var JitsiPopover = require("./util/JitsiPopover");
var CQEvents = require("../../service/connectionquality/CQEvents");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var StatisticsEvents = require("../../service/statistics/Events");
var UIEvents = require("../../service/UI/UIEvents");
var Feedback = require("./Feedback");

var eventEmitter = new EventEmitter();
UI.eventEmitter = eventEmitter;

function promptDisplayName() {
    var message = '<h2 data-i18n="dialog.displayNameRequired">';
    message += APP.translation.translateString(
        "dialog.displayNameRequired");
    message += '</h2>' +
        '<input name="displayName" type="text" data-i18n=' +
        '"[placeholder]defaultNickname" placeholder="' +
        APP.translation.translateString(
            "defaultNickname", {name: "Jane Pink"}) +
        '" autofocus>';

    var buttonTxt
        = APP.translation.generateTranslationHTML("dialog.Ok");
    var buttons = [];
    buttons.push({title: buttonTxt, value: "ok"});

    messageHandler.openDialog(null, message,
        true,
        buttons,
        function (e, v, m, f) {
            if (v == "ok") {
                var displayName = f.displayName;
                if (displayName) {
                    UI.inputDisplayNameHandler(displayName);
                    return true;
                }
            }
            e.preventDefault();
        },
        function () {
            var form  = $.prompt.getPrompt();
            var input = form.find("input[name='displayName']");
            input.focus();
            var button = form.find("button");
            button.attr("disabled", "disabled");
            input.keyup(function () {
                if(!input.val())
                    button.attr("disabled", "disabled");
                else
                    button.removeAttr("disabled");
            });
        }
    );
}

function setupPrezi() {
    $("#reloadPresentationLink").click(function() {
        Prezi.reloadPresentation();
    });
}

function setupChat() {
    Chat.init(eventEmitter);
    $("#toggle_smileys").click(function() {
        Chat.toggleSmileys();
    });
}

function setupToolbars() {
    Toolbar.init(eventEmitter);
    Toolbar.setupButtonsFromConfig();
    BottomToolbar.init(eventEmitter);
}

UI.notifyGracefulShudown = function () {
    messageHandler.openMessageDialog(
        'dialog.serviceUnavailable',
        'dialog.gracefulShutdown'
    );
};

UI.notifyReservationError = function (code, msg) {
    var title = APP.translation.generateTranslationHTML(
        "dialog.reservationError");
    var message = APP.translation.generateTranslationHTML(
        "dialog.reservationErrorMsg", {code: code, msg: msg});
    messageHandler.openDialog(
        title,
        message,
        true, {},
        function (event, value, message, formVals) {
            return false;
        }
    );
};

UI.notifyKicked = function () {
    messageHandler.openMessageDialog("dialog.sessTerminated", "dialog.kickMessage");
};

UI.notifyBridgeDown = function () {
    messageHandler.showError("dialog.error", "dialog.bridgeUnavailable");
};

UI.changeDisplayName = function (id, displayName) {
    ContactList.onDisplayNameChange(id, displayName);
    SettingsMenu.onDisplayNameChange(id, displayName);
    VideoLayout.onDisplayNameChanged(id, displayName);
};

UI.initConference = function () {
    var id = APP.conference.localId;
    Toolbar.updateRoomUrl(window.location.href);
    var meHTML = APP.translation.generateTranslationHTML("me");
    var settings = Settings.getSettings();

    $("#localNick").html(settings.email || settings.uid + " (" + meHTML + ")");

    // Make sure we configure our avatar id, before creating avatar for us
    UI.setUserAvatar(id, settings.email || settings.uid);

    // Add myself to the contact list.
    ContactList.addContact(id);

    // Once we've joined the muc show the toolbar
    ToolbarToggler.showToolbar();

    var displayName = config.displayJids ? id : settings.displayName;

    if (displayName) {
        UI.changeDisplayName('localVideoContainer', displayName);
    }

    VideoLayout.mucJoined();

    Toolbar.checkAutoEnableDesktopSharing();
};

function registerListeners() {
    UI.addListener(UIEvents.LARGEVIDEO_INIT, function () {
        AudioLevels.init();
    });

    UI.addListener(UIEvents.FILM_STRIP_TOGGLED, function (isToggled) {
        VideoLayout.onFilmStripToggled(isToggled);
    });

    UI.addListener(UIEvents.EMAIL_CHANGED, function (email) {
        UI.setUserAvatar(APP.conference.localId, email);
    });
}

function bindEvents() {
    function onResize() {
        Chat.resizeChat();
        VideoLayout.resizeLargeVideoContainer();
    }

    // Resize and reposition videos in full screen mode.
    $(document).on(
        'webkitfullscreenchange mozfullscreenchange fullscreenchange', onResize
    );

    $(window).resize(onResize);
}

UI.start = function () {
    document.title = interfaceConfig.APP_NAME;
    var setupWelcomePage = null;
    if(config.enableWelcomePage && window.location.pathname == "/" &&
        (!window.localStorage.welcomePageDisabled ||
            window.localStorage.welcomePageDisabled == "false")) {
        $("#videoconference_page").hide();
        if (!setupWelcomePage)
            setupWelcomePage = require("./welcome_page/WelcomePage");
        setupWelcomePage();

        return;
    }

    $("#welcome_page").hide();

    // Set the defaults for prompt dialogs.
    $.prompt.setDefaults({persistent: false});

    registerListeners();

    VideoLayout.init(eventEmitter);

    bindEvents();
    setupPrezi();
    if (!interfaceConfig.filmStripOnly) {
        $("#videospace").mousemove(function () {
            return ToolbarToggler.showToolbar();
        });
        setupToolbars();
        setupChat();
        // Display notice message at the top of the toolbar
        if (config.noticeMessage) {
            $('#noticeText').text(config.noticeMessage);
            $('#notice').css({display: 'block'});
        }
        $("#downloadlog").click(function (event) {
            // dump(event.target);
            // FIXME integrate logs
        });
        Feedback.init();
    } else {
        $("#header").css("display", "none");
        $("#bottomToolbar").css("display", "none");
        $("#downloadlog").css("display", "none");
        $("#remoteVideos").css("padding", "0px 0px 18px 0px");
        $("#remoteVideos").css("right", "0px");
        messageHandler.disableNotifications();
        $('body').popover("disable");
        JitsiPopover.enabled = false;
    }

    document.title = interfaceConfig.APP_NAME;

    if(config.requireDisplayName) {
        if (APP.settings.getDisplayName()) {
            promptDisplayName();
        }
    }

    if (!interfaceConfig.filmStripOnly) {
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "positionClass": "notification-bottom-right",
            "onclick": null,
            "showDuration": "300",
            "hideDuration": "1000",
            "timeOut": "2000",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut",
            "reposition": function () {
                if (PanelToggler.isVisible()) {
                    $("#toast-container").addClass("notification-bottom-right-center");
                } else {
                    $("#toast-container").removeClass("notification-bottom-right-center");
                }
            },
            "newestOnTop": false
        };

        SettingsMenu.init();
    }

};


UI.addLocalStream = function (stream, isMuted) {
    switch (stream.type) {
    case 'audio':
        VideoLayout.changeLocalAudio(stream, isMuted);
        break;
    case 'video':
        VideoLayout.changeLocalVideo(stream, isMuted);
        break;
    default:
        console.error("Unknown stream type: " + stream.type);
        break;
    }
};


UI.addRemoteStream = function (stream) {
    VideoLayout.onRemoteStreamAdded(stream);
};

function chatAddError(errorMessage, originalText) {
    return Chat.chatAddError(errorMessage, originalText);
}

function chatSetSubject(text) {
    return Chat.chatSetSubject(text);
}

function initEtherpad(name) {
    Etherpad.init(name);
}

function onLocalRoleChanged(jid, info, pres, isModerator) {
    console.info("My role changed, new role: " + info.role);
    onModeratorStatusChanged(isModerator);
    VideoLayout.showModeratorIndicator();
    SettingsMenu.onRoleChanged();

    if (isModerator) {
        Authentication.closeAuthenticationWindow();
        messageHandler.notify(null, "notify.me",
            'connected', "notify.moderator");

        Toolbar.checkAutoRecord();
    }
}

function onModeratorStatusChanged(isModerator) {
    Toolbar.showSipCallButton(isModerator);
    Toolbar.showRecordingButton(
        isModerator); //&&
    // FIXME:
    // Recording visible if
    // there are at least 2(+ 1 focus) participants
    //Object.keys(connection.emuc.members).length >= 3);
}

UI.notifyPasswordRequired = function (callback) {
    // password is required
    Toolbar.lockLockButton();
    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString(
        "dialog.passwordRequired");
    message += '</h2>' +
        '<input name="lockKey" type="text" data-i18n=' +
        '"[placeholder]dialog.password" placeholder="' +
        APP.translation.translateString("dialog.password") +
        '" autofocus>';

    messageHandler.openTwoButtonDialog(null, null, null, message,
        true,
        "dialog.Ok",
        function (e, v, m, f) {},
        null,
        function (e, v, m, f) {
            if (v) {
                var lockKey = f.lockKey;
                if (lockKey) {
                    Toolbar.setSharedKey(lockKey);
                    callback(lockKey);
                }
            }
        },
        ':input:first'
    );
};

/**
 * The dialpad button is shown iff there is at least one member that supports
 * DTMF (e.g. jigasi).
 */
function onDtmfSupportChanged(dtmfSupport) {
    //TODO: enable when the UI is ready
    //Toolbar.showDialPadButton(dtmfSupport);
}

UI.addUser = function (jid, id, displayName) {
    messageHandler.notify(
        displayName,'notify.somebody', 'connected', 'notify.connected'
    );

    if (!config.startAudioMuted ||
        config.startAudioMuted > APP.conference.membersCount)
        UIUtil.playSoundNotification('userJoined');

    // Configure avatar
    UI.setUserAvatar(jid, id);

    // Add Peer's container
    VideoLayout.ensurePeerContainerExists(jid);
};

UI.removeUser = function (jid) {
    console.log('left.muc', jid);
    var displayName = $('#participant_' + Strophe.getResourceFromJid(jid) +
        '>.displayname').html();
    messageHandler.notify(displayName,'notify.somebody',
        'disconnected',
        'notify.disconnected');
    if (!config.startAudioMuted ||
        config.startAudioMuted > APP.conference.membersCount) {
        UIUtil.playSoundNotification('userLeft');
    }

    ContactList.removeContact(jid);

    VideoLayout.participantLeft(jid);
};

function onMucPresenceStatus(jid, info) {
    VideoLayout.setPresenceStatus(Strophe.getResourceFromJid(jid), info.status);
}

function onPeerVideoTypeChanged(resourceJid, newVideoType) {
    VideoLayout.onVideoTypeChanged(resourceJid, newVideoType);
}

function onMucRoleChanged(role, displayName) {
    VideoLayout.showModeratorIndicator();

    if (role === 'moderator') {
        var messageKey, messageOptions = {};
        if (!displayName) {
            messageKey = "notify.grantedToUnknown";
        }
        else {
            messageKey = "notify.grantedTo";
            messageOptions = {to: displayName};
        }
        messageHandler.notify(
            displayName,'notify.somebody',
            'connected', messageKey,
            messageOptions);
    }
}

UI.notifyAuthRequired = function (intervalCallback) {
    Authentication.openAuthenticationDialog(
        APP.conference.roomName, intervalCallback, function () {
            Toolbar.authenticateClicked();
        }
    );
};


UI.toggleSmileys = function () {
    Chat.toggleSmileys();
};

UI.getSettings = function () {
    return Settings.getSettings();
};

UI.toggleFilmStrip = function () {
    return BottomToolbar.toggleFilmStrip();
};

UI.toggleChat = function () {
    return BottomToolbar.toggleChat();
};

UI.toggleContactList = function () {
    return BottomToolbar.toggleContactList();
};

UI.inputDisplayNameHandler = function (value) {
    VideoLayout.inputDisplayNameHandler(value);
};

/**
 * Return the type of the remote video.
 * @param jid the jid for the remote video
 * @returns the video type video or screen.
 */
UI.getRemoteVideoType = function (jid) {
    return VideoLayout.getRemoteVideoType(jid);
};

UI.connectionIndicatorShowMore = function(jid) {
    return VideoLayout.showMore(jid);
};

UI.showLoginPopup = function(callback) {
    console.log('password is required');
    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString(
        "dialog.passwordRequired");
    message += '</h2>' +
        '<input name="username" type="text" ' +
        'placeholder="user@domain.net" autofocus>' +
        '<input name="password" ' +
        'type="password" data-i18n="[placeholder]dialog.userPassword"' +
        ' placeholder="user password">';
    UI.messageHandler.openTwoButtonDialog(null, null, null, message,
        true,
        "dialog.Ok",
        function (e, v, m, f) {
            if (v) {
                if (f.username && f.password) {
                    callback(f.username, f.password);
                }
            }
        },
        null, null, ':input:first'

    );
};

UI.closeAuthenticationDialog = function () {
    Authentication.closeAuthenticationDialog();
    Authentication.stopInterval();
};

UI.askForNickname = function () {
    return window.prompt('Your nickname (optional)');
};

/**
 * Sets muted audio state for the local participant.
 */
UI.setAudioMuted = function (mute) {
    VideoLayout.showLocalAudioIndicator(mute);
    UIUtil.buttonClick("#toolbar_button_mute", "icon-microphone icon-mic-disabled");
};

UI.setVideoMuted = function (muted) {
    $('#toolbar_button_camera').toggleClass("icon-camera-disabled", muted);
};

UI.addListener = function (type, listener) {
    eventEmitter.on(type, listener);
};

UI.clickOnVideo = function (videoNumber) {
    var remoteVideos = $(".videocontainer:not(#mixedstream)");
    if (remoteVideos.length > videoNumber) {
        remoteVideos[videoNumber].click();
    }
};

//Used by torture
UI.showToolbar = function () {
    return ToolbarToggler.showToolbar();
};

//Used by torture
UI.dockToolbar = function (isDock) {
    return ToolbarToggler.dockToolbar(isDock);
};

UI.setUserAvatar = function (id, email) {
    // update avatar
    Avatar.setUserAvatar(id, email);

    var thumbUrl = Avatar.getThumbUrl(id);
    var contactListUrl = Avatar.getContactListUrl(id);

    VideoLayout.changeUserAvatar(id, thumbUrl);
    ContactList.changeUserAvatar(id, contactListUrl);
    if (APP.conference.isLocalId(id)) {
        SettingsMenu.changeAvatar(thumbUrl);
    }
};

UI.notifyConnectionFailed = function (stropheErrorMsg) {
    var title = APP.translation.generateTranslationHTML(
        "dialog.error");

    var message;
    if (stropheErrorMsg) {
        message = APP.translation.generateTranslationHTML(
            "dialog.connectErrorWithMsg", {msg: stropheErrorMsg});
    } else {
        message = APP.translation.generateTranslationHTML(
            "dialog.connectError");
    }

    messageHandler.openDialog(
        title, message, true, {}, function (e, v, m, f) { return false; }
    );
};

UI.notifyFirefoxExtensionRequired = function (url) {
    messageHandler.openMessageDialog(
        "dialog.extensionRequired",
        null,
        null,
        APP.translation.generateTranslationHTML(
            "dialog.firefoxExtensionPrompt", {url: url}
        )
    );
};

UI.notifyInitiallyMuted = function () {
    messageHandler.notify(
        null, "notify.mutedTitle", "connected", "notify.muted", null, {timeOut: 120000}
    );
};

UI.markDominantSpiker = function (id) {
    VideoLayout.onDominantSpeakerChanged(id);
};

UI.handleLastNEndpoints = function (ids) {
    VideoLayout.onLastNEndpointsChanged(ids, []);
};

UI.setAudioLevel = function (id, lvl) {
    AudioLevels.updateAudioLevel(
        id, lvl, VideoLayout.getLargeVideoResource()
    );
};

UI.updateDesktopSharingButtons = function () {
    Toolbar.changeDesktopSharingButtonState();
};

UI.hideStats = function () {
    VideoLayout.hideStats();
};

UI.updateLocalStats = function (percent, stats) {
    VideoLayout.updateLocalConnectionStats(percent, stats);
};

UI.updateRemoteStats = function (jid, percent, stats) {
    VideoLayout.updateConnectionStats(jid, percent, stats);
};

UI.showAuthenticateButton = function (show) {
    Toolbar.showAuthenticateButton(show);
};

UI.markVideoInterrupted = function (interrupted) {
    if (interrupted) {
        VideoLayout.onVideoInterrupted();
    } else {
        VideoLayout.onVideoRestored();
    }
};

UI.addMessage = function (from, displayName, message, stamp) {
    Chat.updateChatConversation(from, displayName, message, stamp);
};

module.exports = UI;
