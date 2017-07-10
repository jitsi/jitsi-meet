/* global APP, JitsiMeetJS, $, config, interfaceConfig, toastr */

const logger = require("jitsi-meet-logger").getLogger(__filename);

var UI = {};

import Chat from "./side_pannels/chat/Chat";
import SidePanels from "./side_pannels/SidePanels";
import Avatar from "./avatar/Avatar";
import SideContainerToggler from "./side_pannels/SideContainerToggler";
import JitsiPopover from "./util/JitsiPopover";
import messageHandler from "./util/MessageHandler";
import UIUtil from "./util/UIUtil";
import UIEvents from "../../service/UI/UIEvents";
import EtherpadManager from './etherpad/Etherpad';
import SharedVideoManager from './shared_video/SharedVideo';
import Recording from "./recording/Recording";

import VideoLayout from "./videolayout/VideoLayout";
import Filmstrip from "./videolayout/Filmstrip";
import SettingsMenu from "./side_pannels/settings/SettingsMenu";
import Profile from "./side_pannels/profile/Profile";
import Settings from "./../settings/Settings";
import { FEEDBACK_REQUEST_IN_PROGRESS } from './UIErrors';
import { debounce } from "../util/helpers";

import { updateDeviceList } from '../../react/features/base/devices';
import { setAudioMuted, setVideoMuted } from '../../react/features/base/media';
import {
    openDeviceSelectionDialog
} from '../../react/features/device-selection';
import {
    checkAutoEnableDesktopSharing,
    dockToolbox,
    setAudioIconEnabled,
    setToolbarButton,
    setVideoIconEnabled,
    showDialPadButton,
    showEtherpadButton,
    showSharedVideoButton,
    showDialOutButton,
    showToolbox
} from '../../react/features/toolbox';

var EventEmitter = require("events");
UI.messageHandler = messageHandler;
import Feedback from "./feedback/Feedback";
import FollowMe from "../FollowMe";

var eventEmitter = new EventEmitter();
UI.eventEmitter = eventEmitter;

/**
 * Whether an overlay is visible or not.
 *
 * FIXME: This is temporary solution. Don't use this variable!
 * Should be removed when all the code is move to react.
 *
 * @type {boolean}
 * @public
 */
UI.overlayVisible = false;

let etherpadManager;
let sharedVideoManager;

let followMeHandler;

let deviceErrorDialog;

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
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.camera[TrackErrors.NO_DATA_FROM_SOURCE]
    = "dialog.cameraNotSendingData";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.GENERAL]
    = "dialog.micUnknownError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.PERMISSION_DENIED]
    = "dialog.micPermissionDeniedError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.NOT_FOUND]
    = "dialog.micNotFoundError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.CONSTRAINT_FAILED]
    = "dialog.micConstraintFailedError";
JITSI_TRACK_ERROR_TO_MESSAGE_KEY_MAP.microphone[TrackErrors.NO_DATA_FROM_SOURCE]
    = "dialog.micNotSendingData";

/**
 * Toggles the application in and out of full screen mode
 * (a.k.a. presentation mode in Chrome).
 */
UI.toggleFullScreen = function() {
    (UIUtil.isFullScreen())
        ? UIUtil.exitFullScreen()
        : UIUtil.enterFullScreen();
};

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
    var message = APP.translation.generateTranslationHTML(
        "dialog.reservationErrorMsg", {code: code, msg: msg});
    messageHandler.openDialog(
        "dialog.reservationError", message, true, {}, () => false);
};

/**
 * Notify user that he has been kicked from the server.
 */
UI.notifyKicked = function () {
    messageHandler.openMessageDialog(
            "dialog.sessTerminated",
            "dialog.kickMessage");
};

/**
 * Notify user that conference was destroyed.
 * @param reason {string} the reason text
 */
UI.notifyConferenceDestroyed = function (reason) {
    //FIXME: use Session Terminated from translation, but
    // 'reason' text comes from XMPP packet and is not translated
    messageHandler.openDialog(
        "dialog.sessTerminated", reason, true, {}, () => false);
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
    if (UI.ContactList)
        UI.ContactList.onDisplayNameChange(id, displayName);
    VideoLayout.onDisplayNameChanged(id, displayName);

    if (APP.conference.isLocalId(id) || id === 'localVideoContainer') {
        Profile.changeDisplayName(displayName);
        Chat.setChatConversationMode(!!displayName);
    }
};

