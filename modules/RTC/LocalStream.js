var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");


function LocalStream(stream, type, eventEmitter, videoType, isGUMStream)
{
    this.stream = stream;
    this.eventEmitter = eventEmitter;
    this.type = type;
    this.videoType = videoType;
    this.isGUMStream = true;
    if(isGUMStream === false)
        this.isGUMStream = isGUMStream;
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
    return this.type === "audio";
};

LocalStream.prototype.setMute = function(mute)
{

    if((window.location.protocol != "https:" && this.isGUMStream) ||
        (this.isAudioStream() && this.isGUMStream) || this.videoType === "screen")
    {
        var tracks = this.getTracks();

        for (var idx = 0; idx < tracks.length; idx++) {
            tracks[idx].enabled = mute;
        }
    }
    else
    {
        if(mute === false) {
            APP.xmpp.removeStream(this.stream);
            this.stream.stop();
        }
        else
        {
            var self = this;
            APP.RTC.rtcUtils.obtainAudioAndVideoPermissions(
                (this.isAudioStream() ? ["audio"] : ["video"]),
                function (stream) {
                    if(self.isAudioStream())
                    {
                        APP.RTC.changeLocalAudio(stream, function () {});
                    }
                    else
                    {
                        APP.RTC.changeLocalVideo(stream, false, function () {});
                    }
                });
        }
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
        if(this.stream.ended)
            return true;
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
