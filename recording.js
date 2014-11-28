/* global $, $iq, config, connection, focusJid, messageHandler, Toolbar, Util */
var Recording = (function (my) {
    var status = false;
    var recordingToken = null;
    var recordingEnabled = false;

    my.setRecordingToken = function (token) {
        recordingToken = token;
    };

    // Sends a COLIBRI message which enables or disables (according to 'state')
    // the recording on the bridge. Waits for the result IQ and calls 'callback'
    // with the new recording state, according to the IQ.
    my.setRecording = function (state, token, callback) {
        var self = this;
        var elem = $iq({to: focusJid, type: 'set'});
        elem.c('conference', {
            xmlns: 'http://jitsi.org/protocol/colibri'
        });
        elem.c('recording', {state: state, token: token});
        elem.up();

        connection.sendIQ(elem,
            function (result) {
                console.log('Set recording "', state, '". Result:', result);
                var recordingElem = $(result).find('>conference>recording');
                var newState = ('true' === recordingElem.attr('state'));

                recordingEnabled = newState;
                callback(newState);
            },
            function (error) {
                console.warn(error);
            }
        );
    };

    my.toggleRecording = function () {
        if (!connection.emuc.isModerator()) {
            console.log(
                'non-focus, or conference not yet organized:' +
                ' not enabling recording');
            return;
        }

        if (!recordingToken)
        {
            messageHandler.openTwoButtonDialog(null,
                    '<h2>Enter recording token</h2>' +
                    '<input id="recordingToken" type="text" placeholder="token" autofocus>',
                false,
                "Save",
                function (e, v, m, f) {
                    if (v) {
                        var token = document.getElementById('recordingToken');

                        if (token.value) {
                            my.setRecordingToken(
                                Util.escapeHtml(token.value));
                            my.toggleRecording();
                        }
                    }
                },
                function (event) {
                    document.getElementById('recordingToken').focus();
                }
            );

            return;
        }

        var oldState = recordingEnabled;
        Toolbar.toggleRecordingButtonState();
        my.setRecording(!oldState,
            recordingToken,
            function (state) {
                console.log("New recording state: ", state);
                if (state == oldState)
                {
                    // Failed to change, reset the token because it might
                    // have been wrong
                    Toolbar.toggleRecordingButtonState();
                    my.setRecordingToken(null);
                }
            }
        );
    };

    return my;
}(Recording || {}));
