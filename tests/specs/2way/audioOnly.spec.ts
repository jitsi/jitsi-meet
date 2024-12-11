import { ensureTwoParticipants } from '../../helpers/participants';

describe('Audio only - ', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants(context);
    });

    /**
     * Enables audio only mode for p1 and verifies that the other participant sees participant1 as video muted.
     */
    it('set and check', async () => {
        await setAudioOnlyAndCheck(true);
    });

    /**
     * Verifies that participant1 sees avatars for itself and other participants.
     */
    it('avatars check', async () => {
        await context.p1.driver.$('//div[@id="dominantSpeaker"]').waitForDisplayed();

        // Makes sure that the avatar is displayed in the local thumbnail and that the video is not displayed.
        await context.p1.assertThumbnailShowsAvatar(context.p1);
    });

    /**
     * Disables audio only mode and verifies that both participants see p1 as not video muted.
     */
    it('disable and check', async () => {
        await setAudioOnlyAndCheck(false);
    });

    /**
     * Toggles the audio only state of a p1 participant and verifies participant sees the audio only label and that
     * p2 participant sees a video mute state for the former.
     * @param enable
     */
    async function setAudioOnlyAndCheck(enable: boolean) {
        await context.p1.getVideoQualityDialog().setVideoQuality(enable);

        await verifyVideoMute(enable);

        await context.p1.driver.$('//div[@id="videoResolutionLabel"][contains(@class, "audio-only")]')
            .waitForDisplayed({ reverse: !enable });
    }

    /**
     * Verifies that p1 and p2 see p1 as video muted or not.
     * @param muted
     */
    async function verifyVideoMute(muted: boolean) {
        // Verify the observer sees the testee in the desired muted state.
        await context.p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p1, !muted);

        // Verify the testee sees itself in the desired muted state.
        await context.p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(context.p1, !muted);
    }

    /**
     * Mutes video on participant1, toggles audio-only twice and then verifies if both participants see participant1
     * as video muted.
     */
    it('mute video, set twice and check muted', async () => {
        // Mute video on participant1.
        await context.p1.getToolbar().clickVideoMuteButton();

        await verifyVideoMute(true);

        // Enable audio-only mode.
        await setAudioOnlyAndCheck(true);

        // Disable audio-only mode.
        await context.p1.getVideoQualityDialog().setVideoQuality(false);

        // p1 should stay muted since it was muted before audio-only was enabled.
        await verifyVideoMute(true);
    });

    it('unmute video and check not muted', async () => {
        // Unmute video on participant1.
        await context.p1.getToolbar().clickVideoUnmuteButton();

        await verifyVideoMute(false);
    });
});
