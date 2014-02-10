/* colibri.js -- a COLIBRI focus 
 * The colibri spec has been submitted to the XMPP Standards Foundation
 * for publications as a XMPP extensions:
 * http://xmpp.org/extensions/inbox/colibri.html
 *
 * colibri.js is a participating focus, i.e. the focus participates
 * in the conference. The conference itself can be ad-hoc, through a
 * MUC, through PubSub, etc.
 *
 * colibri.js relies heavily on the strophe.jingle library available 
 * from https://github.com/ESTOS/strophe.jingle
 * and interoperates with the Jitsi videobridge available from
 * https://jitsi.org/Projects/JitsiVideobridge
 */
/*
Copyright (c) 2013 ESTOS GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
/* jshint -W117 */
function ColibriFocus(connection, bridgejid) {
    this.connection = connection;
    this.bridgejid = bridgejid;
    this.peers = [];
    this.confid = null;

    this.peerconnection = null;

    // media types of the conference
    this.media = ['audio', 'video'];

    this.sid = Math.random().toString(36).substr(2, 12);
    this.connection.jingle.sessions[this.sid] = this;
    this.mychannel = [];
    this.channels = [];
    this.remotessrc = {};

    // ssrc lines to be added on next update
    this.addssrc = [];
    // ssrc lines to be removed on next update
    this.removessrc = [];

    // container for candidates from the focus
    // gathered before confid is known
    this.drip_container = [];

    // silly wait flag
    this.wait = true;
}

// creates a conferences with an initial set of peers
ColibriFocus.prototype.makeConference = function (peers) {
    var self = this;
    if (this.confid !== null) {
        console.error('makeConference called twice? Ignoring...');
        // FIXME: just invite peers?
        return;
    }
    this.confid = 0; // !null
    this.peers = [];
    peers.forEach(function (peer) {
        self.peers.push(peer);
        self.channels.push([]);
    });

    this.peerconnection = new TraceablePeerConnection(this.connection.jingle.ice_config, this.connection.jingle.pc_constraints);
    this.peerconnection.addStream(this.connection.jingle.localStream);
    this.peerconnection.oniceconnectionstatechange = function (event) {
        console.warn('ice connection state changed to', self.peerconnection.iceConnectionState);
        /*
        if (self.peerconnection.signalingState == 'stable' && self.peerconnection.iceConnectionState == 'connected') {
            console.log('adding new remote SSRCs from iceconnectionstatechange');
            window.setTimeout(function() { self.modifySources(); }, 1000);
        }
        */
    };
    this.peerconnection.onsignalingstatechange = function (event) {
        console.warn(self.peerconnection.signalingState);
        /*
        if (self.peerconnection.signalingState == 'stable' && self.peerconnection.iceConnectionState == 'connected') {
            console.log('adding new remote SSRCs from signalingstatechange');
            window.setTimeout(function() { self.modifySources(); }, 1000);
        }
        */
    };
    this.peerconnection.onaddstream = function (event) {
        self.remoteStream = event.stream;
        // search the jid associated with this stream
        Object.keys(self.remotessrc).forEach(function (jid) {
            if (self.remotessrc[jid].join('\r\n').indexOf('mslabel:' + event.stream.id) != -1) {
                event.peerjid = jid;
                if (self.connection.jingle.jid2session[jid]) {
                    self.connection.jingle.jid2session[jid].remotestream = event.stream;
                }
            }
        });
        $(document).trigger('remotestreamadded.jingle', [event, self.sid]);
    };
    this.peerconnection.onicecandidate = function (event) {
        //console.log('focus onicecandidate', self.confid, new Date().getTime(), event.candidate);
        if (!event.candidate) {
            console.log('end of candidates');
            return;
        }
        if (self.confid === 0) {
            self.drip_container.push(event.candidate);
        } else {
            self.sendIceCandidate(event.candidate);
        }
    };
    this._makeConference();
    /*
    this.peerconnection.createOffer(
        function (offer) {
            self.peerconnection.setLocalDescription(
                offer,
                function () {
                    // success
                    $(document).trigger('setLocalDescription.jingle', [self.sid]);
                    // FIXME: could call _makeConference here and trickle candidates later
                    self._makeConference();
                },
                function (error) {
                    console.log('setLocalDescription failed', error);
                }
            );
        },
        function (error) {
            console.warn(error);
        }
    );
    */
};

