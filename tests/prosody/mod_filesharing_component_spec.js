/**
 * Integration tests for mod_filesharing_component.
 *
 * The module runs as a Prosody component (filesharing.localhost). Clients send
 * <file-sharing xmlns='http://jitsi.org/jitmeet' type='add|remove'> messages
 * to it; the component looks up the room from jitsi_web_query_room (set by
 * mod_jitsi_session from the ?room= WebSocket URL parameter), validates that
 * the sender is a room occupant, applies a feature gate, and then:
 *
 *   add   — stores the file in room.jitsi_shared_files and broadcasts a
 *            json-message with event='add' to all non-admin, non-sender occupants.
 *   remove — deletes the file from room.jitsi_shared_files and broadcasts
 *            event='remove' to all non-admin, non-sender occupants.
 *
 * When a new occupant joins a room that already has shared files, the
 * muc-occupant-joined hook sends them a json-message with event='list'
 * containing the current file set.
 *
 * Author fields (authorParticipantId, authorParticipantJid, authorParticipantName)
 * in add payloads are overwritten by Prosody from the real session state,
 * preventing clients from spoofing each other's identity.
 *
 * Feature gate: the sender must have jitsi_meet_context_features containing
 * file-upload=true. The is_owner fallback in is_feature_allowed is effectively
 * unreachable in this environment because mod_jitsi_permissions (auto-loaded by
 * muc_meeting_id) always sets at least default_permissions on moderator sessions,
 * making jitsi_meet_context_features truthy before the fallback is evaluated.
 */

import assert from 'assert';

import { setRoomMaxOccupants, setSessionContext } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const CONFERENCE = 'conference.localhost';
const FILESHARING_COMPONENT = 'filesharing.localhost';
const JITMEET_NS = 'http://jitsi.org/jitmeet';

