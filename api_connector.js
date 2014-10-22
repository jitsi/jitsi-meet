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
        filmStrip: BottomToolbar.toggleFilmStrip
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
        APIConnector.sendMessage({loaded: true});
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
        for(var key in message)
        {
            if(commands[key])
                commands[key].apply(null, message[key]);
        }

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