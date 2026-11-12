import assert from 'assert';
import path from 'path';
import { DockerComposeEnvironment, Wait } from 'testcontainers';
import { fileURLToPath } from 'url';

import { prosodyShell } from './helpers/prosody_shell.js';
import { createXmppClient } from './helpers/xmpp_client.js';

// A main prosody and a visitor node (v0), in their own containers and connected over s2s
// (docker/visitors/). The main room is on the main prosody. The visitor node sends it only
// messages and iqs, from its components, so the main room refuses any join that comes over s2s:
//   - s2s_whitelist on the main muc accepts s2s streams only from the visitor components,
//     not from the client domain of the visitor node;
//   - token_verification on the main muc refuses a join over s2s from any domain.
// Each check is tested on its own, with the other one unloaded.

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const MAIN_MUC = 'conference.main.test';
const VISITOR_MUC = 'conference.v0.meet.jitsi';
const STANZAS_NS = 'urn:ietf:params:xml:ns:xmpp-stanzas';

let _roomCounter = 0;

describe('visitor node s2s to the main prosody', () => {
    let environment;
    let main;
    let visitor;
    let clients = [];

    /**
     * Connects to the main prosody (anonymous on main.test, or with the given credentials).
     *
     * @param {object} [opts] - Options forwarded to createXmppClient.
     * @returns {Promise<object>} The client.
     */
    async function connectMain(opts = {}) {
        const c = await createXmppClient({
            host: main.getHost(),
            port: main.getMappedPort(5280),
            domain: 'main.test',
            ...opts
        });

        clients.push(c);

        return c;
    }

    /**
     * Connects an anonymous client to the visitor node.
     *
     * @returns {Promise<object>} The client.
     */
    async function connectVisitor() {
        const c = await createXmppClient({
            host: visitor.getHost(),
            port: visitor.getMappedPort(5280),
            domain: 'v0.meet.jitsi'
        });

        clients.push(c);

        return c;
    }

    /**
     * Creates a room on the main muc with the focus, and joins it with a participant of the main prosody.
     *
     * @returns {Promise<{room: string, participant: object}>}
     */
    async function createMainRoom() {
        const room = `visitors-s2s-${++_roomCounter}@${MAIN_MUC}`;
        const focus = await connectMain({
            domain: 'auth.main.test',
            username: 'focus',
            password: 'focussecret'
        });

        await focus.joinRoom(room, 'focus');

        const participant = await connectMain();
        const presence = await participant.joinRoom(room);

        assert.notEqual(presence.attrs.type, 'error', `the participant could not join: ${presence}`);

        return { room,
            participant };
    }

    /**
     * Sends a join to the main room from a client of the visitor node.
     *
     * @param {string} room - The main room.
     * @returns {Promise<{nick: string, presence: object}>} The nick and the presence the client got back.
     */
    async function joinFromVisitorNode(room) {
        const c = await connectVisitor();
        const presence = await c.joinRoom(room, c.nick, { timeout: 10000 });

        return { nick: c.nick,
            presence };
    }

    /**
     * Resolves when the participant gets a presence from the nick within the timeout,
     * rejects otherwise.
     *
     * @param {object} participant - The participant in the main room.
     * @param {string} room - The main room.
     * @param {string} nick - The nick.
     * @param {number} [timeout] - Milliseconds to wait.
     * @returns {Promise<object>}
     */
    function presenceSeenBy(participant, room, nick, timeout = 3000) {
        return participant.waitForPresenceFrom(`${room}/${nick}`, { timeout });
    }

    /**
     * Runs Lua in the given prosody and returns what it returned.
     *
     * @param {object} container - The prosody container.
     * @param {string} lua - The Lua code, with a return statement.
     * @returns {Promise<string>}
     */
    async function runLua(container, lua) {
        const output = await prosodyShell(`>${lua}`, container);
        const result = output.match(/Result: (.*)/);

        return result ? result[1].trim() : '';
    }

    /**
     * Unloads a module of the main muc. Fails if it is not loaded, so that the after hook that loads it
     * again does not load a module that the config does not have.
     *
     * @param {string} name - The module.
     * @returns {Promise<void>}
     */
    async function unloadFromMainMuc(name) {
        assert.equal(await runLua(main, `return prosody.hosts["${MAIN_MUC}"].modules["${name}"] ~= nil`), 'true',
            `${name} is not loaded on ${MAIN_MUC}`);
        await prosodyShell(`module:unload("${name}", "${MAIN_MUC}")`, main);
    }

    /**
     * Returns the s2s session of the visitor muc component towards the main muc, or 'none'.
     *
     * @returns {Promise<string>}
     */
    function visitorMucStream() {
        return runLua(visitor, `local s = prosody.hosts["${VISITOR_MUC}"].s2sout["${MAIN_MUC}"];`
            + ' return s and s.type or "none"');
    }

    /**
     * Waits until check() resolves to true.
     *
     * @param {Function} check - Returns a promise of a boolean.
     * @param {string} what - What is waited for, for the error.
     * @returns {Promise<void>}
     */
    async function waitUntil(check, what) {
        const deadline = Date.now() + 10000;

        while (!await check()) {
            if (Date.now() > deadline) {
                throw new Error(`Timeout waiting for ${what}`);
            }
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    /**
     * Sends a join to the room from a JID of the visitor muc component. The visitor muc
     * component itself never sends such a join, this stands for a bug there.
     *
     * @param {string} room - The main room.
     * @param {string} nick - The nick.
     * @returns {Promise<string>}
     */
    function joinFromVisitorMuc(room, nick) {
        return runLua(visitor, 'local st = require "util.stanza";'
            + ` prosody.core_route_stanza(prosody.hosts["${VISITOR_MUC}"], st.presence({`
            + ` from = "someone@${VISITOR_MUC}/r", to = "${room}/${nick}" })`
            + ':tag("x", { xmlns = "http://jabber.org/protocol/muc" })); return "sent"');
    }

    // Same image as setup.js, which builds it first, so the build here is cached.
    before(async () => {
        environment = await new DockerComposeEnvironment(
            path.join(__dirname, 'docker', 'visitors'),
            'docker-compose.yml'
        )
            .withBuild()
            .withWaitStrategy('main-1', Wait.forListeningPorts())
            .withWaitStrategy('visitor-1', Wait.forListeningPorts())
            .up();

        main = environment.getContainer('main-1');
        visitor = environment.getContainer('visitor-1');
    });

    after(async () => {
        if (environment) {
            await environment.down({ removeVolumes: true });
        }
    });

    // s2s_whitelist checks a stream only when it opens, so a stream opened while a test had it unloaded
    // would still be used after it is loaded again. Every test starts with no s2s streams.
    beforeEach(async () => {
        const closeAll = 'for session in pairs(prosody.incoming_s2s) do session:close() end;'
            + ' for _, host in pairs(prosody.hosts) do'
            + ' for _, session in pairs(host.s2sout or {}) do session:close() end end; return "closed"';

        await runLua(main, closeAll);
        await runLua(visitor, closeAll);
    });

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients = [];
    });

    it('refuses a join from a client of the visitor node', async () => {
        const { room, participant } = await createMainRoom();
        const { nick, presence } = await joinFromVisitorNode(room);

        assert.equal(presence.attrs.type, 'error', `expected an error, got ${presence}`);
        await assert.rejects(presenceSeenBy(participant, room, nick), 'the participant saw the join');
    });

    it('closes the s2s stream when a stanza is from a host the stream is not authed for', async () => {
        const { room, participant } = await createMainRoom();

        // A message from the visitor muc component opens its stream to the main muc.
        await runLua(visitor, 'local st = require "util.stanza";'
            + ` prosody.core_route_stanza(prosody.hosts["${VISITOR_MUC}"],`
            + ` st.message({ from = "${VISITOR_MUC}", to = "${MAIN_MUC}" })); return "sent"`);
        await waitUntil(async () => await visitorMucStream() === 's2sout', 'the stream of the visitor muc');

        // The same stream, with a join from the client domain of the visitor node.
        await runLua(visitor, 'local st = require "util.stanza";'
            + ` local s = prosody.hosts["${VISITOR_MUC}"].s2sout["${MAIN_MUC}"];`
            + ` s.sends2s(st.presence({ from = "someone@v0.meet.jitsi/r", to = "${room}/other-host" })`
            + ':tag("x", { xmlns = "http://jabber.org/protocol/muc" })); return "sent"');

        await waitUntil(async () => await visitorMucStream() === 'none', 'the stream to be closed');
        await assert.rejects(presenceSeenBy(participant, room, 'other-host'), 'the participant saw the join');
    });

    it('refuses a join from a JID of the visitor muc component', async () => {
        const { room, participant } = await createMainRoom();

        await joinFromVisitorMuc(room, 'component');

        await assert.rejects(presenceSeenBy(participant, room, 'component'), 'the participant saw the join');
    });

    describe('with s2s_whitelist not loaded on the main muc', () => {
        before(() => unloadFromMainMuc('s2s_whitelist'));

        after(() => prosodyShell(`module:load("s2s_whitelist", "${MAIN_MUC}")`, main));

        it('token_verification refuses the join of a client of the visitor node', async () => {
            const { room, participant } = await createMainRoom();
            const { nick, presence } = await joinFromVisitorNode(room);

            assert.equal(presence.attrs.type, 'error', `expected an error, got ${presence}`);
            const error = presence.getChild('error');

            assert.ok(error?.getChild('not-allowed', STANZAS_NS), `expected not-allowed: ${presence}`);
            assert.equal(error.getChildText('text', STANZAS_NS), 'Joining over s2s is not allowed');
            await assert.rejects(presenceSeenBy(participant, room, nick), 'the participant saw the join');
        });

        describe('and token_verification not loaded', () => {
            before(() => unloadFromMainMuc('token_verification'));

            after(() => prosodyShell(`module:load("token_verification", "${MAIN_MUC}")`, main));

            // Shows that the tests above are refused by these two checks and by nothing else in the setup.
            it('lets a client of the visitor node join the main room', async () => {
                const { room, participant } = await createMainRoom();
                const { nick, presence } = await joinFromVisitorNode(room);

                assert.notEqual(presence.attrs.type, 'error', `expected a join, got ${presence}`);
                await presenceSeenBy(participant, room, nick);
            });
        });
    });

    describe('with token_verification not loaded on the main muc', () => {
        before(() => unloadFromMainMuc('token_verification'));

        after(() => prosodyShell(`module:load("token_verification", "${MAIN_MUC}")`, main));

        it('s2s_whitelist refuses the join of a client of the visitor node', async () => {
            const { room, participant } = await createMainRoom();
            const { nick, presence } = await joinFromVisitorNode(room);

            assert.equal(presence.attrs.type, 'error', `expected an error, got ${presence}`);
            await assert.rejects(presenceSeenBy(participant, room, nick), 'the participant saw the join');
        });

        // s2s_whitelist accepts the stream of the visitor muc component, so it is token_verification
        // that refuses this join (see 'refuses a join from a JID of the visitor muc component').
        it('lets a JID of the visitor muc component join the main room', async () => {
            const { room, participant } = await createMainRoom();

            await joinFromVisitorMuc(room, 'component');

            await presenceSeenBy(participant, room, 'component');
        });
    });
});
