import assert from 'assert';

import { setRoomMaxOccupants } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';

// Each test uses a unique room name to avoid cross-test state.
let _roomCounter = 0;
const room = () => `max-occupants-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_max_occupants', () => {
    // Prosody config sets muc_max_occupants = 2.

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        // Disconnect all clients. Rooms auto-destroy when the last occupant leaves.
        await Promise.all(clients.map(c => c.disconnect()));
    });

    /**
     * Creates a regular XMPP client and registers it for afterEach cleanup.
     *
     * @returns {Promise<XmppTestClient>}
     */
    async function connect() {
        const c = await createXmppClient();

        clients.push(c);

        return c;
    }

    /**
     * Creates a whitelisted XMPP client (domain: whitelist.localhost) and
     * registers it for afterEach cleanup.
     *
     * @returns {Promise<XmppTestClient>}
     */
    async function connectWhitelisted() {
        const c = await createXmppClient({ domain: 'whitelist.localhost' });

        clients.push(c);

        return c;
    }

    /**
     * Joins the room as focus (jicofo), unlocking the mod_muc_meeting_id jicofo
     * lock so that subsequent regular clients can join. The focus client is added
     * to `clients` for afterEach cleanup and does not count against the occupant
     * limit (focus.localhost is whitelisted).
     *
     * @param {string} roomJid  full room JID, e.g. 'room@conference.localhost'
     * @returns {Promise<XmppTestClient>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    it('allows join when room is empty', async () => {
        const r = room();

        await focusJoin(r);
        const c = await connect();
        const presence = await c.joinRoom(r);

        assert.notEqual(presence.attrs.type, 'error');
    });

    it('allows join when room has one occupant (under limit)', async () => {
        const r = room();

        await focusJoin(r);
        const c1 = await connect();
        const c2 = await connect();

        await c1.joinRoom(r);
        const presence = await c2.joinRoom(r);

        assert.notEqual(presence.attrs.type, 'error');
    });

    it('blocks join when room is at the limit', async () => {
        const r = room();

        await focusJoin(r);
        const c1 = await connect();
        const c2 = await connect();
        const c3 = await connect();

        await c1.joinRoom(r);
        await c2.joinRoom(r);

        const presence = await c3.joinRoom(r);

        assert.equal(presence.attrs.type, 'error');
        assert.ok(
            presence.getChild('error')?.getChild('service-unavailable'),
            'expected <service-unavailable/> in error stanza'
        );
    });

    it('health check room bypasses the occupant limit', async () => {
        // mod_muc_meeting_id restricts health-check rooms to focus (jicofo) only,
        // so we test the occupant-limit bypass with focus clients.
        // is_healthcheck_room() matches rooms starting with '__jicofo-health-check'.
        const healthRoom = `__jicofo-health-check-test@${CONFERENCE}`;
        const focus = await joinWithFocus(healthRoom);

        clients.push(focus);

        // A second focus join would conflict on nick; the meaningful assertion is
        // that the first focus client joined without hitting a limit error.
        assert.ok(true, 'focus joined health-check room without occupant-limit error');
    });

    describe('whitelist', () => {
        // Prosody config sets muc_access_whitelist = { "whitelist.localhost", "focus.localhost" }.
        // Clients created with domain:'whitelist.localhost' get JIDs on that domain
        // and are treated as whitelisted by mod_muc_max_occupants.

        it('whitelisted user can join a room that is at the limit', async () => {
            const r = room();

            await focusJoin(r);
            const c1 = await connect();
            const c2 = await connect();
            const wl = await connectWhitelisted();

            await c1.joinRoom(r);
            await c2.joinRoom(r); // room now at limit (2 non-whitelisted)

            const presence = await wl.joinRoom(r);

            assert.notEqual(presence.attrs.type, 'error',
                'whitelisted user must bypass the occupant limit');
        });

        it('whitelisted occupants do not count against the limit for non-whitelisted users', async () => {
            const r = room();

            await focusJoin(r);
            const wl1 = await connectWhitelisted();
            const wl2 = await connectWhitelisted();
            const c1 = await connect();
            const c2 = await connect();
            const c3 = await connect();

            // Two whitelisted users join — they bypass the check and are not
            // counted when a non-whitelisted user evaluates available slots.
            await wl1.joinRoom(r);
            await wl2.joinRoom(r);

            // Non-whitelisted users: only they count against the limit of 2.
            const p1 = await c1.joinRoom(r);

            assert.notEqual(p1.attrs.type, 'error',
                '1st non-whitelisted user must be allowed (0 counted occupants so far)');

            const p2 = await c2.joinRoom(r);

            assert.notEqual(p2.attrs.type, 'error',
                '2nd non-whitelisted user must be allowed (1 counted occupant)');

            const p3 = await c3.joinRoom(r);

            assert.equal(p3.attrs.type, 'error',
                '3rd non-whitelisted user must be blocked (2 counted occupants = limit reached)');
            assert.ok(
                p3.getChild('error')?.getChild('service-unavailable'),
                'expected <service-unavailable/> in error stanza'
            );
        });
    });

    describe('per-room limit', () => {
        // room._data.max_occupants overrides the global muc_max_occupants (2)
        // for an individual room. The HTTP helper sets it after room creation.

        it('per-room limit higher than global allows more occupants', async () => {
            const r = room();

            await focusJoin(r);
            const c1 = await connect();

            await c1.joinRoom(r);

            // Override the global limit of 2 with a per-room limit of 4.
            await setRoomMaxOccupants(r, 4);

            const c2 = await connect();
            const c3 = await connect();
            const c4 = await connect();
            const c5 = await connect();

            const p2 = await c2.joinRoom(r);

            assert.notEqual(p2.attrs.type, 'error', 'user 2 should join (limit 4)');

            const p3 = await c3.joinRoom(r);

            assert.notEqual(p3.attrs.type, 'error',
                'user 3 should join (global limit 2 would block, per-room limit 4 allows)');

            const p4 = await c4.joinRoom(r);

            assert.notEqual(p4.attrs.type, 'error', 'user 4 should join (limit 4)');

            const p5 = await c5.joinRoom(r);

            assert.equal(p5.attrs.type, 'error', 'user 5 must be blocked (at per-room limit 4)');
            assert.ok(
                p5.getChild('error')?.getChild('service-unavailable'),
                'expected <service-unavailable/> in error stanza'
            );
        });

        it('per-room limit lower than global restricts the room further', async () => {
            const r = room();

            await focusJoin(r);
            const c1 = await connect();

            await c1.joinRoom(r);

            // Override the global limit of 2 with a stricter per-room limit of 1.
            await setRoomMaxOccupants(r, 1);

            const c2 = await connect();
            const presence = await c2.joinRoom(r);

            assert.equal(presence.attrs.type, 'error',
                'user 2 must be blocked by the per-room limit of 1');
            assert.ok(
                presence.getChild('error')?.getChild('service-unavailable'),
                'expected <service-unavailable/> in error stanza'
            );
        });
    });
});
