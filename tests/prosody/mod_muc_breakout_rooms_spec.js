import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const BREAKOUT_MUC = 'breakout.conference.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';

// JSON message type constants (must match mod_muc_breakout_rooms.lua)
const BREAKOUT_ROOMS_TYPE = 'breakout_rooms';
const EVENT_UPDATE = 'features/breakout-rooms/update';
const OP_ADD = 'features/breakout-rooms/add';
const OP_REMOVE = 'features/breakout-rooms/remove';
const OP_RENAME = 'features/breakout-rooms/rename';

let _roomCounter = 0;

const nextRoomName = () => `br-test-${++_roomCounter}`;
const roomJid = name => `${name}@${CONFERENCE}`;

/**
 * Parses the JSON payload from a <json-message xmlns="http://jitsi.org/jitmeet"> stanza.
 * Returns null if the stanza has no such child or the body is not valid JSON.
 *
 * @param {object} stanza
 * @returns {object|null}
 */
function parseJsonMessage(stanza) {
    const jm = stanza.getChild('json-message', JITMEET_NS);

    if (!jm) {
        return null;
    }
    try {
        return JSON.parse(jm.getText());
    } catch {
        return null;
    }
}

/**
 * Waits for a breakout_rooms update broadcast on the given client.
 * Resolves with the parsed JSON payload.
 *
 * mod_muc_breakout_rooms broadcasts only to non-admin occupants, so always
 * wait on a JWT moderator client, never on the focus (admin) client.
 *
 * @param {object} client
 * @param {number} [timeout=6000]  ms — must exceed BROADCAST_ROOMS_INTERVAL (300 ms)
 * @returns {Promise<object>}
 */
async function waitForBreakoutUpdate(client, timeout = 6000) {
    const stanza = await client.waitForMessage(s => {
        const p = parseJsonMessage(s);

        return p?.type === BREAKOUT_ROOMS_TYPE && p?.event === EVENT_UPDATE;
    }, timeout);

    return parseJsonMessage(stanza);
}

/**
 * Creates a conference room with focus and an authenticated moderator.
 *
 * Focus joins first to satisfy the mod_muc_meeting_id jicofo lock so that
 * regular clients can join. The moderator connects with ?room=name so that
 * mod_jitsi_session sets jitsi_web_query_room, which mod_muc_breakout_rooms
 * uses to look up the main room. The JWT token carries context.user.moderator=true
 * so mod_token_affiliation promotes the client to moderator on join.
 *
 * mod_muc_breakout_rooms excludes Prosody admins (focus) from update broadcasts,
 * so the moderator — who is NOT a Prosody admin — acts as the broadcast receiver
 * in tests.
 *
 * @param {string} name  bare room name, e.g. 'br-test-1'
 * @returns {Promise<{focus: object, moderator: object}>}
 */
async function createRoom(name) {
    const jid = roomJid(name);
    const focus = await joinWithFocus(jid);
    const token = mintAsapToken({
        room: name,
        context: { user: { moderator: true } }
    });
    const moderator = await createXmppClient({ params: { room: name,
        token } });

    await moderator.joinRoom(jid);

    return { focus,
        moderator };
}

