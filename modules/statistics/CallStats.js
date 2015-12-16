/* global config, $, APP, Strophe, callstats */

var Settings = require('../settings/Settings');
var jsSHA = require('jssha');
var io = require('socket.io-client');
var callStats = null;

/**
 * @const
 * @see http://www.callstats.io/api/#enumeration-of-wrtcfuncnames
 */
var wrtcFuncNames = {
    createOffer:          "createOffer",
    createAnswer:         "createAnswer",
    setLocalDescription:  "setLocalDescription",
    setRemoteDescription: "setRemoteDescription",
    addIceCandidate:      "addIceCandidate",
    getUserMedia:         "getUserMedia"
};

// some errors may happen before CallStats init
// in this case we accumulate them in this array
// and send them to callstats on init
var pendingErrors = [];

function initCallback (err, msg) {
    console.log("CallStats Status: err=" + err + " msg=" + msg);
}

var callStatsIntegrationEnabled = config.callStatsID && config.callStatsSecret;

var CallStats = {
    init: function (jingleSession) {
        callStatsIntegrationEnabled = config.callStatsID
          && config.callStatsSecret;
        if(!callStatsIntegrationEnabled || callStats !== null) {
            return;
        }

        callStats = new callstats($, io, jsSHA);

        this.session = jingleSession;
        this.peerconnection = jingleSession.peerconnection.peerconnection;

        this.userID = Settings.getCallStatsUserName();

        var location = window.location;
        this.confID = APP.xmpp.getRoomJid();

        //userID is generated or given by the origin server
        callStats.initialize(config.callStatsID,
            config.callStatsSecret,
            this.userID,
            initCallback);

        var usage = callStats.fabricUsage.multiplex;

        callStats.addNewFabric(this.peerconnection,
            Strophe.getResourceFromJid(jingleSession.peerjid),
            usage,
            this.confID,
            this.pcCallback.bind(this));

        // notify callstats about failures if there were any
        if (pendingErrors.length) {
            pendingErrors.forEach(function (error) {
                this._reportError(error.type, error.error, error.pc);
            }, this);
            pendingErrors.length = 0;
        }
    },
    /**
     * Returns true if the callstats integration is enabled, otherwise returns
     * false.
     *
     * @returns true if the callstats integration is enabled, otherwise returns
     * false.
     */
    isEnabled: function() {
        return callStatsIntegrationEnabled;
    },
    pcCallback: function (err, msg) {
        if (!callStats) {
            return;
        }
        console.log("Monitoring status: "+ err + " msg: " + msg);
        callStats.sendFabricEvent(this.peerconnection,
            callStats.fabricEvent.fabricSetup, this.confID);
    },
    sendMuteEvent: function (mute, type) {
        if (!callStats) {
            return;
        }
        var event = null;
        if (type === "video") {
            event = (mute? callStats.fabricEvent.videoPause :
                callStats.fabricEvent.videoResume);
        }
        else {
            event = (mute? callStats.fabricEvent.audioMute :
                callStats.fabricEvent.audioUnmute);
        }
        callStats.sendFabricEvent(this.peerconnection, event, this.confID);
    },
    sendTerminateEvent: function () {
        if(!callStats) {
            return;
        }
        callStats.sendFabricEvent(this.peerconnection,
            callStats.fabricEvent.fabricTerminated, this.confID);
    },
    sendSetupFailedEvent: function () {
        if(!callStats) {
            return;
        }
        callStats.sendFabricEvent(this.peerconnection,
            callStats.fabricEvent.fabricSetupFailed, this.confID);
    },

   /**
     * Sends the given feedback through CallStats.
     *
     * @param overallFeedback an integer between 1 and 5 indicating the
     * user feedback
     * @param detailedFeedback detailed feedback from the user. Not yet used
     */
    sendFeedback: function(overallFeedback, detailedFeedback) {
        if(!callStats) {
            return;
        }
        var feedbackString =    '{"userID":"' + this.userID + '"' +
                                ', "overall":' + overallFeedback +
                                ', "comment": "' + detailedFeedback + '"}';

        var feedbackJSON = JSON.parse(feedbackString);

        callStats.sendUserFeedback(
            this.confID, feedbackJSON);
    },
    /**
     * Reports an error to callstats.
     *
     * @param type the type of the error, which will be one of the wrtcFuncNames
     * @param e the error
     * @param pc the peerconnection
     * @private
     */
    _reportError: function (type, e, pc) {
        if (callStats) {
            callStats.reportError(pc, this.confID, type, e);
        } else if (callStatsIntegrationEnabled) {
            pendingErrors.push({
                type: type,
                error: e,
                pc: pc
            });
        }
        // else just ignore it
    },

    /**
     * Notifies CallStats that getUserMedia failed.
     *
     * @param {Error} e error to send
     */
    sendGetUserMediaFailed: function (e) {
        this._reportError(wrtcFuncNames.getUserMedia, e, null);
    },

    /**
     * Notifies CallStats that peer connection failed to create offer.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendCreateOfferFailed: function (e, pc) {
        this._reportError(wrtcFuncNames.createOffer, e, pc);
    },

    /**
     * Notifies CallStats that peer connection failed to create answer.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendCreateAnswerFailed: function (e, pc) {
        this._reportError(wrtcFuncNames.createAnswer, e, pc);
    },

    /**
     * Notifies CallStats that peer connection failed to set local description.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendSetLocalDescFailed: function (e, pc) {
        this._reportError(wrtcFuncNames.setLocalDescription, e, pc);
    },

    /**
     * Notifies CallStats that peer connection failed to set remote description.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendSetRemoteDescFailed: function (e, pc) {
        this._reportError(wrtcFuncNames.setRemoteDescription, e, pc);
    },

    /**
     * Notifies CallStats that peer connection failed to add ICE candidate.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendAddIceCandidateFailed: function (e, pc) {
        this._reportError(wrtcFuncNames.addIceCandidate, e, pc);
    }
};
module.exports = CallStats;
