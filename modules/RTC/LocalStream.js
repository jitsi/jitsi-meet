var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");

function LocalStream(stream, type, eventEmitter, videoType)
{
    this.stream = stream;
    this.eventEmitter = eventEmitter;
    this.type = type;
    this.videoType = videoType;
    var self = this;
    if(type == "audio")
    {
        this.getTracks = function () {
            return self.stream.getAudioTracks();
        };
    }
    else
    {
        this.getTracks = function () {
            return self.stream.getVideoTracks();
        };
    }

    this.stream.onended = function()
    {
        self.streamEnded();
    };
}

LocalStream.prototype.streamEnded = function () {
    this.eventEmitter.emit(StreamEventTypes.EVENT_TYPE_LOCAL_ENDED, this);
}

LocalStream.prototype.getOriginalStream = function()
{
    return this.stream;
}

LocalStream.prototype.isAudioStream = function () {
    return (this.stream.getAudioTracks() && this.stream.getAudioTracks().length > 0);
};

LocalStream.prototype.mute = function()
{
    var ismuted = false;
    var tracks = this.getTracks();

    for (var idx = 0; idx < tracks.length; idx++) {
        ismuted = !tracks[idx].enabled;
        tracks[idx].enabled = ismuted;
    }
    return ismuted;
};

LocalStream.prototype.setMute = function(mute)
{
    var tracks = this.getTracks();

    for (var idx = 0; idx < tracks.length; idx++) {
        tracks[idx].enabled = mute;
    }
};

LocalStream.prototype.isMuted = function () {
    var tracks = [];
    if(this.type == "audio")
    {
        tracks = this.stream.getAudioTracks();
    }
    else
    {
        tracks = this.stream.getVideoTracks();
    }
    for (var idx = 0; idx < tracks.length; idx++) {
        if(tracks[idx].enabled)
            return false;
    }
    return true;
}

LocalStream.prototype.getId = function () {
    return this.stream.getTracks()[0].id;
}



module.exports = LocalStream;
