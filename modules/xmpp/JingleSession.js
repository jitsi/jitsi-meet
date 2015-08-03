/*
 * JingleSession provides an API to manage a single Jingle session. We will
 * have different implementations depending on the underlying interface used
 * (i.e. WebRTC and ORTC) and here we hold the code common to all of them.
 */
function JingleSession() {
    // dripping is sending trickle candidates not one-by-one
    this.usedrip = true;
}

module.exports = JingleSession;