ColibriFocus.prototype._makeConference = function () {
    var self = this;
    var elem = $iq({to: this.bridgejid, type: 'get'});
    elem.c('conference', {xmlns: 'http://jitsi.org/protocol/colibri'});

    var stream = this.connection.jingle.localStream;
    this.media.forEach(function (name) {
        elem.c('content', {name: name});
        elem.c('channel', {initiator: 'true', expire: '15'}).up();
        for (var j = 0; j < self.peers.length; j++) {
            elem.c('channel', {initiator: 'true', expire:'15' }).up();
        }
        elem.up(); // end of content
    });
    /*
    var localSDP = new SDP(this.peerconnection.localDescription.sdp);
    localSDP.media.forEach(function (media, channel) {
        var name = SDPUtil.parse_mline(media.split('\r\n')[0]).media; 
        elem.c('content', {name: name});
        elem.c('channel', {initiator: 'false', expire: '15'});

        // FIXME: should reuse code from .toJingle
        var mline = SDPUtil.parse_mline(media.split('\r\n')[0]);
        for (var j = 0; j < mline.fmt.length; j++) {
            var rtpmap = SDPUtil.find_line(media, 'a=rtpmap:' + mline.fmt[j]);
            elem.c('payload-type', SDPUtil.parse_rtpmap(rtpmap));
            elem.up();
        }

        localSDP.TransportToJingle(channel, elem);

        elem.up(); // end of channel
        for (j = 0; j < self.peers.length; j++) {
            elem.c('channel', {initiator: 'true', expire:'15' }).up();
        }
        elem.up(); // end of content
    });
    */

    this.connection.sendIQ(elem,
        function (result) {
            self.createdConference(result);
        },
        function (error) {
            console.warn(error);
        }
    );
};

