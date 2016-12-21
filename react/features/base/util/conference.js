/* global $, APP, JitsiMeetJS, config, interfaceConfig */
const logger = require('jitsi-meet-logger').getLogger(__filename);

import { openConnection } from '../../../../connection';
import Invite from '../../../../modules/UI/invite/Invite';

// eslint-disable-next-line max-len
import ContactList from '../../../../modules/UI/side_pannels/contactlist/ContactList';

import AuthHandler from '../../../../modules/UI/authentication/AuthHandler';
import Recorder from '../../../../modules/recorder/Recorder';

import mediaDeviceHelper from '../../../../modules/devices/mediaDeviceHelper';

import { reportError } from '../../../../modules/util/helpers';

import UIEvents from '../../../../service/UI/UIEvents';
import UIUtil from '../../../../modules/UI/util/UIUtil';
import ConferenceConnector from './ConferenceConnector';

import analytics from '../../../../modules/analytics/analytics';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;
const ConferenceEvents = JitsiMeetJS.events.conference;

const TrackEvents = JitsiMeetJS.events.track;
const TrackErrors = JitsiMeetJS.errors.track;

const ConnectionQualityEvents = JitsiMeetJS.events.connectionQuality;

let connection, localAudio, localVideo, room;

/**
 * Indicates whether extension external installation is in progress or not.
 */
let DSExternalInstallationInProgress = false;

// eslint-disable-next-line max-len
import { VIDEO_CONTAINER_TYPE } from '../../../../modules/UI/videolayout/VideoContainer';

/**
 * Known custom conference commands.
 */
const commands = {
    EMAIL: 'email',
    AVATAR_URL: 'avatar-url',
    AVATAR_ID: 'avatar-id',
    ETHERPAD: 'etherpad',
    SHARED_VIDEO: 'shared-video',
    CUSTOM_ROLE: 'custom-role'
};

/**
 * Max length of the display names. If we receive longer display name the
 * additional chars are going to be cut.
 */
const MAX_DISPLAY_NAME_LENGTH = 50;

/**
 * Open Connection. When authentication failed it shows auth dialog.
 *
 * @param {string} roomName - The room name to use.
 * @returns {Promise<JitsiConnection>}
 */
