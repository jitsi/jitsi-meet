!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.RTC=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");

function LocalStream(stream, type, eventEmitter)
{
    this.stream = stream;
    this.eventEmitter = eventEmitter;
    this.type = type;

    var self = this;
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
}

LocalStream.prototype.mute = function()
{
    var ismuted = false;
    var tracks = [];
    if(this.type = "audio")
    {
        tracks = this.stream.getAudioTracks();
    }
    else
    {
        tracks = this.stream.getVideoTracks();
    }

    for (var idx = 0; idx < tracks.length; idx++) {
        ismuted = !tracks[idx].enabled;
        tracks[idx].enabled = !tracks[idx].enabled;
    }
    return ismuted;
}

LocalStream.prototype.isMuted = function () {
    var tracks = [];
    if(this.type = "audio")
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

module.exports = LocalStream;

},{}],2:[function(require,module,exports){
var RTC = require("./RTC.js");
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
function MediaStream(data, sid, ssrc, eventEmmiter) {
    this.sid = sid;
    this.stream = data.stream;
    this.peerjid = data.peerjid;
    this.ssrc = ssrc;
    this.type = (this.stream.getVideoTracks().length > 0)?
        MediaStreamType.VIDEO_TYPE : MediaStreamType.AUDIO_TYPE;
    this.muted = false;
    eventEmmiter.emit(StreamEventTypes.EVENT_TYPE_REMOTE_CREATED, this);
}

if(RTC.getBrowserType() == RTCBrowserType.RTC_BROWSER_FIREFOX)
{
    if (!MediaStream.prototype.getVideoTracks)
        MediaStream.prototype.getVideoTracks = function () { return []; };
    if (!MediaStream.prototype.getAudioTracks)
        MediaStream.prototype.getAudioTracks = function () { return []; };
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

},{"./RTC.js":3}],3:[function(require,module,exports){
var EventEmitter = require("events");
var RTCUtils = require("./RTCUtils.js");
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
    createLocalStream: function (stream, type) {
        var LocalStream = require("./LocalStream.js");
        var localStream =  new LocalStream(stream, type, eventEmitter);
        this.localStreams.push(localStream);
        if(type == "audio")
        {
            this.localAudio = localStream;
        }
        else
        {
            this.localVideo = localStream;
        }
        eventEmitter.emit(StreamEventTypes.EVENT_TYPE_LOCAL_CREATED,
            localStream);
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
        var MediaStream = require("./MediaStream.js")
        var remoteStream = new MediaStream(data, sid, thessrc, eventEmitter);
        var jid = data.peerjid || connection.emuc.myroomjid;
        if(!this.remoteStreams[jid]) {
            this.remoteStreams[jid] = {};
        }
        this.remoteStreams[jid][remoteStream.type]= remoteStream;
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
        this.rtcUtils = new RTCUtils(this);
        this.rtcUtils.obtainAudioAndVideoPermissions();
    },
    onConferenceCreated: function(event) {
        var DataChannels = require("./datachannels");
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

        var isMuted = (value === "true");
        if (isMuted != stream.muted) {
            stream.setMute(isMuted);
            return true;
        }
        return false;
    }

};

module.exports = RTC;

},{"./LocalStream.js":1,"./MediaStream.js":2,"./RTCUtils.js":4,"./datachannels":5,"events":6}],4:[function(require,module,exports){
//This should be uncommented when app.js supports require
//var RTCBrowserType = require("../../service/RTC/RTCBrowserType.js");

var constraints = {audio: false, video: false};

function setResolutionConstraints(resolution, isAndroid)
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


function setConstraints(um, resolution, bandwidth, fps, desktopStream, isAndroid)
{
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

    setResolutionConstraints(resolution, isAndroid);

    if (bandwidth) { // doesn't work currently, see webrtc issue 1846
        if (!constraints.video) constraints.video = {mandatory: {}, optional: []};//same behaviour as true
        constraints.video.optional.push({bandwidth: bandwidth});
    }
    if (fps) { // for some cameras it might be necessary to request 30fps
        // so they choose 30fps mjpg over 10fps yuy2
        if (!constraints.video) constraints.video = {mandatory: {}, optional: []};// same behaviour as true;
        constraints.video.mandatory.minFrameRate = fps;
    }
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

    setConstraints(um, resolution, bandwidth, fps, desktopStream, isAndroid);

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

            RTCUtils.getUserMedia(constraints,
                function (stream) {
                    console.log('onUserMediaSuccess');
                    success_callback(stream);
                },
                function (error) {
                    console.warn('Failed to get access to local media. Error ', error);
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
        trackUsage('localMedia', {
            audio: stream.getAudioTracks().length,
            video: stream.getVideoTracks().length
        });
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
                    trackUsage('localMediaError', {
                        media: error.media || 'video',
                        name : error.name
                    });
                    messageHandler.showError("Error",
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
},{}],5:[function(require,module,exports){
/* global connection, Strophe, updateLargeVideo, focusedVideoSrc*/

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
            var userJid = VideoLayout.getLargeVideoState().userJid;
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
                $(document).trigger('inlastnchanged', [oldValue, newValue]);
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

function onSelectedEndpointChanged(userJid)
{
    console.log('selected endpoint changed: ', userJid);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
                dataChannel.send(JSON.stringify({
                    'colibriClass': 'SelectedEndpointChangedEvent',
                    'selectedEndpoint': (!userJid || userJid == null)
                        ? null : userJid
                }));

                return true;
            }
        });
    }
}

$(document).bind("selectedendpointchanged", function(event, userJid) {
    onSelectedEndpointChanged(userJid);
});

function onPinnedEndpointChanged(userJid)
{
    console.log('pinned endpoint changed: ', userJid);
    if (_dataChannels && _dataChannels.length != 0)
    {
        _dataChannels.some(function (dataChannel) {
            if (dataChannel.readyState == 'open')
            {
                dataChannel.send(JSON.stringify({
                    'colibriClass': 'PinnedEndpointChangedEvent',
                    'pinnedEndpoint': (!userJid || userJid == null)
                        ? null : Strophe.getResourceFromJid(userJid)
                }));

                return true;
            }
        });
    }
}

$(document).bind("pinnedendpointchanged", function(event, userJid) {
    onPinnedEndpointChanged(userJid);
});

module.exports = DataChannels;

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
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
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

},{}]},{},[3])(3)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1JUQy9Mb2NhbFN0cmVhbS5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvUlRDL01lZGlhU3RyZWFtLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9SVEMvUlRDLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9SVEMvUlRDVXRpbHMuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1JUQy9kYXRhY2hhbm5lbHMuanMiLCIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvL3ZhciBTdHJlYW1FdmVudFR5cGVzID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL1N0cmVhbUV2ZW50VHlwZXMuanNcIik7XG5cbmZ1bmN0aW9uIExvY2FsU3RyZWFtKHN0cmVhbSwgdHlwZSwgZXZlbnRFbWl0dGVyKVxue1xuICAgIHRoaXMuc3RyZWFtID0gc3RyZWFtO1xuICAgIHRoaXMuZXZlbnRFbWl0dGVyID0gZXZlbnRFbWl0dGVyO1xuICAgIHRoaXMudHlwZSA9IHR5cGU7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5zdHJlYW0ub25lbmRlZCA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIHNlbGYuc3RyZWFtRW5kZWQoKTtcbiAgICB9O1xufVxuXG5Mb2NhbFN0cmVhbS5wcm90b3R5cGUuc3RyZWFtRW5kZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5ldmVudEVtaXR0ZXIuZW1pdChTdHJlYW1FdmVudFR5cGVzLkVWRU5UX1RZUEVfTE9DQUxfRU5ERUQsIHRoaXMpO1xufVxuXG5Mb2NhbFN0cmVhbS5wcm90b3R5cGUuZ2V0T3JpZ2luYWxTdHJlYW0gPSBmdW5jdGlvbigpXG57XG4gICAgcmV0dXJuIHRoaXMuc3RyZWFtO1xufVxuXG5Mb2NhbFN0cmVhbS5wcm90b3R5cGUuaXNBdWRpb1N0cmVhbSA9IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gKHRoaXMuc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkgJiYgdGhpcy5zdHJlYW0uZ2V0QXVkaW9UcmFja3MoKS5sZW5ndGggPiAwKTtcbn1cblxuTG9jYWxTdHJlYW0ucHJvdG90eXBlLm11dGUgPSBmdW5jdGlvbigpXG57XG4gICAgdmFyIGlzbXV0ZWQgPSBmYWxzZTtcbiAgICB2YXIgdHJhY2tzID0gW107XG4gICAgaWYodGhpcy50eXBlID0gXCJhdWRpb1wiKVxuICAgIHtcbiAgICAgICAgdHJhY2tzID0gdGhpcy5zdHJlYW0uZ2V0QXVkaW9UcmFja3MoKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdHJhY2tzID0gdGhpcy5zdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCB0cmFja3MubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICBpc211dGVkID0gIXRyYWNrc1tpZHhdLmVuYWJsZWQ7XG4gICAgICAgIHRyYWNrc1tpZHhdLmVuYWJsZWQgPSAhdHJhY2tzW2lkeF0uZW5hYmxlZDtcbiAgICB9XG4gICAgcmV0dXJuIGlzbXV0ZWQ7XG59XG5cbkxvY2FsU3RyZWFtLnByb3RvdHlwZS5pc011dGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciB0cmFja3MgPSBbXTtcbiAgICBpZih0aGlzLnR5cGUgPSBcImF1ZGlvXCIpXG4gICAge1xuICAgICAgICB0cmFja3MgPSB0aGlzLnN0cmVhbS5nZXRBdWRpb1RyYWNrcygpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0cmFja3MgPSB0aGlzLnN0cmVhbS5nZXRWaWRlb1RyYWNrcygpO1xuICAgIH1cbiAgICBmb3IgKHZhciBpZHggPSAwOyBpZHggPCB0cmFja3MubGVuZ3RoOyBpZHgrKykge1xuICAgICAgICBpZih0cmFja3NbaWR4XS5lbmFibGVkKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBMb2NhbFN0cmVhbTtcbiIsInZhciBSVEMgPSByZXF1aXJlKFwiLi9SVEMuanNcIik7XG4vLy8vVGhlc2UgbGluZXMgc2hvdWxkIGJlIHVuY29tbWVudGVkIHdoZW4gcmVxdWlyZSB3b3JrcyBpbiBhcHAuanNcbi8vdmFyIFJUQ0Jyb3dzZXJUeXBlID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL1JUQ0Jyb3dzZXJUeXBlLmpzXCIpO1xuLy92YXIgU3RyZWFtRXZlbnRUeXBlcyA9IHJlcXVpcmUoXCIuLi8uLi9zZXJ2aWNlL1JUQy9TdHJlYW1FdmVudFR5cGVzLmpzXCIpO1xuLy92YXIgTWVkaWFTdHJlYW1UeXBlID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL01lZGlhU3RyZWFtVHlwZXNcIik7XG5cbi8qKlxuICogQ3JlYXRlcyBhIE1lZGlhU3RyZWFtIG9iamVjdCBmb3IgdGhlIGdpdmVuIGRhdGEsIHNlc3Npb24gaWQgYW5kIHNzcmMuXG4gKiBJdCBpcyBhIHdyYXBwZXIgY2xhc3MgZm9yIHRoZSBNZWRpYVN0cmVhbS5cbiAqXG4gKiBAcGFyYW0gZGF0YSB0aGUgZGF0YSBvYmplY3QgZnJvbSB3aGljaCB3ZSBvYnRhaW4gdGhlIHN0cmVhbSxcbiAqIHRoZSBwZWVyamlkLCBldGMuXG4gKiBAcGFyYW0gc2lkIHRoZSBzZXNzaW9uIGlkXG4gKiBAcGFyYW0gc3NyYyB0aGUgc3NyYyBjb3JyZXNwb25kaW5nIHRvIHRoaXMgTWVkaWFTdHJlYW1cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWVkaWFTdHJlYW0oZGF0YSwgc2lkLCBzc3JjLCBldmVudEVtbWl0ZXIpIHtcbiAgICB0aGlzLnNpZCA9IHNpZDtcbiAgICB0aGlzLnN0cmVhbSA9IGRhdGEuc3RyZWFtO1xuICAgIHRoaXMucGVlcmppZCA9IGRhdGEucGVlcmppZDtcbiAgICB0aGlzLnNzcmMgPSBzc3JjO1xuICAgIHRoaXMudHlwZSA9ICh0aGlzLnN0cmVhbS5nZXRWaWRlb1RyYWNrcygpLmxlbmd0aCA+IDApP1xuICAgICAgICBNZWRpYVN0cmVhbVR5cGUuVklERU9fVFlQRSA6IE1lZGlhU3RyZWFtVHlwZS5BVURJT19UWVBFO1xuICAgIHRoaXMubXV0ZWQgPSBmYWxzZTtcbiAgICBldmVudEVtbWl0ZXIuZW1pdChTdHJlYW1FdmVudFR5cGVzLkVWRU5UX1RZUEVfUkVNT1RFX0NSRUFURUQsIHRoaXMpO1xufVxuXG5pZihSVEMuZ2V0QnJvd3NlclR5cGUoKSA9PSBSVENCcm93c2VyVHlwZS5SVENfQlJPV1NFUl9GSVJFRk9YKVxue1xuICAgIGlmICghTWVkaWFTdHJlYW0ucHJvdG90eXBlLmdldFZpZGVvVHJhY2tzKVxuICAgICAgICBNZWRpYVN0cmVhbS5wcm90b3R5cGUuZ2V0VmlkZW9UcmFja3MgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBbXTsgfTtcbiAgICBpZiAoIU1lZGlhU3RyZWFtLnByb3RvdHlwZS5nZXRBdWRpb1RyYWNrcylcbiAgICAgICAgTWVkaWFTdHJlYW0ucHJvdG90eXBlLmdldEF1ZGlvVHJhY2tzID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gW107IH07XG59XG5cbk1lZGlhU3RyZWFtLnByb3RvdHlwZS5nZXRPcmlnaW5hbFN0cmVhbSA9IGZ1bmN0aW9uKClcbntcbiAgICByZXR1cm4gdGhpcy5zdHJlYW07XG59XG5cbk1lZGlhU3RyZWFtLnByb3RvdHlwZS5zZXRNdXRlID0gZnVuY3Rpb24gKHZhbHVlKVxue1xuICAgIHRoaXMuc3RyZWFtLm11dGVkID0gdmFsdWU7XG4gICAgdGhpcy5tdXRlZCA9IHZhbHVlO1xufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gTWVkaWFTdHJlYW07XG4iLCJ2YXIgRXZlbnRFbWl0dGVyID0gcmVxdWlyZShcImV2ZW50c1wiKTtcbnZhciBSVENVdGlscyA9IHJlcXVpcmUoXCIuL1JUQ1V0aWxzLmpzXCIpO1xuLy9UaGVzZSBsaW5lcyBzaG91bGQgYmUgdW5jb21tZW50ZWQgd2hlbiByZXF1aXJlIHdvcmtzIGluIGFwcC5qc1xuLy92YXIgU3RyZWFtRXZlbnRUeXBlcyA9IHJlcXVpcmUoXCIuLi8uLi9zZXJ2aWNlL1JUQy9TdHJlYW1FdmVudFR5cGVzLmpzXCIpO1xuLy92YXIgWE1QUEV2ZW50cyA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlL3htcHAvWE1QUEV2ZW50c1wiKTtcblxudmFyIGV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxudmFyIFJUQyA9IHtcbiAgICBydGNVdGlsczogbnVsbCxcbiAgICBsb2NhbFN0cmVhbXM6IFtdLFxuICAgIHJlbW90ZVN0cmVhbXM6IHt9LFxuICAgIGxvY2FsQXVkaW86IG51bGwsXG4gICAgbG9jYWxWaWRlbzogbnVsbCxcbiAgICBhZGRTdHJlYW1MaXN0ZW5lcjogZnVuY3Rpb24gKGxpc3RlbmVyLCBldmVudFR5cGUpIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgIH0sXG4gICAgcmVtb3ZlU3RyZWFtTGlzdGVuZXI6IGZ1bmN0aW9uIChsaXN0ZW5lciwgZXZlbnRUeXBlKSB7XG4gICAgICAgIGlmKCEoZXZlbnRUeXBlIGluc3RhbmNlb2YgU3RyZWFtRXZlbnRUeXBlcykpXG4gICAgICAgICAgICB0aHJvdyBcIklsbGVnYWwgYXJndW1lbnRcIjtcblxuICAgICAgICBldmVudEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnRUeXBlLCBsaXN0ZW5lcik7XG4gICAgfSxcbiAgICBjcmVhdGVMb2NhbFN0cmVhbTogZnVuY3Rpb24gKHN0cmVhbSwgdHlwZSkge1xuICAgICAgICB2YXIgTG9jYWxTdHJlYW0gPSByZXF1aXJlKFwiLi9Mb2NhbFN0cmVhbS5qc1wiKTtcbiAgICAgICAgdmFyIGxvY2FsU3RyZWFtID0gIG5ldyBMb2NhbFN0cmVhbShzdHJlYW0sIHR5cGUsIGV2ZW50RW1pdHRlcik7XG4gICAgICAgIHRoaXMubG9jYWxTdHJlYW1zLnB1c2gobG9jYWxTdHJlYW0pO1xuICAgICAgICBpZih0eXBlID09IFwiYXVkaW9cIilcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5sb2NhbEF1ZGlvID0gbG9jYWxTdHJlYW07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmxvY2FsVmlkZW8gPSBsb2NhbFN0cmVhbTtcbiAgICAgICAgfVxuICAgICAgICBldmVudEVtaXR0ZXIuZW1pdChTdHJlYW1FdmVudFR5cGVzLkVWRU5UX1RZUEVfTE9DQUxfQ1JFQVRFRCxcbiAgICAgICAgICAgIGxvY2FsU3RyZWFtKTtcbiAgICAgICAgcmV0dXJuIGxvY2FsU3RyZWFtO1xuICAgIH0sXG4gICAgcmVtb3ZlTG9jYWxTdHJlYW06IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubG9jYWxTdHJlYW1zLmxlbmd0aDsgaSsrKVxuICAgICAgICB7XG4gICAgICAgICAgICBpZih0aGlzLmxvY2FsU3RyZWFtc1tpXS5nZXRPcmlnaW5hbFN0cmVhbSgpID09PSBzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5sb2NhbFN0cmVhbXNbaV07XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICBjcmVhdGVSZW1vdGVTdHJlYW06IGZ1bmN0aW9uIChkYXRhLCBzaWQsIHRoZXNzcmMpIHtcbiAgICAgICAgdmFyIE1lZGlhU3RyZWFtID0gcmVxdWlyZShcIi4vTWVkaWFTdHJlYW0uanNcIilcbiAgICAgICAgdmFyIHJlbW90ZVN0cmVhbSA9IG5ldyBNZWRpYVN0cmVhbShkYXRhLCBzaWQsIHRoZXNzcmMsIGV2ZW50RW1pdHRlcik7XG4gICAgICAgIHZhciBqaWQgPSBkYXRhLnBlZXJqaWQgfHwgY29ubmVjdGlvbi5lbXVjLm15cm9vbWppZDtcbiAgICAgICAgaWYoIXRoaXMucmVtb3RlU3RyZWFtc1tqaWRdKSB7XG4gICAgICAgICAgICB0aGlzLnJlbW90ZVN0cmVhbXNbamlkXSA9IHt9O1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVtb3RlU3RyZWFtc1tqaWRdW3JlbW90ZVN0cmVhbS50eXBlXT0gcmVtb3RlU3RyZWFtO1xuICAgICAgICByZXR1cm4gcmVtb3RlU3RyZWFtO1xuICAgIH0sXG4gICAgZ2V0QnJvd3NlclR5cGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnRjVXRpbHMuYnJvd3NlcjtcbiAgICB9LFxuICAgIGdldFBDQ29uc3RyYWludHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnRjVXRpbHMucGNfY29uc3RyYWludHM7XG4gICAgfSxcbiAgICBnZXRVc2VyTWVkaWFXaXRoQ29uc3RyYWludHM6ZnVuY3Rpb24odW0sIHN1Y2Nlc3NfY2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZhaWx1cmVfY2FsbGJhY2ssIHJlc29sdXRpb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhbmR3aWR0aCwgZnBzLCBkZXNrdG9wU3RyZWFtKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnRjVXRpbHMuZ2V0VXNlck1lZGlhV2l0aENvbnN0cmFpbnRzKHVtLCBzdWNjZXNzX2NhbGxiYWNrLFxuICAgICAgICAgICAgZmFpbHVyZV9jYWxsYmFjaywgcmVzb2x1dGlvbiwgYmFuZHdpZHRoLCBmcHMsIGRlc2t0b3BTdHJlYW0pO1xuICAgIH0sXG4gICAgYXR0YWNoTWVkaWFTdHJlYW06ICBmdW5jdGlvbiAoZWxlbWVudCwgc3RyZWFtKSB7XG4gICAgICAgIHRoaXMucnRjVXRpbHMuYXR0YWNoTWVkaWFTdHJlYW0oZWxlbWVudCwgc3RyZWFtKTtcbiAgICB9LFxuICAgIGdldFN0cmVhbUlEOiAgZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydGNVdGlscy5nZXRTdHJlYW1JRChzdHJlYW0pO1xuICAgIH0sXG4gICAgZ2V0VmlkZW9TcmM6IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ0Y1V0aWxzLmdldFZpZGVvU3JjKGVsZW1lbnQpO1xuICAgIH0sXG4gICAgc2V0VmlkZW9TcmM6IGZ1bmN0aW9uIChlbGVtZW50LCBzcmMpIHtcbiAgICAgICAgdGhpcy5ydGNVdGlscy5zZXRWaWRlb1NyYyhlbGVtZW50LCBzcmMpO1xuICAgIH0sXG4gICAgZGlzcG9zZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh0aGlzLnJ0Y1V0aWxzKSB7XG4gICAgICAgICAgICB0aGlzLnJ0Y1V0aWxzID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc3RvcDogIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgfSxcbiAgICBzdGFydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJ0Y1V0aWxzID0gbmV3IFJUQ1V0aWxzKHRoaXMpO1xuICAgICAgICB0aGlzLnJ0Y1V0aWxzLm9idGFpbkF1ZGlvQW5kVmlkZW9QZXJtaXNzaW9ucygpO1xuICAgIH0sXG4gICAgb25Db25mZXJlbmNlQ3JlYXRlZDogZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIERhdGFDaGFubmVscyA9IHJlcXVpcmUoXCIuL2RhdGFjaGFubmVsc1wiKTtcbiAgICAgICAgRGF0YUNoYW5uZWxzLmJpbmREYXRhQ2hhbm5lbExpc3RlbmVyKGV2ZW50LnBlZXJjb25uZWN0aW9uKTtcbiAgICB9LFxuICAgIG11dGVSZW1vdGVWaWRlb1N0cmVhbTogZnVuY3Rpb24gKGppZCwgdmFsdWUpIHtcbiAgICAgICAgdmFyIHN0cmVhbTtcblxuICAgICAgICBpZih0aGlzLnJlbW90ZVN0cmVhbXNbamlkXSAmJlxuICAgICAgICAgICAgdGhpcy5yZW1vdGVTdHJlYW1zW2ppZF1bTWVkaWFTdHJlYW1UeXBlLlZJREVPX1RZUEVdKVxuICAgICAgICB7XG4gICAgICAgICAgICBzdHJlYW0gPSB0aGlzLnJlbW90ZVN0cmVhbXNbamlkXVtNZWRpYVN0cmVhbVR5cGUuVklERU9fVFlQRV07XG4gICAgICAgIH1cblxuICAgICAgICBpZighc3RyZWFtKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIHZhciBpc011dGVkID0gKHZhbHVlID09PSBcInRydWVcIik7XG4gICAgICAgIGlmIChpc011dGVkICE9IHN0cmVhbS5tdXRlZCkge1xuICAgICAgICAgICAgc3RyZWFtLnNldE11dGUoaXNNdXRlZCk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJUQztcbiIsIi8vVGhpcyBzaG91bGQgYmUgdW5jb21tZW50ZWQgd2hlbiBhcHAuanMgc3VwcG9ydHMgcmVxdWlyZVxuLy92YXIgUlRDQnJvd3NlclR5cGUgPSByZXF1aXJlKFwiLi4vLi4vc2VydmljZS9SVEMvUlRDQnJvd3NlclR5cGUuanNcIik7XG5cbnZhciBjb25zdHJhaW50cyA9IHthdWRpbzogZmFsc2UsIHZpZGVvOiBmYWxzZX07XG5cbmZ1bmN0aW9uIHNldFJlc29sdXRpb25Db25zdHJhaW50cyhyZXNvbHV0aW9uLCBpc0FuZHJvaWQpXG57XG4gICAgaWYgKHJlc29sdXRpb24gJiYgIWNvbnN0cmFpbnRzLnZpZGVvIHx8IGlzQW5kcm9pZCkge1xuICAgICAgICBjb25zdHJhaW50cy52aWRlbyA9IHsgbWFuZGF0b3J5OiB7fSwgb3B0aW9uYWw6IFtdIH07Ly8gc2FtZSBiZWhhdmlvdXIgYXMgdHJ1ZVxuICAgIH1cbiAgICAvLyBzZWUgaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTE0MzYzMSNjOSBmb3IgbGlzdCBvZiBzdXBwb3J0ZWQgcmVzb2x1dGlvbnNcbiAgICBzd2l0Y2ggKHJlc29sdXRpb24pIHtcbiAgICAgICAgLy8gMTY6OSBmaXJzdFxuICAgICAgICBjYXNlICcxMDgwJzpcbiAgICAgICAgY2FzZSAnZnVsbGhkJzpcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aCA9IDE5MjA7XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0ID0gMTA4MDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc3MjAnOlxuICAgICAgICBjYXNlICdoZCc6XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGggPSAxMjgwO1xuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodCA9IDcyMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICczNjAnOlxuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoID0gNjQwO1xuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodCA9IDM2MDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICcxODAnOlxuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoID0gMzIwO1xuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodCA9IDE4MDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAvLyA0OjNcbiAgICAgICAgY2FzZSAnOTYwJzpcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aCA9IDk2MDtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQgPSA3MjA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnNjQwJzpcbiAgICAgICAgY2FzZSAndmdhJzpcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aCA9IDY0MDtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQgPSA0ODA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnMzIwJzpcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aCA9IDMyMDtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQgPSAyNDA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIGlmIChpc0FuZHJvaWQpIHtcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGggPSAzMjA7XG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodCA9IDI0MDtcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWF4RnJhbWVSYXRlID0gMTU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aClcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1heFdpZHRoID0gY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoO1xuICAgIGlmIChjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0KVxuICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWF4SGVpZ2h0ID0gY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodDtcbn1cblxuXG5mdW5jdGlvbiBzZXRDb25zdHJhaW50cyh1bSwgcmVzb2x1dGlvbiwgYmFuZHdpZHRoLCBmcHMsIGRlc2t0b3BTdHJlYW0sIGlzQW5kcm9pZClcbntcbiAgICBpZiAodW0uaW5kZXhPZigndmlkZW8nKSA+PSAwKSB7XG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvID0geyBtYW5kYXRvcnk6IHt9LCBvcHRpb25hbDogW10gfTsvLyBzYW1lIGJlaGF2aW91ciBhcyB0cnVlXG4gICAgfVxuICAgIGlmICh1bS5pbmRleE9mKCdhdWRpbycpID49IDApIHtcbiAgICAgICAgY29uc3RyYWludHMuYXVkaW8gPSB7IG1hbmRhdG9yeToge30sIG9wdGlvbmFsOiBbXX07Ly8gc2FtZSBiZWhhdmlvdXIgYXMgdHJ1ZVxuICAgIH1cbiAgICBpZiAodW0uaW5kZXhPZignc2NyZWVuJykgPj0gMCkge1xuICAgICAgICBjb25zdHJhaW50cy52aWRlbyA9IHtcbiAgICAgICAgICAgIG1hbmRhdG9yeToge1xuICAgICAgICAgICAgICAgIGNocm9tZU1lZGlhU291cmNlOiBcInNjcmVlblwiLFxuICAgICAgICAgICAgICAgIGdvb2dMZWFreUJ1Y2tldDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtYXhXaWR0aDogd2luZG93LnNjcmVlbi53aWR0aCxcbiAgICAgICAgICAgICAgICBtYXhIZWlnaHQ6IHdpbmRvdy5zY3JlZW4uaGVpZ2h0LFxuICAgICAgICAgICAgICAgIG1heEZyYW1lUmF0ZTogM1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9wdGlvbmFsOiBbXVxuICAgICAgICB9O1xuICAgIH1cbiAgICBpZiAodW0uaW5kZXhPZignZGVza3RvcCcpID49IDApIHtcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8gPSB7XG4gICAgICAgICAgICBtYW5kYXRvcnk6IHtcbiAgICAgICAgICAgICAgICBjaHJvbWVNZWRpYVNvdXJjZTogXCJkZXNrdG9wXCIsXG4gICAgICAgICAgICAgICAgY2hyb21lTWVkaWFTb3VyY2VJZDogZGVza3RvcFN0cmVhbSxcbiAgICAgICAgICAgICAgICBnb29nTGVha3lCdWNrZXQ6IHRydWUsXG4gICAgICAgICAgICAgICAgbWF4V2lkdGg6IHdpbmRvdy5zY3JlZW4ud2lkdGgsXG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiB3aW5kb3cuc2NyZWVuLmhlaWdodCxcbiAgICAgICAgICAgICAgICBtYXhGcmFtZVJhdGU6IDNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvcHRpb25hbDogW11cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBpZiAoY29uc3RyYWludHMuYXVkaW8pIHtcbiAgICAgICAgLy8gaWYgaXQgaXMgZ29vZCBlbm91Z2ggZm9yIGhhbmdvdXRzLi4uXG4gICAgICAgIGNvbnN0cmFpbnRzLmF1ZGlvLm9wdGlvbmFsLnB1c2goXG4gICAgICAgICAgICB7Z29vZ0VjaG9DYW5jZWxsYXRpb246IHRydWV9LFxuICAgICAgICAgICAge2dvb2dBdXRvR2FpbkNvbnRyb2w6IHRydWV9LFxuICAgICAgICAgICAge2dvb2dOb2lzZVN1cHJlc3Npb246IHRydWV9LFxuICAgICAgICAgICAge2dvb2dIaWdocGFzc0ZpbHRlcjogdHJ1ZX0sXG4gICAgICAgICAgICB7Z29vZ05vaXNlc3VwcHJlc3Npb24yOiB0cnVlfSxcbiAgICAgICAgICAgIHtnb29nRWNob0NhbmNlbGxhdGlvbjI6IHRydWV9LFxuICAgICAgICAgICAge2dvb2dBdXRvR2FpbkNvbnRyb2wyOiB0cnVlfVxuICAgICAgICApO1xuICAgIH1cbiAgICBpZiAoY29uc3RyYWludHMudmlkZW8pIHtcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8ub3B0aW9uYWwucHVzaChcbiAgICAgICAgICAgIHtnb29nTm9pc2VSZWR1Y3Rpb246IGZhbHNlfSAvLyBjaHJvbWUgMzcgd29ya2Fyb3VuZCBmb3IgaXNzdWUgMzgwNywgcmVlbmFibGUgaW4gTTM4XG4gICAgICAgICk7XG4gICAgICAgIGlmICh1bS5pbmRleE9mKCd2aWRlbycpID49IDApIHtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm9wdGlvbmFsLnB1c2goXG4gICAgICAgICAgICAgICAge2dvb2dMZWFreUJ1Y2tldDogdHJ1ZX1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRSZXNvbHV0aW9uQ29uc3RyYWludHMocmVzb2x1dGlvbiwgaXNBbmRyb2lkKTtcblxuICAgIGlmIChiYW5kd2lkdGgpIHsgLy8gZG9lc24ndCB3b3JrIGN1cnJlbnRseSwgc2VlIHdlYnJ0YyBpc3N1ZSAxODQ2XG4gICAgICAgIGlmICghY29uc3RyYWludHMudmlkZW8pIGNvbnN0cmFpbnRzLnZpZGVvID0ge21hbmRhdG9yeToge30sIG9wdGlvbmFsOiBbXX07Ly9zYW1lIGJlaGF2aW91ciBhcyB0cnVlXG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm9wdGlvbmFsLnB1c2goe2JhbmR3aWR0aDogYmFuZHdpZHRofSk7XG4gICAgfVxuICAgIGlmIChmcHMpIHsgLy8gZm9yIHNvbWUgY2FtZXJhcyBpdCBtaWdodCBiZSBuZWNlc3NhcnkgdG8gcmVxdWVzdCAzMGZwc1xuICAgICAgICAvLyBzbyB0aGV5IGNob29zZSAzMGZwcyBtanBnIG92ZXIgMTBmcHMgeXV5MlxuICAgICAgICBpZiAoIWNvbnN0cmFpbnRzLnZpZGVvKSBjb25zdHJhaW50cy52aWRlbyA9IHttYW5kYXRvcnk6IHt9LCBvcHRpb25hbDogW119Oy8vIHNhbWUgYmVoYXZpb3VyIGFzIHRydWU7XG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5GcmFtZVJhdGUgPSBmcHM7XG4gICAgfVxufVxuXG5cbmZ1bmN0aW9uIFJUQ1V0aWxzKFJUQ1NlcnZpY2UpXG57XG4gICAgdGhpcy5zZXJ2aWNlID0gUlRDU2VydmljZTtcbiAgICBpZiAobmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSkge1xuICAgICAgICBjb25zb2xlLmxvZygnVGhpcyBhcHBlYXJzIHRvIGJlIEZpcmVmb3gnKTtcbiAgICAgICAgdmFyIHZlcnNpb24gPSBwYXJzZUludChuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9GaXJlZm94XFwvKFswLTldKylcXC4vKVsxXSwgMTApO1xuICAgICAgICBpZiAodmVyc2lvbiA+PSAyMikge1xuICAgICAgICAgICAgdGhpcy5wZWVyY29ubmVjdGlvbiA9IG1velJUQ1BlZXJDb25uZWN0aW9uO1xuICAgICAgICAgICAgdGhpcy5icm93c2VyID0gUlRDQnJvd3NlclR5cGUuUlRDX0JST1dTRVJfRklSRUZPWDtcbiAgICAgICAgICAgIHRoaXMuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYS5iaW5kKG5hdmlnYXRvcik7XG4gICAgICAgICAgICB0aGlzLnBjX2NvbnN0cmFpbnRzID0ge307XG4gICAgICAgICAgICB0aGlzLmF0dGFjaE1lZGlhU3RyZWFtID0gIGZ1bmN0aW9uIChlbGVtZW50LCBzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50WzBdLm1velNyY09iamVjdCA9IHN0cmVhbTtcbiAgICAgICAgICAgICAgICBlbGVtZW50WzBdLnBsYXkoKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmdldFN0cmVhbUlEID0gIGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgdHJhY2tzID0gc3RyZWFtLmdldFZpZGVvVHJhY2tzKCk7XG4gICAgICAgICAgICAgICAgaWYoIXRyYWNrcyB8fCB0cmFja3MubGVuZ3RoID09IDApXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB0cmFja3MgPSBzdHJlYW0uZ2V0QXVkaW9UcmFja3MoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRyYWNrc1swXS5pZC5yZXBsYWNlKC9bXFx7LFxcfV0vZyxcIlwiKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmdldFZpZGVvU3JjID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudC5tb3pTcmNPYmplY3Q7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5zZXRWaWRlb1NyYyA9IGZ1bmN0aW9uIChlbGVtZW50LCBzcmMpIHtcbiAgICAgICAgICAgICAgICBlbGVtZW50Lm1velNyY09iamVjdCA9IHNyYztcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBSVENTZXNzaW9uRGVzY3JpcHRpb24gPSBtb3pSVENTZXNzaW9uRGVzY3JpcHRpb247XG4gICAgICAgICAgICBSVENJY2VDYW5kaWRhdGUgPSBtb3pSVENJY2VDYW5kaWRhdGU7XG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1RoaXMgYXBwZWFycyB0byBiZSBDaHJvbWUnKTtcbiAgICAgICAgdGhpcy5wZWVyY29ubmVjdGlvbiA9IHdlYmtpdFJUQ1BlZXJDb25uZWN0aW9uO1xuICAgICAgICB0aGlzLmJyb3dzZXIgPSBSVENCcm93c2VyVHlwZS5SVENfQlJPV1NFUl9DSFJPTUU7XG4gICAgICAgIHRoaXMuZ2V0VXNlck1lZGlhID0gbmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYS5iaW5kKG5hdmlnYXRvcik7XG4gICAgICAgIHRoaXMuYXR0YWNoTWVkaWFTdHJlYW0gPSBmdW5jdGlvbiAoZWxlbWVudCwgc3RyZWFtKSB7XG4gICAgICAgICAgICBlbGVtZW50LmF0dHIoJ3NyYycsIHdlYmtpdFVSTC5jcmVhdGVPYmplY3RVUkwoc3RyZWFtKSk7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0U3RyZWFtSUQgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAvLyBzdHJlYW1zIGZyb20gRkYgZW5kcG9pbnRzIGhhdmUgdGhlIGNoYXJhY3RlcnMgJ3snIGFuZCAnfSdcbiAgICAgICAgICAgIC8vIHRoYXQgbWFrZSBqUXVlcnkgY2hva2UuXG4gICAgICAgICAgICByZXR1cm4gc3RyZWFtLmlkLnJlcGxhY2UoL1tcXHssXFx9XS9nLFwiXCIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldFZpZGVvU3JjID0gZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50LmdldEF0dHJpYnV0ZShcInNyY1wiKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5zZXRWaWRlb1NyYyA9IGZ1bmN0aW9uIChlbGVtZW50LCBzcmMpIHtcbiAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKFwic3JjXCIsIHNyYyk7XG4gICAgICAgIH07XG4gICAgICAgIC8vIERUTFMgc2hvdWxkIG5vdyBiZSBlbmFibGVkIGJ5IGRlZmF1bHQgYnV0Li5cbiAgICAgICAgdGhpcy5wY19jb25zdHJhaW50cyA9IHsnb3B0aW9uYWwnOiBbeydEdGxzU3J0cEtleUFncmVlbWVudCc6ICd0cnVlJ31dfTtcbiAgICAgICAgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQW5kcm9pZCcpICE9IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnBjX2NvbnN0cmFpbnRzID0ge307IC8vIGRpc2FibGUgRFRMUyBvbiBBbmRyb2lkXG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3ZWJraXRNZWRpYVN0cmVhbS5wcm90b3R5cGUuZ2V0VmlkZW9UcmFja3MpIHtcbiAgICAgICAgICAgIHdlYmtpdE1lZGlhU3RyZWFtLnByb3RvdHlwZS5nZXRWaWRlb1RyYWNrcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy52aWRlb1RyYWNrcztcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3ZWJraXRNZWRpYVN0cmVhbS5wcm90b3R5cGUuZ2V0QXVkaW9UcmFja3MpIHtcbiAgICAgICAgICAgIHdlYmtpdE1lZGlhU3RyZWFtLnByb3RvdHlwZS5nZXRBdWRpb1RyYWNrcyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hdWRpb1RyYWNrcztcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdHJ5IHsgY29uc29sZS5sb2coJ0Jyb3dzZXIgZG9lcyBub3QgYXBwZWFyIHRvIGJlIFdlYlJUQy1jYXBhYmxlJyk7IH0gY2F0Y2ggKGUpIHsgfVxuXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJ3dlYnJ0Y3JlcXVpcmVkLmh0bWwnO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuYnJvd3NlciAhPT0gUlRDQnJvd3NlclR5cGUuUlRDX0JST1dTRVJfQ0hST01FICYmXG4gICAgICAgIGNvbmZpZy5lbmFibGVGaXJlZm94U3VwcG9ydCAhPT0gdHJ1ZSkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICdjaHJvbWVvbmx5Lmh0bWwnO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG59XG5cblxuUlRDVXRpbHMucHJvdG90eXBlLmdldFVzZXJNZWRpYVdpdGhDb25zdHJhaW50cyA9IGZ1bmN0aW9uKFxuICAgIHVtLCBzdWNjZXNzX2NhbGxiYWNrLCBmYWlsdXJlX2NhbGxiYWNrLCByZXNvbHV0aW9uLGJhbmR3aWR0aCwgZnBzLFxuICAgIGRlc2t0b3BTdHJlYW0pXG57XG4gICAgLy8gQ2hlY2sgaWYgd2UgYXJlIHJ1bm5pbmcgb24gQW5kcm9pZCBkZXZpY2VcbiAgICB2YXIgaXNBbmRyb2lkID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgIT0gLTE7XG5cbiAgICBzZXRDb25zdHJhaW50cyh1bSwgcmVzb2x1dGlvbiwgYmFuZHdpZHRoLCBmcHMsIGRlc2t0b3BTdHJlYW0sIGlzQW5kcm9pZCk7XG5cbiAgICB2YXIgaXNGRiA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMTtcblxuICAgIHRyeSB7XG4gICAgICAgIGlmIChjb25maWcuZW5hYmxlU2ltdWxjYXN0XG4gICAgICAgICAgICAmJiBjb25zdHJhaW50cy52aWRlb1xuICAgICAgICAgICAgJiYgY29uc3RyYWludHMudmlkZW8uY2hyb21lTWVkaWFTb3VyY2UgIT09ICdzY3JlZW4nXG4gICAgICAgICAgICAmJiBjb25zdHJhaW50cy52aWRlby5jaHJvbWVNZWRpYVNvdXJjZSAhPT0gJ2Rlc2t0b3AnXG4gICAgICAgICAgICAmJiAhaXNBbmRyb2lkXG5cbiAgICAgICAgICAgIC8vIFdlIGN1cnJlbnRseSBkbyBub3Qgc3VwcG9ydCBGRiwgYXMgaXQgZG9lc24ndCBoYXZlIG11bHRpc3RyZWFtIHN1cHBvcnQuXG4gICAgICAgICAgICAmJiAhaXNGRikge1xuICAgICAgICAgICAgc2ltdWxjYXN0LmdldFVzZXJNZWRpYShjb25zdHJhaW50cywgZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25Vc2VyTWVkaWFTdWNjZXNzJyk7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NfY2FsbGJhY2soc3RyZWFtKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBnZXQgYWNjZXNzIHRvIGxvY2FsIG1lZGlhLiBFcnJvciAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWlsdXJlX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmYWlsdXJlX2NhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuXG4gICAgICAgICAgICBSVENVdGlscy5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25Vc2VyTWVkaWFTdWNjZXNzJyk7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NfY2FsbGJhY2soc3RyZWFtKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBnZXQgYWNjZXNzIHRvIGxvY2FsIG1lZGlhLiBFcnJvciAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWlsdXJlX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmYWlsdXJlX2NhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0dVTSBmYWlsZWQ6ICcsIGUpO1xuICAgICAgICBpZihmYWlsdXJlX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICBmYWlsdXJlX2NhbGxiYWNrKGUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBXZSBhc2sgZm9yIGF1ZGlvIGFuZCB2aWRlbyBjb21iaW5lZCBzdHJlYW0gaW4gb3JkZXIgdG8gZ2V0IHBlcm1pc3Npb25zIGFuZFxuICogbm90IHRvIGFzayB0d2ljZS5cbiAqL1xuUlRDVXRpbHMucHJvdG90eXBlLm9idGFpbkF1ZGlvQW5kVmlkZW9QZXJtaXNzaW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBHZXQgQVZcbiAgICB2YXIgY2IgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdnb3QnLCBzdHJlYW0sIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmxlbmd0aCwgc3RyZWFtLmdldFZpZGVvVHJhY2tzKCkubGVuZ3RoKTtcbiAgICAgICAgc2VsZi5oYW5kbGVMb2NhbFN0cmVhbShzdHJlYW0pO1xuICAgICAgICB0cmFja1VzYWdlKCdsb2NhbE1lZGlhJywge1xuICAgICAgICAgICAgYXVkaW86IHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmxlbmd0aCxcbiAgICAgICAgICAgIHZpZGVvOiBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGhcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5nZXRVc2VyTWVkaWFXaXRoQ29uc3RyYWludHMoXG4gICAgICAgIFsnYXVkaW8nLCAndmlkZW8nXSxcbiAgICAgICAgY2IsXG4gICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZmFpbGVkIHRvIG9idGFpbiBhdWRpby92aWRlbyBzdHJlYW0gLSB0cnlpbmcgYXVkaW8gb25seScsIGVycm9yKTtcbiAgICAgICAgICAgIHNlbGYuZ2V0VXNlck1lZGlhV2l0aENvbnN0cmFpbnRzKFxuICAgICAgICAgICAgICAgIFsnYXVkaW8nXSxcbiAgICAgICAgICAgICAgICBjYixcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZmFpbGVkIHRvIG9idGFpbiBhdWRpby92aWRlbyBzdHJlYW0gLSBzdG9wJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB0cmFja1VzYWdlKCdsb2NhbE1lZGlhRXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZWRpYTogZXJyb3IubWVkaWEgfHwgJ3ZpZGVvJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgOiBlcnJvci5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlSGFuZGxlci5zaG93RXJyb3IoXCJFcnJvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRmFpbGVkIHRvIG9idGFpbiBwZXJtaXNzaW9ucyB0byB1c2UgdGhlIGxvY2FsIG1pY3JvcGhvbmVcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhbmQvb3IgY2FtZXJhLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICAgICAgY29uZmlnLnJlc29sdXRpb24gfHwgJzM2MCcpO1xufVxuXG5SVENVdGlscy5wcm90b3R5cGUuaGFuZGxlTG9jYWxTdHJlYW0gPSBmdW5jdGlvbihzdHJlYW0pXG57XG4gICAgaWYod2luZG93LndlYmtpdE1lZGlhU3RyZWFtKVxuICAgIHtcbiAgICAgICAgdmFyIGF1ZGlvU3RyZWFtID0gbmV3IHdlYmtpdE1lZGlhU3RyZWFtKCk7XG4gICAgICAgIHZhciB2aWRlb1N0cmVhbSA9IG5ldyB3ZWJraXRNZWRpYVN0cmVhbSgpO1xuICAgICAgICB2YXIgYXVkaW9UcmFja3MgPSBzdHJlYW0uZ2V0QXVkaW9UcmFja3MoKTtcbiAgICAgICAgdmFyIHZpZGVvVHJhY2tzID0gc3RyZWFtLmdldFZpZGVvVHJhY2tzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXVkaW9UcmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGF1ZGlvU3RyZWFtLmFkZFRyYWNrKGF1ZGlvVHJhY2tzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2VydmljZS5jcmVhdGVMb2NhbFN0cmVhbShhdWRpb1N0cmVhbSwgXCJhdWRpb1wiKTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdmlkZW9UcmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZpZGVvU3RyZWFtLmFkZFRyYWNrKHZpZGVvVHJhY2tzW2ldKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlLmNyZWF0ZUxvY2FsU3RyZWFtKHZpZGVvU3RyZWFtLCBcInZpZGVvXCIpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgey8vZmlyZWZveFxuICAgICAgICB0aGlzLnNlcnZpY2UuY3JlYXRlTG9jYWxTdHJlYW0oc3RyZWFtLCBcInN0cmVhbVwiKTtcbiAgICB9XG5cbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJUQ1V0aWxzOyIsIi8qIGdsb2JhbCBjb25uZWN0aW9uLCBTdHJvcGhlLCB1cGRhdGVMYXJnZVZpZGVvLCBmb2N1c2VkVmlkZW9TcmMqL1xuXG4vLyBjYWNoZSBkYXRhY2hhbm5lbHMgdG8gYXZvaWQgZ2FyYmFnZSBjb2xsZWN0aW9uXG4vLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NDA1NTQ1XG52YXIgX2RhdGFDaGFubmVscyA9IFtdO1xuXG5cblxudmFyIERhdGFDaGFubmVscyA9XG57XG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayB0cmlnZ2VyZWQgYnkgUGVlckNvbm5lY3Rpb24gd2hlbiBuZXcgZGF0YSBjaGFubmVsIGlzIG9wZW5lZFxuICAgICAqIG9uIHRoZSBicmlkZ2UuXG4gICAgICogQHBhcmFtIGV2ZW50IHRoZSBldmVudCBpbmZvIG9iamVjdC5cbiAgICAgKi9cblxuICAgIG9uRGF0YUNoYW5uZWw6IGZ1bmN0aW9uIChldmVudClcbiAgICB7XG4gICAgICAgIHZhciBkYXRhQ2hhbm5lbCA9IGV2ZW50LmNoYW5uZWw7XG5cbiAgICAgICAgZGF0YUNoYW5uZWwub25vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRGF0YSBjaGFubmVsIG9wZW5lZCBieSB0aGUgVmlkZW9icmlkZ2UhXCIsIGRhdGFDaGFubmVsKTtcblxuICAgICAgICAgICAgLy8gQ29kZSBzYW1wbGUgZm9yIHNlbmRpbmcgc3RyaW5nIGFuZC9vciBiaW5hcnkgZGF0YVxuICAgICAgICAgICAgLy8gU2VuZHMgU3RyaW5nIG1lc3NhZ2UgdG8gdGhlIGJyaWRnZVxuICAgICAgICAgICAgLy9kYXRhQ2hhbm5lbC5zZW5kKFwiSGVsbG8gYnJpZGdlIVwiKTtcbiAgICAgICAgICAgIC8vIFNlbmRzIDEyIGJ5dGVzIGJpbmFyeSBtZXNzYWdlIHRvIHRoZSBicmlkZ2VcbiAgICAgICAgICAgIC8vZGF0YUNoYW5uZWwuc2VuZChuZXcgQXJyYXlCdWZmZXIoMTIpKTtcblxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgZGF0YSBjaGFubmVsIGJlY29tZXMgYXZhaWxhYmxlLCB0ZWxsIHRoZSBicmlkZ2UgYWJvdXQgdmlkZW9cbiAgICAgICAgICAgIC8vIHNlbGVjdGlvbnMgc28gdGhhdCBpdCBjYW4gZG8gYWRhcHRpdmUgc2ltdWxjYXN0LFxuICAgICAgICAgICAgLy8gd2Ugd2FudCB0aGUgbm90aWZpY2F0aW9uIHRvIHRyaWdnZXIgZXZlbiBpZiB1c2VySmlkIGlzIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIC8vIG9yIG51bGwuXG4gICAgICAgICAgICB2YXIgdXNlckppZCA9IFZpZGVvTGF5b3V0LmdldExhcmdlVmlkZW9TdGF0ZSgpLnVzZXJKaWQ7XG4gICAgICAgICAgICAvLyB3ZSB3YW50IHRoZSBub3RpZmljYXRpb24gdG8gdHJpZ2dlciBldmVuIGlmIHVzZXJKaWQgaXMgdW5kZWZpbmVkLFxuICAgICAgICAgICAgLy8gb3IgbnVsbC5cbiAgICAgICAgICAgIG9uU2VsZWN0ZWRFbmRwb2ludENoYW5nZWQodXNlckppZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZGF0YUNoYW5uZWwub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkRhdGEgQ2hhbm5lbCBFcnJvcjpcIiwgZXJyb3IsIGRhdGFDaGFubmVsKTtcbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhQ2hhbm5lbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIC8vIEpTT05cbiAgICAgICAgICAgIHZhciBvYmo7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgb2JqID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgXCJGYWlsZWQgdG8gcGFyc2UgZGF0YSBjaGFubmVsIG1lc3NhZ2UgYXMgSlNPTjogXCIsXG4gICAgICAgICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFDaGFubmVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZihvYmopKSAmJiAobnVsbCAhPT0gb2JqKSkge1xuICAgICAgICAgICAgICAgIHZhciBjb2xpYnJpQ2xhc3MgPSBvYmouY29saWJyaUNsYXNzO1xuXG4gICAgICAgICAgICAgICAgaWYgKFwiRG9taW5hbnRTcGVha2VyRW5kcG9pbnRDaGFuZ2VFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRW5kcG9pbnQgSUQgZnJvbSB0aGUgVmlkZW9icmlkZ2UuXG4gICAgICAgICAgICAgICAgICAgIHZhciBkb21pbmFudFNwZWFrZXJFbmRwb2ludCA9IG9iai5kb21pbmFudFNwZWFrZXJFbmRwb2ludDtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgICAgICAgICAgICAgICAgXCJEYXRhIGNoYW5uZWwgbmV3IGRvbWluYW50IHNwZWFrZXIgZXZlbnQ6IFwiLFxuICAgICAgICAgICAgICAgICAgICBkb21pbmFudFNwZWFrZXJFbmRwb2ludCk7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgJ2RvbWluYW50c3BlYWtlcmNoYW5nZWQnLFxuICAgICAgICAgICAgICAgICAgICBbZG9taW5hbnRTcGVha2VyRW5kcG9pbnRdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKFwiSW5MYXN0TkNoYW5nZUV2ZW50XCIgPT09IGNvbGlicmlDbGFzcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSBvYmoub2xkVmFsdWU7XG4gICAgICAgICAgICAgICAgdmFyIG5ld1ZhbHVlID0gb2JqLm5ld1ZhbHVlO1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IG9sZFZhbHVlIGFuZCBuZXdWYWx1ZSBhcmUgb2YgdHlwZSBib29sZWFuLlxuICAgICAgICAgICAgICAgIHZhciB0eXBlO1xuXG4gICAgICAgICAgICAgICAgaWYgKCh0eXBlID0gdHlwZW9mIG9sZFZhbHVlKSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWUgPSAob2xkVmFsdWUgPT0gXCJ0cnVlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWUgPSBuZXcgQm9vbGVhbihvbGRWYWx1ZSkudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgodHlwZSA9IHR5cGVvZiBuZXdWYWx1ZSkgIT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gKG5ld1ZhbHVlID09IFwidHJ1ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gbmV3IEJvb2xlYW4obmV3VmFsdWUpLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdpbmxhc3RuY2hhbmdlZCcsIFtvbGRWYWx1ZSwgbmV3VmFsdWVdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKFwiTGFzdE5FbmRwb2ludHNDaGFuZ2VFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgLy8gVGhlIG5ldy9sYXRlc3QgbGlzdCBvZiBsYXN0LW4gZW5kcG9pbnQgSURzLlxuICAgICAgICAgICAgICAgIHZhciBsYXN0TkVuZHBvaW50cyA9IG9iai5sYXN0TkVuZHBvaW50cztcbiAgICAgICAgICAgICAgICAvLyBUaGUgbGlzdCBvZiBlbmRwb2ludCBJRHMgd2hpY2ggYXJlIGVudGVyaW5nIHRoZSBsaXN0IG9mXG4gICAgICAgICAgICAgICAgLy8gbGFzdC1uIGF0IHRoaXMgdGltZSBpLmUuIHdlcmUgbm90IGluIHRoZSBvbGQgbGlzdCBvZiBsYXN0LW5cbiAgICAgICAgICAgICAgICAvLyBlbmRwb2ludCBJRHMuXG4gICAgICAgICAgICAgICAgdmFyIGVuZHBvaW50c0VudGVyaW5nTGFzdE4gPSBvYmouZW5kcG9pbnRzRW50ZXJpbmdMYXN0TjtcbiAgICAgICAgICAgICAgICB2YXIgc3RyZWFtID0gb2JqLnN0cmVhbTtcblxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICAgICBcIkRhdGEgY2hhbm5lbCBuZXcgbGFzdC1uIGV2ZW50OiBcIixcbiAgICAgICAgICAgICAgICAgICAgbGFzdE5FbmRwb2ludHMsIGVuZHBvaW50c0VudGVyaW5nTGFzdE4sIG9iaik7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgJ2xhc3RuY2hhbmdlZCcsXG4gICAgICAgICAgICAgICAgICAgIFtsYXN0TkVuZHBvaW50cywgZW5kcG9pbnRzRW50ZXJpbmdMYXN0Tiwgc3RyZWFtXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChcIlNpbXVsY2FzdExheWVyc0NoYW5nZWRFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgJ3NpbXVsY2FzdGxheWVyc2NoYW5nZWQnLFxuICAgICAgICAgICAgICAgICAgICBbb2JqLmVuZHBvaW50U2ltdWxjYXN0TGF5ZXJzXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChcIlNpbXVsY2FzdExheWVyc0NoYW5naW5nRXZlbnRcIiA9PT0gY29saWJyaUNsYXNzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoXG4gICAgICAgICAgICAgICAgICAgICdzaW11bGNhc3RsYXllcnNjaGFuZ2luZycsXG4gICAgICAgICAgICAgICAgICAgIFtvYmouZW5kcG9pbnRTaW11bGNhc3RMYXllcnNdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKFwiU3RhcnRTaW11bGNhc3RMYXllckV2ZW50XCIgPT09IGNvbGlicmlDbGFzcylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdzdGFydHNpbXVsY2FzdGxheWVyJywgb2JqLnNpbXVsY2FzdExheWVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKFwiU3RvcFNpbXVsY2FzdExheWVyRXZlbnRcIiA9PT0gY29saWJyaUNsYXNzKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3N0b3BzaW11bGNhc3RsYXllcicsIG9iai5zaW11bGNhc3RMYXllcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhcIkRhdGEgY2hhbm5lbCBKU09OLWZvcm1hdHRlZCBtZXNzYWdlOiBcIiwgb2JqKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAgICAgZGF0YUNoYW5uZWwub25jbG9zZSA9IGZ1bmN0aW9uICgpIFxuXHR7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJUaGUgRGF0YSBDaGFubmVsIGNsb3NlZFwiLCBkYXRhQ2hhbm5lbCk7XG4gICAgICAgICAgICB2YXIgaWR4ID0gX2RhdGFDaGFubmVscy5pbmRleE9mKGRhdGFDaGFubmVsKTtcbiAgICAgICAgICAgIGlmIChpZHggPiAtMSlcbiAgICAgICAgICAgICAgICBfZGF0YUNoYW5uZWxzID0gX2RhdGFDaGFubmVscy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfTtcbiAgICAgICAgX2RhdGFDaGFubmVscy5wdXNoKGRhdGFDaGFubmVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQmluZHMgXCJvbmRhdGFjaGFubmVsXCIgZXZlbnQgbGlzdGVuZXIgdG8gZ2l2ZW4gUGVlckNvbm5lY3Rpb24gaW5zdGFuY2UuXG4gICAgICogQHBhcmFtIHBlZXJDb25uZWN0aW9uIFdlYlJUQyBwZWVyIGNvbm5lY3Rpb24gaW5zdGFuY2UuXG4gICAgICovXG4gICAgYmluZERhdGFDaGFubmVsTGlzdGVuZXI6IGZ1bmN0aW9uIChwZWVyQ29ubmVjdGlvbikge1xuICAgICAgICBpZighY29uZmlnLm9wZW5TY3RwKVxuICAgICAgICAgICAgcmV0cnVuO1xuXG4gICAgICAgIHBlZXJDb25uZWN0aW9uLm9uZGF0YWNoYW5uZWwgPSB0aGlzLm9uRGF0YUNoYW5uZWw7XG5cbiAgICAgICAgLy8gU2FtcGxlIGNvZGUgZm9yIG9wZW5pbmcgbmV3IGRhdGEgY2hhbm5lbCBmcm9tIEppdHNpIE1lZXQgdG8gdGhlIGJyaWRnZS5cbiAgICAgICAgLy8gQWx0aG91Z2ggaXQncyBub3QgYSByZXF1aXJlbWVudCB0byBvcGVuIHNlcGFyYXRlIGNoYW5uZWxzIGZyb20gYm90aCBicmlkZ2VcbiAgICAgICAgLy8gYW5kIHBlZXIgYXMgc2luZ2xlIGNoYW5uZWwgY2FuIGJlIHVzZWQgZm9yIHNlbmRpbmcgYW5kIHJlY2VpdmluZyBkYXRhLlxuICAgICAgICAvLyBTbyBlaXRoZXIgY2hhbm5lbCBvcGVuZWQgYnkgdGhlIGJyaWRnZSBvciB0aGUgb25lIG9wZW5lZCBoZXJlIGlzIGVub3VnaFxuICAgICAgICAvLyBmb3IgY29tbXVuaWNhdGlvbiB3aXRoIHRoZSBicmlkZ2UuXG4gICAgICAgIC8qdmFyIGRhdGFDaGFubmVsT3B0aW9ucyA9XG4gICAgICAgICB7XG4gICAgICAgICByZWxpYWJsZTogdHJ1ZVxuICAgICAgICAgfTtcbiAgICAgICAgIHZhciBkYXRhQ2hhbm5lbFxuICAgICAgICAgPSBwZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbChcIm15Q2hhbm5lbFwiLCBkYXRhQ2hhbm5lbE9wdGlvbnMpO1xuXG4gICAgICAgICAvLyBDYW4gYmUgdXNlZCBvbmx5IHdoZW4gaXMgaW4gb3BlbiBzdGF0ZVxuICAgICAgICAgZGF0YUNoYW5uZWwub25vcGVuID0gZnVuY3Rpb24gKClcbiAgICAgICAgIHtcbiAgICAgICAgIGRhdGFDaGFubmVsLnNlbmQoXCJNeSBjaGFubmVsICEhIVwiKTtcbiAgICAgICAgIH07XG4gICAgICAgICBkYXRhQ2hhbm5lbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpXG4gICAgICAgICB7XG4gICAgICAgICB2YXIgbXNnRGF0YSA9IGV2ZW50LmRhdGE7XG4gICAgICAgICBjb25zb2xlLmluZm8oXCJHb3QgTXkgRGF0YSBDaGFubmVsIE1lc3NhZ2U6XCIsIG1zZ0RhdGEsIGRhdGFDaGFubmVsKTtcbiAgICAgICAgIH07Ki9cbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gb25TZWxlY3RlZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKVxue1xuICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZCBlbmRwb2ludCBjaGFuZ2VkOiAnLCB1c2VySmlkKTtcbiAgICBpZiAoX2RhdGFDaGFubmVscyAmJiBfZGF0YUNoYW5uZWxzLmxlbmd0aCAhPSAwKVxuICAgIHtcbiAgICAgICAgX2RhdGFDaGFubmVscy5zb21lKGZ1bmN0aW9uIChkYXRhQ2hhbm5lbCkge1xuICAgICAgICAgICAgaWYgKGRhdGFDaGFubmVsLnJlYWR5U3RhdGUgPT0gJ29wZW4nKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRhdGFDaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAnY29saWJyaUNsYXNzJzogJ1NlbGVjdGVkRW5kcG9pbnRDaGFuZ2VkRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAnc2VsZWN0ZWRFbmRwb2ludCc6ICghdXNlckppZCB8fCB1c2VySmlkID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG51bGwgOiB1c2VySmlkXG4gICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuJChkb2N1bWVudCkuYmluZChcInNlbGVjdGVkZW5kcG9pbnRjaGFuZ2VkXCIsIGZ1bmN0aW9uKGV2ZW50LCB1c2VySmlkKSB7XG4gICAgb25TZWxlY3RlZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKTtcbn0pO1xuXG5mdW5jdGlvbiBvblBpbm5lZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKVxue1xuICAgIGNvbnNvbGUubG9nKCdwaW5uZWQgZW5kcG9pbnQgY2hhbmdlZDogJywgdXNlckppZCk7XG4gICAgaWYgKF9kYXRhQ2hhbm5lbHMgJiYgX2RhdGFDaGFubmVscy5sZW5ndGggIT0gMClcbiAgICB7XG4gICAgICAgIF9kYXRhQ2hhbm5lbHMuc29tZShmdW5jdGlvbiAoZGF0YUNoYW5uZWwpIHtcbiAgICAgICAgICAgIGlmIChkYXRhQ2hhbm5lbC5yZWFkeVN0YXRlID09ICdvcGVuJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkYXRhQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbGlicmlDbGFzcyc6ICdQaW5uZWRFbmRwb2ludENoYW5nZWRFdmVudCcsXG4gICAgICAgICAgICAgICAgICAgICdwaW5uZWRFbmRwb2ludCc6ICghdXNlckppZCB8fCB1c2VySmlkID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG51bGwgOiBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZCh1c2VySmlkKVxuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiQoZG9jdW1lbnQpLmJpbmQoXCJwaW5uZWRlbmRwb2ludGNoYW5nZWRcIiwgZnVuY3Rpb24oZXZlbnQsIHVzZXJKaWQpIHtcbiAgICBvblBpbm5lZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFDaGFubmVscztcbiIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiJdfQ==
