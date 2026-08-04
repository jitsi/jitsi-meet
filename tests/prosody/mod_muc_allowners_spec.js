import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

// Uses a dedicated MUC component that has muc_allowners loaded and neither
// muc_meeting_id (no jicofo lock) nor token_verification, so anonymous clients
// can join freely. Room names listed in allowners_moderated_rooms in
// docker/prosody.cfg.lua ('moderated-room-1', 'moderated-room-2') are treated
// as moderated by util.is_moderated().
const CONFERENCE = 'conference-allowners.localhost';
const MUC_USER_NS = 'http://jabber.org/protocol/muc#user';

let _roomCounter = 0;
const room = () => `allowners-${++_roomCounter}@${CONFERENCE}`;

/**
 * Returns the affiliation carried by a MUC presence stanza, or undefined.
 * @param {object} presence  Presence stanza.
 * @returns {string|undefined}
 */
function affiliationOf(presence) {
    return presence.getChild('x', MUC_USER_NS)?.getChild('item')?.attrs.affiliation;
}

/**
 * Returns true when an IQ response is the auth/forbidden error reply sent by
 * filter_admin_set_query in mod_muc_allowners.
 * @param {object} iq  IQ response stanza.
 * @returns {boolean}
 */
function isForbidden(iq) {
    return iq.attrs.type === 'error'
        && Boolean(iq.getChild('error')?.getChild('forbidden'));
}

describe('mod_muc_allowners', () => {

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
     * Focus is a Prosody admin, so mod_muc_allowners skips it and it creates
     * and unlocks the room as in production. Rooms must be created by focus:
     * a regular creator's initial owner self-presence would be filtered by
     * filter_stanza and the room would never be unlocked.
     *
     * @param {string} roomJid  Full room JID.
     * @returns {Promise<XmppTestClient>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    /**
     * Joins a room and resolves once the occupant holds the owner affiliation.
     * mod_muc_allowners filters out the initial 'participant' self-presence of
     * a joining occupant, so joinRoom usually resolves with the promotion
     * presence directly; handle both event orders to be safe.
     *
     * @param {XmppTestClient} c  Connected client.
     * @param {string} roomJid    Full room JID.
     * @returns {Promise<object>} The self-presence carrying the owner affiliation.
     */
    async function joinAsOwner(c, roomJid) {
        const presence = await c.joinRoom(roomJid);

        if (affiliationOf(presence) === 'owner') {
            return presence;
        }

        return c.waitForPresence(p =>
            p.getChild('x', MUC_USER_NS)?.getChildren('status')
                .some(s => s.attrs.code === '110')
            && affiliationOf(p) === 'owner');
    }

    /**
     * Returns the bare JID of a connected client.
     * @param {XmppTestClient} c  Connected client.
     * @returns {string}
     */
    const bareJid = c => c.jid.split('/')[0];

    // -------------------------------------------------------------------------
    // Non-moderated rooms
    // -------------------------------------------------------------------------
    describe('non-moderated room', () => {

        it('anonymous participants are promoted to owner on join', async () => {
            const r = room();

            await focusJoin(r);

            const p1 = await connect();
            const p2 = await connect();

            const presence1 = await joinAsOwner(p1, r);
            const presence2 = await joinAsOwner(p2, r);

            assert.equal(affiliationOf(presence1), 'owner', 'first participant must be promoted');
            assert.equal(affiliationOf(presence2), 'owner', 'second participant must be promoted');
        });

        it('revoking an affiliation is rejected with forbidden', async () => {
            const r = room();

            await focusJoin(r);

            const p1 = await connect();
            const p2 = await connect();

            await joinAsOwner(p1, r);
            await joinAsOwner(p2, r);

            for (const affiliation of [ 'none', 'outcast', 'member' ]) {
                const response = await p1.sendMucAdmin(r, { jid: bareJid(p2),
                    affiliation });

                assert.ok(isForbidden(response),
                    `affiliation='${affiliation}' must be rejected with forbidden`);
            }
        });

        it('a revoke item after a benign first item is also rejected', async () => {
            const r = room();

            await focusJoin(r);

            const p1 = await connect();
            const p2 = await connect();
            const p3 = await connect();

            await joinAsOwner(p1, r);
            await joinAsOwner(p2, r);
            await joinAsOwner(p3, r);

            // The first item is an allowed grant; the second revokes p3. The
            // filter must inspect every item, not just the first one.
            const response = await p1.sendMucAdminItems(r, [
                { jid: bareJid(p2),
                    affiliation: 'owner' },
                { jid: bareJid(p3),
                    affiliation: 'none' }
            ]);

            assert.ok(isForbidden(response),
                'a batched revoke hidden behind a benign first item must be rejected');
        });

        it('granting owner is allowed', async () => {
            const r = room();

            await focusJoin(r);

            const p1 = await connect();
            const p2 = await connect();

            await joinAsOwner(p1, r);
            await joinAsOwner(p2, r);

            const response = await p1.sendMucAdmin(r, { jid: bareJid(p2),
                affiliation: 'owner' });

            assert.equal(response.attrs.type, 'result', 'granting owner must not be filtered');
        });
    });

    // -------------------------------------------------------------------------
    // Moderated rooms (listed in allowners_moderated_rooms)
    // -------------------------------------------------------------------------
    describe('moderated room', () => {

        it('anonymous participants are not promoted', async () => {
            const r = `moderated-room-1@${CONFERENCE}`;

            await focusJoin(r);

            const guest = await connect();
            const presence = await guest.joinRoom(r);

            assert.equal(affiliationOf(presence), 'none',
                'anonymous participant must not be promoted in a moderated room');
        });

        it('JWT host is promoted and may revoke affiliations', async () => {
            const roomName = 'moderated-room-2';
            const r = `${roomName}@${CONFERENCE}`;

            await focusJoin(r);

            const token = mintAsapToken({ room: roomName });
            const host = await connect({ params: { token } });

            const presence = await joinAsOwner(host, r);

            assert.equal(affiliationOf(presence), 'owner',
                'JWT host must be promoted in a moderated room');

            const guest = await connect();

            await guest.joinRoom(r);

            // Revoking is filtered only in non-moderated rooms; in a moderated
            // room the owner may ban an occupant.
            const response = await host.sendMucAdmin(r, { jid: bareJid(guest),
                affiliation: 'outcast' });

            assert.equal(response.attrs.type, 'result',
                'revoking must be allowed in a moderated room');
        });
    });
});
