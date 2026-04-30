import { client, xml } from '@xmpp/client';

let _counter = 0;

/**
 * Connects as a focus (jicofo) participant, joins roomJid with nick 'focus',
 * and returns the client. This unlocks the mod_muc_meeting_id jicofo lock so
 * that regular clients can subsequently join the same room.
 *
 * The focus client uses domain 'focus.localhost', which is whitelisted in
 * mod_muc_max_occupants so it never counts against the occupant limit.
 *
 * The caller is responsible for disconnecting the returned client (typically
 * by pushing it into the test's `clients` array for afterEach cleanup).
 *
 * @param {string} roomJid  full room JID, e.g. 'room@conference.localhost'
 * @returns {Promise<XmppTestClient>}
 */
export async function joinWithFocus(roomJid) {
    const c = await createXmppClient({ domain: 'focus.localhost' });

    await c.joinRoom(roomJid, 'focus');

    return c;
}

/**
 * Creates a connected anonymous XMPP client.
 * Prosody must be configured with `authentication = "anonymous"` and no TLS.
 *
 * @param {object} opts
 * @param {string} [opts.host='localhost']   TCP host to connect to.
 * @param {number} [opts.port=5222]          TCP port.
 * @param {string} [opts.domain]             XMPP domain (stream header). Defaults to host.
 *                                           Set to a different VirtualHost name (e.g.
 *                                           'whitelist.localhost') to get a JID on that
 *                                           domain without changing the TCP target.
 * @returns {Promise<XmppTestClient>}
 */
export async function createXmppClient({ host = 'localhost', port = 5222, domain } = {}) {
    const xmpp = client({
        service: `xmpp://${host}:${port}`,
        domain: domain ?? host
    });

    // id -> { resolve, reject, timer }
    const pendingIqs = new Map();
    const stanzaQueue = [];

    xmpp.on('stanza', stanza => {
        const id = stanza.attrs.id;

        if (stanza.name === 'iq' && id && pendingIqs.has(id)) {
            const { resolve, timer } = pendingIqs.get(id);

            clearTimeout(timer);
            pendingIqs.delete(id);
            resolve(stanza);

            return;
        }
        stanzaQueue.push(stanza);
    });

    await xmpp.start();

    return {
        jid: xmpp.jid?.toString(),

        /**
         * Joins a MUC room. Resolves with the self-presence stanza (may have type='error').
         * @param {string} roomJid  e.g. 'room@conference.localhost'
         * @param {string} [nick]   defaults to a unique generated nick
         */
        async joinRoom(roomJid, nick) {
            const n = nick ?? `user${++_counter}`;

            await xmpp.send(
                xml('presence', { to: `${roomJid}/${n}` },
                    xml('x', { xmlns: 'http://jabber.org/protocol/muc' })
                )
            );

            const presence = await waitForPresence(stanzaQueue, roomJid);

            // Prosody 13 locks newly created rooms (XEP-0045 §10.1.3) until the
            // owner submits a configuration form. Status 201 means the room was
            // just created — submit an empty form to accept defaults and unlock.
            const x = presence.getChild('x', 'http://jabber.org/protocol/muc#user');
            const isNewRoom = x?.getChildren('status').some(st => st.attrs.code === '201');

            if (isNewRoom) {
                await sendIq(xmpp, pendingIqs,
                    xml('iq', { type: 'set',
                        to: roomJid },
                        xml('query', { xmlns: 'http://jabber.org/protocol/muc#owner' },
                            xml('x', { xmlns: 'jabber:x:data',
                                type: 'submit' })
                        )
                    )
                );
            }

            return presence;
        },

        /**
         * Sends a disco#info IQ and resolves with the response stanza.
         * @param {string} targetJid
         */
        sendDiscoInfo(targetJid) {
            return sendIq(xmpp, pendingIqs,
                xml('iq', { type: 'get',
                    to: targetJid,
                    id: `disco-${++_counter}` },
                    xml('query', { xmlns: 'http://jabber.org/protocol/disco#info' })
                )
            );
        },

        async disconnect() {
            try {
                await xmpp.stop();
            } catch { /* ignore on teardown */ }
        }
    };
}

/**
 * Sends an IQ stanza and resolves with the response, matched by id.
 * Attaches a generated id to the stanza if one is not already present.
 */
async function sendIq(xmpp, pendingIqs, stanza, timeout = 5000) {
    if (!stanza.attrs.id) {
        stanza.attrs.id = `iq-${++_counter}`;
    }
    const id = stanza.attrs.id;

    await xmpp.send(stanza);

    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            pendingIqs.delete(id);
            reject(new Error(`Timeout waiting for IQ response (id=${id})`));
        }, timeout);

        pendingIqs.set(id, { resolve,
            reject,
            timer });
    });
}

/**
 * Waits for either:
 *   - a self-presence from the room (status code 110), indicating successful join
 *   - an error presence from the room, indicating the join was rejected
 */
function waitForPresence(queue, roomJid, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const deadline = Date.now() + timeout;

        const check = () => {
            for (let i = 0; i < queue.length; i++) {
                const s = queue[i];

                if (s.name !== 'presence') {
                    continue;
                }
                const from = s.attrs.from ?? '';

                if (!from.startsWith(`${roomJid}/`)) {
                    continue;
                }

                // Rejected join — error presence sent directly back to client.
                if (s.attrs.type === 'error') {
                    queue.splice(i, 1);
                    resolve(s);

                    return;
                }

                // Self-presence: Prosody adds status code 110 to confirm this is our own join.
                const x = s.getChild('x', 'http://jabber.org/protocol/muc#user');

                if (x?.getChildren('status').some(st => st.attrs.code === '110')) {
                    queue.splice(i, 1);
                    resolve(s);

                    return;
                }
            }

            if (Date.now() >= deadline) {
                reject(new Error(`Timeout waiting for presence from ${roomJid}`));

                return;
            }

            setTimeout(check, 50);
        };

        check();
    });
}
