import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { getRoomState, setBreakoutRoomsActive } from './helpers/test_observer.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `cleanup-svc-${++_roomCounter}@${CONFERENCE}`;

/** Resolves after ms milliseconds. */
const sleep = ms => new Promise(r => setTimeout(r, ms));

// services_empty_meeting_timeout is set to 1 s in prosody.cfg.lua.
// We wait TIMER_MS + BUFFER_MS to be sure the timer has either fired or not.
const TIMER_MS = 1000;
const BUFFER_MS = 1000;

describe('mod_muc_cleanup_backend_services', () => {
    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    it('destroys room when last regular user leaves and only jibri remains', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await ctx.connectJibri(r);
        const user = await ctx.connect();

        await user.joinRoom(r);
        await user.disconnect();

        await sleep(TIMER_MS + BUFFER_MS);

        const state = await getRoomState(r);

        assert.equal(state, null, 'room should be destroyed after timeout');
    });

    it('destroys room when last regular user leaves and only transcriber remains', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await ctx.connectTranscriber(r);
        const user = await ctx.connect();

        await user.joinRoom(r);
        await user.disconnect();

        await sleep(TIMER_MS + BUFFER_MS);

        const state = await getRoomState(r);

        assert.equal(state, null, 'room should be destroyed after timeout');
    });

    it('does not destroy room when a second regular user is still present', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await ctx.connectJibri(r);
        const user1 = await ctx.connect();
        const user2 = await ctx.connect();

        await user1.joinRoom(r);
        await user2.joinRoom(r);
        await user1.disconnect();

        await sleep(TIMER_MS + BUFFER_MS);

        const state = await getRoomState(r);

        assert.ok(state, 'room should still exist — user2 is still a regular participant');
    });

    it('cancels the destroy timer when a regular user joins after timer starts', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await ctx.connectJibri(r);
        const user = await ctx.connect();

        await user.joinRoom(r);

        // user leaves — timer starts counting down
        await user.disconnect();

        // a new regular user joins immediately, which must cancel the timer
        const user2 = await ctx.connect();

        await user2.joinRoom(r);

        await sleep(TIMER_MS + BUFFER_MS);

        const state = await getRoomState(r);

        assert.ok(state, 'room should survive — destroy timer was cancelled by user2 joining');
    });

    it('does not start timer when jibri leaves and a regular user is still present', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const jibri = await ctx.connectJibri(r);
        const user = await ctx.connect();

        await user.joinRoom(r);

        // jibri leaves — muc-occupant-left hook returns early (leaver is jibri)
        await jibri.disconnect();

        await sleep(TIMER_MS + BUFFER_MS);

        const state = await getRoomState(r);

        assert.ok(state, 'room should survive — timer is not started when jibri is the leaver');
    });

    it('does not start timer when focus (admin) leaves', async () => {
        const r = room();

        const focus = await ctx.connectFocus(r);

        await ctx.connectJibri(r);
        const user = await ctx.connect();

        await user.joinRoom(r);

        // admin leaves — muc-occupant-left hook returns early (leaver is admin)
        await focus.disconnect();

        await sleep(TIMER_MS + BUFFER_MS);

        const state = await getRoomState(r);

        assert.ok(state, 'room should survive — timer is not started when an admin leaves');
    });

    it('does not start timer when breakout rooms are active', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await ctx.connectJibri(r);
        const user = await ctx.connect();

        await user.joinRoom(r);

        // Simulate active breakout rooms — hook returns early when this flag is set.
        await setBreakoutRoomsActive(r, true);

        // user leaves — would normally start the timer, but breakout_rooms_active prevents it
        await user.disconnect();

        await sleep(TIMER_MS + BUFFER_MS);

        const state = await getRoomState(r);

        assert.ok(state, 'room should survive — breakout_rooms_active prevents the destroy timer');
    });
});
