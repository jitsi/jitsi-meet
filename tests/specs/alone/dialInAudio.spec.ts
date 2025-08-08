import process from 'node:process';

import { ensureOneParticipant } from '../../helpers/participants';
import { cleanup, dialIn, isDialInEnabled, waitForAudioFromDialInParticipant } from '../helpers/DialIn';

describe('Dial-In', () => {
    it('join participant', async () => {
        // check rest url is configured
        if (!process.env.DIAL_IN_REST_URL) {
            ctx.skipSuiteTests = true;

            return;
        }

        await ensureOneParticipant({ preferGenerateToken: true });

        // check dial-in is enabled
        if (!await isDialInEnabled(ctx.p1)) {
            ctx.skipSuiteTests = true;
        }
    });

    it('retrieve pin', async () => {
        let dialInPin: string;

        try {
            dialInPin = await ctx.p1.getDialInPin();
        } catch (e) {
            console.error('dial-in.test.no-pin');
            ctx.skipSuiteTests = true;
            throw e;
        }

        if (dialInPin.length === 0) {
            console.error('dial-in.test.no-pin');
            ctx.skipSuiteTests = true;
            throw new Error('no pin');
        }

        expect(dialInPin.length >= 8).toBe(true);
    });

    it('invite dial-in participant', async () => {
        await dialIn(ctx.p1);
    });

    it('wait for audio from dial-in participant', async () => {
        const { p1 } = ctx;

        if (!await p1.isInMuc()) {
            // local participant did not join abort
            return;
        }

        await waitForAudioFromDialInParticipant(p1);

        await cleanup(p1);
    });
});
