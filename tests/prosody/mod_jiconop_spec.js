import assert from 'assert';

import { createXmppClient } from './helpers/xmpp_client.js';

const DISCO_INFO_NS = 'http://jabber.org/protocol/disco#info';

describe('mod_jiconop', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    /**
     * Connects a client and waits for the unsolicited jiconop message.
     *
     * @returns {Promise<{client: object, msg: object}>}
     */
    async function connectAndGetJiconop() {
        const c = await createXmppClient();

        clients.push(c);

        const msg = await c.waitForMessage(m => m.getChild('query', DISCO_INFO_NS) !== null);

        return { client: c,
            msg };
    }

    it('sends an unsolicited message with a disco#info query on connect', async () => {
        const { msg } = await connectAndGetJiconop();

        assert.ok(msg, 'must receive a message stanza after bind');
        assert.ok(msg.getChild('query', DISCO_INFO_NS),
            'message must contain <query xmlns="http://jabber.org/protocol/disco#info">');
    });

    it('message is addressed to the client full JID', async () => {
        const { client,
            msg } = await connectAndGetJiconop();

        assert.equal(msg.attrs.to, client.jid, 'message must be addressed to the client full JID');
    });

    it('query contains shard identity', async () => {
        const { msg } = await connectAndGetJiconop();
        const query = msg.getChild('query', DISCO_INFO_NS);
        const identities = query.getChildren('identity');
        const shard = identities.find(i => i.attrs.category === 'server' && i.attrs.type === 'shard');

        assert.ok(shard, 'query must contain a server/shard identity');
        assert.equal(shard.attrs.name, 'test-shard');
    });

    it('query contains region identity', async () => {
        const { msg } = await connectAndGetJiconop();
        const query = msg.getChild('query', DISCO_INFO_NS);
        const identities = query.getChildren('identity');
        const region = identities.find(i => i.attrs.category === 'server' && i.attrs.type === 'region');

        assert.ok(region, 'query must contain a server/region identity');
        assert.equal(region.attrs.name, 'test-region');
    });

    it('query contains release identity', async () => {
        const { msg } = await connectAndGetJiconop();
        const query = msg.getChild('query', DISCO_INFO_NS);
        const identities = query.getChildren('identity');
        const release = identities.find(i => i.attrs.category === 'server' && i.attrs.type === 'release');

        assert.ok(release, 'query must contain a server/release identity');
        assert.equal(release.attrs.name, 'test-release');
    });
});
