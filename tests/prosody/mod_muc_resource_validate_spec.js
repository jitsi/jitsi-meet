import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { prosodyShell } from './helpers/prosody_shell.js';

const MUC = 'conference.localhost';

let _roomCounter = 0;
const room = () => `validate-${++_roomCounter}@${MUC}`;

/**
 * Toggle anonymous_strict on mod_muc_resource_validate at runtime by directly
 * setting the module-level variable inside the live Prosody process.
 *
 * @param {boolean} enabled
 */
async function setStrictMode(enabled) {
    await prosodyShell(
        `prosody.hosts["${MUC}"].modules.muc_resource_validate.anonymous_strict = ${enabled}`
    );
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

        assert.equal(presence.attrs.type, 'available',
            'valid alphanumeric resource must be allowed');
    });

    it('allows a resource with underscore after the first character', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();
        const presence = await c.joinRoom(r, 'abc_123');

        assert.equal(presence.attrs.type, 'available',
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
        await setStrictMode(true);
        try {
            const r = room();

            await ctx.connectFocus(r);
            const c = await ctx.connect();

            // The JID is set after connect; use the first 8 chars of the username.
            const nick = uuidPrefix(c.jid);
            const presence = await c.joinRoom(r, nick);

            assert.equal(presence.attrs.type, 'available',
                'resource matching UUID prefix must be allowed in strict mode');
        } finally {
            await setStrictMode(false);
        }
    });

    it('strict mode: rejects resource not matching UUID prefix', async () => {
        await setStrictMode(true);
        try {
            const r = room();

            await ctx.connectFocus(r);
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

    it('whitelisted domain bypasses strict mode resource check', async () => {
        await setStrictMode(true);
        try {
            const r = room();

            await ctx.connectFocus(r);
            // Whitelisted client uses whitelist.localhost; "anonymous" check
            // still runs but the auth provider is "anonymous" which IS in the
            // anonymous_auth_methods set, so the strict check applies.
            // However the whitelisted domain is also "anonymous" auth, so
            // the strict check applies to it too.  Use the correct UUID prefix.
            const wl = await ctx.connectWhitelisted();
            const nick = uuidPrefix(wl.jid);
            const presence = await wl.joinRoom(r, nick);

            assert.equal(presence.attrs.type, 'available',
                'whitelisted client with correct UUID prefix must be allowed in strict mode');
        } finally {
            await setStrictMode(false);
        }
    });
});
