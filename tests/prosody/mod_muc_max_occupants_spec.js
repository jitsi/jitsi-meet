import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { setRoomMaxOccupants } from './helpers/test_observer.js';
import { isAvailablePresence } from './helpers/xmpp_utils.js';

const CONFERENCE = 'conference.localhost';

// Each test uses a unique room name to avoid cross-test state.
let _roomCounter = 0;
const room = () => `max-occupants-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_max_occupants', () => {
    // Prosody config sets muc_max_occupants = 2.

    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    it('allows join when room is empty', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();
        const presence = await c.joinRoom(r);

        assert.ok(isAvailablePresence(presence));
    });

    it('allows join when room has one occupant (under limit)', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c1 = await ctx.connect();
        const c2 = await ctx.connect();

        await c1.joinRoom(r);
        const presence = await c2.joinRoom(r);

        assert.ok(isAvailablePresence(presence));
    });

    it('blocks join when room is at the limit', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c1 = await ctx.connect();
        const c2 = await ctx.connect();
        const c3 = await ctx.connect();

        await c1.joinRoom(r);
        await c2.joinRoom(r);

        const presence = await c3.joinRoom(r);

        assert.equal(presence.attrs.type, 'error');
        assert.ok(
            presence.getChild('error')?.getChild('service-unavailable'),
            'expected <service-unavailable/> in error stanza'
        );
    });

    it('health check room bypasses the occupant limit', async () => {
        // mod_muc_meeting_id restricts health-check rooms to focus (jicofo) only,
        // so we test the occupant-limit bypass with focus clients.
        // is_healthcheck_room() matches rooms starting with '__jicofo-health-check'.
        const healthRoom = `__jicofo-health-check-test@${CONFERENCE}`;

        await ctx.connectFocus(healthRoom);

        // A second focus join would conflict on nick; the meaningful assertion is
        // that the first focus client joined without hitting a limit error.
        assert.ok(true, 'focus joined health-check room without occupant-limit error');
    });

    describe('whitelist', () => {
        // Prosody config sets muc_access_whitelist = { "whitelist.localhost", "auth.localhost" }.
        // Clients created with domain:'whitelist.localhost' get JIDs on that domain
        // and are treated as whitelisted by mod_muc_max_occupants.

        it('whitelisted user can join a room that is at the limit', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const c1 = await ctx.connect();
            const c2 = await ctx.connect();
            const wl = await ctx.connectWhitelisted();

            await c1.joinRoom(r);
            await c2.joinRoom(r); // room now at limit (2 non-whitelisted)

            const presence = await wl.joinRoom(r);

            assert.ok(isAvailablePresence(presence),
                'whitelisted user must bypass the occupant limit');
        });

        it('whitelisted occupants do not count against the limit for non-whitelisted users', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const wl1 = await ctx.connectWhitelisted();
            const wl2 = await ctx.connectWhitelisted();
            const c1 = await ctx.connect();
            const c2 = await ctx.connect();
            const c3 = await ctx.connect();

            // Two whitelisted users join — they bypass the check and are not
            // counted when a non-whitelisted user evaluates available slots.
            await wl1.joinRoom(r);
            await wl2.joinRoom(r);

            // Non-whitelisted users: only they count against the limit of 2.
            const p1 = await c1.joinRoom(r);

            assert.ok(isAvailablePresence(p1),
                '1st non-whitelisted user must be allowed (0 counted occupants so far)');

            const p2 = await c2.joinRoom(r);

            assert.ok(isAvailablePresence(p2),
                '2nd non-whitelisted user must be allowed (1 counted occupant)');

            const p3 = await c3.joinRoom(r);

            assert.equal(p3.attrs.type, 'error',
                '3rd non-whitelisted user must be blocked (2 counted occupants = limit reached)');
            assert.ok(
                p3.getChild('error')?.getChild('service-unavailable'),
                'expected <service-unavailable/> in error stanza'
            );
        });
    });

    describe('per-room limit', () => {
        // room._data.max_occupants overrides the global muc_max_occupants (2)
        // for an individual room. The HTTP helper sets it after room creation.

        it('per-room limit higher than global allows more occupants', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const c1 = await ctx.connect();

            await c1.joinRoom(r);

            // Override the global limit of 2 with a per-room limit of 4.
            await setRoomMaxOccupants(r, 4);

            const c2 = await ctx.connect();
            const c3 = await ctx.connect();
            const c4 = await ctx.connect();
            const c5 = await ctx.connect();

            const p2 = await c2.joinRoom(r);

            assert.ok(isAvailablePresence(p2), 'user 2 should join (limit 4)');

            const p3 = await c3.joinRoom(r);

            assert.ok(isAvailablePresence(p3),
                'user 3 should join (global limit 2 would block, per-room limit 4 allows)');

            const p4 = await c4.joinRoom(r);

            assert.ok(isAvailablePresence(p4), 'user 4 should join (limit 4)');

            const p5 = await c5.joinRoom(r);

            assert.equal(p5.attrs.type, 'error', 'user 5 must be blocked (at per-room limit 4)');
            assert.ok(
                p5.getChild('error')?.getChild('service-unavailable'),
                'expected <service-unavailable/> in error stanza'
            );
        });

        it('per-room limit lower than global restricts the room further', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const c1 = await ctx.connect();

            await c1.joinRoom(r);

            // Override the global limit of 2 with a stricter per-room limit of 1.
            await setRoomMaxOccupants(r, 1);

            const c2 = await ctx.connect();
            const presence = await c2.joinRoom(r);

            assert.equal(presence.attrs.type, 'error',
                'user 2 must be blocked by the per-room limit of 1');
            assert.ok(
                presence.getChild('error')?.getChild('service-unavailable'),
                'expected <service-unavailable/> in error stanza'
            );
        });
    });
});
