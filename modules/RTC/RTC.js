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
