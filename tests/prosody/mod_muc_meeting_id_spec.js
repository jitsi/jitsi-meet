import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { joinWithTranscriber } from './helpers/xmpp_client.js';
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
