import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { getSessionFeatures } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const PERMISSIONS_NS = 'http://jitsi.org/jitmeet';

let _roomCounter = 0;
const nextRoom = () => `permissions-${++_roomCounter}@${CONFERENCE}`;

// Keys present in the default_permissions table in mod_jitsi_permissions.lua.
const DEFAULT_PERMISSION_KEYS = [
    'livestreaming', 'recording', 'transcription',
    'outbound-call', 'create-polls', 'send-groupchat', 'flip'
];

/**
 * Extracts the <permissions xmlns='http://jitsi.org/jitmeet'> element from a
 * presence stanza and returns its children as a plain { name: val } map.
 * Returns null when the element is absent.
 *
 * @param {object} presence
 * @returns {object|null}
 */
function getPermissions(presence) {
    const el = presence.getChild('permissions', PERMISSIONS_NS);

    if (!el) {
        return null;
    }
    const result = {};

    for (const p of el.getChildren('p')) {
        result[p.attrs.name] = p.attrs.val;
    }

    return result;
}

describe('mod_jitsi_permissions', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    /**
     * Creates a connected XMPP client and tracks it for afterEach cleanup.
     *
     * @param {object} [opts]  Options forwarded to createXmppClient.
     * @returns {Promise<object>}
     */
    async function connect(opts) {
        const c = await createXmppClient(opts);

        clients.push(c);

        return c;
    }

    // ── moderator token, no features ──────────────────────────────────────────
    //
    // mod_token_affiliation grants owner/moderator on join.
    // mod_jitsi_permissions sees: is_moderator=true, send_default_permissions_to
    // flag set (by muc-pre-set-affiliation from set_affiliation call inside
    // token_affiliation), no jitsi_meet_context_features on session → injects
    // all defaults.

    describe('moderator token without features', () => {

        it('injects all default permissions into self-presence on join', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const token = mintAsapToken({ context: { user: { moderator: true } } });
            const c = await connect({ params: { token } });
            const presence = await c.joinRoom(r);

            const perms = getPermissions(presence);

            assert.ok(perms !== null, 'permissions element should be present');

            for (const key of DEFAULT_PERMISSION_KEYS) {
                assert.strictEqual(perms[key], 'true', `expected ${key}=true`);
            }
        });

    });

    // ── moderator token with features ─────────────────────────────────────────
    //
    // mod_token_affiliation grants owner/moderator.
    // filter_stanza sees auth_token + jitsi_meet_context_features both set →
    // skips injection entirely so the client uses its own token-provided features.

    describe('moderator token with features', () => {

        it('does not inject permissions when token already contains features', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const token = mintAsapToken({
                context: {
                    user: { moderator: true },
                    features: {
                        recording: false,
                        'screen-sharing': true
                    }
                }
            });
            const c = await connect({ params: { token } });
            const presence = await c.joinRoom(r);

            assert.strictEqual(
                getPermissions(presence),
                null,
                'permissions should not be injected when token already provides features'
            );
        });

    });

    // ── non-moderator token ───────────────────────────────────────────────────
    //
    // mod_token_affiliation grants member affiliation (participant role).
    // filter_stanza checks is_moderator=false → returns stanza unchanged.

    describe('non-moderator token', () => {

        it('does not inject permissions for member participant', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const token = mintAsapToken({ context: { user: { id: 'user1' } } });
            const c = await connect({ params: { token } });
            const presence = await c.joinRoom(r);

            assert.strictEqual(
                getPermissions(presence),
                null,
                'permissions should not be injected for non-moderator participant'
            );
        });

        it('does not inject permissions for member with features', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const token = mintAsapToken({
                context: {
                    user: { moderator: false },
                    features: { recording: true }
                }
            });
            const c = await connect({ params: { token } });
            const presence = await c.joinRoom(r);

            assert.strictEqual(
                getPermissions(presence),
                null,
                'permissions should not be injected for non-moderator even with features'
            );
        });

    });

    // ── anonymous user (no token) ─────────────────────────────────────────────
    //
    // token_affiliation is a no-op → affiliation=none, role=participant.
    // muc-pre-set-affiliation never fires → send_default_permissions_to not set.
    // filter_stanza: is_moderator=false → no injection.

    describe('anonymous user (no token)', () => {

        it('does not inject permissions for anonymous participant', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const c = await connect();
            const presence = await c.joinRoom(r);

            assert.strictEqual(
                getPermissions(presence),
                null,
                'permissions should not be injected for anonymous user'
            );
        });

    });

    // ── session features via HTTP ─────────────────────────────────────────────
    //
    // Verify that jitsi_meet_context_features is set correctly on the Prosody
    // session after joining.  These assertions read the live session state (not
    // the resource-bind snapshot) so they also capture side-effects from
    // filter_stanza, which writes default_permissions onto the session for
    // moderators who joined without token features.

    describe('session features (via HTTP)', () => {

        it('sets token features on session for moderator with features', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const token = mintAsapToken({
                context: {
                    user: { moderator: true },
                    features: {
                        recording: false,
                        livestreaming: false
                    }
                }
            });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const features = await getSessionFeatures(c.jid);

            assert.strictEqual(features.recording, false);
            assert.strictEqual(features.livestreaming, false);
        });

        it('sets token features on session for non-moderator with features', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const token = mintAsapToken({
                context: {
                    user: { id: 'user1' },
                    features: {
                        recording: false,
                        transcription: true
                    }
                }
            });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const features = await getSessionFeatures(c.jid);

            assert.strictEqual(features.recording, false);
            assert.strictEqual(features.transcription, true);
        });

        it('sets default permissions on session for moderator without token features', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const token = mintAsapToken({ context: { user: { moderator: true } } });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const features = await getSessionFeatures(c.jid);

            assert.ok(features !== null, 'features should be set by filter_stanza');
            for (const key of DEFAULT_PERMISSION_KEYS) {
                assert.strictEqual(features[key], true, `expected ${key}=true`);
            }
        });

        it('sets no features on session for non-moderator without token features', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const token = mintAsapToken({ context: { user: { id: 'user1' } } });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const features = await getSessionFeatures(c.jid);

            assert.strictEqual(features, null);
        });

    });

});
