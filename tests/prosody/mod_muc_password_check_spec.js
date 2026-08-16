import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { enableLobby } from './helpers/test_observer.js';
import { joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const BASE_URL = 'http://localhost:5280/room-info';

let _roomCounter = 0;
const room = () => `password-check-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_password_check', () => {

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
    });

    /**
     * Joins a room as focus and registers the client for cleanup.
     *
     * @param {string} roomJid Full room JID.
     * @returns {Promise<object>} The focus client.
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    /**
     * Calls GET /room-info?room=<roomName> and returns the parsed response.
     *
     * @param {string} roomName The room query param value (bare or full JID).
     * @param {string|null} token Bearer token to include, or null to omit.
     * @param {object} [opts]
     * @param {boolean} [opts.omitAuth=false] When true, omit the Authorization header entirely.
     * @returns {Promise<{status: number, body: object|string}>}
     */
    async function getRoomInfo(roomName, token, { omitAuth = false } = {}) {
        const headers = { 'Content-Type': 'application/json' };

        if (!omitAuth && token !== null) {
            headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${BASE_URL}?room=${encodeURIComponent(roomName)}`, { headers });
        const text = await res.text();
        let body;

        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }

        return { status: res.status,
            body };
    }

    /**
     * Calls PUT /room-info?room=<roomName> with the given passcode and returns
     * the parsed response.
     *
     * @param {string} roomName The room query param value.
     * @param {string} passcode The passcode to submit.
     * @param {string|null} token Bearer token, or null to send without value.
     * @param {object} [opts]
     * @param {boolean} [opts.omitAuth=false] When true, omit the Authorization header entirely.
     * @returns {Promise<{status: number, body: object|string}>}
     */
    async function validatePasscode(roomName, passcode, token, { omitAuth = false } = {}) {
        const headers = { 'Content-Type': 'application/json' };

        if (!omitAuth && token !== null) {
            headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${BASE_URL}?room=${encodeURIComponent(roomName)}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ passcode })
        });
        const text = await res.text();
        let body;

        try {
            body = JSON.parse(text);
        } catch {
            body = text;
        }

        return { status: res.status,
            body };
    }

    // -------------------------------------------------------------------------
    // authentication
    // -------------------------------------------------------------------------
    describe('authentication', () => {

        it('GET returns 403 when Authorization header is absent', async () => {
            const r = room();

            await focusJoin(r);

            const { status } = await getRoomInfo(r.split('@')[0], null, { omitAuth: true });

            assert.strictEqual(status, 403);
        });

        it('GET returns 403 when token is invalid', async () => {
            const r = room();

            await focusJoin(r);

            const { status } = await getRoomInfo(r.split('@')[0], 'invalid.token.here');

            assert.strictEqual(status, 403);
        });

        it('PUT returns 403 when Authorization header is absent', async () => {
            const r = room();

            await focusJoin(r);

            const { status } = await validatePasscode(r.split('@')[0], 'somepasscode', null, { omitAuth: true });

            assert.strictEqual(status, 403);
        });

    });

    // -------------------------------------------------------------------------
    // parameter validation
    // -------------------------------------------------------------------------
    describe('parameter validation', () => {

        it('GET returns 400 when room query param is missing', async () => {
            const token = mintAsapToken({ room: '*' });
            const res = await fetch(BASE_URL, {
                headers: { Authorization: `Bearer ${token}` }
            });

            assert.strictEqual(res.status, 400);
        });

        it('PUT returns 400 when Content-Type is not application/json', async () => {
            const token = mintAsapToken({ room: '*' });
            const res = await fetch(`${BASE_URL}?room=someroom`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'text/plain',
                    Authorization: `Bearer ${token}`
                },
                body: '{"passcode":"test"}'
            });

            assert.strictEqual(res.status, 400);
        });

        it('PUT returns 400 when body is empty', async () => {
            const token = mintAsapToken({ room: '*' });
            const res = await fetch(`${BASE_URL}?room=someroom`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: ''
            });

            assert.strictEqual(res.status, 400);
        });

        it('PUT returns 400 when body is valid JSON but passcode key is missing', async () => {
            const token = mintAsapToken({ room: '*' });
            const res = await fetch(`${BASE_URL}?room=someroom`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: '{}'
            });

            assert.strictEqual(res.status, 400);
        });

    });

    // -------------------------------------------------------------------------
    // room lookup
    // -------------------------------------------------------------------------
    describe('room lookup', () => {

        it('GET returns 404 when room does not exist', async () => {
            const token = mintAsapToken({ room: '*' });
            const { status } = await getRoomInfo('nonexistent-room', token);

            assert.strictEqual(status, 404);
        });

        it('PUT returns 404 when room does not exist', async () => {
            const token = mintAsapToken({ room: '*' });
            const { status } = await validatePasscode('nonexistent-room', 'secret', token);

            assert.strictEqual(status, 404);
        });

    });

    // -------------------------------------------------------------------------
    // GET room info
    // -------------------------------------------------------------------------
    describe('GET room info', () => {

        it('returns passcodeProtected: false and lobbyEnabled: false for a plain room', async () => {
            const r = room();
            const roomName = r.split('@')[0];

            await focusJoin(r);

            const token = mintAsapToken({ room: '*' });
            const { status, body } = await getRoomInfo(roomName, token);

            assert.strictEqual(status, 200);
            assert.strictEqual(body.passcodeProtected, false);
            assert.strictEqual(body.lobbyEnabled, false);
        });

        it('returns passcodeProtected: true when room has a password set', async () => {
            const r = room();
            const roomName = r.split('@')[0];
            const focus = await focusJoin(r);

            await focus.setRoomPassword(r, 'secret123');

            const token = mintAsapToken({ room: '*' });
            const { status, body } = await getRoomInfo(roomName, token);

            assert.strictEqual(status, 200);
            assert.strictEqual(body.passcodeProtected, true);
        });

        it('returns lobbyEnabled: true when lobby is enabled', async () => {
            const r = room();
            const roomName = r.split('@')[0];

            await focusJoin(r);
            await enableLobby(r);

            const token = mintAsapToken({ room: '*' });
            const { status, body } = await getRoomInfo(roomName, token);

            assert.strictEqual(status, 200);
            assert.strictEqual(body.lobbyEnabled, true);
        });

        it('conference field equals the full room JID', async () => {
            const r = room();
            const roomName = r.split('@')[0];

            await focusJoin(r);

            const token = mintAsapToken({ room: '*' });
            const { status, body } = await getRoomInfo(roomName, token);

            assert.strictEqual(status, 200);
            assert.strictEqual(body.conference, `${roomName}@${CONFERENCE}`);
        });

    });

    // -------------------------------------------------------------------------
    // PUT passcode validation
    // -------------------------------------------------------------------------
    describe('PUT passcode validation', () => {

        it('returns { valid: true } when submitted passcode matches', async () => {
            const r = room();
            const roomName = r.split('@')[0];
            const focus = await focusJoin(r);

            await focus.setRoomPassword(r, 'correct-pass');

            const token = mintAsapToken({ room: '*' });
            const { status, body } = await validatePasscode(roomName, 'correct-pass', token);

            assert.strictEqual(status, 200);
            assert.strictEqual(body.valid, true);
        });

        it('returns { valid: false } when submitted passcode does not match', async () => {
            const r = room();
            const roomName = r.split('@')[0];
            const focus = await focusJoin(r);

            await focus.setRoomPassword(r, 'correct-pass');

            const token = mintAsapToken({ room: '*' });
            const { status, body } = await validatePasscode(roomName, 'wrong-pass', token);

            assert.strictEqual(status, 200);
            assert.strictEqual(body.valid, false);
        });

    });

});
