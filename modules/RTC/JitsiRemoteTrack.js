var JitsiTrack = require("./JitsiTrack");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");

/**
 * Represents a single media track (either audio or video).
 * @param RTC the rtc instance.
 * @param data object with the stream and some details about it(participant id, video type, etc.)
 * @param sid sid for the Media Stream
 * @param ssrc ssrc for the Media Stream
 * @param eventEmitter the event emitter
 * @constructor
 */
function JitsiRemoteTrack(RTC, data, sid, ssrc, eventEmitter) {
    JitsiTrack.call(this, RTC, data.stream);
    this.rtc = RTC;
    this.sid = sid;
    this.stream = data.stream;
    this.peerjid = data.peerjid;
    this.videoType = data.videoType;
    this.ssrc = ssrc;
    this.muted = false;
    this.eventEmitter = eventEmitter;
    var self = this;
    if(this.stream)
        this.stream.onended = function () {
            eventEmitter.emit(StreamEventTypes.EVENT_TYPE_REMOTE_ENDED, self);
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
    this.eventEmitter.emit(StreamEventTypes.TRACK_MUTE_CHANGED, this);
};

/**
 * Returns the current muted status of the track.
 * @returns {boolean|*|JitsiRemoteTrack.muted} <tt>true</tt> if the track is muted and <tt>false</tt> otherwise.
 */
JitsiRemoteTrack.prototype.isMuted = function () {
    return this.muted;
}

/**
 * Returns the participant id which owns the track.
 * @returns {string} the id of the participants.
 */
JitsiRemoteTrack.prototype.getParitcipantId = function() {
    return Strophe.getResourceFromJid(this.peerjid);
};

delete JitsiRemoteTrack.prototype.stop;

delete JitsiRemoteTrack.prototype.start;

module.exports = JitsiRemoteTrack;
