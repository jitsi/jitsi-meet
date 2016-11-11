/* global APP, getConfigParamsFromUrl */
const logger = require("jitsi-meet-logger").getLogger(__filename);

/**
 * Implements API class that communicates with external api class
 * and provides interface to access Jitsi Meet features by external
 * applications that embed Jitsi Meet
 */

import postisInit from 'postis';

/**
 * List of the available commands.
 * @type {{
 *              displayName: inputDisplayNameHandler,
 *              toggleAudio: toggleAudio,
 *              toggleVideo: toggleVideo,
 *              toggleFilmStrip: toggleFilmStrip,
 *              toggleChat: toggleChat,
 *              toggleContactList: toggleContactList
 *          }}
 */
let commands = {};

let hashParams = getConfigParamsFromUrl();

/**
 * JitsiMeetExternalAPI id - unique for a webpage.
 */
let jitsi_meet_external_api_id = hashParams.jitsi_meet_external_api_id;

/**
 * Object that will execute sendMessage
 */
let target = window.opener ? window.opener : window.parent;

/**
 * Postis instance. Used to communicate with the external application.
 */
let postis;

/**
 * Current status (enabled/disabled) of API.
 */
let enabled = false;

function initCommands() {
    commands = {
        "display-name": APP.UI.inputDisplayNameHandler,
        "toggle-audio": APP.conference.toggleAudioMuted.bind(APP.conference),
        "toggle-video": APP.conference.toggleVideoMuted.bind(APP.conference),
        "toggle-film-strip": APP.UI.toggleFilmStrip,
        "toggle-chat": APP.UI.toggleChat,
        "toggle-contact-list": APP.UI.toggleContactList,
        "toggle-share-screen":
            APP.conference.toggleScreenSharing.bind(APP.conference),
        "video-hangup": () => APP.conference.hangup()
    };
    Object.keys(commands).forEach(function (key) {
        postis.listen(key, commands[key]);
    });
}


/**
 * Maps the supported events and their status
 * (true it the event is enabled and false if it is disabled)
 * @type {{
 *              incoming-message: boolean,
 *              outgoing-message: boolean,
 *              display-name-change: boolean,
 *              participant-left: boolean,
 *              participant-joined: boolean,
 *              video-conference-left: boolean,
 *              video-conference-joined: boolean
 *      }}
 */
const events = {
    "incoming-message": false,
    "outgoing-message":false,
    "display-name-change": false,
    "participant-joined": false,
    "participant-left": false,
    "video-conference-joined": false,
    "video-conference-left": false,
    "video-ready-to-close": false
};

/**
 * Sends message to the external application.
 * @param message {object}
 * @param method {string}
 * @param params {object} the object that will be sent as JSON string
 */
function sendMessage(message) {
    if(enabled)
        postis.send(message);
}

/**
 * Check whether the API should be enabled or not.
 * @returns {boolean}
 */
function isEnabled () {
    return (typeof jitsi_meet_external_api_id === "number");
}

/**
 * Checks whether the event is enabled ot not.
 * @param name the name of the event.
 * @returns {*}
 */
function isEventEnabled (name) {
    return events[name];
}

/**
 * Sends event object to the external application that has been subscribed
 * for that event.
 * @param name the name event
 * @param object data associated with the event
 */
function triggerEvent (name, object) {
    if(isEventEnabled(name))
        sendMessage({method: name, params: object});
}

/**
 * Handles system messages. (for example: enable/disable events)
 * @param message {object} the message
 */
function onSystemMessage(message) {
    switch (message.type) {
        case "eventStatus":
            if(!message.name || !message.value) {
                logger.warn("Unknown system message format", message);
                break;
            }
            events[message.name] = message.value;
            break;
        default:
            logger.warn("Unknown system message type", message);
    }
}

export default {
    /**
     * Initializes the APIConnector. Setups message event listeners that will
     * receive information from external applications that embed Jitsi Meet.
     * It also sends a message to the external application that APIConnector
     * is initialized.
     * @param options {object}
     * @param forceEnable {boolean} if true the module will be enabled.
     * @param enabledEvents {array} array of events that should be enabled.
     */
    init (options = {}) {
        if(!isEnabled() && !options.forceEnable)
            return;

        enabled = true;
        if(options.enabledEvents)
            options.enabledEvents.forEach(function (eventName) {
                events[eventName] = true;
            });
        let postisOptions = {
            window: target
        };
        if(typeof jitsi_meet_external_api_id === "number")
            postisOptions.scope
                = "jitsi_meet_external_api_" + jitsi_meet_external_api_id;
        postis = postisInit(postisOptions);
        postis.listen("jitsiSystemMessage", onSystemMessage);
        initCommands();
    },

    /**
     * Notify external application (if API is enabled) that message was sent.
     * @param {string} body message body
     */
    notifySendingChatMessage (body) {
        triggerEvent("outgoing-message", {"message": body});
    },

    /**
     * Notify external application (if API is enabled) that
     * message was received.
     * @param {string} id user id
     * @param {string} nick user nickname
     * @param {string} body message body
     * @param {number} ts message creation timestamp
     */
    notifyReceivedChatMessage (id, nick, body, ts) {
        if (APP.conference.isLocalId(id)) {
            return;
        }

        triggerEvent(
            "incoming-message",
            {"from": id, "nick": nick, "message": body, "stamp": ts}
        );
    },

    /**
     * Notify external application (if API is enabled) that
     * user joined the conference.
     * @param {string} id user id
     */
    notifyUserJoined (id) {
        triggerEvent("participant-joined", {id});
    },

    /**
     * Notify external application (if API is enabled) that
     * user left the conference.
     * @param {string} id user id
     */
    notifyUserLeft (id) {
        triggerEvent("participant-left", {id});
    },

    /**
     * Notify external application (if API is enabled) that
     * user changed their nickname.
     * @param {string} id user id
     * @param {string} displayName user nickname
     */
    notifyDisplayNameChanged (id, displayName) {
        triggerEvent("display-name-change", {id, displayname: displayName});
    },

    /**
     * Notify external application (if API is enabled) that
     * user changed their nickname.
     * @param {string} id user id
     * @param {string} displayName user nickname
     */
    notifyConferenceJoined (room) {
        triggerEvent("video-conference-joined", {roomName: room});
    },

    /**
     * Notify external application (if API is enabled) that
     * user changed their nickname.
     * @param {string} id user id
     * @param {string} displayName user nickname
     */
    notifyConferenceLeft (room) {
        triggerEvent("video-conference-left", {roomName: room});
    },

    /**
     * Notify external application (if API is enabled) that
     * we are ready to be closed.
     */
    notifyReadyToClose () {
        triggerEvent("video-ready-to-close", {});
    },

    /**
     * Removes the listeners.
     */
    dispose: function () {
        if(enabled)
            postis.destroy();
    }
};