// callback when a conference was created
ColibriFocus.prototype.createdConference = function (result) {
    console.log('created a conference on the bridge');
    var self = this;
    var tmp;

    this.confid = $(result).find('>conference').attr('id');
    var remotecontents = $(result).find('>conference>content').get();
    var numparticipants = 0;
    for (var i = 0; i < remotecontents.length; i++) {
        tmp = $(remotecontents[i]).find('>channel').get();
        this.mychannel.push($(tmp.shift()));
        numparticipants = tmp.length;
        for (j = 0; j < tmp.length; j++) {
            if (this.channels[j] === undefined) {
                this.channels[j] = [];
            }
            this.channels[j].push(tmp[j]);
        }
    }

    console.log('remote channels', this.channels);

    var bridgeSDP = new SDP('v=0\r\no=- 5151055458874951233 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\nm=audio 1 RTP/SAVPF 111 103 104 0 8 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=mid:audio\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=sendrecv\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=maxptime:60\r\nm=video 1 RTP/SAVPF 100 116 117\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=mid:video\r\na=extmap:2 urn:ietf:params:rtp-hdrext:toffset\r\na=extmap:3 http://www.webrtc.org/experiments/rtp-hdrext/abs-send-time\r\na=sendrecv\r\na=rtpmap:100 VP8/90000\r\na=rtcp-fb:100 ccm fir\r\na=rtcp-fb:100 nack\r\na=rtcp-fb:100 goog-remb\r\na=rtpmap:116 red/90000\r\na=rtpmap:117 ulpfec/90000\r\n');
    bridgeSDP.media.length = this.mychannel.length;
    var channel;
    /*
    for (channel = 0; channel < bridgeSDP.media.length; channel++) {
        bridgeSDP.media[channel] = '';
        // unchanged lines
        bridgeSDP.media[channel] += SDPUtil.find_line(localSDP.media[channel], 'm=') + '\r\n';
        bridgeSDP.media[channel] += SDPUtil.find_line(localSDP.media[channel], 'c=') + '\r\n';
        if (SDPUtil.find_line(localSDP.media[channel], 'a=rtcp:')) {
            bridgeSDP.media[channel] += SDPUtil.find_line(localSDP.media[channel], 'a=rtcp:') + '\r\n';
        }
        if (SDPUtil.find_line(localSDP.media[channel], 'a=mid:')) {
            bridgeSDP.media[channel] += SDPUtil.find_line(localSDP.media[channel], 'a=mid:') + '\r\n';
        }
        if (SDPUtil.find_line(localSDP.media[channel], 'a=sendrecv')) {
            bridgeSDP.media[channel] += 'a=sendrecv\r\n';
        }
        if (SDPUtil.find_line(localSDP.media[channel], 'a=extmap:')) {
            bridgeSDP.media[channel] += SDPUtil.find_lines(localSDP.media[channel], 'a=extmap:').join('\r\n') + '\r\n';
        }

        // FIXME: should look at m-line and group the ids together
        if (SDPUtil.find_line(localSDP.media[channel], 'a=rtpmap:')) {
            bridgeSDP.media[channel] += SDPUtil.find_lines(localSDP.media[channel], 'a=rtpmap:').join('\r\n') + '\r\n';
        }
        if (SDPUtil.find_line(localSDP.media[channel], 'a=fmtp:')) {
            bridgeSDP.media[channel] += SDPUtil.find_lines(localSDP.media[channel], 'a=fmtp:').join('\r\n') + '\r\n';
        }
        if (SDPUtil.find_line(localSDP.media[channel], 'a=rtcp-fb:')) {
            bridgeSDP.media[channel] += SDPUtil.find_lines(localSDP.media[channel], 'a=rtcp-fb:').join('\r\n') + '\r\n';
        }
        // FIXME: changed lines -- a=sendrecv direction, a=setup direction
    }
    */
    for (channel = 0; channel < bridgeSDP.media.length; channel++) {
        // get the mixed ssrc
        tmp = $(this.mychannel[channel]).find('>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
        // FIXME: check rtp-level-relay-type
        if (tmp.length) {
            bridgeSDP.media[channel] += 'a=ssrc:' + tmp.attr('ssrc') + ' ' + 'cname:mixed' + '\r\n';
            bridgeSDP.media[channel] += 'a=ssrc:' + tmp.attr('ssrc') + ' ' + 'label:mixedlabela0' + '\r\n';
            bridgeSDP.media[channel] += 'a=ssrc:' + tmp.attr('ssrc') + ' ' + 'msid:mixedmslabel mixedlabela0' + '\r\n';
            bridgeSDP.media[channel] += 'a=ssrc:' + tmp.attr('ssrc') + ' ' + 'mslabel:mixedmslabel' + '\r\n';
        } else {
            // make chrome happy... '3735928559' == 0xDEADBEEF
            // FIXME: this currently appears as two streams, should be one
            bridgeSDP.media[channel] += 'a=ssrc:' + '3735928559' + ' ' + 'cname:mixed' + '\r\n';
            bridgeSDP.media[channel] += 'a=ssrc:' + '3735928559' + ' ' + 'label:mixedlabelv0' + '\r\n';
            bridgeSDP.media[channel] += 'a=ssrc:' + '3735928559' + ' ' + 'msid:mixedmslabel mixedlabelv0' + '\r\n';
            bridgeSDP.media[channel] += 'a=ssrc:' + '3735928559' + ' ' + 'mslabel:mixedmslabel' + '\r\n';
        }

        // FIXME: should take code from .fromJingle
        tmp = $(this.mychannel[channel]).find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]');
        if (tmp.length) {
            bridgeSDP.media[channel] += 'a=ice-ufrag:' + tmp.attr('ufrag') + '\r\n';
            bridgeSDP.media[channel] += 'a=ice-pwd:' + tmp.attr('pwd') + '\r\n';
            tmp.find('>candidate').each(function () {
                bridgeSDP.media[channel] += SDPUtil.candidateFromJingle(this);
            });
            tmp = tmp.find('>fingerprint');
            if (tmp.length) {
                bridgeSDP.media[channel] += 'a=fingerprint:' + tmp.attr('hash') + ' ' + tmp.text() + '\r\n';
                bridgeSDP.media[channel] += 'a=setup:actpass\r\n'; // offer so always actpass
            }
        }
    }
    bridgeSDP.raw = bridgeSDP.session + bridgeSDP.media.join('');

    this.peerconnection.setRemoteDescription(
        new RTCSessionDescription({type: 'offer', sdp: bridgeSDP.raw}),
        function () {
            console.log('setRemoteDescription success');
            self.peerconnection.createAnswer(
                function (answer) {
                    self.peerconnection.setLocalDescription(answer,
                        function () {
                            console.log('setLocalDescription succeded.');
                            // make sure our presence is updated
                            $(document).trigger('setLocalDescription.jingle', [self.sid]);
                            var elem = $iq({to: self.bridgejid, type: 'get'});
                            elem.c('conference', {xmlns: 'http://jitsi.org/protocol/colibri', id: self.confid});
                            var localSDP = new SDP(self.peerconnection.localDescription.sdp);
                            localSDP.media.forEach(function (media, channel) {
                                var name = SDPUtil.parse_mline(media.split('\r\n')[0]).media; 
                                elem.c('content', {name: name});
                                elem.c('channel', {
                                    initiator: 'true', 
                                    expire: '15',
                                    id: self.mychannel[channel].attr('id')
                                });

                                // FIXME: should reuse code from .toJingle
                                var mline = SDPUtil.parse_mline(media.split('\r\n')[0]);
                                for (var j = 0; j < mline.fmt.length; j++) {
                                    var rtpmap = SDPUtil.find_line(media, 'a=rtpmap:' + mline.fmt[j]);
                                    elem.c('payload-type', SDPUtil.parse_rtpmap(rtpmap));
                                    elem.up();
                                }

                                localSDP.TransportToJingle(channel, elem);

                                elem.up(); // end of channel
                                for (j = 0; j < self.peers.length; j++) {
                                    elem.c('channel', {initiator: 'true', expire:'15' }).up();
                                }
                                elem.up(); // end of content
                            });

                            self.connection.sendIQ(elem,
                                function (result) {
                                    // ...
                                },
                                function (error) {
                                    console.warn(error);
                                }
                            );

                            // now initiate sessions
                            for (var i = 0; i < numparticipants; i++) {
                                self.initiate(self.peers[i], true);
                            }
                        },
                        function (error) {
                            console.warn('setLocalDescription failed.', error);
                        }
                    );
                },
                function (error) {
                    console.warn('createAnswer failed.', error);
                }
            );
            /*
            for (var i = 0; i < numparticipants; i++) {
                self.initiate(self.peers[i], true);
            }
            */
        },
        function (error) {
            console.log('setRemoteDescription failed.', error);
        }
    );

};

