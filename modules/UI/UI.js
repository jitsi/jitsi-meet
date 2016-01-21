/* global APP, $, config, interfaceConfig, toastr */
/* jshint -W101 */
var UI = {};

import Chat from "./side_pannels/chat/Chat";
import Toolbar from "./toolbars/Toolbar";
import ToolbarToggler from "./toolbars/ToolbarToggler";
import BottomToolbar from "./toolbars/BottomToolbar";
import ContactList from "./side_pannels/contactlist/ContactList";
import Avatar from "./avatar/Avatar";
import PanelToggler from "./side_pannels/SidePanelToggler";
import UIUtil from "./util/UIUtil";
import UIEvents from "../../service/UI/UIEvents";
import CQEvents from '../../service/connectionquality/CQEvents';
import PreziManager from './prezi/Prezi';
import EtherpadManager from './etherpad/Etherpad';

import VideoLayout from "./videolayout/VideoLayout";
import SettingsMenu from "./side_pannels/settings/SettingsMenu";
import Settings from "./../settings/Settings";

var EventEmitter = require("events");
UI.messageHandler = require("./util/MessageHandler");
var messageHandler = UI.messageHandler;
var JitsiPopover = require("./util/JitsiPopover");
var Feedback = require("./Feedback");

var eventEmitter = new EventEmitter();
UI.eventEmitter = eventEmitter;

let preziManager;
let etherpadManager;

function promptDisplayName() {
    let nickRequiredMsg = APP.translation.translateString("dialog.displayNameRequired");
    let defaultNickMsg = APP.translation.translateString(
        "defaultNickname", {name: "Jane Pink"}
    );
    let message = `
        <h2 data-i18n="dialog.displayNameRequired">${nickRequiredMsg}</h2>
        <input name="displayName" type="text"
               data-i18n="[placeholder]defaultNickname"
               placeholder="${defaultNickMsg}" autofocus>`;

    let buttonTxt = APP.translation.generateTranslationHTML("dialog.Ok");
    let buttons = [{title: buttonTxt, value: "ok"}];

    messageHandler.openDialog(
        null, message,
        true,
        buttons,
        function (e, v, m, f) {
            if (v == "ok") {
                let displayName = f.displayName;
                if (displayName) {
                    UI.inputDisplayNameHandler(displayName);
                    return true;
                }
            }
            e.preventDefault();
        },
        function () {
            let form  = $.prompt.getPrompt();
            let input = form.find("input[name='displayName']");
            input.focus();
            let button = form.find("button");
            button.attr("disabled", "disabled");
            input.keyup(function () {
                if (input.val()) {
                    button.removeAttr("disabled");
                } else {
                    button.attr("disabled", "disabled");
                }
            });
        }
    );
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
    BottomToolbar.setupListeners(eventEmitter);
}

/**
 * Toggles the application in and out of full screen mode
 * (a.k.a. presentation mode in Chrome).
 */
