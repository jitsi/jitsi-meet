export const BREAKOUT_MUC = 'breakout.conference.localhost';

const JITMEET_NS = 'http://jitsi.org/jitmeet';
const BREAKOUT_ROOMS_TYPE = 'breakout_rooms';
const OP_ADD = 'features/breakout-rooms/add';
const EVENT_UPDATE = 'features/breakout-rooms/update';

/**
 * Returns the JID of a breakout room from a breakout rooms update stanza, or
 * null if the stanza is not such an update or it has no breakout room.
 *
 * @param {object} stanza
 * @returns {string|null}
 */
function breakoutJidFromUpdate(stanza) {
    const text = stanza.getChild('json-message', JITMEET_NS)?.getText();

    if (!text) {
        return null;
    }

    try {
        const payload = JSON.parse(text);

        if (payload?.type !== BREAKOUT_ROOMS_TYPE || payload?.event !== EVENT_UPDATE) {
            return null;
        }

        return Object.values(payload.rooms).find(r => !r.isMainRoom)?.jid ?? null;
    } catch {
        return null;
    }
}

/**
 * Creates a breakout room of the main room and resolves with its JID.
 *
 * The moderator registers the room, then focus joins it to create it, the same
 * as Jicofo does (the breakout MUC has restrict_room_creation=true).
 *
 * @param {object} focus      Focus client, an occupant of the main room.
 * @param {object} moderator  Moderator client, an occupant of the main room,
 *                            connected with ?room=<main room name>.
 * @returns {Promise<string>}
 */
export async function createBreakoutRoom(focus, moderator) {
    await moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, OP_ADD, { subject: 'Group 1' });

    const update = await moderator.waitForMessage(s => breakoutJidFromUpdate(s) !== null, 6000);
    const breakoutJid = breakoutJidFromUpdate(update);

    await focus.joinRoom(breakoutJid, 'focus');

    return breakoutJid;
}

/**
 * Moves a client from the main room to a breakout room, the same as the client
 * does: it joins the main room, leaves it and joins the breakout room. Only a
 * session that was in the main room may join its breakout rooms.
 *
 * @param {object} client        Client connected with ?room=<main room name>.
 * @param {string} mainRoomJid   Full main room JID.
 * @param {string} breakoutJid   Full breakout room JID.
 * @returns {Promise<void>}
 */
export async function joinBreakoutRoom(client, mainRoomJid, breakoutJid) {
    await client.joinRoom(mainRoomJid);
    await client.leaveRoom(mainRoomJid);

    const presence = await client.joinRoom(breakoutJid);

    if (presence.attrs.type === 'error') {
        throw new Error(`Could not join breakout room ${breakoutJid}: ${presence.toString()}`);
    }
}
