const BASE = 'http://localhost:5280/test-observer';

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
 * @returns {Promise<{jid: string, hidden: boolean, occupant_count: number}>}
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
