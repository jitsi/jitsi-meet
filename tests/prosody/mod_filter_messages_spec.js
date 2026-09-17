import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const METADATA_COMPONENT = 'metadata.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';

let _counter = 0;
const nextRoom = () => `filter-msg-${++_counter}@${CONFERENCE}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Connects an authenticated client to the main VirtualHost.
 *
 * @param {string} roomJid     Full room JID — used as the room claim in the token
 *                             and as the ?room= WebSocket param.
 * @param {object} [contextUser]  JWT context.user claims; moderator: true → owner.
 * @param {object} [features]     JWT context.features claims.
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
    const params = { room: roomName,
        token };

    return createXmppClient({ params });
}

const connectModerator = roomJid => connect(roomJid, { contextUser: { moderator: true } });

/**
 * Sets a chat restriction on the room and waits for the metadata broadcast
 * to confirm Prosody has processed the update before returning.
 *
 * @param {object} mod      Moderator XMPP client (occupant of the room).
 * @param {string} roomJid  Full room JID.
 * @param {string} [key]    Permission to set: 'groupChatRestricted' (default)
 *                          or 'privateChatRestricted'.
 */
async function restrictChat(mod, roomJid, key = 'groupChatRestricted') {
    mod.sendMetadataUpdate(METADATA_COMPONENT, roomJid, 'permissions', { [key]: true });
    await mod.waitForMessage(s => {
        const jsonMsg = s.getChild('json-message', JITMEET_NS);

        if (!jsonMsg) {
            return false;
        }
        try {
            const parsed = JSON.parse(jsonMsg.getText());

            return parsed?.metadata?.permissions?.[key] === true;
        } catch {
            return false;
        }
    }, 3000);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mod_filter_messages', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // ── unrestricted ──────────────────────────────────────────────────────────

    it('message is delivered when groupChatRestricted is not set', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);

        clients.push(focus);

        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        const reply = await sender.sendGroupchat(r, 'hello');

        assert.notEqual(reply.attrs.type, 'error', 'message must not be blocked when chat is unrestricted');
    });

    // ── restricted — blocked ──────────────────────────────────────────────────

    it('anonymous sender is blocked when groupChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        // Anonymous sender joins.
        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r);

        const reply = await sender.sendGroupchat(r, 'blocked?');

        assert.strictEqual(reply.attrs.type, 'error',
            'anonymous sender must be blocked when groupChatRestricted');
        assert.ok(
            reply.getChild('error')?.getChild('not-allowed'),
            'expected <not-allowed/> error condition'
        );
    });

    it('sender with send-groupchat=false is blocked when groupChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        const sender = await connect(r, { features: { 'send-groupchat': false } });

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r);

        const reply = await sender.sendGroupchat(r, 'blocked?');

        assert.strictEqual(reply.attrs.type, 'error',
            'sender with send-groupchat=false must be blocked');
        assert.ok(
            reply.getChild('error')?.getChild('not-allowed'),
            'expected <not-allowed/> error condition'
        );
    });

    it('sender with no send-groupchat key in features is blocked when groupChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        // Token has a features object but no send-groupchat key.
        const sender = await connect(r, { features: { 'screen-sharing': true } });

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r);

        const reply = await sender.sendGroupchat(r, 'blocked?');

        assert.strictEqual(reply.attrs.type, 'error',
            'sender without send-groupchat key must be blocked');
        assert.ok(
            reply.getChild('error')?.getChild('not-allowed'),
            'expected <not-allowed/> error condition'
        );
    });

    it('moderator with no features in token is allowed when groupChatRestricted is true', async () => {
        // mod_jitsi_permissions (auto-loaded by muc_meeting_id) injects
        // default_permissions (which includes send-groupchat=true) into
        // session.jitsi_meet_context_features for moderators whose token
        // has no explicit context.features.
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        const sender = await connect(r, { contextUser: { moderator: true } });

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r);

        const reply = await sender.sendGroupchat(r, 'allowed?');

        assert.notEqual(reply.attrs.type, 'error',
            'moderator with no explicit features gets default permissions (send-groupchat=true)');
    });

    it('moderator with empty features in token is blocked when groupChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        // Moderator token with an empty features object.
        const sender = await connect(r, { contextUser: { moderator: true },
            features: {} });

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r);

        const reply = await sender.sendGroupchat(r, 'blocked?');

        assert.strictEqual(reply.attrs.type, 'error',
            'moderator with empty features must be blocked');
        assert.ok(
            reply.getChild('error')?.getChild('not-allowed'),
            'expected <not-allowed/> error condition'
        );
    });

    // ── restricted — allowed ──────────────────────────────────────────────────

    it('sender with send-groupchat=true is allowed when groupChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        const sender = await connect(r, { features: { 'send-groupchat': true } });

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r);

        const reply = await sender.sendGroupchat(r, 'allowed!');

        assert.notEqual(reply.attrs.type, 'error',
            'sender with send-groupchat=true must be allowed');
    });

    // ── body-less message ─────────────────────────────────────────────────────

    it('body-less message is always delivered even when groupChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        // Anonymous sender — would normally be blocked for body messages.
        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r);

        // Send a groupchat message with no <body> child.
        const reply = await sender.sendGroupchat(r);

        assert.notEqual(reply.attrs.type, 'error',
            'body-less message must pass through even when chat is restricted');
    });
});

// ─── privateChatRestricted ────────────────────────────────────────────────────
//
// The same module also filters MUC private messages, through the
// muc-private-message event. muc_max_occupants is 2 in this configuration and
// focus is the only occupant that is exempt from that limit, so the moderator
// that sets the restriction is also the recipient in most of these tests.

describe('mod_filter_messages private messages', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // ── unrestricted ──────────────────────────────────────────────────────────

    it('private message is delivered when privateChatRestricted is not set', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);

        clients.push(focus);

        const recipient = await createXmppClient();

        clients.push(recipient);
        await recipient.joinRoom(r);

        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        const id = await sender.sendPrivateChat(r, recipient.nick, 'hello');
        const received = await recipient.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(received.getChildText('body'), 'hello',
            'private message must be delivered when private chat is unrestricted');
    });

    // ── restricted — blocked ──────────────────────────────────────────────────

    it('anonymous sender is blocked when privateChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r, 'privateChatRestricted');

        const id = await sender.sendPrivateChat(r, mod.nick, 'blocked?');
        const reply = await sender.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(reply.attrs.type, 'error',
            'anonymous sender must be blocked when privateChatRestricted');
        assert.ok(
            reply.getChild('error')?.getChild('not-allowed'),
            'expected <not-allowed/> error condition'
        );

        await assert.rejects(
            () => mod.waitForMessage(s => s.attrs.id === id, 1000),
            'the blocked message must not reach the recipient'
        );
    });

    it('sender with send-private-message=false is blocked when privateChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        const sender = await connect(r, { features: { 'send-private-message': false } });

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r, 'privateChatRestricted');

        const id = await sender.sendPrivateChat(r, mod.nick, 'blocked?');
        const reply = await sender.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(reply.attrs.type, 'error',
            'sender with send-private-message=false must be blocked');
    });

    // ── restricted — allowed ──────────────────────────────────────────────────

    it('sender with send-private-message=true is allowed when privateChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        const sender = await connect(r, { features: { 'send-private-message': true } });

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r, 'privateChatRestricted');

        const id = await sender.sendPrivateChat(r, mod.nick, 'allowed!');
        const received = await mod.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(received.getChildText('body'), 'allowed!',
            'sender with send-private-message=true must be allowed');
    });

    it('moderator with no features in token is allowed when privateChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        // A moderator without explicit token features gets the default
        // permissions, which include send-private-message.
        const sender = await connectModerator(r);

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r, 'privateChatRestricted');

        const id = await sender.sendPrivateChat(r, mod.nick, 'allowed!');
        const received = await mod.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(received.getChildText('body'), 'allowed!',
            'moderator must keep private chat when privateChatRestricted');
    });

    // ── the two restrictions are independent ──────────────────────────────────

    it('groupChatRestricted alone does not block a private message', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r);

        const blocked = await sender.sendGroupchat(r, 'blocked?');

        assert.strictEqual(blocked.attrs.type, 'error',
            'precondition: group chat must be blocked for this sender');

        const id = await sender.sendPrivateChat(r, mod.nick, 'still allowed');
        const received = await mod.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(received.getChildText('body'), 'still allowed',
            'a group chat restriction must not block private messages');
    });

    // ── body-less message ─────────────────────────────────────────────────────

    it('body-less private message is delivered even when privateChatRestricted is true', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);
        const mod = await connectModerator(r);

        clients.push(focus, mod);
        await mod.joinRoom(r);

        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        await restrictChat(mod, r, 'privateChatRestricted');

        const id = await sender.sendPrivateChat(r, mod.nick);
        const received = await mod.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(received.attrs.type, 'chat',
            'body-less message must pass through even when private chat is restricted');
    });
});
