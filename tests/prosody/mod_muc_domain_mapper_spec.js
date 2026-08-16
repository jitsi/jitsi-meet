import assert from 'assert';

import { createTestContext } from './helpers/test_context.js';
import { isAvailablePresence } from './helpers/xmpp_utils.js';

// mod_muc_domain_mapper rewrites JIDs between:
//   external: room@conference.subdomain.localhost  (what clients send/receive)
//   internal: [subdomain]room@conference.localhost (what Prosody routes)
//
// Both focus and regular clients use the external subdomain JID. The mapper
// rewrites 'to' on the way in (before routing) and 'from' on the way out
// (before the client sees it), so the subdomain format is transparent.

const CONFERENCE_SUB = 'conference.subdomain.localhost';
const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const subRoom = () => `mapper-${++_roomCounter}@${CONFERENCE_SUB}`;
const baseRoom = () => `mapper-base-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_domain_mapper', () => {

    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    // -------------------------------------------------------------------------
    // Subdomain room join
    // -------------------------------------------------------------------------
    describe('subdomain room join', () => {

        it('focus can join a subdomain room', async () => {
            // connectFocus throws on timeout if the join fails.
            await ctx.connectFocus(subRoom());
        });

        it('regular user receives available self-presence with subdomain from-JID', async () => {
            const r = subRoom();

            await ctx.connectFocus(r);
            const c = await ctx.connect();
            const presence = await c.joinRoom(r);

            assert.ok(isAvailablePresence(presence),
                'join must succeed');
            assert.ok(
                presence.attrs.from?.startsWith(`${r}/`),
                `from must use the subdomain JID (got ${presence.attrs.from})`
            );
        });

        it('non-subdomain room still works after mapper is loaded', async () => {
            const r = baseRoom();

            await ctx.connectFocus(r);
            const c = await ctx.connect();
            const presence = await c.joinRoom(r);

            assert.ok(isAvailablePresence(presence),
                'plain conference.localhost join must still succeed');
        });

    });

    // -------------------------------------------------------------------------
    // Presence exchange between occupants
    // -------------------------------------------------------------------------
    describe('occupant presence exchange', () => {

        it('two clients in the same subdomain room receive each other\'s presence', async () => {
            const r = subRoom();

            await ctx.connectFocus(r);

            const c1 = await ctx.connect();
            const c2 = await ctx.connect();

            await c1.joinRoom(r);
            await c2.joinRoom(r);

            // c1 must receive c2's join presence with the subdomain from-JID
            const p = await c1.waitForPresenceFrom(`${r}/${c2.nick}`);

            assert.ok(isAvailablePresence(p),
                'c1 must see c2 as available');
            assert.equal(p.attrs.from, `${r}/${c2.nick}`,
                'from must be the subdomain JID of c2');
        });

        it('two clients in different subdomain rooms do not see each other', async () => {
            const r1 = subRoom();
            const r2 = subRoom();

            await ctx.connectFocus(r1);
            await ctx.connectFocus(r2);

            const c1 = await ctx.connect();
            const c2 = await ctx.connect();

            await c1.joinRoom(r1);
            await c2.joinRoom(r2);

            await assert.rejects(
                () => c1.waitForPresenceFrom(`${r1}/${c2.nick}`, { timeout: 1000 }),
                /Timeout/,
                'c1 must not see c2 who joined a different room'
            );
        });

    });

    // -------------------------------------------------------------------------
    // IQ routing through subdomain
    // -------------------------------------------------------------------------
    describe('IQ routing', () => {

        it('disco#info to a subdomain room JID returns a result', async () => {
            const r = subRoom();

            await ctx.connectFocus(r);
            const c = await ctx.connect();

            await c.joinRoom(r);

            const iq = await c.sendDiscoInfo(r);

            assert.equal(iq.attrs.type, 'result',
                'disco#info to subdomain room must return a result IQ');
        });

    });

});
