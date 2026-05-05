import assert from 'assert';

import { mintAsapToken, mintSystemToken } from './helpers/jwt.js';
import { endMeeting, getRoomState } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `end-meeting-${++_roomCounter}@${CONFERENCE}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a live room with a focus client and one regular user.
 * Returns { roomJid, clients } where clients must be disconnected in teardown.
 */
async function createRoom() {
    const roomJid = room();
    const focus = await joinWithFocus(roomJid);
    const user = await createXmppClient();

    await user.joinRoom(roomJid);

    return { roomJid,
        clients: [ focus, user ] };
}

/**
 * Disconnects all provided clients.
 *
 * @param {Array} clients - Clients to disconnect.
 * @returns {Promise<void>}
 */
async function disconnectAll(clients) {
    await Promise.all(clients.map(c => c.disconnect()));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mod_muc_end_meeting', () => {

    // ── Authentication ───────────────────────────────────────────────────────
    //
    // mod_muc_end_meeting uses prosody_password_public_key_repo_url as its key
    // server — a separate key pair from the one used for login tokens
    // (asap_key_server on VirtualHost "localhost").  A login token is therefore
    // rejected because the system key server does not carry the login public key,
    // and vice-versa.

    describe('authentication', () => {

        it('returns 401 when Authorization header is absent', async () => {
            const { roomJid, clients } = await createRoom();

            try {
                const { status } = await endMeeting(roomJid, null, { omitAuth: true });

                assert.strictEqual(status, 401);
            } finally {
                await disconnectAll(clients);
            }
        });

        it('returns 401 when a login token is used instead of a system token', async () => {
            // Login tokens are signed with the login key pair and verified via
            // asap_key_server.  The system key server does not carry the login
            // public key, so verification fails and Prosody returns 401.
            const { roomJid, clients } = await createRoom();

            try {
                const loginToken = mintAsapToken();
                const { status } = await endMeeting(roomJid, loginToken);

                assert.strictEqual(status, 401,
                    'login token must be rejected by the system key server');
            } finally {
                await disconnectAll(clients);
            }
        });

        it('returns 401 when token is expired', async () => {
            const { roomJid, clients } = await createRoom();

            try {
                const token = mintSystemToken({}, { expired: true });
                const { status } = await endMeeting(roomJid, token);

                assert.strictEqual(status, 401);
            } finally {
                await disconnectAll(clients);
            }
        });

    });

    // ── Parameter validation ─────────────────────────────────────────────────

    describe('parameter validation', () => {

        it('returns 400 when conference param is missing', async () => {
            // endMeeting always sets conference; call fetch directly to omit it.
            const token = mintSystemToken();
            const res = await fetch('http://localhost:5280/end-meeting', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });

            assert.strictEqual(res.status, 400);
        });

    });

    // ── Room termination ─────────────────────────────────────────────────────

    describe('room termination', () => {

        it('returns 404 when conference does not exist', async () => {
            const token = mintSystemToken();
            const { status } = await endMeeting(`nonexistent-room@${CONFERENCE}`, token);

            assert.strictEqual(status, 404);
        });

        it('returns 200 and destroys the room', async () => {
            const { roomJid, clients } = await createRoom();

            try {
                // Verify room exists before ending it.
                const before = await getRoomState(roomJid);

                assert.ok(before, 'room must exist before end-meeting call');

                const token = mintSystemToken();
                const { status } = await endMeeting(roomJid, token);

                assert.strictEqual(status, 200);

                // Room must be gone from Prosody's internal MUC state.
                const after = await getRoomState(roomJid);

                assert.strictEqual(after, null, 'room must be destroyed after end-meeting');
            } finally {
                // Clients were kicked by room destruction; disconnect() is a no-op
                // or handles the already-closed connection gracefully.
                await disconnectAll(clients);
            }
        });

        it('returns 200 with silent-reconnect=true and destroys the room', async () => {
            const { roomJid, clients } = await createRoom();

            try {
                const token = mintSystemToken();
                const { status } = await endMeeting(roomJid, token, { silentReconnect: true });

                assert.strictEqual(status, 200);

                const after = await getRoomState(roomJid);

                assert.strictEqual(after, null, 'room must be destroyed after silent-reconnect end-meeting');
            } finally {
                await disconnectAll(clients);
            }
        });

    });

});