function toggleFullScreen () {
    let fsElement = document.documentElement;

    if (!document.mozFullScreen && !document.webkitIsFullScreen) {
        //Enter Full Screen
        if (fsElement.mozRequestFullScreen) {
            fsElement.mozRequestFullScreen();
        } else {
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

    if (APP.conference.isLocalId(id)) {
        Chat.setChatConversationMode(!!displayName);
    }
};

UI.initConference = function () {
    var id = APP.conference.localId;
    Toolbar.updateRoomUrl(window.location.href);
    var meHTML = APP.translation.generateTranslationHTML("me");
    var settings = Settings.getSettings();

    $("#localNick").html(settings.email || settings.uid + " (" + meHTML + ")");

    // Add myself to the contact list.
    ContactList.addContact(id);

    // Once we've joined the muc show the toolbar
    ToolbarToggler.showToolbar();

    var displayName = config.displayJids ? id : settings.displayName;

    if (displayName) {
        UI.changeDisplayName('localVideoContainer', displayName);
    }

    // Make sure we configure our avatar id, before creating avatar for us
    UI.setUserAvatar(id, settings.email);

    Toolbar.checkAutoEnableDesktopSharing();
    if(!interfaceConfig.filmStripOnly) {
        Feedback.init();
    }
};

UI.mucJoined = function () {
    VideoLayout.mucJoined();
};

function registerListeners() {
    UI.addListener(UIEvents.EMAIL_CHANGED, function (email) {
        UI.setUserAvatar(APP.conference.localId, email);
    });

    UI.addListener(UIEvents.PREZI_CLICKED, function () {
        preziManager.handlePreziButtonClicked();
    });

    UI.addListener(UIEvents.ETHERPAD_CLICKED, function () {
        if (etherpadManager) {
            etherpadManager.toggleEtherpad();
        }
    });

    UI.addListener(UIEvents.FULLSCREEN_TOGGLE, toggleFullScreen);

    UI.addListener(UIEvents.TOGGLE_CHAT, UI.toggleChat);

    UI.addListener(UIEvents.TOGGLE_SETTINGS, function () {
        PanelToggler.toggleSettingsMenu();
    });

    UI.addListener(UIEvents.TOGGLE_CONTACT_LIST, UI.toggleContactList);

    UI.addListener(UIEvents.TOGGLE_FILM_STRIP, UI.toggleFilmStrip);
}

function bindEvents() {
    function onResize() {
        PanelToggler.resizeChat();
        VideoLayout.resizeLargeVideoContainer(PanelToggler.isVisible());
    }

    // Resize and reposition videos in full screen mode.
    $(document).on(
        'webkitfullscreenchange mozfullscreenchange fullscreenchange',
        onResize
    );

    $(window).resize(onResize);
}

/**
 * Starts the UI module and initializes all related components.
 *
 * @returns {boolean} true if the UI is ready and the conference should be
 * esablished, false - otherwise (for example in the case of welcome page)
 */
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

        // Return false to indicate that the UI hasn't been fully started and
        // conference ready. We're still waiting for input from the user.
        return false;
    }

    $("#welcome_page").hide();

    // Set the defaults for prompt dialogs.
    $.prompt.setDefaults({persistent: false});

    registerListeners();

    BottomToolbar.init();

    VideoLayout.init(eventEmitter);
    if (!interfaceConfig.filmStripOnly) {
        VideoLayout.initLargeVideo(PanelToggler.isVisible());
    }
    VideoLayout.resizeLargeVideoContainer(PanelToggler.isVisible());

    ContactList.init(eventEmitter);

    bindEvents();
    preziManager = new PreziManager(eventEmitter);
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
            let logs = APP.conference.getLogs();
            let data = encodeURIComponent(JSON.stringify(logs, null, '  '));

            let elem = event.target.parentNode;
            elem.download = 'meetlog.json';
            elem.href = 'data:application/json;charset=utf-8,\n' + data;
        });
    } else {
        $("#header").css("display", "none");
        $("#bottomToolbar").css("display", "none");
        $("#downloadlog").css("display", "none");
        BottomToolbar.setupFilmStripOnly();
        messageHandler.disableNotifications();
        $('body').popover("disable");
        JitsiPopover.enabled = false;
    }

    document.title = interfaceConfig.APP_NAME;

    if(config.requireDisplayName) {
        if (!APP.settings.getDisplayName()) {
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

        SettingsMenu.init(eventEmitter);
    }

    // Return true to indicate that the UI has been fully started and
    // conference ready.
    return true;
};


UI.addLocalStream = function (track) {
    switch (track.getType()) {
    case 'audio':
        VideoLayout.changeLocalAudio(track);
        break;
    case 'video':
        VideoLayout.changeLocalVideo(track);
        break;
    default:
        console.error("Unknown stream type: " + track.getType());
        break;
    }
};


UI.addRemoteStream = function (stream) {
    VideoLayout.onRemoteStreamAdded(stream);
};

function chatAddError(errorMessage, originalText) {
    return Chat.chatAddError(errorMessage, originalText);
}

UI.setSubject = function (subject) {
    Chat.setSubject(subject);
};

UI.initEtherpad = function (name) {
    if (etherpadManager || !config.etherpad_base || !name) {
        return;
    }
    console.log('Etherpad is enabled');
    etherpadManager = new EtherpadManager(config.etherpad_base, name);
    Toolbar.showEtherpadButton();
};

UI.addUser = function (id, displayName) {
    ContactList.addContact(id);

    messageHandler.notify(
        displayName,'notify.somebody', 'connected', 'notify.connected'
    );

    if (!config.startAudioMuted ||
        config.startAudioMuted > APP.conference.membersCount)
        UIUtil.playSoundNotification('userJoined');

    // Configure avatar
    UI.setUserAvatar(id);

    // Add Peer's container
    VideoLayout.addParticipantContainer(id);
};

