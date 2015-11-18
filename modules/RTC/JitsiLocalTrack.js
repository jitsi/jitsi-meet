var JitsiTrack = require("./JitsiTrack");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");
var RTCBrowserType = require("./RTCBrowserType");

/**
 * Represents a single media track (either audio or video).
 * @constructor
 */
function JitsiLocalTrack(RTC, stream, eventEmitter, videoType,
  resolution)
{
    JitsiTrack.call(this, RTC, stream);
    this.eventEmitter = eventEmitter;
    this.videoType = videoType;
    this.dontFireRemoveEvent = false;
    this.resolution = resolution;
    var self = this;
    this.stream.onended = function () {
        if(!self.dontFireRemoveEvent)
            self.eventEmitter.emit(StreamEventTypes.EVENT_TYPE_LOCAL_ENDED, self);
        self.dontFireRemoveEvent = false;
    };
}

JitsiLocalTrack.prototype = Object.create(JitsiTrack.prototype);
JitsiLocalTrack.prototype.constructor = JitsiLocalTrack;

/**
 * Mutes / unmutes the track.
 * @param mute {boolean} if true the track will be muted. Otherwise the track will be unmuted.
 */
JitsiLocalTrack.prototype._setMute = function (mute) {
    if(!this.rtc) {
        console.error("Mute is not supported for streams not attached to conference!");
        return;
    }
    var isAudio = this.type === JitsiTrack.AUDIO;
    this.dontFireRemoveEvent = false;

    if ((window.location.protocol != "https:") ||
        (isAudio) || this.videoType === "screen" ||
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
        this.eventEmitter.emit(StreamEventTypes.TRACK_MUTE_CHANGED, this);
    } else {
        if (mute) {
            this.dontFireRemoveEvent = true;
            this.rtc.room.removeStream(this.stream);
            this.rtc.stopMediaStream(this.stream);
            if(isAudio)
                this.rtc.room.setAudioMute(mute);
            else
                this.rtc.room.setVideoMute(mute);
            this.stream = null;
            this.eventEmitter.emit(StreamEventTypes.TRACK_MUTE_CHANGED, this);
            //FIXME: Maybe here we should set the SRC for the containers to something
        } else {
            var self = this;
            var RTC = require("./RTCUtils");
            RTC.obtainAudioAndVideoPermissions({
                devices: (isAudio ? ["audio"] : ["video"]),
                resolution: self.resolution,
                dontCreateJitsiTrack: true})
                .then(function (streams) {
                    var stream = null;
                    for(var i = 0; i < streams.length; i++) {
                        stream = streams[i];
                        if(stream.type === self.type) {
                            self.stream = stream.stream;
                            self.videoType = stream.videoType;
                            break;
                        }
                    }

                    if(!stream)
                        return;

                    for(var i = 0; i < self.containers.length; i++)
                    {
                        RTC.attachMediaStream(self.containers[i], self.stream);
                    }

                    self.rtc.room.addStream(stream.stream,
                        function () {
                            if(isAudio)
                                self.rtc.room.setAudioMute(mute);
                            else
                                self.rtc.room.setVideoMute(mute);
                            self.eventEmitter.emit(StreamEventTypes.TRACK_MUTE_CHANGED, self);
                        });
                });
        }
    }
}

/**
 * Stops sending the media track. And removes it from the HTML.
 * NOTE: Works for local tracks only.
 */
JitsiLocalTrack.prototype.stop = function () {
    if(!this.stream)
        return;
    if(this.rtc)
        this.rtc.room.removeStream(this.stream);
    this.rtc.stopMediaStream(this.stream);
    this.detach();
}

/**
 * Returns <tt>true</tt> - if the stream is muted
 * and <tt>false</tt> otherwise.
 * @returns {boolean} <tt>true</tt> - if the stream is muted
 * and <tt>false</tt> otherwise.
 */
JitsiLocalTrack.prototype.isMuted = function () {
    if (!this.stream)
        return true;
    var tracks = [];
    var isAudio = this.type === JitsiTrack.AUDIO;
    if (isAudio) {
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

/**
 * Private method. Updates rtc property of the track.
 * @param rtc the rtc instance.
 */
JitsiLocalTrack.prototype._setRTC = function (rtc) {
    this.rtc = rtc;
};

module.exports = JitsiLocalTrack;
