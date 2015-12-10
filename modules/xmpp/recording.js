/* global $, $iq, config, connection, focusMucJid, messageHandler,
   Toolbar, Util */
var XMPPEvents = require("../../service/XMPP/XMPPEvents");

function Recording(ee, connection, focusMucJid) {
    this.eventEmitter = ee;
    this.connection = connection;
    this.connection.jibri.setHandler(this.handleJibriIq);
    this.state = "off";
    this.focusMucJid = focusMucJid;
    this.url = null;
    this.isRecordingSupported = false;
}

Recording.prototype.handleJibriPresence = function (jibri) {
    this.eventEmitter.emit(XMPPEvents.RECORDING_STATE_CHANGED);
};

Recording.prototype.setRecording = function (state, streamId, callback){
    if (state == this.state){
        return;
    }

    var iq = $iq({to: this.focusMucJid, type: 'set'})
        .c('jibri', {
            xmlns: 'http://jitsi.org/protocol/jibri',
            action: (state === 'on') ? 'start' : 'stop',
            streamId: streamId
        }).up();

    console.log('Set jibri recording: '+state, iq);

    this.connection.sendIQ(
        iq,
        function (result) {
            var recordingEnabled = $(result).find('jibri').attr('state');
            console.log('Jibri recording is now: ' + recordingEnabled);
            //TODO hook us up to further jibri IQs so we can update the status
            callback(recordingEnabled);
        },
        function (error) {
            console.log('Failed to start recording, error: ', error);
            callback(this.state);
        });
};

Recording.prototype.toggleRecording = function (token) {
        // Jirecon does not (currently) support a token.
    if (!token) {
        console.error("No token passed!");
        return;
    }

    var oldState = this.state;
    var newState = (oldState === 'off' || !oldState) ? 'on' : 'off';

    this.setRecording(newState,
        token,
        function (state) {
            console.log("New recording state: ", state);
            if (state !== oldState) {
                this.state = state;
                this.eventEmitter.emit(XMPPEvents.RECORDING_STATE_CHANGED,
                     state);
            }
        }
    );
};

module.exports = Recording;
