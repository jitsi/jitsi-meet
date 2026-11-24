import assert from 'assert';

import { assertExtdiscoServices } from './helpers/xmpp_utils.js';

const BASE = 'http://localhost:5280';

describe('mod_turncredentials_http', () => {

    it('GET /turn-credentials returns 200 with a JSON array', async () => {
        const res = await fetch(`${BASE}/turn-credentials`);
        const text = await res.text();

        assert.equal(res.status, 200, `expected 200, got ${res.status}: ${text}`);

        let body;

        try {
            body = JSON.parse(text);
        } catch (e) {
            assert.fail(`GET /turn-credentials returned non-JSON: ${text}`);
        }

        assert.ok(Array.isArray(body), `body must be a JSON array, got: ${JSON.stringify(body)}`);
        assert.ok(
            body.every(s => s.port === 3479),
            `all entries must use port 3479 (external_services config), got: ${JSON.stringify(body.map(s => s.port))}`
        );
    });

    // mod_turncredentials_http depends on Prosody's external_services module,
    // which hooks the same urn:xmpp:extdisco:1 IQ event on the VirtualHost.
    // This test verifies that external_services is correctly loaded and serving
    // the right config via XMPP, not just via HTTP.
    describe('extdisco IQ (via external_services)', () => {

        const clients = [];

        afterEach(async () => {
            await Promise.all(clients.map(c => c.disconnect()));
            clients.length = 0;
        });

        it('serves entries from external_services config (port 3479)', async () => {
            await assertExtdiscoServices('localhost', 3479, clients);
        });
    });
});
