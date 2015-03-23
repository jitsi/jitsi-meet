!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.APP=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* jshint -W117 */
/* application specific logic */

var APP =
{
    init: function () {
        this.UI = require("./modules/UI/UI");
        this.API = require("./modules/API/API");
        this.connectionquality = require("./modules/connectionquality/connectionquality");
        this.statistics = require("./modules/statistics/statistics");
        this.RTC = require("./modules/RTC/RTC");
        this.simulcast = require("./modules/simulcast/simulcast");
        this.desktopsharing = require("./modules/desktopsharing/desktopsharing");
        this.xmpp = require("./modules/xmpp/xmpp");
        this.keyboardshortcut = require("./modules/keyboardshortcut/keyboardshortcut");
        this.translation = require("./modules/translation/translation");
        this.settings = require("./modules/settings/Settings");
    }
};

function init() {

    APP.RTC.start();
    APP.xmpp.start();
    APP.statistics.start();
    APP.connectionquality.init();

    // Set default desktop sharing method
    APP.desktopsharing.init();

    APP.keyboardshortcut.init();
}


$(document).ready(function () {

    APP.init();

    APP.translation.init();

    if(APP.API.isEnabled())
        APP.API.init();

    APP.UI.start(init);

});

$(window).bind('beforeunload', function () {
    if(APP.API.isEnabled())
        APP.API.dispose();
});

module.exports = APP;


},{"./modules/API/API":2,"./modules/RTC/RTC":6,"./modules/UI/UI":8,"./modules/connectionquality/connectionquality":35,"./modules/desktopsharing/desktopsharing":36,"./modules/keyboardshortcut/keyboardshortcut":37,"./modules/settings/Settings":38,"./modules/simulcast/simulcast":43,"./modules/statistics/statistics":46,"./modules/translation/translation":47,"./modules/xmpp/xmpp":61}],2:[function(require,module,exports){
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
 *              muteAudio: toggleAudio,
 *              muteVideo: toggleVideo,
 *              filmStrip: toggleFilmStrip
 *          }}
 */
var commands =
{
    displayName: APP.UI.inputDisplayNameHandler,
    muteAudio: APP.UI.toggleAudio,
    muteVideo: APP.UI.toggleVideo,
    toggleFilmStrip: APP.UI.toggleFilmStrip,
    toggleChat: APP.UI.toggleChat,
    toggleContactList: APP.UI.toggleContactList
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

var displayName = {};

/**
 * Processes commands from external applicaiton.
 * @param message the object with the command
 */
function processCommand(message)
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
}

/**
 * Processes events objects from external applications
 * @param event the event
 */
function processEvent(event) {
    if(!event.action)
    {
        console.error("Event with no action is received.");
        return;
    }

    var i = 0;
    switch(event.action)
    {
        case "add":
            for(; i < event.events.length; i++)
            {
                events[event.events[i]] = true;
            }
            break;
        case "remove":
            for(; i < event.events.length; i++)
            {
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
function processMessage(event)
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
    APP.xmpp.addListener(XMPPEvents.MUC_ENTER, function (from) {
        API.triggerEvent("participantJoined", {jid: from});
    });
    APP.xmpp.addListener(XMPPEvents.MESSAGE_RECEIVED, function (from, nick, txt, myjid) {
        if (from != myjid)
            API.triggerEvent("incomingMessage",
                {"from": from, "nick": nick, "message": txt});
    });
    APP.xmpp.addListener(XMPPEvents.MUC_LEFT, function (jid) {
        API.triggerEvent("participantLeft", {jid: jid});
    });
    APP.xmpp.addListener(XMPPEvents.DISPLAY_NAME_CHANGED, function (jid, newDisplayName) {
        name = displayName[jid];
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
        if(hash && hash.indexOf("external") > -1 && window.postMessage)
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
        if (window.addEventListener)
        {
            window.addEventListener('message',
                processMessage, false);
        }
        else
        {
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
        if(window.removeEventListener)
        {
            window.removeEventListener("message",
                processMessage, false);
        }
        else
        {
            window.detachEvent('onmessage', processMessage);
        }

    }


};

module.exports = API;
},{"../../service/xmpp/XMPPEvents":98}],3:[function(require,module,exports){
/* global Strophe, focusedVideoSrc*/

// cache datachannels to avoid garbage collection
// https://code.google.com/p/chromium/issues/detail?id=405545
var RTCEvents = require("../../service/RTC/RTCEvents");

var _dataChannels = [];
var eventEmitter = null;




var DataChannels =
{

    /**
     * Callback triggered by PeerConnection when new data channel is opened
     * on the bridge.
     * @param event the event info object.
     */

    onDataChannel: function (event)
    {
        var dataChannel = event.channel;

        dataChannel.onopen = function () {
            console.info("Data channel opened by the Videobridge!", dataChannel);

            // Code sample for sending string and/or binary data
            // Sends String message to the bridge
            //dataChannel.send("Hello bridge!");
            // Sends 12 bytes binary message to the bridge
            //dataChannel.send(new ArrayBuffer(12));

            // when the data channel becomes available, tell the bridge about video
            // selections so that it can do adaptive simulcast,
            // we want the notification to trigger even if userJid is undefined,
            // or null.
            var userJid = APP.UI.getLargeVideoState().userResourceJid;
            // we want the notification to trigger even if userJid is undefined,
            // or null.
            onSelectedEndpointChanged(userJid);
        };

        dataChannel.onerror = function (error) {
            console.error("Data Channel Error:", error, dataChannel);
        };

        dataChannel.onmessage = function (event) {
            var data = event.data;
            // JSON
            var obj;

            try {
                obj = JSON.parse(data);
            }
            catch (e) {
                console.error(
                    "Failed to parse data channel message as JSON: ",
                    data,
                    dataChannel);
            }
            if (('undefined' !== typeof(obj)) && (null !== obj)) {
                var colibriClass = obj.colibriClass;

                if ("DominantSpeakerEndpointChangeEvent" === colibriClass) {
                    // Endpoint ID from the Videobridge.
                    var dominantSpeakerEndpoint = obj.dominantSpeakerEndpoint;

                    console.info(
                        "Data channel new dominant speaker event: ",
                        dominantSpeakerEndpoint);
                    eventEmitter.emit(RTCEvents.DOMINANTSPEAKER_CHANGED, dominantSpeakerEndpoint);
                }
                else if ("InLastNChangeEvent" === colibriClass)
                {
                    var oldValue = obj.oldValue;
                    var newValue = obj.newValue;
                    // Make sure that oldValue and newValue are of type boolean.
                    var type;

                    if ((type = typeof oldValue) !== 'boolean') {
                        if (type === 'string') {
                            oldValue = (oldValue == "true");
                        } else {
                            oldValue = new Boolean(oldValue).valueOf();
                        }
                    }
                    if ((type = typeof newValue) !== 'boolean') {
                        if (type === 'string') {
                            newValue = (newValue == "true");
                        } else {
                            newValue = new Boolean(newValue).valueOf();
                        }
                    }

                    eventEmitter.emit(RTCEvents.LASTN_CHANGED, oldValue, newValue);
                }
                else if ("LastNEndpointsChangeEvent" === colibriClass)
                {
                    // The new/latest list of last-n endpoint IDs.
                    var lastNEndpoints = obj.lastNEndpoints;
                    // The list of endpoint IDs which are entering the list of
                    // last-n at this time i.e. were not in the old list of last-n
                    // endpoint IDs.
                    var endpointsEnteringLastN = obj.endpointsEnteringLastN;
                    var stream = obj.stream;

                    console.log(
                        "Data channel new last-n event: ",
                        lastNEndpoints, endpointsEnteringLastN, obj);
                    eventEmitter.emit(RTCEvents.LASTN_ENDPOINT_CHANGED,
                        lastNEndpoints, endpointsEnteringLastN, obj);
                }
                else if ("SimulcastLayersChangedEvent" === colibriClass)
                {
                    eventEmitter.emit(RTCEvents.SIMULCAST_LAYER_CHANGED,
                        obj.endpointSimulcastLayers);
                }
                else if ("SimulcastLayersChangingEvent" === colibriClass)
                {
                    eventEmitter.emit(RTCEvents.SIMULCAST_LAYER_CHANGING,
                        obj.endpointSimulcastLayers);
                }
                else if ("StartSimulcastLayerEvent" === colibriClass)
                {
                    eventEmitter.emit(RTCEvents.SIMULCAST_START, obj.simulcastLayer);
                }
                else if ("StopSimulcastLayerEvent" === colibriClass)
                {
                    eventEmitter.emit(RTCEvents.SIMULCAST_STOP, obj.simulcastLayer);
                }
                else
                {
                    console.debug("Data channel JSON-formatted message: ", obj);
                }
            }
        };

        dataChannel.onclose = function ()
        {
            console.info("The Data Channel closed", dataChannel);
            var idx = _dataChannels.indexOf(dataChannel);
            if (idx > -1)
                _dataChannels = _dataChannels.splice(idx, 1);
        };
        _dataChannels.push(dataChannel);
    },

    /**
     * Binds "ondatachannel" event listener to given PeerConnection instance.
     * @param peerConnection WebRTC peer connection instance.
     */
    init: function (peerConnection, emitter) {
        if(!config.openSctp)
            return;

        peerConnection.ondatachannel = this.onDataChannel;
        eventEmitter = emitter;

        // Sample code for opening new data channel from Jitsi Meet to the bridge.
        // Although it's not a requirement to open separate channels from both bridge
        // and peer as single channel can be used for sending and receiving data.
        // So either channel opened by the bridge or the one opened here is enough
        // for communication with the bridge.
        /*var dataChannelOptions =
         {
         reliable: true
         };
         var dataChannel
         = peerConnection.createDataChannel("myChannel", dataChannelOptions);

         // Can be used only when is in open state
         dataChannel.onopen = function ()
         {
         dataChannel.send("My channel !!!");
         };
         dataChannel.onmessage = function (event)
         {
         var msgData = event.data;
         console.info("Got My Data Channel Message:", msgData, dataChannel);
         };*/
    },
    handleSelectedEndpointEvent: onSelectedEndpointChanged,
    handlePinnedEndpointEvent: onPinnedEndpointChanged

};

function onSelectedEndpointChanged(userResource)
{
    console.log('selected endpoint changed: ', userResource);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
                console.log('sending selected endpoint changed ' 
                    + 'notification to the bridge: ', userResource);
                dataChannel.send(JSON.stringify({
                    'colibriClass': 'SelectedEndpointChangedEvent',
                    'selectedEndpoint':
                        (!userResource || userResource === null)?
                            null : userResource
                }));

                return true;
            }
        });
    }
}

function onPinnedEndpointChanged(userResource)
{
    console.log('pinned endpoint changed: ', userResource);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
                dataChannel.send(JSON.stringify({
                    'colibriClass': 'PinnedEndpointChangedEvent',
                    'pinnedEndpoint':
                        (!userResource || userResource == null)?
                            null : userResource
                }));

                return true;
            }
        });
    }
}

module.exports = DataChannels;


},{"../../service/RTC/RTCEvents":90}],4:[function(require,module,exports){
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");

function LocalStream(stream, type, eventEmitter, videoType)
{
    this.stream = stream;
    this.eventEmitter = eventEmitter;
    this.type = type;
    this.videoType = videoType;
    var self = this;
    if(type == "audio")
    {
        this.getTracks = function () {
            return self.stream.getAudioTracks();
        };
    }
    else
    {
        this.getTracks = function () {
            return self.stream.getVideoTracks();
        };
    }

    this.stream.onended = function()
    {
        self.streamEnded();
    };
}

LocalStream.prototype.streamEnded = function () {
    this.eventEmitter.emit(StreamEventTypes.EVENT_TYPE_LOCAL_ENDED, this);
}

LocalStream.prototype.getOriginalStream = function()
{
    return this.stream;
}

LocalStream.prototype.isAudioStream = function () {
    return (this.stream.getAudioTracks() && this.stream.getAudioTracks().length > 0);
};

LocalStream.prototype.mute = function()
{
    var ismuted = false;
    var tracks = this.getTracks();

    for (var idx = 0; idx < tracks.length; idx++) {
        ismuted = !tracks[idx].enabled;
        tracks[idx].enabled = ismuted;
    }
    return ismuted;
};

LocalStream.prototype.setMute = function(mute)
{
    var tracks = this.getTracks();

    for (var idx = 0; idx < tracks.length; idx++) {
        tracks[idx].enabled = mute;
    }
};

LocalStream.prototype.isMuted = function () {
    var tracks = [];
    if(this.type == "audio")
    {
        tracks = this.stream.getAudioTracks();
    }
    else
    {
        tracks = this.stream.getVideoTracks();
    }
    for (var idx = 0; idx < tracks.length; idx++) {
        if(tracks[idx].enabled)
            return false;
    }
    return true;
}

LocalStream.prototype.getId = function () {
    return this.stream.getTracks()[0].id;
}



module.exports = LocalStream;

},{"../../service/RTC/StreamEventTypes.js":92}],5:[function(require,module,exports){
////These lines should be uncommented when require works in app.js
var MediaStreamType = require("../../service/RTC/MediaStreamTypes");
var StreamEventType = require("../../service/RTC/StreamEventTypes");

/**
 * Creates a MediaStream object for the given data, session id and ssrc.
 * It is a wrapper class for the MediaStream.
 *
 * @param data the data object from which we obtain the stream,
 * the peerjid, etc.
 * @param sid the session id
 * @param ssrc the ssrc corresponding to this MediaStream
 *
 * @constructor
 */
function MediaStream(data, sid, ssrc, browser, eventEmitter) {

    // XXX(gp) to minimize headaches in the future, we should build our
    // abstractions around tracks and not streams. ORTC is track based API.
    // Mozilla expects m-lines to represent media tracks.
    //
    // Practically, what I'm saying is that we should have a MediaTrack class
    // and not a MediaStream class.
    //
    // Also, we should be able to associate multiple SSRCs with a MediaTrack as
    // a track might have an associated RTX and FEC sources.

    this.sid = sid;
    this.stream = data.stream;
    this.peerjid = data.peerjid;
    this.ssrc = ssrc;
    this.type = (this.stream.getVideoTracks().length > 0)?
        MediaStreamType.VIDEO_TYPE : MediaStreamType.AUDIO_TYPE;
    this.videoType = null;
    this.muted = false;
    this.eventEmitter = eventEmitter;
}


MediaStream.prototype.getOriginalStream = function()
{
    return this.stream;
};

MediaStream.prototype.setMute = function (value)
{
    this.stream.muted = value;
    this.muted = value;
};

MediaStream.prototype.setVideoType = function (value) {
    if(this.videoType === value)
        return;
    this.videoType = value;
    this.eventEmitter.emit(StreamEventType.EVENT_TYPE_REMOTE_CHANGED,
        this.peerjid);
};


module.exports = MediaStream;

},{"../../service/RTC/MediaStreamTypes":88,"../../service/RTC/StreamEventTypes":92}],6:[function(require,module,exports){
var EventEmitter = require("events");
var RTCUtils = require("./RTCUtils.js");
var LocalStream = require("./LocalStream.js");
var DataChannels = require("./DataChannels");
var MediaStream = require("./MediaStream.js");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var MediaStreamType = require("../../service/RTC/MediaStreamTypes");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var UIEvents = require("../../service/UI/UIEvents");

var eventEmitter = new EventEmitter();

var RTC = {
    rtcUtils: null,
    localStreams: [],
    remoteStreams: {},
    localAudio: null,
    localVideo: null,
    addStreamListener: function (listener, eventType) {
        eventEmitter.on(eventType, listener);
    },
    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    },
    removeStreamListener: function (listener, eventType) {
        if(!(eventType instanceof StreamEventTypes))
            throw "Illegal argument";

        eventEmitter.removeListener(eventType, listener);
    },
    createLocalStream: function (stream, type, change, videoType) {

        var localStream =  new LocalStream(stream, type, eventEmitter, videoType);
        //in firefox we have only one stream object
        if(this.localStreams.length == 0 ||
            this.localStreams[0].getOriginalStream() != stream)
            this.localStreams.push(localStream);
        if(type == "audio")
        {
            this.localAudio = localStream;
        }
        else
        {
            this.localVideo = localStream;
        }
        var eventType = StreamEventTypes.EVENT_TYPE_LOCAL_CREATED;
        if(change)
            eventType = StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED;

        eventEmitter.emit(eventType, localStream);
        return localStream;
    },
    removeLocalStream: function (stream) {
        for(var i = 0; i < this.localStreams.length; i++)
        {
            if(this.localStreams[i].getOriginalStream() === stream) {
                delete this.localStreams[i];
                return;
            }
        }
    },
    createRemoteStream: function (data, sid, thessrc) {
        var remoteStream = new MediaStream(data, sid, thessrc,
            this.getBrowserType(), eventEmitter);
        var jid = data.peerjid || APP.xmpp.myJid();
        if(!this.remoteStreams[jid]) {
            this.remoteStreams[jid] = {};
        }
        this.remoteStreams[jid][remoteStream.type]= remoteStream;
        eventEmitter.emit(StreamEventTypes.EVENT_TYPE_REMOTE_CREATED, remoteStream);
        return remoteStream;
    },
    getBrowserType: function () {
        return this.rtcUtils.browser;
    },
    getPCConstraints: function () {
        return this.rtcUtils.pc_constraints;
    },
    getUserMediaWithConstraints:function(um, success_callback,
                                         failure_callback, resolution,
                                         bandwidth, fps, desktopStream)
    {
        return this.rtcUtils.getUserMediaWithConstraints(um, success_callback,
            failure_callback, resolution, bandwidth, fps, desktopStream);
    },
    attachMediaStream:  function (element, stream) {
        this.rtcUtils.attachMediaStream(element, stream);
    },
    getStreamID:  function (stream) {
        return this.rtcUtils.getStreamID(stream);
    },
    getVideoSrc: function (element) {
        return this.rtcUtils.getVideoSrc(element);
    },
    setVideoSrc: function (element, src) {
        this.rtcUtils.setVideoSrc(element, src);
    },
    dispose: function() {
        if (this.rtcUtils) {
            this.rtcUtils = null;
        }
    },
    stop:  function () {
        this.dispose();
    },
    start: function () {
        var self = this;
        APP.desktopsharing.addListener(
            function (stream, isUsingScreenStream, callback) {
                self.changeLocalVideo(stream, isUsingScreenStream, callback);
            }, DesktopSharingEventTypes.NEW_STREAM_CREATED);
        APP.xmpp.addListener(XMPPEvents.CHANGED_STREAMS, function (jid, changedStreams) {
            for(var i = 0; i < changedStreams.length; i++) {
                var type = changedStreams[i].type;
                if (type != "audio") {
                    var peerStreams = self.remoteStreams[jid];
                    if(!peerStreams)
                        continue;
                    var videoStream = peerStreams[MediaStreamType.VIDEO_TYPE];
                    if(!videoStream)
                        continue;
                    videoStream.setVideoType(changedStreams[i].type);
                }
            }
        });
        APP.xmpp.addListener(XMPPEvents.CALL_INCOMING, function(event) {
            DataChannels.init(event.peerconnection, eventEmitter);
        });
        APP.UI.addListener(UIEvents.SELECTED_ENDPOINT,
            DataChannels.handleSelectedEndpointEvent);
        APP.UI.addListener(UIEvents.PINNED_ENDPOINT,
            DataChannels.handlePinnedEndpointEvent);
        this.rtcUtils = new RTCUtils(this);
        this.rtcUtils.obtainAudioAndVideoPermissions();
    },
    muteRemoteVideoStream: function (jid, value) {
        var stream;

        if(this.remoteStreams[jid] &&
            this.remoteStreams[jid][MediaStreamType.VIDEO_TYPE])
        {
            stream = this.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
        }

        if(!stream)
            return false;

        if (value != stream.muted) {
            stream.setMute(value);
            return true;
        }
        return false;
    },
    switchVideoStreams: function (new_stream) {
        this.localVideo.stream = new_stream;

        this.localStreams = [];

        //in firefox we have only one stream object
        if (this.localAudio.getOriginalStream() != new_stream)
            this.localStreams.push(this.localAudio);
        this.localStreams.push(this.localVideo);
    },
    changeLocalVideo: function (stream, isUsingScreenStream, callback) {
        var oldStream = this.localVideo.getOriginalStream();
        var type = (isUsingScreenStream? "screen" : "video");
        this.localVideo = this.createLocalStream(stream, "video", true, type);
        // Stop the stream to trigger onended event for old stream
        oldStream.stop();
        APP.xmpp.switchStreams(stream, oldStream,callback);
    },
    /**
     * Checks if video identified by given src is desktop stream.
     * @param videoSrc eg.
     * blob:https%3A//pawel.jitsi.net/9a46e0bd-131e-4d18-9c14-a9264e8db395
     * @returns {boolean}
     */
    isVideoSrcDesktop: function (jid) {
        if(!jid)
            return false;
        var isDesktop = false;
        var stream = null;
        if (APP.xmpp.myJid() === jid) {
            // local video
            stream = this.localVideo;
        } else {
            var peerStreams = this.remoteStreams[jid];
            if(!peerStreams)
                return false;
            stream = peerStreams[MediaStreamType.VIDEO_TYPE];
        }

        if(stream)
            isDesktop = (stream.videoType === "screen");

        return isDesktop;
    }
};

module.exports = RTC;

},{"../../service/RTC/MediaStreamTypes":88,"../../service/RTC/StreamEventTypes.js":92,"../../service/UI/UIEvents":93,"../../service/desktopsharing/DesktopSharingEventTypes":96,"../../service/xmpp/XMPPEvents":98,"./DataChannels":3,"./LocalStream.js":4,"./MediaStream.js":5,"./RTCUtils.js":7,"events":62}],7:[function(require,module,exports){
var RTCBrowserType = require("../../service/RTC/RTCBrowserType.js");
var Resolutions = require("../../service/RTC/Resolutions");

var currentResolution = null;

function getPreviousResolution(resolution) {
    if(!Resolutions[resolution])
        return null;
    var order = Resolutions[resolution].order;
    var res = null;
    var resName = null;
    for(var i in Resolutions)
    {
        var tmp = Resolutions[i];
        if(res == null || (res.order < tmp.order && tmp.order < order))
        {
            resName = i;
            res = tmp;
        }
    }
    return resName;
}

function setResolutionConstraints(constraints, resolution, isAndroid)
{
    if (resolution && !constraints.video || isAndroid) {
        constraints.video = { mandatory: {}, optional: [] };// same behaviour as true
    }

    if(Resolutions[resolution])
    {
        constraints.video.mandatory.minWidth = Resolutions[resolution].width;
        constraints.video.mandatory.minHeight = Resolutions[resolution].height;
    }
    else
    {
        if (isAndroid) {
            constraints.video.mandatory.minWidth = 320;
            constraints.video.mandatory.minHeight = 240;
            constraints.video.mandatory.maxFrameRate = 15;
        }
    }

    if (constraints.video.mandatory.minWidth)
        constraints.video.mandatory.maxWidth = constraints.video.mandatory.minWidth;
    if (constraints.video.mandatory.minHeight)
        constraints.video.mandatory.maxHeight = constraints.video.mandatory.minHeight;
}

function getConstraints(um, resolution, bandwidth, fps, desktopStream, isAndroid)
{
    var constraints = {audio: false, video: false};

    if (um.indexOf('video') >= 0) {
        constraints.video = { mandatory: {}, optional: [] };// same behaviour as true
    }
    if (um.indexOf('audio') >= 0) {
        constraints.audio = { mandatory: {}, optional: []};// same behaviour as true
    }
    if (um.indexOf('screen') >= 0) {
        constraints.video = {
            mandatory: {
                chromeMediaSource: "screen",
                googLeakyBucket: true,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height,
                maxFrameRate: 3
            },
            optional: []
        };
    }
    if (um.indexOf('desktop') >= 0) {
        constraints.video = {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: desktopStream,
                googLeakyBucket: true,
                maxWidth: window.screen.width,
                maxHeight: window.screen.height,
                maxFrameRate: 3
            },
            optional: []
        };
    }

    if (constraints.audio) {
        // if it is good enough for hangouts...
        constraints.audio.optional.push(
            {googEchoCancellation: true},
            {googAutoGainControl: true},
            {googNoiseSupression: true},
            {googHighpassFilter: true},
            {googNoisesuppression2: true},
            {googEchoCancellation2: true},
            {googAutoGainControl2: true}
        );
    }
    if (constraints.video) {
        constraints.video.optional.push(
            {googNoiseReduction: false} // chrome 37 workaround for issue 3807, reenable in M38
        );
        if (um.indexOf('video') >= 0) {
            constraints.video.optional.push(
                {googLeakyBucket: true}
            );
        }
    }

    if (um.indexOf('video') >= 0) {
        setResolutionConstraints(constraints, resolution, isAndroid);
    }

    if (bandwidth) { // doesn't work currently, see webrtc issue 1846
        if (!constraints.video) constraints.video = {mandatory: {}, optional: []};//same behaviour as true
        constraints.video.optional.push({bandwidth: bandwidth});
    }
    if (fps) { // for some cameras it might be necessary to request 30fps
        // so they choose 30fps mjpg over 10fps yuy2
        if (!constraints.video) constraints.video = {mandatory: {}, optional: []};// same behaviour as true;
        constraints.video.mandatory.minFrameRate = fps;
    }

    return constraints;
}


function RTCUtils(RTCService)
{
    this.service = RTCService;
    if (navigator.mozGetUserMedia) {
        console.log('This appears to be Firefox');
        var version = parseInt(navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1], 10);
        if (version >= 39) {
            this.peerconnection = mozRTCPeerConnection;
            this.browser = RTCBrowserType.RTC_BROWSER_FIREFOX;
            this.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
            this.pc_constraints = {};
            this.attachMediaStream =  function (element, stream) {
                //  srcObject is being standardized and FF will eventually
                //  support that unprefixed. FF also supports the
                //  "element.src = URL.createObjectURL(...)" combo, but that
                //  will be deprecated in favour of srcObject.
                //
                // https://groups.google.com/forum/#!topic/mozilla.dev.media/pKOiioXonJg
                // https://github.com/webrtc/samples/issues/302
                element[0].mozSrcObject = stream;
                element[0].play();
            };
            this.getStreamID =  function (stream) {
                var tracks = stream.getVideoTracks();
                if(!tracks || tracks.length == 0)
                {
                    tracks = stream.getAudioTracks();
                }
                return tracks[0].id.replace(/[\{,\}]/g,"");
            };
            this.getVideoSrc = function (element) {
                return element.mozSrcObject;
            };
            this.setVideoSrc = function (element, src) {
                element.mozSrcObject = src;
            };
            RTCSessionDescription = mozRTCSessionDescription;
            RTCIceCandidate = mozRTCIceCandidate;
        } else {
            window.location.href = 'unsupported_browser.html';
            return;
        }

    } else if (navigator.webkitGetUserMedia) {
        console.log('This appears to be Chrome');
        this.peerconnection = webkitRTCPeerConnection;
        this.browser = RTCBrowserType.RTC_BROWSER_CHROME;
        this.getUserMedia = navigator.webkitGetUserMedia.bind(navigator);
        this.attachMediaStream = function (element, stream) {
            element.attr('src', webkitURL.createObjectURL(stream));
        };
        this.getStreamID = function (stream) {
            // streams from FF endpoints have the characters '{' and '}'
            // that make jQuery choke.
            return stream.id.replace(/[\{,\}]/g,"");
        };
        this.getVideoSrc = function (element) {
            return element.getAttribute("src");
        };
        this.setVideoSrc = function (element, src) {
            element.setAttribute("src", src);
        };
        // DTLS should now be enabled by default but..
        this.pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': 'true'}]};
        if (navigator.userAgent.indexOf('Android') != -1) {
            this.pc_constraints = {}; // disable DTLS on Android
        }
        if (!webkitMediaStream.prototype.getVideoTracks) {
            webkitMediaStream.prototype.getVideoTracks = function () {
                return this.videoTracks;
            };
        }
        if (!webkitMediaStream.prototype.getAudioTracks) {
            webkitMediaStream.prototype.getAudioTracks = function () {
                return this.audioTracks;
            };
        }
    }
    else
    {
        try { console.log('Browser does not appear to be WebRTC-capable'); } catch (e) { }

        window.location.href = 'unsupported_browser.html';
        return;
    }
}


RTCUtils.prototype.getUserMediaWithConstraints = function(
    um, success_callback, failure_callback, resolution,bandwidth, fps,
    desktopStream)
{
    currentResolution = resolution;
    // Check if we are running on Android device
    var isAndroid = navigator.userAgent.indexOf('Android') != -1;

    var constraints = getConstraints(
        um, resolution, bandwidth, fps, desktopStream, isAndroid);

    var isFF = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    try {
        if (config.enableSimulcast
            && constraints.video
            && constraints.video.chromeMediaSource !== 'screen'
            && constraints.video.chromeMediaSource !== 'desktop'
            && !isAndroid

            // We currently do not support FF, as it doesn't have multistream support.
            && !isFF) {
            APP.simulcast.getUserMedia(constraints, function (stream) {
                    console.log('onUserMediaSuccess');
                    success_callback(stream);
                },
                function (error) {
                    console.warn('Failed to get access to local media. Error ', error);
                    if (failure_callback) {
                        failure_callback(error);
                    }
                });
        } else {

            this.getUserMedia(constraints,
                function (stream) {
                    console.log('onUserMediaSuccess');
                    success_callback(stream);
                },
                function (error) {
                    console.warn('Failed to get access to local media. Error ',
                        error, constraints);
                    if (failure_callback) {
                        failure_callback(error);
                    }
                });

        }
    } catch (e) {
        console.error('GUM failed: ', e);
        if(failure_callback) {
            failure_callback(e);
        }
    }
};

/**
 * We ask for audio and video combined stream in order to get permissions and
 * not to ask twice.
 */
RTCUtils.prototype.obtainAudioAndVideoPermissions = function() {
    var self = this;
    // Get AV

    this.getUserMediaWithConstraints(
        ['audio', 'video'],
        function (stream) {
            self.successCallback(stream);
        },
        function (error) {
            self.errorCallback(error);
        },
        config.resolution || '360');
}

RTCUtils.prototype.successCallback = function (stream) {
    console.log('got', stream, stream.getAudioTracks().length,
        stream.getVideoTracks().length);
    this.handleLocalStream(stream);
};

RTCUtils.prototype.errorCallback = function (error) {
    var self = this;
    console.error('failed to obtain audio/video stream - trying audio only', error);
    var resolution = getPreviousResolution(currentResolution);
    if(typeof error == "object" && error.constraintName && error.name
        && (error.name == "ConstraintNotSatisfiedError" ||
            error.name == "OverconstrainedError") &&
        (error.constraintName == "minWidth" || error.constraintName == "maxWidth" ||
            error.constraintName == "minHeight" || error.constraintName == "maxHeight")
        && resolution != null)
    {
        self.getUserMediaWithConstraints(['audio', 'video'],
            function (stream) {
                return self.successCallback(stream);
            }, function (error) {
                return self.errorCallback(error);
            }, resolution);
    }
    else
    {
        self.getUserMediaWithConstraints(
            ['audio'],
            function (stream) {
                return self.successCallback(stream);
            },
            function (error) {
                console.error('failed to obtain audio/video stream - stop',
                    error);
                APP.UI.messageHandler.showError("dialog.error",
                    "dialog.failedpermissions");
            }
        );
    }

}

RTCUtils.prototype.handleLocalStream = function(stream)
{
    if(window.webkitMediaStream)
    {
        var audioStream = new webkitMediaStream();
        var videoStream = new webkitMediaStream();
        var audioTracks = stream.getAudioTracks();
        var videoTracks = stream.getVideoTracks();
        for (var i = 0; i < audioTracks.length; i++) {
            audioStream.addTrack(audioTracks[i]);
        }

        this.service.createLocalStream(audioStream, "audio");

        for (i = 0; i < videoTracks.length; i++) {
            videoStream.addTrack(videoTracks[i]);
        }


        this.service.createLocalStream(videoStream, "video");
    }
    else
    {//firefox
        this.service.createLocalStream(stream, "stream");
    }

};



module.exports = RTCUtils;

},{"../../service/RTC/RTCBrowserType.js":89,"../../service/RTC/Resolutions":91}],8:[function(require,module,exports){
var UI = {};

var VideoLayout = require("./videolayout/VideoLayout.js");
var AudioLevels = require("./audio_levels/AudioLevels.js");
var Prezi = require("./prezi/Prezi.js");
var Etherpad = require("./etherpad/Etherpad.js");
var Chat = require("./side_pannels/chat/Chat.js");
var Toolbar = require("./toolbars/Toolbar");
var ToolbarToggler = require("./toolbars/ToolbarToggler");
var BottomToolbar = require("./toolbars/BottomToolbar");
var ContactList = require("./side_pannels/contactlist/ContactList");
var Avatar = require("./avatar/Avatar");
var EventEmitter = require("events");
var SettingsMenu = require("./side_pannels/settings/SettingsMenu");
var Settings = require("./../settings/Settings");
var PanelToggler = require("./side_pannels/SidePanelToggler");
var RoomNameGenerator = require("./welcome_page/RoomnameGenerator");
UI.messageHandler = require("./util/MessageHandler");
var messageHandler = UI.messageHandler;
var Authentication  = require("./authentication/Authentication");
var UIUtil = require("./util/UIUtil");
var NicknameHandler = require("./util/NicknameHandler");
var CQEvents = require("../../service/connectionquality/CQEvents");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var RTCEvents = require("../../service/RTC/RTCEvents");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");

var eventEmitter = new EventEmitter();
var roomName = null;


function setupPrezi()
{
    $("#reloadPresentationLink").click(function()
    {
        Prezi.reloadPresentation();
    });
}

function setupChat()
{
    Chat.init();
    $("#toggle_smileys").click(function() {
        Chat.toggleSmileys();
    });
}

function setupToolbars() {
    Toolbar.init(UI);
    Toolbar.setupButtonsFromConfig();
    BottomToolbar.init();
}

function streamHandler(stream) {
    switch (stream.type)
    {
        case "audio":
            VideoLayout.changeLocalAudio(stream);
            break;
        case "video":
            VideoLayout.changeLocalVideo(stream);
            break;
        case "stream":
            VideoLayout.changeLocalStream(stream);
            break;
    }
}

function onDisposeConference(unload) {
    Toolbar.showAuthenticateButton(false);
};

function onDisplayNameChanged(jid, displayName) {
    ContactList.onDisplayNameChange(jid, displayName);
    SettingsMenu.onDisplayNameChange(jid, displayName);
    VideoLayout.onDisplayNameChanged(jid, displayName);
}

function registerListeners() {
    APP.RTC.addStreamListener(streamHandler, StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);

    APP.RTC.addStreamListener(streamHandler, StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED);
    APP.RTC.addStreamListener(function (stream) {
        VideoLayout.onRemoteStreamAdded(stream);
    }, StreamEventTypes.EVENT_TYPE_REMOTE_CREATED);
    APP.RTC.addStreamListener(function (jid) {
        VideoLayout.onVideoTypeChanged(jid);
    }, StreamEventTypes.EVENT_TYPE_REMOTE_CHANGED);
    APP.RTC.addListener(RTCEvents.LASTN_CHANGED, onLastNChanged);
    APP.RTC.addListener(RTCEvents.DOMINANTSPEAKER_CHANGED, function (resourceJid) {
        VideoLayout.onDominantSpeakerChanged(resourceJid);
    });
    APP.RTC.addListener(RTCEvents.LASTN_ENDPOINT_CHANGED,
        function (lastNEndpoints, endpointsEnteringLastN, stream) {
            VideoLayout.onLastNEndpointsChanged(lastNEndpoints,
                endpointsEnteringLastN, stream);
        });
    APP.RTC.addListener(RTCEvents.SIMULCAST_LAYER_CHANGED,
        function (endpointSimulcastLayers) {
           VideoLayout.onSimulcastLayersChanged(endpointSimulcastLayers);
        });
    APP.RTC.addListener(RTCEvents.SIMULCAST_LAYER_CHANGING,
        function (endpointSimulcastLayers) {
            VideoLayout.onSimulcastLayersChanging(endpointSimulcastLayers);
        });

    APP.statistics.addAudioLevelListener(function(jid, audioLevel)
    {
        var resourceJid;
        if(jid === APP.statistics.LOCAL_JID)
        {
            resourceJid = AudioLevels.LOCAL_LEVEL;
            if(APP.RTC.localAudio.isMuted())
            {
                audioLevel = 0;
            }
        }
        else
        {
            resourceJid = Strophe.getResourceFromJid(jid);
        }

        AudioLevels.updateAudioLevel(resourceJid, audioLevel,
            UI.getLargeVideoState().userResourceJid);
    });
    APP.desktopsharing.addListener(function () {
        ToolbarToggler.showDesktopSharingButton();
    }, DesktopSharingEventTypes.INIT);
    APP.desktopsharing.addListener(
        Toolbar.changeDesktopSharingButtonState,
        DesktopSharingEventTypes.SWITCHING_DONE);
    APP.connectionquality.addListener(CQEvents.LOCALSTATS_UPDATED,
        VideoLayout.updateLocalConnectionStats);
    APP.connectionquality.addListener(CQEvents.REMOTESTATS_UPDATED,
        VideoLayout.updateConnectionStats);
    APP.connectionquality.addListener(CQEvents.STOP,
        VideoLayout.onStatsStop);
    APP.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE, onDisposeConference);
    APP.xmpp.addListener(XMPPEvents.GRACEFUL_SHUTDOWN, function () {
        messageHandler.openMessageDialog(
            'dialog.serviceUnavailable',
            'dialog.gracefulShutdown'
        );
    });
    APP.xmpp.addListener(XMPPEvents.RESERVATION_ERROR, function (code, msg) {
        var title = APP.translation.generateTranslatonHTML(
            "dialog.reservationError");
        var message = APP.translation.generateTranslatonHTML(
            "dialog.reservationErrorMsg", {code: code, msg: msg});
        messageHandler.openDialog(
            title,
            message,
            true, {},
            function (event, value, message, formVals)
            {
                return false;
            }
        );
    });
    APP.xmpp.addListener(XMPPEvents.KICKED, function () {
        messageHandler.openMessageDialog("dialog.sessTerminated",
            "dialog.kickMessage");
    });
    APP.xmpp.addListener(XMPPEvents.MUC_DESTROYED, function (reason) {
        //FIXME: use Session Terminated from translation, but
        // 'reason' text comes from XMPP packet and is not translated
        var title = APP.translation.generateTranslatonHTML("dialog.sessTerminated");
        messageHandler.openDialog(
            title, reason, true, {},
            function (event, value, message, formVals)
            {
                return false;
            }
        );
    });
    APP.xmpp.addListener(XMPPEvents.BRIDGE_DOWN, function () {
        messageHandler.showError("dialog.error",
            "dialog.bridgeUnavailable");
    });
    APP.xmpp.addListener(XMPPEvents.USER_ID_CHANGED, function (from, id) {
        Avatar.setUserAvatar(from, id);
    });
    APP.xmpp.addListener(XMPPEvents.CHANGED_STREAMS, function (jid, changedStreams) {
        for(stream in changedStreams)
        {
            // might need to update the direction if participant just went from sendrecv to recvonly
            if (stream.type === 'video' || stream.type === 'screen') {
                var el = $('#participant_'  + Strophe.getResourceFromJid(jid) + '>video');
                switch (stream.direction) {
                    case 'sendrecv':
                        el.show();
                        break;
                    case 'recvonly':
                        el.hide();
                        // FIXME: Check if we have to change large video
                        //VideoLayout.updateLargeVideo(el);
                        break;
                }
            }
        }

    });
    APP.xmpp.addListener(XMPPEvents.DISPLAY_NAME_CHANGED, onDisplayNameChanged);
    APP.xmpp.addListener(XMPPEvents.MUC_JOINED, onMucJoined);
    APP.xmpp.addListener(XMPPEvents.LOCALROLE_CHANGED, onLocalRoleChange);
    APP.xmpp.addListener(XMPPEvents.MUC_ENTER, onMucEntered);
    APP.xmpp.addListener(XMPPEvents.MUC_ROLE_CHANGED, onMucRoleChanged);
    APP.xmpp.addListener(XMPPEvents.PRESENCE_STATUS, onMucPresenceStatus);
    APP.xmpp.addListener(XMPPEvents.SUBJECT_CHANGED, chatSetSubject);
    APP.xmpp.addListener(XMPPEvents.MESSAGE_RECEIVED, updateChatConversation);
    APP.xmpp.addListener(XMPPEvents.MUC_LEFT, onMucLeft);
    APP.xmpp.addListener(XMPPEvents.PASSWORD_REQUIRED, onPasswordReqiured);
    APP.xmpp.addListener(XMPPEvents.CHAT_ERROR_RECEIVED, chatAddError);
    APP.xmpp.addListener(XMPPEvents.ETHERPAD, initEtherpad);
    APP.xmpp.addListener(XMPPEvents.AUTHENTICATION_REQUIRED, onAuthenticationRequired);


}


/**
 * Mutes/unmutes the local video.
 *
 * @param mute <tt>true</tt> to mute the local video; otherwise, <tt>false</tt>
 * @param options an object which specifies optional arguments such as the
 * <tt>boolean</tt> key <tt>byUser</tt> with default value <tt>true</tt> which
 * specifies whether the method was initiated in response to a user command (in
 * contrast to an automatic decision taken by the application logic)
 */
function setVideoMute(mute, options) {
    APP.xmpp.setVideoMute(
        mute,
        function (mute) {
            var video = $('#video');
            var communicativeClass = "icon-camera";
            var muteClass = "icon-camera icon-camera-disabled";

            if (mute) {
                video.removeClass(communicativeClass);
                video.addClass(muteClass);
            } else {
                video.removeClass(muteClass);
                video.addClass(communicativeClass);
            }
        },
        options);
}


function bindEvents()
{
    /**
     * Resizes and repositions videos in full screen mode.
     */
    $(document).on('webkitfullscreenchange mozfullscreenchange fullscreenchange',
        function () {
            VideoLayout.resizeLargeVideoContainer();
            VideoLayout.positionLarge();
        }
    );

    $(window).resize(function () {
        VideoLayout.resizeLargeVideoContainer();
        VideoLayout.positionLarge();
    });
}

UI.start = function (init) {
    document.title = interfaceConfig.APP_NAME;
    if(config.enableWelcomePage && window.location.pathname == "/" &&
        (!window.localStorage.welcomePageDisabled || window.localStorage.welcomePageDisabled == "false"))
    {
        $("#videoconference_page").hide();
        var setupWelcomePage = require("./welcome_page/WelcomePage");
        setupWelcomePage();

        return;
    }

    if (interfaceConfig.SHOW_JITSI_WATERMARK) {
        var leftWatermarkDiv
            = $("#largeVideoContainer div[class='watermark leftwatermark']");

        leftWatermarkDiv.css({display: 'block'});
        leftWatermarkDiv.parent().get(0).href
            = interfaceConfig.JITSI_WATERMARK_LINK;
    }

    if (interfaceConfig.SHOW_BRAND_WATERMARK) {
        var rightWatermarkDiv
            = $("#largeVideoContainer div[class='watermark rightwatermark']");

        rightWatermarkDiv.css({display: 'block'});
        rightWatermarkDiv.parent().get(0).href
            = interfaceConfig.BRAND_WATERMARK_LINK;
        rightWatermarkDiv.get(0).style.backgroundImage
            = "url(images/rightwatermark.png)";
    }

    if (interfaceConfig.SHOW_POWERED_BY) {
        $("#largeVideoContainer>a[class='poweredby']").css({display: 'block'});
    }

    $("#welcome_page").hide();

    VideoLayout.resizeLargeVideoContainer();
    $("#videospace").mousemove(function () {
        return ToolbarToggler.showToolbar();
    });
    // Set the defaults for prompt dialogs.
    jQuery.prompt.setDefaults({persistent: false});

    VideoLayout.init(eventEmitter);
    AudioLevels.init();
    NicknameHandler.init(eventEmitter);
    registerListeners();
    bindEvents();
    setupPrezi();
    setupToolbars();
    setupChat();


    document.title = interfaceConfig.APP_NAME;

    $("#downloadlog").click(function (event) {
        dump(event.target);
    });

    if(config.enableWelcomePage && window.location.pathname == "/" &&
        (!window.localStorage.welcomePageDisabled || window.localStorage.welcomePageDisabled == "false"))
    {
        $("#videoconference_page").hide();
        var setupWelcomePage = require("./welcome_page/WelcomePage");
        setupWelcomePage();

        return;
    }

    $("#welcome_page").hide();

    // Display notice message at the top of the toolbar
    if (config.noticeMessage) {
        $('#noticeText').text(config.noticeMessage);
        $('#notice').css({display: 'block'});
    }

    document.getElementById('largeVideo').volume = 0;

    if (!$('#settings').is(':visible')) {
        console.log('init');
        init();
    } else {
        loginInfo.onsubmit = function (e) {
            if (e.preventDefault) e.preventDefault();
            $('#settings').hide();
            init();
        };
    }

    toastr.options = {
        "closeButton": true,
        "debug": false,
        "positionClass": "notification-bottom-right",
        "onclick": null,
        "showDuration": "300",
        "hideDuration": "1000",
        "timeOut": "2000",
        "extendedTimeOut": "1000",
        "showEasing": "swing",
        "hideEasing": "linear",
        "showMethod": "fadeIn",
        "hideMethod": "fadeOut",
        "reposition": function() {
            if(PanelToggler.isVisible()) {
                $("#toast-container").addClass("notification-bottom-right-center");
            } else {
                $("#toast-container").removeClass("notification-bottom-right-center");
            }
        },
        "newestOnTop": false
    };

    SettingsMenu.init();

};

function chatAddError(errorMessage, originalText)
{
    return Chat.chatAddError(errorMessage, originalText);
};

function chatSetSubject(text)
{
    return Chat.chatSetSubject(text);
};

function updateChatConversation(from, displayName, message) {
    return Chat.updateChatConversation(from, displayName, message);
};

function onMucJoined(jid, info) {
    Toolbar.updateRoomUrl(window.location.href);
    var meHTML = APP.translation.generateTranslatonHTML("me");
    $("#localNick").html(Strophe.getResourceFromJid(jid) + " (" + meHTML + ")");

    var settings = Settings.getSettings();
    // Add myself to the contact list.
    ContactList.addContact(jid, settings.email || settings.uid);

    // Once we've joined the muc show the toolbar
    ToolbarToggler.showToolbar();

    var displayName = !config.displayJids
        ? info.displayName : Strophe.getResourceFromJid(jid);

    if (displayName)
        onDisplayNameChanged('localVideoContainer', displayName);
}

function initEtherpad(name) {
    Etherpad.init(name);
};

function onMucLeft(jid) {
    console.log('left.muc', jid);
    var displayName = $('#participant_' + Strophe.getResourceFromJid(jid) +
        '>.displayname').html();
    messageHandler.notify(displayName,'notify.somebody',
        'disconnected',
        'notify.disconnected');
    // Need to call this with a slight delay, otherwise the element couldn't be
    // found for some reason.
    // XXX(gp) it works fine without the timeout for me (with Chrome 38).
    window.setTimeout(function () {
        var container = document.getElementById(
                'participant_' + Strophe.getResourceFromJid(jid));
        if (container) {
            ContactList.removeContact(jid);
            VideoLayout.removeConnectionIndicator(jid);
            // hide here, wait for video to close before removing
            $(container).hide();
            VideoLayout.resizeThumbnails();
        }
    }, 10);

    VideoLayout.participantLeft(jid);

};


function onLocalRoleChange(jid, info, pres, isModerator)
{

    console.info("My role changed, new role: " + info.role);
    onModeratorStatusChanged(isModerator);
    VideoLayout.showModeratorIndicator();

    if (isModerator) {
        Authentication.closeAuthenticationWindow();
        messageHandler.notify(null, "notify.me",
            'connected', "notify.moderator");
    }
}

function onModeratorStatusChanged(isModerator) {

    Toolbar.showSipCallButton(isModerator);
    Toolbar.showRecordingButton(
        isModerator); //&&
    // FIXME:
    // Recording visible if
    // there are at least 2(+ 1 focus) participants
    //Object.keys(connection.emuc.members).length >= 3);

    if (isModerator && config.etherpad_base) {
        Etherpad.init();
    }
};

function onPasswordReqiured(callback) {
    // password is required
    Toolbar.lockLockButton();
    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString(
        "dialog.passwordRequired");
    message += '</h2>' +
        '<input name="lockKey" type="text" data-i18n=' +
        '"[placeholder]dialog.password" placeholder="' +
        APP.translation.translateString("dialog.password") +
        '" autofocus>';

    messageHandler.openTwoButtonDialog(null, null, null, message,
        true,
        "dialog.Ok",
        function (e, v, m, f) {},
        null,
        function (e, v, m, f) {
            if (v) {
                var lockKey = f.lockKey;
                if (lockKey) {
                    Toolbar.setSharedKey(lockKey);
                    callback(lockKey);
                }
            }
        },
        ':input:first'
    );
}
function onMucEntered(jid, id, displayName) {
    messageHandler.notify(displayName,'notify.somebody',
        'connected',
        'notify.connected');

    // Add Peer's container
    VideoLayout.ensurePeerContainerExists(jid,id);
}

function onMucPresenceStatus( jid, info) {
    VideoLayout.setPresenceStatus(
            'participant_' + Strophe.getResourceFromJid(jid), info.status);
}

function onMucRoleChanged(role, displayName) {
    VideoLayout.showModeratorIndicator();

    if (role === 'moderator') {
        var messageKey, messageOptions = {};
        if (!displayName) {
            messageKey = "notify.grantedToUnknown";
        }
        else
        {
            messageKey = "notify.grantedTo";
            messageOptions = {to: displayName};
        }
        messageHandler.notify(
            displayName,'notify.somebody',
            'connected', messageKey,
            messageOptions);
    }
}

function onAuthenticationRequired(intervalCallback) {
    Authentication.openAuthenticationDialog(
        roomName, intervalCallback, function () {
            Toolbar.authenticateClicked();
        });
};


function onLastNChanged(oldValue, newValue) {
    if (config.muteLocalVideoIfNotInLastN) {
        setVideoMute(!newValue, { 'byUser': false });
    }
}


UI.toggleSmileys = function () {
    Chat.toggleSmileys();
};

UI.getSettings = function () {
    return Settings.getSettings();
};

UI.toggleFilmStrip = function () {
    return BottomToolbar.toggleFilmStrip();
};

UI.toggleChat = function () {
    return BottomToolbar.toggleChat();
};

UI.toggleContactList = function () {
    return BottomToolbar.toggleContactList();
};

UI.inputDisplayNameHandler = function (value) {
    VideoLayout.inputDisplayNameHandler(value);
};


UI.getLargeVideoState = function()
{
    return VideoLayout.getLargeVideoState();
};

UI.generateRoomName = function() {
    if(roomName)
        return roomName;
    var roomnode = null;
    var path = window.location.pathname;
    path = path.substring(0, path.lastIndexOf("/"));      // Removing possible "/" char from the meeting room (happens with a fixed URL from apache. Ex: '/meeting/')

    // determinde the room node from the url
    // TODO: just the roomnode or the whole bare jid?
    if (config.getroomnode && typeof config.getroomnode === 'function') {
        // custom function might be responsible for doing the pushstate
        roomnode = config.getroomnode(path);
    } else {
        /* fall back to default strategy
         * this is making assumptions about how the URL->room mapping happens.
         * It currently assumes deployment at root, with a rewrite like the
         * following one (for nginx):
         location ~ ^/([a-zA-Z0-9]+)$ {
         rewrite ^/(.*)$ / break;
         }
         */
        if (path.length > 1) {
            roomnode = path.substr(1).toLowerCase();
        } else {
            var word = RoomNameGenerator.generateRoomWithoutSeparator();
            roomnode = word.toLowerCase();

            window.history.pushState('VideoChat',
                    'Room: ' + word, window.location.pathname + word);
        }
    }

    roomName = roomnode + '@' + config.hosts.muc;
    return roomName;
};


UI.connectionIndicatorShowMore = function(id)
{
    return VideoLayout.connectionIndicators[id].showMore();
};

UI.showLoginPopup = function(callback)
{
    console.log('password is required');
    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString(
        "dialog.passwordRequired");
    message += '</h2>' +
        '<input name="username" type="text" ' +
        'placeholder="user@domain.net" autofocus>' +
        '<input name="password" ' +
        'type="password" data-i18n="[placeholder]dialog.userPassword"' +
        ' placeholder="user password">';
    UI.messageHandler.openTwoButtonDialog(null, null, null, message,
        true,
        "dialog.Ok",
        function (e, v, m, f) {
            if (v) {
                if (f.username !== null && f.password != null) {
                    callback(f.username, f.password);
                }
            }
        },
        null, null, ':input:first'

    );
}

UI.checkForNicknameAndJoin = function () {

    Authentication.closeAuthenticationDialog();
    Authentication.stopInterval();

    var nick = null;
    if (config.useNicks) {
        nick = window.prompt('Your nickname (optional)');
    }
    APP.xmpp.joinRoom(roomName, config.useNicks, nick);
};


function dump(elem, filename) {
    elem = elem.parentNode;
    elem.download = filename || 'meetlog.json';
    elem.href = 'data:application/json;charset=utf-8,\n';
    var data = APP.xmpp.populateData();
    var metadata = {};
    metadata.time = new Date();
    metadata.url = window.location.href;
    metadata.ua = navigator.userAgent;
    var log = APP.xmpp.getLogger();
    if (log) {
        metadata.xmpp = log;
    }
    data.metadata = metadata;
    elem.href += encodeURIComponent(JSON.stringify(data, null, '  '));
    return false;
}

UI.getRoomName = function () {
    return roomName;
};

/**
 * Mutes/unmutes the local video.
 */
UI.toggleVideo = function () {
    setVideoMute(!APP.RTC.localVideo.isMuted());
};

/**
 * Mutes / unmutes audio for the local participant.
 */
UI.toggleAudio = function() {
    UI.setAudioMuted(!APP.RTC.localAudio.isMuted());
};

/**
 * Sets muted audio state for the local participant.
 */
UI.setAudioMuted = function (mute) {

    if(!APP.xmpp.setAudioMute(mute, function () {
        VideoLayout.showLocalAudioIndicator(mute);

        UIUtil.buttonClick("#mute", "icon-microphone icon-mic-disabled");
    }))
    {
        // We still click the button.
        UIUtil.buttonClick("#mute", "icon-microphone icon-mic-disabled");
        return;
    }

}

UI.addListener = function (type, listener) {
    eventEmitter.on(type, listener);
}

UI.clickOnVideo = function (videoNumber) {
    var remoteVideos = $(".videocontainer:not(#mixedstream)");
    if (remoteVideos.length > videoNumber) {
        remoteVideos[videoNumber].click();
    }
}

//Used by torture
UI.showToolbar = function () {
    return ToolbarToggler.showToolbar();
}

//Used by torture
UI.dockToolbar = function (isDock) {
    return ToolbarToggler.dockToolbar(isDock);
}

module.exports = UI;


},{"../../service/RTC/RTCEvents":90,"../../service/RTC/StreamEventTypes":92,"../../service/connectionquality/CQEvents":95,"../../service/desktopsharing/DesktopSharingEventTypes":96,"../../service/xmpp/XMPPEvents":98,"./../settings/Settings":38,"./audio_levels/AudioLevels.js":9,"./authentication/Authentication":11,"./avatar/Avatar":13,"./etherpad/Etherpad.js":14,"./prezi/Prezi.js":15,"./side_pannels/SidePanelToggler":17,"./side_pannels/chat/Chat.js":18,"./side_pannels/contactlist/ContactList":22,"./side_pannels/settings/SettingsMenu":23,"./toolbars/BottomToolbar":24,"./toolbars/Toolbar":25,"./toolbars/ToolbarToggler":26,"./util/MessageHandler":28,"./util/NicknameHandler":29,"./util/UIUtil":30,"./videolayout/VideoLayout.js":32,"./welcome_page/RoomnameGenerator":33,"./welcome_page/WelcomePage":34,"events":62}],9:[function(require,module,exports){
var CanvasUtil = require("./CanvasUtils");

var ASDrawContext = $('#activeSpeakerAudioLevel')[0].getContext('2d');

function initActiveSpeakerAudioLevels() {
    var ASRadius = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE / 2;
    var ASCenter = (interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE + ASRadius) / 2;

// Draw a circle.
    ASDrawContext.arc(ASCenter, ASCenter, ASRadius, 0, 2 * Math.PI);

// Add a shadow around the circle
    ASDrawContext.shadowColor = interfaceConfig.SHADOW_COLOR;
    ASDrawContext.shadowOffsetX = 0;
    ASDrawContext.shadowOffsetY = 0;
}

/**
 * The audio Levels plugin.
 */
var AudioLevels = (function(my) {
    var audioLevelCanvasCache = {};

    my.LOCAL_LEVEL = 'local';

    my.init = function () {
        initActiveSpeakerAudioLevels();
    }

    /**
     * Updates the audio level canvas for the given peerJid. If the canvas
     * didn't exist we create it.
     */
    my.updateAudioLevelCanvas = function (peerJid, VideoLayout) {
        var resourceJid = null;
        var videoSpanId = null;
        if (!peerJid)
            videoSpanId = 'localVideoContainer';
        else {
            resourceJid = Strophe.getResourceFromJid(peerJid);

            videoSpanId = 'participant_' + resourceJid;
        }

        var videoSpan = document.getElementById(videoSpanId);

        if (!videoSpan) {
            if (resourceJid)
                console.error("No video element for jid", resourceJid);
            else
                console.error("No video element for local video.");

            return;
        }

        var audioLevelCanvas = $('#' + videoSpanId + '>canvas');

        var videoSpaceWidth = $('#remoteVideos').width();
        var thumbnailSize = VideoLayout.calculateThumbnailSize(videoSpaceWidth);
        var thumbnailWidth = thumbnailSize[0];
        var thumbnailHeight = thumbnailSize[1];

        if (!audioLevelCanvas || audioLevelCanvas.length === 0) {

            audioLevelCanvas = document.createElement('canvas');
            audioLevelCanvas.className = "audiolevel";
            audioLevelCanvas.style.bottom = "-" + interfaceConfig.CANVAS_EXTRA/2 + "px";
            audioLevelCanvas.style.left = "-" + interfaceConfig.CANVAS_EXTRA/2 + "px";
            resizeAudioLevelCanvas( audioLevelCanvas,
                    thumbnailWidth,
                    thumbnailHeight);

            videoSpan.appendChild(audioLevelCanvas);
        } else {
            audioLevelCanvas = audioLevelCanvas.get(0);

            resizeAudioLevelCanvas( audioLevelCanvas,
                    thumbnailWidth,
                    thumbnailHeight);
        }
    };

    /**
     * Updates the audio level UI for the given resourceJid.
     *
     * @param resourceJid the resource jid indicating the video element for
     * which we draw the audio level
     * @param audioLevel the newAudio level to render
     */
    my.updateAudioLevel = function (resourceJid, audioLevel, largeVideoResourceJid) {
        drawAudioLevelCanvas(resourceJid, audioLevel);

        var videoSpanId = getVideoSpanId(resourceJid);

        var audioLevelCanvas = $('#' + videoSpanId + '>canvas').get(0);

        if (!audioLevelCanvas)
            return;

        var drawContext = audioLevelCanvas.getContext('2d');

        var canvasCache = audioLevelCanvasCache[resourceJid];

        drawContext.clearRect (0, 0,
                audioLevelCanvas.width, audioLevelCanvas.height);
        drawContext.drawImage(canvasCache, 0, 0);

        if(resourceJid === AudioLevels.LOCAL_LEVEL) {
            if(!APP.xmpp.myJid()) {
                return;
            }
            resourceJid = APP.xmpp.myResource();
        }

        if(resourceJid  === largeVideoResourceJid) {
            window.requestAnimationFrame(function () {
                AudioLevels.updateActiveSpeakerAudioLevel(audioLevel);
            });
        }
    };

    my.updateActiveSpeakerAudioLevel = function(audioLevel) {
        if($("#activeSpeaker").css("visibility") == "hidden")
            return;


        ASDrawContext.clearRect(0, 0, 300, 300);
        if(audioLevel == 0)
            return;

        ASDrawContext.shadowBlur = getShadowLevel(audioLevel);


        // Fill the shape.
        ASDrawContext.fill();
    };

    /**
     * Resizes the given audio level canvas to match the given thumbnail size.
     */
    function resizeAudioLevelCanvas(audioLevelCanvas,
                                    thumbnailWidth,
                                    thumbnailHeight) {
        audioLevelCanvas.width = thumbnailWidth + interfaceConfig.CANVAS_EXTRA;
        audioLevelCanvas.height = thumbnailHeight + interfaceConfig.CANVAS_EXTRA;
    }

    /**
     * Draws the audio level canvas into the cached canvas object.
     *
     * @param resourceJid the resource jid indicating the video element for
     * which we draw the audio level
     * @param audioLevel the newAudio level to render
     */
    function drawAudioLevelCanvas(resourceJid, audioLevel) {
        if (!audioLevelCanvasCache[resourceJid]) {

            var videoSpanId = getVideoSpanId(resourceJid);

            var audioLevelCanvasOrig = $('#' + videoSpanId + '>canvas').get(0);

            /*
             * FIXME Testing has shown that audioLevelCanvasOrig may not exist.
             * In such a case, the method CanvasUtil.cloneCanvas may throw an
             * error. Since audio levels are frequently updated, the errors have
             * been observed to pile into the console, strain the CPU.
             */
            if (audioLevelCanvasOrig)
            {
                audioLevelCanvasCache[resourceJid]
                    = CanvasUtil.cloneCanvas(audioLevelCanvasOrig);
            }
        }

        var canvas = audioLevelCanvasCache[resourceJid];

        if (!canvas)
            return;

        var drawContext = canvas.getContext('2d');

        drawContext.clearRect(0, 0, canvas.width, canvas.height);

        var shadowLevel = getShadowLevel(audioLevel);

        if (shadowLevel > 0)
            // drawContext, x, y, w, h, r, shadowColor, shadowLevel
            CanvasUtil.drawRoundRectGlow(   drawContext,
                interfaceConfig.CANVAS_EXTRA/2, interfaceConfig.CANVAS_EXTRA/2,
                canvas.width - interfaceConfig.CANVAS_EXTRA,
                canvas.height - interfaceConfig.CANVAS_EXTRA,
                interfaceConfig.CANVAS_RADIUS,
                interfaceConfig.SHADOW_COLOR,
                shadowLevel);
    }

    /**
     * Returns the shadow/glow level for the given audio level.
     *
     * @param audioLevel the audio level from which we determine the shadow
     * level
     */
    function getShadowLevel (audioLevel) {
        var shadowLevel = 0;

        if (audioLevel <= 0.3) {
            shadowLevel = Math.round(interfaceConfig.CANVAS_EXTRA/2*(audioLevel/0.3));
        }
        else if (audioLevel <= 0.6) {
            shadowLevel = Math.round(interfaceConfig.CANVAS_EXTRA/2*((audioLevel - 0.3) / 0.3));
        }
        else {
            shadowLevel = Math.round(interfaceConfig.CANVAS_EXTRA/2*((audioLevel - 0.6) / 0.4));
        }
        return shadowLevel;
    }

    /**
     * Returns the video span id corresponding to the given resourceJid or local
     * user.
     */
    function getVideoSpanId(resourceJid) {
        var videoSpanId = null;
        if (resourceJid === AudioLevels.LOCAL_LEVEL
                || (APP.xmpp.myResource() && resourceJid
                    === APP.xmpp.myResource()))
            videoSpanId = 'localVideoContainer';
        else
            videoSpanId = 'participant_' + resourceJid;

        return videoSpanId;
    }

    /**
     * Indicates that the remote video has been resized.
     */
    $(document).bind('remotevideo.resized', function (event, width, height) {
        var resized = false;
        $('#remoteVideos>span>canvas').each(function() {
            var canvas = $(this).get(0);
            if (canvas.width !== width + interfaceConfig.CANVAS_EXTRA) {
                canvas.width = width + interfaceConfig.CANVAS_EXTRA;
                resized = true;
            }

            if (canvas.heigh !== height + interfaceConfig.CANVAS_EXTRA) {
                canvas.height = height + interfaceConfig.CANVAS_EXTRA;
                resized = true;
            }
        });

        if (resized)
            Object.keys(audioLevelCanvasCache).forEach(function (resourceJid) {
                audioLevelCanvasCache[resourceJid].width
                    = width + interfaceConfig.CANVAS_EXTRA;
                audioLevelCanvasCache[resourceJid].height
                    = height + interfaceConfig.CANVAS_EXTRA;
            });
    });

    return my;

})(AudioLevels || {});

module.exports = AudioLevels;
},{"./CanvasUtils":10}],10:[function(require,module,exports){
/**
 * Utility class for drawing canvas shapes.
 */
var CanvasUtil = (function(my) {

    /**
     * Draws a round rectangle with a glow. The glowWidth indicates the depth
     * of the glow.
     *
     * @param drawContext the context of the canvas to draw to
     * @param x the x coordinate of the round rectangle
     * @param y the y coordinate of the round rectangle
     * @param w the width of the round rectangle
     * @param h the height of the round rectangle
     * @param glowColor the color of the glow
     * @param glowWidth the width of the glow
     */
    my.drawRoundRectGlow
        = function(drawContext, x, y, w, h, r, glowColor, glowWidth) {

        // Save the previous state of the context.
        drawContext.save();

        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;

        // Draw a round rectangle.
        drawContext.beginPath();
        drawContext.moveTo(x+r, y);
        drawContext.arcTo(x+w, y,   x+w, y+h, r);
        drawContext.arcTo(x+w, y+h, x,   y+h, r);
        drawContext.arcTo(x,   y+h, x,   y,   r);
        drawContext.arcTo(x,   y,   x+w, y,   r);
        drawContext.closePath();

        // Add a shadow around the rectangle
        drawContext.shadowColor = glowColor;
        drawContext.shadowBlur = glowWidth;
        drawContext.shadowOffsetX = 0;
        drawContext.shadowOffsetY = 0;

        // Fill the shape.
        drawContext.fill();

        drawContext.save();

        drawContext.restore();

//      1) Uncomment this line to use Composite Operation, which is doing the
//      same as the clip function below and is also antialiasing the round
//      border, but is said to be less fast performance wise.

//      drawContext.globalCompositeOperation='destination-out';

        drawContext.beginPath();
        drawContext.moveTo(x+r, y);
        drawContext.arcTo(x+w, y,   x+w, y+h, r);
        drawContext.arcTo(x+w, y+h, x,   y+h, r);
        drawContext.arcTo(x,   y+h, x,   y,   r);
        drawContext.arcTo(x,   y,   x+w, y,   r);
        drawContext.closePath();

//      2) Uncomment this line to use Composite Operation, which is doing the
//      same as the clip function below and is also antialiasing the round
//      border, but is said to be less fast performance wise.

//      drawContext.fill();

        // Comment these two lines if choosing to do the same with composite
        // operation above 1 and 2.
        drawContext.clip();
        drawContext.clearRect(0, 0, 277, 200);

        // Restore the previous context state.
        drawContext.restore();
    };

    /**
     * Clones the given canvas.
     *
     * @return the new cloned canvas.
     */
    my.cloneCanvas = function (oldCanvas) {
        /*
         * FIXME Testing has shown that oldCanvas may not exist. In such a case,
         * the method CanvasUtil.cloneCanvas may throw an error. Since audio
         * levels are frequently updated, the errors have been observed to pile
         * into the console, strain the CPU.
         */
        if (!oldCanvas)
            return oldCanvas;

        //create a new canvas
        var newCanvas = document.createElement('canvas');
        var context = newCanvas.getContext('2d');

        //set dimensions
        newCanvas.width = oldCanvas.width;
        newCanvas.height = oldCanvas.height;

        //apply the old canvas to the new one
        context.drawImage(oldCanvas, 0, 0);

        //return the new canvas
        return newCanvas;
    };

    return my;
})(CanvasUtil || {});

module.exports = CanvasUtil;
},{}],11:[function(require,module,exports){
/* global $, APP*/

var LoginDialog = require('./LoginDialog');
var Moderator = require('../../xmpp/moderator');

/* Initial "authentication required" dialog */
var authDialog = null;
/* Loop retry ID that wits for other user to create the room */
var authRetryId = null;
var authenticationWindow = null;

var Authentication = {
    openAuthenticationDialog: function (roomName, intervalCallback, callback) {
        // This is the loop that will wait for the room to be created by
        // someone else. 'auth_required.moderator' will bring us back here.
        authRetryId = window.setTimeout(intervalCallback, 5000);
        // Show prompt only if it's not open
        if (authDialog !== null) {
            return;
        }
        // extract room name from 'room@muc.server.net'
        var room = roomName.substr(0, roomName.indexOf('@'));

        var title = APP.translation.generateTranslatonHTML("dialog.Stop");
        var msg = APP.translation.generateTranslatonHTML("dialog.AuthMsg",
            {room: room});

        var buttonTxt
            = APP.translation.generateTranslatonHTML("dialog.Authenticate");
        var buttons = [];
        buttons.push({title: buttonTxt, value: "authNow"});

        authDialog = APP.UI.messageHandler.openDialog(
            title,
            msg,
            true,
            buttons,
            function (onSubmitEvent, submitValue) {

                // Do not close the dialog yet
                onSubmitEvent.preventDefault();

                // Open login popup
                if (submitValue === 'authNow') {
                    callback();
                }
            }
        );
    },
    closeAuthenticationWindow: function () {
        if (authenticationWindow) {
            authenticationWindow.close();
            authenticationWindow = null;
        }
    },
    xmppAuthenticate: function () {

        var loginDialog = LoginDialog.show(
            function (connection, state) {
                if (!state) {
                    // User cancelled
                    loginDialog.close();
                    return;
                } else if (state == APP.xmpp.Status.CONNECTED) {

                    loginDialog.close();

                    Authentication.stopInterval();
                    Authentication.closeAuthenticationDialog();

                    // Close the connection as anonymous one will be used
                    // to create the conference. Session-id will authorize
                    // the request.
                    connection.disconnect();

                    var roomName = APP.UI.generateRoomName();
                    Moderator.allocateConferenceFocus(roomName, function () {
                        // If it's not "on the fly" authentication now join
                        // the conference room
                        if (!APP.xmpp.getMUCJoined()) {
                            APP.UI.checkForNicknameAndJoin();
                        }
                    });
                }
            }, true);
    },
    focusAuthenticationWindow: function () {
        // If auth window exists just bring it to the front
        if (authenticationWindow) {
            authenticationWindow.focus();
            return;
        }
    },
    closeAuthenticationDialog: function () {
        // Close authentication dialog if opened
        if (authDialog) {
            authDialog.close();
            authDialog = null;
        }
    },
    createAuthenticationWindow: function (callback, url) {
        authenticationWindow = APP.UI.messageHandler.openCenteredPopup(
            url, 910, 660,
            // On closed
            function () {
                // Close authentication dialog if opened
                Authentication.closeAuthenticationDialog();
                callback();
                authenticationWindow = null;
            });
        return authenticationWindow;
    },
    stopInterval: function () {
        // Clear retry interval, so that we don't call 'doJoinAfterFocus' twice
        if (authRetryId) {
            window.clearTimeout(authRetryId);
            authRetryId = null;
        }
    }
};

module.exports = Authentication;
},{"../../xmpp/moderator":53,"./LoginDialog":12}],12:[function(require,module,exports){
/* global $, APP, config*/

var XMPP = require('../../xmpp/xmpp');
var Moderator = require('../../xmpp/moderator');

//FIXME: use LoginDialog to add retries to XMPP.connect method used when
// anonymous domain is not enabled

/**
 * Creates new <tt>Dialog</tt> instance.
 * @param callback <tt>function(Strophe.Connection, Strophe.Status)</tt> called
 *        when we either fail to connect or succeed(check Strophe.Status).
 * @param obtainSession <tt>true</tt> if we want to send ConferenceIQ to Jicofo
 *        in order to create session-id after the connection is established.
 * @constructor
 */
function Dialog(callback, obtainSession) {

    var self = this;

    var stop = false;

    var connection = APP.xmpp.createConnection();

    var message = '<h2 data-i18n="dialog.passwordRequired">';
    message += APP.translation.translateString("dialog.passwordRequired");
    message += '</h2>' +
        '<input name="username" type="text" ' +
        'placeholder="user@domain.net" autofocus>' +
        '<input name="password" ' +
        'type="password" data-i18n="[placeholder]dialog.userPassword"' +
        ' placeholder="user password">';

    var okButton = APP.translation.generateTranslatonHTML("dialog.Ok");

    var cancelButton = APP.translation.generateTranslatonHTML("dialog.Cancel");

    var states = {
        login: {
            html: message,
            buttons: [
                { title: okButton, value: true},
                { title: cancelButton, value: false}
            ],
            focus: ':input:first',
            submit: function (e, v, m, f) {
                e.preventDefault();
                if (v) {
                    var jid = f.username;
                    var password = f.password;
                    if (jid && password) {
                        stop = false;
                        connection.reset();
                        connDialog.goToState('connecting');
                        connection.connect(jid, password, stateHandler);
                    }
                } else {
                    // User cancelled
                    stop = true;
                    callback();
                }
            }
        },
        connecting: {
            title: APP.translation.translateString('dialog.connecting'),
            html:   '<div id="connectionStatus"></div>',
            buttons: [],
            defaultButton: 0
        },
        finished: {
            title: APP.translation.translateString('dialog.error'),
            html:   '<div id="errorMessage"></div>',
            buttons: [
                {
                    title: APP.translation.translateString('dialog.retry'),
                    value: 'retry'
                },
                {
                    title: APP.translation.translateString('dialog.Cancel'),
                    value: 'cancel'
                },
            ],
            defaultButton: 0,
            submit: function (e, v, m, f) {
                e.preventDefault();
                if (v === 'retry')
                    connDialog.goToState('login');
                else
                    callback();
            }
        }
    };

    var connDialog
        = APP.UI.messageHandler.openDialogWithStates(states,
                { persistent: true, closeText: '' }, null);

    var stateHandler = function (status, message) {
        if (stop) {
            return;
        }

        var translateKey = "connection." + XMPP.getStatusString(status);
        var statusStr = APP.translation.translateString(translateKey);

        // Display current state
        var connectionStatus =
            connDialog.getState('connecting').find('#connectionStatus');

        connectionStatus.text(statusStr);

        switch (status) {
            case XMPP.Status.CONNECTED:

                stop = true;
                if (!obtainSession) {
                    callback(connection, status);
                    return;
                }
                // Obtaining session-id status
                connectionStatus.text(
                    APP.translation.translateString(
                        'connection.FETCH_SESSION_ID'));

                // Authenticate with Jicofo and obtain session-id
                var roomName = APP.UI.generateRoomName();

                // Jicofo will return new session-id when connected
                // from authenticated domain
                connection.sendIQ(
                    Moderator.createConferenceIq(roomName),
                    function (result) {

                        connectionStatus.text(
                            APP.translation.translateString(
                                'connection.GOT_SESSION_ID'));

                        stop = true;

                        // Parse session-id
                        Moderator.parseSessionId(result);

                        callback(connection, status);
                    },
                    function (error) {
                        console.error("Auth on the fly failed", error);

                        stop = true;

                        var errorMsg =
                            APP.translation.translateString(
                                'connection.GET_SESSION_ID_ERROR') +
                                $(error).find('>error').attr('code');

                        self.displayError(errorMsg);

                        connection.disconnect();
                    });

                break;
            case XMPP.Status.AUTHFAIL:
            case XMPP.Status.CONNFAIL:
            case XMPP.Status.DISCONNECTED:

                stop = true;

                callback(connection, status);

                var errorMessage = statusStr;

                if (message)
                {
                    errorMessage += ': ' + message;
                }
                self.displayError(errorMessage);

                break;
            default:
                break;
        }
    };

    /**
     * Displays error message in 'finished' state which allows either to cancel
     * or retry.
     * @param message the final message to be displayed.
     */
    this.displayError = function (message) {

        var finishedState = connDialog.getState('finished');

        var errorMessageElem = finishedState.find('#errorMessage');
        errorMessageElem.text(message);

        connDialog.goToState('finished');
    };

    /**
     * Closes LoginDialog.
     */
    this.close = function () {
        stop = true;
        connDialog.close();
    };
}

var LoginDialog = {

    /**
     * Displays login prompt used to establish new XMPP connection. Given
     * <tt>callback(Strophe.Connection, Strophe.Status)</tt> function will be
     * called when we connect successfully(status === CONNECTED) or when we fail
     * to do so. On connection failure program can call Dialog.close() method in
     * order to cancel or do nothing to let the user retry.
     * @param callback <tt>function(Strophe.Connection, Strophe.Status)</tt>
     *        called when we either fail to connect or succeed(check
     *        Strophe.Status).
     * @param obtainSession <tt>true</tt> if we want to send ConferenceIQ to
     *        Jicofo in order to create session-id after the connection is
     *        established.
     * @returns {Dialog}
     */
    show: function (callback, obtainSession) {
        return new Dialog(callback, obtainSession);
    }
};

module.exports = LoginDialog;
},{"../../xmpp/moderator":53,"../../xmpp/xmpp":61}],13:[function(require,module,exports){
var Settings = require("../../settings/Settings");
var MediaStreamType = require("../../../service/RTC/MediaStreamTypes");

var users = {};
var activeSpeakerJid;

function setVisibility(selector, show) {
    if (selector && selector.length > 0) {
        selector.css("visibility", show ? "visible" : "hidden");
    }
}

function isUserMuted(jid) {
    // XXX(gp) we may want to rename this method to something like
    // isUserStreaming, for example.
    if (jid && jid != APP.xmpp.myJid()) {
        var resource = Strophe.getResourceFromJid(jid);
        if (!require("../videolayout/VideoLayout").isInLastN(resource)) {
            return true;
        }
    }

    if (!APP.RTC.remoteStreams[jid] || !APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE]) {
        return null;
    }
    return APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE].muted;
}

function getGravatarUrl(id, size) {
    if(id === APP.xmpp.myJid() || !id) {
        id = Settings.getSettings().uid;
    }
    return 'https://www.gravatar.com/avatar/' +
        MD5.hexdigest(id.trim().toLowerCase()) +
        "?d=wavatar&size=" + (size || "30");
}

var Avatar = {

    /**
     * Sets the user's avatar in the settings menu(if local user), contact list
     * and thumbnail
     * @param jid jid of the user
     * @param id email or userID to be used as a hash
     */
    setUserAvatar: function (jid, id) {
        if (id) {
            if (users[jid] === id) {
                return;
            }
            users[jid] = id;
        }
        var thumbUrl = getGravatarUrl(users[jid] || jid, 100);
        var contactListUrl = getGravatarUrl(users[jid] || jid);
        var resourceJid = Strophe.getResourceFromJid(jid);
        var thumbnail = $('#participant_' + resourceJid);
        var avatar = $('#avatar_' + resourceJid);

        // set the avatar in the settings menu if it is local user and get the
        // local video container
        if (jid === APP.xmpp.myJid()) {
            $('#avatar').get(0).src = thumbUrl;
            thumbnail = $('#localVideoContainer');
        }

        // set the avatar in the contact list
        var contact = $('#' + resourceJid + '>img');
        if (contact && contact.length > 0) {
            contact.get(0).src = contactListUrl;
        }

        // set the avatar in the thumbnail
        if (avatar && avatar.length > 0) {
            avatar[0].src = thumbUrl;
        } else {
            if (thumbnail && thumbnail.length > 0) {
                avatar = document.createElement('img');
                avatar.id = 'avatar_' + resourceJid;
                avatar.className = 'userAvatar';
                avatar.src = thumbUrl;
                thumbnail.append(avatar);
            }
        }

        //if the user is the current active speaker - update the active speaker
        // avatar
        if (jid === activeSpeakerJid) {
            this.updateActiveSpeakerAvatarSrc(jid);
        }
    },

    /**
     * Hides or shows the user's avatar
     * @param jid jid of the user
     * @param show whether we should show the avatar or not
     * video because there is no dominant speaker and no focused speaker
     */
    showUserAvatar: function (jid, show) {
        if (users[jid]) {
            var resourceJid = Strophe.getResourceFromJid(jid);
            var video = $('#participant_' + resourceJid + '>video');
            var avatar = $('#avatar_' + resourceJid);

            if (jid === APP.xmpp.myJid()) {
                video = $('#localVideoWrapper>video');
            }
            if (show === undefined || show === null) {
                show = isUserMuted(jid);
            }

            //if the user is the currently focused, the dominant speaker or if
            //there is no focused and no dominant speaker and the large video is
            //currently shown
            if (activeSpeakerJid === jid && require("../videolayout/VideoLayout").isLargeVideoOnTop()) {
                setVisibility($("#largeVideo"), !show);
                setVisibility($('#activeSpeaker'), show);
                setVisibility(avatar, false);
                setVisibility(video, false);
            } else {
                if (video && video.length > 0) {
                    setVisibility(video, !show);
                    setVisibility(avatar, show);
                }
            }
        }
    },

    /**
     * Updates the src of the active speaker avatar
     * @param jid of the current active speaker
     */
    updateActiveSpeakerAvatarSrc: function (jid) {
        if (!jid) {
            jid = APP.xmpp.findJidFromResource(
                require("../videolayout/VideoLayout").getLargeVideoState().userResourceJid);
        }
        var avatar = $("#activeSpeakerAvatar")[0];
        var url = getGravatarUrl(users[jid],
            interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE);
        if (jid === activeSpeakerJid && avatar.src === url) {
            return;
        }
        activeSpeakerJid = jid;
        var isMuted = isUserMuted(jid);
        if (jid && isMuted !== null) {
            avatar.src = url;
            setVisibility($("#largeVideo"), !isMuted);
            Avatar.showUserAvatar(jid, isMuted);
        }
    }

};


module.exports = Avatar;
},{"../../../service/RTC/MediaStreamTypes":88,"../../settings/Settings":38,"../videolayout/VideoLayout":32}],14:[function(require,module,exports){
/* global $, config,
   setLargeVideoVisible, Util */

var VideoLayout = require("../videolayout/VideoLayout");
var Prezi = require("../prezi/Prezi");
var UIUtil = require("../util/UIUtil");

var etherpadName = null;
var etherpadIFrame = null;
var domain = null;
var options = "?showControls=true&showChat=false&showLineNumbers=true&useMonospaceFont=false";


/**
 * Resizes the etherpad.
 */
function resize() {
    if ($('#etherpad>iframe').length) {
        var remoteVideos = $('#remoteVideos');
        var availableHeight
            = window.innerHeight - remoteVideos.outerHeight();
        var availableWidth = UIUtil.getAvailableVideoWidth();

        $('#etherpad>iframe').width(availableWidth);
        $('#etherpad>iframe').height(availableHeight);
    }
}

/**
 * Shares the Etherpad name with other participants.
 */
function shareEtherpad() {
    APP.xmpp.addToPresence("etherpad", etherpadName);
}

/**
 * Creates the Etherpad button and adds it to the toolbar.
 */
function enableEtherpadButton() {
    if (!$('#etherpadButton').is(":visible"))
        $('#etherpadButton').css({display: 'inline-block'});
}

/**
 * Creates the IFrame for the etherpad.
 */
function createIFrame() {
    etherpadIFrame = document.createElement('iframe');
    etherpadIFrame.src = domain + etherpadName + options;
    etherpadIFrame.frameBorder = 0;
    etherpadIFrame.scrolling = "no";
    etherpadIFrame.width = $('#largeVideoContainer').width() || 640;
    etherpadIFrame.height = $('#largeVideoContainer').height() || 480;
    etherpadIFrame.setAttribute('style', 'visibility: hidden;');

    document.getElementById('etherpad').appendChild(etherpadIFrame);

    etherpadIFrame.onload = function() {

        document.domain = document.domain;
        bubbleIframeMouseMove(etherpadIFrame);
        setTimeout(function() {
            // the iframes inside of the etherpad are
            // not yet loaded when the etherpad iframe is loaded
            var outer = etherpadIFrame.
                contentDocument.getElementsByName("ace_outer")[0];
            bubbleIframeMouseMove(outer);
            var inner = outer.
                contentDocument.getElementsByName("ace_inner")[0];
            bubbleIframeMouseMove(inner);
        }, 2000);
    };
}

function bubbleIframeMouseMove(iframe){
    var existingOnMouseMove = iframe.contentWindow.onmousemove;
    iframe.contentWindow.onmousemove = function(e){
        if(existingOnMouseMove) existingOnMouseMove(e);
        var evt = document.createEvent("MouseEvents");
        var boundingClientRect = iframe.getBoundingClientRect();
        evt.initMouseEvent(
            "mousemove",
            true, // bubbles
            false, // not cancelable
            window,
            e.detail,
            e.screenX,
            e.screenY,
                e.clientX + boundingClientRect.left,
                e.clientY + boundingClientRect.top,
            e.ctrlKey,
            e.altKey,
            e.shiftKey,
            e.metaKey,
            e.button,
            null // no related element
        );
        iframe.dispatchEvent(evt);
    };
}


/**
 * On video selected event.
 */
$(document).bind('video.selected', function (event, isPresentation) {
    if (config.etherpad_base && etherpadIFrame && etherpadIFrame.style.visibility !== 'hidden')
        Etherpad.toggleEtherpad(isPresentation);
});


var Etherpad = {
    /**
     * Initializes the etherpad.
     */
    init: function (name) {

        if (config.etherpad_base && !etherpadName) {

            domain = config.etherpad_base;

            if (!name) {
                // In case we're the focus we generate the name.
                etherpadName = Math.random().toString(36).substring(7) +
                                '_' + (new Date().getTime()).toString();
                shareEtherpad();
            }
            else
                etherpadName = name;

            enableEtherpadButton();

            /**
             * Resizes the etherpad, when the window is resized.
             */
            $(window).resize(function () {
                resize();
            });
        }
    },

    /**
     * Opens/hides the Etherpad.
     */
    toggleEtherpad: function (isPresentation) {
        if (!etherpadIFrame)
            createIFrame();

        var largeVideo = null;
        if (Prezi.isPresentationVisible())
            largeVideo = $('#presentation>iframe');
        else
            largeVideo = $('#largeVideo');

        if ($('#etherpad>iframe').css('visibility') === 'hidden') {
            $('#activeSpeaker').css('visibility', 'hidden');
            largeVideo.fadeOut(300, function () {
                if (Prezi.isPresentationVisible()) {
                    largeVideo.css({opacity: '0'});
                } else {
                    VideoLayout.setLargeVideoVisible(false);
                }
            });

            $('#etherpad>iframe').fadeIn(300, function () {
                document.body.style.background = '#eeeeee';
                $('#etherpad>iframe').css({visibility: 'visible'});
                $('#etherpad').css({zIndex: 2});
            });
        }
        else if ($('#etherpad>iframe')) {
            $('#etherpad>iframe').fadeOut(300, function () {
                $('#etherpad>iframe').css({visibility: 'hidden'});
                $('#etherpad').css({zIndex: 0});
                document.body.style.background = 'black';
            });

            if (!isPresentation) {
                $('#largeVideo').fadeIn(300, function () {
                    VideoLayout.setLargeVideoVisible(true);
                });
            }
        }
        resize();
    },

    isVisible: function() {
        var etherpadIframe = $('#etherpad>iframe');
        return etherpadIframe && etherpadIframe.is(':visible');
    }

};

module.exports = Etherpad;

},{"../prezi/Prezi":15,"../util/UIUtil":30,"../videolayout/VideoLayout":32}],15:[function(require,module,exports){
var ToolbarToggler = require("../toolbars/ToolbarToggler");
var UIUtil = require("../util/UIUtil");
var VideoLayout = require("../videolayout/VideoLayout");
var messageHandler = require("../util/MessageHandler");
var PreziPlayer = require("./PreziPlayer");

var preziPlayer = null;

var Prezi = {


    /**
     * Reloads the current presentation.
     */
    reloadPresentation: function() {
        var iframe = document.getElementById(preziPlayer.options.preziId);
        iframe.src = iframe.src;
    },

    /**
     * Returns <tt>true</tt> if the presentation is visible, <tt>false</tt> -
     * otherwise.
     */
    isPresentationVisible: function () {
        return ($('#presentation>iframe') != null
                && $('#presentation>iframe').css('opacity') == 1);
    },

    /**
     * Opens the Prezi dialog, from which the user could choose a presentation
     * to load.
     */
    openPreziDialog: function() {
        var myprezi = APP.xmpp.getPrezi();
        if (myprezi) {
            messageHandler.openTwoButtonDialog("dialog.removePreziTitle",
                null,
                "dialog.removePreziMsg",
                null,
                false,
                "dialog.Remove",
                function(e,v,m,f) {
                    if(v) {
                        APP.xmpp.removePreziFromPresence();
                    }
                }
            );
        }
        else if (preziPlayer != null) {
            messageHandler.openTwoButtonDialog("dialog.sharePreziTitle",
                null, "dialog.sharePreziMsg",
                null,
                false,
                "dialog.Ok",
                function(e,v,m,f) {
                    $.prompt.close();
                }
            );
        }
        else {
            var html = APP.translation.generateTranslatonHTML(
                "dialog.sharePreziTitle");
            var cancelButton = APP.translation.generateTranslatonHTML(
                "dialog.Cancel");
            var shareButton = APP.translation.generateTranslatonHTML(
                "dialog.Share");
            var backButton = APP.translation.generateTranslatonHTML(
                "dialog.Back");
            var buttons = [];
            var buttons1 = [];
            // Cancel button to both states
            buttons.push({title: cancelButton, value: false});
            buttons1.push({title: cancelButton, value: false});
            // Share button
            buttons.push({title: shareButton, value: true});
            // Back button
            buttons1.push({title: backButton, value: true});
            var linkError = APP.translation.generateTranslatonHTML(
                "dialog.preziLinkError");
            var defaultUrl = APP.translation.translateString("defaultPreziLink",
                {url: "http://prezi.com/wz7vhjycl7e6/my-prezi"});
            var openPreziState = {
                state0: {
                    html:   '<h2>' + html + '</h2>' +
                            '<input name="preziUrl" type="text" ' +
                            'data-i18n="[placeholder]defaultPreziLink" data-i18n-options=\'' +
                            JSON.stringify({"url": "http://prezi.com/wz7vhjycl7e6/my-prezi"}) +
                            '\' placeholder="' + defaultUrl + '" autofocus>',
                    persistent: false,
                    buttons: buttons,
                    focus: ':input:first',
                    defaultButton: 0,
                    submit: function (e, v, m, f) {
                        e.preventDefault();
                        if(v)
                        {
                            var preziUrl = f.preziUrl;

                            if (preziUrl)
                            {
                                var urlValue
                                    = encodeURI(UIUtil.escapeHtml(preziUrl));

                                if (urlValue.indexOf('http://prezi.com/') != 0
                                    && urlValue.indexOf('https://prezi.com/') != 0)
                                {
                                    $.prompt.goToState('state1');
                                    return false;
                                }
                                else {
                                    var presIdTmp = urlValue.substring(
                                            urlValue.indexOf("prezi.com/") + 10);
                                    if (!isAlphanumeric(presIdTmp)
                                            || presIdTmp.indexOf('/') < 2) {
                                        $.prompt.goToState('state1');
                                        return false;
                                    }
                                    else {
                                        APP.xmpp.addToPresence("prezi", urlValue);
                                        $.prompt.close();
                                    }
                                }
                            }
                        }
                        else
                            $.prompt.close();
                    }
                },
                state1: {
                    html:   '<h2>' + html + '</h2>' +
                            linkError,
                    persistent: false,
                    buttons: buttons1,
                    focus: ':input:first',
                    defaultButton: 1,
                    submit: function (e, v, m, f) {
                        e.preventDefault();
                        if (v === 0)
                            $.prompt.close();
                        else
                            $.prompt.goToState('state0');
                    }
                }
            };
            messageHandler.openDialogWithStates(openPreziState);
        }
    }

};

/**
 * A new presentation has been added.
 *
 * @param event the event indicating the add of a presentation
 * @param jid the jid from which the presentation was added
 * @param presUrl url of the presentation
 * @param currentSlide the current slide to which we should move
 */
function presentationAdded(event, jid, presUrl, currentSlide) {
    console.log("presentation added", presUrl);

    var presId = getPresentationId(presUrl);

    var elementId = 'participant_'
        + Strophe.getResourceFromJid(jid)
        + '_' + presId;

    // We explicitly don't specify the peer jid here, because we don't want
    // this video to be dealt with as a peer related one (for example we
    // don't want to show a mute/kick menu for this one, etc.).
    VideoLayout.addRemoteVideoContainer(null, elementId);
    VideoLayout.resizeThumbnails();

    var controlsEnabled = false;
    if (jid === APP.xmpp.myJid())
        controlsEnabled = true;

    setPresentationVisible(true);
    $('#largeVideoContainer').hover(
        function (event) {
            if (Prezi.isPresentationVisible()) {
                var reloadButtonRight = window.innerWidth
                    - $('#presentation>iframe').offset().left
                    - $('#presentation>iframe').width();

                $('#reloadPresentation').css({  right: reloadButtonRight,
                    display:'inline-block'});
            }
        },
        function (event) {
            if (!Prezi.isPresentationVisible())
                $('#reloadPresentation').css({display:'none'});
            else {
                var e = event.toElement || event.relatedTarget;

                if (e && e.id != 'reloadPresentation' && e.id != 'header')
                    $('#reloadPresentation').css({display:'none'});
            }
        });

    preziPlayer = new PreziPlayer(
        'presentation',
        {preziId: presId,
            width: getPresentationWidth(),
            height: getPresentationHeihgt(),
            controls: controlsEnabled,
            debug: true
        });

    $('#presentation>iframe').attr('id', preziPlayer.options.preziId);

    preziPlayer.on(PreziPlayer.EVENT_STATUS, function(event) {
        console.log("prezi status", event.value);
        if (event.value == PreziPlayer.STATUS_CONTENT_READY) {
            if (jid != APP.xmpp.myJid())
                preziPlayer.flyToStep(currentSlide);
        }
    });

    preziPlayer.on(PreziPlayer.EVENT_CURRENT_STEP, function(event) {
        console.log("event value", event.value);
        APP.xmpp.addToPresence("preziSlide", event.value);
    });

    $("#" + elementId).css( 'background-image',
        'url(../images/avatarprezi.png)');
    $("#" + elementId).click(
        function () {
            setPresentationVisible(true);
        }
    );
};

/**
 * A presentation has been removed.
 *
 * @param event the event indicating the remove of a presentation
 * @param jid the jid for which the presentation was removed
 * @param the url of the presentation
 */
function presentationRemoved(event, jid, presUrl) {
    console.log('presentation removed', presUrl);
    var presId = getPresentationId(presUrl);
    setPresentationVisible(false);
    $('#participant_'
        + Strophe.getResourceFromJid(jid)
        + '_' + presId).remove();
    $('#presentation>iframe').remove();
    if (preziPlayer != null) {
        preziPlayer.destroy();
        preziPlayer = null;
    }
};

/**
 * Indicates if the given string is an alphanumeric string.
 * Note that some special characters are also allowed (-, _ , /, &, ?, =, ;) for the
 * purpose of checking URIs.
 */
function isAlphanumeric(unsafeText) {
    var regex = /^[a-z0-9-_\/&\?=;]+$/i;
    return regex.test(unsafeText);
}

/**
 * Returns the presentation id from the given url.
 */
function getPresentationId (presUrl) {
    var presIdTmp = presUrl.substring(presUrl.indexOf("prezi.com/") + 10);
    return presIdTmp.substring(0, presIdTmp.indexOf('/'));
}

/**
 * Returns the presentation width.
 */
function getPresentationWidth() {
    var availableWidth = UIUtil.getAvailableVideoWidth();
    var availableHeight = getPresentationHeihgt();

    var aspectRatio = 16.0 / 9.0;
    if (availableHeight < availableWidth / aspectRatio) {
        availableWidth = Math.floor(availableHeight * aspectRatio);
    }
    return availableWidth;
}

/**
 * Returns the presentation height.
 */
function getPresentationHeihgt() {
    var remoteVideos = $('#remoteVideos');
    return window.innerHeight - remoteVideos.outerHeight();
}

/**
 * Resizes the presentation iframe.
 */
function resize() {
    if ($('#presentation>iframe')) {
        $('#presentation>iframe').width(getPresentationWidth());
        $('#presentation>iframe').height(getPresentationHeihgt());
    }
}

/**
 * Shows/hides a presentation.
 */
function setPresentationVisible(visible) {
    var prezi = $('#presentation>iframe');
    if (visible) {
        // Trigger the video.selected event to indicate a change in the
        // large video.
        $(document).trigger("video.selected", [true]);

        $('#largeVideo').fadeOut(300);
        prezi.fadeIn(300, function() {
            prezi.css({opacity:'1'});
            ToolbarToggler.dockToolbar(true);
            VideoLayout.setLargeVideoVisible(false);
        });
        $('#activeSpeaker').css('visibility', 'hidden');
    }
    else {
        if (prezi.css('opacity') == '1') {
            prezi.fadeOut(300, function () {
                prezi.css({opacity:'0'});
                $('#reloadPresentation').css({display:'none'});
                $('#largeVideo').fadeIn(300, function() {
                    VideoLayout.setLargeVideoVisible(true);
                    ToolbarToggler.dockToolbar(false);
                });
            });
        }
    }
}

/**
 * Presentation has been removed.
 */
$(document).bind('presentationremoved.muc', presentationRemoved);

/**
 * Presentation has been added.
 */
$(document).bind('presentationadded.muc', presentationAdded);

/*
 * Indicates presentation slide change.
 */
$(document).bind('gotoslide.muc', function (event, jid, presUrl, current) {
    if (preziPlayer && preziPlayer.getCurrentStep() != current) {
        preziPlayer.flyToStep(current);

        var animationStepsArray = preziPlayer.getAnimationCountOnSteps();
        for (var i = 0; i < parseInt(animationStepsArray[current]); i++) {
            preziPlayer.flyToStep(current, i);
        }
    }
});

/**
 * On video selected event.
 */
$(document).bind('video.selected', function (event, isPresentation) {
    if (!isPresentation && $('#presentation>iframe')) {
        setPresentationVisible(false);
    }
});

$(window).resize(function () {
    resize();
});

module.exports = Prezi;

},{"../toolbars/ToolbarToggler":26,"../util/MessageHandler":28,"../util/UIUtil":30,"../videolayout/VideoLayout":32,"./PreziPlayer":16}],16:[function(require,module,exports){
(function() {
    "use strict";
    var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

    window.PreziPlayer = (function() {

        PreziPlayer.API_VERSION = 1;
        PreziPlayer.CURRENT_STEP = 'currentStep';
        PreziPlayer.CURRENT_ANIMATION_STEP = 'currentAnimationStep';
        PreziPlayer.CURRENT_OBJECT = 'currentObject';
        PreziPlayer.STATUS_LOADING = 'loading';
        PreziPlayer.STATUS_READY = 'ready';
        PreziPlayer.STATUS_CONTENT_READY = 'contentready';
        PreziPlayer.EVENT_CURRENT_STEP = "currentStepChange";
        PreziPlayer.EVENT_CURRENT_ANIMATION_STEP = "currentAnimationStepChange";
        PreziPlayer.EVENT_CURRENT_OBJECT = "currentObjectChange";
        PreziPlayer.EVENT_STATUS = "statusChange";
        PreziPlayer.EVENT_PLAYING = "isAutoPlayingChange";
        PreziPlayer.EVENT_IS_MOVING = "isMovingChange";
        PreziPlayer.domain = "https://prezi.com";
        PreziPlayer.path = "/player/";
        PreziPlayer.players = {};
        PreziPlayer.binded_methods = ['changesHandler'];

        PreziPlayer.createMultiplePlayers = function(optionArray){
            for(var i=0; i<optionArray.length; i++) {
                var optionSet = optionArray[i];
                new PreziPlayer(optionSet.id, optionSet);
            };
        };

        PreziPlayer.messageReceived = function(event){
            var message, item, player;
            try {
                message = JSON.parse(event.data);
                if (message.id && (player = PreziPlayer.players[message.id])) {
                    if (player.options.debug === true) {
                        if (console && console.log)
                            console.log('received', message);
                    }
                    if (message.type === "changes") {
                        player.changesHandler(message);
                    }
                    for (var i = 0; i < player.callbacks.length; i++) {
                        item = player.callbacks[i];
                        if (item && message.type === item.event) {
                            item.callback(message);
                        }
                    }
                }
            } catch (e) { }
        };

        function PreziPlayer(id, options) {
            var params, paramString = "", _this = this;
            if (PreziPlayer.players[id]){
                PreziPlayer.players[id].destroy();
            }
            for(var i=0; i<PreziPlayer.binded_methods.length; i++) {
                var method_name = PreziPlayer.binded_methods[i];
                _this[method_name] = __bind(_this[method_name], _this);
            };
            options = options || {};
            this.options = options;
            this.values = {'status': PreziPlayer.STATUS_LOADING};
            this.values[PreziPlayer.CURRENT_STEP] = 0;
            this.values[PreziPlayer.CURRENT_ANIMATION_STEP] = 0;
            this.values[PreziPlayer.CURRENT_OBJECT] = null;
            this.callbacks = [];
            this.id = id;
            this.embedTo = document.getElementById(id);
            if (!this.embedTo) {
                throw "The element id is not available.";
            }
            this.iframe = document.createElement('iframe');
            params = [
                { name: 'oid', value: options.preziId },
                { name: 'explorable', value: options.explorable ? 1 : 0 },
                { name: 'controls', value: options.controls ? 1 : 0 }
            ];
            for(var i=0; i<params.length; i++) {
                var param = params[i];
                paramString += (i===0 ? "?" : "&") + param.name + "=" + param.value;
            };
            this.iframe.src = PreziPlayer.domain + PreziPlayer.path + paramString;
            this.iframe.frameBorder = 0;
            this.iframe.scrolling = "no";
            this.iframe.width = options.width || 640;
            this.iframe.height = options.height || 480;
            this.embedTo.innerHTML = '';
            // JITSI: IN CASE SOMETHING GOES WRONG.
            try {
                this.embedTo.appendChild(this.iframe);
            }
            catch (err) {
                console.log("CATCH ERROR");
            }

            // JITSI: Increase interval from 200 to 500, which fixes prezi
            // crashes for us.
            this.initPollInterval = setInterval(function(){
                _this.sendMessage({'action': 'init'});
            }, 500);
            PreziPlayer.players[id] = this;
        }

        PreziPlayer.prototype.changesHandler = function(message) {
            var key, value, j, item;
            if (this.initPollInterval) {
                clearInterval(this.initPollInterval);
                this.initPollInterval = false;
            }
            for (key in message.data) {
                if (message.data.hasOwnProperty(key)){
                    value = message.data[key];
                    this.values[key] = value;
                    for (j=0; j<this.callbacks.length; j++) {
                        item = this.callbacks[j];
                        if (item && item.event === key + "Change"){
                            item.callback({type: item.event, value: value});
                        }
                    }
                }
            }
        };

        PreziPlayer.prototype.destroy = function() {
            if (this.initPollInterval) {
                clearInterval(this.initPollInterval);
                this.initPollInterval = false;
            }
            this.embedTo.innerHTML = '';
        };

        PreziPlayer.prototype.sendMessage = function(message) {
            if (this.options.debug === true) {
                if (console && console.log) console.log('sent', message);
            }
            message.version = PreziPlayer.API_VERSION;
            message.id = this.id;
            return this.iframe.contentWindow.postMessage(JSON.stringify(message), '*');
        };

        PreziPlayer.prototype.nextStep = /* nextStep is DEPRECATED */
        PreziPlayer.prototype.flyToNextStep = function() {
            return this.sendMessage({
                'action': 'present',
                'data': ['moveToNextStep']
            });
        };

        PreziPlayer.prototype.previousStep = /* previousStep is DEPRECATED */
        PreziPlayer.prototype.flyToPreviousStep = function() {
            return this.sendMessage({
                'action': 'present',
                'data': ['moveToPrevStep']
            });
        };

        PreziPlayer.prototype.toStep = /* toStep is DEPRECATED */
        PreziPlayer.prototype.flyToStep = function(step, animation_step) {
            var obj = this;
            // check animation_step
            if (animation_step > 0 &&
                obj.values.animationCountOnSteps &&
                obj.values.animationCountOnSteps[step] <= animation_step) {
                animation_step = obj.values.animationCountOnSteps[step];
            }
            // jump to animation steps by calling flyToNextStep()
            function doAnimationSteps() {
                if (obj.values.isMoving == true) {
                    setTimeout(doAnimationSteps, 100); // wait until the flight ends
                    return;
                }
                while (animation_step-- > 0) {
                    obj.flyToNextStep(); // do the animation steps
                }
            }
            setTimeout(doAnimationSteps, 200); // 200ms is the internal "reporting" time
            // jump to the step
            return this.sendMessage({
                'action': 'present',
                'data': ['moveToStep', step]
            });
        };

        PreziPlayer.prototype.toObject = /* toObject is DEPRECATED */
        PreziPlayer.prototype.flyToObject = function(objectId) {
            return this.sendMessage({
                'action': 'present',
                'data': ['moveToObject', objectId]
            });
        };

        PreziPlayer.prototype.play = function(defaultDelay) {
            return this.sendMessage({
                'action': 'present',
                'data': ['startAutoPlay', defaultDelay]
            });
        };

        PreziPlayer.prototype.stop = function() {
            return this.sendMessage({
                'action': 'present',
                'data': ['stopAutoPlay']
            });
        };

        PreziPlayer.prototype.pause = function(defaultDelay) {
            return this.sendMessage({
                'action': 'present',
                'data': ['pauseAutoPlay', defaultDelay]
            });
        };

        PreziPlayer.prototype.getCurrentStep = function() {
            return this.values.currentStep;
        };

        PreziPlayer.prototype.getCurrentAnimationStep = function() {
            return this.values.currentAnimationStep;
        };

        PreziPlayer.prototype.getCurrentObject = function() {
            return this.values.currentObject;
        };

        PreziPlayer.prototype.getStatus = function() {
            return this.values.status;
        };

        PreziPlayer.prototype.isPlaying = function() {
            return this.values.isAutoPlaying;
        };

        PreziPlayer.prototype.getStepCount = function() {
            return this.values.stepCount;
        };

        PreziPlayer.prototype.getAnimationCountOnSteps = function() {
            return this.values.animationCountOnSteps;
        };

        PreziPlayer.prototype.getTitle = function() {
            return this.values.title;
        };

        PreziPlayer.prototype.setDimensions = function(dims) {
            for (var parameter in dims) {
                this.iframe[parameter] = dims[parameter];
            }
        }

        PreziPlayer.prototype.getDimensions = function() {
            return {
                width: parseInt(this.iframe.width, 10),
                height: parseInt(this.iframe.height, 10)
            }
        }

        PreziPlayer.prototype.on = function(event, callback) {
            this.callbacks.push({
                event: event,
                callback: callback
            });
        };

        PreziPlayer.prototype.off = function(event, callback) {
            var j, item;
            if (event === undefined) {
                this.callbacks = [];
            }
            j = this.callbacks.length;
            while (j--) {
                item = this.callbacks[j];
                if (item && item.event === event && (callback === undefined || item.callback === callback)){
                    this.callbacks.splice(j, 1);
                }
            }
        };

        if (window.addEventListener) {
            window.addEventListener('message', PreziPlayer.messageReceived, false);
        } else {
            window.attachEvent('onmessage', PreziPlayer.messageReceived);
        }

        return PreziPlayer;

    })();

})();

module.exports = PreziPlayer;

},{}],17:[function(require,module,exports){
var Chat = require("./chat/Chat");
var ContactList = require("./contactlist/ContactList");
var Settings = require("./../../settings/Settings");
var SettingsMenu = require("./settings/SettingsMenu");
var VideoLayout = require("../videolayout/VideoLayout");
var ToolbarToggler = require("../toolbars/ToolbarToggler");
var UIUtil = require("../util/UIUtil");

/**
 * Toggler for the chat, contact list, settings menu, etc..
 */
var PanelToggler = (function(my) {

    var currentlyOpen = null;
    var buttons = {
        '#chatspace': '#chatBottomButton',
        '#contactlist': '#contactListButton',
        '#settingsmenu': '#settingsButton'
    };

    /**
     * Resizes the video area
     * @param isClosing whether the side panel is going to be closed or is going to open / remain opened
     * @param completeFunction a function to be called when the video space is resized
     */
    var resizeVideoArea = function(isClosing, completeFunction) {
        var videospace = $('#videospace');

        var panelSize = isClosing ? [0, 0] : PanelToggler.getPanelSize();
        var videospaceWidth = window.innerWidth - panelSize[0];
        var videospaceHeight = window.innerHeight;
        var videoSize
            = VideoLayout.getVideoSize(null, null, videospaceWidth, videospaceHeight);
        var videoWidth = videoSize[0];
        var videoHeight = videoSize[1];
        var videoPosition = VideoLayout.getVideoPosition(videoWidth,
            videoHeight,
            videospaceWidth,
            videospaceHeight);
        var horizontalIndent = videoPosition[0];
        var verticalIndent = videoPosition[1];

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videospaceWidth);
        var thumbnailsWidth = thumbnailSize[0];
        var thumbnailsHeight = thumbnailSize[1];
        //for chat

        videospace.animate({
                right: panelSize[0],
                width: videospaceWidth,
                height: videospaceHeight
            },
            {
                queue: false,
                duration: 500,
                complete: completeFunction
            });

        $('#remoteVideos').animate({
                height: thumbnailsHeight
            },
            {
                queue: false,
                duration: 500
            });

        $('#remoteVideos>span').animate({
                height: thumbnailsHeight,
                width: thumbnailsWidth
            },
            {
                queue: false,
                duration: 500,
                complete: function () {
                    $(document).trigger(
                        "remotevideo.resized",
                        [thumbnailsWidth,
                            thumbnailsHeight]);
                }
            });

        $('#largeVideoContainer').animate({
                width: videospaceWidth,
                height: videospaceHeight
            },
            {
                queue: false,
                duration: 500
            });

        $('#largeVideo').animate({
                width: videoWidth,
                height: videoHeight,
                top: verticalIndent,
                bottom: verticalIndent,
                left: horizontalIndent,
                right: horizontalIndent
            },
            {
                queue: false,
                duration: 500
            });
    };

    /**
     * Toggles the windows in the side panel
     * @param object the window that should be shown
     * @param selector the selector for the element containing the panel
     * @param onOpenComplete function to be called when the panel is opened
     * @param onOpen function to be called if the window is going to be opened
     * @param onClose function to be called if the window is going to be closed
     */
    var toggle = function(object, selector, onOpenComplete, onOpen, onClose) {
        UIUtil.buttonClick(buttons[selector], "active");

        if (object.isVisible()) {
            $("#toast-container").animate({
                    right: '5px'
                },
                {
                    queue: false,
                    duration: 500
                });
            $(selector).hide("slide", {
                direction: "right",
                queue: false,
                duration: 500
            });
            if(typeof onClose === "function") {
                onClose();
            }

            currentlyOpen = null;
        }
        else {
            // Undock the toolbar when the chat is shown and if we're in a
            // video mode.
            if (VideoLayout.isLargeVideoVisible()) {
                ToolbarToggler.dockToolbar(false);
            }

            if(currentlyOpen) {
                var current = $(currentlyOpen);
                UIUtil.buttonClick(buttons[currentlyOpen], "active");
                current.css('z-index', 4);
                setTimeout(function () {
                    current.css('display', 'none');
                    current.css('z-index', 5);
                }, 500);
            }

            $("#toast-container").animate({
                    right: (PanelToggler.getPanelSize()[0] + 5) + 'px'
                },
                {
                    queue: false,
                    duration: 500
                });
            $(selector).show("slide", {
                direction: "right",
                queue: false,
                duration: 500,
                complete: onOpenComplete
            });
            if(typeof onOpen === "function") {
                onOpen();
            }

            currentlyOpen = selector;
        }
    };

    /**
     * Opens / closes the chat area.
     */
    my.toggleChat = function() {
        var chatCompleteFunction = Chat.isVisible() ?
            function() {} : function () {
            Chat.scrollChatToBottom();
            $('#chatspace').trigger('shown');
        };

        resizeVideoArea(Chat.isVisible(), chatCompleteFunction);

        toggle(Chat,
            '#chatspace',
            function () {
                // Request the focus in the nickname field or the chat input field.
                if ($('#nickname').css('visibility') === 'visible') {
                    $('#nickinput').focus();
                } else {
                    $('#usermsg').focus();
                }
            },
            null,
            Chat.resizeChat,
            null);
    };

    /**
     * Opens / closes the contact list area.
     */
    my.toggleContactList = function () {
        var completeFunction = ContactList.isVisible() ?
            function() {} : function () { $('#contactlist').trigger('shown');};
        resizeVideoArea(ContactList.isVisible(), completeFunction);

        toggle(ContactList,
            '#contactlist',
            null,
            function() {
                ContactList.setVisualNotification(false);
            },
            null);
    };

    /**
     * Opens / closes the settings menu
     */
    my.toggleSettingsMenu = function() {
        resizeVideoArea(SettingsMenu.isVisible(), function (){});
        toggle(SettingsMenu,
            '#settingsmenu',
            null,
            function() {
                var settings = Settings.getSettings();
                $('#setDisplayName').get(0).value = settings.displayName;
                $('#setEmail').get(0).value = settings.email;
            },
            null);
    };

    /**
     * Returns the size of the side panel.
     */
    my.getPanelSize = function () {
        var availableHeight = window.innerHeight;
        var availableWidth = window.innerWidth;

        var panelWidth = 200;
        if (availableWidth * 0.2 < 200) {
            panelWidth = availableWidth * 0.2;
        }

        return [panelWidth, availableHeight];
    };

    my.isVisible = function() {
        return (Chat.isVisible() || ContactList.isVisible() || SettingsMenu.isVisible());
    };

    return my;

}(PanelToggler || {}));

module.exports = PanelToggler;
},{"../toolbars/ToolbarToggler":26,"../util/UIUtil":30,"../videolayout/VideoLayout":32,"./../../settings/Settings":38,"./chat/Chat":18,"./contactlist/ContactList":22,"./settings/SettingsMenu":23}],18:[function(require,module,exports){
/* global $, Util, nickname:true */
var Replacement = require("./Replacement");
var CommandsProcessor = require("./Commands");
var ToolbarToggler = require("../../toolbars/ToolbarToggler");
var smileys = require("./smileys.json").smileys;
var NicknameHandler = require("../../util/NicknameHandler");
var UIUtil = require("../../util/UIUtil");
var UIEvents = require("../../../../service/UI/UIEvents");

var notificationInterval = false;
var unreadMessages = 0;


/**
 * Shows/hides a visual notification, indicating that a message has arrived.
 */
function setVisualNotification(show) {
    var unreadMsgElement = document.getElementById('unreadMessages');
    var unreadMsgBottomElement
        = document.getElementById('bottomUnreadMessages');

    var glower = $('#chatButton');
    var bottomGlower = $('#chatBottomButton');

    if (unreadMessages) {
        unreadMsgElement.innerHTML = unreadMessages.toString();
        unreadMsgBottomElement.innerHTML = unreadMessages.toString();

        ToolbarToggler.dockToolbar(true);

        var chatButtonElement
            = document.getElementById('chatButton').parentNode;
        var leftIndent = (UIUtil.getTextWidth(chatButtonElement) -
            UIUtil.getTextWidth(unreadMsgElement)) / 2;
        var topIndent = (UIUtil.getTextHeight(chatButtonElement) -
            UIUtil.getTextHeight(unreadMsgElement)) / 2 - 3;

        unreadMsgElement.setAttribute(
            'style',
                'top:' + topIndent +
                '; left:' + leftIndent + ';');

        var chatBottomButtonElement
            = document.getElementById('chatBottomButton').parentNode;
        var bottomLeftIndent = (UIUtil.getTextWidth(chatBottomButtonElement) -
            UIUtil.getTextWidth(unreadMsgBottomElement)) / 2;
        var bottomTopIndent = (UIUtil.getTextHeight(chatBottomButtonElement) -
            UIUtil.getTextHeight(unreadMsgBottomElement)) / 2 - 2;

        unreadMsgBottomElement.setAttribute(
            'style',
                'top:' + bottomTopIndent +
                '; left:' + bottomLeftIndent + ';');


        if (!glower.hasClass('icon-chat-simple')) {
            glower.removeClass('icon-chat');
            glower.addClass('icon-chat-simple');
        }
    }
    else {
        unreadMsgElement.innerHTML = '';
        unreadMsgBottomElement.innerHTML = '';
        glower.removeClass('icon-chat-simple');
        glower.addClass('icon-chat');
    }

    if (show && !notificationInterval) {
        notificationInterval = window.setInterval(function () {
            glower.toggleClass('active');
            bottomGlower.toggleClass('active glowing');
        }, 800);
    }
    else if (!show && notificationInterval) {
        window.clearInterval(notificationInterval);
        notificationInterval = false;
        glower.removeClass('active');
        bottomGlower.removeClass('glowing');
        bottomGlower.addClass('active');
    }
}


/**
 * Returns the current time in the format it is shown to the user
 * @returns {string}
 */
function getCurrentTime() {
    var now     = new Date();
    var hour    = now.getHours();
    var minute  = now.getMinutes();
    var second  = now.getSeconds();
    if(hour.toString().length === 1) {
        hour = '0'+hour;
    }
    if(minute.toString().length === 1) {
        minute = '0'+minute;
    }
    if(second.toString().length === 1) {
        second = '0'+second;
    }
    return hour+':'+minute+':'+second;
}

function toggleSmileys()
{
    var smileys = $('#smileysContainer');
    if(!smileys.is(':visible')) {
        smileys.show("slide", { direction: "down", duration: 300});
    } else {
        smileys.hide("slide", { direction: "down", duration: 300});
    }
    $('#usermsg').focus();
}

function addClickFunction(smiley, number) {
    smiley.onclick = function addSmileyToMessage() {
        var usermsg = $('#usermsg');
        var message = usermsg.val();
        message += smileys['smiley' + number];
        usermsg.val(message);
        usermsg.get(0).setSelectionRange(message.length, message.length);
        toggleSmileys();
        usermsg.focus();
    };
}

/**
 * Adds the smileys container to the chat
 */
function addSmileys() {
    var smileysContainer = document.createElement('div');
    smileysContainer.id = 'smileysContainer';
    for(var i = 1; i <= 21; i++) {
        var smileyContainer = document.createElement('div');
        smileyContainer.id = 'smiley' + i;
        smileyContainer.className = 'smileyContainer';
        var smiley = document.createElement('img');
        smiley.src = 'images/smileys/smiley' + i + '.svg';
        smiley.className =  'smiley';
        addClickFunction(smiley, i);
        smileyContainer.appendChild(smiley);
        smileysContainer.appendChild(smileyContainer);
    }

    $("#chatspace").append(smileysContainer);
}

/**
 * Resizes the chat conversation.
 */
function resizeChatConversation() {
    var msgareaHeight = $('#usermsg').outerHeight();
    var chatspace = $('#chatspace');
    var width = chatspace.width();
    var chat = $('#chatconversation');
    var smileys = $('#smileysarea');

    smileys.height(msgareaHeight);
    $("#smileys").css('bottom', (msgareaHeight - 26) / 2);
    $('#smileysContainer').css('bottom', msgareaHeight);
    chat.width(width - 10);
    chat.height(window.innerHeight - 15 - msgareaHeight);
}

/**
 * Chat related user interface.
 */
var Chat = (function (my) {
    /**
     * Initializes chat related interface.
     */
    my.init = function () {
        if(NicknameHandler.getNickname())
            Chat.setChatConversationMode(true);
        NicknameHandler.addListener(UIEvents.NICKNAME_CHANGED,
            function (nickname) {
                Chat.setChatConversationMode(true);
            });

        $('#nickinput').keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                var val = UIUtil.escapeHtml(this.value);
                this.value = '';
                if (!NicknameHandler.getNickname()) {
                    NicknameHandler.setNickname(val);

                    return;
                }
            }
        });

        $('#usermsg').keydown(function (event) {
            if (event.keyCode === 13) {
                event.preventDefault();
                var value = this.value;
                $('#usermsg').val('').trigger('autosize.resize');
                this.focus();
                var command = new CommandsProcessor(value);
                if(command.isCommand())
                {
                    command.processCommand();
                }
                else
                {
                    var message = UIUtil.escapeHtml(value);
                    APP.xmpp.sendChatMessage(message, NicknameHandler.getNickname());
                }
            }
        });

        var onTextAreaResize = function () {
            resizeChatConversation();
            Chat.scrollChatToBottom();
        };
        $('#usermsg').autosize({callback: onTextAreaResize});

        $("#chatspace").bind("shown",
            function () {
                unreadMessages = 0;
                setVisualNotification(false);
            });

        addSmileys();
    };

    /**
     * Appends the given message to the chat conversation.
     */
    my.updateChatConversation = function (from, displayName, message) {
        var divClassName = '';

        if (APP.xmpp.myJid() === from) {
            divClassName = "localuser";
        }
        else {
            divClassName = "remoteuser";

            if (!Chat.isVisible()) {
                unreadMessages++;
                UIUtil.playSoundNotification('chatNotification');
                setVisualNotification(true);
            }
        }

        // replace links and smileys
        // Strophe already escapes special symbols on sending,
        // so we escape here only tags to avoid double &amp;
        var escMessage = message.replace(/</g, '&lt;').
            replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
        var escDisplayName = UIUtil.escapeHtml(displayName);
        message = Replacement.processReplacements(escMessage);

        var messageContainer =
            '<div class="chatmessage">'+
                '<img src="../images/chatArrow.svg" class="chatArrow">' +
                '<div class="username ' + divClassName +'">' + escDisplayName +
                '</div>' + '<div class="timestamp">' + getCurrentTime() +
                '</div>' + '<div class="usermessage">' + message + '</div>' +
            '</div>';

        $('#chatconversation').append(messageContainer);
        $('#chatconversation').animate(
                { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    };

    /**
     * Appends error message to the conversation
     * @param errorMessage the received error message.
     * @param originalText the original message.
     */
    my.chatAddError = function(errorMessage, originalText)
    {
        errorMessage = UIUtil.escapeHtml(errorMessage);
        originalText = UIUtil.escapeHtml(originalText);

        $('#chatconversation').append(
            '<div class="errorMessage"><b>Error: </b>' + 'Your message' +
            (originalText? (' \"'+ originalText + '\"') : "") +
            ' was not sent.' +
            (errorMessage? (' Reason: ' + errorMessage) : '') +  '</div>');
        $('#chatconversation').animate(
            { scrollTop: $('#chatconversation')[0].scrollHeight}, 1000);
    };

    /**
     * Sets the subject to the UI
     * @param subject the subject
     */
    my.chatSetSubject = function(subject)
    {
        if(subject)
            subject = subject.trim();
        $('#subject').html(Replacement.linkify(UIUtil.escapeHtml(subject)));
        if(subject === "")
        {
            $("#subject").css({display: "none"});
        }
        else
        {
            $("#subject").css({display: "block"});
        }
    };



    /**
     * Sets the chat conversation mode.
     */
    my.setChatConversationMode = function (isConversationMode) {
        if (isConversationMode) {
            $('#nickname').css({visibility: 'hidden'});
            $('#chatconversation').css({visibility: 'visible'});
            $('#usermsg').css({visibility: 'visible'});
            $('#smileysarea').css({visibility: 'visible'});
            $('#usermsg').focus();
        }
    };

    /**
     * Resizes the chat area.
     */
    my.resizeChat = function () {
        var chatSize = require("../SidePanelToggler").getPanelSize();

        $('#chatspace').width(chatSize[0]);
        $('#chatspace').height(chatSize[1]);

        resizeChatConversation();
    };

    /**
     * Indicates if the chat is currently visible.
     */
    my.isVisible = function () {
        return $('#chatspace').is(":visible");
    };
    /**
     * Shows and hides the window with the smileys
     */
    my.toggleSmileys = toggleSmileys;

    /**
     * Scrolls chat to the bottom.
     */
    my.scrollChatToBottom = function() {
        setTimeout(function () {
            $('#chatconversation').scrollTop(
                $('#chatconversation')[0].scrollHeight);
        }, 5);
    };


    return my;
}(Chat || {}));
module.exports = Chat;
},{"../../../../service/UI/UIEvents":93,"../../toolbars/ToolbarToggler":26,"../../util/NicknameHandler":29,"../../util/UIUtil":30,"../SidePanelToggler":17,"./Commands":19,"./Replacement":20,"./smileys.json":21}],19:[function(require,module,exports){
var UIUtil = require("../../util/UIUtil");

/**
 * List with supported commands. The keys are the names of the commands and
 * the value is the function that processes the message.
 * @type {{String: function}}
 */
var commands = {
    "topic" : processTopic
};

/**
 * Extracts the command from the message.
 * @param message the received message
 * @returns {string} the command
 */
function getCommand(message)
{
    if(message)
    {
        for(var command in commands)
        {
            if(message.indexOf("/" + command) == 0)
                return command;
        }
    }
    return "";
};

/**
 * Processes the data for topic command.
 * @param commandArguments the arguments of the topic command.
 */
function processTopic(commandArguments)
{
    var topic = UIUtil.escapeHtml(commandArguments);
    APP.xmpp.setSubject(topic);
}

/**
 * Constructs new CommandProccessor instance from a message that
 * handles commands received via chat messages.
 * @param message the message
 * @constructor
 */
function CommandsProcessor(message)
{


    var command = getCommand(message);

    /**
     * Returns the name of the command.
     * @returns {String} the command
     */
    this.getCommand = function()
    {
        return command;
    };


    var messageArgument = message.substr(command.length + 2);

    /**
     * Returns the arguments of the command.
     * @returns {string}
     */
    this.getArgument = function()
    {
        return messageArgument;
    };
}

/**
 * Checks whether this instance is valid command or not.
 * @returns {boolean}
 */
CommandsProcessor.prototype.isCommand = function()
{
    if(this.getCommand())
        return true;
    return false;
};

/**
 * Processes the command.
 */
CommandsProcessor.prototype.processCommand = function()
{
    if(!this.isCommand())
        return;

    commands[this.getCommand()](this.getArgument());

};

module.exports = CommandsProcessor;
},{"../../util/UIUtil":30}],20:[function(require,module,exports){
var Smileys = require("./smileys.json");
/**
 * Processes links and smileys in "body"
 */
function processReplacements(body)
{
    //make links clickable
    body = linkify(body);

    //add smileys
    body = smilify(body);

    return body;
}

/**
 * Finds and replaces all links in the links in "body"
 * with their <a href=""></a>
 */
function linkify(inputText)
{
    var replacedText, replacePattern1, replacePattern2, replacePattern3;

    //URLs starting with http://, https://, or ftp://
    replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

    //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
    replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

    //Change email addresses to mailto:: links.
    replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
    replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');

    return replacedText;
}

/**
 * Replaces common smiley strings with images
 */
function smilify(body)
{
    if(!body) {
        return body;
    }

    var regexs = Smileys["regexs"];
    for(var smiley in regexs) {
        if(regexs.hasOwnProperty(smiley)) {
            body = body.replace(regexs[smiley],
                    '<img class="smiley" src="images/smileys/' + smiley + '.svg">');
        }
    }

    return body;
}

module.exports = {
    processReplacements: processReplacements,
    linkify: linkify
};

},{"./smileys.json":21}],21:[function(require,module,exports){
module.exports={
    "smileys": {
        "smiley1": ":)",
        "smiley2": ":(",
        "smiley3": ":D",
        "smiley4": "(y)",
        "smiley5": " :P",
        "smiley6": "(wave)",
        "smiley7": "(blush)",
        "smiley8": "(chuckle)",
        "smiley9": "(shocked)",
        "smiley10": ":*",
        "smiley11": "(n)",
        "smiley12": "(search)",
        "smiley13": " <3",
        "smiley14": "(oops)",
        "smiley15": "(angry)",
        "smiley16": "(angel)",
        "smiley17": "(sick)",
        "smiley18": ";(",
        "smiley19": "(bomb)",
        "smiley20": "(clap)",
        "smiley21": " ;)"
    },
    "regexs": {
        "smiley2": /(:-\(\(|:-\(|:\(\(|:\(|\(sad\))/gi,
        "smiley3": /(:-\)\)|:\)\)|\(lol\)|:-D|:D)/gi,
        "smiley1": /(:-\)|:\))/gi,
        "smiley4": /(\(y\)|\(Y\)|\(ok\))/gi,
        "smiley5": /(:-P|:P|:-p|:p)/gi,
        "smiley6": /(\(wave\))/gi,
        "smiley7": /(\(blush\))/gi,
        "smiley8": /(\(chuckle\))/gi,
        "smiley9": /(:-0|\(shocked\))/gi,
        "smiley10": /(:-\*|:\*|\(kiss\))/gi,
        "smiley11": /(\(n\))/gi,
        "smiley12": /(\(search\))/g,
        "smiley13": /(<3|&lt;3|&amp;lt;3|\(L\)|\(l\)|\(H\)|\(h\))/gi,
        "smiley14": /(\(oops\))/gi,
        "smiley15": /(\(angry\))/gi,
        "smiley16": /(\(angel\))/gi,
        "smiley17": /(\(sick\))/gi,
        "smiley18": /(;-\(\(|;\(\(|;-\(|;\(|:"\(|:"-\(|:~-\(|:~\(|\(upset\))/gi,
        "smiley19": /(\(bomb\))/gi,
        "smiley20": /(\(clap\))/gi,
        "smiley21": /(;-\)|;\)|;-\)\)|;\)\)|;-D|;D|\(wink\))/gi
    }
}

},{}],22:[function(require,module,exports){

var numberOfContacts = 0;
var notificationInterval;

/**
 * Updates the number of participants in the contact list button and sets
 * the glow
 * @param delta indicates whether a new user has joined (1) or someone has
 * left(-1)
 */
function updateNumberOfParticipants(delta) {
    //when the user is alone we don't show the number of participants
    if(numberOfContacts === 0) {
        $("#numberOfParticipants").text('');
        numberOfContacts += delta;
    } else if(numberOfContacts !== 0 && !ContactList.isVisible()) {
        ContactList.setVisualNotification(true);
        numberOfContacts += delta;
        $("#numberOfParticipants").text(numberOfContacts);
    }
}

/**
 * Creates the avatar element.
 *
 * @return the newly created avatar element
 */
function createAvatar(id) {
    var avatar = document.createElement('img');
    avatar.className = "icon-avatar avatar";
    avatar.src = "https://www.gravatar.com/avatar/" + id + "?d=wavatar&size=30";

    return avatar;
}

/**
 * Creates the display name paragraph.
 *
 * @param displayName the display name to set
 */
function createDisplayNameParagraph(key, displayName) {
    var p = document.createElement('p');
    if(displayName)
        p.innerText = displayName;
    else if(key)
    {
        p.setAttribute("data-i18n",key);
        p.innerText = APP.translation.translateString(key);
    }

    return p;
}


function stopGlowing(glower) {
    window.clearInterval(notificationInterval);
    notificationInterval = false;
    glower.removeClass('glowing');
    if (!ContactList.isVisible()) {
        glower.removeClass('active');
    }
}


/**
 * Contact list.
 */
var ContactList = {
    /**
     * Indicates if the chat is currently visible.
     *
     * @return <tt>true</tt> if the chat is currently visible, <tt>false</tt> -
     * otherwise
     */
    isVisible: function () {
        return $('#contactlist').is(":visible");
    },

    /**
     * Adds a contact for the given peerJid if such doesn't yet exist.
     *
     * @param peerJid the peerJid corresponding to the contact
     * @param id the user's email or userId used to get the user's avatar
     */
    ensureAddContact: function (peerJid, id) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');

        if (!contact || contact.length <= 0)
            ContactList.addContact(peerJid, id);
    },

    /**
     * Adds a contact for the given peer jid.
     *
     * @param peerJid the jid of the contact to add
     * @param id the email or userId of the user
     */
    addContact: function (peerJid, id) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactlist = $('#contactlist>ul');

        var newContact = document.createElement('li');
        newContact.id = resourceJid;
        newContact.className = "clickable";
        newContact.onclick = function (event) {
            if (event.currentTarget.className === "clickable") {
                $(ContactList).trigger('contactclicked', [peerJid]);
            }
        };

        newContact.appendChild(createAvatar(id));
        newContact.appendChild(createDisplayNameParagraph("participant"));

        var clElement = contactlist.get(0);

        if (resourceJid === APP.xmpp.myResource()
            && $('#contactlist>ul .title')[0].nextSibling.nextSibling) {
            clElement.insertBefore(newContact,
                $('#contactlist>ul .title')[0].nextSibling.nextSibling);
        }
        else {
            clElement.appendChild(newContact);
        }
        updateNumberOfParticipants(1);
    },

    /**
     * Removes a contact for the given peer jid.
     *
     * @param peerJid the peerJid corresponding to the contact to remove
     */
    removeContact: function (peerJid) {
        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');

        if (contact && contact.length > 0) {
            var contactlist = $('#contactlist>ul');

            contactlist.get(0).removeChild(contact.get(0));

            updateNumberOfParticipants(-1);
        }
    },

    setVisualNotification: function (show, stopGlowingIn) {
        var glower = $('#contactListButton');

        if (show && !notificationInterval) {
            notificationInterval = window.setInterval(function () {
                glower.toggleClass('active glowing');
            }, 800);
        }
        else if (!show && notificationInterval) {
            stopGlowing(glower);
        }
        if (stopGlowingIn) {
            setTimeout(function () {
                stopGlowing(glower);
            }, stopGlowingIn);
        }
    },

    setClickable: function (resourceJid, isClickable) {
        var contact = $('#contactlist>ul>li[id="' + resourceJid + '"]');
        if (isClickable) {
            contact.addClass('clickable');
        } else {
            contact.removeClass('clickable');
        }
    },

    onDisplayNameChange: function (peerJid, displayName) {
        if (peerJid === 'localVideoContainer')
            peerJid = APP.xmpp.myJid();

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var contactName = $('#contactlist #' + resourceJid + '>p');

        if (contactName && displayName && displayName.length > 0)
            contactName.html(displayName);
    }
};

module.exports = ContactList;
},{}],23:[function(require,module,exports){
var Avatar = require("../../avatar/Avatar");
var Settings = require("./../../../settings/Settings");
var UIUtil = require("../../util/UIUtil");
var languages = require("../../../../service/translation/languages");

function generateLanguagesSelectBox()
{
    var currentLang = APP.translation.getCurrentLanguage();
    var html = "<select id=\"languages_selectbox\">";
    var langArray = languages.getLanguages();
    for(var i = 0; i < langArray.length; i++)
    {
        var lang = langArray[i];
        html += "<option ";
        if(lang === currentLang)
            html += "selected ";
        html += "value=\"" + lang + "\" data-i18n='languages:" + lang + "'>";
        html += "</option>";

    }

    return html + "</select>";
}


var SettingsMenu = {

    init: function () {
        $("#updateSettings").before(generateLanguagesSelectBox());
        APP.translation.translateElement($("#languages_selectbox"));
        $('#settingsmenu>input').keyup(function(event){
            if(event.keyCode === 13) {//enter
                SettingsMenu.update();
            }
        });

        $("#updateSettings").click(function () {
            SettingsMenu.update();
        });
    },

    update: function() {
        var newDisplayName = UIUtil.escapeHtml($('#setDisplayName').get(0).value);
        var newEmail = UIUtil.escapeHtml($('#setEmail').get(0).value);

        if(newDisplayName) {
            var displayName = Settings.setDisplayName(newDisplayName);
            APP.xmpp.addToPresence("displayName", displayName, true);
        }

        var language = $("#languages_selectbox").val();
        APP.translation.setLanguage(language);
        Settings.setLanguage(language);

        APP.xmpp.addToPresence("email", newEmail);
        var email = Settings.setEmail(newEmail);


        Avatar.setUserAvatar(APP.xmpp.myJid(), email);
    },

    isVisible: function() {
        return $('#settingsmenu').is(':visible');
    },

    setDisplayName: function(newDisplayName) {
        var displayName = Settings.setDisplayName(newDisplayName);
        $('#setDisplayName').get(0).value = displayName;
    },

    onDisplayNameChange: function(peerJid, newDisplayName) {
        if(peerJid === 'localVideoContainer' ||
            peerJid === APP.xmpp.myJid()) {
            this.setDisplayName(newDisplayName);
        }
    }
};


module.exports = SettingsMenu;
},{"../../../../service/translation/languages":97,"../../avatar/Avatar":13,"../../util/UIUtil":30,"./../../../settings/Settings":38}],24:[function(require,module,exports){
var PanelToggler = require("../side_pannels/SidePanelToggler");

var buttonHandlers = {
    "bottom_toolbar_contact_list": function () {
        BottomToolbar.toggleContactList();
    },
    "bottom_toolbar_film_strip": function () {
        BottomToolbar.toggleFilmStrip();
    },
    "bottom_toolbar_chat": function () {
        BottomToolbar.toggleChat();
    }
};

var BottomToolbar = (function (my) {
    my.init = function () {
        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
    };

    my.toggleChat = function() {
        PanelToggler.toggleChat();
    };

    my.toggleContactList = function() {
        PanelToggler.toggleContactList();
    };

    my.toggleFilmStrip = function() {
        var filmstrip = $("#remoteVideos");
        filmstrip.toggleClass("hidden");
    };

    $(document).bind("remotevideo.resized", function (event, width, height) {
        var bottom = (height - $('#bottomToolbar').outerHeight())/2 + 18;

        $('#bottomToolbar').css({bottom: bottom + 'px'});
    });

    return my;
}(BottomToolbar || {}));

module.exports = BottomToolbar;

},{"../side_pannels/SidePanelToggler":17}],25:[function(require,module,exports){
/* global APP,$, buttonClick, config, lockRoom,
   setSharedKey, Util */
var messageHandler = require("../util/MessageHandler");
var BottomToolbar = require("./BottomToolbar");
var Prezi = require("../prezi/Prezi");
var Etherpad = require("../etherpad/Etherpad");
var PanelToggler = require("../side_pannels/SidePanelToggler");
var Authentication = require("../authentication/Authentication");
var UIUtil = require("../util/UIUtil");
var AuthenticationEvents
    = require("../../../service/authentication/AuthenticationEvents");

var roomUrl = null;
var sharedKey = '';
var UI = null;

var buttonHandlers =
{
    "toolbar_button_mute": function () {
        return APP.UI.toggleAudio();
    },
    "toolbar_button_camera": function () {
        return APP.UI.toggleVideo();
    },
    /*"toolbar_button_authentication": function () {
        return Toolbar.authenticateClicked();
    },*/
    "toolbar_button_record": function () {
        return toggleRecording();
    },
    "toolbar_button_security": function () {
        return Toolbar.openLockDialog();
    },
    "toolbar_button_link": function () {
        return Toolbar.openLinkDialog();
    },
    "toolbar_button_chat": function () {
        return BottomToolbar.toggleChat();
    },
    "toolbar_button_prezi": function () {
        return Prezi.openPreziDialog();
    },
    "toolbar_button_etherpad": function () {
        return Etherpad.toggleEtherpad(0);
    },
    "toolbar_button_desktopsharing": function () {
        return APP.desktopsharing.toggleScreenSharing();
    },
    "toolbar_button_fullScreen": function()
    {
        UIUtil.buttonClick("#fullScreen", "icon-full-screen icon-exit-full-screen");
        return Toolbar.toggleFullScreen();
    },
    "toolbar_button_sip": function () {
        return callSipButtonClicked();
    },
    "toolbar_button_settings": function () {
        PanelToggler.toggleSettingsMenu();
    },
    "toolbar_button_hangup": function () {
        return hangup();
    },
    "toolbar_button_login": function () {
        Toolbar.authenticateClicked();
    },
    "toolbar_button_logout": function () {
        // Ask for confirmation
        messageHandler.openTwoButtonDialog(
            "dialog.logoutTitle",
            null,
            "dialog.logoutQuestion",
            null,
            false,
            "dialog.Yes",
            function (evt, yes) {
                if (yes) {
                    APP.xmpp.logout(function (url) {
                        if (url) {
                            window.location.href = url;
                        } else {
                            hangup();
                        }
                    });
                }
            });
    }
};

function hangup() {
    APP.xmpp.disposeConference();
    if(config.enableWelcomePage)
    {
        setTimeout(function()
        {
            window.localStorage.welcomePageDisabled = false;
            window.location.pathname = "/";
        }, 10000);

    }

    var title = APP.translation.generateTranslatonHTML(
        "dialog.sessTerminated");
    var msg = APP.translation.generateTranslatonHTML(
        "dialog.hungUp");
    var button = APP.translation.generateTranslatonHTML(
        "dialog.joinAgain");
    var buttons = [];
    buttons.push({title: button, value: true});

    UI.messageHandler.openDialog(
        title,
        msg,
        true,
        buttons,
        function(event, value, message, formVals)
        {
            window.location.reload();
            return false;
        }
    );
}

/**
 * Starts or stops the recording for the conference.
 */

function toggleRecording() {
    APP.xmpp.toggleRecording(function (callback) {
        var msg = APP.translation.generateTranslatonHTML(
            "dialog.recordingToken");
        var token = APP.translation.translateString("dialog.token");
        APP.UI.messageHandler.openTwoButtonDialog(null, null, null,
                '<h2>' + msg + '</h2>' +
                '<input name="recordingToken" type="text" ' +
                ' data-i18n="[placeholder]dialog.token" ' +
                'placeholder="' + token + '" autofocus>',
            false,
            "dialog.Save",
            function (e, v, m, f) {
                if (v) {
                    var token = f.recordingToken;

                    if (token) {
                        callback(UIUtil.escapeHtml(token));
                    }
                }
            },
            null,
            function () { },
            ':input:first'
        );
    }, Toolbar.setRecordingButtonState, Toolbar.setRecordingButtonState);
}

/**
 * Locks / unlocks the room.
 */
function lockRoom(lock) {
    var currentSharedKey = '';
    if (lock)
        currentSharedKey = sharedKey;

    APP.xmpp.lockRoom(currentSharedKey, function (res) {
        // password is required
        if (sharedKey)
        {
            console.log('set room password');
            Toolbar.lockLockButton();
        }
        else
        {
            console.log('removed room password');
            Toolbar.unlockLockButton();
        }
    }, function (err) {
        console.warn('setting password failed', err);
        messageHandler.showError("dialog.lockTitle",
            "dialog.lockMessage");
        Toolbar.setSharedKey('');
    }, function () {
        console.warn('room passwords not supported');
        messageHandler.showError("dialog.warning",
            "dialog.passwordNotSupported");
        Toolbar.setSharedKey('');
    });
};

/**
 * Invite participants to conference.
 */
function inviteParticipants() {
    if (roomUrl === null)
        return;

    var sharedKeyText = "";
    if (sharedKey && sharedKey.length > 0) {
        sharedKeyText =
            APP.translation.translateString("email.sharedKey",
                {sharedKey: sharedKey});
        sharedKeyText = sharedKeyText.replace(/\n/g, "%0D%0A");
    }

    var supportedBrowsers = "Chromium, Google Chrome " +
        APP.translation.translateString("email.and") + " Opera";
    var conferenceName = roomUrl.substring(roomUrl.lastIndexOf('/') + 1);
    var subject = APP.translation.translateString("email.subject",
        {appName:interfaceConfig.APP_NAME, conferenceName: conferenceName});
    var body = APP.translation.translateString("email.body",
        {appName:interfaceConfig.APP_NAME, sharedKeyText: sharedKeyText,
            roomUrl: roomUrl, supportedBrowsers: supportedBrowsers});
    body = body.replace(/\n/g, "%0D%0A");

    if (window.localStorage.displayname) {
        body += "%0D%0A%0D%0A" + window.localStorage.displayname;
    }

    if (interfaceConfig.INVITATION_POWERED_BY) {
        body += "%0D%0A%0D%0A--%0D%0Apowered by jitsi.org";
    }

    window.open("mailto:?subject=" + subject + "&body=" + body, '_blank');
}

function callSipButtonClicked()
{
    var defaultNumber
        = config.defaultSipNumber ? config.defaultSipNumber : '';

    var sipMsg = APP.translation.generateTranslatonHTML(
        "dialog.sipMsg");
    messageHandler.openTwoButtonDialog(null, null, null,
        '<h2>' + sipMsg + '</h2>' +
        '<input name="sipNumber" type="text"' +
        ' value="' + defaultNumber + '" autofocus>',
        false,
        "dialog.Dial",
        function (e, v, m, f) {
            if (v) {
                var numberInput = f.sipNumber;
                if (numberInput) {
                    APP.xmpp.dial(
                        numberInput, 'fromnumber', UI.getRoomName(), sharedKey);
                }
            }
        },
        null,
        ':input:first'
    );
}

var Toolbar = (function (my) {

    my.init = function (ui) {
        for(var k in buttonHandlers)
            $("#" + k).click(buttonHandlers[k]);
        UI = ui;
        // Update login info
        APP.xmpp.addListener(
            AuthenticationEvents.IDENTITY_UPDATED,
            function (authenticationEnabled, userIdentity) {

                var loggedIn = false;
                if (userIdentity) {
                    loggedIn = true;
                }

                Toolbar.showAuthenticateButton(authenticationEnabled);

                if (authenticationEnabled) {
                    Toolbar.setAuthenticatedIdentity(userIdentity);

                    Toolbar.showLoginButton(!loggedIn);
                    Toolbar.showLogoutButton(loggedIn);
                }
            }
        );
    },

    /**
     * Sets shared key
     * @param sKey the shared key
     */
    my.setSharedKey = function (sKey) {
        sharedKey = sKey;
    };

    my.authenticateClicked = function () {
        Authentication.focusAuthenticationWindow();
        if (!APP.xmpp.isExternalAuthEnabled()) {
            Authentication.xmppAuthenticate();
            return;
        }
        // Get authentication URL
        if (!APP.xmpp.getMUCJoined()) {
            APP.xmpp.getLoginUrl(UI.getRoomName(), function (url) {
                // If conference has not been started yet - redirect to login page
                window.location.href = url;
            });
        } else {
            APP.xmpp.getPopupLoginUrl(UI.getRoomName(), function (url) {
                // Otherwise - open popup with authentication URL
                var authenticationWindow = Authentication.createAuthenticationWindow(
                    function () {
                        // On popup closed - retry room allocation
                        APP.xmpp.allocateConferenceFocus(
                            APP.UI.getRoomName(),
                            function () { console.info("AUTH DONE"); }
                        );
                    }, url);
                if (!authenticationWindow) {
                    messageHandler.openMessageDialog(
                        null, "dialog.popupError");
                }
            });
        }
    };

    /**
     * Updates the room invite url.
     */
    my.updateRoomUrl = function (newRoomUrl) {
        roomUrl = newRoomUrl;

        // If the invite dialog has been already opened we update the information.
        var inviteLink = document.getElementById('inviteLinkRef');
        if (inviteLink) {
            inviteLink.value = roomUrl;
            inviteLink.select();
            document.getElementById('jqi_state0_buttonInvite').disabled = false;
        }
    };

    /**
     * Disables and enables some of the buttons.
     */
    my.setupButtonsFromConfig = function () {
        if (config.disablePrezi)
        {
            $("#prezi_button").css({display: "none"});
        }
    };

    /**
     * Opens the lock room dialog.
     */
    my.openLockDialog = function () {
        // Only the focus is able to set a shared key.
        if (!APP.xmpp.isModerator()) {
            if (sharedKey) {
                messageHandler.openMessageDialog(null,
                    "dialog.passwordError");
            } else {
                messageHandler.openMessageDialog(null, "dialog.passwordError2");
            }
        } else {
            if (sharedKey) {
                messageHandler.openTwoButtonDialog(null, null,
                    "dialog.passwordCheck",
                    null,
                    false,
                    "dialog.Remove",
                    function (e, v) {
                        if (v) {
                            Toolbar.setSharedKey('');
                            lockRoom(false);
                        }
                    });
            } else {
                var msg = APP.translation.generateTranslatonHTML(
                    "dialog.passwordMsg");
                var yourPassword = APP.translation.translateString(
                    "dialog.yourPassword");
                messageHandler.openTwoButtonDialog(null, null, null,
                    '<h2>' + msg + '</h2>' +
                        '<input name="lockKey" type="text"' +
                        ' data-i18n="[placeholder]dialog.yourPassword" ' +
                        'placeholder="' + yourPassword + '" autofocus>',
                    false,
                    "dialog.Save",
                    function (e, v, m, f) {
                        if (v) {
                            var lockKey = f.lockKey;

                            if (lockKey) {
                                Toolbar.setSharedKey(
                                    UIUtil.escapeHtml(lockKey));
                                lockRoom(true);
                            }
                        }
                    },
                    null, null, 'input:first'
                );
            }
        }
    };

    /**
     * Opens the invite link dialog.
     */
    my.openLinkDialog = function () {
        var inviteAttreibutes;

        if (roomUrl === null) {
            inviteAttreibutes = 'data-i18n="[value]roomUrlDefaultMsg" value="' +
            APP.translation.translateString("roomUrlDefaultMsg") + '"';
        } else {
            inviteAttreibutes = "value=\"" + encodeURI(roomUrl) + "\"";
        }
        messageHandler.openTwoButtonDialog("dialog.shareLink",
            null, null,
            '<input id="inviteLinkRef" type="text" ' +
                inviteAttreibutes + ' onclick="this.select();" readonly>',
            false,
            "dialog.Invite",
            function (e, v) {
                if (v) {
                    if (roomUrl) {
                        inviteParticipants();
                    }
                }
            },
            function () {
                if (roomUrl) {
                    document.getElementById('inviteLinkRef').select();
                } else {
                    document.getElementById('jqi_state0_buttonInvite')
                        .disabled = true;
                }
            }
        );
    };

    /**
     * Opens the settings dialog.
     * FIXME: not used ?
     */
    my.openSettingsDialog = function () {
        var settings1 = APP.translation.generateTranslatonHTML(
            "dialog.settings1");
        var settings2 = APP.translation.generateTranslatonHTML(
            "dialog.settings2");
        var settings3 = APP.translation.generateTranslatonHTML(
            "dialog.settings3");

        var yourPassword = APP.translation.translateString(
            "dialog.yourPassword");

        messageHandler.openTwoButtonDialog(null,
            '<h2>' + settings1 + '</h2>' +
                '<input type="checkbox" id="initMuted">' +
                settings2 + '<br/>' +
                '<input type="checkbox" id="requireNicknames">' +
                 settings3 +
                '<input id="lockKey" type="text" placeholder="' + yourPassword +
                '" data-i18n="[placeholder]dialog.yourPassword" autofocus>',
            null,
            null,
            false,
            "dialog.Save",
            function () {
                document.getElementById('lockKey').focus();
            },
            function (e, v) {
                if (v) {
                    if ($('#initMuted').is(":checked")) {
                        // it is checked
                    }

                    if ($('#requireNicknames').is(":checked")) {
                        // it is checked
                    }
                    /*
                    var lockKey = document.getElementById('lockKey');

                    if (lockKey.value) {
                        setSharedKey(lockKey.value);
                        lockRoom(true);
                    }
                    */
                }
            }
        );
    };

    /**
     * Toggles the application in and out of full screen mode
     * (a.k.a. presentation mode in Chrome).
     */
    my.toggleFullScreen = function () {
        var fsElement = document.documentElement;

        if (!document.mozFullScreen && !document.webkitIsFullScreen) {
            //Enter Full Screen
            if (fsElement.mozRequestFullScreen) {
                fsElement.mozRequestFullScreen();
            }
            else {
                fsElement.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            }
        } else {
            //Exit Full Screen
            if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else {
                document.webkitCancelFullScreen();
            }
        }
    };
    /**
     * Unlocks the lock button state.
     */
    my.unlockLockButton = function () {
        if ($("#lockIcon").hasClass("icon-security-locked"))
            UIUtil.buttonClick("#lockIcon", "icon-security icon-security-locked");
    };
    /**
     * Updates the lock button state to locked.
     */
    my.lockLockButton = function () {
        if ($("#lockIcon").hasClass("icon-security"))
            UIUtil.buttonClick("#lockIcon", "icon-security icon-security-locked");
    };

    /**
     * Shows or hides authentication button
     * @param show <tt>true</tt> to show or <tt>false</tt> to hide
     */
    my.showAuthenticateButton = function (show) {
        if (show) {
            $('#authentication').css({display: "inline"});
        }
        else {
            $('#authentication').css({display: "none"});
        }
    };

    // Shows or hides the 'recording' button.
    my.showRecordingButton = function (show) {
        if (!config.enableRecording) {
            return;
        }

        if (show) {
            $('#recording').css({display: "inline"});
        }
        else {
            $('#recording').css({display: "none"});
        }
    };

    // Sets the state of the recording button
    my.setRecordingButtonState = function (isRecording) {
        if (isRecording) {
            $('#recordButton').removeClass("icon-recEnable");
            $('#recordButton').addClass("icon-recEnable active");
        } else {
            $('#recordButton').removeClass("icon-recEnable active");
            $('#recordButton').addClass("icon-recEnable");
        }
    };

    // Shows or hides SIP calls button
    my.showSipCallButton = function (show) {
        if (APP.xmpp.isSipGatewayEnabled() && show) {
            $('#sipCallButton').css({display: "inline-block"});
        } else {
            $('#sipCallButton').css({display: "none"});
        }
    };

    /**
     * Displays user authenticated identity name(login).
     * @param authIdentity identity name to be displayed.
     */
    my.setAuthenticatedIdentity = function (authIdentity) {
        if (authIdentity) {
            $('#toolbar_auth_identity').css({display: "list-item"});
            $('#toolbar_auth_identity').text(authIdentity);
        } else {
            $('#toolbar_auth_identity').css({display: "none"});
        }
    };

    /**
     * Shows/hides login button.
     * @param show <tt>true</tt> to show
     */
    my.showLoginButton = function (show) {
        if (show) {
            $('#toolbar_button_login').css({display: "list-item"});
        } else {
            $('#toolbar_button_login').css({display: "none"});
        }
    };

    /**
     * Shows/hides logout button.
     * @param show <tt>true</tt> to show
     */
    my.showLogoutButton = function (show) {
        if (show) {
            $('#toolbar_button_logout').css({display: "list-item"});
        } else {
            $('#toolbar_button_logout').css({display: "none"});
        }
    };

    /**
     * Sets the state of the button. The button has blue glow if desktop
     * streaming is active.
     * @param active the state of the desktop streaming.
     */
    my.changeDesktopSharingButtonState = function (active) {
        var button = $("#desktopsharing > a");
        if (active)
        {
            button.addClass("glow");
        }
        else
        {
            button.removeClass("glow");
        }
    };

    return my;
}(Toolbar || {}));

module.exports = Toolbar;
},{"../../../service/authentication/AuthenticationEvents":94,"../authentication/Authentication":11,"../etherpad/Etherpad":14,"../prezi/Prezi":15,"../side_pannels/SidePanelToggler":17,"../util/MessageHandler":28,"../util/UIUtil":30,"./BottomToolbar":24}],26:[function(require,module,exports){
/* global $, interfaceConfig, Moderator, DesktopStreaming.showDesktopSharingButton */

var toolbarTimeoutObject,
    toolbarTimeout = interfaceConfig.INITIAL_TOOLBAR_TIMEOUT;

function showDesktopSharingButton() {
    if (APP.desktopsharing.isDesktopSharingEnabled()) {
        $('#desktopsharing').css({display: "inline"});
    } else {
        $('#desktopsharing').css({display: "none"});
    }
}

/**
 * Hides the toolbar.
 */
function hideToolbar() {
    var header = $("#header"),
        bottomToolbar = $("#bottomToolbar");
    var isToolbarHover = false;
    header.find('*').each(function () {
        var id = $(this).attr('id');
        if ($("#" + id + ":hover").length > 0) {
            isToolbarHover = true;
        }
    });
    if ($("#bottomToolbar:hover").length > 0) {
        isToolbarHover = true;
    }

    clearTimeout(toolbarTimeoutObject);
    toolbarTimeoutObject = null;

    if (!isToolbarHover) {
        header.hide("slide", { direction: "up", duration: 300});
        $('#subject').animate({top: "-=40"}, 300);
        if ($("#remoteVideos").hasClass("hidden")) {
            bottomToolbar.hide(
                "slide", {direction: "right", duration: 300});
        }
    }
    else {
        toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
    }
}

var ToolbarToggler = {
    /**
     * Shows the main toolbar.
     */
    showToolbar: function () {
        var header = $("#header"),
            bottomToolbar = $("#bottomToolbar");
        if (!header.is(':visible') || !bottomToolbar.is(":visible")) {
            header.show("slide", { direction: "up", duration: 300});
            $('#subject').animate({top: "+=40"}, 300);
            if (!bottomToolbar.is(":visible")) {
                bottomToolbar.show(
                    "slide", {direction: "right", duration: 300});
            }

            if (toolbarTimeoutObject) {
                clearTimeout(toolbarTimeoutObject);
                toolbarTimeoutObject = null;
            }
            toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            toolbarTimeout = interfaceConfig.TOOLBAR_TIMEOUT;
        }

        if (APP.xmpp.isModerator())
        {
//            TODO: Enable settings functionality.
//                  Need to uncomment the settings button in index.html.
//            $('#settingsButton').css({visibility:"visible"});
        }

        // Show/hide desktop sharing button
        showDesktopSharingButton();
    },


    /**
     * Docks/undocks the toolbar.
     *
     * @param isDock indicates what operation to perform
     */
    dockToolbar: function (isDock) {
        if (isDock) {
            // First make sure the toolbar is shown.
            if (!$('#header').is(':visible')) {
                this.showToolbar();
            }

            // Then clear the time out, to dock the toolbar.
            if (toolbarTimeoutObject) {
                clearTimeout(toolbarTimeoutObject);
                toolbarTimeoutObject = null;
            }
        }
        else {
            if (!$('#header').is(':visible')) {
                this.showToolbar();
            }
            else {
                toolbarTimeoutObject = setTimeout(hideToolbar, toolbarTimeout);
            }
        }
    },

    showDesktopSharingButton: showDesktopSharingButton

};

module.exports = ToolbarToggler;
},{}],27:[function(require,module,exports){
var JitsiPopover = (function () {
    /**
     * Constructs new JitsiPopover and attaches it to the element
     * @param element jquery selector
     * @param options the options for the popover.
     * @constructor
     */
    function JitsiPopover(element, options)
    {
        this.options = {
            skin: "white",
            content: ""
        };
        if(options)
        {
            if(options.skin)
                this.options.skin = options.skin;

            if(options.content)
                this.options.content = options.content;
        }

        this.elementIsHovered = false;
        this.popoverIsHovered = false;
        this.popoverShown = false;

        element.data("jitsi_popover", this);
        this.element = element;
        this.template = ' <div class="jitsipopover ' + this.options.skin +
            '"><div class="arrow"></div><div class="jitsipopover-content"></div>' +
            '<div class="jitsiPopupmenuPadding"></div></div>';
        var self = this;
        this.element.on("mouseenter", function () {
            self.elementIsHovered = true;
            self.show();
        }).on("mouseleave", function () {
            self.elementIsHovered = false;
            setTimeout(function () {
                self.hide();
            }, 10);
        });
    }

    /**
     * Shows the popover
     */
    JitsiPopover.prototype.show = function () {
        this.createPopover();
        this.popoverShown = true;

    };

    /**
     * Hides the popover
     */
    JitsiPopover.prototype.hide = function () {
        if(!this.elementIsHovered && !this.popoverIsHovered && this.popoverShown)
        {
            this.forceHide();
        }
    };

    /**
     * Hides the popover
     */
    JitsiPopover.prototype.forceHide = function () {
        $(".jitsipopover").remove();
        this.popoverShown = false;
    };

    /**
     * Creates the popover html
     */
    JitsiPopover.prototype.createPopover = function () {
        $("body").append(this.template);
        $(".jitsipopover > .jitsipopover-content").html(this.options.content);
        var self = this;
        $(".jitsipopover").on("mouseenter", function () {
            self.popoverIsHovered = true;
        }).on("mouseleave", function () {
            self.popoverIsHovered = false;
            self.hide();
        });

        this.refreshPosition();
    };

    /**
     * Refreshes the position of the popover
     */
    JitsiPopover.prototype.refreshPosition = function () {
        $(".jitsipopover").position({
            my: "bottom",
            at: "top",
            collision: "fit",
            of: this.element,
            using: function (position, elements) {
                var calcLeft = elements.target.left - elements.element.left + elements.target.width/2;
                $(".jitsipopover").css({top: position.top, left: position.left, display: "table"});
                $(".jitsipopover > .arrow").css({left: calcLeft});
                $(".jitsipopover > .jitsiPopupmenuPadding").css({left: calcLeft - 50});
            }
        });
    };

    /**
     * Updates the content of popover.
     * @param content new content
     */
    JitsiPopover.prototype.updateContent = function (content) {
        this.options.content = content;
        if(!this.popoverShown)
            return;
        $(".jitsipopover").remove();
        this.createPopover();
    };

    return JitsiPopover;


})();

module.exports = JitsiPopover;
},{}],28:[function(require,module,exports){
/* global $, APP, jQuery, toastr */
var messageHandler = (function(my) {

    /**
     * Shows a message to the user.
     *
     * @param titleString the title of the message
     * @param messageString the text of the message
     */
    my.openMessageDialog = function(titleKey, messageKey) {
        var title = null;
        if(titleKey)
        {
            title = APP.translation.generateTranslatonHTML(titleKey);
        }
        var message = APP.translation.generateTranslatonHTML(messageKey);
        $.prompt(message,
            {
                title: title,
                persistent: false
            }
        );
    };

    /**
     * Shows a message to the user with two buttons: first is given as a parameter and the second is Cancel.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is persistent or not
     * @param leftButton the fist button's text
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully loaded
     * @param closeFunction function to be called after the prompt is closed
     * @param focus optional focus selector or button index to be focused after
     *        the dialog is opened
     * @param defaultButton index of default button which will be activated when
     *        the user press 'enter'. Indexed from 0.
     */
    my.openTwoButtonDialog = function(titleKey, titleString, msgKey, msgString,
        persistent, leftButtonKey, submitFunction, loadedFunction,
        closeFunction, focus, defaultButton)
    {
        var buttons = [];

        var leftButton = APP.translation.generateTranslatonHTML(leftButtonKey);
        buttons.push({ title: leftButton, value: true});

        var cancelButton
            = APP.translation.generateTranslatonHTML("dialog.Cancel");
        buttons.push({title: cancelButton, value: false});

        var message = msgString, title = titleString;
        if (titleKey)
        {
            title = APP.translation.generateTranslatonHTML(titleKey);
        }
        if (msgKey) {
            message = APP.translation.generateTranslatonHTML(msgKey);
        }
        $.prompt(message, {
            title: title,
            persistent: false,
            buttons: buttons,
            defaultButton: defaultButton,
            focus: focus,
            loaded: loadedFunction,
            submit: submitFunction,
            close: closeFunction
        });
    };

    /**
     * Shows a message to the user with two buttons: first is given as a parameter and the second is Cancel.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param persistent boolean value which determines whether the message is persistent or not
     * @param buttons object with the buttons. The keys must be the name of the button and value is the value
     * that will be passed to submitFunction
     * @param submitFunction function to be called on submit
     * @param loadedFunction function to be called after the prompt is fully loaded
     */
    my.openDialog = function (titleString, msgString, persistent, buttons,
                              submitFunction, loadedFunction) {
        var args = {
            title: titleString,
            persistent: persistent,
            buttons: buttons,
            defaultButton: 1,
            loaded: loadedFunction,
            submit: submitFunction
        };
        if (persistent) {
            args.closeText = '';
        }
        return new Impromptu(msgString, args);
    };

    /**
     * Closes currently opened dialog.
     */
    my.closeDialog = function () {
        $.prompt.close();
    };

    /**
     * Shows a dialog with different states to the user.
     *
     * @param statesObject object containing all the states of the dialog
     */
    my.openDialogWithStates = function (statesObject, options) {

        return new Impromptu(statesObject, options);
    };

    /**
     * Opens new popup window for given <tt>url</tt> centered over current
     * window.
     *
     * @param url the URL to be displayed in the popup window
     * @param w the width of the popup window
     * @param h the height of the popup window
     * @param onPopupClosed optional callback function called when popup window
     *        has been closed.
     *
     * @returns popup window object if opened successfully or undefined
     *          in case we failed to open it(popup blocked)
     */
    my.openCenteredPopup = function (url, w, h, onPopupClosed) {
        var l = window.screenX + (window.innerWidth / 2) - (w / 2);
        var t = window.screenY + (window.innerHeight / 2) - (h / 2);
        var popup = window.open(
            url, '_blank',
            'top=' + t + ', left=' + l + ', width=' + w + ', height=' + h + '');
        if (popup && onPopupClosed) {
            var pollTimer = window.setInterval(function () {
                if (popup.closed !== false) {
                    window.clearInterval(pollTimer);
                    onPopupClosed();
                }
            }, 200);
        }
        return popup;
    };

    /**
     * Shows a dialog prompting the user to send an error report.
     *
     * @param titleString the title of the message
     * @param msgString the text of the message
     * @param error the error that is being reported
     */
    my.openReportDialog = function(titleKey, msgKey, error) {
        my.openMessageDialog(titleKey, msgKey);
        console.log(error);
        //FIXME send the error to the server
    };

    /**
     *  Shows an error dialog to the user.
     * @param title the title of the message
     * @param message the text of the messafe
     */
    my.showError = function(titleKey, msgKey) {

        if(!titleKey) {
            titleKey = "dialog.oops";
        }
        if(!msgKey)
        {
            msgKey = "dialog.defaultError";
        }
        messageHandler.openMessageDialog(titleKey, msgKey);
    };

    my.notify = function(displayName, displayNameKey,
                         cls, messageKey, messageArguments) {
        var displayNameSpan = '<span class="nickname" ';
        if(displayName)
        {
            displayNameSpan += ">" + displayName;
        }
        else
        {
            displayNameSpan += "data-i18n='" + displayNameKey +
                "'>" + APP.translation.translateString(displayNameKey);
        }
        displayNameSpan += "</span>";
        toastr.info(
            displayNameSpan + '<br>' +
            '<span class=' + cls + ' data-i18n="' + messageKey + '"' +
                (messageArguments?
                    " data-i18n-options='" + JSON.stringify(messageArguments) + "'"
                    : "") + ">" +
            APP.translation.translateString(messageKey,
                messageArguments) +
            '</span>');
    };

    return my;
}(messageHandler || {}));

module.exports = messageHandler;



},{}],29:[function(require,module,exports){
var UIEvents = require("../../../service/UI/UIEvents");

var nickname = null;
var eventEmitter = null;

var NickanameHandler = {
    init: function (emitter) {
        eventEmitter = emitter;
        var storedDisplayName = window.localStorage.displayname;
        if (storedDisplayName) {
            nickname = storedDisplayName;
        }
    },
    setNickname: function (newNickname) {
        if (!newNickname || nickname === newNickname)
            return;

        nickname = newNickname;
        window.localStorage.displayname = nickname;
        eventEmitter.emit(UIEvents.NICKNAME_CHANGED, newNickname);
    },
    getNickname: function () {
        return nickname;
    },
    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    }
};

module.exports = NickanameHandler;
},{"../../../service/UI/UIEvents":93}],30:[function(require,module,exports){
/**
 * Created by hristo on 12/22/14.
 */
module.exports = {
    /**
     * Returns the available video width.
     */
    getAvailableVideoWidth: function () {
        var PanelToggler = require("../side_pannels/SidePanelToggler");
        var rightPanelWidth
            = PanelToggler.isVisible() ? PanelToggler.getPanelSize()[0] : 0;

        return window.innerWidth - rightPanelWidth;
    },
    /**
     * Changes the style class of the element given by id.
     */
    buttonClick: function(id, classname) {
        $(id).toggleClass(classname); // add the class to the clicked element
    },
    /**
     * Returns the text width for the given element.
     *
     * @param el the element
     */
    getTextWidth: function (el) {
        return (el.clientWidth + 1);
    },

    /**
     * Returns the text height for the given element.
     *
     * @param el the element
     */
    getTextHeight: function (el) {
        return (el.clientHeight + 1);
    },

    /**
     * Plays the sound given by id.
     *
     * @param id the identifier of the audio element.
     */
    playSoundNotification: function (id) {
        document.getElementById(id).play();
    },

    /**
     * Escapes the given text.
     */
    escapeHtml: function (unsafeText) {
        return $('<div/>').text(unsafeText).html();
    },

    imageToGrayScale: function (canvas) {
        var context = canvas.getContext('2d');
        var imgData = context.getImageData(0, 0, canvas.width, canvas.height);
        var pixels  = imgData.data;

        for (var i = 0, n = pixels.length; i < n; i += 4) {
            var grayscale
                = pixels[i] * .3 + pixels[i+1] * .59 + pixels[i+2] * .11;
            pixels[i  ] = grayscale;        // red
            pixels[i+1] = grayscale;        // green
            pixels[i+2] = grayscale;        // blue
            // pixels[i+3]              is alpha
        }
        // redraw the image in black & white
        context.putImageData(imgData, 0, 0);
    },

    setTooltip: function (element, key, position) {
        element.setAttribute("data-i18n", "[data-content]" + key);
        element.setAttribute("data-toggle", "popover");
        element.setAttribute("data-placement", position);
        element.setAttribute("data-html", true);
        element.setAttribute("data-container", "body");
    }


};
},{"../side_pannels/SidePanelToggler":17}],31:[function(require,module,exports){
var JitsiPopover = require("../util/JitsiPopover");

/**
 * Constructs new connection indicator.
 * @param videoContainer the video container associated with the indicator.
 * @constructor
 */
function ConnectionIndicator(videoContainer, jid, VideoLayout)
{
    this.videoContainer = videoContainer;
    this.bandwidth = null;
    this.packetLoss = null;
    this.bitrate = null;
    this.showMoreValue = false;
    this.resolution = null;
    this.transport = [];
    this.popover = null;
    this.jid = jid;
    this.create();
    this.videoLayout = VideoLayout;
}

/**
 * Values for the connection quality
 * @type {{98: string,
 *         81: string,
 *         64: string,
 *         47: string,
 *         30: string,
 *         0: string}}
 */
ConnectionIndicator.connectionQualityValues = {
    98: "18px", //full
    81: "15px",//4 bars
    64: "11px",//3 bars
    47: "7px",//2 bars
    30: "3px",//1 bar
    0: "0px"//empty
};

ConnectionIndicator.getIP = function(value)
{
    return value.substring(0, value.lastIndexOf(":"));
};

ConnectionIndicator.getPort = function(value)
{
    return value.substring(value.lastIndexOf(":") + 1, value.length);
};

ConnectionIndicator.getStringFromArray = function (array) {
    var res = "";
    for(var i = 0; i < array.length; i++)
    {
        res += (i === 0? "" : ", ") + array[i];
    }
    return res;
};

/**
 * Generates the html content.
 * @returns {string} the html content.
 */
ConnectionIndicator.prototype.generateText = function () {
    var downloadBitrate, uploadBitrate, packetLoss, resolution, i;

    var translate = APP.translation.translateString;

    if(this.bitrate === null)
    {
        downloadBitrate = "N/A";
        uploadBitrate = "N/A";
    }
    else
    {
        downloadBitrate =
            this.bitrate.download? this.bitrate.download + " Kbps" : "N/A";
        uploadBitrate =
            this.bitrate.upload? this.bitrate.upload + " Kbps" : "N/A";
    }

    if(this.packetLoss === null)
    {
        packetLoss = "N/A";
    }
    else
    {

        packetLoss = "<span class='jitsipopover_green'>&darr;</span>" +
            (this.packetLoss.download !== null? this.packetLoss.download : "N/A") +
            "% <span class='jitsipopover_orange'>&uarr;</span>" +
            (this.packetLoss.upload !== null? this.packetLoss.upload : "N/A") + "%";
    }

    var resolutionValue = null;
    if(this.resolution && this.jid != null)
    {
        var keys = Object.keys(this.resolution);
        if(keys.length == 1)
        {
            for(var ssrc in this.resolution)
            {
                resolutionValue = this.resolution[ssrc];
            }
        }
        else if(keys.length > 1)
        {
            var displayedSsrc = APP.simulcast.getReceivingSSRC(this.jid);
            resolutionValue = this.resolution[displayedSsrc];
        }
    }

    if(this.jid === null)
    {
        resolution = "";
        if(this.resolution === null || !Object.keys(this.resolution) ||
            Object.keys(this.resolution).length === 0)
        {
            resolution = "N/A";
        }
        else
            for(i in this.resolution)
            {
                resolutionValue = this.resolution[i];
                if(resolutionValue)
                {
                    if(resolutionValue.height &&
                        resolutionValue.width)
                    {
                        resolution += (resolution === ""? "" : ", ") +
                            resolutionValue.width + "x" +
                            resolutionValue.height;
                    }
                }
            }
    }
    else if(!resolutionValue ||
        !resolutionValue.height ||
        !resolutionValue.width)
    {
        resolution = "N/A";
    }
    else
    {
        resolution = resolutionValue.width + "x" + resolutionValue.height;
    }

    var result = "<table style='width:100%'>" +
        "<tr>" +
        "<td><span class='jitsipopover_blue' data-i18n='connectionindicator.bitrate'>" +
        translate("connectionindicator.bitrate") + "</span></td>" +
        "<td><span class='jitsipopover_green'>&darr;</span>" +
        downloadBitrate + " <span class='jitsipopover_orange'>&uarr;</span>" +
        uploadBitrate + "</td>" +
        "</tr><tr>" +
        "<td><span class='jitsipopover_blue' data-i18n='connectionindicator.packetloss'>" +
        translate("connectionindicator.packetloss") + "</span></td>" +
        "<td>" + packetLoss  + "</td>" +
        "</tr><tr>" +
        "<td><span class='jitsipopover_blue' data-i18n='connectionindicator.resolution'>" +
        translate("connectionindicator.resolution") + "</span></td>" +
        "<td>" + resolution + "</td></tr></table>";

    if(this.videoContainer.id == "localVideoContainer") {
        result += "<div class=\"jitsipopover_showmore\" " +
            "onclick = \"APP.UI.connectionIndicatorShowMore('" +
            this.videoContainer.id + "')\"  data-i18n='connectionindicator." +
                (this.showMoreValue ? "less" : "more") + "'>" +
            translate("connectionindicator." + (this.showMoreValue ? "less" : "more")) +
            "</div><br />";
    }

    if(this.showMoreValue)
    {
        var downloadBandwidth, uploadBandwidth, transport;
        if(this.bandwidth === null)
        {
            downloadBandwidth = "N/A";
            uploadBandwidth = "N/A";
        }
        else
        {
            downloadBandwidth = this.bandwidth.download?
                this.bandwidth.download + " Kbps" :
                "N/A";
            uploadBandwidth = this.bandwidth.upload?
                this.bandwidth.upload + " Kbps" :
                "N/A";
        }

        if(!this.transport || this.transport.length === 0)
        {
            transport = "<tr>" +
                "<td><span class='jitsipopover_blue' " +
                "data-i18n='connectionindicator.address'>" +
                translate("connectionindicator.address") + "</span></td>" +
                "<td> N/A</td></tr>";
        }
        else
        {
            var data = {remoteIP: [], localIP:[], remotePort:[], localPort:[]};
            for(i = 0; i < this.transport.length; i++)
            {
                var ip =  ConnectionIndicator.getIP(this.transport[i].ip);
                var port = ConnectionIndicator.getPort(this.transport[i].ip);
                var localIP =
                    ConnectionIndicator.getIP(this.transport[i].localip);
                var localPort =
                    ConnectionIndicator.getPort(this.transport[i].localip);
                if(data.remoteIP.indexOf(ip) == -1)
                {
                    data.remoteIP.push(ip);
                }

                if(data.remotePort.indexOf(port) == -1)
                {
                    data.remotePort.push(port);
                }

                if(data.localIP.indexOf(localIP) == -1)
                {
                    data.localIP.push(localIP);
                }

                if(data.localPort.indexOf(localPort) == -1)
                {
                    data.localPort.push(localPort);
                }

            }

            var local_address_key = "connectionindicator.localaddress";
            var remote_address_key = "connectionindicator.remoteaddress";
            var localTransport =
                "<tr><td><span class='jitsipopover_blue' data-i18n='" +
                local_address_key +"' data-i18n-options='" +
                    JSON.stringify({count: data.localIP.length}) + "'>" +
                    translate(local_address_key, {count: data.localIP.length}) +
                    "</span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.localIP) +
                "</td></tr>";
            transport =
                "<tr><td><span class='jitsipopover_blue' data-i18n='" +
                remote_address_key + "' data-i18n-options='" +
                    JSON.stringify({count: data.remoteIP.length}) + "'>" +
                    translate(remote_address_key,
                        {count: data.remoteIP.length}) +
                    "</span></td><td> " +
                ConnectionIndicator.getStringFromArray(data.remoteIP) +
                "</td></tr>";

            var key_remote = "connectionindicator.remoteport",
                key_local = "connectionindicator.localport";

            transport += "<tr>" +
                "<td>" +
                "<span class='jitsipopover_blue' data-i18n='" + key_remote +
                "' data-i18n-options='" +
                JSON.stringify({count: this.transport.length}) + "'>" +
                translate(key_remote, {count: this.transport.length}) +
                "</span></td><td>";
            localTransport += "<tr>" +
                "<td>" +
                "<span class='jitsipopover_blue' data-i18n='" + key_local +
                "' data-i18n-options='" +
                JSON.stringify({count: this.transport.length}) + "'>" +
                translate(key_local, {count: this.transport.length}) +
                "</span></td><td>";

            transport +=
                ConnectionIndicator.getStringFromArray(data.remotePort);
            localTransport +=
                ConnectionIndicator.getStringFromArray(data.localPort);
            transport += "</td></tr>";
            transport += localTransport + "</td></tr>";
            transport +="<tr>" +
                "<td><span class='jitsipopover_blue' data-i18n='connectionindicator.transport'>" +
                translate("connectionindicator.transport") + "</span></td>" +
                "<td>" + this.transport[0].type + "</td></tr>";

        }

        result += "<table  style='width:100%'>" +
            "<tr>" +
            "<td>" +
            "<span class='jitsipopover_blue' data-i18n='connectionindicator.bandwidth'>" +
            translate("connectionindicator.bandwidth") + "</span>" +
            "</td><td>" +
            "<span class='jitsipopover_green'>&darr;</span>" +
            downloadBandwidth +
            " <span class='jitsipopover_orange'>&uarr;</span>" +
            uploadBandwidth + "</td></tr>";

        result += transport + "</table>";

    }

    return result;
};

/**
 * Shows or hide the additional information.
 */
ConnectionIndicator.prototype.showMore = function () {
    this.showMoreValue = !this.showMoreValue;
    this.updatePopoverData();
};


function createIcon(classes)
{
    var icon = document.createElement("span");
    for(var i in classes)
    {
        icon.classList.add(classes[i]);
    }
    icon.appendChild(
        document.createElement("i")).classList.add("icon-connection");
    return icon;
}

/**
 * Creates the indicator
 */
ConnectionIndicator.prototype.create = function () {
    this.connectionIndicatorContainer = document.createElement("div");
    this.connectionIndicatorContainer.className = "connectionindicator";
    this.connectionIndicatorContainer.style.display = "none";
    this.videoContainer.appendChild(this.connectionIndicatorContainer);
    this.popover = new JitsiPopover(
        $("#" + this.videoContainer.id + " > .connectionindicator"),
        {content: "<div class=\"connection_info\" data-i18n='connectionindicator.na'>" +
            APP.translation.translateString("connectionindicator.na") + "</div>",
            skin: "black"});

    this.emptyIcon = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_empty"]));
    this.fullIcon = this.connectionIndicatorContainer.appendChild(
        createIcon(["connection", "connection_full"]));

};

/**
 * Removes the indicator
 */
ConnectionIndicator.prototype.remove = function()
{
    this.connectionIndicatorContainer.remove();
    this.popover.forceHide();

};

/**
 * Updates the data of the indicator
 * @param percent the percent of connection quality
 * @param object the statistics data.
 */
ConnectionIndicator.prototype.updateConnectionQuality =
function (percent, object) {

    if(percent === null)
    {
        this.connectionIndicatorContainer.style.display = "none";
        this.popover.forceHide();
        return;
    }
    else
    {
        if(this.connectionIndicatorContainer.style.display == "none") {
            this.connectionIndicatorContainer.style.display = "block";
            this.videoLayout.updateMutePosition(this.videoContainer.id);
        }
    }
    this.bandwidth = object.bandwidth;
    this.bitrate = object.bitrate;
    this.packetLoss = object.packetLoss;
    this.transport = object.transport;
    if(object.resolution)
    {
        this.resolution = object.resolution;
    }
    for(var quality in ConnectionIndicator.connectionQualityValues)
    {
        if(percent >= quality)
        {
            this.fullIcon.style.width =
                ConnectionIndicator.connectionQualityValues[quality];
        }
    }
    this.updatePopoverData();
};

/**
 * Updates the resolution
 * @param resolution the new resolution
 */
ConnectionIndicator.prototype.updateResolution = function (resolution) {
    this.resolution = resolution;
    this.updatePopoverData();
};

/**
 * Updates the content of the popover
 */
ConnectionIndicator.prototype.updatePopoverData = function () {
    this.popover.updateContent(
        "<div class=\"connection_info\">" + this.generateText() + "</div>");
    APP.translation.translateElement($(".connection_info"));
};

/**
 * Hides the popover
 */
ConnectionIndicator.prototype.hide = function () {
    this.popover.forceHide();
};

/**
 * Hides the indicator
 */
ConnectionIndicator.prototype.hideIndicator = function () {
    this.connectionIndicatorContainer.style.display = "none";
    if(this.popover)
        this.popover.forceHide();
};

module.exports = ConnectionIndicator;
},{"../util/JitsiPopover":27}],32:[function(require,module,exports){
var AudioLevels = require("../audio_levels/AudioLevels");
var Avatar = require("../avatar/Avatar");
var Chat = require("../side_pannels/chat/Chat");
var ContactList = require("../side_pannels/contactlist/ContactList");
var UIUtil = require("../util/UIUtil");
var ConnectionIndicator = require("./ConnectionIndicator");
var NicknameHandler = require("../util/NicknameHandler");
var MediaStreamType = require("../../../service/RTC/MediaStreamTypes");
var UIEvents = require("../../../service/UI/UIEvents");

var currentDominantSpeaker = null;
var lastNCount = config.channelLastN;
var localLastNCount = config.channelLastN;
var localLastNSet = [];
var lastNEndpointsCache = [];
var lastNPickupJid = null;
var largeVideoState = {
    updateInProgress: false,
    newSrc: ''
};

var eventEmitter = null;

/**
 * Currently focused video "src"(displayed in large video).
 * @type {String}
 */
var focusedVideoInfo = null;

/**
 * Indicates if we have muted our audio before the conference has started.
 * @type {boolean}
 */
var preMuted = false;

var mutedAudios = {};

var flipXLocalVideo = true;
var currentVideoWidth = null;
var currentVideoHeight = null;

var localVideoSrc = null;

function videoactive( videoelem) {
    if (videoelem.attr('id').indexOf('mixedmslabel') === -1) {
        // ignore mixedmslabela0 and v0

        videoelem.show();
        VideoLayout.resizeThumbnails();

        var videoParent = videoelem.parent();
        var parentResourceJid = null;
        if (videoParent)
            parentResourceJid
                = VideoLayout.getPeerContainerResourceJid(videoParent[0]);

        // Update the large video to the last added video only if there's no
        // current dominant, focused speaker or prezi playing or update it to
        // the current dominant speaker.
        if ((!focusedVideoInfo &&
            !VideoLayout.getDominantSpeakerResourceJid() &&
            !require("../prezi/Prezi").isPresentationVisible()) ||
            (parentResourceJid &&
                VideoLayout.getDominantSpeakerResourceJid() === parentResourceJid)) {
            VideoLayout.updateLargeVideo(
                APP.RTC.getVideoSrc(videoelem[0]),
                1,
                parentResourceJid);
        }

        VideoLayout.showModeratorIndicator();
    }
}

function waitForRemoteVideo(selector, ssrc, stream, jid) {
    // XXX(gp) so, every call to this function is *always* preceded by a call
    // to the RTC.attachMediaStream() function but that call is *not* followed
    // by an update to the videoSrcToSsrc map!
    //
    // The above way of doing things results in video SRCs that don't correspond
    // to any SSRC for a short period of time (to be more precise, for as long
    // the waitForRemoteVideo takes to complete). This causes problems (see
    // bellow).
    //
    // I'm wondering why we need to do that; i.e. why call RTC.attachMediaStream()
    // a second time in here and only then update the videoSrcToSsrc map? Why
    // not simply update the videoSrcToSsrc map when the RTC.attachMediaStream()
    // is called the first time? I actually do that in the lastN changed event
    // handler because the "orphan" video SRC is causing troubles there. The
    // purpose of this method would then be to fire the "videoactive.jingle".
    //
    // Food for though I guess :-)

    if (selector.removed || !selector.parent().is(":visible")) {
        console.warn("Media removed before had started", selector);
        return;
    }

    if (stream.id === 'mixedmslabel') return;

    if (selector[0].currentTime > 0) {
        var videoStream = APP.simulcast.getReceivingVideoStream(stream);
        APP.RTC.attachMediaStream(selector, videoStream); // FIXME: why do i have to do this for FF?
        videoactive(selector);
    } else {
        setTimeout(function () {
            waitForRemoteVideo(selector, ssrc, stream, jid);
        }, 250);
    }
}

/**
 * Returns an array of the video horizontal and vertical indents,
 * so that if fits its parent.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getCameraVideoPosition(videoWidth,
                                videoHeight,
                                videoSpaceWidth,
                                videoSpaceHeight) {
    // Parent height isn't completely calculated when we position the video in
    // full screen mode and this is why we use the screen height in this case.
    // Need to think it further at some point and implement it properly.
    var isFullScreen = document.fullScreen ||
        document.mozFullScreen ||
        document.webkitIsFullScreen;
    if (isFullScreen)
        videoSpaceHeight = window.innerHeight;

    var horizontalIndent = (videoSpaceWidth - videoWidth) / 2;
    var verticalIndent = (videoSpaceHeight - videoHeight) / 2;

    return [horizontalIndent, verticalIndent];
}

/**
 * Returns an array of the video horizontal and vertical indents.
 * Centers horizontally and top aligns vertically.
 *
 * @return an array with 2 elements, the horizontal indent and the vertical
 * indent
 */
function getDesktopVideoPosition(videoWidth,
                                 videoHeight,
                                 videoSpaceWidth,
                                 videoSpaceHeight) {

    var horizontalIndent = (videoSpaceWidth - videoWidth) / 2;

    var verticalIndent = 0;// Top aligned

    return [horizontalIndent, verticalIndent];
}


/**
 * Returns an array of the video dimensions, so that it covers the screen.
 * It leaves no empty areas, but some parts of the video might not be visible.
 *
 * @return an array with 2 elements, the video width and the video height
 */
function getCameraVideoSize(videoWidth,
                            videoHeight,
                            videoSpaceWidth,
                            videoSpaceHeight) {
    if (!videoWidth)
        videoWidth = currentVideoWidth;
    if (!videoHeight)
        videoHeight = currentVideoHeight;

    var aspectRatio = videoWidth / videoHeight;

    var availableWidth = Math.max(videoWidth, videoSpaceWidth);
    var availableHeight = Math.max(videoHeight, videoSpaceHeight);

    if (availableWidth / aspectRatio < videoSpaceHeight) {
        availableHeight = videoSpaceHeight;
        availableWidth = availableHeight * aspectRatio;
    }

    if (availableHeight * aspectRatio < videoSpaceWidth) {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth / aspectRatio;
    }

    return [availableWidth, availableHeight];
}

/**
 * Sets the display name for the given video span id.
 */
function setDisplayName(videoSpanId, displayName, key) {
    var nameSpan = $('#' + videoSpanId + '>span.displayname');
    var defaultLocalDisplayName = APP.translation.generateTranslatonHTML(
        interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);

    // If we already have a display name for this video.
    if (nameSpan.length > 0) {
        var nameSpanElement = nameSpan.get(0);

        if (nameSpanElement.id === 'localDisplayName' &&
            $('#localDisplayName').text() !== displayName) {
            if (displayName && displayName.length > 0)
            {
                var meHTML = APP.translation.generateTranslatonHTML("me");
                $('#localDisplayName').html(displayName + ' (' + meHTML + ')');
            }
            else
                $('#localDisplayName').html(defaultLocalDisplayName);
        } else {
            if (displayName && displayName.length > 0)
            {
                $('#' + videoSpanId + '_name').html(displayName);
            }
            else if (key && key.length > 0)
            {
                var nameHtml = APP.translation.generateTranslatonHTML(key);
                $('#' + videoSpanId + '_name').html(nameHtml);
            }
            else
                $('#' + videoSpanId + '_name').text(
                    interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME);
        }
    } else {
        var editButton = null;

        nameSpan = document.createElement('span');
        nameSpan.className = 'displayname';
        $('#' + videoSpanId)[0].appendChild(nameSpan);

        if (videoSpanId === 'localVideoContainer') {
            editButton = createEditDisplayNameButton();
            if (displayName && displayName.length > 0) {
                var meHTML = APP.translation.generateTranslatonHTML("me");
                nameSpan.innerHTML = displayName + meHTML;
            }
            else
                nameSpan.innerHTML = defaultLocalDisplayName;
        }
        else {
            if (displayName && displayName.length > 0) {

                nameSpan.innerText = displayName;
            }
            else
                nameSpan.innerText = interfaceConfig.DEFAULT_REMOTE_DISPLAY_NAME;
        }


        if (!editButton) {
            nameSpan.id = videoSpanId + '_name';
        } else {
            nameSpan.id = 'localDisplayName';
            $('#' + videoSpanId)[0].appendChild(editButton);
            //translates popover of edit button
            APP.translation.translateElement($("a.displayname"));

            var editableText = document.createElement('input');
            editableText.className = 'displayname';
            editableText.type = 'text';
            editableText.id = 'editDisplayName';

            if (displayName && displayName.length) {
                editableText.value
                    = displayName;
            }

            var defaultNickname = APP.translation.translateString(
                "defaultNickname", {name: "Jane Pink"});
            editableText.setAttribute('style', 'display:none;');
            editableText.setAttribute('data-18n',
                '[placeholder]defaultNickname');
            editableText.setAttribute("data-i18n-options",
                JSON.stringify({name: "Jane Pink"}));
            editableText.setAttribute("placeholder", defaultNickname);

            $('#' + videoSpanId)[0].appendChild(editableText);

            $('#localVideoContainer .displayname')
                .bind("click", function (e) {

                    e.preventDefault();
                    e.stopPropagation();
                    $('#localDisplayName').hide();
                    $('#editDisplayName').show();
                    $('#editDisplayName').focus();
                    $('#editDisplayName').select();

                    $('#editDisplayName').one("focusout", function (e) {
                        VideoLayout.inputDisplayNameHandler(this.value);
                    });

                    $('#editDisplayName').on('keydown', function (e) {
                        if (e.keyCode === 13) {
                            e.preventDefault();
                            VideoLayout.inputDisplayNameHandler(this.value);
                        }
                    });
                });
        }
    }
}

/**
 * Gets the selector of video thumbnail container for the user identified by
 * given <tt>userJid</tt>
 * @param resourceJid user's Jid for whom we want to get the video container.
 */
function getParticipantContainer(resourceJid)
{
    if (!resourceJid)
        return null;

    if (resourceJid === APP.xmpp.myResource())
        return $("#localVideoContainer");
    else
        return $("#participant_" + resourceJid);
}

/**
 * Sets the size and position of the given video element.
 *
 * @param video the video element to position
 * @param width the desired video width
 * @param height the desired video height
 * @param horizontalIndent the left and right indent
 * @param verticalIndent the top and bottom indent
 */
function positionVideo(video,
                       width,
                       height,
                       horizontalIndent,
                       verticalIndent) {
    video.width(width);
    video.height(height);
    video.css({  top: verticalIndent + 'px',
        bottom: verticalIndent + 'px',
        left: horizontalIndent + 'px',
        right: horizontalIndent + 'px'});
}

/**
 * Adds the remote video menu element for the given <tt>jid</tt> in the
 * given <tt>parentElement</tt>.
 *
 * @param jid the jid indicating the video for which we're adding a menu.
 * @param parentElement the parent element where this menu will be added
 */
function addRemoteVideoMenu(jid, parentElement) {
    var spanElement = document.createElement('span');
    spanElement.className = 'remotevideomenu';

    parentElement.appendChild(spanElement);

    var menuElement = document.createElement('i');
    menuElement.className = 'fa fa-angle-down';
    menuElement.title = 'Remote user controls';
    spanElement.appendChild(menuElement);

//        <ul class="popupmenu">
//        <li><a href="#">Mute</a></li>
//        <li><a href="#">Eject</a></li>
//        </ul>

    var popupmenuElement = document.createElement('ul');
    popupmenuElement.className = 'popupmenu';
    popupmenuElement.id
        = 'remote_popupmenu_' + Strophe.getResourceFromJid(jid);
    spanElement.appendChild(popupmenuElement);

    var muteMenuItem = document.createElement('li');
    var muteLinkItem = document.createElement('a');

    var mutedIndicator = "<i style='float:left;' class='icon-mic-disabled'></i>";

    if (!mutedAudios[jid]) {
        muteLinkItem.innerHTML = mutedIndicator +
            " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.domute'></div>";
        muteLinkItem.className = 'mutelink';
    }
    else {
        muteLinkItem.innerHTML = mutedIndicator +
            " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.muted'></div>";
        muteLinkItem.className = 'mutelink disabled';
    }

    muteLinkItem.onclick = function(){
        if ($(this).attr('disabled') != undefined) {
            event.preventDefault();
        }
        var isMute = mutedAudios[jid] == true;
        APP.xmpp.setMute(jid, !isMute);

        popupmenuElement.setAttribute('style', 'display:none;');

        if (isMute) {
            this.innerHTML = mutedIndicator +
                " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.muted'></div>";
            this.className = 'mutelink disabled';
        }
        else {
            this.innerHTML = mutedIndicator +
                " <div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.domute'></div>";
            this.className = 'mutelink';
        }
    };

    muteMenuItem.appendChild(muteLinkItem);
    popupmenuElement.appendChild(muteMenuItem);

    var ejectIndicator = "<i style='float:left;' class='fa fa-eject'></i>";

    var ejectMenuItem = document.createElement('li');
    var ejectLinkItem = document.createElement('a');
    var ejectText = "<div style='width: 90px;margin-left: 20px;' data-i18n='videothumbnail.kick'>&nbsp;</div>";
    ejectLinkItem.innerHTML = ejectIndicator + ' ' + ejectText;
    ejectLinkItem.onclick = function(){
        APP.xmpp.eject(jid);
        popupmenuElement.setAttribute('style', 'display:none;');
    };

    ejectMenuItem.appendChild(ejectLinkItem);
    popupmenuElement.appendChild(ejectMenuItem);

    var paddingSpan = document.createElement('span');
    paddingSpan.className = 'popupmenuPadding';
    popupmenuElement.appendChild(paddingSpan);
    APP.translation.translateElement($("#" + popupmenuElement.id + " > li > a > div"));
}

/**
 * Removes remote video menu element from video element identified by
 * given <tt>videoElementId</tt>.
 *
 * @param videoElementId the id of local or remote video element.
 */
function removeRemoteVideoMenu(videoElementId) {
    var menuSpan = $('#' + videoElementId + '>span.remotevideomenu');
    if (menuSpan.length) {
        menuSpan.remove();
    }
}

/**
 * Updates the data for the indicator
 * @param id the id of the indicator
 * @param percent the percent for connection quality
 * @param object the data
 */
function updateStatsIndicator(id, percent, object) {
    if(VideoLayout.connectionIndicators[id])
        VideoLayout.connectionIndicators[id].updateConnectionQuality(percent, object);
}


/**
 * Returns an array of the video dimensions, so that it keeps it's aspect
 * ratio and fits available area with it's larger dimension. This method
 * ensures that whole video will be visible and can leave empty areas.
 *
 * @return an array with 2 elements, the video width and the video height
 */
function getDesktopVideoSize(videoWidth,
                             videoHeight,
                             videoSpaceWidth,
                             videoSpaceHeight) {
    if (!videoWidth)
        videoWidth = currentVideoWidth;
    if (!videoHeight)
        videoHeight = currentVideoHeight;

    var aspectRatio = videoWidth / videoHeight;

    var availableWidth = Math.max(videoWidth, videoSpaceWidth);
    var availableHeight = Math.max(videoHeight, videoSpaceHeight);

    videoSpaceHeight -= $('#remoteVideos').outerHeight();

    if (availableWidth / aspectRatio >= videoSpaceHeight)
    {
        availableHeight = videoSpaceHeight;
        availableWidth = availableHeight * aspectRatio;
    }

    if (availableHeight * aspectRatio >= videoSpaceWidth)
    {
        availableWidth = videoSpaceWidth;
        availableHeight = availableWidth / aspectRatio;
    }

    return [availableWidth, availableHeight];
}

/**
 * Creates the edit display name button.
 *
 * @returns the edit button
 */
function createEditDisplayNameButton() {
    var editButton = document.createElement('a');
    editButton.className = 'displayname';
    UIUtil.setTooltip(editButton,
        "videothumbnail.editnickname",
        "top");
    editButton.innerHTML = '<i class="fa fa-pencil"></i>';

    return editButton;
}

/**
 * Creates the element indicating the moderator(owner) of the conference.
 *
 * @param parentElement the parent element where the owner indicator will
 * be added
 */
function createModeratorIndicatorElement(parentElement) {
    var moderatorIndicator = document.createElement('i');
    moderatorIndicator.className = 'fa fa-star';
    parentElement.appendChild(moderatorIndicator);

    UIUtil.setTooltip(parentElement,
        "videothumbnail.moderator",
        "top");
}


var VideoLayout = (function (my) {
    my.connectionIndicators = {};

    // By default we use camera
    my.getVideoSize = getCameraVideoSize;
    my.getVideoPosition = getCameraVideoPosition;

    my.init = function (emitter) {
        // Listen for large video size updates
        document.getElementById('largeVideo')
            .addEventListener('loadedmetadata', function (e) {
                currentVideoWidth = this.videoWidth;
                currentVideoHeight = this.videoHeight;
                VideoLayout.positionLarge(currentVideoWidth, currentVideoHeight);
            });
        eventEmitter = emitter;
    };

    my.isInLastN = function(resource) {
        return lastNCount < 0 // lastN is disabled, return true
            || (lastNCount > 0 && lastNEndpointsCache.length == 0) // lastNEndpoints cache not built yet, return true
            || (lastNEndpointsCache && lastNEndpointsCache.indexOf(resource) !== -1);
    };

    my.changeLocalStream = function (stream) {
        VideoLayout.changeLocalVideo(stream);
    };

    my.changeLocalAudio = function(stream) {
        APP.RTC.attachMediaStream($('#localAudio'), stream.getOriginalStream());
        document.getElementById('localAudio').autoplay = true;
        document.getElementById('localAudio').volume = 0;
        if (preMuted) {
            if(!APP.UI.setAudioMuted(true))
            {
                preMuted = mute;
            }
            preMuted = false;
        }
    };

    my.changeLocalVideo = function(stream) {
        var flipX = true;
        if(stream.videoType == "screen")
            flipX = false;
        var localVideo = document.createElement('video');
        localVideo.id = 'localVideo_' +
            APP.RTC.getStreamID(stream.getOriginalStream());
        localVideo.autoplay = true;
        localVideo.volume = 0; // is it required if audio is separated ?
        localVideo.oncontextmenu = function () { return false; };

        var localVideoContainer = document.getElementById('localVideoWrapper');
        localVideoContainer.appendChild(localVideo);

        // Set default display name.
        setDisplayName('localVideoContainer');

        if(!VideoLayout.connectionIndicators["localVideoContainer"]) {
            VideoLayout.connectionIndicators["localVideoContainer"]
                = new ConnectionIndicator($("#localVideoContainer")[0], null, VideoLayout);
        }

        AudioLevels.updateAudioLevelCanvas(null, VideoLayout);

        var localVideoSelector = $('#' + localVideo.id);

        function localVideoClick(event) {
            event.stopPropagation();
            VideoLayout.handleVideoThumbClicked(
                APP.RTC.getVideoSrc(localVideo),
                false,
                APP.xmpp.myResource());
        }
        // Add click handler to both video and video wrapper elements in case
        // there's no video.
        localVideoSelector.click(localVideoClick);
        $('#localVideoContainer').click(localVideoClick);

        // Add hover handler
        $('#localVideoContainer').hover(
            function() {
                VideoLayout.showDisplayName('localVideoContainer', true);
            },
            function() {
                if (!VideoLayout.isLargeVideoVisible()
                        || APP.RTC.getVideoSrc(localVideo) !== APP.RTC.getVideoSrc($('#largeVideo')[0]))
                    VideoLayout.showDisplayName('localVideoContainer', false);
            }
        );
        // Add stream ended handler
        stream.getOriginalStream().onended = function () {
            localVideoContainer.removeChild(localVideo);
            VideoLayout.updateRemovedVideo(APP.RTC.getVideoSrc(localVideo));
        };
        // Flip video x axis if needed
        flipXLocalVideo = flipX;
        if (flipX) {
            localVideoSelector.addClass("flipVideoX");
        }
        // Attach WebRTC stream
        var videoStream = APP.simulcast.getLocalVideoStream();
        APP.RTC.attachMediaStream(localVideoSelector, videoStream);

        localVideoSrc = APP.RTC.getVideoSrc(localVideo);

        var myResourceJid = APP.xmpp.myResource();

        VideoLayout.updateLargeVideo(localVideoSrc, 0,
            myResourceJid);

    };

    /**
     * Checks if removed video is currently displayed and tries to display
     * another one instead.
     * @param removedVideoSrc src stream identifier of the video.
     */
    my.updateRemovedVideo = function(removedVideoSrc) {
        if (removedVideoSrc === APP.RTC.getVideoSrc($('#largeVideo')[0])) {
            // this is currently displayed as large
            // pick the last visible video in the row
            // if nobody else is left, this picks the local video
            var pick
                = $('#remoteVideos>span[id!="mixedstream"]:visible:last>video')
                    .get(0);

            if (!pick) {
                console.info("Last visible video no longer exists");
                pick = $('#remoteVideos>span[id!="mixedstream"]>video').get(0);

                if (!pick || !APP.RTC.getVideoSrc(pick)) {
                    // Try local video
                    console.info("Fallback to local video...");
                    pick = $('#remoteVideos>span>span>video').get(0);
                }
            }

            // mute if localvideo
            if (pick) {
                var container = pick.parentNode;
                var jid = null;
                if(container)
                {
                    if(container.id == "localVideoWrapper")
                    {
                        jid = APP.xmpp.myResource();
                    }
                    else
                    {
                        jid = VideoLayout.getPeerContainerResourceJid(container);
                    }
                }

                VideoLayout.updateLargeVideo(APP.RTC.getVideoSrc(pick), pick.volume, jid);
            } else {
                console.warn("Failed to elect large video");
            }
        }
    };
    
    my.onRemoteStreamAdded = function (stream) {
        var container;
        var remotes = document.getElementById('remoteVideos');

        if (stream.peerjid) {
            VideoLayout.ensurePeerContainerExists(stream.peerjid);

            container  = document.getElementById(
                    'participant_' + Strophe.getResourceFromJid(stream.peerjid));
        } else {
            var id = stream.getOriginalStream().id;
            if (id !== 'mixedmslabel'
                // FIXME: default stream is added always with new focus
                // (to be investigated)
                && id !== 'default') {
                console.error('can not associate stream',
                    id,
                    'with a participant');
                // We don't want to add it here since it will cause troubles
                return;
            }
            // FIXME: for the mixed ms we dont need a video -- currently
            container = document.createElement('span');
            container.id = 'mixedstream';
            container.className = 'videocontainer';
            remotes.appendChild(container);
            UIUtil.playSoundNotification('userJoined');
        }

        if (container) {
            VideoLayout.addRemoteStreamElement( container,
                stream.sid,
                stream.getOriginalStream(),
                stream.peerjid,
                stream.ssrc);
        }
    }

    my.getLargeVideoState = function () {
        return largeVideoState;
    };

    /**
     * Updates the large video with the given new video source.
     */
    my.updateLargeVideo = function(newSrc, vol, resourceJid) {
        console.log('hover in', newSrc);

        if (APP.RTC.getVideoSrc($('#largeVideo')[0]) !== newSrc) {

            $('#activeSpeaker').css('visibility', 'hidden');
            // Due to the simulcast the localVideoSrc may have changed when the
            // fadeOut event triggers. In that case the getJidFromVideoSrc and
            // isVideoSrcDesktop methods will not function correctly.
            //
            // Also, again due to the simulcast, the updateLargeVideo method can
            // be called multiple times almost simultaneously. Therefore, we
            // store the state here and update only once.

            largeVideoState.newSrc = newSrc;
            largeVideoState.isVisible = $('#largeVideo').is(':visible');
            largeVideoState.isDesktop = APP.RTC.isVideoSrcDesktop(
                APP.xmpp.findJidFromResource(resourceJid));

            if(largeVideoState.userResourceJid) {
                largeVideoState.oldResourceJid = largeVideoState.userResourceJid;
            } else {
                largeVideoState.oldResourceJid = null;
            }
            largeVideoState.userResourceJid = resourceJid;

            // Screen stream is already rotated
            largeVideoState.flipX = (newSrc === localVideoSrc) && flipXLocalVideo;

            var userChanged = false;
            if (largeVideoState.oldResourceJid !== largeVideoState.userResourceJid) {
                userChanged = true;
                // we want the notification to trigger even if userJid is undefined,
                // or null.
                eventEmitter.emit(UIEvents.SELECTED_ENDPOINT,
                    largeVideoState.userResourceJid);
            }

            if (!largeVideoState.updateInProgress) {
                largeVideoState.updateInProgress = true;

                var doUpdate = function () {

                    Avatar.updateActiveSpeakerAvatarSrc(
                        APP.xmpp.findJidFromResource(
                            largeVideoState.userResourceJid));

                    if (!userChanged && largeVideoState.preload &&
                        largeVideoState.preload !== null &&
                        APP.RTC.getVideoSrc($(largeVideoState.preload)[0]) === newSrc)
                    {

                        console.info('Switching to preloaded video');
                        var attributes = $('#largeVideo').prop("attributes");

                        // loop through largeVideo attributes and apply them on
                        // preload.
                        $.each(attributes, function () {
                            if (this.name !== 'id' && this.name !== 'src') {
                                largeVideoState.preload.attr(this.name, this.value);
                            }
                        });

                        largeVideoState.preload.appendTo($('#largeVideoContainer'));
                        $('#largeVideo').attr('id', 'previousLargeVideo');
                        largeVideoState.preload.attr('id', 'largeVideo');
                        $('#previousLargeVideo').remove();

                        largeVideoState.preload.on('loadedmetadata', function (e) {
                            currentVideoWidth = this.videoWidth;
                            currentVideoHeight = this.videoHeight;
                            VideoLayout.positionLarge(currentVideoWidth, currentVideoHeight);
                        });
                        largeVideoState.preload = null;
                        largeVideoState.preload_ssrc = 0;
                    } else {
                        APP.RTC.setVideoSrc($('#largeVideo')[0], largeVideoState.newSrc);
                    }

                    var videoTransform = document.getElementById('largeVideo')
                        .style.webkitTransform;

                    if (largeVideoState.flipX && videoTransform !== 'scaleX(-1)') {
                        document.getElementById('largeVideo').style.webkitTransform
                            = "scaleX(-1)";
                    }
                    else if (!largeVideoState.flipX && videoTransform === 'scaleX(-1)') {
                        document.getElementById('largeVideo').style.webkitTransform
                            = "none";
                    }

                    // Change the way we'll be measuring and positioning large video

                    VideoLayout.getVideoSize = largeVideoState.isDesktop
                        ? getDesktopVideoSize
                        : getCameraVideoSize;
                    VideoLayout.getVideoPosition = largeVideoState.isDesktop
                        ? getDesktopVideoPosition
                        : getCameraVideoPosition;


                    // Only if the large video is currently visible.
                    // Disable previous dominant speaker video.
                    if (largeVideoState.oldResourceJid) {
                        VideoLayout.enableDominantSpeaker(
                            largeVideoState.oldResourceJid,
                            false);
                    }

                    // Enable new dominant speaker in the remote videos section.
                    if (largeVideoState.userResourceJid) {
                        VideoLayout.enableDominantSpeaker(
                            largeVideoState.userResourceJid,
                            true);
                    }

                    if (userChanged && largeVideoState.isVisible) {
                        // using "this" should be ok because we're called
                        // from within the fadeOut event.
                        $(this).fadeIn(300);
                    }

                    if(userChanged) {
                        Avatar.showUserAvatar(
                            APP.xmpp.findJidFromResource(
                                largeVideoState.oldResourceJid));
                    }

                    largeVideoState.updateInProgress = false;
                };

                if (userChanged) {
                    $('#largeVideo').fadeOut(300, doUpdate);
                } else {
                    doUpdate();
                }
            }
        } else {
            Avatar.showUserAvatar(
                APP.xmpp.findJidFromResource(
                    largeVideoState.userResourceJid));
        }

    };

    my.handleVideoThumbClicked = function(videoSrc,
                                          noPinnedEndpointChangedEvent, 
                                          resourceJid) {
        // Restore style for previously focused video
        var oldContainer = null;
        if(focusedVideoInfo) {
            var focusResourceJid = focusedVideoInfo.resourceJid;
            oldContainer = getParticipantContainer(focusResourceJid);
        }

        if (oldContainer) {
            oldContainer.removeClass("videoContainerFocused");
        }

        // Unlock current focused.
        if (focusedVideoInfo && focusedVideoInfo.src === videoSrc)
        {
            focusedVideoInfo = null;
            var dominantSpeakerVideo = null;
            // Enable the currently set dominant speaker.
            if (currentDominantSpeaker) {
                dominantSpeakerVideo
                    = $('#participant_' + currentDominantSpeaker + '>video')
                        .get(0);

                if (dominantSpeakerVideo) {
                    VideoLayout.updateLargeVideo(
                        APP.RTC.getVideoSrc(dominantSpeakerVideo),
                        1,
                        currentDominantSpeaker);
                }
            }

            if (!noPinnedEndpointChangedEvent) {
                eventEmitter.emit(UIEvents.PINNED_ENDPOINT);
            }
            return;
        }

        // Lock new video
        focusedVideoInfo = {
            src: videoSrc,
            resourceJid: resourceJid
        };

        // Update focused/pinned interface.
        if (resourceJid)
        {
            var container = getParticipantContainer(resourceJid);
            container.addClass("videoContainerFocused");

            if (!noPinnedEndpointChangedEvent) {
                eventEmitter.emit(UIEvents.PINNED_ENDPOINT, resourceJid);
            }
        }

        if ($('#largeVideo').attr('src') === videoSrc &&
            VideoLayout.isLargeVideoOnTop()) {
            return;
        }

        // Triggers a "video.selected" event. The "false" parameter indicates
        // this isn't a prezi.
        $(document).trigger("video.selected", [false]);

        VideoLayout.updateLargeVideo(videoSrc, 1, resourceJid);

        $('audio').each(function (idx, el) {
            if (el.id.indexOf('mixedmslabel') !== -1) {
                el.volume = 0;
                el.volume = 1;
            }
        });
    };

    /**
     * Positions the large video.
     *
     * @param videoWidth the stream video width
     * @param videoHeight the stream video height
     */
    my.positionLarge = function (videoWidth, videoHeight) {
        var videoSpaceWidth = $('#videospace').width();
        var videoSpaceHeight = window.innerHeight;

        var videoSize = VideoLayout.getVideoSize(videoWidth,
                                     videoHeight,
                                     videoSpaceWidth,
                                     videoSpaceHeight);

        var largeVideoWidth = videoSize[0];
        var largeVideoHeight = videoSize[1];

        var videoPosition = VideoLayout.getVideoPosition(largeVideoWidth,
                                             largeVideoHeight,
                                             videoSpaceWidth,
                                             videoSpaceHeight);

        var horizontalIndent = videoPosition[0];
        var verticalIndent = videoPosition[1];

        positionVideo($('#largeVideo'),
                      largeVideoWidth,
                      largeVideoHeight,
                      horizontalIndent, verticalIndent);
    };

    /**
     * Shows/hides the large video.
     */
    my.setLargeVideoVisible = function(isVisible) {
        var resourceJid = largeVideoState.userResourceJid;

        if (isVisible) {
            $('#largeVideo').css({visibility: 'visible'});
            $('.watermark').css({visibility: 'visible'});
            VideoLayout.enableDominantSpeaker(resourceJid, true);
        }
        else {
            $('#largeVideo').css({visibility: 'hidden'});
            $('#activeSpeaker').css('visibility', 'hidden');
            $('.watermark').css({visibility: 'hidden'});
            VideoLayout.enableDominantSpeaker(resourceJid, false);
            if(focusedVideoInfo) {
                var focusResourceJid = focusedVideoInfo.resourceJid;
                var oldContainer = getParticipantContainer(focusResourceJid);

                if (oldContainer && oldContainer.length > 0) {
                    oldContainer.removeClass("videoContainerFocused");
                }
                focusedVideoInfo = null;
                if(focusResourceJid) {
                    Avatar.showUserAvatar(
                        APP.xmpp.findJidFromResource(focusResourceJid));
                }
            }
        }
    };

    /**
     * Indicates if the large video is currently visible.
     *
     * @return <tt>true</tt> if visible, <tt>false</tt> - otherwise
     */
    my.isLargeVideoVisible = function() {
        return $('#largeVideo').is(':visible');
    };

    my.isLargeVideoOnTop = function () {
        var Etherpad = require("../etherpad/Etherpad");
        var Prezi = require("../prezi/Prezi");
        return !Prezi.isPresentationVisible() && !Etherpad.isVisible();
    };

    /**
     * Checks if container for participant identified by given peerJid exists
     * in the document and creates it eventually.
     * 
     * @param peerJid peer Jid to check.
     * @param userId user email or id for setting the avatar
     * 
     * @return Returns <tt>true</tt> if the peer container exists,
     * <tt>false</tt> - otherwise
     */
    my.ensurePeerContainerExists = function(peerJid, userId) {
        ContactList.ensureAddContact(peerJid, userId);

        var resourceJid = Strophe.getResourceFromJid(peerJid);

        var videoSpanId = 'participant_' + resourceJid;

        if (!$('#' + videoSpanId).length) {
            var container =
                VideoLayout.addRemoteVideoContainer(peerJid, videoSpanId, userId);
            Avatar.setUserAvatar(peerJid, userId);
            // Set default display name.
            setDisplayName(videoSpanId);

            VideoLayout.connectionIndicators[videoSpanId] =
                new ConnectionIndicator(container, peerJid, VideoLayout);

            var nickfield = document.createElement('span');
            nickfield.className = "nick";
            nickfield.appendChild(document.createTextNode(resourceJid));
            container.appendChild(nickfield);

            // In case this is not currently in the last n we don't show it.
            if (localLastNCount
                && localLastNCount > 0
                && $('#remoteVideos>span').length >= localLastNCount + 2) {
                showPeerContainer(resourceJid, 'hide');
            }
            else
                VideoLayout.resizeThumbnails();
        }
    };

    my.addRemoteVideoContainer = function(peerJid, spanId) {
        var container = document.createElement('span');
        container.id = spanId;
        container.className = 'videocontainer';
        var remotes = document.getElementById('remoteVideos');
        remotes.appendChild(container);
        // If the peerJid is null then this video span couldn't be directly
        // associated with a participant (this could happen in the case of prezi).
        if (APP.xmpp.isModerator() && peerJid !== null)
            addRemoteVideoMenu(peerJid, container);
        AudioLevels.updateAudioLevelCanvas(peerJid, VideoLayout);

        return container;
    };

    /**
     * Creates an audio or video stream element.
     */
    my.createStreamElement = function (sid, stream) {
        var isVideo = stream.getVideoTracks().length > 0;

        var element = isVideo
                        ? document.createElement('video')
                        : document.createElement('audio');
        var id = (isVideo ? 'remoteVideo_' : 'remoteAudio_')
                    + sid + '_' + APP.RTC.getStreamID(stream);

        element.id = id;
        element.autoplay = true;
        element.oncontextmenu = function () { return false; };

        return element;
    };

    my.addRemoteStreamElement
        = function (container, sid, stream, peerJid, thessrc) {
        var newElementId = null;

        var isVideo = stream.getVideoTracks().length > 0;

        if (container) {
            var streamElement = VideoLayout.createStreamElement(sid, stream);
            newElementId = streamElement.id;

            container.appendChild(streamElement);

            var sel = $('#' + newElementId);
            sel.hide();

            // If the container is currently visible we attach the stream.
            if (!isVideo
                || (container.offsetParent !== null && isVideo)) {
                var videoStream = APP.simulcast.getReceivingVideoStream(stream);
                APP.RTC.attachMediaStream(sel, videoStream);

                if (isVideo)
                    waitForRemoteVideo(sel, thessrc, stream, peerJid);
            }

            stream.onended = function () {
                console.log('stream ended', this);

                VideoLayout.removeRemoteStreamElement(
                    stream, isVideo, container);

                // NOTE(gp) it seems that under certain circumstances, the
                // onended event is not fired and thus the contact list is not
                // updated.
                //
                // The onended event of a stream should be fired when the SSRCs
                // corresponding to that stream are removed from the SDP; but
                // this doesn't seem to always be the case, resulting in ghost
                // contacts.
                //
                // In an attempt to fix the ghost contacts problem, I'm moving
                // the removeContact() method call in app.js, inside the
                // 'muc.left' event handler.

                //if (peerJid)
                //    ContactList.removeContact(peerJid);
            };

            // Add click handler.
            container.onclick = function (event) {
                /*
                 * FIXME It turns out that videoThumb may not exist (if there is
                 * no actual video).
                 */
                var videoThumb = $('#' + container.id + '>video').get(0);
                if (videoThumb) {
                    VideoLayout.handleVideoThumbClicked(
                        APP.RTC.getVideoSrc(videoThumb),
                        false,
                        Strophe.getResourceFromJid(peerJid));
                }

                event.stopPropagation();
                event.preventDefault();
                return false;
            };

            // Add hover handler
            $(container).hover(
                function() {
                    VideoLayout.showDisplayName(container.id, true);
                },
                function() {
                    var videoSrc = null;
                    if ($('#' + container.id + '>video')
                            && $('#' + container.id + '>video').length > 0) {
                        videoSrc = APP.RTC.getVideoSrc($('#' + container.id + '>video').get(0));
                    }

                    // If the video has been "pinned" by the user we want to
                    // keep the display name on place.
                    if (!VideoLayout.isLargeVideoVisible()
                            || videoSrc !== APP.RTC.getVideoSrc($('#largeVideo')[0]))
                        VideoLayout.showDisplayName(container.id, false);
                }
            );
        }

        return newElementId;
    };

    /**
     * Removes the remote stream element corresponding to the given stream and
     * parent container.
     * 
     * @param stream the stream
     * @param isVideo <tt>true</tt> if given <tt>stream</tt> is a video one.
     * @param container
     */
    my.removeRemoteStreamElement = function (stream, isVideo, container) {
        if (!container)
            return;

        var select = null;
        var removedVideoSrc = null;
        if (isVideo) {
            select = $('#' + container.id + '>video');
            removedVideoSrc = APP.RTC.getVideoSrc(select.get(0));
        }
        else
            select = $('#' + container.id + '>audio');


        // Mark video as removed to cancel waiting loop(if video is removed
        // before has started)
        select.removed = true;
        select.remove();

        var audioCount = $('#' + container.id + '>audio').length;
        var videoCount = $('#' + container.id + '>video').length;

        if (!audioCount && !videoCount) {
            console.log("Remove whole user", container.id);
            if(VideoLayout.connectionIndicators[container.id])
                VideoLayout.connectionIndicators[container.id].remove();
            // Remove whole container
            container.remove();

            UIUtil.playSoundNotification('userLeft');
            VideoLayout.resizeThumbnails();
        }

        if (removedVideoSrc)
            VideoLayout.updateRemovedVideo(removedVideoSrc);
    };

    /**
     * Show/hide peer container for the given resourceJid.
     */
    function showPeerContainer(resourceJid, state) {
        var peerContainer = $('#participant_' + resourceJid);

        if (!peerContainer)
            return;

        var isHide = state === 'hide';
        var resizeThumbnails = false;

        if (!isHide) {
            if (!peerContainer.is(':visible')) {
                resizeThumbnails = true;
                peerContainer.show();
            }

            var jid = APP.xmpp.findJidFromResource(resourceJid);
            if (state == 'show')
            {
                // peerContainer.css('-webkit-filter', '');

                Avatar.showUserAvatar(jid, false);
            }
            else // if (state == 'avatar')
            {
                // peerContainer.css('-webkit-filter', 'grayscale(100%)');
                Avatar.showUserAvatar(jid, true);
            }
        }
        else if (peerContainer.is(':visible') && isHide)
        {
            resizeThumbnails = true;
            peerContainer.hide();
            if(VideoLayout.connectionIndicators['participant_' + resourceJid])
                VideoLayout.connectionIndicators['participant_' + resourceJid].hide();
        }

        if (resizeThumbnails) {
            VideoLayout.resizeThumbnails();
        }

        // We want to be able to pin a participant from the contact list, even
        // if he's not in the lastN set!
        // ContactList.setClickable(resourceJid, !isHide);

    };

    my.inputDisplayNameHandler = function (name) {
        NicknameHandler.setNickname(name);

        if (!$('#localDisplayName').is(":visible")) {
            if (NicknameHandler.getNickname())
            {
                var meHTML = APP.translation.generateTranslatonHTML("me");
                $('#localDisplayName').html(NicknameHandler.getNickname() + " (" + meHTML + ")");
            }
            else
            {
                var defaultHTML = APP.translation.generateTranslatonHTML(
                    interfaceConfig.DEFAULT_LOCAL_DISPLAY_NAME);
                $('#localDisplayName')
                    .html(defaultHTML);
            }
            $('#localDisplayName').show();
        }

        $('#editDisplayName').hide();
    };

    /**
     * Shows/hides the display name on the remote video.
     * @param videoSpanId the identifier of the video span element
     * @param isShow indicates if the display name should be shown or hidden
     */
    my.showDisplayName = function(videoSpanId, isShow) {
        var nameSpan = $('#' + videoSpanId + '>span.displayname').get(0);
        if (isShow) {
            if (nameSpan && nameSpan.innerHTML && nameSpan.innerHTML.length) 
                nameSpan.setAttribute("style", "display:inline-block;");
        }
        else {
            if (nameSpan)
                nameSpan.setAttribute("style", "display:none;");
        }
    };

    /**
     * Shows the presence status message for the given video.
     */
    my.setPresenceStatus = function (videoSpanId, statusMsg) {

        if (!$('#' + videoSpanId).length) {
            // No container
            return;
        }

        var statusSpan = $('#' + videoSpanId + '>span.status');
        if (!statusSpan.length) {
            //Add status span
            statusSpan = document.createElement('span');
            statusSpan.className = 'status';
            statusSpan.id = videoSpanId + '_status';
            $('#' + videoSpanId)[0].appendChild(statusSpan);

            statusSpan = $('#' + videoSpanId + '>span.status');
        }

        // Display status
        if (statusMsg && statusMsg.length) {
            $('#' + videoSpanId + '_status').text(statusMsg);
            statusSpan.get(0).setAttribute("style", "display:inline-block;");
        }
        else {
            // Hide
            statusSpan.get(0).setAttribute("style", "display:none;");
        }
    };

    /**
     * Shows a visual indicator for the moderator of the conference.
     */
    my.showModeratorIndicator = function () {

        var isModerator = APP.xmpp.isModerator();
        if (isModerator) {
            var indicatorSpan = $('#localVideoContainer .focusindicator');

            if (indicatorSpan.children().length === 0)
            {
                createModeratorIndicatorElement(indicatorSpan[0]);
                //translates text in focus indicator
                APP.translation.translateElement($('#localVideoContainer .focusindicator'));
            }
        }

        var members = APP.xmpp.getMembers();

        Object.keys(members).forEach(function (jid) {

            if (Strophe.getResourceFromJid(jid) === 'focus') {
                // Skip server side focus
                return;
            }

            var resourceJid = Strophe.getResourceFromJid(jid);
            var videoSpanId = 'participant_' + resourceJid;
            var videoContainer = document.getElementById(videoSpanId);

            if (!videoContainer) {
                console.error("No video container for " + jid);
                return;
            }

            var member = members[jid];

            if (member.role === 'moderator') {
                // Remove menu if peer is moderator
                var menuSpan = $('#' + videoSpanId + '>span.remotevideomenu');
                if (menuSpan.length) {
                    removeRemoteVideoMenu(videoSpanId);
                }
                // Show moderator indicator
                var indicatorSpan
                    = $('#' + videoSpanId + ' .focusindicator');

                if (!indicatorSpan || indicatorSpan.length === 0) {
                    indicatorSpan = document.createElement('span');
                    indicatorSpan.className = 'focusindicator';

                    videoContainer.appendChild(indicatorSpan);

                    createModeratorIndicatorElement(indicatorSpan);
                    //translates text in focus indicators
                    APP.translation.translateElement($('#' + videoSpanId + ' .focusindicator'));
                }
            } else if (isModerator) {
                // We are moderator, but user is not - add menu
                if ($('#remote_popupmenu_' + resourceJid).length <= 0) {
                    addRemoteVideoMenu(
                        jid,
                        document.getElementById('participant_' + resourceJid));
                }
            }
        });
    };

    /**
     * Shows video muted indicator over small videos.
     */
    my.showVideoIndicator = function(videoSpanId, isMuted) {
        var videoMutedSpan = $('#' + videoSpanId + '>span.videoMuted');

        if (isMuted === 'false') {
            if (videoMutedSpan.length > 0) {
                videoMutedSpan.remove();
            }
        }
        else {
            if(videoMutedSpan.length == 0) {
                videoMutedSpan = document.createElement('span');
                videoMutedSpan.className = 'videoMuted';

                $('#' + videoSpanId)[0].appendChild(videoMutedSpan);

                var mutedIndicator = document.createElement('i');
                mutedIndicator.className = 'icon-camera-disabled';
                UIUtil.setTooltip(mutedIndicator,
                    "videothumbnail.videomute",
                    "top");
                videoMutedSpan.appendChild(mutedIndicator);
                //translate texts for muted indicator
                APP.translation.translateElement($('#' + videoSpanId  + " > span > i"));
            }

            VideoLayout.updateMutePosition(videoSpanId);

        }
    };

    my.updateMutePosition = function (videoSpanId) {
        var audioMutedSpan = $('#' + videoSpanId + '>span.audioMuted');
        var connectionIndicator = $('#' + videoSpanId + '>div.connectionindicator');
        var videoMutedSpan = $('#' + videoSpanId + '>span.videoMuted');
        if(connectionIndicator.length > 0
            && connectionIndicator[0].style.display != "none") {
            audioMutedSpan.css({right: "23px"});
            videoMutedSpan.css({right: ((audioMutedSpan.length > 0? 23 : 0) + 30) + "px"});
        }
        else
        {
            audioMutedSpan.css({right: "0px"});
            videoMutedSpan.css({right: (audioMutedSpan.length > 0? 30 : 0) + "px"});
        }
    }
    /**
     * Shows audio muted indicator over small videos.
     * @param {string} isMuted
     */
    my.showAudioIndicator = function(videoSpanId, isMuted) {
        var audioMutedSpan = $('#' + videoSpanId + '>span.audioMuted');

        if (isMuted === 'false') {
            if (audioMutedSpan.length > 0) {
                audioMutedSpan.popover('hide');
                audioMutedSpan.remove();
            }
        }
        else {
            if(audioMutedSpan.length == 0 ) {
                audioMutedSpan = document.createElement('span');
                audioMutedSpan.className = 'audioMuted';
                UIUtil.setTooltip(audioMutedSpan,
                    "videothumbnail.mute",
                    "top");

                $('#' + videoSpanId)[0].appendChild(audioMutedSpan);
                APP.translation.translateElement($('#' + videoSpanId + " > span"));
                var mutedIndicator = document.createElement('i');
                mutedIndicator.className = 'icon-mic-disabled';
                audioMutedSpan.appendChild(mutedIndicator);

            }
            VideoLayout.updateMutePosition(videoSpanId);
        }
    };

    /*
     * Shows or hides the audio muted indicator over the local thumbnail video.
     * @param {boolean} isMuted
     */
    my.showLocalAudioIndicator = function(isMuted) {
        VideoLayout.showAudioIndicator('localVideoContainer', isMuted.toString());
    };

    /**
     * Resizes the large video container.
     */
    my.resizeLargeVideoContainer = function () {
        Chat.resizeChat();
        var availableHeight = window.innerHeight;
        var availableWidth = UIUtil.getAvailableVideoWidth();

        if (availableWidth < 0 || availableHeight < 0) return;

        $('#videospace').width(availableWidth);
        $('#videospace').height(availableHeight);
        $('#largeVideoContainer').width(availableWidth);
        $('#largeVideoContainer').height(availableHeight);

        var avatarSize = interfaceConfig.ACTIVE_SPEAKER_AVATAR_SIZE;
        var top = availableHeight / 2 - avatarSize / 4 * 3;
        $('#activeSpeaker').css('top', top);

        VideoLayout.resizeThumbnails();
    };

    /**
     * Resizes thumbnails.
     */
    my.resizeThumbnails = function() {
        var videoSpaceWidth = $('#remoteVideos').width();

        var thumbnailSize = VideoLayout.calculateThumbnailSize(videoSpaceWidth);
        var width = thumbnailSize[0];
        var height = thumbnailSize[1];

        // size videos so that while keeping AR and max height, we have a
        // nice fit
        $('#remoteVideos').height(height);
        $('#remoteVideos>span').width(width);
        $('#remoteVideos>span').height(height);

        $('.userAvatar').css('left', (width - height) / 2);



        $(document).trigger("remotevideo.resized", [width, height]);
    };

    /**
     * Enables the dominant speaker UI.
     *
     * @param resourceJid the jid indicating the video element to
     * activate/deactivate
     * @param isEnable indicates if the dominant speaker should be enabled or
     * disabled
     */
    my.enableDominantSpeaker = function(resourceJid, isEnable) {

        var videoSpanId = null;
        var videoContainerId = null;
        if (resourceJid
                === APP.xmpp.myResource()) {
            videoSpanId = 'localVideoWrapper';
            videoContainerId = 'localVideoContainer';
        }
        else {
            videoSpanId = 'participant_' + resourceJid;
            videoContainerId = videoSpanId;
        }

        var displayName = resourceJid;
        var nameSpan = $('#' + videoContainerId + '>span.displayname');
        if (nameSpan.length > 0)
            displayName = nameSpan.html();

        console.log("UI enable dominant speaker",
            displayName,
            resourceJid,
            isEnable);

        videoSpan = document.getElementById(videoContainerId);

        if (!videoSpan) {
            return;
        }

        var video = $('#' + videoSpanId + '>video');

        if (video && video.length > 0) {
            if (isEnable) {
                var isLargeVideoVisible = VideoLayout.isLargeVideoOnTop();
                VideoLayout.showDisplayName(videoContainerId, isLargeVideoVisible);

                if (!videoSpan.classList.contains("dominantspeaker"))
                    videoSpan.classList.add("dominantspeaker");
            }
            else {
                VideoLayout.showDisplayName(videoContainerId, false);

                if (videoSpan.classList.contains("dominantspeaker"))
                    videoSpan.classList.remove("dominantspeaker");
            }

            Avatar.showUserAvatar(
                APP.xmpp.findJidFromResource(resourceJid));
        }
    };

    /**
     * Calculates the thumbnail size.
     *
     * @param videoSpaceWidth the width of the video space
     */
    my.calculateThumbnailSize = function (videoSpaceWidth) {
        // Calculate the available height, which is the inner window height minus
       // 39px for the header minus 2px for the delimiter lines on the top and
       // bottom of the large video, minus the 36px space inside the remoteVideos
       // container used for highlighting shadow.
       var availableHeight = 100;

        var numvids = $('#remoteVideos>span:visible').length;
        if (localLastNCount && localLastNCount > 0) {
            numvids = Math.min(localLastNCount + 1, numvids);
        }

       // Remove the 3px borders arround videos and border around the remote
       // videos area and the 4 pixels between the local video and the others
       //TODO: Find out where the 4 pixels come from and remove them
       var availableWinWidth = videoSpaceWidth - 2 * 3 * numvids - 70 - 4;

       var availableWidth = availableWinWidth / numvids;
       var aspectRatio = 16.0 / 9.0;
       var maxHeight = Math.min(160, availableHeight);
       availableHeight = Math.min(maxHeight, availableWidth / aspectRatio);
       if (availableHeight < availableWidth / aspectRatio) {
           availableWidth = Math.floor(availableHeight * aspectRatio);
       }

       return [availableWidth, availableHeight];
   };

    /**
     * Updates the remote video menu.
     *
     * @param jid the jid indicating the video for which we're adding a menu.
     * @param isMuted indicates the current mute state
     */
    my.updateRemoteVideoMenu = function(jid, isMuted) {
        var muteMenuItem
            = $('#remote_popupmenu_'
                    + Strophe.getResourceFromJid(jid)
                    + '>li>a.mutelink');

        var mutedIndicator = "<i class='icon-mic-disabled'></i>";

        if (muteMenuItem.length) {
            var muteLink = muteMenuItem.get(0);

            if (isMuted === 'true') {
                muteLink.innerHTML = mutedIndicator + ' Muted';
                muteLink.className = 'mutelink disabled';
            }
            else {
                muteLink.innerHTML = mutedIndicator + ' Mute';
                muteLink.className = 'mutelink';
            }
        }
    };

    /**
     * Returns the current dominant speaker resource jid.
     */
    my.getDominantSpeakerResourceJid = function () {
        return currentDominantSpeaker;
    };

    /**
     * Returns the corresponding resource jid to the given peer container
     * DOM element.
     *
     * @return the corresponding resource jid to the given peer container
     * DOM element
     */
    my.getPeerContainerResourceJid = function (containerElement) {
        var i = containerElement.id.indexOf('participant_');

        if (i >= 0)
            return containerElement.id.substring(i + 12); 
    };

    /**
     * On contact list item clicked.
     */
    $(ContactList).bind('contactclicked', function(event, jid) {
        if (!jid) {
            return;
        }

        var resource = Strophe.getResourceFromJid(jid);
        var videoContainer = $("#participant_" + resource);
        if (videoContainer.length > 0) {
            var videoThumb = $('video', videoContainer).get(0);
            // It is not always the case that a videoThumb exists (if there is
            // no actual video).
            if (videoThumb) {
                if (videoThumb.src && videoThumb.src != '') {

                    // We have a video src, great! Let's update the large video
                    // now.

                    VideoLayout.handleVideoThumbClicked(
                        videoThumb.src,
                        false,
                        Strophe.getResourceFromJid(jid));
                } else {

                    // If we don't have a video src for jid, there's absolutely
                    // no point in calling handleVideoThumbClicked; Quite
                    // simply, it won't work because it needs an src to attach
                    // to the large video.
                    //
                    // Instead, we trigger the pinned endpoint changed event to
                    // let the bridge adjust its lastN set for myjid and store
                    // the pinned user in the lastNPickupJid variable to be
                    // picked up later by the lastN changed event handler.

                    lastNPickupJid = jid;
                    eventEmitter.emit(UIEvents.PINNED_ENDPOINT,
                        Strophe.getResourceFromJid(jid));
                }
            } else if (jid == APP.xmpp.myJid()) {
                $("#localVideoContainer").click();
            }
        }
    });

    /**
     * On audio muted event.
     */
    $(document).bind('audiomuted.muc', function (event, jid, isMuted) {
        /*
         // FIXME: but focus can not mute in this case ? - check
        if (jid === xmpp.myJid()) {

            // The local mute indicator is controlled locally
            return;
        }*/
        var videoSpanId = null;
        if (jid === APP.xmpp.myJid()) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        mutedAudios[jid] = isMuted;

        if (APP.xmpp.isModerator()) {
            VideoLayout.updateRemoteVideoMenu(jid, isMuted);
        }

        if (videoSpanId)
            VideoLayout.showAudioIndicator(videoSpanId, isMuted);
    });

    /**
     * On video muted event.
     */
    $(document).bind('videomuted.muc', function (event, jid, value) {
        var isMuted = (value === "true");
        if(jid !== APP.xmpp.myJid() && !APP.RTC.muteRemoteVideoStream(jid, isMuted))
            return;

        Avatar.showUserAvatar(jid, isMuted);
        var videoSpanId = null;
        if (jid === APP.xmpp.myJid()) {
            videoSpanId = 'localVideoContainer';
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            videoSpanId = 'participant_' + Strophe.getResourceFromJid(jid);
        }

        if (videoSpanId)
            VideoLayout.showVideoIndicator(videoSpanId, value);
    });

    /**
     * Display name changed.
     */
    my.onDisplayNameChanged =
                    function (jid, displayName, status) {
        if (jid === 'localVideoContainer'
            || jid === APP.xmpp.myJid()) {
            setDisplayName('localVideoContainer',
                           displayName);
        } else {
            VideoLayout.ensurePeerContainerExists(jid);
            setDisplayName(
                'participant_' + Strophe.getResourceFromJid(jid),
                displayName,
                status);
        }

    };

    /**
     * On dominant speaker changed event.
     */
    my.onDominantSpeakerChanged = function (resourceJid) {
        // We ignore local user events.
        if (resourceJid
                === APP.xmpp.myResource())
            return;

        var members = APP.xmpp.getMembers();
        // Update the current dominant speaker.
        if (resourceJid !== currentDominantSpeaker) {
            var oldSpeakerVideoSpanId = "participant_" + currentDominantSpeaker,
                newSpeakerVideoSpanId = "participant_" + resourceJid;
            var currentJID = APP.xmpp.findJidFromResource(currentDominantSpeaker);
            var newJID = APP.xmpp.findJidFromResource(resourceJid);
            if(currentDominantSpeaker && (!members || !members[currentJID] ||
                !members[currentJID].displayName)) {
                setDisplayName(oldSpeakerVideoSpanId, null);
            }
            if(resourceJid && (!members || !members[newJID] ||
                !members[newJID].displayName)) {
                setDisplayName(newSpeakerVideoSpanId, null,
                    interfaceConfig.DEFAULT_DOMINANT_SPEAKER_DISPLAY_NAME);
            }
            currentDominantSpeaker = resourceJid;
        } else {
            return;
        }

        // Obtain container for new dominant speaker.
        var container  = document.getElementById(
                'participant_' + resourceJid);

        // Local video will not have container found, but that's ok
        // since we don't want to switch to local video.
        if (container && !focusedVideoInfo)
        {
            var video = container.getElementsByTagName("video");

            // Update the large video if the video source is already available,
            // otherwise wait for the "videoactive.jingle" event.
            if (video.length && video[0].currentTime > 0)
                VideoLayout.updateLargeVideo(APP.RTC.getVideoSrc(video[0]), resourceJid);
        }
    };

    /**
     * On last N change event.
     *
     * @param lastNEndpoints the list of last N endpoints
     * @param endpointsEnteringLastN the list currently entering last N
     * endpoints
     */
    my.onLastNEndpointsChanged = function ( lastNEndpoints,
                                                endpointsEnteringLastN,
                                                stream) {
        if (lastNCount !== lastNEndpoints.length)
            lastNCount = lastNEndpoints.length;

        lastNEndpointsCache = lastNEndpoints;

        // Say A, B, C, D, E, and F are in a conference and LastN = 3.
        //
        // If LastN drops to, say, 2, because of adaptivity, then E should see
        // thumbnails for A, B and C. A and B are in E's server side LastN set,
        // so E sees them. C is only in E's local LastN set.
        //
        // If F starts talking and LastN = 3, then E should see thumbnails for
        // F, A, B. B gets "ejected" from E's server side LastN set, but it
        // enters E's local LastN ejecting C.

        // Increase the local LastN set size, if necessary.
        if (lastNCount > localLastNCount) {
            localLastNCount = lastNCount;
        }

        // Update the local LastN set preserving the order in which the
        // endpoints appeared in the LastN/local LastN set.

        var nextLocalLastNSet = lastNEndpoints.slice(0);
        for (var i = 0; i < localLastNSet.length; i++) {
            if (nextLocalLastNSet.length >= localLastNCount) {
                break;
            }

            var resourceJid = localLastNSet[i];
            if (nextLocalLastNSet.indexOf(resourceJid) === -1) {
                nextLocalLastNSet.push(resourceJid);
            }
        }

        localLastNSet = nextLocalLastNSet;

        var updateLargeVideo = false;

        // Handle LastN/local LastN changes.
        $('#remoteVideos>span').each(function( index, element ) {
            var resourceJid = VideoLayout.getPeerContainerResourceJid(element);

            var isReceived = true;
            if (resourceJid
                && lastNEndpoints.indexOf(resourceJid) < 0
                && localLastNSet.indexOf(resourceJid) < 0) {
                console.log("Remove from last N", resourceJid);
                showPeerContainer(resourceJid, 'hide');
                isReceived = false;
            } else if (resourceJid
                && $('#participant_' + resourceJid).is(':visible')
                && lastNEndpoints.indexOf(resourceJid) < 0
                && localLastNSet.indexOf(resourceJid) >= 0) {
                showPeerContainer(resourceJid, 'avatar');
                isReceived = false;
            }

            if (!isReceived) {
                // resourceJid has dropped out of the server side lastN set, so
                // it is no longer being received. If resourceJid was being
                // displayed in the large video we have to switch to another
                // user.
                var largeVideoResource = largeVideoState.userResourceJid;
                if (!updateLargeVideo && resourceJid === largeVideoResource) {
                    updateLargeVideo = true;
                }
            }
        });

        if (!endpointsEnteringLastN || endpointsEnteringLastN.length < 0)
            endpointsEnteringLastN = lastNEndpoints;

        if (endpointsEnteringLastN && endpointsEnteringLastN.length > 0) {
            endpointsEnteringLastN.forEach(function (resourceJid) {

                var isVisible = $('#participant_' + resourceJid).is(':visible');
                showPeerContainer(resourceJid, 'show');
                if (!isVisible) {
                    console.log("Add to last N", resourceJid);

                    var jid = APP.xmpp.findJidFromResource(resourceJid);
                    var mediaStream = APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
                    var sel = $('#participant_' + resourceJid + '>video');

                    var videoStream = APP.simulcast.getReceivingVideoStream(
                        mediaStream.stream);
                    APP.RTC.attachMediaStream(sel, videoStream);
                    if (lastNPickupJid == mediaStream.peerjid) {
                        // Clean up the lastN pickup jid.
                        lastNPickupJid = null;

                        // Don't fire the events again, they've already
                        // been fired in the contact list click handler.
                        VideoLayout.handleVideoThumbClicked(
                            $(sel).attr('src'),
                            false,
                            Strophe.getResourceFromJid(mediaStream.peerjid));

                        updateLargeVideo = false;
                    }
                    waitForRemoteVideo(sel, mediaStream.ssrc, mediaStream.stream, resourceJid);
                }
            })
        }

        // The endpoint that was being shown in the large video has dropped out
        // of the lastN set and there was no lastN pickup jid. We need to update
        // the large video now.

        if (updateLargeVideo) {

            var resource, container, src;
            var myResource
                = APP.xmpp.myResource();

            // Find out which endpoint to show in the large video.
            for (var i = 0; i < lastNEndpoints.length; i++) {
                resource = lastNEndpoints[i];
                if (!resource || resource === myResource)
                    continue;

                container = $("#participant_" + resource);
                if (container.length == 0)
                    continue;

                src = $('video', container).attr('src');
                if (!src)
                    continue;

                // videoSrcToSsrc needs to be update for this call to succeed.
                VideoLayout.updateLargeVideo(src);
                break;

            }
        }
    };

    my.onSimulcastLayersChanging = function (endpointSimulcastLayers) {
        endpointSimulcastLayers.forEach(function (esl) {

            var resource = esl.endpoint;

            // if lastN is enabled *and* the endpoint is *not* in the lastN set,
            // then ignore the event (= do not preload anything).
            //
            // The bridge could probably stop sending this message if it's for
            // an endpoint that's not in lastN.

            if (lastNCount != -1
                && (lastNCount < 1 || lastNEndpointsCache.indexOf(resource) === -1)) {
                return;
            }

            var primarySSRC = esl.simulcastLayer.primarySSRC;

            // Get session and stream from primary ssrc.
            var res = APP.simulcast.getReceivingVideoStreamBySSRC(primarySSRC);
            var sid = res.sid;
            var electedStream = res.stream;

            if (sid && electedStream) {
                var msid = APP.simulcast.getRemoteVideoStreamIdBySSRC(primarySSRC);

                console.info([esl, primarySSRC, msid, sid, electedStream]);

                var preload = (Strophe.getResourceFromJid(APP.xmpp.getJidFromSSRC(primarySSRC)) == largeVideoState.userResourceJid);

                if (preload) {
                    if (largeVideoState.preload)
                    {
                        $(largeVideoState.preload).remove();
                    }
                    console.info('Preloading remote video');
                    largeVideoState.preload = $('<video autoplay></video>');
                    // ssrcs are unique in an rtp session
                    largeVideoState.preload_ssrc = primarySSRC;

                    APP.RTC.attachMediaStream(largeVideoState.preload, electedStream)
                }

            } else {
                console.error('Could not find a stream or a session.', sid, electedStream);
            }
        });
    };

    /**
     * On simulcast layers changed event.
     */
    my.onSimulcastLayersChanged = function (endpointSimulcastLayers) {
        endpointSimulcastLayers.forEach(function (esl) {

            var resource = esl.endpoint;

            // if lastN is enabled *and* the endpoint is *not* in the lastN set,
            // then ignore the event (= do not change large video/thumbnail
            // SRCs).
            //
            // Note that even if we ignore the "changed" event in this event
            // handler, the bridge must continue sending these events because
            // the simulcast code in simulcast.js uses it to know what's going
            // to be streamed by the bridge when/if the endpoint gets back into
            // the lastN set.

            if (lastNCount != -1
                && (lastNCount < 1 || lastNEndpointsCache.indexOf(resource) === -1)) {
                return;
            }

            var primarySSRC = esl.simulcastLayer.primarySSRC;

            // Get session and stream from primary ssrc.
            var res = APP.simulcast.getReceivingVideoStreamBySSRC(primarySSRC);
            var sid = res.sid;
            var electedStream = res.stream;

            if (sid && electedStream) {
                var msid = APP.simulcast.getRemoteVideoStreamIdBySSRC(primarySSRC);

                console.info('Switching simulcast substream.');
                console.info([esl, primarySSRC, msid, sid, electedStream]);

                var msidParts = msid.split(' ');
                var selRemoteVideo = $(['#', 'remoteVideo_', sid, '_', msidParts[0]].join(''));

                var updateLargeVideo = (Strophe.getResourceFromJid(APP.xmpp.getJidFromSSRC(primarySSRC))
                    == largeVideoState.userResourceJid);
                var updateFocusedVideoSrc = (focusedVideoInfo && focusedVideoInfo.src && focusedVideoInfo.src != '' &&
                    (APP.RTC.getVideoSrc(selRemoteVideo[0]) == focusedVideoInfo.src));

                var electedStreamUrl;
                if (largeVideoState.preload_ssrc == primarySSRC)
                {
                    APP.RTC.setVideoSrc(selRemoteVideo[0], APP.RTC.getVideoSrc(largeVideoState.preload[0]));
                }
                else
                {
                    if (largeVideoState.preload
                        && largeVideoState.preload != null) {
                        $(largeVideoState.preload).remove();
                    }

                    largeVideoState.preload_ssrc = 0;

                    APP.RTC.attachMediaStream(selRemoteVideo, electedStream);
                }

                var jid = APP.xmpp.getJidFromSSRC(primarySSRC);

                if (updateLargeVideo) {
                    VideoLayout.updateLargeVideo(APP.RTC.getVideoSrc(selRemoteVideo[0]), null,
                        Strophe.getResourceFromJid(jid));
                }

                if (updateFocusedVideoSrc) {
                    focusedVideoInfo.src = APP.RTC.getVideoSrc(selRemoteVideo[0]);
                }

                var videoId;
                if(resource == APP.xmpp.myResource())
                {
                    videoId = "localVideoContainer";
                }
                else
                {
                    videoId = "participant_" + resource;
                }
                var connectionIndicator = VideoLayout.connectionIndicators[videoId];
                if(connectionIndicator)
                    connectionIndicator.updatePopoverData();

            } else {
                console.error('Could not find a stream or a sid.', sid, electedStream);
            }
        });
    };

    /**
     * Updates local stats
     * @param percent
     * @param object
     */
    my.updateLocalConnectionStats = function (percent, object) {
        var resolution = null;
        if(object.resolution !== null)
        {
            resolution = object.resolution;
            object.resolution = resolution[APP.xmpp.myJid()];
            delete resolution[APP.xmpp.myJid()];
        }
        updateStatsIndicator("localVideoContainer", percent, object);
        for(var jid in resolution)
        {
            if(resolution[jid] === null)
                continue;
            var id = 'participant_' + Strophe.getResourceFromJid(jid);
            if(VideoLayout.connectionIndicators[id])
            {
                VideoLayout.connectionIndicators[id].updateResolution(resolution[jid]);
            }
        }

    };

    /**
     * Updates remote stats.
     * @param jid the jid associated with the stats
     * @param percent the connection quality percent
     * @param object the stats data
     */
    my.updateConnectionStats = function (jid, percent, object) {
        var resourceJid = Strophe.getResourceFromJid(jid);

        var videoSpanId = 'participant_' + resourceJid;
        updateStatsIndicator(videoSpanId, percent, object);
    };

    /**
     * Removes the connection
     * @param jid
     */
    my.removeConnectionIndicator = function (jid) {
        if(VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)])
            VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)].remove();
    };

    /**
     * Hides the connection indicator
     * @param jid
     */
    my.hideConnectionIndicator = function (jid) {
        if(VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)])
            VideoLayout.connectionIndicators['participant_' + Strophe.getResourceFromJid(jid)].hide();
    };

    /**
     * Hides all the indicators
     */
    my.onStatsStop = function () {
        for(var indicator in VideoLayout.connectionIndicators)
        {
            VideoLayout.connectionIndicators[indicator].hideIndicator();
        }
    };

    my.participantLeft = function (jid) {
        // Unlock large video
        if (focusedVideoInfo && focusedVideoInfo.jid === jid)
        {
            console.info("Focused video owner has left the conference");
            focusedVideoInfo = null;
        }
    }
    
    my.onVideoTypeChanged = function (jid) {
        if(jid &&
            Strophe.getResourceFromJid(jid) === largeVideoState.userResourceJid)
        {
            largeVideoState.isDesktop = APP.RTC.isVideoSrcDesktop(jid);
            VideoLayout.getVideoSize = largeVideoState.isDesktop
                ? getDesktopVideoSize
                : getCameraVideoSize;
            VideoLayout.getVideoPosition = largeVideoState.isDesktop
                ? getDesktopVideoPosition
                : getCameraVideoPosition;
            VideoLayout.positionLarge(null, null);
        }
    }

    return my;
}(VideoLayout || {}));

module.exports = VideoLayout;
},{"../../../service/RTC/MediaStreamTypes":88,"../../../service/UI/UIEvents":93,"../audio_levels/AudioLevels":9,"../avatar/Avatar":13,"../etherpad/Etherpad":14,"../prezi/Prezi":15,"../side_pannels/chat/Chat":18,"../side_pannels/contactlist/ContactList":22,"../util/NicknameHandler":29,"../util/UIUtil":30,"./ConnectionIndicator":31}],33:[function(require,module,exports){
//var nouns = [
//];
var pluralNouns = [
    "Aliens", "Animals", "Antelopes", "Ants", "Apes", "Apples", "Baboons", "Bacteria", "Badgers", "Bananas", "Bats",
    "Bears", "Birds", "Bonobos", "Brides", "Bugs", "Bulls", "Butterflies", "Cheetahs",
    "Cherries", "Chicken", "Children", "Chimps", "Clowns", "Cows", "Creatures", "Dinosaurs", "Dogs", "Dolphins",
    "Donkeys", "Dragons", "Ducks", "Dwarfs", "Eagles", "Elephants", "Elves", "FAIL", "Fathers",
    "Fish", "Flowers", "Frogs", "Fruit", "Fungi", "Galaxies", "Geese", "Goats",
    "Gorillas", "Hedgehogs", "Hippos", "Horses", "Hunters", "Insects", "Kids", "Knights",
    "Lemons", "Lemurs", "Leopards", "LifeForms", "Lions", "Lizards", "Mice", "Monkeys", "Monsters",
    "Mushrooms", "Octopodes", "Oranges", "Orangutans", "Organisms", "Pants", "Parrots", "Penguins",
    "People", "Pigeons", "Pigs", "Pineapples", "Plants", "Potatoes", "Priests", "Rats", "Reptiles", "Reptilians",
    "Rhinos", "Seagulls", "Sheep", "Siblings", "Snakes", "Spaghetti", "Spiders", "Squid", "Squirrels",
    "Stars", "Students", "Teachers", "Tigers", "Tomatoes", "Trees", "Vampires", "Vegetables", "Viruses", "Vulcans",
    "Warewolves", "Weasels", "Whales", "Witches", "Wizards", "Wolves", "Workers", "Worms", "Zebras"
];
//var places = [
//"Pub", "University", "Airport", "Library", "Mall", "Theater", "Stadium", "Office", "Show", "Gallows", "Beach",
// "Cemetery", "Hospital", "Reception", "Restaurant", "Bar", "Church", "House", "School", "Square", "Village",
// "Cinema", "Movies", "Party", "Restroom", "End", "Jail", "PostOffice", "Station", "Circus", "Gates", "Entrance",
// "Bridge"
//];
var verbs = [
    "Abandon", "Adapt", "Advertise", "Answer", "Anticipate", "Appreciate",
    "Approach", "Argue", "Ask", "Bite", "Blossom", "Blush", "Breathe", "Breed", "Bribe", "Burn", "Calculate",
    "Clean", "Code", "Communicate", "Compute", "Confess", "Confiscate", "Conjugate", "Conjure", "Consume",
    "Contemplate", "Crawl", "Dance", "Delegate", "Devour", "Develop", "Differ", "Discuss",
    "Dissolve", "Drink", "Eat", "Elaborate", "Emancipate", "Estimate", "Expire", "Extinguish",
    "Extract", "FAIL", "Facilitate", "Fall", "Feed", "Finish", "Floss", "Fly", "Follow", "Fragment", "Freeze",
    "Gather", "Glow", "Grow", "Hex", "Hide", "Hug", "Hurry", "Improve", "Intersect", "Investigate", "Jinx",
    "Joke", "Jubilate", "Kiss", "Laugh", "Manage", "Meet", "Merge", "Move", "Object", "Observe", "Offer",
    "Paint", "Participate", "Party", "Perform", "Plan", "Pursue", "Pierce", "Play", "Postpone", "Pray", "Proclaim",
    "Question", "Read", "Reckon", "Rejoice", "Represent", "Resize", "Rhyme", "Scream", "Search", "Select", "Share", "Shoot",
    "Shout", "Signal", "Sing", "Skate", "Sleep", "Smile", "Smoke", "Solve", "Spell", "Steer", "Stink",
    "Substitute", "Swim", "Taste", "Teach", "Terminate", "Think", "Type", "Unite", "Vanish", "Worship"
];
var adverbs = [
    "Absently", "Accurately", "Accusingly", "Adorably", "AllTheTime", "Alone", "Always", "Amazingly", "Angrily",
    "Anxiously", "Anywhere", "Appallingly", "Apparently", "Articulately", "Astonishingly", "Badly", "Barely",
    "Beautifully", "Blindly", "Bravely", "Brightly", "Briskly", "Brutally", "Calmly", "Carefully", "Casually",
    "Cautiously", "Cleverly", "Constantly", "Correctly", "Crazily", "Curiously", "Cynically", "Daily",
    "Dangerously", "Deliberately", "Delicately", "Desperately", "Discreetly", "Eagerly", "Easily", "Euphoricly",
    "Evenly", "Everywhere", "Exactly", "Expectantly", "Extensively", "FAIL", "Ferociously", "Fiercely", "Finely",
    "Flatly", "Frequently", "Frighteningly", "Gently", "Gloriously", "Grimly", "Guiltily", "Happily",
    "Hard", "Hastily", "Heroically", "High", "Highly", "Hourly", "Humbly", "Hysterically", "Immensely",
    "Impartially", "Impolitely", "Indifferently", "Intensely", "Jealously", "Jovially", "Kindly", "Lazily",
    "Lightly", "Loudly", "Lovingly", "Loyally", "Magnificently", "Malevolently", "Merrily", "Mightily", "Miserably",
    "Mysteriously", "NOT", "Nervously", "Nicely", "Nowhere", "Objectively", "Obnoxiously", "Obsessively",
    "Obviously", "Often", "Painfully", "Patiently", "Playfully", "Politely", "Poorly", "Precisely", "Promptly",
    "Quickly", "Quietly", "Randomly", "Rapidly", "Rarely", "Recklessly", "Regularly", "Remorsefully", "Responsibly",
    "Rudely", "Ruthlessly", "Sadly", "Scornfully", "Seamlessly", "Seldom", "Selfishly", "Seriously", "Shakily",
    "Sharply", "Sideways", "Silently", "Sleepily", "Slightly", "Slowly", "Slyly", "Smoothly", "Softly", "Solemnly", "Steadily", "Sternly", "Strangely", "Strongly", "Stunningly", "Surely", "Tenderly", "Thoughtfully",
    "Tightly", "Uneasily", "Vanishingly", "Violently", "Warmly", "Weakly", "Wearily", "Weekly", "Weirdly", "Well",
    "Well", "Wickedly", "Wildly", "Wisely", "Wonderfully", "Yearly"
];
var adjectives = [
    "Abominable", "Accurate", "Adorable", "All", "Alleged", "Ancient", "Angry", "Angry", "Anxious", "Appalling",
    "Apparent", "Astonishing", "Attractive", "Awesome", "Baby", "Bad", "Beautiful", "Benign", "Big", "Bitter",
    "Blind", "Blue", "Bold", "Brave", "Bright", "Brisk", "Calm", "Camouflaged", "Casual", "Cautious",
    "Choppy", "Chosen", "Clever", "Cold", "Cool", "Crawly", "Crazy", "Creepy", "Cruel", "Curious", "Cynical",
    "Dangerous", "Dark", "Delicate", "Desperate", "Difficult", "Discreet", "Disguised", "Dizzy",
    "Dumb", "Eager", "Easy", "Edgy", "Electric", "Elegant", "Emancipated", "Enormous", "Euphoric", "Evil",
    "FAIL", "Fast", "Ferocious", "Fierce", "Fine", "Flawed", "Flying", "Foolish", "Foxy",
    "Freezing", "Funny", "Furious", "Gentle", "Glorious", "Golden", "Good", "Green", "Green", "Guilty",
    "Hairy", "Happy", "Hard", "Hasty", "Hazy", "Heroic", "Hostile", "Hot", "Humble", "Humongous",
    "Humorous", "Hysterical", "Idealistic", "Ignorant", "Immense", "Impartial", "Impolite", "Indifferent",
    "Infuriated", "Insightful", "Intense", "Interesting", "Intimidated", "Intriguing", "Jealous", "Jolly", "Jovial",
    "Jumpy", "Kind", "Laughing", "Lazy", "Liquid", "Lonely", "Longing", "Loud", "Loving", "Loyal", "Macabre", "Mad",
    "Magical", "Magnificent", "Malevolent", "Medieval", "Memorable", "Mere", "Merry", "Mighty",
    "Mischievous", "Miserable", "Modified", "Moody", "Most", "Mysterious", "Mystical", "Needy",
    "Nervous", "Nice", "Objective", "Obnoxious", "Obsessive", "Obvious", "Opinionated", "Orange",
    "Painful", "Passionate", "Perfect", "Pink", "Playful", "Poisonous", "Polite", "Poor", "Popular", "Powerful",
    "Precise", "Preserved", "Pretty", "Purple", "Quick", "Quiet", "Random", "Rapid", "Rare", "Real",
    "Reassuring", "Reckless", "Red", "Regular", "Remorseful", "Responsible", "Rich", "Rude", "Ruthless",
    "Sad", "Scared", "Scary", "Scornful", "Screaming", "Selfish", "Serious", "Shady", "Shaky", "Sharp",
    "Shiny", "Shy", "Simple", "Sleepy", "Slow", "Sly", "Small", "Smart", "Smelly", "Smiling", "Smooth",
    "Smug", "Sober", "Soft", "Solemn", "Square", "Square", "Steady", "Strange", "Strong",
    "Stunning", "Subjective", "Successful", "Surly", "Sweet", "Tactful", "Tense",
    "Thoughtful", "Tight", "Tiny", "Tolerant", "Uneasy", "Unique", "Unseen", "Warm", "Weak",
    "Weird", "WellCooked", "Wild", "Wise", "Witty", "Wonderful", "Worried", "Yellow", "Young",
    "Zealous"
    ];
//var pronouns = [
//];
//var conjunctions = [
//"And", "Or", "For", "Above", "Before", "Against", "Between"
//];

/*
 * Maps a string (category name) to the array of words from that category.
 */
var CATEGORIES =
{
    //"_NOUN_": nouns,
    "_PLURALNOUN_": pluralNouns,
    //"_PLACE_": places,
    "_VERB_": verbs,
    "_ADVERB_": adverbs,
    "_ADJECTIVE_": adjectives
    //"_PRONOUN_": pronouns,
    //"_CONJUNCTION_": conjunctions,
};

var PATTERNS = [
    "_ADJECTIVE__PLURALNOUN__VERB__ADVERB_"

    // BeautifulFungiOrSpaghetti
    //"_ADJECTIVE__PLURALNOUN__CONJUNCTION__PLURALNOUN_",

    // AmazinglyScaryToy
    //"_ADVERB__ADJECTIVE__NOUN_",

    // NeitherTrashNorRifle
    //"Neither_NOUN_Nor_NOUN_",
    //"Either_NOUN_Or_NOUN_",

    // EitherCopulateOrInvestigate
    //"Either_VERB_Or_VERB_",
    //"Neither_VERB_Nor_VERB_",

    //"The_ADJECTIVE__ADJECTIVE__NOUN_",
    //"The_ADVERB__ADJECTIVE__NOUN_",
    //"The_ADVERB__ADJECTIVE__NOUN_s",
    //"The_ADVERB__ADJECTIVE__PLURALNOUN__VERB_",

    // WolvesComputeBadly
    //"_PLURALNOUN__VERB__ADVERB_",

    // UniteFacilitateAndMerge
    //"_VERB__VERB_And_VERB_",

    //NastyWitchesAtThePub
    //"_ADJECTIVE__PLURALNOUN_AtThe_PLACE_",
];


/*
 * Returns a random element from the array 'arr'
 */
function randomElement(arr)
{
    return arr[Math.floor(Math.random() * arr.length)];
}

/*
 * Returns true if the string 's' contains one of the
 * template strings.
 */
function hasTemplate(s)
{
    for (var template in CATEGORIES){
        if (s.indexOf(template) >= 0){
            return true;
        }
    }
}

/**
 * Generates new room name.
 */
var RoomNameGenerator = {
    generateRoomWithoutSeparator: function()
    {
        // Note that if more than one pattern is available, the choice of 'name' won't be random (names from patterns
        // with fewer options will have higher probability of being chosen that names from patterns with more options).
        var name = randomElement(PATTERNS);
        var word;
        while (hasTemplate(name)){
            for (var template in CATEGORIES){
                word = randomElement(CATEGORIES[template]);
                name = name.replace(template, word);
            }
        }

        return name;
    }
}

module.exports = RoomNameGenerator;

},{}],34:[function(require,module,exports){
var animateTimeout, updateTimeout;

var RoomNameGenerator = require("./RoomnameGenerator");

function enter_room()
{
    var val = $("#enter_room_field").val();
    if(!val) {
        val = $("#enter_room_field").attr("room_name");
    }
    if (val) {
        window.location.pathname = "/" + val;
    }
}

function animate(word) {
    var currentVal = $("#enter_room_field").attr("placeholder");
    $("#enter_room_field").attr("placeholder", currentVal + word.substr(0, 1));
    animateTimeout = setTimeout(function() {
        animate(word.substring(1, word.length))
    }, 70);
}

function update_roomname()
{
    var word = RoomNameGenerator.generateRoomWithoutSeparator();
    $("#enter_room_field").attr("room_name", word);
    $("#enter_room_field").attr("placeholder", "");
    clearTimeout(animateTimeout);
    animate(word);
    updateTimeout = setTimeout(update_roomname, 10000);
}


function setupWelcomePage()
{
    $("#videoconference_page").hide();
    $("#domain_name").text(
            window.location.protocol + "//" + window.location.host + "/");
    if (interfaceConfig.SHOW_JITSI_WATERMARK) {
        var leftWatermarkDiv
            = $("#welcome_page_header div[class='watermark leftwatermark']");
        if(leftWatermarkDiv && leftWatermarkDiv.length > 0)
        {
            leftWatermarkDiv.css({display: 'block'});
            leftWatermarkDiv.parent().get(0).href
                = interfaceConfig.JITSI_WATERMARK_LINK;
        }

    }

    if (interfaceConfig.SHOW_BRAND_WATERMARK) {
        var rightWatermarkDiv
            = $("#welcome_page_header div[class='watermark rightwatermark']");
        if(rightWatermarkDiv && rightWatermarkDiv.length > 0) {
            rightWatermarkDiv.css({display: 'block'});
            rightWatermarkDiv.parent().get(0).href
                = interfaceConfig.BRAND_WATERMARK_LINK;
            rightWatermarkDiv.get(0).style.backgroundImage
                = "url(images/rightwatermark.png)";
        }
    }

    if (interfaceConfig.SHOW_POWERED_BY) {
        $("#welcome_page_header>a[class='poweredby']")
            .css({display: 'block'});
    }

    $("#enter_room_button").click(function()
    {
        enter_room();
    });

    $("#enter_room_field").keydown(function (event) {
        if (event.keyCode === 13 /* enter */) {
            enter_room();
        }
    });

    if (!(interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE === false)){
        var updateTimeout;
        var animateTimeout;
        $("#reload_roomname").click(function () {
            clearTimeout(updateTimeout);
            clearTimeout(animateTimeout);
            update_roomname();
        });
        $("#reload_roomname").show();


        update_roomname();
    }

    $("#disable_welcome").click(function () {
        window.localStorage.welcomePageDisabled
            = $("#disable_welcome").is(":checked");
    });

}

module.exports = setupWelcomePage;
},{"./RoomnameGenerator":33}],35:[function(require,module,exports){
var EventEmitter = require("events");
var eventEmitter = new EventEmitter();
var CQEvents = require("../../service/connectionquality/CQEvents");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");

/**
 * local stats
 * @type {{}}
 */
var stats = {};

/**
 * remote stats
 * @type {{}}
 */
var remoteStats = {};

/**
 * Interval for sending statistics to other participants
 * @type {null}
 */
var sendIntervalId = null;


/**
 * Start statistics sending.
 */
function startSendingStats() {
    sendStats();
    sendIntervalId = setInterval(sendStats, 10000);
}

/**
 * Sends statistics to other participants
 */
function sendStats() {
    APP.xmpp.addToPresence("connectionQuality", convertToMUCStats(stats));
}

/**
 * Converts statistics to format for sending through XMPP
 * @param stats the statistics
 * @returns {{bitrate_donwload: *, bitrate_uplpoad: *, packetLoss_total: *, packetLoss_download: *, packetLoss_upload: *}}
 */
function convertToMUCStats(stats) {
    return {
        "bitrate_download": stats.bitrate.download,
        "bitrate_upload": stats.bitrate.upload,
        "packetLoss_total": stats.packetLoss.total,
        "packetLoss_download": stats.packetLoss.download,
        "packetLoss_upload": stats.packetLoss.upload
    };
}

/**
 * Converts statitistics to format used by VideoLayout
 * @param stats
 * @returns {{bitrate: {download: *, upload: *}, packetLoss: {total: *, download: *, upload: *}}}
 */
function parseMUCStats(stats) {
    return {
        bitrate: {
            download: stats.bitrate_download,
            upload: stats.bitrate_upload
        },
        packetLoss: {
            total: stats.packetLoss_total,
            download: stats.packetLoss_download,
            upload: stats.packetLoss_upload
        }
    };
}


var ConnectionQuality = {
    init: function () {
        APP.xmpp.addListener(XMPPEvents.REMOTE_STATS, this.updateRemoteStats);
        APP.statistics.addConnectionStatsListener(this.updateLocalStats);
        APP.statistics.addRemoteStatsStopListener(this.stopSendingStats);

    },

    /**
     * Updates the local statistics
     * @param data new statistics
     */
    updateLocalStats: function (data) {
        stats = data;
        eventEmitter.emit(CQEvents.LOCALSTATS_UPDATED, 100 - stats.packetLoss.total, stats);
        if (sendIntervalId == null) {
            startSendingStats();
        }
    },

    /**
     * Updates remote statistics
     * @param jid the jid associated with the statistics
     * @param data the statistics
     */
    updateRemoteStats: function (jid, data) {
        if (data == null || data.packetLoss_total == null) {
            eventEmitter.emit(CQEvents.REMOTESTATS_UPDATED, jid, null, null);
            return;
        }
        remoteStats[jid] = parseMUCStats(data);

        eventEmitter.emit(CQEvents.REMOTESTATS_UPDATED,
            jid, 100 - data.packetLoss_total, remoteStats[jid]);
    },

    /**
     * Stops statistics sending.
     */
    stopSendingStats: function () {
        clearInterval(sendIntervalId);
        sendIntervalId = null;
        //notify UI about stopping statistics gathering
        eventEmitter.emit(CQEvents.STOP);
    },

    /**
     * Returns the local statistics.
     */
    getStats: function () {
        return stats;
    },
    
    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    }

};

module.exports = ConnectionQuality;
},{"../../service/connectionquality/CQEvents":95,"../../service/xmpp/XMPPEvents":98,"events":62}],36:[function(require,module,exports){
/* global $, alert, APP, changeLocalVideo, chrome, config, getConferenceHandler,
 getUserMediaWithConstraints */
/**
 * Indicates that desktop stream is currently in use(for toggle purpose).
 * @type {boolean}
 */
var isUsingScreenStream = false;
/**
 * Indicates that switch stream operation is in progress and prevent from
 * triggering new events.
 * @type {boolean}
 */
var switchInProgress = false;

/**
 * Method used to get screen sharing stream.
 *
 * @type {function (stream_callback, failure_callback}
 */
var obtainDesktopStream = null;

/**
 * Indicates whether desktop sharing extension is installed.
 * @type {boolean}
 */
var extInstalled = false;

/**
 * Indicates whether update of desktop sharing extension is required.
 * @type {boolean}
 */
var extUpdateRequired = false;

/**
 * Flag used to cache desktop sharing enabled state. Do not use directly as
 * it can be <tt>null</tt>.
 *
 * @type {null|boolean}
 */
var _desktopSharingEnabled = null;

var EventEmitter = require("events");

var eventEmitter = new EventEmitter();

var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");

/**
 * Method obtains desktop stream from WebRTC 'screen' source.
 * Flag 'chrome://flags/#enable-usermedia-screen-capture' must be enabled.
 */
function obtainWebRTCScreen(streamCallback, failCallback) {
    APP.RTC.getUserMediaWithConstraints(
        ['screen'],
        streamCallback,
        failCallback
    );
}

/**
 * Constructs inline install URL for Chrome desktop streaming extension.
 * The 'chromeExtensionId' must be defined in config.js.
 * @returns {string}
 */
function getWebStoreInstallUrl()
{
    return "https://chrome.google.com/webstore/detail/" +
        config.chromeExtensionId;
}

/**
 * Checks whether extension update is required.
 * @param minVersion minimal required version
 * @param extVersion current extension version
 * @returns {boolean}
 */
function isUpdateRequired(minVersion, extVersion)
{
    try
    {
        var s1 = minVersion.split('.');
        var s2 = extVersion.split('.');

        var len = Math.max(s1.length, s2.length);
        for (var i = 0; i < len; i++)
        {
            var n1 = 0,
                n2 = 0;

            if (i < s1.length)
                n1 = parseInt(s1[i]);
            if (i < s2.length)
                n2 = parseInt(s2[i]);

            if (isNaN(n1) || isNaN(n2))
            {
                return true;
            }
            else if (n1 !== n2)
            {
                return n1 > n2;
            }
        }

        // will happen if boths version has identical numbers in
        // their components (even if one of them is longer, has more components)
        return false;
    }
    catch (e)
    {
        console.error("Failed to parse extension version", e);
        APP.UI.messageHandler.showError("dialog.error",
            "dialog.detectext");
        return true;
    }
}

function checkExtInstalled(callback) {
    if (!chrome.runtime) {
        // No API, so no extension for sure
        callback(false, false);
        return;
    }
    chrome.runtime.sendMessage(
        config.chromeExtensionId,
        { getVersion: true },
        function (response) {
            if (!response || !response.version) {
                // Communication failure - assume that no endpoint exists
                console.warn(
                    "Extension not installed?: ", chrome.runtime.lastError);
                callback(false, false);
                return;
            }
            // Check installed extension version
            var extVersion = response.version;
            console.log('Extension version is: ' + extVersion);
            var updateRequired
                = isUpdateRequired(config.minChromeExtVersion, extVersion);
            callback(!updateRequired, updateRequired);
        }
    );
}

function doGetStreamFromExtension(streamCallback, failCallback) {
    // Sends 'getStream' msg to the extension.
    // Extension id must be defined in the config.
    chrome.runtime.sendMessage(
        config.chromeExtensionId,
        { getStream: true, sources: config.desktopSharingSources },
        function (response) {
            if (!response) {
                failCallback(chrome.runtime.lastError);
                return;
            }
            console.log("Response from extension: " + response);
            if (response.streamId) {
                APP.RTC.getUserMediaWithConstraints(
                    ['desktop'],
                    function (stream) {
                        streamCallback(stream);
                    },
                    failCallback,
                    null, null, null,
                    response.streamId);
            } else {
                failCallback("Extension failed to get the stream");
            }
        }
    );
}
/**
 * Asks Chrome extension to call chooseDesktopMedia and gets chrome 'desktop'
 * stream for returned stream token.
 */
function obtainScreenFromExtension(streamCallback, failCallback) {
    if (extInstalled) {
        doGetStreamFromExtension(streamCallback, failCallback);
    } else {
        if (extUpdateRequired) {
            alert(
                'Jitsi Desktop Streamer requires update. ' +
                'Changes will take effect after next Chrome restart.');
        }

        chrome.webstore.install(
            getWebStoreInstallUrl(),
            function (arg) {
                console.log("Extension installed successfully", arg);
                // We need to reload the page in order to get the access to
                // chrome.runtime
                window.location.reload(false);
            },
            function (arg) {
                console.log("Failed to install the extension", arg);
                failCallback(arg);
                APP.UI.messageHandler.showError("dialog.error",
                    "dialog.failtoinstall");
            }
        );
    }
}

/**
 * Call this method to toggle desktop sharing feature.
 * @param method pass "ext" to use chrome extension for desktop capture(chrome
 *        extension required), pass "webrtc" to use WebRTC "screen" desktop
 *        source('chrome://flags/#enable-usermedia-screen-capture' must be
 *        enabled), pass any other string or nothing in order to disable this
 *        feature completely.
 */
function setDesktopSharing(method) {
    // Check if we are running chrome
    if (!navigator.webkitGetUserMedia) {
        obtainDesktopStream = null;
        console.info("Desktop sharing disabled");
    } else if (method == "ext") {
        obtainDesktopStream = obtainScreenFromExtension;
        console.info("Using Chrome extension for desktop sharing");
    } else if (method == "webrtc") {
        obtainDesktopStream = obtainWebRTCScreen;
        console.info("Using Chrome WebRTC for desktop sharing");
    }

    // Reset enabled cache
    _desktopSharingEnabled = null;
}

/**
 * Initializes <link rel=chrome-webstore-item /> with extension id set in
 * config.js to support inline installs. Host site must be selected as main
 * website of published extension.
 */
function initInlineInstalls()
{
    $("link[rel=chrome-webstore-item]").attr("href", getWebStoreInstallUrl());
}

function getSwitchStreamFailed(error) {
    console.error("Failed to obtain the stream to switch to", error);
    switchInProgress = false;
}

function streamSwitchDone() {
    switchInProgress = false;
    eventEmitter.emit(
        DesktopSharingEventTypes.SWITCHING_DONE,
        isUsingScreenStream);
}

function newStreamCreated(stream)
{
    eventEmitter.emit(DesktopSharingEventTypes.NEW_STREAM_CREATED,
        stream, isUsingScreenStream, streamSwitchDone);
}


module.exports = {
    isUsingScreenStream: function () {
        return isUsingScreenStream;
    },

    /**
     * @returns {boolean} <tt>true</tt> if desktop sharing feature is available
     *          and enabled.
     */
    isDesktopSharingEnabled: function () {
        if (_desktopSharingEnabled === null) {
            if (obtainDesktopStream === obtainScreenFromExtension) {
                // Parse chrome version
                var userAgent = navigator.userAgent.toLowerCase();
                // We can assume that user agent is chrome, because it's
                // enforced when 'ext' streaming method is set
                var ver = parseInt(userAgent.match(/chrome\/(\d+)\./)[1], 10);
                console.log("Chrome version" + userAgent, ver);
                _desktopSharingEnabled = ver >= 34;
            } else {
                _desktopSharingEnabled =
                    obtainDesktopStream === obtainWebRTCScreen;
            }
        }
        return _desktopSharingEnabled;
    },
    
    init: function () {
        setDesktopSharing(config.desktopSharing);

        // Initialize Chrome extension inline installs
        if (config.chromeExtensionId) {

            initInlineInstalls();

            // Check if extension is installed
            checkExtInstalled(function (installed, updateRequired) {
                extInstalled = installed;
                extUpdateRequired = updateRequired;
                console.info(
                    "Chrome extension installed: " + extInstalled +
                    " updateRequired: " + extUpdateRequired);
            });
        }

        eventEmitter.emit(DesktopSharingEventTypes.INIT);
    },

    addListener: function (listener, type)
    {
        eventEmitter.on(type, listener);
    },

    removeListener: function (listener, type) {
        eventEmitter.removeListener(type, listener);
    },

    /*
     * Toggles screen sharing.
     */
    toggleScreenSharing: function () {
        if (switchInProgress || !obtainDesktopStream) {
            console.warn("Switch in progress or no method defined");
            return;
        }
        switchInProgress = true;

        if (!isUsingScreenStream)
        {
            // Switch to desktop stream
            obtainDesktopStream(
                function (stream) {
                    // We now use screen stream
                    isUsingScreenStream = true;
                    // Hook 'ended' event to restore camera
                    // when screen stream stops
                    stream.addEventListener('ended',
                        function (e) {
                            if (!switchInProgress && isUsingScreenStream) {
                                APP.desktopsharing.toggleScreenSharing();
                            }
                        }
                    );
                    newStreamCreated(stream);
                },
                getSwitchStreamFailed);
        } else {
            // Disable screen stream
            APP.RTC.getUserMediaWithConstraints(
                ['video'],
                function (stream) {
                    // We are now using camera stream
                    isUsingScreenStream = false;
                    newStreamCreated(stream);
                },
                getSwitchStreamFailed, config.resolution || '360'
            );
        }
    }
};


},{"../../service/desktopsharing/DesktopSharingEventTypes":96,"events":62}],37:[function(require,module,exports){
//maps keycode to character, id of popover for given function and function
var shortcuts = {
    67: {
        character: "C",
        id: "toggleChatPopover",
        function: APP.UI.toggleChat
    },
    70: {
        character: "F",
        id: "filmstripPopover",
        function: APP.UI.toggleFilmStrip
    },
    77: {
        character: "M",
        id: "mutePopover",
        function: APP.UI.toggleAudio
    },
    84: {
        character: "T",
        function: function() {
            if(!APP.RTC.localAudio.isMuted()) {
                APP.UI.toggleAudio();
            }
        }
    },
    86: {
        character: "V",
        id: "toggleVideoPopover",
        function: APP.UI.toggleVideo
    }
};


var KeyboardShortcut = {
    init: function () {
        window.onkeyup = function(e) {
            var keycode = e.which;
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                if (typeof shortcuts[keycode] === "object") {
                    shortcuts[keycode].function();
                }
                else if (keycode >= "0".charCodeAt(0) &&
                    keycode <= "9".charCodeAt(0)) {
                    APP.UI.clickOnVideo(keycode - "0".charCodeAt(0) + 1);
                }
                //esc while the smileys are visible hides them
            } else if (keycode === 27 && $('#smileysContainer').is(':visible')) {
                APP.UI.toggleSmileys();
            }
        };

        window.onkeydown = function(e) {
            if(!($(":focus").is("input[type=text]") ||
                $(":focus").is("input[type=password]") ||
                $(":focus").is("textarea"))) {
                if(e.which === "T".charCodeAt(0)) {
                    if(APP.RTC.localAudio.isMuted()) {
                        APP.UI.toggleAudio();
                    }
                }
            }
        };
        var self = this;
        $('body').popover({ selector: '[data-toggle=popover]',
            trigger: 'click hover',
            content: function() {
                return this.getAttribute("content") +
                    self.getShortcut(this.getAttribute("shortcut"));
            }
        });
    },
    /**
     *
     * @param id indicates the popover associated with the shortcut
     * @returns {string} the keyboard shortcut used for the id given
     */
    getShortcut: function (id) {
        for (var keycode in shortcuts) {
            if (shortcuts.hasOwnProperty(keycode)) {
                if (shortcuts[keycode].id === id) {
                    return " (" + shortcuts[keycode].character + ")";
                }
            }
        }
        return "";
    }
};

module.exports = KeyboardShortcut;

},{}],38:[function(require,module,exports){
var email = '';
var displayName = '';
var userId;
var language = null;


function supportsLocalStorage() {
    try {
        return 'localStorage' in window && window.localStorage !== null;
    } catch (e) {
        console.log("localstorage is not supported");
        return false;
    }
}


function generateUniqueId() {
    function _p8() {
        return (Math.random().toString(16) + "000000000").substr(2, 8);
    }
    return _p8() + _p8() + _p8() + _p8();
}

if (supportsLocalStorage()) {
    if (!window.localStorage.jitsiMeetId) {
        window.localStorage.jitsiMeetId = generateUniqueId();
        console.log("generated id", window.localStorage.jitsiMeetId);
    }
    userId = window.localStorage.jitsiMeetId || '';
    email = window.localStorage.email || '';
    displayName = window.localStorage.displayname || '';
    language = window.localStorage.language;
} else {
    console.log("local storage is not supported");
    userId = generateUniqueId();
}

var Settings =
{
    setDisplayName: function (newDisplayName) {
        displayName = newDisplayName;
        window.localStorage.displayname = displayName;
        return displayName;
    },
    setEmail: function (newEmail)
    {
        email = newEmail;
        window.localStorage.email = newEmail;
        return email;
    },
    getSettings: function () {
        return {
            email: email,
            displayName: displayName,
            uid: userId,
            language: language
        };
    },
    setLanguage: function (lang) {
        language = lang;
        window.localStorage.language = lang;
    }
};

module.exports = Settings;

},{}],39:[function(require,module,exports){
/**
 *
 * @constructor
 */
function SimulcastLogger(name, lvl) {
    this.name = name;
    this.lvl = lvl;
}

SimulcastLogger.prototype.log = function (text) {
    if (this.lvl) {
        console.log(text);
    }
};

SimulcastLogger.prototype.info = function (text) {
    if (this.lvl > 1) {
        console.info(text);
    }
};

SimulcastLogger.prototype.fine = function (text) {
    if (this.lvl > 2) {
        console.log(text);
    }
};

SimulcastLogger.prototype.error = function (text) {
    console.error(text);
};

module.exports = SimulcastLogger;
},{}],40:[function(require,module,exports){
var SimulcastLogger = require("./SimulcastLogger");
var SimulcastUtils = require("./SimulcastUtils");
var MediaStreamType = require("../../service/RTC/MediaStreamTypes");

function SimulcastReceiver() {
    this.simulcastUtils = new SimulcastUtils();
    this.logger = new SimulcastLogger('SimulcastReceiver', 1);
}

SimulcastReceiver.prototype._remoteVideoSourceCache = '';
SimulcastReceiver.prototype._remoteMaps = {
    msid2Quality: {},
    ssrc2Msid: {},
    msid2ssrc: {},
    receivingVideoStreams: {}
};

SimulcastReceiver.prototype._cacheRemoteVideoSources = function (lines) {
    this._remoteVideoSourceCache = this.simulcastUtils._getVideoSources(lines);
};

SimulcastReceiver.prototype._restoreRemoteVideoSources = function (lines) {
    this.simulcastUtils._replaceVideoSources(lines, this._remoteVideoSourceCache);
};

SimulcastReceiver.prototype._ensureGoogConference = function (lines) {
    var sb;

    this.logger.info('Ensuring x-google-conference flag...')

    if (this.simulcastUtils._indexOfArray('a=x-google-flag:conference', lines) === this.simulcastUtils._emptyCompoundIndex) {
        // TODO(gp) do that for the audio as well as suggested by fippo.
        // Add the google conference flag
        sb = this.simulcastUtils._getVideoSources(lines);
        sb = ['a=x-google-flag:conference'].concat(sb);
        this.simulcastUtils._replaceVideoSources(lines, sb);
    }
};

SimulcastReceiver.prototype._restoreSimulcastGroups = function (sb) {
    this._restoreRemoteVideoSources(sb);
};

/**
 * Restores the simulcast groups of the remote description. In
 * transformRemoteDescription we remove those in order for the set remote
 * description to succeed. The focus needs the signal the groups to new
 * participants.
 *
 * @param desc
 * @returns {*}
 */
SimulcastReceiver.prototype.reverseTransformRemoteDescription = function (desc) {
    var sb;

    if (!this.simulcastUtils.isValidDescription(desc)) {
        return desc;
    }

    if (config.enableSimulcast) {
        sb = desc.sdp.split('\r\n');

        this._restoreSimulcastGroups(sb);

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });
    }

    return desc;
};

SimulcastUtils.prototype._ensureOrder = function (lines) {
    var videoSources, sb;

    videoSources = this.parseMedia(lines, ['video'])[0];
    sb = this._compileVideoSources(videoSources);

    this._replaceVideoSources(lines, sb);
};

SimulcastReceiver.prototype._updateRemoteMaps = function (lines) {
    var remoteVideoSources = this.simulcastUtils.parseMedia(lines, ['video'])[0],
        videoSource, quality;

    // (re) initialize the remote maps.
    this._remoteMaps.msid2Quality = {};
    this._remoteMaps.ssrc2Msid = {};
    this._remoteMaps.msid2ssrc = {};

    var self = this;
    if (remoteVideoSources.groups && remoteVideoSources.groups.length !== 0) {
        remoteVideoSources.groups.forEach(function (group) {
            if (group.semantics === 'SIM' && group.ssrcs && group.ssrcs.length !== 0) {
                quality = 0;
                group.ssrcs.forEach(function (ssrc) {
                    videoSource = remoteVideoSources.sources[ssrc];
                    self._remoteMaps.msid2Quality[videoSource.msid] = quality++;
                    self._remoteMaps.ssrc2Msid[videoSource.ssrc] = videoSource.msid;
                    self._remoteMaps.msid2ssrc[videoSource.msid] = videoSource.ssrc;
                });
            }
        });
    }
};

SimulcastReceiver.prototype._setReceivingVideoStream = function (resource, ssrc) {
    this._remoteMaps.receivingVideoStreams[resource] = ssrc;
};

/**
 * Returns a stream with single video track, the one currently being
 * received by this endpoint.
 *
 * @param stream the remote simulcast stream.
 * @returns {webkitMediaStream}
 */
SimulcastReceiver.prototype.getReceivingVideoStream = function (stream) {
    var tracks, i, electedTrack, msid, quality = 0, receivingTrackId;

    var self = this;
    if (config.enableSimulcast) {

        stream.getVideoTracks().some(function (track) {
            return Object.keys(self._remoteMaps.receivingVideoStreams).some(function (resource) {
                var ssrc = self._remoteMaps.receivingVideoStreams[resource];
                var msid = self._remoteMaps.ssrc2Msid[ssrc];
                if (msid == [stream.id, track.id].join(' ')) {
                    electedTrack = track;
                    return true;
                }
            });
        });

        if (!electedTrack) {
            // we don't have an elected track, choose by initial quality.
            tracks = stream.getVideoTracks();
            for (i = 0; i < tracks.length; i++) {
                msid = [stream.id, tracks[i].id].join(' ');
                if (this._remoteMaps.msid2Quality[msid] === quality) {
                    electedTrack = tracks[i];
                    break;
                }
            }

            // TODO(gp) if the initialQuality could not be satisfied, lower
            // the requirement and try again.
        }
    }

    return (electedTrack)
        ? new webkitMediaStream([electedTrack])
        : stream;
};

SimulcastReceiver.prototype.getReceivingSSRC = function (jid) {
    var resource = Strophe.getResourceFromJid(jid);
    var ssrc = this._remoteMaps.receivingVideoStreams[resource];

    // If we haven't receiving a "changed" event yet, then we must be receiving
    // low quality (that the sender always streams).
    if(!ssrc)
    {
        var remoteStreamObject = APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
        var remoteStream = remoteStreamObject.getOriginalStream();
        var tracks = remoteStream.getVideoTracks();
        if (tracks) {
            for (var k = 0; k < tracks.length; k++) {
                var track = tracks[k];
                var msid = [remoteStream.id, track.id].join(' ');
                var _ssrc = this._remoteMaps.msid2ssrc[msid];
                var quality = this._remoteMaps.msid2Quality[msid];
                if (quality == 0) {
                    ssrc = _ssrc;
                }
            }
        }
    }

    return ssrc;
};

SimulcastReceiver.prototype.getReceivingVideoStreamBySSRC = function (ssrc)
{
    var sid, electedStream;
    var i, j, k;
    var jid = APP.xmpp.getJidFromSSRC(ssrc);
    if(jid && APP.RTC.remoteStreams[jid])
    {
        var remoteStreamObject = APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
        var remoteStream = remoteStreamObject.getOriginalStream();
        var tracks = remoteStream.getVideoTracks();
        if (tracks) {
            for (k = 0; k < tracks.length; k++) {
                var track = tracks[k];
                var msid = [remoteStream.id, track.id].join(' ');
                var tmp = this._remoteMaps.msid2ssrc[msid];
                if (tmp == ssrc) {
                    electedStream = new webkitMediaStream([track]);
                    sid = remoteStreamObject.sid;
                    // stream found, stop.
                    break;
                }
            }
        }

    }
    else
    {
        console.debug(APP.RTC.remoteStreams, jid, ssrc);
    }

    return {
        sid: sid,
        stream: electedStream
    };
};

/**
 * Gets the fully qualified msid (stream.id + track.id) associated to the
 * SSRC.
 *
 * @param ssrc
 * @returns {*}
 */
SimulcastReceiver.prototype.getRemoteVideoStreamIdBySSRC = function (ssrc) {
    return this._remoteMaps.ssrc2Msid[ssrc];
};

/**
 * Removes the ssrc-group:SIM from the remote description bacause Chrome
 * either gets confused and thinks this is an FID group or, if an FID group
 * is already present, it fails to set the remote description.
 *
 * @param desc
 * @returns {*}
 */
SimulcastReceiver.prototype.transformRemoteDescription = function (desc) {

    if (desc && desc.sdp) {
        var sb = desc.sdp.split('\r\n');

        this._updateRemoteMaps(sb);
        this._cacheRemoteVideoSources(sb);

        // NOTE(gp) this needs to be called after updateRemoteMaps because we
        // need the simulcast group in the _updateRemoteMaps() method.
        this.simulcastUtils._removeSimulcastGroup(sb);

        if (desc.sdp.indexOf('a=ssrc-group:SIM') !== -1) {
            // We don't need the goog conference flag if we're not doing
            // simulcast.
            this._ensureGoogConference(sb);
        }

        desc = new RTCSessionDescription({
            type: desc.type,
            sdp: sb.join('\r\n')
        });

        this.logger.fine(['Transformed remote description', desc.sdp].join(' '));
    }

    return desc;
};

module.exports = SimulcastReceiver;
},{"../../service/RTC/MediaStreamTypes":88,"./SimulcastLogger":39,"./SimulcastUtils":42}],41:[function(require,module,exports){
var SimulcastLogger = require("./SimulcastLogger");
var SimulcastUtils = require("./SimulcastUtils");

function SimulcastSender() {
    this.simulcastUtils = new SimulcastUtils();
    this.logger = new SimulcastLogger('SimulcastSender', 1);
}

SimulcastSender.prototype.displayedLocalVideoStream = null;

SimulcastSender.prototype._generateGuid = (function () {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }

    return function () {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
}());

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() gives a non-uniform distribution!
SimulcastSender.prototype._generateRandomSSRC = function () {
    var min = 0, max = 0xffffffff;
    return Math.floor(Math.random() * (max - min)) + min;
};

SimulcastSender.prototype.getLocalVideoStream = function () {
    return (this.displayedLocalVideoStream != null)
        ? this.displayedLocalVideoStream
        // in case we have no simulcast at all, i.e. we didn't perform the GUM
        : APP.RTC.localVideo.getOriginalStream();
};

function NativeSimulcastSender() {
    SimulcastSender.call(this); // call the super constructor.
}

NativeSimulcastSender.prototype = Object.create(SimulcastSender.prototype);

NativeSimulcastSender.prototype._localExplosionMap = {};
NativeSimulcastSender.prototype._isUsingScreenStream = false;
NativeSimulcastSender.prototype._localVideoSourceCache = '';

NativeSimulcastSender.prototype.reset = function () {
    this._localExplosionMap = {};
    this._isUsingScreenStream = APP.desktopsharing.isUsingScreenStream();
};

NativeSimulcastSender.prototype._cacheLocalVideoSources = function (lines) {
    this._localVideoSourceCache = this.simulcastUtils._getVideoSources(lines);
};

NativeSimulcastSender.prototype._restoreLocalVideoSources = function (lines) {
    this.simulcastUtils._replaceVideoSources(lines, this._localVideoSourceCache);
};

NativeSimulcastSender.prototype._appendSimulcastGroup = function (lines) {
    var videoSources, ssrcGroup, simSSRC, numOfSubs = 2, i, sb, msid;

    this.logger.info('Appending simulcast group...');

    // Get the primary SSRC information.
    videoSources = this.simulcastUtils.parseMedia(lines, ['video'])[0];

    // Start building the SIM SSRC group.
    ssrcGroup = ['a=ssrc-group:SIM'];

    // The video source buffer.
    sb = [];

    // Create the simulcast sub-streams.
    for (i = 0; i < numOfSubs; i++) {
        // TODO(gp) prevent SSRC collision.
        simSSRC = this._generateRandomSSRC();
        ssrcGroup.push(simSSRC);

        if (videoSources.base) {
            sb.splice.apply(sb, [sb.length, 0].concat(
                [["a=ssrc:", simSSRC, " cname:", videoSources.base.cname].join(''),
                    ["a=ssrc:", simSSRC, " msid:", videoSources.base.msid].join('')]
            ));
        }

        this.logger.info(['Generated substream ', i, ' with SSRC ', simSSRC, '.'].join(''));

    }

    // Add the group sim layers.
    sb.splice(0, 0, ssrcGroup.join(' '))

    this.simulcastUtils._replaceVideoSources(lines, sb);
};

// Does the actual patching.
NativeSimulcastSender.prototype._ensureSimulcastGroup = function (lines) {

    this.logger.info('Ensuring simulcast group...');

    if (this.simulcastUtils._indexOfArray('a=ssrc-group:SIM', lines) === this.simulcastUtils._emptyCompoundIndex) {
        this._appendSimulcastGroup(lines);
        this._cacheLocalVideoSources(lines);
    } else {
        // verify that the ssrcs participating in the SIM group are present
        // in the SDP (needed for presence).
        this._restoreLocalVideoSources(lines);
    }
};

/**
 * Produces a single stream with multiple tracks for local video sources.
 *
 * @param lines
 * @private
 */
NativeSimulcastSender.prototype._explodeSimulcastSenderSources = function (lines) {
    var sb, msid, sid, tid, videoSources, self;

    this.logger.info('Exploding local video sources...');

    videoSources = this.simulcastUtils.parseMedia(lines, ['video'])[0];

    self = this;
    if (videoSources.groups && videoSources.groups.length !== 0) {
        videoSources.groups.forEach(function (group) {
            if (group.semantics === 'SIM') {
                group.ssrcs.forEach(function (ssrc) {

                    // Get the msid for this ssrc..
                    if (self._localExplosionMap[ssrc]) {
                        // .. either from the explosion map..
                        msid = self._localExplosionMap[ssrc];
                    } else {
                        // .. or generate a new one (msid).
                        sid = videoSources.sources[ssrc].msid
                            .substring(0, videoSources.sources[ssrc].msid.indexOf(' '));

                        tid = self._generateGuid();
                        msid = [sid, tid].join(' ');
                        self._localExplosionMap[ssrc] = msid;
                    }

                    // Assign it to the source object.
                    videoSources.sources[ssrc].msid = msid;

                    // TODO(gp) Change the msid of associated sources.
                });
            }
        });
    }

    sb = this.simulcastUtils._compileVideoSources(videoSources);

    this.simulcastUtils._replaceVideoSources(lines, sb);
};

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
NativeSimulcastSender.prototype.getUserMedia = function (constraints, success, err) {

    // There's nothing special to do for native simulcast, so just do a normal GUM.
    navigator.webkitGetUserMedia(constraints, function (hqStream) {
        success(hqStream);
    }, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
NativeSimulcastSender.prototype.reverseTransformLocalDescription = function (desc) {
    var sb;

    if (!this.simulcastUtils.isValidDescription(desc) || this._isUsingScreenStream) {
        return desc;
    }


    sb = desc.sdp.split('\r\n');

    this._explodeSimulcastSenderSources(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine(['Exploded local video sources', desc.sdp].join(' '));

    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
NativeSimulcastSender.prototype.transformAnswer = function (desc) {

    if (!this.simulcastUtils.isValidDescription(desc) || this._isUsingScreenStream) {
        return desc;
    }

    var sb = desc.sdp.split('\r\n');

    // Even if we have enabled native simulcasting previously
    // (with a call to SLD with an appropriate SDP, for example),
    // createAnswer seems to consistently generate incomplete SDP
    // with missing SSRCS.
    //
    // So, subsequent calls to SLD will have missing SSRCS and presence
    // won't have the complete list of SRCs.
    this._ensureSimulcastGroup(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine(['Transformed answer', desc.sdp].join(' '));

    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
NativeSimulcastSender.prototype.transformLocalDescription = function (desc) {
    return desc;
};

NativeSimulcastSender.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {
    // Nothing to do here, native simulcast does that auto-magically.
};

NativeSimulcastSender.prototype.constructor = NativeSimulcastSender;

function SimpleSimulcastSender() {
    SimulcastSender.call(this);
}

SimpleSimulcastSender.prototype = Object.create(SimulcastSender.prototype);

SimpleSimulcastSender.prototype.localStream = null;
SimpleSimulcastSender.prototype._localMaps = {
    msids: [],
    msid2ssrc: {}
};

/**
 * Groups local video sources together in the ssrc-group:SIM group.
 *
 * @param lines
 * @private
 */
SimpleSimulcastSender.prototype._groupLocalVideoSources = function (lines) {
    var sb, videoSources, ssrcs = [], ssrc;

    this.logger.info('Grouping local video sources...');

    videoSources = this.simulcastUtils.parseMedia(lines, ['video'])[0];

    for (ssrc in videoSources.sources) {
        // jitsi-meet destroys/creates streams at various places causing
        // the original local stream ids to change. The only thing that
        // remains unchanged is the trackid.
        this._localMaps.msid2ssrc[videoSources.sources[ssrc].msid.split(' ')[1]] = ssrc;
    }

    var self = this;
    // TODO(gp) add only "free" sources.
    this._localMaps.msids.forEach(function (msid) {
        ssrcs.push(self._localMaps.msid2ssrc[msid]);
    });

    if (!videoSources.groups) {
        videoSources.groups = [];
    }

    videoSources.groups.push({
        'semantics': 'SIM',
        'ssrcs': ssrcs
    });

    sb = this.simulcastUtils._compileVideoSources(videoSources);

    this.simulcastUtils._replaceVideoSources(lines, sb);
};

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
SimpleSimulcastSender.prototype.getUserMedia = function (constraints, success, err) {

    // TODO(gp) what if we request a resolution not supported by the hardware?
    // TODO(gp) make the lq stream configurable; although this wouldn't work with native simulcast
    var lqConstraints = {
        audio: false,
        video: {
            mandatory: {
                maxWidth: 320,
                maxHeight: 180,
                maxFrameRate: 15
            }
        }
    };

    this.logger.info('HQ constraints: ', constraints);
    this.logger.info('LQ constraints: ', lqConstraints);


    // NOTE(gp) if we request the lq stream first webkitGetUserMedia
    // fails randomly. Tested with Chrome 37. As fippo suggested, the
    // reason appears to be that Chrome only acquires the cam once and
    // then downscales the picture (https://code.google.com/p/chromium/issues/detail?id=346616#c11)

    var self = this;
    navigator.webkitGetUserMedia(constraints, function (hqStream) {

        self.localStream = hqStream;

        // reset local maps.
        self._localMaps.msids = [];
        self._localMaps.msid2ssrc = {};

        // add hq trackid to local map
        self._localMaps.msids.push(hqStream.getVideoTracks()[0].id);

        navigator.webkitGetUserMedia(lqConstraints, function (lqStream) {

            self.displayedLocalVideoStream = lqStream;

            // NOTE(gp) The specification says Array.forEach() will visit
            // the array elements in numeric order, and that it doesn't
            // visit elements that don't exist.

            // add lq trackid to local map
            self._localMaps.msids.splice(0, 0, lqStream.getVideoTracks()[0].id);

            self.localStream.addTrack(lqStream.getVideoTracks()[0]);
            success(self.localStream);
        }, err);
    }, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
SimpleSimulcastSender.prototype.reverseTransformLocalDescription = function (desc) {
    var sb;

    if (!this.simulcastUtils.isValidDescription(desc)) {
        return desc;
    }

    sb = desc.sdp.split('\r\n');

    this._groupLocalVideoSources(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine('Grouped local video sources');
    this.logger.fine(desc.sdp);

    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
SimpleSimulcastSender.prototype.transformAnswer = function (desc) {
    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
SimpleSimulcastSender.prototype.transformLocalDescription = function (desc) {

    var sb = desc.sdp.split('\r\n');

    this.simulcastUtils._removeSimulcastGroup(sb);

    desc = new RTCSessionDescription({
        type: desc.type,
        sdp: sb.join('\r\n')
    });

    this.logger.fine('Transformed local description');
    this.logger.fine(desc.sdp);

    return desc;
};

SimpleSimulcastSender.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {
    var trackid;

    var self = this;
    this.logger.log(['Requested to', enabled ? 'enable' : 'disable', ssrc].join(' '));
    if (Object.keys(this._localMaps.msid2ssrc).some(function (tid) {
        // Search for the track id that corresponds to the ssrc
        if (self._localMaps.msid2ssrc[tid] == ssrc) {
            trackid = tid;
            return true;
        }
    }) && self.localStream.getVideoTracks().some(function (track) {
        // Start/stop the track that corresponds to the track id
        if (track.id === trackid) {
            track.enabled = enabled;
            return true;
        }
    })) {
        this.logger.log([trackid, enabled ? 'enabled' : 'disabled'].join(' '));
        $(document).trigger(enabled
            ? 'simulcastlayerstarted'
            : 'simulcastlayerstopped');
    } else {
        this.logger.error("I don't have a local stream with SSRC " + ssrc);
    }
};

SimpleSimulcastSender.prototype.constructor = SimpleSimulcastSender;

function NoSimulcastSender() {
    SimulcastSender.call(this);
}

NoSimulcastSender.prototype = Object.create(SimulcastSender.prototype);

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
NoSimulcastSender.prototype.getUserMedia = function (constraints, success, err) {
    navigator.webkitGetUserMedia(constraints, function (hqStream) {
        success(hqStream);
    }, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
NoSimulcastSender.prototype.reverseTransformLocalDescription = function (desc) {
    return desc;
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
NoSimulcastSender.prototype.transformAnswer = function (desc) {
    return desc;
};


/**
 *
 *
 * @param desc
 * @returns {*}
 */
NoSimulcastSender.prototype.transformLocalDescription = function (desc) {
    return desc;
};

NoSimulcastSender.prototype._setLocalVideoStreamEnabled = function (ssrc, enabled) {

};

NoSimulcastSender.prototype.constructor = NoSimulcastSender;

module.exports = {
    "native": NativeSimulcastSender,
    "no": NoSimulcastSender
}

},{"./SimulcastLogger":39,"./SimulcastUtils":42}],42:[function(require,module,exports){
var SimulcastLogger = require("./SimulcastLogger");

/**
 *
 * @constructor
 */
function SimulcastUtils() {
    this.logger = new SimulcastLogger("SimulcastUtils", 1);
}

/**
 *
 * @type {{}}
 * @private
 */
SimulcastUtils.prototype._emptyCompoundIndex = {};

/**
 *
 * @param lines
 * @param videoSources
 * @private
 */
SimulcastUtils.prototype._replaceVideoSources = function (lines, videoSources) {
    var i, inVideo = false, index = -1, howMany = 0;

    this.logger.info('Replacing video sources...');

    for (i = 0; i < lines.length; i++) {
        if (inVideo && lines[i].substring(0, 'm='.length) === 'm=') {
            // Out of video.
            break;
        }

        if (!inVideo && lines[i].substring(0, 'm=video '.length) === 'm=video ') {
            // In video.
            inVideo = true;
        }

        if (inVideo && (lines[i].substring(0, 'a=ssrc:'.length) === 'a=ssrc:'
            || lines[i].substring(0, 'a=ssrc-group:'.length) === 'a=ssrc-group:')) {

            if (index === -1) {
                index = i;
            }

            howMany++;
        }
    }

    //  efficiency baby ;)
    lines.splice.apply(lines,
        [index, howMany].concat(videoSources));

};

SimulcastUtils.prototype.isValidDescription = function (desc)
{
    return desc && desc != null
        && desc.type && desc.type != ''
        && desc.sdp && desc.sdp != '';
};

SimulcastUtils.prototype._getVideoSources = function (lines) {
    var i, inVideo = false, sb = [];

    this.logger.info('Getting video sources...');

    for (i = 0; i < lines.length; i++) {
        if (inVideo && lines[i].substring(0, 'm='.length) === 'm=') {
            // Out of video.
            break;
        }

        if (!inVideo && lines[i].substring(0, 'm=video '.length) === 'm=video ') {
            // In video.
            inVideo = true;
        }

        if (inVideo && lines[i].substring(0, 'a=ssrc:'.length) === 'a=ssrc:') {
            // In SSRC.
            sb.push(lines[i]);
        }

        if (inVideo && lines[i].substring(0, 'a=ssrc-group:'.length) === 'a=ssrc-group:') {
            sb.push(lines[i]);
        }
    }

    return sb;
};

SimulcastUtils.prototype.parseMedia = function (lines, mediatypes) {
    var i, res = [], type, cur_media, idx, ssrcs, cur_ssrc, ssrc,
        ssrc_attribute, group, semantics, skip = true;

    this.logger.info('Parsing media sources...');

    for (i = 0; i < lines.length; i++) {
        if (lines[i].substring(0, 'm='.length) === 'm=') {

            type = lines[i]
                .substr('m='.length, lines[i].indexOf(' ') - 'm='.length);
            skip = mediatypes !== undefined && mediatypes.indexOf(type) === -1;

            if (!skip) {
                cur_media = {
                    'type': type,
                    'sources': {},
                    'groups': []
                };

                res.push(cur_media);
            }

        } else if (!skip && lines[i].substring(0, 'a=ssrc:'.length) === 'a=ssrc:') {

            idx = lines[i].indexOf(' ');
            ssrc = lines[i].substring('a=ssrc:'.length, idx);
            if (cur_media.sources[ssrc] === undefined) {
                cur_ssrc = {'ssrc': ssrc};
                cur_media.sources[ssrc] = cur_ssrc;
            }

            ssrc_attribute = lines[i].substr(idx + 1).split(':', 2)[0];
            cur_ssrc[ssrc_attribute] = lines[i].substr(idx + 1).split(':', 2)[1];

            if (cur_media.base === undefined) {
                cur_media.base = cur_ssrc;
            }

        } else if (!skip && lines[i].substring(0, 'a=ssrc-group:'.length) === 'a=ssrc-group:') {
            idx = lines[i].indexOf(' ');
            semantics = lines[i].substr(0, idx).substr('a=ssrc-group:'.length);
            ssrcs = lines[i].substr(idx).trim().split(' ');
            group = {
                'semantics': semantics,
                'ssrcs': ssrcs
            };
            cur_media.groups.push(group);
        } else if (!skip && (lines[i].substring(0, 'a=sendrecv'.length) === 'a=sendrecv' ||
            lines[i].substring(0, 'a=recvonly'.length) === 'a=recvonly' ||
            lines[i].substring(0, 'a=sendonly'.length) === 'a=sendonly' ||
            lines[i].substring(0, 'a=inactive'.length) === 'a=inactive')) {

            cur_media.direction = lines[i].substring('a='.length);
        }
    }

    return res;
};

/**
 * The _indexOfArray() method returns the first a CompoundIndex at which a
 * given element can be found in the array, or _emptyCompoundIndex if it is
 * not present.
 *
 * Example:
 *
 * _indexOfArray('3', [ 'this is line 1', 'this is line 2', 'this is line 3' ])
 *
 * returns {row: 2, column: 14}
 *
 * @param needle
 * @param haystack
 * @param start
 * @returns {}
 * @private
 */
SimulcastUtils.prototype._indexOfArray = function (needle, haystack, start) {
    var length = haystack.length, idx, i;

    if (!start) {
        start = 0;
    }

    for (i = start; i < length; i++) {
        idx = haystack[i].indexOf(needle);
        if (idx !== -1) {
            return {row: i, column: idx};
        }
    }
    return this._emptyCompoundIndex;
};

SimulcastUtils.prototype._removeSimulcastGroup = function (lines) {
    var i;

    for (i = lines.length - 1; i >= 0; i--) {
        if (lines[i].indexOf('a=ssrc-group:SIM') !== -1) {
            lines.splice(i, 1);
        }
    }
};

SimulcastUtils.prototype._compileVideoSources = function (videoSources) {
    var sb = [], ssrc, addedSSRCs = [];

    this.logger.info('Compiling video sources...');

    // Add the groups
    if (videoSources.groups && videoSources.groups.length !== 0) {
        videoSources.groups.forEach(function (group) {
            if (group.ssrcs && group.ssrcs.length !== 0) {
                sb.push([['a=ssrc-group:', group.semantics].join(''), group.ssrcs.join(' ')].join(' '));

                // if (group.semantics !== 'SIM') {
                group.ssrcs.forEach(function (ssrc) {
                    addedSSRCs.push(ssrc);
                    sb.splice.apply(sb, [sb.length, 0].concat([
                        ["a=ssrc:", ssrc, " cname:", videoSources.sources[ssrc].cname].join(''),
                        ["a=ssrc:", ssrc, " msid:", videoSources.sources[ssrc].msid].join('')]));
                });
                //}
            }
        });
    }

    // Then add any free sources.
    if (videoSources.sources) {
        for (ssrc in videoSources.sources) {
            if (addedSSRCs.indexOf(ssrc) === -1) {
                sb.splice.apply(sb, [sb.length, 0].concat([
                    ["a=ssrc:", ssrc, " cname:", videoSources.sources[ssrc].cname].join(''),
                    ["a=ssrc:", ssrc, " msid:", videoSources.sources[ssrc].msid].join('')]));
            }
        }
    }

    return sb;
};

module.exports = SimulcastUtils;
},{"./SimulcastLogger":39}],43:[function(require,module,exports){
/*jslint plusplus: true */
/*jslint nomen: true*/

var SimulcastSender = require("./SimulcastSender");
var NoSimulcastSender = SimulcastSender["no"];
var NativeSimulcastSender = SimulcastSender["native"];
var SimulcastReceiver = require("./SimulcastReceiver");
var SimulcastUtils = require("./SimulcastUtils");
var RTCEvents = require("../../service/RTC/RTCEvents");


/**
 *
 * @constructor
 */
function SimulcastManager() {

    // Create the simulcast utilities.
    this.simulcastUtils = new SimulcastUtils();

    // Create remote simulcast.
    this.simulcastReceiver = new SimulcastReceiver();

    // Initialize local simulcast.

    // TODO(gp) move into SimulcastManager.prototype.getUserMedia and take into
    // account constraints.
    if (!config.enableSimulcast) {
        this.simulcastSender = new NoSimulcastSender();
    } else {

        var isChromium = window.chrome,
            vendorName = window.navigator.vendor;
        if(isChromium !== null && isChromium !== undefined
            /* skip opera */
            && vendorName === "Google Inc."
            /* skip Chromium as suggested by fippo */
            && !window.navigator.appVersion.match(/Chromium\//) ) {
            var ver = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
            if (ver > 37) {
                this.simulcastSender = new NativeSimulcastSender();
            } else {
                this.simulcastSender = new NoSimulcastSender();
            }
        } else {
            this.simulcastSender = new NoSimulcastSender();
        }

    }
    APP.RTC.addListener(RTCEvents.SIMULCAST_LAYER_CHANGED,
        function (endpointSimulcastLayers) {
            endpointSimulcastLayers.forEach(function (esl) {
                var ssrc = esl.simulcastLayer.primarySSRC;
                simulcast._setReceivingVideoStream(esl.endpoint, ssrc);
            });
        });
    APP.RTC.addListener(RTCEvents.SIMULCAST_START, function (simulcastLayer) {
        var ssrc = simulcastLayer.primarySSRC;
        simulcast._setLocalVideoStreamEnabled(ssrc, true);
    });
    APP.RTC.addListener(RTCEvents.SIMULCAST_STOP, function (simulcastLayer) {
        var ssrc = simulcastLayer.primarySSRC;
        simulcast._setLocalVideoStreamEnabled(ssrc, false);
    });

}

/**
 * Restores the simulcast groups of the remote description. In
 * transformRemoteDescription we remove those in order for the set remote
 * description to succeed. The focus needs the signal the groups to new
 * participants.
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.reverseTransformRemoteDescription = function (desc) {
    return this.simulcastReceiver.reverseTransformRemoteDescription(desc);
};

/**
 * Removes the ssrc-group:SIM from the remote description bacause Chrome
 * either gets confused and thinks this is an FID group or, if an FID group
 * is already present, it fails to set the remote description.
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformRemoteDescription = function (desc) {
    return this.simulcastReceiver.transformRemoteDescription(desc);
};

/**
 * Gets the fully qualified msid (stream.id + track.id) associated to the
 * SSRC.
 *
 * @param ssrc
 * @returns {*}
 */
SimulcastManager.prototype.getRemoteVideoStreamIdBySSRC = function (ssrc) {
    return this.simulcastReceiver.getRemoteVideoStreamIdBySSRC(ssrc);
};

/**
 * Returns a stream with single video track, the one currently being
 * received by this endpoint.
 *
 * @param stream the remote simulcast stream.
 * @returns {webkitMediaStream}
 */
SimulcastManager.prototype.getReceivingVideoStream = function (stream) {
    return this.simulcastReceiver.getReceivingVideoStream(stream);
};

/**
 *
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformLocalDescription = function (desc) {
    return this.simulcastSender.transformLocalDescription(desc);
};

/**
 *
 * @returns {*}
 */
SimulcastManager.prototype.getLocalVideoStream = function() {
    return this.simulcastSender.getLocalVideoStream();
};

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
SimulcastManager.prototype.getUserMedia = function (constraints, success, err) {

    this.simulcastSender.getUserMedia(constraints, success, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
SimulcastManager.prototype.reverseTransformLocalDescription = function (desc) {
    return this.simulcastSender.reverseTransformLocalDescription(desc);
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformAnswer = function (desc) {
    return this.simulcastSender.transformAnswer(desc);
};

SimulcastManager.prototype.getReceivingSSRC = function (jid) {
    return this.simulcastReceiver.getReceivingSSRC(jid);
};

SimulcastManager.prototype.getReceivingVideoStreamBySSRC = function (msid) {
    return this.simulcastReceiver.getReceivingVideoStreamBySSRC(msid);
};

/**
 *
 * @param lines
 * @param mediatypes
 * @returns {*}
 */
SimulcastManager.prototype.parseMedia = function(lines, mediatypes) {
    var sb = lines.sdp.split('\r\n');
    return this.simulcastUtils.parseMedia(sb, mediatypes);
};

SimulcastManager.prototype._setReceivingVideoStream = function(resource, ssrc) {
    this.simulcastReceiver._setReceivingVideoStream(resource, ssrc);
};

SimulcastManager.prototype._setLocalVideoStreamEnabled = function(ssrc, enabled) {
    this.simulcastSender._setLocalVideoStreamEnabled(ssrc, enabled);
};

SimulcastManager.prototype.resetSender = function() {
    if (typeof this.simulcastSender.reset === 'function'){
        this.simulcastSender.reset();
    }
};

var simulcast = new SimulcastManager();

module.exports = simulcast;
},{"../../service/RTC/RTCEvents":90,"./SimulcastReceiver":40,"./SimulcastSender":41,"./SimulcastUtils":42}],44:[function(require,module,exports){
/**
 * Provides statistics for the local stream.
 */


/**
 * Size of the webaudio analizer buffer.
 * @type {number}
 */
var WEBAUDIO_ANALIZER_FFT_SIZE = 2048;

/**
 * Value of the webaudio analizer smoothing time parameter.
 * @type {number}
 */
var WEBAUDIO_ANALIZER_SMOOTING_TIME = 0.8;

/**
 * Converts time domain data array to audio level.
 * @param array the time domain data array.
 * @returns {number} the audio level
 */
function timeDomainDataToAudioLevel(samples) {

    var maxVolume = 0;

    var length = samples.length;

    for (var i = 0; i < length; i++) {
        if (maxVolume < samples[i])
            maxVolume = samples[i];
    }

    return parseFloat(((maxVolume - 127) / 128).toFixed(3));
};

/**
 * Animates audio level change
 * @param newLevel the new audio level
 * @param lastLevel the last audio level
 * @returns {Number} the audio level to be set
 */
function animateLevel(newLevel, lastLevel)
{
    var value = 0;
    var diff = lastLevel - newLevel;
    if(diff > 0.2)
    {
        value = lastLevel - 0.2;
    }
    else if(diff < -0.4)
    {
        value = lastLevel + 0.4;
    }
    else
    {
        value = newLevel;
    }

    return parseFloat(value.toFixed(3));
}


/**
 * <tt>LocalStatsCollector</tt> calculates statistics for the local stream.
 *
 * @param stream the local stream
 * @param interval stats refresh interval given in ms.
 * @param {function(LocalStatsCollector)} updateCallback the callback called on stats
 *                                   update.
 * @constructor
 */
function LocalStatsCollector(stream, interval, statisticsService, eventEmitter) {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    this.stream = stream;
    this.intervalId = null;
    this.intervalMilis = interval;
    this.eventEmitter = eventEmitter;
    this.audioLevel = 0;
    this.statisticsService = statisticsService;
}

/**
 * Starts the collecting the statistics.
 */
LocalStatsCollector.prototype.start = function () {
    if (config.disableAudioLevels || !window.AudioContext)
        return;

    var context = new AudioContext();
    var analyser = context.createAnalyser();
    analyser.smoothingTimeConstant = WEBAUDIO_ANALIZER_SMOOTING_TIME;
    analyser.fftSize = WEBAUDIO_ANALIZER_FFT_SIZE;


    var source = context.createMediaStreamSource(this.stream);
    source.connect(analyser);


    var self = this;

    this.intervalId = setInterval(
        function () {
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteTimeDomainData(array);
            var audioLevel = timeDomainDataToAudioLevel(array);
            if(audioLevel != self.audioLevel) {
                self.audioLevel = animateLevel(audioLevel, self.audioLevel);
                self.eventEmitter.emit(
                    "statistics.audioLevel",
                    self.statisticsService.LOCAL_JID,
                    self.audioLevel);
            }
        },
        this.intervalMilis
    );

};

/**
 * Stops collecting the statistics.
 */
LocalStatsCollector.prototype.stop = function () {
    if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
    }
};

module.exports = LocalStatsCollector;
},{}],45:[function(require,module,exports){
/* global ssrc2jid */
/* jshint -W117 */
var RTCBrowserType = require("../../service/RTC/RTCBrowserType");


/**
 * Calculates packet lost percent using the number of lost packets and the
 * number of all packet.
 * @param lostPackets the number of lost packets
 * @param totalPackets the number of all packets.
 * @returns {number} packet loss percent
 */
function calculatePacketLoss(lostPackets, totalPackets) {
    if(!totalPackets || totalPackets <= 0 || !lostPackets || lostPackets <= 0)
        return 0;
    return Math.round((lostPackets/totalPackets)*100);
}

function getStatValue(item, name) {
    if(!keyMap[APP.RTC.getBrowserType()][name])
        throw "The property isn't supported!";
    var key = keyMap[APP.RTC.getBrowserType()][name];
    return APP.RTC.getBrowserType() == RTCBrowserType.RTC_BROWSER_CHROME? item.stat(key) : item[key];
}

/**
 * Peer statistics data holder.
 * @constructor
 */
function PeerStats()
{
    this.ssrc2Loss = {};
    this.ssrc2AudioLevel = {};
    this.ssrc2bitrate = {};
    this.ssrc2resolution = {};
}

/**
 * The bandwidth
 * @type {{}}
 */
PeerStats.bandwidth = {};

/**
 * The bit rate
 * @type {{}}
 */
PeerStats.bitrate = {};



/**
 * The packet loss rate
 * @type {{}}
 */
PeerStats.packetLoss = null;

/**
 * Sets packets loss rate for given <tt>ssrc</tt> that blong to the peer
 * represented by this instance.
 * @param ssrc audio or video RTP stream SSRC.
 * @param lossRate new packet loss rate value to be set.
 */
PeerStats.prototype.setSsrcLoss = function (ssrc, lossRate)
{
    this.ssrc2Loss[ssrc] = lossRate;
};

/**
 * Sets resolution for given <tt>ssrc</tt> that belong to the peer
 * represented by this instance.
 * @param ssrc audio or video RTP stream SSRC.
 * @param resolution new resolution value to be set.
 */
PeerStats.prototype.setSsrcResolution = function (ssrc, resolution)
{
    if(resolution === null && this.ssrc2resolution[ssrc])
    {
        delete this.ssrc2resolution[ssrc];
    }
    else if(resolution !== null)
        this.ssrc2resolution[ssrc] = resolution;
};

/**
 * Sets the bit rate for given <tt>ssrc</tt> that blong to the peer
 * represented by this instance.
 * @param ssrc audio or video RTP stream SSRC.
 * @param bitrate new bitrate value to be set.
 */
PeerStats.prototype.setSsrcBitrate = function (ssrc, bitrate)
{
    if(this.ssrc2bitrate[ssrc])
    {
        this.ssrc2bitrate[ssrc].download += bitrate.download;
        this.ssrc2bitrate[ssrc].upload += bitrate.upload;
    }
    else {
        this.ssrc2bitrate[ssrc] = bitrate;
    }
};

/**
 * Sets new audio level(input or output) for given <tt>ssrc</tt> that identifies
 * the stream which belongs to the peer represented by this instance.
 * @param ssrc RTP stream SSRC for which current audio level value will be
 *        updated.
 * @param audioLevel the new audio level value to be set. Value is truncated to
 *        fit the range from 0 to 1.
 */
PeerStats.prototype.setSsrcAudioLevel = function (ssrc, audioLevel)
{
    // Range limit 0 - 1
    this.ssrc2AudioLevel[ssrc] = formatAudioLevel(audioLevel);
};

function formatAudioLevel(audioLevel) {
    return Math.min(Math.max(audioLevel, 0), 1);
}

/**
 * Array with the transport information.
 * @type {Array}
 */
PeerStats.transport = [];


/**
 * <tt>StatsCollector</tt> registers for stats updates of given
 * <tt>peerconnection</tt> in given <tt>interval</tt>. On each update particular
 * stats are extracted and put in {@link PeerStats} objects. Once the processing
 * is done <tt>audioLevelsUpdateCallback</tt> is called with <tt>this</tt>
 * instance as an event source.
 *
 * @param peerconnection webRTC peer connection object.
 * @param interval stats refresh interval given in ms.
 * @param {function(StatsCollector)} audioLevelsUpdateCallback the callback
 * called on stats update.
 * @constructor
 */
function StatsCollector(peerconnection, audioLevelsInterval, statsInterval, eventEmitter)
{
    this.peerconnection = peerconnection;
    this.baselineAudioLevelsReport = null;
    this.currentAudioLevelsReport = null;
    this.currentStatsReport = null;
    this.baselineStatsReport = null;
    this.audioLevelsIntervalId = null;
    this.eventEmitter = eventEmitter;

    /**
     * Gather PeerConnection stats once every this many milliseconds.
     */
    this.GATHER_INTERVAL = 15000;

    /**
     * Log stats via the focus once every this many milliseconds.
     */
    this.LOG_INTERVAL = 60000;

    /**
     * Gather stats and store them in this.statsToBeLogged.
     */
    this.gatherStatsIntervalId = null;

    /**
     * Send the stats already saved in this.statsToBeLogged to be logged via
     * the focus.
     */
    this.logStatsIntervalId = null;

    /**
     * Stores the statistics which will be send to the focus to be logged.
     */
    this.statsToBeLogged =
    {
        timestamps: [],
        stats: {}
    };

    // Updates stats interval
    this.audioLevelsIntervalMilis = audioLevelsInterval;

    this.statsIntervalId = null;
    this.statsIntervalMilis = statsInterval;
    // Map of jids to PeerStats
    this.jid2stats = {};
}

module.exports = StatsCollector;

/**
 * Stops stats updates.
 */
StatsCollector.prototype.stop = function () {
    if (this.audioLevelsIntervalId) {
        clearInterval(this.audioLevelsIntervalId);
        this.audioLevelsIntervalId = null;
    }

    if (this.statsIntervalId)
    {
        clearInterval(this.statsIntervalId);
        this.statsIntervalId = null;
    }

    if(this.logStatsIntervalId)
    {
        clearInterval(this.logStatsIntervalId);
        this.logStatsIntervalId = null;
    }

    if(this.gatherStatsIntervalId)
    {
        clearInterval(this.gatherStatsIntervalId);
        this.gatherStatsIntervalId = null;
    }
};

/**
 * Callback passed to <tt>getStats</tt> method.
 * @param error an error that occurred on <tt>getStats</tt> call.
 */
StatsCollector.prototype.errorCallback = function (error)
{
    console.error("Get stats error", error);
    this.stop();
};

/**
 * Starts stats updates.
 */
StatsCollector.prototype.start = function ()
{
    var self = this;
    if(!config.disableAudioLevels) {
        this.audioLevelsIntervalId = setInterval(
            function () {
                // Interval updates
                self.peerconnection.getStats(
                    function (report) {
                        var results = null;
                        if (!report || !report.result ||
                            typeof report.result != 'function') {
                            results = report;
                        }
                        else {
                            results = report.result();
                        }
                        //console.error("Got interval report", results);
                        self.currentAudioLevelsReport = results;
                        self.processAudioLevelReport();
                        self.baselineAudioLevelsReport =
                            self.currentAudioLevelsReport;
                    },
                    self.errorCallback
                );
            },
            self.audioLevelsIntervalMilis
        );
    }

    if(!config.disableStats) {
        this.statsIntervalId = setInterval(
            function () {
                // Interval updates
                self.peerconnection.getStats(
                    function (report) {
                        var results = null;
                        if (!report || !report.result ||
                            typeof report.result != 'function') {
                            //firefox
                            results = report;
                        }
                        else {
                            //chrome
                            results = report.result();
                        }
                        //console.error("Got interval report", results);
                        self.currentStatsReport = results;
                        try {
                            self.processStatsReport();
                        }
                        catch (e) {
                            console.error("Unsupported key:" + e, e);
                        }

                        self.baselineStatsReport = self.currentStatsReport;
                    },
                    self.errorCallback
                );
            },
            self.statsIntervalMilis
        );
    }

    if (config.logStats) {
        this.gatherStatsIntervalId = setInterval(
            function () {
                self.peerconnection.getStats(
                    function (report) {
                        self.addStatsToBeLogged(report.result());
                    },
                    function () {
                    }
                );
            },
            this.GATHER_INTERVAL
        );

        this.logStatsIntervalId = setInterval(
            function() { self.logStats(); },
            this.LOG_INTERVAL);
    }
};

/**
 * Checks whether a certain record should be included in the logged statistics.
 */
function acceptStat(reportId, reportType, statName) {
    if (reportType == "googCandidatePair" && statName == "googChannelId")
        return false;

    if (reportType == "ssrc") {
        if (statName == "googTrackId" ||
            statName == "transportId" ||
            statName == "ssrc")
            return false;
    }

    return true;
}

/**
 * Checks whether a certain record should be included in the logged statistics.
 */
function acceptReport(id, type) {
    if (id.substring(0, 15) == "googCertificate" ||
        id.substring(0, 9) == "googTrack" ||
        id.substring(0, 20) == "googLibjingleSession")
        return false;

    if (type == "googComponent")
        return false;

    return true;
}

/**
 * Converts the stats to the format used for logging, and saves the data in
 * this.statsToBeLogged.
 * @param reports Reports as given by webkitRTCPerConnection.getStats.
 */
StatsCollector.prototype.addStatsToBeLogged = function (reports) {
    var self = this;
    var num_records = this.statsToBeLogged.timestamps.length;
    this.statsToBeLogged.timestamps.push(new Date().getTime());
    reports.map(function (report) {
        if (!acceptReport(report.id, report.type))
            return;
        var stat = self.statsToBeLogged.stats[report.id];
        if (!stat) {
            stat = self.statsToBeLogged.stats[report.id] = {};
        }
        stat.type = report.type;
        report.names().map(function (name) {
            if (!acceptStat(report.id, report.type, name))
                return;
            var values = stat[name];
            if (!values) {
                values = stat[name] = [];
            }
            while (values.length < num_records) {
                values.push(null);
            }
            values.push(report.stat(name));
        });
    });
};

StatsCollector.prototype.logStats = function () {

    if(!APP.xmpp.sendLogs(this.statsToBeLogged))
        return;
    // Reset the stats
    this.statsToBeLogged.stats = {};
    this.statsToBeLogged.timestamps = [];
};
var keyMap = {};
keyMap[RTCBrowserType.RTC_BROWSER_FIREFOX] = {
    "ssrc": "ssrc",
    "packetsReceived": "packetsReceived",
    "packetsLost": "packetsLost",
    "packetsSent": "packetsSent",
    "bytesReceived": "bytesReceived",
    "bytesSent": "bytesSent"
};
keyMap[RTCBrowserType.RTC_BROWSER_CHROME] = {
    "receiveBandwidth": "googAvailableReceiveBandwidth",
    "sendBandwidth": "googAvailableSendBandwidth",
    "remoteAddress": "googRemoteAddress",
    "transportType": "googTransportType",
    "localAddress": "googLocalAddress",
    "activeConnection": "googActiveConnection",
    "ssrc": "ssrc",
    "packetsReceived": "packetsReceived",
    "packetsSent": "packetsSent",
    "packetsLost": "packetsLost",
    "bytesReceived": "bytesReceived",
    "bytesSent": "bytesSent",
    "googFrameHeightReceived": "googFrameHeightReceived",
    "googFrameWidthReceived": "googFrameWidthReceived",
    "googFrameHeightSent": "googFrameHeightSent",
    "googFrameWidthSent": "googFrameWidthSent",
    "audioInputLevel": "audioInputLevel",
    "audioOutputLevel": "audioOutputLevel"
};


/**
 * Stats processing logic.
 */
StatsCollector.prototype.processStatsReport = function () {
    if (!this.baselineStatsReport) {
        return;
    }

    for (var idx in this.currentStatsReport) {
        var now = this.currentStatsReport[idx];
        try {
            if (getStatValue(now, 'receiveBandwidth') ||
                getStatValue(now, 'sendBandwidth')) {
                PeerStats.bandwidth = {
                    "download": Math.round(
                            (getStatValue(now, 'receiveBandwidth')) / 1000),
                    "upload": Math.round(
                            (getStatValue(now, 'sendBandwidth')) / 1000)
                };
            }
        }
        catch(e){/*not supported*/}

        if(now.type == 'googCandidatePair')
        {
            var ip, type, localIP, active;
            try {
                ip = getStatValue(now, 'remoteAddress');
                type = getStatValue(now, "transportType");
                localIP = getStatValue(now, "localAddress");
                active = getStatValue(now, "activeConnection");
            }
            catch(e){/*not supported*/}
            if(!ip || !type || !localIP || active != "true")
                continue;
            var addressSaved = false;
            for(var i = 0; i < PeerStats.transport.length; i++)
            {
                if(PeerStats.transport[i].ip == ip &&
                    PeerStats.transport[i].type == type &&
                    PeerStats.transport[i].localip == localIP)
                {
                    addressSaved = true;
                }
            }
            if(addressSaved)
                continue;
            PeerStats.transport.push({localip: localIP, ip: ip, type: type});
            continue;
        }

        if(now.type == "candidatepair")
        {
            if(now.state == "succeeded")
                continue;

            var local = this.currentStatsReport[now.localCandidateId];
            var remote = this.currentStatsReport[now.remoteCandidateId];
            PeerStats.transport.push({localip: local.ipAddress + ":" + local.portNumber,
                ip: remote.ipAddress + ":" + remote.portNumber, type: local.transport});

        }

        if (now.type != 'ssrc' && now.type != "outboundrtp" &&
            now.type != "inboundrtp") {
            continue;
        }

        var before = this.baselineStatsReport[idx];
        if (!before) {
            console.warn(getStatValue(now, 'ssrc') + ' not enough data');
            continue;
        }

        var ssrc = getStatValue(now, 'ssrc');
        if(!ssrc)
            continue;
        var jid = APP.xmpp.getJidFromSSRC(ssrc);
        if (!jid && (Date.now() - now.timestamp) < 3000) {
            console.warn("No jid for ssrc: " + ssrc);
            continue;
        }

        var jidStats = this.jid2stats[jid];
        if (!jidStats) {
            jidStats = new PeerStats();
            this.jid2stats[jid] = jidStats;
        }


        var isDownloadStream = true;
        var key = 'packetsReceived';
        if (!getStatValue(now, key))
        {
            isDownloadStream = false;
            key = 'packetsSent';
            if (!getStatValue(now, key))
            {
                console.warn("No packetsReceived nor packetSent stat found");
                continue;
            }
        }
        var packetsNow = getStatValue(now, key);
        if(!packetsNow || packetsNow < 0)
            packetsNow = 0;

        var packetsBefore = getStatValue(before, key);
        if(!packetsBefore || packetsBefore < 0)
            packetsBefore = 0;
        var packetRate = packetsNow - packetsBefore;
        if(!packetRate || packetRate < 0)
            packetRate = 0;
        var currentLoss = getStatValue(now, 'packetsLost');
        if(!currentLoss || currentLoss < 0)
            currentLoss = 0;
        var previousLoss = getStatValue(before, 'packetsLost');
        if(!previousLoss || previousLoss < 0)
            previousLoss = 0;
        var lossRate = currentLoss - previousLoss;
        if(!lossRate || lossRate < 0)
            lossRate = 0;
        var packetsTotal = (packetRate + lossRate);

        jidStats.setSsrcLoss(ssrc,
            {"packetsTotal": packetsTotal,
                "packetsLost": lossRate,
                "isDownloadStream": isDownloadStream});


        var bytesReceived = 0, bytesSent = 0;
        if(getStatValue(now, "bytesReceived"))
        {
            bytesReceived = getStatValue(now, "bytesReceived") -
                getStatValue(before, "bytesReceived");
        }

        if(getStatValue(now, "bytesSent"))
        {
            bytesSent = getStatValue(now, "bytesSent") -
                getStatValue(before, "bytesSent");
        }

        var time = Math.round((now.timestamp - before.timestamp) / 1000);
        if(bytesReceived <= 0 || time <= 0)
        {
            bytesReceived = 0;
        }
        else
        {
            bytesReceived = Math.round(((bytesReceived * 8) / time) / 1000);
        }

        if(bytesSent <= 0 || time <= 0)
        {
            bytesSent = 0;
        }
        else
        {
            bytesSent = Math.round(((bytesSent * 8) / time) / 1000);
        }

        jidStats.setSsrcBitrate(ssrc, {
            "download": bytesReceived,
            "upload": bytesSent});

        var resolution = {height: null, width: null};
        try {
            if (getStatValue(now, "googFrameHeightReceived") &&
                getStatValue(now, "googFrameWidthReceived")) {
                resolution.height = getStatValue(now, "googFrameHeightReceived");
                resolution.width = getStatValue(now, "googFrameWidthReceived");
            }
            else if (getStatValue(now, "googFrameHeightSent") &&
                getStatValue(now, "googFrameWidthSent")) {
                resolution.height = getStatValue(now, "googFrameHeightSent");
                resolution.width = getStatValue(now, "googFrameWidthSent");
            }
        }
        catch(e){/*not supported*/}

        if(resolution.height && resolution.width)
        {
            jidStats.setSsrcResolution(ssrc, resolution);
        }
        else
        {
            jidStats.setSsrcResolution(ssrc, null);
        }


    }

    var self = this;
    // Jid stats
    var totalPackets = {download: 0, upload: 0};
    var lostPackets = {download: 0, upload: 0};
    var bitrateDownload = 0;
    var bitrateUpload = 0;
    var resolutions = {};
    Object.keys(this.jid2stats).forEach(
        function (jid)
        {
            Object.keys(self.jid2stats[jid].ssrc2Loss).forEach(
                function (ssrc)
                {
                    var type = "upload";
                    if(self.jid2stats[jid].ssrc2Loss[ssrc].isDownloadStream)
                        type = "download";
                    totalPackets[type] +=
                        self.jid2stats[jid].ssrc2Loss[ssrc].packetsTotal;
                    lostPackets[type] +=
                        self.jid2stats[jid].ssrc2Loss[ssrc].packetsLost;
                }
            );
            Object.keys(self.jid2stats[jid].ssrc2bitrate).forEach(
                function (ssrc) {
                    bitrateDownload +=
                        self.jid2stats[jid].ssrc2bitrate[ssrc].download;
                    bitrateUpload +=
                        self.jid2stats[jid].ssrc2bitrate[ssrc].upload;

                    delete self.jid2stats[jid].ssrc2bitrate[ssrc];
                }
            );
            resolutions[jid] = self.jid2stats[jid].ssrc2resolution;
        }
    );

    PeerStats.bitrate = {"upload": bitrateUpload, "download": bitrateDownload};

    PeerStats.packetLoss = {
        total:
            calculatePacketLoss(lostPackets.download + lostPackets.upload,
                    totalPackets.download + totalPackets.upload),
        download:
            calculatePacketLoss(lostPackets.download, totalPackets.download),
        upload:
            calculatePacketLoss(lostPackets.upload, totalPackets.upload)
    };
    this.eventEmitter.emit("statistics.connectionstats",
        {
            "bitrate": PeerStats.bitrate,
            "packetLoss": PeerStats.packetLoss,
            "bandwidth": PeerStats.bandwidth,
            "resolution": resolutions,
            "transport": PeerStats.transport
        });
    PeerStats.transport = [];

};

/**
 * Stats processing logic.
 */
StatsCollector.prototype.processAudioLevelReport = function ()
{
    if (!this.baselineAudioLevelsReport)
    {
        return;
    }

    for (var idx in this.currentAudioLevelsReport)
    {
        var now = this.currentAudioLevelsReport[idx];

        if (now.type != 'ssrc')
        {
            continue;
        }

        var before = this.baselineAudioLevelsReport[idx];
        if (!before)
        {
            console.warn(getStatValue(now, 'ssrc') + ' not enough data');
            continue;
        }

        var ssrc = getStatValue(now, 'ssrc');
        var jid = APP.xmpp.getJidFromSSRC(ssrc);
        if (!jid && (Date.now() - now.timestamp) < 3000)
        {
            console.warn("No jid for ssrc: " + ssrc);
            continue;
        }

        var jidStats = this.jid2stats[jid];
        if (!jidStats)
        {
            jidStats = new PeerStats();
            this.jid2stats[jid] = jidStats;
        }

        // Audio level
        var audioLevel = null;

        try {
            audioLevel = getStatValue(now, 'audioInputLevel');
            if (!audioLevel)
                audioLevel = getStatValue(now, 'audioOutputLevel');
        }
        catch(e) {/*not supported*/
            console.warn("Audio Levels are not available in the statistics.");
            clearInterval(this.audioLevelsIntervalId);
            return;
        }

        if (audioLevel)
        {
            // TODO: can't find specs about what this value really is,
            // but it seems to vary between 0 and around 32k.
            audioLevel = audioLevel / 32767;
            jidStats.setSsrcAudioLevel(ssrc, audioLevel);
            if(jid != APP.xmpp.myJid())
                this.eventEmitter.emit("statistics.audioLevel", jid, audioLevel);
        }

    }


};

},{"../../service/RTC/RTCBrowserType":89}],46:[function(require,module,exports){
/**
 * Created by hristo on 8/4/14.
 */
var LocalStats = require("./LocalStatsCollector.js");
var RTPStats = require("./RTPStatsCollector.js");
var EventEmitter = require("events");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");

var eventEmitter = new EventEmitter();

var localStats = null;

var rtpStats = null;

function stopLocal()
{
    if(localStats)
    {
        localStats.stop();
        localStats = null;
    }
}

function stopRemote()
{
    if(rtpStats)
    {
        rtpStats.stop();
        eventEmitter.emit("statistics.stop");
        rtpStats = null;
    }
}

function startRemoteStats (peerconnection) {
    if(rtpStats)
    {
        rtpStats.stop();
        rtpStats = null;
    }

    rtpStats = new RTPStats(peerconnection, 200, 2000, eventEmitter);
    rtpStats.start();
}

function onStreamCreated(stream)
{
    if(stream.getOriginalStream().getAudioTracks().length === 0)
        return;

    localStats = new LocalStats(stream.getOriginalStream(), 200, statistics,
        eventEmitter);
    localStats.start();
}

function onDisposeConference(onUnload) {
    stopRemote();
    if(onUnload) {
        stopLocal();
        eventEmitter.removeAllListeners();
    }
}


var statistics =
{
    /**
     * Indicates that this audio level is for local jid.
     * @type {string}
     */
    LOCAL_JID: 'local',

    addAudioLevelListener: function(listener)
    {
        eventEmitter.on("statistics.audioLevel", listener);
    },

    removeAudioLevelListener: function(listener)
    {
        eventEmitter.removeListener("statistics.audioLevel", listener);
    },

    addConnectionStatsListener: function(listener)
    {
        eventEmitter.on("statistics.connectionstats", listener);
    },

    removeConnectionStatsListener: function(listener)
    {
        eventEmitter.removeListener("statistics.connectionstats", listener);
    },


    addRemoteStatsStopListener: function(listener)
    {
        eventEmitter.on("statistics.stop", listener);
    },

    removeRemoteStatsStopListener: function(listener)
    {
        eventEmitter.removeListener("statistics.stop", listener);
    },

    stop: function () {
        stopLocal();
        stopRemote();
        if(eventEmitter)
        {
            eventEmitter.removeAllListeners();
        }
    },

    stopRemoteStatistics: function()
    {
        stopRemote();
    },

    start: function () {
        APP.RTC.addStreamListener(onStreamCreated,
            StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
        APP.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE, onDisposeConference);
        APP.xmpp.addListener(XMPPEvents.CALL_INCOMING, function (event) {
            startRemoteStats(event.peerconnection);
        });
    }

};




module.exports = statistics;
},{"../../service/RTC/StreamEventTypes.js":92,"../../service/xmpp/XMPPEvents":98,"./LocalStatsCollector.js":44,"./RTPStatsCollector.js":45,"events":62}],47:[function(require,module,exports){
var i18n = require("i18next-client");
var languages = require("../../service/translation/languages");
var Settings = require("../settings/Settings");
var DEFAULT_LANG = languages.EN;

i18n.addPostProcessor("resolveAppName", function(value, key, options) {
    return value.replace("__app__", interfaceConfig.APP_NAME);
});



var defaultOptions = {
    detectLngQS: "lang",
    useCookie: false,
    fallbackLng: DEFAULT_LANG,
    load: "unspecific",
    resGetPath: 'lang/__ns__-__lng__.json',
    ns: {
        namespaces: ['main', 'languages'],
        defaultNs: 'main'
    },
    lngWhitelist : languages.getLanguages(),
    fallbackOnNull: true,
    fallbackOnEmpty: true,
    useDataAttrOptions: true,
    defaultValueFromContent: false,
    app: interfaceConfig.APP_NAME,
    getAsync: false,
    defaultValueFromContent: false,
    customLoad: function(lng, ns, options, done) {
        var resPath = "lang/__ns__-__lng__.json";
        if(lng === languages.EN)
            resPath = "lang/__ns__.json";
        var url = i18n.functions.applyReplacement(resPath, { lng: lng, ns: ns });
        i18n.functions.ajax({
            url: url,
            success: function(data, status, xhr) {
                i18n.functions.log('loaded: ' + url);
                done(null, data);
            },
            error : function(xhr, status, error) {
                if ((status && status == 200) ||
                    (xhr && xhr.status && xhr.status == 200)) {
                    // file loaded but invalid json, stop waste time !
                    i18n.functions.error('There is a typo in: ' + url);
                } else if ((status && status == 404) ||
                    (xhr && xhr.status && xhr.status == 404)) {
                    i18n.functions.log('Does not exist: ' + url);
                } else {
                    var theStatus = status ? status :
                        ((xhr && xhr.status) ? xhr.status : null);
                    i18n.functions.log(theStatus + ' when loading ' + url);
                }

                done(error, {});
            },
            dataType: "json",
            async : options.getAsync
        });
    }
    //              options for caching
//                useLocalStorage: true,
//                localStorageExpirationTime: 86400000 // in ms, default 1 week
};

function initCompleted(t)
{
    $("[data-i18n]").i18n();
}

function checkForParameter() {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == "lang")
        {
            return pair[1];
        }
    }
    return null;
}

module.exports = {
    init: function (lang) {
        var options = defaultOptions;


        if(!lang)
        {
            lang = checkForParameter();
            if(!lang)
            {
                var settings = Settings.getSettings();
                if(settings)
                    lang = settings.language;
            }
        }

        if(lang) {
            options.lng = lang;
        }

        i18n.init(options, initCompleted);
    },
    translateString: function (key, options) {
        return i18n.t(key, options);
    },
    setLanguage: function (lang) {
        if(!lang)
            lang = DEFAULT_LANG;
        i18n.setLng(lang, defaultOptions, initCompleted);
    },
    getCurrentLanguage: function () {
        return i18n.lng();
    },
    translateElement: function (selector) {
        selector.i18n();
    },
    generateTranslatonHTML: function (key, options) {
        var str = "<span data-i18n=\"" + key + "\"";
        if(options)
        {
            str += " data-i18n-options=\"" + JSON.stringify(options) + "\"";
        }
        str += ">";
        str += this.translateString(key, options);
        str += "</span>";
        return str;

    }
};

},{"../../service/translation/languages":97,"../settings/Settings":38,"i18next-client":63}],48:[function(require,module,exports){
/* jshint -W117 */
var TraceablePeerConnection = require("./TraceablePeerConnection");
var SDPDiffer = require("./SDPDiffer");
var SDPUtil = require("./SDPUtil");
var SDP = require("./SDP");
var RTCBrowserType = require("../../service/RTC/RTCBrowserType");

// Jingle stuff
function JingleSession(me, sid, connection, service) {
    this.me = me;
    this.sid = sid;
    this.connection = connection;
    this.initiator = null;
    this.responder = null;
    this.isInitiator = null;
    this.peerjid = null;
    this.state = null;
    this.localSDP = null;
    this.remoteSDP = null;
    this.relayedStreams = [];
    this.startTime = null;
    this.stopTime = null;
    this.media_constraints = null;
    this.pc_constraints = null;
    this.ice_config = {};
    this.drip_container = [];
    this.service = service;

    this.usetrickle = true;
    this.usepranswer = false; // early transport warmup -- mind you, this might fail. depends on webrtc issue 1718
    this.usedrip = false; // dripping is sending trickle candidates not one-by-one

    this.hadstuncandidate = false;
    this.hadturncandidate = false;
    this.lasticecandidate = false;

    this.statsinterval = null;

    this.reason = null;

    this.addssrc = [];
    this.removessrc = [];
    this.pendingop = null;
    this.switchstreams = false;

    this.wait = true;
    this.localStreamsSSRC = null;

    /**
     * The indicator which determines whether the (local) video has been muted
     * in response to a user command in contrast to an automatic decision made
     * by the application logic.
     */
    this.videoMuteByUser = false;
}

//TODO: this array must be removed when firefox implement multistream support
JingleSession.notReceivedSSRCs = [];

JingleSession.prototype.initiate = function (peerjid, isInitiator) {
    var self = this;
    if (this.state !== null) {
        console.error('attempt to initiate on session ' + this.sid +
            'in state ' + this.state);
        return;
    }
    this.isInitiator = isInitiator;
    this.state = 'pending';
    this.initiator = isInitiator ? this.me : peerjid;
    this.responder = !isInitiator ? this.me : peerjid;
    this.peerjid = peerjid;
    this.hadstuncandidate = false;
    this.hadturncandidate = false;
    this.lasticecandidate = false;

    this.peerconnection
        = new TraceablePeerConnection(
            this.connection.jingle.ice_config,
            this.connection.jingle.pc_constraints );

    this.peerconnection.onicecandidate = function (event) {
        self.sendIceCandidate(event.candidate);
    };
    this.peerconnection.onaddstream = function (event) {
        console.log("REMOTE STREAM ADDED: " + event.stream + " - " + event.stream.id);
        self.remoteStreamAdded(event);
    };
    this.peerconnection.onremovestream = function (event) {
        // Remove the stream from remoteStreams
        // FIXME: remotestreamremoved.jingle not defined anywhere(unused)
        $(document).trigger('remotestreamremoved.jingle', [event, self.sid]);
    };
    this.peerconnection.onsignalingstatechange = function (event) {
        if (!(self && self.peerconnection)) return;
    };
    this.peerconnection.oniceconnectionstatechange = function (event) {
        if (!(self && self.peerconnection)) return;
        switch (self.peerconnection.iceConnectionState) {
            case 'connected':
                this.startTime = new Date();
                break;
            case 'disconnected':
                this.stopTime = new Date();
                break;
        }
        onIceConnectionStateChange(self.sid, self);
    };
    // add any local and relayed stream
    APP.RTC.localStreams.forEach(function(stream) {
        self.peerconnection.addStream(stream.getOriginalStream());
    });
    this.relayedStreams.forEach(function(stream) {
        self.peerconnection.addStream(stream);
    });
};

function onIceConnectionStateChange(sid, session) {
    switch (session.peerconnection.iceConnectionState) {
        case 'checking':
            session.timeChecking = (new Date()).getTime();
            session.firstconnect = true;
            break;
        case 'completed': // on caller side
        case 'connected':
            if (session.firstconnect) {
                session.firstconnect = false;
                var metadata = {};
                metadata.setupTime
                    = (new Date()).getTime() - session.timeChecking;
                session.peerconnection.getStats(function (res) {
                    if(res && res.result) {
                        res.result().forEach(function (report) {
                            if (report.type == 'googCandidatePair' &&
                                report.stat('googActiveConnection') == 'true') {
                                metadata.localCandidateType
                                    = report.stat('googLocalCandidateType');
                                metadata.remoteCandidateType
                                    = report.stat('googRemoteCandidateType');

                                // log pair as well so we can get nice pie
                                // charts
                                metadata.candidatePair
                                    = report.stat('googLocalCandidateType') +
                                        ';' +
                                        report.stat('googRemoteCandidateType');

                                if (report.stat('googRemoteAddress').indexOf('[') === 0)
                                {
                                    metadata.ipv6 = true;
                                }
                            }
                        });
                    }
                });
            }
            break;
    }
}

JingleSession.prototype.accept = function () {
    var self = this;
    this.state = 'active';

    var pranswer = this.peerconnection.localDescription;
    if (!pranswer || pranswer.type != 'pranswer') {
        return;
    }
    console.log('going from pranswer to answer');
    if (this.usetrickle) {
        // remove candidates already sent from session-accept
        var lines = SDPUtil.find_lines(pranswer.sdp, 'a=candidate:');
        for (var i = 0; i < lines.length; i++) {
            pranswer.sdp = pranswer.sdp.replace(lines[i] + '\r\n', '');
        }
    }
    while (SDPUtil.find_line(pranswer.sdp, 'a=inactive')) {
        // FIXME: change any inactive to sendrecv or whatever they were originally
        pranswer.sdp = pranswer.sdp.replace('a=inactive', 'a=sendrecv');
    }
    pranswer = APP.simulcast.reverseTransformLocalDescription(pranswer);
    var prsdp = new SDP(pranswer.sdp);
    var accept = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-accept',
            initiator: this.initiator,
            responder: this.responder,
            sid: this.sid });
    prsdp.toJingle(accept, this.initiator == this.me ? 'initiator' : 'responder', this.localStreamsSSRC);
    var sdp = this.peerconnection.localDescription.sdp;
    while (SDPUtil.find_line(sdp, 'a=inactive')) {
        // FIXME: change any inactive to sendrecv or whatever they were originally
        sdp = sdp.replace('a=inactive', 'a=sendrecv');
    }
    var self = this;
    this.peerconnection.setLocalDescription(new RTCSessionDescription({type: 'answer', sdp: sdp}),
        function () {
            //console.log('setLocalDescription success');
            self.setLocalDescription();

            self.connection.sendIQ(accept,
                function () {
                    var ack = {};
                    ack.source = 'answer';
                    $(document).trigger('ack.jingle', [self.sid, ack]);
                },
                function (stanza) {
                    var error = ($(stanza).find('error').length) ? {
                        code: $(stanza).find('error').attr('code'),
                        reason: $(stanza).find('error :first')[0].tagName
                    }:{};
                    error.source = 'answer';
                    JingleSession.onJingleError(self.sid, error);
                },
                10000);
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
};

JingleSession.prototype.terminate = function (reason) {
    this.state = 'ended';
    this.reason = reason;
    this.peerconnection.close();
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
};

JingleSession.prototype.active = function () {
    return this.state == 'active';
};

JingleSession.prototype.sendIceCandidate = function (candidate) {
    var self = this;
    if (candidate && !this.lasticecandidate) {
        var ice = SDPUtil.iceparams(this.localSDP.media[candidate.sdpMLineIndex], this.localSDP.session);
        var jcand = SDPUtil.candidateToJingle(candidate.candidate);
        if (!(ice && jcand)) {
            console.error('failed to get ice && jcand');
            return;
        }
        ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';

        if (jcand.type === 'srflx') {
            this.hadstuncandidate = true;
        } else if (jcand.type === 'relay') {
            this.hadturncandidate = true;
        }

        if (this.usetrickle) {
            if (this.usedrip) {
                if (this.drip_container.length === 0) {
                    // start 20ms callout
                    window.setTimeout(function () {
                        if (self.drip_container.length === 0) return;
                        self.sendIceCandidates(self.drip_container);
                        self.drip_container = [];
                    }, 20);

                }
                this.drip_container.push(candidate);
                return;
            } else {
                self.sendIceCandidate([candidate]);
            }
        }
    } else {
        //console.log('sendIceCandidate: last candidate.');
        if (!this.usetrickle) {
            //console.log('should send full offer now...');
            var init = $iq({to: this.peerjid,
                type: 'set'})
                .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                    action: this.peerconnection.localDescription.type == 'offer' ? 'session-initiate' : 'session-accept',
                    initiator: this.initiator,
                    sid: this.sid});
            this.localSDP = new SDP(this.peerconnection.localDescription.sdp);
            var self = this;
            var sendJingle = function (ssrc) {
                if(!ssrc)
                    ssrc = {};
                self.localSDP.toJingle(init, self.initiator == self.me ? 'initiator' : 'responder', ssrc);
                self.connection.sendIQ(init,
                    function () {
                        //console.log('session initiate ack');
                        var ack = {};
                        ack.source = 'offer';
                        $(document).trigger('ack.jingle', [self.sid, ack]);
                    },
                    function (stanza) {
                        self.state = 'error';
                        self.peerconnection.close();
                        var error = ($(stanza).find('error').length) ? {
                            code: $(stanza).find('error').attr('code'),
                            reason: $(stanza).find('error :first')[0].tagName,
                        }:{};
                        error.source = 'offer';
                        JingleSession.onJingleError(self.sid, error);
                    },
                    10000);
            }
            sendJingle();
        }
        this.lasticecandidate = true;
        console.log('Have we encountered any srflx candidates? ' + this.hadstuncandidate);
        console.log('Have we encountered any relay candidates? ' + this.hadturncandidate);

        if (!(this.hadstuncandidate || this.hadturncandidate) && this.peerconnection.signalingState != 'closed') {
            $(document).trigger('nostuncandidates.jingle', [this.sid]);
        }
    }
};

JingleSession.prototype.sendIceCandidates = function (candidates) {
    console.log('sendIceCandidates', candidates);
    var cand = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'transport-info',
            initiator: this.initiator,
            sid: this.sid});
    for (var mid = 0; mid < this.localSDP.media.length; mid++) {
        var cands = candidates.filter(function (el) { return el.sdpMLineIndex == mid; });
        var mline = SDPUtil.parse_mline(this.localSDP.media[mid].split('\r\n')[0]);
        if (cands.length > 0) {
            var ice = SDPUtil.iceparams(this.localSDP.media[mid], this.localSDP.session);
            ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
            cand.c('content', {creator: this.initiator == this.me ? 'initiator' : 'responder',
                name: (cands[0].sdpMid? cands[0].sdpMid : mline.media)
            }).c('transport', ice);
            for (var i = 0; i < cands.length; i++) {
                cand.c('candidate', SDPUtil.candidateToJingle(cands[i].candidate)).up();
            }
            // add fingerprint
            if (SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session)) {
                var tmp = SDPUtil.parse_fingerprint(SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session));
                tmp.required = true;
                cand.c(
                    'fingerprint',
                    {xmlns: 'urn:xmpp:jingle:apps:dtls:0'})
                    .t(tmp.fingerprint);
                delete tmp.fingerprint;
                cand.attrs(tmp);
                cand.up();
            }
            cand.up(); // transport
            cand.up(); // content
        }
    }
    // might merge last-candidate notification into this, but it is called alot later. See webrtc issue #2340
    //console.log('was this the last candidate', this.lasticecandidate);
    this.connection.sendIQ(cand,
        function () {
            var ack = {};
            ack.source = 'transportinfo';
            $(document).trigger('ack.jingle', [this.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            error.source = 'transportinfo';
            JingleSession.onJingleError(this.sid, error);
        },
        10000);
};


JingleSession.prototype.sendOffer = function () {
    //console.log('sendOffer...');
    var self = this;
    this.peerconnection.createOffer(function (sdp) {
            self.createdOffer(sdp);
        },
        function (e) {
            console.error('createOffer failed', e);
        },
        this.media_constraints
    );
};

JingleSession.prototype.createdOffer = function (sdp) {
    //console.log('createdOffer', sdp);
    var self = this;
    this.localSDP = new SDP(sdp.sdp);
    //this.localSDP.mangle();
    var sendJingle = function () {
        var init = $iq({to: this.peerjid,
            type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                action: 'session-initiate',
                initiator: this.initiator,
                sid: this.sid});
        self.localSDP.toJingle(init, this.initiator == this.me ? 'initiator' : 'responder', this.localStreamsSSRC);
        self.connection.sendIQ(init,
            function () {
                var ack = {};
                ack.source = 'offer';
                $(document).trigger('ack.jingle', [self.sid, ack]);
            },
            function (stanza) {
                self.state = 'error';
                self.peerconnection.close();
                var error = ($(stanza).find('error').length) ? {
                    code: $(stanza).find('error').attr('code'),
                    reason: $(stanza).find('error :first')[0].tagName,
                }:{};
                error.source = 'offer';
                JingleSession.onJingleError(self.sid, error);
            },
            10000);
    }
    sdp.sdp = this.localSDP.raw;
    this.peerconnection.setLocalDescription(sdp,
        function () {
            if(self.usetrickle)
            {
                sendJingle();
            }
            self.setLocalDescription();
            //console.log('setLocalDescription success');
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
    var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
    for (var i = 0; i < cands.length; i++) {
        var cand = SDPUtil.parse_icecandidate(cands[i]);
        if (cand.type == 'srflx') {
            this.hadstuncandidate = true;
        } else if (cand.type == 'relay') {
            this.hadturncandidate = true;
        }
    }
};

JingleSession.prototype.setRemoteDescription = function (elem, desctype) {
    //console.log('setting remote description... ', desctype);
    this.remoteSDP = new SDP('');
    this.remoteSDP.fromJingle(elem);
    if (this.peerconnection.remoteDescription !== null) {
        console.log('setRemoteDescription when remote description is not null, should be pranswer', this.peerconnection.remoteDescription);
        if (this.peerconnection.remoteDescription.type == 'pranswer') {
            var pranswer = new SDP(this.peerconnection.remoteDescription.sdp);
            for (var i = 0; i < pranswer.media.length; i++) {
                // make sure we have ice ufrag and pwd
                if (!SDPUtil.find_line(this.remoteSDP.media[i], 'a=ice-ufrag:', this.remoteSDP.session)) {
                    if (SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session)) {
                        this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session) + '\r\n';
                    } else {
                        console.warn('no ice ufrag?');
                    }
                    if (SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session)) {
                        this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session) + '\r\n';
                    } else {
                        console.warn('no ice pwd?');
                    }
                }
                // copy over candidates
                var lines = SDPUtil.find_lines(pranswer.media[i], 'a=candidate:');
                for (var j = 0; j < lines.length; j++) {
                    this.remoteSDP.media[i] += lines[j] + '\r\n';
                }
            }
            this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');
        }
    }
    var remotedesc = new RTCSessionDescription({type: desctype, sdp: this.remoteSDP.raw});

    this.peerconnection.setRemoteDescription(remotedesc,
        function () {
            //console.log('setRemoteDescription success');
        },
        function (e) {
            console.error('setRemoteDescription error', e);
            JingleSession.onJingleFatalError(self, e);
        }
    );
};

JingleSession.prototype.addIceCandidate = function (elem) {
    var self = this;
    if (this.peerconnection.signalingState == 'closed') {
        return;
    }
    if (!this.peerconnection.remoteDescription && this.peerconnection.signalingState == 'have-local-offer') {
        console.log('trickle ice candidate arriving before session accept...');
        // create a PRANSWER for setRemoteDescription
        if (!this.remoteSDP) {
            var cobbled = 'v=0\r\n' +
                'o=- ' + '1923518516' + ' 2 IN IP4 0.0.0.0\r\n' +// FIXME
                's=-\r\n' +
                't=0 0\r\n';
            // first, take some things from the local description
            for (var i = 0; i < this.localSDP.media.length; i++) {
                cobbled += SDPUtil.find_line(this.localSDP.media[i], 'm=') + '\r\n';
                cobbled += SDPUtil.find_lines(this.localSDP.media[i], 'a=rtpmap:').join('\r\n') + '\r\n';
                if (SDPUtil.find_line(this.localSDP.media[i], 'a=mid:')) {
                    cobbled += SDPUtil.find_line(this.localSDP.media[i], 'a=mid:') + '\r\n';
                }
                cobbled += 'a=inactive\r\n';
            }
            this.remoteSDP = new SDP(cobbled);
        }
        // then add things like ice and dtls from remote candidate
        elem.each(function () {
            for (var i = 0; i < self.remoteSDP.media.length; i++) {
                if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                    self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    if (!SDPUtil.find_line(self.remoteSDP.media[i], 'a=ice-ufrag:')) {
                        var tmp = $(this).find('transport');
                        self.remoteSDP.media[i] += 'a=ice-ufrag:' + tmp.attr('ufrag') + '\r\n';
                        self.remoteSDP.media[i] += 'a=ice-pwd:' + tmp.attr('pwd') + '\r\n';
                        tmp = $(this).find('transport>fingerprint');
                        if (tmp.length) {
                            self.remoteSDP.media[i] += 'a=fingerprint:' + tmp.attr('hash') + ' ' + tmp.text() + '\r\n';
                        } else {
                            console.log('no dtls fingerprint (webrtc issue #1718?)');
                            self.remoteSDP.media[i] += 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD\r\n';
                        }
                        break;
                    }
                }
            }
        });
        this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');

        // we need a complete SDP with ice-ufrag/ice-pwd in all parts
        // this makes the assumption that the PRANSWER is constructed such that the ice-ufrag is in all mediaparts
        // but it could be in the session part as well. since the code above constructs this sdp this can't happen however
        var iscomplete = this.remoteSDP.media.filter(function (mediapart) {
            return SDPUtil.find_line(mediapart, 'a=ice-ufrag:');
        }).length == this.remoteSDP.media.length;

        if (iscomplete) {
            console.log('setting pranswer');
            try {
                this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'pranswer', sdp: this.remoteSDP.raw }),
                    function() {
                    },
                    function(e) {
                        console.log('setRemoteDescription pranswer failed', e.toString());
                    });
            } catch (e) {
                console.error('setting pranswer failed', e);
            }
        } else {
            //console.log('not yet setting pranswer');
        }
    }
    // operate on each content element
    elem.each(function () {
        // would love to deactivate this, but firefox still requires it
        var idx = -1;
        var i;
        for (i = 0; i < self.remoteSDP.media.length; i++) {
            if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                idx = i;
                break;
            }
        }
        if (idx == -1) { // fall back to localdescription
            for (i = 0; i < self.localSDP.media.length; i++) {
                if (SDPUtil.find_line(self.localSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                    self.localSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    idx = i;
                    break;
                }
            }
        }
        var name = $(this).attr('name');
        // TODO: check ice-pwd and ice-ufrag?
        $(this).find('transport>candidate').each(function () {
            var line, candidate;
            line = SDPUtil.candidateFromJingle(this);
            candidate = new RTCIceCandidate({sdpMLineIndex: idx,
                sdpMid: name,
                candidate: line});
            try {
                self.peerconnection.addIceCandidate(candidate);
            } catch (e) {
                console.error('addIceCandidate failed', e.toString(), line);
            }
        });
    });
};

JingleSession.prototype.sendAnswer = function (provisional) {
    //console.log('createAnswer', provisional);
    var self = this;
    this.peerconnection.createAnswer(
        function (sdp) {
            self.createdAnswer(sdp, provisional);
        },
        function (e) {
            console.error('createAnswer failed', e);
        },
        this.media_constraints
    );
};

JingleSession.prototype.createdAnswer = function (sdp, provisional) {
    //console.log('createAnswer callback');
    var self = this;
    this.localSDP = new SDP(sdp.sdp);
    //this.localSDP.mangle();
    this.usepranswer = provisional === true;
    if (this.usetrickle) {
        if (this.usepranswer) {
            sdp.type = 'pranswer';
            for (var i = 0; i < this.localSDP.media.length; i++) {
                this.localSDP.media[i] = this.localSDP.media[i].replace('a=sendrecv\r\n', 'a=inactive\r\n');
            }
            this.localSDP.raw = this.localSDP.session + '\r\n' + this.localSDP.media.join('');
        }
    }
    var self = this;
    var sendJingle = function (ssrcs) {

                var accept = $iq({to: self.peerjid,
                    type: 'set'})
                    .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                        action: 'session-accept',
                        initiator: self.initiator,
                        responder: self.responder,
                        sid: self.sid });
                var publicLocalDesc = APP.simulcast.reverseTransformLocalDescription(sdp);
                var publicLocalSDP = new SDP(publicLocalDesc.sdp);
                publicLocalSDP.toJingle(accept, self.initiator == self.me ? 'initiator' : 'responder', ssrcs);
                self.connection.sendIQ(accept,
                    function () {
                        var ack = {};
                        ack.source = 'answer';
                        $(document).trigger('ack.jingle', [self.sid, ack]);
                    },
                    function (stanza) {
                        var error = ($(stanza).find('error').length) ? {
                            code: $(stanza).find('error').attr('code'),
                            reason: $(stanza).find('error :first')[0].tagName,
                        }:{};
                        error.source = 'answer';
                        JingleSession.onJingleError(self.sid, error);
                    },
                    10000);
    }
    sdp.sdp = this.localSDP.raw;
    this.peerconnection.setLocalDescription(sdp,
        function () {

            //console.log('setLocalDescription success');
            if (self.usetrickle && !self.usepranswer) {
                sendJingle();
            }
            self.setLocalDescription();
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
    var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
    for (var j = 0; j < cands.length; j++) {
        var cand = SDPUtil.parse_icecandidate(cands[j]);
        if (cand.type == 'srflx') {
            this.hadstuncandidate = true;
        } else if (cand.type == 'relay') {
            this.hadturncandidate = true;
        }
    }
};

JingleSession.prototype.sendTerminate = function (reason, text) {
    var self = this,
        term = $iq({to: this.peerjid,
            type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                action: 'session-terminate',
                initiator: this.initiator,
                sid: this.sid})
            .c('reason')
            .c(reason || 'success');

    if (text) {
        term.up().c('text').t(text);
    }

    this.connection.sendIQ(term,
        function () {
            self.peerconnection.close();
            self.peerconnection = null;
            self.terminate();
            var ack = {};
            ack.source = 'terminate';
            $(document).trigger('ack.jingle', [self.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            $(document).trigger('ack.jingle', [self.sid, error]);
        },
        10000);
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
};

JingleSession.prototype.addSource = function (elem, fromJid) {

    var self = this;
    // FIXME: dirty waiting
    if (!this.peerconnection.localDescription)
    {
        console.warn("addSource - localDescription not ready yet")
        setTimeout(function()
            {
                self.addSource(elem, fromJid);
            },
            200
        );
        return;
    }

    console.log('addssrc', new Date().getTime());
    console.log('ice', this.peerconnection.iceConnectionState);
    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);
    var mySdp = new SDP(this.peerconnection.localDescription.sdp);

    $(elem).each(function (idx, content) {
        var name = $(content).attr('name');
        var lines = '';
        $(content).find('ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
            var semantics = this.getAttribute('semantics');
            var ssrcs = $(this).find('>source').map(function () {
                return this.getAttribute('ssrc');
            }).get();

            if (ssrcs.length != 0) {
                lines += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
            }
        });
        var tmp = $(content).find('source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]'); // can handle both >source and >description>source
        tmp.each(function () {
            var ssrc = $(this).attr('ssrc');
            if(mySdp.containsSSRC(ssrc)){
                /**
                 * This happens when multiple participants change their streams at the same time and
                 * ColibriFocus.modifySources have to wait for stable state. In the meantime multiple
                 * addssrc are scheduled for update IQ. See
                 */
                console.warn("Got add stream request for my own ssrc: "+ssrc);
                return;
            }
            $(this).find('>parameter').each(function () {
                lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                if ($(this).attr('value') && $(this).attr('value').length)
                    lines += ':' + $(this).attr('value');
                lines += '\r\n';
            });
        });
        sdp.media.forEach(function(media, idx) {
            if (!SDPUtil.find_line(media, 'a=mid:' + name))
                return;
            sdp.media[idx] += lines;
            if (!self.addssrc[idx]) self.addssrc[idx] = '';
            self.addssrc[idx] += lines;
        });
        sdp.raw = sdp.session + sdp.media.join('');
    });
    this.modifySources();
};

JingleSession.prototype.removeSource = function (elem, fromJid) {

    var self = this;
    // FIXME: dirty waiting
    if (!this.peerconnection.localDescription)
    {
        console.warn("removeSource - localDescription not ready yet")
        setTimeout(function()
            {
                self.removeSource(elem, fromJid);
            },
            200
        );
        return;
    }

    console.log('removessrc', new Date().getTime());
    console.log('ice', this.peerconnection.iceConnectionState);
    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);
    var mySdp = new SDP(this.peerconnection.localDescription.sdp);

    $(elem).each(function (idx, content) {
        var name = $(content).attr('name');
        var lines = '';
        $(content).find('ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
            var semantics = this.getAttribute('semantics');
            var ssrcs = $(this).find('>source').map(function () {
                return this.getAttribute('ssrc');
            }).get();

            if (ssrcs.length != 0) {
                lines += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
            }
        });
        var tmp = $(content).find('source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]'); // can handle both >source and >description>source
        tmp.each(function () {
            var ssrc = $(this).attr('ssrc');
            // This should never happen, but can be useful for bug detection
            if(mySdp.containsSSRC(ssrc)){
                console.error("Got remove stream request for my own ssrc: "+ssrc);
                return;
            }
            $(this).find('>parameter').each(function () {
                lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                if ($(this).attr('value') && $(this).attr('value').length)
                    lines += ':' + $(this).attr('value');
                lines += '\r\n';
            });
        });
        sdp.media.forEach(function(media, idx) {
            if (!SDPUtil.find_line(media, 'a=mid:' + name))
                return;
            sdp.media[idx] += lines;
            if (!self.removessrc[idx]) self.removessrc[idx] = '';
            self.removessrc[idx] += lines;
        });
        sdp.raw = sdp.session + sdp.media.join('');
    });
    this.modifySources();
};

JingleSession.prototype.modifySources = function (successCallback) {
    var self = this;
    if (this.peerconnection.signalingState == 'closed') return;
    if (!(this.addssrc.length || this.removessrc.length || this.pendingop !== null || this.switchstreams)){
        // There is nothing to do since scheduled job might have been executed by another succeeding call
        this.setLocalDescription();
        if(successCallback){
            successCallback();
        }
        return;
    }

    // FIXME: this is a big hack
    // https://code.google.com/p/webrtc/issues/detail?id=2688
    // ^ has been fixed.
    if (!(this.peerconnection.signalingState == 'stable' && this.peerconnection.iceConnectionState == 'connected')) {
        console.warn('modifySources not yet', this.peerconnection.signalingState, this.peerconnection.iceConnectionState);
        this.wait = true;
        window.setTimeout(function() { self.modifySources(successCallback); }, 250);
        return;
    }
    if (this.wait) {
        window.setTimeout(function() { self.modifySources(successCallback); }, 2500);
        this.wait = false;
        return;
    }

    // Reset switch streams flag
    this.switchstreams = false;

    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

    // add sources
    this.addssrc.forEach(function(lines, idx) {
        sdp.media[idx] += lines;
    });
    this.addssrc = [];

    // remove sources
    this.removessrc.forEach(function(lines, idx) {
        lines = lines.split('\r\n');
        lines.pop(); // remove empty last element;
        lines.forEach(function(line) {
            sdp.media[idx] = sdp.media[idx].replace(line + '\r\n', '');
        });
    });
    this.removessrc = [];

    // FIXME:
    // this was a hack for the situation when only one peer exists
    // in the conference.
    // check if still required and remove
    if (sdp.media[0])
        sdp.media[0] = sdp.media[0].replace('a=recvonly', 'a=sendrecv');
    if (sdp.media[1])
        sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');

    sdp.raw = sdp.session + sdp.media.join('');
    this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'offer', sdp: sdp.raw}),
        function() {

            if(self.signalingState == 'closed') {
                console.error("createAnswer attempt on closed state");
                return;
            }

            self.peerconnection.createAnswer(
                function(modifiedAnswer) {
                    // change video direction, see https://github.com/jitsi/jitmeet/issues/41
                    if (self.pendingop !== null) {
                        var sdp = new SDP(modifiedAnswer.sdp);
                        if (sdp.media.length > 1) {
                            switch(self.pendingop) {
                                case 'mute':
                                    sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                                    break;
                                case 'unmute':
                                    sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');
                                    break;
                            }
                            sdp.raw = sdp.session + sdp.media.join('');
                            modifiedAnswer.sdp = sdp.raw;
                        }
                        self.pendingop = null;
                    }

                    // FIXME: pushing down an answer while ice connection state
                    // is still checking is bad...
                    //console.log(self.peerconnection.iceConnectionState);

                    // trying to work around another chrome bug
                    //modifiedAnswer.sdp = modifiedAnswer.sdp.replace(/a=setup:active/g, 'a=setup:actpass');
                    self.peerconnection.setLocalDescription(modifiedAnswer,
                        function() {
                            //console.log('modified setLocalDescription ok');
                            self.setLocalDescription();
                            if(successCallback){
                                successCallback();
                            }
                        },
                        function(error) {
                            console.error('modified setLocalDescription failed', error);
                        }
                    );
                },
                function(error) {
                    console.error('modified answer failed', error);
                }
            );
        },
        function(error) {
            console.error('modify failed', error);
        }
    );
};

/**
 * Switches video streams.
 * @param new_stream new stream that will be used as video of this session.
 * @param oldStream old video stream of this session.
 * @param success_callback callback executed after successful stream switch.
 */
JingleSession.prototype.switchStreams = function (new_stream, oldStream, success_callback) {

    var self = this;

    // Remember SDP to figure out added/removed SSRCs
    var oldSdp = null;
    if(self.peerconnection) {
        if(self.peerconnection.localDescription) {
            oldSdp = new SDP(self.peerconnection.localDescription.sdp);
        }
        self.peerconnection.removeStream(oldStream, true);
        self.peerconnection.addStream(new_stream);
    }

    APP.RTC.switchVideoStreams(new_stream, oldStream);

    // Conference is not active
    if(!oldSdp || !self.peerconnection) {
        success_callback();
        return;
    }

    self.switchstreams = true;
    self.modifySources(function() {
        console.log('modify sources done');

        success_callback();

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        console.log("SDPs", oldSdp, newSdp);
        self.notifyMySSRCUpdate(oldSdp, newSdp);
    });
};

/**
 * Figures out added/removed ssrcs and send update IQs.
 * @param old_sdp SDP object for old description.
 * @param new_sdp SDP object for new description.
 */
JingleSession.prototype.notifyMySSRCUpdate = function (old_sdp, new_sdp) {

    if (!(this.peerconnection.signalingState == 'stable' &&
        this.peerconnection.iceConnectionState == 'connected')){
        console.log("Too early to send updates");
        return;
    }

    // send source-remove IQ.
    sdpDiffer = new SDPDiffer(new_sdp, old_sdp);
    var remove = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {
            xmlns: 'urn:xmpp:jingle:1',
            action: 'source-remove',
            initiator: this.initiator,
            sid: this.sid
        }
    );
    var removed = sdpDiffer.toJingle(remove);
    if (removed) {
        this.connection.sendIQ(remove,
            function (res) {
                console.info('got remove result', res);
            },
            function (err) {
                console.error('got remove error', err);
            }
        );
    } else {
        console.log('removal not necessary');
    }

    // send source-add IQ.
    var sdpDiffer = new SDPDiffer(old_sdp, new_sdp);
    var add = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {
            xmlns: 'urn:xmpp:jingle:1',
            action: 'source-add',
            initiator: this.initiator,
            sid: this.sid
        }
    );
    var added = sdpDiffer.toJingle(add);
    if (added) {
        this.connection.sendIQ(add,
            function (res) {
                console.info('got add result', res);
            },
            function (err) {
                console.error('got add error', err);
            }
        );
    } else {
        console.log('addition not necessary');
    }
};

/**
 * Determines whether the (local) video is mute i.e. all video tracks are
 * disabled.
 *
 * @return <tt>true</tt> if the (local) video is mute i.e. all video tracks are
 * disabled; otherwise, <tt>false</tt>
 */
JingleSession.prototype.isVideoMute = function () {
    var tracks = APP.RTC.localVideo.getVideoTracks();
    var mute = true;

    for (var i = 0; i < tracks.length; ++i) {
        if (tracks[i].enabled) {
            mute = false;
            break;
        }
    }
    return mute;
};

/**
 * Mutes/unmutes the (local) video i.e. enables/disables all video tracks.
 *
 * @param mute <tt>true</tt> to mute the (local) video i.e. to disable all video
 * tracks; otherwise, <tt>false</tt>
 * @param callback a function to be invoked with <tt>mute</tt> after all video
 * tracks have been enabled/disabled. The function may, optionally, return
 * another function which is to be invoked after the whole mute/unmute operation
 * has completed successfully.
 * @param options an object which specifies optional arguments such as the
 * <tt>boolean</tt> key <tt>byUser</tt> with default value <tt>true</tt> which
 * specifies whether the method was initiated in response to a user command (in
 * contrast to an automatic decision made by the application logic)
 */
JingleSession.prototype.setVideoMute = function (mute, callback, options) {
    var byUser;

    if (options) {
        byUser = options.byUser;
        if (typeof byUser === 'undefined') {
            byUser = true;
        }
    } else {
        byUser = true;
    }
    // The user's command to mute the (local) video takes precedence over any
    // automatic decision made by the application logic.
    if (byUser) {
        this.videoMuteByUser = mute;
    } else if (this.videoMuteByUser) {
        return;
    }

    this.hardMuteVideo(mute);

    this.modifySources(callback(mute));
};

// SDP-based mute by going recvonly/sendrecv
// FIXME: should probably black out the screen as well
JingleSession.prototype.toggleVideoMute = function (callback) {
    this.service.setVideoMute(APP.RTC.localVideo.isMuted(), callback);
};

JingleSession.prototype.hardMuteVideo = function (muted) {
    this.pendingop = muted ? 'mute' : 'unmute';
};

JingleSession.prototype.sendMute = function (muted, content) {
    var info = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-info',
            initiator: this.initiator,
            sid: this.sid });
    info.c(muted ? 'mute' : 'unmute', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
    info.attrs({'creator': this.me == this.initiator ? 'creator' : 'responder'});
    if (content) {
        info.attrs({'name': content});
    }
    this.connection.send(info);
};

JingleSession.prototype.sendRinging = function () {
    var info = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-info',
            initiator: this.initiator,
            sid: this.sid });
    info.c('ringing', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
    this.connection.send(info);
};

JingleSession.prototype.getStats = function (interval) {
    var self = this;
    var recv = {audio: 0, video: 0};
    var lost = {audio: 0, video: 0};
    var lastrecv = {audio: 0, video: 0};
    var lastlost = {audio: 0, video: 0};
    var loss = {audio: 0, video: 0};
    var delta = {audio: 0, video: 0};
    this.statsinterval = window.setInterval(function () {
        if (self && self.peerconnection && self.peerconnection.getStats) {
            self.peerconnection.getStats(function (stats) {
                var results = stats.result();
                // TODO: there are so much statistics you can get from this..
                for (var i = 0; i < results.length; ++i) {
                    if (results[i].type == 'ssrc') {
                        var packetsrecv = results[i].stat('packetsReceived');
                        var packetslost = results[i].stat('packetsLost');
                        if (packetsrecv && packetslost) {
                            packetsrecv = parseInt(packetsrecv, 10);
                            packetslost = parseInt(packetslost, 10);

                            if (results[i].stat('googFrameRateReceived')) {
                                lastlost.video = lost.video;
                                lastrecv.video = recv.video;
                                recv.video = packetsrecv;
                                lost.video = packetslost;
                            } else {
                                lastlost.audio = lost.audio;
                                lastrecv.audio = recv.audio;
                                recv.audio = packetsrecv;
                                lost.audio = packetslost;
                            }
                        }
                    }
                }
                delta.audio = recv.audio - lastrecv.audio;
                delta.video = recv.video - lastrecv.video;
                loss.audio = (delta.audio > 0) ? Math.ceil(100 * (lost.audio - lastlost.audio) / delta.audio) : 0;
                loss.video = (delta.video > 0) ? Math.ceil(100 * (lost.video - lastlost.video) / delta.video) : 0;
                $(document).trigger('packetloss.jingle', [self.sid, loss]);
            });
        }
    }, interval || 3000);
    return this.statsinterval;
};

JingleSession.onJingleError = function (session, error)
{
    console.error("Jingle error", error);
}

JingleSession.onJingleFatalError = function (session, error)
{
    this.service.sessionTerminated = true;
    this.connection.emuc.doLeave();
    APP.UI.messageHandler.showError("dialog.sorry",
        "dialog.internalError");
}

JingleSession.prototype.setLocalDescription = function () {
    // put our ssrcs into presence so other clients can identify our stream
    var newssrcs = [];
    var media = APP.simulcast.parseMedia(this.peerconnection.localDescription);
    media.forEach(function (media) {

        if(Object.keys(media.sources).length > 0) {
            // TODO(gp) maybe exclude FID streams?
            Object.keys(media.sources).forEach(function (ssrc) {
                newssrcs.push({
                    'ssrc': ssrc,
                    'type': media.type,
                    'direction': media.direction
                });
            });
        }
        else if(this.localStreamsSSRC && this.localStreamsSSRC[media.type])
        {
            newssrcs.push({
                'ssrc': this.localStreamsSSRC[media.type],
                'type': media.type,
                'direction': media.direction
            });
        }

    });

    console.log('new ssrcs', newssrcs);

    // Have to clear presence map to get rid of removed streams
    this.connection.emuc.clearPresenceMedia();

    if (newssrcs.length > 0) {
        for (var i = 1; i <= newssrcs.length; i ++) {
            // Change video type to screen
            if (newssrcs[i-1].type === 'video' && APP.desktopsharing.isUsingScreenStream()) {
                newssrcs[i-1].type = 'screen';
            }
            this.connection.emuc.addMediaToPresence(i,
                newssrcs[i-1].type, newssrcs[i-1].ssrc, newssrcs[i-1].direction);
        }

        this.connection.emuc.sendPresence();
    }
}

// an attempt to work around https://github.com/jitsi/jitmeet/issues/32
function sendKeyframe(pc) {
    console.log('sendkeyframe', pc.iceConnectionState);
    if (pc.iceConnectionState !== 'connected') return; // safe...
    pc.setRemoteDescription(
        pc.remoteDescription,
        function () {
            pc.createAnswer(
                function (modifiedAnswer) {
                    pc.setLocalDescription(
                        modifiedAnswer,
                        function () {
                            // noop
                        },
                        function (error) {
                            console.log('triggerKeyframe setLocalDescription failed', error);
                            APP.UI.messageHandler.showError();
                        }
                    );
                },
                function (error) {
                    console.log('triggerKeyframe createAnswer failed', error);
                    APP.UI.messageHandler.showError();
                }
            );
        },
        function (error) {
            console.log('triggerKeyframe setRemoteDescription failed', error);
            APP.UI.messageHandler.showError();
        }
    );
}


JingleSession.prototype.remoteStreamAdded = function (data, times) {
    var self = this;
    var thessrc;
    var ssrc2jid = this.connection.emuc.ssrc2jid;

    // look up an associated JID for a stream id
    if (data.stream.id && data.stream.id.indexOf('mixedmslabel') === -1) {
        // look only at a=ssrc: and _not_ at a=ssrc-group: lines

        var ssrclines
            = SDPUtil.find_lines(this.peerconnection.remoteDescription.sdp, 'a=ssrc:');
        ssrclines = ssrclines.filter(function (line) {
            // NOTE(gp) previously we filtered on the mslabel, but that property
            // is not always present.
            // return line.indexOf('mslabel:' + data.stream.label) !== -1;

            return ((line.indexOf('msid:' + data.stream.id) !== -1));
        });
        if (ssrclines.length) {
            thessrc = ssrclines[0].substring(7).split(' ')[0];

            // We signal our streams (through Jingle to the focus) before we set
            // our presence (through which peers associate remote streams to
            // jids). So, it might arrive that a remote stream is added but
            // ssrc2jid is not yet updated and thus data.peerjid cannot be
            // successfully set. Here we wait for up to a second for the
            // presence to arrive.

            if (!ssrc2jid[thessrc]) {

                if (typeof times === 'undefined')
                {
                    times = 0;
                }

                if (times > 10)
                {
                    console.warning('Waiting for jid timed out', thessrc);
                }
                else
                {
                    setTimeout(function(d) {
                        return function() {
                            self.remoteStreamAdded(d, times++);
                        }
                    }(data), 250);
                }
                return;
            }

            // ok to overwrite the one from focus? might save work in colibri.js
            console.log('associated jid', ssrc2jid[thessrc], data.peerjid);
            if (ssrc2jid[thessrc]) {
                data.peerjid = ssrc2jid[thessrc];
            }
        }
    }

    APP.RTC.createRemoteStream(data, this.sid, thessrc);

    var isVideo = data.stream.getVideoTracks().length > 0;
    // an attempt to work around https://github.com/jitsi/jitmeet/issues/32
    if (isVideo &&
        data.peerjid && this.peerjid === data.peerjid &&
        data.stream.getVideoTracks().length === 0 &&
        APP.RTC.localVideo.getTracks().length > 0) {
        window.setTimeout(function () {
            sendKeyframe(self.peerconnection);
        }, 3000);
    }
}

module.exports = JingleSession;

},{"../../service/RTC/RTCBrowserType":89,"./SDP":49,"./SDPDiffer":50,"./SDPUtil":51,"./TraceablePeerConnection":52}],49:[function(require,module,exports){
/* jshint -W117 */
var SDPUtil = require("./SDPUtil");

// SDP STUFF
function SDP(sdp) {
    this.media = sdp.split('\r\nm=');
    for (var i = 1; i < this.media.length; i++) {
        this.media[i] = 'm=' + this.media[i];
        if (i != this.media.length - 1) {
            this.media[i] += '\r\n';
        }
    }
    this.session = this.media.shift() + '\r\n';
    this.raw = this.session + this.media.join('');
}
/**
 * Returns map of MediaChannel mapped per channel idx.
 */
SDP.prototype.getMediaSsrcMap = function() {
    var self = this;
    var media_ssrcs = {};
    var tmp;
    for (var mediaindex = 0; mediaindex < self.media.length; mediaindex++) {
        tmp = SDPUtil.find_lines(self.media[mediaindex], 'a=ssrc:');
        var mid = SDPUtil.parse_mid(SDPUtil.find_line(self.media[mediaindex], 'a=mid:'));
        var media = {
            mediaindex: mediaindex,
            mid: mid,
            ssrcs: {},
            ssrcGroups: []
        };
        media_ssrcs[mediaindex] = media;
        tmp.forEach(function (line) {
            var linessrc = line.substring(7).split(' ')[0];
            // allocate new ChannelSsrc
            if(!media.ssrcs[linessrc]) {
                media.ssrcs[linessrc] = {
                    ssrc: linessrc,
                    lines: []
                };
            }
            media.ssrcs[linessrc].lines.push(line);
        });
        tmp = SDPUtil.find_lines(self.media[mediaindex], 'a=ssrc-group:');
        tmp.forEach(function(line){
            var semantics = line.substr(0, idx).substr(13);
            var ssrcs = line.substr(14 + semantics.length).split(' ');
            if (ssrcs.length != 0) {
                media.ssrcGroups.push({
                    semantics: semantics,
                    ssrcs: ssrcs
                });
            }
        });
    }
    return media_ssrcs;
};
/**
 * Returns <tt>true</tt> if this SDP contains given SSRC.
 * @param ssrc the ssrc to check.
 * @returns {boolean} <tt>true</tt> if this SDP contains given SSRC.
 */
SDP.prototype.containsSSRC = function(ssrc) {
    var medias = this.getMediaSsrcMap();
    var contains = false;
    Object.keys(medias).forEach(function(mediaindex){
        var media = medias[mediaindex];
        //console.log("Check", channel, ssrc);
        if(Object.keys(media.ssrcs).indexOf(ssrc) != -1){
            contains = true;
        }
    });
    return contains;
};


// remove iSAC and CN from SDP
SDP.prototype.mangle = function () {
    var i, j, mline, lines, rtpmap, newdesc;
    for (i = 0; i < this.media.length; i++) {
        lines = this.media[i].split('\r\n');
        lines.pop(); // remove empty last element
        mline = SDPUtil.parse_mline(lines.shift());
        if (mline.media != 'audio')
            continue;
        newdesc = '';
        mline.fmt.length = 0;
        for (j = 0; j < lines.length; j++) {
            if (lines[j].substr(0, 9) == 'a=rtpmap:') {
                rtpmap = SDPUtil.parse_rtpmap(lines[j]);
                if (rtpmap.name == 'CN' || rtpmap.name == 'ISAC')
                    continue;
                mline.fmt.push(rtpmap.id);
                newdesc += lines[j] + '\r\n';
            } else {
                newdesc += lines[j] + '\r\n';
            }
        }
        this.media[i] = SDPUtil.build_mline(mline) + '\r\n';
        this.media[i] += newdesc;
    }
    this.raw = this.session + this.media.join('');
};

// remove lines matching prefix from session section
SDP.prototype.removeSessionLines = function(prefix) {
    var self = this;
    var lines = SDPUtil.find_lines(this.session, prefix);
    lines.forEach(function(line) {
        self.session = self.session.replace(line + '\r\n', '');
    });
    this.raw = this.session + this.media.join('');
    return lines;
}
// remove lines matching prefix from a media section specified by mediaindex
// TODO: non-numeric mediaindex could match mid
SDP.prototype.removeMediaLines = function(mediaindex, prefix) {
    var self = this;
    var lines = SDPUtil.find_lines(this.media[mediaindex], prefix);
    lines.forEach(function(line) {
        self.media[mediaindex] = self.media[mediaindex].replace(line + '\r\n', '');
    });
    this.raw = this.session + this.media.join('');
    return lines;
}

// add content's to a jingle element
SDP.prototype.toJingle = function (elem, thecreator, ssrcs) {
//    console.log("SSRC" + ssrcs["audio"] + " - " + ssrcs["video"]);
    var i, j, k, mline, ssrc, rtpmap, tmp, line, lines;
    var self = this;
    // new bundle plan
    if (SDPUtil.find_line(this.session, 'a=group:')) {
        lines = SDPUtil.find_lines(this.session, 'a=group:');
        for (i = 0; i < lines.length; i++) {
            tmp = lines[i].split(' ');
            var semantics = tmp.shift().substr(8);
            elem.c('group', {xmlns: 'urn:xmpp:jingle:apps:grouping:0', semantics:semantics});
            for (j = 0; j < tmp.length; j++) {
                elem.c('content', {name: tmp[j]}).up();
            }
            elem.up();
        }
    }
    for (i = 0; i < this.media.length; i++) {
        mline = SDPUtil.parse_mline(this.media[i].split('\r\n')[0]);
        if (!(mline.media === 'audio' ||
              mline.media === 'video' ||
              mline.media === 'application'))
        {
            continue;
        }
        if (SDPUtil.find_line(this.media[i], 'a=ssrc:')) {
            ssrc = SDPUtil.find_line(this.media[i], 'a=ssrc:').substring(7).split(' ')[0]; // take the first
        } else {
            if(ssrcs && ssrcs[mline.media])
            {
                ssrc = ssrcs[mline.media];
            }
            else
                ssrc = false;
        }

        elem.c('content', {creator: thecreator, name: mline.media});
        if (SDPUtil.find_line(this.media[i], 'a=mid:')) {
            // prefer identifier from a=mid if present
            var mid = SDPUtil.parse_mid(SDPUtil.find_line(this.media[i], 'a=mid:'));
            elem.attrs({ name: mid });
        }

        if (SDPUtil.find_line(this.media[i], 'a=rtpmap:').length)
        {
            elem.c('description',
                {xmlns: 'urn:xmpp:jingle:apps:rtp:1',
                    media: mline.media });
            if (ssrc) {
                elem.attrs({ssrc: ssrc});
            }
            for (j = 0; j < mline.fmt.length; j++) {
                rtpmap = SDPUtil.find_line(this.media[i], 'a=rtpmap:' + mline.fmt[j]);
                elem.c('payload-type', SDPUtil.parse_rtpmap(rtpmap));
                // put any 'a=fmtp:' + mline.fmt[j] lines into <param name=foo value=bar/>
                if (SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j])) {
                    tmp = SDPUtil.parse_fmtp(SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j]));
                    for (k = 0; k < tmp.length; k++) {
                        elem.c('parameter', tmp[k]).up();
                    }
                }
                this.RtcpFbToJingle(i, elem, mline.fmt[j]); // XEP-0293 -- map a=rtcp-fb

                elem.up();
            }
            if (SDPUtil.find_line(this.media[i], 'a=crypto:', this.session)) {
                elem.c('encryption', {required: 1});
                var crypto = SDPUtil.find_lines(this.media[i], 'a=crypto:', this.session);
                crypto.forEach(function(line) {
                    elem.c('crypto', SDPUtil.parse_crypto(line)).up();
                });
                elem.up(); // end of encryption
            }

            if (ssrc) {
                // new style mapping
                elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                // FIXME: group by ssrc and support multiple different ssrcs
                var ssrclines = SDPUtil.find_lines(this.media[i], 'a=ssrc:');
                if(ssrclines.length > 0) {
                    ssrclines.forEach(function (line) {
                        idx = line.indexOf(' ');
                        var linessrc = line.substr(0, idx).substr(7);
                        if (linessrc != ssrc) {
                            elem.up();
                            ssrc = linessrc;
                            elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                        }
                        var kv = line.substr(idx + 1);
                        elem.c('parameter');
                        if (kv.indexOf(':') == -1) {
                            elem.attrs({ name: kv });
                        } else {
                            elem.attrs({ name: kv.split(':', 2)[0] });
                            elem.attrs({ value: kv.split(':', 2)[1] });
                        }
                        elem.up();
                    });
                    elem.up();
                }
                else
                {
                    elem.up();
                    elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                    elem.c('parameter');
                    elem.attrs({name: "cname", value:Math.random().toString(36).substring(7)});
                    elem.up();
                    var msid = null;
                    if(mline.media == "audio")
                    {
                        msid = APP.RTC.localAudio.getId();
                    }
                    else
                    {
                        msid = APP.RTC.localVideo.getId();
                    }
                    if(msid != null)
                    {
                        msid = msid.replace(/[\{,\}]/g,"");
                        elem.c('parameter');
                        elem.attrs({name: "msid", value:msid});
                        elem.up();
                        elem.c('parameter');
                        elem.attrs({name: "mslabel", value:msid});
                        elem.up();
                        elem.c('parameter');
                        elem.attrs({name: "label", value:msid});
                        elem.up();
                        elem.up();
                    }


                }

                // XEP-0339 handle ssrc-group attributes
                var ssrc_group_lines = SDPUtil.find_lines(this.media[i], 'a=ssrc-group:');
                ssrc_group_lines.forEach(function(line) {
                    idx = line.indexOf(' ');
                    var semantics = line.substr(0, idx).substr(13);
                    var ssrcs = line.substr(14 + semantics.length).split(' ');
                    if (ssrcs.length != 0) {
                        elem.c('ssrc-group', { semantics: semantics, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                        ssrcs.forEach(function(ssrc) {
                            elem.c('source', { ssrc: ssrc })
                                .up();
                        });
                        elem.up();
                    }
                });
            }

            if (SDPUtil.find_line(this.media[i], 'a=rtcp-mux')) {
                elem.c('rtcp-mux').up();
            }

            // XEP-0293 -- map a=rtcp-fb:*
            this.RtcpFbToJingle(i, elem, '*');

            // XEP-0294
            if (SDPUtil.find_line(this.media[i], 'a=extmap:')) {
                lines = SDPUtil.find_lines(this.media[i], 'a=extmap:');
                for (j = 0; j < lines.length; j++) {
                    tmp = SDPUtil.parse_extmap(lines[j]);
                    elem.c('rtp-hdrext', { xmlns: 'urn:xmpp:jingle:apps:rtp:rtp-hdrext:0',
                        uri: tmp.uri,
                        id: tmp.value });
                    if (tmp.hasOwnProperty('direction')) {
                        switch (tmp.direction) {
                            case 'sendonly':
                                elem.attrs({senders: 'responder'});
                                break;
                            case 'recvonly':
                                elem.attrs({senders: 'initiator'});
                                break;
                            case 'sendrecv':
                                elem.attrs({senders: 'both'});
                                break;
                            case 'inactive':
                                elem.attrs({senders: 'none'});
                                break;
                        }
                    }
                    // TODO: handle params
                    elem.up();
                }
            }
            elem.up(); // end of description
        }

        // map ice-ufrag/pwd, dtls fingerprint, candidates
        this.TransportToJingle(i, elem);

        if (SDPUtil.find_line(this.media[i], 'a=sendrecv', this.session)) {
            elem.attrs({senders: 'both'});
        } else if (SDPUtil.find_line(this.media[i], 'a=sendonly', this.session)) {
            elem.attrs({senders: 'initiator'});
        } else if (SDPUtil.find_line(this.media[i], 'a=recvonly', this.session)) {
            elem.attrs({senders: 'responder'});
        } else if (SDPUtil.find_line(this.media[i], 'a=inactive', this.session)) {
            elem.attrs({senders: 'none'});
        }
        if (mline.port == '0') {
            // estos hack to reject an m-line
            elem.attrs({senders: 'rejected'});
        }
        elem.up(); // end of content
    }
    elem.up();
    return elem;
};

SDP.prototype.TransportToJingle = function (mediaindex, elem) {
    var i = mediaindex;
    var tmp;
    var self = this;
    elem.c('transport');

    // XEP-0343 DTLS/SCTP
    if (SDPUtil.find_line(this.media[mediaindex], 'a=sctpmap:').length)
    {
        var sctpmap = SDPUtil.find_line(
            this.media[i], 'a=sctpmap:', self.session);
        if (sctpmap)
        {
            var sctpAttrs = SDPUtil.parse_sctpmap(sctpmap);
            elem.c('sctpmap',
                {
                    xmlns: 'urn:xmpp:jingle:transports:dtls-sctp:1',
                    number: sctpAttrs[0], /* SCTP port */
                    protocol: sctpAttrs[1], /* protocol */
                });
            // Optional stream count attribute
            if (sctpAttrs.length > 2)
                elem.attrs({ streams: sctpAttrs[2]});
            elem.up();
        }
    }
    // XEP-0320
    var fingerprints = SDPUtil.find_lines(this.media[mediaindex], 'a=fingerprint:', this.session);
    fingerprints.forEach(function(line) {
        tmp = SDPUtil.parse_fingerprint(line);
        tmp.xmlns = 'urn:xmpp:jingle:apps:dtls:0';
        elem.c('fingerprint').t(tmp.fingerprint);
        delete tmp.fingerprint;
        line = SDPUtil.find_line(self.media[mediaindex], 'a=setup:', self.session);
        if (line) {
            tmp.setup = line.substr(8);
        }
        elem.attrs(tmp);
        elem.up(); // end of fingerprint
    });
    tmp = SDPUtil.iceparams(this.media[mediaindex], this.session);
    if (tmp) {
        tmp.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
        elem.attrs(tmp);
        // XEP-0176
        if (SDPUtil.find_line(this.media[mediaindex], 'a=candidate:', this.session)) { // add any a=candidate lines
            var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=candidate:', this.session);
            lines.forEach(function (line) {
                elem.c('candidate', SDPUtil.candidateToJingle(line)).up();
            });
        }
    }
    elem.up(); // end of transport
}

SDP.prototype.RtcpFbToJingle = function (mediaindex, elem, payloadtype) { // XEP-0293
    var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=rtcp-fb:' + payloadtype);
    lines.forEach(function (line) {
        var tmp = SDPUtil.parse_rtcpfb(line);
        if (tmp.type == 'trr-int') {
            elem.c('rtcp-fb-trr-int', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', value: tmp.params[0]});
            elem.up();
        } else {
            elem.c('rtcp-fb', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', type: tmp.type});
            if (tmp.params.length > 0) {
                elem.attrs({'subtype': tmp.params[0]});
            }
            elem.up();
        }
    });
};

SDP.prototype.RtcpFbFromJingle = function (elem, payloadtype) { // XEP-0293
    var media = '';
    var tmp = elem.find('>rtcp-fb-trr-int[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
    if (tmp.length) {
        media += 'a=rtcp-fb:' + '*' + ' ' + 'trr-int' + ' ';
        if (tmp.attr('value')) {
            media += tmp.attr('value');
        } else {
            media += '0';
        }
        media += '\r\n';
    }
    tmp = elem.find('>rtcp-fb[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
    tmp.each(function () {
        media += 'a=rtcp-fb:' + payloadtype + ' ' + $(this).attr('type');
        if ($(this).attr('subtype')) {
            media += ' ' + $(this).attr('subtype');
        }
        media += '\r\n';
    });
    return media;
};

// construct an SDP from a jingle stanza
SDP.prototype.fromJingle = function (jingle) {
    var self = this;
    this.raw = 'v=0\r\n' +
        'o=- ' + '1923518516' + ' 2 IN IP4 0.0.0.0\r\n' +// FIXME
        's=-\r\n' +
        't=0 0\r\n';
    // http://tools.ietf.org/html/draft-ietf-mmusic-sdp-bundle-negotiation-04#section-8
    if ($(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').length) {
        $(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').each(function (idx, group) {
            var contents = $(group).find('>content').map(function (idx, content) {
                return content.getAttribute('name');
            }).get();
            if (contents.length > 0) {
                self.raw += 'a=group:' + (group.getAttribute('semantics') || group.getAttribute('type')) + ' ' + contents.join(' ') + '\r\n';
            }
        });
    }

    this.session = this.raw;
    jingle.find('>content').each(function () {
        var m = self.jingle2media($(this));
        self.media.push(m);
    });

    // reconstruct msid-semantic -- apparently not necessary
    /*
     var msid = SDPUtil.parse_ssrc(this.raw);
     if (msid.hasOwnProperty('mslabel')) {
     this.session += "a=msid-semantic: WMS " + msid.mslabel + "\r\n";
     }
     */

    this.raw = this.session + this.media.join('');
};

// translate a jingle content element into an an SDP media part
SDP.prototype.jingle2media = function (content) {
    var media = '',
        desc = content.find('description'),
        ssrc = desc.attr('ssrc'),
        self = this,
        tmp;
    var sctp = content.find(
        '>transport>sctpmap[xmlns="urn:xmpp:jingle:transports:dtls-sctp:1"]');

    tmp = { media: desc.attr('media') };
    tmp.port = '1';
    if (content.attr('senders') == 'rejected') {
        // estos hack to reject an m-line.
        tmp.port = '0';
    }
    if (content.find('>transport>fingerprint').length || desc.find('encryption').length) {
        if (sctp.length)
            tmp.proto = 'DTLS/SCTP';
        else
            tmp.proto = 'RTP/SAVPF';
    } else {
        tmp.proto = 'RTP/AVPF';
    }
    if (!sctp.length)
    {
        tmp.fmt = desc.find('payload-type').map(
            function () { return this.getAttribute('id'); }).get();
        media += SDPUtil.build_mline(tmp) + '\r\n';
    }
    else
    {
        media += 'm=application 1 DTLS/SCTP ' + sctp.attr('number') + '\r\n';
        media += 'a=sctpmap:' + sctp.attr('number') +
            ' ' + sctp.attr('protocol');

        var streamCount = sctp.attr('streams');
        if (streamCount)
            media += ' ' + streamCount + '\r\n';
        else
            media += '\r\n';
    }

    media += 'c=IN IP4 0.0.0.0\r\n';
    if (!sctp.length)
        media += 'a=rtcp:1 IN IP4 0.0.0.0\r\n';
    tmp = content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]');
    if (tmp.length) {
        if (tmp.attr('ufrag')) {
            media += SDPUtil.build_iceufrag(tmp.attr('ufrag')) + '\r\n';
        }
        if (tmp.attr('pwd')) {
            media += SDPUtil.build_icepwd(tmp.attr('pwd')) + '\r\n';
        }
        tmp.find('>fingerprint').each(function () {
            // FIXME: check namespace at some point
            media += 'a=fingerprint:' + this.getAttribute('hash');
            media += ' ' + $(this).text();
            media += '\r\n';
            if (this.getAttribute('setup')) {
                media += 'a=setup:' + this.getAttribute('setup') + '\r\n';
            }
        });
    }
    switch (content.attr('senders')) {
        case 'initiator':
            media += 'a=sendonly\r\n';
            break;
        case 'responder':
            media += 'a=recvonly\r\n';
            break;
        case 'none':
            media += 'a=inactive\r\n';
            break;
        case 'both':
            media += 'a=sendrecv\r\n';
            break;
    }
    media += 'a=mid:' + content.attr('name') + '\r\n';

    // <description><rtcp-mux/></description>
    // see http://code.google.com/p/libjingle/issues/detail?id=309 -- no spec though
    // and http://mail.jabber.org/pipermail/jingle/2011-December/001761.html
    if (desc.find('rtcp-mux').length) {
        media += 'a=rtcp-mux\r\n';
    }

    if (desc.find('encryption').length) {
        desc.find('encryption>crypto').each(function () {
            media += 'a=crypto:' + this.getAttribute('tag');
            media += ' ' + this.getAttribute('crypto-suite');
            media += ' ' + this.getAttribute('key-params');
            if (this.getAttribute('session-params')) {
                media += ' ' + this.getAttribute('session-params');
            }
            media += '\r\n';
        });
    }
    desc.find('payload-type').each(function () {
        media += SDPUtil.build_rtpmap(this) + '\r\n';
        if ($(this).find('>parameter').length) {
            media += 'a=fmtp:' + this.getAttribute('id') + ' ';
            media += $(this).find('parameter').map(function () { return (this.getAttribute('name') ? (this.getAttribute('name') + '=') : '') + this.getAttribute('value'); }).get().join('; ');
            media += '\r\n';
        }
        // xep-0293
        media += self.RtcpFbFromJingle($(this), this.getAttribute('id'));
    });

    // xep-0293
    media += self.RtcpFbFromJingle(desc, '*');

    // xep-0294
    tmp = desc.find('>rtp-hdrext[xmlns="urn:xmpp:jingle:apps:rtp:rtp-hdrext:0"]');
    tmp.each(function () {
        media += 'a=extmap:' + this.getAttribute('id') + ' ' + this.getAttribute('uri') + '\r\n';
    });

    content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]>candidate').each(function () {
        media += SDPUtil.candidateFromJingle(this);
    });

    // XEP-0339 handle ssrc-group attributes
    tmp = content.find('description>ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
        var semantics = this.getAttribute('semantics');
        var ssrcs = $(this).find('>source').map(function() {
            return this.getAttribute('ssrc');
        }).get();

        if (ssrcs.length != 0) {
            media += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
        }
    });

    tmp = content.find('description>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
    tmp.each(function () {
        var ssrc = this.getAttribute('ssrc');
        $(this).find('>parameter').each(function () {
            media += 'a=ssrc:' + ssrc + ' ' + this.getAttribute('name');
            if (this.getAttribute('value') && this.getAttribute('value').length)
                media += ':' + this.getAttribute('value');
            media += '\r\n';
        });
    });

    return media;
};


module.exports = SDP;


},{"./SDPUtil":51}],50:[function(require,module,exports){
function SDPDiffer(mySDP, otherSDP) {
    this.mySDP = mySDP;
    this.otherSDP = otherSDP;
}

/**
 * Returns map of MediaChannel that contains only media not contained in <tt>otherSdp</tt>. Mapped by channel idx.
 * @param otherSdp the other SDP to check ssrc with.
 */
SDPDiffer.prototype.getNewMedia = function() {

    // this could be useful in Array.prototype.
    function arrayEquals(array) {
        // if the other array is a falsy value, return
        if (!array)
            return false;

        // compare lengths - can save a lot of time
        if (this.length != array.length)
            return false;

        for (var i = 0, l=this.length; i < l; i++) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].equals(array[i]))
                    return false;
            }
            else if (this[i] != array[i]) {
                // Warning - two different object instances will never be equal: {x:20} != {x:20}
                return false;
            }
        }
        return true;
    }

    var myMedias = this.mySDP.getMediaSsrcMap();
    var othersMedias = this.otherSDP.getMediaSsrcMap();
    var newMedia = {};
    Object.keys(othersMedias).forEach(function(othersMediaIdx) {
        var myMedia = myMedias[othersMediaIdx];
        var othersMedia = othersMedias[othersMediaIdx];
        if(!myMedia && othersMedia) {
            // Add whole channel
            newMedia[othersMediaIdx] = othersMedia;
            return;
        }
        // Look for new ssrcs accross the channel
        Object.keys(othersMedia.ssrcs).forEach(function(ssrc) {
            if(Object.keys(myMedia.ssrcs).indexOf(ssrc) === -1) {
                // Allocate channel if we've found ssrc that doesn't exist in our channel
                if(!newMedia[othersMediaIdx]){
                    newMedia[othersMediaIdx] = {
                        mediaindex: othersMedia.mediaindex,
                        mid: othersMedia.mid,
                        ssrcs: {},
                        ssrcGroups: []
                    };
                }
                newMedia[othersMediaIdx].ssrcs[ssrc] = othersMedia.ssrcs[ssrc];
            }
        });

        // Look for new ssrc groups across the channels
        othersMedia.ssrcGroups.forEach(function(otherSsrcGroup){

            // try to match the other ssrc-group with an ssrc-group of ours
            var matched = false;
            for (var i = 0; i < myMedia.ssrcGroups.length; i++) {
                var mySsrcGroup = myMedia.ssrcGroups[i];
                if (otherSsrcGroup.semantics == mySsrcGroup.semantics
                    && arrayEquals.apply(otherSsrcGroup.ssrcs, [mySsrcGroup.ssrcs])) {

                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Allocate channel if we've found an ssrc-group that doesn't
                // exist in our channel

                if(!newMedia[othersMediaIdx]){
                    newMedia[othersMediaIdx] = {
                        mediaindex: othersMedia.mediaindex,
                        mid: othersMedia.mid,
                        ssrcs: {},
                        ssrcGroups: []
                    };
                }
                newMedia[othersMediaIdx].ssrcGroups.push(otherSsrcGroup);
            }
        });
    });
    return newMedia;
};

/**
 * Sends SSRC update IQ.
 * @param sdpMediaSsrcs SSRCs map obtained from SDP.getNewMedia. Cntains SSRCs to add/remove.
 * @param sid session identifier that will be put into the IQ.
 * @param initiator initiator identifier.
 * @param toJid destination Jid
 * @param isAdd indicates if this is remove or add operation.
 */
SDPDiffer.prototype.toJingle = function(modify) {
    var sdpMediaSsrcs = this.getNewMedia();
    var self = this;

    // FIXME: only announce video ssrcs since we mix audio and dont need
    //      the audio ssrcs therefore
    var modified = false;
    Object.keys(sdpMediaSsrcs).forEach(function(mediaindex){
        modified = true;
        var media = sdpMediaSsrcs[mediaindex];
        modify.c('content', {name: media.mid});

        modify.c('description', {xmlns:'urn:xmpp:jingle:apps:rtp:1', media: media.mid});
        // FIXME: not completly sure this operates on blocks and / or handles different ssrcs correctly
        // generate sources from lines
        Object.keys(media.ssrcs).forEach(function(ssrcNum) {
            var mediaSsrc = media.ssrcs[ssrcNum];
            modify.c('source', { xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
            modify.attrs({ssrc: mediaSsrc.ssrc});
            // iterate over ssrc lines
            mediaSsrc.lines.forEach(function (line) {
                var idx = line.indexOf(' ');
                var kv = line.substr(idx + 1);
                modify.c('parameter');
                if (kv.indexOf(':') == -1) {
                    modify.attrs({ name: kv });
                } else {
                    modify.attrs({ name: kv.split(':', 2)[0] });
                    modify.attrs({ value: kv.split(':', 2)[1] });
                }
                modify.up(); // end of parameter
            });
            modify.up(); // end of source
        });

        // generate source groups from lines
        media.ssrcGroups.forEach(function(ssrcGroup) {
            if (ssrcGroup.ssrcs.length != 0) {

                modify.c('ssrc-group', {
                    semantics: ssrcGroup.semantics,
                    xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0'
                });

                ssrcGroup.ssrcs.forEach(function (ssrc) {
                    modify.c('source', { ssrc: ssrc })
                        .up(); // end of source
                });
                modify.up(); // end of ssrc-group
            }
        });

        modify.up(); // end of description
        modify.up(); // end of content
    });

    return modified;
};

module.exports = SDPDiffer;
},{}],51:[function(require,module,exports){
SDPUtil = {
    iceparams: function (mediadesc, sessiondesc) {
        var data = null;
        if (SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc) &&
            SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc)) {
            data = {
                ufrag: SDPUtil.parse_iceufrag(SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc)),
                pwd: SDPUtil.parse_icepwd(SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc))
            };
        }
        return data;
    },
    parse_iceufrag: function (line) {
        return line.substring(12);
    },
    build_iceufrag: function (frag) {
        return 'a=ice-ufrag:' + frag;
    },
    parse_icepwd: function (line) {
        return line.substring(10);
    },
    build_icepwd: function (pwd) {
        return 'a=ice-pwd:' + pwd;
    },
    parse_mid: function (line) {
        return line.substring(6);
    },
    parse_mline: function (line) {
        var parts = line.substring(2).split(' '),
            data = {};
        data.media = parts.shift();
        data.port = parts.shift();
        data.proto = parts.shift();
        if (parts[parts.length - 1] === '') { // trailing whitespace
            parts.pop();
        }
        data.fmt = parts;
        return data;
    },
    build_mline: function (mline) {
        return 'm=' + mline.media + ' ' + mline.port + ' ' + mline.proto + ' ' + mline.fmt.join(' ');
    },
    parse_rtpmap: function (line) {
        var parts = line.substring(9).split(' '),
            data = {};
        data.id = parts.shift();
        parts = parts[0].split('/');
        data.name = parts.shift();
        data.clockrate = parts.shift();
        data.channels = parts.length ? parts.shift() : '1';
        return data;
    },
    /**
     * Parses SDP line "a=sctpmap:..." and extracts SCTP port from it.
     * @param line eg. "a=sctpmap:5000 webrtc-datachannel"
     * @returns [SCTP port number, protocol, streams]
     */
    parse_sctpmap: function (line)
    {
        var parts = line.substring(10).split(' ');
        var sctpPort = parts[0];
        var protocol = parts[1];
        // Stream count is optional
        var streamCount = parts.length > 2 ? parts[2] : null;
        return [sctpPort, protocol, streamCount];// SCTP port
    },
    build_rtpmap: function (el) {
        var line = 'a=rtpmap:' + el.getAttribute('id') + ' ' + el.getAttribute('name') + '/' + el.getAttribute('clockrate');
        if (el.getAttribute('channels') && el.getAttribute('channels') != '1') {
            line += '/' + el.getAttribute('channels');
        }
        return line;
    },
    parse_crypto: function (line) {
        var parts = line.substring(9).split(' '),
            data = {};
        data.tag = parts.shift();
        data['crypto-suite'] = parts.shift();
        data['key-params'] = parts.shift();
        if (parts.length) {
            data['session-params'] = parts.join(' ');
        }
        return data;
    },
    parse_fingerprint: function (line) { // RFC 4572
        var parts = line.substring(14).split(' '),
            data = {};
        data.hash = parts.shift();
        data.fingerprint = parts.shift();
        // TODO assert that fingerprint satisfies 2UHEX *(":" 2UHEX) ?
        return data;
    },
    parse_fmtp: function (line) {
        var parts = line.split(' '),
            i, key, value,
            data = [];
        parts.shift();
        parts = parts.join(' ').split(';');
        for (i = 0; i < parts.length; i++) {
            key = parts[i].split('=')[0];
            while (key.length && key[0] == ' ') {
                key = key.substring(1);
            }
            value = parts[i].split('=')[1];
            if (key && value) {
                data.push({name: key, value: value});
            } else if (key) {
                // rfc 4733 (DTMF) style stuff
                data.push({name: '', value: key});
            }
        }
        return data;
    },
    parse_icecandidate: function (line) {
        var candidate = {},
            elems = line.split(' ');
        candidate.foundation = elems[0].substring(12);
        candidate.component = elems[1];
        candidate.protocol = elems[2].toLowerCase();
        candidate.priority = elems[3];
        candidate.ip = elems[4];
        candidate.port = elems[5];
        // elems[6] => "typ"
        candidate.type = elems[7];
        candidate.generation = 0; // default value, may be overwritten below
        for (var i = 8; i < elems.length; i += 2) {
            switch (elems[i]) {
                case 'raddr':
                    candidate['rel-addr'] = elems[i + 1];
                    break;
                case 'rport':
                    candidate['rel-port'] = elems[i + 1];
                    break;
                case 'generation':
                    candidate.generation = elems[i + 1];
                    break;
                case 'tcptype':
                    candidate.tcptype = elems[i + 1];
                    break;
                default: // TODO
                    console.log('parse_icecandidate not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
            }
        }
        candidate.network = '1';
        candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
        return candidate;
    },
    build_icecandidate: function (cand) {
        var line = ['a=candidate:' + cand.foundation, cand.component, cand.protocol, cand.priority, cand.ip, cand.port, 'typ', cand.type].join(' ');
        line += ' ';
        switch (cand.type) {
            case 'srflx':
            case 'prflx':
            case 'relay':
                if (cand.hasOwnAttribute('rel-addr') && cand.hasOwnAttribute('rel-port')) {
                    line += 'raddr';
                    line += ' ';
                    line += cand['rel-addr'];
                    line += ' ';
                    line += 'rport';
                    line += ' ';
                    line += cand['rel-port'];
                    line += ' ';
                }
                break;
        }
        if (cand.hasOwnAttribute('tcptype')) {
            line += 'tcptype';
            line += ' ';
            line += cand.tcptype;
            line += ' ';
        }
        line += 'generation';
        line += ' ';
        line += cand.hasOwnAttribute('generation') ? cand.generation : '0';
        return line;
    },
    parse_ssrc: function (desc) {
        // proprietary mapping of a=ssrc lines
        // TODO: see "Jingle RTP Source Description" by Juberti and P. Thatcher on google docs
        // and parse according to that
        var lines = desc.split('\r\n'),
            data = {};
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, 7) == 'a=ssrc:') {
                var idx = lines[i].indexOf(' ');
                data[lines[i].substr(idx + 1).split(':', 2)[0]] = lines[i].substr(idx + 1).split(':', 2)[1];
            }
        }
        return data;
    },
    parse_rtcpfb: function (line) {
        var parts = line.substr(10).split(' ');
        var data = {};
        data.pt = parts.shift();
        data.type = parts.shift();
        data.params = parts;
        return data;
    },
    parse_extmap: function (line) {
        var parts = line.substr(9).split(' ');
        var data = {};
        data.value = parts.shift();
        if (data.value.indexOf('/') != -1) {
            data.direction = data.value.substr(data.value.indexOf('/') + 1);
            data.value = data.value.substr(0, data.value.indexOf('/'));
        } else {
            data.direction = 'both';
        }
        data.uri = parts.shift();
        data.params = parts;
        return data;
    },
    find_line: function (haystack, needle, sessionpart) {
        var lines = haystack.split('\r\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, needle.length) == needle) {
                return lines[i];
            }
        }
        if (!sessionpart) {
            return false;
        }
        // search session part
        lines = sessionpart.split('\r\n');
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].substring(0, needle.length) == needle) {
                return lines[j];
            }
        }
        return false;
    },
    find_lines: function (haystack, needle, sessionpart) {
        var lines = haystack.split('\r\n'),
            needles = [];
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, needle.length) == needle)
                needles.push(lines[i]);
        }
        if (needles.length || !sessionpart) {
            return needles;
        }
        // search session part
        lines = sessionpart.split('\r\n');
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].substring(0, needle.length) == needle) {
                needles.push(lines[j]);
            }
        }
        return needles;
    },
    candidateToJingle: function (line) {
        // a=candidate:2979166662 1 udp 2113937151 192.168.2.100 57698 typ host generation 0
        //      <candidate component=... foundation=... generation=... id=... ip=... network=... port=... priority=... protocol=... type=.../>
        if (line.indexOf('candidate:') === 0) {
            line = 'a=' + line;
        } else if (line.substring(0, 12) != 'a=candidate:') {
            console.log('parseCandidate called with a line that is not a candidate line');
            console.log(line);
            return null;
        }
        if (line.substring(line.length - 2) == '\r\n') // chomp it
            line = line.substring(0, line.length - 2);
        var candidate = {},
            elems = line.split(' '),
            i;
        if (elems[6] != 'typ') {
            console.log('did not find typ in the right place');
            console.log(line);
            return null;
        }
        candidate.foundation = elems[0].substring(12);
        candidate.component = elems[1];
        candidate.protocol = elems[2].toLowerCase();
        candidate.priority = elems[3];
        candidate.ip = elems[4];
        candidate.port = elems[5];
        // elems[6] => "typ"
        candidate.type = elems[7];

        candidate.generation = '0'; // default, may be overwritten below
        for (i = 8; i < elems.length; i += 2) {
            switch (elems[i]) {
                case 'raddr':
                    candidate['rel-addr'] = elems[i + 1];
                    break;
                case 'rport':
                    candidate['rel-port'] = elems[i + 1];
                    break;
                case 'generation':
                    candidate.generation = elems[i + 1];
                    break;
                case 'tcptype':
                    candidate.tcptype = elems[i + 1];
                    break;
                default: // TODO
                    console.log('not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
            }
        }
        candidate.network = '1';
        candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
        return candidate;
    },
    candidateFromJingle: function (cand) {
        var line = 'a=candidate:';
        line += cand.getAttribute('foundation');
        line += ' ';
        line += cand.getAttribute('component');
        line += ' ';
        line += cand.getAttribute('protocol'); //.toUpperCase(); // chrome M23 doesn't like this
        line += ' ';
        line += cand.getAttribute('priority');
        line += ' ';
        line += cand.getAttribute('ip');
        line += ' ';
        line += cand.getAttribute('port');
        line += ' ';
        line += 'typ';
        line += ' ' + cand.getAttribute('type');
        line += ' ';
        switch (cand.getAttribute('type')) {
            case 'srflx':
            case 'prflx':
            case 'relay':
                if (cand.getAttribute('rel-addr') && cand.getAttribute('rel-port')) {
                    line += 'raddr';
                    line += ' ';
                    line += cand.getAttribute('rel-addr');
                    line += ' ';
                    line += 'rport';
                    line += ' ';
                    line += cand.getAttribute('rel-port');
                    line += ' ';
                }
                break;
        }
        if (cand.getAttribute('protocol').toLowerCase() == 'tcp') {
            line += 'tcptype';
            line += ' ';
            line += cand.getAttribute('tcptype');
            line += ' ';
        }
        line += 'generation';
        line += ' ';
        line += cand.getAttribute('generation') || '0';
        return line + '\r\n';
    }
};
module.exports = SDPUtil;
},{}],52:[function(require,module,exports){
function TraceablePeerConnection(ice_config, constraints) {
    var self = this;
    var RTCPeerconnection = navigator.mozGetUserMedia ? mozRTCPeerConnection : webkitRTCPeerConnection;
    this.peerconnection = new RTCPeerconnection(ice_config, constraints);
    this.updateLog = [];
    this.stats = {};
    this.statsinterval = null;
    this.maxstats = 0; // limit to 300 values, i.e. 5 minutes; set to 0 to disable
    var Interop = require('sdp-interop').Interop;
    this.interop = new Interop();

    // override as desired
    this.trace = function (what, info) {
        //console.warn('WTRACE', what, info);
        self.updateLog.push({
            time: new Date(),
            type: what,
            value: info || ""
        });
    };
    this.onicecandidate = null;
    this.peerconnection.onicecandidate = function (event) {
        self.trace('onicecandidate', JSON.stringify(event.candidate, null, ' '));
        if (self.onicecandidate !== null) {
            self.onicecandidate(event);
        }
    };
    this.onaddstream = null;
    this.peerconnection.onaddstream = function (event) {
        self.trace('onaddstream', event.stream.id);
        if (self.onaddstream !== null) {
            self.onaddstream(event);
        }
    };
    this.onremovestream = null;
    this.peerconnection.onremovestream = function (event) {
        self.trace('onremovestream', event.stream.id);
        if (self.onremovestream !== null) {
            self.onremovestream(event);
        }
    };
    this.onsignalingstatechange = null;
    this.peerconnection.onsignalingstatechange = function (event) {
        self.trace('onsignalingstatechange', self.signalingState);
        if (self.onsignalingstatechange !== null) {
            self.onsignalingstatechange(event);
        }
    };
    this.oniceconnectionstatechange = null;
    this.peerconnection.oniceconnectionstatechange = function (event) {
        self.trace('oniceconnectionstatechange', self.iceConnectionState);
        if (self.oniceconnectionstatechange !== null) {
            self.oniceconnectionstatechange(event);
        }
    };
    this.onnegotiationneeded = null;
    this.peerconnection.onnegotiationneeded = function (event) {
        self.trace('onnegotiationneeded');
        if (self.onnegotiationneeded !== null) {
            self.onnegotiationneeded(event);
        }
    };
    self.ondatachannel = null;
    this.peerconnection.ondatachannel = function (event) {
        self.trace('ondatachannel', event);
        if (self.ondatachannel !== null) {
            self.ondatachannel(event);
        }
    };
    if (!navigator.mozGetUserMedia && this.maxstats) {
        this.statsinterval = window.setInterval(function() {
            self.peerconnection.getStats(function(stats) {
                var results = stats.result();
                for (var i = 0; i < results.length; ++i) {
                    //console.log(results[i].type, results[i].id, results[i].names())
                    var now = new Date();
                    results[i].names().forEach(function (name) {
                        var id = results[i].id + '-' + name;
                        if (!self.stats[id]) {
                            self.stats[id] = {
                                startTime: now,
                                endTime: now,
                                values: [],
                                times: []
                            };
                        }
                        self.stats[id].values.push(results[i].stat(name));
                        self.stats[id].times.push(now.getTime());
                        if (self.stats[id].values.length > self.maxstats) {
                            self.stats[id].values.shift();
                            self.stats[id].times.shift();
                        }
                        self.stats[id].endTime = now;
                    });
                }
            });

        }, 1000);
    }
};

dumpSDP = function(description) {
    if (typeof description === 'undefined' || description == null) {
        return '';
    }

    return 'type: ' + description.type + '\r\n' + description.sdp;
};

if (TraceablePeerConnection.prototype.__defineGetter__ !== undefined) {
    TraceablePeerConnection.prototype.__defineGetter__('signalingState', function() { return this.peerconnection.signalingState; });
    TraceablePeerConnection.prototype.__defineGetter__('iceConnectionState', function() { return this.peerconnection.iceConnectionState; });
    TraceablePeerConnection.prototype.__defineGetter__('localDescription', function() {
        this.trace('getLocalDescription::preTransform (Plan A)', dumpSDP(this.peerconnection.localDescription));
        // if we're running on FF, transform to Plan B first.
        var desc = this.peerconnection.localDescription;
        if (navigator.mozGetUserMedia) {
            desc = this.interop.toPlanB(desc);
        } else {
            desc = APP.simulcast.reverseTransformLocalDescription(this.peerconnection.localDescription);
        }
        this.trace('getLocalDescription::postTransform (Plan B)', dumpSDP(desc));
        return desc;
    });
    TraceablePeerConnection.prototype.__defineGetter__('remoteDescription', function() {
        this.trace('getRemoteDescription::preTransform (Plan A)', dumpSDP(this.peerconnection.remoteDescription));
        // if we're running on FF, transform to Plan B first.
        var desc = this.peerconnection.remoteDescription;
        if (navigator.mozGetUserMedia) {
            desc = this.interop.toPlanB(desc);
        } else {
            desc = APP.simulcast.reverseTransformRemoteDescription(this.peerconnection.remoteDescription);
        }
        this.trace('getRemoteDescription::postTransform (Plan B)', dumpSDP(desc));
        return desc;
    });
}

TraceablePeerConnection.prototype.addStream = function (stream) {
    this.trace('addStream', stream.id);
    APP.simulcast.resetSender();
    try
    {
        this.peerconnection.addStream(stream);
    }
    catch (e)
    {
        console.error(e);
        return;
    }
};

TraceablePeerConnection.prototype.removeStream = function (stream, stopStreams) {
    this.trace('removeStream', stream.id);
    APP.simulcast.resetSender();
    if(stopStreams) {
        stream.getAudioTracks().forEach(function (track) {
            track.stop();
        });
        stream.getVideoTracks().forEach(function (track) {
            track.stop();
        });
    }

    try {
        // FF doesn't support this yet.
        this.peerconnection.removeStream(stream);
    } catch (e) {
        console.error(e);
    }
};

TraceablePeerConnection.prototype.createDataChannel = function (label, opts) {
    this.trace('createDataChannel', label, opts);
    return this.peerconnection.createDataChannel(label, opts);
};

TraceablePeerConnection.prototype.setLocalDescription = function (description, successCallback, failureCallback) {
    this.trace('setLocalDescription::preTransform (Plan B)', dumpSDP(description));
    // if we're running on FF, transform to Plan A first.
    if (navigator.mozGetUserMedia) {
        description = this.interop.toPlanA(description);
    } else {
        description = APP.simulcast.transformLocalDescription(description);
    }
    this.trace('setLocalDescription::postTransform (Plan A)', dumpSDP(description));
    var self = this;
    this.peerconnection.setLocalDescription(description,
        function () {
            self.trace('setLocalDescriptionOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('setLocalDescriptionOnFailure', err);
            failureCallback(err);
        }
    );
    /*
     if (this.statsinterval === null && this.maxstats > 0) {
     // start gathering stats
     }
     */
};

TraceablePeerConnection.prototype.setRemoteDescription = function (description, successCallback, failureCallback) {
    this.trace('setRemoteDescription::preTransform (Plan B)', dumpSDP(description));
    // if we're running on FF, transform to Plan A first.
    if (navigator.mozGetUserMedia) {
        description = this.interop.toPlanA(description);
    }
    else {
        description = APP.simulcast.transformRemoteDescription(description);
    }
    this.trace('setRemoteDescription::postTransform (Plan A)', dumpSDP(description));
    var self = this;
    this.peerconnection.setRemoteDescription(description,
        function () {
            self.trace('setRemoteDescriptionOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('setRemoteDescriptionOnFailure', err);
            failureCallback(err);
        }
    );
    /*
     if (this.statsinterval === null && this.maxstats > 0) {
     // start gathering stats
     }
     */
};

TraceablePeerConnection.prototype.close = function () {
    this.trace('stop');
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
    this.peerconnection.close();
};

TraceablePeerConnection.prototype.createOffer = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createOffer', JSON.stringify(constraints, null, ' '));
    this.peerconnection.createOffer(
        function (offer) {
            self.trace('createOfferOnSuccess::preTransform (Plan A)', dumpSDP(offer));
            // if we're running on FF, transform to Plan B first.
            if (navigator.mozGetUserMedia) {
                offer = self.interop.toPlanB(offer);
            }
            self.trace('createOfferOnSuccess::postTransform (Plan B)', dumpSDP(offer));
            successCallback(offer);
        },
        function(err) {
            self.trace('createOfferOnFailure', err);
            failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.createAnswer = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createAnswer', JSON.stringify(constraints, null, ' '));
    this.peerconnection.createAnswer(
        function (answer) {
            self.trace('createAnswerOnSuccess::preTransfom (Plan A)', dumpSDP(answer));
            // if we're running on FF, transform to Plan A first.
            if (navigator.mozGetUserMedia) {
                answer = self.interop.toPlanB(answer);
            } else {
                answer = APP.simulcast.transformAnswer(answer);
            }
            self.trace('createAnswerOnSuccess::postTransfom (Plan B)', dumpSDP(answer));
            successCallback(answer);
        },
        function(err) {
            self.trace('createAnswerOnFailure', err);
            failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.addIceCandidate = function (candidate, successCallback, failureCallback) {
    var self = this;
    this.trace('addIceCandidate', JSON.stringify(candidate, null, ' '));
    this.peerconnection.addIceCandidate(candidate);
    /* maybe later
     this.peerconnection.addIceCandidate(candidate,
     function () {
     self.trace('addIceCandidateOnSuccess');
     successCallback();
     },
     function (err) {
     self.trace('addIceCandidateOnFailure', err);
     failureCallback(err);
     }
     );
     */
};

TraceablePeerConnection.prototype.getStats = function(callback, errback) {
    if (navigator.mozGetUserMedia) {
        // ignore for now...
        if(!errback)
            errback = function () {

            }
        this.peerconnection.getStats(null,callback,errback);
    } else {
        this.peerconnection.getStats(callback);
    }
};

module.exports = TraceablePeerConnection;


},{"sdp-interop":81}],53:[function(require,module,exports){
/* global $, $iq, APP, config, connection, UI, messageHandler,
 roomName, sessionTerminated, Strophe, Util */
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var Settings = require("../settings/Settings");

var AuthenticationEvents
    = require("../../service/authentication/AuthenticationEvents");

/**
 * Contains logic responsible for enabling/disabling functionality available
 * only to moderator users.
 */
var connection = null;
var focusUserJid;

function createExpBackoffTimer(step) {
    var count = 1;
    return function (reset) {
        // Reset call
        if (reset) {
            count = 1;
            return;
        }
        // Calculate next timeout
        var timeout = Math.pow(2, count - 1);
        count += 1;
        return timeout * step;
    };
}

var getNextTimeout = createExpBackoffTimer(1000);
var getNextErrorTimeout = createExpBackoffTimer(1000);
// External authentication stuff
var externalAuthEnabled = false;
// Sip gateway can be enabled by configuring Jigasi host in config.js or
// it will be enabled automatically if focus detects the component through
// service discovery.
var sipGatewayEnabled = config.hosts.call_control !== undefined;

var eventEmitter = null;

var Moderator = {
    isModerator: function () {
        return connection && connection.emuc.isModerator();
    },

    isPeerModerator: function (peerJid) {
        return connection &&
            connection.emuc.getMemberRole(peerJid) === 'moderator';
    },

    isExternalAuthEnabled: function () {
        return externalAuthEnabled;
    },

    isSipGatewayEnabled: function () {
        return sipGatewayEnabled;
    },

    setConnection: function (con) {
        connection = con;
    },

    init: function (xmpp, emitter) {
        this.xmppService = xmpp;
        eventEmitter = emitter;

        // Message listener that talks to POPUP window
        function listener(event) {
            if (event.data && event.data.sessionId) {
                if (event.origin !== window.location.origin) {
                    console.warn(
                        "Ignoring sessionId from different origin: " + event.origin);
                    return;
                }
                localStorage.setItem('sessionId', event.data.sessionId);
                // After popup is closed we will authenticate
            }
        }
        // Register
        if (window.addEventListener) {
            window.addEventListener("message", listener, false);
        } else {
            window.attachEvent("onmessage", listener);
        }
    },

    onMucLeft: function (jid) {
        console.info("Someone left is it focus ? " + jid);
        var resource = Strophe.getResourceFromJid(jid);
        if (resource === 'focus' && !this.xmppService.sessionTerminated) {
            console.info(
                "Focus has left the room - leaving conference");
            //hangUp();
            // We'd rather reload to have everything re-initialized
            // FIXME: show some message before reload
            location.reload();
        }
    },
    
    setFocusUserJid: function (focusJid) {
        if (!focusUserJid) {
            focusUserJid = focusJid;
            console.info("Focus jid set to: " + focusUserJid);
        }
    },

    getFocusUserJid: function () {
        return focusUserJid;
    },

    getFocusComponent: function () {
        // Get focus component address
        var focusComponent = config.hosts.focus;
        // If not specified use default: 'focus.domain'
        if (!focusComponent) {
            focusComponent = 'focus.' + config.hosts.domain;
        }
        return focusComponent;
    },

    createConferenceIq: function (roomName) {
        // Generate create conference IQ
        var elem = $iq({to: Moderator.getFocusComponent(), type: 'set'});

        // Session Id used for authentication
        var sessionId = localStorage.getItem('sessionId');
        var machineUID = Settings.getSettings().uid;

        console.info(
            "Session ID: " + sessionId + " machine UID: " + machineUID);

        elem.c('conference', {
            xmlns: 'http://jitsi.org/protocol/focus',
            room: roomName,
            'machine-uid': machineUID
        });

        if (sessionId) {
            elem.attrs({ 'session-id': sessionId});
        }

        if (config.hosts.bridge !== undefined) {
            elem.c(
                'property',
                { name: 'bridge', value: config.hosts.bridge})
                .up();
        }
        // Tell the focus we have Jigasi configured
        if (config.hosts.call_control !== undefined) {
            elem.c(
                'property',
                { name: 'call_control', value: config.hosts.call_control})
                .up();
        }
        if (config.channelLastN !== undefined) {
            elem.c(
                'property',
                { name: 'channelLastN', value: config.channelLastN})
                .up();
        }
        if (config.adaptiveLastN !== undefined) {
            elem.c(
                'property',
                { name: 'adaptiveLastN', value: config.adaptiveLastN})
                .up();
        }
        if (config.adaptiveSimulcast !== undefined) {
            elem.c(
                'property',
                { name: 'adaptiveSimulcast', value: config.adaptiveSimulcast})
                .up();
        }
        if (config.openSctp !== undefined) {
            elem.c(
                'property',
                { name: 'openSctp', value: config.openSctp})
                .up();
        }
        var roomName = APP.UI.generateRoomName();
        if (typeof roomName !== 'string') roomName = '';
        if (config.enableFirefoxSupport !== undefined && roomName.indexOf('rembson@') === -1) {
            elem.c(
                'property',
                { name: 'enableFirefoxHacks',
                    value: config.enableFirefoxSupport})
                .up();
        }
        elem.up();
        return elem;
    },

    parseSessionId: function (resultIq) {
        var sessionId = $(resultIq).find('conference').attr('session-id');
        if (sessionId) {
            console.info('Received sessionId: ' + sessionId);
            localStorage.setItem('sessionId', sessionId);
        }
    },

    parseConfigOptions: function (resultIq) {

        Moderator.setFocusUserJid(
            $(resultIq).find('conference').attr('focusjid'));

        var authenticationEnabled
            = $(resultIq).find(
                '>conference>property' +
                '[name=\'authentication\'][value=\'true\']').length > 0;

        console.info("Authentication enabled: " + authenticationEnabled);

        externalAuthEnabled
            = $(resultIq).find(
                '>conference>property' +
                '[name=\'externalAuth\'][value=\'true\']').length > 0;

        console.info('External authentication enabled: ' + externalAuthEnabled);

        if (!externalAuthEnabled) {
            // We expect to receive sessionId in 'internal' authentication mode
            Moderator.parseSessionId(resultIq);
        }

        var authIdentity = $(resultIq).find('>conference').attr('identity');

        eventEmitter.emit(AuthenticationEvents.IDENTITY_UPDATED,
            authenticationEnabled, authIdentity);
    
        // Check if focus has auto-detected Jigasi component(this will be also
        // included if we have passed our host from the config)
        if ($(resultIq).find(
            '>conference>property' +
            '[name=\'sipGatewayEnabled\'][value=\'true\']').length) {
            sipGatewayEnabled = true;
        }
    
        console.info("Sip gateway enabled: " + sipGatewayEnabled);
    },

    // FIXME: we need to show the fact that we're waiting for the focus
    // to the user(or that focus is not available)
    allocateConferenceFocus: function (roomName, callback) {
        // Try to use focus user JID from the config
        Moderator.setFocusUserJid(config.focusUserJid);
        // Send create conference IQ
        var iq = Moderator.createConferenceIq(roomName);
        var self = this;
        connection.sendIQ(
            iq,
            function (result) {

                // Setup config options
                Moderator.parseConfigOptions(result);

                if ('true' === $(result).find('conference').attr('ready')) {
                    // Reset both timers
                    getNextTimeout(true);
                    getNextErrorTimeout(true);
                    // Exec callback
                    callback();
                } else {
                    var waitMs = getNextTimeout();
                    console.info("Waiting for the focus... " + waitMs);
                    // Reset error timeout
                    getNextErrorTimeout(true);
                    window.setTimeout(
                        function () {
                            Moderator.allocateConferenceFocus(
                                roomName, callback);
                        }, waitMs);
                }
            },
            function (error) {
                // Invalid session ? remove and try again
                // without session ID to get a new one
                var invalidSession
                    = $(error).find('>error>session-invalid').length;
                if (invalidSession) {
                    console.info("Session expired! - removing");
                    localStorage.removeItem("sessionId");
                }
                if ($(error).find('>error>graceful-shutdown').length) {
                    eventEmitter.emit(XMPPEvents.GRACEFUL_SHUTDOWN);
                    return;
                }
                // Check for error returned by the reservation system
                var reservationErr = $(error).find('>error>reservation-error');
                if (reservationErr.length) {
                    // Trigger error event
                    var errorCode = reservationErr.attr('error-code');
                    var errorMsg;
                    if ($(error).find('>error>text')) {
                        errorMsg = $(error).find('>error>text').text();
                    }
                    eventEmitter.emit(
                        XMPPEvents.RESERVATION_ERROR, errorCode, errorMsg);
                    return;
                }
                // Not authorized to create new room
                if ($(error).find('>error>not-authorized').length) {
                    console.warn("Unauthorized to start the conference", error);
                    var toDomain
                        = Strophe.getDomainFromJid(error.getAttribute('to'));
                    if (toDomain !== config.hosts.anonymousdomain) {
                        // FIXME: "is external" should come either from
                        // the focus or config.js
                        externalAuthEnabled = true;
                    }
                    eventEmitter.emit(
                        XMPPEvents.AUTHENTICATION_REQUIRED,
                        function () {
                            Moderator.allocateConferenceFocus(
                                roomName, callback);
                        });
                    return;
                }
                var waitMs = getNextErrorTimeout();
                console.error("Focus error, retry after " + waitMs, error);
                // Show message
                var focusComponent = Moderator.getFocusComponent();
                var retrySec = waitMs / 1000;
                // FIXME: message is duplicated ?
                // Do not show in case of session invalid
                // which means just a retry
                if (!invalidSession) {
                    APP.UI.messageHandler.notify(
                        null, "notify.focus",
                        'disconnected', "notify.focusFail",
                        {component: focusComponent, ms: retrySec});
                }
                // Reset response timeout
                getNextTimeout(true);
                window.setTimeout(
                    function () {
                        Moderator.allocateConferenceFocus(roomName, callback);
                    }, waitMs);
            }
        );
    },

    getLoginUrl: function (roomName, urlCallback) {
        var iq = $iq({to: Moderator.getFocusComponent(), type: 'get'});
        iq.c('login-url', {
            xmlns: 'http://jitsi.org/protocol/focus',
            room: roomName,
            'machine-uid': Settings.getSettings().uid
        });
        connection.sendIQ(
            iq,
            function (result) {
                var url = $(result).find('login-url').attr('url');
                url = url = decodeURIComponent(url);
                if (url) {
                    console.info("Got auth url: " + url);
                    urlCallback(url);
                } else {
                    console.error(
                        "Failed to get auth url from the focus", result);
                }
            },
            function (error) {
                console.error("Get auth url error", error);
            }
        );
    },
    getPopupLoginUrl: function (roomName, urlCallback) {
        var iq = $iq({to: Moderator.getFocusComponent(), type: 'get'});
        iq.c('login-url', {
            xmlns: 'http://jitsi.org/protocol/focus',
            room: roomName,
            'machine-uid': Settings.getSettings().uid,
            popup: true
        });
        connection.sendIQ(
            iq,
            function (result) {
                var url = $(result).find('login-url').attr('url');
                url = url = decodeURIComponent(url);
                if (url) {
                    console.info("Got POPUP auth url: " + url);
                    urlCallback(url);
                } else {
                    console.error(
                        "Failed to get POPUP auth url from the focus", result);
                }
            },
            function (error) {
                console.error('Get POPUP auth url error', error);
            }
        );
    },
    logout: function (callback) {
        var iq = $iq({to: Moderator.getFocusComponent(), type: 'set'});
        var sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
            callback();
            return;
        }
        iq.c('logout', {
            xmlns: 'http://jitsi.org/protocol/focus',
            'session-id': sessionId
        });
        connection.sendIQ(
            iq,
            function (result) {
                var logoutUrl = $(result).find('logout').attr('logout-url');
                if (logoutUrl) {
                    logoutUrl = decodeURIComponent(logoutUrl);
                }
                console.info("Log out OK, url: " + logoutUrl, result);
                localStorage.removeItem('sessionId');
                callback(logoutUrl);
            },
            function (error) {
                console.error("Logout error", error);
            }
        );
    }
};

module.exports = Moderator;




},{"../../service/authentication/AuthenticationEvents":94,"../../service/xmpp/XMPPEvents":98,"../settings/Settings":38}],54:[function(require,module,exports){
/* global $, $iq, config, connection, focusMucJid, messageHandler, Moderator,
   Toolbar, Util */
var Moderator = require("./moderator");


var recordingToken = null;
var recordingEnabled;

/**
 * Whether to use a jirecon component for recording, or use the videobridge
 * through COLIBRI.
 */
var useJirecon = (typeof config.hosts.jirecon != "undefined");

/**
 * The ID of the jirecon recording session. Jirecon generates it when we
 * initially start recording, and it needs to be used in subsequent requests
 * to jirecon.
 */
var jireconRid = null;

function setRecordingToken(token) {
    recordingToken = token;
}

function setRecording(state, token, callback, connection) {
    if (useJirecon){
        setRecordingJirecon(state, token, callback, connection);
    } else {
        setRecordingColibri(state, token, callback, connection);
    }
}

function setRecordingJirecon(state, token, callback, connection) {
    if (state == recordingEnabled){
        return;
    }

    var iq = $iq({to: config.hosts.jirecon, type: 'set'})
        .c('recording', {xmlns: 'http://jitsi.org/protocol/jirecon',
            action: state ? 'start' : 'stop',
            mucjid: connection.emuc.roomjid});
    if (!state){
        iq.attrs({rid: jireconRid});
    }

    console.log('Start recording');

    connection.sendIQ(
        iq,
        function (result) {
            // TODO wait for an IQ with the real status, since this is
            // provisional?
            jireconRid = $(result).find('recording').attr('rid');
            console.log('Recording ' + (state ? 'started' : 'stopped') +
                '(jirecon)' + result);
            recordingEnabled = state;
            if (!state){
                jireconRid = null;
            }

            callback(state);
        },
        function (error) {
            console.log('Failed to start recording, error: ', error);
            callback(recordingEnabled);
        });
}

// Sends a COLIBRI message which enables or disables (according to 'state')
// the recording on the bridge. Waits for the result IQ and calls 'callback'
// with the new recording state, according to the IQ.
function setRecordingColibri(state, token, callback, connection) {
    var elem = $iq({to: connection.emuc.focusMucJid, type: 'set'});
    elem.c('conference', {
        xmlns: 'http://jitsi.org/protocol/colibri'
    });
    elem.c('recording', {state: state, token: token});

    connection.sendIQ(elem,
        function (result) {
            console.log('Set recording "', state, '". Result:', result);
            var recordingElem = $(result).find('>conference>recording');
            var newState = ('true' === recordingElem.attr('state'));

            recordingEnabled = newState;
            callback(newState);
        },
        function (error) {
            console.warn(error);
            callback(recordingEnabled);
        }
    );
}

var Recording = {
    toggleRecording: function (tokenEmptyCallback,
                               startingCallback, startedCallback, connection) {
        if (!Moderator.isModerator()) {
            console.log(
                    'non-focus, or conference not yet organized:' +
                    ' not enabling recording');
            return;
        }

        var self = this;
        // Jirecon does not (currently) support a token.
        if (!recordingToken && !useJirecon) {
            tokenEmptyCallback(function (value) {
                setRecordingToken(value);
                self.toggleRecording(tokenEmptyCallback,
                    startingCallback, startedCallback, connection);
            });

            return;
        }

        var oldState = recordingEnabled;
        startingCallback(!oldState);
        setRecording(!oldState,
            recordingToken,
            function (state) {
                console.log("New recording state: ", state);
                if (state === oldState) {
                    // FIXME: new focus:
                    // this will not work when moderator changes
                    // during active session. Then it will assume that
                    // recording status has changed to true, but it might have
                    // been already true(and we only received actual status from
                    // the focus).
                    //
                    // SO we start with status null, so that it is initialized
                    // here and will fail only after second click, so if invalid
                    // token was used we have to press the button twice before
                    // current status will be fetched and token will be reset.
                    //
                    // Reliable way would be to return authentication error.
                    // Or status update when moderator connects.
                    // Or we have to stop recording session when current
                    // moderator leaves the room.

                    // Failed to change, reset the token because it might
                    // have been wrong
                    setRecordingToken(null);
                }
                startedCallback(state);

            },
            connection
        );
    }

}

module.exports = Recording;
},{"./moderator":53}],55:[function(require,module,exports){
/* jshint -W117 */
/* a simple MUC connection plugin
 * can only handle a single MUC room
 */
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var Moderator = require("./moderator");
var JingleSession = require("./JingleSession");

var bridgeIsDown = false;

module.exports = function(XMPP, eventEmitter) {
    Strophe.addConnectionPlugin('emuc', {
        connection: null,
        roomjid: null,
        myroomjid: null,
        members: {},
        list_members: [], // so we can elect a new focus
        presMap: {},
        preziMap: {},
        joined: false,
        isOwner: false,
        role: null,
        focusMucJid: null,
        ssrc2jid: {},
        init: function (conn) {
            this.connection = conn;
        },
        initPresenceMap: function (myroomjid) {
            this.presMap['to'] = myroomjid;
            this.presMap['xns'] = 'http://jabber.org/protocol/muc';
        },
        doJoin: function (jid, password) {
            this.myroomjid = jid;

            console.info("Joined MUC as " + this.myroomjid);

            this.initPresenceMap(this.myroomjid);

            if (!this.roomjid) {
                this.roomjid = Strophe.getBareJidFromJid(jid);
                // add handlers (just once)
                this.connection.addHandler(this.onPresence.bind(this), null, 'presence', null, null, this.roomjid, {matchBare: true});
                this.connection.addHandler(this.onPresenceUnavailable.bind(this), null, 'presence', 'unavailable', null, this.roomjid, {matchBare: true});
                this.connection.addHandler(this.onPresenceError.bind(this), null, 'presence', 'error', null, this.roomjid, {matchBare: true});
                this.connection.addHandler(this.onMessage.bind(this), null, 'message', null, null, this.roomjid, {matchBare: true});
            }
            if (password !== undefined) {
                this.presMap['password'] = password;
            }
            this.sendPresence();
        },
        doLeave: function () {
            console.log("do leave", this.myroomjid);
            var pres = $pres({to: this.myroomjid, type: 'unavailable' });
            this.presMap.length = 0;
            this.connection.send(pres);
        },
        createNonAnonymousRoom: function () {
            // http://xmpp.org/extensions/xep-0045.html#createroom-reserved

            var getForm = $iq({type: 'get', to: this.roomjid})
                .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'})
                .c('x', {xmlns: 'jabber:x:data', type: 'submit'});

            var self = this;

            this.connection.sendIQ(getForm, function (form) {

                if (!$(form).find(
                        '>query>x[xmlns="jabber:x:data"]' +
                        '>field[var="muc#roomconfig_whois"]').length) {

                    console.error('non-anonymous rooms not supported');
                    return;
                }

                var formSubmit = $iq({to: this.roomjid, type: 'set'})
                    .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});

                formSubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});

                formSubmit.c('field', {'var': 'FORM_TYPE'})
                    .c('value')
                    .t('http://jabber.org/protocol/muc#roomconfig').up().up();

                formSubmit.c('field', {'var': 'muc#roomconfig_whois'})
                    .c('value').t('anyone').up().up();

                self.connection.sendIQ(formSubmit);

            }, function (error) {
                console.error("Error getting room configuration form");
            });
        },
        onPresence: function (pres) {
            var from = pres.getAttribute('from');

            // What is this for? A workaround for something?
            if (pres.getAttribute('type')) {
                return true;
            }

            // Parse etherpad tag.
            var etherpad = $(pres).find('>etherpad');
            if (etherpad.length) {
                if (config.etherpad_base && !Moderator.isModerator()) {
                    eventEmitter.emit(XMPPEvents.ETHERPAD, etherpad.text());
                }
            }

            // Parse prezi tag.
            var presentation = $(pres).find('>prezi');
            if (presentation.length) {
                var url = presentation.attr('url');
                var current = presentation.find('>current').text();

                console.log('presentation info received from', from, url);

                if (this.preziMap[from] == null) {
                    this.preziMap[from] = url;

                    $(document).trigger('presentationadded.muc', [from, url, current]);
                }
                else {
                    $(document).trigger('gotoslide.muc', [from, url, current]);
                }
            }
            else if (this.preziMap[from] != null) {
                var url = this.preziMap[from];
                delete this.preziMap[from];
                $(document).trigger('presentationremoved.muc', [from, url]);
            }

            // Parse audio info tag.
            var audioMuted = $(pres).find('>audiomuted');
            if (audioMuted.length) {
                $(document).trigger('audiomuted.muc', [from, audioMuted.text()]);
            }

            // Parse video info tag.
            var videoMuted = $(pres).find('>videomuted');
            if (videoMuted.length) {
                $(document).trigger('videomuted.muc', [from, videoMuted.text()]);
            }

            var stats = $(pres).find('>stats');
            if (stats.length) {
                var statsObj = {};
                Strophe.forEachChild(stats[0], "stat", function (el) {
                    statsObj[el.getAttribute("name")] = el.getAttribute("value");
                });
                eventEmitter.emit(XMPPEvents.REMOTE_STATS, from, statsObj);
            }

            // Parse status.
            if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="201"]').length) {
                this.isOwner = true;
                this.createNonAnonymousRoom();
            }

            // Parse roles.
            var member = {};
            member.show = $(pres).find('>show').text();
            member.status = $(pres).find('>status').text();
            var tmp = $(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>item');
            member.affiliation = tmp.attr('affiliation');
            member.role = tmp.attr('role');

            // Focus recognition
            member.jid = tmp.attr('jid');
            member.isFocus = false;
            if (member.jid
                && member.jid.indexOf(Moderator.getFocusUserJid() + "/") == 0) {
                member.isFocus = true;
            }

            var nicktag = $(pres).find('>nick[xmlns="http://jabber.org/protocol/nick"]');
            member.displayName = (nicktag.length > 0 ? nicktag.html() : null);

            if (from == this.myroomjid) {
                if (member.affiliation == 'owner') this.isOwner = true;
                if (this.role !== member.role) {
                    this.role = member.role;

                    eventEmitter.emit(XMPPEvents.LOCALROLE_CHANGED,
                        from, member, pres, Moderator.isModerator());
                }
                if (!this.joined) {
                    this.joined = true;
                    eventEmitter.emit(XMPPEvents.MUC_JOINED, from, member);
                    this.list_members.push(from);
                }
            } else if (this.members[from] === undefined) {
                // new participant
                this.members[from] = member;
                this.list_members.push(from);
                console.log('entered', from, member);
                if (member.isFocus) {
                    this.focusMucJid = from;
                    console.info("Ignore focus: " + from + ", real JID: " + member.jid);
                }
                else {
                    var id = $(pres).find('>userID').text();
                    var email = $(pres).find('>email');
                    if (email.length > 0) {
                        id = email.text();
                    }
                    eventEmitter.emit(XMPPEvents.MUC_ENTER, from, id, member.displayName);
                }
            } else {
                // Presence update for existing participant
                // Watch role change:
                if (this.members[from].role != member.role) {
                    this.members[from].role = member.role;
                    eventEmitter.emit(XMPPEvents.MUC_ROLE_CHANGED,
                        member.role, member.displayName);
                }
            }

            // Always trigger presence to update bindings
            this.parsePresence(from, member, pres);

            // Trigger status message update
            if (member.status) {
                eventEmitter.emit(XMPPEvents.PRESENCE_STATUS, from, member);
            }

            return true;
        },
        onPresenceUnavailable: function (pres) {
            var from = pres.getAttribute('from');
            // room destroyed ?
            if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]' +
                             '>destroy').length) {
                var reason;
                var reasonSelect = $(pres).find(
                    '>x[xmlns="http://jabber.org/protocol/muc#user"]' +
                    '>destroy>reason');
                if (reasonSelect.length) {
                    reason = reasonSelect.text();
                }
                XMPP.disposeConference(false);
                eventEmitter.emit(XMPPEvents.MUC_DESTROYED, reason);
                return true;
            }
            // Status code 110 indicates that this notification is "self-presence".
            if (!$(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="110"]').length) {
                delete this.members[from];
                this.list_members.splice(this.list_members.indexOf(from), 1);
                this.onParticipantLeft(from);
            }
            // If the status code is 110 this means we're leaving and we would like
            // to remove everyone else from our view, so we trigger the event.
            else if (this.list_members.length > 1) {
                for (var i = 0; i < this.list_members.length; i++) {
                    var member = this.list_members[i];
                    delete this.members[i];
                    this.list_members.splice(i, 1);
                    this.onParticipantLeft(member);
                }
            }
            if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="307"]').length) {
                $(document).trigger('kicked.muc', [from]);
                if (this.myroomjid === from) {
                    XMPP.disposeConference(false);
                    eventEmitter.emit(XMPPEvents.KICKED);
                }
            }
            return true;
        },
        onPresenceError: function (pres) {
            var from = pres.getAttribute('from');
            if ($(pres).find('>error[type="auth"]>not-authorized[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
                console.log('on password required', from);
                var self = this;
                eventEmitter.emit(XMPPEvents.PASSWORD_REQUIRED, function (value) {
                    self.doJoin(from, value);
                });
            } else if ($(pres).find(
                '>error[type="cancel"]>not-allowed[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
                var toDomain = Strophe.getDomainFromJid(pres.getAttribute('to'));
                if (toDomain === config.hosts.anonymousdomain) {
                    // enter the room by replying with 'not-authorized'. This would
                    // result in reconnection from authorized domain.
                    // We're either missing Jicofo/Prosody config for anonymous
                    // domains or something is wrong.
//                    XMPP.promptLogin();
                    APP.UI.messageHandler.openReportDialog(null,
                        "dialog.joinError", pres);
                } else {
                    console.warn('onPresError ', pres);
                    APP.UI.messageHandler.openReportDialog(null,
                        "dialog.connectError",
                        pres);
                }
            } else {
                console.warn('onPresError ', pres);
                APP.UI.messageHandler.openReportDialog(null,
                    "dialog.connectError",
                    pres);
            }
            return true;
        },
        sendMessage: function (body, nickname) {
            var msg = $msg({to: this.roomjid, type: 'groupchat'});
            msg.c('body', body).up();
            if (nickname) {
                msg.c('nick', {xmlns: 'http://jabber.org/protocol/nick'}).t(nickname).up().up();
            }
            this.connection.send(msg);
            eventEmitter.emit(XMPPEvents.SENDING_CHAT_MESSAGE, body);
        },
        setSubject: function (subject) {
            var msg = $msg({to: this.roomjid, type: 'groupchat'});
            msg.c('subject', subject);
            this.connection.send(msg);
            console.log("topic changed to " + subject);
        },
        onMessage: function (msg) {
            // FIXME: this is a hack. but jingle on muc makes nickchanges hard
            var from = msg.getAttribute('from');
            var nick =
                $(msg).find('>nick[xmlns="http://jabber.org/protocol/nick"]')
                    .text() ||
                Strophe.getResourceFromJid(from);

            var txt = $(msg).find('>body').text();
            var type = msg.getAttribute("type");
            if (type == "error") {
                eventEmitter.emit(XMPPEvents.CHAT_ERROR_RECEIVED,
                    $(msg).find('>text').text(), txt);
                return true;
            }

            var subject = $(msg).find('>subject');
            if (subject.length) {
                var subjectText = subject.text();
                if (subjectText || subjectText == "") {
                    eventEmitter.emit(XMPPEvents.SUBJECT_CHANGED, subjectText);
                    console.log("Subject is changed to " + subjectText);
                }
            }


            if (txt) {
                console.log('chat', nick, txt);
                eventEmitter.emit(XMPPEvents.MESSAGE_RECEIVED,
                    from, nick, txt, this.myroomjid);
            }
            return true;
        },
        lockRoom: function (key, onSuccess, onError, onNotSupported) {
            //http://xmpp.org/extensions/xep-0045.html#roomconfig
            var ob = this;
            this.connection.sendIQ($iq({to: this.roomjid, type: 'get'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'}),
                function (res) {
                    if ($(res).find('>query>x[xmlns="jabber:x:data"]>field[var="muc#roomconfig_roomsecret"]').length) {
                        var formsubmit = $iq({to: ob.roomjid, type: 'set'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});
                        formsubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});
                        formsubmit.c('field', {'var': 'FORM_TYPE'}).c('value').t('http://jabber.org/protocol/muc#roomconfig').up().up();
                        formsubmit.c('field', {'var': 'muc#roomconfig_roomsecret'}).c('value').t(key).up().up();
                        // Fixes a bug in prosody 0.9.+ https://code.google.com/p/lxmppd/issues/detail?id=373
                        formsubmit.c('field', {'var': 'muc#roomconfig_whois'}).c('value').t('anyone').up().up();
                        // FIXME: is muc#roomconfig_passwordprotectedroom required?
                        ob.connection.sendIQ(formsubmit,
                            onSuccess,
                            onError);
                    } else {
                        onNotSupported();
                    }
                }, onError);
        },
        kick: function (jid) {
            var kickIQ = $iq({to: this.roomjid, type: 'set'})
                .c('query', {xmlns: 'http://jabber.org/protocol/muc#admin'})
                .c('item', {nick: Strophe.getResourceFromJid(jid), role: 'none'})
                .c('reason').t('You have been kicked.').up().up().up();

            this.connection.sendIQ(
                kickIQ,
                function (result) {
                    console.log('Kick participant with jid: ', jid, result);
                },
                function (error) {
                    console.log('Kick participant error: ', error);
                });
        },
        sendPresence: function () {
            var pres = $pres({to: this.presMap['to'] });
            pres.c('x', {xmlns: this.presMap['xns']});

            if (this.presMap['password']) {
                pres.c('password').t(this.presMap['password']).up();
            }

            pres.up();

            // Send XEP-0115 'c' stanza that contains our capabilities info
            if (this.connection.caps) {
                this.connection.caps.node = config.clientNode;
                pres.c('c', this.connection.caps.generateCapsAttrs()).up();
            }

            pres.c('user-agent', {xmlns: 'http://jitsi.org/jitmeet/user-agent'})
                .t(navigator.userAgent).up();

            if (this.presMap['bridgeIsDown']) {
                pres.c('bridgeIsDown').up();
            }

            if (this.presMap['email']) {
                pres.c('email').t(this.presMap['email']).up();
            }

            if (this.presMap['userId']) {
                pres.c('userId').t(this.presMap['userId']).up();
            }

            if (this.presMap['displayName']) {
                // XEP-0172
                pres.c('nick', {xmlns: 'http://jabber.org/protocol/nick'})
                    .t(this.presMap['displayName']).up();
            }

            if (this.presMap['audions']) {
                pres.c('audiomuted', {xmlns: this.presMap['audions']})
                    .t(this.presMap['audiomuted']).up();
            }

            if (this.presMap['videons']) {
                pres.c('videomuted', {xmlns: this.presMap['videons']})
                    .t(this.presMap['videomuted']).up();
            }

            if (this.presMap['statsns']) {
                var stats = pres.c('stats', {xmlns: this.presMap['statsns']});
                for (var stat in this.presMap["stats"])
                    if (this.presMap["stats"][stat] != null)
                        stats.c("stat", {name: stat, value: this.presMap["stats"][stat]}).up();
                pres.up();
            }

            if (this.presMap['prezins']) {
                pres.c('prezi',
                    {xmlns: this.presMap['prezins'],
                        'url': this.presMap['preziurl']})
                    .c('current').t(this.presMap['prezicurrent']).up().up();
            }

            if (this.presMap['etherpadns']) {
                pres.c('etherpad', {xmlns: this.presMap['etherpadns']})
                    .t(this.presMap['etherpadname']).up();
            }

            if (this.presMap['medians']) {
                pres.c('media', {xmlns: this.presMap['medians']});
                var sourceNumber = 0;
                Object.keys(this.presMap).forEach(function (key) {
                    if (key.indexOf('source') >= 0) {
                        sourceNumber++;
                    }
                });
                if (sourceNumber > 0)
                    for (var i = 1; i <= sourceNumber / 3; i++) {
                        pres.c('source',
                            {type: this.presMap['source' + i + '_type'],
                                ssrc: this.presMap['source' + i + '_ssrc'],
                                direction: this.presMap['source' + i + '_direction']
                                    || 'sendrecv' }
                        ).up();
                    }
            }

            pres.up();
            this.connection.send(pres);
        },
        addDisplayNameToPresence: function (displayName) {
            this.presMap['displayName'] = displayName;
        },
        addMediaToPresence: function (sourceNumber, mtype, ssrcs, direction) {
            if (!this.presMap['medians'])
                this.presMap['medians'] = 'http://estos.de/ns/mjs';

            this.presMap['source' + sourceNumber + '_type'] = mtype;
            this.presMap['source' + sourceNumber + '_ssrc'] = ssrcs;
            this.presMap['source' + sourceNumber + '_direction'] = direction;
        },
        clearPresenceMedia: function () {
            var self = this;
            Object.keys(this.presMap).forEach(function (key) {
                if (key.indexOf('source') != -1) {
                    delete self.presMap[key];
                }
            });
        },
        addPreziToPresence: function (url, currentSlide) {
            this.presMap['prezins'] = 'http://jitsi.org/jitmeet/prezi';
            this.presMap['preziurl'] = url;
            this.presMap['prezicurrent'] = currentSlide;
        },
        removePreziFromPresence: function () {
            delete this.presMap['prezins'];
            delete this.presMap['preziurl'];
            delete this.presMap['prezicurrent'];
        },
        addCurrentSlideToPresence: function (currentSlide) {
            this.presMap['prezicurrent'] = currentSlide;
        },
        getPrezi: function (roomjid) {
            return this.preziMap[roomjid];
        },
        addEtherpadToPresence: function (etherpadName) {
            this.presMap['etherpadns'] = 'http://jitsi.org/jitmeet/etherpad';
            this.presMap['etherpadname'] = etherpadName;
        },
        addAudioInfoToPresence: function (isMuted) {
            this.presMap['audions'] = 'http://jitsi.org/jitmeet/audio';
            this.presMap['audiomuted'] = isMuted.toString();
        },
        addVideoInfoToPresence: function (isMuted) {
            this.presMap['videons'] = 'http://jitsi.org/jitmeet/video';
            this.presMap['videomuted'] = isMuted.toString();
        },
        addConnectionInfoToPresence: function (stats) {
            this.presMap['statsns'] = 'http://jitsi.org/jitmeet/stats';
            this.presMap['stats'] = stats;
        },
        findJidFromResource: function (resourceJid) {
            if (resourceJid &&
                resourceJid === Strophe.getResourceFromJid(this.myroomjid)) {
                return this.myroomjid;
            }
            var peerJid = null;
            Object.keys(this.members).some(function (jid) {
                peerJid = jid;
                return Strophe.getResourceFromJid(jid) === resourceJid;
            });
            return peerJid;
        },
        addBridgeIsDownToPresence: function () {
            this.presMap['bridgeIsDown'] = true;
        },
        addEmailToPresence: function (email) {
            this.presMap['email'] = email;
        },
        addUserIdToPresence: function (userId) {
            this.presMap['userId'] = userId;
        },
        isModerator: function () {
            return this.role === 'moderator';
        },
        getMemberRole: function (peerJid) {
            if (this.members[peerJid]) {
                return this.members[peerJid].role;
            }
            return null;
        },
        onParticipantLeft: function (jid) {

            eventEmitter.emit(XMPPEvents.MUC_LEFT, jid);

            this.connection.jingle.terminateByJid(jid);

            if (this.getPrezi(jid)) {
                $(document).trigger('presentationremoved.muc',
                    [jid, this.getPrezi(jid)]);
            }

            Moderator.onMucLeft(jid);
        },
        parsePresence: function (from, memeber, pres) {
            if($(pres).find(">bridgeIsDown").length > 0 && !bridgeIsDown) {
                bridgeIsDown = true;
                eventEmitter.emit(XMPPEvents.BRIDGE_DOWN);
            }

            if(memeber.isFocus)
                return;

            var self = this;
            // Remove old ssrcs coming from the jid
            Object.keys(this.ssrc2jid).forEach(function (ssrc) {
                if (self.ssrc2jid[ssrc] == from) {
                    delete self.ssrc2jid[ssrc];
                }
            });

            var changedStreams = [];
            $(pres).find('>media[xmlns="http://estos.de/ns/mjs"]>source').each(function (idx, ssrc) {
                //console.log(jid, 'assoc ssrc', ssrc.getAttribute('type'), ssrc.getAttribute('ssrc'));
                var ssrcV = ssrc.getAttribute('ssrc');
                self.ssrc2jid[ssrcV] = from;
                JingleSession.notReceivedSSRCs.push(ssrcV);


                var type = ssrc.getAttribute('type');

                var direction = ssrc.getAttribute('direction');

                changedStreams.push({type: type, direction: direction});

            });

            eventEmitter.emit(XMPPEvents.CHANGED_STREAMS, from, changedStreams);

            var displayName = !config.displayJids
                ? memeber.displayName : Strophe.getResourceFromJid(from);

            if (displayName && displayName.length > 0)
            {
                eventEmitter.emit(XMPPEvents.DISPLAY_NAME_CHANGED, from, displayName);
            }


            var id = $(pres).find('>userID').text();
            var email = $(pres).find('>email');
            if(email.length > 0) {
                id = email.text();
            }

            eventEmitter.emit(XMPPEvents.USER_ID_CHANGED, from, id);
        }
    });
};


},{"../../service/xmpp/XMPPEvents":98,"./JingleSession":48,"./moderator":53}],56:[function(require,module,exports){
/* jshint -W117 */

var JingleSession = require("./JingleSession");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");


module.exports = function(XMPP, eventEmitter)
{
    function CallIncomingJingle(sid, connection) {
        var sess = connection.jingle.sessions[sid];

        // TODO: do we check activecall == null?
        connection.jingle.activecall = sess;

        eventEmitter.emit(XMPPEvents.CALL_INCOMING, sess);

        // TODO: check affiliation and/or role
        console.log('emuc data for', sess.peerjid, connection.emuc.members[sess.peerjid]);
        sess.usedrip = true; // not-so-naive trickle ice
        sess.sendAnswer();
        sess.accept();

    };

    Strophe.addConnectionPlugin('jingle', {
        connection: null,
        sessions: {},
        jid2session: {},
        ice_config: {iceServers: []},
        pc_constraints: {},
        activecall: null,
        media_constraints: {
            mandatory: {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true
            }
            // MozDontOfferDataChannel: true when this is firefox
        },
        init: function (conn) {
            this.connection = conn;
            if (this.connection.disco) {
                // http://xmpp.org/extensions/xep-0167.html#support
                // http://xmpp.org/extensions/xep-0176.html#support
                this.connection.disco.addFeature('urn:xmpp:jingle:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:transports:ice-udp:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:transports:dtls-sctp:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:audio');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:video');


                // this is dealt with by SDP O/A so we don't need to annouce this
                //this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:rtcp-fb:0'); // XEP-0293
                //this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:rtp-hdrext:0'); // XEP-0294
                if (config.useRtcpMux) {
                    this.connection.disco.addFeature('urn:ietf:rfc:5761'); // rtcp-mux
                }
                if (config.useBundle) {
                    this.connection.disco.addFeature('urn:ietf:rfc:5888'); // a=group, e.g. bundle
                }
                //this.connection.disco.addFeature('urn:ietf:rfc:5576'); // a=ssrc
            }
            this.connection.addHandler(this.onJingle.bind(this), 'urn:xmpp:jingle:1', 'iq', 'set', null, null);
        },
        onJingle: function (iq) {
            var sid = $(iq).find('jingle').attr('sid');
            var action = $(iq).find('jingle').attr('action');
            var fromJid = iq.getAttribute('from');
            // send ack first
            var ack = $iq({type: 'result',
                to: fromJid,
                id: iq.getAttribute('id')
            });
            console.log('on jingle ' + action + ' from ' + fromJid, iq);
            var sess = this.sessions[sid];
            if ('session-initiate' != action) {
                if (sess === null) {
                    ack.type = 'error';
                    ack.c('error', {type: 'cancel'})
                        .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                        .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                    this.connection.send(ack);
                    return true;
                }
                // compare from to sess.peerjid (bare jid comparison for later compat with message-mode)
                // local jid is not checked
                if (Strophe.getBareJidFromJid(fromJid) != Strophe.getBareJidFromJid(sess.peerjid)) {
                    console.warn('jid mismatch for session id', sid, fromJid, sess.peerjid);
                    ack.type = 'error';
                    ack.c('error', {type: 'cancel'})
                        .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                        .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                    this.connection.send(ack);
                    return true;
                }
            } else if (sess !== undefined) {
                // existing session with same session id
                // this might be out-of-order if the sess.peerjid is the same as from
                ack.type = 'error';
                ack.c('error', {type: 'cancel'})
                    .c('service-unavailable', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up();
                console.warn('duplicate session id', sid);
                this.connection.send(ack);
                return true;
            }
            // FIXME: check for a defined action
            this.connection.send(ack);
            // see http://xmpp.org/extensions/xep-0166.html#concepts-session
            switch (action) {
                case 'session-initiate':
                    sess = new JingleSession(
                        $(iq).attr('to'), $(iq).find('jingle').attr('sid'),
                        this.connection, XMPP);
                    // configure session

                    sess.media_constraints = this.media_constraints;
                    sess.pc_constraints = this.pc_constraints;
                    sess.ice_config = this.ice_config;

                    sess.initiate(fromJid, false);
                    // FIXME: setRemoteDescription should only be done when this call is to be accepted
                    sess.setRemoteDescription($(iq).find('>jingle'), 'offer');

                    this.sessions[sess.sid] = sess;
                    this.jid2session[sess.peerjid] = sess;

                    // the callback should either
                    // .sendAnswer and .accept
                    // or .sendTerminate -- not necessarily synchronus
                    CallIncomingJingle(sess.sid, this.connection);
                    break;
                case 'session-accept':
                    sess.setRemoteDescription($(iq).find('>jingle'), 'answer');
                    sess.accept();
                    $(document).trigger('callaccepted.jingle', [sess.sid]);
                    break;
                case 'session-terminate':
                    // If this is not the focus sending the terminate, we have
                    // nothing more to do here.
                    if (Object.keys(this.sessions).length < 1
                        || !(this.sessions[Object.keys(this.sessions)[0]]
                            instanceof JingleSession))
                    {
                        break;
                    }
                    console.log('terminating...', sess.sid);
                    sess.terminate();
                    this.terminate(sess.sid);
                    if ($(iq).find('>jingle>reason').length) {
                        $(document).trigger('callterminated.jingle', [
                            sess.sid,
                            sess.peerjid,
                            $(iq).find('>jingle>reason>:first')[0].tagName,
                            $(iq).find('>jingle>reason>text').text()
                        ]);
                    } else {
                        $(document).trigger('callterminated.jingle',
                            [sess.sid, sess.peerjid]);
                    }
                    break;
                case 'transport-info':
                    sess.addIceCandidate($(iq).find('>jingle>content'));
                    break;
                case 'session-info':
                    var affected;
                    if ($(iq).find('>jingle>ringing[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        $(document).trigger('ringing.jingle', [sess.sid]);
                    } else if ($(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        affected = $(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                        $(document).trigger('mute.jingle', [sess.sid, affected]);
                    } else if ($(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        affected = $(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                        $(document).trigger('unmute.jingle', [sess.sid, affected]);
                    }
                    break;
                case 'addsource': // FIXME: proprietary, un-jingleish
                case 'source-add': // FIXME: proprietary
                    sess.addSource($(iq).find('>jingle>content'), fromJid);
                    break;
                case 'removesource': // FIXME: proprietary, un-jingleish
                case 'source-remove': // FIXME: proprietary
                    sess.removeSource($(iq).find('>jingle>content'), fromJid);
                    break;
                default:
                    console.warn('jingle action not implemented', action);
                    break;
            }
            return true;
        },
        initiate: function (peerjid, myjid) { // initiate a new jinglesession to peerjid
            var sess = new JingleSession(myjid || this.connection.jid,
                Math.random().toString(36).substr(2, 12), // random string
                this.connection, XMPP);
            // configure session

            sess.media_constraints = this.media_constraints;
            sess.pc_constraints = this.pc_constraints;
            sess.ice_config = this.ice_config;

            sess.initiate(peerjid, true);
            this.sessions[sess.sid] = sess;
            this.jid2session[sess.peerjid] = sess;
            sess.sendOffer();
            return sess;
        },
        terminate: function (sid, reason, text) { // terminate by sessionid (or all sessions)
            if (sid === null || sid === undefined) {
                for (sid in this.sessions) {
                    if (this.sessions[sid].state != 'ended') {
                        this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                        this.sessions[sid].terminate();
                    }
                    delete this.jid2session[this.sessions[sid].peerjid];
                    delete this.sessions[sid];
                }
            } else if (this.sessions.hasOwnProperty(sid)) {
                if (this.sessions[sid].state != 'ended') {
                    this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                    this.sessions[sid].terminate();
                }
                delete this.jid2session[this.sessions[sid].peerjid];
                delete this.sessions[sid];
            }
        },
        // Used to terminate a session when an unavailable presence is received.
        terminateByJid: function (jid) {
            if (this.jid2session.hasOwnProperty(jid)) {
                var sess = this.jid2session[jid];
                if (sess) {
                    sess.terminate();
                    console.log('peer went away silently', jid);
                    delete this.sessions[sess.sid];
                    delete this.jid2session[jid];
                    $(document).trigger('callterminated.jingle',
                        [sess.sid, jid], 'gone');
                }
            }
        },
        terminateRemoteByJid: function (jid, reason) {
            if (this.jid2session.hasOwnProperty(jid)) {
                var sess = this.jid2session[jid];
                if (sess) {
                    sess.sendTerminate(reason || (!sess.active()) ? 'kick' : null);
                    sess.terminate();
                    console.log('terminate peer with jid', sess.sid, jid);
                    delete this.sessions[sess.sid];
                    delete this.jid2session[jid];
                    $(document).trigger('callterminated.jingle',
                        [sess.sid, jid, 'kicked']);
                }
            }
        },
        getStunAndTurnCredentials: function () {
            // get stun and turn configuration from server via xep-0215
            // uses time-limited credentials as described in
            // http://tools.ietf.org/html/draft-uberti-behave-turn-rest-00
            //
            // see https://code.google.com/p/prosody-modules/source/browse/mod_turncredentials/mod_turncredentials.lua
            // for a prosody module which implements this
            //
            // currently, this doesn't work with updateIce and therefore credentials with a long
            // validity have to be fetched before creating the peerconnection
            // TODO: implement refresh via updateIce as described in
            //      https://code.google.com/p/webrtc/issues/detail?id=1650
            var self = this;
            this.connection.sendIQ(
                $iq({type: 'get', to: this.connection.domain})
                    .c('services', {xmlns: 'urn:xmpp:extdisco:1'}).c('service', {host: 'turn.' + this.connection.domain}),
                function (res) {
                    var iceservers = [];
                    $(res).find('>services>service').each(function (idx, el) {
                        el = $(el);
                        var dict = {};
                        var type = el.attr('type');
                        switch (type) {
                            case 'stun':
                                dict.url = 'stun:' + el.attr('host');
                                if (el.attr('port')) {
                                    dict.url += ':' + el.attr('port');
                                }
                                iceservers.push(dict);
                                break;
                            case 'turn':
                            case 'turns':
                                dict.url = type + ':';
                                if (el.attr('username')) { // https://code.google.com/p/webrtc/issues/detail?id=1508
                                    if (navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) && parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10) < 28) {
                                        dict.url += el.attr('username') + '@';
                                    } else {
                                        dict.username = el.attr('username'); // only works in M28
                                    }
                                }
                                dict.url += el.attr('host');
                                if (el.attr('port') && el.attr('port') != '3478') {
                                    dict.url += ':' + el.attr('port');
                                }
                                if (el.attr('transport') && el.attr('transport') != 'udp') {
                                    dict.url += '?transport=' + el.attr('transport');
                                }
                                if (el.attr('password')) {
                                    dict.credential = el.attr('password');
                                }
                                iceservers.push(dict);
                                break;
                        }
                    });
                    self.ice_config.iceServers = iceservers;
                },
                function (err) {
                    console.warn('getting turn credentials failed', err);
                    console.warn('is mod_turncredentials or similar installed?');
                }
            );
            // implement push?
        },

        /**
         * Populates the log data
         */
        populateData: function () {
            var data = {};
            Object.keys(this.sessions).forEach(function (sid) {
                var session = this.sessions[sid];
                if (session.peerconnection && session.peerconnection.updateLog) {
                    // FIXME: should probably be a .dump call
                    data["jingle_" + session.sid] = {
                        updateLog: session.peerconnection.updateLog,
                        stats: session.peerconnection.stats,
                        url: window.location.href
                    };
                }
            });
            return data;
        }
    });
};


},{"../../service/xmpp/XMPPEvents":98,"./JingleSession":48}],57:[function(require,module,exports){
/* global Strophe */
module.exports = function () {

    Strophe.addConnectionPlugin('logger', {
        // logs raw stanzas and makes them available for download as JSON
        connection: null,
        log: [],
        init: function (conn) {
            this.connection = conn;
            this.connection.rawInput = this.log_incoming.bind(this);
            this.connection.rawOutput = this.log_outgoing.bind(this);
        },
        log_incoming: function (stanza) {
            this.log.push([new Date().getTime(), 'incoming', stanza]);
        },
        log_outgoing: function (stanza) {
            this.log.push([new Date().getTime(), 'outgoing', stanza]);
        }
    });
};
},{}],58:[function(require,module,exports){
/* global $, $iq, config, connection, focusMucJid, forceMuted,
   setAudioMuted, Strophe */
/**
 * Moderate connection plugin.
 */
module.exports = function (XMPP) {
    Strophe.addConnectionPlugin('moderate', {
        connection: null,
        init: function (conn) {
            this.connection = conn;

            this.connection.addHandler(this.onMute.bind(this),
                'http://jitsi.org/jitmeet/audio',
                'iq',
                'set',
                null,
                null);
        },
        setMute: function (jid, mute) {
            console.info("set mute", mute);
            var iqToFocus = $iq({to: this.connection.emuc.focusMucJid, type: 'set'})
                .c('mute', {
                    xmlns: 'http://jitsi.org/jitmeet/audio',
                    jid: jid
                })
                .t(mute.toString())
                .up();

            this.connection.sendIQ(
                iqToFocus,
                function (result) {
                    console.log('set mute', result);
                },
                function (error) {
                    console.log('set mute error', error);
                });
        },
        onMute: function (iq) {
            var from = iq.getAttribute('from');
            if (from !== this.connection.emuc.focusMucJid) {
                console.warn("Ignored mute from non focus peer");
                return false;
            }
            var mute = $(iq).find('mute');
            if (mute.length) {
                var doMuteAudio = mute.text() === "true";
                APP.UI.setAudioMuted(doMuteAudio);
                XMPP.forceMuted = doMuteAudio;
            }
            return true;
        },
        eject: function (jid) {
            // We're not the focus, so can't terminate
            //connection.jingle.terminateRemoteByJid(jid, 'kick');
            this.connection.emuc.kick(jid);
        }
    });
}
},{}],59:[function(require,module,exports){
/* jshint -W117 */
module.exports = function() {
    Strophe.addConnectionPlugin('rayo',
        {
            RAYO_XMLNS: 'urn:xmpp:rayo:1',
            connection: null,
            init: function (conn) {
                this.connection = conn;
                if (this.connection.disco) {
                    this.connection.disco.addFeature('urn:xmpp:rayo:client:1');
                }

                this.connection.addHandler(
                    this.onRayo.bind(this), this.RAYO_XMLNS, 'iq', 'set', null, null);
            },
            onRayo: function (iq) {
                console.info("Rayo IQ", iq);
            },
            dial: function (to, from, roomName, roomPass) {
                var self = this;
                var req = $iq(
                    {
                        type: 'set',
                        to: this.connection.emuc.focusMucJid
                    }
                );
                req.c('dial',
                    {
                        xmlns: this.RAYO_XMLNS,
                        to: to,
                        from: from
                    });
                req.c('header',
                    {
                        name: 'JvbRoomName',
                        value: roomName
                    }).up();

                if (roomPass !== null && roomPass.length) {

                    req.c('header',
                        {
                            name: 'JvbRoomPassword',
                            value: roomPass
                        }).up();
                }

                this.connection.sendIQ(
                    req,
                    function (result) {
                        console.info('Dial result ', result);

                        var resource = $(result).find('ref').attr('uri');
                        this.call_resource = resource.substr('xmpp:'.length);
                        console.info(
                                "Received call resource: " + this.call_resource);
                    },
                    function (error) {
                        console.info('Dial error ', error);
                    }
                );
            },
            hang_up: function () {
                if (!this.call_resource) {
                    console.warn("No call in progress");
                    return;
                }

                var self = this;
                var req = $iq(
                    {
                        type: 'set',
                        to: this.call_resource
                    }
                );
                req.c('hangup',
                    {
                        xmlns: this.RAYO_XMLNS
                    });

                this.connection.sendIQ(
                    req,
                    function (result) {
                        console.info('Hangup result ', result);
                        self.call_resource = null;
                    },
                    function (error) {
                        console.info('Hangup error ', error);
                        self.call_resource = null;
                    }
                );
            }
        }
    );
};

},{}],60:[function(require,module,exports){
/**
 * Strophe logger implementation. Logs from level WARN and above.
 */
module.exports = function () {

    Strophe.log = function (level, msg) {
        switch (level) {
            case Strophe.LogLevel.WARN:
                console.warn("Strophe: " + msg);
                break;
            case Strophe.LogLevel.ERROR:
            case Strophe.LogLevel.FATAL:
                console.error("Strophe: " + msg);
                break;
        }
    };

    Strophe.getStatusString = function (status) {
        switch (status) {
            case Strophe.Status.ERROR:
                return "ERROR";
            case Strophe.Status.CONNECTING:
                return "CONNECTING";
            case Strophe.Status.CONNFAIL:
                return "CONNFAIL";
            case Strophe.Status.AUTHENTICATING:
                return "AUTHENTICATING";
            case Strophe.Status.AUTHFAIL:
                return "AUTHFAIL";
            case Strophe.Status.CONNECTED:
                return "CONNECTED";
            case Strophe.Status.DISCONNECTED:
                return "DISCONNECTED";
            case Strophe.Status.DISCONNECTING:
                return "DISCONNECTING";
            case Strophe.Status.ATTACHED:
                return "ATTACHED";
            default:
                return "unknown";
        }
    };
};

},{}],61:[function(require,module,exports){
/* global $, APP, config, Strophe*/
var Moderator = require("./moderator");
var EventEmitter = require("events");
var Recording = require("./recording");
var SDP = require("./SDP");
var Pako = require("pako");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");
var UIEvents = require("../../service/UI/UIEvents");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");

var eventEmitter = new EventEmitter();
var connection = null;
var authenticatedUser = false;

function connect(jid, password) {
    connection = XMPP.createConnection();
    Moderator.setConnection(connection);

    if (connection.disco) {
        // for chrome, add multistream cap
    }
    connection.jingle.pc_constraints = APP.RTC.getPCConstraints();
    if (config.useIPv6) {
        // https://code.google.com/p/webrtc/issues/detail?id=2828
        if (!connection.jingle.pc_constraints.optional)
            connection.jingle.pc_constraints.optional = [];
        connection.jingle.pc_constraints.optional.push({googIPv6: true});
    }

    var anonymousConnectionFailed = false;
    connection.connect(jid, password, function (status, msg) {
        console.log('Strophe status changed to',
            Strophe.getStatusString(status));
        if (status === Strophe.Status.CONNECTED) {
            if (config.useStunTurn) {
                connection.jingle.getStunAndTurnCredentials();
            }

            console.info("My Jabber ID: " + connection.jid);

            if(password)
                authenticatedUser = true;
            maybeDoJoin();
        } else if (status === Strophe.Status.CONNFAIL) {
            if(msg === 'x-strophe-bad-non-anon-jid') {
                anonymousConnectionFailed = true;
            }
        } else if (status === Strophe.Status.DISCONNECTED) {
            if(anonymousConnectionFailed) {
                // prompt user for username and password
                XMPP.promptLogin();
            }
        } else if (status === Strophe.Status.AUTHFAIL) {
            // wrong password or username, prompt user
            XMPP.promptLogin();

        }
    });
}



function maybeDoJoin() {
    if (connection && connection.connected &&
        Strophe.getResourceFromJid(connection.jid)
        && (APP.RTC.localAudio || APP.RTC.localVideo)) {
        // .connected is true while connecting?
        doJoin();
    }
}

function doJoin() {
    var roomName = APP.UI.generateRoomName();

    Moderator.allocateConferenceFocus(
        roomName, APP.UI.checkForNicknameAndJoin);
}

function initStrophePlugins()
{
    require("./strophe.emuc")(XMPP, eventEmitter);
    require("./strophe.jingle")(XMPP, eventEmitter);
    require("./strophe.moderate")(XMPP);
    require("./strophe.util")();
    require("./strophe.rayo")();
    require("./strophe.logger")();
}

function registerListeners() {
    APP.RTC.addStreamListener(maybeDoJoin,
        StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
    APP.UI.addListener(UIEvents.NICKNAME_CHANGED, function (nickname) {
        XMPP.addToPresence("displayName", nickname);
    });
}

function setupEvents() {
    $(window).bind('beforeunload', function () {
        if (connection && connection.connected) {
            // ensure signout
            $.ajax({
                type: 'POST',
                url: config.bosh,
                async: false,
                cache: false,
                contentType: 'application/xml',
                data: "<body rid='" + (connection.rid || connection._proto.rid)
                    + "' xmlns='http://jabber.org/protocol/httpbind' sid='"
                    + (connection.sid || connection._proto.sid)
                    + "' type='terminate'>" +
                    "<presence xmlns='jabber:client' type='unavailable'/>" +
                    "</body>",
                success: function (data) {
                    console.log('signed out');
                    console.log(data);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log('signout error',
                            textStatus + ' (' + errorThrown + ')');
                }
            });
        }
        XMPP.disposeConference(true);
    });
}

var XMPP = {
    sessionTerminated: false,

    /**
     * XMPP connection status
     */
    Status: Strophe.Status,

    /**
     * Remembers if we were muted by the focus.
     * @type {boolean}
     */
    forceMuted: false,
    start: function () {
        setupEvents();
        initStrophePlugins();
        registerListeners();
        Moderator.init(this, eventEmitter);
        var configDomain = config.hosts.anonymousdomain || config.hosts.domain;
        // Force authenticated domain if room is appended with '?login=true'
        if (config.hosts.anonymousdomain &&
            window.location.search.indexOf("login=true") !== -1) {
            configDomain = config.hosts.domain;
        }
        var jid = configDomain || window.location.hostname;
        connect(jid, null);
    },
    createConnection: function () {
        var bosh = config.bosh || '/http-bind';

        return new Strophe.Connection(bosh);
    },
    getStatusString: function (status) {
        return Strophe.getStatusString(status);
    },
    promptLogin: function () {
        // FIXME: re-use LoginDialog which supports retries
        APP.UI.showLoginPopup(connect);
    },
    joinRoom: function(roomName, useNicks, nick)
    {
        var roomjid;
        roomjid = roomName;

        if (useNicks) {
            if (nick) {
                roomjid += '/' + nick;
            } else {
                roomjid += '/' + Strophe.getNodeFromJid(connection.jid);
            }
        } else {

            var tmpJid = Strophe.getNodeFromJid(connection.jid);

            if(!authenticatedUser)
                tmpJid = tmpJid.substr(0, 8);

            roomjid += '/' + tmpJid;
        }
        connection.emuc.doJoin(roomjid);
    },
    myJid: function () {
        if(!connection)
            return null;
        return connection.emuc.myroomjid;
    },
    myResource: function () {
        if(!connection || ! connection.emuc.myroomjid)
            return null;
        return Strophe.getResourceFromJid(connection.emuc.myroomjid);
    },
    disposeConference: function (onUnload) {
        eventEmitter.emit(XMPPEvents.DISPOSE_CONFERENCE, onUnload);
        var handler = connection.jingle.activecall;
        if (handler && handler.peerconnection) {
            // FIXME: probably removing streams is not required and close() should
            // be enough
            if (APP.RTC.localAudio) {
                handler.peerconnection.removeStream(APP.RTC.localAudio.getOriginalStream(), onUnload);
            }
            if (APP.RTC.localVideo) {
                handler.peerconnection.removeStream(APP.RTC.localVideo.getOriginalStream(), onUnload);
            }
            handler.peerconnection.close();
        }
        connection.jingle.activecall = null;
        if(!onUnload)
        {
            this.sessionTerminated = true;
            connection.emuc.doLeave();
        }
    },
    addListener: function(type, listener)
    {
        eventEmitter.on(type, listener);
    },
    removeListener: function (type, listener) {
        eventEmitter.removeListener(type, listener);
    },
    allocateConferenceFocus: function(roomName, callback) {
        Moderator.allocateConferenceFocus(roomName, callback);
    },
    getLoginUrl: function (roomName, callback) {
        Moderator.getLoginUrl(roomName, callback);
    },
    getPopupLoginUrl: function (roomName, callback) {
        Moderator.getPopupLoginUrl(roomName, callback);
    },
    isModerator: function () {
        return Moderator.isModerator();
    },
    isSipGatewayEnabled: function () {
        return Moderator.isSipGatewayEnabled();
    },
    isExternalAuthEnabled: function () {
        return Moderator.isExternalAuthEnabled();
    },
    switchStreams: function (stream, oldStream, callback) {
        if (connection && connection.jingle.activecall) {
            // FIXME: will block switchInProgress on true value in case of exception
            connection.jingle.activecall.switchStreams(stream, oldStream, callback);
        } else {
            // We are done immediately
            console.warn("No conference handler or conference not started yet");
            callback();
        }
    },
    setVideoMute: function (mute, callback, options) {
        if(!connection || !APP.RTC.localVideo)
            return;

        var localCallback = function (mute) {
            connection.emuc.addVideoInfoToPresence(mute);
            connection.emuc.sendPresence();
            return callback(mute);
        };

        if (mute == APP.RTC.localVideo.isMuted())
        {
            // Even if no change occurs, the specified callback is to be executed.
            // The specified callback may, optionally, return a successCallback
            // which is to be executed as well.
            var successCallback = localCallback(mute);

            if (successCallback) {
                successCallback();
            }
        } else {
            APP.RTC.localVideo.setMute(!mute);
            if(connection.jingle.activecall)
            {
                connection.jingle.activecall.setVideoMute(
                    mute, localCallback, options);
            }
            else {
                localCallback(mute);
            }

        }
    },
    setAudioMute: function (mute, callback) {
        if (!(connection && APP.RTC.localAudio)) {
            return false;
        }


        if (this.forceMuted && !mute) {
            console.info("Asking focus for unmute");
            connection.moderate.setMute(connection.emuc.myroomjid, mute);
            // FIXME: wait for result before resetting muted status
            this.forceMuted = false;
        }

        if (mute == APP.RTC.localAudio.isMuted()) {
            // Nothing to do
            return true;
        }

        // It is not clear what is the right way to handle multiple tracks.
        // So at least make sure that they are all muted or all unmuted and
        // that we send presence just once.
        APP.RTC.localAudio.mute();
        // isMuted is the opposite of audioEnabled
        connection.emuc.addAudioInfoToPresence(mute);
        connection.emuc.sendPresence();
        callback();
        return true;
    },
    // Really mute video, i.e. dont even send black frames
    muteVideo: function (pc, unmute) {
        // FIXME: this probably needs another of those lovely state safeguards...
        // which checks for iceconn == connected and sigstate == stable
        pc.setRemoteDescription(pc.remoteDescription,
            function () {
                pc.createAnswer(
                    function (answer) {
                        var sdp = new SDP(answer.sdp);
                        if (sdp.media.length > 1) {
                            if (unmute)
                                sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');
                            else
                                sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                            sdp.raw = sdp.session + sdp.media.join('');
                            answer.sdp = sdp.raw;
                        }
                        pc.setLocalDescription(answer,
                            function () {
                                console.log('mute SLD ok');
                            },
                            function (error) {
                                console.log('mute SLD error');
                                APP.UI.messageHandler.showError("dialog.error",
                                    "dialog.SLDFailure");
                            }
                        );
                    },
                    function (error) {
                        console.log(error);
                        APP.UI.messageHandler.showError();
                    }
                );
            },
            function (error) {
                console.log('muteVideo SRD error');
                APP.UI.messageHandler.showError("dialog.error",
                    "dialog.SRDFailure");

            }
        );
    },
    toggleRecording: function (tokenEmptyCallback,
                               startingCallback, startedCallback) {
        Recording.toggleRecording(tokenEmptyCallback,
            startingCallback, startedCallback, connection);
    },
    addToPresence: function (name, value, dontSend) {
        switch (name)
        {
            case "displayName":
                connection.emuc.addDisplayNameToPresence(value);
                break;
            case "etherpad":
                connection.emuc.addEtherpadToPresence(value);
                break;
            case "prezi":
                connection.emuc.addPreziToPresence(value, 0);
                break;
            case "preziSlide":
                connection.emuc.addCurrentSlideToPresence(value);
                break;
            case "connectionQuality":
                connection.emuc.addConnectionInfoToPresence(value);
                break;
            case "email":
                connection.emuc.addEmailToPresence(value);
            default :
                console.log("Unknown tag for presence.");
                return;
        }
        if(!dontSend)
            connection.emuc.sendPresence();
    },
    /**
     * Sends 'data' as a log message to the focus. Returns true iff a message
     * was sent.
     * @param data
     * @returns {boolean} true iff a message was sent.
     */
    sendLogs: function (data) {
        if(!connection.emuc.focusMucJid)
            return false;

        var deflate = true;

        var content = JSON.stringify(data);
        if (deflate) {
            content = String.fromCharCode.apply(null, Pako.deflateRaw(content));
        }
        content = Base64.encode(content);
        // XEP-0337-ish
        var message = $msg({to: connection.emuc.focusMucJid, type: 'normal'});
        message.c('log', { xmlns: 'urn:xmpp:eventlog',
            id: 'PeerConnectionStats'});
        message.c('message').t(content).up();
        if (deflate) {
            message.c('tag', {name: "deflated", value: "true"}).up();
        }
        message.up();

        connection.send(message);
        return true;
    },
    populateData: function () {
        var data = {};
        if (connection.jingle) {
            data = connection.jingle.populateData();
        }
        return data;
    },
    getLogger: function () {
        if(connection.logger)
            return connection.logger.log;
        return null;
    },
    getPrezi: function () {
        return connection.emuc.getPrezi(this.myJid());
    },
    removePreziFromPresence: function () {
        connection.emuc.removePreziFromPresence();
        connection.emuc.sendPresence();
    },
    sendChatMessage: function (message, nickname) {
        connection.emuc.sendMessage(message, nickname);
    },
    setSubject: function (topic) {
        connection.emuc.setSubject(topic);
    },
    lockRoom: function (key, onSuccess, onError, onNotSupported) {
        connection.emuc.lockRoom(key, onSuccess, onError, onNotSupported);
    },
    dial: function (to, from, roomName,roomPass) {
        connection.rayo.dial(to, from, roomName,roomPass);
    },
    setMute: function (jid, mute) {
        connection.moderate.setMute(jid, mute);
    },
    eject: function (jid) {
        connection.moderate.eject(jid);
    },
    logout: function (callback) {
        Moderator.logout(callback);
    },
    findJidFromResource: function (resource) {
        return connection.emuc.findJidFromResource(resource);
    },
    getMembers: function () {
        return connection.emuc.members;
    },
    getJidFromSSRC: function (ssrc) {
        if(!connection)
            return null;
        return connection.emuc.ssrc2jid[ssrc];
    },
    getMUCJoined: function () {
        return connection.emuc.joined;
    },
    getSessions: function () {
        return connection.jingle.sessions;
    }

};

module.exports = XMPP;

},{"../../service/RTC/StreamEventTypes":92,"../../service/UI/UIEvents":93,"../../service/xmpp/XMPPEvents":98,"./SDP":49,"./moderator":53,"./recording":54,"./strophe.emuc":55,"./strophe.jingle":56,"./strophe.logger":57,"./strophe.moderate":58,"./strophe.rayo":59,"./strophe.util":60,"events":62,"pako":64}],62:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],63:[function(require,module,exports){
// i18next, v1.7.7
// Copyright (c)2014 Jan Mühlemann (jamuhl).
// Distributed under MIT license
// http://i18next.com
(function() {

    // add indexOf to non ECMA-262 standard compliant browsers
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
            "use strict";
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = 0;
            if (arguments.length > 0) {
                n = Number(arguments[1]);
                if (n != n) { // shortcut for verifying if it's NaN
                    n = 0;
                } else if (n != 0 && n != Infinity && n != -Infinity) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            if (n >= len) {
                return -1;
            }
            var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
            for (; k < len; k++) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        }
    }
    
    // add lastIndexOf to non ECMA-262 standard compliant browsers
    if (!Array.prototype.lastIndexOf) {
        Array.prototype.lastIndexOf = function(searchElement /*, fromIndex*/) {
            "use strict";
            if (this == null) {
                throw new TypeError();
            }
            var t = Object(this);
            var len = t.length >>> 0;
            if (len === 0) {
                return -1;
            }
            var n = len;
            if (arguments.length > 1) {
                n = Number(arguments[1]);
                if (n != n) {
                    n = 0;
                } else if (n != 0 && n != (1 / 0) && n != -(1 / 0)) {
                    n = (n > 0 || -1) * Math.floor(Math.abs(n));
                }
            }
            var k = n >= 0 ? Math.min(n, len - 1) : len - Math.abs(n);
            for (; k >= 0; k--) {
                if (k in t && t[k] === searchElement) {
                    return k;
                }
            }
            return -1;
        };
    }
    
    // Add string trim for IE8.
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, ''); 
        }
    }

    var root = this
      , $ = root.jQuery || root.Zepto
      , i18n = {}
      , resStore = {}
      , currentLng
      , replacementCounter = 0
      , languages = []
      , initialized = false
      , sync = {};



    // Export the i18next object for **CommonJS**. 
    // If we're not in CommonJS, add `i18n` to the
    // global object or to jquery.
    if (typeof module !== 'undefined' && module.exports) {
        if (!$) {
          try {
            $ = require('jquery');
          } catch(e) {
            // just ignore
          }
        }
        if ($) {
            $.i18n = $.i18n || i18n;
        }
        module.exports = i18n;
    } else {
        if ($) {
            $.i18n = $.i18n || i18n;
        }
        
        root.i18n = root.i18n || i18n;
    }
    sync = {
    
        load: function(lngs, options, cb) {
            if (options.useLocalStorage) {
                sync._loadLocal(lngs, options, function(err, store) {
                    var missingLngs = [];
                    for (var i = 0, len = lngs.length; i < len; i++) {
                        if (!store[lngs[i]]) missingLngs.push(lngs[i]);
                    }
    
                    if (missingLngs.length > 0) {
                        sync._fetch(missingLngs, options, function(err, fetched) {
                            f.extend(store, fetched);
                            sync._storeLocal(fetched);
    
                            cb(null, store);
                        });
                    } else {
                        cb(null, store);
                    }
                });
            } else {
                sync._fetch(lngs, options, function(err, store){
                    cb(null, store);
                });
            }
        },
    
        _loadLocal: function(lngs, options, cb) {
            var store = {}
              , nowMS = new Date().getTime();
    
            if(window.localStorage) {
    
                var todo = lngs.length;
    
                f.each(lngs, function(key, lng) {
                    var local = window.localStorage.getItem('res_' + lng);
    
                    if (local) {
                        local = JSON.parse(local);
    
                        if (local.i18nStamp && local.i18nStamp + options.localStorageExpirationTime > nowMS) {
                            store[lng] = local;
                        }
                    }
    
                    todo--; // wait for all done befor callback
                    if (todo === 0) cb(null, store);
                });
            }
        },
    
        _storeLocal: function(store) {
            if(window.localStorage) {
                for (var m in store) {
                    store[m].i18nStamp = new Date().getTime();
                    f.localStorage.setItem('res_' + m, JSON.stringify(store[m]));
                }
            }
            return;
        },
    
        _fetch: function(lngs, options, cb) {
            var ns = options.ns
              , store = {};
            
            if (!options.dynamicLoad) {
                var todo = ns.namespaces.length * lngs.length
                  , errors;
    
                // load each file individual
                f.each(ns.namespaces, function(nsIndex, nsValue) {
                    f.each(lngs, function(lngIndex, lngValue) {
                        
                        // Call this once our translation has returned.
                        var loadComplete = function(err, data) {
                            if (err) {
                                errors = errors || [];
                                errors.push(err);
                            }
                            store[lngValue] = store[lngValue] || {};
                            store[lngValue][nsValue] = data;
    
                            todo--; // wait for all done befor callback
                            if (todo === 0) cb(errors, store);
                        };
                        
                        if(typeof options.customLoad == 'function'){
                            // Use the specified custom callback.
                            options.customLoad(lngValue, nsValue, options, loadComplete);
                        } else {
                            //~ // Use our inbuilt sync.
                            sync._fetchOne(lngValue, nsValue, options, loadComplete);
                        }
                    });
                });
            } else {
                // Call this once our translation has returned.
                var loadComplete = function(err, data) {
                    cb(null, data);
                };
    
                if(typeof options.customLoad == 'function'){
                    // Use the specified custom callback.
                    options.customLoad(lngs, ns.namespaces, options, loadComplete);
                } else {
                    var url = applyReplacement(options.resGetPath, { lng: lngs.join('+'), ns: ns.namespaces.join('+') });
                    // load all needed stuff once
                    f.ajax({
                        url: url,
                        success: function(data, status, xhr) {
                            f.log('loaded: ' + url);
                            loadComplete(null, data);
                        },
                        error : function(xhr, status, error) {
                            f.log('failed loading: ' + url);
                            loadComplete('failed loading resource.json error: ' + error);
                        },
                        dataType: "json",
                        async : options.getAsync
                    });
                }    
            }
        },
    
        _fetchOne: function(lng, ns, options, done) {
            var url = applyReplacement(options.resGetPath, { lng: lng, ns: ns });
            f.ajax({
                url: url,
                success: function(data, status, xhr) {
                    f.log('loaded: ' + url);
                    done(null, data);
                },
                error : function(xhr, status, error) {
                    if ((status && status == 200) || (xhr && xhr.status && xhr.status == 200)) {
                        // file loaded but invalid json, stop waste time !
                        f.error('There is a typo in: ' + url);
                    } else if ((status && status == 404) || (xhr && xhr.status && xhr.status == 404)) {
                        f.log('Does not exist: ' + url);
                    } else {
                        var theStatus = status ? status : ((xhr && xhr.status) ? xhr.status : null);
                        f.log(theStatus + ' when loading ' + url);
                    }
                    
                    done(error, {});
                },
                dataType: "json",
                async : options.getAsync
            });
        },
    
        postMissing: function(lng, ns, key, defaultValue, lngs) {
            var payload = {};
            payload[key] = defaultValue;
    
            var urls = [];
    
            if (o.sendMissingTo === 'fallback' && o.fallbackLng[0] !== false) {
                for (var i = 0; i < o.fallbackLng.length; i++) {
                    urls.push({lng: o.fallbackLng[i], url: applyReplacement(o.resPostPath, { lng: o.fallbackLng[i], ns: ns })});
                }
            } else if (o.sendMissingTo === 'current' || (o.sendMissingTo === 'fallback' && o.fallbackLng[0] === false) ) {
                urls.push({lng: lng, url: applyReplacement(o.resPostPath, { lng: lng, ns: ns })});
            } else if (o.sendMissingTo === 'all') {
                for (var i = 0, l = lngs.length; i < l; i++) {
                    urls.push({lng: lngs[i], url: applyReplacement(o.resPostPath, { lng: lngs[i], ns: ns })});
                }
            }
    
            for (var y = 0, len = urls.length; y < len; y++) {
                var item = urls[y];
                f.ajax({
                    url: item.url,
                    type: o.sendType,
                    data: payload,
                    success: function(data, status, xhr) {
                        f.log('posted missing key \'' + key + '\' to: ' + item.url);
    
                        // add key to resStore
                        var keys = key.split('.');
                        var x = 0;
                        var value = resStore[item.lng][ns];
                        while (keys[x]) {
                            if (x === keys.length - 1) {
                                value = value[keys[x]] = defaultValue;
                            } else {
                                value = value[keys[x]] = value[keys[x]] || {};
                            }
                            x++;
                        }
                    },
                    error : function(xhr, status, error) {
                        f.log('failed posting missing key \'' + key + '\' to: ' + item.url);
                    },
                    dataType: "json",
                    async : o.postAsync
                });
            }
        },
    
        reload: reload
    };
    // defaults
    var o = {
        lng: undefined,
        load: 'all',
        preload: [],
        lowerCaseLng: false,
        returnObjectTrees: false,
        fallbackLng: ['dev'],
        fallbackNS: [],
        detectLngQS: 'setLng',
        detectLngFromLocalStorage: false,
        ns: 'translation',
        fallbackOnNull: true,
        fallbackOnEmpty: false,
        fallbackToDefaultNS: false,
        nsseparator: ':',
        keyseparator: '.',
        selectorAttr: 'data-i18n',
        debug: false,
        
        resGetPath: 'locales/__lng__/__ns__.json',
        resPostPath: 'locales/add/__lng__/__ns__',
    
        getAsync: true,
        postAsync: true,
    
        resStore: undefined,
        useLocalStorage: false,
        localStorageExpirationTime: 7*24*60*60*1000,
    
        dynamicLoad: false,
        sendMissing: false,
        sendMissingTo: 'fallback', // current | all
        sendType: 'POST',
    
        interpolationPrefix: '__',
        interpolationSuffix: '__',
        defaultVariables: false,
        reusePrefix: '$t(',
        reuseSuffix: ')',
        pluralSuffix: '_plural',
        pluralNotFound: ['plural_not_found', Math.random()].join(''),
        contextNotFound: ['context_not_found', Math.random()].join(''),
        escapeInterpolation: false,
        indefiniteSuffix: '_indefinite',
        indefiniteNotFound: ['indefinite_not_found', Math.random()].join(''),
    
        setJqueryExt: true,
        defaultValueFromContent: true,
        useDataAttrOptions: false,
        cookieExpirationTime: undefined,
        useCookie: true,
        cookieName: 'i18next',
        cookieDomain: undefined,
    
        objectTreeKeyHandler: undefined,
        postProcess: undefined,
        parseMissingKey: undefined,
        missingKeyHandler: sync.postMissing,
    
        shortcutFunction: 'sprintf' // or: defaultValue
    };
    function _extend(target, source) {
        if (!source || typeof source === 'function') {
            return target;
        }
    
        for (var attr in source) { target[attr] = source[attr]; }
        return target;
    }
    
    function _deepExtend(target, source) {
        for (var prop in source)
            if (prop in target)
                _deepExtend(target[prop], source[prop]);
            else
                target[prop] = source[prop];
        return target;
    }
    
    function _each(object, callback, args) {
        var name, i = 0,
            length = object.length,
            isObj = length === undefined || Object.prototype.toString.apply(object) !== '[object Array]' || typeof object === "function";
    
        if (args) {
            if (isObj) {
                for (name in object) {
                    if (callback.apply(object[name], args) === false) {
                        break;
                    }
                }
            } else {
                for ( ; i < length; ) {
                    if (callback.apply(object[i++], args) === false) {
                        break;
                    }
                }
            }
    
        // A special, fast, case for the most common use of each
        } else {
            if (isObj) {
                for (name in object) {
                    if (callback.call(object[name], name, object[name]) === false) {
                        break;
                    }
                }
            } else {
                for ( ; i < length; ) {
                    if (callback.call(object[i], i, object[i++]) === false) {
                        break;
                    }
                }
            }
        }
    
        return object;
    }
    
    var _entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };
    
    function _escape(data) {
        if (typeof data === 'string') {
            return data.replace(/[&<>"'\/]/g, function (s) {
                return _entityMap[s];
            });
        }else{
            return data;
        }
    }
    
    function _ajax(options) {
    
        // v0.5.0 of https://github.com/goloroden/http.js
        var getXhr = function (callback) {
            // Use the native XHR object if the browser supports it.
            if (window.XMLHttpRequest) {
                return callback(null, new XMLHttpRequest());
            } else if (window.ActiveXObject) {
                // In Internet Explorer check for ActiveX versions of the XHR object.
                try {
                    return callback(null, new ActiveXObject("Msxml2.XMLHTTP"));
                } catch (e) {
                    return callback(null, new ActiveXObject("Microsoft.XMLHTTP"));
                }
            }
    
            // If no XHR support was found, throw an error.
            return callback(new Error());
        };
    
        var encodeUsingUrlEncoding = function (data) {
            if(typeof data === 'string') {
                return data;
            }
    
            var result = [];
            for(var dataItem in data) {
                if(data.hasOwnProperty(dataItem)) {
                    result.push(encodeURIComponent(dataItem) + '=' + encodeURIComponent(data[dataItem]));
                }
            }
    
            return result.join('&');
        };
    
        var utf8 = function (text) {
            text = text.replace(/\r\n/g, '\n');
            var result = '';
    
            for(var i = 0; i < text.length; i++) {
                var c = text.charCodeAt(i);
    
                if(c < 128) {
                        result += String.fromCharCode(c);
                } else if((c > 127) && (c < 2048)) {
                        result += String.fromCharCode((c >> 6) | 192);
                        result += String.fromCharCode((c & 63) | 128);
                } else {
                        result += String.fromCharCode((c >> 12) | 224);
                        result += String.fromCharCode(((c >> 6) & 63) | 128);
                        result += String.fromCharCode((c & 63) | 128);
                }
            }
    
            return result;
        };
    
        var base64 = function (text) {
            var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    
            text = utf8(text);
            var result = '',
                    chr1, chr2, chr3,
                    enc1, enc2, enc3, enc4,
                    i = 0;
    
            do {
                chr1 = text.charCodeAt(i++);
                chr2 = text.charCodeAt(i++);
                chr3 = text.charCodeAt(i++);
    
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
    
                if(isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if(isNaN(chr3)) {
                    enc4 = 64;
                }
    
                result +=
                    keyStr.charAt(enc1) +
                    keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) +
                    keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = '';
                enc1 = enc2 = enc3 = enc4 = '';
            } while(i < text.length);
    
            return result;
        };
    
        var mergeHeaders = function () {
            // Use the first header object as base.
            var result = arguments[0];
    
            // Iterate through the remaining header objects and add them.
            for(var i = 1; i < arguments.length; i++) {
                var currentHeaders = arguments[i];
                for(var header in currentHeaders) {
                    if(currentHeaders.hasOwnProperty(header)) {
                        result[header] = currentHeaders[header];
                    }
                }
            }
    
            // Return the merged headers.
            return result;
        };
    
        var ajax = function (method, url, options, callback) {
            // Adjust parameters.
            if(typeof options === 'function') {
                callback = options;
                options = {};
            }
    
            // Set default parameter values.
            options.cache = options.cache || false;
            options.data = options.data || {};
            options.headers = options.headers || {};
            options.jsonp = options.jsonp || false;
            options.async = options.async === undefined ? true : options.async;
    
            // Merge the various header objects.
            var headers = mergeHeaders({
                'accept': '*/*',
                'content-type': 'application/x-www-form-urlencoded;charset=UTF-8'
            }, ajax.headers, options.headers);
    
            // Encode the data according to the content-type.
            var payload;
            if (headers['content-type'] === 'application/json') {
                payload = JSON.stringify(options.data);
            } else {
                payload = encodeUsingUrlEncoding(options.data);
            }
    
            // Specially prepare GET requests: Setup the query string, handle caching and make a JSONP call
            // if neccessary.
            if(method === 'GET') {
                // Setup the query string.
                var queryString = [];
                if(payload) {
                    queryString.push(payload);
                    payload = null;
                }
    
                // Handle caching.
                if(!options.cache) {
                    queryString.push('_=' + (new Date()).getTime());
                }
    
                // If neccessary prepare the query string for a JSONP call.
                if(options.jsonp) {
                    queryString.push('callback=' + options.jsonp);
                    queryString.push('jsonp=' + options.jsonp);
                }
    
                // Merge the query string and attach it to the url.
                queryString = queryString.join('&');
                if (queryString.length > 1) {
                    if (url.indexOf('?') > -1) {
                        url += '&' + queryString;
                    } else {
                        url += '?' + queryString;
                    }
                }
    
                // Make a JSONP call if neccessary.
                if(options.jsonp) {
                    var head = document.getElementsByTagName('head')[0];
                    var script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src = url;
                    head.appendChild(script);
                    return;
                }
            }
    
            // Since we got here, it is no JSONP request, so make a normal XHR request.
            getXhr(function (err, xhr) {
                if(err) return callback(err);
    
                // Open the request.
                xhr.open(method, url, options.async);
    
                // Set the request headers.
                for(var header in headers) {
                    if(headers.hasOwnProperty(header)) {
                        xhr.setRequestHeader(header, headers[header]);
                    }
                }
    
                // Handle the request events.
                xhr.onreadystatechange = function () {
                    if(xhr.readyState === 4) {
                        var data = xhr.responseText || '';
    
                        // If no callback is given, return.
                        if(!callback) {
                            return;
                        }
    
                        // Return an object that provides access to the data as text and JSON.
                        callback(xhr.status, {
                            text: function () {
                                return data;
                            },
    
                            json: function () {
                                try {
                                    return JSON.parse(data)
                                } catch (e) {
                                    f.error('Can not parse JSON. URL: ' + url);
                                    return {};
                                }
                            }
                        });
                    }
                };
    
                // Actually send the XHR request.
                xhr.send(payload);
            });
        };
    
        // Define the external interface.
        var http = {
            authBasic: function (username, password) {
                ajax.headers['Authorization'] = 'Basic ' + base64(username + ':' + password);
            },
    
            connect: function (url, options, callback) {
                return ajax('CONNECT', url, options, callback);
            },
    
            del: function (url, options, callback) {
                return ajax('DELETE', url, options, callback);
            },
    
            get: function (url, options, callback) {
                return ajax('GET', url, options, callback);
            },
    
            head: function (url, options, callback) {
                return ajax('HEAD', url, options, callback);
            },
    
            headers: function (headers) {
                ajax.headers = headers || {};
            },
    
            isAllowed: function (url, verb, callback) {
                this.options(url, function (status, data) {
                    callback(data.text().indexOf(verb) !== -1);
                });
            },
    
            options: function (url, options, callback) {
                return ajax('OPTIONS', url, options, callback);
            },
    
            patch: function (url, options, callback) {
                return ajax('PATCH', url, options, callback);
            },
    
            post: function (url, options, callback) {
                return ajax('POST', url, options, callback);
            },
    
            put: function (url, options, callback) {
                return ajax('PUT', url, options, callback);
            },
    
            trace: function (url, options, callback) {
                return ajax('TRACE', url, options, callback);
            }
        };
    
    
        var methode = options.type ? options.type.toLowerCase() : 'get';
    
        http[methode](options.url, options, function (status, data) {
            // file: protocol always gives status code 0, so check for data
            if (status === 200 || (status === 0 && data.text())) {
                options.success(data.json(), status, null);
            } else {
                options.error(data.text(), status, null);
            }
        });
    }
    
    var _cookie = {
        create: function(name,value,minutes,domain) {
            var expires;
            if (minutes) {
                var date = new Date();
                date.setTime(date.getTime()+(minutes*60*1000));
                expires = "; expires="+date.toGMTString();
            }
            else expires = "";
            domain = (domain)? "domain="+domain+";" : "";
            document.cookie = name+"="+value+expires+";"+domain+"path=/";
        },
    
        read: function(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        },
    
        remove: function(name) {
            this.create(name,"",-1);
        }
    };
    
    var cookie_noop = {
        create: function(name,value,minutes,domain) {},
        read: function(name) { return null; },
        remove: function(name) {}
    };
    
    
    
    // move dependent functions to a container so that
    // they can be overriden easier in no jquery environment (node.js)
    var f = {
        extend: $ ? $.extend : _extend,
        deepExtend: _deepExtend,
        each: $ ? $.each : _each,
        ajax: $ ? $.ajax : (typeof document !== 'undefined' ? _ajax : function() {}),
        cookie: typeof document !== 'undefined' ? _cookie : cookie_noop,
        detectLanguage: detectLanguage,
        escape: _escape,
        log: function(str) {
            if (o.debug && typeof console !== "undefined") console.log(str);
        },
        error: function(str) {
            if (typeof console !== "undefined") console.error(str);
        },
        getCountyIndexOfLng: function(lng) {
            var lng_index = 0;
            if (lng === 'nb-NO' || lng === 'nn-NO' || lng === 'nb-no' || lng === 'nn-no') lng_index = 1;
            return lng_index;
        },
        toLanguages: function(lng) {
            var log = this.log;
    
            function applyCase(l) {
                var ret = l;
    
                if (typeof l === 'string' && l.indexOf('-') > -1) {
                    var parts = l.split('-');
    
                    ret = o.lowerCaseLng ?
                        parts[0].toLowerCase() +  '-' + parts[1].toLowerCase() :
                        parts[0].toLowerCase() +  '-' + parts[1].toUpperCase();
                } else {
                    ret = o.lowerCaseLng ? l.toLowerCase() : l;
                }
    
                return ret;
            }
    
            var languages = [];
            var whitelist = o.lngWhitelist || false;
            var addLanguage = function(language){
              //reject langs not whitelisted
              if(!whitelist || whitelist.indexOf(language) > -1){
                languages.push(language);
              }else{
                log('rejecting non-whitelisted language: ' + language);
              }
            };
            if (typeof lng === 'string' && lng.indexOf('-') > -1) {
                var parts = lng.split('-');
    
                if (o.load !== 'unspecific') addLanguage(applyCase(lng));
                if (o.load !== 'current') addLanguage(applyCase(parts[this.getCountyIndexOfLng(lng)]));
            } else {
                addLanguage(applyCase(lng));
            }
    
            for (var i = 0; i < o.fallbackLng.length; i++) {
                if (languages.indexOf(o.fallbackLng[i]) === -1 && o.fallbackLng[i]) languages.push(applyCase(o.fallbackLng[i]));
            }
            return languages;
        },
        regexEscape: function(str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        },
        regexReplacementEscape: function(strOrFn) {
            if (typeof strOrFn === 'string') {
                return strOrFn.replace(/\$/g, "$$$$");
            } else {
                return strOrFn;
            }
        },
        localStorage: {
            setItem: function(key, value) {
                if (window.localStorage) {
                    try {
                        window.localStorage.setItem(key, value);
                    } catch (e) {
                        f.log('failed to set value for key "' + key + '" to localStorage.');
                    }
                }
            }
        }
    };
    function init(options, cb) {
        
        if (typeof options === 'function') {
            cb = options;
            options = {};
        }
        options = options || {};
        
        // override defaults with passed in options
        f.extend(o, options);
        delete o.fixLng; /* passed in each time */
    
        // override functions: .log(), .detectLanguage(), etc
        if (o.functions) {
            delete o.functions;
            f.extend(f, options.functions);
        }
    
        // create namespace object if namespace is passed in as string
        if (typeof o.ns == 'string') {
            o.ns = { namespaces: [o.ns], defaultNs: o.ns};
        }
    
        // fallback namespaces
        if (typeof o.fallbackNS == 'string') {
            o.fallbackNS = [o.fallbackNS];
        }
    
        // fallback languages
        if (typeof o.fallbackLng == 'string' || typeof o.fallbackLng == 'boolean') {
            o.fallbackLng = [o.fallbackLng];
        }
    
        // escape prefix/suffix
        o.interpolationPrefixEscaped = f.regexEscape(o.interpolationPrefix);
        o.interpolationSuffixEscaped = f.regexEscape(o.interpolationSuffix);
    
        if (!o.lng) o.lng = f.detectLanguage();
    
        languages = f.toLanguages(o.lng);
        currentLng = languages[0];
        f.log('currentLng set to: ' + currentLng);
    
        if (o.useCookie && f.cookie.read(o.cookieName) !== currentLng){ //cookie is unset or invalid
            f.cookie.create(o.cookieName, currentLng, o.cookieExpirationTime, o.cookieDomain);
        }
        if (o.detectLngFromLocalStorage && typeof document !== 'undefined' && window.localStorage) {
            f.localStorage.setItem('i18next_lng', currentLng);
        }
    
        var lngTranslate = translate;
        if (options.fixLng) {
            lngTranslate = function(key, options) {
                options = options || {};
                options.lng = options.lng || lngTranslate.lng;
                return translate(key, options);
            };
            lngTranslate.lng = currentLng;
        }
    
        pluralExtensions.setCurrentLng(currentLng);
    
        // add JQuery extensions
        if ($ && o.setJqueryExt) addJqueryFunct();
    
        // jQuery deferred
        var deferred;
        if ($ && $.Deferred) {
            deferred = $.Deferred();
        }
    
        // return immidiatly if res are passed in
        if (o.resStore) {
            resStore = o.resStore;
            initialized = true;
            if (cb) cb(lngTranslate);
            if (deferred) deferred.resolve(lngTranslate);
            if (deferred) return deferred.promise();
            return;
        }
    
        // languages to load
        var lngsToLoad = f.toLanguages(o.lng);
        if (typeof o.preload === 'string') o.preload = [o.preload];
        for (var i = 0, l = o.preload.length; i < l; i++) {
            var pres = f.toLanguages(o.preload[i]);
            for (var y = 0, len = pres.length; y < len; y++) {
                if (lngsToLoad.indexOf(pres[y]) < 0) {
                    lngsToLoad.push(pres[y]);
                }
            }
        }
    
        // else load them
        i18n.sync.load(lngsToLoad, o, function(err, store) {
            resStore = store;
            initialized = true;
    
            if (cb) cb(lngTranslate);
            if (deferred) deferred.resolve(lngTranslate);
        });
    
        if (deferred) return deferred.promise();
    }
    function preload(lngs, cb) {
        if (typeof lngs === 'string') lngs = [lngs];
        for (var i = 0, l = lngs.length; i < l; i++) {
            if (o.preload.indexOf(lngs[i]) < 0) {
                o.preload.push(lngs[i]);
            }
        }
        return init(cb);
    }
    
    function addResourceBundle(lng, ns, resources, deep) {
        if (typeof ns !== 'string') {
            resources = ns;
            ns = o.ns.defaultNs;
        } else if (o.ns.namespaces.indexOf(ns) < 0) {
            o.ns.namespaces.push(ns);
        }
    
        resStore[lng] = resStore[lng] || {};
        resStore[lng][ns] = resStore[lng][ns] || {};
    
        if (deep) {
            f.deepExtend(resStore[lng][ns], resources);
        } else {
            f.extend(resStore[lng][ns], resources);
        }
    }
    
    function hasResourceBundle(lng, ns) {
        if (typeof ns !== 'string') {
            ns = o.ns.defaultNs;
        }
    
        resStore[lng] = resStore[lng] || {};
        var res = resStore[lng][ns] || {};
    
        var hasValues = false;
        for(var prop in res) {
            if (res.hasOwnProperty(prop)) {
                hasValues = true;
            }
        }
    
        return hasValues;
    }
    
    function removeResourceBundle(lng, ns) {
        if (typeof ns !== 'string') {
            ns = o.ns.defaultNs;
        }
    
        resStore[lng] = resStore[lng] || {};
        resStore[lng][ns] = {};
    }
    
    function addResource(lng, ns, key, value) {
        if (typeof ns !== 'string') {
            resource = ns;
            ns = o.ns.defaultNs;
        } else if (o.ns.namespaces.indexOf(ns) < 0) {
            o.ns.namespaces.push(ns);
        }
    
        resStore[lng] = resStore[lng] || {};
        resStore[lng][ns] = resStore[lng][ns] || {};
    
        var keys = key.split(o.keyseparator);
        var x = 0;
        var node = resStore[lng][ns];
        var origRef = node;
    
        while (keys[x]) {
            if (x == keys.length - 1)
                node[keys[x]] = value;
            else {
                if (node[keys[x]] == null)
                    node[keys[x]] = {};
    
                node = node[keys[x]];
            }
            x++;
        }
    }
    
    function addResources(lng, ns, resources) {
        if (typeof ns !== 'string') {
            resource = ns;
            ns = o.ns.defaultNs;
        } else if (o.ns.namespaces.indexOf(ns) < 0) {
            o.ns.namespaces.push(ns);
        }
    
        for (var m in resources) {
            if (typeof resources[m] === 'string') addResource(lng, ns, m, resources[m]);
        }
    }
    
    function setDefaultNamespace(ns) {
        o.ns.defaultNs = ns;
    }
    
    function loadNamespace(namespace, cb) {
        loadNamespaces([namespace], cb);
    }
    
    function loadNamespaces(namespaces, cb) {
        var opts = {
            dynamicLoad: o.dynamicLoad,
            resGetPath: o.resGetPath,
            getAsync: o.getAsync,
            customLoad: o.customLoad,
            ns: { namespaces: namespaces, defaultNs: ''} /* new namespaces to load */
        };
    
        // languages to load
        var lngsToLoad = f.toLanguages(o.lng);
        if (typeof o.preload === 'string') o.preload = [o.preload];
        for (var i = 0, l = o.preload.length; i < l; i++) {
            var pres = f.toLanguages(o.preload[i]);
            for (var y = 0, len = pres.length; y < len; y++) {
                if (lngsToLoad.indexOf(pres[y]) < 0) {
                    lngsToLoad.push(pres[y]);
                }
            }
        }
    
        // check if we have to load
        var lngNeedLoad = [];
        for (var a = 0, lenA = lngsToLoad.length; a < lenA; a++) {
            var needLoad = false;
            var resSet = resStore[lngsToLoad[a]];
            if (resSet) {
                for (var b = 0, lenB = namespaces.length; b < lenB; b++) {
                    if (!resSet[namespaces[b]]) needLoad = true;
                }
            } else {
                needLoad = true;
            }
    
            if (needLoad) lngNeedLoad.push(lngsToLoad[a]);
        }
    
        if (lngNeedLoad.length) {
            i18n.sync._fetch(lngNeedLoad, opts, function(err, store) {
                var todo = namespaces.length * lngNeedLoad.length;
    
                // load each file individual
                f.each(namespaces, function(nsIndex, nsValue) {
    
                    // append namespace to namespace array
                    if (o.ns.namespaces.indexOf(nsValue) < 0) {
                        o.ns.namespaces.push(nsValue);
                    }
    
                    f.each(lngNeedLoad, function(lngIndex, lngValue) {
                        resStore[lngValue] = resStore[lngValue] || {};
                        resStore[lngValue][nsValue] = store[lngValue][nsValue];
    
                        todo--; // wait for all done befor callback
                        if (todo === 0 && cb) {
                            if (o.useLocalStorage) i18n.sync._storeLocal(resStore);
                            cb();
                        }
                    });
                });
            });
        } else {
            if (cb) cb();
        }
    }
    
    function setLng(lng, options, cb) {
        if (typeof options === 'function') {
            cb = options;
            options = {};
        } else if (!options) {
            options = {};
        }
    
        options.lng = lng;
        return init(options, cb);
    }
    
    function lng() {
        return currentLng;
    }
    
    function reload(cb) {
        resStore = {};
        setLng(currentLng, cb);
    }
    function addJqueryFunct() {
        // $.t shortcut
        $.t = $.t || translate;
    
        function parse(ele, key, options) {
            if (key.length === 0) return;
    
            var attr = 'text';
    
            if (key.indexOf('[') === 0) {
                var parts = key.split(']');
                key = parts[1];
                attr = parts[0].substr(1, parts[0].length-1);
            }
    
            if (key.indexOf(';') === key.length-1) {
                key = key.substr(0, key.length-2);
            }
    
            var optionsToUse;
            if (attr === 'html') {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
                ele.html($.t(key, optionsToUse));
            } else if (attr === 'text') {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.text() }, options) : options;
                ele.text($.t(key, optionsToUse));
            } else if (attr === 'prepend') {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
                ele.prepend($.t(key, optionsToUse));
            } else if (attr === 'append') {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.html() }, options) : options;
                ele.append($.t(key, optionsToUse));
            } else if (attr.indexOf("data-") === 0) {
                var dataAttr = attr.substr(("data-").length);
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.data(dataAttr) }, options) : options;
                var translated = $.t(key, optionsToUse);
                //we change into the data cache
                ele.data(dataAttr, translated);
                //we change into the dom
                ele.attr(attr, translated);
            } else {
                optionsToUse = o.defaultValueFromContent ? $.extend({ defaultValue: ele.attr(attr) }, options) : options;
                ele.attr(attr, $.t(key, optionsToUse));
            }
        }
    
        function localize(ele, options) {
            var key = ele.attr(o.selectorAttr);
            if (!key && typeof key !== 'undefined' && key !== false) key = ele.text() || ele.val();
            if (!key) return;
    
            var target = ele
              , targetSelector = ele.data("i18n-target");
            if (targetSelector) {
                target = ele.find(targetSelector) || ele;
            }
    
            if (!options && o.useDataAttrOptions === true) {
                options = ele.data("i18n-options");
            }
            options = options || {};
    
            if (key.indexOf(';') >= 0) {
                var keys = key.split(';');
    
                $.each(keys, function(m, k) {
                    if (k !== '') parse(target, k, options);
                });
    
            } else {
                parse(target, key, options);
            }
    
            if (o.useDataAttrOptions === true) ele.data("i18n-options", options);
        }
    
        // fn
        $.fn.i18n = function (options) {
            return this.each(function() {
                // localize element itself
                localize($(this), options);
    
                // localize childs
                var elements =  $(this).find('[' + o.selectorAttr + ']');
                elements.each(function() { 
                    localize($(this), options);
                });
            });
        };
    }
    function applyReplacement(str, replacementHash, nestedKey, options) {
        if (!str) return str;
    
        options = options || replacementHash; // first call uses replacement hash combined with options
        if (str.indexOf(options.interpolationPrefix || o.interpolationPrefix) < 0) return str;
    
        var prefix = options.interpolationPrefix ? f.regexEscape(options.interpolationPrefix) : o.interpolationPrefixEscaped
          , suffix = options.interpolationSuffix ? f.regexEscape(options.interpolationSuffix) : o.interpolationSuffixEscaped
          , unEscapingSuffix = 'HTML'+suffix;
    
        var hash = replacementHash.replace && typeof replacementHash.replace === 'object' ? replacementHash.replace : replacementHash;
        f.each(hash, function(key, value) {
            var nextKey = nestedKey ? nestedKey + o.keyseparator + key : key;
            if (typeof value === 'object' && value !== null) {
                str = applyReplacement(str, value, nextKey, options);
            } else {
                if (options.escapeInterpolation || o.escapeInterpolation) {
                    str = str.replace(new RegExp([prefix, nextKey, unEscapingSuffix].join(''), 'g'), f.regexReplacementEscape(value));
                    str = str.replace(new RegExp([prefix, nextKey, suffix].join(''), 'g'), f.regexReplacementEscape(f.escape(value)));
                } else {
                    str = str.replace(new RegExp([prefix, nextKey, suffix].join(''), 'g'), f.regexReplacementEscape(value));
                }
                // str = options.escapeInterpolation;
            }
        });
        return str;
    }
    
    // append it to functions
    f.applyReplacement = applyReplacement;
    
    function applyReuse(translated, options) {
        var comma = ',';
        var options_open = '{';
        var options_close = '}';
    
        var opts = f.extend({}, options);
        delete opts.postProcess;
    
        while (translated.indexOf(o.reusePrefix) != -1) {
            replacementCounter++;
            if (replacementCounter > o.maxRecursion) { break; } // safety net for too much recursion
            var index_of_opening = translated.lastIndexOf(o.reusePrefix);
            var index_of_end_of_closing = translated.indexOf(o.reuseSuffix, index_of_opening) + o.reuseSuffix.length;
            var token = translated.substring(index_of_opening, index_of_end_of_closing);
            var token_without_symbols = token.replace(o.reusePrefix, '').replace(o.reuseSuffix, '');
    
            if (index_of_end_of_closing <= index_of_opening) {
                f.error('there is an missing closing in following translation value', translated);
                return '';
            }
    
            if (token_without_symbols.indexOf(comma) != -1) {
                var index_of_token_end_of_closing = token_without_symbols.indexOf(comma);
                if (token_without_symbols.indexOf(options_open, index_of_token_end_of_closing) != -1 && token_without_symbols.indexOf(options_close, index_of_token_end_of_closing) != -1) {
                    var index_of_opts_opening = token_without_symbols.indexOf(options_open, index_of_token_end_of_closing);
                    var index_of_opts_end_of_closing = token_without_symbols.indexOf(options_close, index_of_opts_opening) + options_close.length;
                    try {
                        opts = f.extend(opts, JSON.parse(token_without_symbols.substring(index_of_opts_opening, index_of_opts_end_of_closing)));
                        token_without_symbols = token_without_symbols.substring(0, index_of_token_end_of_closing);
                    } catch (e) {
                    }
                }
            }
    
            var translated_token = _translate(token_without_symbols, opts);
            translated = translated.replace(token, f.regexReplacementEscape(translated_token));
        }
        return translated;
    }
    
    function hasContext(options) {
        return (options.context && (typeof options.context == 'string' || typeof options.context == 'number'));
    }
    
    function needsPlural(options, lng) {
        return (options.count !== undefined && typeof options.count != 'string'/* && pluralExtensions.needsPlural(lng, options.count)*/);
    }
    
    function needsIndefiniteArticle(options) {
        return (options.indefinite_article !== undefined && typeof options.indefinite_article != 'string' && options.indefinite_article);
    }
    
    function exists(key, options) {
        options = options || {};
    
        var notFound = _getDefaultValue(key, options)
            , found = _find(key, options);
    
        return found !== undefined || found === notFound;
    }
    
    function translate(key, options) {
        options = options || {};
    
        if (!initialized) {
            f.log('i18next not finished initialization. you might have called t function before loading resources finished.')
            return options.defaultValue || '';
        };
        replacementCounter = 0;
        return _translate.apply(null, arguments);
    }
    
    function _getDefaultValue(key, options) {
        return (options.defaultValue !== undefined) ? options.defaultValue : key;
    }
    
    function _injectSprintfProcessor() {
    
        var values = [];
    
        // mh: build array from second argument onwards
        for (var i = 1; i < arguments.length; i++) {
            values.push(arguments[i]);
        }
    
        return {
            postProcess: 'sprintf',
            sprintf:     values
        };
    }
    
    function _translate(potentialKeys, options) {
        if (options && typeof options !== 'object') {
            if (o.shortcutFunction === 'sprintf') {
                // mh: gettext like sprintf syntax found, automatically create sprintf processor
                options = _injectSprintfProcessor.apply(null, arguments);
            } else if (o.shortcutFunction === 'defaultValue') {
                options = {
                    defaultValue: options
                }
            }
        } else {
            options = options || {};
        }
    
        if (typeof o.defaultVariables === 'object') {
            options = f.extend({}, o.defaultVariables, options);
        }
    
        if (potentialKeys === undefined || potentialKeys === null || potentialKeys === '') return '';
    
        if (typeof potentialKeys === 'string') {
            potentialKeys = [potentialKeys];
        }
    
        var key = potentialKeys[0];
    
        if (potentialKeys.length > 1) {
            for (var i = 0; i < potentialKeys.length; i++) {
                key = potentialKeys[i];
                if (exists(key, options)) {
                    break;
                }
            }
        }
    
        var notFound = _getDefaultValue(key, options)
            , found = _find(key, options)
            , lngs = options.lng ? f.toLanguages(options.lng, options.fallbackLng) : languages
            , ns = options.ns || o.ns.defaultNs
            , parts;
    
        // split ns and key
        if (key.indexOf(o.nsseparator) > -1) {
            parts = key.split(o.nsseparator);
            ns = parts[0];
            key = parts[1];
        }
    
        if (found === undefined && o.sendMissing && typeof o.missingKeyHandler === 'function') {
            if (options.lng) {
                o.missingKeyHandler(lngs[0], ns, key, notFound, lngs);
            } else {
                o.missingKeyHandler(o.lng, ns, key, notFound, lngs);
            }
        }
    
        var postProcessor = options.postProcess || o.postProcess;
        if (found !== undefined && postProcessor) {
            if (postProcessors[postProcessor]) {
                found = postProcessors[postProcessor](found, key, options);
            }
        }
    
        // process notFound if function exists
        var splitNotFound = notFound;
        if (notFound.indexOf(o.nsseparator) > -1) {
            parts = notFound.split(o.nsseparator);
            splitNotFound = parts[1];
        }
        if (splitNotFound === key && o.parseMissingKey) {
            notFound = o.parseMissingKey(notFound);
        }
    
        if (found === undefined) {
            notFound = applyReplacement(notFound, options);
            notFound = applyReuse(notFound, options);
    
            if (postProcessor && postProcessors[postProcessor]) {
                var val = _getDefaultValue(key, options);
                found = postProcessors[postProcessor](val, key, options);
            }
        }
    
        return (found !== undefined) ? found : notFound;
    }
    
    function _find(key, options) {
        options = options || {};
    
        var optionWithoutCount, translated
            , notFound = _getDefaultValue(key, options)
            , lngs = languages;
    
        if (!resStore) { return notFound; } // no resStore to translate from
    
        // CI mode
        if (lngs[0].toLowerCase() === 'cimode') return notFound;
    
        // passed in lng
        if (options.lngs) lngs = options.lngs;
        if (options.lng) {
            lngs = f.toLanguages(options.lng, options.fallbackLng);
    
            if (!resStore[lngs[0]]) {
                var oldAsync = o.getAsync;
                o.getAsync = false;
    
                i18n.sync.load(lngs, o, function(err, store) {
                    f.extend(resStore, store);
                    o.getAsync = oldAsync;
                });
            }
        }
    
        var ns = options.ns || o.ns.defaultNs;
        if (key.indexOf(o.nsseparator) > -1) {
            var parts = key.split(o.nsseparator);
            ns = parts[0];
            key = parts[1];
        }
    
        if (hasContext(options)) {
            optionWithoutCount = f.extend({}, options);
            delete optionWithoutCount.context;
            optionWithoutCount.defaultValue = o.contextNotFound;
    
            var contextKey = ns + o.nsseparator + key + '_' + options.context;
    
            translated = translate(contextKey, optionWithoutCount);
            if (translated != o.contextNotFound) {
                return applyReplacement(translated, { context: options.context }); // apply replacement for context only
            } // else continue translation with original/nonContext key
        }
    
        if (needsPlural(options, lngs[0])) {
            optionWithoutCount = f.extend({ lngs: [lngs[0]]}, options);
            delete optionWithoutCount.count;
            delete optionWithoutCount.lng;
            optionWithoutCount.defaultValue = o.pluralNotFound;
    
            var pluralKey;
            if (!pluralExtensions.needsPlural(lngs[0], options.count)) {
                pluralKey = ns + o.nsseparator + key;
            } else {
                pluralKey = ns + o.nsseparator + key + o.pluralSuffix;
                var pluralExtension = pluralExtensions.get(lngs[0], options.count);
                if (pluralExtension >= 0) {
                    pluralKey = pluralKey + '_' + pluralExtension;
                } else if (pluralExtension === 1) {
                    pluralKey = ns + o.nsseparator + key; // singular
                }
            }
    
            translated = translate(pluralKey, optionWithoutCount);
    
            if (translated != o.pluralNotFound) {
                return applyReplacement(translated, {
                    count: options.count,
                    interpolationPrefix: options.interpolationPrefix,
                    interpolationSuffix: options.interpolationSuffix
                }); // apply replacement for count only
            } else if (lngs.length > 1) {
                // remove failed lng
                var clone = lngs.slice();
                clone.shift();
                options = f.extend(options, { lngs: clone });
                delete options.lng;
                // retry with fallbacks
                translated = translate(ns + o.nsseparator + key, options);
                if (translated != o.pluralNotFound) return translated;
            } else {
                return translated;
            }
        }
    
        if (needsIndefiniteArticle(options)) {
            var optionsWithoutIndef = f.extend({}, options);
            delete optionsWithoutIndef.indefinite_article;
            optionsWithoutIndef.defaultValue = o.indefiniteNotFound;
            // If we don't have a count, we want the indefinite, if we do have a count, and needsPlural is false
            var indefiniteKey = ns + o.nsseparator + key + (((options.count && !needsPlural(options, lngs[0])) || !options.count) ? o.indefiniteSuffix : "");
            translated = translate(indefiniteKey, optionsWithoutIndef);
            if (translated != o.indefiniteNotFound) {
                return translated;
            }
        }
    
        var found;
        var keys = key.split(o.keyseparator);
        for (var i = 0, len = lngs.length; i < len; i++ ) {
            if (found !== undefined) break;
    
            var l = lngs[i];
    
            var x = 0;
            var value = resStore[l] && resStore[l][ns];
            while (keys[x]) {
                value = value && value[keys[x]];
                x++;
            }
            if (value !== undefined) {
                var valueType = Object.prototype.toString.apply(value);
                if (typeof value === 'string') {
                    value = applyReplacement(value, options);
                    value = applyReuse(value, options);
                } else if (valueType === '[object Array]' && !o.returnObjectTrees && !options.returnObjectTrees) {
                    value = value.join('\n');
                    value = applyReplacement(value, options);
                    value = applyReuse(value, options);
                } else if (value === null && o.fallbackOnNull === true) {
                    value = undefined;
                } else if (value !== null) {
                    if (!o.returnObjectTrees && !options.returnObjectTrees) {
                        if (o.objectTreeKeyHandler && typeof o.objectTreeKeyHandler == 'function') {
                            value = o.objectTreeKeyHandler(key, value, l, ns, options);
                        } else {
                            value = 'key \'' + ns + ':' + key + ' (' + l + ')\' ' +
                                'returned an object instead of string.';
                            f.log(value);
                        }
                    } else if (valueType !== '[object Number]' && valueType !== '[object Function]' && valueType !== '[object RegExp]') {
                        var copy = (valueType === '[object Array]') ? [] : {}; // apply child translation on a copy
                        f.each(value, function(m) {
                            copy[m] = _translate(ns + o.nsseparator + key + o.keyseparator + m, options);
                        });
                        value = copy;
                    }
                }
    
                if (typeof value === 'string' && value.trim() === '' && o.fallbackOnEmpty === true)
                    value = undefined;
    
                found = value;
            }
        }
    
        if (found === undefined && !options.isFallbackLookup && (o.fallbackToDefaultNS === true || (o.fallbackNS && o.fallbackNS.length > 0))) {
            // set flag for fallback lookup - avoid recursion
            options.isFallbackLookup = true;
    
            if (o.fallbackNS.length) {
    
                for (var y = 0, lenY = o.fallbackNS.length; y < lenY; y++) {
                    found = _find(o.fallbackNS[y] + o.nsseparator + key, options);
    
                    if (found || (found==="" && o.fallbackOnEmpty === false)) {
                        /* compare value without namespace */
                        var foundValue = found.indexOf(o.nsseparator) > -1 ? found.split(o.nsseparator)[1] : found
                          , notFoundValue = notFound.indexOf(o.nsseparator) > -1 ? notFound.split(o.nsseparator)[1] : notFound;
    
                        if (foundValue !== notFoundValue) break;
                    }
                }
            } else {
                found = _find(key, options); // fallback to default NS
            }
            options.isFallbackLookup = false;
        }
    
        return found;
    }
    function detectLanguage() {
        var detectedLng;
        var whitelist = o.lngWhitelist || [];
        var userLngChoices = [];
    
        // get from qs
        var qsParm = [];
        if (typeof window !== 'undefined') {
            (function() {
                var query = window.location.search.substring(1);
                var params = query.split('&');
                for (var i=0; i<params.length; i++) {
                    var pos = params[i].indexOf('=');
                    if (pos > 0) {
                        var key = params[i].substring(0,pos);
                        if (key == o.detectLngQS) {
                            userLngChoices.push(params[i].substring(pos+1));
                        }
                    }
                }
            })();
        }
    
        // get from cookie
        if (o.useCookie && typeof document !== 'undefined') {
            var c = f.cookie.read(o.cookieName);
            if (c) userLngChoices.push(c);
        }
    
        // get from localStorage
        if (o.detectLngFromLocalStorage && typeof window !== 'undefined' && window.localStorage) {
            userLngChoices.push(window.localStorage.getItem('i18next_lng'));
        }
    
        // get from navigator
        if (typeof navigator !== 'undefined') {
            if (navigator.languages) { // chrome only; not an array, so can't use .push.apply instead of iterating
                for (var i=0;i<navigator.languages.length;i++) {
                    userLngChoices.push(navigator.languages[i]);
                }
            }
            if (navigator.userLanguage) {
                userLngChoices.push(navigator.userLanguage);
            }
            if (navigator.language) {
                userLngChoices.push(navigator.language);
            }
        }
    
        (function() {
            for (var i=0;i<userLngChoices.length;i++) {
                var lng = userLngChoices[i];
    
                if (lng.indexOf('-') > -1) {
                    var parts = lng.split('-');
                    lng = o.lowerCaseLng ?
                        parts[0].toLowerCase() +  '-' + parts[1].toLowerCase() :
                        parts[0].toLowerCase() +  '-' + parts[1].toUpperCase();
                }
    
                if (whitelist.length === 0 || whitelist.indexOf(lng) > -1) {
                    detectedLng = lng;
                    break;
                }
            }
        })();
    
        //fallback
        if (!detectedLng){
          detectedLng = o.fallbackLng[0];
        }
        
        return detectedLng;
    }
    // definition http://translate.sourceforge.net/wiki/l10n/pluralforms
    
    /* [code, name, numbers, pluralsType] */
    var _rules = [
        ["ach", "Acholi", [1,2], 1],
        ["af", "Afrikaans",[1,2], 2],
        ["ak", "Akan", [1,2], 1],
        ["am", "Amharic", [1,2], 1],
        ["an", "Aragonese",[1,2], 2],
        ["ar", "Arabic", [0,1,2,3,11,100],5],
        ["arn", "Mapudungun",[1,2], 1],
        ["ast", "Asturian", [1,2], 2],
        ["ay", "Aymará", [1], 3],
        ["az", "Azerbaijani",[1,2],2],
        ["be", "Belarusian",[1,2,5],4],
        ["bg", "Bulgarian",[1,2], 2],
        ["bn", "Bengali", [1,2], 2],
        ["bo", "Tibetan", [1], 3],
        ["br", "Breton", [1,2], 1],
        ["bs", "Bosnian", [1,2,5],4],
        ["ca", "Catalan", [1,2], 2],
        ["cgg", "Chiga", [1], 3],
        ["cs", "Czech", [1,2,5],6],
        ["csb", "Kashubian",[1,2,5],7],
        ["cy", "Welsh", [1,2,3,8],8],
        ["da", "Danish", [1,2], 2],
        ["de", "German", [1,2], 2],
        ["dev", "Development Fallback", [1,2], 2],
        ["dz", "Dzongkha", [1], 3],
        ["el", "Greek", [1,2], 2],
        ["en", "English", [1,2], 2],
        ["eo", "Esperanto",[1,2], 2],
        ["es", "Spanish", [1,2], 2],
        ["es_ar","Argentinean Spanish", [1,2], 2],
        ["et", "Estonian", [1,2], 2],
        ["eu", "Basque", [1,2], 2],
        ["fa", "Persian", [1], 3],
        ["fi", "Finnish", [1,2], 2],
        ["fil", "Filipino", [1,2], 1],
        ["fo", "Faroese", [1,2], 2],
        ["fr", "French", [1,2], 9],
        ["fur", "Friulian", [1,2], 2],
        ["fy", "Frisian", [1,2], 2],
        ["ga", "Irish", [1,2,3,7,11],10],
        ["gd", "Scottish Gaelic",[1,2,3,20],11],
        ["gl", "Galician", [1,2], 2],
        ["gu", "Gujarati", [1,2], 2],
        ["gun", "Gun", [1,2], 1],
        ["ha", "Hausa", [1,2], 2],
        ["he", "Hebrew", [1,2], 2],
        ["hi", "Hindi", [1,2], 2],
        ["hr", "Croatian", [1,2,5],4],
        ["hu", "Hungarian",[1,2], 2],
        ["hy", "Armenian", [1,2], 2],
        ["ia", "Interlingua",[1,2],2],
        ["id", "Indonesian",[1], 3],
        ["is", "Icelandic",[1,2], 12],
        ["it", "Italian", [1,2], 2],
        ["ja", "Japanese", [1], 3],
        ["jbo", "Lojban", [1], 3],
        ["jv", "Javanese", [0,1], 13],
        ["ka", "Georgian", [1], 3],
        ["kk", "Kazakh", [1], 3],
        ["km", "Khmer", [1], 3],
        ["kn", "Kannada", [1,2], 2],
        ["ko", "Korean", [1], 3],
        ["ku", "Kurdish", [1,2], 2],
        ["kw", "Cornish", [1,2,3,4],14],
        ["ky", "Kyrgyz", [1], 3],
        ["lb", "Letzeburgesch",[1,2],2],
        ["ln", "Lingala", [1,2], 1],
        ["lo", "Lao", [1], 3],
        ["lt", "Lithuanian",[1,2,10],15],
        ["lv", "Latvian", [1,2,0],16],
        ["mai", "Maithili", [1,2], 2],
        ["mfe", "Mauritian Creole",[1,2],1],
        ["mg", "Malagasy", [1,2], 1],
        ["mi", "Maori", [1,2], 1],
        ["mk", "Macedonian",[1,2],17],
        ["ml", "Malayalam",[1,2], 2],
        ["mn", "Mongolian",[1,2], 2],
        ["mnk", "Mandinka", [0,1,2],18],
        ["mr", "Marathi", [1,2], 2],
        ["ms", "Malay", [1], 3],
        ["mt", "Maltese", [1,2,11,20],19],
        ["nah", "Nahuatl", [1,2], 2],
        ["nap", "Neapolitan",[1,2], 2],
        ["nb", "Norwegian Bokmal",[1,2],2],
        ["ne", "Nepali", [1,2], 2],
        ["nl", "Dutch", [1,2], 2],
        ["nn", "Norwegian Nynorsk",[1,2],2],
        ["no", "Norwegian",[1,2], 2],
        ["nso", "Northern Sotho",[1,2],2],
        ["oc", "Occitan", [1,2], 1],
        ["or", "Oriya", [2,1], 2],
        ["pa", "Punjabi", [1,2], 2],
        ["pap", "Papiamento",[1,2], 2],
        ["pl", "Polish", [1,2,5],7],
        ["pms", "Piemontese",[1,2], 2],
        ["ps", "Pashto", [1,2], 2],
        ["pt", "Portuguese",[1,2], 2],
        ["pt_br","Brazilian Portuguese",[1,2], 2],
        ["rm", "Romansh", [1,2], 2],
        ["ro", "Romanian", [1,2,20],20],
        ["ru", "Russian", [1,2,5],4],
        ["sah", "Yakut", [1], 3],
        ["sco", "Scots", [1,2], 2],
        ["se", "Northern Sami",[1,2], 2],
        ["si", "Sinhala", [1,2], 2],
        ["sk", "Slovak", [1,2,5],6],
        ["sl", "Slovenian",[5,1,2,3],21],
        ["so", "Somali", [1,2], 2],
        ["son", "Songhay", [1,2], 2],
        ["sq", "Albanian", [1,2], 2],
        ["sr", "Serbian", [1,2,5],4],
        ["su", "Sundanese",[1], 3],
        ["sv", "Swedish", [1,2], 2],
        ["sw", "Swahili", [1,2], 2],
        ["ta", "Tamil", [1,2], 2],
        ["te", "Telugu", [1,2], 2],
        ["tg", "Tajik", [1,2], 1],
        ["th", "Thai", [1], 3],
        ["ti", "Tigrinya", [1,2], 1],
        ["tk", "Turkmen", [1,2], 2],
        ["tr", "Turkish", [1,2], 1],
        ["tt", "Tatar", [1], 3],
        ["ug", "Uyghur", [1], 3],
        ["uk", "Ukrainian",[1,2,5],4],
        ["ur", "Urdu", [1,2], 2],
        ["uz", "Uzbek", [1,2], 1],
        ["vi", "Vietnamese",[1], 3],
        ["wa", "Walloon", [1,2], 1],
        ["wo", "Wolof", [1], 3],
        ["yo", "Yoruba", [1,2], 2],
        ["zh", "Chinese", [1], 3]
    ];
    
    var _rulesPluralsTypes = {
        1: function(n) {return Number(n > 1);},
        2: function(n) {return Number(n != 1);},
        3: function(n) {return 0;},
        4: function(n) {return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);},
        5: function(n) {return Number(n===0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 ? 4 : 5);},
        6: function(n) {return Number((n==1) ? 0 : (n>=2 && n<=4) ? 1 : 2);},
        7: function(n) {return Number(n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2);},
        8: function(n) {return Number((n==1) ? 0 : (n==2) ? 1 : (n != 8 && n != 11) ? 2 : 3);},
        9: function(n) {return Number(n >= 2);},
        10: function(n) {return Number(n==1 ? 0 : n==2 ? 1 : n<7 ? 2 : n<11 ? 3 : 4) ;},
        11: function(n) {return Number((n==1 || n==11) ? 0 : (n==2 || n==12) ? 1 : (n > 2 && n < 20) ? 2 : 3);},
        12: function(n) {return Number(n%10!=1 || n%100==11);},
        13: function(n) {return Number(n !== 0);},
        14: function(n) {return Number((n==1) ? 0 : (n==2) ? 1 : (n == 3) ? 2 : 3);},
        15: function(n) {return Number(n%10==1 && n%100!=11 ? 0 : n%10>=2 && (n%100<10 || n%100>=20) ? 1 : 2);},
        16: function(n) {return Number(n%10==1 && n%100!=11 ? 0 : n !== 0 ? 1 : 2);},
        17: function(n) {return Number(n==1 || n%10==1 ? 0 : 1);},
        18: function(n) {return Number(0 ? 0 : n==1 ? 1 : 2);},
        19: function(n) {return Number(n==1 ? 0 : n===0 || ( n%100>1 && n%100<11) ? 1 : (n%100>10 && n%100<20 ) ? 2 : 3);},
        20: function(n) {return Number(n==1 ? 0 : (n===0 || (n%100 > 0 && n%100 < 20)) ? 1 : 2);},
        21: function(n) {return Number(n%100==1 ? 1 : n%100==2 ? 2 : n%100==3 || n%100==4 ? 3 : 0); }
    };
    
    var pluralExtensions = {
    
        rules: (function () {
            var l, rules = {};
            for (l=_rules.length; l-- ;) {
                rules[_rules[l][0]] = {
                    name: _rules[l][1],
                    numbers: _rules[l][2],
                    plurals: _rulesPluralsTypes[_rules[l][3]]
                }
            }
            return rules;
        }()),
    
        // you can add your own pluralExtensions
        addRule: function(lng, obj) {
            pluralExtensions.rules[lng] = obj;
        },
    
        setCurrentLng: function(lng) {
            if (!pluralExtensions.currentRule || pluralExtensions.currentRule.lng !== lng) {
                var parts = lng.split('-');
    
                pluralExtensions.currentRule = {
                    lng: lng,
                    rule: pluralExtensions.rules[parts[0]]
                };
            }
        },
    
        needsPlural: function(lng, count) {
            var parts = lng.split('-');
    
            var ext;
            if (pluralExtensions.currentRule && pluralExtensions.currentRule.lng === lng) {
                ext = pluralExtensions.currentRule.rule; 
            } else {
                ext = pluralExtensions.rules[parts[f.getCountyIndexOfLng(lng)]];
            }
    
            if (ext && ext.numbers.length <= 1) {
                return false;
            } else {
                return this.get(lng, count) !== 1;
            }
        },
    
        get: function(lng, count) {
            var parts = lng.split('-');
    
            function getResult(l, c) {
                var ext;
                if (pluralExtensions.currentRule && pluralExtensions.currentRule.lng === lng) {
                    ext = pluralExtensions.currentRule.rule; 
                } else {
                    ext = pluralExtensions.rules[l];
                }
                if (ext) {
                    var i;
                    if (ext.noAbs) {
                        i = ext.plurals(c);
                    } else {
                        i = ext.plurals(Math.abs(c));
                    }
                    
                    var number = ext.numbers[i];
                    if (ext.numbers.length === 2 && ext.numbers[0] === 1) {
                        if (number === 2) { 
                            number = -1; // regular plural
                        } else if (number === 1) {
                            number = 1; // singular
                        }
                    }//console.log(count + '-' + number);
                    return number;
                } else {
                    return c === 1 ? '1' : '-1';
                }
            }
                        
            return getResult(parts[f.getCountyIndexOfLng(lng)], count);
        }
    
    };
    var postProcessors = {};
    var addPostProcessor = function(name, fc) {
        postProcessors[name] = fc;
    };
    // sprintf support
    var sprintf = (function() {
        function get_type(variable) {
            return Object.prototype.toString.call(variable).slice(8, -1).toLowerCase();
        }
        function str_repeat(input, multiplier) {
            for (var output = []; multiplier > 0; output[--multiplier] = input) {/* do nothing */}
            return output.join('');
        }
    
        var str_format = function() {
            if (!str_format.cache.hasOwnProperty(arguments[0])) {
                str_format.cache[arguments[0]] = str_format.parse(arguments[0]);
            }
            return str_format.format.call(null, str_format.cache[arguments[0]], arguments);
        };
    
        str_format.format = function(parse_tree, argv) {
            var cursor = 1, tree_length = parse_tree.length, node_type = '', arg, output = [], i, k, match, pad, pad_character, pad_length;
            for (i = 0; i < tree_length; i++) {
                node_type = get_type(parse_tree[i]);
                if (node_type === 'string') {
                    output.push(parse_tree[i]);
                }
                else if (node_type === 'array') {
                    match = parse_tree[i]; // convenience purposes only
                    if (match[2]) { // keyword argument
                        arg = argv[cursor];
                        for (k = 0; k < match[2].length; k++) {
                            if (!arg.hasOwnProperty(match[2][k])) {
                                throw(sprintf('[sprintf] property "%s" does not exist', match[2][k]));
                            }
                            arg = arg[match[2][k]];
                        }
                    }
                    else if (match[1]) { // positional argument (explicit)
                        arg = argv[match[1]];
                    }
                    else { // positional argument (implicit)
                        arg = argv[cursor++];
                    }
    
                    if (/[^s]/.test(match[8]) && (get_type(arg) != 'number')) {
                        throw(sprintf('[sprintf] expecting number but found %s', get_type(arg)));
                    }
                    switch (match[8]) {
                        case 'b': arg = arg.toString(2); break;
                        case 'c': arg = String.fromCharCode(arg); break;
                        case 'd': arg = parseInt(arg, 10); break;
                        case 'e': arg = match[7] ? arg.toExponential(match[7]) : arg.toExponential(); break;
                        case 'f': arg = match[7] ? parseFloat(arg).toFixed(match[7]) : parseFloat(arg); break;
                        case 'o': arg = arg.toString(8); break;
                        case 's': arg = ((arg = String(arg)) && match[7] ? arg.substring(0, match[7]) : arg); break;
                        case 'u': arg = Math.abs(arg); break;
                        case 'x': arg = arg.toString(16); break;
                        case 'X': arg = arg.toString(16).toUpperCase(); break;
                    }
                    arg = (/[def]/.test(match[8]) && match[3] && arg >= 0 ? '+'+ arg : arg);
                    pad_character = match[4] ? match[4] == '0' ? '0' : match[4].charAt(1) : ' ';
                    pad_length = match[6] - String(arg).length;
                    pad = match[6] ? str_repeat(pad_character, pad_length) : '';
                    output.push(match[5] ? arg + pad : pad + arg);
                }
            }
            return output.join('');
        };
    
        str_format.cache = {};
    
        str_format.parse = function(fmt) {
            var _fmt = fmt, match = [], parse_tree = [], arg_names = 0;
            while (_fmt) {
                if ((match = /^[^\x25]+/.exec(_fmt)) !== null) {
                    parse_tree.push(match[0]);
                }
                else if ((match = /^\x25{2}/.exec(_fmt)) !== null) {
                    parse_tree.push('%');
                }
                else if ((match = /^\x25(?:([1-9]\d*)\$|\(([^\)]+)\))?(\+)?(0|'[^$])?(-)?(\d+)?(?:\.(\d+))?([b-fosuxX])/.exec(_fmt)) !== null) {
                    if (match[2]) {
                        arg_names |= 1;
                        var field_list = [], replacement_field = match[2], field_match = [];
                        if ((field_match = /^([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                            field_list.push(field_match[1]);
                            while ((replacement_field = replacement_field.substring(field_match[0].length)) !== '') {
                                if ((field_match = /^\.([a-z_][a-z_\d]*)/i.exec(replacement_field)) !== null) {
                                    field_list.push(field_match[1]);
                                }
                                else if ((field_match = /^\[(\d+)\]/.exec(replacement_field)) !== null) {
                                    field_list.push(field_match[1]);
                                }
                                else {
                                    throw('[sprintf] huh?');
                                }
                            }
                        }
                        else {
                            throw('[sprintf] huh?');
                        }
                        match[2] = field_list;
                    }
                    else {
                        arg_names |= 2;
                    }
                    if (arg_names === 3) {
                        throw('[sprintf] mixing positional and named placeholders is not (yet) supported');
                    }
                    parse_tree.push(match);
                }
                else {
                    throw('[sprintf] huh?');
                }
                _fmt = _fmt.substring(match[0].length);
            }
            return parse_tree;
        };
    
        return str_format;
    })();
    
    var vsprintf = function(fmt, argv) {
        argv.unshift(fmt);
        return sprintf.apply(null, argv);
    };
    
    addPostProcessor("sprintf", function(val, key, opts) {
        if (!opts.sprintf) return val;
    
        if (Object.prototype.toString.apply(opts.sprintf) === '[object Array]') {
            return vsprintf(val, opts.sprintf);
        } else if (typeof opts.sprintf === 'object') {
            return sprintf(val, opts.sprintf);
        }
    
        return val;
    });
    // public api interface
    i18n.init = init;
    i18n.setLng = setLng;
    i18n.preload = preload;
    i18n.addResourceBundle = addResourceBundle;
    i18n.hasResourceBundle = hasResourceBundle;
    i18n.addResource = addResource;
    i18n.addResources = addResources;
    i18n.removeResourceBundle = removeResourceBundle;
    i18n.loadNamespace = loadNamespace;
    i18n.loadNamespaces = loadNamespaces;
    i18n.setDefaultNamespace = setDefaultNamespace;
    i18n.t = translate;
    i18n.translate = translate;
    i18n.exists = exists;
    i18n.detectLanguage = f.detectLanguage;
    i18n.pluralExtensions = pluralExtensions;
    i18n.sync = sync;
    i18n.functions = f;
    i18n.lng = lng;
    i18n.addPostProcessor = addPostProcessor;
    i18n.options = o;

})();
},{"jquery":"jquery"}],64:[function(require,module,exports){
// Top level file is just a mixin of submodules & constants
'use strict';

var assign    = require('./lib/utils/common').assign;

var deflate   = require('./lib/deflate');
var inflate   = require('./lib/inflate');
var constants = require('./lib/zlib/constants');

var pako = {};

assign(pako, deflate, inflate, constants);

module.exports = pako;
},{"./lib/deflate":65,"./lib/inflate":66,"./lib/utils/common":67,"./lib/zlib/constants":70}],65:[function(require,module,exports){
'use strict';


var zlib_deflate = require('./zlib/deflate.js');
var utils = require('./utils/common');
var strings = require('./utils/strings');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');


/* Public constants ==========================================================*/
/* ===========================================================================*/

var Z_NO_FLUSH      = 0;
var Z_FINISH        = 4;

var Z_OK            = 0;
var Z_STREAM_END    = 1;

var Z_DEFAULT_COMPRESSION = -1;

var Z_DEFAULT_STRATEGY    = 0;

var Z_DEFLATED  = 8;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overriden.
 **/

/**
 * Deflate.result -> Uint8Array|Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
var Deflate = function(options) {

  this.options = utils.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY,
    to: ''
  }, options || {});

  var opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
    opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
    opt.windowBits += 16;
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm = new zstream();
  this.strm.avail_out = 0;

  var status = zlib_deflate.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );

  if (status !== Z_OK) {
    throw new Error(msg[status]);
  }

  if (opt.header) {
    zlib_deflate.deflateSetHeader(this.strm, opt.header);
  }
};

/**
 * Deflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|String): input data. Strings will be converted to
 *   utf8 byte sequence.
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That flush internal pending buffers and call
 * [[Deflate#onEnd]].
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * array format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;

  if (this.ended) { return false; }

  _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // If we need to compress text, change encoding to utf8.
    strm.input = strings.string2buf(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

    if (status !== Z_STREAM_END && status !== Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }
    if (strm.avail_out === 0 || (strm.avail_in === 0 && _mode === Z_FINISH)) {
      if (this.options.to === 'string') {
        this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
      } else {
        this.onData(utils.shrinkBuf(strm.output, strm.next_out));
      }
    }
  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

  // Finalize on the last chunk.
  if (_mode === Z_FINISH) {
    status = zlib_deflate.deflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === Z_OK;
  }

  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that input stream complete
 * or error happenned. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === Z_OK) {
    if (this.options.to === 'string') {
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate alrorythm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate(input, options) {
  var deflator = new Deflate(options);

  deflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (deflator.err) { throw deflator.msg; }

  return deflator.result;
}


/**
 * deflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


/**
 * gzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but create gzip wrapper instead of
 * deflate one.
 **/
function gzip(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate(input, options);
}


exports.Deflate = Deflate;
exports.deflate = deflate;
exports.deflateRaw = deflateRaw;
exports.gzip = gzip;
},{"./utils/common":67,"./utils/strings":68,"./zlib/deflate.js":72,"./zlib/messages":77,"./zlib/zstream":79}],66:[function(require,module,exports){
'use strict';


var zlib_inflate = require('./zlib/inflate.js');
var utils = require('./utils/common');
var strings = require('./utils/strings');
var c = require('./zlib/constants');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');
var gzheader = require('./zlib/gzheader');


/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overriden.
 **/

/**
 * Inflate.result -> Uint8Array|Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `Z_FINISH` / `true` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `windowBits`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * console.log(inflate.result);
 * ```
 **/
var Inflate = function(options) {

  this.options = utils.assign({
    chunkSize: 16384,
    windowBits: 0,
    to: ''
  }, options || {});

  var opt = this.options;

  // Force window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) { opt.windowBits = -15; }
  }

  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
      !(options && options.windowBits)) {
    opt.windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if window size not set, force it to max when gzip possible
  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
    // bit 3 (16) -> gzipped data
    // bit 4 (32) -> autodetect gzip/deflate
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm   = new zstream();
  this.strm.avail_out = 0;

  var status  = zlib_inflate.inflateInit2(
    this.strm,
    opt.windowBits
  );

  if (status !== c.Z_OK) {
    throw new Error(msg[status]);
  }

  this.header = new gzheader();

  zlib_inflate.inflateGetHeader(this.strm, this.header);
};

/**
 * Inflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|String): input data
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That flush internal pending buffers and call
 * [[Inflate#onEnd]].
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;
  var next_out_utf8, tail, utf8str;

  if (this.ended) { return false; }
  _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // Only binary strings can be decompressed on practice
    strm.input = strings.binstring2buf(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }

    status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }

    if (strm.next_out) {
      if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && _mode === c.Z_FINISH)) {

        if (this.options.to === 'string') {

          next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

          tail = strm.next_out - next_out_utf8;
          utf8str = strings.buf2string(strm.output, next_out_utf8);

          // move tail
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

          this.onData(utf8str);

        } else {
          this.onData(utils.shrinkBuf(strm.output, strm.next_out));
        }
      }
    }
  } while ((strm.avail_in > 0) && status !== c.Z_STREAM_END);

  if (status === c.Z_STREAM_END) {
    _mode = c.Z_FINISH;
  }
  // Finalize on the last chunk.
  if (_mode === c.Z_FINISH) {
    status = zlib_inflate.inflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === c.Z_OK;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell inflate that input stream complete
 * or error happenned. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === c.Z_OK) {
    if (this.options.to === 'string') {
      // Glue & convert here, until we teach pako to send
      // utf8 alligned strings to onData
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
 *   , output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err)
 *   console.log(err);
 * }
 * ```
 **/
function inflate(input, options) {
  var inflator = new Inflate(options);

  inflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) { throw inflator.msg; }

  return inflator.result;
}


/**
 * inflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * The same as [[inflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function inflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return inflate(input, options);
}


/**
 * ungzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Just shortcut to [[inflate]], because it autodetects format
 * by header.content. Done for convenience.
 **/


exports.Inflate = Inflate;
exports.inflate = inflate;
exports.inflateRaw = inflateRaw;
exports.ungzip  = inflate;

},{"./utils/common":67,"./utils/strings":68,"./zlib/constants":70,"./zlib/gzheader":73,"./zlib/inflate.js":75,"./zlib/messages":77,"./zlib/zstream":79}],67:[function(require,module,exports){
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof(source) !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for(var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for(var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);
},{}],68:[function(require,module,exports){
// String encode/decode helpers
'use strict';


var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
var STR_APPLY_OK = true;
var STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }
try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch(__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new utils.Buf8(256);
for (var i=0; i<256; i++) {
  _utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
}
_utf8len[254]=_utf8len[254]=1; // Invalid sequence start


// convert string to array (typed, when possible)
exports.string2buf = function (str) {
  var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
      c2 = str.charCodeAt(m_pos+1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new utils.Buf8(buf_len);

  // convert
  for (i=0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
      c2 = str.charCodeAt(m_pos+1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xC0 | (c >>> 6);
      buf[i++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xE0 | (c >>> 12);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | (c >>> 18);
      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    }
  }

  return buf;
};

// Helper (used in 2 places)
function buf2binstring(buf, len) {
  // use fallback for big arrays to avoid stack overflow
  if (len < 65537) {
    if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
      return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
    }
  }

  var result = '';
  for(var i=0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
}


// Convert byte array to binary string
exports.buf2binstring = function(buf) {
  return buf2binstring(buf, buf.length);
};


// Convert binary string (typed, when possible)
exports.binstring2buf = function(str) {
  var buf = new utils.Buf8(str.length);
  for(var i=0, len=buf.length; i < len; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
};


// convert array to string
exports.buf2string = function (buf, max) {
  var i, out, c, c_len;
  var len = max || buf.length;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  var utf16buf = new Array(len*2);

  for (out=0, i=0; i<len;) {
    c = buf[i++];
    // quick process ascii
    if (c < 0x80) { utf16buf[out++] = c; continue; }

    c_len = _utf8len[c];
    // skip 5 & 6 byte codes
    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

    // apply mask on first byte
    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    // join the rest
    while (c_len > 1 && i < len) {
      c = (c << 6) | (buf[i++] & 0x3f);
      c_len--;
    }

    // terminated by end of string?
    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    }
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
exports.utf8border = function(buf, max) {
  var pos;

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  pos = max-1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Fuckup - very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means vuffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

},{"./common":67}],69:[function(require,module,exports){
'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0
    , s2 = ((adler >>> 16) & 0xffff) |0
    , n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


module.exports = adler32;
},{}],70:[function(require,module,exports){
module.exports = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
},{}],71:[function(require,module,exports){
'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for(var n =0; n < 256; n++){
    c = n;
    for(var k =0; k < 8; k++){
      c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable
    , end = pos + len;

  crc = crc ^ (-1);

  for (var i = pos; i < end; i++ ) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


module.exports = crc32;
},{}],72:[function(require,module,exports){
'use strict';

var utils   = require('../utils/common');
var trees   = require('./trees');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var msg   = require('./messages');

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}


function flush_block_only (s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  utils.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;

      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */

      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = (m >= _w_size ? m - _w_size : 0);
      } while (--n);

      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);

      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH-1]) & s.hash_mask;

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
    /* Fill the window as much as possible: */
    if (s.lookahead <= 1) {

      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }

      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

    s.strstart += s.lookahead;
    s.lookahead = 0;

    /* Emit a stored block if pending_buf will be full: */
    var max_start = s.block_start + max_block_size;

    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/


    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */
    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }

  s.insert = 0;

  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH-1)) ? s.strstart : MIN_MATCH-1);
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH-1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size-MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH-1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = trees._tr_tally(s, s.strstart - 1- s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length-1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH-1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH-1 ? s.strstart : MIN_MATCH-1;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
var Config = function (good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
};

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new utils.Buf16((2*D_CODES+1) * 2);
  this.bl_tree    = new utils.Buf16((2*BL_CODES+1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new utils.Buf16(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new utils.Buf16(2*L_CODES+1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new utils.Buf16(2*L_CODES+1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
    lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new utils.Buf8(s.w_size * 2);
  s.head = new utils.Buf16(s.hash_size);
  s.prev = new utils.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new utils.Buf8(s.pending_buf_size);

  s.d_buf = s.lit_bufsize >> 1;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
}


function deflate(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
    flush > Z_BLOCK || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
      (!strm.input && strm.avail_in !== 0) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

    if (s.wrap === 2) { // GZIP header
      strm.adler = 0;  //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) { // s->gzhead == Z_NULL
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      }
      else {
        put_byte(s, (s.gzhead.text ? 1 : 0) +
                    (s.gzhead.hcrc ? 2 : 0) +
                    (!s.gzhead.extra ? 0 : 4) +
                    (!s.gzhead.name ? 0 : 8) +
                    (!s.gzhead.comment ? 0 : 16)
                );
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    else // DEFLATE header
    {
      var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
      var level_flags = -1;

      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= (level_flags << 6);
      if (s.strstart !== 0) { header |= PRESET_DICT; }
      header += 31 - (header % 31);

      s.status = BUSY_STATE;
      putShortMSB(s, header);

      /* Save the adler32 of the preset dictionary: */
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */

      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    }
    else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg){
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    }
    else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    }
    else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    }
    else {
      s.status = BUSY_STATE;
    }
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH) {
    return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
      (s.strategy === Z_RLE ? deflate_rle(s, flush) :
        configuration_table[s.level].func(s, flush));

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      }
      else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

        trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH) { return Z_OK; }
  if (s.wrap <= 0) { return Z_STREAM_END; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK : Z_STREAM_END;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
    status !== EXTRA_STATE &&
    status !== NAME_STATE &&
    status !== COMMENT_STATE &&
    status !== HCRC_STATE &&
    status !== BUSY_STATE &&
    status !== FINISH_STATE
  ) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
}

/* =========================================================================
 * Copy the source state to the destination state
 */
//function deflateCopy(dest, source) {
//
//}

exports.deflateInit = deflateInit;
exports.deflateInit2 = deflateInit2;
exports.deflateReset = deflateReset;
exports.deflateResetKeep = deflateResetKeep;
exports.deflateSetHeader = deflateSetHeader;
exports.deflate = deflate;
exports.deflateEnd = deflateEnd;
exports.deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateSetDictionary = deflateSetDictionary;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/
},{"../utils/common":67,"./adler32":69,"./crc32":71,"./messages":77,"./trees":78}],73:[function(require,module,exports){
'use strict';


function GZheader() {
  /* true if compressed data believed to be text */
  this.text       = 0;
  /* modification time */
  this.time       = 0;
  /* extra flags (not used when writing a gzip file) */
  this.xflags     = 0;
  /* operating system */
  this.os         = 0;
  /* pointer to extra field or Z_NULL if none */
  this.extra      = null;
  /* extra field length (valid if extra != Z_NULL) */
  this.extra_len  = 0; // Actually, we don't need it in JS,
                       // but leave for few code modifications

  //
  // Setup limits is not necessary because in js we should not preallocate memory 
  // for inflate use constant limit in 65536 bytes
  //

  /* space at extra (only when reading header) */
  // this.extra_max  = 0;
  /* pointer to zero-terminated file name or Z_NULL */
  this.name       = '';
  /* space at name (only when reading header) */
  // this.name_max   = 0;
  /* pointer to zero-terminated comment or Z_NULL */
  this.comment    = '';
  /* space at comment (only when reading header) */
  // this.comm_max   = 0;
  /* true if there was or will be a header crc */
  this.hcrc       = 0;
  /* true when done reading gzip header (not used when writing a gzip file) */
  this.done       = false;
}

module.exports = GZheader;
},{}],74:[function(require,module,exports){
'use strict';

// See state defs from inflate.js
var BAD = 30;       /* got a data error -- remain here until reset */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
module.exports = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  var window;                 /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break top;
                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

},{}],75:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var inflate_fast = require('./inffast');
var inflate_table = require('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function ZSWAP32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
  this.work = new utils.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix, distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    var sym;

    lenfix = new utils.Buf32(512);
    distfix = new utils.Buf32(32);

    /* literal/length table */
    sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, {bits: 9});

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, {bits: 5});

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new utils.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    utils.arraySet(state.window,src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      utils.arraySet(state.window,src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


  if (!strm || !strm.state || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = false;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head) {
            len = state.head.extra_len - state.length;
            if (!state.head.extra) {
              // Use untyped array for more conveniend processing later
              state.head.extra = new Array(state.head.extra_len);
            }
            utils.arraySet(
              state.head.extra,
              input,
              next,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              copy,
              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
              len
            );
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
          }
          if (state.flags & 0x0200) {
            state.check = crc32(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.name_max*/)) {
            state.head.name += String.fromCharCode(len);
          }
        } while (len && copy < have);

        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.comm_max*/)) {
            state.head.comment += String.fromCharCode(len);
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = true;
      }
      strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = ZSWAP32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        utils.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      // We have separate tables & no pointers. 2 commented lines below not needed.
      //state.next = state.codes;
      //state.lencode = state.next;
      // Switch to use dynamic table
      state.lencode = state.lendyn;
      state.lenbits = 7;

      opts = {bits: state.lenbits};
      ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here_bits;
          bits -= here_bits;
          //---//
          state.lens[state.have++] = here_val;
        }
        else {
          if (here_val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here_bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here_val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here_bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here_bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lenbits = 9;

      opts = {bits: state.lenbits};
      ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.lenbits = opts.bits;
      // state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      //state.distcode.copy(state.codes);
      // Switch to use dynamic table
      state.distcode = state.distdyn;
      opts = {bits: state.distbits};
      ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.distbits = opts.bits;
      // state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inflate_fast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        here = state.lencode[hold & ((1 << state.lenbits) -1)];  /*BITS(state.lenbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if (here_bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here_op && (here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.lencode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      state.length = here_val;
      if (here_op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here_op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here_op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here_op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        here = state.distcode[hold & ((1 << state.distbits) -1)];/*BITS(state.distbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if ((here_bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.distcode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      if (here_op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here_val;
      state.extra = (here_op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          // Use '|' insdead of '+' to make sure that result is signed
          hold |= input[next++] << bits;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

        }
        _out = left;
        // NB: crc32 stored as signed 32-bit int, ZSWAP32 returns signed too
        if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
    ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
    return Z_STREAM_ERROR;
  }

  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK;
}


exports.inflateReset = inflateReset;
exports.inflateReset2 = inflateReset2;
exports.inflateResetKeep = inflateResetKeep;
exports.inflateInit = inflateInit;
exports.inflateInit2 = inflateInit2;
exports.inflate = inflate;
exports.inflateEnd = inflateEnd;
exports.inflateGetHeader = inflateGetHeader;
exports.inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSetDictionary = inflateSetDictionary;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/
},{"../utils/common":67,"./adler32":69,"./crc32":71,"./inffast":74,"./inftrees":76}],76:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

var MAXBITS = 15;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES = 0;
var LENS = 1;
var DISTS = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES) {
      base = extra = work;    /* dummy value--not used */
      end = 19;
  } else if (type === LENS) {
      base = lbase;
      base_index -= 257;
      extra = lext;
      extra_index -= 257;
      end = 256;
  } else {                    /* DISTS */
      base = dbase;
      extra = dext;
      end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS && used > ENOUGH_LENS) ||
    (type === DISTS && used > ENOUGH_DISTS)) {
    return 1;
  }

  var i=0;
  /* process all codes and make table entries */
  for (;;) {
    i++;
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base[base_index + work[sym]];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS && used > ENOUGH_LENS) ||
        (type === DISTS && used > ENOUGH_DISTS)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

},{"../utils/common":67}],77:[function(require,module,exports){
'use strict';

module.exports = {
  '2':    'need dictionary',     /* Z_NEED_DICT       2  */
  '1':    'stream end',          /* Z_STREAM_END      1  */
  '0':    '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};
},{}],78:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;

/*============================================================================*/


function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH    = 3;
var MAX_MATCH    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS      = 256;
/* number of literal bytes 0..255 */

var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES       = 30;
/* number of distance codes */

var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */

var MAX_BITS      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES+2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH-MIN_MATCH+1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


var StaticTreeDesc = function (static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
};


var static_l_desc;
var static_d_desc;
var static_bl_desc;


var TreeDesc = function(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
};



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c*2]/*.Code*/, tree[c*2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max]*2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max+1; h < HEAP_SIZE; h++) {
    n = s.heap[h];
    bits = tree[tree[n*2 +1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n*2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n-base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n*2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length-1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits+1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m*2 + 1]/*.Len*/ !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m*2 + 1]/*.Len*/)*tree[m*2]/*.Freq*/;
        tree[m*2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS+1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS; bits++) {
    next_code[bits] = code = (code + bl_count[bits-1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    var len = tree[n*2 + 1]/*.Len*/;
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n*2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES-1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1<<extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length-1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0 ; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1<<extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for ( ; code < D_CODES; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1<<(extra_dbits[code]-7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n*2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n*2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES+1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES; n++) {
    static_dtree[n*2 + 1]/*.Len*/ = 5;
    static_dtree[n*2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS+1, L_CODES, MAX_BITS);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
  static_bl_desc =new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES; n++) { s.bl_tree[n*2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK*2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n*2;
  var _m2 = m*2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j+1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
    do {
      dist = (s.pending_buf[s.d_buf + lx*2] << 8) | (s.pending_buf[s.d_buf + lx*2 + 1]);
      lc = s.pending_buf[s.l_buf + lx];
      lx++;

      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code+LITERALS+1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");

    } while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n*2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node*2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n*2 + 1]/*.Dad*/ = tree[m*2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code+1)*2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6*2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10*2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138*2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count-3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count-3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count-11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES-1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex]*2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3*(max_blindex+1) + 5+5+4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes-257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes-1,   5);
  send_bits(s, blcodes-4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank]*2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes-1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes-1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && (s.dyn_ltree[n*2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES<<1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len+3+7) >>> 3;
    static_lenb = (s.static_len+3+7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES<<1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES<<1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1, max_blindex+1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc*2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc]+LITERALS+1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize-1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

exports._tr_init  = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block  = _tr_flush_block;
exports._tr_tally = _tr_tally;
exports._tr_align = _tr_align;
},{"../utils/common":67}],79:[function(require,module,exports){
'use strict';


function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;
},{}],80:[function(require,module,exports){
module.exports = function arrayEquals(array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l = this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!arrayEquals.apply(this[i], [array[i]]))
                return false;
        } else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal:
            // {x:20} != {x:20}
            return false;
        }
    }
    return true;
}


},{}],81:[function(require,module,exports){
exports.Interop = require('./interop');

},{"./interop":82}],82:[function(require,module,exports){
var transform = require('./transform');
var arrayEquals = require('./array-equals');

function Interop() { }
module.exports = Interop;

/**
 * This map holds the most recent Plan A offer/answer SDP that was converted
 * to Plan B, with the SDP type ('offer' or 'answer') as keys and the SDP
 * string as values.
 *
 * @type {{}}
 */
var cache = {};

/**
 * This method transforms a Plan A SDP to an equivalent Plan B SDP. A
 * PeerConnection wrapper transforms the SDP to Plan B before passing it to the
 * application.
 *
 * @param desc
 * @returns {*}
 */
Interop.prototype.toPlanB = function(desc) {

    //#region Preliminary input validation.

    if (typeof desc !== 'object' || desc === null ||
        typeof desc.sdp !== 'string') {
        console.warn('An empty description was passed as an argument.');
        return desc;
    }

    // Objectify the SDP for easier manipulation.
    var session = transform.parse(desc.sdp);

    // If the SDP contains no media, there's nothing to transform.
    if (typeof session.media === 'undefined' ||
        !Array.isArray(session.media) || session.media.length === 0) {
        console.warn('The description has no media.');
        return desc;
    }

    // Try some heuristics to "make sure" this is a Plan A SDP. Plan B SDP has
    // a video, an audio and a data "channel" at most.
    if (session.media.length <= 3 && session.media.every(function(m) {
            return ['video', 'audio', 'data'].indexOf(m.mid) !== -1;
        })) {
        console.warn('This description does not look like Plan A.');
        return desc;
    }

    //#endregion

    // Plan A SDP is our "precious". Cache it for later use in the Plan B ->
    // Plan A transformation.
    cache[desc.type] = desc.sdp;

    //#region Convert from Plan A to Plan B.

    // We rebuild the session.media array.
    var media = session.media;
    session.media = [];

    // Associative array that maps channel types to channel objects for fast
    // access to channel objects by their type, e.g. channels['audio']->channel
    // obj.
    var channels = {};

    // Used to build the group:BUNDLE value after the channels construction
    // loop.
    var types = [];

    // Implode the Plan A m-lines/tracks into Plan B "channels".
    media.forEach(function(mLine) {

        // rtcp-mux is required in the Plan B SDP.
        if (typeof mLine.rtcpMux !== 'string' ||
            mLine.rtcpMux !== 'rtcp-mux') {
            throw new Error('Cannot convert to Plan B because m-lines ' +
                'without the rtcp-mux attribute were found.');
        }

        // If we don't have a channel for this mLine.type, then use this mLine
        // as the channel basis.
        if (typeof channels[mLine.type] === 'undefined') {
            channels[mLine.type] = mLine;
        }

        // Add sources to the channel and handle a=msid.
        if (typeof mLine.sources === 'object') {
            Object.keys(mLine.sources).forEach(function(ssrc) {
                // Assign the sources to the channel.
                channels[mLine.type].sources[ssrc] = mLine.sources[ssrc];

                // In Plan B the msid is an SSRC attribute. Also, we don't care
                // about the obsolete label and mslabel attributes.
                channels[mLine.type].sources[ssrc].msid = mLine.msid;

                // NOTE ssrcs in ssrc groups will share msids, as
                // draft-uberti-rtcweb-plan-00 mandates.
            });
        }

        // Add ssrc groups to the channel.
        if (typeof mLine.ssrcGroups !== 'undefined' &&
                Array.isArray(mLine.ssrcGroups)) {

            // Create the ssrcGroups array, if it's not defined.
            if (typeof channel.ssrcGroups === 'undefined' ||
                    !Array.isArray(channel.ssrcGroups)) {
                channel.ssrcGroups = [];
            }

            channel.ssrcGroups = channel.ssrcGroups.concat(mLine.ssrcGroups);
        }

        if (channels[mLine.type] === mLine) {
            // Copy ICE related stuff from the principal media line.
            mLine.candidates = media[0].candidates;
            mLine.iceUfrag = media[0].iceUfrag;
            mLine.icePwd = media[0].icePwd;
            mLine.fingerprint = media[0].fingerprint;

            // Plan B mids are in ['audio', 'video', 'data']
            mLine.mid = mLine.type;

            // Plan B doesn't support/need the bundle-only attribute.
            delete mLine.bundleOnly;

            // In Plan B the msid is an SSRC attribute.
            delete mLine.msid;

            // Used to build the group:BUNDLE value after this loop.
            types.push(mLine.type);

            // Add the channel to the new media array.
            session.media.push(mLine);
        }
    });

    // We regenerate the BUNDLE group with the new mids.
    session.groups.every(function(group) {
        if (group.type === 'BUNDLE') {
            group.mids = types.join(' ');
            return false;
        } else {
            return true;
        }
    });

    // msid semantic
    session.msidSemantic = {
        semantic: 'WMS',
        token: '*'
    };

    var resStr = transform.write(session);

    return new RTCSessionDescription({
        type: desc.type,
        sdp: resStr
    });

    //#endregion
};

/**
 * This method transforms a Plan B SDP to an equivalent Plan A SDP. A
 * PeerConnection wrapper transforms the SDP to Plan A before passing it to FF.
 *
 * @param desc
 * @returns {*}
 */
Interop.prototype.toPlanA = function(desc) {

    //#region Preliminary input validation.

    if (typeof desc !== 'object' || desc === null ||
        typeof desc.sdp !== 'string') {
        console.warn('An empty description was passed as an argument.');
        return desc;
    }

    var session = transform.parse(desc.sdp);

    // If the SDP contains no media, there's nothing to transform.
    if (typeof session.media === 'undefined' ||
        !Array.isArray(session.media) || session.media.length === 0) {
        console.warn('The description has no media.');
        return desc;
    }

    // Try some heuristics to "make sure" this is a Plan B SDP. Plan B SDP has
    // a video, an audio and a data "channel" at most.
    if (session.media.length > 3 || !session.media.every(function(m) {
            return ['video', 'audio', 'data'].indexOf(m.mid) !== -1;
        })) {
        console.warn('This description does not look like Plan B.');
        return desc;
    }

    // Make sure this Plan B SDP can be converted to a Plan A SDP.
    var mids = [];
    session.media.forEach(function(m) {
        mids.push(m.mid);
    });

    var hasBundle = false;
    if (typeof session.groups !== 'undefined' &&
        Array.isArray(session.groups)) {
        hasBundle = session.groups.every(function(g) {
            return g.type !== 'BUNDLE' ||
                arrayEquals.apply(g.mids.sort(), [mids.sort()]);
        });
    }

    if (!hasBundle) {
        throw new Error("Cannot convert to Plan A because m-lines that are " +
            "not bundled were found.");
    }

    //#endregion


    //#region Convert from Plan B to Plan A.

    // Unfortunately, a Plan B offer/answer doesn't have enough information to
    // rebuild an equivalent Plan A offer/answer.
    //
    // For example, if this is a local answer (in Plan A style) that we convert
    // to Plan B prior to handing it over to the application (the
    // PeerConnection wrapper called us, for instance, after a successful
    // createAnswer), we want to remember the m-line at which we've seen the
    // (local) SSRC. That's because when the application wants to do call the
    // SLD method, forcing us to do the inverse transformation (from Plan B to
    // Plan A), we need to know to which m-line to assign the (local) SSRC. We
    // also need to know all the other m-lines that the original answer had and
    // include them in the transformed answer as well.
    //
    // Another example is if this is a remote offer that we convert to Plan B
    // prior to giving it to the application, we want to remember the mid at
    // which we've seen the (remote) SSRC.
    //
    // In the iteration that follows, we use the cached Plan A (if it exists)
    // to assign mids to ssrcs.

    var cached;
    if (typeof cache[desc.type] !== 'undefined') {
        cached = transform.parse(cache[desc.type]);
    }

    // A helper map that sends mids to m-line objects. We use it later to
    // rebuild the Plan A style session.media array.
    var media = {};
    session.media.forEach(function(channel) {
        if (typeof channel.rtcpMux !== 'string' ||
            channel.rtcpMux !== 'rtcp-mux') {
            throw new Error("Cannot convert to Plan A because m-lines " +
                "without the rtcp-mux attribute were found.");
        }

        // With rtcp-mux and bundle all the channels should have the same ICE
        // stuff.
        var sources = channel.sources;
        var ssrcGroups = channel.ssrcGroups;
        var candidates = channel.candidates;
        var iceUfrag = channel.iceUfrag;
        var icePwd = channel.icePwd;
        var fingerprint = channel.fingerprint;
        var port = channel.port;

        // We'll use the "channel" object as a prototype for each new "mLine"
        // that we create, but first we need to clean it up a bit.
        delete channel.sources;
        delete channel.ssrcGroups;
        delete channel.candidates;
        delete channel.iceUfrag;
        delete channel.icePwd;
        delete channel.fingerprint;
        delete channel.port;
        delete channel.mid;

        // inverted ssrc group map
        var invertedGroups = {};
        if (typeof ssrcGroups !== 'undefined' && Array.isArray(ssrcGroups)) {
            ssrcGroups.forEach(function (ssrcGroup) {

                // TODO(gp) find out how to receive simulcast with FF. For the
                // time being, hide it.
                if (ssrcGroup.semantics === 'SIM') {
                    return;
                }

                if (typeof ssrcGroup.ssrcs !== 'undefined' &&
                    Array.isArray(ssrcGroup.ssrcs)) {
                    ssrcGroup.ssrcs.forEach(function (ssrc) {
                        if (typeof invertedGroups[ssrc] === 'undefined') {
                            invertedGroups[ssrc] = [];
                        }

                        invertedGroups[ssrc].push(ssrcGroup);
                    });
                }
            });
        }

        // ssrc to m-line index.
        var mLines = {};

        if (typeof sources === 'object') {

            // Explode the Plan B channel sources with one m-line per source.
            Object.keys(sources).forEach(function(ssrc) {

                var mLine;
                if (typeof invertedGroups[ssrc] !== 'undefined' &&
                    Array.isArray(invertedGroups[ssrc])) {
                    invertedGroups[ssrc].every(function (ssrcGroup) {
                        // ssrcGroup.ssrcs *is* an Array, no need to check
                        // again here.
                        return ssrcGroup.ssrcs.every(function (related) {
                            if (typeof mLines[related] === 'object') {
                                mLine = mLines[related];
                                return false;
                            } else {
                                return true;
                            }
                        });
                    });
                }

                if (typeof mLine === 'object') {
                    // the m-line already exists. Just add the source.
                    mLine.sources[ssrc] = sources[ssrc];
                    delete sources[ssrc].msid;
                } else {
                // Use the "channel" as a prototype for the "mLine".
                mLine = Object.create(channel);
                mLines[ssrc] = mLine;

                // Assign the msid of the source to the m-line.
                mLine.msid = sources[ssrc].msid;
                delete sources[ssrc].msid;

                // We assign one SSRC per media line.
                mLine.sources = {};
                mLine.sources[ssrc] = sources[ssrc];
                mLine.ssrcGroups = invertedGroups[ssrc];

                // Use the cached Plan A SDP (if it exists) to assign SSRCs to
                // mids.
                if (typeof cached !== 'undefined' &&
                    typeof cached.media !== 'undefined' &&
                    Array.isArray(cached.media)) {

                    cached.media.forEach(function(m) {
                        if (typeof m.sources === 'object') {
                            Object.keys(m.sources).forEach(function(s) {
                                if (s === ssrc) {
                                    mLine.mid = m.mid;
                                }
                            });
                        }
                    });
                }

                if (typeof mLine.mid === 'undefined') {

                    // If this is an SSRC that we see for the first time assign
                    // it a new mid. This is typically the case when this
                    // method is called to transform a remote description for
                    // the first time or when there is a new SSRC in the remote
                    // description because a new peer has joined the
                    // conference. Local SSRCs should have already been added
                    // to the map in the toPlanB method.
                    //
                    // Because FF generates answers in Plan A style, we MUST
                    // already have a cached answer with all the local SSRCs
                    // mapped to some mLine/mid.

                    if (desc.type === 'answer') {
                        throw new Error("An unmapped SSRC was found.");
                    }

                    mLine.mid = [channel.type, '-', ssrc].join('');
                }

                // Include the candidates in the 1st media line.
                mLine.candidates = candidates;
                mLine.iceUfrag = iceUfrag;
                mLine.icePwd = icePwd;
                mLine.fingerprint = fingerprint;
                mLine.port = port;

                media[mLine.mid] = mLine;
                }
            });
        }
    });

    // Rebuild the media array in the right order and add the missing mLines
    // (missing from the Plan B SDP).
    session.media = [];
    mids = []; // reuse

    if (desc.type === 'answer') {

        // The media lines in the answer must match the media lines in the
        // offer. The order is important too. Here we use the cached offer to
        // find the m-lines that are missing (from the converted answer), and
        // use the cached answer to complete the converted answer.

        if (typeof cache['offer'] === 'undefined') {
            throw new Error("An answer is being processed but we couldn't " +
                    "find a cached offer.");
        }

        var cachedOffer = transform.parse(cache['offer']);

        if (typeof cachedOffer === 'undefined' ||
            typeof cachedOffer.media === 'undefined' ||
            !Array.isArray(cachedOffer.media)) {
                // FIXME(gp) is this really a problem in the general case?
                throw new Error("The cached offer has no media.");
        }

        cachedOffer.media.forEach(function(mo) {

            var mLine;
            if (typeof media[mo.mid] === 'undefined') {

                // This is probably an m-line containing a remote track only.
                // It MUST exist in the cached answer as a remote track only
                // mLine.

                cached.media.every(function(ma) {
                    if (mo.mid == ma.mid) {
                        mLine = ma;
                        return false;
                    } else {
                        return true;
                    }
                });
            } else {
                mLine = media[mo.mid];
            }

            if (typeof mLine === 'undefined') {
                throw new Error("The cached offer contains an m-line that " +
                        "doesn't exist neither in the cached answer nor in " +
                        "the converted answer.");
            }

            session.media.push(mLine);
            mids.push(mLine.mid);
        });
    } else {

        // SDP offer/answer (and the JSEP spec) forbids removing an m-section
        // under any circumstances. If we are no longer interested in sending a
        // track, we just remove the msid and ssrc attributes and set it to
        // either a=recvonly (as the reofferer, we must use recvonly if the
        // other side was previously sending on the m-section, but we can also
        // leave the possibility open if it wasn't previously in use), or
        // a=inacive.

        if (typeof cached !== 'undefined' &&
            typeof cached.media !== 'undefined' &&
            Array.isArray(cached.media)) {
            cached.media.forEach(function(pm) {
                mids.push(pm.mid);
                if (typeof media[pm.mid] !== 'undefined') {
                    session.media.push(media[pm.mid]);
                } else {
                    delete pm.msid;
                    delete pm.sources;
                    delete pm.ssrcGroups;
                    pm.direction = 'recvonly';
                    session.media.push(pm);
                }
            });
        }

        // Add all the remaining (new) m-lines of the transformed SDP.
        Object.keys(media).forEach(function(mid) {
            if (mids.indexOf(mid) === -1) {
                mids.push(mid);
                session.media.push(media[mid]);
            }
        });
    }

    // We regenerate the BUNDLE group (since we regenerated the mids)
    session.groups.every(function(group) {
        if (group.type === 'BUNDLE') {
            group.mids = mids.join(' ');
            return false;
        } else {
            return true;
        }
    });

    // msid semantic
    session.msidSemantic = {
        semantic: 'WMS',
        token: '*'
    };

    var resStr = transform.write(session);

    // Cache the transformed SDP (Plan A) for later re-use in this function.
    cache[desc.type] = resStr;

    return new RTCSessionDescription({
        type: desc.type,
        sdp: resStr
    });

    //#endregion
};

},{"./array-equals":80,"./transform":83}],83:[function(require,module,exports){
var transform = require('sdp-transform');

exports.write = function(session, opts) {

  if (typeof session !== 'undefined' &&
      typeof session.media !== 'undefined' &&
      Array.isArray(session.media)) {

    session.media.forEach(function (mLine) {
      // expand sources to ssrcs
      if (typeof mLine.sources !== 'undefined' &&
        Object.keys(mLine.sources).length !== 0) {
          mLine.ssrcs = [];
          Object.keys(mLine.sources).forEach(function (ssrc) {
            var source = mLine.sources[ssrc];
            Object.keys(source).forEach(function (attribute) {
              mLine.ssrcs.push({
                id: ssrc,
                attribute: attribute,
                value: source[attribute]
              });
            });
          });
          delete mLine.sources;
        }

      // join ssrcs in ssrc groups
      if (typeof mLine.ssrcGroups !== 'undefined' &&
        Array.isArray(mLine.ssrcGroups)) {
          mLine.ssrcGroups.forEach(function (ssrcGroup) {
            if (typeof ssrcGroup.ssrcs !== 'undefined' &&
                Array.isArray(ssrcGroup.ssrcs)) {
              ssrcGroup.ssrcs = ssrcGroup.ssrcs.join(' ');
            }
          });
        }
    });
  }

  // join group mids
  if (typeof session !== 'undefined' &&
      typeof session.groups !== 'undefined' && Array.isArray(session.groups)) {

    session.groups.forEach(function (g) {
      if (typeof g.mids !== 'undefined' && Array.isArray(g.mids)) {
        g.mids = g.mids.join(' ');
      }
    });
  }

  return transform.write(session, opts);
};

exports.parse = function(sdp) {
  var session = transform.parse(sdp);

  if (typeof session !== 'undefined' && typeof session.media !== 'undefined' &&
      Array.isArray(session.media)) {

    session.media.forEach(function (mLine) {
      // group sources attributes by ssrc
      if (typeof mLine.ssrcs !== 'undefined' && Array.isArray(mLine.ssrcs)) {
        mLine.sources = {};
        mLine.ssrcs.forEach(function (ssrc) {
          if (!mLine.sources[ssrc.id])
          mLine.sources[ssrc.id] = {};
        mLine.sources[ssrc.id][ssrc.attribute] = ssrc.value;
        });

        delete mLine.ssrcs;
      }

      // split ssrcs in ssrc groups
      if (typeof mLine.ssrcGroups !== 'undefined' &&
        Array.isArray(mLine.ssrcGroups)) {
          mLine.ssrcGroups.forEach(function (ssrcGroup) {
            if (typeof ssrcGroup.ssrcs === 'string') {
              ssrcGroup.ssrcs = ssrcGroup.ssrcs.split(' ');
            }
          });
        }
    });
  }
  // split group mids
  if (typeof session !== 'undefined' &&
      typeof session.groups !== 'undefined' && Array.isArray(session.groups)) {

    session.groups.forEach(function (g) {
      if (typeof g.mids === 'string') {
        g.mids = g.mids.split(' ');
      }
    });
  }

  return session;
};


},{"sdp-transform":85}],84:[function(require,module,exports){
var grammar = module.exports = {
  v: [{
      name: 'version',
      reg: /^(\d*)$/
  }],
  o: [{ //o=- 20518 0 IN IP4 203.0.113.1
    // NB: sessionId will be a String in most cases because it is huge
    name: 'origin',
    reg: /^(\S*) (\d*) (\d*) (\S*) IP(\d) (\S*)/,
    names: ['username', 'sessionId', 'sessionVersion', 'netType', 'ipVer', 'address'],
    format: "%s %s %d %s IP%d %s"
  }],
  // default parsing of these only (though some of these feel outdated)
  s: [{ name: 'name' }],
  i: [{ name: 'description' }],
  u: [{ name: 'uri' }],
  e: [{ name: 'email' }],
  p: [{ name: 'phone' }],
  z: [{ name: 'timezones' }], // TODO: this one can actually be parsed properly..
  r: [{ name: 'repeats' }],   // TODO: this one can also be parsed properly
  //k: [{}], // outdated thing ignored
  t: [{ //t=0 0
    name: 'timing',
    reg: /^(\d*) (\d*)/,
    names: ['start', 'stop'],
    format: "%d %d"
  }],
  c: [{ //c=IN IP4 10.47.197.26
      name: 'connection',
      reg: /^IN IP(\d) (\S*)/,
      names: ['version', 'ip'],
      format: "IN IP%d %s"
  }],
  b: [{ //b=AS:4000
      push: 'bandwidth',
      reg: /^(TIAS|AS|CT|RR|RS):(\d*)/,
      names: ['type', 'limit'],
      format: "%s:%s"
  }],
  m: [{ //m=video 51744 RTP/AVP 126 97 98 34 31
      // NB: special - pushes to session
      // TODO: rtp/fmtp should be filtered by the payloads found here?
      reg: /^(\w*) (\d*) ([\w\/]*)(?: (.*))?/,
      names: ['type', 'port', 'protocol', 'payloads'],
      format: "%s %d %s %s"
  }],
  a: [
    { //a=rtpmap:110 opus/48000/2
      push: 'rtp',
      reg: /^rtpmap:(\d*) ([\w\-]*)\/(\d*)(?:\s*\/(\S*))?/,
      names: ['payload', 'codec', 'rate', 'encoding'],
      format: function (o) {
        return (o.encoding) ?
          "rtpmap:%d %s/%s/%s":
          "rtpmap:%d %s/%s";
      }
    },
    { //a=fmtp:108 profile-level-id=24;object=23;bitrate=64000
      push: 'fmtp',
      reg: /^fmtp:(\d*) (\S*)/,
      names: ['payload', 'config'],
      format: "fmtp:%d %s"
    },
    { //a=control:streamid=0
        name: 'control',
        reg: /^control:(.*)/,
        format: "control:%s"
    },
    { //a=rtcp:65179 IN IP4 193.84.77.194
      name: 'rtcp',
      reg: /^rtcp:(\d*)(?: (\S*) IP(\d) (\S*))?/,
      names: ['port', 'netType', 'ipVer', 'address'],
      format: function (o) {
        return (o.address != null) ?
          "rtcp:%d %s IP%d %s":
          "rtcp:%d";
      }
    },
    { //a=rtcp-fb:98 trr-int 100
      push: 'rtcpFbTrrInt',
      reg: /^rtcp-fb:(\*|\d*) trr-int (\d*)/,
      names: ['payload', 'value'],
      format: "rtcp-fb:%d trr-int %d"
    },
    { //a=rtcp-fb:98 nack rpsi
      push: 'rtcpFb',
      reg: /^rtcp-fb:(\*|\d*) ([\w-_]*)(?: ([\w-_]*))?/,
      names: ['payload', 'type', 'subtype'],
      format: function (o) {
        return (o.subtype != null) ?
          "rtcp-fb:%s %s %s":
          "rtcp-fb:%s %s";
      }
    },
    { //a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
      //a=extmap:1/recvonly URI-gps-string
      push: 'ext',
      reg: /^extmap:([\w_\/]*) (\S*)(?: (\S*))?/,
      names: ['value', 'uri', 'config'], // value may include "/direction" suffix
      format: function (o) {
        return (o.config != null) ?
          "extmap:%s %s %s":
          "extmap:%s %s";
      }
    },
    {
      //a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:PS1uQCVeeCFCanVmcjkpPywjNWhcYD0mXXtxaVBR|2^20|1:32
      push: 'crypto',
      reg: /^crypto:(\d*) ([\w_]*) (\S*)(?: (\S*))?/,
      names: ['id', 'suite', 'config', 'sessionConfig'],
      format: function (o) {
        return (o.sessionConfig != null) ?
          "crypto:%d %s %s %s":
          "crypto:%d %s %s";
      }
    },
    { //a=setup:actpass
      name: 'setup',
      reg: /^setup:(\w*)/,
      format: "setup:%s"
    },
    { //a=mid:1
      name: 'mid',
      reg: /^mid:([^\s]*)/,
      format: "mid:%s"
    },
    { //a=msid:0c8b064d-d807-43b4-b434-f92a889d8587 98178685-d409-46e0-8e16-7ef0db0db64a
      name: 'msid',
      reg: /^msid:(.*)/,
      format: "msid:%s"
    },
    { //a=ptime:20
      name: 'ptime',
      reg: /^ptime:(\d*)/,
      format: "ptime:%d"
    },
    { //a=maxptime:60
      name: 'maxptime',
      reg: /^maxptime:(\d*)/,
      format: "maxptime:%d"
    },
    { //a=sendrecv
      name: 'direction',
      reg: /^(sendrecv|recvonly|sendonly|inactive)/
    },
    { //a=ice-lite
      name: 'icelite',
      reg: /^(ice-lite)/
    },
    { //a=ice-ufrag:F7gI
      name: 'iceUfrag',
      reg: /^ice-ufrag:(\S*)/,
      format: "ice-ufrag:%s"
    },
    { //a=ice-pwd:x9cml/YzichV2+XlhiMu8g
      name: 'icePwd',
      reg: /^ice-pwd:(\S*)/,
      format: "ice-pwd:%s"
    },
    { //a=fingerprint:SHA-1 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33
      name: 'fingerprint',
      reg: /^fingerprint:(\S*) (\S*)/,
      names: ['type', 'hash'],
      format: "fingerprint:%s %s"
    },
    {
      //a=candidate:0 1 UDP 2113667327 203.0.113.1 54400 typ host
      //a=candidate:1162875081 1 udp 2113937151 192.168.34.75 60017 typ host generation 0
      //a=candidate:3289912957 2 udp 1845501695 193.84.77.194 60017 typ srflx raddr 192.168.34.75 rport 60017 generation 0
      push:'candidates',
      reg: /^candidate:(\S*) (\d*) (\S*) (\d*) (\S*) (\d*) typ (\S*)(?: raddr (\S*) rport (\d*))?(?: generation (\d*))?/,
      names: ['foundation', 'component', 'transport', 'priority', 'ip', 'port', 'type', 'raddr', 'rport', 'generation'],
      format: function (o) {
        var str = "candidate:%s %d %s %d %s %d typ %s";
        // NB: candidate has two optional chunks, so %void middle one if it's missing
        str += (o.raddr != null) ? " raddr %s rport %d" : "%v%v";
        if (o.generation != null) {
          str += " generation %d";
        }
        return str;
      }
    },
    { //a=remote-candidates:1 203.0.113.1 54400 2 203.0.113.1 54401 ...
      name: 'remoteCandidates',
      reg: /^remote-candidates:(.*)/,
      format: "remote-candidates:%s"
    },
    { //a=ice-options:google-ice
      name: 'iceOptions',
      reg: /^ice-options:(\S*)/,
      format: "ice-options:%s"
    },
    { //a=ssrc:2566107569 cname:t9YU8M1UxTF8Y1A1
      push: "ssrcs",
      reg: /^ssrc:(\d*) ([\w_]*):(.*)/,
      names: ['id', 'attribute', 'value'],
      format: "ssrc:%d %s:%s"
    },
    { //a=ssrc-group:FEC 1 2
      push: "ssrcGroups",
      reg: /^ssrc-group:(\w*) (.*)/,
      names: ['semantics', 'ssrcs'],
      format: "ssrc-group:%s %s"
    },
    { //a=msid-semantic: WMS Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV
      name: "msidSemantic",
      reg: /^msid-semantic:\s?(\w*) (\S*)/,
      names: ['semantic', 'token'],
      format: "msid-semantic: %s %s" // space after ":" is not accidental
    },
    { //a=group:BUNDLE audio video
      push: 'groups',
      reg: /^group:(\w*) (.*)/,
      names: ['type', 'mids'],
      format: "group:%s %s"
    },
    { //a=rtcp-mux
      name: 'rtcpMux',
      reg: /^(rtcp-mux)/
    },
    { // any a= that we don't understand is kepts verbatim on media.invalid
      push: 'invalid',
      names: ["value"]
    }
  ]
};

// set sensible defaults to avoid polluting the grammar with boring details
Object.keys(grammar).forEach(function (key) {
  var objs = grammar[key];
  objs.forEach(function (obj) {
    if (!obj.reg) {
      obj.reg = /(.*)/;
    }
    if (!obj.format) {
      obj.format = "%s";
    }
  });
}); 

},{}],85:[function(require,module,exports){
var parser = require('./parser');
var writer = require('./writer');

exports.write = writer;
exports.parse = parser.parse;
exports.parseFmtpConfig = parser.parseFmtpConfig;
exports.parsePayloads = parser.parsePayloads;
exports.parseRemoteCandidates = parser.parseRemoteCandidates;

},{"./parser":86,"./writer":87}],86:[function(require,module,exports){
var toIntIfInt = function (v) {
  return String(Number(v)) === v ? Number(v) : v;
};

var attachProperties = function (match, location, names, rawName) {
  if (rawName && !names) {
    location[rawName] = toIntIfInt(match[1]);
  }
  else {
    for (var i = 0; i < names.length; i += 1) {
      if (match[i+1] != null) {
        location[names[i]] = toIntIfInt(match[i+1]);
      }
    }
  }
};

var parseReg = function (obj, location, content) {
  var needsBlank = obj.name && obj.names;
  if (obj.push && !location[obj.push]) {
    location[obj.push] = [];
  }
  else if (needsBlank && !location[obj.name]) {
    location[obj.name] = {};
  }
  var keyLocation = obj.push ?
    {} :  // blank object that will be pushed
    needsBlank ? location[obj.name] : location; // otherwise, named location or root

  attachProperties(content.match(obj.reg), keyLocation, obj.names, obj.name);

  if (obj.push) {
    location[obj.push].push(keyLocation);
  }
};

var grammar = require('./grammar');
var validLine = RegExp.prototype.test.bind(/^([a-z])=(.*)/);

exports.parse = function (sdp) {
  var session = {}
    , media = []
    , location = session; // points at where properties go under (one of the above)

  // parse lines we understand
  sdp.split(/(\r\n|\r|\n)/).filter(validLine).forEach(function (l) {
    var type = l[0];
    var content = l.slice(2);
    if (type === 'm') {
      media.push({rtp: [], fmtp: []});
      location = media[media.length-1]; // point at latest media line
    }

    for (var j = 0; j < (grammar[type] || []).length; j += 1) {
      var obj = grammar[type][j];
      if (obj.reg.test(content)) {
        return parseReg(obj, location, content);
      }
    }
  });

  session.media = media; // link it up
  return session;
};

var fmtpReducer = function (acc, expr) {
  var s = expr.split('=');
  if (s.length === 2) {
    acc[s[0]] = toIntIfInt(s[1]);
  }
  return acc;
};

exports.parseFmtpConfig = function (str) {
  return str.split(';').reduce(fmtpReducer, {});
};

exports.parsePayloads = function (str) {
  return str.split(' ').map(Number);
};

exports.parseRemoteCandidates = function (str) {
  var candidates = [];
  var parts = str.split(' ').map(toIntIfInt);
  for (var i = 0; i < parts.length; i += 3) {
    candidates.push({
      component: parts[i],
      ip: parts[i + 1],
      port: parts[i + 2]
    });
  }
  return candidates;
};

},{"./grammar":84}],87:[function(require,module,exports){
var grammar = require('./grammar');

// customized util.format - discards excess arguments and can void middle ones
var formatRegExp = /%[sdv%]/g;
var format = function (formatStr) {
  var i = 1;
  var args = arguments;
  var len = args.length;
  return formatStr.replace(formatRegExp, function (x) {
    if (i >= len) {
      return x; // missing argument
    }
    var arg = args[i];
    i += 1;
    switch (x) {
      case '%%':
        return '%';
      case '%s':
        return String(arg);
      case '%d':
        return Number(arg);
      case '%v':
        return '';
    }
  });
  // NB: we discard excess arguments - they are typically undefined from makeLine
};

var makeLine = function (type, obj, location) {
  var str = obj.format instanceof Function ?
    (obj.format(obj.push ? location : location[obj.name])) :
    obj.format;

  var args = [type + '=' + str];
  if (obj.names) {
    for (var i = 0; i < obj.names.length; i += 1) {
      var n = obj.names[i];
      if (obj.name) {
        args.push(location[obj.name][n]);
      }
      else { // for mLine and push attributes
        args.push(location[obj.names[i]]);
      }
    }
  }
  else {
    args.push(location[obj.name]);
  }
  return format.apply(null, args);
};

// RFC specified order
// TODO: extend this with all the rest
var defaultOuterOrder = [
  'v', 'o', 's', 'i',
  'u', 'e', 'p', 'c',
  'b', 't', 'r', 'z', 'a'
];
var defaultInnerOrder = ['i', 'c', 'b', 'a'];


module.exports = function (session, opts) {
  opts = opts || {};
  // ensure certain properties exist
  if (session.version == null) {
    session.version = 0; // "v=0" must be there (only defined version atm)
  }
  if (session.name == null) {
    session.name = " "; // "s= " must be there if no meaningful name set
  }
  session.media.forEach(function (mLine) {
    if (mLine.payloads == null) {
      mLine.payloads = "";
    }
  });

  var outerOrder = opts.outerOrder || defaultOuterOrder;
  var innerOrder = opts.innerOrder || defaultInnerOrder;
  var sdp = [];

  // loop through outerOrder for matching properties on session
  outerOrder.forEach(function (type) {
    grammar[type].forEach(function (obj) {
      if (obj.name in session && session[obj.name] != null) {
        sdp.push(makeLine(type, obj, session));
      }
      else if (obj.push in session && session[obj.push] != null) {
        session[obj.push].forEach(function (el) {
          sdp.push(makeLine(type, obj, el));
        });
      }
    });
  });

  // then for each media line, follow the innerOrder
  session.media.forEach(function (mLine) {
    sdp.push(makeLine('m', grammar.m[0], mLine));

    innerOrder.forEach(function (type) {
      grammar[type].forEach(function (obj) {
        if (obj.name in mLine && mLine[obj.name] != null) {
          sdp.push(makeLine(type, obj, mLine));
        }
        else if (obj.push in mLine && mLine[obj.push] != null) {
          mLine[obj.push].forEach(function (el) {
            sdp.push(makeLine(type, obj, el));
          });
        }
      });
    });
  });

  return sdp.join('\r\n') + '\r\n';
};

},{"./grammar":84}],88:[function(require,module,exports){
var MediaStreamType = {
    VIDEO_TYPE: "Video",

    AUDIO_TYPE: "Audio"
};
module.exports = MediaStreamType;
},{}],89:[function(require,module,exports){
var RTCBrowserType = {
    RTC_BROWSER_CHROME: "rtc_browser.chrome",

    RTC_BROWSER_FIREFOX: "rtc_browser.firefox"
};

module.exports = RTCBrowserType;
},{}],90:[function(require,module,exports){
var RTCEvents = {
    LASTN_CHANGED: "rtc.lastn_changed",
    DOMINANTSPEAKER_CHANGED: "rtc.dominantspeaker_changed",
    LASTN_ENDPOINT_CHANGED: "rtc.lastn_endpoint_changed",
    SIMULCAST_LAYER_CHANGED: "rtc.simulcast_layer_changed",
    SIMULCAST_LAYER_CHANGING: "rtc.simulcast_layer_changing",
    SIMULCAST_START: "rtc.simlcast_start",
    SIMULCAST_STOP: "rtc.simlcast_stop"
};

module.exports = RTCEvents;
},{}],91:[function(require,module,exports){
var Resolutions = {
    "1080": {
        width: 1920,
        height: 1080,
        order: 7
    },
    "fullhd": {
        width: 1920,
        height: 1080,
        order: 7
    },
    "720": {
        width: 1280,
        height: 720,
        order: 6
    },
    "hd": {
        width: 1280,
        height: 720,
        order: 6
    },
    "960": {
        width: 960,
        height: 720,
        order: 5
    },
    "640": {
        width: 640,
        height: 480,
        order: 4
    },
    "vga": {
        width: 640,
        height: 480,
        order: 4
    },
    "360": {
        width: 640,
        height: 360,
        order: 3
    },
    "320": {
        width: 320,
        height: 240,
        order: 2
    },
    "180": {
        width: 320,
        height: 180,
        order: 1
    }
};
module.exports = Resolutions;
},{}],92:[function(require,module,exports){
var StreamEventTypes = {
    EVENT_TYPE_LOCAL_CREATED: "stream.local_created",

    EVENT_TYPE_LOCAL_CHANGED: "stream.local_changed",

    EVENT_TYPE_LOCAL_ENDED: "stream.local_ended",

    EVENT_TYPE_REMOTE_CREATED: "stream.remote_created",

    EVENT_TYPE_REMOTE_ENDED: "stream.remote_ended",

    EVENT_TYPE_REMOTE_CHANGED: "stream.changed"
};

module.exports = StreamEventTypes;
},{}],93:[function(require,module,exports){
var UIEvents = {
    NICKNAME_CHANGED: "UI.nickname_changed",
    SELECTED_ENDPOINT: "UI.selected_endpoint",
    PINNED_ENDPOINT: "UI.pinned_endpoint"
};
module.exports = UIEvents;
},{}],94:[function(require,module,exports){
var AuthenticationEvents = {
    /**
     * Event callback arguments:
     * function(authenticationEnabled, userIdentity)
     * authenticationEnabled - indicates whether authentication has been enabled
     *                         in this session
     * userIdentity - if user has been logged in then it contains user name. If
     *                contains 'null' or 'undefined' then user is not logged in.
     */
    IDENTITY_UPDATED: "authentication.identity_updated"
};
module.exports = AuthenticationEvents;

},{}],95:[function(require,module,exports){
var CQEvents = {
    LOCALSTATS_UPDATED: "cq.localstats_updated",
    REMOTESTATS_UPDATED: "cq.remotestats_updated",
    STOP: "cq.stop"
};

module.exports = CQEvents;
},{}],96:[function(require,module,exports){
var DesktopSharingEventTypes = {
    INIT: "ds.init",

    SWITCHING_DONE: "ds.switching_done",

    NEW_STREAM_CREATED: "ds.new_stream_created"
};

module.exports = DesktopSharingEventTypes;
},{}],97:[function(require,module,exports){
module.exports = {
    getLanguages : function () {
        var languages = [];
        for(var lang in this)
        {
            if(typeof this[lang] === "string")
                languages.push(this[lang]);
        }
        return languages;
    },
    EN: "en",
    BG: "bg",
    DE: "de",
    TR: "tr"
}
},{}],98:[function(require,module,exports){
var XMPPEvents = {
    CONFERENCE_CERATED: "xmpp.conferenceCreated.jingle",
    CALL_TERMINATED: "xmpp.callterminated.jingle",
    CALL_INCOMING: "xmpp.callincoming.jingle",
    DISPOSE_CONFERENCE: "xmpp.dispoce_confernce",
    GRACEFUL_SHUTDOWN: "xmpp.graceful_shutdown",
    KICKED: "xmpp.kicked",
    BRIDGE_DOWN: "xmpp.bridge_down",
    USER_ID_CHANGED: "xmpp.user_id_changed",
    CHANGED_STREAMS: "xmpp.changed_streams",
    MUC_JOINED: "xmpp.muc_joined",
    MUC_ENTER: "xmpp.muc_enter",
    MUC_ROLE_CHANGED: "xmpp.muc_role_changed",
    MUC_LEFT: "xmpp.muc_left",
    MUC_DESTROYED: "xmpp.muc_destroyed",
    DISPLAY_NAME_CHANGED: "xmpp.display_name_changed",
    REMOTE_STATS: "xmpp.remote_stats",
    LOCALROLE_CHANGED: "xmpp.localrole_changed",
    PRESENCE_STATUS: "xmpp.presence_status",
    RESERVATION_ERROR: "xmpp.room_reservation_error",
    SUBJECT_CHANGED: "xmpp.subject_changed",
    MESSAGE_RECEIVED: "xmpp.message_received",
    SENDING_CHAT_MESSAGE: "xmpp.sending_chat_message",
    PASSWORD_REQUIRED: "xmpp.password_required",
    AUTHENTICATION_REQUIRED: "xmpp.authentication_required",
    CHAT_ERROR_RECEIVED: "xmpp.chat_error_received",
    ETHERPAD: "xmpp.etherpad"
};
module.exports = XMPPEvents;
},{}]},{},[1])(1)
});
