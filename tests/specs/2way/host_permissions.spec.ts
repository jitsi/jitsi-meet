
/*
Checks if the host related permissions are properly granted.
*/

import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

describe('Host Permissions', () => {
    it('p1 joins as host', async () => {
        await ensureOneParticipant(ctx);

        expect(await ctx.p1.isModerator()).toBe(true);
        const participants_pane = ctx.p1.getParticipantsPane();

        await participants_pane.open();
        await ctx.p1.driver.waitUntil(
            () => participants_pane.isOpen(),
            {
                timeout: 3000,
                timeoutMsg: 'participants pane did not open'
            }
        );

        const title = await participants_pane.getParticipantTitle(ctx.p1);

        expect(title).toBe('Moderator');
    });

    it('p2 joins as guest', async () => {
        await ensureTwoParticipants(ctx);
        const participants_pane = ctx.p2.getParticipantsPane();

        await participants_pane.open();
        await ctx.p2.driver.waitUntil(
            () => participants_pane.isOpen(),
            {
                timeout: 3000,
                timeoutMsg: 'participants pane did not open'
            }
        );
        const title = await participants_pane.getParticipantTitle(ctx.p1);

        expect(title).toBe('Moderator');

        // Try to press end meeting for all button
        expect(
            await ctx.p2.getToolbar().clickHangupForAll().catch(e => e.message)
        ).toBe('\'End meeting for all\' option not found.');
    });

    it('p2 is promoted to mod', async () => {
        const { p1, p2 } = ctx;

        await p1.getFilmstrip().grantModerator(p2);

        await p2.driver.waitUntil(
            () => p2.isModerator(),
            {
                timeout: 3000,
                timeoutMsg: 'p2 did not become moderator'
            }
        );

        // Try to press end meeting for all button
        expect(
            await ctx.p2.getToolbar().clickHangupForAll().catch(e => e.message)
        ).toBe('\'End meeting for all\' option not found.');
    });

    it('p1 as host can end the meeting for all', async () => {
        const { p1, p2 } = ctx;

        // press end meeting for all button
        await ctx.p1.getToolbar().clickHangupForAll();

        expect(await p1.isInMuc()).toBe(false);
        expect(await p2.isInMuc()).toBe(false);
    });
});
