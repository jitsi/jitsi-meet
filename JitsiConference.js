/* global Strophe, $, Promise */
/* jshint -W101 */
var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTC = require("./modules/RTC/RTC");
var XMPPEvents = require("./service/xmpp/XMPPEvents");
var AuthenticationEvents = require("./service/authentication/AuthenticationEvents");
var RTCEvents = require("./service/RTC/RTCEvents");
var EventEmitter = require("events");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiConferenceErrors = require("./JitsiConferenceErrors");
var JitsiParticipant = require("./JitsiParticipant");
var Statistics = require("./modules/statistics/statistics");
var JitsiDTMFManager = require('./modules/DTMF/JitsiDTMFManager');
var JitsiTrackEvents = require("./JitsiTrackEvents");

/**
 * Creates a JitsiConference object with the given name and properties.
 * Note: this constructor is not a part of the public API (objects should be
 * created using JitsiConnection.createConference).
 * @param options.config properties / settings related to the conference that will be created.
 * @param options.name the name of the conference
 * @param options.connection the JitsiConnection object for this JitsiConference.
 * @constructor
 */
function JitsiConference(options) {
    if(!options.name || options.name.toLowerCase() !== options.name) {
        logger.error("Invalid conference name (no conference name passed or it"
            + "contains invalid characters like capital letters)!");
         return;
    }
    this.options = options;
    this.connection = this.options.connection;
    this.xmpp = this.connection.xmpp;
    this.eventEmitter = new EventEmitter();
    this.room = this.xmpp.createRoom(this.options.name, this.options.config);
    this.room.updateDeviceAvailability(RTC.getDeviceAvailability());
    this.rtc = new RTC(this.room, options);
    if(!RTC.options.disableAudioLevels)
        this.statistics = new Statistics();
    setupListeners(this);
    this.participants = {};
    this.lastDominantSpeaker = null;
    this.dtmfManager = null;
    this.somebodySupportsDTMF = false;
    this.authEnabled = false;
    this.authIdentity;
    this.startAudioMuted = false;
    this.startVideoMuted = false;
    this.startMutedPolicy = {audio: false, video: false};
}

/**
 * Joins the conference.
 * @param password {string} the password
 */
JitsiConference.prototype.join = function (password) {
    if(this.room)
        this.room.join(password);
};

/**
 * Check if joined to the conference.
 */
JitsiConference.prototype.isJoined = function () {
    return this.room && this.room.joined;
};

/**
 * Leaves the conference.
 */
JitsiConference.prototype.leave = function () {
    if(this.xmpp && this.room)
        this.xmpp.leaveRoom(this.room.roomjid);
    this.room = null;
};

/**
 * Returns name of this conference.
 */
JitsiConference.prototype.getName = function () {
    return this.options.name;
};

/**
 * Check if authentication is enabled for this conference.
 */
JitsiConference.prototype.isAuthEnabled = function () {
    return this.authEnabled;
};

/**
 * Check if user is logged in.
 */
JitsiConference.prototype.isLoggedIn = function () {
    return !!this.authIdentity;
};

/**
 * Get authorized login.
 */
JitsiConference.prototype.getAuthLogin = function () {
    return this.authIdentity;
};

/**
 * Check if external authentication is enabled for this conference.
 */
JitsiConference.prototype.isExternalAuthEnabled = function () {
    return this.room && this.room.moderator.isExternalAuthEnabled();
};

/**
 * Get url for external authentication.
 * @param {boolean} [urlForPopup] if true then return url for login popup,
 *                                else url of login page.
 * @returns {Promise}
 */
JitsiConference.prototype.getExternalAuthUrl = function (urlForPopup) {
    return new Promise(function (resolve, reject) {
        if (!this.isExternalAuthEnabled()) {
            reject();
            return;
        }
        if (urlForPopup) {
            this.room.moderator.getPopupLoginUrl(resolve, reject);
        } else {
            this.room.moderator.getLoginUrl(resolve, reject);
        }
    }.bind(this));
};

/**
 * Returns the local tracks.
 */
