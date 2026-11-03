import assert from 'assert';

import { createBreakoutRoom, joinBreakoutRoom } from './helpers/breakout_rooms.js';
import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

// mod_polls_component is loaded as the "polls.localhost" component (see
// docker/prosody.cfg.lua). It hooks message/host for new-poll / answer-poll
// json-messages, keeps per-room poll state (installed on conference.localhost
// through process_host_module) and re-broadcasts poll updates to every
// occupant. The sender must be an occupant of the room, located from
// jitsi_web_query_room (set by mod_jitsi_session from the ?room= param).
const CONFERENCE = 'conference.localhost';
const POLLS_COMPONENT = 'polls.localhost';
const METADATA_COMPONENT = 'metadata.localhost';
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

    // ── Poll creation restriction ───────────────────────────────────────────

    describe('pollCreationRestricted', () => {

        /**
         * Connects a client with a token for the room and registers it for cleanup.
         *
         * @param {string} roomJid  Full room JID.
         * @param {object} context  JWT context claims.
         * @returns {Promise<object>}
         */
        async function connectWithToken(roomJid, context) {
            const roomName = roomJid.split('@')[0];
            const token = mintAsapToken({ room: roomName,
                context });
            const c = await createXmppClient({ params: { room: roomName,
                token } });

            clients.push(c);

            return c;
        }

        /**
         * Restricts poll creation in the room and waits for the metadata
         * broadcast that confirms it.
         *
         * @param {object} mod      Moderator, an occupant of the room.
         * @param {string} roomJid  Full room JID.
         */
        async function restrictPolls(mod, roomJid) {
            mod.sendMetadataUpdate(METADATA_COMPONENT, roomJid, 'permissions', { pollCreationRestricted: true });
            await mod.waitForMessage(s => {
                try {
                    return JSON.parse(s.getChild('json-message', JITMEET_NS)?.getText())
                        ?.metadata?.permissions?.pollCreationRestricted === true;
                } catch {
                    return false;
                }
            }, 3000);
        }

        /**
         * Creates a room with a moderator that restricted poll creation.
         *
         * @returns {Promise<{r: string, focus: object, mod: object}>}
         */
        async function setup() {
            const r = nextRoom();
            const focus = await focusJoin(r);
            const mod = await connectWithToken(r, { user: { moderator: true } });

            await mod.joinRoom(r);
            await restrictPolls(mod, r);

            return { r,
                focus,
                mod };
        }

        /**
         * Asserts that the poll of the creator is rejected with <not-allowed/>
         * and is not broadcast to the other occupant.
         *
         * @param {object} creator  Client that creates the poll.
         * @param {object} other    Another occupant of the same room.
         */
        async function assertPollRejected(creator, other) {
            creator.createPoll(POLLS_COMPONENT, nextPollId(), 'Q', [ { name: 'A' } ]);

            const reply = await creator.waitForMessage(s => s.attrs.type === 'error');

            assert.ok(reply.getChild('error')?.getChild('not-allowed'), 'expected <not-allowed/> error condition');
            await assertNoPollBroadcast(other);
        }

        it('an anonymous occupant cannot create a poll', async () => {
            const { r, mod } = await setup();
            const creator = await joinParticipant(r);

            await assertPollRejected(creator, mod);
        });

        it('an anonymous occupant of a breakout room cannot create a poll', async () => {
            const { r, focus, mod } = await setup();
            const breakoutJid = await createBreakoutRoom(focus, mod);
            const roomName = r.split('@')[0];
            const other = await createXmppClient({ params: { room: roomName } });
            const creator = await createXmppClient({ params: { room: roomName } });

            clients.push(other, creator);
            await joinBreakoutRoom(other, r, breakoutJid);
            await joinBreakoutRoom(creator, r, breakoutJid);

            await assertPollRejected(creator, other);
        });

        it('an occupant of a breakout room with create-polls=true can create a poll', async () => {
            const { r, focus, mod } = await setup();
            const breakoutJid = await createBreakoutRoom(focus, mod);
            const roomName = r.split('@')[0];
            const other = await createXmppClient({ params: { room: roomName } });
            const creator = await connectWithToken(r, { features: { 'create-polls': true } });

            clients.push(other);
            await joinBreakoutRoom(other, r, breakoutJid);
            await joinBreakoutRoom(creator, r, breakoutJid);

            const pollId = nextPollId();

            creator.createPoll(POLLS_COMPONENT, pollId, 'Q', [ { name: 'A' } ]);

            const poll = await waitForPollCommand(other, 'new-poll');

            assert.equal(poll.pollId, pollId);
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
});
