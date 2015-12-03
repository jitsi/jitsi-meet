var logger = require("jitsi-meet-logger").getLogger(__filename);

function JitsiDTMFManager (localAudio, peerConnection) {
    var tracks = localAudio._getTracks();
    if (!tracks.length) {
        throw new Error("Failed to initialize DTMFSender: no audio track.");
    }
    this.dtmfSender = peerConnection.peerconnection.createDTMFSender(tracks[0]);
    logger.debug("Initialized DTMFSender");
}


JitsiDTMFManager.prototype.sendTones = function (tones, duration, pause) {
    this.dtmfSender.insertDTMF(tones, (duration || 200), (pause || 200));
};
