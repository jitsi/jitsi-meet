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
var RTCEvents = require("../../service/RTC/RTCEvents.js");

function createLocalTracks(streams) {
    var newStreams = []
    for (var i = 0; i < streams.length; i++) {
        var localStream = new JitsiLocalTrack(streams[i].stream,
            streams[i].videoType, streams[i].resolution);
        newStreams.push(localStream);
        if (streams[i].isMuted === true)
            localStream.setMute(true);
    }
    return newStreams;
}

function RTC(room, options) {
    this.room = room;
    this.localStreams = [];
    //FIXME: we should start removing those streams.
    //FIXME: We should support multiple streams per jid.
    this.remoteStreams = {};
    this.localAudio = null;
    this.localVideo = null;
    this.eventEmitter = new EventEmitter();
    var self = this;
    this.options = options || {};
    room.addPresenceListener("videomuted", function (values, from) {
        if(self.remoteStreams[from]) {
            // If there is no video track, but we receive it is muted,
            // we need to create a dummy track which we will mute, so we can
            // notify interested about the muting
            if(!self.remoteStreams[from][JitsiTrack.VIDEO]) {
                var track = self.createRemoteStream(
                    {peerjid:room.roomjid + "/" + from,
                     videoType:"camera",
                     jitsiTrackType:JitsiTrack.VIDEO},
                    null, null);
                self.eventEmitter
                    .emit(RTCEvents.FAKE_VIDEO_TRACK_CREATED, track);
            }

            self.remoteStreams[from][JitsiTrack.VIDEO]
                .setMute(values.value == "true");
        }
    });
    room.addPresenceListener("audiomuted", function (values, from) {
        if(self.remoteStreams[from]) {
            self.remoteStreams[from][JitsiTrack.AUDIO]
                .setMute(values.value == "true");
        }
    });
}

/**
 * Creates the local MediaStreams.
 * @param {Object} [options] optional parameters
 * @param {Array} options.devices the devices that will be requested
 * @param {string} options.resolution resolution constraints
 * @param {bool} options.dontCreateJitsiTrack if <tt>true</tt> objects with the following structure {stream: the Media Stream,
 * type: "audio" or "video", videoType: "camera" or "desktop"}
 * will be returned trough the Promise, otherwise JitsiTrack objects will be returned.
 * @param {string} options.cameraDeviceId
 * @param {string} options.micDeviceId
 * @returns {*} Promise object that will receive the new JitsiTracks
 */
RTC.obtainAudioAndVideoPermissions = function (options) {
    return RTCUtils.obtainAudioAndVideoPermissions(options).then(createLocalTracks);
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
    RTCUtils.removeListener(eventType, listener)
}

RTC.isRTCReady = function () {
    return RTCUtils.isRTCReady();
}

RTC.init = function (options) {
    this.options = options || {};
    return RTCUtils.init(this.options);
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

/**
 * Set mute for all local audio streams attached to the conference.
 * @param value the mute value
 */
RTC.prototype.setAudioMute = function (value) {
    for(var i = 0; i < this.localStreams.length; i++) {
        var stream = this.localStreams[i];
        if(stream.getType() !== "audio") {
            continue;
        }
        stream._setMute(value);
    }
}

RTC.prototype.removeLocalStream = function (track) {
    var pos = this.localStreams.indexOf(track);
    if (pos > -1) {
        this.localStreams.splice(pos, 1);
    }
};

RTC.prototype.createRemoteStream = function (data, sid, thessrc) {
    var remoteStream = new JitsiRemoteTrack(this, data, sid, thessrc);
    if(!data.peerjid)
        return;
    var jid = Strophe.getResourceFromJid(data.peerjid);
    if(!this.remoteStreams[jid]) {
        this.remoteStreams[jid] = {};
    }
    this.remoteStreams[jid][remoteStream.type]= remoteStream;
    return remoteStream;
};

RTC.getPCConstraints = function () {
    return RTCUtils.pc_constraints;
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

/**
 * Returns true if retrieving the the list of input devices is supported and
 * false if not.
 */
RTC.isDeviceListAvailable = function () {
    return RTCUtils.isDeviceListAvailable();
};

/**
 * Returns true if changing the camera / microphone device is supported and
 * false if not.
 */
RTC.isDeviceChangeAvailable = function () {
    return RTCUtils.isDeviceChangeAvailable();
}
/**
 * Allows to receive list of available cameras/microphones.
 * @param {function} callback would receive array of devices as an argument
 */
RTC.enumerateDevices = function (callback) {
    RTCUtils.enumerateDevices(callback);
};

RTC.setVideoSrc = function (element, src) {
    RTCUtils.setVideoSrc(element, src);
};

/**
 * A method to handle stopping of the stream.
 * One point to handle the differences in various implementations.
 * @param mediaStream MediaStream object to stop.
 */
RTC.stopMediaStream = function (mediaStream) {
    RTCUtils.stopMediaStream(mediaStream);
};

/**
 * Returns whether the desktop sharing is enabled or not.
 * @returns {boolean}
 */
RTC.isDesktopSharingEnabled = function () {
    return RTCUtils.isDesktopSharingEnabled();
}

RTC.prototype.getVideoElementName = function () {
    return RTCBrowserType.isTemasysPluginUsed() ? 'object' : 'video';
};

RTC.prototype.dispose = function() {
};

RTC.prototype.switchVideoStreams = function (newStream) {
    this.localVideo.stream = newStream;

    this.localStreams = [];

    //in firefox we have only one stream object
    if (this.localAudio.getOriginalStream() != newStream)
        this.localStreams.push(this.localAudio);
    this.localStreams.push(this.localVideo);
};

RTC.prototype.setAudioLevel = function (jid, audioLevel) {
    if(!jid)
        return;
    var resource = Strophe.getResourceFromJid(jid);
    if(this.remoteStreams[resource] && this.remoteStreams[resource][JitsiTrack.AUDIO])
        this.remoteStreams[resource][JitsiTrack.AUDIO].setAudioLevel(audioLevel);
}
module.exports = RTC;
