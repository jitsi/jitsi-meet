/* global config, $, APP, Strophe, callstats */

var Settings = require('../settings/Settings');
var jsSHA = require('jssha');
var io = require('socket.io-client');
var callStats = null;

// getUserMedia calls happen before CallStats init
// so if there are any getUserMedia errors, we store them in this array
// and send them to callstats on init
var pendingUserMediaErrors = [];

function initCallback (err, msg) {
    console.log("Initializing Status: err="+err+" msg="+msg);
}

var CallStats = {
    init: function (jingleSession) {

        if(!config.callStatsID || !config.callStatsSecret || callStats !== null)
            return;

        callStats = new callstats($, io, jsSHA);

        this.session = jingleSession;
        this.peerconnection = jingleSession.peerconnection.peerconnection;

        this.userID =  APP.xmpp.myResource();

        //use whatever the user said to facilitate debugging
        if(Settings.getDisplayName())
            this.userID = Settings.getDisplayName();

        var location = window.location;
        this.confID = location.hostname + location.pathname;

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

        // notify callstats about getUserMedia failures if there were any
        if (pendingUserMediaErrors.length) {
            pendingUserMediaErrors.forEach(this.sendGetUserMediaFailed, this);
            pendingUserMediaErrors.length = 0;
        }
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
     * Notifies CallStats that getUserMedia failed.
     *
     * @param {Error} e error to send
     */
    sendGetUserMediaFailed: function (e) {
        if(!callStats) {
            pendingUserMediaErrors.push(e);
            return;
        }
        callStats.reportError(this.peerconnection, this.confID,
                              callStats.webRTCFunctions.getUserMedia, e);
    },

    /**
     * Notifies CallStats that peer connection failed to create offer.
     *
     * @param {Error} e error to send
     */
    sendCreateOfferFailed: function (e) {
        if(!callStats) {
            return;
        }
        callStats.reportError(this.peerconnection, this.confID,
                              callStats.webRTCFunctions.createOffer, e);
    },

    /**
     * Notifies CallStats that peer connection failed to create answer.
     *
     * @param {Error} e error to send
     */
    sendCreateAnswerFailed: function (e) {
        if(!callStats) {
            return;
        }
        callStats.reportError(this.peerconnection, this.confID,
                              callStats.webRTCFunctions.createAnswer, e);
    },

    /**
     * Notifies CallStats that peer connection failed to set local description.
     *
     * @param {Error} e error to send
     */
    sendSetLocalDescFailed: function (e) {
        if(!callStats) {
            return;
        }
        callStats.reportError(this.peerconnection, this.confID,
                              callStats.webRTCFunctions.setLocalDescription, e);
    },

    /**
     * Notifies CallStats that peer connection failed to set remote description.
     *
     * @param {Error} e error to send
     */
    sendSetRemoteDescFailed: function (e) {
        if(!callStats) {
            return;
        }
        callStats.reportError(
            this.peerconnection, this.confID,
            callStats.webRTCFunctions.setRemoteDescription, e);
    },

    /**
     * Notifies CallStats that peer connection failed to add ICE candidate.
     *
     * @param {Error} e error to send
     */
    sendAddIceCandidateFailed: function (e) {
        if(!callStats) {
            return;
        }
        callStats.reportError(this.peerconnection, this.confID,
                              callStats.webRTCFunctions.addIceCandidate, e);
    }
};
module.exports = CallStats;
