import { createXmppClient, joinWithFocus } from './xmpp_client.js';

/**
 * Creates a per-test context that tracks connected clients and provides
 * convenience helpers for connecting as different participant types.
 * Call in beforeEach; call cleanup() in afterEach.
 *
 * @returns {{ connect: Function, connectWhitelisted: Function, connectFocus: Function, cleanup: Function }}
 */
export function createTestContext() {
    const clients = [];

    return {
        /**
         * Creates a regular XMPP client and registers it for cleanup.
         *
         * @returns {Promise<XmppTestClient>}
         */
        async connect() {
            const c = await createXmppClient();

            clients.push(c);

            return c;
        },

        /**
         * Creates a whitelisted XMPP client (domain: whitelist.localhost) and
         * registers it for cleanup. Whitelisted clients bypass the occupant limit.
         *
         * @returns {Promise<XmppTestClient>}
         */
        async connectWhitelisted() {
            const c = await createXmppClient({ domain: 'whitelist.localhost' });

            clients.push(c);

            return c;
        },

        /**
         * Joins the room as focus (jicofo), unlocking the mod_muc_meeting_id
         * jicofo lock. The focus client is whitelisted and does not count
         * against the occupant limit. Registers the client for cleanup.
         *
         * @param {string} roomJid  full room JID, e.g. 'room@conference.localhost'
         * @returns {Promise<XmppTestClient>}
         */
        async connectFocus(roomJid) {
            const c = await joinWithFocus(roomJid);

            clients.push(c);

            return c;
        },

        /**
         * Disconnects all clients created through this context.
         *
         * @returns {Promise<void>}
         */
        async cleanup() {
            await Promise.all(clients.map(c => c.disconnect()));
        }
    };
}