// send a session-initiate to a new participant
ColibriFocus.prototype.initiate = function (peer, isInitiator) {
    var participant = this.peers.indexOf(peer);
    console.log('tell', peer, participant);
    var sdp;
    if (this.peerconnection !== null && this.peerconnection.signalingState == 'stable') {
        sdp = new SDP(this.peerconnection.remoteDescription.sdp);
        var localSDP = new SDP(this.peerconnection.localDescription.sdp);
        // throw away stuff we don't want
        // not needed with static offer
        sdp.removeSessionLines('a=group:');
        sdp.removeSessionLines('a=msid-semantic:'); // FIXME: not mapped over jingle anyway...
        for (var i = 0; i < sdp.media.length; i++) {
            sdp.removeMediaLines(i, 'a=rtcp-mux');
            sdp.removeMediaLines(i, 'a=ssrc:');
            sdp.removeMediaLines(i, 'a=crypto:');
            sdp.removeMediaLines(i, 'a=candidate:');
            sdp.removeMediaLines(i, 'a=ice-options:google-ice');
            sdp.removeMediaLines(i, 'a=ice-ufrag:');
            sdp.removeMediaLines(i, 'a=ice-pwd:');
            sdp.removeMediaLines(i, 'a=fingerprint:');
            sdp.removeMediaLines(i, 'a=setup:');

            if (1) { //i > 0) { // not for audio FIXME: does not work as intended
                // re-add all remote a=ssrcs
                for (var jid in this.remotessrc) {
                    if (jid == peer) continue;
                    sdp.media[i] += this.remotessrc[jid][i];
                }
                // and local a=ssrc lines
                sdp.media[i] += SDPUtil.find_lines(localSDP.media[i], 'a=ssrc').join('\r\n') + '\r\n';
            }
        }
        sdp.raw = sdp.session + sdp.media.join('');
    } else {
        console.error('can not initiate a new session without a stable peerconnection');
        return;
    }

    // add stuff we got from the bridge
    for (var j = 0; j < sdp.media.length; j++) {
        var chan = $(this.channels[participant][j]);
        console.log('channel id', chan.attr('id'));

        tmp = chan.find('>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
        if (tmp.length) {
            sdp.media[j] += 'a=ssrc:' + tmp.attr('ssrc') + ' ' + 'cname:mixed' + '\r\n';
            sdp.media[j] += 'a=ssrc:' + tmp.attr('ssrc') + ' ' + 'label:mixedlabela0' + '\r\n';
            sdp.media[j] += 'a=ssrc:' + tmp.attr('ssrc') + ' ' + 'msid:mixedmslabel mixedlabela0' + '\r\n';
            sdp.media[j] += 'a=ssrc:' + tmp.attr('ssrc') + ' ' + 'mslabel:mixedmslabel' + '\r\n';
        } else {
            // make chrome happy... '3735928559' == 0xDEADBEEF
            sdp.media[j] += 'a=ssrc:' + '3735928559' + ' ' + 'cname:mixed' + '\r\n';
            sdp.media[j] += 'a=ssrc:' + '3735928559' + ' ' + 'label:mixedlabelv0' + '\r\n';
            sdp.media[j] += 'a=ssrc:' + '3735928559' + ' ' + 'msid:mixedmslabel mixedlabelv0' + '\r\n';
            sdp.media[j] += 'a=ssrc:' + '3735928559' + ' ' + 'mslabel:mixedmslabel' + '\r\n';
        }

        tmp = chan.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]');
        if (tmp.length) {
            if (tmp.attr('ufrag'))
                sdp.media[j] += 'a=ice-ufrag:' + tmp.attr('ufrag') + '\r\n';
            if (tmp.attr('pwd'))
                sdp.media[j] += 'a=ice-pwd:' + tmp.attr('pwd') + '\r\n';
            // and the candidates...
            tmp.find('>candidate').each(function () {
                sdp.media[j] += SDPUtil.candidateFromJingle(this);
            });
            tmp = tmp.find('>fingerprint');
            if (tmp.length) {
                sdp.media[j] += 'a=fingerprint:' + tmp.attr('hash') + ' ' + tmp.text() + '\r\n';
                /*
                if (tmp.attr('direction')) {
                    sdp.media[j] += 'a=setup:' + tmp.attr('direction') + '\r\n';
                }
                */
                sdp.media[j] += 'a=setup:actpass\r\n';
            }
        }
    }
    // make a new colibri session and configure it
    // FIXME: is it correct to use this.connection.jid when used in a MUC?
    var sess = new ColibriSession(this.connection.jid,
                                  Math.random().toString(36).substr(2, 12), // random string
                                  this.connection);
    sess.initiate(peer);
    sess.colibri = this;
    sess.localStream = this.connection.jingle.localStream;
    sess.media_constraints = this.connection.jingle.media_constraints;
    sess.pc_constraints = this.connection.jingle.pc_constraints;
    sess.ice_config = this.connection.jingle.ice_config;

    this.connection.jingle.sessions[sess.sid] = sess;
    this.connection.jingle.jid2session[sess.peerjid] = sess;

    // send a session-initiate
    var init = $iq({to: peer, type: 'set'})
        .c('jingle',
            {xmlns: 'urn:xmpp:jingle:1',
             action: 'session-initiate',
             initiator: sess.me,
             sid: sess.sid
            }
    );
    sdp.toJingle(init, 'initiator');
    this.connection.sendIQ(init,
        function (res) {
            console.log('got result');
        },
        function (err) {
            console.log('got error');
        }
    );
};

