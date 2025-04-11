import { ensureTwoParticipants } from '../../helpers/participants';

describe('Kick', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants(ctx);

        if (!await ctx.p1.isModerator()) {
            ctx.skipSuiteTests = true;
        }
    });

    it('kick and check', () => kickParticipant2AndCheck());

    it('kick p2p and check', async () => {
        await ensureTwoParticipants(ctx, {
            configOverwrite: {
                p2p: {
                    enabled: true
                }
            }
        });

        await kickParticipant2AndCheck();
    });
});

/**
 * Kicks the second participant and checks that the participant is removed from the conference and that dialog is open.
 */
async function kickParticipant2AndCheck() {
    const { p1, p2 } = ctx;

    await p1.getFilmstrip().kickParticipant(await p2.getEndpointId());

    await p1.waitForParticipants(0);

    // check that the kicked participant sees the kick reason dialog
    // let's wait for this to appear at least 2 seconds
    await p2.driver.waitUntil(
        async () => p2.isLeaveReasonDialogOpen(), {
            timeout: 2000,
            timeoutMsg: 'No leave reason dialog shown for p2'
        });
}
