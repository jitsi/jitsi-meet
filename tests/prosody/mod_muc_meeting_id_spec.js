import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { isAvailablePresence } from './helpers/xmpp_utils.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `meeting-id-${++_roomCounter}@${CONFERENCE}`;
const healthRoom = () => `__jicofo-health-check-mid-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_meeting_id', () => {

    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    // -------------------------------------------------------------------------
    // jicofo lock
    // -------------------------------------------------------------------------
    describe('jicofo lock', () => {

        it('focus can join a room', async () => {
            // connectFocus throws (timeout) if the join is blocked.
            await ctx.connectFocus(room());
        });

        it('regular user can join after focus has joined', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const c = await ctx.connect();
            const presence = await c.joinRoom(r);

            assert.ok(isAvailablePresence(presence),
                'regular user should be allowed in after focus unlocks');
        });

        // NOTE: the queue-drain scenario (regular joins before jicofo, gets
        // queued, then jicofo joins and the queue is flushed) is not tested
        // here. When a non-focus user is the first to send a presence to a
        // room, Prosody creates the room in "locked" state (XEP-0045 §10.1.3)
        // and expects the creator to submit a config form. Because our hook
        // stops the join (returning true), the creator never receives the
        // status-201 self-presence and never submits the form, so the room
        // stays locked. Subsequent joins by focus are then rejected by the MUC
        // layer itself. In production this edge case does not arise: jicofo
        // always joins first, creates and configures the room, then regular
        // users arrive after the room is unlocked.
    });

    // -------------------------------------------------------------------------
    // health check rooms
    // -------------------------------------------------------------------------
    describe('health check rooms', () => {

        it('focus can join a health check room', async () => {
            // connectFocus throws on timeout if the join is blocked.
            await ctx.connectFocus(healthRoom());
        });

        it('non-focus participant is blocked from a health check room', async () => {
            const r = healthRoom();
            const c = await ctx.connect();
            const presence = await c.joinRoom(r);

            assert.equal(presence.attrs.type, 'error',
                'non-focus should not be allowed into health-check rooms');
            assert.ok(
                presence.getChild('error')?.getChild('service-unavailable'),
                'error condition must be service-unavailable'
            );
        });

        it('non-focus is blocked even when focus is already in the room', async () => {
            const r = healthRoom();

            await ctx.connectFocus(r);

            const intruder = await ctx.connect();
            const presence = await intruder.joinRoom(r);

            assert.equal(presence.attrs.type, 'error',
                'non-focus must still be blocked after focus has joined');
            assert.ok(
                presence.getChild('error')?.getChild('service-unavailable'),
                'error condition must be service-unavailable'
            );
        });
    });
});
