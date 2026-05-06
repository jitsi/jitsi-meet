import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { getRoomState } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const COMPONENT = 'endconference.localhost';

let _roomCounter = 0;
const room = () => `end-conf-${++_roomCounter}@${CONFERENCE}`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates a room with:
 *   - focus (joins first to satisfy the mod_muc_meeting_id jicofo lock)
 *   - moderator: a client whose token carries context.user.moderator=true,
 *     which mod_token_affiliation promotes to owner/moderator on join.
 *     The ?room= URL param sets jitsi_web_query_room so that
 *     mod_end_conference can locate the room.
 *
 * @returns {{ roomJid, roomName, focus, moderator }}
 */
async function createRoom() {
    const roomJid = room();
    const roomName = roomJid.split('@')[0];

    const focus = await joinWithFocus(roomJid);

    const token = mintAsapToken({ context: { user: { moderator: true } } });
    const moderator = await createXmppClient({ params: { room: roomName,
        token } });

    await moderator.joinRoom(roomJid);

    return { roomJid,
        roomName,
        focus,
        moderator };
}

/**
 * Disconnects all provided clients.
 *
 * @param {...object} clients - Clients to disconnect.
 * @returns {Promise<void>}
 */
async function disconnectAll(...clients) {
    await Promise.all(clients.map(c => c.disconnect()));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mod_end_conference', () => {

    // ── Successful destruction ───────────────────────────────────────────────

    it('moderator can end the conference — room is destroyed', async () => {
        const { roomJid, focus, moderator } = await createRoom();

        try {
            const before = await getRoomState(roomJid);

            assert.ok(before, 'room must exist before end_conference');

            await moderator.sendEndConference(COMPONENT);

            // Room destruction triggers an unavailable presence to all occupants.
            await moderator.waitForPresence(p => p.attrs.type === 'unavailable');

            const after = await getRoomState(roomJid);

            assert.strictEqual(after, null, 'room must be gone after end_conference');
        } finally {
            await disconnectAll(focus, moderator);
        }
    });

    it('all occupants receive an unavailable presence with a destroy reason', async () => {
        const { roomJid, roomName, focus, moderator } = await createRoom();

        // A second participant so we can verify the unavailable broadcast.
        const participant = await createXmppClient({ params: { room: roomName } });

        await participant.joinRoom(roomJid);

        try {
            await moderator.sendEndConference(COMPONENT);

            // Both the moderator and the participant must receive the kick.
            const [ modPresence, partPresence ] = await Promise.all([
                moderator.waitForPresence(p => p.attrs.type === 'unavailable'),
                participant.waitForPresence(p => p.attrs.type === 'unavailable')
            ]);

            for (const [ label, presence ] of [ [ 'moderator', modPresence ], [ 'participant', partPresence ] ]) {
                const mucUser = presence.getChild('x', 'http://jabber.org/protocol/muc#user');

                assert.ok(mucUser, `${label} unavailable presence must contain muc#user <x>`);
                assert.ok(
                    mucUser.getChild('destroy'),
                    `${label} unavailable presence must contain a <destroy> element`
                );
            }
        } finally {
            await disconnectAll(focus, moderator, participant);
        }
    });

    // ── Non-moderator / non-occupant ─────────────────────────────────────────

    it('non-moderator participant cannot end the conference', async () => {
        const { roomJid, roomName, focus, moderator } = await createRoom();

        // Participant joins with ?room= but is NOT granted moderator.
        const participant = await createXmppClient({ params: { room: roomName } });

        await participant.joinRoom(roomJid);

        try {
            await participant.sendEndConference(COMPONENT);

            // No reply is sent; poll briefly to confirm the room is untouched.
            await new Promise(resolve => setTimeout(resolve, 300));

            const state = await getRoomState(roomJid);

            assert.ok(state, 'room must still exist after non-moderator end_conference attempt');
        } finally {
            await disconnectAll(focus, moderator, participant);
        }
    });

    it('non-occupant cannot end the conference', async () => {
        const { roomJid, roomName, focus, moderator } = await createRoom();

        // Client has the correct ?room= param but has never joined the MUC.
        const outsider = await createXmppClient({ params: { room: roomName } });

        try {
            await outsider.sendEndConference(COMPONENT);

            await new Promise(resolve => setTimeout(resolve, 300));

            const state = await getRoomState(roomJid);

            assert.ok(state, 'room must still exist after non-occupant end_conference attempt');
        } finally {
            await disconnectAll(focus, moderator, outsider);
        }
    });

    // ── Message filtering ────────────────────────────────────────────────────

    it('plain message without <end_conference/> element is ignored', async () => {
        const { roomJid, focus, moderator } = await createRoom();

        try {
            await moderator.sendPlainMessage(COMPONENT);

            await new Promise(resolve => setTimeout(resolve, 300));

            const state = await getRoomState(roomJid);

            assert.ok(state, 'room must still exist after message without end_conference element');
        } finally {
            await disconnectAll(focus, moderator);
        }
    });

});