UI.removeUser = function (id, displayName) {
    ContactList.removeContact(id);

    messageHandler.notify(
        displayName,'notify.somebody', 'disconnected', 'notify.disconnected'
    );

    if (!config.startAudioMuted
        || config.startAudioMuted > APP.conference.membersCount) {
        UIUtil.playSoundNotification('userLeft');
    }

    VideoLayout.removeParticipantContainer(id);
};

//FIXME: NOT USED. Should start using the lib
// function onMucPresenceStatus(jid, info) {
//     VideoLayout.setPresenceStatus(Strophe.getResourceFromJid(jid), info.status);
// }

UI.onPeerVideoTypeChanged = (id, newVideoType) => {
    VideoLayout.onVideoTypeChanged(id, newVideoType);
};

UI.updateLocalRole = function (isModerator) {
    VideoLayout.showModeratorIndicator();

    Toolbar.showSipCallButton(isModerator);
    Toolbar.showRecordingButton(isModerator);
    SettingsMenu.onRoleChanged();

    if (isModerator) {
        messageHandler.notify(null, "notify.me", 'connected', "notify.moderator");

        Toolbar.checkAutoRecord();
    }
};

/**
 * Check the role for the user and reflect it in the UI, moderator ui indication
 * and notifies user who is the moderator
 * @param user to check for moderator
 */
UI.updateUserRole = function (user) {
    VideoLayout.showModeratorIndicator();

    if (!user.isModerator()) {
        return;
    }

    var displayName = user.getDisplayName();
    if (displayName) {
        messageHandler.notify(
            displayName, 'notify.somebody',
            'connected', 'notify.grantedTo', {
                to: displayName
            }
        );
    } else {
        messageHandler.notify(
            '', 'notify.somebody',
            'connected', 'notify.grantedToUnknown', {}
        );
    }
};


UI.toggleSmileys = function () {
    Chat.toggleSmileys();
};

UI.getSettings = function () {
    return Settings.getSettings();
};

UI.toggleFilmStrip = function () {
    BottomToolbar.toggleFilmStrip();
};

UI.toggleChat = function () {
    PanelToggler.toggleChat();
};

