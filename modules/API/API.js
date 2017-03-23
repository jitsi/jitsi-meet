/* global APP, getConfigParamsFromUrl */

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
        "display-name":
            APP.conference.changeLocalDisplayName.bind(APP.conference),
        "toggle-audio": APP.conference.toggleAudioMuted.bind(APP.conference),
        "toggle-video": APP.conference.toggleVideoMuted.bind(APP.conference),
        "toggle-film-strip": APP.UI.toggleFilmStrip,
        "toggle-chat": APP.UI.toggleChat,
        "toggle-contact-list": APP.UI.toggleContactList,
        "toggle-share-screen":
            APP.conference.toggleScreenSharing.bind(APP.conference),
        "video-hangup": () => APP.conference.hangup(),
        "email": APP.conference.changeLocalEmail,
        "avatar-url": APP.conference.changeLocalAvatarUrl,
        "remote-control-event": event =>
            APP.remoteControl.onRemoteControlAPIEvent(event)
    };
    Object.keys(commands).forEach(function (key) {
        postis.listen(key, args => commands[key](...args));
    });
}

/**
 * Sends message to the external application.
 * @param message {object}
 * @param method {string}
 * @param params {object} the object that will be sent as JSON string
 */
function sendMessage(message) {
    if(enabled) {
        postis.send(message);
    }
}

/**
 * Check whether the API should be enabled or not.
 * @returns {boolean}
 */
function shouldBeEnabled () {
    return (typeof jitsi_meet_external_api_id === "number");
}

/**
 * Sends event object to the external application that has been subscribed
 * for that event.
 * @param name the name event
 * @param object data associated with the event
 */
function triggerEvent (name, object) {
    if(enabled) {
        sendMessage({method: name, params: object});
    }
}

class API {
    /**
     * Constructs new instance
     * @constructor
     */
    constructor() { }

    /**
     * Initializes the APIConnector. Setups message event listeners that will
     * receive information from external applications that embed Jitsi Meet.
     * It also sends a message to the external application that APIConnector
     * is initialized.
     * @param options {object}
     * @param forceEnable {boolean} if true the module will be enabled.
     */
    init (options = {}) {
        if(!shouldBeEnabled() && !options.forceEnable)
            return;

        enabled = true;

        if(!postis) {
            this._initPostis();
        }
    }

    /**
     * initializes postis library.
     * @private
     */
    _initPostis() {
        let postisOptions = {
            window: target
        };
        if(typeof jitsi_meet_external_api_id === "number")
            postisOptions.scope
                = "jitsi_meet_external_api_" + jitsi_meet_external_api_id;
        postis = postisInit(postisOptions);
        initCommands();
    }

    /**
     * Notify external application (if API is enabled) that message was sent.
     * @param {string} body message body
     */
    notifySendingChatMessage (body) {
        triggerEvent("outgoing-message", {"message": body});
    }

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
    }

    /**
     * Notify external application (if API is enabled) that
     * user joined the conference.
     * @param {string} id user id
     */
    notifyUserJoined (id) {
        triggerEvent("participant-joined", {id});
    }

    /**
     * Notify external application (if API is enabled) that
     * user left the conference.
     * @param {string} id user id
     */
    notifyUserLeft (id) {
        triggerEvent("participant-left", {id});
    }

    /**
     * Notify external application (if API is enabled) that
     * user changed their nickname.
     * @param {string} id user id
     * @param {string} displayName user nickname
     */
    notifyDisplayNameChanged (id, displayName) {
        triggerEvent("display-name-change", {id, displayname: displayName});
    }

    /**
     * Notify external application (if API is enabled) that
     * user changed their nickname.
     * @param {string} id user id
     * @param {string} displayName user nickname
     */
    notifyConferenceJoined (room) {
        triggerEvent("video-conference-joined", {roomName: room});
    }

    /**
     * Notify external application (if API is enabled) that
     * user changed their nickname.
     * @param {string} id user id
     * @param {string} displayName user nickname
     */
    notifyConferenceLeft (room) {
        triggerEvent("video-conference-left", {roomName: room});
    }

    /**
     * Notify external application (if API is enabled) that
     * we are ready to be closed.
     */
    notifyReadyToClose () {
        triggerEvent("video-ready-to-close", {});
    }

    /**
     * Sends remote control event.
     * @param {RemoteControlEvent} event the remote control event.
     */
    sendRemoteControlEvent(event) {
        sendMessage({method: "remote-control-event", params: event});
    }

    /**
     * Removes the listeners.
     */
    dispose () {
        if(enabled)
            postis.destroy();
    }
}

export default new API();
