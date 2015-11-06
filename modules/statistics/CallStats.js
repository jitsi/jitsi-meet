/* global config, $, APP, Strophe, callstats */

var Settings = require('../settings/Settings');
var jsSHA = require('jssha');
var io = require('socket.io-client');
var callStats = null;

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
    },
    pcCallback: function (err, msg) {
        if (!callStats)
            return;
        console.log("Monitoring status: "+ err + " msg: " + msg);
        callStats.sendFabricEvent(this.peerconnection,
            callStats.fabricEvent.fabricSetup, this.confID);
    },
    sendMuteEvent: function (mute, type) {
        if (!callStats)
            return;
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
    }
};
module.exports = CallStats;