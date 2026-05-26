import assert from 'assert';
import { xml } from '@xmpp/client';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE        = 'conference.localhost';
const METADATA_COMPONENT = 'metadata.localhost';
const JITMEET_NS        = 'http://jitsi.org/jitmeet';
const LIMIT             = 3;
const ERROR_TEXT        = 'The message limit for the room has been reached. Messaging is now disabled.';

let _counter = 0;
const nextRoom = () => `limit-${++_counter}@${CONFERENCE}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Connects an anonymous client to the main VirtualHost with ?room= set so that
 * session.jitsi_web_query_room is populated — required by mod_muc_limit_messages
 * to locate the room via get_room_by_name_and_subdomain.
 *
 * @param {string} roomJid  Full room JID, e.g. 'name@conference.localhost'
 */
function connectAnon(roomJid) {
    const roomName = roomJid.split('@')[0];

    return createXmppClient({ params: { room: roomName } });
}

/**
 * Connects a token-authenticated client. session.auth_token is set by Prosody's
 * auth_token module on the VirtualHost, and read by mod_muc_limit_messages when
 * muc_limit_messages_check_token = true to permanently lift the room cap.
 *
 * @param {string} roomJid
 * @param {object} [contextUser]  JWT context.user claims; moderator: true → owner
 */
function connectWithToken(roomJid, { contextUser } = {}) {
    const roomName = roomJid.split('@')[0];
    const token = mintAsapToken({ room: roomName,
        context: contextUser ? { user: contextUser } : {} });

    return createXmppClient({ params: { room: roomName,
        token } });
}

const connectModerator = roomJid => connectWithToken(roomJid, { contextUser: { moderator: true } });

/**
 * Sends LIMIT messages (all within the cap) then one more that triggers the
 * block. Returns the reply stanza for the triggering message.
 */
async function exhaustAndTrigger(sender, roomJid) {
    for (let i = 0; i < LIMIT; i++) {
        await sender.sendGroupchat(roomJid, `msg ${i + 1}`);
    }

    return sender.sendGroupchat(roomJid, 'trigger');
}

/**
 * Sets groupChatRestricted on the room and waits for the metadata broadcast
 * to confirm Prosody has processed it before returning.
 */
async function restrictChat(mod, roomJid) {
    mod.sendMetadataUpdate(METADATA_COMPONENT, roomJid, 'permissions', { groupChatRestricted: true });
    await mod.waitForMessage(s => {
        const j = s.getChild('json-message', JITMEET_NS);

        if (!j) {
            return false;
        }
        try {
            return JSON.parse(j.getText())?.metadata?.permissions?.groupChatRestricted === true;
        } catch {
            return false;
        }
    }, 3000);
}

/**
 * Clears groupChatRestricted and waits for the metadata broadcast to confirm.
 */
async function unrestrictChat(mod, roomJid) {
    mod.sendMetadataUpdate(METADATA_COMPONENT, roomJid, 'permissions', { groupChatRestricted: false });
    await mod.waitForMessage(s => {
        const j = s.getChild('json-message', JITMEET_NS);

        if (!j) {
            return false;
        }
        try {
            return JSON.parse(j.getText())?.metadata?.permissions?.groupChatRestricted === false;
        } catch {
            return false;
        }
    }, 3000);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mod_muc_limit_messages', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // ── within limit ──────────────────────────────────────────────────────────

    it('messages within the cap are delivered', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const sender = await connectAnon(r);

        clients.push(focus, sender);
        await sender.joinRoom(r);

        for (let i = 0; i < LIMIT; i++) {
            const reply = await sender.sendGroupchat(r, `message ${i + 1}`);

            assert.notEqual(reply.attrs.type, 'error',
                `message ${i + 1} must not be blocked (within cap)`);
        }
    });

    // ── at cap boundary ───────────────────────────────────────────────────────

    it('first message over cap is rejected with <not-allowed/>', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const sender = await connectAnon(r);

        clients.push(focus, sender);
        await sender.joinRoom(r);

        const reply = await exhaustAndTrigger(sender, r);

        assert.strictEqual(reply.attrs.type, 'error',
            'triggering message must be rejected');
        assert.ok(
            reply.getChild('error')?.getChild('not-allowed'),
            'error condition must be <not-allowed/>'
        );
    });

    it('room broadcast is sent when cap is first hit', async () => {
        const r = nextRoom();
        const focus    = await joinWithFocus(r);
        const sender   = await connectAnon(r);
        // observer must join before the limit fires so it is an occupant
        // when the broadcast is sent; muc_max_occupants=2 so focus (exempt) +
        // sender + observer = 2 non-whitelisted users, within the limit.
        const observer = await connectAnon(r);

        clients.push(focus, sender, observer);
        await sender.joinRoom(r);
        await observer.joinRoom(r);

        for (let i = 0; i < LIMIT; i++) {
            await sender.sendGroupchat(r, `msg ${i + 1}`);
        }

        const [ senderReply, announcement ] = await Promise.all([
            sender.sendGroupchat(r, 'trigger'),
            observer.waitForMessage(
                s => s.attrs.type === 'groupchat'
                    && s.getChildText('body') === ERROR_TEXT,
                5000
            ),
        ]);

        assert.strictEqual(senderReply.attrs.type, 'error');
        assert.ok(announcement, 'observer must receive the room announcement');
    });

    // ── after cap is set ──────────────────────────────────────────────────────

    it('messages after cap remain blocked', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const sender = await connectAnon(r);

        clients.push(focus, sender);
        await sender.joinRoom(r);

        await exhaustAndTrigger(sender, r);

        for (let i = 0; i < 2; i++) {
            const reply = await sender.sendGroupchat(r, `post-cap ${i + 1}`);

            assert.strictEqual(reply.attrs.type, 'error',
                `message ${i + 1} after cap must remain blocked`);
        }
    });

    // ── message type exemptions ───────────────────────────────────────────────

    it('body-less groupchat (no json) counts toward the cap and is blocked', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const sender = await connectAnon(r);

        clients.push(focus, sender);
        await sender.joinRoom(r);

        // Fill LIMIT-1 slots with regular messages.
        for (let i = 0; i < LIMIT - 1; i++) {
            await sender.sendGroupchat(r, `msg ${i + 1}`);
        }

        // Body-less groupchat with no json: not exempt, consumes the last slot.
        const bodyless = await sender.sendGroupchat(r, undefined);

        assert.notEqual(bodyless.attrs.type, 'error',
            'body-less groupchat within cap must pass through');

        // Next message triggers the block.
        const over = await sender.sendGroupchat(r, 'now blocked');

        assert.strictEqual(over.attrs.type, 'error',
            'message after body-less consumed last slot must be blocked');
    });

    it('answer-poll json-message passes through even after cap is reached', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const sender = await connectAnon(r);

        clients.push(focus, sender);
        await sender.joinRoom(r);

        await exhaustAndTrigger(sender, r);

        const pollEl = xml('json-message', { xmlns: JITMEET_NS },
            JSON.stringify({ type: 'answer-poll',
                pollId: '1',
                answers: [] }));
        const reply = await sender.sendGroupchat(r, undefined, [ pollEl ]);

        assert.notEqual(reply.attrs.type, 'error',
            'answer-poll body-less message must pass through regardless of cap');
    });

    // ── check_token × token_verification interaction ──────────────────────────
    //
    // muc_limit_messages_check_token = true on conference.localhost.
    // A sender whose session.auth_token is set (set by mod_auth_token when the
    // client connects with a valid JWT) permanently disables the cap for that room
    // by setting room._muc_messages_limit = false, overriding even a cap already
    // set to true.

    it('authenticated sender lifts the cap permanently', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const anon   = await connectAnon(r);
        const authed = await connectWithToken(r);

        clients.push(focus, anon, authed);
        await anon.joinRoom(r);
        await authed.joinRoom(r);

        // Anonymous sender exhausts and triggers the cap.
        await exhaustAndTrigger(anon, r);

        // Authenticated sender (session.auth_token set by token_verification)
        // sets room._muc_messages_limit = false.
        const authedReply = await authed.sendGroupchat(r, 'auth unlocks');

        assert.notEqual(authedReply.attrs.type, 'error',
            'authenticated sender must pass through');

        // Cap is now lifted: anonymous sender can send freely again.
        const anonReply = await anon.sendGroupchat(r, 'now unlimited');

        assert.notEqual(anonReply.attrs.type, 'error',
            'cap must be permanently lifted after authenticated sender');
    });

    it('unauthenticated sender is still capped when check_token is enabled', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const anon  = await connectAnon(r);

        clients.push(focus, anon);
        await anon.joinRoom(r);

        const reply = await exhaustAndTrigger(anon, r);

        assert.strictEqual(reply.attrs.type, 'error',
            'anonymous sender must still hit the cap with check_token=true');
    });

    // ── priority-race regression detector ─────────────────────────────────────
    //
    // mod_filter_messages and mod_muc_limit_messages both hook message/bare at
    // the default priority (0). Lua's table.sort is not stable for equal keys,
    // so the firing order is non-deterministic across Prosody restarts (but
    // fixed for the lifetime of a single Prosody process).
    //
    // When muc_limit_messages fires first it increments the room counter before
    // filter_messages swallows the message, so the LIMIT blocked messages
    // silently exhaust the cap. The very next real message then trips it.

    it('[race] muc_limit_messages must not count messages already blocked by filter_messages', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const mod   = await connectModerator(r);
        const anon  = await connectAnon(r);

        clients.push(focus, mod, anon);
        await mod.joinRoom(r);
        await anon.joinRoom(r);

        // Restrict chat; filter_messages should swallow every anon message.
        await restrictChat(mod, r);

        // Send exactly LIMIT messages. If muc_limit_messages runs first on all
        // of them the counter hits the cap without any real message delivered.
        for (let i = 0; i < LIMIT; i++) {
            await anon.sendGroupchat(r, `blocked ${i + 1}`);
        }

        await unrestrictChat(mod, r);

        // With correct ordering the counter is still 0 and this passes.
        // With the race the counter is already LIMIT, this triggers the cap
        // and is rejected with <not-allowed/>.
        const reply = await anon.sendGroupchat(r, 'should pass');

        assert.notEqual(reply.attrs.type, 'error',
            'race: muc_limit_messages counted filter_messages-blocked messages');
    });

    // ── filter_messages × muc_limit_messages hook-ordering interaction ────────
    //
    // filter_messages is listed before muc_limit_messages in modules_enabled so
    // its message/bare hook fires first. When filter_messages blocks a message it
    // returns true, ending the hook chain — muc_limit_messages never runs and the
    // room counter is not incremented. Verifies correct ordering.

    it('messages blocked by filter_messages do not count toward the cap', async () => {
        const r = nextRoom();
        const focus = await joinWithFocus(r);
        const mod   = await connectModerator(r);
        const anon  = await connectAnon(r);

        clients.push(focus, mod, anon);
        await mod.joinRoom(r);
        await anon.joinRoom(r);

        // Restrict chat so that filter_messages blocks anon messages.
        await restrictChat(mod, r);

        // Send more than LIMIT messages — all blocked by filter_messages before
        // muc_limit_messages runs, so the room counter stays at zero.
        for (let i = 0; i < LIMIT + 1; i++) {
            const reply = await anon.sendGroupchat(r, `restricted ${i + 1}`);

            assert.strictEqual(reply.attrs.type, 'error',
                `restricted message ${i + 1} must be blocked`);
        }

        // Lift the restriction.
        await unrestrictChat(mod, r);

        // Counter is still 0, so the next LIMIT messages must all pass.
        for (let i = 0; i < LIMIT; i++) {
            const reply = await anon.sendGroupchat(r, `after unrestrict ${i + 1}`);

            assert.notEqual(reply.attrs.type, 'error',
                `message ${i + 1} after unrestrict must pass (cap not consumed by blocked messages)`);
        }
    });

});
