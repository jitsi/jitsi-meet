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
    // Exposes DataChannels to public consumption (e.g. jitsi-meet-torture)
    // without the necessity to require the module.
    "DataChannels": DataChannels,

    rtcUtils: null,
    devices: {
        audio: true,
        video: true
    },
    remoteStreams: {},
    localAudio: null,
    localVideo: null,
    addStreamListener: function (listener, eventType) {
        eventEmitter.on(eventType, listener);
    },
    addListener: function (type, listener) {
        eventEmitter.on(type, listener);
    },
    removeListener: function(type, listener){
        eventEmitter.removeListener(type, listener);
    },
    removeStreamListener: function (listener, eventType) {
        if(!(eventType instanceof StreamEventTypes))
            throw "Illegal argument";

        eventEmitter.removeListener(eventType, listener);
    },
    createLocalStream: function (stream, type, change, videoType,
                                 isMuted, isGUMStream) {

        var localStream =
            new LocalStream(stream, type, eventEmitter, videoType, isGUMStream);
        if(isMuted === true)
            localStream.setMute(true);

        if (MediaStreamType.AUDIO_TYPE === type) {
            this.localAudio = localStream;
        } else {
            this.localVideo = localStream;
        }
        var eventType = StreamEventTypes.EVENT_TYPE_LOCAL_CREATED;
        if(change)
            eventType = StreamEventTypes.EVENT_TYPE_LOCAL_CHANGED;

        eventEmitter.emit(eventType, localStream, isMuted);
        return localStream;
    },
    createRemoteStream: function (data, ssrc) {
        var jid = data.peerjid || APP.xmpp.myJid();

        // check the video muted state from last stored presence if any
        var muted = false;
        var pres = APP.xmpp.getLastPresence(jid);
        if (pres && pres.videoMuted) {
            muted = pres.videoMuted;
        }

        var self = this;
        [MediaStreamType.AUDIO_TYPE, MediaStreamType.VIDEO_TYPE].forEach(
            function (type) {
            var tracks =
                type == MediaStreamType.AUDIO_TYPE
                ? data.stream.getAudioTracks() : data.stream.getVideoTracks();
            if (!tracks || !Array.isArray(tracks) || !tracks.length) {
                console.log("Not creating a(n) " + type + " stream: no tracks");
                return;
            }

            var remoteStream = new MediaStream(data, ssrc,
                RTCBrowserType.getBrowserType(), eventEmitter, muted, type);

            if (!self.remoteStreams[jid]) {
                self.remoteStreams[jid] = {};
            }
            self.remoteStreams[jid][type] = remoteStream;
            eventEmitter.emit(StreamEventTypes.EVENT_TYPE_REMOTE_CREATED,
                remoteStream);
        });
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
    attachMediaStream:  function (elSelector, stream) {
        this.rtcUtils.attachMediaStream(elSelector, stream);
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
    getVideoElementName: function () {
        return RTCBrowserType.isTemasysPluginUsed() ? 'object' : 'video';
    },
    dispose: function() {
        APP.UI.removeListener(UIEvents.SELECTED_ENDPOINT,
            DataChannels.handleSelectedEndpointEvent);
        APP.UI.removeListener(UIEvents.PINNED_ENDPOINT,
            DataChannels.handlePinnedEndpointEvent);
        if (this.rtcUtils) {
            this.rtcUtils = null;
        }
        if (eventEmitter) {
            eventEmitter.removeAllListeners();
        }
    },
    stop:  function () {
        this.dispose();
    },
    start: function () {
        var self = this;
        APP.desktopsharing.addListener(
            DesktopSharingEventTypes.NEW_STREAM_CREATED,
            function (stream, isUsingScreenStream, callback) {
                self.changeLocalVideo(stream, isUsingScreenStream, callback);
        });
        APP.xmpp.addListener(XMPPEvents.CALL_INCOMING, function(event) {
            DataChannels.init(event.peerconnection, eventEmitter);
        });
        APP.UI.addListener(UIEvents.SELECTED_ENDPOINT,
            DataChannels.handleSelectedEndpointEvent);
        APP.UI.addListener(UIEvents.PINNED_ENDPOINT,
            DataChannels.handlePinnedEndpointEvent);

        // In case of IE we continue from 'onReady' callback
        // passed to RTCUtils constructor. It will be invoked by Temasys plugin
        // once it is initialized.
        var onReady = function () {
            eventEmitter.emit(RTCEvents.RTC_READY, true);
            self.rtcUtils.obtainAudioAndVideoPermissions(
                null, null, getMediaStreamUsage());
        };

        this.rtcUtils = new RTCUtils(this, eventEmitter, onReady);

        // Call onReady() if Temasys plugin is not used
        if (!RTCBrowserType.isTemasysPluginUsed()) {
            onReady();
        }
    },
    muteRemoteVideoStream: function (jid, value) {
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
    },
    changeLocalVideo: function (stream, isUsingScreenStream, callback) {
        var oldStream = this.localVideo.getOriginalStream();
        var type = (isUsingScreenStream ? "screen" : "camera");
        var localCallback = callback;
        if(this.localVideo.isMuted() && this.localVideo.videoType !== type) {
            localCallback = function() {
                APP.xmpp.setVideoMute(false, function(mute) {
                    eventEmitter.emit(RTCEvents.VIDEO_MUTE, mute);
                });

                callback();
            };
        }
        // FIXME: Workaround for FF/IE/Safari
        if (stream && stream.videoStream) {
            stream = stream.videoStream;
        }
        var videoStream = this.rtcUtils.createStream(stream, true);
        this.localVideo =
            this.createLocalStream(videoStream, "video", true, type);
        // Stop the stream
        this.stopMediaStream(oldStream);

        APP.xmpp.switchStreams(videoStream, oldStream,localCallback);
    },
    changeLocalAudio: function (stream, callback) {
        var oldStream = this.localAudio.getOriginalStream();
        var newStream = this.rtcUtils.createStream(stream);
        this.localAudio
            = this.createLocalStream(
                    newStream, MediaStreamType.AUDIO_TYPE, true);
        // Stop the stream
        this.stopMediaStream(oldStream);
        APP.xmpp.switchStreams(newStream, oldStream, callback, true);
    },
    isVideoMuted: function (jid) {
        if (jid === APP.xmpp.myJid()) {
            var localVideo = APP.RTC.localVideo;
            return (!localVideo || localVideo.isMuted());
        } else {
            if (!APP.RTC.remoteStreams[jid] ||
                !APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE]) {
                return null;
            }
            return APP.RTC.remoteStreams[jid][MediaStreamType.VIDEO_TYPE].muted;
        }
    },
    setVideoMute: function (mute, callback, options) {
        if (!this.localVideo)
            return;

        if (mute == APP.RTC.localVideo.isMuted())
        {
            APP.xmpp.sendVideoInfoPresence(mute);
            if (callback)
                callback(mute);
        }
        else
        {
            APP.RTC.localVideo.setMute(mute);
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
    },
    /**
     * A method to handle stopping of the stream.
     * One point to handle the differences in various implementations.
     * @param mediaStream MediaStream object to stop.
     */
    stopMediaStream: function (mediaStream) {
        mediaStream.getTracks().forEach(function (track) {
            // stop() not supported with IE
            if (track.stop) {
                track.stop();
            }
        });

        // leave stop for implementation still using it
        if (mediaStream.stop) {
            mediaStream.stop();
        }
    },
    /**
     * Adds onended/inactive handler to a MediaStream.
     * @param mediaStream a MediaStream to attach onended/inactive handler
     * @param handler the handler
     */
    addMediaStreamInactiveHandler: function (mediaStream, handler) {
        if(RTCBrowserType.isTemasysPluginUsed()) {
            // themasys
            mediaStream.attachEvent('ended', function () {
                handler(mediaStream);
            });
        }
        else {
            if(typeof mediaStream.active !== "undefined")
                mediaStream.oninactive = handler;
            else
                mediaStream.onended = handler;
        }
    },
    /**
     * Removes onended/inactive handler.
     * @param mediaStream the MediaStream to remove the handler from.
     * @param handler the handler to remove.
     */
    removeMediaStreamInactiveHandler: function (mediaStream, handler) {
        if(RTCBrowserType.isTemasysPluginUsed()) {
            // themasys
            mediaStream.detachEvent('ended', handler);
        }
        else {
            if(typeof mediaStream.active !== "undefined")
                mediaStream.oninactive = null;
            else
                mediaStream.onended = null;
        }
    }
};

module.exports = RTC;
