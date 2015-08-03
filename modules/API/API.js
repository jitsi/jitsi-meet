/* global APP */
/**
 * Implements API class that communicates with external api class
 * and provides interface to access Jitsi Meet features by external
 * applications that embed Jitsi Meet
 */

var XMPPEvents = require("../../service/xmpp/XMPPEvents");

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
        toggleAudio: APP.UI.toggleAudio,
        toggleVideo: APP.UI.toggleVideo,
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
var events = {
    incomingMessage: false,
    outgoingMessage:false,
    displayNameChange: false,
    participantJoined: false,
    participantLeft: false
};

var displayName = {};

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

function setupListeners() {
    APP.xmpp.addListener(XMPPEvents.MUC_MEMBER_JOINED, function (from) {
        API.triggerEvent("participantJoined", {jid: from});
    });
    APP.xmpp.addListener(XMPPEvents.MESSAGE_RECEIVED, function (from, nick, txt, myjid, stamp) {
        if (from != myjid)
            API.triggerEvent("incomingMessage",
                {"from": from, "nick": nick, "message": txt, "stamp": stamp});
    });
    APP.xmpp.addListener(XMPPEvents.MUC_MEMBER_LEFT, function (jid) {
        API.triggerEvent("participantLeft", {jid: jid});
    });
    APP.xmpp.addListener(XMPPEvents.DISPLAY_NAME_CHANGED, function (jid, newDisplayName) {
        var name = displayName[jid];
        if(!name || name != newDisplayName) {
            API.triggerEvent("displayNameChange", {jid: jid, displayname: newDisplayName});
            displayName[jid] = newDisplayName;
        }
    });
    APP.xmpp.addListener(XMPPEvents.SENDING_CHAT_MESSAGE, function (body) {
        APP.API.triggerEvent("outgoingMessage", {"message": body});
    });
}

var API = {
    /**
     * Check whether the API should be enabled or not.
     * @returns {boolean}
     */
    isEnabled: function () {
        var hash = location.hash;
        if (hash && hash.indexOf("external") > -1 && window.postMessage)
            return true;
        return false;
    },
    /**
     * Initializes the APIConnector. Setups message event listeners that will
     * receive information from external applications that embed Jitsi Meet.
     * It also sends a message to the external application that APIConnector
     * is initialized.
     */
    init: function () {
        initCommands();
        if (window.addEventListener) {
            window.addEventListener('message',
                processMessage, false);
        }
        else {
            window.attachEvent('onmessage', processMessage);
        }
        sendMessage({type: "system", loaded: true});
        setupListeners();
    },
    /**
     * Checks whether the event is enabled ot not.
     * @param name the name of the event.
     * @returns {*}
     */
    isEventEnabled: function (name) {
        return events[name];
    },

    /**
     * Sends event object to the external application that has been subscribed
     * for that event.
     * @param name the name event
     * @param object data associated with the event
     */
    triggerEvent: function (name, object) {
        if(this.isEnabled() && this.isEventEnabled(name))
            sendMessage({
                type: "event", action: "result", event: name, result: object});
    },

    /**
     * Removes the listeners.
     */
    dispose: function () {
        if(window.removeEventListener) {
            window.removeEventListener("message",
                processMessage, false);
        }
        else {
            window.detachEvent('onmessage', processMessage);
        }
    }
};

module.exports = API;