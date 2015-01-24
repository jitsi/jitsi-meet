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

//TODO: this array must be removed when firefox implement multistream support
JingleSession.notReceivedSSRCs = [];

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
    var ssrc2jid = this.connection.emuc.ssrc2jid;

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
        if((JingleSession.notReceivedSSRCs.length == 0) ||
            !ssrc2jid[JingleSession.notReceivedSSRCs[JingleSession.notReceivedSSRCs.length - 1]])
        {
            // TODO(gp) limit wait duration to 1 sec.
            setTimeout(function(d) {
                return function() {
                    self.remoteStreamAdded(d);
                }
            }(data), 250);
            return;
        }

        thessrc = JingleSession.notReceivedSSRCs.pop();
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
function createExpBackoffTimer(step) {
    var count = 1;
    return function (reset) {
        // Reset call
        if (reset) {
            count = 1;
            return;
        }
        // Calculate next timeout
        var timeout = Math.pow(2, count - 1);
        count += 1;
        return timeout * step;
    };
}

var getNextTimeout = createExpBackoffTimer(1000);
var getNextErrorTimeout = createExpBackoffTimer(1000);
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
        var self = this;
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
                    var toDomain
                        = Strophe.getDomainFromJid(error.getAttribute('to'));
                    if (toDomain === config.hosts.anonymousdomain) {
                        // we are connected with anonymous domain and
                        // only non anonymous users can create rooms
                        // we must authorize the user

                        self.xmppService.promptLogin();
                    } else {
                        // External authentication mode
                        UI.onAuthenticationRequired(function () {
                            Moderator.allocateConferenceFocus(
                                roomName, callback);
                        });
                    }
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

function setRecording(state, token, callback, connection) {
    if (useJirecon){
        setRecordingJirecon(state, token, callback, connection);
    } else {
        setRecordingColibri(state, token, callback, connection);
    }
}

