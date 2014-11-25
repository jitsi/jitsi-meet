/**
 * Implements API class that communicates with external api class
 * and provides interface to access Jitsi Meet features by external
 * applications that embed Jitsi Meet
 */
var APIConnector = (function () {

    function APIConnector() { }

    /**
     * List of the available commands.
     * @type {{
     *              displayName: inputDisplayNameHandler,
     *              muteAudio: toggleAudio,
     *              muteVideo: toggleVideo,
     *              filmStrip: toggleFilmStrip
     *          }}
     */
    var commands =
    {
        displayName: VideoLayout.inputDisplayNameHandler,
        muteAudio: toggleAudio,
        muteVideo: toggleVideo,
        toggleFilmStrip: BottomToolbar.toggleFilmStrip,
        toggleChat: BottomToolbar.toggleChat,
        toggleContactList: BottomToolbar.toggleContactList
    };


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
    var events =
    {
        incomingMessage: false,
        outgoingMessage:false,
        displayNameChange: false,
        participantJoined: false,
        participantLeft: false
    };

    /**
     * Check whether the API should be enabled or not.
     * @returns {boolean}
     */
    APIConnector.isEnabled = function () {
        var hash = location.hash;
        if(hash && hash.indexOf("external") > -1 && window.postMessage)
            return true;
        return false;
    };

    /**
     * Initializes the APIConnector. Setups message event listeners that will
     * receive information from external applications that embed Jitsi Meet.
     * It also sends a message to the external application that APIConnector
     * is initialized.
     */
    APIConnector.init = function () {
        if (window.addEventListener)
        {
            window.addEventListener('message',
                APIConnector.processMessage, false);
        }
        else
        {
            window.attachEvent('onmessage', APIConnector.processMessage);
        }
        APIConnector.sendMessage({type: "system", loaded: true});
    };

    /**
     * Sends message to the external application.
     * @param object
     */
    APIConnector.sendMessage = function (object) {
        window.parent.postMessage(JSON.stringify(object), "*");
    };

    /**
     * Processes a message event from the external application
     * @param event the message event
     */
    APIConnector.processMessage = function(event)
    {
        var message;
        try {
            message = JSON.parse(event.data);
        } catch (e) {}

        if(!message.type)
            return;
        switch (message.type)
        {
            case "command":
                APIConnector.processCommand(message);
                break;
            case "event":
                APIConnector.processEvent(message);
                break;
            default:
                console.error("Unknown type of the message");
                return;
        }

    };

    /**
     * Processes commands from external applicaiton.
     * @param message the object with the command
     */
    APIConnector.processCommand = function (message)
    {
        if(message.action != "execute")
        {
            console.error("Unknown action of the message");
            return;
        }
        for(var key in message)
        {
            if(commands[key])
                commands[key].apply(null, message[key]);
        }
    };

    /**
     * Processes events objects from external applications
     * @param event the event
     */
    APIConnector.processEvent = function (event) {
        if(!event.action)
        {
            console.error("Event with no action is received.");
            return;
        }

        switch(event.action)
        {
            case "add":
                for(var i = 0; i < event.events.length; i++)
                {
                    events[event.events[i]] = true;
                }
                break;
            case "remove":
                for(var i = 0; i < event.events.length; i++)
                {
                    events[event.events[i]] = false;
                }
                break;
            default:
                console.error("Unknown action for event.");
        }

    };

    /**
     * Checks whether the event is enabled ot not.
     * @param name the name of the event.
     * @returns {*}
     */
    APIConnector.isEventEnabled = function (name) {
        return events[name];
    };

    /**
     * Sends event object to the external application that has been subscribed
     * for that event.
     * @param name the name event
     * @param object data associated with the event
     */
    APIConnector.triggerEvent = function (name, object) {
        APIConnector.sendMessage({
            type: "event", action: "result", event: name, result: object});
    };

    /**
     * Removes the listeners.
     */
    APIConnector.dispose = function () {
        if(window.removeEventListener)
        {
            window.removeEventListener("message",
                APIConnector.processMessage, false);
        }
        else
        {
            window.detachEvent('onmessage', APIConnector.processMessage);
        }

    };

    return APIConnector;
})();