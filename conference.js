/* global $, APP, JitsiMeetJS, config, interfaceConfig */
import {openConnection} from './connection';
//FIXME:
import createRoomLocker from './modules/UI/authentication/RoomLocker';
//FIXME:
import AuthHandler from './modules/UI/authentication/AuthHandler';

import CQEvents from './service/connectionquality/CQEvents';
import UIEvents from './service/UI/UIEvents';
import DSEvents from './service/desktopsharing/DesktopSharingEventTypes';

const ConnectionEvents = JitsiMeetJS.events.connection;
const ConnectionErrors = JitsiMeetJS.errors.connection;

const ConferenceEvents = JitsiMeetJS.events.conference;
const ConferenceErrors = JitsiMeetJS.errors.conference;

let room, connection, localTracks, localAudio, localVideo, roomLocker;

/**
 * Known custom conference commands.
 */
const Commands = {
    CONNECTION_QUALITY: "stats",
    EMAIL: "email",
    VIDEO_TYPE: "videoType",
    ETHERPAD: "etherpad",
    PREZI: "prezi",
    STOP_PREZI: "stop-prezi"
};

/**
 * Open Connection. When authentication failed it shows auth dialog.
 * @returns Promise<JitsiConnection>
 */
function connect() {
    return openConnection({retry: true}).catch(function (err) {
        if (err === ConnectionErrors.PASSWORD_REQUIRED) {
            APP.UI.notifyTokenAuthFailed();
        } else {
            APP.UI.notifyConnectionFailed(err);
        }
        throw err;
    });
}

/**
 * Add local track to the conference and shares
 * video type with other users if its video track.
 * @param {JitsiLocalTrack} track local track
 */
function addTrack (track) {
    room.addTrack(track);

    if (track.isAudioTrack()) {
        return;
    }

    room.removeCommand(Commands.VIDEO_TYPE);
    room.sendCommand(Commands.VIDEO_TYPE, {
        value: track.videoType,
        attributes: {
            xmlns: 'http://jitsi.org/jitmeet/video'
        }
    });
}

/**
 * Share email with other users.
 * @param {string} email new email
 */
