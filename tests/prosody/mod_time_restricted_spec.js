import assert from 'assert';

import { prosodyShell } from './helpers/prosody_shell.js';
import { createTestContext } from './helpers/test_context.js';
import { getRoomState } from './helpers/test_observer.js';
import { createXmppClient } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';

// Mirrors docker/prosody.cfg.lua:
//   conference_max_minutes  = 0.125 -> TIMEOUT = 7.5 s (the meeting's limit)
//   conference_grace_seconds = 3    -> room destroyed at 10.5 s
const DURATION_SECONDS = 7.5;
const GRACE_SECONDS = 3;

// A moment safely inside the grace window: past the limit, well before the
// destroy. Used to prove the room outlives its limit by the granted time.
const IN_GRACE_MS = (DURATION_SECONDS + 0.75) * 1000;

// Wait windows with a little slack over the server-side timers. The timing
// info is pushed on join, so it should land almost immediately.
const NOTIFY_WAIT_MS = 5000;
const DESTROY_WAIT_MS = (DURATION_SECONDS + GRACE_SECONDS + 5) * 1000;

// How long to let the meeting run before the late joiner arrives, so its
// `elapsedSeconds` is provably non-zero without risking the 7.5 s destroy.
const LATE_JOIN_DELAY_MS = 3000;

let _roomCounter = 0;
const room = () => `time-restricted-${++_roomCounter}@${CONFERENCE}`;

/**
 * Predicate: true for the `time_restricted` json-message the module broadcasts.
 *
 * @param {object} stanza - A received <message> stanza.
 * @returns {boolean}
 */
function isTimeRestrictedMessage(stanza) {
    const jsonMsg = stanza.getChild('json-message', JITMEET_NS);

    if (!jsonMsg) {
        return false;
    }
    try {
        return JSON.parse(jsonMsg.getText())?.type === 'time_restricted';
    } catch {
        return false;
    }
}

/**
 * Parses the json-message payload of a time_restricted message stanza.
 *
 * @param {object} stanza - A received <message> stanza.
 * @returns {object}
 */
function payloadOf(stanza) {
    return JSON.parse(stanza.getChild('json-message', JITMEET_NS).getText());
}

