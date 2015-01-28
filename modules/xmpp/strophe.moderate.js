/* global $, $iq, config, connection, focusMucJid, forceMuted,
   setAudioMuted, Strophe */
/**
 * Moderate connection plugin.
 */
module.exports = function (XMPP) {
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
            var iqToFocus = $iq({to: this.connection.emuc.focusMucJid, type: 'set'})
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
                });
        },
        onMute: function (iq) {
            var from = iq.getAttribute('from');
            if (from !== this.connection.emuc.focusMucJid) {
                console.warn("Ignored mute from non focus peer");
                return false;
            }
            var mute = $(iq).find('mute');
            if (mute.length) {
                var doMuteAudio = mute.text() === "true";
                APP.UI.setAudioMuted(doMuteAudio);
                XMPP.forceMuted = doMuteAudio;
            }
            return true;
        },
        eject: function (jid) {
            // We're not the focus, so can't terminate
            //connection.jingle.terminateRemoteByJid(jid, 'kick');
            this.connection.emuc.kick(jid);
        }
    });
}