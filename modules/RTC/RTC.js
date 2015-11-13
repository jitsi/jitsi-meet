/* global APP */
var EventEmitter = require("events");
var RTCBrowserType = require("./RTCBrowserType");
var RTCUtils = require("./RTCUtils.js");
var JitsiTrack = require("./JitsiTrack");
var JitsiLocalTrack = require("./JitsiLocalTrack.js");
var DataChannels = require("./DataChannels");
var JitsiRemoteTrack = require("./JitsiRemoteTrack.js");
var DesktopSharingEventTypes
    = require("../../service/desktopsharing/DesktopSharingEventTypes");
var MediaStreamType = require("../../service/RTC/MediaStreamTypes");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
var RTCEvents = require("../../service/RTC/RTCEvents.js");
var desktopsharing = require("../desktopsharing/desktopsharing");

function RTC(room, options) {
    this.room = room;
    this.localStreams = [];
    this.remoteStreams = {};
    this.localAudio = null;
    this.localVideo = null;
    this.eventEmitter = new EventEmitter();
    var self = this;
    this.options = options || {};
    desktopsharing.addListener(
        function (stream, isUsingScreenStream, callback) {
            self.changeLocalVideo(stream, isUsingScreenStream, callback);
        }, DesktopSharingEventTypes.NEW_STREAM_CREATED);
    room.addPresenceListener("videomuted", function (values, from) {
        if(self.remoteStreams[from])
            self.remoteStreams[from][JitsiTrack.VIDEO].setMute(values.value == "true");
    });
    room.addPresenceListener("audiomuted", function (values, from) {
        if(self.remoteStreams[from])
            self.remoteStreams[from][JitsiTrack.AUDIO].setMute(values.value == "true");
    });
}

/**
 * Creates the local MediaStreams.
 * @param options object for options (NOTE: currently only list of devices and resolution are supported)
 * @param dontCreateJitsiTrack if <tt>true</tt> objects with the following structure {stream: the Media Stream,
  * type: "audio" or "video", videoType: "camera" or "desktop"}
 * will be returned trough the Promise, otherwise JitsiTrack objects will be returned.
 * @returns {*} Promise object that will receive the new JitsiTracks
 */
RTC.obtainAudioAndVideoPermissions = function (options, dontCreateJitsiTrack) {
    return RTCUtils.obtainAudioAndVideoPermissions(
        options.devices, options.resolution, dontCreateJitsiTrack);
}

RTC.prototype.onIncommingCall = function(event) {
    if(this.options.config.openSctp)
        this.dataChannels = new DataChannels(event.peerconnection, this.eventEmitter);
    for(var i = 0; i < this.localStreams.length; i++)
        if(this.localStreams[i])
        {
            this.room.addStream(this.localStreams[i].getOriginalStream(), function () {});
        }
}

RTC.prototype.selectedEndpoint = function (id) {
    if(this.dataChannels)
        this.dataChannels.handleSelectedEndpointEvent(id);
}

RTC.prototype.pinEndpoint = function (id) {
    if(this.dataChannels)
        this.dataChannels.handlePinnedEndpointEvent(id);
}

RTC.prototype.addListener = function (type, listener) {
    this.eventEmitter.on(type, listener);
};

RTC.prototype.removeListener = function (eventType, listener) {
    this.eventEmitter.removeListener(eventType, listener);
};

RTC.addListener = function (eventType, listener) {
    RTCUtils.addListener(eventType, listener);
}

RTC.removeListener = function (eventType, listener) {
    RTCUtils.eventEmitter.removeListener(RTCEvents.RTC_READY, listener);
    RTCUtils.removeListener(eventType, listener)
}

RTC.isRTCReady = function () {
    return RTCUtils.isRTCReady();
}

RTC.init = function (options) {
    RTCUtils.init(options || {});
}

RTC.getDeviceAvailability = function () {
    return RTCUtils.getDeviceAvailability();
}

