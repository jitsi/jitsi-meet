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
