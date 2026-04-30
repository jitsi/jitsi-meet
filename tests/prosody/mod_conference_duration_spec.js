import assert from 'assert';

import { setRoomMaxOccupants } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `conf-duration-${++_roomCounter}@${CONFERENCE}`;

/**
 * Extracts the value of a named field from a disco#info IQ result stanza.
 * Returns the string value, or null if the field is absent or has no value.
 *
 * @param {object} iq     - IQ stanza returned by sendDiscoInfo().
 * @param {string} varName - The field var attribute to look for.
 * @returns {string|null}
 */
function discoField(iq, varName) {
    const query = iq.getChild('query', 'http://jabber.org/protocol/disco#info');
    const form = query?.getChild('x', 'jabber:x:data');
    const field = form?.getChildren('field').find(f => f.attrs.var === varName);

    return field?.getChild('value')?.text() ?? null;
}

describe('mod_conference_duration', () => {

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
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
     * Joins the room as focus (jicofo), unlocking the jicofo lock.
     * Registers the client for afterEach cleanup.
     *
     * @param {string} roomJid  full room JID, e.g. 'room@conference.localhost'
     * @returns {Promise<XmppTestClient>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    it('created_timestamp is absent before a second occupant joins', async () => {
        const r = room();
        const focus = await focusJoin(r);

        // Only focus is in the room — timestamp should not be set yet.
        const iq = await focus.sendDiscoInfo(r);

        assert.equal(iq.attrs.type, 'result');

        const ts = discoField(iq, 'muc#roominfo_created_timestamp');

        assert.ok(!ts, `expected empty/absent created_timestamp before second occupant, got: ${ts}`);
    });

    it('created_timestamp is set once a second occupant joins', async () => {
        const r = room();
        const focus = await focusJoin(r);
        const c = await connect();

        await c.joinRoom(r);

        const iq = await focus.sendDiscoInfo(r);

        assert.equal(iq.attrs.type, 'result');

        const ts = discoField(iq, 'muc#roominfo_created_timestamp');

        assert.ok(ts, 'created_timestamp must be present after second occupant joins');
        assert.match(ts, /^\d+$/, 'created_timestamp must be a numeric string (ms since epoch)');

        const tsNum = parseInt(ts, 10);
        const now = Date.now();

        assert.ok(tsNum > 0, 'timestamp must be positive');
        assert.ok(tsNum <= now, 'timestamp must not be in the future');
        assert.ok(tsNum > now - 30_000, 'timestamp must be recent (within last 30s)');
    });

    it('created_timestamp does not change when further occupants join', async () => {
        const r = room();
        const focus = await focusJoin(r);
        const c1 = await connect();

        await c1.joinRoom(r);

        const iq1 = await focus.sendDiscoInfo(r);
        const ts1 = discoField(iq1, 'muc#roominfo_created_timestamp');

        assert.ok(ts1, 'timestamp must be set after second occupant');

        // Raise per-room limit so the third occupant is not blocked by muc_max_occupants = 2.
        await setRoomMaxOccupants(r, 5);

        // Third occupant joins — timestamp must remain unchanged.
        const c2 = await connect();

        await c2.joinRoom(r);

        const iq2 = await focus.sendDiscoInfo(r);
        const ts2 = discoField(iq2, 'muc#roominfo_created_timestamp');

        assert.equal(ts2, ts1, 'created_timestamp must not change when more occupants join');
    });
});
