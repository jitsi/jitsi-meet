var RTC = require("./modules/RTC/RTC");
var XMPPEvents = require("./service/xmpp/XMPPEvents");
var StreamEventTypes = require("./service/RTC/StreamEventTypes");
var RTCEvents = require("./service/RTC/RTCEvents");
var EventEmitter = require("events");
var JitsiConferenceEvents = require("./JitsiConferenceEvents");
var JitsiParticipant = require("./JitsiParticipant");

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
    this.options = options;
    this.connection = this.options.connection;
    this.xmpp = this.connection.xmpp;
    this.eventEmitter = new EventEmitter();
    this.room = this.xmpp.createRoom(this.options.name, null, null, this.options.config);
    this.rtc = new RTC(this.room, options);
    setupListeners(this);
    this.participants = {};
    this.lastActiveSpeaker = null;
}

/**
 * Joins the conference.
 * @param password {string} the password
 */
JitsiConference.prototype.join = function (password) {
    this.room.join(password);
}

/**
 * Leaves the conference.
 */
JitsiConference.prototype.leave = function () {
    this.xmpp.leaveRoom(this.room.roomjid);
    this.room = null;
}

/**
 * Creates the media tracks and returns them trough the callback.
 * @param options Object with properties / settings specifying the tracks which should be created.
 * should be created or some additional configurations about resolution for example.
 * @returns {Promise.<{Array.<JitsiTrack>}, JitsiConferenceError>} A promise that returns an array of created JitsiTracks if resolved,
 *     or a JitsiConferenceError if rejected.
 */
JitsiConference.prototype.createLocalTracks = function (options) {
    return this.rtc.obtainAudioAndVideoPermissions(options || {});
}

/**
 * Returns the local tracks.
 */
JitsiConference.prototype.getLocalTracks = function () {
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
     this.room.addPresenceListener(command, handler);
 }

/**
  * Removes command  listener
  * @param command {String}  the name of the command
  */
 JitsiConference.prototype.removeCommandListener = function (command) {
    this.room.removePresenceListener(command);
 }

/**
 * Sends text message to the other participants in the conference
 * @param message the text message.
 */
JitsiConference.prototype.sendTextMessage = function (message) {
    this.room.sendMessage(message);
}

/**
 * Send presence command.
 * @param name the name of the command.
 * @param values Object with keys and values that will be send.
 **/
JitsiConference.prototype.sendCommand = function (name, values) {
    this.room.addToPresence(name, values);
    this.room.sendPresence();
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
    this.room.removeFromPresence(name);
}

/**
 * Sets the display name for this conference.
 * @param name the display name to set
 */
JitsiConference.prototype.setDisplayName = function(name) {
    this.room.addToPresence("nick", {attributes: {xmlns: 'http://jabber.org/protocol/nick'}, value: name});
}

/**
 * Elects the participant with the given id to be the selected participant or the speaker.
 * @param id the identifier of the participant
 */
JitsiConference.prototype.selectParticipant = function(participantId) {
    this.rtc.selectedEndpoint(participantId);
}

/**
 *
 * @param id the identifier of the participant
 */
JitsiConference.prototype.pinParticipant = function(participantId) {
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
    return this.participants[id];
}

JitsiConference.prototype.onMemberJoined = function (jid, email, nick) {
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
    conference.xmpp.addListener(XMPPEvents.CALL_INCOMING,
        conference.rtc.onIncommingCall.bind(conference.rtc));
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
}


module.exports = JitsiConference;
