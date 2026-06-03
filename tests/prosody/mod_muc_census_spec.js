import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { setRoomMaxOccupants } from './helpers/test_observer.js';

const CONFERENCE = 'conference.localhost';
const BASE = 'http://localhost:5280';

let _roomCounter = 0;
const room = () => `census-${++_roomCounter}@${CONFERENCE}`;

/**
 * Fetch GET /room-census and return the parsed body.
 *
 * @returns {Promise<{room_census: Array}>}
 */
async function getRoomCensus() {
    const res = await fetch(`${BASE}/room-census`);
    const text = await res.text();

    assert.equal(res.status, 200, `GET /room-census must return 200, got ${res.status}: ${text}`);

    let body;

    try {
        body = JSON.parse(text);
    } catch (e) {
        assert.fail(`GET /room-census returned non-JSON: ${text}`);
    }

    return body;
}

describe('mod_muc_census', () => {

    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    it('returns 200 with a room_census array', async () => {
        const body = await getRoomCensus();

        assert.ok(Array.isArray(body.room_census),
            `response must have a room_census array, got: ${JSON.stringify(body)}`);
    });

    it('only active rooms appear in census after a room is destroyed', async () => {
        const r1 = room();
        const r2 = room();
        const r1Name = r1.split('@')[0];
        const r2Name = r2.split('@')[0];

        // Bring up both rooms.
        const focus1 = await ctx.connectFocus(r1);

        await ctx.connectFocus(r2);
        const c1 = await ctx.connect();
        const c2 = await ctx.connect();

        await c1.joinRoom(r1);
        await c2.joinRoom(r2);

        const { room_census: before } = await getRoomCensus();

        assert.ok(before.find(e => e.room_name && e.room_name.startsWith(r1Name)),
            'room1 must appear in census while active');
        assert.ok(before.find(e => e.room_name && e.room_name.startsWith(r2Name)),
            'room2 must appear in census while active');

        // Destroy room1 by disconnecting all its occupants.
        await c1.disconnect();
        await focus1.disconnect();
        await new Promise(resolve => setTimeout(resolve, 200));

        const { room_census: after } = await getRoomCensus();

        assert.ok(!after.find(e => e.room_name && e.room_name.startsWith(r1Name)),
            'room1 must not appear in census after all occupants leave');
        assert.ok(after.find(e => e.room_name && e.room_name.startsWith(r2Name)),
            'room2 must still appear in census');
    });

    it('tracks room occupancy and updates when clients leave', async () => {
        const r = room();
        const roomName = r.split('@')[0];

        await ctx.connectFocus(r);
        await setRoomMaxOccupants(r, 5);

        const c1 = await ctx.connect();
        const c2 = await ctx.connect();

        await c1.joinRoom(r);
        await c2.joinRoom(r);

        // Room must appear with correct participant count and fields.
        const { room_census: census1 } = await getRoomCensus();
        const entry1 = census1.find(e => e.room_name && e.room_name.startsWith(roomName));

        assert.ok(entry1, `room ${roomName} must appear in census after join`);
        assert.ok(typeof entry1.created_time !== 'undefined', 'entry must have created_time');
        assert.equal(entry1.participants, 2, 'participants must equal number of non-focus clients');

        // After one client leaves the count must drop.
        await c2.disconnect();
        await new Promise(resolve => setTimeout(resolve, 200));

        const { room_census: census2 } = await getRoomCensus();
        const entry2 = census2.find(e => e.room_name && e.room_name.startsWith(roomName));

        assert.ok(entry2, 'room must still appear after one client leaves');
        assert.equal(entry2.participants, 1,
            `participant count must be 1 after disconnect (got ${entry2.participants})`);
    });
});
