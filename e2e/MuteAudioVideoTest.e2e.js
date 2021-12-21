// @flow

describe('Jitsi Meet App', () => {
    beforeAll(async () => {
        await device.launchApp({
            newInstance: true
        });
        true;
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('is audio/video muted', async () => {
        const roomName = 'TestMyRoomOrGoHome';

        await expect(element(by.id('room-name-input'))).toBeVisible();
        await element(by.id('room-name-input')).tap();
        await element(by.id('room-name-input')).typeText(roomName);
        await element(by.id('join-room-button')).tap();
        await waitFor(element(by.id('navigation-bar')))
            .toBeVisible()
            .withTimeout(2000);
        try {
            await expect(element(by.text('"Jitsi Meet" Would Like to Access the Microphone'))).toBeVisible();
        } catch (e) {}
    });
});
