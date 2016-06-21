/* global APP, JitsiMeetJS, $, config, interfaceConfig, toastr */
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
import EtherpadManager from './etherpad/Etherpad';
import SharedVideoManager from './shared_video/SharedVideo';
import Recording from "./recording/Recording";
import GumPermissionsOverlay from './gum_overlay/UserMediaPermissionsGuidanceOverlay';

import VideoLayout from "./videolayout/VideoLayout";
import FilmStrip from "./videolayout/FilmStrip";
import SettingsMenu from "./side_pannels/settings/SettingsMenu";
import Settings from "./../settings/Settings";
import { reload } from '../util/helpers';
import RingOverlay from "./ring_overlay/RingOverlay";

var EventEmitter = require("events");
UI.messageHandler = require("./util/MessageHandler");
var messageHandler = UI.messageHandler;
var JitsiPopover = require("./util/JitsiPopover");
var Feedback = require("./Feedback");

import FollowMe from "../FollowMe";

var eventEmitter = new EventEmitter();
UI.eventEmitter = eventEmitter;

let etherpadManager;
let sharedVideoManager;

let followMeHandler;

const TrackErrors = JitsiMeetJS.errors.track;

const JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP = {
    microphone: {},
    camera: {}
};

JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[TrackErrors.UNSUPPORTED_RESOLUTION]
    = "dialog.cameraUnsupportedResolutionError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[TrackErrors.GENERAL]
    = "dialog.cameraUnknownError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[TrackErrors.PERMISSION_DENIED]
    = "dialog.cameraPermissionDeniedError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[TrackErrors.NOT_FOUND]
    = "dialog.cameraNotFoundError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[TrackErrors.CONSTRAINT_FAILED]
    = "dialog.cameraConstraintFailedError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.GENERAL]
    = "dialog.micUnknownError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.PERMISSION_DENIED]
    = "dialog.micPermissionDeniedError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.NOT_FOUND]
    = "dialog.micNotFoundError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.CONSTRAINT_FAILED]
    = "dialog.micConstraintFailedError";

/**
 * Prompt user for nickname.
 */
