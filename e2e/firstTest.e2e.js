describe('Example', () => {
    beforeAll(async () => {
        await device.launchApp();
        newInstance: true;
    });

    beforeEach(async () => {
        await device.reloadReactNative();
    });

    it('should have welcome screen', async () => {
        await expect(element(by.id('welcome-screen'))).toBeVisible();
    });
});
