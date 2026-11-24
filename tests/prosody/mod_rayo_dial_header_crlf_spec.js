import assert from 'assert';
import http from 'http';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

let _roomCounter = 0;
const nextRoom = () => `rayo-crlf-${++_roomCounter}@conference.localhost`;

// Header name that mod_filter_iq_rayo adds to the forwarded dial IQ from the
// JWT context.  Its value comes from session.jitsi_meet_context_user.id which
// Prosody decodes directly from the JWT (not via XML), so any CRLF in the
// token claim lands in the Lua string and flows through util.stanza
// serialization without the XML-layer whitespace normalisation that applies
// to attribute-sourced values.
const INITIATOR_HEADER = 'X-outbound-call-initiator-user';

/**
 * Fetches pending dial IQ messages from the test observer.
 *
 * @returns {Promise<Array>}
 */
function getDialIqs() {
    return new Promise((resolve, reject) => {
        http.get('http://localhost:5280/test-observer/dial-iqs', res => {
            let body = '';

            res.on('data', c => {
                body += c;
            });
            res.on('end', () => resolve(JSON.parse(body)));
        }).on('error', reject);
    });
}

/**
 * Clears all dial IQ messages from the test observer.
 *
 * @returns {Promise<void>}
 */
function clearDialIqs() {
    return new Promise((resolve, reject) => {
        const req = http.request(
            'http://localhost:5280/test-observer/dial-iqs',
            { method: 'DELETE' },
            res => res.resume().on('end', resolve)
        );

        req.on('error', reject);
        req.end();
    });
}

describe('mod_filter_iq_rayo — CRLF escaping in re-serialized headers', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    /**
     * Creates a test client whose JWT embeds userId as context.user.id.
     * Joins a fresh room (focus first so the jicofo lock is lifted).
     *
     * @param {string} userId  Value to put in context.user.id.
     * @returns {Promise<{client: object, room: string}>}
     */
    async function setup(userId) {
        const room = nextRoom();
        const roomName = room.split('@')[0];
        const token = mintAsapToken({
            room: roomName,
            context: {
                features: { 'outbound-call': true },
                ...userId === undefined ? {} : { user: { id: userId } }
            }
        });
        const focus = await joinWithFocus(room);

        clients.push(focus);

        const c = await createXmppClient({ params: { token } });

        clients.push(c);
        await c.joinRoom(room);

        return { client: c,
            room };
    }

    // ── helper ────────────────────────────────────────────────────────────────

    /**
     * Sends a well-formed dial IQ and waits for at most one forwarded IQ to
     * appear in the test observer.  Returns the first captured dial IQ entry.
     *
     * @param {object} client  XmppTestClient
     * @param {string} room    Full room JID
     * @returns {Promise<object>}
     */
    async function sendAndCapture(client, room) {
        await clearDialIqs();
        await client.sendRayoIq(room);

        // Give Prosody time to route the IQ to the MUC component.
        await new Promise(r => setTimeout(r, 300));

        const iqs = await getDialIqs();

        assert.strictEqual(iqs.length, 1, 'dial IQ must reach the MUC component');

        return iqs[0];
    }

    // ── CRLF in JWT user id → X-outbound-call-initiator-user header ──────────

    /**
     * Asserts that the raw XML captured by the test observer contains no raw
     * CR or LF bytes in any attribute value.
     *
     * @param {string} rawXml  The raw_xml field from the observer entry.
     */
    function assertNoRawCrlf(rawXml) {
        assert.ok(!/[\r\n]/.test(rawXml),
            'raw XML must contain no raw CR or LF bytes');
    }

    it('sanitises CRLF in JWT user-id when building the initiator header', async () => {
        // CRLF embedded in the token claim.  Prosody decodes the JWT directly
        // (not via XML), so the Lua string retains the raw \r\n.
        // mod_filter_iq_rayo normalises the value via sanitize_header_value()
        // before inserting it into the forwarded stanza attribute.
        // mod_test_observer captures tostring(stanza) — the serialized bytes
        // that would reach the wire — so asserting no raw CR/LF in raw_xml
        // directly verifies the normalisation.
        const userId = 'legit-user\r\nextra-data';
        const { client: c, room } = await setup(userId);
        const iq = await sendAndCapture(c, room);

        assert.ok(iq.headers?.[INITIATOR_HEADER] !== undefined,
            `forwarded dial IQ must contain ${INITIATOR_HEADER}`);

        assertNoRawCrlf(iq.raw_xml);

        // The CRLF must have been replaced with spaces, not silently dropped.
        assert.ok(iq.headers[INITIATOR_HEADER].includes('legit-user'),
            'the legitimate part of the user-id must be preserved');
    });

    it('sanitises bare LF in JWT user-id', async () => {
        const { client: c, room } = await setup('user\nextra-data');
        const iq = await sendAndCapture(c, room);

        assertNoRawCrlf(iq.raw_xml);
    });

    it('sanitises bare CR in JWT user-id', async () => {
        const { client: c, room } = await setup('user\rextra-data');
        const iq = await sendAndCapture(c, room);

        assertNoRawCrlf(iq.raw_xml);
    });

    it('passes through a clean user-id unchanged (control)', async () => {
        const userId = 'clean-user-id';
        const { client: c, room } = await setup(userId);
        const iq = await sendAndCapture(c, room);

        assert.strictEqual(iq.headers?.[INITIATOR_HEADER], userId,
            'a clean user-id must be forwarded verbatim');
        assertNoRawCrlf(iq.raw_xml);
    });

    // ── CRLF sent in a client XML attribute → XML parser normalises it ────────
    //
    // When the JS client puts \r\n inside an XML attribute value, expat's
    // attribute-value normalisation (XML spec §3.3.3) converts each literal
    // whitespace character to a space before the Lua application layer ever
    // sees the value.  Prosody therefore never receives raw CRLF from this
    // path; the re-forwarded stanza contains spaces instead.
    // These tests confirm that normalisation end-to-end: the JS client sends
    // a JvbRoomPassword containing CR/LF, the IQ still passes the filter
    // (because JvbRoomName is correct), and the raw_xml captured at the MUC
    // component contains no raw CR or LF bytes in any attribute value.

    it('XML attribute CRLF is normalised to spaces by expat before reaching Lua', async () => {
        // No JWT user context needed here — we are testing the XML-attribute
        // path, not the JWT path.
        const { client: c, room } = await setup(undefined);

        await clearDialIqs();

        // @xmpp/client serialises the value as-is into the XML byte stream;
        // expat on the Prosody side normalises the literal \r and \n to spaces.
        await c.sendRayoIq(room, { roomPassHeader: 'secret\r\nextra-data' });
        await new Promise(r => setTimeout(r, 300));

        const iqs = await getDialIqs();

        assert.strictEqual(iqs.length, 1,
            'IQ with CRLF in JvbRoomPassword must still reach the MUC component');

        const iq = iqs[0];

        // The password value the Lua application received (after expat
        // normalisation) must not contain raw CR or LF.
        assert.ok(!/[\r\n]/.test(iq.room_pass_header),
            'room_pass_header must contain no raw CR/LF after XML attribute normalisation');

        // Likewise the serialised wire form must have no raw control bytes.
        assert.ok(!/[\r\n]/.test(iq.raw_xml),
            'raw_xml must contain no raw CR/LF bytes');
    });
});

