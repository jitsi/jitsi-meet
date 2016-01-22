/* jshint -W117 */
/* a simple MUC connection plugin
 * can only handle a single MUC room
 */

var logger = require("jitsi-meet-logger").getLogger(__filename);
var ChatRoom = require("./ChatRoom");

module.exports = function(XMPP) {
    Strophe.addConnectionPlugin('emuc', {
        connection: null,
        rooms: {},//map with the rooms
        init: function (conn) {
            this.connection = conn;
            // add handlers (just once)
            this.connection.addHandler(this.onPresence.bind(this), null,
                'presence', null, null, null, null);
            this.connection.addHandler(this.onPresenceUnavailable.bind(this),
                null, 'presence', 'unavailable', null);
            this.connection.addHandler(this.onPresenceError.bind(this), null,
                'presence', 'error', null);
            this.connection.addHandler(this.onMessage.bind(this), null,
                'message', null, null);
            this.connection.addHandler(this.onMute.bind(this),
                'http://jitsi.org/jitmeet/audio', 'iq', 'set',null,null);
        },
        createRoom: function (jid, password, options, settings) {
            var roomJid = Strophe.getBareJidFromJid(jid);
            if (this.rooms[roomJid]) {
                logger.error("You are already in the room!");
                return;
            }
            this.rooms[roomJid] = new ChatRoom(this.connection, jid,
                password, XMPP, options, settings);
            return this.rooms[roomJid];
        },
        doLeave: function (jid) {
            this.rooms[jid].doLeave();
            delete this.rooms[jid];
        },
        onPresence: function (pres) {
            var from = pres.getAttribute('from');

            // What is this for? A workaround for something?
            if (pres.getAttribute('type')) {
                return true;
            }

            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            // Parse status.
            if ($(pres).find('>x[xmlns="http://jabber.org/protocol/muc#user"]>status[code="201"]').length) {
                room.createNonAnonymousRoom();
            }

            room.onPresence(pres);

            return true;
        },
        onPresenceUnavailable: function (pres) {
            var from = pres.getAttribute('from');
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.onPresenceUnavailable(pres, from);
            return true;
        },
        onPresenceError: function (pres) {
            var from = pres.getAttribute('from');
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.onPresenceError(pres, from);
            return true;
        },
        onMessage: function (msg) {
            // FIXME: this is a hack. but jingle on muc makes nickchanges hard
            var from = msg.getAttribute('from');
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.onMessage(msg, from);
            return true;
        },

        setJingleSession: function (from, session) {
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.setJingleSession(session);
        },

        onMute: function(iq) {
            var from = iq.getAttribute('from');
            var room = this.rooms[Strophe.getBareJidFromJid(from)];
            if(!room)
                return;

            room.onMute(iq);
            return true;
        }
    });
};
