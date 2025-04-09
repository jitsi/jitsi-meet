import { ensureOneParticipant, ensureTwoParticipants, joinSecondParticipant } from '../../helpers/participants';
import type SecurityDialog from '../../pageobjects/SecurityDialog';

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
        await p2PasswordDialog.submitPassword(`${ctx.data.roomKey}1234`);

        // give sometime to the password prompt to disappear and send the password
        await p2.driver.pause(500);

        // wait for password prompt
        await p2PasswordDialog.waitForDialog();
        await p2PasswordDialog.submitPassword(ctx.data.roomKey);

        await p2.waitToJoinMUC();

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        await waitForRoomLockState(p2SecurityDialog, true);
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

        await waitForRoomLockState(p2SecurityDialog, false);

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

        await waitForRoomLockState(p2SecurityDialog, true);

        await participant1UnlockRoom();

        await waitForRoomLockState(p2SecurityDialog, false);
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
        await p2PasswordDialog.submitPassword(`${ctx.data.roomKey}1234`);

        // give sometime to the password prompt to disappear and send the password
        await p2.driver.pause(500);

        // wait for password prompt
        await p2PasswordDialog.waitForDialog();

        await participant1UnlockRoom();

        await p2PasswordDialog.clickOkButton();
        await p2.waitToJoinMUC();

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        await waitForRoomLockState(p2SecurityDialog, false);
    });
});

/**
 * Participant1 locks the room.
 */
async function participant1LockRoom() {
    ctx.data.roomKey = `${Math.trunc(Math.random() * 1_000_000)}`;

    const { p1 } = ctx;
    const p1SecurityDialog = p1.getSecurityDialog();

    await p1.getToolbar().clickSecurityButton();
    await p1SecurityDialog.waitForDisplay();

    await waitForRoomLockState(p1SecurityDialog, false);

    await p1SecurityDialog.addPassword(ctx.data.roomKey);

    await p1SecurityDialog.clickCloseButton();

    await p1.getToolbar().clickSecurityButton();
    await p1SecurityDialog.waitForDisplay();

    await waitForRoomLockState(p1SecurityDialog, true);

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

    await waitForRoomLockState(p1SecurityDialog, false);

    await p1SecurityDialog.clickCloseButton();
}

/**
 * Waits for the room to be locked or unlocked.
 * @param securityDialog
 * @param locked
 */
function waitForRoomLockState(securityDialog: SecurityDialog, locked: boolean) {
    return securityDialog.participant.driver.waitUntil(
        async () => await securityDialog.isLocked() === locked,
        {
            timeout: 3_000, // 3 seconds
            timeoutMsg: `Timeout waiting for the room to unlock for ${securityDialog.participant.name}.`
        }
    );
}
