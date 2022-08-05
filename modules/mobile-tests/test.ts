const assert = require('assert');
const wdio = require('webdriverio');

const AndroidOnePlusA5000 = {
    path: '/wd/hub',
    port: 4723,
    capabilities: {
        platformName: 'Android',
        automationName: 'UiAutomator2',
        uid: '2ff2f58d',
        appPackage: 'org.jitsi.meet',
        appActivity: '.MainActivity'
    }
};

const client = wdio.remote(AndroidOnePlusA5000);

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Constructs a test session.
 *
 * @returns { Promise }
 */
async function main() {
    // eslint-disable-next-line no-undef

    const field = await client.$$('#search');

    await delay(5000);
    await client.setValue(field, 'testestest123');
    const value = await field.getText();

    assert.strictEqual(value, 'testestest123');

    await client.deleteSession();
}

main();
