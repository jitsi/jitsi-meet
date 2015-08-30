/* global APP */
var EventEmitter = require("events");
var RTCBrowserType = require("./RTCBrowserType");
var RTCUtils = require("./RTCUtils.js");
var LocalStream = require("./LocalStream.js");
var DataChannels = require("./DataChannels");
var MediaStream = require("./MediaStream.js");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var MediaStreamType = require("../../service/RTC/MediaStreamTypes");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
var RTCEvents = require("../../service/RTC/RTCEvents.js");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var UIEvents = require("../../service/UI/UIEvents");
var desktopsharing = require("../desktopsharing/desktopsharing");

function getMediaStreamUsage()
{
    var result = {
        audio: true,
        video: true
    };

    /** There are some issues with the desktop sharing
     * when this property is enabled.
     * WARNING: We must change the implementation to start video/audio if we
     * receive from the focus that the peer is not muted.

     var isSecureConnection = window.location.protocol == "https:";

    if(config.disableEarlyMediaPermissionRequests || !isSecureConnection)
    {
        result = {
            audio: false,
            video: false
        };

    }
    **/

    return result;
}


function RTC()
{
    this.rtcUtils = null;
    this.devices = {
        audio: true,
        video: true
    };
    this.localStreams = [];
    this.remoteStreams = {};
    this.localAudio = null;
    this.localVideo = null;
    this.eventEmitter = new EventEmitter();
    var self = this;
    desktopsharing.addListener(
        function (stream, isUsingScreenStream, callback) {
            self.changeLocalVideo(stream, isUsingScreenStream, callback);
        }, DesktopSharingEventTypes.NEW_STREAM_CREATED);

    // In case of IE we continue from 'onReady' callback
    // passed to RTCUtils constructor. It will be invoked by Temasys plugin
    // once it is initialized.
    var onReady = function () {
        self.eventEmitter.emit(RTCEvents.RTC_READY, true);
    };

    this.rtcUtils = new RTCUtils(this, onReady);

    // Call onReady() if Temasys plugin is not used
    if (!RTCBrowserType.isTemasysPluginUsed()) {
        onReady();
    }
}

RTC.prototype.obtainAudioAndVideoPermissions = function () {
    this.rtcUtils.obtainAudioAndVideoPermissions(
        null, null, getMediaStreamUsage());
}

RTC.prototype.onIncommingCall = function(event) {
    DataChannels.init(event.peerconnection, self.eventEmitter);
}

RTC.prototype.selectedEndpoint = function (id) {
    DataChannels.handleSelectedEndpointEvent(id);
}

RTC.prototype.pinEndpoint = function (id) {
    DataChannels.handlePinnedEndpointEvent(id);
}

RTC.prototype.addStreamListener = function (listener, eventType) {
    this.eventEmitter.on(eventType, listener);
};

RTC.prototype.addListener = function (type, listener) {
    this.eventEmitter.on(type, listener);
};

RTC.prototype.removeStreamListener = function (listener, eventType) {
    if(!(eventType instanceof StreamEventTypes))
        throw "Illegal argument";

    this.removeListener(eventType, listener);
};

RTC.prototype.createLocalStreams = function (streams, change) {
    for (var i = 0; i < streams.length; i++) {
        var localStream = new LocalStream(streams.stream,
            streams.type, this.eventEmitter, streams.videoType,
            streams.isGUMStream);
        this.localStreams.push(localStream);
        if (streams.isMuted === true)
            localStream.setMute(true);

        if (streams.type == "audio") {
            this.localAudio = localStream;
        } else {
            this.localVideo = localStream;
        }
        var eventType = StreamEventTypes.EVENT_TYPE_LOCAL_CREATED;
        if (change)
            eventType = StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED;

        this.eventEmitter.emit(eventType, localStream, streams.isMuted);
    }
    return this.localStreams;
};

RTC.prototype.removeLocalStream = function (stream) {
    for(var i = 0; i < this.localStreams.length; i++) {
        if(this.localStreams[i].getOriginalStream() === stream) {
            delete this.localStreams[i];
            return;
        }
    }
};

RTC.prototype.createRemoteStream = function (data, sid, thessrc) {
    var remoteStream = new MediaStream(data, sid, thessrc,
        RTCBrowserType.getBrowserType(), this.eventEmitter);
    if(data.peerjid)
        return;
    var jid = data.peerjid;
    if(!this.remoteStreams[jid]) {
        this.remoteStreams[jid] = {};
    }
    this.remoteStreams[jid][remoteStream.type]= remoteStream;
    this.eventEmitter.emit(StreamEventTypes.EVENT_TYPE_REMOTE_CREATED, remoteStream);
    return remoteStream;
};