describe('mod_time_restricted', () => {

    let ctx;

    // Loaded on demand (not in modules_enabled) so it only governs the rooms in
    // this spec and never tears down rooms created by other specs.
    before(() => prosodyShell(`module:load("time_restricted", "${CONFERENCE}")`));

    after(() => prosodyShell(`module:unload("time_restricted", "${CONFERENCE}")`).catch(() => { /* best effort */ }));

    beforeEach(() => {
        ctx = createTestContext();
    });

    afterEach(() => ctx.cleanup());

    it('sends a time_restricted json-message to an occupant as soon as they join', async () => {
        const r = room();
        const focus = await ctx.connectFocus(r);
        const c = await ctx.connect();

        await c.joinRoom(r);

        const msg = await c.waitForMessage(isTimeRestrictedMessage, NOTIFY_WAIT_MS);

        // Sent from the bare room JID — that is what makes lib-jitsi-meet surface
        // it as a NON_PARTICIPANT_MESSAGE_RECEIVED rather than an endpoint message.
        assert.equal(msg.attrs.from, r, 'message must originate from the room JID');

        const payload = payloadOf(msg);

        assert.equal(payload.type, 'time_restricted');
        assert.equal(payload.durationSeconds, DURATION_SECONDS,
            'durationSeconds must be the full configured limit');
        assert.ok(
            payload.elapsedSeconds <= 2,
            `a first joiner should be told the meeting just started, got ${payload.elapsedSeconds}`
        );

        // focus is referenced for cleanup tracking only.
        assert.ok(focus);
    });

    it('tells a late joiner how far into the meeting it already is', async () => {
        const r = room();

        await ctx.connectFocus(r);

        const early = await ctx.connect();

        await early.joinRoom(r);
        await early.waitForMessage(isTimeRestrictedMessage, NOTIFY_WAIT_MS);

        // Let the meeting run a little so the late joiner's elapsed is provably
        // ahead of the first joiner's.
        await new Promise(resolve => setTimeout(resolve, LATE_JOIN_DELAY_MS));

        const late = await ctx.connect();

        await late.joinRoom(r);

        const msg = await late.waitForMessage(isTimeRestrictedMessage, NOTIFY_WAIT_MS);
        const payload = payloadOf(msg);

        assert.equal(payload.type, 'time_restricted');
        assert.equal(payload.durationSeconds, DURATION_SECONDS);
        assert.ok(
            payload.elapsedSeconds >= LATE_JOIN_DELAY_MS / 1000,
            `late joiner elapsedSeconds must reflect the time already spent, got ${payload.elapsedSeconds}`
        );
    });

    it('destroys the room with a friendly time-limit reason and blocks re-creation', async () => {
        const r = room();

        // The room is created by the focus joining it — that is when the
        // module stamps it and arms the destroy timer, so time everything
        // from here.
        await ctx.connectFocus(r);
        const createdAt = Date.now();

        const c = await ctx.connect();

        await c.joinRoom(r);

        assert.ok(await getRoomState(r), 'room must exist before the limit is reached');

        // The limit passes, but conference_grace_seconds keeps the room alive a
        // while longer so people can wrap up rather than being cut off.
        await new Promise(resolve => setTimeout(resolve, Math.max(0, createdAt + IN_GRACE_MS - Date.now())));
        assert.ok(await getRoomState(r), 'room must outlive its limit for the grace period');

        // Once the grace elapses the room is destroyed; occupants get an unavailable presence.
        const presence = await c.waitForPresence(p => p.attrs.type === 'unavailable', DESTROY_WAIT_MS);
        const destroy = presence
            .getChild('x', 'http://jabber.org/protocol/muc#user')
            ?.getChild('destroy');

        assert.ok(destroy, 'unavailable presence must carry a <destroy> element');
        assert.match(
            destroy.getChildText('reason') || '',
            /time limit/i,
            'destroy reason should explain the time limit'
        );

        assert.equal(await getRoomState(r), null, 'room must be gone after the limit is reached');

        // The room name is remembered as restricted, so re-creating it is refused.
        // Use a fresh client: the original occupants still hold the destroy
        // (kick) presence in their queue, which would mask the rejection.
        const probe = await createXmppClient({ domain: 'auth.localhost',
            username: 'focus',
            password: 'focussecret' });

        try {
            const rejoin = await probe.joinRoom(r, 'focus', { timeout: 5000 });

            assert.equal(rejoin.attrs.type, 'error', 're-creating a terminated room must be rejected');
            assert.ok(
                rejoin.getChild('error')?.getChild('resource-constraint'),
                'rejection must be a resource-constraint error'
            );
        } finally {
            await probe.disconnect();
        }

        assert.equal(await getRoomState(r), null, 'the room must not be re-created');
    });

    // The client only trusts a `time_restricted` message because it arrives from
    // the bare room JID: lib-jitsi-meet derives the endpoint id from the stanza's
    // resource, and jitsi-meet's time-timer middleware ignores the message unless
    // that id is null. These cases prove an occupant cannot manufacture such a
    // stanza, so the guard has something real to stand on.
    describe('spoofing by an occupant', () => {
        const FORGED = {
            type: 'time_restricted',
            durationSeconds: 60,
            elapsedSeconds: 0
        };

        // Delivery is immediate, so a short window is enough to conclude a
        // stanza is never coming — and it keeps these cases comfortably inside
        // the room's 10.5 s destroy.
        const SPOOF_WAIT_MS = 2500;

        /**
         * Sets up a room with a victim and an attacker, both past their join-time
         * `time_restricted` message so only later ones remain in the queue.
         *
         * @returns {Promise<object>} the room JID plus both clients.
         */
        async function twoOccupants() {
            const r = room();

            await ctx.connectFocus(r);

            const victim = await ctx.connect();
            const attacker = await ctx.connect();

            // Default nicks only — anonymous_strict requires the MUC resource to
            // match the JID local part, so an explicit nick would be refused.
            await victim.joinRoom(r);
            await victim.waitForMessage(isTimeRestrictedMessage, NOTIFY_WAIT_MS);

            await attacker.joinRoom(r);
            await attacker.waitForMessage(isTimeRestrictedMessage, NOTIFY_WAIT_MS);

            return { r,
                victim,
                attacker };
        }

        it('stamps an occupant nick on a json-message sent to the room', async () => {
            const { r, victim, attacker } = await twoOccupants();

            await attacker.sendJsonGroupchat(r, FORGED);

            // The message is delivered — nothing blocks a participant from
            // saying whatever they like — but the MUC rewrites `from` to the
            // sender's occupant JID. That resource is what makes the endpoint
            // id non-null on the receiving client, and non-null is rejected.
            const seen = await victim.waitForMessage(isTimeRestrictedMessage, SPOOF_WAIT_MS);

            assert.equal(seen.attrs.from, `${r}/${attacker.nick}`,
                'the room must attribute the message to the occupant that sent it');
        });

        it('never delivers a groupchat json-message under a forged room from', async () => {
            const { r, victim, attacker } = await twoOccupants();

            await attacker.sendJsonMessageRaw(r, FORGED, { from: r,
                type: 'groupchat' });

            // The claimed `from` is discarded: the stanza still reaches the room,
            // stamped with the attacker's occupant JID like any other. A client
            // cannot assert an identity, only the server can.
            const seen = await victim.waitForMessage(isTimeRestrictedMessage, SPOOF_WAIT_MS);

            assert.equal(seen.attrs.from, `${r}/${attacker.nick}`,
                'a participant must not be able to speak as the room');
            assert.notEqual(seen.attrs.from, r);
        });

        it('never delivers a private json-message under a forged room from', async () => {
            const { r, victim, attacker } = await twoOccupants();

            // Addressed straight at the victim's occupant JID rather than the
            // room, which is the other way a genuine server message reaches a
            // single client (mod_time_restricted sends exactly this shape).
            await attacker.sendJsonMessageRaw(`${r}/${victim.nick}`, FORGED, { from: r,
                type: 'chat' });

            const seen = await victim.waitForMessage(isTimeRestrictedMessage, SPOOF_WAIT_MS);

            assert.equal(seen.attrs.from, `${r}/${attacker.nick}`,
                'a participant must not be able to private-message as the room');
            assert.notEqual(seen.attrs.from, r);
        });
    });
});
