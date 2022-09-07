
const assert = require('assert');
const wdio = require('webdriverio');

const {
    iPhoneXs
} = require('../helpers/capabilities');
const { getSelector } = require('../helpers/getSelector');

const options = {
    path: '/wd/hub',
    port: 4723,
    capabilities: iPhoneXs
};

const delay = ms => new Promise(res => setTimeout(res, ms));
const androidInput = '//android.widget.EditText[@content-desc="Enter room name"]';
const iosInput = '//XCUIElementTypeTextField[@name="Enter room name"]';

/**
 * Constructs a test session.
 *
 * @returns { Promise }
 */
async function main() {
    const client = wdio.remote(options);
    const input = getSelector(androidInput, iosInput);

    const field = (await client).$(input);

    await delay(5000);
    await field.setValue('testestest123');
    const value = await field.getText();

    assert.strictEqual(value, 'testestest123');
}

main();
