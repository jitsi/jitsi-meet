/* global require, APP */
var LocalStats = require("./LocalStatsCollector.js");
var RTPStats = require("./RTPStatsCollector.js");
var EventEmitter = require("events");
var StatisticsEvents = require("../../service/statistics/Events");
var CallStats = require("./CallStats");

// Since callstats.io is a third party, we cannot guarantee the quality of
// their service. More specifically, their server may take noticeably long
// time to respond. Consequently, it is in our best interest (in the sense
// that the intergration of callstats.io is pretty important to us but not
// enough to allow it to prevent people from joining a conference) to (1)
// start downloading their API as soon as possible and (2) do the
// downloading asynchronously.
function loadCallStatsAPI() {
    (function (d, src) {
        var elementName = 'script';
        var newScript = d.createElement(elementName);
        var referenceNode = d.getElementsByTagName(elementName)[0];

        newScript.async = true;
        newScript.src = src;
        referenceNode.parentNode.insertBefore(newScript, referenceNode);
    })(document, 'https://api.callstats.io/static/callstats.min.js');
    // FIXME At the time of this writing, we hope that the callstats.io API will
    // have loaded by the time we needed it (i.e. CallStats.init is invoked).
}

var eventEmitter = new EventEmitter();

function Statistics(options) {
    this.rtpStats = null;
    this.eventEmitter = new EventEmitter();
    this.options = options || {};
    this.callStatsIntegrationEnabled
        = this.options.callStatsID && this.options.callStatsSecret
        // Even though AppID and AppSecret may be specified, the integration of
        // callstats.io may be disabled because of globally-disallowed requests
        // to any third parties.
        && (this.options.disableThirdPartyRequests !== true);
    if(this.callStatsIntegrationEnabled)
        loadCallStatsAPI();
    this.audioLevelsEnabled = !this.disableAudioLevels || true;
    this.callStats = null;
}

Statistics.prototype.startRemoteStats = function (peerconnection) {
    if(!this.audioLevelsEnabled)
        return;

    if (this.rtpStats) {
        this.rtpStats.stop();
    }

    this.rtpStats = new RTPStats(peerconnection, 200, 2000, this.eventEmitter);
    this.rtpStats.start();
}

Statistics.localStats = [];

Statistics.startLocalStats = function (stream, callback) {
    if(!this.audioLevelsEnabled)
        return;
    var localStats = new LocalStats(stream, 200, callback);
    this.localStats.push(localStats);
    localStats.start();
}

Statistics.prototype.addAudioLevelListener = function(listener)
{
    if(!this.audioLevelsEnabled)
        return;
    this.eventEmitter.on(StatisticsEvents.AUDIO_LEVEL, listener);
}

Statistics.prototype.removeAudioLevelListener = function(listener)
{
    if(!this.audioLevelsEnabled)
        return;
    this.eventEmitter.removeListener(StatisticsEvents.AUDIO_LEVEL, listener);
}

Statistics.prototype.dispose = function () {
    if(this.audioLevelsEnabled) {
        Statistics.stopAllLocalStats();
        this.stopRemote();
        if(this.eventEmitter)
            this.eventEmitter.removeAllListeners();

        if(eventEmitter)
            eventEmitter.removeAllListeners();
    }

    if(this.callstats)
    {
        this.callstats.sendTerminateEvent();
        this.callstats = null;
    }
}


Statistics.stopAllLocalStats = function () {
    if(!this.audioLevelsEnabled)
        return;

    for(var i = 0; i < this.localStats.length; i++)
        this.localStats[i].stop();
    this.localStats = [];
}

Statistics.stopLocalStats = function (stream) {
    if(!this.audioLevelsEnabled)
        return;

    for(var i = 0; i < Statistics.localStats.length; i++)
        if(Statistics.localStats[i].stream === stream){
            var localStats = Statistics.localStats.splice(i, 1);
            localStats.stop();
            break;
        }
}

