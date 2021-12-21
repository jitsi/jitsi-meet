// @flow

describe('Jitsi Meet App', () => {
    beforeAll(async () => {
        await device.launchApp();
        true;
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('is welcome page enabled', async () => {
        await expect(element(by.id('room-name-input'))).toBeVisible();
        await element(by.id('room-name-input')).tap();
    });
});
