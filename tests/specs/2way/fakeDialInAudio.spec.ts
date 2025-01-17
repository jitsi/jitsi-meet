import process from 'node:process';

import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';
import { cleanup, isDialInEnabled, waitForAudioFromDialInParticipant } from '../helpers/DialIn';

describe('Fake Dial-In', () => {
    it('join participant', async () => {
        // we execute fake dial in only if the real dial in is not enabled

        // check rest url is not configured
        if (process.env.DIAL_IN_REST_URL) {
            ctx.skipSuiteTests = true;

            return;
        }

        await ensureOneParticipant(ctx);

        // check dial-in is enabled, so skip
        if (await isDialInEnabled(ctx.p1)) {
            ctx.skipSuiteTests = true;
        }
    });

    it('open invite dialog', async () => {
        await ctx.p1.getInviteDialog().open();

        await ctx.p1.getInviteDialog().clickCloseButton();
    });

    it('invite second participant', async () => {
        if (!await ctx.p1.isInMuc()) {
            // local participant did not join abort
            return;
        }

        await ensureTwoParticipants(ctx);
    });

    it('wait for audio from second participant', async () => {
        const { p1 } = ctx;

        if (!await p1.isInMuc()) {
            // local participant did not join abort
            return;
        }

        await waitForAudioFromDialInParticipant(p1);

        await cleanup(p1);
    });
});
