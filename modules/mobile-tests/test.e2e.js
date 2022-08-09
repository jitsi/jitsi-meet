const assert = require('assert');
const wdio = require('webdriverio');

const options = {
    path: '/wd/hub',
    port: 4723,
    capabilities: [ {
        app: './ios/app',
        appiumVersion: '1.22.3',
        automationName: 'XCUITest',
        deviceName: 'iPhone 13 Pro Simulator',
        platformName: 'iOS',
        platformVersion: '15.5',
        udid: 'auto',
        uid: '80EE304B-5146-4130-B4DD-CBB4341B97BF'
    }, {
        appActivity: '.MainActivity',
        appPackage: 'org.jitsi.meet',
        appiumVersion: '1.22.3',
        automationName: 'UiAutomator2',
        platformName: 'Android',
        platformVersion: '10.0',
        uid: '2ff2f58d'
    } ]
};

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Constructs a test session.
 *
 * @returns { Promise }
 */
async function main() {
    const client = wdio.remote(options);

    const field = (await client).$('~Enter room name');

    await delay(5000);
    await field.setValue('testestest123');
    const value = await field.getText();

    assert.strictEqual(value, 'testestest123');
}

main();
