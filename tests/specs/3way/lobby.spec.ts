import { P1, P3, Participant } from '../../helpers/Participant';
import {
    ensureOneParticipant,
    ensureThreeParticipants,
    ensureTwoParticipants,
    hangupAllParticipants
} from '../../helpers/participants';
import type { IJoinOptions } from '../../helpers/types';
import type PreMeetingScreen from '../../pageobjects/PreMeetingScreen';

describe('Lobby', () => {
    it('joining the meeting', async () => {
        await ensureOneParticipant(ctx);

        if (!await ctx.p1.execute(() => APP.conference._room.isLobbySupported())) {
            ctx.skipSuiteTests = true;
        }
    });

    it('enable', async () => {
        await ensureTwoParticipants(ctx);

        await enableLobby();
    });

    it('entering in lobby and approve', async () => {
        const { p1, p2 } = ctx;

        await enterLobby(p1, true);

        const { p3 } = ctx;

        await p1.getNotifications().allowLobbyParticipant();

        const notificationText = await p2.getNotifications().getLobbyParticipantAccessGranted();

        expect(notificationText.includes(P1)).toBe(true);
        expect(notificationText.includes(P3)).toBe(true);

        await p2.getNotifications().closeLobbyParticipantAccessGranted();

        // ensure 3 participants in the call will check for the third one that muc is joined, ice connected,
        // media is being receiving and there are two remote streams
        await p3.waitToJoinMUC();
        await p3.waitForIceConnected();
        await p3.waitForSendReceiveData();
        await p3.waitForRemoteStreams(2);

        // now check third one display name in the room, is the one set in the prejoin screen
        const name = await p1.getFilmstrip().getRemoteDisplayName(await p3.getEndpointId());

        expect(name).toBe(P3);

        await p3.hangup();
    });

    it('entering in lobby and deny', async () => {
        const { p1, p2 } = ctx;

        // the first time tests is executed we need to enter display name,
        // for next execution that will be locally stored
        await enterLobby(p1, false);

        // moderator rejects access
        await p1.getNotifications().rejectLobbyParticipant();

        // deny notification on 2nd participant
        const notificationText = await p2.getNotifications().getLobbyParticipantAccessDenied();

        expect(notificationText.includes(P1)).toBe(true);
        expect(notificationText.includes(P3)).toBe(true);

        await p2.getNotifications().closeLobbyParticipantAccessDenied();

        const { p3 } = ctx;

        // check the denied one is out of lobby, sees the notification about it
        await p3.getNotifications().waitForLobbyAccessDeniedNotification();

        expect(await p3.getLobbyScreen().isLobbyRoomJoined()).toBe(false);

        await p3.hangup();
    });


    it('approve from participants pane', async () => {
        const { p1 } = ctx;

        const knockingParticipant = await enterLobby(p1, false);

        // moderator allows access
        const p1ParticipantsPane = p1.getParticipantsPane();

        await p1ParticipantsPane.open();
        await p1ParticipantsPane.admitLobbyParticipant(knockingParticipant);
        await p1ParticipantsPane.close();

        const { p3 } = ctx;

        // ensure 3 participants in the call will check for the third one that muc is joined, ice connected,
        // media is being receiving and there are two remote streams
        await p3.waitToJoinMUC();
        await p3.waitForIceConnected();
        await p3.waitForSendReceiveData();
        await p3.waitForRemoteStreams(2);

        // now check third one display name in the room, is the one set in the prejoin screen
        // now check third one display name in the room, is the one set in the prejoin screen
        const name = await p1.getFilmstrip().getRemoteDisplayName(await p3.getEndpointId());

        expect(name).toBe(P3);

        await p3.hangup();
    });

    it('reject from participants pane', async () => {
        const { p1 } = ctx;

        const knockingParticipant = await enterLobby(p1, false);

        // moderator rejects access
        const p1ParticipantsPane = p1.getParticipantsPane();

        await p1ParticipantsPane.open();
        await p1ParticipantsPane.rejectLobbyParticipant(knockingParticipant);
        await p1ParticipantsPane.close();

        const { p3 } = ctx;

        // check the denied one is out of lobby, sees the notification about it
        // The third participant should see a warning that his access to the room was denied
        await p3.getNotifications().waitForLobbyAccessDeniedNotification();

        // check Lobby room not left
        expect(await p3.getLobbyScreen().isLobbyRoomJoined()).toBe(false);

        await p3.hangup();
    });

    it('lobby user leave', async () => {
        const { p1 } = ctx;

        await enterLobby(p1, false);

        await ctx.p3.hangup();

        // check that moderator (participant 1) no longer sees notification about participant in lobby
        await p1.getNotifications().waitForHideOfKnockingParticipants();
    });

    it('conference ended in lobby', async () => {
        const { p1, p2 } = ctx;

        await enterLobby(p1, false);

        await p1.hangup();
        await p2.hangup();

        const { p3 } = ctx;

        await p3.driver.$('.dialog.leaveReason').isExisting();

        await p3.driver.waitUntil(
            async () => !await p3.getLobbyScreen().isLobbyRoomJoined(),
            {
                timeout: 2000,
                timeoutMsg: 'p2 did not leave lobby'
            }
        );

        await p3.hangup();
    });

    it('disable while participant in lobby', async () => {
        await ensureTwoParticipants(ctx);

        const { p1 } = ctx;

        await enableLobby();
        await enterLobby(p1);

        const p1SecurityDialog = p1.getSecurityDialog();

        await p1.getToolbar().clickSecurityButton();
        await p1SecurityDialog.waitForDisplay();

        await p1SecurityDialog.toggleLobby();
        await p1SecurityDialog.waitForLobbyEnabled(true);

        const { p3 } = ctx;

        await p3.waitToJoinMUC();

        expect(await p3.getLobbyScreen().isLobbyRoomJoined()).toBe(false);
    });

    it('change of moderators in lobby', async () => {
        // no moderator switching if jaas is available
        if (ctx.isJaasAvailable()) {
            return;
        }
        await hangupAllParticipants();

        await ensureTwoParticipants(ctx);

        const { p1, p2 } = ctx;

        // hanging up the first one, which is moderator and second one should be
        await p1.hangup();

        await p2.driver.waitUntil(
            () => p2.isModerator(),
            {
                timeout: 3000,
                timeoutMsg: 'p2 is not moderator after p1 leaves'
            }
        );

        const p2SecurityDialog = p2.getSecurityDialog();

        await p2.getToolbar().clickSecurityButton();
        await p2SecurityDialog.waitForDisplay();

        await p2SecurityDialog.toggleLobby();
        await p2SecurityDialog.waitForLobbyEnabled();

        // here the important check is whether the moderator sees the knocking participant
        await enterLobby(p2, false);
    });

    it('shared password', async () => {
        await hangupAllParticipants();

        await ensureTwoParticipants(ctx);

        const { p1 } = ctx;

        await enableLobby();

        const p1SecurityDialog = p1.getSecurityDialog();

        await p1.getToolbar().clickSecurityButton();
        await p1SecurityDialog.waitForDisplay();

        expect(await p1SecurityDialog.isLocked()).toBe(false);

        const roomPasscode = String(Math.trunc(Math.random() * 1_000_000));

        await p1SecurityDialog.addPassword(roomPasscode);

        await p1.driver.waitUntil(
            () => p1SecurityDialog.isLocked(),
            {
                timeout: 2000,
                timeoutMsg: 'room did not lock for p1'
            }
        );

        await enterLobby(p1, false);

        const { p3 } = ctx;

        // now fill in password
        const lobbyScreen = p3.getLobbyScreen();

        await lobbyScreen.enterPassword(roomPasscode);

        await p3.waitToJoinMUC();
        await p3.waitForIceConnected();
        await p3.waitForSendReceiveData();
    });

    it('enable with more than two participants', async () => {
        await hangupAllParticipants();

        await ensureThreeParticipants(ctx);

        await enableLobby();

        // we need to check remote participants as isInMuc has not changed its value as
        // the bug is triggered by presence with status 322 which is not handled correctly
        const { p1, p2, p3 } = ctx;

        await p1.waitForRemoteStreams(2);
        await p2.waitForRemoteStreams(2);
        await p3.waitForRemoteStreams(2);
    });

    it('moderator leaves while lobby enabled', async () => {
        // no moderator switching if jaas is available
        if (ctx.isJaasAvailable()) {
            return;
        }
        const { p1, p2, p3 } = ctx;

        await p3.hangup();
        await p1.hangup();

        await p2.driver.waitUntil(
            () => p2.isModerator(),
            {
                timeout: 3000,
                timeoutMsg: 'p2 is not moderator after p1 leaves'
            }
        );

        const lobbyScreen = p2.getLobbyScreen();

        expect(await lobbyScreen.isLobbyRoomJoined()).toBe(true);
    });

    it('reject and approve in pre-join', async () => {
        await hangupAllParticipants();

        await ensureTwoParticipants(ctx);
        await enableLobby();

        const { p1 } = ctx;

        const knockingParticipant = await enterLobby(p1, true, true);

        // moderator rejects access
        const p1ParticipantsPane = p1.getParticipantsPane();

        await p1ParticipantsPane.open();
        await p1ParticipantsPane.rejectLobbyParticipant(knockingParticipant);
        await p1ParticipantsPane.close();

        const { p3 } = ctx;

        // check the denied one is out of lobby, sees the notification about it
        // The third participant should see a warning that his access to the room was denied
        await p3.getNotifications().waitForLobbyAccessDeniedNotification();

        // check Lobby room left
        expect(await p3.getLobbyScreen().isLobbyRoomJoined()).toBe(false);

        // try again entering the lobby with the third one and approve it
        // check that everything is fine in the meeting
        await p3.getNotifications().closeLocalLobbyAccessDenied();

        // let's retry to enter the lobby and approve this time
        const lobbyScreen = p3.getPreJoinScreen();

        // click join button
        await lobbyScreen.getJoinButton().click();
        await lobbyScreen.waitToJoinLobby();

        // check that moderator (participant 1) sees notification about participant in lobby
        const name = await p1.getNotifications().getKnockingParticipantName();

        expect(name).toBe(P3);
        expect(await lobbyScreen.isLobbyRoomJoined()).toBe(true);

        await p1ParticipantsPane.open();
        await p1ParticipantsPane.admitLobbyParticipant(knockingParticipant);
        await p1ParticipantsPane.close();

        await p3.waitForParticipants(2);
        await p3.waitForRemoteStreams(2);

        expect(await p3.getFilmstrip().countVisibleThumbnails()).toBe(3);
    });
});

