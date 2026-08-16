import assert from 'assert';

import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

// mod_polls_component is loaded as the "polls.localhost" component (see
// docker/prosody.cfg.lua). It hooks message/host for new-poll / answer-poll
// json-messages, keeps per-room poll state (installed on conference.localhost
// through process_host_module) and re-broadcasts poll updates to every
// occupant. The sender must be an occupant of the room, located from
// jitsi_web_query_room (set by mod_jitsi_session from the ?room= param).
const CONFERENCE = 'conference.localhost';
const POLLS_COMPONENT = 'polls.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';

let _roomCounter = 0;
const nextRoom = () => `polls-${++_roomCounter}@${CONFERENCE}`;

let _pollCounter = 0;
const nextPollId = () => `poll-${++_pollCounter}`;

/**
 * True when msg is a polls broadcast from the polls component.
 *
 * @param {object} msg  Message stanza.
 * @returns {boolean}
 */
function isPollsBroadcast(msg) {
    return msg.name === 'message'
        && msg.attrs.from === POLLS_COMPONENT
        && msg.getChild('json-message', JITMEET_NS) !== undefined;
}

/**
 * Parses the JSON payload carried by a polls broadcast stanza, or null.
 *
 * @param {object} msg  Message stanza.
 * @returns {object|null}
 */
function parsePoll(msg) {
    const text = msg.getChild('json-message', JITMEET_NS)?.getText();

    try {
        return text ? JSON.parse(text) : null;
    } catch {
        return null;
    }
}

/**
 * Waits for a polls broadcast carrying the given command.
 *
 * @param {object} client   Connected client.
 * @param {string} command  'new-poll' | 'answer-poll' | 'old-polls'
 * @param {number} [timeout=3000]
 * @returns {Promise<object>} The parsed poll payload.
 */
async function waitForPollCommand(client, command, timeout = 3000) {
    const msg = await client.waitForMessage(
        s => isPollsBroadcast(s) && parsePoll(s)?.command === command, timeout);

    return parsePoll(msg);
}

/**
 * Asserts that NO polls broadcast arrives within the given window.
 *
 * @param {object} client
 * @param {number} [timeout=1000]
 */
async function assertNoPollBroadcast(client, timeout = 1000) {
    try {
        await client.waitForMessage(isPollsBroadcast, timeout);
        throw new Error('received unexpected polls broadcast');
    } catch (err) {
        if (err.message.includes('Timeout')) {
            return; // expected — no broadcast arrived
        }
        throw err;
    }
}