function setRecordingJirecon(state, token, callback, connection) {
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
                               startingCallback, startedCallback, connection) {
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

            },
            connection
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
var JingleSession = require("./JingleSession");

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
        focusMucJid: null,
        ssrc2jid: {},
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

            var self = this;

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

                self.connection.sendIQ(formSubmit);

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
                    eventEmitter.emit(XMPPEvents.ETHERPAD, etherpad.text());
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
                eventEmitter.emit(XMPPEvents.REMOTE_STATS, from, statsObj);
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

                    eventEmitter.emit(XMPPEvents.LOCALROLE_CHANGED,
                        from, member, pres, Moderator.isModerator(),
                        Moderator.isExternalAuthEnabled());
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
                    this.focusMucJid = from;
                    console.info("Ignore focus: " + from + ", real JID: " + member.jid);
                }
                else {
                    var id = $(pres).find('>userID').text();
                    var email = $(pres).find('>email');
                    if (email.length > 0) {
                        id = email.text();
                    }
                    eventEmitter.emit(XMPPEvents.MUC_ENTER, from, id, member.displayName);
                }
            } else {
                // Presence update for existing participant
                // Watch role change:
                if (this.members[from].role != member.role) {
                    this.members[from].role = member.role;
                    eventEmitter.emit(XMPPEvents.MUC_ROLE_CHANGED,
                        member.role, member.displayName);
                }
            }

            // Always trigger presence to update bindings
            this.parsePresence(from, member, pres);

            // Trigger status message update
            if (member.status) {
                eventEmitter.emit(XMPPEvents.PRESENCE_STATUS, from, member);
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
                eventEmitter.emit(XMPPEvents.PASSWORD_REQUIRED, function (value) {
                    self.doJoin(from, value);
                });
            } else if ($(pres).find(
                '>error[type="cancel"]>not-allowed[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
                var toDomain = Strophe.getDomainFromJid(pres.getAttribute('to'));
                if (toDomain === config.hosts.anonymousdomain) {
                    // enter the room by replying with 'not-authorized'. This would
                    // result in reconnection from authorized domain.
                    // We're either missing Jicofo/Prosody config for anonymous
                    // domains or something is wrong.
//                    XMPP.promptLogin();
                    UI.messageHandler.openReportDialog(null,
                        'Oops ! We couldn`t join the conference.' +
                        ' There might be some problem with security' +
                        ' configuration. Please contact service' +
                        ' administrator.', pres);
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
            eventEmitter.emit(XMPPEvents.SENDING_CHAT_MESSAGE, body);
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
            var nick =
                $(msg).find('>nick[xmlns="http://jabber.org/protocol/nick"]')
                    .text() ||
                Strophe.getResourceFromJid(from);

            var txt = $(msg).find('>body').text();
            var type = msg.getAttribute("type");
            if (type == "error") {
                eventEmitter.emit(XMPPEvents.CHAT_ERROR_RECEIVED,
                    $(msg).find('>text').text(), txt);
                return true;
            }

            var subject = $(msg).find('>subject');
            if (subject.length) {
                var subjectText = subject.text();
                if (subjectText || subjectText == "") {
                    eventEmitter.emit(XMPPEvents.SUBJECT_CHANGED, subjectText);
                    console.log("Subject is changed to " + subjectText);
                }
            }


            if (txt) {
                console.log('chat', nick, txt);
                eventEmitter.emit(XMPPEvents.MESSAGE_RECEIVED,
                    from, nick, txt, this.myroomjid);
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
                        ob.connection.sendIQ(formsubmit,
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

            eventEmitter.emit(XMPPEvents.MUC_LEFT, jid);

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

            var self = this;
            // Remove old ssrcs coming from the jid
            Object.keys(this.ssrc2jid).forEach(function (ssrc) {
                if (self.ssrc2jid[ssrc] == jid) {
                    delete self.ssrc2jid[ssrc];
                }
            });

            var changedStreams = [];
            $(pres).find('>media[xmlns="http://estos.de/ns/mjs"]>source').each(function (idx, ssrc) {
                //console.log(jid, 'assoc ssrc', ssrc.getAttribute('type'), ssrc.getAttribute('ssrc'));
                var ssrcV = ssrc.getAttribute('ssrc');
                self.ssrc2jid[ssrcV] = from;
                JingleSession.notReceivedSSRCs.push(ssrcV);


                var type = ssrc.getAttribute('type');

                var direction = ssrc.getAttribute('direction');

                changedStreams.push({type: type, direction: direction});

            });

            eventEmitter.emit(XMPPEvents.CHANGED_STREAMS, from, changedStreams);

            var displayName = !config.displayJids
                ? memeber.displayName : Strophe.getResourceFromJid(from);

            if (displayName && displayName.length > 0)
            {
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


},{"./JingleSession":1,"./moderator":6}],9:[function(require,module,exports){
/* jshint -W117 */

var JingleSession = require("./JingleSession");

module.exports = function(XMPP, eventEmitter)
{
    function CallIncomingJingle(sid, connection) {
        var sess = connection.jingle.sessions[sid];

        // TODO: do we check activecall == null?
        connection.jingle.activecall = sess;

        eventEmitter.emit(XMPPEvents.CALL_INCOMING, sess);

        // TODO: check affiliation and/or role
        console.log('emuc data for', sess.peerjid, connection.emuc.members[sess.peerjid]);
        sess.usedrip = true; // not-so-naive trickle ice
        sess.sendAnswer();
        sess.accept();

    };

    Strophe.addConnectionPlugin('jingle', {
        connection: null,
        sessions: {},
        jid2session: {},
        ice_config: {iceServers: []},
        pc_constraints: {},
        activecall: null,
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
                this.connection.disco.addFeature('urn:xmpp:jingle:transports:dtls-sctp:1');
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
                        to: this.connection.emuc.focusMucJid
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
var Pako = require("pako");

var eventEmitter = new EventEmitter();
var connection = null;
var authenticatedUser = false;

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
    require("./strophe.jingle")(XMPP, eventEmitter);
    require("./strophe.moderate")(XMPP);
    require("./strophe.util")();
    require("./strophe.rayo")();
    require("./strophe.logger")();
}

function registerListeners() {
    RTC.addStreamListener(maybeDoJoin,
        StreamEventTypes.EVENT_TYPE_LOCAL_CREATED);
    UI.addListener(UIEvents.NICKNAME_CHANGED, function (nickname) {
        XMPP.addToPresence("displayName", nickname);
    });
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
        var configDomain = config.hosts.anonymousdomain || config.hosts.domain;
        // Force authenticated domain if room is appended with '?login=true'
        if (config.hosts.anonymousdomain &&
            window.location.search.indexOf("login=true") !== -1) {
            configDomain = config.hosts.domain;
        }
        var jid = uiCredentials.jid || configDomain || window.location.hostname;
        connect(jid, null, uiCredentials);
    },
    promptLogin: function () {
        UI.showLoginPopup(connect);
    },
    joinRoom: function(roomName, useNicks, nick)
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
        var handler = connection.jingle.activecall;
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
        connection.jingle.activecall = null;
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
        if (connection && connection.jingle.activecall) {
            // FIXME: will block switchInProgress on true value in case of exception
            connection.jingle.activecall.switchStreams(stream, oldStream, callback);
        } else {
            // We are done immediately
            console.error("No conference handler");
            UI.messageHandler.showError('Error',
                'Unable to switch video stream.');
            callback();
        }
    },
    setVideoMute: function (mute, callback, options) {
       if(connection && RTC.localVideo && connection.jingle.activecall)
       {
           connection.jingle.activecall.setVideoMute(mute, callback, options);
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
            startingCallback, startedCallback, connection);
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
    sendLogs: function (data) {
        if(!connection.emuc.focusMucJid)
            return;

        var deflate = true;

        var content = JSON.stringify(data);
        if (deflate) {
            content = String.fromCharCode.apply(null, Pako.deflateRaw(content));
        }
        content = Base64.encode(content);
        // XEP-0337-ish
        var message = $msg({to: connection.emuc.focusMucJid, type: 'normal'});
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
        return connection.emuc.findJidFromResource(resource);
    },
    getMembers: function () {
        return connection.emuc.members;
    },
    getJidFromSSRC: function (ssrc) {
        if(!connection)
            return null;
        return connection.emuc.ssrc2jid[ssrc];
    }

};

module.exports = XMPP;

},{"./SDP":2,"./moderator":6,"./recording":7,"./strophe.emuc":8,"./strophe.jingle":9,"./strophe.logger":10,"./strophe.moderate":11,"./strophe.rayo":12,"./strophe.util":13,"events":31,"pako":15}],15:[function(require,module,exports){
// Top level file is just a mixin of submodules & constants
'use strict';

var assign    = require('./lib/utils/common').assign;

var deflate   = require('./lib/deflate');
var inflate   = require('./lib/inflate');
var constants = require('./lib/zlib/constants');

var pako = {};

assign(pako, deflate, inflate, constants);

module.exports = pako;
},{"./lib/deflate":16,"./lib/inflate":17,"./lib/utils/common":18,"./lib/zlib/constants":21}],16:[function(require,module,exports){
'use strict';


var zlib_deflate = require('./zlib/deflate.js');
var utils = require('./utils/common');
var strings = require('./utils/strings');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');


/* Public constants ==========================================================*/
/* ===========================================================================*/

var Z_NO_FLUSH      = 0;
var Z_FINISH        = 4;

var Z_OK            = 0;
var Z_STREAM_END    = 1;

var Z_DEFAULT_COMPRESSION = -1;

var Z_DEFAULT_STRATEGY    = 0;

var Z_DEFLATED  = 8;

/* ===========================================================================*/


/**
 * class Deflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[deflate]],
 * [[deflateRaw]] and [[gzip]].
 **/

/* internal
 * Deflate.chunks -> Array
 *
 * Chunks of output data, if [[Deflate#onData]] not overriden.
 **/

/**
 * Deflate.result -> Uint8Array|Array
 *
 * Compressed result, generated by default [[Deflate#onData]]
 * and [[Deflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Deflate#push]] with `Z_FINISH` / `true` param).
 **/

/**
 * Deflate.err -> Number
 *
 * Error code after deflate finished. 0 (Z_OK) on success.
 * You will not need it in real life, because deflate errors
 * are possible only on wrong options or bad `onData` / `onEnd`
 * custom handlers.
 **/

/**
 * Deflate.msg -> String
 *
 * Error message, if [[Deflate.err]] != 0
 **/


/**
 * new Deflate(options)
 * - options (Object): zlib deflate options.
 *
 * Creates new deflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `level`
 * - `windowBits`
 * - `memLevel`
 * - `strategy`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw deflate
 * - `gzip` (Boolean) - create gzip wrapper
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 * - `header` (Object) - custom header for gzip
 *   - `text` (Boolean) - true if compressed data believed to be text
 *   - `time` (Number) - modification time, unix timestamp
 *   - `os` (Number) - operation system code
 *   - `extra` (Array) - array of bytes with extra data (max 65536)
 *   - `name` (String) - file name (binary string)
 *   - `comment` (String) - comment (binary string)
 *   - `hcrc` (Boolean) - true if header crc should be added
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var deflate = new pako.Deflate({ level: 3});
 *
 * deflate.push(chunk1, false);
 * deflate.push(chunk2, true);  // true -> last chunk
 *
 * if (deflate.err) { throw new Error(deflate.err); }
 *
 * console.log(deflate.result);
 * ```
 **/
var Deflate = function(options) {

  this.options = utils.assign({
    level: Z_DEFAULT_COMPRESSION,
    method: Z_DEFLATED,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: Z_DEFAULT_STRATEGY,
    to: ''
  }, options || {});

  var opt = this.options;

  if (opt.raw && (opt.windowBits > 0)) {
    opt.windowBits = -opt.windowBits;
  }

  else if (opt.gzip && (opt.windowBits > 0) && (opt.windowBits < 16)) {
    opt.windowBits += 16;
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm = new zstream();
  this.strm.avail_out = 0;

  var status = zlib_deflate.deflateInit2(
    this.strm,
    opt.level,
    opt.method,
    opt.windowBits,
    opt.memLevel,
    opt.strategy
  );

  if (status !== Z_OK) {
    throw new Error(msg[status]);
  }

  if (opt.header) {
    zlib_deflate.deflateSetHeader(this.strm, opt.header);
  }
};

/**
 * Deflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|String): input data. Strings will be converted to
 *   utf8 byte sequence.
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to deflate pipe, generating [[Deflate#onData]] calls with
 * new compressed chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That flush internal pending buffers and call
 * [[Deflate#onEnd]].
 *
 * On fail call [[Deflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * array format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Deflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;

  if (this.ended) { return false; }

  _mode = (mode === ~~mode) ? mode : ((mode === true) ? Z_FINISH : Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // If we need to compress text, change encoding to utf8.
    strm.input = strings.string2buf(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }
    status = zlib_deflate.deflate(strm, _mode);    /* no bad return value */

    if (status !== Z_STREAM_END && status !== Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }
    if (strm.avail_out === 0 || (strm.avail_in === 0 && _mode === Z_FINISH)) {
      if (this.options.to === 'string') {
        this.onData(strings.buf2binstring(utils.shrinkBuf(strm.output, strm.next_out)));
      } else {
        this.onData(utils.shrinkBuf(strm.output, strm.next_out));
      }
    }
  } while ((strm.avail_in > 0 || strm.avail_out === 0) && status !== Z_STREAM_END);

  // Finalize on the last chunk.
  if (_mode === Z_FINISH) {
    status = zlib_deflate.deflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === Z_OK;
  }

  return true;
};


/**
 * Deflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Deflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Deflate#onEnd(status) -> Void
 * - status (Number): deflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell deflate that input stream complete
 * or error happenned. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Deflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === Z_OK) {
    if (this.options.to === 'string') {
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * deflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * Compress `data` with deflate alrorythm and `options`.
 *
 * Supported options are:
 *
 * - level
 * - windowBits
 * - memLevel
 * - strategy
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be "binary string"
 *    (each char code [0..255])
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , data = Uint8Array([1,2,3,4,5,6,7,8,9]);
 *
 * console.log(pako.deflate(data));
 * ```
 **/
function deflate(input, options) {
  var deflator = new Deflate(options);

  deflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (deflator.err) { throw deflator.msg; }

  return deflator.result;
}


/**
 * deflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function deflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return deflate(input, options);
}


/**
 * gzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to compress.
 * - options (Object): zlib deflate options.
 *
 * The same as [[deflate]], but create gzip wrapper instead of
 * deflate one.
 **/
function gzip(input, options) {
  options = options || {};
  options.gzip = true;
  return deflate(input, options);
}


exports.Deflate = Deflate;
exports.deflate = deflate;
exports.deflateRaw = deflateRaw;
exports.gzip = gzip;
},{"./utils/common":18,"./utils/strings":19,"./zlib/deflate.js":23,"./zlib/messages":28,"./zlib/zstream":30}],17:[function(require,module,exports){
'use strict';


var zlib_inflate = require('./zlib/inflate.js');
var utils = require('./utils/common');
var strings = require('./utils/strings');
var c = require('./zlib/constants');
var msg = require('./zlib/messages');
var zstream = require('./zlib/zstream');
var gzheader = require('./zlib/gzheader');


/**
 * class Inflate
 *
 * Generic JS-style wrapper for zlib calls. If you don't need
 * streaming behaviour - use more simple functions: [[inflate]]
 * and [[inflateRaw]].
 **/

/* internal
 * inflate.chunks -> Array
 *
 * Chunks of output data, if [[Inflate#onData]] not overriden.
 **/

/**
 * Inflate.result -> Uint8Array|Array|String
 *
 * Uncompressed result, generated by default [[Inflate#onData]]
 * and [[Inflate#onEnd]] handlers. Filled after you push last chunk
 * (call [[Inflate#push]] with `Z_FINISH` / `true` param).
 **/

/**
 * Inflate.err -> Number
 *
 * Error code after inflate finished. 0 (Z_OK) on success.
 * Should be checked if broken data possible.
 **/

/**
 * Inflate.msg -> String
 *
 * Error message, if [[Inflate.err]] != 0
 **/


/**
 * new Inflate(options)
 * - options (Object): zlib inflate options.
 *
 * Creates new inflator instance with specified params. Throws exception
 * on bad params. Supported options:
 *
 * - `windowBits`
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information on these.
 *
 * Additional options, for internal needs:
 *
 * - `chunkSize` - size of generated data chunks (16K by default)
 * - `raw` (Boolean) - do raw inflate
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 * By default, when no options set, autodetect deflate/gzip data format via
 * wrapper header.
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , chunk1 = Uint8Array([1,2,3,4,5,6,7,8,9])
 *   , chunk2 = Uint8Array([10,11,12,13,14,15,16,17,18,19]);
 *
 * var inflate = new pako.Inflate({ level: 3});
 *
 * inflate.push(chunk1, false);
 * inflate.push(chunk2, true);  // true -> last chunk
 *
 * if (inflate.err) { throw new Error(inflate.err); }
 *
 * console.log(inflate.result);
 * ```
 **/
var Inflate = function(options) {

  this.options = utils.assign({
    chunkSize: 16384,
    windowBits: 0,
    to: ''
  }, options || {});

  var opt = this.options;

  // Force window size for `raw` data, if not set directly,
  // because we have no header for autodetect.
  if (opt.raw && (opt.windowBits >= 0) && (opt.windowBits < 16)) {
    opt.windowBits = -opt.windowBits;
    if (opt.windowBits === 0) { opt.windowBits = -15; }
  }

  // If `windowBits` not defined (and mode not raw) - set autodetect flag for gzip/deflate
  if ((opt.windowBits >= 0) && (opt.windowBits < 16) &&
      !(options && options.windowBits)) {
    opt.windowBits += 32;
  }

  // Gzip header has no info about windows size, we can do autodetect only
  // for deflate. So, if window size not set, force it to max when gzip possible
  if ((opt.windowBits > 15) && (opt.windowBits < 48)) {
    // bit 3 (16) -> gzipped data
    // bit 4 (32) -> autodetect gzip/deflate
    if ((opt.windowBits & 15) === 0) {
      opt.windowBits |= 15;
    }
  }

  this.err    = 0;      // error code, if happens (0 = Z_OK)
  this.msg    = '';     // error message
  this.ended  = false;  // used to avoid multiple onEnd() calls
  this.chunks = [];     // chunks of compressed data

  this.strm   = new zstream();
  this.strm.avail_out = 0;

  var status  = zlib_inflate.inflateInit2(
    this.strm,
    opt.windowBits
  );

  if (status !== c.Z_OK) {
    throw new Error(msg[status]);
  }

  this.header = new gzheader();

  zlib_inflate.inflateGetHeader(this.strm, this.header);
};

/**
 * Inflate#push(data[, mode]) -> Boolean
 * - data (Uint8Array|Array|String): input data
 * - mode (Number|Boolean): 0..6 for corresponding Z_NO_FLUSH..Z_TREE modes.
 *   See constants. Skipped or `false` means Z_NO_FLUSH, `true` meansh Z_FINISH.
 *
 * Sends input data to inflate pipe, generating [[Inflate#onData]] calls with
 * new output chunks. Returns `true` on success. The last data block must have
 * mode Z_FINISH (or `true`). That flush internal pending buffers and call
 * [[Inflate#onEnd]].
 *
 * On fail call [[Inflate#onEnd]] with error code and return false.
 *
 * We strongly recommend to use `Uint8Array` on input for best speed (output
 * format is detected automatically). Also, don't skip last param and always
 * use the same type in your code (boolean or number). That will improve JS speed.
 *
 * For regular `Array`-s make sure all elements are [0..255].
 *
 * ##### Example
 *
 * ```javascript
 * push(chunk, false); // push one of data chunks
 * ...
 * push(chunk, true);  // push last chunk
 * ```
 **/
Inflate.prototype.push = function(data, mode) {
  var strm = this.strm;
  var chunkSize = this.options.chunkSize;
  var status, _mode;
  var next_out_utf8, tail, utf8str;

  if (this.ended) { return false; }
  _mode = (mode === ~~mode) ? mode : ((mode === true) ? c.Z_FINISH : c.Z_NO_FLUSH);

  // Convert data if needed
  if (typeof data === 'string') {
    // Only binary strings can be decompressed on practice
    strm.input = strings.binstring2buf(data);
  } else {
    strm.input = data;
  }

  strm.next_in = 0;
  strm.avail_in = strm.input.length;

  do {
    if (strm.avail_out === 0) {
      strm.output = new utils.Buf8(chunkSize);
      strm.next_out = 0;
      strm.avail_out = chunkSize;
    }

    status = zlib_inflate.inflate(strm, c.Z_NO_FLUSH);    /* no bad return value */

    if (status !== c.Z_STREAM_END && status !== c.Z_OK) {
      this.onEnd(status);
      this.ended = true;
      return false;
    }

    if (strm.next_out) {
      if (strm.avail_out === 0 || status === c.Z_STREAM_END || (strm.avail_in === 0 && _mode === c.Z_FINISH)) {

        if (this.options.to === 'string') {

          next_out_utf8 = strings.utf8border(strm.output, strm.next_out);

          tail = strm.next_out - next_out_utf8;
          utf8str = strings.buf2string(strm.output, next_out_utf8);

          // move tail
          strm.next_out = tail;
          strm.avail_out = chunkSize - tail;
          if (tail) { utils.arraySet(strm.output, strm.output, next_out_utf8, tail, 0); }

          this.onData(utf8str);

        } else {
          this.onData(utils.shrinkBuf(strm.output, strm.next_out));
        }
      }
    }
  } while ((strm.avail_in > 0) && status !== c.Z_STREAM_END);

  if (status === c.Z_STREAM_END) {
    _mode = c.Z_FINISH;
  }
  // Finalize on the last chunk.
  if (_mode === c.Z_FINISH) {
    status = zlib_inflate.inflateEnd(this.strm);
    this.onEnd(status);
    this.ended = true;
    return status === c.Z_OK;
  }

  return true;
};


/**
 * Inflate#onData(chunk) -> Void
 * - chunk (Uint8Array|Array|String): ouput data. Type of array depends
 *   on js engine support. When string output requested, each chunk
 *   will be string.
 *
 * By default, stores data blocks in `chunks[]` property and glue
 * those in `onEnd`. Override this handler, if you need another behaviour.
 **/
Inflate.prototype.onData = function(chunk) {
  this.chunks.push(chunk);
};


/**
 * Inflate#onEnd(status) -> Void
 * - status (Number): inflate status. 0 (Z_OK) on success,
 *   other if not.
 *
 * Called once after you tell inflate that input stream complete
 * or error happenned. By default - join collected chunks,
 * free memory and fill `results` / `err` properties.
 **/
Inflate.prototype.onEnd = function(status) {
  // On success - join
  if (status === c.Z_OK) {
    if (this.options.to === 'string') {
      // Glue & convert here, until we teach pako to send
      // utf8 alligned strings to onData
      this.result = this.chunks.join('');
    } else {
      this.result = utils.flattenChunks(this.chunks);
    }
  }
  this.chunks = [];
  this.err = status;
  this.msg = this.strm.msg;
};


/**
 * inflate(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Decompress `data` with inflate/ungzip and `options`. Autodetect
 * format via wrapper header by default. That's why we don't provide
 * separate `ungzip` method.
 *
 * Supported options are:
 *
 * - windowBits
 *
 * [http://zlib.net/manual.html#Advanced](http://zlib.net/manual.html#Advanced)
 * for more information.
 *
 * Sugar (options):
 *
 * - `raw` (Boolean) - say that we work with raw stream, if you don't wish to specify
 *   negative windowBits implicitly.
 * - `to` (String) - if equal to 'string', then result will be converted
 *   from utf8 to utf16 (javascript) string. When string output requested,
 *   chunk length can differ from `chunkSize`, depending on content.
 *
 *
 * ##### Example:
 *
 * ```javascript
 * var pako = require('pako')
 *   , input = pako.deflate([1,2,3,4,5,6,7,8,9])
 *   , output;
 *
 * try {
 *   output = pako.inflate(input);
 * } catch (err)
 *   console.log(err);
 * }
 * ```
 **/
function inflate(input, options) {
  var inflator = new Inflate(options);

  inflator.push(input, true);

  // That will never happens, if you don't cheat with options :)
  if (inflator.err) { throw inflator.msg; }

  return inflator.result;
}


/**
 * inflateRaw(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * The same as [[inflate]], but creates raw data, without wrapper
 * (header and adler32 crc).
 **/
function inflateRaw(input, options) {
  options = options || {};
  options.raw = true;
  return inflate(input, options);
}


/**
 * ungzip(data[, options]) -> Uint8Array|Array|String
 * - data (Uint8Array|Array|String): input data to decompress.
 * - options (Object): zlib inflate options.
 *
 * Just shortcut to [[inflate]], because it autodetects format
 * by header.content. Done for convenience.
 **/


exports.Inflate = Inflate;
exports.inflate = inflate;
exports.inflateRaw = inflateRaw;
exports.ungzip  = inflate;

},{"./utils/common":18,"./utils/strings":19,"./zlib/constants":21,"./zlib/gzheader":24,"./zlib/inflate.js":26,"./zlib/messages":28,"./zlib/zstream":30}],18:[function(require,module,exports){
'use strict';


var TYPED_OK =  (typeof Uint8Array !== 'undefined') &&
                (typeof Uint16Array !== 'undefined') &&
                (typeof Int32Array !== 'undefined');


exports.assign = function (obj /*from1, from2, from3, ...*/) {
  var sources = Array.prototype.slice.call(arguments, 1);
  while (sources.length) {
    var source = sources.shift();
    if (!source) { continue; }

    if (typeof(source) !== 'object') {
      throw new TypeError(source + 'must be non-object');
    }

    for (var p in source) {
      if (source.hasOwnProperty(p)) {
        obj[p] = source[p];
      }
    }
  }

  return obj;
};


// reduce buffer size, avoiding mem copy
exports.shrinkBuf = function (buf, size) {
  if (buf.length === size) { return buf; }
  if (buf.subarray) { return buf.subarray(0, size); }
  buf.length = size;
  return buf;
};


var fnTyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    if (src.subarray && dest.subarray) {
      dest.set(src.subarray(src_offs, src_offs+len), dest_offs);
      return;
    }
    // Fallback to ordinary array
    for(var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    var i, l, len, pos, chunk, result;

    // calculate data length
    len = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      len += chunks[i].length;
    }

    // join chunks
    result = new Uint8Array(len);
    pos = 0;
    for (i=0, l=chunks.length; i<l; i++) {
      chunk = chunks[i];
      result.set(chunk, pos);
      pos += chunk.length;
    }

    return result;
  }
};

var fnUntyped = {
  arraySet: function (dest, src, src_offs, len, dest_offs) {
    for(var i=0; i<len; i++) {
      dest[dest_offs + i] = src[src_offs + i];
    }
  },
  // Join array of chunks to single array.
  flattenChunks: function(chunks) {
    return [].concat.apply([], chunks);
  }
};


// Enable/Disable typed arrays use, for testing
//
exports.setTyped = function (on) {
  if (on) {
    exports.Buf8  = Uint8Array;
    exports.Buf16 = Uint16Array;
    exports.Buf32 = Int32Array;
    exports.assign(exports, fnTyped);
  } else {
    exports.Buf8  = Array;
    exports.Buf16 = Array;
    exports.Buf32 = Array;
    exports.assign(exports, fnUntyped);
  }
};

exports.setTyped(TYPED_OK);
},{}],19:[function(require,module,exports){
// String encode/decode helpers
'use strict';


var utils = require('./common');


// Quick check if we can use fast array to bin string conversion
//
// - apply(Array) can fail on Android 2.2
// - apply(Uint8Array) can fail on iOS 5.1 Safary
//
var STR_APPLY_OK = true;
var STR_APPLY_UIA_OK = true;

try { String.fromCharCode.apply(null, [0]); } catch(__) { STR_APPLY_OK = false; }
try { String.fromCharCode.apply(null, new Uint8Array(1)); } catch(__) { STR_APPLY_UIA_OK = false; }


// Table with utf8 lengths (calculated by first byte of sequence)
// Note, that 5 & 6-byte values and some 4-byte values can not be represented in JS,
// because max possible codepoint is 0x10ffff
var _utf8len = new utils.Buf8(256);
for (var i=0; i<256; i++) {
  _utf8len[i] = (i >= 252 ? 6 : i >= 248 ? 5 : i >= 240 ? 4 : i >= 224 ? 3 : i >= 192 ? 2 : 1);
}
_utf8len[254]=_utf8len[254]=1; // Invalid sequence start


// convert string to array (typed, when possible)
exports.string2buf = function (str) {
  var buf, c, c2, m_pos, i, str_len = str.length, buf_len = 0;

  // count binary size
  for (m_pos = 0; m_pos < str_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
      c2 = str.charCodeAt(m_pos+1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    buf_len += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }

  // allocate buffer
  buf = new utils.Buf8(buf_len);

  // convert
  for (i=0, m_pos = 0; i < buf_len; m_pos++) {
    c = str.charCodeAt(m_pos);
    if ((c & 0xfc00) === 0xd800 && (m_pos+1 < str_len)) {
      c2 = str.charCodeAt(m_pos+1);
      if ((c2 & 0xfc00) === 0xdc00) {
        c = 0x10000 + ((c - 0xd800) << 10) + (c2 - 0xdc00);
        m_pos++;
      }
    }
    if (c < 0x80) {
      /* one byte */
      buf[i++] = c;
    } else if (c < 0x800) {
      /* two bytes */
      buf[i++] = 0xC0 | (c >>> 6);
      buf[i++] = 0x80 | (c & 0x3f);
    } else if (c < 0x10000) {
      /* three bytes */
      buf[i++] = 0xE0 | (c >>> 12);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    } else {
      /* four bytes */
      buf[i++] = 0xf0 | (c >>> 18);
      buf[i++] = 0x80 | (c >>> 12 & 0x3f);
      buf[i++] = 0x80 | (c >>> 6 & 0x3f);
      buf[i++] = 0x80 | (c & 0x3f);
    }
  }

  return buf;
};

// Helper (used in 2 places)
function buf2binstring(buf, len) {
  // use fallback for big arrays to avoid stack overflow
  if (len < 65537) {
    if ((buf.subarray && STR_APPLY_UIA_OK) || (!buf.subarray && STR_APPLY_OK)) {
      return String.fromCharCode.apply(null, utils.shrinkBuf(buf, len));
    }
  }

  var result = '';
  for(var i=0; i < len; i++) {
    result += String.fromCharCode(buf[i]);
  }
  return result;
}


// Convert byte array to binary string
exports.buf2binstring = function(buf) {
  return buf2binstring(buf, buf.length);
};


// Convert binary string (typed, when possible)
exports.binstring2buf = function(str) {
  var buf = new utils.Buf8(str.length);
  for(var i=0, len=buf.length; i < len; i++) {
    buf[i] = str.charCodeAt(i);
  }
  return buf;
};


// convert array to string
exports.buf2string = function (buf, max) {
  var i, out, c, c_len;
  var len = max || buf.length;

  // Reserve max possible length (2 words per char)
  // NB: by unknown reasons, Array is significantly faster for
  //     String.fromCharCode.apply than Uint16Array.
  var utf16buf = new Array(len*2);

  for (out=0, i=0; i<len;) {
    c = buf[i++];
    // quick process ascii
    if (c < 0x80) { utf16buf[out++] = c; continue; }

    c_len = _utf8len[c];
    // skip 5 & 6 byte codes
    if (c_len > 4) { utf16buf[out++] = 0xfffd; i += c_len-1; continue; }

    // apply mask on first byte
    c &= c_len === 2 ? 0x1f : c_len === 3 ? 0x0f : 0x07;
    // join the rest
    while (c_len > 1 && i < len) {
      c = (c << 6) | (buf[i++] & 0x3f);
      c_len--;
    }

    // terminated by end of string?
    if (c_len > 1) { utf16buf[out++] = 0xfffd; continue; }

    if (c < 0x10000) {
      utf16buf[out++] = c;
    } else {
      c -= 0x10000;
      utf16buf[out++] = 0xd800 | ((c >> 10) & 0x3ff);
      utf16buf[out++] = 0xdc00 | (c & 0x3ff);
    }
  }

  return buf2binstring(utf16buf, out);
};


// Calculate max possible position in utf8 buffer,
// that will not break sequence. If that's not possible
// - (very small limits) return max size as is.
//
// buf[] - utf8 bytes array
// max   - length limit (mandatory);
exports.utf8border = function(buf, max) {
  var pos;

  max = max || buf.length;
  if (max > buf.length) { max = buf.length; }

  // go back from last position, until start of sequence found
  pos = max-1;
  while (pos >= 0 && (buf[pos] & 0xC0) === 0x80) { pos--; }

  // Fuckup - very small and broken sequence,
  // return max, because we should return something anyway.
  if (pos < 0) { return max; }

  // If we came to start of buffer - that means vuffer is too small,
  // return max too.
  if (pos === 0) { return max; }

  return (pos + _utf8len[buf[pos]] > max) ? pos : max;
};

},{"./common":18}],20:[function(require,module,exports){
'use strict';

// Note: adler32 takes 12% for level 0 and 2% for level 6.
// It doesn't worth to make additional optimizationa as in original.
// Small size is preferable.

function adler32(adler, buf, len, pos) {
  var s1 = (adler & 0xffff) |0
    , s2 = ((adler >>> 16) & 0xffff) |0
    , n = 0;

  while (len !== 0) {
    // Set limit ~ twice less than 5552, to keep
    // s2 in 31-bits, because we force signed ints.
    // in other case %= will fail.
    n = len > 2000 ? 2000 : len;
    len -= n;

    do {
      s1 = (s1 + buf[pos++]) |0;
      s2 = (s2 + s1) |0;
    } while (--n);

    s1 %= 65521;
    s2 %= 65521;
  }

  return (s1 | (s2 << 16)) |0;
}


module.exports = adler32;
},{}],21:[function(require,module,exports){
module.exports = {

  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH:         0,
  Z_PARTIAL_FLUSH:    1,
  Z_SYNC_FLUSH:       2,
  Z_FULL_FLUSH:       3,
  Z_FINISH:           4,
  Z_BLOCK:            5,
  Z_TREES:            6,

  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK:               0,
  Z_STREAM_END:       1,
  Z_NEED_DICT:        2,
  Z_ERRNO:           -1,
  Z_STREAM_ERROR:    -2,
  Z_DATA_ERROR:      -3,
  //Z_MEM_ERROR:     -4,
  Z_BUF_ERROR:       -5,
  //Z_VERSION_ERROR: -6,

  /* compression levels */
  Z_NO_COMPRESSION:         0,
  Z_BEST_SPEED:             1,
  Z_BEST_COMPRESSION:       9,
  Z_DEFAULT_COMPRESSION:   -1,


  Z_FILTERED:               1,
  Z_HUFFMAN_ONLY:           2,
  Z_RLE:                    3,
  Z_FIXED:                  4,
  Z_DEFAULT_STRATEGY:       0,

  /* Possible values of the data_type field (though see inflate()) */
  Z_BINARY:                 0,
  Z_TEXT:                   1,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN:                2,

  /* The deflate compression method */
  Z_DEFLATED:               8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
},{}],22:[function(require,module,exports){
'use strict';

// Note: we can't get significant speed boost here.
// So write code to minimize size - no pregenerated tables
// and array tools dependencies.


// Use ordinary array, since untyped makes no boost here
function makeTable() {
  var c, table = [];

  for(var n =0; n < 256; n++){
    c = n;
    for(var k =0; k < 8; k++){
      c = ((c&1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
    }
    table[n] = c;
  }

  return table;
}

// Create table on load. Just 255 signed longs. Not a problem.
var crcTable = makeTable();


function crc32(crc, buf, len, pos) {
  var t = crcTable
    , end = pos + len;

  crc = crc ^ (-1);

  for (var i = pos; i < end; i++ ) {
    crc = (crc >>> 8) ^ t[(crc ^ buf[i]) & 0xFF];
  }

  return (crc ^ (-1)); // >>> 0;
}


module.exports = crc32;
},{}],23:[function(require,module,exports){
'use strict';

var utils   = require('../utils/common');
var trees   = require('./trees');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var msg   = require('./messages');

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
var Z_NO_FLUSH      = 0;
var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
//var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
//var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
//var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;


/* compression levels */
//var Z_NO_COMPRESSION      = 0;
//var Z_BEST_SPEED          = 1;
//var Z_BEST_COMPRESSION    = 9;
var Z_DEFAULT_COMPRESSION = -1;


var Z_FILTERED            = 1;
var Z_HUFFMAN_ONLY        = 2;
var Z_RLE                 = 3;
var Z_FIXED               = 4;
var Z_DEFAULT_STRATEGY    = 0;

/* Possible values of the data_type field (though see inflate()) */
//var Z_BINARY              = 0;
//var Z_TEXT                = 1;
//var Z_ASCII               = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;


/* The deflate compression method */
var Z_DEFLATED  = 8;

/*============================================================================*/


var MAX_MEM_LEVEL = 9;
/* Maximum value for memLevel in deflateInit2 */
var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_MEM_LEVEL = 8;


var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */
var LITERALS      = 256;
/* number of literal bytes 0..255 */
var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */
var D_CODES       = 30;
/* number of distance codes */
var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */
var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */
var MAX_BITS  = 15;
/* All codes must not exceed MAX_BITS bits */

var MIN_MATCH = 3;
var MAX_MATCH = 258;
var MIN_LOOKAHEAD = (MAX_MATCH + MIN_MATCH + 1);

var PRESET_DICT = 0x20;

var INIT_STATE = 42;
var EXTRA_STATE = 69;
var NAME_STATE = 73;
var COMMENT_STATE = 91;
var HCRC_STATE = 103;
var BUSY_STATE = 113;
var FINISH_STATE = 666;

var BS_NEED_MORE      = 1; /* block not completed, need more input or more output */
var BS_BLOCK_DONE     = 2; /* block flush performed */
var BS_FINISH_STARTED = 3; /* finish started, need only more output at next deflate */
var BS_FINISH_DONE    = 4; /* finish done, accept no more input or output */

var OS_CODE = 0x03; // Unix :) . Don't detect, use this default.

function err(strm, errorCode) {
  strm.msg = msg[errorCode];
  return errorCode;
}

function rank(f) {
  return ((f) << 1) - ((f) > 4 ? 9 : 0);
}

function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }


/* =========================================================================
 * Flush as much pending output as possible. All deflate() output goes
 * through this function so some applications may wish to modify it
 * to avoid allocating a large strm->output buffer and copying into it.
 * (See also read_buf()).
 */
function flush_pending(strm) {
  var s = strm.state;

  //_tr_flush_bits(s);
  var len = s.pending;
  if (len > strm.avail_out) {
    len = strm.avail_out;
  }
  if (len === 0) { return; }

  utils.arraySet(strm.output, s.pending_buf, s.pending_out, len, strm.next_out);
  strm.next_out += len;
  s.pending_out += len;
  strm.total_out += len;
  strm.avail_out -= len;
  s.pending -= len;
  if (s.pending === 0) {
    s.pending_out = 0;
  }
}


function flush_block_only (s, last) {
  trees._tr_flush_block(s, (s.block_start >= 0 ? s.block_start : -1), s.strstart - s.block_start, last);
  s.block_start = s.strstart;
  flush_pending(s.strm);
}


function put_byte(s, b) {
  s.pending_buf[s.pending++] = b;
}


/* =========================================================================
 * Put a short in the pending buffer. The 16-bit value is put in MSB order.
 * IN assertion: the stream state is correct and there is enough room in
 * pending_buf.
 */
function putShortMSB(s, b) {
//  put_byte(s, (Byte)(b >> 8));
//  put_byte(s, (Byte)(b & 0xff));
  s.pending_buf[s.pending++] = (b >>> 8) & 0xff;
  s.pending_buf[s.pending++] = b & 0xff;
}


/* ===========================================================================
 * Read a new buffer from the current input stream, update the adler32
 * and total number of bytes read.  All deflate() input goes through
 * this function so some applications may wish to modify it to avoid
 * allocating a large strm->input buffer and copying from it.
 * (See also flush_pending()).
 */
function read_buf(strm, buf, start, size) {
  var len = strm.avail_in;

  if (len > size) { len = size; }
  if (len === 0) { return 0; }

  strm.avail_in -= len;

  utils.arraySet(buf, strm.input, strm.next_in, len, start);
  if (strm.state.wrap === 1) {
    strm.adler = adler32(strm.adler, buf, len, start);
  }

  else if (strm.state.wrap === 2) {
    strm.adler = crc32(strm.adler, buf, len, start);
  }

  strm.next_in += len;
  strm.total_in += len;

  return len;
}


/* ===========================================================================
 * Set match_start to the longest match starting at the given string and
 * return its length. Matches shorter or equal to prev_length are discarded,
 * in which case the result is equal to prev_length and match_start is
 * garbage.
 * IN assertions: cur_match is the head of the hash chain for the current
 *   string (strstart) and its distance is <= MAX_DIST, and prev_length >= 1
 * OUT assertion: the match length is not greater than s->lookahead.
 */
function longest_match(s, cur_match) {
  var chain_length = s.max_chain_length;      /* max hash chain length */
  var scan = s.strstart; /* current string */
  var match;                       /* matched string */
  var len;                           /* length of current match */
  var best_len = s.prev_length;              /* best match length so far */
  var nice_match = s.nice_match;             /* stop if match long enough */
  var limit = (s.strstart > (s.w_size - MIN_LOOKAHEAD)) ?
      s.strstart - (s.w_size - MIN_LOOKAHEAD) : 0/*NIL*/;

  var _win = s.window; // shortcut

  var wmask = s.w_mask;
  var prev  = s.prev;

  /* Stop when cur_match becomes <= limit. To simplify the code,
   * we prevent matches with the string of window index 0.
   */

  var strend = s.strstart + MAX_MATCH;
  var scan_end1  = _win[scan + best_len - 1];
  var scan_end   = _win[scan + best_len];

  /* The code is optimized for HASH_BITS >= 8 and MAX_MATCH-2 multiple of 16.
   * It is easy to get rid of this optimization if necessary.
   */
  // Assert(s->hash_bits >= 8 && MAX_MATCH == 258, "Code too clever");

  /* Do not waste too much time if we already have a good match: */
  if (s.prev_length >= s.good_match) {
    chain_length >>= 2;
  }
  /* Do not look for matches beyond the end of the input. This is necessary
   * to make deflate deterministic.
   */
  if (nice_match > s.lookahead) { nice_match = s.lookahead; }

  // Assert((ulg)s->strstart <= s->window_size-MIN_LOOKAHEAD, "need lookahead");

  do {
    // Assert(cur_match < s->strstart, "no future");
    match = cur_match;

    /* Skip to next match if the match length cannot increase
     * or if the match length is less than 2.  Note that the checks below
     * for insufficient lookahead only occur occasionally for performance
     * reasons.  Therefore uninitialized memory will be accessed, and
     * conditional jumps will be made that depend on those values.
     * However the length of the match is limited to the lookahead, so
     * the output of deflate is not affected by the uninitialized values.
     */

    if (_win[match + best_len]     !== scan_end  ||
        _win[match + best_len - 1] !== scan_end1 ||
        _win[match]                !== _win[scan] ||
        _win[++match]              !== _win[scan + 1]) {
      continue;
    }

    /* The check at best_len-1 can be removed because it will be made
     * again later. (This heuristic is not always a win.)
     * It is not necessary to compare scan[2] and match[2] since they
     * are always equal when the other bytes match, given that
     * the hash keys are equal and that HASH_BITS >= 8.
     */
    scan += 2;
    match++;
    // Assert(*scan == *match, "match[2]?");

    /* We check for insufficient lookahead only every 8th comparison;
     * the 256th check will be made at strstart+258.
     */
    do {
      /*jshint noempty:false*/
    } while (_win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             _win[++scan] === _win[++match] && _win[++scan] === _win[++match] &&
             scan < strend);

    // Assert(scan <= s->window+(unsigned)(s->window_size-1), "wild scan");

    len = MAX_MATCH - (strend - scan);
    scan = strend - MAX_MATCH;

    if (len > best_len) {
      s.match_start = cur_match;
      best_len = len;
      if (len >= nice_match) {
        break;
      }
      scan_end1  = _win[scan + best_len - 1];
      scan_end   = _win[scan + best_len];
    }
  } while ((cur_match = prev[cur_match & wmask]) > limit && --chain_length !== 0);

  if (best_len <= s.lookahead) {
    return best_len;
  }
  return s.lookahead;
}


/* ===========================================================================
 * Fill the window when the lookahead becomes insufficient.
 * Updates strstart and lookahead.
 *
 * IN assertion: lookahead < MIN_LOOKAHEAD
 * OUT assertions: strstart <= window_size-MIN_LOOKAHEAD
 *    At least one byte has been read, or avail_in == 0; reads are
 *    performed for at least two bytes (required for the zip translate_eol
 *    option -- not supported here).
 */
function fill_window(s) {
  var _w_size = s.w_size;
  var p, n, m, more, str;

  //Assert(s->lookahead < MIN_LOOKAHEAD, "already enough lookahead");

  do {
    more = s.window_size - s.lookahead - s.strstart;

    // JS ints have 32 bit, block below not needed
    /* Deal with !@#$% 64K limit: */
    //if (sizeof(int) <= 2) {
    //    if (more == 0 && s->strstart == 0 && s->lookahead == 0) {
    //        more = wsize;
    //
    //  } else if (more == (unsigned)(-1)) {
    //        /* Very unlikely, but possible on 16 bit machine if
    //         * strstart == 0 && lookahead == 1 (input done a byte at time)
    //         */
    //        more--;
    //    }
    //}


    /* If the window is almost full and there is insufficient lookahead,
     * move the upper half to the lower one to make room in the upper half.
     */
    if (s.strstart >= _w_size + (_w_size - MIN_LOOKAHEAD)) {

      utils.arraySet(s.window, s.window, _w_size, _w_size, 0);
      s.match_start -= _w_size;
      s.strstart -= _w_size;
      /* we now have strstart >= MAX_DIST */
      s.block_start -= _w_size;

      /* Slide the hash table (could be avoided with 32 bit values
       at the expense of memory usage). We slide even when level == 0
       to keep the hash table consistent if we switch back to level > 0
       later. (Using level 0 permanently is not an optimal usage of
       zlib, so we don't care about this pathological case.)
       */

      n = s.hash_size;
      p = n;
      do {
        m = s.head[--p];
        s.head[p] = (m >= _w_size ? m - _w_size : 0);
      } while (--n);

      n = _w_size;
      p = n;
      do {
        m = s.prev[--p];
        s.prev[p] = (m >= _w_size ? m - _w_size : 0);
        /* If n is not on any hash chain, prev[n] is garbage but
         * its value will never be used.
         */
      } while (--n);

      more += _w_size;
    }
    if (s.strm.avail_in === 0) {
      break;
    }

    /* If there was no sliding:
     *    strstart <= WSIZE+MAX_DIST-1 && lookahead <= MIN_LOOKAHEAD - 1 &&
     *    more == window_size - lookahead - strstart
     * => more >= window_size - (MIN_LOOKAHEAD-1 + WSIZE + MAX_DIST-1)
     * => more >= window_size - 2*WSIZE + 2
     * In the BIG_MEM or MMAP case (not yet supported),
     *   window_size == input_size + MIN_LOOKAHEAD  &&
     *   strstart + s->lookahead <= input_size => more >= MIN_LOOKAHEAD.
     * Otherwise, window_size == 2*WSIZE so more >= 2.
     * If there was sliding, more >= WSIZE. So in all cases, more >= 2.
     */
    //Assert(more >= 2, "more < 2");
    n = read_buf(s.strm, s.window, s.strstart + s.lookahead, more);
    s.lookahead += n;

    /* Initialize the hash value now that we have some input: */
    if (s.lookahead + s.insert >= MIN_MATCH) {
      str = s.strstart - s.insert;
      s.ins_h = s.window[str];

      /* UPDATE_HASH(s, s->ins_h, s->window[str + 1]); */
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + 1]) & s.hash_mask;
//#if MIN_MATCH != 3
//        Call update_hash() MIN_MATCH-3 more times
//#endif
      while (s.insert) {
        /* UPDATE_HASH(s, s->ins_h, s->window[str + MIN_MATCH-1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[str + MIN_MATCH-1]) & s.hash_mask;

        s.prev[str & s.w_mask] = s.head[s.ins_h];
        s.head[s.ins_h] = str;
        str++;
        s.insert--;
        if (s.lookahead + s.insert < MIN_MATCH) {
          break;
        }
      }
    }
    /* If the whole input has less than MIN_MATCH bytes, ins_h is garbage,
     * but this is not important since only literal bytes will be emitted.
     */

  } while (s.lookahead < MIN_LOOKAHEAD && s.strm.avail_in !== 0);

  /* If the WIN_INIT bytes after the end of the current data have never been
   * written, then zero those bytes in order to avoid memory check reports of
   * the use of uninitialized (or uninitialised as Julian writes) bytes by
   * the longest match routines.  Update the high water mark for the next
   * time through here.  WIN_INIT is set to MAX_MATCH since the longest match
   * routines allow scanning to strstart + MAX_MATCH, ignoring lookahead.
   */
//  if (s.high_water < s.window_size) {
//    var curr = s.strstart + s.lookahead;
//    var init = 0;
//
//    if (s.high_water < curr) {
//      /* Previous high water mark below current data -- zero WIN_INIT
//       * bytes or up to end of window, whichever is less.
//       */
//      init = s.window_size - curr;
//      if (init > WIN_INIT)
//        init = WIN_INIT;
//      zmemzero(s->window + curr, (unsigned)init);
//      s->high_water = curr + init;
//    }
//    else if (s->high_water < (ulg)curr + WIN_INIT) {
//      /* High water mark at or above current data, but below current data
//       * plus WIN_INIT -- zero out to current data plus WIN_INIT, or up
//       * to end of window, whichever is less.
//       */
//      init = (ulg)curr + WIN_INIT - s->high_water;
//      if (init > s->window_size - s->high_water)
//        init = s->window_size - s->high_water;
//      zmemzero(s->window + s->high_water, (unsigned)init);
//      s->high_water += init;
//    }
//  }
//
//  Assert((ulg)s->strstart <= s->window_size - MIN_LOOKAHEAD,
//    "not enough room for search");
}

/* ===========================================================================
 * Copy without compression as much as possible from the input stream, return
 * the current block state.
 * This function does not insert new strings in the dictionary since
 * uncompressible data is probably not useful. This function is used
 * only for the level=0 compression option.
 * NOTE: this function should be optimized to avoid extra copying from
 * window to pending_buf.
 */
function deflate_stored(s, flush) {
  /* Stored blocks are limited to 0xffff bytes, pending_buf is limited
   * to pending_buf_size, and each stored block has a 5 byte header:
   */
  var max_block_size = 0xffff;

  if (max_block_size > s.pending_buf_size - 5) {
    max_block_size = s.pending_buf_size - 5;
  }

  /* Copy as much as possible from input to output: */
  for (;;) {
    /* Fill the window as much as possible: */
    if (s.lookahead <= 1) {

      //Assert(s->strstart < s->w_size+MAX_DIST(s) ||
      //  s->block_start >= (long)s->w_size, "slide too late");
//      if (!(s.strstart < s.w_size + (s.w_size - MIN_LOOKAHEAD) ||
//        s.block_start >= s.w_size)) {
//        throw  new Error("slide too late");
//      }

      fill_window(s);
      if (s.lookahead === 0 && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }

      if (s.lookahead === 0) {
        break;
      }
      /* flush the current block */
    }
    //Assert(s->block_start >= 0L, "block gone");
//    if (s.block_start < 0) throw new Error("block gone");

    s.strstart += s.lookahead;
    s.lookahead = 0;

    /* Emit a stored block if pending_buf will be full: */
    var max_start = s.block_start + max_block_size;

    if (s.strstart === 0 || s.strstart >= max_start) {
      /* strstart == 0 is possible when wraparound on 16-bit machine */
      s.lookahead = s.strstart - max_start;
      s.strstart = max_start;
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/


    }
    /* Flush if we may have to slide, otherwise block_start may become
     * negative and the data will be gone:
     */
    if (s.strstart - s.block_start >= (s.w_size - MIN_LOOKAHEAD)) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }

  s.insert = 0;

  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }

  if (s.strstart > s.block_start) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_NEED_MORE;
}

/* ===========================================================================
 * Compress as much as possible from the input stream, return the current
 * block state.
 * This function does not perform lazy evaluation of matches and inserts
 * new strings in the dictionary only for unmatched strings or for short
 * matches. It is used only for the fast compression options.
 */
function deflate_fast(s, flush) {
  var hash_head;        /* head of the hash chain */
  var bflush;           /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) {
        break; /* flush the current block */
      }
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     * At this point we have always match_length < MIN_MATCH
     */
    if (hash_head !== 0/*NIL*/ && ((s.strstart - hash_head) <= (s.w_size - MIN_LOOKAHEAD))) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */
    }
    if (s.match_length >= MIN_MATCH) {
      // check_match(s, s.strstart, s.match_start, s.match_length); // for debug only

      /*** _tr_tally_dist(s, s.strstart - s.match_start,
                     s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, s.strstart - s.match_start, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;

      /* Insert new strings in the hash table only if the match length
       * is not too large. This saves time but degrades compression.
       */
      if (s.match_length <= s.max_lazy_match/*max_insert_length*/ && s.lookahead >= MIN_MATCH) {
        s.match_length--; /* string at strstart already in table */
        do {
          s.strstart++;
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
          /* strstart never exceeds WSIZE-MAX_MATCH, so there are
           * always MIN_MATCH bytes ahead.
           */
        } while (--s.match_length !== 0);
        s.strstart++;
      } else
      {
        s.strstart += s.match_length;
        s.match_length = 0;
        s.ins_h = s.window[s.strstart];
        /* UPDATE_HASH(s, s.ins_h, s.window[s.strstart+1]); */
        s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + 1]) & s.hash_mask;

//#if MIN_MATCH != 3
//                Call UPDATE_HASH() MIN_MATCH-3 more times
//#endif
        /* If lookahead < MIN_MATCH, ins_h is garbage, but it does not
         * matter since it will be recomputed at next deflate call.
         */
      }
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s.window[s.strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = ((s.strstart < (MIN_MATCH-1)) ? s.strstart : MIN_MATCH-1);
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * Same as above, but achieves better compression. We use a lazy
 * evaluation for matches: a match is finally adopted only if there is
 * no better match at the next window position.
 */
function deflate_slow(s, flush) {
  var hash_head;          /* head of hash chain */
  var bflush;              /* set if current block must be flushed */

  var max_insert;

  /* Process the input block. */
  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the next match, plus MIN_MATCH bytes to insert the
     * string following the next match.
     */
    if (s.lookahead < MIN_LOOKAHEAD) {
      fill_window(s);
      if (s.lookahead < MIN_LOOKAHEAD && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* Insert the string window[strstart .. strstart+2] in the
     * dictionary, and set hash_head to the head of the hash chain:
     */
    hash_head = 0/*NIL*/;
    if (s.lookahead >= MIN_MATCH) {
      /*** INSERT_STRING(s, s.strstart, hash_head); ***/
      s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
      hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
      s.head[s.ins_h] = s.strstart;
      /***/
    }

    /* Find the longest match, discarding those <= prev_length.
     */
    s.prev_length = s.match_length;
    s.prev_match = s.match_start;
    s.match_length = MIN_MATCH-1;

    if (hash_head !== 0/*NIL*/ && s.prev_length < s.max_lazy_match &&
        s.strstart - hash_head <= (s.w_size-MIN_LOOKAHEAD)/*MAX_DIST(s)*/) {
      /* To simplify the code, we prevent matches with the string
       * of window index 0 (in particular we have to avoid a match
       * of the string with itself at the start of the input file).
       */
      s.match_length = longest_match(s, hash_head);
      /* longest_match() sets match_start */

      if (s.match_length <= 5 &&
         (s.strategy === Z_FILTERED || (s.match_length === MIN_MATCH && s.strstart - s.match_start > 4096/*TOO_FAR*/))) {

        /* If prev_match is also MIN_MATCH, match_start is garbage
         * but we will ignore the current match anyway.
         */
        s.match_length = MIN_MATCH-1;
      }
    }
    /* If there was a match at the previous step and the current
     * match is not better, output the previous match:
     */
    if (s.prev_length >= MIN_MATCH && s.match_length <= s.prev_length) {
      max_insert = s.strstart + s.lookahead - MIN_MATCH;
      /* Do not insert strings in hash table beyond this. */

      //check_match(s, s.strstart-1, s.prev_match, s.prev_length);

      /***_tr_tally_dist(s, s.strstart - 1 - s.prev_match,
                     s.prev_length - MIN_MATCH, bflush);***/
      bflush = trees._tr_tally(s, s.strstart - 1- s.prev_match, s.prev_length - MIN_MATCH);
      /* Insert in hash table all strings up to the end of the match.
       * strstart-1 and strstart are already inserted. If there is not
       * enough lookahead, the last two strings are not inserted in
       * the hash table.
       */
      s.lookahead -= s.prev_length-1;
      s.prev_length -= 2;
      do {
        if (++s.strstart <= max_insert) {
          /*** INSERT_STRING(s, s.strstart, hash_head); ***/
          s.ins_h = ((s.ins_h << s.hash_shift) ^ s.window[s.strstart + MIN_MATCH - 1]) & s.hash_mask;
          hash_head = s.prev[s.strstart & s.w_mask] = s.head[s.ins_h];
          s.head[s.ins_h] = s.strstart;
          /***/
        }
      } while (--s.prev_length !== 0);
      s.match_available = 0;
      s.match_length = MIN_MATCH-1;
      s.strstart++;

      if (bflush) {
        /*** FLUSH_BLOCK(s, 0); ***/
        flush_block_only(s, false);
        if (s.strm.avail_out === 0) {
          return BS_NEED_MORE;
        }
        /***/
      }

    } else if (s.match_available) {
      /* If there was no match at the previous position, output a
       * single literal. If there was a match but the current match
       * is longer, truncate the previous match to a single literal.
       */
      //Tracevv((stderr,"%c", s->window[s->strstart-1]));
      /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

      if (bflush) {
        /*** FLUSH_BLOCK_ONLY(s, 0) ***/
        flush_block_only(s, false);
        /***/
      }
      s.strstart++;
      s.lookahead--;
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
    } else {
      /* There is no previous match to compare with, wait for
       * the next step to decide.
       */
      s.match_available = 1;
      s.strstart++;
      s.lookahead--;
    }
  }
  //Assert (flush != Z_NO_FLUSH, "no flush?");
  if (s.match_available) {
    //Tracevv((stderr,"%c", s->window[s->strstart-1]));
    /*** _tr_tally_lit(s, s.window[s.strstart-1], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart-1]);

    s.match_available = 0;
  }
  s.insert = s.strstart < MIN_MATCH-1 ? s.strstart : MIN_MATCH-1;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }

  return BS_BLOCK_DONE;
}


/* ===========================================================================
 * For Z_RLE, simply look for runs of bytes, generate matches only of distance
 * one.  Do not maintain a hash table.  (It will be regenerated if this run of
 * deflate switches away from Z_RLE.)
 */
function deflate_rle(s, flush) {
  var bflush;            /* set if current block must be flushed */
  var prev;              /* byte at distance one to match */
  var scan, strend;      /* scan goes up to strend for length of run */

  var _win = s.window;

  for (;;) {
    /* Make sure that we always have enough lookahead, except
     * at the end of the input file. We need MAX_MATCH bytes
     * for the longest run, plus one for the unrolled loop.
     */
    if (s.lookahead <= MAX_MATCH) {
      fill_window(s);
      if (s.lookahead <= MAX_MATCH && flush === Z_NO_FLUSH) {
        return BS_NEED_MORE;
      }
      if (s.lookahead === 0) { break; } /* flush the current block */
    }

    /* See how many times the previous byte repeats */
    s.match_length = 0;
    if (s.lookahead >= MIN_MATCH && s.strstart > 0) {
      scan = s.strstart - 1;
      prev = _win[scan];
      if (prev === _win[++scan] && prev === _win[++scan] && prev === _win[++scan]) {
        strend = s.strstart + MAX_MATCH;
        do {
          /*jshint noempty:false*/
        } while (prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 prev === _win[++scan] && prev === _win[++scan] &&
                 scan < strend);
        s.match_length = MAX_MATCH - (strend - scan);
        if (s.match_length > s.lookahead) {
          s.match_length = s.lookahead;
        }
      }
      //Assert(scan <= s->window+(uInt)(s->window_size-1), "wild scan");
    }

    /* Emit match if have run of MIN_MATCH or longer, else emit literal */
    if (s.match_length >= MIN_MATCH) {
      //check_match(s, s.strstart, s.strstart - 1, s.match_length);

      /*** _tr_tally_dist(s, 1, s.match_length - MIN_MATCH, bflush); ***/
      bflush = trees._tr_tally(s, 1, s.match_length - MIN_MATCH);

      s.lookahead -= s.match_length;
      s.strstart += s.match_length;
      s.match_length = 0;
    } else {
      /* No match, output a literal byte */
      //Tracevv((stderr,"%c", s->window[s->strstart]));
      /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
      bflush = trees._tr_tally(s, 0, s.window[s.strstart]);

      s.lookahead--;
      s.strstart++;
    }
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* ===========================================================================
 * For Z_HUFFMAN_ONLY, do not look for matches.  Do not maintain a hash table.
 * (It will be regenerated if this run of deflate switches away from Huffman.)
 */
function deflate_huff(s, flush) {
  var bflush;             /* set if current block must be flushed */

  for (;;) {
    /* Make sure that we have a literal to write. */
    if (s.lookahead === 0) {
      fill_window(s);
      if (s.lookahead === 0) {
        if (flush === Z_NO_FLUSH) {
          return BS_NEED_MORE;
        }
        break;      /* flush the current block */
      }
    }

    /* Output a literal byte */
    s.match_length = 0;
    //Tracevv((stderr,"%c", s->window[s->strstart]));
    /*** _tr_tally_lit(s, s.window[s.strstart], bflush); ***/
    bflush = trees._tr_tally(s, 0, s.window[s.strstart]);
    s.lookahead--;
    s.strstart++;
    if (bflush) {
      /*** FLUSH_BLOCK(s, 0); ***/
      flush_block_only(s, false);
      if (s.strm.avail_out === 0) {
        return BS_NEED_MORE;
      }
      /***/
    }
  }
  s.insert = 0;
  if (flush === Z_FINISH) {
    /*** FLUSH_BLOCK(s, 1); ***/
    flush_block_only(s, true);
    if (s.strm.avail_out === 0) {
      return BS_FINISH_STARTED;
    }
    /***/
    return BS_FINISH_DONE;
  }
  if (s.last_lit) {
    /*** FLUSH_BLOCK(s, 0); ***/
    flush_block_only(s, false);
    if (s.strm.avail_out === 0) {
      return BS_NEED_MORE;
    }
    /***/
  }
  return BS_BLOCK_DONE;
}

/* Values for max_lazy_match, good_match and max_chain_length, depending on
 * the desired pack level (0..9). The values given below have been tuned to
 * exclude worst case performance for pathological files. Better values may be
 * found for specific files.
 */
var Config = function (good_length, max_lazy, nice_length, max_chain, func) {
  this.good_length = good_length;
  this.max_lazy = max_lazy;
  this.nice_length = nice_length;
  this.max_chain = max_chain;
  this.func = func;
};

var configuration_table;

configuration_table = [
  /*      good lazy nice chain */
  new Config(0, 0, 0, 0, deflate_stored),          /* 0 store only */
  new Config(4, 4, 8, 4, deflate_fast),            /* 1 max speed, no lazy matches */
  new Config(4, 5, 16, 8, deflate_fast),           /* 2 */
  new Config(4, 6, 32, 32, deflate_fast),          /* 3 */

  new Config(4, 4, 16, 16, deflate_slow),          /* 4 lazy matches */
  new Config(8, 16, 32, 32, deflate_slow),         /* 5 */
  new Config(8, 16, 128, 128, deflate_slow),       /* 6 */
  new Config(8, 32, 128, 256, deflate_slow),       /* 7 */
  new Config(32, 128, 258, 1024, deflate_slow),    /* 8 */
  new Config(32, 258, 258, 4096, deflate_slow)     /* 9 max compression */
];


/* ===========================================================================
 * Initialize the "longest match" routines for a new zlib stream
 */
function lm_init(s) {
  s.window_size = 2 * s.w_size;

  /*** CLEAR_HASH(s); ***/
  zero(s.head); // Fill with NIL (= 0);

  /* Set the default configuration parameters:
   */
  s.max_lazy_match = configuration_table[s.level].max_lazy;
  s.good_match = configuration_table[s.level].good_length;
  s.nice_match = configuration_table[s.level].nice_length;
  s.max_chain_length = configuration_table[s.level].max_chain;

  s.strstart = 0;
  s.block_start = 0;
  s.lookahead = 0;
  s.insert = 0;
  s.match_length = s.prev_length = MIN_MATCH - 1;
  s.match_available = 0;
  s.ins_h = 0;
}


function DeflateState() {
  this.strm = null;            /* pointer back to this zlib stream */
  this.status = 0;            /* as the name implies */
  this.pending_buf = null;      /* output still pending */
  this.pending_buf_size = 0;  /* size of pending_buf */
  this.pending_out = 0;       /* next pending byte to output to the stream */
  this.pending = 0;           /* nb of bytes in the pending buffer */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.gzhead = null;         /* gzip header information to write */
  this.gzindex = 0;           /* where in extra, name, or comment */
  this.method = Z_DEFLATED; /* can only be DEFLATED */
  this.last_flush = -1;   /* value of flush param for previous deflate call */

  this.w_size = 0;  /* LZ77 window size (32K by default) */
  this.w_bits = 0;  /* log2(w_size)  (8..16) */
  this.w_mask = 0;  /* w_size - 1 */

  this.window = null;
  /* Sliding window. Input bytes are read into the second half of the window,
   * and move to the first half later to keep a dictionary of at least wSize
   * bytes. With this organization, matches are limited to a distance of
   * wSize-MAX_MATCH bytes, but this ensures that IO is always
   * performed with a length multiple of the block size.
   */

  this.window_size = 0;
  /* Actual size of window: 2*wSize, except when the user input buffer
   * is directly used as sliding window.
   */

  this.prev = null;
  /* Link to older string with same hash index. To limit the size of this
   * array to 64K, this link is maintained only for the last 32K strings.
   * An index in this array is thus a window index modulo 32K.
   */

  this.head = null;   /* Heads of the hash chains or NIL. */

  this.ins_h = 0;       /* hash index of string to be inserted */
  this.hash_size = 0;   /* number of elements in hash table */
  this.hash_bits = 0;   /* log2(hash_size) */
  this.hash_mask = 0;   /* hash_size-1 */

  this.hash_shift = 0;
  /* Number of bits by which ins_h must be shifted at each input
   * step. It must be such that after MIN_MATCH steps, the oldest
   * byte no longer takes part in the hash key, that is:
   *   hash_shift * MIN_MATCH >= hash_bits
   */

  this.block_start = 0;
  /* Window position at the beginning of the current output block. Gets
   * negative when the window is moved backwards.
   */

  this.match_length = 0;      /* length of best match */
  this.prev_match = 0;        /* previous match */
  this.match_available = 0;   /* set if previous match exists */
  this.strstart = 0;          /* start of string to insert */
  this.match_start = 0;       /* start of matching string */
  this.lookahead = 0;         /* number of valid bytes ahead in window */

  this.prev_length = 0;
  /* Length of the best match at previous step. Matches not greater than this
   * are discarded. This is used in the lazy match evaluation.
   */

  this.max_chain_length = 0;
  /* To speed up deflation, hash chains are never searched beyond this
   * length.  A higher limit improves compression ratio but degrades the
   * speed.
   */

  this.max_lazy_match = 0;
  /* Attempt to find a better match only when the current match is strictly
   * smaller than this value. This mechanism is used only for compression
   * levels >= 4.
   */
  // That's alias to max_lazy_match, don't use directly
  //this.max_insert_length = 0;
  /* Insert new strings in the hash table only if the match length is not
   * greater than this length. This saves time but degrades compression.
   * max_insert_length is used only for compression levels <= 3.
   */

  this.level = 0;     /* compression level (1..9) */
  this.strategy = 0;  /* favor or force Huffman coding*/

  this.good_match = 0;
  /* Use a faster search when the previous match is longer than this */

  this.nice_match = 0; /* Stop searching when current match exceeds this */

              /* used by trees.c: */

  /* Didn't use ct_data typedef below to suppress compiler warning */

  // struct ct_data_s dyn_ltree[HEAP_SIZE];   /* literal and length tree */
  // struct ct_data_s dyn_dtree[2*D_CODES+1]; /* distance tree */
  // struct ct_data_s bl_tree[2*BL_CODES+1];  /* Huffman tree for bit lengths */

  // Use flat array of DOUBLE size, with interleaved fata,
  // because JS does not support effective
  this.dyn_ltree  = new utils.Buf16(HEAP_SIZE * 2);
  this.dyn_dtree  = new utils.Buf16((2*D_CODES+1) * 2);
  this.bl_tree    = new utils.Buf16((2*BL_CODES+1) * 2);
  zero(this.dyn_ltree);
  zero(this.dyn_dtree);
  zero(this.bl_tree);

  this.l_desc   = null;         /* desc. for literal tree */
  this.d_desc   = null;         /* desc. for distance tree */
  this.bl_desc  = null;         /* desc. for bit length tree */

  //ush bl_count[MAX_BITS+1];
  this.bl_count = new utils.Buf16(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  //int heap[2*L_CODES+1];      /* heap used to build the Huffman trees */
  this.heap = new utils.Buf16(2*L_CODES+1);  /* heap used to build the Huffman trees */
  zero(this.heap);

  this.heap_len = 0;               /* number of elements in the heap */
  this.heap_max = 0;               /* element of largest frequency */
  /* The sons of heap[n] are heap[2*n] and heap[2*n+1]. heap[0] is not used.
   * The same heap array is used to build all trees.
   */

  this.depth = new utils.Buf16(2*L_CODES+1); //uch depth[2*L_CODES+1];
  zero(this.depth);
  /* Depth of each subtree used as tie breaker for trees of equal frequency
   */

  this.l_buf = 0;          /* buffer index for literals or lengths */

  this.lit_bufsize = 0;
  /* Size of match buffer for literals/lengths.  There are 4 reasons for
   * limiting lit_bufsize to 64K:
   *   - frequencies can be kept in 16 bit counters
   *   - if compression is not successful for the first block, all input
   *     data is still in the window so we can still emit a stored block even
   *     when input comes from standard input.  (This can also be done for
   *     all blocks if lit_bufsize is not greater than 32K.)
   *   - if compression is not successful for a file smaller than 64K, we can
   *     even emit a stored file instead of a stored block (saving 5 bytes).
   *     This is applicable only for zip (not gzip or zlib).
   *   - creating new Huffman trees less frequently may not provide fast
   *     adaptation to changes in the input data statistics. (Take for
   *     example a binary file with poorly compressible code followed by
   *     a highly compressible string table.) Smaller buffer sizes give
   *     fast adaptation but have of course the overhead of transmitting
   *     trees more frequently.
   *   - I can't count above 4
   */

  this.last_lit = 0;      /* running index in l_buf */

  this.d_buf = 0;
  /* Buffer index for distances. To simplify the code, d_buf and l_buf have
   * the same number of elements. To use different lengths, an extra flag
   * array would be necessary.
   */

  this.opt_len = 0;       /* bit length of current block with optimal trees */
  this.static_len = 0;    /* bit length of current block with static trees */
  this.matches = 0;       /* number of string matches in current block */
  this.insert = 0;        /* bytes at end of window left to insert */


  this.bi_buf = 0;
  /* Output buffer. bits are inserted starting at the bottom (least
   * significant bits).
   */
  this.bi_valid = 0;
  /* Number of valid bits in bi_buf.  All bits above the last valid bit
   * are always zero.
   */

  // Used for window memory init. We safely ignore it for JS. That makes
  // sense only for pointers and memory check tools.
  //this.high_water = 0;
  /* High water mark offset in window for initialized bytes -- bytes above
   * this are set to zero in order to avoid memory check warnings when
   * longest match routines access bytes past the input.  This is then
   * updated to the new high water mark.
   */
}


function deflateResetKeep(strm) {
  var s;

  if (!strm || !strm.state) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.total_in = strm.total_out = 0;
  strm.data_type = Z_UNKNOWN;

  s = strm.state;
  s.pending = 0;
  s.pending_out = 0;

  if (s.wrap < 0) {
    s.wrap = -s.wrap;
    /* was made negative by deflate(..., Z_FINISH); */
  }
  s.status = (s.wrap ? INIT_STATE : BUSY_STATE);
  strm.adler = (s.wrap === 2) ?
    0  // crc32(0, Z_NULL, 0)
  :
    1; // adler32(0, Z_NULL, 0)
  s.last_flush = Z_NO_FLUSH;
  trees._tr_init(s);
  return Z_OK;
}


function deflateReset(strm) {
  var ret = deflateResetKeep(strm);
  if (ret === Z_OK) {
    lm_init(strm.state);
  }
  return ret;
}


function deflateSetHeader(strm, head) {
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  if (strm.state.wrap !== 2) { return Z_STREAM_ERROR; }
  strm.state.gzhead = head;
  return Z_OK;
}


function deflateInit2(strm, level, method, windowBits, memLevel, strategy) {
  if (!strm) { // === Z_NULL
    return Z_STREAM_ERROR;
  }
  var wrap = 1;

  if (level === Z_DEFAULT_COMPRESSION) {
    level = 6;
  }

  if (windowBits < 0) { /* suppress zlib wrapper */
    wrap = 0;
    windowBits = -windowBits;
  }

  else if (windowBits > 15) {
    wrap = 2;           /* write gzip wrapper instead */
    windowBits -= 16;
  }


  if (memLevel < 1 || memLevel > MAX_MEM_LEVEL || method !== Z_DEFLATED ||
    windowBits < 8 || windowBits > 15 || level < 0 || level > 9 ||
    strategy < 0 || strategy > Z_FIXED) {
    return err(strm, Z_STREAM_ERROR);
  }


  if (windowBits === 8) {
    windowBits = 9;
  }
  /* until 256-byte window bug fixed */

  var s = new DeflateState();

  strm.state = s;
  s.strm = strm;

  s.wrap = wrap;
  s.gzhead = null;
  s.w_bits = windowBits;
  s.w_size = 1 << s.w_bits;
  s.w_mask = s.w_size - 1;

  s.hash_bits = memLevel + 7;
  s.hash_size = 1 << s.hash_bits;
  s.hash_mask = s.hash_size - 1;
  s.hash_shift = ~~((s.hash_bits + MIN_MATCH - 1) / MIN_MATCH);

  s.window = new utils.Buf8(s.w_size * 2);
  s.head = new utils.Buf16(s.hash_size);
  s.prev = new utils.Buf16(s.w_size);

  // Don't need mem init magic for JS.
  //s.high_water = 0;  /* nothing written to s->window yet */

  s.lit_bufsize = 1 << (memLevel + 6); /* 16K elements by default */

  s.pending_buf_size = s.lit_bufsize * 4;
  s.pending_buf = new utils.Buf8(s.pending_buf_size);

  s.d_buf = s.lit_bufsize >> 1;
  s.l_buf = (1 + 2) * s.lit_bufsize;

  s.level = level;
  s.strategy = strategy;
  s.method = method;

  return deflateReset(strm);
}

function deflateInit(strm, level) {
  return deflateInit2(strm, level, Z_DEFLATED, MAX_WBITS, DEF_MEM_LEVEL, Z_DEFAULT_STRATEGY);
}


function deflate(strm, flush) {
  var old_flush, s;
  var beg, val; // for gzip header write only

  if (!strm || !strm.state ||
    flush > Z_BLOCK || flush < 0) {
    return strm ? err(strm, Z_STREAM_ERROR) : Z_STREAM_ERROR;
  }

  s = strm.state;

  if (!strm.output ||
      (!strm.input && strm.avail_in !== 0) ||
      (s.status === FINISH_STATE && flush !== Z_FINISH)) {
    return err(strm, (strm.avail_out === 0) ? Z_BUF_ERROR : Z_STREAM_ERROR);
  }

  s.strm = strm; /* just in case */
  old_flush = s.last_flush;
  s.last_flush = flush;

  /* Write the header */
  if (s.status === INIT_STATE) {

    if (s.wrap === 2) { // GZIP header
      strm.adler = 0;  //crc32(0L, Z_NULL, 0);
      put_byte(s, 31);
      put_byte(s, 139);
      put_byte(s, 8);
      if (!s.gzhead) { // s->gzhead == Z_NULL
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, 0);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, OS_CODE);
        s.status = BUSY_STATE;
      }
      else {
        put_byte(s, (s.gzhead.text ? 1 : 0) +
                    (s.gzhead.hcrc ? 2 : 0) +
                    (!s.gzhead.extra ? 0 : 4) +
                    (!s.gzhead.name ? 0 : 8) +
                    (!s.gzhead.comment ? 0 : 16)
                );
        put_byte(s, s.gzhead.time & 0xff);
        put_byte(s, (s.gzhead.time >> 8) & 0xff);
        put_byte(s, (s.gzhead.time >> 16) & 0xff);
        put_byte(s, (s.gzhead.time >> 24) & 0xff);
        put_byte(s, s.level === 9 ? 2 :
                    (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2 ?
                     4 : 0));
        put_byte(s, s.gzhead.os & 0xff);
        if (s.gzhead.extra && s.gzhead.extra.length) {
          put_byte(s, s.gzhead.extra.length & 0xff);
          put_byte(s, (s.gzhead.extra.length >> 8) & 0xff);
        }
        if (s.gzhead.hcrc) {
          strm.adler = crc32(strm.adler, s.pending_buf, s.pending, 0);
        }
        s.gzindex = 0;
        s.status = EXTRA_STATE;
      }
    }
    else // DEFLATE header
    {
      var header = (Z_DEFLATED + ((s.w_bits - 8) << 4)) << 8;
      var level_flags = -1;

      if (s.strategy >= Z_HUFFMAN_ONLY || s.level < 2) {
        level_flags = 0;
      } else if (s.level < 6) {
        level_flags = 1;
      } else if (s.level === 6) {
        level_flags = 2;
      } else {
        level_flags = 3;
      }
      header |= (level_flags << 6);
      if (s.strstart !== 0) { header |= PRESET_DICT; }
      header += 31 - (header % 31);

      s.status = BUSY_STATE;
      putShortMSB(s, header);

      /* Save the adler32 of the preset dictionary: */
      if (s.strstart !== 0) {
        putShortMSB(s, strm.adler >>> 16);
        putShortMSB(s, strm.adler & 0xffff);
      }
      strm.adler = 1; // adler32(0L, Z_NULL, 0);
    }
  }

//#ifdef GZIP
  if (s.status === EXTRA_STATE) {
    if (s.gzhead.extra/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */

      while (s.gzindex < (s.gzhead.extra.length & 0xffff)) {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            break;
          }
        }
        put_byte(s, s.gzhead.extra[s.gzindex] & 0xff);
        s.gzindex++;
      }
      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (s.gzindex === s.gzhead.extra.length) {
        s.gzindex = 0;
        s.status = NAME_STATE;
      }
    }
    else {
      s.status = NAME_STATE;
    }
  }
  if (s.status === NAME_STATE) {
    if (s.gzhead.name/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.name.length) {
          val = s.gzhead.name.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg){
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.gzindex = 0;
        s.status = COMMENT_STATE;
      }
    }
    else {
      s.status = COMMENT_STATE;
    }
  }
  if (s.status === COMMENT_STATE) {
    if (s.gzhead.comment/* != Z_NULL*/) {
      beg = s.pending;  /* start of bytes to update crc */
      //int val;

      do {
        if (s.pending === s.pending_buf_size) {
          if (s.gzhead.hcrc && s.pending > beg) {
            strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
          }
          flush_pending(strm);
          beg = s.pending;
          if (s.pending === s.pending_buf_size) {
            val = 1;
            break;
          }
        }
        // JS specific: little magic to add zero terminator to end of string
        if (s.gzindex < s.gzhead.comment.length) {
          val = s.gzhead.comment.charCodeAt(s.gzindex++) & 0xff;
        } else {
          val = 0;
        }
        put_byte(s, val);
      } while (val !== 0);

      if (s.gzhead.hcrc && s.pending > beg) {
        strm.adler = crc32(strm.adler, s.pending_buf, s.pending - beg, beg);
      }
      if (val === 0) {
        s.status = HCRC_STATE;
      }
    }
    else {
      s.status = HCRC_STATE;
    }
  }
  if (s.status === HCRC_STATE) {
    if (s.gzhead.hcrc) {
      if (s.pending + 2 > s.pending_buf_size) {
        flush_pending(strm);
      }
      if (s.pending + 2 <= s.pending_buf_size) {
        put_byte(s, strm.adler & 0xff);
        put_byte(s, (strm.adler >> 8) & 0xff);
        strm.adler = 0; //crc32(0L, Z_NULL, 0);
        s.status = BUSY_STATE;
      }
    }
    else {
      s.status = BUSY_STATE;
    }
  }
//#endif

  /* Flush as much pending output as possible */
  if (s.pending !== 0) {
    flush_pending(strm);
    if (strm.avail_out === 0) {
      /* Since avail_out is 0, deflate will be called again with
       * more output space, but possibly with both pending and
       * avail_in equal to zero. There won't be anything to do,
       * but this is not an error situation so make sure we
       * return OK instead of BUF_ERROR at next call of deflate:
       */
      s.last_flush = -1;
      return Z_OK;
    }

    /* Make sure there is something to do and avoid duplicate consecutive
     * flushes. For repeated and useless calls with Z_FINISH, we keep
     * returning Z_STREAM_END instead of Z_BUF_ERROR.
     */
  } else if (strm.avail_in === 0 && rank(flush) <= rank(old_flush) &&
    flush !== Z_FINISH) {
    return err(strm, Z_BUF_ERROR);
  }

  /* User must not provide more input after the first FINISH: */
  if (s.status === FINISH_STATE && strm.avail_in !== 0) {
    return err(strm, Z_BUF_ERROR);
  }

  /* Start a new block or continue the current one.
   */
  if (strm.avail_in !== 0 || s.lookahead !== 0 ||
    (flush !== Z_NO_FLUSH && s.status !== FINISH_STATE)) {
    var bstate = (s.strategy === Z_HUFFMAN_ONLY) ? deflate_huff(s, flush) :
      (s.strategy === Z_RLE ? deflate_rle(s, flush) :
        configuration_table[s.level].func(s, flush));

    if (bstate === BS_FINISH_STARTED || bstate === BS_FINISH_DONE) {
      s.status = FINISH_STATE;
    }
    if (bstate === BS_NEED_MORE || bstate === BS_FINISH_STARTED) {
      if (strm.avail_out === 0) {
        s.last_flush = -1;
        /* avoid BUF_ERROR next call, see above */
      }
      return Z_OK;
      /* If flush != Z_NO_FLUSH && avail_out == 0, the next call
       * of deflate should use the same flush parameter to make sure
       * that the flush is complete. So we don't have to output an
       * empty block here, this will be done at next call. This also
       * ensures that for a very small output buffer, we emit at most
       * one empty block.
       */
    }
    if (bstate === BS_BLOCK_DONE) {
      if (flush === Z_PARTIAL_FLUSH) {
        trees._tr_align(s);
      }
      else if (flush !== Z_BLOCK) { /* FULL_FLUSH or SYNC_FLUSH */

        trees._tr_stored_block(s, 0, 0, false);
        /* For a full flush, this empty block will be recognized
         * as a special marker by inflate_sync().
         */
        if (flush === Z_FULL_FLUSH) {
          /*** CLEAR_HASH(s); ***/             /* forget history */
          zero(s.head); // Fill with NIL (= 0);

          if (s.lookahead === 0) {
            s.strstart = 0;
            s.block_start = 0;
            s.insert = 0;
          }
        }
      }
      flush_pending(strm);
      if (strm.avail_out === 0) {
        s.last_flush = -1; /* avoid BUF_ERROR at next call, see above */
        return Z_OK;
      }
    }
  }
  //Assert(strm->avail_out > 0, "bug2");
  //if (strm.avail_out <= 0) { throw new Error("bug2");}

  if (flush !== Z_FINISH) { return Z_OK; }
  if (s.wrap <= 0) { return Z_STREAM_END; }

  /* Write the trailer */
  if (s.wrap === 2) {
    put_byte(s, strm.adler & 0xff);
    put_byte(s, (strm.adler >> 8) & 0xff);
    put_byte(s, (strm.adler >> 16) & 0xff);
    put_byte(s, (strm.adler >> 24) & 0xff);
    put_byte(s, strm.total_in & 0xff);
    put_byte(s, (strm.total_in >> 8) & 0xff);
    put_byte(s, (strm.total_in >> 16) & 0xff);
    put_byte(s, (strm.total_in >> 24) & 0xff);
  }
  else
  {
    putShortMSB(s, strm.adler >>> 16);
    putShortMSB(s, strm.adler & 0xffff);
  }

  flush_pending(strm);
  /* If avail_out is zero, the application will call deflate again
   * to flush the rest.
   */
  if (s.wrap > 0) { s.wrap = -s.wrap; }
  /* write the trailer only once! */
  return s.pending !== 0 ? Z_OK : Z_STREAM_END;
}

function deflateEnd(strm) {
  var status;

  if (!strm/*== Z_NULL*/ || !strm.state/*== Z_NULL*/) {
    return Z_STREAM_ERROR;
  }

  status = strm.state.status;
  if (status !== INIT_STATE &&
    status !== EXTRA_STATE &&
    status !== NAME_STATE &&
    status !== COMMENT_STATE &&
    status !== HCRC_STATE &&
    status !== BUSY_STATE &&
    status !== FINISH_STATE
  ) {
    return err(strm, Z_STREAM_ERROR);
  }

  strm.state = null;

  return status === BUSY_STATE ? err(strm, Z_DATA_ERROR) : Z_OK;
}

/* =========================================================================
 * Copy the source state to the destination state
 */
//function deflateCopy(dest, source) {
//
//}

exports.deflateInit = deflateInit;
exports.deflateInit2 = deflateInit2;
exports.deflateReset = deflateReset;
exports.deflateResetKeep = deflateResetKeep;
exports.deflateSetHeader = deflateSetHeader;
exports.deflate = deflate;
exports.deflateEnd = deflateEnd;
exports.deflateInfo = 'pako deflate (from Nodeca project)';

/* Not implemented
exports.deflateBound = deflateBound;
exports.deflateCopy = deflateCopy;
exports.deflateSetDictionary = deflateSetDictionary;
exports.deflateParams = deflateParams;
exports.deflatePending = deflatePending;
exports.deflatePrime = deflatePrime;
exports.deflateTune = deflateTune;
*/
},{"../utils/common":18,"./adler32":20,"./crc32":22,"./messages":28,"./trees":29}],24:[function(require,module,exports){
'use strict';


function GZheader() {
  /* true if compressed data believed to be text */
  this.text       = 0;
  /* modification time */
  this.time       = 0;
  /* extra flags (not used when writing a gzip file) */
  this.xflags     = 0;
  /* operating system */
  this.os         = 0;
  /* pointer to extra field or Z_NULL if none */
  this.extra      = null;
  /* extra field length (valid if extra != Z_NULL) */
  this.extra_len  = 0; // Actually, we don't need it in JS,
                       // but leave for few code modifications

  //
  // Setup limits is not necessary because in js we should not preallocate memory 
  // for inflate use constant limit in 65536 bytes
  //

  /* space at extra (only when reading header) */
  // this.extra_max  = 0;
  /* pointer to zero-terminated file name or Z_NULL */
  this.name       = '';
  /* space at name (only when reading header) */
  // this.name_max   = 0;
  /* pointer to zero-terminated comment or Z_NULL */
  this.comment    = '';
  /* space at comment (only when reading header) */
  // this.comm_max   = 0;
  /* true if there was or will be a header crc */
  this.hcrc       = 0;
  /* true when done reading gzip header (not used when writing a gzip file) */
  this.done       = false;
}

module.exports = GZheader;
},{}],25:[function(require,module,exports){
'use strict';

// See state defs from inflate.js
var BAD = 30;       /* got a data error -- remain here until reset */
var TYPE = 12;      /* i: waiting for type bits, including last-flag bit */

/*
   Decode literal, length, and distance codes and write out the resulting
   literal and match bytes until either not enough input or output is
   available, an end-of-block is encountered, or a data error is encountered.
   When large enough input and output buffers are supplied to inflate(), for
   example, a 16K input buffer and a 64K output buffer, more than 95% of the
   inflate execution time is spent in this routine.

   Entry assumptions:

        state.mode === LEN
        strm.avail_in >= 6
        strm.avail_out >= 258
        start >= strm.avail_out
        state.bits < 8

   On return, state.mode is one of:

        LEN -- ran out of enough output space or enough available input
        TYPE -- reached end of block code, inflate() to interpret next block
        BAD -- error in block data

   Notes:

    - The maximum input bits used by a length/distance pair is 15 bits for the
      length code, 5 bits for the length extra, 15 bits for the distance code,
      and 13 bits for the distance extra.  This totals 48 bits, or six bytes.
      Therefore if strm.avail_in >= 6, then there is enough input to avoid
      checking for available input while decoding.

    - The maximum bytes that a single length/distance pair can output is 258
      bytes, which is the maximum length that can be coded.  inflate_fast()
      requires strm.avail_out >= 258 for each loop to avoid checking for
      output space.
 */
module.exports = function inflate_fast(strm, start) {
  var state;
  var _in;                    /* local strm.input */
  var last;                   /* have enough input while in < last */
  var _out;                   /* local strm.output */
  var beg;                    /* inflate()'s initial strm.output */
  var end;                    /* while out < end, enough space available */
//#ifdef INFLATE_STRICT
  var dmax;                   /* maximum distance from zlib header */
//#endif
  var wsize;                  /* window size or zero if not using window */
  var whave;                  /* valid bytes in the window */
  var wnext;                  /* window write index */
  var window;                 /* allocated sliding window, if wsize != 0 */
  var hold;                   /* local strm.hold */
  var bits;                   /* local strm.bits */
  var lcode;                  /* local strm.lencode */
  var dcode;                  /* local strm.distcode */
  var lmask;                  /* mask for first level of length codes */
  var dmask;                  /* mask for first level of distance codes */
  var here;                   /* retrieved table entry */
  var op;                     /* code bits, operation, extra bits, or */
                              /*  window position, window bytes to copy */
  var len;                    /* match length, unused bytes */
  var dist;                   /* match distance */
  var from;                   /* where to copy match from */
  var from_source;


  var input, output; // JS specific, because we have no pointers

  /* copy state to local variables */
  state = strm.state;
  //here = state.here;
  _in = strm.next_in;
  input = strm.input;
  last = _in + (strm.avail_in - 5);
  _out = strm.next_out;
  output = strm.output;
  beg = _out - (start - strm.avail_out);
  end = _out + (strm.avail_out - 257);
//#ifdef INFLATE_STRICT
  dmax = state.dmax;
//#endif
  wsize = state.wsize;
  whave = state.whave;
  wnext = state.wnext;
  window = state.window;
  hold = state.hold;
  bits = state.bits;
  lcode = state.lencode;
  dcode = state.distcode;
  lmask = (1 << state.lenbits) - 1;
  dmask = (1 << state.distbits) - 1;


  /* decode literals and length/distances until end-of-block or not enough
     input data or output space */

  top:
  do {
    if (bits < 15) {
      hold += input[_in++] << bits;
      bits += 8;
      hold += input[_in++] << bits;
      bits += 8;
    }

    here = lcode[hold & lmask];

    dolen:
    for (;;) { // Goto emulation
      op = here >>> 24/*here.bits*/;
      hold >>>= op;
      bits -= op;
      op = (here >>> 16) & 0xff/*here.op*/;
      if (op === 0) {                          /* literal */
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        output[_out++] = here & 0xffff/*here.val*/;
      }
      else if (op & 16) {                     /* length base */
        len = here & 0xffff/*here.val*/;
        op &= 15;                           /* number of extra bits */
        if (op) {
          if (bits < op) {
            hold += input[_in++] << bits;
            bits += 8;
          }
          len += hold & ((1 << op) - 1);
          hold >>>= op;
          bits -= op;
        }
        //Tracevv((stderr, "inflate:         length %u\n", len));
        if (bits < 15) {
          hold += input[_in++] << bits;
          bits += 8;
          hold += input[_in++] << bits;
          bits += 8;
        }
        here = dcode[hold & dmask];

        dodist:
        for (;;) { // goto emulation
          op = here >>> 24/*here.bits*/;
          hold >>>= op;
          bits -= op;
          op = (here >>> 16) & 0xff/*here.op*/;

          if (op & 16) {                      /* distance base */
            dist = here & 0xffff/*here.val*/;
            op &= 15;                       /* number of extra bits */
            if (bits < op) {
              hold += input[_in++] << bits;
              bits += 8;
              if (bits < op) {
                hold += input[_in++] << bits;
                bits += 8;
              }
            }
            dist += hold & ((1 << op) - 1);
//#ifdef INFLATE_STRICT
            if (dist > dmax) {
              strm.msg = 'invalid distance too far back';
              state.mode = BAD;
              break top;
            }
//#endif
            hold >>>= op;
            bits -= op;
            //Tracevv((stderr, "inflate:         distance %u\n", dist));
            op = _out - beg;                /* max distance in output */
            if (dist > op) {                /* see if copy from window */
              op = dist - op;               /* distance back in window */
              if (op > whave) {
                if (state.sane) {
                  strm.msg = 'invalid distance too far back';
                  state.mode = BAD;
                  break top;
                }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//                if (len <= op - whave) {
//                  do {
//                    output[_out++] = 0;
//                  } while (--len);
//                  continue top;
//                }
//                len -= op - whave;
//                do {
//                  output[_out++] = 0;
//                } while (--op > whave);
//                if (op === 0) {
//                  from = _out - dist;
//                  do {
//                    output[_out++] = output[from++];
//                  } while (--len);
//                  continue top;
//                }
//#endif
              }
              from = 0; // window index
              from_source = window;
              if (wnext === 0) {           /* very common case */
                from += wsize - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              else if (wnext < op) {      /* wrap around window */
                from += wsize + wnext - op;
                op -= wnext;
                if (op < len) {         /* some from end of window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = 0;
                  if (wnext < len) {  /* some from start of window */
                    op = wnext;
                    len -= op;
                    do {
                      output[_out++] = window[from++];
                    } while (--op);
                    from = _out - dist;      /* rest from output */
                    from_source = output;
                  }
                }
              }
              else {                      /* contiguous in window */
                from += wnext - op;
                if (op < len) {         /* some from window */
                  len -= op;
                  do {
                    output[_out++] = window[from++];
                  } while (--op);
                  from = _out - dist;  /* rest from output */
                  from_source = output;
                }
              }
              while (len > 2) {
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                output[_out++] = from_source[from++];
                len -= 3;
              }
              if (len) {
                output[_out++] = from_source[from++];
                if (len > 1) {
                  output[_out++] = from_source[from++];
                }
              }
            }
            else {
              from = _out - dist;          /* copy direct from output */
              do {                        /* minimum length is three */
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                output[_out++] = output[from++];
                len -= 3;
              } while (len > 2);
              if (len) {
                output[_out++] = output[from++];
                if (len > 1) {
                  output[_out++] = output[from++];
                }
              }
            }
          }
          else if ((op & 64) === 0) {          /* 2nd level distance code */
            here = dcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
            continue dodist;
          }
          else {
            strm.msg = 'invalid distance code';
            state.mode = BAD;
            break top;
          }

          break; // need to emulate goto via "continue"
        }
      }
      else if ((op & 64) === 0) {              /* 2nd level length code */
        here = lcode[(here & 0xffff)/*here.val*/ + (hold & ((1 << op) - 1))];
        continue dolen;
      }
      else if (op & 32) {                     /* end-of-block */
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.mode = TYPE;
        break top;
      }
      else {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break top;
      }

      break; // need to emulate goto via "continue"
    }
  } while (_in < last && _out < end);

  /* return unused bytes (on entry, bits < 8, so in won't go too far back) */
  len = bits >> 3;
  _in -= len;
  bits -= len << 3;
  hold &= (1 << bits) - 1;

  /* update state and return */
  strm.next_in = _in;
  strm.next_out = _out;
  strm.avail_in = (_in < last ? 5 + (last - _in) : 5 - (_in - last));
  strm.avail_out = (_out < end ? 257 + (end - _out) : 257 - (_out - end));
  state.hold = hold;
  state.bits = bits;
  return;
};

},{}],26:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');
var adler32 = require('./adler32');
var crc32   = require('./crc32');
var inflate_fast = require('./inffast');
var inflate_table = require('./inftrees');

var CODES = 0;
var LENS = 1;
var DISTS = 2;

/* Public constants ==========================================================*/
/* ===========================================================================*/


/* Allowed flush values; see deflate() and inflate() below for details */
//var Z_NO_FLUSH      = 0;
//var Z_PARTIAL_FLUSH = 1;
//var Z_SYNC_FLUSH    = 2;
//var Z_FULL_FLUSH    = 3;
var Z_FINISH        = 4;
var Z_BLOCK         = 5;
var Z_TREES         = 6;


/* Return codes for the compression/decompression functions. Negative values
 * are errors, positive values are used for special but normal events.
 */
var Z_OK            = 0;
var Z_STREAM_END    = 1;
var Z_NEED_DICT     = 2;
//var Z_ERRNO         = -1;
var Z_STREAM_ERROR  = -2;
var Z_DATA_ERROR    = -3;
var Z_MEM_ERROR     = -4;
var Z_BUF_ERROR     = -5;
//var Z_VERSION_ERROR = -6;

/* The deflate compression method */
var Z_DEFLATED  = 8;


/* STATES ====================================================================*/
/* ===========================================================================*/


var    HEAD = 1;       /* i: waiting for magic header */
var    FLAGS = 2;      /* i: waiting for method and flags (gzip) */
var    TIME = 3;       /* i: waiting for modification time (gzip) */
var    OS = 4;         /* i: waiting for extra flags and operating system (gzip) */
var    EXLEN = 5;      /* i: waiting for extra length (gzip) */
var    EXTRA = 6;      /* i: waiting for extra bytes (gzip) */
var    NAME = 7;       /* i: waiting for end of file name (gzip) */
var    COMMENT = 8;    /* i: waiting for end of comment (gzip) */
var    HCRC = 9;       /* i: waiting for header crc (gzip) */
var    DICTID = 10;    /* i: waiting for dictionary check value */
var    DICT = 11;      /* waiting for inflateSetDictionary() call */
var        TYPE = 12;      /* i: waiting for type bits, including last-flag bit */
var        TYPEDO = 13;    /* i: same, but skip check to exit inflate on new block */
var        STORED = 14;    /* i: waiting for stored size (length and complement) */
var        COPY_ = 15;     /* i/o: same as COPY below, but only first time in */
var        COPY = 16;      /* i/o: waiting for input or output to copy stored block */
var        TABLE = 17;     /* i: waiting for dynamic block table lengths */
var        LENLENS = 18;   /* i: waiting for code length code lengths */
var        CODELENS = 19;  /* i: waiting for length/lit and distance code lengths */
var            LEN_ = 20;      /* i: same as LEN below, but only first time in */
var            LEN = 21;       /* i: waiting for length/lit/eob code */
var            LENEXT = 22;    /* i: waiting for length extra bits */
var            DIST = 23;      /* i: waiting for distance code */
var            DISTEXT = 24;   /* i: waiting for distance extra bits */
var            MATCH = 25;     /* o: waiting for output space to copy string */
var            LIT = 26;       /* o: waiting for output space to write literal */
var    CHECK = 27;     /* i: waiting for 32-bit check value */
var    LENGTH = 28;    /* i: waiting for 32-bit length (gzip) */
var    DONE = 29;      /* finished check, done -- remain here until reset */
var    BAD = 30;       /* got a data error -- remain here until reset */
var    MEM = 31;       /* got an inflate() memory error -- remain here until reset */
var    SYNC = 32;      /* looking for synchronization bytes to restart inflate() */

/* ===========================================================================*/



var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH =  (ENOUGH_LENS+ENOUGH_DISTS);

var MAX_WBITS = 15;
/* 32K LZ77 window */
var DEF_WBITS = MAX_WBITS;


function ZSWAP32(q) {
  return  (((q >>> 24) & 0xff) +
          ((q >>> 8) & 0xff00) +
          ((q & 0xff00) << 8) +
          ((q & 0xff) << 24));
}


function InflateState() {
  this.mode = 0;             /* current inflate mode */
  this.last = false;          /* true if processing last block */
  this.wrap = 0;              /* bit 0 true for zlib, bit 1 true for gzip */
  this.havedict = false;      /* true if dictionary provided */
  this.flags = 0;             /* gzip header method and flags (0 if zlib) */
  this.dmax = 0;              /* zlib header max distance (INFLATE_STRICT) */
  this.check = 0;             /* protected copy of check value */
  this.total = 0;             /* protected copy of output count */
  // TODO: may be {}
  this.head = null;           /* where to save gzip header information */

  /* sliding window */
  this.wbits = 0;             /* log base 2 of requested window size */
  this.wsize = 0;             /* window size or zero if not using window */
  this.whave = 0;             /* valid bytes in the window */
  this.wnext = 0;             /* window write index */
  this.window = null;         /* allocated sliding window, if needed */

  /* bit accumulator */
  this.hold = 0;              /* input bit accumulator */
  this.bits = 0;              /* number of bits in "in" */

  /* for string and stored block copying */
  this.length = 0;            /* literal or length of data to copy */
  this.offset = 0;            /* distance back to copy string from */

  /* for table and code decoding */
  this.extra = 0;             /* extra bits needed */

  /* fixed and dynamic code tables */
  this.lencode = null;          /* starting table for length/literal codes */
  this.distcode = null;         /* starting table for distance codes */
  this.lenbits = 0;           /* index bits for lencode */
  this.distbits = 0;          /* index bits for distcode */

  /* dynamic table building */
  this.ncode = 0;             /* number of code length code lengths */
  this.nlen = 0;              /* number of length code lengths */
  this.ndist = 0;             /* number of distance code lengths */
  this.have = 0;              /* number of code lengths in lens[] */
  this.next = null;              /* next available space in codes[] */

  this.lens = new utils.Buf16(320); /* temporary storage for code lengths */
  this.work = new utils.Buf16(288); /* work area for code table building */

  /*
   because we don't have pointers in js, we use lencode and distcode directly
   as buffers so we don't need codes
  */
  //this.codes = new utils.Buf32(ENOUGH);       /* space for code tables */
  this.lendyn = null;              /* dynamic table for length/literal codes (JS specific) */
  this.distdyn = null;             /* dynamic table for distance codes (JS specific) */
  this.sane = 0;                   /* if false, allow invalid distance too far */
  this.back = 0;                   /* bits back of last unprocessed length/lit */
  this.was = 0;                    /* initial length of match */
}

function inflateResetKeep(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  strm.total_in = strm.total_out = state.total = 0;
  strm.msg = ''; /*Z_NULL*/
  if (state.wrap) {       /* to support ill-conceived Java test suite */
    strm.adler = state.wrap & 1;
  }
  state.mode = HEAD;
  state.last = 0;
  state.havedict = 0;
  state.dmax = 32768;
  state.head = null/*Z_NULL*/;
  state.hold = 0;
  state.bits = 0;
  //state.lencode = state.distcode = state.next = state.codes;
  state.lencode = state.lendyn = new utils.Buf32(ENOUGH_LENS);
  state.distcode = state.distdyn = new utils.Buf32(ENOUGH_DISTS);

  state.sane = 1;
  state.back = -1;
  //Tracev((stderr, "inflate: reset\n"));
  return Z_OK;
}

function inflateReset(strm) {
  var state;

  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  state.wsize = 0;
  state.whave = 0;
  state.wnext = 0;
  return inflateResetKeep(strm);

}

function inflateReset2(strm, windowBits) {
  var wrap;
  var state;

  /* get the state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;

  /* extract wrap request from windowBits parameter */
  if (windowBits < 0) {
    wrap = 0;
    windowBits = -windowBits;
  }
  else {
    wrap = (windowBits >> 4) + 1;
    if (windowBits < 48) {
      windowBits &= 15;
    }
  }

  /* set number of window bits, free window if different */
  if (windowBits && (windowBits < 8 || windowBits > 15)) {
    return Z_STREAM_ERROR;
  }
  if (state.window !== null && state.wbits !== windowBits) {
    state.window = null;
  }

  /* update state and reset the rest of it */
  state.wrap = wrap;
  state.wbits = windowBits;
  return inflateReset(strm);
}

function inflateInit2(strm, windowBits) {
  var ret;
  var state;

  if (!strm) { return Z_STREAM_ERROR; }
  //strm.msg = Z_NULL;                 /* in case we return an error */

  state = new InflateState();

  //if (state === Z_NULL) return Z_MEM_ERROR;
  //Tracev((stderr, "inflate: allocated\n"));
  strm.state = state;
  state.window = null/*Z_NULL*/;
  ret = inflateReset2(strm, windowBits);
  if (ret !== Z_OK) {
    strm.state = null/*Z_NULL*/;
  }
  return ret;
}

function inflateInit(strm) {
  return inflateInit2(strm, DEF_WBITS);
}


/*
 Return state with length and distance decoding tables and index sizes set to
 fixed code decoding.  Normally this returns fixed tables from inffixed.h.
 If BUILDFIXED is defined, then instead this routine builds the tables the
 first time it's called, and returns those tables the first time and
 thereafter.  This reduces the size of the code by about 2K bytes, in
 exchange for a little execution time.  However, BUILDFIXED should not be
 used for threaded applications, since the rewriting of the tables and virgin
 may not be thread-safe.
 */
var virgin = true;

var lenfix, distfix; // We have no pointers in JS, so keep tables separate

function fixedtables(state) {
  /* build fixed huffman tables if first call (may not be thread safe) */
  if (virgin) {
    var sym;

    lenfix = new utils.Buf32(512);
    distfix = new utils.Buf32(32);

    /* literal/length table */
    sym = 0;
    while (sym < 144) { state.lens[sym++] = 8; }
    while (sym < 256) { state.lens[sym++] = 9; }
    while (sym < 280) { state.lens[sym++] = 7; }
    while (sym < 288) { state.lens[sym++] = 8; }

    inflate_table(LENS,  state.lens, 0, 288, lenfix,   0, state.work, {bits: 9});

    /* distance table */
    sym = 0;
    while (sym < 32) { state.lens[sym++] = 5; }

    inflate_table(DISTS, state.lens, 0, 32,   distfix, 0, state.work, {bits: 5});

    /* do this just once */
    virgin = false;
  }

  state.lencode = lenfix;
  state.lenbits = 9;
  state.distcode = distfix;
  state.distbits = 5;
}


/*
 Update the window with the last wsize (normally 32K) bytes written before
 returning.  If window does not exist yet, create it.  This is only called
 when a window is already in use, or when output has been written during this
 inflate call, but the end of the deflate stream has not been reached yet.
 It is also called to create a window for dictionary data when a dictionary
 is loaded.

 Providing output buffers larger than 32K to inflate() should provide a speed
 advantage, since only the last 32K of output is copied to the sliding window
 upon return from inflate(), and since all distances after the first 32K of
 output will fall in the output data, making match copies simpler and faster.
 The advantage may be dependent on the size of the processor's data caches.
 */
function updatewindow(strm, src, end, copy) {
  var dist;
  var state = strm.state;

  /* if it hasn't been done already, allocate space for the window */
  if (state.window === null) {
    state.wsize = 1 << state.wbits;
    state.wnext = 0;
    state.whave = 0;

    state.window = new utils.Buf8(state.wsize);
  }

  /* copy state->wsize or less output bytes into the circular window */
  if (copy >= state.wsize) {
    utils.arraySet(state.window,src, end - state.wsize, state.wsize, 0);
    state.wnext = 0;
    state.whave = state.wsize;
  }
  else {
    dist = state.wsize - state.wnext;
    if (dist > copy) {
      dist = copy;
    }
    //zmemcpy(state->window + state->wnext, end - copy, dist);
    utils.arraySet(state.window,src, end - copy, dist, state.wnext);
    copy -= dist;
    if (copy) {
      //zmemcpy(state->window, end - copy, copy);
      utils.arraySet(state.window,src, end - copy, copy, 0);
      state.wnext = copy;
      state.whave = state.wsize;
    }
    else {
      state.wnext += dist;
      if (state.wnext === state.wsize) { state.wnext = 0; }
      if (state.whave < state.wsize) { state.whave += dist; }
    }
  }
  return 0;
}

function inflate(strm, flush) {
  var state;
  var input, output;          // input/output buffers
  var next;                   /* next input INDEX */
  var put;                    /* next output INDEX */
  var have, left;             /* available input and output */
  var hold;                   /* bit buffer */
  var bits;                   /* bits in bit buffer */
  var _in, _out;              /* save starting available input and output */
  var copy;                   /* number of stored or match bytes to copy */
  var from;                   /* where to copy match bytes from */
  var from_source;
  var here = 0;               /* current decoding table entry */
  var here_bits, here_op, here_val; // paked "here" denormalized (JS specific)
  //var last;                   /* parent table entry */
  var last_bits, last_op, last_val; // paked "last" denormalized (JS specific)
  var len;                    /* length to copy for repeats, bits to drop */
  var ret;                    /* return code */
  var hbuf = new utils.Buf8(4);    /* buffer for gzip header crc calculation */
  var opts;

  var n; // temporary var for NEED_BITS

  var order = /* permutation of code lengths */
    [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];


  if (!strm || !strm.state || !strm.output ||
      (!strm.input && strm.avail_in !== 0)) {
    return Z_STREAM_ERROR;
  }

  state = strm.state;
  if (state.mode === TYPE) { state.mode = TYPEDO; }    /* skip check */


  //--- LOAD() ---
  put = strm.next_out;
  output = strm.output;
  left = strm.avail_out;
  next = strm.next_in;
  input = strm.input;
  have = strm.avail_in;
  hold = state.hold;
  bits = state.bits;
  //---

  _in = have;
  _out = left;
  ret = Z_OK;

  inf_leave: // goto emulation
  for (;;) {
    switch (state.mode) {
    case HEAD:
      if (state.wrap === 0) {
        state.mode = TYPEDO;
        break;
      }
      //=== NEEDBITS(16);
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((state.wrap & 2) && hold === 0x8b1f) {  /* gzip header */
        state.check = 0/*crc32(0L, Z_NULL, 0)*/;
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//

        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        state.mode = FLAGS;
        break;
      }
      state.flags = 0;           /* expect zlib header */
      if (state.head) {
        state.head.done = false;
      }
      if (!(state.wrap & 1) ||   /* check if zlib header allowed */
        (((hold & 0xff)/*BITS(8)*/ << 8) + (hold >> 8)) % 31) {
        strm.msg = 'incorrect header check';
        state.mode = BAD;
        break;
      }
      if ((hold & 0x0f)/*BITS(4)*/ !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
      len = (hold & 0x0f)/*BITS(4)*/ + 8;
      if (state.wbits === 0) {
        state.wbits = len;
      }
      else if (len > state.wbits) {
        strm.msg = 'invalid window size';
        state.mode = BAD;
        break;
      }
      state.dmax = 1 << len;
      //Tracev((stderr, "inflate:   zlib header ok\n"));
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = hold & 0x200 ? DICTID : TYPE;
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      break;
    case FLAGS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.flags = hold;
      if ((state.flags & 0xff) !== Z_DEFLATED) {
        strm.msg = 'unknown compression method';
        state.mode = BAD;
        break;
      }
      if (state.flags & 0xe000) {
        strm.msg = 'unknown header flags set';
        state.mode = BAD;
        break;
      }
      if (state.head) {
        state.head.text = ((hold >> 8) & 1);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = TIME;
      /* falls through */
    case TIME:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.time = hold;
      }
      if (state.flags & 0x0200) {
        //=== CRC4(state.check, hold)
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        hbuf[2] = (hold >>> 16) & 0xff;
        hbuf[3] = (hold >>> 24) & 0xff;
        state.check = crc32(state.check, hbuf, 4, 0);
        //===
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = OS;
      /* falls through */
    case OS:
      //=== NEEDBITS(16); */
      while (bits < 16) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if (state.head) {
        state.head.xflags = (hold & 0xff);
        state.head.os = (hold >> 8);
      }
      if (state.flags & 0x0200) {
        //=== CRC2(state.check, hold);
        hbuf[0] = hold & 0xff;
        hbuf[1] = (hold >>> 8) & 0xff;
        state.check = crc32(state.check, hbuf, 2, 0);
        //===//
      }
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = EXLEN;
      /* falls through */
    case EXLEN:
      if (state.flags & 0x0400) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length = hold;
        if (state.head) {
          state.head.extra_len = hold;
        }
        if (state.flags & 0x0200) {
          //=== CRC2(state.check, hold);
          hbuf[0] = hold & 0xff;
          hbuf[1] = (hold >>> 8) & 0xff;
          state.check = crc32(state.check, hbuf, 2, 0);
          //===//
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      else if (state.head) {
        state.head.extra = null/*Z_NULL*/;
      }
      state.mode = EXTRA;
      /* falls through */
    case EXTRA:
      if (state.flags & 0x0400) {
        copy = state.length;
        if (copy > have) { copy = have; }
        if (copy) {
          if (state.head) {
            len = state.head.extra_len - state.length;
            if (!state.head.extra) {
              // Use untyped array for more conveniend processing later
              state.head.extra = new Array(state.head.extra_len);
            }
            utils.arraySet(
              state.head.extra,
              input,
              next,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              copy,
              /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
              len
            );
            //zmemcpy(state.head.extra + len, next,
            //        len + copy > state.head.extra_max ?
            //        state.head.extra_max - len : copy);
          }
          if (state.flags & 0x0200) {
            state.check = crc32(state.check, input, copy, next);
          }
          have -= copy;
          next += copy;
          state.length -= copy;
        }
        if (state.length) { break inf_leave; }
      }
      state.length = 0;
      state.mode = NAME;
      /* falls through */
    case NAME:
      if (state.flags & 0x0800) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          // TODO: 2 or 1 bytes?
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.name_max*/)) {
            state.head.name += String.fromCharCode(len);
          }
        } while (len && copy < have);

        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.name = null;
      }
      state.length = 0;
      state.mode = COMMENT;
      /* falls through */
    case COMMENT:
      if (state.flags & 0x1000) {
        if (have === 0) { break inf_leave; }
        copy = 0;
        do {
          len = input[next + copy++];
          /* use constant limit because in js we should not preallocate memory */
          if (state.head && len &&
              (state.length < 65536 /*state.head.comm_max*/)) {
            state.head.comment += String.fromCharCode(len);
          }
        } while (len && copy < have);
        if (state.flags & 0x0200) {
          state.check = crc32(state.check, input, copy, next);
        }
        have -= copy;
        next += copy;
        if (len) { break inf_leave; }
      }
      else if (state.head) {
        state.head.comment = null;
      }
      state.mode = HCRC;
      /* falls through */
    case HCRC:
      if (state.flags & 0x0200) {
        //=== NEEDBITS(16); */
        while (bits < 16) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.check & 0xffff)) {
          strm.msg = 'header crc mismatch';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
      }
      if (state.head) {
        state.head.hcrc = ((state.flags >> 9) & 1);
        state.head.done = true;
      }
      strm.adler = state.check = 0 /*crc32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      break;
    case DICTID:
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      strm.adler = state.check = ZSWAP32(hold);
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = DICT;
      /* falls through */
    case DICT:
      if (state.havedict === 0) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        return Z_NEED_DICT;
      }
      strm.adler = state.check = 1/*adler32(0L, Z_NULL, 0)*/;
      state.mode = TYPE;
      /* falls through */
    case TYPE:
      if (flush === Z_BLOCK || flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case TYPEDO:
      if (state.last) {
        //--- BYTEBITS() ---//
        hold >>>= bits & 7;
        bits -= bits & 7;
        //---//
        state.mode = CHECK;
        break;
      }
      //=== NEEDBITS(3); */
      while (bits < 3) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.last = (hold & 0x01)/*BITS(1)*/;
      //--- DROPBITS(1) ---//
      hold >>>= 1;
      bits -= 1;
      //---//

      switch ((hold & 0x03)/*BITS(2)*/) {
      case 0:                             /* stored block */
        //Tracev((stderr, "inflate:     stored block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = STORED;
        break;
      case 1:                             /* fixed block */
        fixedtables(state);
        //Tracev((stderr, "inflate:     fixed codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = LEN_;             /* decode codes */
        if (flush === Z_TREES) {
          //--- DROPBITS(2) ---//
          hold >>>= 2;
          bits -= 2;
          //---//
          break inf_leave;
        }
        break;
      case 2:                             /* dynamic block */
        //Tracev((stderr, "inflate:     dynamic codes block%s\n",
        //        state.last ? " (last)" : ""));
        state.mode = TABLE;
        break;
      case 3:
        strm.msg = 'invalid block type';
        state.mode = BAD;
      }
      //--- DROPBITS(2) ---//
      hold >>>= 2;
      bits -= 2;
      //---//
      break;
    case STORED:
      //--- BYTEBITS() ---// /* go to byte boundary */
      hold >>>= bits & 7;
      bits -= bits & 7;
      //---//
      //=== NEEDBITS(32); */
      while (bits < 32) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      if ((hold & 0xffff) !== ((hold >>> 16) ^ 0xffff)) {
        strm.msg = 'invalid stored block lengths';
        state.mode = BAD;
        break;
      }
      state.length = hold & 0xffff;
      //Tracev((stderr, "inflate:       stored length %u\n",
      //        state.length));
      //=== INITBITS();
      hold = 0;
      bits = 0;
      //===//
      state.mode = COPY_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case COPY_:
      state.mode = COPY;
      /* falls through */
    case COPY:
      copy = state.length;
      if (copy) {
        if (copy > have) { copy = have; }
        if (copy > left) { copy = left; }
        if (copy === 0) { break inf_leave; }
        //--- zmemcpy(put, next, copy); ---
        utils.arraySet(output, input, next, copy, put);
        //---//
        have -= copy;
        next += copy;
        left -= copy;
        put += copy;
        state.length -= copy;
        break;
      }
      //Tracev((stderr, "inflate:       stored end\n"));
      state.mode = TYPE;
      break;
    case TABLE:
      //=== NEEDBITS(14); */
      while (bits < 14) {
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
      }
      //===//
      state.nlen = (hold & 0x1f)/*BITS(5)*/ + 257;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ndist = (hold & 0x1f)/*BITS(5)*/ + 1;
      //--- DROPBITS(5) ---//
      hold >>>= 5;
      bits -= 5;
      //---//
      state.ncode = (hold & 0x0f)/*BITS(4)*/ + 4;
      //--- DROPBITS(4) ---//
      hold >>>= 4;
      bits -= 4;
      //---//
//#ifndef PKZIP_BUG_WORKAROUND
      if (state.nlen > 286 || state.ndist > 30) {
        strm.msg = 'too many length or distance symbols';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracev((stderr, "inflate:       table sizes ok\n"));
      state.have = 0;
      state.mode = LENLENS;
      /* falls through */
    case LENLENS:
      while (state.have < state.ncode) {
        //=== NEEDBITS(3);
        while (bits < 3) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.lens[order[state.have++]] = (hold & 0x07);//BITS(3);
        //--- DROPBITS(3) ---//
        hold >>>= 3;
        bits -= 3;
        //---//
      }
      while (state.have < 19) {
        state.lens[order[state.have++]] = 0;
      }
      // We have separate tables & no pointers. 2 commented lines below not needed.
      //state.next = state.codes;
      //state.lencode = state.next;
      // Switch to use dynamic table
      state.lencode = state.lendyn;
      state.lenbits = 7;

      opts = {bits: state.lenbits};
      ret = inflate_table(CODES, state.lens, 0, 19, state.lencode, 0, state.work, opts);
      state.lenbits = opts.bits;

      if (ret) {
        strm.msg = 'invalid code lengths set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, "inflate:       code lengths ok\n"));
      state.have = 0;
      state.mode = CODELENS;
      /* falls through */
    case CODELENS:
      while (state.have < state.nlen + state.ndist) {
        for (;;) {
          here = state.lencode[hold & ((1 << state.lenbits) - 1)];/*BITS(state.lenbits)*/
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        if (here_val < 16) {
          //--- DROPBITS(here.bits) ---//
          hold >>>= here_bits;
          bits -= here_bits;
          //---//
          state.lens[state.have++] = here_val;
        }
        else {
          if (here_val === 16) {
            //=== NEEDBITS(here.bits + 2);
            n = here_bits + 2;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            if (state.have === 0) {
              strm.msg = 'invalid bit length repeat';
              state.mode = BAD;
              break;
            }
            len = state.lens[state.have - 1];
            copy = 3 + (hold & 0x03);//BITS(2);
            //--- DROPBITS(2) ---//
            hold >>>= 2;
            bits -= 2;
            //---//
          }
          else if (here_val === 17) {
            //=== NEEDBITS(here.bits + 3);
            n = here_bits + 3;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 3 + (hold & 0x07);//BITS(3);
            //--- DROPBITS(3) ---//
            hold >>>= 3;
            bits -= 3;
            //---//
          }
          else {
            //=== NEEDBITS(here.bits + 7);
            n = here_bits + 7;
            while (bits < n) {
              if (have === 0) { break inf_leave; }
              have--;
              hold += input[next++] << bits;
              bits += 8;
            }
            //===//
            //--- DROPBITS(here.bits) ---//
            hold >>>= here_bits;
            bits -= here_bits;
            //---//
            len = 0;
            copy = 11 + (hold & 0x7f);//BITS(7);
            //--- DROPBITS(7) ---//
            hold >>>= 7;
            bits -= 7;
            //---//
          }
          if (state.have + copy > state.nlen + state.ndist) {
            strm.msg = 'invalid bit length repeat';
            state.mode = BAD;
            break;
          }
          while (copy--) {
            state.lens[state.have++] = len;
          }
        }
      }

      /* handle error breaks in while */
      if (state.mode === BAD) { break; }

      /* check for end-of-block code (better have one) */
      if (state.lens[256] === 0) {
        strm.msg = 'invalid code -- missing end-of-block';
        state.mode = BAD;
        break;
      }

      /* build code tables -- note: do not change the lenbits or distbits
         values here (9 and 6) without reading the comments in inftrees.h
         concerning the ENOUGH constants, which depend on those values */
      state.lenbits = 9;

      opts = {bits: state.lenbits};
      ret = inflate_table(LENS, state.lens, 0, state.nlen, state.lencode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.lenbits = opts.bits;
      // state.lencode = state.next;

      if (ret) {
        strm.msg = 'invalid literal/lengths set';
        state.mode = BAD;
        break;
      }

      state.distbits = 6;
      //state.distcode.copy(state.codes);
      // Switch to use dynamic table
      state.distcode = state.distdyn;
      opts = {bits: state.distbits};
      ret = inflate_table(DISTS, state.lens, state.nlen, state.ndist, state.distcode, 0, state.work, opts);
      // We have separate tables & no pointers. 2 commented lines below not needed.
      // state.next_index = opts.table_index;
      state.distbits = opts.bits;
      // state.distcode = state.next;

      if (ret) {
        strm.msg = 'invalid distances set';
        state.mode = BAD;
        break;
      }
      //Tracev((stderr, 'inflate:       codes ok\n'));
      state.mode = LEN_;
      if (flush === Z_TREES) { break inf_leave; }
      /* falls through */
    case LEN_:
      state.mode = LEN;
      /* falls through */
    case LEN:
      if (have >= 6 && left >= 258) {
        //--- RESTORE() ---
        strm.next_out = put;
        strm.avail_out = left;
        strm.next_in = next;
        strm.avail_in = have;
        state.hold = hold;
        state.bits = bits;
        //---
        inflate_fast(strm, _out);
        //--- LOAD() ---
        put = strm.next_out;
        output = strm.output;
        left = strm.avail_out;
        next = strm.next_in;
        input = strm.input;
        have = strm.avail_in;
        hold = state.hold;
        bits = state.bits;
        //---

        if (state.mode === TYPE) {
          state.back = -1;
        }
        break;
      }
      state.back = 0;
      for (;;) {
        here = state.lencode[hold & ((1 << state.lenbits) -1)];  /*BITS(state.lenbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if (here_bits <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if (here_op && (here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.lencode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      state.length = here_val;
      if (here_op === 0) {
        //Tracevv((stderr, here.val >= 0x20 && here.val < 0x7f ?
        //        "inflate:         literal '%c'\n" :
        //        "inflate:         literal 0x%02x\n", here.val));
        state.mode = LIT;
        break;
      }
      if (here_op & 32) {
        //Tracevv((stderr, "inflate:         end of block\n"));
        state.back = -1;
        state.mode = TYPE;
        break;
      }
      if (here_op & 64) {
        strm.msg = 'invalid literal/length code';
        state.mode = BAD;
        break;
      }
      state.extra = here_op & 15;
      state.mode = LENEXT;
      /* falls through */
    case LENEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.length += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
      //Tracevv((stderr, "inflate:         length %u\n", state.length));
      state.was = state.length;
      state.mode = DIST;
      /* falls through */
    case DIST:
      for (;;) {
        here = state.distcode[hold & ((1 << state.distbits) -1)];/*BITS(state.distbits)*/
        here_bits = here >>> 24;
        here_op = (here >>> 16) & 0xff;
        here_val = here & 0xffff;

        if ((here_bits) <= bits) { break; }
        //--- PULLBYTE() ---//
        if (have === 0) { break inf_leave; }
        have--;
        hold += input[next++] << bits;
        bits += 8;
        //---//
      }
      if ((here_op & 0xf0) === 0) {
        last_bits = here_bits;
        last_op = here_op;
        last_val = here_val;
        for (;;) {
          here = state.distcode[last_val +
                  ((hold & ((1 << (last_bits + last_op)) -1))/*BITS(last.bits + last.op)*/ >> last_bits)];
          here_bits = here >>> 24;
          here_op = (here >>> 16) & 0xff;
          here_val = here & 0xffff;

          if ((last_bits + here_bits) <= bits) { break; }
          //--- PULLBYTE() ---//
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
          //---//
        }
        //--- DROPBITS(last.bits) ---//
        hold >>>= last_bits;
        bits -= last_bits;
        //---//
        state.back += last_bits;
      }
      //--- DROPBITS(here.bits) ---//
      hold >>>= here_bits;
      bits -= here_bits;
      //---//
      state.back += here_bits;
      if (here_op & 64) {
        strm.msg = 'invalid distance code';
        state.mode = BAD;
        break;
      }
      state.offset = here_val;
      state.extra = (here_op) & 15;
      state.mode = DISTEXT;
      /* falls through */
    case DISTEXT:
      if (state.extra) {
        //=== NEEDBITS(state.extra);
        n = state.extra;
        while (bits < n) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        state.offset += hold & ((1 << state.extra) -1)/*BITS(state.extra)*/;
        //--- DROPBITS(state.extra) ---//
        hold >>>= state.extra;
        bits -= state.extra;
        //---//
        state.back += state.extra;
      }
//#ifdef INFLATE_STRICT
      if (state.offset > state.dmax) {
        strm.msg = 'invalid distance too far back';
        state.mode = BAD;
        break;
      }
//#endif
      //Tracevv((stderr, "inflate:         distance %u\n", state.offset));
      state.mode = MATCH;
      /* falls through */
    case MATCH:
      if (left === 0) { break inf_leave; }
      copy = _out - left;
      if (state.offset > copy) {         /* copy from window */
        copy = state.offset - copy;
        if (copy > state.whave) {
          if (state.sane) {
            strm.msg = 'invalid distance too far back';
            state.mode = BAD;
            break;
          }
// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility
//#ifdef INFLATE_ALLOW_INVALID_DISTANCE_TOOFAR_ARRR
//          Trace((stderr, "inflate.c too far\n"));
//          copy -= state.whave;
//          if (copy > state.length) { copy = state.length; }
//          if (copy > left) { copy = left; }
//          left -= copy;
//          state.length -= copy;
//          do {
//            output[put++] = 0;
//          } while (--copy);
//          if (state.length === 0) { state.mode = LEN; }
//          break;
//#endif
        }
        if (copy > state.wnext) {
          copy -= state.wnext;
          from = state.wsize - copy;
        }
        else {
          from = state.wnext - copy;
        }
        if (copy > state.length) { copy = state.length; }
        from_source = state.window;
      }
      else {                              /* copy from output */
        from_source = output;
        from = put - state.offset;
        copy = state.length;
      }
      if (copy > left) { copy = left; }
      left -= copy;
      state.length -= copy;
      do {
        output[put++] = from_source[from++];
      } while (--copy);
      if (state.length === 0) { state.mode = LEN; }
      break;
    case LIT:
      if (left === 0) { break inf_leave; }
      output[put++] = state.length;
      left--;
      state.mode = LEN;
      break;
    case CHECK:
      if (state.wrap) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          // Use '|' insdead of '+' to make sure that result is signed
          hold |= input[next++] << bits;
          bits += 8;
        }
        //===//
        _out -= left;
        strm.total_out += _out;
        state.total += _out;
        if (_out) {
          strm.adler = state.check =
              /*UPDATE(state.check, put - _out, _out);*/
              (state.flags ? crc32(state.check, output, _out, put - _out) : adler32(state.check, output, _out, put - _out));

        }
        _out = left;
        // NB: crc32 stored as signed 32-bit int, ZSWAP32 returns signed too
        if ((state.flags ? hold : ZSWAP32(hold)) !== state.check) {
          strm.msg = 'incorrect data check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   check matches trailer\n"));
      }
      state.mode = LENGTH;
      /* falls through */
    case LENGTH:
      if (state.wrap && state.flags) {
        //=== NEEDBITS(32);
        while (bits < 32) {
          if (have === 0) { break inf_leave; }
          have--;
          hold += input[next++] << bits;
          bits += 8;
        }
        //===//
        if (hold !== (state.total & 0xffffffff)) {
          strm.msg = 'incorrect length check';
          state.mode = BAD;
          break;
        }
        //=== INITBITS();
        hold = 0;
        bits = 0;
        //===//
        //Tracev((stderr, "inflate:   length matches trailer\n"));
      }
      state.mode = DONE;
      /* falls through */
    case DONE:
      ret = Z_STREAM_END;
      break inf_leave;
    case BAD:
      ret = Z_DATA_ERROR;
      break inf_leave;
    case MEM:
      return Z_MEM_ERROR;
    case SYNC:
      /* falls through */
    default:
      return Z_STREAM_ERROR;
    }
  }

  // inf_leave <- here is real place for "goto inf_leave", emulated via "break inf_leave"

  /*
     Return from inflate(), updating the total counts and the check value.
     If there was no progress during the inflate() call, return a buffer
     error.  Call updatewindow() to create and/or update the window state.
     Note: a memory error from inflate() is non-recoverable.
   */

  //--- RESTORE() ---
  strm.next_out = put;
  strm.avail_out = left;
  strm.next_in = next;
  strm.avail_in = have;
  state.hold = hold;
  state.bits = bits;
  //---

  if (state.wsize || (_out !== strm.avail_out && state.mode < BAD &&
                      (state.mode < CHECK || flush !== Z_FINISH))) {
    if (updatewindow(strm, strm.output, strm.next_out, _out - strm.avail_out)) {
      state.mode = MEM;
      return Z_MEM_ERROR;
    }
  }
  _in -= strm.avail_in;
  _out -= strm.avail_out;
  strm.total_in += _in;
  strm.total_out += _out;
  state.total += _out;
  if (state.wrap && _out) {
    strm.adler = state.check = /*UPDATE(state.check, strm.next_out - _out, _out);*/
      (state.flags ? crc32(state.check, output, _out, strm.next_out - _out) : adler32(state.check, output, _out, strm.next_out - _out));
  }
  strm.data_type = state.bits + (state.last ? 64 : 0) +
                    (state.mode === TYPE ? 128 : 0) +
                    (state.mode === LEN_ || state.mode === COPY_ ? 256 : 0);
  if (((_in === 0 && _out === 0) || flush === Z_FINISH) && ret === Z_OK) {
    ret = Z_BUF_ERROR;
  }
  return ret;
}

function inflateEnd(strm) {

  if (!strm || !strm.state /*|| strm->zfree == (free_func)0*/) {
    return Z_STREAM_ERROR;
  }

  var state = strm.state;
  if (state.window) {
    state.window = null;
  }
  strm.state = null;
  return Z_OK;
}

function inflateGetHeader(strm, head) {
  var state;

  /* check state */
  if (!strm || !strm.state) { return Z_STREAM_ERROR; }
  state = strm.state;
  if ((state.wrap & 2) === 0) { return Z_STREAM_ERROR; }

  /* save header structure */
  state.head = head;
  head.done = false;
  return Z_OK;
}


exports.inflateReset = inflateReset;
exports.inflateReset2 = inflateReset2;
exports.inflateResetKeep = inflateResetKeep;
exports.inflateInit = inflateInit;
exports.inflateInit2 = inflateInit2;
exports.inflate = inflate;
exports.inflateEnd = inflateEnd;
exports.inflateGetHeader = inflateGetHeader;
exports.inflateInfo = 'pako inflate (from Nodeca project)';

/* Not implemented
exports.inflateCopy = inflateCopy;
exports.inflateGetDictionary = inflateGetDictionary;
exports.inflateMark = inflateMark;
exports.inflatePrime = inflatePrime;
exports.inflateSetDictionary = inflateSetDictionary;
exports.inflateSync = inflateSync;
exports.inflateSyncPoint = inflateSyncPoint;
exports.inflateUndermine = inflateUndermine;
*/
},{"../utils/common":18,"./adler32":20,"./crc32":22,"./inffast":25,"./inftrees":27}],27:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

var MAXBITS = 15;
var ENOUGH_LENS = 852;
var ENOUGH_DISTS = 592;
//var ENOUGH = (ENOUGH_LENS+ENOUGH_DISTS);

var CODES = 0;
var LENS = 1;
var DISTS = 2;

var lbase = [ /* Length codes 257..285 base */
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31,
  35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0
];

var lext = [ /* Length codes 257..285 extra */
  16, 16, 16, 16, 16, 16, 16, 16, 17, 17, 17, 17, 18, 18, 18, 18,
  19, 19, 19, 19, 20, 20, 20, 20, 21, 21, 21, 21, 16, 72, 78
];

var dbase = [ /* Distance codes 0..29 base */
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193,
  257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145,
  8193, 12289, 16385, 24577, 0, 0
];

var dext = [ /* Distance codes 0..29 extra */
  16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22,
  23, 23, 24, 24, 25, 25, 26, 26, 27, 27,
  28, 28, 29, 29, 64, 64
];

module.exports = function inflate_table(type, lens, lens_index, codes, table, table_index, work, opts)
{
  var bits = opts.bits;
      //here = opts.here; /* table entry for duplication */

  var len = 0;               /* a code's length in bits */
  var sym = 0;               /* index of code symbols */
  var min = 0, max = 0;          /* minimum and maximum code lengths */
  var root = 0;              /* number of index bits for root table */
  var curr = 0;              /* number of index bits for current table */
  var drop = 0;              /* code bits to drop for sub-table */
  var left = 0;                   /* number of prefix codes available */
  var used = 0;              /* code entries in table used */
  var huff = 0;              /* Huffman code */
  var incr;              /* for incrementing code, index */
  var fill;              /* index for replicating entries */
  var low;               /* low bits for current root entry */
  var mask;              /* mask for low root bits */
  var next;             /* next available space in table */
  var base = null;     /* base value table to use */
  var base_index = 0;
//  var shoextra;    /* extra bits table to use */
  var end;                    /* use base and extra for symbol > end */
  var count = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];    /* number of codes of each length */
  var offs = new utils.Buf16(MAXBITS+1); //[MAXBITS+1];     /* offsets in table for each length */
  var extra = null;
  var extra_index = 0;

  var here_bits, here_op, here_val;

  /*
   Process a set of code lengths to create a canonical Huffman code.  The
   code lengths are lens[0..codes-1].  Each length corresponds to the
   symbols 0..codes-1.  The Huffman code is generated by first sorting the
   symbols by length from short to long, and retaining the symbol order
   for codes with equal lengths.  Then the code starts with all zero bits
   for the first code of the shortest length, and the codes are integer
   increments for the same length, and zeros are appended as the length
   increases.  For the deflate format, these bits are stored backwards
   from their more natural integer increment ordering, and so when the
   decoding tables are built in the large loop below, the integer codes
   are incremented backwards.

   This routine assumes, but does not check, that all of the entries in
   lens[] are in the range 0..MAXBITS.  The caller must assure this.
   1..MAXBITS is interpreted as that code length.  zero means that that
   symbol does not occur in this code.

   The codes are sorted by computing a count of codes for each length,
   creating from that a table of starting indices for each length in the
   sorted table, and then entering the symbols in order in the sorted
   table.  The sorted table is work[], with that space being provided by
   the caller.

   The length counts are used for other purposes as well, i.e. finding
   the minimum and maximum length codes, determining if there are any
   codes at all, checking for a valid set of lengths, and looking ahead
   at length counts to determine sub-table sizes when building the
   decoding tables.
   */

  /* accumulate lengths for codes (assumes lens[] all in 0..MAXBITS) */
  for (len = 0; len <= MAXBITS; len++) {
    count[len] = 0;
  }
  for (sym = 0; sym < codes; sym++) {
    count[lens[lens_index + sym]]++;
  }

  /* bound code lengths, force root to be within code lengths */
  root = bits;
  for (max = MAXBITS; max >= 1; max--) {
    if (count[max] !== 0) { break; }
  }
  if (root > max) {
    root = max;
  }
  if (max === 0) {                     /* no symbols to code at all */
    //table.op[opts.table_index] = 64;  //here.op = (var char)64;    /* invalid code marker */
    //table.bits[opts.table_index] = 1;   //here.bits = (var char)1;
    //table.val[opts.table_index++] = 0;   //here.val = (var short)0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;


    //table.op[opts.table_index] = 64;
    //table.bits[opts.table_index] = 1;
    //table.val[opts.table_index++] = 0;
    table[table_index++] = (1 << 24) | (64 << 16) | 0;

    opts.bits = 1;
    return 0;     /* no symbols, but wait for decoding to report error */
  }
  for (min = 1; min < max; min++) {
    if (count[min] !== 0) { break; }
  }
  if (root < min) {
    root = min;
  }

  /* check for an over-subscribed or incomplete set of lengths */
  left = 1;
  for (len = 1; len <= MAXBITS; len++) {
    left <<= 1;
    left -= count[len];
    if (left < 0) {
      return -1;
    }        /* over-subscribed */
  }
  if (left > 0 && (type === CODES || max !== 1)) {
    return -1;                      /* incomplete set */
  }

  /* generate offsets into symbol table for each length for sorting */
  offs[1] = 0;
  for (len = 1; len < MAXBITS; len++) {
    offs[len + 1] = offs[len] + count[len];
  }

  /* sort symbols by length, by symbol order within each length */
  for (sym = 0; sym < codes; sym++) {
    if (lens[lens_index + sym] !== 0) {
      work[offs[lens[lens_index + sym]]++] = sym;
    }
  }

  /*
   Create and fill in decoding tables.  In this loop, the table being
   filled is at next and has curr index bits.  The code being used is huff
   with length len.  That code is converted to an index by dropping drop
   bits off of the bottom.  For codes where len is less than drop + curr,
   those top drop + curr - len bits are incremented through all values to
   fill the table with replicated entries.

   root is the number of index bits for the root table.  When len exceeds
   root, sub-tables are created pointed to by the root entry with an index
   of the low root bits of huff.  This is saved in low to check for when a
   new sub-table should be started.  drop is zero when the root table is
   being filled, and drop is root when sub-tables are being filled.

   When a new sub-table is needed, it is necessary to look ahead in the
   code lengths to determine what size sub-table is needed.  The length
   counts are used for this, and so count[] is decremented as codes are
   entered in the tables.

   used keeps track of how many table entries have been allocated from the
   provided *table space.  It is checked for LENS and DIST tables against
   the constants ENOUGH_LENS and ENOUGH_DISTS to guard against changes in
   the initial root table size constants.  See the comments in inftrees.h
   for more information.

   sym increments through all symbols, and the loop terminates when
   all codes of length max, i.e. all codes, have been processed.  This
   routine permits incomplete codes, so another loop after this one fills
   in the rest of the decoding tables with invalid code markers.
   */

  /* set up for code type */
  // poor man optimization - use if-else instead of switch,
  // to avoid deopts in old v8
  if (type === CODES) {
      base = extra = work;    /* dummy value--not used */
      end = 19;
  } else if (type === LENS) {
      base = lbase;
      base_index -= 257;
      extra = lext;
      extra_index -= 257;
      end = 256;
  } else {                    /* DISTS */
      base = dbase;
      extra = dext;
      end = -1;
  }

  /* initialize opts for loop */
  huff = 0;                   /* starting code */
  sym = 0;                    /* starting code symbol */
  len = min;                  /* starting code length */
  next = table_index;              /* current table to fill in */
  curr = root;                /* current table index bits */
  drop = 0;                   /* current bits to drop from code for index */
  low = -1;                   /* trigger new sub-table when len > root */
  used = 1 << root;          /* use root table entries */
  mask = used - 1;            /* mask for comparing low */

  /* check available table space */
  if ((type === LENS && used > ENOUGH_LENS) ||
    (type === DISTS && used > ENOUGH_DISTS)) {
    return 1;
  }

  var i=0;
  /* process all codes and make table entries */
  for (;;) {
    i++;
    /* create table entry */
    here_bits = len - drop;
    if (work[sym] < end) {
      here_op = 0;
      here_val = work[sym];
    }
    else if (work[sym] > end) {
      here_op = extra[extra_index + work[sym]];
      here_val = base[base_index + work[sym]];
    }
    else {
      here_op = 32 + 64;         /* end of block */
      here_val = 0;
    }

    /* replicate for those indices with low len bits equal to huff */
    incr = 1 << (len - drop);
    fill = 1 << curr;
    min = fill;                 /* save offset to next table */
    do {
      fill -= incr;
      table[next + (huff >> drop) + fill] = (here_bits << 24) | (here_op << 16) | here_val |0;
    } while (fill !== 0);

    /* backwards increment the len-bit code huff */
    incr = 1 << (len - 1);
    while (huff & incr) {
      incr >>= 1;
    }
    if (incr !== 0) {
      huff &= incr - 1;
      huff += incr;
    } else {
      huff = 0;
    }

    /* go to next symbol, update count, len */
    sym++;
    if (--count[len] === 0) {
      if (len === max) { break; }
      len = lens[lens_index + work[sym]];
    }

    /* create new sub-table if needed */
    if (len > root && (huff & mask) !== low) {
      /* if first time, transition to sub-tables */
      if (drop === 0) {
        drop = root;
      }

      /* increment past last table */
      next += min;            /* here min is 1 << curr */

      /* determine length of next table */
      curr = len - drop;
      left = 1 << curr;
      while (curr + drop < max) {
        left -= count[curr + drop];
        if (left <= 0) { break; }
        curr++;
        left <<= 1;
      }

      /* check for enough space */
      used += 1 << curr;
      if ((type === LENS && used > ENOUGH_LENS) ||
        (type === DISTS && used > ENOUGH_DISTS)) {
        return 1;
      }

      /* point entry in root table to sub-table */
      low = huff & mask;
      /*table.op[low] = curr;
      table.bits[low] = root;
      table.val[low] = next - opts.table_index;*/
      table[low] = (root << 24) | (curr << 16) | (next - table_index) |0;
    }
  }

  /* fill in remaining table entry if code is incomplete (guaranteed to have
   at most one remaining entry, since if the code is incomplete, the
   maximum code length that was allowed to get this far is one bit) */
  if (huff !== 0) {
    //table.op[next + huff] = 64;            /* invalid code marker */
    //table.bits[next + huff] = len - drop;
    //table.val[next + huff] = 0;
    table[next + huff] = ((len - drop) << 24) | (64 << 16) |0;
  }

  /* set return parameters */
  //opts.table_index += used;
  opts.bits = root;
  return 0;
};

},{"../utils/common":18}],28:[function(require,module,exports){
'use strict';

module.exports = {
  '2':    'need dictionary',     /* Z_NEED_DICT       2  */
  '1':    'stream end',          /* Z_STREAM_END      1  */
  '0':    '',                    /* Z_OK              0  */
  '-1':   'file error',          /* Z_ERRNO         (-1) */
  '-2':   'stream error',        /* Z_STREAM_ERROR  (-2) */
  '-3':   'data error',          /* Z_DATA_ERROR    (-3) */
  '-4':   'insufficient memory', /* Z_MEM_ERROR     (-4) */
  '-5':   'buffer error',        /* Z_BUF_ERROR     (-5) */
  '-6':   'incompatible version' /* Z_VERSION_ERROR (-6) */
};
},{}],29:[function(require,module,exports){
'use strict';


var utils = require('../utils/common');

/* Public constants ==========================================================*/
/* ===========================================================================*/


//var Z_FILTERED          = 1;
//var Z_HUFFMAN_ONLY      = 2;
//var Z_RLE               = 3;
var Z_FIXED               = 4;
//var Z_DEFAULT_STRATEGY  = 0;

/* Possible values of the data_type field (though see inflate()) */
var Z_BINARY              = 0;
var Z_TEXT                = 1;
//var Z_ASCII             = 1; // = Z_TEXT
var Z_UNKNOWN             = 2;

/*============================================================================*/


function zero(buf) { var len = buf.length; while (--len >= 0) { buf[len] = 0; } }

// From zutil.h

var STORED_BLOCK = 0;
var STATIC_TREES = 1;
var DYN_TREES    = 2;
/* The three kinds of block type */

var MIN_MATCH    = 3;
var MAX_MATCH    = 258;
/* The minimum and maximum match lengths */

// From deflate.h
/* ===========================================================================
 * Internal compression state.
 */

var LENGTH_CODES  = 29;
/* number of length codes, not counting the special END_BLOCK code */

var LITERALS      = 256;
/* number of literal bytes 0..255 */

var L_CODES       = LITERALS + 1 + LENGTH_CODES;
/* number of Literal or Length codes, including the END_BLOCK code */

var D_CODES       = 30;
/* number of distance codes */

var BL_CODES      = 19;
/* number of codes used to transfer the bit lengths */

var HEAP_SIZE     = 2*L_CODES + 1;
/* maximum heap size */

var MAX_BITS      = 15;
/* All codes must not exceed MAX_BITS bits */

var Buf_size      = 16;
/* size of bit buffer in bi_buf */


/* ===========================================================================
 * Constants
 */

var MAX_BL_BITS = 7;
/* Bit length codes must not exceed MAX_BL_BITS bits */

var END_BLOCK   = 256;
/* end of block literal code */

var REP_3_6     = 16;
/* repeat previous bit length 3-6 times (2 bits of repeat count) */

var REPZ_3_10   = 17;
/* repeat a zero length 3-10 times  (3 bits of repeat count) */

var REPZ_11_138 = 18;
/* repeat a zero length 11-138 times  (7 bits of repeat count) */

var extra_lbits =   /* extra bits for each length code */
  [0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0];

var extra_dbits =   /* extra bits for each distance code */
  [0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];

var extra_blbits =  /* extra bits for each bit length code */
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7];

var bl_order =
  [16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];
/* The lengths of the bit length codes are sent in order of decreasing
 * probability, to avoid transmitting the lengths for unused bit length codes.
 */

/* ===========================================================================
 * Local data. These are initialized only once.
 */

// We pre-fill arrays with 0 to avoid uninitialized gaps

var DIST_CODE_LEN = 512; /* see definition of array dist_code below */

// !!!! Use flat array insdead of structure, Freq = i*2, Len = i*2+1
var static_ltree  = new Array((L_CODES+2) * 2);
zero(static_ltree);
/* The static literal tree. Since the bit lengths are imposed, there is no
 * need for the L_CODES extra codes used during heap construction. However
 * The codes 286 and 287 are needed to build a canonical tree (see _tr_init
 * below).
 */

var static_dtree  = new Array(D_CODES * 2);
zero(static_dtree);
/* The static distance tree. (Actually a trivial tree since all codes use
 * 5 bits.)
 */

var _dist_code    = new Array(DIST_CODE_LEN);
zero(_dist_code);
/* Distance codes. The first 256 values correspond to the distances
 * 3 .. 258, the last 256 values correspond to the top 8 bits of
 * the 15 bit distances.
 */

var _length_code  = new Array(MAX_MATCH-MIN_MATCH+1);
zero(_length_code);
/* length code for each normalized match length (0 == MIN_MATCH) */

var base_length   = new Array(LENGTH_CODES);
zero(base_length);
/* First normalized length for each code (0 = MIN_MATCH) */

var base_dist     = new Array(D_CODES);
zero(base_dist);
/* First normalized distance for each code (0 = distance of 1) */


var StaticTreeDesc = function (static_tree, extra_bits, extra_base, elems, max_length) {

  this.static_tree  = static_tree;  /* static tree or NULL */
  this.extra_bits   = extra_bits;   /* extra bits for each code or NULL */
  this.extra_base   = extra_base;   /* base index for extra_bits */
  this.elems        = elems;        /* max number of elements in the tree */
  this.max_length   = max_length;   /* max bit length for the codes */

  // show if `static_tree` has data or dummy - needed for monomorphic objects
  this.has_stree    = static_tree && static_tree.length;
};


var static_l_desc;
var static_d_desc;
var static_bl_desc;


var TreeDesc = function(dyn_tree, stat_desc) {
  this.dyn_tree = dyn_tree;     /* the dynamic tree */
  this.max_code = 0;            /* largest code with non zero frequency */
  this.stat_desc = stat_desc;   /* the corresponding static tree */
};



function d_code(dist) {
  return dist < 256 ? _dist_code[dist] : _dist_code[256 + (dist >>> 7)];
}


/* ===========================================================================
 * Output a short LSB first on the stream.
 * IN assertion: there is enough room in pendingBuf.
 */
function put_short (s, w) {
//    put_byte(s, (uch)((w) & 0xff));
//    put_byte(s, (uch)((ush)(w) >> 8));
  s.pending_buf[s.pending++] = (w) & 0xff;
  s.pending_buf[s.pending++] = (w >>> 8) & 0xff;
}


/* ===========================================================================
 * Send a value on a given number of bits.
 * IN assertion: length <= 16 and value fits in length bits.
 */
function send_bits(s, value, length) {
  if (s.bi_valid > (Buf_size - length)) {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    put_short(s, s.bi_buf);
    s.bi_buf = value >> (Buf_size - s.bi_valid);
    s.bi_valid += length - Buf_size;
  } else {
    s.bi_buf |= (value << s.bi_valid) & 0xffff;
    s.bi_valid += length;
  }
}


function send_code(s, c, tree) {
  send_bits(s, tree[c*2]/*.Code*/, tree[c*2 + 1]/*.Len*/);
}


/* ===========================================================================
 * Reverse the first len bits of a code, using straightforward code (a faster
 * method would use a table)
 * IN assertion: 1 <= len <= 15
 */
function bi_reverse(code, len) {
  var res = 0;
  do {
    res |= code & 1;
    code >>>= 1;
    res <<= 1;
  } while (--len > 0);
  return res >>> 1;
}


/* ===========================================================================
 * Flush the bit buffer, keeping at most 7 bits in it.
 */
function bi_flush(s) {
  if (s.bi_valid === 16) {
    put_short(s, s.bi_buf);
    s.bi_buf = 0;
    s.bi_valid = 0;

  } else if (s.bi_valid >= 8) {
    s.pending_buf[s.pending++] = s.bi_buf & 0xff;
    s.bi_buf >>= 8;
    s.bi_valid -= 8;
  }
}


/* ===========================================================================
 * Compute the optimal bit lengths for a tree and update the total bit length
 * for the current block.
 * IN assertion: the fields freq and dad are set, heap[heap_max] and
 *    above are the tree nodes sorted by increasing frequency.
 * OUT assertions: the field len is set to the optimal bit length, the
 *     array bl_count contains the frequencies for each bit length.
 *     The length opt_len is updated; static_len is also updated if stree is
 *     not null.
 */
function gen_bitlen(s, desc)
//    deflate_state *s;
//    tree_desc *desc;    /* the tree descriptor */
{
  var tree            = desc.dyn_tree;
  var max_code        = desc.max_code;
  var stree           = desc.stat_desc.static_tree;
  var has_stree       = desc.stat_desc.has_stree;
  var extra           = desc.stat_desc.extra_bits;
  var base            = desc.stat_desc.extra_base;
  var max_length      = desc.stat_desc.max_length;
  var h;              /* heap index */
  var n, m;           /* iterate over the tree elements */
  var bits;           /* bit length */
  var xbits;          /* extra bits */
  var f;              /* frequency */
  var overflow = 0;   /* number of elements with bit length too large */

  for (bits = 0; bits <= MAX_BITS; bits++) {
    s.bl_count[bits] = 0;
  }

  /* In a first pass, compute the optimal bit lengths (which may
   * overflow in the case of the bit length tree).
   */
  tree[s.heap[s.heap_max]*2 + 1]/*.Len*/ = 0; /* root of the heap */

  for (h = s.heap_max+1; h < HEAP_SIZE; h++) {
    n = s.heap[h];
    bits = tree[tree[n*2 +1]/*.Dad*/ * 2 + 1]/*.Len*/ + 1;
    if (bits > max_length) {
      bits = max_length;
      overflow++;
    }
    tree[n*2 + 1]/*.Len*/ = bits;
    /* We overwrite tree[n].Dad which is no longer needed */

    if (n > max_code) { continue; } /* not a leaf node */

    s.bl_count[bits]++;
    xbits = 0;
    if (n >= base) {
      xbits = extra[n-base];
    }
    f = tree[n * 2]/*.Freq*/;
    s.opt_len += f * (bits + xbits);
    if (has_stree) {
      s.static_len += f * (stree[n*2 + 1]/*.Len*/ + xbits);
    }
  }
  if (overflow === 0) { return; }

  // Trace((stderr,"\nbit length overflow\n"));
  /* This happens for example on obj2 and pic of the Calgary corpus */

  /* Find the first bit length which could increase: */
  do {
    bits = max_length-1;
    while (s.bl_count[bits] === 0) { bits--; }
    s.bl_count[bits]--;      /* move one leaf down the tree */
    s.bl_count[bits+1] += 2; /* move one overflow item as its brother */
    s.bl_count[max_length]--;
    /* The brother of the overflow item also moves one step up,
     * but this does not affect bl_count[max_length]
     */
    overflow -= 2;
  } while (overflow > 0);

  /* Now recompute all bit lengths, scanning in increasing frequency.
   * h is still equal to HEAP_SIZE. (It is simpler to reconstruct all
   * lengths instead of fixing only the wrong ones. This idea is taken
   * from 'ar' written by Haruhiko Okumura.)
   */
  for (bits = max_length; bits !== 0; bits--) {
    n = s.bl_count[bits];
    while (n !== 0) {
      m = s.heap[--h];
      if (m > max_code) { continue; }
      if (tree[m*2 + 1]/*.Len*/ !== bits) {
        // Trace((stderr,"code %d bits %d->%d\n", m, tree[m].Len, bits));
        s.opt_len += (bits - tree[m*2 + 1]/*.Len*/)*tree[m*2]/*.Freq*/;
        tree[m*2 + 1]/*.Len*/ = bits;
      }
      n--;
    }
  }
}


/* ===========================================================================
 * Generate the codes for a given tree and bit counts (which need not be
 * optimal).
 * IN assertion: the array bl_count contains the bit length statistics for
 * the given tree and the field len is set for all tree elements.
 * OUT assertion: the field code is set for all tree elements of non
 *     zero code length.
 */
function gen_codes(tree, max_code, bl_count)
//    ct_data *tree;             /* the tree to decorate */
//    int max_code;              /* largest code with non zero frequency */
//    ushf *bl_count;            /* number of codes at each bit length */
{
  var next_code = new Array(MAX_BITS+1); /* next code value for each bit length */
  var code = 0;              /* running code value */
  var bits;                  /* bit index */
  var n;                     /* code index */

  /* The distribution counts are first used to generate the code values
   * without bit reversal.
   */
  for (bits = 1; bits <= MAX_BITS; bits++) {
    next_code[bits] = code = (code + bl_count[bits-1]) << 1;
  }
  /* Check that the bit counts in bl_count are consistent. The last code
   * must be all ones.
   */
  //Assert (code + bl_count[MAX_BITS]-1 == (1<<MAX_BITS)-1,
  //        "inconsistent bit counts");
  //Tracev((stderr,"\ngen_codes: max_code %d ", max_code));

  for (n = 0;  n <= max_code; n++) {
    var len = tree[n*2 + 1]/*.Len*/;
    if (len === 0) { continue; }
    /* Now reverse the bits */
    tree[n*2]/*.Code*/ = bi_reverse(next_code[len]++, len);

    //Tracecv(tree != static_ltree, (stderr,"\nn %3d %c l %2d c %4x (%x) ",
    //     n, (isgraph(n) ? n : ' '), len, tree[n].Code, next_code[len]-1));
  }
}


/* ===========================================================================
 * Initialize the various 'constant' tables.
 */
function tr_static_init() {
  var n;        /* iterates over tree elements */
  var bits;     /* bit counter */
  var length;   /* length value */
  var code;     /* code value */
  var dist;     /* distance index */
  var bl_count = new Array(MAX_BITS+1);
  /* number of codes at each bit length for an optimal tree */

  // do check in _tr_init()
  //if (static_init_done) return;

  /* For some embedded targets, global variables are not initialized: */
/*#ifdef NO_INIT_GLOBAL_POINTERS
  static_l_desc.static_tree = static_ltree;
  static_l_desc.extra_bits = extra_lbits;
  static_d_desc.static_tree = static_dtree;
  static_d_desc.extra_bits = extra_dbits;
  static_bl_desc.extra_bits = extra_blbits;
#endif*/

  /* Initialize the mapping length (0..255) -> length code (0..28) */
  length = 0;
  for (code = 0; code < LENGTH_CODES-1; code++) {
    base_length[code] = length;
    for (n = 0; n < (1<<extra_lbits[code]); n++) {
      _length_code[length++] = code;
    }
  }
  //Assert (length == 256, "tr_static_init: length != 256");
  /* Note that the length 255 (match length 258) can be represented
   * in two different ways: code 284 + 5 bits or code 285, so we
   * overwrite length_code[255] to use the best encoding:
   */
  _length_code[length-1] = code;

  /* Initialize the mapping dist (0..32K) -> dist code (0..29) */
  dist = 0;
  for (code = 0 ; code < 16; code++) {
    base_dist[code] = dist;
    for (n = 0; n < (1<<extra_dbits[code]); n++) {
      _dist_code[dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: dist != 256");
  dist >>= 7; /* from now on, all distances are divided by 128 */
  for ( ; code < D_CODES; code++) {
    base_dist[code] = dist << 7;
    for (n = 0; n < (1<<(extra_dbits[code]-7)); n++) {
      _dist_code[256 + dist++] = code;
    }
  }
  //Assert (dist == 256, "tr_static_init: 256+dist != 512");

  /* Construct the codes of the static literal tree */
  for (bits = 0; bits <= MAX_BITS; bits++) {
    bl_count[bits] = 0;
  }

  n = 0;
  while (n <= 143) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  while (n <= 255) {
    static_ltree[n*2 + 1]/*.Len*/ = 9;
    n++;
    bl_count[9]++;
  }
  while (n <= 279) {
    static_ltree[n*2 + 1]/*.Len*/ = 7;
    n++;
    bl_count[7]++;
  }
  while (n <= 287) {
    static_ltree[n*2 + 1]/*.Len*/ = 8;
    n++;
    bl_count[8]++;
  }
  /* Codes 286 and 287 do not exist, but we must include them in the
   * tree construction to get a canonical Huffman tree (longest code
   * all ones)
   */
  gen_codes(static_ltree, L_CODES+1, bl_count);

  /* The static distance tree is trivial: */
  for (n = 0; n < D_CODES; n++) {
    static_dtree[n*2 + 1]/*.Len*/ = 5;
    static_dtree[n*2]/*.Code*/ = bi_reverse(n, 5);
  }

  // Now data ready and we can init static trees
  static_l_desc = new StaticTreeDesc(static_ltree, extra_lbits, LITERALS+1, L_CODES, MAX_BITS);
  static_d_desc = new StaticTreeDesc(static_dtree, extra_dbits, 0,          D_CODES, MAX_BITS);
  static_bl_desc =new StaticTreeDesc(new Array(0), extra_blbits, 0,         BL_CODES, MAX_BL_BITS);

  //static_init_done = true;
}


/* ===========================================================================
 * Initialize a new block.
 */
function init_block(s) {
  var n; /* iterates over tree elements */

  /* Initialize the trees. */
  for (n = 0; n < L_CODES;  n++) { s.dyn_ltree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < D_CODES;  n++) { s.dyn_dtree[n*2]/*.Freq*/ = 0; }
  for (n = 0; n < BL_CODES; n++) { s.bl_tree[n*2]/*.Freq*/ = 0; }

  s.dyn_ltree[END_BLOCK*2]/*.Freq*/ = 1;
  s.opt_len = s.static_len = 0;
  s.last_lit = s.matches = 0;
}


/* ===========================================================================
 * Flush the bit buffer and align the output on a byte boundary
 */
function bi_windup(s)
{
  if (s.bi_valid > 8) {
    put_short(s, s.bi_buf);
  } else if (s.bi_valid > 0) {
    //put_byte(s, (Byte)s->bi_buf);
    s.pending_buf[s.pending++] = s.bi_buf;
  }
  s.bi_buf = 0;
  s.bi_valid = 0;
}

/* ===========================================================================
 * Copy a stored block, storing first the length and its
 * one's complement if requested.
 */
function copy_block(s, buf, len, header)
//DeflateState *s;
//charf    *buf;    /* the input data */
//unsigned len;     /* its length */
//int      header;  /* true if block header must be written */
{
  bi_windup(s);        /* align on byte boundary */

  if (header) {
    put_short(s, len);
    put_short(s, ~len);
  }
//  while (len--) {
//    put_byte(s, *buf++);
//  }
  utils.arraySet(s.pending_buf, s.window, buf, len, s.pending);
  s.pending += len;
}

/* ===========================================================================
 * Compares to subtrees, using the tree depth as tie breaker when
 * the subtrees have equal frequency. This minimizes the worst case length.
 */
function smaller(tree, n, m, depth) {
  var _n2 = n*2;
  var _m2 = m*2;
  return (tree[_n2]/*.Freq*/ < tree[_m2]/*.Freq*/ ||
         (tree[_n2]/*.Freq*/ === tree[_m2]/*.Freq*/ && depth[n] <= depth[m]));
}

/* ===========================================================================
 * Restore the heap property by moving down the tree starting at node k,
 * exchanging a node with the smallest of its two sons if necessary, stopping
 * when the heap property is re-established (each father smaller than its
 * two sons).
 */
function pqdownheap(s, tree, k)
//    deflate_state *s;
//    ct_data *tree;  /* the tree to restore */
//    int k;               /* node to move down */
{
  var v = s.heap[k];
  var j = k << 1;  /* left son of k */
  while (j <= s.heap_len) {
    /* Set j to the smallest of the two sons: */
    if (j < s.heap_len &&
      smaller(tree, s.heap[j+1], s.heap[j], s.depth)) {
      j++;
    }
    /* Exit if v is smaller than both sons */
    if (smaller(tree, v, s.heap[j], s.depth)) { break; }

    /* Exchange v with the smallest son */
    s.heap[k] = s.heap[j];
    k = j;

    /* And continue down the tree, setting j to the left son of k */
    j <<= 1;
  }
  s.heap[k] = v;
}


// inlined manually
// var SMALLEST = 1;

/* ===========================================================================
 * Send the block data compressed using the given Huffman trees
 */
function compress_block(s, ltree, dtree)
//    deflate_state *s;
//    const ct_data *ltree; /* literal tree */
//    const ct_data *dtree; /* distance tree */
{
  var dist;           /* distance of matched string */
  var lc;             /* match length or unmatched char (if dist == 0) */
  var lx = 0;         /* running index in l_buf */
  var code;           /* the code to send */
  var extra;          /* number of extra bits to send */

  if (s.last_lit !== 0) {
    do {
      dist = (s.pending_buf[s.d_buf + lx*2] << 8) | (s.pending_buf[s.d_buf + lx*2 + 1]);
      lc = s.pending_buf[s.l_buf + lx];
      lx++;

      if (dist === 0) {
        send_code(s, lc, ltree); /* send a literal byte */
        //Tracecv(isgraph(lc), (stderr," '%c' ", lc));
      } else {
        /* Here, lc is the match length - MIN_MATCH */
        code = _length_code[lc];
        send_code(s, code+LITERALS+1, ltree); /* send the length code */
        extra = extra_lbits[code];
        if (extra !== 0) {
          lc -= base_length[code];
          send_bits(s, lc, extra);       /* send the extra length bits */
        }
        dist--; /* dist is now the match distance - 1 */
        code = d_code(dist);
        //Assert (code < D_CODES, "bad d_code");

        send_code(s, code, dtree);       /* send the distance code */
        extra = extra_dbits[code];
        if (extra !== 0) {
          dist -= base_dist[code];
          send_bits(s, dist, extra);   /* send the extra distance bits */
        }
      } /* literal or match pair ? */

      /* Check that the overlay between pending_buf and d_buf+l_buf is ok: */
      //Assert((uInt)(s->pending) < s->lit_bufsize + 2*lx,
      //       "pendingBuf overflow");

    } while (lx < s.last_lit);
  }

  send_code(s, END_BLOCK, ltree);
}


/* ===========================================================================
 * Construct one Huffman tree and assigns the code bit strings and lengths.
 * Update the total bit length for the current block.
 * IN assertion: the field freq is set for all tree elements.
 * OUT assertions: the fields len and code are set to the optimal bit length
 *     and corresponding code. The length opt_len is updated; static_len is
 *     also updated if stree is not null. The field max_code is set.
 */
function build_tree(s, desc)
//    deflate_state *s;
//    tree_desc *desc; /* the tree descriptor */
{
  var tree     = desc.dyn_tree;
  var stree    = desc.stat_desc.static_tree;
  var has_stree = desc.stat_desc.has_stree;
  var elems    = desc.stat_desc.elems;
  var n, m;          /* iterate over heap elements */
  var max_code = -1; /* largest code with non zero frequency */
  var node;          /* new node being created */

  /* Construct the initial heap, with least frequent element in
   * heap[SMALLEST]. The sons of heap[n] are heap[2*n] and heap[2*n+1].
   * heap[0] is not used.
   */
  s.heap_len = 0;
  s.heap_max = HEAP_SIZE;

  for (n = 0; n < elems; n++) {
    if (tree[n * 2]/*.Freq*/ !== 0) {
      s.heap[++s.heap_len] = max_code = n;
      s.depth[n] = 0;

    } else {
      tree[n*2 + 1]/*.Len*/ = 0;
    }
  }

  /* The pkzip format requires that at least one distance code exists,
   * and that at least one bit should be sent even if there is only one
   * possible code. So to avoid special checks later on we force at least
   * two codes of non zero frequency.
   */
  while (s.heap_len < 2) {
    node = s.heap[++s.heap_len] = (max_code < 2 ? ++max_code : 0);
    tree[node * 2]/*.Freq*/ = 1;
    s.depth[node] = 0;
    s.opt_len--;

    if (has_stree) {
      s.static_len -= stree[node*2 + 1]/*.Len*/;
    }
    /* node is 0 or 1 so it does not have extra bits */
  }
  desc.max_code = max_code;

  /* The elements heap[heap_len/2+1 .. heap_len] are leaves of the tree,
   * establish sub-heaps of increasing lengths:
   */
  for (n = (s.heap_len >> 1/*int /2*/); n >= 1; n--) { pqdownheap(s, tree, n); }

  /* Construct the Huffman tree by repeatedly combining the least two
   * frequent nodes.
   */
  node = elems;              /* next internal node of the tree */
  do {
    //pqremove(s, tree, n);  /* n = node of least frequency */
    /*** pqremove ***/
    n = s.heap[1/*SMALLEST*/];
    s.heap[1/*SMALLEST*/] = s.heap[s.heap_len--];
    pqdownheap(s, tree, 1/*SMALLEST*/);
    /***/

    m = s.heap[1/*SMALLEST*/]; /* m = node of next least frequency */

    s.heap[--s.heap_max] = n; /* keep the nodes sorted by frequency */
    s.heap[--s.heap_max] = m;

    /* Create a new node father of n and m */
    tree[node * 2]/*.Freq*/ = tree[n * 2]/*.Freq*/ + tree[m * 2]/*.Freq*/;
    s.depth[node] = (s.depth[n] >= s.depth[m] ? s.depth[n] : s.depth[m]) + 1;
    tree[n*2 + 1]/*.Dad*/ = tree[m*2 + 1]/*.Dad*/ = node;

    /* and insert the new node in the heap */
    s.heap[1/*SMALLEST*/] = node++;
    pqdownheap(s, tree, 1/*SMALLEST*/);

  } while (s.heap_len >= 2);

  s.heap[--s.heap_max] = s.heap[1/*SMALLEST*/];

  /* At this point, the fields freq and dad are set. We can now
   * generate the bit lengths.
   */
  gen_bitlen(s, desc);

  /* The field len is now set, we can generate the bit codes */
  gen_codes(tree, max_code, s.bl_count);
}


/* ===========================================================================
 * Scan a literal or distance tree to determine the frequencies of the codes
 * in the bit length tree.
 */
function scan_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree;   /* the tree to be scanned */
//    int max_code;    /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }
  tree[(max_code+1)*2 + 1]/*.Len*/ = 0xffff; /* guard */

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      s.bl_tree[curlen * 2]/*.Freq*/ += count;

    } else if (curlen !== 0) {

      if (curlen !== prevlen) { s.bl_tree[curlen * 2]/*.Freq*/++; }
      s.bl_tree[REP_3_6*2]/*.Freq*/++;

    } else if (count <= 10) {
      s.bl_tree[REPZ_3_10*2]/*.Freq*/++;

    } else {
      s.bl_tree[REPZ_11_138*2]/*.Freq*/++;
    }

    count = 0;
    prevlen = curlen;

    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Send a literal or distance tree in compressed form, using the codes in
 * bl_tree.
 */
function send_tree(s, tree, max_code)
//    deflate_state *s;
//    ct_data *tree; /* the tree to be scanned */
//    int max_code;       /* and its largest code of non zero frequency */
{
  var n;                     /* iterates over all tree elements */
  var prevlen = -1;          /* last emitted length */
  var curlen;                /* length of current code */

  var nextlen = tree[0*2 + 1]/*.Len*/; /* length of next code */

  var count = 0;             /* repeat count of the current code */
  var max_count = 7;         /* max repeat count */
  var min_count = 4;         /* min repeat count */

  /* tree[max_code+1].Len = -1; */  /* guard already set */
  if (nextlen === 0) {
    max_count = 138;
    min_count = 3;
  }

  for (n = 0; n <= max_code; n++) {
    curlen = nextlen;
    nextlen = tree[(n+1)*2 + 1]/*.Len*/;

    if (++count < max_count && curlen === nextlen) {
      continue;

    } else if (count < min_count) {
      do { send_code(s, curlen, s.bl_tree); } while (--count !== 0);

    } else if (curlen !== 0) {
      if (curlen !== prevlen) {
        send_code(s, curlen, s.bl_tree);
        count--;
      }
      //Assert(count >= 3 && count <= 6, " 3_6?");
      send_code(s, REP_3_6, s.bl_tree);
      send_bits(s, count-3, 2);

    } else if (count <= 10) {
      send_code(s, REPZ_3_10, s.bl_tree);
      send_bits(s, count-3, 3);

    } else {
      send_code(s, REPZ_11_138, s.bl_tree);
      send_bits(s, count-11, 7);
    }

    count = 0;
    prevlen = curlen;
    if (nextlen === 0) {
      max_count = 138;
      min_count = 3;

    } else if (curlen === nextlen) {
      max_count = 6;
      min_count = 3;

    } else {
      max_count = 7;
      min_count = 4;
    }
  }
}


/* ===========================================================================
 * Construct the Huffman tree for the bit lengths and return the index in
 * bl_order of the last bit length code to send.
 */
function build_bl_tree(s) {
  var max_blindex;  /* index of last bit length code of non zero freq */

  /* Determine the bit length frequencies for literal and distance trees */
  scan_tree(s, s.dyn_ltree, s.l_desc.max_code);
  scan_tree(s, s.dyn_dtree, s.d_desc.max_code);

  /* Build the bit length tree: */
  build_tree(s, s.bl_desc);
  /* opt_len now includes the length of the tree representations, except
   * the lengths of the bit lengths codes and the 5+5+4 bits for the counts.
   */

  /* Determine the number of bit length codes to send. The pkzip format
   * requires that at least 4 bit length codes be sent. (appnote.txt says
   * 3 but the actual value used is 4.)
   */
  for (max_blindex = BL_CODES-1; max_blindex >= 3; max_blindex--) {
    if (s.bl_tree[bl_order[max_blindex]*2 + 1]/*.Len*/ !== 0) {
      break;
    }
  }
  /* Update opt_len to include the bit length tree and counts */
  s.opt_len += 3*(max_blindex+1) + 5+5+4;
  //Tracev((stderr, "\ndyn trees: dyn %ld, stat %ld",
  //        s->opt_len, s->static_len));

  return max_blindex;
}


/* ===========================================================================
 * Send the header for a block using dynamic Huffman trees: the counts, the
 * lengths of the bit length codes, the literal tree and the distance tree.
 * IN assertion: lcodes >= 257, dcodes >= 1, blcodes >= 4.
 */
function send_all_trees(s, lcodes, dcodes, blcodes)
//    deflate_state *s;
//    int lcodes, dcodes, blcodes; /* number of codes for each tree */
{
  var rank;                    /* index in bl_order */

  //Assert (lcodes >= 257 && dcodes >= 1 && blcodes >= 4, "not enough codes");
  //Assert (lcodes <= L_CODES && dcodes <= D_CODES && blcodes <= BL_CODES,
  //        "too many codes");
  //Tracev((stderr, "\nbl counts: "));
  send_bits(s, lcodes-257, 5); /* not +255 as stated in appnote.txt */
  send_bits(s, dcodes-1,   5);
  send_bits(s, blcodes-4,  4); /* not -3 as stated in appnote.txt */
  for (rank = 0; rank < blcodes; rank++) {
    //Tracev((stderr, "\nbl code %2d ", bl_order[rank]));
    send_bits(s, s.bl_tree[bl_order[rank]*2 + 1]/*.Len*/, 3);
  }
  //Tracev((stderr, "\nbl tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_ltree, lcodes-1); /* literal tree */
  //Tracev((stderr, "\nlit tree: sent %ld", s->bits_sent));

  send_tree(s, s.dyn_dtree, dcodes-1); /* distance tree */
  //Tracev((stderr, "\ndist tree: sent %ld", s->bits_sent));
}


/* ===========================================================================
 * Check if the data type is TEXT or BINARY, using the following algorithm:
 * - TEXT if the two conditions below are satisfied:
 *    a) There are no non-portable control characters belonging to the
 *       "black list" (0..6, 14..25, 28..31).
 *    b) There is at least one printable character belonging to the
 *       "white list" (9 {TAB}, 10 {LF}, 13 {CR}, 32..255).
 * - BINARY otherwise.
 * - The following partially-portable control characters form a
 *   "gray list" that is ignored in this detection algorithm:
 *   (7 {BEL}, 8 {BS}, 11 {VT}, 12 {FF}, 26 {SUB}, 27 {ESC}).
 * IN assertion: the fields Freq of dyn_ltree are set.
 */
function detect_data_type(s) {
  /* black_mask is the bit mask of black-listed bytes
   * set bits 0..6, 14..25, and 28..31
   * 0xf3ffc07f = binary 11110011111111111100000001111111
   */
  var black_mask = 0xf3ffc07f;
  var n;

  /* Check for non-textual ("black-listed") bytes. */
  for (n = 0; n <= 31; n++, black_mask >>>= 1) {
    if ((black_mask & 1) && (s.dyn_ltree[n*2]/*.Freq*/ !== 0)) {
      return Z_BINARY;
    }
  }

  /* Check for textual ("white-listed") bytes. */
  if (s.dyn_ltree[9 * 2]/*.Freq*/ !== 0 || s.dyn_ltree[10 * 2]/*.Freq*/ !== 0 ||
      s.dyn_ltree[13 * 2]/*.Freq*/ !== 0) {
    return Z_TEXT;
  }
  for (n = 32; n < LITERALS; n++) {
    if (s.dyn_ltree[n * 2]/*.Freq*/ !== 0) {
      return Z_TEXT;
    }
  }

  /* There are no "black-listed" or "white-listed" bytes:
   * this stream either is empty or has tolerated ("gray-listed") bytes only.
   */
  return Z_BINARY;
}


var static_init_done = false;

/* ===========================================================================
 * Initialize the tree data structures for a new zlib stream.
 */
function _tr_init(s)
{

  if (!static_init_done) {
    tr_static_init();
    static_init_done = true;
  }

  s.l_desc  = new TreeDesc(s.dyn_ltree, static_l_desc);
  s.d_desc  = new TreeDesc(s.dyn_dtree, static_d_desc);
  s.bl_desc = new TreeDesc(s.bl_tree, static_bl_desc);

  s.bi_buf = 0;
  s.bi_valid = 0;

  /* Initialize the first block of the first file: */
  init_block(s);
}


/* ===========================================================================
 * Send a stored block
 */
function _tr_stored_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  send_bits(s, (STORED_BLOCK<<1)+(last ? 1 : 0), 3);    /* send block type */
  copy_block(s, buf, stored_len, true); /* with header */
}


/* ===========================================================================
 * Send one empty static block to give enough lookahead for inflate.
 * This takes 10 bits, of which 7 may remain in the bit buffer.
 */
function _tr_align(s) {
  send_bits(s, STATIC_TREES<<1, 3);
  send_code(s, END_BLOCK, static_ltree);
  bi_flush(s);
}


/* ===========================================================================
 * Determine the best encoding for the current block: dynamic trees, static
 * trees or store, and output the encoded block to the zip file.
 */
function _tr_flush_block(s, buf, stored_len, last)
//DeflateState *s;
//charf *buf;       /* input block, or NULL if too old */
//ulg stored_len;   /* length of input block */
//int last;         /* one if this is the last block for a file */
{
  var opt_lenb, static_lenb;  /* opt_len and static_len in bytes */
  var max_blindex = 0;        /* index of last bit length code of non zero freq */

  /* Build the Huffman trees unless a stored block is forced */
  if (s.level > 0) {

    /* Check if the file is binary or text */
    if (s.strm.data_type === Z_UNKNOWN) {
      s.strm.data_type = detect_data_type(s);
    }

    /* Construct the literal and distance trees */
    build_tree(s, s.l_desc);
    // Tracev((stderr, "\nlit data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));

    build_tree(s, s.d_desc);
    // Tracev((stderr, "\ndist data: dyn %ld, stat %ld", s->opt_len,
    //        s->static_len));
    /* At this point, opt_len and static_len are the total bit lengths of
     * the compressed block data, excluding the tree representations.
     */

    /* Build the bit length tree for the above two trees, and get the index
     * in bl_order of the last bit length code to send.
     */
    max_blindex = build_bl_tree(s);

    /* Determine the best encoding. Compute the block lengths in bytes. */
    opt_lenb = (s.opt_len+3+7) >>> 3;
    static_lenb = (s.static_len+3+7) >>> 3;

    // Tracev((stderr, "\nopt %lu(%lu) stat %lu(%lu) stored %lu lit %u ",
    //        opt_lenb, s->opt_len, static_lenb, s->static_len, stored_len,
    //        s->last_lit));

    if (static_lenb <= opt_lenb) { opt_lenb = static_lenb; }

  } else {
    // Assert(buf != (char*)0, "lost buf");
    opt_lenb = static_lenb = stored_len + 5; /* force a stored block */
  }

  if ((stored_len+4 <= opt_lenb) && (buf !== -1)) {
    /* 4: two words for the lengths */

    /* The test buf != NULL is only necessary if LIT_BUFSIZE > WSIZE.
     * Otherwise we can't have processed more than WSIZE input bytes since
     * the last block flush, because compression would have been
     * successful. If LIT_BUFSIZE <= WSIZE, it is never too late to
     * transform a block into a stored block.
     */
    _tr_stored_block(s, buf, stored_len, last);

  } else if (s.strategy === Z_FIXED || static_lenb === opt_lenb) {

    send_bits(s, (STATIC_TREES<<1) + (last ? 1 : 0), 3);
    compress_block(s, static_ltree, static_dtree);

  } else {
    send_bits(s, (DYN_TREES<<1) + (last ? 1 : 0), 3);
    send_all_trees(s, s.l_desc.max_code+1, s.d_desc.max_code+1, max_blindex+1);
    compress_block(s, s.dyn_ltree, s.dyn_dtree);
  }
  // Assert (s->compressed_len == s->bits_sent, "bad compressed size");
  /* The above check is made mod 2^32, for files larger than 512 MB
   * and uLong implemented on 32 bits.
   */
  init_block(s);

  if (last) {
    bi_windup(s);
  }
  // Tracev((stderr,"\ncomprlen %lu(%lu) ", s->compressed_len>>3,
  //       s->compressed_len-7*last));
}

/* ===========================================================================
 * Save the match info and tally the frequency counts. Return true if
 * the current block must be flushed.
 */
function _tr_tally(s, dist, lc)
//    deflate_state *s;
//    unsigned dist;  /* distance of matched string */
//    unsigned lc;    /* match length-MIN_MATCH or unmatched char (if dist==0) */
{
  //var out_length, in_length, dcode;

  s.pending_buf[s.d_buf + s.last_lit * 2]     = (dist >>> 8) & 0xff;
  s.pending_buf[s.d_buf + s.last_lit * 2 + 1] = dist & 0xff;

  s.pending_buf[s.l_buf + s.last_lit] = lc & 0xff;
  s.last_lit++;

  if (dist === 0) {
    /* lc is the unmatched char */
    s.dyn_ltree[lc*2]/*.Freq*/++;
  } else {
    s.matches++;
    /* Here, lc is the match length - MIN_MATCH */
    dist--;             /* dist = match distance - 1 */
    //Assert((ush)dist < (ush)MAX_DIST(s) &&
    //       (ush)lc <= (ush)(MAX_MATCH-MIN_MATCH) &&
    //       (ush)d_code(dist) < (ush)D_CODES,  "_tr_tally: bad match");

    s.dyn_ltree[(_length_code[lc]+LITERALS+1) * 2]/*.Freq*/++;
    s.dyn_dtree[d_code(dist) * 2]/*.Freq*/++;
  }

// (!) This block is disabled in zlib defailts,
// don't enable it for binary compatibility

//#ifdef TRUNCATE_BLOCK
//  /* Try to guess if it is profitable to stop the current block here */
//  if ((s.last_lit & 0x1fff) === 0 && s.level > 2) {
//    /* Compute an upper bound for the compressed length */
//    out_length = s.last_lit*8;
//    in_length = s.strstart - s.block_start;
//
//    for (dcode = 0; dcode < D_CODES; dcode++) {
//      out_length += s.dyn_dtree[dcode*2]/*.Freq*/ * (5 + extra_dbits[dcode]);
//    }
//    out_length >>>= 3;
//    //Tracev((stderr,"\nlast_lit %u, in %ld, out ~%ld(%ld%%) ",
//    //       s->last_lit, in_length, out_length,
//    //       100L - out_length*100L/in_length));
//    if (s.matches < (s.last_lit>>1)/*int /2*/ && out_length < (in_length>>1)/*int /2*/) {
//      return true;
//    }
//  }
//#endif

  return (s.last_lit === s.lit_bufsize-1);
  /* We avoid equality with lit_bufsize because of wraparound at 64K
   * on 16 bit machines and because stored blocks are restricted to
   * 64K-1 bytes.
   */
}

exports._tr_init  = _tr_init;
exports._tr_stored_block = _tr_stored_block;
exports._tr_flush_block  = _tr_flush_block;
exports._tr_tally = _tr_tally;
exports._tr_align = _tr_align;
},{"../utils/common":18}],30:[function(require,module,exports){
'use strict';


function ZStream() {
  /* next input byte */
  this.input = null; // JS specific, because we have no pointers
  this.next_in = 0;
  /* number of bytes available at input */
  this.avail_in = 0;
  /* total number of input bytes read so far */
  this.total_in = 0;
  /* next output byte should be put there */
  this.output = null; // JS specific, because we have no pointers
  this.next_out = 0;
  /* remaining free space at output */
  this.avail_out = 0;
  /* total number of bytes output so far */
  this.total_out = 0;
  /* last error message, NULL if no error */
  this.msg = ''/*Z_NULL*/;
  /* not visible by applications */
  this.state = null;
  /* best guess about the data type: binary or text */
  this.data_type = 2/*Z_UNKNOWN*/;
  /* adler32 value of the uncompressed data */
  this.adler = 0;
}

module.exports = ZStream;
},{}],31:[function(require,module,exports){
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
      }
      throw TypeError('Uncaught, unspecified "error" event.');
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