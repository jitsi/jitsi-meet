/* global config, $, APP, Strophe, callstats */

var Settings = require('../settings/Settings');
var ScriptUtil = require('../util/ScriptUtil');
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

/**
 * Some errors may occur before CallStats.init in which case we will accumulate 
 * them and submit them to callstats.io on CallStats.init.
 */
var pendingErrors = [];

function initCallback (err, msg) {
    console.log("CallStats Status: err=" + err + " msg=" + msg);
}

/**
 * The indicator which determines whether the integration of callstats.io is
 * enabled/allowed. Its value does not indicate whether the integration will
 * succeed at runtime but rather whether it is to be attempted at runtime at
 * all.
 */
var _enabled
    = config.callStatsID && config.callStatsSecret
        // Even though AppID and AppSecret may be specified, the integration of
        // callstats.io may be disabled because of globally-disallowed requests
        // to any third parties.
        && (config.disableThirdPartyRequests !== true);

if (_enabled) {
    // Since callstats.io is a third party, we cannot guarantee the quality of
    // their service. More specifically, their server may take noticeably long
    // time to respond. Consequently, it is in our best interest (in the sense
    // that the intergration of callstats.io is pretty important to us but not
    // enough to allow it to prevent people from joining a conference) to (1)
    // start downloading their API as soon as possible and (2) do the
    // downloading asynchronously.
    ScriptUtil.loadScript(
            'https://api.callstats.io/static/callstats.min.js',
            /* async */ true,
            /* prepend */ true);
    // FIXME At the time of this writing, we hope that the callstats.io API will
    // have loaded by the time we needed it (i.e. CallStats.init is invoked).
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
            console.error(e);
        }
    };
}

var CallStats = {
    init: _try_catch(function (jingleSession) {
        if(!this.isEnabled() || callStats !== null) {
            return;
        }

        try {
            callStats = new callstats($, io, jsSHA);

            this.session = jingleSession;
            this.peerconnection = jingleSession.peerconnection.peerconnection;
            this.userID = Settings.getCallStatsUserName();

            var location = window.location;

            this.confID = location.hostname + location.pathname;

            callStats.initialize(
                    config.callStatsID, config.callStatsSecret,
                    this.userID /* generated or given by the origin server */,
                    initCallback);

            var usage = callStats.fabricUsage.multiplex;

            callStats.addNewFabric(
                    this.peerconnection,
                    Strophe.getResourceFromJid(jingleSession.peerjid),
                    usage,
                    this.confID,
                    this.pcCallback.bind(this));
        } catch (e) {
            // The callstats.io API failed to initialize (e.g. because its
            // download failed to succeed in general or on time). Further
            // attempts to utilize it cannot possibly succeed.
            callStats = null;
            console.error(e);
        }
        // Notify callstats about pre-init failures if there were any.
        if (callStats && pendingErrors.length) {
            pendingErrors.forEach(function (error) {
                this._reportError(error.type, error.error, error.pc);
            }, this);
            pendingErrors.length = 0;
        }
    }),

    /**
     * Returns true if the callstats integration is enabled, otherwise returns
     * false.
     *
     * @returns true if the callstats integration is enabled, otherwise returns
     * false.
     */
    isEnabled: function() {
        return _enabled;
    },

    pcCallback: _try_catch(function (err, msg) {
        if (!callStats) {
            return;
        }
        console.log("Monitoring status: "+ err + " msg: " + msg);
        callStats.sendFabricEvent(this.peerconnection,
            callStats.fabricEvent.fabricSetup, this.confID);
    }),

    sendMuteEvent: _try_catch(function (mute, type) {
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
    }),

    sendTerminateEvent: _try_catch(function () {
        if(!callStats) {
            return;
        }
        callStats.sendFabricEvent(this.peerconnection,
            callStats.fabricEvent.fabricTerminated, this.confID);
    }),

    sendSetupFailedEvent: _try_catch(function () {
        if(!callStats) {
            return;
        }
        callStats.sendFabricEvent(this.peerconnection,
            callStats.fabricEvent.fabricSetupFailed, this.confID);
    }),

    /**
     * Sends the given feedback through CallStats.
     *
     * @param overallFeedback an integer between 1 and 5 indicating the
     * user feedback
     * @param detailedFeedback detailed feedback from the user. Not yet used
     */
    sendFeedback: _try_catch(function(overallFeedback, detailedFeedback) {
        if(!callStats) {
            return;
        }
        var feedbackString =    '{"userID":"' + this.userID + '"' +
                                ', "overall":' + overallFeedback +
                                ', "comment": "' + detailedFeedback + '"}';

        var feedbackJSON = JSON.parse(feedbackString);

        callStats.sendUserFeedback(this.confID, feedbackJSON);
    }),

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
        } else if (this.isEnabled()) {
            pendingErrors.push({ type: type, error: e, pc: pc });
        }
        // else just ignore it
    },

    /**
     * Notifies CallStats that getUserMedia failed.
     *
     * @param {Error} e error to send
     */
    sendGetUserMediaFailed: _try_catch(function (e) {
        this._reportError(wrtcFuncNames.getUserMedia, e, null);
    }),

    /**
     * Notifies CallStats that peer connection failed to create offer.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendCreateOfferFailed: _try_catch(function (e, pc) {
        this._reportError(wrtcFuncNames.createOffer, e, pc);
    }),

    /**
     * Notifies CallStats that peer connection failed to create answer.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendCreateAnswerFailed: _try_catch(function (e, pc) {
        this._reportError(wrtcFuncNames.createAnswer, e, pc);
    }),

    /**
     * Notifies CallStats that peer connection failed to set local description.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendSetLocalDescFailed: _try_catch(function (e, pc) {
        this._reportError(wrtcFuncNames.setLocalDescription, e, pc);
    }),

    /**
     * Notifies CallStats that peer connection failed to set remote description.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendSetRemoteDescFailed: _try_catch(function (e, pc) {
        this._reportError(wrtcFuncNames.setRemoteDescription, e, pc);
    }),

    /**
     * Notifies CallStats that peer connection failed to add ICE candidate.
     *
     * @param {Error} e error to send
     * @param {RTCPeerConnection} pc connection on which failure occured.
     */
    sendAddIceCandidateFailed: _try_catch(function (e, pc) {
        this._reportError(wrtcFuncNames.addIceCandidate, e, pc);
    })
};
module.exports = CallStats;
