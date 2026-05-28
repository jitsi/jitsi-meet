import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { setHideDisplayNameForGuests, setRoomMaxOccupants } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const NICK_NS = 'http://jabber.org/protocol/nick';
const DISPLAY_NAME_NS = 'http://jitsi.org/protocol/display-name';

let _counter = 0;
const nextRoom = () => `displayname-${++_counter}@${CONFERENCE}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Connects a client on the main VirtualHost with a given token context.
 * Always passes ?room= so that session.jitsi_web_query_room is set —
 * required by the hideDisplayNameForGuests outbound filter.
 *
 * @param {string} roomJid
 * @param {object} [contextUser]  JWT context.user claims (e.g. { name: 'Alice' })
 * @param {object} [features]     JWT context.features claims
 */
function connect(roomJid, { contextUser, features } = {}) {
    const roomName = roomJid.split('@')[0];
    const context = {};

    if (contextUser !== undefined) {
        context.user = contextUser;
    }
    if (features !== undefined) {
        context.features = features;
    }
    const token = mintAsapToken({ room: roomName,
        context });

    return createXmppClient({ params: { room: roomName,
        token } });
}

const connectModerator = roomJid => connect(roomJid, { contextUser: { moderator: true } });

/**
 * Waits for a non-error, non-unavailable presence from a specific occupant nick.
 * Skips any presences already queued from earlier occupants.
 *
 * @param {object} client   observer client
 * @param {string} roomJid
 * @param {string} nick     MUC nick of the occupant to wait for
 */
function waitForOtherPresence(client, roomJid, nick) {
    return client.waitForPresence(
        s => s.attrs.from === `${roomJid}/${nick}` && !s.attrs.type,
        5000
    );
}

// ─── name-readonly ────────────────────────────────────────────────────────────

describe('mod_muc_displayname — name-readonly', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('enforces token name: observer sees token name even when sender sent a different nick', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const observer = await createXmppClient({ params: { room: r.split('@')[0] } });

        clients.push(focus, observer);
        await observer.joinRoom(r);

        // Alice connects with name-readonly=true and name="Alice" in the token.
        const alice = await connect(r, {
            contextUser: { name: 'Alice' },
            features: { 'name-readonly': true }
        });

        clients.push(alice);

        // Alice joins with a different display name — the inbound filter must replace it.
        await alice.joinRoom(r, undefined, { displayName: 'WrongName' });

        // The observer sees Alice's join presence; nick must be "Alice" (from token).
        const presence = await waitForOtherPresence(observer, r, alice.nick);
        const nick = presence.getChild('nick', NICK_NS);

        assert.ok(nick, 'presence must contain a <nick> element');
        assert.strictEqual(nick.getText(), 'Alice',
            'nick must be the token name, not the client-supplied name');
    });

    it('strips nick when name-readonly=true and token has no name', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const observer = await createXmppClient({ params: { room: r.split('@')[0] } });

        clients.push(focus, observer);
        await observer.joinRoom(r);

        // No context.user.name — name-readonly with no name means nick is stripped.
        const alice = await connect(r, { features: { 'name-readonly': true } });

        clients.push(alice);
        await alice.joinRoom(r, undefined, { displayName: 'SomeName' });

        const presence = await waitForOtherPresence(observer, r, alice.nick);

        assert.ok(
            !presence.getChild('nick', NICK_NS),
            'nick element must be absent when name-readonly and token has no name'
        );
    });

    it('passes nick unchanged when name-readonly is not set', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const observer = await createXmppClient({ params: { room: r.split('@')[0] } });

        clients.push(focus, observer);
        await observer.joinRoom(r);

        // No name-readonly feature — client's own nick must be preserved.
        const alice = await connect(r, { contextUser: { name: 'Alice' } });

        clients.push(alice);
        await alice.joinRoom(r, undefined, { displayName: 'ChosenName' });

        const presence = await waitForOtherPresence(observer, r, alice.nick);
        const nick = presence.getChild('nick', NICK_NS);

        assert.ok(nick, 'presence must contain a <nick> element');
        assert.strictEqual(nick.getText(), 'ChosenName',
            'nick must be the client-supplied name when name-readonly is not set');
    });
});

// ─── hideDisplayNameForGuests ─────────────────────────────────────────────────

describe('mod_muc_displayname — hideDisplayNameForGuests', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('non-moderator recipient receives identity-stripped presence', async () => {
        const r = nextRoom();
        const roomName = r.split('@')[0];

        const focus = await joinWithFocus(r);

        await setRoomMaxOccupants(r, 10);

        // Non-moderator guest — must receive filtered presences.
        const guest = await createXmppClient({ params: { room: roomName } });

        // Moderator — must receive full presences.
        const mod = await connectModerator(r);

        clients.push(focus, guest, mod);
        await guest.joinRoom(r);
        await mod.joinRoom(r);

        await setHideDisplayNameForGuests(r, true);

        // Alice joins with a display name after the flag is set.
        const alice = await connect(r, { contextUser: { name: 'Alice' } });

        clients.push(alice);
        await alice.joinRoom(r, undefined, { displayName: 'Alice' });

        // Guest sees Alice's join presence — identity must be stripped.
        const guestPresence = await waitForOtherPresence(guest, r, alice.nick);

        assert.ok(
            !guestPresence.getChild('nick', NICK_NS),
            'non-moderator must not see <nick> when hideDisplayNameForGuests is true'
        );
    });

    it('moderator recipient receives full presence with identity intact', async () => {
        const r = nextRoom();
        const roomName = r.split('@')[0];

        const focus = await joinWithFocus(r);

        await setRoomMaxOccupants(r, 10);

        const guest = await createXmppClient({ params: { room: roomName } });
        const mod = await connectModerator(r);

        clients.push(focus, guest, mod);
        await guest.joinRoom(r);
        await mod.joinRoom(r);

        await setHideDisplayNameForGuests(r, true);

        const alice = await connect(r, { contextUser: { name: 'Alice' } });

        clients.push(alice);
        await alice.joinRoom(r, undefined, { displayName: 'Alice' });

        // Drain guest's copy; moderator's copy is what we assert on.
        await waitForOtherPresence(guest, r, alice.nick);

        // Mod sees Alice's join presence — identity must be intact.
        const modPresence = await waitForOtherPresence(mod, r, alice.nick);
        const nick = modPresence.getChild('nick', NICK_NS);

        assert.ok(nick, 'moderator must see <nick> when hideDisplayNameForGuests is true');
        assert.strictEqual(nick.getText(), 'Alice');
    });

    it('non-moderator receives full presence when hideDisplayNameForGuests is false', async () => {
        const r = nextRoom();
        const roomName = r.split('@')[0];

        const focus = await joinWithFocus(r);
        const guest = await createXmppClient({ params: { room: roomName } });

        clients.push(focus, guest);
        await guest.joinRoom(r);

        // Flag is not set — guest must receive full presence.
        const alice = await connect(r, { contextUser: { name: 'Alice' } });

        clients.push(alice);
        await alice.joinRoom(r, undefined, { displayName: 'Alice' });

        const presence = await waitForOtherPresence(guest, r, alice.nick);
        const nick = presence.getChild('nick', NICK_NS);

        assert.ok(nick, 'guest must see <nick> when hideDisplayNameForGuests is false');
        assert.strictEqual(nick.getText(), 'Alice');
    });
});

// ─── message display-name handling ───────────────────────────────────────────

describe('mod_muc_displayname — message display-name handling', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('live broadcast strips <nick> and <display-name> from groupchat messages', async () => {
        const r = nextRoom();
        const roomName = r.split('@')[0];

        const focus = await joinWithFocus(r);

        // Alice is the sender; Bob observes live delivery.
        const alice = await connect(r, { contextUser: { name: 'Alice' } });
        const bob = await createXmppClient({ params: { room: roomName } });

        clients.push(focus, alice, bob);
        await alice.joinRoom(r, undefined, { displayName: 'Alice' });
        await bob.joinRoom(r);

        await alice.sendGroupchat(r, 'hello');

        // Bob receives the live broadcast; it must not contain nick or display-name.
        const msg = await bob.waitForMessage(
            s => s.attrs.type === 'groupchat' && s.getChildText('body') === 'hello'
        );

        assert.ok(!msg.getChild('nick', NICK_NS),
            'live message must not contain <nick>');
        assert.ok(!msg.getChild('display-name', DISPLAY_NAME_NS),
            'live message must not contain <display-name>');
    });

    it('history message contains <display-name> injected from token name', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);

        // Alice has a token name; her message must be stored in history with display-name.
        const alice = await connect(r, { contextUser: { name: 'Alice',
            id: 'alice-id' } });

        clients.push(focus, alice);
        await alice.joinRoom(r);
        await alice.sendGroupchat(r, 'history-msg');

        // Bob joins after the message — he receives it as history (with <delay>).
        const bob = await createXmppClient({ params: { room: r.split('@')[0] } });

        clients.push(bob);
        await bob.joinRoom(r);

        const historyMsg = await bob.waitForMessage(
            s => s.attrs.type === 'groupchat'
                && s.getChildText('body') === 'history-msg'
                && s.getChild('delay') !== undefined
        );
        const displayName = historyMsg.getChild('display-name', DISPLAY_NAME_NS);

        assert.ok(displayName, 'history message must contain <display-name>');
        assert.strictEqual(displayName.getText(), 'Alice');
        assert.strictEqual(displayName.attrs.source, 'token');
    });

    it('history message contains <display-name> from nick for anonymous sender', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);

        // Anonymous sender — display name comes from their <nick> element, not token.
        const anon = await createXmppClient({ params: { room: r.split('@')[0] } });

        clients.push(focus, anon);
        await anon.joinRoom(r, undefined, { displayName: 'GuestUser' });
        await anon.sendGroupchat(r, 'anon-msg');

        const bob = await createXmppClient({ params: { room: r.split('@')[0] } });

        clients.push(bob);
        await bob.joinRoom(r);

        const historyMsg = await bob.waitForMessage(
            s => s.attrs.type === 'groupchat'
                && s.getChildText('body') === 'anon-msg'
                && s.getChild('delay') !== undefined
        );
        const displayName = historyMsg.getChild('display-name', DISPLAY_NAME_NS);

        assert.ok(displayName, 'history message must contain <display-name>');
        assert.strictEqual(displayName.getText(), 'GuestUser');
        assert.strictEqual(displayName.attrs.source, 'guest');
    });
});
