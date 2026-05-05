import assert from 'assert';

import { createXmppClient } from './helpers/xmpp_client.js';

describe('mod_auth_jitsi-anonymous', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    /**
     * Creates and connects an XMPP client.
     *
     * @param {object} opts - Options passed to createXmppClient.
     * @returns {Promise<object>}
     */
    async function connect(opts = {}) {
        const c = await createXmppClient({ domain: 'jitsi-anonymous.localhost',
            ...opts });

        clients.push(c);

        return c;
    }

    it('assigns a UUID-based JID on anonymous connect', async () => {
        const c = await connect();

        assert.ok(c.jid, 'client must have a JID after connect');

        const username = c.jid.split('@')[0];

        // Prosody anonymous auth assigns a UUID (32 hex chars + 4 dashes = 36 chars).
        assert.match(username,
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            `JID username must be a UUID, got: ${username}`);
    });

    it('assigns a different JID to each client', async () => {
        const c1 = await connect();
        const c2 = await connect();

        assert.notEqual(c1.jid.split('@')[0], c2.jid.split('@')[0],
            'each anonymous client must get a unique username');
    });

    it('resumes session with same username when previd matches SM token', async () => {
        const c1 = await connect();
        const username = c1.jid.split('@')[0];

        // Capture the SM resumption token before disconnecting — it is cleared on offline.
        const smId = c1.smId;

        assert.ok(smId, 'stream management id must be set after connect');

        // Drop the connection abruptly (no stream close) so Prosody puts the
        // session into smacks hibernation — it stays in full_sessions where
        // mod_auth_jitsi-anonymous can find it by resumption_token.
        c1.dropConnection();

        // Reconnect with previd — mod_auth_jitsi-anonymous should reuse the username.
        const c2 = await connect({ params: { previd: smId } });

        assert.equal(c2.jid.split('@')[0], username,
            'reconnecting with previd must yield the same username');
    });

    it('assigns a new username when previd does not match any session', async () => {
        const c = await connect({ params: { previd: 'nonexistent-token' } });

        const username = c.jid.split('@')[0];

        assert.match(username,
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
            'unmatched previd must fall back to a fresh UUID username');
    });
});
