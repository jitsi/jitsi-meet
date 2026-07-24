import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';
import { isAvailablePresence } from './helpers/xmpp_utils.js';

// Uses a dedicated MUC component that has muc_wait_for_host loaded and no
// muc_meeting_id, so there is no jicofo lock — a JWT-authenticated client can
// join and create a room directly without focus unlocking it first.
// muc_mapper_domain_base = "conference.localhost" causes muc_wait_for_host to
// use lobby.conference.localhost as the lobby component.
const CONFERENCE = 'conference-waitforhost.localhost';
const MUC_NS = 'http://jabber.org/protocol/muc#user';

let _roomCounter = 0;
const room = () => `wfh-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_wait_for_host', () => {

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
    });

    /**
     * Connects an anonymous client and registers it for cleanup.
     * @param {object} [opts]  Options forwarded to createXmppClient.
     * @returns {Promise<XmppTestClient>}
     */
    async function connect(opts) {
        const c = await createXmppClient(opts);

        clients.push(c);

        return c;
    }

    /**
     * Joins as focus (jicofo admin) and registers the client for cleanup.
     * @param {string} roomJid  Full room JID.
     * @returns {Promise<XmppTestClient>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    /**
     * Connects as a JWT-authenticated user. The session receives auth_token,
     * making it recognised as a host by muc_wait_for_host.
     *
     * @param {string} roomName  Local part of the room JID (e.g. 'wfh-1').
     * @returns {Promise<XmppTestClient>}
     */
    async function connectAsHost(roomName) {
        const token = mintAsapToken({ room: roomName });
        const c = await createXmppClient({ params: { token } });

        clients.push(c);

        return c;
    }

    // -------------------------------------------------------------------------
    // No host present — lobby gate
    // -------------------------------------------------------------------------
    describe('no host present', () => {

        it('guest is blocked with registration-required', async () => {
            const r = room();

            // Focus creates and unlocks the room first. Without this the guest
            // would be the room creator and Prosody grants creators a free pass
            // (XEP-0045 §10.1.3 locked-room bypass) regardless of members_only.
            await focusJoin(r);

            const guest = await connect();
            const presence = await guest.joinRoom(r);

            assert.equal(presence.attrs.type, 'error', 'join must be rejected');
            assert.ok(
                presence.getChild('error')?.getChild('registration-required'),
                'error condition must be registration-required'
            );
        });

        it('focus joining does not satisfy the host requirement', async () => {
            const r = room();

            // Focus is a Prosody admin and bypasses the pre-join check, so it
            // joins successfully. But it is not counted as an authenticated host,
            // so the next anonymous guest should still be blocked.
            await focusJoin(r);

            const guest = await connect();
            const presence = await guest.joinRoom(r);

            assert.equal(presence.attrs.type, 'error',
                'join must be rejected even when focus is in the room');
            assert.ok(
                presence.getChild('error')?.getChild('registration-required'),
                'error condition must be registration-required'
            );
        });
    });

    // -------------------------------------------------------------------------
    // Room does not exist yet — creator bypass
    // -------------------------------------------------------------------------
    describe('room does not exist yet', () => {

        it('anonymous guest creates the room and is admitted despite no host present', async () => {
            const r = room();

            // No focus, no prior occupant: the guest's join is the stanza that
            // creates the MUC room. Prosody grants room creators a free pass
            // (XEP-0045 §10.1.3 locked-room bypass) before muc_wait_for_host's
            // muc-occupant-pre-join check can block it, and joinRoom() submits
            // the empty config form to unlock the room on status code 201.
            // This is why production locks room creation to jicofo alone
            // (restrict_room_creation + the mod_muc_meeting_id jicofo lock) —
            // this isolated test component has neither.
            const guest = await connect();
            const presence = await guest.joinRoom(r);

            assert.ok(isAvailablePresence(presence),
                'guest should be admitted: it created the room, so the host check never blocked it');
        });
    });

    // -------------------------------------------------------------------------
    // Host present — guests admitted
    // -------------------------------------------------------------------------
    describe('host present', () => {

        it('guest is admitted when a JWT host has already joined', async () => {
            const r = room();
            const roomName = r.split('@')[0];

            const host = await connectAsHost(roomName);

            await host.joinRoom(r);

            const guest = await connect();
            const presence = await guest.joinRoom(r);

            assert.ok(isAvailablePresence(presence),
                'guest should be admitted after JWT host joins');
        });

        it('room.has_host is cached: guest is admitted after the host leaves', async () => {
            const r = room();
            const roomName = r.split('@')[0];

            const host = await connectAsHost(roomName);

            await host.joinRoom(r);

            // A guest joins while the host is present. This sets room.has_host = true
            // via the existing-occupants loop in muc-occupant-pre-join.
            const guest1 = await connect();

            await guest1.joinRoom(r);

            // Host leaves. guest1 remains, keeping the room alive.
            await host.disconnect();

            // A new guest should still join because room.has_host is cached.
            const guest2 = await connect();
            const presence = await guest2.joinRoom(r);

            assert.ok(isAvailablePresence(presence),
                'guest should join after host leaves because room.has_host is cached');
        });
    });

    // -------------------------------------------------------------------------
    // Host arrives after lobby is triggered
    // -------------------------------------------------------------------------

    it('JWT host arriving after lobby is triggered opens the room for new guests', async () => {
        const r = room();
        const roomName = r.split('@')[0];

        // Focus creates and unlocks the room so the guest is not the creator
        // (XEP-0045 locked-room bypass would otherwise admit the first joiner).
        await focusJoin(r);

        // First guest triggers the lobby; the join is blocked.
        const guest1 = await connect();
        const blocked = await guest1.joinRoom(r);

        assert.equal(blocked.attrs.type, 'error', 'pre-host guest must be blocked');

        // JWT host joins — lobby is destroyed and room opens.
        const host = await connectAsHost(roomName);

        await host.joinRoom(r);

        // A new guest can now join freely.
        const guest2 = await connect();
        const presence = await guest2.joinRoom(r);

        assert.ok(isAvailablePresence(presence),
            'guest should be admitted after JWT host arrives');
    });

    // -------------------------------------------------------------------------
    // Auto-owner
    // -------------------------------------------------------------------------

    it('JWT authenticated user receives owner affiliation on join', async () => {
        const r = room();
        const roomName = r.split('@')[0];

        const host = await connectAsHost(roomName);

        await host.joinRoom(r);

        // muc-occupant-joined fires after the join and calls room:set_affiliation('owner'),
        // which sends a subsequent presence update carrying the new affiliation.
        const update = await host.waitForPresence(
            p => p.getChild('x', MUC_NS)?.getChild('item')?.attrs.affiliation === 'owner'
        );

        assert.ok(update,
            'JWT host should receive an owner-affiliation presence update after joining');
    });
});
