
// const assert = require('assert');
const wdio = require('webdriverio');

const {
    ONEPLUSA5000
} = require('../helpers/capabilities');
const { getSelector } = require('../helpers/getSelector');


const options = {
    path: '/wd/hub',
    port: 4723,
    capabilities: ONEPLUSA5000
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const enterRoomNameInput = {
    android: '//android.widget.EditText[contains(@resource-id, "room-name-input-id")]',
    ios: '//XCUIElementTypeTextField[@name="room-name-input-id"]'
};

const joinBtn = {
    android: '//android.view.ViewGroup[@content-desc="Tap to join"]',
    ios: undefined
};

const allowPermissionsBtn = {
    android: 'com.android.permissioncontroller:id/permission_allow_button',
    ios: undefined
};

const closeScreenBtn = {
    android: '//android.view.ViewGroup[contains(@resource-id, "close-screen-btn-id")]',
    ios: undefined
};

/**
 * Constructs a test session.
 *
 * @returns { Promise }
 */
async function main() {
    const client = wdio.remote(options);
    const driver = await client;

    const inputSelector = getSelector(driver, enterRoomNameInput);
    const joinRoomBtnSelector = getSelector(driver, joinBtn);
    const allowPermissionBtnSelector = getSelector(driver, allowPermissionsBtn);
    const screenCloseBtnSelector = getSelector(driver, closeScreenBtn);


    const field = (await client).$(inputSelector);
    const joinRoomBtn = (await client).$(joinRoomBtnSelector);
    const allowPermissionBtn = (await client).$(`id:${allowPermissionBtnSelector}`);
    const screenCloseBtn = (await client).$(screenCloseBtnSelector);

    await delay(5000);
    await field.setValue('FlatMissilesSliceSecondly');
    await field.click();
    await joinRoomBtn.click();
    await allowPermissionBtn.click();
    await allowPermissionBtn.click();
    await screenCloseBtn.click();
}

main();