let _counter = 0;
const nextRoom = () => `fs-${++_counter}@${CONFERENCE}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Connects an anonymous client on the main VirtualHost with ?room=<roomName>
 * so that mod_jitsi_session sets jitsi_web_query_room. The filesharing
 * component requires this field before processing any message.
 *
 * @param {string} roomJid  full room JID, e.g. 'room@conference.localhost'
 * @returns {Promise<XmppTestClient>}
 */
function connect(roomJid) {
    const roomName = roomJid.split('@')[0];

    return createXmppClient({ params: { room: roomName } });
}

/**
 * Returns true when stanza is a filesharing broadcast from the component
 * (a <message> carrying a <json-message xmlns='http://jitsi.org/jitmeet'> child).
 *
 * @param {object} stanza
 */
function isFilesharingBroadcast(stanza) {
    return stanza.name === 'message'
        && stanza.attrs.from === FILESHARING_COMPONENT
        && stanza.getChild('json-message', JITMEET_NS) !== undefined;
}

/**
 * Parses the JSON payload from a filesharing broadcast stanza.
 * Returns the decoded object: { type, event, file?, files?, fileId? }
 *
 * @param {object} stanza
 * @returns {object|null}
 */
function parseBroadcast(stanza) {
    const text = stanza.getChild('json-message', JITMEET_NS)?.getText();

    return text ? JSON.parse(text) : null;
}

/**
 * Waits for a filesharing broadcast stanza on the given client.
 *
 * @param {object} client
 * @param {number} [timeout=3000]
 * @returns {Promise<object>}
 */
function waitForFilesharing(client, timeout = 3000) {
    return client.waitForMessage(isFilesharingBroadcast, timeout);
}

/**
 * Asserts that no filesharing broadcast arrives within the given window.
 * Throws if one does arrive.
 *
 * @param {object} client
 * @param {number} [timeout=1000]
 */
async function assertNoFilesharing(client, timeout = 1000) {
    try {
        await client.waitForMessage(isFilesharingBroadcast, timeout);
        throw new Error('received unexpected filesharing broadcast');
    } catch (err) {
        if (err.message.includes('Timeout')) {
            return; // expected — no broadcast
        }
        throw err;
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('mod_filesharing_component', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    // ── add file ──────────────────────────────────────────────────────────────

    describe('add file', () => {

        it('broadcasts add event to other occupants', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);
            const receiver = await connect(r);

            clients.push(foc, sender, receiver);
            await sender.joinRoom(r);
            await receiver.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1',
                name: 'test.pdf' });

            const broadcast = await waitForFilesharing(receiver);
            const payload = parseBroadcast(broadcast);

            assert.equal(payload.type, 'file-sharing');
            assert.equal(payload.event, 'add');
            assert.equal(payload.file.fileId, 'file1');
        });

        it('does not send broadcast back to sender', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);
            const receiver = await connect(r);

            clients.push(foc, sender, receiver);
            await sender.joinRoom(r);
            await receiver.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1',
                name: 'test.pdf' });

            // Wait for receiver to confirm Prosody processed the add, then
            // assert sender received nothing.
            await waitForFilesharing(receiver);
            await assertNoFilesharing(sender);
        });

        it('does not send broadcast to admin (focus)', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);

            clients.push(foc, sender);
            await sender.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1',
                name: 'test.pdf' });

            await assertNoFilesharing(foc);
        });

        it('overwrites author fields to prevent spoofing', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);
            const receiver = await connect(r);

            clients.push(foc, sender, receiver);
            await sender.joinRoom(r);
            await receiver.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, {
                fileId: 'file1',
                authorParticipantId: 'FAKE_ID',
                authorParticipantJid: 'fake@evil.com'
            });

            const { file } = parseBroadcast(await waitForFilesharing(receiver));

            assert.notEqual(file.authorParticipantId, 'FAKE_ID',
                'authorParticipantId must be overwritten by Prosody');
            assert.notEqual(file.authorParticipantJid, 'fake@evil.com',
                'authorParticipantJid must be overwritten by Prosody');
            assert.ok(file.authorParticipantId, 'authorParticipantId must be set');
            assert.ok(file.authorParticipantJid, 'authorParticipantJid must be set');
        });

    });

    // ── remove file ───────────────────────────────────────────────────────────

    describe('remove file', () => {

        it('broadcasts remove event to other occupants', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);
            const receiver = await connect(r);

            clients.push(foc, sender, receiver);
            await sender.joinRoom(r);
            await receiver.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });

            // Add first, wait for add broadcast to confirm it landed.
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1',
                name: 'test.pdf' });
            await waitForFilesharing(receiver);

            // Now remove.
            sender.sendFileSharingRemove(FILESHARING_COMPONENT, 'file1');

            const broadcast = await waitForFilesharing(receiver);
            const payload = parseBroadcast(broadcast);

            assert.equal(payload.type, 'file-sharing');
            assert.equal(payload.event, 'remove');
            assert.equal(payload.fileId, 'file1');
        });

        it('removed file is not delivered to subsequent joiners', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);

            // Raise the limit: need sender + watcher + late joiner (3 regular occupants).
            await setRoomMaxOccupants(r, 10);

            const sender = await connect(r);
            const watcher = await connect(r);

            clients.push(foc, sender, watcher);
            await sender.joinRoom(r);
            await watcher.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });

            // Add then remove — observe both broadcasts on watcher so we know
            // Prosody has fully processed them before the late joiner connects.
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1',
                name: 'test.pdf' });
            await waitForFilesharing(watcher);

            sender.sendFileSharingRemove(FILESHARING_COMPONENT, 'file1');
            await waitForFilesharing(watcher);

            const late = await connect(r);

            clients.push(late);
            await late.joinRoom(r);

            await assertNoFilesharing(late);
        });

    });

    // ── new joiner receives file list ─────────────────────────────────────────

    describe('new joiner receives file list', () => {

        it('joiner receives list of existing files', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);

            // Raise the limit: need sender + watcher + late joiner (3 regular occupants).
            await setRoomMaxOccupants(r, 10);

            const sender = await connect(r);
            const watcher = await connect(r);

            clients.push(foc, sender, watcher);
            await sender.joinRoom(r);
            await watcher.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });

            // Add a file and wait for it to land before the late joiner connects.
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1',
                name: 'test.pdf' });
            await waitForFilesharing(watcher);

            const late = await connect(r);

            clients.push(late);
            await late.joinRoom(r);

            const broadcast = await waitForFilesharing(late);
            const payload = parseBroadcast(broadcast);

            assert.equal(payload.type, 'file-sharing');
            assert.equal(payload.event, 'list');
            assert.ok(payload.files?.file1, 'file list must include the added file');
        });

        it('joiner receives nothing when no files have been shared', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const first = await connect(r);
            const late = await connect(r);

            clients.push(foc, first, late);
            await first.joinRoom(r);
            await late.joinRoom(r);

            await assertNoFilesharing(late);
        });

    });

    // ── authorization ─────────────────────────────────────────────────────────

    describe('authorization', () => {

        it('non-occupant message is silently ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const nonOccupant = await connect(r); // connected but NOT joined
            const receiver = await connect(r);

            clients.push(foc, nonOccupant, receiver);
            await receiver.joinRoom(r);

            await setSessionContext(nonOccupant.jid, 'user-a', { 'file-upload': true });
            nonOccupant.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1' });

            await assertNoFilesharing(receiver);
        });

        it('message without jitsi_web_query_room is silently ignored', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const noRoom = await createXmppClient(); // no ?room= param
            const receiver = await connect(r);

            clients.push(foc, noRoom, receiver);
            await receiver.joinRoom(r);

            noRoom.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1' });

            await assertNoFilesharing(receiver);
        });

        it('non-owner with no token features receives forbidden error', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const member = await connect(r);

            clients.push(foc, member);
            await member.joinRoom(r);
            // No setSessionContext — no features, member affiliation.

            member.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1' });

            const err = await member.waitForMessage(s => s.attrs.type === 'error', 3000);

            assert.equal(err.attrs.type, 'error');
            assert.ok(
                err.getChild('error')?.getChild('forbidden'),
                'expected <forbidden/> in error stanza'
            );
        });

        it('client with file-upload feature can add file', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);
            const receiver = await connect(r);

            clients.push(foc, sender, receiver);
            await sender.joinRoom(r);
            await receiver.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, { fileId: 'file1',
                name: 'test.pdf' });

            const broadcast = await waitForFilesharing(receiver);

            assert.equal(parseBroadcast(broadcast).event, 'add');
        });

    });

    // ── invalid payloads ──────────────────────────────────────────────────────

    describe('invalid payloads', () => {

        it('add without fileId in JSON body is dropped silently', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);
            const receiver = await connect(r);

            clients.push(foc, sender, receiver);
            await sender.joinRoom(r);
            await receiver.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });
            sender.sendFileSharingAdd(FILESHARING_COMPONENT, { name: 'no-id.pdf' }); // no fileId

            await assertNoFilesharing(receiver);
        });

        it('remove without fileId attribute is dropped silently', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);
            const receiver = await connect(r);

            clients.push(foc, sender, receiver);
            await sender.joinRoom(r);
            await receiver.joinRoom(r);

            await setSessionContext(sender.jid, 'user-a', { 'file-upload': true });

            // Remove stanza with no fileId attribute — the module logs an error
            // and returns true without firing any event.
            sender.sendFileSharingRaw(FILESHARING_COMPONENT, {}, { type: 'remove' });

            await assertNoFilesharing(receiver);
        });

        it('error-type message is ignored without triggering a reply', async () => {
            const r = nextRoom();
            const foc = await joinWithFocus(r);
            const sender = await connect(r);

            clients.push(foc, sender);
            await sender.joinRoom(r);

            // type='error' stanzas must be silently dropped (early return in on_message).
            sender.sendFileSharingRaw(
                FILESHARING_COMPONENT,
                { type: 'error' },
                { type: 'add' },
                JSON.stringify({ fileId: 'f1' })
            );

            // Module must not reply with another error (would cause a loop).
            try {
                await sender.waitForMessage(s => s.attrs.type === 'error', 1000);
                assert.fail('received unexpected error reply to error stanza');
            } catch (err) {
                assert.ok(err.message.includes('Timeout'),
                    `unexpected error: ${err.message}`);
            }
        });

    });

});
