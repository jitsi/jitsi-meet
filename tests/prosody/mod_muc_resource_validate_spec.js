import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { getContainer } from './helpers/container.js';
import { isAvailablePresence } from './helpers/xmpp_utils.js';

const MUC = 'conference.localhost';
const PROSODY_CFG = '/etc/prosody/prosody.cfg.lua';

let _roomCounter = 0;
const room = () => `validate-${++_roomCounter}@${MUC}`;

/**
 * Toggle anonymous_strict on mod_muc_resource_validate by editing the Prosody
 * config inside the container and reloading Prosody (SIGHUP via prosodyctl reload).
 * mod_muc_resource_validate re-reads config on the config-reloaded event.
 *
 * The config file must contain the line "anonymous_strict = false" as a stable
 * sed target (added to prosody.cfg.lua in the test Docker image).
 *
 * @param {boolean} enabled
 */
async function setStrictMode(enabled) {
    const container = getContainer();
    const from = enabled ? 'anonymous_strict = false' : 'anonymous_strict = true';
    const to = enabled ? 'anonymous_strict = true' : 'anonymous_strict = false';

    await container.exec([ 'sed', '-i', `s/${from}/${to}/`, PROSODY_CFG ]);
    await container.exec([ 'prosodyctl', 'reload' ]);
    // prosodyctl reload sends SIGHUP and returns immediately; give Prosody a moment
    // to process the config-reloaded event before the next test action.
    await new Promise(resolve => setTimeout(resolve, 500));
}

/**
 * Extract the first 8 characters of the JID username (the UUID prefix that
 * anonymous auth assigns). The JID looks like "<uuid>@localhost/resource".
 *
 * @param {string} jid  full JID string
 * @returns {string}
 */
function uuidPrefix(jid) {
    const username = jid.split('@')[0];

    return username.substring(0, 8);
}

describe('mod_muc_resource_validate', () => {

    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    // ── Basic pattern validation ──────────────────────────────────────────────

    it('allows a valid alphanumeric resource', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();
        const presence = await c.joinRoom(r, 'ValidNick123');

        assert.ok(isAvailablePresence(presence),
            'valid alphanumeric resource must be allowed');
    });

    it('allows a resource with underscore after the first character', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();
        const presence = await c.joinRoom(r, 'abc_123');

        assert.ok(isAvailablePresence(presence),
            'resource with internal underscore must be allowed');
    });

    it('rejects a resource starting with an underscore', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();
        const presence = await c.joinRoom(r, '_invalid');

        assert.equal(presence.attrs.type, 'error',
            'resource starting with underscore must be rejected');
        assert.ok(
            presence.getChild('error')?.getChild('not-allowed'),
            'error stanza must contain <not-allowed/>'
        );
    });

    it('rejects a resource containing a hyphen', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();
        const presence = await c.joinRoom(r, 'invalid-nick');

        assert.equal(presence.attrs.type, 'error',
            'resource with hyphen must be rejected');
        assert.ok(
            presence.getChild('error')?.getChild('not-allowed'),
            'error stanza must contain <not-allowed/>'
        );
    });

    // ── Anonymous strict mode ─────────────────────────────────────────────────

    it('strict mode: allows resource matching UUID prefix', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await setStrictMode(true);
        try {
            const c = await ctx.connect();

            // The JID is set after connect; use the first 8 chars of the username.
            const nick = uuidPrefix(c.jid);
            const presence = await c.joinRoom(r, nick);

            assert.ok(isAvailablePresence(presence),
                'resource matching UUID prefix must be allowed in strict mode');
        } finally {
            await setStrictMode(false);
        }
    });

    it('strict mode: rejects resource not matching UUID prefix', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await setStrictMode(true);
        try {
            const c = await ctx.connect();
            const presence = await c.joinRoom(r, 'wrongnick');

            assert.equal(presence.attrs.type, 'error',
                'resource not matching UUID prefix must be rejected in strict mode');
            assert.ok(
                presence.getChild('error')?.getChild('not-allowed'),
                'error stanza must contain <not-allowed/>'
            );
        } finally {
            await setStrictMode(false);
        }
    });

});
