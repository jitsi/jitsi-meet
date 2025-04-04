/* global APP, JitsiMeetJS, config, interfaceConfig */

import { jitsiLocalStorage } from '@jitsi/js-utils';
import Logger from '@jitsi/logger';

import { ENDPOINT_TEXT_MESSAGE_NAME } from './modules/API/constants';
import mediaDeviceHelper from './modules/devices/mediaDeviceHelper';
import Recorder from './modules/recorder/Recorder';
import { createTaskQueue } from './modules/util/helpers';
import {
    createDeviceChangedEvent,
    createScreenSharingEvent,
    createStartSilentEvent,
    createTrackMutedEvent
} from './react/features/analytics/AnalyticsEvents';
import { sendAnalytics } from './react/features/analytics/functions';
import {
    maybeRedirectToWelcomePage,
    reloadWithStoredParams
} from './react/features/app/actions';
import { showModeratedNotification } from './react/features/av-moderation/actions';
import { shouldShowModeratedNotification } from './react/features/av-moderation/functions';
import {
    _conferenceWillJoin,
    authStatusChanged,
    conferenceFailed,
    conferenceJoinInProgress,
    conferenceJoined,
    conferenceLeft,
    conferencePropertiesChanged,
    conferenceSubjectChanged,
    conferenceTimestampChanged,
    conferenceUniqueIdSet,
    conferenceWillInit,
    conferenceWillLeave,
    dataChannelClosed,
    dataChannelOpened,
    e2eRttChanged,
    endpointMessageReceived,
    kickedOut,
    lockStateChanged,
    nonParticipantMessageReceived,
    onStartMutedPolicyChanged,
    p2pStatusChanged
} from './react/features/base/conference/actions';
import {
    AVATAR_URL_COMMAND,
    CONFERENCE_LEAVE_REASONS,
    EMAIL_COMMAND
} from './react/features/base/conference/constants';
import {
    commonUserJoinedHandling,
    commonUserLeftHandling,
    getConferenceOptions,
    sendLocalParticipant
} from './react/features/base/conference/functions';
import { getReplaceParticipant, getSsrcRewritingFeatureFlag } from './react/features/base/config/functions';
import { connect } from './react/features/base/connection/actions.web';
import {
    checkAndNotifyForNewDevice,
    getAvailableDevices,
    notifyCameraError,
    notifyMicError,
    updateDeviceList
} from './react/features/base/devices/actions.web';
import {
    areDevicesDifferent,
    filterIgnoredDevices,
    flattenAvailableDevices,
    getDefaultDeviceId,
    logDevices,
    setAudioOutputDeviceId
} from './react/features/base/devices/functions.web';
import {
    JitsiConferenceErrors,
    JitsiConferenceEvents,
    JitsiE2ePingEvents,
    JitsiMediaDevicesEvents,
    JitsiTrackEvents,
    browser
} from './react/features/base/lib-jitsi-meet';
import {
    gumPending,
    setAudioAvailable,
    setAudioMuted,
    setAudioUnmutePermissions,
    setInitialGUMPromise,
    setVideoAvailable,
    setVideoMuted,
    setVideoUnmutePermissions
} from './react/features/base/media/actions';
import { MEDIA_TYPE, VIDEO_TYPE } from './react/features/base/media/constants';
import {
    getStartWithAudioMuted,
    getStartWithVideoMuted,
    isVideoMutedByUser
} from './react/features/base/media/functions';
import { IGUMPendingState } from './react/features/base/media/types';
import {
    dominantSpeakerChanged,
    localParticipantAudioLevelChanged,
    localParticipantRoleChanged,
    participantKicked,
    participantMutedUs,
    participantPresenceChanged,
    participantRoleChanged,
    participantSourcesUpdated,
    participantUpdated,
    screenshareParticipantDisplayNameChanged,
    updateRemoteParticipantFeatures
} from './react/features/base/participants/actions';
import {
    getLocalParticipant,
    getNormalizedDisplayName,
    getParticipantByIdOrUndefined,
    getVirtualScreenshareParticipantByOwnerId
} from './react/features/base/participants/functions';
import { updateSettings } from './react/features/base/settings/actions';
import {
    addLocalTrack,
    createInitialAVTracks,
    destroyLocalTracks,
    displayErrorsForCreateInitialLocalTracks,
    replaceLocalTrack,
    setGUMPendingStateOnFailedTracks,
    toggleScreensharing as toggleScreensharingA,
    trackAdded,
    trackRemoved
} from './react/features/base/tracks/actions';
import {
    createLocalTracksF,
    getLocalJitsiAudioTrack,
    getLocalJitsiVideoTrack,
    getLocalTracks,
    getLocalVideoTrack,
    isLocalTrackMuted,
    isUserInteractionRequiredForUnmute
} from './react/features/base/tracks/functions';
import { downloadJSON } from './react/features/base/util/downloadJSON';
import { getJitsiMeetGlobalNSConnectionTimes } from './react/features/base/util/helpers';
import { openLeaveReasonDialog } from './react/features/conference/actions.web';
import { showDesktopPicker } from './react/features/desktop-picker/actions';
import { appendSuffix } from './react/features/display-name/functions';
import { maybeOpenFeedbackDialog, submitFeedback } from './react/features/feedback/actions';
import { maybeSetLobbyChatMessageListener } from './react/features/lobby/actions.any';
import { setNoiseSuppressionEnabled } from './react/features/noise-suppression/actions';
import {
    hideNotification,
    showErrorNotification,
    showNotification,
    showWarningNotification
} from './react/features/notifications/actions';
import {
    DATA_CHANNEL_CLOSED_NOTIFICATION_ID,
    NOTIFICATION_TIMEOUT_TYPE
} from './react/features/notifications/constants';
import { isModerationNotificationDisplayed } from './react/features/notifications/functions';
import { suspendDetected } from './react/features/power-monitor/actions';
import { initPrejoin, isPrejoinPageVisible } from './react/features/prejoin/functions';
import { disableReceiver, stopReceiver } from './react/features/remote-control/actions';
import { setScreenAudioShareState } from './react/features/screen-share/actions.web';
import { isScreenAudioShared } from './react/features/screen-share/functions';
import { toggleScreenshotCaptureSummary } from './react/features/screenshot-capture/actions';
import { AudioMixerEffect } from './react/features/stream-effects/audio-mixer/AudioMixerEffect';
import { createRnnoiseProcessor } from './react/features/stream-effects/rnnoise';
import { handleToggleVideoMuted } from './react/features/toolbox/actions.any';
import { transcriberJoined, transcriberLeft } from './react/features/transcribing/actions';
import { muteLocal } from './react/features/video-menu/actions.any';

