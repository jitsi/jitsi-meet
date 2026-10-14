import assert from 'assert';

import { mintAsapToken } from './helpers/jwt.js';
import { clearJibriIqs, getJibriIqs, getRoomState } from './helpers/test_observer.js';
import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

// mod_jibri_session is loaded on the main VirtualHost. On a client's jibri
// start iq to the focus occupant it writes the room's meetingId to
// app_data.file_recording_metadata.conference_details.session_id and the
// initiator's identity to app_data.file_recording_metadata.initiator. Jicofo
// copies app_data into the iq it sends to jibri.

const CONFERENCE = 'conference.localhost';
const CONFERENCE_SUB = 'conference.subdomain.localhost';

let _roomCounter = 0;
const nextRoom = () => `jibri-session-${++_roomCounter}@${CONFERENCE}`;
const nextSubRoom = () => `jibri-session-sub-${++_roomCounter}@${CONFERENCE_SUB}`;

/**
 * Converts a subdomain room JID (room@conference.sub.localhost) to the
 * internal form Prosody keys rooms by ([sub]room@conference.localhost).
 *
 * @param {string} roomJid
 * @returns {string}
 */
function internalRoomJid(roomJid) {
    const [ node, host ] = roomJid.split('@');
    const sub = host.match(/^conference\.([^.]+)\.localhost$/);

    return sub ? `[${sub[1]}]${node}@${CONFERENCE}` : roomJid;
}

/**
 * Polls the test observer until a Jibri IQ has reached the MUC component.
 *
 * @param {number} [timeout=2000]
 * @returns {Promise<object>} the first recorded IQ.
 */
async function waitForJibriIq(timeout = 2000) {
    const deadline = Date.now() + timeout;

    for (;;) {
        const iqs = await getJibriIqs();

        if (iqs.length > 0) {
            return iqs[0];
        }
        if (Date.now() >= deadline) {
            throw new Error('Timeout waiting for the jibri IQ to reach the MUC');
        }
        await new Promise(r => setTimeout(r, 50));
    }
}

