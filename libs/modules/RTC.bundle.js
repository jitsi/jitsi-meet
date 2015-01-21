!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.RTC=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* global Strophe, updateLargeVideo, focusedVideoSrc*/

// cache datachannels to avoid garbage collection
// https://code.google.com/p/chromium/issues/detail?id=405545
var _dataChannels = [];



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
            var userJid = UI.getLargeVideoState().userJid;
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
                    $(document).trigger(
                        'dominantspeakerchanged',
                        [dominantSpeakerEndpoint]);
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
                    UI.onLastNChanged(oldValue, newValue);
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
                    $(document).trigger(
                        'lastnchanged',
                        [lastNEndpoints, endpointsEnteringLastN, stream]);
                }
                else if ("SimulcastLayersChangedEvent" === colibriClass)
                {
                    $(document).trigger(
                        'simulcastlayerschanged',
                        [obj.endpointSimulcastLayers]);
                }
                else if ("SimulcastLayersChangingEvent" === colibriClass)
                {
                    $(document).trigger(
                        'simulcastlayerschanging',
                        [obj.endpointSimulcastLayers]);
                }
                else if ("StartSimulcastLayerEvent" === colibriClass)
                {
                    $(document).trigger('startsimulcastlayer', obj.simulcastLayer);
                }
                else if ("StopSimulcastLayerEvent" === colibriClass)
                {
                    $(document).trigger('stopsimulcastlayer', obj.simulcastLayer);
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
    bindDataChannelListener: function (peerConnection) {
        if(!config.openSctp)
            retrun;

        peerConnection.ondatachannel = this.onDataChannel;

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
    }

}

