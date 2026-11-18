import assert from 'assert';
import { Buffer } from 'buffer';
import http from 'http';

import { mintAsapToken, mintSystemToken, mintToken } from './helpers/jwt.js';
import { getRoomState, kickParticipant } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `kick-test-${++_roomCounter}@${CONFERENCE}`;

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
 * Sends a kick request to the endpoint served on the given VirtualHost.
 * fetch() cannot override the Host header, which Prosody routes HTTP by.
 *
 * @param {string} host - VirtualHost to address (Host header).
 * @param {string} roomJid - Room JID.
 * @param {string} participantId - Occupant nick to kick.
 * @param {string} token - Bearer token.
 * @returns {Promise<number>} The HTTP status.
 */
function kickOnHost(host, roomJid, participantId, token) {
    const body = JSON.stringify({ participantId });

    return new Promise((resolve, reject) => {
        const req = http.request({
            host: 'localhost',
            port: 5280,
            method: 'PUT',
            path: `/kick-participant?room=${encodeURIComponent(roomJid.split('@')[0])}`,
            headers: {
                Host: host,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                Authorization: `Bearer ${token}`
            }
        }, res => {
            res.resume();
            res.on('end', () => resolve(res.statusCode));
        });

        req.on('error', reject);
        req.end(body);
    });
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

describe('mod_muc_kick_participant', () => {

    // ── Authentication ───────────────────────────────────────────────────────
    //
    // mod_muc_kick_participant uses prosody_password_public_key_repo_url as its
    // key server — a separate key pair from login tokens (asap_key_server).
    // Auth failures return 403 (not 401).

    describe('authentication', () => {

        it('returns 403 when Authorization header is absent', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const { status } = await kickParticipant(roomJid, 'focus', null, { omitAuth: true });

                assert.strictEqual(status, 403);
            } finally {
                await disconnectAll(focus);
            }
        });

        it('returns 403 when a login token is used instead of a system token', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const loginToken = mintAsapToken({ room: '*' });
                const { status } = await kickParticipant(roomJid, 'focus', loginToken);

                assert.strictEqual(status, 403,
                    'login token must be rejected by the system key server');
            } finally {
                await disconnectAll(focus);
            }
        });

        it('returns 403 when token is expired', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const token = mintSystemToken({}, { expired: true });
                const { status } = await kickParticipant(roomJid, 'focus', token);

                assert.strictEqual(status, 403);
            } finally {
                await disconnectAll(focus);
            }
        });

        // hs256.localhost has only app_secret, so its token settings default to
        // HS256; the module must still verify the RS256 system tokens.
        describe('on a host with only app_secret', () => {

            it('accepts a system token', async () => {
                const { roomJid, focus } = await createRoom();

                try {
                    const status = await kickOnHost('hs256.localhost', roomJid, 'no-such-occupant', mintSystemToken());

                    assert.strictEqual(status, 404,
                        'system token must pass verification and reach the occupant lookup');
                } finally {
                    await disconnectAll(focus);
                }
            });

            it('returns 403 for a token signed with the host app_secret', async () => {
                const { roomJid, focus } = await createRoom();

                try {
                    const status = await kickOnHost('hs256.localhost', roomJid, 'focus', mintToken({ room: '*' }));

                    assert.strictEqual(status, 403);
                } finally {
                    await disconnectAll(focus);
                }
            });

        });

    });

    // ── Parameter validation ─────────────────────────────────────────────────

    describe('parameter validation', () => {

        it('returns 400 when Content-Type is not application/json', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/kick-participant?room=kick-test-0',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'text/plain',
                        Authorization: `Bearer ${token}`
                    },
                    body: '{"participantId":"focus"}'
                }
            );

            assert.strictEqual(res.status, 400);
        });

        it('returns 400 when body is empty', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/kick-participant?room=kick-test-0',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: ''
                }
            );

            assert.strictEqual(res.status, 400);
        });

        it('returns 400 when neither participantId nor number is provided', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/kick-participant?room=kick-test-0',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: '{}'
                }
            );

            assert.strictEqual(res.status, 400);
        });

        it('returns 400 when both participantId and number are provided', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/kick-participant?room=kick-test-0',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ participantId: 'focus',
                        number: '+1234' })
                }
            );

            assert.strictEqual(res.status, 400);
        });

    });

    // ── Kick behaviour ───────────────────────────────────────────────────────

    describe('kick behaviour', () => {

        it('returns 404 when room does not exist', async () => {
            const token = mintSystemToken();
            const { status } = await kickParticipant(
                `nonexistent-room@${CONFERENCE}`, 'anyone', token
            );

            assert.strictEqual(status, 404);
        });

        it('returns 404 when participant is not in the room', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const token = mintSystemToken();
                const { status } = await kickParticipant(roomJid, 'no-such-nick', token);

                assert.strictEqual(status, 404);
            } finally {
                await disconnectAll(focus);
            }
        });

        it('returns 200 and removes the participant', async () => {
            const { roomJid, focus } = await createRoom();
            const user = await createXmppClient();

            await user.joinRoom(roomJid);
            const nick = user.nick;

            try {
                const token = mintSystemToken();
                const { status } = await kickParticipant(roomJid, nick, token);

                assert.strictEqual(status, 200);

                // Verify the user was actually removed — only focus remains.
                const state = await getRoomState(roomJid);

                assert.strictEqual(state.occupant_count, 1,
                    'kicked user should no longer be in the room');
            } finally {
                await disconnectAll(focus, user);
            }
        });

    });

});
