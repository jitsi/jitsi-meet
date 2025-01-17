import type { Participant } from '../../helpers/Participant';
import { ensureOneParticipant, ensureThreeParticipants, ensureTwoParticipants } from '../../helpers/participants';
import type { IJoinOptions } from '../../helpers/types';
import type PreMeetingScreen from '../../pageobjects/PreMeetingScreen';

describe('Lobby', () => {
    it('joining the meeting', async () => {
        await ensureOneParticipant(ctx);

        if (!await ctx.p1.driver.execute(() => APP.conference._room.isLobbySupported())) {
            ctx.skipSuiteTests = true;
        }
    });

    it('enable', async () => {
        await ensureTwoParticipants(ctx);

        await enableLobby();
    });

    it('entering in lobby and approve', async () => {
        const { p1 } = ctx;

        await enterLobby(p1, true);
    });

    it('entering in lobby and deny', async () => {
        //
    });


    it('approve from participants pane', async () => {
        //
    });

    it('reject from participants pane', async () => {
        //
    });

    it('lobby user leave', async () => {
        //
    });

    it('conference ended in lobby', async () => {
        //
    });

    it('disable while participant in lobby', async () => {
        //
    });

    it('change of moderators in lobby', async () => {
        //
    });

    it('shared password', async () => {
        //
    });

    it('enable with more than two participants', async () => {
        //
    });

    it('moderator leaves while lobby enabled', async () => {
        //
    });

    it('reject and approve in pre-join', async () => {
        //
    });
});

/**
 * Enable lobby and check that it is enabled.
 */
async function enableLobby() {
    const { p1, p2 } = ctx;

    // TODO? remove
    // we set the name so we can check it on the notifications
    //     participant1.setDisplayName(participant1.getName());

    const p1SecurityDialog = p1.getSecurityDialog();

    await p1.getToolbar().clickSecurityButton();
    await p1SecurityDialog.waitForDisplay();

    expect(await p1SecurityDialog.isLobbyEnabled()).toBe(false);

    await p1SecurityDialog.toggleLobby();
    await p1SecurityDialog.waitForLobbyEnabled();

    expect((await p2.getNotifications().getLobbyEnabledText()).includes(p1.displayName)).toBe(true);

    await p2.getNotifications().closeLobbyEnabled();

    const p2SecurityDialog = p2.getSecurityDialog();

    await p2.getToolbar().clickSecurityButton();
    await p2SecurityDialog.waitForDisplay();

    // lobby is visible to moderators only, this depends on whether deployment is all moderators or not
    if (await p2.isModerator()) {
        await p2SecurityDialog.waitForLobbyEnabled();
    } else {
        expect(await p2SecurityDialog.isLobbySectionPresent()).toBe(false);
    }

    // let's close the security dialog, or we will not be able to click
    // on popups for allow/deny participants
    await p1SecurityDialog.clickCloseButton();
    await p2SecurityDialog.clickCloseButton();
}

/**
 * Expects that lobby is enabled for the room we will try to join.
 * Lobby UI is shown, enter display name and join.
 * Checks Lobby UI and also that when joining the moderator sees corresponding notifications.
 *
 * @param participant The participant that is moderator in the meeting.
 * @param enterDisplayName whether to enter display name. We need to enter display name only the first time when
 * a participant sees the lobby screen, next time visiting the page display name will be pre-filled
 * from local storage.
 * @param usePreJoin
 * @return the participant name knocking.
 */
async function enterLobby(participant: Participant, enterDisplayName = false, usePreJoin = false) {
    const options: IJoinOptions = {};

    if (usePreJoin) {
        options.configOverwrite = {
            prejoinConfig: {
                enabled: true
            }
        };
    }

    await ensureThreeParticipants(ctx, {
        ...options,
        skipDisplayName: true,
        skipWaitToJoin: true,
        skipInMeetingChecks: true
    });

    const { p3 } = ctx;
    let screen: PreMeetingScreen;

    // WebParticipant participant3 = getParticipant3();
    // ParentPreMeetingScreen lobbyScreen;
    if (usePreJoin) {
        screen = p3.getPreJoinScreen();
    } else {
        screen = p3.getLobbyScreen();
    }

    // // participant 3 should be now on pre-join screen
    await screen.waitForLoading();

    const displayNameInput = screen.getDisplayNameInput();

    // check display name is visible
    expect(await displayNameInput.isExisting()).toBe(true);
    expect(await displayNameInput.isDisplayed()).toBe(true);

    const joinButton = screen.getJoinButton();

    expect(await joinButton.isExisting()).toBe(true);

    if (enterDisplayName) {
        let classes = await joinButton.getAttribute('class');

        if (!usePreJoin) {
            // check join button is disabled
            expect(classes.includes('disabled')).toBe(true);
        }

        // TODO check that password is hidden as the room does not have password
        // this check needs to be added once the functionality exists

        // enter display name
        await screen.enterDisplayName(p3.name);

        // check join button is enabled
        classes = await joinButton.getAttribute('class');
        expect(classes.includes('disabled')).toBe(false);
    }

    // click join button
    await screen.getJoinButton().click();
    await screen.waitToJoinLobby();

    // check no join button
    expect(!await joinButton.isExisting() || !await joinButton.isDisplayed() || !await joinButton.isEnabled())
        .toBe(true);

    // new screen, is password button shown
    const passwordButton = screen.getPasswordButton();

    expect(await passwordButton.isExisting()).toBe(true);
    expect(await passwordButton.isEnabled()).toBe(true);

    // check that moderator (participant 1) sees notification about participant in lobby
    const name = await participant.getNotifications().getKnockingParticipantName();

    expect(name).toBe(p3.name);
    expect(await screen.isLobbyRoomJoined()).toBe(true);

    return name;
}