JitsiConference.prototype.getLocalTracks = function () {
    if (this.rtc) {
        return this.rtc.localStreams;
    } else {
        return [];
    }
};


/**
 * Attaches a handler for events(For example - "participant joined".) in the conference. All possible event are defined
 * in JitsiConferenceEvents.
 * @param eventId the event ID.
 * @param handler handler for the event.
 *
 * Note: consider adding eventing functionality by extending an EventEmitter impl, instead of rolling ourselves
 */
JitsiConference.prototype.on = function (eventId, handler) {
    if(this.eventEmitter)
        this.eventEmitter.on(eventId, handler);
};

/**
 * Removes event listener
 * @param eventId the event ID.
 * @param [handler] optional, the specific handler to unbind
 *
 * Note: consider adding eventing functionality by extending an EventEmitter impl, instead of rolling ourselves
 */
JitsiConference.prototype.off = function (eventId, handler) {
    if(this.eventEmitter)
        this.eventEmitter.removeListener(eventId, handler);
};

// Common aliases for event emitter
JitsiConference.prototype.addEventListener = JitsiConference.prototype.on;
JitsiConference.prototype.removeEventListener = JitsiConference.prototype.off;

/**
 * Receives notifications from another participants for commands / custom events
 * (send by sendPresenceCommand method).
 * @param command {String} the name of the command
 * @param handler {Function} handler for the command
 */
 JitsiConference.prototype.addCommandListener = function (command, handler) {
    if(this.room)
        this.room.addPresenceListener(command, handler);
 };

/**
  * Removes command  listener
  * @param command {String}  the name of the command
  */
 JitsiConference.prototype.removeCommandListener = function (command) {
    if(this.room)
        this.room.removePresenceListener(command);
 };

/**
 * Sends text message to the other participants in the conference
 * @param message the text message.
 */
JitsiConference.prototype.sendTextMessage = function (message) {
    if(this.room)
        this.room.sendMessage(message);
};

/**
 * Send presence command.
 * @param name the name of the command.
 * @param values Object with keys and values that will be send.
 **/
JitsiConference.prototype.sendCommand = function (name, values) {
    if(this.room) {
        this.room.addToPresence(name, values);
        this.room.sendPresence();
    }
};

/**
 * Send presence command one time.
 * @param name the name of the command.
 * @param values Object with keys and values that will be send.
 **/
JitsiConference.prototype.sendCommandOnce = function (name, values) {
    this.sendCommand(name, values);
    this.removeCommand(name);
};

/**
 * Send presence command.
 * @param name the name of the command.
 * @param values Object with keys and values that will be send.
 * @param persistent if false the command will be sent only one time
 **/
JitsiConference.prototype.removeCommand = function (name) {
    if(this.room)
        this.room.removeFromPresence(name);
};

/**
 * Sets the display name for this conference.
 * @param name the display name to set
 */
JitsiConference.prototype.setDisplayName = function(name) {
    if(this.room){
        // remove previously set nickname
        this.room.removeFromPresence("nick");

        this.room.addToPresence("nick", {attributes: {xmlns: 'http://jabber.org/protocol/nick'}, value: name});
        this.room.sendPresence();
    }
};

/**
 * Adds JitsiLocalTrack object to the conference.
 * @param track the JitsiLocalTrack object.
 */
JitsiConference.prototype.addTrack = function (track) {
    this.room.addStream(track.getOriginalStream(), function () {
        this.rtc.addLocalStream(track);
        if (track.startMuted) {
            track.mute();
        }
        track.muteHandler = this._fireMuteChangeEvent.bind(this, track);
        track.stopHandler = this.removeTrack.bind(this, track);
        track.audioLevelHandler = this._fireAudioLevelChangeEvent.bind(this);
        track.addEventListener(JitsiTrackEvents.TRACK_MUTE_CHANGED, track.muteHandler);
        track.addEventListener(JitsiTrackEvents.TRACK_STOPPED, track.stopHandler);
        track.addEventListener(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, track.audioLevelHandler);
        this.eventEmitter.emit(JitsiConferenceEvents.TRACK_ADDED, track);
    }.bind(this));
};

