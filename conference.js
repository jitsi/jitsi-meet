/* global APP, JitsiMeetJS, config, interfaceConfig */

import { jitsiLocalStorage } from '@jitsi/js-utils';
import Logger from '@jitsi/logger';
import EventEmitter from 'events';

import { openConnection } from './connection';
import { ENDPOINT_TEXT_MESSAGE_NAME } from './modules/API/constants';
import { AUDIO_ONLY_SCREEN_SHARE_NO_TRACK } from './modules/UI/UIErrors';
import AuthHandler from './modules/UI/authentication/AuthHandler';
import UIUtil from './modules/UI/util/UIUtil';
import VideoLayout from './modules/UI/videolayout/VideoLayout';
import mediaDeviceHelper from './modules/devices/mediaDeviceHelper';
import Recorder from './modules/recorder/Recorder';
import { createTaskQueue } from './modules/util/helpers';
import {
    createDeviceChangedEvent,
    createStartSilentEvent,
    createScreenSharingEvent,
    createTrackMutedEvent,
    sendAnalytics
} from './react/features/analytics';
import {
    maybeRedirectToWelcomePage,
    redirectToStaticPage,
    reloadWithStoredParams
} from './react/features/app/actions';
import { showModeratedNotification } from './react/features/av-moderation/actions';
import { shouldShowModeratedNotification } from './react/features/av-moderation/functions';
import { setAudioOnly } from './react/features/base/audio-only';
import {
    AVATAR_URL_COMMAND,
    EMAIL_COMMAND,
    _conferenceWillJoin,
    authStatusChanged,
    commonUserJoinedHandling,
    commonUserLeftHandling,
    conferenceFailed,
    conferenceJoined,
    conferenceJoinInProgress,
    conferenceLeft,
    conferenceSubjectChanged,
    conferenceTimestampChanged,
    conferenceUniqueIdSet,
    conferenceWillJoin,
    conferenceWillLeave,
    dataChannelOpened,
    e2eRttChanged,
    getConferenceOptions,
    kickedOut,
    lockStateChanged,
    onStartMutedPolicyChanged,
    p2pStatusChanged,
    sendLocalParticipant,
    nonParticipantMessageReceived
} from './react/features/base/conference';
import {
    getReplaceParticipant,
    getMultipleVideoSupportFeatureFlag,
    getSourceNameSignalingFeatureFlag
} from './react/features/base/config/functions';
import {
    checkAndNotifyForNewDevice,
    getAvailableDevices,
    getDefaultDeviceId,
    notifyCameraError,
    notifyMicError,
    setAudioOutputDeviceId,
    updateDeviceList
} from './react/features/base/devices';
import {
    browser,
    JitsiConferenceErrors,
    JitsiConferenceEvents,
    JitsiConnectionErrors,
    JitsiConnectionEvents,
    JitsiE2ePingEvents,
    JitsiMediaDevicesEvents,
    JitsiParticipantConnectionStatus,
    JitsiTrackErrors,
    JitsiTrackEvents
} from './react/features/base/lib-jitsi-meet';
import { isFatalJitsiConnectionError } from './react/features/base/lib-jitsi-meet/functions';
import {
    getStartWithAudioMuted,
    getStartWithVideoMuted,
    isVideoMutedByUser,
    MEDIA_TYPE,
    setAudioAvailable,
    setAudioMuted,
    setAudioUnmutePermissions,
    setVideoAvailable,
    setVideoMuted,
    setVideoUnmutePermissions
} from './react/features/base/media';
import {
    dominantSpeakerChanged,
    getLocalParticipant,
    getNormalizedDisplayName,
    getScreenshareParticipantByOwnerId,
    localParticipantAudioLevelChanged,
    localParticipantConnectionStatusChanged,
    localParticipantRoleChanged,
    participantConnectionStatusChanged,
    participantKicked,
    participantMutedUs,
    participantPresenceChanged,
    participantRoleChanged,
    participantUpdated,
    screenshareParticipantDisplayNameChanged,
    updateRemoteParticipantFeatures
} from './react/features/base/participants';
import {
    getUserSelectedCameraDeviceId,
    updateSettings
} from './react/features/base/settings';
import {
    addLocalTrack,
    createLocalPresenterTrack,
    createLocalTracksF,
    destroyLocalTracks,
    getLocalJitsiAudioTrack,
    getLocalJitsiVideoTrack,
    getLocalTracks,
    getLocalVideoTrack,
    isLocalCameraTrackMuted,
    isLocalTrackMuted,
    isUserInteractionRequiredForUnmute,
    replaceLocalTrack,
    trackAdded,
    trackRemoved
} from './react/features/base/tracks';
import { downloadJSON } from './react/features/base/util/downloadJSON';
import { showDesktopPicker } from './react/features/desktop-picker';
import { appendSuffix } from './react/features/display-name';
import {
    maybeOpenFeedbackDialog,
    submitFeedback
} from './react/features/feedback';
import { maybeSetLobbyChatMessageListener } from './react/features/lobby/actions.any';
import {
    isModerationNotificationDisplayed,
    showNotification,
    NOTIFICATION_TIMEOUT_TYPE
} from './react/features/notifications';
import { mediaPermissionPromptVisibilityChanged, toggleSlowGUMOverlay } from './react/features/overlay';
import { suspendDetected } from './react/features/power-monitor';
import {
    initPrejoin,
    isPrejoinPageVisible,
    makePrecallTest,
    setJoiningInProgress
} from './react/features/prejoin';
import { disableReceiver, stopReceiver } from './react/features/remote-control';
import { setScreenAudioShareState, isScreenAudioShared } from './react/features/screen-share/';
import { toggleScreenshotCaptureSummary } from './react/features/screenshot-capture';
import { isScreenshotCaptureEnabled } from './react/features/screenshot-capture/functions';
import { AudioMixerEffect } from './react/features/stream-effects/audio-mixer/AudioMixerEffect';
import { createPresenterEffect } from './react/features/stream-effects/presenter';
import { createRnnoiseProcessor } from './react/features/stream-effects/rnnoise';
import { endpointMessageReceived } from './react/features/subtitles';
import { muteLocal } from './react/features/video-menu/actions.any';
import UIEvents from './service/UI/UIEvents';

const logger = Logger.getLogger(__filename);

const eventEmitter = new EventEmitter();

let room;
let connection;

/**
 * The promise is used when the prejoin screen is shown.
 * While the user configures the devices the connection can be made.
 *
 * @type {Promise<Object>}
 * @private
 */
let _connectionPromise;

/**
 * We are storing the resolve function of a Promise that waits for the _connectionPromise to be created. This is needed
 * when the prejoin button was pressed before the conference object was initialized and the _connectionPromise has not
 * been initialized when we tried to execute prejoinStart. In this case in prejoinStart we create a new Promise, assign
 * the resolve function to this variable and wait for the promise to resolve before we continue. The
 * _onConnectionPromiseCreated will be called once the _connectionPromise is created.
 */
