/* global $, APP, JitsiMeetJS, config, interfaceConfig */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import {openConnection} from './connection';

import AuthHandler from './modules/UI/authentication/AuthHandler';
import Recorder from './modules/recorder/Recorder';

import mediaDeviceHelper from './modules/devices/mediaDeviceHelper';

import { reload, reportError } from './modules/util/helpers';

import * as RemoteControlEvents
    from './service/remotecontrol/RemoteControlEvents';
import UIEvents from './service/UI/UIEvents';
import UIUtil from './modules/UI/util/UIUtil';
import * as JitsiMeetConferenceEvents from './ConferenceEvents';

import { initAnalytics } from './react/features/analytics';

import EventEmitter from "events";

import {
    AVATAR_ID_COMMAND,
    AVATAR_URL_COMMAND,
    conferenceFailed,
    conferenceJoined,
    conferenceLeft,
    dataChannelOpened,
    toggleAudioOnly,
    EMAIL_COMMAND,
    lockStateChanged,
    p2pStatusChanged
} from './react/features/base/conference';
import { updateDeviceList } from './react/features/base/devices';
import {
    isAnalyticsEnabled,
    isFatalJitsiConnectionError
} from './react/features/base/lib-jitsi-meet';
import {
    isVideoMutedByUser,
    MEDIA_TYPE,
    setAudioAvailable,
    setAudioMuted,
    setVideoAvailable,
    setVideoMuted
} from './react/features/base/media';
import {
    dominantSpeakerChanged,
    localParticipantConnectionStatusChanged,
    localParticipantRoleChanged,
    MAX_DISPLAY_NAME_LENGTH,
    participantConnectionStatusChanged,
    participantJoined,
    participantLeft,
    participantPresenceChanged,
    participantRoleChanged,
    participantUpdated
} from './react/features/base/participants';
import {
    createLocalTracksF,
    isLocalTrackMuted,
    replaceLocalTrack,
    trackAdded,
    trackRemoved
} from './react/features/base/tracks';
import { getLocationContextRoot } from './react/features/base/util';
import { statsEmitter } from './react/features/connection-indicator';
import { showDesktopPicker } from  './react/features/desktop-picker';
import { maybeOpenFeedbackDialog } from './react/features/feedback';
import {
    mediaPermissionPromptVisibilityChanged,
    suspendDetected
} from './react/features/overlay';
import {
    isButtonEnabled,
    showDesktopSharingButton
} from './react/features/toolbox';

const { participantConnectionStatus } = JitsiMeetJS.constants;

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

const ConferenceEvents = JitsiMeetJS.events.conference;
const ConferenceErrors = JitsiMeetJS.errors.conference;

const TrackEvents = JitsiMeetJS.events.track;
const TrackErrors = JitsiMeetJS.errors.track;

const eventEmitter = new EventEmitter();

let room;
let connection;

/*
 * Logic to open a desktop picker put on the window global for
 * lib-jitsi-meet to detect and invoke
 */
window.JitsiMeetScreenObtainer = {
    openDesktopPicker(options, onSourceChoose) {
        APP.store.dispatch(showDesktopPicker(options, onSourceChoose));
    }
};

/**
 * Known custom conference commands.
 */
const commands = {
    AVATAR_ID: AVATAR_ID_COMMAND,
    AVATAR_URL: AVATAR_URL_COMMAND,
    CUSTOM_ROLE: "custom-role",
    EMAIL: EMAIL_COMMAND,
    ETHERPAD: "etherpad",
    SHARED_VIDEO: "shared-video"
};

/**
 * Open Connection. When authentication failed it shows auth dialog.
 * @param roomName the room name to use
 * @returns Promise<JitsiConnection>
 */
function connect(roomName) {
    return openConnection({retry: true, roomName: roomName})
            .catch(function (err) {
        if (err === ConnectionErrors.PASSWORD_REQUIRED) {
            APP.UI.notifyTokenAuthFailed();
        } else {
            APP.UI.notifyConnectionFailed(err);
        }
        throw err;
    });
}

/**
 * Share data to other users.
 * @param command the command
 * @param {string} value new value
 */
function sendData(command, value) {
    if (!room) {
        return;
    }

    room.removeCommand(command);
    room.sendCommand(command, {value: value});
}

/**
 * Sets up initially the properties of the local participant - email, avatarID,
 * avatarURL, displayName, etc.
 */
function _setupLocalParticipantProperties() {
    const email = APP.settings.getEmail();
    email && sendData(commands.EMAIL, email);

    const avatarUrl = APP.settings.getAvatarUrl();
    avatarUrl && sendData(commands.AVATAR_URL, avatarUrl);

    if (!email && !avatarUrl) {
        sendData(commands.AVATAR_ID, APP.settings.getAvatarId());
    }

    let nick = APP.settings.getDisplayName();
    if (config.useNicks && !nick) {
        nick = APP.UI.askForNickname();
        APP.settings.setDisplayName(nick);
    }
    nick && room.setDisplayName(nick);
}

/**
 * Get user nickname by user id.
 * @param {string} id user id
 * @returns {string?} user nickname or undefined if user is unknown.
 */
function getDisplayName(id) {
    if (APP.conference.isLocalId(id)) {
        return APP.settings.getDisplayName();
    }

    let participant = room.getParticipantById(id);
    if (participant && participant.getDisplayName()) {
        return participant.getDisplayName();
    }
}

/**
 * Mute or unmute local audio stream if it exists.
 * @param {boolean} muted - if audio stream should be muted or unmuted.
 */
function muteLocalAudio(muted) {
    APP.store.dispatch(setAudioMuted(muted));
}

/**
 * Mute or unmute local video stream if it exists.
 * @param {boolean} muted if video stream should be muted or unmuted.
 *
 */
function muteLocalVideo(muted) {
    APP.store.dispatch(setVideoMuted(muted));
}

/**
 * Check if the welcome page is enabled and redirects to it.
 * If requested show a thank you dialog before that.
 * If we have a close page enabled, redirect to it without
 * showing any other dialog.
 *
 * @param {object} options used to decide which particular close page to show
 * or if close page is disabled, whether we should show the thankyou dialog
 * @param {boolean} options.thankYouDialogVisible - whether we should
 * show thank you dialog
 * @param {boolean} options.feedbackSubmitted - whether feedback was submitted
 */
function maybeRedirectToWelcomePage(options) {
    // if close page is enabled redirect to it, without further action
    if (config.enableClosePage) {
        const { isGuest } = APP.store.getState()['features/jwt'];

        // save whether current user is guest or not, before navigating
        // to close page
        window.sessionStorage.setItem('guest', isGuest);
        assignWindowLocationPathname('static/'
                + (options.feedbackSubmitted ? "close.html" : "close2.html"));
        return;
    }

    // else: show thankYou dialog only if there is no feedback
    if (options.thankYouDialogVisible)
        APP.UI.messageHandler.openMessageDialog(
            null, "dialog.thankYou", {appName:interfaceConfig.APP_NAME});

    // if Welcome page is enabled redirect to welcome page after 3 sec.
    if (config.enableWelcomePage) {
        setTimeout(() => {
            APP.settings.setWelcomePageEnabled(true);
            assignWindowLocationPathname('./');
        }, 3000);
    }
}

/**
 * Assigns a specific pathname to window.location.pathname taking into account
 * the context root of the Web app.
 *
 * @param {string} pathname - The pathname to assign to
 * window.location.pathname. If the specified pathname is relative, the context
 * root of the Web app will be prepended to the specified pathname before
 * assigning it to window.location.pathname.
 * @return {void}
 */
function assignWindowLocationPathname(pathname) {
    const windowLocation = window.location;

    if (!pathname.startsWith('/')) {
        // A pathname equal to ./ specifies the current directory. It will be
        // fine but pointless to include it because contextRoot is the current
        // directory.
        pathname.startsWith('./') && (pathname = pathname.substring(2));
        pathname = getLocationContextRoot(windowLocation) + pathname;
    }

    windowLocation.pathname = pathname;
}

