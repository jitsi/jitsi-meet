import assert from 'assert';
import http from 'http';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

let _roomCounter = 0;
const nextRoom = () => `jibri-test-${++_roomCounter}@conference.localhost`;

// ─── HTTP helpers ────────────────────────────────────────────────────────────

/**
 * Fetches pending Jibri IQ messages from the test observer.
 *
 * @returns {Promise<Array>}
 */
function getJibriIqs() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:5280/test-observer/jibri-iqs', res => {
            let body = '';

            res.on('data', c => {
                body += c;
            });
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
}

/**
 * Clears all Jibri IQ messages from the test observer.
 *
 * @returns {Promise<void>}
 */
function clearJibriIqs() {
    return new Promise((resolve, reject) => {
        const req = http.request(
            'http://localhost:5280/test-observer/jibri-iqs',
            { method: 'DELETE' },
            res => res.resume().on('end', resolve)
        );

        req.on('error', reject);
        req.end();
    });
}

/**
 * Sends a Jibri IQ and waits briefly for Prosody to route it (or block it),
 * then returns the list of Jibri IQs that reached the MUC component.
 */
async function sendAndCollect(client, roomJid, action, recordingMode) {
    await clearJibriIqs();
    await client.sendJibriIq(roomJid, action, recordingMode);

    // Give Prosody time to route (or block) the IQ before we poll.
    await new Promise(r => setTimeout(r, 300));

    return getJibriIqs();
}

// ─── Test setup ──────────────────────────────────────────────────────────────

describe('mod_filter_iq_jibri (feature-based authorization)', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    /**
     * Creates a test client connected to localhost with the given token,
     * joins a fresh room (focus joins first to unlock the jicofo lock), and
     * returns { client, room }. The client is a non-moderator participant.
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

    // ─── recording (recording_mode="file") ───────────────────────────────────

    describe('recording (recording_mode=file)', () => {

        for (const action of [ 'start', 'stop' ]) {

            it(`passes ${action} IQ when features.recording = true`, async () => {
                const token = mintAsapToken({ context: { features: { recording: true } } });
                const { client: c, room } = await setup(token);
                const iqs = await sendAndCollect(c, room, action, 'file');

                assert.strictEqual(iqs.length, 1, 'IQ should reach the MUC');
                assert.strictEqual(iqs[0].action, action);
                assert.strictEqual(iqs[0].recording_mode, 'file');
            });

            it(`blocks ${action} IQ when features.recording = false`, async () => {
                const token = mintAsapToken({ context: { features: { recording: false } } });
                const { client: c, room } = await setup(token);
                const iqs = await sendAndCollect(c, room, action, 'file');

                assert.strictEqual(iqs.length, 0);
            });

            it(`blocks ${action} IQ when context.features present but recording key absent`, async () => {
                // features object present but no 'recording' key → treated as false
                const token = mintAsapToken({ context: { features: { livestreaming: true } } });
                const { client: c, room } = await setup(token);
                const iqs = await sendAndCollect(c, room, action, 'file');

                assert.strictEqual(iqs.length, 0);
            });

            it(`blocks ${action} IQ when token has no context.features (non-moderator fallback)`, async () => {
                // No features in token → is_feature_allowed falls back to is_moderator.
                // Client joined after focus so it is a non-moderator participant → blocked.
                const token = mintAsapToken();
                const { client: c, room } = await setup(token);
                const iqs = await sendAndCollect(c, room, action, 'file');

                assert.strictEqual(iqs.length, 0);
            });
        }

        it('passes status IQ regardless of features (only start/stop are gated)', async () => {
            const token = mintAsapToken({ context: { features: { recording: false } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room, 'status', 'file');

            assert.strictEqual(iqs.length, 1);
        });
    });

    // ─── livestreaming (recording_mode="stream") ─────────────────────────────

    describe('livestreaming (recording_mode=stream)', () => {

        for (const action of [ 'start', 'stop' ]) {

            it(`passes ${action} IQ when features.livestreaming = true`, async () => {
                const token = mintAsapToken({ context: { features: { livestreaming: true } } });
                const { client: c, room } = await setup(token);
                const iqs = await sendAndCollect(c, room, action, 'stream');

                assert.strictEqual(iqs.length, 1);
                assert.strictEqual(iqs[0].action, action);
                assert.strictEqual(iqs[0].recording_mode, 'stream');
            });

            it(`blocks ${action} IQ when features.livestreaming = false`, async () => {
                const token = mintAsapToken({ context: { features: { livestreaming: false } } });
                const { client: c, room } = await setup(token);
                const iqs = await sendAndCollect(c, room, action, 'stream');

                assert.strictEqual(iqs.length, 0);
            });

            it(`blocks ${action} IQ when context.features present but livestreaming key absent`, async () => {
                const token = mintAsapToken({ context: { features: { recording: true } } });
                const { client: c, room } = await setup(token);
                const iqs = await sendAndCollect(c, room, action, 'stream');

                assert.strictEqual(iqs.length, 0);
            });

            it(`blocks ${action} IQ when token has no context.features (non-moderator fallback)`, async () => {
                const token = mintAsapToken();
                const { client: c, room } = await setup(token);
                const iqs = await sendAndCollect(c, room, action, 'stream');

                assert.strictEqual(iqs.length, 0);
            });
        }

        it('passes status IQ regardless of features (only start/stop are gated)', async () => {
            const token = mintAsapToken({ context: { features: { livestreaming: false } } });
            const { client: c, room } = await setup(token);
            const iqs = await sendAndCollect(c, room, 'status', 'stream');

            assert.strictEqual(iqs.length, 1);
        });
    });
});
