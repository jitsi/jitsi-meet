import assert from 'assert';

import { getContainer } from './helpers/container.js';
import { prosodyShell } from './helpers/prosody_shell.js';
import { createXmppClient } from './helpers/xmpp_client.js';

const DISCO_INFO_NS = 'http://jabber.org/protocol/disco#info';

const LOADED_FEATURE = 'http://jitsi.org/protocol/test#loaded_feature';

// A module that advertises a feature when it is loaded, the way a component does it.
const ADD_FEATURE_MODULE = `local util = module:require 'util';
util.process_host_module('localhost', function(host_module)
    host_module:fire_event('jitsi-add-feature', { feature = '${LOADED_FEATURE}' });
end);
`;

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

    it('query contains the features advertised with jitsi-add-feature', async () => {
        const feature = 'http://jitsi.org/protocol/test#jiconop_feature';

        // Connect first, so the query is cached before the feature is added.
        await connectAndGetJiconop();
        await prosodyShell(
            `>prosody.hosts["localhost"].events.fire_event("jitsi-add-feature", { feature = "${feature}" })`);

        const { msg } = await connectAndGetJiconop();
        const features = msg.getChild('query', DISCO_INFO_NS)
            .getChildren('feature')
            .map(f => f.attrs.var);

        assert.ok(features.includes(feature), 'query must contain the advertised feature');
        assert.ok(!features.includes('urn:xmpp:ping'), 'query must not contain the standard XMPP features');
    });

    it('the main host disco#info contains the features advertised with jitsi-add-feature', async () => {
        const feature = 'http://jitsi.org/protocol/test#disco_feature';

        await prosodyShell(
            `>prosody.hosts["localhost"].events.fire_event("jitsi-add-feature", { feature = "${feature}" })`);

        const c = await createXmppClient();

        clients.push(c);

        const reply = await c.sendDiscoInfo('localhost');
        const features = reply.getChild('query', DISCO_INFO_NS)
            .getChildren('feature')
            .map(f => f.attrs.var);

        assert.ok(features.includes(feature), 'disco#info must contain the advertised feature');
    });

    it('advertises once the feature of a module that is loaded and reloaded on a component', async () => {
        await getContainer().exec([ 'sh', '-c',
            `cat > /opt/prosody-jitsi-plugins/mod_test_add_feature.lua <<'EOF'\n${ADD_FEATURE_MODULE}EOF\n` ]);

        // Cache the query first, the module must rebuild it.
        await connectAndGetJiconop();
        await prosodyShell('module:load("test_add_feature", "conference.localhost")');

        const { msg } = await connectAndGetJiconop();
        const jiconopFeatures = msg.getChild('query', DISCO_INFO_NS)
            .getChildren('feature')
            .map(f => f.attrs.var);

        assert.ok(jiconopFeatures.includes(LOADED_FEATURE), 'query must contain the feature of the loaded module');

        await prosodyShell('module:unload("test_add_feature", "conference.localhost")');
        await prosodyShell('module:load("test_add_feature", "conference.localhost")');

        // disco#info and jiconop skip duplicates, count the host items instead.
        const output = await prosodyShell('>local n = 0; for _, f in ipairs(prosody.hosts["localhost"]'
            + '.modules.features_identity.module:get_host_items("feature")) do '
            + `if f == "${LOADED_FEATURE}" then n = n + 1; end end; return "count=" .. n`);

        assert.match(output, /count=1\b/, 'the feature must be added once after a reload');
    });
});
