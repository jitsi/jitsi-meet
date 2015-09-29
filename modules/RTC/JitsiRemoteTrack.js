var JitsiTrack = require("./JitsiTrack");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes");

/**
 * Represents a single media track (either audio or video).
 * @constructor
 */
function JitsiRemoteTrack(RTC, data, sid, ssrc, browser, eventEmitter) {
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

JitsiRemoteTrack.prototype._setMute = function (value) {
    this.stream.muted = value;
    this.muted = value;
};

/**
 * @returns {JitsiParticipant} to which this track belongs, or null if it is a local track.
 */
JitsiRemoteTrack.prototype.getParitcipantId = function() {
    return Strophe.getResourceFromJid(this.peerjid);
};

delete JitsiRemoteTrack.prototype.stop;

delete JitsiRemoteTrack.prototype.start;

module.exports = JitsiRemoteTrack;
