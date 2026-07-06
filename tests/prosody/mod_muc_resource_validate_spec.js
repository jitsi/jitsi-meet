import assert from 'assert';

import { getContainer } from './helpers/container.js';
import { createTestContext } from './helpers/test_context.js';
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
 * The default in the test config is anonymous_strict = true. Call
 * setStrictMode(false) to temporarily disable strict checking, then restore
 * with setStrictMode(true) in a finally block.
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

describe('mod_muc_resource_validate', () => {

    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    // ── Basic pattern validation ──────────────────────────────────────────────
    //
    // These tests verify the resource format rules independently of the
    // anonymous_strict UUID-prefix constraint, so they temporarily disable
    // strict mode to allow arbitrary (but format-valid) nicks.

    it('allows a valid alphanumeric resource', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await setStrictMode(false);
        try {
            const c = await ctx.connect();
            const presence = await c.joinRoom(r, 'ValidNick123');

            assert.ok(isAvailablePresence(presence),
                'valid alphanumeric resource must be allowed');
        } finally {
            await setStrictMode(true);
        }
    });

    it('allows a resource with underscore after the first character', async () => {
        const r = room();

        await ctx.connectFocus(r);
        await setStrictMode(false);
        try {
            const c = await ctx.connect();
            const presence = await c.joinRoom(r, 'abc_123');

            assert.ok(isAvailablePresence(presence),
                'resource with internal underscore must be allowed');
        } finally {
            await setStrictMode(true);
        }
    });

    // Format-invalid resources are rejected by the format check before the
    // UUID-prefix check runs, so these tests work regardless of strict mode.

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
    //
    // anonymous_strict = true is the default in the test config, so no toggle
    // is needed here.

    it('allows resource matching UUID prefix', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();

        // joinRoom defaults to the UUID prefix when no nick is supplied.
        const presence = await c.joinRoom(r);

        assert.ok(isAvailablePresence(presence),
            'resource matching UUID prefix must be allowed');
    });

    it('rejects resource not matching UUID prefix', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();
        const presence = await c.joinRoom(r, 'wrongnick');

        assert.equal(presence.attrs.type, 'error',
            'resource not matching UUID prefix must be rejected');
        assert.ok(
            presence.getChild('error')?.getChild('not-allowed'),
            'error stanza must contain <not-allowed/>'
        );
    });

    // ── Nick (resource) changes ───────────────────────────────────────────────
    //
    // The MUC resource is the stable per-session identity and must not change
    // after join. Display-name changes travel in the presence <nick/> child and
    // keep the same resource, so they must still be allowed.

    it('rejects a nick change to a different resource', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();

        const joined = await c.joinRoom(r);

        assert.ok(isAvailablePresence(joined), 'initial join must succeed');

        // Send a presence to a different MUC resource, i.e. a nick change.
        await c.sendPresence(`${r}/rotatednick`);

        const presence = await c.waitForPresenceFrom(`${r}/rotatednick`, { type: 'error' });

        assert.equal(presence.attrs.type, 'error', 'nick change must be rejected');
        assert.ok(
            presence.getChild('error')?.getChild('not-allowed'),
            'error stanza must contain <not-allowed/>'
        );
    });

    it('allows a presence update that keeps the same resource', async () => {
        const r = room();

        await ctx.connectFocus(r);
        const c = await ctx.connect();

        const joined = await c.joinRoom(r);

        assert.ok(isAvailablePresence(joined), 'initial join must succeed');

        // A presence update to the same MUC resource (e.g. a display-name change)
        // is not a nick change and must be allowed through.
        await c.sendPresence(`${r}/${c.nick}`);

        const presence = await c.waitForPresenceFrom(`${r}/${c.nick}`);

        assert.notEqual(presence.attrs.type, 'error',
            'presence update keeping the same resource must be allowed');
    });

});
