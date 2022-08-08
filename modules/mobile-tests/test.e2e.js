const assert = require('assert');
const wdio = require('webdriverio');

const options = {
    path: '/wd/hub',
    port: 4723,
    capabilities: {
        appActivity: '.MainActivity',
        appPackage: 'org.jitsi.meet',
        appiumVersion: '1.22.3',
        automationName: 'UiAutomator2',
        platformName: 'Android',
        platformVersion: '10.0',
        uid: '2ff2f58d'
    }
};

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Constructs a test session.
 *
 * @returns { Promise }
 */
async function main() {
    const client = wdio.remote(options);

    const field = await (await client).findElement('#search');

    await delay(5000);
    await client.setValue(field, 'testestest123');
    const value = await field.getText();

    assert.strictEqual(value, 'testestest123');

    await client.deleteSession();
}

main();