/**
 * Fires TRACK_AUDIO_LEVEL_CHANGED change conference event.
 * @param audioLevel the audio level
 */
JitsiConference.prototype._fireAudioLevelChangeEvent = function (audioLevel) {
    this.eventEmitter.emit(
        JitsiConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED,
        this.myUserId(), audioLevel);
};

/**
 * Fires TRACK_MUTE_CHANGED change conference event.
 * @param track the JitsiTrack object related to the event.
 */
JitsiConference.prototype._fireMuteChangeEvent = function (track) {
    this.eventEmitter.emit(JitsiConferenceEvents.TRACK_MUTE_CHANGED, track);
};

/**
 * Removes JitsiLocalTrack object to the conference.
 * @param track the JitsiLocalTrack object.
 */
JitsiConference.prototype.removeTrack = function (track) {
    if(!this.room){
        if(this.rtc)
            this.rtc.removeLocalStream(track);
        return;
    }
    this.room.removeStream(track.getOriginalStream(), function(){
        this.rtc.removeLocalStream(track);
        track.removeEventListener(JitsiTrackEvents.TRACK_MUTE_CHANGED, track.muteHandler);
        track.removeEventListener(JitsiTrackEvents.TRACK_STOPPED, track.stopHandler);
        track.removeEventListener(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, track.audioLevelHandler);
        this.eventEmitter.emit(JitsiConferenceEvents.TRACK_REMOVED, track);
    }.bind(this));
};

/**
 * Get role of the local user.
 * @returns {string} user role: 'moderator' or 'none'
 */
JitsiConference.prototype.getRole = function () {
    return this.room.role;
};

/**
 * Check if local user is moderator.
 * @returns {boolean} true if local user is moderator, false otherwise.
 */
JitsiConference.prototype.isModerator = function () {
    return this.room.isModerator();
};

/**
 * Set password for the room.
 * @param {string} password new password for the room.
 * @returns {Promise}
 */
JitsiConference.prototype.lock = function (password) {
  if (!this.isModerator()) {
    return Promise.reject();
  }

  var conference = this;
  return new Promise(function (resolve, reject) {
    conference.room.lockRoom(password || "", function () {
      resolve();
    }, function (err) {
      reject(err);
    }, function () {
      reject(JitsiConferenceErrors.PASSWORD_NOT_SUPPORTED);
    });
  });
};

/**
 * Remove password from the room.
 * @returns {Promise}
 */
JitsiConference.prototype.unlock = function () {
  return this.lock();
};

/**
 * Elects the participant with the given id to be the selected participant or the speaker.
 * @param id the identifier of the participant
 */
JitsiConference.prototype.selectParticipant = function(participantId) {
    if (this.rtc) {
        this.rtc.selectedEndpoint(participantId);
    }
};

/**
 *
 * @param id the identifier of the participant
 */
JitsiConference.prototype.pinParticipant = function(participantId) {
    if (this.rtc) {
        this.rtc.pinEndpoint(participantId);
    }
};

/**
 * Returns the list of participants for this conference.
 * @return Array<JitsiParticipant> a list of participant identifiers containing all conference participants.
 */
JitsiConference.prototype.getParticipants = function() {
    return Object.keys(this.participants).map(function (key) {
        return this.participants[key];
    }, this);
};

/**
 * @returns {JitsiParticipant} the participant in this conference with the specified id (or
 * undefined if there isn't one).
 * @param id the id of the participant.
 */
JitsiConference.prototype.getParticipantById = function(id) {
    return this.participants[id];
};

/**
 * Kick participant from this conference.
 * @param {string} id id of the participant to kick
 */
JitsiConference.prototype.kickParticipant = function (id) {
    var participant = this.getParticipantById(id);
    if (!participant) {
        return;
    }
    this.room.kick(participant.getJid());
};

/**
 * Kick participant from this conference.
 * @param {string} id id of the participant to kick
 */
JitsiConference.prototype.muteParticipant = function (id) {
    var participant = this.getParticipantById(id);
    if (!participant) {
        return;
    }
    this.room.muteParticipant(participant.getJid(), true);
};

