import assert from 'assert';
import http from 'http';

import { mintToken } from './helpers/jwt.js';
import { createXmppClient } from './helpers/xmpp_client.js';

/**
 * Fetches session-info for the given full JID.
 *
 * @param {string} jid
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

/** Connects to the HS256 VirtualHost. */
function hs256Client(params) {
    return createXmppClient({ domain: 'hs256.localhost',
        params });
}

describe('mod_auth_token (HS256 shared secret)', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('connects successfully with a valid token', async () => {
        const token = mintToken();
        const c = await hs256Client({ token });

        clients.push(c);
        assert.ok(c.jid, 'client should have a JID after connecting');
    });

    it('rejects connection with wrong secret', async () => {
        const token = mintToken({}, { secret: 'wrongsecret' });

        await assert.rejects(
            () => hs256Client({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with expired token', async () => {
        const token = mintToken({}, { expired: true });

        await assert.rejects(
            () => hs256Client({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with not-yet-valid token (nbf in the future)', async () => {
        const token = mintToken({}, { notYetValid: true });

        await assert.rejects(
            () => hs256Client({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with wrong issuer', async () => {
        const token = mintToken({ iss: 'other-app' });

        await assert.rejects(
            () => hs256Client({ token }),
            /not-allowed/
        );
    });

    it('sets session.jitsi_meet_context_features from token context', async () => {
        const token = mintToken({
            context: {
                features: {
                    'screen-sharing': true,
                    'recording': false
                }
            }
        });
        const c = await hs256Client({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_features['screen-sharing'], true);
        assert.strictEqual(info.jitsi_meet_context_features.recording, false);
    });

    it('sets session.jitsi_meet_room from room claim', async () => {
        const token = mintToken({ room: 'testroom' });
        const c = await hs256Client({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_room, 'testroom');
    });
});
