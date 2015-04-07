/* global APP */

/**
 * A module for sending DTMF tones.
 */
var DTMFSender;
var initDtmfSender = function() {
    // TODO: This needs to reset this if the peerconnection changes
    // (e.g. the call is re-made)
    if (DTMFSender)
        return;

    var localAudio = APP.RTC.localAudio;
    if (localAudio && localAudio.getTracks().length > 0)
    {
        var peerconnection =
            APP.xmpp.getConnection().jingle.activecall.peerconnection.peerconnection;
        if (peerconnection) {
            DTMFSender =
                peerconnection.createDTMFSender(localAudio.getTracks()[0]);
            console.log("Initialized DTMFSender");
        }
        else {
            console.log("Failed to initialize DTMFSender: no PeerConnection.");
        }
    }
    else {
        console.log("Failed to initialize DTMFSender: no audio track.");
    }
};

var DTMF = {
    sendTones: function (tones) {
        if (!DTMFSender)
            initDtmfSender();

        if (DTMFSender){
            DTMFSender.insertDTMF(tones);
        }
    }
};

module.exports = DTMF;