RTC.prototype.addLocalStream = function (stream) {
    this.localStreams.push(stream);
    stream._setRTC(this);

    if (stream.type == "audio") {
        this.localAudio = stream;
    } else {
        this.localVideo = stream;
    }
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
    var remoteStream = new JitsiRemoteTrack(this, data, sid, thessrc,
        this.eventEmitter);
    if(!data.peerjid)
        return;
    var jid = data.peerjid;
    if(!this.remoteStreams[jid]) {
        this.remoteStreams[jid] = {};
    }
    this.remoteStreams[jid][remoteStream.type]= remoteStream;
    this.eventEmitter.emit(StreamEventTypes.EVENT_TYPE_REMOTE_CREATED, remoteStream);
    return remoteStream;
};

RTC.getPCConstraints = function () {
    return RTCUtils.pc_constraints;
};

RTC.getUserMediaWithConstraints = function(um, success_callback,
                                     failure_callback, resolution,
                                     bandwidth, fps, desktopStream)
{
    return RTCUtils.getUserMediaWithConstraints(this, um, success_callback,
        failure_callback, resolution, bandwidth, fps, desktopStream);
};

RTC.attachMediaStream =  function (elSelector, stream) {
    RTCUtils.attachMediaStream(elSelector, stream);
};

RTC.getStreamID = function (stream) {
    return RTCUtils.getStreamID(stream);
};

RTC.getVideoSrc = function (element) {
    return RTCUtils.getVideoSrc(element);
};

RTC.setVideoSrc = function (element, src) {
    RTCUtils.setVideoSrc(element, src);
};

RTC.prototype.getVideoElementName = function () {
    return RTCBrowserType.isTemasysPluginUsed() ? 'object' : 'video';
};

RTC.prototype.dispose = function() {
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

/**
 * Creates <tt>JitsiTrack</tt> instance and replaces it with the local video.
 * The method also handles the sdp changes.
 * @param stream the new MediaStream received by the browser.
 * @param isUsingScreenStream <tt>true</tt> if the stream is for desktop stream.
 * @param callback - function that will be called after the operation is completed.
 */
RTC.prototype.changeLocalVideo = function (stream, isUsingScreenStream, callback) {
    var oldStream = this.localVideo.getOriginalStream();
    var type = (isUsingScreenStream ? "screen" : "camera");
    var localCallback = callback;

    if(this.localVideo.isMuted() && this.localVideo.videoType !== type) {
        localCallback = function() {
            this.room.setVideoMute(false, function(mute) {
                this.eventEmitter.emit(RTCEvents.VIDEO_MUTE, mute);
            }.bind(this));

            callback();
        };
    }
    // FIXME: Workaround for FF/IE/Safari
    if (stream && stream.videoStream) {
        stream = stream.videoStream;
    }
    var videoStream = RTCUtils.createStream(stream, true);
    this.localVideo = this.createLocalStream(videoStream, "video", true, type);
    // Stop the stream to trigger onended event for old stream
    oldStream.stop();

    this.switchVideoStreams(videoStream, oldStream);

    this.room.switchStreams(videoStream, oldStream,localCallback);
};


/**
 * Creates <tt>JitsiTrack</tt> instance and replaces it with the local audio.
 * The method also handles the sdp changes.
 * @param stream the new MediaStream received by the browser.
 * @param callback - function that will be called after the operation is completed.
 */
RTC.prototype.changeLocalAudio = function (stream, callback) {
    var oldStream = this.localAudio.getOriginalStream();
    var newStream = RTCUtils.createStream(stream);
    this.localAudio = this.createLocalStream(newStream, "audio", true);
    // Stop the stream to trigger onended event for old stream
    oldStream.stop();
    this.room.switchStreams(newStream, oldStream, callback, true);
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
        this.room.setVideoMute(
            mute,
            callback,
            options);
    }
};

module.exports = RTC;