/**
 * Shows/hides the indication about local connection being interrupted.
 *
 * @param {boolean} isInterrupted <tt>true</tt> if local connection is
 * currently in the interrupted state or <tt>false</tt> if the connection
 * is fine.
 */
UI.showLocalConnectionInterrupted = function (isInterrupted) {
    VideoLayout.showLocalConnectionInterrupted(isInterrupted);
};

/**
 * Sets the "raised hand" status for a participant.
 */
UI.setRaisedHandStatus = (participant, raisedHandStatus) => {
    VideoLayout.setRaisedHandStatus(participant.getId(), raisedHandStatus);
    if (raisedHandStatus) {
        messageHandler.participantNotification(participant.getDisplayName(),
            'notify.somebody', 'connected', 'notify.raisedHand');
    }
};

/**
 * Sets the local "raised hand" status.
 */
UI.setLocalRaisedHandStatus
    = raisedHandStatus =>
        VideoLayout.setRaisedHandStatus(
            APP.conference.getMyUserId(),
            raisedHandStatus);

/**
 * Initialize conference UI.
 */
UI.initConference = function () {
    let id = APP.conference.getMyUserId();
    // Add myself to the contact list.
    if (UI.ContactList)
        UI.ContactList.addContact(id, true);

    // Update default button states before showing the toolbar
    // if local role changes buttons state will be again updated.
    UI.updateLocalRole(APP.conference.isModerator);

    UI.showToolbar();

    let displayName = config.displayJids ? id : Settings.getDisplayName();

    if (displayName) {
        UI.changeDisplayName('localVideoContainer', displayName);
    }

    // Make sure we configure our avatar id, before creating avatar for us
    let email = Settings.getEmail();
    if (email) {
        UI.setUserEmail(id, email);
    } else {
        UI.setUserAvatarID(id, Settings.getAvatarId());
    }

    APP.store.dispatch(checkAutoEnableDesktopSharing());

    if(!interfaceConfig.filmStripOnly) {
        Feedback.init(eventEmitter);
    }

    // FollowMe attempts to copy certain aspects of the moderator's UI into the
    // other participants' UI. Consequently, it needs (1) read and write access
    // to the UI (depending on the moderator role of the local participant) and
    // (2) APP.conference as means of communication between the participants.
    followMeHandler = new FollowMe(APP.conference, UI);

    UIUtil.activateTooltips();
};

UI.mucJoined = function () {
    VideoLayout.mucJoined();

    // Update local video now that a conference is joined a user ID should be
    // set.
    UI.changeDisplayName('localVideoContainer', APP.settings.getDisplayName());
};

/***
 * Handler for toggling filmstrip
 */
UI.handleToggleFilmstrip = () => UI.toggleFilmstrip();

/**
 * Sets tooltip defaults.
 *
 * @private
 */
function _setTooltipDefaults() {
    $.fn.tooltip.defaults = {
        opacity: 1, //defaults to 1
        offset: 1,
        delayIn: 0, //defaults to 500
        hoverable: true,
        hideOnClick: true,
        aria: true
    };
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
 * established, false - otherwise (for example in the case of welcome page)
 */
UI.start = function () {
    document.title = interfaceConfig.APP_NAME;

    // Set the defaults for prompt dialogs.
    $.prompt.setDefaults({persistent: false});

    // Set the defaults for tooltips.
    _setTooltipDefaults();

    SideContainerToggler.init(eventEmitter);
    Filmstrip.init(eventEmitter);

    // By default start with remote videos hidden and rely on other logic to
    // make them visible.
    UI.setRemoteThumbnailsVisibility(false);

    VideoLayout.init(eventEmitter);
    if (!interfaceConfig.filmStripOnly) {
        VideoLayout.initLargeVideo();
    }
    VideoLayout.resizeVideoArea(true, true);

    sharedVideoManager = new SharedVideoManager(eventEmitter);
    if (!interfaceConfig.filmStripOnly) {
        let debouncedShowToolbar
            = debounce(
                    () => UI.showToolbar(),
                    100,
                    { leading: true, trailing: false });

        $("#videoconference_page").mousemove(debouncedShowToolbar);

        // Initialise the recording module.
        if (config.enableRecording) {
            Recording.init(eventEmitter, config.recordingType);
        }
        // Initialize side panels
        SidePanels.init(eventEmitter);
    } else {
        $("body").addClass("filmstrip-only");
        UI.showToolbar();
        Filmstrip.setFilmstripOnly();
        messageHandler.enableNotifications(false);
        JitsiPopover.enabled = false;
    }

    if (interfaceConfig.VERTICAL_FILMSTRIP) {
        $("body").addClass("vertical-filmstrip");
    }

    document.title = interfaceConfig.APP_NAME;

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
            "newestOnTop": false,
            // this is the default toastr close button html, just adds tabIndex
            "closeHtml": '<button type="button" tabIndex="-1">&times;</button>'
        };
    }
};

