import AllureReporter from '@wdio/allure-reporter';
import { multiremotebrowser } from '@wdio/globals';
import { Buffer } from 'buffer';
import { glob } from 'glob';
import path from 'node:path';
import process from 'node:process';
import pretty from 'pretty';

import { NetworkCapture } from './helpers/NetworkCapture';
import { getTestProperties, loadTestFiles } from './helpers/TestProperties';
import { config as testsConfig } from './helpers/TestsConfig';
import WebhookProxy from './helpers/WebhookProxy';
import { getLogs, initLogger, logInfo, saveLogs } from './helpers/browserLogger';
import { IContext } from './helpers/types';
import { generateRoomName } from './helpers/utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const allure = require('allure-commandline');

// This is deprecated without alternative (https://github.com/nodejs/node/issues/32483)
// we need it to be able to reuse jitsi-meet code in tests
require.extensions['.web.ts'] = require.extensions['.ts'];

/**
 * Discovers which Selenium Grid node a browser session is running on.
 * Supports both Grid 4 (GraphQL) and Grid 3 (REST API).
 * Retries with exponential backoff if session not found (timing issue).
 *
 * @param {string} sessionId - WebDriver session ID.
 * @param {string} gridUrl - Grid hub URL (e.g., "http://grid-hub:4444").
 * @returns {Promise<string | null>} Node hostname/IP or null if discovery fails.
 */
async function discoverGridNode(sessionId: string, gridUrl: string): Promise<string | null> {
    // Retry up to 3 times with delays (session might not be registered immediately)
    const maxRetries = 3;
    const retryDelays = [ 500, 1000, 2000 ]; // ms

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        if (attempt > 0) {
            console.log(`Discovery retry attempt ${attempt + 1}/${maxRetries} after ${retryDelays[attempt - 1]}ms delay`);
            await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
        }

        // Try Grid 4 GraphQL API first
        const grid4Node = await discoverGridNodeGraphQL(sessionId, gridUrl);

        if (grid4Node) {
            return grid4Node;
        }

        // Fall back to Grid 3 REST API
        const grid3Node = await discoverGridNodeREST(sessionId, gridUrl);

        if (grid3Node) {
            return grid3Node;
        }
    }

    return null;
}

/**
 * Gets base grid URL by stripping /wd/hub suffix if present.
 * GraphQL and Grid 3 REST APIs are at root level, not under /wd/hub.
 *
 * @param {string} gridUrl - Grid URL (may include /wd/hub).
 * @returns {string} Base URL without /wd/hub.
 */
function getBaseGridUrl(gridUrl: string): string {
    return gridUrl.replace(/\/wd\/hub\/?$/, '');
}

/**
 * Discovers grid node using Selenium Grid 4 GraphQL API.
 *
 * @param {string} sessionId - WebDriver session ID.
 * @param {string} gridUrl - Grid hub URL.
 * @returns {Promise<string | null>} Node hostname or null.
 */
async function discoverGridNodeGraphQL(sessionId: string, gridUrl: string): Promise<string | null> {
    try {
        const baseUrl = getBaseGridUrl(gridUrl);
        const graphqlUrl = `${baseUrl}/graphql`;

        console.log(`Attempting Grid 4 discovery: ${graphqlUrl} with session ${sessionId}`);

        const response = await fetch(graphqlUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query: `{ session(id: "${sessionId}") { nodeUri } }`
            })
        });

        console.log(`GraphQL response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        console.log('GraphQL response data:', JSON.stringify(data, null, 2));

        const nodeUri = data?.data?.session?.nodeUri;

        if (nodeUri) {
            // Extract hostname from URI: "http://172.18.0.3:5555" -> "172.18.0.3"
            const url = new URL(nodeUri);

            console.log(`Discovered grid node via GraphQL (Grid 4): ${url.hostname}`);

            return url.hostname;
        }

        return null;
    } catch (error) {
        console.log('GraphQL discovery error:', error);

        return null;
    }
}

/**
 * Discovers grid node using Selenium Grid 3 REST API.
 *
 * @param {string} sessionId - WebDriver session ID.
 * @param {string} gridUrl - Grid hub URL.
 * @returns {Promise<string | null>} Node hostname or null.
 */
async function discoverGridNodeREST(sessionId: string, gridUrl: string): Promise<string | null> {
    try {
        const baseUrl = getBaseGridUrl(gridUrl);
        const restUrl = `${baseUrl}/grid/api/testsession?session=${sessionId}`;

        console.log(`Attempting Grid 3 discovery: ${restUrl}`);

        const response = await fetch(restUrl);

        console.log(`REST API response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        console.log('REST API response data:', JSON.stringify(data, null, 2));

        const proxyId = data?.proxyId;

        if (proxyId && data.success) {
            // proxyId format: "http://192.168.1.100:5555"
            const url = new URL(proxyId);

            console.log(`Discovered grid node via REST API (Grid 3): ${url.hostname}`);

            return url.hostname;
        }

        return null;
    } catch (error) {
        console.log('REST API discovery error:', error);

        return null;
    }
}

