var JitsiTrack = require("./JitsiTrack");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");
var RTCEvents = require("../../service/RTC/RTCEvents");

/**
 * Represents a single media track (either audio or video).
 * @constructor
 */
function JitsiLocalTrack(RTC, stream, eventEmitter, videoType, isGUMStream)
{
    JitsiTrack.call(this, RTC, stream);
    this.eventEmitter = eventEmitter;
    this.videoType = videoType;
    this.isGUMStream = true;
    if(isGUMStream === false)
        this.isGUMStream = isGUMStream;
    this.stream.onended = function () {
        this.eventEmitter.emit(StreamEventTypes.EVENT_TYPE_LOCAL_ENDED, this);
    }.bind(this);
}

JitsiLocalTrack.prototype = Object.create(JitsiTrack.prototype);
JitsiLocalTrack.prototype.constructor = JitsiLocalTrack;

/**
 * Mutes / unmutes the track.
 * @param mute {boolean} if true the track will be muted. Otherwise the track will be unmuted.
 */
JitsiLocalTrack.prototype._setMute = function (mute) {
    var isAudio = this.type === JitsiTrack.AUDIO;
    var eventType = isAudio ? RTCEvents.AUDIO_MUTE : RTCEvents.VIDEO_MUTE;

    if ((window.location.protocol != "https:" && this.isGUMStream) ||
        (isAudio && this.isGUMStream) || this.videoType === "screen" ||
        // FIXME FF does not support 'removeStream' method used to mute
        RTCBrowserType.isFirefox()) {

        var tracks = this._getTracks();
        for (var idx = 0; idx < tracks.length; idx++) {
            tracks[idx].enabled = !mute;
        }
        if(isAudio)
            this.rtc.room.setAudioMute(mute);
        else
            this.rtc.room.setVideoMute(mute);
        this.eventEmitter.emit(eventType, mute);
    } else {
        if (mute) {
            this.rtc.room.removeStream(this.stream);
            this.stream.stop();
            if(isAudio)
                this.rtc.room.setAudioMute(mute);
            else
                this.rtc.room.setVideoMute(mute);
            this.eventEmitter.emit(eventType, true);
        } else {
            var self = this;
            this.rtc.obtainAudioAndVideoPermissions(
                {devices: (this.isAudioStream() ? ["audio"] : ["video"])})
                .then(function (stream) {
                    if (isAudio) {
                        self.rtc.changeLocalAudio(stream,
                            function () {
                                this.rtc.room.setAudioMute(mute);
                                self.eventEmitter.emit(eventType, false);
                            });
                    } else {
                        self.rtc.changeLocalVideo(stream, false,
                            function () {
                                this.rtc.room.setVideoMute(mute);
                                self.eventEmitter.emit(eventType, false);
                            });
                    }
                });
        }
    }
}

/**
 * Stops sending the media track. And removes it from the HTML.
 * NOTE: Works for local tracks only.
 */
JitsiLocalTrack.prototype.stop = function () {
    this.rtc.room.removeStream(this.stream);
    this.stream.stop();
    this.detach();
}


/**
 * Starts sending the track.
 * NOTE: Works for local tracks only.
 */
JitsiLocalTrack.prototype.start = function() {
    this.rtc.room.addStream(this.stream, function () {});
}

module.exports = JitsiLocalTrack;
