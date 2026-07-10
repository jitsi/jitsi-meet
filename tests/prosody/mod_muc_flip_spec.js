import { xml } from '@xmpp/client';
import assert from 'assert';


import { enableLobby, getRoomParticipants, setAffiliation, setRoomMaxOccupants, setSessionContext } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `flip-${++_roomCounter}@${CONFERENCE}`;

// Shared JWT user IDs used across tests.
const USER_A_ID = 'flip-test-user-a';
const USER_B_ID = 'flip-test-user-b';

/**
 * Returns the default MUC nick for a client. Matches the logic in xmpp_client.js:
 * first 8 characters of the JID local part, which is also what mod_muc_resource_validate
 * enforces in anonymous_strict mode.
 *
 * @param {string} jid  full JID, e.g. 'abc12345def@localhost/resource'
 */
function defaultNick(jid) {
    return jid.split('@')[0].slice(0, 8);
}

/** Extracts the occupant nick from a MUC join presence (the resource part of from=). */
function nickFrom(presence) {
    return presence.attrs.from.split('/')[1];
}

describe('mod_muc_flip', () => {

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
    });

    /**
     * Creates and connects an XMPP client, tracking it for cleanup.
     *
     * @returns {Promise<object>}
     */
    async function connect() {
        const c = await createXmppClient();

        clients.push(c);

        return c;
    }

    /**
     * Joins a room as focus and tracks the client for cleanup.
     *
     * @param {string} roomJid - Room JID to join.
     * @returns {Promise<object>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    // -------------------------------------------------------------------------
    // flip_device tag stripping
    // -------------------------------------------------------------------------
    describe('flip_device tag stripping', () => {

        it('strips flip_device tag from guest (no JWT context)', async () => {
            const r = room();

            await focusJoin(r);

            const observer = await connect();

            await observer.joinRoom(r);

            // Connect guest before joining so we can predict their nick.
            const guest = await connect();

            // No setSessionContext — guest has no JWT context.

            // waitForPresenceFrom is exact-JID so it won't match stale presences
            // from other occupants that arrived during the observer's own join.
            const joinBroadcast = observer.waitForPresenceFrom(`${r}/${defaultNick(guest.jid)}`);

            await guest.joinRoom(r, null, { extensions: [ xml('flip_device') ] });

            const presence = await joinBroadcast;

            assert.ok(
                !presence.getChild('flip_device'),
                'flip_device tag must be stripped from guest join presence'
            );
        });

        it('strips flip_device tag when flip feature is disabled in JWT', async () => {
            const r = room();

            await focusJoin(r);
            await setRoomMaxOccupants(r, 10);

            const clientA = await connect();

            await setSessionContext(clientA.jid, USER_A_ID, { flip: false });
            await clientA.joinRoom(r);

            const observer = await connect();

            await observer.joinRoom(r);

            const clientA2 = await connect();

            await setSessionContext(clientA2.jid, USER_A_ID, { flip: false });

            const joinBroadcast = observer.waitForPresenceFrom(
                `${r}/${defaultNick(clientA2.jid)}`
            );

            await clientA2.joinRoom(r, null, { extensions: [ xml('flip_device') ] });

            const presence = await joinBroadcast;

            assert.ok(
                !presence.getChild('flip_device'),
                'flip_device tag must be stripped when flip feature is disabled'
            );

            const state = await getRoomParticipants(r);

            assert.ok(
                !state.kicked_participant_nick,
                'no participant should have been kicked'
            );
        });

        it('strips flip_device tag when the user is not already in the room', async () => {
            const r = room();

            await focusJoin(r);

            const observer = await connect();

            await observer.joinRoom(r);

            // USER_B_ID has never joined this room — no entry in participants_details.
            const clientB = await connect();

            await setSessionContext(clientB.jid, USER_B_ID, { flip: true });

            const joinBroadcast = observer.waitForPresenceFrom(
                `${r}/${defaultNick(clientB.jid)}`
            );

            await clientB.joinRoom(r, null, { extensions: [ xml('flip_device') ] });

            const presence = await joinBroadcast;

            assert.ok(
                !presence.getChild('flip_device'),
                'flip_device tag must be stripped when user has no existing device in room'
            );

            const state = await getRoomParticipants(r);

            assert.ok(!state.kicked_participant_nick, 'no participant should have been kicked');
        });

    }); // flip_device tag stripping

    // -------------------------------------------------------------------------
    // Successful flip
    // -------------------------------------------------------------------------
    describe('flip', () => {

        it('kicks the old device when the same user joins from a new device', async () => {
            const r = room();

            await focusJoin(r);

            const device1 = await connect();

            await setSessionContext(device1.jid, USER_A_ID, { flip: true });
            const d1Presence = await device1.joinRoom(r);
            const d1Nick = nickFrom(d1Presence);

            // Start watching for device1 to be kicked before device2 joins,
            // so the unavailable presence is not missed if it arrives quickly.
            const kickedPromise = device1.waitForPresenceFrom(
                `${r}/${d1Nick}`, { type: 'unavailable' }
            );

            const device2 = await connect();

            await setSessionContext(device2.jid, USER_A_ID, { flip: true });
            await device2.joinRoom(r, null, { extensions: [ xml('flip_device') ] });

            const kickedPresence = await kickedPromise;

            assert.equal(
                kickedPresence.attrs.type, 'unavailable',
                'device1 must receive an unavailable presence (kicked)'
            );
        });

        it('adds flip_device tag to the kicked occupant unavailable presence', async () => {
            const r = room();

            await focusJoin(r);
            await setRoomMaxOccupants(r, 10);

            const device1 = await connect();

            await setSessionContext(device1.jid, USER_A_ID, { flip: true });
            const d1Presence = await device1.joinRoom(r);
            const d1Nick = nickFrom(d1Presence);

            // Observer receives the broadcast of the kick so we can inspect the stanza.
            const observer = await connect();

            await observer.joinRoom(r);

            const kickBroadcastPromise = observer.waitForPresenceFrom(
                `${r}/${d1Nick}`, { type: 'unavailable' }
            );

            const device2 = await connect();

            await setSessionContext(device2.jid, USER_A_ID, { flip: true });
            await device2.joinRoom(r, null, { extensions: [ xml('flip_device') ] });

            const kickedPresence = await kickBroadcastPromise;

            assert.ok(
                kickedPresence.getChild('flip_device'),
                'unavailable presence for the kicked device must contain <flip_device/>'
            );
        });

        it('transfers moderator role to flip device and tags the kicked occupant presence', async () => {
            const r = room();

            await focusJoin(r);
            await setRoomMaxOccupants(r, 10);

            const device1 = await connect();

            await setSessionContext(device1.jid, USER_A_ID, { flip: true });
            const d1Presence = await device1.joinRoom(r);
            const d1Nick = nickFrom(d1Presence);

            // Promote device1 to owner so it holds moderator role.
            await setAffiliation(r, device1.jid.split('/')[0], 'owner');

            // Watch for device1's own kick before device2 joins to avoid missing it.
            const d1KickPromise = device1.waitForPresenceFrom(
                `${r}/${d1Nick}`, { type: 'unavailable' }
            );

            const observer = await connect();
            const observerJoinPresence = await observer.joinRoom(r);
            const observerNick = nickFrom(observerJoinPresence);

            const d1FlipTagPromise = observer.waitForPresenceFrom(
                `${r}/${d1Nick}`, { type: 'unavailable' }
            );

            const device2 = await connect();

            await setSessionContext(device2.jid, USER_A_ID, { flip: true });
            await device2.joinRoom(r, null, { extensions: [ xml('flip_device') ] });

            await d1KickPromise;
            const d1KickPresence = await d1FlipTagPromise;

            assert.ok(
                d1KickPresence.getChild('flip_device'),
                'kicked device presence must contain flip_device tag'
            );

            // Verify device2 has moderator role by performing a moderator-only action:
            // kicking the observer. Only a moderator can set role='none'.
            const observerKickPromise = observer.waitForPresenceFrom(
                `${r}/${observerNick}`, { type: 'unavailable' }
            );
            const kickResponse = await device2.sendMucAdmin(r, { nick: observerNick, role: 'none' });

            assert.notEqual(kickResponse.attrs.type, 'error', 'device2 must have moderator role');
            await observerKickPromise;
        });

    }); // flip

    // -------------------------------------------------------------------------
    // Lobby interactions
    // -------------------------------------------------------------------------
    describe('lobby interactions', () => {

        it('flip device bypasses lobby when first device is in main room', async () => {
            const r = room();

            await focusJoin(r);

            // device1 joins before lobby is enabled.
            const device1 = await connect();

            await setSessionContext(device1.jid, USER_A_ID, { flip: true });
            await device1.joinRoom(r);

            await enableLobby(r);

            // Start listening for device1's kick before device2 joins.
            const d1KickedPromise = device1.waitForPresence(p => p.attrs.type === 'unavailable');

            const device2 = await connect();

            await setSessionContext(device2.jid, USER_A_ID, { flip: true });

            // device2 joins with flip_device — mod_muc_flip grants it member affiliation
            // in muc-occupant-pre-join, which causes the lobby module to let it through.
            // A displayName is required because the lobby checks for it before the affiliation.
            const joinPresence = await device2.joinRoom(
                r, null, {
                    displayName: 'Device Two',
                    extensions: [ xml('flip_device') ]
                });

            assert.notEqual(
                joinPresence.attrs.type, 'error',
                'flip device must bypass lobby when first device is in main room'
            );

            // The flip also kicks device1 from the main room.
            await d1KickedPromise;
        });

        it('requires first device to be in main room for flip to proceed', async () => {
            const r = room();

            await focusJoin(r);
            await enableLobby(r);

            // device1 joins but does not reach the main room.
            const device1 = await connect();

            await setSessionContext(device1.jid, USER_A_ID, { flip: true });

            const d1JoinResult = await device1.joinRoom(r, null, { displayName: 'Device One' });

            assert.equal(
                d1JoinResult.attrs.type, 'error',
                'device1 must not reach the main room (precondition)'
            );

            // device2 joins with flip_device and the same JWT user id.
            // No occupant with that id is in the main room, so the flip tag
            // is ignored and device2 is treated as a regular join.
            const device2 = await connect();

            await setSessionContext(device2.jid, USER_A_ID, { flip: true });

            const d2JoinResult = await device2.joinRoom(r, null, {
                displayName: 'Device Two',
                extensions: [ xml('flip_device') ]
            });

            assert.equal(
                d2JoinResult.attrs.type, 'error',
                'flip must not proceed when no matching occupant is in the main room'
            );
        });

    }); // lobby interactions

});