const chromeArgs = [
    '--allow-insecure-localhost',
    '--use-fake-ui-for-media-stream',
    '--use-fake-device-for-media-stream',
    '--disable-plugins',
    '--mute-audio',
    '--disable-infobars',
    '--autoplay-policy=no-user-gesture-required',
    '--auto-select-desktop-capture-source=Your Entire screen',
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-setuid-sandbox',

    // Avoids - "You are checking for animations on an inactive tab, animations do not run for inactive tabs"
    // when executing waitForStable()
    '--disable-renderer-backgrounding',
    '--use-file-for-fake-audio-capture=tests/resources/fakeAudioStream.wav',

    // Enable remote debugging for CDP access via Puppeteer (required for NetworkCapture)
    // Port 0 means Chrome will choose an available port automatically
    '--remote-debugging-port=35699'
];

if (process.env.RESOLVER_RULES) {
    chromeArgs.push(`--host-resolver-rules=${process.env.RESOLVER_RULES}`);
}
if (process.env.ALLOW_INSECURE_CERTS === 'true') {
    chromeArgs.push('--ignore-certificate-errors');
}
if (process.env.HEADLESS === 'true') {
    chromeArgs.push('--headless');
    chromeArgs.push('--window-size=1280,1024');
}
if (process.env.VIDEO_CAPTURE_FILE) {
    chromeArgs.push(`--use-file-for-fake-video-capture=${process.env.VIDEO_CAPTURE_FILE}`);
}

const chromePreferences = {
    'intl.accept_languages': 'en-US'
};

const specs = [
    'specs/**/*.spec.ts'
];

/**
 * Analyzes test files at config construction time to determine browser requirements
 * and generate capabilities with appropriate exclusions.
 */
function generateCapabilitiesFromSpecs(): Record<string, any> {
    const allSpecFiles: string[] = [];
    const browsers = [ 'p1', 'p2', 'p3', 'p4' ];

    for (const pattern of specs) {
        const matches = glob.sync(pattern, { cwd: path.join(__dirname) });

        allSpecFiles.push(...matches.map(f => path.resolve(__dirname, f)));
    }

    // Load test files to populate the testProperties registry
    loadTestFiles(allSpecFiles);

    // Import TestProperties to access the populated registry
    const { testProperties } = require('./helpers/TestProperties');

    // Determine which browsers need which exclusions
    const browserExclusions: Record<string, Set<string>> = {
        p1: new Set(),
        p2: new Set(),
        p3: new Set(),
        p4: new Set()
    };

    for (const file of allSpecFiles) {
        const props = testProperties[file];
        const relativeFile = path.relative(__dirname, file);

        // If a test doesn't use a particular browser, add it to exclusions for that browser
        if (props?.usesBrowsers) {
            browsers.forEach(browser => {
                if (!props.usesBrowsers!.includes(browser)) {
                    browserExclusions[browser].add(relativeFile);
                }
            });
        }
    }

    return Object.fromEntries(
        browsers.map(browser => [
            browser,
            {
                capabilities: {
                    browserName: 'chrome',
                    ...(browser === 'p1' && process.env.BROWSER_CHROME_BETA ? { browserVersion: 'beta' } : {}),
                    'goog:chromeOptions': {
                        args: chromeArgs,
                        prefs: chromePreferences
                    },
                    'wdio:exclude': Array.from(browserExclusions[browser] || [])
                }
            }
        ])
    );
}

const capabilities = generateCapabilitiesFromSpecs();

const TEST_RESULTS_DIR = 'test-results';

const keepAlive: Array<any> = [];

/** Network capture instances for each browser (when CAPTURE_NETWORK is enabled). */
const networkCaptures: Map<string, NetworkCapture> = new Map();

