import assert from 'assert';
import { createXmppClient } from './helpers/xmpp_client.js';
import { prosodyShell } from './helpers/prosody_shell.js';
import { getRoomState, clearEvents, getEvents } from './helpers/test_observer.js';

const CONFERENCE = 'conference.localhost';

let _roomCounter = 0;
const room = () => `hide-all-${++_roomCounter}@${CONFERENCE}`;

describe('mod_muc_hide_all', () => {

    // -------------------------------------------------------------------------
    // Module DISABLED — Prosody default behaviour applies
    // -------------------------------------------------------------------------
    describe('when module is disabled', () => {
        before(async () => {
            // Option I: use prosodyctl shell to unload the module at runtime.
            await prosodyShell('module:unload("muc_hide_all", "conference.localhost")');
        });

        after(async () => {
            await prosodyShell('module:load("muc_hide_all", "conference.localhost")');
        });

        it('non-occupant disco#info to an existing room succeeds', async () => {
            const r = room();
            const owner = await createXmppClient();
            const stranger = await createXmppClient();

            try {
                await owner.joinRoom(r);
                const iq = await stranger.sendDiscoInfo(r);
                assert.equal(iq.attrs.type, 'result',
                    'expected IQ result — Prosody default allows disco#info from non-occupants');
            } finally {
                await owner.disconnect();
                await stranger.disconnect();
            }
        });
    });

    // -------------------------------------------------------------------------
    // Module ENABLED (default state)
    // -------------------------------------------------------------------------
    describe('when module is enabled', () => {

        beforeEach(() => clearEvents());

        it('new room is set to hidden', async () => {
            const r = room();
            const owner = await createXmppClient();

            try {
                await owner.joinRoom(r);

                // Option II: query Prosody's internal room state through mod_test_observer HTTP.
                const state = await getRoomState(r);
                assert.ok(state, 'room should exist in Prosody');
                assert.equal(state.hidden, true, 'room should be hidden after creation');
            } finally {
                await owner.disconnect();
            }
        });

        it('muc-room-pre-create event is fired when room is created', async () => {
            const r = room();
            const owner = await createXmppClient();

            try {
                await owner.joinRoom(r);
                const events = await getEvents();
                const preCreate = events.find(e => e.event === 'muc-room-pre-create' && e.room === r);
                assert.ok(preCreate,
                    `expected muc-room-pre-create event for room ${r}`);
            } finally {
                await owner.disconnect();
            }
        });

        it('non-occupant disco#info returns <forbidden>', async () => {
            const r = room();
            const owner = await createXmppClient();
            const stranger = await createXmppClient();

            try {
                await owner.joinRoom(r);
                const iq = await stranger.sendDiscoInfo(r);
                assert.equal(iq.attrs.type, 'error');
                assert.ok(
                    iq.getChild('error')?.getChild('forbidden'),
                    'expected <forbidden/> in error stanza'
                );
            } finally {
                await owner.disconnect();
                await stranger.disconnect();
            }
        });

        it('occupant disco#info succeeds', async () => {
            const r = room();
            const occupant = await createXmppClient();

            try {
                await occupant.joinRoom(r);
                const iq = await occupant.sendDiscoInfo(r);
                assert.equal(iq.attrs.type, 'result');
            } finally {
                await occupant.disconnect();
            }
        });
    });
});