/**
 * Invokes cleanup of any deferred execution within relevant UI modules.
 *
 * @returns {void}
 */
UI.stopDaemons = () => {
    VideoLayout.resetLargeVideo();
};

/**
 * Setup some UI event listeners.
 */
UI.registerListeners
    = () => UIListeners.forEach((value, key) => UI.addListener(key, value));

/**
 * Unregister some UI event listeners.
 */
UI.unregisterListeners
    = () => UIListeners.forEach((value, key) => UI.removeListener(key, value));

/**
 * Setup some DOM event listeners.
 */
UI.bindEvents = () => {
    function onResize() {
        SideContainerToggler.resize();
        VideoLayout.resizeVideoArea();
    }

    // Resize and reposition videos in full screen mode.
    $(document).on(
            'webkitfullscreenchange mozfullscreenchange fullscreenchange',
            () => {
                eventEmitter.emit(
                        UIEvents.FULLSCREEN_TOGGLED,
                        UIUtil.isFullScreen());
                onResize();
            });

    $(window).resize(onResize);
};

/**
 * Unbind some DOM event listeners.
 */
UI.unbindEvents = () => {
    $(document).off(
            'webkitfullscreenchange mozfullscreenchange fullscreenchange');

    $(window).off('resize');
};

/**
 * Show local stream on UI.
 * @param {JitsiTrack} track stream to show
 */
UI.addLocalStream = track => {
    switch (track.getType()) {
    case 'audio':
        VideoLayout.changeLocalAudio(track);
        break;
    case 'video':
        VideoLayout.changeLocalVideo(track);
        break;
    default:
        logger.error("Unknown stream type: " + track.getType());
        break;
    }
};


/**
 * Show remote stream on UI.
 * @param {JitsiTrack} track stream to show
 */
UI.addRemoteStream = track => VideoLayout.onRemoteStreamAdded(track);

/**
 * Removed remote stream from UI.
 * @param {JitsiTrack} track stream to remove
 */
UI.removeRemoteStream = track => VideoLayout.onRemoteStreamRemoved(track);

/**
 * Update chat subject.
 * @param {string} subject new chat subject
 */
UI.setSubject = subject => Chat.setSubject(subject);

/**
 * Setup and show Etherpad.
 * @param {string} name etherpad id
 */
UI.initEtherpad = name => {
    if (etherpadManager || !config.etherpad_base || !name) {
        return;
    }
    logger.log('Etherpad is enabled');
    etherpadManager
        = new EtherpadManager(config.etherpad_base, name, eventEmitter);

    APP.store.dispatch(showEtherpadButton());
};

/**
 * Returns the shared document manager object.
 * @return {EtherpadManager} the shared document manager object
 */
UI.getSharedDocumentManager = () => etherpadManager;

/**
 * Show user on UI.
 * @param {JitsiParticipant} user
 */
UI.addUser = function (user) {
    var id = user.getId();
    var displayName = user.getDisplayName();

    if (UI.ContactList)
        UI.ContactList.addContact(id);

    messageHandler.participantNotification(
        displayName,'notify.somebody', 'connected', 'notify.connected'
    );

    if (!config.startAudioMuted ||
        config.startAudioMuted > APP.conference.membersCount)
        UIUtil.playSoundNotification('userJoined');

    // Add Peer's container
    VideoLayout.addParticipantContainer(user);

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
    if (UI.ContactList)
        UI.ContactList.removeContact(id);

    messageHandler.participantNotification(
        displayName,'notify.somebody', 'disconnected', 'notify.disconnected'
    );

    if (!config.startAudioMuted
        || config.startAudioMuted > APP.conference.membersCount) {
        UIUtil.playSoundNotification('userLeft');
    }

    VideoLayout.removeParticipantContainer(id);
};