export const config: WebdriverIO.MultiremoteConfig = {

    runner: 'local',

    specs,

    maxInstances: parseInt(process.env.MAX_INSTANCES || '1', 10), // if changing check onWorkerStart logic

    baseUrl: process.env.BASE_URL || 'https://alpha.jitsi.net/torture/',
    tsConfigPath: './tsconfig.json',

    // Default timeout for all waitForXXX commands.
    waitforTimeout: 1000,

    // Default timeout in milliseconds for request
    // if browser driver or grid doesn't send response
    connectionRetryTimeout: 15_000,

    // Default request retries count
    connectionRetryCount: 3,

    framework: 'mocha',

    mochaOpts: {
        timeout: 180_000
    },

    capabilities,

    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'trace',
    logLevels: {
        webdriver: 'info'
    },

    // Can be used to debug chromedriver, depends on chromedriver and wdio-chromedriver-service
    // services: [
    //     [ 'chromedriver', {
    //         // Pass the --verbose flag to Chromedriver
    //         args: [ '--verbose' ],
    //         // Optionally, define a file to store the logs instead of stdout
    //         logFileName: 'wdio-chromedriver.log',
    //         // Optionally, define a directory for the log file
    //         outputDir: 'test-results',
    //     } ]
    // ],

    // Set directory to store all logs into
    outputDir: TEST_RESULTS_DIR,

    reporters: [
        [ 'junit', {
            outputDir: TEST_RESULTS_DIR,
            outputFileFormat(options) { // optional
                return `results-${options.cid}.xml`;
            }
        } ],
        [ 'allure', {
            // addConsoleLogs: true,
            outputDir: `${TEST_RESULTS_DIR}/allure-results`,
            disableWebdriverStepsReporting: true,
            disableWebdriverScreenshotsReporting: true,
            useCucumberStepReporter: false
        } ]
    ],

    // =====
    // Hooks
    // =====
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * We have overriden this function in beforeSession to be able to pass cid as first param.
     *
     * @returns {Promise<void>}
     */
    async before(cid, _, files) {
        if (files.length !== 1) {
            console.warn('We expect to run a single suite, but got more than one');
        }

        const testFilePath = files[0].replace(/^file:\/\//, '');
        const testName = path.relative('tests/specs', testFilePath)
            .replace(/.spec.ts$/, '')
            .replace(/\//g, '-');
        const testProperties = await getTestProperties(testFilePath);

        console.log(`Running test: ${testName} via worker: ${cid}`);

        const globalAny: any = global;

        globalAny.ctx = {
            times: {}
        } as IContext;
        globalAny.ctx.testProperties = testProperties;

        if (testProperties.useJaas && !testsConfig.jaas.enabled) {
            globalAny.ctx.skipSuiteTests = 'JaaS is not configured';

            return;
        }

        await Promise.all(multiremotebrowser.instances.map(async (instance: string) => {
            const bInstance = multiremotebrowser.getInstance(instance);

            // @ts-ignore
            initLogger(bInstance, `${instance}-${cid}-${testName}`, TEST_RESULTS_DIR);

            // setup keepalive
            keepAlive.push(setInterval(async () => {
                await bInstance.execute(() => console.log(`${new Date().toISOString()} keep-alive`));
            }, 20_000));

            // Discover grid node if running on Selenium Grid
            // This enables automatic network capture support for grid deployments
            if (process.env.GRID_HOST_URL && !bInstance.isFirefox) {
                try {
                    const nodeHostname = await discoverGridNode(bInstance.sessionId, process.env.GRID_HOST_URL);

                    if (nodeHostname) {
                        // Store discovered hostname in capabilities for NetworkCapture and other uses
                        (bInstance.capabilities as any)['custom:nodeHostname'] = nodeHostname;
                        console.log(`${instance}: Discovered running on grid node ${nodeHostname}`);
                    } else {
                        console.warn(`${instance}: Failed to discover grid node, will use fallback methods`);
                    }
                } catch (error) {
                    console.error(`${instance}: Error during grid node discovery:`, error);
                }
            }

            // Setup network capture if enabled
            if (process.env.CAPTURE_NETWORK === 'true' && !bInstance.isFirefox) {
                try {
                    const capture = new NetworkCapture(bInstance);

                    await capture.start();
                    networkCaptures.set(`${instance}-${cid}-${testName}`, capture);
                    console.log(`Network capture started for ${instance}`);
                } catch (error) {
                    console.error(`Failed to start network capture for ${instance}:`, error);
                }
            }

            if (bInstance.isFirefox) {
                return;
            }

            const rpath = await bInstance.uploadFile('tests/resources/iframeAPITest.html');

            // @ts-ignore
            bInstance.iframePageBase = `file://${path.dirname(rpath)}`;
        }));

        globalAny.ctx.roomName = generateRoomName(testName);
        console.log(`Using room name: ${globalAny.ctx.roomName}`);

        if (testProperties.useWebhookProxy && testsConfig.webhooksProxy.enabled && !globalAny.ctx.webhooksProxy) {
            const tenant = testsConfig.jaas.tenant;

            if (!testProperties.useJaas) {
                throw new Error('The test tries to use WebhookProxy without JaaS.');
            }
            if (!tenant) {
                console.log(`Can not configure WebhookProxy, missing tenant in config. Skipping ${testName}.`);
                globalAny.ctx.skipSuiteTests = 'WebHookProxy is required but not configured (missing tenant)';

                return;
            }

            globalAny.ctx.webhooksProxy = new WebhookProxy(
                `${testsConfig.webhooksProxy.url}?tenant=${tenant}&room=${globalAny.ctx.roomName}`,
                testsConfig.webhooksProxy.sharedSecret!,
                `${TEST_RESULTS_DIR}/webhooks-${cid}-${testName}.log`);
            globalAny.ctx.webhooksProxy.connect();
        }

        if (testProperties.requireWebhookProxy && !globalAny.ctx.webhooksProxy) {
            throw new Error('The test requires WebhookProxy, but it is not available.');
        }
    },

    async after() {
        const { ctx }: any = global;

        ctx?.webhooksProxy?.disconnect();
        keepAlive.forEach(clearInterval);

        // Stop network capture and export data
        if (networkCaptures.size > 0) {
            await Promise.all(Array.from(networkCaptures.entries()).map(async ([ key, capture ]) => {
                try {
                    await capture.stop();
                    const outputPath = path.join(TEST_RESULTS_DIR, `network-${key}.json`);

                    capture.exportToJSON(outputPath);

                    const stats = capture.getStats();

                    console.log(`\nNetwork Capture Summary for ${key}:`);
                    console.log(`  Total requests: ${stats.total}`);
                    console.log(`  Succeeded: ${stats.succeeded}`);
                    console.log(`  Failed: ${stats.failed}`);
                    console.log(`  Cached: ${stats.cachedRequests}`);
                } catch (error) {
                    console.error(`Failed to stop/export network capture for ${key}:`, error);
                }
            }));

            networkCaptures.clear();
        }
    },

    beforeSession(c, capabilities_, specs_, cid) {
        const originalBefore = c.before;

        if (!originalBefore || !Array.isArray(originalBefore) || originalBefore.length !== 1) {
            console.warn('No before hook found or more than one found, skipping');

            return;
        }

        if (originalBefore) {
            c.before = [ async function(...args) {
                // Call original with cid as first param, followed by original args
                // @ts-ignore
                return await originalBefore[0].call(c, cid, ...args);
            } ];
        }
    },

    /**
     * Gets executed before the suite starts (in Mocha/Jasmine only).
     *
     * @param {Object} suite - Suite details.
     */
    beforeSuite(suite) {
        multiremotebrowser.instances.forEach((instance: string) => {
            logInfo(multiremotebrowser.getInstance(instance),
                `---=== Begin ${suite.file.substring(suite.file.lastIndexOf('/') + 1)} ===---`);
        });
    },

    /**
     * Function to be executed before a test (in Mocha/Jasmine only).
     *
     * @param {Object} test - Test object.
     * @param {Object} context - The context object.
     */
    beforeTest(test, context) {
        // Use the directory under 'tests/specs' as the parent suite
        const dirMatch = test.file.match(/.*\/tests\/specs\/([^\/]+)\//);
        const dir = dirMatch ? dirMatch[1] : false;
        const fileMatch = test.file.match(/.*\/tests\/specs\/(.*)/);
        const file = fileMatch ? fileMatch[1] : false;

        if (ctx.testProperties.description) {
            AllureReporter.addDescription(ctx.testProperties.description, 'text');
        }

        if (file) {
            AllureReporter.addLink(`https://github.com/jitsi/jitsi-meet/blob/master/tests/specs/${file}`, 'Code');
        }

        if (dir) {
            AllureReporter.addParentSuite(dir);
        }

        if (ctx.skipSuiteTests) {
            if ((typeof ctx.skipSuiteTests) === 'string') {
                AllureReporter.addDescription((ctx.testProperties.description || '')
                    + '\n\nSkipped because: ' + ctx.skipSuiteTests, 'text');
            }
            console.log(`Skipping because: ${ctx.skipSuiteTests}`);

            context.skip();

            return;
        }

        multiremotebrowser.instances.forEach((instance: string) => {
            logInfo(multiremotebrowser.getInstance(instance), `---=== Start test ${test.title} ===---`);
        });
    },

    /**
     * Function to be executed after a test (in Mocha/Jasmine only).
     *
     * @param {Object} test - Test object.
     * @param {Object} context - Scope object the test was executed with.
     * @param {Error}  error - Error object in case the test fails, otherwise `undefined`.
     * @returns {Promise<void>}
     */
    async afterTest(test, context, { error }) {
        multiremotebrowser.instances.forEach((instance: string) =>
            logInfo(multiremotebrowser.getInstance(instance), `---=== End test ${test.title} ===---`));

        if (error) {

            // skip all remaining tests in the suite
            ctx.skipSuiteTests = `Test "${test.title}" has failed.`;

            // make sure all browsers are at the main app in iframe (if used), so we collect debug info
            await Promise.all(multiremotebrowser.instances.map(async (instance: string) => {
                // @ts-ignore
                await ctx[instance]?.switchToIFrame();
            }));

            const allProcessing: Promise<any>[] = [];

            multiremotebrowser.instances.forEach((instance: string) => {
                const bInstance = multiremotebrowser.getInstance(instance);

                allProcessing.push(bInstance.takeScreenshot().then(shot => {
                    AllureReporter.addAttachment(
                        `Screenshot-${instance}`,
                        Buffer.from(shot, 'base64'),
                        'image/png');
                }));

                // @ts-ignore
                allProcessing.push(bInstance.execute(() => typeof APP !== 'undefined' && APP.connection?.getLogs())
                    .then(logs =>
                        logs && AllureReporter.addAttachment(
                            `debug-logs-${instance}`,
                            JSON.stringify(logs, null, '    '),
                            'text/plain'))
                    .catch(e => console.error('Failed grabbing debug logs', e)));

                allProcessing.push(
                    bInstance.execute(() => window.APP?.debugLogs?.logs?.join('\n')).then(res => {
                        if (res) {
                            saveLogs(bInstance, res);
                        }

                        AllureReporter.addAttachment(`console-logs-${instance}`, getLogs(bInstance) || '', 'text/plain');
                    }));

                allProcessing.push(bInstance.getPageSource().then(source => {
                    AllureReporter.addAttachment(`html-source-${instance}`, pretty(source), 'text/plain');
                }));
            });

            await Promise.allSettled(allProcessing);
        }
    },

    /**
     * Hook that gets executed after the suite has ended (in Mocha/Jasmine only).
     *
     * @param {Object} suite - Suite details.
     * @returns {Promise<void>}
     */
    afterSuite(suite) {
        multiremotebrowser.instances.forEach((instance: string) => {
            logInfo(multiremotebrowser.getInstance(instance),
                `---=== End ${suite.file.substring(suite.file.lastIndexOf('/') + 1)} ===---`);
        });
    },

    /**
     * Gets executed after all workers have shut down and the process is about to exit.
     * An error thrown in the `onComplete` hook will result in the test run failing.
     *
     * @returns {Promise<void>}
     */
    onComplete() {
        const reportError = new Error('Could not generate Allure report');
        const generation = allure([
            'generate', `${TEST_RESULTS_DIR}/allure-results`,
            '--clean', '--single-file',
            '--report-dir', `${TEST_RESULTS_DIR}/allure-report`
        ]);

        return new Promise<void>((resolve, reject) => {
            const generationTimeout = setTimeout(
                () => reject(reportError),
                5000);

            // @ts-ignore
            generation.on('exit', eCode => {
                clearTimeout(generationTimeout);

                if (eCode !== 0) {
                    return reject(reportError);
                }

                console.log('Allure report successfully generated');
                resolve();
            });
        });
    }
} as WebdriverIO.MultiremoteConfig;
