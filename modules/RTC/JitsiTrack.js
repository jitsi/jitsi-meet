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
    /**
     * Array with the HTML elements that are displaying the streams.
     * @type {Array}
     */
    this.containers = [];
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
 * Adds the container to the list of containers that are displaying the track.
 * @param container the HTML container
 */
JitsiTrack.prototype.attach = function (container) {
    if(this.stream)
        RTC.attachMediaStream(container, this.stream);
    this.containers.push(container);
}

/**
 * Removes the track from the passed HTML container.
 * @param container the HTML container. If <tt>null</tt> all containers are removed.
 */
JitsiTrack.prototype.detach = function (container) {
    for(var i = 0; i < this.containers.length; i++)
    {
        if(this.containers[i].is(container))
        {
            this.containers.splice(i,1);
        }
        if(!container)
        {
            this.containers[i].find(">video").remove();
        }
    }
    if(container)
        $(container).find(">video").remove();

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
