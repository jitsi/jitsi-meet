import assert from 'assert';

import { getContainer } from './helpers/container.js';
import { mintAsapToken } from './helpers/jwt.js';
import { setAccessManagerResponse } from './helpers/test_observer.js';
import { createXmppClient } from './helpers/xmpp_client.js';

// VPaaS tenant prefix — mod_muc_auth_ban only calls the access manager for
// sessions whose jitsi_web_query_prefix starts with this string.
// The prefix is set from the ?prefix= WebSocket URL param by mod_jitsi_session.
const VPAAS_PREFIX = 'vpaas-magic-cookie-test';

// Tokens are RS256 (deterministic): same payload in the same second → same
// token string. Use a per-test jti so each test gets a unique token and cannot
// accidentally match a token that was cached as banned by an earlier test.
let _tokenCounter = 0;
const freshToken = () => mintAsapToken({ room: '*',
    jti: `ban-test-${++_tokenCounter}` });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates an XMPP client that identifies as a VPaaS session.
 * Passes ?prefix=<VPAAS_PREFIX>&token=<token> in the WebSocket URL so that
 * mod_jitsi_session populates jitsi_web_query_prefix, which mod_muc_auth_ban
 * uses to decide whether to call the external access manager.
 *
 * @param {string} token  A valid login JWT (RS256 / HS256).
 * @param {object} [opts]  Extra createXmppClient options.
 * @returns {Promise<XmppTestClient>}
 */
function createVpaasClient(token, opts = {}) {
    return createXmppClient({
        ...opts,
        params: { prefix: VPAAS_PREFIX,
            token }
    });
}

/**
 * Asserts that a VPaaS session is banned, whichever way the ban surfaces.
 *
 * mod_muc_auth_ban's HTTP callback calls session:close(), and where that lands
 * depends on when the access manager answers relative to the client's session
 * setup. All of these are the same ban, so accept any of them, and return
 * which one was seen so a test that pins the timing can check it:
 *
 * - 'sasl': the close lands before the client restarts the stream after SASL.
 *   The client reconnects, and the token, now cached as banned, is refused
 *   during SASL (not-allowed).
 * - 'restart': the close lands between SASL success and resource binding.
 *   start() rejects once the server has closed the stream. Either the restart
 *   writes to the already reset socket ("Cannot read properties of null
 *   (reading 'write')"), the WebSocket reports the close as an error (both
 *   TypeErrors), or the restart is written while the WebSocket is still
 *   closing and ws fails the send ("WebSocket is not open: readyState 2
 *   (CLOSING)", a plain Error).
 * - 'online': the close lands after the session is online and ends it.
 *
 * @param {string} token  A login JWT the access manager will reject.
 * @param {string} message  Assertion message.
 * @param {object} [opts]  Extra createXmppClient options.
 * @returns {Promise<'sasl'|'restart'|'online'>}
 */
