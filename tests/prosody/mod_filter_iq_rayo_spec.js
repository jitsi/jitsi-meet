import assert from 'assert';
import http from 'http';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

let _roomCounter = 0;
const nextRoom = () => `rayo-test-${++_roomCounter}@conference.localhost`;

// ─── HTTP helpers ────────────────────────────────────────────────────────────

/**
 * Fetches pending dial IQ messages from the test observer.
 *
 * @returns {Promise<Array>}
 */
function getDialIqs() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:5280/test-observer/dial-iqs', res => {
            let body = '';

            res.on('data', c => {
                body += c;
            });
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
}

/**
 * Clears all dial IQ messages from the test observer.
 *
 * @returns {Promise<void>}
 */
function clearDialIqs() {
    return new Promise((resolve, reject) => {
        const req = http.request(
            'http://localhost:5280/test-observer/dial-iqs',
            { method: 'DELETE' },
            res => res.resume().on('end', resolve)
        );

        req.on('error', reject);
        req.end();
    });
}

/**
 * Sends a Rayo dial IQ and waits briefly for Prosody to route or block it,
 * then returns the list of dial IQs that reached the MUC component.
 *
 * @param {object} client         XmppTestClient with sendRayoIq
 * @param {string} roomJid        full room JID
 * @param {object} [opts]         options forwarded to sendRayoIq
 */
async function sendAndCollect(client, roomJid, opts) {
    await clearDialIqs();
    await client.sendRayoIq(roomJid, opts);

    // Give Prosody time to route (or block) the IQ before we poll.
    await new Promise(r => setTimeout(r, 300));

    return getDialIqs();
}

// ─── Test setup ──────────────────────────────────────────────────────────────

describe('mod_filter_iq_rayo (feature-based authorization)', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    /**
     * Creates a test client with a token scoped to a fresh room, joins that room
     * (focus joins first so the jicofo lock is lifted), and returns { client, room }.
     *
     * @param {object} [overrides] JWT payload overrides merged into the token.
     * @returns {Promise<{client: object, room: string}>}
     */
    async function setup(overrides = {}) {
        const room = nextRoom();
        const roomName = room.split('@')[0];
        const token = mintAsapToken({ room: roomName,
            ...overrides });
        const focus = await joinWithFocus(room);

        clients.push(focus);

        const c = await createXmppClient({ params: { token } });

        clients.push(c);
        await c.joinRoom(room);

        return { client: c,
            room };
    }

    // ─── outbound-call (dial to a SIP/telephony address) ────────────────────

    describe('outbound-call (dial to non-transcribe address)', () => {

        it('passes IQ when features.outbound-call = true', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': true } } });
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 1, 'IQ should reach the MUC');
            assert.strictEqual(iqs[0].dial_to, 'sip:test@example.com');
        });

        it('blocks IQ when features.outbound-call = false', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': false } } });
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when context.features present but outbound-call key absent', async () => {
            const { client: c, room } = await setup({ context: { features: { recording: true } } });
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when token has no context.features (non-owner fallback)', async () => {
            // No features → fallback to is_moderator = affiliation == 'owner'.
            // Regular client joined after focus so has 'member' affiliation → blocked.
            const { client: c, room } = await setup();
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 0);
        });
    });

    // ─── transcription (dial to 'jitsi_meet_transcribe') ────────────────────

    describe('transcription (dial to jitsi_meet_transcribe)', () => {

        it('passes IQ when features.transcription = true', async () => {
            const { client: c, room } = await setup({ context: { features: { transcription: true } } });
            const iqs = await sendAndCollect(c, room, { dialTo: 'jitsi_meet_transcribe' });

            assert.strictEqual(iqs.length, 1, 'IQ should reach the MUC');
            assert.strictEqual(iqs[0].dial_to, 'jitsi_meet_transcribe');
        });

        it('blocks IQ when features.transcription = false', async () => {
            const { client: c, room } = await setup({ context: { features: { transcription: false } } });
            const iqs = await sendAndCollect(c, room, { dialTo: 'jitsi_meet_transcribe' });

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when context.features present but transcription key absent', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': true } } });
            const iqs = await sendAndCollect(c, room, { dialTo: 'jitsi_meet_transcribe' });

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when token has no context.features (non-owner fallback)', async () => {
            const { client: c, room } = await setup();
            const iqs = await sendAndCollect(c, room, { dialTo: 'jitsi_meet_transcribe' });

            assert.strictEqual(iqs.length, 0);
        });
    });

    // ─── JvbRoomName header validation ──────────────────────────────────────

    describe('JvbRoomName header validation', () => {

        it('blocks IQ when JvbRoomName header is missing', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': true } } });

            // null → header omitted entirely
            const iqs = await sendAndCollect(c, room, { roomNameHeader: null });

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when JvbRoomName header does not match room JID', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': true } } });
            const iqs = await sendAndCollect(c, room, { roomNameHeader: 'wrong-room@conference.localhost' });

            assert.strictEqual(iqs.length, 0);
        });
    });

    // ─── Header stripping ───────────────────────────────────────────────────

    describe('header stripping', () => {

        it('strips arbitrary client-supplied headers', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': true } } });
            const iqs = await sendAndCollect(c, room, { extraHeaders: { SomeHeader: 'spoofed-value' } });

            assert.strictEqual(iqs.length, 1, 'IQ should reach the MUC');
            assert.strictEqual(iqs[0].headers?.SomeHeader, undefined, 'custom header must be stripped');
        });
    });

    // ─── JvbRoomPassword header ──────────────────────────────────────────────

    describe('JvbRoomPassword header', () => {

        it('passes JvbRoomPassword through when provided', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': true } } });
            const iqs = await sendAndCollect(c, room, { roomPassHeader: 'secret123' });

            assert.strictEqual(iqs.length, 1);
            assert.strictEqual(iqs[0].room_pass_header, 'secret123');
        });

        it('omits JvbRoomPassword in forwarded IQ when not provided by client', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': true } } });
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 1);
            assert.strictEqual(iqs[0].room_pass_header, undefined);
        });

    });
});
