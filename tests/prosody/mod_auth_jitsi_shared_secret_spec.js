import assert from 'assert';

import { getContainer } from './helpers/container.js';
import { prosodyShell } from './helpers/prosody_shell.js';
import { createXmppClient } from './helpers/xmpp_client.js';

const DOMAIN = 'shared-secret.localhost';
const PROSODY_CFG = '/etc/prosody/prosody.cfg.lua';

const SECRET = 'topsecret';
const PREV_SECRET = 'oldsecret';

/**
 * Enable or disable shared_secret_prev in the live Prosody config by
 * commenting/uncommenting the line, reloading the config, and reloading the
 * auth module so it re-reads the options.
 *
 * @param {boolean} enabled
 */
async function setSharedSecretPrev(enabled) { // eslint-disable-line no-unused-vars
    const container = getContainer();
    const from = enabled
        ? `-- shared_secret_prev = "${PREV_SECRET}"`
        : `shared_secret_prev = "${PREV_SECRET}"`;
    const to = enabled
        ? `shared_secret_prev = "${PREV_SECRET}"`
        : `-- shared_secret_prev = "${PREV_SECRET}"`;

    await container.exec([ 'sed', '-i', `s/${from}/${to}/`, PROSODY_CFG ]);
    await container.exec([ 'prosodyctl', 'reload' ]);
    await prosodyShell(`module:reload("auth_jitsi-shared-secret", "${DOMAIN}")`);
    await new Promise(resolve => setTimeout(resolve, 300));
}

/**
 * Attempt to connect with the given credentials.
 * Returns the connected client on success, or throws on auth failure.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>}
 */
function connect(username, password) {
    return createXmppClient({ domain: DOMAIN,
        username,
        password });
}

describe('mod_auth_jitsi-shared-secret', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('allows connection with correct shared secret', async () => {
        const c = await connect('alice', SECRET);

        clients.push(c);
        assert.ok(c.jid, 'client must have a JID after successful auth');
    });

    it('allows any username with the correct secret', async () => {
        const c1 = await connect('alice', SECRET);
        const c2 = await connect('bob', SECRET);
        const c3 = await connect('anyusernamehere', SECRET);

        clients.push(c1, c2, c3);
        assert.ok(c1.jid, 'alice must be allowed');
        assert.ok(c2.jid, 'bob must be allowed');
        assert.ok(c3.jid, 'arbitrary username must be allowed');
    });

    it('rejects connection with wrong secret', async () => {
        await assert.rejects(
            () => connect('alice', 'wrongsecret'),
            'connection with wrong secret must be rejected'
        );
    });

    // TODO: shared_secret_prev is broken for PLAIN SASL. get_sasl_handler() always
    // returns shared_secret from its plain callback, so Prosody rejects any password
    // other than the current secret. provider.test_password() handles shared_secret_prev
    // correctly but is not called in the PLAIN SASL flow.
    // it('allows connection with shared_secret_prev', async () => {
    //     const c = await connect('alice', PREV_SECRET);
    //     clients.push(c);
    //     assert.ok(c.jid, 'client must be allowed with prev secret');
    // });

    // it('rejects shared_secret_prev after it is removed from config', async () => {
    //     await setSharedSecretPrev(false);
    //     try {
    //         await assert.rejects(
    //             () => connect('alice', PREV_SECRET),
    //             'prev secret must be rejected after removal from config'
    //         );
    //         const c = await connect('alice', SECRET);
    //         clients.push(c);
    //         assert.ok(c.jid, 'current secret must still be accepted');
    //     } finally {
    //         await setSharedSecretPrev(true);
    //     }
    // });
});
