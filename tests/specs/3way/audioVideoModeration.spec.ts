import { Participant } from '../../helpers/Participant';
import {
    ensureOneParticipant,
    ensureThreeParticipants, ensureTwoParticipants,
    hangupAllParticipants,
    unmuteAudioAndCheck,
    unmuteVideoAndCheck
} from '../../helpers/participants';

describe('AVModeration', () => {

    it('check for moderators', async () => {
        // if all 3 participants are moderators, skip this test
        await ensureThreeParticipants(ctx);

        const { p1, p2, p3 } = ctx;

        if (!await p1.isModerator()
            || (await p1.isModerator() && await p2.isModerator() && await p3.isModerator())) {
            ctx.skipSuiteTests = true;
        }
    });

    it('check audio enable/disable', async () => {
        const { p1, p3 } = ctx;
        const p1ParticipantsPane = p1.getParticipantsPane();

        await p1ParticipantsPane.clickContextMenuButton();
        await p1ParticipantsPane.getAVModerationMenu().clickStartAudioModeration();

        await p1ParticipantsPane.close();

        // Here we want to try unmuting and check that we are still muted.
        await tryToAudioUnmuteAndCheck(p3, p1);

        await p1ParticipantsPane.clickContextMenuButton();
        await p1ParticipantsPane.getAVModerationMenu().clickStopAudioModeration();

        await p1ParticipantsPane.close();

        await unmuteAudioAndCheck(p3, p1);
    });

    it('check video enable/disable', async () => {
        const { p1, p3 } = ctx;
        const p1ParticipantsPane = p1.getParticipantsPane();

        await p1ParticipantsPane.clickContextMenuButton();
        await p1ParticipantsPane.getAVModerationMenu().clickStartVideoModeration();

        await p1ParticipantsPane.close();

        // Here we want to try unmuting and check that we are still muted.
        await tryToVideoUnmuteAndCheck(p3, p1);

        await p1ParticipantsPane.clickContextMenuButton();
        await p1ParticipantsPane.getAVModerationMenu().clickStopVideoModeration();

        await p1ParticipantsPane.close();

        await unmuteVideoAndCheck(p3, p1);
    });

    it('unmute by moderator', async () => {
        const { p1, p2, p3 } = ctx;

        await unmuteByModerator(p1, p3, true, true);

        // moderation is stopped at this point, make sure participants 1 & 2 are also unmuted,
        // participant3 was unmuted by unmuteByModerator
        await unmuteAudioAndCheck(p2, p1);
        await unmuteVideoAndCheck(p2, p1);

        // make sure p1 is not muted after turning on and then off the AV moderation
        await p1.getFilmstrip().assertAudioMuteIconIsDisplayed(p1, true);
        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2, true);
    });

    it('hangup and change moderator', async () => {
        // no moderator switching if jaas is available
        if (ctx.isJaasAvailable()) {
            return;
        }

        await Promise.all([ ctx.p2.hangup(), ctx.p3.hangup() ]);

        await ensureThreeParticipants(ctx);
        const { p1, p2, p3 } = ctx;

        await p2.getToolbar().clickAudioMuteButton();
        await p3.getToolbar().clickAudioMuteButton();

        const p1ParticipantsPane = p1.getParticipantsPane();

        await p1ParticipantsPane.clickContextMenuButton();
        await p1ParticipantsPane.getAVModerationMenu().clickStartAudioModeration();
        await p1ParticipantsPane.getAVModerationMenu().clickStartVideoModeration();

        await p2.getToolbar().clickRaiseHandButton();
        await p3.getToolbar().clickRaiseHandButton();

        await p1.hangup();

        // we don't use ensureThreeParticipants to avoid all meeting join checks
        // all participants are muted and checks for media will fail
        await ensureOneParticipant(ctx);

        // After p1 re-joins either p2 or p3 is promoted to moderator. They should still be muted.
        const isP2Moderator = await p2.isModerator();
        const moderator = isP2Moderator ? p2 : p3;
        const nonModerator = isP2Moderator ? p3 : p2;
        const moderatorParticipantsPane = moderator.getParticipantsPane();
        const nonModeratorParticipantsPane = nonModerator.getParticipantsPane();

        await moderatorParticipantsPane.assertVideoMuteIconIsDisplayed(moderator);
        await nonModeratorParticipantsPane.assertVideoMuteIconIsDisplayed(nonModerator);

        await moderatorParticipantsPane.allowVideo(nonModerator);
        await moderatorParticipantsPane.askToUnmute(nonModerator, false);

        await nonModerator.getNotifications().waitForAskToUnmuteNotification();

        await unmuteAudioAndCheck(nonModerator, p1);
        await unmuteVideoAndCheck(nonModerator, p1);

        await moderatorParticipantsPane.clickContextMenuButton();
        await moderatorParticipantsPane.getAVModerationMenu().clickStopAudioModeration();
        await moderatorParticipantsPane.getAVModerationMenu().clickStopVideoModeration();
    });
    it('grant moderator', async () => {
        await hangupAllParticipants();

        await ensureThreeParticipants(ctx);

        const { p1, p2, p3 } = ctx;

        const p1ParticipantsPane = p1.getParticipantsPane();

        await p1ParticipantsPane.clickContextMenuButton();
        await p1ParticipantsPane.getAVModerationMenu().clickStartAudioModeration();
        await p1ParticipantsPane.getAVModerationMenu().clickStartVideoModeration();

        await p1.getFilmstrip().grantModerator(p3);

        await p3.driver.waitUntil(
            () => p3.isModerator(), {
                timeout: 5000,
                timeoutMsg: `${p3.name} is not moderator`
            });

        await unmuteByModerator(p3, p2, false, true);
    });
    it('ask to unmute', async () => {
        await hangupAllParticipants();

        await ensureTwoParticipants(ctx);

        const { p1, p2 } = ctx;

        // mute p2
        await p2.getToolbar().clickAudioMuteButton();

        // ask p2 to unmute
        await p1.getParticipantsPane().askToUnmute(p2, true);

        await p2.getNotifications().waitForAskToUnmuteNotification();

        await p1.getParticipantsPane().close();
    });
    it('remove from whitelist', async () => {
        const { p1, p2 } = ctx;

        await unmuteByModerator(p1, p2, true, false);

        // p1 mute audio on p2 and check
        await p1.getFilmstrip().muteAudio(p2);
        await p1.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);

        // we try to unmute and test it that it was still muted
        await tryToAudioUnmuteAndCheck(p2, p1);

        // stop video and check
        await p1.getFilmstrip().muteVideo(p2);

        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);
        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);

        await tryToVideoUnmuteAndCheck(p2, p1);
    });
    it('join moderated', async () => {
        await hangupAllParticipants();

        await ensureOneParticipant(ctx);

        const p1ParticipantsPane = ctx.p1.getParticipantsPane();

        await p1ParticipantsPane.clickContextMenuButton();
        await p1ParticipantsPane.getAVModerationMenu().clickStartAudioModeration();
        await p1ParticipantsPane.getAVModerationMenu().clickStartVideoModeration();
        await p1ParticipantsPane.close();

        // join with second participant and check
        await ensureTwoParticipants(ctx, {
            skipInMeetingChecks: true
        });
        const { p1, p2 } = ctx;

        await p2.getNotifications().closeYouAreMutedNotification();
        await tryToAudioUnmuteAndCheck(p2, p1);
        await tryToVideoUnmuteAndCheck(p2, p1);

        // asked to unmute and check
        await unmuteByModerator(p1, p2, false, false);

        // mute and check
        await p1.getFilmstrip().muteAudio(p2);
        await p1.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);

        await tryToAudioUnmuteAndCheck(p2, p1);
    });
});

