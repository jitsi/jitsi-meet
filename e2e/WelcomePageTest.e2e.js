import { v4 as uuidv4 } from 'uuid';

import { screen } from '../react/features/mobile/navigation/routes';

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

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('is welcome screen enabled', async () => {
        await expect(element(by.id('welcome-screen'))).toBeVisible();
    });

    it('did the display name update', async () => {
        const displayName = 'Benedetta';

        await element(by.id('toggle-drawer-button')).tap();
        await waitFor(element(by.id('drawer-navigator'))).toBeVisible();
        await element(by.text(screen.welcome.settings)).tap();
        await waitFor(element(by.id('display-name-input'))).toBeVisible();
        await element(by.id('display-name-input')).typeText(displayName);
        await element(by.id('header-back-nav-btn')).tap();
        await expect(element(by.id('welcome-screen'))).toBeVisible();
        await element(by.id('toggle-drawer-button')).tap();
        await expect(element(by.text(displayName))).toBeVisible();
    });

    it('Mute audio/video', async () => {
        const roomName = uuidv4();

        await expect(element(by.id('room-name-input'))).toBeVisible();
        // Helps the app to move forward with the test execution
        // when it navigates to the conference room
        await device.disableSynchronization();
        await element(by.id('room-name-input')).tap();
        await element(by.id('room-name-input')).typeText(roomName);
        await element(by.id('join-room-button')).tap();

        // Conference joined
        await sleep(1000);
        await expect(element(by.label('Mute / Unmute'))).toBeVisible();
        await expect(element(by.label('Start / Stop camera'))).toBeVisible();
        await element(by.label('Mute / Unmute')).tap();
        await element(by.label('Start / Stop camera')).tap();
    });
});
