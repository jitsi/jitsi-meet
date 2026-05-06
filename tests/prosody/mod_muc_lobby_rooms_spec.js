import assert from 'assert';

import { disableLobby, enableLobby, setAffiliation } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const LOBBY = 'lobby.conference.localhost';
const LOBBY_NS = 'http://jitsi.org/jitmeet';

let _roomCounter = 0;
const room = () => `lobby-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_lobby_rooms', () => {

    let clients;

    beforeEach(() => {
        clients = [];
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
    });

    /**
     * Creates an XMPP client and pushes it to the cleanup list.
     * @param {object} opts Options forwarded to createXmppClient.
     * @returns {Promise<object>}
     */
    async function connect(opts) {
        const c = await createXmppClient(opts);

        clients.push(c);

        return c;
    }

    /**
     * Joins a room as focus and pushes the client to the cleanup list.
     * @param {string} roomJid Full room JID.
     * @returns {Promise<object>}
     */
    async function focusJoin(roomJid) {
        const c = await joinWithFocus(roomJid);

        clients.push(c);

        return c;
    }

    // -------------------------------------------------------------------------
    // join gate — non-member
    // -------------------------------------------------------------------------
    describe('non-member join gate', () => {

        it('blocks a non-member with 407 registration-required', async () => {
            const r = room();

            await focusJoin(r);
            await enableLobby(r);

            const c = await connect();
            const presence = await c.joinRoom(r, undefined, { displayName: 'Alice' });

            assert.equal(presence.attrs.type, 'error', 'join must be rejected');

            const error = presence.getChild('error');

            assert.ok(error, 'error element must be present');
            assert.equal(error.attrs.type, 'auth');
            assert.ok(
                error.getChild('registration-required'),
                'error condition must be registration-required'
            );
        });

        it('includes the lobby room JID in the 407 error', async () => {
            const r = room();

            await focusJoin(r);
            const lobbyJid = await enableLobby(r);

            const c = await connect();
            const presence = await c.joinRoom(r, undefined, { displayName: 'Alice' });

            assert.equal(presence.attrs.type, 'error');

            // Prosody builds the error reply with cursor at <error>, so
            // Jitsi-specific child tags land inside <error>, not as siblings.
            const error = presence.getChild('error');

            assert.ok(error, 'error element must be present');

            const lobbyroom = error.getChild('lobbyroom', LOBBY_NS);

            assert.ok(lobbyroom, 'expected <lobbyroom xmlns="http://jitsi.org/jitmeet"> in error');
            assert.equal(
                lobbyroom.getText(),
                lobbyJid,
                'lobbyroom JID in error must match the created lobby room'
            );
            assert.ok(
                lobbyJid.endsWith(`@${LOBBY}`),
                'lobby room JID must be on the lobby component'
            );
        });

        it('blocks with 406 not-acceptable when display name is missing', async () => {
            const r = room();

            await focusJoin(r);
            await enableLobby(r);

            const c = await connect();
            const presence = await c.joinRoom(r); // no displayName

            assert.equal(presence.attrs.type, 'error', 'join must be rejected');

            const error = presence.getChild('error');

            assert.ok(error, 'error element must be present');
            assert.equal(error.attrs.type, 'modify');
            assert.ok(error.getChild('not-acceptable'), 'error condition must be not-acceptable');

            // Same as lobbyroom: cursor is at <error> when tag is appended.
            const dnRequired = error.getChild('displayname-required', LOBBY_NS);

            assert.ok(
                dnRequired,
                'expected <displayname-required xmlns="http://jitsi.org/jitmeet"> in error'
            );
            assert.equal(dnRequired.attrs.lobby, 'true');
        });
    });

    // -------------------------------------------------------------------------
    // bypass paths
    // -------------------------------------------------------------------------
    describe('bypass paths', () => {

        it('pre-approved member with display name can join', async () => {
            const r = room();

            await focusJoin(r);

            await enableLobby(r);

            const c = await connect();

            // Grant member affiliation before the client attempts to join.
            const bareJid = c.jid.split('/')[0];

            await setAffiliation(r, bareJid, 'member');

            const presence = await c.joinRoom(r, undefined, { displayName: 'Bob' });

            assert.notEqual(presence.attrs.type, 'error', 'pre-approved member must be allowed in');
        });

        it('whitelisted domain bypasses lobby without affiliation', async () => {
            const r = room();

            await focusJoin(r);
            await enableLobby(r);

            // whitelist.localhost is in muc_lobby_whitelist in prosody.cfg.lua
            const c = await connect({ domain: 'whitelist.localhost' });
            const presence = await c.joinRoom(r); // no displayName needed for whitelisted

            assert.notEqual(presence.attrs.type, 'error', 'whitelisted domain must bypass lobby');
        });
    });

    // -------------------------------------------------------------------------
    // lobby room lifecycle
    // -------------------------------------------------------------------------
    describe('lifecycle', () => {

        it('lobby room JID is advertised in room disco info after enable', async () => {
            const r = room();
            const focus = await focusJoin(r);
            const lobbyJid = await enableLobby(r);

            // Query disco info on the main room from the focus client (already joined).
            const discoResponse = await focus.sendDiscoInfo(r);
            const query = discoResponse.getChild('query', 'http://jabber.org/protocol/disco#info');

            assert.ok(query, 'disco#info query element must be present in response');

            const dataForm = query.getChild('x', 'jabber:x:data');

            assert.ok(dataForm, 'data form must be present in disco#info');

            const lobbyField = dataForm
                .getChildren('field')
                .find(f => f.attrs.var === 'muc#roominfo_lobbyroom');

            assert.ok(lobbyField, 'muc#roominfo_lobbyroom field must be present');
            assert.equal(
                lobbyField.getChildText('value'),
                lobbyJid,
                'muc#roominfo_lobbyroom value must equal the lobby room JID'
            );
        });

        it('lobby room JID is absent from disco info after disable', async () => {
            const r = room();
            const focus = await focusJoin(r);

            await enableLobby(r);
            await disableLobby(r);

            const discoResponse = await focus.sendDiscoInfo(r);
            const query = discoResponse.getChild('query', 'http://jabber.org/protocol/disco#info');
            const dataForm = query?.getChild('x', 'jabber:x:data');

            const lobbyField = dataForm
                ?.getChildren('field')
                .find(f => f.attrs.var === 'muc#roominfo_lobbyroom');

            assert.ok(!lobbyField, 'muc#roominfo_lobbyroom must not appear after lobby is disabled');
        });

        it('non-member can join freely after lobby is disabled', async () => {
            const r = room();

            await focusJoin(r);
            await enableLobby(r);
            await disableLobby(r);

            const c = await connect();
            const presence = await c.joinRoom(r);

            assert.notEqual(presence.attrs.type, 'error',
                'non-member must be allowed after lobby is disabled');
        });
    });
});
