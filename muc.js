/* jshint -W117 */
/* a simple MUC connection plugin 
 * can only handle a single MUC room
 */
Strophe.addConnectionPlugin('emuc', {
    connection: null,
    roomjid: null,
    myroomjid: null,
    members: {},
    isOwner: false,
    init: function (conn) {
        this.connection = conn;
    },
    doJoin: function (jid, password) {
        this.myroomjid = jid;
        if (!this.roomjid) {
            this.roomjid = Strophe.getBareJidFromJid(jid);
            // add handlers (just once)
            this.connection.addHandler(this.onPresence.bind(this), null, 'presence', null, null, this.roomjid, {matchBare: true});
            this.connection.addHandler(this.onPresenceUnavailable.bind(this), null, 'presence', 'unavailable', null, this.roomjid, {matchBare: true});
            this.connection.addHandler(this.onPresenceError.bind(this), null, 'presence', 'error', null, this.roomjid, {matchBare: true});
            this.connection.addHandler(this.onMessage.bind(this), null, 'message', null, null, this.roomjid, {matchBare: true});
        }

        var join = $pres({to: this.myroomjid }).c('x', {xmlns: 'http://jabber.org/protocol/muc'});
        if (password !== null) {
            join.c('password').t(password);
        }
        this.connection.send(join);
    },
    onPresence: function (pres) {
        var from = pres.getAttribute('from');
        var type = pres.getAttribute('type');
        if (type != null) {
            return true;
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
        member.affilication = tmp.attr('affiliation');
        member.role = tmp.attr('role');
        if (from == this.myroomjid) {
            $(document).trigger('joined.muc', [from, member]);
        } else if (this.members[from] === undefined) {
            // new participant
            this.members[from] = member;
            $(document).trigger('entered.muc', [from, member]);
        } else {
            console.log('presence change from', from);
        }
        return true;
    },
    onPresenceUnavailable: function (pres) {
        var from = pres.getAttribute('from');
        delete this.members[from];
        $(document).trigger('left.muc', [from]);
        return true;
    },
    onPresenceError: function (pres) {
        var from = pres.getAttribute('from');
        if ($(pres).find('>error[type="auth"]>not-authorized[xmlns="urn:ietf:params:xml:ns:xmpp-stanzas"]').length) {
            $(document).trigger('passwordrequired.muc', [from]);

            // FIXME: remove once moved to passwordrequired which should reuse dojoin
            var ob = this;
            window.setTimeout(function () {
                var given = window.prompt('Password required');
                if (given != null) {
                    // FIXME: reuse doJoin?
                    ob.connection.send($pres({to: ob.myroomjid }).c('x', {xmlns: 'http://jabber.org/protocol/muc'}).c('password').t(given));
                } else {
                    // user aborted
                }
            }, 50);
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
        var nick = $(msg).find('>nick[xmlns="http://jabber.org/protocol/nick"]').text() || Strophe.getResourceFromJid(msg.getAttribute('from'));
        if (txt) {
            console.log('chat', nick, txt);

            updateChatConversation(nick, txt);
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
    }
});

