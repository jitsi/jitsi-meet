/* global config, $, APP, Strophe, callstats */
var callStats = null;

function initCallback (err, msg) {
    console.log("Initializing Status: err="+err+" msg="+msg);
}

var CallStats = {
    init: function (jingleSession) {

        if(!config.callStatsID || !config.callStatsSecret || callStats !== null)
            return;

        callStats = new callstats($,io,jsSHA);

        this.session = jingleSession;
        this.peerconnection = jingleSession.peerconnection.peerconnection;

        this.userID =  APP.xmpp.myResource();

        var location = window.location;
        this.confID = location.protocol + "//" +
            location.hostname + location.pathname;

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
    }

};
module.exports = CallStats;