RTC.prototype.getPCConstraints = function () {
    return this.rtcUtils.pc_constraints;
};

RTC.prototype.getUserMediaWithConstraints = function(um, success_callback,
                                     failure_callback, resolution,
                                     bandwidth, fps, desktopStream)
{
    return this.rtcUtils.getUserMediaWithConstraints(um, success_callback,
        failure_callback, resolution, bandwidth, fps, desktopStream);
};

RTC.prototype.attachMediaStream =  function (elSelector, stream) {
    this.rtcUtils.attachMediaStream(elSelector, stream);
};

RTC.prototype.getStreamID = function (stream) {
    return this.rtcUtils.getStreamID(stream);
};

RTC.prototype.getVideoSrc = function (element) {
    return this.rtcUtils.getVideoSrc(element);
};

RTC.prototype.setVideoSrc = function (element, src) {
    this.rtcUtils.setVideoSrc(element, src);
};

RTC.prototype.getVideoElementName = function () {
    return RTCBrowserType.isTemasysPluginUsed() ? 'object' : 'video';
};

RTC.prototype.dispose = function() {
    if (this.rtcUtils) {
        this.rtcUtils = null;
    }
};

RTC.prototype.muteRemoteVideoStream = function (jid, value) {
    var stream;

    if(this.remoteStreams[jid] &&
        this.remoteStreams[jid][MediaStreamType.VIDEO_TYPE]) {
        stream = this.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
    }

    if(!stream)
        return true;

    if (value != stream.muted) {
        stream.setMute(value);
        return true;
    }
    return false;
};

RTC.prototype.switchVideoStreams = function (new_stream) {
    this.localVideo.stream = new_stream;

    this.localStreams = [];

    //in firefox we have only one stream object
    if (this.localAudio.getOriginalStream() != new_stream)
        this.localStreams.push(this.localAudio);
    this.localStreams.push(this.localVideo);
};

RTC.prototype.changeLocalVideo = function (stream, isUsingScreenStream, callback) {
    var oldStream = this.localVideo.getOriginalStream();
    var type = (isUsingScreenStream ? "screen" : "camera");
    var localCallback = callback;

    if(this.localVideo.isMuted() && this.localVideo.videoType !== type) {
        localCallback = function() {
            APP.xmpp.setVideoMute(false, function(mute) {
                self.eventEmitter.emit(RTCEvents.VIDEO_MUTE, mute);
            });
            
            callback();
        };
    }
    // FIXME: Workaround for FF/IE/Safari
    if (stream && stream.videoStream) {
        stream = stream.videoStream;
    }
    var videoStream = this.rtcUtils.createStream(stream, true);
    this.localVideo = this.createLocalStream(videoStream, "video", true, type);
    // Stop the stream to trigger onended event for old stream
    oldStream.stop();

    this.switchVideoStreams(videoStream, oldStream);

    APP.xmpp.switchStreams(videoStream, oldStream,localCallback);
};

RTC.prototype.changeLocalAudio = function (stream, callback) {
    var oldStream = this.localAudio.getOriginalStream();
    var newStream = this.rtcUtils.createStream(stream);
    this.localAudio = this.createLocalStream(newStream, "audio", true);
    // Stop the stream to trigger onended event for old stream
    oldStream.stop();
    APP.xmpp.switchStreams(newStream, oldStream, callback, true);
};

RTC.prototype.isVideoMuted = function (jid) {
    if (jid === APP.xmpp.myJid()) {
        var localVideo = APP.RTC.localVideo;
        return (!localVideo || localVideo.isMuted());
    } else {
        if (!this.remoteStreams[jid] ||
            !this.remoteStreams[jid][MediaStreamType.VIDEO_TYPE]) {
            return null;
        }
        return this.remoteStreams[jid][MediaStreamType.VIDEO_TYPE].muted;
    }
};

RTC.prototype.setVideoMute = function (mute, callback, options) {
    if (!this.localVideo)
        return;

    if (mute == this.localVideo.isMuted())
    {
        APP.xmpp.sendVideoInfoPresence(mute);
        if (callback)
            callback(mute);
    }
    else
    {
        this.localVideo.setMute(mute);
        APP.xmpp.setVideoMute(
            mute,
            callback,
            options);
    }
};

RTC.prototype.setDeviceAvailability = function (devices) {
    if(!devices)
        return;
    if(devices.audio === true || devices.audio === false)
        this.devices.audio = devices.audio;
    if(devices.video === true || devices.video === false)
        this.devices.video = devices.video;
    this.eventEmitter.emit(RTCEvents.AVAILABLE_DEVICES_CHANGED, this.devices);
};

module.exports = RTC;
