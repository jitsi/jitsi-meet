import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const METADATA_COMPONENT = 'metadata.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';

let _counter = 0;
const nextRoom = () => `filter-direct-${++_counter}@${CONFERENCE}`;

/**
 * Asserts that no message with this id arrives on the client.
 *
 * @param {object} client  XMPP client to watch.
 * @param {string} id      Stanza id to wait for.
 * @param {string} message Assertion message.
 */
async function assertNoMessage(client, id, message) {
    try {
        await client.waitForMessage(s => s.attrs.id === id, 1000);
        assert.fail(message);
    } catch (e) {
        if (!/Timeout waiting for message/.test(e.message)) {
            throw e;
        }
    }
}

describe('mod_filter_direct_messages', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // ── blocked ───────────────────────────────────────────────────────────────

    it('a message to the full JID of another client is rejected', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);

        clients.push(focus);

        const target = await createXmppClient();

        clients.push(target);
        await target.joinRoom(r);

        // The sender knows the real JID of the recipient, the way an occupant of
        // the room does. It is not an occupant itself here, which makes no
        // difference: this route does not go to the MUC at all.
        const sender = await createXmppClient();

        clients.push(sender);

        const id = await sender.sendDirectChat(target.jid, 'direct');
        const reply = await sender.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(reply.attrs.type, 'error', 'the message must be rejected');
        assert.ok(
            reply.getChild('error')?.getChild('not-allowed'),
            'expected <not-allowed/> error condition'
        );

        await assertNoMessage(target, id, 'the message must not reach the recipient');
    });

    it('a message to the bare JID of another client is rejected', async () => {
        const target = await createXmppClient();

        clients.push(target);

        const sender = await createXmppClient();

        clients.push(sender);

        const bareJid = target.jid.split('/')[0];
        const id = await sender.sendDirectChat(bareJid, 'direct');
        const reply = await sender.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(reply.attrs.type, 'error', 'the message must be rejected');
        assert.ok(
            reply.getChild('error')?.getChild('not-allowed'),
            'expected <not-allowed/> error condition'
        );

        await assertNoMessage(target, id, 'the message must not reach the recipient');
    });

    // ── still permitted ───────────────────────────────────────────────────────

    it('a group chat message to the room is delivered', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);

        clients.push(focus);

        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        const reply = await sender.sendGroupchat(r, 'hello');

        assert.notEqual(reply.attrs.type, 'error', 'group chat must not be affected');
    });

    it('a private message to an occupant of the room is delivered', async () => {
        const r = nextRoom();

        const focus = await joinWithFocus(r);

        clients.push(focus);

        const recipient = await createXmppClient();

        clients.push(recipient);
        await recipient.joinRoom(r);

        const sender = await createXmppClient();

        clients.push(sender);
        await sender.joinRoom(r);

        const id = await sender.sendPrivateChat(r, recipient.nick, 'private');
        const received = await recipient.waitForMessage(s => s.attrs.id === id, 3000);

        assert.strictEqual(received.getChildText('body'), 'private',
            'a MUC private message must not be affected');
    });

    it('a message to a component is delivered', async () => {
        const r = nextRoom();
        const roomName = r.split('@')[0];

        const focus = await joinWithFocus(r);

        clients.push(focus);

        // A moderator, so that the metadata component accepts the update.
        const token = mintAsapToken({ room: roomName,
            context: { user: { moderator: true } } });
        const mod = await createXmppClient({ params: { room: roomName,
            token } });

        clients.push(mod);
        await mod.joinRoom(r);

        mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'permissions', { groupChatRestricted: true });

        // The component answers with the broadcast of the new metadata, which
        // proves that the message reached it.
        const broadcast = await mod.waitForMessage(s => {
            const jsonMsg = s.getChild('json-message', JITMEET_NS);

            if (!jsonMsg) {
                return false;
            }

            try {
                return JSON.parse(jsonMsg.getText())?.metadata?.permissions?.groupChatRestricted === true;
            } catch {
                return false;
            }
        }, 3000);

        assert.ok(broadcast, 'a message to a component must not be affected');
    });

    it('a message to a MUC on another server is not rejected by this module', async () => {
        const sender = await createXmppClient();

        clients.push(sender);

        // The shape of the occupant JID of a visitor: a MUC on the visitor node.
        // There is no server-to-server connection in this environment, so the
        // message either goes nowhere or comes back with a routing error. Either
        // way it must not be the rejection of this module.
        const id = await sender.sendDirectChat(`room@${CONFERENCE.replace('conference.', 'conference.v1.')}/nick`,
            'to a visitor');

        try {
            const reply = await sender.waitForMessage(s => s.attrs.id === id, 1000);

            assert.strictEqual(reply.attrs.type, 'error', 'only an error can come back here');
            assert.ok(
                !reply.getChild('error')?.getChild('not-allowed'),
                'the error must come from routing, not from this module'
            );
        } catch (e) {
            if (!/Timeout waiting for message/.test(e.message)) {
                throw e;
            }
        }
    });
});
