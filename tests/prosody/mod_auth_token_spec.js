import assert from 'assert';
import http from 'http';

import { mintAsapToken, mintToken } from './helpers/jwt.js';
import { prosodyShell } from './helpers/prosody_shell.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

/**
 * GETs a test-observer endpoint and parses the JSON response.
 *
 * @param {string} route  e.g. 'session-info'
 * @param {string} jid    full JID to look up
 * @returns {Promise<object>}
 */
function getObserverJson(route, jid) {
    return new Promise((resolve, reject) => {
        const url = `http://localhost:5280/test-observer/${route}?jid=${encodeURIComponent(jid)}`;

        http.get(url, res => {
            let body = '';

            res.on('data', chunk => {
                body += chunk;
            });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    reject(new Error(`${route} returned ${res.statusCode}: ${body}`));

                    return;
                }
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    reject(new Error(`${route} bad JSON: ${body}`));
                }
            });
        }).on('error', reject);
    });
}

/**
 * Fetches the session fields snapshotted at resource-bind time.
 *
 * @param {string} jid
 * @returns {Promise<object>}
 */
function getSessionInfo(jid) {
    return getObserverJson('session-info', jid);
}

/**
 * Fetches the CURRENT JWT-derived fields of a live session. Needed after a
 * XEP-0198 resume, which refreshes the claims without binding a new resource
 * (so the /session-info snapshot is not updated).
 *
 * @param {string} jid
 * @returns {Promise<object>}
 */
function getSessionLive(jid) {
    return getObserverJson('session-live', jid);
}

/** Connects to the HS256 VirtualHost. */
function hs256Client(params) {
    return createXmppClient({ domain: 'hs256.localhost',
        params });
}

