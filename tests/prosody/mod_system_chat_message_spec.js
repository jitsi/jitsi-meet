import assert from 'assert';

import { mintAsapToken, mintSystemToken } from './helpers/jwt.js';
import { sendSystemChatMessage } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `system-chat-${++_roomCounter}@${CONFERENCE}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a room with a focus participant.
 *
 * @returns {Promise<{roomJid: string, focus: object}>}
 */
async function createRoom() {
    const roomJid = room();
    const focus = await joinWithFocus(roomJid);

    return { roomJid,
        focus };
}

/**
 * Disconnects all provided clients.
 *
 * @param {...object} clients - Clients to disconnect.
 * @returns {Promise<void>}
 */
async function disconnectAll(...clients) {
    await Promise.all(clients.map(c => c.disconnect()));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mod_system_chat_message', () => {

    // ── Authentication ───────────────────────────────────────────────────────
    //
    // mod_system_chat_message uses prosody_password_public_key_repo_url as its
    // key server — a separate key pair from login tokens (asap_key_server).
    // Auth failures return 401.

    describe('authentication', () => {

        it('returns 401 when Authorization header is absent', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const { status } = await sendSystemChatMessage(
                    roomJid, [ focus.jid ], 'hello', null, { omitAuth: true });

                assert.strictEqual(status, 401);
            } finally {
                await disconnectAll(focus);
            }
        });

        it('returns 401 when a login token is used instead of a system token', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const loginToken = mintAsapToken();
                const { status } = await sendSystemChatMessage(
                    roomJid, [ focus.jid ], 'hello', loginToken);

                assert.strictEqual(status, 401,
                    'login token must be rejected by the system key server');
            } finally {
                await disconnectAll(focus);
            }
        });

        it('returns 401 when token is expired', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const token = mintSystemToken({}, { expired: true });
                const { status } = await sendSystemChatMessage(
                    roomJid, [ focus.jid ], 'hello', token);

                assert.strictEqual(status, 401);
            } finally {
                await disconnectAll(focus);
            }
        });

    });

    // ── Parameter validation ─────────────────────────────────────────────────

    describe('parameter validation', () => {

        it('returns 400 when Content-Type is not application/json', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/send-system-chat-message',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                        Authorization: `Bearer ${token}`
                    },
                    body: '{"room":"r@conference.localhost","connectionJIDs":[],"message":"hi"}'
                }
            );

            assert.strictEqual(res.status, 400);
        });

        it('returns 400 when body is empty', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/send-system-chat-message',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: ''
                }
            );

            assert.strictEqual(res.status, 400);
        });

        it('returns 400 when message is missing', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const token = mintSystemToken();
                const res = await fetch(
                    'http://localhost:5280/send-system-chat-message',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ room: roomJid,
                            connectionJIDs: [ focus.jid ] })
                    }
                );

                assert.strictEqual(res.status, 400);
            } finally {
                await disconnectAll(focus);
            }
        });

        it('returns 400 when connectionJIDs is missing', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const token = mintSystemToken();
                const res = await fetch(
                    'http://localhost:5280/send-system-chat-message',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({ room: roomJid,
                            message: 'hi' })
                    }
                );

                assert.strictEqual(res.status, 400);
            } finally {
                await disconnectAll(focus);
            }
        });

        it('returns 400 when room is missing', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/send-system-chat-message',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ connectionJIDs: [],
                        message: 'hi' })
                }
            );

            assert.strictEqual(res.status, 400);
        });

    });

    // ── Room lookup ──────────────────────────────────────────────────────────

    describe('room lookup', () => {

        it('returns 404 when room does not exist', async () => {
            const token = mintSystemToken();
            const { status } = await sendSystemChatMessage(
                `nonexistent@${CONFERENCE}`, [], 'hi', token);

            assert.strictEqual(status, 404);
        });

    });

    // ── Message delivery ─────────────────────────────────────────────────────

    describe('message delivery', () => {

        it('returns 200 and delivers the message to the recipient', async () => {
            const { roomJid, focus } = await createRoom();
            const user = await createXmppClient();

            await user.joinRoom(roomJid);

            try {
                const token = mintSystemToken();
                const text = 'Hello from system';
                const { status } = await sendSystemChatMessage(
                    roomJid, [ user.jid ], text, token);

                assert.strictEqual(status, 200);

                const msg = await user.waitForMessage(
                    m => m.getChild('json-message', 'http://jitsi.org/jitmeet'));
                const jsonMessage = msg.getChild('json-message', 'http://jitsi.org/jitmeet');

                assert.ok(jsonMessage, 'message must contain a json-message element');

                const payload = JSON.parse(jsonMessage.text());

                assert.strictEqual(payload.type, 'system_chat_message');
                assert.strictEqual(payload.message, text);
            } finally {
                await disconnectAll(focus, user);
            }
        });

        it('includes displayName in the payload when provided', async () => {
            const { roomJid, focus } = await createRoom();
            const user = await createXmppClient();

            await user.joinRoom(roomJid);

            try {
                const token = mintSystemToken();
                const { status } = await sendSystemChatMessage(
                    roomJid, [ user.jid ], 'hi', token, { displayName: 'System' });

                assert.strictEqual(status, 200);

                const msg = await user.waitForMessage(
                    m => m.getChild('json-message', 'http://jitsi.org/jitmeet'));
                const payload = JSON.parse(
                    msg.getChild('json-message', 'http://jitsi.org/jitmeet').text());

                assert.strictEqual(payload.displayName, 'System');
            } finally {
                await disconnectAll(focus, user);
            }
        });

        it('delivers to multiple recipients', async () => {
            const { roomJid, focus } = await createRoom();
            const alice = await createXmppClient();
            const bob = await createXmppClient();

            await alice.joinRoom(roomJid);
            await bob.joinRoom(roomJid);

            try {
                const token = mintSystemToken();
                const { status } = await sendSystemChatMessage(
                    roomJid, [ alice.jid, bob.jid ], 'broadcast', token);

                assert.strictEqual(status, 200);

                const filter = m => m.getChild('json-message', 'http://jitsi.org/jitmeet');
                const [ msgA, msgB ] = await Promise.all([
                    alice.waitForMessage(filter),
                    bob.waitForMessage(filter)
                ]);

                for (const msg of [ msgA, msgB ]) {
                    const payload = JSON.parse(
                        msg.getChild('json-message', 'http://jitsi.org/jitmeet').text());

                    assert.strictEqual(payload.message, 'broadcast');
                }
            } finally {
                await disconnectAll(focus, alice, bob);
            }
        });

    });

});