class ConferenceConnector {
    constructor(resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
        this.reconnectTimeout = null;
        room.on(ConferenceEvents.CONFERENCE_JOINED,
            this._handleConferenceJoined.bind(this));
        room.on(ConferenceEvents.CONFERENCE_FAILED,
            this._onConferenceFailed.bind(this));
        room.on(ConferenceEvents.CONFERENCE_ERROR,
            this._onConferenceError.bind(this));
    }
    _handleConferenceFailed(err) {
        this._unsubscribe();
        this._reject(err);
    }
    _onConferenceFailed(err, ...params) {
        APP.store.dispatch(conferenceFailed(room, err, ...params));
        logger.error('CONFERENCE FAILED:', err, ...params);

        switch (err) {
        case ConferenceErrors.CONNECTION_ERROR:
            {
                let [msg] = params;
                APP.UI.notifyConnectionFailed(msg);
            }
            break;

        case ConferenceErrors.NOT_ALLOWED_ERROR:
            {
                // let's show some auth not allowed page
                assignWindowLocationPathname('static/authError.html');
            }
            break;

            // not enough rights to create conference
        case ConferenceErrors.AUTHENTICATION_REQUIRED: {
                // Schedule reconnect to check if someone else created the room.
                this.reconnectTimeout = setTimeout(() => room.join(), 5000);

                const { password }
                    = APP.store.getState()['features/base/conference'];

                AuthHandler.requireAuth(room, password);
            }
            break;

        case ConferenceErrors.RESERVATION_ERROR:
            {
                let [code, msg] = params;
                APP.UI.notifyReservationError(code, msg);
            }
            break;

        case ConferenceErrors.GRACEFUL_SHUTDOWN:
            APP.UI.notifyGracefulShutdown();
            break;

        case ConferenceErrors.JINGLE_FATAL_ERROR:
            APP.UI.notifyInternalError();
            break;

        case ConferenceErrors.CONFERENCE_DESTROYED:
            {
                let [reason] = params;
                APP.UI.hideStats();
                APP.UI.notifyConferenceDestroyed(reason);
            }
            break;

            // FIXME FOCUS_DISCONNECTED is confusing event name.
            // What really happens there is that the library is not ready yet,
            // because Jicofo is not available, but it is going to give
            // it another try.
        case ConferenceErrors.FOCUS_DISCONNECTED:
            {
                let [focus, retrySec] = params;
                APP.UI.notifyFocusDisconnected(focus, retrySec);
            }
            break;

        case ConferenceErrors.FOCUS_LEFT:
        case ConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE:
            // FIXME the conference should be stopped by the library and not by
            // the app. Both the errors above are unrecoverable from the library
            // perspective.
            room.leave().then(() => connection.disconnect());
            break;

        case ConferenceErrors.CONFERENCE_MAX_USERS:
            connection.disconnect();
            APP.UI.notifyMaxUsersLimitReached();
            break;
        case ConferenceErrors.INCOMPATIBLE_SERVER_VERSIONS:
            reload();
            break;
        default:
            this._handleConferenceFailed(err, ...params);
        }
    }
    _onConferenceError(err, ...params) {
        logger.error('CONFERENCE Error:', err, params);
        switch (err) {
        case ConferenceErrors.CHAT_ERROR:
            logger.error("Chat error.", err);
            if (isButtonEnabled('chat')) {
                let [code, msg] = params;
                APP.UI.showChatError(code, msg);
            }
            break;
        default:
            logger.error("Unknown error.", err);
        }
    }
    _unsubscribe() {
        room.off(
            ConferenceEvents.CONFERENCE_JOINED, this._handleConferenceJoined);
        room.off(
            ConferenceEvents.CONFERENCE_FAILED, this._onConferenceFailed);
        if (this.reconnectTimeout !== null) {
            clearTimeout(this.reconnectTimeout);
        }
        AuthHandler.closeAuth();
    }
    _handleConferenceJoined() {
        this._unsubscribe();
        this._resolve();
    }
    connect() {
        room.join();
    }
}

/**
 * Disconnects the connection.
 * @returns resolved Promise. We need this in order to make the Promise.all
 * call in hangup() to resolve when all operations are finished.
 */
function disconnect() {
    connection.disconnect();
    APP.API.notifyConferenceLeft(APP.conference.roomName);
    return Promise.resolve();
}

/**
 * Handles CONNECTION_FAILED events from lib-jitsi-meet.
 *
 * @param {JitsiMeetJS.connection.error} error - The reported error.
 * @returns {void}
 * @private
 */
function _connectionFailedHandler(error) {
    if (isFatalJitsiConnectionError(error)) {
        APP.connection.removeEventListener(
            ConnectionEvents.CONNECTION_FAILED,
            _connectionFailedHandler);
        if (room)
            room.leave();
    }
}

