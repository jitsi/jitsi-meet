!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.RTC=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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


},{}],2:[function(require,module,exports){
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

},{}],3:[function(require,module,exports){
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

},{"./RTC.js":4}],4:[function(require,module,exports){
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
        var DataChannels = require("./DataChannels");
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

},{"./DataChannels":1,"./LocalStream.js":2,"./MediaStream.js":3,"./RTCUtils.js":5,"events":6}],5:[function(require,module,exports){
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

},{}]},{},[4])(4)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1JUQy9EYXRhQ2hhbm5lbHMuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1JUQy9Mb2NhbFN0cmVhbS5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvUlRDL01lZGlhU3RyZWFtLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9SVEMvUlRDLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9SVEMvUlRDVXRpbHMuanMiLCIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDalZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIGdsb2JhbCBjb25uZWN0aW9uLCBTdHJvcGhlLCB1cGRhdGVMYXJnZVZpZGVvLCBmb2N1c2VkVmlkZW9TcmMqL1xuXG4vLyBjYWNoZSBkYXRhY2hhbm5lbHMgdG8gYXZvaWQgZ2FyYmFnZSBjb2xsZWN0aW9uXG4vLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9NDA1NTQ1XG52YXIgX2RhdGFDaGFubmVscyA9IFtdO1xuXG5cblxudmFyIERhdGFDaGFubmVscyA9XG57XG5cbiAgICAvKipcbiAgICAgKiBDYWxsYmFjayB0cmlnZ2VyZWQgYnkgUGVlckNvbm5lY3Rpb24gd2hlbiBuZXcgZGF0YSBjaGFubmVsIGlzIG9wZW5lZFxuICAgICAqIG9uIHRoZSBicmlkZ2UuXG4gICAgICogQHBhcmFtIGV2ZW50IHRoZSBldmVudCBpbmZvIG9iamVjdC5cbiAgICAgKi9cblxuICAgIG9uRGF0YUNoYW5uZWw6IGZ1bmN0aW9uIChldmVudClcbiAgICB7XG4gICAgICAgIHZhciBkYXRhQ2hhbm5lbCA9IGV2ZW50LmNoYW5uZWw7XG5cbiAgICAgICAgZGF0YUNoYW5uZWwub25vcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiRGF0YSBjaGFubmVsIG9wZW5lZCBieSB0aGUgVmlkZW9icmlkZ2UhXCIsIGRhdGFDaGFubmVsKTtcblxuICAgICAgICAgICAgLy8gQ29kZSBzYW1wbGUgZm9yIHNlbmRpbmcgc3RyaW5nIGFuZC9vciBiaW5hcnkgZGF0YVxuICAgICAgICAgICAgLy8gU2VuZHMgU3RyaW5nIG1lc3NhZ2UgdG8gdGhlIGJyaWRnZVxuICAgICAgICAgICAgLy9kYXRhQ2hhbm5lbC5zZW5kKFwiSGVsbG8gYnJpZGdlIVwiKTtcbiAgICAgICAgICAgIC8vIFNlbmRzIDEyIGJ5dGVzIGJpbmFyeSBtZXNzYWdlIHRvIHRoZSBicmlkZ2VcbiAgICAgICAgICAgIC8vZGF0YUNoYW5uZWwuc2VuZChuZXcgQXJyYXlCdWZmZXIoMTIpKTtcblxuICAgICAgICAgICAgLy8gd2hlbiB0aGUgZGF0YSBjaGFubmVsIGJlY29tZXMgYXZhaWxhYmxlLCB0ZWxsIHRoZSBicmlkZ2UgYWJvdXQgdmlkZW9cbiAgICAgICAgICAgIC8vIHNlbGVjdGlvbnMgc28gdGhhdCBpdCBjYW4gZG8gYWRhcHRpdmUgc2ltdWxjYXN0LFxuICAgICAgICAgICAgLy8gd2Ugd2FudCB0aGUgbm90aWZpY2F0aW9uIHRvIHRyaWdnZXIgZXZlbiBpZiB1c2VySmlkIGlzIHVuZGVmaW5lZCxcbiAgICAgICAgICAgIC8vIG9yIG51bGwuXG4gICAgICAgICAgICB2YXIgdXNlckppZCA9IFZpZGVvTGF5b3V0LmdldExhcmdlVmlkZW9TdGF0ZSgpLnVzZXJKaWQ7XG4gICAgICAgICAgICAvLyB3ZSB3YW50IHRoZSBub3RpZmljYXRpb24gdG8gdHJpZ2dlciBldmVuIGlmIHVzZXJKaWQgaXMgdW5kZWZpbmVkLFxuICAgICAgICAgICAgLy8gb3IgbnVsbC5cbiAgICAgICAgICAgIG9uU2VsZWN0ZWRFbmRwb2ludENoYW5nZWQodXNlckppZCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZGF0YUNoYW5uZWwub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihcIkRhdGEgQ2hhbm5lbCBFcnJvcjpcIiwgZXJyb3IsIGRhdGFDaGFubmVsKTtcbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhQ2hhbm5lbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gZXZlbnQuZGF0YTtcbiAgICAgICAgICAgIC8vIEpTT05cbiAgICAgICAgICAgIHZhciBvYmo7XG5cbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgb2JqID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgXCJGYWlsZWQgdG8gcGFyc2UgZGF0YSBjaGFubmVsIG1lc3NhZ2UgYXMgSlNPTjogXCIsXG4gICAgICAgICAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICAgICAgICAgIGRhdGFDaGFubmVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZihvYmopKSAmJiAobnVsbCAhPT0gb2JqKSkge1xuICAgICAgICAgICAgICAgIHZhciBjb2xpYnJpQ2xhc3MgPSBvYmouY29saWJyaUNsYXNzO1xuXG4gICAgICAgICAgICAgICAgaWYgKFwiRG9taW5hbnRTcGVha2VyRW5kcG9pbnRDaGFuZ2VFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gRW5kcG9pbnQgSUQgZnJvbSB0aGUgVmlkZW9icmlkZ2UuXG4gICAgICAgICAgICAgICAgICAgIHZhciBkb21pbmFudFNwZWFrZXJFbmRwb2ludCA9IG9iai5kb21pbmFudFNwZWFrZXJFbmRwb2ludDtcblxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkRhdGEgY2hhbm5lbCBuZXcgZG9taW5hbnQgc3BlYWtlciBldmVudDogXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBkb21pbmFudFNwZWFrZXJFbmRwb2ludCk7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAnZG9taW5hbnRzcGVha2VyY2hhbmdlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBbZG9taW5hbnRTcGVha2VyRW5kcG9pbnRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJJbkxhc3ROQ2hhbmdlRXZlbnRcIiA9PT0gY29saWJyaUNsYXNzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG9sZFZhbHVlID0gb2JqLm9sZFZhbHVlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3VmFsdWUgPSBvYmoubmV3VmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGF0IG9sZFZhbHVlIGFuZCBuZXdWYWx1ZSBhcmUgb2YgdHlwZSBib29sZWFuLlxuICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoKHR5cGUgPSB0eXBlb2Ygb2xkVmFsdWUpICE9PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZFZhbHVlID0gKG9sZFZhbHVlID09IFwidHJ1ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWUgPSBuZXcgQm9vbGVhbihvbGRWYWx1ZSkudmFsdWVPZigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmICgodHlwZSA9IHR5cGVvZiBuZXdWYWx1ZSkgIT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3VmFsdWUgPSAobmV3VmFsdWUgPT0gXCJ0cnVlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IG5ldyBCb29sZWFuKG5ld1ZhbHVlKS52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcignaW5sYXN0bmNoYW5nZWQnLCBbb2xkVmFsdWUsIG5ld1ZhbHVlXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwiTGFzdE5FbmRwb2ludHNDaGFuZ2VFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgbmV3L2xhdGVzdCBsaXN0IG9mIGxhc3QtbiBlbmRwb2ludCBJRHMuXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXN0TkVuZHBvaW50cyA9IG9iai5sYXN0TkVuZHBvaW50cztcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhlIGxpc3Qgb2YgZW5kcG9pbnQgSURzIHdoaWNoIGFyZSBlbnRlcmluZyB0aGUgbGlzdCBvZlxuICAgICAgICAgICAgICAgICAgICAvLyBsYXN0LW4gYXQgdGhpcyB0aW1lIGkuZS4gd2VyZSBub3QgaW4gdGhlIG9sZCBsaXN0IG9mIGxhc3QtblxuICAgICAgICAgICAgICAgICAgICAvLyBlbmRwb2ludCBJRHMuXG4gICAgICAgICAgICAgICAgICAgIHZhciBlbmRwb2ludHNFbnRlcmluZ0xhc3ROID0gb2JqLmVuZHBvaW50c0VudGVyaW5nTGFzdE47XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHJlYW0gPSBvYmouc3RyZWFtO1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICAgICAgICAgXCJEYXRhIGNoYW5uZWwgbmV3IGxhc3QtbiBldmVudDogXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICBsYXN0TkVuZHBvaW50cywgZW5kcG9pbnRzRW50ZXJpbmdMYXN0Tiwgb2JqKTtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICdsYXN0bmNoYW5nZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgW2xhc3RORW5kcG9pbnRzLCBlbmRwb2ludHNFbnRlcmluZ0xhc3ROLCBzdHJlYW1dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJTaW11bGNhc3RMYXllcnNDaGFuZ2VkRXZlbnRcIiA9PT0gY29saWJyaUNsYXNzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICdzaW11bGNhc3RsYXllcnNjaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtvYmouZW5kcG9pbnRTaW11bGNhc3RMYXllcnNdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJTaW11bGNhc3RMYXllcnNDaGFuZ2luZ0V2ZW50XCIgPT09IGNvbGlicmlDbGFzcylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAnc2ltdWxjYXN0bGF5ZXJzY2hhbmdpbmcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgW29iai5lbmRwb2ludFNpbXVsY2FzdExheWVyc10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcIlN0YXJ0U2ltdWxjYXN0TGF5ZXJFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdzdGFydHNpbXVsY2FzdGxheWVyJywgb2JqLnNpbXVsY2FzdExheWVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJTdG9wU2ltdWxjYXN0TGF5ZXJFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdzdG9wc2ltdWxjYXN0bGF5ZXInLCBvYmouc2ltdWxjYXN0TGF5ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmRlYnVnKFwiRGF0YSBjaGFubmVsIEpTT04tZm9ybWF0dGVkIG1lc3NhZ2U6IFwiLCBvYmopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhQ2hhbm5lbC5vbmNsb3NlID0gZnVuY3Rpb24gKClcbiAgICAgICAge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiVGhlIERhdGEgQ2hhbm5lbCBjbG9zZWRcIiwgZGF0YUNoYW5uZWwpO1xuICAgICAgICAgICAgdmFyIGlkeCA9IF9kYXRhQ2hhbm5lbHMuaW5kZXhPZihkYXRhQ2hhbm5lbCk7XG4gICAgICAgICAgICBpZiAoaWR4ID4gLTEpXG4gICAgICAgICAgICAgICAgX2RhdGFDaGFubmVscyA9IF9kYXRhQ2hhbm5lbHMuc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH07XG4gICAgICAgIF9kYXRhQ2hhbm5lbHMucHVzaChkYXRhQ2hhbm5lbCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEJpbmRzIFwib25kYXRhY2hhbm5lbFwiIGV2ZW50IGxpc3RlbmVyIHRvIGdpdmVuIFBlZXJDb25uZWN0aW9uIGluc3RhbmNlLlxuICAgICAqIEBwYXJhbSBwZWVyQ29ubmVjdGlvbiBXZWJSVEMgcGVlciBjb25uZWN0aW9uIGluc3RhbmNlLlxuICAgICAqL1xuICAgIGJpbmREYXRhQ2hhbm5lbExpc3RlbmVyOiBmdW5jdGlvbiAocGVlckNvbm5lY3Rpb24pIHtcbiAgICAgICAgaWYoIWNvbmZpZy5vcGVuU2N0cClcbiAgICAgICAgICAgIHJldHJ1bjtcblxuICAgICAgICBwZWVyQ29ubmVjdGlvbi5vbmRhdGFjaGFubmVsID0gdGhpcy5vbkRhdGFDaGFubmVsO1xuXG4gICAgICAgIC8vIFNhbXBsZSBjb2RlIGZvciBvcGVuaW5nIG5ldyBkYXRhIGNoYW5uZWwgZnJvbSBKaXRzaSBNZWV0IHRvIHRoZSBicmlkZ2UuXG4gICAgICAgIC8vIEFsdGhvdWdoIGl0J3Mgbm90IGEgcmVxdWlyZW1lbnQgdG8gb3BlbiBzZXBhcmF0ZSBjaGFubmVscyBmcm9tIGJvdGggYnJpZGdlXG4gICAgICAgIC8vIGFuZCBwZWVyIGFzIHNpbmdsZSBjaGFubmVsIGNhbiBiZSB1c2VkIGZvciBzZW5kaW5nIGFuZCByZWNlaXZpbmcgZGF0YS5cbiAgICAgICAgLy8gU28gZWl0aGVyIGNoYW5uZWwgb3BlbmVkIGJ5IHRoZSBicmlkZ2Ugb3IgdGhlIG9uZSBvcGVuZWQgaGVyZSBpcyBlbm91Z2hcbiAgICAgICAgLy8gZm9yIGNvbW11bmljYXRpb24gd2l0aCB0aGUgYnJpZGdlLlxuICAgICAgICAvKnZhciBkYXRhQ2hhbm5lbE9wdGlvbnMgPVxuICAgICAgICAge1xuICAgICAgICAgcmVsaWFibGU6IHRydWVcbiAgICAgICAgIH07XG4gICAgICAgICB2YXIgZGF0YUNoYW5uZWxcbiAgICAgICAgID0gcGVlckNvbm5lY3Rpb24uY3JlYXRlRGF0YUNoYW5uZWwoXCJteUNoYW5uZWxcIiwgZGF0YUNoYW5uZWxPcHRpb25zKTtcblxuICAgICAgICAgLy8gQ2FuIGJlIHVzZWQgb25seSB3aGVuIGlzIGluIG9wZW4gc3RhdGVcbiAgICAgICAgIGRhdGFDaGFubmVsLm9ub3BlbiA9IGZ1bmN0aW9uICgpXG4gICAgICAgICB7XG4gICAgICAgICBkYXRhQ2hhbm5lbC5zZW5kKFwiTXkgY2hhbm5lbCAhISFcIik7XG4gICAgICAgICB9O1xuICAgICAgICAgZGF0YUNoYW5uZWwub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KVxuICAgICAgICAge1xuICAgICAgICAgdmFyIG1zZ0RhdGEgPSBldmVudC5kYXRhO1xuICAgICAgICAgY29uc29sZS5pbmZvKFwiR290IE15IERhdGEgQ2hhbm5lbCBNZXNzYWdlOlwiLCBtc2dEYXRhLCBkYXRhQ2hhbm5lbCk7XG4gICAgICAgICB9OyovXG4gICAgfVxuXG59XG5cbmZ1bmN0aW9uIG9uU2VsZWN0ZWRFbmRwb2ludENoYW5nZWQodXNlckppZClcbntcbiAgICBjb25zb2xlLmxvZygnc2VsZWN0ZWQgZW5kcG9pbnQgY2hhbmdlZDogJywgdXNlckppZCk7XG4gICAgaWYgKF9kYXRhQ2hhbm5lbHMgJiYgX2RhdGFDaGFubmVscy5sZW5ndGggIT0gMClcbiAgICB7XG4gICAgICAgIF9kYXRhQ2hhbm5lbHMuc29tZShmdW5jdGlvbiAoZGF0YUNoYW5uZWwpIHtcbiAgICAgICAgICAgIGlmIChkYXRhQ2hhbm5lbC5yZWFkeVN0YXRlID09ICdvcGVuJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkYXRhQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbGlicmlDbGFzcyc6ICdTZWxlY3RlZEVuZHBvaW50Q2hhbmdlZEV2ZW50JyxcbiAgICAgICAgICAgICAgICAgICAgJ3NlbGVjdGVkRW5kcG9pbnQnOiAoIXVzZXJKaWQgfHwgdXNlckppZCA9PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBudWxsIDogdXNlckppZFxuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiQoZG9jdW1lbnQpLmJpbmQoXCJzZWxlY3RlZGVuZHBvaW50Y2hhbmdlZFwiLCBmdW5jdGlvbihldmVudCwgdXNlckppZCkge1xuICAgIG9uU2VsZWN0ZWRFbmRwb2ludENoYW5nZWQodXNlckppZCk7XG59KTtcblxuZnVuY3Rpb24gb25QaW5uZWRFbmRwb2ludENoYW5nZWQodXNlckppZClcbntcbiAgICBjb25zb2xlLmxvZygncGlubmVkIGVuZHBvaW50IGNoYW5nZWQ6ICcsIHVzZXJKaWQpO1xuICAgIGlmIChfZGF0YUNoYW5uZWxzICYmIF9kYXRhQ2hhbm5lbHMubGVuZ3RoICE9IDApXG4gICAge1xuICAgICAgICBfZGF0YUNoYW5uZWxzLnNvbWUoZnVuY3Rpb24gKGRhdGFDaGFubmVsKSB7XG4gICAgICAgICAgICBpZiAoZGF0YUNoYW5uZWwucmVhZHlTdGF0ZSA9PSAnb3BlbicpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZGF0YUNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgICAgICAgICdjb2xpYnJpQ2xhc3MnOiAnUGlubmVkRW5kcG9pbnRDaGFuZ2VkRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAncGlubmVkRW5kcG9pbnQnOiAoIXVzZXJKaWQgfHwgdXNlckppZCA9PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgPyBudWxsIDogU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQodXNlckppZClcbiAgICAgICAgICAgICAgICB9KSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxufVxuXG4kKGRvY3VtZW50KS5iaW5kKFwicGlubmVkZW5kcG9pbnRjaGFuZ2VkXCIsIGZ1bmN0aW9uKGV2ZW50LCB1c2VySmlkKSB7XG4gICAgb25QaW5uZWRFbmRwb2ludENoYW5nZWQodXNlckppZCk7XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBEYXRhQ2hhbm5lbHM7XG5cbiIsIi8vdmFyIFN0cmVhbUV2ZW50VHlwZXMgPSByZXF1aXJlKFwiLi4vLi4vc2VydmljZS9SVEMvU3RyZWFtRXZlbnRUeXBlcy5qc1wiKTtcblxuZnVuY3Rpb24gTG9jYWxTdHJlYW0oc3RyZWFtLCB0eXBlLCBldmVudEVtaXR0ZXIpXG57XG4gICAgdGhpcy5zdHJlYW0gPSBzdHJlYW07XG4gICAgdGhpcy5ldmVudEVtaXR0ZXIgPSBldmVudEVtaXR0ZXI7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnN0cmVhbS5vbmVuZGVkID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgc2VsZi5zdHJlYW1FbmRlZCgpO1xuICAgIH07XG59XG5cbkxvY2FsU3RyZWFtLnByb3RvdHlwZS5zdHJlYW1FbmRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmV2ZW50RW1pdHRlci5lbWl0KFN0cmVhbUV2ZW50VHlwZXMuRVZFTlRfVFlQRV9MT0NBTF9FTkRFRCwgdGhpcyk7XG59XG5cbkxvY2FsU3RyZWFtLnByb3RvdHlwZS5nZXRPcmlnaW5hbFN0cmVhbSA9IGZ1bmN0aW9uKClcbntcbiAgICByZXR1cm4gdGhpcy5zdHJlYW07XG59XG5cbkxvY2FsU3RyZWFtLnByb3RvdHlwZS5pc0F1ZGlvU3RyZWFtID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAodGhpcy5zdHJlYW0uZ2V0QXVkaW9UcmFja3MoKSAmJiB0aGlzLnN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmxlbmd0aCA+IDApO1xufVxuXG5Mb2NhbFN0cmVhbS5wcm90b3R5cGUubXV0ZSA9IGZ1bmN0aW9uKClcbntcbiAgICB2YXIgaXNtdXRlZCA9IGZhbHNlO1xuICAgIHZhciB0cmFja3MgPSBbXTtcbiAgICBpZih0aGlzLnR5cGUgPSBcImF1ZGlvXCIpXG4gICAge1xuICAgICAgICB0cmFja3MgPSB0aGlzLnN0cmVhbS5nZXRBdWRpb1RyYWNrcygpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0cmFja3MgPSB0aGlzLnN0cmVhbS5nZXRWaWRlb1RyYWNrcygpO1xuICAgIH1cblxuICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IHRyYWNrcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgIGlzbXV0ZWQgPSAhdHJhY2tzW2lkeF0uZW5hYmxlZDtcbiAgICAgICAgdHJhY2tzW2lkeF0uZW5hYmxlZCA9ICF0cmFja3NbaWR4XS5lbmFibGVkO1xuICAgIH1cbiAgICByZXR1cm4gaXNtdXRlZDtcbn1cblxuTG9jYWxTdHJlYW0ucHJvdG90eXBlLmlzTXV0ZWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRyYWNrcyA9IFtdO1xuICAgIGlmKHRoaXMudHlwZSA9IFwiYXVkaW9cIilcbiAgICB7XG4gICAgICAgIHRyYWNrcyA9IHRoaXMuc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCk7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHRyYWNrcyA9IHRoaXMuc3RyZWFtLmdldFZpZGVvVHJhY2tzKCk7XG4gICAgfVxuICAgIGZvciAodmFyIGlkeCA9IDA7IGlkeCA8IHRyYWNrcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgIGlmKHRyYWNrc1tpZHhdLmVuYWJsZWQpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IExvY2FsU3RyZWFtO1xuIiwidmFyIFJUQyA9IHJlcXVpcmUoXCIuL1JUQy5qc1wiKTtcbi8vLy9UaGVzZSBsaW5lcyBzaG91bGQgYmUgdW5jb21tZW50ZWQgd2hlbiByZXF1aXJlIHdvcmtzIGluIGFwcC5qc1xuLy92YXIgUlRDQnJvd3NlclR5cGUgPSByZXF1aXJlKFwiLi4vLi4vc2VydmljZS9SVEMvUlRDQnJvd3NlclR5cGUuanNcIik7XG4vL3ZhciBTdHJlYW1FdmVudFR5cGVzID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL1N0cmVhbUV2ZW50VHlwZXMuanNcIik7XG4vL3ZhciBNZWRpYVN0cmVhbVR5cGUgPSByZXF1aXJlKFwiLi4vLi4vc2VydmljZS9SVEMvTWVkaWFTdHJlYW1UeXBlc1wiKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgTWVkaWFTdHJlYW0gb2JqZWN0IGZvciB0aGUgZ2l2ZW4gZGF0YSwgc2Vzc2lvbiBpZCBhbmQgc3NyYy5cbiAqIEl0IGlzIGEgd3JhcHBlciBjbGFzcyBmb3IgdGhlIE1lZGlhU3RyZWFtLlxuICpcbiAqIEBwYXJhbSBkYXRhIHRoZSBkYXRhIG9iamVjdCBmcm9tIHdoaWNoIHdlIG9idGFpbiB0aGUgc3RyZWFtLFxuICogdGhlIHBlZXJqaWQsIGV0Yy5cbiAqIEBwYXJhbSBzaWQgdGhlIHNlc3Npb24gaWRcbiAqIEBwYXJhbSBzc3JjIHRoZSBzc3JjIGNvcnJlc3BvbmRpbmcgdG8gdGhpcyBNZWRpYVN0cmVhbVxuICpcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBNZWRpYVN0cmVhbShkYXRhLCBzaWQsIHNzcmMsIGV2ZW50RW1taXRlcikge1xuICAgIHRoaXMuc2lkID0gc2lkO1xuICAgIHRoaXMuc3RyZWFtID0gZGF0YS5zdHJlYW07XG4gICAgdGhpcy5wZWVyamlkID0gZGF0YS5wZWVyamlkO1xuICAgIHRoaXMuc3NyYyA9IHNzcmM7XG4gICAgdGhpcy50eXBlID0gKHRoaXMuc3RyZWFtLmdldFZpZGVvVHJhY2tzKCkubGVuZ3RoID4gMCk/XG4gICAgICAgIE1lZGlhU3RyZWFtVHlwZS5WSURFT19UWVBFIDogTWVkaWFTdHJlYW1UeXBlLkFVRElPX1RZUEU7XG4gICAgdGhpcy5tdXRlZCA9IGZhbHNlO1xuICAgIGV2ZW50RW1taXRlci5lbWl0KFN0cmVhbUV2ZW50VHlwZXMuRVZFTlRfVFlQRV9SRU1PVEVfQ1JFQVRFRCwgdGhpcyk7XG59XG5cbmlmKFJUQy5nZXRCcm93c2VyVHlwZSgpID09IFJUQ0Jyb3dzZXJUeXBlLlJUQ19CUk9XU0VSX0ZJUkVGT1gpXG57XG4gICAgaWYgKCFNZWRpYVN0cmVhbS5wcm90b3R5cGUuZ2V0VmlkZW9UcmFja3MpXG4gICAgICAgIE1lZGlhU3RyZWFtLnByb3RvdHlwZS5nZXRWaWRlb1RyYWNrcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIFtdOyB9O1xuICAgIGlmICghTWVkaWFTdHJlYW0ucHJvdG90eXBlLmdldEF1ZGlvVHJhY2tzKVxuICAgICAgICBNZWRpYVN0cmVhbS5wcm90b3R5cGUuZ2V0QXVkaW9UcmFja3MgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBbXTsgfTtcbn1cblxuTWVkaWFTdHJlYW0ucHJvdG90eXBlLmdldE9yaWdpbmFsU3RyZWFtID0gZnVuY3Rpb24oKVxue1xuICAgIHJldHVybiB0aGlzLnN0cmVhbTtcbn1cblxuTWVkaWFTdHJlYW0ucHJvdG90eXBlLnNldE11dGUgPSBmdW5jdGlvbiAodmFsdWUpXG57XG4gICAgdGhpcy5zdHJlYW0ubXV0ZWQgPSB2YWx1ZTtcbiAgICB0aGlzLm11dGVkID0gdmFsdWU7XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBNZWRpYVN0cmVhbTtcbiIsInZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpO1xudmFyIFJUQ1V0aWxzID0gcmVxdWlyZShcIi4vUlRDVXRpbHMuanNcIik7XG4vL1RoZXNlIGxpbmVzIHNob3VsZCBiZSB1bmNvbW1lbnRlZCB3aGVuIHJlcXVpcmUgd29ya3MgaW4gYXBwLmpzXG4vL3ZhciBTdHJlYW1FdmVudFR5cGVzID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL1N0cmVhbUV2ZW50VHlwZXMuanNcIik7XG4vL3ZhciBYTVBQRXZlbnRzID0gcmVxdWlyZShcIi4uL3NlcnZpY2UveG1wcC9YTVBQRXZlbnRzXCIpO1xuXG52YXIgZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG52YXIgUlRDID0ge1xuICAgIHJ0Y1V0aWxzOiBudWxsLFxuICAgIGxvY2FsU3RyZWFtczogW10sXG4gICAgcmVtb3RlU3RyZWFtczoge30sXG4gICAgbG9jYWxBdWRpbzogbnVsbCxcbiAgICBsb2NhbFZpZGVvOiBudWxsLFxuICAgIGFkZFN0cmVhbUxpc3RlbmVyOiBmdW5jdGlvbiAobGlzdGVuZXIsIGV2ZW50VHlwZSkge1xuICAgICAgICBldmVudEVtaXR0ZXIub24oZXZlbnRUeXBlLCBsaXN0ZW5lcik7XG4gICAgfSxcbiAgICByZW1vdmVTdHJlYW1MaXN0ZW5lcjogZnVuY3Rpb24gKGxpc3RlbmVyLCBldmVudFR5cGUpIHtcbiAgICAgICAgaWYoIShldmVudFR5cGUgaW5zdGFuY2VvZiBTdHJlYW1FdmVudFR5cGVzKSlcbiAgICAgICAgICAgIHRocm93IFwiSWxsZWdhbCBhcmd1bWVudFwiO1xuXG4gICAgICAgIGV2ZW50RW1pdHRlci5yZW1vdmVMaXN0ZW5lcihldmVudFR5cGUsIGxpc3RlbmVyKTtcbiAgICB9LFxuICAgIGNyZWF0ZUxvY2FsU3RyZWFtOiBmdW5jdGlvbiAoc3RyZWFtLCB0eXBlKSB7XG4gICAgICAgIHZhciBMb2NhbFN0cmVhbSA9IHJlcXVpcmUoXCIuL0xvY2FsU3RyZWFtLmpzXCIpO1xuICAgICAgICB2YXIgbG9jYWxTdHJlYW0gPSAgbmV3IExvY2FsU3RyZWFtKHN0cmVhbSwgdHlwZSwgZXZlbnRFbWl0dGVyKTtcbiAgICAgICAgdGhpcy5sb2NhbFN0cmVhbXMucHVzaChsb2NhbFN0cmVhbSk7XG4gICAgICAgIGlmKHR5cGUgPT0gXCJhdWRpb1wiKVxuICAgICAgICB7XG4gICAgICAgICAgICB0aGlzLmxvY2FsQXVkaW8gPSBsb2NhbFN0cmVhbTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubG9jYWxWaWRlbyA9IGxvY2FsU3RyZWFtO1xuICAgICAgICB9XG4gICAgICAgIGV2ZW50RW1pdHRlci5lbWl0KFN0cmVhbUV2ZW50VHlwZXMuRVZFTlRfVFlQRV9MT0NBTF9DUkVBVEVELFxuICAgICAgICAgICAgbG9jYWxTdHJlYW0pO1xuICAgICAgICByZXR1cm4gbG9jYWxTdHJlYW07XG4gICAgfSxcbiAgICByZW1vdmVMb2NhbFN0cmVhbTogZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5sb2NhbFN0cmVhbXMubGVuZ3RoOyBpKyspXG4gICAgICAgIHtcbiAgICAgICAgICAgIGlmKHRoaXMubG9jYWxTdHJlYW1zW2ldLmdldE9yaWdpbmFsU3RyZWFtKCkgPT09IHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmxvY2FsU3RyZWFtc1tpXTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNyZWF0ZVJlbW90ZVN0cmVhbTogZnVuY3Rpb24gKGRhdGEsIHNpZCwgdGhlc3NyYykge1xuICAgICAgICB2YXIgTWVkaWFTdHJlYW0gPSByZXF1aXJlKFwiLi9NZWRpYVN0cmVhbS5qc1wiKVxuICAgICAgICB2YXIgcmVtb3RlU3RyZWFtID0gbmV3IE1lZGlhU3RyZWFtKGRhdGEsIHNpZCwgdGhlc3NyYywgZXZlbnRFbWl0dGVyKTtcbiAgICAgICAgdmFyIGppZCA9IGRhdGEucGVlcmppZCB8fCBjb25uZWN0aW9uLmVtdWMubXlyb29tamlkO1xuICAgICAgICBpZighdGhpcy5yZW1vdGVTdHJlYW1zW2ppZF0pIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU3RyZWFtc1tqaWRdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZW1vdGVTdHJlYW1zW2ppZF1bcmVtb3RlU3RyZWFtLnR5cGVdPSByZW1vdGVTdHJlYW07XG4gICAgICAgIHJldHVybiByZW1vdGVTdHJlYW07XG4gICAgfSxcbiAgICBnZXRCcm93c2VyVHlwZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydGNVdGlscy5icm93c2VyO1xuICAgIH0sXG4gICAgZ2V0UENDb25zdHJhaW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydGNVdGlscy5wY19jb25zdHJhaW50cztcbiAgICB9LFxuICAgIGdldFVzZXJNZWRpYVdpdGhDb25zdHJhaW50czpmdW5jdGlvbih1bSwgc3VjY2Vzc19jYWxsYmFjayxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZmFpbHVyZV9jYWxsYmFjaywgcmVzb2x1dGlvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFuZHdpZHRoLCBmcHMsIGRlc2t0b3BTdHJlYW0pXG4gICAge1xuICAgICAgICByZXR1cm4gdGhpcy5ydGNVdGlscy5nZXRVc2VyTWVkaWFXaXRoQ29uc3RyYWludHModW0sIHN1Y2Nlc3NfY2FsbGJhY2ssXG4gICAgICAgICAgICBmYWlsdXJlX2NhbGxiYWNrLCByZXNvbHV0aW9uLCBiYW5kd2lkdGgsIGZwcywgZGVza3RvcFN0cmVhbSk7XG4gICAgfSxcbiAgICBhdHRhY2hNZWRpYVN0cmVhbTogIGZ1bmN0aW9uIChlbGVtZW50LCBzdHJlYW0pIHtcbiAgICAgICAgdGhpcy5ydGNVdGlscy5hdHRhY2hNZWRpYVN0cmVhbShlbGVtZW50LCBzdHJlYW0pO1xuICAgIH0sXG4gICAgZ2V0U3RyZWFtSUQ6ICBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ0Y1V0aWxzLmdldFN0cmVhbUlEKHN0cmVhbSk7XG4gICAgfSxcbiAgICBnZXRWaWRlb1NyYzogZnVuY3Rpb24gKGVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnRjVXRpbHMuZ2V0VmlkZW9TcmMoZWxlbWVudCk7XG4gICAgfSxcbiAgICBzZXRWaWRlb1NyYzogZnVuY3Rpb24gKGVsZW1lbnQsIHNyYykge1xuICAgICAgICB0aGlzLnJ0Y1V0aWxzLnNldFZpZGVvU3JjKGVsZW1lbnQsIHNyYyk7XG4gICAgfSxcbiAgICBkaXNwb3NlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHRoaXMucnRjVXRpbHMpIHtcbiAgICAgICAgICAgIHRoaXMucnRjVXRpbHMgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzdG9wOiAgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICB9LFxuICAgIHN0YXJ0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucnRjVXRpbHMgPSBuZXcgUlRDVXRpbHModGhpcyk7XG4gICAgICAgIHRoaXMucnRjVXRpbHMub2J0YWluQXVkaW9BbmRWaWRlb1Blcm1pc3Npb25zKCk7XG4gICAgfSxcbiAgICBvbkNvbmZlcmVuY2VDcmVhdGVkOiBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgRGF0YUNoYW5uZWxzID0gcmVxdWlyZShcIi4vRGF0YUNoYW5uZWxzXCIpO1xuICAgICAgICBEYXRhQ2hhbm5lbHMuYmluZERhdGFDaGFubmVsTGlzdGVuZXIoZXZlbnQucGVlcmNvbm5lY3Rpb24pO1xuICAgIH0sXG4gICAgbXV0ZVJlbW90ZVZpZGVvU3RyZWFtOiBmdW5jdGlvbiAoamlkLCB2YWx1ZSkge1xuICAgICAgICB2YXIgc3RyZWFtO1xuXG4gICAgICAgIGlmKHRoaXMucmVtb3RlU3RyZWFtc1tqaWRdICYmXG4gICAgICAgICAgICB0aGlzLnJlbW90ZVN0cmVhbXNbamlkXVtNZWRpYVN0cmVhbVR5cGUuVklERU9fVFlQRV0pXG4gICAgICAgIHtcbiAgICAgICAgICAgIHN0cmVhbSA9IHRoaXMucmVtb3RlU3RyZWFtc1tqaWRdW01lZGlhU3RyZWFtVHlwZS5WSURFT19UWVBFXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCFzdHJlYW0pXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgdmFyIGlzTXV0ZWQgPSAodmFsdWUgPT09IFwidHJ1ZVwiKTtcbiAgICAgICAgaWYgKGlzTXV0ZWQgIT0gc3RyZWFtLm11dGVkKSB7XG4gICAgICAgICAgICBzdHJlYW0uc2V0TXV0ZShpc011dGVkKTtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gUlRDO1xuIiwiLy9UaGlzIHNob3VsZCBiZSB1bmNvbW1lbnRlZCB3aGVuIGFwcC5qcyBzdXBwb3J0cyByZXF1aXJlXG4vL3ZhciBSVENCcm93c2VyVHlwZSA9IHJlcXVpcmUoXCIuLi8uLi9zZXJ2aWNlL1JUQy9SVENCcm93c2VyVHlwZS5qc1wiKTtcblxudmFyIGNvbnN0cmFpbnRzID0ge2F1ZGlvOiBmYWxzZSwgdmlkZW86IGZhbHNlfTtcblxuZnVuY3Rpb24gc2V0UmVzb2x1dGlvbkNvbnN0cmFpbnRzKHJlc29sdXRpb24sIGlzQW5kcm9pZClcbntcbiAgICBpZiAocmVzb2x1dGlvbiAmJiAhY29uc3RyYWludHMudmlkZW8gfHwgaXNBbmRyb2lkKSB7XG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvID0geyBtYW5kYXRvcnk6IHt9LCBvcHRpb25hbDogW10gfTsvLyBzYW1lIGJlaGF2aW91ciBhcyB0cnVlXG4gICAgfVxuICAgIC8vIHNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MTQzNjMxI2M5IGZvciBsaXN0IG9mIHN1cHBvcnRlZCByZXNvbHV0aW9uc1xuICAgIHN3aXRjaCAocmVzb2x1dGlvbikge1xuICAgICAgICAvLyAxNjo5IGZpcnN0XG4gICAgICAgIGNhc2UgJzEwODAnOlxuICAgICAgICBjYXNlICdmdWxsaGQnOlxuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoID0gMTkyMDtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQgPSAxMDgwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzcyMCc6XG4gICAgICAgIGNhc2UgJ2hkJzpcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aCA9IDEyODA7XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0ID0gNzIwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzM2MCc6XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGggPSA2NDA7XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0ID0gMzYwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzE4MCc6XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGggPSAzMjA7XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0ID0gMTgwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIC8vIDQ6M1xuICAgICAgICBjYXNlICc5NjAnOlxuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoID0gOTYwO1xuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodCA9IDcyMDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICc2NDAnOlxuICAgICAgICBjYXNlICd2Z2EnOlxuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoID0gNjQwO1xuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodCA9IDQ4MDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICczMjAnOlxuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoID0gMzIwO1xuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodCA9IDI0MDtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgaWYgKGlzQW5kcm9pZCkge1xuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aCA9IDMyMDtcbiAgICAgICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0ID0gMjQwO1xuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5tYXhGcmFtZVJhdGUgPSAxNTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBpZiAoY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoKVxuICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWF4V2lkdGggPSBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGg7XG4gICAgaWYgKGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQpXG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5tYXhIZWlnaHQgPSBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0O1xufVxuXG5cbmZ1bmN0aW9uIHNldENvbnN0cmFpbnRzKHVtLCByZXNvbHV0aW9uLCBiYW5kd2lkdGgsIGZwcywgZGVza3RvcFN0cmVhbSwgaXNBbmRyb2lkKVxue1xuICAgIGlmICh1bS5pbmRleE9mKCd2aWRlbycpID49IDApIHtcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8gPSB7IG1hbmRhdG9yeToge30sIG9wdGlvbmFsOiBbXSB9Oy8vIHNhbWUgYmVoYXZpb3VyIGFzIHRydWVcbiAgICB9XG4gICAgaWYgKHVtLmluZGV4T2YoJ2F1ZGlvJykgPj0gMCkge1xuICAgICAgICBjb25zdHJhaW50cy5hdWRpbyA9IHsgbWFuZGF0b3J5OiB7fSwgb3B0aW9uYWw6IFtdfTsvLyBzYW1lIGJlaGF2aW91ciBhcyB0cnVlXG4gICAgfVxuICAgIGlmICh1bS5pbmRleE9mKCdzY3JlZW4nKSA+PSAwKSB7XG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvID0ge1xuICAgICAgICAgICAgbWFuZGF0b3J5OiB7XG4gICAgICAgICAgICAgICAgY2hyb21lTWVkaWFTb3VyY2U6IFwic2NyZWVuXCIsXG4gICAgICAgICAgICAgICAgZ29vZ0xlYWt5QnVja2V0OiB0cnVlLFxuICAgICAgICAgICAgICAgIG1heFdpZHRoOiB3aW5kb3cuc2NyZWVuLndpZHRoLFxuICAgICAgICAgICAgICAgIG1heEhlaWdodDogd2luZG93LnNjcmVlbi5oZWlnaHQsXG4gICAgICAgICAgICAgICAgbWF4RnJhbWVSYXRlOiAzXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3B0aW9uYWw6IFtdXG4gICAgICAgIH07XG4gICAgfVxuICAgIGlmICh1bS5pbmRleE9mKCdkZXNrdG9wJykgPj0gMCkge1xuICAgICAgICBjb25zdHJhaW50cy52aWRlbyA9IHtcbiAgICAgICAgICAgIG1hbmRhdG9yeToge1xuICAgICAgICAgICAgICAgIGNocm9tZU1lZGlhU291cmNlOiBcImRlc2t0b3BcIixcbiAgICAgICAgICAgICAgICBjaHJvbWVNZWRpYVNvdXJjZUlkOiBkZXNrdG9wU3RyZWFtLFxuICAgICAgICAgICAgICAgIGdvb2dMZWFreUJ1Y2tldDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBtYXhXaWR0aDogd2luZG93LnNjcmVlbi53aWR0aCxcbiAgICAgICAgICAgICAgICBtYXhIZWlnaHQ6IHdpbmRvdy5zY3JlZW4uaGVpZ2h0LFxuICAgICAgICAgICAgICAgIG1heEZyYW1lUmF0ZTogM1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9wdGlvbmFsOiBbXVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIGlmIChjb25zdHJhaW50cy5hdWRpbykge1xuICAgICAgICAvLyBpZiBpdCBpcyBnb29kIGVub3VnaCBmb3IgaGFuZ291dHMuLi5cbiAgICAgICAgY29uc3RyYWludHMuYXVkaW8ub3B0aW9uYWwucHVzaChcbiAgICAgICAgICAgIHtnb29nRWNob0NhbmNlbGxhdGlvbjogdHJ1ZX0sXG4gICAgICAgICAgICB7Z29vZ0F1dG9HYWluQ29udHJvbDogdHJ1ZX0sXG4gICAgICAgICAgICB7Z29vZ05vaXNlU3VwcmVzc2lvbjogdHJ1ZX0sXG4gICAgICAgICAgICB7Z29vZ0hpZ2hwYXNzRmlsdGVyOiB0cnVlfSxcbiAgICAgICAgICAgIHtnb29nTm9pc2VzdXBwcmVzc2lvbjI6IHRydWV9LFxuICAgICAgICAgICAge2dvb2dFY2hvQ2FuY2VsbGF0aW9uMjogdHJ1ZX0sXG4gICAgICAgICAgICB7Z29vZ0F1dG9HYWluQ29udHJvbDI6IHRydWV9XG4gICAgICAgICk7XG4gICAgfVxuICAgIGlmIChjb25zdHJhaW50cy52aWRlbykge1xuICAgICAgICBjb25zdHJhaW50cy52aWRlby5vcHRpb25hbC5wdXNoKFxuICAgICAgICAgICAge2dvb2dOb2lzZVJlZHVjdGlvbjogZmFsc2V9IC8vIGNocm9tZSAzNyB3b3JrYXJvdW5kIGZvciBpc3N1ZSAzODA3LCByZWVuYWJsZSBpbiBNMzhcbiAgICAgICAgKTtcbiAgICAgICAgaWYgKHVtLmluZGV4T2YoJ3ZpZGVvJykgPj0gMCkge1xuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ub3B0aW9uYWwucHVzaChcbiAgICAgICAgICAgICAgICB7Z29vZ0xlYWt5QnVja2V0OiB0cnVlfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNldFJlc29sdXRpb25Db25zdHJhaW50cyhyZXNvbHV0aW9uLCBpc0FuZHJvaWQpO1xuXG4gICAgaWYgKGJhbmR3aWR0aCkgeyAvLyBkb2Vzbid0IHdvcmsgY3VycmVudGx5LCBzZWUgd2VicnRjIGlzc3VlIDE4NDZcbiAgICAgICAgaWYgKCFjb25zdHJhaW50cy52aWRlbykgY29uc3RyYWludHMudmlkZW8gPSB7bWFuZGF0b3J5OiB7fSwgb3B0aW9uYWw6IFtdfTsvL3NhbWUgYmVoYXZpb3VyIGFzIHRydWVcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8ub3B0aW9uYWwucHVzaCh7YmFuZHdpZHRoOiBiYW5kd2lkdGh9KTtcbiAgICB9XG4gICAgaWYgKGZwcykgeyAvLyBmb3Igc29tZSBjYW1lcmFzIGl0IG1pZ2h0IGJlIG5lY2Vzc2FyeSB0byByZXF1ZXN0IDMwZnBzXG4gICAgICAgIC8vIHNvIHRoZXkgY2hvb3NlIDMwZnBzIG1qcGcgb3ZlciAxMGZwcyB5dXkyXG4gICAgICAgIGlmICghY29uc3RyYWludHMudmlkZW8pIGNvbnN0cmFpbnRzLnZpZGVvID0ge21hbmRhdG9yeToge30sIG9wdGlvbmFsOiBbXX07Ly8gc2FtZSBiZWhhdmlvdXIgYXMgdHJ1ZTtcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkZyYW1lUmF0ZSA9IGZwcztcbiAgICB9XG59XG5cblxuZnVuY3Rpb24gUlRDVXRpbHMoUlRDU2VydmljZSlcbntcbiAgICB0aGlzLnNlcnZpY2UgPSBSVENTZXJ2aWNlO1xuICAgIGlmIChuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdUaGlzIGFwcGVhcnMgdG8gYmUgRmlyZWZveCcpO1xuICAgICAgICB2YXIgdmVyc2lvbiA9IHBhcnNlSW50KG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0ZpcmVmb3hcXC8oWzAtOV0rKVxcLi8pWzFdLCAxMCk7XG4gICAgICAgIGlmICh2ZXJzaW9uID49IDIyKSB7XG4gICAgICAgICAgICB0aGlzLnBlZXJjb25uZWN0aW9uID0gbW96UlRDUGVlckNvbm5lY3Rpb247XG4gICAgICAgICAgICB0aGlzLmJyb3dzZXIgPSBSVENCcm93c2VyVHlwZS5SVENfQlJPV1NFUl9GSVJFRk9YO1xuICAgICAgICAgICAgdGhpcy5nZXRVc2VyTWVkaWEgPSBuYXZpZ2F0b3IubW96R2V0VXNlck1lZGlhLmJpbmQobmF2aWdhdG9yKTtcbiAgICAgICAgICAgIHRoaXMucGNfY29uc3RyYWludHMgPSB7fTtcbiAgICAgICAgICAgIHRoaXMuYXR0YWNoTWVkaWFTdHJlYW0gPSAgZnVuY3Rpb24gKGVsZW1lbnQsIHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIGVsZW1lbnRbMF0ubW96U3JjT2JqZWN0ID0gc3RyZWFtO1xuICAgICAgICAgICAgICAgIGVsZW1lbnRbMF0ucGxheSgpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuZ2V0U3RyZWFtSUQgPSAgZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgIHZhciB0cmFja3MgPSBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcbiAgICAgICAgICAgICAgICBpZighdHJhY2tzIHx8IHRyYWNrcy5sZW5ndGggPT0gMClcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNrcyA9IHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gdHJhY2tzWzBdLmlkLnJlcGxhY2UoL1tcXHssXFx9XS9nLFwiXCIpO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuZ2V0VmlkZW9TcmMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50Lm1velNyY09iamVjdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLnNldFZpZGVvU3JjID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNyYykge1xuICAgICAgICAgICAgICAgIGVsZW1lbnQubW96U3JjT2JqZWN0ID0gc3JjO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiA9IG1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbjtcbiAgICAgICAgICAgIFJUQ0ljZUNhbmRpZGF0ZSA9IG1velJUQ0ljZUNhbmRpZGF0ZTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAobmF2aWdhdG9yLndlYmtpdEdldFVzZXJNZWRpYSkge1xuICAgICAgICBjb25zb2xlLmxvZygnVGhpcyBhcHBlYXJzIHRvIGJlIENocm9tZScpO1xuICAgICAgICB0aGlzLnBlZXJjb25uZWN0aW9uID0gd2Via2l0UlRDUGVlckNvbm5lY3Rpb247XG4gICAgICAgIHRoaXMuYnJvd3NlciA9IFJUQ0Jyb3dzZXJUeXBlLlJUQ19CUk9XU0VSX0NIUk9NRTtcbiAgICAgICAgdGhpcy5nZXRVc2VyTWVkaWEgPSBuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhLmJpbmQobmF2aWdhdG9yKTtcbiAgICAgICAgdGhpcy5hdHRhY2hNZWRpYVN0cmVhbSA9IGZ1bmN0aW9uIChlbGVtZW50LCBzdHJlYW0pIHtcbiAgICAgICAgICAgIGVsZW1lbnQuYXR0cignc3JjJywgd2Via2l0VVJMLmNyZWF0ZU9iamVjdFVSTChzdHJlYW0pKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRTdHJlYW1JRCA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgIC8vIHN0cmVhbXMgZnJvbSBGRiBlbmRwb2ludHMgaGF2ZSB0aGUgY2hhcmFjdGVycyAneycgYW5kICd9J1xuICAgICAgICAgICAgLy8gdGhhdCBtYWtlIGpRdWVyeSBjaG9rZS5cbiAgICAgICAgICAgIHJldHVybiBzdHJlYW0uaWQucmVwbGFjZSgvW1xceyxcXH1dL2csXCJcIik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuZ2V0VmlkZW9TcmMgPSBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQuZ2V0QXR0cmlidXRlKFwic3JjXCIpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLnNldFZpZGVvU3JjID0gZnVuY3Rpb24gKGVsZW1lbnQsIHNyYykge1xuICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoXCJzcmNcIiwgc3JjKTtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gRFRMUyBzaG91bGQgbm93IGJlIGVuYWJsZWQgYnkgZGVmYXVsdCBidXQuLlxuICAgICAgICB0aGlzLnBjX2NvbnN0cmFpbnRzID0geydvcHRpb25hbCc6IFt7J0R0bHNTcnRwS2V5QWdyZWVtZW50JzogJ3RydWUnfV19O1xuICAgICAgICBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdBbmRyb2lkJykgIT0gLTEpIHtcbiAgICAgICAgICAgIHRoaXMucGNfY29uc3RyYWludHMgPSB7fTsgLy8gZGlzYWJsZSBEVExTIG9uIEFuZHJvaWRcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdlYmtpdE1lZGlhU3RyZWFtLnByb3RvdHlwZS5nZXRWaWRlb1RyYWNrcykge1xuICAgICAgICAgICAgd2Via2l0TWVkaWFTdHJlYW0ucHJvdG90eXBlLmdldFZpZGVvVHJhY2tzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnZpZGVvVHJhY2tzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdlYmtpdE1lZGlhU3RyZWFtLnByb3RvdHlwZS5nZXRBdWRpb1RyYWNrcykge1xuICAgICAgICAgICAgd2Via2l0TWVkaWFTdHJlYW0ucHJvdG90eXBlLmdldEF1ZGlvVHJhY2tzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmF1ZGlvVHJhY2tzO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICB0cnkgeyBjb25zb2xlLmxvZygnQnJvd3NlciBkb2VzIG5vdCBhcHBlYXIgdG8gYmUgV2ViUlRDLWNhcGFibGUnKTsgfSBjYXRjaCAoZSkgeyB9XG5cbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnd2VicnRjcmVxdWlyZWQuaHRtbCc7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5icm93c2VyICE9PSBSVENCcm93c2VyVHlwZS5SVENfQlJPV1NFUl9DSFJPTUUgJiZcbiAgICAgICAgY29uZmlnLmVuYWJsZUZpcmVmb3hTdXBwb3J0ICE9PSB0cnVlKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gJ2Nocm9tZW9ubHkuaHRtbCc7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbn1cblxuXG5SVENVdGlscy5wcm90b3R5cGUuZ2V0VXNlck1lZGlhV2l0aENvbnN0cmFpbnRzID0gZnVuY3Rpb24oXG4gICAgdW0sIHN1Y2Nlc3NfY2FsbGJhY2ssIGZhaWx1cmVfY2FsbGJhY2ssIHJlc29sdXRpb24sYmFuZHdpZHRoLCBmcHMsXG4gICAgZGVza3RvcFN0cmVhbSlcbntcbiAgICAvLyBDaGVjayBpZiB3ZSBhcmUgcnVubmluZyBvbiBBbmRyb2lkIGRldmljZVxuICAgIHZhciBpc0FuZHJvaWQgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSAhPSAtMTtcblxuICAgIHNldENvbnN0cmFpbnRzKHVtLCByZXNvbHV0aW9uLCBiYW5kd2lkdGgsIGZwcywgZGVza3RvcFN0cmVhbSwgaXNBbmRyb2lkKTtcblxuICAgIHZhciBpc0ZGID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xO1xuXG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKGNvbmZpZy5lbmFibGVTaW11bGNhc3RcbiAgICAgICAgICAgICYmIGNvbnN0cmFpbnRzLnZpZGVvXG4gICAgICAgICAgICAmJiBjb25zdHJhaW50cy52aWRlby5jaHJvbWVNZWRpYVNvdXJjZSAhPT0gJ3NjcmVlbidcbiAgICAgICAgICAgICYmIGNvbnN0cmFpbnRzLnZpZGVvLmNocm9tZU1lZGlhU291cmNlICE9PSAnZGVza3RvcCdcbiAgICAgICAgICAgICYmICFpc0FuZHJvaWRcblxuICAgICAgICAgICAgLy8gV2UgY3VycmVudGx5IGRvIG5vdCBzdXBwb3J0IEZGLCBhcyBpdCBkb2Vzbid0IGhhdmUgbXVsdGlzdHJlYW0gc3VwcG9ydC5cbiAgICAgICAgICAgICYmICFpc0ZGKSB7XG4gICAgICAgICAgICBzaW11bGNhc3QuZ2V0VXNlck1lZGlhKGNvbnN0cmFpbnRzLCBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvblVzZXJNZWRpYVN1Y2Nlc3MnKTtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc19jYWxsYmFjayhzdHJlYW0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGdldCBhY2Nlc3MgdG8gbG9jYWwgbWVkaWEuIEVycm9yICcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZhaWx1cmVfY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhaWx1cmVfY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG5cbiAgICAgICAgICAgIFJUQ1V0aWxzLmdldFVzZXJNZWRpYShjb25zdHJhaW50cyxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvblVzZXJNZWRpYVN1Y2Nlc3MnKTtcbiAgICAgICAgICAgICAgICAgICAgc3VjY2Vzc19jYWxsYmFjayhzdHJlYW0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignRmFpbGVkIHRvIGdldCBhY2Nlc3MgdG8gbG9jYWwgbWVkaWEuIEVycm9yICcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZhaWx1cmVfY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZhaWx1cmVfY2FsbGJhY2soZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignR1VNIGZhaWxlZDogJywgZSk7XG4gICAgICAgIGlmKGZhaWx1cmVfY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGZhaWx1cmVfY2FsbGJhY2soZSk7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG4vKipcbiAqIFdlIGFzayBmb3IgYXVkaW8gYW5kIHZpZGVvIGNvbWJpbmVkIHN0cmVhbSBpbiBvcmRlciB0byBnZXQgcGVybWlzc2lvbnMgYW5kXG4gKiBub3QgdG8gYXNrIHR3aWNlLlxuICovXG5SVENVdGlscy5wcm90b3R5cGUub2J0YWluQXVkaW9BbmRWaWRlb1Blcm1pc3Npb25zID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIEdldCBBVlxuICAgIHZhciBjYiA9IGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ2dvdCcsIHN0cmVhbSwgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkubGVuZ3RoLCBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGgpO1xuICAgICAgICBzZWxmLmhhbmRsZUxvY2FsU3RyZWFtKHN0cmVhbSk7XG4gICAgICAgIHRyYWNrVXNhZ2UoJ2xvY2FsTWVkaWEnLCB7XG4gICAgICAgICAgICBhdWRpbzogc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkubGVuZ3RoLFxuICAgICAgICAgICAgdmlkZW86IHN0cmVhbS5nZXRWaWRlb1RyYWNrcygpLmxlbmd0aFxuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLmdldFVzZXJNZWRpYVdpdGhDb25zdHJhaW50cyhcbiAgICAgICAgWydhdWRpbycsICd2aWRlbyddLFxuICAgICAgICBjYixcbiAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdmYWlsZWQgdG8gb2J0YWluIGF1ZGlvL3ZpZGVvIHN0cmVhbSAtIHRyeWluZyBhdWRpbyBvbmx5JywgZXJyb3IpO1xuICAgICAgICAgICAgc2VsZi5nZXRVc2VyTWVkaWFXaXRoQ29uc3RyYWludHMoXG4gICAgICAgICAgICAgICAgWydhdWRpbyddLFxuICAgICAgICAgICAgICAgIGNiLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdmYWlsZWQgdG8gb2J0YWluIGF1ZGlvL3ZpZGVvIHN0cmVhbSAtIHN0b3AnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIHRyYWNrVXNhZ2UoJ2xvY2FsTWVkaWFFcnJvcicsIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lZGlhOiBlcnJvci5tZWRpYSB8fCAndmlkZW8nLFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA6IGVycm9yLm5hbWVcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VIYW5kbGVyLnNob3dFcnJvcihcIkVycm9yXCIsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJGYWlsZWQgdG8gb2J0YWluIHBlcm1pc3Npb25zIHRvIHVzZSB0aGUgbG9jYWwgbWljcm9waG9uZVwiICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImFuZC9vciBjYW1lcmEuXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgICAgICBjb25maWcucmVzb2x1dGlvbiB8fCAnMzYwJyk7XG59XG5cblJUQ1V0aWxzLnByb3RvdHlwZS5oYW5kbGVMb2NhbFN0cmVhbSA9IGZ1bmN0aW9uKHN0cmVhbSlcbntcbiAgICBpZih3aW5kb3cud2Via2l0TWVkaWFTdHJlYW0pXG4gICAge1xuICAgICAgICB2YXIgYXVkaW9TdHJlYW0gPSBuZXcgd2Via2l0TWVkaWFTdHJlYW0oKTtcbiAgICAgICAgdmFyIHZpZGVvU3RyZWFtID0gbmV3IHdlYmtpdE1lZGlhU3RyZWFtKCk7XG4gICAgICAgIHZhciBhdWRpb1RyYWNrcyA9IHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpO1xuICAgICAgICB2YXIgdmlkZW9UcmFja3MgPSBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhdWRpb1RyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXVkaW9TdHJlYW0uYWRkVHJhY2soYXVkaW9UcmFja3NbaV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlLmNyZWF0ZUxvY2FsU3RyZWFtKGF1ZGlvU3RyZWFtLCBcImF1ZGlvXCIpO1xuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB2aWRlb1RyYWNrcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmlkZW9TdHJlYW0uYWRkVHJhY2sodmlkZW9UcmFja3NbaV0pO1xuICAgICAgICB9XG5cblxuICAgICAgICB0aGlzLnNlcnZpY2UuY3JlYXRlTG9jYWxTdHJlYW0odmlkZW9TdHJlYW0sIFwidmlkZW9cIik7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7Ly9maXJlZm94XG4gICAgICAgIHRoaXMuc2VydmljZS5jcmVhdGVMb2NhbFN0cmVhbShzdHJlYW0sIFwic3RyZWFtXCIpO1xuICAgIH1cblxufTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gUlRDVXRpbHM7IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