/**
 * Update videotype for specified user.
 * @param {string} id user id
 * @param {string} newVideoType new videotype
 */
UI.onPeerVideoTypeChanged
    = (id, newVideoType) => VideoLayout.onVideoTypeChanged(id, newVideoType);

/**
 * Update local user role and show notification if user is moderator.
 * @param {boolean} isModerator if local user is moderator or not
 */
UI.updateLocalRole = isModerator => {
    VideoLayout.showModeratorIndicator();

    APP.store.dispatch(showDialOutButton(isModerator));
    APP.store.dispatch(showSharedVideoButton());

    Recording.showRecordingButton(isModerator);
    SettingsMenu.showStartMutedOptions(isModerator);
    SettingsMenu.showFollowMeOptions(isModerator);

    if (isModerator) {
        if (!interfaceConfig.DISABLE_FOCUS_INDICATOR)
            messageHandler.participantNotification(
                null, "notify.me", 'connected', "notify.moderator");

        Recording.checkAutoRecord();
    }
};

/**
 * Check the role for the user and reflect it in the UI, moderator ui indication
 * and notifies user who is the moderator
 * @param user to check for moderator
 */
UI.updateUserRole = user => {
    VideoLayout.showModeratorIndicator();

    // We don't need to show moderator notifications when the focus (moderator)
    // indicator is disabled.
    if (!user.isModerator() || interfaceConfig.DISABLE_FOCUS_INDICATOR) {
        return;
    }

    var displayName = user.getDisplayName();
    if (displayName) {
        messageHandler.participantNotification(
            displayName, 'notify.somebody',
            'connected', 'notify.grantedTo', {
                to: UIUtil.escapeHtml(displayName)
            }
        );
    } else {
        messageHandler.participantNotification(
            '', 'notify.somebody',
            'connected', 'notify.grantedToUnknown');
    }
};

/**
 * Updates the user status.
 *
 * @param {JitsiParticipant} user - The user which status we need to update.
 * @param {string} status - The new status.
 */
UI.updateUserStatus = (user, status) => {
    let displayName = user.getDisplayName();
    messageHandler.participantNotification(
        displayName, '', 'connected', "dialOut.statusMessage",
        {
            status: UIUtil.escapeHtml(status)
        });
};

/**
 * Toggles smileys in the chat.
 */
UI.toggleSmileys = () => Chat.toggleSmileys();

/**
 * Toggles filmstrip.
 */
UI.toggleFilmstrip = function () {
    var self = Filmstrip;
    self.toggleFilmstrip.apply(self, arguments);
    VideoLayout.resizeVideoArea(true, false);
};

/**
 * Indicates if the filmstrip is currently visible or not.
 * @returns {true} if the filmstrip is currently visible, otherwise
 */
UI.isFilmstripVisible = () => Filmstrip.isFilmstripVisible();

/**
 * Toggles chat panel.
 */
UI.toggleChat = () => UI.toggleSidePanel("chat_container");

/**
 * Toggles contact list panel.
 */
UI.toggleContactList = () => UI.toggleSidePanel("contacts_container");

/**
 * Toggles the given side panel.
 *
 * @param {String} sidePanelId the identifier of the side panel to toggle
 */
UI.toggleSidePanel = sidePanelId => SideContainerToggler.toggle(sidePanelId);


/**
 * Handle new user display name.
 */
UI.inputDisplayNameHandler = function (newDisplayName) {
    eventEmitter.emit(UIEvents.NICKNAME_CHANGED, newDisplayName);
};

/**
 * Show custom popup/tooltip for a specified button.
 * @param popupSelectorID the selector id of the popup to show
 * @param show true or false/show or hide the popup
 * @param timeout the time to show the popup
 */
UI.showCustomToolbarPopup = function (popupSelectorID, show, timeout) {
    eventEmitter.emit(UIEvents.SHOW_CUSTOM_TOOLBAR_BUTTON_POPUP,
        popupSelectorID, show, timeout);
};

/**
 * Return the type of the remote video.
 * @param jid the jid for the remote video
 * @returns the video type video or screen.
 */
UI.getRemoteVideoType = function (jid) {
    return VideoLayout.getRemoteVideoType(jid);
};