describe('mod_auth_token (HS256 shared secret)', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('connects successfully with a valid token', async () => {
        const token = mintToken({ room: '*' });
        const c = await hs256Client({ token });

        clients.push(c);
        assert.ok(c.jid, 'client should have a JID after connecting');
    });

    it('rejects connection with wrong secret', async () => {
        const token = mintToken({}, { secret: 'wrongsecret' });

        await assert.rejects(
            () => hs256Client({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with expired token', async () => {
        const token = mintToken({}, { expired: true });

        await assert.rejects(
            () => hs256Client({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with not-yet-valid token (nbf in the future)', async () => {
        const token = mintToken({}, { notYetValid: true });

        await assert.rejects(
            () => hs256Client({ token }),
            /not-allowed/
        );
    });

    it('rejects connection with wrong issuer', async () => {
        const token = mintToken({ iss: 'other-app' });

        await assert.rejects(
            () => hs256Client({ token }),
            /not-allowed/
        );
    });

    it('sets session.jitsi_meet_context_features from token context', async () => {
        const token = mintToken({
            room: '*',
            context: {
                features: {
                    'screen-sharing': true,
                    'recording': false
                }
            }
        });
        const c = await hs256Client({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_context_features['screen-sharing'], true);
        assert.strictEqual(info.jitsi_meet_context_features.recording, false);
    });

    it('sets session.jitsi_meet_room from room claim', async () => {
        const token = mintToken({ room: 'testroom' });
        const c = await hs256Client({ token });

        clients.push(c);
        const info = await getSessionInfo(c.jid);

        assert.strictEqual(info.jitsi_meet_room, 'testroom');
    });
});

/**
 * XEP-0198 stream resumption re-runs SASL on the new connection, so a client
 * may present a different JWT than the one it joined with. mod_auth_token
 * refreshes the hibernating session's claims from that token — that is how a
 * client rotates an expiring token across a reconnect — and the claims it
 * adopts have to stay scoped to the conference the session is an occupant of,
 * the same way the room claim is scoped at join time.
 *
 * The room claim of the refreshed token is therefore re-checked against the
 * rooms the session already occupies (mod_token_verification answers the
 * 'jitsi-verify-session-rooms' event), and the claims verified on join are kept
 * when it does not cover them. The file-sharing component is used here as the
 * observable effect of context.features on a live session.
 */
describe('mod_auth_token (claims on XEP-0198 resumption)', () => {

    const CONFERENCE = 'conference.localhost';
    const BREAKOUT_MUC = 'breakout.conference.localhost';
    const FILESHARING_COMPONENT = 'filesharing.localhost';
    const JITMEET_NS = 'http://jitsi.org/jitmeet';

    const clients = [];
    let roomCounter = 0;

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    /** Connects a client carrying ?room= and ?token= on the token VirtualHost. */
    function tokenClient(roomName, token) {
        return createXmppClient({ params: { room: roomName,
            token } });
    }

    /** Mints an RS256 login token scoped to `room`, optionally with features. */
    function tokenFor(room, features) {
        return mintAsapToken({
            room,
            context: {
                user: { id: 'user-a',
                    name: 'user-a' },
                ...features ? { features } : {}
            }
        });
    }

    /**
     * Sends a file-sharing add with a caller-chosen stanza id, so the reply can
     * be matched by id. After a resume the server flushes the unacked stanzas
     * queued during hibernation, so an earlier error can be redelivered.
     */
    function addFile(client, id, fileId) {
        return client.sendFileSharingRaw(
            FILESHARING_COMPONENT,
            { id },
            { type: 'add' },
            JSON.stringify({ fileId,
                name: 'shared.txt',
                size: 0,
                type: 'text/plain' })
        );
    }

    /** Waits for the reply to the stanza with the given id. */
    function waitForReply(client, id, timeout = 3000) {
        return client.waitForMessage(s => s.attrs.id === id, timeout);
    }

    /** Asserts a reply is an auth/forbidden error. */
    function assertForbidden(stanza, message) {
        assert.equal(stanza.attrs.type, 'error', message);
        assert.ok(stanza.getChild('error')?.getChild('forbidden'),
            `${message} (expected <forbidden/>, got ${stanza.toString()})`);
    }

    /** Resolves with the filesharing broadcast payload received by `client`. */
    async function waitForBroadcast(client, timeout = 3000) {
        const stanza = await client.waitForMessage(
            s => s.attrs.from === FILESHARING_COMPONENT && s.getChild('json-message', JITMEET_NS) !== undefined,
            timeout);

        return JSON.parse(stanza.getChild('json-message', JITMEET_NS).getText());
    }

    /** Asserts that no filesharing broadcast reaches `client` within the window. */
    async function assertNoBroadcast(client, timeout = 1000) {
        try {
            await waitForBroadcast(client, timeout);
        } catch (err) {
            if (err.message.includes('Timeout')) {
                return;
            }
            throw err;
        }
        throw new Error('unexpected file-sharing broadcast');
    }

    /**
     * Sets up a meeting with a participant holding a token that grants no
     * features, plus a second occupant that receives the room's broadcasts.
     */
    async function setupMeeting() {
        const roomName = `resume-${++roomCounter}`;
        const roomJid = `${roomName}@${CONFERENCE}`;
        const focus = await joinWithFocus(roomJid);
        const participant = await tokenClient(roomName, tokenFor(roomName));
        const other = await tokenClient(roomName, tokenFor(roomName));

        clients.push(focus, participant, other);
        await participant.joinRoom(roomJid);
        await other.joinRoom(roomJid);

        // Baseline: without a file-upload feature the operation is refused.
        addFile(participant, 'baseline-1', 'file-before-resume');
        assertForbidden(await waitForReply(participant, 'baseline-1'),
            'file-upload must be refused before the token swap');
        await assertNoBroadcast(other);

        return { roomName,
            roomJid,
            participant,
            other };
    }

    it('ignores features from a token issued for a different room', async () => {
        const { roomName, participant, other } = await setupMeeting();

        // Same tenant, scoped to another room, and granting file-upload there.
        const otherRoomToken = tokenFor(`${roomName}-other`, { 'file-upload': true });

        const reconnected = participant.waitForReconnect();

        participant.dropConnection({ token: otherRoomToken });
        await reconnected;

        const session = await getSessionLive(participant.jid);

        assert.equal(session.jitsi_meet_room, roomName,
            'room claim of a token that does not cover the joined conference must not be adopted');
        assert.ok(!session.jitsi_meet_context_features?.['file-upload'],
            'features of a token that does not cover the joined conference must not be adopted');

        addFile(participant, 'after-1', 'file-after-resume');
        assertForbidden(await waitForReply(participant, 'after-1'),
            'file-upload must still be refused after resuming with a token for another room');
        await assertNoBroadcast(other);
    });

    it('adopts the claims of a rotated token issued for the same room', async () => {
        const { roomName, participant, other } = await setupMeeting();

        // Same conference, new token: this is the token rotation the
        // c2s-session-updated handler exists for, and it must keep working.
        const rotatedToken = tokenFor(roomName, { 'file-upload': true });

        const reconnected = participant.waitForReconnect();

        participant.dropConnection({ token: rotatedToken });
        await reconnected;

        const session = await getSessionLive(participant.jid);

        assert.equal(session.jitsi_meet_context_features['file-upload'], true,
            'features of a token covering the joined conference must be adopted');

        addFile(participant, 'after-2', 'file-after-resume');

        const payload = await waitForBroadcast(other);

        assert.equal(payload.event, 'add');
        assert.equal(payload.file.fileId, 'file-after-resume');
    });

    /**
     * Sets up a meeting whose moderator has moved into a breakout room: it
     * joins the main room, registers a breakout room, joins it and then leaves
     * the main room, which is what the client does when switching rooms.
     *
     * The session is left occupying only the breakout room, while the
     * conference its claims have to cover is still the main room.
     */
    async function setupBreakout() {
        const roomName = `resume-br-${++roomCounter}`;
        const mainJid = `${roomName}@${CONFERENCE}`;
        const focus = await joinWithFocus(mainJid);
        const moderator = await tokenClient(
            roomName,
            mintAsapToken({ room: roomName,
                context: { user: { moderator: true } } }));

        clients.push(focus, moderator);
        await moderator.joinRoom(mainJid);

        // Register a breakout room, then let focus create it on the breakout
        // component (restrict_room_creation allows only Prosody admins there).
        moderator.sendBreakoutRoomsMessage(BREAKOUT_MUC, 'features/breakout-rooms/add',
            { subject: 'Breakout 1' });

        const update = await moderator.waitForMessage(s2 => {
            const jm = s2.getChild('json-message', JITMEET_NS);

            return jm !== undefined && JSON.parse(jm.getText()).type === 'breakout_rooms';
        }, 6000);
        const rooms = JSON.parse(update.getChild('json-message', JITMEET_NS).getText()).rooms;
        const breakoutJid = Object.values(rooms).find(r => !r.isMainRoom)?.jid;

        assert.ok(breakoutJid, 'breakout room JID must be in the update broadcast');
        await focus.joinRoom(breakoutJid, 'focus');

        const presence = await moderator.joinRoom(breakoutJid);

        assert.notEqual(presence.attrs.type, 'error', 'moderator must be able to join the breakout room');

        // Moving into a breakout room means leaving the main room.
        await moderator.leaveRoom(mainJid);

        return { roomName,
            mainJid,
            breakoutJid,
            moderator };
    }

    it('ignores a token for another room while the session sits in a breakout room', async () => {
        // A participant that moved into a breakout room is no longer an
        // occupant of the main room, but the conference it belongs to — and so
        // the room its token has to cover — is still the main room.
        const { roomName, moderator } = await setupBreakout();

        const reconnected = moderator.waitForReconnect();

        moderator.dropConnection({ token: tokenFor(`${roomName}-other`, { 'file-upload': true }) });
        await reconnected;

        const session = await getSessionLive(moderator.jid);

        assert.equal(session.jitsi_meet_room, roomName,
            'claims of a token that does not cover the main room must not be adopted in a breakout room');
        assert.ok(!session.jitsi_meet_context_features?.['file-upload'],
            'features of a token that does not cover the main room must not be adopted in a breakout room');
    });

    it('adopts the claims of a rotated token for the main room while the session sits in a breakout room',
        async () => {
            // The counterpart of the check above: the room the claims are
            // verified against is the main room the session joined, not the
            // breakout room it currently occupies, so a token that does cover
            // that main room has to be adopted. Without this, a rotation that
            // named the breakout room instead would fail closed and token
            // rotation would silently stop working inside breakout rooms.
            const { roomName, moderator } = await setupBreakout();

            const rotatedToken = mintAsapToken({
                room: roomName,
                context: {
                    user: { moderator: true },
                    features: { 'file-upload': true }
                }
            });

            const reconnected = moderator.waitForReconnect();

            moderator.dropConnection({ token: rotatedToken });
            await reconnected;

            const session = await getSessionLive(moderator.jid);

            assert.equal(session.jitsi_meet_room, roomName,
                'the room claim of a token covering the main room must be adopted in a breakout room');
            assert.equal(session.jitsi_meet_context_features['file-upload'], true,
                'features of a token covering the main room must be adopted in a breakout room');
        });

    it('refreshes the claims unverified when no module answers the verification event', async () => {
        // mod_token_verification owns room verification: without it a join is
        // not room-checked either, so there is nothing to answer the
        // 'jitsi-verify-session-rooms' event with and the refreshed claims are
        // taken as they come.
        const { roomName, participant } = await setupMeeting();

        await prosodyShell(`module:unload("token_verification", "${CONFERENCE}")`);

        try {
            const reconnected = participant.waitForReconnect();

            participant.dropConnection({ token: tokenFor(`${roomName}-other`, { 'file-upload': true }) });
            await reconnected;

            const session = await getSessionLive(participant.jid);

            assert.equal(session.jitsi_meet_room, `${roomName}-other`,
                'with no verifier loaded the refreshed claims are adopted as-is');
        } finally {
            await prosodyShell(`module:load("token_verification", "${CONFERENCE}")`);
        }
    });
});
