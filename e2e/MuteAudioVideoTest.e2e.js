// @flow

describe('Jitsi Meet App', () => {
    beforeAll(async () => {
        await device.launchApp({
            newInstance: true,
            permissions: {
                camera: 'YES',
                microphone: 'YES'
            }
        });

        await device.setURLBlacklist([
            '.*meet\.jit\.si.*',
            '.*api2\.amplitude\.com.*'
        ]);

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
        await expect(element(by.id('audio-mute-button'))).toBeVisible();
        await element(by.id('audio-mute-button')).tap();
    });
});
