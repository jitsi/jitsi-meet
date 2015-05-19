var EventEmitter = require("events");
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

var eventEmitter = new EventEmitter();


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

var RTC = {
    rtcUtils: null,
    devices: {
        audio: true,
        video: true
    },
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
    createLocalStream: function (stream, type, change, videoType, isMuted, isGUMStream) {

        var localStream =  new LocalStream(stream, type, eventEmitter, videoType, isGUMStream);
        //in firefox we have only one stream object
        if(this.localStreams.length == 0 ||
            this.localStreams[0].getOriginalStream() != stream)
            this.localStreams.push(localStream);
        if(isMuted === true)
            localStream.setMute(false);

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

        eventEmitter.emit(eventType, localStream, isMuted);
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
        APP.xmpp.addListener(XMPPEvents.STREAMS_CHANGED, function (jid, changedStreams) {
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
        this.rtcUtils.obtainAudioAndVideoPermissions(
            null, null, getMediaStreamUsage());
    },
    muteRemoteVideoStream: function (jid, value) {
        var stream;

        if(this.remoteStreams[jid] &&
            this.remoteStreams[jid][MediaStreamType.VIDEO_TYPE])
        {
            stream = this.remoteStreams[jid][MediaStreamType.VIDEO_TYPE];
        }

        if(!stream)
            return true;

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
        var localCallback = callback;
        if(this.localVideo.isMuted() && this.localVideo.videoType !== type)
        {
            localCallback = function() {
                APP.xmpp.setVideoMute(false, APP.UI.setVideoMuteButtonsState);
                callback();
            };
        }
        var videoStream = this.rtcUtils.createStream(stream, true);
        this.localVideo = this.createLocalStream(videoStream, "video", true, type);
        // Stop the stream to trigger onended event for old stream
        oldStream.stop();
        APP.xmpp.switchStreams(videoStream, oldStream,localCallback);
    },
    changeLocalAudio: function (stream, callback) {
        var oldStream = this.localAudio.getOriginalStream();
        var newStream = this.rtcUtils.createStream(stream);
        this.localAudio = this.createLocalStream(newStream, "audio", true);
        // Stop the stream to trigger onended event for old stream
        oldStream.stop();
        APP.xmpp.switchStreams(newStream, oldStream, callback, true);
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
    },
    setVideoMute: function(mute, callback, options) {
        if(!this.localVideo)
            return;

        if (mute == APP.RTC.localVideo.isMuted())
        {
            APP.xmpp.sendVideoInfoPresence(mute);
            if(callback)
                callback(mute);
        }
        else
        {
            APP.RTC.localVideo.setMute(!mute);
            APP.xmpp.setVideoMute(
                mute,
                callback,
                options);
        }
    },
    setDeviceAvailability: function (devices) {
        if(!devices)
            return;
        if(devices.audio === true || devices.audio === false)
            this.devices.audio = devices.audio;
        if(devices.video === true || devices.video === false)
            this.devices.video = devices.video;
        eventEmitter.emit(RTCEvents.AVAILABLE_DEVICES_CHANGED, this.devices);
    }
};

module.exports = RTC;
