import { ensureOneParticipant } from '../../helpers/participants';

/**
 * Tests that the digits only password feature works.
 *
 * 1. Lock the room with a string (shouldn't work)
 * 2. Lock the room with a valid numeric password (should work)
 */
describe('Lock Room with Digits only', () => {
    it('join participant', () => ensureOneParticipant(ctx, {
        configOverwrite: {
            roomPasswordNumberOfDigits: 5
        }
    }));

    it('lock room with digits only', async () => {
        const { p1 } = ctx;

        expect(await p1.execute(
            () => APP.store.getState()['features/base/config'].roomPasswordNumberOfDigits === 5)).toBe(true);

        const p1SecurityDialog = p1.getSecurityDialog();

        await p1.getToolbar().clickSecurityButton();
        await p1SecurityDialog.waitForDisplay();

        expect(await p1SecurityDialog.isLocked()).toBe(false);

        // Set a non-numeric password.
        await p1SecurityDialog.addPassword('AAAAA');

        expect(await p1SecurityDialog.isLocked()).toBe(false);
        await p1SecurityDialog.clickCloseButton();

        await p1.getToolbar().clickSecurityButton();
        await p1SecurityDialog.waitForDisplay();

        await p1SecurityDialog.addPassword('12345');
        await p1SecurityDialog.clickCloseButton();

        await p1.getToolbar().clickSecurityButton();
        await p1SecurityDialog.waitForDisplay();

        expect(await p1SecurityDialog.isLocked()).toBe(true);
    });
});
