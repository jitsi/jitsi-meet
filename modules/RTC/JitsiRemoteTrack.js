var JitsiTrack = require("./JitsiTrack");
var JitsiTrackEvents = require("../../JitsiTrackEvents");

/**
 * Represents a single media track (either audio or video).
 * @param RTC the rtc instance.
 * @param data object with the stream and some details about it(participant id, video type, etc.)
 * @param sid sid for the Media Stream
 * @param ssrc ssrc for the Media Stream
 * @param eventEmitter the event emitter
 * @constructor
 */
function JitsiRemoteTrack(RTC, data, sid, ssrc) {
    JitsiTrack.call(this, RTC, data.stream,
        function () {
            this.eventEmitter.emit(JitsiTrackEvents.TRACK_STOPPED);
        }.bind(this));
    this.rtc = RTC;
    this.sid = sid;
    this.stream = data.stream;
    this.peerjid = data.peerjid;
    this.videoType = data.videoType;
    this.ssrc = ssrc;
    this.muted = false;
    this.isLocal = false;
    if((this.type === JitsiTrack.AUDIO && data.audiomuted)
      || (this.type === JitsiTrack.VIDEO && data.videomuted)) {
        this.muted = true;
    }
}

JitsiRemoteTrack.prototype = Object.create(JitsiTrack.prototype);
JitsiRemoteTrack.prototype.constructor = JitsiRemoteTrack;

/**
 * Sets current muted status and fires an events for the change.
 * @param value the muted status.
 */
JitsiRemoteTrack.prototype.setMute = function (value) {
    this.stream.muted = value;
    this.muted = value;
    this.eventEmitter.emit(JitsiTrackEvents.TRACK_MUTE_CHANGED);
};

/**
 * Returns the current muted status of the track.
 * @returns {boolean|*|JitsiRemoteTrack.muted} <tt>true</tt> if the track is muted and <tt>false</tt> otherwise.
 */
JitsiRemoteTrack.prototype.isMuted = function () {
    return this.muted;
};

/**
 * Returns the participant id which owns the track.
 * @returns {string} the id of the participants.
 */
JitsiRemoteTrack.prototype.getParticipantId = function() {
    return Strophe.getResourceFromJid(this.peerjid);
};

/**
 * Return false;
 */
JitsiRemoteTrack.prototype.isLocal = function () {
    return false;
};

delete JitsiRemoteTrack.prototype.stop;

delete JitsiRemoteTrack.prototype.start;

module.exports = JitsiRemoteTrack;
