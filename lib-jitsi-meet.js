(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.JitsiMeetJS = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (__filename){
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
        var muteHandler = this._fireMuteChangeEvent.bind(this, track);
        var stopHandler = this.removeTrack.bind(this, track);
        var audioLevelHandler = this._fireAudioLevelChangeEvent.bind(this);
        track.addEventListener(JitsiTrackEvents.TRACK_MUTE_CHANGED, muteHandler);
        track.addEventListener(JitsiTrackEvents.TRACK_STOPPED, stopHandler);
        track.addEventListener(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, audioLevelHandler);
        this.addEventListener(JitsiConferenceEvents.TRACK_REMOVED, function (someTrack) {
            if (someTrack !== track) {
                return;
            }
            track.removeEventListener(JitsiTrackEvents.TRACK_MUTE_CHANGED, muteHandler);
            track.removeEventListener(JitsiTrackEvents.TRACK_STOPPED, stopHandler);
            track.removeEventListener(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED, audioLevelHandler);
        });
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

}).call(this,"/JitsiConference.js")
},{"./JitsiConferenceErrors":2,"./JitsiConferenceEvents":3,"./JitsiParticipant":8,"./JitsiTrackEvents":10,"./modules/DTMF/JitsiDTMFManager":11,"./modules/RTC/RTC":16,"./modules/statistics/statistics":24,"./service/RTC/RTCEvents":80,"./service/authentication/AuthenticationEvents":83,"./service/xmpp/XMPPEvents":87,"events":44,"jitsi-meet-logger":48}],2:[function(require,module,exports){
/**
 * Enumeration with the errors for the conference.
 * @type {{string: string}}
 */
var JitsiConferenceErrors = {
    /**
     * Indicates that a password is required in order to join the conference.
     */
    PASSWORD_REQUIRED: "conference.passwordRequired",
    /**
     * Indicates that client must be authenticated to create the conference.
     */
    AUTHENTICATION_REQUIRED: "conference.authenticationRequired",
    /**
     * Indicates that password cannot be set for this conference.
     */
    PASSWORD_NOT_SUPPORTED: "conference.passwordNotSupported",
    /**
     * Indicates that a connection error occurred when trying to join a
     * conference.
     */
    CONNECTION_ERROR: "conference.connectionError",
    /**
     * Indicates that the conference setup failed.
     */
    SETUP_FAILED: "conference.setup_failed",
    /**
     * Indicates that there is no available videobridge.
     */
    VIDEOBRIDGE_NOT_AVAILABLE: "conference.videobridgeNotAvailable"
    /**
     * Many more errors TBD here.
     */
};

module.exports = JitsiConferenceErrors;

},{}],3:[function(require,module,exports){
/**
 * Enumeration with the events for the conference.
 * @type {{string: string}}
 */
var JitsiConferenceEvents = {
    /**
     * A new media track was added to the conference.
     */
    TRACK_ADDED: "conference.trackAdded",
    /**
     * The media track was removed from the conference.
     */
    TRACK_REMOVED: "conference.trackRemoved",
    /**
     * The dominant speaker was changed.
     */
    DOMINANT_SPEAKER_CHANGED: "conference.dominantSpeaker",
    /**
     * A new user joinned the conference.
     */
    USER_JOINED: "conference.userJoined",
    /**
     * A user has left the conference.
     */
    USER_LEFT: "conference.userLeft",
    /**
     * User role changed.
     */
    USER_ROLE_CHANGED: "conference.roleChanged",
    /**
     * New text message was received.
     */
    MESSAGE_RECEIVED: "conference.messageReceived",
    /**
     * A user has changed it display name
     */
    DISPLAY_NAME_CHANGED: "conference.displayNameChanged",
    /**
     * A participant avatar has changed.
     */
    AVATAR_CHANGED: "conference.avatarChanged",
    /**
     * New connection statistics are received.
     */
    CONNECTION_STATS_RECEIVED: "conference.connectionStatsReceived",
    /**
     * The Last N set is changed.
     */
    LAST_N_ENDPOINTS_CHANGED: "conference.lastNEndpointsChanged",
    /**
     * You are included / excluded in somebody's last N set
     */
    IN_LAST_N_CHANGED: "conference.lastNEndpointsChanged",
    /**
     * A media track ( attached to the conference) mute status was changed.
     */
    TRACK_MUTE_CHANGED: "conference.trackMuteChanged",
    /**
     * Audio levels of a media track ( attached to the conference) was changed.
     */
    TRACK_AUDIO_LEVEL_CHANGED: "conference.audioLevelsChanged",
    /**
     * Indicates that the connection to the conference has been interrupted
     * for some reason.
     */
    CONNECTION_INTERRUPTED: "conference.connectionInterrupted",
    /**
     * Indicates that the connection to the conference has been restored.
     */
    CONNECTION_RESTORED: "conference.connectionRestored",
    /**
     * Indicates that conference failed.
     */
    CONFERENCE_FAILED: "conference.failed",
    /**
     * Indicates that conference has been joined.
     */
    CONFERENCE_JOINED: "conference.joined",
    /**
     * Indicates that conference has been left.
     */
    CONFERENCE_LEFT: "conference.left",
    /**
     * You are kicked from the conference.
     */
    KICKED: "conferenece.kicked",
    /**
     * Indicates that start muted settings changed.
     */
    START_MUTED_POLICY_CHANGED: "conference.start_muted_policy_changed",
    /**
     * Indicates that the local user has started muted.
     */
    STARTED_MUTED: "conference.started_muted",
    /**
     * Indicates that DTMF support changed.
     */
    DTMF_SUPPORT_CHANGED: "conference.dtmfSupportChanged",
    /**
     * Indicates that recording state changed.
     */
    RECORDING_STATE_CHANGED: "conference.recordingStateChanged",
    /**
     * Indicates that phone number changed.
     */
    PHONE_NUMBER_CHANGED: "conference.phoneNumberChanged"
};

module.exports = JitsiConferenceEvents;

},{}],4:[function(require,module,exports){
var JitsiConference = require("./JitsiConference");
var XMPP = require("./modules/xmpp/xmpp");

/**
 * Creates new connection object for the Jitsi Meet server side video conferencing service. Provides access to the
 * JitsiConference interface.
 * @param appID identification for the provider of Jitsi Meet video conferencing services.
 * @param token the JWT token used to authenticate with the server(optional)
 * @param options Object with properties / settings related to connection with the server.
 * @constructor
 */
function JitsiConnection(appID, token, options) {
    this.appID = appID;
    this.token = token;
    this.options = options;
    this.xmpp = new XMPP(options);
    this.conferences = {};
}

/**
 * Connect the client with the server.
 * @param options {object} connecting options (for example authentications parameters).
 */
JitsiConnection.prototype.connect = function (options) {
    if(!options)
        options = {};

    this.xmpp.connect(options.id, options.password);
}

/**
 * Disconnect the client from the server.
 */
JitsiConnection.prototype.disconnect = function () {
    this.xmpp.disconnect();
}

/**
 * This method allows renewal of the tokens if they are expiring.
 * @param token the new token.
 */
JitsiConnection.prototype.setToken = function (token) {
    this.token = token;
}

/**
 * Creates and joins new conference.
 * @param name the name of the conference; if null - a generated name will be
 * provided from the api
 * @param options Object with properties / settings related to the conference
 * that will be created.
 * @returns {JitsiConference} returns the new conference object.
 */
JitsiConnection.prototype.initJitsiConference = function (name, options) {
    this.conferences[name] = new JitsiConference({name: name, config: options,
        connection: this});
    return this.conferences[name];
}

/**
 * Subscribes the passed listener to the event.
 * @param event {JitsiConnectionEvents} the connection event.
 * @param listener {Function} the function that will receive the event
 */
JitsiConnection.prototype.addEventListener = function (event, listener) {
    this.xmpp.addListener(event, listener);
}

/**
 * Unsubscribes the passed handler.
 * @param event {JitsiConnectionEvents} the connection event.
 * @param listener {Function} the function that will receive the event
 */
JitsiConnection.prototype.removeEventListener = function (event, listener) {
    this.xmpp.removeListener(event, listener);
}

module.exports = JitsiConnection;

},{"./JitsiConference":1,"./modules/xmpp/xmpp":42}],5:[function(require,module,exports){
/**
 * Enumeration with the errors for the connection.
 * @type {{string: string}}
 */
var JitsiConnectionErrors = {
    /**
     * Indicates that a password is required in order to join the conference.
     */
    PASSWORD_REQUIRED: "connection.passwordRequired",
    /**
     * Indicates that a connection error occurred when trying to join a
     * conference.
     */
    CONNECTION_ERROR: "connection.connectionError",
    /**
     * Not specified errors.
     */
    OTHER_ERROR: "connection.otherError"
};

module.exports = JitsiConnectionErrors;

},{}],6:[function(require,module,exports){
/**
 * Enumeration with the events for the connection.
 * @type {{string: string}}
 */
var JitsiConnnectionEvents = {
    /**
     * Indicates that the connection has been failed for some reason.
     */
    CONNECTION_FAILED: "connection.connectionFailed",
    /**
     * Indicates that the connection has been established.
     */
    CONNECTION_ESTABLISHED: "connection.connectionEstablished",
    /**
     * Indicates that the connection has been disconnected.
     */
    CONNECTION_DISCONNECTED: "connection.connectionDisconnected",
    /**
     * Indicates that the perfomed action cannot be executed because the
     * connection is not in the correct state(connected, disconnected, etc.)
     */
    WRONG_STATE: "connection.wrongState"
};

module.exports = JitsiConnnectionEvents;

},{}],7:[function(require,module,exports){
var JitsiConnection = require("./JitsiConnection");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiConnectionEvents = require("./JitsiConnectionEvents");
var JitsiConnectionErrors = require("./JitsiConnectionErrors");
var JitsiConferenceErrors = require("./JitsiConferenceErrors");
var JitsiTrackEvents = require("./JitsiTrackEvents");
var JitsiTrackErrors = require("./JitsiTrackErrors");
var Logger = require("jitsi-meet-logger");
var RTC = require("./modules/RTC/RTC");
var Statistics = require("./modules/statistics/statistics");
var Resolutions = require("./service/RTC/Resolutions");

function getLowerResolution(resolution) {
    if(!Resolutions[resolution])
        return null;
    var order = Resolutions[resolution].order;
    var res = null;
    var resName = null;
    for(var i in Resolutions) {
        var tmp = Resolutions[i];
        if (!res || (res.order < tmp.order && tmp.order < order)) {
            resName = i;
            res = tmp;
        }
    }
    return resName;
}

/**
 * Namespace for the interface of Jitsi Meet Library.
 */
var LibJitsiMeet = {

    JitsiConnection: JitsiConnection,
    events: {
        conference: JitsiConferenceEvents,
        connection: JitsiConnectionEvents,
        track: JitsiTrackEvents
    },
    errors: {
        conference: JitsiConferenceErrors,
        connection: JitsiConnectionErrors,
        track: JitsiTrackErrors
    },
    logLevels: Logger.levels,
    init: function (options) {
        return RTC.init(options || {});
    },
    /**
     * Returns whether the desktop sharing is enabled or not.
     * @returns {boolean}
     */
    isDesktopSharingEnabled: function () {
        return RTC.isDesktopSharingEnabled();
    },
    setLogLevel: function (level) {
        Logger.setLogLevel(level);
    },
    /**
     * Creates the media tracks and returns them trough the callback.
     * @param options Object with properties / settings specifying the tracks which should be created.
     * should be created or some additional configurations about resolution for example.
     * @param {Array} options.devices the devices that will be requested
     * @param {string} options.resolution resolution constraints
     * @param {bool} options.dontCreateJitsiTrack if <tt>true</tt> objects with the following structure {stream: the Media Stream,
     * type: "audio" or "video", videoType: "camera" or "desktop"}
     * will be returned trough the Promise, otherwise JitsiTrack objects will be returned.
     * @param {string} options.cameraDeviceId
     * @param {string} options.micDeviceId
     * @returns {Promise.<{Array.<JitsiTrack>}, JitsiConferenceError>}
     *     A promise that returns an array of created JitsiTracks if resolved,
     *     or a JitsiConferenceError if rejected.
     */
    createLocalTracks: function (options) {
        return RTC.obtainAudioAndVideoPermissions(options || {}).then(
            function(tracks) {
                if(!RTC.options.disableAudioLevels)
                    for(var i = 0; i < tracks.length; i++) {
                        var track = tracks[i];
                        var mStream = track.getOriginalStream();
                        if(track.getType() === "audio"){
                            Statistics.startLocalStats(mStream,
                                track.setAudioLevel.bind(track));
                            track.addEventListener(
                                JitsiTrackEvents.TRACK_STOPPED,
                                function(){
                                    Statistics.stopLocalStats(mStream);
                                });
                        }
                    }
                return tracks;
            }).catch(function (error) {
                if(error === JitsiTrackErrors.UNSUPPORTED_RESOLUTION) {
                    var oldResolution = options.resolution || '360';
                    var newResolution = getLowerResolution(oldResolution);
                    if(newResolution === null)
                        return Promise.reject(error);
                    options.resolution = newResolution;
                    return LibJitsiMeet.createLocalTracks(options);
                }
                return Promise.reject(error);
            });
    },
    /**
     * Checks if its possible to enumerate available cameras/micropones.
     * @returns {boolean} true if available, false otherwise.
     */
    isDeviceListAvailable: function () {
        return RTC.isDeviceListAvailable();
    },
    /**
     * Returns true if changing the camera / microphone device is supported and
     * false if not.
     * @returns {boolean} true if available, false otherwise.
     */
    isDeviceChangeAvailable: function () {
        return RTC.isDeviceChangeAvailable();
    },
    enumerateDevices: function (callback) {
        RTC.enumerateDevices(callback);
    }
};

require("es6-promise").polyfill()
//Setups the promise object.
window.Promise = window.Promise || require("es6-promise").Promise;

module.exports = LibJitsiMeet;

},{"./JitsiConferenceErrors":2,"./JitsiConferenceEvents":3,"./JitsiConnection":4,"./JitsiConnectionErrors":5,"./JitsiConnectionEvents":6,"./JitsiTrackErrors":9,"./JitsiTrackEvents":10,"./modules/RTC/RTC":16,"./modules/statistics/statistics":24,"./service/RTC/Resolutions":81,"es6-promise":46,"jitsi-meet-logger":48}],8:[function(require,module,exports){
/* global Strophe */

/**
 * Represents a participant in (a member of) a conference.
 */
function JitsiParticipant(jid, conference, displayName){
    this._jid = jid;
    this._id = Strophe.getResourceFromJid(jid);
    this._conference = conference;
    this._displayName = displayName;
    this._supportsDTMF = false;
    this._tracks = [];
    this._role = 'none';
}

/**
 * @returns {JitsiConference} The conference that this participant belongs to.
 */
JitsiParticipant.prototype.getConference = function() {
    return this._conference;
};

/**
 * @returns {Array.<JitsiTrack>} The list of media tracks for this participant.
 */
JitsiParticipant.prototype.getTracks = function() {
    return this._tracks;
};

/**
 * @returns {String} The ID of this participant.
 */
JitsiParticipant.prototype.getId = function() {
    return this._id;
};

/**
 * @returns {String} The JID of this participant.
 */
JitsiParticipant.prototype.getJid = function() {
    return this._jid;
};

/**
 * @returns {String} The human-readable display name of this participant.
 */
JitsiParticipant.prototype.getDisplayName = function() {
    return this._displayName;
};

/**
 * @returns {Boolean} Whether this participant is a moderator or not.
 */
JitsiParticipant.prototype.isModerator = function() {
    return this._role === 'moderator';
};

// Gets a link to an etherpad instance advertised by the participant?
//JitsiParticipant.prototype.getEtherpad = function() {
//
//}


/*
 * @returns {Boolean} Whether this participant has muted their audio.
 */
JitsiParticipant.prototype.isAudioMuted = function() {
    return this.getTracks().reduce(function (track, isAudioMuted) {
        return isAudioMuted && (track.isVideoTrack() || track.isMuted());
    }, true);
};

/*
 * @returns {Boolean} Whether this participant has muted their video.
 */
JitsiParticipant.prototype.isVideoMuted = function() {
    return this.getTracks().reduce(function (track, isVideoMuted) {
        return isVideoMuted && (track.isAudioTrack() || track.isMuted());
    }, true);
};

/*
 * @returns {???} The latest statistics reported by this participant
 * (i.e. info used to populate the GSM bars)
 * TODO: do we expose this or handle it internally?
 */
JitsiParticipant.prototype.getLatestStats = function() {

};

/**
 * @returns {String} The role of this participant.
 */
JitsiParticipant.prototype.getRole = function() {
    return this._role;
};

/*
 * @returns {Boolean} Whether this participant is
 * the conference focus (i.e. jicofo).
 */
JitsiParticipant.prototype.isFocus = function() {

};

/*
 * @returns {Boolean} Whether this participant is
 * a conference recorder (i.e. jirecon).
 */
JitsiParticipant.prototype.isRecorder = function() {

};

/*
 * @returns {Boolean} Whether this participant is a SIP gateway (i.e. jigasi).
 */
JitsiParticipant.prototype.isSipGateway = function() {

};

/**
 * @returns {Boolean} Whether this participant
 * is currently sharing their screen.
 */
JitsiParticipant.prototype.isScreenSharing = function() {

};

/**
 * @returns {String} The user agent of this participant
 * (i.e. browser userAgent string).
 */
JitsiParticipant.prototype.getUserAgent = function() {

};

/**
 * Kicks the participant from the conference (requires certain privileges).
 */
JitsiParticipant.prototype.kick = function() {

};

/**
 * Asks this participant to mute themselves.
 */
JitsiParticipant.prototype.askToMute = function() {

};

JitsiParticipant.prototype.supportsDTMF = function () {
    return this._supportsDTMF;
};


module.exports = JitsiParticipant;

},{}],9:[function(require,module,exports){
module.exports = {
    /**
     * Returns JitsiTrackErrors based on the error object passed by GUM
     * @param error the error
     * @param {Array} devices Array with the requested devices
     */
    parseError: function (error, devices) {
        devices = devices || [];
        if (typeof error == "object" && error.constraintName && error.name
            && (error.name == "ConstraintNotSatisfiedError" ||
            error.name == "OverconstrainedError") &&
            (error.constraintName == "minWidth" ||
            error.constraintName == "maxWidth" ||
            error.constraintName == "minHeight" ||
            error.constraintName == "maxHeight") &&
            devices.indexOf("video") !== -1) {
                return this.UNSUPPORTED_RESOLUTION;
        } else {
            return this.GENERAL;
        }
    },
    UNSUPPORTED_RESOLUTION: "gum.unsupported_resolution",
    GENERAL: "gum.general"
};

},{}],10:[function(require,module,exports){
var JitsiTrackEvents = {
    /**
     * A media track mute status was changed.
     */
    TRACK_MUTE_CHANGED: "track.trackMuteChanged",
    /**
     * Audio levels of a this track was changed.
     */
    TRACK_AUDIO_LEVEL_CHANGED: "track.audioLevelsChanged",
    /**
     * The media track was removed to the conference.
     */
    TRACK_STOPPED: "track.stopped"
};

module.exports = JitsiTrackEvents;

},{}],11:[function(require,module,exports){
(function (__filename){
var logger = require("jitsi-meet-logger").getLogger(__filename);

function JitsiDTMFManager (localAudio, peerConnection) {
    var tracks = localAudio._getTracks();
    if (!tracks.length) {
        throw new Error("Failed to initialize DTMFSender: no audio track.");
    }
    this.dtmfSender = peerConnection.peerconnection.createDTMFSender(tracks[0]);
    logger.debug("Initialized DTMFSender");
}


JitsiDTMFManager.prototype.sendTones = function (tones, duration, pause) {
    this.dtmfSender.insertDTMF(tones, (duration || 200), (pause || 200));
};

}).call(this,"/modules/DTMF/JitsiDTMFManager.js")
},{"jitsi-meet-logger":48}],12:[function(require,module,exports){
(function (__filename){
/* global config, APP, Strophe */

// cache datachannels to avoid garbage collection
// https://code.google.com/p/chromium/issues/detail?id=405545

var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTCEvents = require("../../service/RTC/RTCEvents");


/**
 * Binds "ondatachannel" event listener to given PeerConnection instance.
 * @param peerConnection WebRTC peer connection instance.
 */
function DataChannels(peerConnection, emitter) {
    peerConnection.ondatachannel = this.onDataChannel.bind(this);
    this.eventEmitter = emitter;

    this._dataChannels = [];

    // Sample code for opening new data channel from Jitsi Meet to the bridge.
    // Although it's not a requirement to open separate channels from both bridge
    // and peer as single channel can be used for sending and receiving data.
    // So either channel opened by the bridge or the one opened here is enough
    // for communication with the bridge.
    /*var dataChannelOptions =
     {
     reliable: true
     };
     var dataChannel
     = peerConnection.createDataChannel("myChannel", dataChannelOptions);

     // Can be used only when is in open state
     dataChannel.onopen = function ()
     {
     dataChannel.send("My channel !!!");
     };
     dataChannel.onmessage = function (event)
     {
     var msgData = event.data;
     logger.info("Got My Data Channel Message:", msgData, dataChannel);
     };*/
};


/**
 * Callback triggered by PeerConnection when new data channel is opened
 * on the bridge.
 * @param event the event info object.
 */
DataChannels.prototype.onDataChannel = function (event) {
    var dataChannel = event.channel;
    var self = this;
    var lastSelectedEndpoint = null;

    dataChannel.onopen = function () {
        logger.info("Data channel opened by the Videobridge!", dataChannel);

        // Code sample for sending string and/or binary data
        // Sends String message to the bridge
        //dataChannel.send("Hello bridge!");
        // Sends 12 bytes binary message to the bridge
        //dataChannel.send(new ArrayBuffer(12));

        self.eventEmitter.emit(RTCEvents.DATA_CHANNEL_OPEN);

        // when the data channel becomes available, tell the bridge about video
        // selections so that it can do adaptive simulcast,
        // we want the notification to trigger even if userJid is undefined,
        // or null.
        this.handleSelectedEndpointEvent(this.lastSelectedEndpoint);
    };

    dataChannel.onerror = function (error) {
        logger.error("Data Channel Error:", error, dataChannel);
    };

    dataChannel.onmessage = function (event) {
        var data = event.data;
        // JSON
        var obj;

        try {
            obj = JSON.parse(data);
        }
        catch (e) {
            logger.error(
                "Failed to parse data channel message as JSON: ",
                data,
                dataChannel);
        }
        if (('undefined' !== typeof(obj)) && (null !== obj)) {
            var colibriClass = obj.colibriClass;

            if ("DominantSpeakerEndpointChangeEvent" === colibriClass) {
                // Endpoint ID from the Videobridge.
                var dominantSpeakerEndpoint = obj.dominantSpeakerEndpoint;

                logger.info(
                    "Data channel new dominant speaker event: ",
                    dominantSpeakerEndpoint);
                self.eventEmitter.emit(RTCEvents.DOMINANTSPEAKER_CHANGED, dominantSpeakerEndpoint);
            }
            else if ("InLastNChangeEvent" === colibriClass) {
                var oldValue = obj.oldValue;
                var newValue = obj.newValue;
                // Make sure that oldValue and newValue are of type boolean.
                var type;

                if ((type = typeof oldValue) !== 'boolean') {
                    if (type === 'string') {
                        oldValue = (oldValue == "true");
                    } else {
                        oldValue = new Boolean(oldValue).valueOf();
                    }
                }
                if ((type = typeof newValue) !== 'boolean') {
                    if (type === 'string') {
                        newValue = (newValue == "true");
                    } else {
                        newValue = new Boolean(newValue).valueOf();
                    }
                }

                self.eventEmitter.emit(RTCEvents.LASTN_CHANGED, oldValue, newValue);
            }
            else if ("LastNEndpointsChangeEvent" === colibriClass) {
                // The new/latest list of last-n endpoint IDs.
                var lastNEndpoints = obj.lastNEndpoints;
                // The list of endpoint IDs which are entering the list of
                // last-n at this time i.e. were not in the old list of last-n
                // endpoint IDs.
                var endpointsEnteringLastN = obj.endpointsEnteringLastN;

                logger.info(
                    "Data channel new last-n event: ",
                    lastNEndpoints, endpointsEnteringLastN, obj);
                self.eventEmitter.emit(RTCEvents.LASTN_ENDPOINT_CHANGED,
                    lastNEndpoints, endpointsEnteringLastN, obj);
            }
            else {
                logger.debug("Data channel JSON-formatted message: ", obj);
                // The received message appears to be appropriately formatted
                // (i.e. is a JSON object which assigns a value to the mandatory
                // property colibriClass) so don't just swallow it, expose it to
                // public consumption.
                self.eventEmitter.emit("rtc.datachannel." + colibriClass, obj);
            }
        }
    };

    dataChannel.onclose = function () {
        logger.info("The Data Channel closed", dataChannel);
        var idx = self._dataChannels.indexOf(dataChannel);
        if (idx > -1)
            self._dataChannels = self._dataChannels.splice(idx, 1);
    };
    this._dataChannels.push(dataChannel);
};

DataChannels.prototype.handleSelectedEndpointEvent = function (userResource) {
    this.lastSelectedEndpoint = userResource;
    this._onXXXEndpointChanged("selected", userResource);
}

DataChannels.prototype.handlePinnedEndpointEvent = function (userResource) {
    this._onXXXEndpointChanged("pinnned", userResource);
}

/**
 * Notifies Videobridge about a change in the value of a specific
 * endpoint-related property such as selected endpoint and pinnned endpoint.
 *
 * @param xxx the name of the endpoint-related property whose value changed
 * @param userResource the new value of the endpoint-related property after the
 * change
 */
DataChannels.prototype._onXXXEndpointChanged = function (xxx, userResource) {
    // Derive the correct words from xxx such as selected and Selected, pinned
    // and Pinned.
    var head = xxx.charAt(0);
    var tail = xxx.substring(1);
    var lower = head.toLowerCase() + tail;
    var upper = head.toUpperCase() + tail;

    // Notify Videobridge about the specified endpoint change.
    console.log(lower + ' endpoint changed: ', userResource);
    this._some(function (dataChannel) {
        if (dataChannel.readyState == 'open') {
            console.log(
                    'sending ' + lower
                        + ' endpoint changed notification to the bridge: ',
                    userResource);

            var jsonObject = {};

            jsonObject.colibriClass = (upper + 'EndpointChangedEvent');
            jsonObject[lower + "Endpoint"]
                = (userResource ? userResource : null);
            dataChannel.send(JSON.stringify(jsonObject));

            return true;
        }
    });
}

DataChannels.prototype._some = function (callback, thisArg) {
    var dataChannels = this._dataChannels;

    if (dataChannels && dataChannels.length !== 0) {
        if (thisArg)
            return dataChannels.some(callback, thisArg);
        else
            return dataChannels.some(callback);
    } else {
        return false;
    }
}

module.exports = DataChannels;


}).call(this,"/modules/RTC/DataChannels.js")
},{"../../service/RTC/RTCEvents":80,"jitsi-meet-logger":48}],13:[function(require,module,exports){
var JitsiTrack = require("./JitsiTrack");
var RTCBrowserType = require("./RTCBrowserType");
var JitsiTrackEvents = require('../../JitsiTrackEvents');
var RTCUtils = require("./RTCUtils");

/**
 * Represents a single media track (either audio or video).
 * @constructor
 */
function JitsiLocalTrack(stream, videoType,
  resolution)
{
    this.videoType = videoType;
    this.dontFireRemoveEvent = false;
    this.resolution = resolution;
    this.startMuted = false;
    var self = this;
    JitsiTrack.call(this, null, stream,
        function () {
            if(!this.dontFireRemoveEvent)
                this.eventEmitter.emit(
                    JitsiTrackEvents.TRACK_STOPPED);
            this.dontFireRemoveEvent = false;
        }.bind(this));

}

JitsiLocalTrack.prototype = Object.create(JitsiTrack.prototype);
JitsiLocalTrack.prototype.constructor = JitsiLocalTrack;

/**
 * Mutes / unmutes the track.
 * @param mute {boolean} if true the track will be muted. Otherwise the track will be unmuted.
 */
JitsiLocalTrack.prototype._setMute = function (mute) {
    if (this.isMuted() === mute) {
        return;
    }
    if(!this.rtc) {
        this.startMuted = mute;
        return;
    }
    var isAudio = this.type === JitsiTrack.AUDIO;
    this.dontFireRemoveEvent = false;

    if ((window.location.protocol != "https:") ||
        (isAudio) || this.videoType === "desktop" ||
        // FIXME FF does not support 'removeStream' method used to mute
        RTCBrowserType.isFirefox()) {

        var tracks = this._getTracks();
        for (var idx = 0; idx < tracks.length; idx++) {
            tracks[idx].enabled = !mute;
        }
        if(isAudio)
            this.rtc.room.setAudioMute(mute);
        else
            this.rtc.room.setVideoMute(mute);
        this.eventEmitter.emit(JitsiTrackEvents.TRACK_MUTE_CHANGED);
    } else {
        if (mute) {
            this.dontFireRemoveEvent = true;
            this.rtc.room.removeStream(this.stream, function () {});
            RTCUtils.stopMediaStream(this.stream);
            if(isAudio)
                this.rtc.room.setAudioMute(mute);
            else
                this.rtc.room.setVideoMute(mute);
            this.stream = null;
            this.eventEmitter.emit(JitsiTrackEvents.TRACK_MUTE_CHANGED);
            //FIXME: Maybe here we should set the SRC for the containers to something
        } else {
            var self = this;
            RTCUtils.obtainAudioAndVideoPermissions({
                devices: (isAudio ? ["audio"] : ["video"]),
                resolution: self.resolution})
                .then(function (streams) {
                    var stream = null;
                    for(var i = 0; i < streams.length; i++) {
                        stream = streams[i];
                        if(stream.type === self.type) {
                            self.stream = stream.stream;
                            self.videoType = stream.videoType;
                            break;
                        }
                    }

                    if(!stream)
                        return;

                    for(var i = 0; i < self.containers.length; i++)
                    {
                        RTCUtils.attachMediaStream(
                            self.containers[i], self.stream);
                    }

                    self.rtc.room.addStream(stream.stream,
                        function () {
                            if(isAudio)
                                self.rtc.room.setAudioMute(mute);
                            else
                                self.rtc.room.setVideoMute(mute);
                            self.eventEmitter.emit(
                                JitsiTrackEvents.TRACK_MUTE_CHANGED);
                        });
                });
        }
    }
}

/**
 * Stops sending the media track. And removes it from the HTML.
 * NOTE: Works for local tracks only.
 */
JitsiLocalTrack.prototype.stop = function () {
    if(!this.stream)
        return;
    if(this.rtc)
        this.rtc.room.removeStream(this.stream, function () {});
    RTCUtils.stopMediaStream(this.stream);
    this.detach();
}

/**
 * Returns <tt>true</tt> - if the stream is muted
 * and <tt>false</tt> otherwise.
 * @returns {boolean} <tt>true</tt> - if the stream is muted
 * and <tt>false</tt> otherwise.
 */
JitsiLocalTrack.prototype.isMuted = function () {
    if (!this.stream)
        return true;
    var tracks = [];
    var isAudio = this.type === JitsiTrack.AUDIO;
    if (isAudio) {
        tracks = this.stream.getAudioTracks();
    } else {
        if (!this.isActive())
            return true;
        tracks = this.stream.getVideoTracks();
    }
    for (var idx = 0; idx < tracks.length; idx++) {
        if(tracks[idx].enabled)
            return false;
    }
    return true;
};

/**
 * Private method. Updates rtc property of the track.
 * @param rtc the rtc instance.
 */
JitsiLocalTrack.prototype._setRTC = function (rtc) {
    this.rtc = rtc;
};

/**
 * Return true;
 */
JitsiLocalTrack.prototype.isLocal = function () {
    return true;
}

module.exports = JitsiLocalTrack;

},{"../../JitsiTrackEvents":10,"./JitsiTrack":15,"./RTCBrowserType":17,"./RTCUtils":18}],14:[function(require,module,exports){
var JitsiTrack = require("./JitsiTrack");
var JitsiTrackEvents = require("../../JitsiTrackEvents");

/**
 * Represents a single media track (either audio or video).
 * @param RTC the rtc instance.
 * @param data object with the stream and some details about it(participant id, video type, etc.)
 * @param sid sid for the Media Stream
 * @param ssrc ssrc for the Media Stream
 * @param eventEmitter the event emitter
 * @constructor
 */
function JitsiRemoteTrack(RTC, data, sid, ssrc) {
    JitsiTrack.call(this, RTC, data.stream,
        function () {
            this.eventEmitter.emit(JitsiTrackEvents.TRACK_STOPPED);
        }.bind(this));
    this.rtc = RTC;
    this.sid = sid;
    this.stream = data.stream;
    this.peerjid = data.peerjid;
    this.videoType = data.videoType;
    this.ssrc = ssrc;
    this.muted = false;
    if((this.type === JitsiTrack.AUDIO && data.audiomuted)
      || (this.type === JitsiTrack.VIDEO && data.videomuted)) {
        this.muted = true;
    }
}

JitsiRemoteTrack.prototype = Object.create(JitsiTrack.prototype);
JitsiRemoteTrack.prototype.constructor = JitsiRemoteTrack;

/**
 * Sets current muted status and fires an events for the change.
 * @param value the muted status.
 */
JitsiRemoteTrack.prototype.setMute = function (value) {
    this.stream.muted = value;
    this.muted = value;
    this.eventEmitter.emit(JitsiTrackEvents.TRACK_MUTE_CHANGED);
};

/**
 * Returns the current muted status of the track.
 * @returns {boolean|*|JitsiRemoteTrack.muted} <tt>true</tt> if the track is muted and <tt>false</tt> otherwise.
 */
JitsiRemoteTrack.prototype.isMuted = function () {
    return this.muted;
};

/**
 * Returns the participant id which owns the track.
 * @returns {string} the id of the participants.
 */
JitsiRemoteTrack.prototype.getParticipantId = function() {
    return Strophe.getResourceFromJid(this.peerjid);
};

/**
 * Return false;
 */
JitsiRemoteTrack.prototype.isLocal = function () {
    return false;
};

delete JitsiRemoteTrack.prototype.stop;

delete JitsiRemoteTrack.prototype.start;

module.exports = JitsiRemoteTrack;

},{"../../JitsiTrackEvents":10,"./JitsiTrack":15}],15:[function(require,module,exports){
var RTCBrowserType = require("./RTCBrowserType");
var JitsiTrackEvents = require("../../JitsiTrackEvents");
var EventEmitter = require("events");
var RTC = require("./RTCUtils");

/**
 * This implements 'onended' callback normally fired by WebRTC after the stream
 * is stopped. There is no such behaviour yet in FF, so we have to add it.
 * @param jitsiTrack our track object holding the original WebRTC stream object
 * to which 'onended' handling will be added.
 */
function implementOnEndedHandling(jitsiTrack) {
    var stream = jitsiTrack.getOriginalStream();
    var originalStop = stream.stop;
    stream.stop = function () {
        originalStop.apply(stream);
        if (jitsiTrack.isActive()) {
            stream.onended();
        }
    };
}

/**
 * Adds onended/oninactive handler to a MediaStream.
 * @param mediaStream a MediaStream to attach onended/oninactive handler
 * @param handler the handler
 */
function addMediaStreamInactiveHandler(mediaStream, handler) {
    if(RTCBrowserType.isTemasysPluginUsed()) {
        // themasys
        //FIXME: Seems that not working properly.
        if(mediaStream.onended) {
            mediaStream.onended = handler;
        } else if(mediaStream.addEventListener) {
            mediaStream.addEventListener('ended', function () {
                handler(mediaStream);
            });
        } else if(mediaStream.attachEvent) {
            mediaStream.attachEvent('ended', function () {
                handler(mediaStream);
            });
        }
    }
    else {
        if(typeof mediaStream.active !== "undefined")
            mediaStream.oninactive = handler;
        else
            mediaStream.onended = handler;
    }
}

/**
 * Represents a single media track (either audio or video).
 * @constructor
 * @param rtc the rtc instance
 * @param stream the stream
 * @param streamInactiveHandler the function that will handle
 *        onended/oninactive events of the stream.
 */
function JitsiTrack(rtc, stream, streamInactiveHandler)
{
    /**
     * Array with the HTML elements that are displaying the streams.
     * @type {Array}
     */
    this.containers = [];
    this.rtc = rtc;
    this.stream = stream;
    this.eventEmitter = new EventEmitter();
    this.audioLevel = -1;
    this.type = (this.stream.getVideoTracks().length > 0)?
        JitsiTrack.VIDEO : JitsiTrack.AUDIO;
    if(this.type == "audio") {
        this._getTracks = function () {
            return this.stream.getAudioTracks();
        }.bind(this);
    } else {
        this._getTracks = function () {
            return this.stream.getVideoTracks();
        }.bind(this);
    }
    if (RTCBrowserType.isFirefox() && this.stream) {
        implementOnEndedHandling(this);
    }

    if(stream)
        addMediaStreamInactiveHandler(stream, streamInactiveHandler);
}

/**
 * JitsiTrack video type.
 * @type {string}
 */
JitsiTrack.VIDEO = "video";

/**
 * JitsiTrack audio type.
 * @type {string}
 */
JitsiTrack.AUDIO = "audio";

/**
 * Returns the type (audio or video) of this track.
 */
JitsiTrack.prototype.getType = function() {
    return this.type;
};

/**
 * Check if this is audiotrack.
 */
JitsiTrack.prototype.isAudioTrack = function () {
    return this.getType() === JitsiTrack.AUDIO;
};

/**
 * Check if this is videotrack.
 */
JitsiTrack.prototype.isVideoTrack = function () {
    return this.getType() === JitsiTrack.VIDEO;
};

/**
 * Returns the RTCMediaStream from the browser (?).
 */
JitsiTrack.prototype.getOriginalStream = function() {
    return this.stream;
}

/**
 * Mutes the track.
 */
JitsiTrack.prototype.mute = function () {
    this._setMute(true);
}

/**
 * Unmutes the stream.
 */
JitsiTrack.prototype.unmute = function () {
    this._setMute(false);
}

/**
 * Attaches the MediaStream of this track to an HTML container (?).
 * Adds the container to the list of containers that are displaying the track.
 * @param container the HTML container
 */
JitsiTrack.prototype.attach = function (container) {
    if(this.stream)
        require("./RTCUtils").attachMediaStream(container, this.stream);
    this.containers.push(container);
}

/**
 * Removes the track from the passed HTML container.
 * @param container the HTML container. If <tt>null</tt> all containers are removed.
 */
JitsiTrack.prototype.detach = function (container) {
    for(var i = 0; i < this.containers.length; i++)
    {
        if(this.containers[i].is(container))
        {
            this.containers.splice(i,1);
        }
        if(!container)
        {
            this.containers[i].find(">video").remove();
        }
    }
    if(container)
        $(container).find(">video").remove();

}

/**
 * Stops sending the media track. And removes it from the HTML.
 * NOTE: Works for local tracks only.
 */
JitsiTrack.prototype.stop = function () {
}

/**
 * Returns true if this is a video track and the source of the video is a
 * screen capture as opposed to a camera.
 */
JitsiTrack.prototype.isScreenSharing = function(){

}

/**
 * Returns id of the track.
 * @returns {string} id of the track or null if this is fake track.
 */
JitsiTrack.prototype._getId = function () {
    var tracks = this.stream.getTracks();
    if(!tracks || tracks.length === 0)
        return null;
    return tracks[0].id;
};

/**
 * Returns id of the track.
 * @returns {string} id of the track or null if this is fake track.
 */
JitsiTrack.prototype.getId = function () {
    return RTC.getStreamID(this.stream);
};

/**
 * Checks whether the MediaStream is avtive/not ended.
 * When there is no check for active we don't have information and so
 * will return that stream is active (in case of FF).
 * @returns {boolean} whether MediaStream is active.
 */
JitsiTrack.prototype.isActive = function () {
    if((typeof this.stream.active !== "undefined"))
        return this.stream.active;
    else
        return true;
};

/**
 * Attaches a handler for events(For example - "audio level changed".).
 * All possible event are defined in JitsiTrackEvents.
 * @param eventId the event ID.
 * @param handler handler for the event.
 */
JitsiTrack.prototype.on = function (eventId, handler) {
    if(this.eventEmitter)
        this.eventEmitter.on(eventId, handler);
}

/**
 * Removes event listener
 * @param eventId the event ID.
 * @param [handler] optional, the specific handler to unbind
 */
JitsiTrack.prototype.off = function (eventId, handler) {
    if(this.eventEmitter)
        this.eventEmitter.removeListener(eventId, handler);
}

// Common aliases for event emitter
JitsiTrack.prototype.addEventListener = JitsiTrack.prototype.on;
JitsiTrack.prototype.removeEventListener = JitsiTrack.prototype.off;


/**
 * Sets the audio level for the stream
 * @param audioLevel the new audio level
 */
JitsiTrack.prototype.setAudioLevel = function (audioLevel) {
    if(this.audioLevel !== audioLevel) {
        this.eventEmitter.emit(JitsiTrackEvents.TRACK_AUDIO_LEVEL_CHANGED,
            audioLevel);
        this.audioLevel = audioLevel;
    }
 }

module.exports = JitsiTrack;

},{"../../JitsiTrackEvents":10,"./RTCBrowserType":17,"./RTCUtils":18,"events":44}],16:[function(require,module,exports){
/* global APP */
var EventEmitter = require("events");
var RTCBrowserType = require("./RTCBrowserType");
var RTCUtils = require("./RTCUtils.js");
var JitsiTrack = require("./JitsiTrack");
var JitsiLocalTrack = require("./JitsiLocalTrack.js");
var DataChannels = require("./DataChannels");
var JitsiRemoteTrack = require("./JitsiRemoteTrack.js");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var MediaStreamType = require("../../service/RTC/MediaStreamTypes");
var RTCEvents = require("../../service/RTC/RTCEvents.js");

function createLocalTracks(streams) {
    var newStreams = []
    for (var i = 0; i < streams.length; i++) {
        var localStream = new JitsiLocalTrack(streams[i].stream,
            streams[i].videoType, streams[i].resolution);
        newStreams.push(localStream);
        if (streams[i].isMuted === true)
            localStream.setMute(true);
    }
    return newStreams;
}

function RTC(room, options) {
    this.room = room;
    this.localStreams = [];
    //FIXME: we should start removing those streams.
    //FIXME: We should support multiple streams per jid.
    this.remoteStreams = {};
    this.localAudio = null;
    this.localVideo = null;
    this.eventEmitter = new EventEmitter();
    var self = this;
    this.options = options || {};
    room.addPresenceListener("videomuted", function (values, from) {
        if(self.remoteStreams[from]) {
            self.remoteStreams[from][JitsiTrack.VIDEO].setMute(values.value == "true");
        }
    });
    room.addPresenceListener("audiomuted", function (values, from) {
        if(self.remoteStreams[from]) {
            self.remoteStreams[from][JitsiTrack.AUDIO].setMute(values.value == "true");
        }
    });
}

/**
 * Creates the local MediaStreams.
 * @param {Object} [options] optional parameters
 * @param {Array} options.devices the devices that will be requested
 * @param {string} options.resolution resolution constraints
 * @param {bool} options.dontCreateJitsiTrack if <tt>true</tt> objects with the following structure {stream: the Media Stream,
 * type: "audio" or "video", videoType: "camera" or "desktop"}
 * will be returned trough the Promise, otherwise JitsiTrack objects will be returned.
 * @param {string} options.cameraDeviceId
 * @param {string} options.micDeviceId
 * @returns {*} Promise object that will receive the new JitsiTracks
 */
RTC.obtainAudioAndVideoPermissions = function (options) {
    return RTCUtils.obtainAudioAndVideoPermissions(options).then(createLocalTracks);
}

RTC.prototype.onIncommingCall = function(event) {
    if(this.options.config.openSctp)
        this.dataChannels = new DataChannels(event.peerconnection, this.eventEmitter);
    for(var i = 0; i < this.localStreams.length; i++)
        if(this.localStreams[i])
        {
            this.room.addStream(this.localStreams[i].getOriginalStream(), function () {});
        }
}

RTC.prototype.selectedEndpoint = function (id) {
    if(this.dataChannels)
        this.dataChannels.handleSelectedEndpointEvent(id);
}

RTC.prototype.pinEndpoint = function (id) {
    if(this.dataChannels)
        this.dataChannels.handlePinnedEndpointEvent(id);
}

RTC.prototype.addListener = function (type, listener) {
    this.eventEmitter.on(type, listener);
};

RTC.prototype.removeListener = function (eventType, listener) {
    this.eventEmitter.removeListener(eventType, listener);
};

RTC.addListener = function (eventType, listener) {
    RTCUtils.addListener(eventType, listener);
}

RTC.removeListener = function (eventType, listener) {
    RTCUtils.removeListener(eventType, listener)
}

RTC.isRTCReady = function () {
    return RTCUtils.isRTCReady();
}

RTC.init = function (options) {
    this.options = options || {};
    return RTCUtils.init(this.options);
}

RTC.getDeviceAvailability = function () {
    return RTCUtils.getDeviceAvailability();
}

RTC.prototype.addLocalStream = function (stream) {
    this.localStreams.push(stream);
    stream._setRTC(this);

    if (stream.type == "audio") {
        this.localAudio = stream;
    } else {
        this.localVideo = stream;
    }
};

/**
 * Set mute for all local audio streams attached to the conference.
 * @param value the mute value
 */
RTC.prototype.setAudioMute = function (value) {
    for(var i = 0; i < this.localStreams.length; i++) {
        var stream = this.localStreams[i];
        if(stream.getType() !== "audio") {
            continue;
        }
        stream._setMute(value);
    }
}

RTC.prototype.removeLocalStream = function (track) {
    var pos = this.localStreams.indexOf(track);
    if (pos > -1) {
        this.localStreams.splice(pos, 1);
    }
};

RTC.prototype.createRemoteStream = function (data, sid, thessrc) {
    var remoteStream = new JitsiRemoteTrack(this, data, sid, thessrc);
    if(!data.peerjid)
        return;
    var jid = Strophe.getResourceFromJid(data.peerjid);
    if(!this.remoteStreams[jid]) {
        this.remoteStreams[jid] = {};
    }
    this.remoteStreams[jid][remoteStream.type]= remoteStream;
    return remoteStream;
};

RTC.getPCConstraints = function () {
    return RTCUtils.pc_constraints;
};

RTC.attachMediaStream =  function (elSelector, stream) {
    RTCUtils.attachMediaStream(elSelector, stream);
};

RTC.getStreamID = function (stream) {
    return RTCUtils.getStreamID(stream);
};

RTC.getVideoSrc = function (element) {
    return RTCUtils.getVideoSrc(element);
};

/**
 * Returns true if retrieving the the list of input devices is supported and
 * false if not.
 */
RTC.isDeviceListAvailable = function () {
    return RTCUtils.isDeviceListAvailable();
};

/**
 * Returns true if changing the camera / microphone device is supported and
 * false if not.
 */
RTC.isDeviceChangeAvailable = function () {
    return RTCUtils.isDeviceChangeAvailable();
}
/**
 * Allows to receive list of available cameras/microphones.
 * @param {function} callback would receive array of devices as an argument
 */
RTC.enumerateDevices = function (callback) {
    RTCUtils.enumerateDevices(callback);
};

RTC.setVideoSrc = function (element, src) {
    RTCUtils.setVideoSrc(element, src);
};

/**
 * A method to handle stopping of the stream.
 * One point to handle the differences in various implementations.
 * @param mediaStream MediaStream object to stop.
 */
RTC.stopMediaStream = function (mediaStream) {
    RTCUtils.stopMediaStream(mediaStream);
};

/**
 * Returns whether the desktop sharing is enabled or not.
 * @returns {boolean}
 */
RTC.isDesktopSharingEnabled = function () {
    return RTCUtils.isDesktopSharingEnabled();
}

RTC.prototype.getVideoElementName = function () {
    return RTCBrowserType.isTemasysPluginUsed() ? 'object' : 'video';
};

RTC.prototype.dispose = function() {
};

RTC.prototype.switchVideoStreams = function (newStream) {
    this.localVideo.stream = newStream;

    this.localStreams = [];

    //in firefox we have only one stream object
    if (this.localAudio.getOriginalStream() != newStream)
        this.localStreams.push(this.localAudio);
    this.localStreams.push(this.localVideo);
};

RTC.prototype.setAudioLevel = function (jid, audioLevel) {
    if(!jid)
        return;
    var resource = Strophe.getResourceFromJid(jid);
    if(this.remoteStreams[resource] && this.remoteStreams[resource][JitsiTrack.AUDIO])
        this.remoteStreams[resource][JitsiTrack.AUDIO].setAudioLevel(audioLevel);
}
module.exports = RTC;

},{"../../service/RTC/MediaStreamTypes":79,"../../service/RTC/RTCEvents.js":80,"../../service/desktopsharing/DesktopSharingEventTypes":84,"./DataChannels":12,"./JitsiLocalTrack.js":13,"./JitsiRemoteTrack.js":14,"./JitsiTrack":15,"./RTCBrowserType":17,"./RTCUtils.js":18,"events":44}],17:[function(require,module,exports){

var currentBrowser;

var browserVersion;

var isAndroid;

var RTCBrowserType = {

    RTC_BROWSER_CHROME: "rtc_browser.chrome",

    RTC_BROWSER_OPERA: "rtc_browser.opera",

    RTC_BROWSER_FIREFOX: "rtc_browser.firefox",

    RTC_BROWSER_IEXPLORER: "rtc_browser.iexplorer",

    RTC_BROWSER_SAFARI: "rtc_browser.safari",

    getBrowserType: function () {
        return currentBrowser;
    },

    isChrome: function () {
        return currentBrowser === RTCBrowserType.RTC_BROWSER_CHROME;
    },

    isOpera: function () {
        return currentBrowser === RTCBrowserType.RTC_BROWSER_OPERA;
    },
    isFirefox: function () {
        return currentBrowser === RTCBrowserType.RTC_BROWSER_FIREFOX;
    },

    isIExplorer: function () {
        return currentBrowser === RTCBrowserType.RTC_BROWSER_IEXPLORER;
    },

    isSafari: function () {
        return currentBrowser === RTCBrowserType.RTC_BROWSER_SAFARI;
    },
    isTemasysPluginUsed: function () {
        return RTCBrowserType.isIExplorer() || RTCBrowserType.isSafari();
    },
    getFirefoxVersion: function () {
        return RTCBrowserType.isFirefox() ? browserVersion : null;
    },

    getChromeVersion: function () {
        return RTCBrowserType.isChrome() ? browserVersion : null;
    },

    usesPlanB: function() {
        return RTCBrowserType.isChrome() || RTCBrowserType.isOpera() ||
            RTCBrowserType.isTemasysPluginUsed();
    },

    usesUnifiedPlan: function() {
        return RTCBrowserType.isFirefox();
    },

    /**
     * Whether the browser is running on an android device.
     */
    isAndroid: function() {
        return isAndroid;
    }

    // Add version getters for other browsers when needed
};

// detectOpera() must be called before detectChrome() !!!
// otherwise Opera wil be detected as Chrome
function detectChrome() {
    if (navigator.webkitGetUserMedia) {
        currentBrowser = RTCBrowserType.RTC_BROWSER_CHROME;
        var userAgent = navigator.userAgent.toLowerCase();
        // We can assume that user agent is chrome, because it's
        // enforced when 'ext' streaming method is set
        var ver = parseInt(userAgent.match(/chrome\/(\d+)\./)[1], 10);
        console.log("This appears to be Chrome, ver: " + ver);
        return ver;
    }
    return null;
}

function detectOpera() {
    var userAgent = navigator.userAgent;
    if (userAgent.match(/Opera|OPR/)) {
        currentBrowser = RTCBrowserType.RTC_BROWSER_OPERA;
        var version = userAgent.match(/(Opera|OPR) ?\/?(\d+)\.?/)[2];
        console.info("This appears to be Opera, ver: " + version);
        return version;
    }
    return null;
}

function detectFirefox() {
    if (navigator.mozGetUserMedia) {
        currentBrowser = RTCBrowserType.RTC_BROWSER_FIREFOX;
        var version = parseInt(
            navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
        console.log('This appears to be Firefox, ver: ' + version);
        return version;
    }
    return null;
}

function detectSafari() {
    if ((/^((?!chrome).)*safari/i.test(navigator.userAgent))) {
        currentBrowser = RTCBrowserType.RTC_BROWSER_SAFARI;
        console.info("This appears to be Safari");
        // FIXME detect Safari version when needed
        return 1;
    }
    return null;
}

function detectIE() {
    var version;
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        version = parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (!version && trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        version = parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (!version && edge > 0) {
        // IE 12 => return version number
        version = parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }

    if (version) {
        currentBrowser = RTCBrowserType.RTC_BROWSER_IEXPLORER;
        console.info("This appears to be IExplorer, ver: " + version);
    }
    return version;
}

function detectBrowser() {
    var version;
    var detectors = [
        detectOpera,
        detectChrome,
        detectFirefox,
        detectIE,
        detectSafari
    ];
    // Try all browser detectors
    for (var i = 0; i < detectors.length; i++) {
        version = detectors[i]();
        if (version)
            return version;
    }
    console.warn("Browser type defaults to Safari ver 1");
    currentBrowser = RTCBrowserType.RTC_BROWSER_SAFARI;
    return 1;
}

browserVersion = detectBrowser();
isAndroid = navigator.userAgent.indexOf('Android') != -1;

module.exports = RTCBrowserType;
},{}],18:[function(require,module,exports){
(function (__filename){
/* global config, require, attachMediaStream, getUserMedia,
   RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, MediaStreamTrack,
   mozRTCPeerConnection, mozRTCSessionDescription, mozRTCIceCandidate,
   webkitRTCPeerConnection, webkitMediaStream, webkitURL
*/
/* jshint -W101 */

var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTCBrowserType = require("./RTCBrowserType");
var Resolutions = require("../../service/RTC/Resolutions");
var RTCEvents = require("../../service/RTC/RTCEvents");
var AdapterJS = require("./adapter.screenshare");
var SDPUtil = require("../xmpp/SDPUtil");
var EventEmitter = require("events");
var screenObtainer = require("./ScreenObtainer");
var JitsiTrackErrors = require("../../JitsiTrackErrors");

var eventEmitter = new EventEmitter();

var devices = {
    audio: true,
    video: true
};

var rtcReady = false;

function setResolutionConstraints(constraints, resolution) {
    var isAndroid = RTCBrowserType.isAndroid();

    if (Resolutions[resolution]) {
        constraints.video.mandatory.minWidth = Resolutions[resolution].width;
        constraints.video.mandatory.minHeight = Resolutions[resolution].height;
    }
    else if (isAndroid) {
        // FIXME can't remember if the purpose of this was to always request
        //       low resolution on Android ? if yes it should be moved up front
        constraints.video.mandatory.minWidth = 320;
        constraints.video.mandatory.minHeight = 240;
        constraints.video.mandatory.maxFrameRate = 15;
    }

    if (constraints.video.mandatory.minWidth)
        constraints.video.mandatory.maxWidth =
            constraints.video.mandatory.minWidth;
    if (constraints.video.mandatory.minHeight)
        constraints.video.mandatory.maxHeight =
            constraints.video.mandatory.minHeight;
}

/**
 * @param {string[]} um required user media types
 *
 * @param {Object} [options={}] optional parameters
 * @param {string} options.resolution
 * @param {number} options.bandwidth
 * @param {number} options.fps
 * @param {string} options.desktopStream
 * @param {string} options.cameraDeviceId
 * @param {string} options.micDeviceId
 * @param {bool} firefox_fake_device
 */
function getConstraints(um, options) {
    var constraints = {audio: false, video: false};

    if (um.indexOf('video') >= 0) {
        // same behaviour as true
        constraints.video = { mandatory: {}, optional: [] };

        if (options.cameraDeviceId) {
            constraints.video.optional.push({
                sourceId: options.cameraDeviceId
            });
        }

        constraints.video.optional.push({ googLeakyBucket: true });

        setResolutionConstraints(constraints, options.resolution);
    }
    if (um.indexOf('audio') >= 0) {
        if (!RTCBrowserType.isFirefox()) {
            // same behaviour as true
            constraints.audio = { mandatory: {}, optional: []};
            if (options.micDeviceId) {
                constraints.audio.optional.push({
                    sourceId: options.micDeviceId
                });
            }
            // if it is good enough for hangouts...
            constraints.audio.optional.push(
                {googEchoCancellation: true},
                {googAutoGainControl: true},
                {googNoiseSupression: true},
                {googHighpassFilter: true},
                {googNoisesuppression2: true},
                {googEchoCancellation2: true},
                {googAutoGainControl2: true}
            );
        } else {
            if (options.micDeviceId) {
                constraints.audio = {
                    mandatory: {},
                    optional: [{
                        sourceId: options.micDeviceId
                    }]};
            } else {
                constraints.audio = true;
            }
        }
    }
    if (um.indexOf('screen') >= 0) {
        if (RTCBrowserType.isChrome()) {
            constraints.video = {
                mandatory: {
                    chromeMediaSource: "screen",
                    googLeakyBucket: true,
                    maxWidth: window.screen.width,
                    maxHeight: window.screen.height,
                    maxFrameRate: 3
                },
                optional: []
            };
        } else if (RTCBrowserType.isTemasysPluginUsed()) {
            constraints.video = {
                optional: [
                    {
                        sourceId: AdapterJS.WebRTCPlugin.plugin.screensharingKey
                    }
                ]
            };
        } else if (RTCBrowserType.isFirefox()) {
            constraints.video = {
                mozMediaSource: "window",
                mediaSource: "window"
            };

        } else {
            logger.error(
                "'screen' WebRTC media source is supported only in Chrome" +
                " and with Temasys plugin");
        }
    }
    if (um.indexOf('desktop') >= 0) {
        constraints.video = {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: options.desktopStream,
                googLeakyBucket: true,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height,
                maxFrameRate: 3
            },
            optional: []
        };
    }

    if (options.bandwidth) {
        if (!constraints.video) {
            //same behaviour as true
            constraints.video = {mandatory: {}, optional: []};
        }
        constraints.video.optional.push({bandwidth: options.bandwidth});
    }
    if (options.fps) {
        // for some cameras it might be necessary to request 30fps
        // so they choose 30fps mjpg over 10fps yuy2
        if (!constraints.video) {
            // same behaviour as true;
            constraints.video = {mandatory: {}, optional: []};
        }
        constraints.video.mandatory.minFrameRate = options.fps;
    }

    // we turn audio for both audio and video tracks, the fake audio & video seems to work
    // only when enabled in one getUserMedia call, we cannot get fake audio separate by fake video
    // this later can be a problem with some of the tests
    if(RTCBrowserType.isFirefox() && options.firefox_fake_device)
    {
        // seems to be fixed now, removing this experimental fix, as having
        // multiple audio tracks brake the tests
        //constraints.audio = true;
        constraints.fake = true;
    }

    return constraints;
}

function setAvailableDevices(um, available) {
    if (um.indexOf("video") != -1) {
        devices.video = available;
    }
    if (um.indexOf("audio") != -1) {
        devices.audio = available;
    }

    eventEmitter.emit(RTCEvents.AVAILABLE_DEVICES_CHANGED, devices);
}

// In case of IE we continue from 'onReady' callback
// passed to RTCUtils constructor. It will be invoked by Temasys plugin
// once it is initialized.
function onReady (options, GUM) {
    rtcReady = true;
    eventEmitter.emit(RTCEvents.RTC_READY, true);
    screenObtainer.init(eventEmitter, options, GUM);
}

/**
 * Apply function with arguments if function exists.
 * Do nothing if function not provided.
 * @param {function} [fn] function to apply
 * @param {Array} [args=[]] arguments for function
 */
function maybeApply(fn, args) {
  if (fn) {
    fn.apply(null, args || []);
  }
}

var getUserMediaStatus = {
  initialized: false,
  callbacks: []
};

/**
 * Wrap `getUserMedia` to allow others to know if it was executed at least
 * once or not. Wrapper function uses `getUserMediaStatus` object.
 * @param {Function} getUserMedia native function
 * @returns {Function} wrapped function
 */
function wrapGetUserMedia(getUserMedia) {
  return function (constraints, successCallback, errorCallback) {
    getUserMedia(constraints, function (stream) {
      maybeApply(successCallback, [stream]);
      if (!getUserMediaStatus.initialized) {
        getUserMediaStatus.initialized = true;
        getUserMediaStatus.callbacks.forEach(function (callback) {
          callback();
        });
        getUserMediaStatus.callbacks.length = 0;
      }
    }, function (error) {
      maybeApply(errorCallback, [error]);
    });
  };
}

/**
 * Create stub device which equals to auto selected device.
 * @param {string} kind if that should be `audio` or `video` device
 * @returns {Object} stub device description in `enumerateDevices` format
 */
function createAutoDeviceInfo(kind) {
    return {
        facing: null,
        label: 'Auto',
        kind: kind,
        deviceId: '',
        groupId: null
    };
}


/**
 * Execute function after getUserMedia was executed at least once.
 * @param {Function} callback function to execute after getUserMedia
 */
function afterUserMediaInitialized(callback) {
    if (getUserMediaStatus.initialized) {
        callback();
    } else {
        getUserMediaStatus.callbacks.push(callback);
    }
}

/**
 * Wrapper function which makes enumerateDevices to wait
 * until someone executes getUserMedia first time.
 * @param {Function} enumerateDevices native function
 * @returns {Funtion} wrapped function
 */
function wrapEnumerateDevices(enumerateDevices) {
    return function (callback) {
        // enumerate devices only after initial getUserMedia
        afterUserMediaInitialized(function () {

            enumerateDevices().then(function (devices) {
                //add auto devices
                devices.unshift(
                    createAutoDeviceInfo('audioinput'),
                    createAutoDeviceInfo('videoinput')
                );

                callback(devices);
            }, function (err) {
                console.error('cannot enumerate devices: ', err);

                // return only auto devices
                callback([createAutoDeviceInfo('audioInput'),
                          createAutoDeviceInfo('videoinput')]);
            });
        });
    };
}

/**
 * Use old MediaStreamTrack to get devices list and
 * convert it to enumerateDevices format.
 * @param {Function} callback function to call when received devices list.
 */
function enumerateDevicesThroughMediaStreamTrack (callback) {
    MediaStreamTrack.getSources(function (sources) {
        var devices = sources.map(function (source) {
            var kind = (source.kind || '').toLowerCase();
            return {
                facing: source.facing || null,
                label: source.label,
                kind: kind ? kind + 'input': null,
                deviceId: source.id,
                groupId: source.groupId || null
            };
        });

        //add auto devices
        devices.unshift(
            createAutoDeviceInfo('audioinput'),
            createAutoDeviceInfo('videoinput')
        );
        callback(devices);
    });
}

function obtainDevices(options) {
    if(!options.devices || options.devices.length === 0) {
        return options.successCallback(options.streams || {});
    }

    var device = options.devices.splice(0, 1);
    var devices = [];
    devices.push(device);
    options.deviceGUM[device](function (stream) {
            options.streams = options.streams || {};
            options.streams[device] = stream;
            obtainDevices(options);
        },
        function (error) {
            Object.keys(options.streams).forEach(function(device) {
                RTCUtils.stopMediaStream(options.streams[device]);
            });
            logger.error(
                "failed to obtain " + device + " stream - stop", error);
            options.errorCallback(JitsiTrackErrors.parseError(error, devices));
        });
}


/**
 * Handles the newly created Media Streams.
 * @param streams the new Media Streams
 * @param resolution the resolution of the video streams
 * @returns {*[]} object that describes the new streams
 */
function handleLocalStream(streams, resolution) {
    var audioStream, videoStream, desktopStream, res = [];
    // If this is FF, the stream parameter is *not* a MediaStream object, it's
    // an object with two properties: audioStream, videoStream.
    if (window.webkitMediaStream) {
        var audioVideo = streams.audioVideo;
        if (audioVideo) {
            var audioTracks = audioVideo.getAudioTracks();
            if(audioTracks.length) {
                audioStream = new webkitMediaStream();
                for (var i = 0; i < audioTracks.length; i++) {
                    audioStream.addTrack(audioTracks[i]);
                }
            }

            var videoTracks = audioVideo.getVideoTracks();
            if(videoTracks.length) {
                videoStream = new webkitMediaStream();
                for (var j = 0; j < videoTracks.length; j++) {
                    videoStream.addTrack(videoTracks[j]);
                }
            }
        }

        if (streams && streams.desktopStream)
            desktopStream = streams.desktopStream;

    }
    else if (RTCBrowserType.isFirefox() || RTCBrowserType.isTemasysPluginUsed()) {   // Firefox and Temasys plugin
        if (streams && streams.audio)
            audioStream = streams.audio;

        if (streams && streams.video)
            videoStream = streams.video;

        if(streams && streams.desktop)
            desktopStream = streams.desktop;
    }

    if (desktopStream)
        res.push({stream: desktopStream,
            type: "video", videoType: "desktop"});

    if(audioStream)
        res.push({stream: audioStream, type: "audio", videoType: null});

    if(videoStream)
        res.push({stream: videoStream, type: "video", videoType: "camera",
            resolution: resolution});

    return res;
}

//Options parameter is to pass config options. Currently uses only "useIPv6".
var RTCUtils = {
    init: function (options) {
        return new Promise(function(resolve, reject) {
            if (RTCBrowserType.isFirefox()) {
                var FFversion = RTCBrowserType.getFirefoxVersion();
                if (FFversion < 40) {
                    logger.error(
                            "Firefox version too old: " + FFversion +
                            ". Required >= 40.");
                    reject(new Error("Firefox version too old: " + FFversion +
                    ". Required >= 40."));
                    return;
                }
                this.peerconnection = mozRTCPeerConnection;
                this.getUserMedia = wrapGetUserMedia(navigator.mozGetUserMedia.bind(navigator));
                this.enumerateDevices = wrapEnumerateDevices(
                    navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices)
                );
                this.pc_constraints = {};
                this.attachMediaStream = function (element, stream) {
                    //  srcObject is being standardized and FF will eventually
                    //  support that unprefixed. FF also supports the
                    //  "element.src = URL.createObjectURL(...)" combo, but that
                    //  will be deprecated in favour of srcObject.
                    //
                    // https://groups.google.com/forum/#!topic/mozilla.dev.media/pKOiioXonJg
                    // https://github.com/webrtc/samples/issues/302
                    if (!element[0])
                        return;
                    element[0].mozSrcObject = stream;
                    element[0].play();
                };
                this.getStreamID = function (stream) {
                    var id = stream.id;
                    if (!id) {
                        var tracks = stream.getVideoTracks();
                        if (!tracks || tracks.length === 0) {
                            tracks = stream.getAudioTracks();
                        }
                        id = tracks[0].id;
                    }
                    return SDPUtil.filter_special_chars(id);
                };
                this.getVideoSrc = function (element) {
                    if (!element)
                        return null;
                    return element.mozSrcObject;
                };
                this.setVideoSrc = function (element, src) {
                    if (element)
                        element.mozSrcObject = src;
                };
                RTCSessionDescription = mozRTCSessionDescription;
                RTCIceCandidate = mozRTCIceCandidate;
            } else if (RTCBrowserType.isChrome() || RTCBrowserType.isOpera()) {
                this.peerconnection = webkitRTCPeerConnection;
                var getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
                if (navigator.mediaDevices) {
                    this.getUserMedia = wrapGetUserMedia(getUserMedia);
                    this.enumerateDevices = wrapEnumerateDevices(
                        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices)
                    );
                } else {
                    this.getUserMedia = getUserMedia;
                    this.enumerateDevices = enumerateDevicesThroughMediaStreamTrack;
                }
                this.attachMediaStream = function (element, stream) {

                    // saves the created url for the stream, so we can reuse it
                    // and not keep creating urls
                    if (!stream.jitsiObjectURL) {
                        stream.jitsiObjectURL
                            = webkitURL.createObjectURL(stream);
                    }

                    element.attr('src', stream.jitsiObjectURL);
                };
                this.getStreamID = function (stream) {
                    // streams from FF endpoints have the characters '{' and '}'
                    // that make jQuery choke.
                    return SDPUtil.filter_special_chars(stream.id);
                };
                this.getVideoSrc = function (element) {
                    if (!element)
                        return null;
                    return element.getAttribute("src");
                };
                this.setVideoSrc = function (element, src) {
                    if (element)
                        element.setAttribute("src", src);
                };
                // DTLS should now be enabled by default but..
                this.pc_constraints = {'optional': [
                    {'DtlsSrtpKeyAgreement': 'true'}
                ]};
                if (options.useIPv6) {
                    // https://code.google.com/p/webrtc/issues/detail?id=2828
                    this.pc_constraints.optional.push({googIPv6: true});
                }
                if (RTCBrowserType.isAndroid()) {
                    this.pc_constraints = {}; // disable DTLS on Android
                }
                if (!webkitMediaStream.prototype.getVideoTracks) {
                    webkitMediaStream.prototype.getVideoTracks = function () {
                        return this.videoTracks;
                    };
                }
                if (!webkitMediaStream.prototype.getAudioTracks) {
                    webkitMediaStream.prototype.getAudioTracks = function () {
                        return this.audioTracks;
                    };
                }
            }
            // Detect IE/Safari
            else if (RTCBrowserType.isTemasysPluginUsed()) {

                //AdapterJS.WebRTCPlugin.setLogLevel(
                //    AdapterJS.WebRTCPlugin.PLUGIN_LOG_LEVELS.VERBOSE);
                var self = this;
                AdapterJS.webRTCReady(function (isPlugin) {

                    self.peerconnection = RTCPeerConnection;
                    self.getUserMedia = window.getUserMedia;
                    self.enumerateDevices = enumerateDevicesThroughMediaStreamTrack;
                    self.attachMediaStream = function (elSel, stream) {

                        if (stream.id === "dummyAudio" || stream.id === "dummyVideo") {
                            return;
                        }

                        attachMediaStream(elSel[0], stream);
                    };
                    self.getStreamID = function (stream) {
                        var id = SDPUtil.filter_special_chars(stream.label);
                        return id;
                    };
                    self.getVideoSrc = function (element) {
                        if (!element) {
                            logger.warn("Attempt to get video SRC of null element");
                            return null;
                        }
                        var children = element.children;
                        for (var i = 0; i !== children.length; ++i) {
                            if (children[i].name === 'streamId') {
                                return children[i].value;
                            }
                        }
                        //logger.info(element.id + " SRC: " + src);
                        return null;
                    };
                    self.setVideoSrc = function (element, src) {
                        //logger.info("Set video src: ", element, src);
                        if (!src) {
                            logger.warn("Not attaching video stream, 'src' is null");
                            return;
                        }
                        AdapterJS.WebRTCPlugin.WaitForPluginReady();
                        var stream = AdapterJS.WebRTCPlugin.plugin
                            .getStreamWithId(AdapterJS.WebRTCPlugin.pageId, src);
                        attachMediaStream(element, stream);
                    };

                    onReady(options, self.getUserMediaWithConstraints);
                    resolve();
                });
            } else {
                try {
                    logger.error('Browser does not appear to be WebRTC-capable');
                } catch (e) {
                }
                reject('Browser does not appear to be WebRTC-capable');
                return;
            }

            // Call onReady() if Temasys plugin is not used
            if (!RTCBrowserType.isTemasysPluginUsed()) {
                onReady(options, this.getUserMediaWithConstraints);
                resolve();
            }
        }.bind(this));
    },
    /**
    * @param {string[]} um required user media types
    * @param {function} success_callback
    * @param {Function} failure_callback
    * @param {Object} [options] optional parameters
    * @param {string} options.resolution
    * @param {number} options.bandwidth
    * @param {number} options.fps
    * @param {string} options.desktopStream
    * @param {string} options.cameraDeviceId
    * @param {string} options.micDeviceId
    **/
    getUserMediaWithConstraints: function ( um, success_callback, failure_callback, options) {
        options = options || {};
        var resolution = options.resolution;
        var constraints = getConstraints(um, options);

        logger.info("Get media constraints", constraints);

        try {
            this.getUserMedia(constraints,
                function (stream) {
                    logger.log('onUserMediaSuccess');
                    setAvailableDevices(um, true);
                    success_callback(stream);
                },
                function (error) {
                    setAvailableDevices(um, false);
                    logger.warn('Failed to get access to local media. Error ',
                        error, constraints);
                    if (failure_callback) {
                        failure_callback(error, resolution);
                    }
                });
        } catch (e) {
            logger.error('GUM failed: ', e);
            if (failure_callback) {
                failure_callback(e);
            }
        }
    },

    /**
     * Creates the local MediaStreams.
     * @param {Object} [options] optional parameters
     * @param {Array} options.devices the devices that will be requested
     * @param {string} options.resolution resolution constraints
     * @param {bool} options.dontCreateJitsiTrack if <tt>true</tt> objects with the following structure {stream: the Media Stream,
     * type: "audio" or "video", videoType: "camera" or "desktop"}
     * will be returned trough the Promise, otherwise JitsiTrack objects will be returned.
     * @param {string} options.cameraDeviceId
     * @param {string} options.micDeviceId
     * @returns {*} Promise object that will receive the new JitsiTracks
     */
    obtainAudioAndVideoPermissions: function (options) {
        var self = this;

        options = options || {};
        return new Promise(function (resolve, reject) {
            var successCallback = function (stream) {
                resolve(handleLocalStream(stream, options.resolution));
            };

            options.devices = options.devices || ['audio', 'video'];
            if(!screenObtainer.isSupported()
                && options.devices.indexOf("desktop") !== -1){
                reject(new Error("Desktop sharing is not supported!"));
            }
            if (RTCBrowserType.isFirefox() ||
                RTCBrowserType.isTemasysPluginUsed()) {
                var GUM = function (device, s, e) {
                    this.getUserMediaWithConstraints(device, s, e, options);
                };

                var deviceGUM = {
                    "audio": GUM.bind(self, ["audio"]),
                    "video": GUM.bind(self, ["video"])
                };

                if(screenObtainer.isSupported()){
                    deviceGUM["desktop"] = screenObtainer.obtainStream.bind(
                        screenObtainer);
                }
                // With FF/IE we can't split the stream into audio and video because FF
                // doesn't support media stream constructors. So, we need to get the
                // audio stream separately from the video stream using two distinct GUM
                // calls. Not very user friendly :-( but we don't have many other
                // options neither.
                //
                // Note that we pack those 2 streams in a single object and pass it to
                // the successCallback method.
                obtainDevices({
                    devices: options.devices,
                    streams: [],
                    successCallback: successCallback,
                    errorCallback: reject,
                    deviceGUM: deviceGUM
                });
            } else {
                var hasDesktop = options.devices.indexOf('desktop') > -1;
                if (hasDesktop) {
                    options.devices.splice(options.devices.indexOf("desktop"), 1);
                }
                options.resolution = options.resolution || '360';
                if(options.devices.length) {
                    this.getUserMediaWithConstraints(
                        options.devices,
                        function (stream) {
                            if((options.devices.indexOf("audio") !== -1 &&
                                !stream.getAudioTracks().length) ||
                                (options.devices.indexOf("video") !== -1 &&
                                !stream.getVideoTracks().length))
                            {
                                self.stopMediaStream(stream);
                                reject(JitsiTrackErrors.parseError(
                                    new Error("Unable to get the audio and " +
                                        "video tracks."),
                                    options.devices));
                                    return;
                            }
                            if(hasDesktop) {
                                screenObtainer.obtainStream(
                                    function (desktopStream) {
                                        successCallback({audioVideo: stream,
                                            desktopStream: desktopStream});
                                    }, function (error) {
                                        self.stopMediaStream(stream);
                                        reject(
                                            JitsiTrackErrors.parseError(error,
                                                options.devices));
                                    });
                            } else {
                                successCallback({audioVideo: stream});
                            }
                        },
                        function (error) {
                            reject(JitsiTrackErrors.parseError(error,
                                options.devices));
                        },
                        options);
                } else if (hasDesktop) {
                    screenObtainer.obtainStream(
                        function (stream) {
                            successCallback({desktopStream: stream});
                        }, function (error) {
                            reject(
                                JitsiTrackErrors.parseError(error,
                                    ["desktop"]));
                        });
                }
            }
        }.bind(this));
    },
    addListener: function (eventType, listener) {
        eventEmitter.on(eventType, listener);
    },
    removeListener: function (eventType, listener) {
        eventEmitter.removeListener(eventType, listener);
    },
    getDeviceAvailability: function () {
        return devices;
    },
    isRTCReady: function () {
        return rtcReady;
    },
    /**
     * Checks if its possible to enumerate available cameras/micropones.
     * @returns {boolean} true if available, false otherwise.
     */
    isDeviceListAvailable: function () {
        var isEnumerateDevicesAvailable = navigator.mediaDevices && navigator.mediaDevices.enumerateDevices;
        if (isEnumerateDevicesAvailable) {
            return true;
        }
        return (MediaStreamTrack && MediaStreamTrack.getSources)? true : false;
    },
    /**
     * Returns true if changing the camera / microphone device is supported and
     * false if not.
     */
    isDeviceChangeAvailable: function () {
        if(RTCBrowserType.isChrome() || RTCBrowserType.isOpera() ||
            RTCBrowserType.isTemasysPluginUsed())
            return true;
        return false;
    },
    /**
     * A method to handle stopping of the stream.
     * One point to handle the differences in various implementations.
     * @param mediaStream MediaStream object to stop.
     */
    stopMediaStream: function (mediaStream) {
        mediaStream.getTracks().forEach(function (track) {
            // stop() not supported with IE
            if (track.stop) {
                track.stop();
            }
        });

        // leave stop for implementation still using it
        if (mediaStream.stop) {
            mediaStream.stop();
        }

        // if we have done createObjectURL, lets clean it
        if (mediaStream.jitsiObjectURL) {
            webkitURL.revokeObjectURL(mediaStream.jitsiObjectURL);
        }
    },
    /**
     * Returns whether the desktop sharing is enabled or not.
     * @returns {boolean}
     */
    isDesktopSharingEnabled: function () {
        return screenObtainer.isSupported();
    }

};

module.exports = RTCUtils;

}).call(this,"/modules/RTC/RTCUtils.js")
},{"../../JitsiTrackErrors":9,"../../service/RTC/RTCEvents":80,"../../service/RTC/Resolutions":81,"../xmpp/SDPUtil":32,"./RTCBrowserType":17,"./ScreenObtainer":19,"./adapter.screenshare":20,"events":44,"jitsi-meet-logger":48}],19:[function(require,module,exports){
(function (__filename){
/* global chrome, $, alert */
/* jshint -W003 */
var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTCBrowserType = require("./RTCBrowserType");
var AdapterJS = require("./adapter.screenshare");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");

/**
 * Indicates whether the Chrome desktop sharing extension is installed.
 * @type {boolean}
 */
var chromeExtInstalled = false;

/**
 * Indicates whether an update of the Chrome desktop sharing extension is
 * required.
 * @type {boolean}
 */
var chromeExtUpdateRequired = false;

/**
 * Whether the jidesha extension for firefox is installed for the domain on
 * which we are running. Null designates an unknown value.
 * @type {null}
 */
var firefoxExtInstalled = null;

/**
 * If set to true, detection of an installed firefox extension will be started
 * again the next time obtainScreenOnFirefox is called (e.g. next time the
 * user tries to enable screen sharing).
 */
var reDetectFirefoxExtension = false;

var GUM = null;

/**
 * Handles obtaining a stream from a screen capture on different browsers.
 */
var ScreenObtainer = {
    /**
     * The EventEmitter to use to emit events.
     * @type {null}
     */
    eventEmitter: null,
    obtainStream: null,
    /**
     * Initializes the function used to obtain a screen capture
     * (this.obtainStream).
     * 
     * If the browser is Chrome, it uses the value of
     * 'options.desktopSharingChromeMethod' (or 'options.desktopSharing') to
     * decide whether to use the a Chrome extension (if the value is 'ext'),
     * use the "screen" media source (if the value is 'webrtc'),
     * or disable screen capture (if the value is other).
     * Note that for the "screen" media source to work the
     * 'chrome://flags/#enable-usermedia-screen-capture' flag must be set.
     */
    init: function(eventEmitter, options, gum) {
        this.eventEmitter = eventEmitter;
        var obtainDesktopStream = null;
        this.options = options = options || {};
        GUM = gum;

        if (RTCBrowserType.isFirefox())
            initFirefoxExtensionDetection(options);

        // TODO remove this, options.desktopSharing is deprecated.
        var chromeMethod =
            (options.desktopSharingChromeMethod || options.desktopSharing);

        if (RTCBrowserType.isTemasysPluginUsed()) {
            if (!AdapterJS.WebRTCPlugin.plugin.HasScreensharingFeature) {
                logger.info("Screensharing not supported by this plugin " +
                    "version");
            } else if(!AdapterJS.WebRTCPlugin.plugin.isScreensharingAvailable) {
                logger.info(
                    "Screensharing not available with Temasys plugin on" +
                    " this site");
            } else {
                obtainDesktopStream = obtainWebRTCScreen;
                logger.info("Using Temasys plugin for desktop sharing");
            }
        } else if (RTCBrowserType.isChrome()) {
            if (chromeMethod == "ext") {
                if (RTCBrowserType.getChromeVersion() >= 34) {
                    obtainDesktopStream =
                        this.obtainScreenFromExtension;
                    logger.info("Using Chrome extension for desktop sharing");
                    initChromeExtension(options);
                } else {
                    logger.info("Chrome extension not supported until ver 34");
                }
            } else if (chromeMethod == "webrtc") {
                obtainDesktopStream = obtainWebRTCScreen;
                logger.info("Using Chrome WebRTC for desktop sharing");
            }
        } else if (RTCBrowserType.isFirefox()) {
            if (options.desktopSharingFirefoxDisabled) {
                obtainDesktopStream = null;
            } else if (window.location.protocol === "http:"){
                logger.log("Screen sharing is not supported over HTTP. " +
                    "Use of HTTPS is required.");
                obtainDesktopStream = null;
            } else {
                obtainDesktopStream = this.obtainScreenOnFirefox;
            }

        }

        if (!obtainDesktopStream) {
            logger.info("Desktop sharing disabled");
        }

        this.obtainStream = obtainDesktopStream;
    },

    /**
     * Checks whether obtaining a screen capture is supported in the current
     * environment.
     * @returns {boolean}
     */
    isSupported: function() {
        return !!this.obtainStream;
    },
    /**
     * Obtains a screen capture stream on Firefox.
     * @param callback
     * @param errorCallback
     */
    obtainScreenOnFirefox:
           function (callback, errorCallback) {
        var self = this;
        var extensionRequired = false;
        if (this.options.desktopSharingFirefoxMaxVersionExtRequired === -1 ||
            (this.options.desktopSharingFirefoxMaxVersionExtRequired >= 0 &&
                RTCBrowserType.getFirefoxVersion() <=
                    this.options.desktopSharingFirefoxMaxVersionExtRequired)) {
            extensionRequired = true;
            logger.log("Jidesha extension required on firefox version " +
                RTCBrowserType.getFirefoxVersion());
        }

        if (!extensionRequired || firefoxExtInstalled === true) {
            obtainWebRTCScreen(callback, errorCallback);
            return;
        }

        if (reDetectFirefoxExtension) {
            reDetectFirefoxExtension = false;
            initFirefoxExtensionDetection(this.options);
        }

        // Give it some (more) time to initialize, and assume lack of
        // extension if it hasn't.
        if (firefoxExtInstalled === null) {
            window.setTimeout(
                function() {
                    if (firefoxExtInstalled === null)
                        firefoxExtInstalled = false;
                    self.obtainScreenOnFirefox(callback, errorCallback);
                },
                300
            );
            logger.log("Waiting for detection of jidesha on firefox to " +
                "finish.");
            return;
        }

        // We need an extension and it isn't installed.

        // Make sure we check for the extension when the user clicks again.
        firefoxExtInstalled = null;
        reDetectFirefoxExtension = true;

        // Prompt the user to install the extension
        this.eventEmitter.emit(
            DesktopSharingEventTypes.FIREFOX_EXTENSION_NEEDED,
            this.options.desktopSharingFirefoxExtensionURL);

        // Make sure desktopsharing knows that we failed, so that it doesn't get
        // stuck in 'switching' mode.
        errorCallback('Firefox extension required.');
    },
    /**
     * Asks Chrome extension to call chooseDesktopMedia and gets chrome
     * 'desktop' stream for returned stream token.
     */
    obtainScreenFromExtension: function (streamCallback, failCallback) {
        if (chromeExtInstalled) {
            doGetStreamFromExtension(this.options, streamCallback,
                failCallback);
        } else {
            if (chromeExtUpdateRequired) {
                alert(
                    'Jitsi Desktop Streamer requires update. ' +
                    'Changes will take effect after next Chrome restart.');
            }

            chrome.webstore.install(
                getWebStoreInstallUrl(this.options),
                function (arg) {
                    logger.log("Extension installed successfully", arg);
                    chromeExtInstalled = true;
                    // We need to give a moment for the endpoint to become
                    // available
                    window.setTimeout(function () {
                        doGetStreamFromExtension(this.options, streamCallback,
                            failCallback);
                    }, 500);
                },
                function (arg) {
                    logger.log("Failed to install the extension", arg);
                    failCallback(arg);
                }
            );
        }
    }
};



/**
 * Obtains a desktop stream using getUserMedia.
 * For this to work on Chrome, the
 * 'chrome://flags/#enable-usermedia-screen-capture' flag must be enabled.
 *
 * On firefox, the document's domain must be white-listed in the
 * 'media.getusermedia.screensharing.allowed_domains' preference in
 * 'about:config'.
 */
function obtainWebRTCScreen(streamCallback, failCallback) {
    GUM(
        ['screen'],
        streamCallback,
        failCallback
    );
}

/**
 * Constructs inline install URL for Chrome desktop streaming extension.
 * The 'chromeExtensionId' must be defined in options parameter.
 * @param options supports "desktopSharingChromeExtId" and "chromeExtensionId"
 * @returns {string}
 */
function getWebStoreInstallUrl(options)
{
    //TODO remove chromeExtensionId (deprecated)
    return "https://chrome.google.com/webstore/detail/" +
        (options.desktopSharingChromeExtId || options.chromeExtensionId);
}

/**
 * Checks whether an update of the Chrome extension is required.
 * @param minVersion minimal required version
 * @param extVersion current extension version
 * @returns {boolean}
 */
function isUpdateRequired(minVersion, extVersion) {
    try {
        var s1 = minVersion.split('.');
        var s2 = extVersion.split('.');

        var len = Math.max(s1.length, s2.length);
        for (var i = 0; i < len; i++) {
            var n1 = 0,
                n2 = 0;

            if (i < s1.length)
                n1 = parseInt(s1[i]);
            if (i < s2.length)
                n2 = parseInt(s2[i]);

            if (isNaN(n1) || isNaN(n2)) {
                return true;
            } else if (n1 !== n2) {
                return n1 > n2;
            }
        }

        // will happen if both versions have identical numbers in
        // their components (even if one of them is longer, has more components)
        return false;
    }
    catch (e) {
        logger.error("Failed to parse extension version", e);
        return true;
    }
}

function checkChromeExtInstalled(callback, options) {
    if (!chrome || !chrome.runtime) {
        // No API, so no extension for sure
        callback(false, false);
        return;
    }
    chrome.runtime.sendMessage(
        //TODO: remove chromeExtensionId (deprecated)
        (options.desktopSharingChromeExtId || options.chromeExtensionId),
        { getVersion: true },
        function (response) {
            if (!response || !response.version) {
                // Communication failure - assume that no endpoint exists
                logger.warn(
                    "Extension not installed?: ", chrome.runtime.lastError);
                callback(false, false);
                return;
            }
            // Check installed extension version
            var extVersion = response.version;
            logger.log('Extension version is: ' + extVersion);
            //TODO: remove minChromeExtVersion (deprecated)
            var updateRequired
                = isUpdateRequired(
                    (options.desktopSharingChromeMinExtVersion ||
                        options.minChromeExtVersion),
                    extVersion);
            callback(!updateRequired, updateRequired);
        }
    );
}

function doGetStreamFromExtension(options, streamCallback, failCallback) {
    // Sends 'getStream' msg to the extension.
    // Extension id must be defined in the config.
    chrome.runtime.sendMessage(
        //TODO: remove chromeExtensionId (deprecated)
        (options.desktopSharingChromeExtId || options.chromeExtensionId),
        {
            getStream: true,
            //TODO: remove desktopSharingSources (deprecated).
            sources: (options.desktopSharingChromeSources ||
                options.desktopSharingSources)
        },
        function (response) {
            if (!response) {
                failCallback(chrome.runtime.lastError);
                return;
            }
            logger.log("Response from extension: " + response);
            if (response.streamId) {
                GUM(
                    ['desktop'],
                    function (stream) {
                        streamCallback(stream);
                    },
                    failCallback,
                    {desktopStream: response.streamId});
            } else {
                failCallback("Extension failed to get the stream");
            }
        }
    );
}

/**
 * Initializes <link rel=chrome-webstore-item /> with extension id set in
 * config.js to support inline installs. Host site must be selected as main
 * website of published extension.
 * @param options supports "desktopSharingChromeExtId" and "chromeExtensionId"
 */
function initInlineInstalls(options)
{
    $("link[rel=chrome-webstore-item]").attr("href",
        getWebStoreInstallUrl(options));
}

function initChromeExtension(options) {
    // Initialize Chrome extension inline installs
    initInlineInstalls(options);
    // Check if extension is installed
    checkChromeExtInstalled(function (installed, updateRequired) {
        chromeExtInstalled = installed;
        chromeExtUpdateRequired = updateRequired;
        logger.info(
            "Chrome extension installed: " + chromeExtInstalled +
            " updateRequired: " + chromeExtUpdateRequired);
    }, options);
}

/**
 * Starts the detection of an installed jidesha extension for firefox.
 * @param options supports "desktopSharingFirefoxDisabled",
 * "desktopSharingFirefoxExtId" and "chromeExtensionId"
 */
function initFirefoxExtensionDetection(options) {
    if (options.desktopSharingFirefoxDisabled) {
        return;
    }
    if (firefoxExtInstalled === false || firefoxExtInstalled === true)
        return;
    if (!options.desktopSharingFirefoxExtId) {
        firefoxExtInstalled = false;
        return;
    }

    var img = document.createElement('img');
    img.onload = function(){
        logger.log("Detected firefox screen sharing extension.");
        firefoxExtInstalled = true;
    };
    img.onerror = function(){
        logger.log("Detected lack of firefox screen sharing extension.");
        firefoxExtInstalled = false;
    };

    // The jidesha extension exposes an empty image file under the url:
    // "chrome://EXT_ID/content/DOMAIN.png"
    // Where EXT_ID is the ID of the extension with "@" replaced by ".", and
    // DOMAIN is a domain whitelisted by the extension.
    var src = "chrome://" +
        (options.desktopSharingFirefoxExtId.replace('@', '.')) +
        "/content/" + document.location.hostname + ".png";
    img.setAttribute('src', src);
}

module.exports = ScreenObtainer;

}).call(this,"/modules/RTC/ScreenObtainer.js")
},{"../../service/desktopsharing/DesktopSharingEventTypes":84,"./RTCBrowserType":17,"./adapter.screenshare":20,"jitsi-meet-logger":48}],20:[function(require,module,exports){
(function (__filename){
/*! adapterjs - v0.12.3 - 2015-11-16 */
var console = require("jitsi-meet-logger").getLogger(__filename);
// Adapter's interface.
var AdapterJS = AdapterJS || {};

// Browserify compatibility
if(typeof exports !== 'undefined') {
  module.exports = AdapterJS;
}

AdapterJS.options = AdapterJS.options || {};

// uncomment to get virtual webcams
// AdapterJS.options.getAllCams = true;

// uncomment to prevent the install prompt when the plugin in not yet installed
// AdapterJS.options.hidePluginInstallPrompt = true;

// AdapterJS version
AdapterJS.VERSION = '0.12.3';

// This function will be called when the WebRTC API is ready to be used
// Whether it is the native implementation (Chrome, Firefox, Opera) or
// the plugin
// You may Override this function to synchronise the start of your application
// with the WebRTC API being ready.
// If you decide not to override use this synchronisation, it may result in
// an extensive CPU usage on the plugin start (once per tab loaded)
// Params:
//    - isUsingPlugin: true is the WebRTC plugin is being used, false otherwise
//
AdapterJS.onwebrtcready = AdapterJS.onwebrtcready || function(isUsingPlugin) {
  // The WebRTC API is ready.
  // Override me and do whatever you want here
};

// Sets a callback function to be called when the WebRTC interface is ready.
// The first argument is the function to callback.\
// Throws an error if the first argument is not a function
AdapterJS.webRTCReady = function (callback) {
  if (typeof callback !== 'function') {
    throw new Error('Callback provided is not a function');
  }

  if (true === AdapterJS.onwebrtcreadyDone) {
    // All WebRTC interfaces are ready, just call the callback
    callback(null !== AdapterJS.WebRTCPlugin.plugin);
  } else {
    // will be triggered automatically when your browser/plugin is ready.
    AdapterJS.onwebrtcready = callback;
  }
};

// Plugin namespace
AdapterJS.WebRTCPlugin = AdapterJS.WebRTCPlugin || {};

// The object to store plugin information
AdapterJS.WebRTCPlugin.pluginInfo = {
  prefix : 'Tem',
  plugName : 'TemWebRTCPlugin',
  pluginId : 'plugin0',
  type : 'application/x-temwebrtcplugin',
  onload : '__TemWebRTCReady0',
  portalLink : 'http://skylink.io/plugin/',
  downloadLink : null, //set below
  companyName: 'Temasys'
};
if(!!navigator.platform.match(/^Mac/i)) {
  AdapterJS.WebRTCPlugin.pluginInfo.downloadLink = 'http://bit.ly/1n77hco';
}
else if(!!navigator.platform.match(/^Win/i)) {
  AdapterJS.WebRTCPlugin.pluginInfo.downloadLink = 'http://bit.ly/1kkS4FN';
}

AdapterJS.WebRTCPlugin.TAGS = {
  NONE  : 'none',
  AUDIO : 'audio',
  VIDEO : 'video'
};

// Unique identifier of each opened page
AdapterJS.WebRTCPlugin.pageId = Math.random().toString(36).slice(2);

// Use this whenever you want to call the plugin.
AdapterJS.WebRTCPlugin.plugin = null;

// Set log level for the plugin once it is ready.
// The different values are
// This is an asynchronous function that will run when the plugin is ready
AdapterJS.WebRTCPlugin.setLogLevel = null;

// Defines webrtc's JS interface according to the plugin's implementation.
// Define plugin Browsers as WebRTC Interface.
AdapterJS.WebRTCPlugin.defineWebRTCInterface = null;

// This function detects whether or not a plugin is installed.
// Checks if Not IE (firefox, for example), else if it's IE,
// we're running IE and do something. If not it is not supported.
AdapterJS.WebRTCPlugin.isPluginInstalled = null;

 // Lets adapter.js wait until the the document is ready before injecting the plugin
AdapterJS.WebRTCPlugin.pluginInjectionInterval = null;

// Inject the HTML DOM object element into the page.
AdapterJS.WebRTCPlugin.injectPlugin = null;

// States of readiness that the plugin goes through when
// being injected and stated
AdapterJS.WebRTCPlugin.PLUGIN_STATES = {
  NONE : 0,           // no plugin use
  INITIALIZING : 1,   // Detected need for plugin
  INJECTING : 2,      // Injecting plugin
  INJECTED: 3,        // Plugin element injected but not usable yet
  READY: 4            // Plugin ready to be used
};

// Current state of the plugin. You cannot use the plugin before this is
// equal to AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY
AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.NONE;

// True is AdapterJS.onwebrtcready was already called, false otherwise
// Used to make sure AdapterJS.onwebrtcready is only called once
AdapterJS.onwebrtcreadyDone = false;

// Log levels for the plugin.
// To be set by calling AdapterJS.WebRTCPlugin.setLogLevel
/*
Log outputs are prefixed in some cases.
  INFO: Information reported by the plugin.
  ERROR: Errors originating from within the plugin.
  WEBRTC: Error originating from within the libWebRTC library
*/
// From the least verbose to the most verbose
AdapterJS.WebRTCPlugin.PLUGIN_LOG_LEVELS = {
  NONE : 'NONE',
  ERROR : 'ERROR',
  WARNING : 'WARNING',
  INFO: 'INFO',
  VERBOSE: 'VERBOSE',
  SENSITIVE: 'SENSITIVE'
};

// Does a waiting check before proceeding to load the plugin.
AdapterJS.WebRTCPlugin.WaitForPluginReady = null;

// This methid will use an interval to wait for the plugin to be ready.
AdapterJS.WebRTCPlugin.callWhenPluginReady = null;

// !!!! WARNING: DO NOT OVERRIDE THIS FUNCTION. !!!
// This function will be called when plugin is ready. It sends necessary
// details to the plugin.
// The function will wait for the document to be ready and the set the
// plugin state to AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY,
// indicating that it can start being requested.
// This function is not in the IE/Safari condition brackets so that
// TemPluginLoaded function might be called on Chrome/Firefox.
// This function is the only private function that is not encapsulated to
// allow the plugin method to be called.
__TemWebRTCReady0 = function () {
  if (document.readyState === 'complete') {
    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;

    AdapterJS.maybeThroughWebRTCReady();
  } else {
    AdapterJS.WebRTCPlugin.documentReadyInterval = setInterval(function () {
      if (document.readyState === 'complete') {
        // TODO: update comments, we wait for the document to be ready
        clearInterval(AdapterJS.WebRTCPlugin.documentReadyInterval);
        AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY;

        AdapterJS.maybeThroughWebRTCReady();
      }
    }, 100);
  }
};

AdapterJS.maybeThroughWebRTCReady = function() {
  if (!AdapterJS.onwebrtcreadyDone) {
    AdapterJS.onwebrtcreadyDone = true;

    if (typeof(AdapterJS.onwebrtcready) === 'function') {
      AdapterJS.onwebrtcready(AdapterJS.WebRTCPlugin.plugin !== null);
    }
  }
};

// Text namespace
AdapterJS.TEXT = {
  PLUGIN: {
    REQUIRE_INSTALLATION: 'This website requires you to install a WebRTC-enabling plugin ' +
      'to work on this browser.',
    NOT_SUPPORTED: 'Your browser does not support WebRTC.',
    BUTTON: 'Install Now'
  },
  REFRESH: {
    REQUIRE_REFRESH: 'Please refresh page',
    BUTTON: 'Refresh Page'
  }
};

// The result of ice connection states.
// - starting: Ice connection is starting.
// - checking: Ice connection is checking.
// - connected Ice connection is connected.
// - completed Ice connection is connected.
// - done Ice connection has been completed.
// - disconnected Ice connection has been disconnected.
// - failed Ice connection has failed.
// - closed Ice connection is closed.
AdapterJS._iceConnectionStates = {
  starting : 'starting',
  checking : 'checking',
  connected : 'connected',
  completed : 'connected',
  done : 'completed',
  disconnected : 'disconnected',
  failed : 'failed',
  closed : 'closed'
};

//The IceConnection states that has been fired for each peer.
AdapterJS._iceConnectionFiredStates = [];


// Check if WebRTC Interface is defined.
AdapterJS.isDefined = null;

// This function helps to retrieve the webrtc detected browser information.
// This sets:
// - webrtcDetectedBrowser: The browser agent name.
// - webrtcDetectedVersion: The browser version.
// - webrtcDetectedType: The types of webRTC support.
//   - 'moz': Mozilla implementation of webRTC.
//   - 'webkit': WebKit implementation of webRTC.
//   - 'plugin': Using the plugin implementation.
AdapterJS.parseWebrtcDetectedBrowser = function () {
  var hasMatch, checkMatch = navigator.userAgent.match(
    /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
  if (/trident/i.test(checkMatch[1])) {
    hasMatch = /\brv[ :]+(\d+)/g.exec(navigator.userAgent) || [];
    webrtcDetectedBrowser = 'IE';
    webrtcDetectedVersion = parseInt(hasMatch[1] || '0', 10);
  } else if (checkMatch[1] === 'Chrome') {
    hasMatch = navigator.userAgent.match(/\bOPR\/(\d+)/);
    if (hasMatch !== null) {
      webrtcDetectedBrowser = 'opera';
      webrtcDetectedVersion = parseInt(hasMatch[1], 10);
    }
  }
  if (navigator.userAgent.indexOf('Safari')) {
    if (typeof InstallTrigger !== 'undefined') {
      webrtcDetectedBrowser = 'firefox';
    } else if (/*@cc_on!@*/ false || !!document.documentMode) {
      webrtcDetectedBrowser = 'IE';
    } else if (
      Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0) {
      webrtcDetectedBrowser = 'safari';
    } else if (!!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0) {
      webrtcDetectedBrowser = 'opera';
    } else if (!!window.chrome) {
      webrtcDetectedBrowser = 'chrome';
    }
  }
  if (!webrtcDetectedBrowser) {
    webrtcDetectedVersion = checkMatch[1];
  }
  if (!webrtcDetectedVersion) {
    try {
      checkMatch = (checkMatch[2]) ? [checkMatch[1], checkMatch[2]] :
        [navigator.appName, navigator.appVersion, '-?'];
      if ((hasMatch = navigator.userAgent.match(/version\/(\d+)/i)) !== null) {
        checkMatch.splice(1, 1, hasMatch[1]);
      }
      webrtcDetectedVersion = parseInt(checkMatch[1], 10);
    } catch (error) { }
  }
};

// To fix configuration as some browsers does not support
// the 'urls' attribute.
AdapterJS.maybeFixConfiguration = function (pcConfig) {
  if (pcConfig === null) {
    return;
  }
  for (var i = 0; i < pcConfig.iceServers.length; i++) {
    if (pcConfig.iceServers[i].hasOwnProperty('urls')) {
      pcConfig.iceServers[i].url = pcConfig.iceServers[i].urls;
      delete pcConfig.iceServers[i].urls;
    }
  }
};

AdapterJS.addEvent = function(elem, evnt, func) {
  if (elem.addEventListener) { // W3C DOM
    elem.addEventListener(evnt, func, false);
  } else if (elem.attachEvent) {// OLD IE DOM
    elem.attachEvent('on'+evnt, func);
  } else { // No much to do
    elem[evnt] = func;
  }
};

AdapterJS.renderNotificationBar = function (text, buttonText, buttonLink, openNewTab, displayRefreshBar) {
  // only inject once the page is ready
  if (document.readyState !== 'complete') {
    return;
  }

  var w = window;
  var i = document.createElement('iframe');
  i.style.position = 'fixed';
  i.style.top = '-41px';
  i.style.left = 0;
  i.style.right = 0;
  i.style.width = '100%';
  i.style.height = '40px';
  i.style.backgroundColor = '#ffffe1';
  i.style.border = 'none';
  i.style.borderBottom = '1px solid #888888';
  i.style.zIndex = '9999999';
  if(typeof i.style.webkitTransition === 'string') {
    i.style.webkitTransition = 'all .5s ease-out';
  } else if(typeof i.style.transition === 'string') {
    i.style.transition = 'all .5s ease-out';
  }
  document.body.appendChild(i);
  c = (i.contentWindow) ? i.contentWindow :
    (i.contentDocument.document) ? i.contentDocument.document : i.contentDocument;
  c.document.open();
  c.document.write('<span style="display: inline-block; font-family: Helvetica, Arial,' +
    'sans-serif; font-size: .9rem; padding: 4px; vertical-align: ' +
    'middle; cursor: default;">' + text + '</span>');
  if(buttonText && buttonLink) {
    c.document.write('<button id="okay">' + buttonText + '</button><button id="cancel">Cancel</button>');
    c.document.close();

    // On click on okay
    AdapterJS.addEvent(c.document.getElementById('okay'), 'click', function(e) {
      if (!!displayRefreshBar) {
        AdapterJS.renderNotificationBar(AdapterJS.TEXT.EXTENSION ?
          AdapterJS.TEXT.EXTENSION.REQUIRE_REFRESH : AdapterJS.TEXT.REFRESH.REQUIRE_REFRESH,
          AdapterJS.TEXT.REFRESH.BUTTON, 'javascript:location.reload()');
      }
      window.open(buttonLink, !!openNewTab ? '_blank' : '_top');

      e.preventDefault();
      try {
        event.cancelBubble = true;
      } catch(error) { }

      var pluginInstallInterval = setInterval(function(){
        if(! isIE) {
          navigator.plugins.refresh(false);
        }
        AdapterJS.WebRTCPlugin.isPluginInstalled(
          AdapterJS.WebRTCPlugin.pluginInfo.prefix,
          AdapterJS.WebRTCPlugin.pluginInfo.plugName,
          function() { // plugin now installed
            clearInterval(pluginInstallInterval);
            AdapterJS.WebRTCPlugin.defineWebRTCInterface();
          },
          function() {
            // still no plugin detected, nothing to do
          });
      } , 500);
    });

    // On click on Cancel
    AdapterJS.addEvent(c.document.getElementById('cancel'), 'click', function(e) {
      w.document.body.removeChild(i);
    });
  } else {
    c.document.close();
  }
  setTimeout(function() {
    if(typeof i.style.webkitTransform === 'string') {
      i.style.webkitTransform = 'translateY(40px)';
    } else if(typeof i.style.transform === 'string') {
      i.style.transform = 'translateY(40px)';
    } else {
      i.style.top = '0px';
    }
  }, 300);
};

// -----------------------------------------------------------
// Detected webrtc implementation. Types are:
// - 'moz': Mozilla implementation of webRTC.
// - 'webkit': WebKit implementation of webRTC.
// - 'plugin': Using the plugin implementation.
webrtcDetectedType = null;

// Detected webrtc datachannel support. Types are:
// - 'SCTP': SCTP datachannel support.
// - 'RTP': RTP datachannel support.
webrtcDetectedDCSupport = null;

// Set the settings for creating DataChannels, MediaStream for
// Cross-browser compability.
// - This is only for SCTP based support browsers.
// the 'urls' attribute.
checkMediaDataChannelSettings =
  function (peerBrowserAgent, peerBrowserVersion, callback, constraints) {
  if (typeof callback !== 'function') {
    return;
  }
  var beOfferer = true;
  var isLocalFirefox = webrtcDetectedBrowser === 'firefox';
  // Nightly version does not require MozDontOfferDataChannel for interop
  var isLocalFirefoxInterop = webrtcDetectedType === 'moz' && webrtcDetectedVersion > 30;
  var isPeerFirefox = peerBrowserAgent === 'firefox';
  var isPeerFirefoxInterop = peerBrowserAgent === 'firefox' &&
    ((peerBrowserVersion) ? (peerBrowserVersion > 30) : false);

  // Resends an updated version of constraints for MozDataChannel to work
  // If other userAgent is firefox and user is firefox, remove MozDataChannel
  if ((isLocalFirefox && isPeerFirefox) || (isLocalFirefoxInterop)) {
    try {
      delete constraints.mandatory.MozDontOfferDataChannel;
    } catch (error) {
      console.error('Failed deleting MozDontOfferDataChannel');
      console.error(error);
    }
  } else if ((isLocalFirefox && !isPeerFirefox)) {
    constraints.mandatory.MozDontOfferDataChannel = true;
  }
  if (!isLocalFirefox) {
    // temporary measure to remove Moz* constraints in non Firefox browsers
    for (var prop in constraints.mandatory) {
      if (constraints.mandatory.hasOwnProperty(prop)) {
        if (prop.indexOf('Moz') !== -1) {
          delete constraints.mandatory[prop];
        }
      }
    }
  }
  // Firefox (not interopable) cannot offer DataChannel as it will cause problems to the
  // interopability of the media stream
  if (isLocalFirefox && !isPeerFirefox && !isLocalFirefoxInterop) {
    beOfferer = false;
  }
  callback(beOfferer, constraints);
};

// Handles the differences for all browsers ice connection state output.
// - Tested outcomes are:
//   - Chrome (offerer)  : 'checking' > 'completed' > 'completed'
//   - Chrome (answerer) : 'checking' > 'connected'
//   - Firefox (offerer) : 'checking' > 'connected'
//   - Firefox (answerer): 'checking' > 'connected'
checkIceConnectionState = function (peerId, iceConnectionState, callback) {
  if (typeof callback !== 'function') {
    console.warn('No callback specified in checkIceConnectionState. Aborted.');
    return;
  }
  peerId = (peerId) ? peerId : 'peer';

  if (!AdapterJS._iceConnectionFiredStates[peerId] ||
    iceConnectionState === AdapterJS._iceConnectionStates.disconnected ||
    iceConnectionState === AdapterJS._iceConnectionStates.failed ||
    iceConnectionState === AdapterJS._iceConnectionStates.closed) {
    AdapterJS._iceConnectionFiredStates[peerId] = [];
  }
  iceConnectionState = AdapterJS._iceConnectionStates[iceConnectionState];
  if (AdapterJS._iceConnectionFiredStates[peerId].indexOf(iceConnectionState) < 0) {
    AdapterJS._iceConnectionFiredStates[peerId].push(iceConnectionState);
    if (iceConnectionState === AdapterJS._iceConnectionStates.connected) {
      setTimeout(function () {
        AdapterJS._iceConnectionFiredStates[peerId]
          .push(AdapterJS._iceConnectionStates.done);
        callback(AdapterJS._iceConnectionStates.done);
      }, 1000);
    }
    callback(iceConnectionState);
  }
  return;
};

// Firefox:
// - Creates iceServer from the url for Firefox.
// - Create iceServer with stun url.
// - Create iceServer with turn url.
//   - Ignore the transport parameter from TURN url for FF version <=27.
//   - Return null for createIceServer if transport=tcp.
// - FF 27 and above supports transport parameters in TURN url,
// - So passing in the full url to create iceServer.
// Chrome:
// - Creates iceServer from the url for Chrome M33 and earlier.
//   - Create iceServer with stun url.
//   - Chrome M28 & above uses below TURN format.
// Plugin:
// - Creates Ice Server for Plugin Browsers
//   - If Stun - Create iceServer with stun url.
//   - Else - Create iceServer with turn url
//   - This is a WebRTC Function
createIceServer = null;

// Firefox:
// - Creates IceServers for Firefox
//   - Use .url for FireFox.
//   - Multiple Urls support
// Chrome:
// - Creates iceServers from the urls for Chrome M34 and above.
//   - .urls is supported since Chrome M34.
//   - Multiple Urls support
// Plugin:
// - Creates Ice Servers for Plugin Browsers
//   - Multiple Urls support
//   - This is a WebRTC Function
createIceServers = null;
//------------------------------------------------------------

//The RTCPeerConnection object.
RTCPeerConnection = null;

// Creates RTCSessionDescription object for Plugin Browsers
RTCSessionDescription = (typeof RTCSessionDescription === 'function') ?
  RTCSessionDescription : null;

// Creates RTCIceCandidate object for Plugin Browsers
RTCIceCandidate = (typeof RTCIceCandidate === 'function') ?
  RTCIceCandidate : null;

// Get UserMedia (only difference is the prefix).
// Code from Adam Barth.
getUserMedia = null;

// Attach a media stream to an element.
attachMediaStream = null;

// Re-attach a media stream to an element.
reattachMediaStream = null;


// Detected browser agent name. Types are:
// - 'firefox': Firefox browser.
// - 'chrome': Chrome browser.
// - 'opera': Opera browser.
// - 'safari': Safari browser.
// - 'IE' - Internet Explorer browser.
webrtcDetectedBrowser = null;

// Detected browser version.
webrtcDetectedVersion = null;

// Check for browser types and react accordingly
if (navigator.mozGetUserMedia) {
  webrtcDetectedBrowser = 'firefox';
  webrtcDetectedVersion = parseInt(navigator
    .userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
  webrtcDetectedType = 'moz';
  webrtcDetectedDCSupport = 'SCTP';

  RTCPeerConnection = function (pcConfig, pcConstraints) {
    AdapterJS.maybeFixConfiguration(pcConfig);
    return new mozRTCPeerConnection(pcConfig, pcConstraints);
  };

 // The RTCSessionDescription object.
  RTCSessionDescription = mozRTCSessionDescription;
  window.RTCSessionDescription = RTCSessionDescription;

  // The RTCIceCandidate object.
  RTCIceCandidate = mozRTCIceCandidate;
  window.RTCIceCandidate = RTCIceCandidate;

  window.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
  navigator.getUserMedia = window.getUserMedia;

  // Shim for MediaStreamTrack.getSources.
  MediaStreamTrack.getSources = function(successCb) {
    setTimeout(function() {
      var infos = [
        { kind: 'audio', id: 'default', label:'', facing:'' },
        { kind: 'video', id: 'default', label:'', facing:'' }
      ];
      successCb(infos);
    }, 0);
  };

  createIceServer = function (url, username, password) {
    var iceServer = null;
    var url_parts = url.split(':');
    if (url_parts[0].indexOf('stun') === 0) {
      iceServer = { url : url };
    } else if (url_parts[0].indexOf('turn') === 0) {
      if (webrtcDetectedVersion < 27) {
        var turn_url_parts = url.split('?');
        if (turn_url_parts.length === 1 ||
          turn_url_parts[1].indexOf('transport=udp') === 0) {
          iceServer = {
            url : turn_url_parts[0],
            credential : password,
            username : username
          };
        }
      } else {
        iceServer = {
          url : url,
          credential : password,
          username : username
        };
      }
    }
    return iceServer;
  };

  createIceServers = function (urls, username, password) {
    var iceServers = [];
    for (var i = 0; i < urls.length; i++) {
      var iceServer = createIceServer(urls[i], username, password);
      if (iceServer !== null) {
        iceServers.push(iceServer);
      }
    }
    return iceServers;
  };

  attachMediaStream = function (element, stream) {
    element.mozSrcObject = stream;
    if (stream !== null)
      element.play();

    return element;
  };

  reattachMediaStream = function (to, from) {
    to.mozSrcObject = from.mozSrcObject;
    to.play();
    return to;
  };

  MediaStreamTrack.getSources = MediaStreamTrack.getSources || function (callback) {
    if (!callback) {
      throw new TypeError('Failed to execute \'getSources\' on \'MediaStreamTrack\'' +
        ': 1 argument required, but only 0 present.');
    }
    return callback([]);
  };

  // Fake get{Video,Audio}Tracks
  if (!MediaStream.prototype.getVideoTracks) {
    MediaStream.prototype.getVideoTracks = function () {
      return [];
    };
  }
  if (!MediaStream.prototype.getAudioTracks) {
    MediaStream.prototype.getAudioTracks = function () {
      return [];
    };
  }

  AdapterJS.maybeThroughWebRTCReady();
} else if (navigator.webkitGetUserMedia) {
  webrtcDetectedBrowser = 'chrome';
  webrtcDetectedType = 'webkit';
  webrtcDetectedVersion = parseInt(navigator
    .userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10);
  // check if browser is opera 20+
  var checkIfOpera = navigator.userAgent.match(/\bOPR\/(\d+)/);
  if (checkIfOpera !== null) {
    webrtcDetectedBrowser = 'opera';
    webrtcDetectedVersion = parseInt(checkIfOpera[1], 10);
  }
  // check browser datachannel support
  if ((webrtcDetectedBrowser === 'chrome' && webrtcDetectedVersion >= 31) ||
    (webrtcDetectedBrowser === 'opera' && webrtcDetectedVersion >= 20)) {
    webrtcDetectedDCSupport = 'SCTP';
  } else if (webrtcDetectedBrowser === 'chrome' && webrtcDetectedVersion < 30 &&
    webrtcDetectedVersion > 24) {
    webrtcDetectedDCSupport = 'RTP';
  } else {
    webrtcDetectedDCSupport = '';
  }

  createIceServer = function (url, username, password) {
    var iceServer = null;
    var url_parts = url.split(':');
    if (url_parts[0].indexOf('stun') === 0) {
      iceServer = { 'url' : url };
    } else if (url_parts[0].indexOf('turn') === 0) {
      iceServer = {
        'url' : url,
        'credential' : password,
        'username' : username
      };
    }
    return iceServer;
  };

  createIceServers = function (urls, username, password) {
    var iceServers = [];
    if (webrtcDetectedVersion >= 34) {
      iceServers = {
        'urls' : urls,
        'credential' : password,
        'username' : username
      };
    } else {
      for (var i = 0; i < urls.length; i++) {
        var iceServer = createIceServer(urls[i], username, password);
        if (iceServer !== null) {
          iceServers.push(iceServer);
        }
      }
    }
    return iceServers;
  };

  RTCPeerConnection = function (pcConfig, pcConstraints) {
    if (webrtcDetectedVersion < 34) {
      AdapterJS.maybeFixConfiguration(pcConfig);
    }
    return new webkitRTCPeerConnection(pcConfig, pcConstraints);
  };

  window.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
  navigator.getUserMedia = window.getUserMedia;

  attachMediaStream = function (element, stream) {
    if (typeof element.srcObject !== 'undefined') {
      element.srcObject = stream;
    } else if (typeof element.mozSrcObject !== 'undefined') {
      element.mozSrcObject = stream;
    } else if (typeof element.src !== 'undefined') {
      element.src = (stream === null ? '' : URL.createObjectURL(stream));
    } else {
      console.log('Error attaching stream to element.');
    }
    return element;
  };

  reattachMediaStream = function (to, from) {
    to.src = from.src;
    return to;
  };

  AdapterJS.maybeThroughWebRTCReady();
} else if (navigator.mediaDevices && navigator.userAgent.match(
    /Edge\/(\d+).(\d+)$/)) {
  webrtcDetectedBrowser = 'edge';

  webrtcDetectedVersion =
    parseInt(navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)[2], 10);

  // the minimum version still supported by adapter.
  webrtcMinimumVersion = 12;

  window.getUserMedia = navigator.getUserMedia.bind(navigator);

  attachMediaStream = function(element, stream) {
    element.srcObject = stream;
    return element;
  };
  reattachMediaStream = function(to, from) {
    to.srcObject = from.srcObject;
    return to;
  };

  AdapterJS.maybeThroughWebRTCReady();
} else { // TRY TO USE PLUGIN
  // IE 9 is not offering an implementation of console.log until you open a console
  if (typeof console !== 'object' || typeof console.log !== 'function') {
    /* jshint -W020 */
    console = {} || console;
    // Implemented based on console specs from MDN
    // You may override these functions
    console.log = function (arg) {};
    console.info = function (arg) {};
    console.error = function (arg) {};
    console.dir = function (arg) {};
    console.exception = function (arg) {};
    console.trace = function (arg) {};
    console.warn = function (arg) {};
    console.count = function (arg) {};
    console.debug = function (arg) {};
    console.count = function (arg) {};
    console.time = function (arg) {};
    console.timeEnd = function (arg) {};
    console.group = function (arg) {};
    console.groupCollapsed = function (arg) {};
    console.groupEnd = function (arg) {};
    /* jshint +W020 */
  }
  webrtcDetectedType = 'plugin';
  webrtcDetectedDCSupport = 'plugin';
  AdapterJS.parseWebrtcDetectedBrowser();
  isIE = webrtcDetectedBrowser === 'IE';

  /* jshint -W035 */
  AdapterJS.WebRTCPlugin.WaitForPluginReady = function() {
    while (AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      /* empty because it needs to prevent the function from running. */
    }
  };
  /* jshint +W035 */

  AdapterJS.WebRTCPlugin.callWhenPluginReady = function (callback) {
    if (AdapterJS.WebRTCPlugin.pluginState === AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      // Call immediately if possible
      // Once the plugin is set, the code will always take this path
      callback();
    } else {
      // otherwise start a 100ms interval
      var checkPluginReadyState = setInterval(function () {
        if (AdapterJS.WebRTCPlugin.pluginState === AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
          clearInterval(checkPluginReadyState);
          callback();
        }
      }, 100);
    }
  };

  AdapterJS.WebRTCPlugin.setLogLevel = function(logLevel) {
    AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
      AdapterJS.WebRTCPlugin.plugin.setLogLevel(logLevel);
    });
  };

  AdapterJS.WebRTCPlugin.injectPlugin = function () {
    // only inject once the page is ready
    if (document.readyState !== 'complete') {
      return;
    }

    // Prevent multiple injections
    if (AdapterJS.WebRTCPlugin.pluginState !== AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING) {
      return;
    }

    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTING;

    if (webrtcDetectedBrowser === 'IE' && webrtcDetectedVersion <= 10) {
      var frag = document.createDocumentFragment();
      AdapterJS.WebRTCPlugin.plugin = document.createElement('div');
      AdapterJS.WebRTCPlugin.plugin.innerHTML = '<object id="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '" type="' +
        AdapterJS.WebRTCPlugin.pluginInfo.type + '" ' + 'width="1" height="1">' +
        '<param name="pluginId" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '" /> ' +
        '<param name="windowless" value="false" /> ' +
        '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '" /> ' +
        '<param name="onload" value="' + AdapterJS.WebRTCPlugin.pluginInfo.onload + '" />' +
        '<param name="tag" value="' + AdapterJS.WebRTCPlugin.TAGS.NONE + '" />' +
        // uncomment to be able to use virtual cams
        (AdapterJS.options.getAllCams ? '<param name="forceGetAllCams" value="True" />':'') +

        '</object>';
      while (AdapterJS.WebRTCPlugin.plugin.firstChild) {
        frag.appendChild(AdapterJS.WebRTCPlugin.plugin.firstChild);
      }
      document.body.appendChild(frag);

      // Need to re-fetch the plugin
      AdapterJS.WebRTCPlugin.plugin =
        document.getElementById(AdapterJS.WebRTCPlugin.pluginInfo.pluginId);
    } else {
      // Load Plugin
      AdapterJS.WebRTCPlugin.plugin = document.createElement('object');
      AdapterJS.WebRTCPlugin.plugin.id =
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId;
      // IE will only start the plugin if it's ACTUALLY visible
      if (isIE) {
        AdapterJS.WebRTCPlugin.plugin.width = '1px';
        AdapterJS.WebRTCPlugin.plugin.height = '1px';
      } else { // The size of the plugin on Safari should be 0x0px
              // so that the autorisation prompt is at the top
        AdapterJS.WebRTCPlugin.plugin.width = '0px';
        AdapterJS.WebRTCPlugin.plugin.height = '0px';
      }
      AdapterJS.WebRTCPlugin.plugin.type = AdapterJS.WebRTCPlugin.pluginInfo.type;
      AdapterJS.WebRTCPlugin.plugin.innerHTML = '<param name="onload" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.onload + '">' +
        '<param name="pluginId" value="' +
        AdapterJS.WebRTCPlugin.pluginInfo.pluginId + '">' +
        '<param name="windowless" value="false" /> ' +
        (AdapterJS.options.getAllCams ? '<param name="forceGetAllCams" value="True" />':'') +
        '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '">' +
        '<param name="tag" value="' + AdapterJS.WebRTCPlugin.TAGS.NONE + '" />';
      document.body.appendChild(AdapterJS.WebRTCPlugin.plugin);
    }


    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INJECTED;
  };

  AdapterJS.WebRTCPlugin.isPluginInstalled =
    function (comName, plugName, installedCb, notInstalledCb) {
    if (!isIE) {
      var pluginArray = navigator.plugins;
      for (var i = 0; i < pluginArray.length; i++) {
        if (pluginArray[i].name.indexOf(plugName) >= 0) {
          installedCb();
          return;
        }
      }
      notInstalledCb();
    } else {
      try {
        var axo = new ActiveXObject(comName + '.' + plugName);
      } catch (e) {
        notInstalledCb();
        return;
      }
      installedCb();
    }
  };

  AdapterJS.WebRTCPlugin.defineWebRTCInterface = function () {
    if (AdapterJS.WebRTCPlugin.pluginState ===
        AdapterJS.WebRTCPlugin.PLUGIN_STATES.READY) {
      console.error("AdapterJS - WebRTC interface has already been defined");
      return;
    }

    AdapterJS.WebRTCPlugin.pluginState = AdapterJS.WebRTCPlugin.PLUGIN_STATES.INITIALIZING;

    AdapterJS.isDefined = function (variable) {
      return variable !== null && variable !== undefined;
    };

    createIceServer = function (url, username, password) {
      var iceServer = null;
      var url_parts = url.split(':');
      if (url_parts[0].indexOf('stun') === 0) {
        iceServer = {
          'url' : url,
          'hasCredentials' : false
        };
      } else if (url_parts[0].indexOf('turn') === 0) {
        iceServer = {
          'url' : url,
          'hasCredentials' : true,
          'credential' : password,
          'username' : username
        };
      }
      return iceServer;
    };

    createIceServers = function (urls, username, password) {
      var iceServers = [];
      for (var i = 0; i < urls.length; ++i) {
        iceServers.push(createIceServer(urls[i], username, password));
      }
      return iceServers;
    };

    RTCSessionDescription = function (info) {
      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.
        ConstructSessionDescription(info.type, info.sdp);
    };

    RTCPeerConnection = function (servers, constraints) {
      var iceServers = null;
      if (servers) {
        iceServers = servers.iceServers;
        for (var i = 0; i < iceServers.length; i++) {
          if (iceServers[i].urls && !iceServers[i].url) {
            iceServers[i].url = iceServers[i].urls;
          }
          iceServers[i].hasCredentials = AdapterJS.
            isDefined(iceServers[i].username) &&
            AdapterJS.isDefined(iceServers[i].credential);
        }
      }
      var mandatory = (constraints && constraints.mandatory) ?
        constraints.mandatory : null;
      var optional = (constraints && constraints.optional) ?
        constraints.optional : null;

      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.
        PeerConnection(AdapterJS.WebRTCPlugin.pageId,
        iceServers, mandatory, optional);
    };

    MediaStreamTrack = {};
    MediaStreamTrack.getSources = function (callback) {
      AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
        AdapterJS.WebRTCPlugin.plugin.GetSources(callback);
      });
    };

    window.getUserMedia = function (constraints, successCallback, failureCallback) {
      constraints.audio = constraints.audio || false;
      constraints.video = constraints.video || false;

      AdapterJS.WebRTCPlugin.callWhenPluginReady(function() {
        AdapterJS.WebRTCPlugin.plugin.
          getUserMedia(constraints, successCallback, failureCallback);
      });
    };
    window.navigator.getUserMedia = window.getUserMedia;

    attachMediaStream = function (element, stream) {
      if (!element || !element.parentNode) {
        return;
      }

      var streamId;
      if (stream === null) {
        streamId = '';
      } else {
        if (typeof stream.enableSoundTracks !== 'undefined') {
          stream.enableSoundTracks(true);
        }
        streamId = stream.id;
      }

      var elementId = element.id.length === 0 ? Math.random().toString(36).slice(2) : element.id;
      var nodeName = element.nodeName.toLowerCase();
      if (nodeName !== 'object') { // not a plugin <object> tag yet
        var tag;
        switch(nodeName) {
          case 'audio':
            tag = AdapterJS.WebRTCPlugin.TAGS.AUDIO;
            break;
          case 'video':
            tag = AdapterJS.WebRTCPlugin.TAGS.VIDEO;
            break;
          default:
            tag = AdapterJS.WebRTCPlugin.TAGS.NONE;
          }

        var frag = document.createDocumentFragment();
        var temp = document.createElement('div');
        var classHTML = '';
        if (element.className) {
          classHTML = 'class="' + element.className + '" ';
        } else if (element.attributes && element.attributes['class']) {
          classHTML = 'class="' + element.attributes['class'].value + '" ';
        }

        temp.innerHTML = '<object id="' + elementId + '" ' + classHTML +
          'type="' + AdapterJS.WebRTCPlugin.pluginInfo.type + '">' +
          '<param name="pluginId" value="' + elementId + '" /> ' +
          '<param name="pageId" value="' + AdapterJS.WebRTCPlugin.pageId + '" /> ' +
          '<param name="windowless" value="true" /> ' +
          '<param name="streamId" value="' + streamId + '" /> ' +
          '<param name="tag" value="' + tag + '" /> ' +
          '</object>';
        while (temp.firstChild) {
          frag.appendChild(temp.firstChild);
        }

        var height = '';
        var width = '';
        if (element.clientWidth || element.clientHeight) {
          width = element.clientWidth;
          height = element.clientHeight;
        }
        else if (element.width || element.height) {
          width = element.width;
          height = element.height;
        }

        element.parentNode.insertBefore(frag, element);
        frag = document.getElementById(elementId);
        frag.width = width;
        frag.height = height;
        element.parentNode.removeChild(element);
      } else { // already an <object> tag, just change the stream id
        var children = element.children;
        for (var i = 0; i !== children.length; ++i) {
          if (children[i].name === 'streamId') {
            children[i].value = streamId;
            break;
          }
        }
        element.setStreamId(streamId);
      }
      var newElement = document.getElementById(elementId);
      AdapterJS.forwardEventHandlers(newElement, element, Object.getPrototypeOf(element));

      return newElement;
    };

    reattachMediaStream = function (to, from) {
      var stream = null;
      var children = from.children;
      for (var i = 0; i !== children.length; ++i) {
        if (children[i].name === 'streamId') {
          AdapterJS.WebRTCPlugin.WaitForPluginReady();
          stream = AdapterJS.WebRTCPlugin.plugin
            .getStreamWithId(AdapterJS.WebRTCPlugin.pageId, children[i].value);
          break;
        }
      }
      if (stream !== null) {
        return attachMediaStream(to, stream);
      } else {
        console.log('Could not find the stream associated with this element');
      }
    };

    AdapterJS.forwardEventHandlers = function (destElem, srcElem, prototype) {

      properties = Object.getOwnPropertyNames( prototype );

      for(prop in properties) {
        propName = properties[prop];

        if (typeof(propName.slice) === 'function') {
          if (propName.slice(0,2) == 'on' && srcElem[propName] != null) {
            if (isIE) {
              destElem.attachEvent(propName,srcElem[propName]);
            } else {
              destElem.addEventListener(propName.slice(2), srcElem[propName], false)
            }
          } else {
            //TODO (http://jira.temasys.com.sg/browse/TWP-328) Forward non-event properties ?
          }
        }
      }

      var subPrototype = Object.getPrototypeOf(prototype)
      if(subPrototype != null) {
        AdapterJS.forwardEventHandlers(destElem, srcElem, subPrototype);
      }
    }

    RTCIceCandidate = function (candidate) {
      if (!candidate.sdpMid) {
        candidate.sdpMid = '';
      }

      AdapterJS.WebRTCPlugin.WaitForPluginReady();
      return AdapterJS.WebRTCPlugin.plugin.ConstructIceCandidate(
        candidate.sdpMid, candidate.sdpMLineIndex, candidate.candidate
      );
    };

    // inject plugin
    AdapterJS.addEvent(document, 'readystatechange', AdapterJS.WebRTCPlugin.injectPlugin);
    AdapterJS.WebRTCPlugin.injectPlugin();
  };

  // This function will be called if the plugin is needed (browser different
  // from Chrome or Firefox), but the plugin is not installed.
  AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb = AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb ||
    function() {
      AdapterJS.addEvent(document,
                        'readystatechange',
                         AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv);
      AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv();
    };

  AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCbPriv = function () {
    if (AdapterJS.options.hidePluginInstallPrompt) {
      return;
    }

    var downloadLink = AdapterJS.WebRTCPlugin.pluginInfo.downloadLink;
    if(downloadLink) { // if download link
      var popupString;
      if (AdapterJS.WebRTCPlugin.pluginInfo.portalLink) { // is portal link
       popupString = 'This website requires you to install the ' +
        ' <a href="' + AdapterJS.WebRTCPlugin.pluginInfo.portalLink +
        '" target="_blank">' + AdapterJS.WebRTCPlugin.pluginInfo.companyName +
        ' WebRTC Plugin</a>' +
        ' to work on this browser.';
      } else { // no portal link, just print a generic explanation
       popupString = AdapterJS.TEXT.PLUGIN.REQUIRE_INSTALLATION;
      }

      AdapterJS.renderNotificationBar(popupString, AdapterJS.TEXT.PLUGIN.BUTTON, downloadLink);
    } else { // no download link, just print a generic explanation
      AdapterJS.renderNotificationBar(AdapterJS.TEXT.PLUGIN.NOT_SUPPORTED);
    }
  };

  // Try to detect the plugin and act accordingly
  AdapterJS.WebRTCPlugin.isPluginInstalled(
    AdapterJS.WebRTCPlugin.pluginInfo.prefix,
    AdapterJS.WebRTCPlugin.pluginInfo.plugName,
    AdapterJS.WebRTCPlugin.defineWebRTCInterface,
    AdapterJS.WebRTCPlugin.pluginNeededButNotInstalledCb);
}

}).call(this,"/modules/RTC/adapter.screenshare.js")
},{"jitsi-meet-logger":48}],21:[function(require,module,exports){
(function (__filename){

var logger = require("jitsi-meet-logger").getLogger(__filename);
function supportsLocalStorage() {
    try {
        return 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
        logger.log("localstorage is not supported");
        return false;
    }
}


function generateUniqueId() {
    function _p8() {
        return (Math.random().toString(16) + "000000000").substr(2, 8);
    }
    return _p8() + _p8() + _p8() + _p8();
}

function Settings(conferenceID) {
    this.displayName = '';
    this.userId;
    this.confSettings = null;
    this.conferenceID = conferenceID;
    if (supportsLocalStorage()) {
        if(!window.localStorage.getItem(conferenceID))
            this.confSettings = {};
        else
            this.confSettings = JSON.parse(window.localStorage.getItem(conferenceID));
        if(!this.confSettings.jitsiMeetId) {
            this.confSettings.jitsiMeetId = generateUniqueId();
            logger.log("generated id",
                this.confSettings.jitsiMeetId);
            this.save();
        }
        this.userId = this.confSettings.jitsiMeetId || '';
        this.displayName = this.confSettings.displayname || '';
    } else {
        logger.log("local storage is not supported");
        this.userId = generateUniqueId();
    }
}

Settings.prototype.save = function () {
    if(!supportsLocalStorage())
        window.localStorage.setItem(this.conferenceID, JSON.stringify(this.confSettings));
}

Settings.prototype.setDisplayName = function (newDisplayName) {
    this.displayName = newDisplayName;
    if(this.confSettings != null)
        this.confSettings.displayname = displayName;
    this.save();
    return this.displayName;
},
Settings.prototype.getSettings = function () {
    return {
        displayName: this.displayName,
        uid: this.userId
    };
},

module.exports = Settings;

}).call(this,"/modules/settings/Settings.js")
},{"jitsi-meet-logger":48}],22:[function(require,module,exports){
/* global config */
/**
 * Provides statistics for the local stream.
 */

var RTCBrowserType = require('../RTC/RTCBrowserType');

/**
 * Size of the webaudio analyzer buffer.
 * @type {number}
 */
var WEBAUDIO_ANALYZER_FFT_SIZE = 2048;

/**
 * Value of the webaudio analyzer smoothing time parameter.
 * @type {number}
 */
var WEBAUDIO_ANALYZER_SMOOTING_TIME = 0.8;

/**
 * Converts time domain data array to audio level.
 * @param samples the time domain data array.
 * @returns {number} the audio level
 */
function timeDomainDataToAudioLevel(samples) {

    var maxVolume = 0;

    var length = samples.length;

    for (var i = 0; i < length; i++) {
        if (maxVolume < samples[i])
            maxVolume = samples[i];
    }

    return parseFloat(((maxVolume - 127) / 128).toFixed(3));
}

/**
 * Animates audio level change
 * @param newLevel the new audio level
 * @param lastLevel the last audio level
 * @returns {Number} the audio level to be set
 */
function animateLevel(newLevel, lastLevel) {
    var value = 0;
    var diff = lastLevel - newLevel;
    if(diff > 0.2) {
        value = lastLevel - 0.2;
    }
    else if(diff < -0.4) {
        value = lastLevel + 0.4;
    }
    else {
        value = newLevel;
    }

    return parseFloat(value.toFixed(3));
}


/**
 * <tt>LocalStatsCollector</tt> calculates statistics for the local stream.
 *
 * @param stream the local stream
 * @param interval stats refresh interval given in ms.
 * @param callback function that receives the audio levels.
 * @constructor
 */
function LocalStatsCollector(stream, interval, callback) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.stream = stream;
    this.intervalId = null;
    this.intervalMilis = interval;
    this.audioLevel = 0;
    this.callback = callback;
}

/**
 * Starts the collecting the statistics.
 */
LocalStatsCollector.prototype.start = function () {
    if (!window.AudioContext ||
        RTCBrowserType.isTemasysPluginUsed())
        return;

    var context = new AudioContext();
    var analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = WEBAUDIO_ANALYZER_SMOOTING_TIME;
    analyser.fftSize = WEBAUDIO_ANALYZER_FFT_SIZE;


    var source = context.createMediaStreamSource(this.stream);
    source.connect(analyser);


    var self = this;

    this.intervalId = setInterval(
        function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(array);
            var audioLevel = timeDomainDataToAudioLevel(array);
            if (audioLevel != self.audioLevel) {
                self.audioLevel = animateLevel(audioLevel, self.audioLevel);
                self.callback(self.audioLevel);
            }
        },
        this.intervalMilis
    );
};

/**
 * Stops collecting the statistics.
 */
LocalStatsCollector.prototype.stop = function () {
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
};

module.exports = LocalStatsCollector;

},{"../RTC/RTCBrowserType":17}],23:[function(require,module,exports){
(function (__filename){
/* global require, ssrc2jid */
/* jshint -W117 */

var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTCBrowserType = require("../RTC/RTCBrowserType");
var StatisticsEvents = require("../../service/statistics/Events");

/* Whether we support the browser we are running into for logging statistics */
var browserSupported = RTCBrowserType.isChrome() ||
    RTCBrowserType.isOpera();

var keyMap = {};
keyMap[RTCBrowserType.RTC_BROWSER_FIREFOX] = {
    "ssrc": "ssrc",
    "packetsReceived": "packetsReceived",
    "packetsLost": "packetsLost",
    "packetsSent": "packetsSent",
    "bytesReceived": "bytesReceived",
    "bytesSent": "bytesSent"
};
keyMap[RTCBrowserType.RTC_BROWSER_CHROME] = {
    "receiveBandwidth": "googAvailableReceiveBandwidth",
    "sendBandwidth": "googAvailableSendBandwidth",
    "remoteAddress": "googRemoteAddress",
    "transportType": "googTransportType",
    "localAddress": "googLocalAddress",
    "activeConnection": "googActiveConnection",
    "ssrc": "ssrc",
    "packetsReceived": "packetsReceived",
    "packetsSent": "packetsSent",
    "packetsLost": "packetsLost",
    "bytesReceived": "bytesReceived",
    "bytesSent": "bytesSent",
    "googFrameHeightReceived": "googFrameHeightReceived",
    "googFrameWidthReceived": "googFrameWidthReceived",
    "googFrameHeightSent": "googFrameHeightSent",
    "googFrameWidthSent": "googFrameWidthSent",
    "audioInputLevel": "audioInputLevel",
    "audioOutputLevel": "audioOutputLevel"
};
keyMap[RTCBrowserType.RTC_BROWSER_OPERA] =
    keyMap[RTCBrowserType.RTC_BROWSER_CHROME];

/**
 * Calculates packet lost percent using the number of lost packets and the
 * number of all packet.
 * @param lostPackets the number of lost packets
 * @param totalPackets the number of all packets.
 * @returns {number} packet loss percent
 */
function calculatePacketLoss(lostPackets, totalPackets) {
    if(!totalPackets || totalPackets <= 0 || !lostPackets || lostPackets <= 0)
        return 0;
    return Math.round((lostPackets/totalPackets)*100);
}

function getStatValue(item, name) {
    var browserType = RTCBrowserType.getBrowserType();
    if (!keyMap[browserType][name])
        throw "The property isn't supported!";
    var key = keyMap[browserType][name];
    return (RTCBrowserType.isChrome() || RTCBrowserType.isOpera()) ?
        item.stat(key) : item[key];
}

function formatAudioLevel(audioLevel) {
    return Math.min(Math.max(audioLevel, 0), 1);
}

/**
 * Checks whether a certain record should be included in the logged statistics.
 */
function acceptStat(reportId, reportType, statName) {
    if (reportType == "googCandidatePair" && statName == "googChannelId")
        return false;

    if (reportType == "ssrc") {
        if (statName == "googTrackId" ||
            statName == "transportId" ||
            statName == "ssrc")
            return false;
    }

    return true;
}

/**
 * Checks whether a certain record should be included in the logged statistics.
 */
function acceptReport(id, type) {
    if (id.substring(0, 15) == "googCertificate" ||
        id.substring(0, 9) == "googTrack" ||
        id.substring(0, 20) == "googLibjingleSession")
        return false;

    if (type == "googComponent")
        return false;

    return true;
}

/**
 * Peer statistics data holder.
 * @constructor
 */
function PeerStats()
{
    this.ssrc2Loss = {};
    this.ssrc2AudioLevel = {};
    this.ssrc2bitrate = {};
    this.ssrc2resolution = {};
}

/**
 * Sets packets loss rate for given <tt>ssrc</tt> that blong to the peer
 * represented by this instance.
 * @param lossRate new packet loss rate value to be set.
 */
PeerStats.prototype.setSsrcLoss = function (lossRate)
{
    this.ssrc2Loss = lossRate;
};

/**
 * Sets resolution that belong to the ssrc
 * represented by this instance.
 * @param resolution new resolution value to be set.
 */
PeerStats.prototype.setSsrcResolution = function (resolution)
{
    if(resolution === null && this.ssrc2resolution[ssrc])
    {
        delete this.ssrc2resolution[ssrc];
    }
    else if(resolution !== null)
        this.ssrc2resolution[ssrc] = resolution;
};

/**
 * Sets the bit rate for given <tt>ssrc</tt> that blong to the peer
 * represented by this instance.
 * @param ssrc audio or video RTP stream SSRC.
 * @param bitrate new bitrate value to be set.
 */
PeerStats.prototype.setSsrcBitrate = function (ssrc, bitrate)
{
    if(this.ssrc2bitrate[ssrc])
    {
        this.ssrc2bitrate[ssrc].download += bitrate.download;
        this.ssrc2bitrate[ssrc].upload += bitrate.upload;
    }
    else {
        this.ssrc2bitrate[ssrc] = bitrate;
    }
};

/**
 * Sets new audio level(input or output) for given <tt>ssrc</tt> that identifies
 * the stream which belongs to the peer represented by this instance.
 * @param ssrc RTP stream SSRC for which current audio level value will be
 *        updated.
 * @param audioLevel the new audio level value to be set. Value is truncated to
 *        fit the range from 0 to 1.
 */
PeerStats.prototype.setSsrcAudioLevel = function (ssrc, audioLevel)
{
    // Range limit 0 - 1
    this.ssrc2AudioLevel[ssrc] = formatAudioLevel(audioLevel);
};

function ConferenceStats() {


    /**
     * The bandwidth
     * @type {{}}
     */
    this.bandwidth = {};

    /**
     * The bit rate
     * @type {{}}
     */
    this.bitrate = {};

    /**
     * The packet loss rate
     * @type {{}}
     */
    this.packetLoss = null;


    /**
     * Array with the transport information.
     * @type {Array}
     */
    this.transport = [];
}

/**
 * <tt>StatsCollector</tt> registers for stats updates of given
 * <tt>peerconnection</tt> in given <tt>interval</tt>. On each update particular
 * stats are extracted and put in {@link PeerStats} objects. Once the processing
 * is done <tt>audioLevelsUpdateCallback</tt> is called with <tt>this</tt>
 * instance as an event source.
 *
 * @param peerconnection webRTC peer connection object.
 * @param interval stats refresh interval given in ms.
 * @param {function(StatsCollector)} audioLevelsUpdateCallback the callback
 * called on stats update.
 * @param config {object} supports the following properties - disableAudioLevels, disableStats, logStats
 * @constructor
 */
function StatsCollector(peerconnection, audioLevelsInterval, statsInterval, eventEmitter, config)
{
    this.peerconnection = peerconnection;
    this.baselineAudioLevelsReport = null;
    this.currentAudioLevelsReport = null;
    this.currentStatsReport = null;
    this.baselineStatsReport = null;
    this.audioLevelsIntervalId = null;
    this.eventEmitter = eventEmitter;
    this.config = config || {};
    this.conferenceStats = new ConferenceStats();

    /**
     * Gather PeerConnection stats once every this many milliseconds.
     */
    this.GATHER_INTERVAL = 15000;

    /**
     * Log stats via the focus once every this many milliseconds.
     */
    this.LOG_INTERVAL = 60000;

    /**
     * Gather stats and store them in this.statsToBeLogged.
     */
    this.gatherStatsIntervalId = null;

    /**
     * Send the stats already saved in this.statsToBeLogged to be logged via
     * the focus.
     */
    this.logStatsIntervalId = null;

    /**
     * Stores the statistics which will be send to the focus to be logged.
     */
    this.statsToBeLogged =
    {
        timestamps: [],
        stats: {}
    };

    // Updates stats interval
    this.audioLevelsIntervalMilis = audioLevelsInterval;

    this.statsIntervalId = null;
    this.statsIntervalMilis = statsInterval;
    // Map of ssrcs to PeerStats
    this.ssrc2stats = {};
}

module.exports = StatsCollector;

/**
 * Stops stats updates.
 */
StatsCollector.prototype.stop = function () {
    if (this.audioLevelsIntervalId) {
        clearInterval(this.audioLevelsIntervalId);
        this.audioLevelsIntervalId = null;
    }

    if (this.statsIntervalId)
    {
        clearInterval(this.statsIntervalId);
        this.statsIntervalId = null;
    }

    if(this.logStatsIntervalId)
    {
        clearInterval(this.logStatsIntervalId);
        this.logStatsIntervalId = null;
    }

    if(this.gatherStatsIntervalId)
    {
        clearInterval(this.gatherStatsIntervalId);
        this.gatherStatsIntervalId = null;
    }
};

/**
 * Callback passed to <tt>getStats</tt> method.
 * @param error an error that occurred on <tt>getStats</tt> call.
 */
StatsCollector.prototype.errorCallback = function (error)
{
    logger.error("Get stats error", error);
    this.stop();
};

/**
 * Starts stats updates.
 */
StatsCollector.prototype.start = function ()
{
    var self = this;
    this.audioLevelsIntervalId = setInterval(
        function () {
            // Interval updates
            self.peerconnection.getStats(
                function (report) {
                    var results = null;
                    if (!report || !report.result ||
                        typeof report.result != 'function') {
                        results = report;
                    }
                    else {
                        results = report.result();
                    }
                    //logger.error("Got interval report", results);
                    self.currentAudioLevelsReport = results;
                    self.processAudioLevelReport();
                    self.baselineAudioLevelsReport =
                        self.currentAudioLevelsReport;
                },
                self.errorCallback
            );
        },
        self.audioLevelsIntervalMilis
    );

//    if (!this.config.disableStats && browserSupported) {
//        this.statsIntervalId = setInterval(
//            function () {
//                // Interval updates
//                self.peerconnection.getStats(
//                    function (report) {
//                        var results = null;
//                        if (!report || !report.result ||
//                            typeof report.result != 'function') {
//                            //firefox
//                            results = report;
//                        }
//                        else {
//                            //chrome
//                            results = report.result();
//                        }
//                        //logger.error("Got interval report", results);
//                        self.currentStatsReport = results;
//                        try {
//                            self.processStatsReport();
//                        }
//                        catch (e) {
//                            logger.error("Unsupported key:" + e, e);
//                        }
//
//                        self.baselineStatsReport = self.currentStatsReport;
//                    },
//                    self.errorCallback
//                );
//            },
//            self.statsIntervalMilis
//        );
//    }
//
//    if (this.config.logStats && browserSupported) {
//        this.gatherStatsIntervalId = setInterval(
//            function () {
//                self.peerconnection.getStats(
//                    function (report) {
//                        self.addStatsToBeLogged(report.result());
//                    },
//                    function () {
//                    }
//                );
//            },
//            this.GATHER_INTERVAL
//        );
//
//        this.logStatsIntervalId = setInterval(
//            function() { self.logStats(); },
//            this.LOG_INTERVAL);
//    }
};

/**
 * Converts the stats to the format used for logging, and saves the data in
 * this.statsToBeLogged.
 * @param reports Reports as given by webkitRTCPerConnection.getStats.
 */
StatsCollector.prototype.addStatsToBeLogged = function (reports) {
    var self = this;
    var num_records = this.statsToBeLogged.timestamps.length;
    this.statsToBeLogged.timestamps.push(new Date().getTime());
    reports.map(function (report) {
        if (!acceptReport(report.id, report.type))
            return;
        var stat = self.statsToBeLogged.stats[report.id];
        if (!stat) {
            stat = self.statsToBeLogged.stats[report.id] = {};
        }
        stat.type = report.type;
        report.names().map(function (name) {
            if (!acceptStat(report.id, report.type, name))
                return;
            var values = stat[name];
            if (!values) {
                values = stat[name] = [];
            }
            while (values.length < num_records) {
                values.push(null);
            }
            values.push(report.stat(name));
        });
    });
};


//FIXME:
//StatsCollector.prototype.logStats = function () {
//
//    if(!APP.xmpp.sendLogs(this.statsToBeLogged))
//        return;
//    // Reset the stats
//    this.statsToBeLogged.stats = {};
//    this.statsToBeLogged.timestamps = [];
//};


/**
 * Stats processing logic.
 */
StatsCollector.prototype.processStatsReport = function () {
    if (!this.baselineStatsReport) {
        return;
    }

    for (var idx in this.currentStatsReport) {
        var now = this.currentStatsReport[idx];
        try {
            if (getStatValue(now, 'receiveBandwidth') ||
                getStatValue(now, 'sendBandwidth')) {
                this.conferenceStats.bandwidth = {
                    "download": Math.round(
                            (getStatValue(now, 'receiveBandwidth')) / 1000),
                    "upload": Math.round(
                            (getStatValue(now, 'sendBandwidth')) / 1000)
                };
            }
        }
        catch(e){/*not supported*/}

        if(now.type == 'googCandidatePair')
        {
            var ip, type, localIP, active;
            try {
                ip = getStatValue(now, 'remoteAddress');
                type = getStatValue(now, "transportType");
                localIP = getStatValue(now, "localAddress");
                active = getStatValue(now, "activeConnection");
            }
            catch(e){/*not supported*/}
            if(!ip || !type || !localIP || active != "true")
                continue;
            var addressSaved = false;
            for(var i = 0; i < this.conferenceStats.transport.length; i++)
            {
                if(this.conferenceStats.transport[i].ip == ip &&
                    this.conferenceStats.transport[i].type == type &&
                    this.conferenceStats.transport[i].localip == localIP)
                {
                    addressSaved = true;
                }
            }
            if(addressSaved)
                continue;
            this.conferenceStats.transport.push({localip: localIP, ip: ip, type: type});
            continue;
        }

        if(now.type == "candidatepair")
        {
            if(now.state == "succeeded")
                continue;

            var local = this.currentStatsReport[now.localCandidateId];
            var remote = this.currentStatsReport[now.remoteCandidateId];
            this.conferenceStats.transport.push({localip: local.ipAddress + ":" + local.portNumber,
                ip: remote.ipAddress + ":" + remote.portNumber, type: local.transport});

        }

        if (now.type != 'ssrc' && now.type != "outboundrtp" &&
            now.type != "inboundrtp") {
            continue;
        }

        var before = this.baselineStatsReport[idx];
        if (!before) {
            logger.warn(getStatValue(now, 'ssrc') + ' not enough data');
            continue;
        }

        var ssrc = getStatValue(now, 'ssrc');
        if(!ssrc)
            continue;

        var ssrcStats = this.ssrc2stats[ssrc];
        if (!ssrcStats) {
            ssrcStats = new PeerStats();
            this.ssrc2stats[ssrc] = ssrcStats;
        }


        var isDownloadStream = true;
        var key = 'packetsReceived';
        var packetsNow = getStatValue(now, key);
        if (typeof packetsNow === 'undefined' || packetsNow === null) {
            isDownloadStream = false;
            key = 'packetsSent';
            packetsNow = getStatValue(now, key);
            if (typeof packetsNow === 'undefined' || packetsNow === null) {
                console.warn("No packetsReceived nor packetsSent stat found");
                continue;
            }
        }
        if (!packetsNow || packetsNow < 0)
            packetsNow = 0;

        var packetsBefore = getStatValue(before, key);
        if (!packetsBefore || packetsBefore < 0)
            packetsBefore = 0;
        var packetRate = packetsNow - packetsBefore;
        if (!packetRate || packetRate < 0)
            packetRate = 0;
        var currentLoss = getStatValue(now, 'packetsLost');
        if (!currentLoss || currentLoss < 0)
            currentLoss = 0;
        var previousLoss = getStatValue(before, 'packetsLost');
        if (!previousLoss || previousLoss < 0)
            previousLoss = 0;
        var lossRate = currentLoss - previousLoss;
        if (!lossRate || lossRate < 0)
            lossRate = 0;
        var packetsTotal = (packetRate + lossRate);

        ssrcStats.setSsrcLoss(ssrc,
            {"packetsTotal": packetsTotal,
                "packetsLost": lossRate,
                "isDownloadStream": isDownloadStream});


        var bytesReceived = 0, bytesSent = 0;
        if(getStatValue(now, "bytesReceived")) {
            bytesReceived = getStatValue(now, "bytesReceived") -
                getStatValue(before, "bytesReceived");
        }

        if (getStatValue(now, "bytesSent")) {
            bytesSent = getStatValue(now, "bytesSent") -
                getStatValue(before, "bytesSent");
        }

        var time = Math.round((now.timestamp - before.timestamp) / 1000);
        if (bytesReceived <= 0 || time <= 0) {
            bytesReceived = 0;
        } else {
            bytesReceived = Math.round(((bytesReceived * 8) / time) / 1000);
        }

        if (bytesSent <= 0 || time <= 0) {
            bytesSent = 0;
        } else {
            bytesSent = Math.round(((bytesSent * 8) / time) / 1000);
        }

        ssrcStats.setSsrcBitrate(ssrc, {
            "download": bytesReceived,
            "upload": bytesSent});

        var resolution = {height: null, width: null};
        try {
            if (getStatValue(now, "googFrameHeightReceived") &&
                getStatValue(now, "googFrameWidthReceived")) {
                resolution.height =
                    getStatValue(now, "googFrameHeightReceived");
                resolution.width = getStatValue(now, "googFrameWidthReceived");
            }
            else if (getStatValue(now, "googFrameHeightSent") &&
                getStatValue(now, "googFrameWidthSent")) {
                resolution.height = getStatValue(now, "googFrameHeightSent");
                resolution.width = getStatValue(now, "googFrameWidthSent");
            }
        }
        catch(e){/*not supported*/}

        if (resolution.height && resolution.width) {
            ssrcStats.setSsrcResolution(ssrc, resolution);
        } else {
            ssrcStats.setSsrcResolution(ssrc, null);
        }
    }

    var self = this;
    // Jid stats
    var totalPackets = {download: 0, upload: 0};
    var lostPackets = {download: 0, upload: 0};
    var bitrateDownload = 0;
    var bitrateUpload = 0;
    var resolutions = {};
    Object.keys(this.ssrc2stats).forEach(
        function (jid) {
            Object.keys(self.ssrc2stats[jid].ssrc2Loss).forEach(
                function (ssrc) {
                    var type = "upload";
                    if(self.ssrc2stats[jid].ssrc2Loss[ssrc].isDownloadStream)
                        type = "download";
                    totalPackets[type] +=
                        self.ssrc2stats[jid].ssrc2Loss[ssrc].packetsTotal;
                    lostPackets[type] +=
                        self.ssrc2stats[jid].ssrc2Loss[ssrc].packetsLost;
                }
            );
            Object.keys(self.ssrc2stats[jid].ssrc2bitrate).forEach(
                function (ssrc) {
                    bitrateDownload +=
                        self.ssrc2stats[jid].ssrc2bitrate[ssrc].download;
                    bitrateUpload +=
                        self.ssrc2stats[jid].ssrc2bitrate[ssrc].upload;

                    delete self.ssrc2stats[jid].ssrc2bitrate[ssrc];
                }
            );
            resolutions[jid] = self.ssrc2stats[jid].ssrc2resolution;
        }
    );

    this.conferenceStats.bitrate = {"upload": bitrateUpload, "download": bitrateDownload};

    this.conferenceStats.packetLoss = {
        total:
            calculatePacketLoss(lostPackets.download + lostPackets.upload,
                    totalPackets.download + totalPackets.upload),
        download:
            calculatePacketLoss(lostPackets.download, totalPackets.download),
        upload:
            calculatePacketLoss(lostPackets.upload, totalPackets.upload)
    };
    this.eventEmitter.emit(StatisticsEvents.CONNECTION_STATS,
        {
            "bitrate": this.conferenceStats.bitrate,
            "packetLoss": this.conferenceStats.packetLoss,
            "bandwidth": this.conferenceStats.bandwidth,
            "resolution": resolutions,
            "transport": this.conferenceStats.transport
        });
    this.conferenceStats.transport = [];

};

/**
 * Stats processing logic.
 */
StatsCollector.prototype.processAudioLevelReport = function () {
    if (!this.baselineAudioLevelsReport) {
        return;
    }

    for (var idx in this.currentAudioLevelsReport) {
        var now = this.currentAudioLevelsReport[idx];

        //if we don't have "packetsReceived" this is local stream
        if (now.type != 'ssrc' || !getStatValue(now, 'packetsReceived')) {
            continue;
        }

        var before = this.baselineAudioLevelsReport[idx];
        if (!before) {
            logger.warn(getStatValue(now, 'ssrc') + ' not enough data');
            continue;
        }

        var ssrc = getStatValue(now, 'ssrc');
        if (!ssrc) {
            if((Date.now() - now.timestamp) < 3000)
                logger.warn("No ssrc: ");
            continue;
        }

        var ssrcStats = this.ssrc2stats[ssrc];
        if (!ssrcStats) {
            ssrcStats = new PeerStats();
            this.ssrc2stats[ssrc] = ssrcStats;
        }

        // Audio level
        var audioLevel = null;

        try {
            audioLevel = getStatValue(now, 'audioInputLevel');
            if (!audioLevel)
                audioLevel = getStatValue(now, 'audioOutputLevel');
        }
        catch(e) {/*not supported*/
            logger.warn("Audio Levels are not available in the statistics.");
            clearInterval(this.audioLevelsIntervalId);
            return;
        }

        if (audioLevel) {
            // TODO: can't find specs about what this value really is,
            // but it seems to vary between 0 and around 32k.
            audioLevel = audioLevel / 32767;
            ssrcStats.setSsrcAudioLevel(ssrc, audioLevel);
            this.eventEmitter.emit(
                StatisticsEvents.AUDIO_LEVEL, ssrc, audioLevel);
        }
    }
};

}).call(this,"/modules/statistics/RTPStatsCollector.js")
},{"../../service/statistics/Events":85,"../RTC/RTCBrowserType":17,"jitsi-meet-logger":48}],24:[function(require,module,exports){
/* global require, APP */
var LocalStats = require("./LocalStatsCollector.js");
var RTPStats = require("./RTPStatsCollector.js");
var EventEmitter = require("events");
var StatisticsEvents = require("../../service/statistics/Events");
//var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
//var XMPPEvents = require("../../service/xmpp/XMPPEvents");
//var CallStats = require("./CallStats");
//var RTCEvents = require("../../service/RTC/RTCEvents");

//
//function onDisposeConference(onUnload) {
//    CallStats.sendTerminateEvent();
//    stopRemote();
//    if(onUnload) {
//        stopLocal();
//        eventEmitter.removeAllListeners();
//    }
//}

var eventEmitter = new EventEmitter();

function Statistics() {
    this.rtpStats = null;
    this.eventEmitter = new EventEmitter();
}

Statistics.prototype.startRemoteStats = function (peerconnection) {
    if (this.rtpStats) {
        this.rtpStats.stop();
    }

    this.rtpStats = new RTPStats(peerconnection, 200, 2000, this.eventEmitter);
    this.rtpStats.start();
}

Statistics.localStats = [];

Statistics.startLocalStats = function (stream, callback) {
    var localStats = new LocalStats(stream, 200, callback);
    this.localStats.push(localStats);
    localStats.start();
}

Statistics.prototype.addAudioLevelListener = function(listener)
{
    this.eventEmitter.on(StatisticsEvents.AUDIO_LEVEL, listener);
}

Statistics.prototype.removeAudioLevelListener = function(listener)
{
    this.eventEmitter.removeListener(StatisticsEvents.AUDIO_LEVEL, listener);
}

Statistics.prototype.dispose = function () {
    Statistics.stopAllLocalStats();
    this.stopRemote();
    if(this.eventEmitter)
        this.eventEmitter.removeAllListeners();

    if(eventEmitter)
        eventEmitter.removeAllListeners();
}


Statistics.stopAllLocalStats = function () {
    for(var i = 0; i < this.localStats.length; i++)
        this.localStats[i].stop();
    this.localStats = [];
}

Statistics.stopLocalStats = function (stream) {
    for(var i = 0; i < Statistics.localStats.length; i++)
        if(Statistics.localStats[i].stream === stream){
            var localStats = Statistics.localStats.splice(i, 1);
            localStats.stop();
            break;
        }
}

Statistics.prototype.stopRemote = function () {
    if (this.rtpStats) {
        this.rtpStats.stop();
        this.eventEmitter.emit(StatisticsEvents.STOP);
        this.rtpStats = null;
    }
};

/**
 * Obtains audio level reported in the stats for specified peer.
 * @param peerJid full MUC jid of the user for whom we want to obtain last
 *        audio level.
 * @param ssrc the SSRC of audio stream for which we want to obtain audio
 *        level.
 * @returns {*} a float form 0 to 1 that represents current audio level or
 *              <tt>null</tt> if for any reason the value is not available
 *              at this time.
 */
Statistics.prototype.getPeerSSRCAudioLevel = function (peerJid, ssrc) {

    var peerStats = this.rtpStats.jid2stats[peerJid];

    return peerStats ? peerStats.ssrc2AudioLevel[ssrc] : null;
};

Statistics.LOCAL_JID = require("../../service/statistics/constants").LOCAL_JID;

//
//var statistics = {
//    /**
//     * Indicates that this audio level is for local jid.
//     * @type {string}
//     */
//    LOCAL_JID: 'local',
//
//    addConnectionStatsListener: function(listener)
//    {
//        eventEmitter.on("statistics.connectionstats", listener);
//    },
//
//    removeConnectionStatsListener: function(listener)
//    {
//        eventEmitter.removeListener("statistics.connectionstats", listener);
//    },
//
//
//    addRemoteStatsStopListener: function(listener)
//    {
//        eventEmitter.on("statistics.stop", listener);
//    },
//
//    removeRemoteStatsStopListener: function(listener)
//    {
//        eventEmitter.removeListener("statistics.stop", listener);
//    },
//
//
//    stopRemoteStatistics: function()
//    {
//        stopRemote();
//    },
//
////    Already implemented with the constructor
//    start: function () {
//        APP.RTC.addStreamListener(onStreamCreated,
//            StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
//        APP.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE, onDisposeConference);
//        //FIXME: we may want to change CALL INCOMING event to onnegotiationneeded
//        APP.xmpp.addListener(XMPPEvents.CALL_INCOMING, function (event) {
//            startRemoteStats(event.peerconnection);
////            CallStats.init(event);
//        });
////        APP.xmpp.addListener(XMPPEvents.PEERCONNECTION_READY, function (session) {
////            CallStats.init(session);
////        });
//        //FIXME: that event is changed to TRACK_MUTE_CHANGED
////        APP.RTC.addListener(RTCEvents.AUDIO_MUTE, function (mute) {
////            CallStats.sendMuteEvent(mute, "audio");
////        });
////        APP.xmpp.addListener(XMPPEvents.CONFERENCE_SETUP_FAILED, function () {
////            CallStats.sendSetupFailedEvent();
////        });
//        //FIXME: that event is changed to TRACK_MUTE_CHANGED
////        APP.RTC.addListener(RTCEvents.VIDEO_MUTE, function (mute) {
////            CallStats.sendMuteEvent(mute, "video");
////        });
//    }
//};




module.exports = Statistics;

},{"../../service/statistics/Events":85,"../../service/statistics/constants":86,"./LocalStatsCollector.js":22,"./RTPStatsCollector.js":23,"events":44}],25:[function(require,module,exports){
/**
/**
 * @const
 */
var ALPHANUM = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Hexadecimal digits.
 * @const
 */
var HEX_DIGITS = '0123456789abcdef';

/**
 * Generates random int within the range [min, max]
 * @param min the minimum value for the generated number
 * @param max the maximum value for the generated number
 * @returns random int number
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random element from array or string.
 * @param {Array|string} arr source
 * @returns array element or string character
 */
function randomElement(arr) {
    return arr[randomInt(0, arr.length - 1)];
}

/**
 * Generate random alphanumeric string.
 * @param {number} length expected string length
 * @returns {string} random string of specified length
 */
function randomAlphanumStr(length) {
    var result = '';

    for (var i = 0; i < length; i += 1) {
        result += randomElement(ALPHANUM);
    }

    return result;
}

/**
 * Exported interface.
 */
var RandomUtil = {
    /**
     * Returns a random hex digit.
     * @returns {*}
     */
    randomHexDigit: function() {
        return randomElement(HEX_DIGITS);
    },
    /**
     * Returns a random string of hex digits with length 'len'.
     * @param len the length.
     */
    randomHexString: function (len) {
        var ret = '';
        while (len--) {
            ret += this.randomHexDigit();
        }
        return ret;
    },
    randomElement: randomElement,
    randomAlphanumStr: randomAlphanumStr
};

module.exports = RandomUtil;

},{}],26:[function(require,module,exports){
(function (__filename){
/* global Strophe, $, $pres, $iq, $msg */
/* jshint -W101,-W069 */
var logger = require("jitsi-meet-logger").getLogger(__filename);
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var Moderator = require("./moderator");
var EventEmitter = require("events");
var Recorder = require("./recording");
var JIBRI_XMLNS = 'http://jitsi.org/protocol/jibri';

var parser = {
    packet2JSON: function (packet, nodes) {
        var self = this;
        $(packet).children().each(function (index) {
            var tagName = $(this).prop("tagName");
            var node = {
                tagName: tagName
            };
            node.attributes = {};
            $($(this)[0].attributes).each(function( index, attr ) {
                node.attributes[ attr.name ] = attr.value;
            });
            var text = Strophe.getText($(this)[0]);
            if (text) {
                node.value = text;
            }
            node.children = [];
            nodes.push(node);
            self.packet2JSON($(this), node.children);
        });
    },
    JSON2packet: function (nodes, packet) {
        for(var i = 0; i < nodes.length; i++) {
            var node = nodes[i];
            if(!node || node === null){
                continue;
            }
            packet.c(node.tagName, node.attributes);
            if(node.value)
                packet.t(node.value);
            if(node.children)
                this.JSON2packet(node.children, packet);
            packet.up();
        }
        // packet.up();
    }
};

/**
 * Returns array of JS objects from the presence JSON associated with the passed nodeName
 * @param pres the presence JSON
 * @param nodeName the name of the node (videomuted, audiomuted, etc)
 */
function filterNodeFromPresenceJSON(pres, nodeName){
    var res = [];
    for(var i = 0; i < pres.length; i++)
        if(pres[i].tagName === nodeName)
            res.push(pres[i]);

    return res;
}

function ChatRoom(connection, jid, password, XMPP, options) {
    this.eventEmitter = new EventEmitter();
    this.xmpp = XMPP;
    this.connection = connection;
    this.roomjid = Strophe.getBareJidFromJid(jid);
    this.myroomjid = jid;
    this.password = password;
    logger.info("Joined MUC as " + this.myroomjid);
    this.members = {};
    this.presMap = {};
    this.presHandlers = {};
    this.joined = false;
    this.role = 'none';
    this.focusMucJid = null;
    this.bridgeIsDown = false;
    this.options = options || {};
    this.moderator = new Moderator(this.roomjid, this.xmpp, this.eventEmitter);
    this.initPresenceMap();
    this.session = null;
    var self = this;
    this.lastPresences = {};
    this.phoneNumber = null;
    this.phonePin = null;
}

ChatRoom.prototype.initPresenceMap = function () {
    this.presMap['to'] = this.myroomjid;
    this.presMap['xns'] = 'http://jabber.org/protocol/muc';
    this.presMap["nodes"] = [];
    this.presMap["nodes"].push( {
        "tagName": "user-agent",
        "value": navigator.userAgent,
        "attributes": {xmlns: 'http://jitsi.org/jitmeet/user-agent'}
    });

};

ChatRoom.prototype.updateDeviceAvailability = function (devices) {
    this.presMap["nodes"].push( {
        "tagName": "devices",
        "children": [
            {
                "tagName": "audio",
                "value": devices.audio,
            },
            {
                "tagName": "video",
                "value": devices.video,
            }
        ]
    });
};

ChatRoom.prototype.join = function (password) {
    if(password)
        this.password = password;
    var self = this;
    this.moderator.allocateConferenceFocus(function()
    {
        self.sendPresence(true);
    }.bind(this));
};

ChatRoom.prototype.sendPresence = function (fromJoin) {
    if (!this.presMap['to'] || (!this.joined && !fromJoin)) {
        // Too early to send presence - not initialized
        return;
    }

    var pres = $pres({to: this.presMap['to'] });
    pres.c('x', {xmlns: this.presMap['xns']});

    if (this.password) {
        pres.c('password').t(this.password).up();
    }

    pres.up();

    // Send XEP-0115 'c' stanza that contains our capabilities info
    if (this.connection.caps) {
        this.connection.caps.node = this.xmpp.options.clientNode;
        pres.c('c', this.connection.caps.generateCapsAttrs()).up();
    }

    parser.JSON2packet(this.presMap.nodes, pres);
    this.connection.send(pres);
};


ChatRoom.prototype.doLeave = function () {
    logger.log("do leave", this.myroomjid);
    var pres = $pres({to: this.myroomjid, type: 'unavailable' });
    this.presMap.length = 0;
    this.connection.send(pres);
};


ChatRoom.prototype.createNonAnonymousRoom = function () {
    // http://xmpp.org/extensions/xep-0045.html#createroom-reserved

    var getForm = $iq({type: 'get', to: this.roomjid})
        .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'})
        .c('x', {xmlns: 'jabber:x:data', type: 'submit'});

    var self = this;

    this.connection.sendIQ(getForm, function (form) {

        if (!$(form).find(
                '>query>x[xmlns="jabber:x:data"]' +
                '>field[var="muc#roomconfig_whois"]').length) {

            logger.error('non-anonymous rooms not supported');
            return;
        }

        var formSubmit = $iq({to: this.roomjid, type: 'set'})
            .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});

        formSubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});

        formSubmit.c('field', {'var': 'FORM_TYPE'})
            .c('value')
            .t('http://jabber.org/protocol/muc#roomconfig').up().up();

        formSubmit.c('field', {'var': 'muc#roomconfig_whois'})
            .c('value').t('anyone').up().up();

        self.connection.sendIQ(formSubmit);

    }, function (error) {
        logger.error("Error getting room configuration form");
    });
};

ChatRoom.prototype.onPresence = function (pres) {
    var from = pres.getAttribute('from');
    // Parse roles.
    var member = {};
    member.show = $(pres).find('>show').text();
    member.status = $(pres).find('>status').text();
    var tmp = $(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>item');
    member.affiliation = tmp.attr('affiliation');
    member.role = tmp.attr('role');

    // Focus recognition
    member.jid = tmp.attr('jid');
    member.isFocus = false;
    if (member.jid
        && member.jid.indexOf(this.moderator.getFocusUserJid() + "/") === 0) {
        member.isFocus = true;
    }

    $(pres).find(">x").remove();
    var nodes = [];
    parser.packet2JSON(pres, nodes);
    this.lastPresences[from] = nodes;
    var jibri = null;
    // process nodes to extract data needed for MUC_JOINED and MUC_MEMBER_JOINED
    // events
    for(var i = 0; i < nodes.length; i++)
    {
        var node = nodes[i];
        switch(node.tagName)
        {
            case "nick":
                member.nick = node.value;
                break;
            case "userId":
                member.id = node.value;
                break;
        }
    }

    if (from == this.myroomjid) {
        if (member.affiliation == 'owner'
            &&  this.role !== member.role) {
                this.role = member.role;
                this.eventEmitter.emit(
                    XMPPEvents.LOCAL_ROLE_CHANGED, this.role);
        }
        if (!this.joined) {
            this.joined = true;
            console.log("(TIME) MUC joined:\t", window.performance.now());
            this.eventEmitter.emit(XMPPEvents.MUC_JOINED);
        }
    } else if (this.members[from] === undefined) {
        // new participant
        this.members[from] = member;
        logger.log('entered', from, member);
        if (member.isFocus) {
            this.focusMucJid = from;
            if(!this.recording) {
                this.recording = new Recorder(this.options.recordingType,
                    this.eventEmitter, this.connection, this.focusMucJid,
                    this.options.jirecon, this.roomjid);
                if(this.lastJibri)
                    this.recording.handleJibriPresence(this.lastJibri);
            }
            logger.info("Ignore focus: " + from + ", real JID: " + member.jid);
        }
        else {
            this.eventEmitter.emit(
                XMPPEvents.MUC_MEMBER_JOINED, from, member.nick, member.role);
        }
    } else {
        // Presence update for existing participant
        // Watch role change:
        if (this.members[from].role != member.role) {
            this.members[from].role = member.role;
            this.eventEmitter.emit(
                XMPPEvents.MUC_ROLE_CHANGED, from, member.role);
        }

        // store the new display name
        if(member.displayName)
            this.members[from].displayName = member.displayName;
    }

    // after we had fired member or room joined events, lets fire events
    // for the rest info we got in presence
    for(var i = 0; i < nodes.length; i++)
    {
        var node = nodes[i];
        switch(node.tagName)
        {
            case "nick":
                if(!member.isFocus) {
                    var displayName = !this.xmpp.options.displayJids
                        ? member.nick : Strophe.getResourceFromJid(from);

                    if (displayName && displayName.length > 0) {
                        this.eventEmitter.emit(
                            XMPPEvents.DISPLAY_NAME_CHANGED, from, displayName);
                    }
                }
                break;
            case "bridgeIsDown":
                if(!this.bridgeIsDown) {
                    this.bridgeIsDown = true;
                    this.eventEmitter.emit(XMPPEvents.BRIDGE_DOWN);
                }
                break;
            case "jibri-recording-status":
                var jibri = node;
                break;
            case "call-control":
                var att = node.attributes;
                if(!att)
                    break;
                this.phoneNumber = att.phone || null;
                this.phonePin = att.pin || null;
                this.eventEmitter.emit(XMPPEvents.PHONE_NUMBER_CHANGED);
                break;
            default :
                this.processNode(node, from);
        }
    }

    if(!member.isFocus)
        this.eventEmitter.emit(XMPPEvents.USER_ID_CHANGED, from, member.id);

    // Trigger status message update
    if (member.status) {
        this.eventEmitter.emit(XMPPEvents.PRESENCE_STATUS, from, member);
    }

    if(jibri)
    {
        this.lastJibri = jibri;
        if(this.recording)
            this.recording.handleJibriPresence(jibri);
    }

};

ChatRoom.prototype.processNode = function (node, from) {
    if(this.presHandlers[node.tagName])
        this.presHandlers[node.tagName](node, Strophe.getResourceFromJid(from));
};

ChatRoom.prototype.sendMessage = function (body, nickname) {
    var msg = $msg({to: this.roomjid, type: 'groupchat'});
    msg.c('body', body).up();
    if (nickname) {
        msg.c('nick', {xmlns: 'http://jabber.org/protocol/nick'}).t(nickname).up().up();
    }
    this.connection.send(msg);
    this.eventEmitter.emit(XMPPEvents.SENDING_CHAT_MESSAGE, body);
};

ChatRoom.prototype.setSubject = function (subject) {
    var msg = $msg({to: this.roomjid, type: 'groupchat'});
    msg.c('subject', subject);
    this.connection.send(msg);
    logger.log("topic changed to " + subject);
};


ChatRoom.prototype.onParticipantLeft = function (jid) {

    delete this.lastPresences[jid];
    this.eventEmitter.emit(XMPPEvents.MUC_MEMBER_LEFT, jid);

    this.moderator.onMucMemberLeft(jid);
};

ChatRoom.prototype.onPresenceUnavailable = function (pres, from) {
    // room destroyed ?
    if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]' +
        '>destroy').length) {
        var reason;
        var reasonSelect = $(pres).find(
                '>x[xmlns="http://jabber.org/protocol/muc#user"]' +
                '>destroy>reason');
        if (reasonSelect.length) {
            reason = reasonSelect.text();
        }

        this.xmpp.leaveRoom(this.roomjid);

        this.eventEmitter.emit(XMPPEvents.MUC_DESTROYED, reason);
        delete this.connection.emuc.rooms[Strophe.getBareJidFromJid(from)];
        return true;
    }

    // Status code 110 indicates that this notification is "self-presence".
    if (!$(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="110"]').length) {
        delete this.members[from];
        this.onParticipantLeft(from);
    }
    // If the status code is 110 this means we're leaving and we would like
    // to remove everyone else from our view, so we trigger the event.
    else if (Object.keys(this.members).length > 1) {
        for (var i in this.members) {
            var member = this.members[i];
            delete this.members[i];
            this.onParticipantLeft(member);
        }
    }
    if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="307"]').length) {
        if (this.myroomjid === from) {
            this.xmpp.leaveRoom(this.roomjid);
            this.eventEmitter.emit(XMPPEvents.KICKED);
        }
    }
};

ChatRoom.prototype.onMessage = function (msg, from) {
    var nick =
        $(msg).find('>nick[xmlns="http://jabber.org/protocol/nick"]')
            .text() ||
        Strophe.getResourceFromJid(from);

    var txt = $(msg).find('>body').text();
    var type = msg.getAttribute("type");
    if (type == "error") {
        this.eventEmitter.emit(XMPPEvents.CHAT_ERROR_RECEIVED,
            $(msg).find('>text').text(), txt);
        return true;
    }

    var subject = $(msg).find('>subject');
    if (subject.length) {
        var subjectText = subject.text();
        if (subjectText || subjectText === "") {
            this.eventEmitter.emit(XMPPEvents.SUBJECT_CHANGED, subjectText);
            logger.log("Subject is changed to " + subjectText);
        }
    }

    // xep-0203 delay
    var stamp = $(msg).find('>delay').attr('stamp');

    if (!stamp) {
        // or xep-0091 delay, UTC timestamp
        stamp = $(msg).find('>[xmlns="jabber:x:delay"]').attr('stamp');

        if (stamp) {
            // the format is CCYYMMDDThh:mm:ss
            var dateParts = stamp.match(/(\d{4})(\d{2})(\d{2}T\d{2}:\d{2}:\d{2})/);
            stamp = dateParts[1] + "-" + dateParts[2] + "-" + dateParts[3] + "Z";
        }
    }

    if (txt) {
        logger.log('chat', nick, txt);
        this.eventEmitter.emit(XMPPEvents.MESSAGE_RECEIVED,
            from, nick, txt, this.myroomjid, stamp);
    }
};

ChatRoom.prototype.onPresenceError = function (pres, from) {
    if ($(pres).find('>error[type="auth"]>not-authorized[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
        logger.log('on password required', from);
        this.eventEmitter.emit(XMPPEvents.PASSWORD_REQUIRED);
    } else if ($(pres).find(
        '>error[type="cancel"]>not-allowed[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
        var toDomain = Strophe.getDomainFromJid(pres.getAttribute('to'));
        if (toDomain === this.xmpp.options.hosts.anonymousdomain) {
            // enter the room by replying with 'not-authorized'. This would
            // result in reconnection from authorized domain.
            // We're either missing Jicofo/Prosody config for anonymous
            // domains or something is wrong.
            this.eventEmitter.emit(XMPPEvents.ROOM_JOIN_ERROR, pres);

        } else {
            logger.warn('onPresError ', pres);
            this.eventEmitter.emit(XMPPEvents.ROOM_CONNECT_ERROR, pres);
        }
    } else {
        logger.warn('onPresError ', pres);
        this.eventEmitter.emit(XMPPEvents.ROOM_CONNECT_ERROR, pres);
    }
};

ChatRoom.prototype.kick = function (jid) {
    var kickIQ = $iq({to: this.roomjid, type: 'set'})
        .c('query', {xmlns: 'http://jabber.org/protocol/muc#admin'})
        .c('item', {nick: Strophe.getResourceFromJid(jid), role: 'none'})
        .c('reason').t('You have been kicked.').up().up().up();

    this.connection.sendIQ(
        kickIQ,
        function (result) {
            logger.log('Kick participant with jid: ', jid, result);
        },
        function (error) {
            logger.log('Kick participant error: ', error);
        });
};

ChatRoom.prototype.lockRoom = function (key, onSuccess, onError, onNotSupported) {
    //http://xmpp.org/extensions/xep-0045.html#roomconfig
    var ob = this;
    this.connection.sendIQ($iq({to: this.roomjid, type: 'get'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'}),
        function (res) {
            if ($(res).find('>query>x[xmlns="jabber:x:data"]>field[var="muc#roomconfig_roomsecret"]').length) {
                var formsubmit = $iq({to: ob.roomjid, type: 'set'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});
                formsubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});
                formsubmit.c('field', {'var': 'FORM_TYPE'}).c('value').t('http://jabber.org/protocol/muc#roomconfig').up().up();
                formsubmit.c('field', {'var': 'muc#roomconfig_roomsecret'}).c('value').t(key).up().up();
                // Fixes a bug in prosody 0.9.+ https://code.google.com/p/lxmppd/issues/detail?id=373
                formsubmit.c('field', {'var': 'muc#roomconfig_whois'}).c('value').t('anyone').up().up();
                // FIXME: is muc#roomconfig_passwordprotectedroom required?
                ob.connection.sendIQ(formsubmit,
                    onSuccess,
                    onError);
            } else {
                onNotSupported();
            }
        }, onError);
};

ChatRoom.prototype.addToPresence = function (key, values) {
    values.tagName = key;
    this.presMap["nodes"].push(values);
};

ChatRoom.prototype.removeFromPresence = function (key) {
    for(var i = 0; i < this.presMap.nodes.length; i++)
    {
        if(key === this.presMap.nodes[i].tagName)
            this.presMap.nodes.splice(i, 1);
    }
};

ChatRoom.prototype.addPresenceListener = function (name, handler) {
    this.presHandlers[name] = handler;
};

ChatRoom.prototype.removePresenceListener = function (name) {
    delete this.presHandlers[name];
};

ChatRoom.prototype.isModerator = function () {
    return this.role === 'moderator';
};

ChatRoom.prototype.getMemberRole = function (peerJid) {
    if (this.members[peerJid]) {
        return this.members[peerJid].role;
    }
    return null;
};

ChatRoom.prototype.setJingleSession = function(session){
    this.session = session;
    this.session.room = this;
};


ChatRoom.prototype.removeStream = function (stream, callback) {
    if(!this.session)
        return;
    this.session.removeStream(stream, callback);
};

ChatRoom.prototype.switchStreams = function (stream, oldStream, callback, isAudio) {
    if(this.session) {
        // FIXME: will block switchInProgress on true value in case of exception
        this.session.switchStreams(stream, oldStream, callback, isAudio);
    } else {
        // We are done immediately
        logger.warn("No conference handler or conference not started yet");
        callback();
    }
};

ChatRoom.prototype.addStream = function (stream, callback) {
    if(this.session) {
        // FIXME: will block switchInProgress on true value in case of exception
        this.session.addStream(stream, callback);
    } else {
        // We are done immediately
        logger.warn("No conference handler or conference not started yet");
        callback();
    }
};

ChatRoom.prototype.setVideoMute = function (mute, callback, options) {
    var self = this;
    var localCallback = function (mute) {
        self.sendVideoInfoPresence(mute);
        if(callback)
            callback(mute);
    };

    if(this.session)
    {
        this.session.setVideoMute(
            mute, localCallback, options);
    }
    else {
        localCallback(mute);
    }

};

ChatRoom.prototype.setAudioMute = function (mute, callback) {
    //This will be for remote streams only
//    if (this.forceMuted && !mute) {
//        logger.info("Asking focus for unmute");
//        this.connection.moderate.setMute(this.connection.emuc.myroomjid, mute);
//        // FIXME: wait for result before resetting muted status
//        this.forceMuted = false;
//    }


    return this.sendAudioInfoPresence(mute, callback);
};

ChatRoom.prototype.addAudioInfoToPresence = function (mute) {
    this.removeFromPresence("audiomuted");
    this.addToPresence("audiomuted",
        {attributes:
        {"audions": "http://jitsi.org/jitmeet/audio"},
            value: mute.toString()});
};

ChatRoom.prototype.sendAudioInfoPresence = function(mute, callback) {
    this.addAudioInfoToPresence(mute);
    if(this.connection) {
        this.sendPresence();
    }
    if(callback)
        callback();
};

ChatRoom.prototype.addVideoInfoToPresence = function (mute) {
    this.removeFromPresence("videomuted");
    this.addToPresence("videomuted",
        {attributes:
        {"videons": "http://jitsi.org/jitmeet/video"},
            value: mute.toString()});
};


ChatRoom.prototype.sendVideoInfoPresence = function (mute) {
    this.addVideoInfoToPresence(mute);
    if(!this.connection)
        return;
    this.sendPresence();
};

ChatRoom.prototype.addListener = function(type, listener) {
    this.eventEmitter.on(type, listener);
};

ChatRoom.prototype.removeListener = function (type, listener) {
    this.eventEmitter.removeListener(type, listener);
};

ChatRoom.prototype.remoteStreamAdded = function(data, sid, thessrc) {
    if(this.lastPresences[data.peerjid])
    {
        var pres = this.lastPresences[data.peerjid];
        var audiomuted = filterNodeFromPresenceJSON(pres, "audiomuted");
        var videomuted = filterNodeFromPresenceJSON(pres, "videomuted");
        data.videomuted = ((videomuted.length > 0
            && videomuted[0]
            && videomuted[0]["value"] === "true")? true : false);
        data.audiomuted = ((audiomuted.length > 0
            && audiomuted[0]
            && audiomuted[0]["value"] === "true")? true : false);
    }

    this.eventEmitter.emit(XMPPEvents.REMOTE_STREAM_RECEIVED, data, sid, thessrc);
};

ChatRoom.prototype.getJidBySSRC = function (ssrc) {
    if (!this.session)
        return null;
    return this.session.getSsrcOwner(ssrc);
};

/**
 * Returns true if the recording is supproted and false if not.
 */
ChatRoom.prototype.isRecordingSupported = function () {
    if(this.recording)
        return this.recording.isSupported();
    return false;
};

/**
 * Returns null if the recording is not supported, "on" if the recording started
 * and "off" if the recording is not started.
 */
ChatRoom.prototype.getRecordingState = function () {
    if(this.recording)
        return this.recording.getState();
    return "off";
}

/**
 * Returns the url of the recorded video.
 */
ChatRoom.prototype.getRecordingURL = function () {
    if(this.recording)
        return this.recording.getURL();
    return null;
}

/**
 * Starts/stops the recording
 * @param token token for authentication
 * @param statusChangeHandler {function} receives the new status as argument.
 */
ChatRoom.prototype.toggleRecording = function (options, statusChangeHandler) {
    if(this.recording)
        return this.recording.toggleRecording(options, statusChangeHandler);

    return statusChangeHandler("error",
        new Error("The conference is not created yet!"));
}

/**
 * Returns true if the SIP calls are supported and false otherwise
 */
ChatRoom.prototype.isSIPCallingSupported = function () {
    if(this.moderator)
        return this.moderator.isSipGatewayEnabled();
    return false;
}

/**
 * Dials a number.
 * @param number the number
 */
ChatRoom.prototype.dial = function (number) {
    return this.connection.rayo.dial(number, "fromnumber",
        Strophe.getNodeFromJid(this.myroomjid), this.password,
        this.focusMucJid);
}

/**
 * Hangup an existing call
 */
ChatRoom.prototype.hangup = function () {
    return this.connection.rayo.hangup();
}

/**
 * Returns the phone number for joining the conference.
 */
ChatRoom.prototype.getPhoneNumber = function () {
    return this.phoneNumber;
}

/**
 * Returns the pin for joining the conference with phone.
 */
ChatRoom.prototype.getPhonePin = function () {
    return this.phonePin;
}

/**
 * Returns the connection state for the current session.
 */
ChatRoom.prototype.getConnectionState = function () {
    if(!this.session)
        return null;
    return this.session.getIceConnectionState();
}

/**
 * Mutes remote participant.
 * @param jid of the participant
 * @param mute
 */
ChatRoom.prototype.muteParticipant = function (jid, mute) {
    logger.info("set mute", mute);
    var iqToFocus = $iq(
        {to: this.focusMucJid, type: 'set'})
        .c('mute', {
            xmlns: 'http://jitsi.org/jitmeet/audio',
            jid: jid
        })
        .t(mute.toString())
        .up();

    this.connection.sendIQ(
        iqToFocus,
        function (result) {
            logger.log('set mute', result);
        },
        function (error) {
            logger.log('set mute error', error);
        });
}

ChatRoom.prototype.onMute = function (iq) {
    var from = iq.getAttribute('from');
    if (from !== this.focusMucJid) {
        logger.warn("Ignored mute from non focus peer");
        return false;
    }
    var mute = $(iq).find('mute');
    if (mute.length) {
        var doMuteAudio = mute.text() === "true";
        this.eventEmitter.emit(XMPPEvents.AUDIO_MUTED_BY_FOCUS, doMuteAudio);
    }
    return true;
}

module.exports = ChatRoom;

}).call(this,"/modules/xmpp/ChatRoom.js")
},{"../../service/xmpp/XMPPEvents":87,"./moderator":34,"./recording":35,"events":44,"jitsi-meet-logger":48}],27:[function(require,module,exports){
(function (__filename){
/*
 * JingleSession provides an API to manage a single Jingle session. We will
 * have different implementations depending on the underlying interface used
 * (i.e. WebRTC and ORTC) and here we hold the code common to all of them.
 */
var logger = require("jitsi-meet-logger").getLogger(__filename);

function JingleSession(me, sid, connection, service, eventEmitter) {
    /**
     * Our JID.
     */
    this.me = me;

    /**
     * The Jingle session identifier.
     */
    this.sid = sid;

    /**
     * The XMPP connection.
     */
    this.connection = connection;

    /**
     * The XMPP service.
     */
    this.service = service;

    /**
     * The event emitter.
     */
    this.eventEmitter = eventEmitter;

    /**
     * Whether to use dripping or not. Dripping is sending trickle candidates
     * not one-by-one.
     * Note: currently we do not support 'false'.
     */
    this.usedrip = true;

    /**
     *  When dripping is used, stores ICE candidates which are to be sent.
     */
    this.drip_container = [];

    // Media constraints. Is this WebRTC only?
    this.media_constraints = null;

    // ICE servers config (RTCConfiguration?).
    this.ice_config = {};

    // The chat room instance associated with the session.
    this.room = null;
}

/**
 * Prepares this object to initiate a session.
 * @param peerjid the JID of the remote peer.
 * @param isInitiator whether we will be the Jingle initiator.
 * @param media_constraints
 * @param ice_config
 */
JingleSession.prototype.initialize = function(peerjid, isInitiator,
                                              media_constraints, ice_config) {
    this.media_constraints = media_constraints;
    this.ice_config = ice_config;

    if (this.state !== null) {
        logger.error('attempt to initiate on session ' + this.sid +
        'in state ' + this.state);
        return;
    }
    this.state = 'pending';
    this.initiator = isInitiator ? this.me : peerjid;
    this.responder = !isInitiator ? this.me : peerjid;
    this.peerjid = peerjid;

    this.doInitialize();
};

/**
 * Finishes initialization.
 */
JingleSession.prototype.doInitialize = function() {};

/**
 * Adds the ICE candidates found in the 'contents' array as remote candidates?
 * Note: currently only used on transport-info
 */
JingleSession.prototype.addIceCandidates = function(contents) {};

/**
 * Handles an 'add-source' event.
 *
 * @param contents an array of Jingle 'content' elements.
 */
JingleSession.prototype.addSources = function(contents) {};

/**
 * Handles a 'remove-source' event.
 *
 * @param contents an array of Jingle 'content' elements.
 */
JingleSession.prototype.removeSources = function(contents) {};

/**
 * Terminates this Jingle session (stops sending media and closes the streams?)
 */
JingleSession.prototype.terminate = function() {};

/**
 * Sends a Jingle session-terminate message to the peer and terminates the
 * session.
 * @param reason
 * @param text
 */
JingleSession.prototype.sendTerminate = function(reason, text) {};

/**
 * Handles an offer from the remote peer (prepares to accept a session).
 * @param jingle the 'jingle' XML element.
 */
JingleSession.prototype.setOffer = function(jingle) {};

/**
 * Handles an answer from the remote peer (prepares to accept a session).
 * @param jingle the 'jingle' XML element.
 */
JingleSession.prototype.setAnswer = function(jingle) {};


module.exports = JingleSession;

}).call(this,"/modules/xmpp/JingleSession.js")
},{"jitsi-meet-logger":48}],28:[function(require,module,exports){
(function (__filename){
/* jshint -W117 */

var logger = require("jitsi-meet-logger").getLogger(__filename);
var JingleSession = require("./JingleSession");
var TraceablePeerConnection = require("./TraceablePeerConnection");
var SDPDiffer = require("./SDPDiffer");
var SDPUtil = require("./SDPUtil");
var SDP = require("./SDP");
var async = require("async");
var transform = require("sdp-transform");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var RTCBrowserType = require("../RTC/RTCBrowserType");
var SSRCReplacement = require("./LocalSSRCReplacement");
var RTC = require("../RTC/RTC");

// Jingle stuff
function JingleSessionPC(me, sid, connection, service) {
    JingleSession.call(this, me, sid, connection, service);
    this.initiator = null;
    this.responder = null;
    this.peerjid = null;
    this.state = null;
    this.localSDP = null;
    this.remoteSDP = null;
    this.relayedStreams = [];

    this.usetrickle = true;
    this.usepranswer = false; // early transport warmup -- mind you, this might fail. depends on webrtc issue 1718

    this.hadstuncandidate = false;
    this.hadturncandidate = false;
    this.lasticecandidate = false;

    this.statsinterval = null;

    this.reason = null;

    this.addssrc = [];
    this.removessrc = [];
    this.pendingop = null;
    this.switchstreams = false;
    this.addingStreams = false;

    this.wait = true;
    /**
     * A map that stores SSRCs of local streams
     * @type {{}} maps media type('audio' or 'video') to SSRC number
     */
    this.localStreamsSSRC = {};
    this.ssrcOwners = {};
    this.ssrcVideoTypes = {};

    this.webrtcIceUdpDisable = !!this.service.options.webrtcIceUdpDisable;
    this.webrtcIceTcpDisable = !!this.service.options.webrtcIceTcpDisable;

    /**
     * The indicator which determines whether the (local) video has been muted
     * in response to a user command in contrast to an automatic decision made
     * by the application logic.
     */
    this.videoMuteByUser = false;

    this.modifySourcesQueue = async.queue(this._modifySources.bind(this), 1);
    // We start with the queue paused. We resume it when the signaling state is
    // stable and the ice connection state is connected.
    this.modifySourcesQueue.pause();
}
//XXX this is badly broken...
JingleSessionPC.prototype = JingleSession.prototype;
JingleSessionPC.prototype.constructor = JingleSessionPC;


JingleSessionPC.prototype.setOffer = function(offer) {
    this.setRemoteDescription(offer, 'offer');
};

JingleSessionPC.prototype.setAnswer = function(answer) {
    this.setRemoteDescription(answer, 'answer');
};

JingleSessionPC.prototype.updateModifySourcesQueue = function() {
    var signalingState = this.peerconnection.signalingState;
    var iceConnectionState = this.peerconnection.iceConnectionState;
    if (signalingState === 'stable' && iceConnectionState === 'connected') {
        this.modifySourcesQueue.resume();
    } else {
        this.modifySourcesQueue.pause();
    }
};

JingleSessionPC.prototype.doInitialize = function () {
    var self = this;

    this.hadstuncandidate = false;
    this.hadturncandidate = false;
    this.lasticecandidate = false;
    // True if reconnect is in progress
    this.isreconnect = false;
    // Set to true if the connection was ever stable
    this.wasstable = false;

    this.peerconnection = new TraceablePeerConnection(
            this.connection.jingle.ice_config,
            RTC.getPCConstraints(),
            this);

    this.peerconnection.onicecandidate = function (event) {
        var protocol;
        if (event && event.candidate) {
            protocol = (typeof event.candidate.protocol === 'string')
                ? event.candidate.protocol.toLowerCase() : '';
            if ((self.webrtcIceTcpDisable && protocol == 'tcp') ||
                (self.webrtcIceUdpDisable && protocol == 'udp')) {
                return;
            }
        }
        self.sendIceCandidate(event.candidate);
    };
    this.peerconnection.onaddstream = function (event) {
        if (event.stream.id !== 'default') {
            logger.log("REMOTE STREAM ADDED: ", event.stream , event.stream.id);
            self.remoteStreamAdded(event);
        } else {
            // This is a recvonly stream. Clients that implement Unified Plan,
            // such as Firefox use recvonly "streams/channels/tracks" for
            // receiving remote stream/tracks, as opposed to Plan B where there
            // are only 3 channels: audio, video and data.
            logger.log("RECVONLY REMOTE STREAM IGNORED: " + event.stream + " - " + event.stream.id);
        }
    };
    this.peerconnection.onremovestream = function (event) {
        // Remove the stream from remoteStreams
        // FIXME: remotestreamremoved.jingle not defined anywhere(unused)

        $(document).trigger('remotestreamremoved.jingle', [event, self.sid]);
    };
    this.peerconnection.onsignalingstatechange = function (event) {
        if (!(self && self.peerconnection)) return;
        if (self.peerconnection.signalingState === 'stable') {
            self.wasstable = true;
        }
        self.updateModifySourcesQueue();
    };
    /**
     * The oniceconnectionstatechange event handler contains the code to execute when the iceconnectionstatechange event,
     * of type Event, is received by this RTCPeerConnection. Such an event is sent when the value of
     * RTCPeerConnection.iceConnectionState changes.
     *
     * @param event the event containing information about the change
     */
    this.peerconnection.oniceconnectionstatechange = function (event) {
        if (!(self && self.peerconnection)) return;
        logger.log("(TIME) ICE " + self.peerconnection.iceConnectionState +
                    ":\t", window.performance.now());
        self.updateModifySourcesQueue();
        switch (self.peerconnection.iceConnectionState) {
            case 'connected':

                // Informs interested parties that the connection has been restored.
                if (self.peerconnection.signalingState === 'stable' && self.isreconnect)
                    self.room.eventEmitter.emit(XMPPEvents.CONNECTION_RESTORED);
                self.isreconnect = false;

                break;
            case 'disconnected':
                self.isreconnect = true;
                // Informs interested parties that the connection has been interrupted.
                if (self.wasstable)
                    self.room.eventEmitter.emit(XMPPEvents.CONNECTION_INTERRUPTED);
                break;
            case 'failed':
                self.room.eventEmitter.emit(XMPPEvents.CONFERENCE_SETUP_FAILED);
                break;
        }
        onIceConnectionStateChange(self.sid, self);
    };
    this.peerconnection.onnegotiationneeded = function (event) {
        self.room.eventEmitter.emit(XMPPEvents.PEERCONNECTION_READY, self);
    };

    this.relayedStreams.forEach(function(stream) {
        self.peerconnection.addStream(stream);
    });
};

function onIceConnectionStateChange(sid, session) {
    switch (session.peerconnection.iceConnectionState) {
        case 'checking':
            session.timeChecking = (new Date()).getTime();
            session.firstconnect = true;
            break;
        case 'completed': // on caller side
        case 'connected':
            if (session.firstconnect) {
                session.firstconnect = false;
                var metadata = {};
                metadata.setupTime
                    = (new Date()).getTime() - session.timeChecking;
                session.peerconnection.getStats(function (res) {
                    if(res && res.result) {
                        res.result().forEach(function (report) {
                            if (report.type == 'googCandidatePair' &&
                                report.stat('googActiveConnection') == 'true') {
                                metadata.localCandidateType
                                    = report.stat('googLocalCandidateType');
                                metadata.remoteCandidateType
                                    = report.stat('googRemoteCandidateType');

                                // log pair as well so we can get nice pie
                                // charts
                                metadata.candidatePair
                                    = report.stat('googLocalCandidateType') +
                                        ';' +
                                        report.stat('googRemoteCandidateType');

                                if (report.stat('googRemoteAddress').indexOf('[') === 0)
                                {
                                    metadata.ipv6 = true;
                                }
                            }
                        });
                    }
                });
            }
            break;
    }
}

JingleSessionPC.prototype.accept = function () {
    this.state = 'active';

    var pranswer = this.peerconnection.localDescription;
    if (!pranswer || pranswer.type != 'pranswer') {
        return;
    }
    logger.log('going from pranswer to answer');
    if (this.usetrickle) {
        // remove candidates already sent from session-accept
        var lines = SDPUtil.find_lines(pranswer.sdp, 'a=candidate:');
        for (var i = 0; i < lines.length; i++) {
            pranswer.sdp = pranswer.sdp.replace(lines[i] + '\r\n', '');
        }
    }
    while (SDPUtil.find_line(pranswer.sdp, 'a=inactive')) {
        // FIXME: change any inactive to sendrecv or whatever they were originally
        pranswer.sdp = pranswer.sdp.replace('a=inactive', 'a=sendrecv');
    }
    var prsdp = new SDP(pranswer.sdp);
    if (self.webrtcIceTcpDisable) {
        prsdp.removeTcpCandidates = true;
    }
    if (self.webrtcIceUdpDisable) {
        prsdp.removeUdpCandidates = true;
    }
    var accept = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-accept',
            initiator: this.initiator,
            responder: this.responder,
            sid: this.sid });
    // FIXME why do we generate session-accept in 3 different places ?
    prsdp.toJingle(
        accept,
        this.initiator == this.me ? 'initiator' : 'responder');
    var sdp = this.peerconnection.localDescription.sdp;
    while (SDPUtil.find_line(sdp, 'a=inactive')) {
        // FIXME: change any inactive to sendrecv or whatever they were originally
        sdp = sdp.replace('a=inactive', 'a=sendrecv');
    }
    var self = this;
    this.peerconnection.setLocalDescription(new RTCSessionDescription({type: 'answer', sdp: sdp}),
        function () {
            //logger.log('setLocalDescription success');
            self.setLocalDescription();

            SSRCReplacement.processSessionInit(accept);

            self.connection.sendIQ(accept,
                function () {
                    var ack = {};
                    ack.source = 'answer';
                    $(document).trigger('ack.jingle', [self.sid, ack]);
                },
                function (stanza) {
                    var error = ($(stanza).find('error').length) ? {
                        code: $(stanza).find('error').attr('code'),
                        reason: $(stanza).find('error :first')[0].tagName
                    }:{};
                    error.source = 'answer';
                    JingleSessionPC.onJingleError(self.sid, error);
                },
                10000);
        },
        function (e) {
            logger.error('setLocalDescription failed', e);
            self.room.eventEmitter.emit(XMPPEvents.CONFERENCE_SETUP_FAILED);
        }
    );
};

JingleSessionPC.prototype.terminate = function (reason) {
    this.state = 'ended';
    this.reason = reason;
    this.peerconnection.close();
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
};

JingleSessionPC.prototype.active = function () {
    return this.state == 'active';
};

JingleSessionPC.prototype.sendIceCandidate = function (candidate) {
    var self = this;
    if (candidate && !this.lasticecandidate) {
        var ice = SDPUtil.iceparams(this.localSDP.media[candidate.sdpMLineIndex], this.localSDP.session);
        var jcand = SDPUtil.candidateToJingle(candidate.candidate);
        if (!(ice && jcand)) {
            logger.error('failed to get ice && jcand');
            return;
        }
        ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';

        if (jcand.type === 'srflx') {
            this.hadstuncandidate = true;
        } else if (jcand.type === 'relay') {
            this.hadturncandidate = true;
        }

        if (this.usetrickle) {
            if (this.usedrip) {
                if (this.drip_container.length === 0) {
                    // start 20ms callout
                    window.setTimeout(function () {
                        if (self.drip_container.length === 0) return;
                        self.sendIceCandidates(self.drip_container);
                        self.drip_container = [];
                    }, 20);

                }
                this.drip_container.push(candidate);
                return;
            } else {
                self.sendIceCandidate([candidate]);
            }
        }
    } else {
        //logger.log('sendIceCandidate: last candidate.');
        if (!this.usetrickle) {
            //logger.log('should send full offer now...');
            //FIXME why do we generate session-accept in 3 different places ?
            var init = $iq({to: this.peerjid,
                type: 'set'})
                .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                    action: this.peerconnection.localDescription.type == 'offer' ? 'session-initiate' : 'session-accept',
                    initiator: this.initiator,
                    sid: this.sid});
            this.localSDP = new SDP(this.peerconnection.localDescription.sdp);
            if (self.webrtcIceTcpDisable) {
                this.localSDP.removeTcpCandidates = true;
            }
            if (self.webrtcIceUdpDisable) {
                this.localSDP.removeUdpCandidates = true;
            }
            var sendJingle = function (ssrc) {
                if(!ssrc)
                    ssrc = {};
                self.localSDP.toJingle(
                    init,
                    self.initiator == self.me ? 'initiator' : 'responder',
                    ssrc);

                SSRCReplacement.processSessionInit(init);

                self.connection.sendIQ(init,
                    function () {
                        //logger.log('session initiate ack');
                        var ack = {};
                        ack.source = 'offer';
                        $(document).trigger('ack.jingle', [self.sid, ack]);
                    },
                    function (stanza) {
                        self.state = 'error';
                        self.peerconnection.close();
                        var error = ($(stanza).find('error').length) ? {
                            code: $(stanza).find('error').attr('code'),
                            reason: $(stanza).find('error :first')[0].tagName,
                        }:{};
                        error.source = 'offer';
                        JingleSessionPC.onJingleError(self.sid, error);
                    },
                    10000);
            };
            sendJingle();
        }
        this.lasticecandidate = true;
        logger.log('Have we encountered any srflx candidates? ' + this.hadstuncandidate);
        logger.log('Have we encountered any relay candidates? ' + this.hadturncandidate);

        if (!(this.hadstuncandidate || this.hadturncandidate) && this.peerconnection.signalingState != 'closed') {
            $(document).trigger('nostuncandidates.jingle', [this.sid]);
        }
    }
};

JingleSessionPC.prototype.sendIceCandidates = function (candidates) {
    logger.log('sendIceCandidates', candidates);
    var cand = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'transport-info',
            initiator: this.initiator,
            sid: this.sid});
    for (var mid = 0; mid < this.localSDP.media.length; mid++) {
        var cands = candidates.filter(function (el) { return el.sdpMLineIndex == mid; });
        var mline = SDPUtil.parse_mline(this.localSDP.media[mid].split('\r\n')[0]);
        if (cands.length > 0) {
            var ice = SDPUtil.iceparams(this.localSDP.media[mid], this.localSDP.session);
            ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
            cand.c('content', {creator: this.initiator == this.me ? 'initiator' : 'responder',
                name: (cands[0].sdpMid? cands[0].sdpMid : mline.media)
            }).c('transport', ice);
            for (var i = 0; i < cands.length; i++) {
                cand.c('candidate', SDPUtil.candidateToJingle(cands[i].candidate)).up();
            }
            // add fingerprint
            if (SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session)) {
                var tmp = SDPUtil.parse_fingerprint(SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session));
                tmp.required = true;
                cand.c(
                    'fingerprint',
                    {xmlns: 'urn:xmpp:jingle:apps:dtls:0'})
                    .t(tmp.fingerprint);
                delete tmp.fingerprint;
                cand.attrs(tmp);
                cand.up();
            }
            cand.up(); // transport
            cand.up(); // content
        }
    }
    // might merge last-candidate notification into this, but it is called alot later. See webrtc issue #2340
    //logger.log('was this the last candidate', this.lasticecandidate);
    this.connection.sendIQ(cand,
        function () {
            var ack = {};
            ack.source = 'transportinfo';
            $(document).trigger('ack.jingle', [this.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            error.source = 'transportinfo';
            JingleSessionPC.onJingleError(this.sid, error);
        },
        10000);
};


JingleSessionPC.prototype.sendOffer = function () {
    //logger.log('sendOffer...');
    var self = this;
    this.peerconnection.createOffer(function (sdp) {
            self.createdOffer(sdp);
        },
        function (e) {
            logger.error('createOffer failed', e);
        },
        this.media_constraints
    );
};

// FIXME createdOffer is never used in jitsi-meet
JingleSessionPC.prototype.createdOffer = function (sdp) {
    //logger.log('createdOffer', sdp);
    var self = this;
    this.localSDP = new SDP(sdp.sdp);
    //this.localSDP.mangle();
    var sendJingle = function () {
        var init = $iq({to: this.peerjid,
            type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                action: 'session-initiate',
                initiator: this.initiator,
                sid: this.sid});
        self.localSDP.toJingle(
            init,
            this.initiator == this.me ? 'initiator' : 'responder');

        SSRCReplacement.processSessionInit(init);

        self.connection.sendIQ(init,
            function () {
                var ack = {};
                ack.source = 'offer';
                $(document).trigger('ack.jingle', [self.sid, ack]);
            },
            function (stanza) {
                self.state = 'error';
                self.peerconnection.close();
                var error = ($(stanza).find('error').length) ? {
                    code: $(stanza).find('error').attr('code'),
                    reason: $(stanza).find('error :first')[0].tagName,
                }:{};
                error.source = 'offer';
                JingleSessionPC.onJingleError(self.sid, error);
            },
            10000);
    }
    sdp.sdp = this.localSDP.raw;
    this.peerconnection.setLocalDescription(sdp,
        function () {
            if(self.usetrickle)
            {
                sendJingle();
            }
            self.setLocalDescription();
            //logger.log('setLocalDescription success');
        },
        function (e) {
            logger.error('setLocalDescription failed', e);
            self.room.eventEmitter.emit(XMPPEvents.CONFERENCE_SETUP_FAILED);
        }
    );
    var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
    for (var i = 0; i < cands.length; i++) {
        var cand = SDPUtil.parse_icecandidate(cands[i]);
        if (cand.type == 'srflx') {
            this.hadstuncandidate = true;
        } else if (cand.type == 'relay') {
            this.hadturncandidate = true;
        }
    }
};

JingleSessionPC.prototype.readSsrcInfo = function (contents) {
    var self = this;
    $(contents).each(function (idx, content) {
        var name = $(content).attr('name');
        var mediaType = this.getAttribute('name');
        var ssrcs = $(content).find('description>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
        ssrcs.each(function () {
            var ssrc = this.getAttribute('ssrc');
            $(this).find('>ssrc-info[xmlns="http://jitsi.org/jitmeet"]').each(
                function () {
                    var owner = this.getAttribute('owner');
                    self.ssrcOwners[ssrc] = owner;
                }
            );
        });
    });
};

/**
 * Returns the SSRC of local audio stream.
 * @param mediaType 'audio' or 'video' media type
 * @returns {*} the SSRC number of local audio or video stream.
 */
JingleSessionPC.prototype.getLocalSSRC = function (mediaType) {
    return this.localStreamsSSRC[mediaType];
};

JingleSessionPC.prototype.getSsrcOwner = function (ssrc) {
    return this.ssrcOwners[ssrc];
};

JingleSessionPC.prototype.setRemoteDescription = function (elem, desctype) {
    //logger.log('setting remote description... ', desctype);
    this.remoteSDP = new SDP('');
    if (self.webrtcIceTcpDisable) {
        this.remoteSDP.removeTcpCandidates = true;
    }
    if (self.webrtcIceUdpDisable) {
        this.remoteSDP.removeUdpCandidates = true;
    }

    this.remoteSDP.fromJingle(elem);
    this.readSsrcInfo($(elem).find(">content"));
    if (this.peerconnection.remoteDescription) {
        logger.log('setRemoteDescription when remote description is not null, should be pranswer', this.peerconnection.remoteDescription);
        if (this.peerconnection.remoteDescription.type == 'pranswer') {
            var pranswer = new SDP(this.peerconnection.remoteDescription.sdp);
            for (var i = 0; i < pranswer.media.length; i++) {
                // make sure we have ice ufrag and pwd
                if (!SDPUtil.find_line(this.remoteSDP.media[i], 'a=ice-ufrag:', this.remoteSDP.session)) {
                    if (SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session)) {
                        this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session) + '\r\n';
                    } else {
                        logger.warn('no ice ufrag?');
                    }
                    if (SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session)) {
                        this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session) + '\r\n';
                    } else {
                        logger.warn('no ice pwd?');
                    }
                }
                // copy over candidates
                var lines = SDPUtil.find_lines(pranswer.media[i], 'a=candidate:');
                for (var j = 0; j < lines.length; j++) {
                    this.remoteSDP.media[i] += lines[j] + '\r\n';
                }
            }
            this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');
        }
    }
    var remotedesc = new RTCSessionDescription({type: desctype, sdp: this.remoteSDP.raw});

    this.peerconnection.setRemoteDescription(remotedesc,
        function () {
            //logger.log('setRemoteDescription success');
        },
        function (e) {
            logger.error('setRemoteDescription error', e);
            JingleSessionPC.onJingleFatalError(self, e);
        }
    );
};

/**
 * Adds remote ICE candidates to this Jingle session.
 * @param elem An array of Jingle "content" elements?
 */
JingleSessionPC.prototype.addIceCandidate = function (elem) {
    var self = this;
    if (this.peerconnection.signalingState == 'closed') {
        return;
    }
    if (!this.peerconnection.remoteDescription && this.peerconnection.signalingState == 'have-local-offer') {
        logger.log('trickle ice candidate arriving before session accept...');
        // create a PRANSWER for setRemoteDescription
        if (!this.remoteSDP) {
            var cobbled = 'v=0\r\n' +
                'o=- 1923518516 2 IN IP4 0.0.0.0\r\n' +// FIXME
                's=-\r\n' +
                't=0 0\r\n';
            // first, take some things from the local description
            for (var i = 0; i < this.localSDP.media.length; i++) {
                cobbled += SDPUtil.find_line(this.localSDP.media[i], 'm=') + '\r\n';
                cobbled += SDPUtil.find_lines(this.localSDP.media[i], 'a=rtpmap:').join('\r\n') + '\r\n';
                if (SDPUtil.find_line(this.localSDP.media[i], 'a=mid:')) {
                    cobbled += SDPUtil.find_line(this.localSDP.media[i], 'a=mid:') + '\r\n';
                }
                cobbled += 'a=inactive\r\n';
            }
            this.remoteSDP = new SDP(cobbled);
        }
        // then add things like ice and dtls from remote candidate
        elem.each(function () {
            for (var i = 0; i < self.remoteSDP.media.length; i++) {
                if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                    self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    if (!SDPUtil.find_line(self.remoteSDP.media[i], 'a=ice-ufrag:')) {
                        var tmp = $(this).find('transport');
                        self.remoteSDP.media[i] += 'a=ice-ufrag:' + tmp.attr('ufrag') + '\r\n';
                        self.remoteSDP.media[i] += 'a=ice-pwd:' + tmp.attr('pwd') + '\r\n';
                        tmp = $(this).find('transport>fingerprint');
                        if (tmp.length) {
                            self.remoteSDP.media[i] += 'a=fingerprint:' + tmp.attr('hash') + ' ' + tmp.text() + '\r\n';
                        } else {
                            logger.log('no dtls fingerprint (webrtc issue #1718?)');
                            self.remoteSDP.media[i] += 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD\r\n';
                        }
                        break;
                    }
                }
            }
        });
        this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');

        // we need a complete SDP with ice-ufrag/ice-pwd in all parts
        // this makes the assumption that the PRANSWER is constructed such that the ice-ufrag is in all mediaparts
        // but it could be in the session part as well. since the code above constructs this sdp this can't happen however
        var iscomplete = this.remoteSDP.media.filter(function (mediapart) {
            return SDPUtil.find_line(mediapart, 'a=ice-ufrag:');
        }).length == this.remoteSDP.media.length;

        if (iscomplete) {
            logger.log('setting pranswer');
            try {
                this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'pranswer', sdp: this.remoteSDP.raw }),
                    function() {
                    },
                    function(e) {
                        logger.log('setRemoteDescription pranswer failed', e.toString());
                    });
            } catch (e) {
                logger.error('setting pranswer failed', e);
            }
        } else {
            //logger.log('not yet setting pranswer');
        }
    }
    // operate on each content element
    elem.each(function () {
        // would love to deactivate this, but firefox still requires it
        var idx = -1;
        var i;
        for (i = 0; i < self.remoteSDP.media.length; i++) {
            if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                idx = i;
                break;
            }
        }
        if (idx == -1) { // fall back to localdescription
            for (i = 0; i < self.localSDP.media.length; i++) {
                if (SDPUtil.find_line(self.localSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                    self.localSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    idx = i;
                    break;
                }
            }
        }
        var name = $(this).attr('name');
        // TODO: check ice-pwd and ice-ufrag?
        $(this).find('transport>candidate').each(function () {
            var line, candidate;
            var protocol = this.getAttribute('protocol');
            protocol =
                (typeof protocol === 'string') ? protocol.toLowerCase() : '';
            if ((self.webrtcIceTcpDisable && protocol == 'tcp') ||
                (self.webrtcIceUdpDisable && protocol == 'udp')) {
                return;
            }

            line = SDPUtil.candidateFromJingle(this);
            candidate = new RTCIceCandidate({sdpMLineIndex: idx,
                sdpMid: name,
                candidate: line});
            try {
                self.peerconnection.addIceCandidate(candidate);
            } catch (e) {
                logger.error('addIceCandidate failed', e.toString(), line);
            }
        });
    });
};

JingleSessionPC.prototype.sendAnswer = function (provisional) {
    //logger.log('createAnswer', provisional);
    var self = this;
    this.peerconnection.createAnswer(
        function (sdp) {
            self.createdAnswer(sdp, provisional);
        },
        function (e) {
            logger.error('createAnswer failed', e);
            self.room.eventEmitter.emit(XMPPEvents.CONFERENCE_SETUP_FAILED);
        },
        this.media_constraints
    );
};

JingleSessionPC.prototype.createdAnswer = function (sdp, provisional) {
    //logger.log('createAnswer callback');
    var self = this;
    this.localSDP = new SDP(sdp.sdp);
    //this.localSDP.mangle();
    this.usepranswer = provisional === true;
    if (this.usetrickle) {
        if (this.usepranswer) {
            sdp.type = 'pranswer';
            for (var i = 0; i < this.localSDP.media.length; i++) {
                this.localSDP.media[i] = this.localSDP.media[i].replace('a=sendrecv\r\n', 'a=inactive\r\n');
            }
            this.localSDP.raw = this.localSDP.session + '\r\n' + this.localSDP.media.join('');
        }
    }
    var self = this;
    var sendJingle = function (ssrcs) {
                // FIXME why do we generate session-accept in 3 different places ?
                var accept = $iq({to: self.peerjid,
                    type: 'set'})
                    .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                        action: 'session-accept',
                        initiator: self.initiator,
                        responder: self.responder,
                        sid: self.sid });
                if (self.webrtcIceTcpDisable) {
                    self.localSDP.removeTcpCandidates = true;
                }
                if (self.webrtcIceUdpDisable) {
                    self.localSDP.removeUdpCandidates = true;
                }
                self.localSDP.toJingle(
                    accept,
                    self.initiator == self.me ? 'initiator' : 'responder',
                    ssrcs);

                SSRCReplacement.processSessionInit(accept);

                self.connection.sendIQ(accept,
                    function () {
                        var ack = {};
                        ack.source = 'answer';
                        $(document).trigger('ack.jingle', [self.sid, ack]);
                    },
                    function (stanza) {
                        var error = ($(stanza).find('error').length) ? {
                            code: $(stanza).find('error').attr('code'),
                            reason: $(stanza).find('error :first')[0].tagName,
                        }:{};
                        error.source = 'answer';
                        JingleSessionPC.onJingleError(self.sid, error);
                    },
                    10000);
    }
    sdp.sdp = this.localSDP.raw;
    this.peerconnection.setLocalDescription(sdp,
        function () {

            //logger.log('setLocalDescription success');
            if (self.usetrickle && !self.usepranswer) {
                sendJingle();
            }
            self.setLocalDescription();
        },
        function (e) {
            logger.error('setLocalDescription failed', e);
            self.room.eventEmitter.emit(XMPPEvents.CONFERENCE_SETUP_FAILED);
        }
    );
    var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
    for (var j = 0; j < cands.length; j++) {
        var cand = SDPUtil.parse_icecandidate(cands[j]);
        if (cand.type == 'srflx') {
            this.hadstuncandidate = true;
        } else if (cand.type == 'relay') {
            this.hadturncandidate = true;
        }
    }
};

JingleSessionPC.prototype.sendTerminate = function (reason, text) {
    var self = this,
        term = $iq({to: this.peerjid,
            type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                action: 'session-terminate',
                initiator: this.initiator,
                sid: this.sid})
            .c('reason')
            .c(reason || 'success');

    if (text) {
        term.up().c('text').t(text);
    }

    this.connection.sendIQ(term,
        function () {
            self.peerconnection.close();
            self.peerconnection = null;
            self.terminate();
            var ack = {};
            ack.source = 'terminate';
            $(document).trigger('ack.jingle', [self.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            $(document).trigger('ack.jingle', [self.sid, error]);
        },
        10000);
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
};

/**
 * Handles a Jingle source-add message for this Jingle session.
 * @param elem An array of Jingle "content" elements.
 */
JingleSessionPC.prototype.addSource = function (elem) {

    var self = this;
    // FIXME: dirty waiting
    if (!this.peerconnection.localDescription)
    {
        logger.warn("addSource - localDescription not ready yet")
        setTimeout(function()
            {
                self.addSource(elem);
            },
            200
        );
        return;
    }

    logger.log('addssrc', new Date().getTime());
    logger.log('ice', this.peerconnection.iceConnectionState);

    this.readSsrcInfo(elem);

    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);
    var mySdp = new SDP(this.peerconnection.localDescription.sdp);

    $(elem).each(function (idx, content) {
        var name = $(content).attr('name');
        var lines = '';
        $(content).find('ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
            var semantics = this.getAttribute('semantics');
            var ssrcs = $(this).find('>source').map(function () {
                return this.getAttribute('ssrc');
            }).get();

            if (ssrcs.length) {
                lines += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
            }
        });
        var tmp = $(content).find('source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]'); // can handle both >source and >description>source
        tmp.each(function () {
            var ssrc = $(this).attr('ssrc');
            if(mySdp.containsSSRC(ssrc)){
                /**
                 * This happens when multiple participants change their streams at the same time and
                 * ColibriFocus.modifySources have to wait for stable state. In the meantime multiple
                 * addssrc are scheduled for update IQ. See
                 */
                logger.warn("Got add stream request for my own ssrc: "+ssrc);
                return;
            }
            if (sdp.containsSSRC(ssrc)) {
                logger.warn("Source-add request for existing SSRC: " + ssrc);
                return;
            }
            $(this).find('>parameter').each(function () {
                lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                if ($(this).attr('value') && $(this).attr('value').length)
                    lines += ':' + $(this).attr('value');
                lines += '\r\n';
            });
        });
        sdp.media.forEach(function(media, idx) {
            if (!SDPUtil.find_line(media, 'a=mid:' + name))
                return;
            sdp.media[idx] += lines;
            if (!self.addssrc[idx]) self.addssrc[idx] = '';
            self.addssrc[idx] += lines;
        });
        sdp.raw = sdp.session + sdp.media.join('');
    });

    this.modifySourcesQueue.push(function() {
        // When a source is added and if this is FF, a new channel is allocated
        // for receiving the added source. We need to diffuse the SSRC of this
        // new recvonly channel to the rest of the peers.
        logger.log('modify sources done');

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        logger.log("SDPs", mySdp, newSdp);
        self.notifyMySSRCUpdate(mySdp, newSdp);
    });
};

/**
 * Handles a Jingle source-remove message for this Jingle session.
 * @param elem An array of Jingle "content" elements.
 */
JingleSessionPC.prototype.removeSource = function (elem) {

    var self = this;
    // FIXME: dirty waiting
    if (!this.peerconnection.localDescription) {
        logger.warn("removeSource - localDescription not ready yet");
        setTimeout(function() {
                self.removeSource(elem);
            },
            200
        );
        return;
    }

    logger.log('removessrc', new Date().getTime());
    logger.log('ice', this.peerconnection.iceConnectionState);
    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);
    var mySdp = new SDP(this.peerconnection.localDescription.sdp);

    $(elem).each(function (idx, content) {
        var name = $(content).attr('name');
        var lines = '';
        $(content).find('ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
            var semantics = this.getAttribute('semantics');
            var ssrcs = $(this).find('>source').map(function () {
                return this.getAttribute('ssrc');
            }).get();

            if (ssrcs.length) {
                lines += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
            }
        });
        var tmp = $(content).find('source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]'); // can handle both >source and >description>source
        tmp.each(function () {
            var ssrc = $(this).attr('ssrc');
            // This should never happen, but can be useful for bug detection
            if(mySdp.containsSSRC(ssrc)){
                logger.error("Got remove stream request for my own ssrc: "+ssrc);
                return;
            }
            $(this).find('>parameter').each(function () {
                lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                if ($(this).attr('value') && $(this).attr('value').length)
                    lines += ':' + $(this).attr('value');
                lines += '\r\n';
            });
        });
        sdp.media.forEach(function(media, idx) {
            if (!SDPUtil.find_line(media, 'a=mid:' + name))
                return;
            sdp.media[idx] += lines;
            if (!self.removessrc[idx]) self.removessrc[idx] = '';
            self.removessrc[idx] += lines;
        });
        sdp.raw = sdp.session + sdp.media.join('');
    });

    this.modifySourcesQueue.push(function() {
        // When a source is removed and if this is FF, the recvonly channel that
        // receives the remote stream is deactivated . We need to diffuse the
        // recvonly SSRC removal to the rest of the peers.
        logger.log('modify sources done');

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        logger.log("SDPs", mySdp, newSdp);
        self.notifyMySSRCUpdate(mySdp, newSdp);
    });
};

JingleSessionPC.prototype._modifySources = function (successCallback, queueCallback) {
    var self = this;

    if (this.peerconnection.signalingState == 'closed') return;
    if (!(this.addssrc.length || this.removessrc.length || this.pendingop !== null
        || this.switchstreams || this.addingStreams)){
        // There is nothing to do since scheduled job might have been executed by another succeeding call
        this.setLocalDescription();
        if(successCallback){
            successCallback();
        }
        queueCallback();
        return;
    }

    // Reset switch streams flags
    this.switchstreams = false;
    this.addingStreams = false;

    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

    // add sources
    this.addssrc.forEach(function(lines, idx) {
        sdp.media[idx] += lines;
    });
    this.addssrc = [];

    // remove sources
    this.removessrc.forEach(function(lines, idx) {
        lines = lines.split('\r\n');
        lines.pop(); // remove empty last element;
        lines.forEach(function(line) {
            sdp.media[idx] = sdp.media[idx].replace(line + '\r\n', '');
        });
    });
    this.removessrc = [];

    sdp.raw = sdp.session + sdp.media.join('');
    this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'offer', sdp: sdp.raw}),
        function() {

            if(self.signalingState == 'closed') {
                logger.error("createAnswer attempt on closed state");
                queueCallback("createAnswer attempt on closed state");
                return;
            }

            self.peerconnection.createAnswer(
                function(modifiedAnswer) {
                    // change video direction, see https://github.com/jitsi/jitmeet/issues/41
                    if (self.pendingop !== null) {
                        var sdp = new SDP(modifiedAnswer.sdp);
                        if (sdp.media.length > 1) {
                            switch(self.pendingop) {
                                case 'mute':
                                    sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                                    break;
                                case 'unmute':
                                    sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');
                                    break;
                            }
                            sdp.raw = sdp.session + sdp.media.join('');
                            modifiedAnswer.sdp = sdp.raw;
                        }
                        self.pendingop = null;
                    }

                    // FIXME: pushing down an answer while ice connection state
                    // is still checking is bad...
                    //logger.log(self.peerconnection.iceConnectionState);

                    // trying to work around another chrome bug
                    //modifiedAnswer.sdp = modifiedAnswer.sdp.replace(/a=setup:active/g, 'a=setup:actpass');
                    self.peerconnection.setLocalDescription(modifiedAnswer,
                        function() {
                            //logger.log('modified setLocalDescription ok');
                            self.setLocalDescription();
                            if(successCallback){
                                successCallback();
                            }
                            queueCallback();
                        },
                        function(error) {
                            logger.error('modified setLocalDescription failed', error);
                            queueCallback(error);
                        }
                    );
                },
                function(error) {
                    logger.error('modified answer failed', error);
                    queueCallback(error);
                }
            );
        },
        function(error) {
            logger.error('modify failed', error);
            queueCallback(error);
        }
    );
};


/**
 * Switches video streams.
 * @param newStream new stream that will be used as video of this session.
 * @param oldStream old video stream of this session.
 * @param successCallback callback executed after successful stream switch.
 * @param isAudio whether the streams are audio (if true) or video (if false).
 */
JingleSessionPC.prototype.switchStreams =
    function (newStream, oldStream, successCallback, isAudio) {
    var self = this;
    var sender, newTrack;
    var senderKind = isAudio ? 'audio' : 'video';
    // Remember SDP to figure out added/removed SSRCs
    var oldSdp = null;

    if (self.peerconnection) {
        if (self.peerconnection.localDescription) {
            oldSdp = new SDP(self.peerconnection.localDescription.sdp);
        }
        if (RTCBrowserType.getBrowserType() ===
                RTCBrowserType.RTC_BROWSER_FIREFOX) {
            // On Firefox we don't replace MediaStreams as this messes up the
            // m-lines (which can't be removed in Plan Unified) and brings a lot
            // of complications. Instead, we use the RTPSender and replace just
            // the track.

            // Find the right sender (for audio or video)
            self.peerconnection.peerconnection.getSenders().some(function (s) {
                if (s.track && s.track.kind === senderKind) {
                    sender = s;
                    return true;
                }
            });

            if (sender) {
                // We assume that our streams have a single track, either audio
                // or video.
                newTrack = isAudio ? newStream.getAudioTracks()[0] :
                    newStream.getVideoTracks()[0];
                sender.replaceTrack(newTrack)
                    .then(function() {
                        console.log("Replaced a track, isAudio=" + isAudio);
                    })
                    .catch(function(err) {
                        console.log("Failed to replace a track: " + err);
                    });
            } else {
                console.log("Cannot switch tracks: no RTPSender.");
            }
        } else {
            self.peerconnection.removeStream(oldStream, true);
            if (newStream) {
                self.peerconnection.addStream(newStream);
            }
        }
    }

    // Conference is not active
    if (!oldSdp) {
        successCallback();
        return;
    }

    self.switchstreams = true;
    self.modifySourcesQueue.push(function() {
        logger.log('modify sources done');

        successCallback();

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        logger.log("SDPs", oldSdp, newSdp);
        self.notifyMySSRCUpdate(oldSdp, newSdp);
    });
};

/**
 * Adds streams.
 * @param stream new stream that will be added.
 * @param success_callback callback executed after successful stream addition.
 */
JingleSessionPC.prototype.addStream = function (stream, callback) {

    var self = this;

    // Remember SDP to figure out added/removed SSRCs
    var oldSdp = null;
    if(this.peerconnection) {
        if(this.peerconnection.localDescription) {
            oldSdp = new SDP(this.peerconnection.localDescription.sdp);
        }
        if(stream)
            this.peerconnection.addStream(stream);
    }

    // Conference is not active
    if(!oldSdp || !this.peerconnection) {
        callback();
        return;
    }

    this.addingStreams = true;
    this.modifySourcesQueue.push(function() {
        logger.log('modify sources done');

        callback();

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        logger.log("SDPs", oldSdp, newSdp);
        self.notifyMySSRCUpdate(oldSdp, newSdp);
    });
}

/**
 * Remove streams.
 * @param stream stream that will be removed.
 * @param success_callback callback executed after successful stream addition.
 */
JingleSessionPC.prototype.removeStream = function (stream, callback) {

    var self = this;

    // Remember SDP to figure out added/removed SSRCs
    var oldSdp = null;
    if(this.peerconnection) {
        if(this.peerconnection.localDescription) {
            oldSdp = new SDP(this.peerconnection.localDescription.sdp);
        }
        if(stream)
            this.peerconnection.removeStream(stream);
    }

    // Conference is not active
    if(!oldSdp || !this.peerconnection) {
        callback();
        return;
    }

    this.addingStreams = true;
    this.modifySourcesQueue.push(function() {
        logger.log('modify sources done');

        callback();

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        logger.log("SDPs", oldSdp, newSdp);
        self.notifyMySSRCUpdate(oldSdp, newSdp);
    });
}

/**
 * Figures out added/removed ssrcs and send update IQs.
 * @param old_sdp SDP object for old description.
 * @param new_sdp SDP object for new description.
 */
JingleSessionPC.prototype.notifyMySSRCUpdate = function (old_sdp, new_sdp) {

    if (!(this.peerconnection.signalingState == 'stable' &&
        this.peerconnection.iceConnectionState == 'connected')){
        logger.log("Too early to send updates");
        return;
    }

    // send source-remove IQ.
    sdpDiffer = new SDPDiffer(new_sdp, old_sdp);
    var remove = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {
            xmlns: 'urn:xmpp:jingle:1',
            action: 'source-remove',
            initiator: this.initiator,
            sid: this.sid
        }
    );
    var removed = sdpDiffer.toJingle(remove);

    // Let 'source-remove' IQ through the hack and see if we're allowed to send
    // it in the current form
    if (removed)
        remove = SSRCReplacement.processSourceRemove(remove);

    if (removed && remove) {
        logger.info("Sending source-remove", remove);
        this.connection.sendIQ(remove,
            function (res) {
                logger.info('got remove result', res);
            },
            function (err) {
                logger.error('got remove error', err);
            }
        );
    } else {
        logger.log('removal not necessary');
    }

    // send source-add IQ.
    var sdpDiffer = new SDPDiffer(old_sdp, new_sdp);
    var add = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {
            xmlns: 'urn:xmpp:jingle:1',
            action: 'source-add',
            initiator: this.initiator,
            sid: this.sid
        }
    );
    var added = sdpDiffer.toJingle(add);

    // Let 'source-add' IQ through the hack and see if we're allowed to send
    // it in the current form
    if (added)
        add = SSRCReplacement.processSourceAdd(add);

    if (added && add) {
        logger.info("Sending source-add", add);
        this.connection.sendIQ(add,
            function (res) {
                logger.info('got add result', res);
            },
            function (err) {
                logger.error('got add error', err);
            }
        );
    } else {
        logger.log('addition not necessary');
    }
};

/**
 * Mutes/unmutes the (local) video i.e. enables/disables all video tracks.
 *
 * @param mute <tt>true</tt> to mute the (local) video i.e. to disable all video
 * tracks; otherwise, <tt>false</tt>
 * @param callback a function to be invoked with <tt>mute</tt> after all video
 * tracks have been enabled/disabled. The function may, optionally, return
 * another function which is to be invoked after the whole mute/unmute operation
 * has completed successfully.
 * @param options an object which specifies optional arguments such as the
 * <tt>boolean</tt> key <tt>byUser</tt> with default value <tt>true</tt> which
 * specifies whether the method was initiated in response to a user command (in
 * contrast to an automatic decision made by the application logic)
 */
JingleSessionPC.prototype.setVideoMute = function (mute, callback, options) {
    var byUser;

    if (options) {
        byUser = options.byUser;
        if (typeof byUser === 'undefined') {
            byUser = true;
        }
    } else {
        byUser = true;
    }
    // The user's command to mute the (local) video takes precedence over any
    // automatic decision made by the application logic.
    if (byUser) {
        this.videoMuteByUser = mute;
    } else if (this.videoMuteByUser) {
        return;
    }

    this.hardMuteVideo(mute);

    var self = this;
    var oldSdp = null;
    if(self.peerconnection) {
        if(self.peerconnection.localDescription) {
            oldSdp = new SDP(self.peerconnection.localDescription.sdp);
        }
    }

    this.modifySourcesQueue.push(function() {
        logger.log('modify sources done');

        callback(mute);

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        logger.log("SDPs", oldSdp, newSdp);
        self.notifyMySSRCUpdate(oldSdp, newSdp);
    });
};

JingleSessionPC.prototype.hardMuteVideo = function (muted) {
    this.pendingop = muted ? 'mute' : 'unmute';
};

JingleSessionPC.prototype.sendMute = function (muted, content) {
    var info = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-info',
            initiator: this.initiator,
            sid: this.sid });
    info.c(muted ? 'mute' : 'unmute', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
    info.attrs({'creator': this.me == this.initiator ? 'creator' : 'responder'});
    if (content) {
        info.attrs({'name': content});
    }
    this.connection.send(info);
};

JingleSessionPC.prototype.sendRinging = function () {
    var info = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-info',
            initiator: this.initiator,
            sid: this.sid });
    info.c('ringing', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
    this.connection.send(info);
};

JingleSessionPC.prototype.getStats = function (interval) {
    var self = this;
    var recv = {audio: 0, video: 0};
    var lost = {audio: 0, video: 0};
    var lastrecv = {audio: 0, video: 0};
    var lastlost = {audio: 0, video: 0};
    var loss = {audio: 0, video: 0};
    var delta = {audio: 0, video: 0};
    this.statsinterval = window.setInterval(function () {
        if (self && self.peerconnection && self.peerconnection.getStats) {
            self.peerconnection.getStats(function (stats) {
                var results = stats.result();
                // TODO: there are so much statistics you can get from this..
                for (var i = 0; i < results.length; ++i) {
                    if (results[i].type == 'ssrc') {
                        var packetsrecv = results[i].stat('packetsReceived');
                        var packetslost = results[i].stat('packetsLost');
                        if (packetsrecv && packetslost) {
                            packetsrecv = parseInt(packetsrecv, 10);
                            packetslost = parseInt(packetslost, 10);

                            if (results[i].stat('googFrameRateReceived')) {
                                lastlost.video = lost.video;
                                lastrecv.video = recv.video;
                                recv.video = packetsrecv;
                                lost.video = packetslost;
                            } else {
                                lastlost.audio = lost.audio;
                                lastrecv.audio = recv.audio;
                                recv.audio = packetsrecv;
                                lost.audio = packetslost;
                            }
                        }
                    }
                }
                delta.audio = recv.audio - lastrecv.audio;
                delta.video = recv.video - lastrecv.video;
                loss.audio = (delta.audio > 0) ? Math.ceil(100 * (lost.audio - lastlost.audio) / delta.audio) : 0;
                loss.video = (delta.video > 0) ? Math.ceil(100 * (lost.video - lastlost.video) / delta.video) : 0;
                $(document).trigger('packetloss.jingle', [self.sid, loss]);
            });
        }
    }, interval || 3000);
    return this.statsinterval;
};

JingleSessionPC.onJingleError = function (session, error)
{
    logger.error("Jingle error", error);
}

JingleSessionPC.onJingleFatalError = function (session, error)
{
    this.room.eventEmitter.emit(XMPPEvents.CONFERENCE_SETUP_FAILED);
    this.room.eventEmitter.emit(XMPPEvents.JINGLE_FATAL_ERROR, session, error);
}

JingleSessionPC.prototype.setLocalDescription = function () {
    var self = this;
    var newssrcs = [];
    if(!this.peerconnection.localDescription)
        return;
    var session = transform.parse(this.peerconnection.localDescription.sdp);
    var i;
    session.media.forEach(function (media) {

        if (media.ssrcs && media.ssrcs.length > 0) {
            // TODO(gp) maybe exclude FID streams?
            media.ssrcs.forEach(function (ssrc) {
                if (ssrc.attribute !== 'cname') {
                    return;
                }
                newssrcs.push({
                    'ssrc': ssrc.id,
                    'type': media.type
                });
                // FIXME allows for only one SSRC per media type
                self.localStreamsSSRC[media.type] = ssrc.id;
            });
        }

    });

    logger.log('new ssrcs', newssrcs);

    // Bind us as local SSRCs owner
    if (newssrcs.length > 0) {
        for (i = 0; i < newssrcs.length; i++) {
            var ssrc = newssrcs[i].ssrc;
            var myJid = self.me;
            self.ssrcOwners[ssrc] = myJid;
        }
    }
}

// an attempt to work around https://github.com/jitsi/jitmeet/issues/32
JingleSessionPC.prototype.sendKeyframe = function () {
    var pc = this.peerconnection;
    logger.log('sendkeyframe', pc.iceConnectionState);
    if (pc.iceConnectionState !== 'connected') return; // safe...
    var self = this;
    pc.setRemoteDescription(
        pc.remoteDescription,
        function () {
            pc.createAnswer(
                function (modifiedAnswer) {
                    pc.setLocalDescription(
                        modifiedAnswer,
                        function () {
                            // noop
                        },
                        function (error) {
                            logger.log('triggerKeyframe setLocalDescription failed', error);
                            self.room.eventEmitter.emit(XMPPEvents.SET_LOCAL_DESCRIPTION_ERROR);
                        }
                    );
                },
                function (error) {
                    logger.log('triggerKeyframe createAnswer failed', error);
                    self.room.eventEmitter.emit(XMPPEvents.CREATE_ANSWER_ERROR);
                }
            );
        },
        function (error) {
            logger.log('triggerKeyframe setRemoteDescription failed', error);
            eventEmitter.emit(XMPPEvents.SET_REMOTE_DESCRIPTION_ERROR);
        }
    );
}


JingleSessionPC.prototype.remoteStreamAdded = function (data, times) {
    var self = this;
    var thessrc;
    var streamId = RTC.getStreamID(data.stream);

    // look up an associated JID for a stream id
    if (!streamId) {
        logger.error("No stream ID for", data.stream);
    } else if (streamId && streamId.indexOf('mixedmslabel') === -1) {
        // look only at a=ssrc: and _not_ at a=ssrc-group: lines

        var ssrclines = this.peerconnection.remoteDescription?
            SDPUtil.find_lines(this.peerconnection.remoteDescription.sdp, 'a=ssrc:') : [];
        ssrclines = ssrclines.filter(function (line) {
            // NOTE(gp) previously we filtered on the mslabel, but that property
            // is not always present.
            // return line.indexOf('mslabel:' + data.stream.label) !== -1;

            if (RTCBrowserType.isTemasysPluginUsed()) {
                return ((line.indexOf('mslabel:' + streamId) !== -1));
            } else {
                return ((line.indexOf('msid:' + streamId) !== -1));
            }
        });
        if (ssrclines.length) {
            thessrc = ssrclines[0].substring(7).split(' ')[0];

            if (!self.ssrcOwners[thessrc]) {
                logger.error("No SSRC owner known for: " + thessrc);
                return;
            }
            data.peerjid = self.ssrcOwners[thessrc];
            logger.log('associated jid', self.ssrcOwners[thessrc]);
        } else {
            logger.error("No SSRC lines for ", streamId);
        }
    }

    this.room.remoteStreamAdded(data, this.sid, thessrc);

    var isVideo = data.stream.getVideoTracks().length > 0;
    // an attempt to work around https://github.com/jitsi/jitmeet/issues/32
    if (isVideo &&
        data.peerjid && this.peerjid === data.peerjid &&
        data.stream.getVideoTracks().length === 0 &&
        RTC.localVideo.getTracks().length > 0) {
        window.setTimeout(function () {
            self.sendKeyframe();
        }, 3000);
    }
}

/**
 * Returns the ice connection state for the peer connection.
 * @returns the ice connection state for the peer connection.
 */
JingleSessionPC.prototype.getIceConnectionState = function () {
    return this.peerconnection.iceConnectionState;
}

module.exports = JingleSessionPC;

}).call(this,"/modules/xmpp/JingleSessionPC.js")
},{"../../service/xmpp/XMPPEvents":87,"../RTC/RTC":16,"../RTC/RTCBrowserType":17,"./JingleSession":27,"./LocalSSRCReplacement":29,"./SDP":30,"./SDPDiffer":31,"./SDPUtil":32,"./TraceablePeerConnection":33,"async":43,"jitsi-meet-logger":48,"sdp-transform":76}],29:[function(require,module,exports){
(function (__filename){
/* global $ */
var logger = require("jitsi-meet-logger").getLogger(__filename);


/*
 Here we do modifications of local video SSRCs. There are 2 situations we have
 to handle:

 1. We generate SSRC for local recvonly video stream. This is the case when we
    have no local camera and it is not generated automatically, but SSRC=1 is
    used implicitly. If that happens RTCP packets will be dropped by the JVB
    and we won't be able to request video key frames correctly.

 2. A hack to re-use SSRC of the first video stream for any new stream created
    in future. It turned out that Chrome may keep on using the SSRC of removed
    video stream in RTCP even though a new one has been created. So we just
    want to avoid that by re-using it. Jingle 'source-remove'/'source-add'
    notifications are blocked once first video SSRC is advertised to the focus.

 What this hack does:

 1. Stores the SSRC of the first video stream created by
   a) scanning Jingle session-accept/session-invite for existing video SSRC
   b) watching for 'source-add' for new video stream if it has not been
      created in step a)
 2. Exposes method 'mungeLocalVideoSSRC' which replaces any new video SSRC with
    the stored one. It is called by 'TracablePeerConnection' before local SDP is
    returned to the other parts of the application.
 3. Scans 'source-remove'/'source-add' notifications for stored video SSRC and
    blocks those notifications. This makes Jicofo and all participants think
    that it exists all the time even if the video stream has been removed or
    replaced locally. Thanks to that there is no additional signaling activity
    on video mute or when switching to the desktop stream.
 */

var SDP = require('./SDP');
var RandomUtil = require('../util/RandomUtil');
var RTCBrowserType = require('../RTC/RTCBrowserType');

/**
 * The hack is enabled on all browsers except FF by default
 * FIXME finish the hack once removeStream method is implemented in FF
 * @type {boolean}
 */
var isEnabled = !RTCBrowserType.isFirefox();


/**
 * Stored SSRC of local video stream.
 */
var localVideoSSRC;

/**
 * SSRC used for recvonly video stream when we have no local camera.
 * This is in order to tell Chrome what SSRC should be used in RTCP requests
 * instead of 1.
 */
var localRecvOnlySSRC, localRecvOnlyMSID, localRecvOnlyMSLabel, localRecvOnlyLabel;

/**
 * cname for <tt>localRecvOnlySSRC</tt>
 */
var localRecvOnlyCName;

/**
 * Method removes <source> element which describes <tt>localVideoSSRC</tt>
 * from given Jingle IQ.
 * @param modifyIq 'source-add' or 'source-remove' Jingle IQ.
 * @param actionName display name of the action which will be printed in log
 *        messages.
 * @returns {*} modified Jingle IQ, so that it does not contain <source> element
 *          corresponding to <tt>localVideoSSRC</tt> or <tt>null</tt> if no
 *          other SSRCs left to be signaled after removing it.
 */
var filterOutSource = function (modifyIq, actionName) {
    var modifyIqTree = $(modifyIq.tree());

    if (!localVideoSSRC)
        return modifyIqTree[0];

    var videoSSRC = modifyIqTree.find(
        '>jingle>content[name="video"]' +
        '>description>source[ssrc="' + localVideoSSRC + '"]');

    if (!videoSSRC.length) {
        return modifyIqTree[0];
    }

    logger.info(
        'Blocking ' + actionName + ' for local video SSRC: ' + localVideoSSRC);

    videoSSRC.remove();

    // Check if any sources still left to be added/removed
    if (modifyIqTree.find('>jingle>content>description>source').length) {
        return modifyIqTree[0];
    } else {
        return null;
    }
};

/**
 * Scans given Jingle IQ for video SSRC and stores it.
 * @param jingleIq the Jingle IQ to be scanned for video SSRC.
 */
var storeLocalVideoSSRC = function (jingleIq) {
    var videoSSRCs =
        $(jingleIq.tree())
            .find('>jingle>content[name="video"]>description>source');

    videoSSRCs.each(function (idx, ssrcElem) {
        if (localVideoSSRC)
            return;
        // We consider SSRC real only if it has msid attribute
        // recvonly streams in FF do not have it as well as local SSRCs
        // we generate for recvonly streams in Chrome
        var ssrSel = $(ssrcElem);
        var msid = ssrSel.find('>parameter[name="msid"]');
        if (msid.length) {
            var ssrcVal = ssrSel.attr('ssrc');
            if (ssrcVal) {
                localVideoSSRC = ssrcVal;
                logger.info('Stored local video SSRC' +
                             ' for future re-use: ' + localVideoSSRC);
            }
        }
    });
};

/**
 * Generates new label/mslabel attribute
 * @returns {string} label/mslabel attribute
 */
function generateLabel() {
    return RandomUtil.randomHexString(8) + "-" + RandomUtil.randomHexString(4) +
        "-" + RandomUtil.randomHexString(4) + "-" +
        RandomUtil.randomHexString(4) + "-" + RandomUtil.randomHexString(12);
}

/**
 * Generates new SSRC for local video recvonly stream.
 * FIXME what about eventual SSRC collision ?
 */
function generateRecvonlySSRC() {

    localVideoSSRC = localRecvOnlySSRC =
        localVideoSSRC ?
            localVideoSSRC : Math.random().toString(10).substring(2, 11);

    localRecvOnlyCName =
        Math.random().toString(36).substring(2);

    localRecvOnlyMSLabel = generateLabel();
    localRecvOnlyLabel = generateLabel();
    localRecvOnlyMSID = localRecvOnlyMSLabel + " " + localRecvOnlyLabel;

    logger.info(
        "Generated local recvonly SSRC: " + localRecvOnlySSRC +
        ", cname: " + localRecvOnlyCName);
}

var LocalSSRCReplacement = {
    /**
     * Method must be called before 'session-initiate' or 'session-invite' is
     * sent. Scans the IQ for local video SSRC and stores it if detected.
     *
     * @param sessionInit our 'session-initiate' or 'session-accept' Jingle IQ
     *        which will be scanned for local video SSRC.
     */
    processSessionInit: function (sessionInit) {
        if (!isEnabled)
            return;

        if (localVideoSSRC) {
            logger.error("Local SSRC stored already: " + localVideoSSRC);
            return;
        }
        storeLocalVideoSSRC(sessionInit);
    },
    /**
     * If we have local video SSRC stored searched given
     * <tt>localDescription</tt> for video SSRC and makes sure it is replaced
     * with the stored one.
     * @param localDescription local description object that will have local
     *        video SSRC replaced with the stored one
     * @returns modified <tt>localDescription</tt> object.
     */
    mungeLocalVideoSSRC: function (localDescription) {
        if (!isEnabled)
            return localDescription;

        if (!localDescription) {
            logger.warn("localDescription is null or undefined");
            return localDescription;
        }

        // IF we have local video SSRC stored make sure it is replaced
        // with old SSRC
        var sdp = new SDP(localDescription.sdp);
        if (sdp.media.length < 2)
            return;

        if (localVideoSSRC && sdp.media[1].indexOf("a=ssrc:") !== -1 &&
            !sdp.containsSSRC(localVideoSSRC)) {
            // Get new video SSRC
            var map = sdp.getMediaSsrcMap();
            var videoPart = map[1];
            var videoSSRCs = videoPart.ssrcs;
            var newSSRC = Object.keys(videoSSRCs)[0];

            logger.info(
                "Replacing new video SSRC: " + newSSRC +
                " with " + localVideoSSRC);

            localDescription.sdp =
                sdp.raw.replace(
                    new RegExp('a=ssrc:' + newSSRC, 'g'),
                    'a=ssrc:' + localVideoSSRC);
        }
        else if (sdp.media[1].indexOf('a=ssrc:') === -1 &&
                 sdp.media[1].indexOf('a=recvonly') !== -1) {
            // Make sure we have any SSRC for recvonly video stream
            if (!localRecvOnlySSRC) {
                generateRecvonlySSRC();
            }

            logger.info('No SSRC in video recvonly stream' +
                         ' - adding SSRC: ' + localRecvOnlySSRC);

            sdp.media[1] += 'a=ssrc:' + localRecvOnlySSRC +
                            ' cname:' + localRecvOnlyCName + '\r\n' +
                            'a=ssrc:' + localRecvOnlySSRC +
                            ' msid:' + localRecvOnlyMSID + '\r\n' +
                            'a=ssrc:' + localRecvOnlySSRC +
                            ' mslabel:' + localRecvOnlyMSLabel + '\r\n' +
                            'a=ssrc:' + localRecvOnlySSRC +
                            ' label:' + localRecvOnlyLabel + '\r\n';

            localDescription.sdp = sdp.session + sdp.media.join('');
        }
        return localDescription;
    },
    /**
     * Method must be called before 'source-add' notification is sent. In case
     * we have local video SSRC advertised already it will be removed from the
     * notification. If no other SSRCs are described by given IQ null will be
     * returned which means that there is no point in sending the notification.
     * @param sourceAdd 'source-add' Jingle IQ to be processed
     * @returns modified 'source-add' IQ which can be sent to the focus or
     *          <tt>null</tt> if no notification shall be sent. It is no longer
     *          a Strophe IQ Builder instance, but DOM element tree.
     */
    processSourceAdd: function (sourceAdd) {
        if (!isEnabled)
            return sourceAdd;

        if (!localVideoSSRC) {
            // Store local SSRC if available
            storeLocalVideoSSRC(sourceAdd);
            return sourceAdd;
        } else {
            return filterOutSource(sourceAdd, 'source-add');
        }
    },
    /**
     * Method must be called before 'source-remove' notification is sent.
     * Removes local video SSRC from the notification. If there are no other
     * SSRCs described in the given IQ <tt>null</tt> will be returned which
     * means that there is no point in sending the notification.
     * @param sourceRemove 'source-remove' Jingle IQ to be processed
     * @returns modified 'source-remove' IQ which can be sent to the focus or
     *          <tt>null</tt> if no notification shall be sent. It is no longer
     *          a Strophe IQ Builder instance, but DOM element tree.
     */
    processSourceRemove: function (sourceRemove) {
        if (!isEnabled)
            return sourceRemove;

        return filterOutSource(sourceRemove, 'source-remove');
    },

    /**
     * Turns the hack on or off
     * @param enabled <tt>true</tt> to enable the hack or <tt>false</tt>
     *                to disable it
     */
    setEnabled: function (enabled) {
        isEnabled = enabled;
    }
};

module.exports = LocalSSRCReplacement;

}).call(this,"/modules/xmpp/LocalSSRCReplacement.js")
},{"../RTC/RTCBrowserType":17,"../util/RandomUtil":25,"./SDP":30,"jitsi-meet-logger":48}],30:[function(require,module,exports){
(function (__filename){
/* jshint -W117 */

var logger = require("jitsi-meet-logger").getLogger(__filename);
var SDPUtil = require("./SDPUtil");

// SDP STUFF
function SDP(sdp) {
    /**
     * Whether or not to remove TCP ice candidates when translating from/to jingle.
     * @type {boolean}
     */
    this.removeTcpCandidates = false;

    /**
     * Whether or not to remove UDP ice candidates when translating from/to jingle.
     * @type {boolean}
     */
    this.removeUdpCandidates = false;

    this.media = sdp.split('\r\nm=');
    for (var i = 1; i < this.media.length; i++) {
        this.media[i] = 'm=' + this.media[i];
        if (i != this.media.length - 1) {
            this.media[i] += '\r\n';
        }
    }
    this.session = this.media.shift() + '\r\n';
    this.raw = this.session + this.media.join('');
}

/**
 * Returns map of MediaChannel mapped per channel idx.
 */
SDP.prototype.getMediaSsrcMap = function() {
    var self = this;
    var media_ssrcs = {};
    var tmp;
    for (var mediaindex = 0; mediaindex < self.media.length; mediaindex++) {
        tmp = SDPUtil.find_lines(self.media[mediaindex], 'a=ssrc:');
        var mid = SDPUtil.parse_mid(SDPUtil.find_line(self.media[mediaindex], 'a=mid:'));
        var media = {
            mediaindex: mediaindex,
            mid: mid,
            ssrcs: {},
            ssrcGroups: []
        };
        media_ssrcs[mediaindex] = media;
        tmp.forEach(function (line) {
            var linessrc = line.substring(7).split(' ')[0];
            // allocate new ChannelSsrc
            if(!media.ssrcs[linessrc]) {
                media.ssrcs[linessrc] = {
                    ssrc: linessrc,
                    lines: []
                };
            }
            media.ssrcs[linessrc].lines.push(line);
        });
        tmp = SDPUtil.find_lines(self.media[mediaindex], 'a=ssrc-group:');
        tmp.forEach(function(line){
            var idx = line.indexOf(' ');
            var semantics = line.substr(0, idx).substr(13);
            var ssrcs = line.substr(14 + semantics.length).split(' ');
            if (ssrcs.length) {
                media.ssrcGroups.push({
                    semantics: semantics,
                    ssrcs: ssrcs
                });
            }
        });
    }
    return media_ssrcs;
};
/**
 * Returns <tt>true</tt> if this SDP contains given SSRC.
 * @param ssrc the ssrc to check.
 * @returns {boolean} <tt>true</tt> if this SDP contains given SSRC.
 */
SDP.prototype.containsSSRC = function (ssrc) {
    // FIXME this code is really strange - improve it if you can
    var medias = this.getMediaSsrcMap();
    var result = false;
    Object.keys(medias).forEach(function (mediaindex) {
        if (result)
            return;
        if (medias[mediaindex].ssrcs[ssrc]) {
            result = true;
        }
    });
    return result;
};

// remove iSAC and CN from SDP
SDP.prototype.mangle = function () {
    var i, j, mline, lines, rtpmap, newdesc;
    for (i = 0; i < this.media.length; i++) {
        lines = this.media[i].split('\r\n');
        lines.pop(); // remove empty last element
        mline = SDPUtil.parse_mline(lines.shift());
        if (mline.media != 'audio')
            continue;
        newdesc = '';
        mline.fmt.length = 0;
        for (j = 0; j < lines.length; j++) {
            if (lines[j].substr(0, 9) == 'a=rtpmap:') {
                rtpmap = SDPUtil.parse_rtpmap(lines[j]);
                if (rtpmap.name == 'CN' || rtpmap.name == 'ISAC')
                    continue;
                mline.fmt.push(rtpmap.id);
                newdesc += lines[j] + '\r\n';
            } else {
                newdesc += lines[j] + '\r\n';
            }
        }
        this.media[i] = SDPUtil.build_mline(mline) + '\r\n';
        this.media[i] += newdesc;
    }
    this.raw = this.session + this.media.join('');
};

// remove lines matching prefix from session section
SDP.prototype.removeSessionLines = function(prefix) {
    var self = this;
    var lines = SDPUtil.find_lines(this.session, prefix);
    lines.forEach(function(line) {
        self.session = self.session.replace(line + '\r\n', '');
    });
    this.raw = this.session + this.media.join('');
    return lines;
}
// remove lines matching prefix from a media section specified by mediaindex
// TODO: non-numeric mediaindex could match mid
SDP.prototype.removeMediaLines = function(mediaindex, prefix) {
    var self = this;
    var lines = SDPUtil.find_lines(this.media[mediaindex], prefix);
    lines.forEach(function(line) {
        self.media[mediaindex] = self.media[mediaindex].replace(line + '\r\n', '');
    });
    this.raw = this.session + this.media.join('');
    return lines;
}

// add content's to a jingle element
SDP.prototype.toJingle = function (elem, thecreator) {
//    logger.log("SSRC" + ssrcs["audio"] + " - " + ssrcs["video"]);
    var self = this;
    var i, j, k, mline, ssrc, rtpmap, tmp, lines;
    // new bundle plan
    if (SDPUtil.find_line(this.session, 'a=group:')) {
        lines = SDPUtil.find_lines(this.session, 'a=group:');
        for (i = 0; i < lines.length; i++) {
            tmp = lines[i].split(' ');
            var semantics = tmp.shift().substr(8);
            elem.c('group', {xmlns: 'urn:xmpp:jingle:apps:grouping:0', semantics:semantics});
            for (j = 0; j < tmp.length; j++) {
                elem.c('content', {name: tmp[j]}).up();
            }
            elem.up();
        }
    }
    for (i = 0; i < this.media.length; i++) {
        mline = SDPUtil.parse_mline(this.media[i].split('\r\n')[0]);
        if (!(mline.media === 'audio' ||
              mline.media === 'video' ||
              mline.media === 'application'))
        {
            continue;
        }
        if (SDPUtil.find_line(this.media[i], 'a=ssrc:')) {
            ssrc = SDPUtil.find_line(this.media[i], 'a=ssrc:').substring(7).split(' ')[0]; // take the first
        } else {
            ssrc = false;
        }

        elem.c('content', {creator: thecreator, name: mline.media});
        if (SDPUtil.find_line(this.media[i], 'a=mid:')) {
            // prefer identifier from a=mid if present
            var mid = SDPUtil.parse_mid(SDPUtil.find_line(this.media[i], 'a=mid:'));
            elem.attrs({ name: mid });
        }

        if (SDPUtil.find_line(this.media[i], 'a=rtpmap:').length) {
            elem.c('description',
                {xmlns: 'urn:xmpp:jingle:apps:rtp:1',
                    media: mline.media });
            if (ssrc) {
                elem.attrs({ssrc: ssrc});
            }
            for (j = 0; j < mline.fmt.length; j++) {
                rtpmap = SDPUtil.find_line(this.media[i], 'a=rtpmap:' + mline.fmt[j]);
                elem.c('payload-type', SDPUtil.parse_rtpmap(rtpmap));
                // put any 'a=fmtp:' + mline.fmt[j] lines into <param name=foo value=bar/>
                if (SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j])) {
                    tmp = SDPUtil.parse_fmtp(SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j]));
                    for (k = 0; k < tmp.length; k++) {
                        elem.c('parameter', tmp[k]).up();
                    }
                }
                this.rtcpFbToJingle(i, elem, mline.fmt[j]); // XEP-0293 -- map a=rtcp-fb

                elem.up();
            }
            if (SDPUtil.find_line(this.media[i], 'a=crypto:', this.session)) {
                elem.c('encryption', {required: 1});
                var crypto = SDPUtil.find_lines(this.media[i], 'a=crypto:', this.session);
                crypto.forEach(function(line) {
                    elem.c('crypto', SDPUtil.parse_crypto(line)).up();
                });
                elem.up(); // end of encryption
            }

            if (ssrc) {
                // new style mapping
                elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                // FIXME: group by ssrc and support multiple different ssrcs
                var ssrclines = SDPUtil.find_lines(this.media[i], 'a=ssrc:');
                if(ssrclines.length > 0) {
                    ssrclines.forEach(function (line) {
                        var idx = line.indexOf(' ');
                        var linessrc = line.substr(0, idx).substr(7);
                        if (linessrc != ssrc) {
                            elem.up();
                            ssrc = linessrc;
                            elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                        }
                        var kv = line.substr(idx + 1);
                        elem.c('parameter');
                        if (kv.indexOf(':') == -1) {
                            elem.attrs({ name: kv });
                        } else {
                            var k = kv.split(':', 2)[0];
                            elem.attrs({ name: k });

                            var v = kv.split(':', 2)[1];
                            v = SDPUtil.filter_special_chars(v);
                            elem.attrs({ value: v });
                        }
                        elem.up();
                    });
                } else {
                    elem.up();
                    elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                    elem.c('parameter');
                    elem.attrs({name: "cname", value:Math.random().toString(36).substring(7)});
                    elem.up();
                    var msid = null;
                    if(mline.media == "audio")
                    {
                        msid = APP.RTC.localAudio._getId();
                    }
                    else
                    {
                        msid = APP.RTC.localVideo._getId();
                    }
                    if(msid != null)
                    {
                        msid = SDPUtil.filter_special_chars(msid);
                        elem.c('parameter');
                        elem.attrs({name: "msid", value:msid});
                        elem.up();
                        elem.c('parameter');
                        elem.attrs({name: "mslabel", value:msid});
                        elem.up();
                        elem.c('parameter');
                        elem.attrs({name: "label", value:msid});
                        elem.up();
                    }
                }
                elem.up();

                // XEP-0339 handle ssrc-group attributes
                var ssrc_group_lines = SDPUtil.find_lines(this.media[i], 'a=ssrc-group:');
                ssrc_group_lines.forEach(function(line) {
                    var idx = line.indexOf(' ');
                    var semantics = line.substr(0, idx).substr(13);
                    var ssrcs = line.substr(14 + semantics.length).split(' ');
                    if (ssrcs.length) {
                        elem.c('ssrc-group', { semantics: semantics, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                        ssrcs.forEach(function(ssrc) {
                            elem.c('source', { ssrc: ssrc })
                                .up();
                        });
                        elem.up();
                    }
                });
            }

            if (SDPUtil.find_line(this.media[i], 'a=rtcp-mux')) {
                elem.c('rtcp-mux').up();
            }

            // XEP-0293 -- map a=rtcp-fb:*
            this.rtcpFbToJingle(i, elem, '*');

            // XEP-0294
            if (SDPUtil.find_line(this.media[i], 'a=extmap:')) {
                lines = SDPUtil.find_lines(this.media[i], 'a=extmap:');
                for (j = 0; j < lines.length; j++) {
                    tmp = SDPUtil.parse_extmap(lines[j]);
                    elem.c('rtp-hdrext', { xmlns: 'urn:xmpp:jingle:apps:rtp:rtp-hdrext:0',
                        uri: tmp.uri,
                        id: tmp.value });
                    if (tmp.hasOwnProperty('direction')) {
                        switch (tmp.direction) {
                            case 'sendonly':
                                elem.attrs({senders: 'responder'});
                                break;
                            case 'recvonly':
                                elem.attrs({senders: 'initiator'});
                                break;
                            case 'sendrecv':
                                elem.attrs({senders: 'both'});
                                break;
                            case 'inactive':
                                elem.attrs({senders: 'none'});
                                break;
                        }
                    }
                    // TODO: handle params
                    elem.up();
                }
            }
            elem.up(); // end of description
        }

        // map ice-ufrag/pwd, dtls fingerprint, candidates
        this.transportToJingle(i, elem);

        if (SDPUtil.find_line(this.media[i], 'a=sendrecv', this.session)) {
            elem.attrs({senders: 'both'});
        } else if (SDPUtil.find_line(this.media[i], 'a=sendonly', this.session)) {
            elem.attrs({senders: 'initiator'});
        } else if (SDPUtil.find_line(this.media[i], 'a=recvonly', this.session)) {
            elem.attrs({senders: 'responder'});
        } else if (SDPUtil.find_line(this.media[i], 'a=inactive', this.session)) {
            elem.attrs({senders: 'none'});
        }
        if (mline.port == '0') {
            // estos hack to reject an m-line
            elem.attrs({senders: 'rejected'});
        }
        elem.up(); // end of content
    }
    elem.up();
    return elem;
};

SDP.prototype.transportToJingle = function (mediaindex, elem) {
    var tmp, sctpmap, sctpAttrs, fingerprints;
    var self = this;
    elem.c('transport');

    // XEP-0343 DTLS/SCTP
    if (SDPUtil.find_line(this.media[mediaindex], 'a=sctpmap:').length)
    {
        sctpmap = SDPUtil.find_line(
            this.media[mediaindex], 'a=sctpmap:', self.session);
        if (sctpmap)
        {
            sctpAttrs = SDPUtil.parse_sctpmap(sctpmap);
            elem.c('sctpmap',
                {
                    xmlns: 'urn:xmpp:jingle:transports:dtls-sctp:1',
                    number: sctpAttrs[0], /* SCTP port */
                    protocol: sctpAttrs[1] /* protocol */
                });
            // Optional stream count attribute
            if (sctpAttrs.length > 2)
                elem.attrs({ streams: sctpAttrs[2]});
            elem.up();
        }
    }
    // XEP-0320
    fingerprints = SDPUtil.find_lines(this.media[mediaindex], 'a=fingerprint:', this.session);
    fingerprints.forEach(function(line) {
        tmp = SDPUtil.parse_fingerprint(line);
        tmp.xmlns = 'urn:xmpp:jingle:apps:dtls:0';
        elem.c('fingerprint').t(tmp.fingerprint);
        delete tmp.fingerprint;
        line = SDPUtil.find_line(self.media[mediaindex], 'a=setup:', self.session);
        if (line) {
            tmp.setup = line.substr(8);
        }
        elem.attrs(tmp);
        elem.up(); // end of fingerprint
    });
    tmp = SDPUtil.iceparams(this.media[mediaindex], this.session);
    if (tmp) {
        tmp.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
        elem.attrs(tmp);
        // XEP-0176
        if (SDPUtil.find_line(this.media[mediaindex], 'a=candidate:', this.session)) { // add any a=candidate lines
            var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=candidate:', this.session);
            lines.forEach(function (line) {
                var candidate = SDPUtil.candidateToJingle(line);
                var protocol = (candidate &&
                        typeof candidate.protocol === 'string')
                    ? candidate.protocol.toLowerCase() : '';
                if ((self.removeTcpCandidates && protocol === 'tcp') ||
                    (self.removeUdpCandidates && protocol === 'udp')) {
                    return;
                }
                elem.c('candidate', candidate).up();
            });
        }
    }
    elem.up(); // end of transport
}

SDP.prototype.rtcpFbToJingle = function (mediaindex, elem, payloadtype) { // XEP-0293
    var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=rtcp-fb:' + payloadtype);
    lines.forEach(function (line) {
        var tmp = SDPUtil.parse_rtcpfb(line);
        if (tmp.type == 'trr-int') {
            elem.c('rtcp-fb-trr-int', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', value: tmp.params[0]});
            elem.up();
        } else {
            elem.c('rtcp-fb', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', type: tmp.type});
            if (tmp.params.length > 0) {
                elem.attrs({'subtype': tmp.params[0]});
            }
            elem.up();
        }
    });
};

SDP.prototype.rtcpFbFromJingle = function (elem, payloadtype) { // XEP-0293
    var media = '';
    var tmp = elem.find('>rtcp-fb-trr-int[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
    if (tmp.length) {
        media += 'a=rtcp-fb:' + '*' + ' ' + 'trr-int' + ' ';
        if (tmp.attr('value')) {
            media += tmp.attr('value');
        } else {
            media += '0';
        }
        media += '\r\n';
    }
    tmp = elem.find('>rtcp-fb[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
    tmp.each(function () {
        media += 'a=rtcp-fb:' + payloadtype + ' ' + $(this).attr('type');
        if ($(this).attr('subtype')) {
            media += ' ' + $(this).attr('subtype');
        }
        media += '\r\n';
    });
    return media;
};

// construct an SDP from a jingle stanza
SDP.prototype.fromJingle = function (jingle) {
    var self = this;
    this.raw = 'v=0\r\n' +
        'o=- 1923518516 2 IN IP4 0.0.0.0\r\n' +// FIXME
        's=-\r\n' +
        't=0 0\r\n';
    // http://tools.ietf.org/html/draft-ietf-mmusic-sdp-bundle-negotiation-04#section-8
    if ($(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').length) {
        $(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').each(function (idx, group) {
            var contents = $(group).find('>content').map(function (idx, content) {
                return content.getAttribute('name');
            }).get();
            if (contents.length > 0) {
                self.raw += 'a=group:' + (group.getAttribute('semantics') || group.getAttribute('type')) + ' ' + contents.join(' ') + '\r\n';
            }
        });
    }

    this.session = this.raw;
    jingle.find('>content').each(function () {
        var m = self.jingle2media($(this));
        self.media.push(m);
    });

    // reconstruct msid-semantic -- apparently not necessary
    /*
     var msid = SDPUtil.parse_ssrc(this.raw);
     if (msid.hasOwnProperty('mslabel')) {
     this.session += "a=msid-semantic: WMS " + msid.mslabel + "\r\n";
     }
     */

    this.raw = this.session + this.media.join('');
};

// translate a jingle content element into an an SDP media part
SDP.prototype.jingle2media = function (content) {
    var media = '',
        desc = content.find('description'),
        ssrc = desc.attr('ssrc'),
        self = this,
        tmp;
    var sctp = content.find(
        '>transport>sctpmap[xmlns="urn:xmpp:jingle:transports:dtls-sctp:1"]');

    tmp = { media: desc.attr('media') };
    tmp.port = '1';
    if (content.attr('senders') == 'rejected') {
        // estos hack to reject an m-line.
        tmp.port = '0';
    }
    if (content.find('>transport>fingerprint').length || desc.find('encryption').length) {
        if (sctp.length)
            tmp.proto = 'DTLS/SCTP';
        else
            tmp.proto = 'RTP/SAVPF';
    } else {
        tmp.proto = 'RTP/AVPF';
    }
    if (!sctp.length) {
        tmp.fmt = desc.find('payload-type').map(
            function () { return this.getAttribute('id'); }).get();
        media += SDPUtil.build_mline(tmp) + '\r\n';
    } else {
        media += 'm=application 1 DTLS/SCTP ' + sctp.attr('number') + '\r\n';
        media += 'a=sctpmap:' + sctp.attr('number') +
            ' ' + sctp.attr('protocol');

        var streamCount = sctp.attr('streams');
        if (streamCount)
            media += ' ' + streamCount + '\r\n';
        else
            media += '\r\n';
    }

    media += 'c=IN IP4 0.0.0.0\r\n';
    if (!sctp.length)
        media += 'a=rtcp:1 IN IP4 0.0.0.0\r\n';
    tmp = content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]');
    if (tmp.length) {
        if (tmp.attr('ufrag')) {
            media += SDPUtil.build_iceufrag(tmp.attr('ufrag')) + '\r\n';
        }
        if (tmp.attr('pwd')) {
            media += SDPUtil.build_icepwd(tmp.attr('pwd')) + '\r\n';
        }
        tmp.find('>fingerprint').each(function () {
            // FIXME: check namespace at some point
            media += 'a=fingerprint:' + this.getAttribute('hash');
            media += ' ' + $(this).text();
            media += '\r\n';
            if (this.getAttribute('setup')) {
                media += 'a=setup:' + this.getAttribute('setup') + '\r\n';
            }
        });
    }
    switch (content.attr('senders')) {
        case 'initiator':
            media += 'a=sendonly\r\n';
            break;
        case 'responder':
            media += 'a=recvonly\r\n';
            break;
        case 'none':
            media += 'a=inactive\r\n';
            break;
        case 'both':
            media += 'a=sendrecv\r\n';
            break;
    }
    media += 'a=mid:' + content.attr('name') + '\r\n';

    // <description><rtcp-mux/></description>
    // see http://code.google.com/p/libjingle/issues/detail?id=309 -- no spec though
    // and http://mail.jabber.org/pipermail/jingle/2011-December/001761.html
    if (desc.find('rtcp-mux').length) {
        media += 'a=rtcp-mux\r\n';
    }

    if (desc.find('encryption').length) {
        desc.find('encryption>crypto').each(function () {
            media += 'a=crypto:' + this.getAttribute('tag');
            media += ' ' + this.getAttribute('crypto-suite');
            media += ' ' + this.getAttribute('key-params');
            if (this.getAttribute('session-params')) {
                media += ' ' + this.getAttribute('session-params');
            }
            media += '\r\n';
        });
    }
    desc.find('payload-type').each(function () {
        media += SDPUtil.build_rtpmap(this) + '\r\n';
        if ($(this).find('>parameter').length) {
            media += 'a=fmtp:' + this.getAttribute('id') + ' ';
            media += $(this).find('parameter').map(function () {
                return (this.getAttribute('name')
                        ? (this.getAttribute('name') + '=') : '') +
                    this.getAttribute('value');
            }).get().join('; ');
            media += '\r\n';
        }
        // xep-0293
        media += self.rtcpFbFromJingle($(this), this.getAttribute('id'));
    });

    // xep-0293
    media += self.rtcpFbFromJingle(desc, '*');

    // xep-0294
    tmp = desc.find('>rtp-hdrext[xmlns="urn:xmpp:jingle:apps:rtp:rtp-hdrext:0"]');
    tmp.each(function () {
        media += 'a=extmap:' + this.getAttribute('id') + ' ' + this.getAttribute('uri') + '\r\n';
    });

    content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]>candidate').each(function () {
        var protocol = this.getAttribute('protocol');
        protocol = (typeof protocol === 'string') ? protocol.toLowerCase(): '';

        if ((self.removeTcpCandidates && protocol === 'tcp') ||
            (self.removeUdpCandidates && protocol === 'udp')) {
            return;
        }

        media += SDPUtil.candidateFromJingle(this);
    });

    // XEP-0339 handle ssrc-group attributes
    content.find('description>ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
        var semantics = this.getAttribute('semantics');
        var ssrcs = $(this).find('>source').map(function() {
            return this.getAttribute('ssrc');
        }).get();

        if (ssrcs.length) {
            media += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
        }
    });

    tmp = content.find('description>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
    tmp.each(function () {
        var ssrc = this.getAttribute('ssrc');
        $(this).find('>parameter').each(function () {
            var name = this.getAttribute('name');
            var value = this.getAttribute('value');
            value = SDPUtil.filter_special_chars(value);
            media += 'a=ssrc:' + ssrc + ' ' + name;
            if (value && value.length)
                media += ':' + value;
            media += '\r\n';
        });
    });

    return media;
};


module.exports = SDP;

}).call(this,"/modules/xmpp/SDP.js")
},{"./SDPUtil":32,"jitsi-meet-logger":48}],31:[function(require,module,exports){
var SDPUtil = require("./SDPUtil");

function SDPDiffer(mySDP, otherSDP)
{
    this.mySDP = mySDP;
    this.otherSDP = otherSDP;
}

/**
 * Returns map of MediaChannel that contains media contained in
 * 'mySDP', but not contained in 'otherSdp'. Mapped by channel idx.
 */
SDPDiffer.prototype.getNewMedia = function() {

    // this could be useful in Array.prototype.
    function arrayEquals(array) {
        // if the other array is a falsy value, return
        if (!array)
            return false;

        // compare lengths - can save a lot of time
        if (this.length != array.length)
            return false;

        for (var i = 0, l=this.length; i < l; i++) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].equals(array[i]))
                    return false;
            }
            else if (this[i] != array[i]) {
                // Warning - two different object instances will never be
                // equal: {x:20} != {x:20}
                return false;
            }
        }
        return true;
    }

    var myMedias = this.mySDP.getMediaSsrcMap();
    var othersMedias = this.otherSDP.getMediaSsrcMap();
    var newMedia = {};
    Object.keys(othersMedias).forEach(function(othersMediaIdx) {
        var myMedia = myMedias[othersMediaIdx];
        var othersMedia = othersMedias[othersMediaIdx];
        if(!myMedia && othersMedia) {
            // Add whole channel
            newMedia[othersMediaIdx] = othersMedia;
            return;
        }
        // Look for new ssrcs across the channel
        Object.keys(othersMedia.ssrcs).forEach(function(ssrc) {
            if(Object.keys(myMedia.ssrcs).indexOf(ssrc) === -1) {
                // Allocate channel if we've found ssrc that doesn't exist in
                // our channel
                if(!newMedia[othersMediaIdx]){
                    newMedia[othersMediaIdx] = {
                        mediaindex: othersMedia.mediaindex,
                        mid: othersMedia.mid,
                        ssrcs: {},
                        ssrcGroups: []
                    };
                }
                newMedia[othersMediaIdx].ssrcs[ssrc] = othersMedia.ssrcs[ssrc];
            }
        });

        // Look for new ssrc groups across the channels
        othersMedia.ssrcGroups.forEach(function(otherSsrcGroup){

            // try to match the other ssrc-group with an ssrc-group of ours
            var matched = false;
            for (var i = 0; i < myMedia.ssrcGroups.length; i++) {
                var mySsrcGroup = myMedia.ssrcGroups[i];
                if (otherSsrcGroup.semantics == mySsrcGroup.semantics &&
                    arrayEquals.apply(otherSsrcGroup.ssrcs,
                                      [mySsrcGroup.ssrcs])) {

                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Allocate channel if we've found an ssrc-group that doesn't
                // exist in our channel

                if(!newMedia[othersMediaIdx]){
                    newMedia[othersMediaIdx] = {
                        mediaindex: othersMedia.mediaindex,
                        mid: othersMedia.mid,
                        ssrcs: {},
                        ssrcGroups: []
                    };
                }
                newMedia[othersMediaIdx].ssrcGroups.push(otherSsrcGroup);
            }
        });
    });
    return newMedia;
};

/**
 * TODO: document!
 */
SDPDiffer.prototype.toJingle = function(modify) {
    var sdpMediaSsrcs = this.getNewMedia();

    var modified = false;
    Object.keys(sdpMediaSsrcs).forEach(function(mediaindex){
        modified = true;
        var media = sdpMediaSsrcs[mediaindex];
        modify.c('content', {name: media.mid});

        modify.c('description',
                 {xmlns:'urn:xmpp:jingle:apps:rtp:1', media: media.mid});
        // FIXME: not completely sure this operates on blocks and / or handles
        // different ssrcs correctly
        // generate sources from lines
        Object.keys(media.ssrcs).forEach(function(ssrcNum) {
            var mediaSsrc = media.ssrcs[ssrcNum];
            modify.c('source', { xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
            modify.attrs({ssrc: mediaSsrc.ssrc});
            // iterate over ssrc lines
            mediaSsrc.lines.forEach(function (line) {
                var idx = line.indexOf(' ');
                var kv = line.substr(idx + 1);
                modify.c('parameter');
                if (kv.indexOf(':') == -1) {
                    modify.attrs({ name: kv });
                } else {
                    var nv = kv.split(':', 2);
                    var name = nv[0];
                    var value = SDPUtil.filter_special_chars(nv[1]);
                    modify.attrs({ name: name });
                    modify.attrs({ value: value });
                }
                modify.up(); // end of parameter
            });
            modify.up(); // end of source
        });

        // generate source groups from lines
        media.ssrcGroups.forEach(function(ssrcGroup) {
            if (ssrcGroup.ssrcs.length) {

                modify.c('ssrc-group', {
                    semantics: ssrcGroup.semantics,
                    xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0'
                });

                ssrcGroup.ssrcs.forEach(function (ssrc) {
                    modify.c('source', { ssrc: ssrc })
                        .up(); // end of source
                });
                modify.up(); // end of ssrc-group
            }
        });

        modify.up(); // end of description
        modify.up(); // end of content
    });

    return modified;
};

module.exports = SDPDiffer;
},{"./SDPUtil":32}],32:[function(require,module,exports){
(function (__filename){
var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTCBrowserType = require("../RTC/RTCBrowserType");


SDPUtil = {
    filter_special_chars: function (text) {
        return text.replace(/[\\\/\{,\}\+]/g, "");
    },
    iceparams: function (mediadesc, sessiondesc) {
        var data = null;
        if (SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc) &&
            SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc)) {
            data = {
                ufrag: SDPUtil.parse_iceufrag(SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc)),
                pwd: SDPUtil.parse_icepwd(SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc))
            };
        }
        return data;
    },
    parse_iceufrag: function (line) {
        return line.substring(12);
    },
    build_iceufrag: function (frag) {
        return 'a=ice-ufrag:' + frag;
    },
    parse_icepwd: function (line) {
        return line.substring(10);
    },
    build_icepwd: function (pwd) {
        return 'a=ice-pwd:' + pwd;
    },
    parse_mid: function (line) {
        return line.substring(6);
    },
    parse_mline: function (line) {
        var parts = line.substring(2).split(' '),
            data = {};
        data.media = parts.shift();
        data.port = parts.shift();
        data.proto = parts.shift();
        if (parts[parts.length - 1] === '') { // trailing whitespace
            parts.pop();
        }
        data.fmt = parts;
        return data;
    },
    build_mline: function (mline) {
        return 'm=' + mline.media + ' ' + mline.port + ' ' + mline.proto + ' ' + mline.fmt.join(' ');
    },
    parse_rtpmap: function (line) {
        var parts = line.substring(9).split(' '),
            data = {};
        data.id = parts.shift();
        parts = parts[0].split('/');
        data.name = parts.shift();
        data.clockrate = parts.shift();
        data.channels = parts.length ? parts.shift() : '1';
        return data;
    },
    /**
     * Parses SDP line "a=sctpmap:..." and extracts SCTP port from it.
     * @param line eg. "a=sctpmap:5000 webrtc-datachannel"
     * @returns [SCTP port number, protocol, streams]
     */
    parse_sctpmap: function (line)
    {
        var parts = line.substring(10).split(' ');
        var sctpPort = parts[0];
        var protocol = parts[1];
        // Stream count is optional
        var streamCount = parts.length > 2 ? parts[2] : null;
        return [sctpPort, protocol, streamCount];// SCTP port
    },
    build_rtpmap: function (el) {
        var line = 'a=rtpmap:' + el.getAttribute('id') + ' ' + el.getAttribute('name') + '/' + el.getAttribute('clockrate');
        if (el.getAttribute('channels') && el.getAttribute('channels') != '1') {
            line += '/' + el.getAttribute('channels');
        }
        return line;
    },
    parse_crypto: function (line) {
        var parts = line.substring(9).split(' '),
            data = {};
        data.tag = parts.shift();
        data['crypto-suite'] = parts.shift();
        data['key-params'] = parts.shift();
        if (parts.length) {
            data['session-params'] = parts.join(' ');
        }
        return data;
    },
    parse_fingerprint: function (line) { // RFC 4572
        var parts = line.substring(14).split(' '),
            data = {};
        data.hash = parts.shift();
        data.fingerprint = parts.shift();
        // TODO assert that fingerprint satisfies 2UHEX *(":" 2UHEX) ?
        return data;
    },
    parse_fmtp: function (line) {
        var parts = line.split(' '),
            i, key, value,
            data = [];
        parts.shift();
        parts = parts.join(' ').split(';');
        for (i = 0; i < parts.length; i++) {
            key = parts[i].split('=')[0];
            while (key.length && key[0] == ' ') {
                key = key.substring(1);
            }
            value = parts[i].split('=')[1];
            if (key && value) {
                data.push({name: key, value: value});
            } else if (key) {
                // rfc 4733 (DTMF) style stuff
                data.push({name: '', value: key});
            }
        }
        return data;
    },
    parse_icecandidate: function (line) {
        var candidate = {},
            elems = line.split(' ');
        candidate.foundation = elems[0].substring(12);
        candidate.component = elems[1];
        candidate.protocol = elems[2].toLowerCase();
        candidate.priority = elems[3];
        candidate.ip = elems[4];
        candidate.port = elems[5];
        // elems[6] => "typ"
        candidate.type = elems[7];
        candidate.generation = 0; // default value, may be overwritten below
        for (var i = 8; i < elems.length; i += 2) {
            switch (elems[i]) {
                case 'raddr':
                    candidate['rel-addr'] = elems[i + 1];
                    break;
                case 'rport':
                    candidate['rel-port'] = elems[i + 1];
                    break;
                case 'generation':
                    candidate.generation = elems[i + 1];
                    break;
                case 'tcptype':
                    candidate.tcptype = elems[i + 1];
                    break;
                default: // TODO
                    logger.log('parse_icecandidate not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
            }
        }
        candidate.network = '1';
        candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
        return candidate;
    },
    build_icecandidate: function (cand) {
        var line = ['a=candidate:' + cand.foundation, cand.component, cand.protocol, cand.priority, cand.ip, cand.port, 'typ', cand.type].join(' ');
        line += ' ';
        switch (cand.type) {
            case 'srflx':
            case 'prflx':
            case 'relay':
                if (cand.hasOwnAttribute('rel-addr') && cand.hasOwnAttribute('rel-port')) {
                    line += 'raddr';
                    line += ' ';
                    line += cand['rel-addr'];
                    line += ' ';
                    line += 'rport';
                    line += ' ';
                    line += cand['rel-port'];
                    line += ' ';
                }
                break;
        }
        if (cand.hasOwnAttribute('tcptype')) {
            line += 'tcptype';
            line += ' ';
            line += cand.tcptype;
            line += ' ';
        }
        line += 'generation';
        line += ' ';
        line += cand.hasOwnAttribute('generation') ? cand.generation : '0';
        return line;
    },
    parse_ssrc: function (desc) {
        // proprietary mapping of a=ssrc lines
        // TODO: see "Jingle RTP Source Description" by Juberti and P. Thatcher on google docs
        // and parse according to that
        var lines = desc.split('\r\n'),
            data = {};
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, 7) == 'a=ssrc:') {
                var idx = lines[i].indexOf(' ');
                data[lines[i].substr(idx + 1).split(':', 2)[0]] = lines[i].substr(idx + 1).split(':', 2)[1];
            }
        }
        return data;
    },
    parse_rtcpfb: function (line) {
        var parts = line.substr(10).split(' ');
        var data = {};
        data.pt = parts.shift();
        data.type = parts.shift();
        data.params = parts;
        return data;
    },
    parse_extmap: function (line) {
        var parts = line.substr(9).split(' ');
        var data = {};
        data.value = parts.shift();
        if (data.value.indexOf('/') != -1) {
            data.direction = data.value.substr(data.value.indexOf('/') + 1);
            data.value = data.value.substr(0, data.value.indexOf('/'));
        } else {
            data.direction = 'both';
        }
        data.uri = parts.shift();
        data.params = parts;
        return data;
    },
    find_line: function (haystack, needle, sessionpart) {
        var lines = haystack.split('\r\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, needle.length) == needle) {
                return lines[i];
            }
        }
        if (!sessionpart) {
            return false;
        }
        // search session part
        lines = sessionpart.split('\r\n');
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].substring(0, needle.length) == needle) {
                return lines[j];
            }
        }
        return false;
    },
    find_lines: function (haystack, needle, sessionpart) {
        var lines = haystack.split('\r\n'),
            needles = [];
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, needle.length) == needle)
                needles.push(lines[i]);
        }
        if (needles.length || !sessionpart) {
            return needles;
        }
        // search session part
        lines = sessionpart.split('\r\n');
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].substring(0, needle.length) == needle) {
                needles.push(lines[j]);
            }
        }
        return needles;
    },
    candidateToJingle: function (line) {
        // a=candidate:2979166662 1 udp 2113937151 192.168.2.100 57698 typ host generation 0
        //      <candidate component=... foundation=... generation=... id=... ip=... network=... port=... priority=... protocol=... type=.../>
        if (line.indexOf('candidate:') === 0) {
            line = 'a=' + line;
        } else if (line.substring(0, 12) != 'a=candidate:') {
            logger.log('parseCandidate called with a line that is not a candidate line');
            logger.log(line);
            return null;
        }
        if (line.substring(line.length - 2) == '\r\n') // chomp it
            line = line.substring(0, line.length - 2);
        var candidate = {},
            elems = line.split(' '),
            i;
        if (elems[6] != 'typ') {
            logger.log('did not find typ in the right place');
            logger.log(line);
            return null;
        }
        candidate.foundation = elems[0].substring(12);
        candidate.component = elems[1];
        candidate.protocol = elems[2].toLowerCase();
        candidate.priority = elems[3];
        candidate.ip = elems[4];
        candidate.port = elems[5];
        // elems[6] => "typ"
        candidate.type = elems[7];

        candidate.generation = '0'; // default, may be overwritten below
        for (i = 8; i < elems.length; i += 2) {
            switch (elems[i]) {
                case 'raddr':
                    candidate['rel-addr'] = elems[i + 1];
                    break;
                case 'rport':
                    candidate['rel-port'] = elems[i + 1];
                    break;
                case 'generation':
                    candidate.generation = elems[i + 1];
                    break;
                case 'tcptype':
                    candidate.tcptype = elems[i + 1];
                    break;
                default: // TODO
                    logger.log('not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
            }
        }
        candidate.network = '1';
        candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
        return candidate;
    },
    candidateFromJingle: function (cand) {
        var line = 'a=candidate:';
        line += cand.getAttribute('foundation');
        line += ' ';
        line += cand.getAttribute('component');
        line += ' ';

        var protocol = cand.getAttribute('protocol');
        // use tcp candidates for FF
        if (RTCBrowserType.isFirefox() && protocol.toLowerCase() == 'ssltcp') {
            protocol = 'tcp';
        }

        line += protocol; //.toUpperCase(); // chrome M23 doesn't like this
        line += ' ';
        line += cand.getAttribute('priority');
        line += ' ';
        line += cand.getAttribute('ip');
        line += ' ';
        line += cand.getAttribute('port');
        line += ' ';
        line += 'typ';
        line += ' ' + cand.getAttribute('type');
        line += ' ';
        switch (cand.getAttribute('type')) {
            case 'srflx':
            case 'prflx':
            case 'relay':
                if (cand.getAttribute('rel-addr') && cand.getAttribute('rel-port')) {
                    line += 'raddr';
                    line += ' ';
                    line += cand.getAttribute('rel-addr');
                    line += ' ';
                    line += 'rport';
                    line += ' ';
                    line += cand.getAttribute('rel-port');
                    line += ' ';
                }
                break;
        }
        if (protocol.toLowerCase() == 'tcp') {
            line += 'tcptype';
            line += ' ';
            line += cand.getAttribute('tcptype');
            line += ' ';
        }
        line += 'generation';
        line += ' ';
        line += cand.getAttribute('generation') || '0';
        return line + '\r\n';
    }
};

module.exports = SDPUtil;

}).call(this,"/modules/xmpp/SDPUtil.js")
},{"../RTC/RTCBrowserType":17,"jitsi-meet-logger":48}],33:[function(require,module,exports){
(function (__filename){
/* global $ */
var RTC = require('../RTC/RTC');

var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTCBrowserType = require("../RTC/RTCBrowserType.js");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var SSRCReplacement = require("./LocalSSRCReplacement");

function TraceablePeerConnection(ice_config, constraints, session) {
    var self = this;
    this.session = session;
    var RTCPeerConnectionType = null;
    if (RTCBrowserType.isFirefox()) {
        RTCPeerConnectionType = mozRTCPeerConnection;
    } else if (RTCBrowserType.isTemasysPluginUsed()) {
        RTCPeerConnectionType = RTCPeerConnection;
    } else {
        RTCPeerConnectionType = webkitRTCPeerConnection;
    }
    this.peerconnection = new RTCPeerConnectionType(ice_config, constraints);
    this.updateLog = [];
    this.stats = {};
    this.statsinterval = null;
    this.maxstats = 0; // limit to 300 values, i.e. 5 minutes; set to 0 to disable
    var Interop = require('sdp-interop').Interop;
    this.interop = new Interop();
    var Simulcast = require('sdp-simulcast');
    this.simulcast = new Simulcast({numOfLayers: 3, explodeRemoteSimulcast: false});

    // override as desired
    this.trace = function (what, info) {
        /*logger.warn('WTRACE', what, info);
        if (info && RTCBrowserType.isIExplorer()) {
            if (info.length > 1024) {
                logger.warn('WTRACE', what, info.substr(1024));
            }
            if (info.length > 2048) {
                logger.warn('WTRACE', what, info.substr(2048));
            }
        }*/
        self.updateLog.push({
            time: new Date(),
            type: what,
            value: info || ""
        });
    };
    this.onicecandidate = null;
    this.peerconnection.onicecandidate = function (event) {
        // FIXME: this causes stack overflow with Temasys Plugin
        if (!RTCBrowserType.isTemasysPluginUsed())
            self.trace('onicecandidate', JSON.stringify(event.candidate, null, ' '));
        if (self.onicecandidate !== null) {
            self.onicecandidate(event);
        }
    };
    this.onaddstream = null;
    this.peerconnection.onaddstream = function (event) {
        self.trace('onaddstream', event.stream.id);
        if (self.onaddstream !== null) {
            self.onaddstream(event);
        }
    };
    this.onremovestream = null;
    this.peerconnection.onremovestream = function (event) {
        self.trace('onremovestream', event.stream.id);
        if (self.onremovestream !== null) {
            self.onremovestream(event);
        }
    };
    this.onsignalingstatechange = null;
    this.peerconnection.onsignalingstatechange = function (event) {
        self.trace('onsignalingstatechange', self.signalingState);
        if (self.onsignalingstatechange !== null) {
            self.onsignalingstatechange(event);
        }
    };
    this.oniceconnectionstatechange = null;
    this.peerconnection.oniceconnectionstatechange = function (event) {
        self.trace('oniceconnectionstatechange', self.iceConnectionState);
        if (self.oniceconnectionstatechange !== null) {
            self.oniceconnectionstatechange(event);
        }
    };
    this.onnegotiationneeded = null;
    this.peerconnection.onnegotiationneeded = function (event) {
        self.trace('onnegotiationneeded');
        if (self.onnegotiationneeded !== null) {
            self.onnegotiationneeded(event);
        }
    };
    self.ondatachannel = null;
    this.peerconnection.ondatachannel = function (event) {
        self.trace('ondatachannel', event);
        if (self.ondatachannel !== null) {
            self.ondatachannel(event);
        }
    };
    // XXX: do all non-firefox browsers which we support also support this?
    if (!RTCBrowserType.isFirefox() && this.maxstats) {
        this.statsinterval = window.setInterval(function() {
            self.peerconnection.getStats(function(stats) {
                var results = stats.result();
                var now = new Date();
                for (var i = 0; i < results.length; ++i) {
                    results[i].names().forEach(function (name) {
                        var id = results[i].id + '-' + name;
                        if (!self.stats[id]) {
                            self.stats[id] = {
                                startTime: now,
                                endTime: now,
                                values: [],
                                times: []
                            };
                        }
                        self.stats[id].values.push(results[i].stat(name));
                        self.stats[id].times.push(now.getTime());
                        if (self.stats[id].values.length > self.maxstats) {
                            self.stats[id].values.shift();
                            self.stats[id].times.shift();
                        }
                        self.stats[id].endTime = now;
                    });
                }
            });

        }, 1000);
    }
}

/**
 * Returns a string representation of a SessionDescription object.
 */
var dumpSDP = function(description) {
    if (typeof description === 'undefined' || description == null) {
        return '';
    }

    return 'type: ' + description.type + '\r\n' + description.sdp;
};

/**
 * Takes a SessionDescription object and returns a "normalized" version.
 * Currently it only takes care of ordering the a=ssrc lines.
 */
var normalizePlanB = function(desc) {
    if (typeof desc !== 'object' || desc === null ||
        typeof desc.sdp !== 'string') {
        logger.warn('An empty description was passed as an argument.');
        return desc;
    }

    var transform = require('sdp-transform');
    var session = transform.parse(desc.sdp);

    if (typeof session !== 'undefined' && typeof session.media !== 'undefined' &&
        Array.isArray(session.media)) {
        session.media.forEach(function (mLine) {

            // Chrome appears to be picky about the order in which a=ssrc lines
            // are listed in an m-line when rtx is enabled (and thus there are
            // a=ssrc-group lines with FID semantics). Specifically if we have
            // "a=ssrc-group:FID S1 S2" and the "a=ssrc:S2" lines appear before
            // the "a=ssrc:S1" lines, SRD fails.
            // So, put SSRC which appear as the first SSRC in an FID ssrc-group
            // first.
            var firstSsrcs = [];
            var newSsrcLines = [];

            if (typeof mLine.ssrcGroups !== 'undefined' && Array.isArray(mLine.ssrcGroups)) {
                mLine.ssrcGroups.forEach(function (group) {
                    if (typeof group.semantics !== 'undefined' &&
                        group.semantics === 'FID') {
                        if (typeof group.ssrcs !== 'undefined') {
                            firstSsrcs.push(Number(group.ssrcs.split(' ')[0]));
                        }
                    }
                });
            }

            if (typeof mLine.ssrcs !== 'undefined' && Array.isArray(mLine.ssrcs)) {
                var i;
                for (i = 0; i<mLine.ssrcs.length; i++){
                    if (typeof mLine.ssrcs[i] === 'object'
                        && typeof mLine.ssrcs[i].id !== 'undefined'
                        && !$.inArray(mLine.ssrcs[i].id, firstSsrcs)) {
                        newSsrcLines.push(mLine.ssrcs[i]);
                        delete mLine.ssrcs[i];
                    }
                }

                for (i = 0; i<mLine.ssrcs.length; i++){
                    if (typeof mLine.ssrcs[i] !== 'undefined') {
                        newSsrcLines.push(mLine.ssrcs[i]);
                    }
                }

                mLine.ssrcs = newSsrcLines;
            }
        });
    }

    var resStr = transform.write(session);
    return new RTCSessionDescription({
        type: desc.type,
        sdp: resStr
    });
};

var getters = {
    signalingState: function () {
        return this.peerconnection.signalingState;
    },
    iceConnectionState: function () {
        return this.peerconnection.iceConnectionState;
    },
    localDescription:  function() {
        var desc = this.peerconnection.localDescription;

            // FIXME this should probably be after the Unified Plan -> Plan B
            // transformation.
        desc = SSRCReplacement.mungeLocalVideoSSRC(desc);

        this.trace('getLocalDescription::preTransform', dumpSDP(desc));

        // if we're running on FF, transform to Plan B first.
        if (RTCBrowserType.usesUnifiedPlan()) {
            desc = this.interop.toPlanB(desc);
            this.trace('getLocalDescription::postTransform (Plan B)',
                dumpSDP(desc));
        }
        return desc;
    },
    remoteDescription:  function() {
        var desc = this.peerconnection.remoteDescription;
        this.trace('getRemoteDescription::preTransform', dumpSDP(desc));

        // if we're running on FF, transform to Plan B first.
        if (RTCBrowserType.usesUnifiedPlan()) {
            desc = this.interop.toPlanB(desc);
            this.trace('getRemoteDescription::postTransform (Plan B)', dumpSDP(desc));
        }
        return desc;
    }
};
Object.keys(getters).forEach(function (prop) {
    Object.defineProperty(
        TraceablePeerConnection.prototype,
        prop, {
            get: getters[prop]
        }
    );
});

TraceablePeerConnection.prototype.addStream = function (stream) {
    this.trace('addStream', stream.id);
    try
    {
        this.peerconnection.addStream(stream);
    }
    catch (e)
    {
        logger.error(e);
    }
};

TraceablePeerConnection.prototype.removeStream = function (stream, stopStreams) {
    this.trace('removeStream', stream.id);
    if(stopStreams) {
        RTC.stopMediaStream(stream);
    }

    try {
        // FF doesn't support this yet.
        if (this.peerconnection.removeStream)
            this.peerconnection.removeStream(stream);
    } catch (e) {
        logger.error(e);
    }
};

TraceablePeerConnection.prototype.createDataChannel = function (label, opts) {
    this.trace('createDataChannel', label, opts);
    return this.peerconnection.createDataChannel(label, opts);
};

TraceablePeerConnection.prototype.setLocalDescription
        = function (description, successCallback, failureCallback) {
    this.trace('setLocalDescription::preTransform', dumpSDP(description));
    // if we're running on FF, transform to Plan A first.
    if (RTCBrowserType.usesUnifiedPlan()) {
        description = this.interop.toUnifiedPlan(description);
        this.trace('setLocalDescription::postTransform (Plan A)', dumpSDP(description));
    }

    var self = this;
    this.peerconnection.setLocalDescription(description,
        function () {
            self.trace('setLocalDescriptionOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('setLocalDescriptionOnFailure', err);
            failureCallback(err);
        }
    );
    /*
     if (this.statsinterval === null && this.maxstats > 0) {
     // start gathering stats
     }
     */
};

TraceablePeerConnection.prototype.setRemoteDescription
        = function (description, successCallback, failureCallback) {
    this.trace('setRemoteDescription::preTransform', dumpSDP(description));
    // TODO the focus should squeze or explode the remote simulcast
    description = this.simulcast.mungeRemoteDescription(description);
    this.trace('setRemoteDescription::postTransform (simulcast)', dumpSDP(description));

    // if we're running on FF, transform to Plan A first.
    if (RTCBrowserType.usesUnifiedPlan()) {
        description = this.interop.toUnifiedPlan(description);
        this.trace('setRemoteDescription::postTransform (Plan A)', dumpSDP(description));
    }

    if (RTCBrowserType.usesPlanB()) {
        description = normalizePlanB(description);
    }

    var self = this;
    this.peerconnection.setRemoteDescription(description,
        function () {
            self.trace('setRemoteDescriptionOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('setRemoteDescriptionOnFailure', err);
            failureCallback(err);
        }
    );
    /*
     if (this.statsinterval === null && this.maxstats > 0) {
     // start gathering stats
     }
     */
};

TraceablePeerConnection.prototype.close = function () {
    this.trace('stop');
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
    this.peerconnection.close();
};

TraceablePeerConnection.prototype.createOffer
        = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createOffer', JSON.stringify(constraints, null, ' '));
    this.peerconnection.createOffer(
        function (offer) {
            self.trace('createOfferOnSuccess::preTransform', dumpSDP(offer));
            // NOTE this is not tested because in meet the focus generates the
            // offer.

            // if we're running on FF, transform to Plan B first.
            if (RTCBrowserType.usesUnifiedPlan()) {
                offer = self.interop.toPlanB(offer);
                self.trace('createOfferOnSuccess::postTransform (Plan B)', dumpSDP(offer));
            }

            offer = SSRCReplacement.mungeLocalVideoSSRC(offer);

            if (self.session.room.options.enableSimulcast && self.simulcast.isSupported()) {
                offer = self.simulcast.mungeLocalDescription(offer);
                self.trace('createOfferOnSuccess::postTransform (simulcast)', dumpSDP(offer));
            }
            successCallback(offer);
        },
        function(err) {
            self.trace('createOfferOnFailure', err);
            failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.createAnswer
        = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createAnswer', JSON.stringify(constraints, null, ' '));
    this.peerconnection.createAnswer(
        function (answer) {
            self.trace('createAnswerOnSuccess::preTransform', dumpSDP(answer));
            // if we're running on FF, transform to Plan A first.
            if (RTCBrowserType.usesUnifiedPlan()) {
                answer = self.interop.toPlanB(answer);
                self.trace('createAnswerOnSuccess::postTransform (Plan B)', dumpSDP(answer));
            }

            // munge local video SSRC
            answer = SSRCReplacement.mungeLocalVideoSSRC(answer);

            if (self.session.room.options.enableSimulcast && self.simulcast.isSupported()) {
                answer = self.simulcast.mungeLocalDescription(answer);
                self.trace('createAnswerOnSuccess::postTransform (simulcast)', dumpSDP(answer));
            }
            successCallback(answer);
        },
        function(err) {
            self.trace('createAnswerOnFailure', err);
            failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.addIceCandidate
        = function (candidate, successCallback, failureCallback) {
    //var self = this;
    this.trace('addIceCandidate', JSON.stringify(candidate, null, ' '));
    this.peerconnection.addIceCandidate(candidate);
    /* maybe later
     this.peerconnection.addIceCandidate(candidate,
     function () {
     self.trace('addIceCandidateOnSuccess');
     successCallback();
     },
     function (err) {
     self.trace('addIceCandidateOnFailure', err);
     failureCallback(err);
     }
     );
     */
};

TraceablePeerConnection.prototype.getStats = function(callback, errback) {
    // TODO: Is this the correct way to handle Opera, Temasys?
    if (RTCBrowserType.isFirefox()) {
        // ignore for now...
        if(!errback)
            errback = function () {};
        this.peerconnection.getStats(null, callback, errback);
    } else {
        this.peerconnection.getStats(callback);
    }
};

module.exports = TraceablePeerConnection;

}).call(this,"/modules/xmpp/TraceablePeerConnection.js")
},{"../../service/xmpp/XMPPEvents":87,"../RTC/RTC":16,"../RTC/RTCBrowserType.js":17,"./LocalSSRCReplacement":29,"jitsi-meet-logger":48,"sdp-interop":66,"sdp-simulcast":73,"sdp-transform":76}],34:[function(require,module,exports){
(function (__filename){
/* global $, $iq, Promise, Strophe */

var logger = require("jitsi-meet-logger").getLogger(__filename);
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var Settings = require("../settings/Settings");

var AuthenticationEvents
    = require("../../service/authentication/AuthenticationEvents");

function createExpBackoffTimer(step) {
    var count = 1;
    return function (reset) {
        // Reset call
        if (reset) {
            count = 1;
            return;
        }
        // Calculate next timeout
        var timeout = Math.pow(2, count - 1);
        count += 1;
        return timeout * step;
    };
}





function Moderator(roomName, xmpp, emitter) {
    this.roomName = roomName;
    this.xmppService = xmpp;
    this.getNextTimeout = createExpBackoffTimer(1000);
    this.getNextErrorTimeout = createExpBackoffTimer(1000);
    // External authentication stuff
    this.externalAuthEnabled = false;
    this.settings = new Settings(roomName);
    // Sip gateway can be enabled by configuring Jigasi host in config.js or
    // it will be enabled automatically if focus detects the component through
    // service discovery.
    this.sipGatewayEnabled = this.xmppService.options.hosts &&
        this.xmppService.options.hosts.call_control !== undefined;

    this.eventEmitter = emitter;

    this.connection = this.xmppService.connection;
    this.focusUserJid;
    //FIXME:
    // Message listener that talks to POPUP window
    function listener(event) {
        if (event.data && event.data.sessionId) {
            if (event.origin !== window.location.origin) {
                logger.warn("Ignoring sessionId from different origin: " +
                    event.origin);
                return;
            }
            localStorage.setItem('sessionId', event.data.sessionId);
            // After popup is closed we will authenticate
        }
    }
    // Register
    if (window.addEventListener) {
        window.addEventListener("message", listener, false);
    } else {
        window.attachEvent("onmessage", listener);
    }
}

Moderator.prototype.isExternalAuthEnabled =  function () {
    return this.externalAuthEnabled;
};

Moderator.prototype.isSipGatewayEnabled =  function () {
    return this.sipGatewayEnabled;
};


Moderator.prototype.onMucMemberLeft =  function (jid) {
    logger.info("Someone left is it focus ? " + jid);
    var resource = Strophe.getResourceFromJid(jid);
    if (resource === 'focus' && !this.xmppService.sessionTerminated) {
        logger.info(
            "Focus has left the room - leaving conference");
        //hangUp();
        // We'd rather reload to have everything re-initialized
        //FIXME: show some message before reload
        this.eventEmitter.emit(XMPPEvents.FOCUS_LEFT);
    }
};


Moderator.prototype.setFocusUserJid =  function (focusJid) {
    if (!this.focusUserJid) {
        this.focusUserJid = focusJid;
        logger.info("Focus jid set to:  " + this.focusUserJid);
    }
};


Moderator.prototype.getFocusUserJid =  function () {
    return this.focusUserJid;
};

Moderator.prototype.getFocusComponent =  function () {
    // Get focus component address
    var focusComponent = this.xmppService.options.hosts.focus;
    // If not specified use default:  'focus.domain'
    if (!focusComponent) {
        focusComponent = 'focus.' + this.xmppService.options.hosts.domain;
    }
    return focusComponent;
};

Moderator.prototype.createConferenceIq =  function () {
    // Generate create conference IQ
    var elem = $iq({to: this.getFocusComponent(), type: 'set'});

    // Session Id used for authentication
    var sessionId = localStorage.getItem('sessionId');
    var machineUID = this.settings.getSettings().uid;

    logger.info(
            "Session ID: " + sessionId + " machine UID: " + machineUID);

    elem.c('conference', {
        xmlns: 'http://jitsi.org/protocol/focus',
        room: this.roomName,
        'machine-uid': machineUID
    });

    if (sessionId) {
        elem.attrs({ 'session-id': sessionId});
    }
    if (this.xmppService.options.hosts.bridge !== undefined) {
        elem.c(
            'property', {
                name: 'bridge',
                value: this.xmppService.options.hosts.bridge
            }).up();
    }
    if (this.xmppService.options.enforcedBridge !== undefined) {
        elem.c(
            'property', {
                name: 'enforcedBridge',
                value: this.xmppService.options.enforcedBridge
            }).up();
    }
    // Tell the focus we have Jigasi configured
    if (this.xmppService.options.hosts.call_control !== undefined) {
        elem.c(
            'property', {
                name: 'call_control',
                value:  this.xmppService.options.hosts.call_control
            }).up();
    }
    if (this.xmppService.options.channelLastN !== undefined) {
        elem.c(
            'property', {
                name: 'channelLastN',
                value: this.xmppService.options.channelLastN
            }).up();
    }
    if (this.xmppService.options.adaptiveLastN !== undefined) {
        elem.c(
            'property', {
                name: 'adaptiveLastN',
                value: this.xmppService.options.adaptiveLastN
            }).up();
    }
    if (this.xmppService.options.adaptiveSimulcast !== undefined) {
        elem.c(
            'property', {
                name: 'adaptiveSimulcast',
                value: this.xmppService.options.adaptiveSimulcast
            }).up();
    }
    if (this.xmppService.options.openSctp !== undefined) {
        elem.c(
            'property', {
                name: 'openSctp',
                value: this.xmppService.options.openSctp
            }).up();
    }
    if (this.xmppService.options.startAudioMuted !== undefined)
    {
        elem.c(
            'property', {
                name: 'startAudioMuted',
                value: this.xmppService.options.startAudioMuted
            }).up();
    }
    if (this.xmppService.options.startVideoMuted !== undefined)
    {
        elem.c(
            'property', {
                name: 'startVideoMuted',
                value: this.xmppService.options.startVideoMuted
            }).up();
    }
    elem.c(
        'property', {
            name: 'simulcastMode',
            value: 'rewriting'
        }).up();
    elem.up();
    return elem;
};


Moderator.prototype.parseSessionId =  function (resultIq) {
    var sessionId = $(resultIq).find('conference').attr('session-id');
    if (sessionId) {
        logger.info('Received sessionId:  ' + sessionId);
        localStorage.setItem('sessionId', sessionId);
    }
};

Moderator.prototype.parseConfigOptions =  function (resultIq) {

    this.setFocusUserJid(
        $(resultIq).find('conference').attr('focusjid'));

    var authenticationEnabled
        = $(resultIq).find(
            '>conference>property' +
            '[name=\'authentication\'][value=\'true\']').length > 0;

    logger.info("Authentication enabled: " + authenticationEnabled);

    this.externalAuthEnabled = $(resultIq).find(
            '>conference>property' +
            '[name=\'externalAuth\'][value=\'true\']').length > 0;

    console.info(
        'External authentication enabled: ' + this.externalAuthEnabled);

    if (!this.externalAuthEnabled) {
        // We expect to receive sessionId in 'internal' authentication mode
        this.parseSessionId(resultIq);
    }

    var authIdentity = $(resultIq).find('>conference').attr('identity');

    this.eventEmitter.emit(AuthenticationEvents.IDENTITY_UPDATED,
        authenticationEnabled, authIdentity);

    // Check if focus has auto-detected Jigasi component(this will be also
    // included if we have passed our host from the config)
    if ($(resultIq).find(
        '>conference>property' +
        '[name=\'sipGatewayEnabled\'][value=\'true\']').length) {
        this.sipGatewayEnabled = true;
    }

    logger.info("Sip gateway enabled:  " + this.sipGatewayEnabled);
};

// FIXME =  we need to show the fact that we're waiting for the focus
// to the user(or that focus is not available)
Moderator.prototype.allocateConferenceFocus =  function (callback) {
    // Try to use focus user JID from the config
    this.setFocusUserJid(this.xmppService.options.focusUserJid);
    // Send create conference IQ
    var iq = this.createConferenceIq();
    var self = this;
    this.connection.sendIQ(
        iq,
        function (result) {

            // Setup config options
            self.parseConfigOptions(result);

            if ('true' === $(result).find('conference').attr('ready')) {
                // Reset both timers
                self.getNextTimeout(true);
                self.getNextErrorTimeout(true);
                // Exec callback
                callback();
            } else {
                var waitMs = self.getNextTimeout();
                logger.info("Waiting for the focus... " + waitMs);
                // Reset error timeout
                self.getNextErrorTimeout(true);
                window.setTimeout(
                    function () {
                        self.allocateConferenceFocus(callback);
                    }, waitMs);
            }
        },
        function (error) {
            // Invalid session ? remove and try again
            // without session ID to get a new one
            var invalidSession
                = $(error).find('>error>session-invalid').length;
            if (invalidSession) {
                logger.info("Session expired! - removing");
                localStorage.removeItem("sessionId");
            }
            if ($(error).find('>error>graceful-shutdown').length) {
                self.eventEmitter.emit(XMPPEvents.GRACEFUL_SHUTDOWN);
                return;
            }
            // Check for error returned by the reservation system
            var reservationErr = $(error).find('>error>reservation-error');
            if (reservationErr.length) {
                // Trigger error event
                var errorCode = reservationErr.attr('error-code');
                var errorMsg;
                if ($(error).find('>error>text')) {
                    errorMsg = $(error).find('>error>text').text();
                }
                self.eventEmitter.emit(
                    XMPPEvents.RESERVATION_ERROR, errorCode, errorMsg);
                return;
            }
            // Not authorized to create new room
            if ($(error).find('>error>not-authorized').length) {
                logger.warn("Unauthorized to start the conference", error);
                var toDomain
                    = Strophe.getDomainFromJid(error.getAttribute('to'));
                if (toDomain !==
                    this.xmppService.options.hosts.anonymousdomain) {
                    //FIXME:  "is external" should come either from
                    // the focus or config.js
                    self.externalAuthEnabled = true;
                }
                self.eventEmitter.emit(
                    XMPPEvents.AUTHENTICATION_REQUIRED,
                    function () {
                        self.allocateConferenceFocus(
                            callback);
                    });
                return;
            }
            var waitMs = self.getNextErrorTimeout();
            logger.error("Focus error, retry after " + waitMs, error);
            // Show message
            var focusComponent = self.getFocusComponent();
            var retrySec = waitMs / 1000;
            //FIXME:  message is duplicated ?
            // Do not show in case of session invalid
            // which means just a retry
            if (!invalidSession) {
                self.eventEmitter.emit(XMPPEvents.FOCUS_DISCONNECTED,
                    focusComponent, retrySec);
            }
            // Reset response timeout
            self.getNextTimeout(true);
            window.setTimeout(
                function () {
                    self.allocateConferenceFocus(callback);
                }, waitMs);
        }
    );
};

Moderator.prototype.authenticate = function () {
    var self = this;
    return new Promise(function (resolve, reject) {
        self.connection.sendIQ(
            self.createConferenceIq(),
            function (result) {
                self.parseSessionId(result);
                resolve();
            }, function (error) {
                var code = $(error).find('>error').attr('code');
                reject(error, code);
            }
        );
    });
};

Moderator.prototype.getLoginUrl =  function (urlCallback, failureCallback) {
    var iq = $iq({to: this.getFocusComponent(), type: 'get'});
    iq.c('login-url', {
        xmlns: 'http://jitsi.org/protocol/focus',
        room: this.roomName,
        'machine-uid': this.settings.getSettings().uid
    });
    this.connection.sendIQ(
        iq,
        function (result) {
            var url = $(result).find('login-url').attr('url');
            url = url = decodeURIComponent(url);
            if (url) {
                logger.info("Got auth url: " + url);
                urlCallback(url);
            } else {
                logger.error(
                    "Failed to get auth url from the focus", result);
                failureCallback(result);
            }
        },
        function (error) {
            logger.error("Get auth url error", error);
            failureCallback(error);
        }
    );
};

Moderator.prototype.getPopupLoginUrl = function (urlCallback, failureCallback) {
    var iq = $iq({to: this.getFocusComponent(), type: 'get'});
    iq.c('login-url', {
        xmlns: 'http://jitsi.org/protocol/focus',
        room: this.roomName,
        'machine-uid': this.settings.getSettings().uid,
        popup: true
    });
    this.connection.sendIQ(
        iq,
        function (result) {
            var url = $(result).find('login-url').attr('url');
            url = url = decodeURIComponent(url);
            if (url) {
                logger.info("Got POPUP auth url:  " + url);
                urlCallback(url);
            } else {
                logger.error(
                    "Failed to get POPUP auth url from the focus", result);
               failureCallback(result);
            }
        },
        function (error) {
            logger.error('Get POPUP auth url error', error);
            failureCallback(error);
        }
    );
};

Moderator.prototype.logout =  function (callback) {
    var iq = $iq({to: this.getFocusComponent(), type: 'set'});
    var sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        callback();
        return;
    }
    iq.c('logout', {
        xmlns: 'http://jitsi.org/protocol/focus',
        'session-id': sessionId
    });
    this.connection.sendIQ(
        iq,
        function (result) {
            var logoutUrl = $(result).find('logout').attr('logout-url');
            if (logoutUrl) {
                logoutUrl = decodeURIComponent(logoutUrl);
            }
            logger.info("Log out OK, url: " + logoutUrl, result);
            localStorage.removeItem('sessionId');
            callback(logoutUrl);
        },
        function (error) {
            logger.error("Logout error", error);
        }
    );
};

module.exports = Moderator;

}).call(this,"/modules/xmpp/moderator.js")
},{"../../service/authentication/AuthenticationEvents":83,"../../service/xmpp/XMPPEvents":87,"../settings/Settings":21,"jitsi-meet-logger":48}],35:[function(require,module,exports){
(function (__filename){
/* global $, $iq, config, connection, focusMucJid, messageHandler,
   Toolbar, Util, Promise */
var XMPPEvents = require("../../service/XMPP/XMPPEvents");
var logger = require("jitsi-meet-logger").getLogger(__filename);

function Recording(type, eventEmitter, connection, focusMucJid, jirecon,
    roomjid) {
    this.eventEmitter = eventEmitter;
    this.connection = connection;
    this.state = "off";
    this.focusMucJid = focusMucJid;
    this.jirecon = jirecon;
    this.url = null;
    this.type = type;
    this._isSupported = ((type === Recording.types.JIBRI)
        || (type === Recording.types.JIRECON && !this.jirecon))? false : true;
    /**
     * The ID of the jirecon recording session. Jirecon generates it when we
     * initially start recording, and it needs to be used in subsequent requests
     * to jirecon.
     */
    this.jireconRid = null;
    this.roomjid = roomjid;
}

Recording.types = {
    COLIBRI: "colibri",
    JIRECON: "jirecon",
    JIBRI: "jibri"
};

Recording.prototype.handleJibriPresence = function (jibri) {
    var attributes = jibri.attributes;
    if(!attributes)
        return;

    this._isSupported =
        (attributes.status && attributes.status !== "undefined");
    if(this._isSupported) {
        this.url = attributes.url || null;
        this.state = attributes.status || "off";
    }
    this.eventEmitter.emit(XMPPEvents.RECORDING_STATE_CHANGED);
};

Recording.prototype.setRecordingJibri = function (state, callback, errCallback,
    options) {
    if (state == this.state){
        errCallback(new Error("Invalid state!"));
    }
    options = options || {};
    // FIXME jibri does not accept IQ without 'url' attribute set ?

    var iq = $iq({to: this.focusMucJid, type: 'set'})
        .c('jibri', {
            "xmlns": 'http://jitsi.org/protocol/jibri',
            "action": (state === 'on') ? 'start' : 'stop',
            "streamid": options.streamId,
            "follow-entity": options.followEntity
        }).up();

    logger.log('Set jibri recording: '+state, iq.nodeTree);
    console.log(iq.nodeTree);
    this.connection.sendIQ(
        iq,
        function (result) {
            callback($(result).find('jibri').attr('state'),
            $(result).find('jibri').attr('url'));
        },
        function (error) {
            logger.log('Failed to start recording, error: ', error);
            errCallback(error);
        });
};

Recording.prototype.setRecordingJirecon =
function (state, callback, errCallback, options) {
    if (state == this.state){
        errCallback(new Error("Invalid state!"));
    }

    var iq = $iq({to: this.jirecon, type: 'set'})
        .c('recording', {xmlns: 'http://jitsi.org/protocol/jirecon',
            action: (state === 'on') ? 'start' : 'stop',
            mucjid: this.roomjid});
    if (state === 'off'){
        iq.attrs({rid: this.jireconRid});
    }

    console.log('Start recording');
    var self = this;
    this.connection.sendIQ(
        iq,
        function (result) {
            // TODO wait for an IQ with the real status, since this is
            // provisional?
            self.jireconRid = $(result).find('recording').attr('rid');
            console.log('Recording ' +
                ((state === 'on') ? 'started' : 'stopped') +
                '(jirecon)' + result);
            self.state = state;
            if (state === 'off'){
                self.jireconRid = null;
            }

            callback(state);
        },
        function (error) {
            console.log('Failed to start recording, error: ', error);
            errCallback(error);
        });
};

// Sends a COLIBRI message which enables or disables (according to 'state')
// the recording on the bridge. Waits for the result IQ and calls 'callback'
// with the new recording state, according to the IQ.
Recording.prototype.setRecordingColibri =
function (state, callback, errCallback, options) {
    var elem = $iq({to: this.focusMucJid, type: 'set'});
    elem.c('conference', {
        xmlns: 'http://jitsi.org/protocol/colibri'
    });
    elem.c('recording', {state: state, token: options.token});

    var self = this;
    this.connection.sendIQ(elem,
        function (result) {
            console.log('Set recording "', state, '". Result:', result);
            var recordingElem = $(result).find('>conference>recording');
            var newState = recordingElem.attr('state');

            self.state = newState;
            callback(newState);

            if (newState === 'pending') {
                self.connection.addHandler(function(iq){
                    var state = $(iq).find('recording').attr('state');
                    if (state) {
                        self.state = newState;
                        callback(state);
                    }
                }, 'http://jitsi.org/protocol/colibri', 'iq', null, null, null);
            }
        },
        function (error) {
            console.warn(error);
            errCallback(error);
        }
    );
};

Recording.prototype.setRecording =
function (state, callback, errCallback, options) {
    switch(this.type){
        case Recording.types.JIRECON:
            this.setRecordingJirecon(state, callback, errCallback, options);
            break;
        case Recording.types.COLIBRI:
            this.setRecordingColibri(state, callback, errCallback, options);
            break;
        case Recording.types.JIBRI:
            this.setRecordingJibri(state, callback, errCallback, options);
            break;
        default:
            console.error("Unknown recording type!");
            return;
    }
};

/**
 *Starts/stops the recording
 * @param token token for authentication
 * @param statusChangeHandler {function} receives the new status as argument.
 */
Recording.prototype.toggleRecording = function (options, statusChangeHandler) {
    if ((!options.token && this.type === Recording.types.COLIBRI) ||
        (!options.streamId && this.type === Recording.types.JIBRI)){
        statusChangeHandler("error", new Error("No token passed!"));
        logger.error("No token passed!");
        return;
    }

    var oldState = this.state;
    var newState = (oldState === 'off' || !oldState) ? 'on' : 'off';
    var self = this;
    this.setRecording(newState,
        function (state, url) {
            logger.log("New recording state: ", state);
            if (state && state !== oldState) {
                self.state = state;
                self.url = url;
                statusChangeHandler(state);
            } else {
                statusChangeHandler("error", new Error("Status not changed!"));
            }
        }, function (error) {
            statusChangeHandler("error", error);
        }, options);
};

/**
 * Returns true if the recording is supproted and false if not.
 */
Recording.prototype.isSupported = function () {
    return this._isSupported;
};

/**
 * Returns null if the recording is not supported, "on" if the recording started
 * and "off" if the recording is not started.
 */
Recording.prototype.getState = function () {
    return this.state;
};

/**
 * Returns the url of the recorded video.
 */
Recording.prototype.getURL = function () {
    return this.url;
};

module.exports = Recording;

}).call(this,"/modules/xmpp/recording.js")
},{"../../service/XMPP/XMPPEvents":82,"jitsi-meet-logger":48}],36:[function(require,module,exports){
(function (__filename){
/* jshint -W117 */
/* a simple MUC connection plugin
 * can only handle a single MUC room
 */

var logger = require("jitsi-meet-logger").getLogger(__filename);
var ChatRoom = require("./ChatRoom");

module.exports = function(XMPP) {
    Strophe.addConnectionPlugin('emuc', {
        connection: null,
        rooms: {},//map with the rooms
        init: function (conn) {
            this.connection = conn;
            // add handlers (just once)
            this.connection.addHandler(this.onPresence.bind(this), null,
                'presence', null, null, null, null);
            this.connection.addHandler(this.onPresenceUnavailable.bind(this),
                null, 'presence', 'unavailable', null);
            this.connection.addHandler(this.onPresenceError.bind(this), null,
                'presence', 'error', null);
            this.connection.addHandler(this.onMessage.bind(this), null,
                'message', null, null);
            this.connection.addHandler(this.onMute.bind(this),
                'http://jitsi.org/jitmeet/audio', 'iq', 'set',null,null);
        },
        createRoom: function (jid, password, options) {
            var roomJid = Strophe.getBareJidFromJid(jid);
            if (this.rooms[roomJid]) {
                logger.error("You are already in the room!");
                return;
            }
            this.rooms[roomJid] = new ChatRoom(this.connection, jid, password, XMPP, options);
            return this.rooms[roomJid];
        },
        doLeave: function (jid) {
            this.rooms[jid].doLeave();
            delete this.rooms[jid];
        },
        onPresence: function (pres) {
            var from = pres.getAttribute('from');

            // What is this for? A workaround for something?
            if (pres.getAttribute('type')) {
                return true;
            }

            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            // Parse status.
            if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="201"]').length) {
                room.createNonAnonymousRoom();
            }

            room.onPresence(pres);

            return true;
        },
        onPresenceUnavailable: function (pres) {
            var from = pres.getAttribute('from');
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.onPresenceUnavailable(pres, from);
            return true;
        },
        onPresenceError: function (pres) {
            var from = pres.getAttribute('from');
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.onPresenceError(pres, from);
            return true;
        },
        onMessage: function (msg) {
            // FIXME: this is a hack. but jingle on muc makes nickchanges hard
            var from = msg.getAttribute('from');
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.onMessage(msg, from);
            return true;
        },

        setJingleSession: function (from, session) {
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.setJingleSession(session);
        },

        onMute: function(iq) {
            var from = iq.getAttribute('from');
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.onMute(iq);
            return true;
        }
    });
};

}).call(this,"/modules/xmpp/strophe.emuc.js")
},{"./ChatRoom":26,"jitsi-meet-logger":48}],37:[function(require,module,exports){
(function (__filename){
/* jshint -W117 */


var logger = require("jitsi-meet-logger").getLogger(__filename);
var JingleSession = require("./JingleSessionPC");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var RTCBrowserType = require("../RTC/RTCBrowserType");


module.exports = function(XMPP, eventEmitter) {
    Strophe.addConnectionPlugin('jingle', {
        connection: null,
        sessions: {},
        jid2session: {},
        ice_config: {iceServers: []},
        media_constraints: {
            mandatory: {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true
            }
            // MozDontOfferDataChannel: true when this is firefox
        },
        init: function (conn) {
            this.connection = conn;
            if (this.connection.disco) {
                // http://xmpp.org/extensions/xep-0167.html#support
                // http://xmpp.org/extensions/xep-0176.html#support
                this.connection.disco.addFeature('urn:xmpp:jingle:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:transports:ice-udp:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:dtls:0');
                this.connection.disco.addFeature('urn:xmpp:jingle:transports:dtls-sctp:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:audio');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:video');

                if (RTCBrowserType.isChrome() || RTCBrowserType.isOpera()
                    || RTCBrowserType.isTemasysPluginUsed()) {
                    this.connection.disco.addFeature('urn:ietf:rfc:4588');
                }

                // this is dealt with by SDP O/A so we don't need to announce this
                //this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:rtcp-fb:0'); // XEP-0293
                //this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:rtp-hdrext:0'); // XEP-0294

                this.connection.disco.addFeature('urn:ietf:rfc:5761'); // rtcp-mux
                this.connection.disco.addFeature('urn:ietf:rfc:5888'); // a=group, e.g. bundle

                //this.connection.disco.addFeature('urn:ietf:rfc:5576'); // a=ssrc
            }
            this.connection.addHandler(this.onJingle.bind(this), 'urn:xmpp:jingle:1', 'iq', 'set', null, null);
        },
        onJingle: function (iq) {
            var sid = $(iq).find('jingle').attr('sid');
            var action = $(iq).find('jingle').attr('action');
            var fromJid = iq.getAttribute('from');
            // send ack first
            var ack = $iq({type: 'result',
                to: fromJid,
                id: iq.getAttribute('id')
            });
            logger.log('on jingle ' + action + ' from ' + fromJid, iq);
            var sess = this.sessions[sid];
            if ('session-initiate' != action) {
                if (sess === null) {
                    ack.type = 'error';
                    ack.c('error', {type: 'cancel'})
                        .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                        .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                    this.connection.send(ack);
                    return true;
                }
                // local jid is not checked
                if (fromJid != sess.peerjid) {
                    logger.warn('jid mismatch for session id', sid, fromJid, sess.peerjid);
                    ack.type = 'error';
                    ack.c('error', {type: 'cancel'})
                        .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                        .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                    this.connection.send(ack);
                    return true;
                }
            } else if (sess !== undefined) {
                // existing session with same session id
                // this might be out-of-order if the sess.peerjid is the same as from
                ack.type = 'error';
                ack.c('error', {type: 'cancel'})
                    .c('service-unavailable', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up();
                logger.warn('duplicate session id', sid);
                this.connection.send(ack);
                return true;
            }
            // FIXME: check for a defined action
            this.connection.send(ack);
            // see http://xmpp.org/extensions/xep-0166.html#concepts-session
            switch (action) {
                case 'session-initiate':
                    console.log("(TIME) received session-initiate:\t",
                                window.performance.now());
                    var startMuted = $(iq).find('jingle>startmuted');
                    if (startMuted && startMuted.length > 0) {
                        var audioMuted = startMuted.attr("audio");
                        var videoMuted = startMuted.attr("video");
                        eventEmitter.emit(XMPPEvents.START_MUTED_FROM_FOCUS,
                                audioMuted === "true", videoMuted === "true");
                    }
                    sess = new JingleSession(
                        $(iq).attr('to'), $(iq).find('jingle').attr('sid'),
                        this.connection, XMPP);
                    // configure session

                    var fromBareJid = Strophe.getBareJidFromJid(fromJid);
                    this.connection.emuc.setJingleSession(fromBareJid, sess);

                    sess.media_constraints = this.media_constraints;
                    sess.ice_config = this.ice_config;

                    sess.initialize(fromJid, false);
                    eventEmitter.emit(XMPPEvents.CALL_INCOMING, sess);
                    // FIXME: setRemoteDescription should only be done when this call is to be accepted
                    sess.setOffer($(iq).find('>jingle'));

                    this.sessions[sess.sid] = sess;
                    this.jid2session[sess.peerjid] = sess;

                    // the callback should either
                    // .sendAnswer and .accept
                    // or .sendTerminate -- not necessarily synchronous

                    sess.sendAnswer();
                    sess.accept();
                    break;
                case 'session-accept':
                    sess.setAnswer($(iq).find('>jingle'));
                    sess.accept();
                    break;
                case 'session-terminate':
                    // If this is not the focus sending the terminate, we have
                    // nothing more to do here.
                    if (Object.keys(this.sessions).length < 1
                        || !(this.sessions[Object.keys(this.sessions)[0]]
                            instanceof JingleSession))
                    {
                        break;
                    }
                    logger.log('terminating...', sess.sid);
                    sess.terminate();
                    this.terminate(sess.sid);
                    if ($(iq).find('>jingle>reason').length) {
                        $(document).trigger('callterminated.jingle', [
                            sess.sid,
                            sess.peerjid,
                            $(iq).find('>jingle>reason>:first')[0].tagName,
                            $(iq).find('>jingle>reason>text').text()
                        ]);
                    } else {
                        $(document).trigger('callterminated.jingle',
                            [sess.sid, sess.peerjid]);
                    }
                    break;
                case 'transport-info':
                    sess.addIceCandidate($(iq).find('>jingle>content'));
                    break;
                case 'session-info':
                    var affected;
                    if ($(iq).find('>jingle>ringing[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        $(document).trigger('ringing.jingle', [sess.sid]);
                    } else if ($(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        affected = $(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                        $(document).trigger('mute.jingle', [sess.sid, affected]);
                    } else if ($(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        affected = $(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                        $(document).trigger('unmute.jingle', [sess.sid, affected]);
                    }
                    break;
                case 'addsource': // FIXME: proprietary, un-jingleish
                case 'source-add': // FIXME: proprietary
                    sess.addSource($(iq).find('>jingle>content'));
                    break;
                case 'removesource': // FIXME: proprietary, un-jingleish
                case 'source-remove': // FIXME: proprietary
                    sess.removeSource($(iq).find('>jingle>content'));
                    break;
                default:
                    logger.warn('jingle action not implemented', action);
                    break;
            }
            return true;
        },
        terminate: function (sid, reason, text) { // terminate by sessionid (or all sessions)
            if (sid === null || sid === undefined) {
                for (sid in this.sessions) {
                    if (this.sessions[sid].state != 'ended') {
                        this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                        this.sessions[sid].terminate();
                    }
                    delete this.jid2session[this.sessions[sid].peerjid];
                    delete this.sessions[sid];
                }
            } else if (this.sessions.hasOwnProperty(sid)) {
                if (this.sessions[sid].state != 'ended') {
                    this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                    this.sessions[sid].terminate();
                }
                delete this.jid2session[this.sessions[sid].peerjid];
                delete this.sessions[sid];
            }
        },
        getStunAndTurnCredentials: function () {
            // get stun and turn configuration from server via xep-0215
            // uses time-limited credentials as described in
            // http://tools.ietf.org/html/draft-uberti-behave-turn-rest-00
            //
            // see https://code.google.com/p/prosody-modules/source/browse/mod_turncredentials/mod_turncredentials.lua
            // for a prosody module which implements this
            //
            // currently, this doesn't work with updateIce and therefore credentials with a long
            // validity have to be fetched before creating the peerconnection
            // TODO: implement refresh via updateIce as described in
            //      https://code.google.com/p/webrtc/issues/detail?id=1650
            var self = this;
            this.connection.sendIQ(
                $iq({type: 'get', to: this.connection.domain})
                    .c('services', {xmlns: 'urn:xmpp:extdisco:1'}).c('service', {host: 'turn.' + this.connection.domain}),
                function (res) {
                    var iceservers = [];
                    $(res).find('>services>service').each(function (idx, el) {
                        el = $(el);
                        var dict = {};
                        var type = el.attr('type');
                        switch (type) {
                            case 'stun':
                                dict.url = 'stun:' + el.attr('host');
                                if (el.attr('port')) {
                                    dict.url += ':' + el.attr('port');
                                }
                                iceservers.push(dict);
                                break;
                            case 'turn':
                            case 'turns':
                                dict.url = type + ':';
                                if (el.attr('username')) { // https://code.google.com/p/webrtc/issues/detail?id=1508
                                    if (navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) && parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10) < 28) {
                                        dict.url += el.attr('username') + '@';
                                    } else {
                                        dict.username = el.attr('username'); // only works in M28
                                    }
                                }
                                dict.url += el.attr('host');
                                if (el.attr('port') && el.attr('port') != '3478') {
                                    dict.url += ':' + el.attr('port');
                                }
                                if (el.attr('transport') && el.attr('transport') != 'udp') {
                                    dict.url += '?transport=' + el.attr('transport');
                                }
                                if (el.attr('password')) {
                                    dict.credential = el.attr('password');
                                }
                                iceservers.push(dict);
                                break;
                        }
                    });
                    self.ice_config.iceServers = iceservers;
                },
                function (err) {
                    logger.warn('getting turn credentials failed', err);
                    logger.warn('is mod_turncredentials or similar installed?');
                }
            );
            // implement push?
        },

        /**
         * Returns the data saved in 'updateLog' in a format to be logged.
         */
        getLog: function () {
            var data = {};
            var self = this;
            Object.keys(this.sessions).forEach(function (sid) {
                var session = self.sessions[sid];
                if (session.peerconnection && session.peerconnection.updateLog) {
                    // FIXME: should probably be a .dump call
                    data["jingle_" + session.sid] = {
                        updateLog: session.peerconnection.updateLog,
                        stats: session.peerconnection.stats,
                        url: window.location.href
                    };
                }
            });
            return data;
        }
    });
};


}).call(this,"/modules/xmpp/strophe.jingle.js")
},{"../../service/xmpp/XMPPEvents":87,"../RTC/RTCBrowserType":17,"./JingleSessionPC":28,"jitsi-meet-logger":48}],38:[function(require,module,exports){
/* global Strophe */
module.exports = function () {

    Strophe.addConnectionPlugin('logger', {
        // logs raw stanzas and makes them available for download as JSON
        connection: null,
        log: [],
        init: function (conn) {
            this.connection = conn;
            this.connection.rawInput = this.log_incoming.bind(this);
            this.connection.rawOutput = this.log_outgoing.bind(this);
        },
        log_incoming: function (stanza) {
            this.log.push([new Date().getTime(), 'incoming', stanza]);
        },
        log_outgoing: function (stanza) {
            this.log.push([new Date().getTime(), 'outgoing', stanza]);
        }
    });
};
},{}],39:[function(require,module,exports){
(function (__filename){
/* global $, $iq, Strophe */

var logger = require("jitsi-meet-logger").getLogger(__filename);

var XMPPEvents = require("../../service/xmpp/XMPPEvents");

/**
 * Ping every 20 sec
 */
var PING_INTERVAL = 20000;

/**
 * Ping timeout error after 15 sec of waiting.
 */
var PING_TIMEOUT = 15000;

/**
 * Will close the connection after 3 consecutive ping errors.
 */
var PING_THRESHOLD = 3;

/**
 * XEP-0199 ping plugin.
 *
 * Registers "urn:xmpp:ping" namespace under Strophe.NS.PING.
 */
module.exports = function (XMPP, eventEmitter) {
    Strophe.addConnectionPlugin('ping', {

        connection: null,

        failedPings: 0,

        /**
         * Initializes the plugin. Method called by Strophe.
         * @param connection Strophe connection instance.
         */
        init: function (connection) {
            this.connection = connection;
            Strophe.addNamespace('PING', "urn:xmpp:ping");
        },

        /**
         * Sends "ping" to given <tt>jid</tt>
         * @param jid the JID to which ping request will be sent.
         * @param success callback called on success.
         * @param error callback called on error.
         * @param timeout ms how long are we going to wait for the response. On
         *        timeout <tt>error<//t> callback is called with undefined error
         *        argument.
         */
        ping: function (jid, success, error, timeout) {
            var iq = $iq({type: 'get', to: jid});
            iq.c('ping', {xmlns: Strophe.NS.PING});
            this.connection.sendIQ(iq, success, error, timeout);
        },

        /**
         * Checks if given <tt>jid</tt> has XEP-0199 ping support.
         * @param jid the JID to be checked for ping support.
         * @param callback function with boolean argument which will be
         * <tt>true</tt> if XEP-0199 ping is supported by given <tt>jid</tt>
         */
        hasPingSupport: function (jid, callback) {
            this.connection.disco.info(
                jid, null,
                function (result) {
                    var ping = $(result).find('>>feature[var="urn:xmpp:ping"]');
                    callback(ping.length > 0);
                },
                function (error) {
                    logger.error("Ping feature discovery error", error);
                    callback(false);
                }
            );
        },

        /**
         * Starts to send ping in given interval to specified remote JID.
         * This plugin supports only one such task and <tt>stopInterval</tt>
         * must be called before starting a new one.
         * @param remoteJid remote JID to which ping requests will be sent to.
         * @param interval task interval in ms.
         */
        startInterval: function (remoteJid, interval) {
            if (this.intervalId) {
                logger.error("Ping task scheduled already");
                return;
            }
            if (!interval)
                interval = PING_INTERVAL;
            var self = this;
            this.intervalId = window.setInterval(function () {
                self.ping(remoteJid,
                function (result) {
                    // Ping OK
                    self.failedPings = 0;
                },
                function (error) {
                    self.failedPings += 1;
                    logger.error(
                        "Ping " + (error ? "error" : "timeout"), error);
                    if (self.failedPings >= PING_THRESHOLD) {
                        self.connection.disconnect();
                    }
                }, PING_TIMEOUT);
            }, interval);
            logger.info("XMPP pings will be sent every " + interval + " ms");
        },

        /**
         * Stops current "ping"  interval task.
         */
        stopInterval: function () {
            if (this.intervalId) {
                window.clearInterval(this.intervalId);
                this.intervalId = null;
                this.failedPings = 0;
                logger.info("Ping interval cleared");
            }
        }
    });
};

}).call(this,"/modules/xmpp/strophe.ping.js")
},{"../../service/xmpp/XMPPEvents":87,"jitsi-meet-logger":48}],40:[function(require,module,exports){
(function (__filename){
/* jshint -W117 */
var logger = require("jitsi-meet-logger").getLogger(__filename);

module.exports = function() {
    Strophe.addConnectionPlugin('rayo',
        {
            RAYO_XMLNS: 'urn:xmpp:rayo:1',
            connection: null,
            init: function (conn) {
                this.connection = conn;
                if (this.connection.disco) {
                    this.connection.disco.addFeature('urn:xmpp:rayo:client:1');
                }

                this.connection.addHandler(
                    this.onRayo.bind(this), this.RAYO_XMLNS, 'iq', 'set',
                    null, null);
            },
            onRayo: function (iq) {
                logger.info("Rayo IQ", iq);
            },
            dial: function (to, from, roomName, roomPass, focusMucJid) {
                var self = this;
                return new Promise(function (resolve, reject) {
                    if(!focusMucJid) {
                        reject(new Error("Internal error!"));
                        return;
                    }
                    var req = $iq(
                        {
                            type: 'set',
                            to: focusMucJid
                        }
                    );
                    req.c('dial',
                        {
                            xmlns: self.RAYO_XMLNS,
                            to: to,
                            from: from
                        });
                    req.c('header',
                        {
                            name: 'JvbRoomName',
                            value: roomName
                        }).up();

                    if (roomPass !== null && roomPass.length) {

                        req.c('header',
                            {
                                name: 'JvbRoomPassword',
                                value: roomPass
                            }).up();
                    }

                    self.connection.sendIQ(
                        req,
                        function (result) {
                            logger.info('Dial result ', result);

                            var resource = $(result).find('ref').attr('uri');
                            self.call_resource =
                                resource.substr('xmpp:'.length);
                            logger.info(
                                "Received call resource: " +
                                self.call_resource);
                            resolve();
                        },
                        function (error) {
                            logger.info('Dial error ', error);
                            reject(error);
                        }
                    );
                });
            },
            hangup: function () {
                var self = this;
                return new Promise(function (resolve, reject) {
                    if (!self.call_resource) {
                        reject(new Error("No call in progress"));
                        logger.warn("No call in progress");
                        return;
                    }

                    var req = $iq(
                        {
                            type: 'set',
                            to: self.call_resource
                        }
                    );
                    req.c('hangup',
                        {
                            xmlns: self.RAYO_XMLNS
                        });

                    self.connection.sendIQ(
                        req,
                        function (result) {
                            logger.info('Hangup result ', result);
                            self.call_resource = null;
                            resolve();
                        },
                        function (error) {
                            logger.info('Hangup error ', error);
                            self.call_resource = null;
                            reject(new Error('Hangup error '));
                        }
                    );
                });
            }
        }
    );
};

}).call(this,"/modules/xmpp/strophe.rayo.js")
},{"jitsi-meet-logger":48}],41:[function(require,module,exports){
(function (__filename){
/* global Strophe */
/**
 * Strophe logger implementation. Logs from level WARN and above.
 */
var logger = require("jitsi-meet-logger").getLogger(__filename);

module.exports = function () {

    Strophe.log = function (level, msg) {
        switch (level) {
            case Strophe.LogLevel.WARN:
                logger.warn("Strophe: " + msg);
                break;
            case Strophe.LogLevel.ERROR:
            case Strophe.LogLevel.FATAL:
                logger.error("Strophe: " + msg);
                break;
        }
    };

    Strophe.getStatusString = function (status) {
        switch (status) {
            case Strophe.Status.ERROR:
                return "ERROR";
            case Strophe.Status.CONNECTING:
                return "CONNECTING";
            case Strophe.Status.CONNFAIL:
                return "CONNFAIL";
            case Strophe.Status.AUTHENTICATING:
                return "AUTHENTICATING";
            case Strophe.Status.AUTHFAIL:
                return "AUTHFAIL";
            case Strophe.Status.CONNECTED:
                return "CONNECTED";
            case Strophe.Status.DISCONNECTED:
                return "DISCONNECTED";
            case Strophe.Status.DISCONNECTING:
                return "DISCONNECTING";
            case Strophe.Status.ATTACHED:
                return "ATTACHED";
            default:
                return "unknown";
        }
    };
};

}).call(this,"/modules/xmpp/strophe.util.js")
},{"jitsi-meet-logger":48}],42:[function(require,module,exports){
(function (__filename){
/* global $, APP, config, Strophe*/

var logger = require("jitsi-meet-logger").getLogger(__filename);
var EventEmitter = require("events");
var Pako = require("pako");
var RTCEvents = require("../../service/RTC/RTCEvents");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var JitsiConnectionErrors = require("../../JitsiConnectionErrors");
var JitsiConnectionEvents = require("../../JitsiConnectionEvents");
var RTC = require("../RTC/RTC");

var authenticatedUser = false;

function createConnection(bosh) {
    bosh = bosh || '/http-bind';

    // Append token as URL param
    if (this.token) {
        bosh += bosh.indexOf('?') == -1 ?
                '?token=' + this.token : '&token=' + this.token;
    }

    return new Strophe.Connection(bosh);
};



//!!!!!!!!!! FIXME: ...
function initStrophePlugins(XMPP)
{
    require("./strophe.emuc")(XMPP);
    require("./strophe.jingle")(XMPP, XMPP.eventEmitter);
//    require("./strophe.moderate")(XMPP, eventEmitter);
    require("./strophe.util")();
    require("./strophe.ping")(XMPP, XMPP.eventEmitter);
    require("./strophe.rayo")();
    require("./strophe.logger")();
}

//!!!!!!!!!! FIXME: ...
///**
// * If given <tt>localStream</tt> is video one this method will advertise it's
// * video type in MUC presence.
// * @param localStream new or modified <tt>LocalStream</tt>.
// */
//function broadcastLocalVideoType(localStream) {
//    if (localStream.videoType)
//        XMPP.addToPresence('videoType', localStream.videoType);
//}
//
//function registerListeners() {
//    RTC.addStreamListener(
//        broadcastLocalVideoType,
//        StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED
//    );
//    RTC.addListener(RTCEvents.AVAILABLE_DEVICES_CHANGED, function (devices) {
//        XMPP.addToPresence("devices", devices);
//    });
//}

function XMPP(options) {
    this.eventEmitter = new EventEmitter();
    this.connection = null;
    this.disconnectInProgress = false;

    this.forceMuted = false;
    this.options = options;
    initStrophePlugins(this);
//    registerListeners();

    this.connection = createConnection(options.bosh);
}


XMPP.prototype.getConnection = function(){ return connection; };

XMPP.prototype._connect = function (jid, password) {

    var self = this;
    // connection.connect() starts the connection process.
    //
    // As the connection process proceeds, the user supplied callback will
    // be triggered multiple times with status updates. The callback should
    // take two arguments - the status code and the error condition.
    //
    // The status code will be one of the values in the Strophe.Status
    // constants. The error condition will be one of the conditions defined
    // in RFC 3920 or the condition ‘strophe-parsererror’.
    //
    // The Parameters wait, hold and route are optional and only relevant
    // for BOSH connections. Please see XEP 124 for a more detailed
    // explanation of the optional parameters.
    //
    // Connection status constants for use by the connection handler
    // callback.
    //
    //  Status.ERROR - An error has occurred (websockets specific)
    //  Status.CONNECTING - The connection is currently being made
    //  Status.CONNFAIL - The connection attempt failed
    //  Status.AUTHENTICATING - The connection is authenticating
    //  Status.AUTHFAIL - The authentication attempt failed
    //  Status.CONNECTED - The connection has succeeded
    //  Status.DISCONNECTED - The connection has been terminated
    //  Status.DISCONNECTING - The connection is currently being terminated
    //  Status.ATTACHED - The connection has been attached

    var anonymousConnectionFailed = false;
    var connectionFailed = false;
    var lastErrorMsg;
    this.connection.connect(jid, password, function (status, msg) {
        logger.log("(TIME) Strophe " + Strophe.getStatusString(status) +
            (msg ? "[" + msg + "]" : "") + "\t:" + window.performance.now());
        if (status === Strophe.Status.CONNECTED) {
            if (self.options.useStunTurn) {
                self.connection.jingle.getStunAndTurnCredentials();
            }


            logger.info("My Jabber ID: " + self.connection.jid);

            // Schedule ping ?
            var pingJid = self.connection.domain;
            self.connection.ping.hasPingSupport(
                pingJid,
                function (hasPing) {
                    if (hasPing)
                        self.connection.ping.startInterval(pingJid);
                    else
                        logger.warn("Ping NOT supported by " + pingJid);
                }
            );

            if (password)
                authenticatedUser = true;
            if (self.connection && self.connection.connected &&
                Strophe.getResourceFromJid(self.connection.jid)) {
                // .connected is true while connecting?
//                self.connection.send($pres());
                self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_ESTABLISHED,
                    Strophe.getResourceFromJid(self.connection.jid));
            }
        } else if (status === Strophe.Status.CONNFAIL) {
            if (msg === 'x-strophe-bad-non-anon-jid') {
                anonymousConnectionFailed = true;
            }
            else
            {
                connectionFailed = true;
            }
            lastErrorMsg = msg;
        } else if (status === Strophe.Status.DISCONNECTED) {
            // Stop ping interval
            self.connection.ping.stopInterval();
            self.disconnectInProgress = false;
            if (anonymousConnectionFailed) {
                // prompt user for username and password
                self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_FAILED,
                    JitsiConnectionErrors.PASSWORD_REQUIRED);
            } else if(connectionFailed) {
                self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_FAILED,
                    JitsiConnectionErrors.OTHER_ERROR,
                    msg ? msg : lastErrorMsg);
            } else {
                self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_DISCONNECTED,
                    msg ? msg : lastErrorMsg);
            }
        } else if (status === Strophe.Status.AUTHFAIL) {
            // wrong password or username, prompt user
            self.eventEmitter.emit(JitsiConnectionEvents.CONNECTION_FAILED,
                JitsiConnectionErrors.PASSWORD_REQUIRED);

        }
    });
}

XMPP.prototype.connect = function (jid, password) {
    if(!jid) {
        var configDomain = this.options.hosts.anonymousdomain || this.options.hosts.domain;
        // Force authenticated domain if room is appended with '?login=true'
        if (this.options.hosts.anonymousdomain &&
            window.location.search.indexOf("login=true") !== -1) {
            configDomain = this.options.hosts.domain;
        }
        jid = configDomain || window.location.hostname;
    }
    return this._connect(jid, password);
};

XMPP.prototype.createRoom = function (roomName, options) {
    var roomjid = roomName  + '@' + this.options.hosts.muc;

    if (options.useNicks) {
        if (options.nick) {
            roomjid += '/' + options.nick;
        } else {
            roomjid += '/' + Strophe.getNodeFromJid(this.connection.jid);
        }
    } else {
        var tmpJid = Strophe.getNodeFromJid(this.connection.jid);

        if(!authenticatedUser)
            tmpJid = tmpJid.substr(0, 8);

        roomjid += '/' + tmpJid;
    }

    return this.connection.emuc.createRoom(roomjid, null, options);
}

XMPP.prototype.addListener = function(type, listener) {
    this.eventEmitter.on(type, listener);
};

XMPP.prototype.removeListener = function (type, listener) {
    this.eventEmitter.removeListener(type, listener);
};

//FIXME: this should work with the room
XMPP.prototype.leaveRoom = function (jid) {
    var handler = this.connection.jingle.jid2session[jid];
    if (handler && handler.peerconnection) {
        // FIXME: probably removing streams is not required and close() should
        // be enough
        if (RTC.localAudio) {
            handler.peerconnection.removeStream(
                RTC.localAudio.getOriginalStream(), true);
        }
        if (RTC.localVideo) {
            handler.peerconnection.removeStream(
                RTC.localVideo.getOriginalStream(), true);
        }
        handler.peerconnection.close();
    }
    this.eventEmitter.emit(XMPPEvents.DISPOSE_CONFERENCE);
    this.connection.emuc.doLeave(jid);
};

/**
 * Sends 'data' as a log message to the focus. Returns true iff a message
 * was sent.
 * @param data
 * @returns {boolean} true iff a message was sent.
 */
XMPP.prototype.sendLogs = function (data) {
    if(!this.connection.emuc.focusMucJid)
        return false;

    var deflate = true;

    var content = JSON.stringify(data);
    if (deflate) {
        content = String.fromCharCode.apply(null, Pako.deflateRaw(content));
    }
    content = Base64.encode(content);
    // XEP-0337-ish
    var message = $msg({to: this.connection.emuc.focusMucJid, type: 'normal'});
    message.c('log', { xmlns: 'urn:xmpp:eventlog',
        id: 'PeerConnectionStats'});
    message.c('message').t(content).up();
    if (deflate) {
        message.c('tag', {name: "deflated", value: "true"}).up();
    }
    message.up();

    this.connection.send(message);
    return true;
};

// Gets the logs from strophe.jingle.
XMPP.prototype.getJingleLog = function () {
    return this.connection.jingle ? this.connection.jingle.getLog() : {};
};

// Gets the logs from strophe.
XMPP.prototype.getXmppLog = function () {
    return this.connection.logger ? this.connection.logger.log : null;
};


XMPP.prototype.dial = function (to, from, roomName,roomPass) {
    this.connection.rayo.dial(to, from, roomName,roomPass);
};

XMPP.prototype.setMute = function (jid, mute) {
    this.connection.moderate.setMute(jid, mute);
};

XMPP.prototype.eject = function (jid) {
    this.connection.moderate.eject(jid);
};

XMPP.prototype.getSessions = function () {
    return this.connection.jingle.sessions;
};

XMPP.prototype.disconnect = function () {
    if (this.disconnectInProgress || !this.connection || !this.connection.connected)
    {
        this.eventEmitter.emit(JitsiConnectionEvents.WRONG_STATE);
        return;
    }

    this.disconnectInProgress = true;

    this.connection.disconnect();
};

/**
 * Gets the SSRC of local media stream.
 * @param mediaType the media type that tells whether we want to get
 *        the SSRC of local audio or video stream.
 * @returns {*} the SSRC number for local media stream or <tt>null</tt> if
 *              not available.
 */
XMPP.prototype.getLocalSSRC = function (mediaType) {
    if (this.connection.jingle.activecall &&
        this.connection.jingle.activecall.peerconnection) {
        return this.connection.jingle.activecall.getLocalSSRC(mediaType);
    } else {
        return null;
    }
};

module.exports = XMPP;

}).call(this,"/modules/xmpp/xmpp.js")
},{"../../JitsiConnectionErrors":5,"../../JitsiConnectionEvents":6,"../../service/RTC/RTCEvents":80,"../../service/xmpp/XMPPEvents":87,"../RTC/RTC":16,"./strophe.emuc":36,"./strophe.jingle":37,"./strophe.logger":38,"./strophe.ping":39,"./strophe.rayo":40,"./strophe.util":41,"events":44,"jitsi-meet-logger":48,"pako":49}],43:[function(require,module,exports){
(function (process){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
/*jshint onevar: false, indent:4 */
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = function (fn) {
              // not a direct alias for IE10 compatibility
              setImmediate(fn);
            };
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(done) );
        });
        function done(err) {
          if (err) {
              callback(err);
              callback = function () {};
          }
          else {
              completed += 1;
              if (completed >= arr.length) {
                  callback();
              }
          }
        }
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback();
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        if (!callback) {
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err) {
                    callback(err);
                });
            });
        } else {
            var results = [];
            eachfn(arr, function (x, callback) {
                iterator(x.value, function (err, v) {
                    results[x.index] = v;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        var remainingTasks = keys.length
        if (!remainingTasks) {
            return callback();
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            remainingTasks--
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (!remainingTasks) {
                var theCallback = callback;
                // prevent final callback from calling itself if it errors
                callback = function () {};

                theCallback(null, results);
            }
        });

        _each(keys, function (k) {
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var attempts = [];
        // Use defaults if times not passed
        if (typeof times === 'function') {
            callback = task;
            task = times;
            times = DEFAULT_TIMES;
        }
        // Make sure times is a number
        times = parseInt(times, 10) || DEFAULT_TIMES;
        var wrappedTask = function(wrappedCallback, wrappedResults) {
            var retryAttempt = function(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            };
            while (times) {
                attempts.push(retryAttempt(task, !(times-=1)));
            }
            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || callback)(data.err, data.result);
            });
        }
        // If a callback is passed, run this as a controll flow
        return callback ? wrappedTask() : wrappedTask
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (!_isArray(tasks)) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (_isArray(tasks)) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (test.apply(null, args)) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            var args = Array.prototype.slice.call(arguments, 1);
            if (!test.apply(null, args)) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            started: false,
            paused: false,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            kill: function () {
              q.drain = null;
              q.tasks = [];
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (!q.paused && workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                if (q.paused === true) { return; }
                q.paused = true;
                q.process();
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                q.process();
            }
        };
        return q;
    };
    
    async.priorityQueue = function (worker, concurrency) {
        
        function _compareTasks(a, b){
          return a.priority - b.priority;
        };
        
        function _binarySearch(sequence, item, compare) {
          var beg = -1,
              end = sequence.length - 1;
          while (beg < end) {
            var mid = beg + ((end - beg + 1) >>> 1);
            if (compare(item, sequence[mid]) >= 0) {
              beg = mid;
            } else {
              end = mid - 1;
            }
          }
          return beg;
        }
        
        function _insert(q, data, priority, callback) {
          if (!q.started){
            q.started = true;
          }
          if (!_isArray(data)) {
              data = [data];
          }
          if(data.length == 0) {
             // call drain immediately if there are no tasks
             return async.setImmediate(function() {
                 if (q.drain) {
                     q.drain();
                 }
             });
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  priority: priority,
                  callback: typeof callback === 'function' ? callback : null
              };
              
              q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

              if (q.saturated && q.tasks.length === q.concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }
        
        // Start with a normal queue
        var q = async.queue(worker, concurrency);
        
        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
          _insert(q, data, priority, callback);
        };
        
        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            drained: true,
            push: function (data, callback) {
                if (!_isArray(data)) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    cargo.drained = false;
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain && !cargo.drained) cargo.drain();
                    cargo.drained = true;
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0, tasks.length);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                async.nextTick(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    async.compose = function (/* functions... */) {
      return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'))
},{"_process":45}],44:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],45:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],46:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/jakearchibald/es6-promise/master/LICENSE
 * @version   3.0.2
 */

(function() {
    "use strict";
    function lib$es6$promise$utils$$objectOrFunction(x) {
      return typeof x === 'function' || (typeof x === 'object' && x !== null);
    }

    function lib$es6$promise$utils$$isFunction(x) {
      return typeof x === 'function';
    }

    function lib$es6$promise$utils$$isMaybeThenable(x) {
      return typeof x === 'object' && x !== null;
    }

    var lib$es6$promise$utils$$_isArray;
    if (!Array.isArray) {
      lib$es6$promise$utils$$_isArray = function (x) {
        return Object.prototype.toString.call(x) === '[object Array]';
      };
    } else {
      lib$es6$promise$utils$$_isArray = Array.isArray;
    }

    var lib$es6$promise$utils$$isArray = lib$es6$promise$utils$$_isArray;
    var lib$es6$promise$asap$$len = 0;
    var lib$es6$promise$asap$$toString = {}.toString;
    var lib$es6$promise$asap$$vertxNext;
    var lib$es6$promise$asap$$customSchedulerFn;

    var lib$es6$promise$asap$$asap = function asap(callback, arg) {
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len] = callback;
      lib$es6$promise$asap$$queue[lib$es6$promise$asap$$len + 1] = arg;
      lib$es6$promise$asap$$len += 2;
      if (lib$es6$promise$asap$$len === 2) {
        // If len is 2, that means that we need to schedule an async flush.
        // If additional callbacks are queued before the queue is flushed, they
        // will be processed by this flush that we are scheduling.
        if (lib$es6$promise$asap$$customSchedulerFn) {
          lib$es6$promise$asap$$customSchedulerFn(lib$es6$promise$asap$$flush);
        } else {
          lib$es6$promise$asap$$scheduleFlush();
        }
      }
    }

    function lib$es6$promise$asap$$setScheduler(scheduleFn) {
      lib$es6$promise$asap$$customSchedulerFn = scheduleFn;
    }

    function lib$es6$promise$asap$$setAsap(asapFn) {
      lib$es6$promise$asap$$asap = asapFn;
    }

    var lib$es6$promise$asap$$browserWindow = (typeof window !== 'undefined') ? window : undefined;
    var lib$es6$promise$asap$$browserGlobal = lib$es6$promise$asap$$browserWindow || {};
    var lib$es6$promise$asap$$BrowserMutationObserver = lib$es6$promise$asap$$browserGlobal.MutationObserver || lib$es6$promise$asap$$browserGlobal.WebKitMutationObserver;
    var lib$es6$promise$asap$$isNode = typeof process !== 'undefined' && {}.toString.call(process) === '[object process]';

    // test for web worker but not in IE10
    var lib$es6$promise$asap$$isWorker = typeof Uint8ClampedArray !== 'undefined' &&
      typeof importScripts !== 'undefined' &&
      typeof MessageChannel !== 'undefined';

    // node
    function lib$es6$promise$asap$$useNextTick() {
      // node version 0.10.x displays a deprecation warning when nextTick is used recursively
      // see https://github.com/cujojs/when/issues/410 for details
      return function() {
        process.nextTick(lib$es6$promise$asap$$flush);
      };
    }

    // vertx
    function lib$es6$promise$asap$$useVertxTimer() {
      return function() {
        lib$es6$promise$asap$$vertxNext(lib$es6$promise$asap$$flush);
      };
    }

    function lib$es6$promise$asap$$useMutationObserver() {
      var iterations = 0;
      var observer = new lib$es6$promise$asap$$BrowserMutationObserver(lib$es6$promise$asap$$flush);
      var node = document.createTextNode('');
      observer.observe(node, { characterData: true });

      return function() {
        node.data = (iterations = ++iterations % 2);
      };
    }

    // web worker
    function lib$es6$promise$asap$$useMessageChannel() {
      var channel = new MessageChannel();
      channel.port1.onmessage = lib$es6$promise$asap$$flush;
      return function () {
        channel.port2.postMessage(0);
      };
    }

    function lib$es6$promise$asap$$useSetTimeout() {
      return function() {
        setTimeout(lib$es6$promise$asap$$flush, 1);
      };
    }

    var lib$es6$promise$asap$$queue = new Array(1000);
    function lib$es6$promise$asap$$flush() {
      for (var i = 0; i < lib$es6$promise$asap$$len; i+=2) {
        var callback = lib$es6$promise$asap$$queue[i];
        var arg = lib$es6$promise$asap$$queue[i+1];

        callback(arg);

        lib$es6$promise$asap$$queue[i] = undefined;
        lib$es6$promise$asap$$queue[i+1] = undefined;
      }

      lib$es6$promise$asap$$len = 0;
    }

    function lib$es6$promise$asap$$attemptVertx() {
      try {
        var r = require;
        var vertx = r('vertx');
        lib$es6$promise$asap$$vertxNext = vertx.runOnLoop || vertx.runOnContext;
        return lib$es6$promise$asap$$useVertxTimer();
      } catch(e) {
        return lib$es6$promise$asap$$useSetTimeout();
      }
    }

    var lib$es6$promise$asap$$scheduleFlush;
    // Decide what async method to use to triggering processing of queued callbacks:
    if (lib$es6$promise$asap$$isNode) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useNextTick();
    } else if (lib$es6$promise$asap$$BrowserMutationObserver) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMutationObserver();
    } else if (lib$es6$promise$asap$$isWorker) {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useMessageChannel();
    } else if (lib$es6$promise$asap$$browserWindow === undefined && typeof require === 'function') {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$attemptVertx();
    } else {
      lib$es6$promise$asap$$scheduleFlush = lib$es6$promise$asap$$useSetTimeout();
    }

    function lib$es6$promise$$internal$$noop() {}

    var lib$es6$promise$$internal$$PENDING   = void 0;
    var lib$es6$promise$$internal$$FULFILLED = 1;
    var lib$es6$promise$$internal$$REJECTED  = 2;

    var lib$es6$promise$$internal$$GET_THEN_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$selfFulfillment() {
      return new TypeError("You cannot resolve a promise with itself");
    }

    function lib$es6$promise$$internal$$cannotReturnOwn() {
      return new TypeError('A promises callback cannot return that same promise.');
    }

    function lib$es6$promise$$internal$$getThen(promise) {
      try {
        return promise.then;
      } catch(error) {
        lib$es6$promise$$internal$$GET_THEN_ERROR.error = error;
        return lib$es6$promise$$internal$$GET_THEN_ERROR;
      }
    }

    function lib$es6$promise$$internal$$tryThen(then, value, fulfillmentHandler, rejectionHandler) {
      try {
        then.call(value, fulfillmentHandler, rejectionHandler);
      } catch(e) {
        return e;
      }
    }

    function lib$es6$promise$$internal$$handleForeignThenable(promise, thenable, then) {
       lib$es6$promise$asap$$asap(function(promise) {
        var sealed = false;
        var error = lib$es6$promise$$internal$$tryThen(then, thenable, function(value) {
          if (sealed) { return; }
          sealed = true;
          if (thenable !== value) {
            lib$es6$promise$$internal$$resolve(promise, value);
          } else {
            lib$es6$promise$$internal$$fulfill(promise, value);
          }
        }, function(reason) {
          if (sealed) { return; }
          sealed = true;

          lib$es6$promise$$internal$$reject(promise, reason);
        }, 'Settle: ' + (promise._label || ' unknown promise'));

        if (!sealed && error) {
          sealed = true;
          lib$es6$promise$$internal$$reject(promise, error);
        }
      }, promise);
    }

    function lib$es6$promise$$internal$$handleOwnThenable(promise, thenable) {
      if (thenable._state === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, thenable._result);
      } else if (thenable._state === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, thenable._result);
      } else {
        lib$es6$promise$$internal$$subscribe(thenable, undefined, function(value) {
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      }
    }

    function lib$es6$promise$$internal$$handleMaybeThenable(promise, maybeThenable) {
      if (maybeThenable.constructor === promise.constructor) {
        lib$es6$promise$$internal$$handleOwnThenable(promise, maybeThenable);
      } else {
        var then = lib$es6$promise$$internal$$getThen(maybeThenable);

        if (then === lib$es6$promise$$internal$$GET_THEN_ERROR) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$GET_THEN_ERROR.error);
        } else if (then === undefined) {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        } else if (lib$es6$promise$utils$$isFunction(then)) {
          lib$es6$promise$$internal$$handleForeignThenable(promise, maybeThenable, then);
        } else {
          lib$es6$promise$$internal$$fulfill(promise, maybeThenable);
        }
      }
    }

    function lib$es6$promise$$internal$$resolve(promise, value) {
      if (promise === value) {
        lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$selfFulfillment());
      } else if (lib$es6$promise$utils$$objectOrFunction(value)) {
        lib$es6$promise$$internal$$handleMaybeThenable(promise, value);
      } else {
        lib$es6$promise$$internal$$fulfill(promise, value);
      }
    }

    function lib$es6$promise$$internal$$publishRejection(promise) {
      if (promise._onerror) {
        promise._onerror(promise._result);
      }

      lib$es6$promise$$internal$$publish(promise);
    }

    function lib$es6$promise$$internal$$fulfill(promise, value) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }

      promise._result = value;
      promise._state = lib$es6$promise$$internal$$FULFILLED;

      if (promise._subscribers.length !== 0) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, promise);
      }
    }

    function lib$es6$promise$$internal$$reject(promise, reason) {
      if (promise._state !== lib$es6$promise$$internal$$PENDING) { return; }
      promise._state = lib$es6$promise$$internal$$REJECTED;
      promise._result = reason;

      lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publishRejection, promise);
    }

    function lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection) {
      var subscribers = parent._subscribers;
      var length = subscribers.length;

      parent._onerror = null;

      subscribers[length] = child;
      subscribers[length + lib$es6$promise$$internal$$FULFILLED] = onFulfillment;
      subscribers[length + lib$es6$promise$$internal$$REJECTED]  = onRejection;

      if (length === 0 && parent._state) {
        lib$es6$promise$asap$$asap(lib$es6$promise$$internal$$publish, parent);
      }
    }

    function lib$es6$promise$$internal$$publish(promise) {
      var subscribers = promise._subscribers;
      var settled = promise._state;

      if (subscribers.length === 0) { return; }

      var child, callback, detail = promise._result;

      for (var i = 0; i < subscribers.length; i += 3) {
        child = subscribers[i];
        callback = subscribers[i + settled];

        if (child) {
          lib$es6$promise$$internal$$invokeCallback(settled, child, callback, detail);
        } else {
          callback(detail);
        }
      }

      promise._subscribers.length = 0;
    }

    function lib$es6$promise$$internal$$ErrorObject() {
      this.error = null;
    }

    var lib$es6$promise$$internal$$TRY_CATCH_ERROR = new lib$es6$promise$$internal$$ErrorObject();

    function lib$es6$promise$$internal$$tryCatch(callback, detail) {
      try {
        return callback(detail);
      } catch(e) {
        lib$es6$promise$$internal$$TRY_CATCH_ERROR.error = e;
        return lib$es6$promise$$internal$$TRY_CATCH_ERROR;
      }
    }

    function lib$es6$promise$$internal$$invokeCallback(settled, promise, callback, detail) {
      var hasCallback = lib$es6$promise$utils$$isFunction(callback),
          value, error, succeeded, failed;

      if (hasCallback) {
        value = lib$es6$promise$$internal$$tryCatch(callback, detail);

        if (value === lib$es6$promise$$internal$$TRY_CATCH_ERROR) {
          failed = true;
          error = value.error;
          value = null;
        } else {
          succeeded = true;
        }

        if (promise === value) {
          lib$es6$promise$$internal$$reject(promise, lib$es6$promise$$internal$$cannotReturnOwn());
          return;
        }

      } else {
        value = detail;
        succeeded = true;
      }

      if (promise._state !== lib$es6$promise$$internal$$PENDING) {
        // noop
      } else if (hasCallback && succeeded) {
        lib$es6$promise$$internal$$resolve(promise, value);
      } else if (failed) {
        lib$es6$promise$$internal$$reject(promise, error);
      } else if (settled === lib$es6$promise$$internal$$FULFILLED) {
        lib$es6$promise$$internal$$fulfill(promise, value);
      } else if (settled === lib$es6$promise$$internal$$REJECTED) {
        lib$es6$promise$$internal$$reject(promise, value);
      }
    }

    function lib$es6$promise$$internal$$initializePromise(promise, resolver) {
      try {
        resolver(function resolvePromise(value){
          lib$es6$promise$$internal$$resolve(promise, value);
        }, function rejectPromise(reason) {
          lib$es6$promise$$internal$$reject(promise, reason);
        });
      } catch(e) {
        lib$es6$promise$$internal$$reject(promise, e);
      }
    }

    function lib$es6$promise$enumerator$$Enumerator(Constructor, input) {
      var enumerator = this;

      enumerator._instanceConstructor = Constructor;
      enumerator.promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (enumerator._validateInput(input)) {
        enumerator._input     = input;
        enumerator.length     = input.length;
        enumerator._remaining = input.length;

        enumerator._init();

        if (enumerator.length === 0) {
          lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
        } else {
          enumerator.length = enumerator.length || 0;
          enumerator._enumerate();
          if (enumerator._remaining === 0) {
            lib$es6$promise$$internal$$fulfill(enumerator.promise, enumerator._result);
          }
        }
      } else {
        lib$es6$promise$$internal$$reject(enumerator.promise, enumerator._validationError());
      }
    }

    lib$es6$promise$enumerator$$Enumerator.prototype._validateInput = function(input) {
      return lib$es6$promise$utils$$isArray(input);
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._validationError = function() {
      return new Error('Array Methods must be provided an Array');
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._init = function() {
      this._result = new Array(this.length);
    };

    var lib$es6$promise$enumerator$$default = lib$es6$promise$enumerator$$Enumerator;

    lib$es6$promise$enumerator$$Enumerator.prototype._enumerate = function() {
      var enumerator = this;

      var length  = enumerator.length;
      var promise = enumerator.promise;
      var input   = enumerator._input;

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        enumerator._eachEntry(input[i], i);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._eachEntry = function(entry, i) {
      var enumerator = this;
      var c = enumerator._instanceConstructor;

      if (lib$es6$promise$utils$$isMaybeThenable(entry)) {
        if (entry.constructor === c && entry._state !== lib$es6$promise$$internal$$PENDING) {
          entry._onerror = null;
          enumerator._settledAt(entry._state, i, entry._result);
        } else {
          enumerator._willSettleAt(c.resolve(entry), i);
        }
      } else {
        enumerator._remaining--;
        enumerator._result[i] = entry;
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._settledAt = function(state, i, value) {
      var enumerator = this;
      var promise = enumerator.promise;

      if (promise._state === lib$es6$promise$$internal$$PENDING) {
        enumerator._remaining--;

        if (state === lib$es6$promise$$internal$$REJECTED) {
          lib$es6$promise$$internal$$reject(promise, value);
        } else {
          enumerator._result[i] = value;
        }
      }

      if (enumerator._remaining === 0) {
        lib$es6$promise$$internal$$fulfill(promise, enumerator._result);
      }
    };

    lib$es6$promise$enumerator$$Enumerator.prototype._willSettleAt = function(promise, i) {
      var enumerator = this;

      lib$es6$promise$$internal$$subscribe(promise, undefined, function(value) {
        enumerator._settledAt(lib$es6$promise$$internal$$FULFILLED, i, value);
      }, function(reason) {
        enumerator._settledAt(lib$es6$promise$$internal$$REJECTED, i, reason);
      });
    };
    function lib$es6$promise$promise$all$$all(entries) {
      return new lib$es6$promise$enumerator$$default(this, entries).promise;
    }
    var lib$es6$promise$promise$all$$default = lib$es6$promise$promise$all$$all;
    function lib$es6$promise$promise$race$$race(entries) {
      /*jshint validthis:true */
      var Constructor = this;

      var promise = new Constructor(lib$es6$promise$$internal$$noop);

      if (!lib$es6$promise$utils$$isArray(entries)) {
        lib$es6$promise$$internal$$reject(promise, new TypeError('You must pass an array to race.'));
        return promise;
      }

      var length = entries.length;

      function onFulfillment(value) {
        lib$es6$promise$$internal$$resolve(promise, value);
      }

      function onRejection(reason) {
        lib$es6$promise$$internal$$reject(promise, reason);
      }

      for (var i = 0; promise._state === lib$es6$promise$$internal$$PENDING && i < length; i++) {
        lib$es6$promise$$internal$$subscribe(Constructor.resolve(entries[i]), undefined, onFulfillment, onRejection);
      }

      return promise;
    }
    var lib$es6$promise$promise$race$$default = lib$es6$promise$promise$race$$race;
    function lib$es6$promise$promise$resolve$$resolve(object) {
      /*jshint validthis:true */
      var Constructor = this;

      if (object && typeof object === 'object' && object.constructor === Constructor) {
        return object;
      }

      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$resolve(promise, object);
      return promise;
    }
    var lib$es6$promise$promise$resolve$$default = lib$es6$promise$promise$resolve$$resolve;
    function lib$es6$promise$promise$reject$$reject(reason) {
      /*jshint validthis:true */
      var Constructor = this;
      var promise = new Constructor(lib$es6$promise$$internal$$noop);
      lib$es6$promise$$internal$$reject(promise, reason);
      return promise;
    }
    var lib$es6$promise$promise$reject$$default = lib$es6$promise$promise$reject$$reject;

    var lib$es6$promise$promise$$counter = 0;

    function lib$es6$promise$promise$$needsResolver() {
      throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
    }

    function lib$es6$promise$promise$$needsNew() {
      throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
    }

    var lib$es6$promise$promise$$default = lib$es6$promise$promise$$Promise;
    /**
      Promise objects represent the eventual result of an asynchronous operation. The
      primary way of interacting with a promise is through its `then` method, which
      registers callbacks to receive either a promise's eventual value or the reason
      why the promise cannot be fulfilled.

      Terminology
      -----------

      - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
      - `thenable` is an object or function that defines a `then` method.
      - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
      - `exception` is a value that is thrown using the throw statement.
      - `reason` is a value that indicates why a promise was rejected.
      - `settled` the final resting state of a promise, fulfilled or rejected.

      A promise can be in one of three states: pending, fulfilled, or rejected.

      Promises that are fulfilled have a fulfillment value and are in the fulfilled
      state.  Promises that are rejected have a rejection reason and are in the
      rejected state.  A fulfillment value is never a thenable.

      Promises can also be said to *resolve* a value.  If this value is also a
      promise, then the original promise's settled state will match the value's
      settled state.  So a promise that *resolves* a promise that rejects will
      itself reject, and a promise that *resolves* a promise that fulfills will
      itself fulfill.


      Basic Usage:
      ------------

      ```js
      var promise = new Promise(function(resolve, reject) {
        // on success
        resolve(value);

        // on failure
        reject(reason);
      });

      promise.then(function(value) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Advanced Usage:
      ---------------

      Promises shine when abstracting away asynchronous interactions such as
      `XMLHttpRequest`s.

      ```js
      function getJSON(url) {
        return new Promise(function(resolve, reject){
          var xhr = new XMLHttpRequest();

          xhr.open('GET', url);
          xhr.onreadystatechange = handler;
          xhr.responseType = 'json';
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.send();

          function handler() {
            if (this.readyState === this.DONE) {
              if (this.status === 200) {
                resolve(this.response);
              } else {
                reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
              }
            }
          };
        });
      }

      getJSON('/posts.json').then(function(json) {
        // on fulfillment
      }, function(reason) {
        // on rejection
      });
      ```

      Unlike callbacks, promises are great composable primitives.

      ```js
      Promise.all([
        getJSON('/posts'),
        getJSON('/comments')
      ]).then(function(values){
        values[0] // => postsJSON
        values[1] // => commentsJSON

        return values;
      });
      ```

      @class Promise
      @param {function} resolver
      Useful for tooling.
      @constructor
    */
    function lib$es6$promise$promise$$Promise(resolver) {
      this._id = lib$es6$promise$promise$$counter++;
      this._state = undefined;
      this._result = undefined;
      this._subscribers = [];

      if (lib$es6$promise$$internal$$noop !== resolver) {
        if (!lib$es6$promise$utils$$isFunction(resolver)) {
          lib$es6$promise$promise$$needsResolver();
        }

        if (!(this instanceof lib$es6$promise$promise$$Promise)) {
          lib$es6$promise$promise$$needsNew();
        }

        lib$es6$promise$$internal$$initializePromise(this, resolver);
      }
    }

    lib$es6$promise$promise$$Promise.all = lib$es6$promise$promise$all$$default;
    lib$es6$promise$promise$$Promise.race = lib$es6$promise$promise$race$$default;
    lib$es6$promise$promise$$Promise.resolve = lib$es6$promise$promise$resolve$$default;
    lib$es6$promise$promise$$Promise.reject = lib$es6$promise$promise$reject$$default;
    lib$es6$promise$promise$$Promise._setScheduler = lib$es6$promise$asap$$setScheduler;
    lib$es6$promise$promise$$Promise._setAsap = lib$es6$promise$asap$$setAsap;
    lib$es6$promise$promise$$Promise._asap = lib$es6$promise$asap$$asap;

    lib$es6$promise$promise$$Promise.prototype = {
      constructor: lib$es6$promise$promise$$Promise,

    /**
      The primary way of interacting with a promise is through its `then` method,
      which registers callbacks to receive either a promise's eventual value or the
      reason why the promise cannot be fulfilled.

      ```js
      findUser().then(function(user){
        // user is available
      }, function(reason){
        // user is unavailable, and you are given the reason why
      });
      ```

      Chaining
      --------

      The return value of `then` is itself a promise.  This second, 'downstream'
      promise is resolved with the return value of the first promise's fulfillment
      or rejection handler, or rejected if the handler throws an exception.

      ```js
      findUser().then(function (user) {
        return user.name;
      }, function (reason) {
        return 'default name';
      }).then(function (userName) {
        // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
        // will be `'default name'`
      });

      findUser().then(function (user) {
        throw new Error('Found user, but still unhappy');
      }, function (reason) {
        throw new Error('`findUser` rejected and we're unhappy');
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
        // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
      });
      ```
      If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.

      ```js
      findUser().then(function (user) {
        throw new PedagogicalException('Upstream error');
      }).then(function (value) {
        // never reached
      }).then(function (value) {
        // never reached
      }, function (reason) {
        // The `PedgagocialException` is propagated all the way down to here
      });
      ```

      Assimilation
      ------------

      Sometimes the value you want to propagate to a downstream promise can only be
      retrieved asynchronously. This can be achieved by returning a promise in the
      fulfillment or rejection handler. The downstream promise will then be pending
      until the returned promise is settled. This is called *assimilation*.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // The user's comments are now available
      });
      ```

      If the assimliated promise rejects, then the downstream promise will also reject.

      ```js
      findUser().then(function (user) {
        return findCommentsByAuthor(user);
      }).then(function (comments) {
        // If `findCommentsByAuthor` fulfills, we'll have the value here
      }, function (reason) {
        // If `findCommentsByAuthor` rejects, we'll have the reason here
      });
      ```

      Simple Example
      --------------

      Synchronous Example

      ```javascript
      var result;

      try {
        result = findResult();
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js
      findResult(function(result, err){
        if (err) {
          // failure
        } else {
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findResult().then(function(result){
        // success
      }, function(reason){
        // failure
      });
      ```

      Advanced Example
      --------------

      Synchronous Example

      ```javascript
      var author, books;

      try {
        author = findAuthor();
        books  = findBooksByAuthor(author);
        // success
      } catch(reason) {
        // failure
      }
      ```

      Errback Example

      ```js

      function foundBooks(books) {

      }

      function failure(reason) {

      }

      findAuthor(function(author, err){
        if (err) {
          failure(err);
          // failure
        } else {
          try {
            findBoooksByAuthor(author, function(books, err) {
              if (err) {
                failure(err);
              } else {
                try {
                  foundBooks(books);
                } catch(reason) {
                  failure(reason);
                }
              }
            });
          } catch(error) {
            failure(err);
          }
          // success
        }
      });
      ```

      Promise Example;

      ```javascript
      findAuthor().
        then(findBooksByAuthor).
        then(function(books){
          // found books
      }).catch(function(reason){
        // something went wrong
      });
      ```

      @method then
      @param {Function} onFulfilled
      @param {Function} onRejected
      Useful for tooling.
      @return {Promise}
    */
      then: function(onFulfillment, onRejection) {
        var parent = this;
        var state = parent._state;

        if (state === lib$es6$promise$$internal$$FULFILLED && !onFulfillment || state === lib$es6$promise$$internal$$REJECTED && !onRejection) {
          return this;
        }

        var child = new this.constructor(lib$es6$promise$$internal$$noop);
        var result = parent._result;

        if (state) {
          var callback = arguments[state - 1];
          lib$es6$promise$asap$$asap(function(){
            lib$es6$promise$$internal$$invokeCallback(state, child, callback, result);
          });
        } else {
          lib$es6$promise$$internal$$subscribe(parent, child, onFulfillment, onRejection);
        }

        return child;
      },

    /**
      `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
      as the catch block of a try/catch statement.

      ```js
      function findAuthor(){
        throw new Error('couldn't find that author');
      }

      // synchronous
      try {
        findAuthor();
      } catch(reason) {
        // something went wrong
      }

      // async with promises
      findAuthor().catch(function(reason){
        // something went wrong
      });
      ```

      @method catch
      @param {Function} onRejection
      Useful for tooling.
      @return {Promise}
    */
      'catch': function(onRejection) {
        return this.then(null, onRejection);
      }
    };
    function lib$es6$promise$polyfill$$polyfill() {
      var local;

      if (typeof global !== 'undefined') {
          local = global;
      } else if (typeof self !== 'undefined') {
          local = self;
      } else {
          try {
              local = Function('return this')();
          } catch (e) {
              throw new Error('polyfill failed because global object is unavailable in this environment');
          }
      }

      var P = local.Promise;

      if (P && Object.prototype.toString.call(P.resolve()) === '[object Promise]' && !P.cast) {
        return;
      }

      local.Promise = lib$es6$promise$promise$$default;
    }
    var lib$es6$promise$polyfill$$default = lib$es6$promise$polyfill$$polyfill;

    var lib$es6$promise$umd$$ES6Promise = {
      'Promise': lib$es6$promise$promise$$default,
      'polyfill': lib$es6$promise$polyfill$$default
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return lib$es6$promise$umd$$ES6Promise; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = lib$es6$promise$umd$$ES6Promise;
    } else if (typeof this !== 'undefined') {
      this['ES6Promise'] = lib$es6$promise$umd$$ES6Promise;
    }

    lib$es6$promise$polyfill$$default();
}).call(this);


}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":45}],47:[function(require,module,exports){
/* Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Ordered log levels.
 */
var levels = {
    "trace": 0,
    "debug": 1,
    "info": 2,
    "log": 3,
    "warn": 4,
    "error": 5
};

/**
 * Parses Error's object stack trace and extracts information about the last
 * caller before the log method was called.
 * @returns JS object with info about the caller - method name, file location,
 * line and column.
 */
function getCallerInfo() {
    var callerInfo = {
        methodName: "",
        fileLocation: "",
        line: null,
        column: null
    };
    //gets the part of the stack without the logger wrappers
    var error = new Error();
    var stack = error.stack? error.stack.split("\n") : [];
    if(!stack || stack.length < 1) {
        return callerInfo;
    }
    var m = null;
    if(stack[3]) {
        m = stack[3].match(/\s*at\s*(.+?)\s*\((\S*)\s*:(\d*)\s*:(\d*)\)/);
    }
    if(!m || m.length <= 4) {
        //Firefox && Safari
        if(stack[2].indexOf("log@") === 0){
            //Safari
            callerInfo.methodName = stack[3].substr(0, stack[3].indexOf("@"));
        } else {
            //Firefox
            callerInfo.methodName = stack[2].substr(0, stack[2].indexOf("@"));
        }
        return callerInfo;
    }

    callerInfo.methodName = m[1];
    callerInfo.fileLocation = m[2];
    callerInfo.line = m[3];
    callerInfo.column = m[4];
    return callerInfo;
}

/**
 * Logs messages using the transports and level from the logger.
 * @param logger a logger instance.
 * @param level the log level of the message. See the levels variable.
 * @param arguments array with arguments that will be logged.
 */
function log() {
    var logger = arguments[0], level = arguments[1],
        args = Array.prototype.slice.call(arguments, 2);
    if(levels[level] <= logger.level) {
        return;
    }

    var callerInfo = getCallerInfo();
    for(var i = 0; i < logger.transports.length; i++) {
        var t = logger.transports[i];
        var l = t[level];
        if(l && typeof(l) === "function") {
            l.bind(t, logger.id? "[" + logger.id + "]" : "", "<" + callerInfo.methodName + ">: ")
                .apply(t, args);
        }
    }
}

/**
 *
 * Constructs new logger object.
 * @param level the logging level for the new logger
 * @param id optional identifier for the logger instance.
 * @param transports optional list of handlers(objects) for the logs.
 * The handlers must support - log, warn, error, debug, info, trace.
 * @param format optional (NOT implemented) string.
 */
function Logger(level, id, transports, format) {
    this.id = id;
    this.format = format;
    if(!this.transports) {
        this.transports = [];
        this.transports.push(Logger.consoleTransport);
    }
    this.level = levels[level];
    var methods = Object.keys(levels);
    for(var i = 0; i < methods.length; i++){
        this[methods[i]] =
            log.bind(null, this, methods[i]);
    }
}

/**
 * Sets the log level for the logger.
 * @param level the new log level.
 */
Logger.prototype.setLevel = function (level) {
    this.level = levels[level];
};
module.exports = Logger;

/**
 * The default transport - console
 */
Logger.consoleTransport = console;

/**
 * Enum for the supported log levels.
 */
Logger.levels = {
    TRACE: "trace",
    DEBUG: "debug",
    INFO: "info",
    LOG: "log",
    WARN: "warn",
    ERROR: "error"
};

},{}],48:[function(require,module,exports){
/* Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var Logger = require("./Logger");

/**
 * Map with the created loggers with ID.
 */
var idLoggers = {};

/**
 * Array with the loggers without id.
 */
var loggers = [];

/**
 * Log level for the lbrary.
 */
var curLevel = Logger.levels.TRACE;


module.exports = {
    /**
     * Creates new logger.
     * @arguments the same as Logger constructor
     */
    getLogger: function(id, transports, format) {
        var logger = new Logger(curLevel, id, transports, format);
        if(id) {
            idLoggers[id] = idLoggers[id] || [];
            idLoggers[id].push(logger);
        } else {
            loggers.push(logger);
        }
        return logger;
    },
    /**
     * Changes the log level for the existing loggers by id.
     * @param level the new log level.
     * @param id if specified the level will be changed only for loggers with the
     * same id. Otherwise the operation will affect all loggers that don't
     * have id.
     */
    setLogLevelById: function(level, id) {
        var l = id? (idLoggers[id] || []) : loggers;
        for(var i = 0; i < l.length; i++) {
            l[i].setLevel(level);
        }
    },
    /**
     * Changes the log level for all existing loggers.
     * @param level the new log level.
     */
    setLogLevel: function (level) {
        curLevel = level;
        var i = 0;
        for(; i < loggers.length; i++) {
            loggers[i].setLevel(level);
        }

        for(var id in idLoggers) {
            var l = idLoggers[id] || [];
            for(i = 0; i < l.length; i++) {
                l[i].setLevel(level);
            }
        }
    },
    /**
     * The supported log levels.
     */
    levels: Logger.levels
};

},{"./Logger":47}],49:[function(require,module,exports){
// Top level file is just a mixin of submodules & constants
'use strict';

var assign    = require('./lib/utils/common').assign;

var deflate   = require('./lib/deflate');
var inflate   = require('./lib/inflate');
var constants = require('./lib/zlib/constants');

var pako = {};

assign(pako, deflate, inflate, constants);

module.exports = pako;

},{"./lib/deflate":50,"./lib/inflate":51,"./lib/utils/common":52,"./lib/zlib/constants":55}],50:[function(require,module,exports){
'use strict';


var zlib_deflate = require('./zlib/deflate.js');
var utils = require('./utils/common');
var strings = require('./utils/strings');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');

var toString = Object.prototype.toString;

/* Public constants ==========================================================*/
/* ===========================================================================*/

var Z_NO_FLUSH      = 0;
var Z_FINISH        = 4;

var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_SYNC_FLUSH    = 2;

var Z_DEFAULT_COMPRESSION = -1;

var Z_DEFAULT_STRATEGY    = 0;

var Z_DEFLATED  = 8;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overriden.
 **/

/**
 * Deflate.result -> Uint8Array|Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param)  or if you
 * push a chunk with explicit flush (call [[Deflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
var Deflate = function(options) {

  this.options = utils.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY,
    to: ''
  }, options || {});

  var opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
    opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
    opt.windowBits += 16;
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm = new zstream();
  this.strm.avail_out = 0;

  var status = zlib_deflate.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );

  if (status !== Z_OK) {
    throw new Error(msg[status]);
  }

  if (opt.header) {
    zlib_deflate.deflateSetHeader(this.strm, opt.header);
  }
};

/**
 * Deflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data. Strings will be
 *   converted to utf8 byte sequence.
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Deflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the compression context.
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * array format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;

  if (this.ended) { return false; }

  _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // If we need to compress text, change encoding to utf8.
    strm.input = strings.string2buf(data);
  } else if (toString.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

    if (status !== Z_STREAM_END && status !== Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }
    if (strm.avail_out === 0 || (strm.avail_in === 0 && (_mode === Z_FINISH || _mode === Z_SYNC_FLUSH))) {
      if (this.options.to === 'string') {
        this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
      } else {
        this.onData(utils.shrinkBuf(strm.output, strm.next_out));
      }
    }
  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

  // Finalize on the last chunk.
  if (_mode === Z_FINISH) {
    status = zlib_deflate.deflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === Z_OK;
  }

  // callback interim results if Z_SYNC_FLUSH.
  if (_mode === Z_SYNC_FLUSH) {
    this.onEnd(Z_OK);
    strm.avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === Z_OK) {
    if (this.options.to === 'string') {
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate alrorythm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate(input, options) {
  var deflator = new Deflate(options);

  deflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (deflator.err) { throw deflator.msg; }

  return deflator.result;
}


/**
 * deflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


/**
 * gzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but create gzip wrapper instead of
 * deflate one.
 **/
function gzip(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate(input, options);
}


exports.Deflate = Deflate;
exports.deflate = deflate;
exports.deflateRaw = deflateRaw;
exports.gzip = gzip;

},{"./utils/common":52,"./utils/strings":53,"./zlib/deflate.js":57,"./zlib/messages":62,"./zlib/zstream":64}],51:[function(require,module,exports){
'use strict';


var zlib_inflate = require('./zlib/inflate.js');
var utils = require('./utils/common');
var strings = require('./utils/strings');
var c = require('./zlib/constants');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');
var gzheader = require('./zlib/gzheader');

var toString = Object.prototype.toString;

/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overriden.
 **/

/**
 * Inflate.result -> Uint8Array|Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `Z_FINISH` / `true` param) or if you
 * push a chunk with explicit flush (call [[Inflate#push]] with
 * `Z_SYNC_FLUSH` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `windowBits`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * console.log(inflate.result);
 * ```
 **/
var Inflate = function(options) {

  this.options = utils.assign({
    chunkSize: 16384,
    windowBits: 0,
    to: ''
  }, options || {});

  var opt = this.options;

  // Force window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) { opt.windowBits = -15; }
  }

  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
      !(options && options.windowBits)) {
    opt.windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if window size not set, force it to max when gzip possible
  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
    // bit 3 (16) -> gzipped data
    // bit 4 (32) -> autodetect gzip/deflate
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm   = new zstream();
  this.strm.avail_out = 0;

  var status  = zlib_inflate.inflateInit2(
    this.strm,
    opt.windowBits
  );

  if (status !== c.Z_OK) {
    throw new Error(msg[status]);
  }

  this.header = new gzheader();

  zlib_inflate.inflateGetHeader(this.strm, this.header);
};

/**
 * Inflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|ArrayBuffer|String): input data
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That will flush internal pending buffers and call
 * [[Inflate#onEnd]]. For interim explicit flushes (without ending the stream) you
 * can use mode Z_SYNC_FLUSH, keeping the decompression context.
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;
  var next_out_utf8, tail, utf8str;

  // Flag to properly process Z_BUF_ERROR on testing inflate call
  // when we check that all output data was flushed.
  var allowBufError = false;

  if (this.ended) { return false; }
  _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // Only binary strings can be decompressed on practice
    strm.input = strings.binstring2buf(data);
  } else if (toString.call(data) === '[object ArrayBuffer]') {
    strm.input = new Uint8Array(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }

    status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

    if (status === c.Z_BUF_ERROR && allowBufError === true) {
      status = c.Z_OK;
      allowBufError = false;
    }

    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }

    if (strm.next_out) {
      if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && (_mode === c.Z_FINISH || _mode === c.Z_SYNC_FLUSH))) {

        if (this.options.to === 'string') {

          next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

          tail = strm.next_out - next_out_utf8;
          utf8str = strings.buf2string(strm.output, next_out_utf8);

          // move tail
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

          this.onData(utf8str);

        } else {
          this.onData(utils.shrinkBuf(strm.output, strm.next_out));
        }
      }
    }

    // When no more input data, we should check that internal inflate buffers
    // are flushed. The only way to do it when avail_out = 0 - run one more
    // inflate pass. But if output data not exists, inflate return Z_BUF_ERROR.
    // Here we set flag to process this error properly.
    //
    // NOTE. Deflate does not return error in this case and does not needs such
    // logic.
    if (strm.avail_in === 0 && strm.avail_out === 0) {
      allowBufError = true;
    }

  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== c.Z_STREAM_END);

  if (status === c.Z_STREAM_END) {
    _mode = c.Z_FINISH;
  }

  // Finalize on the last chunk.
  if (_mode === c.Z_FINISH) {
    status = zlib_inflate.inflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === c.Z_OK;
  }

  // callback interim results if Z_SYNC_FLUSH.
  if (_mode === c.Z_SYNC_FLUSH) {
    this.onEnd(c.Z_OK);
    strm.avail_out = 0;
    return true;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called either after you tell inflate that the input stream is
 * complete (Z_FINISH) or should be flushed (Z_SYNC_FLUSH)
 * or if an error happened. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === c.Z_OK) {
    if (this.options.to === 'string') {
      // Glue & convert here, until we teach pako to send
      // utf8 alligned strings to onData
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
 *   , output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err)
 *   console.log(err);
 * }
 * ```
 **/
function inflate(input, options) {
  var inflator = new Inflate(options);

  inflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) { throw inflator.msg; }

  return inflator.result;
}


/**
 * inflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * The same as [[inflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function inflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return inflate(input, options);
}


/**
 * ungzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Just shortcut to [[inflate]], because it autodetects format
 * by header.content. Done for convenience.
 **/


exports.Inflate = Inflate;
exports.inflate = inflate;
exports.inflateRaw = inflateRaw;
exports.ungzip  = inflate;

},{"./utils/common":52,"./utils/strings":53,"./zlib/constants":55,"./zlib/gzheader":58,"./zlib/inflate.js":60,"./zlib/messages":62,"./zlib/zstream":64}],52:[function(require,module,exports){
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof source !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for (var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for (var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);

},{}],53:[function(require,module,exports){
// String encode/decode helpers
'use strict';


var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
var STR_APPLY_OK = true;
var STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }
try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch(__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new utils.Buf8(256);
for (var q=0; q<256; q++) {
  _utf8len[q] = (q >= 252 ? 6 : q >= 248 ? 5 : q >= 240 ? 4 : q >= 224 ? 3 : q >= 192 ? 2 : 1);
}
_utf8len[254]=_utf8len[254]=1; // Invalid sequence start


// convert string to array (typed, when possible)
exports.string2buf = function (str) {
  var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
      c2 = str.charCodeAt(m_pos+1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new utils.Buf8(buf_len);

  // convert
  for (i=0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
      c2 = str.charCodeAt(m_pos+1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xC0 | (c >>> 6);
      buf[i++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xE0 | (c >>> 12);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | (c >>> 18);
      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    }
  }

  return buf;
};

// Helper (used in 2 places)
function buf2binstring(buf, len) {
  // use fallback for big arrays to avoid stack overflow
  if (len < 65537) {
    if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
      return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
    }
  }

  var result = '';
  for (var i=0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
}


// Convert byte array to binary string
exports.buf2binstring = function(buf) {
  return buf2binstring(buf, buf.length);
};


// Convert binary string (typed, when possible)
exports.binstring2buf = function(str) {
  var buf = new utils.Buf8(str.length);
  for (var i=0, len=buf.length; i < len; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
};


// convert array to string
exports.buf2string = function (buf, max) {
  var i, out, c, c_len;
  var len = max || buf.length;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  var utf16buf = new Array(len*2);

  for (out=0, i=0; i<len;) {
    c = buf[i++];
    // quick process ascii
    if (c < 0x80) { utf16buf[out++] = c; continue; }

    c_len = _utf8len[c];
    // skip 5 & 6 byte codes
    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

    // apply mask on first byte
    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    // join the rest
    while (c_len > 1 && i < len) {
      c = (c << 6) | (buf[i++] & 0x3f);
      c_len--;
    }

    // terminated by end of string?
    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    }
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
exports.utf8border = function(buf, max) {
  var pos;

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  pos = max-1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Fuckup - very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means vuffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

},{"./common":52}],54:[function(require,module,exports){
'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0,
      s2 = ((adler >>> 16) & 0xffff) |0,
      n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


module.exports = adler32;

},{}],55:[function(require,module,exports){
module.exports = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};

},{}],56:[function(require,module,exports){
'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for (var n =0; n < 256; n++) {
    c = n;
    for (var k =0; k < 8; k++) {
      c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable,
      end = pos + len;

  crc = crc ^ (-1);

  for (var i = pos; i < end; i++) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


module.exports = crc32;

},{}],57:[function(require,module,exports){
'use strict';

var utils   = require('../utils/common');
var trees   = require('./trees');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var msg   = require('./messages');

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}


function flush_block_only (s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  utils.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;

      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */

      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = (m >= _w_size ? m - _w_size : 0);
      } while (--n);

      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);

      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH-1]) & s.hash_mask;

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
    /* Fill the window as much as possible: */
    if (s.lookahead <= 1) {

      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }

      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

    s.strstart += s.lookahead;
    s.lookahead = 0;

    /* Emit a stored block if pending_buf will be full: */
    var max_start = s.block_start + max_block_size;

    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/


    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */
    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }

  s.insert = 0;

  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH-1)) ? s.strstart : MIN_MATCH-1);
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH-1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size-MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH-1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = trees._tr_tally(s, s.strstart - 1- s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length-1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH-1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH-1 ? s.strstart : MIN_MATCH-1;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
var Config = function (good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
};

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new utils.Buf16((2*D_CODES+1) * 2);
  this.bl_tree    = new utils.Buf16((2*BL_CODES+1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new utils.Buf16(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new utils.Buf16(2*L_CODES+1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new utils.Buf16(2*L_CODES+1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
    lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new utils.Buf8(s.w_size * 2);
  s.head = new utils.Buf16(s.hash_size);
  s.prev = new utils.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new utils.Buf8(s.pending_buf_size);

  s.d_buf = s.lit_bufsize >> 1;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
}


function deflate(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
    flush > Z_BLOCK || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
      (!strm.input && strm.avail_in !== 0) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

    if (s.wrap === 2) { // GZIP header
      strm.adler = 0;  //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) { // s->gzhead == Z_NULL
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      }
      else {
        put_byte(s, (s.gzhead.text ? 1 : 0) +
                    (s.gzhead.hcrc ? 2 : 0) +
                    (!s.gzhead.extra ? 0 : 4) +
                    (!s.gzhead.name ? 0 : 8) +
                    (!s.gzhead.comment ? 0 : 16)
                );
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    else // DEFLATE header
    {
      var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
      var level_flags = -1;

      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= (level_flags << 6);
      if (s.strstart !== 0) { header |= PRESET_DICT; }
      header += 31 - (header % 31);

      s.status = BUSY_STATE;
      putShortMSB(s, header);

      /* Save the adler32 of the preset dictionary: */
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */

      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    }
    else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    }
    else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    }
    else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    }
    else {
      s.status = BUSY_STATE;
    }
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH) {
    return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
      (s.strategy === Z_RLE ? deflate_rle(s, flush) :
        configuration_table[s.level].func(s, flush));

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      }
      else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

        trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH) { return Z_OK; }
  if (s.wrap <= 0) { return Z_STREAM_END; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK : Z_STREAM_END;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
    status !== EXTRA_STATE &&
    status !== NAME_STATE &&
    status !== COMMENT_STATE &&
    status !== HCRC_STATE &&
    status !== BUSY_STATE &&
    status !== FINISH_STATE
  ) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
}

/* =========================================================================
 * Copy the source state to the destination state
 */
//function deflateCopy(dest, source) {
//
//}

exports.deflateInit = deflateInit;
exports.deflateInit2 = deflateInit2;
exports.deflateReset = deflateReset;
exports.deflateResetKeep = deflateResetKeep;
exports.deflateSetHeader = deflateSetHeader;
exports.deflate = deflate;
exports.deflateEnd = deflateEnd;
exports.deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateSetDictionary = deflateSetDictionary;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/

},{"../utils/common":52,"./adler32":54,"./crc32":56,"./messages":62,"./trees":63}],58:[function(require,module,exports){
'use strict';


function GZheader() {
  /* true if compressed data believed to be text */
  this.text       = 0;
  /* modification time */
  this.time       = 0;
  /* extra flags (not used when writing a gzip file) */
  this.xflags     = 0;
  /* operating system */
  this.os         = 0;
  /* pointer to extra field or Z_NULL if none */
  this.extra      = null;
  /* extra field length (valid if extra != Z_NULL) */
  this.extra_len  = 0; // Actually, we don't need it in JS,
                       // but leave for few code modifications

  //
  // Setup limits is not necessary because in js we should not preallocate memory
  // for inflate use constant limit in 65536 bytes
  //

  /* space at extra (only when reading header) */
  // this.extra_max  = 0;
  /* pointer to zero-terminated file name or Z_NULL */
  this.name       = '';
  /* space at name (only when reading header) */
  // this.name_max   = 0;
  /* pointer to zero-terminated comment or Z_NULL */
  this.comment    = '';
  /* space at comment (only when reading header) */
  // this.comm_max   = 0;
  /* true if there was or will be a header crc */
  this.hcrc       = 0;
  /* true when done reading gzip header (not used when writing a gzip file) */
  this.done       = false;
}

module.exports = GZheader;

},{}],59:[function(require,module,exports){
'use strict';

// See state defs from inflate.js
var BAD = 30;       /* got a data error -- remain here until reset */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
module.exports = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  // Use `s_window` instead `window`, avoid conflict with instrumentation tools
  var s_window;               /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  s_window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break top;
                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = s_window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = s_window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = s_window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

},{}],60:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var inflate_fast = require('./inffast');
var inflate_table = require('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function ZSWAP32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
  this.work = new utils.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix, distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    var sym;

    lenfix = new utils.Buf32(512);
    distfix = new utils.Buf32(32);

    /* literal/length table */
    sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, {bits: 9});

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, {bits: 5});

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new utils.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    utils.arraySet(state.window,src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      utils.arraySet(state.window,src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


  if (!strm || !strm.state || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = false;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head) {
            len = state.head.extra_len - state.length;
            if (!state.head.extra) {
              // Use untyped array for more conveniend processing later
              state.head.extra = new Array(state.head.extra_len);
            }
            utils.arraySet(
              state.head.extra,
              input,
              next,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              copy,
              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
              len
            );
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
          }
          if (state.flags & 0x0200) {
            state.check = crc32(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.name_max*/)) {
            state.head.name += String.fromCharCode(len);
          }
        } while (len && copy < have);

        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.comm_max*/)) {
            state.head.comment += String.fromCharCode(len);
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = true;
      }
      strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = ZSWAP32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        utils.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      // We have separate tables & no pointers. 2 commented lines below not needed.
      //state.next = state.codes;
      //state.lencode = state.next;
      // Switch to use dynamic table
      state.lencode = state.lendyn;
      state.lenbits = 7;

      opts = {bits: state.lenbits};
      ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here_bits;
          bits -= here_bits;
          //---//
          state.lens[state.have++] = here_val;
        }
        else {
          if (here_val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here_bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here_val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here_bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here_bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lenbits = 9;

      opts = {bits: state.lenbits};
      ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.lenbits = opts.bits;
      // state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      //state.distcode.copy(state.codes);
      // Switch to use dynamic table
      state.distcode = state.distdyn;
      opts = {bits: state.distbits};
      ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.distbits = opts.bits;
      // state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inflate_fast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        here = state.lencode[hold & ((1 << state.lenbits) -1)];  /*BITS(state.lenbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if (here_bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here_op && (here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.lencode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      state.length = here_val;
      if (here_op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here_op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here_op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here_op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        here = state.distcode[hold & ((1 << state.distbits) -1)];/*BITS(state.distbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if ((here_bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.distcode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      if (here_op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here_val;
      state.extra = (here_op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          // Use '|' insdead of '+' to make sure that result is signed
          hold |= input[next++] << bits;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

        }
        _out = left;
        // NB: crc32 stored as signed 32-bit int, ZSWAP32 returns signed too
        if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
    ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
    return Z_STREAM_ERROR;
  }

  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK;
}


exports.inflateReset = inflateReset;
exports.inflateReset2 = inflateReset2;
exports.inflateResetKeep = inflateResetKeep;
exports.inflateInit = inflateInit;
exports.inflateInit2 = inflateInit2;
exports.inflate = inflate;
exports.inflateEnd = inflateEnd;
exports.inflateGetHeader = inflateGetHeader;
exports.inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSetDictionary = inflateSetDictionary;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/

},{"../utils/common":52,"./adler32":54,"./crc32":56,"./inffast":59,"./inftrees":61}],61:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

var MAXBITS = 15;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES = 0;
var LENS = 1;
var DISTS = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES) {
    base = extra = work;    /* dummy value--not used */
    end = 19;

  } else if (type === LENS) {
    base = lbase;
    base_index -= 257;
    extra = lext;
    extra_index -= 257;
    end = 256;

  } else {                    /* DISTS */
    base = dbase;
    extra = dext;
    end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS && used > ENOUGH_LENS) ||
    (type === DISTS && used > ENOUGH_DISTS)) {
    return 1;
  }

  var i=0;
  /* process all codes and make table entries */
  for (;;) {
    i++;
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base[base_index + work[sym]];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS && used > ENOUGH_LENS) ||
        (type === DISTS && used > ENOUGH_DISTS)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

},{"../utils/common":52}],62:[function(require,module,exports){
'use strict';

module.exports = {
  '2':    'need dictionary',     /* Z_NEED_DICT       2  */
  '1':    'stream end',          /* Z_STREAM_END      1  */
  '0':    '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};

},{}],63:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;

/*============================================================================*/


function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH    = 3;
var MAX_MATCH    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS      = 256;
/* number of literal bytes 0..255 */

var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES       = 30;
/* number of distance codes */

var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */

var MAX_BITS      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES+2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH-MIN_MATCH+1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


var StaticTreeDesc = function (static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
};


var static_l_desc;
var static_d_desc;
var static_bl_desc;


var TreeDesc = function(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
};



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c*2]/*.Code*/, tree[c*2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max]*2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max+1; h < HEAP_SIZE; h++) {
    n = s.heap[h];
    bits = tree[tree[n*2 +1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n*2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n-base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n*2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length-1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits+1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m*2 + 1]/*.Len*/ !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m*2 + 1]/*.Len*/)*tree[m*2]/*.Freq*/;
        tree[m*2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS+1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS; bits++) {
    next_code[bits] = code = (code + bl_count[bits-1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    var len = tree[n*2 + 1]/*.Len*/;
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n*2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES-1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1<<extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length-1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0 ; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1<<extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for (; code < D_CODES; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1<<(extra_dbits[code]-7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n*2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n*2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES+1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES; n++) {
    static_dtree[n*2 + 1]/*.Len*/ = 5;
    static_dtree[n*2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS+1, L_CODES, MAX_BITS);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
  static_bl_desc =new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES; n++) { s.bl_tree[n*2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK*2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n*2;
  var _m2 = m*2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j+1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
    do {
      dist = (s.pending_buf[s.d_buf + lx*2] << 8) | (s.pending_buf[s.d_buf + lx*2 + 1]);
      lc = s.pending_buf[s.l_buf + lx];
      lx++;

      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code+LITERALS+1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");

    } while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n*2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node*2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n*2 + 1]/*.Dad*/ = tree[m*2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code+1)*2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6*2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10*2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138*2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count-3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count-3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count-11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES-1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex]*2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3*(max_blindex+1) + 5+5+4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes-257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes-1,   5);
  send_bits(s, blcodes-4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank]*2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes-1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes-1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && (s.dyn_ltree[n*2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES<<1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len+3+7) >>> 3;
    static_lenb = (s.static_len+3+7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES<<1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES<<1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1, max_blindex+1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc*2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc]+LITERALS+1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize-1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

exports._tr_init  = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block  = _tr_flush_block;
exports._tr_tally = _tr_tally;
exports._tr_align = _tr_align;

},{"../utils/common":52}],64:[function(require,module,exports){
'use strict';


function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;

},{}],65:[function(require,module,exports){
/* Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = function arrayEquals(array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!arrayEquals.apply(this[i], [array[i]]))
                return false;
        } else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal:
            // {x:20} != {x:20}
            return false;
        }
    }
    return true;
};


},{}],66:[function(require,module,exports){
/* Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

exports.Interop = require('./interop');

},{"./interop":67}],67:[function(require,module,exports){
/* Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global RTCSessionDescription */
/* jshint -W097 */
"use strict";

var transform = require('./transform');
var arrayEquals = require('./array-equals');

function Interop() {

    /**
     * This map holds the most recent Unified Plan offer/answer SDP that was
     * converted to Plan B, with the SDP type ('offer' or 'answer') as keys and
     * the SDP string as values.
     *
     * @type {{}}
     */
    this.cache = {};
}

module.exports = Interop;

/**
 * Returns the index of the first m-line with the given media type and with a
 * direction which allows sending, in the last Unified Plan description with
 * type "answer" converted to Plan B. Returns {null} if there is no saved
 * answer, or if none of its m-lines with the given type allow sending.
 * @param type the media type ("audio" or "video").
 * @returns {*}
 */
Interop.prototype.getFirstSendingIndexFromAnswer = function(type) {
    if (!this.cache.answer) {
        return null;
    }

    var session = transform.parse(this.cache.answer);
    if (session && session.media && Array.isArray(session.media)){
        for (var i = 0; i < session.media.length; i++) {
            if (session.media[i].type == type &&
                (!session.media[i].direction /* default to sendrecv */ ||
                    session.media[i].direction === 'sendrecv' ||
                    session.media[i].direction === 'sendonly')){
                return i;
            }
        }
    }

    return null;
};

/**
 * This method transforms a Unified Plan SDP to an equivalent Plan B SDP. A
 * PeerConnection wrapper transforms the SDP to Plan B before passing it to the
 * application.
 *
 * @param desc
 * @returns {*}
 */
Interop.prototype.toPlanB = function(desc) {
    var self = this;
    //#region Preliminary input validation.

    if (typeof desc !== 'object' || desc === null ||
        typeof desc.sdp !== 'string') {
        console.warn('An empty description was passed as an argument.');
        return desc;
    }

    // Objectify the SDP for easier manipulation.
    var session = transform.parse(desc.sdp);

    // If the SDP contains no media, there's nothing to transform.
    if (typeof session.media === 'undefined' ||
        !Array.isArray(session.media) || session.media.length === 0) {
        console.warn('The description has no media.');
        return desc;
    }

    // Try some heuristics to "make sure" this is a Unified Plan SDP. Plan B
    // SDP has a video, an audio and a data "channel" at most.
    if (session.media.length <= 3 && session.media.every(function(m) {
            return ['video', 'audio', 'data'].indexOf(m.mid) !== -1;
        })) {
        console.warn('This description does not look like Unified Plan.');
        return desc;
    }

    //#endregion

    // HACK https://bugzilla.mozilla.org/show_bug.cgi?id=1113443
    var sdp = desc.sdp;
    var rewrite = false;
    for (var i = 0; i < session.media.length; i++) {
        var uLine = session.media[i];
        uLine.rtp.forEach(function(rtp) {
            if (rtp.codec === 'NULL')
            {
                rewrite = true;
                var offer = transform.parse(self.cache['offer']);
                rtp.codec = offer.media[i].rtp[0].codec;
            }
        });
    };
    if (rewrite) {
        sdp = transform.write(session);
    }

    // Unified Plan SDP is our "precious". Cache it for later use in the Plan B
    // -> Unified Plan transformation.
    this.cache[desc.type] = sdp;

    //#region Convert from Unified Plan to Plan B.

    // We rebuild the session.media array.
    var media = session.media;
    session.media = [];

    // Associative array that maps channel types to channel objects for fast
    // access to channel objects by their type, e.g. type2bl['audio']->channel
    // obj.
    var type2bl = {};

    // Used to build the group:BUNDLE value after the channels construction
    // loop.
    var types = [];

    // Implode the Unified Plan m-lines/tracks into Plan B channels.
    media.forEach(function(uLine) {

        // rtcp-mux is required in the Plan B SDP.
        if ((typeof uLine.rtcpMux !== 'string' ||
            uLine.rtcpMux !== 'rtcp-mux') &&
            uLine.direction !== 'inactive') {
            throw new Error('Cannot convert to Plan B because m-lines ' +
                'without the rtcp-mux attribute were found.');
        }

        if (uLine.type === 'application') {
            session.media.push(uLine);
            types.push(uLine.mid);
            return;
        }

        // If we don't have a channel for this uLine.type, then use this
        // uLine as the channel basis.
        if (typeof type2bl[uLine.type] === 'undefined') {
            type2bl[uLine.type] = uLine;
        }

        // Add sources to the channel and handle a=msid.
        if (typeof uLine.sources === 'object') {
            Object.keys(uLine.sources).forEach(function(ssrc) {
                if (typeof type2bl[uLine.type].sources !== 'object')
                    type2bl[uLine.type].sources = {};

                // Assign the sources to the channel.
                type2bl[uLine.type].sources[ssrc] =
                    uLine.sources[ssrc];

                if (typeof uLine.msid !== 'undefined') {
                    // In Plan B the msid is an SSRC attribute. Also, we don't
                    // care about the obsolete label and mslabel attributes.
                    //
                    // Note that it is not guaranteed that the uLine will
                    // have an msid. recvonly channels in particular don't have
                    // one.
                    type2bl[uLine.type].sources[ssrc].msid =
                        uLine.msid;
                }
                // NOTE ssrcs in ssrc groups will share msids, as
                // draft-uberti-rtcweb-plan-00 mandates.
            });
        }

        // Add ssrc groups to the channel.
        if (typeof uLine.ssrcGroups !== 'undefined' &&
                Array.isArray(uLine.ssrcGroups)) {

            // Create the ssrcGroups array, if it's not defined.
            if (typeof type2bl[uLine.type].ssrcGroups === 'undefined' ||
                    !Array.isArray(type2bl[uLine.type].ssrcGroups)) {
                type2bl[uLine.type].ssrcGroups = [];
            }

            type2bl[uLine.type].ssrcGroups =
                type2bl[uLine.type].ssrcGroups.concat(
                    uLine.ssrcGroups);
        }

        if (type2bl[uLine.type] === uLine) {
            // Copy ICE related stuff from the principal media line.
            uLine.candidates = media[0].candidates;
            uLine.iceUfrag = media[0].iceUfrag;
            uLine.icePwd = media[0].icePwd;
            uLine.fingerprint = media[0].fingerprint;

            // Plan B mids are in ['audio', 'video', 'data']
            uLine.mid = uLine.type;

            // Plan B doesn't support/need the bundle-only attribute.
            delete uLine.bundleOnly;

            // In Plan B the msid is an SSRC attribute.
            delete uLine.msid;

            // Used to build the group:BUNDLE value after this loop.
            types.push(uLine.type);

            // Add the channel to the new media array.
            session.media.push(uLine);
        }
    });

    // We regenerate the BUNDLE group with the new mids.
    session.groups.some(function(group) {
        if (group.type === 'BUNDLE') {
            group.mids = types.join(' ');
            return true;
        }
    });

    // msid semantic
    session.msidSemantic = {
        semantic: 'WMS',
        token: '*'
    };

    var resStr = transform.write(session);

    return new RTCSessionDescription({
        type: desc.type,
        sdp: resStr
    });

    //#endregion
};

/**
 * This method transforms a Plan B SDP to an equivalent Unified Plan SDP. A
 * PeerConnection wrapper transforms the SDP to Unified Plan before passing it
 * to FF.
 *
 * @param desc
 * @returns {*}
 */
Interop.prototype.toUnifiedPlan = function(desc) {
    var self = this;
    //#region Preliminary input validation.

    if (typeof desc !== 'object' || desc === null ||
        typeof desc.sdp !== 'string') {
        console.warn('An empty description was passed as an argument.');
        return desc;
    }

    var session = transform.parse(desc.sdp);

    // If the SDP contains no media, there's nothing to transform.
    if (typeof session.media === 'undefined' ||
        !Array.isArray(session.media) || session.media.length === 0) {
        console.warn('The description has no media.');
        return desc;
    }

    // Try some heuristics to "make sure" this is a Plan B SDP. Plan B SDP has
    // a video, an audio and a data "channel" at most.
    if (session.media.length > 3 || !session.media.every(function(m) {
            return ['video', 'audio', 'data'].indexOf(m.mid) !== -1;
        })) {
        console.warn('This description does not look like Plan B.');
        return desc;
    }

    // Make sure this Plan B SDP can be converted to a Unified Plan SDP.
    var mids = [];
    session.media.forEach(function(m) {
        mids.push(m.mid);
    });

    var hasBundle = false;
    if (typeof session.groups !== 'undefined' &&
        Array.isArray(session.groups)) {
        hasBundle = session.groups.every(function(g) {
            return g.type !== 'BUNDLE' ||
                arrayEquals.apply(g.mids.sort(), [mids.sort()]);
        });
    }

    if (!hasBundle) {
        throw new Error("Cannot convert to Unified Plan because m-lines that" +
            " are not bundled were found.");
    }

    //#endregion


    //#region Convert from Plan B to Unified Plan.

    // Unfortunately, a Plan B offer/answer doesn't have enough information to
    // rebuild an equivalent Unified Plan offer/answer.
    //
    // For example, if this is a local answer (in Unified Plan style) that we
    // convert to Plan B prior to handing it over to the application (the
    // PeerConnection wrapper called us, for instance, after a successful
    // createAnswer), we want to remember the m-line at which we've seen the
    // (local) SSRC. That's because when the application wants to do call the
    // SLD method, forcing us to do the inverse transformation (from Plan B to
    // Unified Plan), we need to know to which m-line to assign the (local)
    // SSRC. We also need to know all the other m-lines that the original
    // answer had and include them in the transformed answer as well.
    //
    // Another example is if this is a remote offer that we convert to Plan B
    // prior to giving it to the application, we want to remember the mid at
    // which we've seen the (remote) SSRC.
    //
    // In the iteration that follows, we use the cached Unified Plan (if it
    // exists) to assign mids to ssrcs.

    var cached;
    if (typeof this.cache[desc.type] !== 'undefined') {
        cached = transform.parse(this.cache[desc.type]);
    }

    var recvonlySsrcs = {
        audio: {},
        video: {}
    };

    // A helper map that sends mids to m-line objects. We use it later to
    // rebuild the Unified Plan style session.media array.
    var mid2ul = {};
    session.media.forEach(function(bLine) {
        if ((typeof bLine.rtcpMux !== 'string' ||
            bLine.rtcpMux !== 'rtcp-mux') &&
            bLine.direction !== 'inactive') {
            throw new Error("Cannot convert to Unified Plan because m-lines " +
                "without the rtcp-mux attribute were found.");
        }

        if (bLine.type === 'application') {
            mid2ul[bLine.mid] = bLine;
            return;
        }

        // With rtcp-mux and bundle all the channels should have the same ICE
        // stuff.
        var sources = bLine.sources;
        var ssrcGroups = bLine.ssrcGroups;
        var candidates = bLine.candidates;
        var iceUfrag = bLine.iceUfrag;
        var icePwd = bLine.icePwd;
        var fingerprint = bLine.fingerprint;
        var port = bLine.port;

        // We'll use the "bLine" object as a prototype for each new "mLine"
        // that we create, but first we need to clean it up a bit.
        delete bLine.sources;
        delete bLine.ssrcGroups;
        delete bLine.candidates;
        delete bLine.iceUfrag;
        delete bLine.icePwd;
        delete bLine.fingerprint;
        delete bLine.port;
        delete bLine.mid;

        // inverted ssrc group map
        var ssrc2group = {};
        if (typeof ssrcGroups !== 'undefined' && Array.isArray(ssrcGroups)) {
            ssrcGroups.forEach(function (ssrcGroup) {

                // TODO(gp) find out how to receive simulcast with FF. For the
                // time being, hide it.
                if (ssrcGroup.semantics === 'SIM') {
                    return;
                }

                // XXX This might brake if an SSRC is in more than one group
                // for some reason.
                if (typeof ssrcGroup.ssrcs !== 'undefined' &&
                    Array.isArray(ssrcGroup.ssrcs)) {
                    ssrcGroup.ssrcs.forEach(function (ssrc) {
                        if (typeof ssrc2group[ssrc] === 'undefined') {
                            ssrc2group[ssrc] = [];
                        }

                        ssrc2group[ssrc].push(ssrcGroup);
                    });
                }
            });
        }

        // ssrc to m-line index.
        var ssrc2ml = {};

        if (typeof sources === 'object') {

            // Explode the Plan B channel sources with one m-line per source.
            Object.keys(sources).forEach(function(ssrc) {

                // The (unified) m-line for this SSRC. We either create it from
                // scratch or, if it's a grouped SSRC, we re-use a related
                // mline. In other words, if the source is grouped with another
                // source, put the two together in the same m-line.
                var uLine;

                // We assume here that we are the answerer in the O/A, so any
                // offers which we translate come from the remote side, while
                // answers are local. So the check below is to make that we
                // handle receive-only SSRCs in a special way only if they come
                // from the remote side.
                if (desc.type==='offer') {
                    // We want to detect SSRCs which are used by a remote peer
                    // in an m-line with direction=recvonly (i.e. they are
                    // being used for RTCP only).
                    // This information would have gotten lost if the remote
                    // peer used Unified Plan and their local description was
                    // translated to Plan B. So we use the lack of an MSID
                    // attribute to deduce a "receive only" SSRC.
                    if (!sources[ssrc].msid) {
                        recvonlySsrcs[bLine.type][ssrc] = sources[ssrc];
                        // Receive-only SSRCs must not create new m-lines. We
                        // will assign them to an existing m-line later.
                        return;
                    }
                }

                if (typeof ssrc2group[ssrc] !== 'undefined' &&
                    Array.isArray(ssrc2group[ssrc])) {
                    ssrc2group[ssrc].some(function (ssrcGroup) {
                        // ssrcGroup.ssrcs *is* an Array, no need to check
                        // again here.
                        return ssrcGroup.ssrcs.some(function (related) {
                            if (typeof ssrc2ml[related] === 'object') {
                                uLine = ssrc2ml[related];
                                return true;
                            }
                        });
                    });
                }

                if (typeof uLine === 'object') {
                    // the m-line already exists. Just add the source.
                    uLine.sources[ssrc] = sources[ssrc];
                    delete sources[ssrc].msid;
                } else {
                    // Use the "bLine" as a prototype for the "uLine".
                    uLine = Object.create(bLine);
                    ssrc2ml[ssrc] = uLine;

                    if (typeof sources[ssrc].msid !== 'undefined') {
                        // Assign the msid of the source to the m-line. Note
                        // that it is not guaranteed that the source will have
                        // msid. In particular "recvonly" sources don't have an
                        // msid. Note that "recvonly" is a term only defined
                        // for m-lines.
                        uLine.msid = sources[ssrc].msid;
                        uLine.direction = 'sendrecv';
                        delete sources[ssrc].msid;
                    }

                    // We assign one SSRC per media line.
                    uLine.sources = {};
                    uLine.sources[ssrc] = sources[ssrc];
                    uLine.ssrcGroups = ssrc2group[ssrc];

                    // Use the cached Unified Plan SDP (if it exists) to assign
                    // SSRCs to mids.
                    if (typeof cached !== 'undefined' &&
                        typeof cached.media !== 'undefined' &&
                        Array.isArray(cached.media)) {

                        cached.media.forEach(function (m) {
                            if (typeof m.sources === 'object') {
                                Object.keys(m.sources).forEach(function (s) {
                                    if (s === ssrc) {
                                        uLine.mid = m.mid;
                                    }
                                });
                            }
                        });
                    }

                    if (typeof uLine.mid === 'undefined') {

                        // If this is an SSRC that we see for the first time
                        // assign it a new mid. This is typically the case when
                        // this method is called to transform a remote
                        // description for the first time or when there is a
                        // new SSRC in the remote description because a new
                        // peer has joined the conference. Local SSRCs should
                        // have already been added to the map in the toPlanB
                        // method.
                        //
                        // Because FF generates answers in Unified Plan style,
                        // we MUST already have a cached answer with all the
                        // local SSRCs mapped to some m-line/mid.

                        if (desc.type === 'answer') {
                            throw new Error("An unmapped SSRC was found.");
                        }

                        uLine.mid = [bLine.type, '-', ssrc].join('');
                    }

                    // Include the candidates in the 1st media line.
                    uLine.candidates = candidates;
                    uLine.iceUfrag = iceUfrag;
                    uLine.icePwd = icePwd;
                    uLine.fingerprint = fingerprint;
                    uLine.port = port;

                    mid2ul[uLine.mid] = uLine;
                }
            });
        }
    });

    // Rebuild the media array in the right order and add the missing mLines
    // (missing from the Plan B SDP).
    session.media = [];
    mids = []; // reuse

    if (desc.type === 'answer') {

        // The media lines in the answer must match the media lines in the
        // offer. The order is important too. Here we assume that Firefox is
        // the answerer, so we merely have to use the reconstructed (unified)
        // answer to update the cached (unified) answer accordingly.
        //
        // In the general case, one would have to use the cached (unified)
        // offer to find the m-lines that are missing from the reconstructed
        // answer, potentially grabbing them from the cached (unified) answer.
        // One has to be careful with this approach because inactive m-lines do
        // not always have an mid, making it tricky (impossible?) to find where
        // exactly and which m-lines are missing from the reconstructed answer.

        for (var i = 0; i < cached.media.length; i++) {
            var uLine = cached.media[i];

            if (typeof mid2ul[uLine.mid] === 'undefined') {

                // The mid isn't in the reconstructed (unified) answer.
                // This is either a (unified) m-line containing a remote
                // track only, or a (unified) m-line containing a remote
                // track and a local track that has been removed.
                // In either case, it MUST exist in the cached
                // (unified) answer.
                //
                // In case this is a removed local track, clean-up
                // the (unified) m-line and make sure it's 'recvonly' or
                // 'inactive'.

                delete uLine.msid;
                delete uLine.sources;
                delete uLine.ssrcGroups;
                if (!uLine.direction
                    || uLine.direction === 'sendrecv')
                    uLine.direction = 'recvonly';
                else if (uLine.direction === 'sendonly')
                    uLine.direction = 'inactive';
            } else {
                // This is an (unified) m-line/channel that contains a local
                // track (sendrecv or sendonly channel) or it's a unified
                // recvonly m-line/channel. In either case, since we're
                // going from PlanB -> Unified Plan this m-line MUST
                // exist in the cached answer.
            }

            session.media.push(uLine);

            if (typeof uLine.mid === 'string') {
                // inactive lines don't/may not have an mid.
                mids.push(uLine.mid);
            }
        }
    } else {

        // SDP offer/answer (and the JSEP spec) forbids removing an m-section
        // under any circumstances. If we are no longer interested in sending a
        // track, we just remove the msid and ssrc attributes and set it to
        // either a=recvonly (as the reofferer, we must use recvonly if the
        // other side was previously sending on the m-section, but we can also
        // leave the possibility open if it wasn't previously in use), or
        // a=inactive.

        if (typeof cached !== 'undefined' &&
            typeof cached.media !== 'undefined' &&
            Array.isArray(cached.media)) {
            cached.media.forEach(function(uLine) {
                mids.push(uLine.mid);
                if (typeof mid2ul[uLine.mid] !== 'undefined') {
                    session.media.push(mid2ul[uLine.mid]);
                } else {
                    delete uLine.msid;
                    delete uLine.sources;
                    delete uLine.ssrcGroups;
                    if (!uLine.direction
                        || uLine.direction === 'sendrecv')
                        uLine.direction = 'recvonly';
                    if (!uLine.direction
                        || uLine.direction === 'sendonly')
                        uLine.direction = 'inactive';
                    session.media.push(uLine);
                }
            });
        }

        // Add all the remaining (new) m-lines of the transformed SDP.
        Object.keys(mid2ul).forEach(function(mid) {
            if (mids.indexOf(mid) === -1) {
                mids.push(mid);
                if (mid2ul[mid].direction === 'recvonly') {
                    // This is a remote recvonly channel. Add its SSRC to the
                    // appropriate sendrecv or sendonly channel.
                    // TODO(gp) what if we don't have sendrecv/sendonly
                    // channel?

                    session.media.some(function (uLine) {
                        if ((uLine.direction === 'sendrecv' ||
                            uLine.direction === 'sendonly') &&
                            uLine.type === mid2ul[mid].type) {

                            // mid2ul[mid] shouldn't have any ssrc-groups
                            Object.keys(mid2ul[mid].sources).forEach(
                                function (ssrc) {
                                uLine.sources[ssrc] =
                                    mid2ul[mid].sources[ssrc];
                            });

                            return true;
                        }
                    });
                } else {
                    session.media.push(mid2ul[mid]);
                }
            }
        });
    }

    // After we have constructed the Plan Unified m-lines we can figure out
    // where (in which m-line) to place the 'recvonly SSRCs'.
    // Note: we assume here that we are the answerer in the O/A, so any offers
    // which we translate come from the remote side, while answers are local
    // (and so our last local description is cached as an 'answer').
    ["audio", "video"].forEach(function (type) {
        if (!session || !session.media || !Array.isArray(session.media))
            return;

        var idx = null;
        if (Object.keys(recvonlySsrcs[type]).length > 0) {
            idx = self.getFirstSendingIndexFromAnswer(type);
            if (idx === null){
                // If this is the first offer we receive, we don't have a
                // cached answer. Assume that we will be sending media using
                // the first m-line for each media type.

                for (var i = 0; i < session.media.length; i++) {
                    if (session.media[i].type === type) {
                        idx = i;
                        break;
                    }
                }
            }
        }

        if (idx && session.media.length > idx) {
            var mLine = session.media[idx];
            Object.keys(recvonlySsrcs[type]).forEach(function(ssrc) {
                if (mLine.sources && mLine.sources[ssrc]) {
                    console.warn("Replacing an existing SSRC.");
                }
                if (!mLine.sources) {
                    mLine.sources = {};
                }

                mLine.sources[ssrc] = recvonlySsrcs[type][ssrc];
            });
        }
    });

    // We regenerate the BUNDLE group (since we regenerated the mids)
    session.groups.some(function(group) {
        if (group.type === 'BUNDLE') {
            group.mids = mids.join(' ');
            return true;
        }
    });

    // msid semantic
    session.msidSemantic = {
        semantic: 'WMS',
        token: '*'
    };

    var resStr = transform.write(session);

    // Cache the transformed SDP (Unified Plan) for later re-use in this
    // function.
    this.cache[desc.type] = resStr;

    return new RTCSessionDescription({
        type: desc.type,
        sdp: resStr
    });

    //#endregion
};

},{"./array-equals":65,"./transform":68}],68:[function(require,module,exports){
/* Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var transform = require('sdp-transform');

exports.write = function(session, opts) {

  if (typeof session !== 'undefined' &&
      typeof session.media !== 'undefined' &&
      Array.isArray(session.media)) {

    session.media.forEach(function (mLine) {
      // expand sources to ssrcs
      if (typeof mLine.sources !== 'undefined' &&
        Object.keys(mLine.sources).length !== 0) {
          mLine.ssrcs = [];
          Object.keys(mLine.sources).forEach(function (ssrc) {
            var source = mLine.sources[ssrc];
            Object.keys(source).forEach(function (attribute) {
              mLine.ssrcs.push({
                id: ssrc,
                attribute: attribute,
                value: source[attribute]
              });
            });
          });
          delete mLine.sources;
        }

      // join ssrcs in ssrc groups
      if (typeof mLine.ssrcGroups !== 'undefined' &&
        Array.isArray(mLine.ssrcGroups)) {
          mLine.ssrcGroups.forEach(function (ssrcGroup) {
            if (typeof ssrcGroup.ssrcs !== 'undefined' &&
                Array.isArray(ssrcGroup.ssrcs)) {
              ssrcGroup.ssrcs = ssrcGroup.ssrcs.join(' ');
            }
          });
        }
    });
  }

  // join group mids
  if (typeof session !== 'undefined' &&
      typeof session.groups !== 'undefined' && Array.isArray(session.groups)) {

    session.groups.forEach(function (g) {
      if (typeof g.mids !== 'undefined' && Array.isArray(g.mids)) {
        g.mids = g.mids.join(' ');
      }
    });
  }

  return transform.write(session, opts);
};

exports.parse = function(sdp) {
  var session = transform.parse(sdp);

  if (typeof session !== 'undefined' && typeof session.media !== 'undefined' &&
      Array.isArray(session.media)) {

    session.media.forEach(function (mLine) {
      // group sources attributes by ssrc
      if (typeof mLine.ssrcs !== 'undefined' && Array.isArray(mLine.ssrcs)) {
        mLine.sources = {};
        mLine.ssrcs.forEach(function (ssrc) {
          if (!mLine.sources[ssrc.id])
          mLine.sources[ssrc.id] = {};
        mLine.sources[ssrc.id][ssrc.attribute] = ssrc.value;
        });

        delete mLine.ssrcs;
      }

      // split ssrcs in ssrc groups
      if (typeof mLine.ssrcGroups !== 'undefined' &&
        Array.isArray(mLine.ssrcGroups)) {
          mLine.ssrcGroups.forEach(function (ssrcGroup) {
            if (typeof ssrcGroup.ssrcs === 'string') {
              ssrcGroup.ssrcs = ssrcGroup.ssrcs.split(' ');
            }
          });
        }
    });
  }
  // split group mids
  if (typeof session !== 'undefined' &&
      typeof session.groups !== 'undefined' && Array.isArray(session.groups)) {

    session.groups.forEach(function (g) {
      if (typeof g.mids === 'string') {
        g.mids = g.mids.split(' ');
      }
    });
  }

  return session;
};


},{"sdp-transform":70}],69:[function(require,module,exports){
var grammar = module.exports = {
  v: [{
      name: 'version',
      reg: /^(\d*)$/
  }],
  o: [{ //o=- 20518 0 IN IP4 203.0.113.1
    // NB: sessionId will be a String in most cases because it is huge
    name: 'origin',
    reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
    names: ['username', 'sessionId', 'sessionVersion', 'netType', 'ipVer', 'address'],
    format: "%s %s %d %s IP%d %s"
  }],
  // default parsing of these only (though some of these feel outdated)
  s: [{ name: 'name' }],
  i: [{ name: 'description' }],
  u: [{ name: 'uri' }],
  e: [{ name: 'email' }],
  p: [{ name: 'phone' }],
  z: [{ name: 'timezones' }], // TODO: this one can actually be parsed properly..
  r: [{ name: 'repeats' }],   // TODO: this one can also be parsed properly
  //k: [{}], // outdated thing ignored
  t: [{ //t=0 0
    name: 'timing',
    reg: /^(\d*) (\d*)/,
    names: ['start', 'stop'],
    format: "%d %d"
  }],
  c: [{ //c=IN IP4 10.47.197.26
      name: 'connection',
      reg: /^IN IP(\d) (\S*)/,
      names: ['version', 'ip'],
      format: "IN IP%d %s"
  }],
  b: [{ //b=AS:4000
      push: 'bandwidth',
      reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
      names: ['type', 'limit'],
      format: "%s:%s"
  }],
  m: [{ //m=video 51744 RTP/AVP 126 97 98 34 31
      // NB: special - pushes to session
      // TODO: rtp/fmtp should be filtered by the payloads found here?
      reg: /^(\w*) (\d*) ([\w\/]*)(?: (.*))?/,
      names: ['type', 'port', 'protocol', 'payloads'],
      format: "%s %d %s %s"
  }],
  a: [
    { //a=rtpmap:110 opus/48000/2
      push: 'rtp',
      reg: /^rtpmap:(\d*) ([\w\-]*)(?:\s*\/(\d*)(?:\s*\/(\S*))?)?/,
      names: ['payload', 'codec', 'rate', 'encoding'],
      format: function (o) {
        return (o.encoding) ?
          "rtpmap:%d %s/%s/%s":
          o.rate ?
          "rtpmap:%d %s/%s":
          "rtpmap:%d %s";
      }
    },
    {
      //a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
      //a=fmtp:111 minptime=10; useinbandfec=1
      push: 'fmtp',
      reg: /^fmtp:(\d*) ([\S| ]*)/,
      names: ['payload', 'config'],
      format: "fmtp:%d %s"
    },
    { //a=control:streamid=0
        name: 'control',
        reg: /^control:(.*)/,
        format: "control:%s"
    },
    { //a=rtcp:65179 IN IP4 193.84.77.194
      name: 'rtcp',
      reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
      names: ['port', 'netType', 'ipVer', 'address'],
      format: function (o) {
        return (o.address != null) ?
          "rtcp:%d %s IP%d %s":
          "rtcp:%d";
      }
    },
    { //a=rtcp-fb:98 trr-int 100
      push: 'rtcpFbTrrInt',
      reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
      names: ['payload', 'value'],
      format: "rtcp-fb:%d trr-int %d"
    },
    { //a=rtcp-fb:98 nack rpsi
      push: 'rtcpFb',
      reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
      names: ['payload', 'type', 'subtype'],
      format: function (o) {
        return (o.subtype != null) ?
          "rtcp-fb:%s %s %s":
          "rtcp-fb:%s %s";
      }
    },
    { //a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
      //a=extmap:1/recvonly URI-gps-string
      push: 'ext',
      reg: /^extmap:([\w_\/]*) (\S*)(?: (\S*))?/,
      names: ['value', 'uri', 'config'], // value may include "/direction" suffix
      format: function (o) {
        return (o.config != null) ?
          "extmap:%s %s %s":
          "extmap:%s %s";
      }
    },
    {
      //a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
      push: 'crypto',
      reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
      names: ['id', 'suite', 'config', 'sessionConfig'],
      format: function (o) {
        return (o.sessionConfig != null) ?
          "crypto:%d %s %s %s":
          "crypto:%d %s %s";
      }
    },
    { //a=setup:actpass
      name: 'setup',
      reg: /^setup:(\w*)/,
      format: "setup:%s"
    },
    { //a=mid:1
      name: 'mid',
      reg: /^mid:([^\s]*)/,
      format: "mid:%s"
    },
    { //a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
      name: 'msid',
      reg: /^msid:(.*)/,
      format: "msid:%s"
    },
    { //a=ptime:20
      name: 'ptime',
      reg: /^ptime:(\d*)/,
      format: "ptime:%d"
    },
    { //a=maxptime:60
      name: 'maxptime',
      reg: /^maxptime:(\d*)/,
      format: "maxptime:%d"
    },
    { //a=sendrecv
      name: 'direction',
      reg: /^(sendrecv|recvonly|sendonly|inactive)/
    },
    { //a=ice-lite
      name: 'icelite',
      reg: /^(ice-lite)/
    },
    { //a=ice-ufrag:F7gI
      name: 'iceUfrag',
      reg: /^ice-ufrag:(\S*)/,
      format: "ice-ufrag:%s"
    },
    { //a=ice-pwd:x9cml/YzichV2+XlhiMu8g
      name: 'icePwd',
      reg: /^ice-pwd:(\S*)/,
      format: "ice-pwd:%s"
    },
    { //a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
      name: 'fingerprint',
      reg: /^fingerprint:(\S*) (\S*)/,
      names: ['type', 'hash'],
      format: "fingerprint:%s %s"
    },
    {
      //a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
      //a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0
      //a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0
      //a=candidate:229815620 1 tcp 1518280447 192.168.150.19 60017 typ host tcptype active generation 0
      //a=candidate:3289912957 2 tcp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 tcptype passive generation 0
      push:'candidates',
      reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: tcptype (\S*))?(?: generation (\d*))?/,
      names: ['foundation', 'component', 'transport', 'priority', 'ip', 'port', 'type', 'raddr', 'rport', 'tcptype', 'generation'],
      format: function (o) {
        var str = "candidate:%s %d %s %d %s %d typ %s";

        str += (o.raddr != null) ? " raddr %s rport %d" : "%v%v";

        // NB: candidate has three optional chunks, so %void middles one if it's missing
        str += (o.tcptype != null) ? " tcptype %s" : "%v";

        if (o.generation != null) {
          str += " generation %d";
        }
        return str;
      }
    },
    { //a=end-of-candidates (keep after the candidates line for readability)
      name: 'endOfCandidates',
      reg: /^(end-of-candidates)/
    },
    { //a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
      name: 'remoteCandidates',
      reg: /^remote-candidates:(.*)/,
      format: "remote-candidates:%s"
    },
    { //a=ice-options:google-ice
      name: 'iceOptions',
      reg: /^ice-options:(\S*)/,
      format: "ice-options:%s"
    },
    { //a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
      push: "ssrcs",
      reg: /^ssrc:(\d*) ([\w_]*):(.*)/,
      names: ['id', 'attribute', 'value'],
      format: "ssrc:%d %s:%s"
    },
    { //a=ssrc-group:FEC 1 2
      push: "ssrcGroups",
      reg: /^ssrc-group:(\w*) (.*)/,
      names: ['semantics', 'ssrcs'],
      format: "ssrc-group:%s %s"
    },
    { //a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
      name: "msidSemantic",
      reg: /^msid-semantic:\s?(\w*) (\S*)/,
      names: ['semantic', 'token'],
      format: "msid-semantic: %s %s" // space after ":" is not accidental
    },
    { //a=group:BUNDLE audio video
      push: 'groups',
      reg: /^group:(\w*) (.*)/,
      names: ['type', 'mids'],
      format: "group:%s %s"
    },
    { //a=rtcp-mux
      name: 'rtcpMux',
      reg: /^(rtcp-mux)/
    },
    { //a=rtcp-rsize
      name: 'rtcpRsize',
      reg: /^(rtcp-rsize)/
    },
    { // any a= that we don't understand is kepts verbatim on media.invalid
      push: 'invalid',
      names: ["value"]
    }
  ]
};

// set sensible defaults to avoid polluting the grammar with boring details
Object.keys(grammar).forEach(function (key) {
  var objs = grammar[key];
  objs.forEach(function (obj) {
    if (!obj.reg) {
      obj.reg = /(.*)/;
    }
    if (!obj.format) {
      obj.format = "%s";
    }
  });
});

},{}],70:[function(require,module,exports){
var parser = require('./parser');
var writer = require('./writer');

exports.write = writer;
exports.parse = parser.parse;
exports.parseFmtpConfig = parser.parseFmtpConfig;
exports.parsePayloads = parser.parsePayloads;
exports.parseRemoteCandidates = parser.parseRemoteCandidates;

},{"./parser":71,"./writer":72}],71:[function(require,module,exports){
var toIntIfInt = function (v) {
  return String(Number(v)) === v ? Number(v) : v;
};

var attachProperties = function (match, location, names, rawName) {
  if (rawName && !names) {
    location[rawName] = toIntIfInt(match[1]);
  }
  else {
    for (var i = 0; i < names.length; i += 1) {
      if (match[i+1] != null) {
        location[names[i]] = toIntIfInt(match[i+1]);
      }
    }
  }
};

var parseReg = function (obj, location, content) {
  var needsBlank = obj.name && obj.names;
  if (obj.push && !location[obj.push]) {
    location[obj.push] = [];
  }
  else if (needsBlank && !location[obj.name]) {
    location[obj.name] = {};
  }
  var keyLocation = obj.push ?
    {} :  // blank object that will be pushed
    needsBlank ? location[obj.name] : location; // otherwise, named location or root

  attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);

  if (obj.push) {
    location[obj.push].push(keyLocation);
  }
};

var grammar = require('./grammar');
var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);

exports.parse = function (sdp) {
  var session = {}
    , media = []
    , location = session; // points at where properties go under (one of the above)

  // parse lines we understand
  sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function (l) {
    var type = l[0];
    var content = l.slice(2);
    if (type === 'm') {
      media.push({rtp: [], fmtp: []});
      location = media[media.length-1]; // point at latest media line
    }

    for (var j = 0; j < (grammar[type] || []).length; j += 1) {
      var obj = grammar[type][j];
      if (obj.reg.test(content)) {
        return parseReg(obj, location, content);
      }
    }
  });

  session.media = media; // link it up
  return session;
};

var fmtpReducer = function (acc, expr) {
  var s = expr.split('=');
  if (s.length === 2) {
    acc[s[0]] = toIntIfInt(s[1]);
  }
  return acc;
};

exports.parseFmtpConfig = function (str) {
  return str.split(/\;\s?/).reduce(fmtpReducer, {});
};

exports.parsePayloads = function (str) {
  return str.split(' ').map(Number);
};

exports.parseRemoteCandidates = function (str) {
  var candidates = [];
  var parts = str.split(' ').map(toIntIfInt);
  for (var i = 0; i < parts.length; i += 3) {
    candidates.push({
      component: parts[i],
      ip: parts[i + 1],
      port: parts[i + 2]
    });
  }
  return candidates;
};

},{"./grammar":69}],72:[function(require,module,exports){
var grammar = require('./grammar');

// customized util.format - discards excess arguments and can void middle ones
var formatRegExp = /%[sdv%]/g;
var format = function (formatStr) {
  var i = 1;
  var args = arguments;
  var len = args.length;
  return formatStr.replace(formatRegExp, function (x) {
    if (i >= len) {
      return x; // missing argument
    }
    var arg = args[i];
    i += 1;
    switch (x) {
      case '%%':
        return '%';
      case '%s':
        return String(arg);
      case '%d':
        return Number(arg);
      case '%v':
        return '';
    }
  });
  // NB: we discard excess arguments - they are typically undefined from makeLine
};

var makeLine = function (type, obj, location) {
  var str = obj.format instanceof Function ?
    (obj.format(obj.push ? location : location[obj.name])) :
    obj.format;

  var args = [type + '=' + str];
  if (obj.names) {
    for (var i = 0; i < obj.names.length; i += 1) {
      var n = obj.names[i];
      if (obj.name) {
        args.push(location[obj.name][n]);
      }
      else { // for mLine and push attributes
        args.push(location[obj.names[i]]);
      }
    }
  }
  else {
    args.push(location[obj.name]);
  }
  return format.apply(null, args);
};

// RFC specified order
// TODO: extend this with all the rest
var defaultOuterOrder = [
  'v', 'o', 's', 'i',
  'u', 'e', 'p', 'c',
  'b', 't', 'r', 'z', 'a'
];
var defaultInnerOrder = ['i', 'c', 'b', 'a'];


module.exports = function (session, opts) {
  opts = opts || {};
  // ensure certain properties exist
  if (session.version == null) {
    session.version = 0; // "v=0" must be there (only defined version atm)
  }
  if (session.name == null) {
    session.name = " "; // "s= " must be there if no meaningful name set
  }
  session.media.forEach(function (mLine) {
    if (mLine.payloads == null) {
      mLine.payloads = "";
    }
  });

  var outerOrder = opts.outerOrder || defaultOuterOrder;
  var innerOrder = opts.innerOrder || defaultInnerOrder;
  var sdp = [];

  // loop through outerOrder for matching properties on session
  outerOrder.forEach(function (type) {
    grammar[type].forEach(function (obj) {
      if (obj.name in session && session[obj.name] != null) {
        sdp.push(makeLine(type, obj, session));
      }
      else if (obj.push in session && session[obj.push] != null) {
        session[obj.push].forEach(function (el) {
          sdp.push(makeLine(type, obj, el));
        });
      }
    });
  });

  // then for each media line, follow the innerOrder
  session.media.forEach(function (mLine) {
    sdp.push(makeLine('m', grammar.m[0], mLine));

    innerOrder.forEach(function (type) {
      grammar[type].forEach(function (obj) {
        if (obj.name in mLine && mLine[obj.name] != null) {
          sdp.push(makeLine(type, obj, mLine));
        }
        else if (obj.push in mLine && mLine[obj.push] != null) {
          mLine[obj.push].forEach(function (el) {
            sdp.push(makeLine(type, obj, el));
          });
        }
      });
    });
  });

  return sdp.join('\r\n') + '\r\n';
};

},{"./grammar":69}],73:[function(require,module,exports){
/* Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var transform = require('sdp-transform');
var transformUtils = require('./transform-utils');
var parseSsrcs = transformUtils.parseSsrcs;
var writeSsrcs = transformUtils.writeSsrcs;

//region Constants

var DEFAULT_NUM_OF_LAYERS = 3;

//endregion

//region Ctor

function Simulcast(options) {

    this.options = options ? options : {};

    if (!this.options.numOfLayers) {
        this.options.numOfLayers = DEFAULT_NUM_OF_LAYERS;
    }

    this.layers = [];
}

//endregion

//region Stateless private utility functions

/**
 * Returns a random integer between min (included) and max (excluded)
 * Using Math.round() gives a non-uniform distribution!
 * @returns {number}
 */
function generateSSRC() {
    var min = 0, max = 0xffffffff;
    return Math.floor(Math.random() * (max - min)) + min;
};

function processVideo(session, action) {
    if (session == null || !Array.isArray(session.media)) {
        return;
    }

    session.media.forEach(function (mLine) {
        if (mLine.type === 'video') {
            action(mLine);
        }
    });
}

function validateDescription(desc)
{
    return desc && desc != null
        && desc.type && desc.type != ''
        && desc.sdp && desc.sdp != '';
}

function explodeRemoteSimulcast(mLine) {

    if (!mLine || !Array.isArray(mLine.ssrcGroups)) {
        return;
    }

    var sources = parseSsrcs(mLine);
    var order = [];

    // Find the SIM group and explode its sources.
    var j = mLine.ssrcGroups.length;
    while (j--) {

        if (mLine.ssrcGroups[j].semantics !== 'SIM') {
            continue;
        }

        var simulcastSsrcs = mLine.ssrcGroups[j].ssrcs.split(' ');

        for (var i = 0; i < simulcastSsrcs.length; i++) {

            var ssrc = simulcastSsrcs[i];
            order.push(ssrc);

            var parts = sources[ssrc].msid.split(' ');
            sources[ssrc].msid = [parts[0], '/', i, ' ', parts[1], '/', i].join('');
            sources[ssrc].cname = [sources[ssrc].cname, '/', i].join('');

            // Remove all the groups that this SSRC participates in.
            mLine.ssrcGroups.forEach(function (relatedGroup) {
                if (relatedGroup.semantics === 'SIM') {
                    return;
                }

                var relatedSsrcs = relatedGroup.ssrcs.split(' ');
                if (relatedSsrcs.indexOf(ssrc) === -1) {
                    return;
                }

                // Nuke all the related SSRCs.
                relatedSsrcs.forEach(function (relatedSSRC) {
                    sources[relatedSSRC].msid = sources[ssrc].msid;
                    sources[relatedSSRC].cname = sources[ssrc].cname;
                    if (relatedSSRC !== ssrc) {
                        order.push(relatedSSRC);
                    }
                });

                // Schedule the related group for nuking.
            })
        }

        mLine.ssrcs = writeSsrcs(sources, order);
        mLine.ssrcGroups.splice(j, 1);
    };
}

function implodeRemoteSimulcast(mLine) {

    if (!mLine || !Array.isArray(mLine.ssrcGroups)) {
        console.info('Halt: There are no SSRC groups in the remote ' +
                'description.');
        return;
    }

    var sources = parseSsrcs(mLine);

    // Find the SIM group and nuke it.
    mLine.ssrcGroups.forEach(function (simulcastGroup) {
        if (simulcastGroup.semantics !== 'SIM') {
            return;
        }

        console.info("Imploding SIM group: " + simulcastGroup.ssrcs);
        // Schedule the SIM group for nuking.
        simulcastGroup.nuke = true;

        var simulcastSsrcs = simulcastGroup.ssrcs.split(' ');

        // Nuke all the higher layer SSRCs.
        for (var i = 1; i < simulcastSsrcs.length; i++) {

            var ssrc = simulcastSsrcs[i];
            delete sources[ssrc];

            // Remove all the groups that this SSRC participates in.
            mLine.ssrcGroups.forEach(function (relatedGroup) {
                if (relatedGroup.semantics === 'SIM') {
                    return;
                }

                var relatedSsrcs = relatedGroup.ssrcs.split(' ');
                if (relatedSsrcs.indexOf(ssrc) === -1) {
                    return;
                }

                // Nuke all the related SSRCs.
                relatedSsrcs.forEach(function (relatedSSRC) {
                    delete sources[relatedSSRC];
                });

                // Schedule the related group for nuking.
                relatedGroup.nuke = true;
            })
        }

        return;
    });

    mLine.ssrcs = writeSsrcs(sources);

    // Nuke all the scheduled groups.
    var i = mLine.ssrcGroups.length;
    while (i--) {
        if (mLine.ssrcGroups[i].nuke) {
            mLine.ssrcGroups.splice(i, 1);
        }
    }
}

function removeGoogConference(mLine) {
    if (!mLine || !Array.isArray(mLine.invalid)) {
        return;
    }

    var i = mLine.invalid.length;
    while (i--) {
        if (mLine.invalid[i].value == 'x-google-flag:conference') {
            mLine.invalid.splice(i, 1);
        }
    }
}

function assertGoogConference(mLine) {
    if (!mLine) {
        return;
    }

    if (!Array.isArray(mLine.invalid)) {
        mLine.invalid = [];
    }

    if (!mLine.invalid.some(
            function (i) { return i.value === 'x-google-flag:conference' })) {
        mLine.invalid.push({'value': 'x-google-flag:conference'});
    }
}

//endregion

//region "Private" functions

/**
 *
 * @param mLine
 * @private
 */
Simulcast.prototype._maybeInitializeLayers = function(mLine) {

    if (!mLine || mLine.type !== 'video') {
        return;
    }

    var sources = parseSsrcs(mLine);

    if (Object.keys(sources).length === 0) {

        // no sources, disable simulcast.
        if (this.layers.length !== 0) {
            this.layers = [];
        }

        return;
    }

    // find the base layer (we'll reuse its msid and cname).
    var baseLayerSSRC = Object.keys(sources)[0];
    var baseLayer = sources[baseLayerSSRC];

    // todo(gp) handle screen sharing.

    // check if base CNAME has changed and reinitialise layers.
    if (this.layers.length > 0
        && sources[baseLayerSSRC].cname !== this.layers[0].cname) {
        this.layers = [];
    }

    // (re)initialise layers
    if (this.layers.length < 1) {

        // first push the base layer.
        this.layers.push({
            ssrc: baseLayerSSRC,
            msid: baseLayer.msid,
            cname: baseLayer.cname
        });

        var rtx = false; // RFC 4588
        if (Array.isArray(mLine.rtp)) {
            rtx = mLine.rtp.some(
                function (rtpmap) { return rtpmap.codec === 'rtx'; });
        }

        if (rtx) {
            this.layers[0].rtx = generateSSRC();
        }

        // now push additional layers.
        for (var i = 1; i < Math.max(1, this.options.numOfLayers); i++) {

            var layer = { ssrc: generateSSRC() };
            if (rtx) {
                layer.rtx = generateSSRC();
            }

            this.layers.push(layer);
        }
    }
};

/**
 *
 * @param mLine
 * @private
 */
Simulcast.prototype._restoreSimulcastView = function(mLine) {
    if (mLine && mLine.type === 'video' && this.layers.length !== 0) {

        var sources = {};

        var msid = this.layers[0].msid;
        var cname = this.layers[0].cname;
        var simulcastSsrcs = [];
        var ssrcGroups = [];

        for (var i = 0; i < this.layers.length; i++) {
            var layer = this.layers[i];

            sources[layer.ssrc] = { msid: msid, cname: cname };
            simulcastSsrcs.push(layer.ssrc);

            if (layer.rtx) {

                sources[layer.rtx] = {
                    msid: msid,
                    cname: cname
                }

                ssrcGroups.push({
                    semantics: 'FID',
                    ssrcs: [layer.ssrc, layer.rtx].join(' ')
                });
            }
        }

        ssrcGroups.push({
            semantics: 'SIM',
            ssrcs: simulcastSsrcs.join(' ')
        });

        mLine.ssrcGroups = ssrcGroups;
        mLine.ssrcs = writeSsrcs(sources);
    }
}

//endregion

//region "Public" functions

Simulcast.prototype.isSupported = function () {
    return window.chrome;

    // TODO this needs improvements. For example I doubt that Chrome in Android
    // has simulcast support. Also, only recent versions of Chromium have native
    // simulcast support.
}

/**
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
Simulcast.prototype.mungeRemoteDescription = function (desc) {

    if (!validateDescription(desc)) {
        return desc;
    }

    var session = transform.parse(desc.sdp);

    var self = this;
    processVideo(session, function (mLine) {

        // Handle simulcast reception.
        if (self.options.explodeRemoteSimulcast) {
            explodeRemoteSimulcast(mLine);
        } else {
            implodeRemoteSimulcast(mLine);
        }

        // If native simulcast is enabled, we must append the x-goog-conference
        // attribute to the SDP.
        if (self.layers.length < 1) {
            removeGoogConference(mLine);
        } else {
            assertGoogConference(mLine);
        }
    });

    return new RTCSessionDescription({
        type: desc.type,
        sdp: transform.write(session)
    });
};

/**
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
Simulcast.prototype.mungeLocalDescription = function (desc) {

    if (!validateDescription(desc) || !this.isSupported()) {
        return desc;
    }

    var session = transform.parse(desc.sdp);

    var self = this;
    processVideo(session, function (mLine) {
        // Initialize native simulcast layers, if not already done.
        self._maybeInitializeLayers(mLine);

        // Update the SDP with the simulcast layers.
        self._restoreSimulcastView(mLine);
    });

    return new RTCSessionDescription({
        type: desc.type,
        sdp: transform.write(session)
    });
};

//endregion

module.exports = Simulcast;

},{"./transform-utils":74,"sdp-transform":76}],74:[function(require,module,exports){
/* Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

exports.writeSsrcs = function(sources, order) {
  var ssrcs = [];

  // expand sources to ssrcs
  if (typeof sources !== 'undefined' &&
      Object.keys(sources).length !== 0) {

    if (Array.isArray(order)) {
      for (var i = 0; i < order.length; i++) {
        var ssrc = order[i];
        var source = sources[ssrc];
        Object.keys(source).forEach(function (attribute) {
          ssrcs.push({
            id: ssrc,
            attribute: attribute,
            value: source[attribute]
          });
        });
      }
    } else {
      Object.keys(sources).forEach(function (ssrc) {
        var source = sources[ssrc];
        Object.keys(source).forEach(function (attribute) {
          ssrcs.push({
            id: ssrc,
            attribute: attribute,
            value: source[attribute]
          });
        });
      });
    }
  }

  return ssrcs;
};

exports.parseSsrcs = function (mLine) {
  var sources = {};
  // group sources attributes by ssrc.
  if (typeof mLine.ssrcs !== 'undefined' && Array.isArray(mLine.ssrcs)) {
    mLine.ssrcs.forEach(function (ssrc) {
      if (!sources[ssrc.id])
        sources[ssrc.id] = {};
      sources[ssrc.id][ssrc.attribute] = ssrc.value;
    });
  }
  return sources;
};


},{}],75:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"dup":69}],76:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"./parser":77,"./writer":78,"dup":70}],77:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"./grammar":75,"dup":71}],78:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"./grammar":75,"dup":72}],79:[function(require,module,exports){
var MediaStreamType = {
    VIDEO_TYPE: "Video",

    AUDIO_TYPE: "Audio"
};
module.exports = MediaStreamType;
},{}],80:[function(require,module,exports){
var RTCEvents = {
    RTC_READY: "rtc.ready",
    DATA_CHANNEL_OPEN: "rtc.data_channel_open",
    LASTN_CHANGED: "rtc.lastn_changed",
    DOMINANTSPEAKER_CHANGED: "rtc.dominantspeaker_changed",
    LASTN_ENDPOINT_CHANGED: "rtc.lastn_endpoint_changed",
    AVAILABLE_DEVICES_CHANGED: "rtc.available_devices_changed"
};

module.exports = RTCEvents;
},{}],81:[function(require,module,exports){
var Resolutions = {
    "1080": {
        width: 1920,
        height: 1080,
        order: 7
    },
    "fullhd": {
        width: 1920,
        height: 1080,
        order: 7
    },
    "720": {
        width: 1280,
        height: 720,
        order: 6
    },
    "hd": {
        width: 1280,
        height: 720,
        order: 6
    },
    "960": {
        width: 960,
        height: 720,
        order: 5
    },
    "640": {
        width: 640,
        height: 480,
        order: 4
    },
    "vga": {
        width: 640,
        height: 480,
        order: 4
    },
    "360": {
        width: 640,
        height: 360,
        order: 3
    },
    "320": {
        width: 320,
        height: 240,
        order: 2
    },
    "180": {
        width: 320,
        height: 180,
        order: 1
    }
};
module.exports = Resolutions;
},{}],82:[function(require,module,exports){
var XMPPEvents = {
    // Designates an event indicating that the connection to the XMPP server
    // failed.
    CONNECTION_FAILED: "xmpp.connection.failed",
    // Designates an event indicating that the media (ICE) connection was
    // interrupted. This should go to the RTC module.
    CONNECTION_INTERRUPTED: "xmpp.connection.interrupted",
    // Designates an event indicating that the media (ICE) connection was
    // restored. This should go to the RTC module.
    CONNECTION_RESTORED: "xmpp.connection.restored",
    // Designates an event indicating that an offer (e.g. Jingle
    // session-initiate) was received.
    CALL_INCOMING: "xmpp.callincoming.jingle",
    // Designates an event indicating that we were kicked from the XMPP MUC.
    KICKED: "xmpp.kicked",
    // Designates an event indicating that the userID for a specific JID has
    // changed.
    // Note: currently this event fires every time we receive presence from
    // someone (regardless of whether or not the "userID" changed).
    USER_ID_CHANGED: "xmpp.user_id_changed",
    // Designates an event indicating that we have joined the XMPP MUC.
    MUC_JOINED: "xmpp.muc_joined",
    // Designates an event indicating that a participant joined the XMPP MUC.
    MUC_MEMBER_JOINED: "xmpp.muc_member_joined",
    // Designates an event indicating that a participant left the XMPP MUC.
    MUC_MEMBER_LEFT: "xmpp.muc_member_left",
    // Designates an event indicating that the MUC role of a participant has
    // changed.
    MUC_ROLE_CHANGED: "xmpp.muc_role_changed",
    // Designates an event indicating that the XMPP MUC was destroyed.
    MUC_DESTROYED: "xmpp.muc_destroyed",
    // Designates an event indicating that the display name of a participant
    // has changed.
    DISPLAY_NAME_CHANGED: "xmpp.display_name_changed",
    // Designates an event indicating that we received statistics from a
    // participant in the MUC.
    REMOTE_STATS: "xmpp.remote_stats",
    // Designates an event indicating that our role in the XMPP MUC has changed.
    LOCAL_ROLE_CHANGED: "xmpp.localrole_changed",
    // Designates an event indicating that the subject of the XMPP MUC has
    // changed.
    SUBJECT_CHANGED: "xmpp.subject_changed",
    // Designates an event indicating that an XMPP message in the MUC was
    // received.
    MESSAGE_RECEIVED: "xmpp.message_received",
    // Designates an event indicating that we sent an XMPP message to the MUC.
    SENDING_CHAT_MESSAGE: "xmpp.sending_chat_message",
    // Designates an event indicating that the video type (e.g. 'camera' or
    // 'screen') for a participant has changed.
    // Note: currently this event fires every time we receive presence from
    // someone (regardless of whether or not the "video type" changed).
    PARTICIPANT_VIDEO_TYPE_CHANGED: "xmpp.video_type",
    // Designates an event indicating that a participant in the XMPP MUC has
    // advertised that they have audio muted (or unmuted).
    PARTICIPANT_AUDIO_MUTED: "xmpp.audio_muted",
    // Designates an event indicating that a participant in the XMPP MUC has
    // advertised that they have video muted (or unmuted).
    PARTICIPANT_VIDEO_MUTED: "xmpp.video_muted",
    // Designates an event indicating that the focus has asked us to mute our
    // audio.
    AUDIO_MUTED_BY_FOCUS: "xmpp.audio_muted_by_focus",
    // Designates an event indicating that we should join the conference with
    // audio and/or video muted.
    START_MUTED_FROM_FOCUS: "xmpp.start_muted_from_focus",
    // Designates an event indicating that a remote participant's available
    // devices (whether he supports a audio and/or video) changed.
    // Note: currently this event fires every time we receive presence from
    // someone (regardless of whether or not the devices changed).
    DEVICE_AVAILABLE: "xmpp.device_available",


    PEERCONNECTION_READY: "xmpp.peerconnection_ready",
    CONFERENCE_SETUP_FAILED: "xmpp.conference_setup_failed",
    PASSWORD_REQUIRED: "xmpp.password_required",
    AUTHENTICATION_REQUIRED: "xmpp.authentication_required",
    CHAT_ERROR_RECEIVED: "xmpp.chat_error_received",
    ETHERPAD: "xmpp.etherpad",
    BRIDGE_DOWN: "xmpp.bridge_down",
    PRESENCE_STATUS: "xmpp.presence_status",
    RESERVATION_ERROR: "xmpp.room_reservation_error",
    DISPOSE_CONFERENCE: "xmpp.dispose_conference",
    GRACEFUL_SHUTDOWN: "xmpp.graceful_shutdown",
    // TODO: only used in a hack, should probably be removed.
    SET_LOCAL_DESCRIPTION_ERROR: 'xmpp.set_local_description_error',
    // TODO: only used in a hack, should probably be removed.
    SET_REMOTE_DESCRIPTION_ERROR: 'xmpp.set_remote_description_error',
    // TODO: only used in a hack, should probably be removed.
    CREATE_ANSWER_ERROR: 'xmpp.create_answer_error',
    JINGLE_FATAL_ERROR: 'xmpp.jingle_fatal_error',
    PROMPT_FOR_LOGIN: 'xmpp.prompt_for_login',
    FOCUS_DISCONNECTED: 'xmpp.focus_disconnected',
    ROOM_JOIN_ERROR: 'xmpp.room_join_error',
    ROOM_CONNECT_ERROR: 'xmpp.room_connect_error',
    // xmpp is connected and obtained user media
    READY_TO_JOIN: 'xmpp.ready_to_join',
    FOCUS_LEFT: "xmpp.focus_left",
    REMOTE_STREAM_RECEIVED: "xmpp.remote_stream_received",
    /**
     * Indicates that recording state changed.
     */
    RECORDING_STATE_CHANGED: "xmpp.recordingStateChanged",
    /**
     * Indicates that phone number changed.
     */
    PHONE_NUMBER_CHANGED: "conference.phoneNumberChanged"
};
module.exports = XMPPEvents;

},{}],83:[function(require,module,exports){
var AuthenticationEvents = {
    /**
     * Event callback arguments:
     * function(authenticationEnabled, userIdentity)
     * authenticationEnabled - indicates whether authentication has been enabled
     *                         in this session
     * userIdentity - if user has been logged in then it contains user name. If
     *                contains 'null' or 'undefined' then user is not logged in.
     */
    IDENTITY_UPDATED: "authentication.identity_updated"
};
module.exports = AuthenticationEvents;

},{}],84:[function(require,module,exports){
var DesktopSharingEventTypes = {
    /**
     * An event which indicates that the jidesha extension for Firefox is
     * needed to proceed with screen sharing, and that it is not installed.
     */
    FIREFOX_EXTENSION_NEEDED: "ds.firefox_extension_needed"
};

module.exports = DesktopSharingEventTypes;

},{}],85:[function(require,module,exports){
module.exports = {
    /**
     * An event carrying connection statistics.
     */
    CONNECTION_STATS: "statistics.connectionstats",
    /**
     * FIXME: needs documentation.
     */
    AUDIO_LEVEL: "statistics.audioLevel",
    /**
     * FIXME: needs documentation.
     */
    STOP: "statistics.stop"
};

},{}],86:[function(require,module,exports){
var Constants = {
    LOCAL_JID: 'local'
};
module.exports = Constants;
},{}],87:[function(require,module,exports){
arguments[4][82][0].apply(exports,arguments)
},{"dup":82}]},{},[7])(7)
});