// FIXME check if someone user this
UI.showLoginPopup = function(callback) {
    logger.log('password is required');

    let message = (
        `<input name="username" type="text"
                placeholder="user@domain.net"
                class="input-control" autofocus>
         <input name="password" type="password"
                data-i18n="[placeholder]dialog.userPassword"
                class="input-control"
                placeholder="user password">`
    );

    let submitFunction = (e, v, m, f) => {
        if (v) {
            if (f.username && f.password) {
                callback(f.username, f.password);
            }
        }
    };

    messageHandler.openTwoButtonDialog({
        titleKey : "dialog.passwordRequired",
        msgString: message,
        leftButtonKey: 'dialog.Ok',
        submitFunction,
        focus: ':input:first'
    });
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
        APP.store.dispatch(setAudioMuted(muted));
        APP.store.dispatch(setToolbarButton('microphone', {
            toggled: muted
        }));
    }
};

/**
 * Sets muted video state for participant
 */
UI.setVideoMuted = function (id, muted) {
    VideoLayout.onVideoMute(id, muted);
    if (APP.conference.isLocalId(id)) {
        APP.store.dispatch(setVideoMuted(muted));
        APP.store.dispatch(setToolbarButton('camera', {
            toggled: muted
        }));
    }
};

/**
 * Triggers an update of remote video and large video displays so they may pick
 * up any state changes that have occurred elsewhere.
 *
 * @returns {void}
 */
UI.updateAllVideos = () => VideoLayout.updateAllVideos();

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

/**
 * Emits the event of given type by specifying the parameters in options.
 *
 * @param type the type of the event we're emitting
 * @param options the parameters for the event
 */
UI.emitEvent = (type, ...options) => eventEmitter.emit(type, ...options);

UI.clickOnVideo = function (videoNumber) {
    let videos = $("#remoteVideos .videocontainer:not(#mixedstream)");
    let videosLength = videos.length;

    if(videosLength <= videoNumber) {
        return;
    }
    let videoIndex = videoNumber === 0 ? 0 : videosLength - videoNumber;
    videos[videoIndex].click();
};

// Used by torture.
UI.showToolbar = timeout => APP.store.dispatch(showToolbox(timeout));

// Used by torture.
UI.dockToolbar = dock => APP.store.dispatch(dockToolbox(dock));

/**
 * Updates the avatar for participant.
 * @param {string} id user id
 * @param {string} avatarUrl the URL for the avatar
 */
function changeAvatar(id, avatarUrl) {
    VideoLayout.changeUserAvatar(id, avatarUrl);
    if (UI.ContactList)
        UI.ContactList.changeUserAvatar(id, avatarUrl);
    if (APP.conference.isLocalId(id)) {
        Profile.changeAvatar(avatarUrl);
    }
}

/**
 * Update user email.
 * @param {string} id user id
 * @param {string} email user email
 */
UI.setUserEmail = function (id, email) {
    // update avatar
    Avatar.setUserEmail(id, email);

    changeAvatar(id, Avatar.getAvatarUrl(id));
    if (APP.conference.isLocalId(id)) {
        Profile.changeEmail(email);
    }
};

/**
 * Update user avtar id.
 * @param {string} id user id
 * @param {string} avatarId user's avatar id
 */
UI.setUserAvatarID = function (id, avatarId) {
    // update avatar
    Avatar.setUserAvatarID(id, avatarId);

    changeAvatar(id, Avatar.getAvatarUrl(id));
};

/**
 * Update user avatar URL.
 * @param {string} id user id
 * @param {string} url user avatar url
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
    var message;
    if (stropheErrorMsg) {
        message = APP.translation.generateTranslationHTML(
            "dialog.connectErrorWithMsg", {msg: stropheErrorMsg});
    } else {
        message = APP.translation.generateTranslationHTML(
            "dialog.connectError");
    }

    messageHandler.openDialog("dialog.error", message, true, {}, () => false);
};


/**
 * Notify user that maximum users limit has been reached.
 */
UI.notifyMaxUsersLimitReached = function () {
    var message = APP.translation.generateTranslationHTML(
            "dialog.maxUsersLimitReached");

    messageHandler.openDialog("dialog.error", message, true, {}, () => false);
};

/**
 * Notify user that he was automatically muted when joned the conference.
 */
UI.notifyInitiallyMuted = function () {
    messageHandler.participantNotification(
        null,
        "notify.mutedTitle",
        "connected",
        "notify.muted",
        null,
        { timeOut: 120000 });
};

/**
 * Mark user as dominant speaker.
 * @param {string} id user id
 */
