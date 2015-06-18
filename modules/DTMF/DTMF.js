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
        var peerconnection
            = APP.xmpp.getConnection().jingle.activecall.peerconnection;
        if (peerconnection) {
            DTMFSender =
                peerconnection.peerconnection
                    .createDTMFSender(localAudio.getTracks()[0]);
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
    sendTones: function (tones, duration, pause) {
        if (!DTMFSender)
            initDtmfSender();

        if (DTMFSender){
            DTMFSender.insertDTMF(tones,
                                  (duration || 200),
                                  (pause || 200));
        }
    }
};

module.exports = DTMF;

