import assert from 'assert';

import { createXmppClient } from './xmpp_client.js';

/**
 * Connects a client to the given domain, sends a XEP-0215 extdisco IQ, and
 * asserts that the response is a valid result containing service entries that
 * all use the expected port. The connected client is pushed into `clients` for
 * afterEach cleanup.
 *
 * @param {string} domain        - XMPP domain to connect to and send the IQ to.
 * @param {number} expectedPort  - Port number all returned service entries must use.
 * @param {Array}  clients       - Cleanup array; the new client is appended.
 * @returns {Promise<void>}
 */
export async function assertExtdiscoServices(domain, expectedPort, clients) {
    const c = await createXmppClient({ domain });

    clients.push(c);

    const iq = await c.sendExtdiscoIq(domain);

    assert.equal(iq.attrs.type, 'result', `expected result IQ, got type="${iq.attrs.type}"`);

    const services = iq.getChild('services', 'urn:xmpp:extdisco:1');

    assert.ok(services, 'result IQ must contain <services xmlns="urn:xmpp:extdisco:1">');

    const entries = services.getChildren('service');

    assert.ok(entries.length > 0, 'services element must contain at least one <service>');

    const ports = entries.map(s => s.attrs.port);

    assert.ok(
        entries.every(s => Number(s.attrs.port) === expectedPort),
        `all entries must use port ${expectedPort}, got: ${JSON.stringify(ports)}`
    );
}

/**
 * Returns true when a presence stanza represents a successful join.
 * Per XEP-0045 / RFC 6121, available presence has no type attribute or
 * type="available"; error presence has type="error".
 *
 * @param {object} presence - Presence stanza.
 * @returns {boolean}
 */
export function isAvailablePresence(presence) {
    const t = presence.attrs.type;

    return t === undefined || t === 'available';
}

/**
 * Extracts the value of a named field from a disco#info IQ result stanza.
 * Returns the string value, or null if the field is absent or has no value.
 *
 * @param {object} iq      - IQ stanza returned by sendDiscoInfo().
 * @param {string} varName - The field var attribute to look for.
 * @returns {string|null}
 */
export function discoField(iq, varName) {
    const query = iq.getChild('query', 'http://jabber.org/protocol/disco#info');
    const form = query?.getChild('x', 'jabber:x:data');
    const field = form?.getChildren('field').find(f => f.attrs.var === varName);

    return field?.getChild('value')?.text() ?? null;
}
