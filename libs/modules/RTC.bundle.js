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
function MediaStream(data, sid, ssrc, eventEmmiter, browser) {
    this.sid = sid;
    this.stream = data.stream;
    this.peerjid = data.peerjid;
    this.ssrc = ssrc;
    this.type = (this.stream.getVideoTracks().length > 0)?
        MediaStreamType.VIDEO_TYPE : MediaStreamType.AUDIO_TYPE;
    this.muted = false;
    eventEmmiter.emit(StreamEventTypes.EVENT_TYPE_REMOTE_CREATED, this);
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
    createLocalStream: function (stream, type) {

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
        var remoteStream = new MediaStream(data, sid, thessrc, eventEmitter,
            this.getBrowserType());
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

            this.getUserMedia(constraints,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1JUQy9EYXRhQ2hhbm5lbHMuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL1JUQy9Mb2NhbFN0cmVhbS5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMvUlRDL01lZGlhU3RyZWFtLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9SVEMvUlRDLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy9SVEMvUlRDVXRpbHMuanMiLCIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM09BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogZ2xvYmFsIGNvbm5lY3Rpb24sIFN0cm9waGUsIHVwZGF0ZUxhcmdlVmlkZW8sIGZvY3VzZWRWaWRlb1NyYyovXG5cbi8vIGNhY2hlIGRhdGFjaGFubmVscyB0byBhdm9pZCBnYXJiYWdlIGNvbGxlY3Rpb25cbi8vIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD00MDU1NDVcbnZhciBfZGF0YUNoYW5uZWxzID0gW107XG5cblxuXG52YXIgRGF0YUNoYW5uZWxzID1cbntcblxuICAgIC8qKlxuICAgICAqIENhbGxiYWNrIHRyaWdnZXJlZCBieSBQZWVyQ29ubmVjdGlvbiB3aGVuIG5ldyBkYXRhIGNoYW5uZWwgaXMgb3BlbmVkXG4gICAgICogb24gdGhlIGJyaWRnZS5cbiAgICAgKiBAcGFyYW0gZXZlbnQgdGhlIGV2ZW50IGluZm8gb2JqZWN0LlxuICAgICAqL1xuXG4gICAgb25EYXRhQ2hhbm5lbDogZnVuY3Rpb24gKGV2ZW50KVxuICAgIHtcbiAgICAgICAgdmFyIGRhdGFDaGFubmVsID0gZXZlbnQuY2hhbm5lbDtcblxuICAgICAgICBkYXRhQ2hhbm5lbC5vbm9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJEYXRhIGNoYW5uZWwgb3BlbmVkIGJ5IHRoZSBWaWRlb2JyaWRnZSFcIiwgZGF0YUNoYW5uZWwpO1xuXG4gICAgICAgICAgICAvLyBDb2RlIHNhbXBsZSBmb3Igc2VuZGluZyBzdHJpbmcgYW5kL29yIGJpbmFyeSBkYXRhXG4gICAgICAgICAgICAvLyBTZW5kcyBTdHJpbmcgbWVzc2FnZSB0byB0aGUgYnJpZGdlXG4gICAgICAgICAgICAvL2RhdGFDaGFubmVsLnNlbmQoXCJIZWxsbyBicmlkZ2UhXCIpO1xuICAgICAgICAgICAgLy8gU2VuZHMgMTIgYnl0ZXMgYmluYXJ5IG1lc3NhZ2UgdG8gdGhlIGJyaWRnZVxuICAgICAgICAgICAgLy9kYXRhQ2hhbm5lbC5zZW5kKG5ldyBBcnJheUJ1ZmZlcigxMikpO1xuXG4gICAgICAgICAgICAvLyB3aGVuIHRoZSBkYXRhIGNoYW5uZWwgYmVjb21lcyBhdmFpbGFibGUsIHRlbGwgdGhlIGJyaWRnZSBhYm91dCB2aWRlb1xuICAgICAgICAgICAgLy8gc2VsZWN0aW9ucyBzbyB0aGF0IGl0IGNhbiBkbyBhZGFwdGl2ZSBzaW11bGNhc3QsXG4gICAgICAgICAgICAvLyB3ZSB3YW50IHRoZSBub3RpZmljYXRpb24gdG8gdHJpZ2dlciBldmVuIGlmIHVzZXJKaWQgaXMgdW5kZWZpbmVkLFxuICAgICAgICAgICAgLy8gb3IgbnVsbC5cbiAgICAgICAgICAgIHZhciB1c2VySmlkID0gVUkuZ2V0TGFyZ2VWaWRlb1N0YXRlKCkudXNlckppZDtcbiAgICAgICAgICAgIC8vIHdlIHdhbnQgdGhlIG5vdGlmaWNhdGlvbiB0byB0cmlnZ2VyIGV2ZW4gaWYgdXNlckppZCBpcyB1bmRlZmluZWQsXG4gICAgICAgICAgICAvLyBvciBudWxsLlxuICAgICAgICAgICAgb25TZWxlY3RlZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKTtcbiAgICAgICAgfTtcblxuICAgICAgICBkYXRhQ2hhbm5lbC5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiRGF0YSBDaGFubmVsIEVycm9yOlwiLCBlcnJvciwgZGF0YUNoYW5uZWwpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGRhdGFDaGFubmVsLm9ubWVzc2FnZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBldmVudC5kYXRhO1xuICAgICAgICAgICAgLy8gSlNPTlxuICAgICAgICAgICAgdmFyIG9iajtcblxuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBvYmogPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgICAgICAgICAgICBcIkZhaWxlZCB0byBwYXJzZSBkYXRhIGNoYW5uZWwgbWVzc2FnZSBhcyBKU09OOiBcIixcbiAgICAgICAgICAgICAgICAgICAgZGF0YSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YUNoYW5uZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCgndW5kZWZpbmVkJyAhPT0gdHlwZW9mKG9iaikpICYmIChudWxsICE9PSBvYmopKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbGlicmlDbGFzcyA9IG9iai5jb2xpYnJpQ2xhc3M7XG5cbiAgICAgICAgICAgICAgICBpZiAoXCJEb21pbmFudFNwZWFrZXJFbmRwb2ludENoYW5nZUV2ZW50XCIgPT09IGNvbGlicmlDbGFzcykge1xuICAgICAgICAgICAgICAgICAgICAvLyBFbmRwb2ludCBJRCBmcm9tIHRoZSBWaWRlb2JyaWRnZS5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRvbWluYW50U3BlYWtlckVuZHBvaW50ID0gb2JqLmRvbWluYW50U3BlYWtlckVuZHBvaW50O1xuXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbyhcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiRGF0YSBjaGFubmVsIG5ldyBkb21pbmFudCBzcGVha2VyIGV2ZW50OiBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRvbWluYW50U3BlYWtlckVuZHBvaW50KTtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICdkb21pbmFudHNwZWFrZXJjaGFuZ2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIFtkb21pbmFudFNwZWFrZXJFbmRwb2ludF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcIkluTGFzdE5DaGFuZ2VFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkVmFsdWUgPSBvYmoub2xkVmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBuZXdWYWx1ZSA9IG9iai5uZXdWYWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgb2xkVmFsdWUgYW5kIG5ld1ZhbHVlIGFyZSBvZiB0eXBlIGJvb2xlYW4uXG4gICAgICAgICAgICAgICAgICAgIHZhciB0eXBlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICgodHlwZSA9IHR5cGVvZiBvbGRWYWx1ZSkgIT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkVmFsdWUgPSAob2xkVmFsdWUgPT0gXCJ0cnVlXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRWYWx1ZSA9IG5ldyBCb29sZWFuKG9sZFZhbHVlKS52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgaWYgKCh0eXBlID0gdHlwZW9mIG5ld1ZhbHVlKSAhPT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXdWYWx1ZSA9IChuZXdWYWx1ZSA9PSBcInRydWVcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld1ZhbHVlID0gbmV3IEJvb2xlYW4obmV3VmFsdWUpLnZhbHVlT2YoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdpbmxhc3RuY2hhbmdlZCcsIFtvbGRWYWx1ZSwgbmV3VmFsdWVdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoXCJMYXN0TkVuZHBvaW50c0NoYW5nZUV2ZW50XCIgPT09IGNvbGlicmlDbGFzcylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSBuZXcvbGF0ZXN0IGxpc3Qgb2YgbGFzdC1uIGVuZHBvaW50IElEcy5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhc3RORW5kcG9pbnRzID0gb2JqLmxhc3RORW5kcG9pbnRzO1xuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgbGlzdCBvZiBlbmRwb2ludCBJRHMgd2hpY2ggYXJlIGVudGVyaW5nIHRoZSBsaXN0IG9mXG4gICAgICAgICAgICAgICAgICAgIC8vIGxhc3QtbiBhdCB0aGlzIHRpbWUgaS5lLiB3ZXJlIG5vdCBpbiB0aGUgb2xkIGxpc3Qgb2YgbGFzdC1uXG4gICAgICAgICAgICAgICAgICAgIC8vIGVuZHBvaW50IElEcy5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGVuZHBvaW50c0VudGVyaW5nTGFzdE4gPSBvYmouZW5kcG9pbnRzRW50ZXJpbmdMYXN0TjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0cmVhbSA9IG9iai5zdHJlYW07XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkRhdGEgY2hhbm5lbCBuZXcgbGFzdC1uIGV2ZW50OiBcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RORW5kcG9pbnRzLCBlbmRwb2ludHNFbnRlcmluZ0xhc3ROLCBvYmopO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2xhc3RuY2hhbmdlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBbbGFzdE5FbmRwb2ludHMsIGVuZHBvaW50c0VudGVyaW5nTGFzdE4sIHN0cmVhbV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcIlNpbXVsY2FzdExheWVyc0NoYW5nZWRFdmVudFwiID09PSBjb2xpYnJpQ2xhc3MpXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3NpbXVsY2FzdGxheWVyc2NoYW5nZWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgW29iai5lbmRwb2ludFNpbXVsY2FzdExheWVyc10pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcIlNpbXVsY2FzdExheWVyc0NoYW5naW5nRXZlbnRcIiA9PT0gY29saWJyaUNsYXNzKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICdzaW11bGNhc3RsYXllcnNjaGFuZ2luZycsXG4gICAgICAgICAgICAgICAgICAgICAgICBbb2JqLmVuZHBvaW50U2ltdWxjYXN0TGF5ZXJzXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKFwiU3RhcnRTaW11bGNhc3RMYXllckV2ZW50XCIgPT09IGNvbGlicmlDbGFzcylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3N0YXJ0c2ltdWxjYXN0bGF5ZXInLCBvYmouc2ltdWxjYXN0TGF5ZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmIChcIlN0b3BTaW11bGNhc3RMYXllckV2ZW50XCIgPT09IGNvbGlicmlDbGFzcylcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3N0b3BzaW11bGNhc3RsYXllcicsIG9iai5zaW11bGNhc3RMYXllcik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoXCJEYXRhIGNoYW5uZWwgSlNPTi1mb3JtYXR0ZWQgbWVzc2FnZTogXCIsIG9iaik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGRhdGFDaGFubmVsLm9uY2xvc2UgPSBmdW5jdGlvbiAoKVxuICAgICAgICB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJUaGUgRGF0YSBDaGFubmVsIGNsb3NlZFwiLCBkYXRhQ2hhbm5lbCk7XG4gICAgICAgICAgICB2YXIgaWR4ID0gX2RhdGFDaGFubmVscy5pbmRleE9mKGRhdGFDaGFubmVsKTtcbiAgICAgICAgICAgIGlmIChpZHggPiAtMSlcbiAgICAgICAgICAgICAgICBfZGF0YUNoYW5uZWxzID0gX2RhdGFDaGFubmVscy5zcGxpY2UoaWR4LCAxKTtcbiAgICAgICAgfTtcbiAgICAgICAgX2RhdGFDaGFubmVscy5wdXNoKGRhdGFDaGFubmVsKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQmluZHMgXCJvbmRhdGFjaGFubmVsXCIgZXZlbnQgbGlzdGVuZXIgdG8gZ2l2ZW4gUGVlckNvbm5lY3Rpb24gaW5zdGFuY2UuXG4gICAgICogQHBhcmFtIHBlZXJDb25uZWN0aW9uIFdlYlJUQyBwZWVyIGNvbm5lY3Rpb24gaW5zdGFuY2UuXG4gICAgICovXG4gICAgYmluZERhdGFDaGFubmVsTGlzdGVuZXI6IGZ1bmN0aW9uIChwZWVyQ29ubmVjdGlvbikge1xuICAgICAgICBpZighY29uZmlnLm9wZW5TY3RwKVxuICAgICAgICAgICAgcmV0cnVuO1xuXG4gICAgICAgIHBlZXJDb25uZWN0aW9uLm9uZGF0YWNoYW5uZWwgPSB0aGlzLm9uRGF0YUNoYW5uZWw7XG5cbiAgICAgICAgLy8gU2FtcGxlIGNvZGUgZm9yIG9wZW5pbmcgbmV3IGRhdGEgY2hhbm5lbCBmcm9tIEppdHNpIE1lZXQgdG8gdGhlIGJyaWRnZS5cbiAgICAgICAgLy8gQWx0aG91Z2ggaXQncyBub3QgYSByZXF1aXJlbWVudCB0byBvcGVuIHNlcGFyYXRlIGNoYW5uZWxzIGZyb20gYm90aCBicmlkZ2VcbiAgICAgICAgLy8gYW5kIHBlZXIgYXMgc2luZ2xlIGNoYW5uZWwgY2FuIGJlIHVzZWQgZm9yIHNlbmRpbmcgYW5kIHJlY2VpdmluZyBkYXRhLlxuICAgICAgICAvLyBTbyBlaXRoZXIgY2hhbm5lbCBvcGVuZWQgYnkgdGhlIGJyaWRnZSBvciB0aGUgb25lIG9wZW5lZCBoZXJlIGlzIGVub3VnaFxuICAgICAgICAvLyBmb3IgY29tbXVuaWNhdGlvbiB3aXRoIHRoZSBicmlkZ2UuXG4gICAgICAgIC8qdmFyIGRhdGFDaGFubmVsT3B0aW9ucyA9XG4gICAgICAgICB7XG4gICAgICAgICByZWxpYWJsZTogdHJ1ZVxuICAgICAgICAgfTtcbiAgICAgICAgIHZhciBkYXRhQ2hhbm5lbFxuICAgICAgICAgPSBwZWVyQ29ubmVjdGlvbi5jcmVhdGVEYXRhQ2hhbm5lbChcIm15Q2hhbm5lbFwiLCBkYXRhQ2hhbm5lbE9wdGlvbnMpO1xuXG4gICAgICAgICAvLyBDYW4gYmUgdXNlZCBvbmx5IHdoZW4gaXMgaW4gb3BlbiBzdGF0ZVxuICAgICAgICAgZGF0YUNoYW5uZWwub25vcGVuID0gZnVuY3Rpb24gKClcbiAgICAgICAgIHtcbiAgICAgICAgIGRhdGFDaGFubmVsLnNlbmQoXCJNeSBjaGFubmVsICEhIVwiKTtcbiAgICAgICAgIH07XG4gICAgICAgICBkYXRhQ2hhbm5lbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpXG4gICAgICAgICB7XG4gICAgICAgICB2YXIgbXNnRGF0YSA9IGV2ZW50LmRhdGE7XG4gICAgICAgICBjb25zb2xlLmluZm8oXCJHb3QgTXkgRGF0YSBDaGFubmVsIE1lc3NhZ2U6XCIsIG1zZ0RhdGEsIGRhdGFDaGFubmVsKTtcbiAgICAgICAgIH07Ki9cbiAgICB9XG5cbn1cblxuZnVuY3Rpb24gb25TZWxlY3RlZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKVxue1xuICAgIGNvbnNvbGUubG9nKCdzZWxlY3RlZCBlbmRwb2ludCBjaGFuZ2VkOiAnLCB1c2VySmlkKTtcbiAgICBpZiAoX2RhdGFDaGFubmVscyAmJiBfZGF0YUNoYW5uZWxzLmxlbmd0aCAhPSAwKVxuICAgIHtcbiAgICAgICAgX2RhdGFDaGFubmVscy5zb21lKGZ1bmN0aW9uIChkYXRhQ2hhbm5lbCkge1xuICAgICAgICAgICAgaWYgKGRhdGFDaGFubmVsLnJlYWR5U3RhdGUgPT0gJ29wZW4nKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRhdGFDaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgICAgICAgICAnY29saWJyaUNsYXNzJzogJ1NlbGVjdGVkRW5kcG9pbnRDaGFuZ2VkRXZlbnQnLFxuICAgICAgICAgICAgICAgICAgICAnc2VsZWN0ZWRFbmRwb2ludCc6ICghdXNlckppZCB8fCB1c2VySmlkID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG51bGwgOiB1c2VySmlkXG4gICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuJChkb2N1bWVudCkuYmluZChcInNlbGVjdGVkZW5kcG9pbnRjaGFuZ2VkXCIsIGZ1bmN0aW9uKGV2ZW50LCB1c2VySmlkKSB7XG4gICAgb25TZWxlY3RlZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKTtcbn0pO1xuXG5mdW5jdGlvbiBvblBpbm5lZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKVxue1xuICAgIGNvbnNvbGUubG9nKCdwaW5uZWQgZW5kcG9pbnQgY2hhbmdlZDogJywgdXNlckppZCk7XG4gICAgaWYgKF9kYXRhQ2hhbm5lbHMgJiYgX2RhdGFDaGFubmVscy5sZW5ndGggIT0gMClcbiAgICB7XG4gICAgICAgIF9kYXRhQ2hhbm5lbHMuc29tZShmdW5jdGlvbiAoZGF0YUNoYW5uZWwpIHtcbiAgICAgICAgICAgIGlmIChkYXRhQ2hhbm5lbC5yZWFkeVN0YXRlID09ICdvcGVuJylcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBkYXRhQ2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgICAgJ2NvbGlicmlDbGFzcyc6ICdQaW5uZWRFbmRwb2ludENoYW5nZWRFdmVudCcsXG4gICAgICAgICAgICAgICAgICAgICdwaW5uZWRFbmRwb2ludCc6ICghdXNlckppZCB8fCB1c2VySmlkID09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IG51bGwgOiBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZCh1c2VySmlkKVxuICAgICAgICAgICAgICAgIH0pKTtcblxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbiQoZG9jdW1lbnQpLmJpbmQoXCJwaW5uZWRlbmRwb2ludGNoYW5nZWRcIiwgZnVuY3Rpb24oZXZlbnQsIHVzZXJKaWQpIHtcbiAgICBvblBpbm5lZEVuZHBvaW50Q2hhbmdlZCh1c2VySmlkKTtcbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERhdGFDaGFubmVscztcblxuIiwiLy92YXIgU3RyZWFtRXZlbnRUeXBlcyA9IHJlcXVpcmUoXCIuLi8uLi9zZXJ2aWNlL1JUQy9TdHJlYW1FdmVudFR5cGVzLmpzXCIpO1xuXG5mdW5jdGlvbiBMb2NhbFN0cmVhbShzdHJlYW0sIHR5cGUsIGV2ZW50RW1pdHRlcilcbntcbiAgICB0aGlzLnN0cmVhbSA9IHN0cmVhbTtcbiAgICB0aGlzLmV2ZW50RW1pdHRlciA9IGV2ZW50RW1pdHRlcjtcbiAgICB0aGlzLnR5cGUgPSB0eXBlO1xuXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuc3RyZWFtLm9uZW5kZWQgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICBzZWxmLnN0cmVhbUVuZGVkKCk7XG4gICAgfTtcbn1cblxuTG9jYWxTdHJlYW0ucHJvdG90eXBlLnN0cmVhbUVuZGVkID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZXZlbnRFbWl0dGVyLmVtaXQoU3RyZWFtRXZlbnRUeXBlcy5FVkVOVF9UWVBFX0xPQ0FMX0VOREVELCB0aGlzKTtcbn1cblxuTG9jYWxTdHJlYW0ucHJvdG90eXBlLmdldE9yaWdpbmFsU3RyZWFtID0gZnVuY3Rpb24oKVxue1xuICAgIHJldHVybiB0aGlzLnN0cmVhbTtcbn1cblxuTG9jYWxTdHJlYW0ucHJvdG90eXBlLmlzQXVkaW9TdHJlYW0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuICh0aGlzLnN0cmVhbS5nZXRBdWRpb1RyYWNrcygpICYmIHRoaXMuc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCkubGVuZ3RoID4gMCk7XG59XG5cbkxvY2FsU3RyZWFtLnByb3RvdHlwZS5tdXRlID0gZnVuY3Rpb24oKVxue1xuICAgIHZhciBpc211dGVkID0gZmFsc2U7XG4gICAgdmFyIHRyYWNrcyA9IFtdO1xuICAgIGlmKHRoaXMudHlwZSA9IFwiYXVkaW9cIilcbiAgICB7XG4gICAgICAgIHRyYWNrcyA9IHRoaXMuc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCk7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHRyYWNrcyA9IHRoaXMuc3RyZWFtLmdldFZpZGVvVHJhY2tzKCk7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgdHJhY2tzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgaXNtdXRlZCA9ICF0cmFja3NbaWR4XS5lbmFibGVkO1xuICAgICAgICB0cmFja3NbaWR4XS5lbmFibGVkID0gIXRyYWNrc1tpZHhdLmVuYWJsZWQ7XG4gICAgfVxuICAgIHJldHVybiBpc211dGVkO1xufVxuXG5Mb2NhbFN0cmVhbS5wcm90b3R5cGUuaXNNdXRlZCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdHJhY2tzID0gW107XG4gICAgaWYodGhpcy50eXBlID0gXCJhdWRpb1wiKVxuICAgIHtcbiAgICAgICAgdHJhY2tzID0gdGhpcy5zdHJlYW0uZ2V0QXVkaW9UcmFja3MoKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgdHJhY2tzID0gdGhpcy5zdHJlYW0uZ2V0VmlkZW9UcmFja3MoKTtcbiAgICB9XG4gICAgZm9yICh2YXIgaWR4ID0gMDsgaWR4IDwgdHJhY2tzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgICAgaWYodHJhY2tzW2lkeF0uZW5hYmxlZClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTG9jYWxTdHJlYW07XG4iLCIvLy8vVGhlc2UgbGluZXMgc2hvdWxkIGJlIHVuY29tbWVudGVkIHdoZW4gcmVxdWlyZSB3b3JrcyBpbiBhcHAuanNcbi8vdmFyIFJUQ0Jyb3dzZXJUeXBlID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL1JUQ0Jyb3dzZXJUeXBlLmpzXCIpO1xuLy92YXIgU3RyZWFtRXZlbnRUeXBlcyA9IHJlcXVpcmUoXCIuLi8uLi9zZXJ2aWNlL1JUQy9TdHJlYW1FdmVudFR5cGVzLmpzXCIpO1xuLy92YXIgTWVkaWFTdHJlYW1UeXBlID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL01lZGlhU3RyZWFtVHlwZXNcIik7XG5cbi8qKlxuICogQ3JlYXRlcyBhIE1lZGlhU3RyZWFtIG9iamVjdCBmb3IgdGhlIGdpdmVuIGRhdGEsIHNlc3Npb24gaWQgYW5kIHNzcmMuXG4gKiBJdCBpcyBhIHdyYXBwZXIgY2xhc3MgZm9yIHRoZSBNZWRpYVN0cmVhbS5cbiAqXG4gKiBAcGFyYW0gZGF0YSB0aGUgZGF0YSBvYmplY3QgZnJvbSB3aGljaCB3ZSBvYnRhaW4gdGhlIHN0cmVhbSxcbiAqIHRoZSBwZWVyamlkLCBldGMuXG4gKiBAcGFyYW0gc2lkIHRoZSBzZXNzaW9uIGlkXG4gKiBAcGFyYW0gc3NyYyB0aGUgc3NyYyBjb3JyZXNwb25kaW5nIHRvIHRoaXMgTWVkaWFTdHJlYW1cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTWVkaWFTdHJlYW0oZGF0YSwgc2lkLCBzc3JjLCBldmVudEVtbWl0ZXIsIGJyb3dzZXIpIHtcbiAgICB0aGlzLnNpZCA9IHNpZDtcbiAgICB0aGlzLnN0cmVhbSA9IGRhdGEuc3RyZWFtO1xuICAgIHRoaXMucGVlcmppZCA9IGRhdGEucGVlcmppZDtcbiAgICB0aGlzLnNzcmMgPSBzc3JjO1xuICAgIHRoaXMudHlwZSA9ICh0aGlzLnN0cmVhbS5nZXRWaWRlb1RyYWNrcygpLmxlbmd0aCA+IDApP1xuICAgICAgICBNZWRpYVN0cmVhbVR5cGUuVklERU9fVFlQRSA6IE1lZGlhU3RyZWFtVHlwZS5BVURJT19UWVBFO1xuICAgIHRoaXMubXV0ZWQgPSBmYWxzZTtcbiAgICBldmVudEVtbWl0ZXIuZW1pdChTdHJlYW1FdmVudFR5cGVzLkVWRU5UX1RZUEVfUkVNT1RFX0NSRUFURUQsIHRoaXMpO1xuICAgIGlmKGJyb3dzZXIgPT0gUlRDQnJvd3NlclR5cGUuUlRDX0JST1dTRVJfRklSRUZPWClcbiAgICB7XG4gICAgICAgIGlmICghdGhpcy5nZXRWaWRlb1RyYWNrcylcbiAgICAgICAgICAgIHRoaXMuZ2V0VmlkZW9UcmFja3MgPSBmdW5jdGlvbiAoKSB7IHJldHVybiBbXTsgfTtcbiAgICAgICAgaWYgKCF0aGlzLmdldEF1ZGlvVHJhY2tzKVxuICAgICAgICAgICAgdGhpcy5nZXRBdWRpb1RyYWNrcyA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIFtdOyB9O1xuICAgIH1cbn1cblxuXG5NZWRpYVN0cmVhbS5wcm90b3R5cGUuZ2V0T3JpZ2luYWxTdHJlYW0gPSBmdW5jdGlvbigpXG57XG4gICAgcmV0dXJuIHRoaXMuc3RyZWFtO1xufVxuXG5NZWRpYVN0cmVhbS5wcm90b3R5cGUuc2V0TXV0ZSA9IGZ1bmN0aW9uICh2YWx1ZSlcbntcbiAgICB0aGlzLnN0cmVhbS5tdXRlZCA9IHZhbHVlO1xuICAgIHRoaXMubXV0ZWQgPSB2YWx1ZTtcbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lZGlhU3RyZWFtO1xuIiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoXCJldmVudHNcIik7XG52YXIgUlRDVXRpbHMgPSByZXF1aXJlKFwiLi9SVENVdGlscy5qc1wiKTtcbnZhciBMb2NhbFN0cmVhbSA9IHJlcXVpcmUoXCIuL0xvY2FsU3RyZWFtLmpzXCIpO1xudmFyIERhdGFDaGFubmVscyA9IHJlcXVpcmUoXCIuL0RhdGFDaGFubmVsc1wiKTtcbnZhciBNZWRpYVN0cmVhbSA9IHJlcXVpcmUoXCIuL01lZGlhU3RyZWFtLmpzXCIpO1xuLy9UaGVzZSBsaW5lcyBzaG91bGQgYmUgdW5jb21tZW50ZWQgd2hlbiByZXF1aXJlIHdvcmtzIGluIGFwcC5qc1xuLy92YXIgU3RyZWFtRXZlbnRUeXBlcyA9IHJlcXVpcmUoXCIuLi8uLi9zZXJ2aWNlL1JUQy9TdHJlYW1FdmVudFR5cGVzLmpzXCIpO1xuLy92YXIgWE1QUEV2ZW50cyA9IHJlcXVpcmUoXCIuLi9zZXJ2aWNlL3htcHAvWE1QUEV2ZW50c1wiKTtcblxudmFyIGV2ZW50RW1pdHRlciA9IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxudmFyIFJUQyA9IHtcbiAgICBydGNVdGlsczogbnVsbCxcbiAgICBsb2NhbFN0cmVhbXM6IFtdLFxuICAgIHJlbW90ZVN0cmVhbXM6IHt9LFxuICAgIGxvY2FsQXVkaW86IG51bGwsXG4gICAgbG9jYWxWaWRlbzogbnVsbCxcbiAgICBhZGRTdHJlYW1MaXN0ZW5lcjogZnVuY3Rpb24gKGxpc3RlbmVyLCBldmVudFR5cGUpIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLm9uKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgIH0sXG4gICAgcmVtb3ZlU3RyZWFtTGlzdGVuZXI6IGZ1bmN0aW9uIChsaXN0ZW5lciwgZXZlbnRUeXBlKSB7XG4gICAgICAgIGlmKCEoZXZlbnRUeXBlIGluc3RhbmNlb2YgU3RyZWFtRXZlbnRUeXBlcykpXG4gICAgICAgICAgICB0aHJvdyBcIklsbGVnYWwgYXJndW1lbnRcIjtcblxuICAgICAgICBldmVudEVtaXR0ZXIucmVtb3ZlTGlzdGVuZXIoZXZlbnRUeXBlLCBsaXN0ZW5lcik7XG4gICAgfSxcbiAgICBjcmVhdGVMb2NhbFN0cmVhbTogZnVuY3Rpb24gKHN0cmVhbSwgdHlwZSkge1xuXG4gICAgICAgIHZhciBsb2NhbFN0cmVhbSA9ICBuZXcgTG9jYWxTdHJlYW0oc3RyZWFtLCB0eXBlLCBldmVudEVtaXR0ZXIpO1xuICAgICAgICB0aGlzLmxvY2FsU3RyZWFtcy5wdXNoKGxvY2FsU3RyZWFtKTtcbiAgICAgICAgaWYodHlwZSA9PSBcImF1ZGlvXCIpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMubG9jYWxBdWRpbyA9IGxvY2FsU3RyZWFtO1xuICAgICAgICB9XG4gICAgICAgIGVsc2VcbiAgICAgICAge1xuICAgICAgICAgICAgdGhpcy5sb2NhbFZpZGVvID0gbG9jYWxTdHJlYW07XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnRFbWl0dGVyLmVtaXQoU3RyZWFtRXZlbnRUeXBlcy5FVkVOVF9UWVBFX0xPQ0FMX0NSRUFURUQsXG4gICAgICAgICAgICBsb2NhbFN0cmVhbSk7XG4gICAgICAgIHJldHVybiBsb2NhbFN0cmVhbTtcbiAgICB9LFxuICAgIHJlbW92ZUxvY2FsU3RyZWFtOiBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLmxvY2FsU3RyZWFtcy5sZW5ndGg7IGkrKylcbiAgICAgICAge1xuICAgICAgICAgICAgaWYodGhpcy5sb2NhbFN0cmVhbXNbaV0uZ2V0T3JpZ2luYWxTdHJlYW0oKSA9PT0gc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMubG9jYWxTdHJlYW1zW2ldO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgY3JlYXRlUmVtb3RlU3RyZWFtOiBmdW5jdGlvbiAoZGF0YSwgc2lkLCB0aGVzc3JjKSB7XG4gICAgICAgIHZhciByZW1vdGVTdHJlYW0gPSBuZXcgTWVkaWFTdHJlYW0oZGF0YSwgc2lkLCB0aGVzc3JjLCBldmVudEVtaXR0ZXIsXG4gICAgICAgICAgICB0aGlzLmdldEJyb3dzZXJUeXBlKCkpO1xuICAgICAgICB2YXIgamlkID0gZGF0YS5wZWVyamlkIHx8IGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQ7XG4gICAgICAgIGlmKCF0aGlzLnJlbW90ZVN0cmVhbXNbamlkXSkge1xuICAgICAgICAgICAgdGhpcy5yZW1vdGVTdHJlYW1zW2ppZF0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJlbW90ZVN0cmVhbXNbamlkXVtyZW1vdGVTdHJlYW0udHlwZV09IHJlbW90ZVN0cmVhbTtcbiAgICAgICAgcmV0dXJuIHJlbW90ZVN0cmVhbTtcbiAgICB9LFxuICAgIGdldEJyb3dzZXJUeXBlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ0Y1V0aWxzLmJyb3dzZXI7XG4gICAgfSxcbiAgICBnZXRQQ0NvbnN0cmFpbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ0Y1V0aWxzLnBjX2NvbnN0cmFpbnRzO1xuICAgIH0sXG4gICAgZ2V0VXNlck1lZGlhV2l0aENvbnN0cmFpbnRzOmZ1bmN0aW9uKHVtLCBzdWNjZXNzX2NhbGxiYWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmYWlsdXJlX2NhbGxiYWNrLCByZXNvbHV0aW9uLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYW5kd2lkdGgsIGZwcywgZGVza3RvcFN0cmVhbSlcbiAgICB7XG4gICAgICAgIHJldHVybiB0aGlzLnJ0Y1V0aWxzLmdldFVzZXJNZWRpYVdpdGhDb25zdHJhaW50cyh1bSwgc3VjY2Vzc19jYWxsYmFjayxcbiAgICAgICAgICAgIGZhaWx1cmVfY2FsbGJhY2ssIHJlc29sdXRpb24sIGJhbmR3aWR0aCwgZnBzLCBkZXNrdG9wU3RyZWFtKTtcbiAgICB9LFxuICAgIGF0dGFjaE1lZGlhU3RyZWFtOiAgZnVuY3Rpb24gKGVsZW1lbnQsIHN0cmVhbSkge1xuICAgICAgICB0aGlzLnJ0Y1V0aWxzLmF0dGFjaE1lZGlhU3RyZWFtKGVsZW1lbnQsIHN0cmVhbSk7XG4gICAgfSxcbiAgICBnZXRTdHJlYW1JRDogIGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucnRjVXRpbHMuZ2V0U3RyZWFtSUQoc3RyZWFtKTtcbiAgICB9LFxuICAgIGdldFZpZGVvU3JjOiBmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ydGNVdGlscy5nZXRWaWRlb1NyYyhlbGVtZW50KTtcbiAgICB9LFxuICAgIHNldFZpZGVvU3JjOiBmdW5jdGlvbiAoZWxlbWVudCwgc3JjKSB7XG4gICAgICAgIHRoaXMucnRjVXRpbHMuc2V0VmlkZW9TcmMoZWxlbWVudCwgc3JjKTtcbiAgICB9LFxuICAgIGRpc3Bvc2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5ydGNVdGlscykge1xuICAgICAgICAgICAgdGhpcy5ydGNVdGlscyA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHN0b3A6ICBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgIH0sXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5ydGNVdGlscyA9IG5ldyBSVENVdGlscyh0aGlzKTtcbiAgICAgICAgdGhpcy5ydGNVdGlscy5vYnRhaW5BdWRpb0FuZFZpZGVvUGVybWlzc2lvbnMoKTtcbiAgICB9LFxuICAgIG9uQ29uZmVyZW5jZUNyZWF0ZWQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIERhdGFDaGFubmVscy5iaW5kRGF0YUNoYW5uZWxMaXN0ZW5lcihldmVudC5wZWVyY29ubmVjdGlvbik7XG4gICAgfSxcbiAgICBtdXRlUmVtb3RlVmlkZW9TdHJlYW06IGZ1bmN0aW9uIChqaWQsIHZhbHVlKSB7XG4gICAgICAgIHZhciBzdHJlYW07XG5cbiAgICAgICAgaWYodGhpcy5yZW1vdGVTdHJlYW1zW2ppZF0gJiZcbiAgICAgICAgICAgIHRoaXMucmVtb3RlU3RyZWFtc1tqaWRdW01lZGlhU3RyZWFtVHlwZS5WSURFT19UWVBFXSlcbiAgICAgICAge1xuICAgICAgICAgICAgc3RyZWFtID0gdGhpcy5yZW1vdGVTdHJlYW1zW2ppZF1bTWVkaWFTdHJlYW1UeXBlLlZJREVPX1RZUEVdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoIXN0cmVhbSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICB2YXIgaXNNdXRlZCA9ICh2YWx1ZSA9PT0gXCJ0cnVlXCIpO1xuICAgICAgICBpZiAoaXNNdXRlZCAhPSBzdHJlYW0ubXV0ZWQpIHtcbiAgICAgICAgICAgIHN0cmVhbS5zZXRNdXRlKGlzTXV0ZWQpO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSVEM7XG4iLCIvL1RoaXMgc2hvdWxkIGJlIHVuY29tbWVudGVkIHdoZW4gYXBwLmpzIHN1cHBvcnRzIHJlcXVpcmVcbi8vdmFyIFJUQ0Jyb3dzZXJUeXBlID0gcmVxdWlyZShcIi4uLy4uL3NlcnZpY2UvUlRDL1JUQ0Jyb3dzZXJUeXBlLmpzXCIpO1xuXG52YXIgY29uc3RyYWludHMgPSB7YXVkaW86IGZhbHNlLCB2aWRlbzogZmFsc2V9O1xuXG5mdW5jdGlvbiBzZXRSZXNvbHV0aW9uQ29uc3RyYWludHMocmVzb2x1dGlvbiwgaXNBbmRyb2lkKVxue1xuICAgIGlmIChyZXNvbHV0aW9uICYmICFjb25zdHJhaW50cy52aWRlbyB8fCBpc0FuZHJvaWQpIHtcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8gPSB7IG1hbmRhdG9yeToge30sIG9wdGlvbmFsOiBbXSB9Oy8vIHNhbWUgYmVoYXZpb3VyIGFzIHRydWVcbiAgICB9XG4gICAgLy8gc2VlIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3AvY2hyb21pdW0vaXNzdWVzL2RldGFpbD9pZD0xNDM2MzEjYzkgZm9yIGxpc3Qgb2Ygc3VwcG9ydGVkIHJlc29sdXRpb25zXG4gICAgc3dpdGNoIChyZXNvbHV0aW9uKSB7XG4gICAgICAgIC8vIDE2OjkgZmlyc3RcbiAgICAgICAgY2FzZSAnMTA4MCc6XG4gICAgICAgIGNhc2UgJ2Z1bGxoZCc6XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGggPSAxOTIwO1xuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodCA9IDEwODA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnNzIwJzpcbiAgICAgICAgY2FzZSAnaGQnOlxuICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoID0gMTI4MDtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQgPSA3MjA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnMzYwJzpcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aCA9IDY0MDtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQgPSAzNjA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnMTgwJzpcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aCA9IDMyMDtcbiAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQgPSAxODA7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gNDozXG4gICAgICAgIGNhc2UgJzk2MCc6XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGggPSA5NjA7XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0ID0gNzIwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzY0MCc6XG4gICAgICAgIGNhc2UgJ3ZnYSc6XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGggPSA2NDA7XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0ID0gNDgwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJzMyMCc6XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGggPSAzMjA7XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluSGVpZ2h0ID0gMjQwO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICBpZiAoaXNBbmRyb2lkKSB7XG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbldpZHRoID0gMzIwO1xuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQgPSAyNDA7XG4gICAgICAgICAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1heEZyYW1lUmF0ZSA9IDE1O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGlmIChjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluV2lkdGgpXG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5tYXhXaWR0aCA9IGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5XaWR0aDtcbiAgICBpZiAoY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1pbkhlaWdodClcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8ubWFuZGF0b3J5Lm1heEhlaWdodCA9IGNvbnN0cmFpbnRzLnZpZGVvLm1hbmRhdG9yeS5taW5IZWlnaHQ7XG59XG5cblxuZnVuY3Rpb24gc2V0Q29uc3RyYWludHModW0sIHJlc29sdXRpb24sIGJhbmR3aWR0aCwgZnBzLCBkZXNrdG9wU3RyZWFtLCBpc0FuZHJvaWQpXG57XG4gICAgaWYgKHVtLmluZGV4T2YoJ3ZpZGVvJykgPj0gMCkge1xuICAgICAgICBjb25zdHJhaW50cy52aWRlbyA9IHsgbWFuZGF0b3J5OiB7fSwgb3B0aW9uYWw6IFtdIH07Ly8gc2FtZSBiZWhhdmlvdXIgYXMgdHJ1ZVxuICAgIH1cbiAgICBpZiAodW0uaW5kZXhPZignYXVkaW8nKSA+PSAwKSB7XG4gICAgICAgIGNvbnN0cmFpbnRzLmF1ZGlvID0geyBtYW5kYXRvcnk6IHt9LCBvcHRpb25hbDogW119Oy8vIHNhbWUgYmVoYXZpb3VyIGFzIHRydWVcbiAgICB9XG4gICAgaWYgKHVtLmluZGV4T2YoJ3NjcmVlbicpID49IDApIHtcbiAgICAgICAgY29uc3RyYWludHMudmlkZW8gPSB7XG4gICAgICAgICAgICBtYW5kYXRvcnk6IHtcbiAgICAgICAgICAgICAgICBjaHJvbWVNZWRpYVNvdXJjZTogXCJzY3JlZW5cIixcbiAgICAgICAgICAgICAgICBnb29nTGVha3lCdWNrZXQ6IHRydWUsXG4gICAgICAgICAgICAgICAgbWF4V2lkdGg6IHdpbmRvdy5zY3JlZW4ud2lkdGgsXG4gICAgICAgICAgICAgICAgbWF4SGVpZ2h0OiB3aW5kb3cuc2NyZWVuLmhlaWdodCxcbiAgICAgICAgICAgICAgICBtYXhGcmFtZVJhdGU6IDNcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBvcHRpb25hbDogW11cbiAgICAgICAgfTtcbiAgICB9XG4gICAgaWYgKHVtLmluZGV4T2YoJ2Rlc2t0b3AnKSA+PSAwKSB7XG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvID0ge1xuICAgICAgICAgICAgbWFuZGF0b3J5OiB7XG4gICAgICAgICAgICAgICAgY2hyb21lTWVkaWFTb3VyY2U6IFwiZGVza3RvcFwiLFxuICAgICAgICAgICAgICAgIGNocm9tZU1lZGlhU291cmNlSWQ6IGRlc2t0b3BTdHJlYW0sXG4gICAgICAgICAgICAgICAgZ29vZ0xlYWt5QnVja2V0OiB0cnVlLFxuICAgICAgICAgICAgICAgIG1heFdpZHRoOiB3aW5kb3cuc2NyZWVuLndpZHRoLFxuICAgICAgICAgICAgICAgIG1heEhlaWdodDogd2luZG93LnNjcmVlbi5oZWlnaHQsXG4gICAgICAgICAgICAgICAgbWF4RnJhbWVSYXRlOiAzXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb3B0aW9uYWw6IFtdXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgaWYgKGNvbnN0cmFpbnRzLmF1ZGlvKSB7XG4gICAgICAgIC8vIGlmIGl0IGlzIGdvb2QgZW5vdWdoIGZvciBoYW5nb3V0cy4uLlxuICAgICAgICBjb25zdHJhaW50cy5hdWRpby5vcHRpb25hbC5wdXNoKFxuICAgICAgICAgICAge2dvb2dFY2hvQ2FuY2VsbGF0aW9uOiB0cnVlfSxcbiAgICAgICAgICAgIHtnb29nQXV0b0dhaW5Db250cm9sOiB0cnVlfSxcbiAgICAgICAgICAgIHtnb29nTm9pc2VTdXByZXNzaW9uOiB0cnVlfSxcbiAgICAgICAgICAgIHtnb29nSGlnaHBhc3NGaWx0ZXI6IHRydWV9LFxuICAgICAgICAgICAge2dvb2dOb2lzZXN1cHByZXNzaW9uMjogdHJ1ZX0sXG4gICAgICAgICAgICB7Z29vZ0VjaG9DYW5jZWxsYXRpb24yOiB0cnVlfSxcbiAgICAgICAgICAgIHtnb29nQXV0b0dhaW5Db250cm9sMjogdHJ1ZX1cbiAgICAgICAgKTtcbiAgICB9XG4gICAgaWYgKGNvbnN0cmFpbnRzLnZpZGVvKSB7XG4gICAgICAgIGNvbnN0cmFpbnRzLnZpZGVvLm9wdGlvbmFsLnB1c2goXG4gICAgICAgICAgICB7Z29vZ05vaXNlUmVkdWN0aW9uOiBmYWxzZX0gLy8gY2hyb21lIDM3IHdvcmthcm91bmQgZm9yIGlzc3VlIDM4MDcsIHJlZW5hYmxlIGluIE0zOFxuICAgICAgICApO1xuICAgICAgICBpZiAodW0uaW5kZXhPZigndmlkZW8nKSA+PSAwKSB7XG4gICAgICAgICAgICBjb25zdHJhaW50cy52aWRlby5vcHRpb25hbC5wdXNoKFxuICAgICAgICAgICAgICAgIHtnb29nTGVha3lCdWNrZXQ6IHRydWV9XG4gICAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2V0UmVzb2x1dGlvbkNvbnN0cmFpbnRzKHJlc29sdXRpb24sIGlzQW5kcm9pZCk7XG5cbiAgICBpZiAoYmFuZHdpZHRoKSB7IC8vIGRvZXNuJ3Qgd29yayBjdXJyZW50bHksIHNlZSB3ZWJydGMgaXNzdWUgMTg0NlxuICAgICAgICBpZiAoIWNvbnN0cmFpbnRzLnZpZGVvKSBjb25zdHJhaW50cy52aWRlbyA9IHttYW5kYXRvcnk6IHt9LCBvcHRpb25hbDogW119Oy8vc2FtZSBiZWhhdmlvdXIgYXMgdHJ1ZVxuICAgICAgICBjb25zdHJhaW50cy52aWRlby5vcHRpb25hbC5wdXNoKHtiYW5kd2lkdGg6IGJhbmR3aWR0aH0pO1xuICAgIH1cbiAgICBpZiAoZnBzKSB7IC8vIGZvciBzb21lIGNhbWVyYXMgaXQgbWlnaHQgYmUgbmVjZXNzYXJ5IHRvIHJlcXVlc3QgMzBmcHNcbiAgICAgICAgLy8gc28gdGhleSBjaG9vc2UgMzBmcHMgbWpwZyBvdmVyIDEwZnBzIHl1eTJcbiAgICAgICAgaWYgKCFjb25zdHJhaW50cy52aWRlbykgY29uc3RyYWludHMudmlkZW8gPSB7bWFuZGF0b3J5OiB7fSwgb3B0aW9uYWw6IFtdfTsvLyBzYW1lIGJlaGF2aW91ciBhcyB0cnVlO1xuICAgICAgICBjb25zdHJhaW50cy52aWRlby5tYW5kYXRvcnkubWluRnJhbWVSYXRlID0gZnBzO1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBSVENVdGlscyhSVENTZXJ2aWNlKVxue1xuICAgIHRoaXMuc2VydmljZSA9IFJUQ1NlcnZpY2U7XG4gICAgaWYgKG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1RoaXMgYXBwZWFycyB0byBiZSBGaXJlZm94Jyk7XG4gICAgICAgIHZhciB2ZXJzaW9uID0gcGFyc2VJbnQobmF2aWdhdG9yLnVzZXJBZ2VudC5tYXRjaCgvRmlyZWZveFxcLyhbMC05XSspXFwuLylbMV0sIDEwKTtcbiAgICAgICAgaWYgKHZlcnNpb24gPj0gMjIpIHtcbiAgICAgICAgICAgIHRoaXMucGVlcmNvbm5lY3Rpb24gPSBtb3pSVENQZWVyQ29ubmVjdGlvbjtcbiAgICAgICAgICAgIHRoaXMuYnJvd3NlciA9IFJUQ0Jyb3dzZXJUeXBlLlJUQ19CUk9XU0VSX0ZJUkVGT1g7XG4gICAgICAgICAgICB0aGlzLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEuYmluZChuYXZpZ2F0b3IpO1xuICAgICAgICAgICAgdGhpcy5wY19jb25zdHJhaW50cyA9IHt9O1xuICAgICAgICAgICAgdGhpcy5hdHRhY2hNZWRpYVN0cmVhbSA9ICBmdW5jdGlvbiAoZWxlbWVudCwgc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudFswXS5tb3pTcmNPYmplY3QgPSBzdHJlYW07XG4gICAgICAgICAgICAgICAgZWxlbWVudFswXS5wbGF5KCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5nZXRTdHJlYW1JRCA9ICBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRyYWNrcyA9IHN0cmVhbS5nZXRWaWRlb1RyYWNrcygpO1xuICAgICAgICAgICAgICAgIGlmKCF0cmFja3MgfHwgdHJhY2tzLmxlbmd0aCA9PSAwKVxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgdHJhY2tzID0gc3RyZWFtLmdldEF1ZGlvVHJhY2tzKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiB0cmFja3NbMF0uaWQucmVwbGFjZSgvW1xceyxcXH1dL2csXCJcIik7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5nZXRWaWRlb1NyYyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnQubW96U3JjT2JqZWN0O1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMuc2V0VmlkZW9TcmMgPSBmdW5jdGlvbiAoZWxlbWVudCwgc3JjKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5tb3pTcmNPYmplY3QgPSBzcmM7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID0gbW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uO1xuICAgICAgICAgICAgUlRDSWNlQ2FuZGlkYXRlID0gbW96UlRDSWNlQ2FuZGlkYXRlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChuYXZpZ2F0b3Iud2Via2l0R2V0VXNlck1lZGlhKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdUaGlzIGFwcGVhcnMgdG8gYmUgQ2hyb21lJyk7XG4gICAgICAgIHRoaXMucGVlcmNvbm5lY3Rpb24gPSB3ZWJraXRSVENQZWVyQ29ubmVjdGlvbjtcbiAgICAgICAgdGhpcy5icm93c2VyID0gUlRDQnJvd3NlclR5cGUuUlRDX0JST1dTRVJfQ0hST01FO1xuICAgICAgICB0aGlzLmdldFVzZXJNZWRpYSA9IG5hdmlnYXRvci53ZWJraXRHZXRVc2VyTWVkaWEuYmluZChuYXZpZ2F0b3IpO1xuICAgICAgICB0aGlzLmF0dGFjaE1lZGlhU3RyZWFtID0gZnVuY3Rpb24gKGVsZW1lbnQsIHN0cmVhbSkge1xuICAgICAgICAgICAgZWxlbWVudC5hdHRyKCdzcmMnLCB3ZWJraXRVUkwuY3JlYXRlT2JqZWN0VVJMKHN0cmVhbSkpO1xuICAgICAgICB9O1xuICAgICAgICB0aGlzLmdldFN0cmVhbUlEID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgLy8gc3RyZWFtcyBmcm9tIEZGIGVuZHBvaW50cyBoYXZlIHRoZSBjaGFyYWN0ZXJzICd7JyBhbmQgJ30nXG4gICAgICAgICAgICAvLyB0aGF0IG1ha2UgalF1ZXJ5IGNob2tlLlxuICAgICAgICAgICAgcmV0dXJuIHN0cmVhbS5pZC5yZXBsYWNlKC9bXFx7LFxcfV0vZyxcIlwiKTtcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5nZXRWaWRlb1NyYyA9IGZ1bmN0aW9uIChlbGVtZW50KSB7XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJzcmNcIik7XG4gICAgICAgIH07XG4gICAgICAgIHRoaXMuc2V0VmlkZW9TcmMgPSBmdW5jdGlvbiAoZWxlbWVudCwgc3JjKSB7XG4gICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShcInNyY1wiLCBzcmMpO1xuICAgICAgICB9O1xuICAgICAgICAvLyBEVExTIHNob3VsZCBub3cgYmUgZW5hYmxlZCBieSBkZWZhdWx0IGJ1dC4uXG4gICAgICAgIHRoaXMucGNfY29uc3RyYWludHMgPSB7J29wdGlvbmFsJzogW3snRHRsc1NydHBLZXlBZ3JlZW1lbnQnOiAndHJ1ZSd9XX07XG4gICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0FuZHJvaWQnKSAhPSAtMSkge1xuICAgICAgICAgICAgdGhpcy5wY19jb25zdHJhaW50cyA9IHt9OyAvLyBkaXNhYmxlIERUTFMgb24gQW5kcm9pZFxuICAgICAgICB9XG4gICAgICAgIGlmICghd2Via2l0TWVkaWFTdHJlYW0ucHJvdG90eXBlLmdldFZpZGVvVHJhY2tzKSB7XG4gICAgICAgICAgICB3ZWJraXRNZWRpYVN0cmVhbS5wcm90b3R5cGUuZ2V0VmlkZW9UcmFja3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudmlkZW9UcmFja3M7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmICghd2Via2l0TWVkaWFTdHJlYW0ucHJvdG90eXBlLmdldEF1ZGlvVHJhY2tzKSB7XG4gICAgICAgICAgICB3ZWJraXRNZWRpYVN0cmVhbS5wcm90b3R5cGUuZ2V0QXVkaW9UcmFja3MgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYXVkaW9UcmFja3M7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIHRyeSB7IGNvbnNvbGUubG9nKCdCcm93c2VyIGRvZXMgbm90IGFwcGVhciB0byBiZSBXZWJSVEMtY2FwYWJsZScpOyB9IGNhdGNoIChlKSB7IH1cblxuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9ICd3ZWJydGNyZXF1aXJlZC5odG1sJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICh0aGlzLmJyb3dzZXIgIT09IFJUQ0Jyb3dzZXJUeXBlLlJUQ19CUk9XU0VSX0NIUk9NRSAmJlxuICAgICAgICBjb25maWcuZW5hYmxlRmlyZWZveFN1cHBvcnQgIT09IHRydWUpIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSAnY2hyb21lb25seS5odG1sJztcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxufVxuXG5cblJUQ1V0aWxzLnByb3RvdHlwZS5nZXRVc2VyTWVkaWFXaXRoQ29uc3RyYWludHMgPSBmdW5jdGlvbihcbiAgICB1bSwgc3VjY2Vzc19jYWxsYmFjaywgZmFpbHVyZV9jYWxsYmFjaywgcmVzb2x1dGlvbixiYW5kd2lkdGgsIGZwcyxcbiAgICBkZXNrdG9wU3RyZWFtKVxue1xuICAgIC8vIENoZWNrIGlmIHdlIGFyZSBydW5uaW5nIG9uIEFuZHJvaWQgZGV2aWNlXG4gICAgdmFyIGlzQW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignQW5kcm9pZCcpICE9IC0xO1xuXG4gICAgc2V0Q29uc3RyYWludHModW0sIHJlc29sdXRpb24sIGJhbmR3aWR0aCwgZnBzLCBkZXNrdG9wU3RyZWFtLCBpc0FuZHJvaWQpO1xuXG4gICAgdmFyIGlzRkYgPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTE7XG5cbiAgICB0cnkge1xuICAgICAgICBpZiAoY29uZmlnLmVuYWJsZVNpbXVsY2FzdFxuICAgICAgICAgICAgJiYgY29uc3RyYWludHMudmlkZW9cbiAgICAgICAgICAgICYmIGNvbnN0cmFpbnRzLnZpZGVvLmNocm9tZU1lZGlhU291cmNlICE9PSAnc2NyZWVuJ1xuICAgICAgICAgICAgJiYgY29uc3RyYWludHMudmlkZW8uY2hyb21lTWVkaWFTb3VyY2UgIT09ICdkZXNrdG9wJ1xuICAgICAgICAgICAgJiYgIWlzQW5kcm9pZFxuXG4gICAgICAgICAgICAvLyBXZSBjdXJyZW50bHkgZG8gbm90IHN1cHBvcnQgRkYsIGFzIGl0IGRvZXNuJ3QgaGF2ZSBtdWx0aXN0cmVhbSBzdXBwb3J0LlxuICAgICAgICAgICAgJiYgIWlzRkYpIHtcbiAgICAgICAgICAgIHNpbXVsY2FzdC5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMsIGZ1bmN0aW9uIChzdHJlYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ29uVXNlck1lZGlhU3VjY2VzcycpO1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzX2NhbGxiYWNrKHN0cmVhbSk7XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdGYWlsZWQgdG8gZ2V0IGFjY2VzcyB0byBsb2NhbCBtZWRpYS4gRXJyb3IgJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZmFpbHVyZV9jYWxsYmFjaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZmFpbHVyZV9jYWxsYmFjayhlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdGhpcy5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb25Vc2VyTWVkaWFTdWNjZXNzJyk7XG4gICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NfY2FsbGJhY2soc3RyZWFtKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBnZXQgYWNjZXNzIHRvIGxvY2FsIG1lZGlhLiBFcnJvciAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGlmIChmYWlsdXJlX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmYWlsdXJlX2NhbGxiYWNrKGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0dVTSBmYWlsZWQ6ICcsIGUpO1xuICAgICAgICBpZihmYWlsdXJlX2NhbGxiYWNrKSB7XG4gICAgICAgICAgICBmYWlsdXJlX2NhbGxiYWNrKGUpO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuLyoqXG4gKiBXZSBhc2sgZm9yIGF1ZGlvIGFuZCB2aWRlbyBjb21iaW5lZCBzdHJlYW0gaW4gb3JkZXIgdG8gZ2V0IHBlcm1pc3Npb25zIGFuZFxuICogbm90IHRvIGFzayB0d2ljZS5cbiAqL1xuUlRDVXRpbHMucHJvdG90eXBlLm9idGFpbkF1ZGlvQW5kVmlkZW9QZXJtaXNzaW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBHZXQgQVZcbiAgICB2YXIgY2IgPSBmdW5jdGlvbiAoc3RyZWFtKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdnb3QnLCBzdHJlYW0sIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmxlbmd0aCwgc3RyZWFtLmdldFZpZGVvVHJhY2tzKCkubGVuZ3RoKTtcbiAgICAgICAgc2VsZi5oYW5kbGVMb2NhbFN0cmVhbShzdHJlYW0pO1xuICAgICAgICB0cmFja1VzYWdlKCdsb2NhbE1lZGlhJywge1xuICAgICAgICAgICAgYXVkaW86IHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmxlbmd0aCxcbiAgICAgICAgICAgIHZpZGVvOiBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGhcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5nZXRVc2VyTWVkaWFXaXRoQ29uc3RyYWludHMoXG4gICAgICAgIFsnYXVkaW8nLCAndmlkZW8nXSxcbiAgICAgICAgY2IsXG4gICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZmFpbGVkIHRvIG9idGFpbiBhdWRpby92aWRlbyBzdHJlYW0gLSB0cnlpbmcgYXVkaW8gb25seScsIGVycm9yKTtcbiAgICAgICAgICAgIHNlbGYuZ2V0VXNlck1lZGlhV2l0aENvbnN0cmFpbnRzKFxuICAgICAgICAgICAgICAgIFsnYXVkaW8nXSxcbiAgICAgICAgICAgICAgICBjYixcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZmFpbGVkIHRvIG9idGFpbiBhdWRpby92aWRlbyBzdHJlYW0gLSBzdG9wJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB0cmFja1VzYWdlKCdsb2NhbE1lZGlhRXJyb3InLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZWRpYTogZXJyb3IubWVkaWEgfHwgJ3ZpZGVvJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgOiBlcnJvci5uYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBVSS5tZXNzYWdlSGFuZGxlci5zaG93RXJyb3IoXCJFcnJvclwiLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiRmFpbGVkIHRvIG9idGFpbiBwZXJtaXNzaW9ucyB0byB1c2UgdGhlIGxvY2FsIG1pY3JvcGhvbmVcIiArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJhbmQvb3IgY2FtZXJhLlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICAgICAgY29uZmlnLnJlc29sdXRpb24gfHwgJzM2MCcpO1xufVxuXG5SVENVdGlscy5wcm90b3R5cGUuaGFuZGxlTG9jYWxTdHJlYW0gPSBmdW5jdGlvbihzdHJlYW0pXG57XG4gICAgaWYod2luZG93LndlYmtpdE1lZGlhU3RyZWFtKVxuICAgIHtcbiAgICAgICAgdmFyIGF1ZGlvU3RyZWFtID0gbmV3IHdlYmtpdE1lZGlhU3RyZWFtKCk7XG4gICAgICAgIHZhciB2aWRlb1N0cmVhbSA9IG5ldyB3ZWJraXRNZWRpYVN0cmVhbSgpO1xuICAgICAgICB2YXIgYXVkaW9UcmFja3MgPSBzdHJlYW0uZ2V0QXVkaW9UcmFja3MoKTtcbiAgICAgICAgdmFyIHZpZGVvVHJhY2tzID0gc3RyZWFtLmdldFZpZGVvVHJhY2tzKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXVkaW9UcmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGF1ZGlvU3RyZWFtLmFkZFRyYWNrKGF1ZGlvVHJhY2tzW2ldKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuc2VydmljZS5jcmVhdGVMb2NhbFN0cmVhbShhdWRpb1N0cmVhbSwgXCJhdWRpb1wiKTtcblxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgdmlkZW9UcmFja3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZpZGVvU3RyZWFtLmFkZFRyYWNrKHZpZGVvVHJhY2tzW2ldKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdGhpcy5zZXJ2aWNlLmNyZWF0ZUxvY2FsU3RyZWFtKHZpZGVvU3RyZWFtLCBcInZpZGVvXCIpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgey8vZmlyZWZveFxuICAgICAgICB0aGlzLnNlcnZpY2UuY3JlYXRlTG9jYWxTdHJlYW0oc3RyZWFtLCBcInN0cmVhbVwiKTtcbiAgICB9XG5cbn07XG5cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFJUQ1V0aWxzOyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiJdfQ==