function onSelectedEndpointChanged(userResource)
{
    console.log('selected endpoint changed: ', userResource);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
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

$(document).bind("selectedendpointchanged", function(event, userResource) {
    onSelectedEndpointChanged(userResource);
});

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

$(document).bind("pinnedendpointchanged", function(event, userResource) {
    onPinnedEndpointChanged(userResource);
});

module.exports = DataChannels;


},{}],2:[function(require,module,exports){
//var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");

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

},{}],3:[function(require,module,exports){
////These lines should be uncommented when require works in app.js
//var RTCBrowserType = require("../../service/RTC/RTCBrowserType.js");
//var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
//var MediaStreamType = require("../../service/RTC/MediaStreamTypes");

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
function MediaStream(data, sid, ssrc, browser) {

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
    if(browser == RTCBrowserType.RTC_BROWSER_FIREFOX)
    {
        if (!this.getVideoTracks)
            this.getVideoTracks = function () { return []; };
        if (!this.getAudioTracks)
            this.getAudioTracks = function () { return []; };
    }
}


MediaStream.prototype.getOriginalStream = function()
{
    return this.stream;
}

MediaStream.prototype.setMute = function (value)
{
    this.stream.muted = value;
    this.muted = value;
}


module.exports = MediaStream;

},{}],4:[function(require,module,exports){
var EventEmitter = require("events");
var RTCUtils = require("./RTCUtils.js");
var LocalStream = require("./LocalStream.js");
var DataChannels = require("./DataChannels");
var MediaStream = require("./MediaStream.js");
//These lines should be uncommented when require works in app.js
//var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
//var XMPPEvents = require("../service/xmpp/XMPPEvents");

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
    removeStreamListener: function (listener, eventType) {
        if(!(eventType instanceof StreamEventTypes))
            throw "Illegal argument";

        eventEmitter.removeListener(eventType, listener);
    },
    createLocalStream: function (stream, type, change) {

        var localStream =  new LocalStream(stream, type, eventEmitter);
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
            this.getBrowserType());
        var jid = data.peerjid || xmpp.myJid();
        if(!this.remoteStreams[jid]) {
            this.remoteStreams[jid] = {};
        }
        this.remoteStreams[jid][remoteStream.type]= remoteStream;
        eventEmitter.emit(StreamEventTypes.EVENT_TYPE_REMOTE_CREATED, remoteStream);
        console.debug("ADD remote stream ", remoteStream.type, " ", jid, " ", thessrc);
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
        desktopsharing.addListener(
            function (stream, isUsingScreenStream, callback) {
                self.changeLocalVideo(stream, isUsingScreenStream, callback);
            }, DesktopSharingEventTypes.NEW_STREAM_CREATED);
        xmpp.addListener(XMPPEvents.CHANGED_STREAMS, function (jid, changedStreams) {
            for(var i = 0; i < changedStreams.length; i++) {
                var type = changedStreams[i].type;
                if (type != "audio") {
                    var peerStreams = self.remoteStreams[jid];
                    if(!peerStreams)
                        continue;
                    var videoStream = peerStreams[MediaStreamType.VIDEO_TYPE];
                    if(!videoStream)
                        continue;
                    videoStream.videoType = changedStreams[i].type;
                }
            }
        })
        this.rtcUtils = new RTCUtils(this);
        this.rtcUtils.obtainAudioAndVideoPermissions();
    },
    onConferenceCreated: function(event) {
        DataChannels.bindDataChannelListener(event.peerconnection);
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
        RTC.localVideo = this.createLocalStream(stream, "video", true, type);
        // Stop the stream to trigger onended event for old stream
        oldStream.stop();
        xmpp.switchStreams(stream, oldStream,callback);
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
        if (xmpp.myJid() &&
            xmpp.myResource() === jid) {
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

},{"./DataChannels":1,"./LocalStream.js":2,"./MediaStream.js":3,"./RTCUtils.js":5,"events":6}],5:[function(require,module,exports){
//This should be uncommented when app.js supports require
//var RTCBrowserType = require("../../service/RTC/RTCBrowserType.js");

function setResolutionConstraints(constraints, resolution, isAndroid)
{
    if (resolution && !constraints.video || isAndroid) {
        constraints.video = { mandatory: {}, optional: [] };// same behaviour as true
    }
    // see https://code.google.com/p/chromium/issues/detail?id=143631#c9 for list of supported resolutions
    switch (resolution) {
        // 16:9 first
        case '1080':
        case 'fullhd':
            constraints.video.mandatory.minWidth = 1920;
            constraints.video.mandatory.minHeight = 1080;
            break;
        case '720':
        case 'hd':
            constraints.video.mandatory.minWidth = 1280;
            constraints.video.mandatory.minHeight = 720;
            break;
        case '360':
            constraints.video.mandatory.minWidth = 640;
            constraints.video.mandatory.minHeight = 360;
            break;
        case '180':
            constraints.video.mandatory.minWidth = 320;
            constraints.video.mandatory.minHeight = 180;
            break;
        // 4:3
        case '960':
            constraints.video.mandatory.minWidth = 960;
            constraints.video.mandatory.minHeight = 720;
            break;
        case '640':
        case 'vga':
            constraints.video.mandatory.minWidth = 640;
            constraints.video.mandatory.minHeight = 480;
            break;
        case '320':
            constraints.video.mandatory.minWidth = 320;
            constraints.video.mandatory.minHeight = 240;
            break;
        default:
            if (isAndroid) {
                constraints.video.mandatory.minWidth = 320;
                constraints.video.mandatory.minHeight = 240;
                constraints.video.mandatory.maxFrameRate = 15;
            }
            break;
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

    setResolutionConstraints(constraints, resolution, isAndroid);

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
        if (version >= 22) {
            this.peerconnection = mozRTCPeerConnection;
            this.browser = RTCBrowserType.RTC_BROWSER_FIREFOX;
            this.getUserMedia = navigator.mozGetUserMedia.bind(navigator);
            this.pc_constraints = {};
            this.attachMediaStream =  function (element, stream) {
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

        window.location.href = 'webrtcrequired.html';
        return;
    }

    if (this.browser !== RTCBrowserType.RTC_BROWSER_CHROME &&
        config.enableFirefoxSupport !== true) {
        window.location.href = 'chromeonly.html';
        return;
    }

}


RTCUtils.prototype.getUserMediaWithConstraints = function(
    um, success_callback, failure_callback, resolution,bandwidth, fps,
    desktopStream)
{
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
            simulcast.getUserMedia(constraints, function (stream) {
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
    var cb = function (stream) {
        console.log('got', stream, stream.getAudioTracks().length, stream.getVideoTracks().length);
        self.handleLocalStream(stream);
    };
    var self = this;
    this.getUserMediaWithConstraints(
        ['audio', 'video'],
        cb,
        function (error) {
            console.error('failed to obtain audio/video stream - trying audio only', error);
            self.getUserMediaWithConstraints(
                ['audio'],
                cb,
                function (error) {
                    console.error('failed to obtain audio/video stream - stop', error);
                    UI.messageHandler.showError("Error",
                            "Failed to obtain permissions to use the local microphone" +
                            "and/or camera.");
                }
            );
        },
            config.resolution || '360');
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
},{}],6:[function(require,module,exports){
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

},{}]},{},[4])(4)
});