UI.markDominantSpeaker = function (id) {
    VideoLayout.onDominantSpeakerChanged(id);
};

UI.handleLastNEndpoints = function (leavingIds, enteringIds) {
    VideoLayout.onLastNEndpointsChanged(leavingIds, enteringIds);
};

/**
 * Will handle notification about participant's connectivity status change.
 *
 * @param {string} id the id of remote participant(MUC jid)
 */
UI.participantConnectionStatusChanged = function (id) {
    VideoLayout.onParticipantConnectionStatusChanged(id);
};

/**
 * Prompt user for nickname.
 */
UI.promptDisplayName = () => {
    const labelKey = 'dialog.enterDisplayName';
    const message = (
        `<div class="form-control">
            <label data-i18n="${labelKey}" class="form-control__label"></label>
            <input name="displayName" type="text"
               data-i18n="[placeholder]defaultNickname"
               class="input-control" autofocus>
         </div>`
    );

    // Don't use a translation string, because we're too early in the call and
    // the translation may not be initialised.
    const buttons = { Ok: true };

    const dialog = messageHandler.openDialog(
        'dialog.displayNameRequired',
        message,
        true,
        buttons,
        (e, v, m, f) => {
            e.preventDefault();
            if (v) {
                const displayName = f.displayName;

                if (displayName) {
                    UI.inputDisplayNameHandler(displayName);
                    dialog.close();
                    return;
                }
            }
        },
        () => {
            const form  = $.prompt.getPrompt();
            const input = form.find("input[name='displayName']");
            const button = form.find("button");

            input.focus();
            button.attr("disabled", "disabled");
            input.keyup(() => {
                if (input.val()) {
                    button.removeAttr("disabled");
                } else {
                    button.attr("disabled", "disabled");
                }
            });
        }
    );
};

/**
 * Update audio level visualization for specified user.
 * @param {string} id user id
 * @param {number} lvl audio level
 */
UI.setAudioLevel = (id, lvl) => VideoLayout.setAudioLevel(id, lvl);

/**
 * Update state of desktop sharing buttons.
 *
 * @returns {void}
 */
UI.updateDesktopSharingButtons
    = () =>
        APP.store.dispatch(setToolbarButton('desktop', {
            toggled: APP.conference.isSharingScreen
        }));

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
 * Add chat message.
 * @param {string} from user id
 * @param {string} displayName user nickname
 * @param {string} message message text
 * @param {number} stamp timestamp when message was created
 */
UI.addMessage = function (from, displayName, message, stamp) {
    Chat.updateChatConversation(from, displayName, message, stamp);
};

UI.updateDTMFSupport
    = isDTMFSupported => APP.store.dispatch(showDialPadButton(isDTMFSupported));

/**
 * Show user feedback dialog if its required and enabled after pressing the
 * hangup button.
 * @returns {Promise} Resolved with value - false if the dialog is enabled and
 * resolved with true if the dialog is disabled or the feedback was already
 * submitted. Rejected if another dialog is already displayed. This values are
 * used to display or not display the thank you dialog from
 * conference.maybeRedirectToWelcomePage method.
 */
UI.requestFeedbackOnHangup = function () {
    if (Feedback.isVisible())
        return Promise.reject(FEEDBACK_REQUEST_IN_PROGRESS);
    // Feedback has been submitted already.
    else if (Feedback.isEnabled() && Feedback.isSubmitted()) {
        return Promise.resolve({
            thankYouDialogVisible : true,
            feedbackSubmitted: true
        });
    }
    else
        return new Promise(function (resolve) {
            if (Feedback.isEnabled()) {
                Feedback.openFeedbackWindow(
                    (options) => {
                        options.thankYouDialogVisible = false;
                        resolve(options);
                    });
            } else {
                // If the feedback functionality isn't enabled we show a thank
                // you dialog. Signaling it (true), so the caller
                // of requestFeedback can act on it
                resolve(
                    {thankYouDialogVisible : true, feedbackSubmitted: false});
            }
        });
};

UI.updateRecordingState = function (state) {
    Recording.updateRecordingState(state);
};

UI.notifyTokenAuthFailed = function () {
    messageHandler.showError(   "dialog.tokenAuthFailedTitle",
                                "dialog.tokenAuthFailed");
};

UI.notifyInternalError = function () {
    messageHandler.showError(   "dialog.internalErrorTitle",
                                "dialog.internalError");
};

