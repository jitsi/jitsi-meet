/* jshint -W117 */
/* a simple MUC connection plugin 
 * can only handle a single MUC room
 */
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
    init: function (conn) {
        this.connection = conn;
    },
    initPresenceMap: function (myroomjid) {
        this.presMap['to'] = myroomjid;
        this.presMap['xns'] = 'http://jabber.org/protocol/muc';
    },
    doJoin: function (jid, password) {
        this.myroomjid = jid;
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
    onPresence: function (pres) {
        var from = pres.getAttribute('from');
        var type = pres.getAttribute('type');
        if (type != null) {
            return true;
        }

        // Parse etherpad tag.
        var etherpad = $(pres).find('>etherpad');
        if (etherpad.length) {
            $(document).trigger('etherpadadded.muc', [from, etherpad.text()]);
        }

        // Parse prezi tag.
        var presentation = $(pres).find('>prezi');
        if (presentation.length)
        {
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

        if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="201"]').length) {
            // http://xmpp.org/extensions/xep-0045.html#createroom-instant
            this.isOwner = true;
            var create = $iq({type: 'set', to: this.roomjid})
                    .c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'})
                    .c('x', {xmlns: 'jabber:x:data', type: 'submit'});
            this.connection.send(create); // fire away
        }

        var member = {};
        member.show = $(pres).find('>show').text();
        member.status = $(pres).find('>status').text();
        var tmp = $(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>item');
        member.affiliation = tmp.attr('affiliation');
        member.role = tmp.attr('role');

        var nicktag = $(pres).find('>nick[xmlns="http://jabber.org/protocol/nick"]');
        member.displayName = (nicktag.length > 0 ? nicktag.text() : null);

        if (from == this.myroomjid) {
            if (member.affiliation == 'owner') this.isOwner = true;
            if (!this.joined) {
                this.joined = true;
                $(document).trigger('joined.muc', [from, member]);
                this.list_members.push(from);
            }
            else
                $(document).trigger('presence.muc', [from, member, pres]);
        } else if (this.members[from] === undefined) {
            // new participant
            this.members[from] = member;
            this.list_members.push(from);
            $(document).trigger('entered.muc', [from, member, pres]);
        } else {
            console.log('presence change from', from);
            $(document).trigger('presence.muc', [from, member, pres]);
        }
        return true;
    },
    onPresenceUnavailable: function (pres) {
        var from = pres.getAttribute('from');
        delete this.members[from];
        this.list_members.splice(this.list_members.indexOf(from), 1);
        $(document).trigger('left.muc', [from]);
        return true;
    },
    onPresenceError: function (pres) {
        var from = pres.getAttribute('from');
        if ($(pres).find('>error[type="auth"]>not-authorized[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
            $(document).trigger('passwordrequired.muc', [from]);
        } else {
            console.warn('onPresError ', pres);
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
    },
    onMessage: function (msg) {
        var txt = $(msg).find('>body').text();
        // TODO: <subject/>
        // FIXME: this is a hack. but jingle on muc makes nickchanges hard
        var from = msg.getAttribute('from');
        var nick = $(msg).find('>nick[xmlns="http://jabber.org/protocol/nick"]').text() || Strophe.getResourceFromJid(from);
        if (txt) {
            console.log('chat', nick, txt);

            Chat.updateChatConversation(from, nick, txt);
        }
        return true;
    },
    lockRoom: function (key) {
        //http://xmpp.org/extensions/xep-0045.html#roomconfig
        var ob = this;
        this.connection.sendIQ($iq({to: this.roomjid, type: 'get'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'}),
            function (res) {
                if ($(res).find('>query>x[xmlns="jabber:x:data"]>field[var="muc#roomconfig_roomsecret"]').length) {
                    var formsubmit = $iq({to: ob.roomjid, type: 'set'}).c('query', {xmlns: 'http://jabber.org/protocol/muc#owner'});
                    formsubmit.c('x', {xmlns: 'jabber:x:data', type: 'submit'});
                    formsubmit.c('field', {'var': 'FORM_TYPE'}).c('value').t('http://jabber.org/protocol/muc#roomconfig').up().up();
                    formsubmit.c('field', {'var': 'muc#roomconfig_roomsecret'}).c('value').t(key).up().up();
                    // FIXME: is muc#roomconfig_passwordprotectedroom required?
                    this.connection.sendIQ(formsubmit,
                        function (res) {
                            console.log('set room password');
                        },
                        function (err) {
                            console.warn('setting password failed', err);
                        }
                    );
                } else {
                    console.warn('room passwords not supported');
                }
            },
            function (err) {
                console.warn('setting password failed', err);
            }
        );
    },
    sendPresence: function () {
        var pres = $pres({to: this.presMap['to'] });
        pres.c('x', {xmlns: this.presMap['xns']});

        if (this.presMap['password']) {
            pres.c('password').t(this.presMap['password']).up();
        }

        pres.up();

        if (this.presMap['displayName']) {
            // XEP-0172
            pres.c('nick', {xmlns: 'http://jabber.org/protocol/nick'}).t(this.presMap['displayName']).up();
        }

        if (this.presMap['prezins']) {
            pres.c('prezi', {xmlns: this.presMap['prezins'], 'url': this.presMap['preziurl']}).
                            c('current').t(this.presMap['prezicurrent']).up().up();
        }

        if (this.presMap['etherpadns']) {
            pres.c('etherpad', {xmlns: this.presMap['etherpadns']}).t(this.presMap['etherpadname']).up();
        }

        if (this.presMap['medians'])
        {
            pres.c('media', {xmlns: this.presMap['medians']});
            var sourceNumber = 0;
            Object.keys(this.presMap).forEach(function (key) {
                if (key.indexOf('source') >= 0) {
                     sourceNumber++;
                }
            });
            if (sourceNumber > 0)
                for (var i = 1; i <= sourceNumber/3; i ++) {
                    pres.c('source',
                           {type: this.presMap['source' + i + '_type'],
                           ssrc: this.presMap['source' + i + '_ssrc'],
                           direction: this.presMap['source'+ i + '_direction'] || 'sendrecv' }
                    ).up();
                }
        }
        pres.up();
        connection.send(pres);
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
    addEtherpadToPresence: function(etherpadName) {
        this.presMap['etherpadns'] = 'http://jitsi.org/jitmeet/etherpad';
        this.presMap['etherpadname'] = etherpadName;
    }
});
