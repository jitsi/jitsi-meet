import assert from 'assert';
import http from 'http';

import { createXmppClient } from './helpers/xmpp_client.js';

/**
 * Fetches the mod_jitsi_session field snapshot for the given full JID from
 * the /test-observer/session-info endpoint (served by mod_test_observer_http).
 *
 * @param {string} jid  full JID, e.g. "user@localhost/resource"
 * @returns {Promise<object>}
 */
function getSessionInfo(jid) {
    return new Promise((resolve, reject) => {
        const url = `http://localhost:5280/test-observer/session-info?jid=${encodeURIComponent(jid)}`;

        http.get(url, res => {
            let body = '';

            res.on('data', chunk => {
                body += chunk;
            });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`session-info returned ${res.statusCode}: ${body}`));

                    return;
                }
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error(`session-info bad JSON: ${body}`));
                }
            });
        }).on('error', reject);
    });
}

describe('mod_jitsi_session', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('sets session.previd from ?previd query param', async () => {
        const c = await createXmppClient({ params: { previd: 'testprevid' } });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.equal(info.previd, 'testprevid');
    });

    it('sets session.jitsi_web_query_room from ?room query param', async () => {
        const c = await createXmppClient({ params: { room: 'myroom' } });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.equal(info.jitsi_web_query_room, 'myroom');
    });

    it('sets session.jitsi_web_query_prefix from ?prefix query param', async () => {
        const c = await createXmppClient({ params: { prefix: 'tenant1' } });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.equal(info.jitsi_web_query_prefix, 'tenant1');
    });

    it('sets session.jitsi_web_query_prefix to empty string when query string present but ?prefix absent', async () => {
        // A query string must be present so the if-block in mod_jitsi_session runs;
        // without any query string the field is never assigned and stays nil.
        const c = await createXmppClient({ params: { room: 'myroom' } });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.equal(info.jitsi_web_query_prefix, '');
    });

    it('rejects connection when ?token is present but invalid', async () => {
        // mod_jitsi_session sets session.auth_token from ?token, but with
        // authentication="token" (RS256/ASAP on localhost) the auth module
        // immediately tries to verify it. An invalid token string fails JWT
        // parsing before resource-bind, so the session fields are never
        // accessible via getSessionInfo.
        await assert.rejects(
            () => createXmppClient({ params: { token: 'notavalidjwt' } }),
            /not-allowed/
        );
    });

    it('sets session.customusername from ?customusername query param', async () => {
        const c = await createXmppClient({ params: { customusername: 'alice' } });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.equal(info.customusername, 'alice');
    });
});
