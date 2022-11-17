const wdio = require('webdriverio');

const {
    IOS
} = require('../helpers/capabilities');
const { getSelector } = require('../helpers/getSelector');


const options = {
    path: '/wd/hub',
    port: 4723,
    capabilities: IOS
};

const delay = ms => new Promise(res => setTimeout(res, ms));

const enterRoomNameInput = {
    android: '//android.widget.EditText[contains(@resource-id, "room-name-input-id")]',
    ios: '//XCUIElementTypeTextField[@name="Enter room name"]'
};

const joinBtn = {
    android: '//android.view.ViewGroup[@content-desc="Tap to join"]',
    ios: '//XCUIElementTypeButton[@name="Tap to join"]'
};

const allowPermissionsBtn = {
    android: 'com.android.permissioncontroller:id/permission_allow_button',
    ios: '//XCUIElementTypeButton[@name="OK"]'
};

const closeScreenBtn = {
    android: '//android.view.ViewGroup[contains(@resource-id, "close-screen-btn-id")]',
    ios: '//XCUIElementTypeOther[@name="close-screen-btn-id"]'
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
    const allowPermissionBtn = (await client).$(allowPermissionBtnSelector);
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
