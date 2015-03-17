////These lines should be uncommented when require works in app.js
var MediaStreamType = require("../../service/RTC/MediaStreamTypes");
var StreamEventType = require("../../service/RTC/StreamEventTypes");

/**
 * Creates a MediaStream object for the given data, session id and ssrc.
 * It is a wrapper class for the MediaStream.
 *
 * @param data the data object from which we obtain the stream,
 * the peerjid, etc.
 * @param sid the session id
 * @param ssrc the ssrc corresponding to this MediaStream
 *
 * @constructor
 */
function MediaStream(data, sid, ssrc, browser, eventEmitter) {

    // XXX(gp) to minimize headaches in the future, we should build our
    // abstractions around tracks and not streams. ORTC is track based API.
    // Mozilla expects m-lines to represent media tracks.
    //
    // Practically, what I'm saying is that we should have a MediaTrack class
    // and not a MediaStream class.
    //
    // Also, we should be able to associate multiple SSRCs with a MediaTrack as
    // a track might have an associated RTX and FEC sources.

    this.sid = sid;
    this.stream = data.stream;
    this.peerjid = data.peerjid;
    this.ssrc = ssrc;
    this.type = (this.stream.getVideoTracks().length > 0)?
        MediaStreamType.VIDEO_TYPE : MediaStreamType.AUDIO_TYPE;
    this.videoType = null;
    this.muted = false;
    this.eventEmitter = eventEmitter;
}


MediaStream.prototype.getOriginalStream = function()
{
    return this.stream;
};

MediaStream.prototype.setMute = function (value)
{
    this.stream.muted = value;
    this.muted = value;
};

MediaStream.prototype.setVideoType = function (value) {
    if(this.videoType === value)
        return;
    this.videoType = value;
    this.eventEmitter.emit(StreamEventType.EVENT_TYPE_REMOTE_CHANGED,
        this.peerjid);
};


module.exports = MediaStream;
