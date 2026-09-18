/* global config */

/**
 * The entry point of the load-test client bundle: a page that joins a conference with lib-jitsi-meet only, no
 * UI, to generate load. Built by `npm run build:load-test` into build/load-test-participant.min.js; it is not
 * part of the deployed application. Malleus (tests/malleus) uploads it into the browsers it drives together
 * with tests/resources/loadTest.html, which loads config.js and lib-jitsi-meet from the deployment under test.
 *
 * Page parameters are passed in the URL hash the way jitsi-meet does it (JSON values, e.g. room="foo"):
 * - config.*: overrides applied to the deployment's config, as in jitsi-meet;
 * - room: the room name; if missing it is taken from the URL path as jitsi-meet would;
 * - domain: the deployment's host, used to absolutize protocol-relative XMPP URLs in its config;
 * - jwt: a token to connect with (also accepted as a ?jwt= query parameter);
 * - numClients, clientInterval: how many clients to run in this page and the delay between starting them;
 * - isHuman: whether to receive (and render) remote media, off by default;
 * - localVideo, localAudio, remoteVideo, remoteAudio, autoPlayVideo, stageView: explicit overrides of the
 *   behavior otherwise derived from the config;
 * - windowWidth, windowHeight: the window size of the emulated jitsi-meet client, which decides the video sizes
 *   it asks the bridge for (default 1280x1024, what the test suite runs Chrome with).
 */
// @ts-expect-error
import Logger from '@jitsi/logger';

import JitsiMeetInMemoryLogStorage from '../base/logging/JitsiMeetInMemoryLogStorage';
import { parseURLParams } from '../base/util/parseURLParams';
import { parseURIString } from '../base/util/uri';

import { ILoadTestParams, LoadTestClient } from './LoadTestClient';
import { DEFAULT_WINDOW_HEIGHT, DEFAULT_WINDOW_WIDTH } from './layout';

/**
 * Applies the config.* URL parameters to the config, without the whitelist the application uses.
 *
 * @param {Object} params - The parsed URL parameters.
 * @returns {void}
 */
function setConfigFromURLParams(params: Record<string, any>): void {
    for (const param of Object.keys(params)) {
        const names = param.split('.');

        if (names.shift() !== 'config' || !names.length) {
            continue;
        }

        let base: any = config;
        const last = names.pop() as string;

        for (const name of names) {
            base = base[name] = base[name] || {};
        }
        base[last] = params[param];
    }
}

/**
 * Makes protocol-relative XMPP URLs ("//host/http-bind") absolute, using the given host if the URL has none.
 * Needed because the page is loaded from a file:// URL, not from the deployment.
 *
 * @param {string|undefined} domain - The deployment's host.
 * @returns {void}
 */
function absolutizeXmppUrls(domain?: string): void {
    const conf = config as any;

    for (const key of [ 'bosh', 'websocket', 'websocketKeepAliveUrl' ]) {
        const value = conf[key];

        if (typeof value !== 'string') {
            continue;
        }
        if (value.startsWith('//')) {
            conf[key] = `${key === 'bosh' ? 'https:' : 'wss:'}${value}`;
        } else if (value.startsWith('/') && domain) {
            conf[key] = `${key === 'bosh' ? 'https' : 'wss'}://${domain}${value}`;
        }
    }
}

const params = parseURLParams(window.location.toString(), false, 'hash');

setConfigFromURLParams(params);
absolutizeXmppUrls(params.domain);

const { isHuman = false } = params;
const {
    localVideo = config.startWithVideoMuted !== true,
    localAudio = !config.disableInitialGUM && !config.startWithAudioMuted,
    remoteVideo = isHuman,
    remoteAudio = isHuman,
    autoPlayVideo = config.testing?.noAutoPlayVideo !== true,
    stageView = Boolean(config.disableTileView),
    numClients = 1,
    clientInterval = 100, // ms
    windowWidth = DEFAULT_WINDOW_WIDTH,
    windowHeight = DEFAULT_WINDOW_HEIGHT
} = params;

const roomName: string = params.room || parseURIString(window.location.toString())?.room;
const jwt: string | undefined = params.jwt || parseURLParams(window.location.toString(), true, 'search').jwt;

const loadTestParams: ILoadTestParams = {
    autoPlayVideo,
    jwt,
    localAudio,
    localVideo,
    remoteAudio,
    remoteVideo,
    roomName,
    stageView,
    windowHeight,
    windowWidth
};

let clients: LoadTestClient[] = [];

// The same surface that the tests use on the real application (APP.conference.*), plus load-test specifics.
(window as any).APP = {
    conference: {
        getStats() {
            return clients[0]?.room?.connectionQuality.getStats();
        },
        getConnectionState() {
            return clients[0]?.room?.getConnectionState();
        },
        muteAudio(mute: boolean, num?: number) {
            if (num === undefined) {
                clients.forEach(client => client.muteAudio(mute));
            } else {
                clients[num]?.muteAudio(mute);
            }
        }
    },

    get room() {
        return clients[0]?.room;
    },
    get connection() {
        return clients[0]?.connection;
    },
    get numParticipants() {
        return clients[0]?.numParticipants;
    },
    get localTracks() {
        return clients[0]?.localTracks;
    },
    get remoteTracks() {
        return clients[0]?.remoteTracks;
    },
    get params() {
        return loadTestParams;
    },
    debugLogs: new JitsiMeetInMemoryLogStorage()
};

/**
 * Leaves the conferences and disconnects all the clients.
 *
 * @returns {void}
 */
function unload() {
    clients.forEach(client => client.unload());
    clients = [];
}

window.addEventListener('beforeunload', unload);
window.addEventListener('unload', unload);

JitsiMeetJS.setLogLevel(JitsiMeetJS.logLevels.TRACE);

const debugLogCollector = new Logger.LogCollector((window as any).APP.debugLogs, { storeInterval: 1000 });

Logger.addGlobalTransport(debugLogCollector);
JitsiMeetJS.addGlobalLogTransport(debugLogCollector);
debugLogCollector.start();

JitsiMeetJS.init(config);

/**
 * Starts a client, and schedules the next one.
 *
 * @param {number} i - The index of the client to start.
 * @returns {void}
 */
function startClient(i: number) {
    // Each client gets its own copy of the config, as it modifies it.
    clients[i] = new LoadTestClient(i, JSON.parse(JSON.stringify(config)), loadTestParams);
    clients[i].connect();
    if (i + 1 < numClients) {
        setTimeout(() => startClient(i + 1), clientInterval);
    }
}

if (!roomName) {
    throw new Error('No room name given (room="..." in the URL hash, or a room path).');
}

if (numClients > 0) {
    startClient(0);
}