const logger = Logger.getLogger(__filename);
let room;

/*
 * Logic to open a desktop picker put on the window global for
 * lib-jitsi-meet to detect and invoke.
 *
 * TODO: remove once the Electron SDK supporting gDM has been out for a while.
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
    constructor(resolve, reject, conference) {
        this._conference = conference;
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

        case JitsiConferenceErrors.RESERVATION_ERROR: {
            const [ code, msg ] = params;

            APP.store.dispatch(showErrorNotification({
                descriptionArguments: {
                    code,
                    msg
                },
                descriptionKey: 'dialog.reservationErrorMsg',
                titleKey: 'dialog.reservationError'
            }));
            break;
        }

        case JitsiConferenceErrors.GRACEFUL_SHUTDOWN:
            APP.store.dispatch(showErrorNotification({
                descriptionKey: 'dialog.gracefulShutdown',
                titleKey: 'dialog.serviceUnavailable'
            }));
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
            room.leave(CONFERENCE_LEAVE_REASONS.UNRECOVERABLE_ERROR).then(() => APP.connection.disconnect());
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

    if (!APP.connection) {
        return onDisconnected();
    }

    return APP.connection.disconnect().then(onDisconnected, onDisconnected);
}

export default {
    /**
     * Flag used to delay modification of the muted status of local media tracks
     * until those are created (or not, but at that point it's certain that
     * the tracks won't exist).
     */
    _localTracksInitialized: false,

    /**
     * Flag used to prevent the creation of another local video track in this.muteVideo if one is already in progress.
     */
    isCreatingLocalTrack: false,

    isSharingScreen: false,

    /**
     * Returns an object containing a promise which resolves with the created tracks &
     * the errors resulting from that process.
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
     * @param {boolean} recordTimeMetrics - If true time metrics will be recorded.
     * @returns {Promise<JitsiLocalTrack[]>, Object}
     */
    createInitialLocalTracks(options = {}, recordTimeMetrics = false) {
        const errors = {};

        // Always get a handle on the audio input device so that we have statistics (such as "No audio input" or
        // "Are you trying to speak?" ) even if the user joins the conference muted.
        const initialDevices = config.startSilent || config.disableInitialGUM ? [] : [ MEDIA_TYPE.AUDIO ];
        const requestedAudio = !config.disableInitialGUM;
        let requestedVideo = false;

        if (!config.disableInitialGUM
                && !options.startWithVideoMuted
                && !options.startAudioOnly
                && !options.startScreenSharing) {
            initialDevices.push(MEDIA_TYPE.VIDEO);
            requestedVideo = true;
        }

        let tryCreateLocalTracks = Promise.resolve([]);

        // On Electron there is no permission prompt for granting permissions. That's why we don't need to
        // spend much time displaying the overlay screen. If GUM is not resolved within 15 seconds it will
        // probably never resolve.
        const timeout = browser.isElectron() ? 15000 : 60000;
        const audioOptions = {
            devices: [ MEDIA_TYPE.AUDIO ],
            timeout
        };

        // Spot uses the _desktopSharingSourceDevice config option to use an external video input device label as
        // screenshare and calls getUserMedia instead of getDisplayMedia for capturing the media.
        if (options.startScreenSharing && config._desktopSharingSourceDevice) {
            tryCreateLocalTracks = this._createDesktopTrack()
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
        } else if (requestedAudio || requestedVideo) {
            tryCreateLocalTracks = APP.store.dispatch(createInitialAVTracks({
                devices: initialDevices,
                timeout
            }, recordTimeMetrics)).then(({ tracks, errors: pErrors }) => {
                Object.assign(errors, pErrors);

                return tracks;
            });
        }

        return {
            tryCreateLocalTracks,
            errors
        };
    },

    startConference(tracks) {
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

        this._createRoom(tracks);

        // if user didn't give access to mic or camera or doesn't have
        // them at all, we mark corresponding toolbar buttons as muted,
        // so that the user can try unmute later on and add audio/video
        // to the conference
        if (!tracks.find(t => t.isAudioTrack())) {
            this.updateAudioIconEnabled();
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
            new ConferenceConnector(resolve, reject, this).connect();
        });
    },

    /**
     * Open new connection and join the conference when prejoin page is not enabled.
     * If prejoin page is enabled open an new connection in the background
     * and create local tracks.
     *
     * @param {{ roomName: string, shouldDispatchConnect }} options
     * @returns {Promise}
     */
    async init({ roomName, shouldDispatchConnect }) {
        const state = APP.store.getState();
        const initialOptions = {
            startAudioOnly: config.startAudioOnly,
            startScreenSharing: config.startScreenSharing,
            startWithAudioMuted: getStartWithAudioMuted(state) || isUserInteractionRequiredForUnmute(state),
            startWithVideoMuted: getStartWithVideoMuted(state) || isUserInteractionRequiredForUnmute(state)
        };
        const connectionTimes = getJitsiMeetGlobalNSConnectionTimes();
        const startTime = window.performance.now();

        connectionTimes['conference.init.start'] = startTime;

        logger.debug(`Executed conference.init with roomName: ${roomName} (performance.now=${startTime})`);

        this.roomName = roomName;

        try {
            // Initialize the device list first. This way, when creating tracks based on preferred devices, loose label
            // matching can be done in cases where the exact ID match is no longer available, such as -
            // 1. When the camera device has switched USB ports.
            // 2. When in startSilent mode we want to start with audio muted
            await this._initDeviceList();
        } catch (error) {
            logger.warn('initial device list initialization failed', error);
        }

        // Filter out the local tracks based on various config options, i.e., when user joins muted or is muted by
        // focus. However, audio track will always be created even though it is not added to the conference since we
        // want audio related features (noisy mic, talk while muted, etc.) to work even if the mic is muted.
        const handleInitialTracks = (options, tracks) => {
            let localTracks = tracks;

            if (options.startWithAudioMuted) {
                // Always add the track on Safari because of a known issue where audio playout doesn't happen
                // if the user joins audio and video muted, i.e., if there is no local media capture.
                if (browser.isWebKitBased()) {
                    this.muteAudio(true, true);
                } else {
                    localTracks = localTracks.filter(track => track.getType() !== MEDIA_TYPE.AUDIO);
                }
            }

            return localTracks;
        };
        const { dispatch, getState } = APP.store;
        const createLocalTracksStart = window.performance.now();

        connectionTimes['conference.init.createLocalTracks.start'] = createLocalTracksStart;

        logger.debug(`(TIME) createInitialLocalTracks: ${createLocalTracksStart} `);

        const { tryCreateLocalTracks, errors } = this.createInitialLocalTracks(initialOptions, true);

        tryCreateLocalTracks.then(tr => {
            const createLocalTracksEnd = window.performance.now();

            connectionTimes['conference.init.createLocalTracks.end'] = createLocalTracksEnd;
            logger.debug(`(TIME) createInitialLocalTracks finished: ${createLocalTracksEnd} `);
            const tracks = handleInitialTracks(initialOptions, tr);

            this._initDeviceList(true);

            const { initialGUMPromise } = getState()['features/base/media'];

            if (isPrejoinPageVisible(getState())) {
                dispatch(gumPending([ MEDIA_TYPE.AUDIO, MEDIA_TYPE.VIDEO ], IGUMPendingState.NONE));

                // Since the conference is not yet created in redux this function will execute synchronous
                // which will guarantee us that the local tracks are added to redux before we proceed.
                initPrejoin(tracks, errors, dispatch);

                connectionTimes['conference.init.end'] = window.performance.now();

                // resolve the initialGUMPromise in case connect have finished so that we can proceed to join.
                if (initialGUMPromise) {
                    logger.debug('Resolving the initialGUM promise! (prejoinVisible=true)');
                    initialGUMPromise.resolve({
                        tracks,
                        errors
                    });
                }

                logger.debug('Clear the initialGUM promise! (prejoinVisible=true)');

                // For prejoin we don't need the initial GUM promise since the tracks are already added to the store
                // via initPrejoin
                dispatch(setInitialGUMPromise());
            } else {
                APP.store.dispatch(displayErrorsForCreateInitialLocalTracks(errors));
                setGUMPendingStateOnFailedTracks(tracks, APP.store.dispatch);

                connectionTimes['conference.init.end'] = window.performance.now();
                if (initialGUMPromise) {
                    logger.debug('Resolving the initialGUM promise!');
                    initialGUMPromise.resolve({
                        tracks,
                        errors
                    });
                }
            }
        });

        if (shouldDispatchConnect) {
            logger.info('Dispatching connect from init since prejoin is not visible.');
            dispatch(connect());
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
            ? isLocalTrackMuted(APP.store.getState()['features/base/tracks'], MEDIA_TYPE.VIDEO)
            : isVideoMutedByUser(APP.store);
    },

    /**
     * Verify if there is an ongoing system audio sharing session and apply to the provided track
     * as a AudioMixer effect.
     *
     * @param {*} localAudioTrack - track to which system audio track will be applied as an effect, most likely
     * microphone local audio track.
     */
    async _maybeApplyAudioMixerEffect(localAudioTrack) {

        // At the time of writing this comment there were two separate flows for toggling screen-sharing
        // and system audio sharing, the first is the legacy method using the functionality from conference.js
        // the second is used when both sendMultipleVideoStreams and sourceNameSignaling flags are set to true.
        // The second flow uses functionality from base/conference/middleware.web.js.
        // We check if system audio sharing was done using the first flow by verifying this._desktopAudioStream and
        // for the second by checking 'features/screen-share' state.
        const { desktopAudioTrack } = APP.store.getState()['features/screen-share'];
        const currentDesktopAudioTrack = this._desktopAudioStream || desktopAudioTrack;

        // If system audio is already being sent, mix it with the provided audio track.
        if (currentDesktopAudioTrack) {
            // In case system audio sharing was done in the absence of an initial mic audio track, there is no
            // AudioMixerEffect so we have to remove system audio track from the room before setting it as an effect.
            await room.replaceTrack(currentDesktopAudioTrack, null);
            this._mixerEffect = new AudioMixerEffect(currentDesktopAudioTrack);
            logger.debug('Mixing new audio track with existing screen audio track.');
            await localAudioTrack.setEffect(this._mixerEffect);
        }
    },

    /**
     * Simulates toolbar button click for audio mute. Used by shortcuts and API.
     *
     * @param {boolean} mute true for mute and false for unmute.
     * @param {boolean} [showUI] when set to false will not display any error
     * dialogs in case of media permissions error.
     * @returns {Promise}
     */
    async muteAudio(mute, showUI = true) {
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
            this.updateAudioIconEnabled();

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

            APP.store.dispatch(gumPending([ MEDIA_TYPE.AUDIO ], IGUMPendingState.PENDING_UNMUTE));

            await createLocalTracksF({ devices: [ 'audio' ] })
                .then(([ audioTrack ]) => audioTrack)
                .catch(error => {
                    maybeShowErrorDialog(error);

                    // Rollback the audio muted status by using null track
                    return null;
                })
                .then(async audioTrack => {
                    await this._maybeApplyAudioMixerEffect(audioTrack);

                    return this.useAudioStream(audioTrack);
                })
                .finally(() => {
                    APP.store.dispatch(gumPending([ MEDIA_TYPE.AUDIO ], IGUMPendingState.NONE));
                });
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
        if (this.videoSwitchInProgress) {
            logger.warn('muteVideo - unable to perform operations while video switch is in progress');

            return;
        }

        const state = APP.store.getState();

        if (!mute
                && isUserInteractionRequiredForUnmute(state)) {
            logger.error('Unmuting video requires user interaction');

            return;
        }

        // check for A/V Moderation when trying to unmute and return early
        if (!mute && shouldShowModeratedNotification(MEDIA_TYPE.VIDEO, state)) {
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

        const localVideo = getLocalJitsiVideoTrack(state);

        if (!localVideo && !mute && !this.isCreatingLocalTrack) {
            const maybeShowErrorDialog = error => {
                showUI && APP.store.dispatch(notifyCameraError(error));
            };

            this.isCreatingLocalTrack = true;

            APP.store.dispatch(gumPending([ MEDIA_TYPE.VIDEO ], IGUMPendingState.PENDING_UNMUTE));

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
                })
                .finally(() => {
                    this.isCreatingLocalTrack = false;
                    APP.store.dispatch(gumPending([ MEDIA_TYPE.VIDEO ], IGUMPendingState.NONE));
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
     * @param {boolean} ensureTrack - True if we want to ensure that a new track is
     * created if missing.
     */
    toggleVideoMuted(showUI = true, ensureTrack = false) {
        const mute = !this.isLocalVideoMuted();

        APP.store.dispatch(handleToggleVideoMuted(mute, showUI, ensureTrack));
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
     * Get speaker stats that track total dominant speaker time.
     *
     * @returns {object} A hash with keys being user ids and values being the
     * library's SpeakerStats model used for calculating time as dominant
     * speaker.
     */
    getSpeakerStats() {
        return room.getSpeakerStats();
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
     * Will be filled with values only when config.testing.testMode is true.
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
     * Download app state, a function that can be called from console while debugging.
     * @param filename (optional) specify target filename
     */
    saveState(filename = 'meet-state.json') {
        downloadJSON(APP.store.getState(), filename);
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
        APP.store.dispatch(conferenceWillInit());

        // Restore initial state.
        this._localTracksInitialized = false;
        this.isSharingScreen = false;
        this.roomName = roomName;

        const { tryCreateLocalTracks, errors } = this.createInitialLocalTracks(options);
        const localTracks = await tryCreateLocalTracks;

        APP.store.dispatch(displayErrorsForCreateInitialLocalTracks(errors));
        localTracks.forEach(track => {
            if ((track.isAudioTrack() && this.isLocalAudioMuted())
                || (track.isVideoTrack() && this.isLocalVideoMuted())) {
                track.mute();
            }
        });
        this._createRoom(localTracks);

        return new Promise((resolve, reject) => {
            new ConferenceConnector(resolve, reject, this).connect();
        });
    },

    _createRoom(localTracks) {
        room = APP.connection.initJitsiConference(APP.conference.roomName, this._getConferenceOptions());

        // Filter out the tracks that are muted (except on Safari).
        let tracks = localTracks;

        if (!browser.isWebKitBased()) {
            const mutedTrackTypes = [];

            tracks = localTracks.filter(track => {
                if (!track.isMuted()) {
                    return true;
                }

                if (track.getVideoType() !== VIDEO_TYPE.DESKTOP) {
                    mutedTrackTypes.push(track.getType());
                }

                return false;
            });
            APP.store.dispatch(gumPending(mutedTrackTypes, IGUMPendingState.NONE));
        }

        this._room = room; // FIXME do not use this

        APP.store.dispatch(_conferenceWillJoin(room));

        this._setLocalAudioVideoStreams(tracks);

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
        const { dispatch } = APP.store;
        const pendingGUMDevicesToRemove = [];
        const promises = tracks.map(track => {
            if (track.isAudioTrack()) {
                pendingGUMDevicesToRemove.push(MEDIA_TYPE.AUDIO);

                return this.useAudioStream(track);
            } else if (track.isVideoTrack()) {
                logger.debug(`_setLocalAudioVideoStreams is calling useVideoStream with track: ${track}`);
                pendingGUMDevicesToRemove.push(MEDIA_TYPE.VIDEO);

                return this.useVideoStream(track);
            }

            logger.error('Ignored not an audio nor a video track: ', track);

            return Promise.resolve();

        });

        return Promise.allSettled(promises).then(() => {
            if (pendingGUMDevicesToRemove.length > 0) {
                dispatch(gumPending(pendingGUMDevicesToRemove, IGUMPendingState.NONE));
            }

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
        logger.debug(`useVideoStream: ${newTrack}`);

        return new Promise((resolve, reject) => {
            _replaceLocalVideoTrackQueue.enqueue(onFinish => {
                const state = APP.store.getState();
                const oldTrack = getLocalJitsiVideoTrack(state);

                logger.debug(`useVideoStream: Replacing ${oldTrack} with ${newTrack}`);

                if (oldTrack === newTrack || (!oldTrack && !newTrack)) {
                    resolve();
                    onFinish();

                    return;
                }

                // Add the track to the conference if there is no existing track, replace it otherwise.
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
            });
        });
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

                APP.store.dispatch(replaceLocalTrack(oldTrack, newTrack, room))
                    .then(() => {
                        this.updateAudioIconEnabled();
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
        let promise;

        if (didHaveVideo && !ignoreDidHaveVideo) {
            promise = createLocalTracksF({ devices: [ 'video' ] })
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
            promise = this.useVideoStream(null);
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
     * Creates desktop (screensharing) {@link JitsiLocalTrack}
     *
     * @return {Promise.<JitsiLocalTrack>} - A Promise resolved with
     * {@link JitsiLocalTrack} for the screensharing or rejected with
     * {@link JitsiTrackError}.
     *
     * @private
     */
    _createDesktopTrack() {
        const didHaveVideo = !this.isLocalVideoMuted();

        const getDesktopStreamPromise = createLocalTracksF({
            desktopSharingSourceDevice: config._desktopSharingSourceDevice,
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

        // we want to ignore this event in case of tokenAuthUrl config
        // we are deprecating this and at some point will get rid of it
        if (!config.tokenAuthUrl) {
            room.on(
                JitsiConferenceEvents.AUTH_STATUS_CHANGED,
                (authEnabled, authLogin) =>
                    APP.store.dispatch(authStatusChanged(authEnabled, authLogin)));
        }

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

            if (config.testing?.testMode) {
                this.audioLevelsMap[id] = newLvl;
                if (config.testing?.debugAudioLevels) {
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
            JitsiConferenceEvents.DOMINANT_SPEAKER_CHANGED,
            (dominant, previous, silence) => {
                APP.store.dispatch(dominantSpeakerChanged(dominant, previous, Boolean(silence), room));
            });

        room.on(
            JitsiConferenceEvents.CONFERENCE_CREATED_TIMESTAMP,
            conferenceTimestamp => {
                APP.store.dispatch(conferenceTimestampChanged(conferenceTimestamp));
                APP.API.notifyConferenceCreatedTimestamp(conferenceTimestamp);
            }
        );

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

                const virtualScreenshareParticipantId = getVirtualScreenshareParticipantByOwnerId(state, id)?.id;

                if (virtualScreenshareParticipantId) {
                    APP.store.dispatch(
                        screenshareParticipantDisplayNameChanged(virtualScreenshareParticipantId, formattedDisplayName)
                    );
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
            JitsiConferenceEvents.SILENT_STATUS_CHANGED,
            (id, isSilent) => {
                APP.store.dispatch(participantUpdated({
                    conference: room,
                    id,
                    isSilent
                }));
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
            JitsiConferenceEvents.TRANSCRIPTION_STATUS_CHANGED,
            (status, id, abruptly) => {
                if (status === JitsiMeetJS.constants.transcriptionStatus.ON) {
                    APP.store.dispatch(transcriberJoined(id));
                } else if (status === JitsiMeetJS.constants.transcriptionStatus.OFF) {
                    APP.store.dispatch(transcriberLeft(id, abruptly));
                }
            });

        room.on(
            JitsiConferenceEvents.ENDPOINT_MESSAGE_RECEIVED,
            (participant, data) => {
                APP.store.dispatch(endpointMessageReceived(participant, data));
                if (data?.name === ENDPOINT_TEXT_MESSAGE_NAME) {
                    APP.API.notifyEndpointTextMessageReceived({
                        senderInfo: {
                            jid: participant.getJid(),
                            id: participant.getId()
                        },
                        eventData: data
                    });
                }
            });

        room.on(
            JitsiConferenceEvents.NON_PARTICIPANT_MESSAGE_RECEIVED,
            (id, data) => {
                APP.store.dispatch(nonParticipantMessageReceived(id, data));
                APP.API.notifyNonParticipantMessageReceived(id, data);
            });

        room.on(
            JitsiConferenceEvents.LOCK_STATE_CHANGED,
            (...args) => APP.store.dispatch(lockStateChanged(room, ...args)));

        room.on(
            JitsiConferenceEvents.PROPERTIES_CHANGED,
            properties => APP.store.dispatch(conferencePropertiesChanged(properties)));

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

        room.on(JitsiConferenceEvents.PARTICIPANT_SOURCE_UPDATED,
            jitsiParticipant => {
                APP.store.dispatch(participantSourcesUpdated(jitsiParticipant));
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

        room.addCommandListener(this.commands.defaults.ETHERPAD,
            ({ value }) => {
                APP.UI.initEtherpad(value);
            }
        );

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
                const participant = getParticipantByIdOrUndefined(APP.store, from);

                // if already set from presence(jwt), skip the command processing
                if (!participant?.avatarURL) {
                    APP.store.dispatch(
                        participantUpdated({
                            conference: room,
                            id: from,
                            avatarURL: data.value
                        }));
                }
            });

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
                APP.store.dispatch(hideNotification(DATA_CHANNEL_CLOSED_NOTIFICATION_ID));
            }
        );

        room.on(
            JitsiConferenceEvents.DATA_CHANNEL_CLOSED, ev => {
                const state = APP.store.getState();
                const { dataChannelOpen } = state['features/base/conference'];
                const timeout = typeof dataChannelOpen === 'undefined' ? 15000 : 60000;

                // Show the notification only when the data channel connection doesn't get re-established in 60 secs if
                // it was already established at the beginning of the call, show it sooner otherwise. This notification
                // can be confusing and alarming to users even when there is no significant impact to user experience
                // if the the reconnect happens immediately.
                setTimeout(() => {
                    const { dataChannelOpen: open } = APP.store.getState()['features/base/conference'];

                    if (!open) {
                        const descriptionKey = getSsrcRewritingFeatureFlag(state)
                            ? 'notify.dataChannelClosedDescriptionWithAudio' : 'notify.dataChannelClosedDescription';
                        const titleKey = getSsrcRewritingFeatureFlag(state)
                            ? 'notify.dataChannelClosedWithAudio' : 'notify.dataChannelClosed';

                        APP.store.dispatch(dataChannelClosed(ev.code, ev.reason));
                        APP.store.dispatch(showWarningNotification({
                            descriptionKey,
                            titleKey,
                            uid: DATA_CHANNEL_CLOSED_NOTIFICATION_ID
                        }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
                    }
                }, timeout);
            }
        );

        room.on(JitsiConferenceEvents.PERMISSIONS_RECEIVED, p => {
            const localParticipant = getLocalParticipant(APP.store.getState());

            APP.store.dispatch(participantUpdated({
                id: localParticipant.id,
                local: true,
                features: p
            }));
        });
    },

    /**
     * Handles audio device changes.
     *
     * @param {string} cameraDeviceId - The new device id.
     * @returns {Promise}
     */
    async onAudioDeviceChanged(micDeviceId) {
        const audioWasMuted = this.isLocalAudioMuted();

        // Disable noise suppression if it was enabled on the previous track.
        await APP.store.dispatch(setNoiseSuppressionEnabled(false));

        // When the 'default' mic needs to be selected, we need to pass the real device id to gUM instead of
        // 'default' in order to get the correct MediaStreamTrack from chrome because of the following bug.
        // https://bugs.chromium.org/p/chromium/issues/detail?id=997689.
        const isDefaultMicSelected = micDeviceId === 'default';
        const selectedDeviceId = isDefaultMicSelected
            ? getDefaultDeviceId(APP.store.getState(), 'audioInput')
            : micDeviceId;

        logger.info(`Switching audio input device to ${selectedDeviceId}`);
        sendAnalytics(createDeviceChangedEvent('audio', 'input'));
        createLocalTracksF({
            devices: [ 'audio' ],
            micDeviceId: selectedDeviceId
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
            await this._maybeApplyAudioMixerEffect(stream);

            return this.useAudioStream(stream);
        })
        .then(() => {
            const localAudio = getLocalJitsiAudioTrack(APP.store.getState());

            if (localAudio && isDefaultMicSelected) {
                // workaround for the default device to be shown as selected in the
                // settings even when the real device id was passed to gUM because of the
                // above mentioned chrome bug.
                localAudio._realDeviceId = localAudio.deviceId = 'default';
            }
        })
        .catch(err => {
            logger.error(`Failed to switch to selected audio input device ${selectedDeviceId}, error=${err}`);
            APP.store.dispatch(notifyMicError(err));
        });
    },

    /**
     * Handles video device changes.
     *
     * @param {string} cameraDeviceId - The new device id.
     * @returns {void}
     */
    onVideoDeviceChanged(cameraDeviceId) {
        const videoWasMuted = this.isLocalVideoMuted();
        const localVideoTrack = getLocalJitsiVideoTrack(APP.store.getState());

        if (localVideoTrack?.getDeviceId() === cameraDeviceId) {
            return;
        }

        sendAnalytics(createDeviceChangedEvent('video', 'input'));

        createLocalTracksF({
            devices: [ 'video' ],
            cameraDeviceId
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
            logger.info(`Switching the local video device to ${cameraDeviceId}.`);

            return this.useVideoStream(stream);
        })
        .catch(error => {
            logger.error(`Failed to switch to selected camera:${cameraDeviceId}, error:${error}`);

            return APP.store.dispatch(notifyCameraError(error));
        });
    },

    /**
     * Handles audio only changes.
     */
    onToggleAudioOnly() {
        // Immediately update the UI by having remote videos and the large video update themselves.
        const displayedUserId = APP.UI.getLargeVideoID();

        if (displayedUserId) {
            APP.UI.updateLargeVideo(displayedUserId, true);
        }
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
                .then(() => {
                    this.updateAudioIconEnabled();
                    this.updateVideoIconEnabled();
                });
        }

        return Promise.resolve();
    },

    /**
     * Event listener for JitsiMediaDevicesEvents.DEVICE_LIST_CHANGED to
     * handle change of available media devices.
     * @private
     * @param {MediaDeviceInfo[]} devices
     * @returns {Promise}
     */
    async _onDeviceListChanged(devices) {
        const state = APP.store.getState();
        const { filteredDevices, ignoredDevices } = filterIgnoredDevices(devices);
        const oldDevices = state['features/base/devices'].availableDevices;

        if (!areDevicesDifferent(flattenAvailableDevices(oldDevices), filteredDevices)) {
            return Promise.resolve();
        }

        logDevices(ignoredDevices, 'Ignored devices on device list changed:');

        const localAudio = getLocalJitsiAudioTrack(state);
        const localVideo = getLocalJitsiVideoTrack(state);

        APP.store.dispatch(updateDeviceList(filteredDevices));

        // Firefox users can choose their preferred device in the gUM prompt. In that case
        // we should respect that and not attempt to switch to the preferred device from
        // our settings.
        const newLabelsOnly = mediaDeviceHelper.newDeviceListAddedLabelsOnly(oldDevices, filteredDevices);
        const newDevices
            = mediaDeviceHelper.getNewMediaDevicesAfterDeviceListChanged(
                filteredDevices,
                localVideo,
                localAudio,
                newLabelsOnly);
        const promises = [];
        const requestedInput = {
            audio: Boolean(newDevices.audioinput),
            video: Boolean(newDevices.videoinput)
        };

        if (typeof newDevices.audiooutput !== 'undefined') {
            const { dispatch } = APP.store;
            const setAudioOutputPromise
                = setAudioOutputDeviceId(newDevices.audiooutput, dispatch)
                    .catch(err => {
                        logger.error(`Failed to set the audio output device to ${newDevices.audiooutput} - ${err}`);
                    });

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
        const newAvailDevices = APP.store.getState()['features/base/devices'].availableDevices;
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
            APP.store.dispatch(checkAndNotifyForNewDevice(newAudioDevices, oldAudioDevices));
        }

        // check for video
        if (requestedInput.video) {
            APP.store.dispatch(checkAndNotifyForNewDevice(newAvailDevices.videoInput, oldDevices.videoInput));
        }

        // When the 'default' mic needs to be selected, we need to pass the real device id to gUM instead of 'default'
        // in order to get the correct MediaStreamTrack from chrome because of the following bug.
        // https://bugs.chromium.org/p/chromium/issues/detail?id=997689
        const hasDefaultMicChanged = newDevices.audioinput === 'default';

        // When the local video is muted and a preferred device is connected, update the settings and remove the track
        // from the conference. A new track will be created and replaced when the user unmutes their camera.
        if (requestedInput.video && this.isLocalVideoMuted()) {
            APP.store.dispatch(updateSettings({
                cameraDeviceId: newDevices.videoinput
            }));
            requestedInput.video = false;
            delete newDevices.videoinput;

            // Remove the track from the conference.
            if (localVideo) {
                await this.useVideoStream(null);
                logger.debug('_onDeviceListChanged: Removed the current video track.');
            }
        }

        // When the local audio is muted and a preferred device is connected, update the settings and remove the track
        // from the conference. A new track will be created and replaced when the user unmutes their mic.
        if (requestedInput.audio && this.isLocalAudioMuted()) {
            APP.store.dispatch(updateSettings({
                micDeviceId: newDevices.audioinput
            }));
            requestedInput.audio = false;
            delete newDevices.audioinput;

            // Remove the track from the conference.
            if (localAudio) {
                await this.useAudioStream(null);
                logger.debug('_onDeviceListChanged: Removed the current audio track.');
            }
        }

        // Create the tracks and replace them only if the user is unmuted.
        if (requestedInput.audio || requestedInput.video) {
            let tracks = [];
            const realAudioDeviceId = hasDefaultMicChanged
                ? getDefaultDeviceId(APP.store.getState(), 'audioInput') : newDevices.audioinput;

            try {
                tracks = await mediaDeviceHelper.createLocalTracksAfterDeviceListChanged(
                    createLocalTracksF,
                    requestedInput.video ? newDevices.videoinput : null,
                    requestedInput.audio ? realAudioDeviceId : null
                );
            } catch (error) {
                logger.error(`Track creation failed on device change, ${error}`);

                return Promise.reject(error);
            }

            for (const track of tracks) {
                if (track.isAudioTrack()) {
                    promises.push(
                        this.useAudioStream(track)
                            .then(() => {
                                hasDefaultMicChanged && (track._realDeviceId = track.deviceId = 'default');
                            }));
                } else {
                    promises.push(
                        this.useVideoStream(track));
                }
            }
        }

        return Promise.all(promises)
            .then(() => {
                this.updateAudioIconEnabled();
                this.updateVideoIconEnabled();
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
     * @param {string} [hangupReason] the reason for leaving the meeting
     * requested
     * @param {boolean} [notifyOnConferenceTermination] whether to notify
     * the user on conference termination
     */
    hangup(requestFeedback = false, hangupReason, notifyOnConferenceTermination) {
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

        let feedbackResultPromise = Promise.resolve({});

        if (requestFeedback) {
            const feedbackDialogClosed = (feedbackResult = {}) => {
                if (!feedbackResult.wasDialogShown && hangupReason && notifyOnConferenceTermination) {
                    return APP.store.dispatch(
                        openLeaveReasonDialog(hangupReason)).then(() => feedbackResult);
                }

                return Promise.resolve(feedbackResult);
            };

            feedbackResultPromise
                = APP.store.dispatch(maybeOpenFeedbackDialog(room, hangupReason))
                    .then(feedbackDialogClosed, feedbackDialogClosed);
        }

        const leavePromise = this.leaveRoom().catch(() => Promise.resolve());

        Promise.allSettled([ feedbackResultPromise, leavePromise ]).then(([ feedback, _ ]) => {
            this._room = undefined;
            room = undefined;

            /**
             * Don't call {@code notifyReadyToClose} if the promotional page flag is set
             * and let the page take care of sending the message, since there will be
             * a redirect to the page anyway.
             */
            if (!interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE) {
                APP.API.notifyReadyToClose();
            }

            APP.store.dispatch(maybeRedirectToWelcomePage(feedback.value ?? {}));
        });


    },

    /**
     * Leaves the room.
     *
     * @param {boolean} doDisconnect - Whether leaving the room should also terminate the connection.
     * @param {string} reason - reason for leaving the room.
     * @returns {Promise}
     */
    leaveRoom(doDisconnect = true, reason = '') {
        APP.store.dispatch(conferenceWillLeave(room));

        const maybeDisconnect = () => {
            if (doDisconnect) {
                return disconnect();
            }
        };

        if (room && room.isJoined()) {
            return room.leave(reason).then(() => maybeDisconnect())
            .catch(e => {
                logger.error(e);

                return maybeDisconnect();
            });
        }

        return maybeDisconnect();
    },

    /**
     * Changes the email for the local user
     * @param email {string} the new email
     */
    changeLocalEmail(email = '') {
        const formattedEmail = String(email).trim();

        APP.store.dispatch(updateSettings({
            email: formattedEmail
        }));

        sendData(commands.EMAIL, formattedEmail);
    },

    /**
     * Changes the avatar url for the local user
     * @param url {string} the new url
     */
    changeLocalAvatarUrl(url = '') {
        const formattedUrl = String(url).trim();

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

                    APP.store.dispatch(toggleScreensharingA(undefined, false, { desktopStream }));
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
