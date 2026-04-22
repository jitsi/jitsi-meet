import assert from 'assert';
import { createXmppClient } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';

// Each test uses a unique room name to avoid cross-test state.
let _roomCounter = 0;
const room = () => `max-occupants-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_max_occupants', () => {
    // Prosody config sets muc_max_occupants = 2.

    let clients;

    beforeEach(() => { clients = []; });

    afterEach(async () => {
        // Disconnect all clients. Rooms auto-destroy when the last occupant leaves.
        await Promise.all(clients.map(c => c.disconnect()));
    });

    async function connect() {
        const c = await createXmppClient();
        clients.push(c);
        return c;
    }

    it('allows join when room is empty', async () => {
        const c = await connect();
        const presence = await c.joinRoom(room());
        assert.notEqual(presence.attrs.type, 'error');
    });

    it('allows join when room has one occupant (under limit)', async () => {
        const r = room();
        const c1 = await connect();
        const c2 = await connect();
        await c1.joinRoom(r);
        const presence = await c2.joinRoom(r);
        assert.notEqual(presence.attrs.type, 'error');
    });

    it('blocks join when room is at the limit', async () => {
        const r = room();
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
        // is_healthcheck_room() matches rooms starting with '__jicofo-health-check'
        const healthRoom = `__jicofo-health-check-test@${CONFERENCE}`;
        const c1 = await connect();
        const c2 = await connect();
        const c3 = await connect();

        await c1.joinRoom(healthRoom);
        await c2.joinRoom(healthRoom);

        const presence = await c3.joinRoom(healthRoom);
        assert.notEqual(presence.attrs.type, 'error', 'health check room should not enforce limit');
    });
});
