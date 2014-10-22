/**
 * Implements API class that embeds Jitsi Meet in external applications.
 */
var JitsiMeetExternalAPI = (function()
{
    /**
     * The minimum width for the Jitsi Meet frame
     * @type {number}
     */
    var MIN_WIDTH = 790;

    /**
     * The minimum height for the Jitsi Meet frame
     * @type {number}
     */
    var MIN_HEIGHT = 300;

    /**
     * Constructs new API instance. Creates iframe element that loads
     * Jitsi Meet.
     * @param domain the domain name of the server that hosts the conference
     * @param room_name the name of the room to join
     * @param width width of the iframe
     * @param height height of the iframe
     * @param parent_node the node that will contain the iframe
     * @constructor
     */
    function JitsiMeetExternalAPI(domain, room_name, width, height, parent_node)
    {
        this.parentNode = null;
        if(parent_node)
        {
            this.parentNode = parent_node;
        }
        else
        {
            var scriptTag = document.scripts[document.scripts.length - 1];
            this.parentNode = scriptTag.parentNode;
        }

        this.iframeHolder =
            this.parentNode.appendChild(document.createElement("div"));
        this.iframeHolder.id = "jitsiConference" + JitsiMeetExternalAPI.id;
        if(width < MIN_WIDTH)
            width = MIN_WIDTH;
        if(height < MIN_HEIGHT)
            height = MIN_HEIGHT;
        this.iframeHolder.style.width = width + "px";
        this.iframeHolder.style.height = height + "px";
        this.frameName = "jitsiConferenceFrame" + JitsiMeetExternalAPI.id;
        this.url = "https://" + domain + "/";
        if(room_name)
            this.url += room_name;
        this.url += "#external";
        JitsiMeetExternalAPI.id++;

        this.frame = document.createElement("iframe");
        this.frame.src = this.url;
        this.frame.name = this.frameName;
        this.frame.width = "100%";
        this.frame.height = "100%";
        this.frame = this.iframeHolder.appendChild(this.frame);

        this.frameLoaded = false;
        this.initialCommands = [];
        this.initListeners();
    }

    /**
     * Last id of api object
     * @type {number}
     */
    JitsiMeetExternalAPI.id = 0;

    /**
     * Sends the passed object to Jitsi Meet
     * @param object the object to be sent
     */
    JitsiMeetExternalAPI.prototype.sendMessage = function(object)
    {
        if(this.frameLoaded)
        {
            this.frame.contentWindow.postMessage(
                JSON.stringify(object), this.frame.src);
        }
        else
        {
            this.initialCommands.push(object);
        }

    };

    /**
     * Executes command. The available commands are:
     * displayName - sets the display name of the local participant to the value
     * passed in the arguments array.
     * muteAudio - mutes / unmutes audio with no arguments
     * muteVideo - mutes / unmutes video with no arguments
     * filmStrip - hides / shows the film strip with no arguments
     * If the command doesn't require any arguments the parameter should be set
     * to empty array or it may be omitted.
     * @param name the name of the command
     * @param arguments array of arguments
     */
    JitsiMeetExternalAPI.prototype.executeCommand = function(name,
                                                             argumentsList)
    {
        var argumentsArray = argumentsList;
        if(!argumentsArray)
            argumentsArray = [];
        var object = {};
        object[name] = argumentsArray;
        this.sendMessage(object);
    };

    /**
     * Executes commands. The available commands are:
     * displayName - sets the display name of the local participant to the value
     * passed in the arguments array.
     * muteAudio - mutes / unmutes audio with no arguments
     * muteVideo - mutes / unmutes video with no arguments
     * filmStrip - hides / shows the film strip with no arguments
     * @param object the object with commands to be executed. The keys of the
     * object are the commands that will be executed and the values are the
     * arguments for the command.
     */
    JitsiMeetExternalAPI.prototype.executeCommands = function (object) {
        this.sendMessage(object);
    };

    /**
     * Processes message events sent from Jitsi Meet
     * @param event the event
     */
    JitsiMeetExternalAPI.prototype.processMessage = function(event)
    {
        var message;
        try {
            message = JSON.parse(event.data);
        } catch (e) {}
        if(message.loaded)
        {
            this.onFrameLoaded();
        }

    };

    /**
     * That method is called when the Jitsi Meet is loaded. Executes saved
     * commands that are send before the frame was loaded.
     */
    JitsiMeetExternalAPI.prototype.onFrameLoaded = function () {
        this.frameLoaded = true;
        for (var i = 0; i < this.initialCommands.length; i++)
        {
            this.sendMessage(this.initialCommands[i]);
        }
        this.initialCommands = null;
    };

    /**
     * Setups the listener for message events from Jitsi Meet.
     */
    JitsiMeetExternalAPI.prototype.initListeners = function () {
        var self = this;
        this.eventListener = function (event) {
            self.processMessage(event);
        };
        if (window.addEventListener)
        {
            window.addEventListener('message',
                this.eventListener, false);
        }
        else
        {
            window.attachEvent('onmessage', this.eventListener);
        }
    };

    /**
     * Removes the listeners and removes the Jitsi Meet frame.
     */
    JitsiMeetExternalAPI.prototype.dispose = function () {
        if (window.removeEventListener)
        {
            window.removeEventListener('message',
                this.eventListener, false);
        }
        else
        {
            window.detachEvent('onmessage',
                this.eventListener);
        }
        this.iframeHolder.parentNode.removeChild(this.iframeHolder);
    };

    return JitsiMeetExternalAPI;

})();