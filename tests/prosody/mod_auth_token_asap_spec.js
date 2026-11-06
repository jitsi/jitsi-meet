import assert from 'assert';
import http from 'http';

import { mintAsapToken } from './helpers/jwt.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

/**
 * Fetches session-info for the given full JID.
 *
 * @param {string} jid
 * @returns {Promise<object>}
 */
function getSessionInfo(jid) {
    return new Promise((resolve, reject) => {
        const url = `http://localhost:5280/test-observer/session-info?jid=${encodeURIComponent(jid)}`;

        http.get(url, res => {
            let body = '';

            res.on('data', chunk => {
                body += chunk;
            });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`session-info returned ${res.statusCode}: ${body}`));

                    return;
                }
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error(`session-info bad JSON: ${body}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Connects to the main VirtualHost (RS256 / ASAP key-server auth).
 * Tokens must be signed with the test RSA private key; Prosody fetches the
 * matching public key from mod_test_observer_http's /asap-keys/ route.
 */
function asapClient(params) {
    return createXmppClient({ params });
}

describe('mod_auth_token (ASAP / RS256)', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('connects successfully with a valid RS256 token', async () => {
        const token = mintAsapToken({ room: '*' });
        const c = await asapClient({ token });

        clients.push(c);
        assert.ok(c.jid, 'client should have a JID after connecting');
    });

    it('rejects connection with wrong private key', async () => {
        // Sign with a freshly generated key that the server does not know.
        const { generateKeyPairSync } = await import('crypto');
        const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        const wrongPem = privateKey.export({ type: 'pkcs8',
            format: 'pem' });
        const token = mintAsapToken({}, { privateKey: wrongPem });

        await assert.rejects(
            () => asapClient({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with expired token', async () => {
        const token = mintAsapToken({}, { expired: true });

        await assert.rejects(
            () => asapClient({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with not-yet-valid token (nbf in the future)', async () => {
        const token = mintAsapToken({}, { notYetValid: true });

        await assert.rejects(
            () => asapClient({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with wrong issuer', async () => {
        const token = mintAsapToken({ iss: 'other-app' });

        await assert.rejects(
            () => asapClient({ token }),
            /not-allowed/
        );
    });

    it('sets session.jitsi_meet_context_features from token context', async () => {
        const token = mintAsapToken({
            room: '*',
            context: {
                features: {
                    'screen-sharing': true,
                    'recording': false
                }
            }
        });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_features['screen-sharing'], true);
        assert.strictEqual(info.jitsi_meet_context_features.recording, false);
    });

    it('sets session.jitsi_meet_room from room claim', async () => {
        const token = mintAsapToken({ room: 'testroom' });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_room, 'testroom');
    });

    it('sets session.jitsi_meet_context_user from token context', async () => {
        const token = mintAsapToken({
            room: '*',
            context: {
                user: { id: 'user-123',
                    name: 'Alice',
                    email: 'alice@example.com' }
            }
        });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_user.id, 'user-123');
        assert.strictEqual(info.jitsi_meet_context_user.name, 'Alice');
        assert.strictEqual(info.jitsi_meet_context_user.email, 'alice@example.com');
    });

    it('sets session.jitsi_meet_context_group from token context', async () => {
        const token = mintAsapToken({
            room: '*',
            context: { group: 'test-group' }
        });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_group, 'test-group');
    });

    it('sets session.jitsi_meet_context_user.id from top-level user_id when context is absent', async () => {
        const token = mintAsapToken({ room: '*',
            // eslint-disable-next-line camelcase
            user_id: 'legacy-user-456' });
        const c = await asapClient({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_user.id, 'legacy-user-456');
    });

    it('allows connection without token when allow_empty_token is true', async () => {
        const c = await asapClient({});

        clients.push(c);
        assert.ok(c.jid, 'client should have a JID');
    });

    // ── Room regex claim: supported syntax ────────────────────────────────────
    //
    // When context.room.regex == true, verify_room() matches the JWT room claim
    // against the room name at MUC join time. The only special sequence is one
    // '.*', which matches any run of characters. Every other character must
    // match literally, and the claim must match the whole room name. A claim
    // with more than one '.*', or with any other Lua pattern character, is
    // refused with <invalid-regex/>, which distinguishes it from a claim that
    // was evaluated and did not match (<room-name-does-not-match/>).

    /**
     * Joins roomJid with a token whose room claim is the given pattern.
     *
     * @param {string} roomJid - The room to join.
     * @param {string|number|undefined} pattern - The room claim, flagged as a pattern.
     * @param {object} [opts]
     * @param {string} [opts.domain] - The VirtualHost to connect to (default: localhost).
     * @param {string} [opts.sub] - The sub claim (default: '*').
     * @returns {Promise<object>} The presence the join returns.
     */
    async function joinWithPattern(roomJid, pattern, { domain, sub } = {}) {
        const token = mintAsapToken({
            room: pattern,
            context: { room: { regex: true } },
            ...sub === undefined ? {} : { sub }
        });

        const focus = await joinWithFocus(roomJid);
        const c = await createXmppClient({ domain,
            params: { token } });

        clients.push(focus, c);

        return c.joinRoom(roomJid);
    }

    /**
     * Asserts that a join was refused with the given error condition.
     *
     * @param {object} presence - The presence the join returned.
     * @param {string} condition - The expected error condition.
     * @returns {void}
     */
    function assertJoinError(presence, condition) {
        assert.equal(presence.attrs.type, 'error',
            `join must be rejected: ${presence.toString()}`);
        assert.ok(
            presence.getChild('error')?.getChild(condition),
            `error must contain <${condition}/>: ${presence.toString()}`
        );
    }

    /**
     * Asserts that a join succeeded.
     *
     * @param {object} presence - The presence the join returned.
     * @returns {void}
     */
    function assertJoinOk(presence) {
        assert.notEqual(presence.attrs.type, 'error',
            `join must succeed: ${presence.toString()}`);
    }

    it('does not crash on connect with an unsupported regex room claim', async () => {
        // process_and_verify_token only stores the claim; it does not evaluate
        // the pattern. The pattern is checked in verify_room(), at MUC join.
        const token = mintAsapToken({
            room: '(invalid',
            context: { room: { regex: true } }
        });
        const c = await asapClient({ token });

        clients.push(c);
        assert.ok(c.jid, 'connection must succeed: pattern not evaluated at auth time');
    });

    it('rejects MUC join with an unbalanced capture in the regex room claim', async () => {
        const presence = await joinWithPattern(
            `regex-invalid-${Date.now()}@conference.localhost`, '(invalid');

        assertJoinError(presence, 'invalid-regex');
    });

    it('accepts MUC join when the room name starts with the prefix before .*', async () => {
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxpre_${id}_7@conference.localhost`, `rxpre_${id}.*`));
    });

    it('accepts MUC join when the room name is exactly the prefix before .*', async () => {
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxexact_${id}@conference.localhost`, `rxexact_${id}.*`));
    });

    it('accepts MUC join when the room name has the prefix and suffix around .*', async () => {
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxmid_${id}_any_tail@conference.localhost`,
            `rxmid_${id}.*_tail`));
    });

    it('accepts MUC join with a regex room claim that has no .*', async () => {
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxlit_${id}@conference.localhost`, `rxlit_${id}`));
    });

    it('lowercases a regex room claim before it is matched', async () => {
        // Room names are lowercase. The claim must be lowercased, the same as a
        // claim that is not a pattern.
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxcase_${id}_1@conference.localhost`, `RxCase_${id}.*`));
    });

    it('rejects MUC join when the prefix is not at the start of the room name', async () => {
        const id = Date.now();

        assertJoinError(await joinWithPattern(`x_rxstart_${id}@conference.localhost`, `rxstart_${id}.*`),
            'room-name-does-not-match');
    });

    it('rejects MUC join when the room name does not end with the suffix', async () => {
        const id = Date.now();

        assertJoinError(await joinWithPattern(`rxend_${id}_tail_x@conference.localhost`, `rxend_${id}.*_tail`),
            'room-name-does-not-match');
    });

    it('rejects MUC join when the prefix and suffix overlap in the room name', async () => {
        // The room name has the prefix 'rxover_<id>_ab' and the suffix 'b',
        // but only because they share the last 'b'. The room name is too
        // short to hold both.
        const id = Date.now();

        assertJoinError(await joinWithPattern(`rxover_${id}_ab@conference.localhost`, `rxover_${id}_ab.*b`),
            'room-name-does-not-match');
    });

    it('rejects MUC join when the regex room claim has two .*', async () => {
        const id = Date.now();

        assertJoinError(await joinWithPattern(`rxtwo_${id}_a_tail@conference.localhost`, `rxtwo_${id}.*_.*`),
            'invalid-regex');
    });

    it('rejects MUC join when the regex room claim uses a Lua pattern class', async () => {
        const id = Date.now();

        assertJoinError(await joinWithPattern(`rxclass_${id}@conference.localhost`, 'rxclass_%d+'),
            'invalid-regex');
    });

    it('rejects MUC join when the regex room claim has a . without *', async () => {
        const id = Date.now();

        assertJoinError(await joinWithPattern(`rxdot_${id}@conference.localhost`, `rxdot.${id}`),
            'invalid-regex');
    });

    it('rejects MUC join when the regex room claim has a - quantifier', async () => {
        const id = Date.now();

        assertJoinError(await joinWithPattern(`rxdash-${id}@conference.localhost`, `rxdash-${id}`),
            'invalid-regex');
    });

    // ── Room regex claim: room name length limit ──────────────────────────────
    //
    // verify_room() refuses to match a room name that is longer than
    // token_regex_room_max_length (128), and reports <invalid-regex/>.

    it('rejects MUC join when the room name is too long to match a regex claim', async () => {
        const CONFERENCE = 'conference.localhost';

        // Over the 128-char room-name limit.
        const roomJid = `${'x'.repeat(150)}${Date.now()}@${CONFERENCE}`;

        // '.*' matches any room name, so without the length limit this join
        // would be allowed.
        const token = mintAsapToken({
            room: '.*',
            context: { room: { regex: true } }
        });

        const focus = await joinWithFocus(roomJid);
        const c = await asapClient({ token });

        clients.push(focus, c);

        const presence = await c.joinRoom(roomJid);

        assert.equal(presence.attrs.type, 'error', 'join must be rejected');
        assert.ok(
            presence.getChild('error')?.getChild('invalid-regex'),
            `long room name must not be matched: ${presence.toString()}`
        );
    });

    // ── Room regex claim: token_regex_enabled = false ─────────────────────────
    //
    // conference.noregex.test has a parent host that sets
    // token_regex_enabled = false, so a room claim flagged as a pattern is
    // refused instead of matched. The same claim is accepted on
    // conference.localhost, where the option keeps its default.

    it('rejects MUC join with a regex room claim when patterns are disabled', async () => {
        const roomName = `rxoff${Date.now()}`;
        const roomJid = `${roomName}@conference.noregex.test`;

        // Matches the room name, so only the disabled option can reject it.
        const token = mintAsapToken({
            room: 'rxoff.*',
            context: { room: { regex: true } }
        });

        const focus = await joinWithFocus(roomJid);
        const c = await createXmppClient({ domain: 'noregex.test',
            params: { token } });

        clients.push(focus, c);

        const presence = await c.joinRoom(roomJid);

        assert.equal(presence.attrs.type, 'error', 'join must be rejected');
        assert.ok(
            presence.getChild('error')?.getChild('invalid-regex'),
            `pattern must be refused: ${presence.toString()}`
        );
    });

    it('accepts the same regex room claim on a host where patterns are enabled', async () => {
        const roomName = `rxoff${Date.now()}`;
        const roomJid = `${roomName}@conference.localhost`;

        const token = mintAsapToken({
            room: 'rxoff.*',
            context: { room: { regex: true } }
        });

        const focus = await joinWithFocus(roomJid);
        const c = await asapClient({ token });

        clients.push(focus, c);

        const presence = await c.joinRoom(roomJid);

        assert.notEqual(presence.attrs.type, 'error',
            `join must succeed: ${presence.toString()}`);
    });

    it('rejects a non-matching regex room claim as unsupported when patterns are disabled', async () => {
        // The disabled-patterns check runs before the match, so the error is
        // <invalid-regex/> and not <room-name-does-not-match/>.
        const presence = await joinWithPattern(`rxoffmiss${Date.now()}@conference.noregex.test`,
            'other.*', { domain: 'noregex.test' });

        assertJoinError(presence, 'invalid-regex');
    });

    // ── Room regex claim: a claim that does not match is not a missing claim ──
    //
    // On conference.noclaim.test the room claim is optional. A token without a
    // room claim can join any room. A pattern that is present but does not
    // match must still be refused: it must not be treated as a missing claim.

    it('rejects MUC join when the regex room claim does not match and the room claim is optional', async () => {
        const presence = await joinWithPattern(`rxopt${Date.now()}@conference.noclaim.test`,
            'other.*', { domain: 'noclaim.test' });

        assertJoinError(presence, 'room-name-does-not-match');
    });

    it('accepts MUC join when the regex room claim matches and the room claim is optional', async () => {
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxopt_${id}_x@conference.noclaim.test`,
            `rxopt_${id}.*`, { domain: 'noclaim.test' }));
    });

    it('rejects MUC join when a literal room claim does not match and the room claim is optional', async () => {
        const roomJid = `rxoptlit${Date.now()}@conference.noclaim.test`;
        const token = mintAsapToken({ room: 'other' });

        const focus = await joinWithFocus(roomJid);
        const c = await createXmppClient({ domain: 'noclaim.test',
            params: { token } });

        clients.push(focus, c);

        assertJoinError(await c.joinRoom(roomJid), 'not-allowed');
    });

    it('rejects MUC join with a regex flag but no room claim when the room claim is optional', async () => {
        // The token connects, because the room claim is optional. The pattern
        // flag without a claim is refused at join.
        const presence = await joinWithPattern(`rxoptnone${Date.now()}@conference.noclaim.test`,
            undefined, { domain: 'noclaim.test' });

        assertJoinError(presence, 'invalid-regex');
    });

    // ── Room regex claim: tenant boundary ─────────────────────────────────────
    //
    // The pattern is matched against the room name without its tenant. The
    // tenant of the room must still equal the sub claim of the token.
    // mod_muc_domain_mapper maps room@conference.<tenant>.localhost to
    // [<tenant>]room@conference.localhost.

    it('rejects MUC join when the regex room claim matches but the tenant differs', async () => {
        const presence = await joinWithPattern(`rxtenant${Date.now()}@conference.tenantb.localhost`,
            '.*', { sub: 'tenanta' });

        assertJoinError(presence, 'not-allowed');
    });

    it('accepts MUC join when the regex room claim matches in the tenant of the token', async () => {
        assertJoinOk(await joinWithPattern(`rxtenant${Date.now()}@conference.tenanta.localhost`,
            '.*', { sub: 'tenanta' }));
    });

    // ── Room regex claim: edge cases of the matcher ───────────────────────────

    it('accepts MUC join with a regex room claim of only .*', async () => {
        assertJoinOk(await joinWithPattern(`rxany${Date.now()}@conference.localhost`, '.*'));
    });

    it('accepts MUC join when the regex room claim is only a suffix after .*', async () => {
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxsuf_${id}_tail@conference.localhost`, `.*_${id}_tail`));
    });

    it('rejects MUC join when the regex room claim is an empty string', async () => {
        // An empty pattern has no '.*' and matches only an empty room name,
        // which does not exist.
        assertJoinError(await joinWithPattern(`rxempty${Date.now()}@conference.localhost`, ''),
            'room-name-does-not-match');
    });

    it('accepts MUC join with a regex room claim of * as the wildcard', async () => {
        // The wildcard check runs before the pattern check, so '*' keeps its
        // meaning also when the claim is flagged as a pattern.
        assertJoinOk(await joinWithPattern(`rxstar${Date.now()}@conference.localhost`, '*'));
    });

    for (const pattern of [ '.*.*', '..*', '.**', 'a*.b' ]) {
        it(`rejects MUC join when the regex room claim is ${pattern}`, async () => {
            assertJoinError(await joinWithPattern(`rxbad${Date.now()}@conference.localhost`, pattern),
                'invalid-regex');
        });
    }

    it('accepts MUC join when the room name is exactly the prefix and the suffix', async () => {
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxgap_${id}_tail@conference.localhost`, `rxgap_${id}.*_tail`));
    });

    it('rejects MUC join when the room name is shorter than the prefix and the suffix', async () => {
        const id = Date.now();

        // 'rxgap_<id>_tai' ends with '_tai', not '_tail', and is one character
        // too short to hold both parts.
        assertJoinError(await joinWithPattern(`rxgap_${id}_tai@conference.localhost`, `rxgap_${id}.*_tail`),
            'room-name-does-not-match');
    });

    it('rejects MUC join when the room name is shorter than the prefix', async () => {
        const tag = String(Date.now());

        assertJoinError(await joinWithPattern(`rxs${tag}@conference.localhost`, `rxs${tag}longerprefix.*`),
            'room-name-does-not-match');
    });

    it('accepts MUC join when the regex room claim prefix is a prefix of a longer id', async () => {
        // 'demo_4.*' also matches 'demo_40'. This is how prefixes work, and the
        // issuer must take it into account.
        const id = Date.now();

        assertJoinOk(await joinWithPattern(`rxid_${id}0@conference.localhost`, `rxid_${id}.*`));
    });

    it('rejects MUC join when the regex room claim is a number, and stays up', async () => {
        assertJoinError(await joinWithPattern(`rxnum${Date.now()}@conference.localhost`, 123),
            'invalid-regex');

        // Prosody must still serve the next join.
        assertJoinOk(await joinWithPattern(`rxnumok${Date.now()}@conference.localhost`, '.*'));
    });

    it('accepts MUC join when the room name is exactly token_regex_room_max_length', async () => {
        const tag = String(Date.now());
        const roomName = `${'r'.repeat(128 - tag.length)}${tag}`;

        assertJoinOk(await joinWithPattern(`${roomName}@conference.localhost`, '.*'));
    });

    it('rejects MUC join when the room name is one longer than token_regex_room_max_length', async () => {
        const tag = String(Date.now());
        const roomName = `${'r'.repeat(129 - tag.length)}${tag}`;

        assertJoinError(await joinWithPattern(`${roomName}@conference.localhost`, '.*'), 'invalid-regex');
    });

    // ── Room regex claim: pattern length ──────────────────────────────────────
    //
    // A pattern longer than token_regex_room_max_length plus the two characters
    // of '.*' can never match a room name that passes the length check. It is
    // refused without a match, and the log line holds a truncated pattern.

    it('rejects MUC join when the regex room claim is longer than the room name limit', async () => {
        assertJoinError(await joinWithPattern(`rxlong${Date.now()}@conference.localhost`,
            `${'a'.repeat(131)}.*`), 'invalid-regex');
    });

    it('rejects MUC join with a very long regex room claim, and stays up', async () => {
        assertJoinError(await joinWithPattern(`rxhuge${Date.now()}@conference.localhost`,
            `${'a'.repeat(4000)}.*`), 'invalid-regex');

        assertJoinOk(await joinWithPattern(`rxhugeok${Date.now()}@conference.localhost`, '.*'));
    });
});