JitsiConference.prototype.onMemberJoined = function (jid, nick, role) {
    var id = Strophe.getResourceFromJid(jid);
    if (id === 'focus' || this.myUserId() === id) {
       return;
    }
    var participant = new JitsiParticipant(jid, this, nick);
    participant._role = role;
    this.participants[id] = participant;
    this.eventEmitter.emit(JitsiConferenceEvents.USER_JOINED, id, participant);
    this.xmpp.connection.disco.info(
        jid, "node", function(iq) {
            participant._supportsDTMF = $(iq).find(
                '>query>feature[var="urn:xmpp:jingle:dtmf:0"]').length > 0;
            this.updateDTMFSupport();
        }.bind(this)
    );
};

JitsiConference.prototype.onMemberLeft = function (jid) {
    var id = Strophe.getResourceFromJid(jid);
    if (id === 'focus' || this.myUserId() === id) {
       return;
    }
    var participant = this.participants[id];
    delete this.participants[id];
    this.eventEmitter.emit(JitsiConferenceEvents.USER_LEFT, id, participant);
};

JitsiConference.prototype.onUserRoleChanged = function (jid, role) {
    var id = Strophe.getResourceFromJid(jid);
    var participant = this.getParticipantById(id);
    if (!participant) {
        return;
    }
    participant._role = role;
    this.eventEmitter.emit(JitsiConferenceEvents.USER_ROLE_CHANGED, id, role);
};

JitsiConference.prototype.onDisplayNameChanged = function (jid, displayName) {
    var id = Strophe.getResourceFromJid(jid);
    var participant = this.getParticipantById(id);
    if (!participant) {
        return;
    }
    participant._displayName = displayName;
    this.eventEmitter.emit(JitsiConferenceEvents.DISPLAY_NAME_CHANGED, id, displayName);
};

JitsiConference.prototype.onTrackAdded = function (track) {
    var id = track.getParticipantId();
    var participant = this.getParticipantById(id);
    if (!participant) {
        return;
    }
    // add track to JitsiParticipant
    participant._tracks.push(track);

    var emitter = this.eventEmitter;
    track.addEventListener(
        JitsiTrackEvents.TRACK_STOPPED,
        function () {
            // remove track from JitsiParticipant
            var pos = participant._tracks.indexOf(track);
            if (pos > -1) {
                participant._tracks.splice(pos, 1);
            }
            emitter.emit(JitsiConferenceEvents.TRACK_REMOVED, track);
        }
    );
    track.addEventListener(
        JitsiTrackEvents.TRACK_MUTE_CHANGED,
        function () {
            emitter.emit(JitsiConferenceEvents.TRACK_MUTE_CHANGED, track);
        }
    );
    track.addEventListener(
        JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
        function (audioLevel) {
            emitter.emit(JitsiConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED, id, audioLevel);
        }
    );

    this.eventEmitter.emit(JitsiConferenceEvents.TRACK_ADDED, track);
};

JitsiConference.prototype.updateDTMFSupport = function () {
    var somebodySupportsDTMF = false;
    var participants = this.getParticipants();

    // check if at least 1 participant supports DTMF
    for (var i = 0; i < participants.length; i += 1) {
        if (participants[i].supportsDTMF()) {
            somebodySupportsDTMF = true;
            break;
        }
    }
    if (somebodySupportsDTMF !== this.somebodySupportsDTMF) {
        this.somebodySupportsDTMF = somebodySupportsDTMF;
        this.eventEmitter.emit(JitsiConferenceEvents.DTMF_SUPPORT_CHANGED, somebodySupportsDTMF);
    }
};

/**
 * Allows to check if there is at least one user in the conference
 * that supports DTMF.
 * @returns {boolean} true if somebody supports DTMF, false otherwise
 */
JitsiConference.prototype.isDTMFSupported = function () {
    return this.somebodySupportsDTMF;
};

/**
 * Returns the local user's ID
 * @return {string} local user's ID
 */
JitsiConference.prototype.myUserId = function () {
    return (this.room && this.room.myroomjid)? Strophe.getResourceFromJid(this.room.myroomjid) : null;
};

