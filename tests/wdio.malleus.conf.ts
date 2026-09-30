// wdio.malleus.conf.ts
// The configuration for Malleus Jitsificus, the load tester. It reuses the regular configuration (Chrome
// arguments, grid support, reporting and log handling) but generates one browser session per participant
// from the MALLEUS_* settings instead of from the spec files, and runs the single malleus spec with no timeout.
// Start it through malleus/cli.ts (npm run malleus), which maps command line flags onto the environment.
import fs from 'fs';
import path from 'node:path';
import process from 'node:process';

import { getTestProperties } from './helpers/TestProperties';
import { initLogger } from './helpers/browserLogger';
import { applyGridConfig } from './helpers/grid';
import { IContext } from './helpers/types';
import {
    LOAD_TEST_PAGE,
    RECEIVER_NODE_APP_NAME,
    SENDER_NODE_APP_NAME,
    layoutBrowsers,
    loadMalleusConfig
} from './malleus/MalleusConfig';
// @ts-ignore
import { TEST_RESULTS_DIR, chromeArgs, chromePreferences, config as defaultConfig } from './wdio.conf.ts';

// Validated here too, so a bad setting fails the run before any browser starts. The spec prints the summary.
const malleusConfig = loadMalleusConfig();

/**
 * One multiremote instance per browser session; with tabs per browser a session runs several participants.
 */
function generateCapabilities(): Record<string, any> {
    const capabilities: Record<string, any> = {};

    for (let c = 0; c < malleusConfig.conferences; c++) {
        for (const browser of layoutBrowsers(malleusConfig, c)) {
            const caps: Record<string, any> = {
                browserName: 'chrome',

                // On the grid a bare browserName matches every Chrome slot, beta included; pin the alias the grid
                // uses for stable, as the regular suite does. Local chromedriver does not know the alias.
                ...(process.env.GRID_HOST_URL ? { browserVersion: process.env.MALLEUS_BROWSER_VERSION || 'jitsi-stable' } : {}),
                'goog:chromeOptions': {
                    args: chromeArgs,
                    prefs: chromePreferences
                }
            };

            if (malleusConfig.useNodeTypes) {
                // Video senders go to sender nodes; everybody else, audio senders included, to receiver nodes.
                caps['nodename:applicationName'] = browser.sender ? SENDER_NODE_APP_NAME : RECEIVER_NODE_APP_NAME;
            }

            capabilities[browser.instance] = { capabilities: caps };
        }
    }

    return capabilities;
}

const specs = [ 'malleus/malleus.spec.ts' ];

let config: WebdriverIO.MultiremoteConfig = {
    ...defaultConfig,

    specs,
    exclude: [],
    maxInstances: 1,

    capabilities: generateCapabilities(),

    // Browsers on a loaded grid or deployment can be slow to respond.
    connectionRetryTimeout: 120_000,

    mochaOpts: {
        // A run lasts as long as the configured duration plus the join delays, plus whatever it takes to start
        // and stop the browsers. (A timeout of 0, mocha's "no timeout", is not honored by the wdio wrapper.)
        timeout: malleusConfig.durationMs + malleusConfig.joinDelayMs * malleusConfig.participants + 10 * 60_000
    },

    /**
     * Prepares the context. Unlike the regular suite there is no iframe API page to upload and no keep-alive
     * (the participants are busy for the whole run), and browser logs are only collected on request since
     * subscribing to them for hundreds of sessions is expensive.
     */
    async before(cid, _, files) {
        const testFilePath = files[0].replace(/^file:\/\//, '');
        const testProperties = await getTestProperties(testFilePath);

        console.log(`Running malleus via worker: ${cid} browser instances:${multiRemoteBrowser.instances.length}`);

        const globalAny: any = global;

        globalAny.ctx = {
            times: {},
            testProperties,
            roomName: ''
        } as IContext;

        if (malleusConfig.saveLogs) {
            fs.mkdirSync(TEST_RESULTS_DIR, { recursive: true });
            multiRemoteBrowser.instances.forEach((instance: string) => {
                initLogger(multiRemoteBrowser.getInstance(instance), `${instance}-${cid}-malleus`, TEST_RESULTS_DIR);
            });
        }

        if (malleusConfig.useLoadTest) {
            if (!fs.existsSync(malleusConfig.loadTestBundle)) {
                throw new Error(`The load-test client bundle is missing: ${malleusConfig.loadTestBundle}. `
                    + 'Build it with `npm run build:load-test` at the repository root, or point '
                    + 'MALLEUS_LOAD_TEST_BUNDLE at a build.');
            }

            // Inject the load-test page and client into every browser, the way the regular suite uploads its
            // iframe API page. The uploads land wherever the (possibly remote) browser keeps them, hence the
            // paths are recorded per session for Participant.joinConference to build the URL from.
            await Promise.all(multiRemoteBrowser.instances.map(async (instance: string) => {
                const bInstance = multiRemoteBrowser.getInstance(instance);
                const pagePath = await bInstance.uploadFile(LOAD_TEST_PAGE);
                const bundlePath = await bInstance.uploadFile(malleusConfig.loadTestBundle);

                // @ts-ignore
                bInstance.loadTestPageBase = `file://${path.dirname(pagePath)}`;
                // @ts-ignore
                bInstance.loadTestBundle = bundlePath;
            }));
        }
    },

    /**
     * On failure, hang up everybody who is still in a conference. Skips the screenshots and page sources the
     * regular suite attaches, which do not scale to a load test.
     */
    async afterTest(test, _context, { error }) {
        if (!error) {
            return;
        }

        console.log(`Malleus failed (${test.title}): ${error.message}`);
        console.log('Hanging up all participants');

        // Loaded lazily: Participant pulls in jitsi-meet modules with .web.ts variants, which only resolve once
        // wdio.conf.ts has registered its require hook for them, i.e. not while this file's imports are evaluated.
        const { allMalleusParticipants } = require('./malleus/MalleusParticipant');

        await Promise.allSettled(allMalleusParticipants
            .filter((p: { running: boolean; }) => p.running)
            .map((p: { participant: { hangup: () => Promise<void>; }; }) => p.participant.hangup()));
    }
};

if (process.env.GRID_HOST_URL) {
    config = applyGridConfig(config);
}

// Sanity check: the spec must exist where we expect it, or wdio reports "no specs found" which is confusing.
if (!fs.existsSync(path.join(__dirname, specs[0]))) {
    throw new Error(`Malleus spec not found at ${specs[0]}`);
}

export { config };
