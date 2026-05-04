const BASE = 'http://localhost:5280/test-observer';
const END_MEETING_URL = 'http://localhost:5280/end-meeting';
const KICK_PARTICIPANT_URL = 'http://localhost:5280/kick-participant';
const SYSTEM_CHAT_URL = 'http://localhost:5280/send-system-chat-message';
const JIGASI_INVITE_URL = 'http://localhost:5280/invite-jigasi';

/**
 * Returns all MUC events recorded by mod_test_observer since the last clear.
 * @returns {Promise<Array<{event: string, room?: string, occupant?: string, timestamp: number}>>}
 */
export async function getEvents() {
    const res = await fetch(`${BASE}/events`);

    if (!res.ok) {
        throw new Error(`GET /events failed: ${res.status}`);
    }

    return res.json();
}

/**
 * Clears the recorded event list.
 */
export async function clearEvents() {
    const res = await fetch(`${BASE}/events`, { method: 'DELETE' });

    if (res.status !== 204) {
        throw new Error(`DELETE /events failed: ${res.status}`);
    }
}

/**
 * Sets the per-room max_occupants limit for an existing room.
 * The room must already exist (at least one occupant).
 * This overrides the global muc_max_occupants for this room only.
 *
 * @param {string} roomJid  e.g. 'room@conference.localhost'
 * @param {number} max      new occupant limit
 */
export async function setRoomMaxOccupants(roomJid, max) {
    const res = await fetch(`${BASE}/rooms/max-occupants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jid: roomJid,
            // eslint-disable-next-line camelcase
            max_occupants: max
        })
    });

    if (!res.ok) {
        throw new Error(`setRoomMaxOccupants failed: ${res.status} ${await res.text()}`);
    }
}

/**
 * Returns room state from Prosody's internal MUC state.
 * @param {string} roomJid  e.g. 'room@conference.localhost'
 * @returns {Promise<{jid: string, hidden: boolean, occupant_count: number}|null>}
 */
export async function getRoomState(roomJid) {
    const res = await fetch(`${BASE}/rooms?jid=${encodeURIComponent(roomJid)}`);

    if (res.status === 404) {
        return null;
    }
    if (!res.ok) {
        throw new Error(`GET /rooms failed: ${res.status}`);
    }

    return res.json();
}

/**
 * Calls the mod_muc_kick_participant HTTP endpoint to kick a participant.
 *
 * Returns raw { status, body } so tests can assert on error responses.
 *
 * @param {string} roomJid          e.g. 'room@conference.localhost'
 * @param {string} participantId    Occupant nick / resource to kick.
 * @param {string} token            Bearer token.
 * @param {object} [opts]
 * @param {boolean} [opts.omitAuth]  If true, omits the Authorization header.
 * @returns {Promise<{status: number, body: string}>}
 */
export async function kickParticipant(roomJid, participantId, token, { omitAuth = false } = {}) {
    const roomName = roomJid.split('@')[0];
    const url = new URL(KICK_PARTICIPANT_URL);

    url.searchParams.set('room', roomName);

    const headers = { 'Content-Type': 'application/json' };

    if (!omitAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ participantId })
    });

    return { status: res.status, body: await res.text() };
}

/**
 * Calls the mod_muc_jigasi_invite HTTP endpoint to invite Jigasi to dial out.
 *
 * Returns raw { status, body } so tests can assert on error responses.
 *
 * @param {string} roomJid    Conference room JID, e.g. 'room@conference.localhost'
 * @param {string} phoneNo    Dial target, e.g. '+15551234567'
 * @param {string} token      Bearer token.
 * @param {object} [opts]
 * @param {boolean} [opts.omitAuth]  If true, omits the Authorization header.
 * @returns {Promise<{status: number, body: string}>}
 */
export async function inviteJigasi(roomJid, phoneNo, token, { omitAuth = false } = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (!omitAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(JIGASI_INVITE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ conference: roomJid, phoneNo })
    });

    return { status: res.status, body: await res.text() };
}

/**
 * Calls the mod_system_chat_message HTTP endpoint to send a system chat message
 * to one or more participants.
 *
 * Returns raw { status, body } so tests can assert on error responses.
 *
 * @param {string} roomJid          e.g. 'room@conference.localhost'
 * @param {string[]} connectionJIDs Full JIDs of recipients, e.g. ['user@localhost/res']
 * @param {string} message          Message text.
 * @param {string} token            Bearer token.
 * @param {object} [opts]
 * @param {boolean} [opts.omitAuth]    If true, omits the Authorization header.
 * @param {string}  [opts.displayName] Optional display name to include.
 * @returns {Promise<{status: number, body: string}>}
 */
export async function sendSystemChatMessage(roomJid, connectionJIDs, message, token, {
    omitAuth = false,
    displayName,
} = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (!omitAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const body = { room: roomJid, connectionJIDs, message };

    if (displayName !== undefined) {
        body.displayName = displayName;
    }

    const res = await fetch(SYSTEM_CHAT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    return { status: res.status, body: await res.text() };
}

/**
 * Calls the mod_muc_end_meeting HTTP endpoint to terminate a conference.
 *
 * Returns the raw { status, body } rather than throwing on non-2xx so that
 * tests can assert on error responses (401, 404, etc.) directly.
 *
 * @param {string} roomJid          e.g. 'room@conference.localhost'
 * @param {string} token            Bearer token (system token for success; login token to test rejection).
 * @param {object} [opts]
 * @param {boolean} [opts.silentReconnect]  If true, adds silent-reconnect=true to the query.
 * @param {boolean} [opts.omitAuth]         If true, omits the Authorization header entirely.
 * @returns {Promise<{status: number, body: string}>}
 */
export async function endMeeting(roomJid, token, { silentReconnect = false, omitAuth = false } = {}) {
    const url = new URL(END_MEETING_URL);

    url.searchParams.set('conference', roomJid);
    if (silentReconnect) {
        url.searchParams.set('silent-reconnect', 'true');
    }

    const headers = { 'Content-Type': 'application/json' };

    if (!omitAuth) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), { method: 'POST', headers });

    return { status: res.status, body: await res.text() };
}
