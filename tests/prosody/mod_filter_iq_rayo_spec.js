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
 * @param {string} [dialTo]       dial `to` attribute (default: 'sip:test@example.com')
 * @param {string|null} [roomNameHeader]  JvbRoomName header value (default: roomJid)
 */
async function sendAndCollect(client, roomJid, dialTo, roomNameHeader) {
    await clearDialIqs();
    await client.sendRayoIq(roomJid, dialTo, roomNameHeader);

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
     * Creates a test client with the given token, joins a fresh room (focus
     * joins first so the jicofo lock is lifted and focus gets owner affiliation),
     * and returns { client, room }.
     */
    async function setup(token) {
        const room = nextRoom();
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
            const token = mintAsapToken({ context: { features: { 'outbound-call': true } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 1, 'IQ should reach the MUC');
            assert.strictEqual(iqs[0].dial_to, 'sip:test@example.com');
        });

        it('blocks IQ when features.outbound-call = false', async () => {
            const token = mintAsapToken({ context: { features: { 'outbound-call': false } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when context.features present but outbound-call key absent', async () => {
            const token = mintAsapToken({ context: { features: { recording: true } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when token has no context.features (non-owner fallback)', async () => {
            // No features → fallback to is_moderator = affiliation == 'owner'.
            // Regular client joined after focus so has 'member' affiliation → blocked.
            const token = mintAsapToken();
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room);

            assert.strictEqual(iqs.length, 0);
        });
    });

    // ─── transcription (dial to 'jitsi_meet_transcribe') ────────────────────

    describe('transcription (dial to jitsi_meet_transcribe)', () => {

        it('passes IQ when features.transcription = true', async () => {
            const token = mintAsapToken({ context: { features: { transcription: true } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room, 'jitsi_meet_transcribe');

            assert.strictEqual(iqs.length, 1, 'IQ should reach the MUC');
            assert.strictEqual(iqs[0].dial_to, 'jitsi_meet_transcribe');
        });

        it('blocks IQ when features.transcription = false', async () => {
            const token = mintAsapToken({ context: { features: { transcription: false } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room, 'jitsi_meet_transcribe');

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when context.features present but transcription key absent', async () => {
            const token = mintAsapToken({ context: { features: { 'outbound-call': true } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room, 'jitsi_meet_transcribe');

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when token has no context.features (non-owner fallback)', async () => {
            const token = mintAsapToken();
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room, 'jitsi_meet_transcribe');

            assert.strictEqual(iqs.length, 0);
        });
    });

    // ─── JvbRoomName header validation ──────────────────────────────────────

    describe('JvbRoomName header validation', () => {

        it('blocks IQ when JvbRoomName header is missing', async () => {
            const token = mintAsapToken({ context: { features: { 'outbound-call': true } } });
            const { client: c, room } = await setup(token);

            // null → header omitted entirely
            const iqs = await sendAndCollect(c, room, 'sip:test@example.com', null);

            assert.strictEqual(iqs.length, 0);
        });

        it('blocks IQ when JvbRoomName header does not match room JID', async () => {
            const token = mintAsapToken({ context: { features: { 'outbound-call': true } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room, 'sip:test@example.com', 'wrong-room@conference.localhost');

            assert.strictEqual(iqs.length, 0);
        });
    });
});