async function assertBanned(token, message, opts) {
    let client;

    try {
        client = await createVpaasClient(token, opts);
    } catch (e) {
        if (/not-allowed/.test(String(e))) {
            return 'sasl';
        }

        assert.ok(e?.streamClosed && (e instanceof TypeError || /^WebSocket is not open/.test(e.message)),
            `${message}: ${e}`);

        return 'restart';
    }

    // established, so the close must follow
    const disconnected = await client.waitForDisconnect(5000).then(() => true, () => false);

    // stop the client either way, or its reconnect retries in the background
    await client.disconnect();

    assert.ok(disconnected, message);

    return 'online';
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mod_muc_auth_ban', () => {

    afterEach(async () => {
        // Reset the mock access manager to the default (allow, HTTP 200)
        // so that each test starts from a clean state.
        await setAccessManagerResponse({ access: true,
            status: 200 });
    });

    // ── No token ─────────────────────────────────────────────────────────────
    //
    // mod_muc_auth_ban checks session.auth_token first. When nil it returns
    // nil (not false), so the ban-check event has no effect and auth proceeds.

    it('user without a token is allowed (ban check is a no-op)', async () => {
        // No token param → session.auth_token is nil → shouldAllow returns nil.
        // VirtualHost "localhost" has allow_empty_token = true so auth still succeeds.
        const c = await createXmppClient();

        await c.disconnect();
    });

    // ── Non-VPaaS tenant ─────────────────────────────────────────────────────
    //
    // mod_muc_auth_ban returns true immediately for tenants whose prefix does
    // NOT start with "vpaas-magic-cookie-". The access manager is never called.

    it('non-VPaaS user with a valid token is allowed without an HTTP check', async () => {
        // Configure the mock to return an error — if the module calls it for
        // non-VPaaS sessions this test will catch that regression.
        await setAccessManagerResponse({ status: 500 });

        const token = freshToken();

        // No ?prefix= param → jitsi_web_query_prefix is "" → bypasses VPaaS check.
        const c = await createXmppClient({ params: { token } });

        await c.disconnect();
    });

    // ── VPaaS — access granted ────────────────────────────────────────────────

    it('VPaaS user is allowed when access manager returns access=true', async () => {
        await setAccessManagerResponse({ access: true });

        const token = freshToken();
        const c = await createVpaasClient(token);

        // Stay connected for a moment to confirm the async HTTP response does
        // not trigger a session close.
        await new Promise(resolve => setTimeout(resolve, 500));

        await c.disconnect();
    });

    // ── VPaaS — access denied ─────────────────────────────────────────────────
    //
    // When access=false, mod_muc_auth_ban's HTTP callback calls session:close()
    // and caches the token. The access manager runs on the same Prosody process
    // (loopback), so the callback usually lands before the client restarts the
    // stream and the client's reconnect is refused during SASL by the cache.
    // Under load it can land mid-restart or after the session is online
    // instead. assertBanned accepts all three.

    it('VPaaS user is rejected when access manager returns access=false', async () => {
        await setAccessManagerResponse({ access: false });

        await assertBanned(freshToken(),
            'VPaaS user must be rejected when access manager returns access=false');
    });

    // The two tests below pin the ban to one point in session setup. The mock
    // holds its reply for 100 ms, by which time the client is normally online.
    // Holding the client's stream restart for longer than that makes the close
    // land after SASL success but before resource binding instead. Each test
    // checks the path it saw, so a timing that drifts fails rather than passes
    // through one of the other paths.

    it('ban landing after the session is online closes it', async () => {
        await setAccessManagerResponse({ access: false,
            delay: 0.1 });

        const path = await assertBanned(freshToken(), 'online session must be closed by a late ban');

        assert.strictEqual(path, 'online', 'ban must land after the session is online');
    });

    it('ban landing between SASL success and resource binding is a rejection', async () => {
        await setAccessManagerResponse({ access: false,
            delay: 0.1 });

        const path = await assertBanned(freshToken(),
            'session must be rejected by a ban that lands mid-restart', { restartDelay: 300 });

        assert.strictEqual(path, 'restart', 'ban must land between SASL success and resource binding');
    });

    // ── Cached ban ────────────────────────────────────────────────────────────
    //
    // When a token is rejected (access=false), mod_muc_auth_ban caches it with a
    // 5-minute TTL. Subsequent connections with the same token hit the Lua LRU
    // cache (no HTTP request) and are rejected immediately — even after the mock
    // access manager is reset to allow. This verifies the cache is active.

    it('cached banned token is rejected even when access manager is reset to allow', async () => {
        // Step 1: Ban the token — cb fires, token enters the LRU cache.
        await setAccessManagerResponse({ access: false });

        const token = freshToken();

        await assertBanned(token, 'initial ban must be rejected');

        // Step 2: Reset the mock to allow. A fresh token must now succeed,
        // proving the cache — not the mock response — drives the next rejection.
        await setAccessManagerResponse({ access: true });

        const fresh = await createVpaasClient(freshToken());

        await fresh.disconnect();

        // Step 3: Same banned token must still be rejected (cache wins over mock).
        await assertBanned(token,
            'cached banned token must be rejected even when mock is reset to allow');
    });

    // ── HTTP error — fail open ────────────────────────────────────────────────
    //
    // If the access manager returns a non-200 response, mod_muc_auth_ban logs
    // a warning and does nothing — the session is NOT closed (fail open).

    it('HTTP error from access manager does not ban the user (fail open)', async () => {
        await setAccessManagerResponse({ status: 500 });

        const token = freshToken();
        const c = await createVpaasClient(token);

        // Wait long enough for the async HTTP callback to have fired.
        await new Promise(resolve => setTimeout(resolve, 500));

        // The client must still be connected.  waitForDisconnect would reject
        // after the timeout — instead, assert the connection is alive by
        // verifying disconnect() completes cleanly.
        await c.disconnect();
    });

    // ── Non-JSON 200 — should fail open without crashing ─────────────────────
    //
    // When the access manager returns HTTP 200 but with a non-JSON body,
    // json.decode() returns nil. mod_muc_auth_ban then calls r['access'] on
    // nil, which crashes the callback. The crash must not affect the session
    // (fail open: user stays connected).

    it('non-JSON 200 from access manager does not crash or ban the user (fail open)', async () => {
        await setAccessManagerResponse({ nonJson: true });

        const token = freshToken();
        const c = await createVpaasClient(token);

        // Wait long enough for the async HTTP callback to have fired and crashed.
        await new Promise(resolve => setTimeout(resolve, 500));

        // Session must still be alive despite the callback crash.
        const disconnected = await c.waitForDisconnect(300).then(() => true, () => false);

        assert.strictEqual(disconnected, false,
            'session must remain alive when access manager returns non-JSON 200');

        await c.disconnect();
    });

    // ── Non-JSON 200 — Lua error in callback ─────────────────────────────────
    //
    // cjson.safe returns nil (not an error) for invalid JSON, so json.decode()
    // returns nil when the access manager body is not JSON. Without a nil guard,
    // r['access'] on the nil value crashes the callback with "attempt to index
    // a nil value". This test catches that crash by asserting that no such error
    // appears in the Prosody log during the test window.

    it('non-JSON 200 does not produce a Lua error in the HTTP callback', async () => {
        const since = Math.floor(Date.now() / 1000);

        await setAccessManagerResponse({ nonJson: true });
        const token = freshToken();
        const c = await createVpaasClient(token);

        // Give the async HTTP callback time to fire (and crash if the bug is present).
        await new Promise(resolve => setTimeout(resolve, 600));
        await c.disconnect();

        // Collect Prosody log output from this test's window.
        const until = Math.floor(Date.now() / 1000) + 1;
        const container = getContainer();
        const stream = await container.logs({ since,
            until });
        const logs = await new Promise((resolve, reject) => {
            const chunks = [];
            const timer = setTimeout(() => resolve(chunks.join('')), 2000);

            stream.on('data', chunk => chunks.push(chunk.toString()));
            stream.on('end', () => {
                clearTimeout(timer);
                resolve(chunks.join(''));
            });
            stream.on('error', reject);
        });

        assert.ok(
            !logs.includes('attempt to index a nil value'),
            'mod_muc_auth_ban HTTP callback must not crash on non-JSON 200 response '
            + '(missing nil guard on json.decode result)'
        );
    });

});
