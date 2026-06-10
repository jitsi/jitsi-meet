import assert from 'assert';

import { prosodyShell } from './helpers/prosody_shell.js';
import { createTestContext } from './helpers/test_context.js';
import { getRoomState } from './helpers/test_observer.js';
import { createXmppClient } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';

// Mirrors conference_max_minutes = 0.125 in docker/prosody.cfg.lua:
//   TIMEOUT   = 0.125 * 60      = 7.5 s  (room destroyed)
//   NOTIFY_AT = floor(7.5 / 2)  = 3 s    (half-way countdown broadcast)
const DURATION_SECONDS = 7.5;
const NOTIFY_AT_SECONDS = 3;

// Wait windows with a little slack over the server-side timers.
const NOTIFY_WAIT_MS = (NOTIFY_AT_SECONDS + 5) * 1000;
const DESTROY_WAIT_MS = (DURATION_SECONDS + 5) * 1000;

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

    it('broadcasts a time_restricted json-message to occupants at the half-way point', async () => {
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
            payload.elapsedSeconds >= 2 && payload.elapsedSeconds <= 6,
            `elapsedSeconds should be ~half the limit, got ${payload.elapsedSeconds}`
        );

        // focus is referenced for cleanup tracking only.
        assert.ok(focus);
    });

    it('sends the countdown to a participant who joins after the half-way point', async () => {
        const r = room();

        await ctx.connectFocus(r);

        const early = await ctx.connect();

        await early.joinRoom(r);

        // Wait for the broadcast so we know the meeting is now past its half-way point.
        await early.waitForMessage(isTimeRestrictedMessage, NOTIFY_WAIT_MS);

        // A participant joining afterwards must still be told about the running
        // countdown (the broadcast already fired before they were present).
        const late = await ctx.connect();

        await late.joinRoom(r);

        const msg = await late.waitForMessage(isTimeRestrictedMessage, 5000);
        const payload = payloadOf(msg);

        assert.equal(payload.type, 'time_restricted');
        assert.equal(payload.durationSeconds, DURATION_SECONDS);
        assert.ok(
            payload.elapsedSeconds >= NOTIFY_AT_SECONDS,
            `late joiner elapsedSeconds must be at/after the half-way mark, got ${payload.elapsedSeconds}`
        );
    });

    it('destroys the room with a friendly time-limit reason and blocks re-creation', async () => {
        const r = room();

        await ctx.connectFocus(r);

        const c = await ctx.connect();

        await c.joinRoom(r);

        assert.ok(await getRoomState(r), 'room must exist before the limit is reached');

        // At the limit the room is destroyed; occupants get an unavailable presence.
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
});
