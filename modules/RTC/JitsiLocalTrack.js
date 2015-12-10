var JitsiTrack = require("./JitsiTrack");
var RTCBrowserType = require("./RTCBrowserType");
var JitsiTrackEvents = require('../../JitsiTrackEvents');
var RTC = require("./RTCUtils");

/**
 * Represents a single media track (either audio or video).
 * @constructor
 */
function JitsiLocalTrack(stream, videoType,
  resolution)
{
    this.videoType = videoType;
    this.dontFireRemoveEvent = false;
    this.resolution = resolution;
    this.startMuted = false;
    var self = this;
    JitsiTrack.call(this, null, stream,
        function () {
            if(!this.dontFireRemoveEvent)
                this.eventEmitter.emit(
                    JitsiTrackEvents.TRACK_STOPPED);
            this.dontFireRemoveEvent = false;
        }.bind(this));

}

JitsiLocalTrack.prototype = Object.create(JitsiTrack.prototype);
JitsiLocalTrack.prototype.constructor = JitsiLocalTrack;

/**
 * Mutes / unmutes the track.
 * @param mute {boolean} if true the track will be muted. Otherwise the track will be unmuted.
 */
JitsiLocalTrack.prototype._setMute = function (mute) {
    if(!this.rtc) {
        this.startMuted = mute;
        return;
    }
    var isAudio = this.type === JitsiTrack.AUDIO;
    this.dontFireRemoveEvent = false;

    if ((window.location.protocol != "https:") ||
        (isAudio) || this.videoType === "desktop" ||
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
        this.eventEmitter.emit(JitsiTrackEvents.TRACK_MUTE_CHANGED);
    } else {
        if (mute) {
            this.dontFireRemoveEvent = true;
            this.rtc.room.removeStream(this.stream, function () {});
            RTC.stopMediaStream(this.stream);
            if(isAudio)
                this.rtc.room.setAudioMute(mute);
            else
                this.rtc.room.setVideoMute(mute);
            this.stream = null;
            this.eventEmitter.emit(JitsiTrackEvents.TRACK_MUTE_CHANGED);
            //FIXME: Maybe here we should set the SRC for the containers to something
        } else {
            var self = this;
            RTC.obtainAudioAndVideoPermissions({
                devices: (isAudio ? ["audio"] : ["video"]),
                resolution: self.resolution})
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
                            self.eventEmitter.emit(
                                JitsiTrackEvents.TRACK_MUTE_CHANGED);
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
        this.rtc.room.removeStream(this.stream, function () {});
    RTC.stopMediaStream(this.stream);
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

/**
 * Private method. Updates rtc property of the track.
 * @param rtc the rtc instance.
 */
JitsiLocalTrack.prototype._setRTC = function (rtc) {
    this.rtc = rtc;
};

/**
 * Return true;
 */
JitsiLocalTrack.prototype.isLocal = function () {
    return true;
}

module.exports = JitsiLocalTrack;
