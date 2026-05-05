const BASE = 'http://localhost:5280/test-observer';
const ACCESS_MANAGER_URL = `${BASE}/access-manager`;
const END_MEETING_URL = 'http://localhost:5280/end-meeting';
const KICK_PARTICIPANT_URL = 'http://localhost:5280/kick-participant';
const SYSTEM_CHAT_URL = 'http://localhost:5280/send-system-chat-message';
const JIGASI_INVITE_URL = 'http://localhost:5280/invite-jigasi';

/**
 * Configures the mock access manager endpoint (served by mod_test_observer_http).
 * mod_muc_auth_ban calls this endpoint for VPaaS sessions
 * (jitsi_web_query_prefix starting with "vpaas-magic-cookie-").
 *
 * Call this before connecting the client under test.
 * Call with { access: true, status: 200 } (the defaults) to reset between tests.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.access=true]   true → allow, false → ban
 * @param {number}  [opts.status=200]    HTTP status code to return.
 *                                       Non-200 values simulate HTTP errors;
 *                                       mod_muc_auth_ban fails open on errors.
 */
export async function setAccessManagerResponse({ access = true, status = 200 } = {}) {
    const res = await fetch(ACCESS_MANAGER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access,
            status })
    });

    if (res.status !== 204) {
        throw new Error(`setAccessManagerResponse failed: ${res.status} ${await res.text()}`);
    }
}

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
 * Sets jitsi_meet_context_user and jitsi_meet_context_features on an active c2s
 * session identified by full JID. Allows tests to simulate JWT token context
 * without running a real token-auth module.
 *
 * @param {string} fullJid  e.g. 'abc123@localhost/res1'
 * @param {string} userId   value for jitsi_meet_context_user.id
 * @param {object} features key/value feature flags, e.g. { flip: true }
 */
export async function setSessionContext(fullJid, userId, features = {}) {
    const res = await fetch(`${BASE}/sessions/context`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jid: fullJid,
            // eslint-disable-next-line camelcase
            user_id: userId,
            features })
    });

    if (!res.ok) {
        throw new Error(`setSessionContext failed: ${res.status} ${await res.text()}`);
    }
}

/**
 * Returns mod_muc_flip's per-room participant tracking state.
 *
 * @param {string} roomJid  e.g. 'room@conference.localhost'
 * @returns {Promise<{participants_details: object, kicked_participant_nick?: string, flip_participant_nick?: string}>}
 */
export async function getRoomParticipants(roomJid) {
    const res = await fetch(`${BASE}/rooms/participants?jid=${encodeURIComponent(roomJid)}`);

    if (res.status === 404) {
        return null;
    }
    if (!res.ok) {
        throw new Error(`getRoomParticipants failed: ${res.status}`);
    }

    return res.json();
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
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), {
        method: 'PUT',
        headers,
        body: JSON.stringify({ participantId })
    });

    return { status: res.status,
        body: await res.text() };
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
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(JIGASI_INVITE_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify({ conference: roomJid,
            phoneNo })
    });

    return { status: res.status,
        body: await res.text() };
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
export async function sendSystemChatMessage(roomJid, connectionJIDs, message, token, { // eslint-disable-line max-params
    omitAuth = false,
    displayName
} = {}) {
    const headers = { 'Content-Type': 'application/json' };

    if (!omitAuth) {
        headers.Authorization = `Bearer ${token}`;
    }

    const body = { room: roomJid,
        connectionJIDs,
        message };

    if (displayName !== undefined) {
        body.displayName = displayName;
    }

    const res = await fetch(SYSTEM_CHAT_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
    });

    return { status: res.status,
        body: await res.text() };
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
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(url.toString(), { method: 'POST',
        headers });

    return { status: res.status,
        body: await res.text() };
}