/**
 * Checks a user can unmute after being asked by moderator.
 * @param moderator - The participant that is moderator.
 * @param participant - The participant being asked to unmute.
 * @param turnOnModeration - if we want to turn on moderation before testing (when it is currently off).
 * @param stopModeration - true if moderation to be stopped when done.
 */
async function unmuteByModerator(
        moderator: Participant,
        participant: Participant,
        turnOnModeration: boolean,
        stopModeration: boolean) {
    const moderatorParticipantsPane = moderator.getParticipantsPane();

    if (turnOnModeration) {
        await moderatorParticipantsPane.clickContextMenuButton();
        await moderatorParticipantsPane.getAVModerationMenu().clickStartAudioModeration();
        await moderatorParticipantsPane.getAVModerationMenu().clickStartVideoModeration();

        await moderatorParticipantsPane.close();
    }

    // raise hand to speak
    await participant.getToolbar().clickRaiseHandButton();
    await moderator.getNotifications().waitForRaisedHandNotification();

    // ask participant to unmute
    await moderatorParticipantsPane.allowVideo(participant);
    await moderatorParticipantsPane.askToUnmute(participant, false);
    await participant.getNotifications().waitForAskToUnmuteNotification();

    await unmuteAudioAndCheck(participant, moderator);
    await unmuteVideoAndCheck(participant, moderator);

    if (stopModeration) {
        await moderatorParticipantsPane.clickContextMenuButton();
        await moderatorParticipantsPane.getAVModerationMenu().clickStopAudioModeration();
        await moderatorParticipantsPane.getAVModerationMenu().clickStopVideoModeration();

        await moderatorParticipantsPane.close();
    }
}

/**
 * In case of moderation, tries to audio unmute but stays muted.
 * Checks locally and remotely that this is still the case.
 * @param participant
 * @param observer
 */
async function tryToAudioUnmuteAndCheck(participant: Participant, observer: Participant) {
    // try to audio unmute and check
    await participant.getToolbar().clickAudioUnmuteButton();

    // Check local audio muted icon state
    await participant.getFilmstrip().assertAudioMuteIconIsDisplayed(participant);
    await observer.getFilmstrip().assertAudioMuteIconIsDisplayed(participant);
}

/**
 * In case of moderation, tries to video unmute but stays muted.
 * Checks locally and remotely that this is still the case.
 * @param participant
 * @param observer
 */
async function tryToVideoUnmuteAndCheck(participant: Participant, observer: Participant) {
    // try to video unmute and check
    await participant.getToolbar().clickVideoUnmuteButton();

    // Check local audio muted icon state
    await participant.getParticipantsPane().assertVideoMuteIconIsDisplayed(participant);
    await observer.getParticipantsPane().assertVideoMuteIconIsDisplayed(participant);
}