// pull in a new participant into the conference
ColibriFocus.prototype.addNewParticipant = function (peer) {
    var self = this;
    if (this.confid === 0) {
        // bad state
        console.log('confid does not exist yet, postponing', peer);
        window.setTimeout(function () {
            self.addNewParticipant(peer);
        }, 250);
        return;
    }
    var index = this.channels.length;
    this.channels.push([]);
    this.peers.push(peer);

    var elem = $iq({to: this.bridgejid, type: 'get'});
    elem.c('conference', {xmlns: 'http://jitsi.org/protocol/colibri', id: this.confid});
    var localSDP = new SDP(this.peerconnection.localDescription.sdp);
    localSDP.media.forEach(function (media, channel) {
        var name = SDPUtil.parse_mline(media.split('\r\n')[0]).media; 
        elem.c('content', {name: name});
        elem.c('channel', {initiator: 'true', expire:'15'});
        elem.up(); // end of channel
        elem.up(); // end of content
    });

    this.connection.sendIQ(elem,
        function (result) {
            var contents = $(result).find('>conference>content').get();
            for (var i = 0; i < contents.length; i++) {
                tmp = $(contents[i]).find('>channel').get();
                self.channels[index][i] = tmp[0];
            }
            self.initiate(peer, true);
        },
        function (error) {
            console.warn(error);
        }
    );
};

// update the channel description (payload-types + dtls fp) for a participant
ColibriFocus.prototype.updateChannel = function (remoteSDP, participant) {
    console.log('change allocation for', this.confid);
    var change = $iq({to: this.bridgejid, type: 'set'});
    change.c('conference', {xmlns: 'http://jitsi.org/protocol/colibri', id: this.confid});
    for (channel = 0; channel < this.channels[participant].length; channel++) {
        change.c('content', {name: channel === 0 ? 'audio' : 'video'});
        change.c('channel', {id: $(this.channels[participant][channel]).attr('id')});

        var rtpmap = SDPUtil.find_lines(remoteSDP.media[channel], 'a=rtpmap:');
        rtpmap.forEach(function (val) {
            // TODO: too much copy-paste
            var rtpmap = SDPUtil.parse_rtpmap(val);
            change.c('payload-type', rtpmap);
            // 
            // put any 'a=fmtp:' + mline.fmt[j] lines into <param name=foo value=bar/>
            /*
            if (SDPUtil.find_line(remoteSDP.media[channel], 'a=fmtp:' + rtpmap.id)) {
                tmp = SDPUtil.parse_fmtp(SDPUtil.find_line(remoteSDP.media[channel], 'a=fmtp:' + rtpmap.id));
                for (var k = 0; k < tmp.length; k++) {
                    change.c('parameter', tmp[k]).up();
                }
            }
            */
            change.up();
        });
        // now add transport
        remoteSDP.TransportToJingle(channel, change);

        change.up(); // end of channel
        change.up(); // end of content
    }
    this.connection.sendIQ(change,
        function (res) {
            console.log('got result');
        },
        function (err) {
            console.log('got error');
        }
    );
};