describe('mod_polls_component', () => {

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
    });

    /**
     * Focus-joins the room (creating and unlocking it) and registers the client
     * for cleanup. conference.localhost has mod_muc_meeting_id, so a room must be
     * created by focus before regular clients can join.
     *
     * @param {string} roomJid  Full room JID.
     * @returns {Promise<object>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    /**
     * Connects a client with ?room=<roomName> (so mod_jitsi_session sets
     * jitsi_web_query_room), joins the room, and registers it for cleanup.
     *
     * @param {string} roomJid  Full room JID.
     * @returns {Promise<object>}
     */
    async function joinParticipant(roomJid) {
        const roomName = roomJid.split('@')[0];
        const c = await createXmppClient({ params: { room: roomName } });

        clients.push(c);
        await c.joinRoom(roomJid);

        return c;
    }

    // ── Poll creation ───────────────────────────────────────────────────────

    describe('poll creation', () => {

        it('broadcasts a new poll to all occupants', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const other = await joinParticipant(r);

            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [
                { name: 'Option A' },
                { name: 'Option B' }
            ]);

            const [ atCreator, atOther ] = await Promise.all([
                waitForPollCommand(creator, 'new-poll'),
                waitForPollCommand(other, 'new-poll')
            ]);

            for (const poll of [ atCreator, atOther ]) {
                assert.equal(poll.pollId, pollId);
                assert.equal(poll.question, 'Pick one');
                assert.deepEqual(poll.answers.map(a => a.name), [ 'Option A', 'Option B' ]);
                assert.ok(poll.senderId, 'broadcast must carry the server-stamped senderId');
            }
        });

        it('relayed answers contain only names — extra fields are stripped', async () => {
            // Regression test: the component must re-broadcast only the sanitized
            // answers ({ name }). A type-confused voters field (or any other extra
            // field) on an answer must not survive to participants, otherwise it
            // reaches the client reducer / results render which assume voters is
            // an array.
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [
                { name: 'Option A',
                    voters: 1,
                    evil: 'payload' },
                { name: 'Option B',
                    voters: [ { id: 'spoofed',
                        name: 'spoofed' } ] }
            ]);

            const poll = await waitForPollCommand(creator, 'new-poll');

            assert.equal(poll.answers.length, 2);
            assert.deepEqual(poll.answers.map(a => a.name), [ 'Option A', 'Option B' ]);

            for (const answer of poll.answers) {
                assert.strictEqual(answer.voters, undefined, 'voters must be stripped from the broadcast');
                assert.strictEqual(answer.evil, undefined, 'extra fields must be stripped from the broadcast');
                assert.deepEqual(Object.keys(answer), [ 'name' ], 'answers must expose only the name field');
            }
        });

        it('a duplicate pollId is rejected with an error', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'First', [ { name: 'A' } ]);
            await waitForPollCommand(creator, 'new-poll');

            // Same pollId — the module replies with an error and does not
            // broadcast a second new-poll.
            creator.createPoll(POLLS_COMPONENT, pollId, 'Second', [ { name: 'A' } ]);

            const errorReply = await creator.waitForMessage(s => s.attrs.type === 'error');

            assert.ok(errorReply.getChild('error'), 'duplicate pollId must be rejected with an error stanza');
        });
    });

    // ── Poll answering ──────────────────────────────────────────────────────

    describe('poll answering', () => {

        it('broadcasts an answer to all occupants', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const voter = await joinParticipant(r);

            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [
                { name: 'Option A' },
                { name: 'Option B' }
            ]);
            await Promise.all([
                waitForPollCommand(creator, 'new-poll'),
                waitForPollCommand(voter, 'new-poll')
            ]);

            voter.answerPoll(POLLS_COMPONENT, pollId, [ true, false ]);

            const [ atCreator, atVoter ] = await Promise.all([
                waitForPollCommand(creator, 'answer-poll'),
                waitForPollCommand(voter, 'answer-poll')
            ]);

            for (const answer of [ atCreator, atVoter ]) {
                assert.equal(answer.pollId, pollId);
                assert.deepEqual(answer.answers, [ true, false ]);
                assert.ok(answer.senderId, 'answer broadcast must carry the server-stamped senderId');
            }
        });

        it('an answer for an unknown poll is ignored', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const voter = await joinParticipant(r);

            voter.answerPoll(POLLS_COMPONENT, nextPollId(), [ true ]);

            await assertNoPollBroadcast(voter);
        });
    });

    // ── History delivery ──────────────────────────────────────────────────────

    describe('history delivery', () => {

        it('a client joining after a poll was created receives it via old-polls', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'History question', [
                { name: 'A' },
                { name: 'B' }
            ]);
            await waitForPollCommand(creator, 'new-poll');

            // A late joiner receives the current poll state as an old-polls
            // message right after joining.
            const late = await joinParticipant(r);
            const history = await waitForPollCommand(late, 'old-polls');

            assert.ok(Array.isArray(history.polls), 'old-polls must carry a polls array');

            const stored = history.polls.find(p => p.pollId === pollId);

            assert.ok(stored, 'the previously created poll must be present in history');
            assert.equal(stored.question, 'History question');
            assert.deepEqual(stored.answers.map(a => a.name), [ 'A', 'B' ]);
        });
    });

    // ── Validation ──────────────────────────────────────────────────────────

    describe('validation', () => {

        /**
         * Sends a raw new-poll-shaped payload, then asserts no broadcast arrives
         * and the module is still functional afterwards.
         *
         * @param {object} rawPayload  The payload object to serialize and send.
         */
        async function assertRejected(rawPayload) {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            creator.sendPollsMessage(POLLS_COMPONENT, JSON.stringify(rawPayload));
            await assertNoPollBroadcast(creator);

            // The module must still process a well-formed poll afterwards.
            const goodId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, goodId, 'Still working', [ { name: 'A' } ]);
            const poll = await waitForPollCommand(creator, 'new-poll');

            assert.equal(poll.pollId, goodId);
        }

        it('new-poll with a non-string answer name is ignored', () => assertRejected({
            answers: [ { name: 42 } ],
            command: 'new-poll',
            pollId: nextPollId(),
            question: 'Q',
            type: 'polls'
        }));

        it('new-poll with an empty answers array is ignored', () => assertRejected({
            answers: [],
            command: 'new-poll',
            pollId: nextPollId(),
            question: 'Q',
            type: 'polls'
        }));

        it('new-poll with a missing question is ignored', () => assertRejected({
            answers: [ { name: 'A' } ],
            command: 'new-poll',
            pollId: nextPollId(),
            type: 'polls'
        }));

        it('answer-poll with non-boolean answers is ignored', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [ { name: 'A' }, { name: 'B' } ]);
            await waitForPollCommand(creator, 'new-poll');

            // answers must be booleans; a numeric answer must be rejected.
            creator.sendPollsMessage(POLLS_COMPONENT, JSON.stringify({
                answers: [ 1, 0 ],
                command: 'answer-poll',
                pollId,
                type: 'polls'
            }));

            await assertNoPollBroadcast(creator);
        });

        it('invalid JSON is ignored cleanly', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            creator.sendPollsMessage(POLLS_COMPONENT, '{not valid json{{');
            await assertNoPollBroadcast(creator);

            // Module must still be functional after the bad message.
            const goodId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, goodId, 'After bad JSON', [ { name: 'A' } ]);
            const poll = await waitForPollCommand(creator, 'new-poll');

            assert.equal(poll.pollId, goodId);
        });

        it('an oversized payload is rejected', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            // The payload size is checked (>= 1024 bytes) before decoding.
            creator.createPoll(POLLS_COMPONENT, nextPollId(), 'x'.repeat(1100), [ { name: 'A' } ]);
            await assertNoPollBroadcast(creator);

            // A normal poll must still go through afterwards.
            const goodId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, goodId, 'Normal size', [ { name: 'A' } ]);
            const poll = await waitForPollCommand(creator, 'new-poll');

            assert.equal(poll.pollId, goodId);
        });
    });

    // ── Sender must be an occupant ────────────────────────────────────────────

    describe('sender authorization', () => {

        it('a connected non-occupant cannot create a poll', async () => {
            const r = nextRoom();

            await focusJoin(r);

            const roomName = r.split('@')[0];
            const nonOccupant = await createXmppClient({ params: { room: roomName } });

            clients.push(nonOccupant);

            // Deliberately do NOT join the room — the sender is not an occupant.
            nonOccupant.createPoll(POLLS_COMPONENT, nextPollId(), 'Q', [ { name: 'A' } ]);

            await assertNoPollBroadcast(nonOccupant);
        });
    });
});
