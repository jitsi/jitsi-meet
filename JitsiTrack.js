/**
 * Represents a single media track (either audio or video).
 * @constructor
 */
function JitsiTrack()
{

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
};

/**
 * @returns {JitsiParticipant} to which this track belongs, or null if it is a local track.
 */
JitsiTrack.prototype.getParitcipant() = function() {

};

/**
 * Returns the RTCMediaStream from the browser (?).
 */
JitsiTrack.prototype.getOriginalStream() {

}

/**
 * Mutes the track.
 */
JitsiTrack.prototype.mute = function () {

}

/**
 * Unmutes the stream.
 */
JitsiTrack.prototype.unmute = function () {

}

/**
 * Attaches the MediaStream of this track to an HTML container (?).
 * @param container the HTML container
 */
JitsiTrack.prototype.attach = function (container) {

}

/**
 * Removes the track from the passed HTML container.
 * @param container the HTML container
 */
JitsiTrack.prototype.detach = function (container) {

}

/**
 * Stops sending the media track. And removes it from the HTML.
 * NOTE: Works for local tracks only.
 */
JitsiTrack.prototype.stop = function () {

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

module.exports = JitsiTrack;
