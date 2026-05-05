import assert from 'assert';

import { createXmppClient } from './helpers/xmpp_client.js';

describe('mod_turncredentials', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('returns a result IQ with <services> to a c2s client', async () => {
        const c = await createXmppClient();

        clients.push(c);

        const iq = await c.sendExtdiscoIq('localhost');

        assert.equal(iq.attrs.type, 'result', `expected result IQ, got type="${iq.attrs.type}"`);

        const services = iq.getChild('services', 'urn:xmpp:extdisco:1');

        assert.ok(services, 'result IQ must contain <services xmlns="urn:xmpp:extdisco:1">');
    });

    it('serves entries from turncredentials config (port 3478)', async () => {
        const c = await createXmppClient();

        clients.push(c);

        const iq = await c.sendExtdiscoIq('localhost');
        const services = iq.getChild('services', 'urn:xmpp:extdisco:1');
        const entries = services?.getChildren('service') ?? [];

        assert.ok(entries.length > 0, 'services element must contain at least one <service>');
        const ports = entries.map(s => s.attrs.port);

        assert.ok(
            entries.every(s => s.attrs.port === '3478'),
            `all entries must use port 3478 (turncredentials config), got: ${JSON.stringify(ports)}`
        );
    });
});
