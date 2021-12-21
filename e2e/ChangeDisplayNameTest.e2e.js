// @flow

import { screen } from '../react/features/conference/components/native/routes';

describe('Jitsi Meet App', () => {
    beforeAll(async () => {
        await device.launchApp();
        true;
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('did the display name change', async () => {
        const displayName = 'Benedetta';

        await element(by.id('toggle-drawer-button')).tap();
        await waitFor(element(by.id('drawer-navigator'))).toBeVisible();
        await element(by.label(screen.welcome.settings)).tap();
        await waitFor(element(by.id('display-name-input'))).toBeVisible();
        await element(by.id('display-name-input')).typeText(displayName);
        await element(by.id('header-back-nav-btn')).tap();
        await expect(element(by.id('welcome-page'))).toBeVisible();
        await element(by.id('toggle-drawer-button')).tap();
        await expect(element(by.text(displayName))).toBeVisible();
    });
});