export default {
    /**
     * Flag used to delay modification of the muted status of local media tracks
     * until those are created (or not, but at that point it's certain that
     * the tracks won't exist).
     */
    _localTracksInitialized: false,
    isModerator: false,
    isSharingScreen: false,
    /**
     * Indicates if the desktop sharing functionality has been enabled.
     * It takes into consideration {@link isDesktopSharingDisabledByConfig}
     * as well as the status returned by
     * {@link JitsiMeetJS.isDesktopSharingEnabled()}. The latter can be false
     * either if the desktop sharing is not supported by the current browser
     * or if it was disabled through lib-jitsi-meet specific options (check
     * config.js for listed options).
     */
    isDesktopSharingEnabled: false,
    /**
     * Set to <tt>true</tt> if the desktop sharing functionality has been
     * explicitly disabled in the config.
     */
    isDesktopSharingDisabledByConfig: false,
    /**
     * The text displayed when the desktop sharing button is disabled through
     * the config. The value is set through
     * {@link interfaceConfig.DESKTOP_SHARING_BUTTON_DISABLED_TOOLTIP}.
     */
    desktopSharingDisabledTooltip: null,
    /*
     * Whether the local "raisedHand" flag is on.
     */
    isHandRaised: false,
    /*
     * Whether the local participant is the dominant speaker in the conference.
     */
    isDominantSpeaker: false,

    /**
     * The local audio track (if any).
     * FIXME tracks from redux store should be the single source of truth
     * @type {JitsiLocalTrack|null}
     */
    localAudio: null,

    /**
     * The local video track (if any).
     * FIXME tracks from redux store should be the single source of truth, but
     * more refactoring is required around screen sharing ('localVideo' usages).
     * @type {JitsiLocalTrack|null}
     */
    localVideo: null,

    /**
     * Creates local media tracks and connects to a room. Will show error
     * dialogs in case accessing the local microphone and/or camera failed. Will
     * show guidance overlay for users on how to give access to camera and/or
     * microphone.
     * @param {string} roomName
     * @param {object} options
     * @param {boolean} options.startAudioOnly=false - if <tt>true</tt> then
     * only audio track will be created and the audio only mode will be turned
     * on.
     * @param {boolean} options.startScreenSharing=false - if <tt>true</tt>
     * should start with screensharing instead of camera video.
     * @param {boolean} options.startWithAudioMuted - will start the conference
     * without any audio tracks.
     * @param {boolean} options.startWithVideoMuted - will start the conference
     * without any video tracks.
     * @returns {Promise.<JitsiLocalTrack[], JitsiConnection>}
     */
    createInitialLocalTracksAndConnect(roomName, options = {}) {
        let audioAndVideoError,
            audioOnlyError,
            screenSharingError,
            videoOnlyError;
        const initialDevices = [];
        let requestedAudio = false;
        let requestedVideo = false;

        if (!options.startWithAudioMuted) {
            initialDevices.push('audio');
            requestedAudio = true;
        }
        if (!options.startWithVideoMuted
                && !options.startAudioOnly
                && !options.startScreenSharing) {
            initialDevices.push('video');
            requestedVideo = true;
        }

        JitsiMeetJS.mediaDevices.addEventListener(
            JitsiMeetJS.events.mediaDevices.PERMISSION_PROMPT_IS_SHOWN,
            browser =>
                APP.store.dispatch(
                    mediaPermissionPromptVisibilityChanged(true, browser))
        );

        let tryCreateLocalTracks;

        // Enable audio only mode
        if (config.startAudioOnly) {
            APP.store.dispatch(toggleAudioOnly());
        }

        // FIXME is there any simpler way to rewrite this spaghetti below ?
        if (options.startScreenSharing) {
            tryCreateLocalTracks = this._createDesktopTrack()
                .then(desktopStream => {
                    if (!requestedAudio) {
                        return [desktopStream];
                    }

                    return createLocalTracksF({ devices: ['audio'] }, true)
                        .then(([audioStream]) => {
                            return [desktopStream, audioStream];
                        })
                        .catch(error => {
                            audioOnlyError = error;
                            return [desktopStream];
                        });
                }).catch(error => {
                    logger.error('Failed to obtain desktop stream', error);
                    screenSharingError = error;
                    return requestedAudio
                        ? createLocalTracksF({ devices: ['audio'] }, true)
                        : [];
                }).catch(error => {
                    audioOnlyError = error;
                    return [];
                });
        } else if (!requestedAudio && !requestedVideo) {
            // Resolve with no tracks
            tryCreateLocalTracks = Promise.resolve([]);
        } else {
            tryCreateLocalTracks = createLocalTracksF(
                { devices: initialDevices }, true)
                .catch(err => {
                    if (requestedAudio && requestedVideo) {

                        // Try audio only...
                        audioAndVideoError = err;

                        return createLocalTracksF({devices: ['audio']}, true);
                    } else if (requestedAudio && !requestedVideo) {
                        audioOnlyError = err;

                        return [];
                    } else if (requestedVideo && !requestedAudio) {
                        videoOnlyError = err;

                        return [];
                    }
                    logger.error('Should never happen');
                }).catch(err => {
                    // Log this just in case...
                    if (!requestedAudio) {
                        logger.error('The impossible just happened', err);
                    }
                    audioOnlyError = err;

                    // Try video only...
                    return requestedVideo
                        ? createLocalTracksF({devices: ['video']}, true)
                        : [];
                })
                .catch(err => {
                    // Log this just in case...
                    if (!requestedVideo) {
                        logger.error('The impossible just happened', err);
                    }
                    videoOnlyError = err;

                    return [];
                });
        }

        return Promise.all([ tryCreateLocalTracks, connect(roomName) ])
            .then(([tracks, con]) => {
                APP.store.dispatch(
                    mediaPermissionPromptVisibilityChanged(false));
                // FIXME If there will be microphone error it will cover any
                // screensharing dialog, but it's still better than in
                // the reverse order where the screensharing dialog will
                // sometimes be closing the microphone alert ($.prompt.close();
                // is called). Need to figure out dialogs chaining to fix that.
                if (screenSharingError) {
                    this._handleScreenSharingError(screenSharingError);
                }
                if (audioAndVideoError || audioOnlyError) {
                    if (audioOnlyError || videoOnlyError) {
                        // If both requests for 'audio' + 'video' and 'audio'
                        // only failed, we assume that there are some problems
                        // with user's microphone and show corresponding dialog.
                        APP.UI.showMicErrorNotification(audioOnlyError);
                        APP.UI.showCameraErrorNotification(videoOnlyError);
                    } else {
                        // If request for 'audio' + 'video' failed, but request
                        // for 'audio' only was OK, we assume that we had
                        // problems with camera and show corresponding dialog.
                        APP.UI.showCameraErrorNotification(audioAndVideoError);
                    }
                }

                return [tracks, con];
            });
    },

    /**
     * Open new connection and join to the conference.
     * @param {object} options
     * @param {string} roomName name of the conference
     * @returns {Promise}
     */
    init(options) {
        this.roomName = options.roomName;
        // attaches global error handler, if there is already one, respect it
        if (JitsiMeetJS.getGlobalOnErrorHandler){
            var oldOnErrorHandler = window.onerror;
            window.onerror = function (message, source, lineno, colno, error) {
                JitsiMeetJS.getGlobalOnErrorHandler(
                    message, source, lineno, colno, error);

                if (oldOnErrorHandler)
                    oldOnErrorHandler(message, source, lineno, colno, error);
            };

            var oldOnUnhandledRejection = window.onunhandledrejection;
            window.onunhandledrejection = function(event) {

            JitsiMeetJS.getGlobalOnErrorHandler(
                    null, null, null, null, event.reason);

                if (oldOnUnhandledRejection)
                    oldOnUnhandledRejection(event);
            };
        }
        return JitsiMeetJS.init(
            Object.assign({
                    enableAnalyticsLogging: isAnalyticsEnabled(APP.store)
                },
                config)
            ).then(() => {
                initAnalytics(APP.store);
                return this.createInitialLocalTracksAndConnect(
                    options.roomName, {
                        startAudioOnly: config.startAudioOnly,
                        startScreenSharing: config.startScreenSharing,
                        startWithAudioMuted: config.startWithAudioMuted,
                        startWithVideoMuted: config.startWithVideoMuted,
                    });
            }).then(([tracks, con]) => {
                tracks.forEach(track => {
                    if (track.isAudioTrack() && this.isLocalAudioMuted()) {
                        track.mute();
                    } else if (track.isVideoTrack()
                                    && this.isLocalVideoMuted()) {
                        track.mute();
                    }
                });
                logger.log('initialized with %s local tracks', tracks.length);
                this._localTracksInitialized = true;
                con.addEventListener(
                    ConnectionEvents.CONNECTION_FAILED,
                    _connectionFailedHandler);
                APP.connection = connection = con;

                // Desktop sharing related stuff:
                this.isDesktopSharingDisabledByConfig
                    = config.disableDesktopSharing;
                this.isDesktopSharingEnabled
                    = !this.isDesktopSharingDisabledByConfig
                        && JitsiMeetJS.isDesktopSharingEnabled();
                this.desktopSharingDisabledTooltip
                    = interfaceConfig.DESKTOP_SHARING_BUTTON_DISABLED_TOOLTIP;
                eventEmitter.emit(
                    JitsiMeetConferenceEvents.DESKTOP_SHARING_ENABLED_CHANGED,
                    this.isDesktopSharingEnabled);

                APP.store.dispatch(showDesktopSharingButton());

                this._createRoom(tracks);
                APP.remoteControl.init();

                // if user didn't give access to mic or camera or doesn't have
                // them at all, we mark corresponding toolbar buttons as muted,
                // so that the user can try unmute later on and add audio/video
                // to the conference
                if (!tracks.find((t) => t.isAudioTrack())) {
                    this.setAudioMuteStatus(true);
                }

                if (!tracks.find((t) => t.isVideoTrack())) {
                    this.setVideoMuteStatus(true);
                }

                this._initDeviceList();

                if (config.iAmRecorder)
                    this.recorder = new Recorder();

                // XXX The API will take care of disconnecting from the XMPP
                // server (and, thus, leaving the room) on unload.
                return new Promise((resolve, reject) => {
                    (new ConferenceConnector(resolve, reject)).connect();
                });
        });
    },
    /**
     * Check if id is id of the local user.
     * @param {string} id id to check
     * @returns {boolean}
     */
    isLocalId(id) {
        return this.getMyUserId() === id;
    },

    /**
     * Tells whether the local video is muted or not.
     * @return {boolean}
     */
    isLocalVideoMuted() {
        // If the tracks are not ready, read from base/media state
        return this._localTracksInitialized
            ? isLocalTrackMuted(
                APP.store.getState()['features/base/tracks'],
                MEDIA_TYPE.VIDEO)
            : isVideoMutedByUser(APP.store);
    },

    /**
     * Simulates toolbar button click for audio mute. Used by shortcuts and API.
     * @param {boolean} mute true for mute and false for unmute.
     * @param {boolean} [showUI] when set to false will not display any error
     * dialogs in case of media permissions error.
     */
    muteAudio(mute, showUI = true) {
        // Not ready to modify track's state yet
        if (!this._localTracksInitialized) {
            // This will only modify base/media.audio.muted which is then synced
            // up with the track at the end of local tracks initialization.
            muteLocalAudio(mute);
            this.setAudioMuteStatus(mute);

            return;
        } else if (this.isLocalAudioMuted() === mute) {
            // NO-OP
            return;
        }

        if (!this.localAudio && !mute) {
            const maybeShowErrorDialog = error => {
                showUI && APP.UI.showMicErrorNotification(error);
            };

            createLocalTracksF({ devices: ['audio'] }, false)
                .then(([audioTrack]) => audioTrack)
                .catch(error => {
                    maybeShowErrorDialog(error);

                    // Rollback the audio muted status by using null track
                    return null;
                })
                .then(audioTrack => this.useAudioStream(audioTrack));
        } else {
            muteLocalAudio(mute);
        }
    },
    /**
     * Returns whether local audio is muted or not.
     * @returns {boolean}
     */
    isLocalAudioMuted() {
        // If the tracks are not ready, read from base/media state
        return this._localTracksInitialized
            ? isLocalTrackMuted(
                APP.store.getState()['features/base/tracks'],
                MEDIA_TYPE.AUDIO)
            : Boolean(
                APP.store.getState()['features/base/media'].audio.muted);
    },
    /**
     * Simulates toolbar button click for audio mute. Used by shortcuts
     * and API.
     * @param {boolean} [showUI] when set to false will not display any error
     * dialogs in case of media permissions error.
     */
    toggleAudioMuted(showUI = true) {
        this.muteAudio(!this.isLocalAudioMuted(), showUI);
    },
    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     * @param mute true for mute and false for unmute.
     * @param {boolean} [showUI] when set to false will not display any error
     * dialogs in case of media permissions error.
     */
    muteVideo(mute, showUI = true) {
        // If not ready to modify track's state yet adjust the base/media
        if (!this._localTracksInitialized) {
            // This will only modify base/media.video.muted which is then synced
            // up with the track at the end of local tracks initialization.
            muteLocalVideo(mute);
            this.setVideoMuteStatus(mute);

            return;
        } else if (this.isLocalVideoMuted() === mute) {
            // NO-OP
            return;
        }

        // FIXME it is possible to queue this task twice, but it's not causing
        // any issues. Specifically this can happen when the previous
        // get user media call is blocked on "ask user for permissions" dialog.
        if (!this.localVideo && !mute) {
            const maybeShowErrorDialog = error => {
                showUI && APP.UI.showCameraErrorNotification(error);
            };

            // Try to create local video if there wasn't any.
            // This handles the case when user joined with no video
            // (dismissed screen sharing screen or in audio only mode), but
            // decided to add it later on by clicking on muted video icon or
            // turning off the audio only mode.
            //
            // FIXME when local track creation is moved to react/redux
            // it should take care of the use case described above
            createLocalTracksF({ devices: ['video'] }, false)
                .then(([videoTrack]) => videoTrack)
                .catch(error => {
                    // FIXME should send some feedback to the API on error ?
                    maybeShowErrorDialog(error);

                    // Rollback the video muted status by using null track
                    return null;
                })
                .then(videoTrack => this.useVideoStream(videoTrack));
        } else {
            // FIXME show error dialog if it fails (should be handled by react)
            muteLocalVideo(mute);
        }
    },
    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     * @param {boolean} [showUI] when set to false will not display any error
     * dialogs in case of media permissions error.
     */
    toggleVideoMuted(showUI = true) {
        this.muteVideo(!this.isLocalVideoMuted(), showUI);
    },
    /**
     * Retrieve list of conference participants (without local user).
     * @returns {JitsiParticipant[]}
     */
    listMembers() {
        return room.getParticipants();
    },
    /**
     * Retrieve list of ids of conference participants (without local user).
     * @returns {string[]}
     */
    listMembersIds() {
        return room.getParticipants().map(p => p.getId());
    },
    /**
     * Checks whether the participant identified by id is a moderator.
     * @id id to search for participant
     * @return {boolean} whether the participant is moderator
     */
    isParticipantModerator(id) {
        let user = room.getParticipantById(id);
        return user && user.isModerator();
    },
    /**
     * Check if SIP is supported.
     * @returns {boolean}
     */
    sipGatewayEnabled() {
        return room.isSIPCallingSupported();
    },
    get membersCount() {
        return room.getParticipants().length + 1;
    },
    /**
     * Returns true if the callstats integration is enabled, otherwise returns
     * false.
     *
     * @returns true if the callstats integration is enabled, otherwise returns
     * false.
     */
    isCallstatsEnabled() {
        return room && room.isCallstatsEnabled();
    },
    /**
     * Sends the given feedback through CallStats if enabled.
     *
     * @param overallFeedback an integer between 1 and 5 indicating the
     * user feedback
     * @param detailedFeedback detailed feedback from the user. Not yet used
     */
    sendFeedback(overallFeedback, detailedFeedback) {
        return room.sendFeedback (overallFeedback, detailedFeedback);
    },

    /**
     * Get speaker stats that track total dominant speaker time.
     *
     * @returns {object} A hash with keys being user ids and values being the
     * library's SpeakerStats model used for calculating time as dominant
     * speaker.
     */
    getSpeakerStats() {
        return room.getSpeakerStats();
    },

    /**
     * Returns the connection times stored in the library.
     */
    getConnectionTimes() {
        return this._room.getConnectionTimes();
    },
    // used by torture currently
    isJoined() {
        return this._room
            && this._room.isJoined();
    },
    getConnectionState() {
        return this._room
            && this._room.getConnectionState();
    },
    /**
     * Obtains current P2P ICE connection state.
     * @return {string|null} ICE connection state or <tt>null</tt> if there's no
     * P2P connection
     */
    getP2PConnectionState() {
        return this._room
            && this._room.getP2PConnectionState();
    },
    /**
     * Starts P2P (for tests only)
     * @private
     */
    _startP2P() {
        try {
            this._room && this._room.startP2PSession();
        } catch (error) {
            logger.error("Start P2P failed", error);
            throw error;
        }
    },
    /**
     * Stops P2P (for tests only)
     * @private
     */
    _stopP2P() {
        try {
            this._room && this._room.stopP2PSession();
        } catch (error) {
            logger.error("Stop P2P failed", error);
            throw error;
        }
    },
    /**
     * Checks whether or not our connection is currently in interrupted and
     * reconnect attempts are in progress.
     *
     * @returns {boolean} true if the connection is in interrupted state or
     * false otherwise.
     */
    isConnectionInterrupted() {
        return this._room.isConnectionInterrupted();
    },
    /**
     * Finds JitsiParticipant for given id.
     *
     * @param {string} id participant's identifier(MUC nickname).
     *
     * @returns {JitsiParticipant|null} participant instance for given id or
     * null if not found.
     */
    getParticipantById(id) {
        return room ? room.getParticipantById(id) : null;
    },
    /**
     * Get participant connection status for the participant.
     *
     * @param {string} id participant's identifier(MUC nickname)
     *
     * @returns {ParticipantConnectionStatus|null} the status of the participant
     * or null if no such participant is found or participant is the local user.
     */
    getParticipantConnectionStatus(id) {
        let participant = this.getParticipantById(id);
        return participant ? participant.getConnectionStatus() : null;
    },
    /**
     * Gets the display name foe the <tt>JitsiParticipant</tt> identified by
     * the given <tt>id</tt>.
     *
     * @param id {string} the participant's id(MUC nickname/JVB endpoint id)
     *
     * @return {string} the participant's display name or the default string if
     * absent.
     */
    getParticipantDisplayName(id) {
        let displayName = getDisplayName(id);
        if (displayName) {
            return displayName;
        } else {
            if (APP.conference.isLocalId(id)) {
                return APP.translation.generateTranslationHTML(
                    interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);
            } else {
                return interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
            }
        }
    },
    getMyUserId() {
        return this._room
            && this._room.myUserId();
    },
    /**
     * Indicates if recording is supported in this conference.
     */
    isRecordingSupported() {
        return this._room && this._room.isRecordingSupported();
    },
    /**
     * Returns the recording state or undefined if the room is not defined.
     */
    getRecordingState() {
        return (this._room) ? this._room.getRecordingState() : undefined;
    },
    /**
     * Will be filled with values only when config.debug is enabled.
     * Its used by torture to check audio levels.
     */
    audioLevelsMap: {},
    /**
     * Returns the stored audio level (stored only if config.debug is enabled)
     * @param id the id for the user audio level to return (the id value is
     *          returned for the participant using getMyUserId() method)
     */
    getPeerSSRCAudioLevel(id) {
        return this.audioLevelsMap[id];
    },
    /**
     * @return {number} the number of participants in the conference with at
     * least one track.
     */
    getNumberOfParticipantsWithTracks() {
        return this._room.getParticipants()
            .filter((p) => p.getTracks().length > 0)
            .length;
    },
    /**
     * Returns the stats.
     */
    getStats() {
        return room.connectionQuality.getStats();
    },
    // end used by torture

    getLogs() {
        return room.getLogs();
    },

    /**
     * Download logs, a function that can be called from console while
     * debugging.
     * @param filename (optional) specify target filename
     */
    saveLogs(filename = 'meetlog.json') {
        // this can be called from console and will not have reference to this
        // that's why we reference the global var
        let logs = APP.conference.getLogs();
        let data = encodeURIComponent(JSON.stringify(logs, null, '  '));

        let elem = document.createElement('a');

        elem.download = filename;
        elem.href = 'data:application/json;charset=utf-8,\n' + data;
        elem.dataset.downloadurl
            = ['text/json', elem.download, elem.href].join(':');
        elem.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false
        }));
    },

    /**
     * Exposes a Command(s) API on this instance. It is necessitated by (1) the
     * desire to keep room private to this instance and (2) the need of other
     * modules to send and receive commands to and from participants.
     * Eventually, this instance remains in control with respect to the
     * decision whether the Command(s) API of room (i.e. lib-jitsi-meet's
     * JitsiConference) is to be used in the implementation of the Command(s)
     * API of this instance.
     */
    commands: {
        /**
         * Known custom conference commands.
         */
        defaults: commands,
        /**
         * Receives notifications from other participants about commands aka
         * custom events (sent by sendCommand or sendCommandOnce methods).
         * @param command {String} the name of the command
         * @param handler {Function} handler for the command
         */
        addCommandListener () {
            room.addCommandListener.apply(room, arguments);
        },
        /**
         * Removes command.
         * @param name {String} the name of the command.
         */
        removeCommand () {
            room.removeCommand.apply(room, arguments);
        },
        /**
         * Sends command.
         * @param name {String} the name of the command.
         * @param values {Object} with keys and values that will be sent.
         */
        sendCommand () {
            room.sendCommand.apply(room, arguments);
        },
        /**
         * Sends command one time.
         * @param name {String} the name of the command.
         * @param values {Object} with keys and values that will be sent.
         */
        sendCommandOnce () {
            room.sendCommandOnce.apply(room, arguments);
        }
    },

    _createRoom (localTracks) {
        room = connection.initJitsiConference(APP.conference.roomName,
            this._getConferenceOptions());
        this._setLocalAudioVideoStreams(localTracks);
        this._room = room; // FIXME do not use this

        _setupLocalParticipantProperties();

        this._setupListeners();
    },

    /**
     * Sets local video and audio streams.
     * @param {JitsiLocalTrack[]} tracks=[]
     * @returns {Promise[]}
     * @private
     */
    _setLocalAudioVideoStreams(tracks = []) {
        return tracks.map(track => {
            if (track.isAudioTrack()) {
                return this.useAudioStream(track);
            } else if (track.isVideoTrack()) {
                return this.useVideoStream(track);
            } else {
                logger.error(
                    "Ignored not an audio nor a video track: ", track);
                return Promise.resolve();
            }
        });
    },

    _getConferenceOptions() {
        let options = config;
        if (config.enableRecording && !config.recordingType) {
            options.recordingType = (config.hosts &&
                (typeof config.hosts.jirecon != "undefined"))?
                "jirecon" : "colibri";
        }
        return options;
    },


    /**
     * Start using provided video stream.
     * Stops previous video stream.
     * @param {JitsiLocalTrack} [stream] new stream to use or null
     * @returns {Promise}
     */
    useVideoStream(newStream) {
        return APP.store.dispatch(
            replaceLocalTrack(this.localVideo, newStream, room))
            .then(() => {
                this.localVideo = newStream;

                if (newStream) {
                    this.isSharingScreen = newStream.videoType === 'desktop';

                    APP.UI.addLocalStream(newStream);
                } else {
                    this.isSharingScreen = false;
                }
                this.setVideoMuteStatus(this.isLocalVideoMuted());
                APP.UI.updateDesktopSharingButtons();
            });
    },

    /**
     * Start using provided audio stream.
     * Stops previous audio stream.
     * @param {JitsiLocalTrack} [stream] new stream to use or null
     * @returns {Promise}
     */
    useAudioStream(newStream) {
        return APP.store.dispatch(
            replaceLocalTrack(this.localAudio, newStream, room))
            .then(() => {
                this.localAudio = newStream;
                if (newStream) {
                    APP.UI.addLocalStream(newStream);
                }
                this.setAudioMuteStatus(this.isLocalAudioMuted());
            });
    },

    /**
     * Triggers a tooltip to display when a feature was attempted to be used
     * while in audio only mode.
     *
     * @param {string} featureName - The name of the feature that attempted to
     * toggle.
     * @private
     * @returns {void}
     */
    _displayAudioOnlyTooltip(featureName) {
        let buttonName = null;
        let tooltipElementId = null;

        switch (featureName) {
        case 'screenShare':
            buttonName = 'desktop';
            tooltipElementId = 'screenshareWhileAudioOnly';
            break;
        case 'videoMute':
            buttonName = 'camera';
            tooltipElementId = 'unmuteWhileAudioOnly';
            break;
        }

        if (tooltipElementId) {
            APP.UI.showToolbar(6000);
            APP.UI.showCustomToolbarPopup(
                buttonName, tooltipElementId, true, 5000);
        }
    },

    /**
     * Returns whether or not the conference is currently in audio only mode.
     *
     * @returns {boolean}
     */
    isAudioOnly() {
        return Boolean(
            APP.store.getState()['features/base/conference'].audioOnly);
    },

    videoSwitchInProgress: false,

    /**
     * This fields stores a handler which will create a Promise which turns off
     * the screen sharing and restores the previous video state (was there
     * any video, before switching to screen sharing ? was it muted ?).
     *
     * Once called this fields is cleared to <tt>null</tt>.
     * @type {Function|null}
     */
    _untoggleScreenSharing: null,

    /**
     * Creates a Promise which turns off the screen sharing and restores
     * the previous state described by the arguments.
     *
     * This method is bound to the appropriate values, after switching to screen
     * sharing and stored in {@link _untoggleScreenSharing}.
     *
     * @param {boolean} didHaveVideo indicates if there was a camera video being
     * used, before switching to screen sharing.
     * @param {boolean} wasVideoMuted indicates if the video was muted, before
     * switching to screen sharing.
     * @return {Promise} resolved after the screen sharing is turned off, or
     * rejected with some error (no idea what kind of error, possible GUM error)
     * in case it fails.
     * @private
     */
    _turnScreenSharingOff(didHaveVideo, wasVideoMuted) {
        this._untoggleScreenSharing = null;
        this.videoSwitchInProgress = true;
        APP.remoteControl.receiver.stop();
        let promise = null;

        if (didHaveVideo) {
            promise = createLocalTracksF({ devices: ['video'] })
                .then(([stream]) => this.useVideoStream(stream))
                .then(() => {
                    JitsiMeetJS.analytics.sendEvent(
                        'conference.sharingDesktop.stop');
                    logger.log('switched back to local video');
                    if (!this.localVideo && wasVideoMuted) {
                        return Promise.reject('No local video to be muted!');
                    } else if (wasVideoMuted && this.localVideo) {
                        return this.localVideo.mute();
                    }
                })
                .catch(error => {
                    logger.error('failed to switch back to local video', error);
                    return this.useVideoStream(null).then(() => {
                        // Still fail with the original err
                        return Promise.reject(error);
                    });
                });
        } else {
            promise = this.useVideoStream(null);
        }
        return promise.then(
            () => {
                this.videoSwitchInProgress = false;
            },
            error => {
                this.videoSwitchInProgress = false;
                throw error;
            });
    },

    /**
     * Toggles between screen sharing and camera video if the toggle parameter
     * is not specified and starts the procedure for obtaining new screen
     * sharing/video track otherwise.
     *
     * @param {boolean} [toggle] - If true - new screen sharing track will be
     * obtained. If false - new video track will be obtain. If not specified -
     * toggles between screen sharing and camera video.
     * @param {Object} [options] - Screen sharing options that will be passed to
     * createLocalTracks.
     * @param {Array<string>} [options.desktopSharingSources] - Array with the
     * sources that have to be displayed in the desktop picker window ('screen',
     * 'window', etc.).
     * @return {Promise.<T>}
     */
    toggleScreenSharing(toggle = !this._untoggleScreenSharing, options = {}) {
        if (this.videoSwitchInProgress) {
            return Promise.reject('Switch in progress.');
        }
        if (!this.isDesktopSharingEnabled) {
            return Promise.reject(
                'Cannot toggle screen sharing: not supported.');
        }

        if (this.isAudioOnly()) {
            this._displayAudioOnlyTooltip('screenShare');

            return Promise.reject('No screensharing in audio only mode');
        }

        if (toggle) {
            return this._switchToScreenSharing(options);
        } else {
            return this._untoggleScreenSharing();
        }
    },

    /**
     * Creates desktop (screensharing) {@link JitsiLocalTrack}
     * @param {Object} [options] - Screen sharing options that will be passed to
     * createLocalTracks.
     *
     * @return {Promise.<JitsiLocalTrack>} - A Promise resolved with
     * {@link JitsiLocalTrack} for the screensharing or rejected with
     * {@link JitsiTrackError}.
     *
     * @private
     */
    _createDesktopTrack(options = {}) {
        let externalInstallation = false;
        let DSExternalInstallationInProgress = false;
        const didHaveVideo = Boolean(this.localVideo);
        const wasVideoMuted = this.isLocalVideoMuted();

        return createLocalTracksF({
            desktopSharingSources: options.desktopSharingSources,
            devices: ['desktop'],
            desktopSharingExtensionExternalInstallation: {
                interval: 500,
                checkAgain: () => DSExternalInstallationInProgress,
                listener: (status, url) => {
                    switch(status) {
                    case "waitingForExtension": {
                        DSExternalInstallationInProgress = true;
                        externalInstallation = true;
                        const listener = () => {
                            // Wait a little bit more just to be sure that we
                            // won't miss the extension installation
                            setTimeout(
                                () => {
                                    DSExternalInstallationInProgress = false;
                                },
                                500);
                            APP.UI.removeListener(
                                UIEvents.EXTERNAL_INSTALLATION_CANCELED,
                                listener);
                        };
                        APP.UI.addListener(
                            UIEvents.EXTERNAL_INSTALLATION_CANCELED,
                            listener);
                        APP.UI.showExtensionExternalInstallationDialog(url);
                        break;
                    }
                    case "extensionFound":
                        // Close the dialog.
                        externalInstallation && $.prompt.close();
                        break;
                    default:
                        // Unknown status
                    }
                }
            }
        }).then(([desktopStream]) => {
            // Stores the "untoggle" handler which remembers whether was
            // there any video before and whether was it muted.
            this._untoggleScreenSharing
                = this._turnScreenSharingOff
                      .bind(this, didHaveVideo, wasVideoMuted);
            desktopStream.on(
                TrackEvents.LOCAL_TRACK_STOPPED,
                () => {
                    // If the stream was stopped during screen sharing
                    // session then we should switch back to video.
                    this.isSharingScreen
                        && this._untoggleScreenSharing
                        && this._untoggleScreenSharing();
                }
            );
            // close external installation dialog on success.
            externalInstallation && $.prompt.close();
            return desktopStream;
        }, error => {
            DSExternalInstallationInProgress = false;
            // close external installation dialog on success.
            externalInstallation && $.prompt.close();
            throw error;
        });
    },

    /**
     * Tries to switch to the screenshairng mode by disposing camera stream and
     * replacing it with a desktop one.
     *
     * @param {Object} [options] - Screen sharing options that will be passed to
     * createLocalTracks.
     *
     * @return {Promise} - A Promise resolved if the operation succeeds or
     * rejected with some unknown type of error in case it fails. Promise will
     * be rejected immediately if {@link videoSwitchInProgress} is true.
     *
     * @private
     */
    _switchToScreenSharing(options = {}) {
        if (this.videoSwitchInProgress) {
            return Promise.reject('Switch in progress.');
        }

        this.videoSwitchInProgress = true;
        return this._createDesktopTrack(options).then(stream => {
            return this.useVideoStream(stream);
        }).then(() => {
            this.videoSwitchInProgress = false;
            JitsiMeetJS.analytics.sendEvent('conference.sharingDesktop.start');
            logger.log('sharing local desktop');
        }).catch(error => {
            this.videoSwitchInProgress = false;
            // Pawel: With this call I'm trying to preserve the original
            // behaviour although it is not clear why would we "untoggle"
            // on failure. I suppose it was to restore video in case there
            // was some problem during "this.useVideoStream(desktopStream)".
            // It's important to note that the handler will not be available
            // if we fail early on trying to get desktop media (which makes
            // sense, because the camera video is still being used, so
            // nothing to "untoggle").
            if (this._untoggleScreenSharing) {
                this._untoggleScreenSharing();
            }

            // FIXME the code inside of _handleScreenSharingError is
            // asynchronous, but does not return a Promise and is not part of
            // the current Promise chain.
            this._handleScreenSharingError(error);

            return Promise.reject(error);
        });
    },

    /**
     * Handles {@link JitsiTrackError} returned by the lib-jitsi-meet when
     * trying to create screensharing track. It will either do nothing if
     * the dialog was canceled on user's request or display inline installation
     * dialog and ask the user to install the extension, once the extension is
     * installed it will switch the conference to screensharing. The last option
     * is that an unrecoverable error dialog will be displayed.
     * @param {JitsiTrackError} error - The error returned by
     * {@link _createDesktopTrack} Promise.
     * @private
     */
    _handleScreenSharingError(error) {
        if (error.name === TrackErrors.CHROME_EXTENSION_USER_CANCELED) {
            return;
        }

        logger.error('failed to share local desktop', error);

        if (error.name === TrackErrors.CHROME_EXTENSION_USER_GESTURE_REQUIRED) {
            // If start with screen sharing the extension will fail to install
            // (if not found), because the request has been triggered by the
            // script. Show a dialog which asks user to click "install" and try
            // again switching to the screen sharing.
            APP.UI.showExtensionInlineInstallationDialog(
                () => {
                    this.toggleScreenSharing().catch(() => {});
                }
            );

            return;
        } else if (error.name === TrackErrors.FIREFOX_EXTENSION_NEEDED) {
            APP.UI.showExtensionRequiredDialog(
                config.desktopSharingFirefoxExtensionURL
            );

            return;
        }

        // Handling:
        // TrackErrors.PERMISSION_DENIED
        // TrackErrors.CHROME_EXTENSION_INSTALLATION_ERROR
        // TrackErrors.GENERAL
        // and any other
        let dialogTxt;
        let dialogTitleKey;

        if (error.name === TrackErrors.PERMISSION_DENIED) {
            dialogTxt = APP.translation.generateTranslationHTML(
                "dialog.screenSharingPermissionDeniedError");
            dialogTitleKey = "dialog.error";
        } else {
            dialogTxt = APP.translation.generateTranslationHTML(
                "dialog.failtoinstall");
            dialogTitleKey = "dialog.permissionDenied";
        }

        APP.UI.messageHandler.openDialog(dialogTitleKey, dialogTxt, false);
    },
    /**
     * Setup interaction between conference and UI.
     */
    _setupListeners() {
        // add local streams when joined to the conference
        room.on(ConferenceEvents.CONFERENCE_JOINED, () => {
            APP.store.dispatch(conferenceJoined(room));

            APP.UI.mucJoined();
            APP.API.notifyConferenceJoined(APP.conference.roomName);
            APP.UI.markVideoInterrupted(false);
        });

        room.on(
            ConferenceEvents.CONFERENCE_LEFT,
            (...args) => APP.store.dispatch(conferenceLeft(room, ...args)));

        room.on(
            ConferenceEvents.AUTH_STATUS_CHANGED,
            (authEnabled, authLogin) =>
                APP.UI.updateAuthInfo(authEnabled, authLogin));

        room.on(ConferenceEvents.PARTCIPANT_FEATURES_CHANGED,
            user => APP.UI.onUserFeaturesChanged(user));
        room.on(ConferenceEvents.USER_JOINED, (id, user) => {
            if (user.isHidden())
                return;

            APP.store.dispatch(participantJoined({
                id,
                name: user.getDisplayName(),
                role: user.getRole()
            }));

            logger.log('USER %s connnected', id, user);
            APP.API.notifyUserJoined(id);
            APP.UI.addUser(user);

            // check the roles for the new user and reflect them
            APP.UI.updateUserRole(user);
        });

        room.on(ConferenceEvents.USER_LEFT, (id, user) => {
            APP.store.dispatch(participantLeft(id, user));
            logger.log('USER %s LEFT', id, user);
            APP.API.notifyUserLeft(id);
            APP.UI.removeUser(id, user.getDisplayName());
            APP.UI.onSharedVideoStop(id);
        });

        room.on(ConferenceEvents.USER_STATUS_CHANGED, (id, status) => {
            APP.store.dispatch(participantPresenceChanged(id, status));

            let user = room.getParticipantById(id);
            if (user) {
                APP.UI.updateUserStatus(user, status);
            }
        });

        room.on(ConferenceEvents.USER_ROLE_CHANGED, (id, role) => {
            if (this.isLocalId(id)) {
                logger.info(`My role changed, new role: ${role}`);

                APP.store.dispatch(localParticipantRoleChanged(role));

                if (this.isModerator !== room.isModerator()) {
                    this.isModerator = room.isModerator();
                    APP.UI.updateLocalRole(room.isModerator());
                }
            } else {
                APP.store.dispatch(participantRoleChanged(id, role));

                let user = room.getParticipantById(id);
                if (user) {
                    APP.UI.updateUserRole(user);
                }
            }
        });

        room.on(ConferenceEvents.TRACK_ADDED, (track) => {
            if (!track || track.isLocal())
                return;

            APP.store.dispatch(trackAdded(track));
        });

        room.on(ConferenceEvents.TRACK_REMOVED, (track) => {
            if (!track || track.isLocal())
                return;

            APP.store.dispatch(trackRemoved(track));
        });

        room.on(ConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED, (id, lvl) => {
            if (this.isLocalId(id)
                && this.localAudio && this.localAudio.isMuted()) {
                lvl = 0;
            }

            if (config.debug) {
                this.audioLevelsMap[id] = lvl;
                if (config.debugAudioLevels)
                    logger.log("AudioLevel:" + id + "/" + lvl);
            }

            APP.UI.setAudioLevel(id, lvl);
        });

        room.on(ConferenceEvents.TALK_WHILE_MUTED, () => {
            APP.UI.showToolbar(6000);

            APP.UI.showCustomToolbarPopup(
                'microphone', 'talkWhileMutedPopup', true, 5000);
        });

        room.on(
            ConferenceEvents.LAST_N_ENDPOINTS_CHANGED,
            (leavingIds, enteringIds) => {
                APP.UI.handleLastNEndpoints(leavingIds, enteringIds);
        });

        room.on(
            ConferenceEvents.P2P_STATUS,
            (jitsiConference, p2p) => {
                APP.store.dispatch(p2pStatusChanged(p2p));
        });

        room.on(
            ConferenceEvents.PARTICIPANT_CONN_STATUS_CHANGED,
            (id, connectionStatus) => {
                APP.store.dispatch(participantConnectionStatusChanged(
                    id, connectionStatus));

                APP.UI.participantConnectionStatusChanged(id);
        });
        room.on(ConferenceEvents.DOMINANT_SPEAKER_CHANGED, (id) => {
            APP.store.dispatch(dominantSpeakerChanged(id));

            if (this.isLocalId(id)) {
                this.isDominantSpeaker = true;
                this.setRaisedHand(false);
            } else {
                this.isDominantSpeaker = false;
                var participant = room.getParticipantById(id);
                if (participant) {
                    APP.UI.setRaisedHandStatus(participant, false);
                }
            }
            APP.UI.markDominantSpeaker(id);
        });

        if (!interfaceConfig.filmStripOnly) {
            room.on(ConferenceEvents.CONNECTION_INTERRUPTED, () => {
                APP.UI.markVideoInterrupted(true);
            });
            room.on(ConferenceEvents.CONNECTION_RESTORED, () => {
                APP.UI.markVideoInterrupted(false);
            });

            if (isButtonEnabled('chat')) {
                room.on(ConferenceEvents.MESSAGE_RECEIVED, (id, body, ts) => {
                    let nick = getDisplayName(id);
                    APP.API.notifyReceivedChatMessage({
                        id,
                        nick,
                        body,
                        ts
                    });
                    APP.UI.addMessage(id, nick, body, ts);
                });
                APP.UI.addListener(UIEvents.MESSAGE_CREATED, (message) => {
                    APP.API.notifySendingChatMessage(message);
                    room.sendTextMessage(message);
                });
            }

            APP.UI.addListener(UIEvents.SELECTED_ENDPOINT, (id) => {
                try {
                    // do not try to select participant if there is none (we
                    // are alone in the room), otherwise an error will be
                    // thrown cause reporting mechanism is not available
                    // (datachannels currently)
                    if (room.getParticipants().length === 0)
                        return;

                    room.selectParticipant(id);
                } catch (e) {
                    JitsiMeetJS.analytics.sendEvent(
                        'selectParticipant.failed');
                    reportError(e);
                }
            });

            APP.UI.addListener(
                UIEvents.VIDEO_UNMUTING_WHILE_AUDIO_ONLY,
                () => this._displayAudioOnlyTooltip('videoMute'));
        }

        room.on(ConferenceEvents.CONNECTION_INTERRUPTED, () => {
            APP.store.dispatch(localParticipantConnectionStatusChanged(
                participantConnectionStatus.INTERRUPTED));

            APP.UI.showLocalConnectionInterrupted(true);
        });

        room.on(ConferenceEvents.CONNECTION_RESTORED, () => {
            APP.store.dispatch(localParticipantConnectionStatusChanged(
                participantConnectionStatus.ACTIVE));

            APP.UI.showLocalConnectionInterrupted(false);
        });

        room.on(ConferenceEvents.DISPLAY_NAME_CHANGED, (id, displayName) => {
            const formattedDisplayName
                = displayName.substr(0, MAX_DISPLAY_NAME_LENGTH);
            APP.store.dispatch(participantUpdated({
                id,
                name: formattedDisplayName
            }));
            APP.API.notifyDisplayNameChanged(id, formattedDisplayName);
            APP.UI.changeDisplayName(id, formattedDisplayName);
        });

        room.on(
            ConferenceEvents.LOCK_STATE_CHANGED,
            (...args) => APP.store.dispatch(lockStateChanged(room, ...args)));

        APP.remoteControl.on(RemoteControlEvents.ACTIVE_CHANGED, isActive => {
            room.setLocalParticipantProperty(
                "remoteControlSessionStatus",
                isActive
            );
            APP.UI.setLocalRemoteControlActiveChanged();
        });

        room.on(ConferenceEvents.PARTICIPANT_PROPERTY_CHANGED,
                (participant, name, oldValue, newValue) => {
            switch (name) {
            case 'raisedHand':
                APP.UI.setRaisedHandStatus(participant, newValue);
                break;
            case 'remoteControlSessionStatus':
                APP.UI.setRemoteControlActiveStatus(
                    participant.getId(),
                    newValue);
                break;
            default:
            // ignore
            }
        });

        room.on(ConferenceEvents.RECORDER_STATE_CHANGED, (status, error) => {
            logger.log("Received recorder status change: ", status, error);
            APP.UI.updateRecordingState(status);
        });

        room.on(ConferenceEvents.KICKED, () => {
            APP.UI.hideStats();
            APP.UI.notifyKicked();
            // FIXME close
        });

        room.on(ConferenceEvents.SUSPEND_DETECTED, () => {
            APP.store.dispatch(suspendDetected());
            // After wake up, we will be in a state where conference is left
            // there will be dialog shown to user.
            // We do not want video/audio as we show an overlay and after it
            // user need to rejoin or close, while waking up we can detect
            // camera wakeup as a problem with device.
            // We also do not care about device change, which happens
            // on resume after suspending PC.
            if (this.deviceChangeListener)
                JitsiMeetJS.mediaDevices.removeEventListener(
                    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
                    this.deviceChangeListener);

            // stop local video
            if (this.localVideo) {
                this.localVideo.dispose();
                this.localVideo = null;
            }
            // stop local audio
            if (this.localAudio) {
                this.localAudio.dispose();
                this.localAudio = null;
            }
        });

        room.on(ConferenceEvents.DTMF_SUPPORT_CHANGED, (isDTMFSupported) => {
            APP.UI.updateDTMFSupport(isDTMFSupported);
        });

        APP.UI.addListener(UIEvents.AUDIO_MUTED, muted => {
            this.muteAudio(muted);
        });
        APP.UI.addListener(UIEvents.VIDEO_MUTED, muted => {
            if (this.isAudioOnly() && !muted) {
                this._displayAudioOnlyTooltip('videoMute');
            } else {
                this.muteVideo(muted);
            }
        });

        statsEmitter.startListeningForStats(room);

        room.addCommandListener(this.commands.defaults.ETHERPAD, ({value}) => {
            APP.UI.initEtherpad(value);
        });

        APP.UI.addListener(UIEvents.EMAIL_CHANGED, this.changeLocalEmail);
        room.addCommandListener(this.commands.defaults.EMAIL, (data, from) => {
            APP.store.dispatch(participantUpdated({
                id: from,
                email: data.value
            }));
            APP.UI.setUserEmail(from, data.value);
        });

        room.addCommandListener(
            this.commands.defaults.AVATAR_URL,
            (data, from) => {
                APP.store.dispatch(
                    participantUpdated({
                        id: from,
                        avatarURL: data.value
                    }));
                APP.UI.setUserAvatarUrl(from, data.value);
        });

        room.addCommandListener(this.commands.defaults.AVATAR_ID,
            (data, from) => {
                APP.store.dispatch(
                    participantUpdated({
                        id: from,
                        avatarID: data.value
                    }));
                APP.UI.setUserAvatarID(from, data.value);
            });

        APP.UI.addListener(UIEvents.NICKNAME_CHANGED,
            this.changeLocalDisplayName.bind(this));

        APP.UI.addListener(UIEvents.START_MUTED_CHANGED,
            (startAudioMuted, startVideoMuted) => {
                room.setStartMutedPolicy({
                    audio: startAudioMuted,
                    video: startVideoMuted
                });
            }
        );
        room.on(
            ConferenceEvents.START_MUTED_POLICY_CHANGED,
            ({ audio, video }) => {
                APP.UI.onStartMutedChanged(audio, video);
            }
        );
        room.on(ConferenceEvents.STARTED_MUTED, () => {
            (room.isStartAudioMuted() || room.isStartVideoMuted())
                && APP.UI.notifyInitiallyMuted();
        });

        room.on(
            ConferenceEvents.AVAILABLE_DEVICES_CHANGED, function (id, devices) {
                APP.UI.updateDevicesAvailability(id, devices);
            }
        );

        room.on(
            ConferenceEvents.DATA_CHANNEL_OPENED, () => {
                APP.store.dispatch(dataChannelOpened());
            }
        );

        // call hangup
        APP.UI.addListener(UIEvents.HANGUP, () => {
            this.hangup(true);
        });

        // logout
        APP.UI.addListener(UIEvents.LOGOUT, () => {
            AuthHandler.logout(room).then(url => {
                if (url) {
                    UIUtil.redirect(url);
                } else {
                    this.hangup(true);
                }
            });
        });

        APP.UI.addListener(UIEvents.RESOLUTION_CHANGED,
            (id, oldResolution, newResolution, delay) => {
            var logObject = {
                id: "resolution_change",
                participant: id,
                oldValue: oldResolution,
                newValue: newResolution,
                delay: delay
                };
            room.sendApplicationLog(JSON.stringify(logObject));

            // We only care about the delay between simulcast streams.
            // Longer delays will be caused by something else and will just
            // poison the data.
            if (delay < 2000) {
                JitsiMeetJS.analytics.sendEvent('stream.switch.delay',
                    {value: delay});
            }
        });

        // Starts or stops the recording for the conference.
        APP.UI.addListener(UIEvents.RECORDING_TOGGLED, (options) => {
            room.toggleRecording(options);
        });

        APP.UI.addListener(UIEvents.SUBJECT_CHANGED, (topic) => {
            room.setSubject(topic);
        });
        room.on(ConferenceEvents.SUBJECT_CHANGED, function (subject) {
            APP.UI.setSubject(subject);
        });

        APP.UI.addListener(UIEvents.USER_KICKED, (id) => {
            room.kickParticipant(id);
        });

        APP.UI.addListener(UIEvents.REMOTE_AUDIO_MUTED, (id) => {
            room.muteParticipant(id);
        });

        APP.UI.addListener(UIEvents.AUTH_CLICKED, () => {
            AuthHandler.authenticate(room);
        });

        APP.UI.addListener(
            UIEvents.VIDEO_DEVICE_CHANGED,
            (cameraDeviceId) => {
                JitsiMeetJS.analytics.sendEvent('settings.changeDevice.video');
                createLocalTracksF({
                    devices: ['video'],
                    cameraDeviceId: cameraDeviceId,
                    micDeviceId: null
                })
                .then(([stream]) => {
                    if (this.isAudioOnly()) {
                        return stream.mute()
                            .then(() => stream);
                    }

                    return stream;
                })
                .then(stream => {
                    this.useVideoStream(stream);
                    logger.log('switched local video device');
                    APP.settings.setCameraDeviceId(cameraDeviceId, true);
                })
                .catch((err) => {
                    APP.UI.showCameraErrorNotification(err);
                });
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_DEVICE_CHANGED,
            (micDeviceId) => {
                JitsiMeetJS.analytics.sendEvent(
                    'settings.changeDevice.audioIn');
                createLocalTracksF({
                    devices: ['audio'],
                    cameraDeviceId: null,
                    micDeviceId: micDeviceId
                })
                .then(([stream]) => {
                    this.useAudioStream(stream);
                    logger.log('switched local audio device');
                    APP.settings.setMicDeviceId(micDeviceId, true);
                })
                .catch((err) => {
                    APP.UI.showMicErrorNotification(err);
                });
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_OUTPUT_DEVICE_CHANGED,
            (audioOutputDeviceId) => {
                JitsiMeetJS.analytics.sendEvent(
                    'settings.changeDevice.audioOut');
                APP.settings.setAudioOutputDeviceId(audioOutputDeviceId)
                    .then(() => logger.log('changed audio output device'))
                    .catch((err) => {
                        logger.warn('Failed to change audio output device. ' +
                            'Default or previously set audio output device ' +
                            'will be used instead.', err);
                    });
            }
        );

        APP.UI.addListener(UIEvents.TOGGLE_AUDIO_ONLY, audioOnly => {

            // FIXME On web video track is stored both in redux and in
            // 'localVideo' field, video is attempted to be unmuted twice when
            // turning off the audio only mode. This will crash the app with
            // 'unmute operation is already in progress'.
            // Because there's no logic in redux about creating new track in
            // case unmute when not track exists the things have to go through
            // muteVideo logic in such case.
            const tracks = APP.store.getState()['features/base/tracks'];
            const isTrackInRedux
                = Boolean(
                    tracks.find(
                        track => track.jitsiTrack
                            && track.jitsiTrack.getType() === 'video'));
            if (!isTrackInRedux) {
                this.muteVideo(audioOnly);
            }

            // Immediately update the UI by having remote videos and the large
            // video update themselves instead of waiting for some other event
            // to cause the update, usually PARTICIPANT_CONN_STATUS_CHANGED.
            // There is no guarantee another event will trigger the update
            // immediately and in all situations, for example because a remote
            // participant is having connection trouble so no status changes.
            APP.UI.updateAllVideos();
        });

        APP.UI.addListener(
            UIEvents.TOGGLE_SCREENSHARING, this.toggleScreenSharing.bind(this)
        );

        APP.UI.addListener(UIEvents.UPDATE_SHARED_VIDEO,
            (url, state, time, isMuted, volume) => {
            // send start and stop commands once, and remove any updates
            // that had left
            if (state === 'stop' || state === 'start' || state === 'playing') {
                room.removeCommand(this.commands.defaults.SHARED_VIDEO);
                room.sendCommandOnce(this.commands.defaults.SHARED_VIDEO, {
                    value: url,
                    attributes: {
                        state: state,
                        time: time,
                        muted: isMuted,
                        volume: volume
                    }
                });
            }
            else {
                // in case of paused, in order to allow late users to join
                // paused
                room.removeCommand(this.commands.defaults.SHARED_VIDEO);
                room.sendCommand(this.commands.defaults.SHARED_VIDEO, {
                    value: url,
                    attributes: {
                        state: state,
                        time: time,
                        muted: isMuted,
                        volume: volume
                    }
                });
            }
        });
        room.addCommandListener(
            this.commands.defaults.SHARED_VIDEO, ({value, attributes}, id) => {

                if (attributes.state === 'stop') {
                    APP.UI.onSharedVideoStop(id, attributes);
                }
                else if (attributes.state === 'start') {
                    APP.UI.onSharedVideoStart(id, value, attributes);
                }
                else if (attributes.state === 'playing'
                    || attributes.state === 'pause') {
                    APP.UI.onSharedVideoUpdate(id, value, attributes);
                }
            });
    },
    /**
    * Adds any room listener.
    * @param {string} eventName one of the ConferenceEvents
    * @param {Function} listener the function to be called when the event
    * occurs
    */
    addConferenceListener(eventName, listener) {
        room.on(eventName, listener);
    },

    /**
    * Removes any room listener.
    * @param {string} eventName one of the ConferenceEvents
    * @param {Function} listener the listener to be removed.
    */
    removeConferenceListener(eventName, listener) {
        room.off(eventName, listener);
    },

    /**
     * Inits list of current devices and event listener for device change.
     * @private
     */
    _initDeviceList() {
        JitsiMeetJS.mediaDevices.isDeviceListAvailable()
            .then(isDeviceListAvailable => {
                if (isDeviceListAvailable
                        && JitsiMeetJS.mediaDevices.isDeviceChangeAvailable()) {
                    JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
                        // Ugly way to synchronize real device IDs with local
                        // storage and settings menu. This is a workaround until
                        // getConstraints() method will be implemented
                        // in browsers.
                        if (this.localAudio) {
                            APP.settings.setMicDeviceId(
                                this.localAudio.getDeviceId(), false);
                        }

                        if (this.localVideo) {
                            APP.settings.setCameraDeviceId(
                                this.localVideo.getDeviceId(), false);
                        }

                        mediaDeviceHelper.setCurrentMediaDevices(devices);
                        APP.UI.onAvailableDevicesChanged(devices);
                        APP.store.dispatch(updateDeviceList(devices));
                    });

                    this.deviceChangeListener = (devices) =>
                        window.setTimeout(
                            () => this._onDeviceListChanged(devices), 0);
                    JitsiMeetJS.mediaDevices.addEventListener(
                        JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
                        this.deviceChangeListener);
                }
            })
            .catch((error) => {
                logger.warn(`Error getting device list: ${error}`);
            });
    },
    /**
     * Event listener for JitsiMediaDevicesEvents.DEVICE_LIST_CHANGED to
     * handle change of available media devices.
     * @private
     * @param {MediaDeviceInfo[]} devices
     * @returns {Promise}
     */
    _onDeviceListChanged(devices) {
        let currentDevices = mediaDeviceHelper.getCurrentMediaDevices();

        // Event handler can be fired before direct
        // enumerateDevices() call, so handle this situation here.
        if (!currentDevices.audioinput &&
            !currentDevices.videoinput &&
            !currentDevices.audiooutput) {
            mediaDeviceHelper.setCurrentMediaDevices(devices);
            currentDevices = mediaDeviceHelper.getCurrentMediaDevices();
        }

        let newDevices =
            mediaDeviceHelper.getNewMediaDevicesAfterDeviceListChanged(
                devices,
                this.isSharingScreen,
                this.localVideo,
                this.localAudio);
        let promises = [];
        let audioWasMuted = this.isLocalAudioMuted();
        let videoWasMuted = this.isLocalVideoMuted();
        let availableAudioInputDevices =
            mediaDeviceHelper.getDevicesFromListByKind(devices, 'audioinput');
        let availableVideoInputDevices =
            mediaDeviceHelper.getDevicesFromListByKind(devices, 'videoinput');

        if (typeof newDevices.audiooutput !== 'undefined') {
            // Just ignore any errors in catch block.
            promises.push(APP.settings
                .setAudioOutputDeviceId(newDevices.audiooutput)
                .catch());
        }

        promises.push(
            mediaDeviceHelper.createLocalTracksAfterDeviceListChanged(
                    createLocalTracksF,
                    newDevices.videoinput,
                    newDevices.audioinput)
                .then(tracks =>
                    Promise.all(this._setLocalAudioVideoStreams(tracks)))
                .then(() => {
                    // If audio was muted before, or we unplugged current device
                    // and selected new one, then mute new audio track.
                    if (audioWasMuted ||
                        currentDevices.audioinput.length >
                        availableAudioInputDevices.length) {
                        muteLocalAudio(true);
                    }

                    // If video was muted before, or we unplugged current device
                    // and selected new one, then mute new video track.
                    if (!this.isSharingScreen &&
                        (videoWasMuted ||
                            currentDevices.videoinput.length >
                                availableVideoInputDevices.length)) {
                        muteLocalVideo(true);
                    }
                }));

        return Promise.all(promises)
            .then(() => {
                mediaDeviceHelper.setCurrentMediaDevices(devices);
                APP.UI.onAvailableDevicesChanged(devices);
            });
    },

    /**
     * Determines whether or not the audio button should be enabled.
     */
    updateAudioIconEnabled() {
        const audioMediaDevices
            = mediaDeviceHelper.getCurrentMediaDevices().audioinput;
        const audioDeviceCount
            = audioMediaDevices ? audioMediaDevices.length : 0;

        // The audio functionality is considered available if there are any
        // audio devices detected or if the local audio stream already exists.
        const available = audioDeviceCount > 0 || Boolean(this.localAudio);

        logger.debug(
            'Microphone button enabled: ' + available,
            'local audio: ' + this.localAudio,
            'audio devices: ' + audioMediaDevices,
            'device count: ' + audioDeviceCount);

        APP.store.dispatch(setAudioAvailable(available));
        APP.API.notifyAudioAvailabilityChanged(available);
    },

    /**
     * Determines whether or not the video button should be enabled.
     */
    updateVideoIconEnabled() {
        const videoMediaDevices
            = mediaDeviceHelper.getCurrentMediaDevices().videoinput;
        const videoDeviceCount
            = videoMediaDevices ? videoMediaDevices.length : 0;
        // The video functionality is considered available if there are any
        // video devices detected or if there is local video stream already
        // active which could be either screensharing stream or a video track
        // created before the permissions were rejected (through browser
        // config).
        const available = videoDeviceCount > 0 || Boolean(this.localVideo);

        logger.debug(
            'Camera button enabled: ' + available,
            'local video: ' + this.localVideo,
            'video devices: ' + videoMediaDevices,
            'device count: ' + videoDeviceCount);

        APP.store.dispatch(setVideoAvailable(available));
        APP.API.notifyVideoAvailabilityChanged(available);
    },

    /**
     * Toggles the local "raised hand" status.
     */
    maybeToggleRaisedHand() {
        this.setRaisedHand(!this.isHandRaised);
    },

    /**
     * Sets the local "raised hand" status to a particular value.
     */
    setRaisedHand(raisedHand) {
        if (raisedHand !== this.isHandRaised)
        {
            APP.UI.onLocalRaiseHandChanged(raisedHand);

            this.isHandRaised = raisedHand;
            // Advertise the updated status
            room.setLocalParticipantProperty("raisedHand", raisedHand);
            // Update the view
            APP.UI.setLocalRaisedHandStatus(raisedHand);
        }
    },

    /**
     * Log event to callstats and analytics.
     * @param {string} name the event name
     * @param {int} value the value (it's int because google analytics supports
     * only int).
     * @param {string} label short text which provides more info about the event
     * which allows to distinguish between few event cases of the same name
     * NOTE: Should be used after conference.init
     */
    logEvent(name, value, label) {
        if (JitsiMeetJS.analytics) {
            JitsiMeetJS.analytics.sendEvent(name, {value, label});
        }
        if (room) {
            room.sendApplicationLog(JSON.stringify({name, value, label}));
        }
    },
    /**
     * Methods logs an application event given in the JSON format.
     * @param {string} logJSON an event to be logged in JSON format
     */
    logJSON(logJSON) {
        if (room) {
            room.sendApplicationLog(logJSON);
        }
    },
    /**
     * Disconnect from the conference and optionally request user feedback.
     * @param {boolean} [requestFeedback=false] if user feedback should be
     * requested
     */
    hangup(requestFeedback = false) {
        eventEmitter.emit(JitsiMeetConferenceEvents.BEFORE_HANGUP);

        let requestFeedbackPromise;

        if (requestFeedback) {
            requestFeedbackPromise
                = APP.store.dispatch(maybeOpenFeedbackDialog(room))
                    // false because the thank you dialog shouldn't be displayed
                    .catch(() => Promise.resolve(false));
        } else {
            requestFeedbackPromise = Promise.resolve(true);
        }

        // All promises are returning Promise.resolve to make Promise.all to
        // be resolved when both Promises are finished. Otherwise Promise.all
        // will reject on first rejected Promise and we can redirect the page
        // before all operations are done.
        Promise.all([
            requestFeedbackPromise,
            room.leave().then(disconnect, disconnect)
        ]).then(values => {
            APP.API.notifyReadyToClose();
            maybeRedirectToWelcomePage(values[0]);
        });
    },

    /**
     * Changes the email for the local user
     * @param email {string} the new email
     */
    changeLocalEmail(email = '') {
        email = String(email).trim();

        if (email === APP.settings.getEmail()) {
            return;
        }

        const localId = room ? room.myUserId() : undefined;

        APP.store.dispatch(participantUpdated({
            id: localId,
            local: true,
            email
        }));

        APP.settings.setEmail(email);
        APP.UI.setUserEmail(localId, email);
        sendData(commands.EMAIL, email);
    },

    /**
     * Changes the avatar url for the local user
     * @param url {string} the new url
     */
    changeLocalAvatarUrl(url = '') {
        url = String(url).trim();

        if (url === APP.settings.getAvatarUrl()) {
            return;
        }

        const localId = room ? room.myUserId() : undefined;

        APP.store.dispatch(participantUpdated({
            id: localId,
            local: true,
            avatarURL: url
        }));

        APP.settings.setAvatarUrl(url);
        APP.UI.setUserAvatarUrl(localId, url);
        sendData(commands.AVATAR_URL, url);
    },

    /**
     * Sends a message via the data channel.
     * @param {string} to the id of the endpoint that should receive the
     * message. If "" - the message will be sent to all participants.
     * @param {object} payload the payload of the message.
     * @throws NetworkError or InvalidStateError or Error if the operation
     * fails.
     */
    sendEndpointMessage(to, payload) {
        room.sendEndpointMessage(to, payload);
    },

    /**
     * Adds new listener.
     * @param {String} eventName the name of the event
     * @param {Function} listener the listener.
     */
    addListener(eventName, listener) {
        eventEmitter.addListener(eventName, listener);
    },

    /**
     * Removes listener.
     * @param {String} eventName the name of the event that triggers the
     * listener
     * @param {Function} listener the listener.
     */
    removeListener(eventName, listener) {
        eventEmitter.removeListener(eventName, listener);
    },

    /**
     * Changes the display name for the local user
     * @param nickname {string} the new display name
     */
    changeLocalDisplayName(nickname = '') {
        const formattedNickname
            = nickname.trim().substr(0, MAX_DISPLAY_NAME_LENGTH);

        if (formattedNickname === APP.settings.getDisplayName()) {
            return;
        }

        APP.store.dispatch(participantUpdated({
            id: this.getMyUserId(),
            local: true,
            name: formattedNickname
        }));

        APP.settings.setDisplayName(formattedNickname);
        if (room) {
            room.setDisplayName(formattedNickname);
            APP.UI.changeDisplayName(this.getMyUserId(), formattedNickname);
        }
    },

    /**
     * Returns the desktop sharing source id or undefined if the desktop sharing
     * is not active at the moment.
     *
     * @returns {string|undefined} - The source id. If the track is not desktop
     * track or the source id is not available, undefined will be returned.
     */
    getDesktopSharingSourceId() {
        return this.localVideo.sourceId;
    },

    /**
     * Returns the desktop sharing source type or undefined if the desktop
     * sharing is not active at the moment.
     *
     * @returns {'screen'|'window'|undefined} - The source type. If the track is
     * not desktop track or the source type is not available, undefined will be
     * returned.
     */
    getDesktopSharingSourceType() {
        return this.localVideo.sourceType;
    },

    /**
     * Sets the video muted status.
     *
     * @param {boolean} muted - New muted status.
     */
    setVideoMuteStatus(muted) {
        APP.UI.setVideoMuted(this.getMyUserId(), muted);
        APP.API.notifyVideoMutedStatusChanged(muted);
    },

    /**
     * Sets the audio muted status.
     *
     * @param {boolean} muted - New muted status.
     */
    setAudioMuteStatus(muted) {
        APP.UI.setAudioMuted(this.getMyUserId(), muted);
        APP.API.notifyAudioMutedStatusChanged(muted);
    }
};
