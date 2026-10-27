import { xml } from '@xmpp/client';
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

    // ─── Per-room transcription throttle ────────────────────────────────────

    describe('transcription per-room throttle', () => {
        const transcribeOpts = { dialTo: 'jitsi_meet_transcribe' };

        it('allows the first transcription dial in a room', async () => {
            const { client: c, room } = await setup({ context: { features: { transcription: true } } });
            const iqs = await sendAndCollect(c, room, transcribeOpts);

            assert.strictEqual(iqs.length, 1, 'first dial should reach the MUC');
            assert.strictEqual(iqs[0].dial_to, 'jitsi_meet_transcribe');
        });

        it('drops a second transcription dial to the same room within 10 s', async () => {
            const { client: c, room } = await setup({ context: { features: { transcription: true } } });

            const first = await sendAndCollect(c, room, transcribeOpts);

            assert.strictEqual(first.length, 1, 'first dial should reach the MUC');

            // Second dial: throttle budget exhausted, should be blocked
            const second = await sendAndCollect(c, room, transcribeOpts);

            assert.strictEqual(second.length, 0, 'second dial within 10 s should be throttled');
        });

        it('allows only one transcription dial when multiple are sent concurrently', async () => {
            const { client: c, room } = await setup({ context: { features: { transcription: true } } });

            await clearDialIqs();

            // Fire three dials before Prosody has processed any of them
            await Promise.all([
                c.sendRayoIq(room, transcribeOpts),
                c.sendRayoIq(room, transcribeOpts),
                c.sendRayoIq(room, transcribeOpts)
            ]);

            await new Promise(r => setTimeout(r, 500));

            const iqs = await getDialIqs();

            assert.strictEqual(iqs.length, 1, 'exactly one concurrent transcription dial should pass');
        });

        it('does not apply the throttle across different rooms', async () => {
            const { client: c1, room: room1 } = await setup({ context: { features: { transcription: true } } });
            const { client: c2, room: room2 } = await setup({ context: { features: { transcription: true } } });

            // First dial to room1 consumes room1's throttle budget
            const iqs1 = await sendAndCollect(c1, room1, transcribeOpts);

            assert.strictEqual(iqs1.length, 1, 'first dial to room1 should pass');

            // First dial to room2 has its own independent throttle bucket
            const iqs2 = await sendAndCollect(c2, room2, transcribeOpts);

            assert.strictEqual(iqs2.length, 1, 'first dial to room2 should pass independently');
        });

        it('does not throttle outbound-call dials', async () => {
            const { client: c, room } = await setup({ context: { features: { 'outbound-call': true } } });

            const first = await sendAndCollect(c, room);

            assert.strictEqual(first.length, 1, 'first outbound-call should pass');

            // A second outbound-call to the same room must not be caught by the
            // transcription throttle (which only applies to jitsi_meet_transcribe dials)
            const second = await sendAndCollect(c, room);

            assert.strictEqual(second.length, 1, 'second outbound-call should also pass');
        });
    });

    // ─── max_number_outgoing_calls (set to 2 in the test config) ────────────
    //
    // The option bounds every Rayo dial a session or user sends: at most N
    // dials per minute per session, and at most N concurrent Jigasi sessions
    // (SIP or transcriber) per user, counted through the initiator headers that
    // Jigasi echoes back in its MUC presence.

    describe('max_number_outgoing_calls', () => {
        const LIMIT = 2;
        const transcribeOpts = { dialTo: 'jitsi_meet_transcribe' };

        /**
         * Creates a client whose token allows any room, and joins it to `count`
         * fresh rooms (focus joins each room first).
         *
         * @param {number} count
         * @param {object} [context]  JWT context claim.
         * @returns {Promise<{client: object, rooms: string[]}>}
         */
        async function setupRooms(count, context) {
            const token = mintAsapToken({ room: '*',
                context });
            const c = await createXmppClient({ params: { token } });

            clients.push(c);

            const rooms = [];

            for (let i = 0; i < count; i++) {
                const room = nextRoom();
                const focus = await joinWithFocus(room);

                clients.push(focus);
                await c.joinRoom(room);
                rooms.push(room);
            }

            return { client: c,
                rooms };
        }

        /**
         * Joins a room as a transcriber (recorder.localhost account) whose
         * presence carries the Jigasi initiator extension with the
         * X-outbound-call-initiator-user header, as a real Jigasi transcriber
         * started by `userId` does.
         *
         * @param {string} roomJid
         * @param {string} userId
         */
        async function joinAsTranscriberStartedBy(roomJid, userId) {
            const c = await createXmppClient({
                domain: 'recorder.localhost',
                username: 'transcriber',
                password: 'transcribersecret'
            });

            clients.push(c);

            const initiator = xml('initiator', { xmlns: 'http://jitsi.org/protocol/jigasi' },
                xml('header', { xmlns: 'urn:xmpp:rayo:1',
                    name: 'X-outbound-call-initiator-user',
                    value: userId })
            );

            await c.joinRoom(roomJid, 'transcriber', { extensions: [ initiator ] });

            return c;
        }

        /**
         * Sends a dial that is expected to be blocked and returns the error
         * condition name from the reply.
         */
        async function dialErrorCondition(client, roomJid, opts) {
            const reply = await client.sendRayoIqAndWait(roomJid, opts);
            const error = reply.getChild('error');

            return error ? error.children[0].name : null;
        }

        it('blocks the third outbound-call dial from one session within a minute', async () => {
            const { client: c, rooms: [ room ] } = await setupRooms(1, { features: { 'outbound-call': true } });

            for (let i = 0; i < LIMIT; i++) {
                const iqs = await sendAndCollect(c, room);

                assert.strictEqual(iqs.length, 1, `dial ${i + 1} should pass`);
            }

            assert.strictEqual(await dialErrorCondition(c, room), 'resource-constraint');
        });

        it('blocks the third transcription dial from one session within a minute', async () => {
            // One dial per room, so the per-room transcription throttle does not interfere.
            const { client: c, rooms } = await setupRooms(LIMIT + 1, { features: { transcription: true } });

            for (let i = 0; i < LIMIT; i++) {
                const iqs = await sendAndCollect(c, rooms[i], transcribeOpts);

                assert.strictEqual(iqs.length, 1, `transcription dial ${i + 1} should pass`);
            }

            assert.strictEqual(await dialErrorCondition(c, rooms[LIMIT], transcribeOpts), 'resource-constraint');
        });

        it('blocks a transcription dial when the user already has the maximum number of Jigasi sessions', async () => {
            const userId = 'limit-user-1';
            const { client: c, rooms } = await setupRooms(LIMIT + 1, {
                user: { id: userId },
                features: { transcription: true }
            });

            // Simulate LIMIT transcribers already running for this user in other rooms.
            for (let i = 0; i < LIMIT; i++) {
                await joinAsTranscriberStartedBy(rooms[i], userId);
            }

            assert.strictEqual(await dialErrorCondition(c, rooms[LIMIT], transcribeOpts), 'resource-constraint');
        });

        it('blocks an outbound-call dial when the user already has the maximum number of Jigasi sessions', async () => {
            const userId = 'limit-user-2';
            const { client: c, rooms } = await setupRooms(LIMIT + 1, {
                user: { id: userId },
                features: { 'outbound-call': true }
            });

            for (let i = 0; i < LIMIT; i++) {
                await joinAsTranscriberStartedBy(rooms[i], userId);
            }

            assert.strictEqual(await dialErrorCondition(c, rooms[LIMIT]), 'resource-constraint');
        });

        it('does not count Jigasi sessions started by another user', async () => {
            const { client: c, rooms } = await setupRooms(LIMIT + 1, {
                user: { id: 'limit-user-3' },
                features: { transcription: true }
            });

            for (let i = 0; i < LIMIT; i++) {
                await joinAsTranscriberStartedBy(rooms[i], 'someone-else');
            }

            const iqs = await sendAndCollect(c, rooms[LIMIT], transcribeOpts);

            assert.strictEqual(iqs.length, 1, 'dial should pass, the other sessions belong to another user');
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
