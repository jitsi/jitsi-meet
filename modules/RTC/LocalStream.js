/* global APP */
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
var RTCEvents = require("../../service/RTC/RTCEvents");
var RTCBrowserType = require("./RTCBrowserType");

/**
 * This implements 'onended' callback normally fired by WebRTC after the stream
 * is stopped. There is no such behaviour yet in FF, so we have to add it.
 * @param stream original WebRTC stream object to which 'onended' handling
 *               will be added.
 */
function implementOnEndedHandling(stream) {
    var originalStop = stream.stop;
    stream.stop = function () {
        originalStop.apply(stream);
        if (!stream.ended) {
            stream.ended = true;
            stream.onended();
        }
    };
}

function LocalStream(stream, type, eventEmitter, videoType, isGUMStream) {
    this.stream = stream;
    this.eventEmitter = eventEmitter;
    this.type = type;
    this.videoType = videoType;
    this.isGUMStream = true;
    if(isGUMStream === false)
        this.isGUMStream = isGUMStream;
    var self = this;
    if(type == "audio") {
        this.getTracks = function () {
            return self.stream.getAudioTracks();
        };
    } else {
        this.getTracks = function () {
            return self.stream.getVideoTracks();
        };
    }

    this.stream.onended = function () {
        self.streamEnded();
    };
    if (RTCBrowserType.isFirefox()) {
        implementOnEndedHandling(this.stream);
    }
}

LocalStream.prototype.streamEnded = function () {
    this.eventEmitter.emit(StreamEventTypes.EVENT_TYPE_LOCAL_ENDED, this);
};

LocalStream.prototype.getOriginalStream = function()
{
    return this.stream;
};

LocalStream.prototype.isAudioStream = function () {
    return this.type === "audio";
};

LocalStream.prototype.setMute = function (mute)
{
    var isAudio = this.isAudioStream();
    var eventType = isAudio ? RTCEvents.AUDIO_MUTE : RTCEvents.VIDEO_MUTE;

    if ((window.location.protocol != "https:" && this.isGUMStream) ||
        (isAudio && this.isGUMStream) || this.videoType === "screen" ||
        // FIXME FF does not support 'removeStream' method used to mute
        RTCBrowserType.isFirefox()) {

        var tracks = this.getTracks();
        for (var idx = 0; idx < tracks.length; idx++) {
            tracks[idx].enabled = !mute;
        }
        this.eventEmitter.emit(eventType, mute);
    } else {
        if (mute) {
            APP.xmpp.removeStream(this.stream);
            this.stream.stop();
            this.eventEmitter.emit(eventType, true);
        } else {
            var self = this;
            APP.RTC.rtcUtils.obtainAudioAndVideoPermissions(
                (this.isAudioStream() ? ["audio"] : ["video"]),
                function (stream) {
                    if (isAudio) {
                        APP.RTC.changeLocalAudio(stream,
                            function () {
                                self.eventEmitter.emit(eventType, false);
                            });
                    } else {
                        APP.RTC.changeLocalVideo(stream, false,
                            function () {
                                self.eventEmitter.emit(eventType, false);
                            });
                    }
                });
        }
    }
};

LocalStream.prototype.isMuted = function () {
    var tracks = [];
    if (this.isAudioStream()) {
        tracks = this.stream.getAudioTracks();
    } else {
        if (this.stream.ended)
            return true;
        tracks = this.stream.getVideoTracks();
    }
    for (var idx = 0; idx < tracks.length; idx++) {
        if(tracks[idx].enabled)
            return false;
    }
    return true;
};

LocalStream.prototype.getId = function () {
    return this.stream.getTracks()[0].id;
};

module.exports = LocalStream;