function promptDisplayName() {
    let nickRequiredMsg
        = APP.translation.translateString("dialog.displayNameRequired");
    let defaultNickMsg = APP.translation.translateString("defaultNickname");
    let message = `
        <h2 data-i18n="dialog.displayNameRequired">${nickRequiredMsg}</h2>
        <input name="displayName" type="text"
               data-i18n="[placeholder]defaultNickname"
               placeholder="${defaultNickMsg}" autofocus>`;

    // Don't use a translation string, because we're too early in the call and
    // the translation may not be initialised.
    let buttons = {Ok:true};

    let dialog = messageHandler.openDialog(
        null,
        message,
        true,
        buttons,
        function (e, v, m, f) {
            e.preventDefault();
            if (v) {
                let displayName = f.displayName;
                if (displayName) {
                    UI.inputDisplayNameHandler(displayName);
                    dialog.close();
                    return;
                }
            }
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

/**
 * Initialize chat.
 */
function setupChat() {
    Chat.init(eventEmitter);
    $("#toggle_smileys").click(function() {
        Chat.toggleSmileys();
    });
}

/**
 * Initialize toolbars.
 */
function setupToolbars() {
    Toolbar.init(eventEmitter);
    BottomToolbar.setupListeners(eventEmitter);
}

/**
 * Toggles the application in and out of full screen mode
 * (a.k.a. presentation mode in Chrome).
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fullscreen_API
 */
function toggleFullScreen () {
                            // alternative standard method
    let isNotFullScreen = !document.fullscreenElement &&
            !document.mozFullScreenElement && // current working methods
        !document.webkitFullscreenElement &&
        !document.msFullscreenElement;

    if (isNotFullScreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement
                .webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    }
}

/**
 * Notify user that server has shut down.
 */
UI.notifyGracefulShutdown = function () {
    messageHandler.openMessageDialog(
        'dialog.serviceUnavailable',
        'dialog.gracefulShutdown'
    );
};

/**
 * Notify user that reservation error happened.
 */
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

/**
 * Notify user that he has been kicked from the server.
 */
UI.notifyKicked = function () {
    messageHandler.openMessageDialog("dialog.sessTerminated", "dialog.kickMessage");
};

/**
 * Notify user that conference was destroyed.
 * @param reason {string} the reason text
 */
UI.notifyConferenceDestroyed = function (reason) {
    //FIXME: use Session Terminated from translation, but
    // 'reason' text comes from XMPP packet and is not translated
    var title = APP.translation.generateTranslationHTML("dialog.sessTerminated");
    messageHandler.openDialog(
        title, reason, true, {},
        function (event, value, message, formVals) {
            return false;
        }
    );
};

/**
 * Notify user that Jitsi Videobridge is not accessible.
 */
 UI.notifyBridgeDown = function () {
    messageHandler.showError("dialog.error", "dialog.bridgeUnavailable");
};

/**
 * Show chat error.
 * @param err the Error
 * @param msg
 */
UI.showChatError = function (err, msg) {
    if (interfaceConfig.filmStripOnly) {
        return;
    }
    Chat.chatAddError(err, msg);
};

/**
 * Change nickname for the user.
 * @param {string} id user id
 * @param {string} displayName new nickname
 */
UI.changeDisplayName = function (id, displayName) {
    ContactList.onDisplayNameChange(id, displayName);
    VideoLayout.onDisplayNameChanged(id, displayName);

    if (APP.conference.isLocalId(id) || id === 'localVideoContainer') {
        SettingsMenu.changeDisplayName(displayName);
        Chat.setChatConversationMode(!!displayName);
    }
};

/**
 * Intitialize conference UI.
 */
UI.initConference = function () {
    let id = APP.conference.localId;
    Toolbar.updateRoomUrl(window.location.href);

    // Add myself to the contact list.
    ContactList.addContact(id);

    //update default button states before showing the toolbar
    //if local role changes buttons state will be again updated
    UI.updateLocalRole(false);

    // Once we've joined the muc show the toolbar
    ToolbarToggler.showToolbar();

    let displayName = config.displayJids ? id : Settings.getDisplayName();

    if (displayName) {
        UI.changeDisplayName('localVideoContainer', displayName);
    }

    // Make sure we configure our avatar id, before creating avatar for us
    UI.setUserEmail(id, Settings.getEmail());

    Toolbar.checkAutoEnableDesktopSharing();

    if(!interfaceConfig.filmStripOnly) {
        Feedback.init(eventEmitter);
    }

    // FollowMe attempts to copy certain aspects of the moderator's UI into the
    // other participants' UI. Consequently, it needs (1) read and write access
    // to the UI (depending on the moderator role of the local participant) and
    // (2) APP.conference as means of communication between the participants.
    followMeHandler = new FollowMe(APP.conference, UI);
};

UI.mucJoined = function () {
    VideoLayout.mucJoined();
};

/**
 * Setup some UI event listeners.
 */
function registerListeners() {

    UI.addListener(UIEvents.ETHERPAD_CLICKED, function () {
        if (etherpadManager) {
            etherpadManager.toggleEtherpad();
        }
    });

    UI.addListener(UIEvents.SHARED_VIDEO_CLICKED, function () {
        if (sharedVideoManager) {
            sharedVideoManager.toggleSharedVideo();
        }
    });

    UI.addListener(UIEvents.FULLSCREEN_TOGGLE, toggleFullScreen);

    UI.addListener(UIEvents.TOGGLE_CHAT, UI.toggleChat);

    UI.addListener(UIEvents.TOGGLE_SETTINGS, function () {
        PanelToggler.toggleSettingsMenu();
    });

    UI.addListener(UIEvents.TOGGLE_CONTACT_LIST, UI.toggleContactList);

    UI.addListener(UIEvents.TOGGLE_FILM_STRIP, function () {
        UI.toggleFilmStrip();
        VideoLayout.resizeVideoArea(PanelToggler.isVisible(), true, false);
    });

    UI.addListener(UIEvents.FOLLOW_ME_ENABLED, function (isEnabled) {
        if (followMeHandler)
            followMeHandler.enableFollowMe(isEnabled);
    });
}

/**
 * Setup some DOM event listeners.
 */
function bindEvents() {
    function onResize() {
        PanelToggler.resizeChat();
        VideoLayout.resizeVideoArea(PanelToggler.isVisible());
    }

    // Resize and reposition videos in full screen mode.
    $(document).on(
        'webkitfullscreenchange mozfullscreenchange fullscreenchange',
        onResize
    );

    $(window).resize(onResize);
}

/**
 * Returns the shared document manager object.
 * @return {EtherpadManager} the shared document manager object
 */
UI.getSharedVideoManager = function () {
    return sharedVideoManager;
};

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
       Settings.isWelcomePageEnabled()) {
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

    ToolbarToggler.init();
    BottomToolbar.init();
    FilmStrip.init(eventEmitter);

    VideoLayout.init(eventEmitter);
    if (!interfaceConfig.filmStripOnly) {
        VideoLayout.initLargeVideo(PanelToggler.isVisible());
    }
    VideoLayout.resizeVideoArea(PanelToggler.isVisible(), true, true);

    ContactList.init(eventEmitter);

    bindEvents();
    sharedVideoManager = new SharedVideoManager(eventEmitter);
    if (!interfaceConfig.filmStripOnly) {
        $("#videospace").mousemove(function () {
            return ToolbarToggler.showToolbar();
        });
        setupToolbars();
        setupChat();

        // Initialise the recording module.
        if (config.enableRecording)
            Recording.init(eventEmitter, config.recordingType);

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
        $("#downloadlog").css("display", "none");
        BottomToolbar.hide();
        FilmStrip.setupFilmStripOnly();
        messageHandler.enableNotifications(false);
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

    if(APP.tokenData.callee) {
        UI.showRingOverLay();
    }

    // Return true to indicate that the UI has been fully started and
    // conference ready.
    return true;
};


/**
 * Show local stream on UI.
 * @param {JitsiTrack} track stream to show
 */
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


/**
 * Show remote stream on UI.
 * @param {JitsiTrack} track stream to show
 */
UI.addRemoteStream = function (track) {
    VideoLayout.onRemoteStreamAdded(track);
};

/**
 * Removed remote stream from UI.
 * @param {JitsiTrack} track stream to remove
 */
UI.removeRemoteStream = function (track) {
    VideoLayout.onRemoteStreamRemoved(track);
};

function chatAddError(errorMessage, originalText) {
    return Chat.chatAddError(errorMessage, originalText);
}

/**
 * Update chat subject.
 * @param {string} subject new chat subject
 */
UI.setSubject = function (subject) {
    Chat.setSubject(subject);
};

/**
 * Setup and show Etherpad.
 * @param {string} name etherpad id
 */
UI.initEtherpad = function (name) {
    if (etherpadManager || !config.etherpad_base || !name) {
        return;
    }
    console.log('Etherpad is enabled');
    etherpadManager
        = new EtherpadManager(config.etherpad_base, name, eventEmitter);
    Toolbar.showEtherpadButton();
};

/**
 * Returns the shared document manager object.
 * @return {EtherpadManager} the shared document manager object
 */
UI.getSharedDocumentManager = function () {
    return etherpadManager;
};

/**
 * Show user on UI.
 * @param {string} id user id
 * @param {string} displayName user nickname
 */
UI.addUser = function (id, displayName) {
    UI.hideRingOverLay();
    ContactList.addContact(id);

    messageHandler.notify(
        displayName,'notify.somebody', 'connected', 'notify.connected'
    );

    if (!config.startAudioMuted ||
        config.startAudioMuted > APP.conference.membersCount)
        UIUtil.playSoundNotification('userJoined');

    // Add Peer's container
    VideoLayout.addParticipantContainer(id);

    // Configure avatar
    UI.setUserEmail(id);

    // set initial display name
    if(displayName)
        UI.changeDisplayName(id, displayName);
};

/**
 * Remove user from UI.
 * @param {string} id   user id
 * @param {string} displayName user nickname
 */
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

UI.updateUserStatus = function (id, status) {
    VideoLayout.setPresenceStatus(id, status);
};

/**
 * Update videotype for specified user.
 * @param {string} id user id
 * @param {string} newVideoType new videotype
 */
UI.onPeerVideoTypeChanged = (id, newVideoType) => {
    VideoLayout.onVideoTypeChanged(id, newVideoType);
};

/**
 * Update local user role and show notification if user is moderator.
 * @param {boolean} isModerator if local user is moderator or not
 */
UI.updateLocalRole = function (isModerator) {
    VideoLayout.showModeratorIndicator();

    Toolbar.showSipCallButton(isModerator);
    Toolbar.showSharedVideoButton(isModerator);
    Recording.showRecordingButton(isModerator);
    SettingsMenu.showStartMutedOptions(isModerator);
    SettingsMenu.showFollowMeOptions(isModerator);

    if (isModerator) {
        messageHandler.notify(null, "notify.me", 'connected', "notify.moderator");

        Recording.checkAutoRecord();
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
                to: UIUtil.escapeHtml(displayName)
            }
        );
    } else {
        messageHandler.notify(
            '', 'notify.somebody',
            'connected', 'notify.grantedToUnknown', {}
        );
    }
};


/**
 * Toggles smileys in the chat.
 */
UI.toggleSmileys = function () {
    Chat.toggleSmileys();
};

/**
 * Toggles film strip.
 */
UI.toggleFilmStrip = function () {
    var self = FilmStrip;
    self.toggleFilmStrip.apply(self, arguments);
};

/**
 * Indicates if the film strip is currently visible or not.
 * @returns {true} if the film strip is currently visible, otherwise
 */
UI.isFilmStripVisible = function () {
    return FilmStrip.isFilmStripVisible();
};

/**
 * Toggles chat panel.
 */
UI.toggleChat = function () {
    PanelToggler.toggleChat();
};

/**
 * Toggles contact list panel.
 */
UI.toggleContactList = function () {
    PanelToggler.toggleContactList();
};

/**
 * Handle new user display name.
 */
UI.inputDisplayNameHandler = function (newDisplayName) {
    eventEmitter.emit(UIEvents.NICKNAME_CHANGED, newDisplayName);
};

/**
 * Return the type of the remote video.
 * @param jid the jid for the remote video
 * @returns the video type video or screen.
 */
UI.getRemoteVideoType = function (jid) {
    return VideoLayout.getRemoteVideoType(jid);
};

UI.connectionIndicatorShowMore = function(id) {
    VideoLayout.showMore(id);
};

// FIXME check if someone user this
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
    messageHandler.openTwoButtonDialog(null, null, null, message,
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
    if (APP.conference.isLocalId(id)) {
        Toolbar.markAudioIconAsMuted(muted);
    }
};

/**
 * Sets muted video state for participant
 */
UI.setVideoMuted = function (id, muted) {
    VideoLayout.onVideoMute(id, muted);
    if (APP.conference.isLocalId(id)) {
        Toolbar.markVideoIconAsMuted(muted);
    }
};

/**
 * Adds a listener that would be notified on the given type of event.
 *
 * @param type the type of the event we're listening for
 * @param listener a function that would be called when notified
 */
UI.addListener = function (type, listener) {
    eventEmitter.on(type, listener);
};

/**
 * Removes the given listener for the given type of event.
 *
 * @param type the type of the event we're listening for
 * @param listener the listener we want to remove
 */
UI.removeListener = function (type, listener) {
    eventEmitter.removeListener(type, listener);
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

/**
 * Updates the avatar for participant.
 * @param {string} id user id
 * @param {stirng} avatarUrl the URL for the avatar
 */
function changeAvatar(id, avatarUrl) {
    VideoLayout.changeUserAvatar(id, avatarUrl);
    ContactList.changeUserAvatar(id, avatarUrl);
    if (APP.conference.isLocalId(id)) {
        SettingsMenu.changeAvatar(avatarUrl);
    }
}

/**
 * Update user email.
 * @param {string} id user id
 * @param {stirng} email user email
 */
UI.setUserEmail = function (id, email) {
    // update avatar
    Avatar.setUserEmail(id, email);

    changeAvatar(id, Avatar.getAvatarUrl(id));
};


/**
 * Update user avatar URL.
 * @param {string} id user id
 * @param {stirng} url user avatar url
 */
UI.setUserAvatarUrl = function (id, url) {
    // update avatar
    Avatar.setUserAvatarUrl(id, url);

    changeAvatar(id, Avatar.getAvatarUrl(id));
};

/**
 * Notify user that connection failed.
 * @param {string} stropheErrorMsg raw Strophe error message
 */
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


/**
 * Notify user that maximum users limit has been reached.
 */
UI.notifyMaxUsersLimitReached = function () {
    var title = APP.translation.generateTranslationHTML(
        "dialog.error");

    var message = APP.translation.generateTranslationHTML(
            "dialog.maxUsersLimitReached");

    messageHandler.openDialog(
        title, message, true, {}, function (e, v, m, f) { return false; }
    );
};

/**
 * Notify user that he was automatically muted when joned the conference.
 */
UI.notifyInitiallyMuted = function () {
    messageHandler.notify(
        null, "notify.mutedTitle", "connected", "notify.muted", null, {timeOut: 120000}
    );
};

/**
 * Mark user as dominant speaker.
 * @param {string} id user id
 */
UI.markDominantSpeaker = function (id) {
    VideoLayout.onDominantSpeakerChanged(id);
};

UI.handleLastNEndpoints = function (ids, enteringIds) {
    VideoLayout.onLastNEndpointsChanged(ids, enteringIds);
};

/**
 * Update audio level visualization for specified user.
 * @param {string} id user id
 * @param {number} lvl audio level
 */
UI.setAudioLevel = function (id, lvl) {
    VideoLayout.setAudioLevel(id, lvl);
};

/**
 * Update state of desktop sharing buttons.
 */
UI.updateDesktopSharingButtons = function () {
    Toolbar.updateDesktopSharingButtonState();
};

/**
 * Hide connection quality statistics from UI.
 */
UI.hideStats = function () {
    VideoLayout.hideStats();
};

/**
 * Update local connection quality statistics.
 * @param {number} percent
 * @param {object} stats
 */
UI.updateLocalStats = function (percent, stats) {
    VideoLayout.updateLocalConnectionStats(percent, stats);
};

/**
 * Update connection quality statistics for remote user.
 * @param {string} id user id
 * @param {number} percent
 * @param {object} stats
 */
UI.updateRemoteStats = function (id, percent, stats) {
    VideoLayout.updateConnectionStats(id, percent, stats);
};

/**
 * Mark video as interrupted or not.
 * @param {boolean} interrupted if video is interrupted
 */
UI.markVideoInterrupted = function (interrupted) {
    if (interrupted) {
        VideoLayout.onVideoInterrupted();
    } else {
        VideoLayout.onVideoRestored();
    }
};

/**
 * Mark room as locked or not.
 * @param {boolean} locked if room is locked.
 */
UI.markRoomLocked = function (locked) {
    if (locked) {
        Toolbar.lockLockButton();
    } else {
        Toolbar.unlockLockButton();
    }
};

/**
 * Add chat message.
 * @param {string} from user id
 * @param {string} displayName user nickname
 * @param {string} message message text
 * @param {number} stamp timestamp when message was created
 */
UI.addMessage = function (from, displayName, message, stamp) {
    Chat.updateChatConversation(from, displayName, message, stamp);
};

UI.updateDTMFSupport = function (isDTMFSupported) {
    //TODO: enable when the UI is ready
    //Toolbar.showDialPadButton(dtmfSupport);
};

/**
 * Invite participants to conference.
 * @param {string} roomUrl
 * @param {string} conferenceName
 * @param {string} key
 * @param {string} nick
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
        body += "%0D%0A%0D%0A" + UIUtil.escapeHtml(nick);
    }

    if (interfaceConfig.INVITATION_POWERED_BY) {
        body += "%0D%0A%0D%0A--%0D%0Apowered by jitsi.org";
    }

    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
};

/**
 * Show user feedback dialog if its required or just show "thank you" dialog.
 * @returns {Promise} when dialog is closed.
 */
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

UI.updateRecordingState = function (state) {
    Recording.updateRecordingState(state);
};

UI.notifyTokenAuthFailed = function () {
    messageHandler.showError("dialog.error", "dialog.tokenAuthFailed");
};

UI.notifyInternalError = function () {
    messageHandler.showError("dialog.sorry", "dialog.internalError");
};

UI.notifyFocusDisconnected = function (focus, retrySec) {
    messageHandler.notify(
        null, "notify.focus",
        'disconnected', "notify.focusFail",
        {component: focus, ms: retrySec}
    );
};

/**
 * Notify user that focus left the conference so page should be reloaded.
 */
UI.notifyFocusLeft = function () {
    let title = APP.translation.generateTranslationHTML(
        'dialog.serviceUnavailable'
    );
    let msg = APP.translation.generateTranslationHTML(
        'dialog.jicofoUnavailable'
    );
    messageHandler.openDialog(
        title,
        msg,
        true, // persistent
        [{title: 'retry'}],
        function () {
            reload();
            return false;
        }
    );
};

/**
 * Updates auth info on the UI.
 * @param {boolean} isAuthEnabled if authentication is enabled
 * @param {string} [login] current login
 */
UI.updateAuthInfo = function (isAuthEnabled, login) {
    let loggedIn = !!login;

    Toolbar.showAuthenticateButton(isAuthEnabled);

    if (isAuthEnabled) {
        Toolbar.setAuthenticatedIdentity(login);

        Toolbar.showLoginButton(!loggedIn);
        Toolbar.showLogoutButton(loggedIn);
    }
};

UI.onStartMutedChanged = function (startAudioMuted, startVideoMuted) {
    SettingsMenu.updateStartMutedBox(startAudioMuted, startVideoMuted);
};

/**
 * Update list of available physical devices.
 * @param {object[]} devices new list of available devices
 */
UI.onAvailableDevicesChanged = function (devices) {
    SettingsMenu.changeDevicesList(devices);
};

/**
 * Sets microphone's <select> element to select microphone ID from settings.
 */
UI.setSelectedMicFromSettings = function () {
    SettingsMenu.setSelectedMicFromSettings();
};

/**
 * Sets camera's <select> element to select camera ID from settings.
 */
UI.setSelectedCameraFromSettings = function () {
    SettingsMenu.setSelectedCameraFromSettings();
};

/**
 * Sets audio outputs's <select> element to select audio output ID from
 * settings.
 */
UI.setSelectedAudioOutputFromSettings = function () {
    SettingsMenu.setSelectedAudioOutputFromSettings();
};

/**
 * Returns the id of the current video shown on large.
 * Currently used by tests (torture).
 */
UI.getLargeVideoID = function () {
    return VideoLayout.getLargeVideoID();
};

/**
 * Returns the current video shown on large.
 * Currently used by tests (torture).
 */
UI.getLargeVideo = function () {
    return VideoLayout.getLargeVideo();
};

/**
 * Shows dialog with a link to FF extension.
 */
UI.showExtensionRequiredDialog = function (url) {
    messageHandler.openMessageDialog(
        "dialog.extensionRequired",
        null,
        null,
        APP.translation.generateTranslationHTML(
            "dialog.firefoxExtensionPrompt", {url: url}));
};

/**
 * Shows dialog with combined information about camera and microphone errors.
 * @param {JitsiTrackError} micError
 * @param {JitsiTrackError} cameraError
 */
UI.showDeviceErrorDialog = function (micError, cameraError) {
    let localStoragePropName = "doNotShowErrorAgain";
    let isMicJitsiTrackErrorAndHasName = micError && micError.name &&
        micError instanceof JitsiMeetJS.JitsiTrackError;
    let isCameraJitsiTrackErrorAndHasName = cameraError && cameraError.name &&
        cameraError instanceof JitsiMeetJS.JitsiTrackError;
    let showDoNotShowWarning = false;

    if (micError && cameraError && isMicJitsiTrackErrorAndHasName &&
        isCameraJitsiTrackErrorAndHasName) {
        showDoNotShowWarning =  true;
    } else if (micError && isMicJitsiTrackErrorAndHasName && !cameraError) {
        showDoNotShowWarning =  true;
    } else if (cameraError && isCameraJitsiTrackErrorAndHasName && !micError) {
        showDoNotShowWarning =  true;
    }

    if (micError) {
        localStoragePropName += "-mic-" + micError.name;
    }

    if (cameraError) {
        localStoragePropName += "-camera-" + cameraError.name;
    }

    if (showDoNotShowWarning) {
        if (window.localStorage[localStoragePropName] === "true") {
            return;
        }
    }

    let title = getTitleKey();
    let titleMsg = `<span data-i18n="${title}"></span>`;
    let cameraJitsiTrackErrorMsg = cameraError
        ? JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[cameraError.name]
        : undefined;
    let micJitsiTrackErrorMsg = micError
        ? JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[micError.name]
        : undefined;
    let cameraErrorMsg = cameraError
        ? cameraJitsiTrackErrorMsg ||
            JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[TrackErrors.GENERAL]
        : "";
    let micErrorMsg = micError
        ? micJitsiTrackErrorMsg ||
            JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.GENERAL]
        : "";
    let additionalCameraErrorMsg = !cameraJitsiTrackErrorMsg && cameraError &&
        cameraError.message
            ? `<div>${cameraError.message}</div>`
            : ``;
    let additionalMicErrorMsg = !micJitsiTrackErrorMsg && micError &&
        micError.message
            ? `<div>${micError.message}</div>`
            : ``;
    let doNotShowWarningAgainSection = showDoNotShowWarning
        ? `<label>
            <input type='checkbox' id='doNotShowWarningAgain'>
            <span data-i18n='dialog.doNotShowWarningAgain'></span>
           </label>`
        : ``;
    let message = '';

    if (micError) {
        message = `
            ${message}
            <h3 data-i18n='dialog.micErrorPresent'></h3>
            <h4 data-i18n='${micErrorMsg}'></h4>
            ${additionalMicErrorMsg}`;
    }

    if (cameraError) {
        message = `
            ${message}
            <h3 data-i18n='dialog.cameraErrorPresent'></h3>
            <h4 data-i18n='${cameraErrorMsg}'></h4>
            ${additionalCameraErrorMsg}`;
    }

    message = `${message}${doNotShowWarningAgainSection}`;

    messageHandler.openDialog(
        titleMsg,
        message,
        false,
        {Ok: true},
        function () {
            let form  = $.prompt.getPrompt();

            if (form) {
                let input = form.find("#doNotShowWarningAgain");

                if (input.length) {
                    window.localStorage[localStoragePropName] =
                        input.prop("checked");
                }
            }
        }
    );

    APP.translation.translateElement($(".jqibox"));

    function getTitleKey() {
        let title = "dialog.error";

        if (micError && micError.name === TrackErrors.PERMISSION_DENIED) {
            if (cameraError && cameraError.name === TrackErrors.PERMISSION_DENIED) {
                title = "dialog.permissionDenied";
            } else if (!cameraError) {
                title = "dialog.permissionDenied";
            }
        } else if (cameraError &&
            cameraError.name === TrackErrors.PERMISSION_DENIED) {
            title = "dialog.permissionDenied";
        }

        return title;
    }
};

UI.updateDevicesAvailability = function (id, devices) {
    VideoLayout.setDeviceAvailabilityIcons(id, devices);
};

/**
 * Show shared video.
 * @param {string} id the id of the sender of the command
 * @param {string} url video url
 * @param {string} attributes
*/
UI.onSharedVideoStart = function (id, url, attributes) {
    if (sharedVideoManager)
        sharedVideoManager.onSharedVideoStart(id, url, attributes);
};

/**
 * Update shared video.
 * @param {string} id the id of the sender of the command
 * @param {string} url video url
 * @param {string} attributes
 */
UI.onSharedVideoUpdate = function (id, url, attributes) {
    if (sharedVideoManager)
        sharedVideoManager.onSharedVideoUpdate(id, url, attributes);
};

/**
 * Stop showing shared video.
 * @param {string} id the id of the sender of the command
 * @param {string} attributes
 */
UI.onSharedVideoStop = function (id, attributes) {
    if (sharedVideoManager)
        sharedVideoManager.onSharedVideoStop(id, attributes);
};

/**
 * Disables camera toolbar button.
 */
UI.disableCameraButton = function () {
    Toolbar.markVideoIconAsDisabled(true);
};

/**
 * Enables camera toolbar button.
 */
UI.enableCameraButton = function () {
    Toolbar.markVideoIconAsDisabled(false);
};

/**
 * Disables microphone toolbar button.
 */
UI.disableMicrophoneButton = function () {
    Toolbar.markAudioIconAsDisabled(true);
};

/**
 * Enables microphone toolbar button.
 */
UI.enableMicrophoneButton = function () {
    Toolbar.markAudioIconAsDisabled(false);
};

let bottomToolbarEnabled = null;

UI.showRingOverLay = function () {
    RingOverlay.show(APP.tokenData.callee);
    ToolbarToggler.setAlwaysVisibleToolbar(true);
    FilmStrip.toggleFilmStrip(false);
};

UI.hideRingOverLay = function () {
    if (!RingOverlay.hide())
        return;
    ToolbarToggler.resetAlwaysVisibleToolbar();
    FilmStrip.toggleFilmStrip(true);
};

/**
 * Shows browser-specific overlay with guidance how to proceed with gUM prompt.
 */
UI.showUserMediaPermissionsGuidanceOverlay = function () {
    GumPermissionsOverlay.show();
};

/**
 * Hides browser-specific overlay with guidance how to proceed with gUM prompt.
 */
UI.hideUserMediaPermissionsGuidanceOverlay = function () {
    GumPermissionsOverlay.hide();
};

/**
 * Shows or hides the keyboard shortcuts panel.'
 */
UI.toggleKeyboardShortcutsPanel = function() {
    $('#keyboard-shortcuts').toggle();
};

module.exports = UI;
