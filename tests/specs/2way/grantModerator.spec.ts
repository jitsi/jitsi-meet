import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

describe('Grant moderator', () => {
    it('joining the meeting', async () => {
        await ensureOneParticipant(ctx);

        if (await ctx.p1.execute(() => typeof APP.conference._room.grantOwner !== 'function')) {
            ctx.skipSuiteTests = true;

            return;
        }

        await ensureTwoParticipants(ctx);
    });

    it('grant moderator and validate', async () => {
        const { p1, p2 } = ctx;

        if (!await p1.isModerator()) {
            ctx.skipSuiteTests = true;

            return;
        }

        if (await p2.isModerator()) {
            ctx.skipSuiteTests = true;

            return;
        }

        await p1.getFilmstrip().grantModerator(p2);

        await p2.driver.waitUntil(
            () => p2.isModerator(),
            {
                timeout: 3000,
                timeoutMsg: 'p2 did not become moderator'
            }
        );

    });
});
