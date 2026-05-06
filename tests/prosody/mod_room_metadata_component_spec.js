import { xml } from '@xmpp/client';
import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { getRoomMetadata } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const METADATA_COMPONENT = 'metadata.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';
const START_MUTED_NS = 'http://jitsi.org/jitmeet/start-muted';

let _counter = 0;
const nextRoom = () => `metadata-${++_counter}@${CONFERENCE}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Connects a client on the main VirtualHost.  Passes ?room=<roomName> so that
 * mod_jitsi_session sets jitsi_web_query_room, which the metadata component
 * requires before processing any message.
 *
 * @param {string} roomJid      full room JID, e.g. 'room@conference.localhost'
 * @param {object} [contextUser]  JWT context.user claims; omit for anonymous
 */
function connect(roomJid, contextUser) {
    const roomName = roomJid.split('@')[0];
    const params = { room: roomName };

    if (contextUser !== undefined) {
        params.token = mintAsapToken({ context: { user: contextUser } });
    }

    return createXmppClient({ params });
}

const connectModerator = roomJid => connect(roomJid, { moderator: true });
const connectMember = roomJid => connect(roomJid, { id: 'member1' });

/**
 * True when msg is a metadata broadcast from the metadata component.
 * getChild returns undefined (not null) when the child is absent, so check
 * against undefined rather than null.
 */
function isMetadataBroadcast(msg) {
    return msg.name === 'message'
        && msg.getChild('json-message', JITMEET_NS) !== undefined;
}

/** Parses the outer {type, metadata} envelope from a broadcast stanza. */
function parseBroadcast(msg) {
    const text = msg.getChild('json-message', JITMEET_NS)?.getText();

    return text ? JSON.parse(text) : null;
}

/**
 * Waits for a metadata broadcast stanza.
 *
 * @param {object} client
 * @param {number} [timeout=3000]
 */
function waitForMetadata(client, timeout = 3000) {
    return client.waitForMessage(isMetadataBroadcast, timeout);
}

/**
 * Drains the initial metadata delivery that filter_stanza sends to every
 * occupant before their self-presence.  Call this after joinRoom() in tests
 * that need to assert on subsequent broadcasts rather than the initial push.
 *
 * @param {object} client
 */
async function drainInitialMetadata(client) {
    await waitForMetadata(client, 2000);
}

/**
 * Asserts that NO metadata broadcast arrives within the given window.
 * Throws if one does arrive.
 *
 * @param {object} client
 * @param {number} [timeout=1000]
 */
async function assertNoMetadata(client, timeout = 1000) {
    try {
        await client.waitForMessage(isMetadataBroadcast, timeout);
        throw new Error('received unexpected metadata broadcast');
    } catch (err) {
        if (err.message.includes('Timeout')) {
            return; // expected — no broadcast arrived
        }
        throw err;
    }
}

/**
 * Asserts that no <message type='error'> arrives within the given window.
 * An error stanza indicates a crash or protocol failure rather than a clean
 * rejection.
 *
 * @param {object} client
 * @param {number} [timeout=1000]
 */
async function assertNoErrorStanza(client, timeout = 1000) {
    try {
        await client.waitForMessage(s => s.attrs.type === 'error', timeout);
        throw new Error('received unexpected error stanza — module may have crashed');
    } catch (err) {
        if (err.message.includes('Timeout')) {
            return; // expected — no error, clean handling
        }
        throw err;
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mod_room_metadata_component', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // ── Authorization ─────────────────────────────────────────────────────────

    describe('authorization', () => {

        it('moderator can update metadata', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'myKey', 'myValue');

            const broadcast = await waitForMetadata(mod);

            assert.equal(parseBroadcast(broadcast).metadata.myKey, 'myValue');
        });

        it('non-moderator cannot update metadata', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const member = await connectMember(r);

            clients.push(foc, member);
            await member.joinRoom(r);
            await drainInitialMetadata(member);

            member.sendMetadataUpdate(METADATA_COMPONENT, r, 'myKey', 'myValue');

            await assertNoMetadata(member);
        });

        it('non-occupant (connected but not joined) cannot update metadata', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const nonOcc = await connectModerator(r);

            clients.push(foc, nonOcc);

            // deliberately do NOT call joinRoom — sender is not an occupant
            nonOcc.sendMetadataUpdate(METADATA_COMPONENT, r, 'myKey', 'myValue');

            await assertNoMetadata(nonOcc);
        });

    });

    // ── Blocked keys ──────────────────────────────────────────────────────────

    describe('blocked keys', () => {

        /**
         * Asserts that a moderator cannot set the given metadata key.
         * @param {string} key Metadata key to test.
         */
        async function assertKeyBlocked(key) {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, key, 'someValue');
            await assertNoMetadata(mod);
        }

        for (const key of [
            'allownersEnabled', 'asyncTranscription', 'conferencePresetsServiceEnabled',
            'dialinEnabled', 'moderators', 'participants', 'participantsSoftLimit',
            'services', 'transcriberType', 'transcription', 'visitors', 'visitorsEnabled'
        ]) {
            it(`moderator cannot set blocked key "${key}"`, () => assertKeyBlocked(key));
        }

        it('moderator can set a non-blocked key', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'permissions', { groupChatRestricted: true });

            const broadcast = await waitForMetadata(mod);

            assert.deepEqual(parseBroadcast(broadcast).metadata.permissions,
                { groupChatRestricted: true });
        });

    });

    // ── Value deduplication ───────────────────────────────────────────────────

    describe('value deduplication', () => {

        it('does not broadcast when value is unchanged', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            // First update establishes the value.
            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'dedupKey', 42);
            await waitForMetadata(mod);

            // Second update with the same value must not trigger a broadcast.
            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'dedupKey', 42);
            await assertNoMetadata(mod);
        });

        it('broadcasts when value changes', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'changing', 'first');
            await waitForMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'changing', 'second');
            const broadcast = await waitForMetadata(mod);

            assert.equal(parseBroadcast(broadcast).metadata.changing, 'second');
        });

    });

    // ── Broadcast delivery ────────────────────────────────────────────────────

    describe('broadcast delivery', () => {

        it('all occupants receive the broadcast', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);
            const member = await connectMember(r);

            clients.push(foc, mod, member);
            await mod.joinRoom(r);
            await member.joinRoom(r);
            await drainInitialMetadata(mod);
            await drainInitialMetadata(member);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'broadcastKey', 'hello');

            const [ modBroadcast, memberBroadcast ] = await Promise.all([
                waitForMetadata(mod),
                waitForMetadata(member)
            ]);

            assert.equal(parseBroadcast(modBroadcast).metadata.broadcastKey, 'hello');
            assert.equal(parseBroadcast(memberBroadcast).metadata.broadcastKey, 'hello');
        });

        it('broadcast preserves previously set keys', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'key1', 'val1');
            await waitForMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'key2', 'val2');
            const broadcast = await waitForMetadata(mod);
            const { metadata } = parseBroadcast(broadcast);

            assert.equal(metadata.key1, 'val1', 'previous key must be preserved');
            assert.equal(metadata.key2, 'val2', 'new key must be present');
        });

    });

    // ── Initial metadata delivery ─────────────────────────────────────────────

    describe('initial metadata delivery', () => {

        it('joining client receives current metadata', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            // Establish metadata before the second client joins.
            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'preExisting', 'yes');
            await waitForMetadata(mod);

            // Joining client should receive the current metadata automatically.
            const late = await connectMember(r);

            clients.push(late);
            await late.joinRoom(r);

            // The initial delivery arrives before the self-presence so it is
            // already in the stanza queue when joinRoom resolves.
            const broadcast = await waitForMetadata(late, 2000);

            assert.equal(parseBroadcast(broadcast).metadata.preExisting, 'yes');
        });

        it('rejoining client receives fresh metadata', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'freshKey', 'freshVal');
            await waitForMetadata(mod);

            // Connect a new client (different JID), join, then leave.
            const first = await connectMember(r);

            clients.push(first);
            await first.joinRoom(r);
            await drainInitialMetadata(first);
            await first.disconnect();

            // Second distinct client simulates a rejoin from a different session.
            const rejoin = await connectMember(r);

            clients.push(rejoin);
            await rejoin.joinRoom(r);

            const broadcast = await waitForMetadata(rejoin, 2000);

            assert.equal(parseBroadcast(broadcast).metadata.freshKey, 'freshVal');
        });

    });

    // ── startMuted presence shim ──────────────────────────────────────────────

    describe('startMuted presence shim', () => {

        it('moderator startmuted presence updates metadata and broadcasts', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendPresence(`${r}/${mod.nick}`, [
                xml('startmuted', { xmlns: START_MUTED_NS,
                    audio: 'true',
                    video: 'false' })
            ]);

            const broadcast = await waitForMetadata(mod);
            const { startMuted } = parseBroadcast(broadcast).metadata;

            assert.equal(startMuted.audio, true);
            assert.equal(startMuted.video, false);
        });

        it('identical startmuted values do not trigger a second broadcast', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            const startMutedEl = xml('startmuted', { xmlns: START_MUTED_NS,
                audio: 'true',
                video: 'true' });

            mod.sendPresence(`${r}/${mod.nick}`, [ startMutedEl ]);
            await waitForMetadata(mod);

            // Same values — no second broadcast.
            mod.sendPresence(`${r}/${mod.nick}`, [ startMutedEl ]);
            await assertNoMetadata(mod);
        });

        it('non-moderator startmuted presence is ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const member = await connectMember(r);

            clients.push(foc, member);
            await member.joinRoom(r);
            await drainInitialMetadata(member);

            member.sendPresence(`${r}/${member.nick}`, [
                xml('startmuted', { xmlns: START_MUTED_NS,
                    audio: 'true',
                    video: 'true' })
            ]);

            await assertNoMetadata(member);
        });

    });

    // ── Invalid payloads ─────────────────────────────────────────────────────

    describe('invalid payloads', () => {

        it('message with no <room_metadata> child is ignored cleanly', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendPlainMessage(METADATA_COMPONENT);

            // Must not receive an error stanza (indicates a crash, not a clean skip).
            await assertNoErrorStanza(mod);

            // Module must still be functional after the bad message.
            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'afterNoChild', 'ok');
            const broadcast = await waitForMetadata(mod);

            assert.equal(parseBroadcast(broadcast).metadata.afterNoChild, 'ok');
        });

        it('message with missing room attribute is ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            // Omit the room attribute — without a nil-guard this crashes
            // room_jid_match_rewrite with a nil argument.
            mod.sendMetadataMessage(METADATA_COMPONENT, null,
                JSON.stringify({ key: 'k',
                    data: 'v' }));
            await assertNoMetadata(mod);
            await assertNoErrorStanza(mod);
        });

        it('message with empty <room_metadata> body is ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataMessage(METADATA_COMPONENT, r, '');
            await assertNoMetadata(mod);
            await assertNoErrorStanza(mod);
        });

        it('message with invalid JSON is ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataMessage(METADATA_COMPONENT, r, '{not valid json{{');
            await assertNoMetadata(mod);
        });

        it('message with missing "key" field is ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataMessage(METADATA_COMPONENT, r, JSON.stringify({ data: 'value' }));
            await assertNoMetadata(mod);
        });

        it('message with missing "data" field is ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataMessage(METADATA_COMPONENT, r, JSON.stringify({ key: 'someKey' }));
            await assertNoMetadata(mod);
        });

        it('message with null "data" is ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            mod.sendMetadataMessage(METADATA_COMPONENT, r,
                JSON.stringify({ key: 'someKey',
                    data: null }));
            await assertNoMetadata(mod);
        });

        it('message with non-string key does not corrupt room state', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const mod = await connectModerator(r);

            clients.push(foc, mod);
            await mod.joinRoom(r);
            await drainInitialMetadata(mod);

            // A JSON array as key must be rejected; if stored as a Lua table key
            // it poisons json.encode for all subsequent broadcasts in the room.
            mod.sendMetadataMessage(METADATA_COMPONENT, r,
                JSON.stringify({ key: [],
                    data: 'someValue' }));

            // Server metadata table must still be encodeable (not corrupted).
            const state = await getRoomMetadata(r);

            assert.ok(state, 'metadata HTTP endpoint must return valid JSON');

            // A valid subsequent update must still produce a broadcast.
            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'afterNonStringKey', 'ok');
            const broadcast = await waitForMetadata(mod);

            assert.equal(parseBroadcast(broadcast).metadata.afterNonStringKey, 'ok');
        });

    });

});
