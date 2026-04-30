import assert from 'assert';

import { prosodyShell } from './helpers/prosody_shell.js';
import { setRoomMaxOccupants } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const BASE = 'http://localhost:5280';

let _roomCounter = 0;
const room = () => `muc-size-${++_roomCounter}@${CONFERENCE}`;

/**
 * Query GET /room-size with the given params.
 *
 * @param {object} params  e.g. { room: 'name', domain: 'localhost' }
 * @returns {Promise<Response>}
 */
function getRoomSize(params) {
    const qs = new URLSearchParams(params).toString();

    return fetch(`${BASE}/room-size?${qs}`);
}

/**
 * Query GET /room with the given params.
 *
 * @param {object} params  e.g. { room: 'name', domain: 'localhost' }
 * @returns {Promise<Response>}
 */
function getRoom(params) {
    const qs = new URLSearchParams(params).toString();

    return fetch(`${BASE}/room?${qs}`);
}

/**
 * Query GET /sessions.
 *
 * @returns {Promise<Response>}
 */
function getSessions() {
    return fetch(`${BASE}/sessions`);
}

describe('mod_muc_size', () => {

    before(async () => {
        // Confirm the module is loaded; surface Prosody errors early.
        const out = await prosodyShell('module:reload("muc_size", "localhost")');

        console.log('[prosody] module:reload muc_size:', out);
    });

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
    });

    /**
     * Creates a regular XMPP client and registers it for afterEach cleanup.
     *
     * @returns {Promise<XmppTestClient>}
     */
    async function connect() {
        const c = await createXmppClient();

        clients.push(c);

        return c;
    }

    /**
     * Joins the room as focus (jicofo) to unlock the mod_muc_meeting_id jicofo
     * lock. The focus client is whitelisted and does not count against the
     * occupant limit. Registers the client for afterEach cleanup.
     *
     * @param {string} roomJid  full room JID, e.g. 'room@conference.localhost'
     * @returns {Promise<XmppTestClient>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    // -------------------------------------------------------------------------
    // GET /room-size
    // -------------------------------------------------------------------------
    describe('GET /room-size', () => {

        it('returns 400 when query string is missing', async () => {
            const res = await fetch(`${BASE}/room-size`);

            assert.equal(res.status, 400);
        });

        it('returns 404 when room does not exist', async () => {
            const res = await getRoomSize({ room: 'nonexistent-room',
                domain: 'localhost' });

            assert.equal(res.status, 404);
        });

        it('returns 200 with participant count for an existing room', async () => {
            const r = room();

            await focusJoin(r);
            const c1 = await connect();
            const c2 = await connect();

            await c1.joinRoom(r);
            await c2.joinRoom(r);

            // Extract local part (before @).
            const roomName = r.split('@')[0];
            const res = await getRoomSize({ room: roomName,
                domain: 'localhost' });

            assert.equal(res.status, 200, 'expected 200 for existing room');

            const body = await res.json();

            assert.ok(typeof body.participants === 'number',
                'response must have numeric participants field');

            // Two regular clients joined (focus is whitelisted/not counted by
            // mod_muc_size which subtracts 1 for focus). Expect at least 1.
            assert.ok(body.participants >= 1,
                `expected participants >= 1, got ${body.participants}`);
        });

        it('participant count decreases after a client leaves', async () => {
            const r = room();

            await focusJoin(r);
            const c1 = await connect();

            await c1.joinRoom(r);

            // The global muc_max_occupants = 2 would block a 3rd join, so raise
            // the per-room limit before the other clients connect.
            await setRoomMaxOccupants(r, 5);

            const c2 = await connect();
            const c3 = await connect();

            await c2.joinRoom(r);
            await c3.joinRoom(r);

            const roomName = r.split('@')[0];

            // 3 regular clients in room (focus not counted by mod_muc_size)
            const res1 = await getRoomSize({ room: roomName,
                domain: 'localhost' });

            assert.equal(res1.status, 200);
            const { participants: count1 } = await res1.json();

            // Disconnect one client and re-query.
            await c3.disconnect();
            clients.pop();

            // Give Prosody a moment to process the departure.
            await new Promise(resolve => setTimeout(resolve, 200));

            const res2 = await getRoomSize({ room: roomName,
                domain: 'localhost' });

            assert.equal(res2.status, 200);
            const { participants: count2 } = await res2.json();

            assert.ok(count2 < count1,
                `count should drop after disconnect (before=${count1}, after=${count2})`);
        });
    });

    // -------------------------------------------------------------------------
    // GET /room
    // -------------------------------------------------------------------------
    describe('GET /room', () => {

        it('returns 400 when query string is missing', async () => {
            const res = await fetch(`${BASE}/room`);

            assert.equal(res.status, 400);
        });

        it('returns 404 when room does not exist', async () => {
            const res = await getRoom({ room: 'nonexistent-room',
                domain: 'localhost' });

            assert.equal(res.status, 404);
        });

        it('returns 200 with occupant array for an existing room', async () => {
            const r = room();

            await focusJoin(r);
            const c1 = await connect();

            await c1.joinRoom(r);

            const roomName = r.split('@')[0];
            const res = await getRoom({ room: roomName,
                domain: 'localhost' });

            assert.equal(res.status, 200, 'expected 200 for existing room');

            const body = await res.json();

            assert.ok(Array.isArray(body), 'response body should be a JSON array');
        });

        it('occupant objects have jid, email, display_name fields', async () => {
            const r = room();

            await focusJoin(r);
            const c1 = await connect();

            await c1.joinRoom(r);

            const roomName = r.split('@')[0];
            const res = await getRoom({ room: roomName,
                domain: 'localhost' });

            assert.equal(res.status, 200);

            const occupants = await res.json();

            for (const occ of occupants) {
                assert.ok('jid' in occ, 'occupant must have jid');
                assert.ok('email' in occ, 'occupant must have email');
                assert.ok('display_name' in occ, 'occupant must have display_name');
            }
        });
    });

    // -------------------------------------------------------------------------
    // GET /sessions
    // -------------------------------------------------------------------------
    describe('GET /sessions', () => {

        it('returns a parseable integer', async () => {
            const res = await getSessions();

            assert.equal(res.status, 200);
            const text = await res.text();
            const n = parseInt(text, 10);

            assert.ok(!isNaN(n), `expected integer, got: ${text}`);
        });

        it('session count increases when a client connects', async () => {
            const res1 = await getSessions();
            const before = parseInt(await res1.text(), 10);

            await connect(); // adds one session

            const res2 = await getSessions();
            const after = parseInt(await res2.text(), 10);

            assert.ok(after > before,
                `session count should increase (before=${before}, after=${after})`);
        });
    });
});
