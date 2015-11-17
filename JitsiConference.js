
var logger = require("jitsi-meet-logger").getLogger(__filename);
var RTC = require("./modules/RTC/RTC");
var XMPPEvents = require("./service/xmpp/XMPPEvents");
var StreamEventTypes = require("./service/RTC/StreamEventTypes");
var RTCEvents = require("./service/RTC/RTCEvents");
var EventEmitter = require("events");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiParticipant = require("./JitsiParticipant");
var Statistics = require("./modules/statistics/statistics");

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
    this.room = this.xmpp.createRoom(this.options.name, null, null, this.options.config);
    this.room.updateDeviceAvailability(RTC.getDeviceAvailability());
    this.rtc = new RTC(this.room, options);
    if(!options.config.disableAudioLevels)
        this.statistics = new Statistics();
    setupListeners(this);
    this.participants = {};
    this.lastActiveSpeaker = null;
}

/**
 * Joins the conference.
 * @param password {string} the password
 */
JitsiConference.prototype.join = function (password) {
    if(this.room)
        this.room.join(password, this.connection.tokenPassword);
}

/**
 * Leaves the conference.
 */
JitsiConference.prototype.leave = function () {
    if(this.xmpp)
        this.xmpp.leaveRoom(this.room.roomjid);
    this.room = null;
}

/**
 * Returns the local tracks.
 */
JitsiConference.prototype.getLocalTracks = function () {
    if(this.rtc)
        return this.rtc.localStreams;
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
}

/**
 * Removes event listener
 * @param eventId the event ID.
 * @param [handler] optional, the specific handler to unbind
 *
 * Note: consider adding eventing functionality by extending an EventEmitter impl, instead of rolling ourselves
 */
JitsiConference.prototype.off = function (eventId, handler) {
    if(this.eventEmitter)
        this.eventEmitter.removeListener(eventId, listener);
}

// Common aliases for event emitter
JitsiConference.prototype.addEventListener = JitsiConference.prototype.on
JitsiConference.prototype.removeEventListener = JitsiConference.prototype.off

/**
 * Receives notifications from another participants for commands / custom events(send by sendPresenceCommand method).
 * @param command {String} the name of the command
 * @param handler {Function} handler for the command
 */
 JitsiConference.prototype.addCommandListener = function (command, handler) {
    if(this.room)
        this.room.addPresenceListener(command, handler);
 }

/**
  * Removes command  listener
  * @param command {String}  the name of the command
  */
 JitsiConference.prototype.removeCommandListener = function (command) {
    if(this.room)
        this.room.removePresenceListener(command);
 }

/**
 * Sends text message to the other participants in the conference
 * @param message the text message.
 */
JitsiConference.prototype.sendTextMessage = function (message) {
    if(this.room)
        this.room.sendMessage(message);
}

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
}

/**
 * Send presence command one time.
 * @param name the name of the command.
 * @param values Object with keys and values that will be send.
 **/
JitsiConference.prototype.sendCommandOnce = function (name, values) {
    this.sendCommand(name, values);
    this.removeCommand(name);
}

/**
 * Send presence command.
 * @param name the name of the command.
 * @param values Object with keys and values that will be send.
 * @param persistent if false the command will be sent only one time
 **/
JitsiConference.prototype.removeCommand = function (name) {
    if(this.room)
        this.room.removeFromPresence(name);
}

/**
 * Sets the display name for this conference.
 * @param name the display name to set
 */
JitsiConference.prototype.setDisplayName = function(name) {
    if(this.room){
        this.room.addToPresence("nick", {attributes: {xmlns: 'http://jabber.org/protocol/nick'}, value: name});
        this.room.sendPresence();
    }
}

/**
 * Adds JitsiLocalTrack object to the conference.
 * @param track the JitsiLocalTrack object.
 */
JitsiConference.prototype.addTrack = function (track) {
    this.rtc.addLocalStream(track);
    this.room.addStream(track.getOriginalStream(), function () {});
}

/**
 * Removes JitsiLocalTrack object to the conference.
 * @param track the JitsiLocalTrack object.
 */
JitsiConference.prototype.removeTrack = function (track) {
    this.room.removeStream(track.getOriginalStream());
    this.rtc.removeLocalStream(track);
}

/**
 * Elects the participant with the given id to be the selected participant or the speaker.
 * @param id the identifier of the participant
 */
JitsiConference.prototype.selectParticipant = function(participantId) {
    if (this.rtc) {
        this.rtc.selectedEndpoint(participantId);
    }
}

/**
 *
 * @param id the identifier of the participant
 */
JitsiConference.prototype.pinParticipant = function(participantId) {
    if(this.rtc)
        this.rtc.pinEndpoint(participantId);
}