UI.toggleContactList = function () {
    PanelToggler.toggleContactList();
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

UI.askForNickname = function () {
    return window.prompt('Your nickname (optional)');
};

/**
 * Sets muted audio state for participant
 */
UI.setAudioMuted = function (id, muted) {
    VideoLayout.onAudioMute(id, muted);
    if(APP.conference.isLocalId(id))
        UIUtil.buttonClick("#toolbar_button_mute",
            "icon-microphone icon-mic-disabled");
};

/**
 * Sets muted video state for participant
 */
UI.setVideoMuted = function (id, muted) {
    VideoLayout.onVideoMute(id, muted);
    if(APP.conference.isLocalId(id))
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
    ToolbarToggler.dockToolbar(isDock);
};

UI.setUserAvatar = function (id, email) {
    // update avatar
    Avatar.setUserAvatar(id, email);

    var avatarUrl = Avatar.getAvatarUrl(id);

    VideoLayout.changeUserAvatar(id, avatarUrl);
    ContactList.changeUserAvatar(id, avatarUrl);
    if (APP.conference.isLocalId(id)) {
        SettingsMenu.changeAvatar(avatarUrl);
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

UI.markDominantSpeaker = function (id) {
    VideoLayout.onDominantSpeakerChanged(id);
};

UI.handleLastNEndpoints = function (ids) {
    VideoLayout.onLastNEndpointsChanged(ids, []);
};

UI.setAudioLevel = function (id, lvl) {
    VideoLayout.setAudioLevel(id, lvl);
};

UI.updateDesktopSharingButtons = function (isSharingScreen) {
    Toolbar.changeDesktopSharingButtonState(isSharingScreen);
};

UI.hideStats = function () {
    VideoLayout.hideStats();
};

UI.updateLocalStats = function (percent, stats) {
    VideoLayout.updateLocalConnectionStats(percent, stats);
};

UI.updateRemoteStats = function (id, percent, stats) {
    VideoLayout.updateConnectionStats(id, percent, stats);
};

UI.markVideoInterrupted = function (interrupted) {
    if (interrupted) {
        VideoLayout.onVideoInterrupted();
    } else {
        VideoLayout.onVideoRestored();
    }
};

UI.markRoomLocked = function (locked) {
    if (locked) {
        Toolbar.lockLockButton();
    } else {
        Toolbar.unlockLockButton();
    }
};

UI.addMessage = function (from, displayName, message, stamp) {
    Chat.updateChatConversation(from, displayName, message, stamp);
};

UI.updateDTMFSupport = function (isDTMFSupported) {
    //TODO: enable when the UI is ready
    //Toolbar.showDialPadButton(dtmfSupport);
};

/**
 * Invite participants to conference.
 */
UI.inviteParticipants = function (roomUrl, conferenceName, key, nick) {
    let keyText = "";
    if (key) {
        keyText = APP.translation.translateString(
            "email.sharedKey", {sharedKey: key}
        );
    }

    let and = APP.translation.translateString("email.and");
    let supportedBrowsers = `Chromium, Google Chrome ${and} Opera`;

    let subject = APP.translation.translateString(
        "email.subject", {appName:interfaceConfig.APP_NAME, conferenceName}
    );

    let body = APP.translation.translateString(
        "email.body", {
            appName:interfaceConfig.APP_NAME,
            sharedKeyText: keyText,
            roomUrl,
            supportedBrowsers
        }
    );

    body = body.replace(/\n/g, "%0D%0A");

    if (nick) {
        body += "%0D%0A%0D%0A" + nick;
    }

    if (interfaceConfig.INVITATION_POWERED_BY) {
        body += "%0D%0A%0D%0A--%0D%0Apowered by jitsi.org";
    }

    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
};

UI.requestFeedback = function () {
    return new Promise(function (resolve, reject) {
        if (Feedback.isEnabled()) {
            // If the user has already entered feedback, we'll show the window and
            // immidiately start the conference dispose timeout.
            if (Feedback.feedbackScore > 0) {
                Feedback.openFeedbackWindow();
                resolve();

            } else { // Otherwise we'll wait for user's feedback.
                Feedback.openFeedbackWindow(resolve);
            }
        } else {
            // If the feedback functionality isn't enabled we show a thank you
            // dialog.
            messageHandler.openMessageDialog(
                null, null, null,
                APP.translation.translateString(
                    "dialog.thankYou", {appName:interfaceConfig.APP_NAME}
                )
            );
            resolve();
        }
    });
};

UI.requestRecordingToken = function () {
    let msg = APP.translation.generateTranslationHTML("dialog.recordingToken");
    let token = APP.translation.translateString("dialog.token");
    return new Promise(function (resolve, reject) {
        messageHandler.openTwoButtonDialog(
            null, null, null,
            `<h2>${msg}</h2>
             <input name="recordingToken" type="text"
                    data-i18n="[placeholder]dialog.token"
                    placeholder="${token}" autofocus>`,
            false, "dialog.Save",
            function (e, v, m, f) {
                if (v && f.recordingToken) {
                    resolve(UIUtil.escapeHtml(f.recordingToken));
                } else {
                    reject();
                }
            },
            null,
            function () { },
            ':input:first'
        );
    });
};

UI.updateRecordingState = function (state) {
    Toolbar.updateRecordingState(state);
};

UI.notifyTokenAuthFailed = function () {
    messageHandler.showError("dialog.error", "dialog.tokenAuthFailed");
};

UI.updateAuthInfo = function (isAuthEnabled, login) {
    let loggedIn = !!login;

    Toolbar.showAuthenticateButton(isAuthEnabled);

    if (isAuthEnabled) {
        Toolbar.setAuthenticatedIdentity(login);

        Toolbar.showLoginButton(!loggedIn);
        Toolbar.showLogoutButton(loggedIn);
    }
};

UI.showPrezi = function (userId, url, slide) {
    preziManager.showPrezi(userId, url, slide);
};

UI.stopPrezi = function (userId) {
  if (preziManager.isSharing(userId)) {
      preziManager.removePrezi(userId);
  }
};

UI.onStartMutedChanged = function () {
    SettingsMenu.onStartMutedChanged();
};

/**
 * Returns the id of the current video shown on large.
 * Currently used by tests (troture).
 */
UI.getLargeVideoID = function () {
    return VideoLayout.getLargeVideoID();
};

/**
 * Shows dialog with a link to FF extension.
 */
UI.showExtensionRequiredDialog = function (url) {
    APP.UI.messageHandler.openMessageDialog(
        "dialog.extensionRequired",
        null,
        null,
        APP.translation.generateTranslationHTML(
            "dialog.firefoxExtensionPrompt", {url: url}));
};

module.exports = UI;