describe('mod_jibri_session', () => {

    const clients = [];

    beforeEach(() => clearJibriIqs());

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    /**
     * Joins a fresh room as focus, then as a client whose token allows
     * recording, and returns the client, the focus and the room's meetingId.
     *
     * @param {string} room  Room JID to join.
     * @returns {Promise<{client: object, focus: object, meetingId: string}>}
     */
    async function setup(room) {
        const focus = await joinWithFocus(room);

        clients.push(focus);

        const token = mintAsapToken({
            room: '*',
            context: {
                user: { id: 'user-1' },
                group: 'group-A',
                features: { recording: true }
            }
        });
        const client = await createXmppClient({ params: { token } });

        clients.push(client);
        await client.joinRoom(room);

        const state = await getRoomState(internalRoomJid(room));

        assert.ok(state?.meeting_id, `room ${room} must have a meetingId`);

        return { client,
            focus,
            meetingId: state.meeting_id };
    }

    // ─── client → jicofo ─────────────────────────────────────────────────────

    describe('client-to-jicofo pass (iq to the focus occupant)', () => {

        it('adds the room meetingId as session_id and the token identity as initiator', async () => {
            const room = nextRoom();
            const { client, meetingId } = await setup(room);

            await client.sendJibriIq(room, 'start', 'file');
            const metadata = JSON.parse((await waitForJibriIq()).app_data).file_recording_metadata;

            // eslint-disable-next-line camelcase
            assert.deepStrictEqual(metadata.conference_details, { session_id: meetingId });
            assert.deepStrictEqual(metadata.initiator, { id: 'user-1',
                group: 'group-A' });
        });

        it('keeps the other app_data the client sent', async () => {
            const room = nextRoom();
            const { client, meetingId } = await setup(room);

            await client.sendJibriIq(room, 'start', 'file', {
                appData: JSON.stringify({
                    // eslint-disable-next-line camelcase
                    file_recording_metadata: { share: true }
                })
            });
            const metadata = JSON.parse((await waitForJibriIq()).app_data).file_recording_metadata;

            assert.strictEqual(metadata.share, true);
            assert.strictEqual(metadata.conference_details.session_id, meetingId);
        });

        it('replaces conference_details sent by the client', async () => {
            const room = nextRoom();
            const { client, meetingId } = await setup(room);

            await client.sendJibriIq(room, 'start', 'file', {
                appData: JSON.stringify({
                    // eslint-disable-next-line camelcase
                    file_recording_metadata: { conference_details: { session_id: 'spoofed' } }
                })
            });
            const metadata = JSON.parse((await waitForJibriIq()).app_data).file_recording_metadata;

            // eslint-disable-next-line camelcase
            assert.deepStrictEqual(metadata.conference_details, { session_id: meetingId });
        });

        it('replaces app_data that is valid JSON but not an object', async () => {
            const room = nextRoom();
            const { client, meetingId } = await setup(room);

            // Before the fix the hook threw, and prosody dropped the iq, so
            // waitForJibriIq timed out.
            await client.sendJibriIq(room, 'start', 'file', { appData: 'null' });
            const metadata = JSON.parse((await waitForJibriIq()).app_data).file_recording_metadata;

            assert.strictEqual(metadata.conference_details.session_id, meetingId);
        });

        it('replaces file_recording_metadata that is not an object', async () => {
            const room = nextRoom();
            const { client, meetingId } = await setup(room);

            await client.sendJibriIq(room, 'start', 'file', {
                appData: JSON.stringify({
                    // eslint-disable-next-line camelcase
                    file_recording_metadata: null,
                    other: 1
                })
            });
            const appData = JSON.parse((await waitForJibriIq()).app_data);

            assert.strictEqual(appData.other, 1);
            assert.strictEqual(appData.file_recording_metadata.conference_details.session_id, meetingId);
            assert.strictEqual(appData.file_recording_metadata.initiator.id, 'user-1');
        });

        it('uses the meetingId of a subdomain room', async () => {
            const room = nextSubRoom();
            const { client, meetingId } = await setup(room);

            await client.sendJibriIq(room, 'start', 'file');
            const metadata = JSON.parse((await waitForJibriIq()).app_data).file_recording_metadata;

            assert.strictEqual(metadata.conference_details.session_id, meetingId);
        });

        it('replaces the initiator sent by the client', async () => {
            const room = nextRoom();
            const { client } = await setup(room);

            await client.sendJibriIq(room, 'start', 'file', {
                appData: JSON.stringify({
                    // eslint-disable-next-line camelcase
                    file_recording_metadata: { initiator: { id: 'other' } }
                })
            });
            const metadata = JSON.parse((await waitForJibriIq()).app_data).file_recording_metadata;

            assert.deepStrictEqual(metadata.initiator, { id: 'user-1',
                group: 'group-A' });
        });

        it('takes the room from the iq address and ignores a room attribute', async () => {
            const otherRoom = nextRoom();

            clients.push(await joinWithFocus(otherRoom));

            const otherState = await getRoomState(otherRoom);
            const room = nextRoom();
            const { client, meetingId } = await setup(room);

            assert.notStrictEqual(otherState?.meeting_id, meetingId);

            await client.sendJibriIqTo(`${room}/focus`, {
                action: 'start',
                // eslint-disable-next-line camelcase
                recording_mode: 'file',
                room: otherRoom
            });
            const metadata = JSON.parse((await waitForJibriIq()).app_data).file_recording_metadata;

            assert.strictEqual(metadata.conference_details.session_id, meetingId);
            assert.strictEqual(metadata.initiator.id, 'user-1');
        });

        it('does not touch app_data of a stop iq', async () => {
            const room = nextRoom();
            const { client } = await setup(room);

            await client.sendJibriIq(room, 'stop', 'file');

            assert.strictEqual((await waitForJibriIq()).app_data, undefined);
        });
    });
});
