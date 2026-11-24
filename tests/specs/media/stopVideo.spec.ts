import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';
import { muteVideoAndCheck, unmuteVideoAndCheck } from '../helpers/mute';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Stop video', () => {
    it('joining the meeting', () => ensureTwoParticipants());

    it('stop video and check', () => muteVideoAndCheck(ctx.p1, ctx.p2));

    it('start video and check', () => unmuteVideoAndCheckMedia(ctx.p1, ctx.p2));

    it('start video and check stream', async () => {
        await muteVideoAndCheck(ctx.p1, ctx.p2);

        // now participant2 should be on large video
        const largeVideoId = await ctx.p1.getLargeVideo().getId();

        await unmuteVideoAndCheckMedia(ctx.p1, ctx.p2);

        // check if video stream from second participant is still on large video
        expect(largeVideoId).toBe(await ctx.p1.getLargeVideo().getId());
    });

    it('stop video on participant and check', () => muteVideoAndCheck(ctx.p2, ctx.p1));

    it('start video on participant and check', () => unmuteVideoAndCheckMedia(ctx.p2, ctx.p1));

    it('stop video on before second joins', async () => {
        await ctx.p2.hangup();

        const { p1 } = ctx;

        await p1.getToolbar().clickVideoMuteButton();

        await ensureTwoParticipants();

        const { p2 } = ctx;

        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

        await unmuteVideoAndCheckMedia(p1, p2);
    });
});

/**
 * Unmutes the video of testee and checks that observer sees it unmuted and that observer is decoding frames from it.
 * The mute state alone is signalled over the presence, seeing it does not mean that any media is being received.
 *
 * @param testee The participant that unmutes its video.
 * @param observer The participant that should receive and decode the video of testee.
 */
async function unmuteVideoAndCheckMedia(testee: Participant, observer: Participant): Promise<void> {
    await unmuteVideoAndCheck(testee, observer);

    await observer.waitForRemoteVideoDecoding(await testee.getEndpointId());
}
