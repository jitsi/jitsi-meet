/* global $, Strophe, callstats */
var logger = require("jitsi-meet-logger").getLogger(__filename);

var jsSHA = require('jssha');
var io = require('socket.io-client');

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

var callStats = null;

function initCallback (err, msg) {
    logger.log("CallStats Status: err=" + err + " msg=" + msg);
}

/**
 * Returns a function which invokes f in a try/catch block, logs any exception
 * to the console, and then swallows it.
 *
 * @param f the function to invoke in a try/catch block
 * @return a function which invokes f in a try/catch block, logs any exception
 * to the console, and then swallows it
 */
function _try_catch (f) {
    return function () {
        try {
            f.apply(this, arguments);
        } catch (e) {
            logger.error(e);
        }
    };
}

/**
 * Creates new CallStats instance that handles all callstats API calls.
 * @param peerConnection {JingleSessionPC} the session object
 * @param Settings {Settings} the settings instance. Declared in
 * /modules/settings/Settings.js
 * @param options {object} credentials for callstats.
 */
var CallStats = _try_catch(function(jingleSession, Settings, options) {
    try{
        //check weather that should work with more than 1 peerconnection
        if(!callStats) {
            callStats = new callstats($, io, jsSHA);
        } else {
            return;
        }

        this.session = jingleSession;
        this.peerconnection = jingleSession.peerconnection.peerconnection;

        this.userID = Settings.getCallStatsUserName();

    //FIXME:  change it to something else (maybe roomName)
        var location = window.location;
        this.confID = location.hostname + location.pathname;

        //userID is generated or given by the origin server
        callStats.initialize(options.callStatsID,
            options.callStatsSecret,
            this.userID,
            initCallback);

        callStats.addNewFabric(this.peerconnection,
            Strophe.getResourceFromJid(jingleSession.peerjid),
            callStats.fabricUsage.multiplex,
            this.confID,
            this.pcCallback.bind(this));
    } catch (e) {
        // The callstats.io API failed to initialize (e.g. because its
        // download failed to succeed in general or on time). Further
        // attempts to utilize it cannot possibly succeed.
        callStats = null;
        logger.error(e);
    }
    // notify callstats about failures if there were any
    if (CallStats.pendingErrors.length) {
        CallStats.pendingErrors.forEach(function (error) {
            CallStats._reportError.call(this, error.type, error.error,
                error.pc);
        }, this);
        CallStats.pendingErrors.length = 0;
    }
});

// some errors may happen before CallStats init
// in this case we accumulate them in this array
// and send them to callstats on init
CallStats.pendingErrors = [];

CallStats.prototype.pcCallback = _try_catch(function (err, msg) {
    if (!callStats) {
        return;
    }
    logger.log("Monitoring status: "+ err + " msg: " + msg);
    callStats.sendFabricEvent(this.peerconnection,
        callStats.fabricEvent.fabricSetup, this.confID);
});

/**
 * Notifies CallStats for mute events
 * @param mute {boolean} true for muted and false for not muted
 * @param type {String} "audio"/"video"
 */
CallStats.prototype.sendMuteEvent = _try_catch(function (mute, type) {
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
});

/**
 * Notifies CallStats for connection setup errors
 */
CallStats.prototype.sendTerminateEvent = _try_catch(function () {
    if(!callStats) {
        return;
    }
    callStats.sendFabricEvent(this.peerconnection,
        callStats.fabricEvent.fabricTerminated, this.confID);
});

/**
 * Notifies CallStats for connection setup errors
 */
CallStats.prototype.sendSetupFailedEvent = _try_catch(function () {
    if(!callStats) {
        return;
    }
    callStats.sendFabricEvent(this.peerconnection,
        callStats.fabricEvent.fabricSetupFailed, this.confID);
});

/**
 * Sends the given feedback through CallStats.
 *
 * @param overallFeedback an integer between 1 and 5 indicating the
 * user feedback
 * @param detailedFeedback detailed feedback from the user. Not yet used
 */
CallStats.prototype.sendFeedback = _try_catch(
function(overallFeedback, detailedFeedback) {
    if(!callStats) {
        return;
    }
    var feedbackString =    '{"userID":"' + this.userID + '"' +
                            ', "overall":' + overallFeedback +
                            ', "comment": "' + detailedFeedback + '"}';

    var feedbackJSON = JSON.parse(feedbackString);

    callStats.sendUserFeedback(this.confID, feedbackJSON);
});

/**
 * Reports an error to callstats.
 *
 * @param type the type of the error, which will be one of the wrtcFuncNames
 * @param e the error
 * @param pc the peerconnection
 * @private
 */
CallStats._reportError = function (type, e, pc) {
    if (callStats) {
        callStats.reportError(pc, this.confID, type, e);
    } else {
        CallStats.pendingErrors.push({ type: type, error: e, pc: pc});
    }
    // else just ignore it
};

/**
 * Notifies CallStats that getUserMedia failed.
 *
 * @param {Error} e error to send
 * @param {CallStats} cs callstats instance related to the error (optional)
 */
CallStats.sendGetUserMediaFailed = _try_catch(function (e, cs) {
    CallStats._reportError.call(cs, wrtcFuncNames.getUserMedia, e, null);
});

/**
 * Notifies CallStats that peer connection failed to create offer.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 * @param {CallStats} cs callstats instance related to the error (optional)
 */
CallStats.sendCreateOfferFailed = _try_catch(function (e, pc, cs) {
    CallStats._reportError.call(cs, wrtcFuncNames.createOffer, e, pc);
});

/**
 * Notifies CallStats that peer connection failed to create answer.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 * @param {CallStats} cs callstats instance related to the error (optional)
 */
CallStats.sendCreateAnswerFailed = _try_catch(function (e, pc, cs) {
    CallStats._reportError.call(cs, wrtcFuncNames.createAnswer, e, pc);
});

/**
 * Notifies CallStats that peer connection failed to set local description.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 * @param {CallStats} cs callstats instance related to the error (optional)
 */
CallStats.sendSetLocalDescFailed = _try_catch(function (e, pc, cs) {
    CallStats._reportError.call(cs, wrtcFuncNames.setLocalDescription, e, pc);
});

/**
 * Notifies CallStats that peer connection failed to set remote description.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 * @param {CallStats} cs callstats instance related to the error (optional)
 */
CallStats.sendSetRemoteDescFailed = _try_catch(function (e, pc, cs) {
    CallStats._reportError.call(cs, wrtcFuncNames.setRemoteDescription, e, pc);
});

/**
 * Notifies CallStats that peer connection failed to add ICE candidate.
 *
 * @param {Error} e error to send
 * @param {RTCPeerConnection} pc connection on which failure occured.
 * @param {CallStats} cs callstats instance related to the error (optional)
 */
CallStats.sendAddIceCandidateFailed = _try_catch(function (e, pc, cs) {
    CallStats._reportError.call(cs, wrtcFuncNames.addIceCandidate, e, pc);
});

module.exports = CallStats;