let _onConnectionPromiseCreated;

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
    AVATAR_URL: AVATAR_URL_COMMAND,
    CUSTOM_ROLE: 'custom-role',
    EMAIL: EMAIL_COMMAND,
    ETHERPAD: 'etherpad'
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

        case JitsiConferenceErrors.NOT_ALLOWED_ERROR: {
            // let's show some auth not allowed page
            APP.store.dispatch(redirectToStaticPage('static/authError.html'));
            break;
        }

        // not enough rights to create conference
        case JitsiConferenceErrors.AUTHENTICATION_REQUIRED: {

            const replaceParticipant = getReplaceParticipant(APP.store.getState());

            // Schedule reconnect to check if someone else created the room.
            this.reconnectTimeout = setTimeout(() => {
                APP.store.dispatch(conferenceWillJoin(room));
                room.join(null, replaceParticipant);
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

        // FIXME FOCUS_DISCONNECTED is a confusing event name.
        // What really happens there is that the library is not ready yet,
        // because Jicofo is not available, but it is going to give it another
        // try.
        case JitsiConferenceErrors.FOCUS_DISCONNECTED: {
            const [ focus, retrySec ] = params;

            APP.store.dispatch(showNotification({
                descriptionKey: focus,
                titleKey: retrySec
            }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
            break;
        }

        case JitsiConferenceErrors.FOCUS_LEFT:
        case JitsiConferenceErrors.ICE_FAILED:
        case JitsiConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE:
        case JitsiConferenceErrors.OFFER_ANSWER_FAILED:
            APP.store.dispatch(conferenceWillLeave(room));

            // FIXME the conference should be stopped by the library and not by
            // the app. Both the errors above are unrecoverable from the library
            // perspective.
            room.leave().then(() => connection.disconnect());
            break;

        case JitsiConferenceErrors.CONFERENCE_MAX_USERS:
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
        const replaceParticipant = getReplaceParticipant(APP.store.getState());

        // the local storage overrides here and in connection.js can be used by jibri
        room.join(jitsiLocalStorage.getItem('xmpp_conference_password_override'), replaceParticipant);
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

    if (!connection) {
        return onDisconnected();
    }

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
     * The local presenter video track (if any).
     * @type {JitsiLocalTrack|null}
     */
    localPresenterVideo: null,

    /**
     * Returns an object containing a promise which resolves with the created tracks &
     * the errors resulting from that process.
     *
     * @returns {Promise<JitsiLocalTrack[]>, Object}
     */
    createInitialLocalTracks(options = {}) {
        const errors = {};

        // Always get a handle on the audio input device so that we have statistics (such as "No audio input" or
        // "Are you trying to speak?" ) even if the user joins the conference muted.
        const initialDevices = config.disableInitialGUM ? [] : [ MEDIA_TYPE.AUDIO ];
        const requestedAudio = !config.disableInitialGUM;
        let requestedVideo = false;

        if (!config.disableInitialGUM
                && !options.startWithVideoMuted
                && !options.startAudioOnly
                && !options.startScreenSharing) {
            initialDevices.push(MEDIA_TYPE.VIDEO);
            requestedVideo = true;
        }

        if (!config.disableInitialGUM) {
            JitsiMeetJS.mediaDevices.addEventListener(
                JitsiMediaDevicesEvents.PERMISSION_PROMPT_IS_SHOWN,
                browserName =>
                    APP.store.dispatch(
                        mediaPermissionPromptVisibilityChanged(true, browserName))
            );
        }

        JitsiMeetJS.mediaDevices.addEventListener(
            JitsiMediaDevicesEvents.SLOW_GET_USER_MEDIA,
            () => APP.store.dispatch(toggleSlowGUMOverlay(true))
        );

        let tryCreateLocalTracks;

        // On Electron there is no permission prompt for granting permissions. That's why we don't need to
        // spend much time displaying the overlay screen. If GUM is not resolved within 15 seconds it will
        // probably never resolve.
        const timeout = browser.isElectron() ? 15000 : 60000;
        const audioOptions = {
            devices: [ MEDIA_TYPE.AUDIO ],
            timeout,
            firePermissionPromptIsShownEvent: true,
            fireSlowPromiseEvent: true
        };

        // FIXME is there any simpler way to rewrite this spaghetti below ?
        if (options.startScreenSharing) {
            // This option has been deprecated since it is no longer supported as per the w3c spec.
            // https://w3c.github.io/mediacapture-screen-share/#dom-mediadevices-getdisplaymedia. If the user has not
            // interacted with the webpage before the getDisplayMedia call, the promise will be rejected by the
            // browser. This has already been implemented in Firefox and Safari and will be implemented in Chrome soon.
            // https://bugs.chromium.org/p/chromium/issues/detail?id=1198918
            // Please note that Spot uses the same config option to use an external video input device label as
            // screenshare and calls getUserMedia instead of getDisplayMedia for capturing the media. Therefore it
            // needs to be supported here if _desktopSharingSourceDevice is provided.
            const errMessage = new Error('startScreenSharing config option is no longer supported for web browsers');
            const desktopPromise = config._desktopSharingSourceDevice
                ? this._createDesktopTrack()
                : Promise.reject(errMessage);

            tryCreateLocalTracks = desktopPromise
                .then(([ desktopStream ]) => {
                    if (!requestedAudio) {
                        return [ desktopStream ];
                    }

                    return createLocalTracksF(audioOptions)
                        .then(([ audioStream ]) =>
                            [ desktopStream, audioStream ])
                        .catch(error => {
                            errors.audioOnlyError = error;

                            return [ desktopStream ];
                        });
                })
                .catch(error => {
                    logger.error('Failed to obtain desktop stream', error);
                    errors.screenSharingError = error;

                    return requestedAudio ? createLocalTracksF(audioOptions) : [];
                })
                .catch(error => {
                    errors.audioOnlyError = error;

                    return [];
                });
        } else if (!requestedAudio && !requestedVideo) {
            // Resolve with no tracks
            tryCreateLocalTracks = Promise.resolve([]);
        } else {
            tryCreateLocalTracks = createLocalTracksF({
                devices: initialDevices,
                timeout,
                firePermissionPromptIsShownEvent: true,
                fireSlowPromiseEvent: true
            })
                .catch(err => {
                    if (requestedAudio && requestedVideo) {

                        // Try audio only...
                        errors.audioAndVideoError = err;

                        if (err.name === JitsiTrackErrors.TIMEOUT && !browser.isElectron()) {
                            // In this case we expect that the permission prompt is still visible. There is no point of
                            // executing GUM with different source. Also at the time of writing the following
                            // inconsistency have been noticed in some browsers - if the permissions prompt is visible
                            // and another GUM is executed the prompt does not change its content but if the user
                            // clicks allow the user action isassociated with the latest GUM call.
                            errors.audioOnlyError = err;
                            errors.videoOnlyError = err;

                            return [];
                        }

                        return createLocalTracksF(audioOptions);
                    } else if (requestedAudio && !requestedVideo) {
                        errors.audioOnlyError = err;

                        return [];
                    } else if (requestedVideo && !requestedAudio) {
                        errors.videoOnlyError = err;

                        return [];
                    }
                    logger.error('Should never happen');
                })
                .catch(err => {
                    // Log this just in case...
                    if (!requestedAudio) {
                        logger.error('The impossible just happened', err);
                    }
                    errors.audioOnlyError = err;

                    // Try video only...
                    return requestedVideo
                        ? createLocalTracksF({
                            devices: [ MEDIA_TYPE.VIDEO ],
                            firePermissionPromptIsShownEvent: true,
                            fireSlowPromiseEvent: true
                        })
                        : [];
                })
                .catch(err => {
                    // Log this just in case...
                    if (!requestedVideo) {
                        logger.error('The impossible just happened', err);
                    }
                    errors.videoOnlyError = err;

                    return [];
                });
        }

        // Hide the permissions prompt/overlay as soon as the tracks are
        // created. Don't wait for the connection to be made, since in some
        // cases, when auth is required, for instance, that won't happen until
        // the user inputs their credentials, but the dialog would be
        // overshadowed by the overlay.
        tryCreateLocalTracks.then(tracks => {
            APP.store.dispatch(toggleSlowGUMOverlay(false));
            APP.store.dispatch(mediaPermissionPromptVisibilityChanged(false));

            return tracks;
        });

        return {
            tryCreateLocalTracks,
            errors
        };
    },

    /**
     * Displays error notifications according to the state carried by {@code errors} object returned
     * by {@link createInitialLocalTracks}.
     * @param {Object} errors - the errors (if any) returned by {@link createInitialLocalTracks}.
     *
     * @returns {void}
     * @private
     */
    _displayErrorsForCreateInitialLocalTracks(errors) {
        const {
            audioAndVideoError,
            audioOnlyError,
            screenSharingError,
            videoOnlyError
        } = errors;

        // FIXME If there will be microphone error it will cover any screensharing dialog, but it's still better than in
        // the reverse order where the screensharing dialog will sometimes be closing the microphone alert
        // ($.prompt.close(); is called). Need to figure out dialogs chaining to fix that.
        if (screenSharingError) {
            this._handleScreenSharingError(screenSharingError);
        }
        if (audioAndVideoError || audioOnlyError) {
            if (audioOnlyError || videoOnlyError) {
                // If both requests for 'audio' + 'video' and 'audio' only failed, we assume that there are some
                // problems with user's microphone and show corresponding dialog.
                APP.store.dispatch(notifyMicError(audioOnlyError));
                APP.store.dispatch(notifyCameraError(videoOnlyError));
            } else {
                // If request for 'audio' + 'video' failed, but request for 'audio' only was OK, we assume that we had
                // problems with camera and show corresponding dialog.
                APP.store.dispatch(notifyCameraError(audioAndVideoError));
            }
        }
    },

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
        const { tryCreateLocalTracks, errors } = this.createInitialLocalTracks(options);

        return Promise.all([ tryCreateLocalTracks, connect(roomName) ])
            .then(([ tracks, con ]) => {

                this._displayErrorsForCreateInitialLocalTracks(errors);

                return [ tracks, con ];
            });
    },

    startConference(con, tracks) {
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

        con.addEventListener(JitsiConnectionEvents.CONNECTION_FAILED, _connectionFailedHandler);
        APP.connection = connection = con;

        this._createRoom(tracks);

        // if user didn't give access to mic or camera or doesn't have
        // them at all, we mark corresponding toolbar buttons as muted,
        // so that the user can try unmute later on and add audio/video
        // to the conference
        if (!tracks.find(t => t.isAudioTrack())) {
            this.setAudioMuteStatus(true);
        }

        if (!tracks.find(t => t.isVideoTrack())) {
            this.setVideoMuteStatus();
        }

        if (config.iAmRecorder) {
            this.recorder = new Recorder();
        }

        if (config.startSilent) {
            sendAnalytics(createStartSilentEvent());
            APP.store.dispatch(showNotification({
                descriptionKey: 'notify.startSilentDescription',
                titleKey: 'notify.startSilentTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        }

        // XXX The API will take care of disconnecting from the XMPP
        // server (and, thus, leaving the room) on unload.
        return new Promise((resolve, reject) => {
            new ConferenceConnector(resolve, reject).connect();
        });
    },

    /**
     * Open new connection and join the conference when prejoin page is not enabled.
     * If prejoin page is enabled open an new connection in the background
     * and create local tracks.
     *
     * @param {{ roomName: string }} options
     * @returns {Promise}
     */
    async init({ roomName }) {
        const initialOptions = {
            startAudioOnly: config.startAudioOnly,
            startScreenSharing: config.startScreenSharing,
            startWithAudioMuted: getStartWithAudioMuted(APP.store.getState())
                || config.startSilent
                || isUserInteractionRequiredForUnmute(APP.store.getState()),
            startWithVideoMuted: getStartWithVideoMuted(APP.store.getState())
                || isUserInteractionRequiredForUnmute(APP.store.getState())
        };

        this.roomName = roomName;

        try {
            // Initialize the device list first. This way, when creating tracks
            // based on preferred devices, loose label matching can be done in
            // cases where the exact ID match is no longer available, such as
            // when the camera device has switched USB ports.
            // when in startSilent mode we want to start with audio muted
            await this._initDeviceList();
        } catch (error) {
            logger.warn('initial device list initialization failed', error);
        }

        const handleStartAudioMuted = (options, tracks) => {
            if (options.startWithAudioMuted) {
                // Always add the track on Safari because of a known issue where audio playout doesn't happen
                // if the user joins audio and video muted, i.e., if there is no local media capture.
                if (browser.isWebKitBased()) {
                    this.muteAudio(true, true);
                } else {
                    return tracks.filter(track => track.getType() !== MEDIA_TYPE.AUDIO);
                }
            }

            return tracks;
        };

        if (isPrejoinPageVisible(APP.store.getState())) {
            _connectionPromise = connect(roomName).then(c => {
                // we want to initialize it early, in case of errors to be able
                // to gather logs
                APP.connection = c;

                return c;
            });

            if (_onConnectionPromiseCreated) {
                _onConnectionPromiseCreated();
            }

            APP.store.dispatch(makePrecallTest(this._getConferenceOptions()));

            const { tryCreateLocalTracks, errors } = this.createInitialLocalTracks(initialOptions);
            const tracks = await tryCreateLocalTracks;

            // Initialize device list a second time to ensure device labels
            // get populated in case of an initial gUM acceptance; otherwise
            // they may remain as empty strings.
            this._initDeviceList(true);

            if (isPrejoinPageVisible(APP.store.getState())) {
                return APP.store.dispatch(initPrejoin(tracks, errors));
            }

            logger.debug('Prejoin screen no longer displayed at the time when tracks were created');

            this._displayErrorsForCreateInitialLocalTracks(errors);

            let localTracks = handleStartAudioMuted(initialOptions, tracks);

            // in case where gum is slow and resolves after the startAudio/VideoMuted coming from jicofo, we can be
            // join unmuted even though jicofo had instruct us to mute, so let's respect that before passing the tracks
            if (!browser.isWebKitBased()) {
                if (room?.isStartAudioMuted()) {
                    localTracks = localTracks.filter(track => track.getType() !== MEDIA_TYPE.AUDIO);
                }
            }

            if (room?.isStartVideoMuted()) {
                localTracks = localTracks.filter(track => track.getType() !== MEDIA_TYPE.VIDEO);
            }

            return this._setLocalAudioVideoStreams(localTracks);
        }

        const [ tracks, con ] = await this.createInitialLocalTracksAndConnect(roomName, initialOptions);

        this._initDeviceList(true);

        return this.startConference(con, handleStartAudioMuted(initialOptions, tracks));
    },

    /**
     * Joins conference after the tracks have been configured in the prejoin screen.
     *
     * @param {Object[]} tracks - An array with the configured tracks
     * @returns {void}
     */
    async prejoinStart(tracks) {
        if (!_connectionPromise) {
            // The conference object isn't initialized yet. Wait for the promise to initialise.
            await new Promise(resolve => {
                _onConnectionPromiseCreated = resolve;
            });
            _onConnectionPromiseCreated = undefined;
        }

        let con;

        try {
            con = await _connectionPromise;
            this.startConference(con, tracks);
        } catch (error) {
            logger.error(`An error occurred while trying to join a meeting from the prejoin screen: ${error}`);
            APP.store.dispatch(setJoiningInProgress(false));
        }
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
            ? isLocalCameraTrackMuted(
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
        const state = APP.store.getState();

        if (!mute
            && isUserInteractionRequiredForUnmute(state)) {
            logger.error('Unmuting audio requires user interaction');

            return;
        }

        // check for A/V Moderation when trying to unmute
        if (!mute && shouldShowModeratedNotification(MEDIA_TYPE.AUDIO, state)) {
            if (!isModerationNotificationDisplayed(MEDIA_TYPE.AUDIO, state)) {
                APP.store.dispatch(showModeratedNotification(MEDIA_TYPE.AUDIO));
            }

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

        const localAudio = getLocalJitsiAudioTrack(APP.store.getState());

        if (!localAudio && !mute) {
            const maybeShowErrorDialog = error => {
                showUI && APP.store.dispatch(notifyMicError(error));
            };

            createLocalTracksF({ devices: [ 'audio' ] })
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
        const localVideo = getLocalJitsiVideoTrack(APP.store.getState());

        if (mute) {
            try {
                await localVideo.setEffect(undefined);
            } catch (err) {
                logger.error('Failed to remove the presenter effect', err);
                maybeShowErrorDialog(err);
            }
        } else {
            try {
                await localVideo.setEffect(await this._createPresenterStreamEffect());
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
        if (this.videoSwitchInProgress) {
            // Turning the camera on while the screen sharing mode is being turned off is causing issues around
            // the presenter mode handling. It should be okay for the user to click the button again once that's done.
            console.warn('muteVideo - unable to perform operations while video switch is in progress');

            return;
        }

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
            this.setVideoMuteStatus();

            return;
        } else if (this.isLocalVideoMuted() === mute) {
            // NO-OP
            return;
        }

        const localVideo = getLocalJitsiVideoTrack(APP.store.getState());

        if (!localVideo && !mute) {
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
            createLocalTracksF({ devices: [ 'video' ] })
                .then(([ videoTrack ]) => videoTrack)
                .catch(error => {
                    // FIXME should send some feedback to the API on error ?
                    maybeShowErrorDialog(error);

                    // Rollback the video muted status by using null track
                    return null;
                })
                .then(videoTrack => {
                    logger.debug(`muteVideo: calling useVideoStream for track: ${videoTrack}`);

                    return this.useVideoStream(videoTrack);
                });
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

    /**
     * Used by Jibri to detect when it's alone and the meeting should be terminated.
     */
    get membersCount() {
        return room.getParticipants()
            .filter(p => !p.isHidden() || !(config.iAmRecorder && p.isHiddenFromRecorder())).length + 1;
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

    /**
     * Download logs, a function that can be called from console while
     * debugging.
     * @param filename (optional) specify target filename
     */
    saveLogs(filename = 'meetlog.json') {
        // this can be called from console and will not have reference to this
        // that's why we reference the global var
        const logs = APP.connection.getLogs();

        downloadJSON(logs, filename);
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

    /**
     * Used by the Breakout Rooms feature to join a breakout room or go back to the main room.
     */
    async joinRoom(roomName, options) {
        // Reset VideoLayout. It's destroyed in features/video-layout/middleware.web.js so re-initialize it.
        VideoLayout.initLargeVideo();
        VideoLayout.resizeVideoArea();

        // Restore initial state.
        this._localTracksInitialized = false;
        this.isSharingScreen = false;
        this.localPresenterVideo = null;

        this.roomName = roomName;

        const { tryCreateLocalTracks, errors } = this.createInitialLocalTracks(options);
        const localTracks = await tryCreateLocalTracks;

        this._displayErrorsForCreateInitialLocalTracks(errors);
        localTracks.forEach(track => {
            if ((track.isAudioTrack() && this.isLocalAudioMuted())
                || (track.isVideoTrack() && this.isLocalVideoMuted())) {
                track.mute();
            }
        });
        this._createRoom(localTracks);

        return new Promise((resolve, reject) => {
            new ConferenceConnector(resolve, reject).connect();
        });
    },

    _createRoom(localTracks) {
        room = connection.initJitsiConference(APP.conference.roomName, this._getConferenceOptions());

        // Filter out the tracks that are muted (except on Safari).
        const tracks = browser.isWebKitBased() ? localTracks : localTracks.filter(track => !track.isMuted());

        this._setLocalAudioVideoStreams(tracks);
        this._room = room; // FIXME do not use this

        APP.store.dispatch(_conferenceWillJoin(room));

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
        const promises = tracks.map(track => {
            if (track.isAudioTrack()) {
                return this.useAudioStream(track);
            } else if (track.isVideoTrack()) {
                logger.debug(`_setLocalAudioVideoStreams is calling useVideoStream with track: ${track}`);

                return this.useVideoStream(track);
            }

            logger.error('Ignored not an audio nor a video track: ', track);

            return Promise.resolve();

        });

        return Promise.allSettled(promises).then(() => {
            this._localTracksInitialized = true;
            logger.log(`Initialized with ${tracks.length} local tracks`);
        });
    },

    _getConferenceOptions() {
        const options = getConferenceOptions(APP.store.getState());

        options.createVADProcessor = createRnnoiseProcessor;

        return options;
    },

    /**
     * Start using provided video stream.
     * Stops previous video stream.
     * @param {JitsiLocalTrack} newTrack - new track to use or null
     * @returns {Promise}
     */
    useVideoStream(newTrack) {
        const state = APP.store.getState();

        logger.debug(`useVideoStream: ${newTrack}`);

        return new Promise((resolve, reject) => {
            _replaceLocalVideoTrackQueue.enqueue(onFinish => {
                const oldTrack = getLocalJitsiVideoTrack(state);

                logger.debug(`useVideoStream: Replacing ${oldTrack} with ${newTrack}`);

                if (oldTrack === newTrack) {
                    resolve();
                    onFinish();

                    return;
                }

                // In the multi-stream mode, add the track to the conference if there is no existing track, replace it
                // otherwise.
                if (getMultipleVideoSupportFeatureFlag(state)) {
                    const trackAction = oldTrack
                        ? replaceLocalTrack(oldTrack, newTrack, room)
                        : addLocalTrack(newTrack);

                    APP.store.dispatch(trackAction)
                        .then(() => {
                            this.setVideoMuteStatus();
                        })
                        .then(resolve)
                        .catch(error => {
                            logger.error(`useVideoStream failed: ${error}`);
                            reject(error);
                        })
                        .then(onFinish);

                    return;
                }
                APP.store.dispatch(
                    replaceLocalTrack(oldTrack, newTrack, room))
                    .then(() => {
                        this._setSharingScreen(newTrack);
                        this.setVideoMuteStatus();
                    })
                    .then(resolve)
                    .catch(error => {
                        logger.error(`useVideoStream failed: ${error}`);
                        reject(error);
                    })
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
     * @param {JitsiLocalTrack} newTrack - new track to use or null
     * @returns {Promise}
     */
    useAudioStream(newTrack) {
        return new Promise((resolve, reject) => {
            _replaceLocalAudioTrackQueue.enqueue(onFinish => {
                const oldTrack = getLocalJitsiAudioTrack(APP.store.getState());

                if (oldTrack === newTrack) {
                    resolve();
                    onFinish();

                    return;
                }

                APP.store.dispatch(
                replaceLocalTrack(oldTrack, newTrack, room))
                    .then(() => {
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
     * @param {boolean} ignoreDidHaveVideo indicates if the camera video should be
     * ignored when switching screen sharing off.
     * @return {Promise} resolved after the screen sharing is turned off, or
     * rejected with some error (no idea what kind of error, possible GUM error)
     * in case it fails.
     * @private
     */
    async _turnScreenSharingOff(didHaveVideo, ignoreDidHaveVideo) {
        this._untoggleScreenSharing = null;
        this.videoSwitchInProgress = true;

        APP.store.dispatch(stopReceiver());

        this._stopProxyConnection();

        APP.store.dispatch(toggleScreenshotCaptureSummary(false));
        const tracks = APP.store.getState()['features/base/tracks'];
        const duration = getLocalVideoTrack(tracks)?.jitsiTrack.getDuration() ?? 0;

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
            const localAudio = getLocalJitsiAudioTrack(APP.store.getState());

            await localAudio.setEffect(undefined);
            await this._desktopAudioStream.dispose();
            this._mixerEffect = undefined;
            this._desktopAudioStream = undefined;

        // In case there was no local audio when screen sharing was started the fact that we set the audio stream to
        // null will take care of the desktop audio stream cleanup.
        } else if (this._desktopAudioStream) {
            await room.replaceTrack(this._desktopAudioStream, null);
            this._desktopAudioStream.dispose();
            this._desktopAudioStream = undefined;
        }

        APP.store.dispatch(setScreenAudioShareState(false));

        if (didHaveVideo && !ignoreDidHaveVideo) {
            promise = promise.then(() => createLocalTracksF({ devices: [ 'video' ] }))
                .then(([ stream ]) => {
                    logger.debug(`_turnScreenSharingOff using ${stream} for useVideoStream`);

                    return this.useVideoStream(stream);
                })
                .catch(error => {
                    logger.error('failed to switch back to local video', error);

                    return this.useVideoStream(null).then(() =>

                        // Still fail with the original err
                        Promise.reject(error)
                    );
                });
        } else {
            promise = promise.then(() => {
                logger.debug('_turnScreenSharingOff using null for useVideoStream');

                return this.useVideoStream(null);
            });
        }

        return promise.then(
            () => {
                this.videoSwitchInProgress = false;
                sendAnalytics(createScreenSharingEvent('stopped',
                    duration === 0 ? null : duration));
                logger.info('Screen sharing stopped.');
            },
            error => {
                this.videoSwitchInProgress = false;
                logger.error(`_turnScreenSharingOff failed: ${error}`);

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
     * @param {boolean} [options.audioOnly] - Whether or not audioOnly is enabled.
     * @param {Array<string>} [options.desktopSharingSources] - Array with the
     * sources that have to be displayed in the desktop picker window ('screen',
     * 'window', etc.).
     * @param {Object} [options.desktopStream] - An existing desktop stream to
     * use instead of creating a new desktop stream.
     * @param {boolean} ignoreDidHaveVideo - if true ignore if video was on when sharing started.
     * @return {Promise.<T>}
     */
    async toggleScreenSharing(toggle = !this._untoggleScreenSharing, options = {}, ignoreDidHaveVideo) {
        logger.debug(`toggleScreenSharing: ${toggle}`);
        if (this.videoSwitchInProgress) {
            return Promise.reject(`toggleScreenSharing: ${toggle} aborted - video switch in progress.`);
        }
        if (!JitsiMeetJS.isDesktopSharingEnabled()) {
            return Promise.reject('Cannot toggle screen sharing: not supported.');
        }

        if (this.isAudioOnly()) {
            APP.store.dispatch(setAudioOnly(false));
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
            ? this._untoggleScreenSharing(ignoreDidHaveVideo)
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
        const didHaveVideo = !this.isLocalVideoMuted();

        const getDesktopStreamPromise = options.desktopStream
            ? Promise.resolve([ options.desktopStream ])
            : createLocalTracksF({
                desktopSharingSourceDevice: options.desktopSharingSources
                    ? null : config._desktopSharingSourceDevice,
                desktopSharingSources: options.desktopSharingSources,
                devices: [ 'desktop' ]
            });

        return getDesktopStreamPromise.then(desktopStreams => {
            // Stores the "untoggle" handler which remembers whether was
            // there any video before and whether was it muted.
            this._untoggleScreenSharing
                = this._turnScreenSharingOff.bind(this, didHaveVideo);

            const desktopVideoStream = desktopStreams.find(stream => stream.getType() === MEDIA_TYPE.VIDEO);
            const desktopAudioStream = desktopStreams.find(stream => stream.getType() === MEDIA_TYPE.AUDIO);

            if (desktopAudioStream) {
                desktopAudioStream.on(
                    JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                    () => {
                        logger.debug(`Local screensharing audio track stopped. ${this.isSharingScreen}`);

                        // Handle case where screen share was stopped from  the browsers 'screen share in progress'
                        // window. If audio screen sharing is stopped via the normal UX flow this point shouldn't
                        // be reached.
                        isScreenAudioShared(APP.store.getState())
                            && this._untoggleScreenSharing
                            && this._untoggleScreenSharing();
                    }
                );
            }

            if (desktopVideoStream) {
                desktopVideoStream.on(
                    JitsiTrackEvents.LOCAL_TRACK_STOPPED,
                    () => {
                        logger.debug(`Local screensharing track stopped. ${this.isSharingScreen}`);

                        // If the stream was stopped during screen sharing
                        // session then we should switch back to video.
                        this.isSharingScreen
                            && this._untoggleScreenSharing
                            && this._untoggleScreenSharing();
                    }
                );
            }

            return desktopStreams;
        }, error => {
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
            const camera = cameraDeviceId ?? getUserSelectedCameraDeviceId(APP.store.getState());

            try {
                this.localPresenterVideo = await createLocalPresenterTrack({ cameraDeviceId: camera }, height);
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
            const localVideo = getLocalJitsiVideoTrack(APP.store.getState());
            const { height, width } = localVideo.track.getSettings() ?? localVideo.track.getConstraints();
            const isPortrait = height >= width;
            const DESKTOP_STREAM_CAP = 720;

            const highResolutionTrack
                = (isPortrait && width > DESKTOP_STREAM_CAP) || (!isPortrait && height > DESKTOP_STREAM_CAP);

            // Resizing the desktop track for presenter is causing blurriness of the desktop share on chrome.
            // Disable resizing by default, enable it only when config.js setting is enabled.
            const resizeDesktopStream = highResolutionTrack && config.videoQuality?.resizeDesktopForPresenter;

            if (resizeDesktopStream) {
                let desktopResizeConstraints = {};

                if (height && width) {
                    const advancedConstraints = [ { aspectRatio: (width / height).toPrecision(4) } ];
                    const constraint = isPortrait ? { width: DESKTOP_STREAM_CAP } : { height: DESKTOP_STREAM_CAP };

                    advancedConstraints.push(constraint);
                    desktopResizeConstraints.advanced = advancedConstraints;
                } else {
                    desktopResizeConstraints = {
                        width: 1280,
                        height: 720
                    };
                }

                // Apply the constraints on the desktop track.
                try {
                    await localVideo.track.applyConstraints(desktopResizeConstraints);
                } catch (err) {
                    logger.error('Failed to apply constraints on the desktop stream for presenter mode', err);

                    return;
                }
            }
            const trackHeight = resizeDesktopStream
                ? localVideo.track.getSettings().height ?? DESKTOP_STREAM_CAP
                : height;
            let effect;

            try {
                effect = await this._createPresenterStreamEffect(trackHeight);
            } catch (err) {
                logger.error('Failed to unmute Presenter Video', err);
                maybeShowErrorDialog(err);

                return;
            }

            // Replace the desktop track on the peerconnection.
            try {
                await localVideo.setEffect(effect);
                APP.store.dispatch(setVideoMuted(mute, MEDIA_TYPE.PRESENTER));
                this.setVideoMuteStatus();
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
                let desktopVideoStream = streams.find(stream => stream.getType() === MEDIA_TYPE.VIDEO);

                this._desktopAudioStream = streams.find(stream => stream.getType() === MEDIA_TYPE.AUDIO);

                const { audioOnly = false } = options;

                // If we're in audio only mode dispose of the video track otherwise the screensharing state will be
                // inconsistent.
                if (audioOnly) {
                    desktopVideoStream.dispose();
                    desktopVideoStream = undefined;

                    if (!this._desktopAudioStream) {
                        return Promise.reject(AUDIO_ONLY_SCREEN_SHARE_NO_TRACK);
                    }
                }

                if (desktopVideoStream) {
                    logger.debug(`_switchToScreenSharing is using ${desktopVideoStream} for useVideoStream`);
                    await this.useVideoStream(desktopVideoStream);
                }

                if (this._desktopAudioStream) {
                    const localAudio = getLocalJitsiAudioTrack(APP.store.getState());

                    // If there is a localAudio stream, mix in the desktop audio stream captured by the screen sharing
                    // api.
                    if (localAudio) {
                        this._mixerEffect = new AudioMixerEffect(this._desktopAudioStream);
                        logger.debug(`_switchToScreenSharing is mixing ${this._desktopAudioStream} and ${localAudio}`
                        + ' as a single audio stream');
                        await localAudio.setEffect(this._mixerEffect);
                    } else {
                        // If no local stream is present ( i.e. no input audio devices) we use the screen share audio
                        // stream as we would use a regular stream.
                        logger.debug(`_switchToScreenSharing is using ${this._desktopAudioStream} for replacing it as`
                        + ' the only audio track on the conference');
                        await room.replaceTrack(null, this._desktopAudioStream);
                    }
                    APP.store.dispatch(setScreenAudioShareState(true));
                }
            })
            .then(() => {
                this.videoSwitchInProgress = false;
                if (isScreenshotCaptureEnabled(APP.store.getState(), false, true)) {
                    APP.store.dispatch(toggleScreenshotCaptureSummary(true));
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
     * the dialog was canceled on user's request or display an error if
     * screensharing couldn't be started.
     * @param {JitsiTrackError} error - The error returned by
     * {@link _createDesktopTrack} Promise.
     * @private
     */
    _handleScreenSharingError(error) {
        if (error.name === JitsiTrackErrors.SCREENSHARING_USER_CANCELED) {
            return;
        }

        logger.error('failed to share local desktop', error);

        // Handling:
        // JitsiTrackErrors.CONSTRAINT_FAILED
        // JitsiTrackErrors.PERMISSION_DENIED
        // JitsiTrackErrors.SCREENSHARING_GENERIC_ERROR
        // and any other
        let descriptionKey;
        let titleKey;

        if (error.name === JitsiTrackErrors.PERMISSION_DENIED) {
            descriptionKey = 'dialog.screenSharingPermissionDeniedError';
            titleKey = 'dialog.screenSharingFailedTitle';
        } else if (error.name === JitsiTrackErrors.CONSTRAINT_FAILED) {
            descriptionKey = 'dialog.cameraConstraintFailedError';
            titleKey = 'deviceError.cameraError';
        } else if (error.name === JitsiTrackErrors.SCREENSHARING_GENERIC_ERROR) {
            descriptionKey = 'dialog.screenSharingFailed';
            titleKey = 'dialog.screenSharingFailedTitle';
        } else if (error === AUDIO_ONLY_SCREEN_SHARE_NO_TRACK) {
            descriptionKey = 'notify.screenShareNoAudio';
            titleKey = 'notify.screenShareNoAudioTitle';
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
            JitsiConferenceEvents.CONFERENCE_JOIN_IN_PROGRESS,
            () => APP.store.dispatch(conferenceJoinInProgress(room)));

        room.on(
            JitsiConferenceEvents.CONFERENCE_LEFT,
            (...args) => {
                APP.store.dispatch(conferenceTimestampChanged(0));
                APP.store.dispatch(conferenceLeft(room, ...args));
            });

        room.on(
            JitsiConferenceEvents.CONFERENCE_UNIQUE_ID_SET,
            (...args) => {
                // Preserve the sessionId so that the value is accessible even after room
                // is disconnected.
                room.sessionId = room.getMeetingUniqueId();
                APP.store.dispatch(conferenceUniqueIdSet(room, ...args));
            });

        room.on(
            JitsiConferenceEvents.AUTH_STATUS_CHANGED,
            (authEnabled, authLogin) =>
                APP.store.dispatch(authStatusChanged(authEnabled, authLogin)));

        room.on(JitsiConferenceEvents.PARTCIPANT_FEATURES_CHANGED, user => {
            APP.store.dispatch(updateRemoteParticipantFeatures(user));
        });
        room.on(JitsiConferenceEvents.USER_JOINED, (id, user) => {
            if (config.iAmRecorder && user.isHiddenFromRecorder()) {
                return;
            }

            // The logic shared between RN and web.
            commonUserJoinedHandling(APP.store, room, user);

            if (user.isHidden()) {
                return;
            }

            APP.store.dispatch(updateRemoteParticipantFeatures(user));
            logger.log(`USER ${id} connected:`, user);
            APP.UI.addUser(user);
        });

        room.on(JitsiConferenceEvents.USER_LEFT, (id, user) => {
            // The logic shared between RN and web.
            commonUserLeftHandling(APP.store, room, user);

            if (user.isHidden()) {
                return;
            }

            logger.log(`USER ${id} LEFT:`, user);
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

                if (role === 'moderator') {
                    APP.store.dispatch(maybeSetLobbyChatMessageListener());
                }

                APP.store.dispatch(localParticipantRoleChanged(role));
                APP.API.notifyUserRoleChanged(id, role);
            } else {
                APP.store.dispatch(participantRoleChanged(id, role));
            }
        });

        room.on(JitsiConferenceEvents.TRACK_ADDED, track => {
            if (!track || track.isLocal()) {
                return;
            }

            if (config.iAmRecorder) {
                const participant = room.getParticipantById(track.getParticipantId());

                if (participant.isHiddenFromRecorder()) {
                    return;
                }
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
            const localAudio = getLocalJitsiAudioTrack(APP.store.getState());
            let newLvl = lvl;

            if (this.isLocalId(id)) {
                APP.store.dispatch(localParticipantAudioLevelChanged(lvl));
            }

            if (this.isLocalId(id) && localAudio?.isMuted()) {
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
                APP.store.dispatch(participantMutedUs(participantThatMutedUs, track));
                if (this.isSharingScreen && track.isVideoTrack()) {
                    logger.debug('TRACK_MUTE_CHANGED while screen sharing');
                    this._turnScreenSharingOff(false);
                }
            }
        });

        room.on(JitsiConferenceEvents.TRACK_UNMUTE_REJECTED, track => APP.store.dispatch(destroyLocalTracks(track)));

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
            (dominant, previous) => APP.store.dispatch(dominantSpeakerChanged(dominant, previous, room)));

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
                const state = APP.store.getState();
                const {
                    defaultRemoteDisplayName
                } = state['features/base/config'];

                APP.store.dispatch(participantUpdated({
                    conference: room,
                    id,
                    name: formattedDisplayName
                }));

                if (getSourceNameSignalingFeatureFlag(state)) {
                    const screenshareParticipantId = getScreenshareParticipantByOwnerId(state, id)?.id;

                    if (screenshareParticipantId) {
                        APP.store.dispatch(
                            screenshareParticipantDisplayNameChanged(screenshareParticipantId, formattedDisplayName)
                        );
                    }
                }

                APP.API.notifyDisplayNameChanged(id, {
                    displayName: formattedDisplayName,
                    formattedDisplayName:
                        appendSuffix(
                            formattedDisplayName
                                || defaultRemoteDisplayName)
                });
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
            JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED,
            (...args) => APP.store.dispatch(nonParticipantMessageReceived(...args)));

        room.on(
            JitsiConferenceEvents.LOCK_STATE_CHANGED,
            (...args) => APP.store.dispatch(lockStateChanged(room, ...args)));

        room.on(JitsiConferenceEvents.KICKED, (participant, reason, isReplaced) => {
            if (isReplaced) {
                // this event triggers when the local participant is kicked, `participant`
                // is the kicker. In replace participant case, kicker is undefined,
                // as the server initiated it. We mark in store the local participant
                // as being replaced based on jwt.
                const localParticipant = getLocalParticipant(APP.store.getState());

                APP.store.dispatch(participantUpdated({
                    conference: room,
                    id: localParticipant.id,
                    isReplaced
                }));

                // we send readyToClose when kicked participant is replace so that
                // embedding app can choose to dispose the iframe API on the handler.
                APP.API.notifyReadyToClose();
            }
            APP.store.dispatch(kickedOut(room, participant));
        });

        room.on(JitsiConferenceEvents.PARTICIPANT_KICKED, (kicker, kicked) => {
            APP.store.dispatch(participantKicked(kicker, kicked));
        });

        room.on(JitsiConferenceEvents.SUSPEND_DETECTED, () => {
            APP.store.dispatch(suspendDetected());
        });

        room.on(
            JitsiConferenceEvents.AUDIO_UNMUTE_PERMISSIONS_CHANGED,
            disableAudioMuteChange => {
                APP.store.dispatch(setAudioUnmutePermissions(disableAudioMuteChange));
            });
        room.on(
            JitsiConferenceEvents.VIDEO_UNMUTE_PERMISSIONS_CHANGED,
            disableVideoMuteChange => {
                APP.store.dispatch(setVideoUnmutePermissions(disableVideoMuteChange));
            });

        room.on(
            JitsiE2ePingEvents.E2E_RTT_CHANGED,
            (...args) => APP.store.dispatch(e2eRttChanged(...args)));

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
            const audioMuted = room.isStartAudioMuted();
            const videoMuted = room.isStartVideoMuted();
            const localTracks = getLocalTracks(APP.store.getState()['features/base/tracks']);
            const promises = [];

            APP.store.dispatch(setAudioMuted(audioMuted));
            APP.store.dispatch(setVideoMuted(videoMuted));

            // Remove the tracks from the peerconnection.
            for (const track of localTracks) {
                // Always add the track on Safari because of a known issue where audio playout doesn't happen
                // if the user joins audio and video muted, i.e., if there is no local media capture.
                if (audioMuted && track.jitsiTrack?.getType() === MEDIA_TYPE.AUDIO && !browser.isWebKitBased()) {
                    promises.push(this.useAudioStream(null));
                }
                if (videoMuted && track.jitsiTrack?.getType() === MEDIA_TYPE.VIDEO) {
                    promises.push(this.useVideoStream(null));
                }
            }

            Promise.allSettled(promises)
                .then(() => {
                    APP.store.dispatch(showNotification({
                        titleKey: 'notify.mutedTitle',
                        descriptionKey: 'notify.muted'
                    }, NOTIFICATION_TIMEOUT_TYPE.SHORT));
                });
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

        APP.UI.addListener(UIEvents.AUTH_CLICKED, () => {
            AuthHandler.authenticate(room);
        });

        APP.UI.addListener(
            UIEvents.VIDEO_DEVICE_CHANGED,
            cameraDeviceId => {
                const localVideo = getLocalJitsiVideoTrack(APP.store.getState());
                const videoWasMuted = this.isLocalVideoMuted();

                sendAnalytics(createDeviceChangedEvent('video', 'input'));

                // If both screenshare and video are in progress, restart the
                // presenter mode with the new camera device.
                if (this.isSharingScreen && !videoWasMuted) {
                    const { height } = localVideo.track.getSettings();

                    // dispose the existing presenter track and create a new
                    // camera track.
                    // FIXME JitsiLocalTrack.dispose is async and should be waited for
                    this.localPresenterVideo && this.localPresenterVideo.dispose();
                    this.localPresenterVideo = null;

                    return this._createPresenterStreamEffect(height, cameraDeviceId)
                        .then(effect => localVideo.setEffect(effect))
                        .then(() => {
                            this.setVideoMuteStatus();
                            logger.log('Switched local video device while screen sharing and the video is unmuted');
                            this._updateVideoDeviceId();
                        })
                        .catch(err => APP.store.dispatch(notifyCameraError(err)));

                // If screenshare is in progress but video is muted, update the default device
                // id for video, dispose the existing presenter track and create a new effect
                // that can be applied on un-mute.
                } else if (this.isSharingScreen && videoWasMuted) {
                    logger.log('Switched local video device: while screen sharing and the video is muted');
                    const { height } = localVideo.track.getSettings();

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
                    .then(stream => {
                        logger.log('Switching the local video device.');

                        return this.useVideoStream(stream);
                    })
                    .then(() => {
                        logger.log('Switched local video device.');
                        this._updateVideoDeviceId();
                    })
                    .catch(error => {
                        logger.error(`Switching the local video device failed: ${error}`);

                        return APP.store.dispatch(notifyCameraError(error));
                    });
                }
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_DEVICE_CHANGED,
            micDeviceId => {
                const audioWasMuted = this.isLocalAudioMuted();

                // When the 'default' mic needs to be selected, we need to
                // pass the real device id to gUM instead of 'default' in order
                // to get the correct MediaStreamTrack from chrome because of the
                // following bug.
                // https://bugs.chromium.org/p/chromium/issues/detail?id=997689
                const hasDefaultMicChanged = micDeviceId === 'default';

                sendAnalytics(createDeviceChangedEvent('audio', 'input'));
                createLocalTracksF({
                    devices: [ 'audio' ],
                    cameraDeviceId: null,
                    micDeviceId: hasDefaultMicChanged
                        ? getDefaultDeviceId(APP.store.getState(), 'audioInput')
                        : micDeviceId
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
                    const localAudio = getLocalJitsiAudioTrack(APP.store.getState());

                    if (localAudio && hasDefaultMicChanged) {
                        // workaround for the default device to be shown as selected in the
                        // settings even when the real device id was passed to gUM because of the
                        // above mentioned chrome bug.
                        localAudio._realDeviceId = localAudio.deviceId = 'default';
                    }
                    logger.log(`switched local audio device: ${localAudio?.getDeviceId()}`);

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
            const displayedUserId = APP.UI.getLargeVideoID();

            if (displayedUserId) {
                APP.UI.updateLargeVideo(displayedUserId, true);
            }
        });

        APP.UI.addListener(
            UIEvents.TOGGLE_SCREENSHARING, ({ enabled, audioOnly, ignoreDidHaveVideo }) => {
                this.toggleScreenSharing(enabled, { audioOnly }, ignoreDidHaveVideo);
            }
        );
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
    },

    /**
     * Callback invoked when the conference has been successfully joined.
     * Initializes the UI and various other features.
     *
     * @private
     * @returns {void}
     */
    _onConferenceJoined() {
        const { dispatch } = APP.store;

        APP.UI.initConference();

        if (!config.disableShortcuts) {
            APP.keyboardshortcut.init();
        }

        dispatch(conferenceJoined(room));

        const jwt = APP.store.getState()['features/base/jwt'];

        if (jwt?.user?.hiddenFromRecorder) {
            dispatch(muteLocal(true, MEDIA_TYPE.AUDIO));
            dispatch(muteLocal(true, MEDIA_TYPE.VIDEO));
            dispatch(setAudioUnmutePermissions(true, true));
            dispatch(setVideoUnmutePermissions(true, true));
        }
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
        const localVideo = getLocalJitsiVideoTrack(APP.store.getState());

        if (localVideo && localVideo.videoType === 'camera') {
            APP.store.dispatch(updateSettings({
                cameraDeviceId: localVideo.getDeviceId()
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
        const localAudio = getLocalJitsiAudioTrack(APP.store.getState());

        if (localAudio) {
            APP.store.dispatch(updateSettings({
                micDeviceId: localAudio.getDeviceId()
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
        const localAudio = getLocalJitsiAudioTrack(APP.store.getState());
        const localVideo = getLocalJitsiVideoTrack(APP.store.getState());

        APP.store.dispatch(updateDeviceList(devices));

        // Firefox users can choose their preferred device in the gUM prompt. In that case
        // we should respect that and not attempt to switch to the preferred device from
        // our settings.
        const newLabelsOnly = mediaDeviceHelper.newDeviceListAddedLabelsOnly(oldDevices, devices);
        const newDevices
            = mediaDeviceHelper.getNewMediaDevicesAfterDeviceListChanged(
                devices,
                this.isSharingScreen,
                localVideo,
                localAudio,
                newLabelsOnly);
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
        if (requestedInput.audio && localAudio) {
            localAudio.stopStream();
        }

        if (requestedInput.video && localVideo) {
            localVideo.stopStream();
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

        // When the 'default' mic needs to be selected, we need to
        // pass the real device id to gUM instead of 'default' in order
        // to get the correct MediaStreamTrack from chrome because of the
        // following bug.
        // https://bugs.chromium.org/p/chromium/issues/detail?id=997689
        const hasDefaultMicChanged = newDevices.audioinput === 'default';

        // This is the case when the local video is muted and a preferred device is connected.
        if (requestedInput.video && this.isLocalVideoMuted()) {
            // We want to avoid creating a new video track in order to prevent turning on the camera.
            requestedInput.video = false;
            APP.store.dispatch(updateSettings({ // Update the current selected camera for the device selection dialog.
                cameraDeviceId: newDevices.videoinput
            }));
            delete newDevices.videoinput;

            // Removing the current video track in order to force the unmute to select the preferred device.
            logger.debug('_onDeviceListChanged: Removing the current video track.');
            this.useVideoStream(null);

        }

        promises.push(
            mediaDeviceHelper.createLocalTracksAfterDeviceListChanged(
                    createLocalTracksF,
                    newDevices.videoinput,
                    hasDefaultMicChanged
                        ? getDefaultDeviceId(APP.store.getState(), 'audioInput')
                        : newDevices.audioinput)
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
                                    const track = tracks.find(t => t.getType() === mediaType) || null;

                                    // Use the new stream or null if we failed to obtain it.
                                    return useStream(track)
                                        .then(() => {
                                            if (track?.isAudioTrack() && hasDefaultMicChanged) {
                                                // workaround for the default device to be shown as selected in the
                                                // settings even when the real device id was passed to gUM because of
                                                // the above mentioned chrome bug.
                                                track._realDeviceId = track.deviceId = 'default';
                                            }
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
        const localAudio = getLocalJitsiAudioTrack(APP.store.getState());
        const audioMediaDevices = APP.store.getState()['features/base/devices'].availableDevices.audioInput;
        const audioDeviceCount = audioMediaDevices ? audioMediaDevices.length : 0;

        // The audio functionality is considered available if there are any
        // audio devices detected or if the local audio stream already exists.
        const available = audioDeviceCount > 0 || Boolean(localAudio);

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
        const localVideo = getLocalJitsiVideoTrack(APP.store.getState());

        // The video functionality is considered available if there are any
        // video devices detected or if there is local video stream already
        // active which could be either screensharing stream or a video track
        // created before the permissions were rejected (through browser
        // config).
        const available = videoDeviceCount > 0 || Boolean(localVideo);

        APP.store.dispatch(setVideoAvailable(available));
        APP.API.notifyVideoAvailabilityChanged(available);
    },

    /**
     * Disconnect from the conference and optionally request user feedback.
     * @param {boolean} [requestFeedback=false] if user feedback should be
     * requested
     */
    hangup(requestFeedback = false) {
        APP.store.dispatch(disableReceiver());

        this._stopProxyConnection();

        APP.store.dispatch(destroyLocalTracks());
        this._localTracksInitialized = false;

        // Remove unnecessary event listeners from firing callbacks.
        if (this.deviceChangeListener) {
            JitsiMeetJS.mediaDevices.removeEventListener(
                JitsiMediaDevicesEvents.DEVICE_LIST_CHANGED,
                this.deviceChangeListener);
        }

        APP.UI.removeAllListeners();

        let requestFeedbackPromise;

        if (requestFeedback) {
            requestFeedbackPromise
                = APP.store.dispatch(maybeOpenFeedbackDialog(room))

                    // false because the thank you dialog shouldn't be displayed
                    .catch(() => Promise.resolve(false));
        } else {
            requestFeedbackPromise = Promise.resolve(true);
        }

        Promise.all([
            requestFeedbackPromise,
            this.leaveRoom()
        ])
        .then(values => {
            this._room = undefined;
            room = undefined;

            /**
             * Don't call {@code notifyReadyToClose} if the promotional page flag is set
             * and let the page take care of sending the message, since there will be
             * a redirect to the page regardlessly.
             */
            if (!interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE) {
                APP.API.notifyReadyToClose();
            }
            APP.store.dispatch(maybeRedirectToWelcomePage(values[0]));
        });
    },

    /**
     * Leaves the room.
     *
     * @param {boolean} doDisconnect - Wether leaving the room should also terminate the connection.
     * @returns {Promise}
     */
    async leaveRoom(doDisconnect = true) {
        APP.store.dispatch(conferenceWillLeave(room));

        if (room && room.isJoined()) {
            return room.leave().finally(() => {
                if (doDisconnect) {
                    return disconnect();
                }
            });
        }

        if (doDisconnect) {
            return disconnect();
        }
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
     */
    setVideoMuteStatus() {
        APP.UI.setVideoMuted(this.getMyUserId());
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
