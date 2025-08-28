import { ensureFourParticipants, ensureThreeParticipants, ensureTwoParticipants } from '../../helpers/participants';

describe('lastN', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                startWithAudioMuted: true,
                startWithVideoMuted: true,
                channelLastN: 1
            },
            skipInMeetingChecks: true
        });

        await ensureThreeParticipants({
            configOverwrite: {
                channelLastN: 1
            },
            skipInMeetingChecks: true,
        });
    });

    it('checks', async () => {
        const { p3 } = ctx;
        const p3Toolbar = p3.getToolbar();

        await p3.waitForSendMedia();

        await ctx.p1.waitForRemoteVideo(await p3.getEndpointId());

        // Mute audio on participant3.
        await p3Toolbar.clickAudioMuteButton();

        await ensureFourParticipants({
            configOverwrite: {
                channelLastN: 1
            },
            skipInMeetingChecks: true
        });

        const { p1, p2, p4 } = ctx;

        await p4.waitForSendReceiveData();

        // Mute audio on p4 and unmute p3.
        await p4.getToolbar().clickAudioMuteButton();
        await p3Toolbar.clickAudioUnmuteButton();

        const p4EndpointId = await p4.getEndpointId();
        const p3EndpointId = await p3.getEndpointId();

        // Check if p1 starts receiving video from p3 and p4 shows up as ninja.
        await p1.waitForNinjaIcon(p4EndpointId);
        await p1.waitForRemoteVideo(p3EndpointId);

        // At this point, mute video of p3 and others should be receiving p4's video.
        // Mute p1's video
        await p3Toolbar.clickVideoMuteButton();
        await p3.getParticipantsPane().assertVideoMuteIconIsDisplayed(p3);
        await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p3);
        await p1.waitForRemoteVideo(p4EndpointId);

        // Unmute p3's video and others should switch to receiving p3's video.
        await p3Toolbar.clickVideoUnmuteButton();
        await p1.waitForRemoteVideo(p3EndpointId);
        await p1.waitForNinjaIcon(p4EndpointId);

        // Mute p3's audio and unmute p2's audio. Other endpoints should continue to receive video from p3
        // even though p2 is the dominant speaker.
        await p3Toolbar.clickAudioMuteButton();
        await p2.getToolbar().clickAudioUnmuteButton();
        await p1.waitForRemoteVideo(p3EndpointId);
    });
});
