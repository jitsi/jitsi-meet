/* global $, $iq, config, connection, focusJid, forceMuted, messageHandler,
   setAudioMuted, Strophe, toggleAudio */
/**
 * Moderate connection plugin.
 */
Strophe.addConnectionPlugin('moderate', {
    connection: null,
    init: function (conn) {
        this.connection = conn;

        this.connection.addHandler(this.onMute.bind(this),
                                   'http://jitsi.org/jitmeet/audio',
                                   'iq',
                                   'set',
                                   null,
                                   null);
    },
    setMute: function (jid, mute) {
        console.info("set mute", mute);
        var iqToFocus = $iq({to: focusJid, type: 'set'})
            .c('mute', {
                xmlns: 'http://jitsi.org/jitmeet/audio',
                jid: jid
            })
            .t(mute.toString())
            .up();

        this.connection.sendIQ(
            iqToFocus,
            function (result) {
                console.log('set mute', result);
            },
            function (error) {
                console.log('set mute error', error);
                // FIXME: this causes an exception
                //messageHandler.openReportDialog(null, 'Failed to mute ' +
                  //  $("#participant_" + jid).find(".displayname").text() ||
                    //"participant" + '.', error);
            });
    },
    onMute: function (iq) {
        var from = iq.getAttribute('from');
        if (from !== focusJid) {
            console.warn("Ignored mute from non focus peer");
            return false;
        }
        var mute = $(iq).find('mute');
        if (mute.length) {
            var doMuteAudio = mute.text() === "true";
            setAudioMuted(doMuteAudio);
            forceMuted = doMuteAudio;
        }
        return true;
    },
    eject: function (jid) {
        // We're not the focus, so can't terminate
        //connection.jingle.terminateRemoteByJid(jid, 'kick');
        connection.emuc.kick(jid);
    }
});