/**
 * Base class for ColibriFocus and JingleSession.
 * @param connection Strophe connection object
 * @constructor
 */
function SessionBase(connection){

    this.connection = connection;
    this.peerconnection
        = new TraceablePeerConnection(
            connection.jingle.ice_config,
            connection.jingle.pc_constraints);
}


SessionBase.prototype.modifySources = function() {
    var self = this;
    this.peerconnection.modifySources(function(){
        $(document).trigger('setLocalDescription.jingle', [self.sid]);
    });
};

SessionBase.prototype.addSource = function (elem) {

    this.peerconnection.addSource(elem);

    this.modifySources();
};

SessionBase.prototype.removeSource = function (elem) {

    this.peerconnection.removeSource(elem);

    this.modifySources();
};

// SDP-based mute by going recvonly/sendrecv
// FIXME: should probably black out the screen as well
SessionBase.prototype.hardMuteVideo = function (muted) {

    this.peerconnection.hardMuteVideo(muted);

    this.connection.jingle.localVideo.getVideoTracks().forEach(function (track) {
        track.enabled = !muted;
    });
};