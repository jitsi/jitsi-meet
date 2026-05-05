import { client, xml } from '@xmpp/client';

let _counter = 0;

/**
 * Creates an anonymous XMPP client and joins a Jigasi brewery MUC with a
 * colibri stats presence extension, simulating a Jigasi SIP gateway instance.
 * The presence advertises supports_sip and stress_level so that
 * mod_muc_jigasi_invite can select this instance for dial-out.
 *
 * @param {string} breweryJid  Full brewery room JID, e.g.
 *                             'jigasibrewery@internal.auth.localhost'
 * @param {string} [nick]      MUC nick (must not be 'focus'). Defaults to a
 *                             unique generated nick.
 * @param {object} [opts]
 * @param {boolean} [opts.supportsSip=true]   Advertise SIP support.
 * @param {number}  [opts.stressLevel=0.1]    Stress level (lower = preferred).
 * @returns {Promise<XmppTestClient>}
 */
export async function joinWithJigasi(breweryJid, nick, { supportsSip = true, stressLevel = 0.1 } = {}) {
    const statsEl = xml('stats', { xmlns: 'http://jitsi.org/protocol/colibri' },
        xml('stat', { name: 'supports_sip',
            value: supportsSip ? 'true' : 'false' }),
        xml('stat', { name: 'stress_level',
            value: String(stressLevel) })
    );

    const c = await createXmppClient();

    await c.joinRoom(breweryJid, nick, { extensions: [ statsEl ] });

    return c;
}

/**
 * Connects as the focus (jicofo) admin participant, joins roomJid with nick
 * 'focus', and returns the client. This unlocks the mod_muc_meeting_id jicofo
 * lock so that regular clients can subsequently join the same room.
 *
 * The focus client authenticates as focus@auth.localhost (a Prosody admin), so
 * it is exempt from token_verification checks, is never counted against occupant
 * limits (auth.localhost is in muc_access_whitelist), and can act as room owner.
 *
 * The caller is responsible for disconnecting the returned client (typically
 * by pushing it into the test's `clients` array for afterEach cleanup).
 *
 * @param {string} roomJid  full room JID, e.g. 'room@conference.localhost'
 * @returns {Promise<XmppTestClient>}
 */