/**
 * Returns the list of participants for this conference.
 * @return Object a list of participant identifiers containing all conference participants.
 */
JitsiConference.prototype.getParticipants = function() {
    return this.participants;
}

/**
 * @returns {JitsiParticipant} the participant in this conference with the specified id (or
 * null if there isn't one).
 * @param id the id of the participant.
 */
JitsiConference.prototype.getParticipantById = function(id) {
    if(this.participants)
        return this.participants[id];
    return null;
}

JitsiConference.prototype.onMemberJoined = function (jid, email, nick) {
    if(this.eventEmitter)
        this.eventEmitter.emit(JitsiConferenceEvents.USER_JOINED, Strophe.getResourceFromJid(jid));
//    this.participants[jid] = new JitsiParticipant();
}

/**
 * Returns the local user's ID
 * @return {string} local user's ID
 */
JitsiConference.prototype.myUserId = function () {
    return (this.room && this.room.myroomjid)? Strophe.getResourceFromJid(this.room.myroomjid) : null;
}

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
        conference.rtc.createRemoteStream.bind(conference.rtc));
    conference.rtc.addListener(StreamEventTypes.EVENT_TYPE_REMOTE_CREATED, function (stream) {
        conference.eventEmitter.emit(JitsiConferenceEvents.TRACK_ADDED, stream);
    });
    conference.rtc.addListener(StreamEventTypes.EVENT_TYPE_REMOTE_ENDED, function (stream) {
        conference.eventEmitter.emit(JitsiConferenceEvents.TRACK_REMOVED, stream);
    });
    conference.rtc.addListener(StreamEventTypes.EVENT_TYPE_LOCAL_ENDED, function (stream) {
        conference.eventEmitter.emit(JitsiConferenceEvents.TRACK_REMOVED, stream);
        conference.removeTrack(stream);
    });
    conference.rtc.addListener(StreamEventTypes.TRACK_MUTE_CHANGED, function (track) {
        conference.eventEmitter.emit(JitsiConferenceEvents.TRACK_MUTE_CHANGED, track);
    });
    conference.room.addListener(XMPPEvents.MUC_JOINED, function () {
        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_JOINED);
    });
//    FIXME
//    conference.room.addListener(XMPPEvents.MUC_JOINED, function () {
//        conference.eventEmitter.emit(JitsiConferenceEvents.CONFERENCE_LEFT);
//    });
    conference.rtc.addListener(RTCEvents.DOMINANTSPEAKER_CHANGED, function (id) {
        if(conference.lastActiveSpeaker !== id && conference.room
            && conference.myUserId() !== id) {
            conference.lastActiveSpeaker = id;
            conference.eventEmitter.emit(JitsiConferenceEvents.ACTIVE_SPEAKER_CHANGED, id);
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

    conference.room.addListener(XMPPEvents.MUC_MEMBER_JOINED, conference.onMemberJoined.bind(conference));
    conference.room.addListener(XMPPEvents.MUC_MEMBER_LEFT,function (jid) {
        conference.eventEmitter.emit(JitsiConferenceEvents.USER_LEFT, Strophe.getResourceFromJid(jid));
    });

    conference.room.addListener(XMPPEvents.DISPLAY_NAME_CHANGED, function (from, displayName) {
        conference.eventEmitter.emit(JitsiConferenceEvents.DISPLAY_NAME_CHANGED,
            Strophe.getResourceFromJid(from), displayName);
    });

    if(conference.statistics) {
        conference.statistics.addAudioLevelListener(function (ssrc, level) {
            var userId = null;
            if (ssrc === Statistics.LOCAL_JID) {
                userId = conference.myUserId();
            } else {
                var jid = conference.room.getJidBySSRC(ssrc);
                if (!jid)
                    return;

                userId = Strophe.getResourceFromJid(jid);
            }
            conference.eventEmitter.emit(JitsiConferenceEvents.TRACK_AUDIO_LEVEL_CHANGED,
                userId, level);
        });
        conference.rtc.addListener(StreamEventTypes.EVENT_TYPE_LOCAL_CREATED, function (stream) {
            conference.statistics.startLocalStats(stream);
        });
        conference.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE,
            function () {
                conference.statistics.dispose();
            });
        RTC.addListener(RTCEvents.AVAILABLE_DEVICES_CHANGED, function (devices) {
            conference.room.updateDeviceAvailability(devices);
        });
        RTC.addListener(StreamEventTypes.TRACK_MUTE_CHANGED, function (track) {
            conference.eventEmitter.emit(JitsiConferenceEvents.TRACK_MUTE_CHANGED, track);
        });
    }
}


module.exports = JitsiConference;
