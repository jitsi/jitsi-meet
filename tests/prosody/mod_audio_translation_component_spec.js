import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { getAudioTranslationRequests, setRoomMaxOccupants } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const AT_COMPONENT = 'audiotranslation.localhost';
const METADATA_COMPONENT = 'metadata.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';

// Matches audio_translation_max_subscriptions in docker/prosody.cfg.lua.
const MAX_SUBSCRIPTIONS = 3;

let _counter = 0;
const nextRoom = () => `at-${++_counter}@${CONFERENCE}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Connects a client on the main VirtualHost, passing ?room=<roomName> so that
 * mod_jitsi_session sets jitsi_web_query_room (required by the component).
 *
 * @param {string} roomJid       full room JID
 * @param {object} [opts]
 * @param {object} [opts.user]      JWT context.user claims
 * @param {object} [opts.features]  JWT context.features map
 */
function connect(roomJid, { user, features } = {}) {
    const roomName = roomJid.split('@')[0];
    const params = { room: roomName };

    if (user !== undefined || features !== undefined) {
        const context = {};

        if (user !== undefined) {
            context.user = user;
        }
        if (features !== undefined) {
            context.features = features;
        }
        params.token = mintAsapToken({ room: roomName,
            context });
    }

    return createXmppClient({ params });
}

/**
 * Joins the focus (creating the room) and raises the per-room occupant limit so
 * tests can add more than the global muc_max_occupants (2) regular occupants.
 */
async function startRoom(roomJid) {
    const foc = await joinWithFocus(roomJid);

    await setRoomMaxOccupants(roomJid, 50);

    return foc;
}

/** Connects a client and joins the room as an occupant. */
async function joinOccupant(roomJid, opts) {
    const c = await connect(roomJid, opts);

    await c.joinRoom(roomJid);

    return c;
}

/** True if the stanza is a metadata broadcast (a json-message message). */
function isMetadataBroadcast(msg) {
    return msg.name === 'message'
        && msg.getChild('json-message', JITMEET_NS) !== undefined;
}

/** Parses a metadata broadcast stanza into its JSON payload (or null). */
function parseBroadcast(msg) {
    const text = msg.getChild('json-message', JITMEET_NS)?.getText();

    return text ? JSON.parse(text) : null;
}

/** Waits for the next metadata broadcast delivered to a client. */
function waitForMetadata(client, timeout = 3000) {
    return client.waitForMessage(isMetadataBroadcast, timeout);
}

/**
 * Drains the initial metadata push delivered to an occupant on join, so a later
 * waitForMetadata sees the next real broadcast rather than this one.
 *
 * Only call this for regular occupants — they receive the push immediately (it
 * is queued during the join), so the timeout is never actually hit. The focus is
 * the room creator: its self-presence is emitted while the room is still locked,
 * before mod_room_metadata_component's muc-room-created hook initialises
 * room.sent_initial_metadata, so the initial-metadata filter skips it and focus
 * never gets a push to drain.
 */
async function drainInitialMetadata(client) {
    try {
        await waitForMetadata(client, 500);
    } catch { /* no initial metadata is fine */ }
}

/** Asserts that no metadata broadcast arrives within the timeout. */
async function assertNoMetadata(client, timeout = 350) {
    try {
        await client.waitForMessage(isMetadataBroadcast, timeout);
        throw new Error('received unexpected metadata broadcast');
    } catch (err) {
        if (err.message.includes('Timeout')) {
            return;
        }
        throw err;
    }
}

/** Asserts that no error stanza arrives within the timeout. */
async function assertNoErrorStanza(client, timeout = 300) {
    try {
        await client.waitForMessage(s => s.attrs.type === 'error', timeout);
        throw new Error('received unexpected error stanza — module may have crashed');
    } catch (err) {
        if (err.message.includes('Timeout')) {
            return;
        }
        throw err;
    }
}

/** Waits for an error reply to a subscription request. */
function waitForError(client, timeout = 2000) {
    return client.waitForMessage(s => s.attrs.type === 'error', timeout);
}

/** Waits long enough for a delta to be processed and the debounced publish to run. */
function settle(ms = 300) {
    return new Promise(res => setTimeout(res, ms));
}

/** Sends a delta and returns the aggregate map as seen by jicofo (the focus). */
async function pushAndGetRequests(rx, focus, delta) {
    rx.sendAudioTranslation(AT_COMPONENT, delta);
    const broadcast = await waitForMetadata(focus);

    return parseBroadcast(broadcast).metadata.audioTranslationRequests;
}

/**
 * Waits for a metadata broadcast whose audioTranslationRequests satisfies `predicate`, returning that value.
 * Toggling the enable flag produces an immediate flag-change broadcast and a later debounced aggregate update,
 * so callers use the predicate to skip to the broadcast they care about.
 */
async function waitForRequests(focus, predicate) {
    for (let i = 0; i < 5; i++) {
        const broadcast = await waitForMetadata(focus); // eslint-disable-line no-await-in-loop
        const requests = parseBroadcast(broadcast).metadata.audioTranslationRequests;

        if (predicate(requests)) {
            return requests;
        }
    }
    throw new Error('audioTranslationRequests did not reach the expected state');
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('mod_audio_translation_component', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // ── Disco identity ────────────────────────────────────────────────────────
    describe('disco identity', () => {

        it('advertises an audio-translation component identity on the main host', async () => {
            const c = await connect(nextRoom());

            clients.push(c);

            const res = await c.sendDiscoInfo('localhost');
            const identities = res.getChild('query', 'http://jabber.org/protocol/disco#info')
                ?.getChildren('identity') ?? [];
            const at = identities.find(i =>
                i.attrs.category === 'component' && i.attrs.type === 'audio-translation');

            assert.ok(at, 'main host disco#info must advertise an audio-translation component identity');
            assert.strictEqual(at.attrs.name, AT_COMPONENT);
        });
    });

    // ── Routing / parsing ───────────────────────────────────────────────────
    describe('routing and parsing', () => {

        it('ignores a message with no <audio-translation> child', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);

            rx.sendPlainMessage(AT_COMPONENT);

            await assertNoErrorStanza(rx);
            await assertNoMetadata(foc);
        });

        it('ignores an empty <audio-translation> body', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);

            rx.sendAudioTranslationRaw(AT_COMPONENT, '');

            await assertNoErrorStanza(rx);
            await assertNoMetadata(foc);
        });

        it('rejects invalid JSON', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);

            rx.sendAudioTranslationRaw(AT_COMPONENT, '{not valid json{{');

            const err = await waitForError(rx);

            assert.equal(err.attrs.type, 'error');
            await assertNoMetadata(foc);
        });

        it('rejects a JSON payload that is not an object', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);

            rx.sendAudioTranslationRaw(AT_COMPONENT, '"a string"');

            await waitForError(rx);
            await assertNoMetadata(foc);
        });

        it('ignores a message from a session without a room context', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);

            // Connect WITHOUT ?room= so jitsi_web_query_room is unset.
            const rx = await createXmppClient();

            clients.push(foc, rx);

            rx.sendAudioTranslation(AT_COMPONENT, { a1b2c3d4: 'en' });

            await assertNoMetadata(foc);
        });
    });

    // ── Room / occupant ─────────────────────────────────────────────────────
    describe('room and occupant resolution', () => {

        it('rejects a sender that is not an occupant of the room', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);

            // Connected with a room context but never joined the MUC.
            const rx = await connect(r);

            clients.push(foc, rx);

            rx.sendAudioTranslation(AT_COMPONENT, { a1b2c3d4: 'en' });

            const err = await waitForError(rx);

            assert.equal(err.attrs.type, 'error');
            await assertNoMetadata(foc);
        });
    });

    // ── Enabled flag ────────────────────────────────────────────────────────
    describe('enabled flag', () => {

        it('silently ignores requests when audioTranslation.enabled is false', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const mod = await joinOccupant(r, { user: { moderator: true } });

            clients.push(foc, mod);
            await drainInitialMetadata(mod);

            // Disable the feature.
            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'audioTranslation', { enabled: false });
            await waitForMetadata(foc);

            const sender = await joinOccupant(r);

            clients.push(sender);

            mod.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en' });

            await assertNoErrorStanza(mod);
            await assertNoMetadata(foc);
        });

        it('processes requests when audioTranslation is absent (enabled by default)', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            const requests = await pushAndGetRequests(rx, foc, { [sender.nick]: 'en' });

            assert.deepEqual(requests[sender.nick], [ 'en' ]);
        });

        it('clears the map (stops translation) when disabled, and restores it when re-enabled', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const mod = await joinOccupant(r, { user: { moderator: true } });
            const sender = await joinOccupant(r);

            clients.push(foc, mod, sender);
            await drainInitialMetadata(mod);

            // Subscribe — the aggregate map reaches jicofo.
            const requests = await pushAndGetRequests(mod, foc, { [sender.nick]: 'en' });

            assert.deepEqual(requests[sender.nick], [ 'en' ]);

            // Disable — the map is cleared so jicofo stops translation.
            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'audioTranslation', { enabled: false });
            const cleared = await waitForRequests(foc, v => v === undefined);

            assert.equal(cleared, undefined);

            // Re-enable — the retained subscription is republished.
            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'audioTranslation', { enabled: true });
            const restored = await waitForRequests(foc, v => v !== undefined);

            assert.deepEqual(restored[sender.nick], [ 'en' ]);
        });
    });

    // ── Subscribe authorization ──────────────────────────────────────────────
    describe('subscribe authorization (live-translation-subscribe)', () => {

        it('denies a receiver whose token sets live-translation-subscribe to false', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r, { features: { 'live-translation-subscribe': 'false' } });
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            rx.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en' });

            const err = await waitForError(rx);

            assert.equal(err.attrs.type, 'error');
            await assertNoMetadata(foc);
        });

        it('allows a receiver with no token features', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            const requests = await pushAndGetRequests(rx, foc, { [sender.nick]: 'en' });

            assert.deepEqual(requests[sender.nick], [ 'en' ]);
        });

        it('allows a receiver whose token sets the feature to true', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r, { features: { 'live-translation-subscribe': 'true' } });
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            const requests = await pushAndGetRequests(rx, foc, { [sender.nick]: 'en' });

            assert.deepEqual(requests[sender.nick], [ 'en' ]);
        });
    });

    // ── Validation (atomic) ──────────────────────────────────────────────────
    describe('validation (whole-stanza atomicity)', () => {

        it('rejects a senderId that is not 8 hex digits', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);

            rx.sendAudioTranslation(AT_COMPONENT, { nothex: 'en' });

            await waitForError(rx);
            await assertNoMetadata(foc);
        });

        it('rejects a non-alphabetical language', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            rx.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en1' });

            await waitForError(rx);
            await assertNoMetadata(foc);
        });

        it('rejects a language longer than 20 characters', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            rx.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'a'.repeat(21) });

            await waitForError(rx);
            await assertNoMetadata(foc);
        });

        it('rejects a request whose target sender is not a current occupant', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);

            // Syntactically valid 8-hex id that belongs to nobody in the room.
            rx.sendAudioTranslation(AT_COMPONENT, { deadbeef: 'en' });

            await waitForError(rx);
            await assertNoMetadata(foc);
        });

        it('rejects the whole stanza when one of several entries is invalid', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            // First entry valid, second invalid → nothing must be applied.
            rx.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en',
                badid: 'fr' });

            await waitForError(rx);
            await assertNoMetadata(foc);

            // A subsequent valid request proves the first entry was NOT applied:
            // only the new sender appears.
            const requests = await pushAndGetRequests(rx, foc, { [sender.nick]: 'de' });

            assert.deepEqual(requests, { [sender.nick]: [ 'de' ] });
        });
    });

    // ── Delta semantics ───────────────────────────────────────────────────────
    describe('delta semantics', () => {

        it('merges added entries and leaves earlier ones untouched', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const s1 = await joinOccupant(r);
            const s2 = await joinOccupant(r);

            clients.push(foc, rx, s1, s2);

            await pushAndGetRequests(rx, foc, { [s1.nick]: 'en' });
            const requests = await pushAndGetRequests(rx, foc, { [s2.nick]: 'fr' });

            assert.deepEqual(requests[s1.nick], [ 'en' ]);
            assert.deepEqual(requests[s2.nick], [ 'fr' ]);
        });

        it('removes an entry with an empty-string language', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const s1 = await joinOccupant(r);
            const s2 = await joinOccupant(r);

            clients.push(foc, rx, s1, s2);

            await pushAndGetRequests(rx, foc, { [s1.nick]: 'en',
                [s2.nick]: 'fr' });
            const requests = await pushAndGetRequests(rx, foc, { [s1.nick]: '' });

            assert.equal(requests[s1.nick], undefined);
            assert.deepEqual(requests[s2.nick], [ 'fr' ]);
        });

        it('treats removal of an absent entry as a benign no-op', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const s1 = await joinOccupant(r);
            const s2 = await joinOccupant(r);

            clients.push(foc, rx, s1, s2);

            // s2 is not subscribed; removing it must not reject and the add applies.
            const requests = await pushAndGetRequests(rx, foc, { [s1.nick]: 'en',
                [s2.nick]: '' });

            assert.deepEqual(requests[s1.nick], [ 'en' ]);
            assert.equal(requests[s2.nick], undefined);
        });

        it('replaces the language when switching the same sender', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            await pushAndGetRequests(rx, foc, { [sender.nick]: 'en' });
            const requests = await pushAndGetRequests(rx, foc, { [sender.nick]: 'es' });

            assert.deepEqual(requests[sender.nick], [ 'es' ]);
        });

        it('does not broadcast when the resulting aggregate is unchanged', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            await pushAndGetRequests(rx, foc, { [sender.nick]: 'en' });

            // Identical request — aggregate does not change → no broadcast.
            rx.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en' });
            await assertNoMetadata(foc);
        });
    });

    // ── Per-receiver limit ─────────────────────────────────────────────────────
    describe(`per-receiver limit (${MAX_SUBSCRIPTIONS})`, () => {

        /** Joins n sender occupants and returns them. */
        async function joinSenders(r, n) {
            const senders = [];

            for (let i = 0; i < n; i++) {
                const s = await joinOccupant(r); // eslint-disable-line no-await-in-loop

                senders.push(s);
                clients.push(s);
            }

            return senders;
        }

        it('accepts subscriptions up to the limit', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);
            const senders = await joinSenders(r, MAX_SUBSCRIPTIONS);


            const delta = {};

            for (const s of senders) {
                delta[s.nick] = 'en';
            }

            const requests = await pushAndGetRequests(rx, foc, delta);

            assert.equal(Object.keys(requests).length, MAX_SUBSCRIPTIONS);
        });

        it('rejects a new subscription that would exceed the limit', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);
            const senders = await joinSenders(r, MAX_SUBSCRIPTIONS + 1);


            const delta = {};

            for (let i = 0; i < MAX_SUBSCRIPTIONS; i++) {
                delta[senders[i].nick] = 'en';
            }
            await pushAndGetRequests(rx, foc, delta);

            // One more distinct sender → over the limit → reject whole stanza.
            rx.sendAudioTranslation(AT_COMPONENT, { [senders[MAX_SUBSCRIPTIONS].nick]: 'en' });

            await waitForError(rx);
            await assertNoMetadata(foc);
        });

        it('allows a language switch at the limit (count unchanged)', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);
            const senders = await joinSenders(r, MAX_SUBSCRIPTIONS);


            const delta = {};

            for (const s of senders) {
                delta[s.nick] = 'en';
            }
            await pushAndGetRequests(rx, foc, delta);

            const requests = await pushAndGetRequests(rx, foc, { [senders[0].nick]: 'es' });

            assert.deepEqual(requests[senders[0].nick], [ 'es' ]);
        });

        it('rejects a delta whose net result exceeds the limit', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);

            clients.push(foc, rx);
            const senders = await joinSenders(r, MAX_SUBSCRIPTIONS + 2);


            const delta = {};

            for (let i = 0; i < MAX_SUBSCRIPTIONS; i++) {
                delta[senders[i].nick] = 'en';
            }
            await pushAndGetRequests(rx, foc, delta);

            // Remove 1, add 2 → net MAX+1 → reject whole stanza.
            rx.sendAudioTranslation(AT_COMPONENT, {
                [senders[0].nick]: '',
                [senders[MAX_SUBSCRIPTIONS].nick]: 'en',
                [senders[MAX_SUBSCRIPTIONS + 1].nick]: 'en'
            });

            await waitForError(rx);
            await assertNoMetadata(foc);
        });

        it('tracks the limit independently per receiver', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx1 = await joinOccupant(r);
            const rx2 = await joinOccupant(r);

            clients.push(foc, rx1, rx2);
            const senders = await joinSenders(r, MAX_SUBSCRIPTIONS);


            const delta = {};

            for (const s of senders) {
                delta[s.nick] = 'en';
            }

            // rx1 fills its quota.
            await pushAndGetRequests(rx1, foc, delta);

            // rx2 may still subscribe to the same senders.
            const requests = await pushAndGetRequests(rx2, foc, { [senders[0].nick]: 'fr' });

            assert.deepEqual(requests[senders[0].nick].sort(), [ 'en', 'fr' ]);
        });
    });

    // ── Aggregation across receivers ───────────────────────────────────────────
    describe('aggregation across receivers', () => {

        it('unions different languages requested for the same sender', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx1 = await joinOccupant(r);
            const rx2 = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx1, rx2, sender);

            await pushAndGetRequests(rx1, foc, { [sender.nick]: 'en' });
            const requests = await pushAndGetRequests(rx2, foc, { [sender.nick]: 'fr' });

            assert.deepEqual(requests[sender.nick].sort(), [ 'en', 'fr' ]);
        });

        it('deduplicates the same language requested by two receivers', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx1 = await joinOccupant(r);
            const rx2 = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx1, rx2, sender);

            await pushAndGetRequests(rx1, foc, { [sender.nick]: 'en' });

            // rx2 wants the same language: the aggregate is unchanged so no
            // broadcast fires. Read server state directly instead.
            rx2.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en' });
            await settle();

            const { audioTranslationRequests } = await getAudioTranslationRequests(r);

            assert.deepEqual(audioTranslationRequests[sender.nick], [ 'en' ]);
        });

        it('keeps a language referenced by another receiver after a switch', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx1 = await joinOccupant(r);
            const rx2 = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx1, rx2, sender);

            await pushAndGetRequests(rx1, foc, { [sender.nick]: 'en' });

            // rx2 also wants en — aggregate unchanged, so no broadcast fires.
            rx2.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en' });
            await settle();

            // rx1 switches to es; rx2 still references en → { sender: [en, es] }.
            const requests = await pushAndGetRequests(rx1, foc, { [sender.nick]: 'es' });

            assert.deepEqual(requests[sender.nick].sort(), [ 'en', 'es' ]);
        });

        it('drops a language when its sole referencer switches away', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);

            await pushAndGetRequests(rx, foc, { [sender.nick]: 'en' });
            const requests = await pushAndGetRequests(rx, foc, { [sender.nick]: 'es' });

            assert.deepEqual(requests[sender.nick], [ 'es' ]);
        });

        it('keeps a language when one of two referencers removes it', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx1 = await joinOccupant(r);
            const rx2 = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx1, rx2, sender);

            await pushAndGetRequests(rx1, foc, { [sender.nick]: 'en' });

            // rx2 requests the same language (no broadcast — aggregate unchanged).
            rx2.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en' });
            await settle();

            // rx1 removes its request; rx2 still references 'en' so the aggregate
            // is still { sender: [en] } — again no broadcast. Read server state.
            rx1.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: '' });
            await settle();

            const { audioTranslationRequests } = await getAudioTranslationRequests(r);

            assert.deepEqual(audioTranslationRequests[sender.nick], [ 'en' ]);
        });

        it('exposes the request map to jicofo but not to regular clients', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx, sender);
            await drainInitialMetadata(rx);

            rx.sendAudioTranslation(AT_COMPONENT, { [sender.nick]: 'en' });

            const [ focBroadcast, rxBroadcast ] = await Promise.all([
                waitForMetadata(foc),
                waitForMetadata(rx)
            ]);

            assert.deepEqual(
                parseBroadcast(focBroadcast).metadata.audioTranslationRequests[sender.nick],
                [ 'en' ]);
            assert.equal(
                parseBroadcast(rxBroadcast).metadata.audioTranslationRequests,
                undefined,
                'regular clients must never receive the request map');
        });

        it('blocks a client from setting audioTranslationRequests via metadata', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const mod = await joinOccupant(r, { user: { moderator: true } });

            clients.push(foc, mod);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'audioTranslationRequests', { evil: [ 'xx' ] });
            await assertNoMetadata(mod);
        });
    });

    // ── Enable-flag write gating (live-translation) ────────────────────────────
    describe('enable-flag write gating (live-translation)', () => {

        it('lets a moderator enable the feature', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const mod = await joinOccupant(r, { user: { moderator: true } });

            clients.push(foc, mod);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'audioTranslation', { enabled: true });
            const broadcast = await waitForMetadata(mod);

            assert.deepEqual(parseBroadcast(broadcast).metadata.audioTranslation, { enabled: true });
        });

        it('denies a non-moderator without the live-translation feature', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const member = await joinOccupant(r, { user: { id: 'member1' } });

            clients.push(foc, member);
            await drainInitialMetadata(member);

            member.sendMetadataUpdate(METADATA_COMPONENT, r, 'audioTranslation', { enabled: true });
            await assertNoMetadata(member);
        });

        it('allows a non-moderator whose token grants live-translation', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const member = await joinOccupant(r, { features: { 'live-translation': 'true' } });

            clients.push(foc, member);
            await drainInitialMetadata(member);

            member.sendMetadataUpdate(METADATA_COMPONENT, r, 'audioTranslation', { enabled: true });
            const broadcast = await waitForMetadata(member);

            assert.deepEqual(parseBroadcast(broadcast).metadata.audioTranslation, { enabled: true });
        });

        it('sanitizes the stored value to only the enabled flag', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const mod = await joinOccupant(r, { user: { moderator: true } });

            clients.push(foc, mod);
            await drainInitialMetadata(mod);

            mod.sendMetadataUpdate(METADATA_COMPONENT, r, 'audioTranslation',
                { enabled: true,
                    requests: { evil: [ 'xx' ] } });
            const broadcast = await waitForMetadata(mod);

            assert.deepEqual(parseBroadcast(broadcast).metadata.audioTranslation, { enabled: true });
        });
    });

    // ── MUC-leave pruning ──────────────────────────────────────────────────────
    describe('MUC-leave pruning', () => {

        it('drops a receiver\'s subscriptions when it leaves', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx1 = await joinOccupant(r);
            const rx2 = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, rx2, sender);

            await pushAndGetRequests(rx1, foc, { [sender.nick]: 'en' });
            await pushAndGetRequests(rx2, foc, { [sender.nick]: 'fr' });

            await rx1.disconnect();

            const broadcast = await waitForMetadata(foc);

            assert.deepEqual(
                parseBroadcast(broadcast).metadata.audioTranslationRequests[sender.nick],
                [ 'fr' ]);
        });

        it('prunes a departed sender from every receiver', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const s1 = await joinOccupant(r);
            const s2 = await joinOccupant(r);

            clients.push(foc, rx, s2);

            await pushAndGetRequests(rx, foc, { [s1.nick]: 'en',
                [s2.nick]: 'fr' });

            await s1.disconnect();

            const broadcast = await waitForMetadata(foc);
            const requests = parseBroadcast(broadcast).metadata.audioTranslationRequests;

            assert.equal(requests[s1.nick], undefined);
            assert.deepEqual(requests[s2.nick], [ 'fr' ]);
        });

        it('removes the request map entirely once the last subscription is gone', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const sender = await joinOccupant(r);

            clients.push(foc, sender);

            await pushAndGetRequests(rx, foc, { [sender.nick]: 'en' });

            await rx.disconnect();

            const broadcast = await waitForMetadata(foc);

            assert.equal(parseBroadcast(broadcast).metadata.audioTranslationRequests, undefined);
        });
    });

    // ── Debounce ────────────────────────────────────────────────────────────────
    describe('debounce', () => {

        it('coalesces a burst of deltas into a single broadcast', async () => {
            const r = nextRoom();
            const foc = await startRoom(r);
            const rx = await joinOccupant(r);
            const s1 = await joinOccupant(r);
            const s2 = await joinOccupant(r);
            const s3 = await joinOccupant(r);

            clients.push(foc, rx, s1, s2, s3);

            // Three rapid deltas within the debounce window.
            rx.sendAudioTranslation(AT_COMPONENT, { [s1.nick]: 'en' });
            rx.sendAudioTranslation(AT_COMPONENT, { [s2.nick]: 'fr' });
            rx.sendAudioTranslation(AT_COMPONENT, { [s3.nick]: 'de' });

            const broadcast = await waitForMetadata(foc);
            const requests = parseBroadcast(broadcast).metadata.audioTranslationRequests;

            assert.deepEqual(requests[s1.nick], [ 'en' ]);
            assert.deepEqual(requests[s2.nick], [ 'fr' ]);
            assert.deepEqual(requests[s3.nick], [ 'de' ]);

            // Only one broadcast for the whole burst.
            await assertNoMetadata(foc);
        });
    });
});
