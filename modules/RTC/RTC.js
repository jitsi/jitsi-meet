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
        var jid = data.peerjid || APP.xmpp.myJid();
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
                    videoStream.videoType = changedStreams[i].type;
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
        if (APP.xmpp.myJid() &&
            APP.xmpp.myResource() === jid) {
            // local video
            stream = this.localVideo;
        } else {
            var peerJid = APP.xmpp.findJidFromResource(jid);
            var peerStreams = this.remoteStreams[peerJid];
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
