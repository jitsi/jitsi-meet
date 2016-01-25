/* global APP */
/**
 * Implements API class that communicates with external api class
 * and provides interface to access Jitsi Meet features by external
 * applications that embed Jitsi Meet
 */

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
var commands = {};

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
 * Sends message to the external application.
 * @param object
 */
function sendMessage(object) {
    window.parent.postMessage(JSON.stringify(object), "*");
}

/**
 * Processes a message event from the external application
 * @param event the message event
 */
function processMessage(event) {
    var message;
    try {
        message = JSON.parse(event.data);
    } catch (e) {}

    if(!message.type)
        return;
    switch (message.type) {
        case "command":
            processCommand(message);
            break;
        case "event":
            processEvent(message);
            break;
        default:
            console.error("Unknown type of the message");
            return;
    }
}

/**
 * Check whether the API should be enabled or not.
 * @returns {boolean}
 */
function isEnabled () {
    let hash = location.hash;
    return hash && hash.indexOf("external") > -1 && window.postMessage;
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
    if (isEnabled() && isEventEnabled(name)) {
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
     */
    init: function () {
        if (!isEnabled()) {
            return;
        }
        initCommands();
        if (window.addEventListener) {
            window.addEventListener('message', processMessage, false);
        } else {
            window.attachEvent('onmessage', processMessage);
        }
        sendMessage({type: "system", loaded: true});
    },

    /**
     * Notify external application (if API is enabled) that message was sent.
     * @param {string} body message body
     */
    notifySendingChatMessage (body) {
        triggerEvent("outgoingMessage", {"message": body});
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
        if (!isEnabled()) {
            return;
        }

        if (window.removeEventListener) {
            window.removeEventListener("message", processMessage, false);
        } else {
            window.detachEvent('onmessage', processMessage);
        }
    }
};
