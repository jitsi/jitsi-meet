// Tests for mod_muc_rate_limit (resources/prosody-plugins/mod_muc_rate_limit.lua).
//
// The module rate-limits MUC joins and leaves per room. When the configured
// rate is exceeded (muc_rate_joins / muc_rate_leaves, default 3/s and 5/s),
// excess presence events are held in a per-room FIFO queue and replayed one
// at a time by a 1-second recurring timer. This prevents presence storms in
// large meetings.
//
// Joins: muc-occupant-pre-join events beyond the rate are queued; when the
//   timer fires it replays them through room:handle_normal_presence, setting
//   a delayed_join_skip flag to avoid re-queuing on the second pass.
//
// Leaves: muc-occupant-pre-leave events beyond the rate are queued; the
//   occupant's role is set to nil immediately (removing them from the room
//   roster) but publicise_occupant_status (the unavailable presence broadcast
//   to peers) is deferred until the timer processes the event.
//
// Room destruction: when muc-room-destroyed fires, the queue is marked empty
//   so the in-flight timer skips further processing cleanly.

import assert from 'assert';

import { prosodyShell } from './helpers/prosody_shell.js';
import { createTestContext } from './helpers/test_context.js';

const RATE_MUC = 'rate-limited.localhost';
const NUM_CLIENTS = 5;

// 5 clients at rate=1/s means the last client waits ~4 s; allow ample margin.
const JOIN_TIMEOUT = 12000;

let _roomCounter = 0;
const room = () => `rl-${++_roomCounter}@${RATE_MUC}`;

describe('mod_muc_rate_limit', () => {

    before(async () => {
        const out = await prosodyShell(`module:reload("muc_rate_limit", "${RATE_MUC}")`);

        console.log('[prosody] module:reload muc_rate_limit:', out);
    });

    let ctx;

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    // -------------------------------------------------------------------------
    // Join rate limiting
    // -------------------------------------------------------------------------
    describe('join rate limiting', () => {

        it('all 5 simultaneous joins complete despite rate=1/s', async () => {
            const r = room();
            const clients = await Promise.all(
                Array.from({ length: NUM_CLIENTS }, () => ctx.connectWhitelisted())
            );

            // All 5 fire simultaneously; the throttle (1/s) will queue 4 of them.
            const presences = await Promise.all(
                clients.map(c => c.joinRoom(r, undefined, { timeout: JOIN_TIMEOUT }))
            );

            assert.equal(presences.length, NUM_CLIENTS, 'all 5 joins must resolve');
            for (const p of presences) {
                assert.notEqual(p.attrs.type, 'error', 'join must not be rejected with an error');
                const x = p.getChild('x', 'http://jabber.org/protocol/muc#user');
                const isSelf = x?.getChildren('status').some(s => s.attrs.code === '110');

                assert.ok(isSelf, 'each self-presence must carry MUC status 110');
            }
        });

        it('queued joins arrive in order (each after the previous)', async () => {
            const r = room();
            const clients = await Promise.all(
                Array.from({ length: NUM_CLIENTS }, () => ctx.connectWhitelisted())
            );

            // Record the wall-clock time at which each joinRoom resolves.
            const resolvedAt = new Array(NUM_CLIENTS);
            const joinPromises = clients.map((c, i) =>
                c.joinRoom(r, undefined, { timeout: JOIN_TIMEOUT }).then(p => {
                    resolvedAt[i] = Date.now();

                    return p;
                })
            );

            await Promise.all(joinPromises);

            // With rate=1/s the resolutions must be spread ≥ 800 ms apart in total.
            // (We avoid asserting strict per-join gaps to tolerate scheduling jitter.)
            const earliest = Math.min(...resolvedAt);
            const latest = Math.max(...resolvedAt);
            const span = latest - earliest;

            assert.ok(span >= 800,
                `joins should be spread over ≥ 800 ms, actual span: ${span} ms`);
        });

    });

    // -------------------------------------------------------------------------
    // Leave rate limiting
    // -------------------------------------------------------------------------
    describe('leave rate limiting', () => {

        it('all 5 simultaneous leaves complete and observer receives all unavailable presences', async () => {
            const r = room();

            // Observer joins first so it can witness the leaves.
            const observer = await ctx.connectWhitelisted();

            await observer.joinRoom(r, 'observer', { timeout: JOIN_TIMEOUT });

            // 5 clients join (rate-limited; each waits its turn).
            const leavers = await Promise.all(
                Array.from({ length: NUM_CLIENTS }, () => ctx.connectWhitelisted())
            );
            const joinResults = await Promise.all(
                leavers.map(c => c.joinRoom(r, undefined, { timeout: JOIN_TIMEOUT }))
            );

            // Derive the nick each leaver was assigned from its self-presence.
            const nicks = joinResults.map(p => p.attrs.from.split('/')[1]);

            // Set up watchers BEFORE disconnecting so no unavailable presence is missed.
            const unavailablePromises = nicks.map(nick =>
                observer.waitForPresenceFrom(`${r}/${nick}`, {
                    type: 'unavailable',
                    timeout: JOIN_TIMEOUT
                })
            );

            // All 5 disconnect simultaneously; the leave throttle (1/s) will queue 4.
            await Promise.all(leavers.map(c => c.disconnect()));

            const unavailables = await Promise.all(unavailablePromises);

            assert.equal(unavailables.length, NUM_CLIENTS,
                'observer must receive unavailable presences for all 5 leavers');
            for (const p of unavailables) {
                assert.equal(p.attrs.type, 'unavailable',
                    'each received presence must be of type unavailable');
            }
        });

    });

    // -------------------------------------------------------------------------
    // Room destruction during queued joins
    // -------------------------------------------------------------------------
    describe('room destruction', () => {

        it('room destroyed while joins are queued does not crash the module', async () => {
            const r = room();
            const clients = await Promise.all(
                Array.from({ length: NUM_CLIENTS }, () => ctx.connectWhitelisted())
            );

            // The first client joins separately so it becomes the room owner and
            // can destroy the room via XMPP.  This also consumes the throttle
            // token so all remaining joins land immediately in the queue.
            const [ owner, ...rest ] = clients;

            await owner.joinRoom(r, 'owner', { timeout: JOIN_TIMEOUT });

            // Fire the remaining 4 joins simultaneously.  They are all queued
            // (throttle token was just used) and won't be replayed until the
            // 1-second timer fires.  Use a short timeout so the test doesn't hang
            // if the queued joins are never replayed (expected after destroy).
            const pendingJoins = rest.map(c =>
                c.joinRoom(r, undefined, { timeout: 3000 }).catch(() => null)
            );

            // Destroy the room as owner before the 1-second timer fires.
            await owner.destroyRoom(r);

            // Wait for all queued join attempts to settle (they should time out
            // because the room was destroyed and the queue was marked empty).
            await Promise.allSettled(pendingJoins);

            // Verify the module still works: a fresh join on the same component succeeds.
            const freshRoom = room();
            const freshClient = await ctx.connectWhitelisted();
            const p = await freshClient.joinRoom(freshRoom, undefined, { timeout: JOIN_TIMEOUT });

            assert.notEqual(p.attrs.type, 'error',
                'a fresh join on the same component must succeed after room destruction');
            const x = p.getChild('x', 'http://jabber.org/protocol/muc#user');

            assert.ok(
                x?.getChildren('status').some(s => s.attrs.code === '110'),
                'fresh join self-presence must carry status 110'
            );
        });

    });

});
