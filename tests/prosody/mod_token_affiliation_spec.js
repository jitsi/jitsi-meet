import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const MUC_NS = 'http://jabber.org/protocol/muc#user';

let _counter = 0;
const nextRoom = () => `affiliation-${++_counter}@${CONFERENCE}`;

/**
 * Extracts the role and affiliation from a self-presence stanza.
 *
 * @param {object} presence
 * @returns {{ role: string|null, affiliation: string|null }}
 */
function getRoleAndAffiliation(presence) {
    const item = presence.getChild('x', MUC_NS)?.getChild('item');

    return {
        role: item?.attrs.role ?? null,
        affiliation: item?.attrs.affiliation ?? null
    };
}

/**
 * Connects a client on the main VirtualHost with the given context.user claims
 * embedded in a RS256 token.
 *
 * @param {object} contextUser  JWT context.user payload.
 * @returns {Promise<XmppTestClient>}
 */
function connectWithToken(contextUser) {
    const token = mintAsapToken({ context: { user: contextUser } });

    return createXmppClient({ params: { token } });
}

describe('mod_token_affiliation', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // -------------------------------------------------------------------------
    // Moderator claim variants
    // -------------------------------------------------------------------------

    describe('moderator claim variants that grant owner/moderator', () => {

        /**
         * Asserts that a client with the given JWT context user receives owner/moderator.
         * @param {object} contextUser JWT context.user payload.
         */
        async function assertModerator(contextUser) {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const c = await connectWithToken(contextUser);

            clients.push(c);

            const presence = await c.joinRoom(r);
            const { role, affiliation } = getRoleAndAffiliation(presence);

            assert.equal(affiliation, 'owner', `expected affiliation=owner, got ${affiliation}`);
            assert.equal(role, 'moderator', `expected role=moderator, got ${role}`);
        }

        it('moderator=true (boolean)', () => assertModerator({ moderator: true }));
        it('moderator=\'true\' (string)', () => assertModerator({ moderator: 'true' }));
        it('affiliation=\'owner\'', () => assertModerator({ affiliation: 'owner' }));
        it('affiliation=\'moderator\'', () => assertModerator({ affiliation: 'moderator' }));
        it('affiliation=\'teacher\'', () => assertModerator({ affiliation: 'teacher' }));

    });

    // -------------------------------------------------------------------------
    // Member (authenticated, non-moderator)
    // -------------------------------------------------------------------------

    it('grants member affiliation and participant role for authenticated non-moderator', async () => {
        const r = nextRoom();

        clients.push(await joinWithFocus(r));

        const c = await connectWithToken({ id: 'user1' });

        clients.push(c);

        const presence = await c.joinRoom(r);
        const { role, affiliation } = getRoleAndAffiliation(presence);

        assert.equal(affiliation, 'member', `expected affiliation=member, got ${affiliation}`);
        assert.equal(role, 'participant', `expected role=participant, got ${role}`);
    });

    it('grants member affiliation when moderator=false', async () => {
        const r = nextRoom();

        clients.push(await joinWithFocus(r));

        const c = await connectWithToken({ moderator: false });

        clients.push(c);

        const { affiliation } = getRoleAndAffiliation(await c.joinRoom(r));

        assert.equal(affiliation, 'member');
    });

    // -------------------------------------------------------------------------
    // No token (anonymous)
    // -------------------------------------------------------------------------

    it('leaves affiliation unchanged for anonymous user (no token)', async () => {
        const r = nextRoom();

        clients.push(await joinWithFocus(r));

        const c = await createXmppClient();

        clients.push(c);

        const presence = await c.joinRoom(r);
        const { role, affiliation } = getRoleAndAffiliation(presence);

        // No token → token_affiliation is a no-op; Prosody default is none/participant.
        assert.equal(affiliation, 'none', `expected affiliation=none, got ${affiliation}`);
        assert.equal(role, 'participant', `expected role=participant, got ${role}`);
    });

    // -------------------------------------------------------------------------
    // Multiple participants in the same room
    // -------------------------------------------------------------------------

    it('correctly assigns different roles to moderator and non-moderator in same room', async () => {
        const r = nextRoom();

        clients.push(await joinWithFocus(r));

        const mod = await connectWithToken({ moderator: true });
        const member = await connectWithToken({ id: 'plain' });

        clients.push(mod, member);

        const modPresence = await mod.joinRoom(r);
        const memberPresence = await member.joinRoom(r);

        assert.equal(getRoleAndAffiliation(modPresence).role, 'moderator');
        assert.equal(getRoleAndAffiliation(modPresence).affiliation, 'owner');

        assert.equal(getRoleAndAffiliation(memberPresence).role, 'participant');
        assert.equal(getRoleAndAffiliation(memberPresence).affiliation, 'member');
    });

});