function sendEmail (email) {
    room.sendCommand(Commands.EMAIL, {
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
            AuthHandler.requireAuth(APP.conference.roomName);
            break;

        case ConferenceErrors.RESERVATION_ERROR:
            {
                let [code, msg] = params;
                APP.UI.notifyReservationError(code, msg);
            }
            break;

        case ConferenceErrors.GRACEFUL_SHUTDOWN:
            APP.UI.notifyGracefulShudown();
            break;

        case ConferenceErrors.JINGLE_FATAL_ERROR:
            APP.UI.notifyInternalError();
            break;

        case ConferenceErrors.CONFERENCE_DESTROYED:
            {
                let [reason] = params;
                APP.UI.notifyConferenceDestroyed(reason);
            }
            break;

        case ConferenceErrors.FOCUS_DISCONNECTED:
            {
                let [focus, retrySec] = params;
                APP.UI.notifyFocusDisconnected(focus, retrySec);
            }
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
    /**
     * Open new connection and join to the conference.
     * @param {object} options
     * @param {string} roomName name of the conference
     * @returns {Promise}
     */
    init(options) {
        this.roomName = options.roomName;
        JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.TRACE);

        return JitsiMeetJS.init(config).then(() => {
            return Promise.all([
                this.createLocalTracks('audio', 'video').catch(
                    () => {return [];}),
                connect()
            ]);
        }).then(([tracks, con]) => {
            console.log('initialized with %s local tracks', tracks.length);
            localTracks = tracks;
            connection = con;
            this._createRoom();
            // XXX The API will take care of disconnecting from the XMPP server
            // (and, thus, leaving the room) on unload.
            return new Promise((resolve, reject) => {
                (new ConferenceConnector(resolve, reject)).connect();
            });
        });
    },
    /**
     * Create local tracks of specified types.
     * If we cannot obtain required tracks it will return empty array.
     * @param {string[]} devices required track types ('audio', 'video' etc.)
     * @returns {Promise<JitsiLocalTrack[]>}
     */
    createLocalTracks (...devices) {
        return JitsiMeetJS.createLocalTracks({
            // copy array to avoid mutations inside library
            devices: devices.slice(0),
            resolution: config.resolution,
            // adds any ff fake device settings if any
            firefox_fake_device: config.firefox_fake_device
        }).catch(function (err) {
            console.error('failed to create local tracks', ...devices, err);
            APP.statistics.onGetUserMediaFailed(err);
            return Promise.reject(err);
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
        //FIXME: Maybe we should create method for that in the UI instead of
        //accessing directly eventEmitter????
        APP.UI.eventEmitter.emit(UIEvents.AUDIO_MUTED, mute);
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
        //FIXME: Maybe we should create method for that in the UI instead of
        //accessing directly eventEmitter????
        APP.UI.eventEmitter.emit(UIEvents.VIDEO_MUTED, mute);
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
     * Check if SIP is supported.
     * @returns {boolean}
     */
    sipGatewayEnabled () {
        return room.isSIPCallingSupported();
    },
    get membersCount () {
        return room.getParticipants().length + 1;
    },
    get startAudioMuted () {
        return room && room.getStartMutedPolicy().audio;
    },
    get startVideoMuted () {
        return room && room.getStartMutedPolicy().video;
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
     * Will be filled with values only when config.debug is enabled.
     * Its used by torture to check audio levels.
     */
    audioLevelsMap: {},
    getPeerSSRCAudioLevel (id) {
        return this.audioLevelsMap[id];
    },
    /**
     * Will check for number of remote particiapnts that have at least one
     * remote track.
     * @return {boolean} whether we have enough participants with remote streams
     */
    checkEnoughParticipants (number) {
        var participants = this._room.getParticipants();

        var foundParticipants = 0;
        for (var i = 0; i < participants.length; i += 1) {
            if (participants[i].getTracks().length > 0) {
                foundParticipants++;
            }
        }
        return foundParticipants >= number;
    },
    // end used by torture

    getLogs () {
        return room.getLogs();
    },
    _createRoom () {
        room = connection.initJitsiConference(APP.conference.roomName,
            this._getConferenceOptions());
        this.localId = room.myUserId();
        localTracks.forEach((track) => {
            if(track.isAudioTrack()) {
                localAudio = track;
            }
            else if (track.isVideoTrack()) {
                localVideo = track;
            }
            addTrack(track);
            APP.UI.addLocalStream(track);
        });
        roomLocker = createRoomLocker(room);
        this._room = room; // FIXME do not use this
        this.localId = room.myUserId();

        let email = APP.settings.getEmail();
        email && sendEmail(email);

        let nick = APP.settings.getDisplayName();
        (config.useNicks && !nick) && (() => {
            nick = APP.UI.askForNickname();
            APP.settings.setDisplayName(nick);
        })();
        nick && room.setDisplayName(nick);

        this._setupListeners();
    },
    _getConferenceOptions() {
        let options = config;
        if(config.enableRecording) {
            options.recordingType = (config.hosts &&
                (typeof config.hosts.jirecon != "undefined"))?
                "jirecon" : "colibri";
        }
        return options;
    },
    /**
     * Setup interaction between conference and UI.
     */
    _setupListeners () {
        // add local streams when joined to the conference
        room.on(ConferenceEvents.CONFERENCE_JOINED, () => {
            APP.UI.updateAuthInfo(room.isAuthEnabled(), room.getAuthLogin());
            APP.UI.mucJoined();
        });


        room.on(ConferenceEvents.USER_JOINED, (id, user) => {
            console.log('USER %s connnected', id, user);
            APP.API.notifyUserJoined(id);
            // FIXME email???
            APP.UI.addUser(id, user.getDisplayName());

            // chek the roles for the new user and reflect them
            APP.UI.updateUserRole(user);
        });
        room.on(ConferenceEvents.USER_LEFT, (id, user) => {
            console.log('USER %s LEFT', id, user);
            APP.API.notifyUserLeft(id);
            APP.UI.removeUser(id, user.getDisplayName());
            APP.UI.stopPrezi(id);
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
            APP.UI.addRemoteStream(track);
        });

        room.on(ConferenceEvents.TRACK_REMOVED, (track) => {
            // FIXME handle
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
            if(this.isLocalId(id) && localAudio.isMuted()) {
                lvl = 0;
            }

            if(config.debug)
                this.audioLevelsMap[id] = lvl;

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

        room.on(ConferenceEvents.RECORDING_STATE_CHANGED, (status, error) => {
            if(status == "error") {
                console.error(error);
                return;
            }
            APP.UI.updateRecordingState(status);
        });

        room.on(ConferenceEvents.USER_STATUS_CHANGED, function (id, status) {
            APP.UI.updateUserStatus(id, status);
        });

        room.on(ConferenceEvents.KICKED, () => {
            APP.UI.notifyKicked();
            // FIXME close
        });

        room.on(ConferenceEvents.DTMF_SUPPORT_CHANGED, (isDTMFSupported) => {
            APP.UI.updateDTMFSupport(isDTMFSupported);
        });

        room.on(ConferenceEvents.FIREFOX_EXTENSION_NEEDED, function (url) {
            APP.UI.notifyFirefoxExtensionRequired(url);
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

        APP.UI.addListener(UIEvents.AUDIO_MUTED, (muted) => {
            (muted)? localAudio.mute() : localAudio.unmute();
        });
        APP.UI.addListener(UIEvents.VIDEO_MUTED, (muted) => {
            (muted)? localVideo.mute() : localVideo.unmute();
        });

        if (!interfaceConfig.filmStripOnly) {
            APP.UI.addListener(UIEvents.MESSAGE_CREATED, (message) => {
                APP.API.notifySendingChatMessage(message);
                room.sendTextMessage(message);
            });
        }

        APP.connectionquality.addListener(
            CQEvents.LOCALSTATS_UPDATED,
            (percent, stats) => {
                APP.UI.updateLocalStats(percent, stats);

                // send local stats to other users
                room.sendCommandOnce(Commands.CONNECTION_QUALITY, {
                    children: APP.connectionquality.convertToMUCStats(stats),
                    attributes: {
                        xmlns: 'http://jitsi.org/jitmeet/stats'
                    }
                });
            }
        );

        APP.connectionquality.addListener(CQEvents.STOP, () => {
            APP.UI.hideStats();
            room.removeCommand(Commands.CONNECTION_QUALITY);
        });

        // listen to remote stats
        room.addCommandListener(Commands.CONNECTION_QUALITY,(values, from) => {
            APP.connectionquality.updateRemoteStats(from, values);
        });

        APP.connectionquality.addListener(CQEvents.REMOTESTATS_UPDATED,
            (id, percent, stats) => {
                APP.UI.updateRemoteStats(id, percent, stats);
            });

        room.addCommandListener(Commands.ETHERPAD, ({value}) => {
            APP.UI.initEtherpad(value);
        });

        room.addCommandListener(Commands.PREZI, ({value, attributes}) => {
            APP.UI.showPrezi(attributes.id, value, attributes.slide);
        });

        room.addCommandListener(Commands.STOP_PREZI, ({attributes}) => {
            APP.UI.stopPrezi(attributes.id);
        });

        APP.UI.addListener(UIEvents.SHARE_PREZI, (url, slide) => {
            console.log('Sharing Prezi %s slide %s', url, slide);
            room.removeCommand(Commands.PREZI);
            room.sendCommand(Commands.PREZI, {
                value: url,
                attributes: {
                    id: room.myUserId(),
                    slide
                }
            });
        });

        APP.UI.addListener(UIEvents.STOP_SHARING_PREZI, () => {
            room.removeCommand(Commands.PREZI);
            room.sendCommandOnce(Commands.STOP_PREZI, {
                attributes: {
                    id: room.myUserId()
                }
            });
        });

        room.addCommandListener(Commands.VIDEO_TYPE, ({value}, from) => {
            APP.UI.onPeerVideoTypeChanged(from, value);
        });

        APP.UI.addListener(UIEvents.EMAIL_CHANGED, (email) => {
            APP.settings.setEmail(email);
            APP.UI.setUserAvatar(room.myUserId(), email);
            sendEmail(email);
        });
        room.addCommandListener(Commands.EMAIL, (data) => {
            APP.UI.setUserAvatar(data.attributes.id, data.value);
        });

        APP.UI.addListener(UIEvents.NICKNAME_CHANGED, (nickname) => {
            APP.settings.setDisplayName(nickname);
            room.setDisplayName(nickname);
            APP.UI.changeDisplayName(APP.conference.localId, nickname);
        });

        APP.UI.addListener(UIEvents.START_MUTED_CHANGED,
            (startAudioMuted, startVideoMuted) => {
                room.setStartMutedPolicy({audio: startAudioMuted,
                    video: startVideoMuted});
            }
        );
        room.on(
            ConferenceEvents.START_MUTED_POLICY_CHANGED,
            (policy) => {
                APP.UI.onStartMutedChanged();
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
            APP.UI.requestFeedback().then(() => {
                connection.disconnect();
                config.enableWelcomePage && setTimeout(() => {
                        window.localStorage.welcomePageDisabled = false;
                        window.location.pathname = "/";
                    }, 3000);
            }, (err) => {console.error(err);});
        });

        // logout
        APP.UI.addListener(UIEvents.LOGOUT, () => {
            // FIXME handle logout
            // APP.xmpp.logout(function (url) {
            //     if (url) {
            //         window.location.href = url;
            //     } else {
            //         hangup();
            //     }
            // });
        });

        APP.UI.addListener(UIEvents.SIP_DIAL, (sipNumber) => {
            room.dial(sipNumber);
        });


        // Starts or stops the recording for the conference.
        APP.UI.addListener(UIEvents.RECORDING_TOGGLE, (predefinedToken) => {
            if (predefinedToken) {
                room.toggleRecording({token: predefinedToken});
                return;
            }
            APP.UI.requestRecordingToken().then((token) => {
                room.toggleRecording({token: token});
            });

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
        APP.UI.addListener(UIEvents.PINNED_ENDPOINT, (id) => {
            room.pinParticipant(id);
        });

        APP.UI.addListener(UIEvents.TOGGLE_SCREENSHARING, () => {
            APP.desktopsharing.toggleScreenSharing();
        });

        APP.desktopsharing.addListener(DSEvents.SWITCHING_DONE,
        (isSharingScreen) => {
            APP.UI.updateDesktopSharingButtons(isSharingScreen);
        });

        APP.desktopsharing.addListener(DSEvents.FIREFOX_EXTENSION_NEEDED,
            (url) => {
                APP.UI.showExtensionRequiredDialog(url);
            });

        APP.desktopsharing.addListener(DSEvents.NEW_STREAM_CREATED,
            (track, callback) => {
                const localCallback = (newTrack) => {
                    if(!newTrack || !newTrack.isLocal() ||
                        newTrack !== localVideo)
                        return;
                    if(localVideo.isMuted() &&
                       localVideo.videoType !== track.videoType) {
                        localVideo.mute();
                    }
                    callback();
                    if(room)
                        room.off(ConferenceEvents.TRACK_ADDED, localCallback);
                };
                if(room) {
                    room.on(ConferenceEvents.TRACK_ADDED, localCallback);
                }
                localVideo.stop();
                localVideo = track;
                addTrack(track);
                if(!room)
                    localCallback();
                APP.UI.addLocalStream(track);
            }
        );
    }
};