JitsiConference.prototype.sendTones = function (tones, duration, pause) {
    if (!this.dtmfManager) {
        var connection = this.xmpp.connection.jingle.activecall.peerconnection;
        if (!connection) {
            logger.warn("cannot sendTones: no conneciton");
            return;
        }

        var tracks = this.getLocalTracks().filter(function (track) {
            return track.isAudioTrack();
        });
        if (!tracks.length) {
            logger.warn("cannot sendTones: no local audio stream");
            return;
        }
        this.dtmfManager = new JitsiDTMFManager(tracks[0], connection);
    }

    this.dtmfManager.sendTones(tones, duration, pause);
};

/**
 * Returns true if the recording is supproted and false if not.
 */
JitsiConference.prototype.isRecordingSupported = function () {
    if(this.room)
        return this.room.isRecordingSupported();
    return false;
};

/**
 * Returns null if the recording is not supported, "on" if the recording started
 * and "off" if the recording is not started.
 */
JitsiConference.prototype.getRecordingState = function () {
    if(this.room)
        return this.room.getRecordingState();
    return "off";
}

/**
 * Returns the url of the recorded video.
 */
JitsiConference.prototype.getRecordingURL = function () {
    if(this.room)
        return this.room.getRecordingURL();
    return null;
}

/**
 * Starts/stops the recording
 */
JitsiConference.prototype.toggleRecording = function (options) {
    if(this.room)
        return this.room.toggleRecording(options, function (status, error) {
            this.eventEmitter.emit(
                JitsiConferenceEvents.RECORDING_STATE_CHANGED, status, error);
        }.bind(this));
    this.eventEmitter.emit(
        JitsiConferenceEvents.RECORDING_STATE_CHANGED, "error",
        new Error("The conference is not created yet!"));
}

/**
 * Returns true if the SIP calls are supported and false otherwise
 */
JitsiConference.prototype.isSIPCallingSupported = function () {
    if(this.room)
        return this.room.isSIPCallingSupported();
    return false;
}

/**
 * Dials a number.
 * @param number the number
 */
JitsiConference.prototype.dial = function (number) {
    if(this.room)
        return this.room.dial(number);
    return new Promise(function(resolve, reject){
        reject(new Error("The conference is not created yet!"))});
}

/**
 * Hangup an existing call
 */
JitsiConference.prototype.hangup = function () {
    if(this.room)
        return this.room.hangup();
    return new Promise(function(resolve, reject){
        reject(new Error("The conference is not created yet!"))});
}

/**
 * Returns the phone number for joining the conference.
 */
JitsiConference.prototype.getPhoneNumber = function () {
    if(this.room)
        return this.room.getPhoneNumber();
    return null;
}

/**
 * Returns the pin for joining the conference with phone.
 */
JitsiConference.prototype.getPhonePin = function () {
    if(this.room)
        return this.room.getPhonePin();
    return null;
}

/**
 * Returns the connection state for the current room. Its ice connection state
 * for its session.
 */
JitsiConference.prototype.getConnectionState = function () {
    if(this.room)
        return this.room.getConnectionState();
    return null;
}

/**
 * Make all new participants mute their audio/video on join.
 * @param policy {Object} object with 2 boolean properties for video and audio:
 * @param {boolean} audio if audio should be muted.
 * @param {boolean} video if video should be muted.
 */
JitsiConference.prototype.setStartMutedPolicy = function (policy) {
    if (!this.isModerator()) {
        return;
    }
    this.startMutedPolicy = policy;
    this.room.removeFromPresence("startmuted");
    this.room.addToPresence("startmuted", {
        attributes: {
            audio: policy.audio,
            video: policy.video,
            xmlns: 'http://jitsi.org/jitmeet/start-muted'
        }
    });
    this.room.sendPresence();
};

/**
 * Returns current start muted policy
 * @returns {Object} with 2 proprties - audio and video.
 */
JitsiConference.prototype.getStartMutedPolicy = function () {
    return this.startMutedPolicy;
};

/**
 * Check if audio is muted on join.
 */
