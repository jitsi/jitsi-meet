import assert from 'assert';

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
});
