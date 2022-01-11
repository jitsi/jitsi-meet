// @flow

import { v4 as uuidv4 } from 'uuid';

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

describe('Jitsi Meet App', () => {
    beforeAll(async () => {
        await device.launchApp({
            newInstance: true,
            permissions: {
                camera: 'YES',
                microphone: 'YES'
            }
        });

        // await device.setURLBlacklist([
        //     '.*meet\.jit\.si.*',
        //     '.*api2\.amplitude\.com.*'
        // ]);
        await device.disableSynchronization();

        true;
    });

    beforeEach(async () => {
        // await device.reloadReactNative();
    });

    it('is audio/video muted', async () => {
        const roomName = uuidv4();

        await sleep(4000);

        await expect(element(by.id('room-name-input'))).toBeVisible();
        await element(by.id('room-name-input')).tap();
        await element(by.id('room-name-input')).typeText(roomName);
        await element(by.id('join-room-button')).tap();

        await sleep(4000);

        await expect(element(by.id('audio-mute-button'))).toBeVisible();
        await element(by.id('audio-mute-button')).tap();
    });
});
