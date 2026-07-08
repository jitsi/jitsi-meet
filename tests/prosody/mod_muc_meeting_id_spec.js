import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { getRoomState } from './helpers/test_observer.js';
import { joinWithTranscriber } from './helpers/xmpp_client.js';
import { isAvailablePresence } from './helpers/xmpp_utils.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `meeting-id-${++_roomCounter}@${CONFERENCE}`;
const healthRoom = () => `__jicofo-health-check-mid-${++_roomCounter}@${CONFERENCE}`;

/**
 * Asserts that an IQ response is a 'cancel'/'not-allowed' error.
 *
 * @param {object} iq  the IQ stanza returned by sendMucAdmin
 * @returns {void}
 */
function assertNotAllowed(iq) {
    assert.strictEqual(iq.attrs.type, 'error', 'IQ must be rejected');
    const error = iq.getChild('error');

    assert.ok(error, 'response must carry an <error>');
    assert.strictEqual(error.attrs.type, 'cancel');
    assert.ok(error.getChild('not-allowed'), 'error condition must be not-allowed');
}

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

        it('a regular user cannot create a room by joining first', async () => {
            const r = room();

            // restrict_room_creation = true (core Prosody mod_muc) limits
            // :create-room to admins. A non-focus client's presence to a
            // nonexistent room is rejected at muc-room-pre-create, before the
            // room object exists and before mod_muc_meeting_id's jicofo lock
            // ever comes into play.
            const c = await ctx.connect();
            const presence = await c.joinRoom(r);

            assert.strictEqual(presence.attrs.type, 'error', 'join must be rejected');
            const error = presence.getChild('error');

            assert.ok(error, 'response must carry an <error>');
            assert.strictEqual(error.attrs.type, 'cancel');
            assert.ok(error.getChild('not-allowed'), 'error condition must be not-allowed');
        });

        it('focus can still create the room after a rejected creation attempt', async () => {
            const r = room();

            const c = await ctx.connect();

            await c.joinRoom(r);

            // connectFocus throws (timeout) if the join is blocked.
            await ctx.connectFocus(r);
        });
    });

    // -------------------------------------------------------------------------
    // set admin filtering
    // -------------------------------------------------------------------------
    //
    // filter_admin_set in mod_muc_meeting_id intercepts muc#admin set IQs at a
    // high priority (before Prosody's own handler) and rejects any item that
    // targets certain occupants — by nick (role changes) or by real JID
    // (affiliation changes).

    describe('set admin filtering', () => {

        it('a kick (role=none by nick) targeting certain participant is rejected', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const attacker = await ctx.connect();

            await attacker.joinRoom(r);

            const resp = await attacker.sendMucAdmin(r, { nick: 'focus',
                role: 'none' });

            assertNotAllowed(resp);

            const state = await getRoomState(r);

            assert.strictEqual(state.occupant_count, 2, 'must remain in the room after a blocked kick');
        });

        it('a ban (affiliation=outcast by jid) targeting certain participant is rejected', async () => {
            const r = room();

            const focus = await ctx.connectFocus(r);
            const focusBareJid = focus.jid.split('/')[0];
            const attacker = await ctx.connect();

            await attacker.joinRoom(r);

            const resp = await attacker.sendMucAdmin(r, { jid: focusBareJid,
                affiliation: 'outcast' });

            assertNotAllowed(resp);

            const state = await getRoomState(r);

            assert.strictEqual(state.occupant_count, 2, 'must remain in the room after a blocked ban');
        });

        it('a role demotion (role=participant) targeting certain participant is rejected', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const attacker = await ctx.connect();

            await attacker.joinRoom(r);

            const resp = await attacker.sendMucAdmin(r, { nick: 'focus',
                role: 'participant' });

            assertNotAllowed(resp);
        });

        it('admin operations targeting a non-focus occupant are not blocked by this hook', async () => {
            const r = room();

            // focus is the room owner, so it is allowed to kick a regular user.
            // This verifies the filtering is scoped and does not
            // block legitimate moderation of other participants.
            const focus = await ctx.connectFocus(r);
            const user = await ctx.connect();

            await user.joinRoom(r);
            const { nick } = user;

            const resp = await focus.sendMucAdmin(r, { nick,
                role: 'none' });

            assert.strictEqual(resp.attrs.type, 'result',
                'must be able to kick a regular participant');

            const state = await getRoomState(r);

            assert.strictEqual(state.occupant_count, 1,
                'kicked regular user should be gone, only focus remains');
        });
    });

    // -------------------------------------------------------------------------
    // transcription filter robustness
    // -------------------------------------------------------------------------
    //
    // filterTranscriptionResult() in mod_muc_meeting_id processes groupchat
    // messages from transcribers. Two nil-deref bugs exist:
    //   1. transcript[1].text crashes when transcript is an empty array.
    //   2. participant.id crashes when the participant field is absent.
    // Both are reached only from transcriber JIDs (is_transcriber() guard).
    // Tests verify the session survives both malformed payloads.

    describe('transcription filter robustness', () => {

        it('session survives a transcription-result with an empty transcript array', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const transcriber = await joinWithTranscriber(r);

            try {
                // transcript: [] → transcript[1] is nil → .text crashes
                await transcriber.sendJsonGroupchat(r, {
                    type: 'transcription-result',
                    transcript: [],
                    participant: { id: 'p1',
                        name: 'Alice' },
                    // eslint-disable-next-line camelcase
                    is_interim: false
                });

                await new Promise(resolve => setTimeout(resolve, 400));

                const disconnected = await transcriber.waitForDisconnect(300)
                    .then(() => true, () => false);

                assert.strictEqual(disconnected, false,
                    'transcriber session must survive empty transcript array');
            } finally {
                await transcriber.disconnect();
            }
        });

        it('session survives a transcription-result with a missing participant field', async () => {
            const r = room();

            await ctx.connectFocus(r);
            const transcriber = await joinWithTranscriber(r);

            try {
                // participant absent → participant.id crashes
                await transcriber.sendJsonGroupchat(r, {
                    type: 'transcription-result',
                    transcript: [ { text: 'hello world' } ],
                    // eslint-disable-next-line camelcase
                    is_interim: false
                });

                await new Promise(resolve => setTimeout(resolve, 400));

                const disconnected = await transcriber.waitForDisconnect(300)
                    .then(() => true, () => false);

                assert.strictEqual(disconnected, false,
                    'transcriber session must survive missing participant field');
            } finally {
                await transcriber.disconnect();
            }
        });

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
