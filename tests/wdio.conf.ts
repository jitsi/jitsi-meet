import AllureReporter from '@wdio/allure-reporter';
import { multiremotebrowser } from '@wdio/globals';
import { Buffer } from 'buffer';
import { glob } from 'glob';
import path from 'node:path';
import process from 'node:process';
import pretty from 'pretty';

import { getTestProperties, loadTestFiles } from './helpers/TestProperties';
import { config as testsConfig } from './helpers/TestsConfig';
import WebhookProxy from './helpers/WebhookProxy';
import { getLogs, initLogger, logInfo } from './helpers/browserLogger';
import { IContext } from './helpers/types';
import { generateRoomName } from './helpers/utils';

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

        if (testProperties.useWebhookProxy && !globalAny.ctx.webhooksProxy) {
            console.warn(`WebhookProxy is not available, skipping ${testName}`);
            globalAny.ctx.skipSuiteTests = 'WebhooksProxy is not required but not available';
        }
    },

    after() {
        const { ctx }: any = global;

        ctx?.webhooksProxy?.disconnect();
        keepAlive.forEach(clearInterval);
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
