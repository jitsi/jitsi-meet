/* global $, APP, JitsiMeetJS, config, interfaceConfig */
const logger = require("jitsi-meet-logger").getLogger(__filename);

import {openConnection} from './connection';
import ContactList from './modules/UI/side_pannels/contactlist/ContactList';

import AuthHandler from './modules/UI/authentication/AuthHandler';
import Recorder from './modules/recorder/Recorder';

import mediaDeviceHelper from './modules/devices/mediaDeviceHelper';

import { reload, reportError } from './modules/util/helpers';

import UIEvents from './service/UI/UIEvents';
import UIUtil from './modules/UI/util/UIUtil';
import * as JitsiMeetConferenceEvents from './ConferenceEvents';

import analytics from './modules/analytics/analytics';

import EventEmitter from "events";

import { getLocationContextRoot } from './react/features/app';
import {
    AVATAR_ID_COMMAND,
    AVATAR_URL_COMMAND,
    conferenceFailed,
    conferenceJoined,
    conferenceLeft,
    EMAIL_COMMAND,
    lockStateChanged
} from './react/features/base/conference';
import {
    updateDeviceList
} from './react/features/base/devices';
import {
    isFatalJitsiConnectionError
} from './react/features/base/lib-jitsi-meet';
import {
    localParticipantRoleChanged,
    participantJoined,
    participantLeft,
    participantRoleChanged,
    participantUpdated
} from './react/features/base/participants';
import {
    replaceLocalTrack,
    trackAdded,
    trackRemoved
} from './react/features/base/tracks';
import {
    showDesktopPicker
} from  './react/features/desktop-picker';
import {
    mediaPermissionPromptVisibilityChanged,
    suspendDetected
} from './react/features/overlay';
import { showDesktopSharingButton } from './react/features/toolbox';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

const ConferenceEvents = JitsiMeetJS.events.conference;
const ConferenceErrors = JitsiMeetJS.errors.conference;

const TrackEvents = JitsiMeetJS.events.track;
const TrackErrors = JitsiMeetJS.errors.track;

const ConnectionQualityEvents = JitsiMeetJS.events.connectionQuality;

const eventEmitter = new EventEmitter();

let room;
let connection;
let localAudio, localVideo;
let initialAudioMutedState = false, initialVideoMutedState = false;

/**
 * Indicates whether extension external installation is in progress or not.
 */
let DSExternalInstallationInProgress = false;

import {VIDEO_CONTAINER_TYPE} from "./modules/UI/videolayout/VideoContainer";

/*
 * Logic to open a desktop picker put on the window global for
 * lib-jitsi-meet to detect and invoke
 */
