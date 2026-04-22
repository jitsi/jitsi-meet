const BASE = 'http://localhost:5280/test-observer';

/**
 * Returns all MUC events recorded by mod_test_observer since the last clear.
 * @returns {Promise<Array<{event: string, room?: string, occupant?: string, timestamp: number}>>}
 */
export async function getEvents() {
    const res = await fetch(`${BASE}/events`);
    if (!res.ok) throw new Error(`GET /events failed: ${res.status}`);
    return res.json();
}

/**
 * Clears the recorded event list.
 */
export async function clearEvents() {
    const res = await fetch(`${BASE}/events`, { method: 'DELETE' });
    if (res.status !== 204) throw new Error(`DELETE /events failed: ${res.status}`);
}

/**
 * Returns room state from Prosody's internal MUC state.
 * @param {string} roomJid  e.g. 'room@conference.localhost'
 * @returns {Promise<{jid: string, hidden: boolean, occupant_count: number}>}
 */
export async function getRoomState(roomJid) {
    const res = await fetch(`${BASE}/rooms?jid=${encodeURIComponent(roomJid)}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`GET /rooms failed: ${res.status}`);
    return res.json();
}
