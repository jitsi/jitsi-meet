/* global $, APP, JitsiMeetJS, config, interfaceConfig */
import {openConnection} from './connection';
//FIXME:
import createRoomLocker from './modules/UI/authentication/RoomLocker';
//FIXME:
import AuthHandler from './modules/UI/authentication/AuthHandler';

import ConnectionQuality from './modules/connectionquality/connectionquality';

import Recorder from './modules/recorder/Recorder';

import CQEvents from './service/connectionquality/CQEvents';
import UIEvents from './service/UI/UIEvents';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

const ConferenceEvents = JitsiMeetJS.events.conference;
const ConferenceErrors = JitsiMeetJS.errors.conference;

const TrackEvents = JitsiMeetJS.events.track;
const TrackErrors = JitsiMeetJS.errors.track;

let room, connection, localAudio, localVideo, roomLocker;
let currentAudioInputDevices, currentVideoInputDevices;

import {VIDEO_CONTAINER_TYPE} from "./modules/UI/videolayout/LargeVideo";

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
 * Share email with other users.
 * @param emailCommand the email command
 * @param {string} email new email
 */
function sendEmail (emailCommand, email) {
    room.sendCommand(emailCommand, {
        value: email,
        attributes: {
            id: room.myUserId()
        }
    });
}

/**
 * Get user nickname by user id.
 * @param {string} id user id
 * @returns {string?} user nickname or undefined if user is unknown.
 */
