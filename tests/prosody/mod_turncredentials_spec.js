import assert from 'assert';

import { createXmppClient } from './helpers/xmpp_client.js';
import { assertExtdiscoServices } from './helpers/xmpp_utils.js';

describe('mod_turncredentials', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('returns a result IQ with <services> to a c2s client', async () => {
        const c = await createXmppClient({ domain: 'turncredentials.localhost' });

        clients.push(c);

        const iq = await c.sendExtdiscoIq('turncredentials.localhost');

        assert.equal(iq.attrs.type, 'result', `expected result IQ, got type="${iq.attrs.type}"`);

        const services = iq.getChild('services', 'urn:xmpp:extdisco:1');

        assert.ok(services, 'result IQ must contain <services xmlns="urn:xmpp:extdisco:1">');
    });

    it('serves entries from turncredentials config (port 3478)', async () => {
        await assertExtdiscoServices('turncredentials.localhost', 3478, clients);
    });
});