/**
 * Enable lobby and check that it is enabled.
 */
async function enableLobby() {
    const { p1, p2 } = ctx;

    const p1SecurityDialog = p1.getSecurityDialog();

    await p1.getToolbar().clickSecurityButton();
    await p1SecurityDialog.waitForDisplay();

    expect(await p1SecurityDialog.isLobbyEnabled()).toBe(false);

    await p1SecurityDialog.toggleLobby();
    await p1SecurityDialog.waitForLobbyEnabled();

    expect((await p2.getNotifications().getLobbyEnabledText()).includes(p1.name)).toBe(true);

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

    // participant 3 should be now on pre-join screen
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
        await screen.enterDisplayName(P3);

        // check join button is enabled
        classes = await joinButton.getAttribute('class');
        expect(classes.includes('disabled')).toBe(false);
    }

    // click join button
    await screen.getJoinButton().click();
    await screen.waitToJoinLobby();

    // check no join button
    await p3.driver.waitUntil(
        async () => !await joinButton.isExisting() || !await joinButton.isDisplayed() || !await joinButton.isEnabled(),
        {
            timeout: 2_000,
            timeoutMsg: 'Join button is still available for p3'
        });

    // new screen, is password button shown
    const passwordButton = screen.getPasswordButton();

    expect(await passwordButton.isExisting()).toBe(true);
    expect(await passwordButton.isEnabled()).toBe(true);

    // check that moderator (participant 1) sees notification about participant in lobby
    const name = await participant.getNotifications().getKnockingParticipantName();

    expect(name).toBe(P3);
    expect(await screen.isLobbyRoomJoined()).toBe(true);

    return name;
}
