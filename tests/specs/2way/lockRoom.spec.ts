import { ensureOneParticipant, ensureTwoParticipants, joinSecondParticipant } from '../../helpers/participants';

/**
 * 1. Lock the room (make sure the image changes to locked)
 * 2. Join with a second browser/tab
 * 3. Make sure we are required to enter a password.
 * (Also make sure the padlock is locked)
 * 4. Enter wrong password, make sure we are not joined in the room
 * 5. Unlock the room (Make sure the padlock is unlocked)
 * 6. Join again and make sure we are not asked for a password and that
 * the padlock is unlocked.
 */
describe('Lock Room', () => {
    it('joining the meeting', () => ensureOneParticipant(ctx));

    it('locks the room', () => participant1LockRoom());

    it('enter participant in locked room', async () => {
        // first enter wrong pin then correct one
        await joinSecondParticipant(ctx, {
            skipWaitToJoin: true,
            skipInMeetingChecks: true
        });

        const { p2 } = ctx;

        // wait for password prompt
        const p2PasswordDialog = p2.getPasswordDialog();

        await p2PasswordDialog.waitForDialog();
        await p2PasswordDialog.submitPassword(`${ctx.roomKey}1234`);

        // wait for password prompt
        await p2PasswordDialog.waitForDialog();
        await p2PasswordDialog.submitPassword(ctx.roomKey);

        await p2.waitToJoinMUC();

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        expect(await p2SecurityDialog.isLocked()).toBe(true);
    });

    it('unlock room', async () => {
        // Unlock room. Check whether room is still locked. Click remove and check whether it is unlocked.
        await ctx.p2.hangup();

        await participant1UnlockRoom();
    });

    it('enter participant in unlocked room', async () => {
        // Just enter the room and check that is not locked.
        // if we fail to unlock the room this one will detect it
        // as participant will fail joining
        await ensureTwoParticipants(ctx);

        const { p2 } = ctx;
        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        expect(await p2SecurityDialog.isLocked()).toBe(false);

        await p2SecurityDialog.clickCloseButton();
    });

    it('update locked state while participants in room', async () => {
        // Both participants are in unlocked room, lock it and see whether the
        // change is reflected on the second participant icon.
        await participant1LockRoom();

        const { p2 } = ctx;
        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        expect(await p2SecurityDialog.isLocked()).toBe(true);

        await participant1UnlockRoom();

        expect(await p2SecurityDialog.isLocked()).toBe(false);
    });
    it('unlock after participant enter wrong password', async () => {
        // P1 locks the room. Participant tries to enter using wrong password.
        // P1 unlocks the room and Participant submits the password prompt with no password entered and
        // should enter of unlocked room.
        await ctx.p2.hangup();
        await participant1LockRoom();
        await joinSecondParticipant(ctx, {
            skipWaitToJoin: true,
            skipInMeetingChecks: true
        });

        const { p2 } = ctx;

        // wait for password prompt
        const p2PasswordDialog = p2.getPasswordDialog();

        await p2PasswordDialog.waitForDialog();
        await p2PasswordDialog.submitPassword(`${ctx.roomKey}1234`);

        // wait for password prompt
        await p2PasswordDialog.waitForDialog();

        await participant1UnlockRoom();

        await p2PasswordDialog.clickOkButton();
        await p2.waitToJoinMUC();

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        expect(await p2SecurityDialog.isLocked()).toBe(false);
    });
});

/**
 * Participant1 locks the room.
 */
async function participant1LockRoom() {
    ctx.roomKey = `${Math.trunc(Math.random() * 1_000_000)}`;

    const { p1 } = ctx;
    const p1SecurityDialog = p1.getSecurityDialog();

    await p1.getToolbar().clickSecurityButton();
    await p1SecurityDialog.waitForDisplay();

    expect(await p1SecurityDialog.isLocked()).toBe(false);

    await p1SecurityDialog.addPassword(ctx.roomKey);

    await p1SecurityDialog.clickCloseButton();

    await p1.getToolbar().clickSecurityButton();
    await p1SecurityDialog.waitForDisplay();

    expect(await p1SecurityDialog.isLocked()).toBe(true);

    await p1SecurityDialog.clickCloseButton();
}

/**
 * Participant1 unlocks the room.
 */
async function participant1UnlockRoom() {
    const { p1 } = ctx;
    const p1SecurityDialog = p1.getSecurityDialog();

    await p1.getToolbar().clickSecurityButton();
    await p1SecurityDialog.waitForDisplay();

    await p1SecurityDialog.removePassword();

    await p1.driver.waitUntil(
        async () => !await p1SecurityDialog.isLocked(),
        {
            timeout: 3_000, // 3 seconds
            timeoutMsg: `Timeout waiting for the room to unlock for ${p1.name}.`
        }
    );

    await p1SecurityDialog.clickCloseButton();
}
