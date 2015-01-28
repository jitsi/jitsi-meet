/*jslint plusplus: true */
/*jslint nomen: true*/

var SimulcastSender = require("./SimulcastSender");
var NoSimulcastSender = SimulcastSender["no"];
var NativeSimulcastSender = SimulcastSender["native"];
var SimulcastReceiver = require("./SimulcastReceiver");
var SimulcastUtils = require("./SimulcastUtils");
var RTCEvents = require("../../service/RTC/RTCEvents");


/**
 *
 * @constructor
 */
function SimulcastManager() {

    // Create the simulcast utilities.
    this.simulcastUtils = new SimulcastUtils();

    // Create remote simulcast.
    this.simulcastReceiver = new SimulcastReceiver();

    // Initialize local simulcast.

    // TODO(gp) move into SimulcastManager.prototype.getUserMedia and take into
    // account constraints.
    if (!config.enableSimulcast) {
        this.simulcastSender = new NoSimulcastSender();
    } else {

        var isChromium = window.chrome,
            vendorName = window.navigator.vendor;
        if(isChromium !== null && isChromium !== undefined
            /* skip opera */
            && vendorName === "Google Inc."
            /* skip Chromium as suggested by fippo */
            && !window.navigator.appVersion.match(/Chromium\//) ) {
            var ver = parseInt(window.navigator.appVersion.match(/Chrome\/(\d+)\./)[1], 10);
            if (ver > 37) {
                this.simulcastSender = new NativeSimulcastSender();
            } else {
                this.simulcastSender = new NoSimulcastSender();
            }
        } else {
            this.simulcastSender = new NoSimulcastSender();
        }

    }
    APP.RTC.addListener(RTCEvents.SIMULCAST_LAYER_CHANGED,
        function (endpointSimulcastLayers) {
            endpointSimulcastLayers.forEach(function (esl) {
                var ssrc = esl.simulcastLayer.primarySSRC;
                simulcast._setReceivingVideoStream(esl.endpoint, ssrc);
            });
        });
    APP.RTC.addListener(RTCEvents.SIMULCAST_START, function (simulcastLayer) {
        var ssrc = simulcastLayer.primarySSRC;
        simulcast._setLocalVideoStreamEnabled(ssrc, true);
    });
    APP.RTC.addListener(RTCEvents.SIMULCAST_STOP, function (simulcastLayer) {
        var ssrc = simulcastLayer.primarySSRC;
        simulcast._setLocalVideoStreamEnabled(ssrc, false);
    });

}

/**
 * Restores the simulcast groups of the remote description. In
 * transformRemoteDescription we remove those in order for the set remote
 * description to succeed. The focus needs the signal the groups to new
 * participants.
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.reverseTransformRemoteDescription = function (desc) {
    return this.simulcastReceiver.reverseTransformRemoteDescription(desc);
};

/**
 * Removes the ssrc-group:SIM from the remote description bacause Chrome
 * either gets confused and thinks this is an FID group or, if an FID group
 * is already present, it fails to set the remote description.
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformRemoteDescription = function (desc) {
    return this.simulcastReceiver.transformRemoteDescription(desc);
};

/**
 * Gets the fully qualified msid (stream.id + track.id) associated to the
 * SSRC.
 *
 * @param ssrc
 * @returns {*}
 */
SimulcastManager.prototype.getRemoteVideoStreamIdBySSRC = function (ssrc) {
    return this.simulcastReceiver.getRemoteVideoStreamIdBySSRC(ssrc);
};

/**
 * Returns a stream with single video track, the one currently being
 * received by this endpoint.
 *
 * @param stream the remote simulcast stream.
 * @returns {webkitMediaStream}
 */
SimulcastManager.prototype.getReceivingVideoStream = function (stream) {
    return this.simulcastReceiver.getReceivingVideoStream(stream);
};

/**
 *
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformLocalDescription = function (desc) {
    return this.simulcastSender.transformLocalDescription(desc);
};

/**
 *
 * @returns {*}
 */
SimulcastManager.prototype.getLocalVideoStream = function() {
    return this.simulcastSender.getLocalVideoStream();
};

/**
 * GUM for simulcast.
 *
 * @param constraints
 * @param success
 * @param err
 */
SimulcastManager.prototype.getUserMedia = function (constraints, success, err) {

    this.simulcastSender.getUserMedia(constraints, success, err);
};

/**
 * Prepares the local description for public usage (i.e. to be signaled
 * through Jingle to the focus).
 *
 * @param desc
 * @returns {RTCSessionDescription}
 */
SimulcastManager.prototype.reverseTransformLocalDescription = function (desc) {
    return this.simulcastSender.reverseTransformLocalDescription(desc);
};

/**
 * Ensures that the simulcast group is present in the answer, _if_ native
 * simulcast is enabled,
 *
 * @param desc
 * @returns {*}
 */
SimulcastManager.prototype.transformAnswer = function (desc) {
    return this.simulcastSender.transformAnswer(desc);
};

SimulcastManager.prototype.getReceivingSSRC = function (jid) {
    return this.simulcastReceiver.getReceivingSSRC(jid);
};

SimulcastManager.prototype.getReceivingVideoStreamBySSRC = function (msid) {
    return this.simulcastReceiver.getReceivingVideoStreamBySSRC(msid);
};

/**
 *
 * @param lines
 * @param mediatypes
 * @returns {*}
 */
SimulcastManager.prototype.parseMedia = function(lines, mediatypes) {
    var sb = lines.sdp.split('\r\n');
    return this.simulcastUtils.parseMedia(sb, mediatypes);
};

SimulcastManager.prototype._setReceivingVideoStream = function(resource, ssrc) {
    this.simulcastReceiver._setReceivingVideoStream(resource, ssrc);
};

SimulcastManager.prototype._setLocalVideoStreamEnabled = function(ssrc, enabled) {
    this.simulcastSender._setLocalVideoStreamEnabled(ssrc, enabled);
};

SimulcastManager.prototype.resetSender = function() {
    if (typeof this.simulcastSender.reset === 'function'){
        this.simulcastSender.reset();
    }
};

var simulcast = new SimulcastManager();

module.exports = simulcast;