function getDisplayName (id) {
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
 * @param {boolean} muted if audio stream should be muted or unmuted.
 * @param {boolean} indicates if this local audio mute was a result of user
 * interaction
 *
 */
function muteLocalAudio (muted, userInteraction) {
    if (!localAudio) {
        return;
    }

    if (muted) {
        localAudio.mute().then(function(value) {},
            function(value) {
                console.warn('Audio Mute was rejected:', value);
            }
        );
    } else {
        localAudio.unmute().then(function(value) {},
            function(value) {
                console.warn('Audio unmute was rejected:', value);
            }
        );
    }
}

/**
 * Mute or unmute local video stream if it exists.
 * @param {boolean} muted if video stream should be muted or unmuted.
 */
function muteLocalVideo (muted) {
    if (!localVideo) {
        return;
    }

    if (muted) {
        localVideo.mute().then(function(value) {},
            function(value) {
                console.warn('Video mute was rejected:', value);
            }
        );
    } else {
        localVideo.unmute().then(function(value) {},
            function(value) {
                console.warn('Video unmute was rejected:', value);
            }
        );
    }
}

/**
 * Check if the welcome page is enabled and redirects to it.
 */
function maybeRedirectToWelcomePage() {
    if (!config.enableWelcomePage) {
        return;
    }
    // redirect to welcome page
    setTimeout(() => {
        APP.settings.setWelcomePageEnabled(true);
        window.location.pathname = "/";
    }, 3000);
}

/**
 * Executes connection.disconnect and shows the feedback dialog
 * @param {boolean} [requestFeedback=false] if user feedback should be requested
 * @returns Promise.
 */
function disconnectAndShowFeedback(requestFeedback) {
    connection.disconnect();
    if (requestFeedback) {
        return APP.UI.requestFeedback();
    } else {
        return Promise.resolve();
    }
}

/**
 * Disconnect from the conference and optionally request user feedback.
 * @param {boolean} [requestFeedback=false] if user feedback should be requested
 */
function hangup (requestFeedback = false) {
    const errCallback = (f, err) => {
        console.error('Error occurred during hanging up: ', err);
        return f();
    };
    const disconnect = disconnectAndShowFeedback.bind(null, requestFeedback);
    APP.conference._room.leave()
    .then(disconnect)
    .catch(errCallback.bind(null, disconnect))
    .then(maybeRedirectToWelcomePage)
    .catch(errCallback.bind(null, maybeRedirectToWelcomePage));
}

/**
 * Create local tracks of specified types.
 * @param {string[]} devices - required track types ('audio', 'video' etc.)
 * @param {string|null} [cameraDeviceId] - camera device id, if undefined - one
 *      from settings will be used
 * @param {string|null} [micDeviceId] - microphone device id, if undefined - one
 *      from settings will be used
 * @returns {Promise<JitsiLocalTrack[]>}
 */
function createLocalTracks (devices, cameraDeviceId, micDeviceId) {
    return JitsiMeetJS.createLocalTracks({
        // copy array to avoid mutations inside library
        devices: devices.slice(0),
        resolution: config.resolution,
        cameraDeviceId: typeof cameraDeviceId === 'undefined'
            || cameraDeviceId === null
                ? APP.settings.getCameraDeviceId()
                : cameraDeviceId,
        micDeviceId: typeof micDeviceId === 'undefined' || micDeviceId === null
            ? APP.settings.getMicDeviceId()
            : micDeviceId,
        // adds any ff fake device settings if any
        firefox_fake_device: config.firefox_fake_device
    }).catch(function (err) {
        console.error('failed to create local tracks', ...devices, err);
        return Promise.reject(err);
    });
}

/**
 * Stores lists of current 'audioinput' and 'videoinput' devices
 * @param {MediaDeviceInfo[]} devices
 */
function setCurrentMediaDevices(devices) {
    currentAudioInputDevices = devices.filter(
        d => d.kind === 'audioinput');
    currentVideoInputDevices = devices.filter(
        d => d.kind === 'videoinput');
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
    _handleConferenceFailed(err, msg) {
        this._unsubscribe();
        this._reject(err);
    }
    _onConferenceFailed(err, ...params) {
        console.error('CONFERENCE FAILED:', err, ...params);
        switch (err) {
            // room is locked by the password
        case ConferenceErrors.PASSWORD_REQUIRED:
            APP.UI.markRoomLocked(true);
            roomLocker.requirePassword().then(function () {
                room.join(roomLocker.password);
            });
            break;

        case ConferenceErrors.CONNECTION_ERROR:
            {
                let [msg] = params;
                APP.UI.notifyConnectionFailed(msg);
            }
            break;

        case ConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE:
            APP.UI.notifyBridgeDown();
            break;

            // not enough rights to create conference
        case ConferenceErrors.AUTHENTICATION_REQUIRED:
            // schedule reconnect to check if someone else created the room
            this.reconnectTimeout = setTimeout(function () {
                room.join();
            }, 5000);

            // notify user that auth is required

            AuthHandler.requireAuth(room, roomLocker.password);
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

        case ConferenceErrors.FOCUS_DISCONNECTED:
            {
                let [focus, retrySec] = params;
                APP.UI.notifyFocusDisconnected(focus, retrySec);
            }
            break;

        case ConferenceErrors.FOCUS_LEFT:
            room.leave().then(() => connection.disconnect());
            APP.UI.notifyFocusLeft();
            break;

        case ConferenceErrors.CONFERENCE_MAX_USERS:
            connection.disconnect();
            APP.UI.notifyMaxUsersLimitReached();
            break;
        default:
            this._handleConferenceFailed(err, ...params);
        }
    }
    _onConferenceError(err, ...params) {
        console.error('CONFERENCE Error:', err, params);
        switch (err) {
        case ConferenceErrors.CHAT_ERROR:
            {
                let [code, msg] = params;
                APP.UI.showChatError(code, msg);
            }
            break;
        default:
            console.error("Unknown error.");
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

export default {
    localId: undefined,
    isModerator: false,
    audioMuted: false,
    videoMuted: false,
    isSharingScreen: false,
    isDesktopSharingEnabled: false,
    /**
     * Open new connection and join to the conference.
     * @param {object} options
     * @param {string} roomName name of the conference
     * @returns {Promise}
     */
    init(options) {
        let self = this;
        this.roomName = options.roomName;
        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.TRACE);

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

        return JitsiMeetJS.init(config).then(() => {
            return Promise.all([
                // try to retrieve audio and video
                createLocalTracks(['audio', 'video'])
                // if failed then try to retrieve only audio
                    .catch(() => createLocalTracks(['audio']))
                // if audio also failed then just return empty array
                    .catch(() => []),
                connect(options.roomName)
            ]);
        }).then(([tracks, con]) => {
            console.log('initialized with %s local tracks', tracks.length);
            APP.connection = connection = con;
            this._createRoom(tracks);
            this.isDesktopSharingEnabled =
                JitsiMeetJS.isDesktopSharingEnabled();

            // if user didn't give access to mic or camera or doesn't have
            // them at all, we disable corresponding toolbar buttons
            if (!tracks.find((t) => t.isAudioTrack())) {
                APP.UI.disableMicrophoneButton();
            }

            if (!tracks.find((t) => t.isVideoTrack())) {
                APP.UI.disableCameraButton();
            }

            // update list of available devices
            if (JitsiMeetJS.mediaDevices.isDeviceListAvailable() &&
                JitsiMeetJS.mediaDevices.isDeviceChangeAvailable()) {
                JitsiMeetJS.mediaDevices.enumerateDevices(function(devices) {
                    // Ugly way to synchronize real device IDs with local
                    // storage and settings menu. This is a workaround until
                    // getConstraints() method will be implemented in browsers.
                    if (localAudio) {
                        localAudio._setRealDeviceIdFromDeviceList(devices);
                        APP.settings.setMicDeviceId(localAudio.getDeviceId());
                    }

                    if (localVideo) {
                        localVideo._setRealDeviceIdFromDeviceList(devices);
                        APP.settings.setCameraDeviceId(
                            localVideo.getDeviceId());
                    }

                    setCurrentMediaDevices(devices);

                    APP.UI.onAvailableDevicesChanged(devices);
                });

                JitsiMeetJS.mediaDevices.addEventListener(
                    JitsiMeetJS.events.mediaDevices.DEVICE_LIST_CHANGED,
                    (devices) => {
                        // Just defer callback until other event callbacks are
                        // processed.
                        window.setTimeout(() => {
                            checkLocalDevicesAfterDeviceListChanged(devices)
                                .then(() => {
                                    setCurrentMediaDevices(devices);

                                    APP.UI.onAvailableDevicesChanged(devices);
                                });
                        }, 0);
                    });
            }
            if (config.iAmRecorder)
                this.recorder = new Recorder();

            // XXX The API will take care of disconnecting from the XMPP server
            // (and, thus, leaving the room) on unload.
            return new Promise((resolve, reject) => {
                (new ConferenceConnector(resolve, reject)).connect();
            });

            function checkAudioOutputDeviceAfterDeviceListChanged(newDevices) {
                if (!JitsiMeetJS.mediaDevices
                        .isDeviceChangeAvailable('output')) {
                    return;
                }

                var selectedAudioOutputDeviceId =
                        APP.settings.getAudioOutputDeviceId(),
                    availableAudioOutputDevices = newDevices.filter(d => {
                        return d.kind === 'audiooutput';
                    });

                if (selectedAudioOutputDeviceId !== 'default' &&
                    !availableAudioOutputDevices.find(d =>
                    d.deviceId === selectedAudioOutputDeviceId)) {
                    APP.settings.setAudioOutputDeviceId('default');
                }
            }

            function checkLocalDevicesAfterDeviceListChanged(newDevices) {
                // Event handler can be fire before direct enumerateDevices()
                // call, so handle this situation here.
                if (!currentAudioInputDevices && !currentVideoInputDevices) {
                    setCurrentMediaDevices(newDevices);
                }

                checkAudioOutputDeviceAfterDeviceListChanged(newDevices);

                let availableAudioInputDevices = newDevices.filter(
                        d => d.kind === 'audioinput'),
                    availableVideoInputDevices = newDevices.filter(
                        d => d.kind === 'videoinput'),
                    selectedAudioInputDeviceId = APP.settings.getMicDeviceId(),
                    selectedVideoInputDeviceId =
                        APP.settings.getCameraDeviceId(),
                    selectedAudioInputDevice = availableAudioInputDevices.find(
                        d => d.deviceId === selectedAudioInputDeviceId),
                    selectedVideoInputDevice = availableVideoInputDevices.find(
                        d => d.deviceId === selectedVideoInputDeviceId),
                    tracksToCreate = [],
                    micIdToUse = null,
                    cameraIdToUse = null;

                // Here we handle case when no device was initially plugged, but
                // then it's connected OR new device was connected when previous
                // track has ended.
                if (!localAudio || localAudio.disposed || localAudio.isEnded()){
                    if (availableAudioInputDevices.length
                        && availableAudioInputDevices[0].label !== '') {
                        tracksToCreate.push('audio');
                        micIdToUse = availableAudioInputDevices[0].deviceId;
                    } else {
                        APP.UI.disableMicrophoneButton();
                    }
                }

                if ((!localVideo || localVideo.disposed || localVideo.isEnded())
                    && !self.isSharingScreen){
                    if (availableVideoInputDevices.length
                        && availableVideoInputDevices[0].label !== '') {
                        tracksToCreate.push('video');
                        cameraIdToUse = availableVideoInputDevices[0].deviceId;
                    } else {
                        APP.UI.disableCameraButton();
                    }
                }

                if (localAudio && !localAudio.disposed && !localAudio.isEnded()
                    && selectedAudioInputDevice
                    && selectedAudioInputDeviceId !== localAudio.getDeviceId()
                    && tracksToCreate.indexOf('audio') === -1) {
                    tracksToCreate.push('audio');
                    micIdToUse = selectedAudioInputDeviceId;
                }

                if (localVideo && !localVideo.disposed && !localVideo.isEnded()
                    && selectedVideoInputDevice
                    && selectedVideoInputDeviceId !== localVideo.getDeviceId()
                    && tracksToCreate.indexOf('video') === -1
                    && !self.isSharingScreen) {
                    tracksToCreate.push('video');
                    cameraIdToUse = selectedVideoInputDeviceId;
                }

                if (tracksToCreate.length) {
                    return createNewTracks(
                        tracksToCreate, cameraIdToUse, micIdToUse);
                } else {
                    return Promise.resolve();
                }

                function createNewTracks(type, cameraDeviceId, micDeviceId) {
                    return createLocalTracks(type, cameraDeviceId, micDeviceId)
                        .then(onTracksCreated)
                        .catch(() => {
                            // if we tried to create both audio and video tracks
                            // at once and failed, let's try again only with
                            // audio. Such situation may happen in case if we
                            // granted access only to microphone, but not to
                            // camera.
                            if (type.indexOf('audio') !== -1
                                && type.indexOf('video') !== -1) {
                                return createLocalTracks(['audio'], null,
                                    micDeviceId);
                            }

                        })
                        .then(onTracksCreated)
                        .catch(() => {
                            // if we tried to create both audio and video tracks
                            // at once and failed, let's try again only with
                            // video. Such situation may happen in case if we
                            // granted access only to camera, but not to
                            // microphone.
                            if (type.indexOf('audio') !== -1
                                && type.indexOf('video') !== -1) {
                                return createLocalTracks(['video'],
                                    cameraDeviceId,
                                    null);
                            }
                        })
                        .then(onTracksCreated)
                        .catch(() => {
                            // can't do anything in this case, so just ignore;
                        });
                }

                function onTracksCreated(tracks) {
                    return Promise.all((tracks || []).map(track => {
                        if (track.isAudioTrack()) {
                            let audioWasMuted = self.audioMuted;

                            return self.useAudioStream(track).then(() => {
                                console.log('switched local audio');

                                // If we plugged-in new device (and switched to
                                // it), but video was muted before, or we
                                // unplugged current device and selected new
                                // one, then mute new video track.
                                if (audioWasMuted ||
                                    currentAudioInputDevices.length >
                                    availableAudioInputDevices.length) {
                                    muteLocalAudio(true);
                                }
                            });
                        } else if (track.isVideoTrack()) {
                            let videoWasMuted = self.videoMuted;

                            return self.useVideoStream(track).then(() => {
                                console.log('switched local video');

                                // TODO: maybe make video large if we
                                // are not in conference yet

                                // If we plugged-in new device (and switched to
                                // it), but video was muted before, or we
                                // unplugged current device and selected new
                                // one, then mute new video track.
                                if (videoWasMuted ||
                                    (currentVideoInputDevices.length >
                                    availableVideoInputDevices.length)) {
                                    muteLocalVideo(true);
                                }
                            });
                        } else {
                            console.error("Ignored not an audio nor a "
                                + "video track: ", track);

                            return Promise.resolve();
                        }
                    }));
                }
            }
        });
    },
    /**
     * Check if id is id of the local user.
     * @param {string} id id to check
     * @returns {boolean}
     */
    isLocalId (id) {
        return this.localId === id;
    },
    /**
     * Simulates toolbar button click for audio mute. Used by shortcuts and API.
     * @param mute true for mute and false for unmute.
     */
    muteAudio (mute) {
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
     * Simulates toolbar button click for audio mute. Used by shortcuts and API.
     */
    toggleAudioMuted () {
        this.muteAudio(!this.audioMuted);
    },
    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     * @param mute true for mute and false for unmute.
     */
    muteVideo (mute) {
        muteLocalVideo(mute);
    },
    /**
     * Simulates toolbar button click for video mute. Used by shortcuts and API.
     */
    toggleVideoMuted () {
        this.muteVideo(!this.videoMuted);
    },
    /**
     * Retrieve list of conference participants (without local user).
     * @returns {JitsiParticipant[]}
     */
    listMembers () {
        return room.getParticipants();
    },
    /**
     * Retrieve list of ids of conference participants (without local user).
     * @returns {string[]}
     */
    listMembersIds () {
        return room.getParticipants().map(p => p.getId());
    },
    /**
     * Checks whether the participant identified by id is a moderator.
     * @id id to search for participant
     * @return {boolean} whether the participant is moderator
     */
    isParticipantModerator (id) {
        let user = room.getParticipantById(id);
        return user && user.isModerator();
    },
    /**
     * Check if SIP is supported.
     * @returns {boolean}
     */
    sipGatewayEnabled () {
        return room.isSIPCallingSupported();
    },
    get membersCount () {
        return room.getParticipants().length + 1;
    },
    /**
     * Returns true if the callstats integration is enabled, otherwise returns
     * false.
     *
     * @returns true if the callstats integration is enabled, otherwise returns
     * false.
     */
    isCallstatsEnabled () {
        return room.isCallstatsEnabled();
    },
    /**
     * Sends the given feedback through CallStats if enabled.
     *
     * @param overallFeedback an integer between 1 and 5 indicating the
     * user feedback
     * @param detailedFeedback detailed feedback from the user. Not yet used
     */
    sendFeedback (overallFeedback, detailedFeedback) {
        return room.sendFeedback (overallFeedback, detailedFeedback);
    },
    // used by torture currently
    isJoined () {
        return this._room
            && this._room.isJoined();
    },
    getConnectionState () {
        return this._room
            && this._room.getConnectionState();
    },
    getMyUserId () {
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
    getPeerSSRCAudioLevel (id) {
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
        return ConnectionQuality.getStats();
    },
    // end used by torture

    getLogs () {
        return room.getLogs();
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
        defaults: {
            CONNECTION_QUALITY: "stats",
            EMAIL: "email",
            ETHERPAD: "etherpad",
            SHARED_VIDEO: "shared-video",
            CUSTOM_ROLE: "custom-role"
        },
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
        this.localId = room.myUserId();
        localTracks.forEach((track) => {
            if (track.isAudioTrack()) {
                this.useAudioStream(track);
            } else if (track.isVideoTrack()) {
                this.useVideoStream(track);
            } else {
                console.error(
                    "Ignored not an audio nor a video track: ", track);
            }
        });
        roomLocker = createRoomLocker(room);
        this._room = room; // FIXME do not use this

        let email = APP.settings.getEmail();
        email && sendEmail(this.commands.defaults.EMAIL, email);

        let nick = APP.settings.getDisplayName();
        if (config.useNicks && !nick) {
            nick = APP.UI.askForNickname();
            APP.settings.setDisplayName(nick);
        }
        nick && room.setDisplayName(nick);

        this._setupListeners();
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
    useVideoStream (stream) {
        let promise = Promise.resolve();
        if (localVideo) {
            // this calls room.removeTrack internally
            // so we don't need to remove it manually
            promise = localVideo.dispose();
        }
        localVideo = stream;

        return promise.then(function () {
            if (stream) {
                return room.addTrack(stream);
            }
        }).then(() => {
            if (stream) {
                this.videoMuted = stream.isMuted();
                this.isSharingScreen = stream.videoType === 'desktop';

                APP.UI.addLocalStream(stream);
            } else {
                this.videoMuted = false;
                this.isSharingScreen = false;
            }

            stream.videoType === 'camera' && APP.UI.enableCameraButton();

            APP.UI.setVideoMuted(this.localId, this.videoMuted);

            APP.UI.updateDesktopSharingButtons();
        });
    },

    /**
     * Start using provided audio stream.
     * Stops previous audio stream.
     * @param {JitsiLocalTrack} [stream] new stream to use or null
     * @returns {Promise}
     */
    useAudioStream (stream) {
        let promise = Promise.resolve();
        if (localAudio) {
            // this calls room.removeTrack internally
            // so we don't need to remove it manually
            promise = localAudio.dispose();
        }
        localAudio = stream;

        return promise.then(function () {
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

            APP.UI.enableMicrophoneButton();
            APP.UI.setAudioMuted(this.localId, this.audioMuted);
        });
    },

    videoSwitchInProgress: false,
    toggleScreenSharing (shareScreen = !this.isSharingScreen) {
        if (this.videoSwitchInProgress) {
            console.warn("Switch in progress.");
            return;
        }
        if (!this.isDesktopSharingEnabled) {
            console.warn("Cannot toggle screen sharing: not supported.");
            return;
        }

        this.videoSwitchInProgress = true;

        if (shareScreen) {
            createLocalTracks(['desktop']).then(([stream]) => {
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
                console.log('sharing local desktop');
            }).catch((err) => {
                this.videoSwitchInProgress = false;
                this.toggleScreenSharing(false);

                if(err === TrackErrors.CHROME_EXTENSION_USER_CANCELED)
                    return;

                console.error('failed to share local desktop', err);

                if (err === TrackErrors.FIREFOX_EXTENSION_NEEDED) {
                    APP.UI.showExtensionRequiredDialog(
                        config.desktopSharingFirefoxExtensionURL
                    );
                    return;
                }

                // Handling:
                // TrackErrors.CHROME_EXTENSION_INSTALLATION_ERROR
                // TrackErrors.GENERAL
                // and any other
                let dialogTxt = APP.translation
                    .generateTranslationHTML("dialog.failtoinstall");
                let dialogTitle = APP.translation
                    .generateTranslationHTML("dialog.error");
                APP.UI.messageHandler.openDialog(
                    dialogTitle,
                    dialogTxt,
                    false
                );
            });
        } else {
            createLocalTracks(['video']).then(
                ([stream]) => this.useVideoStream(stream)
            ).then(() => {
                this.videoSwitchInProgress = false;
                console.log('sharing local video');
            }).catch((err) => {
                this.useVideoStream(null);
                this.videoSwitchInProgress = false;
                console.error('failed to share local video', err);
            });
        }
    },
    /**
     * Setup interaction between conference and UI.
     */
    _setupListeners () {
        // add local streams when joined to the conference
        room.on(ConferenceEvents.CONFERENCE_JOINED, () => {
            APP.UI.mucJoined();
        });

        room.on(
            ConferenceEvents.AUTH_STATUS_CHANGED,
            function (authEnabled, authLogin) {
                APP.UI.updateAuthInfo(authEnabled, authLogin);
            }
        );


        room.on(ConferenceEvents.USER_JOINED, (id, user) => {
            if (user.isHidden())
                return;

            console.log('USER %s connnected', id, user);
            APP.API.notifyUserJoined(id);
            APP.UI.addUser(id, user.getDisplayName());

            // check the roles for the new user and reflect them
            APP.UI.updateUserRole(user);
        });
        room.on(ConferenceEvents.USER_LEFT, (id, user) => {
            console.log('USER %s LEFT', id, user);
            APP.API.notifyUserLeft(id);
            APP.UI.removeUser(id, user.getDisplayName());
            APP.UI.onSharedVideoStop(id);
        });


        room.on(ConferenceEvents.USER_ROLE_CHANGED, (id, role) => {
            if (this.isLocalId(id)) {
                console.info(`My role changed, new role: ${role}`);
                this.isModerator = room.isModerator();
                APP.UI.updateLocalRole(room.isModerator());
            } else {
                let user = room.getParticipantById(id);
                if (user) {
                    APP.UI.updateUserRole(user);
                }
            }
        });

        room.on(ConferenceEvents.TRACK_ADDED, (track) => {
            if(!track || track.isLocal())
                return;

            track.on(TrackEvents.TRACK_VIDEOTYPE_CHANGED, (type) => {
                APP.UI.onPeerVideoTypeChanged(track.getParticipantId(), type);
            });
            APP.UI.addRemoteStream(track);
        });

        room.on(ConferenceEvents.TRACK_REMOVED, (track) => {
            if(!track || track.isLocal())
                return;

            APP.UI.removeRemoteStream(track);
        });

        room.on(ConferenceEvents.TRACK_MUTE_CHANGED, (track) => {
            if(!track)
                return;
            const handler = (track.getType() === "audio")?
                APP.UI.setAudioMuted : APP.UI.setVideoMuted;
            let id;
            const mute = track.isMuted();
            if(track.isLocal()){
                id = this.localId;
                if(track.getType() === "audio") {
                    this.audioMuted = mute;
                } else {
                    this.videoMuted = mute;
                }
            } else {
                id = track.getParticipantId();
            }
            handler(id , mute);
        });
        room.on(ConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED, (id, lvl) => {
            if(this.isLocalId(id) && localAudio && localAudio.isMuted()) {
                lvl = 0;
            }

            if(config.debug)
            {
                this.audioLevelsMap[id] = lvl;
                console.log("AudioLevel:" + id + "/" + lvl);
            }

            APP.UI.setAudioLevel(id, lvl);
        });

        room.on(ConferenceEvents.IN_LAST_N_CHANGED, (inLastN) => {
            //FIXME
            if (config.muteLocalVideoIfNotInLastN) {
                // TODO mute or unmute if required
                // mark video on UI
                // APP.UI.markVideoMuted(true/false);
            }
        });
        room.on(
            ConferenceEvents.LAST_N_ENDPOINTS_CHANGED, (ids, enteringIds) => {
            APP.UI.handleLastNEndpoints(ids, enteringIds);
        });
        room.on(ConferenceEvents.DOMINANT_SPEAKER_CHANGED, (id) => {
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
                let nick = getDisplayName(id);
                APP.API.notifyReceivedChatMessage(id, nick, text, ts);
                APP.UI.addMessage(id, nick, text, ts);
            });
        }

        room.on(ConferenceEvents.DISPLAY_NAME_CHANGED, (id, displayName) => {
            APP.API.notifyDisplayNameChanged(id, displayName);
            APP.UI.changeDisplayName(id, displayName);
        });

        room.on(ConferenceEvents.RECORDER_STATE_CHANGED, (status, error) => {
            console.log("Received recorder status change: ", status, error);
            APP.UI.updateRecordingState(status);
        });

        room.on(ConferenceEvents.USER_STATUS_CHANGED, function (id, status) {
            APP.UI.updateUserStatus(id, status);
        });

        room.on(ConferenceEvents.KICKED, () => {
            APP.UI.hideStats();
            APP.UI.notifyKicked();
            // FIXME close
        });

        room.on(ConferenceEvents.DTMF_SUPPORT_CHANGED, (isDTMFSupported) => {
            APP.UI.updateDTMFSupport(isDTMFSupported);
        });

        APP.UI.addListener(UIEvents.ROOM_LOCK_CLICKED, () => {
            if (room.isModerator()) {
                let promise = roomLocker.isLocked
                    ? roomLocker.askToUnlock()
                    : roomLocker.askToLock();
                promise.then(() => {
                    APP.UI.markRoomLocked(roomLocker.isLocked);
                });
            } else {
                roomLocker.notifyModeratorRequired();
            }
        });

        APP.UI.addListener(UIEvents.AUDIO_MUTED, muteLocalAudio);
        APP.UI.addListener(UIEvents.VIDEO_MUTED, muteLocalVideo);

        if (!interfaceConfig.filmStripOnly) {
            APP.UI.addListener(UIEvents.MESSAGE_CREATED, (message) => {
                APP.API.notifySendingChatMessage(message);
                room.sendTextMessage(message);
            });
        }

        room.on(ConferenceEvents.CONNECTION_STATS, function (stats) {
            ConnectionQuality.updateLocalStats(stats);
        });
        ConnectionQuality.addListener(
            CQEvents.LOCALSTATS_UPDATED,
            (percent, stats) => {
                APP.UI.updateLocalStats(percent, stats);

                // send local stats to other users
                room.sendCommandOnce(this.commands.defaults.CONNECTION_QUALITY,
                {
                    children: ConnectionQuality.convertToMUCStats(stats),
                    attributes: {
                        xmlns: 'http://jitsi.org/jitmeet/stats'
                    }
                });
            }
        );

        // listen to remote stats
        room.addCommandListener(this.commands.defaults.CONNECTION_QUALITY,
            (values, from) => {
                ConnectionQuality.updateRemoteStats(from, values);
        });

        ConnectionQuality.addListener(CQEvents.REMOTESTATS_UPDATED,
            (id, percent, stats) => {
                APP.UI.updateRemoteStats(id, percent, stats);
            });

        room.addCommandListener(this.commands.defaults.ETHERPAD, ({value}) => {
            APP.UI.initEtherpad(value);
        });

        APP.UI.addListener(UIEvents.EMAIL_CHANGED, (email = '') => {
            email = email.trim();

            if (email === APP.settings.getEmail()) {
                return;
            }

            APP.settings.setEmail(email);
            APP.UI.setUserAvatar(room.myUserId(), email);
            sendEmail(this.commands.defaults.EMAIL, email);
        });
        room.addCommandListener(this.commands.defaults.EMAIL, (data) => {
            APP.UI.setUserAvatar(data.attributes.id, data.value);
        });

        APP.UI.addListener(UIEvents.NICKNAME_CHANGED, (nickname = '') => {
            nickname = nickname.trim();

            if (nickname === APP.settings.getDisplayName()) {
                return;
            }

            APP.settings.setDisplayName(nickname);
            room.setDisplayName(nickname);
            APP.UI.changeDisplayName(APP.conference.localId, nickname);
        });

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

        APP.UI.addListener(UIEvents.USER_INVITED, (roomUrl) => {
            APP.UI.inviteParticipants(
                roomUrl,
                APP.conference.roomName,
                roomLocker.password,
                APP.settings.getDisplayName()
            );
        });

        room.on(
            ConferenceEvents.AVAILABLE_DEVICES_CHANGED, function (id, devices) {
                APP.UI.updateDevicesAvailability(id, devices);
            }
        );

        // call hangup
        APP.UI.addListener(UIEvents.HANGUP, () => {
            hangup(true);
        });

        // logout
        APP.UI.addListener(UIEvents.LOGOUT, () => {
            AuthHandler.logout(room).then(function (url) {
                if (url) {
                    window.location.href = url;
                } else {
                    hangup(true);
                }
            });
        });

        APP.UI.addListener(UIEvents.SIP_DIAL, (sipNumber) => {
            room.dial(sipNumber);
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

        APP.UI.addListener(UIEvents.SELECTED_ENDPOINT, (id) => {
            room.selectParticipant(id);
        });

        APP.UI.addListener(UIEvents.PINNED_ENDPOINT, (smallVideo, isPinned) => {
            var smallVideoId = smallVideo.getId();

            if (smallVideo.getVideoType() === VIDEO_CONTAINER_TYPE
                && !APP.conference.isLocalId(smallVideoId))
                if (isPinned)
                    room.pinParticipant(smallVideoId);
                // When the library starts supporting multiple pins we would
                // pass the isPinned parameter together with the identifier,
                // but currently we send null to indicate that we unpin the
                // last pinned.
                else
                    room.pinParticipant(null);
        });

        APP.UI.addListener(
            UIEvents.VIDEO_DEVICE_CHANGED,
            (cameraDeviceId) => {
                APP.settings.setCameraDeviceId(cameraDeviceId);
                createLocalTracks(['video']).then(([stream]) => {
                    this.useVideoStream(stream);
                    console.log('switched local video device');
                });
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_DEVICE_CHANGED,
            (micDeviceId) => {
                APP.settings.setMicDeviceId(micDeviceId);
                createLocalTracks(['audio']).then(([stream]) => {
                    this.useAudioStream(stream);
                    console.log('switched local audio device');
                });
            }
        );

        APP.UI.addListener(
            UIEvents.AUDIO_OUTPUT_DEVICE_CHANGED,
            (audioOutputDeviceId) => {
                APP.settings.setAudioOutputDeviceId(audioOutputDeviceId)
                    .then(() => console.log('changed audio output device'))
                    .catch((err) => {
                        console.warn('Failed to change audio output device. ' +
                            'Default or previously set audio output device ' +
                            'will be used instead.', err);
                    });
            }
        );

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
     * Adss any room listener.
     * @param eventName one of the ConferenceEvents
     * @param callBack the function to be called when the event occurs
     */
     addConferenceListener(eventName, callBack) {
        room.on(eventName, callBack);
    }
};
