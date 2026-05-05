import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';
import { isAvailablePresence } from './helpers/xmpp_utils.js';

// ─── Constants ───────────────────────────────────────────────────────────────

// All token_verification tests run on the main MUC component.
// token_verification_require_token_for_moderation = true is set on
// conference.localhost in the test config; focus@auth.localhost is a Prosody
// admin and is therefore always exempt from both the join check and the
// moderation IQ check, mirroring production.
const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const nextRoom = () => `token-verify-${++_roomCounter}@${CONFERENCE}`;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('mod_token_verification', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // ── Join access control ──────────────────────────────────────────────────
    //
    // token_verification is loaded on conference.localhost.  The parent
    // VirtualHost (localhost) has allow_empty_token = true, so anonymous users
    // are always let through (verify_room returns true when auth_token is nil).
    //
    // focus@auth.localhost is a Prosody admin and is therefore exempt from
    // the token check on both muc-room-pre-create and muc-occupant-pre-join.

    describe('join access control', () => {

        /**
         * Creates a room with a focus participant for testing.
         *
         * @returns {Promise<string>} Room JID.
         */
        async function setupRoom() {
            const room = nextRoom();
            const focus = await joinWithFocus(room);

            clients.push(focus);

            return room;
        }

        it('allows anonymous join when allow_empty_token = true', async () => {
            const room = await setupRoom();
            const c = await createXmppClient();

            clients.push(c);

            const presence = await c.joinRoom(room);

            assert.ok(isAvailablePresence(presence),
                'tokenless user must be allowed when allow_empty_token = true');
        });

        it('rejects connection when token is missing the sub claim', async () => {
            // sub: undefined overrides the mintAsapToken default of sub: '*', producing
            // a token with no sub field.  process_and_verify_token rejects such tokens,
            // causing a SASL failure before the client finishes connecting.
            const token = mintAsapToken({ sub: undefined });

            await assert.rejects(
                createXmppClient({ params: { token } }),
                'connection must be rejected when the sub claim is absent'
            );
        });

        it('allows join with token that has no room claim', async () => {
            const room = await setupRoom();

            // No 'room' field in payload → session.jitsi_meet_room = nil → passes.
            const token = mintAsapToken();
            const c = await createXmppClient({ params: { token } });

            clients.push(c);

            const presence = await c.joinRoom(room);

            assert.ok(isAvailablePresence(presence),
                'token without a room claim must be allowed (treated as anonymous)');
        });

        it('allows join with token whose room claim matches the room', async () => {
            const room = await setupRoom();
            const roomName = room.split('@')[0]; // e.g. "token-verify-3"
            const token = mintAsapToken({ room: roomName });
            const c = await createXmppClient({ params: { token } });

            clients.push(c);

            const presence = await c.joinRoom(room);

            assert.ok(isAvailablePresence(presence),
                'token with matching room claim must be allowed');
        });

        it('blocks join when token room claim does not match the room', async () => {
            const room = await setupRoom();

            // Token claims access to 'other-room', but we try to join a different room.
            const token = mintAsapToken({ room: 'other-room' });
            const c = await createXmppClient({ params: { token } });

            clients.push(c);

            const presence = await c.joinRoom(room);

            assert.strictEqual(presence.attrs.type, 'error',
                'mismatched room claim must be rejected');
            assert.ok(
                presence.getChild('error')?.getChild('not-allowed'),
                'expected <not-allowed/> error condition');
        });

        it('allows join with wildcard (*) room claim', async () => {
            const room = await setupRoom();
            const token = mintAsapToken({ room: '*' });
            const c = await createXmppClient({ params: { token } });

            clients.push(c);

            const presence = await c.joinRoom(room);

            assert.ok(isAvailablePresence(presence),
                'wildcard room claim must be allowed in any room');
        });
    });

    // ── token_verification_require_token_for_moderation ──────────────────────
    //
    // conference.localhost has require_token_for_moderation = true.
    // Unauthenticated users (no token) are blocked from sending muc#owner IQs,
    // which is how moderator status is granted to other participants and how
    // room configuration (e.g. passwords) is changed.  Authenticated users
    // whose token room claim matches are allowed through.
    //
    // focus@auth.localhost is a Prosody admin and is always exempt from the
    // check, so it can create rooms and set their initial configuration.

    describe('token_verification_require_token_for_moderation', () => {

        /**
         * Creates a room with a focus participant for testing.
         *
         * @returns {Promise<string>} Room JID.
         */
        async function setupRoom() {
            const room = nextRoom();
            const focus = await joinWithFocus(room);

            clients.push(focus);

            return room;
        }

        it('blocks unauthenticated user from sending owner config IQ', async () => {
            const room = await setupRoom();

            // Anonymous guest joins (allow_empty_token = true on localhost).
            const guest = await createXmppClient();

            clients.push(guest);
            await guest.joinRoom(room);

            // Guest attempts to change room config (muc#owner IQ).
            const iq = await guest.setRoomPassword(room, 'hacked');

            assert.strictEqual(iq.attrs.type, 'error',
                'unauthenticated user must be blocked from changing room config');
            assert.ok(
                iq.getChild('error')?.getChild('not-allowed'),
                'expected <not-allowed/> error condition from require_token_for_moderation');
        });

        it('does not block authenticated user from sending owner config IQ', async () => {
            const room = await setupRoom();
            const roomName = room.split('@')[0];
            const token = mintAsapToken({ room: roomName });
            const authUser = await createXmppClient({ params: { token } });

            clients.push(authUser);
            await authUser.joinRoom(room);

            // Authenticated user sends an muc#owner IQ.  require_token_for_moderation
            // must NOT block it (though Prosody may still deny with 'forbidden' if the
            // user is not the room owner — that is a different check).
            const iq = await authUser.setRoomPassword(room, 'secret');

            // The error must not be 'not-allowed' from require_token_for_moderation.
            const error = iq.getChild('error');

            assert.ok(
                !error?.getChild('not-allowed'),
                'require_token_for_moderation must not block authenticated user');
        });
    });
});
