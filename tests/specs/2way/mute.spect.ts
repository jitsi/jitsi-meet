import type { Participant } from '../../helpers/Participant';
import {
    checkForScreensharingTile,
    ensureOneParticipant,
    ensureTwoParticipants,
    joinSecondParticipant,
    muteAudioAndCheck,
    unmuteAudioAndCheck,
    unmuteVideoAndCheck
} from '../../helpers/participants';

describe('Mute', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx));

    it('mute p1 and check', () => toggleMuteAndCheck(ctx.p1, ctx.p2, true));

    it('unmute p1 and check', () => toggleMuteAndCheck(ctx.p1, ctx.p2, false));

    it('mute p2 and check', () => toggleMuteAndCheck(ctx.p2, ctx.p1, true));

    it('unmute p2 and check', () => toggleMuteAndCheck(ctx.p2, ctx.p1, false));

    it('p1 mutes p2 and check', async () => {
        const { p1, p2 } = ctx;

        if (!await p1.isModerator()) {
            return;
        }

        await p1.getFilmstrip().muteAudio(p2);

        // and now check whether second participant is muted
        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
    });

    it('p2 unmute after p1 mute and check', async () => {
        const { p1, p2 } = ctx;

        await unmuteAudioAndCheck(p2, p1);
    });

    it('p1 mutes before p2 joins', async () => {
        await ctx.p2.hangup();

        const { p1 } = ctx;

        await p1.getToolbar().clickAudioMuteButton();

        await ensureTwoParticipants(ctx);

        const { p2 } = ctx;

        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p1);

        await toggleMuteAndCheck(p1, p2, false);
    });

    it('mute before join and screen share after in p2p', () => muteP1BeforeP2JoinsAndScreenshare(true));

    it('mute before join and screen share after with jvb', () => muteP1BeforeP2JoinsAndScreenshare(false));
});

/**
 * Toggles the mute state of a specific Meet conference participant and
 * verifies that a specific other Meet conference participants sees a
 * specific mute state for the former.
 * @param testee The participant whose mute state is to be toggled.
 * @param observer The participant to verify the mute state of {@code testee}.
 * @param muted the mute state of {@code testee} expected to be observed by {@code observer}.
 */
async function toggleMuteAndCheck(
        testee: Participant,
        observer: Participant,
        muted: boolean) {
    if (muted) {
        await muteAudioAndCheck(testee, observer);
    } else {
        await unmuteAudioAndCheck(testee, observer);
    }
}

/**
 * Video mutes participant1 before participant2 joins and checks if participant1 can share or unmute video
 * and that media is being received on participant2 in both the cases.
 *
 * @param p2p whether to enable p2p or not.
 */
async function muteP1BeforeP2JoinsAndScreenshare(p2p: boolean) {
    await Promise.all([ ctx.p1?.hangup(), ctx.p2?.hangup() ]);

    await ensureOneParticipant(ctx, {
        configOverwrite: {
            p2p: {
                enabled: p2p
            }
        }
    });

    const { p1 } = ctx;

    await p1.getToolbar().clickVideoMuteButton();

    await joinSecondParticipant(ctx, {
        configOverwrite: {
            p2p: {
                enabled: p2p
            }
        }
    });

    const { p2 } = ctx;

    if (p2p) {
        await p2.waitForP2PIceConnected();
    } else {
        await p2.waitForIceConnected();
    }

    await p2.waitForSendReceiveData({ checkReceive: false });

    // Check if p1 appears video muted on p2.
    await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

    // Start desktop share.
    await p1.getToolbar().clickDesktopSharingButton();

    await checkForScreensharingTile(p1, p2);

    // we need to pass the id of the fake participant we use for the screensharing
    await p2.waitForRemoteVideo(`${await p1.getEndpointId()}-v1`);

    // Stop desktop share and unmute video and check for video again.
    await p1.getToolbar().clickStopDesktopSharingButton();

    await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);
    await unmuteVideoAndCheck(p1, p2);
    await p2.waitForRemoteVideo(await p1.getEndpointId());
}
