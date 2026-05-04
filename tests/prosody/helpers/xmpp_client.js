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
 * @param {string} [opts.host='localhost']    TCP host to connect to.
 * @param {string} [opts.domain]              XMPP domain (stream header). Defaults to host.
 *                                            Set to a different VirtualHost name (e.g.
 *                                            'whitelist.localhost') to get a JID on that
 *                                            domain without changing the TCP target.
 * @param {object} [opts.params]              Optional query parameters appended to the
 *                                            WebSocket URL (e.g. { previd: 'token' }).
 * @param {string} [opts.username]            SASL username for PLAIN auth. When omitted,
 *                                            ANONYMOUS auth is used.
 * @param {string} [opts.password]            SASL password for PLAIN auth.
 * @returns {Promise<XmppTestClient>}
 */
export async function createXmppClient({ host = 'localhost', domain, params, username, password } = {}) {
    const url = new URL(`ws://${host}:5280/xmpp-websocket`);

    if (params) {
        for (const [ k, v ] of Object.entries(params)) {
            url.searchParams.set(k, v);
        }
    }

    const xmpp = client({
        service: url.toString(),
        domain: domain ?? host,
        ...(username !== undefined ? { username, password } : {})
    });

    // Suppress unhandled 'error' events (e.g. WebSocket close after auth failure).
    // Errors surface through the xmpp.start() promise rejection instead.
    xmpp.on('error', () => {});

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
         * Returns the XEP-0198 stream management resumption token assigned by
         * the server. Only available after the session is online and stream
         * management has been negotiated. Must be read before disconnecting
         * (the token is cleared on offline).
         *
         * @returns {string}
         */
        get smId() {
            return xmpp.streamManagement.id;
        },

        /**
         * Joins a MUC room. Resolves with the self-presence stanza (may have type='error').
         * Rejects with a timeout error if no presence is received within the timeout.
         * @param {string} roomJid       e.g. 'room@conference.localhost'
         * @param {string} [nick]        defaults to a unique generated nick
         * @param {object} [opts]
         * @param {number} [opts.timeout=5000]  ms to wait for presence before rejecting
         * @param {string} [opts.password]       room password to include in the join stanza
         */
        async joinRoom(roomJid, nick, { timeout = 5000, password } = {}) {
            const n = nick ?? `user${++_counter}`;
            const mucX = xml('x', { xmlns: 'http://jabber.org/protocol/muc' });

            if (password !== undefined) {
                mucX.c('password').t(password);
            }

            await xmpp.send(
                xml('presence', { to: `${roomJid}/${n}` }, mucX)
            );

            const presence = await waitForPresence(stanzaQueue, roomJid, timeout);

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
         * Sets (or clears) the password on a MUC room. The client must be the room owner.
         * Resolves when the server acknowledges the configuration change.
         * @param {string} roomJid  e.g. 'room@conference.localhost'
         * @param {string} password  pass empty string to remove the password
         */
        setRoomPassword(roomJid, password) {
            return sendIq(xmpp, pendingIqs,
                xml('iq', { type: 'set',
                    to: roomJid,
                    id: `cfg-${++_counter}` },
                    xml('query', { xmlns: 'http://jabber.org/protocol/muc#owner' },
                        xml('x', { xmlns: 'jabber:x:data',
                            type: 'submit' },
                            xml('field', { var: 'FORM_TYPE' },
                                xml('value', {}, 'http://jabber.org/protocol/muc#roomconfig')
                            ),
                            xml('field', { var: 'muc#roomconfig_roomsecret' },
                                xml('value', {}, password)
                            )
                        )
                    )
                )
            );
        },

        /**
         * Sends a Jibri IQ (http://jitsi.org/protocol/jibri) to the focus
         * occupant of the given room. Fire-and-forget — does NOT wait for a
         * response, because mod_filter_iq_jibri may block it before it reaches
         * any handler that would reply, and the test asserts via the
         * /jibri-iqs HTTP endpoint instead.
         *
         * @param {string} roomJid         e.g. 'room@conference.localhost'
         * @param {string} action          'start' | 'stop' | 'status' etc.
         * @param {string} recordingMode   'file' (recording) | 'stream' (livestreaming)
         */
        sendJibriIq(roomJid, action, recordingMode) {
            // Directed to focus's occupant full JID so `pre-iq/full` fires on the
            // main VirtualHost where mod_filter_iq_jibri is loaded.
            return xmpp.send(
                xml('iq', { type: 'set',
                    to: `${roomJid}/focus`,
                    id: `jibri-${++_counter}` },
                    xml('jibri', {
                        xmlns: 'http://jitsi.org/protocol/jibri',
                        action,
                        recording_mode: recordingMode,
                    })
                )
            );
        },

        /**
         * Sends a Rayo dial IQ (urn:xmpp:rayo:1) to the focus occupant of the
         * given room. Fire-and-forget — does NOT wait for a response, because
         * mod_filter_iq_rayo may block it, and the test asserts via the
         * /dial-iqs HTTP endpoint instead.
         *
         * @param {string} roomJid          e.g. 'room@conference.localhost'
         * @param {string} [dialTo='sip:test@example.com']  value for dial's `to` attribute.
         *                                  Pass 'jitsi_meet_transcribe' to trigger
         *                                  the transcription feature gate.
         * @param {string|null} [roomNameHeader]  value for the JvbRoomName header.
         *                                  Defaults to `roomJid` (correct value).
         *                                  Pass null to omit the header entirely.
         *                                  Pass any other string for a mismatch test.
         */
        sendRayoIq(roomJid, dialTo = 'sip:test@example.com', roomNameHeader = roomJid) {
            const headers = [];

            if (roomNameHeader !== null) {
                headers.push(xml('header', {
                    xmlns: 'urn:xmpp:rayo:1',
                    name: 'JvbRoomName',
                    value: roomNameHeader
                }));
            }

            return xmpp.send(
                xml('iq', { type: 'set',
                    to: `${roomJid}/focus`,
                    id: `rayo-${++_counter}` },
                    xml('dial', {
                        xmlns: 'urn:xmpp:rayo:1',
                        to: dialTo,
                        from: 'fromdomain'
                    }, ...headers)
                )
            );
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
        },

        /**
         * Abruptly closes the underlying WebSocket without sending a stream
         * close. Prosody will put the session into smacks hibernation, keeping
         * it in full_sessions so mod_auth_jitsi-anonymous can find it by
         * resumption_token on the next connect.
         */
        dropConnection() {
            try {
                xmpp.websocket?.socket?.end();
            } catch { /* ignore */ }
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
