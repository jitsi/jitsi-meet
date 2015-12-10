/* global $, $iq, config, connection, focusMucJid, messageHandler,
   Toolbar, Util */
var Moderator = require("./moderator");


var recordingToken = null;
var recordingEnabled;

/**
 * Whether to use a jirecon component for recording, or use the videobridge
 * through COLIBRI.
 */
var useJirecon;

var useJibri;
var eventEmitter;

/**
 * The ID of the jirecon recording session. Jirecon generates it when we
 * initially start recording, and it needs to be used in subsequent requests
 * to jirecon.
 */
var jireconRid = null;

/**
 * The callback to update the recording button. Currently used from colibri
 * after receiving a pending status.
 */
var recordingStateChangeCallback = null;

function setRecordingToken(token) {
    recordingToken = token;
}

function setRecordingJirecon(state, token, callback, connection) {
    if (state == recordingEnabled){
        return;
    }

    var iq = $iq({to: config.hosts.jirecon, type: 'set'})
        .c('recording', {xmlns: 'http://jitsi.org/protocol/jirecon',
            action: (state === 'on') ? 'start' : 'stop',
            mucjid: connection.emuc.roomjid});
    if (state === 'off'){
        iq.attrs({rid: jireconRid});
    }

    console.log('Start recording');

    connection.sendIQ(
        iq,
        function (result) {
            // TODO wait for an IQ with the real status, since this is
            // provisional?
            //FIXME: state should reflect the NEW state.
            jireconRid = $(result).find('recording').attr('rid');
            console.log('Recording ' +
                ((state === 'on') ? 'started' : 'stopped') +
                '(jirecon)' + result);
            recordingEnabled = state;
            if (state === 'off'){
                jireconRid = null;
            }

            callback(state);
        },
        function (error) {
            console.log('Failed to start recording, error: ', error);
            callback(recordingEnabled);
        });
}

function setRecordingJibri(state, token, callback, connection) {
    if (state == recordingEnabled){
        return;
    }

    var focusJid = connection.emuc.focusMucJid;
    var iq = $iq({to: focusJid, type: 'set'})
        .c('jibri', {
            xmlns: 'http://jitsi.org/protocol/jibri',
            action: (state === 'on') ? 'start' : 'stop'
            //TODO: add the stream id?
        }).up();

    console.log('Set jibri recording: '+state, iq);

    connection.sendIQ(
        iq,
        function (result) {
            var recordingEnabled = $(result).find('jibri').attr('state');
            console.log('Jibri recording is now: ' + recordingEnabled);
            //TODO hook us up to further jibri IQs so we can update the status
            callback(recordingEnabled);
        },
        function (error) {
            console.log('Failed to start recording, error: ', error);
            callback(recordingEnabled);
        });
}

// Sends a COLIBRI message which enables or disables (according to 'state')
// the recording on the bridge. Waits for the result IQ and calls 'callback'
// with the new recording state, according to the IQ.
function setRecordingColibri(state, token, callback, connection) {
    var elem = $iq({to: connection.emuc.focusMucJid, type: 'set'});
    elem.c('conference', {
        xmlns: 'http://jitsi.org/protocol/colibri'
    });
    elem.c('recording', {state: state, token: token});

    connection.sendIQ(elem,
        function (result) {
            console.log('Set recording "', state, '". Result:', result);
            var recordingElem = $(result).find('>conference>recording');
            var newState = recordingElem.attr('state');

            recordingEnabled = newState;
            callback(newState);

            if (newState === 'pending' && !recordingStateChangeCallback) {
                recordingStateChangeCallback = callback;
                connection.addHandler(function(iq){
                    var state = $(iq).find('recording').attr('state');
                    if (state)
                        recordingStateChangeCallback(state);
                }, 'http://jitsi.org/protocol/colibri', 'iq', null, null, null);
            }
        },
        function (error) {
            console.warn(error);
            callback(recordingEnabled);
        }
    );
}

function setRecording(state, token, callback, connection) {
    if (useJibri) {
        setRecordingJibri(state, token, callback, connection);
    } else if (useJirecon){
        setRecordingJirecon(state, token, callback, connection);
    } else {
        setRecordingColibri(state, token, callback, connection);
    }
}

function handleJibriIq(iq) {
    //TODO verify it comes from the focus

    var newState = $(iq).find('jibri').attr('state');
    if (newState) {
        eventEmitter.emit('recording.state_changed', newState);
    }
}

var Recording = {
    init: function (ee) {
        eventEmitter = ee;
        useJirecon = config.hosts &&
            (typeof config.hosts.jirecon != "undefined");
        useJibri = config.recordingUseJibri;
        connection.jibri.setHandler(handleJibriIq);
    },
    toggleRecording: function (tokenEmptyCallback,
                               recordingStateChangeCallback,
                               connection) {
        if (!Moderator.isModerator()) {
            console.log(
                    'non-focus, or conference not yet organized:' +
                    ' not enabling recording');
            return;
        }

        var self = this;
        // Jirecon does not (currently) support a token.
        if (!recordingToken && !useJirecon) {
            tokenEmptyCallback(function (value) {
                setRecordingToken(value);
                self.toggleRecording(tokenEmptyCallback,
                                     recordingStateChangeCallback,
                                     connection);
            });

            return;
        }

        var oldState = recordingEnabled;
        var newState = (oldState === 'off' || !oldState) ? 'on' : 'off';

        setRecording(newState,
            recordingToken,
            function (state) {
                console.log("New recording state: ", state);
                if (state === oldState) {
                    // FIXME: new focus:
                    // this will not work when moderator changes
                    // during active session. Then it will assume that
                    // recording status has changed to true, but it might have
                    // been already true(and we only received actual status from
                    // the focus).
                    //
                    // SO we start with status null, so that it is initialized
                    // here and will fail only after second click, so if invalid
                    // token was used we have to press the button twice before
                    // current status will be fetched and token will be reset.
                    //
                    // Reliable way would be to return authentication error.
                    // Or status update when moderator connects.
                    // Or we have to stop recording session when current
                    // moderator leaves the room.

                    // Failed to change, reset the token because it might
                    // have been wrong
                    setRecordingToken(null);
                }
                recordingStateChangeCallback(state);

            },
            connection
        );
    }

};

module.exports = Recording;