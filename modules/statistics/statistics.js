/* global require, APP */
var LocalStats = require("./LocalStatsCollector.js");
var RTPStats = require("./RTPStatsCollector.js");
var EventEmitter = require("events");
var StatisticsEvents = require("../../service/statistics/Events");
//var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
//var XMPPEvents = require("../../service/xmpp/XMPPEvents");
//var CallStats = require("./CallStats");
//var RTCEvents = require("../../service/RTC/RTCEvents");

//
//function onDisposeConference(onUnload) {
//    CallStats.sendTerminateEvent();
//    stopRemote();
//    if(onUnload) {
//        stopLocal();
//        eventEmitter.removeAllListeners();
//    }
//}

function Statistics() {
    this.localStats = null;
    this.rtpStats = null;
    this.eventEmitter = new EventEmitter();
}

Statistics.prototype.startRemoteStats = function (peerconnection) {
    if (this.rtpStats) {
        this.rtpStats.stop();
    }

    this.rtpStats = new RTPStats(peerconnection, 200, 2000, this.eventEmitter);
    this.rtpStats.start();
}

Statistics.prototype.startLocalStats = function (stream) {
    if(stream.getType() !== "audio")
        return;
    this.localStats = new LocalStats(stream.getOriginalStream(), 200, this,
        this.eventEmitter);
    this.localStats.start();
}


Statistics.prototype.addAudioLevelListener = function(listener)
{
    this.eventEmitter.on(StatisticsEvents.AUDIO_LEVEL, listener);
}

Statistics.prototype.removeAudioLevelListener = function(listener)
{
    this.eventEmitter.removeListener(StatisticsEvents.AUDIO_LEVEL, listener);
}

Statistics.prototype.dispose = function () {
    this.stopLocal();
    this.stopRemote();
    if(this.eventEmitter)
    {
        this.eventEmitter.removeAllListeners();
    }
}


Statistics.prototype.stopLocal = function () {
    if (this.localStats) {
        this.localStats.stop();
        this.localStats = null;
    }
}

Statistics.prototype.stopRemote = function () {
    if (this.rtpStats) {
        this.rtpStats.stop();
        this.eventEmitter.emit(StatisticsEvents.STOP);
        this.rtpStats = null;
    }
}

Statistics.LOCAL_JID = require("../../service/statistics/constants").LOCAL_JID;

//
//var statistics = {
//    /**
//     * Indicates that this audio level is for local jid.
//     * @type {string}
//     */
//    LOCAL_JID: 'local',
//
//    addConnectionStatsListener: function(listener)
//    {
//        eventEmitter.on("statistics.connectionstats", listener);
//    },
//
//    removeConnectionStatsListener: function(listener)
//    {
//        eventEmitter.removeListener("statistics.connectionstats", listener);
//    },
//
//
//    addRemoteStatsStopListener: function(listener)
//    {
//        eventEmitter.on("statistics.stop", listener);
//    },
//
//    removeRemoteStatsStopListener: function(listener)
//    {
//        eventEmitter.removeListener("statistics.stop", listener);
//    },
//
//
//    stopRemoteStatistics: function()
//    {
//        stopRemote();
//    },
//
////    Already implemented with the constructor
//    start: function () {
//        APP.RTC.addStreamListener(onStreamCreated,
//            StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
//        APP.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE, onDisposeConference);
//        //FIXME: we may want to change CALL INCOMING event to onnegotiationneeded
//        APP.xmpp.addListener(XMPPEvents.CALL_INCOMING, function (event) {
//            startRemoteStats(event.peerconnection);
////            CallStats.init(event);
//        });
////        APP.xmpp.addListener(XMPPEvents.PEERCONNECTION_READY, function (session) {
////            CallStats.init(session);
////        });
//        //FIXME: that event is changed to TRACK_MUTE_CHANGED
////        APP.RTC.addListener(RTCEvents.AUDIO_MUTE, function (mute) {
////            CallStats.sendMuteEvent(mute, "audio");
////        });
////        APP.xmpp.addListener(XMPPEvents.CONFERENCE_SETUP_FAILED, function () {
////            CallStats.sendSetupFailedEvent();
////        });
//        //FIXME: that event is changed to TRACK_MUTE_CHANGED
////        APP.RTC.addListener(RTCEvents.VIDEO_MUTE, function (mute) {
////            CallStats.sendMuteEvent(mute, "video");
////        });
//    }
//};




module.exports = Statistics;