import assert from 'assert';
import http from 'http';

import { mintAsapToken } from './helpers/jwt.js';
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

/**
 * Connects to the main VirtualHost (RS256 / ASAP key-server auth).
 * Tokens must be signed with the test RSA private key; Prosody fetches the
 * matching public key from mod_test_observer_http's /asap-keys/ route.
 */
function asapClient(params) {
    return createXmppClient({ params });
}

describe('mod_auth_token (ASAP / RS256)', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('connects successfully with a valid RS256 token', async () => {
        const token = mintAsapToken();
        const c = await asapClient({ token });

        clients.push(c);
        assert.ok(c.jid, 'client should have a JID after connecting');
    });

    it('rejects connection with wrong private key', async () => {
        // Sign with a freshly generated key that the server does not know.
        const { generateKeyPairSync } = await import('crypto');
        const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        const wrongPem = privateKey.export({ type: 'pkcs8',
            format: 'pem' });
        const token = mintAsapToken({}, { privateKey: wrongPem });

        await assert.rejects(
            () => asapClient({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with expired token', async () => {
        const token = mintAsapToken({}, { expired: true });

        await assert.rejects(
            () => asapClient({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with not-yet-valid token (nbf in the future)', async () => {
        const token = mintAsapToken({}, { notYetValid: true });

        await assert.rejects(
            () => asapClient({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with wrong issuer', async () => {
        const token = mintAsapToken({ iss: 'other-app' });

        await assert.rejects(
            () => asapClient({ token }),
            /not-allowed/
        );
    });

    it('sets session.jitsi_meet_context_features from token context', async () => {
        const token = mintAsapToken({
            context: {
                features: {
                    'screen-sharing': true,
                    'recording': false
                }
            }
        });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_features['screen-sharing'], true);
        assert.strictEqual(info.jitsi_meet_context_features.recording, false);
    });

    it('sets session.jitsi_meet_room from room claim', async () => {
        const token = mintAsapToken({ room: 'testroom' });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_room, 'testroom');
    });

    it('sets session.jitsi_meet_context_user from token context', async () => {
        const token = mintAsapToken({
            context: {
                user: { id: 'user-123',
                    name: 'Alice',
                    email: 'alice@example.com' }
            }
        });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_user.id, 'user-123');
        assert.strictEqual(info.jitsi_meet_context_user.name, 'Alice');
        assert.strictEqual(info.jitsi_meet_context_user.email, 'alice@example.com');
    });

    it('sets session.jitsi_meet_context_group from token context', async () => {
        const token = mintAsapToken({
            context: { group: 'test-group' }
        });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_group, 'test-group');
    });

    it('sets session.jitsi_meet_context_user.id from top-level user_id when context is absent', async () => {
        // eslint-disable-next-line camelcase
        const token = mintAsapToken({ user_id: 'legacy-user-456' });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_user.id, 'legacy-user-456');
    });

    it('allows connection without token when allow_empty_token is true', async () => {
        const c = await asapClient({});

        clients.push(c);
        assert.ok(c.jid, 'client should have a JID');
    });
});
