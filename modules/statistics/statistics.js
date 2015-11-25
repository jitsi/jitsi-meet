/* global require, APP */
/**
 * Created by hristo on 8/4/14.
 */
var LocalStats = require("./LocalStatsCollector.js");
var RTPStats = require("./RTPStatsCollector.js");
var EventEmitter = require("events");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var CallStats = require("./CallStats");
var RTCEvents = require("../../service/RTC/RTCEvents");
var StatisticsEvents = require("../../service/statistics/Events");

var eventEmitter = new EventEmitter();

var localStats = null;

var rtpStats = null;

function stopLocal() {
    if (localStats) {
        localStats.stop();
        localStats = null;
    }
}

function stopRemote() {
    if (rtpStats) {
        rtpStats.stop();
        eventEmitter.emit(StatisticsEvents.STOP);
        rtpStats = null;
    }
}

function startRemoteStats (peerconnection) {
    if (rtpStats) {
        rtpStats.stop();
    }

    rtpStats = new RTPStats(peerconnection, 200, 2000, eventEmitter);
    rtpStats.start();
}

function onStreamCreated(stream) {
    if(stream.getOriginalStream().getAudioTracks().length === 0) {
        return;
    }

    localStats = new LocalStats(stream.getOriginalStream(), 200, statistics,
        eventEmitter);
    localStats.start();
}

function onDisposeConference(onUnload) {
    CallStats.sendTerminateEvent();
    stopRemote();
    if(onUnload) {
        stopLocal();
        eventEmitter.removeAllListeners();
    }
}

var statistics = {
    /**
     * Indicates that this audio level is for local jid.
     * @type {string}
     */
    LOCAL_JID: 'local',

    addListener: function(type, listener) {
        eventEmitter.on(type, listener);
    },
    removeListener: function (type, listener) {
        eventEmitter.removeListener(type, listener);
    },
    stop: function () {
        stopLocal();
        stopRemote();
        if(eventEmitter)
        {
            eventEmitter.removeAllListeners();
        }
    },
    stopRemoteStatistics: function()
    {
        stopRemote();
    },
    start: function () {
        APP.RTC.addStreamListener(onStreamCreated,
            StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
        APP.xmpp.addListener(XMPPEvents.DISPOSE_CONFERENCE,
                             onDisposeConference);
        //FIXME: we may want to change CALL INCOMING event to
        // onnegotiationneeded
        APP.xmpp.addListener(XMPPEvents.CALL_INCOMING, function (event) {
            startRemoteStats(event.peerconnection);
//            CallStats.init(event);
        });
        APP.xmpp.addListener(XMPPEvents.PEERCONNECTION_READY,
            function (session) {
            CallStats.init(session);
        });
        APP.RTC.addListener(RTCEvents.AUDIO_MUTE, function (mute) {
            CallStats.sendMuteEvent(mute, "audio");
        });
        APP.xmpp.addListener(XMPPEvents.CONFERENCE_SETUP_FAILED, function () {
            CallStats.sendSetupFailedEvent();
        });
        APP.RTC.addListener(RTCEvents.VIDEO_MUTE, function (mute) {
            CallStats.sendMuteEvent(mute, "video");
        });

        APP.RTC.addListener(RTCEvents.GET_USER_MEDIA_FAILED, function (e) {
            CallStats.sendGetUserMediaFailed(e);
        });
        APP.xmpp.addListener(RTCEvents.CREATE_OFFER_FAILED, function (e, pc) {
            CallStats.sendCreateOfferFailed(e, pc);
        });
        APP.xmpp.addListener(RTCEvents.CREATE_ANSWER_FAILED, function (e, pc) {
            CallStats.sendCreateAnswerFailed(e, pc);
        });
        APP.xmpp.addListener(
            RTCEvents.SET_LOCAL_DESCRIPTION_FAILED,
            function (e, pc) {
                CallStats.sendSetLocalDescFailed(e, pc);
            }
        );
        APP.xmpp.addListener(
            RTCEvents.SET_REMOTE_DESCRIPTION_FAILED,
            function (e, pc) {
                CallStats.sendSetRemoteDescFailed(e, pc);
            }
        );
        APP.xmpp.addListener(
            RTCEvents.ADD_ICE_CANDIDATE_FAILED,
            function (e, pc) {
                CallStats.sendAddIceCandidateFailed(e, pc);
            }
        );
    },
    /**
     * Obtains audio level reported in the stats for specified peer.
     * @param peerJid full MUC jid of the user for whom we want to obtain last
     *        audio level.
     * @param ssrc the SSRC of audio stream for which we want to obtain audio
     *        level.
     * @returns {*} a float form 0 to 1 that represents current audio level or
     *              <tt>null</tt> if for any reason the value is not available
     *              at this time.
     */
    getPeerSSRCAudioLevel: function (peerJid, ssrc) {

        var peerStats = rtpStats.jid2stats[peerJid];

        return peerStats ? peerStats.ssrc2AudioLevel[ssrc] : null;
    }
};




module.exports = statistics;