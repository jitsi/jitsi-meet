/* global APP */
var MediaStreamType = require("../../service/RTC/MediaStreamTypes");
var RTCEvents = require("../../service/RTC/RTCEvents");
var RTCBrowserType = require("./RTCBrowserType");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");

/**
 * This implements 'onended' callback normally fired by WebRTC after the stream
 * is stopped. There is no such behaviour yet in FF, so we have to add it.
 * @param stream original WebRTC stream object to which 'onended' handling
 *               will be added.
 */
function implementOnEndedHandling(localStream) {
    var stream = localStream.getOriginalStream();
    var originalStop = stream.stop;
    stream.stop = function () {
        originalStop.apply(stream);
        if (localStream.isActive()) {
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
    if (MediaStreamType.AUDIO_TYPE === type) {
        this.getTracks = function () {
            return self.stream.getAudioTracks();
        };
    } else {
        this.getTracks = function () {
            return self.stream.getVideoTracks();
        };
    }

    APP.RTC.addMediaStreamInactiveHandler(
        this.stream,
        function () {
            self.streamEnded();
        });

    if (RTCBrowserType.isFirefox()) {
        implementOnEndedHandling(this);
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
    return MediaStreamType.AUDIO_TYPE === this.type;
};

LocalStream.prototype.isVideoStream = function () {
    return MediaStreamType.VIDEO_TYPE === this.type;
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
            APP.RTC.stopMediaStream(this.stream);
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
        if (!this.isActive())
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

/**
 * Checks whether the MediaStream is avtive/not ended.
 * When there is no check for active we don't have information and so
 * will return that stream is active (in case of FF).
 * @returns {boolean} whether MediaStream is active.
 */
LocalStream.prototype.isActive = function () {
    if((typeof this.stream.active !== "undefined"))
        return this.stream.active;
    else
        return true;
};

module.exports = LocalStream;
