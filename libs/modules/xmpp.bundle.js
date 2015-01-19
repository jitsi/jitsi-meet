!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.xmpp=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* jshint -W117 */
var TraceablePeerConnection = require("./TraceablePeerConnection");
var SDPDiffer = require("./SDPDiffer");
var SDPUtil = require("./SDPUtil");
var SDP = require("./SDP");

// Jingle stuff
function JingleSession(me, sid, connection, service) {
    this.me = me;
    this.sid = sid;
    this.connection = connection;
    this.initiator = null;
    this.responder = null;
    this.isInitiator = null;
    this.peerjid = null;
    this.state = null;
    this.localSDP = null;
    this.remoteSDP = null;
    this.relayedStreams = [];
    this.startTime = null;
    this.stopTime = null;
    this.media_constraints = null;
    this.pc_constraints = null;
    this.ice_config = {};
    this.drip_container = [];
    this.service = service;

    this.usetrickle = true;
    this.usepranswer = false; // early transport warmup -- mind you, this might fail. depends on webrtc issue 1718
    this.usedrip = false; // dripping is sending trickle candidates not one-by-one

    this.hadstuncandidate = false;
    this.hadturncandidate = false;
    this.lasticecandidate = false;

    this.statsinterval = null;

    this.reason = null;

    this.addssrc = [];
    this.removessrc = [];
    this.pendingop = null;
    this.switchstreams = false;

    this.wait = true;
    this.localStreamsSSRC = null;

    /**
     * The indicator which determines whether the (local) video has been muted
     * in response to a user command in contrast to an automatic decision made
     * by the application logic.
     */
    this.videoMuteByUser = false;
}

JingleSession.prototype.initiate = function (peerjid, isInitiator) {
    var self = this;
    if (this.state !== null) {
        console.error('attempt to initiate on session ' + this.sid +
            'in state ' + this.state);
        return;
    }
    this.isInitiator = isInitiator;
    this.state = 'pending';
    this.initiator = isInitiator ? this.me : peerjid;
    this.responder = !isInitiator ? this.me : peerjid;
    this.peerjid = peerjid;
    this.hadstuncandidate = false;
    this.hadturncandidate = false;
    this.lasticecandidate = false;

    this.peerconnection
        = new TraceablePeerConnection(
            this.connection.jingle.ice_config,
            this.connection.jingle.pc_constraints );

    this.peerconnection.onicecandidate = function (event) {
        self.sendIceCandidate(event.candidate);
    };
    this.peerconnection.onaddstream = function (event) {
        console.log("REMOTE STREAM ADDED: " + event.stream + " - " + event.stream.id);
        self.remoteStreamAdded(event);
    };
    this.peerconnection.onremovestream = function (event) {
        // Remove the stream from remoteStreams
        // FIXME: remotestreamremoved.jingle not defined anywhere(unused)
        $(document).trigger('remotestreamremoved.jingle', [event, self.sid]);
    };
    this.peerconnection.onsignalingstatechange = function (event) {
        if (!(self && self.peerconnection)) return;
    };
    this.peerconnection.oniceconnectionstatechange = function (event) {
        if (!(self && self.peerconnection)) return;
        switch (self.peerconnection.iceConnectionState) {
            case 'connected':
                this.startTime = new Date();
                break;
            case 'disconnected':
                this.stopTime = new Date();
                break;
        }
        onIceConnectionStateChange(self.sid, self);
    };
    // add any local and relayed stream
    RTC.localStreams.forEach(function(stream) {
        self.peerconnection.addStream(stream.getOriginalStream());
    });
    this.relayedStreams.forEach(function(stream) {
        self.peerconnection.addStream(stream);
    });
};

function onIceConnectionStateChange(sid, session) {
    switch (session.peerconnection.iceConnectionState) {
        case 'checking':
            session.timeChecking = (new Date()).getTime();
            session.firstconnect = true;
            break;
        case 'completed': // on caller side
        case 'connected':
            if (session.firstconnect) {
                session.firstconnect = false;
                var metadata = {};
                metadata.setupTime
                    = (new Date()).getTime() - session.timeChecking;
                session.peerconnection.getStats(function (res) {
                    if(res && res.result) {
                        res.result().forEach(function (report) {
                            if (report.type == 'googCandidatePair' &&
                                report.stat('googActiveConnection') == 'true') {
                                metadata.localCandidateType
                                    = report.stat('googLocalCandidateType');
                                metadata.remoteCandidateType
                                    = report.stat('googRemoteCandidateType');

                                // log pair as well so we can get nice pie
                                // charts
                                metadata.candidatePair
                                    = report.stat('googLocalCandidateType') +
                                        ';' +
                                        report.stat('googRemoteCandidateType');

                                if (report.stat('googRemoteAddress').indexOf('[') === 0)
                                {
                                    metadata.ipv6 = true;
                                }
                            }
                        });
                    }
                });
            }
            break;
    }
}

JingleSession.prototype.accept = function () {
    var self = this;
    this.state = 'active';

    var pranswer = this.peerconnection.localDescription;
    if (!pranswer || pranswer.type != 'pranswer') {
        return;
    }
    console.log('going from pranswer to answer');
    if (this.usetrickle) {
        // remove candidates already sent from session-accept
        var lines = SDPUtil.find_lines(pranswer.sdp, 'a=candidate:');
        for (var i = 0; i < lines.length; i++) {
            pranswer.sdp = pranswer.sdp.replace(lines[i] + '\r\n', '');
        }
    }
    while (SDPUtil.find_line(pranswer.sdp, 'a=inactive')) {
        // FIXME: change any inactive to sendrecv or whatever they were originally
        pranswer.sdp = pranswer.sdp.replace('a=inactive', 'a=sendrecv');
    }
    pranswer = simulcast.reverseTransformLocalDescription(pranswer);
    var prsdp = new SDP(pranswer.sdp);
    var accept = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-accept',
            initiator: this.initiator,
            responder: this.responder,
            sid: this.sid });
    prsdp.toJingle(accept, this.initiator == this.me ? 'initiator' : 'responder', this.localStreamsSSRC);
    var sdp = this.peerconnection.localDescription.sdp;
    while (SDPUtil.find_line(sdp, 'a=inactive')) {
        // FIXME: change any inactive to sendrecv or whatever they were originally
        sdp = sdp.replace('a=inactive', 'a=sendrecv');
    }
    var self = this;
    this.peerconnection.setLocalDescription(new RTCSessionDescription({type: 'answer', sdp: sdp}),
        function () {
            //console.log('setLocalDescription success');
            self.setLocalDescription();

            self.connection.sendIQ(accept,
                function () {
                    var ack = {};
                    ack.source = 'answer';
                    $(document).trigger('ack.jingle', [self.sid, ack]);
                },
                function (stanza) {
                    var error = ($(stanza).find('error').length) ? {
                        code: $(stanza).find('error').attr('code'),
                        reason: $(stanza).find('error :first')[0].tagName
                    }:{};
                    error.source = 'answer';
                    JingleSession.onJingleError(self.sid, error);
                },
                10000);
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
};

JingleSession.prototype.terminate = function (reason) {
    this.state = 'ended';
    this.reason = reason;
    this.peerconnection.close();
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
};

JingleSession.prototype.active = function () {
    return this.state == 'active';
};

JingleSession.prototype.sendIceCandidate = function (candidate) {
    var self = this;
    if (candidate && !this.lasticecandidate) {
        var ice = SDPUtil.iceparams(this.localSDP.media[candidate.sdpMLineIndex], this.localSDP.session);
        var jcand = SDPUtil.candidateToJingle(candidate.candidate);
        if (!(ice && jcand)) {
            console.error('failed to get ice && jcand');
            return;
        }
        ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';

        if (jcand.type === 'srflx') {
            this.hadstuncandidate = true;
        } else if (jcand.type === 'relay') {
            this.hadturncandidate = true;
        }

        if (this.usetrickle) {
            if (this.usedrip) {
                if (this.drip_container.length === 0) {
                    // start 20ms callout
                    window.setTimeout(function () {
                        if (self.drip_container.length === 0) return;
                        self.sendIceCandidates(self.drip_container);
                        self.drip_container = [];
                    }, 20);

                }
                this.drip_container.push(candidate);
                return;
            } else {
                self.sendIceCandidate([candidate]);
            }
        }
    } else {
        //console.log('sendIceCandidate: last candidate.');
        if (!this.usetrickle) {
            //console.log('should send full offer now...');
            var init = $iq({to: this.peerjid,
                type: 'set'})
                .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                    action: this.peerconnection.localDescription.type == 'offer' ? 'session-initiate' : 'session-accept',
                    initiator: this.initiator,
                    sid: this.sid});
            this.localSDP = new SDP(this.peerconnection.localDescription.sdp);
            var self = this;
            var sendJingle = function (ssrc) {
                if(!ssrc)
                    ssrc = {};
                self.localSDP.toJingle(init, self.initiator == self.me ? 'initiator' : 'responder', ssrc);
                self.connection.sendIQ(init,
                    function () {
                        //console.log('session initiate ack');
                        var ack = {};
                        ack.source = 'offer';
                        $(document).trigger('ack.jingle', [self.sid, ack]);
                    },
                    function (stanza) {
                        self.state = 'error';
                        self.peerconnection.close();
                        var error = ($(stanza).find('error').length) ? {
                            code: $(stanza).find('error').attr('code'),
                            reason: $(stanza).find('error :first')[0].tagName,
                        }:{};
                        error.source = 'offer';
                        JingleSession.onJingleError(self.sid, error);
                    },
                    10000);
            }
            sendJingle();
        }
        this.lasticecandidate = true;
        console.log('Have we encountered any srflx candidates? ' + this.hadstuncandidate);
        console.log('Have we encountered any relay candidates? ' + this.hadturncandidate);

        if (!(this.hadstuncandidate || this.hadturncandidate) && this.peerconnection.signalingState != 'closed') {
            $(document).trigger('nostuncandidates.jingle', [this.sid]);
        }
    }
};

JingleSession.prototype.sendIceCandidates = function (candidates) {
    console.log('sendIceCandidates', candidates);
    var cand = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'transport-info',
            initiator: this.initiator,
            sid: this.sid});
    for (var mid = 0; mid < this.localSDP.media.length; mid++) {
        var cands = candidates.filter(function (el) { return el.sdpMLineIndex == mid; });
        var mline = SDPUtil.parse_mline(this.localSDP.media[mid].split('\r\n')[0]);
        if (cands.length > 0) {
            var ice = SDPUtil.iceparams(this.localSDP.media[mid], this.localSDP.session);
            ice.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
            cand.c('content', {creator: this.initiator == this.me ? 'initiator' : 'responder',
                name: (cands[0].sdpMid? cands[0].sdpMid : mline.media)
            }).c('transport', ice);
            for (var i = 0; i < cands.length; i++) {
                cand.c('candidate', SDPUtil.candidateToJingle(cands[i].candidate)).up();
            }
            // add fingerprint
            if (SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session)) {
                var tmp = SDPUtil.parse_fingerprint(SDPUtil.find_line(this.localSDP.media[mid], 'a=fingerprint:', this.localSDP.session));
                tmp.required = true;
                cand.c(
                    'fingerprint',
                    {xmlns: 'urn:xmpp:jingle:apps:dtls:0'})
                    .t(tmp.fingerprint);
                delete tmp.fingerprint;
                cand.attrs(tmp);
                cand.up();
            }
            cand.up(); // transport
            cand.up(); // content
        }
    }
    // might merge last-candidate notification into this, but it is called alot later. See webrtc issue #2340
    //console.log('was this the last candidate', this.lasticecandidate);
    this.connection.sendIQ(cand,
        function () {
            var ack = {};
            ack.source = 'transportinfo';
            $(document).trigger('ack.jingle', [this.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            error.source = 'transportinfo';
            JingleSession.onJingleError(this.sid, error);
        },
        10000);
};


JingleSession.prototype.sendOffer = function () {
    //console.log('sendOffer...');
    var self = this;
    this.peerconnection.createOffer(function (sdp) {
            self.createdOffer(sdp);
        },
        function (e) {
            console.error('createOffer failed', e);
        },
        this.media_constraints
    );
};

JingleSession.prototype.createdOffer = function (sdp) {
    //console.log('createdOffer', sdp);
    var self = this;
    this.localSDP = new SDP(sdp.sdp);
    //this.localSDP.mangle();
    var sendJingle = function () {
        var init = $iq({to: this.peerjid,
            type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                action: 'session-initiate',
                initiator: this.initiator,
                sid: this.sid});
        self.localSDP.toJingle(init, this.initiator == this.me ? 'initiator' : 'responder', this.localStreamsSSRC);
        self.connection.sendIQ(init,
            function () {
                var ack = {};
                ack.source = 'offer';
                $(document).trigger('ack.jingle', [self.sid, ack]);
            },
            function (stanza) {
                self.state = 'error';
                self.peerconnection.close();
                var error = ($(stanza).find('error').length) ? {
                    code: $(stanza).find('error').attr('code'),
                    reason: $(stanza).find('error :first')[0].tagName,
                }:{};
                error.source = 'offer';
                JingleSession.onJingleError(self.sid, error);
            },
            10000);
    }
    sdp.sdp = this.localSDP.raw;
    this.peerconnection.setLocalDescription(sdp,
        function () {
            if(self.usetrickle)
            {
                sendJingle();
            }
            self.setLocalDescription();
            //console.log('setLocalDescription success');
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
    var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
    for (var i = 0; i < cands.length; i++) {
        var cand = SDPUtil.parse_icecandidate(cands[i]);
        if (cand.type == 'srflx') {
            this.hadstuncandidate = true;
        } else if (cand.type == 'relay') {
            this.hadturncandidate = true;
        }
    }
};

JingleSession.prototype.setRemoteDescription = function (elem, desctype) {
    //console.log('setting remote description... ', desctype);
    this.remoteSDP = new SDP('');
    this.remoteSDP.fromJingle(elem);
    if (this.peerconnection.remoteDescription !== null) {
        console.log('setRemoteDescription when remote description is not null, should be pranswer', this.peerconnection.remoteDescription);
        if (this.peerconnection.remoteDescription.type == 'pranswer') {
            var pranswer = new SDP(this.peerconnection.remoteDescription.sdp);
            for (var i = 0; i < pranswer.media.length; i++) {
                // make sure we have ice ufrag and pwd
                if (!SDPUtil.find_line(this.remoteSDP.media[i], 'a=ice-ufrag:', this.remoteSDP.session)) {
                    if (SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session)) {
                        this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-ufrag:', pranswer.session) + '\r\n';
                    } else {
                        console.warn('no ice ufrag?');
                    }
                    if (SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session)) {
                        this.remoteSDP.media[i] += SDPUtil.find_line(pranswer.media[i], 'a=ice-pwd:', pranswer.session) + '\r\n';
                    } else {
                        console.warn('no ice pwd?');
                    }
                }
                // copy over candidates
                var lines = SDPUtil.find_lines(pranswer.media[i], 'a=candidate:');
                for (var j = 0; j < lines.length; j++) {
                    this.remoteSDP.media[i] += lines[j] + '\r\n';
                }
            }
            this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');
        }
    }
    var remotedesc = new RTCSessionDescription({type: desctype, sdp: this.remoteSDP.raw});

    this.peerconnection.setRemoteDescription(remotedesc,
        function () {
            //console.log('setRemoteDescription success');
        },
        function (e) {
            console.error('setRemoteDescription error', e);
            JingleSession.onJingleFatalError(self, e);
        }
    );
};

JingleSession.prototype.addIceCandidate = function (elem) {
    var self = this;
    if (this.peerconnection.signalingState == 'closed') {
        return;
    }
    if (!this.peerconnection.remoteDescription && this.peerconnection.signalingState == 'have-local-offer') {
        console.log('trickle ice candidate arriving before session accept...');
        // create a PRANSWER for setRemoteDescription
        if (!this.remoteSDP) {
            var cobbled = 'v=0\r\n' +
                'o=- ' + '1923518516' + ' 2 IN IP4 0.0.0.0\r\n' +// FIXME
                's=-\r\n' +
                't=0 0\r\n';
            // first, take some things from the local description
            for (var i = 0; i < this.localSDP.media.length; i++) {
                cobbled += SDPUtil.find_line(this.localSDP.media[i], 'm=') + '\r\n';
                cobbled += SDPUtil.find_lines(this.localSDP.media[i], 'a=rtpmap:').join('\r\n') + '\r\n';
                if (SDPUtil.find_line(this.localSDP.media[i], 'a=mid:')) {
                    cobbled += SDPUtil.find_line(this.localSDP.media[i], 'a=mid:') + '\r\n';
                }
                cobbled += 'a=inactive\r\n';
            }
            this.remoteSDP = new SDP(cobbled);
        }
        // then add things like ice and dtls from remote candidate
        elem.each(function () {
            for (var i = 0; i < self.remoteSDP.media.length; i++) {
                if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                    self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    if (!SDPUtil.find_line(self.remoteSDP.media[i], 'a=ice-ufrag:')) {
                        var tmp = $(this).find('transport');
                        self.remoteSDP.media[i] += 'a=ice-ufrag:' + tmp.attr('ufrag') + '\r\n';
                        self.remoteSDP.media[i] += 'a=ice-pwd:' + tmp.attr('pwd') + '\r\n';
                        tmp = $(this).find('transport>fingerprint');
                        if (tmp.length) {
                            self.remoteSDP.media[i] += 'a=fingerprint:' + tmp.attr('hash') + ' ' + tmp.text() + '\r\n';
                        } else {
                            console.log('no dtls fingerprint (webrtc issue #1718?)');
                            self.remoteSDP.media[i] += 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD\r\n';
                        }
                        break;
                    }
                }
            }
        });
        this.remoteSDP.raw = this.remoteSDP.session + this.remoteSDP.media.join('');

        // we need a complete SDP with ice-ufrag/ice-pwd in all parts
        // this makes the assumption that the PRANSWER is constructed such that the ice-ufrag is in all mediaparts
        // but it could be in the session part as well. since the code above constructs this sdp this can't happen however
        var iscomplete = this.remoteSDP.media.filter(function (mediapart) {
            return SDPUtil.find_line(mediapart, 'a=ice-ufrag:');
        }).length == this.remoteSDP.media.length;

        if (iscomplete) {
            console.log('setting pranswer');
            try {
                this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'pranswer', sdp: this.remoteSDP.raw }),
                    function() {
                    },
                    function(e) {
                        console.log('setRemoteDescription pranswer failed', e.toString());
                    });
            } catch (e) {
                console.error('setting pranswer failed', e);
            }
        } else {
            //console.log('not yet setting pranswer');
        }
    }
    // operate on each content element
    elem.each(function () {
        // would love to deactivate this, but firefox still requires it
        var idx = -1;
        var i;
        for (i = 0; i < self.remoteSDP.media.length; i++) {
            if (SDPUtil.find_line(self.remoteSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                self.remoteSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                idx = i;
                break;
            }
        }
        if (idx == -1) { // fall back to localdescription
            for (i = 0; i < self.localSDP.media.length; i++) {
                if (SDPUtil.find_line(self.localSDP.media[i], 'a=mid:' + $(this).attr('name')) ||
                    self.localSDP.media[i].indexOf('m=' + $(this).attr('name')) === 0) {
                    idx = i;
                    break;
                }
            }
        }
        var name = $(this).attr('name');
        // TODO: check ice-pwd and ice-ufrag?
        $(this).find('transport>candidate').each(function () {
            var line, candidate;
            line = SDPUtil.candidateFromJingle(this);
            candidate = new RTCIceCandidate({sdpMLineIndex: idx,
                sdpMid: name,
                candidate: line});
            try {
                self.peerconnection.addIceCandidate(candidate);
            } catch (e) {
                console.error('addIceCandidate failed', e.toString(), line);
            }
        });
    });
};

JingleSession.prototype.sendAnswer = function (provisional) {
    //console.log('createAnswer', provisional);
    var self = this;
    this.peerconnection.createAnswer(
        function (sdp) {
            self.createdAnswer(sdp, provisional);
        },
        function (e) {
            console.error('createAnswer failed', e);
        },
        this.media_constraints
    );
};

JingleSession.prototype.createdAnswer = function (sdp, provisional) {
    //console.log('createAnswer callback');
    var self = this;
    this.localSDP = new SDP(sdp.sdp);
    //this.localSDP.mangle();
    this.usepranswer = provisional === true;
    if (this.usetrickle) {
        if (this.usepranswer) {
            sdp.type = 'pranswer';
            for (var i = 0; i < this.localSDP.media.length; i++) {
                this.localSDP.media[i] = this.localSDP.media[i].replace('a=sendrecv\r\n', 'a=inactive\r\n');
            }
            this.localSDP.raw = this.localSDP.session + '\r\n' + this.localSDP.media.join('');
        }
    }
    var self = this;
    var sendJingle = function (ssrcs) {

                var accept = $iq({to: self.peerjid,
                    type: 'set'})
                    .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                        action: 'session-accept',
                        initiator: self.initiator,
                        responder: self.responder,
                        sid: self.sid });
                var publicLocalDesc = simulcast.reverseTransformLocalDescription(sdp);
                var publicLocalSDP = new SDP(publicLocalDesc.sdp);
                publicLocalSDP.toJingle(accept, self.initiator == self.me ? 'initiator' : 'responder', ssrcs);
                self.connection.sendIQ(accept,
                    function () {
                        var ack = {};
                        ack.source = 'answer';
                        $(document).trigger('ack.jingle', [self.sid, ack]);
                    },
                    function (stanza) {
                        var error = ($(stanza).find('error').length) ? {
                            code: $(stanza).find('error').attr('code'),
                            reason: $(stanza).find('error :first')[0].tagName,
                        }:{};
                        error.source = 'answer';
                        JingleSession.onJingleError(self.sid, error);
                    },
                    10000);
    }
    sdp.sdp = this.localSDP.raw;
    this.peerconnection.setLocalDescription(sdp,
        function () {

            //console.log('setLocalDescription success');
            if (self.usetrickle && !self.usepranswer) {
                sendJingle();
            }
            self.setLocalDescription();
        },
        function (e) {
            console.error('setLocalDescription failed', e);
        }
    );
    var cands = SDPUtil.find_lines(this.localSDP.raw, 'a=candidate:');
    for (var j = 0; j < cands.length; j++) {
        var cand = SDPUtil.parse_icecandidate(cands[j]);
        if (cand.type == 'srflx') {
            this.hadstuncandidate = true;
        } else if (cand.type == 'relay') {
            this.hadturncandidate = true;
        }
    }
};

JingleSession.prototype.sendTerminate = function (reason, text) {
    var self = this,
        term = $iq({to: this.peerjid,
            type: 'set'})
            .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
                action: 'session-terminate',
                initiator: this.initiator,
                sid: this.sid})
            .c('reason')
            .c(reason || 'success');

    if (text) {
        term.up().c('text').t(text);
    }

    this.connection.sendIQ(term,
        function () {
            self.peerconnection.close();
            self.peerconnection = null;
            self.terminate();
            var ack = {};
            ack.source = 'terminate';
            $(document).trigger('ack.jingle', [self.sid, ack]);
        },
        function (stanza) {
            var error = ($(stanza).find('error').length) ? {
                code: $(stanza).find('error').attr('code'),
                reason: $(stanza).find('error :first')[0].tagName,
            }:{};
            $(document).trigger('ack.jingle', [self.sid, error]);
        },
        10000);
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
};

JingleSession.prototype.addSource = function (elem, fromJid) {

    var self = this;
    // FIXME: dirty waiting
    if (!this.peerconnection.localDescription)
    {
        console.warn("addSource - localDescription not ready yet")
        setTimeout(function()
            {
                self.addSource(elem, fromJid);
            },
            200
        );
        return;
    }

    console.log('addssrc', new Date().getTime());
    console.log('ice', this.peerconnection.iceConnectionState);
    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);
    var mySdp = new SDP(this.peerconnection.localDescription.sdp);

    $(elem).each(function (idx, content) {
        var name = $(content).attr('name');
        var lines = '';
        tmp = $(content).find('ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
            var semantics = this.getAttribute('semantics');
            var ssrcs = $(this).find('>source').map(function () {
                return this.getAttribute('ssrc');
            }).get();

            if (ssrcs.length != 0) {
                lines += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
            }
        });
        tmp = $(content).find('source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]'); // can handle both >source and >description>source
        tmp.each(function () {
            var ssrc = $(this).attr('ssrc');
            if(mySdp.containsSSRC(ssrc)){
                /**
                 * This happens when multiple participants change their streams at the same time and
                 * ColibriFocus.modifySources have to wait for stable state. In the meantime multiple
                 * addssrc are scheduled for update IQ. See
                 */
                console.warn("Got add stream request for my own ssrc: "+ssrc);
                return;
            }
            $(this).find('>parameter').each(function () {
                lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                if ($(this).attr('value') && $(this).attr('value').length)
                    lines += ':' + $(this).attr('value');
                lines += '\r\n';
            });
        });
        sdp.media.forEach(function(media, idx) {
            if (!SDPUtil.find_line(media, 'a=mid:' + name))
                return;
            sdp.media[idx] += lines;
            if (!self.addssrc[idx]) self.addssrc[idx] = '';
            self.addssrc[idx] += lines;
        });
        sdp.raw = sdp.session + sdp.media.join('');
    });
    this.modifySources();
};

JingleSession.prototype.removeSource = function (elem, fromJid) {

    var self = this;
    // FIXME: dirty waiting
    if (!this.peerconnection.localDescription)
    {
        console.warn("removeSource - localDescription not ready yet")
        setTimeout(function()
            {
                self.removeSource(elem, fromJid);
            },
            200
        );
        return;
    }

    console.log('removessrc', new Date().getTime());
    console.log('ice', this.peerconnection.iceConnectionState);
    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);
    var mySdp = new SDP(this.peerconnection.localDescription.sdp);

    $(elem).each(function (idx, content) {
        var name = $(content).attr('name');
        var lines = '';
        tmp = $(content).find('ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
            var semantics = this.getAttribute('semantics');
            var ssrcs = $(this).find('>source').map(function () {
                return this.getAttribute('ssrc');
            }).get();

            if (ssrcs.length != 0) {
                lines += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
            }
        });
        tmp = $(content).find('source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]'); // can handle both >source and >description>source
        tmp.each(function () {
            var ssrc = $(this).attr('ssrc');
            // This should never happen, but can be useful for bug detection
            if(mySdp.containsSSRC(ssrc)){
                console.error("Got remove stream request for my own ssrc: "+ssrc);
                return;
            }
            $(this).find('>parameter').each(function () {
                lines += 'a=ssrc:' + ssrc + ' ' + $(this).attr('name');
                if ($(this).attr('value') && $(this).attr('value').length)
                    lines += ':' + $(this).attr('value');
                lines += '\r\n';
            });
        });
        sdp.media.forEach(function(media, idx) {
            if (!SDPUtil.find_line(media, 'a=mid:' + name))
                return;
            sdp.media[idx] += lines;
            if (!self.removessrc[idx]) self.removessrc[idx] = '';
            self.removessrc[idx] += lines;
        });
        sdp.raw = sdp.session + sdp.media.join('');
    });
    this.modifySources();
};

JingleSession.prototype.modifySources = function (successCallback) {
    var self = this;
    if (this.peerconnection.signalingState == 'closed') return;
    if (!(this.addssrc.length || this.removessrc.length || this.pendingop !== null || this.switchstreams)){
        // There is nothing to do since scheduled job might have been executed by another succeeding call
        this.setLocalDescription();
        if(successCallback){
            successCallback();
        }
        return;
    }

    // FIXME: this is a big hack
    // https://code.google.com/p/webrtc/issues/detail?id=2688
    // ^ has been fixed.
    if (!(this.peerconnection.signalingState == 'stable' && this.peerconnection.iceConnectionState == 'connected')) {
        console.warn('modifySources not yet', this.peerconnection.signalingState, this.peerconnection.iceConnectionState);
        this.wait = true;
        window.setTimeout(function() { self.modifySources(successCallback); }, 250);
        return;
    }
    if (this.wait) {
        window.setTimeout(function() { self.modifySources(successCallback); }, 2500);
        this.wait = false;
        return;
    }

    // Reset switch streams flag
    this.switchstreams = false;

    var sdp = new SDP(this.peerconnection.remoteDescription.sdp);

    // add sources
    this.addssrc.forEach(function(lines, idx) {
        sdp.media[idx] += lines;
    });
    this.addssrc = [];

    // remove sources
    this.removessrc.forEach(function(lines, idx) {
        lines = lines.split('\r\n');
        lines.pop(); // remove empty last element;
        lines.forEach(function(line) {
            sdp.media[idx] = sdp.media[idx].replace(line + '\r\n', '');
        });
    });
    this.removessrc = [];

    // FIXME:
    // this was a hack for the situation when only one peer exists
    // in the conference.
    // check if still required and remove
    if (sdp.media[0])
        sdp.media[0] = sdp.media[0].replace('a=recvonly', 'a=sendrecv');
    if (sdp.media[1])
        sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');

    sdp.raw = sdp.session + sdp.media.join('');
    this.peerconnection.setRemoteDescription(new RTCSessionDescription({type: 'offer', sdp: sdp.raw}),
        function() {

            if(self.signalingState == 'closed') {
                console.error("createAnswer attempt on closed state");
                return;
            }

            self.peerconnection.createAnswer(
                function(modifiedAnswer) {
                    // change video direction, see https://github.com/jitsi/jitmeet/issues/41
                    if (self.pendingop !== null) {
                        var sdp = new SDP(modifiedAnswer.sdp);
                        if (sdp.media.length > 1) {
                            switch(self.pendingop) {
                                case 'mute':
                                    sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                                    break;
                                case 'unmute':
                                    sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');
                                    break;
                            }
                            sdp.raw = sdp.session + sdp.media.join('');
                            modifiedAnswer.sdp = sdp.raw;
                        }
                        self.pendingop = null;
                    }

                    // FIXME: pushing down an answer while ice connection state
                    // is still checking is bad...
                    //console.log(self.peerconnection.iceConnectionState);

                    // trying to work around another chrome bug
                    //modifiedAnswer.sdp = modifiedAnswer.sdp.replace(/a=setup:active/g, 'a=setup:actpass');
                    self.peerconnection.setLocalDescription(modifiedAnswer,
                        function() {
                            //console.log('modified setLocalDescription ok');
                            self.setLocalDescription();
                            if(successCallback){
                                successCallback();
                            }
                        },
                        function(error) {
                            console.error('modified setLocalDescription failed', error);
                        }
                    );
                },
                function(error) {
                    console.error('modified answer failed', error);
                }
            );
        },
        function(error) {
            console.error('modify failed', error);
        }
    );
};

/**
 * Switches video streams.
 * @param new_stream new stream that will be used as video of this session.
 * @param oldStream old video stream of this session.
 * @param success_callback callback executed after successful stream switch.
 */
JingleSession.prototype.switchStreams = function (new_stream, oldStream, success_callback) {

    var self = this;

    // Remember SDP to figure out added/removed SSRCs
    var oldSdp = null;
    if(self.peerconnection) {
        if(self.peerconnection.localDescription) {
            oldSdp = new SDP(self.peerconnection.localDescription.sdp);
        }
        self.peerconnection.removeStream(oldStream, true);
        self.peerconnection.addStream(new_stream);
    }

    RTC.switchVideoStreams(new_stream, oldStream);

    // Conference is not active
    if(!oldSdp || !self.peerconnection) {
        success_callback();
        return;
    }

    self.switchstreams = true;
    self.modifySources(function() {
        console.log('modify sources done');

        success_callback();

        var newSdp = new SDP(self.peerconnection.localDescription.sdp);
        console.log("SDPs", oldSdp, newSdp);
        self.notifyMySSRCUpdate(oldSdp, newSdp);
    });
};

/**
 * Figures out added/removed ssrcs and send update IQs.
 * @param old_sdp SDP object for old description.
 * @param new_sdp SDP object for new description.
 */
JingleSession.prototype.notifyMySSRCUpdate = function (old_sdp, new_sdp) {

    if (!(this.peerconnection.signalingState == 'stable' &&
        this.peerconnection.iceConnectionState == 'connected')){
        console.log("Too early to send updates");
        return;
    }

    // send source-remove IQ.
    sdpDiffer = new SDPDiffer(new_sdp, old_sdp);
    var remove = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {
            xmlns: 'urn:xmpp:jingle:1',
            action: 'source-remove',
            initiator: this.initiator,
            sid: this.sid
        }
    );
    var removed = sdpDiffer.toJingle(remove);
    if (removed) {
        this.connection.sendIQ(remove,
            function (res) {
                console.info('got remove result', res);
            },
            function (err) {
                console.error('got remove error', err);
            }
        );
    } else {
        console.log('removal not necessary');
    }

    // send source-add IQ.
    var sdpDiffer = new SDPDiffer(old_sdp, new_sdp);
    var add = $iq({to: this.peerjid, type: 'set'})
        .c('jingle', {
            xmlns: 'urn:xmpp:jingle:1',
            action: 'source-add',
            initiator: this.initiator,
            sid: this.sid
        }
    );
    var added = sdpDiffer.toJingle(add);
    if (added) {
        this.connection.sendIQ(add,
            function (res) {
                console.info('got add result', res);
            },
            function (err) {
                console.error('got add error', err);
            }
        );
    } else {
        console.log('addition not necessary');
    }
};

/**
 * Determines whether the (local) video is mute i.e. all video tracks are
 * disabled.
 *
 * @return <tt>true</tt> if the (local) video is mute i.e. all video tracks are
 * disabled; otherwise, <tt>false</tt>
 */
JingleSession.prototype.isVideoMute = function () {
    var tracks = RTC.localVideo.getVideoTracks();
    var mute = true;

    for (var i = 0; i < tracks.length; ++i) {
        if (tracks[i].enabled) {
            mute = false;
            break;
        }
    }
    return mute;
};

/**
 * Mutes/unmutes the (local) video i.e. enables/disables all video tracks.
 *
 * @param mute <tt>true</tt> to mute the (local) video i.e. to disable all video
 * tracks; otherwise, <tt>false</tt>
 * @param callback a function to be invoked with <tt>mute</tt> after all video
 * tracks have been enabled/disabled. The function may, optionally, return
 * another function which is to be invoked after the whole mute/unmute operation
 * has completed successfully.
 * @param options an object which specifies optional arguments such as the
 * <tt>boolean</tt> key <tt>byUser</tt> with default value <tt>true</tt> which
 * specifies whether the method was initiated in response to a user command (in
 * contrast to an automatic decision made by the application logic)
 */
JingleSession.prototype.setVideoMute = function (mute, callback, options) {
    var byUser;

    if (options) {
        byUser = options.byUser;
        if (typeof byUser === 'undefined') {
            byUser = true;
        }
    } else {
        byUser = true;
    }
    // The user's command to mute the (local) video takes precedence over any
    // automatic decision made by the application logic.
    if (byUser) {
        this.videoMuteByUser = mute;
    } else if (this.videoMuteByUser) {
        return;
    }

    var self = this;
    var localCallback = function (mute) {
        self.connection.emuc.addVideoInfoToPresence(mute);
        self.connection.emuc.sendPresence();
        return callback(mute)
    };

    if (mute == RTC.localVideo.isMuted())
    {
        // Even if no change occurs, the specified callback is to be executed.
        // The specified callback may, optionally, return a successCallback
        // which is to be executed as well.
        var successCallback = localCallback(mute);

        if (successCallback) {
            successCallback();
        }
    } else {
        RTC.localVideo.setMute(!mute);

        this.hardMuteVideo(mute);

        this.modifySources(localCallback(mute));
    }
};

// SDP-based mute by going recvonly/sendrecv
// FIXME: should probably black out the screen as well
JingleSession.prototype.toggleVideoMute = function (callback) {
    this.service.setVideoMute(RTC.localVideo.isMuted(), callback);
};

JingleSession.prototype.hardMuteVideo = function (muted) {
    this.pendingop = muted ? 'mute' : 'unmute';
};

JingleSession.prototype.sendMute = function (muted, content) {
    var info = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-info',
            initiator: this.initiator,
            sid: this.sid });
    info.c(muted ? 'mute' : 'unmute', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
    info.attrs({'creator': this.me == this.initiator ? 'creator' : 'responder'});
    if (content) {
        info.attrs({'name': content});
    }
    this.connection.send(info);
};

JingleSession.prototype.sendRinging = function () {
    var info = $iq({to: this.peerjid,
        type: 'set'})
        .c('jingle', {xmlns: 'urn:xmpp:jingle:1',
            action: 'session-info',
            initiator: this.initiator,
            sid: this.sid });
    info.c('ringing', {xmlns: 'urn:xmpp:jingle:apps:rtp:info:1'});
    this.connection.send(info);
};

JingleSession.prototype.getStats = function (interval) {
    var self = this;
    var recv = {audio: 0, video: 0};
    var lost = {audio: 0, video: 0};
    var lastrecv = {audio: 0, video: 0};
    var lastlost = {audio: 0, video: 0};
    var loss = {audio: 0, video: 0};
    var delta = {audio: 0, video: 0};
    this.statsinterval = window.setInterval(function () {
        if (self && self.peerconnection && self.peerconnection.getStats) {
            self.peerconnection.getStats(function (stats) {
                var results = stats.result();
                // TODO: there are so much statistics you can get from this..
                for (var i = 0; i < results.length; ++i) {
                    if (results[i].type == 'ssrc') {
                        var packetsrecv = results[i].stat('packetsReceived');
                        var packetslost = results[i].stat('packetsLost');
                        if (packetsrecv && packetslost) {
                            packetsrecv = parseInt(packetsrecv, 10);
                            packetslost = parseInt(packetslost, 10);

                            if (results[i].stat('googFrameRateReceived')) {
                                lastlost.video = lost.video;
                                lastrecv.video = recv.video;
                                recv.video = packetsrecv;
                                lost.video = packetslost;
                            } else {
                                lastlost.audio = lost.audio;
                                lastrecv.audio = recv.audio;
                                recv.audio = packetsrecv;
                                lost.audio = packetslost;
                            }
                        }
                    }
                }
                delta.audio = recv.audio - lastrecv.audio;
                delta.video = recv.video - lastrecv.video;
                loss.audio = (delta.audio > 0) ? Math.ceil(100 * (lost.audio - lastlost.audio) / delta.audio) : 0;
                loss.video = (delta.video > 0) ? Math.ceil(100 * (lost.video - lastlost.video) / delta.video) : 0;
                $(document).trigger('packetloss.jingle', [self.sid, loss]);
            });
        }
    }, interval || 3000);
    return this.statsinterval;
};

JingleSession.onJingleError = function (session, error)
{
    console.error("Jingle error", error);
}

JingleSession.onJingleFatalError = function (session, error)
{
    this.service.sessionTerminated = true;
    connection.emuc.doLeave();
    UI.messageHandler.showError(  "Sorry",
        "Internal application error[setRemoteDescription]");
}

JingleSession.prototype.setLocalDescription = function () {
    // put our ssrcs into presence so other clients can identify our stream
    var newssrcs = [];
    var media = simulcast.parseMedia(this.peerconnection.localDescription);
    media.forEach(function (media) {

        if(Object.keys(media.sources).length > 0) {
            // TODO(gp) maybe exclude FID streams?
            Object.keys(media.sources).forEach(function (ssrc) {
                newssrcs.push({
                    'ssrc': ssrc,
                    'type': media.type,
                    'direction': media.direction
                });
            });
        }
        else if(this.localStreamsSSRC && this.localStreamsSSRC[media.type])
        {
            newssrcs.push({
                'ssrc': this.localStreamsSSRC[media.type],
                'type': media.type,
                'direction': media.direction
            });
        }

    });

    console.log('new ssrcs', newssrcs);

    // Have to clear presence map to get rid of removed streams
    this.connection.emuc.clearPresenceMedia();

    if (newssrcs.length > 0) {
        for (var i = 1; i <= newssrcs.length; i ++) {
            // Change video type to screen
            if (newssrcs[i-1].type === 'video' && desktopsharing.isUsingScreenStream()) {
                newssrcs[i-1].type = 'screen';
            }
            this.connection.emuc.addMediaToPresence(i,
                newssrcs[i-1].type, newssrcs[i-1].ssrc, newssrcs[i-1].direction);
        }

        this.connection.emuc.sendPresence();
    }
}

// an attempt to work around https://github.com/jitsi/jitmeet/issues/32
function sendKeyframe(pc) {
    console.log('sendkeyframe', pc.iceConnectionState);
    if (pc.iceConnectionState !== 'connected') return; // safe...
    pc.setRemoteDescription(
        pc.remoteDescription,
        function () {
            pc.createAnswer(
                function (modifiedAnswer) {
                    pc.setLocalDescription(
                        modifiedAnswer,
                        function () {
                            // noop
                        },
                        function (error) {
                            console.log('triggerKeyframe setLocalDescription failed', error);
                            UI.messageHandler.showError();
                        }
                    );
                },
                function (error) {
                    console.log('triggerKeyframe createAnswer failed', error);
                    UI.messageHandler.showError();
                }
            );
        },
        function (error) {
            console.log('triggerKeyframe setRemoteDescription failed', error);
            UI.messageHandler.showError();
        }
    );
}


JingleSession.prototype.remoteStreamAdded = function (data) {
    var self = this;
    var thessrc;

    // look up an associated JID for a stream id
    if (data.stream.id && data.stream.id.indexOf('mixedmslabel') === -1) {
        // look only at a=ssrc: and _not_ at a=ssrc-group: lines

        var ssrclines
            = SDPUtil.find_lines(this.peerconnection.remoteDescription.sdp, 'a=ssrc:');
        ssrclines = ssrclines.filter(function (line) {
            // NOTE(gp) previously we filtered on the mslabel, but that property
            // is not always present.
            // return line.indexOf('mslabel:' + data.stream.label) !== -1;

            return ((line.indexOf('msid:' + data.stream.id) !== -1));
        });
        if (ssrclines.length) {
            thessrc = ssrclines[0].substring(7).split(' ')[0];

            // We signal our streams (through Jingle to the focus) before we set
            // our presence (through which peers associate remote streams to
            // jids). So, it might arrive that a remote stream is added but
            // ssrc2jid is not yet updated and thus data.peerjid cannot be
            // successfully set. Here we wait for up to a second for the
            // presence to arrive.

            if (!ssrc2jid[thessrc]) {
                // TODO(gp) limit wait duration to 1 sec.
                setTimeout(function(d) {
                    return function() {
                        self.remoteStreamAdded(d);
                    }
                }(data), 250);
                return;
            }

            // ok to overwrite the one from focus? might save work in colibri.js
            console.log('associated jid', ssrc2jid[thessrc], data.peerjid);
            if (ssrc2jid[thessrc]) {
                data.peerjid = ssrc2jid[thessrc];
            }
        }
    }

    //TODO: this code should be removed when firefox implement multistream support
    if(RTC.getBrowserType() == RTCBrowserType.RTC_BROWSER_FIREFOX)
    {
        if((notReceivedSSRCs.length == 0) ||
            !ssrc2jid[notReceivedSSRCs[notReceivedSSRCs.length - 1]])
        {
            // TODO(gp) limit wait duration to 1 sec.
            setTimeout(function(d) {
                return function() {
                    self.remoteStreamAdded(d);
                }
            }(data), 250);
            return;
        }

        thessrc = notReceivedSSRCs.pop();
        if (ssrc2jid[thessrc]) {
            data.peerjid = ssrc2jid[thessrc];
        }
    }

    RTC.createRemoteStream(data, this.sid, thessrc);

    var isVideo = data.stream.getVideoTracks().length > 0;
    // an attempt to work around https://github.com/jitsi/jitmeet/issues/32
    if (isVideo &&
        data.peerjid && this.peerjid === data.peerjid &&
        data.stream.getVideoTracks().length === 0 &&
        RTC.localVideo.getTracks().length > 0) {
        window.setTimeout(function () {
            sendKeyframe(self.peerconnection);
        }, 3000);
    }
}

module.exports = JingleSession;
},{"./SDP":2,"./SDPDiffer":3,"./SDPUtil":4,"./TraceablePeerConnection":5}],2:[function(require,module,exports){
/* jshint -W117 */
var SDPUtil = require("./SDPUtil");

// SDP STUFF
function SDP(sdp) {
    this.media = sdp.split('\r\nm=');
    for (var i = 1; i < this.media.length; i++) {
        this.media[i] = 'm=' + this.media[i];
        if (i != this.media.length - 1) {
            this.media[i] += '\r\n';
        }
    }
    this.session = this.media.shift() + '\r\n';
    this.raw = this.session + this.media.join('');
}
/**
 * Returns map of MediaChannel mapped per channel idx.
 */
SDP.prototype.getMediaSsrcMap = function() {
    var self = this;
    var media_ssrcs = {};
    var tmp;
    for (var mediaindex = 0; mediaindex < self.media.length; mediaindex++) {
        tmp = SDPUtil.find_lines(self.media[mediaindex], 'a=ssrc:');
        var mid = SDPUtil.parse_mid(SDPUtil.find_line(self.media[mediaindex], 'a=mid:'));
        var media = {
            mediaindex: mediaindex,
            mid: mid,
            ssrcs: {},
            ssrcGroups: []
        };
        media_ssrcs[mediaindex] = media;
        tmp.forEach(function (line) {
            var linessrc = line.substring(7).split(' ')[0];
            // allocate new ChannelSsrc
            if(!media.ssrcs[linessrc]) {
                media.ssrcs[linessrc] = {
                    ssrc: linessrc,
                    lines: []
                };
            }
            media.ssrcs[linessrc].lines.push(line);
        });
        tmp = SDPUtil.find_lines(self.media[mediaindex], 'a=ssrc-group:');
        tmp.forEach(function(line){
            var semantics = line.substr(0, idx).substr(13);
            var ssrcs = line.substr(14 + semantics.length).split(' ');
            if (ssrcs.length != 0) {
                media.ssrcGroups.push({
                    semantics: semantics,
                    ssrcs: ssrcs
                });
            }
        });
    }
    return media_ssrcs;
};
/**
 * Returns <tt>true</tt> if this SDP contains given SSRC.
 * @param ssrc the ssrc to check.
 * @returns {boolean} <tt>true</tt> if this SDP contains given SSRC.
 */
SDP.prototype.containsSSRC = function(ssrc) {
    var medias = this.getMediaSsrcMap();
    var contains = false;
    Object.keys(medias).forEach(function(mediaindex){
        var media = medias[mediaindex];
        //console.log("Check", channel, ssrc);
        if(Object.keys(media.ssrcs).indexOf(ssrc) != -1){
            contains = true;
        }
    });
    return contains;
};


// remove iSAC and CN from SDP
SDP.prototype.mangle = function () {
    var i, j, mline, lines, rtpmap, newdesc;
    for (i = 0; i < this.media.length; i++) {
        lines = this.media[i].split('\r\n');
        lines.pop(); // remove empty last element
        mline = SDPUtil.parse_mline(lines.shift());
        if (mline.media != 'audio')
            continue;
        newdesc = '';
        mline.fmt.length = 0;
        for (j = 0; j < lines.length; j++) {
            if (lines[j].substr(0, 9) == 'a=rtpmap:') {
                rtpmap = SDPUtil.parse_rtpmap(lines[j]);
                if (rtpmap.name == 'CN' || rtpmap.name == 'ISAC')
                    continue;
                mline.fmt.push(rtpmap.id);
                newdesc += lines[j] + '\r\n';
            } else {
                newdesc += lines[j] + '\r\n';
            }
        }
        this.media[i] = SDPUtil.build_mline(mline) + '\r\n';
        this.media[i] += newdesc;
    }
    this.raw = this.session + this.media.join('');
};

// remove lines matching prefix from session section
SDP.prototype.removeSessionLines = function(prefix) {
    var self = this;
    var lines = SDPUtil.find_lines(this.session, prefix);
    lines.forEach(function(line) {
        self.session = self.session.replace(line + '\r\n', '');
    });
    this.raw = this.session + this.media.join('');
    return lines;
}
// remove lines matching prefix from a media section specified by mediaindex
// TODO: non-numeric mediaindex could match mid
SDP.prototype.removeMediaLines = function(mediaindex, prefix) {
    var self = this;
    var lines = SDPUtil.find_lines(this.media[mediaindex], prefix);
    lines.forEach(function(line) {
        self.media[mediaindex] = self.media[mediaindex].replace(line + '\r\n', '');
    });
    this.raw = this.session + this.media.join('');
    return lines;
}

// add content's to a jingle element
SDP.prototype.toJingle = function (elem, thecreator, ssrcs) {
//    console.log("SSRC" + ssrcs["audio"] + " - " + ssrcs["video"]);
    var i, j, k, mline, ssrc, rtpmap, tmp, line, lines;
    var self = this;
    // new bundle plan
    if (SDPUtil.find_line(this.session, 'a=group:')) {
        lines = SDPUtil.find_lines(this.session, 'a=group:');
        for (i = 0; i < lines.length; i++) {
            tmp = lines[i].split(' ');
            var semantics = tmp.shift().substr(8);
            elem.c('group', {xmlns: 'urn:xmpp:jingle:apps:grouping:0', semantics:semantics});
            for (j = 0; j < tmp.length; j++) {
                elem.c('content', {name: tmp[j]}).up();
            }
            elem.up();
        }
    }
    for (i = 0; i < this.media.length; i++) {
        mline = SDPUtil.parse_mline(this.media[i].split('\r\n')[0]);
        if (!(mline.media === 'audio' ||
              mline.media === 'video' ||
              mline.media === 'application'))
        {
            continue;
        }
        if (SDPUtil.find_line(this.media[i], 'a=ssrc:')) {
            ssrc = SDPUtil.find_line(this.media[i], 'a=ssrc:').substring(7).split(' ')[0]; // take the first
        } else {
            if(ssrcs && ssrcs[mline.media])
            {
                ssrc = ssrcs[mline.media];
            }
            else
                ssrc = false;
        }

        elem.c('content', {creator: thecreator, name: mline.media});
        if (SDPUtil.find_line(this.media[i], 'a=mid:')) {
            // prefer identifier from a=mid if present
            var mid = SDPUtil.parse_mid(SDPUtil.find_line(this.media[i], 'a=mid:'));
            elem.attrs({ name: mid });
        }

        if (SDPUtil.find_line(this.media[i], 'a=rtpmap:').length)
        {
            elem.c('description',
                {xmlns: 'urn:xmpp:jingle:apps:rtp:1',
                    media: mline.media });
            if (ssrc) {
                elem.attrs({ssrc: ssrc});
            }
            for (j = 0; j < mline.fmt.length; j++) {
                rtpmap = SDPUtil.find_line(this.media[i], 'a=rtpmap:' + mline.fmt[j]);
                elem.c('payload-type', SDPUtil.parse_rtpmap(rtpmap));
                // put any 'a=fmtp:' + mline.fmt[j] lines into <param name=foo value=bar/>
                if (SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j])) {
                    tmp = SDPUtil.parse_fmtp(SDPUtil.find_line(this.media[i], 'a=fmtp:' + mline.fmt[j]));
                    for (k = 0; k < tmp.length; k++) {
                        elem.c('parameter', tmp[k]).up();
                    }
                }
                this.RtcpFbToJingle(i, elem, mline.fmt[j]); // XEP-0293 -- map a=rtcp-fb

                elem.up();
            }
            if (SDPUtil.find_line(this.media[i], 'a=crypto:', this.session)) {
                elem.c('encryption', {required: 1});
                var crypto = SDPUtil.find_lines(this.media[i], 'a=crypto:', this.session);
                crypto.forEach(function(line) {
                    elem.c('crypto', SDPUtil.parse_crypto(line)).up();
                });
                elem.up(); // end of encryption
            }

            if (ssrc) {
                // new style mapping
                elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                // FIXME: group by ssrc and support multiple different ssrcs
                var ssrclines = SDPUtil.find_lines(this.media[i], 'a=ssrc:');
                if(ssrclines.length > 0) {
                    ssrclines.forEach(function (line) {
                        idx = line.indexOf(' ');
                        var linessrc = line.substr(0, idx).substr(7);
                        if (linessrc != ssrc) {
                            elem.up();
                            ssrc = linessrc;
                            elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                        }
                        var kv = line.substr(idx + 1);
                        elem.c('parameter');
                        if (kv.indexOf(':') == -1) {
                            elem.attrs({ name: kv });
                        } else {
                            elem.attrs({ name: kv.split(':', 2)[0] });
                            elem.attrs({ value: kv.split(':', 2)[1] });
                        }
                        elem.up();
                    });
                    elem.up();
                }
                else
                {
                    elem.up();
                    elem.c('source', { ssrc: ssrc, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                    elem.c('parameter');
                    elem.attrs({name: "cname", value:Math.random().toString(36).substring(7)});
                    elem.up();
                    var msid = null;
                    if(mline.media == "audio")
                    {
                        msid = RTC.localAudio.getId();
                    }
                    else
                    {
                        msid = RTC.localVideo.getId();
                    }
                    if(msid != null)
                    {
                        msid = msid.replace(/[\{,\}]/g,"");
                        elem.c('parameter');
                        elem.attrs({name: "msid", value:msid});
                        elem.up();
                        elem.c('parameter');
                        elem.attrs({name: "mslabel", value:msid});
                        elem.up();
                        elem.c('parameter');
                        elem.attrs({name: "label", value:msid});
                        elem.up();
                        elem.up();
                    }


                }

                // XEP-0339 handle ssrc-group attributes
                var ssrc_group_lines = SDPUtil.find_lines(this.media[i], 'a=ssrc-group:');
                ssrc_group_lines.forEach(function(line) {
                    idx = line.indexOf(' ');
                    var semantics = line.substr(0, idx).substr(13);
                    var ssrcs = line.substr(14 + semantics.length).split(' ');
                    if (ssrcs.length != 0) {
                        elem.c('ssrc-group', { semantics: semantics, xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
                        ssrcs.forEach(function(ssrc) {
                            elem.c('source', { ssrc: ssrc })
                                .up();
                        });
                        elem.up();
                    }
                });
            }

            if (SDPUtil.find_line(this.media[i], 'a=rtcp-mux')) {
                elem.c('rtcp-mux').up();
            }

            // XEP-0293 -- map a=rtcp-fb:*
            this.RtcpFbToJingle(i, elem, '*');

            // XEP-0294
            if (SDPUtil.find_line(this.media[i], 'a=extmap:')) {
                lines = SDPUtil.find_lines(this.media[i], 'a=extmap:');
                for (j = 0; j < lines.length; j++) {
                    tmp = SDPUtil.parse_extmap(lines[j]);
                    elem.c('rtp-hdrext', { xmlns: 'urn:xmpp:jingle:apps:rtp:rtp-hdrext:0',
                        uri: tmp.uri,
                        id: tmp.value });
                    if (tmp.hasOwnProperty('direction')) {
                        switch (tmp.direction) {
                            case 'sendonly':
                                elem.attrs({senders: 'responder'});
                                break;
                            case 'recvonly':
                                elem.attrs({senders: 'initiator'});
                                break;
                            case 'sendrecv':
                                elem.attrs({senders: 'both'});
                                break;
                            case 'inactive':
                                elem.attrs({senders: 'none'});
                                break;
                        }
                    }
                    // TODO: handle params
                    elem.up();
                }
            }
            elem.up(); // end of description
        }

        // map ice-ufrag/pwd, dtls fingerprint, candidates
        this.TransportToJingle(i, elem);

        if (SDPUtil.find_line(this.media[i], 'a=sendrecv', this.session)) {
            elem.attrs({senders: 'both'});
        } else if (SDPUtil.find_line(this.media[i], 'a=sendonly', this.session)) {
            elem.attrs({senders: 'initiator'});
        } else if (SDPUtil.find_line(this.media[i], 'a=recvonly', this.session)) {
            elem.attrs({senders: 'responder'});
        } else if (SDPUtil.find_line(this.media[i], 'a=inactive', this.session)) {
            elem.attrs({senders: 'none'});
        }
        if (mline.port == '0') {
            // estos hack to reject an m-line
            elem.attrs({senders: 'rejected'});
        }
        elem.up(); // end of content
    }
    elem.up();
    return elem;
};

SDP.prototype.TransportToJingle = function (mediaindex, elem) {
    var i = mediaindex;
    var tmp;
    var self = this;
    elem.c('transport');

    // XEP-0343 DTLS/SCTP
    if (SDPUtil.find_line(this.media[mediaindex], 'a=sctpmap:').length)
    {
        var sctpmap = SDPUtil.find_line(
            this.media[i], 'a=sctpmap:', self.session);
        if (sctpmap)
        {
            var sctpAttrs = SDPUtil.parse_sctpmap(sctpmap);
            elem.c('sctpmap',
                {
                    xmlns: 'urn:xmpp:jingle:transports:dtls-sctp:1',
                    number: sctpAttrs[0], /* SCTP port */
                    protocol: sctpAttrs[1], /* protocol */
                });
            // Optional stream count attribute
            if (sctpAttrs.length > 2)
                elem.attrs({ streams: sctpAttrs[2]});
            elem.up();
        }
    }
    // XEP-0320
    var fingerprints = SDPUtil.find_lines(this.media[mediaindex], 'a=fingerprint:', this.session);
    fingerprints.forEach(function(line) {
        tmp = SDPUtil.parse_fingerprint(line);
        tmp.xmlns = 'urn:xmpp:jingle:apps:dtls:0';
        elem.c('fingerprint').t(tmp.fingerprint);
        delete tmp.fingerprint;
        line = SDPUtil.find_line(self.media[mediaindex], 'a=setup:', self.session);
        if (line) {
            tmp.setup = line.substr(8);
        }
        elem.attrs(tmp);
        elem.up(); // end of fingerprint
    });
    tmp = SDPUtil.iceparams(this.media[mediaindex], this.session);
    if (tmp) {
        tmp.xmlns = 'urn:xmpp:jingle:transports:ice-udp:1';
        elem.attrs(tmp);
        // XEP-0176
        if (SDPUtil.find_line(this.media[mediaindex], 'a=candidate:', this.session)) { // add any a=candidate lines
            var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=candidate:', this.session);
            lines.forEach(function (line) {
                elem.c('candidate', SDPUtil.candidateToJingle(line)).up();
            });
        }
    }
    elem.up(); // end of transport
}

SDP.prototype.RtcpFbToJingle = function (mediaindex, elem, payloadtype) { // XEP-0293
    var lines = SDPUtil.find_lines(this.media[mediaindex], 'a=rtcp-fb:' + payloadtype);
    lines.forEach(function (line) {
        var tmp = SDPUtil.parse_rtcpfb(line);
        if (tmp.type == 'trr-int') {
            elem.c('rtcp-fb-trr-int', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', value: tmp.params[0]});
            elem.up();
        } else {
            elem.c('rtcp-fb', {xmlns: 'urn:xmpp:jingle:apps:rtp:rtcp-fb:0', type: tmp.type});
            if (tmp.params.length > 0) {
                elem.attrs({'subtype': tmp.params[0]});
            }
            elem.up();
        }
    });
};

SDP.prototype.RtcpFbFromJingle = function (elem, payloadtype) { // XEP-0293
    var media = '';
    var tmp = elem.find('>rtcp-fb-trr-int[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
    if (tmp.length) {
        media += 'a=rtcp-fb:' + '*' + ' ' + 'trr-int' + ' ';
        if (tmp.attr('value')) {
            media += tmp.attr('value');
        } else {
            media += '0';
        }
        media += '\r\n';
    }
    tmp = elem.find('>rtcp-fb[xmlns="urn:xmpp:jingle:apps:rtp:rtcp-fb:0"]');
    tmp.each(function () {
        media += 'a=rtcp-fb:' + payloadtype + ' ' + $(this).attr('type');
        if ($(this).attr('subtype')) {
            media += ' ' + $(this).attr('subtype');
        }
        media += '\r\n';
    });
    return media;
};

// construct an SDP from a jingle stanza
SDP.prototype.fromJingle = function (jingle) {
    var self = this;
    this.raw = 'v=0\r\n' +
        'o=- ' + '1923518516' + ' 2 IN IP4 0.0.0.0\r\n' +// FIXME
        's=-\r\n' +
        't=0 0\r\n';
    // http://tools.ietf.org/html/draft-ietf-mmusic-sdp-bundle-negotiation-04#section-8
    if ($(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').length) {
        $(jingle).find('>group[xmlns="urn:xmpp:jingle:apps:grouping:0"]').each(function (idx, group) {
            var contents = $(group).find('>content').map(function (idx, content) {
                return content.getAttribute('name');
            }).get();
            if (contents.length > 0) {
                self.raw += 'a=group:' + (group.getAttribute('semantics') || group.getAttribute('type')) + ' ' + contents.join(' ') + '\r\n';
            }
        });
    }

    this.session = this.raw;
    jingle.find('>content').each(function () {
        var m = self.jingle2media($(this));
        self.media.push(m);
    });

    // reconstruct msid-semantic -- apparently not necessary
    /*
     var msid = SDPUtil.parse_ssrc(this.raw);
     if (msid.hasOwnProperty('mslabel')) {
     this.session += "a=msid-semantic: WMS " + msid.mslabel + "\r\n";
     }
     */

    this.raw = this.session + this.media.join('');
};

// translate a jingle content element into an an SDP media part
SDP.prototype.jingle2media = function (content) {
    var media = '',
        desc = content.find('description'),
        ssrc = desc.attr('ssrc'),
        self = this,
        tmp;
    var sctp = content.find(
        '>transport>sctpmap[xmlns="urn:xmpp:jingle:transports:dtls-sctp:1"]');

    tmp = { media: desc.attr('media') };
    tmp.port = '1';
    if (content.attr('senders') == 'rejected') {
        // estos hack to reject an m-line.
        tmp.port = '0';
    }
    if (content.find('>transport>fingerprint').length || desc.find('encryption').length) {
        if (sctp.length)
            tmp.proto = 'DTLS/SCTP';
        else
            tmp.proto = 'RTP/SAVPF';
    } else {
        tmp.proto = 'RTP/AVPF';
    }
    if (!sctp.length)
    {
        tmp.fmt = desc.find('payload-type').map(
            function () { return this.getAttribute('id'); }).get();
        media += SDPUtil.build_mline(tmp) + '\r\n';
    }
    else
    {
        media += 'm=application 1 DTLS/SCTP ' + sctp.attr('number') + '\r\n';
        media += 'a=sctpmap:' + sctp.attr('number') +
            ' ' + sctp.attr('protocol');

        var streamCount = sctp.attr('streams');
        if (streamCount)
            media += ' ' + streamCount + '\r\n';
        else
            media += '\r\n';
    }

    media += 'c=IN IP4 0.0.0.0\r\n';
    if (!sctp.length)
        media += 'a=rtcp:1 IN IP4 0.0.0.0\r\n';
    tmp = content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]');
    if (tmp.length) {
        if (tmp.attr('ufrag')) {
            media += SDPUtil.build_iceufrag(tmp.attr('ufrag')) + '\r\n';
        }
        if (tmp.attr('pwd')) {
            media += SDPUtil.build_icepwd(tmp.attr('pwd')) + '\r\n';
        }
        tmp.find('>fingerprint').each(function () {
            // FIXME: check namespace at some point
            media += 'a=fingerprint:' + this.getAttribute('hash');
            media += ' ' + $(this).text();
            media += '\r\n';
            if (this.getAttribute('setup')) {
                media += 'a=setup:' + this.getAttribute('setup') + '\r\n';
            }
        });
    }
    switch (content.attr('senders')) {
        case 'initiator':
            media += 'a=sendonly\r\n';
            break;
        case 'responder':
            media += 'a=recvonly\r\n';
            break;
        case 'none':
            media += 'a=inactive\r\n';
            break;
        case 'both':
            media += 'a=sendrecv\r\n';
            break;
    }
    media += 'a=mid:' + content.attr('name') + '\r\n';

    // <description><rtcp-mux/></description>
    // see http://code.google.com/p/libjingle/issues/detail?id=309 -- no spec though
    // and http://mail.jabber.org/pipermail/jingle/2011-December/001761.html
    if (desc.find('rtcp-mux').length) {
        media += 'a=rtcp-mux\r\n';
    }

    if (desc.find('encryption').length) {
        desc.find('encryption>crypto').each(function () {
            media += 'a=crypto:' + this.getAttribute('tag');
            media += ' ' + this.getAttribute('crypto-suite');
            media += ' ' + this.getAttribute('key-params');
            if (this.getAttribute('session-params')) {
                media += ' ' + this.getAttribute('session-params');
            }
            media += '\r\n';
        });
    }
    desc.find('payload-type').each(function () {
        media += SDPUtil.build_rtpmap(this) + '\r\n';
        if ($(this).find('>parameter').length) {
            media += 'a=fmtp:' + this.getAttribute('id') + ' ';
            media += $(this).find('parameter').map(function () { return (this.getAttribute('name') ? (this.getAttribute('name') + '=') : '') + this.getAttribute('value'); }).get().join('; ');
            media += '\r\n';
        }
        // xep-0293
        media += self.RtcpFbFromJingle($(this), this.getAttribute('id'));
    });

    // xep-0293
    media += self.RtcpFbFromJingle(desc, '*');

    // xep-0294
    tmp = desc.find('>rtp-hdrext[xmlns="urn:xmpp:jingle:apps:rtp:rtp-hdrext:0"]');
    tmp.each(function () {
        media += 'a=extmap:' + this.getAttribute('id') + ' ' + this.getAttribute('uri') + '\r\n';
    });

    content.find('>transport[xmlns="urn:xmpp:jingle:transports:ice-udp:1"]>candidate').each(function () {
        media += SDPUtil.candidateFromJingle(this);
    });

    // XEP-0339 handle ssrc-group attributes
    tmp = content.find('description>ssrc-group[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]').each(function() {
        var semantics = this.getAttribute('semantics');
        var ssrcs = $(this).find('>source').map(function() {
            return this.getAttribute('ssrc');
        }).get();

        if (ssrcs.length != 0) {
            media += 'a=ssrc-group:' + semantics + ' ' + ssrcs.join(' ') + '\r\n';
        }
    });

    tmp = content.find('description>source[xmlns="urn:xmpp:jingle:apps:rtp:ssma:0"]');
    tmp.each(function () {
        var ssrc = this.getAttribute('ssrc');
        $(this).find('>parameter').each(function () {
            media += 'a=ssrc:' + ssrc + ' ' + this.getAttribute('name');
            if (this.getAttribute('value') && this.getAttribute('value').length)
                media += ':' + this.getAttribute('value');
            media += '\r\n';
        });
    });

    return media;
};


module.exports = SDP;


},{"./SDPUtil":4}],3:[function(require,module,exports){
function SDPDiffer(mySDP, otherSDP) {
    this.mySDP = mySDP;
    this.otherSDP = otherSDP;
}

/**
 * Returns map of MediaChannel that contains only media not contained in <tt>otherSdp</tt>. Mapped by channel idx.
 * @param otherSdp the other SDP to check ssrc with.
 */
SDPDiffer.prototype.getNewMedia = function() {

    // this could be useful in Array.prototype.
    function arrayEquals(array) {
        // if the other array is a falsy value, return
        if (!array)
            return false;

        // compare lengths - can save a lot of time
        if (this.length != array.length)
            return false;

        for (var i = 0, l=this.length; i < l; i++) {
            // Check if we have nested arrays
            if (this[i] instanceof Array && array[i] instanceof Array) {
                // recurse into the nested arrays
                if (!this[i].equals(array[i]))
                    return false;
            }
            else if (this[i] != array[i]) {
                // Warning - two different object instances will never be equal: {x:20} != {x:20}
                return false;
            }
        }
        return true;
    }

    var myMedias = this.mySDP.getMediaSsrcMap();
    var othersMedias = this.otherSDP.getMediaSsrcMap();
    var newMedia = {};
    Object.keys(othersMedias).forEach(function(othersMediaIdx) {
        var myMedia = myMedias[othersMediaIdx];
        var othersMedia = othersMedias[othersMediaIdx];
        if(!myMedia && othersMedia) {
            // Add whole channel
            newMedia[othersMediaIdx] = othersMedia;
            return;
        }
        // Look for new ssrcs accross the channel
        Object.keys(othersMedia.ssrcs).forEach(function(ssrc) {
            if(Object.keys(myMedia.ssrcs).indexOf(ssrc) === -1) {
                // Allocate channel if we've found ssrc that doesn't exist in our channel
                if(!newMedia[othersMediaIdx]){
                    newMedia[othersMediaIdx] = {
                        mediaindex: othersMedia.mediaindex,
                        mid: othersMedia.mid,
                        ssrcs: {},
                        ssrcGroups: []
                    };
                }
                newMedia[othersMediaIdx].ssrcs[ssrc] = othersMedia.ssrcs[ssrc];
            }
        });

        // Look for new ssrc groups across the channels
        othersMedia.ssrcGroups.forEach(function(otherSsrcGroup){

            // try to match the other ssrc-group with an ssrc-group of ours
            var matched = false;
            for (var i = 0; i < myMedia.ssrcGroups.length; i++) {
                var mySsrcGroup = myMedia.ssrcGroups[i];
                if (otherSsrcGroup.semantics == mySsrcGroup.semantics
                    && arrayEquals.apply(otherSsrcGroup.ssrcs, [mySsrcGroup.ssrcs])) {

                    matched = true;
                    break;
                }
            }

            if (!matched) {
                // Allocate channel if we've found an ssrc-group that doesn't
                // exist in our channel

                if(!newMedia[othersMediaIdx]){
                    newMedia[othersMediaIdx] = {
                        mediaindex: othersMedia.mediaindex,
                        mid: othersMedia.mid,
                        ssrcs: {},
                        ssrcGroups: []
                    };
                }
                newMedia[othersMediaIdx].ssrcGroups.push(otherSsrcGroup);
            }
        });
    });
    return newMedia;
};

/**
 * Sends SSRC update IQ.
 * @param sdpMediaSsrcs SSRCs map obtained from SDP.getNewMedia. Cntains SSRCs to add/remove.
 * @param sid session identifier that will be put into the IQ.
 * @param initiator initiator identifier.
 * @param toJid destination Jid
 * @param isAdd indicates if this is remove or add operation.
 */
SDPDiffer.prototype.toJingle = function(modify) {
    var sdpMediaSsrcs = this.getNewMedia();
    var self = this;

    // FIXME: only announce video ssrcs since we mix audio and dont need
    //      the audio ssrcs therefore
    var modified = false;
    Object.keys(sdpMediaSsrcs).forEach(function(mediaindex){
        modified = true;
        var media = sdpMediaSsrcs[mediaindex];
        modify.c('content', {name: media.mid});

        modify.c('description', {xmlns:'urn:xmpp:jingle:apps:rtp:1', media: media.mid});
        // FIXME: not completly sure this operates on blocks and / or handles different ssrcs correctly
        // generate sources from lines
        Object.keys(media.ssrcs).forEach(function(ssrcNum) {
            var mediaSsrc = media.ssrcs[ssrcNum];
            modify.c('source', { xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0' });
            modify.attrs({ssrc: mediaSsrc.ssrc});
            // iterate over ssrc lines
            mediaSsrc.lines.forEach(function (line) {
                var idx = line.indexOf(' ');
                var kv = line.substr(idx + 1);
                modify.c('parameter');
                if (kv.indexOf(':') == -1) {
                    modify.attrs({ name: kv });
                } else {
                    modify.attrs({ name: kv.split(':', 2)[0] });
                    modify.attrs({ value: kv.split(':', 2)[1] });
                }
                modify.up(); // end of parameter
            });
            modify.up(); // end of source
        });

        // generate source groups from lines
        media.ssrcGroups.forEach(function(ssrcGroup) {
            if (ssrcGroup.ssrcs.length != 0) {

                modify.c('ssrc-group', {
                    semantics: ssrcGroup.semantics,
                    xmlns: 'urn:xmpp:jingle:apps:rtp:ssma:0'
                });

                ssrcGroup.ssrcs.forEach(function (ssrc) {
                    modify.c('source', { ssrc: ssrc })
                        .up(); // end of source
                });
                modify.up(); // end of ssrc-group
            }
        });

        modify.up(); // end of description
        modify.up(); // end of content
    });

    return modified;
};

module.exports = SDPDiffer;
},{}],4:[function(require,module,exports){
SDPUtil = {
    iceparams: function (mediadesc, sessiondesc) {
        var data = null;
        if (SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc) &&
            SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc)) {
            data = {
                ufrag: SDPUtil.parse_iceufrag(SDPUtil.find_line(mediadesc, 'a=ice-ufrag:', sessiondesc)),
                pwd: SDPUtil.parse_icepwd(SDPUtil.find_line(mediadesc, 'a=ice-pwd:', sessiondesc))
            };
        }
        return data;
    },
    parse_iceufrag: function (line) {
        return line.substring(12);
    },
    build_iceufrag: function (frag) {
        return 'a=ice-ufrag:' + frag;
    },
    parse_icepwd: function (line) {
        return line.substring(10);
    },
    build_icepwd: function (pwd) {
        return 'a=ice-pwd:' + pwd;
    },
    parse_mid: function (line) {
        return line.substring(6);
    },
    parse_mline: function (line) {
        var parts = line.substring(2).split(' '),
            data = {};
        data.media = parts.shift();
        data.port = parts.shift();
        data.proto = parts.shift();
        if (parts[parts.length - 1] === '') { // trailing whitespace
            parts.pop();
        }
        data.fmt = parts;
        return data;
    },
    build_mline: function (mline) {
        return 'm=' + mline.media + ' ' + mline.port + ' ' + mline.proto + ' ' + mline.fmt.join(' ');
    },
    parse_rtpmap: function (line) {
        var parts = line.substring(9).split(' '),
            data = {};
        data.id = parts.shift();
        parts = parts[0].split('/');
        data.name = parts.shift();
        data.clockrate = parts.shift();
        data.channels = parts.length ? parts.shift() : '1';
        return data;
    },
    /**
     * Parses SDP line "a=sctpmap:..." and extracts SCTP port from it.
     * @param line eg. "a=sctpmap:5000 webrtc-datachannel"
     * @returns [SCTP port number, protocol, streams]
     */
    parse_sctpmap: function (line)
    {
        var parts = line.substring(10).split(' ');
        var sctpPort = parts[0];
        var protocol = parts[1];
        // Stream count is optional
        var streamCount = parts.length > 2 ? parts[2] : null;
        return [sctpPort, protocol, streamCount];// SCTP port
    },
    build_rtpmap: function (el) {
        var line = 'a=rtpmap:' + el.getAttribute('id') + ' ' + el.getAttribute('name') + '/' + el.getAttribute('clockrate');
        if (el.getAttribute('channels') && el.getAttribute('channels') != '1') {
            line += '/' + el.getAttribute('channels');
        }
        return line;
    },
    parse_crypto: function (line) {
        var parts = line.substring(9).split(' '),
            data = {};
        data.tag = parts.shift();
        data['crypto-suite'] = parts.shift();
        data['key-params'] = parts.shift();
        if (parts.length) {
            data['session-params'] = parts.join(' ');
        }
        return data;
    },
    parse_fingerprint: function (line) { // RFC 4572
        var parts = line.substring(14).split(' '),
            data = {};
        data.hash = parts.shift();
        data.fingerprint = parts.shift();
        // TODO assert that fingerprint satisfies 2UHEX *(":" 2UHEX) ?
        return data;
    },
    parse_fmtp: function (line) {
        var parts = line.split(' '),
            i, key, value,
            data = [];
        parts.shift();
        parts = parts.join(' ').split(';');
        for (i = 0; i < parts.length; i++) {
            key = parts[i].split('=')[0];
            while (key.length && key[0] == ' ') {
                key = key.substring(1);
            }
            value = parts[i].split('=')[1];
            if (key && value) {
                data.push({name: key, value: value});
            } else if (key) {
                // rfc 4733 (DTMF) style stuff
                data.push({name: '', value: key});
            }
        }
        return data;
    },
    parse_icecandidate: function (line) {
        var candidate = {},
            elems = line.split(' ');
        candidate.foundation = elems[0].substring(12);
        candidate.component = elems[1];
        candidate.protocol = elems[2].toLowerCase();
        candidate.priority = elems[3];
        candidate.ip = elems[4];
        candidate.port = elems[5];
        // elems[6] => "typ"
        candidate.type = elems[7];
        candidate.generation = 0; // default value, may be overwritten below
        for (var i = 8; i < elems.length; i += 2) {
            switch (elems[i]) {
                case 'raddr':
                    candidate['rel-addr'] = elems[i + 1];
                    break;
                case 'rport':
                    candidate['rel-port'] = elems[i + 1];
                    break;
                case 'generation':
                    candidate.generation = elems[i + 1];
                    break;
                case 'tcptype':
                    candidate.tcptype = elems[i + 1];
                    break;
                default: // TODO
                    console.log('parse_icecandidate not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
            }
        }
        candidate.network = '1';
        candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
        return candidate;
    },
    build_icecandidate: function (cand) {
        var line = ['a=candidate:' + cand.foundation, cand.component, cand.protocol, cand.priority, cand.ip, cand.port, 'typ', cand.type].join(' ');
        line += ' ';
        switch (cand.type) {
            case 'srflx':
            case 'prflx':
            case 'relay':
                if (cand.hasOwnAttribute('rel-addr') && cand.hasOwnAttribute('rel-port')) {
                    line += 'raddr';
                    line += ' ';
                    line += cand['rel-addr'];
                    line += ' ';
                    line += 'rport';
                    line += ' ';
                    line += cand['rel-port'];
                    line += ' ';
                }
                break;
        }
        if (cand.hasOwnAttribute('tcptype')) {
            line += 'tcptype';
            line += ' ';
            line += cand.tcptype;
            line += ' ';
        }
        line += 'generation';
        line += ' ';
        line += cand.hasOwnAttribute('generation') ? cand.generation : '0';
        return line;
    },
    parse_ssrc: function (desc) {
        // proprietary mapping of a=ssrc lines
        // TODO: see "Jingle RTP Source Description" by Juberti and P. Thatcher on google docs
        // and parse according to that
        var lines = desc.split('\r\n'),
            data = {};
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, 7) == 'a=ssrc:') {
                var idx = lines[i].indexOf(' ');
                data[lines[i].substr(idx + 1).split(':', 2)[0]] = lines[i].substr(idx + 1).split(':', 2)[1];
            }
        }
        return data;
    },
    parse_rtcpfb: function (line) {
        var parts = line.substr(10).split(' ');
        var data = {};
        data.pt = parts.shift();
        data.type = parts.shift();
        data.params = parts;
        return data;
    },
    parse_extmap: function (line) {
        var parts = line.substr(9).split(' ');
        var data = {};
        data.value = parts.shift();
        if (data.value.indexOf('/') != -1) {
            data.direction = data.value.substr(data.value.indexOf('/') + 1);
            data.value = data.value.substr(0, data.value.indexOf('/'));
        } else {
            data.direction = 'both';
        }
        data.uri = parts.shift();
        data.params = parts;
        return data;
    },
    find_line: function (haystack, needle, sessionpart) {
        var lines = haystack.split('\r\n');
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, needle.length) == needle) {
                return lines[i];
            }
        }
        if (!sessionpart) {
            return false;
        }
        // search session part
        lines = sessionpart.split('\r\n');
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].substring(0, needle.length) == needle) {
                return lines[j];
            }
        }
        return false;
    },
    find_lines: function (haystack, needle, sessionpart) {
        var lines = haystack.split('\r\n'),
            needles = [];
        for (var i = 0; i < lines.length; i++) {
            if (lines[i].substring(0, needle.length) == needle)
                needles.push(lines[i]);
        }
        if (needles.length || !sessionpart) {
            return needles;
        }
        // search session part
        lines = sessionpart.split('\r\n');
        for (var j = 0; j < lines.length; j++) {
            if (lines[j].substring(0, needle.length) == needle) {
                needles.push(lines[j]);
            }
        }
        return needles;
    },
    candidateToJingle: function (line) {
        // a=candidate:2979166662 1 udp 2113937151 192.168.2.100 57698 typ host generation 0
        //      <candidate component=... foundation=... generation=... id=... ip=... network=... port=... priority=... protocol=... type=.../>
        if (line.indexOf('candidate:') === 0) {
            line = 'a=' + line;
        } else if (line.substring(0, 12) != 'a=candidate:') {
            console.log('parseCandidate called with a line that is not a candidate line');
            console.log(line);
            return null;
        }
        if (line.substring(line.length - 2) == '\r\n') // chomp it
            line = line.substring(0, line.length - 2);
        var candidate = {},
            elems = line.split(' '),
            i;
        if (elems[6] != 'typ') {
            console.log('did not find typ in the right place');
            console.log(line);
            return null;
        }
        candidate.foundation = elems[0].substring(12);
        candidate.component = elems[1];
        candidate.protocol = elems[2].toLowerCase();
        candidate.priority = elems[3];
        candidate.ip = elems[4];
        candidate.port = elems[5];
        // elems[6] => "typ"
        candidate.type = elems[7];

        candidate.generation = '0'; // default, may be overwritten below
        for (i = 8; i < elems.length; i += 2) {
            switch (elems[i]) {
                case 'raddr':
                    candidate['rel-addr'] = elems[i + 1];
                    break;
                case 'rport':
                    candidate['rel-port'] = elems[i + 1];
                    break;
                case 'generation':
                    candidate.generation = elems[i + 1];
                    break;
                case 'tcptype':
                    candidate.tcptype = elems[i + 1];
                    break;
                default: // TODO
                    console.log('not translating "' + elems[i] + '" = "' + elems[i + 1] + '"');
            }
        }
        candidate.network = '1';
        candidate.id = Math.random().toString(36).substr(2, 10); // not applicable to SDP -- FIXME: should be unique, not just random
        return candidate;
    },
    candidateFromJingle: function (cand) {
        var line = 'a=candidate:';
        line += cand.getAttribute('foundation');
        line += ' ';
        line += cand.getAttribute('component');
        line += ' ';
        line += cand.getAttribute('protocol'); //.toUpperCase(); // chrome M23 doesn't like this
        line += ' ';
        line += cand.getAttribute('priority');
        line += ' ';
        line += cand.getAttribute('ip');
        line += ' ';
        line += cand.getAttribute('port');
        line += ' ';
        line += 'typ';
        line += ' ' + cand.getAttribute('type');
        line += ' ';
        switch (cand.getAttribute('type')) {
            case 'srflx':
            case 'prflx':
            case 'relay':
                if (cand.getAttribute('rel-addr') && cand.getAttribute('rel-port')) {
                    line += 'raddr';
                    line += ' ';
                    line += cand.getAttribute('rel-addr');
                    line += ' ';
                    line += 'rport';
                    line += ' ';
                    line += cand.getAttribute('rel-port');
                    line += ' ';
                }
                break;
        }
        if (cand.getAttribute('protocol').toLowerCase() == 'tcp') {
            line += 'tcptype';
            line += ' ';
            line += cand.getAttribute('tcptype');
            line += ' ';
        }
        line += 'generation';
        line += ' ';
        line += cand.getAttribute('generation') || '0';
        return line + '\r\n';
    }
};
module.exports = SDPUtil;
},{}],5:[function(require,module,exports){
function TraceablePeerConnection(ice_config, constraints) {
    var self = this;
    var RTCPeerconnection = navigator.mozGetUserMedia ? mozRTCPeerConnection : webkitRTCPeerConnection;
    this.peerconnection = new RTCPeerconnection(ice_config, constraints);
    this.updateLog = [];
    this.stats = {};
    this.statsinterval = null;
    this.maxstats = 0; // limit to 300 values, i.e. 5 minutes; set to 0 to disable

    // override as desired
    this.trace = function (what, info) {
        //console.warn('WTRACE', what, info);
        self.updateLog.push({
            time: new Date(),
            type: what,
            value: info || ""
        });
    };
    this.onicecandidate = null;
    this.peerconnection.onicecandidate = function (event) {
        self.trace('onicecandidate', JSON.stringify(event.candidate, null, ' '));
        if (self.onicecandidate !== null) {
            self.onicecandidate(event);
        }
    };
    this.onaddstream = null;
    this.peerconnection.onaddstream = function (event) {
        self.trace('onaddstream', event.stream.id);
        if (self.onaddstream !== null) {
            self.onaddstream(event);
        }
    };
    this.onremovestream = null;
    this.peerconnection.onremovestream = function (event) {
        self.trace('onremovestream', event.stream.id);
        if (self.onremovestream !== null) {
            self.onremovestream(event);
        }
    };
    this.onsignalingstatechange = null;
    this.peerconnection.onsignalingstatechange = function (event) {
        self.trace('onsignalingstatechange', self.signalingState);
        if (self.onsignalingstatechange !== null) {
            self.onsignalingstatechange(event);
        }
    };
    this.oniceconnectionstatechange = null;
    this.peerconnection.oniceconnectionstatechange = function (event) {
        self.trace('oniceconnectionstatechange', self.iceConnectionState);
        if (self.oniceconnectionstatechange !== null) {
            self.oniceconnectionstatechange(event);
        }
    };
    this.onnegotiationneeded = null;
    this.peerconnection.onnegotiationneeded = function (event) {
        self.trace('onnegotiationneeded');
        if (self.onnegotiationneeded !== null) {
            self.onnegotiationneeded(event);
        }
    };
    self.ondatachannel = null;
    this.peerconnection.ondatachannel = function (event) {
        self.trace('ondatachannel', event);
        if (self.ondatachannel !== null) {
            self.ondatachannel(event);
        }
    };
    if (!navigator.mozGetUserMedia && this.maxstats) {
        this.statsinterval = window.setInterval(function() {
            self.peerconnection.getStats(function(stats) {
                var results = stats.result();
                for (var i = 0; i < results.length; ++i) {
                    //console.log(results[i].type, results[i].id, results[i].names())
                    var now = new Date();
                    results[i].names().forEach(function (name) {
                        var id = results[i].id + '-' + name;
                        if (!self.stats[id]) {
                            self.stats[id] = {
                                startTime: now,
                                endTime: now,
                                values: [],
                                times: []
                            };
                        }
                        self.stats[id].values.push(results[i].stat(name));
                        self.stats[id].times.push(now.getTime());
                        if (self.stats[id].values.length > self.maxstats) {
                            self.stats[id].values.shift();
                            self.stats[id].times.shift();
                        }
                        self.stats[id].endTime = now;
                    });
                }
            });

        }, 1000);
    }
};

dumpSDP = function(description) {
    return 'type: ' + description.type + '\r\n' + description.sdp;
}

if (TraceablePeerConnection.prototype.__defineGetter__ !== undefined) {
    TraceablePeerConnection.prototype.__defineGetter__('signalingState', function() { return this.peerconnection.signalingState; });
    TraceablePeerConnection.prototype.__defineGetter__('iceConnectionState', function() { return this.peerconnection.iceConnectionState; });
    TraceablePeerConnection.prototype.__defineGetter__('localDescription', function() {
        var publicLocalDescription = simulcast.reverseTransformLocalDescription(this.peerconnection.localDescription);
        return publicLocalDescription;
    });
    TraceablePeerConnection.prototype.__defineGetter__('remoteDescription', function() {
        var publicRemoteDescription = simulcast.reverseTransformRemoteDescription(this.peerconnection.remoteDescription);
        return publicRemoteDescription;
    });
}

TraceablePeerConnection.prototype.addStream = function (stream) {
    this.trace('addStream', stream.id);
    simulcast.resetSender();
    try
    {
        this.peerconnection.addStream(stream);
    }
    catch (e)
    {
        console.error(e);
        return;
    }
};

TraceablePeerConnection.prototype.removeStream = function (stream, stopStreams) {
    this.trace('removeStream', stream.id);
    simulcast.resetSender();
    if(stopStreams) {
        stream.getAudioTracks().forEach(function (track) {
            track.stop();
        });
        stream.getVideoTracks().forEach(function (track) {
            track.stop();
        });
    }
    this.peerconnection.removeStream(stream);
};

TraceablePeerConnection.prototype.createDataChannel = function (label, opts) {
    this.trace('createDataChannel', label, opts);
    return this.peerconnection.createDataChannel(label, opts);
};

TraceablePeerConnection.prototype.setLocalDescription = function (description, successCallback, failureCallback) {
    var self = this;
    description = simulcast.transformLocalDescription(description);
    this.trace('setLocalDescription', dumpSDP(description));
    this.peerconnection.setLocalDescription(description,
        function () {
            self.trace('setLocalDescriptionOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('setLocalDescriptionOnFailure', err);
            failureCallback(err);
        }
    );
    /*
     if (this.statsinterval === null && this.maxstats > 0) {
     // start gathering stats
     }
     */
};

TraceablePeerConnection.prototype.setRemoteDescription = function (description, successCallback, failureCallback) {
    var self = this;
    description = simulcast.transformRemoteDescription(description);
    this.trace('setRemoteDescription', dumpSDP(description));
    this.peerconnection.setRemoteDescription(description,
        function () {
            self.trace('setRemoteDescriptionOnSuccess');
            successCallback();
        },
        function (err) {
            self.trace('setRemoteDescriptionOnFailure', err);
            failureCallback(err);
        }
    );
    /*
     if (this.statsinterval === null && this.maxstats > 0) {
     // start gathering stats
     }
     */
};

TraceablePeerConnection.prototype.close = function () {
    this.trace('stop');
    if (this.statsinterval !== null) {
        window.clearInterval(this.statsinterval);
        this.statsinterval = null;
    }
    this.peerconnection.close();
};

TraceablePeerConnection.prototype.createOffer = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createOffer', JSON.stringify(constraints, null, ' '));
    this.peerconnection.createOffer(
        function (offer) {
            self.trace('createOfferOnSuccess', dumpSDP(offer));
            successCallback(offer);
        },
        function(err) {
            self.trace('createOfferOnFailure', err);
            failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.createAnswer = function (successCallback, failureCallback, constraints) {
    var self = this;
    this.trace('createAnswer', JSON.stringify(constraints, null, ' '));
    this.peerconnection.createAnswer(
        function (answer) {
            answer = simulcast.transformAnswer(answer);
            self.trace('createAnswerOnSuccess', dumpSDP(answer));
            successCallback(answer);
        },
        function(err) {
            self.trace('createAnswerOnFailure', err);
            failureCallback(err);
        },
        constraints
    );
};

TraceablePeerConnection.prototype.addIceCandidate = function (candidate, successCallback, failureCallback) {
    var self = this;
    this.trace('addIceCandidate', JSON.stringify(candidate, null, ' '));
    this.peerconnection.addIceCandidate(candidate);
    /* maybe later
     this.peerconnection.addIceCandidate(candidate,
     function () {
     self.trace('addIceCandidateOnSuccess');
     successCallback();
     },
     function (err) {
     self.trace('addIceCandidateOnFailure', err);
     failureCallback(err);
     }
     );
     */
};

TraceablePeerConnection.prototype.getStats = function(callback, errback) {
    if (navigator.mozGetUserMedia) {
        // ignore for now...
        if(!errback)
            errback = function () {

            }
        this.peerconnection.getStats(null,callback,errback);
    } else {
        this.peerconnection.getStats(callback);
    }
};

module.exports = TraceablePeerConnection;


},{}],6:[function(require,module,exports){
/* global $, $iq, config, connection, UI, messageHandler,
 roomName, sessionTerminated, Strophe, Util */
/**
 * Contains logic responsible for enabling/disabling functionality available
 * only to moderator users.
 */
var connection = null;
var focusUserJid;
var getNextTimeout = Util.createExpBackoffTimer(1000);
var getNextErrorTimeout = Util.createExpBackoffTimer(1000);
// External authentication stuff
var externalAuthEnabled = false;
// Sip gateway can be enabled by configuring Jigasi host in config.js or
// it will be enabled automatically if focus detects the component through
// service discovery.
var sipGatewayEnabled = config.hosts.call_control !== undefined;

var Moderator = {
    isModerator: function () {
        return connection && connection.emuc.isModerator();
    },

    isPeerModerator: function (peerJid) {
        return connection &&
            connection.emuc.getMemberRole(peerJid) === 'moderator';
    },

    isExternalAuthEnabled: function () {
        return externalAuthEnabled;
    },

    isSipGatewayEnabled: function () {
        return sipGatewayEnabled;
    },

    setConnection: function (con) {
        connection = con;
    },

    init: function (xmpp) {
        this.xmppService = xmpp;
        this.onLocalRoleChange = function (from, member, pres) {
            UI.onModeratorStatusChanged(Moderator.isModerator());
        };
    },

    onMucLeft: function (jid) {
        console.info("Someone left is it focus ? " + jid);
        var resource = Strophe.getResourceFromJid(jid);
        if (resource === 'focus' && !this.xmppService.sessionTerminated) {
            console.info(
                "Focus has left the room - leaving conference");
            //hangUp();
            // We'd rather reload to have everything re-initialized
            // FIXME: show some message before reload
            location.reload();
        }
    },
    
    setFocusUserJid: function (focusJid) {
        if (!focusUserJid) {
            focusUserJid = focusJid;
            console.info("Focus jid set to: " + focusUserJid);
        }
    },

    getFocusUserJid: function () {
        return focusUserJid;
    },

    getFocusComponent: function () {
        // Get focus component address
        var focusComponent = config.hosts.focus;
        // If not specified use default: 'focus.domain'
        if (!focusComponent) {
            focusComponent = 'focus.' + config.hosts.domain;
        }
        return focusComponent;
    },

    createConferenceIq: function (roomName) {
        // Generate create conference IQ
        var elem = $iq({to: Moderator.getFocusComponent(), type: 'set'});
        elem.c('conference', {
            xmlns: 'http://jitsi.org/protocol/focus',
            room: roomName
        });
        if (config.hosts.bridge !== undefined) {
            elem.c(
                'property',
                { name: 'bridge', value: config.hosts.bridge})
                .up();
        }
        // Tell the focus we have Jigasi configured
        if (config.hosts.call_control !== undefined) {
            elem.c(
                'property',
                { name: 'call_control', value: config.hosts.call_control})
                .up();
        }
        if (config.channelLastN !== undefined) {
            elem.c(
                'property',
                { name: 'channelLastN', value: config.channelLastN})
                .up();
        }
        if (config.adaptiveLastN !== undefined) {
            elem.c(
                'property',
                { name: 'adaptiveLastN', value: config.adaptiveLastN})
                .up();
        }
        if (config.adaptiveSimulcast !== undefined) {
            elem.c(
                'property',
                { name: 'adaptiveSimulcast', value: config.adaptiveSimulcast})
                .up();
        }
        if (config.openSctp !== undefined) {
            elem.c(
                'property',
                { name: 'openSctp', value: config.openSctp})
                .up();
        }
        if (config.enableFirefoxSupport !== undefined) {
            elem.c(
                'property',
                { name: 'enableFirefoxHacks',
                    value: config.enableFirefoxSupport})
                .up();
        }
        elem.up();
        return elem;
    },

    parseConfigOptions: function (resultIq) {
    
        Moderator.setFocusUserJid(
            $(resultIq).find('conference').attr('focusjid'));
    
        var extAuthParam
            = $(resultIq).find('>conference>property[name=\'externalAuth\']');
        if (extAuthParam.length) {
            externalAuthEnabled = extAuthParam.attr('value') === 'true';
        }
    
        console.info("External authentication enabled: " + externalAuthEnabled);
    
        // Check if focus has auto-detected Jigasi component(this will be also
        // included if we have passed our host from the config)
        if ($(resultIq).find(
            '>conference>property[name=\'sipGatewayEnabled\']').length) {
            sipGatewayEnabled = true;
        }
    
        console.info("Sip gateway enabled: " + sipGatewayEnabled);
    },

    // FIXME: we need to show the fact that we're waiting for the focus
    // to the user(or that focus is not available)
    allocateConferenceFocus: function (roomName, callback) {
        // Try to use focus user JID from the config
        Moderator.setFocusUserJid(config.focusUserJid);
        // Send create conference IQ
        var iq = Moderator.createConferenceIq(roomName);
        connection.sendIQ(
            iq,
            function (result) {
                if ('true' === $(result).find('conference').attr('ready')) {
                    // Reset both timers
                    getNextTimeout(true);
                    getNextErrorTimeout(true);
                    // Setup config options
                    Moderator.parseConfigOptions(result);
                    // Exec callback
                    callback();
                } else {
                    var waitMs = getNextTimeout();
                    console.info("Waiting for the focus... " + waitMs);
                    // Reset error timeout
                    getNextErrorTimeout(true);
                    window.setTimeout(
                        function () {
                            Moderator.allocateConferenceFocus(
                                roomName, callback);
                        }, waitMs);
                }
            },
            function (error) {
                // Not authorized to create new room
                if ($(error).find('>error>not-authorized').length) {
                    console.warn("Unauthorized to start the conference");
                    UI.onAuthenticationRequired(function () {
                        Moderator.allocateConferenceFocus(roomName, callback);
                    });
                    return;
                }
                var waitMs = getNextErrorTimeout();
                console.error("Focus error, retry after " + waitMs, error);
                // Show message
                UI.messageHandler.notify(
                    'Conference focus', 'disconnected',
                        Moderator.getFocusComponent() +
                        ' not available - retry in ' +
                        (waitMs / 1000) + ' sec');
                // Reset response timeout
                getNextTimeout(true);
                window.setTimeout(
                    function () {
                        Moderator.allocateConferenceFocus(roomName, callback);
                    }, waitMs);
            }
        );
    },

    getAuthUrl: function (roomName, urlCallback) {
        var iq = $iq({to: Moderator.getFocusComponent(), type: 'get'});
        iq.c('auth-url', {
            xmlns: 'http://jitsi.org/protocol/focus',
            room: roomName
        });
        connection.sendIQ(
            iq,
            function (result) {
                var url = $(result).find('auth-url').attr('url');
                if (url) {
                    console.info("Got auth url: " + url);
                    urlCallback(url);
                } else {
                    console.error(
                        "Failed to get auth url fro mthe focus", result);
                }
            },
            function (error) {
                console.error("Get auth url error", error);
            }
        );
    }
};

module.exports = Moderator;




},{}],7:[function(require,module,exports){
/* global $, $iq, config, connection, focusMucJid, messageHandler, Moderator,
   Toolbar, Util */
var Moderator = require("./moderator");


var recordingToken = null;
var recordingEnabled;

/**
 * Whether to use a jirecon component for recording, or use the videobridge
 * through COLIBRI.
 */
var useJirecon = (typeof config.hosts.jirecon != "undefined");

/**
 * The ID of the jirecon recording session. Jirecon generates it when we
 * initially start recording, and it needs to be used in subsequent requests
 * to jirecon.
 */
var jireconRid = null;

function setRecordingToken(token) {
    recordingToken = token;
}

function setRecording(state, token, callback) {
    if (useJirecon){
        this.setRecordingJirecon(state, token, callback);
    } else {
        this.setRecordingColibri(state, token, callback);
    }
}

function setRecordingJirecon(state, token, callback) {
    if (state == recordingEnabled){
        return;
    }

    var iq = $iq({to: config.hosts.jirecon, type: 'set'})
        .c('recording', {xmlns: 'http://jitsi.org/protocol/jirecon',
            action: state ? 'start' : 'stop',
            mucjid: connection.emuc.roomjid});
    if (!state){
        iq.attrs({rid: jireconRid});
    }

    console.log('Start recording');

    connection.sendIQ(
        iq,
        function (result) {
            // TODO wait for an IQ with the real status, since this is
            // provisional?
            jireconRid = $(result).find('recording').attr('rid');
            console.log('Recording ' + (state ? 'started' : 'stopped') +
                '(jirecon)' + result);
            recordingEnabled = state;
            if (!state){
                jireconRid = null;
            }

            callback(state);
        },
        function (error) {
            console.log('Failed to start recording, error: ', error);
            callback(recordingEnabled);
        });
}

// Sends a COLIBRI message which enables or disables (according to 'state')
// the recording on the bridge. Waits for the result IQ and calls 'callback'
// with the new recording state, according to the IQ.
function setRecordingColibri(state, token, callback) {
    var elem = $iq({to: focusMucJid, type: 'set'});
    elem.c('conference', {
        xmlns: 'http://jitsi.org/protocol/colibri'
    });
    elem.c('recording', {state: state, token: token});

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
            callback(recordingEnabled);
        }
    );
}

var Recording = {
    toggleRecording: function (tokenEmptyCallback,
                               startingCallback, startedCallback) {
        if (!Moderator.isModerator()) {
            console.log(
                    'non-focus, or conference not yet organized:' +
                    ' not enabling recording');
            return;
        }

        // Jirecon does not (currently) support a token.
        if (!recordingToken && !useJirecon) {
            tokenEmptyCallback(function (value) {
                setRecordingToken(value);
                this.toggleRecording();
            });

            return;
        }

        var oldState = recordingEnabled;
        startingCallback(!oldState);
        setRecording(!oldState,
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
                startedCallback(state);

            }
        );
    }

}

module.exports = Recording;
},{"./moderator":6}],8:[function(require,module,exports){
/* jshint -W117 */
/* a simple MUC connection plugin
 * can only handle a single MUC room
 */

var bridgeIsDown = false;

var Moderator = require("./moderator");

module.exports = function(XMPP, eventEmitter) {
    Strophe.addConnectionPlugin('emuc', {
        connection: null,
        roomjid: null,
        myroomjid: null,
        members: {},
        list_members: [], // so we can elect a new focus
        presMap: {},
        preziMap: {},
        joined: false,
        isOwner: false,
        role: null,
        init: function (conn) {
            this.connection = conn;
        },
        initPresenceMap: function (myroomjid) {
            this.presMap['to'] = myroomjid;
            this.presMap['xns'] = 'http://jabber.org/protocol/muc';
        },
        doJoin: function (jid, password) {
            this.myroomjid = jid;

            console.info("Joined MUC as " + this.myroomjid);

            this.initPresenceMap(this.myroomjid);

            if (!this.roomjid) {
                this.roomjid = Strophe.getBareJidFromJid(jid);
                // add handlers (just once)
                this.connection.addHandler(this.onPresence.bind(this), null, 'presence', null, null, this.roomjid, {matchBare: true});
                this.connection.addHandler(this.onPresenceUnavailable.bind(this), null, 'presence', 'unavailable', null, this.roomjid, {matchBare: true});
                this.connection.addHandler(this.onPresenceError.bind(this), null, 'presence', 'error', null, this.roomjid, {matchBare: true});
                this.connection.addHandler(this.onMessage.bind(this), null, 'message', null, null, this.roomjid, {matchBare: true});
            }
            if (password !== undefined) {
                this.presMap['password'] = password;
            }
            this.sendPresence();
        },
        doLeave: function () {
            console.log("do leave", this.myroomjid);
            var pres = $pres({to: this.myroomjid, type: 'unavailable' });
            this.presMap.length = 0;
            this.connection.send(pres);
        },
        createNonAnonymousRoom: function () {
            // http://xmpp.org/extensions/xep-0045.html#createroom-reserved

            var getForm = $iq({type: 'get', to: this.roomjid})
                .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'})
                .c('x', {xmlns: 'jabber:x:data', type: 'submit'});

            this.connection.sendIQ(getForm, function (form) {

                if (!$(form).find(
                        '>query>x[xmlns="jabber:x:data"]' +
                        '>field[var="muc#roomconfig_whois"]').length) {

                    console.error('non-anonymous rooms not supported');
                    return;
                }

                var formSubmit = $iq({to: this.roomjid, type: 'set'})
                    .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});

                formSubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});

                formSubmit.c('field', {'var': 'FORM_TYPE'})
                    .c('value')
                    .t('http://jabber.org/protocol/muc#roomconfig').up().up();

                formSubmit.c('field', {'var': 'muc#roomconfig_whois'})
                    .c('value').t('anyone').up().up();

                this.connection.sendIQ(formSubmit);

            }, function (error) {
                console.error("Error getting room configuration form");
            });
        },
        onPresence: function (pres) {
            var from = pres.getAttribute('from');

            // What is this for? A workaround for something?
            if (pres.getAttribute('type')) {
                return true;
            }

            // Parse etherpad tag.
            var etherpad = $(pres).find('>etherpad');
            if (etherpad.length) {
                if (config.etherpad_base && !Moderator.isModerator()) {
                    UI.initEtherpad(etherpad.text());
                }
            }

            // Parse prezi tag.
            var presentation = $(pres).find('>prezi');
            if (presentation.length) {
                var url = presentation.attr('url');
                var current = presentation.find('>current').text();

                console.log('presentation info received from', from, url);

                if (this.preziMap[from] == null) {
                    this.preziMap[from] = url;

                    $(document).trigger('presentationadded.muc', [from, url, current]);
                }
                else {
                    $(document).trigger('gotoslide.muc', [from, url, current]);
                }
            }
            else if (this.preziMap[from] != null) {
                var url = this.preziMap[from];
                delete this.preziMap[from];
                $(document).trigger('presentationremoved.muc', [from, url]);
            }

            // Parse audio info tag.
            var audioMuted = $(pres).find('>audiomuted');
            if (audioMuted.length) {
                $(document).trigger('audiomuted.muc', [from, audioMuted.text()]);
            }

            // Parse video info tag.
            var videoMuted = $(pres).find('>videomuted');
            if (videoMuted.length) {
                $(document).trigger('videomuted.muc', [from, videoMuted.text()]);
            }

            var stats = $(pres).find('>stats');
            if (stats.length) {
                var statsObj = {};
                Strophe.forEachChild(stats[0], "stat", function (el) {
                    statsObj[el.getAttribute("name")] = el.getAttribute("value");
                });
                connectionquality.updateRemoteStats(from, statsObj);
            }

            // Parse status.
            if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="201"]').length) {
                this.isOwner = true;
                this.createNonAnonymousRoom();
            }

            // Parse roles.
            var member = {};
            member.show = $(pres).find('>show').text();
            member.status = $(pres).find('>status').text();
            var tmp = $(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>item');
            member.affiliation = tmp.attr('affiliation');
            member.role = tmp.attr('role');

            // Focus recognition
            member.jid = tmp.attr('jid');
            member.isFocus = false;
            if (member.jid
                && member.jid.indexOf(Moderator.getFocusUserJid() + "/") == 0) {
                member.isFocus = true;
            }

            var nicktag = $(pres).find('>nick[xmlns="http://jabber.org/protocol/nick"]');
            member.displayName = (nicktag.length > 0 ? nicktag.html() : null);

            if (from == this.myroomjid) {
                if (member.affiliation == 'owner') this.isOwner = true;
                if (this.role !== member.role) {
                    this.role = member.role;
                    if (Moderator.onLocalRoleChange)
                        Moderator.onLocalRoleChange(from, member, pres);
                    UI.onLocalRoleChange(from, member, pres);
                }
                if (!this.joined) {
                    this.joined = true;
                    eventEmitter.emit(XMPPEvents.MUC_JOINED, from, member);
                    this.list_members.push(from);
                }
            } else if (this.members[from] === undefined) {
                // new participant
                this.members[from] = member;
                this.list_members.push(from);
                console.log('entered', from, member);
                if (member.isFocus) {
                    focusMucJid = from;
                    console.info("Ignore focus: " + from + ", real JID: " + member.jid);
                }
                else {
                    var id = $(pres).find('>userID').text();
                    var email = $(pres).find('>email');
                    if (email.length > 0) {
                        id = email.text();
                    }
                    UI.onMucEntered(from, id, member.displayName);
                    API.triggerEvent("participantJoined", {jid: from});
                }
            } else {
                // Presence update for existing participant
                // Watch role change:
                if (this.members[from].role != member.role) {
                    this.members[from].role = member.role;
                    UI.onMucRoleChanged(member.role, member.displayName);
                }
            }

            // Always trigger presence to update bindings
            $(document).trigger('presence.muc', [from, member, pres]);
            this.parsePresence(from, member, pres);

            // Trigger status message update
            if (member.status) {
                UI.onMucPresenceStatus(from, member);
            }

            return true;
        },
        onPresenceUnavailable: function (pres) {
            var from = pres.getAttribute('from');
            // Status code 110 indicates that this notification is "self-presence".
            if (!$(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="110"]').length) {
                delete this.members[from];
                this.list_members.splice(this.list_members.indexOf(from), 1);
                this.onParticipantLeft(from);
            }
            // If the status code is 110 this means we're leaving and we would like
            // to remove everyone else from our view, so we trigger the event.
            else if (this.list_members.length > 1) {
                for (var i = 0; i < this.list_members.length; i++) {
                    var member = this.list_members[i];
                    delete this.members[i];
                    this.list_members.splice(i, 1);
                    this.onParticipantLeft(member);
                }
            }
            if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="307"]').length) {
                $(document).trigger('kicked.muc', [from]);
                if (this.myroomjid === from) {
                    XMPP.disposeConference(false);
                    eventEmitter.emit(XMPPEvents.KICKED);
                }
            }
            return true;
        },
        onPresenceError: function (pres) {
            var from = pres.getAttribute('from');
            if ($(pres).find('>error[type="auth"]>not-authorized[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
                console.log('on password required', from);
                var self = this;
                UI.onPasswordReqiured(function (value) {
                    self.doJoin(from, value);
                });
            } else if ($(pres).find(
                '>error[type="cancel"]>not-allowed[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
                var toDomain = Strophe.getDomainFromJid(pres.getAttribute('to'));
                if (toDomain === config.hosts.anonymousdomain) {
                    // we are connected with anonymous domain and only non anonymous users can create rooms
                    // we must authorize the user
                    XMPP.promptLogin();
                } else {
                    console.warn('onPresError ', pres);
                    UI.messageHandler.openReportDialog(null,
                        'Oops! Something went wrong and we couldn`t connect to the conference.',
                        pres);
                }
            } else {
                console.warn('onPresError ', pres);
                UI.messageHandler.openReportDialog(null,
                    'Oops! Something went wrong and we couldn`t connect to the conference.',
                    pres);
            }
            return true;
        },
        sendMessage: function (body, nickname) {
            var msg = $msg({to: this.roomjid, type: 'groupchat'});
            msg.c('body', body).up();
            if (nickname) {
                msg.c('nick', {xmlns: 'http://jabber.org/protocol/nick'}).t(nickname).up().up();
            }
            this.connection.send(msg);
            API.triggerEvent("outgoingMessage", {"message": body});
        },
        setSubject: function (subject) {
            var msg = $msg({to: this.roomjid, type: 'groupchat'});
            msg.c('subject', subject);
            this.connection.send(msg);
            console.log("topic changed to " + subject);
        },
        onMessage: function (msg) {
            // FIXME: this is a hack. but jingle on muc makes nickchanges hard
            var from = msg.getAttribute('from');
            var nick = $(msg).find('>nick[xmlns="http://jabber.org/protocol/nick"]').text() || Strophe.getResourceFromJid(from);

            var txt = $(msg).find('>body').text();
            var type = msg.getAttribute("type");
            if (type == "error") {
                UI.chatAddError($(msg).find('>text').text(), txt);
                return true;
            }

            var subject = $(msg).find('>subject');
            if (subject.length) {
                var subjectText = subject.text();
                if (subjectText || subjectText == "") {
                    UI.chatSetSubject(subjectText);
                    console.log("Subject is changed to " + subjectText);
                }
            }


            if (txt) {
                console.log('chat', nick, txt);
                UI.updateChatConversation(from, nick, txt);
                if (from != this.myroomjid)
                    API.triggerEvent("incomingMessage",
                        {"from": from, "nick": nick, "message": txt});
            }
            return true;
        },
        lockRoom: function (key, onSuccess, onError, onNotSupported) {
            //http://xmpp.org/extensions/xep-0045.html#roomconfig
            var ob = this;
            this.connection.sendIQ($iq({to: this.roomjid, type: 'get'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'}),
                function (res) {
                    if ($(res).find('>query>x[xmlns="jabber:x:data"]>field[var="muc#roomconfig_roomsecret"]').length) {
                        var formsubmit = $iq({to: ob.roomjid, type: 'set'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});
                        formsubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});
                        formsubmit.c('field', {'var': 'FORM_TYPE'}).c('value').t('http://jabber.org/protocol/muc#roomconfig').up().up();
                        formsubmit.c('field', {'var': 'muc#roomconfig_roomsecret'}).c('value').t(key).up().up();
                        // Fixes a bug in prosody 0.9.+ https://code.google.com/p/lxmppd/issues/detail?id=373
                        formsubmit.c('field', {'var': 'muc#roomconfig_whois'}).c('value').t('anyone').up().up();
                        // FIXME: is muc#roomconfig_passwordprotectedroom required?
                        this.connection.sendIQ(formsubmit,
                            onSuccess,
                            onError);
                    } else {
                        onNotSupported();
                    }
                }, onError);
        },
        kick: function (jid) {
            var kickIQ = $iq({to: this.roomjid, type: 'set'})
                .c('query', {xmlns: 'http://jabber.org/protocol/muc#admin'})
                .c('item', {nick: Strophe.getResourceFromJid(jid), role: 'none'})
                .c('reason').t('You have been kicked.').up().up().up();

            this.connection.sendIQ(
                kickIQ,
                function (result) {
                    console.log('Kick participant with jid: ', jid, result);
                },
                function (error) {
                    console.log('Kick participant error: ', error);
                });
        },
        sendPresence: function () {
            var pres = $pres({to: this.presMap['to'] });
            pres.c('x', {xmlns: this.presMap['xns']});

            if (this.presMap['password']) {
                pres.c('password').t(this.presMap['password']).up();
            }

            pres.up();

            // Send XEP-0115 'c' stanza that contains our capabilities info
            if (this.connection.caps) {
                this.connection.caps.node = config.clientNode;
                pres.c('c', this.connection.caps.generateCapsAttrs()).up();
            }

            pres.c('user-agent', {xmlns: 'http://jitsi.org/jitmeet/user-agent'})
                .t(navigator.userAgent).up();

            if (this.presMap['bridgeIsDown']) {
                pres.c('bridgeIsDown').up();
            }

            if (this.presMap['email']) {
                pres.c('email').t(this.presMap['email']).up();
            }

            if (this.presMap['userId']) {
                pres.c('userId').t(this.presMap['userId']).up();
            }

            if (this.presMap['displayName']) {
                // XEP-0172
                pres.c('nick', {xmlns: 'http://jabber.org/protocol/nick'})
                    .t(this.presMap['displayName']).up();
            }

            if (this.presMap['audions']) {
                pres.c('audiomuted', {xmlns: this.presMap['audions']})
                    .t(this.presMap['audiomuted']).up();
            }

            if (this.presMap['videons']) {
                pres.c('videomuted', {xmlns: this.presMap['videons']})
                    .t(this.presMap['videomuted']).up();
            }

            if (this.presMap['statsns']) {
                var stats = pres.c('stats', {xmlns: this.presMap['statsns']});
                for (var stat in this.presMap["stats"])
                    if (this.presMap["stats"][stat] != null)
                        stats.c("stat", {name: stat, value: this.presMap["stats"][stat]}).up();
                pres.up();
            }

            if (this.presMap['prezins']) {
                pres.c('prezi',
                    {xmlns: this.presMap['prezins'],
                        'url': this.presMap['preziurl']})
                    .c('current').t(this.presMap['prezicurrent']).up().up();
            }

            if (this.presMap['etherpadns']) {
                pres.c('etherpad', {xmlns: this.presMap['etherpadns']})
                    .t(this.presMap['etherpadname']).up();
            }

            if (this.presMap['medians']) {
                pres.c('media', {xmlns: this.presMap['medians']});
                var sourceNumber = 0;
                Object.keys(this.presMap).forEach(function (key) {
                    if (key.indexOf('source') >= 0) {
                        sourceNumber++;
                    }
                });
                if (sourceNumber > 0)
                    for (var i = 1; i <= sourceNumber / 3; i++) {
                        pres.c('source',
                            {type: this.presMap['source' + i + '_type'],
                                ssrc: this.presMap['source' + i + '_ssrc'],
                                direction: this.presMap['source' + i + '_direction']
                                    || 'sendrecv' }
                        ).up();
                    }
            }

            pres.up();
//        console.debug(pres.toString());
            this.connection.send(pres);
        },
        addDisplayNameToPresence: function (displayName) {
            this.presMap['displayName'] = displayName;
        },
        addMediaToPresence: function (sourceNumber, mtype, ssrcs, direction) {
            if (!this.presMap['medians'])
                this.presMap['medians'] = 'http://estos.de/ns/mjs';

            this.presMap['source' + sourceNumber + '_type'] = mtype;
            this.presMap['source' + sourceNumber + '_ssrc'] = ssrcs;
            this.presMap['source' + sourceNumber + '_direction'] = direction;
        },
        clearPresenceMedia: function () {
            var self = this;
            Object.keys(this.presMap).forEach(function (key) {
                if (key.indexOf('source') != -1) {
                    delete self.presMap[key];
                }
            });
        },
        addPreziToPresence: function (url, currentSlide) {
            this.presMap['prezins'] = 'http://jitsi.org/jitmeet/prezi';
            this.presMap['preziurl'] = url;
            this.presMap['prezicurrent'] = currentSlide;
        },
        removePreziFromPresence: function () {
            delete this.presMap['prezins'];
            delete this.presMap['preziurl'];
            delete this.presMap['prezicurrent'];
        },
        addCurrentSlideToPresence: function (currentSlide) {
            this.presMap['prezicurrent'] = currentSlide;
        },
        getPrezi: function (roomjid) {
            return this.preziMap[roomjid];
        },
        addEtherpadToPresence: function (etherpadName) {
            this.presMap['etherpadns'] = 'http://jitsi.org/jitmeet/etherpad';
            this.presMap['etherpadname'] = etherpadName;
        },
        addAudioInfoToPresence: function (isMuted) {
            this.presMap['audions'] = 'http://jitsi.org/jitmeet/audio';
            this.presMap['audiomuted'] = isMuted.toString();
        },
        addVideoInfoToPresence: function (isMuted) {
            this.presMap['videons'] = 'http://jitsi.org/jitmeet/video';
            this.presMap['videomuted'] = isMuted.toString();
        },
        addConnectionInfoToPresence: function (stats) {
            this.presMap['statsns'] = 'http://jitsi.org/jitmeet/stats';
            this.presMap['stats'] = stats;
        },
        findJidFromResource: function (resourceJid) {
            if (resourceJid &&
                resourceJid === Strophe.getResourceFromJid(this.myroomjid)) {
                return this.myroomjid;
            }
            var peerJid = null;
            Object.keys(this.members).some(function (jid) {
                peerJid = jid;
                return Strophe.getResourceFromJid(jid) === resourceJid;
            });
            return peerJid;
        },
        addBridgeIsDownToPresence: function () {
            this.presMap['bridgeIsDown'] = true;
        },
        addEmailToPresence: function (email) {
            this.presMap['email'] = email;
        },
        addUserIdToPresence: function (userId) {
            this.presMap['userId'] = userId;
        },
        isModerator: function () {
            return this.role === 'moderator';
        },
        getMemberRole: function (peerJid) {
            if (this.members[peerJid]) {
                return this.members[peerJid].role;
            }
            return null;
        },
        onParticipantLeft: function (jid) {
            UI.onMucLeft(jid);

            API.triggerEvent("participantLeft", {jid: jid});

            delete jid2Ssrc[jid];

            this.connection.jingle.terminateByJid(jid);

            if (this.getPrezi(jid)) {
                $(document).trigger('presentationremoved.muc',
                    [jid, this.getPrezi(jid)]);
            }

            Moderator.onMucLeft(jid);
        },
        parsePresence: function (from, memeber, pres) {
            if($(pres).find(">bridgeIsDown").length > 0 && !bridgeIsDown) {
                bridgeIsDown = true;
                eventEmitter.emit(XMPPEvents.BRIDGE_DOWN);
            }

            if(memeber.isFocus)
                return;

            // Remove old ssrcs coming from the jid
            Object.keys(ssrc2jid).forEach(function (ssrc) {
                if (ssrc2jid[ssrc] == jid) {
                    delete ssrc2jid[ssrc];
                    delete ssrc2videoType[ssrc];
                }
            });

            var changedStreams = [];
            $(pres).find('>media[xmlns="http://estos.de/ns/mjs"]>source').each(function (idx, ssrc) {
                //console.log(jid, 'assoc ssrc', ssrc.getAttribute('type'), ssrc.getAttribute('ssrc'));
                var ssrcV = ssrc.getAttribute('ssrc');
                ssrc2jid[ssrcV] = from;
                notReceivedSSRCs.push(ssrcV);

                var type = ssrc.getAttribute('type');
                ssrc2videoType[ssrcV] = type;

                var direction = ssrc.getAttribute('direction');

                changedStreams.push({type: type, direction: direction});

            });

            eventEmitter.emit(XMPPEvents.CHANGED_STREAMS, from, changedStreams);

            var displayName = !config.displayJids
                ? memeber.displayName : Strophe.getResourceFromJid(from);

            if (displayName && displayName.length > 0)
            {
//                $(document).trigger('displaynamechanged',
//                    [jid, displayName]);
                eventEmitter.emit(XMPPEvents.DISPLAY_NAME_CHANGED, from, displayName);
            }


            var id = $(pres).find('>userID').text();
            var email = $(pres).find('>email');
            if(email.length > 0) {
                id = email.text();
            }

            eventEmitter.emit(XMPPEvents.USER_ID_CHANGED, from, id);
        }
    });
};


},{"./moderator":6}],9:[function(require,module,exports){
/* jshint -W117 */

var JingleSession = require("./JingleSession");

function CallIncomingJingle(sid, connection) {
    var sess = connection.jingle.sessions[sid];

    // TODO: do we check activecall == null?
    activecall = sess;

    statistics.onConferenceCreated(sess);
    RTC.onConferenceCreated(sess);

    // TODO: check affiliation and/or role
    console.log('emuc data for', sess.peerjid, connection.emuc.members[sess.peerjid]);
    sess.usedrip = true; // not-so-naive trickle ice
    sess.sendAnswer();
    sess.accept();

};

module.exports = function(XMPP)
{
    Strophe.addConnectionPlugin('jingle', {
        connection: null,
        sessions: {},
        jid2session: {},
        ice_config: {iceServers: []},
        pc_constraints: {},
        media_constraints: {
            mandatory: {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true
            }
            // MozDontOfferDataChannel: true when this is firefox
        },
        init: function (conn) {
            this.connection = conn;
            if (this.connection.disco) {
                // http://xmpp.org/extensions/xep-0167.html#support
                // http://xmpp.org/extensions/xep-0176.html#support
                this.connection.disco.addFeature('urn:xmpp:jingle:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:transports:ice-udp:1');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:audio');
                this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:video');


                // this is dealt with by SDP O/A so we don't need to annouce this
                //this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:rtcp-fb:0'); // XEP-0293
                //this.connection.disco.addFeature('urn:xmpp:jingle:apps:rtp:rtp-hdrext:0'); // XEP-0294
                if (config.useRtcpMux) {
                    this.connection.disco.addFeature('urn:ietf:rfc:5761'); // rtcp-mux
                }
                if (config.useBundle) {
                    this.connection.disco.addFeature('urn:ietf:rfc:5888'); // a=group, e.g. bundle
                }
                //this.connection.disco.addFeature('urn:ietf:rfc:5576'); // a=ssrc
            }
            this.connection.addHandler(this.onJingle.bind(this), 'urn:xmpp:jingle:1', 'iq', 'set', null, null);
        },
        onJingle: function (iq) {
            var sid = $(iq).find('jingle').attr('sid');
            var action = $(iq).find('jingle').attr('action');
            var fromJid = iq.getAttribute('from');
            // send ack first
            var ack = $iq({type: 'result',
                to: fromJid,
                id: iq.getAttribute('id')
            });
            console.log('on jingle ' + action + ' from ' + fromJid, iq);
            var sess = this.sessions[sid];
            if ('session-initiate' != action) {
                if (sess === null) {
                    ack.type = 'error';
                    ack.c('error', {type: 'cancel'})
                        .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                        .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                    this.connection.send(ack);
                    return true;
                }
                // compare from to sess.peerjid (bare jid comparison for later compat with message-mode)
                // local jid is not checked
                if (Strophe.getBareJidFromJid(fromJid) != Strophe.getBareJidFromJid(sess.peerjid)) {
                    console.warn('jid mismatch for session id', sid, fromJid, sess.peerjid);
                    ack.type = 'error';
                    ack.c('error', {type: 'cancel'})
                        .c('item-not-found', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up()
                        .c('unknown-session', {xmlns: 'urn:xmpp:jingle:errors:1'});
                    this.connection.send(ack);
                    return true;
                }
            } else if (sess !== undefined) {
                // existing session with same session id
                // this might be out-of-order if the sess.peerjid is the same as from
                ack.type = 'error';
                ack.c('error', {type: 'cancel'})
                    .c('service-unavailable', {xmlns: 'urn:ietf:params:xml:ns:xmpp-stanzas'}).up();
                console.warn('duplicate session id', sid);
                this.connection.send(ack);
                return true;
            }
            // FIXME: check for a defined action
            this.connection.send(ack);
            // see http://xmpp.org/extensions/xep-0166.html#concepts-session
            switch (action) {
                case 'session-initiate':
                    sess = new JingleSession(
                        $(iq).attr('to'), $(iq).find('jingle').attr('sid'),
                        this.connection, XMPP);
                    // configure session

                    sess.media_constraints = this.media_constraints;
                    sess.pc_constraints = this.pc_constraints;
                    sess.ice_config = this.ice_config;

                    sess.initiate(fromJid, false);
                    // FIXME: setRemoteDescription should only be done when this call is to be accepted
                    sess.setRemoteDescription($(iq).find('>jingle'), 'offer');

                    this.sessions[sess.sid] = sess;
                    this.jid2session[sess.peerjid] = sess;

                    // the callback should either
                    // .sendAnswer and .accept
                    // or .sendTerminate -- not necessarily synchronus
                    CallIncomingJingle(sess.sid, this.connection);
                    break;
                case 'session-accept':
                    sess.setRemoteDescription($(iq).find('>jingle'), 'answer');
                    sess.accept();
                    $(document).trigger('callaccepted.jingle', [sess.sid]);
                    break;
                case 'session-terminate':
                    // If this is not the focus sending the terminate, we have
                    // nothing more to do here.
                    if (Object.keys(this.sessions).length < 1
                        || !(this.sessions[Object.keys(this.sessions)[0]]
                            instanceof JingleSession))
                    {
                        break;
                    }
                    console.log('terminating...', sess.sid);
                    sess.terminate();
                    this.terminate(sess.sid);
                    if ($(iq).find('>jingle>reason').length) {
                        $(document).trigger('callterminated.jingle', [
                            sess.sid,
                            sess.peerjid,
                            $(iq).find('>jingle>reason>:first')[0].tagName,
                            $(iq).find('>jingle>reason>text').text()
                        ]);
                    } else {
                        $(document).trigger('callterminated.jingle',
                            [sess.sid, sess.peerjid]);
                    }
                    break;
                case 'transport-info':
                    sess.addIceCandidate($(iq).find('>jingle>content'));
                    break;
                case 'session-info':
                    var affected;
                    if ($(iq).find('>jingle>ringing[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        $(document).trigger('ringing.jingle', [sess.sid]);
                    } else if ($(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        affected = $(iq).find('>jingle>mute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                        $(document).trigger('mute.jingle', [sess.sid, affected]);
                    } else if ($(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').length) {
                        affected = $(iq).find('>jingle>unmute[xmlns="urn:xmpp:jingle:apps:rtp:info:1"]').attr('name');
                        $(document).trigger('unmute.jingle', [sess.sid, affected]);
                    }
                    break;
                case 'addsource': // FIXME: proprietary, un-jingleish
                case 'source-add': // FIXME: proprietary
                    sess.addSource($(iq).find('>jingle>content'), fromJid);
                    break;
                case 'removesource': // FIXME: proprietary, un-jingleish
                case 'source-remove': // FIXME: proprietary
                    sess.removeSource($(iq).find('>jingle>content'), fromJid);
                    break;
                default:
                    console.warn('jingle action not implemented', action);
                    break;
            }
            return true;
        },
        initiate: function (peerjid, myjid) { // initiate a new jinglesession to peerjid
            var sess = new JingleSession(myjid || this.connection.jid,
                Math.random().toString(36).substr(2, 12), // random string
                this.connection, XMPP);
            // configure session

            sess.media_constraints = this.media_constraints;
            sess.pc_constraints = this.pc_constraints;
            sess.ice_config = this.ice_config;

            sess.initiate(peerjid, true);
            this.sessions[sess.sid] = sess;
            this.jid2session[sess.peerjid] = sess;
            sess.sendOffer();
            return sess;
        },
        terminate: function (sid, reason, text) { // terminate by sessionid (or all sessions)
            if (sid === null || sid === undefined) {
                for (sid in this.sessions) {
                    if (this.sessions[sid].state != 'ended') {
                        this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                        this.sessions[sid].terminate();
                    }
                    delete this.jid2session[this.sessions[sid].peerjid];
                    delete this.sessions[sid];
                }
            } else if (this.sessions.hasOwnProperty(sid)) {
                if (this.sessions[sid].state != 'ended') {
                    this.sessions[sid].sendTerminate(reason || (!this.sessions[sid].active()) ? 'cancel' : null, text);
                    this.sessions[sid].terminate();
                }
                delete this.jid2session[this.sessions[sid].peerjid];
                delete this.sessions[sid];
            }
        },
        // Used to terminate a session when an unavailable presence is received.
        terminateByJid: function (jid) {
            if (this.jid2session.hasOwnProperty(jid)) {
                var sess = this.jid2session[jid];
                if (sess) {
                    sess.terminate();
                    console.log('peer went away silently', jid);
                    delete this.sessions[sess.sid];
                    delete this.jid2session[jid];
                    $(document).trigger('callterminated.jingle',
                        [sess.sid, jid], 'gone');
                }
            }
        },
        terminateRemoteByJid: function (jid, reason) {
            if (this.jid2session.hasOwnProperty(jid)) {
                var sess = this.jid2session[jid];
                if (sess) {
                    sess.sendTerminate(reason || (!sess.active()) ? 'kick' : null);
                    sess.terminate();
                    console.log('terminate peer with jid', sess.sid, jid);
                    delete this.sessions[sess.sid];
                    delete this.jid2session[jid];
                    $(document).trigger('callterminated.jingle',
                        [sess.sid, jid, 'kicked']);
                }
            }
        },
        getStunAndTurnCredentials: function () {
            // get stun and turn configuration from server via xep-0215
            // uses time-limited credentials as described in
            // http://tools.ietf.org/html/draft-uberti-behave-turn-rest-00
            //
            // see https://code.google.com/p/prosody-modules/source/browse/mod_turncredentials/mod_turncredentials.lua
            // for a prosody module which implements this
            //
            // currently, this doesn't work with updateIce and therefore credentials with a long
            // validity have to be fetched before creating the peerconnection
            // TODO: implement refresh via updateIce as described in
            //      https://code.google.com/p/webrtc/issues/detail?id=1650
            var self = this;
            this.connection.sendIQ(
                $iq({type: 'get', to: this.connection.domain})
                    .c('services', {xmlns: 'urn:xmpp:extdisco:1'}).c('service', {host: 'turn.' + this.connection.domain}),
                function (res) {
                    var iceservers = [];
                    $(res).find('>services>service').each(function (idx, el) {
                        el = $(el);
                        var dict = {};
                        var type = el.attr('type');
                        switch (type) {
                            case 'stun':
                                dict.url = 'stun:' + el.attr('host');
                                if (el.attr('port')) {
                                    dict.url += ':' + el.attr('port');
                                }
                                iceservers.push(dict);
                                break;
                            case 'turn':
                            case 'turns':
                                dict.url = type + ':';
                                if (el.attr('username')) { // https://code.google.com/p/webrtc/issues/detail?id=1508
                                    if (navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./) && parseInt(navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2], 10) < 28) {
                                        dict.url += el.attr('username') + '@';
                                    } else {
                                        dict.username = el.attr('username'); // only works in M28
                                    }
                                }
                                dict.url += el.attr('host');
                                if (el.attr('port') && el.attr('port') != '3478') {
                                    dict.url += ':' + el.attr('port');
                                }
                                if (el.attr('transport') && el.attr('transport') != 'udp') {
                                    dict.url += '?transport=' + el.attr('transport');
                                }
                                if (el.attr('password')) {
                                    dict.credential = el.attr('password');
                                }
                                iceservers.push(dict);
                                break;
                        }
                    });
                    self.ice_config.iceServers = iceservers;
                },
                function (err) {
                    console.warn('getting turn credentials failed', err);
                    console.warn('is mod_turncredentials or similar installed?');
                }
            );
            // implement push?
        },

        /**
         * Populates the log data
         */
        populateData: function () {
            var data = {};
            Object.keys(this.sessions).forEach(function (sid) {
                var session = this.sessions[sid];
                if (session.peerconnection && session.peerconnection.updateLog) {
                    // FIXME: should probably be a .dump call
                    data["jingle_" + session.sid] = {
                        updateLog: session.peerconnection.updateLog,
                        stats: session.peerconnection.stats,
                        url: window.location.href
                    };
                }
            });
            return data;
        }
    });
};


},{"./JingleSession":1}],10:[function(require,module,exports){
/* global Strophe */
module.exports = function () {

    Strophe.addConnectionPlugin('logger', {
        // logs raw stanzas and makes them available for download as JSON
        connection: null,
        log: [],
        init: function (conn) {
            this.connection = conn;
            this.connection.rawInput = this.log_incoming.bind(this);
            this.connection.rawOutput = this.log_outgoing.bind(this);
        },
        log_incoming: function (stanza) {
            this.log.push([new Date().getTime(), 'incoming', stanza]);
        },
        log_outgoing: function (stanza) {
            this.log.push([new Date().getTime(), 'outgoing', stanza]);
        }
    });
};
},{}],11:[function(require,module,exports){
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
            var iqToFocus = $iq({to: focusMucJid, type: 'set'})
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
            if (from !== focusMucJid) {
                console.warn("Ignored mute from non focus peer");
                return false;
            }
            var mute = $(iq).find('mute');
            if (mute.length) {
                var doMuteAudio = mute.text() === "true";
                UI.setAudioMuted(doMuteAudio);
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
},{}],12:[function(require,module,exports){
/* jshint -W117 */
module.exports = function() {
    Strophe.addConnectionPlugin('rayo',
        {
            RAYO_XMLNS: 'urn:xmpp:rayo:1',
            connection: null,
            init: function (conn) {
                this.connection = conn;
                if (this.connection.disco) {
                    this.connection.disco.addFeature('urn:xmpp:rayo:client:1');
                }

                this.connection.addHandler(
                    this.onRayo.bind(this), this.RAYO_XMLNS, 'iq', 'set', null, null);
            },
            onRayo: function (iq) {
                console.info("Rayo IQ", iq);
            },
            dial: function (to, from, roomName, roomPass) {
                var self = this;
                var req = $iq(
                    {
                        type: 'set',
                        to: focusMucJid
                    }
                );
                req.c('dial',
                    {
                        xmlns: this.RAYO_XMLNS,
                        to: to,
                        from: from
                    });
                req.c('header',
                    {
                        name: 'JvbRoomName',
                        value: roomName
                    }).up();

                if (roomPass !== null && roomPass.length) {

                    req.c('header',
                        {
                            name: 'JvbRoomPassword',
                            value: roomPass
                        }).up();
                }

                this.connection.sendIQ(
                    req,
                    function (result) {
                        console.info('Dial result ', result);

                        var resource = $(result).find('ref').attr('uri');
                        this.call_resource = resource.substr('xmpp:'.length);
                        console.info(
                                "Received call resource: " + this.call_resource);
                    },
                    function (error) {
                        console.info('Dial error ', error);
                    }
                );
            },
            hang_up: function () {
                if (!this.call_resource) {
                    console.warn("No call in progress");
                    return;
                }

                var self = this;
                var req = $iq(
                    {
                        type: 'set',
                        to: this.call_resource
                    }
                );
                req.c('hangup',
                    {
                        xmlns: this.RAYO_XMLNS
                    });

                this.connection.sendIQ(
                    req,
                    function (result) {
                        console.info('Hangup result ', result);
                        self.call_resource = null;
                    },
                    function (error) {
                        console.info('Hangup error ', error);
                        self.call_resource = null;
                    }
                );
            }
        }
    );
};

},{}],13:[function(require,module,exports){
/**
 * Strophe logger implementation. Logs from level WARN and above.
 */
module.exports = function () {

    Strophe.log = function (level, msg) {
        switch (level) {
            case Strophe.LogLevel.WARN:
                console.warn("Strophe: " + msg);
                break;
            case Strophe.LogLevel.ERROR:
            case Strophe.LogLevel.FATAL:
                console.error("Strophe: " + msg);
                break;
        }
    };

    Strophe.getStatusString = function (status) {
        switch (status) {
            case Strophe.Status.ERROR:
                return "ERROR";
            case Strophe.Status.CONNECTING:
                return "CONNECTING";
            case Strophe.Status.CONNFAIL:
                return "CONNFAIL";
            case Strophe.Status.AUTHENTICATING:
                return "AUTHENTICATING";
            case Strophe.Status.AUTHFAIL:
                return "AUTHFAIL";
            case Strophe.Status.CONNECTED:
                return "CONNECTED";
            case Strophe.Status.DISCONNECTED:
                return "DISCONNECTED";
            case Strophe.Status.DISCONNECTING:
                return "DISCONNECTING";
            case Strophe.Status.ATTACHED:
                return "ATTACHED";
            default:
                return "unknown";
        }
    };
};

},{}],14:[function(require,module,exports){
var Moderator = require("./moderator");
var EventEmitter = require("events");
var Recording = require("./recording");
var SDP = require("./SDP");

var eventEmitter = new EventEmitter();
var connection = null;
var authenticatedUser = false;
var activecall = null;

function connect(jid, password, uiCredentials) {
    var bosh
        = uiCredentials.bosh || config.bosh || '/http-bind';
    connection = new Strophe.Connection(bosh);
    Moderator.setConnection(connection);

    var settings = UI.getSettings();
    var email = settings.email;
    var displayName = settings.displayName;
    if(email) {
        connection.emuc.addEmailToPresence(email);
    } else {
        connection.emuc.addUserIdToPresence(settings.uid);
    }
    if(displayName) {
        connection.emuc.addDisplayNameToPresence(displayName);
    }

    if (connection.disco) {
        // for chrome, add multistream cap
    }
    connection.jingle.pc_constraints = RTC.getPCConstraints();
    if (config.useIPv6) {
        // https://code.google.com/p/webrtc/issues/detail?id=2828
        if (!connection.jingle.pc_constraints.optional)
            connection.jingle.pc_constraints.optional = [];
        connection.jingle.pc_constraints.optional.push({googIPv6: true});
    }

    if(!password)
        password = uiCredentials.password;

    var anonymousConnectionFailed = false;
    connection.connect(jid, password, function (status, msg) {
        console.log('Strophe status changed to',
            Strophe.getStatusString(status));
        if (status === Strophe.Status.CONNECTED) {
            if (config.useStunTurn) {
                connection.jingle.getStunAndTurnCredentials();
            }
            UI.disableConnect();

            console.info("My Jabber ID: " + connection.jid);

            if(password)
                authenticatedUser = true;
            maybeDoJoin();
        } else if (status === Strophe.Status.CONNFAIL) {
            if(msg === 'x-strophe-bad-non-anon-jid') {
                anonymousConnectionFailed = true;
            }
        } else if (status === Strophe.Status.DISCONNECTED) {
            if(anonymousConnectionFailed) {
                // prompt user for username and password
                XMPP.promptLogin();
            }
        } else if (status === Strophe.Status.AUTHFAIL) {
            // wrong password or username, prompt user
            XMPP.promptLogin();

        }
    });
}



function maybeDoJoin() {
    if (connection && connection.connected &&
        Strophe.getResourceFromJid(connection.jid)
        && (RTC.localAudio || RTC.localVideo)) {
        // .connected is true while connecting?
        doJoin();
    }
}

function doJoin() {
    var roomName = UI.generateRoomName();

    Moderator.allocateConferenceFocus(
        roomName, UI.checkForNicknameAndJoin);
}

function initStrophePlugins()
{
    require("./strophe.emuc")(XMPP, eventEmitter);
    require("./strophe.jingle")();
    require("./strophe.moderate")(XMPP);
    require("./strophe.util")();
    require("./strophe.rayo")();
    require("./strophe.logger")();
}

function registerListeners() {
    RTC.addStreamListener(maybeDoJoin,
        StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
}

function setupEvents() {
    $(window).bind('beforeunload', function () {
        if (connection && connection.connected) {
            // ensure signout
            $.ajax({
                type: 'POST',
                url: config.bosh,
                async: false,
                cache: false,
                contentType: 'application/xml',
                data: "<body rid='" + (connection.rid || connection._proto.rid)
                    + "' xmlns='http://jabber.org/protocol/httpbind' sid='"
                    + (connection.sid || connection._proto.sid)
                    + "' type='terminate'>" +
                    "<presence xmlns='jabber:client' type='unavailable'/>" +
                    "</body>",
                success: function (data) {
                    console.log('signed out');
                    console.log(data);
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    console.log('signout error',
                            textStatus + ' (' + errorThrown + ')');
                }
            });
        }
        XMPP.disposeConference(true);
    });
}

var XMPP = {
    sessionTerminated: false,
    /**
     * Remembers if we were muted by the focus.
     * @type {boolean}
     */
    forceMuted: false,
    start: function (uiCredentials) {
        setupEvents();
        initStrophePlugins();
        registerListeners();
        Moderator.init();
        var jid = uiCredentials.jid ||
            config.hosts.anonymousdomain ||
            config.hosts.domain ||
            window.location.hostname;
        connect(jid, null, uiCredentials);
    },
    promptLogin: function () {
        UI.showLoginPopup(connect);
    },
    joinRooom: function(roomName, useNicks, nick)
    {
        var roomjid;
        roomjid = roomName;

        if (useNicks) {
            if (nick) {
                roomjid += '/' + nick;
            } else {
                roomjid += '/' + Strophe.getNodeFromJid(connection.jid);
            }
        } else {

            var tmpJid = Strophe.getNodeFromJid(connection.jid);

            if(!authenticatedUser)
                tmpJid = tmpJid.substr(0, 8);

            roomjid += '/' + tmpJid;
        }
        connection.emuc.doJoin(roomjid);
    },
    myJid: function () {
        if(!connection)
            return null;
        return connection.emuc.myroomjid;
    },
    myResource: function () {
        if(!connection || ! connection.emuc.myroomjid)
            return null;
        return Strophe.getResourceFromJid(connection.emuc.myroomjid);
    },
    disposeConference: function (onUnload) {
        eventEmitter.emit(XMPPEvents.DISPOSE_CONFERENCE, onUnload);
        var handler = activecall;
        if (handler && handler.peerconnection) {
            // FIXME: probably removing streams is not required and close() should
            // be enough
            if (RTC.localAudio) {
                handler.peerconnection.removeStream(RTC.localAudio.getOriginalStream(), onUnload);
            }
            if (RTC.localVideo) {
                handler.peerconnection.removeStream(RTC.localVideo.getOriginalStream(), onUnload);
            }
            handler.peerconnection.close();
        }
        activecall = null;
        if(!onUnload)
        {
            this.sessionTerminated = true;
            connection.emuc.doLeave();
        }
    },
    addListener: function(type, listener)
    {
        eventEmitter.on(type, listener);
    },
    removeListener: function (type, listener) {
        eventEmitter.removeListener(type, listener);
    },
    allocateConferenceFocus: function(roomName, callback) {
        Moderator.allocateConferenceFocus(roomName, callback);
    },
    isModerator: function () {
        return Moderator.isModerator();
    },
    isSipGatewayEnabled: function () {
        return Moderator.isSipGatewayEnabled();
    },
    isExternalAuthEnabled: function () {
        return Moderator.isExternalAuthEnabled();
    },
    switchStreams: function (stream, oldStream, callback) {
        if (activecall) {
            // FIXME: will block switchInProgress on true value in case of exception
            activecall.switchStreams(stream, oldStream, callback);
        } else {
            // We are done immediately
            console.error("No conference handler");
            UI.messageHandler.showError('Error',
                'Unable to switch video stream.');
            callback();
        }
    },
    setVideoMute: function (mute, callback, options) {
       if(activecall && connection && RTC.localVideo)
       {
           activecall.setVideoMute(mute, callback, options);
       }
    },
    setAudioMute: function (mute, callback) {
        if (!(connection && RTC.localAudio)) {
            return false;
        }


        if (this.forceMuted && !mute) {
            console.info("Asking focus for unmute");
            connection.moderate.setMute(connection.emuc.myroomjid, mute);
            // FIXME: wait for result before resetting muted status
            this.forceMuted = false;
        }

        if (mute == RTC.localAudio.isMuted()) {
            // Nothing to do
            return true;
        }

        // It is not clear what is the right way to handle multiple tracks.
        // So at least make sure that they are all muted or all unmuted and
        // that we send presence just once.
        RTC.localAudio.mute();
        // isMuted is the opposite of audioEnabled
        connection.emuc.addAudioInfoToPresence(mute);
        connection.emuc.sendPresence();
        callback();
        return true;
    },
    // Really mute video, i.e. dont even send black frames
    muteVideo: function (pc, unmute) {
        // FIXME: this probably needs another of those lovely state safeguards...
        // which checks for iceconn == connected and sigstate == stable
        pc.setRemoteDescription(pc.remoteDescription,
            function () {
                pc.createAnswer(
                    function (answer) {
                        var sdp = new SDP(answer.sdp);
                        if (sdp.media.length > 1) {
                            if (unmute)
                                sdp.media[1] = sdp.media[1].replace('a=recvonly', 'a=sendrecv');
                            else
                                sdp.media[1] = sdp.media[1].replace('a=sendrecv', 'a=recvonly');
                            sdp.raw = sdp.session + sdp.media.join('');
                            answer.sdp = sdp.raw;
                        }
                        pc.setLocalDescription(answer,
                            function () {
                                console.log('mute SLD ok');
                            },
                            function (error) {
                                console.log('mute SLD error');
                                UI.messageHandler.showError('Error',
                                        'Oops! Something went wrong and we failed to ' +
                                        'mute! (SLD Failure)');
                            }
                        );
                    },
                    function (error) {
                        console.log(error);
                        UI.messageHandler.showError();
                    }
                );
            },
            function (error) {
                console.log('muteVideo SRD error');
                UI.messageHandler.showError('Error',
                        'Oops! Something went wrong and we failed to stop video!' +
                        '(SRD Failure)');

            }
        );
    },
    toggleRecording: function (tokenEmptyCallback,
                               startingCallback, startedCallback) {
        Recording.toggleRecording(tokenEmptyCallback,
            startingCallback, startedCallback);
    },
    addToPresence: function (name, value, dontSend) {
        switch (name)
        {
            case "displayName":
                connection.emuc.addDisplayNameToPresence(value);
                break;
            case "etherpad":
                connection.emuc.addEtherpadToPresence(value);
                break;
            case "prezi":
                connection.emuc.addPreziToPresence(value, 0);
                break;
            case "preziSlide":
                connection.emuc.addCurrentSlideToPresence(value);
                break;
            case "connectionQuality":
                connection.emuc.addConnectionInfoToPresence(value);
                break;
            case "email":
                connection.emuc.addEmailToPresence(value);
            default :
                console.log("Unknown tag for presence.");
                return;
        }
        if(!dontSend)
            connection.emuc.sendPresence();
    },
    sendLogs: function (content) {
        // XEP-0337-ish
        var message = $msg({to: focusMucJid, type: 'normal'});
        message.c('log', { xmlns: 'urn:xmpp:eventlog',
            id: 'PeerConnectionStats'});
        message.c('message').t(content).up();
        if (deflate) {
            message.c('tag', {name: "deflated", value: "true"}).up();
        }
        message.up();

        connection.send(message);
    },
    populateData: function () {
        var data = {};
        if (connection.jingle) {
            data = connection.jingle.populateData();
        }
        return data;
    },
    getLogger: function () {
        if(connection.logger)
            return connection.logger.log;
        return null;
    },
    getPrezi: function () {
        return connection.emuc.getPrezi(this.myJid());
    },
    removePreziFromPresence: function () {
        connection.emuc.removePreziFromPresence();
        connection.emuc.sendPresence();
    },
    sendChatMessage: function (message, nickname) {
        connection.emuc.sendMessage(message, nickname);
    },
    setSubject: function (topic) {
        connection.emuc.setSubject(topic);
    },
    lockRoom: function (key, onSuccess, onError, onNotSupported) {
        connection.emuc.lockRoom(key, onSuccess, onError, onNotSupported);
    },
    dial: function (to, from, roomName,roomPass) {
        connection.rayo.dial(to, from, roomName,roomPass);
    },
    setMute: function (jid, mute) {
        connection.moderate.setMute(jid, mute);
    },
    eject: function (jid) {
        connection.moderate.eject(jid);
    },
    findJidFromResource: function (resource) {
        connection.emuc.findJidFromResource(resource);
    },
    getMembers: function () {
        return connection.emuc.members;
    }

};

module.exports = XMPP;
},{"./SDP":2,"./moderator":6,"./recording":7,"./strophe.emuc":8,"./strophe.jingle":9,"./strophe.logger":10,"./strophe.moderate":11,"./strophe.rayo":12,"./strophe.util":13,"events":15}],15:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        throw TypeError('Uncaught, unspecified "error" event.');
      }
      return false;
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[14])(14)
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi91c3IvbG9jYWwvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3htcHAvSmluZ2xlU2Vzc2lvbi5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMveG1wcC9TRFAuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3htcHAvU0RQRGlmZmVyLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy94bXBwL1NEUFV0aWwuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3htcHAvVHJhY2VhYmxlUGVlckNvbm5lY3Rpb24uanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3htcHAvbW9kZXJhdG9yLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy94bXBwL3JlY29yZGluZy5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMveG1wcC9zdHJvcGhlLmVtdWMuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3htcHAvc3Ryb3BoZS5qaW5nbGUuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3htcHAvc3Ryb3BoZS5sb2dnZXIuanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3htcHAvc3Ryb3BoZS5tb2RlcmF0ZS5qcyIsIi9Vc2Vycy9ocmlzdG8vRG9jdW1lbnRzL3dvcmtzcGFjZS9qaXRzaS1tZWV0L21vZHVsZXMveG1wcC9zdHJvcGhlLnJheW8uanMiLCIvVXNlcnMvaHJpc3RvL0RvY3VtZW50cy93b3Jrc3BhY2Uvaml0c2ktbWVldC9tb2R1bGVzL3htcHAvc3Ryb3BoZS51dGlsLmpzIiwiL1VzZXJzL2hyaXN0by9Eb2N1bWVudHMvd29ya3NwYWNlL2ppdHNpLW1lZXQvbW9kdWxlcy94bXBwL3htcHAuanMiLCIvdXNyL2xvY2FsL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1MkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1bUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNVZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoganNoaW50IC1XMTE3ICovXG52YXIgVHJhY2VhYmxlUGVlckNvbm5lY3Rpb24gPSByZXF1aXJlKFwiLi9UcmFjZWFibGVQZWVyQ29ubmVjdGlvblwiKTtcbnZhciBTRFBEaWZmZXIgPSByZXF1aXJlKFwiLi9TRFBEaWZmZXJcIik7XG52YXIgU0RQVXRpbCA9IHJlcXVpcmUoXCIuL1NEUFV0aWxcIik7XG52YXIgU0RQID0gcmVxdWlyZShcIi4vU0RQXCIpO1xuXG4vLyBKaW5nbGUgc3R1ZmZcbmZ1bmN0aW9uIEppbmdsZVNlc3Npb24obWUsIHNpZCwgY29ubmVjdGlvbiwgc2VydmljZSkge1xuICAgIHRoaXMubWUgPSBtZTtcbiAgICB0aGlzLnNpZCA9IHNpZDtcbiAgICB0aGlzLmNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICAgIHRoaXMuaW5pdGlhdG9yID0gbnVsbDtcbiAgICB0aGlzLnJlc3BvbmRlciA9IG51bGw7XG4gICAgdGhpcy5pc0luaXRpYXRvciA9IG51bGw7XG4gICAgdGhpcy5wZWVyamlkID0gbnVsbDtcbiAgICB0aGlzLnN0YXRlID0gbnVsbDtcbiAgICB0aGlzLmxvY2FsU0RQID0gbnVsbDtcbiAgICB0aGlzLnJlbW90ZVNEUCA9IG51bGw7XG4gICAgdGhpcy5yZWxheWVkU3RyZWFtcyA9IFtdO1xuICAgIHRoaXMuc3RhcnRUaW1lID0gbnVsbDtcbiAgICB0aGlzLnN0b3BUaW1lID0gbnVsbDtcbiAgICB0aGlzLm1lZGlhX2NvbnN0cmFpbnRzID0gbnVsbDtcbiAgICB0aGlzLnBjX2NvbnN0cmFpbnRzID0gbnVsbDtcbiAgICB0aGlzLmljZV9jb25maWcgPSB7fTtcbiAgICB0aGlzLmRyaXBfY29udGFpbmVyID0gW107XG4gICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcblxuICAgIHRoaXMudXNldHJpY2tsZSA9IHRydWU7XG4gICAgdGhpcy51c2VwcmFuc3dlciA9IGZhbHNlOyAvLyBlYXJseSB0cmFuc3BvcnQgd2FybXVwIC0tIG1pbmQgeW91LCB0aGlzIG1pZ2h0IGZhaWwuIGRlcGVuZHMgb24gd2VicnRjIGlzc3VlIDE3MThcbiAgICB0aGlzLnVzZWRyaXAgPSBmYWxzZTsgLy8gZHJpcHBpbmcgaXMgc2VuZGluZyB0cmlja2xlIGNhbmRpZGF0ZXMgbm90IG9uZS1ieS1vbmVcblxuICAgIHRoaXMuaGFkc3R1bmNhbmRpZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMuaGFkdHVybmNhbmRpZGF0ZSA9IGZhbHNlO1xuICAgIHRoaXMubGFzdGljZWNhbmRpZGF0ZSA9IGZhbHNlO1xuXG4gICAgdGhpcy5zdGF0c2ludGVydmFsID0gbnVsbDtcblxuICAgIHRoaXMucmVhc29uID0gbnVsbDtcblxuICAgIHRoaXMuYWRkc3NyYyA9IFtdO1xuICAgIHRoaXMucmVtb3Zlc3NyYyA9IFtdO1xuICAgIHRoaXMucGVuZGluZ29wID0gbnVsbDtcbiAgICB0aGlzLnN3aXRjaHN0cmVhbXMgPSBmYWxzZTtcblxuICAgIHRoaXMud2FpdCA9IHRydWU7XG4gICAgdGhpcy5sb2NhbFN0cmVhbXNTU1JDID0gbnVsbDtcblxuICAgIC8qKlxuICAgICAqIFRoZSBpbmRpY2F0b3Igd2hpY2ggZGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSAobG9jYWwpIHZpZGVvIGhhcyBiZWVuIG11dGVkXG4gICAgICogaW4gcmVzcG9uc2UgdG8gYSB1c2VyIGNvbW1hbmQgaW4gY29udHJhc3QgdG8gYW4gYXV0b21hdGljIGRlY2lzaW9uIG1hZGVcbiAgICAgKiBieSB0aGUgYXBwbGljYXRpb24gbG9naWMuXG4gICAgICovXG4gICAgdGhpcy52aWRlb011dGVCeVVzZXIgPSBmYWxzZTtcbn1cblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuaW5pdGlhdGUgPSBmdW5jdGlvbiAocGVlcmppZCwgaXNJbml0aWF0b3IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKHRoaXMuc3RhdGUgIT09IG51bGwpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignYXR0ZW1wdCB0byBpbml0aWF0ZSBvbiBzZXNzaW9uICcgKyB0aGlzLnNpZCArXG4gICAgICAgICAgICAnaW4gc3RhdGUgJyArIHRoaXMuc3RhdGUpO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHRoaXMuaXNJbml0aWF0b3IgPSBpc0luaXRpYXRvcjtcbiAgICB0aGlzLnN0YXRlID0gJ3BlbmRpbmcnO1xuICAgIHRoaXMuaW5pdGlhdG9yID0gaXNJbml0aWF0b3IgPyB0aGlzLm1lIDogcGVlcmppZDtcbiAgICB0aGlzLnJlc3BvbmRlciA9ICFpc0luaXRpYXRvciA/IHRoaXMubWUgOiBwZWVyamlkO1xuICAgIHRoaXMucGVlcmppZCA9IHBlZXJqaWQ7XG4gICAgdGhpcy5oYWRzdHVuY2FuZGlkYXRlID0gZmFsc2U7XG4gICAgdGhpcy5oYWR0dXJuY2FuZGlkYXRlID0gZmFsc2U7XG4gICAgdGhpcy5sYXN0aWNlY2FuZGlkYXRlID0gZmFsc2U7XG5cbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uXG4gICAgICAgID0gbmV3IFRyYWNlYWJsZVBlZXJDb25uZWN0aW9uKFxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLmppbmdsZS5pY2VfY29uZmlnLFxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLmppbmdsZS5wY19jb25zdHJhaW50cyApO1xuXG4gICAgdGhpcy5wZWVyY29ubmVjdGlvbi5vbmljZWNhbmRpZGF0ZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBzZWxmLnNlbmRJY2VDYW5kaWRhdGUoZXZlbnQuY2FuZGlkYXRlKTtcbiAgICB9O1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24ub25hZGRzdHJlYW0gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgY29uc29sZS5sb2coXCJSRU1PVEUgU1RSRUFNIEFEREVEOiBcIiArIGV2ZW50LnN0cmVhbSArIFwiIC0gXCIgKyBldmVudC5zdHJlYW0uaWQpO1xuICAgICAgICBzZWxmLnJlbW90ZVN0cmVhbUFkZGVkKGV2ZW50KTtcbiAgICB9O1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24ub25yZW1vdmVzdHJlYW0gPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBzdHJlYW0gZnJvbSByZW1vdGVTdHJlYW1zXG4gICAgICAgIC8vIEZJWE1FOiByZW1vdGVzdHJlYW1yZW1vdmVkLmppbmdsZSBub3QgZGVmaW5lZCBhbnl3aGVyZSh1bnVzZWQpXG4gICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3JlbW90ZXN0cmVhbXJlbW92ZWQuamluZ2xlJywgW2V2ZW50LCBzZWxmLnNpZF0pO1xuICAgIH07XG4gICAgdGhpcy5wZWVyY29ubmVjdGlvbi5vbnNpZ25hbGluZ3N0YXRlY2hhbmdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIGlmICghKHNlbGYgJiYgc2VsZi5wZWVyY29ubmVjdGlvbikpIHJldHVybjtcbiAgICB9O1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24ub25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgaWYgKCEoc2VsZiAmJiBzZWxmLnBlZXJjb25uZWN0aW9uKSkgcmV0dXJuO1xuICAgICAgICBzd2l0Y2ggKHNlbGYucGVlcmNvbm5lY3Rpb24uaWNlQ29ubmVjdGlvblN0YXRlKSB7XG4gICAgICAgICAgICBjYXNlICdjb25uZWN0ZWQnOlxuICAgICAgICAgICAgICAgIHRoaXMuc3RhcnRUaW1lID0gbmV3IERhdGUoKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ2Rpc2Nvbm5lY3RlZCc6XG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wVGltZSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgb25JY2VDb25uZWN0aW9uU3RhdGVDaGFuZ2Uoc2VsZi5zaWQsIHNlbGYpO1xuICAgIH07XG4gICAgLy8gYWRkIGFueSBsb2NhbCBhbmQgcmVsYXllZCBzdHJlYW1cbiAgICBSVEMubG9jYWxTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XG4gICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uYWRkU3RyZWFtKHN0cmVhbS5nZXRPcmlnaW5hbFN0cmVhbSgpKTtcbiAgICB9KTtcbiAgICB0aGlzLnJlbGF5ZWRTdHJlYW1zLmZvckVhY2goZnVuY3Rpb24oc3RyZWFtKSB7XG4gICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uYWRkU3RyZWFtKHN0cmVhbSk7XG4gICAgfSk7XG59O1xuXG5mdW5jdGlvbiBvbkljZUNvbm5lY3Rpb25TdGF0ZUNoYW5nZShzaWQsIHNlc3Npb24pIHtcbiAgICBzd2l0Y2ggKHNlc3Npb24ucGVlcmNvbm5lY3Rpb24uaWNlQ29ubmVjdGlvblN0YXRlKSB7XG4gICAgICAgIGNhc2UgJ2NoZWNraW5nJzpcbiAgICAgICAgICAgIHNlc3Npb24udGltZUNoZWNraW5nID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcbiAgICAgICAgICAgIHNlc3Npb24uZmlyc3Rjb25uZWN0ID0gdHJ1ZTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdjb21wbGV0ZWQnOiAvLyBvbiBjYWxsZXIgc2lkZVxuICAgICAgICBjYXNlICdjb25uZWN0ZWQnOlxuICAgICAgICAgICAgaWYgKHNlc3Npb24uZmlyc3Rjb25uZWN0KSB7XG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5maXJzdGNvbm5lY3QgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB2YXIgbWV0YWRhdGEgPSB7fTtcbiAgICAgICAgICAgICAgICBtZXRhZGF0YS5zZXR1cFRpbWVcbiAgICAgICAgICAgICAgICAgICAgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpIC0gc2Vzc2lvbi50aW1lQ2hlY2tpbmc7XG4gICAgICAgICAgICAgICAgc2Vzc2lvbi5wZWVyY29ubmVjdGlvbi5nZXRTdGF0cyhmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJlcyAmJiByZXMucmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXMucmVzdWx0KCkuZm9yRWFjaChmdW5jdGlvbiAocmVwb3J0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlcG9ydC50eXBlID09ICdnb29nQ2FuZGlkYXRlUGFpcicgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVwb3J0LnN0YXQoJ2dvb2dBY3RpdmVDb25uZWN0aW9uJykgPT0gJ3RydWUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhLmxvY2FsQ2FuZGlkYXRlVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXBvcnQuc3RhdCgnZ29vZ0xvY2FsQ2FuZGlkYXRlVHlwZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YS5yZW1vdGVDYW5kaWRhdGVUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA9IHJlcG9ydC5zdGF0KCdnb29nUmVtb3RlQ2FuZGlkYXRlVHlwZScpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGxvZyBwYWlyIGFzIHdlbGwgc28gd2UgY2FuIGdldCBuaWNlIHBpZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFydHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGEuY2FuZGlkYXRlUGFpclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXBvcnQuc3RhdCgnZ29vZ0xvY2FsQ2FuZGlkYXRlVHlwZScpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnOycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcG9ydC5zdGF0KCdnb29nUmVtb3RlQ2FuZGlkYXRlVHlwZScpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXBvcnQuc3RhdCgnZ29vZ1JlbW90ZUFkZHJlc3MnKS5pbmRleE9mKCdbJykgPT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhLmlwdjYgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbn1cblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuYWNjZXB0ID0gZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnN0YXRlID0gJ2FjdGl2ZSc7XG5cbiAgICB2YXIgcHJhbnN3ZXIgPSB0aGlzLnBlZXJjb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb247XG4gICAgaWYgKCFwcmFuc3dlciB8fCBwcmFuc3dlci50eXBlICE9ICdwcmFuc3dlcicpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zb2xlLmxvZygnZ29pbmcgZnJvbSBwcmFuc3dlciB0byBhbnN3ZXInKTtcbiAgICBpZiAodGhpcy51c2V0cmlja2xlKSB7XG4gICAgICAgIC8vIHJlbW92ZSBjYW5kaWRhdGVzIGFscmVhZHkgc2VudCBmcm9tIHNlc3Npb24tYWNjZXB0XG4gICAgICAgIHZhciBsaW5lcyA9IFNEUFV0aWwuZmluZF9saW5lcyhwcmFuc3dlci5zZHAsICdhPWNhbmRpZGF0ZTonKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcHJhbnN3ZXIuc2RwID0gcHJhbnN3ZXIuc2RwLnJlcGxhY2UobGluZXNbaV0gKyAnXFxyXFxuJywgJycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHdoaWxlIChTRFBVdGlsLmZpbmRfbGluZShwcmFuc3dlci5zZHAsICdhPWluYWN0aXZlJykpIHtcbiAgICAgICAgLy8gRklYTUU6IGNoYW5nZSBhbnkgaW5hY3RpdmUgdG8gc2VuZHJlY3Ygb3Igd2hhdGV2ZXIgdGhleSB3ZXJlIG9yaWdpbmFsbHlcbiAgICAgICAgcHJhbnN3ZXIuc2RwID0gcHJhbnN3ZXIuc2RwLnJlcGxhY2UoJ2E9aW5hY3RpdmUnLCAnYT1zZW5kcmVjdicpO1xuICAgIH1cbiAgICBwcmFuc3dlciA9IHNpbXVsY2FzdC5yZXZlcnNlVHJhbnNmb3JtTG9jYWxEZXNjcmlwdGlvbihwcmFuc3dlcik7XG4gICAgdmFyIHByc2RwID0gbmV3IFNEUChwcmFuc3dlci5zZHApO1xuICAgIHZhciBhY2NlcHQgPSAkaXEoe3RvOiB0aGlzLnBlZXJqaWQsXG4gICAgICAgIHR5cGU6ICdzZXQnfSlcbiAgICAgICAgLmMoJ2ppbmdsZScsIHt4bWxuczogJ3Vybjp4bXBwOmppbmdsZToxJyxcbiAgICAgICAgICAgIGFjdGlvbjogJ3Nlc3Npb24tYWNjZXB0JyxcbiAgICAgICAgICAgIGluaXRpYXRvcjogdGhpcy5pbml0aWF0b3IsXG4gICAgICAgICAgICByZXNwb25kZXI6IHRoaXMucmVzcG9uZGVyLFxuICAgICAgICAgICAgc2lkOiB0aGlzLnNpZCB9KTtcbiAgICBwcnNkcC50b0ppbmdsZShhY2NlcHQsIHRoaXMuaW5pdGlhdG9yID09IHRoaXMubWUgPyAnaW5pdGlhdG9yJyA6ICdyZXNwb25kZXInLCB0aGlzLmxvY2FsU3RyZWFtc1NTUkMpO1xuICAgIHZhciBzZHAgPSB0aGlzLnBlZXJjb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb24uc2RwO1xuICAgIHdoaWxlIChTRFBVdGlsLmZpbmRfbGluZShzZHAsICdhPWluYWN0aXZlJykpIHtcbiAgICAgICAgLy8gRklYTUU6IGNoYW5nZSBhbnkgaW5hY3RpdmUgdG8gc2VuZHJlY3Ygb3Igd2hhdGV2ZXIgdGhleSB3ZXJlIG9yaWdpbmFsbHlcbiAgICAgICAgc2RwID0gc2RwLnJlcGxhY2UoJ2E9aW5hY3RpdmUnLCAnYT1zZW5kcmVjdicpO1xuICAgIH1cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5wZWVyY29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oe3R5cGU6ICdhbnN3ZXInLCBzZHA6IHNkcH0pLFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXRMb2NhbERlc2NyaXB0aW9uIHN1Y2Nlc3MnKTtcbiAgICAgICAgICAgIHNlbGYuc2V0TG9jYWxEZXNjcmlwdGlvbigpO1xuXG4gICAgICAgICAgICBzZWxmLmNvbm5lY3Rpb24uc2VuZElRKGFjY2VwdCxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY2sgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgYWNrLnNvdXJjZSA9ICdhbnN3ZXInO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdhY2suamluZ2xlJywgW3NlbGYuc2lkLCBhY2tdKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChzdGFuemEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGVycm9yID0gKCQoc3RhbnphKS5maW5kKCdlcnJvcicpLmxlbmd0aCkgPyB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAkKHN0YW56YSkuZmluZCgnZXJyb3InKS5hdHRyKCdjb2RlJyksXG4gICAgICAgICAgICAgICAgICAgICAgICByZWFzb246ICQoc3RhbnphKS5maW5kKCdlcnJvciA6Zmlyc3QnKVswXS50YWdOYW1lXG4gICAgICAgICAgICAgICAgICAgIH06e307XG4gICAgICAgICAgICAgICAgICAgIGVycm9yLnNvdXJjZSA9ICdhbnN3ZXInO1xuICAgICAgICAgICAgICAgICAgICBKaW5nbGVTZXNzaW9uLm9uSmluZ2xlRXJyb3Ioc2VsZi5zaWQsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIDEwMDAwKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NldExvY2FsRGVzY3JpcHRpb24gZmFpbGVkJywgZSk7XG4gICAgICAgIH1cbiAgICApO1xufTtcblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUudGVybWluYXRlID0gZnVuY3Rpb24gKHJlYXNvbikge1xuICAgIHRoaXMuc3RhdGUgPSAnZW5kZWQnO1xuICAgIHRoaXMucmVhc29uID0gcmVhc29uO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICBpZiAodGhpcy5zdGF0c2ludGVydmFsICE9PSBudWxsKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuc3RhdHNpbnRlcnZhbCk7XG4gICAgICAgIHRoaXMuc3RhdHNpbnRlcnZhbCA9IG51bGw7XG4gICAgfVxufTtcblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuYWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB0aGlzLnN0YXRlID09ICdhY3RpdmUnO1xufTtcblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuc2VuZEljZUNhbmRpZGF0ZSA9IGZ1bmN0aW9uIChjYW5kaWRhdGUpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgaWYgKGNhbmRpZGF0ZSAmJiAhdGhpcy5sYXN0aWNlY2FuZGlkYXRlKSB7XG4gICAgICAgIHZhciBpY2UgPSBTRFBVdGlsLmljZXBhcmFtcyh0aGlzLmxvY2FsU0RQLm1lZGlhW2NhbmRpZGF0ZS5zZHBNTGluZUluZGV4XSwgdGhpcy5sb2NhbFNEUC5zZXNzaW9uKTtcbiAgICAgICAgdmFyIGpjYW5kID0gU0RQVXRpbC5jYW5kaWRhdGVUb0ppbmdsZShjYW5kaWRhdGUuY2FuZGlkYXRlKTtcbiAgICAgICAgaWYgKCEoaWNlICYmIGpjYW5kKSkge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignZmFpbGVkIHRvIGdldCBpY2UgJiYgamNhbmQnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpY2UueG1sbnMgPSAndXJuOnhtcHA6amluZ2xlOnRyYW5zcG9ydHM6aWNlLXVkcDoxJztcblxuICAgICAgICBpZiAoamNhbmQudHlwZSA9PT0gJ3NyZmx4Jykge1xuICAgICAgICAgICAgdGhpcy5oYWRzdHVuY2FuZGlkYXRlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChqY2FuZC50eXBlID09PSAncmVsYXknKSB7XG4gICAgICAgICAgICB0aGlzLmhhZHR1cm5jYW5kaWRhdGUgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudXNldHJpY2tsZSkge1xuICAgICAgICAgICAgaWYgKHRoaXMudXNlZHJpcCkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmRyaXBfY29udGFpbmVyLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzdGFydCAyMG1zIGNhbGxvdXRcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuZHJpcF9jb250YWluZXIubGVuZ3RoID09PSAwKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNlbmRJY2VDYW5kaWRhdGVzKHNlbGYuZHJpcF9jb250YWluZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kcmlwX2NvbnRhaW5lciA9IFtdO1xuICAgICAgICAgICAgICAgICAgICB9LCAyMCk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5kcmlwX2NvbnRhaW5lci5wdXNoKGNhbmRpZGF0ZSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLnNlbmRJY2VDYW5kaWRhdGUoW2NhbmRpZGF0ZV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy9jb25zb2xlLmxvZygnc2VuZEljZUNhbmRpZGF0ZTogbGFzdCBjYW5kaWRhdGUuJyk7XG4gICAgICAgIGlmICghdGhpcy51c2V0cmlja2xlKSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzaG91bGQgc2VuZCBmdWxsIG9mZmVyIG5vdy4uLicpO1xuICAgICAgICAgICAgdmFyIGluaXQgPSAkaXEoe3RvOiB0aGlzLnBlZXJqaWQsXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NldCd9KVxuICAgICAgICAgICAgICAgIC5jKCdqaW5nbGUnLCB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6MScsXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbjogdGhpcy5wZWVyY29ubmVjdGlvbi5sb2NhbERlc2NyaXB0aW9uLnR5cGUgPT0gJ29mZmVyJyA/ICdzZXNzaW9uLWluaXRpYXRlJyA6ICdzZXNzaW9uLWFjY2VwdCcsXG4gICAgICAgICAgICAgICAgICAgIGluaXRpYXRvcjogdGhpcy5pbml0aWF0b3IsXG4gICAgICAgICAgICAgICAgICAgIHNpZDogdGhpcy5zaWR9KTtcbiAgICAgICAgICAgIHRoaXMubG9jYWxTRFAgPSBuZXcgU0RQKHRoaXMucGVlcmNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbi5zZHApO1xuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHNlbmRKaW5nbGUgPSBmdW5jdGlvbiAoc3NyYykge1xuICAgICAgICAgICAgICAgIGlmKCFzc3JjKVxuICAgICAgICAgICAgICAgICAgICBzc3JjID0ge307XG4gICAgICAgICAgICAgICAgc2VsZi5sb2NhbFNEUC50b0ppbmdsZShpbml0LCBzZWxmLmluaXRpYXRvciA9PSBzZWxmLm1lID8gJ2luaXRpYXRvcicgOiAncmVzcG9uZGVyJywgc3NyYyk7XG4gICAgICAgICAgICAgICAgc2VsZi5jb25uZWN0aW9uLnNlbmRJUShpbml0LFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXNzaW9uIGluaXRpYXRlIGFjaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjayA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNrLnNvdXJjZSA9ICdvZmZlcic7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdhY2suamluZ2xlJywgW3NlbGYuc2lkLCBhY2tdKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHN0YW56YSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGF0ZSA9ICdlcnJvcic7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnBlZXJjb25uZWN0aW9uLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSAoJChzdGFuemEpLmZpbmQoJ2Vycm9yJykubGVuZ3RoKSA/IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb2RlOiAkKHN0YW56YSkuZmluZCgnZXJyb3InKS5hdHRyKCdjb2RlJyksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVhc29uOiAkKHN0YW56YSkuZmluZCgnZXJyb3IgOmZpcnN0JylbMF0udGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIH06e307XG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvci5zb3VyY2UgPSAnb2ZmZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgSmluZ2xlU2Vzc2lvbi5vbkppbmdsZUVycm9yKHNlbGYuc2lkLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIDEwMDAwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbmRKaW5nbGUoKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxhc3RpY2VjYW5kaWRhdGUgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmxvZygnSGF2ZSB3ZSBlbmNvdW50ZXJlZCBhbnkgc3JmbHggY2FuZGlkYXRlcz8gJyArIHRoaXMuaGFkc3R1bmNhbmRpZGF0ZSk7XG4gICAgICAgIGNvbnNvbGUubG9nKCdIYXZlIHdlIGVuY291bnRlcmVkIGFueSByZWxheSBjYW5kaWRhdGVzPyAnICsgdGhpcy5oYWR0dXJuY2FuZGlkYXRlKTtcblxuICAgICAgICBpZiAoISh0aGlzLmhhZHN0dW5jYW5kaWRhdGUgfHwgdGhpcy5oYWR0dXJuY2FuZGlkYXRlKSAmJiB0aGlzLnBlZXJjb25uZWN0aW9uLnNpZ25hbGluZ1N0YXRlICE9ICdjbG9zZWQnKSB7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdub3N0dW5jYW5kaWRhdGVzLmppbmdsZScsIFt0aGlzLnNpZF0pO1xuICAgICAgICB9XG4gICAgfVxufTtcblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuc2VuZEljZUNhbmRpZGF0ZXMgPSBmdW5jdGlvbiAoY2FuZGlkYXRlcykge1xuICAgIGNvbnNvbGUubG9nKCdzZW5kSWNlQ2FuZGlkYXRlcycsIGNhbmRpZGF0ZXMpO1xuICAgIHZhciBjYW5kID0gJGlxKHt0bzogdGhpcy5wZWVyamlkLCB0eXBlOiAnc2V0J30pXG4gICAgICAgIC5jKCdqaW5nbGUnLCB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6MScsXG4gICAgICAgICAgICBhY3Rpb246ICd0cmFuc3BvcnQtaW5mbycsXG4gICAgICAgICAgICBpbml0aWF0b3I6IHRoaXMuaW5pdGlhdG9yLFxuICAgICAgICAgICAgc2lkOiB0aGlzLnNpZH0pO1xuICAgIGZvciAodmFyIG1pZCA9IDA7IG1pZCA8IHRoaXMubG9jYWxTRFAubWVkaWEubGVuZ3RoOyBtaWQrKykge1xuICAgICAgICB2YXIgY2FuZHMgPSBjYW5kaWRhdGVzLmZpbHRlcihmdW5jdGlvbiAoZWwpIHsgcmV0dXJuIGVsLnNkcE1MaW5lSW5kZXggPT0gbWlkOyB9KTtcbiAgICAgICAgdmFyIG1saW5lID0gU0RQVXRpbC5wYXJzZV9tbGluZSh0aGlzLmxvY2FsU0RQLm1lZGlhW21pZF0uc3BsaXQoJ1xcclxcbicpWzBdKTtcbiAgICAgICAgaWYgKGNhbmRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIHZhciBpY2UgPSBTRFBVdGlsLmljZXBhcmFtcyh0aGlzLmxvY2FsU0RQLm1lZGlhW21pZF0sIHRoaXMubG9jYWxTRFAuc2Vzc2lvbik7XG4gICAgICAgICAgICBpY2UueG1sbnMgPSAndXJuOnhtcHA6amluZ2xlOnRyYW5zcG9ydHM6aWNlLXVkcDoxJztcbiAgICAgICAgICAgIGNhbmQuYygnY29udGVudCcsIHtjcmVhdG9yOiB0aGlzLmluaXRpYXRvciA9PSB0aGlzLm1lID8gJ2luaXRpYXRvcicgOiAncmVzcG9uZGVyJyxcbiAgICAgICAgICAgICAgICBuYW1lOiAoY2FuZHNbMF0uc2RwTWlkPyBjYW5kc1swXS5zZHBNaWQgOiBtbGluZS5tZWRpYSlcbiAgICAgICAgICAgIH0pLmMoJ3RyYW5zcG9ydCcsIGljZSk7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhbmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2FuZC5jKCdjYW5kaWRhdGUnLCBTRFBVdGlsLmNhbmRpZGF0ZVRvSmluZ2xlKGNhbmRzW2ldLmNhbmRpZGF0ZSkpLnVwKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBhZGQgZmluZ2VycHJpbnRcbiAgICAgICAgICAgIGlmIChTRFBVdGlsLmZpbmRfbGluZSh0aGlzLmxvY2FsU0RQLm1lZGlhW21pZF0sICdhPWZpbmdlcnByaW50OicsIHRoaXMubG9jYWxTRFAuc2Vzc2lvbikpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG1wID0gU0RQVXRpbC5wYXJzZV9maW5nZXJwcmludChTRFBVdGlsLmZpbmRfbGluZSh0aGlzLmxvY2FsU0RQLm1lZGlhW21pZF0sICdhPWZpbmdlcnByaW50OicsIHRoaXMubG9jYWxTRFAuc2Vzc2lvbikpO1xuICAgICAgICAgICAgICAgIHRtcC5yZXF1aXJlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgY2FuZC5jKFxuICAgICAgICAgICAgICAgICAgICAnZmluZ2VycHJpbnQnLFxuICAgICAgICAgICAgICAgICAgICB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6YXBwczpkdGxzOjAnfSlcbiAgICAgICAgICAgICAgICAgICAgLnQodG1wLmZpbmdlcnByaW50KTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdG1wLmZpbmdlcnByaW50O1xuICAgICAgICAgICAgICAgIGNhbmQuYXR0cnModG1wKTtcbiAgICAgICAgICAgICAgICBjYW5kLnVwKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjYW5kLnVwKCk7IC8vIHRyYW5zcG9ydFxuICAgICAgICAgICAgY2FuZC51cCgpOyAvLyBjb250ZW50XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gbWlnaHQgbWVyZ2UgbGFzdC1jYW5kaWRhdGUgbm90aWZpY2F0aW9uIGludG8gdGhpcywgYnV0IGl0IGlzIGNhbGxlZCBhbG90IGxhdGVyLiBTZWUgd2VicnRjIGlzc3VlICMyMzQwXG4gICAgLy9jb25zb2xlLmxvZygnd2FzIHRoaXMgdGhlIGxhc3QgY2FuZGlkYXRlJywgdGhpcy5sYXN0aWNlY2FuZGlkYXRlKTtcbiAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZElRKGNhbmQsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhY2sgPSB7fTtcbiAgICAgICAgICAgIGFjay5zb3VyY2UgPSAndHJhbnNwb3J0aW5mbyc7XG4gICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdhY2suamluZ2xlJywgW3RoaXMuc2lkLCBhY2tdKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKHN0YW56YSkge1xuICAgICAgICAgICAgdmFyIGVycm9yID0gKCQoc3RhbnphKS5maW5kKCdlcnJvcicpLmxlbmd0aCkgPyB7XG4gICAgICAgICAgICAgICAgY29kZTogJChzdGFuemEpLmZpbmQoJ2Vycm9yJykuYXR0cignY29kZScpLFxuICAgICAgICAgICAgICAgIHJlYXNvbjogJChzdGFuemEpLmZpbmQoJ2Vycm9yIDpmaXJzdCcpWzBdLnRhZ05hbWUsXG4gICAgICAgICAgICB9Ont9O1xuICAgICAgICAgICAgZXJyb3Iuc291cmNlID0gJ3RyYW5zcG9ydGluZm8nO1xuICAgICAgICAgICAgSmluZ2xlU2Vzc2lvbi5vbkppbmdsZUVycm9yKHRoaXMuc2lkLCBlcnJvcik7XG4gICAgICAgIH0sXG4gICAgICAgIDEwMDAwKTtcbn07XG5cblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuc2VuZE9mZmVyID0gZnVuY3Rpb24gKCkge1xuICAgIC8vY29uc29sZS5sb2coJ3NlbmRPZmZlci4uLicpO1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uLmNyZWF0ZU9mZmVyKGZ1bmN0aW9uIChzZHApIHtcbiAgICAgICAgICAgIHNlbGYuY3JlYXRlZE9mZmVyKHNkcCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdjcmVhdGVPZmZlciBmYWlsZWQnLCBlKTtcbiAgICAgICAgfSxcbiAgICAgICAgdGhpcy5tZWRpYV9jb25zdHJhaW50c1xuICAgICk7XG59O1xuXG5KaW5nbGVTZXNzaW9uLnByb3RvdHlwZS5jcmVhdGVkT2ZmZXIgPSBmdW5jdGlvbiAoc2RwKSB7XG4gICAgLy9jb25zb2xlLmxvZygnY3JlYXRlZE9mZmVyJywgc2RwKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5sb2NhbFNEUCA9IG5ldyBTRFAoc2RwLnNkcCk7XG4gICAgLy90aGlzLmxvY2FsU0RQLm1hbmdsZSgpO1xuICAgIHZhciBzZW5kSmluZ2xlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5pdCA9ICRpcSh7dG86IHRoaXMucGVlcmppZCxcbiAgICAgICAgICAgIHR5cGU6ICdzZXQnfSlcbiAgICAgICAgICAgIC5jKCdqaW5nbGUnLCB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6MScsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnc2Vzc2lvbi1pbml0aWF0ZScsXG4gICAgICAgICAgICAgICAgaW5pdGlhdG9yOiB0aGlzLmluaXRpYXRvcixcbiAgICAgICAgICAgICAgICBzaWQ6IHRoaXMuc2lkfSk7XG4gICAgICAgIHNlbGYubG9jYWxTRFAudG9KaW5nbGUoaW5pdCwgdGhpcy5pbml0aWF0b3IgPT0gdGhpcy5tZSA/ICdpbml0aWF0b3InIDogJ3Jlc3BvbmRlcicsIHRoaXMubG9jYWxTdHJlYW1zU1NSQyk7XG4gICAgICAgIHNlbGYuY29ubmVjdGlvbi5zZW5kSVEoaW5pdCxcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgYWNrID0ge307XG4gICAgICAgICAgICAgICAgYWNrLnNvdXJjZSA9ICdvZmZlcic7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcignYWNrLmppbmdsZScsIFtzZWxmLnNpZCwgYWNrXSk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZnVuY3Rpb24gKHN0YW56YSkge1xuICAgICAgICAgICAgICAgIHNlbGYuc3RhdGUgPSAnZXJyb3InO1xuICAgICAgICAgICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB2YXIgZXJyb3IgPSAoJChzdGFuemEpLmZpbmQoJ2Vycm9yJykubGVuZ3RoKSA/IHtcbiAgICAgICAgICAgICAgICAgICAgY29kZTogJChzdGFuemEpLmZpbmQoJ2Vycm9yJykuYXR0cignY29kZScpLFxuICAgICAgICAgICAgICAgICAgICByZWFzb246ICQoc3RhbnphKS5maW5kKCdlcnJvciA6Zmlyc3QnKVswXS50YWdOYW1lLFxuICAgICAgICAgICAgICAgIH06e307XG4gICAgICAgICAgICAgICAgZXJyb3Iuc291cmNlID0gJ29mZmVyJztcbiAgICAgICAgICAgICAgICBKaW5nbGVTZXNzaW9uLm9uSmluZ2xlRXJyb3Ioc2VsZi5zaWQsIGVycm9yKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAxMDAwMCk7XG4gICAgfVxuICAgIHNkcC5zZHAgPSB0aGlzLmxvY2FsU0RQLnJhdztcbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uLnNldExvY2FsRGVzY3JpcHRpb24oc2RwLFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZihzZWxmLnVzZXRyaWNrbGUpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgc2VuZEppbmdsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5zZXRMb2NhbERlc2NyaXB0aW9uKCk7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdzZXRMb2NhbERlc2NyaXB0aW9uIHN1Y2Nlc3MnKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NldExvY2FsRGVzY3JpcHRpb24gZmFpbGVkJywgZSk7XG4gICAgICAgIH1cbiAgICApO1xuICAgIHZhciBjYW5kcyA9IFNEUFV0aWwuZmluZF9saW5lcyh0aGlzLmxvY2FsU0RQLnJhdywgJ2E9Y2FuZGlkYXRlOicpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2FuZHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNhbmQgPSBTRFBVdGlsLnBhcnNlX2ljZWNhbmRpZGF0ZShjYW5kc1tpXSk7XG4gICAgICAgIGlmIChjYW5kLnR5cGUgPT0gJ3NyZmx4Jykge1xuICAgICAgICAgICAgdGhpcy5oYWRzdHVuY2FuZGlkYXRlID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmIChjYW5kLnR5cGUgPT0gJ3JlbGF5Jykge1xuICAgICAgICAgICAgdGhpcy5oYWR0dXJuY2FuZGlkYXRlID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbkppbmdsZVNlc3Npb24ucHJvdG90eXBlLnNldFJlbW90ZURlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGVsZW0sIGRlc2N0eXBlKSB7XG4gICAgLy9jb25zb2xlLmxvZygnc2V0dGluZyByZW1vdGUgZGVzY3JpcHRpb24uLi4gJywgZGVzY3R5cGUpO1xuICAgIHRoaXMucmVtb3RlU0RQID0gbmV3IFNEUCgnJyk7XG4gICAgdGhpcy5yZW1vdGVTRFAuZnJvbUppbmdsZShlbGVtKTtcbiAgICBpZiAodGhpcy5wZWVyY29ubmVjdGlvbi5yZW1vdGVEZXNjcmlwdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLmxvZygnc2V0UmVtb3RlRGVzY3JpcHRpb24gd2hlbiByZW1vdGUgZGVzY3JpcHRpb24gaXMgbm90IG51bGwsIHNob3VsZCBiZSBwcmFuc3dlcicsIHRoaXMucGVlcmNvbm5lY3Rpb24ucmVtb3RlRGVzY3JpcHRpb24pO1xuICAgICAgICBpZiAodGhpcy5wZWVyY29ubmVjdGlvbi5yZW1vdGVEZXNjcmlwdGlvbi50eXBlID09ICdwcmFuc3dlcicpIHtcbiAgICAgICAgICAgIHZhciBwcmFuc3dlciA9IG5ldyBTRFAodGhpcy5wZWVyY29ubmVjdGlvbi5yZW1vdGVEZXNjcmlwdGlvbi5zZHApO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwcmFuc3dlci5tZWRpYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBoYXZlIGljZSB1ZnJhZyBhbmQgcHdkXG4gICAgICAgICAgICAgICAgaWYgKCFTRFBVdGlsLmZpbmRfbGluZSh0aGlzLnJlbW90ZVNEUC5tZWRpYVtpXSwgJ2E9aWNlLXVmcmFnOicsIHRoaXMucmVtb3RlU0RQLnNlc3Npb24pKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChTRFBVdGlsLmZpbmRfbGluZShwcmFuc3dlci5tZWRpYVtpXSwgJ2E9aWNlLXVmcmFnOicsIHByYW5zd2VyLnNlc3Npb24pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW90ZVNEUC5tZWRpYVtpXSArPSBTRFBVdGlsLmZpbmRfbGluZShwcmFuc3dlci5tZWRpYVtpXSwgJ2E9aWNlLXVmcmFnOicsIHByYW5zd2VyLnNlc3Npb24pICsgJ1xcclxcbic7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ25vIGljZSB1ZnJhZz8nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoU0RQVXRpbC5maW5kX2xpbmUocHJhbnN3ZXIubWVkaWFbaV0sICdhPWljZS1wd2Q6JywgcHJhbnN3ZXIuc2Vzc2lvbikpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3RlU0RQLm1lZGlhW2ldICs9IFNEUFV0aWwuZmluZF9saW5lKHByYW5zd2VyLm1lZGlhW2ldLCAnYT1pY2UtcHdkOicsIHByYW5zd2VyLnNlc3Npb24pICsgJ1xcclxcbic7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ25vIGljZSBwd2Q/Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gY29weSBvdmVyIGNhbmRpZGF0ZXNcbiAgICAgICAgICAgICAgICB2YXIgbGluZXMgPSBTRFBVdGlsLmZpbmRfbGluZXMocHJhbnN3ZXIubWVkaWFbaV0sICdhPWNhbmRpZGF0ZTonKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3RlU0RQLm1lZGlhW2ldICs9IGxpbmVzW2pdICsgJ1xcclxcbic7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5yZW1vdGVTRFAucmF3ID0gdGhpcy5yZW1vdGVTRFAuc2Vzc2lvbiArIHRoaXMucmVtb3RlU0RQLm1lZGlhLmpvaW4oJycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciByZW1vdGVkZXNjID0gbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbih7dHlwZTogZGVzY3R5cGUsIHNkcDogdGhpcy5yZW1vdGVTRFAucmF3fSk7XG5cbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKHJlbW90ZWRlc2MsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vY29uc29sZS5sb2coJ3NldFJlbW90ZURlc2NyaXB0aW9uIHN1Y2Nlc3MnKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NldFJlbW90ZURlc2NyaXB0aW9uIGVycm9yJywgZSk7XG4gICAgICAgICAgICBKaW5nbGVTZXNzaW9uLm9uSmluZ2xlRmF0YWxFcnJvcihzZWxmLCBlKTtcbiAgICAgICAgfVxuICAgICk7XG59O1xuXG5KaW5nbGVTZXNzaW9uLnByb3RvdHlwZS5hZGRJY2VDYW5kaWRhdGUgPSBmdW5jdGlvbiAoZWxlbSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAodGhpcy5wZWVyY29ubmVjdGlvbi5zaWduYWxpbmdTdGF0ZSA9PSAnY2xvc2VkJykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICghdGhpcy5wZWVyY29ubmVjdGlvbi5yZW1vdGVEZXNjcmlwdGlvbiAmJiB0aGlzLnBlZXJjb25uZWN0aW9uLnNpZ25hbGluZ1N0YXRlID09ICdoYXZlLWxvY2FsLW9mZmVyJykge1xuICAgICAgICBjb25zb2xlLmxvZygndHJpY2tsZSBpY2UgY2FuZGlkYXRlIGFycml2aW5nIGJlZm9yZSBzZXNzaW9uIGFjY2VwdC4uLicpO1xuICAgICAgICAvLyBjcmVhdGUgYSBQUkFOU1dFUiBmb3Igc2V0UmVtb3RlRGVzY3JpcHRpb25cbiAgICAgICAgaWYgKCF0aGlzLnJlbW90ZVNEUCkge1xuICAgICAgICAgICAgdmFyIGNvYmJsZWQgPSAndj0wXFxyXFxuJyArXG4gICAgICAgICAgICAgICAgJ289LSAnICsgJzE5MjM1MTg1MTYnICsgJyAyIElOIElQNCAwLjAuMC4wXFxyXFxuJyArLy8gRklYTUVcbiAgICAgICAgICAgICAgICAncz0tXFxyXFxuJyArXG4gICAgICAgICAgICAgICAgJ3Q9MCAwXFxyXFxuJztcbiAgICAgICAgICAgIC8vIGZpcnN0LCB0YWtlIHNvbWUgdGhpbmdzIGZyb20gdGhlIGxvY2FsIGRlc2NyaXB0aW9uXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubG9jYWxTRFAubWVkaWEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb2JibGVkICs9IFNEUFV0aWwuZmluZF9saW5lKHRoaXMubG9jYWxTRFAubWVkaWFbaV0sICdtPScpICsgJ1xcclxcbic7XG4gICAgICAgICAgICAgICAgY29iYmxlZCArPSBTRFBVdGlsLmZpbmRfbGluZXModGhpcy5sb2NhbFNEUC5tZWRpYVtpXSwgJ2E9cnRwbWFwOicpLmpvaW4oJ1xcclxcbicpICsgJ1xcclxcbic7XG4gICAgICAgICAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHRoaXMubG9jYWxTRFAubWVkaWFbaV0sICdhPW1pZDonKSkge1xuICAgICAgICAgICAgICAgICAgICBjb2JibGVkICs9IFNEUFV0aWwuZmluZF9saW5lKHRoaXMubG9jYWxTRFAubWVkaWFbaV0sICdhPW1pZDonKSArICdcXHJcXG4nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb2JibGVkICs9ICdhPWluYWN0aXZlXFxyXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMucmVtb3RlU0RQID0gbmV3IFNEUChjb2JibGVkKTtcbiAgICAgICAgfVxuICAgICAgICAvLyB0aGVuIGFkZCB0aGluZ3MgbGlrZSBpY2UgYW5kIGR0bHMgZnJvbSByZW1vdGUgY2FuZGlkYXRlXG4gICAgICAgIGVsZW0uZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNlbGYucmVtb3RlU0RQLm1lZGlhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHNlbGYucmVtb3RlU0RQLm1lZGlhW2ldLCAnYT1taWQ6JyArICQodGhpcykuYXR0cignbmFtZScpKSB8fFxuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbW90ZVNEUC5tZWRpYVtpXS5pbmRleE9mKCdtPScgKyAkKHRoaXMpLmF0dHIoJ25hbWUnKSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCFTRFBVdGlsLmZpbmRfbGluZShzZWxmLnJlbW90ZVNEUC5tZWRpYVtpXSwgJ2E9aWNlLXVmcmFnOicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdG1wID0gJCh0aGlzKS5maW5kKCd0cmFuc3BvcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVtb3RlU0RQLm1lZGlhW2ldICs9ICdhPWljZS11ZnJhZzonICsgdG1wLmF0dHIoJ3VmcmFnJykgKyAnXFxyXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVtb3RlU0RQLm1lZGlhW2ldICs9ICdhPWljZS1wd2Q6JyArIHRtcC5hdHRyKCdwd2QnKSArICdcXHJcXG4nO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG1wID0gJCh0aGlzKS5maW5kKCd0cmFuc3BvcnQ+ZmluZ2VycHJpbnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0bXAubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdGVTRFAubWVkaWFbaV0gKz0gJ2E9ZmluZ2VycHJpbnQ6JyArIHRtcC5hdHRyKCdoYXNoJykgKyAnICcgKyB0bXAudGV4dCgpICsgJ1xcclxcbic7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdubyBkdGxzIGZpbmdlcnByaW50ICh3ZWJydGMgaXNzdWUgIzE3MTg/KScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucmVtb3RlU0RQLm1lZGlhW2ldICs9ICdhPWNyeXB0bzoxIEFFU19DTV8xMjhfSE1BQ19TSEExXzgwIGlubGluZTpCQUFEQkFBREJBQURCQUFEQkFBREJBQURCQUFEQkFBREJBQURCQUFEXFxyXFxuJztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5yZW1vdGVTRFAucmF3ID0gdGhpcy5yZW1vdGVTRFAuc2Vzc2lvbiArIHRoaXMucmVtb3RlU0RQLm1lZGlhLmpvaW4oJycpO1xuXG4gICAgICAgIC8vIHdlIG5lZWQgYSBjb21wbGV0ZSBTRFAgd2l0aCBpY2UtdWZyYWcvaWNlLXB3ZCBpbiBhbGwgcGFydHNcbiAgICAgICAgLy8gdGhpcyBtYWtlcyB0aGUgYXNzdW1wdGlvbiB0aGF0IHRoZSBQUkFOU1dFUiBpcyBjb25zdHJ1Y3RlZCBzdWNoIHRoYXQgdGhlIGljZS11ZnJhZyBpcyBpbiBhbGwgbWVkaWFwYXJ0c1xuICAgICAgICAvLyBidXQgaXQgY291bGQgYmUgaW4gdGhlIHNlc3Npb24gcGFydCBhcyB3ZWxsLiBzaW5jZSB0aGUgY29kZSBhYm92ZSBjb25zdHJ1Y3RzIHRoaXMgc2RwIHRoaXMgY2FuJ3QgaGFwcGVuIGhvd2V2ZXJcbiAgICAgICAgdmFyIGlzY29tcGxldGUgPSB0aGlzLnJlbW90ZVNEUC5tZWRpYS5maWx0ZXIoZnVuY3Rpb24gKG1lZGlhcGFydCkge1xuICAgICAgICAgICAgcmV0dXJuIFNEUFV0aWwuZmluZF9saW5lKG1lZGlhcGFydCwgJ2E9aWNlLXVmcmFnOicpO1xuICAgICAgICB9KS5sZW5ndGggPT0gdGhpcy5yZW1vdGVTRFAubWVkaWEubGVuZ3RoO1xuXG4gICAgICAgIGlmIChpc2NvbXBsZXRlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnc2V0dGluZyBwcmFuc3dlcicpO1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICB0aGlzLnBlZXJjb25uZWN0aW9uLnNldFJlbW90ZURlc2NyaXB0aW9uKG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24oe3R5cGU6ICdwcmFuc3dlcicsIHNkcDogdGhpcy5yZW1vdGVTRFAucmF3IH0pLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3NldFJlbW90ZURlc2NyaXB0aW9uIHByYW5zd2VyIGZhaWxlZCcsIGUudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ3NldHRpbmcgcHJhbnN3ZXIgZmFpbGVkJywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvL2NvbnNvbGUubG9nKCdub3QgeWV0IHNldHRpbmcgcHJhbnN3ZXInKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBvcGVyYXRlIG9uIGVhY2ggY29udGVudCBlbGVtZW50XG4gICAgZWxlbS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy8gd291bGQgbG92ZSB0byBkZWFjdGl2YXRlIHRoaXMsIGJ1dCBmaXJlZm94IHN0aWxsIHJlcXVpcmVzIGl0XG4gICAgICAgIHZhciBpZHggPSAtMTtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzZWxmLnJlbW90ZVNEUC5tZWRpYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHNlbGYucmVtb3RlU0RQLm1lZGlhW2ldLCAnYT1taWQ6JyArICQodGhpcykuYXR0cignbmFtZScpKSB8fFxuICAgICAgICAgICAgICAgIHNlbGYucmVtb3RlU0RQLm1lZGlhW2ldLmluZGV4T2YoJ209JyArICQodGhpcykuYXR0cignbmFtZScpKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGlkeCA9IGk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlkeCA9PSAtMSkgeyAvLyBmYWxsIGJhY2sgdG8gbG9jYWxkZXNjcmlwdGlvblxuICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IHNlbGYubG9jYWxTRFAubWVkaWEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAoU0RQVXRpbC5maW5kX2xpbmUoc2VsZi5sb2NhbFNEUC5tZWRpYVtpXSwgJ2E9bWlkOicgKyAkKHRoaXMpLmF0dHIoJ25hbWUnKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2NhbFNEUC5tZWRpYVtpXS5pbmRleE9mKCdtPScgKyAkKHRoaXMpLmF0dHIoJ25hbWUnKSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaWR4ID0gaTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lID0gJCh0aGlzKS5hdHRyKCduYW1lJyk7XG4gICAgICAgIC8vIFRPRE86IGNoZWNrIGljZS1wd2QgYW5kIGljZS11ZnJhZz9cbiAgICAgICAgJCh0aGlzKS5maW5kKCd0cmFuc3BvcnQ+Y2FuZGlkYXRlJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbGluZSwgY2FuZGlkYXRlO1xuICAgICAgICAgICAgbGluZSA9IFNEUFV0aWwuY2FuZGlkYXRlRnJvbUppbmdsZSh0aGlzKTtcbiAgICAgICAgICAgIGNhbmRpZGF0ZSA9IG5ldyBSVENJY2VDYW5kaWRhdGUoe3NkcE1MaW5lSW5kZXg6IGlkeCxcbiAgICAgICAgICAgICAgICBzZHBNaWQ6IG5hbWUsXG4gICAgICAgICAgICAgICAgY2FuZGlkYXRlOiBsaW5lfSk7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uYWRkSWNlQ2FuZGlkYXRlKGNhbmRpZGF0ZSk7XG4gICAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignYWRkSWNlQ2FuZGlkYXRlIGZhaWxlZCcsIGUudG9TdHJpbmcoKSwgbGluZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pO1xufTtcblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuc2VuZEFuc3dlciA9IGZ1bmN0aW9uIChwcm92aXNpb25hbCkge1xuICAgIC8vY29uc29sZS5sb2coJ2NyZWF0ZUFuc3dlcicsIHByb3Zpc2lvbmFsKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5wZWVyY29ubmVjdGlvbi5jcmVhdGVBbnN3ZXIoXG4gICAgICAgIGZ1bmN0aW9uIChzZHApIHtcbiAgICAgICAgICAgIHNlbGYuY3JlYXRlZEFuc3dlcihzZHAsIHByb3Zpc2lvbmFsKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ2NyZWF0ZUFuc3dlciBmYWlsZWQnLCBlKTtcbiAgICAgICAgfSxcbiAgICAgICAgdGhpcy5tZWRpYV9jb25zdHJhaW50c1xuICAgICk7XG59O1xuXG5KaW5nbGVTZXNzaW9uLnByb3RvdHlwZS5jcmVhdGVkQW5zd2VyID0gZnVuY3Rpb24gKHNkcCwgcHJvdmlzaW9uYWwpIHtcbiAgICAvL2NvbnNvbGUubG9nKCdjcmVhdGVBbnN3ZXIgY2FsbGJhY2snKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5sb2NhbFNEUCA9IG5ldyBTRFAoc2RwLnNkcCk7XG4gICAgLy90aGlzLmxvY2FsU0RQLm1hbmdsZSgpO1xuICAgIHRoaXMudXNlcHJhbnN3ZXIgPSBwcm92aXNpb25hbCA9PT0gdHJ1ZTtcbiAgICBpZiAodGhpcy51c2V0cmlja2xlKSB7XG4gICAgICAgIGlmICh0aGlzLnVzZXByYW5zd2VyKSB7XG4gICAgICAgICAgICBzZHAudHlwZSA9ICdwcmFuc3dlcic7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubG9jYWxTRFAubWVkaWEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxvY2FsU0RQLm1lZGlhW2ldID0gdGhpcy5sb2NhbFNEUC5tZWRpYVtpXS5yZXBsYWNlKCdhPXNlbmRyZWN2XFxyXFxuJywgJ2E9aW5hY3RpdmVcXHJcXG4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMubG9jYWxTRFAucmF3ID0gdGhpcy5sb2NhbFNEUC5zZXNzaW9uICsgJ1xcclxcbicgKyB0aGlzLmxvY2FsU0RQLm1lZGlhLmpvaW4oJycpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgc2VuZEppbmdsZSA9IGZ1bmN0aW9uIChzc3Jjcykge1xuXG4gICAgICAgICAgICAgICAgdmFyIGFjY2VwdCA9ICRpcSh7dG86IHNlbGYucGVlcmppZCxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ3NldCd9KVxuICAgICAgICAgICAgICAgICAgICAuYygnamluZ2xlJywge3htbG5zOiAndXJuOnhtcHA6amluZ2xlOjEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc2Vzc2lvbi1hY2NlcHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhdG9yOiBzZWxmLmluaXRpYXRvcixcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3BvbmRlcjogc2VsZi5yZXNwb25kZXIsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaWQ6IHNlbGYuc2lkIH0pO1xuICAgICAgICAgICAgICAgIHZhciBwdWJsaWNMb2NhbERlc2MgPSBzaW11bGNhc3QucmV2ZXJzZVRyYW5zZm9ybUxvY2FsRGVzY3JpcHRpb24oc2RwKTtcbiAgICAgICAgICAgICAgICB2YXIgcHVibGljTG9jYWxTRFAgPSBuZXcgU0RQKHB1YmxpY0xvY2FsRGVzYy5zZHApO1xuICAgICAgICAgICAgICAgIHB1YmxpY0xvY2FsU0RQLnRvSmluZ2xlKGFjY2VwdCwgc2VsZi5pbml0aWF0b3IgPT0gc2VsZi5tZSA/ICdpbml0aWF0b3InIDogJ3Jlc3BvbmRlcicsIHNzcmNzKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbm5lY3Rpb24uc2VuZElRKGFjY2VwdCxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGFjayA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgYWNrLnNvdXJjZSA9ICdhbnN3ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcignYWNrLmppbmdsZScsIFtzZWxmLnNpZCwgYWNrXSk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChzdGFuemEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBlcnJvciA9ICgkKHN0YW56YSkuZmluZCgnZXJyb3InKS5sZW5ndGgpID8ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvZGU6ICQoc3RhbnphKS5maW5kKCdlcnJvcicpLmF0dHIoJ2NvZGUnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWFzb246ICQoc3RhbnphKS5maW5kKCdlcnJvciA6Zmlyc3QnKVswXS50YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgfTp7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yLnNvdXJjZSA9ICdhbnN3ZXInO1xuICAgICAgICAgICAgICAgICAgICAgICAgSmluZ2xlU2Vzc2lvbi5vbkppbmdsZUVycm9yKHNlbGYuc2lkLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIDEwMDAwKTtcbiAgICB9XG4gICAgc2RwLnNkcCA9IHRoaXMubG9jYWxTRFAucmF3O1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihzZHAsXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnc2V0TG9jYWxEZXNjcmlwdGlvbiBzdWNjZXNzJyk7XG4gICAgICAgICAgICBpZiAoc2VsZi51c2V0cmlja2xlICYmICFzZWxmLnVzZXByYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgc2VuZEppbmdsZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi5zZXRMb2NhbERlc2NyaXB0aW9uKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdzZXRMb2NhbERlc2NyaXB0aW9uIGZhaWxlZCcsIGUpO1xuICAgICAgICB9XG4gICAgKTtcbiAgICB2YXIgY2FuZHMgPSBTRFBVdGlsLmZpbmRfbGluZXModGhpcy5sb2NhbFNEUC5yYXcsICdhPWNhbmRpZGF0ZTonKTtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhbmRzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIHZhciBjYW5kID0gU0RQVXRpbC5wYXJzZV9pY2VjYW5kaWRhdGUoY2FuZHNbal0pO1xuICAgICAgICBpZiAoY2FuZC50eXBlID09ICdzcmZseCcpIHtcbiAgICAgICAgICAgIHRoaXMuaGFkc3R1bmNhbmRpZGF0ZSA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAoY2FuZC50eXBlID09ICdyZWxheScpIHtcbiAgICAgICAgICAgIHRoaXMuaGFkdHVybmNhbmRpZGF0ZSA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5KaW5nbGVTZXNzaW9uLnByb3RvdHlwZS5zZW5kVGVybWluYXRlID0gZnVuY3Rpb24gKHJlYXNvbiwgdGV4dCkge1xuICAgIHZhciBzZWxmID0gdGhpcyxcbiAgICAgICAgdGVybSA9ICRpcSh7dG86IHRoaXMucGVlcmppZCxcbiAgICAgICAgICAgIHR5cGU6ICdzZXQnfSlcbiAgICAgICAgICAgIC5jKCdqaW5nbGUnLCB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6MScsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnc2Vzc2lvbi10ZXJtaW5hdGUnLFxuICAgICAgICAgICAgICAgIGluaXRpYXRvcjogdGhpcy5pbml0aWF0b3IsXG4gICAgICAgICAgICAgICAgc2lkOiB0aGlzLnNpZH0pXG4gICAgICAgICAgICAuYygncmVhc29uJylcbiAgICAgICAgICAgIC5jKHJlYXNvbiB8fCAnc3VjY2VzcycpO1xuXG4gICAgaWYgKHRleHQpIHtcbiAgICAgICAgdGVybS51cCgpLmMoJ3RleHQnKS50KHRleHQpO1xuICAgIH1cblxuICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kSVEodGVybSxcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi5wZWVyY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgICAgICAgICAgc2VsZi5wZWVyY29ubmVjdGlvbiA9IG51bGw7XG4gICAgICAgICAgICBzZWxmLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgICAgdmFyIGFjayA9IHt9O1xuICAgICAgICAgICAgYWNrLnNvdXJjZSA9ICd0ZXJtaW5hdGUnO1xuICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcignYWNrLmppbmdsZScsIFtzZWxmLnNpZCwgYWNrXSk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChzdGFuemEpIHtcbiAgICAgICAgICAgIHZhciBlcnJvciA9ICgkKHN0YW56YSkuZmluZCgnZXJyb3InKS5sZW5ndGgpID8ge1xuICAgICAgICAgICAgICAgIGNvZGU6ICQoc3RhbnphKS5maW5kKCdlcnJvcicpLmF0dHIoJ2NvZGUnKSxcbiAgICAgICAgICAgICAgICByZWFzb246ICQoc3RhbnphKS5maW5kKCdlcnJvciA6Zmlyc3QnKVswXS50YWdOYW1lLFxuICAgICAgICAgICAgfTp7fTtcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2Fjay5qaW5nbGUnLCBbc2VsZi5zaWQsIGVycm9yXSk7XG4gICAgICAgIH0sXG4gICAgICAgIDEwMDAwKTtcbiAgICBpZiAodGhpcy5zdGF0c2ludGVydmFsICE9PSBudWxsKSB7XG4gICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKHRoaXMuc3RhdHNpbnRlcnZhbCk7XG4gICAgICAgIHRoaXMuc3RhdHNpbnRlcnZhbCA9IG51bGw7XG4gICAgfVxufTtcblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuYWRkU291cmNlID0gZnVuY3Rpb24gKGVsZW0sIGZyb21KaWQpIHtcblxuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyBGSVhNRTogZGlydHkgd2FpdGluZ1xuICAgIGlmICghdGhpcy5wZWVyY29ubmVjdGlvbi5sb2NhbERlc2NyaXB0aW9uKVxuICAgIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiYWRkU291cmNlIC0gbG9jYWxEZXNjcmlwdGlvbiBub3QgcmVhZHkgeWV0XCIpXG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNlbGYuYWRkU291cmNlKGVsZW0sIGZyb21KaWQpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIDIwMFxuICAgICAgICApO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc29sZS5sb2coJ2FkZHNzcmMnLCBuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG4gICAgY29uc29sZS5sb2coJ2ljZScsIHRoaXMucGVlcmNvbm5lY3Rpb24uaWNlQ29ubmVjdGlvblN0YXRlKTtcbiAgICB2YXIgc2RwID0gbmV3IFNEUCh0aGlzLnBlZXJjb25uZWN0aW9uLnJlbW90ZURlc2NyaXB0aW9uLnNkcCk7XG4gICAgdmFyIG15U2RwID0gbmV3IFNEUCh0aGlzLnBlZXJjb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb24uc2RwKTtcblxuICAgICQoZWxlbSkuZWFjaChmdW5jdGlvbiAoaWR4LCBjb250ZW50KSB7XG4gICAgICAgIHZhciBuYW1lID0gJChjb250ZW50KS5hdHRyKCduYW1lJyk7XG4gICAgICAgIHZhciBsaW5lcyA9ICcnO1xuICAgICAgICB0bXAgPSAkKGNvbnRlbnQpLmZpbmQoJ3NzcmMtZ3JvdXBbeG1sbnM9XCJ1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6c3NtYTowXCJdJykuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZW1hbnRpY3MgPSB0aGlzLmdldEF0dHJpYnV0ZSgnc2VtYW50aWNzJyk7XG4gICAgICAgICAgICB2YXIgc3NyY3MgPSAkKHRoaXMpLmZpbmQoJz5zb3VyY2UnKS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZSgnc3NyYycpO1xuICAgICAgICAgICAgfSkuZ2V0KCk7XG5cbiAgICAgICAgICAgIGlmIChzc3Jjcy5sZW5ndGggIT0gMCkge1xuICAgICAgICAgICAgICAgIGxpbmVzICs9ICdhPXNzcmMtZ3JvdXA6JyArIHNlbWFudGljcyArICcgJyArIHNzcmNzLmpvaW4oJyAnKSArICdcXHJcXG4nO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdG1wID0gJChjb250ZW50KS5maW5kKCdzb3VyY2VbeG1sbnM9XCJ1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6c3NtYTowXCJdJyk7IC8vIGNhbiBoYW5kbGUgYm90aCA+c291cmNlIGFuZCA+ZGVzY3JpcHRpb24+c291cmNlXG4gICAgICAgIHRtcC5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzc3JjID0gJCh0aGlzKS5hdHRyKCdzc3JjJyk7XG4gICAgICAgICAgICBpZihteVNkcC5jb250YWluc1NTUkMoc3NyYykpe1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRoaXMgaGFwcGVucyB3aGVuIG11bHRpcGxlIHBhcnRpY2lwYW50cyBjaGFuZ2UgdGhlaXIgc3RyZWFtcyBhdCB0aGUgc2FtZSB0aW1lIGFuZFxuICAgICAgICAgICAgICAgICAqIENvbGlicmlGb2N1cy5tb2RpZnlTb3VyY2VzIGhhdmUgdG8gd2FpdCBmb3Igc3RhYmxlIHN0YXRlLiBJbiB0aGUgbWVhbnRpbWUgbXVsdGlwbGVcbiAgICAgICAgICAgICAgICAgKiBhZGRzc3JjIGFyZSBzY2hlZHVsZWQgZm9yIHVwZGF0ZSBJUS4gU2VlXG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiR290IGFkZCBzdHJlYW0gcmVxdWVzdCBmb3IgbXkgb3duIHNzcmM6IFwiK3NzcmMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQodGhpcykuZmluZCgnPnBhcmFtZXRlcicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGxpbmVzICs9ICdhPXNzcmM6JyArIHNzcmMgKyAnICcgKyAkKHRoaXMpLmF0dHIoJ25hbWUnKTtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCd2YWx1ZScpICYmICQodGhpcykuYXR0cigndmFsdWUnKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzICs9ICc6JyArICQodGhpcykuYXR0cigndmFsdWUnKTtcbiAgICAgICAgICAgICAgICBsaW5lcyArPSAnXFxyXFxuJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgc2RwLm1lZGlhLmZvckVhY2goZnVuY3Rpb24obWVkaWEsIGlkeCkge1xuICAgICAgICAgICAgaWYgKCFTRFBVdGlsLmZpbmRfbGluZShtZWRpYSwgJ2E9bWlkOicgKyBuYW1lKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBzZHAubWVkaWFbaWR4XSArPSBsaW5lcztcbiAgICAgICAgICAgIGlmICghc2VsZi5hZGRzc3JjW2lkeF0pIHNlbGYuYWRkc3NyY1tpZHhdID0gJyc7XG4gICAgICAgICAgICBzZWxmLmFkZHNzcmNbaWR4XSArPSBsaW5lcztcbiAgICAgICAgfSk7XG4gICAgICAgIHNkcC5yYXcgPSBzZHAuc2Vzc2lvbiArIHNkcC5tZWRpYS5qb2luKCcnKTtcbiAgICB9KTtcbiAgICB0aGlzLm1vZGlmeVNvdXJjZXMoKTtcbn07XG5cbkppbmdsZVNlc3Npb24ucHJvdG90eXBlLnJlbW92ZVNvdXJjZSA9IGZ1bmN0aW9uIChlbGVtLCBmcm9tSmlkKSB7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gRklYTUU6IGRpcnR5IHdhaXRpbmdcbiAgICBpZiAoIXRoaXMucGVlcmNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbilcbiAgICB7XG4gICAgICAgIGNvbnNvbGUud2FybihcInJlbW92ZVNvdXJjZSAtIGxvY2FsRGVzY3JpcHRpb24gbm90IHJlYWR5IHlldFwiKVxuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKClcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZVNvdXJjZShlbGVtLCBmcm9tSmlkKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAyMDBcbiAgICAgICAgKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdyZW1vdmVzc3JjJywgbmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuICAgIGNvbnNvbGUubG9nKCdpY2UnLCB0aGlzLnBlZXJjb25uZWN0aW9uLmljZUNvbm5lY3Rpb25TdGF0ZSk7XG4gICAgdmFyIHNkcCA9IG5ldyBTRFAodGhpcy5wZWVyY29ubmVjdGlvbi5yZW1vdGVEZXNjcmlwdGlvbi5zZHApO1xuICAgIHZhciBteVNkcCA9IG5ldyBTRFAodGhpcy5wZWVyY29ubmVjdGlvbi5sb2NhbERlc2NyaXB0aW9uLnNkcCk7XG5cbiAgICAkKGVsZW0pLmVhY2goZnVuY3Rpb24gKGlkeCwgY29udGVudCkge1xuICAgICAgICB2YXIgbmFtZSA9ICQoY29udGVudCkuYXR0cignbmFtZScpO1xuICAgICAgICB2YXIgbGluZXMgPSAnJztcbiAgICAgICAgdG1wID0gJChjb250ZW50KS5maW5kKCdzc3JjLWdyb3VwW3htbG5zPVwidXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOnNzbWE6MFwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VtYW50aWNzID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3NlbWFudGljcycpO1xuICAgICAgICAgICAgdmFyIHNzcmNzID0gJCh0aGlzKS5maW5kKCc+c291cmNlJykubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRBdHRyaWJ1dGUoJ3NzcmMnKTtcbiAgICAgICAgICAgIH0pLmdldCgpO1xuXG4gICAgICAgICAgICBpZiAoc3NyY3MubGVuZ3RoICE9IDApIHtcbiAgICAgICAgICAgICAgICBsaW5lcyArPSAnYT1zc3JjLWdyb3VwOicgKyBzZW1hbnRpY3MgKyAnICcgKyBzc3Jjcy5qb2luKCcgJykgKyAnXFxyXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRtcCA9ICQoY29udGVudCkuZmluZCgnc291cmNlW3htbG5zPVwidXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOnNzbWE6MFwiXScpOyAvLyBjYW4gaGFuZGxlIGJvdGggPnNvdXJjZSBhbmQgPmRlc2NyaXB0aW9uPnNvdXJjZVxuICAgICAgICB0bXAuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgc3NyYyA9ICQodGhpcykuYXR0cignc3NyYycpO1xuICAgICAgICAgICAgLy8gVGhpcyBzaG91bGQgbmV2ZXIgaGFwcGVuLCBidXQgY2FuIGJlIHVzZWZ1bCBmb3IgYnVnIGRldGVjdGlvblxuICAgICAgICAgICAgaWYobXlTZHAuY29udGFpbnNTU1JDKHNzcmMpKXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiR290IHJlbW92ZSBzdHJlYW0gcmVxdWVzdCBmb3IgbXkgb3duIHNzcmM6IFwiK3NzcmMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgICQodGhpcykuZmluZCgnPnBhcmFtZXRlcicpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGxpbmVzICs9ICdhPXNzcmM6JyArIHNzcmMgKyAnICcgKyAkKHRoaXMpLmF0dHIoJ25hbWUnKTtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS5hdHRyKCd2YWx1ZScpICYmICQodGhpcykuYXR0cigndmFsdWUnKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgIGxpbmVzICs9ICc6JyArICQodGhpcykuYXR0cigndmFsdWUnKTtcbiAgICAgICAgICAgICAgICBsaW5lcyArPSAnXFxyXFxuJztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgc2RwLm1lZGlhLmZvckVhY2goZnVuY3Rpb24obWVkaWEsIGlkeCkge1xuICAgICAgICAgICAgaWYgKCFTRFBVdGlsLmZpbmRfbGluZShtZWRpYSwgJ2E9bWlkOicgKyBuYW1lKSlcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICBzZHAubWVkaWFbaWR4XSArPSBsaW5lcztcbiAgICAgICAgICAgIGlmICghc2VsZi5yZW1vdmVzc3JjW2lkeF0pIHNlbGYucmVtb3Zlc3NyY1tpZHhdID0gJyc7XG4gICAgICAgICAgICBzZWxmLnJlbW92ZXNzcmNbaWR4XSArPSBsaW5lcztcbiAgICAgICAgfSk7XG4gICAgICAgIHNkcC5yYXcgPSBzZHAuc2Vzc2lvbiArIHNkcC5tZWRpYS5qb2luKCcnKTtcbiAgICB9KTtcbiAgICB0aGlzLm1vZGlmeVNvdXJjZXMoKTtcbn07XG5cbkppbmdsZVNlc3Npb24ucHJvdG90eXBlLm1vZGlmeVNvdXJjZXMgPSBmdW5jdGlvbiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGlmICh0aGlzLnBlZXJjb25uZWN0aW9uLnNpZ25hbGluZ1N0YXRlID09ICdjbG9zZWQnKSByZXR1cm47XG4gICAgaWYgKCEodGhpcy5hZGRzc3JjLmxlbmd0aCB8fCB0aGlzLnJlbW92ZXNzcmMubGVuZ3RoIHx8IHRoaXMucGVuZGluZ29wICE9PSBudWxsIHx8IHRoaXMuc3dpdGNoc3RyZWFtcykpe1xuICAgICAgICAvLyBUaGVyZSBpcyBub3RoaW5nIHRvIGRvIHNpbmNlIHNjaGVkdWxlZCBqb2IgbWlnaHQgaGF2ZSBiZWVuIGV4ZWN1dGVkIGJ5IGFub3RoZXIgc3VjY2VlZGluZyBjYWxsXG4gICAgICAgIHRoaXMuc2V0TG9jYWxEZXNjcmlwdGlvbigpO1xuICAgICAgICBpZihzdWNjZXNzQ2FsbGJhY2spe1xuICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEZJWE1FOiB0aGlzIGlzIGEgYmlnIGhhY2tcbiAgICAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYnJ0Yy9pc3N1ZXMvZGV0YWlsP2lkPTI2ODhcbiAgICAvLyBeIGhhcyBiZWVuIGZpeGVkLlxuICAgIGlmICghKHRoaXMucGVlcmNvbm5lY3Rpb24uc2lnbmFsaW5nU3RhdGUgPT0gJ3N0YWJsZScgJiYgdGhpcy5wZWVyY29ubmVjdGlvbi5pY2VDb25uZWN0aW9uU3RhdGUgPT0gJ2Nvbm5lY3RlZCcpKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignbW9kaWZ5U291cmNlcyBub3QgeWV0JywgdGhpcy5wZWVyY29ubmVjdGlvbi5zaWduYWxpbmdTdGF0ZSwgdGhpcy5wZWVyY29ubmVjdGlvbi5pY2VDb25uZWN0aW9uU3RhdGUpO1xuICAgICAgICB0aGlzLndhaXQgPSB0cnVlO1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHsgc2VsZi5tb2RpZnlTb3VyY2VzKHN1Y2Nlc3NDYWxsYmFjayk7IH0sIDI1MCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHRoaXMud2FpdCkge1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHsgc2VsZi5tb2RpZnlTb3VyY2VzKHN1Y2Nlc3NDYWxsYmFjayk7IH0sIDI1MDApO1xuICAgICAgICB0aGlzLndhaXQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlc2V0IHN3aXRjaCBzdHJlYW1zIGZsYWdcbiAgICB0aGlzLnN3aXRjaHN0cmVhbXMgPSBmYWxzZTtcblxuICAgIHZhciBzZHAgPSBuZXcgU0RQKHRoaXMucGVlcmNvbm5lY3Rpb24ucmVtb3RlRGVzY3JpcHRpb24uc2RwKTtcblxuICAgIC8vIGFkZCBzb3VyY2VzXG4gICAgdGhpcy5hZGRzc3JjLmZvckVhY2goZnVuY3Rpb24obGluZXMsIGlkeCkge1xuICAgICAgICBzZHAubWVkaWFbaWR4XSArPSBsaW5lcztcbiAgICB9KTtcbiAgICB0aGlzLmFkZHNzcmMgPSBbXTtcblxuICAgIC8vIHJlbW92ZSBzb3VyY2VzXG4gICAgdGhpcy5yZW1vdmVzc3JjLmZvckVhY2goZnVuY3Rpb24obGluZXMsIGlkeCkge1xuICAgICAgICBsaW5lcyA9IGxpbmVzLnNwbGl0KCdcXHJcXG4nKTtcbiAgICAgICAgbGluZXMucG9wKCk7IC8vIHJlbW92ZSBlbXB0eSBsYXN0IGVsZW1lbnQ7XG4gICAgICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgc2RwLm1lZGlhW2lkeF0gPSBzZHAubWVkaWFbaWR4XS5yZXBsYWNlKGxpbmUgKyAnXFxyXFxuJywgJycpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgICB0aGlzLnJlbW92ZXNzcmMgPSBbXTtcblxuICAgIC8vIEZJWE1FOlxuICAgIC8vIHRoaXMgd2FzIGEgaGFjayBmb3IgdGhlIHNpdHVhdGlvbiB3aGVuIG9ubHkgb25lIHBlZXIgZXhpc3RzXG4gICAgLy8gaW4gdGhlIGNvbmZlcmVuY2UuXG4gICAgLy8gY2hlY2sgaWYgc3RpbGwgcmVxdWlyZWQgYW5kIHJlbW92ZVxuICAgIGlmIChzZHAubWVkaWFbMF0pXG4gICAgICAgIHNkcC5tZWRpYVswXSA9IHNkcC5tZWRpYVswXS5yZXBsYWNlKCdhPXJlY3Zvbmx5JywgJ2E9c2VuZHJlY3YnKTtcbiAgICBpZiAoc2RwLm1lZGlhWzFdKVxuICAgICAgICBzZHAubWVkaWFbMV0gPSBzZHAubWVkaWFbMV0ucmVwbGFjZSgnYT1yZWN2b25seScsICdhPXNlbmRyZWN2Jyk7XG5cbiAgICBzZHAucmF3ID0gc2RwLnNlc3Npb24gKyBzZHAubWVkaWEuam9pbignJyk7XG4gICAgdGhpcy5wZWVyY29ubmVjdGlvbi5zZXRSZW1vdGVEZXNjcmlwdGlvbihuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKHt0eXBlOiAnb2ZmZXInLCBzZHA6IHNkcC5yYXd9KSxcbiAgICAgICAgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgIGlmKHNlbGYuc2lnbmFsaW5nU3RhdGUgPT0gJ2Nsb3NlZCcpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiY3JlYXRlQW5zd2VyIGF0dGVtcHQgb24gY2xvc2VkIHN0YXRlXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZi5wZWVyY29ubmVjdGlvbi5jcmVhdGVBbnN3ZXIoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24obW9kaWZpZWRBbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2hhbmdlIHZpZGVvIGRpcmVjdGlvbiwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9qaXRzaS9qaXRtZWV0L2lzc3Vlcy80MVxuICAgICAgICAgICAgICAgICAgICBpZiAoc2VsZi5wZW5kaW5nb3AgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzZHAgPSBuZXcgU0RQKG1vZGlmaWVkQW5zd2VyLnNkcCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc2RwLm1lZGlhLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2goc2VsZi5wZW5kaW5nb3ApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnbXV0ZSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZHAubWVkaWFbMV0gPSBzZHAubWVkaWFbMV0ucmVwbGFjZSgnYT1zZW5kcmVjdicsICdhPXJlY3Zvbmx5Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAndW5tdXRlJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNkcC5tZWRpYVsxXSA9IHNkcC5tZWRpYVsxXS5yZXBsYWNlKCdhPXJlY3Zvbmx5JywgJ2E9c2VuZHJlY3YnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZHAucmF3ID0gc2RwLnNlc3Npb24gKyBzZHAubWVkaWEuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kaWZpZWRBbnN3ZXIuc2RwID0gc2RwLnJhdztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucGVuZGluZ29wID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiBwdXNoaW5nIGRvd24gYW4gYW5zd2VyIHdoaWxlIGljZSBjb25uZWN0aW9uIHN0YXRlXG4gICAgICAgICAgICAgICAgICAgIC8vIGlzIHN0aWxsIGNoZWNraW5nIGlzIGJhZC4uLlxuICAgICAgICAgICAgICAgICAgICAvL2NvbnNvbGUubG9nKHNlbGYucGVlcmNvbm5lY3Rpb24uaWNlQ29ubmVjdGlvblN0YXRlKTtcblxuICAgICAgICAgICAgICAgICAgICAvLyB0cnlpbmcgdG8gd29yayBhcm91bmQgYW5vdGhlciBjaHJvbWUgYnVnXG4gICAgICAgICAgICAgICAgICAgIC8vbW9kaWZpZWRBbnN3ZXIuc2RwID0gbW9kaWZpZWRBbnN3ZXIuc2RwLnJlcGxhY2UoL2E9c2V0dXA6YWN0aXZlL2csICdhPXNldHVwOmFjdHBhc3MnKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5wZWVyY29ubmVjdGlvbi5zZXRMb2NhbERlc2NyaXB0aW9uKG1vZGlmaWVkQW5zd2VyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZygnbW9kaWZpZWQgc2V0TG9jYWxEZXNjcmlwdGlvbiBvaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc2V0TG9jYWxEZXNjcmlwdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHN1Y2Nlc3NDYWxsYmFjayl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Y2Nlc3NDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ21vZGlmaWVkIHNldExvY2FsRGVzY3JpcHRpb24gZmFpbGVkJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignbW9kaWZpZWQgYW5zd2VyIGZhaWxlZCcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcignbW9kaWZ5IGZhaWxlZCcsIGVycm9yKTtcbiAgICAgICAgfVxuICAgICk7XG59O1xuXG4vKipcbiAqIFN3aXRjaGVzIHZpZGVvIHN0cmVhbXMuXG4gKiBAcGFyYW0gbmV3X3N0cmVhbSBuZXcgc3RyZWFtIHRoYXQgd2lsbCBiZSB1c2VkIGFzIHZpZGVvIG9mIHRoaXMgc2Vzc2lvbi5cbiAqIEBwYXJhbSBvbGRTdHJlYW0gb2xkIHZpZGVvIHN0cmVhbSBvZiB0aGlzIHNlc3Npb24uXG4gKiBAcGFyYW0gc3VjY2Vzc19jYWxsYmFjayBjYWxsYmFjayBleGVjdXRlZCBhZnRlciBzdWNjZXNzZnVsIHN0cmVhbSBzd2l0Y2guXG4gKi9cbkppbmdsZVNlc3Npb24ucHJvdG90eXBlLnN3aXRjaFN0cmVhbXMgPSBmdW5jdGlvbiAobmV3X3N0cmVhbSwgb2xkU3RyZWFtLCBzdWNjZXNzX2NhbGxiYWNrKSB7XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBSZW1lbWJlciBTRFAgdG8gZmlndXJlIG91dCBhZGRlZC9yZW1vdmVkIFNTUkNzXG4gICAgdmFyIG9sZFNkcCA9IG51bGw7XG4gICAgaWYoc2VsZi5wZWVyY29ubmVjdGlvbikge1xuICAgICAgICBpZihzZWxmLnBlZXJjb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb24pIHtcbiAgICAgICAgICAgIG9sZFNkcCA9IG5ldyBTRFAoc2VsZi5wZWVyY29ubmVjdGlvbi5sb2NhbERlc2NyaXB0aW9uLnNkcCk7XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5wZWVyY29ubmVjdGlvbi5yZW1vdmVTdHJlYW0ob2xkU3RyZWFtLCB0cnVlKTtcbiAgICAgICAgc2VsZi5wZWVyY29ubmVjdGlvbi5hZGRTdHJlYW0obmV3X3N0cmVhbSk7XG4gICAgfVxuXG4gICAgUlRDLnN3aXRjaFZpZGVvU3RyZWFtcyhuZXdfc3RyZWFtLCBvbGRTdHJlYW0pO1xuXG4gICAgLy8gQ29uZmVyZW5jZSBpcyBub3QgYWN0aXZlXG4gICAgaWYoIW9sZFNkcCB8fCAhc2VsZi5wZWVyY29ubmVjdGlvbikge1xuICAgICAgICBzdWNjZXNzX2NhbGxiYWNrKCk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBzZWxmLnN3aXRjaHN0cmVhbXMgPSB0cnVlO1xuICAgIHNlbGYubW9kaWZ5U291cmNlcyhmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc29sZS5sb2coJ21vZGlmeSBzb3VyY2VzIGRvbmUnKTtcblxuICAgICAgICBzdWNjZXNzX2NhbGxiYWNrKCk7XG5cbiAgICAgICAgdmFyIG5ld1NkcCA9IG5ldyBTRFAoc2VsZi5wZWVyY29ubmVjdGlvbi5sb2NhbERlc2NyaXB0aW9uLnNkcCk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiU0RQc1wiLCBvbGRTZHAsIG5ld1NkcCk7XG4gICAgICAgIHNlbGYubm90aWZ5TXlTU1JDVXBkYXRlKG9sZFNkcCwgbmV3U2RwKTtcbiAgICB9KTtcbn07XG5cbi8qKlxuICogRmlndXJlcyBvdXQgYWRkZWQvcmVtb3ZlZCBzc3JjcyBhbmQgc2VuZCB1cGRhdGUgSVFzLlxuICogQHBhcmFtIG9sZF9zZHAgU0RQIG9iamVjdCBmb3Igb2xkIGRlc2NyaXB0aW9uLlxuICogQHBhcmFtIG5ld19zZHAgU0RQIG9iamVjdCBmb3IgbmV3IGRlc2NyaXB0aW9uLlxuICovXG5KaW5nbGVTZXNzaW9uLnByb3RvdHlwZS5ub3RpZnlNeVNTUkNVcGRhdGUgPSBmdW5jdGlvbiAob2xkX3NkcCwgbmV3X3NkcCkge1xuXG4gICAgaWYgKCEodGhpcy5wZWVyY29ubmVjdGlvbi5zaWduYWxpbmdTdGF0ZSA9PSAnc3RhYmxlJyAmJlxuICAgICAgICB0aGlzLnBlZXJjb25uZWN0aW9uLmljZUNvbm5lY3Rpb25TdGF0ZSA9PSAnY29ubmVjdGVkJykpe1xuICAgICAgICBjb25zb2xlLmxvZyhcIlRvbyBlYXJseSB0byBzZW5kIHVwZGF0ZXNcIik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBzZW5kIHNvdXJjZS1yZW1vdmUgSVEuXG4gICAgc2RwRGlmZmVyID0gbmV3IFNEUERpZmZlcihuZXdfc2RwLCBvbGRfc2RwKTtcbiAgICB2YXIgcmVtb3ZlID0gJGlxKHt0bzogdGhpcy5wZWVyamlkLCB0eXBlOiAnc2V0J30pXG4gICAgICAgIC5jKCdqaW5nbGUnLCB7XG4gICAgICAgICAgICB4bWxuczogJ3Vybjp4bXBwOmppbmdsZToxJyxcbiAgICAgICAgICAgIGFjdGlvbjogJ3NvdXJjZS1yZW1vdmUnLFxuICAgICAgICAgICAgaW5pdGlhdG9yOiB0aGlzLmluaXRpYXRvcixcbiAgICAgICAgICAgIHNpZDogdGhpcy5zaWRcbiAgICAgICAgfVxuICAgICk7XG4gICAgdmFyIHJlbW92ZWQgPSBzZHBEaWZmZXIudG9KaW5nbGUocmVtb3ZlKTtcbiAgICBpZiAocmVtb3ZlZCkge1xuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZElRKHJlbW92ZSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ2dvdCByZW1vdmUgcmVzdWx0JywgcmVzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignZ290IHJlbW92ZSBlcnJvcicsIGVycik7XG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5sb2coJ3JlbW92YWwgbm90IG5lY2Vzc2FyeScpO1xuICAgIH1cblxuICAgIC8vIHNlbmQgc291cmNlLWFkZCBJUS5cbiAgICB2YXIgc2RwRGlmZmVyID0gbmV3IFNEUERpZmZlcihvbGRfc2RwLCBuZXdfc2RwKTtcbiAgICB2YXIgYWRkID0gJGlxKHt0bzogdGhpcy5wZWVyamlkLCB0eXBlOiAnc2V0J30pXG4gICAgICAgIC5jKCdqaW5nbGUnLCB7XG4gICAgICAgICAgICB4bWxuczogJ3Vybjp4bXBwOmppbmdsZToxJyxcbiAgICAgICAgICAgIGFjdGlvbjogJ3NvdXJjZS1hZGQnLFxuICAgICAgICAgICAgaW5pdGlhdG9yOiB0aGlzLmluaXRpYXRvcixcbiAgICAgICAgICAgIHNpZDogdGhpcy5zaWRcbiAgICAgICAgfVxuICAgICk7XG4gICAgdmFyIGFkZGVkID0gc2RwRGlmZmVyLnRvSmluZ2xlKGFkZCk7XG4gICAgaWYgKGFkZGVkKSB7XG4gICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kSVEoYWRkLFxuICAgICAgICAgICAgZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnZ290IGFkZCByZXN1bHQnLCByZXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdnb3QgYWRkIGVycm9yJywgZXJyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25zb2xlLmxvZygnYWRkaXRpb24gbm90IG5lY2Vzc2FyeScpO1xuICAgIH1cbn07XG5cbi8qKlxuICogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSAobG9jYWwpIHZpZGVvIGlzIG11dGUgaS5lLiBhbGwgdmlkZW8gdHJhY2tzIGFyZVxuICogZGlzYWJsZWQuXG4gKlxuICogQHJldHVybiA8dHQ+dHJ1ZTwvdHQ+IGlmIHRoZSAobG9jYWwpIHZpZGVvIGlzIG11dGUgaS5lLiBhbGwgdmlkZW8gdHJhY2tzIGFyZVxuICogZGlzYWJsZWQ7IG90aGVyd2lzZSwgPHR0PmZhbHNlPC90dD5cbiAqL1xuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuaXNWaWRlb011dGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHRyYWNrcyA9IFJUQy5sb2NhbFZpZGVvLmdldFZpZGVvVHJhY2tzKCk7XG4gICAgdmFyIG11dGUgPSB0cnVlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0cmFja3MubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgaWYgKHRyYWNrc1tpXS5lbmFibGVkKSB7XG4gICAgICAgICAgICBtdXRlID0gZmFsc2U7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbXV0ZTtcbn07XG5cbi8qKlxuICogTXV0ZXMvdW5tdXRlcyB0aGUgKGxvY2FsKSB2aWRlbyBpLmUuIGVuYWJsZXMvZGlzYWJsZXMgYWxsIHZpZGVvIHRyYWNrcy5cbiAqXG4gKiBAcGFyYW0gbXV0ZSA8dHQ+dHJ1ZTwvdHQ+IHRvIG11dGUgdGhlIChsb2NhbCkgdmlkZW8gaS5lLiB0byBkaXNhYmxlIGFsbCB2aWRlb1xuICogdHJhY2tzOyBvdGhlcndpc2UsIDx0dD5mYWxzZTwvdHQ+XG4gKiBAcGFyYW0gY2FsbGJhY2sgYSBmdW5jdGlvbiB0byBiZSBpbnZva2VkIHdpdGggPHR0Pm11dGU8L3R0PiBhZnRlciBhbGwgdmlkZW9cbiAqIHRyYWNrcyBoYXZlIGJlZW4gZW5hYmxlZC9kaXNhYmxlZC4gVGhlIGZ1bmN0aW9uIG1heSwgb3B0aW9uYWxseSwgcmV0dXJuXG4gKiBhbm90aGVyIGZ1bmN0aW9uIHdoaWNoIGlzIHRvIGJlIGludm9rZWQgYWZ0ZXIgdGhlIHdob2xlIG11dGUvdW5tdXRlIG9wZXJhdGlvblxuICogaGFzIGNvbXBsZXRlZCBzdWNjZXNzZnVsbHkuXG4gKiBAcGFyYW0gb3B0aW9ucyBhbiBvYmplY3Qgd2hpY2ggc3BlY2lmaWVzIG9wdGlvbmFsIGFyZ3VtZW50cyBzdWNoIGFzIHRoZVxuICogPHR0PmJvb2xlYW48L3R0PiBrZXkgPHR0PmJ5VXNlcjwvdHQ+IHdpdGggZGVmYXVsdCB2YWx1ZSA8dHQ+dHJ1ZTwvdHQ+IHdoaWNoXG4gKiBzcGVjaWZpZXMgd2hldGhlciB0aGUgbWV0aG9kIHdhcyBpbml0aWF0ZWQgaW4gcmVzcG9uc2UgdG8gYSB1c2VyIGNvbW1hbmQgKGluXG4gKiBjb250cmFzdCB0byBhbiBhdXRvbWF0aWMgZGVjaXNpb24gbWFkZSBieSB0aGUgYXBwbGljYXRpb24gbG9naWMpXG4gKi9cbkppbmdsZVNlc3Npb24ucHJvdG90eXBlLnNldFZpZGVvTXV0ZSA9IGZ1bmN0aW9uIChtdXRlLCBjYWxsYmFjaywgb3B0aW9ucykge1xuICAgIHZhciBieVVzZXI7XG5cbiAgICBpZiAob3B0aW9ucykge1xuICAgICAgICBieVVzZXIgPSBvcHRpb25zLmJ5VXNlcjtcbiAgICAgICAgaWYgKHR5cGVvZiBieVVzZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBieVVzZXIgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgYnlVc2VyID0gdHJ1ZTtcbiAgICB9XG4gICAgLy8gVGhlIHVzZXIncyBjb21tYW5kIHRvIG11dGUgdGhlIChsb2NhbCkgdmlkZW8gdGFrZXMgcHJlY2VkZW5jZSBvdmVyIGFueVxuICAgIC8vIGF1dG9tYXRpYyBkZWNpc2lvbiBtYWRlIGJ5IHRoZSBhcHBsaWNhdGlvbiBsb2dpYy5cbiAgICBpZiAoYnlVc2VyKSB7XG4gICAgICAgIHRoaXMudmlkZW9NdXRlQnlVc2VyID0gbXV0ZTtcbiAgICB9IGVsc2UgaWYgKHRoaXMudmlkZW9NdXRlQnlVc2VyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGxvY2FsQ2FsbGJhY2sgPSBmdW5jdGlvbiAobXV0ZSkge1xuICAgICAgICBzZWxmLmNvbm5lY3Rpb24uZW11Yy5hZGRWaWRlb0luZm9Ub1ByZXNlbmNlKG11dGUpO1xuICAgICAgICBzZWxmLmNvbm5lY3Rpb24uZW11Yy5zZW5kUHJlc2VuY2UoKTtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG11dGUpXG4gICAgfTtcblxuICAgIGlmIChtdXRlID09IFJUQy5sb2NhbFZpZGVvLmlzTXV0ZWQoKSlcbiAgICB7XG4gICAgICAgIC8vIEV2ZW4gaWYgbm8gY2hhbmdlIG9jY3VycywgdGhlIHNwZWNpZmllZCBjYWxsYmFjayBpcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgLy8gVGhlIHNwZWNpZmllZCBjYWxsYmFjayBtYXksIG9wdGlvbmFsbHksIHJldHVybiBhIHN1Y2Nlc3NDYWxsYmFja1xuICAgICAgICAvLyB3aGljaCBpcyB0byBiZSBleGVjdXRlZCBhcyB3ZWxsLlxuICAgICAgICB2YXIgc3VjY2Vzc0NhbGxiYWNrID0gbG9jYWxDYWxsYmFjayhtdXRlKTtcblxuICAgICAgICBpZiAoc3VjY2Vzc0NhbGxiYWNrKSB7XG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIFJUQy5sb2NhbFZpZGVvLnNldE11dGUoIW11dGUpO1xuXG4gICAgICAgIHRoaXMuaGFyZE11dGVWaWRlbyhtdXRlKTtcblxuICAgICAgICB0aGlzLm1vZGlmeVNvdXJjZXMobG9jYWxDYWxsYmFjayhtdXRlKSk7XG4gICAgfVxufTtcblxuLy8gU0RQLWJhc2VkIG11dGUgYnkgZ29pbmcgcmVjdm9ubHkvc2VuZHJlY3Zcbi8vIEZJWE1FOiBzaG91bGQgcHJvYmFibHkgYmxhY2sgb3V0IHRoZSBzY3JlZW4gYXMgd2VsbFxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUudG9nZ2xlVmlkZW9NdXRlID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5zZXJ2aWNlLnNldFZpZGVvTXV0ZShSVEMubG9jYWxWaWRlby5pc011dGVkKCksIGNhbGxiYWNrKTtcbn07XG5cbkppbmdsZVNlc3Npb24ucHJvdG90eXBlLmhhcmRNdXRlVmlkZW8gPSBmdW5jdGlvbiAobXV0ZWQpIHtcbiAgICB0aGlzLnBlbmRpbmdvcCA9IG11dGVkID8gJ211dGUnIDogJ3VubXV0ZSc7XG59O1xuXG5KaW5nbGVTZXNzaW9uLnByb3RvdHlwZS5zZW5kTXV0ZSA9IGZ1bmN0aW9uIChtdXRlZCwgY29udGVudCkge1xuICAgIHZhciBpbmZvID0gJGlxKHt0bzogdGhpcy5wZWVyamlkLFxuICAgICAgICB0eXBlOiAnc2V0J30pXG4gICAgICAgIC5jKCdqaW5nbGUnLCB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6MScsXG4gICAgICAgICAgICBhY3Rpb246ICdzZXNzaW9uLWluZm8nLFxuICAgICAgICAgICAgaW5pdGlhdG9yOiB0aGlzLmluaXRpYXRvcixcbiAgICAgICAgICAgIHNpZDogdGhpcy5zaWQgfSk7XG4gICAgaW5mby5jKG11dGVkID8gJ211dGUnIDogJ3VubXV0ZScsIHt4bWxuczogJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDppbmZvOjEnfSk7XG4gICAgaW5mby5hdHRycyh7J2NyZWF0b3InOiB0aGlzLm1lID09IHRoaXMuaW5pdGlhdG9yID8gJ2NyZWF0b3InIDogJ3Jlc3BvbmRlcid9KTtcbiAgICBpZiAoY29udGVudCkge1xuICAgICAgICBpbmZvLmF0dHJzKHsnbmFtZSc6IGNvbnRlbnR9KTtcbiAgICB9XG4gICAgdGhpcy5jb25uZWN0aW9uLnNlbmQoaW5mbyk7XG59O1xuXG5KaW5nbGVTZXNzaW9uLnByb3RvdHlwZS5zZW5kUmluZ2luZyA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgaW5mbyA9ICRpcSh7dG86IHRoaXMucGVlcmppZCxcbiAgICAgICAgdHlwZTogJ3NldCd9KVxuICAgICAgICAuYygnamluZ2xlJywge3htbG5zOiAndXJuOnhtcHA6amluZ2xlOjEnLFxuICAgICAgICAgICAgYWN0aW9uOiAnc2Vzc2lvbi1pbmZvJyxcbiAgICAgICAgICAgIGluaXRpYXRvcjogdGhpcy5pbml0aWF0b3IsXG4gICAgICAgICAgICBzaWQ6IHRoaXMuc2lkIH0pO1xuICAgIGluZm8uYygncmluZ2luZycsIHt4bWxuczogJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDppbmZvOjEnfSk7XG4gICAgdGhpcy5jb25uZWN0aW9uLnNlbmQoaW5mbyk7XG59O1xuXG5KaW5nbGVTZXNzaW9uLnByb3RvdHlwZS5nZXRTdGF0cyA9IGZ1bmN0aW9uIChpbnRlcnZhbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgcmVjdiA9IHthdWRpbzogMCwgdmlkZW86IDB9O1xuICAgIHZhciBsb3N0ID0ge2F1ZGlvOiAwLCB2aWRlbzogMH07XG4gICAgdmFyIGxhc3RyZWN2ID0ge2F1ZGlvOiAwLCB2aWRlbzogMH07XG4gICAgdmFyIGxhc3Rsb3N0ID0ge2F1ZGlvOiAwLCB2aWRlbzogMH07XG4gICAgdmFyIGxvc3MgPSB7YXVkaW86IDAsIHZpZGVvOiAwfTtcbiAgICB2YXIgZGVsdGEgPSB7YXVkaW86IDAsIHZpZGVvOiAwfTtcbiAgICB0aGlzLnN0YXRzaW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoc2VsZiAmJiBzZWxmLnBlZXJjb25uZWN0aW9uICYmIHNlbGYucGVlcmNvbm5lY3Rpb24uZ2V0U3RhdHMpIHtcbiAgICAgICAgICAgIHNlbGYucGVlcmNvbm5lY3Rpb24uZ2V0U3RhdHMoZnVuY3Rpb24gKHN0YXRzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBzdGF0cy5yZXN1bHQoKTtcbiAgICAgICAgICAgICAgICAvLyBUT0RPOiB0aGVyZSBhcmUgc28gbXVjaCBzdGF0aXN0aWNzIHlvdSBjYW4gZ2V0IGZyb20gdGhpcy4uXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXN1bHRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW2ldLnR5cGUgPT0gJ3NzcmMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcGFja2V0c3JlY3YgPSByZXN1bHRzW2ldLnN0YXQoJ3BhY2tldHNSZWNlaXZlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHBhY2tldHNsb3N0ID0gcmVzdWx0c1tpXS5zdGF0KCdwYWNrZXRzTG9zdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhY2tldHNyZWN2ICYmIHBhY2tldHNsb3N0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFja2V0c3JlY3YgPSBwYXJzZUludChwYWNrZXRzcmVjdiwgMTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhY2tldHNsb3N0ID0gcGFyc2VJbnQocGFja2V0c2xvc3QsIDEwKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzW2ldLnN0YXQoJ2dvb2dGcmFtZVJhdGVSZWNlaXZlZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3Rsb3N0LnZpZGVvID0gbG9zdC52aWRlbztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGFzdHJlY3YudmlkZW8gPSByZWN2LnZpZGVvO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWN2LnZpZGVvID0gcGFja2V0c3JlY3Y7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvc3QudmlkZW8gPSBwYWNrZXRzbG9zdDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYXN0bG9zdC5hdWRpbyA9IGxvc3QuYXVkaW87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxhc3RyZWN2LmF1ZGlvID0gcmVjdi5hdWRpbztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjdi5hdWRpbyA9IHBhY2tldHNyZWN2O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb3N0LmF1ZGlvID0gcGFja2V0c2xvc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGRlbHRhLmF1ZGlvID0gcmVjdi5hdWRpbyAtIGxhc3RyZWN2LmF1ZGlvO1xuICAgICAgICAgICAgICAgIGRlbHRhLnZpZGVvID0gcmVjdi52aWRlbyAtIGxhc3RyZWN2LnZpZGVvO1xuICAgICAgICAgICAgICAgIGxvc3MuYXVkaW8gPSAoZGVsdGEuYXVkaW8gPiAwKSA/IE1hdGguY2VpbCgxMDAgKiAobG9zdC5hdWRpbyAtIGxhc3Rsb3N0LmF1ZGlvKSAvIGRlbHRhLmF1ZGlvKSA6IDA7XG4gICAgICAgICAgICAgICAgbG9zcy52aWRlbyA9IChkZWx0YS52aWRlbyA+IDApID8gTWF0aC5jZWlsKDEwMCAqIChsb3N0LnZpZGVvIC0gbGFzdGxvc3QudmlkZW8pIC8gZGVsdGEudmlkZW8pIDogMDtcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdwYWNrZXRsb3NzLmppbmdsZScsIFtzZWxmLnNpZCwgbG9zc10pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LCBpbnRlcnZhbCB8fCAzMDAwKTtcbiAgICByZXR1cm4gdGhpcy5zdGF0c2ludGVydmFsO1xufTtcblxuSmluZ2xlU2Vzc2lvbi5vbkppbmdsZUVycm9yID0gZnVuY3Rpb24gKHNlc3Npb24sIGVycm9yKVxue1xuICAgIGNvbnNvbGUuZXJyb3IoXCJKaW5nbGUgZXJyb3JcIiwgZXJyb3IpO1xufVxuXG5KaW5nbGVTZXNzaW9uLm9uSmluZ2xlRmF0YWxFcnJvciA9IGZ1bmN0aW9uIChzZXNzaW9uLCBlcnJvcilcbntcbiAgICB0aGlzLnNlcnZpY2Uuc2Vzc2lvblRlcm1pbmF0ZWQgPSB0cnVlO1xuICAgIGNvbm5lY3Rpb24uZW11Yy5kb0xlYXZlKCk7XG4gICAgVUkubWVzc2FnZUhhbmRsZXIuc2hvd0Vycm9yKCAgXCJTb3JyeVwiLFxuICAgICAgICBcIkludGVybmFsIGFwcGxpY2F0aW9uIGVycm9yW3NldFJlbW90ZURlc2NyaXB0aW9uXVwiKTtcbn1cblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUuc2V0TG9jYWxEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAvLyBwdXQgb3VyIHNzcmNzIGludG8gcHJlc2VuY2Ugc28gb3RoZXIgY2xpZW50cyBjYW4gaWRlbnRpZnkgb3VyIHN0cmVhbVxuICAgIHZhciBuZXdzc3JjcyA9IFtdO1xuICAgIHZhciBtZWRpYSA9IHNpbXVsY2FzdC5wYXJzZU1lZGlhKHRoaXMucGVlcmNvbm5lY3Rpb24ubG9jYWxEZXNjcmlwdGlvbik7XG4gICAgbWVkaWEuZm9yRWFjaChmdW5jdGlvbiAobWVkaWEpIHtcblxuICAgICAgICBpZihPYmplY3Qua2V5cyhtZWRpYS5zb3VyY2VzKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAvLyBUT0RPKGdwKSBtYXliZSBleGNsdWRlIEZJRCBzdHJlYW1zP1xuICAgICAgICAgICAgT2JqZWN0LmtleXMobWVkaWEuc291cmNlcykuZm9yRWFjaChmdW5jdGlvbiAoc3NyYykge1xuICAgICAgICAgICAgICAgIG5ld3NzcmNzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICAnc3NyYyc6IHNzcmMsXG4gICAgICAgICAgICAgICAgICAgICd0eXBlJzogbWVkaWEudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgJ2RpcmVjdGlvbic6IG1lZGlhLmRpcmVjdGlvblxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZih0aGlzLmxvY2FsU3RyZWFtc1NTUkMgJiYgdGhpcy5sb2NhbFN0cmVhbXNTU1JDW21lZGlhLnR5cGVdKVxuICAgICAgICB7XG4gICAgICAgICAgICBuZXdzc3Jjcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAnc3NyYyc6IHRoaXMubG9jYWxTdHJlYW1zU1NSQ1ttZWRpYS50eXBlXSxcbiAgICAgICAgICAgICAgICAndHlwZSc6IG1lZGlhLnR5cGUsXG4gICAgICAgICAgICAgICAgJ2RpcmVjdGlvbic6IG1lZGlhLmRpcmVjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH0pO1xuXG4gICAgY29uc29sZS5sb2coJ25ldyBzc3JjcycsIG5ld3NzcmNzKTtcblxuICAgIC8vIEhhdmUgdG8gY2xlYXIgcHJlc2VuY2UgbWFwIHRvIGdldCByaWQgb2YgcmVtb3ZlZCBzdHJlYW1zXG4gICAgdGhpcy5jb25uZWN0aW9uLmVtdWMuY2xlYXJQcmVzZW5jZU1lZGlhKCk7XG5cbiAgICBpZiAobmV3c3NyY3MubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8PSBuZXdzc3Jjcy5sZW5ndGg7IGkgKyspIHtcbiAgICAgICAgICAgIC8vIENoYW5nZSB2aWRlbyB0eXBlIHRvIHNjcmVlblxuICAgICAgICAgICAgaWYgKG5ld3NzcmNzW2ktMV0udHlwZSA9PT0gJ3ZpZGVvJyAmJiBkZXNrdG9wc2hhcmluZy5pc1VzaW5nU2NyZWVuU3RyZWFtKCkpIHtcbiAgICAgICAgICAgICAgICBuZXdzc3Jjc1tpLTFdLnR5cGUgPSAnc2NyZWVuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5lbXVjLmFkZE1lZGlhVG9QcmVzZW5jZShpLFxuICAgICAgICAgICAgICAgIG5ld3NzcmNzW2ktMV0udHlwZSwgbmV3c3NyY3NbaS0xXS5zc3JjLCBuZXdzc3Jjc1tpLTFdLmRpcmVjdGlvbik7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNvbm5lY3Rpb24uZW11Yy5zZW5kUHJlc2VuY2UoKTtcbiAgICB9XG59XG5cbi8vIGFuIGF0dGVtcHQgdG8gd29yayBhcm91bmQgaHR0cHM6Ly9naXRodWIuY29tL2ppdHNpL2ppdG1lZXQvaXNzdWVzLzMyXG5mdW5jdGlvbiBzZW5kS2V5ZnJhbWUocGMpIHtcbiAgICBjb25zb2xlLmxvZygnc2VuZGtleWZyYW1lJywgcGMuaWNlQ29ubmVjdGlvblN0YXRlKTtcbiAgICBpZiAocGMuaWNlQ29ubmVjdGlvblN0YXRlICE9PSAnY29ubmVjdGVkJykgcmV0dXJuOyAvLyBzYWZlLi4uXG4gICAgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24oXG4gICAgICAgIHBjLnJlbW90ZURlc2NyaXB0aW9uLFxuICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBwYy5jcmVhdGVBbnN3ZXIoXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKG1vZGlmaWVkQW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHBjLnNldExvY2FsRGVzY3JpcHRpb24oXG4gICAgICAgICAgICAgICAgICAgICAgICBtb2RpZmllZEFuc3dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBub29wXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3RyaWdnZXJLZXlmcmFtZSBzZXRMb2NhbERlc2NyaXB0aW9uIGZhaWxlZCcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBVSS5tZXNzYWdlSGFuZGxlci5zaG93RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndHJpZ2dlcktleWZyYW1lIGNyZWF0ZUFuc3dlciBmYWlsZWQnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIFVJLm1lc3NhZ2VIYW5kbGVyLnNob3dFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3RyaWdnZXJLZXlmcmFtZSBzZXRSZW1vdGVEZXNjcmlwdGlvbiBmYWlsZWQnLCBlcnJvcik7XG4gICAgICAgICAgICBVSS5tZXNzYWdlSGFuZGxlci5zaG93RXJyb3IoKTtcbiAgICAgICAgfVxuICAgICk7XG59XG5cblxuSmluZ2xlU2Vzc2lvbi5wcm90b3R5cGUucmVtb3RlU3RyZWFtQWRkZWQgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgdGhlc3NyYztcblxuICAgIC8vIGxvb2sgdXAgYW4gYXNzb2NpYXRlZCBKSUQgZm9yIGEgc3RyZWFtIGlkXG4gICAgaWYgKGRhdGEuc3RyZWFtLmlkICYmIGRhdGEuc3RyZWFtLmlkLmluZGV4T2YoJ21peGVkbXNsYWJlbCcpID09PSAtMSkge1xuICAgICAgICAvLyBsb29rIG9ubHkgYXQgYT1zc3JjOiBhbmQgX25vdF8gYXQgYT1zc3JjLWdyb3VwOiBsaW5lc1xuXG4gICAgICAgIHZhciBzc3JjbGluZXNcbiAgICAgICAgICAgID0gU0RQVXRpbC5maW5kX2xpbmVzKHRoaXMucGVlcmNvbm5lY3Rpb24ucmVtb3RlRGVzY3JpcHRpb24uc2RwLCAnYT1zc3JjOicpO1xuICAgICAgICBzc3JjbGluZXMgPSBzc3JjbGluZXMuZmlsdGVyKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAvLyBOT1RFKGdwKSBwcmV2aW91c2x5IHdlIGZpbHRlcmVkIG9uIHRoZSBtc2xhYmVsLCBidXQgdGhhdCBwcm9wZXJ0eVxuICAgICAgICAgICAgLy8gaXMgbm90IGFsd2F5cyBwcmVzZW50LlxuICAgICAgICAgICAgLy8gcmV0dXJuIGxpbmUuaW5kZXhPZignbXNsYWJlbDonICsgZGF0YS5zdHJlYW0ubGFiZWwpICE9PSAtMTtcblxuICAgICAgICAgICAgcmV0dXJuICgobGluZS5pbmRleE9mKCdtc2lkOicgKyBkYXRhLnN0cmVhbS5pZCkgIT09IC0xKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoc3NyY2xpbmVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhlc3NyYyA9IHNzcmNsaW5lc1swXS5zdWJzdHJpbmcoNykuc3BsaXQoJyAnKVswXTtcblxuICAgICAgICAgICAgLy8gV2Ugc2lnbmFsIG91ciBzdHJlYW1zICh0aHJvdWdoIEppbmdsZSB0byB0aGUgZm9jdXMpIGJlZm9yZSB3ZSBzZXRcbiAgICAgICAgICAgIC8vIG91ciBwcmVzZW5jZSAodGhyb3VnaCB3aGljaCBwZWVycyBhc3NvY2lhdGUgcmVtb3RlIHN0cmVhbXMgdG9cbiAgICAgICAgICAgIC8vIGppZHMpLiBTbywgaXQgbWlnaHQgYXJyaXZlIHRoYXQgYSByZW1vdGUgc3RyZWFtIGlzIGFkZGVkIGJ1dFxuICAgICAgICAgICAgLy8gc3NyYzJqaWQgaXMgbm90IHlldCB1cGRhdGVkIGFuZCB0aHVzIGRhdGEucGVlcmppZCBjYW5ub3QgYmVcbiAgICAgICAgICAgIC8vIHN1Y2Nlc3NmdWxseSBzZXQuIEhlcmUgd2Ugd2FpdCBmb3IgdXAgdG8gYSBzZWNvbmQgZm9yIHRoZVxuICAgICAgICAgICAgLy8gcHJlc2VuY2UgdG8gYXJyaXZlLlxuXG4gICAgICAgICAgICBpZiAoIXNzcmMyamlkW3RoZXNzcmNdKSB7XG4gICAgICAgICAgICAgICAgLy8gVE9ETyhncCkgbGltaXQgd2FpdCBkdXJhdGlvbiB0byAxIHNlYy5cbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5yZW1vdGVTdHJlYW1BZGRlZChkKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0oZGF0YSksIDI1MCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBvayB0byBvdmVyd3JpdGUgdGhlIG9uZSBmcm9tIGZvY3VzPyBtaWdodCBzYXZlIHdvcmsgaW4gY29saWJyaS5qc1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ2Fzc29jaWF0ZWQgamlkJywgc3NyYzJqaWRbdGhlc3NyY10sIGRhdGEucGVlcmppZCk7XG4gICAgICAgICAgICBpZiAoc3NyYzJqaWRbdGhlc3NyY10pIHtcbiAgICAgICAgICAgICAgICBkYXRhLnBlZXJqaWQgPSBzc3JjMmppZFt0aGVzc3JjXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vVE9ETzogdGhpcyBjb2RlIHNob3VsZCBiZSByZW1vdmVkIHdoZW4gZmlyZWZveCBpbXBsZW1lbnQgbXVsdGlzdHJlYW0gc3VwcG9ydFxuICAgIGlmKFJUQy5nZXRCcm93c2VyVHlwZSgpID09IFJUQ0Jyb3dzZXJUeXBlLlJUQ19CUk9XU0VSX0ZJUkVGT1gpXG4gICAge1xuICAgICAgICBpZigobm90UmVjZWl2ZWRTU1JDcy5sZW5ndGggPT0gMCkgfHxcbiAgICAgICAgICAgICFzc3JjMmppZFtub3RSZWNlaXZlZFNTUkNzW25vdFJlY2VpdmVkU1NSQ3MubGVuZ3RoIC0gMV1dKVxuICAgICAgICB7XG4gICAgICAgICAgICAvLyBUT0RPKGdwKSBsaW1pdCB3YWl0IGR1cmF0aW9uIHRvIDEgc2VjLlxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbihkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnJlbW90ZVN0cmVhbUFkZGVkKGQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0oZGF0YSksIDI1MCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGVzc3JjID0gbm90UmVjZWl2ZWRTU1JDcy5wb3AoKTtcbiAgICAgICAgaWYgKHNzcmMyamlkW3RoZXNzcmNdKSB7XG4gICAgICAgICAgICBkYXRhLnBlZXJqaWQgPSBzc3JjMmppZFt0aGVzc3JjXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFJUQy5jcmVhdGVSZW1vdGVTdHJlYW0oZGF0YSwgdGhpcy5zaWQsIHRoZXNzcmMpO1xuXG4gICAgdmFyIGlzVmlkZW8gPSBkYXRhLnN0cmVhbS5nZXRWaWRlb1RyYWNrcygpLmxlbmd0aCA+IDA7XG4gICAgLy8gYW4gYXR0ZW1wdCB0byB3b3JrIGFyb3VuZCBodHRwczovL2dpdGh1Yi5jb20vaml0c2kvaml0bWVldC9pc3N1ZXMvMzJcbiAgICBpZiAoaXNWaWRlbyAmJlxuICAgICAgICBkYXRhLnBlZXJqaWQgJiYgdGhpcy5wZWVyamlkID09PSBkYXRhLnBlZXJqaWQgJiZcbiAgICAgICAgZGF0YS5zdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5sZW5ndGggPT09IDAgJiZcbiAgICAgICAgUlRDLmxvY2FsVmlkZW8uZ2V0VHJhY2tzKCkubGVuZ3RoID4gMCkge1xuICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZW5kS2V5ZnJhbWUoc2VsZi5wZWVyY29ubmVjdGlvbik7XG4gICAgICAgIH0sIDMwMDApO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBKaW5nbGVTZXNzaW9uOyIsIi8qIGpzaGludCAtVzExNyAqL1xudmFyIFNEUFV0aWwgPSByZXF1aXJlKFwiLi9TRFBVdGlsXCIpO1xuXG4vLyBTRFAgU1RVRkZcbmZ1bmN0aW9uIFNEUChzZHApIHtcbiAgICB0aGlzLm1lZGlhID0gc2RwLnNwbGl0KCdcXHJcXG5tPScpO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5tZWRpYS5sZW5ndGg7IGkrKykge1xuICAgICAgICB0aGlzLm1lZGlhW2ldID0gJ209JyArIHRoaXMubWVkaWFbaV07XG4gICAgICAgIGlmIChpICE9IHRoaXMubWVkaWEubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgdGhpcy5tZWRpYVtpXSArPSAnXFxyXFxuJztcbiAgICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnNlc3Npb24gPSB0aGlzLm1lZGlhLnNoaWZ0KCkgKyAnXFxyXFxuJztcbiAgICB0aGlzLnJhdyA9IHRoaXMuc2Vzc2lvbiArIHRoaXMubWVkaWEuam9pbignJyk7XG59XG4vKipcbiAqIFJldHVybnMgbWFwIG9mIE1lZGlhQ2hhbm5lbCBtYXBwZWQgcGVyIGNoYW5uZWwgaWR4LlxuICovXG5TRFAucHJvdG90eXBlLmdldE1lZGlhU3NyY01hcCA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbWVkaWFfc3NyY3MgPSB7fTtcbiAgICB2YXIgdG1wO1xuICAgIGZvciAodmFyIG1lZGlhaW5kZXggPSAwOyBtZWRpYWluZGV4IDwgc2VsZi5tZWRpYS5sZW5ndGg7IG1lZGlhaW5kZXgrKykge1xuICAgICAgICB0bXAgPSBTRFBVdGlsLmZpbmRfbGluZXMoc2VsZi5tZWRpYVttZWRpYWluZGV4XSwgJ2E9c3NyYzonKTtcbiAgICAgICAgdmFyIG1pZCA9IFNEUFV0aWwucGFyc2VfbWlkKFNEUFV0aWwuZmluZF9saW5lKHNlbGYubWVkaWFbbWVkaWFpbmRleF0sICdhPW1pZDonKSk7XG4gICAgICAgIHZhciBtZWRpYSA9IHtcbiAgICAgICAgICAgIG1lZGlhaW5kZXg6IG1lZGlhaW5kZXgsXG4gICAgICAgICAgICBtaWQ6IG1pZCxcbiAgICAgICAgICAgIHNzcmNzOiB7fSxcbiAgICAgICAgICAgIHNzcmNHcm91cHM6IFtdXG4gICAgICAgIH07XG4gICAgICAgIG1lZGlhX3NzcmNzW21lZGlhaW5kZXhdID0gbWVkaWE7XG4gICAgICAgIHRtcC5mb3JFYWNoKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICB2YXIgbGluZXNzcmMgPSBsaW5lLnN1YnN0cmluZyg3KS5zcGxpdCgnICcpWzBdO1xuICAgICAgICAgICAgLy8gYWxsb2NhdGUgbmV3IENoYW5uZWxTc3JjXG4gICAgICAgICAgICBpZighbWVkaWEuc3NyY3NbbGluZXNzcmNdKSB7XG4gICAgICAgICAgICAgICAgbWVkaWEuc3NyY3NbbGluZXNzcmNdID0ge1xuICAgICAgICAgICAgICAgICAgICBzc3JjOiBsaW5lc3NyYyxcbiAgICAgICAgICAgICAgICAgICAgbGluZXM6IFtdXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1lZGlhLnNzcmNzW2xpbmVzc3JjXS5saW5lcy5wdXNoKGxpbmUpO1xuICAgICAgICB9KTtcbiAgICAgICAgdG1wID0gU0RQVXRpbC5maW5kX2xpbmVzKHNlbGYubWVkaWFbbWVkaWFpbmRleF0sICdhPXNzcmMtZ3JvdXA6Jyk7XG4gICAgICAgIHRtcC5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpe1xuICAgICAgICAgICAgdmFyIHNlbWFudGljcyA9IGxpbmUuc3Vic3RyKDAsIGlkeCkuc3Vic3RyKDEzKTtcbiAgICAgICAgICAgIHZhciBzc3JjcyA9IGxpbmUuc3Vic3RyKDE0ICsgc2VtYW50aWNzLmxlbmd0aCkuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgIGlmIChzc3Jjcy5sZW5ndGggIT0gMCkge1xuICAgICAgICAgICAgICAgIG1lZGlhLnNzcmNHcm91cHMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHNlbWFudGljczogc2VtYW50aWNzLFxuICAgICAgICAgICAgICAgICAgICBzc3Jjczogc3NyY3NcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBtZWRpYV9zc3Jjcztcbn07XG4vKipcbiAqIFJldHVybnMgPHR0PnRydWU8L3R0PiBpZiB0aGlzIFNEUCBjb250YWlucyBnaXZlbiBTU1JDLlxuICogQHBhcmFtIHNzcmMgdGhlIHNzcmMgdG8gY2hlY2suXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gPHR0PnRydWU8L3R0PiBpZiB0aGlzIFNEUCBjb250YWlucyBnaXZlbiBTU1JDLlxuICovXG5TRFAucHJvdG90eXBlLmNvbnRhaW5zU1NSQyA9IGZ1bmN0aW9uKHNzcmMpIHtcbiAgICB2YXIgbWVkaWFzID0gdGhpcy5nZXRNZWRpYVNzcmNNYXAoKTtcbiAgICB2YXIgY29udGFpbnMgPSBmYWxzZTtcbiAgICBPYmplY3Qua2V5cyhtZWRpYXMpLmZvckVhY2goZnVuY3Rpb24obWVkaWFpbmRleCl7XG4gICAgICAgIHZhciBtZWRpYSA9IG1lZGlhc1ttZWRpYWluZGV4XTtcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcIkNoZWNrXCIsIGNoYW5uZWwsIHNzcmMpO1xuICAgICAgICBpZihPYmplY3Qua2V5cyhtZWRpYS5zc3JjcykuaW5kZXhPZihzc3JjKSAhPSAtMSl7XG4gICAgICAgICAgICBjb250YWlucyA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gY29udGFpbnM7XG59O1xuXG5cbi8vIHJlbW92ZSBpU0FDIGFuZCBDTiBmcm9tIFNEUFxuU0RQLnByb3RvdHlwZS5tYW5nbGUgPSBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGksIGosIG1saW5lLCBsaW5lcywgcnRwbWFwLCBuZXdkZXNjO1xuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm1lZGlhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGxpbmVzID0gdGhpcy5tZWRpYVtpXS5zcGxpdCgnXFxyXFxuJyk7XG4gICAgICAgIGxpbmVzLnBvcCgpOyAvLyByZW1vdmUgZW1wdHkgbGFzdCBlbGVtZW50XG4gICAgICAgIG1saW5lID0gU0RQVXRpbC5wYXJzZV9tbGluZShsaW5lcy5zaGlmdCgpKTtcbiAgICAgICAgaWYgKG1saW5lLm1lZGlhICE9ICdhdWRpbycpXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgbmV3ZGVzYyA9ICcnO1xuICAgICAgICBtbGluZS5mbXQubGVuZ3RoID0gMDtcbiAgICAgICAgZm9yIChqID0gMDsgaiA8IGxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAobGluZXNbal0uc3Vic3RyKDAsIDkpID09ICdhPXJ0cG1hcDonKSB7XG4gICAgICAgICAgICAgICAgcnRwbWFwID0gU0RQVXRpbC5wYXJzZV9ydHBtYXAobGluZXNbal0pO1xuICAgICAgICAgICAgICAgIGlmIChydHBtYXAubmFtZSA9PSAnQ04nIHx8IHJ0cG1hcC5uYW1lID09ICdJU0FDJylcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgbWxpbmUuZm10LnB1c2gocnRwbWFwLmlkKTtcbiAgICAgICAgICAgICAgICBuZXdkZXNjICs9IGxpbmVzW2pdICsgJ1xcclxcbic7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5ld2Rlc2MgKz0gbGluZXNbal0gKyAnXFxyXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1lZGlhW2ldID0gU0RQVXRpbC5idWlsZF9tbGluZShtbGluZSkgKyAnXFxyXFxuJztcbiAgICAgICAgdGhpcy5tZWRpYVtpXSArPSBuZXdkZXNjO1xuICAgIH1cbiAgICB0aGlzLnJhdyA9IHRoaXMuc2Vzc2lvbiArIHRoaXMubWVkaWEuam9pbignJyk7XG59O1xuXG4vLyByZW1vdmUgbGluZXMgbWF0Y2hpbmcgcHJlZml4IGZyb20gc2Vzc2lvbiBzZWN0aW9uXG5TRFAucHJvdG90eXBlLnJlbW92ZVNlc3Npb25MaW5lcyA9IGZ1bmN0aW9uKHByZWZpeCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbGluZXMgPSBTRFBVdGlsLmZpbmRfbGluZXModGhpcy5zZXNzaW9uLCBwcmVmaXgpO1xuICAgIGxpbmVzLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICBzZWxmLnNlc3Npb24gPSBzZWxmLnNlc3Npb24ucmVwbGFjZShsaW5lICsgJ1xcclxcbicsICcnKTtcbiAgICB9KTtcbiAgICB0aGlzLnJhdyA9IHRoaXMuc2Vzc2lvbiArIHRoaXMubWVkaWEuam9pbignJyk7XG4gICAgcmV0dXJuIGxpbmVzO1xufVxuLy8gcmVtb3ZlIGxpbmVzIG1hdGNoaW5nIHByZWZpeCBmcm9tIGEgbWVkaWEgc2VjdGlvbiBzcGVjaWZpZWQgYnkgbWVkaWFpbmRleFxuLy8gVE9ETzogbm9uLW51bWVyaWMgbWVkaWFpbmRleCBjb3VsZCBtYXRjaCBtaWRcblNEUC5wcm90b3R5cGUucmVtb3ZlTWVkaWFMaW5lcyA9IGZ1bmN0aW9uKG1lZGlhaW5kZXgsIHByZWZpeCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgbGluZXMgPSBTRFBVdGlsLmZpbmRfbGluZXModGhpcy5tZWRpYVttZWRpYWluZGV4XSwgcHJlZml4KTtcbiAgICBsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgc2VsZi5tZWRpYVttZWRpYWluZGV4XSA9IHNlbGYubWVkaWFbbWVkaWFpbmRleF0ucmVwbGFjZShsaW5lICsgJ1xcclxcbicsICcnKTtcbiAgICB9KTtcbiAgICB0aGlzLnJhdyA9IHRoaXMuc2Vzc2lvbiArIHRoaXMubWVkaWEuam9pbignJyk7XG4gICAgcmV0dXJuIGxpbmVzO1xufVxuXG4vLyBhZGQgY29udGVudCdzIHRvIGEgamluZ2xlIGVsZW1lbnRcblNEUC5wcm90b3R5cGUudG9KaW5nbGUgPSBmdW5jdGlvbiAoZWxlbSwgdGhlY3JlYXRvciwgc3NyY3MpIHtcbi8vICAgIGNvbnNvbGUubG9nKFwiU1NSQ1wiICsgc3NyY3NbXCJhdWRpb1wiXSArIFwiIC0gXCIgKyBzc3Jjc1tcInZpZGVvXCJdKTtcbiAgICB2YXIgaSwgaiwgaywgbWxpbmUsIHNzcmMsIHJ0cG1hcCwgdG1wLCBsaW5lLCBsaW5lcztcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gbmV3IGJ1bmRsZSBwbGFuXG4gICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHRoaXMuc2Vzc2lvbiwgJ2E9Z3JvdXA6JykpIHtcbiAgICAgICAgbGluZXMgPSBTRFBVdGlsLmZpbmRfbGluZXModGhpcy5zZXNzaW9uLCAnYT1ncm91cDonKTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0bXAgPSBsaW5lc1tpXS5zcGxpdCgnICcpO1xuICAgICAgICAgICAgdmFyIHNlbWFudGljcyA9IHRtcC5zaGlmdCgpLnN1YnN0cig4KTtcbiAgICAgICAgICAgIGVsZW0uYygnZ3JvdXAnLCB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6YXBwczpncm91cGluZzowJywgc2VtYW50aWNzOnNlbWFudGljc30pO1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IHRtcC5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIGVsZW0uYygnY29udGVudCcsIHtuYW1lOiB0bXBbal19KS51cCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLm1lZGlhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG1saW5lID0gU0RQVXRpbC5wYXJzZV9tbGluZSh0aGlzLm1lZGlhW2ldLnNwbGl0KCdcXHJcXG4nKVswXSk7XG4gICAgICAgIGlmICghKG1saW5lLm1lZGlhID09PSAnYXVkaW8nIHx8XG4gICAgICAgICAgICAgIG1saW5lLm1lZGlhID09PSAndmlkZW8nIHx8XG4gICAgICAgICAgICAgIG1saW5lLm1lZGlhID09PSAnYXBwbGljYXRpb24nKSlcbiAgICAgICAge1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHRoaXMubWVkaWFbaV0sICdhPXNzcmM6JykpIHtcbiAgICAgICAgICAgIHNzcmMgPSBTRFBVdGlsLmZpbmRfbGluZSh0aGlzLm1lZGlhW2ldLCAnYT1zc3JjOicpLnN1YnN0cmluZyg3KS5zcGxpdCgnICcpWzBdOyAvLyB0YWtlIHRoZSBmaXJzdFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYoc3NyY3MgJiYgc3NyY3NbbWxpbmUubWVkaWFdKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHNzcmMgPSBzc3Jjc1ttbGluZS5tZWRpYV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgc3NyYyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZWxlbS5jKCdjb250ZW50Jywge2NyZWF0b3I6IHRoZWNyZWF0b3IsIG5hbWU6IG1saW5lLm1lZGlhfSk7XG4gICAgICAgIGlmIChTRFBVdGlsLmZpbmRfbGluZSh0aGlzLm1lZGlhW2ldLCAnYT1taWQ6JykpIHtcbiAgICAgICAgICAgIC8vIHByZWZlciBpZGVudGlmaWVyIGZyb20gYT1taWQgaWYgcHJlc2VudFxuICAgICAgICAgICAgdmFyIG1pZCA9IFNEUFV0aWwucGFyc2VfbWlkKFNEUFV0aWwuZmluZF9saW5lKHRoaXMubWVkaWFbaV0sICdhPW1pZDonKSk7XG4gICAgICAgICAgICBlbGVtLmF0dHJzKHsgbmFtZTogbWlkIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHRoaXMubWVkaWFbaV0sICdhPXJ0cG1hcDonKS5sZW5ndGgpXG4gICAgICAgIHtcbiAgICAgICAgICAgIGVsZW0uYygnZGVzY3JpcHRpb24nLFxuICAgICAgICAgICAgICAgIHt4bWxuczogJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDoxJyxcbiAgICAgICAgICAgICAgICAgICAgbWVkaWE6IG1saW5lLm1lZGlhIH0pO1xuICAgICAgICAgICAgaWYgKHNzcmMpIHtcbiAgICAgICAgICAgICAgICBlbGVtLmF0dHJzKHtzc3JjOiBzc3JjfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbWxpbmUuZm10Lmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgcnRwbWFwID0gU0RQVXRpbC5maW5kX2xpbmUodGhpcy5tZWRpYVtpXSwgJ2E9cnRwbWFwOicgKyBtbGluZS5mbXRbal0pO1xuICAgICAgICAgICAgICAgIGVsZW0uYygncGF5bG9hZC10eXBlJywgU0RQVXRpbC5wYXJzZV9ydHBtYXAocnRwbWFwKSk7XG4gICAgICAgICAgICAgICAgLy8gcHV0IGFueSAnYT1mbXRwOicgKyBtbGluZS5mbXRbal0gbGluZXMgaW50byA8cGFyYW0gbmFtZT1mb28gdmFsdWU9YmFyLz5cbiAgICAgICAgICAgICAgICBpZiAoU0RQVXRpbC5maW5kX2xpbmUodGhpcy5tZWRpYVtpXSwgJ2E9Zm10cDonICsgbWxpbmUuZm10W2pdKSkge1xuICAgICAgICAgICAgICAgICAgICB0bXAgPSBTRFBVdGlsLnBhcnNlX2ZtdHAoU0RQVXRpbC5maW5kX2xpbmUodGhpcy5tZWRpYVtpXSwgJ2E9Zm10cDonICsgbWxpbmUuZm10W2pdKSk7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoayA9IDA7IGsgPCB0bXAubGVuZ3RoOyBrKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYygncGFyYW1ldGVyJywgdG1wW2tdKS51cCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuUnRjcEZiVG9KaW5nbGUoaSwgZWxlbSwgbWxpbmUuZm10W2pdKTsgLy8gWEVQLTAyOTMgLS0gbWFwIGE9cnRjcC1mYlxuXG4gICAgICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHRoaXMubWVkaWFbaV0sICdhPWNyeXB0bzonLCB0aGlzLnNlc3Npb24pKSB7XG4gICAgICAgICAgICAgICAgZWxlbS5jKCdlbmNyeXB0aW9uJywge3JlcXVpcmVkOiAxfSk7XG4gICAgICAgICAgICAgICAgdmFyIGNyeXB0byA9IFNEUFV0aWwuZmluZF9saW5lcyh0aGlzLm1lZGlhW2ldLCAnYT1jcnlwdG86JywgdGhpcy5zZXNzaW9uKTtcbiAgICAgICAgICAgICAgICBjcnlwdG8uZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYygnY3J5cHRvJywgU0RQVXRpbC5wYXJzZV9jcnlwdG8obGluZSkpLnVwKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgZWxlbS51cCgpOyAvLyBlbmQgb2YgZW5jcnlwdGlvblxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc3NyYykge1xuICAgICAgICAgICAgICAgIC8vIG5ldyBzdHlsZSBtYXBwaW5nXG4gICAgICAgICAgICAgICAgZWxlbS5jKCdzb3VyY2UnLCB7IHNzcmM6IHNzcmMsIHhtbG5zOiAndXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOnNzbWE6MCcgfSk7XG4gICAgICAgICAgICAgICAgLy8gRklYTUU6IGdyb3VwIGJ5IHNzcmMgYW5kIHN1cHBvcnQgbXVsdGlwbGUgZGlmZmVyZW50IHNzcmNzXG4gICAgICAgICAgICAgICAgdmFyIHNzcmNsaW5lcyA9IFNEUFV0aWwuZmluZF9saW5lcyh0aGlzLm1lZGlhW2ldLCAnYT1zc3JjOicpO1xuICAgICAgICAgICAgICAgIGlmKHNzcmNsaW5lcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIHNzcmNsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZHggPSBsaW5lLmluZGV4T2YoJyAnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBsaW5lc3NyYyA9IGxpbmUuc3Vic3RyKDAsIGlkeCkuc3Vic3RyKDcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGxpbmVzc3JjICE9IHNzcmMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnVwKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3NyYyA9IGxpbmVzc3JjO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYygnc291cmNlJywgeyBzc3JjOiBzc3JjLCB4bWxuczogJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDpzc21hOjAnIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGt2ID0gbGluZS5zdWJzdHIoaWR4ICsgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmMoJ3BhcmFtZXRlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGt2LmluZGV4T2YoJzonKSA9PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYXR0cnMoeyBuYW1lOiBrdiB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5hdHRycyh7IG5hbWU6IGt2LnNwbGl0KCc6JywgMilbMF0gfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5hdHRycyh7IHZhbHVlOiBrdi5zcGxpdCgnOicsIDIpWzFdIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYygnc291cmNlJywgeyBzc3JjOiBzc3JjLCB4bWxuczogJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDpzc21hOjAnIH0pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmMoJ3BhcmFtZXRlcicpO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLmF0dHJzKHtuYW1lOiBcImNuYW1lXCIsIHZhbHVlOk1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZyg3KX0pO1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBtc2lkID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgaWYobWxpbmUubWVkaWEgPT0gXCJhdWRpb1wiKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2lkID0gUlRDLmxvY2FsQXVkaW8uZ2V0SWQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zaWQgPSBSVEMubG9jYWxWaWRlby5nZXRJZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKG1zaWQgIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNpZCA9IG1zaWQucmVwbGFjZSgvW1xceyxcXH1dL2csXCJcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmMoJ3BhcmFtZXRlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5hdHRycyh7bmFtZTogXCJtc2lkXCIsIHZhbHVlOm1zaWR9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0udXAoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYygncGFyYW1ldGVyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmF0dHJzKHtuYW1lOiBcIm1zbGFiZWxcIiwgdmFsdWU6bXNpZH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jKCdwYXJhbWV0ZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYXR0cnMoe25hbWU6IFwibGFiZWxcIiwgdmFsdWU6bXNpZH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFhFUC0wMzM5IGhhbmRsZSBzc3JjLWdyb3VwIGF0dHJpYnV0ZXNcbiAgICAgICAgICAgICAgICB2YXIgc3NyY19ncm91cF9saW5lcyA9IFNEUFV0aWwuZmluZF9saW5lcyh0aGlzLm1lZGlhW2ldLCAnYT1zc3JjLWdyb3VwOicpO1xuICAgICAgICAgICAgICAgIHNzcmNfZ3JvdXBfbGluZXMuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgICAgICAgICAgIGlkeCA9IGxpbmUuaW5kZXhPZignICcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2VtYW50aWNzID0gbGluZS5zdWJzdHIoMCwgaWR4KS5zdWJzdHIoMTMpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc3NyY3MgPSBsaW5lLnN1YnN0cigxNCArIHNlbWFudGljcy5sZW5ndGgpLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzc3Jjcy5sZW5ndGggIT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5jKCdzc3JjLWdyb3VwJywgeyBzZW1hbnRpY3M6IHNlbWFudGljcywgeG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6c3NtYTowJyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNzcmNzLmZvckVhY2goZnVuY3Rpb24oc3NyYykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYygnc291cmNlJywgeyBzc3JjOiBzc3JjIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBlbGVtLnVwKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHRoaXMubWVkaWFbaV0sICdhPXJ0Y3AtbXV4JykpIHtcbiAgICAgICAgICAgICAgICBlbGVtLmMoJ3J0Y3AtbXV4JykudXAoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gWEVQLTAyOTMgLS0gbWFwIGE9cnRjcC1mYjoqXG4gICAgICAgICAgICB0aGlzLlJ0Y3BGYlRvSmluZ2xlKGksIGVsZW0sICcqJyk7XG5cbiAgICAgICAgICAgIC8vIFhFUC0wMjk0XG4gICAgICAgICAgICBpZiAoU0RQVXRpbC5maW5kX2xpbmUodGhpcy5tZWRpYVtpXSwgJ2E9ZXh0bWFwOicpKSB7XG4gICAgICAgICAgICAgICAgbGluZXMgPSBTRFBVdGlsLmZpbmRfbGluZXModGhpcy5tZWRpYVtpXSwgJ2E9ZXh0bWFwOicpO1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBsaW5lcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgICAgICB0bXAgPSBTRFBVdGlsLnBhcnNlX2V4dG1hcChsaW5lc1tqXSk7XG4gICAgICAgICAgICAgICAgICAgIGVsZW0uYygncnRwLWhkcmV4dCcsIHsgeG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6cnRwLWhkcmV4dDowJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHVyaTogdG1wLnVyaSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiB0bXAudmFsdWUgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0bXAuaGFzT3duUHJvcGVydHkoJ2RpcmVjdGlvbicpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKHRtcC5kaXJlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYXNlICdzZW5kb25seSc6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW0uYXR0cnMoe3NlbmRlcnM6ICdyZXNwb25kZXInfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JlY3Zvbmx5JzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbS5hdHRycyh7c2VuZGVyczogJ2luaXRpYXRvcid9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnc2VuZHJlY3YnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmF0dHJzKHtzZW5kZXJzOiAnYm90aCd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAnaW5hY3RpdmUnOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtLmF0dHJzKHtzZW5kZXJzOiAnbm9uZSd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogaGFuZGxlIHBhcmFtc1xuICAgICAgICAgICAgICAgICAgICBlbGVtLnVwKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbS51cCgpOyAvLyBlbmQgb2YgZGVzY3JpcHRpb25cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG1hcCBpY2UtdWZyYWcvcHdkLCBkdGxzIGZpbmdlcnByaW50LCBjYW5kaWRhdGVzXG4gICAgICAgIHRoaXMuVHJhbnNwb3J0VG9KaW5nbGUoaSwgZWxlbSk7XG5cbiAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKHRoaXMubWVkaWFbaV0sICdhPXNlbmRyZWN2JywgdGhpcy5zZXNzaW9uKSkge1xuICAgICAgICAgICAgZWxlbS5hdHRycyh7c2VuZGVyczogJ2JvdGgnfSk7XG4gICAgICAgIH0gZWxzZSBpZiAoU0RQVXRpbC5maW5kX2xpbmUodGhpcy5tZWRpYVtpXSwgJ2E9c2VuZG9ubHknLCB0aGlzLnNlc3Npb24pKSB7XG4gICAgICAgICAgICBlbGVtLmF0dHJzKHtzZW5kZXJzOiAnaW5pdGlhdG9yJ30pO1xuICAgICAgICB9IGVsc2UgaWYgKFNEUFV0aWwuZmluZF9saW5lKHRoaXMubWVkaWFbaV0sICdhPXJlY3Zvbmx5JywgdGhpcy5zZXNzaW9uKSkge1xuICAgICAgICAgICAgZWxlbS5hdHRycyh7c2VuZGVyczogJ3Jlc3BvbmRlcid9KTtcbiAgICAgICAgfSBlbHNlIGlmIChTRFBVdGlsLmZpbmRfbGluZSh0aGlzLm1lZGlhW2ldLCAnYT1pbmFjdGl2ZScsIHRoaXMuc2Vzc2lvbikpIHtcbiAgICAgICAgICAgIGVsZW0uYXR0cnMoe3NlbmRlcnM6ICdub25lJ30pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtbGluZS5wb3J0ID09ICcwJykge1xuICAgICAgICAgICAgLy8gZXN0b3MgaGFjayB0byByZWplY3QgYW4gbS1saW5lXG4gICAgICAgICAgICBlbGVtLmF0dHJzKHtzZW5kZXJzOiAncmVqZWN0ZWQnfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbS51cCgpOyAvLyBlbmQgb2YgY29udGVudFxuICAgIH1cbiAgICBlbGVtLnVwKCk7XG4gICAgcmV0dXJuIGVsZW07XG59O1xuXG5TRFAucHJvdG90eXBlLlRyYW5zcG9ydFRvSmluZ2xlID0gZnVuY3Rpb24gKG1lZGlhaW5kZXgsIGVsZW0pIHtcbiAgICB2YXIgaSA9IG1lZGlhaW5kZXg7XG4gICAgdmFyIHRtcDtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZWxlbS5jKCd0cmFuc3BvcnQnKTtcblxuICAgIC8vIFhFUC0wMzQzIERUTFMvU0NUUFxuICAgIGlmIChTRFBVdGlsLmZpbmRfbGluZSh0aGlzLm1lZGlhW21lZGlhaW5kZXhdLCAnYT1zY3RwbWFwOicpLmxlbmd0aClcbiAgICB7XG4gICAgICAgIHZhciBzY3RwbWFwID0gU0RQVXRpbC5maW5kX2xpbmUoXG4gICAgICAgICAgICB0aGlzLm1lZGlhW2ldLCAnYT1zY3RwbWFwOicsIHNlbGYuc2Vzc2lvbik7XG4gICAgICAgIGlmIChzY3RwbWFwKVxuICAgICAgICB7XG4gICAgICAgICAgICB2YXIgc2N0cEF0dHJzID0gU0RQVXRpbC5wYXJzZV9zY3RwbWFwKHNjdHBtYXApO1xuICAgICAgICAgICAgZWxlbS5jKCdzY3RwbWFwJyxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHhtbG5zOiAndXJuOnhtcHA6amluZ2xlOnRyYW5zcG9ydHM6ZHRscy1zY3RwOjEnLFxuICAgICAgICAgICAgICAgICAgICBudW1iZXI6IHNjdHBBdHRyc1swXSwgLyogU0NUUCBwb3J0ICovXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiBzY3RwQXR0cnNbMV0sIC8qIHByb3RvY29sICovXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAvLyBPcHRpb25hbCBzdHJlYW0gY291bnQgYXR0cmlidXRlXG4gICAgICAgICAgICBpZiAoc2N0cEF0dHJzLmxlbmd0aCA+IDIpXG4gICAgICAgICAgICAgICAgZWxlbS5hdHRycyh7IHN0cmVhbXM6IHNjdHBBdHRyc1syXX0pO1xuICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFhFUC0wMzIwXG4gICAgdmFyIGZpbmdlcnByaW50cyA9IFNEUFV0aWwuZmluZF9saW5lcyh0aGlzLm1lZGlhW21lZGlhaW5kZXhdLCAnYT1maW5nZXJwcmludDonLCB0aGlzLnNlc3Npb24pO1xuICAgIGZpbmdlcnByaW50cy5mb3JFYWNoKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgdG1wID0gU0RQVXRpbC5wYXJzZV9maW5nZXJwcmludChsaW5lKTtcbiAgICAgICAgdG1wLnhtbG5zID0gJ3Vybjp4bXBwOmppbmdsZTphcHBzOmR0bHM6MCc7XG4gICAgICAgIGVsZW0uYygnZmluZ2VycHJpbnQnKS50KHRtcC5maW5nZXJwcmludCk7XG4gICAgICAgIGRlbGV0ZSB0bXAuZmluZ2VycHJpbnQ7XG4gICAgICAgIGxpbmUgPSBTRFBVdGlsLmZpbmRfbGluZShzZWxmLm1lZGlhW21lZGlhaW5kZXhdLCAnYT1zZXR1cDonLCBzZWxmLnNlc3Npb24pO1xuICAgICAgICBpZiAobGluZSkge1xuICAgICAgICAgICAgdG1wLnNldHVwID0gbGluZS5zdWJzdHIoOCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbS5hdHRycyh0bXApO1xuICAgICAgICBlbGVtLnVwKCk7IC8vIGVuZCBvZiBmaW5nZXJwcmludFxuICAgIH0pO1xuICAgIHRtcCA9IFNEUFV0aWwuaWNlcGFyYW1zKHRoaXMubWVkaWFbbWVkaWFpbmRleF0sIHRoaXMuc2Vzc2lvbik7XG4gICAgaWYgKHRtcCkge1xuICAgICAgICB0bXAueG1sbnMgPSAndXJuOnhtcHA6amluZ2xlOnRyYW5zcG9ydHM6aWNlLXVkcDoxJztcbiAgICAgICAgZWxlbS5hdHRycyh0bXApO1xuICAgICAgICAvLyBYRVAtMDE3NlxuICAgICAgICBpZiAoU0RQVXRpbC5maW5kX2xpbmUodGhpcy5tZWRpYVttZWRpYWluZGV4XSwgJ2E9Y2FuZGlkYXRlOicsIHRoaXMuc2Vzc2lvbikpIHsgLy8gYWRkIGFueSBhPWNhbmRpZGF0ZSBsaW5lc1xuICAgICAgICAgICAgdmFyIGxpbmVzID0gU0RQVXRpbC5maW5kX2xpbmVzKHRoaXMubWVkaWFbbWVkaWFpbmRleF0sICdhPWNhbmRpZGF0ZTonLCB0aGlzLnNlc3Npb24pO1xuICAgICAgICAgICAgbGluZXMuZm9yRWFjaChmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAgICAgICAgIGVsZW0uYygnY2FuZGlkYXRlJywgU0RQVXRpbC5jYW5kaWRhdGVUb0ppbmdsZShsaW5lKSkudXAoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsZW0udXAoKTsgLy8gZW5kIG9mIHRyYW5zcG9ydFxufVxuXG5TRFAucHJvdG90eXBlLlJ0Y3BGYlRvSmluZ2xlID0gZnVuY3Rpb24gKG1lZGlhaW5kZXgsIGVsZW0sIHBheWxvYWR0eXBlKSB7IC8vIFhFUC0wMjkzXG4gICAgdmFyIGxpbmVzID0gU0RQVXRpbC5maW5kX2xpbmVzKHRoaXMubWVkaWFbbWVkaWFpbmRleF0sICdhPXJ0Y3AtZmI6JyArIHBheWxvYWR0eXBlKTtcbiAgICBsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIHZhciB0bXAgPSBTRFBVdGlsLnBhcnNlX3J0Y3BmYihsaW5lKTtcbiAgICAgICAgaWYgKHRtcC50eXBlID09ICd0cnItaW50Jykge1xuICAgICAgICAgICAgZWxlbS5jKCdydGNwLWZiLXRyci1pbnQnLCB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6cnRjcC1mYjowJywgdmFsdWU6IHRtcC5wYXJhbXNbMF19KTtcbiAgICAgICAgICAgIGVsZW0udXAoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVsZW0uYygncnRjcC1mYicsIHt4bWxuczogJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDpydGNwLWZiOjAnLCB0eXBlOiB0bXAudHlwZX0pO1xuICAgICAgICAgICAgaWYgKHRtcC5wYXJhbXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGVsZW0uYXR0cnMoeydzdWJ0eXBlJzogdG1wLnBhcmFtc1swXX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICB9XG4gICAgfSk7XG59O1xuXG5TRFAucHJvdG90eXBlLlJ0Y3BGYkZyb21KaW5nbGUgPSBmdW5jdGlvbiAoZWxlbSwgcGF5bG9hZHR5cGUpIHsgLy8gWEVQLTAyOTNcbiAgICB2YXIgbWVkaWEgPSAnJztcbiAgICB2YXIgdG1wID0gZWxlbS5maW5kKCc+cnRjcC1mYi10cnItaW50W3htbG5zPVwidXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOnJ0Y3AtZmI6MFwiXScpO1xuICAgIGlmICh0bXAubGVuZ3RoKSB7XG4gICAgICAgIG1lZGlhICs9ICdhPXJ0Y3AtZmI6JyArICcqJyArICcgJyArICd0cnItaW50JyArICcgJztcbiAgICAgICAgaWYgKHRtcC5hdHRyKCd2YWx1ZScpKSB7XG4gICAgICAgICAgICBtZWRpYSArPSB0bXAuYXR0cigndmFsdWUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG1lZGlhICs9ICcwJztcbiAgICAgICAgfVxuICAgICAgICBtZWRpYSArPSAnXFxyXFxuJztcbiAgICB9XG4gICAgdG1wID0gZWxlbS5maW5kKCc+cnRjcC1mYlt4bWxucz1cInVybjp4bXBwOmppbmdsZTphcHBzOnJ0cDpydGNwLWZiOjBcIl0nKTtcbiAgICB0bXAuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1lZGlhICs9ICdhPXJ0Y3AtZmI6JyArIHBheWxvYWR0eXBlICsgJyAnICsgJCh0aGlzKS5hdHRyKCd0eXBlJyk7XG4gICAgICAgIGlmICgkKHRoaXMpLmF0dHIoJ3N1YnR5cGUnKSkge1xuICAgICAgICAgICAgbWVkaWEgKz0gJyAnICsgJCh0aGlzKS5hdHRyKCdzdWJ0eXBlJyk7XG4gICAgICAgIH1cbiAgICAgICAgbWVkaWEgKz0gJ1xcclxcbic7XG4gICAgfSk7XG4gICAgcmV0dXJuIG1lZGlhO1xufTtcblxuLy8gY29uc3RydWN0IGFuIFNEUCBmcm9tIGEgamluZ2xlIHN0YW56YVxuU0RQLnByb3RvdHlwZS5mcm9tSmluZ2xlID0gZnVuY3Rpb24gKGppbmdsZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnJhdyA9ICd2PTBcXHJcXG4nICtcbiAgICAgICAgJ289LSAnICsgJzE5MjM1MTg1MTYnICsgJyAyIElOIElQNCAwLjAuMC4wXFxyXFxuJyArLy8gRklYTUVcbiAgICAgICAgJ3M9LVxcclxcbicgK1xuICAgICAgICAndD0wIDBcXHJcXG4nO1xuICAgIC8vIGh0dHA6Ly90b29scy5pZXRmLm9yZy9odG1sL2RyYWZ0LWlldGYtbW11c2ljLXNkcC1idW5kbGUtbmVnb3RpYXRpb24tMDQjc2VjdGlvbi04XG4gICAgaWYgKCQoamluZ2xlKS5maW5kKCc+Z3JvdXBbeG1sbnM9XCJ1cm46eG1wcDpqaW5nbGU6YXBwczpncm91cGluZzowXCJdJykubGVuZ3RoKSB7XG4gICAgICAgICQoamluZ2xlKS5maW5kKCc+Z3JvdXBbeG1sbnM9XCJ1cm46eG1wcDpqaW5nbGU6YXBwczpncm91cGluZzowXCJdJykuZWFjaChmdW5jdGlvbiAoaWR4LCBncm91cCkge1xuICAgICAgICAgICAgdmFyIGNvbnRlbnRzID0gJChncm91cCkuZmluZCgnPmNvbnRlbnQnKS5tYXAoZnVuY3Rpb24gKGlkeCwgY29udGVudCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb250ZW50LmdldEF0dHJpYnV0ZSgnbmFtZScpO1xuICAgICAgICAgICAgfSkuZ2V0KCk7XG4gICAgICAgICAgICBpZiAoY29udGVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmF3ICs9ICdhPWdyb3VwOicgKyAoZ3JvdXAuZ2V0QXR0cmlidXRlKCdzZW1hbnRpY3MnKSB8fCBncm91cC5nZXRBdHRyaWJ1dGUoJ3R5cGUnKSkgKyAnICcgKyBjb250ZW50cy5qb2luKCcgJykgKyAnXFxyXFxuJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgdGhpcy5zZXNzaW9uID0gdGhpcy5yYXc7XG4gICAgamluZ2xlLmZpbmQoJz5jb250ZW50JykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtID0gc2VsZi5qaW5nbGUybWVkaWEoJCh0aGlzKSk7XG4gICAgICAgIHNlbGYubWVkaWEucHVzaChtKTtcbiAgICB9KTtcblxuICAgIC8vIHJlY29uc3RydWN0IG1zaWQtc2VtYW50aWMgLS0gYXBwYXJlbnRseSBub3QgbmVjZXNzYXJ5XG4gICAgLypcbiAgICAgdmFyIG1zaWQgPSBTRFBVdGlsLnBhcnNlX3NzcmModGhpcy5yYXcpO1xuICAgICBpZiAobXNpZC5oYXNPd25Qcm9wZXJ0eSgnbXNsYWJlbCcpKSB7XG4gICAgIHRoaXMuc2Vzc2lvbiArPSBcImE9bXNpZC1zZW1hbnRpYzogV01TIFwiICsgbXNpZC5tc2xhYmVsICsgXCJcXHJcXG5cIjtcbiAgICAgfVxuICAgICAqL1xuXG4gICAgdGhpcy5yYXcgPSB0aGlzLnNlc3Npb24gKyB0aGlzLm1lZGlhLmpvaW4oJycpO1xufTtcblxuLy8gdHJhbnNsYXRlIGEgamluZ2xlIGNvbnRlbnQgZWxlbWVudCBpbnRvIGFuIGFuIFNEUCBtZWRpYSBwYXJ0XG5TRFAucHJvdG90eXBlLmppbmdsZTJtZWRpYSA9IGZ1bmN0aW9uIChjb250ZW50KSB7XG4gICAgdmFyIG1lZGlhID0gJycsXG4gICAgICAgIGRlc2MgPSBjb250ZW50LmZpbmQoJ2Rlc2NyaXB0aW9uJyksXG4gICAgICAgIHNzcmMgPSBkZXNjLmF0dHIoJ3NzcmMnKSxcbiAgICAgICAgc2VsZiA9IHRoaXMsXG4gICAgICAgIHRtcDtcbiAgICB2YXIgc2N0cCA9IGNvbnRlbnQuZmluZChcbiAgICAgICAgJz50cmFuc3BvcnQ+c2N0cG1hcFt4bWxucz1cInVybjp4bXBwOmppbmdsZTp0cmFuc3BvcnRzOmR0bHMtc2N0cDoxXCJdJyk7XG5cbiAgICB0bXAgPSB7IG1lZGlhOiBkZXNjLmF0dHIoJ21lZGlhJykgfTtcbiAgICB0bXAucG9ydCA9ICcxJztcbiAgICBpZiAoY29udGVudC5hdHRyKCdzZW5kZXJzJykgPT0gJ3JlamVjdGVkJykge1xuICAgICAgICAvLyBlc3RvcyBoYWNrIHRvIHJlamVjdCBhbiBtLWxpbmUuXG4gICAgICAgIHRtcC5wb3J0ID0gJzAnO1xuICAgIH1cbiAgICBpZiAoY29udGVudC5maW5kKCc+dHJhbnNwb3J0PmZpbmdlcnByaW50JykubGVuZ3RoIHx8IGRlc2MuZmluZCgnZW5jcnlwdGlvbicpLmxlbmd0aCkge1xuICAgICAgICBpZiAoc2N0cC5sZW5ndGgpXG4gICAgICAgICAgICB0bXAucHJvdG8gPSAnRFRMUy9TQ1RQJztcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdG1wLnByb3RvID0gJ1JUUC9TQVZQRic7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdG1wLnByb3RvID0gJ1JUUC9BVlBGJztcbiAgICB9XG4gICAgaWYgKCFzY3RwLmxlbmd0aClcbiAgICB7XG4gICAgICAgIHRtcC5mbXQgPSBkZXNjLmZpbmQoJ3BheWxvYWQtdHlwZScpLm1hcChcbiAgICAgICAgICAgIGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXMuZ2V0QXR0cmlidXRlKCdpZCcpOyB9KS5nZXQoKTtcbiAgICAgICAgbWVkaWEgKz0gU0RQVXRpbC5idWlsZF9tbGluZSh0bXApICsgJ1xcclxcbic7XG4gICAgfVxuICAgIGVsc2VcbiAgICB7XG4gICAgICAgIG1lZGlhICs9ICdtPWFwcGxpY2F0aW9uIDEgRFRMUy9TQ1RQICcgKyBzY3RwLmF0dHIoJ251bWJlcicpICsgJ1xcclxcbic7XG4gICAgICAgIG1lZGlhICs9ICdhPXNjdHBtYXA6JyArIHNjdHAuYXR0cignbnVtYmVyJykgK1xuICAgICAgICAgICAgJyAnICsgc2N0cC5hdHRyKCdwcm90b2NvbCcpO1xuXG4gICAgICAgIHZhciBzdHJlYW1Db3VudCA9IHNjdHAuYXR0cignc3RyZWFtcycpO1xuICAgICAgICBpZiAoc3RyZWFtQ291bnQpXG4gICAgICAgICAgICBtZWRpYSArPSAnICcgKyBzdHJlYW1Db3VudCArICdcXHJcXG4nO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBtZWRpYSArPSAnXFxyXFxuJztcbiAgICB9XG5cbiAgICBtZWRpYSArPSAnYz1JTiBJUDQgMC4wLjAuMFxcclxcbic7XG4gICAgaWYgKCFzY3RwLmxlbmd0aClcbiAgICAgICAgbWVkaWEgKz0gJ2E9cnRjcDoxIElOIElQNCAwLjAuMC4wXFxyXFxuJztcbiAgICB0bXAgPSBjb250ZW50LmZpbmQoJz50cmFuc3BvcnRbeG1sbnM9XCJ1cm46eG1wcDpqaW5nbGU6dHJhbnNwb3J0czppY2UtdWRwOjFcIl0nKTtcbiAgICBpZiAodG1wLmxlbmd0aCkge1xuICAgICAgICBpZiAodG1wLmF0dHIoJ3VmcmFnJykpIHtcbiAgICAgICAgICAgIG1lZGlhICs9IFNEUFV0aWwuYnVpbGRfaWNldWZyYWcodG1wLmF0dHIoJ3VmcmFnJykpICsgJ1xcclxcbic7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRtcC5hdHRyKCdwd2QnKSkge1xuICAgICAgICAgICAgbWVkaWEgKz0gU0RQVXRpbC5idWlsZF9pY2Vwd2QodG1wLmF0dHIoJ3B3ZCcpKSArICdcXHJcXG4nO1xuICAgICAgICB9XG4gICAgICAgIHRtcC5maW5kKCc+ZmluZ2VycHJpbnQnKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIC8vIEZJWE1FOiBjaGVjayBuYW1lc3BhY2UgYXQgc29tZSBwb2ludFxuICAgICAgICAgICAgbWVkaWEgKz0gJ2E9ZmluZ2VycHJpbnQ6JyArIHRoaXMuZ2V0QXR0cmlidXRlKCdoYXNoJyk7XG4gICAgICAgICAgICBtZWRpYSArPSAnICcgKyAkKHRoaXMpLnRleHQoKTtcbiAgICAgICAgICAgIG1lZGlhICs9ICdcXHJcXG4nO1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0QXR0cmlidXRlKCdzZXR1cCcpKSB7XG4gICAgICAgICAgICAgICAgbWVkaWEgKz0gJ2E9c2V0dXA6JyArIHRoaXMuZ2V0QXR0cmlidXRlKCdzZXR1cCcpICsgJ1xcclxcbic7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBzd2l0Y2ggKGNvbnRlbnQuYXR0cignc2VuZGVycycpKSB7XG4gICAgICAgIGNhc2UgJ2luaXRpYXRvcic6XG4gICAgICAgICAgICBtZWRpYSArPSAnYT1zZW5kb25seVxcclxcbic7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAncmVzcG9uZGVyJzpcbiAgICAgICAgICAgIG1lZGlhICs9ICdhPXJlY3Zvbmx5XFxyXFxuJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdub25lJzpcbiAgICAgICAgICAgIG1lZGlhICs9ICdhPWluYWN0aXZlXFxyXFxuJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdib3RoJzpcbiAgICAgICAgICAgIG1lZGlhICs9ICdhPXNlbmRyZWN2XFxyXFxuJztcbiAgICAgICAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBtZWRpYSArPSAnYT1taWQ6JyArIGNvbnRlbnQuYXR0cignbmFtZScpICsgJ1xcclxcbic7XG5cbiAgICAvLyA8ZGVzY3JpcHRpb24+PHJ0Y3AtbXV4Lz48L2Rlc2NyaXB0aW9uPlxuICAgIC8vIHNlZSBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvbGliamluZ2xlL2lzc3Vlcy9kZXRhaWw/aWQ9MzA5IC0tIG5vIHNwZWMgdGhvdWdoXG4gICAgLy8gYW5kIGh0dHA6Ly9tYWlsLmphYmJlci5vcmcvcGlwZXJtYWlsL2ppbmdsZS8yMDExLURlY2VtYmVyLzAwMTc2MS5odG1sXG4gICAgaWYgKGRlc2MuZmluZCgncnRjcC1tdXgnKS5sZW5ndGgpIHtcbiAgICAgICAgbWVkaWEgKz0gJ2E9cnRjcC1tdXhcXHJcXG4nO1xuICAgIH1cblxuICAgIGlmIChkZXNjLmZpbmQoJ2VuY3J5cHRpb24nKS5sZW5ndGgpIHtcbiAgICAgICAgZGVzYy5maW5kKCdlbmNyeXB0aW9uPmNyeXB0bycpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbWVkaWEgKz0gJ2E9Y3J5cHRvOicgKyB0aGlzLmdldEF0dHJpYnV0ZSgndGFnJyk7XG4gICAgICAgICAgICBtZWRpYSArPSAnICcgKyB0aGlzLmdldEF0dHJpYnV0ZSgnY3J5cHRvLXN1aXRlJyk7XG4gICAgICAgICAgICBtZWRpYSArPSAnICcgKyB0aGlzLmdldEF0dHJpYnV0ZSgna2V5LXBhcmFtcycpO1xuICAgICAgICAgICAgaWYgKHRoaXMuZ2V0QXR0cmlidXRlKCdzZXNzaW9uLXBhcmFtcycpKSB7XG4gICAgICAgICAgICAgICAgbWVkaWEgKz0gJyAnICsgdGhpcy5nZXRBdHRyaWJ1dGUoJ3Nlc3Npb24tcGFyYW1zJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtZWRpYSArPSAnXFxyXFxuJztcbiAgICAgICAgfSk7XG4gICAgfVxuICAgIGRlc2MuZmluZCgncGF5bG9hZC10eXBlJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIG1lZGlhICs9IFNEUFV0aWwuYnVpbGRfcnRwbWFwKHRoaXMpICsgJ1xcclxcbic7XG4gICAgICAgIGlmICgkKHRoaXMpLmZpbmQoJz5wYXJhbWV0ZXInKS5sZW5ndGgpIHtcbiAgICAgICAgICAgIG1lZGlhICs9ICdhPWZtdHA6JyArIHRoaXMuZ2V0QXR0cmlidXRlKCdpZCcpICsgJyAnO1xuICAgICAgICAgICAgbWVkaWEgKz0gJCh0aGlzKS5maW5kKCdwYXJhbWV0ZXInKS5tYXAoZnVuY3Rpb24gKCkgeyByZXR1cm4gKHRoaXMuZ2V0QXR0cmlidXRlKCduYW1lJykgPyAodGhpcy5nZXRBdHRyaWJ1dGUoJ25hbWUnKSArICc9JykgOiAnJykgKyB0aGlzLmdldEF0dHJpYnV0ZSgndmFsdWUnKTsgfSkuZ2V0KCkuam9pbignOyAnKTtcbiAgICAgICAgICAgIG1lZGlhICs9ICdcXHJcXG4nO1xuICAgICAgICB9XG4gICAgICAgIC8vIHhlcC0wMjkzXG4gICAgICAgIG1lZGlhICs9IHNlbGYuUnRjcEZiRnJvbUppbmdsZSgkKHRoaXMpLCB0aGlzLmdldEF0dHJpYnV0ZSgnaWQnKSk7XG4gICAgfSk7XG5cbiAgICAvLyB4ZXAtMDI5M1xuICAgIG1lZGlhICs9IHNlbGYuUnRjcEZiRnJvbUppbmdsZShkZXNjLCAnKicpO1xuXG4gICAgLy8geGVwLTAyOTRcbiAgICB0bXAgPSBkZXNjLmZpbmQoJz5ydHAtaGRyZXh0W3htbG5zPVwidXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOnJ0cC1oZHJleHQ6MFwiXScpO1xuICAgIHRtcC5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbWVkaWEgKz0gJ2E9ZXh0bWFwOicgKyB0aGlzLmdldEF0dHJpYnV0ZSgnaWQnKSArICcgJyArIHRoaXMuZ2V0QXR0cmlidXRlKCd1cmknKSArICdcXHJcXG4nO1xuICAgIH0pO1xuXG4gICAgY29udGVudC5maW5kKCc+dHJhbnNwb3J0W3htbG5zPVwidXJuOnhtcHA6amluZ2xlOnRyYW5zcG9ydHM6aWNlLXVkcDoxXCJdPmNhbmRpZGF0ZScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICBtZWRpYSArPSBTRFBVdGlsLmNhbmRpZGF0ZUZyb21KaW5nbGUodGhpcyk7XG4gICAgfSk7XG5cbiAgICAvLyBYRVAtMDMzOSBoYW5kbGUgc3NyYy1ncm91cCBhdHRyaWJ1dGVzXG4gICAgdG1wID0gY29udGVudC5maW5kKCdkZXNjcmlwdGlvbj5zc3JjLWdyb3VwW3htbG5zPVwidXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOnNzbWE6MFwiXScpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZW1hbnRpY3MgPSB0aGlzLmdldEF0dHJpYnV0ZSgnc2VtYW50aWNzJyk7XG4gICAgICAgIHZhciBzc3JjcyA9ICQodGhpcykuZmluZCgnPnNvdXJjZScpLm1hcChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZSgnc3NyYycpO1xuICAgICAgICB9KS5nZXQoKTtcblxuICAgICAgICBpZiAoc3NyY3MubGVuZ3RoICE9IDApIHtcbiAgICAgICAgICAgIG1lZGlhICs9ICdhPXNzcmMtZ3JvdXA6JyArIHNlbWFudGljcyArICcgJyArIHNzcmNzLmpvaW4oJyAnKSArICdcXHJcXG4nO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB0bXAgPSBjb250ZW50LmZpbmQoJ2Rlc2NyaXB0aW9uPnNvdXJjZVt4bWxucz1cInVybjp4bXBwOmppbmdsZTphcHBzOnJ0cDpzc21hOjBcIl0nKTtcbiAgICB0bXAuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzc3JjID0gdGhpcy5nZXRBdHRyaWJ1dGUoJ3NzcmMnKTtcbiAgICAgICAgJCh0aGlzKS5maW5kKCc+cGFyYW1ldGVyJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtZWRpYSArPSAnYT1zc3JjOicgKyBzc3JjICsgJyAnICsgdGhpcy5nZXRBdHRyaWJ1dGUoJ25hbWUnKTtcbiAgICAgICAgICAgIGlmICh0aGlzLmdldEF0dHJpYnV0ZSgndmFsdWUnKSAmJiB0aGlzLmdldEF0dHJpYnV0ZSgndmFsdWUnKS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgbWVkaWEgKz0gJzonICsgdGhpcy5nZXRBdHRyaWJ1dGUoJ3ZhbHVlJyk7XG4gICAgICAgICAgICBtZWRpYSArPSAnXFxyXFxuJztcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbWVkaWE7XG59O1xuXG5cbm1vZHVsZS5leHBvcnRzID0gU0RQO1xuXG4iLCJmdW5jdGlvbiBTRFBEaWZmZXIobXlTRFAsIG90aGVyU0RQKSB7XG4gICAgdGhpcy5teVNEUCA9IG15U0RQO1xuICAgIHRoaXMub3RoZXJTRFAgPSBvdGhlclNEUDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIG1hcCBvZiBNZWRpYUNoYW5uZWwgdGhhdCBjb250YWlucyBvbmx5IG1lZGlhIG5vdCBjb250YWluZWQgaW4gPHR0Pm90aGVyU2RwPC90dD4uIE1hcHBlZCBieSBjaGFubmVsIGlkeC5cbiAqIEBwYXJhbSBvdGhlclNkcCB0aGUgb3RoZXIgU0RQIHRvIGNoZWNrIHNzcmMgd2l0aC5cbiAqL1xuU0RQRGlmZmVyLnByb3RvdHlwZS5nZXROZXdNZWRpYSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gdGhpcyBjb3VsZCBiZSB1c2VmdWwgaW4gQXJyYXkucHJvdG90eXBlLlxuICAgIGZ1bmN0aW9uIGFycmF5RXF1YWxzKGFycmF5KSB7XG4gICAgICAgIC8vIGlmIHRoZSBvdGhlciBhcnJheSBpcyBhIGZhbHN5IHZhbHVlLCByZXR1cm5cbiAgICAgICAgaWYgKCFhcnJheSlcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAvLyBjb21wYXJlIGxlbmd0aHMgLSBjYW4gc2F2ZSBhIGxvdCBvZiB0aW1lXG4gICAgICAgIGlmICh0aGlzLmxlbmd0aCAhPSBhcnJheS5sZW5ndGgpXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGw9dGhpcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgbmVzdGVkIGFycmF5c1xuICAgICAgICAgICAgaWYgKHRoaXNbaV0gaW5zdGFuY2VvZiBBcnJheSAmJiBhcnJheVtpXSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgLy8gcmVjdXJzZSBpbnRvIHRoZSBuZXN0ZWQgYXJyYXlzXG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzW2ldLmVxdWFscyhhcnJheVtpXSkpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHRoaXNbaV0gIT0gYXJyYXlbaV0pIHtcbiAgICAgICAgICAgICAgICAvLyBXYXJuaW5nIC0gdHdvIGRpZmZlcmVudCBvYmplY3QgaW5zdGFuY2VzIHdpbGwgbmV2ZXIgYmUgZXF1YWw6IHt4OjIwfSAhPSB7eDoyMH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgdmFyIG15TWVkaWFzID0gdGhpcy5teVNEUC5nZXRNZWRpYVNzcmNNYXAoKTtcbiAgICB2YXIgb3RoZXJzTWVkaWFzID0gdGhpcy5vdGhlclNEUC5nZXRNZWRpYVNzcmNNYXAoKTtcbiAgICB2YXIgbmV3TWVkaWEgPSB7fTtcbiAgICBPYmplY3Qua2V5cyhvdGhlcnNNZWRpYXMpLmZvckVhY2goZnVuY3Rpb24ob3RoZXJzTWVkaWFJZHgpIHtcbiAgICAgICAgdmFyIG15TWVkaWEgPSBteU1lZGlhc1tvdGhlcnNNZWRpYUlkeF07XG4gICAgICAgIHZhciBvdGhlcnNNZWRpYSA9IG90aGVyc01lZGlhc1tvdGhlcnNNZWRpYUlkeF07XG4gICAgICAgIGlmKCFteU1lZGlhICYmIG90aGVyc01lZGlhKSB7XG4gICAgICAgICAgICAvLyBBZGQgd2hvbGUgY2hhbm5lbFxuICAgICAgICAgICAgbmV3TWVkaWFbb3RoZXJzTWVkaWFJZHhdID0gb3RoZXJzTWVkaWE7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgLy8gTG9vayBmb3IgbmV3IHNzcmNzIGFjY3Jvc3MgdGhlIGNoYW5uZWxcbiAgICAgICAgT2JqZWN0LmtleXMob3RoZXJzTWVkaWEuc3NyY3MpLmZvckVhY2goZnVuY3Rpb24oc3NyYykge1xuICAgICAgICAgICAgaWYoT2JqZWN0LmtleXMobXlNZWRpYS5zc3JjcykuaW5kZXhPZihzc3JjKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAvLyBBbGxvY2F0ZSBjaGFubmVsIGlmIHdlJ3ZlIGZvdW5kIHNzcmMgdGhhdCBkb2Vzbid0IGV4aXN0IGluIG91ciBjaGFubmVsXG4gICAgICAgICAgICAgICAgaWYoIW5ld01lZGlhW290aGVyc01lZGlhSWR4XSl7XG4gICAgICAgICAgICAgICAgICAgIG5ld01lZGlhW290aGVyc01lZGlhSWR4XSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lZGlhaW5kZXg6IG90aGVyc01lZGlhLm1lZGlhaW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgICBtaWQ6IG90aGVyc01lZGlhLm1pZCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNzcmNzOiB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNzcmNHcm91cHM6IFtdXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG5ld01lZGlhW290aGVyc01lZGlhSWR4XS5zc3Jjc1tzc3JjXSA9IG90aGVyc01lZGlhLnNzcmNzW3NzcmNdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyBMb29rIGZvciBuZXcgc3NyYyBncm91cHMgYWNyb3NzIHRoZSBjaGFubmVsc1xuICAgICAgICBvdGhlcnNNZWRpYS5zc3JjR3JvdXBzLmZvckVhY2goZnVuY3Rpb24ob3RoZXJTc3JjR3JvdXApe1xuXG4gICAgICAgICAgICAvLyB0cnkgdG8gbWF0Y2ggdGhlIG90aGVyIHNzcmMtZ3JvdXAgd2l0aCBhbiBzc3JjLWdyb3VwIG9mIG91cnNcbiAgICAgICAgICAgIHZhciBtYXRjaGVkID0gZmFsc2U7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG15TWVkaWEuc3NyY0dyb3Vwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBteVNzcmNHcm91cCA9IG15TWVkaWEuc3NyY0dyb3Vwc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAob3RoZXJTc3JjR3JvdXAuc2VtYW50aWNzID09IG15U3NyY0dyb3VwLnNlbWFudGljc1xuICAgICAgICAgICAgICAgICAgICAmJiBhcnJheUVxdWFscy5hcHBseShvdGhlclNzcmNHcm91cC5zc3JjcywgW215U3NyY0dyb3VwLnNzcmNzXSkpIHtcblxuICAgICAgICAgICAgICAgICAgICBtYXRjaGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoIW1hdGNoZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBBbGxvY2F0ZSBjaGFubmVsIGlmIHdlJ3ZlIGZvdW5kIGFuIHNzcmMtZ3JvdXAgdGhhdCBkb2Vzbid0XG4gICAgICAgICAgICAgICAgLy8gZXhpc3QgaW4gb3VyIGNoYW5uZWxcblxuICAgICAgICAgICAgICAgIGlmKCFuZXdNZWRpYVtvdGhlcnNNZWRpYUlkeF0pe1xuICAgICAgICAgICAgICAgICAgICBuZXdNZWRpYVtvdGhlcnNNZWRpYUlkeF0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZWRpYWluZGV4OiBvdGhlcnNNZWRpYS5tZWRpYWluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICAgbWlkOiBvdGhlcnNNZWRpYS5taWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBzc3Jjczoge30sXG4gICAgICAgICAgICAgICAgICAgICAgICBzc3JjR3JvdXBzOiBbXVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBuZXdNZWRpYVtvdGhlcnNNZWRpYUlkeF0uc3NyY0dyb3Vwcy5wdXNoKG90aGVyU3NyY0dyb3VwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSk7XG4gICAgcmV0dXJuIG5ld01lZGlhO1xufTtcblxuLyoqXG4gKiBTZW5kcyBTU1JDIHVwZGF0ZSBJUS5cbiAqIEBwYXJhbSBzZHBNZWRpYVNzcmNzIFNTUkNzIG1hcCBvYnRhaW5lZCBmcm9tIFNEUC5nZXROZXdNZWRpYS4gQ250YWlucyBTU1JDcyB0byBhZGQvcmVtb3ZlLlxuICogQHBhcmFtIHNpZCBzZXNzaW9uIGlkZW50aWZpZXIgdGhhdCB3aWxsIGJlIHB1dCBpbnRvIHRoZSBJUS5cbiAqIEBwYXJhbSBpbml0aWF0b3IgaW5pdGlhdG9yIGlkZW50aWZpZXIuXG4gKiBAcGFyYW0gdG9KaWQgZGVzdGluYXRpb24gSmlkXG4gKiBAcGFyYW0gaXNBZGQgaW5kaWNhdGVzIGlmIHRoaXMgaXMgcmVtb3ZlIG9yIGFkZCBvcGVyYXRpb24uXG4gKi9cblNEUERpZmZlci5wcm90b3R5cGUudG9KaW5nbGUgPSBmdW5jdGlvbihtb2RpZnkpIHtcbiAgICB2YXIgc2RwTWVkaWFTc3JjcyA9IHRoaXMuZ2V0TmV3TWVkaWEoKTtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAvLyBGSVhNRTogb25seSBhbm5vdW5jZSB2aWRlbyBzc3JjcyBzaW5jZSB3ZSBtaXggYXVkaW8gYW5kIGRvbnQgbmVlZFxuICAgIC8vICAgICAgdGhlIGF1ZGlvIHNzcmNzIHRoZXJlZm9yZVxuICAgIHZhciBtb2RpZmllZCA9IGZhbHNlO1xuICAgIE9iamVjdC5rZXlzKHNkcE1lZGlhU3NyY3MpLmZvckVhY2goZnVuY3Rpb24obWVkaWFpbmRleCl7XG4gICAgICAgIG1vZGlmaWVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIG1lZGlhID0gc2RwTWVkaWFTc3Jjc1ttZWRpYWluZGV4XTtcbiAgICAgICAgbW9kaWZ5LmMoJ2NvbnRlbnQnLCB7bmFtZTogbWVkaWEubWlkfSk7XG5cbiAgICAgICAgbW9kaWZ5LmMoJ2Rlc2NyaXB0aW9uJywge3htbG5zOid1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6MScsIG1lZGlhOiBtZWRpYS5taWR9KTtcbiAgICAgICAgLy8gRklYTUU6IG5vdCBjb21wbGV0bHkgc3VyZSB0aGlzIG9wZXJhdGVzIG9uIGJsb2NrcyBhbmQgLyBvciBoYW5kbGVzIGRpZmZlcmVudCBzc3JjcyBjb3JyZWN0bHlcbiAgICAgICAgLy8gZ2VuZXJhdGUgc291cmNlcyBmcm9tIGxpbmVzXG4gICAgICAgIE9iamVjdC5rZXlzKG1lZGlhLnNzcmNzKS5mb3JFYWNoKGZ1bmN0aW9uKHNzcmNOdW0pIHtcbiAgICAgICAgICAgIHZhciBtZWRpYVNzcmMgPSBtZWRpYS5zc3Jjc1tzc3JjTnVtXTtcbiAgICAgICAgICAgIG1vZGlmeS5jKCdzb3VyY2UnLCB7IHhtbG5zOiAndXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOnNzbWE6MCcgfSk7XG4gICAgICAgICAgICBtb2RpZnkuYXR0cnMoe3NzcmM6IG1lZGlhU3NyYy5zc3JjfSk7XG4gICAgICAgICAgICAvLyBpdGVyYXRlIG92ZXIgc3NyYyBsaW5lc1xuICAgICAgICAgICAgbWVkaWFTc3JjLmxpbmVzLmZvckVhY2goZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgICAgICAgICB2YXIgaWR4ID0gbGluZS5pbmRleE9mKCcgJyk7XG4gICAgICAgICAgICAgICAgdmFyIGt2ID0gbGluZS5zdWJzdHIoaWR4ICsgMSk7XG4gICAgICAgICAgICAgICAgbW9kaWZ5LmMoJ3BhcmFtZXRlcicpO1xuICAgICAgICAgICAgICAgIGlmIChrdi5pbmRleE9mKCc6JykgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kaWZ5LmF0dHJzKHsgbmFtZToga3YgfSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbW9kaWZ5LmF0dHJzKHsgbmFtZToga3Yuc3BsaXQoJzonLCAyKVswXSB9KTtcbiAgICAgICAgICAgICAgICAgICAgbW9kaWZ5LmF0dHJzKHsgdmFsdWU6IGt2LnNwbGl0KCc6JywgMilbMV0gfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1vZGlmeS51cCgpOyAvLyBlbmQgb2YgcGFyYW1ldGVyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIG1vZGlmeS51cCgpOyAvLyBlbmQgb2Ygc291cmNlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIGdlbmVyYXRlIHNvdXJjZSBncm91cHMgZnJvbSBsaW5lc1xuICAgICAgICBtZWRpYS5zc3JjR3JvdXBzLmZvckVhY2goZnVuY3Rpb24oc3NyY0dyb3VwKSB7XG4gICAgICAgICAgICBpZiAoc3NyY0dyb3VwLnNzcmNzLmxlbmd0aCAhPSAwKSB7XG5cbiAgICAgICAgICAgICAgICBtb2RpZnkuYygnc3NyYy1ncm91cCcsIHtcbiAgICAgICAgICAgICAgICAgICAgc2VtYW50aWNzOiBzc3JjR3JvdXAuc2VtYW50aWNzLFxuICAgICAgICAgICAgICAgICAgICB4bWxuczogJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDpzc21hOjAnXG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBzc3JjR3JvdXAuc3NyY3MuZm9yRWFjaChmdW5jdGlvbiAoc3NyYykge1xuICAgICAgICAgICAgICAgICAgICBtb2RpZnkuYygnc291cmNlJywgeyBzc3JjOiBzc3JjIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAudXAoKTsgLy8gZW5kIG9mIHNvdXJjZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG1vZGlmeS51cCgpOyAvLyBlbmQgb2Ygc3NyYy1ncm91cFxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2RpZnkudXAoKTsgLy8gZW5kIG9mIGRlc2NyaXB0aW9uXG4gICAgICAgIG1vZGlmeS51cCgpOyAvLyBlbmQgb2YgY29udGVudFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG1vZGlmaWVkO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBTRFBEaWZmZXI7IiwiU0RQVXRpbCA9IHtcbiAgICBpY2VwYXJhbXM6IGZ1bmN0aW9uIChtZWRpYWRlc2MsIHNlc3Npb25kZXNjKSB7XG4gICAgICAgIHZhciBkYXRhID0gbnVsbDtcbiAgICAgICAgaWYgKFNEUFV0aWwuZmluZF9saW5lKG1lZGlhZGVzYywgJ2E9aWNlLXVmcmFnOicsIHNlc3Npb25kZXNjKSAmJlxuICAgICAgICAgICAgU0RQVXRpbC5maW5kX2xpbmUobWVkaWFkZXNjLCAnYT1pY2UtcHdkOicsIHNlc3Npb25kZXNjKSkge1xuICAgICAgICAgICAgZGF0YSA9IHtcbiAgICAgICAgICAgICAgICB1ZnJhZzogU0RQVXRpbC5wYXJzZV9pY2V1ZnJhZyhTRFBVdGlsLmZpbmRfbGluZShtZWRpYWRlc2MsICdhPWljZS11ZnJhZzonLCBzZXNzaW9uZGVzYykpLFxuICAgICAgICAgICAgICAgIHB3ZDogU0RQVXRpbC5wYXJzZV9pY2Vwd2QoU0RQVXRpbC5maW5kX2xpbmUobWVkaWFkZXNjLCAnYT1pY2UtcHdkOicsIHNlc3Npb25kZXNjKSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcbiAgICBwYXJzZV9pY2V1ZnJhZzogZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgcmV0dXJuIGxpbmUuc3Vic3RyaW5nKDEyKTtcbiAgICB9LFxuICAgIGJ1aWxkX2ljZXVmcmFnOiBmdW5jdGlvbiAoZnJhZykge1xuICAgICAgICByZXR1cm4gJ2E9aWNlLXVmcmFnOicgKyBmcmFnO1xuICAgIH0sXG4gICAgcGFyc2VfaWNlcHdkOiBmdW5jdGlvbiAobGluZSkge1xuICAgICAgICByZXR1cm4gbGluZS5zdWJzdHJpbmcoMTApO1xuICAgIH0sXG4gICAgYnVpbGRfaWNlcHdkOiBmdW5jdGlvbiAocHdkKSB7XG4gICAgICAgIHJldHVybiAnYT1pY2UtcHdkOicgKyBwd2Q7XG4gICAgfSxcbiAgICBwYXJzZV9taWQ6IGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIHJldHVybiBsaW5lLnN1YnN0cmluZyg2KTtcbiAgICB9LFxuICAgIHBhcnNlX21saW5lOiBmdW5jdGlvbiAobGluZSkge1xuICAgICAgICB2YXIgcGFydHMgPSBsaW5lLnN1YnN0cmluZygyKS5zcGxpdCgnICcpLFxuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICBkYXRhLm1lZGlhID0gcGFydHMuc2hpZnQoKTtcbiAgICAgICAgZGF0YS5wb3J0ID0gcGFydHMuc2hpZnQoKTtcbiAgICAgICAgZGF0YS5wcm90byA9IHBhcnRzLnNoaWZ0KCk7XG4gICAgICAgIGlmIChwYXJ0c1twYXJ0cy5sZW5ndGggLSAxXSA9PT0gJycpIHsgLy8gdHJhaWxpbmcgd2hpdGVzcGFjZVxuICAgICAgICAgICAgcGFydHMucG9wKCk7XG4gICAgICAgIH1cbiAgICAgICAgZGF0YS5mbXQgPSBwYXJ0cztcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcbiAgICBidWlsZF9tbGluZTogZnVuY3Rpb24gKG1saW5lKSB7XG4gICAgICAgIHJldHVybiAnbT0nICsgbWxpbmUubWVkaWEgKyAnICcgKyBtbGluZS5wb3J0ICsgJyAnICsgbWxpbmUucHJvdG8gKyAnICcgKyBtbGluZS5mbXQuam9pbignICcpO1xuICAgIH0sXG4gICAgcGFyc2VfcnRwbWFwOiBmdW5jdGlvbiAobGluZSkge1xuICAgICAgICB2YXIgcGFydHMgPSBsaW5lLnN1YnN0cmluZyg5KS5zcGxpdCgnICcpLFxuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICBkYXRhLmlkID0gcGFydHMuc2hpZnQoKTtcbiAgICAgICAgcGFydHMgPSBwYXJ0c1swXS5zcGxpdCgnLycpO1xuICAgICAgICBkYXRhLm5hbWUgPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAgICBkYXRhLmNsb2NrcmF0ZSA9IHBhcnRzLnNoaWZ0KCk7XG4gICAgICAgIGRhdGEuY2hhbm5lbHMgPSBwYXJ0cy5sZW5ndGggPyBwYXJ0cy5zaGlmdCgpIDogJzEnO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFBhcnNlcyBTRFAgbGluZSBcImE9c2N0cG1hcDouLi5cIiBhbmQgZXh0cmFjdHMgU0NUUCBwb3J0IGZyb20gaXQuXG4gICAgICogQHBhcmFtIGxpbmUgZWcuIFwiYT1zY3RwbWFwOjUwMDAgd2VicnRjLWRhdGFjaGFubmVsXCJcbiAgICAgKiBAcmV0dXJucyBbU0NUUCBwb3J0IG51bWJlciwgcHJvdG9jb2wsIHN0cmVhbXNdXG4gICAgICovXG4gICAgcGFyc2Vfc2N0cG1hcDogZnVuY3Rpb24gKGxpbmUpXG4gICAge1xuICAgICAgICB2YXIgcGFydHMgPSBsaW5lLnN1YnN0cmluZygxMCkuc3BsaXQoJyAnKTtcbiAgICAgICAgdmFyIHNjdHBQb3J0ID0gcGFydHNbMF07XG4gICAgICAgIHZhciBwcm90b2NvbCA9IHBhcnRzWzFdO1xuICAgICAgICAvLyBTdHJlYW0gY291bnQgaXMgb3B0aW9uYWxcbiAgICAgICAgdmFyIHN0cmVhbUNvdW50ID0gcGFydHMubGVuZ3RoID4gMiA/IHBhcnRzWzJdIDogbnVsbDtcbiAgICAgICAgcmV0dXJuIFtzY3RwUG9ydCwgcHJvdG9jb2wsIHN0cmVhbUNvdW50XTsvLyBTQ1RQIHBvcnRcbiAgICB9LFxuICAgIGJ1aWxkX3J0cG1hcDogZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgIHZhciBsaW5lID0gJ2E9cnRwbWFwOicgKyBlbC5nZXRBdHRyaWJ1dGUoJ2lkJykgKyAnICcgKyBlbC5nZXRBdHRyaWJ1dGUoJ25hbWUnKSArICcvJyArIGVsLmdldEF0dHJpYnV0ZSgnY2xvY2tyYXRlJyk7XG4gICAgICAgIGlmIChlbC5nZXRBdHRyaWJ1dGUoJ2NoYW5uZWxzJykgJiYgZWwuZ2V0QXR0cmlidXRlKCdjaGFubmVscycpICE9ICcxJykge1xuICAgICAgICAgICAgbGluZSArPSAnLycgKyBlbC5nZXRBdHRyaWJ1dGUoJ2NoYW5uZWxzJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGxpbmU7XG4gICAgfSxcbiAgICBwYXJzZV9jcnlwdG86IGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3Vic3RyaW5nKDkpLnNwbGl0KCcgJyksXG4gICAgICAgICAgICBkYXRhID0ge307XG4gICAgICAgIGRhdGEudGFnID0gcGFydHMuc2hpZnQoKTtcbiAgICAgICAgZGF0YVsnY3J5cHRvLXN1aXRlJ10gPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAgICBkYXRhWydrZXktcGFyYW1zJ10gPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAgICBpZiAocGFydHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBkYXRhWydzZXNzaW9uLXBhcmFtcyddID0gcGFydHMuam9pbignICcpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG4gICAgcGFyc2VfZmluZ2VycHJpbnQ6IGZ1bmN0aW9uIChsaW5lKSB7IC8vIFJGQyA0NTcyXG4gICAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3Vic3RyaW5nKDE0KS5zcGxpdCgnICcpLFxuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICBkYXRhLmhhc2ggPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAgICBkYXRhLmZpbmdlcnByaW50ID0gcGFydHMuc2hpZnQoKTtcbiAgICAgICAgLy8gVE9ETyBhc3NlcnQgdGhhdCBmaW5nZXJwcmludCBzYXRpc2ZpZXMgMlVIRVggKihcIjpcIiAyVUhFWCkgP1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuICAgIHBhcnNlX2ZtdHA6IGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoJyAnKSxcbiAgICAgICAgICAgIGksIGtleSwgdmFsdWUsXG4gICAgICAgICAgICBkYXRhID0gW107XG4gICAgICAgIHBhcnRzLnNoaWZ0KCk7XG4gICAgICAgIHBhcnRzID0gcGFydHMuam9pbignICcpLnNwbGl0KCc7Jyk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwYXJ0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAga2V5ID0gcGFydHNbaV0uc3BsaXQoJz0nKVswXTtcbiAgICAgICAgICAgIHdoaWxlIChrZXkubGVuZ3RoICYmIGtleVswXSA9PSAnICcpIHtcbiAgICAgICAgICAgICAgICBrZXkgPSBrZXkuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWUgPSBwYXJ0c1tpXS5zcGxpdCgnPScpWzFdO1xuICAgICAgICAgICAgaWYgKGtleSAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGRhdGEucHVzaCh7bmFtZToga2V5LCB2YWx1ZTogdmFsdWV9KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgLy8gcmZjIDQ3MzMgKERUTUYpIHN0eWxlIHN0dWZmXG4gICAgICAgICAgICAgICAgZGF0YS5wdXNoKHtuYW1lOiAnJywgdmFsdWU6IGtleX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG4gICAgcGFyc2VfaWNlY2FuZGlkYXRlOiBmdW5jdGlvbiAobGluZSkge1xuICAgICAgICB2YXIgY2FuZGlkYXRlID0ge30sXG4gICAgICAgICAgICBlbGVtcyA9IGxpbmUuc3BsaXQoJyAnKTtcbiAgICAgICAgY2FuZGlkYXRlLmZvdW5kYXRpb24gPSBlbGVtc1swXS5zdWJzdHJpbmcoMTIpO1xuICAgICAgICBjYW5kaWRhdGUuY29tcG9uZW50ID0gZWxlbXNbMV07XG4gICAgICAgIGNhbmRpZGF0ZS5wcm90b2NvbCA9IGVsZW1zWzJdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGNhbmRpZGF0ZS5wcmlvcml0eSA9IGVsZW1zWzNdO1xuICAgICAgICBjYW5kaWRhdGUuaXAgPSBlbGVtc1s0XTtcbiAgICAgICAgY2FuZGlkYXRlLnBvcnQgPSBlbGVtc1s1XTtcbiAgICAgICAgLy8gZWxlbXNbNl0gPT4gXCJ0eXBcIlxuICAgICAgICBjYW5kaWRhdGUudHlwZSA9IGVsZW1zWzddO1xuICAgICAgICBjYW5kaWRhdGUuZ2VuZXJhdGlvbiA9IDA7IC8vIGRlZmF1bHQgdmFsdWUsIG1heSBiZSBvdmVyd3JpdHRlbiBiZWxvd1xuICAgICAgICBmb3IgKHZhciBpID0gODsgaSA8IGVsZW1zLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGVsZW1zW2ldKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAncmFkZHInOlxuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVbJ3JlbC1hZGRyJ10gPSBlbGVtc1tpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Jwb3J0JzpcbiAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlWydyZWwtcG9ydCddID0gZWxlbXNbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdnZW5lcmF0aW9uJzpcbiAgICAgICAgICAgICAgICAgICAgY2FuZGlkYXRlLmdlbmVyYXRpb24gPSBlbGVtc1tpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ3RjcHR5cGUnOlxuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGUudGNwdHlwZSA9IGVsZW1zW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogLy8gVE9ET1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncGFyc2VfaWNlY2FuZGlkYXRlIG5vdCB0cmFuc2xhdGluZyBcIicgKyBlbGVtc1tpXSArICdcIiA9IFwiJyArIGVsZW1zW2kgKyAxXSArICdcIicpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNhbmRpZGF0ZS5uZXR3b3JrID0gJzEnO1xuICAgICAgICBjYW5kaWRhdGUuaWQgPSBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgMTApOyAvLyBub3QgYXBwbGljYWJsZSB0byBTRFAgLS0gRklYTUU6IHNob3VsZCBiZSB1bmlxdWUsIG5vdCBqdXN0IHJhbmRvbVxuICAgICAgICByZXR1cm4gY2FuZGlkYXRlO1xuICAgIH0sXG4gICAgYnVpbGRfaWNlY2FuZGlkYXRlOiBmdW5jdGlvbiAoY2FuZCkge1xuICAgICAgICB2YXIgbGluZSA9IFsnYT1jYW5kaWRhdGU6JyArIGNhbmQuZm91bmRhdGlvbiwgY2FuZC5jb21wb25lbnQsIGNhbmQucHJvdG9jb2wsIGNhbmQucHJpb3JpdHksIGNhbmQuaXAsIGNhbmQucG9ydCwgJ3R5cCcsIGNhbmQudHlwZV0uam9pbignICcpO1xuICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgc3dpdGNoIChjYW5kLnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NyZmx4JzpcbiAgICAgICAgICAgIGNhc2UgJ3ByZmx4JzpcbiAgICAgICAgICAgIGNhc2UgJ3JlbGF5JzpcbiAgICAgICAgICAgICAgICBpZiAoY2FuZC5oYXNPd25BdHRyaWJ1dGUoJ3JlbC1hZGRyJykgJiYgY2FuZC5oYXNPd25BdHRyaWJ1dGUoJ3JlbC1wb3J0JykpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSAncmFkZHInO1xuICAgICAgICAgICAgICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSBjYW5kWydyZWwtYWRkciddO1xuICAgICAgICAgICAgICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSAncnBvcnQnO1xuICAgICAgICAgICAgICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSBjYW5kWydyZWwtcG9ydCddO1xuICAgICAgICAgICAgICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNhbmQuaGFzT3duQXR0cmlidXRlKCd0Y3B0eXBlJykpIHtcbiAgICAgICAgICAgIGxpbmUgKz0gJ3RjcHR5cGUnO1xuICAgICAgICAgICAgbGluZSArPSAnICc7XG4gICAgICAgICAgICBsaW5lICs9IGNhbmQudGNwdHlwZTtcbiAgICAgICAgICAgIGxpbmUgKz0gJyAnO1xuICAgICAgICB9XG4gICAgICAgIGxpbmUgKz0gJ2dlbmVyYXRpb24nO1xuICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgbGluZSArPSBjYW5kLmhhc093bkF0dHJpYnV0ZSgnZ2VuZXJhdGlvbicpID8gY2FuZC5nZW5lcmF0aW9uIDogJzAnO1xuICAgICAgICByZXR1cm4gbGluZTtcbiAgICB9LFxuICAgIHBhcnNlX3NzcmM6IGZ1bmN0aW9uIChkZXNjKSB7XG4gICAgICAgIC8vIHByb3ByaWV0YXJ5IG1hcHBpbmcgb2YgYT1zc3JjIGxpbmVzXG4gICAgICAgIC8vIFRPRE86IHNlZSBcIkppbmdsZSBSVFAgU291cmNlIERlc2NyaXB0aW9uXCIgYnkgSnViZXJ0aSBhbmQgUC4gVGhhdGNoZXIgb24gZ29vZ2xlIGRvY3NcbiAgICAgICAgLy8gYW5kIHBhcnNlIGFjY29yZGluZyB0byB0aGF0XG4gICAgICAgIHZhciBsaW5lcyA9IGRlc2Muc3BsaXQoJ1xcclxcbicpLFxuICAgICAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAobGluZXNbaV0uc3Vic3RyaW5nKDAsIDcpID09ICdhPXNzcmM6Jykge1xuICAgICAgICAgICAgICAgIHZhciBpZHggPSBsaW5lc1tpXS5pbmRleE9mKCcgJyk7XG4gICAgICAgICAgICAgICAgZGF0YVtsaW5lc1tpXS5zdWJzdHIoaWR4ICsgMSkuc3BsaXQoJzonLCAyKVswXV0gPSBsaW5lc1tpXS5zdWJzdHIoaWR4ICsgMSkuc3BsaXQoJzonLCAyKVsxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuICAgIHBhcnNlX3J0Y3BmYjogZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgdmFyIHBhcnRzID0gbGluZS5zdWJzdHIoMTApLnNwbGl0KCcgJyk7XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIGRhdGEucHQgPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAgICBkYXRhLnR5cGUgPSBwYXJ0cy5zaGlmdCgpO1xuICAgICAgICBkYXRhLnBhcmFtcyA9IHBhcnRzO1xuICAgICAgICByZXR1cm4gZGF0YTtcbiAgICB9LFxuICAgIHBhcnNlX2V4dG1hcDogZnVuY3Rpb24gKGxpbmUpIHtcbiAgICAgICAgdmFyIHBhcnRzID0gbGluZS5zdWJzdHIoOSkuc3BsaXQoJyAnKTtcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcbiAgICAgICAgZGF0YS52YWx1ZSA9IHBhcnRzLnNoaWZ0KCk7XG4gICAgICAgIGlmIChkYXRhLnZhbHVlLmluZGV4T2YoJy8nKSAhPSAtMSkge1xuICAgICAgICAgICAgZGF0YS5kaXJlY3Rpb24gPSBkYXRhLnZhbHVlLnN1YnN0cihkYXRhLnZhbHVlLmluZGV4T2YoJy8nKSArIDEpO1xuICAgICAgICAgICAgZGF0YS52YWx1ZSA9IGRhdGEudmFsdWUuc3Vic3RyKDAsIGRhdGEudmFsdWUuaW5kZXhPZignLycpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRhdGEuZGlyZWN0aW9uID0gJ2JvdGgnO1xuICAgICAgICB9XG4gICAgICAgIGRhdGEudXJpID0gcGFydHMuc2hpZnQoKTtcbiAgICAgICAgZGF0YS5wYXJhbXMgPSBwYXJ0cztcbiAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgfSxcbiAgICBmaW5kX2xpbmU6IGZ1bmN0aW9uIChoYXlzdGFjaywgbmVlZGxlLCBzZXNzaW9ucGFydCkge1xuICAgICAgICB2YXIgbGluZXMgPSBoYXlzdGFjay5zcGxpdCgnXFxyXFxuJyk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGluZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChsaW5lc1tpXS5zdWJzdHJpbmcoMCwgbmVlZGxlLmxlbmd0aCkgPT0gbmVlZGxlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxpbmVzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghc2Vzc2lvbnBhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBzZWFyY2ggc2Vzc2lvbiBwYXJ0XG4gICAgICAgIGxpbmVzID0gc2Vzc2lvbnBhcnQuc3BsaXQoJ1xcclxcbicpO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBpZiAobGluZXNbal0uc3Vic3RyaW5nKDAsIG5lZWRsZS5sZW5ndGgpID09IG5lZWRsZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBsaW5lc1tqXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSxcbiAgICBmaW5kX2xpbmVzOiBmdW5jdGlvbiAoaGF5c3RhY2ssIG5lZWRsZSwgc2Vzc2lvbnBhcnQpIHtcbiAgICAgICAgdmFyIGxpbmVzID0gaGF5c3RhY2suc3BsaXQoJ1xcclxcbicpLFxuICAgICAgICAgICAgbmVlZGxlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAobGluZXNbaV0uc3Vic3RyaW5nKDAsIG5lZWRsZS5sZW5ndGgpID09IG5lZWRsZSlcbiAgICAgICAgICAgICAgICBuZWVkbGVzLnB1c2gobGluZXNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuZWVkbGVzLmxlbmd0aCB8fCAhc2Vzc2lvbnBhcnQpIHtcbiAgICAgICAgICAgIHJldHVybiBuZWVkbGVzO1xuICAgICAgICB9XG4gICAgICAgIC8vIHNlYXJjaCBzZXNzaW9uIHBhcnRcbiAgICAgICAgbGluZXMgPSBzZXNzaW9ucGFydC5zcGxpdCgnXFxyXFxuJyk7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgbGluZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChsaW5lc1tqXS5zdWJzdHJpbmcoMCwgbmVlZGxlLmxlbmd0aCkgPT0gbmVlZGxlKSB7XG4gICAgICAgICAgICAgICAgbmVlZGxlcy5wdXNoKGxpbmVzW2pdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmVlZGxlcztcbiAgICB9LFxuICAgIGNhbmRpZGF0ZVRvSmluZ2xlOiBmdW5jdGlvbiAobGluZSkge1xuICAgICAgICAvLyBhPWNhbmRpZGF0ZToyOTc5MTY2NjYyIDEgdWRwIDIxMTM5MzcxNTEgMTkyLjE2OC4yLjEwMCA1NzY5OCB0eXAgaG9zdCBnZW5lcmF0aW9uIDBcbiAgICAgICAgLy8gICAgICA8Y2FuZGlkYXRlIGNvbXBvbmVudD0uLi4gZm91bmRhdGlvbj0uLi4gZ2VuZXJhdGlvbj0uLi4gaWQ9Li4uIGlwPS4uLiBuZXR3b3JrPS4uLiBwb3J0PS4uLiBwcmlvcml0eT0uLi4gcHJvdG9jb2w9Li4uIHR5cGU9Li4uLz5cbiAgICAgICAgaWYgKGxpbmUuaW5kZXhPZignY2FuZGlkYXRlOicpID09PSAwKSB7XG4gICAgICAgICAgICBsaW5lID0gJ2E9JyArIGxpbmU7XG4gICAgICAgIH0gZWxzZSBpZiAobGluZS5zdWJzdHJpbmcoMCwgMTIpICE9ICdhPWNhbmRpZGF0ZTonKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygncGFyc2VDYW5kaWRhdGUgY2FsbGVkIHdpdGggYSBsaW5lIHRoYXQgaXMgbm90IGEgY2FuZGlkYXRlIGxpbmUnKTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKGxpbmUpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGxpbmUuc3Vic3RyaW5nKGxpbmUubGVuZ3RoIC0gMikgPT0gJ1xcclxcbicpIC8vIGNob21wIGl0XG4gICAgICAgICAgICBsaW5lID0gbGluZS5zdWJzdHJpbmcoMCwgbGluZS5sZW5ndGggLSAyKTtcbiAgICAgICAgdmFyIGNhbmRpZGF0ZSA9IHt9LFxuICAgICAgICAgICAgZWxlbXMgPSBsaW5lLnNwbGl0KCcgJyksXG4gICAgICAgICAgICBpO1xuICAgICAgICBpZiAoZWxlbXNbNl0gIT0gJ3R5cCcpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdkaWQgbm90IGZpbmQgdHlwIGluIHRoZSByaWdodCBwbGFjZScpO1xuICAgICAgICAgICAgY29uc29sZS5sb2cobGluZSk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjYW5kaWRhdGUuZm91bmRhdGlvbiA9IGVsZW1zWzBdLnN1YnN0cmluZygxMik7XG4gICAgICAgIGNhbmRpZGF0ZS5jb21wb25lbnQgPSBlbGVtc1sxXTtcbiAgICAgICAgY2FuZGlkYXRlLnByb3RvY29sID0gZWxlbXNbMl0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgY2FuZGlkYXRlLnByaW9yaXR5ID0gZWxlbXNbM107XG4gICAgICAgIGNhbmRpZGF0ZS5pcCA9IGVsZW1zWzRdO1xuICAgICAgICBjYW5kaWRhdGUucG9ydCA9IGVsZW1zWzVdO1xuICAgICAgICAvLyBlbGVtc1s2XSA9PiBcInR5cFwiXG4gICAgICAgIGNhbmRpZGF0ZS50eXBlID0gZWxlbXNbN107XG5cbiAgICAgICAgY2FuZGlkYXRlLmdlbmVyYXRpb24gPSAnMCc7IC8vIGRlZmF1bHQsIG1heSBiZSBvdmVyd3JpdHRlbiBiZWxvd1xuICAgICAgICBmb3IgKGkgPSA4OyBpIDwgZWxlbXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgICAgICAgIHN3aXRjaCAoZWxlbXNbaV0pIHtcbiAgICAgICAgICAgICAgICBjYXNlICdyYWRkcic6XG4gICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZVsncmVsLWFkZHInXSA9IGVsZW1zW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAncnBvcnQnOlxuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVbJ3JlbC1wb3J0J10gPSBlbGVtc1tpICsgMV07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2dlbmVyYXRpb24nOlxuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGUuZ2VuZXJhdGlvbiA9IGVsZW1zW2kgKyAxXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAndGNwdHlwZSc6XG4gICAgICAgICAgICAgICAgICAgIGNhbmRpZGF0ZS50Y3B0eXBlID0gZWxlbXNbaSArIDFdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiAvLyBUT0RPXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdub3QgdHJhbnNsYXRpbmcgXCInICsgZWxlbXNbaV0gKyAnXCIgPSBcIicgKyBlbGVtc1tpICsgMV0gKyAnXCInKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYW5kaWRhdGUubmV0d29yayA9ICcxJztcbiAgICAgICAgY2FuZGlkYXRlLmlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyKDIsIDEwKTsgLy8gbm90IGFwcGxpY2FibGUgdG8gU0RQIC0tIEZJWE1FOiBzaG91bGQgYmUgdW5pcXVlLCBub3QganVzdCByYW5kb21cbiAgICAgICAgcmV0dXJuIGNhbmRpZGF0ZTtcbiAgICB9LFxuICAgIGNhbmRpZGF0ZUZyb21KaW5nbGU6IGZ1bmN0aW9uIChjYW5kKSB7XG4gICAgICAgIHZhciBsaW5lID0gJ2E9Y2FuZGlkYXRlOic7XG4gICAgICAgIGxpbmUgKz0gY2FuZC5nZXRBdHRyaWJ1dGUoJ2ZvdW5kYXRpb24nKTtcbiAgICAgICAgbGluZSArPSAnICc7XG4gICAgICAgIGxpbmUgKz0gY2FuZC5nZXRBdHRyaWJ1dGUoJ2NvbXBvbmVudCcpO1xuICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgbGluZSArPSBjYW5kLmdldEF0dHJpYnV0ZSgncHJvdG9jb2wnKTsgLy8udG9VcHBlckNhc2UoKTsgLy8gY2hyb21lIE0yMyBkb2Vzbid0IGxpa2UgdGhpc1xuICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgbGluZSArPSBjYW5kLmdldEF0dHJpYnV0ZSgncHJpb3JpdHknKTtcbiAgICAgICAgbGluZSArPSAnICc7XG4gICAgICAgIGxpbmUgKz0gY2FuZC5nZXRBdHRyaWJ1dGUoJ2lwJyk7XG4gICAgICAgIGxpbmUgKz0gJyAnO1xuICAgICAgICBsaW5lICs9IGNhbmQuZ2V0QXR0cmlidXRlKCdwb3J0Jyk7XG4gICAgICAgIGxpbmUgKz0gJyAnO1xuICAgICAgICBsaW5lICs9ICd0eXAnO1xuICAgICAgICBsaW5lICs9ICcgJyArIGNhbmQuZ2V0QXR0cmlidXRlKCd0eXBlJyk7XG4gICAgICAgIGxpbmUgKz0gJyAnO1xuICAgICAgICBzd2l0Y2ggKGNhbmQuZ2V0QXR0cmlidXRlKCd0eXBlJykpIHtcbiAgICAgICAgICAgIGNhc2UgJ3NyZmx4JzpcbiAgICAgICAgICAgIGNhc2UgJ3ByZmx4JzpcbiAgICAgICAgICAgIGNhc2UgJ3JlbGF5JzpcbiAgICAgICAgICAgICAgICBpZiAoY2FuZC5nZXRBdHRyaWJ1dGUoJ3JlbC1hZGRyJykgJiYgY2FuZC5nZXRBdHRyaWJ1dGUoJ3JlbC1wb3J0JykpIHtcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSAncmFkZHInO1xuICAgICAgICAgICAgICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSBjYW5kLmdldEF0dHJpYnV0ZSgncmVsLWFkZHInKTtcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gJ3Jwb3J0JztcbiAgICAgICAgICAgICAgICAgICAgbGluZSArPSAnICc7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gY2FuZC5nZXRBdHRyaWJ1dGUoJ3JlbC1wb3J0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGxpbmUgKz0gJyAnO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoY2FuZC5nZXRBdHRyaWJ1dGUoJ3Byb3RvY29sJykudG9Mb3dlckNhc2UoKSA9PSAndGNwJykge1xuICAgICAgICAgICAgbGluZSArPSAndGNwdHlwZSc7XG4gICAgICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgICAgIGxpbmUgKz0gY2FuZC5nZXRBdHRyaWJ1dGUoJ3RjcHR5cGUnKTtcbiAgICAgICAgICAgIGxpbmUgKz0gJyAnO1xuICAgICAgICB9XG4gICAgICAgIGxpbmUgKz0gJ2dlbmVyYXRpb24nO1xuICAgICAgICBsaW5lICs9ICcgJztcbiAgICAgICAgbGluZSArPSBjYW5kLmdldEF0dHJpYnV0ZSgnZ2VuZXJhdGlvbicpIHx8ICcwJztcbiAgICAgICAgcmV0dXJuIGxpbmUgKyAnXFxyXFxuJztcbiAgICB9XG59O1xubW9kdWxlLmV4cG9ydHMgPSBTRFBVdGlsOyIsImZ1bmN0aW9uIFRyYWNlYWJsZVBlZXJDb25uZWN0aW9uKGljZV9jb25maWcsIGNvbnN0cmFpbnRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBSVENQZWVyY29ubmVjdGlvbiA9IG5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgPyBtb3pSVENQZWVyQ29ubmVjdGlvbiA6IHdlYmtpdFJUQ1BlZXJDb25uZWN0aW9uO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24gPSBuZXcgUlRDUGVlcmNvbm5lY3Rpb24oaWNlX2NvbmZpZywgY29uc3RyYWludHMpO1xuICAgIHRoaXMudXBkYXRlTG9nID0gW107XG4gICAgdGhpcy5zdGF0cyA9IHt9O1xuICAgIHRoaXMuc3RhdHNpbnRlcnZhbCA9IG51bGw7XG4gICAgdGhpcy5tYXhzdGF0cyA9IDA7IC8vIGxpbWl0IHRvIDMwMCB2YWx1ZXMsIGkuZS4gNSBtaW51dGVzOyBzZXQgdG8gMCB0byBkaXNhYmxlXG5cbiAgICAvLyBvdmVycmlkZSBhcyBkZXNpcmVkXG4gICAgdGhpcy50cmFjZSA9IGZ1bmN0aW9uICh3aGF0LCBpbmZvKSB7XG4gICAgICAgIC8vY29uc29sZS53YXJuKCdXVFJBQ0UnLCB3aGF0LCBpbmZvKTtcbiAgICAgICAgc2VsZi51cGRhdGVMb2cucHVzaCh7XG4gICAgICAgICAgICB0aW1lOiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgdHlwZTogd2hhdCxcbiAgICAgICAgICAgIHZhbHVlOiBpbmZvIHx8IFwiXCJcbiAgICAgICAgfSk7XG4gICAgfTtcbiAgICB0aGlzLm9uaWNlY2FuZGlkYXRlID0gbnVsbDtcbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uLm9uaWNlY2FuZGlkYXRlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHNlbGYudHJhY2UoJ29uaWNlY2FuZGlkYXRlJywgSlNPTi5zdHJpbmdpZnkoZXZlbnQuY2FuZGlkYXRlLCBudWxsLCAnICcpKTtcbiAgICAgICAgaWYgKHNlbGYub25pY2VjYW5kaWRhdGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNlbGYub25pY2VjYW5kaWRhdGUoZXZlbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLm9uYWRkc3RyZWFtID0gbnVsbDtcbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uLm9uYWRkc3RyZWFtID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHNlbGYudHJhY2UoJ29uYWRkc3RyZWFtJywgZXZlbnQuc3RyZWFtLmlkKTtcbiAgICAgICAgaWYgKHNlbGYub25hZGRzdHJlYW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNlbGYub25hZGRzdHJlYW0oZXZlbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLm9ucmVtb3Zlc3RyZWFtID0gbnVsbDtcbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uLm9ucmVtb3Zlc3RyZWFtID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgIHNlbGYudHJhY2UoJ29ucmVtb3Zlc3RyZWFtJywgZXZlbnQuc3RyZWFtLmlkKTtcbiAgICAgICAgaWYgKHNlbGYub25yZW1vdmVzdHJlYW0gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNlbGYub25yZW1vdmVzdHJlYW0oZXZlbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLm9uc2lnbmFsaW5nc3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24ub25zaWduYWxpbmdzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBzZWxmLnRyYWNlKCdvbnNpZ25hbGluZ3N0YXRlY2hhbmdlJywgc2VsZi5zaWduYWxpbmdTdGF0ZSk7XG4gICAgICAgIGlmIChzZWxmLm9uc2lnbmFsaW5nc3RhdGVjaGFuZ2UgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNlbGYub25zaWduYWxpbmdzdGF0ZWNoYW5nZShldmVudCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMub25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSBudWxsO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24ub25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgc2VsZi50cmFjZSgnb25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UnLCBzZWxmLmljZUNvbm5lY3Rpb25TdGF0ZSk7XG4gICAgICAgIGlmIChzZWxmLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZWxmLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlKGV2ZW50KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5vbm5lZ290aWF0aW9ubmVlZGVkID0gbnVsbDtcbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uLm9ubmVnb3RpYXRpb25uZWVkZWQgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgc2VsZi50cmFjZSgnb25uZWdvdGlhdGlvbm5lZWRlZCcpO1xuICAgICAgICBpZiAoc2VsZi5vbm5lZ290aWF0aW9ubmVlZGVkICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZWxmLm9ubmVnb3RpYXRpb25uZWVkZWQoZXZlbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBzZWxmLm9uZGF0YWNoYW5uZWwgPSBudWxsO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24ub25kYXRhY2hhbm5lbCA9IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICBzZWxmLnRyYWNlKCdvbmRhdGFjaGFubmVsJywgZXZlbnQpO1xuICAgICAgICBpZiAoc2VsZi5vbmRhdGFjaGFubmVsICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZWxmLm9uZGF0YWNoYW5uZWwoZXZlbnQpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBpZiAoIW5hdmlnYXRvci5tb3pHZXRVc2VyTWVkaWEgJiYgdGhpcy5tYXhzdGF0cykge1xuICAgICAgICB0aGlzLnN0YXRzaW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBzZWxmLnBlZXJjb25uZWN0aW9uLmdldFN0YXRzKGZ1bmN0aW9uKHN0YXRzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBzdGF0cy5yZXN1bHQoKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhyZXN1bHRzW2ldLnR5cGUsIHJlc3VsdHNbaV0uaWQsIHJlc3VsdHNbaV0ubmFtZXMoKSlcbiAgICAgICAgICAgICAgICAgICAgdmFyIG5vdyA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbaV0ubmFtZXMoKS5mb3JFYWNoKGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSByZXN1bHRzW2ldLmlkICsgJy0nICsgbmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghc2VsZi5zdGF0c1tpZF0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnN0YXRzW2lkXSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRUaW1lOiBub3csXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuZFRpbWU6IG5vdyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGltZXM6IFtdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3RhdHNbaWRdLnZhbHVlcy5wdXNoKHJlc3VsdHNbaV0uc3RhdChuYW1lKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnN0YXRzW2lkXS50aW1lcy5wdXNoKG5vdy5nZXRUaW1lKCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuc3RhdHNbaWRdLnZhbHVlcy5sZW5ndGggPiBzZWxmLm1heHN0YXRzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGF0c1tpZF0udmFsdWVzLnNoaWZ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zdGF0c1tpZF0udGltZXMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuc3RhdHNbaWRdLmVuZFRpbWUgPSBub3c7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sIDEwMDApO1xuICAgIH1cbn07XG5cbmR1bXBTRFAgPSBmdW5jdGlvbihkZXNjcmlwdGlvbikge1xuICAgIHJldHVybiAndHlwZTogJyArIGRlc2NyaXB0aW9uLnR5cGUgKyAnXFxyXFxuJyArIGRlc2NyaXB0aW9uLnNkcDtcbn1cblxuaWYgKFRyYWNlYWJsZVBlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5fX2RlZmluZUdldHRlcl9fICE9PSB1bmRlZmluZWQpIHtcbiAgICBUcmFjZWFibGVQZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfXygnc2lnbmFsaW5nU3RhdGUnLCBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMucGVlcmNvbm5lY3Rpb24uc2lnbmFsaW5nU3RhdGU7IH0pO1xuICAgIFRyYWNlYWJsZVBlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5fX2RlZmluZUdldHRlcl9fKCdpY2VDb25uZWN0aW9uU3RhdGUnLCBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMucGVlcmNvbm5lY3Rpb24uaWNlQ29ubmVjdGlvblN0YXRlOyB9KTtcbiAgICBUcmFjZWFibGVQZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfXygnbG9jYWxEZXNjcmlwdGlvbicsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcHVibGljTG9jYWxEZXNjcmlwdGlvbiA9IHNpbXVsY2FzdC5yZXZlcnNlVHJhbnNmb3JtTG9jYWxEZXNjcmlwdGlvbih0aGlzLnBlZXJjb25uZWN0aW9uLmxvY2FsRGVzY3JpcHRpb24pO1xuICAgICAgICByZXR1cm4gcHVibGljTG9jYWxEZXNjcmlwdGlvbjtcbiAgICB9KTtcbiAgICBUcmFjZWFibGVQZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuX19kZWZpbmVHZXR0ZXJfXygncmVtb3RlRGVzY3JpcHRpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHB1YmxpY1JlbW90ZURlc2NyaXB0aW9uID0gc2ltdWxjYXN0LnJldmVyc2VUcmFuc2Zvcm1SZW1vdGVEZXNjcmlwdGlvbih0aGlzLnBlZXJjb25uZWN0aW9uLnJlbW90ZURlc2NyaXB0aW9uKTtcbiAgICAgICAgcmV0dXJuIHB1YmxpY1JlbW90ZURlc2NyaXB0aW9uO1xuICAgIH0pO1xufVxuXG5UcmFjZWFibGVQZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuYWRkU3RyZWFtID0gZnVuY3Rpb24gKHN0cmVhbSkge1xuICAgIHRoaXMudHJhY2UoJ2FkZFN0cmVhbScsIHN0cmVhbS5pZCk7XG4gICAgc2ltdWxjYXN0LnJlc2V0U2VuZGVyKCk7XG4gICAgdHJ5XG4gICAge1xuICAgICAgICB0aGlzLnBlZXJjb25uZWN0aW9uLmFkZFN0cmVhbShzdHJlYW0pO1xuICAgIH1cbiAgICBjYXRjaCAoZSlcbiAgICB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoZSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG59O1xuXG5UcmFjZWFibGVQZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUucmVtb3ZlU3RyZWFtID0gZnVuY3Rpb24gKHN0cmVhbSwgc3RvcFN0cmVhbXMpIHtcbiAgICB0aGlzLnRyYWNlKCdyZW1vdmVTdHJlYW0nLCBzdHJlYW0uaWQpO1xuICAgIHNpbXVsY2FzdC5yZXNldFNlbmRlcigpO1xuICAgIGlmKHN0b3BTdHJlYW1zKSB7XG4gICAgICAgIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpLmZvckVhY2goZnVuY3Rpb24gKHRyYWNrKSB7XG4gICAgICAgICAgICB0cmFjay5zdG9wKCk7XG4gICAgICAgIH0pO1xuICAgICAgICBzdHJlYW0uZ2V0VmlkZW9UcmFja3MoKS5mb3JFYWNoKGZ1bmN0aW9uICh0cmFjaykge1xuICAgICAgICAgICAgdHJhY2suc3RvcCgpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgdGhpcy5wZWVyY29ubmVjdGlvbi5yZW1vdmVTdHJlYW0oc3RyZWFtKTtcbn07XG5cblRyYWNlYWJsZVBlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5jcmVhdGVEYXRhQ2hhbm5lbCA9IGZ1bmN0aW9uIChsYWJlbCwgb3B0cykge1xuICAgIHRoaXMudHJhY2UoJ2NyZWF0ZURhdGFDaGFubmVsJywgbGFiZWwsIG9wdHMpO1xuICAgIHJldHVybiB0aGlzLnBlZXJjb25uZWN0aW9uLmNyZWF0ZURhdGFDaGFubmVsKGxhYmVsLCBvcHRzKTtcbn07XG5cblRyYWNlYWJsZVBlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5zZXRMb2NhbERlc2NyaXB0aW9uID0gZnVuY3Rpb24gKGRlc2NyaXB0aW9uLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBkZXNjcmlwdGlvbiA9IHNpbXVsY2FzdC50cmFuc2Zvcm1Mb2NhbERlc2NyaXB0aW9uKGRlc2NyaXB0aW9uKTtcbiAgICB0aGlzLnRyYWNlKCdzZXRMb2NhbERlc2NyaXB0aW9uJywgZHVtcFNEUChkZXNjcmlwdGlvbikpO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24uc2V0TG9jYWxEZXNjcmlwdGlvbihkZXNjcmlwdGlvbixcbiAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi50cmFjZSgnc2V0TG9jYWxEZXNjcmlwdGlvbk9uU3VjY2VzcycpO1xuICAgICAgICAgICAgc3VjY2Vzc0NhbGxiYWNrKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIHNlbGYudHJhY2UoJ3NldExvY2FsRGVzY3JpcHRpb25PbkZhaWx1cmUnLCBlcnIpO1xuICAgICAgICAgICAgZmFpbHVyZUNhbGxiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICApO1xuICAgIC8qXG4gICAgIGlmICh0aGlzLnN0YXRzaW50ZXJ2YWwgPT09IG51bGwgJiYgdGhpcy5tYXhzdGF0cyA+IDApIHtcbiAgICAgLy8gc3RhcnQgZ2F0aGVyaW5nIHN0YXRzXG4gICAgIH1cbiAgICAgKi9cbn07XG5cblRyYWNlYWJsZVBlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5zZXRSZW1vdGVEZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChkZXNjcmlwdGlvbiwgc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZGVzY3JpcHRpb24gPSBzaW11bGNhc3QudHJhbnNmb3JtUmVtb3RlRGVzY3JpcHRpb24oZGVzY3JpcHRpb24pO1xuICAgIHRoaXMudHJhY2UoJ3NldFJlbW90ZURlc2NyaXB0aW9uJywgZHVtcFNEUChkZXNjcmlwdGlvbikpO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24uc2V0UmVtb3RlRGVzY3JpcHRpb24oZGVzY3JpcHRpb24sXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYudHJhY2UoJ3NldFJlbW90ZURlc2NyaXB0aW9uT25TdWNjZXNzJyk7XG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgc2VsZi50cmFjZSgnc2V0UmVtb3RlRGVzY3JpcHRpb25PbkZhaWx1cmUnLCBlcnIpO1xuICAgICAgICAgICAgZmFpbHVyZUNhbGxiYWNrKGVycik7XG4gICAgICAgIH1cbiAgICApO1xuICAgIC8qXG4gICAgIGlmICh0aGlzLnN0YXRzaW50ZXJ2YWwgPT09IG51bGwgJiYgdGhpcy5tYXhzdGF0cyA+IDApIHtcbiAgICAgLy8gc3RhcnQgZ2F0aGVyaW5nIHN0YXRzXG4gICAgIH1cbiAgICAgKi9cbn07XG5cblRyYWNlYWJsZVBlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnRyYWNlKCdzdG9wJyk7XG4gICAgaWYgKHRoaXMuc3RhdHNpbnRlcnZhbCAhPT0gbnVsbCkge1xuICAgICAgICB3aW5kb3cuY2xlYXJJbnRlcnZhbCh0aGlzLnN0YXRzaW50ZXJ2YWwpO1xuICAgICAgICB0aGlzLnN0YXRzaW50ZXJ2YWwgPSBudWxsO1xuICAgIH1cbiAgICB0aGlzLnBlZXJjb25uZWN0aW9uLmNsb3NlKCk7XG59O1xuXG5UcmFjZWFibGVQZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuY3JlYXRlT2ZmZXIgPSBmdW5jdGlvbiAoc3VjY2Vzc0NhbGxiYWNrLCBmYWlsdXJlQ2FsbGJhY2ssIGNvbnN0cmFpbnRzKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHRoaXMudHJhY2UoJ2NyZWF0ZU9mZmVyJywgSlNPTi5zdHJpbmdpZnkoY29uc3RyYWludHMsIG51bGwsICcgJykpO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24uY3JlYXRlT2ZmZXIoXG4gICAgICAgIGZ1bmN0aW9uIChvZmZlcikge1xuICAgICAgICAgICAgc2VsZi50cmFjZSgnY3JlYXRlT2ZmZXJPblN1Y2Nlc3MnLCBkdW1wU0RQKG9mZmVyKSk7XG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2sob2ZmZXIpO1xuICAgICAgICB9LFxuICAgICAgICBmdW5jdGlvbihlcnIpIHtcbiAgICAgICAgICAgIHNlbGYudHJhY2UoJ2NyZWF0ZU9mZmVyT25GYWlsdXJlJywgZXJyKTtcbiAgICAgICAgICAgIGZhaWx1cmVDYWxsYmFjayhlcnIpO1xuICAgICAgICB9LFxuICAgICAgICBjb25zdHJhaW50c1xuICAgICk7XG59O1xuXG5UcmFjZWFibGVQZWVyQ29ubmVjdGlvbi5wcm90b3R5cGUuY3JlYXRlQW5zd2VyID0gZnVuY3Rpb24gKHN1Y2Nlc3NDYWxsYmFjaywgZmFpbHVyZUNhbGxiYWNrLCBjb25zdHJhaW50cykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnRyYWNlKCdjcmVhdGVBbnN3ZXInLCBKU09OLnN0cmluZ2lmeShjb25zdHJhaW50cywgbnVsbCwgJyAnKSk7XG4gICAgdGhpcy5wZWVyY29ubmVjdGlvbi5jcmVhdGVBbnN3ZXIoXG4gICAgICAgIGZ1bmN0aW9uIChhbnN3ZXIpIHtcbiAgICAgICAgICAgIGFuc3dlciA9IHNpbXVsY2FzdC50cmFuc2Zvcm1BbnN3ZXIoYW5zd2VyKTtcbiAgICAgICAgICAgIHNlbGYudHJhY2UoJ2NyZWF0ZUFuc3dlck9uU3VjY2VzcycsIGR1bXBTRFAoYW5zd2VyKSk7XG4gICAgICAgICAgICBzdWNjZXNzQ2FsbGJhY2soYW5zd2VyKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgICAgICBzZWxmLnRyYWNlKCdjcmVhdGVBbnN3ZXJPbkZhaWx1cmUnLCBlcnIpO1xuICAgICAgICAgICAgZmFpbHVyZUNhbGxiYWNrKGVycik7XG4gICAgICAgIH0sXG4gICAgICAgIGNvbnN0cmFpbnRzXG4gICAgKTtcbn07XG5cblRyYWNlYWJsZVBlZXJDb25uZWN0aW9uLnByb3RvdHlwZS5hZGRJY2VDYW5kaWRhdGUgPSBmdW5jdGlvbiAoY2FuZGlkYXRlLCBzdWNjZXNzQ2FsbGJhY2ssIGZhaWx1cmVDYWxsYmFjaykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB0aGlzLnRyYWNlKCdhZGRJY2VDYW5kaWRhdGUnLCBKU09OLnN0cmluZ2lmeShjYW5kaWRhdGUsIG51bGwsICcgJykpO1xuICAgIHRoaXMucGVlcmNvbm5lY3Rpb24uYWRkSWNlQ2FuZGlkYXRlKGNhbmRpZGF0ZSk7XG4gICAgLyogbWF5YmUgbGF0ZXJcbiAgICAgdGhpcy5wZWVyY29ubmVjdGlvbi5hZGRJY2VDYW5kaWRhdGUoY2FuZGlkYXRlLFxuICAgICBmdW5jdGlvbiAoKSB7XG4gICAgIHNlbGYudHJhY2UoJ2FkZEljZUNhbmRpZGF0ZU9uU3VjY2VzcycpO1xuICAgICBzdWNjZXNzQ2FsbGJhY2soKTtcbiAgICAgfSxcbiAgICAgZnVuY3Rpb24gKGVycikge1xuICAgICBzZWxmLnRyYWNlKCdhZGRJY2VDYW5kaWRhdGVPbkZhaWx1cmUnLCBlcnIpO1xuICAgICBmYWlsdXJlQ2FsbGJhY2soZXJyKTtcbiAgICAgfVxuICAgICApO1xuICAgICAqL1xufTtcblxuVHJhY2VhYmxlUGVlckNvbm5lY3Rpb24ucHJvdG90eXBlLmdldFN0YXRzID0gZnVuY3Rpb24oY2FsbGJhY2ssIGVycmJhY2spIHtcbiAgICBpZiAobmF2aWdhdG9yLm1vekdldFVzZXJNZWRpYSkge1xuICAgICAgICAvLyBpZ25vcmUgZm9yIG5vdy4uLlxuICAgICAgICBpZighZXJyYmFjaylcbiAgICAgICAgICAgIGVycmJhY2sgPSBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgdGhpcy5wZWVyY29ubmVjdGlvbi5nZXRTdGF0cyhudWxsLGNhbGxiYWNrLGVycmJhY2spO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucGVlcmNvbm5lY3Rpb24uZ2V0U3RhdHMoY2FsbGJhY2spO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhY2VhYmxlUGVlckNvbm5lY3Rpb247XG5cbiIsIi8qIGdsb2JhbCAkLCAkaXEsIGNvbmZpZywgY29ubmVjdGlvbiwgVUksIG1lc3NhZ2VIYW5kbGVyLFxuIHJvb21OYW1lLCBzZXNzaW9uVGVybWluYXRlZCwgU3Ryb3BoZSwgVXRpbCAqL1xuLyoqXG4gKiBDb250YWlucyBsb2dpYyByZXNwb25zaWJsZSBmb3IgZW5hYmxpbmcvZGlzYWJsaW5nIGZ1bmN0aW9uYWxpdHkgYXZhaWxhYmxlXG4gKiBvbmx5IHRvIG1vZGVyYXRvciB1c2Vycy5cbiAqL1xudmFyIGNvbm5lY3Rpb24gPSBudWxsO1xudmFyIGZvY3VzVXNlckppZDtcbnZhciBnZXROZXh0VGltZW91dCA9IFV0aWwuY3JlYXRlRXhwQmFja29mZlRpbWVyKDEwMDApO1xudmFyIGdldE5leHRFcnJvclRpbWVvdXQgPSBVdGlsLmNyZWF0ZUV4cEJhY2tvZmZUaW1lcigxMDAwKTtcbi8vIEV4dGVybmFsIGF1dGhlbnRpY2F0aW9uIHN0dWZmXG52YXIgZXh0ZXJuYWxBdXRoRW5hYmxlZCA9IGZhbHNlO1xuLy8gU2lwIGdhdGV3YXkgY2FuIGJlIGVuYWJsZWQgYnkgY29uZmlndXJpbmcgSmlnYXNpIGhvc3QgaW4gY29uZmlnLmpzIG9yXG4vLyBpdCB3aWxsIGJlIGVuYWJsZWQgYXV0b21hdGljYWxseSBpZiBmb2N1cyBkZXRlY3RzIHRoZSBjb21wb25lbnQgdGhyb3VnaFxuLy8gc2VydmljZSBkaXNjb3ZlcnkuXG52YXIgc2lwR2F0ZXdheUVuYWJsZWQgPSBjb25maWcuaG9zdHMuY2FsbF9jb250cm9sICE9PSB1bmRlZmluZWQ7XG5cbnZhciBNb2RlcmF0b3IgPSB7XG4gICAgaXNNb2RlcmF0b3I6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5lbXVjLmlzTW9kZXJhdG9yKCk7XG4gICAgfSxcblxuICAgIGlzUGVlck1vZGVyYXRvcjogZnVuY3Rpb24gKHBlZXJKaWQpIHtcbiAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24gJiZcbiAgICAgICAgICAgIGNvbm5lY3Rpb24uZW11Yy5nZXRNZW1iZXJSb2xlKHBlZXJKaWQpID09PSAnbW9kZXJhdG9yJztcbiAgICB9LFxuXG4gICAgaXNFeHRlcm5hbEF1dGhFbmFibGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBleHRlcm5hbEF1dGhFbmFibGVkO1xuICAgIH0sXG5cbiAgICBpc1NpcEdhdGV3YXlFbmFibGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzaXBHYXRld2F5RW5hYmxlZDtcbiAgICB9LFxuXG4gICAgc2V0Q29ubmVjdGlvbjogZnVuY3Rpb24gKGNvbikge1xuICAgICAgICBjb25uZWN0aW9uID0gY29uO1xuICAgIH0sXG5cbiAgICBpbml0OiBmdW5jdGlvbiAoeG1wcCkge1xuICAgICAgICB0aGlzLnhtcHBTZXJ2aWNlID0geG1wcDtcbiAgICAgICAgdGhpcy5vbkxvY2FsUm9sZUNoYW5nZSA9IGZ1bmN0aW9uIChmcm9tLCBtZW1iZXIsIHByZXMpIHtcbiAgICAgICAgICAgIFVJLm9uTW9kZXJhdG9yU3RhdHVzQ2hhbmdlZChNb2RlcmF0b3IuaXNNb2RlcmF0b3IoKSk7XG4gICAgICAgIH07XG4gICAgfSxcblxuICAgIG9uTXVjTGVmdDogZnVuY3Rpb24gKGppZCkge1xuICAgICAgICBjb25zb2xlLmluZm8oXCJTb21lb25lIGxlZnQgaXMgaXQgZm9jdXMgPyBcIiArIGppZCk7XG4gICAgICAgIHZhciByZXNvdXJjZSA9IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGppZCk7XG4gICAgICAgIGlmIChyZXNvdXJjZSA9PT0gJ2ZvY3VzJyAmJiAhdGhpcy54bXBwU2VydmljZS5zZXNzaW9uVGVybWluYXRlZCkge1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICAgICAgICAgIFwiRm9jdXMgaGFzIGxlZnQgdGhlIHJvb20gLSBsZWF2aW5nIGNvbmZlcmVuY2VcIik7XG4gICAgICAgICAgICAvL2hhbmdVcCgpO1xuICAgICAgICAgICAgLy8gV2UnZCByYXRoZXIgcmVsb2FkIHRvIGhhdmUgZXZlcnl0aGluZyByZS1pbml0aWFsaXplZFxuICAgICAgICAgICAgLy8gRklYTUU6IHNob3cgc29tZSBtZXNzYWdlIGJlZm9yZSByZWxvYWRcbiAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBcbiAgICBzZXRGb2N1c1VzZXJKaWQ6IGZ1bmN0aW9uIChmb2N1c0ppZCkge1xuICAgICAgICBpZiAoIWZvY3VzVXNlckppZCkge1xuICAgICAgICAgICAgZm9jdXNVc2VySmlkID0gZm9jdXNKaWQ7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJGb2N1cyBqaWQgc2V0IHRvOiBcIiArIGZvY3VzVXNlckppZCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZ2V0Rm9jdXNVc2VySmlkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBmb2N1c1VzZXJKaWQ7XG4gICAgfSxcblxuICAgIGdldEZvY3VzQ29tcG9uZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIC8vIEdldCBmb2N1cyBjb21wb25lbnQgYWRkcmVzc1xuICAgICAgICB2YXIgZm9jdXNDb21wb25lbnQgPSBjb25maWcuaG9zdHMuZm9jdXM7XG4gICAgICAgIC8vIElmIG5vdCBzcGVjaWZpZWQgdXNlIGRlZmF1bHQ6ICdmb2N1cy5kb21haW4nXG4gICAgICAgIGlmICghZm9jdXNDb21wb25lbnQpIHtcbiAgICAgICAgICAgIGZvY3VzQ29tcG9uZW50ID0gJ2ZvY3VzLicgKyBjb25maWcuaG9zdHMuZG9tYWluO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmb2N1c0NvbXBvbmVudDtcbiAgICB9LFxuXG4gICAgY3JlYXRlQ29uZmVyZW5jZUlxOiBmdW5jdGlvbiAocm9vbU5hbWUpIHtcbiAgICAgICAgLy8gR2VuZXJhdGUgY3JlYXRlIGNvbmZlcmVuY2UgSVFcbiAgICAgICAgdmFyIGVsZW0gPSAkaXEoe3RvOiBNb2RlcmF0b3IuZ2V0Rm9jdXNDb21wb25lbnQoKSwgdHlwZTogJ3NldCd9KTtcbiAgICAgICAgZWxlbS5jKCdjb25mZXJlbmNlJywge1xuICAgICAgICAgICAgeG1sbnM6ICdodHRwOi8vaml0c2kub3JnL3Byb3RvY29sL2ZvY3VzJyxcbiAgICAgICAgICAgIHJvb206IHJvb21OYW1lXG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY29uZmlnLmhvc3RzLmJyaWRnZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbGVtLmMoXG4gICAgICAgICAgICAgICAgJ3Byb3BlcnR5JyxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdicmlkZ2UnLCB2YWx1ZTogY29uZmlnLmhvc3RzLmJyaWRnZX0pXG4gICAgICAgICAgICAgICAgLnVwKCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGVsbCB0aGUgZm9jdXMgd2UgaGF2ZSBKaWdhc2kgY29uZmlndXJlZFxuICAgICAgICBpZiAoY29uZmlnLmhvc3RzLmNhbGxfY29udHJvbCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbGVtLmMoXG4gICAgICAgICAgICAgICAgJ3Byb3BlcnR5JyxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdjYWxsX2NvbnRyb2wnLCB2YWx1ZTogY29uZmlnLmhvc3RzLmNhbGxfY29udHJvbH0pXG4gICAgICAgICAgICAgICAgLnVwKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbmZpZy5jaGFubmVsTGFzdE4gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZWxlbS5jKFxuICAgICAgICAgICAgICAgICdwcm9wZXJ0eScsXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnY2hhbm5lbExhc3ROJywgdmFsdWU6IGNvbmZpZy5jaGFubmVsTGFzdE59KVxuICAgICAgICAgICAgICAgIC51cCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb25maWcuYWRhcHRpdmVMYXN0TiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbGVtLmMoXG4gICAgICAgICAgICAgICAgJ3Byb3BlcnR5JyxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdhZGFwdGl2ZUxhc3ROJywgdmFsdWU6IGNvbmZpZy5hZGFwdGl2ZUxhc3ROfSlcbiAgICAgICAgICAgICAgICAudXAoKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29uZmlnLmFkYXB0aXZlU2ltdWxjYXN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIGVsZW0uYyhcbiAgICAgICAgICAgICAgICAncHJvcGVydHknLFxuICAgICAgICAgICAgICAgIHsgbmFtZTogJ2FkYXB0aXZlU2ltdWxjYXN0JywgdmFsdWU6IGNvbmZpZy5hZGFwdGl2ZVNpbXVsY2FzdH0pXG4gICAgICAgICAgICAgICAgLnVwKCk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvbmZpZy5vcGVuU2N0cCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBlbGVtLmMoXG4gICAgICAgICAgICAgICAgJ3Byb3BlcnR5JyxcbiAgICAgICAgICAgICAgICB7IG5hbWU6ICdvcGVuU2N0cCcsIHZhbHVlOiBjb25maWcub3BlblNjdHB9KVxuICAgICAgICAgICAgICAgIC51cCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb25maWcuZW5hYmxlRmlyZWZveFN1cHBvcnQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZWxlbS5jKFxuICAgICAgICAgICAgICAgICdwcm9wZXJ0eScsXG4gICAgICAgICAgICAgICAgeyBuYW1lOiAnZW5hYmxlRmlyZWZveEhhY2tzJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGNvbmZpZy5lbmFibGVGaXJlZm94U3VwcG9ydH0pXG4gICAgICAgICAgICAgICAgLnVwKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbS51cCgpO1xuICAgICAgICByZXR1cm4gZWxlbTtcbiAgICB9LFxuXG4gICAgcGFyc2VDb25maWdPcHRpb25zOiBmdW5jdGlvbiAocmVzdWx0SXEpIHtcbiAgICBcbiAgICAgICAgTW9kZXJhdG9yLnNldEZvY3VzVXNlckppZChcbiAgICAgICAgICAgICQocmVzdWx0SXEpLmZpbmQoJ2NvbmZlcmVuY2UnKS5hdHRyKCdmb2N1c2ppZCcpKTtcbiAgICBcbiAgICAgICAgdmFyIGV4dEF1dGhQYXJhbVxuICAgICAgICAgICAgPSAkKHJlc3VsdElxKS5maW5kKCc+Y29uZmVyZW5jZT5wcm9wZXJ0eVtuYW1lPVxcJ2V4dGVybmFsQXV0aFxcJ10nKTtcbiAgICAgICAgaWYgKGV4dEF1dGhQYXJhbS5sZW5ndGgpIHtcbiAgICAgICAgICAgIGV4dGVybmFsQXV0aEVuYWJsZWQgPSBleHRBdXRoUGFyYW0uYXR0cigndmFsdWUnKSA9PT0gJ3RydWUnO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIkV4dGVybmFsIGF1dGhlbnRpY2F0aW9uIGVuYWJsZWQ6IFwiICsgZXh0ZXJuYWxBdXRoRW5hYmxlZCk7XG4gICAgXG4gICAgICAgIC8vIENoZWNrIGlmIGZvY3VzIGhhcyBhdXRvLWRldGVjdGVkIEppZ2FzaSBjb21wb25lbnQodGhpcyB3aWxsIGJlIGFsc29cbiAgICAgICAgLy8gaW5jbHVkZWQgaWYgd2UgaGF2ZSBwYXNzZWQgb3VyIGhvc3QgZnJvbSB0aGUgY29uZmlnKVxuICAgICAgICBpZiAoJChyZXN1bHRJcSkuZmluZChcbiAgICAgICAgICAgICc+Y29uZmVyZW5jZT5wcm9wZXJ0eVtuYW1lPVxcJ3NpcEdhdGV3YXlFbmFibGVkXFwnXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgc2lwR2F0ZXdheUVuYWJsZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgXG4gICAgICAgIGNvbnNvbGUuaW5mbyhcIlNpcCBnYXRld2F5IGVuYWJsZWQ6IFwiICsgc2lwR2F0ZXdheUVuYWJsZWQpO1xuICAgIH0sXG5cbiAgICAvLyBGSVhNRTogd2UgbmVlZCB0byBzaG93IHRoZSBmYWN0IHRoYXQgd2UncmUgd2FpdGluZyBmb3IgdGhlIGZvY3VzXG4gICAgLy8gdG8gdGhlIHVzZXIob3IgdGhhdCBmb2N1cyBpcyBub3QgYXZhaWxhYmxlKVxuICAgIGFsbG9jYXRlQ29uZmVyZW5jZUZvY3VzOiBmdW5jdGlvbiAocm9vbU5hbWUsIGNhbGxiYWNrKSB7XG4gICAgICAgIC8vIFRyeSB0byB1c2UgZm9jdXMgdXNlciBKSUQgZnJvbSB0aGUgY29uZmlnXG4gICAgICAgIE1vZGVyYXRvci5zZXRGb2N1c1VzZXJKaWQoY29uZmlnLmZvY3VzVXNlckppZCk7XG4gICAgICAgIC8vIFNlbmQgY3JlYXRlIGNvbmZlcmVuY2UgSVFcbiAgICAgICAgdmFyIGlxID0gTW9kZXJhdG9yLmNyZWF0ZUNvbmZlcmVuY2VJcShyb29tTmFtZSk7XG4gICAgICAgIGNvbm5lY3Rpb24uc2VuZElRKFxuICAgICAgICAgICAgaXEsXG4gICAgICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgaWYgKCd0cnVlJyA9PT0gJChyZXN1bHQpLmZpbmQoJ2NvbmZlcmVuY2UnKS5hdHRyKCdyZWFkeScpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlc2V0IGJvdGggdGltZXJzXG4gICAgICAgICAgICAgICAgICAgIGdldE5leHRUaW1lb3V0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICBnZXROZXh0RXJyb3JUaW1lb3V0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAvLyBTZXR1cCBjb25maWcgb3B0aW9uc1xuICAgICAgICAgICAgICAgICAgICBNb2RlcmF0b3IucGFyc2VDb25maWdPcHRpb25zKHJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEV4ZWMgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgd2FpdE1zID0gZ2V0TmV4dFRpbWVvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiV2FpdGluZyBmb3IgdGhlIGZvY3VzLi4uIFwiICsgd2FpdE1zKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVzZXQgZXJyb3IgdGltZW91dFxuICAgICAgICAgICAgICAgICAgICBnZXROZXh0RXJyb3JUaW1lb3V0KHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNb2RlcmF0b3IuYWxsb2NhdGVDb25mZXJlbmNlRm9jdXMoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJvb21OYW1lLCBjYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9LCB3YWl0TXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAvLyBOb3QgYXV0aG9yaXplZCB0byBjcmVhdGUgbmV3IHJvb21cbiAgICAgICAgICAgICAgICBpZiAoJChlcnJvcikuZmluZCgnPmVycm9yPm5vdC1hdXRob3JpemVkJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybihcIlVuYXV0aG9yaXplZCB0byBzdGFydCB0aGUgY29uZmVyZW5jZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgVUkub25BdXRoZW50aWNhdGlvblJlcXVpcmVkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZGVyYXRvci5hbGxvY2F0ZUNvbmZlcmVuY2VGb2N1cyhyb29tTmFtZSwgY2FsbGJhY2spO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgd2FpdE1zID0gZ2V0TmV4dEVycm9yVGltZW91dCgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJGb2N1cyBlcnJvciwgcmV0cnkgYWZ0ZXIgXCIgKyB3YWl0TXMsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAvLyBTaG93IG1lc3NhZ2VcbiAgICAgICAgICAgICAgICBVSS5tZXNzYWdlSGFuZGxlci5ub3RpZnkoXG4gICAgICAgICAgICAgICAgICAgICdDb25mZXJlbmNlIGZvY3VzJywgJ2Rpc2Nvbm5lY3RlZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBNb2RlcmF0b3IuZ2V0Rm9jdXNDb21wb25lbnQoKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAnIG5vdCBhdmFpbGFibGUgLSByZXRyeSBpbiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICh3YWl0TXMgLyAxMDAwKSArICcgc2VjJyk7XG4gICAgICAgICAgICAgICAgLy8gUmVzZXQgcmVzcG9uc2UgdGltZW91dFxuICAgICAgICAgICAgICAgIGdldE5leHRUaW1lb3V0KHRydWUpO1xuICAgICAgICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBNb2RlcmF0b3IuYWxsb2NhdGVDb25mZXJlbmNlRm9jdXMocm9vbU5hbWUsIGNhbGxiYWNrKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgd2FpdE1zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9LFxuXG4gICAgZ2V0QXV0aFVybDogZnVuY3Rpb24gKHJvb21OYW1lLCB1cmxDYWxsYmFjaykge1xuICAgICAgICB2YXIgaXEgPSAkaXEoe3RvOiBNb2RlcmF0b3IuZ2V0Rm9jdXNDb21wb25lbnQoKSwgdHlwZTogJ2dldCd9KTtcbiAgICAgICAgaXEuYygnYXV0aC11cmwnLCB7XG4gICAgICAgICAgICB4bWxuczogJ2h0dHA6Ly9qaXRzaS5vcmcvcHJvdG9jb2wvZm9jdXMnLFxuICAgICAgICAgICAgcm9vbTogcm9vbU5hbWVcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbm5lY3Rpb24uc2VuZElRKFxuICAgICAgICAgICAgaXEsXG4gICAgICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgdmFyIHVybCA9ICQocmVzdWx0KS5maW5kKCdhdXRoLXVybCcpLmF0dHIoJ3VybCcpO1xuICAgICAgICAgICAgICAgIGlmICh1cmwpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiR290IGF1dGggdXJsOiBcIiArIHVybCk7XG4gICAgICAgICAgICAgICAgICAgIHVybENhbGxiYWNrKHVybCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiRmFpbGVkIHRvIGdldCBhdXRoIHVybCBmcm8gbXRoZSBmb2N1c1wiLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKFwiR2V0IGF1dGggdXJsIGVycm9yXCIsIGVycm9yKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVyYXRvcjtcblxuXG5cbiIsIi8qIGdsb2JhbCAkLCAkaXEsIGNvbmZpZywgY29ubmVjdGlvbiwgZm9jdXNNdWNKaWQsIG1lc3NhZ2VIYW5kbGVyLCBNb2RlcmF0b3IsXG4gICBUb29sYmFyLCBVdGlsICovXG52YXIgTW9kZXJhdG9yID0gcmVxdWlyZShcIi4vbW9kZXJhdG9yXCIpO1xuXG5cbnZhciByZWNvcmRpbmdUb2tlbiA9IG51bGw7XG52YXIgcmVjb3JkaW5nRW5hYmxlZDtcblxuLyoqXG4gKiBXaGV0aGVyIHRvIHVzZSBhIGppcmVjb24gY29tcG9uZW50IGZvciByZWNvcmRpbmcsIG9yIHVzZSB0aGUgdmlkZW9icmlkZ2VcbiAqIHRocm91Z2ggQ09MSUJSSS5cbiAqL1xudmFyIHVzZUppcmVjb24gPSAodHlwZW9mIGNvbmZpZy5ob3N0cy5qaXJlY29uICE9IFwidW5kZWZpbmVkXCIpO1xuXG4vKipcbiAqIFRoZSBJRCBvZiB0aGUgamlyZWNvbiByZWNvcmRpbmcgc2Vzc2lvbi4gSmlyZWNvbiBnZW5lcmF0ZXMgaXQgd2hlbiB3ZVxuICogaW5pdGlhbGx5IHN0YXJ0IHJlY29yZGluZywgYW5kIGl0IG5lZWRzIHRvIGJlIHVzZWQgaW4gc3Vic2VxdWVudCByZXF1ZXN0c1xuICogdG8gamlyZWNvbi5cbiAqL1xudmFyIGppcmVjb25SaWQgPSBudWxsO1xuXG5mdW5jdGlvbiBzZXRSZWNvcmRpbmdUb2tlbih0b2tlbikge1xuICAgIHJlY29yZGluZ1Rva2VuID0gdG9rZW47XG59XG5cbmZ1bmN0aW9uIHNldFJlY29yZGluZyhzdGF0ZSwgdG9rZW4sIGNhbGxiYWNrKSB7XG4gICAgaWYgKHVzZUppcmVjb24pe1xuICAgICAgICB0aGlzLnNldFJlY29yZGluZ0ppcmVjb24oc3RhdGUsIHRva2VuLCBjYWxsYmFjayk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5zZXRSZWNvcmRpbmdDb2xpYnJpKHN0YXRlLCB0b2tlbiwgY2FsbGJhY2spO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2V0UmVjb3JkaW5nSmlyZWNvbihzdGF0ZSwgdG9rZW4sIGNhbGxiYWNrKSB7XG4gICAgaWYgKHN0YXRlID09IHJlY29yZGluZ0VuYWJsZWQpe1xuICAgICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdmFyIGlxID0gJGlxKHt0bzogY29uZmlnLmhvc3RzLmppcmVjb24sIHR5cGU6ICdzZXQnfSlcbiAgICAgICAgLmMoJ3JlY29yZGluZycsIHt4bWxuczogJ2h0dHA6Ly9qaXRzaS5vcmcvcHJvdG9jb2wvamlyZWNvbicsXG4gICAgICAgICAgICBhY3Rpb246IHN0YXRlID8gJ3N0YXJ0JyA6ICdzdG9wJyxcbiAgICAgICAgICAgIG11Y2ppZDogY29ubmVjdGlvbi5lbXVjLnJvb21qaWR9KTtcbiAgICBpZiAoIXN0YXRlKXtcbiAgICAgICAgaXEuYXR0cnMoe3JpZDogamlyZWNvblJpZH0pO1xuICAgIH1cblxuICAgIGNvbnNvbGUubG9nKCdTdGFydCByZWNvcmRpbmcnKTtcblxuICAgIGNvbm5lY3Rpb24uc2VuZElRKFxuICAgICAgICBpcSxcbiAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgLy8gVE9ETyB3YWl0IGZvciBhbiBJUSB3aXRoIHRoZSByZWFsIHN0YXR1cywgc2luY2UgdGhpcyBpc1xuICAgICAgICAgICAgLy8gcHJvdmlzaW9uYWw/XG4gICAgICAgICAgICBqaXJlY29uUmlkID0gJChyZXN1bHQpLmZpbmQoJ3JlY29yZGluZycpLmF0dHIoJ3JpZCcpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlY29yZGluZyAnICsgKHN0YXRlID8gJ3N0YXJ0ZWQnIDogJ3N0b3BwZWQnKSArXG4gICAgICAgICAgICAgICAgJyhqaXJlY29uKScgKyByZXN1bHQpO1xuICAgICAgICAgICAgcmVjb3JkaW5nRW5hYmxlZCA9IHN0YXRlO1xuICAgICAgICAgICAgaWYgKCFzdGF0ZSl7XG4gICAgICAgICAgICAgICAgamlyZWNvblJpZCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGNhbGxiYWNrKHN0YXRlKTtcbiAgICAgICAgfSxcbiAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRmFpbGVkIHRvIHN0YXJ0IHJlY29yZGluZywgZXJyb3I6ICcsIGVycm9yKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlY29yZGluZ0VuYWJsZWQpO1xuICAgICAgICB9KTtcbn1cblxuLy8gU2VuZHMgYSBDT0xJQlJJIG1lc3NhZ2Ugd2hpY2ggZW5hYmxlcyBvciBkaXNhYmxlcyAoYWNjb3JkaW5nIHRvICdzdGF0ZScpXG4vLyB0aGUgcmVjb3JkaW5nIG9uIHRoZSBicmlkZ2UuIFdhaXRzIGZvciB0aGUgcmVzdWx0IElRIGFuZCBjYWxscyAnY2FsbGJhY2snXG4vLyB3aXRoIHRoZSBuZXcgcmVjb3JkaW5nIHN0YXRlLCBhY2NvcmRpbmcgdG8gdGhlIElRLlxuZnVuY3Rpb24gc2V0UmVjb3JkaW5nQ29saWJyaShzdGF0ZSwgdG9rZW4sIGNhbGxiYWNrKSB7XG4gICAgdmFyIGVsZW0gPSAkaXEoe3RvOiBmb2N1c011Y0ppZCwgdHlwZTogJ3NldCd9KTtcbiAgICBlbGVtLmMoJ2NvbmZlcmVuY2UnLCB7XG4gICAgICAgIHhtbG5zOiAnaHR0cDovL2ppdHNpLm9yZy9wcm90b2NvbC9jb2xpYnJpJ1xuICAgIH0pO1xuICAgIGVsZW0uYygncmVjb3JkaW5nJywge3N0YXRlOiBzdGF0ZSwgdG9rZW46IHRva2VufSk7XG5cbiAgICBjb25uZWN0aW9uLnNlbmRJUShlbGVtLFxuICAgICAgICBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnU2V0IHJlY29yZGluZyBcIicsIHN0YXRlLCAnXCIuIFJlc3VsdDonLCByZXN1bHQpO1xuICAgICAgICAgICAgdmFyIHJlY29yZGluZ0VsZW0gPSAkKHJlc3VsdCkuZmluZCgnPmNvbmZlcmVuY2U+cmVjb3JkaW5nJyk7XG4gICAgICAgICAgICB2YXIgbmV3U3RhdGUgPSAoJ3RydWUnID09PSByZWNvcmRpbmdFbGVtLmF0dHIoJ3N0YXRlJykpO1xuXG4gICAgICAgICAgICByZWNvcmRpbmdFbmFibGVkID0gbmV3U3RhdGU7XG4gICAgICAgICAgICBjYWxsYmFjayhuZXdTdGF0ZSk7XG4gICAgICAgIH0sXG4gICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKGVycm9yKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKHJlY29yZGluZ0VuYWJsZWQpO1xuICAgICAgICB9XG4gICAgKTtcbn1cblxudmFyIFJlY29yZGluZyA9IHtcbiAgICB0b2dnbGVSZWNvcmRpbmc6IGZ1bmN0aW9uICh0b2tlbkVtcHR5Q2FsbGJhY2ssXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRpbmdDYWxsYmFjaywgc3RhcnRlZENhbGxiYWNrKSB7XG4gICAgICAgIGlmICghTW9kZXJhdG9yLmlzTW9kZXJhdG9yKCkpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFxuICAgICAgICAgICAgICAgICAgICAnbm9uLWZvY3VzLCBvciBjb25mZXJlbmNlIG5vdCB5ZXQgb3JnYW5pemVkOicgK1xuICAgICAgICAgICAgICAgICAgICAnIG5vdCBlbmFibGluZyByZWNvcmRpbmcnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEppcmVjb24gZG9lcyBub3QgKGN1cnJlbnRseSkgc3VwcG9ydCBhIHRva2VuLlxuICAgICAgICBpZiAoIXJlY29yZGluZ1Rva2VuICYmICF1c2VKaXJlY29uKSB7XG4gICAgICAgICAgICB0b2tlbkVtcHR5Q2FsbGJhY2soZnVuY3Rpb24gKHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgc2V0UmVjb3JkaW5nVG9rZW4odmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudG9nZ2xlUmVjb3JkaW5nKCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG9sZFN0YXRlID0gcmVjb3JkaW5nRW5hYmxlZDtcbiAgICAgICAgc3RhcnRpbmdDYWxsYmFjayghb2xkU3RhdGUpO1xuICAgICAgICBzZXRSZWNvcmRpbmcoIW9sZFN0YXRlLFxuICAgICAgICAgICAgcmVjb3JkaW5nVG9rZW4sXG4gICAgICAgICAgICBmdW5jdGlvbiAoc3RhdGUpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIk5ldyByZWNvcmRpbmcgc3RhdGU6IFwiLCBzdGF0ZSk7XG4gICAgICAgICAgICAgICAgaWYgKHN0YXRlID09PSBvbGRTdGF0ZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBGSVhNRTogbmV3IGZvY3VzOlxuICAgICAgICAgICAgICAgICAgICAvLyB0aGlzIHdpbGwgbm90IHdvcmsgd2hlbiBtb2RlcmF0b3IgY2hhbmdlc1xuICAgICAgICAgICAgICAgICAgICAvLyBkdXJpbmcgYWN0aXZlIHNlc3Npb24uIFRoZW4gaXQgd2lsbCBhc3N1bWUgdGhhdFxuICAgICAgICAgICAgICAgICAgICAvLyByZWNvcmRpbmcgc3RhdHVzIGhhcyBjaGFuZ2VkIHRvIHRydWUsIGJ1dCBpdCBtaWdodCBoYXZlXG4gICAgICAgICAgICAgICAgICAgIC8vIGJlZW4gYWxyZWFkeSB0cnVlKGFuZCB3ZSBvbmx5IHJlY2VpdmVkIGFjdHVhbCBzdGF0dXMgZnJvbVxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgZm9jdXMpLlxuICAgICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgICAgICAvLyBTTyB3ZSBzdGFydCB3aXRoIHN0YXR1cyBudWxsLCBzbyB0aGF0IGl0IGlzIGluaXRpYWxpemVkXG4gICAgICAgICAgICAgICAgICAgIC8vIGhlcmUgYW5kIHdpbGwgZmFpbCBvbmx5IGFmdGVyIHNlY29uZCBjbGljaywgc28gaWYgaW52YWxpZFxuICAgICAgICAgICAgICAgICAgICAvLyB0b2tlbiB3YXMgdXNlZCB3ZSBoYXZlIHRvIHByZXNzIHRoZSBidXR0b24gdHdpY2UgYmVmb3JlXG4gICAgICAgICAgICAgICAgICAgIC8vIGN1cnJlbnQgc3RhdHVzIHdpbGwgYmUgZmV0Y2hlZCBhbmQgdG9rZW4gd2lsbCBiZSByZXNldC5cbiAgICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAgICAgLy8gUmVsaWFibGUgd2F5IHdvdWxkIGJlIHRvIHJldHVybiBhdXRoZW50aWNhdGlvbiBlcnJvci5cbiAgICAgICAgICAgICAgICAgICAgLy8gT3Igc3RhdHVzIHVwZGF0ZSB3aGVuIG1vZGVyYXRvciBjb25uZWN0cy5cbiAgICAgICAgICAgICAgICAgICAgLy8gT3Igd2UgaGF2ZSB0byBzdG9wIHJlY29yZGluZyBzZXNzaW9uIHdoZW4gY3VycmVudFxuICAgICAgICAgICAgICAgICAgICAvLyBtb2RlcmF0b3IgbGVhdmVzIHRoZSByb29tLlxuXG4gICAgICAgICAgICAgICAgICAgIC8vIEZhaWxlZCB0byBjaGFuZ2UsIHJlc2V0IHRoZSB0b2tlbiBiZWNhdXNlIGl0IG1pZ2h0XG4gICAgICAgICAgICAgICAgICAgIC8vIGhhdmUgYmVlbiB3cm9uZ1xuICAgICAgICAgICAgICAgICAgICBzZXRSZWNvcmRpbmdUb2tlbihudWxsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3RhcnRlZENhbGxiYWNrKHN0YXRlKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH1cblxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlY29yZGluZzsiLCIvKiBqc2hpbnQgLVcxMTcgKi9cbi8qIGEgc2ltcGxlIE1VQyBjb25uZWN0aW9uIHBsdWdpblxuICogY2FuIG9ubHkgaGFuZGxlIGEgc2luZ2xlIE1VQyByb29tXG4gKi9cblxudmFyIGJyaWRnZUlzRG93biA9IGZhbHNlO1xuXG52YXIgTW9kZXJhdG9yID0gcmVxdWlyZShcIi4vbW9kZXJhdG9yXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKFhNUFAsIGV2ZW50RW1pdHRlcikge1xuICAgIFN0cm9waGUuYWRkQ29ubmVjdGlvblBsdWdpbignZW11YycsIHtcbiAgICAgICAgY29ubmVjdGlvbjogbnVsbCxcbiAgICAgICAgcm9vbWppZDogbnVsbCxcbiAgICAgICAgbXlyb29tamlkOiBudWxsLFxuICAgICAgICBtZW1iZXJzOiB7fSxcbiAgICAgICAgbGlzdF9tZW1iZXJzOiBbXSwgLy8gc28gd2UgY2FuIGVsZWN0IGEgbmV3IGZvY3VzXG4gICAgICAgIHByZXNNYXA6IHt9LFxuICAgICAgICBwcmV6aU1hcDoge30sXG4gICAgICAgIGpvaW5lZDogZmFsc2UsXG4gICAgICAgIGlzT3duZXI6IGZhbHNlLFxuICAgICAgICByb2xlOiBudWxsLFxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoY29ubikge1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uID0gY29ubjtcbiAgICAgICAgfSxcbiAgICAgICAgaW5pdFByZXNlbmNlTWFwOiBmdW5jdGlvbiAobXlyb29tamlkKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ3RvJ10gPSBteXJvb21qaWQ7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ3hucyddID0gJ2h0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL211Yyc7XG4gICAgICAgIH0sXG4gICAgICAgIGRvSm9pbjogZnVuY3Rpb24gKGppZCwgcGFzc3dvcmQpIHtcbiAgICAgICAgICAgIHRoaXMubXlyb29tamlkID0gamlkO1xuXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJKb2luZWQgTVVDIGFzIFwiICsgdGhpcy5teXJvb21qaWQpO1xuXG4gICAgICAgICAgICB0aGlzLmluaXRQcmVzZW5jZU1hcCh0aGlzLm15cm9vbWppZCk7XG5cbiAgICAgICAgICAgIGlmICghdGhpcy5yb29tamlkKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yb29tamlkID0gU3Ryb3BoZS5nZXRCYXJlSmlkRnJvbUppZChqaWQpO1xuICAgICAgICAgICAgICAgIC8vIGFkZCBoYW5kbGVycyAoanVzdCBvbmNlKVxuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5hZGRIYW5kbGVyKHRoaXMub25QcmVzZW5jZS5iaW5kKHRoaXMpLCBudWxsLCAncHJlc2VuY2UnLCBudWxsLCBudWxsLCB0aGlzLnJvb21qaWQsIHttYXRjaEJhcmU6IHRydWV9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uYWRkSGFuZGxlcih0aGlzLm9uUHJlc2VuY2VVbmF2YWlsYWJsZS5iaW5kKHRoaXMpLCBudWxsLCAncHJlc2VuY2UnLCAndW5hdmFpbGFibGUnLCBudWxsLCB0aGlzLnJvb21qaWQsIHttYXRjaEJhcmU6IHRydWV9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uYWRkSGFuZGxlcih0aGlzLm9uUHJlc2VuY2VFcnJvci5iaW5kKHRoaXMpLCBudWxsLCAncHJlc2VuY2UnLCAnZXJyb3InLCBudWxsLCB0aGlzLnJvb21qaWQsIHttYXRjaEJhcmU6IHRydWV9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uYWRkSGFuZGxlcih0aGlzLm9uTWVzc2FnZS5iaW5kKHRoaXMpLCBudWxsLCAnbWVzc2FnZScsIG51bGwsIG51bGwsIHRoaXMucm9vbWppZCwge21hdGNoQmFyZTogdHJ1ZX0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHBhc3N3b3JkICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNNYXBbJ3Bhc3N3b3JkJ10gPSBwYXNzd29yZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2VuZFByZXNlbmNlKCk7XG4gICAgICAgIH0sXG4gICAgICAgIGRvTGVhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiZG8gbGVhdmVcIiwgdGhpcy5teXJvb21qaWQpO1xuICAgICAgICAgICAgdmFyIHByZXMgPSAkcHJlcyh7dG86IHRoaXMubXlyb29tamlkLCB0eXBlOiAndW5hdmFpbGFibGUnIH0pO1xuICAgICAgICAgICAgdGhpcy5wcmVzTWFwLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZChwcmVzKTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlTm9uQW5vbnltb3VzUm9vbTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgLy8gaHR0cDovL3htcHAub3JnL2V4dGVuc2lvbnMveGVwLTAwNDUuaHRtbCNjcmVhdGVyb29tLXJlc2VydmVkXG5cbiAgICAgICAgICAgIHZhciBnZXRGb3JtID0gJGlxKHt0eXBlOiAnZ2V0JywgdG86IHRoaXMucm9vbWppZH0pXG4gICAgICAgICAgICAgICAgLmMoJ3F1ZXJ5Jywge3htbG5zOiAnaHR0cDovL2phYmJlci5vcmcvcHJvdG9jb2wvbXVjI293bmVyJ30pXG4gICAgICAgICAgICAgICAgLmMoJ3gnLCB7eG1sbnM6ICdqYWJiZXI6eDpkYXRhJywgdHlwZTogJ3N1Ym1pdCd9KTtcblxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLnNlbmRJUShnZXRGb3JtLCBmdW5jdGlvbiAoZm9ybSkge1xuXG4gICAgICAgICAgICAgICAgaWYgKCEkKGZvcm0pLmZpbmQoXG4gICAgICAgICAgICAgICAgICAgICAgICAnPnF1ZXJ5PnhbeG1sbnM9XCJqYWJiZXI6eDpkYXRhXCJdJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPmZpZWxkW3Zhcj1cIm11YyNyb29tY29uZmlnX3dob2lzXCJdJykubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignbm9uLWFub255bW91cyByb29tcyBub3Qgc3VwcG9ydGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgZm9ybVN1Ym1pdCA9ICRpcSh7dG86IHRoaXMucm9vbWppZCwgdHlwZTogJ3NldCd9KVxuICAgICAgICAgICAgICAgICAgICAuYygncXVlcnknLCB7eG1sbnM6ICdodHRwOi8vamFiYmVyLm9yZy9wcm90b2NvbC9tdWMjb3duZXInfSk7XG5cbiAgICAgICAgICAgICAgICBmb3JtU3VibWl0LmMoJ3gnLCB7eG1sbnM6ICdqYWJiZXI6eDpkYXRhJywgdHlwZTogJ3N1Ym1pdCd9KTtcblxuICAgICAgICAgICAgICAgIGZvcm1TdWJtaXQuYygnZmllbGQnLCB7J3Zhcic6ICdGT1JNX1RZUEUnfSlcbiAgICAgICAgICAgICAgICAgICAgLmMoJ3ZhbHVlJylcbiAgICAgICAgICAgICAgICAgICAgLnQoJ2h0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL211YyNyb29tY29uZmlnJykudXAoKS51cCgpO1xuXG4gICAgICAgICAgICAgICAgZm9ybVN1Ym1pdC5jKCdmaWVsZCcsIHsndmFyJzogJ211YyNyb29tY29uZmlnX3dob2lzJ30pXG4gICAgICAgICAgICAgICAgICAgIC5jKCd2YWx1ZScpLnQoJ2FueW9uZScpLnVwKCkudXAoKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kSVEoZm9ybVN1Ym1pdCk7XG5cbiAgICAgICAgICAgIH0sIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBnZXR0aW5nIHJvb20gY29uZmlndXJhdGlvbiBmb3JtXCIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uUHJlc2VuY2U6IGZ1bmN0aW9uIChwcmVzKSB7XG4gICAgICAgICAgICB2YXIgZnJvbSA9IHByZXMuZ2V0QXR0cmlidXRlKCdmcm9tJyk7XG5cbiAgICAgICAgICAgIC8vIFdoYXQgaXMgdGhpcyBmb3I/IEEgd29ya2Fyb3VuZCBmb3Igc29tZXRoaW5nP1xuICAgICAgICAgICAgaWYgKHByZXMuZ2V0QXR0cmlidXRlKCd0eXBlJykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUGFyc2UgZXRoZXJwYWQgdGFnLlxuICAgICAgICAgICAgdmFyIGV0aGVycGFkID0gJChwcmVzKS5maW5kKCc+ZXRoZXJwYWQnKTtcbiAgICAgICAgICAgIGlmIChldGhlcnBhZC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLmV0aGVycGFkX2Jhc2UgJiYgIU1vZGVyYXRvci5pc01vZGVyYXRvcigpKSB7XG4gICAgICAgICAgICAgICAgICAgIFVJLmluaXRFdGhlcnBhZChldGhlcnBhZC50ZXh0KCkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUGFyc2UgcHJlemkgdGFnLlxuICAgICAgICAgICAgdmFyIHByZXNlbnRhdGlvbiA9ICQocHJlcykuZmluZCgnPnByZXppJyk7XG4gICAgICAgICAgICBpZiAocHJlc2VudGF0aW9uLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBwcmVzZW50YXRpb24uYXR0cigndXJsJyk7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnQgPSBwcmVzZW50YXRpb24uZmluZCgnPmN1cnJlbnQnKS50ZXh0KCk7XG5cbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncHJlc2VudGF0aW9uIGluZm8gcmVjZWl2ZWQgZnJvbScsIGZyb20sIHVybCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodGhpcy5wcmV6aU1hcFtmcm9tXSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucHJlemlNYXBbZnJvbV0gPSB1cmw7XG5cbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigncHJlc2VudGF0aW9uYWRkZWQubXVjJywgW2Zyb20sIHVybCwgY3VycmVudF0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcignZ290b3NsaWRlLm11YycsIFtmcm9tLCB1cmwsIGN1cnJlbnRdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLnByZXppTWFwW2Zyb21dICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gdGhpcy5wcmV6aU1hcFtmcm9tXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5wcmV6aU1hcFtmcm9tXTtcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdwcmVzZW50YXRpb25yZW1vdmVkLm11YycsIFtmcm9tLCB1cmxdKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUGFyc2UgYXVkaW8gaW5mbyB0YWcuXG4gICAgICAgICAgICB2YXIgYXVkaW9NdXRlZCA9ICQocHJlcykuZmluZCgnPmF1ZGlvbXV0ZWQnKTtcbiAgICAgICAgICAgIGlmIChhdWRpb011dGVkLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2F1ZGlvbXV0ZWQubXVjJywgW2Zyb20sIGF1ZGlvTXV0ZWQudGV4dCgpXSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFBhcnNlIHZpZGVvIGluZm8gdGFnLlxuICAgICAgICAgICAgdmFyIHZpZGVvTXV0ZWQgPSAkKHByZXMpLmZpbmQoJz52aWRlb211dGVkJyk7XG4gICAgICAgICAgICBpZiAodmlkZW9NdXRlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCd2aWRlb211dGVkLm11YycsIFtmcm9tLCB2aWRlb011dGVkLnRleHQoKV0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3RhdHMgPSAkKHByZXMpLmZpbmQoJz5zdGF0cycpO1xuICAgICAgICAgICAgaWYgKHN0YXRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0c09iaiA9IHt9O1xuICAgICAgICAgICAgICAgIFN0cm9waGUuZm9yRWFjaENoaWxkKHN0YXRzWzBdLCBcInN0YXRcIiwgZnVuY3Rpb24gKGVsKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0YXRzT2JqW2VsLmdldEF0dHJpYnV0ZShcIm5hbWVcIildID0gZWwuZ2V0QXR0cmlidXRlKFwidmFsdWVcIik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbnF1YWxpdHkudXBkYXRlUmVtb3RlU3RhdHMoZnJvbSwgc3RhdHNPYmopO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBQYXJzZSBzdGF0dXMuXG4gICAgICAgICAgICBpZiAoJChwcmVzKS5maW5kKCc+eFt4bWxucz1cImh0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL211YyN1c2VyXCJdPnN0YXR1c1tjb2RlPVwiMjAxXCJdJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc093bmVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB0aGlzLmNyZWF0ZU5vbkFub255bW91c1Jvb20oKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gUGFyc2Ugcm9sZXMuXG4gICAgICAgICAgICB2YXIgbWVtYmVyID0ge307XG4gICAgICAgICAgICBtZW1iZXIuc2hvdyA9ICQocHJlcykuZmluZCgnPnNob3cnKS50ZXh0KCk7XG4gICAgICAgICAgICBtZW1iZXIuc3RhdHVzID0gJChwcmVzKS5maW5kKCc+c3RhdHVzJykudGV4dCgpO1xuICAgICAgICAgICAgdmFyIHRtcCA9ICQocHJlcykuZmluZCgnPnhbeG1sbnM9XCJodHRwOi8vamFiYmVyLm9yZy9wcm90b2NvbC9tdWMjdXNlclwiXT5pdGVtJyk7XG4gICAgICAgICAgICBtZW1iZXIuYWZmaWxpYXRpb24gPSB0bXAuYXR0cignYWZmaWxpYXRpb24nKTtcbiAgICAgICAgICAgIG1lbWJlci5yb2xlID0gdG1wLmF0dHIoJ3JvbGUnKTtcblxuICAgICAgICAgICAgLy8gRm9jdXMgcmVjb2duaXRpb25cbiAgICAgICAgICAgIG1lbWJlci5qaWQgPSB0bXAuYXR0cignamlkJyk7XG4gICAgICAgICAgICBtZW1iZXIuaXNGb2N1cyA9IGZhbHNlO1xuICAgICAgICAgICAgaWYgKG1lbWJlci5qaWRcbiAgICAgICAgICAgICAgICAmJiBtZW1iZXIuamlkLmluZGV4T2YoTW9kZXJhdG9yLmdldEZvY3VzVXNlckppZCgpICsgXCIvXCIpID09IDApIHtcbiAgICAgICAgICAgICAgICBtZW1iZXIuaXNGb2N1cyA9IHRydWU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBuaWNrdGFnID0gJChwcmVzKS5maW5kKCc+bmlja1t4bWxucz1cImh0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL25pY2tcIl0nKTtcbiAgICAgICAgICAgIG1lbWJlci5kaXNwbGF5TmFtZSA9IChuaWNrdGFnLmxlbmd0aCA+IDAgPyBuaWNrdGFnLmh0bWwoKSA6IG51bGwpO1xuXG4gICAgICAgICAgICBpZiAoZnJvbSA9PSB0aGlzLm15cm9vbWppZCkge1xuICAgICAgICAgICAgICAgIGlmIChtZW1iZXIuYWZmaWxpYXRpb24gPT0gJ293bmVyJykgdGhpcy5pc093bmVyID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5yb2xlICE9PSBtZW1iZXIucm9sZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJvbGUgPSBtZW1iZXIucm9sZTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKE1vZGVyYXRvci5vbkxvY2FsUm9sZUNoYW5nZSlcbiAgICAgICAgICAgICAgICAgICAgICAgIE1vZGVyYXRvci5vbkxvY2FsUm9sZUNoYW5nZShmcm9tLCBtZW1iZXIsIHByZXMpO1xuICAgICAgICAgICAgICAgICAgICBVSS5vbkxvY2FsUm9sZUNoYW5nZShmcm9tLCBtZW1iZXIsIHByZXMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXRoaXMuam9pbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuam9pbmVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRFbWl0dGVyLmVtaXQoWE1QUEV2ZW50cy5NVUNfSk9JTkVELCBmcm9tLCBtZW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxpc3RfbWVtYmVycy5wdXNoKGZyb20pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5tZW1iZXJzW2Zyb21dID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAvLyBuZXcgcGFydGljaXBhbnRcbiAgICAgICAgICAgICAgICB0aGlzLm1lbWJlcnNbZnJvbV0gPSBtZW1iZXI7XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0X21lbWJlcnMucHVzaChmcm9tKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZW50ZXJlZCcsIGZyb20sIG1lbWJlcik7XG4gICAgICAgICAgICAgICAgaWYgKG1lbWJlci5pc0ZvY3VzKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvY3VzTXVjSmlkID0gZnJvbTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiSWdub3JlIGZvY3VzOiBcIiArIGZyb20gKyBcIiwgcmVhbCBKSUQ6IFwiICsgbWVtYmVyLmppZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaWQgPSAkKHByZXMpLmZpbmQoJz51c2VySUQnKS50ZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBlbWFpbCA9ICQocHJlcykuZmluZCgnPmVtYWlsJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlbWFpbC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZCA9IGVtYWlsLnRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBVSS5vbk11Y0VudGVyZWQoZnJvbSwgaWQsIG1lbWJlci5kaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICAgICAgICAgIEFQSS50cmlnZ2VyRXZlbnQoXCJwYXJ0aWNpcGFudEpvaW5lZFwiLCB7amlkOiBmcm9tfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBQcmVzZW5jZSB1cGRhdGUgZm9yIGV4aXN0aW5nIHBhcnRpY2lwYW50XG4gICAgICAgICAgICAgICAgLy8gV2F0Y2ggcm9sZSBjaGFuZ2U6XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMubWVtYmVyc1tmcm9tXS5yb2xlICE9IG1lbWJlci5yb2xlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubWVtYmVyc1tmcm9tXS5yb2xlID0gbWVtYmVyLnJvbGU7XG4gICAgICAgICAgICAgICAgICAgIFVJLm9uTXVjUm9sZUNoYW5nZWQobWVtYmVyLnJvbGUsIG1lbWJlci5kaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBBbHdheXMgdHJpZ2dlciBwcmVzZW5jZSB0byB1cGRhdGUgYmluZGluZ3NcbiAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ3ByZXNlbmNlLm11YycsIFtmcm9tLCBtZW1iZXIsIHByZXNdKTtcbiAgICAgICAgICAgIHRoaXMucGFyc2VQcmVzZW5jZShmcm9tLCBtZW1iZXIsIHByZXMpO1xuXG4gICAgICAgICAgICAvLyBUcmlnZ2VyIHN0YXR1cyBtZXNzYWdlIHVwZGF0ZVxuICAgICAgICAgICAgaWYgKG1lbWJlci5zdGF0dXMpIHtcbiAgICAgICAgICAgICAgICBVSS5vbk11Y1ByZXNlbmNlU3RhdHVzKGZyb20sIG1lbWJlcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBvblByZXNlbmNlVW5hdmFpbGFibGU6IGZ1bmN0aW9uIChwcmVzKSB7XG4gICAgICAgICAgICB2YXIgZnJvbSA9IHByZXMuZ2V0QXR0cmlidXRlKCdmcm9tJyk7XG4gICAgICAgICAgICAvLyBTdGF0dXMgY29kZSAxMTAgaW5kaWNhdGVzIHRoYXQgdGhpcyBub3RpZmljYXRpb24gaXMgXCJzZWxmLXByZXNlbmNlXCIuXG4gICAgICAgICAgICBpZiAoISQocHJlcykuZmluZCgnPnhbeG1sbnM9XCJodHRwOi8vamFiYmVyLm9yZy9wcm90b2NvbC9tdWMjdXNlclwiXT5zdGF0dXNbY29kZT1cIjExMFwiXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm1lbWJlcnNbZnJvbV07XG4gICAgICAgICAgICAgICAgdGhpcy5saXN0X21lbWJlcnMuc3BsaWNlKHRoaXMubGlzdF9tZW1iZXJzLmluZGV4T2YoZnJvbSksIDEpO1xuICAgICAgICAgICAgICAgIHRoaXMub25QYXJ0aWNpcGFudExlZnQoZnJvbSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBJZiB0aGUgc3RhdHVzIGNvZGUgaXMgMTEwIHRoaXMgbWVhbnMgd2UncmUgbGVhdmluZyBhbmQgd2Ugd291bGQgbGlrZVxuICAgICAgICAgICAgLy8gdG8gcmVtb3ZlIGV2ZXJ5b25lIGVsc2UgZnJvbSBvdXIgdmlldywgc28gd2UgdHJpZ2dlciB0aGUgZXZlbnQuXG4gICAgICAgICAgICBlbHNlIGlmICh0aGlzLmxpc3RfbWVtYmVycy5sZW5ndGggPiAxKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxpc3RfbWVtYmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgbWVtYmVyID0gdGhpcy5saXN0X21lbWJlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLm1lbWJlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGlzdF9tZW1iZXJzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblBhcnRpY2lwYW50TGVmdChtZW1iZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICgkKHByZXMpLmZpbmQoJz54W3htbG5zPVwiaHR0cDovL2phYmJlci5vcmcvcHJvdG9jb2wvbXVjI3VzZXJcIl0+c3RhdHVzW2NvZGU9XCIzMDdcIl0nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdraWNrZWQubXVjJywgW2Zyb21dKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5teXJvb21qaWQgPT09IGZyb20pIHtcbiAgICAgICAgICAgICAgICAgICAgWE1QUC5kaXNwb3NlQ29uZmVyZW5jZShmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50RW1pdHRlci5lbWl0KFhNUFBFdmVudHMuS0lDS0VEKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgb25QcmVzZW5jZUVycm9yOiBmdW5jdGlvbiAocHJlcykge1xuICAgICAgICAgICAgdmFyIGZyb20gPSBwcmVzLmdldEF0dHJpYnV0ZSgnZnJvbScpO1xuICAgICAgICAgICAgaWYgKCQocHJlcykuZmluZCgnPmVycm9yW3R5cGU9XCJhdXRoXCJdPm5vdC1hdXRob3JpemVkW3htbG5zPVwidXJuOmlldGY6cGFyYW1zOnhtbDpuczp4bXBwLXN0YW56YXNcIl0nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnb24gcGFzc3dvcmQgcmVxdWlyZWQnLCBmcm9tKTtcbiAgICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgICAgVUkub25QYXNzd29yZFJlcWl1cmVkKGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRvSm9pbihmcm9tLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCQocHJlcykuZmluZChcbiAgICAgICAgICAgICAgICAnPmVycm9yW3R5cGU9XCJjYW5jZWxcIl0+bm90LWFsbG93ZWRbeG1sbnM9XCJ1cm46aWV0ZjpwYXJhbXM6eG1sOm5zOnhtcHAtc3Rhbnphc1wiXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciB0b0RvbWFpbiA9IFN0cm9waGUuZ2V0RG9tYWluRnJvbUppZChwcmVzLmdldEF0dHJpYnV0ZSgndG8nKSk7XG4gICAgICAgICAgICAgICAgaWYgKHRvRG9tYWluID09PSBjb25maWcuaG9zdHMuYW5vbnltb3VzZG9tYWluKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHdlIGFyZSBjb25uZWN0ZWQgd2l0aCBhbm9ueW1vdXMgZG9tYWluIGFuZCBvbmx5IG5vbiBhbm9ueW1vdXMgdXNlcnMgY2FuIGNyZWF0ZSByb29tc1xuICAgICAgICAgICAgICAgICAgICAvLyB3ZSBtdXN0IGF1dGhvcml6ZSB0aGUgdXNlclxuICAgICAgICAgICAgICAgICAgICBYTVBQLnByb21wdExvZ2luKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKCdvblByZXNFcnJvciAnLCBwcmVzKTtcbiAgICAgICAgICAgICAgICAgICAgVUkubWVzc2FnZUhhbmRsZXIub3BlblJlcG9ydERpYWxvZyhudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ09vcHMhIFNvbWV0aGluZyB3ZW50IHdyb25nIGFuZCB3ZSBjb3VsZG5gdCBjb25uZWN0IHRvIHRoZSBjb25mZXJlbmNlLicsXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2Fybignb25QcmVzRXJyb3IgJywgcHJlcyk7XG4gICAgICAgICAgICAgICAgVUkubWVzc2FnZUhhbmRsZXIub3BlblJlcG9ydERpYWxvZyhudWxsLFxuICAgICAgICAgICAgICAgICAgICAnT29wcyEgU29tZXRoaW5nIHdlbnQgd3JvbmcgYW5kIHdlIGNvdWxkbmB0IGNvbm5lY3QgdG8gdGhlIGNvbmZlcmVuY2UuJyxcbiAgICAgICAgICAgICAgICAgICAgcHJlcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VuZE1lc3NhZ2U6IGZ1bmN0aW9uIChib2R5LCBuaWNrbmFtZSkge1xuICAgICAgICAgICAgdmFyIG1zZyA9ICRtc2coe3RvOiB0aGlzLnJvb21qaWQsIHR5cGU6ICdncm91cGNoYXQnfSk7XG4gICAgICAgICAgICBtc2cuYygnYm9keScsIGJvZHkpLnVwKCk7XG4gICAgICAgICAgICBpZiAobmlja25hbWUpIHtcbiAgICAgICAgICAgICAgICBtc2cuYygnbmljaycsIHt4bWxuczogJ2h0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL25pY2snfSkudChuaWNrbmFtZSkudXAoKS51cCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLnNlbmQobXNnKTtcbiAgICAgICAgICAgIEFQSS50cmlnZ2VyRXZlbnQoXCJvdXRnb2luZ01lc3NhZ2VcIiwge1wibWVzc2FnZVwiOiBib2R5fSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNldFN1YmplY3Q6IGZ1bmN0aW9uIChzdWJqZWN0KSB7XG4gICAgICAgICAgICB2YXIgbXNnID0gJG1zZyh7dG86IHRoaXMucm9vbWppZCwgdHlwZTogJ2dyb3VwY2hhdCd9KTtcbiAgICAgICAgICAgIG1zZy5jKCdzdWJqZWN0Jywgc3ViamVjdCk7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZChtc2cpO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJ0b3BpYyBjaGFuZ2VkIHRvIFwiICsgc3ViamVjdCk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uTWVzc2FnZTogZnVuY3Rpb24gKG1zZykge1xuICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMgaXMgYSBoYWNrLiBidXQgamluZ2xlIG9uIG11YyBtYWtlcyBuaWNrY2hhbmdlcyBoYXJkXG4gICAgICAgICAgICB2YXIgZnJvbSA9IG1zZy5nZXRBdHRyaWJ1dGUoJ2Zyb20nKTtcbiAgICAgICAgICAgIHZhciBuaWNrID0gJChtc2cpLmZpbmQoJz5uaWNrW3htbG5zPVwiaHR0cDovL2phYmJlci5vcmcvcHJvdG9jb2wvbmlja1wiXScpLnRleHQoKSB8fCBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChmcm9tKTtcblxuICAgICAgICAgICAgdmFyIHR4dCA9ICQobXNnKS5maW5kKCc+Ym9keScpLnRleHQoKTtcbiAgICAgICAgICAgIHZhciB0eXBlID0gbXNnLmdldEF0dHJpYnV0ZShcInR5cGVcIik7XG4gICAgICAgICAgICBpZiAodHlwZSA9PSBcImVycm9yXCIpIHtcbiAgICAgICAgICAgICAgICBVSS5jaGF0QWRkRXJyb3IoJChtc2cpLmZpbmQoJz50ZXh0JykudGV4dCgpLCB0eHQpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgc3ViamVjdCA9ICQobXNnKS5maW5kKCc+c3ViamVjdCcpO1xuICAgICAgICAgICAgaWYgKHN1YmplY3QubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN1YmplY3RUZXh0ID0gc3ViamVjdC50ZXh0KCk7XG4gICAgICAgICAgICAgICAgaWYgKHN1YmplY3RUZXh0IHx8IHN1YmplY3RUZXh0ID09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgVUkuY2hhdFNldFN1YmplY3Qoc3ViamVjdFRleHQpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlN1YmplY3QgaXMgY2hhbmdlZCB0byBcIiArIHN1YmplY3RUZXh0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgaWYgKHR4dCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdjaGF0JywgbmljaywgdHh0KTtcbiAgICAgICAgICAgICAgICBVSS51cGRhdGVDaGF0Q29udmVyc2F0aW9uKGZyb20sIG5pY2ssIHR4dCk7XG4gICAgICAgICAgICAgICAgaWYgKGZyb20gIT0gdGhpcy5teXJvb21qaWQpXG4gICAgICAgICAgICAgICAgICAgIEFQSS50cmlnZ2VyRXZlbnQoXCJpbmNvbWluZ01lc3NhZ2VcIixcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcImZyb21cIjogZnJvbSwgXCJuaWNrXCI6IG5pY2ssIFwibWVzc2FnZVwiOiB0eHR9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBsb2NrUm9vbTogZnVuY3Rpb24gKGtleSwgb25TdWNjZXNzLCBvbkVycm9yLCBvbk5vdFN1cHBvcnRlZCkge1xuICAgICAgICAgICAgLy9odHRwOi8veG1wcC5vcmcvZXh0ZW5zaW9ucy94ZXAtMDA0NS5odG1sI3Jvb21jb25maWdcbiAgICAgICAgICAgIHZhciBvYiA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZElRKCRpcSh7dG86IHRoaXMucm9vbWppZCwgdHlwZTogJ2dldCd9KS5jKCdxdWVyeScsIHt4bWxuczogJ2h0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL211YyNvd25lcid9KSxcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgkKHJlcykuZmluZCgnPnF1ZXJ5PnhbeG1sbnM9XCJqYWJiZXI6eDpkYXRhXCJdPmZpZWxkW3Zhcj1cIm11YyNyb29tY29uZmlnX3Jvb21zZWNyZXRcIl0nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmb3Jtc3VibWl0ID0gJGlxKHt0bzogb2Iucm9vbWppZCwgdHlwZTogJ3NldCd9KS5jKCdxdWVyeScsIHt4bWxuczogJ2h0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL211YyNvd25lcid9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1zdWJtaXQuYygneCcsIHt4bWxuczogJ2phYmJlcjp4OmRhdGEnLCB0eXBlOiAnc3VibWl0J30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybXN1Ym1pdC5jKCdmaWVsZCcsIHsndmFyJzogJ0ZPUk1fVFlQRSd9KS5jKCd2YWx1ZScpLnQoJ2h0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL211YyNyb29tY29uZmlnJykudXAoKS51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybXN1Ym1pdC5jKCdmaWVsZCcsIHsndmFyJzogJ211YyNyb29tY29uZmlnX3Jvb21zZWNyZXQnfSkuYygndmFsdWUnKS50KGtleSkudXAoKS51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRml4ZXMgYSBidWcgaW4gcHJvc29keSAwLjkuKyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL2x4bXBwZC9pc3N1ZXMvZGV0YWlsP2lkPTM3M1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybXN1Ym1pdC5jKCdmaWVsZCcsIHsndmFyJzogJ211YyNyb29tY29uZmlnX3dob2lzJ30pLmMoJ3ZhbHVlJykudCgnYW55b25lJykudXAoKS51cCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IGlzIG11YyNyb29tY29uZmlnX3Bhc3N3b3JkcHJvdGVjdGVkcm9vbSByZXF1aXJlZD9cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kSVEoZm9ybXN1Ym1pdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvblN1Y2Nlc3MsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25FcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvbk5vdFN1cHBvcnRlZCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgb25FcnJvcik7XG4gICAgICAgIH0sXG4gICAgICAgIGtpY2s6IGZ1bmN0aW9uIChqaWQpIHtcbiAgICAgICAgICAgIHZhciBraWNrSVEgPSAkaXEoe3RvOiB0aGlzLnJvb21qaWQsIHR5cGU6ICdzZXQnfSlcbiAgICAgICAgICAgICAgICAuYygncXVlcnknLCB7eG1sbnM6ICdodHRwOi8vamFiYmVyLm9yZy9wcm90b2NvbC9tdWMjYWRtaW4nfSlcbiAgICAgICAgICAgICAgICAuYygnaXRlbScsIHtuaWNrOiBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpLCByb2xlOiAnbm9uZSd9KVxuICAgICAgICAgICAgICAgIC5jKCdyZWFzb24nKS50KCdZb3UgaGF2ZSBiZWVuIGtpY2tlZC4nKS51cCgpLnVwKCkudXAoKTtcblxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLnNlbmRJUShcbiAgICAgICAgICAgICAgICBraWNrSVEsXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnS2ljayBwYXJ0aWNpcGFudCB3aXRoIGppZDogJywgamlkLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdLaWNrIHBhcnRpY2lwYW50IGVycm9yOiAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHNlbmRQcmVzZW5jZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHByZXMgPSAkcHJlcyh7dG86IHRoaXMucHJlc01hcFsndG8nXSB9KTtcbiAgICAgICAgICAgIHByZXMuYygneCcsIHt4bWxuczogdGhpcy5wcmVzTWFwWyd4bnMnXX0pO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5wcmVzTWFwWydwYXNzd29yZCddKSB7XG4gICAgICAgICAgICAgICAgcHJlcy5jKCdwYXNzd29yZCcpLnQodGhpcy5wcmVzTWFwWydwYXNzd29yZCddKS51cCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmVzLnVwKCk7XG5cbiAgICAgICAgICAgIC8vIFNlbmQgWEVQLTAxMTUgJ2MnIHN0YW56YSB0aGF0IGNvbnRhaW5zIG91ciBjYXBhYmlsaXRpZXMgaW5mb1xuICAgICAgICAgICAgaWYgKHRoaXMuY29ubmVjdGlvbi5jYXBzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLmNhcHMubm9kZSA9IGNvbmZpZy5jbGllbnROb2RlO1xuICAgICAgICAgICAgICAgIHByZXMuYygnYycsIHRoaXMuY29ubmVjdGlvbi5jYXBzLmdlbmVyYXRlQ2Fwc0F0dHJzKCkpLnVwKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHByZXMuYygndXNlci1hZ2VudCcsIHt4bWxuczogJ2h0dHA6Ly9qaXRzaS5vcmcvaml0bWVldC91c2VyLWFnZW50J30pXG4gICAgICAgICAgICAgICAgLnQobmF2aWdhdG9yLnVzZXJBZ2VudCkudXAoKTtcblxuICAgICAgICAgICAgaWYgKHRoaXMucHJlc01hcFsnYnJpZGdlSXNEb3duJ10pIHtcbiAgICAgICAgICAgICAgICBwcmVzLmMoJ2JyaWRnZUlzRG93bicpLnVwKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByZXNNYXBbJ2VtYWlsJ10pIHtcbiAgICAgICAgICAgICAgICBwcmVzLmMoJ2VtYWlsJykudCh0aGlzLnByZXNNYXBbJ2VtYWlsJ10pLnVwKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByZXNNYXBbJ3VzZXJJZCddKSB7XG4gICAgICAgICAgICAgICAgcHJlcy5jKCd1c2VySWQnKS50KHRoaXMucHJlc01hcFsndXNlcklkJ10pLnVwKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByZXNNYXBbJ2Rpc3BsYXlOYW1lJ10pIHtcbiAgICAgICAgICAgICAgICAvLyBYRVAtMDE3MlxuICAgICAgICAgICAgICAgIHByZXMuYygnbmljaycsIHt4bWxuczogJ2h0dHA6Ly9qYWJiZXIub3JnL3Byb3RvY29sL25pY2snfSlcbiAgICAgICAgICAgICAgICAgICAgLnQodGhpcy5wcmVzTWFwWydkaXNwbGF5TmFtZSddKS51cCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wcmVzTWFwWydhdWRpb25zJ10pIHtcbiAgICAgICAgICAgICAgICBwcmVzLmMoJ2F1ZGlvbXV0ZWQnLCB7eG1sbnM6IHRoaXMucHJlc01hcFsnYXVkaW9ucyddfSlcbiAgICAgICAgICAgICAgICAgICAgLnQodGhpcy5wcmVzTWFwWydhdWRpb211dGVkJ10pLnVwKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLnByZXNNYXBbJ3ZpZGVvbnMnXSkge1xuICAgICAgICAgICAgICAgIHByZXMuYygndmlkZW9tdXRlZCcsIHt4bWxuczogdGhpcy5wcmVzTWFwWyd2aWRlb25zJ119KVxuICAgICAgICAgICAgICAgICAgICAudCh0aGlzLnByZXNNYXBbJ3ZpZGVvbXV0ZWQnXSkudXAoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMucHJlc01hcFsnc3RhdHNucyddKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRzID0gcHJlcy5jKCdzdGF0cycsIHt4bWxuczogdGhpcy5wcmVzTWFwWydzdGF0c25zJ119KTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBzdGF0IGluIHRoaXMucHJlc01hcFtcInN0YXRzXCJdKVxuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5wcmVzTWFwW1wic3RhdHNcIl1bc3RhdF0gIT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzLmMoXCJzdGF0XCIsIHtuYW1lOiBzdGF0LCB2YWx1ZTogdGhpcy5wcmVzTWFwW1wic3RhdHNcIl1bc3RhdF19KS51cCgpO1xuICAgICAgICAgICAgICAgIHByZXMudXAoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMucHJlc01hcFsncHJlemlucyddKSB7XG4gICAgICAgICAgICAgICAgcHJlcy5jKCdwcmV6aScsXG4gICAgICAgICAgICAgICAgICAgIHt4bWxuczogdGhpcy5wcmVzTWFwWydwcmV6aW5zJ10sXG4gICAgICAgICAgICAgICAgICAgICAgICAndXJsJzogdGhpcy5wcmVzTWFwWydwcmV6aXVybCddfSlcbiAgICAgICAgICAgICAgICAgICAgLmMoJ2N1cnJlbnQnKS50KHRoaXMucHJlc01hcFsncHJlemljdXJyZW50J10pLnVwKCkudXAoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMucHJlc01hcFsnZXRoZXJwYWRucyddKSB7XG4gICAgICAgICAgICAgICAgcHJlcy5jKCdldGhlcnBhZCcsIHt4bWxuczogdGhpcy5wcmVzTWFwWydldGhlcnBhZG5zJ119KVxuICAgICAgICAgICAgICAgICAgICAudCh0aGlzLnByZXNNYXBbJ2V0aGVycGFkbmFtZSddKS51cCgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodGhpcy5wcmVzTWFwWydtZWRpYW5zJ10pIHtcbiAgICAgICAgICAgICAgICBwcmVzLmMoJ21lZGlhJywge3htbG5zOiB0aGlzLnByZXNNYXBbJ21lZGlhbnMnXX0pO1xuICAgICAgICAgICAgICAgIHZhciBzb3VyY2VOdW1iZXIgPSAwO1xuICAgICAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMucHJlc01hcCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChrZXkuaW5kZXhPZignc291cmNlJykgPj0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc291cmNlTnVtYmVyKys7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlTnVtYmVyID4gMClcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPD0gc291cmNlTnVtYmVyIC8gMzsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVzLmMoJ3NvdXJjZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge3R5cGU6IHRoaXMucHJlc01hcFsnc291cmNlJyArIGkgKyAnX3R5cGUnXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3NyYzogdGhpcy5wcmVzTWFwWydzb3VyY2UnICsgaSArICdfc3NyYyddLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3Rpb246IHRoaXMucHJlc01hcFsnc291cmNlJyArIGkgKyAnX2RpcmVjdGlvbiddXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8fCAnc2VuZHJlY3YnIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICkudXAoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwcmVzLnVwKCk7XG4vLyAgICAgICAgY29uc29sZS5kZWJ1ZyhwcmVzLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLnNlbmQocHJlcyk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZERpc3BsYXlOYW1lVG9QcmVzZW5jZTogZnVuY3Rpb24gKGRpc3BsYXlOYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ2Rpc3BsYXlOYW1lJ10gPSBkaXNwbGF5TmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkTWVkaWFUb1ByZXNlbmNlOiBmdW5jdGlvbiAoc291cmNlTnVtYmVyLCBtdHlwZSwgc3NyY3MsIGRpcmVjdGlvbikge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnByZXNNYXBbJ21lZGlhbnMnXSlcbiAgICAgICAgICAgICAgICB0aGlzLnByZXNNYXBbJ21lZGlhbnMnXSA9ICdodHRwOi8vZXN0b3MuZGUvbnMvbWpzJztcblxuICAgICAgICAgICAgdGhpcy5wcmVzTWFwWydzb3VyY2UnICsgc291cmNlTnVtYmVyICsgJ190eXBlJ10gPSBtdHlwZTtcbiAgICAgICAgICAgIHRoaXMucHJlc01hcFsnc291cmNlJyArIHNvdXJjZU51bWJlciArICdfc3NyYyddID0gc3NyY3M7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ3NvdXJjZScgKyBzb3VyY2VOdW1iZXIgKyAnX2RpcmVjdGlvbiddID0gZGlyZWN0aW9uO1xuICAgICAgICB9LFxuICAgICAgICBjbGVhclByZXNlbmNlTWVkaWE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHRoaXMucHJlc01hcCkuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgaWYgKGtleS5pbmRleE9mKCdzb3VyY2UnKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgc2VsZi5wcmVzTWFwW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZFByZXppVG9QcmVzZW5jZTogZnVuY3Rpb24gKHVybCwgY3VycmVudFNsaWRlKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ3ByZXppbnMnXSA9ICdodHRwOi8vaml0c2kub3JnL2ppdG1lZXQvcHJlemknO1xuICAgICAgICAgICAgdGhpcy5wcmVzTWFwWydwcmV6aXVybCddID0gdXJsO1xuICAgICAgICAgICAgdGhpcy5wcmVzTWFwWydwcmV6aWN1cnJlbnQnXSA9IGN1cnJlbnRTbGlkZTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVtb3ZlUHJlemlGcm9tUHJlc2VuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnByZXNNYXBbJ3ByZXppbnMnXTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnByZXNNYXBbJ3ByZXppdXJsJ107XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5wcmVzTWFwWydwcmV6aWN1cnJlbnQnXTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkQ3VycmVudFNsaWRlVG9QcmVzZW5jZTogZnVuY3Rpb24gKGN1cnJlbnRTbGlkZSkge1xuICAgICAgICAgICAgdGhpcy5wcmVzTWFwWydwcmV6aWN1cnJlbnQnXSA9IGN1cnJlbnRTbGlkZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0UHJlemk6IGZ1bmN0aW9uIChyb29tamlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5wcmV6aU1hcFtyb29tamlkXTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkRXRoZXJwYWRUb1ByZXNlbmNlOiBmdW5jdGlvbiAoZXRoZXJwYWROYW1lKSB7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ2V0aGVycGFkbnMnXSA9ICdodHRwOi8vaml0c2kub3JnL2ppdG1lZXQvZXRoZXJwYWQnO1xuICAgICAgICAgICAgdGhpcy5wcmVzTWFwWydldGhlcnBhZG5hbWUnXSA9IGV0aGVycGFkTmFtZTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkQXVkaW9JbmZvVG9QcmVzZW5jZTogZnVuY3Rpb24gKGlzTXV0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc01hcFsnYXVkaW9ucyddID0gJ2h0dHA6Ly9qaXRzaS5vcmcvaml0bWVldC9hdWRpbyc7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ2F1ZGlvbXV0ZWQnXSA9IGlzTXV0ZWQudG9TdHJpbmcoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkVmlkZW9JbmZvVG9QcmVzZW5jZTogZnVuY3Rpb24gKGlzTXV0ZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc01hcFsndmlkZW9ucyddID0gJ2h0dHA6Ly9qaXRzaS5vcmcvaml0bWVldC92aWRlbyc7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ3ZpZGVvbXV0ZWQnXSA9IGlzTXV0ZWQudG9TdHJpbmcoKTtcbiAgICAgICAgfSxcbiAgICAgICAgYWRkQ29ubmVjdGlvbkluZm9Ub1ByZXNlbmNlOiBmdW5jdGlvbiAoc3RhdHMpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc01hcFsnc3RhdHNucyddID0gJ2h0dHA6Ly9qaXRzaS5vcmcvaml0bWVldC9zdGF0cyc7XG4gICAgICAgICAgICB0aGlzLnByZXNNYXBbJ3N0YXRzJ10gPSBzdGF0cztcbiAgICAgICAgfSxcbiAgICAgICAgZmluZEppZEZyb21SZXNvdXJjZTogZnVuY3Rpb24gKHJlc291cmNlSmlkKSB7XG4gICAgICAgICAgICBpZiAocmVzb3VyY2VKaWQgJiZcbiAgICAgICAgICAgICAgICByZXNvdXJjZUppZCA9PT0gU3Ryb3BoZS5nZXRSZXNvdXJjZUZyb21KaWQodGhpcy5teXJvb21qaWQpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubXlyb29tamlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHBlZXJKaWQgPSBudWxsO1xuICAgICAgICAgICAgT2JqZWN0LmtleXModGhpcy5tZW1iZXJzKS5zb21lKGZ1bmN0aW9uIChqaWQpIHtcbiAgICAgICAgICAgICAgICBwZWVySmlkID0gamlkO1xuICAgICAgICAgICAgICAgIHJldHVybiBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChqaWQpID09PSByZXNvdXJjZUppZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHBlZXJKaWQ7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZEJyaWRnZUlzRG93blRvUHJlc2VuY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc01hcFsnYnJpZGdlSXNEb3duJ10gPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBhZGRFbWFpbFRvUHJlc2VuY2U6IGZ1bmN0aW9uIChlbWFpbCkge1xuICAgICAgICAgICAgdGhpcy5wcmVzTWFwWydlbWFpbCddID0gZW1haWw7XG4gICAgICAgIH0sXG4gICAgICAgIGFkZFVzZXJJZFRvUHJlc2VuY2U6IGZ1bmN0aW9uICh1c2VySWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJlc01hcFsndXNlcklkJ10gPSB1c2VySWQ7XG4gICAgICAgIH0sXG4gICAgICAgIGlzTW9kZXJhdG9yOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yb2xlID09PSAnbW9kZXJhdG9yJztcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0TWVtYmVyUm9sZTogZnVuY3Rpb24gKHBlZXJKaWQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm1lbWJlcnNbcGVlckppZF0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5tZW1iZXJzW3BlZXJKaWRdLnJvbGU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSxcbiAgICAgICAgb25QYXJ0aWNpcGFudExlZnQ6IGZ1bmN0aW9uIChqaWQpIHtcbiAgICAgICAgICAgIFVJLm9uTXVjTGVmdChqaWQpO1xuXG4gICAgICAgICAgICBBUEkudHJpZ2dlckV2ZW50KFwicGFydGljaXBhbnRMZWZ0XCIsIHtqaWQ6IGppZH0pO1xuXG4gICAgICAgICAgICBkZWxldGUgamlkMlNzcmNbamlkXTtcblxuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLmppbmdsZS50ZXJtaW5hdGVCeUppZChqaWQpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5nZXRQcmV6aShqaWQpKSB7XG4gICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigncHJlc2VudGF0aW9ucmVtb3ZlZC5tdWMnLFxuICAgICAgICAgICAgICAgICAgICBbamlkLCB0aGlzLmdldFByZXppKGppZCldKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgTW9kZXJhdG9yLm9uTXVjTGVmdChqaWQpO1xuICAgICAgICB9LFxuICAgICAgICBwYXJzZVByZXNlbmNlOiBmdW5jdGlvbiAoZnJvbSwgbWVtZWJlciwgcHJlcykge1xuICAgICAgICAgICAgaWYoJChwcmVzKS5maW5kKFwiPmJyaWRnZUlzRG93blwiKS5sZW5ndGggPiAwICYmICFicmlkZ2VJc0Rvd24pIHtcbiAgICAgICAgICAgICAgICBicmlkZ2VJc0Rvd24gPSB0cnVlO1xuICAgICAgICAgICAgICAgIGV2ZW50RW1pdHRlci5lbWl0KFhNUFBFdmVudHMuQlJJREdFX0RPV04pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZihtZW1lYmVyLmlzRm9jdXMpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICAvLyBSZW1vdmUgb2xkIHNzcmNzIGNvbWluZyBmcm9tIHRoZSBqaWRcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKHNzcmMyamlkKS5mb3JFYWNoKGZ1bmN0aW9uIChzc3JjKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNzcmMyamlkW3NzcmNdID09IGppZCkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgc3NyYzJqaWRbc3NyY107XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzc3JjMnZpZGVvVHlwZVtzc3JjXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIGNoYW5nZWRTdHJlYW1zID0gW107XG4gICAgICAgICAgICAkKHByZXMpLmZpbmQoJz5tZWRpYVt4bWxucz1cImh0dHA6Ly9lc3Rvcy5kZS9ucy9tanNcIl0+c291cmNlJykuZWFjaChmdW5jdGlvbiAoaWR4LCBzc3JjKSB7XG4gICAgICAgICAgICAgICAgLy9jb25zb2xlLmxvZyhqaWQsICdhc3NvYyBzc3JjJywgc3NyYy5nZXRBdHRyaWJ1dGUoJ3R5cGUnKSwgc3NyYy5nZXRBdHRyaWJ1dGUoJ3NzcmMnKSk7XG4gICAgICAgICAgICAgICAgdmFyIHNzcmNWID0gc3NyYy5nZXRBdHRyaWJ1dGUoJ3NzcmMnKTtcbiAgICAgICAgICAgICAgICBzc3JjMmppZFtzc3JjVl0gPSBmcm9tO1xuICAgICAgICAgICAgICAgIG5vdFJlY2VpdmVkU1NSQ3MucHVzaChzc3JjVik7XG5cbiAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IHNzcmMuZ2V0QXR0cmlidXRlKCd0eXBlJyk7XG4gICAgICAgICAgICAgICAgc3NyYzJ2aWRlb1R5cGVbc3NyY1ZdID0gdHlwZTtcblxuICAgICAgICAgICAgICAgIHZhciBkaXJlY3Rpb24gPSBzc3JjLmdldEF0dHJpYnV0ZSgnZGlyZWN0aW9uJyk7XG5cbiAgICAgICAgICAgICAgICBjaGFuZ2VkU3RyZWFtcy5wdXNoKHt0eXBlOiB0eXBlLCBkaXJlY3Rpb246IGRpcmVjdGlvbn0pO1xuXG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZXZlbnRFbWl0dGVyLmVtaXQoWE1QUEV2ZW50cy5DSEFOR0VEX1NUUkVBTVMsIGZyb20sIGNoYW5nZWRTdHJlYW1zKTtcblxuICAgICAgICAgICAgdmFyIGRpc3BsYXlOYW1lID0gIWNvbmZpZy5kaXNwbGF5Smlkc1xuICAgICAgICAgICAgICAgID8gbWVtZWJlci5kaXNwbGF5TmFtZSA6IFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGZyb20pO1xuXG4gICAgICAgICAgICBpZiAoZGlzcGxheU5hbWUgJiYgZGlzcGxheU5hbWUubGVuZ3RoID4gMClcbiAgICAgICAgICAgIHtcbi8vICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2Rpc3BsYXluYW1lY2hhbmdlZCcsXG4vLyAgICAgICAgICAgICAgICAgICAgW2ppZCwgZGlzcGxheU5hbWVdKTtcbiAgICAgICAgICAgICAgICBldmVudEVtaXR0ZXIuZW1pdChYTVBQRXZlbnRzLkRJU1BMQVlfTkFNRV9DSEFOR0VELCBmcm9tLCBkaXNwbGF5TmFtZSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICAgICAgdmFyIGlkID0gJChwcmVzKS5maW5kKCc+dXNlcklEJykudGV4dCgpO1xuICAgICAgICAgICAgdmFyIGVtYWlsID0gJChwcmVzKS5maW5kKCc+ZW1haWwnKTtcbiAgICAgICAgICAgIGlmKGVtYWlsLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBpZCA9IGVtYWlsLnRleHQoKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZXZlbnRFbWl0dGVyLmVtaXQoWE1QUEV2ZW50cy5VU0VSX0lEX0NIQU5HRUQsIGZyb20sIGlkKTtcbiAgICAgICAgfVxuICAgIH0pO1xufTtcblxuIiwiLyoganNoaW50IC1XMTE3ICovXG5cbnZhciBKaW5nbGVTZXNzaW9uID0gcmVxdWlyZShcIi4vSmluZ2xlU2Vzc2lvblwiKTtcblxuZnVuY3Rpb24gQ2FsbEluY29taW5nSmluZ2xlKHNpZCwgY29ubmVjdGlvbikge1xuICAgIHZhciBzZXNzID0gY29ubmVjdGlvbi5qaW5nbGUuc2Vzc2lvbnNbc2lkXTtcblxuICAgIC8vIFRPRE86IGRvIHdlIGNoZWNrIGFjdGl2ZWNhbGwgPT0gbnVsbD9cbiAgICBhY3RpdmVjYWxsID0gc2VzcztcblxuICAgIHN0YXRpc3RpY3Mub25Db25mZXJlbmNlQ3JlYXRlZChzZXNzKTtcbiAgICBSVEMub25Db25mZXJlbmNlQ3JlYXRlZChzZXNzKTtcblxuICAgIC8vIFRPRE86IGNoZWNrIGFmZmlsaWF0aW9uIGFuZC9vciByb2xlXG4gICAgY29uc29sZS5sb2coJ2VtdWMgZGF0YSBmb3InLCBzZXNzLnBlZXJqaWQsIGNvbm5lY3Rpb24uZW11Yy5tZW1iZXJzW3Nlc3MucGVlcmppZF0pO1xuICAgIHNlc3MudXNlZHJpcCA9IHRydWU7IC8vIG5vdC1zby1uYWl2ZSB0cmlja2xlIGljZVxuICAgIHNlc3Muc2VuZEFuc3dlcigpO1xuICAgIHNlc3MuYWNjZXB0KCk7XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oWE1QUClcbntcbiAgICBTdHJvcGhlLmFkZENvbm5lY3Rpb25QbHVnaW4oJ2ppbmdsZScsIHtcbiAgICAgICAgY29ubmVjdGlvbjogbnVsbCxcbiAgICAgICAgc2Vzc2lvbnM6IHt9LFxuICAgICAgICBqaWQyc2Vzc2lvbjoge30sXG4gICAgICAgIGljZV9jb25maWc6IHtpY2VTZXJ2ZXJzOiBbXX0sXG4gICAgICAgIHBjX2NvbnN0cmFpbnRzOiB7fSxcbiAgICAgICAgbWVkaWFfY29uc3RyYWludHM6IHtcbiAgICAgICAgICAgIG1hbmRhdG9yeToge1xuICAgICAgICAgICAgICAgICdPZmZlclRvUmVjZWl2ZUF1ZGlvJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAnT2ZmZXJUb1JlY2VpdmVWaWRlbyc6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIE1vekRvbnRPZmZlckRhdGFDaGFubmVsOiB0cnVlIHdoZW4gdGhpcyBpcyBmaXJlZm94XG4gICAgICAgIH0sXG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uIChjb25uKSB7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24gPSBjb25uO1xuICAgICAgICAgICAgaWYgKHRoaXMuY29ubmVjdGlvbi5kaXNjbykge1xuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly94bXBwLm9yZy9leHRlbnNpb25zL3hlcC0wMTY3Lmh0bWwjc3VwcG9ydFxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly94bXBwLm9yZy9leHRlbnNpb25zL3hlcC0wMTc2Lmh0bWwjc3VwcG9ydFxuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5kaXNjby5hZGRGZWF0dXJlKCd1cm46eG1wcDpqaW5nbGU6MScpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5kaXNjby5hZGRGZWF0dXJlKCd1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6MScpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5kaXNjby5hZGRGZWF0dXJlKCd1cm46eG1wcDpqaW5nbGU6dHJhbnNwb3J0czppY2UtdWRwOjEnKTtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uZGlzY28uYWRkRmVhdHVyZSgndXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOmF1ZGlvJyk7XG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLmRpc2NvLmFkZEZlYXR1cmUoJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDp2aWRlbycpO1xuXG5cbiAgICAgICAgICAgICAgICAvLyB0aGlzIGlzIGRlYWx0IHdpdGggYnkgU0RQIE8vQSBzbyB3ZSBkb24ndCBuZWVkIHRvIGFubm91Y2UgdGhpc1xuICAgICAgICAgICAgICAgIC8vdGhpcy5jb25uZWN0aW9uLmRpc2NvLmFkZEZlYXR1cmUoJ3Vybjp4bXBwOmppbmdsZTphcHBzOnJ0cDpydGNwLWZiOjAnKTsgLy8gWEVQLTAyOTNcbiAgICAgICAgICAgICAgICAvL3RoaXMuY29ubmVjdGlvbi5kaXNjby5hZGRGZWF0dXJlKCd1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6cnRwLWhkcmV4dDowJyk7IC8vIFhFUC0wMjk0XG4gICAgICAgICAgICAgICAgaWYgKGNvbmZpZy51c2VSdGNwTXV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5kaXNjby5hZGRGZWF0dXJlKCd1cm46aWV0ZjpyZmM6NTc2MScpOyAvLyBydGNwLW11eFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoY29uZmlnLnVzZUJ1bmRsZSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uZGlzY28uYWRkRmVhdHVyZSgndXJuOmlldGY6cmZjOjU4ODgnKTsgLy8gYT1ncm91cCwgZS5nLiBidW5kbGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy90aGlzLmNvbm5lY3Rpb24uZGlzY28uYWRkRmVhdHVyZSgndXJuOmlldGY6cmZjOjU1NzYnKTsgLy8gYT1zc3JjXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uYWRkSGFuZGxlcih0aGlzLm9uSmluZ2xlLmJpbmQodGhpcyksICd1cm46eG1wcDpqaW5nbGU6MScsICdpcScsICdzZXQnLCBudWxsLCBudWxsKTtcbiAgICAgICAgfSxcbiAgICAgICAgb25KaW5nbGU6IGZ1bmN0aW9uIChpcSkge1xuICAgICAgICAgICAgdmFyIHNpZCA9ICQoaXEpLmZpbmQoJ2ppbmdsZScpLmF0dHIoJ3NpZCcpO1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9ICQoaXEpLmZpbmQoJ2ppbmdsZScpLmF0dHIoJ2FjdGlvbicpO1xuICAgICAgICAgICAgdmFyIGZyb21KaWQgPSBpcS5nZXRBdHRyaWJ1dGUoJ2Zyb20nKTtcbiAgICAgICAgICAgIC8vIHNlbmQgYWNrIGZpcnN0XG4gICAgICAgICAgICB2YXIgYWNrID0gJGlxKHt0eXBlOiAncmVzdWx0JyxcbiAgICAgICAgICAgICAgICB0bzogZnJvbUppZCxcbiAgICAgICAgICAgICAgICBpZDogaXEuZ2V0QXR0cmlidXRlKCdpZCcpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdvbiBqaW5nbGUgJyArIGFjdGlvbiArICcgZnJvbSAnICsgZnJvbUppZCwgaXEpO1xuICAgICAgICAgICAgdmFyIHNlc3MgPSB0aGlzLnNlc3Npb25zW3NpZF07XG4gICAgICAgICAgICBpZiAoJ3Nlc3Npb24taW5pdGlhdGUnICE9IGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGlmIChzZXNzID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIGFjay50eXBlID0gJ2Vycm9yJztcbiAgICAgICAgICAgICAgICAgICAgYWNrLmMoJ2Vycm9yJywge3R5cGU6ICdjYW5jZWwnfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jKCdpdGVtLW5vdC1mb3VuZCcsIHt4bWxuczogJ3VybjppZXRmOnBhcmFtczp4bWw6bnM6eG1wcC1zdGFuemFzJ30pLnVwKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jKCd1bmtub3duLXNlc3Npb24nLCB7eG1sbnM6ICd1cm46eG1wcDpqaW5nbGU6ZXJyb3JzOjEnfSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kKGFjayk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBjb21wYXJlIGZyb20gdG8gc2Vzcy5wZWVyamlkIChiYXJlIGppZCBjb21wYXJpc29uIGZvciBsYXRlciBjb21wYXQgd2l0aCBtZXNzYWdlLW1vZGUpXG4gICAgICAgICAgICAgICAgLy8gbG9jYWwgamlkIGlzIG5vdCBjaGVja2VkXG4gICAgICAgICAgICAgICAgaWYgKFN0cm9waGUuZ2V0QmFyZUppZEZyb21KaWQoZnJvbUppZCkgIT0gU3Ryb3BoZS5nZXRCYXJlSmlkRnJvbUppZChzZXNzLnBlZXJqaWQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignamlkIG1pc21hdGNoIGZvciBzZXNzaW9uIGlkJywgc2lkLCBmcm9tSmlkLCBzZXNzLnBlZXJqaWQpO1xuICAgICAgICAgICAgICAgICAgICBhY2sudHlwZSA9ICdlcnJvcic7XG4gICAgICAgICAgICAgICAgICAgIGFjay5jKCdlcnJvcicsIHt0eXBlOiAnY2FuY2VsJ30pXG4gICAgICAgICAgICAgICAgICAgICAgICAuYygnaXRlbS1ub3QtZm91bmQnLCB7eG1sbnM6ICd1cm46aWV0ZjpwYXJhbXM6eG1sOm5zOnhtcHAtc3Rhbnphcyd9KS51cCgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuYygndW5rbm93bi1zZXNzaW9uJywge3htbG5zOiAndXJuOnhtcHA6amluZ2xlOmVycm9yczoxJ30pO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZChhY2spO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNlc3MgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIC8vIGV4aXN0aW5nIHNlc3Npb24gd2l0aCBzYW1lIHNlc3Npb24gaWRcbiAgICAgICAgICAgICAgICAvLyB0aGlzIG1pZ2h0IGJlIG91dC1vZi1vcmRlciBpZiB0aGUgc2Vzcy5wZWVyamlkIGlzIHRoZSBzYW1lIGFzIGZyb21cbiAgICAgICAgICAgICAgICBhY2sudHlwZSA9ICdlcnJvcic7XG4gICAgICAgICAgICAgICAgYWNrLmMoJ2Vycm9yJywge3R5cGU6ICdjYW5jZWwnfSlcbiAgICAgICAgICAgICAgICAgICAgLmMoJ3NlcnZpY2UtdW5hdmFpbGFibGUnLCB7eG1sbnM6ICd1cm46aWV0ZjpwYXJhbXM6eG1sOm5zOnhtcHAtc3Rhbnphcyd9KS51cCgpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignZHVwbGljYXRlIHNlc3Npb24gaWQnLCBzaWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kKGFjayk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBGSVhNRTogY2hlY2sgZm9yIGEgZGVmaW5lZCBhY3Rpb25cbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kKGFjayk7XG4gICAgICAgICAgICAvLyBzZWUgaHR0cDovL3htcHAub3JnL2V4dGVuc2lvbnMveGVwLTAxNjYuaHRtbCNjb25jZXB0cy1zZXNzaW9uXG4gICAgICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3Nlc3Npb24taW5pdGlhdGUnOlxuICAgICAgICAgICAgICAgICAgICBzZXNzID0gbmV3IEppbmdsZVNlc3Npb24oXG4gICAgICAgICAgICAgICAgICAgICAgICAkKGlxKS5hdHRyKCd0bycpLCAkKGlxKS5maW5kKCdqaW5nbGUnKS5hdHRyKCdzaWQnKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbiwgWE1QUCk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbmZpZ3VyZSBzZXNzaW9uXG5cbiAgICAgICAgICAgICAgICAgICAgc2Vzcy5tZWRpYV9jb25zdHJhaW50cyA9IHRoaXMubWVkaWFfY29uc3RyYWludHM7XG4gICAgICAgICAgICAgICAgICAgIHNlc3MucGNfY29uc3RyYWludHMgPSB0aGlzLnBjX2NvbnN0cmFpbnRzO1xuICAgICAgICAgICAgICAgICAgICBzZXNzLmljZV9jb25maWcgPSB0aGlzLmljZV9jb25maWc7XG5cbiAgICAgICAgICAgICAgICAgICAgc2Vzcy5pbml0aWF0ZShmcm9tSmlkLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiBzZXRSZW1vdGVEZXNjcmlwdGlvbiBzaG91bGQgb25seSBiZSBkb25lIHdoZW4gdGhpcyBjYWxsIGlzIHRvIGJlIGFjY2VwdGVkXG4gICAgICAgICAgICAgICAgICAgIHNlc3Muc2V0UmVtb3RlRGVzY3JpcHRpb24oJChpcSkuZmluZCgnPmppbmdsZScpLCAnb2ZmZXInKTtcblxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb25zW3Nlc3Muc2lkXSA9IHNlc3M7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuamlkMnNlc3Npb25bc2Vzcy5wZWVyamlkXSA9IHNlc3M7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGNhbGxiYWNrIHNob3VsZCBlaXRoZXJcbiAgICAgICAgICAgICAgICAgICAgLy8gLnNlbmRBbnN3ZXIgYW5kIC5hY2NlcHRcbiAgICAgICAgICAgICAgICAgICAgLy8gb3IgLnNlbmRUZXJtaW5hdGUgLS0gbm90IG5lY2Vzc2FyaWx5IHN5bmNocm9udXNcbiAgICAgICAgICAgICAgICAgICAgQ2FsbEluY29taW5nSmluZ2xlKHNlc3Muc2lkLCB0aGlzLmNvbm5lY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdzZXNzaW9uLWFjY2VwdCc6XG4gICAgICAgICAgICAgICAgICAgIHNlc3Muc2V0UmVtb3RlRGVzY3JpcHRpb24oJChpcSkuZmluZCgnPmppbmdsZScpLCAnYW5zd2VyJyk7XG4gICAgICAgICAgICAgICAgICAgIHNlc3MuYWNjZXB0KCk7XG4gICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2NhbGxhY2NlcHRlZC5qaW5nbGUnLCBbc2Vzcy5zaWRdKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Vzc2lvbi10ZXJtaW5hdGUnOlxuICAgICAgICAgICAgICAgICAgICAvLyBJZiB0aGlzIGlzIG5vdCB0aGUgZm9jdXMgc2VuZGluZyB0aGUgdGVybWluYXRlLCB3ZSBoYXZlXG4gICAgICAgICAgICAgICAgICAgIC8vIG5vdGhpbmcgbW9yZSB0byBkbyBoZXJlLlxuICAgICAgICAgICAgICAgICAgICBpZiAoT2JqZWN0LmtleXModGhpcy5zZXNzaW9ucykubGVuZ3RoIDwgMVxuICAgICAgICAgICAgICAgICAgICAgICAgfHwgISh0aGlzLnNlc3Npb25zW09iamVjdC5rZXlzKHRoaXMuc2Vzc2lvbnMpWzBdXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlb2YgSmluZ2xlU2Vzc2lvbikpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCd0ZXJtaW5hdGluZy4uLicsIHNlc3Muc2lkKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vzcy50ZXJtaW5hdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50ZXJtaW5hdGUoc2Vzcy5zaWQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJChpcSkuZmluZCgnPmppbmdsZT5yZWFzb24nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2NhbGx0ZXJtaW5hdGVkLmppbmdsZScsIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzLnNpZCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXNzLnBlZXJqaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJChpcSkuZmluZCgnPmppbmdsZT5yZWFzb24+OmZpcnN0JylbMF0udGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKGlxKS5maW5kKCc+amluZ2xlPnJlYXNvbj50ZXh0JykudGV4dCgpXG4gICAgICAgICAgICAgICAgICAgICAgICBdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoZG9jdW1lbnQpLnRyaWdnZXIoJ2NhbGx0ZXJtaW5hdGVkLmppbmdsZScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgW3Nlc3Muc2lkLCBzZXNzLnBlZXJqaWRdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICd0cmFuc3BvcnQtaW5mbyc6XG4gICAgICAgICAgICAgICAgICAgIHNlc3MuYWRkSWNlQ2FuZGlkYXRlKCQoaXEpLmZpbmQoJz5qaW5nbGU+Y29udGVudCcpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnc2Vzc2lvbi1pbmZvJzpcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFmZmVjdGVkO1xuICAgICAgICAgICAgICAgICAgICBpZiAoJChpcSkuZmluZCgnPmppbmdsZT5yaW5naW5nW3htbG5zPVwidXJuOnhtcHA6amluZ2xlOmFwcHM6cnRwOmluZm86MVwiXScpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigncmluZ2luZy5qaW5nbGUnLCBbc2Vzcy5zaWRdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgkKGlxKS5maW5kKCc+amluZ2xlPm11dGVbeG1sbnM9XCJ1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6aW5mbzoxXCJdJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhZmZlY3RlZCA9ICQoaXEpLmZpbmQoJz5qaW5nbGU+bXV0ZVt4bWxucz1cInVybjp4bXBwOmppbmdsZTphcHBzOnJ0cDppbmZvOjFcIl0nKS5hdHRyKCduYW1lJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdtdXRlLmppbmdsZScsIFtzZXNzLnNpZCwgYWZmZWN0ZWRdKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICgkKGlxKS5maW5kKCc+amluZ2xlPnVubXV0ZVt4bWxucz1cInVybjp4bXBwOmppbmdsZTphcHBzOnJ0cDppbmZvOjFcIl0nKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFmZmVjdGVkID0gJChpcSkuZmluZCgnPmppbmdsZT51bm11dGVbeG1sbnM9XCJ1cm46eG1wcDpqaW5nbGU6YXBwczpydHA6aW5mbzoxXCJdJykuYXR0cignbmFtZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJChkb2N1bWVudCkudHJpZ2dlcigndW5tdXRlLmppbmdsZScsIFtzZXNzLnNpZCwgYWZmZWN0ZWRdKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdhZGRzb3VyY2UnOiAvLyBGSVhNRTogcHJvcHJpZXRhcnksIHVuLWppbmdsZWlzaFxuICAgICAgICAgICAgICAgIGNhc2UgJ3NvdXJjZS1hZGQnOiAvLyBGSVhNRTogcHJvcHJpZXRhcnlcbiAgICAgICAgICAgICAgICAgICAgc2Vzcy5hZGRTb3VyY2UoJChpcSkuZmluZCgnPmppbmdsZT5jb250ZW50JyksIGZyb21KaWQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdyZW1vdmVzb3VyY2UnOiAvLyBGSVhNRTogcHJvcHJpZXRhcnksIHVuLWppbmdsZWlzaFxuICAgICAgICAgICAgICAgIGNhc2UgJ3NvdXJjZS1yZW1vdmUnOiAvLyBGSVhNRTogcHJvcHJpZXRhcnlcbiAgICAgICAgICAgICAgICAgICAgc2Vzcy5yZW1vdmVTb3VyY2UoJChpcSkuZmluZCgnPmppbmdsZT5jb250ZW50JyksIGZyb21KaWQpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2ppbmdsZSBhY3Rpb24gbm90IGltcGxlbWVudGVkJywgYWN0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgaW5pdGlhdGU6IGZ1bmN0aW9uIChwZWVyamlkLCBteWppZCkgeyAvLyBpbml0aWF0ZSBhIG5ldyBqaW5nbGVzZXNzaW9uIHRvIHBlZXJqaWRcbiAgICAgICAgICAgIHZhciBzZXNzID0gbmV3IEppbmdsZVNlc3Npb24obXlqaWQgfHwgdGhpcy5jb25uZWN0aW9uLmppZCxcbiAgICAgICAgICAgICAgICBNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHIoMiwgMTIpLCAvLyByYW5kb20gc3RyaW5nXG4gICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLCBYTVBQKTtcbiAgICAgICAgICAgIC8vIGNvbmZpZ3VyZSBzZXNzaW9uXG5cbiAgICAgICAgICAgIHNlc3MubWVkaWFfY29uc3RyYWludHMgPSB0aGlzLm1lZGlhX2NvbnN0cmFpbnRzO1xuICAgICAgICAgICAgc2Vzcy5wY19jb25zdHJhaW50cyA9IHRoaXMucGNfY29uc3RyYWludHM7XG4gICAgICAgICAgICBzZXNzLmljZV9jb25maWcgPSB0aGlzLmljZV9jb25maWc7XG5cbiAgICAgICAgICAgIHNlc3MuaW5pdGlhdGUocGVlcmppZCwgdHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLnNlc3Npb25zW3Nlc3Muc2lkXSA9IHNlc3M7XG4gICAgICAgICAgICB0aGlzLmppZDJzZXNzaW9uW3Nlc3MucGVlcmppZF0gPSBzZXNzO1xuICAgICAgICAgICAgc2Vzcy5zZW5kT2ZmZXIoKTtcbiAgICAgICAgICAgIHJldHVybiBzZXNzO1xuICAgICAgICB9LFxuICAgICAgICB0ZXJtaW5hdGU6IGZ1bmN0aW9uIChzaWQsIHJlYXNvbiwgdGV4dCkgeyAvLyB0ZXJtaW5hdGUgYnkgc2Vzc2lvbmlkIChvciBhbGwgc2Vzc2lvbnMpXG4gICAgICAgICAgICBpZiAoc2lkID09PSBudWxsIHx8IHNpZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgZm9yIChzaWQgaW4gdGhpcy5zZXNzaW9ucykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGhpcy5zZXNzaW9uc1tzaWRdLnN0YXRlICE9ICdlbmRlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc2Vzc2lvbnNbc2lkXS5zZW5kVGVybWluYXRlKHJlYXNvbiB8fCAoIXRoaXMuc2Vzc2lvbnNbc2lkXS5hY3RpdmUoKSkgPyAnY2FuY2VsJyA6IG51bGwsIHRleHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uc1tzaWRdLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmppZDJzZXNzaW9uW3RoaXMuc2Vzc2lvbnNbc2lkXS5wZWVyamlkXTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuc2Vzc2lvbnNbc2lkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuc2Vzc2lvbnMuaGFzT3duUHJvcGVydHkoc2lkKSkge1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlc3Npb25zW3NpZF0uc3RhdGUgIT0gJ2VuZGVkJykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnNlc3Npb25zW3NpZF0uc2VuZFRlcm1pbmF0ZShyZWFzb24gfHwgKCF0aGlzLnNlc3Npb25zW3NpZF0uYWN0aXZlKCkpID8gJ2NhbmNlbCcgOiBudWxsLCB0ZXh0KTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXNzaW9uc1tzaWRdLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5qaWQyc2Vzc2lvblt0aGlzLnNlc3Npb25zW3NpZF0ucGVlcmppZF07XG4gICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuc2Vzc2lvbnNbc2lkXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgLy8gVXNlZCB0byB0ZXJtaW5hdGUgYSBzZXNzaW9uIHdoZW4gYW4gdW5hdmFpbGFibGUgcHJlc2VuY2UgaXMgcmVjZWl2ZWQuXG4gICAgICAgIHRlcm1pbmF0ZUJ5SmlkOiBmdW5jdGlvbiAoamlkKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5qaWQyc2Vzc2lvbi5oYXNPd25Qcm9wZXJ0eShqaWQpKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNlc3MgPSB0aGlzLmppZDJzZXNzaW9uW2ppZF07XG4gICAgICAgICAgICAgICAgaWYgKHNlc3MpIHtcbiAgICAgICAgICAgICAgICAgICAgc2Vzcy50ZXJtaW5hdGUoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3BlZXIgd2VudCBhd2F5IHNpbGVudGx5JywgamlkKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuc2Vzc2lvbnNbc2Vzcy5zaWRdO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5qaWQyc2Vzc2lvbltqaWRdO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdjYWxsdGVybWluYXRlZC5qaW5nbGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgW3Nlc3Muc2lkLCBqaWRdLCAnZ29uZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgdGVybWluYXRlUmVtb3RlQnlKaWQ6IGZ1bmN0aW9uIChqaWQsIHJlYXNvbikge1xuICAgICAgICAgICAgaWYgKHRoaXMuamlkMnNlc3Npb24uaGFzT3duUHJvcGVydHkoamlkKSkge1xuICAgICAgICAgICAgICAgIHZhciBzZXNzID0gdGhpcy5qaWQyc2Vzc2lvbltqaWRdO1xuICAgICAgICAgICAgICAgIGlmIChzZXNzKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlc3Muc2VuZFRlcm1pbmF0ZShyZWFzb24gfHwgKCFzZXNzLmFjdGl2ZSgpKSA/ICdraWNrJyA6IG51bGwpO1xuICAgICAgICAgICAgICAgICAgICBzZXNzLnRlcm1pbmF0ZSgpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygndGVybWluYXRlIHBlZXIgd2l0aCBqaWQnLCBzZXNzLnNpZCwgamlkKTtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHRoaXMuc2Vzc2lvbnNbc2Vzcy5zaWRdO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5qaWQyc2Vzc2lvbltqaWRdO1xuICAgICAgICAgICAgICAgICAgICAkKGRvY3VtZW50KS50cmlnZ2VyKCdjYWxsdGVybWluYXRlZC5qaW5nbGUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgW3Nlc3Muc2lkLCBqaWQsICdraWNrZWQnXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBnZXRTdHVuQW5kVHVybkNyZWRlbnRpYWxzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAvLyBnZXQgc3R1biBhbmQgdHVybiBjb25maWd1cmF0aW9uIGZyb20gc2VydmVyIHZpYSB4ZXAtMDIxNVxuICAgICAgICAgICAgLy8gdXNlcyB0aW1lLWxpbWl0ZWQgY3JlZGVudGlhbHMgYXMgZGVzY3JpYmVkIGluXG4gICAgICAgICAgICAvLyBodHRwOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9kcmFmdC11YmVydGktYmVoYXZlLXR1cm4tcmVzdC0wMFxuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIHNlZSBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3Byb3NvZHktbW9kdWxlcy9zb3VyY2UvYnJvd3NlL21vZF90dXJuY3JlZGVudGlhbHMvbW9kX3R1cm5jcmVkZW50aWFscy5sdWFcbiAgICAgICAgICAgIC8vIGZvciBhIHByb3NvZHkgbW9kdWxlIHdoaWNoIGltcGxlbWVudHMgdGhpc1xuICAgICAgICAgICAgLy9cbiAgICAgICAgICAgIC8vIGN1cnJlbnRseSwgdGhpcyBkb2Vzbid0IHdvcmsgd2l0aCB1cGRhdGVJY2UgYW5kIHRoZXJlZm9yZSBjcmVkZW50aWFscyB3aXRoIGEgbG9uZ1xuICAgICAgICAgICAgLy8gdmFsaWRpdHkgaGF2ZSB0byBiZSBmZXRjaGVkIGJlZm9yZSBjcmVhdGluZyB0aGUgcGVlcmNvbm5lY3Rpb25cbiAgICAgICAgICAgIC8vIFRPRE86IGltcGxlbWVudCByZWZyZXNoIHZpYSB1cGRhdGVJY2UgYXMgZGVzY3JpYmVkIGluXG4gICAgICAgICAgICAvLyAgICAgIGh0dHBzOi8vY29kZS5nb29nbGUuY29tL3Avd2VicnRjL2lzc3Vlcy9kZXRhaWw/aWQ9MTY1MFxuICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLnNlbmRJUShcbiAgICAgICAgICAgICAgICAkaXEoe3R5cGU6ICdnZXQnLCB0bzogdGhpcy5jb25uZWN0aW9uLmRvbWFpbn0pXG4gICAgICAgICAgICAgICAgICAgIC5jKCdzZXJ2aWNlcycsIHt4bWxuczogJ3Vybjp4bXBwOmV4dGRpc2NvOjEnfSkuYygnc2VydmljZScsIHtob3N0OiAndHVybi4nICsgdGhpcy5jb25uZWN0aW9uLmRvbWFpbn0pLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGljZXNlcnZlcnMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgJChyZXMpLmZpbmQoJz5zZXJ2aWNlcz5zZXJ2aWNlJykuZWFjaChmdW5jdGlvbiAoaWR4LCBlbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwgPSAkKGVsKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBkaWN0ID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdHlwZSA9IGVsLmF0dHIoJ3R5cGUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0dW4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaWN0LnVybCA9ICdzdHVuOicgKyBlbC5hdHRyKCdob3N0Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlbC5hdHRyKCdwb3J0JykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpY3QudXJsICs9ICc6JyArIGVsLmF0dHIoJ3BvcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY2VzZXJ2ZXJzLnB1c2goZGljdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3R1cm4nOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgJ3R1cm5zJzpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGljdC51cmwgPSB0eXBlICsgJzonO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwuYXR0cigndXNlcm5hbWUnKSkgeyAvLyBodHRwczovL2NvZGUuZ29vZ2xlLmNvbS9wL3dlYnJ0Yy9pc3N1ZXMvZGV0YWlsP2lkPTE1MDhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50Lm1hdGNoKC9DaHJvbShlfGl1bSlcXC8oWzAtOV0rKVxcLi8pICYmIHBhcnNlSW50KG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0Nocm9tKGV8aXVtKVxcLyhbMC05XSspXFwuLylbMl0sIDEwKSA8IDI4KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGljdC51cmwgKz0gZWwuYXR0cigndXNlcm5hbWUnKSArICdAJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGljdC51c2VybmFtZSA9IGVsLmF0dHIoJ3VzZXJuYW1lJyk7IC8vIG9ubHkgd29ya3MgaW4gTTI4XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGljdC51cmwgKz0gZWwuYXR0cignaG9zdCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwuYXR0cigncG9ydCcpICYmIGVsLmF0dHIoJ3BvcnQnKSAhPSAnMzQ3OCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpY3QudXJsICs9ICc6JyArIGVsLmF0dHIoJ3BvcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwuYXR0cigndHJhbnNwb3J0JykgJiYgZWwuYXR0cigndHJhbnNwb3J0JykgIT0gJ3VkcCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRpY3QudXJsICs9ICc/dHJhbnNwb3J0PScgKyBlbC5hdHRyKCd0cmFuc3BvcnQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZWwuYXR0cigncGFzc3dvcmQnKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGljdC5jcmVkZW50aWFsID0gZWwuYXR0cigncGFzc3dvcmQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpY2VzZXJ2ZXJzLnB1c2goZGljdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5pY2VfY29uZmlnLmljZVNlcnZlcnMgPSBpY2VzZXJ2ZXJzO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2dldHRpbmcgdHVybiBjcmVkZW50aWFscyBmYWlsZWQnLCBlcnIpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLndhcm4oJ2lzIG1vZF90dXJuY3JlZGVudGlhbHMgb3Igc2ltaWxhciBpbnN0YWxsZWQ/Jyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIC8vIGltcGxlbWVudCBwdXNoP1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBQb3B1bGF0ZXMgdGhlIGxvZyBkYXRhXG4gICAgICAgICAqL1xuICAgICAgICBwb3B1bGF0ZURhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgICAgICBPYmplY3Qua2V5cyh0aGlzLnNlc3Npb25zKS5mb3JFYWNoKGZ1bmN0aW9uIChzaWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbnNbc2lkXTtcbiAgICAgICAgICAgICAgICBpZiAoc2Vzc2lvbi5wZWVyY29ubmVjdGlvbiAmJiBzZXNzaW9uLnBlZXJjb25uZWN0aW9uLnVwZGF0ZUxvZykge1xuICAgICAgICAgICAgICAgICAgICAvLyBGSVhNRTogc2hvdWxkIHByb2JhYmx5IGJlIGEgLmR1bXAgY2FsbFxuICAgICAgICAgICAgICAgICAgICBkYXRhW1wiamluZ2xlX1wiICsgc2Vzc2lvbi5zaWRdID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdXBkYXRlTG9nOiBzZXNzaW9uLnBlZXJjb25uZWN0aW9uLnVwZGF0ZUxvZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRzOiBzZXNzaW9uLnBlZXJjb25uZWN0aW9uLnN0YXRzLFxuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZlxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cbiAgICB9KTtcbn07XG5cbiIsIi8qIGdsb2JhbCBTdHJvcGhlICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIFN0cm9waGUuYWRkQ29ubmVjdGlvblBsdWdpbignbG9nZ2VyJywge1xuICAgICAgICAvLyBsb2dzIHJhdyBzdGFuemFzIGFuZCBtYWtlcyB0aGVtIGF2YWlsYWJsZSBmb3IgZG93bmxvYWQgYXMgSlNPTlxuICAgICAgICBjb25uZWN0aW9uOiBudWxsLFxuICAgICAgICBsb2c6IFtdLFxuICAgICAgICBpbml0OiBmdW5jdGlvbiAoY29ubikge1xuICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uID0gY29ubjtcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5yYXdJbnB1dCA9IHRoaXMubG9nX2luY29taW5nLmJpbmQodGhpcyk7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24ucmF3T3V0cHV0ID0gdGhpcy5sb2dfb3V0Z29pbmcuYmluZCh0aGlzKTtcbiAgICAgICAgfSxcbiAgICAgICAgbG9nX2luY29taW5nOiBmdW5jdGlvbiAoc3RhbnphKSB7XG4gICAgICAgICAgICB0aGlzLmxvZy5wdXNoKFtuZXcgRGF0ZSgpLmdldFRpbWUoKSwgJ2luY29taW5nJywgc3RhbnphXSk7XG4gICAgICAgIH0sXG4gICAgICAgIGxvZ19vdXRnb2luZzogZnVuY3Rpb24gKHN0YW56YSkge1xuICAgICAgICAgICAgdGhpcy5sb2cucHVzaChbbmV3IERhdGUoKS5nZXRUaW1lKCksICdvdXRnb2luZycsIHN0YW56YV0pO1xuICAgICAgICB9XG4gICAgfSk7XG59OyIsIi8qIGdsb2JhbCAkLCAkaXEsIGNvbmZpZywgY29ubmVjdGlvbiwgZm9jdXNNdWNKaWQsIGZvcmNlTXV0ZWQsXG4gICBzZXRBdWRpb011dGVkLCBTdHJvcGhlICovXG4vKipcbiAqIE1vZGVyYXRlIGNvbm5lY3Rpb24gcGx1Z2luLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChYTVBQKSB7XG4gICAgU3Ryb3BoZS5hZGRDb25uZWN0aW9uUGx1Z2luKCdtb2RlcmF0ZScsIHtcbiAgICAgICAgY29ubmVjdGlvbjogbnVsbCxcbiAgICAgICAgaW5pdDogZnVuY3Rpb24gKGNvbm4pIHtcbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbiA9IGNvbm47XG5cbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5hZGRIYW5kbGVyKHRoaXMub25NdXRlLmJpbmQodGhpcyksXG4gICAgICAgICAgICAgICAgJ2h0dHA6Ly9qaXRzaS5vcmcvaml0bWVldC9hdWRpbycsXG4gICAgICAgICAgICAgICAgJ2lxJyxcbiAgICAgICAgICAgICAgICAnc2V0JyxcbiAgICAgICAgICAgICAgICBudWxsLFxuICAgICAgICAgICAgICAgIG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICBzZXRNdXRlOiBmdW5jdGlvbiAoamlkLCBtdXRlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJzZXQgbXV0ZVwiLCBtdXRlKTtcbiAgICAgICAgICAgIHZhciBpcVRvRm9jdXMgPSAkaXEoe3RvOiBmb2N1c011Y0ppZCwgdHlwZTogJ3NldCd9KVxuICAgICAgICAgICAgICAgIC5jKCdtdXRlJywge1xuICAgICAgICAgICAgICAgICAgICB4bWxuczogJ2h0dHA6Ly9qaXRzaS5vcmcvaml0bWVldC9hdWRpbycsXG4gICAgICAgICAgICAgICAgICAgIGppZDogamlkXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudChtdXRlLnRvU3RyaW5nKCkpXG4gICAgICAgICAgICAgICAgLnVwKCk7XG5cbiAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kSVEoXG4gICAgICAgICAgICAgICAgaXFUb0ZvY3VzLFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3NldCBtdXRlJywgcmVzdWx0KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnc2V0IG11dGUgZXJyb3InLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uTXV0ZTogZnVuY3Rpb24gKGlxKSB7XG4gICAgICAgICAgICB2YXIgZnJvbSA9IGlxLmdldEF0dHJpYnV0ZSgnZnJvbScpO1xuICAgICAgICAgICAgaWYgKGZyb20gIT09IGZvY3VzTXVjSmlkKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiSWdub3JlZCBtdXRlIGZyb20gbm9uIGZvY3VzIHBlZXJcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG11dGUgPSAkKGlxKS5maW5kKCdtdXRlJyk7XG4gICAgICAgICAgICBpZiAobXV0ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZG9NdXRlQXVkaW8gPSBtdXRlLnRleHQoKSA9PT0gXCJ0cnVlXCI7XG4gICAgICAgICAgICAgICAgVUkuc2V0QXVkaW9NdXRlZChkb011dGVBdWRpbyk7XG4gICAgICAgICAgICAgICAgWE1QUC5mb3JjZU11dGVkID0gZG9NdXRlQXVkaW87XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZWplY3Q6IGZ1bmN0aW9uIChqaWQpIHtcbiAgICAgICAgICAgIC8vIFdlJ3JlIG5vdCB0aGUgZm9jdXMsIHNvIGNhbid0IHRlcm1pbmF0ZVxuICAgICAgICAgICAgLy9jb25uZWN0aW9uLmppbmdsZS50ZXJtaW5hdGVSZW1vdGVCeUppZChqaWQsICdraWNrJyk7XG4gICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uZW11Yy5raWNrKGppZCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn0iLCIvKiBqc2hpbnQgLVcxMTcgKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gICAgU3Ryb3BoZS5hZGRDb25uZWN0aW9uUGx1Z2luKCdyYXlvJyxcbiAgICAgICAge1xuICAgICAgICAgICAgUkFZT19YTUxOUzogJ3Vybjp4bXBwOnJheW86MScsXG4gICAgICAgICAgICBjb25uZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgaW5pdDogZnVuY3Rpb24gKGNvbm4pIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24gPSBjb25uO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbm5lY3Rpb24uZGlzY28pIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25uZWN0aW9uLmRpc2NvLmFkZEZlYXR1cmUoJ3Vybjp4bXBwOnJheW86Y2xpZW50OjEnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uYWRkSGFuZGxlcihcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJheW8uYmluZCh0aGlzKSwgdGhpcy5SQVlPX1hNTE5TLCAnaXEnLCAnc2V0JywgbnVsbCwgbnVsbCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgb25SYXlvOiBmdW5jdGlvbiAoaXEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oXCJSYXlvIElRXCIsIGlxKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkaWFsOiBmdW5jdGlvbiAodG8sIGZyb20sIHJvb21OYW1lLCByb29tUGFzcykge1xuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgcmVxID0gJGlxKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvOiBmb2N1c011Y0ppZFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICByZXEuYygnZGlhbCcsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbG5zOiB0aGlzLlJBWU9fWE1MTlMsXG4gICAgICAgICAgICAgICAgICAgICAgICB0bzogdG8sXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tOiBmcm9tXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHJlcS5jKCdoZWFkZXInLFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnSnZiUm9vbU5hbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHJvb21OYW1lXG4gICAgICAgICAgICAgICAgICAgIH0pLnVwKCk7XG5cbiAgICAgICAgICAgICAgICBpZiAocm9vbVBhc3MgIT09IG51bGwgJiYgcm9vbVBhc3MubGVuZ3RoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVxLmMoJ2hlYWRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJ0p2YlJvb21QYXNzd29yZCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHJvb21QYXNzXG4gICAgICAgICAgICAgICAgICAgICAgICB9KS51cCgpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMuY29ubmVjdGlvbi5zZW5kSVEoXG4gICAgICAgICAgICAgICAgICAgIHJlcSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHJlc3VsdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKCdEaWFsIHJlc3VsdCAnLCByZXN1bHQpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzb3VyY2UgPSAkKHJlc3VsdCkuZmluZCgncmVmJykuYXR0cigndXJpJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNhbGxfcmVzb3VyY2UgPSByZXNvdXJjZS5zdWJzdHIoJ3htcHA6Jy5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5pbmZvKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlJlY2VpdmVkIGNhbGwgcmVzb3VyY2U6IFwiICsgdGhpcy5jYWxsX3Jlc291cmNlKTtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ0RpYWwgZXJyb3IgJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoYW5nX3VwOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLmNhbGxfcmVzb3VyY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiTm8gY2FsbCBpbiBwcm9ncmVzc1wiKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgICAgICAgICB2YXIgcmVxID0gJGlxKFxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnc2V0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvOiB0aGlzLmNhbGxfcmVzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgcmVxLmMoJ2hhbmd1cCcsXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHhtbG5zOiB0aGlzLlJBWU9fWE1MTlNcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNvbm5lY3Rpb24uc2VuZElRKFxuICAgICAgICAgICAgICAgICAgICByZXEsXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuaW5mbygnSGFuZ3VwIHJlc3VsdCAnLCByZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jYWxsX3Jlc291cmNlID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oJ0hhbmd1cCBlcnJvciAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNhbGxfcmVzb3VyY2UgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICk7XG59O1xuIiwiLyoqXG4gKiBTdHJvcGhlIGxvZ2dlciBpbXBsZW1lbnRhdGlvbi4gTG9ncyBmcm9tIGxldmVsIFdBUk4gYW5kIGFib3ZlLlxuICovXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uICgpIHtcblxuICAgIFN0cm9waGUubG9nID0gZnVuY3Rpb24gKGxldmVsLCBtc2cpIHtcbiAgICAgICAgc3dpdGNoIChsZXZlbCkge1xuICAgICAgICAgICAgY2FzZSBTdHJvcGhlLkxvZ0xldmVsLldBUk46XG4gICAgICAgICAgICAgICAgY29uc29sZS53YXJuKFwiU3Ryb3BoZTogXCIgKyBtc2cpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBTdHJvcGhlLkxvZ0xldmVsLkVSUk9SOlxuICAgICAgICAgICAgY2FzZSBTdHJvcGhlLkxvZ0xldmVsLkZBVEFMOlxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTdHJvcGhlOiBcIiArIG1zZyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgU3Ryb3BoZS5nZXRTdGF0dXNTdHJpbmcgPSBmdW5jdGlvbiAoc3RhdHVzKSB7XG4gICAgICAgIHN3aXRjaCAoc3RhdHVzKSB7XG4gICAgICAgICAgICBjYXNlIFN0cm9waGUuU3RhdHVzLkVSUk9SOlxuICAgICAgICAgICAgICAgIHJldHVybiBcIkVSUk9SXCI7XG4gICAgICAgICAgICBjYXNlIFN0cm9waGUuU3RhdHVzLkNPTk5FQ1RJTkc6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiQ09OTkVDVElOR1wiO1xuICAgICAgICAgICAgY2FzZSBTdHJvcGhlLlN0YXR1cy5DT05ORkFJTDpcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJDT05ORkFJTFwiO1xuICAgICAgICAgICAgY2FzZSBTdHJvcGhlLlN0YXR1cy5BVVRIRU5USUNBVElORzpcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJBVVRIRU5USUNBVElOR1wiO1xuICAgICAgICAgICAgY2FzZSBTdHJvcGhlLlN0YXR1cy5BVVRIRkFJTDpcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJBVVRIRkFJTFwiO1xuICAgICAgICAgICAgY2FzZSBTdHJvcGhlLlN0YXR1cy5DT05ORUNURUQ6XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiQ09OTkVDVEVEXCI7XG4gICAgICAgICAgICBjYXNlIFN0cm9waGUuU3RhdHVzLkRJU0NPTk5FQ1RFRDpcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJESVNDT05ORUNURURcIjtcbiAgICAgICAgICAgIGNhc2UgU3Ryb3BoZS5TdGF0dXMuRElTQ09OTkVDVElORzpcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJESVNDT05ORUNUSU5HXCI7XG4gICAgICAgICAgICBjYXNlIFN0cm9waGUuU3RhdHVzLkFUVEFDSEVEOlxuICAgICAgICAgICAgICAgIHJldHVybiBcIkFUVEFDSEVEXCI7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJldHVybiBcInVua25vd25cIjtcbiAgICAgICAgfVxuICAgIH07XG59O1xuIiwidmFyIE1vZGVyYXRvciA9IHJlcXVpcmUoXCIuL21vZGVyYXRvclwiKTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKFwiZXZlbnRzXCIpO1xudmFyIFJlY29yZGluZyA9IHJlcXVpcmUoXCIuL3JlY29yZGluZ1wiKTtcbnZhciBTRFAgPSByZXF1aXJlKFwiLi9TRFBcIik7XG5cbnZhciBldmVudEVtaXR0ZXIgPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG52YXIgY29ubmVjdGlvbiA9IG51bGw7XG52YXIgYXV0aGVudGljYXRlZFVzZXIgPSBmYWxzZTtcbnZhciBhY3RpdmVjYWxsID0gbnVsbDtcblxuZnVuY3Rpb24gY29ubmVjdChqaWQsIHBhc3N3b3JkLCB1aUNyZWRlbnRpYWxzKSB7XG4gICAgdmFyIGJvc2hcbiAgICAgICAgPSB1aUNyZWRlbnRpYWxzLmJvc2ggfHwgY29uZmlnLmJvc2ggfHwgJy9odHRwLWJpbmQnO1xuICAgIGNvbm5lY3Rpb24gPSBuZXcgU3Ryb3BoZS5Db25uZWN0aW9uKGJvc2gpO1xuICAgIE1vZGVyYXRvci5zZXRDb25uZWN0aW9uKGNvbm5lY3Rpb24pO1xuXG4gICAgdmFyIHNldHRpbmdzID0gVUkuZ2V0U2V0dGluZ3MoKTtcbiAgICB2YXIgZW1haWwgPSBzZXR0aW5ncy5lbWFpbDtcbiAgICB2YXIgZGlzcGxheU5hbWUgPSBzZXR0aW5ncy5kaXNwbGF5TmFtZTtcbiAgICBpZihlbWFpbCkge1xuICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkRW1haWxUb1ByZXNlbmNlKGVtYWlsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkVXNlcklkVG9QcmVzZW5jZShzZXR0aW5ncy51aWQpO1xuICAgIH1cbiAgICBpZihkaXNwbGF5TmFtZSkge1xuICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkRGlzcGxheU5hbWVUb1ByZXNlbmNlKGRpc3BsYXlOYW1lKTtcbiAgICB9XG5cbiAgICBpZiAoY29ubmVjdGlvbi5kaXNjbykge1xuICAgICAgICAvLyBmb3IgY2hyb21lLCBhZGQgbXVsdGlzdHJlYW0gY2FwXG4gICAgfVxuICAgIGNvbm5lY3Rpb24uamluZ2xlLnBjX2NvbnN0cmFpbnRzID0gUlRDLmdldFBDQ29uc3RyYWludHMoKTtcbiAgICBpZiAoY29uZmlnLnVzZUlQdjYpIHtcbiAgICAgICAgLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC93ZWJydGMvaXNzdWVzL2RldGFpbD9pZD0yODI4XG4gICAgICAgIGlmICghY29ubmVjdGlvbi5qaW5nbGUucGNfY29uc3RyYWludHMub3B0aW9uYWwpXG4gICAgICAgICAgICBjb25uZWN0aW9uLmppbmdsZS5wY19jb25zdHJhaW50cy5vcHRpb25hbCA9IFtdO1xuICAgICAgICBjb25uZWN0aW9uLmppbmdsZS5wY19jb25zdHJhaW50cy5vcHRpb25hbC5wdXNoKHtnb29nSVB2NjogdHJ1ZX0pO1xuICAgIH1cblxuICAgIGlmKCFwYXNzd29yZClcbiAgICAgICAgcGFzc3dvcmQgPSB1aUNyZWRlbnRpYWxzLnBhc3N3b3JkO1xuXG4gICAgdmFyIGFub255bW91c0Nvbm5lY3Rpb25GYWlsZWQgPSBmYWxzZTtcbiAgICBjb25uZWN0aW9uLmNvbm5lY3QoamlkLCBwYXNzd29yZCwgZnVuY3Rpb24gKHN0YXR1cywgbXNnKSB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdTdHJvcGhlIHN0YXR1cyBjaGFuZ2VkIHRvJyxcbiAgICAgICAgICAgIFN0cm9waGUuZ2V0U3RhdHVzU3RyaW5nKHN0YXR1cykpO1xuICAgICAgICBpZiAoc3RhdHVzID09PSBTdHJvcGhlLlN0YXR1cy5DT05ORUNURUQpIHtcbiAgICAgICAgICAgIGlmIChjb25maWcudXNlU3R1blR1cm4pIHtcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmppbmdsZS5nZXRTdHVuQW5kVHVybkNyZWRlbnRpYWxzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBVSS5kaXNhYmxlQ29ubmVjdCgpO1xuXG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJNeSBKYWJiZXIgSUQ6IFwiICsgY29ubmVjdGlvbi5qaWQpO1xuXG4gICAgICAgICAgICBpZihwYXNzd29yZClcbiAgICAgICAgICAgICAgICBhdXRoZW50aWNhdGVkVXNlciA9IHRydWU7XG4gICAgICAgICAgICBtYXliZURvSm9pbigpO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXR1cyA9PT0gU3Ryb3BoZS5TdGF0dXMuQ09OTkZBSUwpIHtcbiAgICAgICAgICAgIGlmKG1zZyA9PT0gJ3gtc3Ryb3BoZS1iYWQtbm9uLWFub24tamlkJykge1xuICAgICAgICAgICAgICAgIGFub255bW91c0Nvbm5lY3Rpb25GYWlsZWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKHN0YXR1cyA9PT0gU3Ryb3BoZS5TdGF0dXMuRElTQ09OTkVDVEVEKSB7XG4gICAgICAgICAgICBpZihhbm9ueW1vdXNDb25uZWN0aW9uRmFpbGVkKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvbXB0IHVzZXIgZm9yIHVzZXJuYW1lIGFuZCBwYXNzd29yZFxuICAgICAgICAgICAgICAgIFhNUFAucHJvbXB0TG9naW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmIChzdGF0dXMgPT09IFN0cm9waGUuU3RhdHVzLkFVVEhGQUlMKSB7XG4gICAgICAgICAgICAvLyB3cm9uZyBwYXNzd29yZCBvciB1c2VybmFtZSwgcHJvbXB0IHVzZXJcbiAgICAgICAgICAgIFhNUFAucHJvbXB0TG9naW4oKTtcblxuICAgICAgICB9XG4gICAgfSk7XG59XG5cblxuXG5mdW5jdGlvbiBtYXliZURvSm9pbigpIHtcbiAgICBpZiAoY29ubmVjdGlvbiAmJiBjb25uZWN0aW9uLmNvbm5lY3RlZCAmJlxuICAgICAgICBTdHJvcGhlLmdldFJlc291cmNlRnJvbUppZChjb25uZWN0aW9uLmppZClcbiAgICAgICAgJiYgKFJUQy5sb2NhbEF1ZGlvIHx8IFJUQy5sb2NhbFZpZGVvKSkge1xuICAgICAgICAvLyAuY29ubmVjdGVkIGlzIHRydWUgd2hpbGUgY29ubmVjdGluZz9cbiAgICAgICAgZG9Kb2luKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkb0pvaW4oKSB7XG4gICAgdmFyIHJvb21OYW1lID0gVUkuZ2VuZXJhdGVSb29tTmFtZSgpO1xuXG4gICAgTW9kZXJhdG9yLmFsbG9jYXRlQ29uZmVyZW5jZUZvY3VzKFxuICAgICAgICByb29tTmFtZSwgVUkuY2hlY2tGb3JOaWNrbmFtZUFuZEpvaW4pO1xufVxuXG5mdW5jdGlvbiBpbml0U3Ryb3BoZVBsdWdpbnMoKVxue1xuICAgIHJlcXVpcmUoXCIuL3N0cm9waGUuZW11Y1wiKShYTVBQLCBldmVudEVtaXR0ZXIpO1xuICAgIHJlcXVpcmUoXCIuL3N0cm9waGUuamluZ2xlXCIpKCk7XG4gICAgcmVxdWlyZShcIi4vc3Ryb3BoZS5tb2RlcmF0ZVwiKShYTVBQKTtcbiAgICByZXF1aXJlKFwiLi9zdHJvcGhlLnV0aWxcIikoKTtcbiAgICByZXF1aXJlKFwiLi9zdHJvcGhlLnJheW9cIikoKTtcbiAgICByZXF1aXJlKFwiLi9zdHJvcGhlLmxvZ2dlclwiKSgpO1xufVxuXG5mdW5jdGlvbiByZWdpc3Rlckxpc3RlbmVycygpIHtcbiAgICBSVEMuYWRkU3RyZWFtTGlzdGVuZXIobWF5YmVEb0pvaW4sXG4gICAgICAgIFN0cmVhbUV2ZW50VHlwZXMuRVZFTlRfVFlQRV9MT0NBTF9DUkVBVEVEKTtcbn1cblxuZnVuY3Rpb24gc2V0dXBFdmVudHMoKSB7XG4gICAgJCh3aW5kb3cpLmJpbmQoJ2JlZm9yZXVubG9hZCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGNvbm5lY3Rpb24gJiYgY29ubmVjdGlvbi5jb25uZWN0ZWQpIHtcbiAgICAgICAgICAgIC8vIGVuc3VyZSBzaWdub3V0XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IGNvbmZpZy5ib3NoLFxuICAgICAgICAgICAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgY29udGVudFR5cGU6ICdhcHBsaWNhdGlvbi94bWwnLFxuICAgICAgICAgICAgICAgIGRhdGE6IFwiPGJvZHkgcmlkPSdcIiArIChjb25uZWN0aW9uLnJpZCB8fCBjb25uZWN0aW9uLl9wcm90by5yaWQpXG4gICAgICAgICAgICAgICAgICAgICsgXCInIHhtbG5zPSdodHRwOi8vamFiYmVyLm9yZy9wcm90b2NvbC9odHRwYmluZCcgc2lkPSdcIlxuICAgICAgICAgICAgICAgICAgICArIChjb25uZWN0aW9uLnNpZCB8fCBjb25uZWN0aW9uLl9wcm90by5zaWQpXG4gICAgICAgICAgICAgICAgICAgICsgXCInIHR5cGU9J3Rlcm1pbmF0ZSc+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIjxwcmVzZW5jZSB4bWxucz0namFiYmVyOmNsaWVudCcgdHlwZT0ndW5hdmFpbGFibGUnLz5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiPC9ib2R5PlwiLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdzaWduZWQgb3V0Jyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChYTUxIdHRwUmVxdWVzdCwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ3NpZ25vdXQgZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRleHRTdGF0dXMgKyAnICgnICsgZXJyb3JUaHJvd24gKyAnKScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIFhNUFAuZGlzcG9zZUNvbmZlcmVuY2UodHJ1ZSk7XG4gICAgfSk7XG59XG5cbnZhciBYTVBQID0ge1xuICAgIHNlc3Npb25UZXJtaW5hdGVkOiBmYWxzZSxcbiAgICAvKipcbiAgICAgKiBSZW1lbWJlcnMgaWYgd2Ugd2VyZSBtdXRlZCBieSB0aGUgZm9jdXMuXG4gICAgICogQHR5cGUge2Jvb2xlYW59XG4gICAgICovXG4gICAgZm9yY2VNdXRlZDogZmFsc2UsXG4gICAgc3RhcnQ6IGZ1bmN0aW9uICh1aUNyZWRlbnRpYWxzKSB7XG4gICAgICAgIHNldHVwRXZlbnRzKCk7XG4gICAgICAgIGluaXRTdHJvcGhlUGx1Z2lucygpO1xuICAgICAgICByZWdpc3Rlckxpc3RlbmVycygpO1xuICAgICAgICBNb2RlcmF0b3IuaW5pdCgpO1xuICAgICAgICB2YXIgamlkID0gdWlDcmVkZW50aWFscy5qaWQgfHxcbiAgICAgICAgICAgIGNvbmZpZy5ob3N0cy5hbm9ueW1vdXNkb21haW4gfHxcbiAgICAgICAgICAgIGNvbmZpZy5ob3N0cy5kb21haW4gfHxcbiAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZTtcbiAgICAgICAgY29ubmVjdChqaWQsIG51bGwsIHVpQ3JlZGVudGlhbHMpO1xuICAgIH0sXG4gICAgcHJvbXB0TG9naW46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgVUkuc2hvd0xvZ2luUG9wdXAoY29ubmVjdCk7XG4gICAgfSxcbiAgICBqb2luUm9vb206IGZ1bmN0aW9uKHJvb21OYW1lLCB1c2VOaWNrcywgbmljaylcbiAgICB7XG4gICAgICAgIHZhciByb29tamlkO1xuICAgICAgICByb29tamlkID0gcm9vbU5hbWU7XG5cbiAgICAgICAgaWYgKHVzZU5pY2tzKSB7XG4gICAgICAgICAgICBpZiAobmljaykge1xuICAgICAgICAgICAgICAgIHJvb21qaWQgKz0gJy8nICsgbmljaztcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcm9vbWppZCArPSAnLycgKyBTdHJvcGhlLmdldE5vZGVGcm9tSmlkKGNvbm5lY3Rpb24uamlkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcblxuICAgICAgICAgICAgdmFyIHRtcEppZCA9IFN0cm9waGUuZ2V0Tm9kZUZyb21KaWQoY29ubmVjdGlvbi5qaWQpO1xuXG4gICAgICAgICAgICBpZighYXV0aGVudGljYXRlZFVzZXIpXG4gICAgICAgICAgICAgICAgdG1wSmlkID0gdG1wSmlkLnN1YnN0cigwLCA4KTtcblxuICAgICAgICAgICAgcm9vbWppZCArPSAnLycgKyB0bXBKaWQ7XG4gICAgICAgIH1cbiAgICAgICAgY29ubmVjdGlvbi5lbXVjLmRvSm9pbihyb29tamlkKTtcbiAgICB9LFxuICAgIG15SmlkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKCFjb25uZWN0aW9uKVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIHJldHVybiBjb25uZWN0aW9uLmVtdWMubXlyb29tamlkO1xuICAgIH0sXG4gICAgbXlSZXNvdXJjZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZighY29ubmVjdGlvbiB8fCAhIGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgcmV0dXJuIFN0cm9waGUuZ2V0UmVzb3VyY2VGcm9tSmlkKGNvbm5lY3Rpb24uZW11Yy5teXJvb21qaWQpO1xuICAgIH0sXG4gICAgZGlzcG9zZUNvbmZlcmVuY2U6IGZ1bmN0aW9uIChvblVubG9hZCkge1xuICAgICAgICBldmVudEVtaXR0ZXIuZW1pdChYTVBQRXZlbnRzLkRJU1BPU0VfQ09ORkVSRU5DRSwgb25VbmxvYWQpO1xuICAgICAgICB2YXIgaGFuZGxlciA9IGFjdGl2ZWNhbGw7XG4gICAgICAgIGlmIChoYW5kbGVyICYmIGhhbmRsZXIucGVlcmNvbm5lY3Rpb24pIHtcbiAgICAgICAgICAgIC8vIEZJWE1FOiBwcm9iYWJseSByZW1vdmluZyBzdHJlYW1zIGlzIG5vdCByZXF1aXJlZCBhbmQgY2xvc2UoKSBzaG91bGRcbiAgICAgICAgICAgIC8vIGJlIGVub3VnaFxuICAgICAgICAgICAgaWYgKFJUQy5sb2NhbEF1ZGlvKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5wZWVyY29ubmVjdGlvbi5yZW1vdmVTdHJlYW0oUlRDLmxvY2FsQXVkaW8uZ2V0T3JpZ2luYWxTdHJlYW0oKSwgb25VbmxvYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKFJUQy5sb2NhbFZpZGVvKSB7XG4gICAgICAgICAgICAgICAgaGFuZGxlci5wZWVyY29ubmVjdGlvbi5yZW1vdmVTdHJlYW0oUlRDLmxvY2FsVmlkZW8uZ2V0T3JpZ2luYWxTdHJlYW0oKSwgb25VbmxvYWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaGFuZGxlci5wZWVyY29ubmVjdGlvbi5jbG9zZSgpO1xuICAgICAgICB9XG4gICAgICAgIGFjdGl2ZWNhbGwgPSBudWxsO1xuICAgICAgICBpZighb25VbmxvYWQpXG4gICAgICAgIHtcbiAgICAgICAgICAgIHRoaXMuc2Vzc2lvblRlcm1pbmF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgY29ubmVjdGlvbi5lbXVjLmRvTGVhdmUoKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgYWRkTGlzdGVuZXI6IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKVxuICAgIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLm9uKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9LFxuICAgIHJlbW92ZUxpc3RlbmVyOiBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcbiAgICAgICAgZXZlbnRFbWl0dGVyLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyKTtcbiAgICB9LFxuICAgIGFsbG9jYXRlQ29uZmVyZW5jZUZvY3VzOiBmdW5jdGlvbihyb29tTmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgTW9kZXJhdG9yLmFsbG9jYXRlQ29uZmVyZW5jZUZvY3VzKHJvb21OYW1lLCBjYWxsYmFjayk7XG4gICAgfSxcbiAgICBpc01vZGVyYXRvcjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gTW9kZXJhdG9yLmlzTW9kZXJhdG9yKCk7XG4gICAgfSxcbiAgICBpc1NpcEdhdGV3YXlFbmFibGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBNb2RlcmF0b3IuaXNTaXBHYXRld2F5RW5hYmxlZCgpO1xuICAgIH0sXG4gICAgaXNFeHRlcm5hbEF1dGhFbmFibGVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBNb2RlcmF0b3IuaXNFeHRlcm5hbEF1dGhFbmFibGVkKCk7XG4gICAgfSxcbiAgICBzd2l0Y2hTdHJlYW1zOiBmdW5jdGlvbiAoc3RyZWFtLCBvbGRTdHJlYW0sIGNhbGxiYWNrKSB7XG4gICAgICAgIGlmIChhY3RpdmVjYWxsKSB7XG4gICAgICAgICAgICAvLyBGSVhNRTogd2lsbCBibG9jayBzd2l0Y2hJblByb2dyZXNzIG9uIHRydWUgdmFsdWUgaW4gY2FzZSBvZiBleGNlcHRpb25cbiAgICAgICAgICAgIGFjdGl2ZWNhbGwuc3dpdGNoU3RyZWFtcyhzdHJlYW0sIG9sZFN0cmVhbSwgY2FsbGJhY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gV2UgYXJlIGRvbmUgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJObyBjb25mZXJlbmNlIGhhbmRsZXJcIik7XG4gICAgICAgICAgICBVSS5tZXNzYWdlSGFuZGxlci5zaG93RXJyb3IoJ0Vycm9yJyxcbiAgICAgICAgICAgICAgICAnVW5hYmxlIHRvIHN3aXRjaCB2aWRlbyBzdHJlYW0uJyk7XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzZXRWaWRlb011dGU6IGZ1bmN0aW9uIChtdXRlLCBjYWxsYmFjaywgb3B0aW9ucykge1xuICAgICAgIGlmKGFjdGl2ZWNhbGwgJiYgY29ubmVjdGlvbiAmJiBSVEMubG9jYWxWaWRlbylcbiAgICAgICB7XG4gICAgICAgICAgIGFjdGl2ZWNhbGwuc2V0VmlkZW9NdXRlKG11dGUsIGNhbGxiYWNrLCBvcHRpb25zKTtcbiAgICAgICB9XG4gICAgfSxcbiAgICBzZXRBdWRpb011dGU6IGZ1bmN0aW9uIChtdXRlLCBjYWxsYmFjaykge1xuICAgICAgICBpZiAoIShjb25uZWN0aW9uICYmIFJUQy5sb2NhbEF1ZGlvKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cblxuICAgICAgICBpZiAodGhpcy5mb3JjZU11dGVkICYmICFtdXRlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmluZm8oXCJBc2tpbmcgZm9jdXMgZm9yIHVubXV0ZVwiKTtcbiAgICAgICAgICAgIGNvbm5lY3Rpb24ubW9kZXJhdGUuc2V0TXV0ZShjb25uZWN0aW9uLmVtdWMubXlyb29tamlkLCBtdXRlKTtcbiAgICAgICAgICAgIC8vIEZJWE1FOiB3YWl0IGZvciByZXN1bHQgYmVmb3JlIHJlc2V0dGluZyBtdXRlZCBzdGF0dXNcbiAgICAgICAgICAgIHRoaXMuZm9yY2VNdXRlZCA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKG11dGUgPT0gUlRDLmxvY2FsQXVkaW8uaXNNdXRlZCgpKSB7XG4gICAgICAgICAgICAvLyBOb3RoaW5nIHRvIGRvXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0IGlzIG5vdCBjbGVhciB3aGF0IGlzIHRoZSByaWdodCB3YXkgdG8gaGFuZGxlIG11bHRpcGxlIHRyYWNrcy5cbiAgICAgICAgLy8gU28gYXQgbGVhc3QgbWFrZSBzdXJlIHRoYXQgdGhleSBhcmUgYWxsIG11dGVkIG9yIGFsbCB1bm11dGVkIGFuZFxuICAgICAgICAvLyB0aGF0IHdlIHNlbmQgcHJlc2VuY2UganVzdCBvbmNlLlxuICAgICAgICBSVEMubG9jYWxBdWRpby5tdXRlKCk7XG4gICAgICAgIC8vIGlzTXV0ZWQgaXMgdGhlIG9wcG9zaXRlIG9mIGF1ZGlvRW5hYmxlZFxuICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkQXVkaW9JbmZvVG9QcmVzZW5jZShtdXRlKTtcbiAgICAgICAgY29ubmVjdGlvbi5lbXVjLnNlbmRQcmVzZW5jZSgpO1xuICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9LFxuICAgIC8vIFJlYWxseSBtdXRlIHZpZGVvLCBpLmUuIGRvbnQgZXZlbiBzZW5kIGJsYWNrIGZyYW1lc1xuICAgIG11dGVWaWRlbzogZnVuY3Rpb24gKHBjLCB1bm11dGUpIHtcbiAgICAgICAgLy8gRklYTUU6IHRoaXMgcHJvYmFibHkgbmVlZHMgYW5vdGhlciBvZiB0aG9zZSBsb3ZlbHkgc3RhdGUgc2FmZWd1YXJkcy4uLlxuICAgICAgICAvLyB3aGljaCBjaGVja3MgZm9yIGljZWNvbm4gPT0gY29ubmVjdGVkIGFuZCBzaWdzdGF0ZSA9PSBzdGFibGVcbiAgICAgICAgcGMuc2V0UmVtb3RlRGVzY3JpcHRpb24ocGMucmVtb3RlRGVzY3JpcHRpb24sXG4gICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcGMuY3JlYXRlQW5zd2VyKFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc2RwID0gbmV3IFNEUChhbnN3ZXIuc2RwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzZHAubWVkaWEubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1bm11dGUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNkcC5tZWRpYVsxXSA9IHNkcC5tZWRpYVsxXS5yZXBsYWNlKCdhPXJlY3Zvbmx5JywgJ2E9c2VuZHJlY3YnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNkcC5tZWRpYVsxXSA9IHNkcC5tZWRpYVsxXS5yZXBsYWNlKCdhPXNlbmRyZWN2JywgJ2E9cmVjdm9ubHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZHAucmF3ID0gc2RwLnNlc3Npb24gKyBzZHAubWVkaWEuam9pbignJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW5zd2VyLnNkcCA9IHNkcC5yYXc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBwYy5zZXRMb2NhbERlc2NyaXB0aW9uKGFuc3dlcixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdtdXRlIFNMRCBvaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdtdXRlIFNMRCBlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBVSS5tZXNzYWdlSGFuZGxlci5zaG93RXJyb3IoJ0Vycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnT29wcyEgU29tZXRoaW5nIHdlbnQgd3JvbmcgYW5kIHdlIGZhaWxlZCB0byAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnbXV0ZSEgKFNMRCBGYWlsdXJlKScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICAgICAgVUkubWVzc2FnZUhhbmRsZXIuc2hvd0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdtdXRlVmlkZW8gU1JEIGVycm9yJyk7XG4gICAgICAgICAgICAgICAgVUkubWVzc2FnZUhhbmRsZXIuc2hvd0Vycm9yKCdFcnJvcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnT29wcyEgU29tZXRoaW5nIHdlbnQgd3JvbmcgYW5kIHdlIGZhaWxlZCB0byBzdG9wIHZpZGVvIScgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJyhTUkQgRmFpbHVyZSknKTtcblxuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgIH0sXG4gICAgdG9nZ2xlUmVjb3JkaW5nOiBmdW5jdGlvbiAodG9rZW5FbXB0eUNhbGxiYWNrLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0aW5nQ2FsbGJhY2ssIHN0YXJ0ZWRDYWxsYmFjaykge1xuICAgICAgICBSZWNvcmRpbmcudG9nZ2xlUmVjb3JkaW5nKHRva2VuRW1wdHlDYWxsYmFjayxcbiAgICAgICAgICAgIHN0YXJ0aW5nQ2FsbGJhY2ssIHN0YXJ0ZWRDYWxsYmFjayk7XG4gICAgfSxcbiAgICBhZGRUb1ByZXNlbmNlOiBmdW5jdGlvbiAobmFtZSwgdmFsdWUsIGRvbnRTZW5kKSB7XG4gICAgICAgIHN3aXRjaCAobmFtZSlcbiAgICAgICAge1xuICAgICAgICAgICAgY2FzZSBcImRpc3BsYXlOYW1lXCI6XG4gICAgICAgICAgICAgICAgY29ubmVjdGlvbi5lbXVjLmFkZERpc3BsYXlOYW1lVG9QcmVzZW5jZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiZXRoZXJwYWRcIjpcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkRXRoZXJwYWRUb1ByZXNlbmNlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJwcmV6aVwiOlxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZW11Yy5hZGRQcmV6aVRvUHJlc2VuY2UodmFsdWUsIDApO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInByZXppU2xpZGVcIjpcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkQ3VycmVudFNsaWRlVG9QcmVzZW5jZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiY29ubmVjdGlvblF1YWxpdHlcIjpcbiAgICAgICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuYWRkQ29ubmVjdGlvbkluZm9Ub1ByZXNlbmNlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJlbWFpbFwiOlxuICAgICAgICAgICAgICAgIGNvbm5lY3Rpb24uZW11Yy5hZGRFbWFpbFRvUHJlc2VuY2UodmFsdWUpO1xuICAgICAgICAgICAgZGVmYXVsdCA6XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJVbmtub3duIHRhZyBmb3IgcHJlc2VuY2UuXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZighZG9udFNlbmQpXG4gICAgICAgICAgICBjb25uZWN0aW9uLmVtdWMuc2VuZFByZXNlbmNlKCk7XG4gICAgfSxcbiAgICBzZW5kTG9nczogZnVuY3Rpb24gKGNvbnRlbnQpIHtcbiAgICAgICAgLy8gWEVQLTAzMzctaXNoXG4gICAgICAgIHZhciBtZXNzYWdlID0gJG1zZyh7dG86IGZvY3VzTXVjSmlkLCB0eXBlOiAnbm9ybWFsJ30pO1xuICAgICAgICBtZXNzYWdlLmMoJ2xvZycsIHsgeG1sbnM6ICd1cm46eG1wcDpldmVudGxvZycsXG4gICAgICAgICAgICBpZDogJ1BlZXJDb25uZWN0aW9uU3RhdHMnfSk7XG4gICAgICAgIG1lc3NhZ2UuYygnbWVzc2FnZScpLnQoY29udGVudCkudXAoKTtcbiAgICAgICAgaWYgKGRlZmxhdGUpIHtcbiAgICAgICAgICAgIG1lc3NhZ2UuYygndGFnJywge25hbWU6IFwiZGVmbGF0ZWRcIiwgdmFsdWU6IFwidHJ1ZVwifSkudXAoKTtcbiAgICAgICAgfVxuICAgICAgICBtZXNzYWdlLnVwKCk7XG5cbiAgICAgICAgY29ubmVjdGlvbi5zZW5kKG1lc3NhZ2UpO1xuICAgIH0sXG4gICAgcG9wdWxhdGVEYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIGlmIChjb25uZWN0aW9uLmppbmdsZSkge1xuICAgICAgICAgICAgZGF0YSA9IGNvbm5lY3Rpb24uamluZ2xlLnBvcHVsYXRlRGF0YSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH0sXG4gICAgZ2V0TG9nZ2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKGNvbm5lY3Rpb24ubG9nZ2VyKVxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3Rpb24ubG9nZ2VyLmxvZztcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfSxcbiAgICBnZXRQcmV6aTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY29ubmVjdGlvbi5lbXVjLmdldFByZXppKHRoaXMubXlKaWQoKSk7XG4gICAgfSxcbiAgICByZW1vdmVQcmV6aUZyb21QcmVzZW5jZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25uZWN0aW9uLmVtdWMucmVtb3ZlUHJlemlGcm9tUHJlc2VuY2UoKTtcbiAgICAgICAgY29ubmVjdGlvbi5lbXVjLnNlbmRQcmVzZW5jZSgpO1xuICAgIH0sXG4gICAgc2VuZENoYXRNZXNzYWdlOiBmdW5jdGlvbiAobWVzc2FnZSwgbmlja25hbWUpIHtcbiAgICAgICAgY29ubmVjdGlvbi5lbXVjLnNlbmRNZXNzYWdlKG1lc3NhZ2UsIG5pY2tuYW1lKTtcbiAgICB9LFxuICAgIHNldFN1YmplY3Q6IGZ1bmN0aW9uICh0b3BpYykge1xuICAgICAgICBjb25uZWN0aW9uLmVtdWMuc2V0U3ViamVjdCh0b3BpYyk7XG4gICAgfSxcbiAgICBsb2NrUm9vbTogZnVuY3Rpb24gKGtleSwgb25TdWNjZXNzLCBvbkVycm9yLCBvbk5vdFN1cHBvcnRlZCkge1xuICAgICAgICBjb25uZWN0aW9uLmVtdWMubG9ja1Jvb20oa2V5LCBvblN1Y2Nlc3MsIG9uRXJyb3IsIG9uTm90U3VwcG9ydGVkKTtcbiAgICB9LFxuICAgIGRpYWw6IGZ1bmN0aW9uICh0bywgZnJvbSwgcm9vbU5hbWUscm9vbVBhc3MpIHtcbiAgICAgICAgY29ubmVjdGlvbi5yYXlvLmRpYWwodG8sIGZyb20sIHJvb21OYW1lLHJvb21QYXNzKTtcbiAgICB9LFxuICAgIHNldE11dGU6IGZ1bmN0aW9uIChqaWQsIG11dGUpIHtcbiAgICAgICAgY29ubmVjdGlvbi5tb2RlcmF0ZS5zZXRNdXRlKGppZCwgbXV0ZSk7XG4gICAgfSxcbiAgICBlamVjdDogZnVuY3Rpb24gKGppZCkge1xuICAgICAgICBjb25uZWN0aW9uLm1vZGVyYXRlLmVqZWN0KGppZCk7XG4gICAgfSxcbiAgICBmaW5kSmlkRnJvbVJlc291cmNlOiBmdW5jdGlvbiAocmVzb3VyY2UpIHtcbiAgICAgICAgY29ubmVjdGlvbi5lbXVjLmZpbmRKaWRGcm9tUmVzb3VyY2UocmVzb3VyY2UpO1xuICAgIH0sXG4gICAgZ2V0TWVtYmVyczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gY29ubmVjdGlvbi5lbXVjLm1lbWJlcnM7XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFhNUFA7IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICAgICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgYXJncyA9IG5ldyBBcnJheShsZW4gLSAxKTtcbiAgICBmb3IgKGkgPSAxOyBpIDwgbGVuOyBpKyspXG4gICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcblxuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIHZhciBtO1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbihlbWl0dGVyLCB0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghZW1pdHRlci5fZXZlbnRzIHx8ICFlbWl0dGVyLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gMDtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbihlbWl0dGVyLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IDE7XG4gIGVsc2VcbiAgICByZXQgPSBlbWl0dGVyLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuICByZXR1cm4gcmV0O1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIl19
