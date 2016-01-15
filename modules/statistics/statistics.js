/* global require, APP */
/**
 * Created by hristo on 8/4/14.
 */
var RTPStats = require("./RTPStatsCollector.js");
var EventEmitter = require("events");
var StreamEventTypes = require("../../service/RTC/StreamEventTypes.js");
var XMPPEvents = require("../../service/xmpp/XMPPEvents");
var CallStats = require("./CallStats");
var RTCEvents = require("../../service/RTC/RTCEvents");
var StatisticsEvents = require("../../service/statistics/Events");

var eventEmitter = new EventEmitter();

var rtpStats = null;

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

function onDisposeConference(onUnload) {
    CallStats.sendTerminateEvent();
    stopRemote();
    if (onUnload) {
        eventEmitter.removeAllListeners();
    }
}

export default {
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
        stopRemote();
        if (eventEmitter) {
            eventEmitter.removeAllListeners();
        }
    },
    onAudioMute (mute) {
        CallStats.sendMuteEvent(mute, "audio");
    },
    onVideoMute (mute) {
        CallStats.sendMuteEvent(mute, "video");
    },
    onGetUserMediaFailed (e) {
       CallStats.sendGetUserMediaFailed(e);
    },
    start: function () {
        const xmpp = APP.conference._room.xmpp;
        xmpp.addListener(
            XMPPEvents.DISPOSE_CONFERENCE,
            onDisposeConference
        );
        //FIXME: we may want to change CALL INCOMING event to
        // onnegotiationneeded
        xmpp.addListener(XMPPEvents.CALL_INCOMING, function (event) {
            startRemoteStats(event.peerconnection);
            // CallStats.init(event);
        });
        xmpp.addListener(
            XMPPEvents.PEERCONNECTION_READY,
            function (session) {
                CallStats.init(session);
            }
        );
        xmpp.addListener(XMPPEvents.CONFERENCE_SETUP_FAILED, function () {
            CallStats.sendSetupFailedEvent();
        });

        xmpp.addListener(RTCEvents.CREATE_OFFER_FAILED, function (e, pc) {
            CallStats.sendCreateOfferFailed(e, pc);
        });
        xmpp.addListener(RTCEvents.CREATE_ANSWER_FAILED, function (e, pc) {
            CallStats.sendCreateAnswerFailed(e, pc);
        });
        xmpp.addListener(
            RTCEvents.SET_LOCAL_DESCRIPTION_FAILED,
            function (e, pc) {
                CallStats.sendSetLocalDescFailed(e, pc);
            }
        );
        xmpp.addListener(
            RTCEvents.SET_REMOTE_DESCRIPTION_FAILED,
            function (e, pc) {
                CallStats.sendSetRemoteDescFailed(e, pc);
            }
        );
        xmpp.addListener(
            RTCEvents.ADD_ICE_CANDIDATE_FAILED,
            function (e, pc) {
                CallStats.sendAddIceCandidateFailed(e, pc);
            }
        );
    },
    /**
     * FIXME:
     * Currently used by torture. If we are removing this, torture needs to
     * be fixed also.
     *
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