UI.notifyFocusDisconnected = function (focus, retrySec) {
    messageHandler.participantNotification(
        null, "notify.focus",
        'disconnected', "notify.focusFail",
        {component: focus, ms: retrySec}
    );
};

/**
 * Updates auth info on the UI.
 * @param {boolean} isAuthEnabled if authentication is enabled
 * @param {string} [login] current login
 */
UI.updateAuthInfo = function (isAuthEnabled, login) {
    let showAuth = isAuthEnabled && UIUtil.isAuthenticationEnabled();
    let loggedIn = !!login;

    Profile.showAuthenticationButtons(showAuth);

    if (showAuth) {
        Profile.setAuthenticatedIdentity(login);

        Profile.showLoginButton(!loggedIn);
        Profile.showLogoutButton(loggedIn);
    }
};

UI.onStartMutedChanged = function (startAudioMuted, startVideoMuted) {
    SettingsMenu.updateStartMutedBox(startAudioMuted, startVideoMuted);
};

/**
 * Notifies interested listeners that the raise hand property has changed.
 *
 * @param {boolean} isRaisedHand indicates the current state of the
 * "raised hand"
 */
UI.onLocalRaiseHandChanged = function (isRaisedHand) {
    eventEmitter.emit(UIEvents.LOCAL_RAISE_HAND_CHANGED, isRaisedHand);
};

/**
 * Update list of available physical devices.
 * @param {object[]} devices new list of available devices
 */
UI.onAvailableDevicesChanged = function (devices) {
    APP.store.dispatch(updateDeviceList(devices));
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
 * Returns whether or not the passed in user id is currently pinned to the large
 * video.
 *
 * @param {string} userId - The id of the user to check is pinned or not.
 * @returns {boolean} True if the user is currently pinned to the large video.
 */
UI.isPinned = userId => VideoLayout.getPinnedId() === userId;

/**
 * Shows dialog with a link to FF extension.
 */
UI.showExtensionRequiredDialog = function (url) {
    messageHandler.openMessageDialog(
        "dialog.extensionRequired",
        "[html]dialog.firefoxExtensionPrompt",
        {url: url});
};

/**
 * Shows "Please go to chrome webstore to install the desktop sharing extension"
 * 2 button dialog with buttons - cancel and go to web store.
 * @param url {string} the url of the extension.
 */
UI.showExtensionExternalInstallationDialog = function (url) {
    let submitFunction = function(e,v){
        if (v) {
            e.preventDefault();
            eventEmitter.emit(UIEvents.OPEN_EXTENSION_STORE, url);
        }
    };

    let closeFunction = function () {
        eventEmitter.emit(UIEvents.EXTERNAL_INSTALLATION_CANCELED);
    };

    messageHandler.openTwoButtonDialog({
        titleKey: 'dialog.externalInstallationTitle',
        msgKey: 'dialog.externalInstallationMsg',
        leftButtonKey: 'dialog.goToStore',
        submitFunction,
        loadedFunction: $.noop,
        closeFunction
    });
};


/**
 * Shows dialog with combined information about camera and microphone errors.
 * @param {JitsiTrackError} micError
 * @param {JitsiTrackError} cameraError
 */
UI.showDeviceErrorDialog = function (micError, cameraError) {
    let dontShowAgain = {
        id: "doNotShowWarningAgain",
        localStorageKey: "doNotShowErrorAgain",
        textKey: "dialog.doNotShowWarningAgain"
    };
    let isMicJitsiTrackErrorAndHasName = micError && micError.name &&
        micError instanceof JitsiMeetJS.errorTypes.JitsiTrackError;
    let isCameraJitsiTrackErrorAndHasName = cameraError && cameraError.name &&
        cameraError instanceof JitsiMeetJS.errorTypes.JitsiTrackError;
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
        dontShowAgain.localStorageKey += "-mic-" + micError.name;
    }

    if (cameraError) {
        dontShowAgain.localStorageKey += "-camera-" + cameraError.name;
    }

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

    // To make sure we don't have multiple error dialogs open at the same time,
    // we will just close the previous one if we are going to show a new one.
    deviceErrorDialog && deviceErrorDialog.close();

    deviceErrorDialog = messageHandler.openDialog(
        getTitleKey(),
        message,
        false,
        {Ok: true},
        function () {},
        null,
        function () {
            // Reset dialog reference to null to avoid memory leaks when
            // user closed the dialog manually.
            deviceErrorDialog = null;
        },
        showDoNotShowWarning ? dontShowAgain : undefined
    );

    function getTitleKey() {
        let title = "dialog.error";

        if (micError && micError.name === TrackErrors.PERMISSION_DENIED) {
            if (!cameraError
                    || cameraError.name === TrackErrors.PERMISSION_DENIED) {
                title = "dialog.permissionDenied";
            }
        } else if (cameraError
                && cameraError.name === TrackErrors.PERMISSION_DENIED) {
            title = "dialog.permissionDenied";
        }

        return title;
    }
};