window.JitsiMeetScreenObtainer = {
    openDesktopPicker(onSourceChoose) {
        APP.store.dispatch(showDesktopPicker(onSourceChoose));
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
 * Max length of the display names. If we receive longer display name the
 * additional chars are going to be cut.
 */
const MAX_DISPLAY_NAME_LENGTH = 50;

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
 * Creates local media tracks and connects to room. Will show error
 * dialogs in case if accessing local microphone and/or camera failed. Will
 * show guidance overlay for users on how to give access to camera and/or
 * microphone,
 * @param {string} roomName
 * @returns {Promise.<JitsiLocalTrack[], JitsiConnection>}
 */
function createInitialLocalTracksAndConnect(roomName) {
    let audioAndVideoError,
        audioOnlyError;

    JitsiMeetJS.mediaDevices.addEventListener(
        JitsiMeetJS.events.mediaDevices.PERMISSION_PROMPT_IS_SHOWN,
        browser =>
            APP.store.dispatch(
                mediaPermissionPromptVisibilityChanged(true, browser))
    );

    // First try to retrieve both audio and video.
    let tryCreateLocalTracks = createLocalTracks(
            { devices: ['audio', 'video'] }, true)
        .catch(err => {
            // If failed then try to retrieve only audio.
            audioAndVideoError = err;
            return createLocalTracks({ devices: ['audio'] }, true);
        })
        .catch(err => {
            // If audio failed too then just return empty array for tracks.
            audioOnlyError = err;
            return [];
        });

    return Promise.all([ tryCreateLocalTracks, connect(roomName) ])
        .then(([tracks, con]) => {
            APP.store.dispatch(mediaPermissionPromptVisibilityChanged(false));
            if (audioAndVideoError) {
                if (audioOnlyError) {
                    // If both requests for 'audio' + 'video' and 'audio' only
                    // failed, we assume that there is some problems with user's
                    // microphone and show corresponding dialog.
                    APP.UI.showDeviceErrorDialog(audioOnlyError, null);
                } else {
                    // If request for 'audio' + 'video' failed, but request for
                    // 'audio' only was OK, we assume that we had problems with
                    // camera and show corresponding dialog.
                    APP.UI.showDeviceErrorDialog(null, audioAndVideoError);
                }
            }

            return [tracks, con];
        });
}

/**
 * Share data to other users.
 * @param command the command
 * @param {string} value new value
 */
function sendData(command, value) {
    if(!room) {
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
 * @param {boolean} userInteraction - indicates if this local audio mute was a
 * result of user interaction
 */
function muteLocalAudio(muted) {
    muteLocalMedia(localAudio, muted, 'Audio');
}

function muteLocalMedia(localMedia, muted, localMediaTypeString) {
    if (!localMedia) {
        return;
    }

    const method = muted ? 'mute' : 'unmute';

    localMedia[method]().catch(reason => {
        logger.warn(`${localMediaTypeString} ${method} was rejected:`, reason);
    });
}

/**
 * Mute or unmute local video stream if it exists.
 * @param {boolean} muted if video stream should be muted or unmuted.
 */
function muteLocalVideo(muted) {
    muteLocalMedia(localVideo, muted, 'Video');
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

/**
 * Create local tracks of specified types.
 * @param {Object} options
 * @param {string[]} options.devices - required track types
 *      ('audio', 'video' etc.)
 * @param {string|null} (options.cameraDeviceId) - camera device id, if
 *      undefined - one from settings will be used
 * @param {string|null} (options.micDeviceId) - microphone device id, if
 *      undefined - one from settings will be used
 * @param {boolean} (checkForPermissionPrompt) - if lib-jitsi-meet should check
 *      for gUM permission prompt
 * @returns {Promise<JitsiLocalTrack[]>}
 */
function createLocalTracks(options, checkForPermissionPrompt) {
    options || (options = {});

    return JitsiMeetJS
        .createLocalTracks({
            // copy array to avoid mutations inside library
            devices: options.devices.slice(0),
            resolution: config.resolution,
            cameraDeviceId: typeof options.cameraDeviceId === 'undefined' ||
                    options.cameraDeviceId === null
                ? APP.settings.getCameraDeviceId()
                : options.cameraDeviceId,
            micDeviceId: typeof options.micDeviceId === 'undefined' ||
                    options.micDeviceId === null
                ? APP.settings.getMicDeviceId()
                : options.micDeviceId,
            // adds any ff fake device settings if any
            firefox_fake_device: config.firefox_fake_device,
            desktopSharingExtensionExternalInstallation:
                options.desktopSharingExtensionExternalInstallation
        }, checkForPermissionPrompt).then( (tracks) => {
            tracks.forEach((track) => {
                track.on(TrackEvents.NO_DATA_FROM_SOURCE,
                    APP.UI.showTrackNotWorkingDialog.bind(null, track));
            });
            return tracks;
        }).catch(function (err) {
            logger.error(
                'failed to create local tracks', options.devices, err);
            return Promise.reject(err);
        });
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
            {
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
    isModerator: false,
    audioMuted: false,
    videoMuted: false,
    isSharingScreen: false,
    isDesktopSharingEnabled: false,
    /*
     * Whether the local "raisedHand" flag is on.
     */
    isHandRaised: false,
    /*
     * Whether the local participant is the dominant speaker in the conference.
     */
    isDominantSpeaker: false,
    /**
     * Open new connection and join to the conference.
     * @param {object} options
     * @param {string} roomName name of the conference
     * @returns {Promise}
     */
    init(options) {
        this.roomName = options.roomName;
        // attaches global error handler, if there is already one, respect it
        if(JitsiMeetJS.getGlobalOnErrorHandler){
            var oldOnErrorHandler = window.onerror;
            window.onerror = function (message, source, lineno, colno, error) {
                JitsiMeetJS.getGlobalOnErrorHandler(
                    message, source, lineno, colno, error);

                if(oldOnErrorHandler)
                    oldOnErrorHandler(message, source, lineno, colno, error);
            };

            var oldOnUnhandledRejection = window.onunhandledrejection;
            window.onunhandledrejection = function(event) {

            JitsiMeetJS.getGlobalOnErrorHandler(
                    null, null, null, null, event.reason);

                if(oldOnUnhandledRejection)
                    oldOnUnhandledRejection(event);
            };
        }

        return JitsiMeetJS.init(
            Object.assign(
                {enableAnalyticsLogging: analytics.isEnabled()}, config)
            ).then(() => {
                analytics.init();
                return createInitialLocalTracksAndConnect(options.roomName);
            }).then(([tracks, con]) => {
                tracks.forEach(track => {
                    if((track.isAudioTrack() && initialAudioMutedState)
                        || (track.isVideoTrack() && initialVideoMutedState)) {
                        track.mute();
                    }
                });
                logger.log('initialized with %s local tracks', tracks.length);
                con.addEventListener(
                    ConnectionEvents.CONNECTION_FAILED,
                    _connectionFailedHandler);
                APP.connection = connection = con;
                this.isDesktopSharingEnabled =
                    JitsiMeetJS.isDesktopSharingEnabled();
                eventEmitter.emit(
                    JitsiMeetConferenceEvents.DESKTOP_SHARING_ENABLED_CHANGED,
                    this.isDesktopSharingEnabled);

                APP.store.dispatch(showDesktopSharingButton());

                this._createRoom(tracks);
                APP.remoteControl.init();

                if (UIUtil.isButtonEnabled('contacts')
                    && !interfaceConfig.filmStripOnly) {
                    APP.UI.ContactList = new ContactList(room);
                }

                // if user didn't give access to mic or camera or doesn't have
                // them at all, we disable corresponding toolbar buttons
                if (!tracks.find((t) => t.isAudioTrack())) {
                    APP.UI.setMicrophoneButtonEnabled(false);
                }

                if (!tracks.find((t) => t.isVideoTrack())) {
                    APP.UI.setCameraButtonEnabled(false);
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
     * Simulates toolbar button click for audio mute. Used by shortcuts and API.
     * @param mute true for mute and false for unmute.
     */
    muteAudio(mute) {
        muteLocalAudio(mute);
    },
    /**
     * Returns whether local audio is muted or not.
     * @returns {boolean}
     */
    isLocalAudioMuted() {
        return this.audioMuted;
    },
    /**
     * Simulates toolbar button click for audio mute. Used by shortcuts
     * and API.
     * @param {boolean} force - If the track is not created, the operation
     * will be executed after the track is created. Otherwise the operation
     * will be ignored.
     */
    toggleAudioMuted(force = false) {
        if(!localAudio && force) {
            initialAudioMutedState = !initialAudioMutedState;
            return;
        }
        this.muteAudio(!this.audioMuted);
    },
    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     * @param mute true for mute and false for unmute.
     */
    muteVideo(mute) {
        muteLocalVideo(mute);
    },
    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     * @param {boolean} force - If the track is not created, the operation
     * will be executed after the track is created. Otherwise the operation
     * will be ignored.
     */
    toggleVideoMuted(force = false) {
        if(!localVideo && force) {
            initialVideoMutedState = !initialVideoMutedState;
            return;
        }
        this.muteVideo(!this.videoMuted);
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
        if(config.enableRecording && !config.recordingType) {
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
            replaceLocalTrack(localVideo, newStream, room))
            .then(() => {
                localVideo = newStream;
                if (newStream) {
                    this.videoMuted = newStream.isMuted();
                    this.isSharingScreen = newStream.videoType === 'desktop';

                    APP.UI.addLocalStream(newStream);

                    newStream.videoType === 'camera'
                        && APP.UI.setCameraButtonEnabled(true);
                } else {
                    this.videoMuted = false;
                    this.isSharingScreen = false;
                }
                APP.UI.setVideoMuted(this.getMyUserId(), this.videoMuted);
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
            replaceLocalTrack(localAudio, newStream, room))
            .then(() => {
                localAudio = newStream;
                if (newStream) {
                    this.audioMuted = newStream.isMuted();
                    APP.UI.addLocalStream(newStream);
                } else {
                    this.audioMuted = false;
                }
                APP.UI.setMicrophoneButtonEnabled(true);
                APP.UI.setAudioMuted(this.getMyUserId(), this.audioMuted);
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
        let tooltipElementId = null;

        switch (featureName) {
        case 'screenShare':
            tooltipElementId = '#screenshareWhileAudioOnly';
            break;
        case 'videoMute':
            tooltipElementId = '#unmuteWhileAudioOnly';
            break;
        }

        if (tooltipElementId) {
            APP.UI.showToolbar(6000);
            APP.UI.showCustomToolbarPopup(
                tooltipElementId, true, 5000);
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
     * Toggles between screensharing and camera video.
     * @param {boolean} [shareScreen]
     * @return {Promise.<T>}
     */
    toggleScreenSharing(shareScreen = !this.isSharingScreen) {
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

        this.videoSwitchInProgress = true;
        let externalInstallation = false;

        if (shareScreen) {
            return createLocalTracks({
                devices: ['desktop'],
                desktopSharingExtensionExternalInstallation: {
                    interval: 500,
                    checkAgain: () => {
                        return DSExternalInstallationInProgress;
                    },
                    listener: (status, url) => {
                        switch(status) {
                            case "waitingForExtension":
                                DSExternalInstallationInProgress = true;
                                externalInstallation = true;
                                APP.UI.showExtensionExternalInstallationDialog(
                                    url);
                                break;
                            case "extensionFound":
                                if(externalInstallation) //close the dialog
                                    $.prompt.close();
                                break;
                            default:
                                //Unknown status
                        }
                    }
                }
            }).then(([stream]) => {
                DSExternalInstallationInProgress = false;
                // close external installation dialog on success.
                if(externalInstallation)
                    $.prompt.close();
                stream.on(
                    TrackEvents.LOCAL_TRACK_STOPPED,
                    () => {
                        // if stream was stopped during screensharing session
                        // then we should switch to video
                        // otherwise we stopped it because we already switched
                        // to video, so nothing to do here
                        if (this.isSharingScreen) {
                            this.toggleScreenSharing(false);
                        }
                    }
                );
                return this.useVideoStream(stream);
            }).then(() => {
                this.videoSwitchInProgress = false;
                JitsiMeetJS.analytics.sendEvent(
                    'conference.sharingDesktop.start');
                logger.log('sharing local desktop');
            }).catch((err) => {
                // close external installation dialog to show the error.
                if(externalInstallation)
                    $.prompt.close();
                this.videoSwitchInProgress = false;
                this.toggleScreenSharing(false);

                if (err.name === TrackErrors.CHROME_EXTENSION_USER_CANCELED) {
                    return;
                }

                logger.error('failed to share local desktop', err);

                if (err.name === TrackErrors.FIREFOX_EXTENSION_NEEDED) {
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

                if (err.name === TrackErrors.PERMISSION_DENIED) {
                    dialogTxt = APP.translation.generateTranslationHTML(
                        "dialog.screenSharingPermissionDeniedError");
                    dialogTitleKey = "dialog.error";
                } else {
                    dialogTxt = APP.translation.generateTranslationHTML(
                        "dialog.failtoinstall");
                    dialogTitleKey = "dialog.permissionDenied";
                }

                APP.UI.messageHandler.openDialog(
                    dialogTitleKey, dialogTxt, false);
            });
        } else {
            APP.remoteControl.receiver.stop();
            return createLocalTracks(
                { devices: ['video'] })
            .then(
                ([stream]) => this.useVideoStream(stream)
            ).then(() => {
                this.videoSwitchInProgress = false;
                JitsiMeetJS.analytics.sendEvent(
                    'conference.sharingDesktop.stop');
                logger.log('sharing local video');
            }).catch((err) => {
                this.useVideoStream(null);
                this.videoSwitchInProgress = false;
                logger.error('failed to share local video', err);
            });
        }
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

            updateRemoteThumbnailsVisibility();
        });
        room.on(ConferenceEvents.USER_LEFT, (id, user) => {
            APP.store.dispatch(participantLeft(id, user));
            logger.log('USER %s LEFT', id, user);
            APP.API.notifyUserLeft(id);
            APP.UI.removeUser(id, user.getDisplayName());
            APP.UI.onSharedVideoStop(id);

            updateRemoteThumbnailsVisibility();
        });

        room.on(ConferenceEvents.USER_STATUS_CHANGED, (id, status) => {
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
            if(!track || track.isLocal())
                return;

            APP.store.dispatch(trackAdded(track));
        });

        room.on(ConferenceEvents.TRACK_REMOVED, (track) => {
            if(!track || track.isLocal())
                return;

            APP.store.dispatch(trackRemoved(track));
        });

        room.on(ConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED, (id, lvl) => {
            if(this.isLocalId(id) && localAudio && localAudio.isMuted()) {
                lvl = 0;
            }

            if(config.debug)
            {
                this.audioLevelsMap[id] = lvl;
                if(config.debugAudioLevels)
                    logger.log("AudioLevel:" + id + "/" + lvl);
            }

            APP.UI.setAudioLevel(id, lvl);
        });

        room.on(ConferenceEvents.TALK_WHILE_MUTED, () => {
            APP.UI.showToolbar(6000);

            APP.UI.showCustomToolbarPopup('#talkWhileMutedPopup', true, 5000);
        });

        room.on(
            ConferenceEvents.LAST_N_ENDPOINTS_CHANGED,
            (leavingIds, enteringIds) => {
                APP.UI.handleLastNEndpoints(leavingIds, enteringIds);
        });

        room.on(
            ConferenceEvents.PARTICIPANT_CONN_STATUS_CHANGED,
            id => {
                APP.UI.participantConnectionStatusChanged(id);
        });
        room.on(ConferenceEvents.DOMINANT_SPEAKER_CHANGED, (id) => {
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

            APP.UI.addListener(UIEvents.PINNED_ENDPOINT,
            (smallVideo, isPinned) => {
                let smallVideoId = smallVideo.getId();
                let isLocal = APP.conference.isLocalId(smallVideoId);

                let eventName
                    = (isPinned ? "pinned" : "unpinned") + "." +
                            (isLocal ? "local" : "remote");
                let participantCount = room.getParticipantCount();
                JitsiMeetJS.analytics.sendEvent(
                        eventName,
                        { value: participantCount });

                // FIXME why VIDEO_CONTAINER_TYPE instead of checking if
                // the participant is on the large video ?
                if (smallVideo.getVideoType() === VIDEO_CONTAINER_TYPE
                    && !isLocal) {

                    // When the library starts supporting multiple pins we
                    // would pass the isPinned parameter together with the
                    // identifier, but currently we send null to indicate that
                    // we unpin the last pinned.
                    try {
                        room.pinParticipant(isPinned ? smallVideoId : null);
                    } catch (e) {
                        reportError(e);
                    }
                }

                updateRemoteThumbnailsVisibility();
            });
        }

        room.on(ConferenceEvents.CONNECTION_INTERRUPTED, () => {
            APP.UI.showLocalConnectionInterrupted(true);
        });

        room.on(ConferenceEvents.CONNECTION_RESTORED, () => {
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

        room.on(ConferenceEvents.PARTICIPANT_PROPERTY_CHANGED,
                (participant, name, oldValue, newValue) => {
            if (name === "raisedHand") {
                APP.UI.setRaisedHandStatus(participant, newValue);
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
            if (localVideo) {
                localVideo.dispose();
            }
            // stop local audio
            if (localAudio) {
                localAudio.dispose();
            }
        });

        room.on(ConferenceEvents.DTMF_SUPPORT_CHANGED, (isDTMFSupported) => {
            APP.UI.updateDTMFSupport(isDTMFSupported);
        });

        APP.UI.addListener(UIEvents.EXTERNAL_INSTALLATION_CANCELED, () => {
            // Wait a little bit more just to be sure that we won't miss the
            // extension installation
            setTimeout(() => DSExternalInstallationInProgress = false, 500);
        });
        APP.UI.addListener(UIEvents.OPEN_EXTENSION_STORE, (url) => {
            window.open(
                url, "extension_store_window",
                "resizable,scrollbars=yes,status=1");
        });

        APP.UI.addListener(UIEvents.AUDIO_MUTED, muteLocalAudio);
        APP.UI.addListener(UIEvents.VIDEO_MUTED, muted => {
            if (this.isAudioOnly() && !muted) {
                this._displayAudioOnlyTooltip('videoMute');
                return;
            }

            muteLocalVideo(muted);
        });

        room.on(ConnectionQualityEvents.LOCAL_STATS_UPDATED,
            (stats) => {
                APP.UI.updateLocalStats(stats.connectionQuality, stats);

        });

        room.on(ConnectionQualityEvents.REMOTE_STATS_UPDATED,
            (id, stats) => {
                APP.UI.updateRemoteStats(id, stats.connectionQuality, stats);
        });

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
                createLocalTracks({
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
                    APP.UI.showDeviceErrorDialog(null, err);
                });
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_DEVICE_CHANGED,
            (micDeviceId) => {
                JitsiMeetJS.analytics.sendEvent(
                    'settings.changeDevice.audioIn');
                createLocalTracks({
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
                    APP.UI.showDeviceErrorDialog(err, null);
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
            muteLocalVideo(audioOnly);

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

            updateRemoteThumbnailsVisibility();
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

        function updateRemoteThumbnailsVisibility() {
            const localUserId = APP.conference.getMyUserId();
            const remoteParticipantsCount = room.getParticipantCount() - 1;

            // Get the remote thumbnail count for cases where there are
            // non-participants displaying video, such as with video sharing.
            const remoteVideosCount = APP.UI.getRemoteVideosCount();

            const shouldShowRemoteThumbnails = interfaceConfig.filmStripOnly
                || (APP.UI.isPinned(localUserId) && remoteVideosCount)
                || remoteVideosCount > 1
                || remoteParticipantsCount !== remoteVideosCount;

            APP.UI.setRemoteThumbnailsVisibility(
                Boolean(shouldShowRemoteThumbnails));
        }
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
        if (JitsiMeetJS.mediaDevices.isDeviceListAvailable() &&
            JitsiMeetJS.mediaDevices.isDeviceChangeAvailable()) {
            JitsiMeetJS.mediaDevices.enumerateDevices(devices => {
                // Ugly way to synchronize real device IDs with local
                // storage and settings menu. This is a workaround until
                // getConstraints() method will be implemented in browsers.
                if (localAudio) {
                    APP.settings.setMicDeviceId(
                        localAudio.getDeviceId(), false);
                }

                if (localVideo) {
                    APP.settings.setCameraDeviceId(
                        localVideo.getDeviceId(), false);
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
                devices, this.isSharingScreen, localVideo, localAudio);
        let promises = [];
        let audioWasMuted = this.audioMuted;
        let videoWasMuted = this.videoMuted;
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
                    createLocalTracks,
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
                    if (videoWasMuted ||
                        currentDevices.videoinput.length >
                        availableVideoInputDevices.length) {
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
        if(JitsiMeetJS.analytics) {
            JitsiMeetJS.analytics.sendEvent(name, {value, label});
        }
        if(room) {
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

        let requestFeedbackPromise = requestFeedback
                ? APP.UI.requestFeedbackOnHangup()
                // false - because the thank you dialog shouldn't be displayed
                    .catch(() => Promise.resolve(false))
                : Promise.resolve(true);// true - because the thank you dialog
                //should be displayed
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
        return localVideo.sourceId;
    }
};
