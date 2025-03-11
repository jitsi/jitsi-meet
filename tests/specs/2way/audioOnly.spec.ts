import { ensureTwoParticipants } from '../../helpers/participants';

describe('Audio only', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx));

    /**
     * Enables audio only mode for p1 and verifies that the other participant sees participant1 as video muted.
     */
    it('set and check', () => setAudioOnlyAndCheck(true));

    /**
     * Verifies that participant1 sees avatars for itself and other participants.
     */
    it('avatars check', async () => {
        const { p1 } = ctx;

        await p1.driver.$('//div[@id="dominantSpeaker"]').waitForDisplayed();

        // Makes sure that the avatar is displayed in the local thumbnail and that the video is not displayed.
        await p1.assertThumbnailShowsAvatar(p1);
    });

    /**
     * Disables audio only mode and verifies that both participants see p1 as not video muted.
     */
    it('disable and check', () => setAudioOnlyAndCheck(false));

    /**
     * Mutes video on participant1, toggles audio-only twice and then verifies if both participants see participant1
     * as video muted.
     */
    it('mute video, set twice and check muted', async () => {
        const { p1 } = ctx;

        // Mute video on participant1.
        await p1.getToolbar().clickVideoMuteButton();

        await verifyVideoMute(true);

        // Enable audio-only mode.
        await setAudioOnlyAndCheck(true);

        // Disable audio-only mode.
        await p1.getVideoQualityDialog().setVideoQuality(false);

        // p1 should stay muted since it was muted before audio-only was enabled.
        await verifyVideoMute(true);
    });

    it('unmute video and check not muted', async () => {
        // Unmute video on participant1.
        await ctx.p1.getToolbar().clickVideoUnmuteButton();

        await verifyVideoMute(false);
    });
});

/**
 * Toggles the audio only state of a p1 participant and verifies participant sees the audio only label and that
 * p2 participant sees a video mute state for the former.
 * @param enable
 */
async function setAudioOnlyAndCheck(enable: boolean) {
    const { p1 } = ctx;

    await p1.getVideoQualityDialog().setVideoQuality(enable);

    await verifyVideoMute(enable);

    await p1.driver.$('//div[@id="videoResolutionLabel"][contains(@class, "audio-only")]')
        .waitForDisplayed({ reverse: !enable });
}

/**
 * Verifies that p1 and p2 see p1 as video muted or not.
 * @param muted
 */
async function verifyVideoMute(muted: boolean) {
    const { p1, p2 } = ctx;

    // Verify the observer sees the testee in the desired muted state.
    await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1, !muted);

    // Verify the testee sees itself in the desired muted state.
    await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1, !muted);
}
