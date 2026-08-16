import assert from 'assert';

import { createXmppClient, joinWithFocus } from './helpers/xmpp_client.js';

const MUC = 'conference.localhost';
const ROOM = `test-pw-whitelist@${MUC}`;
const PASSWORD = 'roompassword';

describe('mod_muc_password_whitelist', () => {

    const clients = [];

    afterEach(async () => {
        await Promise.all(clients.map(c => c.disconnect()));
        clients.length = 0;
    });

    it('whitelisted domain joins password-protected room without providing password', async () => {
        // Focus unlocks the room; focus client is the owner and sets the password.
        const focus = await joinWithFocus(ROOM);

        clients.push(focus);
        await focus.setRoomPassword(ROOM, PASSWORD);

        // Client from whitelisted domain joins without supplying the password.
        const whitelisted = await createXmppClient({ domain: 'whitelist.localhost' });

        clients.push(whitelisted);
        const presence = await whitelisted.joinRoom(ROOM);

        assert.notEqual(presence.attrs.type, 'error', 'whitelisted client must join without password');
    });

    it('non-whitelisted client is rejected when joining without password', async () => {
        // Focus unlocks the room and sets the password.
        const focus = await joinWithFocus(ROOM);

        clients.push(focus);
        await focus.setRoomPassword(ROOM, PASSWORD);

        // Client from non-whitelisted domain joins without a password.
        const guest = await createXmppClient({ domain: 'localhost' });

        clients.push(guest);
        const presence = await guest.joinRoom(ROOM);

        assert.equal(presence.attrs.type, 'error', 'non-whitelisted client must be rejected without password');
    });

    it('non-whitelisted client joins with correct password', async () => {
        // Focus unlocks the room and sets the password.
        const focus = await joinWithFocus(ROOM);

        clients.push(focus);
        await focus.setRoomPassword(ROOM, PASSWORD);

        // Client from non-whitelisted domain joins with the correct password.
        const guest = await createXmppClient({ domain: 'localhost' });

        clients.push(guest);
        const presence = await guest.joinRoom(ROOM, undefined, { password: PASSWORD });

        assert.notEqual(presence.attrs.type, 'error', 'non-whitelisted client must join with correct password');
    });
});
