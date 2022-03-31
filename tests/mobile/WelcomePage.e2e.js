/* global by, device, element, waitFor */

const { screen } = require('../../react/features/mobile/navigation/routes');

const {
    CAMERA_BUTTON_ID,
    DISPLAY_NAME,
    DISPLAY_NAME_INPUT_ID,
    DRAWER_MENU_BUTTON_ID,
    DRAWER_NAVIGATOR_ID,
    HEADER_BACK_NAV_BUTTON_ID,
    JOIN_ROOM_BUTTON_ID,
    MICROPHONE_BUTTON_ID,
    RANDOM_ROOM_NAME,
    ROOM_NAME_INPUT_ID,
    WELCOME_PAGE_ID
} = require('./constants');


const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('Jitsi Meet App', () => {
    beforeAll(async () => {
        await device.launchApp({
            newInstance: true,
            permissions: {
                camera: 'YES',
                microphone: 'YES'
            }
        });

        true;
    });

    it('is welcome screen enabled', async () => {
        await expect(element(by.id(WELCOME_PAGE_ID))).toBeVisible();
    });

    it('did the display name update', async () => {
        await waitFor(element(by.id(DRAWER_MENU_BUTTON_ID))).toBeVisible();
        await element(by.id(DRAWER_MENU_BUTTON_ID)).tap();
        await waitFor(element(by.id(DRAWER_NAVIGATOR_ID))).toBeVisible();
        await element(by.text(screen.welcome.settings)).tap();
        await waitFor(element(by.id(DISPLAY_NAME_INPUT_ID))).toBeVisible();
        await element(by.id(DISPLAY_NAME_INPUT_ID)).typeText(DISPLAY_NAME);
        await element(by.id(HEADER_BACK_NAV_BUTTON_ID)).tap();
        await expect(element(by.id(WELCOME_PAGE_ID))).toBeVisible();
        await element(by.id(DRAWER_MENU_BUTTON_ID)).tap();
        await expect(element(by.text(DISPLAY_NAME))).toBeVisible();
    });

    it('Mute audio/video', async () => {
        await expect(element(by.id(ROOM_NAME_INPUT_ID))).toBeVisible();

        // Helps the app to move forward with the test execution
        // when it navigates to the conference room
        await device.disableSynchronization();
        await element(by.id(ROOM_NAME_INPUT_ID)).tap();
        await element(by.id(ROOM_NAME_INPUT_ID)).typeText(RANDOM_ROOM_NAME);
        await element(by.id(JOIN_ROOM_BUTTON_ID)).tap();

        // Conference joined
        await sleep(2000);
        await expect(element(by.id(MICROPHONE_BUTTON_ID))).toBeVisible();
        await expect(element(by.id(CAMERA_BUTTON_ID))).toBeVisible();
        await element(by.id(MICROPHONE_BUTTON_ID)).tap();
        await element(by.id(CAMERA_BUTTON_ID)).tap();
    });
});
