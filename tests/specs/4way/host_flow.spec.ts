/*
Make sure that the Host assignment is properly done when people join the meeting,
and when the Host leaves and rejoins.
*/

import {
    ensureFourParticipants,
    ensureOneParticipant,
    ensureThreeParticipants,
    ensureTwoParticipants,
    joinFirstParticipant,
    joinSecondParticipant
} from '../../helpers/participants';


describe('Host flow', () => {
    it('p1 join as subbed', async () => {
        await ensureOneParticipant(ctx);

        expect(await ctx.p1.isModerator()).toBe(true);

    });

    it('p2 join as subbed', async () => {
        await ensureTwoParticipants(ctx, { preferGenerateToken: true });

        expect(await ctx.p2.isModerator()).toBe(false);
    });

    it('p3 join as unsubbed', async () => {
        await ensureThreeParticipants(ctx, { preferGenerateToken: true, moderator: false });

        expect(await ctx.p3.isModerator()).toBe(false);
    });

    it('p4 join as guest', async () => {
        await ensureFourParticipants(ctx);

        expect(await ctx.p4.isModerator()).toBe(false);
    });

    it('p1 leaves the meeting', async () => {
        const { p2 } = ctx;

        await ctx.p1.hangup();
        await p2.driver.waitUntil(
            () => p2.isModerator(),
            {
                timeout: 3000,
                timeoutMsg: 'p2 did not become moderator'
            }
        );

        expect(await ctx.p3.isModerator()).toBe(false);
        expect(await ctx.p4.isModerator()).toBe(false);
    });

    it('p2 leaves the meeting', async () => {
        await ctx.p2.hangup();
        // Should we wait a bit incase moderator assignment takes time?

        expect(await ctx.p3.isModerator()).toBe(false);
        expect(await ctx.p4.isModerator()).toBe(false);
    });

    it('p2 rejoins as unsubbed user', async () => {
        await joinSecondParticipant(ctx, { preferGenerateToken: true, moderator: false });

        expect(await ctx.p2.isModerator()).toBe(false);
        expect(await ctx.p3.isModerator()).toBe(false);
        expect(await ctx.p4.isModerator()).toBe(false);
    });

    it('p1 rejoins the meeting', async () => {
        await joinFirstParticipant(ctx); // Already waits atleast 2 seconds after in the meeting

        expect(await ctx.p1.isModerator()).toBe(true);
        expect(await ctx.p2.isModerator()).toBe(false);
        expect(await ctx.p3.isModerator()).toBe(false);
        expect(await ctx.p4.isModerator()).toBe(false);
    });

});
