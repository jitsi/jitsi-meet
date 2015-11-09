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