JitsiConference.prototype.isStartAudioMuted = function () {
    return this.startAudioMuted;
};

/**
 * Check if video is muted on join.
 */
JitsiConference.prototype.isStartVideoMuted = function () {
    return this.startVideoMuted;
};

/**
 * Setups the listeners needed for the conference.
 * @param conference the conference
 */
function setupListeners(conference) {
    conference.xmpp.addListener(XMPPEvents.CALL_INCOMING, function (event) {
        conference.rtc.onIncommingCall(event);
        if(conference.statistics)
            conference.statistics.startRemoteStats(event.peerconnection);
    });

    conference.room.addListener(XMPPEvents.REMOTE_STREAM_RECEIVED,
        function (data, sid, thessrc) {
            var track = conference.rtc.createRemoteStream(data, sid, thessrc);
            if (track) {
                conference.onTrackAdded(track);
            }
        }
    );

    conference.room.addListener(XMPPEvents.AUDIO_MUTED_BY_FOCUS,
        function (value) {
            conference.rtc.setAudioMute(value);
        }
    );

    conference.room.addListener(XMPPEvents.MUC_JOINED, function () {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_JOINED);
    });
    conference.room.addListener(XMPPEvents.ROOM_JOIN_ERROR, function (pres) {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_FAILED, JitsiConferenceErrors.CONNECTION_ERROR, pres);
    });
    conference.room.addListener(XMPPEvents.ROOM_CONNECT_ERROR, function (pres) {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_FAILED, JitsiConferenceErrors.CONNECTION_ERROR, pres);
    });
    conference.room.addListener(XMPPEvents.PASSWORD_REQUIRED, function (pres) {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_FAILED, JitsiConferenceErrors.PASSWORD_REQUIRED, pres);
    });
    conference.room.addListener(XMPPEvents.AUTHENTICATION_REQUIRED, function () {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_FAILED, JitsiConferenceErrors.AUTHENTICATION_REQUIRED);
    });
    conference.room.addListener(XMPPEvents.BRIDGE_DOWN, function () {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_FAILED, JitsiConferenceErrors.VIDEOBRIDGE_NOT_AVAILABLE);
    });
