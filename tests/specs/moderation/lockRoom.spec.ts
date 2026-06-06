import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant, ensureTwoParticipants, joinSecondParticipant } from '../../helpers/participants';
import type SecurityDialog from '../../pageobjects/SecurityDialog';

setTestProperties(__filename, {
    description: '1. Set a room password (assert the image changes to locked). \
         2. Join with a second participant. \
         3. Assert password is required (and padlock is locked). \
         4. Assert wrong password fails. \
         5. Unlock the room (assert the padlock is unlocked) \
         6. Assert room is unlocked and the padlock is unlocked.',
    usesBrowsers: [ 'p1', 'p2' ]
});


describe('Lock room', () => {
    let p1: Participant, p2: Participant;
    let roomKey: string;

    it('setup', async () => {
        if (!expectations.moderation.setPasswordAvailable) {
            ctx.skipSuiteTests = 'setPasswordAvailable is not expected to be available';

            return;
        }

        await ensureOneParticipant();
        p1 = ctx.p1;

        roomKey = `${Math.trunc(Math.random() * 1_000_000)}`;
        await setPassword(p1, roomKey);
    });
    it('enter participant in locked room', async () => {
        // first enter wrong pin then correct one
        await joinSecondParticipant({
            skipWaitToJoin: true
        });

        p2 = ctx.p2;

        const p2PasswordDialog = p2.getPasswordDialog();

        // Submit a wrong password
        await p2PasswordDialog.waitForDialog();
        await p2PasswordDialog.submitPassword(`${roomKey}1234`);

        // give some time to the password prompt to disappear and send the password
        // TODO: wait until the dialog is not displayed? Assert the room is not joined?
        await p2.driver.pause(500);

        // Submit the correct password
        await p2PasswordDialog.waitForDialog();
        await p2PasswordDialog.submitPassword(roomKey);

        await p2.waitToJoinMUC();

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        await waitForRoomLockState(p2SecurityDialog, true);
    });

    it('unlock room', async () => {
        await p2.hangup();

        await removePassword(p1);
    });

    it('join the unlocked room', async () => {
        // Just enter the room and check that is not locked.
        await ensureTwoParticipants();
        p2 = ctx.p2;

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        await waitForRoomLockState(p2SecurityDialog, false);
        await p2SecurityDialog.clickCloseButton();
    });

    it('set password while participants are in the room', async () => {
        // Both participants are in unlocked room, lock it and see whether the
        // change is reflected on the second participant icon.
        roomKey = `${Math.trunc(Math.random() * 1_000_000)}`;
        await setPassword(p1, roomKey);

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        await waitForRoomLockState(p2SecurityDialog, true);
        await removePassword(p1);
        await waitForRoomLockState(p2SecurityDialog, false);
    });
    it('unlock after participant enter wrong password', async () => {
        // P1 locks the room. Participant tries to enter using wrong password.
        // P1 unlocks the room and Participant submits the password prompt with no password entered and
        // should enter of unlocked room.
        await p2.hangup();
        roomKey = `${Math.trunc(Math.random() * 1_000_000)}`;
        await setPassword(p1, roomKey);
        await joinSecondParticipant({
            skipWaitToJoin: true
        });
        p2 = ctx.p2;

        // wait for password prompt
        const p2PasswordDialog = p2.getPasswordDialog();

        await p2PasswordDialog.waitForDialog();
        await p2PasswordDialog.submitPassword(`${roomKey}1234`);

        // give sometime to the password prompt to disappear and send the password
        await p2.driver.pause(500);

        // wait for password prompt
        await p2PasswordDialog.waitForDialog();

        await removePassword(p1);

        await p2PasswordDialog.clickOkButton();
        await p2.waitToJoinMUC();

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        await waitForRoomLockState(p2SecurityDialog, false);
    });
});

/**
 * Set a room password via the UI.
 */
async function setPassword(p: Participant, password: string) {
    const securityDialog = p.getSecurityDialog();

    await p.getToolbar().clickSecurityButton();
    await securityDialog.waitForDisplay();
    await waitForRoomLockState(securityDialog, false);
    await securityDialog.addPassword(password);
    await securityDialog.clickCloseButton();
    await p.getToolbar().clickSecurityButton();
    await securityDialog.waitForDisplay();
    await waitForRoomLockState(securityDialog, true);
    await securityDialog.clickCloseButton();
}

/**
 * Remove the room password via the UI.
 */
async function removePassword(p: Participant) {
    const securityDialog = p.getSecurityDialog();

    await p.getToolbar().clickSecurityButton();
    await securityDialog.waitForDisplay();
    await securityDialog.removePassword();
    await waitForRoomLockState(securityDialog, false);
    await securityDialog.clickCloseButton();
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