// tell everyone about a new participants a=ssrc lines (isadd is true)
// or a leaving participants a=ssrc lines
// FIXME: should not take an SDP, but rather the a=ssrc lines and probably a=mid
ColibriFocus.prototype.sendSSRCUpdate = function (sdp, jid, isadd) {
    var self = this;
    this.peers.forEach(function (peerjid) {
        if (peerjid == jid) return;
        console.log('tell', peerjid, 'about ' + (isadd ? 'new' : 'removed') + ' ssrcs from', jid);
        if (!self.remotessrc[peerjid]) {
            // FIXME: this should only send to participants that are stable, i.e. who have sent a session-accept
            // possibly, this.remoteSSRC[session.peerjid] does not exist yet
            console.warn('do we really want to bother', peerjid, 'with updates yet?');
        }
        var channel;
        var peersess = self.connection.jingle.jid2session[peerjid];
        var modify = $iq({to: peerjid, type: 'set'})
            .c('jingle', {
                xmlns: 'urn:xmpp:jingle:1',
                action: isadd ? 'addsource' : 'removesource',
                initiator: peersess.initiator,
                sid: peersess.sid
            }
        );
        // FIXME: only announce video ssrcs since we mix audio and dont need 
        //      the audio ssrcs therefore
        var modified = false;
        for (channel = 0; channel < sdp.media.length; channel++) {
            modified = true;
            tmp = SDPUtil.find_lines(sdp.media[channel], 'a=ssrc:');
            modify.c('content', {name: SDPUtil.parse_mid(SDPUtil.find_line(sdp.media[channel], 'a=mid:'))});
            modify.c('source', { xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
            // FIXME: not completly sure this operates on blocks and / or handles different ssrcs correctly
            tmp.forEach(function (line) {
                var idx = line.indexOf(' ');
                var linessrc = line.substr(0, idx).substr(7);
                modify.attrs({ssrc: linessrc});

                var kv = line.substr(idx + 1);
                modify.c('parameter');
                if (kv.indexOf(':') == -1) {
                    modify.attrs({ name: kv });
                } else {
                    modify.attrs({ name: kv.split(':', 2)[0] });
                    modify.attrs({ value: kv.split(':', 2)[1] });
                }
                modify.up();
            });
            modify.up(); // end of source
            modify.up(); // end of content
        }
        if (modified) {
            self.connection.sendIQ(modify,
                function (res) {
                    console.warn('got modify result');
                },
                function (err) {
                    console.warn('got modify error');
                }
            );
        } else {
            console.log('modification not necessary');
        }
    });
};

ColibriFocus.prototype.setRemoteDescription = function (session, elem, desctype) {
    var participant = this.peers.indexOf(session.peerjid);
    console.log('Colibri.setRemoteDescription from', session.peerjid, participant);
    var self = this;
    var remoteSDP = new SDP('');
    var tmp;
    var channel;
    remoteSDP.fromJingle(elem);

    // ACT 1: change allocation on bridge
    this.updateChannel(remoteSDP, participant);

    // ACT 2: tell anyone else about the new SSRCs
    this.sendSSRCUpdate(remoteSDP, session.peerjid, true);

    // ACT 3: note the SSRCs
    this.remotessrc[session.peerjid] = [];
    for (channel = 0; channel < this.channels[participant].length; channel++) {
        //if (channel == 0) continue; FIXME: does not work as intended
        if (SDPUtil.find_lines(remoteSDP.media[channel], 'a=ssrc:').length) {
            this.remotessrc[session.peerjid][channel] = SDPUtil.find_lines(remoteSDP.media[channel], 'a=ssrc:').join('\r\n') + '\r\n';
        }
    }

    // ACT 4: add new a=ssrc lines to local remotedescription
    for (channel = 0; channel < this.channels[participant].length; channel++) {
        //if (channel == 0) continue; FIXME: does not work as intended
        if (!this.addssrc[channel]) this.addssrc[channel] = '';
        if (SDPUtil.find_lines(remoteSDP.media[channel], 'a=ssrc:').length) {
            this.addssrc[channel] += SDPUtil.find_lines(remoteSDP.media[channel], 'a=ssrc:').join('\r\n') + '\r\n';
        }
    }
    this.modifySources();
};

// relay ice candidates to bridge using trickle
ColibriFocus.prototype.addIceCandidate = function (session, elem) {
    var self = this;
    var participant = this.peers.indexOf(session.peerjid);
    //console.log('change transport allocation for', this.confid, session.peerjid, participant);
    var change = $iq({to: this.bridgejid, type: 'set'});
    change.c('conference', {xmlns: 'http://jitsi.org/protocol/colibri', id: this.confid});
    $(elem).each(function () {
        var name = $(this).attr('name');
        var channel = name == 'audio' ? 0 : 1; // FIXME: search mlineindex in localdesc

        change.c('content', {name: name});
        change.c('channel', {id: $(self.channels[participant][channel]).attr('id')});
        $(this).find('>transport').each(function () {
            change.c('transport', {
                ufrag: $(this).attr('ufrag'),
                pwd: $(this).attr('pwd'),
                xmlns: $(this).attr('xmlns')
            });

            $(this).find('>candidate').each(function () {
                /* not yet
                if (this.getAttribute('protocol') == 'tcp' && this.getAttribute('port') == 0) {
                    // chrome generates TCP candidates with port 0
                    return;
                }
                */
                var line = SDPUtil.candidateFromJingle(this);
                change.c('candidate', SDPUtil.candidateToJingle(line)).up();
            });
            change.up(); // end of transport
        });
        change.up(); // end of channel
        change.up(); // end of content
    });
    // FIXME: need to check if there is at least one candidate when filtering TCP ones
    this.connection.sendIQ(change,
        function (res) {
            console.log('got result');
        },
        function (err) {
            console.warn('got error');
        }
    );
};

// send our own candidate to the bridge
ColibriFocus.prototype.sendIceCandidate = function (candidate) {
    //console.log('candidate', candidate);
    if (!candidate) {
        console.log('end of candidates');
        return;
    }
    this.sendIceCandidates([candidate]);
};

// sort and send multiple candidates
ColibriFocus.prototype.sendIceCandidates = function (candidates) {
    var self = this;
    var mycands = $iq({to: this.bridgejid, type: 'set'});
    mycands.c('conference', {xmlns: 'http://jitsi.org/protocol/colibri', id: this.confid});
    // FIXME: multi-candidate logic is taken from strophe.jingle, should be refactored there
    var localSDP = new SDP(this.peerconnection.localDescription.sdp);
    for (var mid = 0; mid < localSDP.media.length; mid++) {
        var cands = candidates.filter(function (el) { return el.sdpMLineIndex == mid; });
        if (cands.length > 0) {
            mycands.c('content', {name: cands[0].sdpMid });
            mycands.c('channel', {id: $(this.mychannel[cands[0].sdpMLineIndex]).attr('id')});
            mycands.c('transport', {xmlns: 'urn:xmpp:jingle:transports:ice-udp:1'});
            for (var i = 0; i < cands.length; i++) {
                mycands.c('candidate', SDPUtil.candidateToJingle(cands[i].candidate)).up();
            }
            mycands.up(); // transport
            mycands.up(); // channel
            mycands.up(); // content
        }
    }
    console.log('send cands', candidates);
    this.connection.sendIQ(mycands,
        function (res) {
            console.log('got result');
        },
        function (err) {
            console.warn('got error');
        }
    );
};

ColibriFocus.prototype.terminate = function (session, reason) {
    console.log('remote session terminated from', session.peerjid);
    var participant = this.peers.indexOf(session.peerjid);
    if (!this.remotessrc[session.peerjid] || participant == -1) {
        return;
    }
    var ssrcs = this.remotessrc[session.peerjid];
    for (var i = 0; i < ssrcs.length; i++) {
        if (!this.removessrc[i]) this.removessrc[i] = '';
        this.removessrc[i] += ssrcs[i];
    }
    // remove from this.peers
    this.peers.splice(participant, 1);
    // expire channel on bridge
    var change = $iq({to: this.bridgejid, type: 'set'});
    change.c('conference', {xmlns: 'http://jitsi.org/protocol/colibri', id: this.confid});
    for (var channel = 0; channel < this.channels[participant].length; channel++) {
        change.c('content', {name: channel === 0 ? 'audio' : 'video'});
        change.c('channel', {id: $(this.channels[participant][channel]).attr('id'), expire: '0'});
        change.up(); // end of channel
        change.up(); // end of content
    }
    this.connection.sendIQ(change,
        function (res) {
            console.log('got result');
        },
        function (err) {
            console.log('got error');
        }
    );
    // and remove from channels
    this.channels.splice(participant, 1);

    // tell everyone about the ssrcs to be removed
    var sdp = new SDP('');
    var localSDP = new SDP(this.peerconnection.localDescription.sdp);
    var contents = SDPUtil.find_lines(localSDP.raw, 'a=mid:').map(SDPUtil.parse_mid);
    for (var j = 0; j < ssrcs.length; j++) {
        sdp.media[j] = 'a=mid:' + contents[j] + '\r\n';
        sdp.media[j] += ssrcs[j];
        this.removessrc[j] += ssrcs[j];
    }
    this.sendSSRCUpdate(sdp, session.peerjid, false);

    delete this.remotessrc[session.peerjid];
    this.modifySources();
};

ColibriFocus.prototype.modifySources = function () {
    var self = this;
    if (!(this.addssrc.length || this.removessrc.length)) return;
    if (this.peerconnection.signalingState == 'closed') return;

    // FIXME: this is a big hack
    // https://code.google.com/p/webrtc/issues/detail?id=2688
    if (!(this.peerconnection.signalingState == 'stable' && this.peerconnection.iceConnectionState == 'connected')) {
        console.warn('modifySources not yet', this.peerconnection.signalingState, this.peerconnection.iceConnectionState);
        window.setTimeout(function () { self.modifySources(); }, 250);
        this.wait = true;
        return;
    }
    if (this.wait) {
        window.setTimeout(function () { self.modifySources(); }, 2500);
        this.wait = false;
        return;
    }
    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

    // add sources
    this.addssrc.forEach(function (lines, idx) {
        sdp.media[idx] += lines;
    });
    this.addssrc = [];

    // remove sources
    this.removessrc.forEach(function (lines, idx) {
        lines = lines.split('\r\n');
        lines.pop(); // remove empty last element;
        lines.forEach(function (line) {
            sdp.media[idx] = sdp.media[idx].replace(line + '\r\n', '');
        });
    });
    this.removessrc = [];

    sdp.raw = sdp.session + sdp.media.join('');
    this.peerconnection.setRemoteDescription(
        new RTCSessionDescription({type: 'offer', sdp: sdp.raw }),
        function () {
            console.log('setModifiedRemoteDescription ok');
            self.peerconnection.createAnswer(
                function (modifiedAnswer) {
                    console.log('modifiedAnswer created');
                    // FIXME: pushing down an answer while ice connection state 
                    // is still checking is bad...
                    //console.log(self.peerconnection.iceConnectionState);

                    // trying to work around another chrome bug
                    //modifiedAnswer.sdp = modifiedAnswer.sdp.replace(/a=setup:active/g, 'a=setup:actpass');
                    self.peerconnection.setLocalDescription(modifiedAnswer,
                        function () {
                            console.log('setModifiedLocalDescription ok');
                            $(document).trigger('setLocalDescription.jingle', [self.sid]);
                        },
                        function (error) {
                            console.log('setModifiedLocalDescription failed', error);
                        }
                    );
                },
                function (error) {
                    console.log('createModifiedAnswer failed', error);
                }
            );
        },
        function (error) {
            console.log('setModifiedRemoteDescription failed', error);
        }
    );
    /*
     * now that we have a passive focus, this way is bad again! :-)
    this.peerconnection.createOffer(
        function (modifiedOffer) {
            console.log('created (un)modified offer');
            self.peerconnection.setLocalDescription(modifiedOffer,
                function () {
                    console.log('setModifiedLocalDescription ok');
                    self.peerconnection.setRemoteDescription(
                        new RTCSessionDescription({type: 'answer', sdp: sdp.raw }),
                        function () {
                            console.log('setModifiedRemoteDescription ok');
                        },
                        function (error) {
                            console.log('setModifiedRemoteDescription failed');
                        }
                    );
                    $(document).trigger('setLocalDescription.jingle', [self.sid]);
                },
                function (error) {
                    console.log('setModifiedLocalDescription failed');
                }
            );
        },
        function (error) {
            console.log('creating (un)modified offerfailed');
        }
    );
    */
};

// A colibri session is similar to a jingle session, it just implements some things differently
// FIXME: inherit jinglesession, see https://github.com/legastero/Jingle-RTCPeerConnection/blob/master/index.js
function ColibriSession(me, sid, connection) {
    this.me = me;
    this.sid = sid;
    this.connection = connection;
    //this.peerconnection = null;
    //this.mychannel = null;
    //this.channels = null;
    this.peerjid = null;

    this.colibri = null;
}

// implementation of JingleSession interface
ColibriSession.prototype.initiate = function (peerjid, isInitiator) {
    this.peerjid = peerjid;
};

ColibriSession.prototype.sendOffer = function (offer) {
    console.log('ColibriSession.sendOffer');
};


ColibriSession.prototype.accept = function () {
    console.log('ColibriSession.accept');
};

ColibriSession.prototype.terminate = function (reason) {
    this.colibri.terminate(this, reason);
};

ColibriSession.prototype.active = function () {
    console.log('ColibriSession.active');
};

ColibriSession.prototype.setRemoteDescription = function (elem, desctype) {
    this.colibri.setRemoteDescription(this, elem, desctype);
};

ColibriSession.prototype.addIceCandidate = function (elem) {
    this.colibri.addIceCandidate(this, elem);
};

ColibriSession.prototype.sendAnswer = function (sdp, provisional) {
    console.log('ColibriSession.sendAnswer');
};

ColibriSession.prototype.sendTerminate = function (reason, text) {
    console.log('ColibriSession.sendTerminate');
};
