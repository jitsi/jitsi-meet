/*
 * Copyright @ 2015 Atlassian Pty Ltd
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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