//    FIXME
//    conference.room.addListener(XMPPEvents.MUC_JOINED, function () {
//        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_LEFT);
//    });

    conference.room.addListener(XMPPEvents.KICKED, function () {
        conference.eventEmitter.emit(JitsiConferenceEvents.KICKED);
    });

    conference.room.addListener(XMPPEvents.MUC_MEMBER_JOINED, conference.onMemberJoined.bind(conference));
    conference.room.addListener(XMPPEvents.MUC_MEMBER_LEFT, conference.onMemberLeft.bind(conference));

    conference.room.addListener(XMPPEvents.DISPLAY_NAME_CHANGED, conference.onDisplayNameChanged.bind(conference));

    conference.room.addListener(XMPPEvents.LOCAL_ROLE_CHANGED, function (role) {
        conference.eventEmitter.emit(JitsiConferenceEvents.USER_ROLE_CHANGED, conference.myUserId(), role);
    });
    conference.room.addListener(XMPPEvents.MUC_ROLE_CHANGED, conference.onUserRoleChanged.bind(conference));

    conference.room.addListener(XMPPEvents.CONNECTION_INTERRUPTED, function () {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONNECTION_INTERRUPTED);
    });

    conference.room.addListener(XMPPEvents.RECORDING_STATE_CHANGED,
        function () {
            conference.eventEmitter.emit(
                JitsiConferenceEvents.RECORDING_STATE_CHANGED);
        });

    conference.room.addListener(XMPPEvents.PHONE_NUMBER_CHANGED, function () {
        conference.eventEmitter.emit(
            JitsiConferenceEvents.PHONE_NUMBER_CHANGED);
    });

    conference.room.addListener(XMPPEvents.CONNECTION_RESTORED, function () {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONNECTION_RESTORED);
    });
    conference.room.addListener(XMPPEvents.CONFERENCE_SETUP_FAILED, function () {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_FAILED, JitsiConferenceErrors.SETUP_FAILED);
    });

    conference.room.addListener(AuthenticationEvents.IDENTITY_UPDATED, function (authEnabled, authIdentity) {
        conference.authEnabled = authEnabled;
        conference.authIdentity = authIdentity;
    });

    conference.room.addListener(XMPPEvents.MESSAGE_RECEIVED, function (jid, displayName, txt, myJid, ts) {
        var id = Strophe.getResourceFromJid(jid);
        conference.eventEmitter.emit(JitsiConferenceEvents.MESSAGE_RECEIVED, id, txt, ts);
    });

    conference.rtc.addListener(RTCEvents.DOMINANTSPEAKER_CHANGED, function (id) {
        if(conference.lastDominantSpeaker !== id && conference.room) {
            conference.lastDominantSpeaker = id;
            conference.eventEmitter.emit(JitsiConferenceEvents.DOMINANT_SPEAKER_CHANGED, id);
        }
    });

    conference.rtc.addListener(RTCEvents.LASTN_CHANGED, function (oldValue, newValue) {
        conference.eventEmitter.emit(JitsiConferenceEvents.IN_LAST_N_CHANGED, oldValue, newValue);
    });

    conference.rtc.addListener(RTCEvents.LASTN_ENDPOINT_CHANGED,
        function (lastNEndpoints, endpointsEnteringLastN) {
            conference.eventEmitter.emit(JitsiConferenceEvents.LAST_N_ENDPOINTS_CHANGED,
                lastNEndpoints, endpointsEnteringLastN);
        });
    conference.xmpp.addListener(XMPPEvents.PASSWORD_REQUIRED, function () {
        conference.eventEmitter.emit(JitsiConferenceErrors.PASSWORD_REQUIRED);
    });

    conference.xmpp.addListener(XMPPEvents.START_MUTED_FROM_FOCUS,
        function (audioMuted, videoMuted) {
            conference.startAudioMuted = audioMuted;
            conference.startVideoMuted = videoMuted;

            // mute existing local tracks because this is initial mute from
            // Jicofo
            conference.getLocalTracks().forEach(function (track) {
                if (conference.startAudioMuted && track.isAudioTrack()) {
                    track.mute();
                }
                if (conference.startVideoMuted && track.isVideoTrack()) {
                    track.mute();
                }
            });

            conference.eventEmitter.emit(JitsiConferenceEvents.STARTED_MUTED);
        });

    conference.room.addPresenceListener("startmuted", function (data, from) {
        var isModerator = false;
        if (conference.myUserId() === from && conference.isModerator()) {
            isModerator = true;
        } else {
            var participant = conference.getParticipantById(from);
            if (participant && participant.isModerator()) {
                isModerator = true;
            }
        }

        if (!isModerator) {
            return;
        }

        var startAudioMuted = data.attributes.audio === 'true';
        var startVideoMuted = data.attributes.video === 'true';

        var updated = false;

        if (startAudioMuted !== conference.startMutedPolicy.audio) {
            conference.startMutedPolicy.audio = startAudioMuted;
            updated = true;
        }

        if (startVideoMuted !== conference.startMutedPolicy.video) {
            conference.startMutedPolicy.video = startVideoMuted;
            updated = true;
        }

        if (updated) {
            conference.eventEmitter.emit(
                JitsiConferenceEvents.START_MUTED_POLICY_CHANGED,
                conference.startMutedPolicy
            );
        }
    });

    if(conference.statistics) {
        //FIXME: Maybe remove event should not be associated with the conference.
        conference.statistics.addAudioLevelListener(function (ssrc, level) {
            var userId = null;
            var jid = conference.room.getJidBySSRC(ssrc);
            if (!jid)
                return;

            conference.rtc.setAudioLevel(jid, level);
        });
        conference.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE,
            function () {
                conference.statistics.dispose();
            });
        // FIXME: Maybe we should move this.
        // RTC.addListener(RTCEvents.AVAILABLE_DEVICES_CHANGED, function (devices) {
        //     conference.room.updateDeviceAvailability(devices);
        // });
    }
}


module.exports = JitsiConference;
