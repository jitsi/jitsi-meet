import assert from 'assert';

import { mintAsapToken, mintSystemToken } from './helpers/jwt.js';
import { inviteJigasi } from './helpers/test_observer.js';
import { joinWithFocus, joinWithJigasi } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `jigasi-invite-${++_roomCounter}@${CONFERENCE}`;

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

describe('mod_muc_jigasi_invite', () => {

    // ── Authentication ───────────────────────────────────────────────────────
    //
    // mod_muc_jigasi_invite uses prosody_password_public_key_repo_url as its
    // key server — a separate key pair from login tokens (asap_key_server).
    // Auth failures return 401.

    describe('authentication', () => {

        it('returns 401 when Authorization header is absent', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const { status } = await inviteJigasi(roomJid, '+15551234567', null, { omitAuth: true });

                assert.strictEqual(status, 401);
            } finally {
                await disconnectAll(focus);
            }
        });

        it('returns 401 when a login token is used instead of a system token', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const loginToken = mintAsapToken();
                const { status } = await inviteJigasi(roomJid, '+15551234567', loginToken);

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
                const { status } = await inviteJigasi(roomJid, '+15551234567', token);

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
                'http://localhost:5280/invite-jigasi',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain',
                        Authorization: `Bearer ${token}`
                    },
                    body: '{"conference":"r@conference.localhost","phoneNo":"+1555"}'
                }
            );

            assert.strictEqual(res.status, 400);
        });

        it('returns 400 when body is empty', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/invite-jigasi',
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

        it('returns 400 when conference is missing', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/invite-jigasi',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ phoneNo: '+15551234567' })
                }
            );

            assert.strictEqual(res.status, 400);
        });

        it('returns 400 when phoneNo is missing', async () => {
            const token = mintSystemToken();
            const res = await fetch(
                'http://localhost:5280/invite-jigasi',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ conference: `r@${CONFERENCE}` })
                }
            );

            assert.strictEqual(res.status, 400);
        });

    });

    // ── Brewery room ─────────────────────────────────────────────────────────

    describe('brewery room', () => {

        it('returns 404 when the Jigasi brewery room does not exist', async () => {
            const { roomJid, focus } = await createRoom();

            try {
                const token = mintSystemToken();

                // The brewery room (jigasibrewery@internal.auth.localhost) is
                // never created in the test environment, so the module returns 404.
                const { status } = await inviteJigasi(roomJid, '+15551234567', token);

                assert.strictEqual(status, 404);
            } finally {
                await disconnectAll(focus);
            }
        });

    });

    // ── Jigasi invite ────────────────────────────────────────────────────────
    //
    // These tests require a simulated Jigasi instance in the brewery room.
    // joinWithJigasi() creates an anonymous client, joins the brewery with a
    // colibri stats presence (supports_sip=true, stress_level) so the module
    // can select it for dial-out.

    describe('jigasi invite', () => {

        const BREWERY = 'jigasibrewery@internal.auth.localhost';

        it('sends a Rayo dial IQ to the Jigasi and returns 200', async () => {
            const { roomJid, focus } = await createRoom();
            const jigasi = await joinWithJigasi(BREWERY);

            try {
                const token = mintSystemToken();
                const phoneNo = '+15551234567';
                const { status } = await inviteJigasi(roomJid, phoneNo, token);

                assert.strictEqual(status, 200);

                // The module sends a Rayo <dial> IQ to the selected Jigasi.
                const iq = await jigasi.waitForIq(
                    s => s.getChild('dial', 'urn:xmpp:rayo:1'));
                const dial = iq.getChild('dial', 'urn:xmpp:rayo:1');

                assert.ok(dial, 'IQ must contain a Rayo dial element');
                assert.strictEqual(iq.attrs.type, 'set');
                assert.strictEqual(dial.attrs.to, phoneNo,
                    'dial target must be the requested phone number');

                // The JvbRoomName header carries the conference JID so Jigasi
                // knows which room to join after the call is established.
                const header = dial.getChild('header', 'urn:xmpp:rayo:1');

                assert.ok(header, 'dial must include a JvbRoomName header');
                assert.strictEqual(header.attrs.name, 'JvbRoomName');
                assert.strictEqual(header.attrs.value, roomJid,
                    'JvbRoomName must equal the conference room JID');
            } finally {
                await disconnectAll(focus, jigasi);
            }
        });

    });

});