/**
 * Shows error dialog that informs the user that no data is received from the
 * device.
 */
UI.showTrackNotWorkingDialog = function (stream) {
    messageHandler.openMessageDialog(
        "dialog.error",
        stream.isAudioTrack()? "dialog.micNotSendingData" :
            "dialog.cameraNotSendingData");
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
 * Enables / disables camera toolbar button.
 *
 * @param {boolean} enabled indicates if the camera button should be enabled
 * or disabled
 */
UI.setCameraButtonEnabled
    = enabled => APP.store.dispatch(setVideoIconEnabled(enabled));

/**
 * Enables / disables microphone toolbar button.
 *
 * @param {boolean} enabled indicates if the microphone button should be
 * enabled or disabled
 */
UI.setMicrophoneButtonEnabled
    = enabled => APP.store.dispatch(setAudioIconEnabled(enabled));

/**
 * Indicates if any the "top" overlays are currently visible. The check includes
 * the call/ring overlay, the suspended overlay, the GUM permissions overlay,
 * and the page-reload overlay.
 *
 * @returns {*|boolean} {true} if an overlay is visible; {false}, otherwise
 */
UI.isOverlayVisible = function () {
    return (
        this.overlayVisible
            || APP.store.getState()['features/jwt'].callOverlayVisible);
};

/**
 * Handles user's features changes.
 */
UI.onUserFeaturesChanged = user => VideoLayout.onUserFeaturesChanged(user);

/**
 * Returns the number of known remote videos.
 *
 * @returns {number} The number of remote videos.
 */
UI.getRemoteVideosCount = () => VideoLayout.getRemoteVideosCount();

/**
 * Makes remote thumbnail videos visible or not visible.
 *
 * @param {boolean} shouldHide - True if remote thumbnails should be hidden,
 * false f they should be visible.
 * @returns {void}
 */
UI.setRemoteThumbnailsVisibility
    = shouldHide => Filmstrip.setRemoteVideoVisibility(shouldHide);

const UIListeners = new Map([
    [
        UIEvents.ETHERPAD_CLICKED,
        () => etherpadManager && etherpadManager.toggleEtherpad()
    ], [
        UIEvents.SHARED_VIDEO_CLICKED,
        () => sharedVideoManager && sharedVideoManager.toggleSharedVideo()
    ], [
        UIEvents.TOGGLE_FULLSCREEN,
        UI.toggleFullScreen
    ], [
        UIEvents.TOGGLE_CHAT,
        UI.toggleChat
    ], [
        UIEvents.TOGGLE_SETTINGS,
        () => {
            // Opening of device selection is special-cased as it is a dialog
            // opened through a button in settings and not directly displayed in
            // settings itself. As it is not useful to only have a settings menu
            // with a button to open a dialog, open the dialog directly instead.
            if (interfaceConfig.SETTINGS_SECTIONS.length === 1
                    && UIUtil.isSettingEnabled('devices')) {
                APP.store.dispatch(openDeviceSelectionDialog());
            } else {
                UI.toggleSidePanel("settings_container");
            }
        }
    ], [
        UIEvents.TOGGLE_CONTACT_LIST,
        UI.toggleContactList
    ], [
        UIEvents.TOGGLE_PROFILE,
        () => {
            const {
                isGuest
            } = APP.store.getState()['features/jwt'];

            isGuest && UI.toggleSidePanel('profile_container');
        }
    ], [
        UIEvents.TOGGLE_FILMSTRIP,
        UI.handleToggleFilmstrip
    ], [
        UIEvents.FOLLOW_ME_ENABLED,
        enabled => (followMeHandler && followMeHandler.enableFollowMe(enabled))
    ]
]);

// TODO: Export every function separately. For now there is no point of doing
// this because we are importing everything.
export default UI;
