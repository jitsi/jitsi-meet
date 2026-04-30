import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { isAvailablePresence } from './helpers/xmpp_utils.js';

// Uses the isolated "internal" MUC component which has muc_filter_access loaded
// with muc_filter_whitelist = { "whitelist.localhost" }.
// No muc_meeting_id or muc_max_occupants are loaded here, so no focus join is
// needed and there is no occupant limit.
const INTERNAL = 'conference-internal.localhost';

let _roomCounter = 0;
const room = () => `filter-access-${++_roomCounter}@${INTERNAL}`;

describe('mod_muc_filter_access', () => {

    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    it('allows a client from a whitelisted domain to join', async () => {
        const r = room();
        const wl = await ctx.connectWhitelisted();
        const presence = await wl.joinRoom(r);

        assert.ok(isAvailablePresence(presence),
            'whitelisted client must be allowed to join');
    });

    it('blocks a client from a non-whitelisted domain', async () => {
        const r = room();

        // First create the room with a whitelisted client so there is a room to join.
        const wl = await ctx.connectWhitelisted();

        await wl.joinRoom(r);

        // A regular client (domain: localhost) is not in the whitelist.
        // Its presence is silently dropped — joinRoom will time out.
        const c = await ctx.connect();

        await assert.rejects(
            () => c.joinRoom(r, undefined, { timeout: 1000 }),
            /Timeout/,
            'non-whitelisted client join must time out (presence dropped)'
        );
    });

    it('blocks a non-whitelisted client even when it creates the room', async () => {
        const r = room();
        const c = await ctx.connect();

        // The client sends the first presence to a non-existing room.
        // muc_filter_access drops it before MUC can process it, so the room
        // is never created and no presence is returned.
        await assert.rejects(
            () => c.joinRoom(r, undefined, { timeout: 1000 }),
            /Timeout/,
            'non-whitelisted client must not be able to create a room'
        );
    });
});
