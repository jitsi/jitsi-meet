/* jshint -W117 */
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
    localAudio: null,
    localVideo: null,

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
            this.connection.disco.addFeature('urn:ietf:rfc:5761'); // rtcp-mux
            //this.connection.disco.addFeature('urn:ietf:rfc:5888'); // a=group, e.g. bundle
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
                sess = new JingleSession($(iq).attr('to'), $(iq).find('jingle').attr('sid'), this.connection);
                // configure session
                if (this.localAudio) {
                    sess.localStreams.push(this.localAudio);
                }
                if (this.localVideo) {
                    sess.localStreams.push(this.localVideo);
                }
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
                $(document).trigger('callincoming.jingle', [sess.sid]);
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
            this.connection);
        // configure session
        if (this.localAudio) {
            sess.localStreams.push(this.localAudio);
        }
        if (this.localVideo) {
            sess.localStreams.push(this.localVideo);
        }
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
                    switch (el.attr('type')) {
                        case 'stun':
                            dict.url = 'stun:' + el.attr('host');
                            if (el.attr('port')) {
                                dict.url += ':' + el.attr('port');
                            }
                            iceservers.push(dict);
                            break;
                        case 'turn':
                            dict.url = 'turn:';
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
    }
});
