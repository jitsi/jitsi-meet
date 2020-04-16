/* global $, APP, JitsiMeetJS, config, interfaceConfig */

import { openConnection } from './connection';

import { ENDPOINT_TEXT_MESSAGE_NAME } from './modules/API/constants';
import AuthHandler from './modules/UI/authentication/AuthHandler';
import Recorder from './modules/recorder/Recorder';

import mediaDeviceHelper from './modules/devices/mediaDeviceHelper';

import * as RemoteControlEvents
    from './service/remotecontrol/RemoteControlEvents';
import UIEvents from './service/UI/UIEvents';
import UIUtil from './modules/UI/util/UIUtil';
import { createTaskQueue } from './modules/util/helpers';
import * as JitsiMeetConferenceEvents from './ConferenceEvents';

import {
    createDeviceChangedEvent,
    createStartSilentEvent,
    createScreenSharingEvent,
    createStreamSwitchDelayEvent,
    createTrackMutedEvent,
    sendAnalytics
} from './react/features/analytics';
import {
    maybeRedirectToWelcomePage,
    redirectToStaticPage,
    reloadWithStoredParams
} from './react/features/app';

import EventEmitter from 'events';

import {
    AVATAR_ID_COMMAND,
    AVATAR_URL_COMMAND,
    EMAIL_COMMAND,
    authStatusChanged,
    commonUserJoinedHandling,
    commonUserLeftHandling,
    conferenceFailed,
    conferenceJoined,
    conferenceLeft,
    conferenceSubjectChanged,
    conferenceTimestampChanged,
    conferenceWillJoin,
    conferenceWillLeave,
    dataChannelOpened,
    kickedOut,
    lockStateChanged,
    onStartMutedPolicyChanged,
    p2pStatusChanged,
    sendLocalParticipant,
    setDesktopSharingEnabled
} from './react/features/base/conference';
import {
    checkAndNotifyForNewDevice,
    getAvailableDevices,
    notifyCameraError,
    notifyMicError,
    setAudioOutputDeviceId,
    updateDeviceList
} from './react/features/base/devices';
import {
    isFatalJitsiConnectionError,
    JitsiConferenceErrors,
    JitsiConferenceEvents,
    JitsiConnectionErrors,
    JitsiConnectionEvents,
    JitsiMediaDevicesEvents,
    JitsiParticipantConnectionStatus,
    JitsiTrackErrors,
    JitsiTrackEvents
} from './react/features/base/lib-jitsi-meet';
import {
    isVideoMutedByUser,
    MEDIA_TYPE,
    setAudioAvailable,
    setAudioMuted,
    setVideoAvailable,
    setVideoMuted
} from './react/features/base/media';
import { showNotification } from './react/features/notifications';
import {
    dominantSpeakerChanged,
    getLocalParticipant,
    getNormalizedDisplayName,
    getParticipantById,
    localParticipantConnectionStatusChanged,
    localParticipantRoleChanged,
    participantConnectionStatusChanged,
    participantKicked,
    participantMutedUs,
    participantPresenceChanged,
    participantRoleChanged,
    participantUpdated
} from './react/features/base/participants';
import {
    getUserSelectedCameraDeviceId,
    updateSettings
} from './react/features/base/settings';
import {
    createLocalPresenterTrack,
    createLocalTracksF,
    destroyLocalTracks,
    isLocalVideoTrackMuted,
    isLocalTrackMuted,
    isUserInteractionRequiredForUnmute,
    replaceLocalTrack,
    trackAdded,
    trackRemoved
} from './react/features/base/tracks';
import { getJitsiMeetGlobalNS } from './react/features/base/util';
import { showDesktopPicker } from './react/features/desktop-picker';
import { appendSuffix } from './react/features/display-name';
import {
    maybeOpenFeedbackDialog,
    submitFeedback
} from './react/features/feedback';
import { mediaPermissionPromptVisibilityChanged } from './react/features/overlay';
import { suspendDetected } from './react/features/power-monitor';
import { setSharedVideoStatus } from './react/features/shared-video';
import { AudioMixerEffect } from './react/features/stream-effects/audio-mixer/AudioMixerEffect';
import { createPresenterEffect } from './react/features/stream-effects/presenter';
import { endpointMessageReceived } from './react/features/subtitles';
import { createRnnoiseProcessorPromise } from './react/features/rnnoise';
import { toggleScreenshotCaptureEffect } from './react/features/screenshot-capture';

const logger = require('jitsi-meet-logger').getLogger(__filename);

const eventEmitter = new EventEmitter();

let room;
let connection;

/**
 * This promise is used for chaining mutePresenterVideo calls in order to avoid  calling GUM multiple times if it takes
 * a while to finish.
 *
 * @type {Promise<void>}
 * @private
 */
let _prevMutePresenterVideo = Promise.resolve();

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
    CUSTOM_ROLE: 'custom-role',
    EMAIL: EMAIL_COMMAND,
    ETHERPAD: 'etherpad',
    SHARED_VIDEO: 'shared-video'
};

/**
 * Open Connection. When authentication failed it shows auth dialog.
 * @param roomName the room name to use
 * @returns Promise<JitsiConnection>
 */
