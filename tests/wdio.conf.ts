import AllureReporter from '@wdio/allure-reporter';
import { multiremotebrowser } from '@wdio/globals';
import { Buffer } from 'buffer';
import minimatch from 'minimatch';
import path from 'node:path';
import process from 'node:process';
import pretty from 'pretty';

import WebhookProxy from './helpers/WebhookProxy';
import { getLogs, initLogger, logInfo } from './helpers/browserLogger';
import { IContext } from './helpers/types';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const allure = require('allure-commandline');

// This is deprecated without alternative (https://github.com/nodejs/node/issues/32483)
// we need it to be able to reuse jitsi-meet code in tests
require.extensions['.web.ts'] = require.extensions['.ts'];

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
    '--use-file-for-fake-audio-capture=tests/resources/fakeAudioStream.wav'
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

const TEST_RESULTS_DIR = 'test-results';

export const config: WebdriverIO.MultiremoteConfig = {

    runner: 'local',

    specs: [
        'specs/**'
    ],
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

    capabilities: {
        // participant1
        p1: {
            capabilities: {
                browserName: 'chrome',
                browserVersion: process.env.BROWSER_CHROME_BETA ? 'beta' : undefined,
                'goog:chromeOptions': {
                    args: chromeArgs,
                    prefs: chromePreferences
                }
            }
        },
        // participant2
        p2: {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: chromeArgs,
                    prefs: chromePreferences
                },
                'wdio:exclude': [
                    'specs/alone/**'
                ]
            }
        },
        // participant3
        p3: {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: chromeArgs,
                    prefs: chromePreferences
                },
                'wdio:exclude': [
                    'specs/alone/**',
                    'specs/2way/**'
                ]
            }
        },
        // participant4
        p4: {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: chromeArgs,
                    prefs: chromePreferences
                },
                'wdio:exclude': [
                    'specs/alone/**',
                    'specs/2way/**',
                    'specs/3way/**'
                ]
            }
        }
    },

    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'trace',
    logLevels: {
        webdriver: 'info'
    },

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
    async before(cid, _, specs) {
        if (specs.length !== 1) {
            console.warn('We expect to run a single suite, but got more than one');
        }

        const testName = path.basename(specs[0]).replace('.spec.ts', '');

        console.log(`Running test: ${testName} via worker: ${cid}`);

        const globalAny: any = global;

        globalAny.ctx = {
            data: {},
            times: {}
        } as IContext;
        globalAny.ctx.keepAlive = [];

        await Promise.all(multiremotebrowser.instances.map(async (instance: string) => {
            const bInstance = multiremotebrowser.getInstance(instance);

            // @ts-ignore
            initLogger(bInstance, `${instance}-${cid}-${testName}`, TEST_RESULTS_DIR);

            // setup keepalive
            globalAny.ctx.keepAlive.push(setInterval(async () => {
                await bInstance.execute(() => console.log(`${new Date().toISOString()} keep-alive`));
            }, 20_000));

            if (bInstance.isFirefox) {
                return;
            }

            const rpath = await bInstance.uploadFile('tests/resources/iframeAPITest.html');

            // @ts-ignore
            bInstance.iframePageBase = `file://${path.dirname(rpath)}`;
        }));

        globalAny.ctx.roomName = `jitsimeettorture-${crypto.randomUUID()}`;
        if (process.env.ROOM_NAME_SUFFIX) {
            globalAny.ctx.roomName += `_${process.env.ROOM_NAME_SUFFIX.trim()}`;
        }

        globalAny.ctx.jwtPrivateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
        globalAny.ctx.jwtKid = process.env.JWT_KID;
        globalAny.ctx.isJaasAvailable = () => globalAny.ctx.jwtKid?.startsWith('vpaas-magic-cookie-');
    },

    after() {
        const { ctx }: any = global;

        ctx?.webhooksProxy?.disconnect();
        ctx?.keepAlive?.forEach(clearInterval);
    },

    beforeSession(c, capabilities, specs, cid) {
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
        const { ctx }: any = global;

        // If we are running the iFrameApi tests, we need to mark it as such and if needed to create the proxy
        // and connect to it.
        if (path.basename(suite.file).startsWith('iFrameApi')) {
            ctx.iframeAPI = true;

            if (!ctx.webhooksProxy
                && process.env.WEBHOOKS_PROXY_URL && process.env.WEBHOOKS_PROXY_SHARED_SECRET) {
                ctx.webhooksProxy = new WebhookProxy(
                    `${process.env.WEBHOOKS_PROXY_URL}&room=${ctx.roomName}`,
                    process.env.WEBHOOKS_PROXY_SHARED_SECRET);
                ctx.webhooksProxy.connect();
            }
        }

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
        if (ctx.skipSuiteTests) {
            context.skip();

            return;
        }

        multiremotebrowser.instances.forEach((instance: string) => {
            logInfo(multiremotebrowser.getInstance(instance), `---=== Start test ${test.title} ===---`);
        });
    },

    /**
     * Gets executed before a worker process is spawned and can be used to initialize specific service
     * for that worker as well as modify runtime environments in an async fashion.
     */
    onWorkerStart(...args) {
        // We run a worker per suite, and replay on this logic here
        if (args[2].length > 1) {
            console.warn('Our worker is supposed to get a single suite, but got more than one');

            return;
        }

        // We skip the suite tests if the suite is marked as such, we used that from firefox overwrite
        // @ts-ignore
        if (config?.ffExcludes?.some(
                (e: string) => minimatch(args[2][0].replace('file://', ''), `${__dirname}/${e}`))) {
            args[2].pop();
        }
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

                AllureReporter.addAttachment(`console-logs-${instance}`, getLogs(bInstance) || '', 'text/plain');

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
