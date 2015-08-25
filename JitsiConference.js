var xmpp = require("./modules/xmpp/xmpp");
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
}

/**
 * Joins the conference.
 */
JitsiConference.prototype.join = function () {
    xmpp.joinRoom(this.options.name, null, null);
}

/**
 * Leaves the conference.
 */
JitsiConference.prototype.leave = function () {
    xmpp.l
}

/**
 * Creates the media tracks and returns them via the callback.
 * @param options Object with properties / settings specifying the tracks which should be created.
 * should be created or some additional configurations about resolution for example.
 * @returns {Promise.<{Array.<JitsiTrack>}, JitsiConferenceError>} A promise that returns an array of created JitsiTracks if resolved,
 *     or a JitsiConferenceError if rejected.
 */
JitsiConference.prototype.createLocalTracks = function (options) {

}

/**
 * Returns the local tracks.
 */
JitsiConference.prototype.getLocalTracks = function () {

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

}

/**
 * Removes event listener
 * @param eventId the event ID.
 * @param [handler] optional, the specific handler to unbind
 *
 * Note: consider adding eventing functionality by extending an EventEmitter impl, instead of rolling ourselves
 */
JitsiConference.prototype.off = function (eventId, handler) {

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

 }

/**
  * Removes command  listener
  * @param command {String}  the name of the command
  */
 JitsiConference.prototype.removeCommandListener = function (command) {

 }

/**
 * Sends text message to the other participants in the conference
 * @param message the text message.
 */
JitsiConference.prototype.sendTextMessage = function (message) {

}

/**
 * Send presence command.
 * @param name the name of the command.
 * @param values Object with keys and values that will be send.
 * @param persistent if false the command will be sent only one time
 * @param successCallback will be called when the command is successfully send.
 * @param errorCallback will be called when the command is not sent successfully.
 * @returns {Promise.<{void}, JitsiConferenceError>} A promise that returns an array of created streams if resolved,
 *     or an JitsiConferenceError if rejected.
 */
JitsiConference.prototype.sendCommand = function (name, values, persistent) {

}

/**
 * Sets the display name for this conference.
 * @param name the display name to set
 */
JitsiConference.prototype.setDisplayName = function(name) {

}

/**
 * Elects the participant with the given id to be the selected participant or the speaker.
 * @param id the identifier of the participant
 */
JitsiConference.prototype.selectParticipant = function(participantId) {

}

/**
 * Returns the list of participants for this conference.
 * @return Object a list of participant identifiers containing all conference participants.
 */
JitsiConference.prototype.getParticipants = function() {

}


module.exports = JitsiConference;