function connect(roomName) {
    return openConnection({
        retry: true,
        roomName
    })
    .catch(err => {
        if (err === JitsiConnectionErrors.PASSWORD_REQUIRED) {
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
    room.sendCommand(command, { value });
}

/**
 * Get user nickname by user id.
 * @param {string} id user id
 * @returns {string?} user nickname or undefined if user is unknown.
 */
function getDisplayName(id) {
    const participant = getParticipantById(APP.store.getState(), id);

    return participant && participant.name;
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
 * A queue for the async replaceLocalTrack action so that multiple audio
 * replacements cannot happen simultaneously. This solves the issue where
 * replaceLocalTrack is called multiple times with an oldTrack of null, causing
 * multiple local tracks of the same type to be used.
 *
 * @private
 * @type {Object}
 */
const _replaceLocalAudioTrackQueue = createTaskQueue();

/**
 * A task queue for replacement local video tracks. This separate queue exists
 * so video replacement is not blocked by audio replacement tasks in the queue
 * {@link _replaceLocalAudioTrackQueue}.
 *
 * @private
 * @type {Object}
 */
const _replaceLocalVideoTrackQueue = createTaskQueue();

/**
 *
 */
class ConferenceConnector {
    /**
     *
     */
    constructor(resolve, reject) {
        this._resolve = resolve;
        this._reject = reject;
        this.reconnectTimeout = null;
        room.on(JitsiConferenceEvents.CONFERENCE_JOINED,
            this._handleConferenceJoined.bind(this));
        room.on(JitsiConferenceEvents.CONFERENCE_FAILED,
            this._onConferenceFailed.bind(this));
    }

    /**
     *
     */
    _handleConferenceFailed(err) {
        this._unsubscribe();
        this._reject(err);
    }

    /**
     *
     */
    _onConferenceFailed(err, ...params) {
        APP.store.dispatch(conferenceFailed(room, err, ...params));
        logger.error('CONFERENCE FAILED:', err, ...params);

        switch (err) {
        case JitsiConferenceErrors.CONNECTION_ERROR: {
            const [ msg ] = params;

            APP.UI.notifyConnectionFailed(msg);
            break;
        }

        case JitsiConferenceErrors.NOT_ALLOWED_ERROR: {
            // let's show some auth not allowed page
            APP.store.dispatch(redirectToStaticPage('static/authError.html'));
            break;
        }

        // not enough rights to create conference
        case JitsiConferenceErrors.AUTHENTICATION_REQUIRED: {
            // Schedule reconnect to check if someone else created the room.
            this.reconnectTimeout = setTimeout(() => {
                APP.store.dispatch(conferenceWillJoin(room));
                room.join();
            }, 5000);

            const { password }
                = APP.store.getState()['features/base/conference'];

            AuthHandler.requireAuth(room, password);

            break;
        }

        case JitsiConferenceErrors.RESERVATION_ERROR: {
            const [ code, msg ] = params;

            APP.UI.notifyReservationError(code, msg);
            break;
        }

        case JitsiConferenceErrors.GRACEFUL_SHUTDOWN:
            APP.UI.notifyGracefulShutdown();
            break;

        case JitsiConferenceErrors.CONFERENCE_DESTROYED: {
            const [ reason ] = params;

            APP.UI.hideStats();
            APP.UI.notifyConferenceDestroyed(reason);
            break;
        }

        // FIXME FOCUS_DISCONNECTED is a confusing event name.
        // What really happens there is that the library is not ready yet,
        // because Jicofo is not available, but it is going to give it another
        // try.
        case JitsiConferenceErrors.FOCUS_DISCONNECTED: {
            const [ focus, retrySec ] = params;

            APP.UI.notifyFocusDisconnected(focus, retrySec);
            break;
        }

        case JitsiConferenceErrors.FOCUS_LEFT:
        case JitsiConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE:
        case JitsiConferenceErrors.OFFER_ANSWER_FAILED:
            APP.store.dispatch(conferenceWillLeave(room));

            // FIXME the conference should be stopped by the library and not by
            // the app. Both the errors above are unrecoverable from the library
            // perspective.
            room.leave().then(() => connection.disconnect());
            break;

        case JitsiConferenceErrors.CONFERENCE_MAX_USERS:
            connection.disconnect();
            APP.UI.notifyMaxUsersLimitReached();
            break;

        case JitsiConferenceErrors.INCOMPATIBLE_SERVER_VERSIONS:
            APP.store.dispatch(reloadWithStoredParams());
            break;

        default:
            this._handleConferenceFailed(err, ...params);
        }
    }

    /**
     *
     */
    _unsubscribe() {
        room.off(
            JitsiConferenceEvents.CONFERENCE_JOINED,
            this._handleConferenceJoined);
        room.off(
            JitsiConferenceEvents.CONFERENCE_FAILED,
            this._onConferenceFailed);
        if (this.reconnectTimeout !== null) {
            clearTimeout(this.reconnectTimeout);
        }
        AuthHandler.closeAuth();
    }

    /**
     *
     */
    _handleConferenceJoined() {
        this._unsubscribe();
        this._resolve();
    }

    /**
     *
     */
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
    const onDisconnected = () => {
        APP.API.notifyConferenceLeft(APP.conference.roomName);

        return Promise.resolve();
    };

    return connection.disconnect().then(onDisconnected, onDisconnected);
}

/**
 * Handles CONNECTION_FAILED events from lib-jitsi-meet.
 *
 * @param {JitsiConnectionError} error - The reported error.
 * @returns {void}
 * @private
 */
function _connectionFailedHandler(error) {
    if (isFatalJitsiConnectionError(error)) {
        APP.connection.removeEventListener(
            JitsiConnectionEvents.CONNECTION_FAILED,
            _connectionFailedHandler);
        if (room) {
            APP.store.dispatch(conferenceWillLeave(room));
            room.leave();
        }
    }
}

export default {
    /**
     * Flag used to delay modification of the muted status of local media tracks
     * until those are created (or not, but at that point it's certain that
     * the tracks won't exist).
     */
    _localTracksInitialized: false,
    isSharingScreen: false,

    /**
     * Indicates if the desktop sharing functionality has been enabled.
     * It takes into consideration the status returned by
     * {@link JitsiMeetJS.isDesktopSharingEnabled()}. The latter can be false
     * either if the desktop sharing is not supported by the current browser
     * or if it was disabled through lib-jitsi-meet specific options (check
     * config.js for listed options).
     */
    isDesktopSharingEnabled: false,

    /**
     * The local audio track (if any).
     * FIXME tracks from redux store should be the single source of truth
     * @type {JitsiLocalTrack|null}
     */
    localAudio: null,

    /**
     * The local presenter video track (if any).
     * @type {JitsiLocalTrack|null}
     */
    localPresenterVideo: null,

    /**
     * The local video track (if any).
     * FIXME tracks from redux store should be the single source of truth, but
     * more refactoring is required around screen sharing ('localVideo' usages).
     * @type {JitsiLocalTrack|null}
     */
    localVideo: null,

    /**
     * The key used for End-To-End Encryption.
     */
    e2eeKey: undefined,

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
        const initialDevices = [ 'audio' ];
        const requestedAudio = true;
        let requestedVideo = false;

        // Always get a handle on the audio input device so that we have statistics even if the user joins the
        // conference muted. Previous implementation would only acquire the handle when the user first unmuted,
        // which would results in statistics ( such as "No audio input" or "Are you trying to speak?") being available
        // only after that point.
        if (options.startWithAudioMuted) {
            this.muteAudio(true, true);
        }

        if (!options.startWithVideoMuted
                && !options.startAudioOnly
                && !options.startScreenSharing) {
            initialDevices.push('video');
            requestedVideo = true;
        }

        JitsiMeetJS.mediaDevices.addEventListener(
            JitsiMediaDevicesEvents.PERMISSION_PROMPT_IS_SHOWN,
            browser =>
                APP.store.dispatch(
                    mediaPermissionPromptVisibilityChanged(true, browser))
        );

        let tryCreateLocalTracks;

        // FIXME is there any simpler way to rewrite this spaghetti below ?
        if (options.startScreenSharing) {
            tryCreateLocalTracks = this._createDesktopTrack()
                .then(desktopStream => {
                    if (!requestedAudio) {
                        return [ desktopStream ];
                    }

                    return createLocalTracksF({ devices: [ 'audio' ] }, true)
                        .then(([ audioStream ]) =>
                            [ desktopStream, audioStream ])
                        .catch(error => {
                            audioOnlyError = error;

                            return [ desktopStream ];
                        });
                })
                .catch(error => {
                    logger.error('Failed to obtain desktop stream', error);
                    screenSharingError = error;

                    return requestedAudio
                        ? createLocalTracksF({ devices: [ 'audio' ] }, true)
                        : [];
                })
                .catch(error => {
                    audioOnlyError = error;

                    return [];
                });
        } else if (!requestedAudio && !requestedVideo) {
            // Resolve with no tracks
            tryCreateLocalTracks = Promise.resolve([]);
        } else {
            tryCreateLocalTracks = createLocalTracksF({ devices: initialDevices }, true)
                .catch(err => {
                    if (requestedAudio && requestedVideo) {

                        // Try audio only...
                        audioAndVideoError = err;

                        return (
                            createLocalTracksF({ devices: [ 'audio' ] }, true));
                    } else if (requestedAudio && !requestedVideo) {
                        audioOnlyError = err;

                        return [];
                    } else if (requestedVideo && !requestedAudio) {
                        videoOnlyError = err;

                        return [];
                    }
                    logger.error('Should never happen');
                })
                .catch(err => {
                    // Log this just in case...
                    if (!requestedAudio) {
                        logger.error('The impossible just happened', err);
                    }
                    audioOnlyError = err;

                    // Try video only...
                    return requestedVideo
                        ? createLocalTracksF({ devices: [ 'video' ] }, true)
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

        // Hide the permissions prompt/overlay as soon as the tracks are
        // created. Don't wait for the connection to be made, since in some
        // cases, when auth is rquired, for instance, that won't happen until
        // the user inputs their credentials, but the dialog would be
        // overshadowed by the overlay.
        tryCreateLocalTracks.then(() =>
            APP.store.dispatch(mediaPermissionPromptVisibilityChanged(false)));

        return Promise.all([ tryCreateLocalTracks, connect(roomName) ])
            .then(([ tracks, con ]) => {
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
                        APP.store.dispatch(notifyMicError(audioOnlyError));
                        APP.store.dispatch(notifyCameraError(videoOnlyError));
                    } else {
                        // If request for 'audio' + 'video' failed, but request
                        // for 'audio' only was OK, we assume that we had
                        // problems with camera and show corresponding dialog.
                        APP.store.dispatch(
                            notifyCameraError(audioAndVideoError));
                    }
                }

                return [ tracks, con ];
            });
    },

    /**
     * Open new connection and join to the conference.
     * @param {object} options
     * @param {string} roomName - The name of the conference.
     * @returns {Promise}
     */
    init(options) {
        this.roomName = options.roomName;

        window.addEventListener('hashchange', this.onHashChange.bind(this), false);

        return (

            // Initialize the device list first. This way, when creating tracks
            // based on preferred devices, loose label matching can be done in
            // cases where the exact ID match is no longer available, such as
            // when the camera device has switched USB ports.
            // when in startSilent mode we want to start with audio muted
            this._initDeviceList()
                .catch(error => logger.warn(
                    'initial device list initialization failed', error))
                .then(() => this.createInitialLocalTracksAndConnect(
                options.roomName, {
                    startAudioOnly: config.startAudioOnly,
                    startScreenSharing: config.startScreenSharing,
                    startWithAudioMuted: config.startWithAudioMuted
                    || config.startSilent
                    || isUserInteractionRequiredForUnmute(APP.store.getState()),
                    startWithVideoMuted: config.startWithVideoMuted
                    || isUserInteractionRequiredForUnmute(APP.store.getState())
                }))
            .then(([ tracks, con ]) => {
                tracks.forEach(track => {
                    if ((track.isAudioTrack() && this.isLocalAudioMuted())
                        || (track.isVideoTrack() && this.isLocalVideoMuted())) {
                        const mediaType = track.getType();

                        sendAnalytics(
                            createTrackMutedEvent(mediaType, 'initial mute'));
                        logger.log(`${mediaType} mute: initially muted.`);
                        track.mute();
                    }
                });
                logger.log(`initialized with ${tracks.length} local tracks`);
                this._localTracksInitialized = true;
                con.addEventListener(
                    JitsiConnectionEvents.CONNECTION_FAILED,
                    _connectionFailedHandler);
                APP.connection = connection = con;

                // Desktop sharing related stuff:
                this.isDesktopSharingEnabled
                    = JitsiMeetJS.isDesktopSharingEnabled();
                eventEmitter.emit(
                    JitsiMeetConferenceEvents.DESKTOP_SHARING_ENABLED_CHANGED,
                    this.isDesktopSharingEnabled);

                APP.store.dispatch(
                    setDesktopSharingEnabled(this.isDesktopSharingEnabled));

                this._createRoom(tracks);
                APP.remoteControl.init();

                // if user didn't give access to mic or camera or doesn't have
                // them at all, we mark corresponding toolbar buttons as muted,
                // so that the user can try unmute later on and add audio/video
                // to the conference
                if (!tracks.find(t => t.isAudioTrack())) {
                    this.setAudioMuteStatus(true);
                }

                if (!tracks.find(t => t.isVideoTrack())) {
                    this.setVideoMuteStatus(true);
                }

                // Initialize device list a second time to ensure device labels
                // get populated in case of an initial gUM acceptance; otherwise
                // they may remain as empty strings.
                this._initDeviceList(true);

                if (config.iAmRecorder) {
                    this.recorder = new Recorder();
                }

                if (config.startSilent) {
                    sendAnalytics(createStartSilentEvent());
                    APP.store.dispatch(showNotification({
                        descriptionKey: 'notify.startSilentDescription',
                        titleKey: 'notify.startSilentTitle'
                    }));
                }

                // XXX The API will take care of disconnecting from the XMPP
                // server (and, thus, leaving the room) on unload.
                return new Promise((resolve, reject) => {
                    (new ConferenceConnector(resolve, reject)).connect();
                });
            })
        );
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
            ? isLocalVideoTrackMuted(
                APP.store.getState()['features/base/tracks'])
            : isVideoMutedByUser(APP.store);
    },

    /**
     * Simulates toolbar button click for audio mute. Used by shortcuts and API.
     * @param {boolean} mute true for mute and false for unmute.
     * @param {boolean} [showUI] when set to false will not display any error
     * dialogs in case of media permissions error.
     */
    muteAudio(mute, showUI = true) {
        if (!mute
                && isUserInteractionRequiredForUnmute(APP.store.getState())) {
            logger.error('Unmuting audio requires user interaction');

            return;
        }

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
                showUI && APP.store.dispatch(notifyMicError(error));
            };

            createLocalTracksF({ devices: [ 'audio' ] }, false)
                .then(([ audioTrack ]) => audioTrack)
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
     * Simulates toolbar button click for presenter video mute. Used by
     * shortcuts and API.
     * @param mute true for mute and false for unmute.
     * @param {boolean} [showUI] when set to false will not display any error
     * dialogs in case of media permissions error.
     */
    async mutePresenter(mute, showUI = true) {
        const maybeShowErrorDialog = error => {
            showUI && APP.store.dispatch(notifyCameraError(error));
        };

        if (mute) {
            try {
                await this.localVideo.setEffect(undefined);
            } catch (err) {
                logger.error('Failed to remove the presenter effect', err);
                maybeShowErrorDialog(err);
            }
        } else {
            try {
                await this.localVideo.setEffect(await this._createPresenterStreamEffect());
            } catch (err) {
                logger.error('Failed to apply the presenter effect', err);
                maybeShowErrorDialog(err);
            }
        }
    },

    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     * @param mute true for mute and false for unmute.
     * @param {boolean} [showUI] when set to false will not display any error
     * dialogs in case of media permissions error.
     */
    muteVideo(mute, showUI = true) {
        if (!mute
                && isUserInteractionRequiredForUnmute(APP.store.getState())) {
            logger.error('Unmuting video requires user interaction');

            return;
        }

        if (this.isSharingScreen) {
            // Chain _mutePresenterVideo calls
            _prevMutePresenterVideo = _prevMutePresenterVideo.then(() => this._mutePresenterVideo(mute));

            return;
        }

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

        if (!this.localVideo && !mute) {
            const maybeShowErrorDialog = error => {
                showUI && APP.store.dispatch(notifyCameraError(error));
            };

            // Try to create local video if there wasn't any.
            // This handles the case when user joined with no video
            // (dismissed screen sharing screen or in audio only mode), but
            // decided to add it later on by clicking on muted video icon or
            // turning off the audio only mode.
            //
            // FIXME when local track creation is moved to react/redux
            // it should take care of the use case described above
            createLocalTracksF({ devices: [ 'video' ] }, false)
                .then(([ videoTrack ]) => videoTrack)
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
        const user = room.getParticipantById(id);

        return user && user.isModerator();
    },

    /**
     * Retrieve list of conference participants (without local user).
     * @returns {JitsiParticipant[]}
     *
     * NOTE: Used by jitsi-meet-torture!
     */
    listMembers() {
        return room.getParticipants();
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
        return room.sendFeedback(overallFeedback, detailedFeedback);
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
        return room.getConnectionTimes();
    },

    // used by torture currently
    isJoined() {
        return room && room.isJoined();
    },
    getConnectionState() {
        return room && room.getConnectionState();
    },

    /**
     * Obtains current P2P ICE connection state.
     * @return {string|null} ICE connection state or <tt>null</tt> if there's no
     * P2P connection
     */
    getP2PConnectionState() {
        return room && room.getP2PConnectionState();
    },

    /**
     * Starts P2P (for tests only)
     * @private
     */
    _startP2P() {
        try {
            room && room.startP2PSession();
        } catch (error) {
            logger.error('Start P2P failed', error);
            throw error;
        }
    },

    /**
     * Stops P2P (for tests only)
     * @private
     */
    _stopP2P() {
        try {
            room && room.stopP2PSession();
        } catch (error) {
            logger.error('Stop P2P failed', error);
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
        return room.isConnectionInterrupted();
    },

    /**
     * Obtains the local display name.
     * @returns {string|undefined}
     */
    getLocalDisplayName() {
        return getDisplayName(this.getMyUserId());
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
        const participant = this.getParticipantById(id);

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
        const displayName = getDisplayName(id);

        if (displayName) {
            return displayName;
        }
        if (APP.conference.isLocalId(id)) {
            return APP.translation.generateTranslationHTML(
                    interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);
        }

        return interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
    },

    getMyUserId() {
        return room && room.myUserId();
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
        return room.getParticipants()
            .filter(p => p.getTracks().length > 0)
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
        const logs = APP.conference.getLogs();
        const data = encodeURIComponent(JSON.stringify(logs, null, '  '));

        const elem = document.createElement('a');

        elem.download = filename;
        elem.href = `data:application/json;charset=utf-8,\n${data}`;
        elem.dataset.downloadurl
            = [ 'text/json', elem.download, elem.href ].join(':');
        elem.dispatchEvent(new MouseEvent('click', {
            view: window,
            bubbles: true,
            cancelable: false
        }));
    },

    /**
     * Handled location hash change events.
     */
    onHashChange() {
        const items = {};
        const parts = window.location.hash.substr(1).split('&');

        for (const part of parts) {
            const param = part.split('=');
            const key = param[0];

            if (!key) {
                continue; // eslint-disable-line no-continue
            }

            items[key] = param[1];
        }

        this.e2eeKey = items.e2eekey;

        logger.debug(`New E2EE key: ${this.e2eeKey}`);

        this._room.setE2EEKey(this.e2eeKey);
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
        addCommandListener() {
            // eslint-disable-next-line prefer-rest-params
            room.addCommandListener(...arguments);
        },

        /**
         * Removes command.
         * @param name {String} the name of the command.
         */
        removeCommand() {
            // eslint-disable-next-line prefer-rest-params
            room.removeCommand(...arguments);
        },

        /**
         * Sends command.
         * @param name {String} the name of the command.
         * @param values {Object} with keys and values that will be sent.
         */
        sendCommand() {
            // eslint-disable-next-line prefer-rest-params
            room.sendCommand(...arguments);
        },

        /**
         * Sends command one time.
         * @param name {String} the name of the command.
         * @param values {Object} with keys and values that will be sent.
         */
        sendCommandOnce() {
            // eslint-disable-next-line prefer-rest-params
            room.sendCommandOnce(...arguments);
        }
    },

    _createRoom(localTracks) {
        room
            = connection.initJitsiConference(
                APP.conference.roomName,
                this._getConferenceOptions());

        APP.store.dispatch(conferenceWillJoin(room));
        this._setLocalAudioVideoStreams(localTracks);
        this._room = room; // FIXME do not use this

        sendLocalParticipant(APP.store, room);

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
            }
            logger.error(
                    'Ignored not an audio nor a video track: ', track);

            return Promise.resolve();

        });
    },

    _getConferenceOptions() {
        const options = config;
        const { email, name: nick } = getLocalParticipant(APP.store.getState());

        const { locationURL } = APP.store.getState()['features/base/connection'];

        if (options.enableDisplayNameInStats && nick) {
            options.statisticsDisplayName = nick;
        }

        if (options.enableEmailInStats && email) {
            options.statisticsId = email;
        }

        options.applicationName = interfaceConfig.APP_NAME;
        options.getWiFiStatsMethod = this._getWiFiStatsMethod;
        options.confID = `${locationURL.host}${locationURL.pathname}`;
        options.createVADProcessor = createRnnoiseProcessorPromise;

        // Disable CallStats, if requessted.
        if (options.disableThirdPartyRequests) {
            delete options.callStatsID;
            delete options.callStatsSecret;
            delete options.getWiFiStatsMethod;
        }

        return options;
    },

    /**
     * Returns the result of getWiFiStats from the global NS or does nothing
     * (returns empty result).
     * Fixes a concurrency problem where we need to pass a function when creating
     * JitsiConference, but that method is added to the context later.
     *
     * @returns {Promise}
     * @private
     */
    _getWiFiStatsMethod() {
        const gloabalNS = getJitsiMeetGlobalNS();

        return gloabalNS.getWiFiStats ? gloabalNS.getWiFiStats() : Promise.resolve('{}');
    },

    /**
     * Start using provided video stream.
     * Stops previous video stream.
     * @param {JitsiLocalTrack} [stream] new stream to use or null
     * @returns {Promise}
     */
    useVideoStream(newStream) {
        return new Promise((resolve, reject) => {
            _replaceLocalVideoTrackQueue.enqueue(onFinish => {
                APP.store.dispatch(
                replaceLocalTrack(this.localVideo, newStream, room))
                    .then(() => {
                        this.localVideo = newStream;
                        this._setSharingScreen(newStream);
                        if (newStream) {
                            APP.UI.addLocalVideoStream(newStream);
                        }
                        this.setVideoMuteStatus(this.isLocalVideoMuted());
                    })
                    .then(resolve)
                    .catch(reject)
                    .then(onFinish);
            });
        });
    },

    /**
     * Sets `this.isSharingScreen` depending on provided video stream.
     * In case new screen sharing status is not equal previous one
     * it updates desktop sharing buttons in UI
     * and notifies external application.
     *
     * @param {JitsiLocalTrack} [newStream] new stream to use or null
     * @private
     * @returns {void}
     */
    _setSharingScreen(newStream) {
        const wasSharingScreen = this.isSharingScreen;

        this.isSharingScreen = newStream && newStream.videoType === 'desktop';

        if (wasSharingScreen !== this.isSharingScreen) {
            const details = {};

            if (this.isSharingScreen) {
                details.sourceType = newStream.sourceType;
            }

            APP.API.notifyScreenSharingStatusChanged(
                this.isSharingScreen, details);
        }
    },

    /**
     * Start using provided audio stream.
     * Stops previous audio stream.
     * @param {JitsiLocalTrack} [stream] new stream to use or null
     * @returns {Promise}
     */
    useAudioStream(newStream) {
        return new Promise((resolve, reject) => {
            _replaceLocalAudioTrackQueue.enqueue(onFinish => {
                APP.store.dispatch(
                replaceLocalTrack(this.localAudio, newStream, room))
                    .then(() => {
                        this.localAudio = newStream;
                        this.setAudioMuteStatus(this.isLocalAudioMuted());
                    })
                    .then(resolve)
                    .catch(reject)
                    .then(onFinish);
            });
        });
    },

    /**
     * Returns whether or not the conference is currently in audio only mode.
     *
     * @returns {boolean}
     */
    isAudioOnly() {
        return Boolean(APP.store.getState()['features/base/audio-only'].enabled);
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
    async _turnScreenSharingOff(didHaveVideo) {
        this._untoggleScreenSharing = null;
        this.videoSwitchInProgress = true;
        const { receiver } = APP.remoteControl;

        if (receiver) {
            receiver.stop();
        }

        this._stopProxyConnection();
        if (config.enableScreenshotCapture) {
            APP.store.dispatch(toggleScreenshotCaptureEffect(false));
        }

        // It can happen that presenter GUM is in progress while screensharing is being turned off. Here it needs to
        // wait for that GUM to be resolved in order to prevent leaking the presenter track(this.localPresenterVideo
        // will be null when SS is being turned off, but it will initialize once GUM resolves).
        let promise = _prevMutePresenterVideo = _prevMutePresenterVideo.then(() => {
            // mute the presenter track if it exists.
            if (this.localPresenterVideo) {
                APP.store.dispatch(setVideoMuted(true, MEDIA_TYPE.PRESENTER));

                return this.localPresenterVideo.dispose().then(() => {
                    APP.store.dispatch(trackRemoved(this.localPresenterVideo));
                    this.localPresenterVideo = null;
                });
            }
        });

        // If system audio was also shared stop the AudioMixerEffect and dispose of the desktop audio track.
        if (this._mixerEffect) {
            await this.localAudio.setEffect(undefined);
            await this._desktopAudioStream.dispose();
            this._mixerEffect = undefined;
            this._desktopAudioStream = undefined;

        // In case there was no local audio when screen sharing was started the fact that we set the audio stream to
        // null will take care of the desktop audio stream cleanup.
        } else if (this._desktopAudioStream) {
            await this.useAudioStream(null);
            this._desktopAudioStream = undefined;
        }

        if (didHaveVideo) {
            promise = promise.then(() => createLocalTracksF({ devices: [ 'video' ] }))
                .then(([ stream ]) => this.useVideoStream(stream))
                .then(() => {
                    sendAnalytics(createScreenSharingEvent('stopped'));
                    logger.log('Screen sharing stopped.');
                })
                .catch(error => {
                    logger.error('failed to switch back to local video', error);

                    return this.useVideoStream(null).then(() =>

                        // Still fail with the original err
                        Promise.reject(error)
                    );
                });
        } else {
            promise = promise.then(() => this.useVideoStream(null));
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
    async toggleScreenSharing(toggle = !this._untoggleScreenSharing, options = {}) {
        if (this.videoSwitchInProgress) {
            return Promise.reject('Switch in progress.');
        }
        if (!this.isDesktopSharingEnabled) {
            return Promise.reject(
                'Cannot toggle screen sharing: not supported.');
        }

        if (this.isAudioOnly()) {
            return Promise.reject('No screensharing in audio only mode');
        }

        if (toggle) {
            try {
                await this._switchToScreenSharing(options);

                return;
            } catch (err) {
                logger.error('Failed to switch to screensharing', err);

                return;
            }
        }

        return this._untoggleScreenSharing
            ? this._untoggleScreenSharing()
            : Promise.resolve();
    },

    /**
     * Creates desktop (screensharing) {@link JitsiLocalTrack}
     *
     * @param {Object} [options] - Screen sharing options that will be passed to
     * createLocalTracks.
     * @param {Object} [options.desktopSharing]
     * @param {Object} [options.desktopStream] - An existing desktop stream to
     * use instead of creating a new desktop stream.
     * @return {Promise.<JitsiLocalTrack>} - A Promise resolved with
     * {@link JitsiLocalTrack} for the screensharing or rejected with
     * {@link JitsiTrackError}.
     *
     * @private
     */
    _createDesktopTrack(options = {}) {
        let externalInstallation = false;
        let DSExternalInstallationInProgress = false;
        const didHaveVideo = !this.isLocalVideoMuted();

        const getDesktopStreamPromise = options.desktopStream
            ? Promise.resolve([ options.desktopStream ])
            : createLocalTracksF({
                desktopSharingSourceDevice: options.desktopSharingSources
                    ? null : config._desktopSharingSourceDevice,
                desktopSharingSources: options.desktopSharingSources,
                devices: [ 'desktop' ],
                desktopSharingExtensionExternalInstallation: {
                    interval: 500,
                    checkAgain: () => DSExternalInstallationInProgress,
                    listener: (status, url) => {
                        switch (status) {
                        case 'waitingForExtension': {
                            DSExternalInstallationInProgress = true;
                            externalInstallation = true;
                            const listener = () => {
                                // Wait a little bit more just to be sure that
                                // we won't miss the extension installation
                                setTimeout(() => {
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
                        case 'extensionFound':
                            // Close the dialog.
                            externalInstallation && $.prompt.close();
                            break;
                        default:

                            // Unknown status
                        }
                    }
                }
            });

        return getDesktopStreamPromise.then(desktopStreams => {
            // Stores the "untoggle" handler which remembers whether was
            // there any video before and whether was it muted.
            this._untoggleScreenSharing
                = this._turnScreenSharingOff.bind(this, didHaveVideo);

            const desktopVideoStream = desktopStreams.find(stream => stream.getType() === MEDIA_TYPE.VIDEO);

            if (desktopVideoStream) {
                desktopVideoStream.on(
                    JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                    () => {
                        // If the stream was stopped during screen sharing
                        // session then we should switch back to video.
                        this.isSharingScreen
                            && this._untoggleScreenSharing
                            && this._untoggleScreenSharing();
                    }
                );
            }

            // close external installation dialog on success.
            externalInstallation && $.prompt.close();

            return desktopStreams;
        }, error => {
            DSExternalInstallationInProgress = false;

            // close external installation dialog on success.
            externalInstallation && $.prompt.close();
            throw error;
        });
    },

    /**
     * Creates a new instance of presenter effect. A new video track is created
     * using the new set of constraints that are calculated based on
     * the height of the desktop that is being currently shared.
     *
     * @param {number} height - The height of the desktop stream that is being
     * currently shared.
     * @param {string} cameraDeviceId - The device id of the camera to be used.
     * @return {Promise<JitsiStreamPresenterEffect>} - A promise resolved with
     * {@link JitsiStreamPresenterEffect} if it succeeds.
     */
    async _createPresenterStreamEffect(height = null, cameraDeviceId = null) {
        if (!this.localPresenterVideo) {
            try {
                this.localPresenterVideo = await createLocalPresenterTrack({ cameraDeviceId }, height);
            } catch (err) {
                logger.error('Failed to create a camera track for presenter', err);

                return;
            }
            APP.store.dispatch(trackAdded(this.localPresenterVideo));
        }
        try {
            const effect = await createPresenterEffect(this.localPresenterVideo.stream);

            return effect;
        } catch (err) {
            logger.error('Failed to create the presenter effect', err);
        }
    },

    /**
     * Tries to turn the presenter video track on or off. If a presenter track
     * doesn't exist, a new video track is created.
     *
     * @param mute - true for mute and false for unmute.
     *
     * @private
     */
    async _mutePresenterVideo(mute) {
        const maybeShowErrorDialog = error => {
            APP.store.dispatch(notifyCameraError(error));
        };

        // Check for NO-OP
        if (mute && (!this.localPresenterVideo || this.localPresenterVideo.isMuted())) {

            return;
        } else if (!mute && this.localPresenterVideo && !this.localPresenterVideo.isMuted()) {

            return;
        }

        // Create a new presenter track and apply the presenter effect.
        if (!this.localPresenterVideo && !mute) {
            let { aspectRatio, height } = this.localVideo.track.getSettings();
            const { width } = this.localVideo.track.getSettings();
            let desktopResizeConstraints = {};
            let resizeDesktopStream = false;
            const DESKTOP_STREAM_CAP = 720;

            // Determine the constraints if the desktop track needs to be resized.
            // Resizing is needed when the resolution cannot be determined or when
            // the window is bigger than 720p.
            if (height && width) {
                aspectRatio = aspectRatio ?? (width / height).toPrecision(4);
                const advancedConstraints = [ { aspectRatio } ];
                const isPortrait = height >= width;

                // Determine which dimension needs resizing and resize only that side
                // keeping the aspect ratio same as before.
                if (isPortrait && width > DESKTOP_STREAM_CAP) {
                    resizeDesktopStream = true;
                    advancedConstraints.push({ width: DESKTOP_STREAM_CAP });
                } else if (!isPortrait && height > DESKTOP_STREAM_CAP) {
                    resizeDesktopStream = true;
                    advancedConstraints.push({ height: DESKTOP_STREAM_CAP });
                }
                desktopResizeConstraints.advanced = advancedConstraints;
            } else {
                resizeDesktopStream = true;
                desktopResizeConstraints = {
                    width: 1280,
                    height: 720
                };
            }
            if (resizeDesktopStream) {
                try {
                    await this.localVideo.track.applyConstraints(desktopResizeConstraints);
                } catch (err) {
                    logger.error('Failed to apply constraints on the desktop stream for presenter mode', err);

                    return;
                }
                height = this.localVideo.track.getSettings().height ?? DESKTOP_STREAM_CAP;
            }
            const defaultCamera = getUserSelectedCameraDeviceId(APP.store.getState());
            let effect;

            try {
                effect = await this._createPresenterStreamEffect(height,
                    defaultCamera);
            } catch (err) {
                logger.error('Failed to unmute Presenter Video');
                maybeShowErrorDialog(err);

                return;
            }
            try {
                await this.localVideo.setEffect(effect);
                APP.store.dispatch(setVideoMuted(mute, MEDIA_TYPE.PRESENTER));
                this.setVideoMuteStatus(mute);
            } catch (err) {
                logger.error('Failed to apply the Presenter effect', err);
            }
        } else {
            APP.store.dispatch(setVideoMuted(mute, MEDIA_TYPE.PRESENTER));
        }
    },

    /**
     * Tries to switch to the screensharing mode by disposing camera stream and
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

        return this._createDesktopTrack(options)
            .then(async streams => {
                const desktopVideoStream = streams.find(stream => stream.getType() === MEDIA_TYPE.VIDEO);

                if (desktopVideoStream) {
                    this.useVideoStream(desktopVideoStream);
                }

                this._desktopAudioStream = streams.find(stream => stream.getType() === MEDIA_TYPE.AUDIO);

                if (this._desktopAudioStream) {
                    // If there is a localAudio stream, mix in the desktop audio stream captured by the screen sharing
                    // api.
                    if (this.localAudio) {
                        this._mixerEffect = new AudioMixerEffect(this._desktopAudioStream);

                        await this.localAudio.setEffect(this._mixerEffect);
                    } else {
                        // If no local stream is present ( i.e. no input audio devices) we use the screen share audio
                        // stream as we would use a regular stream.
                        await this.useAudioStream(this._desktopAudioStream);
                    }
                }
            })
            .then(() => {
                this.videoSwitchInProgress = false;
                if (config.enableScreenshotCapture) {
                    APP.store.dispatch(toggleScreenshotCaptureEffect(true));
                }
                sendAnalytics(createScreenSharingEvent('started'));
                logger.log('Screen sharing started');
            })
            .catch(error => {
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
                // asynchronous, but does not return a Promise and is not part
                // of the current Promise chain.
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
        if (error.name === JitsiTrackErrors.CHROME_EXTENSION_USER_CANCELED) {
            return;
        }

        logger.error('failed to share local desktop', error);

        if (error.name
                === JitsiTrackErrors.CHROME_EXTENSION_USER_GESTURE_REQUIRED) {
            // If start with screen sharing the extension will fail to install
            // (if not found), because the request has been triggered by the
            // script. Show a dialog which asks user to click "install" and try
            // again switching to the screen sharing.
            APP.UI.showExtensionInlineInstallationDialog(
                () => {
                    // eslint-disable-next-line no-empty-function
                    this.toggleScreenSharing().catch(() => {});
                }
            );

            return;
        }

        // Handling:
        // JitsiTrackErrors.PERMISSION_DENIED
        // JitsiTrackErrors.CHROME_EXTENSION_INSTALLATION_ERROR
        // JitsiTrackErrors.CONSTRAINT_FAILED
        // JitsiTrackErrors.GENERAL
        // and any other
        let descriptionKey;
        let titleKey;

        if (error.name === JitsiTrackErrors.PERMISSION_DENIED) {

            // in FF the only option for user is to deny access temporary or
            // permanently and we only receive permission_denied
            // we always show some info cause in case of permanently, no info
            // shown will be bad experience
            //
            // TODO: detect interval between requesting permissions and received
            // error, this way we can detect user interaction which will have
            // longer delay
            if (JitsiMeetJS.util.browser.isFirefox()) {
                descriptionKey
                    = 'dialog.screenSharingFirefoxPermissionDeniedError';
                titleKey = 'dialog.screenSharingFirefoxPermissionDeniedTitle';
            } else {
                descriptionKey = 'dialog.screenSharingPermissionDeniedError';
                titleKey = 'dialog.screenSharingFailedToInstallTitle';
            }
        } else if (error.name === JitsiTrackErrors.CONSTRAINT_FAILED) {
            descriptionKey = 'dialog.cameraConstraintFailedError';
            titleKey = 'deviceError.cameraError';
        } else {
            descriptionKey = 'dialog.screenSharingFailedToInstall';
            titleKey = 'dialog.screenSharingFailedToInstallTitle';
        }

        APP.UI.messageHandler.showError({
            descriptionKey,
            titleKey
        });
    },

    /**
     * Setup interaction between conference and UI.
     */
    _setupListeners() {
        // add local streams when joined to the conference
        room.on(JitsiConferenceEvents.CONFERENCE_JOINED, () => {
            this._onConferenceJoined();
        });

        room.on(
            JitsiConferenceEvents.CONFERENCE_LEFT,
            (...args) => {
                APP.store.dispatch(conferenceTimestampChanged(0));
                APP.store.dispatch(conferenceLeft(room, ...args));
            });

        room.on(
            JitsiConferenceEvents.AUTH_STATUS_CHANGED,
            (authEnabled, authLogin) =>
                APP.store.dispatch(authStatusChanged(authEnabled, authLogin)));

        room.on(JitsiConferenceEvents.PARTCIPANT_FEATURES_CHANGED,
            user => APP.UI.onUserFeaturesChanged(user));
        room.on(JitsiConferenceEvents.USER_JOINED, (id, user) => {
            // The logic shared between RN and web.
            commonUserJoinedHandling(APP.store, room, user);

            if (user.isHidden()) {
                return;
            }

            logger.log(`USER ${id} connnected:`, user);
            APP.UI.addUser(user);
        });

        room.on(JitsiConferenceEvents.USER_LEFT, (id, user) => {
            // The logic shared between RN and web.
            commonUserLeftHandling(APP.store, room, user);

            if (user.isHidden()) {
                return;
            }

            logger.log(`USER ${id} LEFT:`, user);

            APP.UI.onSharedVideoStop(id);
        });

        room.on(JitsiConferenceEvents.USER_STATUS_CHANGED, (id, status) => {
            APP.store.dispatch(participantPresenceChanged(id, status));

            const user = room.getParticipantById(id);

            if (user) {
                APP.UI.updateUserStatus(user, status);
            }
        });

        room.on(JitsiConferenceEvents.USER_ROLE_CHANGED, (id, role) => {
            if (this.isLocalId(id)) {
                logger.info(`My role changed, new role: ${role}`);

                APP.store.dispatch(localParticipantRoleChanged(role));
            } else {
                APP.store.dispatch(participantRoleChanged(id, role));
            }
        });

        room.on(JitsiConferenceEvents.TRACK_ADDED, track => {
            if (!track || track.isLocal()) {
                return;
            }

            APP.store.dispatch(trackAdded(track));
        });

        room.on(JitsiConferenceEvents.TRACK_REMOVED, track => {
            if (!track || track.isLocal()) {
                return;
            }

            APP.store.dispatch(trackRemoved(track));
        });

        room.on(JitsiConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED, (id, lvl) => {
            let newLvl = lvl;

            if (this.isLocalId(id)
                && this.localAudio && this.localAudio.isMuted()) {
                newLvl = 0;
            }

            if (config.debug) {
                this.audioLevelsMap[id] = newLvl;
                if (config.debugAudioLevels) {
                    logger.log(`AudioLevel:${id}/${newLvl}`);
                }
            }

            APP.UI.setAudioLevel(id, newLvl);
        });

        room.on(JitsiConferenceEvents.TRACK_MUTE_CHANGED, (track, participantThatMutedUs) => {
            if (participantThatMutedUs) {
                APP.store.dispatch(participantMutedUs(participantThatMutedUs));
            }
        });

        room.on(JitsiConferenceEvents.SUBJECT_CHANGED,
            subject => APP.store.dispatch(conferenceSubjectChanged(subject)));

        room.on(
            JitsiConferenceEvents.LAST_N_ENDPOINTS_CHANGED,
            (leavingIds, enteringIds) =>
                APP.UI.handleLastNEndpoints(leavingIds, enteringIds));

        room.on(
            JitsiConferenceEvents.P2P_STATUS,
            (jitsiConference, p2p) =>
                APP.store.dispatch(p2pStatusChanged(p2p)));

        room.on(
            JitsiConferenceEvents.PARTICIPANT_CONN_STATUS_CHANGED,
            (id, connectionStatus) => APP.store.dispatch(
                participantConnectionStatusChanged(id, connectionStatus)));

        room.on(
            JitsiConferenceEvents.DOMINANT_SPEAKER_CHANGED,
            id => APP.store.dispatch(dominantSpeakerChanged(id, room)));

        room.on(
            JitsiConferenceEvents.CONFERENCE_CREATED_TIMESTAMP,
            conferenceTimestamp => APP.store.dispatch(conferenceTimestampChanged(conferenceTimestamp)));

        room.on(JitsiConferenceEvents.CONNECTION_INTERRUPTED, () => {
            APP.store.dispatch(localParticipantConnectionStatusChanged(
                JitsiParticipantConnectionStatus.INTERRUPTED));
        });

        room.on(JitsiConferenceEvents.CONNECTION_RESTORED, () => {
            APP.store.dispatch(localParticipantConnectionStatusChanged(
                JitsiParticipantConnectionStatus.ACTIVE));
        });

        room.on(
            JitsiConferenceEvents.DISPLAY_NAME_CHANGED,
            (id, displayName) => {
                const formattedDisplayName
                    = getNormalizedDisplayName(displayName);

                APP.store.dispatch(participantUpdated({
                    conference: room,
                    id,
                    name: formattedDisplayName
                }));
                APP.API.notifyDisplayNameChanged(id, {
                    displayName: formattedDisplayName,
                    formattedDisplayName:
                        appendSuffix(
                            formattedDisplayName
                                || interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME)
                });
                APP.UI.changeDisplayName(id, formattedDisplayName);
            }
        );
        room.on(
            JitsiConferenceEvents.BOT_TYPE_CHANGED,
            (id, botType) => {

                APP.store.dispatch(participantUpdated({
                    conference: room,
                    id,
                    botType
                }));
            }
        );

        room.on(
            JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (...args) => {
                APP.store.dispatch(endpointMessageReceived(...args));
                if (args && args.length >= 2) {
                    const [ sender, eventData ] = args;

                    if (eventData.name === ENDPOINT_TEXT_MESSAGE_NAME) {
                        APP.API.notifyEndpointTextMessageReceived({
                            senderInfo: {
                                jid: sender._jid,
                                id: sender._id
                            },
                            eventData
                        });
                    }
                }
            });

        room.on(
            JitsiConferenceEvents.LOCK_STATE_CHANGED,
            (...args) => APP.store.dispatch(lockStateChanged(room, ...args)));

        APP.remoteControl.on(RemoteControlEvents.ACTIVE_CHANGED, isActive => {
            room.setLocalParticipantProperty(
                'remoteControlSessionStatus',
                isActive
            );
            APP.UI.setLocalRemoteControlActiveChanged();
        });

        /* eslint-disable max-params */
        room.on(
            JitsiConferenceEvents.PARTICIPANT_PROPERTY_CHANGED,
            (participant, name, oldValue, newValue) => {
                switch (name) {
                case 'remoteControlSessionStatus':
                    APP.UI.setRemoteControlActiveStatus(
                        participant.getId(),
                        newValue);
                    break;
                default:

                // ignore
                }
            });

        room.on(JitsiConferenceEvents.KICKED, participant => {
            APP.UI.hideStats();
            APP.store.dispatch(kickedOut(room, participant));

            // FIXME close
        });

        room.on(JitsiConferenceEvents.PARTICIPANT_KICKED, (kicker, kicked) => {
            APP.store.dispatch(participantKicked(kicker, kicked));
        });

        room.on(JitsiConferenceEvents.SUSPEND_DETECTED, () => {
            APP.store.dispatch(suspendDetected());
        });

        APP.UI.addListener(UIEvents.AUDIO_MUTED, muted => {
            this.muteAudio(muted);
        });
        APP.UI.addListener(UIEvents.VIDEO_MUTED, muted => {
            this.muteVideo(muted);
        });

        room.addCommandListener(this.commands.defaults.ETHERPAD,
            ({ value }) => {
                APP.UI.initEtherpad(value);
            }
        );

        APP.UI.addListener(UIEvents.EMAIL_CHANGED,
            this.changeLocalEmail.bind(this));
        room.addCommandListener(this.commands.defaults.EMAIL, (data, from) => {
            APP.store.dispatch(participantUpdated({
                conference: room,
                id: from,
                email: data.value
            }));
        });

        room.addCommandListener(
            this.commands.defaults.AVATAR_URL,
            (data, from) => {
                APP.store.dispatch(
                    participantUpdated({
                        conference: room,
                        id: from,
                        avatarURL: data.value
                    }));
            });

        room.addCommandListener(this.commands.defaults.AVATAR_ID,
            (data, from) => {
                APP.store.dispatch(
                    participantUpdated({
                        conference: room,
                        id: from,
                        avatarID: data.value
                    }));
            });

        APP.UI.addListener(UIEvents.NICKNAME_CHANGED,
            this.changeLocalDisplayName.bind(this));

        room.on(
            JitsiConferenceEvents.START_MUTED_POLICY_CHANGED,
            ({ audio, video }) => {
                APP.store.dispatch(
                    onStartMutedPolicyChanged(audio, video));
            }
        );
        room.on(JitsiConferenceEvents.STARTED_MUTED, () => {
            (room.isStartAudioMuted() || room.isStartVideoMuted())
                && APP.UI.notifyInitiallyMuted();
        });

        room.on(
            JitsiConferenceEvents.DATA_CHANNEL_OPENED, () => {
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

        /* eslint-disable max-params */
        APP.UI.addListener(
            UIEvents.RESOLUTION_CHANGED,
            (id, oldResolution, newResolution, delay) => {
                sendAnalytics(createStreamSwitchDelayEvent(
                    {
                        'old_resolution': oldResolution,
                        'new_resolution': newResolution,
                        value: delay
                    }));
            });

        APP.UI.addListener(UIEvents.AUTH_CLICKED, () => {
            AuthHandler.authenticate(room);
        });

        APP.UI.addListener(
            UIEvents.VIDEO_DEVICE_CHANGED,
            cameraDeviceId => {
                const videoWasMuted = this.isLocalVideoMuted();

                sendAnalytics(createDeviceChangedEvent('video', 'input'));

                // If both screenshare and video are in progress, restart the
                // presenter mode with the new camera device.
                if (this.isSharingScreen && !videoWasMuted) {
                    const { height } = this.localVideo.track.getSettings();

                    // dispose the existing presenter track and create a new
                    // camera track.
                    // FIXME JitsiLocalTrack.dispose is async and should be waited for
                    this.localPresenterVideo && this.localPresenterVideo.dispose();
                    this.localPresenterVideo = null;

                    return this._createPresenterStreamEffect(height, cameraDeviceId)
                        .then(effect => this.localVideo.setEffect(effect))
                        .then(() => {
                            this.setVideoMuteStatus(false);
                            logger.log('switched local video device');
                            this._updateVideoDeviceId();
                        })
                        .catch(err => APP.store.dispatch(notifyCameraError(err)));

                // If screenshare is in progress but video is muted, update the default device
                // id for video, dispose the existing presenter track and create a new effect
                // that can be applied on un-mute.
                } else if (this.isSharingScreen && videoWasMuted) {
                    logger.log('switched local video device');
                    const { height } = this.localVideo.track.getSettings();

                    this._updateVideoDeviceId();

                    // FIXME JitsiLocalTrack.dispose is async and should be waited for
                    this.localPresenterVideo && this.localPresenterVideo.dispose();
                    this.localPresenterVideo = null;
                    this._createPresenterStreamEffect(height, cameraDeviceId);

                // if there is only video, switch to the new camera stream.
                } else {
                    createLocalTracksF({
                        devices: [ 'video' ],
                        cameraDeviceId,
                        micDeviceId: null
                    })
                    .then(([ stream ]) => {
                        // if we are in audio only mode or video was muted before
                        // changing device, then mute
                        if (this.isAudioOnly() || videoWasMuted) {
                            return stream.mute()
                                .then(() => stream);
                        }

                        return stream;
                    })
                    .then(stream => this.useVideoStream(stream))
                    .then(() => {
                        logger.log('switched local video device');
                        this._updateVideoDeviceId();
                    })
                    .catch(err => APP.store.dispatch(notifyCameraError(err)));
                }
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_DEVICE_CHANGED,
            micDeviceId => {
                const audioWasMuted = this.isLocalAudioMuted();

                sendAnalytics(createDeviceChangedEvent('audio', 'input'));
                createLocalTracksF({
                    devices: [ 'audio' ],
                    cameraDeviceId: null,
                    micDeviceId
                })
                .then(([ stream ]) => {
                    // if audio was muted before changing the device, mute
                    // with the new device
                    if (audioWasMuted) {
                        return stream.mute()
                            .then(() => stream);
                    }

                    return stream;
                })
                .then(async stream => {
                    // In case screen sharing audio is also shared we mix it with new input stream. The old _mixerEffect
                    // will be cleaned up when the existing track is replaced.
                    if (this._mixerEffect) {
                        this._mixerEffect = new AudioMixerEffect(this._desktopAudioStream);

                        await stream.setEffect(this._mixerEffect);
                    }

                    return this.useAudioStream(stream);
                })
                .then(() => {
                    logger.log(`switched local audio device: ${this.localAudio?.getDeviceId()}`);

                    this._updateAudioDeviceId();
                })
                .catch(err => {
                    APP.store.dispatch(notifyMicError(err));
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

        /* eslint-disable max-params */
        APP.UI.addListener(
            UIEvents.UPDATE_SHARED_VIDEO,
            (url, state, time, isMuted, volume) => {
                /* eslint-enable max-params */
                // send start and stop commands once, and remove any updates
                // that had left
                if (state === 'stop'
                        || state === 'start'
                        || state === 'playing') {
                    room.removeCommand(this.commands.defaults.SHARED_VIDEO);
                    room.sendCommandOnce(this.commands.defaults.SHARED_VIDEO, {
                        value: url,
                        attributes: {
                            state,
                            time,
                            muted: isMuted,
                            volume
                        }
                    });
                } else {
                    // in case of paused, in order to allow late users to join
                    // paused
                    room.removeCommand(this.commands.defaults.SHARED_VIDEO);
                    room.sendCommand(this.commands.defaults.SHARED_VIDEO, {
                        value: url,
                        attributes: {
                            state,
                            time,
                            muted: isMuted,
                            volume
                        }
                    });
                }

                APP.store.dispatch(setSharedVideoStatus(state));
            });
        room.addCommandListener(
            this.commands.defaults.SHARED_VIDEO,
            ({ value, attributes }, id) => {
                if (attributes.state === 'stop') {
                    APP.UI.onSharedVideoStop(id, attributes);
                } else if (attributes.state === 'start') {
                    APP.UI.onSharedVideoStart(id, value, attributes);
                } else if (attributes.state === 'playing'
                    || attributes.state === 'pause') {
                    APP.UI.onSharedVideoUpdate(id, value, attributes);
                }
            });
    },

    /**
     * Cleanups local conference on suspend.
     */
    onSuspendDetected() {
        // After wake up, we will be in a state where conference is left
        // there will be dialog shown to user.
        // We do not want video/audio as we show an overlay and after it
        // user need to rejoin or close, while waking up we can detect
        // camera wakeup as a problem with device.
        // We also do not care about device change, which happens
        // on resume after suspending PC.
        if (this.deviceChangeListener) {
            JitsiMeetJS.mediaDevices.removeEventListener(
                JitsiMediaDevicesEvents.DEVICE_LIST_CHANGED,
                this.deviceChangeListener);
        }

        this.localVideo = null;
        this.localAudio = null;
    },

    /**
     * Callback invoked when the conference has been successfully joined.
     * Initializes the UI and various other features.
     *
     * @private
     * @returns {void}
     */
    _onConferenceJoined() {
        APP.UI.initConference();

        APP.keyboardshortcut.init();

        APP.store.dispatch(conferenceJoined(room));

        const displayName
            = APP.store.getState()['features/base/settings'].displayName;

        APP.UI.changeDisplayName('localVideoContainer', displayName);
    },

    /**
    * Adds any room listener.
    * @param {string} eventName one of the JitsiConferenceEvents
    * @param {Function} listener the function to be called when the event
    * occurs
    */
    addConferenceListener(eventName, listener) {
        room.on(eventName, listener);
    },

    /**
    * Removes any room listener.
    * @param {string} eventName one of the JitsiConferenceEvents
    * @param {Function} listener the listener to be removed.
    */
    removeConferenceListener(eventName, listener) {
        room.off(eventName, listener);
    },

    /**
     * Updates the list of current devices.
     * @param {boolean} setDeviceListChangeHandler - Whether to add the deviceList change handlers.
     * @private
     * @returns {Promise}
     */
    _initDeviceList(setDeviceListChangeHandler = false) {
        const { mediaDevices } = JitsiMeetJS;

        if (mediaDevices.isDeviceListAvailable()
                && mediaDevices.isDeviceChangeAvailable()) {
            if (setDeviceListChangeHandler) {
                this.deviceChangeListener = devices =>
                    window.setTimeout(() => this._onDeviceListChanged(devices), 0);
                mediaDevices.addEventListener(
                    JitsiMediaDevicesEvents.DEVICE_LIST_CHANGED,
                    this.deviceChangeListener);
            }

            const { dispatch } = APP.store;

            return dispatch(getAvailableDevices())
                .then(devices => {
                    // Ugly way to synchronize real device IDs with local
                    // storage and settings menu. This is a workaround until
                    // getConstraints() method will be implemented in browsers.
                    this._updateAudioDeviceId();

                    this._updateVideoDeviceId();

                    APP.UI.onAvailableDevicesChanged(devices);
                });
        }

        return Promise.resolve();
    },

    /**
     * Updates the settings for the currently used video device, extracting
     * the device id from the used track.
     * @private
     */
    _updateVideoDeviceId() {
        if (this.localVideo
            && this.localVideo.videoType === 'camera') {
            APP.store.dispatch(updateSettings({
                cameraDeviceId: this.localVideo.getDeviceId()
            }));
        }

        // If screenshare is in progress, get the device id from the presenter track.
        if (this.localPresenterVideo) {
            APP.store.dispatch(updateSettings({
                cameraDeviceId: this.localPresenterVideo.getDeviceId()
            }));
        }
    },

    /**
     * Updates the settings for the currently used audio device, extracting
     * the device id from the used track.
     * @private
     */
    _updateAudioDeviceId() {
        if (this.localAudio) {
            APP.store.dispatch(updateSettings({
                micDeviceId: this.localAudio.getDeviceId()
            }));
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
        const oldDevices = APP.store.getState()['features/base/devices'].availableDevices;

        APP.store.dispatch(updateDeviceList(devices));

        const newDevices
            = mediaDeviceHelper.getNewMediaDevicesAfterDeviceListChanged(
                devices,
                this.isSharingScreen,
                this.localVideo,
                this.localAudio);
        const promises = [];
        const audioWasMuted = this.isLocalAudioMuted();
        const videoWasMuted = this.isLocalVideoMuted();
        const requestedInput = {
            audio: Boolean(newDevices.audioinput),
            video: Boolean(newDevices.videoinput)
        };

        if (typeof newDevices.audiooutput !== 'undefined') {
            const { dispatch } = APP.store;
            const setAudioOutputPromise
                = setAudioOutputDeviceId(newDevices.audiooutput, dispatch)
                    .catch(); // Just ignore any errors in catch block.


            promises.push(setAudioOutputPromise);
        }

        // Handles the use case when the default device is changed (we are always stopping the streams because it's
        // simpler):
        // If the default device is changed we need to first stop the local streams and then call GUM. Otherwise GUM
        // will return a stream using the old default device.
        if (requestedInput.audio && this.localAudio) {
            this.localAudio.stopStream();
        }

        if (requestedInput.video && this.localVideo) {
            this.localVideo.stopStream();
        }

        // Let's handle unknown/non-preferred devices
        const newAvailDevices
            = APP.store.getState()['features/base/devices'].availableDevices;
        let newAudioDevices = [];
        let oldAudioDevices = [];

        if (typeof newDevices.audiooutput === 'undefined') {
            newAudioDevices = newAvailDevices.audioOutput;
            oldAudioDevices = oldDevices.audioOutput;
        }

        if (!requestedInput.audio) {
            newAudioDevices = newAudioDevices.concat(newAvailDevices.audioInput);
            oldAudioDevices = oldAudioDevices.concat(oldDevices.audioInput);
        }

        // check for audio
        if (newAudioDevices.length > 0) {
            APP.store.dispatch(
                checkAndNotifyForNewDevice(newAudioDevices, oldAudioDevices));
        }

        // check for video
        if (!requestedInput.video) {
            APP.store.dispatch(
                checkAndNotifyForNewDevice(newAvailDevices.videoInput, oldDevices.videoInput));
        }

        promises.push(
            mediaDeviceHelper.createLocalTracksAfterDeviceListChanged(
                    createLocalTracksF,
                    newDevices.videoinput,
                    newDevices.audioinput)
                .then(tracks => {
                    // If audio or video muted before, or we unplugged current
                    // device and selected new one, then mute new track.
                    const muteSyncPromises = tracks.map(track => {
                        if ((track.isVideoTrack() && videoWasMuted)
                            || (track.isAudioTrack() && audioWasMuted)) {
                            return track.mute();
                        }

                        return Promise.resolve();
                    });

                    return Promise.all(muteSyncPromises)
                        .then(() =>
                            Promise.all(Object.keys(requestedInput).map(mediaType => {
                                if (requestedInput[mediaType]) {
                                    const useStream
                                        = mediaType === 'audio'
                                            ? this.useAudioStream.bind(this)
                                            : this.useVideoStream.bind(this);

                                    // Use the new stream or null if we failed to obtain it.
                                    return useStream(tracks.find(track => track.getType() === mediaType) || null)
                                        .then(() => {
                                            mediaType === 'audio'
                                                ? this._updateAudioDeviceId()
                                                : this._updateVideoDeviceId();
                                        });
                                }

                                return Promise.resolve();
                            })));
                })
                .then(() => {
                    // Log and sync known mute state.
                    if (audioWasMuted) {
                        sendAnalytics(createTrackMutedEvent(
                            'audio',
                            'device list changed'));
                        logger.log('Audio mute: device list changed');
                        muteLocalAudio(true);
                    }

                    if (!this.isSharingScreen && videoWasMuted) {
                        sendAnalytics(createTrackMutedEvent(
                            'video',
                            'device list changed'));
                        logger.log('Video mute: device list changed');
                        muteLocalVideo(true);
                    }
                }));

        return Promise.all(promises)
            .then(() => {
                APP.UI.onAvailableDevicesChanged(devices);
            });
    },

    /**
     * Determines whether or not the audio button should be enabled.
     */
    updateAudioIconEnabled() {
        const audioMediaDevices
            = APP.store.getState()['features/base/devices'].availableDevices.audioInput;
        const audioDeviceCount
            = audioMediaDevices ? audioMediaDevices.length : 0;

        // The audio functionality is considered available if there are any
        // audio devices detected or if the local audio stream already exists.
        const available = audioDeviceCount > 0 || Boolean(this.localAudio);

        APP.store.dispatch(setAudioAvailable(available));
        APP.API.notifyAudioAvailabilityChanged(available);
    },

    /**
     * Determines whether or not the video button should be enabled.
     */
    updateVideoIconEnabled() {
        const videoMediaDevices
            = APP.store.getState()['features/base/devices'].availableDevices.videoInput;
        const videoDeviceCount
            = videoMediaDevices ? videoMediaDevices.length : 0;

        // The video functionality is considered available if there are any
        // video devices detected or if there is local video stream already
        // active which could be either screensharing stream or a video track
        // created before the permissions were rejected (through browser
        // config).
        const available = videoDeviceCount > 0 || Boolean(this.localVideo);

        APP.store.dispatch(setVideoAvailable(available));
        APP.API.notifyVideoAvailabilityChanged(available);
    },

    /**
     * Disconnect from the conference and optionally request user feedback.
     * @param {boolean} [requestFeedback=false] if user feedback should be
     * requested
     */
    hangup(requestFeedback = false) {
        eventEmitter.emit(JitsiMeetConferenceEvents.BEFORE_HANGUP);

        this._stopProxyConnection();

        APP.store.dispatch(destroyLocalTracks());
        this._localTracksInitialized = false;
        this.localVideo = null;
        this.localAudio = null;

        // Remove unnecessary event listeners from firing callbacks.
        if (this.deviceChangeListener) {
            JitsiMeetJS.mediaDevices.removeEventListener(
                JitsiMediaDevicesEvents.DEVICE_LIST_CHANGED,
                this.deviceChangeListener);
        }

        APP.UI.removeAllListeners();
        APP.remoteControl.removeAllListeners();

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
            this.leaveRoomAndDisconnect()
        ]).then(values => {
            this._room = undefined;
            room = undefined;

            APP.API.notifyReadyToClose();
            APP.store.dispatch(maybeRedirectToWelcomePage(values[0]));
        });
    },

    /**
     * Leaves the room and calls JitsiConnection.disconnect.
     *
     * @returns {Promise}
     */
    leaveRoomAndDisconnect() {
        APP.store.dispatch(conferenceWillLeave(room));

        if (room.isJoined()) {
            return room.leave().then(disconnect, disconnect);
        }

        return disconnect();
    },

    /**
     * Changes the email for the local user
     * @param email {string} the new email
     */
    changeLocalEmail(email = '') {
        const localParticipant = getLocalParticipant(APP.store.getState());

        const formattedEmail = String(email).trim();

        if (formattedEmail === localParticipant.email) {
            return;
        }

        const localId = localParticipant.id;

        APP.store.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id: localId,
            local: true,
            email: formattedEmail
        }));

        APP.store.dispatch(updateSettings({
            email: formattedEmail
        }));
        APP.API.notifyEmailChanged(localId, {
            email: formattedEmail
        });
        sendData(commands.EMAIL, formattedEmail);
    },

    /**
     * Changes the avatar url for the local user
     * @param url {string} the new url
     */
    changeLocalAvatarUrl(url = '') {
        const { avatarURL, id } = getLocalParticipant(APP.store.getState());

        const formattedUrl = String(url).trim();

        if (formattedUrl === avatarURL) {
            return;
        }

        APP.store.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id,
            local: true,
            avatarURL: formattedUrl
        }));

        APP.store.dispatch(updateSettings({
            avatarURL: formattedUrl
        }));
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
        const formattedNickname = getNormalizedDisplayName(nickname);
        const { id, name } = getLocalParticipant(APP.store.getState());

        if (formattedNickname === name) {
            return;
        }

        APP.store.dispatch(participantUpdated({
            // XXX Only the local participant is allowed to update without
            // stating the JitsiConference instance (i.e. participant property
            // `conference` for a remote participant) because the local
            // participant is uniquely identified by the very fact that there is
            // only one local participant.

            id,
            local: true,
            name: formattedNickname
        }));

        APP.store.dispatch(updateSettings({
            displayName: formattedNickname
        }));

        if (room) {
            APP.UI.changeDisplayName(id, formattedNickname);
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
     * Callback invoked by the external api create or update a direct connection
     * from the local client to an external client.
     *
     * @param {Object} event - The object containing information that should be
     * passed to the {@code ProxyConnectionService}.
     * @returns {void}
     */
    onProxyConnectionEvent(event) {
        if (!this._proxyConnection) {
            this._proxyConnection = new JitsiMeetJS.ProxyConnectionService({

                /**
                 * Pass the {@code JitsiConnection} instance which will be used
                 * to fetch TURN credentials.
                 */
                jitsiConnection: APP.connection,

                /**
                 * The proxy connection feature is currently tailored towards
                 * taking a proxied video stream and showing it as a local
                 * desktop screen.
                 */
                convertVideoToDesktop: true,

                /**
                 * Callback invoked when the connection has been closed
                 * automatically. Triggers cleanup of screensharing if active.
                 *
                 * @returns {void}
                 */
                onConnectionClosed: () => {
                    if (this._untoggleScreenSharing) {
                        this._untoggleScreenSharing();
                    }
                },

                /**
                 * Callback invoked to pass messages from the local client back
                 * out to the external client.
                 *
                 * @param {string} peerJid - The jid of the intended recipient
                 * of the message.
                 * @param {Object} data - The message that should be sent. For
                 * screensharing this is an iq.
                 * @returns {void}
                 */
                onSendMessage: (peerJid, data) =>
                    APP.API.sendProxyConnectionEvent({
                        data,
                        to: peerJid
                    }),

                /**
                 * Callback invoked when the remote peer of the proxy connection
                 * has provided a video stream, intended to be used as a local
                 * desktop stream.
                 *
                 * @param {JitsiLocalTrack} remoteProxyStream - The media
                 * stream to use as a local desktop stream.
                 * @returns {void}
                 */
                onRemoteStream: desktopStream => {
                    if (desktopStream.videoType !== 'desktop') {
                        logger.warn('Received a non-desktop stream to proxy.');
                        desktopStream.dispose();

                        return;
                    }

                    this.toggleScreenSharing(undefined, { desktopStream });
                }
            });
        }

        this._proxyConnection.processMessage(event);
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
    },

    /**
     * Dispatches the passed in feedback for submission. The submitted score
     * should be a number inclusively between 1 through 5, or -1 for no score.
     *
     * @param {number} score - a number between 1 and 5 (inclusive) or -1 for no
     * score.
     * @param {string} message - An optional message to attach to the feedback
     * in addition to the score.
     * @returns {void}
     */
    submitFeedback(score = -1, message = '') {
        if (score === -1 || (score >= 1 && score <= 5)) {
            APP.store.dispatch(submitFeedback(score, message, room));
        }
    },

    /**
     * Terminates any proxy screensharing connection that is active.
     *
     * @private
     * @returns {void}
     */
    _stopProxyConnection() {
        if (this._proxyConnection) {
            this._proxyConnection.stop();
        }

        this._proxyConnection = null;
    }
};
