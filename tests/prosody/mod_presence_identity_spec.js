import { xml } from '@xmpp/client';
import assert from 'assert';

import { mintToken } from './helpers/jwt.js';
import { createXmppClient } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference-identity.localhost';

let _roomCounter = 0;
const room = () => `presence-identity-${++_roomCounter}@${CONFERENCE}`;

/**
 * Connects to the hs256.localhost VirtualHost with a signed token.
 * mod_presence_identity is loaded on this VirtualHost.
 *
 * @param {object} [tokenPayload]  JWT payload overrides (e.g. { context: { user: ... } }).
 * @returns {Promise<XmppTestClient>}
 */
function hs256Client(tokenPayload = {}) {
    const token = mintToken(tokenPayload);

    return createXmppClient({ domain: 'hs256.localhost',
        params: { token } });
}

/**
 * Returns the first presence stanza in the observer's queue that comes from
 * the given room and is NOT the observer's own self-presence.
 *
 * @param {XmppTestClient} observer
 * @param {string} roomJid
 * @param {string} observerNick
 */
function waitForOtherPresence(observer, roomJid, observerNick) {
    return observer.waitForPresence(
        p => p.attrs.from?.startsWith(`${roomJid}/`)
            && p.attrs.from !== `${roomJid}/${observerNick}`
    );
}

describe('mod_presence_identity', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // -------------------------------------------------------------------------
    // identity injection
    // -------------------------------------------------------------------------
    describe('identity injection', () => {

        it('injects <identity><user> from JWT context.user into MUC presence', async () => {
            const r = room();

            const identity = await hs256Client({
                context: { user: { id: 'u1',
                    name: 'Alice' } }
            });

            clients.push(identity);
            await identity.joinRoom(r);

            const observer = await createXmppClient();

            clients.push(observer);
            await observer.joinRoom(r);

            const presence = await waitForOtherPresence(observer, r, observer.nick);
            const identityEl = presence.getChild('identity');

            assert.ok(identityEl, 'presence must contain <identity>');

            const userEl = identityEl.getChild('user');

            assert.ok(userEl, '<identity> must contain <user>');
            assert.strictEqual(userEl.getChild('id')?.text(), 'u1', 'id must match token');
            assert.strictEqual(userEl.getChild('name')?.text(), 'Alice', 'name must match token');
        });

        it('adds <group> inside <identity> when context.group is set', async () => {
            const r = room();

            const identity = await hs256Client({
                context: {
                    user: { id: 'u2' },
                    group: 'mygroup'
                }
            });

            clients.push(identity);
            await identity.joinRoom(r);

            const observer = await createXmppClient();

            clients.push(observer);
            await observer.joinRoom(r);

            const presence = await waitForOtherPresence(observer, r, observer.nick);
            const identityEl = presence.getChild('identity');

            assert.ok(identityEl, 'presence must contain <identity>');
            assert.strictEqual(identityEl.getChild('group')?.text(), 'mygroup',
                '<group> must match token context.group');
        });

        it('does not inject <identity> when token has no context.user', async () => {
            const r = room();

            // Valid token but no context field → no jitsi_meet_context_user on session.
            const noContext = await hs256Client();

            clients.push(noContext);
            await noContext.joinRoom(r);

            const observer = await createXmppClient();

            clients.push(observer);
            await observer.joinRoom(r);

            const presence = await waitForOtherPresence(observer, r, observer.nick);

            assert.ok(!presence.getChild('identity'),
                'presence must not contain <identity> when token has no context.user');
        });

        it('injects <identity> in presence updates (not only on join)', async () => {
            const r = room();

            const observer = await createXmppClient();

            clients.push(observer);
            await observer.joinRoom(r);

            const identity = await hs256Client({
                context: { user: { id: 'u3',
                    name: 'Bob' } }
            });

            clients.push(identity);
            await identity.joinRoom(r);

            // Consume the join presence.
            const joinPresence = await waitForOtherPresence(observer, r, observer.nick);

            assert.ok(joinPresence.getChild('identity'), 'join presence must have <identity>');

            // Send a presence update (no <x muc> element — this is a regular update,
            // not a join). Both pre-presence/bare and pre-presence/full hooks fire.
            const identityNick = joinPresence.attrs.from.split('/')[1];

            await identity.sendPresence(`${r}/${identityNick}`);

            // The update must also carry <identity>.
            const updatePresence = await observer.waitForPresence(
                p => p.attrs.from === `${r}/${identityNick}`
            );

            assert.ok(updatePresence.getChild('identity'),
                'presence update must also carry <identity>');
        });
    });

    // -------------------------------------------------------------------------
    // spoofing prevention
    // -------------------------------------------------------------------------
    describe('spoofing prevention', () => {

        it('strips a client-supplied <identity> when session has no context.user', async () => {
            const r = room();

            // Token with no context → no jitsi_meet_context_user on session.
            // The client manually crafts an <identity> element in the join presence.
            const intruder = await hs256Client();

            clients.push(intruder);

            await intruder.joinRoom(r, undefined, {
                extensions: [
                    xml('identity', {},
                        xml('user', {},
                            xml('id', {}, 'hacker'),
                            xml('name', {}, 'Evil Corp')
                        )
                    )
                ]
            });

            const observer = await createXmppClient();

            clients.push(observer);
            await observer.joinRoom(r);

            const presence = await waitForOtherPresence(observer, r, observer.nick);

            assert.ok(!presence.getChild('identity'),
                'module must strip the hand-crafted <identity> when no context.user is set');
        });

        it('strips a client-supplied <identity> and replaces it with the real one', async () => {
            const r = room();

            // Token with real context.user but also a crafted <identity> in the stanza.
            // The module must strip the crafted one and inject the real one from the session.
            const identity = await hs256Client({
                context: { user: { id: 'real-id',
                    name: 'Real User' } }
            });

            clients.push(identity);

            await identity.joinRoom(r, undefined, {
                extensions: [
                    xml('identity', {},
                        xml('user', {},
                            xml('id', {}, 'spoofed-id'),
                            xml('name', {}, 'Spoofed Name')
                        )
                    )
                ]
            });

            const observer = await createXmppClient();

            clients.push(observer);
            await observer.joinRoom(r);

            const presence = await waitForOtherPresence(observer, r, observer.nick);
            const identityEl = presence.getChild('identity');

            assert.ok(identityEl, 'presence must contain <identity>');
            assert.strictEqual(identityEl.getChild('user')?.getChild('id')
                ?.text(), 'real-id',
                'id must be from the verified JWT context, not the spoofed stanza');
            assert.strictEqual(identityEl.getChild('user')?.getChild('name')
                ?.text(), 'Real User',
                'name must be from the verified JWT context, not the spoofed stanza');
        });
    });
});
