import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { expectations } from '../../helpers/expectations';
import { joinMuc } from '../../helpers/joinMuc';

setTestProperties(__filename, {
    description: ' Tests that the digits only password feature works. When the roomPasswordNumberOfDigits config \
    option is set, the UI should only allow setting the password to a string of digits (with the given length).'
});
describe('Lock room with digits only', () => {
    let p: Participant;

    it('setup', async () => {
        if (!expectations.moderation.setPasswordAvailable) {
            ctx.skipSuiteTests = 'setPasswordAvailable is not expected to be available';

            return;
        }

        p = await joinMuc({
            name: 'p1',
            token: testsConfig.jwt.preconfiguredToken
        }, {
            configOverwrite: {
                roomPasswordNumberOfDigits: 5
            }
        });
    });

    it('config value', async () => {
        expect(await p.execute(
            () => APP.store.getState()['features/base/config'].roomPasswordNumberOfDigits)).toBe(5);
    });
    it('set an invalid password', async () => {
        const securityDialog = p.getSecurityDialog();

        await p.getToolbar().clickSecurityButton();
        await securityDialog.waitForDisplay();

        expect(await securityDialog.isLocked()).toBe(false);

        // Set a non-numeric password.
        await securityDialog.addPassword('AAAAA');

        expect(await securityDialog.isLocked()).toBe(false);
        await securityDialog.clickCloseButton();
    });
    it('set a valid password', async () => {
        const securityDialog = p.getSecurityDialog();

        await p.getToolbar().clickSecurityButton();
        await securityDialog.waitForDisplay();

        await securityDialog.addPassword('12345');
        await securityDialog.clickCloseButton();

        await p.getToolbar().clickSecurityButton();
        await securityDialog.waitForDisplay();

        expect(await securityDialog.isLocked()).toBe(true);
    });
});
