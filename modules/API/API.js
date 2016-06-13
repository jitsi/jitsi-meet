/* global APP */
/**
 * Implements API class that communicates with external api class
 * and provides interface to access Jitsi Meet features by external
 * applications that embed Jitsi Meet
 */

 import postis from 'postis';

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

/**
 * Object that will execute sendMessage
 */
let target = window.opener ? window.opener : window.parent;

/**
 * Array of functions that are going to receive the objects passed to this
 * window
 */
let messageListeners = [];

/**
 * Current status (enabled/disabled) of Postis.
 */
let enablePostis = false;

/**
 * Current status (enabled/disabled) of Post Message API.
 */
let enablePostMessage = false;

function initCommands() {
    commands = {
        displayName: APP.UI.inputDisplayNameHandler,
        toggleAudio: APP.conference.toggleAudioMuted,
        toggleVideo: APP.conference.toggleVideoMuted,
        toggleFilmStrip: APP.UI.toggleFilmStrip,
        toggleChat: APP.UI.toggleChat,
        toggleContactList: APP.UI.toggleContactList
    };
}


/**
 * Maps the supported events and their status
 * (true it the event is enabled and false if it is disabled)
 * @type {{
 *              incomingMessage: boolean,
 *              outgoingMessage: boolean,
 *              displayNameChange: boolean,
 *              participantJoined: boolean,
 *              participantLeft: boolean
 *      }}
 */
const events = {
    incomingMessage: false,
    outgoingMessage:false,
    displayNameChange: false,
    participantJoined: false,
    participantLeft: false
};

/**
 * Processes commands from external application.
 * @param message the object with the command
 */
function processCommand(message) {
    if (message.action != "execute") {
        console.error("Unknown action of the message");
        return;
    }
    for (var key in message) {
        if(commands[key])
            commands[key].apply(null, message[key]);
    }
}

/**
 * Processes events objects from external applications
 * @param event the event
 */
function processEvent(event) {
    if (!event.action) {
        console.error("Event with no action is received.");
        return;
    }

    var i = 0;
    switch(event.action) {
        case "add":
            for (; i < event.events.length; i++) {
                events[event.events[i]] = true;
            }
            break;
        case "remove":
            for (; i < event.events.length; i++) {
                events[event.events[i]] = false;
            }
            break;
        default:
            console.error("Unknown action for event.");
    }
}

/**
 * Processes a message event from the external application
 * @param event the message event
 */
function processMessage(event) {
    var message;
    try {
        message = JSON.parse(event.data);
    } catch (e) {
        console.error("Cannot parse data", event.data);
        return;
    }

    switch (message.type) {
        case "command":
            processCommand(message);
            break;
        case "event":
            processEvent(message);
            break;
        default:
            console.warn("Unknown message type");
    }
}

/**
 * Sends message to the external application.
 * @param object {object} the object that will be sent as JSON string
 */
function sendMessage(object) {
    if(enablePostMessage)
        target.postMessage(JSON.stringify(object), "*");
}

/**
 * Check whether the API should be enabled or not.
 * @returns {boolean}
 */
function isEnabled () {
    let hash = location.hash;
    return !!(hash && hash.indexOf("external=true") > -1 && window.postMessage);
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
    if (isEventEnabled(name) && enablePostMessage) {
        sendMessage({
            type: "event",
            action: "result",
            event: name,
            result: object
        });
    }
}

export default {
    /**
     * Initializes the APIConnector. Setups message event listeners that will
     * receive information from external applications that embed Jitsi Meet.
     * It also sends a message to the external application that APIConnector
     * is initialized.
     * @param options {object}
     * @param enablePostis {boolean} if true the postis npm
     * package for comminication with the parent window will be enabled.
     * @param enablePostMessage {boolean} if true the postMessageAPI for
     * comminication with the parent window will be enabled.
     */
    init: function (options = {}) {
        options.enablePostMessage = options.enablePostMessage || isEnabled();
        if (!options.enablePostis &&
            !options.enablePostMessage) {
            return;
        }
        enablePostis = options.enablePostis;
        enablePostMessage = options.enablePostMessage;

        if(enablePostMessage) {
            initCommands();
            if (window.addEventListener) {
                window.addEventListener('message', processMessage, false);
            } else {
                window.attachEvent('onmessage', processMessage);
            }
            sendMessage({type: "system", loaded: true});
        }

        if(enablePostis) {
            this.postis = postis({window: target});
        }
    },

    /**
     * Notify external application (if API is enabled) that message was sent.
     * @param {string} body message body
     */
    notifySendingChatMessage (body) {
        triggerEvent("outgoingMessage", {"message": body});
    },

    /**
     * Sends message to the external application.
     * @param options {object}
     * @param method {string}
     * @param params {object} the object that will be sent as JSON string
     */
    sendPostisMessage(options) {
        if(enablePostis)
            this.postis.send(options);
    },

    /**
     * Adds listener for Postis messages.
     * @param method {string} postis mehtod
     * @param listener {function}
     */
    addPostisMessageListener (method, listener) {
        if(enablePostis)
            this.postis.listen(method, listener);
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
            "incomingMessage",
            {"from": id, "nick": nick, "message": body, "stamp": ts}
        );
    },

    /**
     * Notify external application (if API is enabled) that
     * user joined the conference.
     * @param {string} id user id
     */
    notifyUserJoined (id) {
        triggerEvent("participantJoined", {id});
    },

    /**
     * Notify external application (if API is enabled) that
     * user left the conference.
     * @param {string} id user id
     */
    notifyUserLeft (id) {
        triggerEvent("participantLeft", {id});
    },

    /**
     * Notify external application (if API is enabled) that
     * user changed their nickname.
     * @param {string} id user id
     * @param {string} displayName user nickname
     */
    notifyDisplayNameChanged (id, displayName) {
        triggerEvent("displayNameChange", {id, displayname: displayName});
    },

    /**
     * Removes the listeners.
     */
    dispose: function () {
        if (enablePostMessage) {
            if (window.removeEventListener) {
                window.removeEventListener("message", processMessage, false);
            } else {
                window.detachEvent('onmessage', processMessage);
            }
        }
        if(enablePostis)
            this.postis.destroy();
    }
};
