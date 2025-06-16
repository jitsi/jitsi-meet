import { ensureTwoParticipants, muteVideoAndCheck, unmuteVideoAndCheck } from '../../helpers/participants';

describe('Stop video', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx));

    it('stop video and check', () => muteVideoAndCheck(ctx.p1, ctx.p2));

    it('start video and check', () => unmuteVideoAndCheck(ctx.p1, ctx.p2));

    it('start video and check stream', async () => {
        await muteVideoAndCheck(ctx.p1, ctx.p2);

        // now participant2 should be on large video
        const largeVideoId = await ctx.p1.getLargeVideo().getId();

        await unmuteVideoAndCheck(ctx.p1, ctx.p2);

        // check if video stream from second participant is still on large video
        expect(largeVideoId).toBe(await ctx.p1.getLargeVideo().getId());
    });

    it('stop video on participant and check', () => muteVideoAndCheck(ctx.p2, ctx.p1));

    it('start video on participant and check', () => unmuteVideoAndCheck(ctx.p2, ctx.p1));

    it('stop video on before second joins', async () => {
        await ctx.p2.hangup();

        const { p1 } = ctx;

        await p1.getToolbar().clickVideoMuteButton();

        await ensureTwoParticipants(ctx);

        const { p2 } = ctx;

        await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

        await unmuteVideoAndCheck(p1, p2);
    });
});
