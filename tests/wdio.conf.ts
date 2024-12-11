import AllureReporter from '@wdio/allure-reporter';
import { multiremotebrowser } from '@wdio/globals';
import { Buffer } from 'buffer';
import path from 'node:path';
import process from 'node:process';
import pretty from 'pretty';

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
    `--use-file-for-fake-audio-capture=${process.env.REMOTE_RESOURCE_PATH || 'tests/resources'}/fakeAudioStream.wav`
];

if (process.env.RESOLVER_RULES) {
    chromeArgs.push(`--host-resolver-rules=${process.env.RESOLVER_RULES}`);
}
if (process.env.ALLOW_INSECURE_CERTS === 'true') {
    chromeArgs.push('--ignore-certificate-errors');
}
if (process.env.HEADLESS === 'true') {
    chromeArgs.push('--headless');
    chromeArgs.push('--window-size=1280,720');
}
if (process.env.VIDEO_CAPTURE_FILE) {
    chromeArgs.push(`use-file-for-fake-video-capture=${process.env.VIDEO_CAPTURE_FILE}`);
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
    maxInstances: 1,

    baseUrl: process.env.BASE_URL || 'https://alpha.jitsi.net/torture/',
    tsConfigPath: './tsconfig.json',

    // Default timeout for all waitForXXX commands.
    waitforTimeout: 1000,

    // Default timeout in milliseconds for request
    // if browser driver or grid doesn't send response
    connectionRetryTimeout: 15_000,

    // Default request retries count
    connectionRetryCount: 3,

    framework: 'jasmine',

    jasmineOpts: {
        defaultTimeoutInterval: 60_000
    },

    capabilities: {
        participant1: {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    args: chromeArgs,
                    prefs: chromePreferences
                }
            }
        },
        participant2: {
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
        participant3: {
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
        participant4: {
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
     *
     * @returns {Promise<void>}
     */
    async before() {
        await Promise.all(multiremotebrowser.instances.map(async (instance: string) => {
            const bInstance = multiremotebrowser.getInstance(instance);

            initLogger(bInstance, instance, TEST_RESULTS_DIR);

            if (bInstance.isFirefox) {
                return;
            }

            // if (process.env.GRID_HOST_URL) {
            // TODO: make sure we use uploadFile only with chrome (it does not work with FF),
            // we need to test it with the grid and FF, does it work there
            const rpath = await bInstance.uploadFile('tests/resources/iframeAPITest.html');

            // @ts-ignore
            bInstance.iframePageBase = `file://${path.dirname(rpath)}`;
        }));

        const globalAny: any = global;

        globalAny.context = {} as IContext;

        globalAny.context.jwtPrivateKeyPath = process.env.JWT_PRIVATE_KEY_PATH;
        globalAny.context.jwtKid = process.env.JWT_KID;
    },

    after() {
        if (context.webhooksProxy) {
            context.webhooksProxy.disconnect();
        }
    },

    /**
     * Gets executed before the suite starts (in Mocha/Jasmine only).
     *
     * @param {Object} suite - Suite details.
     * @returns {Promise<void>}
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
     * @returns {Promise<void>}
     */
    beforeTest(test) {
        multiremotebrowser.instances.forEach((instance: string) => {
            logInfo(multiremotebrowser.getInstance(instance), `---=== Start test ${test.fullName} ===---`);
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
            logInfo(multiremotebrowser.getInstance(instance), `---=== End test ${test.fullName} ===---`));

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


                AllureReporter.addAttachment(`console-logs-${instance}`, getLogs(bInstance) || '', 'text/plain');

                allProcessing.push(bInstance.getPageSource().then(source => {
                    AllureReporter.addAttachment(`html-source-${instance}`, pretty(source), 'text/plain');
                }));
            });

            await Promise.all(allProcessing);
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
