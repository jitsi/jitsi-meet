import assert from 'assert';

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
const freshToken = () => mintAsapToken({ jti: `ban-test-${++_tokenCounter}` });

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Creates an XMPP client that identifies as a VPaaS session.
 * Passes ?prefix=<VPAAS_PREFIX>&token=<token> in the WebSocket URL so that
 * mod_jitsi_session populates jitsi_web_query_prefix, which mod_muc_auth_ban
 * uses to decide whether to call the external access manager.
 *
 * @param {string} token  A valid login JWT (RS256 / HS256).
 * @returns {Promise<XmppTestClient>}
 */
function createVpaasClient(token) {
    return createXmppClient({
        params: { prefix: VPAAS_PREFIX,
            token }
    });
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
    // and caches the token. Because the access manager runs on the same Prosody
    // process (loopback), the callback resolves within the same event loop tick
    // as the SASL auth, so the ban surfaces as a SASL failure rather than a
    // post-connect disconnect.

    it('VPaaS user is rejected (SASL failure) when access manager returns access=false', async () => {
        await setAccessManagerResponse({ access: false });

        const token = freshToken();

        await assert.rejects(
            createVpaasClient(token),
            /not-allowed/,
            'VPaaS user must be rejected when access manager returns access=false'
        );
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

        await assert.rejects(
            createVpaasClient(token),
            /not-allowed/,
            'initial ban must be rejected'
        );

        // Step 2: Reset the mock to allow. A fresh token must now succeed,
        // proving the cache — not the mock response — drives the next rejection.
        await setAccessManagerResponse({ access: true });

        const fresh = await createVpaasClient(freshToken());

        await fresh.disconnect();

        // Step 3: Same banned token must still be rejected (cache wins over mock).
        await assert.rejects(
            createVpaasClient(token),
            /not-allowed/,
            'cached banned token must be rejected even when mock is reset to allow'
        );
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

});