Statistics.prototype.stopRemote = function () {
    if (this.rtpStats && this.audioLevelsEnabled) {
        this.rtpStats.stop();
        this.eventEmitter.emit(StatisticsEvents.STOP);
        this.rtpStats = null;
    }
};

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
Statistics.prototype.getPeerSSRCAudioLevel = function (peerJid, ssrc) {
    if(!this.audioLevelsEnabled)
        return;
    var peerStats = this.rtpStats.jid2stats[peerJid];

    return peerStats ? peerStats.ssrc2AudioLevel[ssrc] : null;
};


//CALSTATS METHODS

/**
 * Initializes the callstats.io API.
 * @param peerConnection {JingleSessionPC} the session object
 * @param Settings {Settings} the settings instance. Declared in
 * /modules/settings/Settings.js
 */
Statistics.prototype.startCallStats = function (session, settings) {
    if(this.callStatsIntegrationEnabled) {
        this.callstats = new CallStats(session, settings, this.options);
    }
}

/**
 * Returns true if the callstats integration is enabled, otherwise returns
 * false.
 *
 * @returns true if the callstats integration is enabled, otherwise returns
 * false.
 */
Statistics.prototype.isCallstatsEnabled = function () {
    return this.callStatsIntegrationEnabled;
}

/**
 * Notifies CallStats for connection setup errors
 */
Statistics.prototype.sendSetupFailedEvent = function () {
    if(this.callStatsIntegrationEnabled && this.callstats)
        this.callstats.sendSetupFailedEvent();
}

/**
 * Notifies CallStats for mute events
 * @param mute {boolean} true for muted and false for not muted
 * @param type {String} "audio"/"video"
 */
Statistics.prototype.sendMuteEvent = function (muted, type) {
    if(this.callStatsIntegrationEnabled && this.callstats)
        this.callstats.sendMuteEvent(muted, type);
}

/**
 * Notifies CallStats that getUserMedia failed.
 *
 * @param {Error} e error to send
 */
Statistics.prototype.sendGetUserMediaFailed = function (e) {
    if(this.callStatsIntegrationEnabled)
        CallStats.sendGetUserMediaFailed(e, this.callstats);
};

/**
 * Notifies CallStats that getUserMedia failed.
 *
 * @param {Error} e error to send
 */
Statistics.sendGetUserMediaFailed = function (e) {
    CallStats.sendGetUserMediaFailed(e, null);
};

/**
 * Notifies CallStats that peer connection failed to create offer.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 */
Statistics.prototype.sendCreateOfferFailed = function (e, pc) {
    if(this.callStatsIntegrationEnabled)
        CallStats.sendCreateOfferFailed(e, pc, this.callstats);
};

/**
 * Notifies CallStats that peer connection failed to create answer.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 */
Statistics.prototype.sendCreateAnswerFailed = function (e, pc) {
    if(this.callStatsIntegrationEnabled)
        CallStats.sendCreateAnswerFailed(e, pc, this.callstats);
};

/**
 * Notifies CallStats that peer connection failed to set local description.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 */
Statistics.prototype.sendSetLocalDescFailed = function (e, pc) {
    if(this.callStatsIntegrationEnabled)
        CallStats.sendSetLocalDescFailed(e, pc, this.callstats);
}

/**
 * Notifies CallStats that peer connection failed to set remote description.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 */
Statistics.prototype.sendSetRemoteDescFailed = function (e, pc) {
    if(this.callStatsIntegrationEnabled)
        CallStats.sendSetRemoteDescFailed(e, pc, this.callstats);
}

/**
 * Notifies CallStats that peer connection failed to add ICE candidate.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 */
Statistics.prototype.sendAddIceCandidateFailed = function (e, pc) {
    if(this.callStatsIntegrationEnabled)
        CallStats.sendAddIceCandidateFailed(e, pc, this.callstats);
}

/**
 * Sends the given feedback through CallStats.
 *
 * @param overallFeedback an integer between 1 and 5 indicating the
 * user feedback
 * @param detailedFeedback detailed feedback from the user. Not yet used
 */
Statistics.prototype.sendFeedback =
function(overallFeedback, detailedFeedback){
    if(this.callStatsIntegrationEnabled && this.callstats)
        this.callstats.sendFeedback(overallFeedback, detailedFeedback);
}

Statistics.LOCAL_JID = require("../../service/statistics/constants").LOCAL_JID;

module.exports = Statistics;
