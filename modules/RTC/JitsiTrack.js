var RTC = require("./RTCUtils");
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

/**
 * Represents a single media track (either audio or video).
 * @constructor
 */
function JitsiTrack(RTC, stream)
{
    this.rtc = RTC;
    this.stream = stream;
    this.type = (this.stream.getVideoTracks().length > 0)?
        JitsiTrack.VIDEO : JitsiTrack.AUDIO;
    if(this.type == "audio") {
        this._getTracks = function () {
            return this.stream.getAudioTracks();
        }.bind(this);
    } else {
        this._getTracks = function () {
            return this.stream.getVideoTracks();
        }.bind(this);
    }
    if (RTCBrowserType.isFirefox() && this.stream) {
        implementOnEndedHandling(this.stream);
    }
}

/**
 * JitsiTrack video type.
 * @type {string}
 */
JitsiTrack.VIDEO = "video";

/**
 * JitsiTrack audio type.
 * @type {string}
 */
JitsiTrack.AUDIO = "audio";

/**
 * Returns the type (audio or video) of this track.
 */
JitsiTrack.prototype.getType = function() {
    return this.type;
};

/**
 * Returns the RTCMediaStream from the browser (?).
 */
JitsiTrack.prototype.getOriginalStream = function() {
    return this.stream;
}

/**
 * Mutes the track.
 */
JitsiTrack.prototype.mute = function () {
    this._setMute(true);
}

/**
 * Unmutes the stream.
 */
JitsiTrack.prototype.unmute = function () {
    this._setMute(false);
}

/**
 * Attaches the MediaStream of this track to an HTML container (?).
 * @param container the HTML container
 */
JitsiTrack.prototype.attach = function (container) {
    RTC.attachMediaStream(container, this.stream);
}

/**
 * Removes the track from the passed HTML container.
 * @param container the HTML container
 */
JitsiTrack.prototype.detach = function (container) {
    $(container).find(">video").remove();
}

/**
 * Stops sending the media track. And removes it from the HTML.
 * NOTE: Works for local tracks only.
 */
JitsiTrack.prototype.stop = function () {

    this.detach();
}


/**
 * Starts sending the track.
 * NOTE: Works for local tracks only.
 */
JitsiTrack.prototype.start = function() {

}

/**
 * Returns true if this is a video track and the source of the video is a
 * screen capture as opposed to a camera.
 */
JitsiTrack.prototype.isScreenSharing = function(){

}

/**
 * Returns id of the track.
 * @returns {string} id of the track or null if this is fake track.
 */
JitsiTrack.prototype.getId = function () {
    var tracks = this.stream.getTracks();
    if(!tracks || tracks.length === 0)
        return null;
    return tracks[0].id;
};

module.exports = JitsiTrack;
