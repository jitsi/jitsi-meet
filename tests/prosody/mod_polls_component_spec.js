import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { prosodyShell } from './helpers/prosody_shell.js';
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

        it('answer-poll with a mismatched answer count is ignored', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const other = await joinParticipant(r);

            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [ { name: 'A' }, { name: 'B' } ]);
            await Promise.all([
                waitForPollCommand(creator, 'new-poll'),
                waitForPollCommand(other, 'new-poll')
            ]);

            creator.sendPollsMessage(POLLS_COMPONENT, JSON.stringify({
                answers: [ true, false, true ],
                command: 'answer-poll',
                pollId,
                type: 'polls'
            }));

            await Promise.all([
                assertNoPollBroadcast(creator),
                assertNoPollBroadcast(other)
            ]);

            creator.sendPollsMessage(POLLS_COMPONENT, JSON.stringify({
                answers: [ true ],
                command: 'answer-poll',
                pollId,
                type: 'polls'
            }));

            await Promise.all([
                assertNoPollBroadcast(creator),
                assertNoPollBroadcast(other)
            ]);

            // The malformed votes must not mutate the stored poll state.
            creator.answerPoll(POLLS_COMPONENT, pollId, [ true, false ]);
            const [ answer, answerAtOther ] = await Promise.all([
                waitForPollCommand(creator, 'answer-poll'),
                waitForPollCommand(other, 'answer-poll')
            ]);

            assert.deepEqual(answer.answers, [ true, false ]);
            assert.deepEqual(answerAtOther.answers, [ true, false ]);
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

    // ── Single answer polls ─────────────────────────────────────────────────

    describe('single answer polls', () => {

        /**
         * Creates a poll by sending a raw new-poll message, so that options can be set.
         *
         * @param {object} client
         * @param {string} pollId
         * @param {object} [extra]  Extra fields of the new-poll message.
         */
        function createPollWith(client, pollId, extra = {}) {
            client.sendPollsMessage(POLLS_COMPONENT, JSON.stringify({
                answers: [ { name: 'A' }, { name: 'B' }, { name: 'C' } ],
                command: 'new-poll',
                pollId,
                question: 'Pick one',
                type: 'polls',
                ...extra
            }));
        }

        /**
         * Joins a creator and a voter and creates a poll that both received.
         *
         * @param {object} [extra]  Extra fields of the new-poll message.
         */
        async function setup(extra) {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const voter = await joinParticipant(r);
            const pollId = nextPollId();

            createPollWith(creator, pollId, extra);

            const [ poll ] = await Promise.all([
                waitForPollCommand(voter, 'new-poll'),
                waitForPollCommand(creator, 'new-poll')
            ]);

            return { creator,
                poll,
                pollId,
                r,
                voter };
        }

        it('broadcasts singleAnswer with the new poll', async () => {
            const { poll } = await setup({ singleAnswer: true });

            assert.strictEqual(poll.singleAnswer, true);
        });

        it('a poll without singleAnswer is broadcast without it', async () => {
            const { poll } = await setup();

            assert.ok(!('singleAnswer' in poll), 'singleAnswer must not be added to a regular poll');
        });

        it('accepts one answer for a single answer poll', async () => {
            const { pollId, voter } = await setup({ singleAnswer: true });

            voter.answerPoll(POLLS_COMPONENT, pollId, [ false, true, false ]);

            const answer = await waitForPollCommand(voter, 'answer-poll');

            assert.deepEqual(answer.answers, [ false, true, false ]);
        });

        it('keeps only the first of several answers for a single answer poll', async () => {
            const { creator, pollId, voter } = await setup({ singleAnswer: true });

            voter.answerPoll(POLLS_COMPONENT, pollId, [ false, true, true ]);

            const [ voterCopy, creatorCopy ] = await Promise.all([
                waitForPollCommand(voter, 'answer-poll'),
                waitForPollCommand(creator, 'answer-poll')
            ]);

            assert.deepEqual(voterCopy.answers, [ false, true, false ],
                'the voter must get back the vote the server kept');
            assert.deepEqual(creatorCopy.answers, [ false, true, false ]);
        });

        it('stores only the first of several answers for a single answer poll', async () => {
            // Only the voter joins first, the test rooms are limited to two participants.
            const r = nextRoom();

            await focusJoin(r);
            const voter = await joinParticipant(r);
            const pollId = nextPollId();

            createPollWith(voter, pollId, { singleAnswer: true });
            await waitForPollCommand(voter, 'new-poll');

            voter.answerPoll(POLLS_COMPONENT, pollId, [ true, false, true ]);
            await waitForPollCommand(voter, 'answer-poll');

            const late = await joinParticipant(r);
            const history = await waitForPollCommand(late, 'old-polls');
            const stored = history.polls.find(p => p.pollId === pollId);

            assert.deepEqual(stored.answers.map(a => a.voters?.length ?? 0), [ 1, 0, 0 ],
                'only the first chosen answer must be counted');
        });

        it('still accepts several answers for a regular poll', async () => {
            const { pollId, voter } = await setup();

            voter.answerPoll(POLLS_COMPONENT, pollId, [ true, true, false ]);

            const answer = await waitForPollCommand(voter, 'answer-poll');

            assert.deepEqual(answer.answers, [ true, true, false ]);
        });

        it('a late joiner receives singleAnswer via old-polls', async () => {
            // Only the creator joins first, the test rooms are limited to two participants.
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const pollId = nextPollId();

            createPollWith(creator, pollId, { singleAnswer: true });
            await waitForPollCommand(creator, 'new-poll');

            const late = await joinParticipant(r);
            const history = await waitForPollCommand(late, 'old-polls');
            const stored = history.polls.find(p => p.pollId === pollId);

            assert.strictEqual(stored?.singleAnswer, true);
        });

        it('a new poll with a non-boolean singleAnswer is rejected', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            createPollWith(creator, nextPollId(), { singleAnswer: 'yes' });

            await assertNoPollBroadcast(creator);
        });
    });

    // ── Closing polls ───────────────────────────────────────────────────────

    describe('closing polls', () => {

        /**
         * Sends a close-poll message for the poll.
         *
         * @param {object} client
         * @param {string} pollId
         */
        function closePoll(client, pollId) {
            client.sendPollsMessage(POLLS_COMPONENT, JSON.stringify({
                command: 'close-poll',
                pollId,
                type: 'polls'
            }));
        }

        /**
         * Joins a participant whose token makes them a moderator.
         *
         * @param {string} roomJid  Full room JID.
         * @returns {Promise<object>}
         */
        async function joinModerator(roomJid) {
            const roomName = roomJid.split('@')[0];
            const token = mintAsapToken({ room: roomName,
                context: { user: { moderator: true } } });
            const c = await createXmppClient({ params: { room: roomName,
                token } });

            clients.push(c);
            await c.joinRoom(roomJid);

            return c;
        }

        /**
         * Creates a poll from creator and waits until both clients received it.
         *
         * @param {object} creator
         * @param {object} other
         * @returns {Promise<string>} The id of the poll.
         */
        async function createPollFor(creator, other) {
            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [ { name: 'A' }, { name: 'B' } ]);
            await Promise.all([
                waitForPollCommand(creator, 'new-poll'),
                waitForPollCommand(other, 'new-poll')
            ]);

            return pollId;
        }

        it('the creator can close a poll and everyone is told', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const other = await joinParticipant(r);
            const pollId = await createPollFor(creator, other);

            closePoll(creator, pollId);

            const [ atCreator, atOther ] = await Promise.all([
                waitForPollCommand(creator, 'close-poll'),
                waitForPollCommand(other, 'close-poll')
            ]);

            for (const msg of [ atCreator, atOther ]) {
                assert.equal(msg.pollId, pollId);
                assert.ok(msg.senderId, 'close broadcast must carry the server-stamped senderId');
                assert.ok(!('answers' in msg), 'the occupants have the answers, the close must not repeat them');
            }
        });

        it('a close fires poll-closed for mod_visitors', async () => {
            const events = `prosody.hosts["${CONFERENCE}"].events`;
            const r = nextRoom();

            await prosodyShell(`> local h = prosody.hosts["${CONFERENCE}"]; h.test_poll_closed = {};
                h.test_poll_closed_handler = function(e) table.insert(h.test_poll_closed, e.pollId) end;
                ${events}.add_handler("poll-closed", h.test_poll_closed_handler)`.replace(/\n\s*/g, ' '));

            try {
                await focusJoin(r);
                const creator = await joinParticipant(r);
                const pollId = nextPollId();

                creator.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [ { name: 'A' }, { name: 'B' } ]);
                await waitForPollCommand(creator, 'new-poll');
                closePoll(creator, pollId);
                await waitForPollCommand(creator, 'close-poll');

                const fired = await prosodyShell(
                    `> return table.concat(prosody.hosts["${CONFERENCE}"].test_poll_closed, ",")`);

                assert.ok(fired.includes(pollId), `poll-closed must be fired with the poll id, got: ${fired}`);
            } finally {
                await prosodyShell(`> local h = prosody.hosts["${CONFERENCE}"];
                    ${events}.remove_handler("poll-closed", h.test_poll_closed_handler)`.replace(/\n\s*/g, ' '));
            }
        });

        it('another participant cannot close the poll', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const other = await joinParticipant(r);
            const pollId = await createPollFor(creator, other);

            closePoll(other, pollId);

            const errorReply = await other.waitForMessage(s => s.attrs.type === 'error');

            assert.ok(errorReply.getChild('error')?.getChild('not-allowed'),
                'closing must be rejected with not-allowed');
            await assertNoPollBroadcast(creator);
        });

        it('a moderator can close the poll of another participant', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const moderator = await joinModerator(r);
            const creator = await joinParticipant(r);
            const pollId = await createPollFor(creator, moderator);

            closePoll(moderator, pollId);

            const msg = await waitForPollCommand(creator, 'close-poll');

            assert.equal(msg.pollId, pollId);
        });

        it('a closed poll does not take answers', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const voter = await joinParticipant(r);
            const pollId = await createPollFor(creator, voter);

            closePoll(creator, pollId);
            await waitForPollCommand(voter, 'close-poll');

            voter.answerPoll(POLLS_COMPONENT, pollId, [ true, false ]);

            const errorReply = await voter.waitForMessage(s => s.attrs.type === 'error');

            assert.ok(errorReply.getChild('error')?.getChild('not-allowed'),
                'an answer for a closed poll must be rejected with not-allowed');
            await assertNoPollBroadcast(voter);
        });

        it('a late joiner receives the poll as closed via old-polls', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);
            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [ { name: 'A' }, { name: 'B' } ]);
            await waitForPollCommand(creator, 'new-poll');
            closePoll(creator, pollId);
            await waitForPollCommand(creator, 'close-poll');

            const late = await joinParticipant(r);
            const history = await waitForPollCommand(late, 'old-polls');
            const stored = history.polls.find(p => p.pollId === pollId);

            assert.strictEqual(stored?.closed, true);
        });

        it('a close from the main prosody replaces the answers a visitor node took', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const voter = await joinParticipant(r);
            const pollId = nextPollId();

            voter.createPoll(POLLS_COMPONENT, pollId, 'Pick one', [ { name: 'A' }, { name: 'B' } ]);
            await waitForPollCommand(voter, 'new-poll');
            voter.answerPoll(POLLS_COMPONENT, pollId, [ true, false ]);
            await waitForPollCommand(voter, 'answer-poll');

            // The update a visitor node gets from the main prosody (mod_fmuc fires jitsi-polls-update): the poll
            // is closed and the main prosody has no vote, as it refused the one this node took.
            await prosodyShell(`> prosody.hosts["${CONFERENCE}"].events.fire_event("jitsi-polls-update", {
                room = prosody.hosts["${CONFERENCE}"].modules.muc.get_room_from_jid("${r}"),
                polls = { polls = { { pollId = "${pollId}", senderId = "main", question = "Pick one",
                    answers = { { name = "A" }, { name = "B" } }, closed = true } } } })`.replace(/\n\s*/g, ' '));

            const closed = await waitForPollCommand(voter, 'close-poll');

            assert.equal(closed.pollId, pollId);
            assert.equal(closed.answers?.length, 2, 'the close must carry the main prosody\'s answers');
            assert.ok(!closed.answers[0].voters?.length, 'the refused vote must be gone');

            const late = await joinParticipant(r);
            const history = await waitForPollCommand(late, 'old-polls');
            const stored = history.polls.find(p => p.pollId === pollId);

            assert.strictEqual(stored?.closed, true);
            assert.ok(!stored.answers[0].voters?.length, 'the stored poll must have the main prosody\'s answers');
        });

        it('closing an unknown poll is ignored', async () => {
            const r = nextRoom();

            await focusJoin(r);
            const creator = await joinParticipant(r);

            closePoll(creator, nextPollId());

            await assertNoPollBroadcast(creator);
        });
    });

    // ── Visitor node ────────────────────────────────────────────────────────

    // polls.vnode.test runs mod_polls_component with main_domain set, as on a visitor node, for the
    // conference.vnode.test MUC (see docker/cfg/components.cfg.lua). The main prosody's state reaches a visitor
    // node as jitsi-polls-update, fired here from the shell.
    describe('on a visitor node', () => {
        const VNODE_CONFERENCE = 'conference.vnode.test';
        const VNODE_POLLS = 'polls.vnode.test';

        let _vnodeRoomCounter = 0;
        const nextVnodeRoom = () => `polls-vnode-${++_vnodeRoomCounter}@${VNODE_CONFERENCE}`;

        /**
         * Waits for a polls message from the visitor node's component.
         *
         * @param {object} client
         * @param {string} command
         * @param {number} [timeout]
         * @returns {Promise<object>} The parsed message.
         */
        async function waitForVnodeCommand(client, command, timeout = 3000) {
            const msg = await client.waitForMessage(
                s => s.name === 'message' && s.attrs.from === VNODE_POLLS && parsePoll(s)?.command === command,
                timeout);

            return parsePoll(msg);
        }

        /**
         * Asserts that the client gets no polls message from the visitor node's component.
         *
         * @param {object} client
         */
        async function assertNoVnodeMessage(client) {
            try {
                await client.waitForMessage(s => s.name === 'message' && s.attrs.from === VNODE_POLLS, 1000);
            } catch (err) {
                if (err.message.includes('Timeout')) {
                    return;
                }
                throw err;
            }
            throw new Error('received unexpected polls message from the visitor node');
        }

        /**
         * Joins the room. With asVisitor, the occupant gets the visitor role, like the visitors that mod_fmuc
         * lets into a visitor node's room.
         *
         * @param {string} roomJid
         * @param {boolean} asVisitor
         * @returns {Promise<object>}
         */
        async function joinVnode(roomJid, asVisitor) {
            const c = await joinParticipant(roomJid);

            if (asVisitor) {
                await prosodyShell(`> prosody.hosts["${VNODE_CONFERENCE}"].modules.muc.get_room_from_jid("${roomJid}")
                    :set_role(true, "${roomJid}/${c.nick}", "visitor")`.replace(/\n\s*/g, ' '));
            }

            return c;
        }

        /**
         * Formats a poll as a Lua table.
         *
         * @param {object} poll
         * @returns {string}
         */
        function luaPoll({ pollId, closed }) {
            const answers = '{ { name = "A" }, { name = "B" } }';

            return `{ pollId = "${pollId}", senderId = "main", question = "Pick one", answers = ${answers}${
                closed ? ', closed = true' : ''} }`;
        }

        /**
         * Fires the update that the main prosody sends with the full state of the polls.
         *
         * @param {string} roomJid
         * @param {Array<object>} polls
         */
        async function mainUpdate(roomJid, polls) {
            await prosodyShell(`> prosody.hosts["${VNODE_CONFERENCE}"].events.fire_event("jitsi-polls-update", {
                room = prosody.hosts["${VNODE_CONFERENCE}"].modules.muc.get_room_from_jid("${roomJid}"),
                polls = { polls = { ${polls.map(luaPoll).join(', ')} } } })`.replace(/\n\s*/g, ' '));
        }

        it('sends the main prosody\'s polls only to visitors', async () => {
            const r = nextVnodeRoom();
            const participant = await joinVnode(r, false);
            const visitor = await joinVnode(r, true);
            const pollId = nextPollId();

            await mainUpdate(r, [ { pollId } ]);

            const poll = await waitForVnodeCommand(visitor, 'new-poll');

            assert.equal(poll.pollId, pollId);
            await assertNoVnodeMessage(participant);
        });

        it('a poll closed by the main prosody does not take answers', async () => {
            const r = nextVnodeRoom();

            await joinVnode(r, false);
            const visitor = await joinVnode(r, true);
            const pollId = nextPollId();

            await mainUpdate(r, [ { pollId } ]);
            await waitForVnodeCommand(visitor, 'new-poll');
            await mainUpdate(r, [ { pollId,
                closed: true } ]);

            const closed = await waitForVnodeCommand(visitor, 'close-poll');

            assert.equal(closed.pollId, pollId);
            assert.equal(closed.answers?.length, 2, 'a visitor node must send the main prosody\'s answers');

            visitor.sendPollsMessage(VNODE_POLLS, JSON.stringify({
                answers: [ true, false ],
                command: 'answer-poll',
                pollId,
                type: 'polls'
            }));

            const errorReply = await visitor.waitForMessage(s => s.attrs.type === 'error');

            assert.ok(errorReply.getChild('error')?.getChild('not-allowed'),
                'an answer for a closed poll must be rejected with not-allowed');
        });

        it('refuses a close from a visitor with not-allowed', async () => {
            const r = nextVnodeRoom();

            await joinVnode(r, false);
            const visitor = await joinVnode(r, true);
            const pollId = nextPollId();

            await mainUpdate(r, [ { pollId } ]);
            await waitForVnodeCommand(visitor, 'new-poll');

            visitor.sendPollsMessage(VNODE_POLLS, JSON.stringify({
                command: 'close-poll',
                pollId,
                type: 'polls'
            }));

            const errorReply = await visitor.waitForMessage(s => s.attrs.type === 'error');

            assert.ok(errorReply.getChild('error')?.getChild('not-allowed'),
                'a visitor node must reject a close with not-allowed');
        });

        it('one update closes every poll it closed and still adds a new poll', async () => {
            const r = nextVnodeRoom();

            await joinVnode(r, false);
            const visitor = await joinVnode(r, true);
            const first = nextPollId();
            const second = nextPollId();
            const third = nextPollId();

            await mainUpdate(r, [ { pollId: first } ]);
            await waitForVnodeCommand(visitor, 'new-poll');
            await mainUpdate(r, [ { pollId: first }, { pollId: second } ]);
            await waitForVnodeCommand(visitor, 'new-poll');

            const closes = [];
            const closesDone = (async () => {
                closes.push(await waitForVnodeCommand(visitor, 'close-poll'));
                closes.push(await waitForVnodeCommand(visitor, 'close-poll'));
            })();
            const added = waitForVnodeCommand(visitor, 'new-poll');

            await mainUpdate(r, [ { pollId: first,
                closed: true }, { pollId: second,
                closed: true }, { pollId: third } ]);
            await closesDone;

            assert.deepEqual(closes.map(c => c.pollId).sort(), [ first, second ].sort());
            assert.equal((await added).pollId, third);
        });
    });
});
