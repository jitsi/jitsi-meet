import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

describe('Settings Dialog', () => {
    it('joining the meeting', () => ensureOneParticipant());

    it('opens and closes the settings dialog', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().clickSettingsButton();

        const settings = p1.getSettingsDialog();
        await settings.waitForDisplay();

        await settings.submit();
    });

    it('navigates through tabs', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().clickSettingsButton();
        const settings = p1.getSettingsDialog();
        await settings.waitForDisplay();

        await settings.openProfileTab();
        await settings.openMoreTab();
        
        // Moderator tab might not be visible for all users depending on config, but p1 is usually moderator in ensureOneParticipant.
        await settings.openModeratorTab();

        await settings.openShortcutsTab();

        await settings.submit();
    });

    it('can set and get email in profile', async () => {
        const { p1 } = ctx;

        await p1.getToolbar().clickSettingsButton();
        const settings = p1.getSettingsDialog();
        await settings.waitForDisplay();

        const testEmail = 'test@example.com';
        await settings.setEmail(testEmail);
        
        // Ensure the email is actually set in the UI
        const retrievedEmail = await settings.getEmail();
        expect(retrievedEmail).toBe(testEmail);

        await settings.submit();
    });
});