export async function joinWithFocus(roomJid) {
    const c = await createXmppClient({
        domain: 'auth.localhost',
        username: 'focus',
        password: 'focussecret'
    });

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
        ...username === undefined ? {} : { username,
            password }
    });

    // Suppress unhandled 'error' events (e.g. WebSocket close after auth failure).
    // Errors surface through the xmpp.start() promise rejection instead.
    // eslint-disable-next-line no-empty-function
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
         * The default MUC nick for this client: first 8 characters of the
         * server-assigned JID local part. Matches the UUID prefix required by
         * Prosody's anonymous_strict mode. Null when the JID is not yet set.
         *
         * @returns {string|null}
         */
        get nick() {
            const local = xmpp.jid?.toString().split('@')[0] ?? '';

            return local ? local.slice(0, 8) : null;
        },

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
        async joinRoom(roomJid, nick, { timeout = 5000, password: roomPassword, extensions = [] } = {}) {
            // Default to the first 8 characters of the local part of the
            // server-assigned JID. Prosody's anonymous_strict mode requires MUC
            // resources to match this prefix, so callers that do not pass an
            // explicit nick automatically satisfy the constraint.
            const selfLocal = xmpp.jid?.toString().split('@')[0] ?? '';
            const n = nick ?? (selfLocal ? selfLocal.slice(0, 8) : `user${++_counter}`);
            const mucX = xml('x', { xmlns: 'http://jabber.org/protocol/muc' });

            if (roomPassword !== undefined) {
                mucX.c('password').t(roomPassword);
            }

            await xmpp.send(
                xml('presence', { to: `${roomJid}/${n}` }, mucX, ...extensions)
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
        setRoomPassword(roomJid, roomPassword) {
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
                                xml('value', {}, roomPassword)
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
                        // eslint-disable-next-line camelcase
                        recording_mode: recordingMode
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

        /**
         * Sends an <end_conference/> message to the given component JID.
         * mod_end_conference uses the sender's jitsi_web_query_room session field
         * (populated by mod_jitsi_session from the ?room= WebSocket URL param) to
         * locate and destroy the target room. Fire-and-forget — the module returns
         * no reply stanza; verify the side-effect via getRoomState.
         *
         * @param {string} componentJid  e.g. 'endconference.localhost'
         */
        sendEndConference(componentJid) {
            return xmpp.send(
                xml('message', { to: componentJid,
                    id: `ec-${++_counter}` },
                    xml('end_conference')
                )
            );
        },

        /**
         * Sends a plain <message> stanza to the given JID with no special children.
         * Useful for testing that the end_conference component ignores messages
         * that lack the <end_conference/> child element.
         *
         * @param {string} to  Destination JID.
         */
        sendPlainMessage(to) {
            return xmpp.send(
                xml('message', { to,
                    id: `msg-${++_counter}` })
            );
        },

        /**
         * Grants moderator role to the occupant identified by nick.
         * The caller must be the room owner (e.g. the focus client).
         * Resolves with the server's IQ response.
         *
         * @param {string} roomJid  e.g. 'room@conference.localhost'
         * @param {string} nick     MUC nick of the occupant to promote.
         */
        grantModerator(roomJid, nick) {
            return sendIq(xmpp, pendingIqs,
                xml('iq', { type: 'set',
                    to: roomJid,
                    id: `mod-${++_counter}` },
                    xml('query', { xmlns: 'http://jabber.org/protocol/muc#admin' },
                        xml('item', { nick,
                            role: 'moderator' })
                    )
                )
            );
        },

        /**
         * Waits for an incoming <presence> stanza that satisfies an optional
         * filter predicate and resolves with it. Non-matching presences are left
         * in the queue. Rejects with a timeout error if no matching presence
         * arrives within the timeout.
         * @param {Function} [filter]    Predicate; defaults to accepting any presence.
         * @param {number}   [timeout=5000]
         */
        waitForPresence(filter = null, timeout = 5000) {
            const pred = filter ?? (() => true);

            return new Promise((resolve, reject) => {
                const deadline = Date.now() + timeout;

                const check = () => {
                    for (let i = 0; i < stanzaQueue.length; i++) {
                        const s = stanzaQueue[i];

                        if (s.name === 'presence' && pred(s)) {
                            resolve(stanzaQueue.splice(i, 1)[0]);

                            return;
                        }
                    }
                    if (Date.now() >= deadline) {
                        reject(new Error('Timeout waiting for presence stanza'));

                        return;
                    }
                    setTimeout(check, 50);
                };

                check();
            });
        },

        /**
         * Convenience wrapper around waitForPresence that matches by full from-JID
         * and optional presence type.
         *
         * @param {string} from     full JID, e.g. 'room@conference.localhost/nick'
         * @param {object} [opts]
         * @param {string} [opts.type]     presence type to match (e.g. 'unavailable')
         * @param {number} [opts.timeout=5000]
         */
        waitForPresenceFrom(from, { type, timeout = 5000 } = {}) {
            return this.waitForPresence(
                s => s.attrs.from === from && (type === undefined || s.attrs.type === type),
                timeout
            );
        },

        /**
         * Waits for an incoming <iq> stanza that satisfies an optional filter
         * predicate and resolves with it. Only unsolicited IQs land here;
         * responses to IQs sent with sendIq are handled via pendingIqs.
         * @param {Function} [filter]    Predicate; defaults to accepting any IQ.
         * @param {number}   [timeout=5000]
         */
        waitForIq(filter = null, timeout = 5000) {
            const pred = filter ?? (() => true);

            return new Promise((resolve, reject) => {
                const deadline = Date.now() + timeout;

                const check = () => {
                    for (let i = 0; i < stanzaQueue.length; i++) {
                        const s = stanzaQueue[i];

                        if (s.name === 'iq' && pred(s)) {
                            resolve(stanzaQueue.splice(i, 1)[0]);

                            return;
                        }
                    }
                    if (Date.now() >= deadline) {
                        reject(new Error('Timeout waiting for IQ stanza'));

                        return;
                    }
                    setTimeout(check, 50);
                };

                check();
            });
        },

        /**
         * Waits for an incoming <message> stanza that satisfies an optional
         * filter predicate and resolves with it. Non-matching messages are left
         * in the queue. Rejects with a timeout error if no matching message
         * arrives within the timeout.
         * @param {Function} [filter]    Predicate; defaults to accepting any message.
         * @param {number}   [timeout=5000]
         */
        waitForMessage(filter = null, timeout = 5000) {
            const pred = filter ?? (() => true);

            return new Promise((resolve, reject) => {
                const deadline = Date.now() + timeout;

                const check = () => {
                    for (let i = 0; i < stanzaQueue.length; i++) {
                        const s = stanzaQueue[i];

                        if (s.name === 'message' && pred(s)) {
                            resolve(stanzaQueue.splice(i, 1)[0]);

                            return;
                        }
                    }
                    if (Date.now() >= deadline) {
                        reject(new Error('Timeout waiting for message stanza'));

                        return;
                    }
                    setTimeout(check, 50);
                };

                check();
            });
        },

        /**
         * Resolves when the underlying XMPP connection goes offline (e.g.
         * because Prosody closed the session). Useful for verifying that
         * mod_muc_auth_ban's async ban — which calls session:close() from
         * the HTTP callback — actually terminates the connection.
         *
         * Rejects with a timeout error if the connection does not drop within
         * the given timeout.
         *
         * @param {number} [timeout=5000]
         */
        waitForDisconnect(timeout = 5000) {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(
                    () => reject(new Error('Timeout waiting for disconnect')),
                    timeout
                );

                xmpp.once('offline', () => {
                    clearTimeout(timer);
                    resolve();
                });
            });
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