function connect(roomName) {
    return openConnection({
        retry: true,
        roomName
    })
    .catch(err => {
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
 * microphone.
 *
 * @param {string} roomName - Chat room name.
 * @returns {Promise.<JitsiLocalTrack[], JitsiConnection>}
 */
function createInitialLocalTracksAndConnect(roomName) {
    let audioAndVideoError,
        audioOnlyError;

    JitsiMeetJS.mediaDevices.addEventListener(
        JitsiMeetJS.events.mediaDevices.PERMISSION_PROMPT_IS_SHOWN,
        browser => APP.UI.showUserMediaPermissionsGuidanceOverlay(browser));

    // First try to retrieve both audio and video.
    const tryCreateLocalTracks = createLocalTracks(
            { devices: [ 'audio', 'video' ] }, true)
        .catch(err => {
            // If failed then try to retrieve only audio.
            audioAndVideoError = err;

            return createLocalTracks({ devices: [ 'audio' ] }, true);
        })
        .catch(err => {
            // If audio failed too then just return empty array for tracks.
            audioOnlyError = err;

            return [];
        });

    return Promise.all([ tryCreateLocalTracks, connect(roomName) ])
        .then(([ tracks, con ]) => {
            APP.UI.hideUserMediaPermissionsGuidanceOverlay();

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

            return [ tracks, con ];
        });
}

/**
 * Share data to other users.
 *
 * @param {string} command - The command.
 * @param {string} value - New value.
 * @returns {void}
 */
function sendData(command, value) {
    room.removeCommand(command);
    room.sendCommand(command, { value });
}

/**
 * Get user nickname by user id.
 *
 * @param {string} id - User id.
 * @returns {string?} User nickname or undefined if user is unknown.
 */
function getDisplayName(id) {
    if (APP.conference.isLocalId(id)) {
        return APP.settings.getDisplayName();
    }

    const participant = room.getParticipantById(id);

    if (participant && participant.getDisplayName()) {
        return participant.getDisplayName();
    }
}

/**
 * Mute or unmute local audio stream if it exists.
 *
 * @param {boolean} muted - If audio stream should be muted or unmuted.
 * @param {boolean} userInteraction - Indicates if this local audio mute was a
 * result of user interaction.
 * @returns {void}
 */
function muteLocalAudio(muted) {
    muteLocalMedia(localAudio, muted, 'Audio');
}

/**
 *  Mutes/Unmutes local media.
 *
 * @param {Object} localMedia - Local media object.
 * @param {string} muted - Mute/unmute key.
 * @param {string} localMediaTypeString - String describing local media type.
 * @returns {void}
 */
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
 *
 * @param {boolean} muted - If video stream should be muted or unmuted.
 * @returns {void}
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
 * @param {Object} options - Used to decide which particular close page to show
 * or if close page is disabled, whether we should show the thankyou dialog.
 * @param {boolean} options.thankYouDialogVisible - Whether we should
 * show thank you dialog.
 * @param {boolean} options.feedbackSubmitted - Whether feedback was submitted.
 * @returns {void}
 */
function maybeRedirectToWelcomePage(options) {
    // if close page is enabled redirect to it, without further action
    if (config.enableClosePage) {
        if (options.feedbackSubmitted) {
            window.location.pathname = '../../../../close.html';
        } else {
            window.location.pathname = '../../../../close2.html';
        }

        return;
    }

    // else: show thankYou dialog only if there is no feedback
    if (options.thankYouDialogVisible) {
        APP.UI.messageHandler.openMessageDialog(
            null, 'dialog.thankYou', { appName: interfaceConfig.APP_NAME });
    }

    // if Welcome page is enabled redirect to welcome page after 3 sec.
    if (config.enableWelcomePage) {
        setTimeout(() => {
            APP.settings.setWelcomePageEnabled(true);
            window.location.pathname = '/';
        }, 3000);
    }
}

/**
 * Create local tracks of specified types.
 *
 * @param {Object} options - Local tracks options.
 * @param {string[]} options.devices - Required track types:
 *      'audio', 'video' etc.
 * @param {string|null} options.cameraDeviceId - Camera device id, if
 *      undefined - one from settings will be used.
 * @param {string|null} options.micDeviceId - Microphone device id, if
 *      undefined - one from settings will be used.
 * @param {boolean} checkForPermissionPrompt - If lib-jitsi-meet should check
 *      for gUM permission prompt.
 * @returns {Promise<JitsiLocalTrack[]>}
 */
function createLocalTracks(options = {}, checkForPermissionPrompt) {
    return JitsiMeetJS
        .createLocalTracks({
            // copy array to avoid mutations inside library
            devices: options.devices.slice(0),
            resolution: config.resolution,
            cameraDeviceId: typeof options.cameraDeviceId === 'undefined'
            || options.cameraDeviceId === null
                ? APP.settings.getCameraDeviceId()
                : options.cameraDeviceId,
            micDeviceId: typeof options.micDeviceId === 'undefined'
            || options.micDeviceId === null
                ? APP.settings.getMicDeviceId()
                : options.micDeviceId,

            // adds any ff fake device settings if any
            // eslint-disable-next-line camelcase
            firefox_fake_device: config.firefox_fake_device,
            desktopSharingExtensionExternalInstallation:
                options.desktopSharingExtensionExternalInstallation
        }, checkForPermissionPrompt).then(tracks => {
            tracks.forEach(track => {
                track.on(TrackEvents.NO_DATA_FROM_SOURCE,
                    APP.UI.showTrackNotWorkingDialog.bind(null, track));
            });

            return tracks;
        })
        .catch(err => {
            logger.error(
                'failed to create local tracks', options.devices, err);

            return Promise.reject(err);
        });
}

/**
 * Changes the email for the local user.
 *
 * @param {string} email='' - The new email.
 * @returns {void}
 */
function changeLocalEmail(email = '') {
    const normalizedEmail = email.trim();

    if (normalizedEmail === APP.settings.getEmail()) {
        return;
    }

    APP.settings.setEmail(normalizedEmail);
    APP.UI.setUserEmail(room.myUserId(), normalizedEmail);
    sendData(commands.EMAIL, normalizedEmail);
}

/**
 * Changes the display name for the local user.
 *
 * @param {string} nickname - The new display name.
 * @returns {void}
 */
function changeLocalDisplayName(nickname = '') {
    const formattedNickname
        = nickname.trim().substr(0, MAX_DISPLAY_NAME_LENGTH);

    if (formattedNickname === APP.settings.getDisplayName()) {
        return;
    }

    APP.settings.setDisplayName(formattedNickname);
    room.setDisplayName(formattedNickname);
    APP.UI.changeDisplayName(APP.conference.getMyUserId(), formattedNickname);
}

/**
 * Disconnects the connection.
 *
 * @returns {Promise} Resolved Promise. We need this in order to make
 * the Promise.all call in hangup() to resolve when all operations
 * are finished.
 */
function disconnect() {
    connection.disconnect();
    APP.API.notifyConferenceLeft(APP.conference.roomName);

    return Promise.resolve();
}

export default {
    isModerator: false,
    audioMuted: false,
    videoMuted: false,
    isSharingScreen: false,
    isDesktopSharingEnabled: false,

    /*
     * Whether the local 'raisedHand' flag is on.
     */
    isHandRaised: false,

    /*
     * Whether the local participant is the dominant speaker in the conference.
     */
    isDominantSpeaker: false,

    /**
     * Open new connection and join to the conference.
     *
     * @param {Object} options - Conference initialization options.
     * @param {string} roomName - Name of the conference.
     * @returns {Promise}
     */
    init(options) {
        this.roomName = options.roomName;

        // attaches global error handler, if there is already one, respect it
        if (JitsiMeetJS.getGlobalOnErrorHandler) {
            this.setGlobalErrorHandler();
        }

        const jitsiMeetJSConfig = Object.assign({
            enableAnalyticsLogging: analytics.isEnabled()
        }, config);

        return JitsiMeetJS.init(jitsiMeetJSConfig)
            .then(() => {
                analytics.init();

                return createInitialLocalTracksAndConnect(options.roomName);
            })
            .then((...args) => this.setupConference(...args));
    },

    /**
     * Sets global error handler.
     *
     * @returns {void}
     */
    setGlobalErrorHandler() {
        const oldOnErrorHandler = window.onerror;

        // eslint-disable-next-line max-params
        const newOnErrorHandler = (message, source, lineno, colno, error) => {
            JitsiMeetJS.getGlobalOnErrorHandler(
                message, source, lineno, colno, error);

            if (oldOnErrorHandler) {
                oldOnErrorHandler(message, source, lineno, colno, error);
            }
        };

        window.onerror = newOnErrorHandler;

        const oldOnUnhandledRejection = window.onunhandledrejection;
        const newOnUnhandledRejection = event => {
            JitsiMeetJS.getGlobalOnErrorHandler(
                null, null, null, null, event.reason);

            if (oldOnUnhandledRejection) {
                oldOnUnhandledRejection(event);
            }
        };

        window.onunhandledrejection = newOnUnhandledRejection;
    },

    /**
     * Method setting up the conference.
     *
     * @param {Object[]} tracks - Audio and video tracks.
     * @param {JitsiConference} con - Jitsi conference object.
     * @returns {Promise}
     */
    setupConference([ tracks, con ]) {
        logger.log('initialized with %s local tracks', tracks.length);
        APP.connection = connection = con;
        this._bindConnectionFailedHandler(con);
        this._createRoom(tracks);
        this.isDesktopSharingEnabled
            = JitsiMeetJS.isDesktopSharingEnabled();

        if (UIUtil.isButtonEnabled('contacts')) {
            APP.UI.ContactList = new ContactList(room);
        }

        // if user didn't give access to mic or camera or doesn't have
        // them at all, we disable corresponding toolbar buttons
        if (!tracks.find(t => t.isAudioTrack())) {
            APP.UI.setMicrophoneButtonEnabled(false);
        }

        if (!tracks.find(t => t.isVideoTrack())) {
            APP.UI.setCameraButtonEnabled(false);
        }

        this._initDeviceList();

        if (config.iAmRecorder) {
            this.recorder = new Recorder();
        }

        // XXX The API will take care of disconnecting from the XMPP
        // server (and, thus, leaving the room) on unload.
        return new Promise((resolve, reject) => {
            const conferenceConnector = new ConferenceConnector({
                resolve,
                reject,
                room,
                connection,
                invite: this.invite
            });

            conferenceConnector.connect();
        });
    },

    /**
     * Check if id is id of the local user.
     *
     * @param {string} id - Id to check.
     * @returns {boolean}
     */
    isLocalId(id) {
        return this.getMyUserId() === id;
    },

    /**
     * Binds a handler that will handle the case when the connection is dropped
     * in the middle of the conference.
     *
     * @param {JitsiConnection} con - The connection to which the handler
     * will be bound to.
     * @private
     * @returns {void}
     */
    _bindConnectionFailedHandler(con) {
        const handler = function(error, errMsg) {
            /* eslint-disable no-case-declarations */
            switch (error) {
            case ConnectionErrors.CONNECTION_DROPPED_ERROR:
            case ConnectionErrors.OTHER_ERROR:
            case ConnectionErrors.SERVER_ERROR:

                logger.error(`XMPP connection error: ${errMsg}`);

                    // From all of the cases above only CONNECTION_DROPPED_ERROR
                    // is considered a network type of failure
                const isNetworkFailure
                        = error === ConnectionErrors.CONNECTION_DROPPED_ERROR;

                APP.UI.showPageReloadOverlay(
                        isNetworkFailure,
                        `xmpp-conn-dropped:${errMsg}`);

                con.removeEventListener(
                        ConnectionEvents.CONNECTION_FAILED, handler);

                    // FIXME it feels like the conference should be stopped
                    // by lib-jitsi-meet
                if (room) {
                    room.leave();
                }

                break;
            }

            /* eslint-enable no-case-declarations */
        };

        con.addEventListener(
            ConnectionEvents.CONNECTION_FAILED, handler);
    },

    /**
     * Simulates toolbar button click for audio mute. Used by shortcuts and API.
     *
     * @param {boolean} mute - True for mute and false for unmute.
     * @returns {void}
     */
    muteAudio(mute) {
        muteLocalAudio(mute);
    },

    /**
     * Returns whether local audio is muted or not.
     *
     * @returns {boolean}
     */
    isLocalAudioMuted() {
        return this.audioMuted;
    },

    /**
     * Simulates toolbar button click for audio mute. Used by shortcuts and API.
     *
     * @returns {void}
     */
    toggleAudioMuted() {
        this.muteAudio(!this.audioMuted);
    },

    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     *
     * @param {boolean} mute - True for mute and false for unmute.
     * @returns {void}
     */
    muteVideo(mute) {
        muteLocalVideo(mute);
    },

    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     *
     * @returns {void}
     */
    toggleVideoMuted() {
        this.muteVideo(!this.videoMuted);
    },

    /**
     * Retrieve list of conference participants (without local user).
     *
     * @returns {JitsiParticipant[]}
     */
    listMembers() {
        return room.getParticipants();
    },

    /**
     * Retrieve list of ids of conference participants (without local user).
     *
     * @returns {string[]}
     */
    listMembersIds() {
        return room.getParticipants().map(p => p.getId());
    },

    /**
     * Checks whether the participant identified by id is a moderator.
     *
     * @param {string} id - To search for participant.
     * @returns {boolean} Whether the participant is moderator.
     */
    isParticipantModerator(id) {
        const user = room.getParticipantById(id);

        return user && user.isModerator();
    },

    /**
     * Check if SIP is supported.
     *
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
     * @returns {boolean} True if the callstats integration is enabled,
     * otherwise returns false.
     */
    isCallstatsEnabled() {
        return room.isCallstatsEnabled();
    },

    /**
     * Sends the given feedback through CallStats if enabled.
     *
     * @param {number} overallFeedback - An integer between 1 and 5
     * indicating the user feedback.
     * @param {string} detailedFeedback - Detailed feedback from the user.
     * Not yet used.
     * @returns {void}
     */
    sendFeedback(overallFeedback, detailedFeedback) {
        return room.sendFeedback(overallFeedback, detailedFeedback);
    },

    /**
     * Returns the connection times stored in the library.
     *
     * @returns {number}
     */
    getConnectionTimes() {
        return this._room.getConnectionTimes();
    },

    // used by torture currently
    /**
     * Returns true if user is joined.
     *
     * @returns {boolean}
     */
    isJoined() {
        return this._room
            && this._room.isJoined();
    },

    /**
     * Returns connection state.
     *
     * @returns {Object}
     */
    getConnectionState() {
        return this._room
            && this._room.getConnectionState();
    },

    /**
     * Checks whether or not our connection is currently in interrupted and
     * reconnect attempts are in progress.
     *
     * @returns {boolean} True if the connection is in interrupted state or
     * false otherwise.
     */
    isConnectionInterrupted() {
        return this._room.isConnectionInterrupted();
    },

    /**
     * Finds JitsiParticipant for given id.
     *
     * @param {string} id - Participant's identifier(MUC nickname).
     *
     * @returns {JitsiParticipant|null} Participant instance for given id or
     * null if not found.
     */
    getParticipantById(id) {
        return room ? room.getParticipantById(id) : null;
    },

    /**
     * Checks whether the user identified by given id is currently connected.
     *
     * @param {string} id - Participant's identifier(MUC nickname).
     *
     * @returns {boolean|null} True if participant's connection is ok or false
     * if the user is having connectivity issues.
     */
    isParticipantConnectionActive(id) {
        const participant = this.getParticipantById(id);

        return participant ? participant.isConnectionActive() : null;
    },

    /**
     * Gets the display name foe the <tt>JitsiParticipant</tt> identified by
     * the given <tt>id</tt>.
     *
     * @param {string} id - The participant's id(MUC nickname/JVB endpoint id).
     *
     * @returns {string} The participant's display name or the default string if
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

    /**
     * Returns current user's id.
     *
     * @returns {string}
     */
    getMyUserId() {
        return this._room
            && this._room.myUserId();
    },

    /**
     * Indicates if recording is supported in this conference.
     *
     * @returns {boolean}
     */
    isRecordingSupported() {
        return this._room && this._room.isRecordingSupported();
    },

    /**
     * Returns the recording state or undefined if the room is not defined.
     *
     * @returns {Object|undefined}
     */
    getRecordingState() {
        return this._room ? this._room.getRecordingState() : undefined;
    },

    /**
     * Will be filled with values only when config.debug is enabled.
     * Its used by torture to check audio levels.
     */
    audioLevelsMap: {},

    /**
     * Returns the stored audio level (stored only if config.debug is enabled).
     *
     * @param {string} id - The id for the user audio level to return
     * (the id value is returned for the participant using
     * getMyUserId() method).
     * @returns {number}
     */
    getPeerSSRCAudioLevel(id) {
        return this.audioLevelsMap[id];
    },

    /**
     * Returns number of participants with tracks.
     *
     * @returns {number} The number of participants in the conference with at
     * least one track.
     */
    getNumberOfParticipantsWithTracks() {
        return this._room.getParticipants()
            .filter(p => p.getTracks().length > 0)
            .length;
    },

    /**
     * Returns the stats.
     *
     * @returns {Object}
     */
    getStats() {
        return room.connectionQuality.getStats();
    },

    // end used by torture

    /**
     * Returns the logs.
     *
     * @returns {Object}
     */
    getLogs() {
        return room.getLogs();
    },

    /**
     * Download logs, a function that can be called from console while
     * debugging.
     *
     * @param {string} filename='meetlog.json' - Specify target filename.
     * @returns {void}
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
         *
         * @param {string} command - The name of the command.
         * @param {Function} handler - Handler for the command.
         * @returns {void}
         */
        addCommandListener(...args) {
            room.addCommandListener.apply(...args);
        },

        /**
         * Removes command.
         *
         * @param {string} name - The name of the command.
         * @returns {void}
         */
        removeCommand(...args) {
            room.removeCommand(...args);
        },

        /**
         * Sends command.
         *
         * @param {string} name - The name of the command.
         * @param {Object} values - With keys and values that will be sent.
         * @returns {void}
         */
        sendCommand(...args) {
            room.sendCommand(...args);
        },

        /**
         * Sends command one time.
         *
         * @param {string} name - The name of the command.
         * @param {Object} values - With keys and values that will be sent.
         * @returns {void}
         */
        sendCommandOnce(...args) {
            room.sendCommandOnce(...args);
        }
    },

    _createRoom(localTracks) {
        room = connection.initJitsiConference(APP.conference.roomName,
            this._getConferenceOptions());
        this._setLocalAudioVideoStreams(localTracks);
        this.invite = new Invite(room);
        this._room = room; // FIXME do not use this

        const email = APP.settings.getEmail();

        email && sendData(this.commands.defaults.EMAIL, email);

        const avatarUrl = APP.settings.getAvatarUrl();

        avatarUrl && sendData(this.commands.defaults.AVATAR_URL,
            avatarUrl);
        !email && sendData(
             this.commands.defaults.AVATAR_ID, APP.settings.getAvatarId());

        let nick = APP.settings.getDisplayName();

        if (config.useNicks && !nick) {
            nick = APP.UI.askForNickname();
            APP.settings.setDisplayName(nick);
        }
        nick && room.setDisplayName(nick);

        this._setupListeners();
    },

    /**
     * Sets local video and audio streams.
     *
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

        if (config.enableRecording && !config.recordingType) {
            const jirecon = config.hosts.jirecon;

            if (config.hosts && (typeof jirecon !== 'undefined')) {
                options.recordingType = 'jirecon';
            } else {
                options.recordingType = 'colibri';
            }
        }

        return options;
    },

    /**
     * Start using provided video stream.
     * Stops previous video stream.
     *
     * @param {JitsiLocalTrack} stream - New stream to use or null.
     * @returns {Promise}
     */
    useVideoStream(stream) {
        let promise = Promise.resolve();

        if (localVideo) {
            // this calls room.removeTrack internally
            // so we don't need to remove it manually
            promise = localVideo.dispose();
        }
        localVideo = stream;

        return promise.then(() => {
            if (stream) {
                return room.addTrack(stream);
            }
        }).then(() => {
            if (stream) {
                this.videoMuted = stream.isMuted();
                this.isSharingScreen = stream.videoType === 'desktop';

                APP.UI.addLocalStream(stream);

                stream.videoType === 'camera'
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
     *
     * @param {JitsiLocalTrack} stream - New stream to use or null.
     * @returns {Promise}
     */
    useAudioStream(stream) {
        let promise = Promise.resolve();

        if (localAudio) {
            // this calls room.removeTrack internally
            // so we don't need to remove it manually
            promise = localAudio.dispose();
        }
        localAudio = stream;

        return promise.then(() => {
            if (stream) {
                return room.addTrack(stream);
            }
        }).then(() => {
            if (stream) {
                this.audioMuted = stream.isMuted();

                APP.UI.addLocalStream(stream);
            } else {
                this.audioMuted = false;
            }

            APP.UI.setMicrophoneButtonEnabled(true);
            APP.UI.setAudioMuted(this.getMyUserId(), this.audioMuted);
        });
    },

    videoSwitchInProgress: false,
    toggleScreenSharing(shareScreen = !this.isSharingScreen) {
        if (this.videoSwitchInProgress) {
            logger.warn('Switch in progress.');

            return;
        }
        if (!this.isDesktopSharingEnabled) {
            logger.warn('Cannot toggle screen sharing: not supported.');

            return;
        }

        this.videoSwitchInProgress = true;
        let externalInstallation = false;

        if (shareScreen) {
            createLocalTracks({
                devices: [ 'desktop' ],
                desktopSharingExtensionExternalInstallation: {
                    interval: 500,
                    checkAgain: () => DSExternalInstallationInProgress,
                    listener: (status, url) => {
                        switch (status) {
                        case 'waitingForExtension':
                            DSExternalInstallationInProgress = true;
                            externalInstallation = true;
                            APP.UI.showExtensionExternalInstallationDialog(
                                    url);
                            break;
                        case 'extensionFound':
                            if (externalInstallation) {
                                // close the dialog
                                $.prompt.close();
                            }
                            break;
                        default:

                                // Unknown status
                        }
                    }
                }
            })
            .then(([ stream ]) => {
                DSExternalInstallationInProgress = false;

                // close external installation dialog on success.
                if (externalInstallation) {
                    $.prompt.close();
                }
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
            })
            .then(() => {
                this.videoSwitchInProgress = false;
                JitsiMeetJS.analytics.sendEvent(
                    'conference.sharingDesktop.start');
                logger.log('sharing local desktop');
            })
            .catch(err => {
                // close external installation dialog to show the error.
                if (externalInstallation) {
                    $.prompt.close();
                }
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
                        'dialog.screenSharingPermissionDeniedError');
                    dialogTitleKey = 'dialog.error';
                } else {
                    dialogTxt = APP.translation.generateTranslationHTML(
                        'dialog.failtoinstall');
                    dialogTitleKey = 'dialog.permissionDenied';
                }

                APP.UI.messageHandler.openDialog(
                    dialogTitleKey, dialogTxt, false);
            });
        } else {
            createLocalTracks({ devices: [ 'video' ] }).then(
                ([ stream ]) => this.useVideoStream(stream)
            )
            .then(() => {
                this.videoSwitchInProgress = false;
                JitsiMeetJS.analytics.sendEvent(
                    'conference.sharingDesktop.stop');
                logger.log('sharing local video');
            })
            .catch(err => {
                this.useVideoStream(null);
                this.videoSwitchInProgress = false;
                logger.error('failed to share local video', err);
            });
        }
    },

    /**
     * Setup interaction between conference and UI.
     *
     * @returns {void}
     */
    _setupListeners() {
        // add local streams when joined to the conference
        room.on(ConferenceEvents.CONFERENCE_JOINED, () => {
            APP.UI.mucJoined();
            APP.API.notifyConferenceJoined(APP.conference.roomName);
            APP.UI.markVideoInterrupted(false);
        });

        room.on(
            ConferenceEvents.AUTH_STATUS_CHANGED,
            (authEnabled, authLogin) => {
                APP.UI.updateAuthInfo(authEnabled, authLogin);
            }
        );

        room.on(ConferenceEvents.USER_JOINED, (id, user) => {
            if (user.isHidden()) {
                return;
            }

            logger.log('USER %s connnected', id, user);
            APP.API.notifyUserJoined(id);
            APP.UI.addUser(user);

            // check the roles for the new user and reflect them
            APP.UI.updateUserRole(user);
        });
        room.on(ConferenceEvents.USER_LEFT, (id, user) => {
            logger.log('USER %s LEFT', id, user);
            APP.API.notifyUserLeft(id);
            APP.UI.removeUser(id, user.getDisplayName());
            APP.UI.onSharedVideoStop(id);
        });


        room.on(ConferenceEvents.USER_ROLE_CHANGED, (id, role) => {
            if (this.isLocalId(id)) {
                logger.info(`My role changed, new role: ${role}`);
                if (this.isModerator !== room.isModerator()) {
                    this.isModerator = room.isModerator();
                    APP.UI.updateLocalRole(room.isModerator());
                }
            } else {
                const user = room.getParticipantById(id);

                if (user) {
                    APP.UI.updateUserRole(user);
                }
            }
        });

        room.on(ConferenceEvents.TRACK_ADDED, track => {
            if (!track || track.isLocal()) {
                return;
            }

            track.on(TrackEvents.TRACK_VIDEOTYPE_CHANGED, type => {
                APP.UI.onPeerVideoTypeChanged(track.getParticipantId(), type);
            });
            APP.UI.addRemoteStream(track);
        });

        room.on(ConferenceEvents.TRACK_REMOVED, track => {
            if (!track || track.isLocal()) {
                return;
            }

            APP.UI.removeRemoteStream(track);
        });

        room.on(ConferenceEvents.TRACK_MUTE_CHANGED, track => {
            let handler;

            if (!track) {
                return;
            }

            if (track.getType() === 'audio') {
                handler = APP.UI.setAudioMuted;
            } else {
                handler = APP.UI.setVideoMuted;
            }

            let id;
            const mute = track.isMuted();

            if (track.isLocal()) {
                id = APP.conference.getMyUserId();
                if (track.getType() === 'audio') {
                    this.audioMuted = mute;
                } else {
                    this.videoMuted = mute;
                }
            } else {
                id = track.getParticipantId();
            }
            handler(id, mute);
        });
        room.on(ConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED, (id, lvl) => {
            let normalizedLvl = lvl;

            if (this.isLocalId(id) && localAudio && localAudio.isMuted()) {
                normalizedLvl = 0;
            }

            if (config.debug) {
                this.audioLevelsMap[id] = normalizedLvl;
                if (config.debugAudioLevels) {
                    logger.log(`AudioLevel:${id}/${normalizedLvl}`);
                }
            }

            APP.UI.setAudioLevel(id, lvl);
        });

        room.on(ConferenceEvents.TALK_WHILE_MUTED, () => {
            APP.UI.showToolbar(6000);
            UIUtil.animateShowElement($('#talkWhileMutedPopup'), true, 5000);
        });

/*
        room.on(ConferenceEvents.IN_LAST_N_CHANGED, (inLastN) => {
            //FIXME
            if (config.muteLocalVideoIfNotInLastN) {
                // TODO mute or unmute if required
                // mark video on UI
                // APP.UI.markVideoMuted(true/false);
            }
        });
*/
        room.on(
            ConferenceEvents.LAST_N_ENDPOINTS_CHANGED, (ids, enteringIds) => {
                APP.UI.handleLastNEndpoints(ids, enteringIds);
            });
        room.on(
            ConferenceEvents.PARTICIPANT_CONN_STATUS_CHANGED,
            (id, isActive) => {
                APP.UI.participantConnectionStatusChanged(id, isActive);
            });
        room.on(ConferenceEvents.DOMINANT_SPEAKER_CHANGED, id => {
            if (this.isLocalId(id)) {
                this.isDominantSpeaker = true;
                this.setRaisedHand(false);
            } else {
                this.isDominantSpeaker = false;
                const participant = room.getParticipantById(id);

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
            room.on(ConferenceEvents.MESSAGE_RECEIVED, (id, text, ts) => {
                const nick = getDisplayName(id);

                APP.API.notifyReceivedChatMessage(id, nick, text, ts);
                APP.UI.addMessage(id, nick, text, ts);
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

            APP.API.notifyDisplayNameChanged(id, formattedDisplayName);
            APP.UI.changeDisplayName(id, formattedDisplayName);
        });

        room.on(ConferenceEvents.PARTICIPANT_PROPERTY_CHANGED,

            // eslint-disable-next-line max-params
            (participant, name, oldValue, newValue) => {
                if (name === 'raisedHand') {
                    APP.UI.setRaisedHandStatus(participant, newValue);
                }
            });

        room.on(ConferenceEvents.RECORDER_STATE_CHANGED, (status, error) => {
            logger.log('Received recorder status change: ', status, error);
            APP.UI.updateRecordingState(status);
        });

        room.on(ConferenceEvents.KICKED, () => {
            APP.UI.hideStats();
            APP.UI.notifyKicked();

            // FIXME close
        });

        room.on(ConferenceEvents.SUSPEND_DETECTED, () => {
            // After wake up, we will be in a state where conference is left
            // there will be dialog shown to user.
            // We do not want video/audio as we show an overlay and after it
            // user need to rejoin or close, while waking up we can detect
            // camera wakeup as a problem with device.
            // We also do not care about device change, which happens
            // on resume after suspending PC.
            if (this.deviceChangeListener) {
                JitsiMeetJS.mediaDevices.removeEventListener(
                    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
                    this.deviceChangeListener);
            }

            // stop local video
            if (localVideo) {
                localVideo.dispose();
            }

            // stop local audio
            if (localAudio) {
                localAudio.dispose();
            }

            // show overlay
            APP.UI.showSuspendedOverlay();
        });

        room.on(ConferenceEvents.DTMF_SUPPORT_CHANGED, isDTMFSupported => {
            APP.UI.updateDTMFSupport(isDTMFSupported);
        });

        APP.UI.addListener(UIEvents.EXTERNAL_INSTALLATION_CANCELED, () => {
            // Wait a little bit more just to be sure that we won't miss the
            // extension installation
            setTimeout(() => {
                DSExternalInstallationInProgress = false;
            }, 500);
        });
        APP.UI.addListener(UIEvents.OPEN_EXTENSION_STORE, url => {
            window.open(
                url, 'extension_store_window',
                'resizable,scrollbars=yes,status=1');
        });

        APP.UI.addListener(UIEvents.AUDIO_MUTED, muteLocalAudio);
        APP.UI.addListener(UIEvents.VIDEO_MUTED, muteLocalVideo);

        if (!interfaceConfig.filmStripOnly) {
            APP.UI.addListener(UIEvents.MESSAGE_CREATED, message => {
                APP.API.notifySendingChatMessage(message);
                room.sendTextMessage(message);
            });
        }

        room.on(ConnectionQualityEvents.LOCAL_STATS_UPDATED,
            stats => {
                APP.UI.updateLocalStats(stats.connectionQuality, stats);

            });

        room.on(ConnectionQualityEvents.REMOTE_STATS_UPDATED,
            (id, stats) => {
                APP.UI.updateRemoteStats(id, stats.connectionQuality, stats);
            });

        room.addCommandListener(this.commands.defaults.ETHERPAD,
            ({ value }) => {
                APP.UI.initEtherpad(value);
            });

        APP.UI.addListener(UIEvents.EMAIL_CHANGED, changeLocalEmail);
        room.addCommandListener(this.commands.defaults.EMAIL, (data, from) => {
            APP.UI.setUserEmail(from, data.value);
        });

        room.addCommandListener(
            this.commands.defaults.AVATAR_URL,
            (data, from) => {
                APP.UI.setUserAvatarUrl(from, data.value);
            });

        room.addCommandListener(this.commands.defaults.AVATAR_ID,
            (data, from) => {
                APP.UI.setUserAvatarID(from, data.value);
            });

        APP.UI.addListener(UIEvents.NICKNAME_CHANGED, changeLocalDisplayName);

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
            ConferenceEvents.AVAILABLE_DEVICES_CHANGED, (id, devices) => {
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
                    window.location.href = url;
                } else {
                    this.hangup(true);
                }
            });
        });

        APP.UI.addListener(UIEvents.SIP_DIAL, sipNumber => {
            room.dial(sipNumber);
        });

        APP.UI.addListener(UIEvents.RESOLUTION_CHANGED,

            // eslint-disable-next-line max-params
            (id, oldResolution, newResolution, delay) => {
                const logObject = {
                    id: 'resolution_change',
                    participant: id,
                    oldValue: oldResolution,
                    newValue: newResolution,
                    delay
                };

                room.sendApplicationLog(JSON.stringify(logObject));

            // We only care about the delay between simulcast streams.
            // Longer delays will be caused by something else and will just
            // poison the data.
                if (delay < 2000) {
                    JitsiMeetJS.analytics.sendEvent('stream.switch.delay',
                    { value: delay });
                }
            });

        // Starts or stops the recording for the conference.
        APP.UI.addListener(UIEvents.RECORDING_TOGGLED, options => {
            room.toggleRecording(options);
        });

        APP.UI.addListener(UIEvents.SUBJECT_CHANGED, topic => {
            room.setSubject(topic);
        });
        room.on(ConferenceEvents.SUBJECT_CHANGED, subject => {
            APP.UI.setSubject(subject);
        });

        APP.UI.addListener(UIEvents.USER_KICKED, id => {
            room.kickParticipant(id);
        });

        APP.UI.addListener(UIEvents.REMOTE_AUDIO_MUTED, id => {
            room.muteParticipant(id);
        });

        APP.UI.addListener(UIEvents.AUTH_CLICKED, () => {
            AuthHandler.authenticate(room);
        });

        APP.UI.addListener(UIEvents.SELECTED_ENDPOINT, id => {
            try {
                // do not try to select participant if there is none (we are
                // alone in the room), otherwise an error will be thrown cause
                // reporting mechanism is not available (datachannels currently)
                if (room.getParticipants().length === 0) {
                    return;
                }

                room.selectParticipant(id);
            } catch (e) {
                JitsiMeetJS.analytics.sendEvent('selectParticipant.failed');
                reportError(e);
            }
        });

        APP.UI.addListener(UIEvents.PINNED_ENDPOINT, (smallVideo, isPinned) => {
            const smallVideoId = smallVideo.getId();
            const isLocal = APP.conference.isLocalId(smallVideoId);

            const eventName
                = `${isPinned ? 'pinned' : 'unpinned'}.${
                        isLocal ? 'local' : 'remote'}`;
            const participantCount = room.getParticipantCount();

            JitsiMeetJS.analytics.sendEvent(
                    eventName,
                    { value: participantCount });

            // FIXME why VIDEO_CONTAINER_TYPE instead of checking if
            // the participant is on the large video ?
            if (smallVideo.getVideoType() === VIDEO_CONTAINER_TYPE
                && !isLocal) {

                // When the library starts supporting multiple pins we would
                // pass the isPinned parameter together with the identifier,
                // but currently we send null to indicate that we unpin the
                // last pinned.
                try {
                    room.pinParticipant(isPinned ? smallVideoId : null);
                } catch (e) {
                    reportError(e);
                }
            }
        });

        APP.UI.addListener(
            UIEvents.VIDEO_DEVICE_CHANGED,
            cameraDeviceId => {
                JitsiMeetJS.analytics.sendEvent('settings.changeDevice.video');
                createLocalTracks({
                    devices: [ 'video' ],
                    cameraDeviceId,
                    micDeviceId: null
                })
                .then(([ stream ]) => {
                    this.useVideoStream(stream);
                    logger.log('switched local video device');
                    APP.settings.setCameraDeviceId(cameraDeviceId, true);
                })
                .catch(err => {
                    APP.UI.showDeviceErrorDialog(null, err);
                    APP.UI.setSelectedCameraFromSettings();
                });
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_DEVICE_CHANGED,
            micDeviceId => {
                JitsiMeetJS.analytics.sendEvent(
                    'settings.changeDevice.audioIn');
                createLocalTracks({
                    devices: [ 'audio' ],
                    cameraDeviceId: null,
                    micDeviceId
                })
                .then(([ stream ]) => {
                    this.useAudioStream(stream);
                    logger.log('switched local audio device');
                    APP.settings.setMicDeviceId(micDeviceId, true);
                })
                .catch(err => {
                    APP.UI.showDeviceErrorDialog(err, null);
                    APP.UI.setSelectedMicFromSettings();
                });
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_OUTPUT_DEVICE_CHANGED,
            audioOutputDeviceId => {
                JitsiMeetJS.analytics.sendEvent(
                    'settings.changeDevice.audioOut');
                APP.settings.setAudioOutputDeviceId(audioOutputDeviceId)
                    .then(() => logger.log('changed audio output device'))
                    .catch(err => {
                        logger.warn('Failed to change audio output device. '
                            + 'Default or previously set audio output device '
                            + 'will be used instead.', err);
                        APP.UI.setSelectedAudioOutputFromSettings();
                    });
            }
        );

        APP.UI.addListener(
            UIEvents.TOGGLE_SCREENSHARING, this.toggleScreenSharing.bind(this)
        );

        APP.UI.addListener(UIEvents.UPDATE_SHARED_VIDEO,

            // eslint-disable-next-line max-params
            (url, state, time, isMuted, volume) => {
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
    * Adds any room listener.
    *
    * @param {string} eventName - One of the ConferenceEvents.
    * @param {Function} callBack - The function to be called when
    * the event occurs.
    * @returns {void}
    */
    addConferenceListener(eventName, callBack) {
        room.on(eventName, callBack);
    },

    /**
     * Inits list of current devices and event listener for device change.
     *
     * @private
     * @returns {void}
     */
    _initDeviceList() {
        if (JitsiMeetJS.mediaDevices.isDeviceListAvailable()
            && JitsiMeetJS.mediaDevices.isDeviceChangeAvailable()) {
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
            });

            this.deviceChangeListener = devices =>
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
     *
     * @private
     * @param {MediaDeviceInfo[]} devices - List of devices.
     * @returns {Promise}
     */
    _onDeviceListChanged(devices) {
        let currentDevices = mediaDeviceHelper.getCurrentMediaDevices();

        // Event handler can be fired before direct
        // enumerateDevices() call, so handle this situation here.
        if (!currentDevices.audioinput
            && !currentDevices.videoinput
            && !currentDevices.audiooutput) {
            mediaDeviceHelper.setCurrentMediaDevices(devices);
            currentDevices = mediaDeviceHelper.getCurrentMediaDevices();
        }

        const newDevices
            = mediaDeviceHelper.getNewMediaDevicesAfterDeviceListChanged(
                devices, this.isSharingScreen, localVideo, localAudio);
        const promises = [];
        const audioWasMuted = this.audioMuted;
        const videoWasMuted = this.videoMuted;
        const availableAudioInputDevices
            = mediaDeviceHelper.getDevicesFromListByKind(devices, 'audioinput');
        const availableVideoInputDevices
            = mediaDeviceHelper.getDevicesFromListByKind(devices, 'videoinput');

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
                    if (audioWasMuted
                        || currentDevices.audioinput.length
                        > availableAudioInputDevices.length) {
                        muteLocalAudio(true);
                    }

                    // If video was muted before, or we unplugged current device
                    // and selected new one, then mute new video track.
                    if (videoWasMuted
                        || currentDevices.videoinput.length
                        > availableVideoInputDevices.length) {
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
     * Toggles the local 'raised hand' status.
     *
     * @returns {void}
     */
    maybeToggleRaisedHand() {
        this.setRaisedHand(!this.isHandRaised);
    },

    /**
     * Sets the local 'raised hand' status to a particular value.
     *
     * @param {boolean} raisedHand - If hand should be raised.
     * @returns {void}
     */
    setRaisedHand(raisedHand) {
        if (raisedHand !== this.isHandRaised) {
            APP.UI.onLocalRaiseHandChanged(raisedHand);

            this.isHandRaised = raisedHand;

            // Advertise the updated status
            room.setLocalParticipantProperty('raisedHand', raisedHand);

            // Update the view
            APP.UI.setLocalRaisedHandStatus(raisedHand);
        }
    },

    /**
     * Log event to callstats and analytics.
     * NOTE: Should be used after conference.init.
     *
     * @param {string} name - The event name.
     * @param {int} value - The value (it's int because
     * google analytics supports only int).
     * @param {string} label - Short text which provides more
     * info about the event which allows to distinguish between
     * few event cases of the same name.
     * @returns {void}
     */
    logEvent(name, value, label) {
        if (JitsiMeetJS.analytics) {
            JitsiMeetJS.analytics.sendEvent(name, {
                value,
                label
            });
        }
        if (room) {
            room.sendApplicationLog(JSON.stringify({
                name,
                value,
                label
            }));
        }
    },

    /**
     * Methods logs an application event given in the JSON format.
     *
     * @param {string} logJSON - An event to be logged in JSON format.
     * @returns {void}
     */
    logJSON(logJSON) {
        if (room) {
            room.sendApplicationLog(logJSON);
        }
    },

    /**
     * Disconnect from the conference and optionally request user feedback.
     *
     * @param {boolean} [requestFeedback=false] - If user feedback should be
     * requested.
     * @returns {void}
     */
    hangup(requestFeedback = false) {
        APP.UI.hideRingOverLay();
        const requestFeedbackPromise = requestFeedback
                ? APP.UI.requestFeedbackOnHangup()

                // false - because the thank you dialog shouldn't be displayed
                    .catch(() => Promise.resolve(false))
                : Promise.resolve(true);// true - because the thank you dialog
                // should be displayed

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
    }
};
