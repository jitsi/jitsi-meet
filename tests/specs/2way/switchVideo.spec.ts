import { ensureTwoParticipants } from '../../helpers/participants';

describe('SwitchVideo', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx));

    it('p1 click on local', () => ctx.p1.getFilmstrip().pinParticipant(ctx.p1));

    it('p1 click on remote', async () => {
        await closeToolbarMenu();

        const { p1, p2 } = ctx;

        await p1.getFilmstrip().pinParticipant(p2);
    });

    it('p1 unpin remote', () => ctx.p1.getFilmstrip().unpinParticipant(ctx.p2));

    it('p2 pin remote', () => ctx.p2.getFilmstrip().pinParticipant(ctx.p1));

    it('p2 unpin remote', () => ctx.p2.getFilmstrip().unpinParticipant(ctx.p1));

    it('p2 click on local', () => ctx.p2.getFilmstrip().pinParticipant(ctx.p2));

    it('p2 click on remote', async () => {
        await closeToolbarMenu();

        const { p1, p2 } = ctx;

        await p2.getFilmstrip().pinParticipant(p1);
    });
});

/**
 * Closes the overflow menu on both participants.
 */
async function closeToolbarMenu() {
    await ctx.p1.getToolbar().closeOverflowMenu();
    await ctx.p2.getToolbar().closeOverflowMenu();
}
