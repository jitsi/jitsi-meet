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

            const token = mintAsapToken({ room: r.split('@')[0],
                context: { user: { moderator: true } } });
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
                room: r.split('@')[0],
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

            const token = mintAsapToken({ room: r.split('@')[0],
                context: { user: { id: 'user1' } } });
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
                room: r.split('@')[0],
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


    // ── affiliation grant and revoke ──────────────────────────────────────────
    //
    // When a moderator grants owner affiliation to another participant,
    // process_set_affiliation copies the granting session's feature table onto
    // the recipient's session.  When the affiliation is revoked, the recipient
    // must go back to the features that its own token supplied, or to no
    // features at all when the token supplied none.  A session that keeps the
    // granted table stays allowed by is_feature_allowed(), which does not look
    // at the current role once a feature table is present.

    describe('affiliation grant and revoke', () => {

        /**
         * Joins a room as a moderator that holds every default feature.
         * Use it as the actor that grants and revokes owner affiliation.
         *
         * @param {Function} connectFn  the spec-local connect helper.
         * @param {string} roomJid      e.g. 'room@conference.localhost'
         * @returns {Promise<object>}
         */
        async function joinAsGranter(connectFn, roomJid, extraParams = {}) {
            const features = {};

            for (const key of DEFAULT_PERMISSION_KEYS) {
                features[key] = true;
            }

            const token = mintAsapToken({
                room: roomJid.split('@')[0],
                context: {
                    user: { id: 'granter',
                        moderator: true },
                    features
                }
            });
            const c = await connectFn({ params: { token,
                ...extraParams } });

            await c.joinRoom(roomJid);

            return c;
        }

        /**
         * Sends a Jibri start IQ and returns the name of the error condition
         * that comes back. mod_filter_iq_jibri answers 'forbidden' when it
         * blocks the request. Anything else means the IQ was routed on to the
         * focus occupant, which has no Jibri handler in these tests.
         *
         * @param {object} client   the sender.
         * @param {string} roomJid  e.g. 'room@conference.localhost'
         * @returns {Promise<string|null>}
         */
        async function jibriStartErrorCondition(client, roomJid) {
            const wait = client.waitForIq(iq => iq.attrs.type === 'error', 5000);

            client.sendJibriIq(roomJid, 'start', 'file');

            const error = (await wait).getChild('error');

            return error ? error.children[0].name : null;
        }

        /**
         * Sends a Rayo dial IQ and returns the name of the error condition that
         * comes back. mod_filter_iq_rayo answers 'forbidden' when it blocks the
         * request. Anything else means the IQ was routed on to the focus
         * occupant, which has no Rayo handler in these tests.
         *
         * @param {object} client   the sender.
         * @param {string} roomJid  e.g. 'room@conference.localhost'
         * @returns {Promise<string|null>}
         */
        async function rayoDialErrorCondition(client, roomJid) {
            const reply = await client.sendRayoIqAndWait(roomJid);
            const error = reply.getChild('error');

            return error ? error.children[0].name : null;
        }

        it('restores the token features of the recipient when owner is revoked', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const granter = await joinAsGranter(connect, r);

            const token = mintAsapToken({
                room: r.split('@')[0],
                context: {
                    user: { id: 'user1' },
                    features: {
                        recording: false,
                        livestreaming: false,
                        transcription: false,
                        'outbound-call': false
                    }
                }
            });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const bare = c.jid.split('/')[0];

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'owner' });

            const granted = await getSessionFeatures(c.jid);

            assert.strictEqual(granted.recording, true, 'grant should hand over the actor features');

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'member' });

            const restored = await getSessionFeatures(c.jid);

            assert.ok(restored !== null, 'the token features should come back');
            assert.strictEqual(restored.recording, false);
            assert.strictEqual(restored.livestreaming, false);
            assert.strictEqual(restored.transcription, false);
            assert.strictEqual(restored['outbound-call'], false);
        });

        it('clears granted features when the token of the recipient has none', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const granter = await joinAsGranter(connect, r);

            const token = mintAsapToken({ room: r.split('@')[0],
                context: { user: { id: 'user2' } } });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const bare = c.jid.split('/')[0];

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'owner' });

            assert.ok(await getSessionFeatures(c.jid) !== null, 'grant should set features');

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'member' });

            assert.strictEqual(await getSessionFeatures(c.jid), null,
                'the session must hold no features again');
        });

        it('clears granted features for a participant without a token', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const granter = await joinAsGranter(connect, r);
            const c = await connect();

            await c.joinRoom(r);

            const bare = c.jid.split('/')[0];

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'owner' });

            assert.ok(await getSessionFeatures(c.jid) !== null, 'grant should set features');

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'member' });

            assert.strictEqual(await getSessionFeatures(c.jid), null,
                'the session must hold no features again');
        });

        it('restores the token features when owner is revoked twice in a row', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const granter = await joinAsGranter(connect, r);

            const token = mintAsapToken({
                room: r.split('@')[0],
                context: {
                    user: { id: 'user3' },
                    features: { recording: false }
                }
            });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const bare = c.jid.split('/')[0];

            for (let i = 0; i < 2; i++) {
                await granter.sendMucAdmin(r, { jid: bare,
                    affiliation: 'owner' });
                await granter.sendMucAdmin(r, { jid: bare,
                    affiliation: 'member' });
            }

            const restored = await getSessionFeatures(c.jid);

            assert.ok(restored !== null, 'the token features should come back');
            assert.strictEqual(restored.recording, false);
        });

        it('blocks Jibri and Rayo requests from a recipient whose owner affiliation was revoked', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const granter = await joinAsGranter(connect, r);

            const token = mintAsapToken({
                room: r.split('@')[0],
                context: {
                    user: { id: 'user4' },
                    features: { recording: false,
                        'outbound-call': false }
                }
            });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            assert.strictEqual(
                await jibriStartErrorCondition(c, r),
                'forbidden',
                'a member with recording=false must not reach Jibri');
            assert.strictEqual(
                await rayoDialErrorCondition(c, r),
                'forbidden',
                'a member with outbound-call=false must not reach Jigasi');

            const bare = c.jid.split('/')[0];

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'owner' });

            assert.notStrictEqual(
                await jibriStartErrorCondition(c, r),
                'forbidden',
                'an owner with a granted recording feature must reach Jibri');

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'member' });

            assert.strictEqual(
                await jibriStartErrorCondition(c, r),
                'forbidden',
                'the recipient must not keep the granted recording feature');
            assert.strictEqual(
                await rayoDialErrorCondition(c, r),
                'forbidden',
                'the recipient must not keep the granted outbound-call feature');
        });

        it('restores the token features when the recipient revokes its own owner affiliation', async () => {
            const r = nextRoom();

            clients.push(await joinWithFocus(r));

            const granter = await joinAsGranter(connect, r);

            const token = mintAsapToken({
                room: r.split('@')[0],
                context: {
                    user: { id: 'user5' },
                    features: { recording: false }
                }
            });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const bare = c.jid.split('/')[0];

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'owner' });

            // As an owner, the recipient can set its own affiliation.
            const reply = await c.sendMucAdmin(r, { jid: bare,
                affiliation: 'member' });

            assert.strictEqual(reply.attrs.type, 'result');

            const restored = await getSessionFeatures(c.jid);

            assert.ok(restored !== null, 'the token features should come back');
            assert.strictEqual(restored.recording, false);
            assert.strictEqual(
                await jibriStartErrorCondition(c, r),
                'forbidden',
                'the recipient must not keep the granted recording feature');
        });

        for (const target of [ 'admin', 'outcast' ]) {
            it(`restores the token features when owner changes to ${target}`, async () => {
                const r = nextRoom();

                clients.push(await joinWithFocus(r));

                const granter = await joinAsGranter(connect, r);

                const token = mintAsapToken({
                    room: r.split('@')[0],
                    context: {
                        user: { id: `user-${target}` },
                        features: { recording: false }
                    }
                });
                const c = await connect({ params: { token } });

                await c.joinRoom(r);

                const bare = c.jid.split('/')[0];

                await granter.sendMucAdmin(r, { jid: bare,
                    affiliation: 'owner' });

                assert.strictEqual((await getSessionFeatures(c.jid)).recording, true);

                const reply = await granter.sendMucAdmin(r, { jid: bare,
                    affiliation: target });

                assert.strictEqual(reply.attrs.type, 'result');

                const restored = await getSessionFeatures(c.jid);

                assert.ok(restored !== null, 'the token features should come back');
                assert.strictEqual(restored.recording, false);
            });
        }

        it('restores the token features of a recipient that is in a breakout room', async () => {
            const BREAKOUT_MUC = 'breakout.conference.localhost';
            const r = nextRoom();
            const name = r.split('@')[0];
            const focus = await joinWithFocus(r);

            clients.push(focus);

            // mod_muc_breakout_rooms finds the main room of the moderator through
            // the ?room= query parameter.
            const granter = await joinAsGranter(connect, r, { room: name });

            const token = mintAsapToken({
                room: name,
                context: {
                    user: { id: 'user-breakout' },
                    features: { recording: false }
                }
            });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const bare = c.jid.split('/')[0];

            await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'owner' });

            assert.strictEqual((await getSessionFeatures(c.jid)).recording, true);

            // Create a breakout room and move the recipient into it.
            const parseJsonMessage = s => {
                try {
                    return JSON.parse(s.getChild('json-message', PERMISSIONS_NS)?.getText());
                } catch {
                    return null;
                }
            };
            const update = granter.waitForMessage(s => {
                const payload = parseJsonMessage(s);

                return payload?.type === 'breakout_rooms'
                    && payload?.event === 'features/breakout-rooms/update';
            }, 6000);

            await granter.sendBreakoutRoomsMessage(BREAKOUT_MUC, 'features/breakout-rooms/add', { subject: 'Group 1' });

            const payload = parseJsonMessage(await update);
            const breakoutJid = Object.values(payload.rooms).find(room => !room.isMainRoom)?.jid;

            assert.ok(breakoutJid, 'the update must list the new breakout room');

            // focus creates the breakout room, then the recipient moves into it.
            await focus.joinRoom(breakoutJid, 'focus');
            const breakoutPresence = await c.joinRoom(breakoutJid);

            assert.notStrictEqual(breakoutPresence.attrs.type, 'error');
            await c.leaveRoom(r);

            // The recipient is no longer an occupant of the main room, but its
            // affiliation there still decides its role in the breakout room.
            const reply = await granter.sendMucAdmin(r, { jid: bare,
                affiliation: 'member' });

            assert.strictEqual(reply.attrs.type, 'result');

            const restored = await getSessionFeatures(c.jid);

            assert.ok(restored !== null, 'the token features should come back');
            assert.strictEqual(restored.recording, false);
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
                room: r.split('@')[0],
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
                room: r.split('@')[0],
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

            const token = mintAsapToken({ room: r.split('@')[0],
                context: { user: { moderator: true } } });
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

            const token = mintAsapToken({ room: r.split('@')[0],
                context: { user: { id: 'user1' } } });
            const c = await connect({ params: { token } });

            await c.joinRoom(r);

            const features = await getSessionFeatures(c.jid);

            assert.strictEqual(features, null);
        });

    });

});