describe('mod_muc_breakout_rooms', () => {

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
    });

    // -------------------------------------------------------------------------
    // breakout room creation
    // -------------------------------------------------------------------------
    describe('create breakout room', () => {

        it('moderator receives an update broadcast after creating a breakout room', async () => {
            const name = nextRoomName();
            const { focus, moderator } = await createRoom(name);

            clients.push(focus, moderator);

            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Group 1' });

            const payload = await waitForBreakoutUpdate(moderator);

            assert.equal(payload.type, BREAKOUT_ROOMS_TYPE);
            assert.equal(payload.event, EVENT_UPDATE);
        });

        it('update payload contains the main room and the new breakout room', async () => {
            const name = nextRoomName();
            const { focus, moderator } = await createRoom(name);

            clients.push(focus, moderator);

            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Group A' });

            const payload = await waitForBreakoutUpdate(moderator);
            const rooms = Object.values(payload.rooms);

            assert.equal(rooms.length, 2, 'payload must contain main room + one breakout room');

            const mainRoom = rooms.find(r => r.isMainRoom);
            const breakoutRoom = rooms.find(r => !r.isMainRoom);

            assert.ok(mainRoom, 'one room must be flagged as the main room');
            assert.ok(breakoutRoom, 'one room must be the breakout room');
            assert.equal(breakoutRoom.name, 'Group A');
            assert.ok(
                breakoutRoom.jid.endsWith(`@${BREAKOUT_MUC}`),
                `breakout room JID must be on ${BREAKOUT_MUC}`
            );
        });

        it('all non-admin occupants of the main room receive the update broadcast', async () => {
            const name = nextRoomName();
            const { focus, moderator } = await createRoom(name);

            // A second non-admin participant.
            const participant = await createXmppClient({ params: { room: name } });

            clients.push(focus, moderator, participant);
            await participant.joinRoom(roomJid(name));

            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Team Room' });

            const [ modPayload, partPayload ] = await Promise.all([
                waitForBreakoutUpdate(moderator),
                waitForBreakoutUpdate(participant)
            ]);

            assert.equal(modPayload.event, EVENT_UPDATE, 'moderator must receive the update');
            assert.equal(partPayload.event, EVENT_UPDATE, 'regular participant must receive the update');
        });

        it('roomCounter increments with each created breakout room', async () => {
            const name = nextRoomName();
            const { focus, moderator } = await createRoom(name);

            clients.push(focus, moderator);

            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Room 1' });
            const first = await waitForBreakoutUpdate(moderator);

            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Room 2' });
            const second = await waitForBreakoutUpdate(moderator);

            assert.ok(second.roomCounter > first.roomCounter, 'roomCounter must increase');
        });

    });

    // -------------------------------------------------------------------------
    // breakout room removal
    // -------------------------------------------------------------------------
    describe('remove breakout room', () => {

        it('moderator can remove a breakout room and receives an update', async () => {
            const name = nextRoomName();
            const { focus, moderator } = await createRoom(name);

            clients.push(focus, moderator);

            // Create
            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Temp Room' });
            const createPayload = await waitForBreakoutUpdate(moderator);

            const breakoutJid = Object.values(createPayload.rooms)
                .find(r => !r.isMainRoom)?.jid;

            assert.ok(breakoutJid, 'breakout room JID must be present in create update');

            // Remove
            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_REMOVE, {
                breakoutRoomJid: breakoutJid
            });

            const removePayload = await waitForBreakoutUpdate(moderator);
            const rooms = Object.values(removePayload.rooms);

            assert.equal(rooms.length, 1, 'only the main room must remain after removal');
            assert.ok(rooms[0].isMainRoom, 'remaining room must be the main room');
        });

    });

    // -------------------------------------------------------------------------
    // breakout room rename
    // -------------------------------------------------------------------------
    describe('rename breakout room', () => {

        it('moderator can rename a breakout room and receives an update with the new name', async () => {
            const name = nextRoomName();
            const { focus, moderator } = await createRoom(name);

            clients.push(focus, moderator);

            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Original Name' });
            const createPayload = await waitForBreakoutUpdate(moderator);

            const breakoutJid = Object.values(createPayload.rooms)
                .find(r => !r.isMainRoom)?.jid;

            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_RENAME, {
                breakoutRoomJid: breakoutJid,
                subject: 'Renamed Room'
            });

            const renamePayload = await waitForBreakoutUpdate(moderator);
            const renamedRoom = Object.values(renamePayload.rooms).find(r => !r.isMainRoom);

            assert.ok(renamedRoom, 'breakout room must still exist after rename');
            assert.equal(renamedRoom.name, 'Renamed Room');
        });

    });

    // -------------------------------------------------------------------------
    // smacks regression: eb43cf601
    // -------------------------------------------------------------------------
    describe('smacks session resume', () => {

        it('participant can join breakout room after smacks session resume', async () => {
            // Regression test for eb43cf601:
            // mod_auth_token.lua's c2s-session-updated handler used to copy
            // jitsi_breakout_main_jid from the fresh TCP session (which never
            // joined a room, so the field is nil) onto the old hibernating
            // session, silently overwriting the valid value set when the user
            // originally joined the main room.  Without the fix, the subsequent
            // on_occupant_pre_join_or_change check
            //   origin.jitsi_breakout_main_jid ~= main_room.jid
            // fails with nil ~= main_room_jid → not-allowed error.
            const name = nextRoomName();
            const { focus, moderator } = await createRoom(name);

            clients.push(focus, moderator);

            // Register a breakout room via the OP_ADD message flow and capture its JID.
            await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Breakout 1' });
            const createPayload = await waitForBreakoutUpdate(moderator);
            const breakoutJid = Object.values(createPayload.rooms).find(r => !r.isMainRoom)?.jid;

            assert.ok(breakoutJid, 'breakout room JID must be in the create broadcast');

            // Focus (jicofo) joins the breakout room first to physically create it,
            // matching the real-life flow where Jicofo creates the room on the
            // breakout component (which has restrict_room_creation=true, so only
            // Prosody admins like focus@auth.localhost can create rooms here).
            const focusBreakoutPresence = await focus.joinRoom(breakoutJid, 'focus');

            assert.notEqual(
                focusBreakoutPresence.attrs.type,
                'error',
                'focus must be able to join (create) the breakout room'
            );

            // Arm the reconnect listener BEFORE dropping so we cannot miss the
            // 'reconnected' event even if the reconnect is very fast.
            const reconnected = moderator.waitForReconnect();

            // Snap the WebSocket.  @xmpp/client schedules a reconnect after ~1 s;
            // on reconnect it sends <resume> which triggers Prosody's
            // c2s-session-updated — the event where the bug cleared jitsi_breakout_main_jid.
            moderator.dropConnection();

            // Wait until SMACKS resume is fully complete (entity.status === 'online').
            // waitForReconnect() polls entity.status after the @xmpp/reconnect
            // 'reconnected' event, because that event fires on stream-open which
            // is before stream features (including SMACKS) are negotiated.
            await reconnected;

            // The moderator now tries to join the breakout room.
            // With the bug:   jitsi_breakout_main_jid is nil → not-allowed error.
            // With the fix:   jitsi_breakout_main_jid is preserved → join succeeds.
            const presence = await moderator.joinRoom(breakoutJid);

            assert.notEqual(
                presence.attrs.type,
                'error',
                'participant must be able to join breakout room after smacks session resume'
            );
        });

    });

    // -------------------------------------------------------------------------
    // access control
    // -------------------------------------------------------------------------
    describe('access control', () => {

        it('non-admin cannot create rooms on the breakout component (restrict_room_creation)', async () => {
            // Any anonymous or JWT-authenticated client that is NOT a Prosody
            // admin (i.e. not focus@auth.localhost) should receive a <forbidden/>
            // or similar error when trying to create a new room on the breakout
            // MUC component.  restrict_room_creation=true on the component is the
            // first line of defence; on_breakout_room_pre_create is the second.
            const name = nextRoomName();
            const user = await createXmppClient({ params: { room: name } });

            clients.push(user);

            const fakeBreakoutJid = `00000000-0000-0000-0000-000000000000@${BREAKOUT_MUC}`;
            const presence = await user.joinRoom(fakeBreakoutJid, undefined, { timeout: 15000 });

            assert.equal(
                presence.attrs.type,
                'error',
                'non-admin must receive an error when attempting to create a breakout room'
            );
        });

        it('ignores create requests from non-moderator participants', async () => {
            const name = nextRoomName();
            const { focus, moderator } = await createRoom(name);

            // Anonymous participant — no moderator token means participant role.
            const participant = await createXmppClient({ params: { room: name } });

            clients.push(focus, moderator, participant);
            await participant.joinRoom(roomJid(name));

            // Participant sends a create request — the module must ignore it.
            await participant.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, {
                subject: 'Unauthorized Room'
            });

            // A broadcast would only arrive if the room was actually created.
            await assert.rejects(
                waitForBreakoutUpdate(participant, 1500),
                /Timeout/,
                'no broadcast must be received when a non-moderator attempts to create a room'
            );
        });

    });

});
