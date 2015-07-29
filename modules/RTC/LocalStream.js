/* global APP */
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
var RTCEvents = require("../../service/RTC/RTCEvents");

function LocalStream(stream, type, eventEmitter, videoType, isGUMStream) {
    this.stream = stream;
    this.eventEmitter = eventEmitter;
    this.type = type;
    this.videoType = videoType;
    this.isGUMStream = true;
    if(isGUMStream === false)
        this.isGUMStream = isGUMStream;
    var self = this;

    this.stream.onended = function() {
        self.streamEnded();
    };
}

LocalStream.prototype.getTracks = function () {
    return this.isAudioStream() ?
        this.stream.getAudioTracks() : this.stream.getVideoTracks();
};

LocalStream.prototype.streamEnded = function () {
    this.eventEmitter.emit(StreamEventTypes.EVENT_TYPE_LOCAL_ENDED, this);
};

LocalStream.prototype.getOriginalStream = function() {
    return this.stream;
};

LocalStream.prototype.isAudioStream = function () {
    return this.type === "audio";
};

/**
 * Gets the correct "mute" RTC Event depending on the stream type.
 * @returns {string}
 */
LocalStream.prototype.getMuteEvent = function () {
    return this.isAudioStream() ? RTCEvents.AUDIO_MUTE : RTCEvents.VIDEO_MUTE;
};

// Mutes (if 'mute' is true) or unmutes (if 'mute' is false) the stream.
LocalStream.prototype.setMute = function(mute) {
    if((window.location.protocol != "https:" && this.isGUMStream) ||
        (this.isAudioStream() && this.isGUMStream) ||
        this.videoType === "screen") {
        var tracks = this.getTracks();

        for (var idx = 0; idx < tracks.length; idx++) {
            tracks[idx].enabled = !mute;
        }
        this.eventEmitter.emit(this.getMuteEvent(), mute);
    } else {
        if (mute === true) {
            APP.xmpp.removeStream(this.stream);
            this.stream.stop();
            this.eventEmitter.emit(this.getMuteEvent(), true);
        } else {
            var self = this;
            APP.RTC.rtcUtils.obtainAudioAndVideoPermissions(
                (this.isAudioStream() ? ["audio"] : ["video"]),
                function (stream) {
                    if(self.isAudioStream()) {
                        APP.RTC.changeLocalAudio(stream,
                            function () {
                                self.eventEmitter.emit(self.getMuteEvent(), true);
                            });
                    } else {
                        APP.RTC.changeLocalVideo(stream, false,
                            function () {
                                self.eventEmitter.emit(self.getMuteEvent, true);
                            });
                    }
                });
        }
    }
};

LocalStream.prototype.isMuted = function () {
    if (!this.isAudioStream() && this.stream.ended)
        return true;

    var tracks = this.getTracks();
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
