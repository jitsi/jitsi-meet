import process from 'node:process';

import { config as testsConfig } from '../../helpers/TestsConfig';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant } from '../../helpers/participants';
import { cleanup, dialIn, isDialInEnabled, waitForAudioFromDialInParticipant } from '../helpers/DialIn';

describe('Dial-In', () => {
    it('join participant', async () => {
        // check rest url is configured
        if (!process.env.DIAL_IN_REST_URL) {
            ctx.skipSuiteTests = 'DIAL_IN_REST_URL is not set.';

            return;
        }

        // This is a temporary hack to avoid failing when running against a jaas env. The same cases are covered in
        // jaas/dial/dialin.spec.ts.
        if (testsConfig.jaas.enabled) {
            ctx.skipSuiteTests = 'JaaS is configured.';

            return;
        }

        await ensureOneParticipant();

        expect(await ctx.p1.isInMuc()).toBe(true);

        const configEnabled = await isDialInEnabled(ctx.p1);

        if (expectations.dialIn.enabled !== null) {
            expect(configEnabled).toBe(expectations.dialIn.enabled);
        }

        if (!configEnabled) {
            ctx.skipSuiteTests = 'The environment does not support dial-in, and no expectation has been set.';
        }
    });

    it('retrieve pin', async () => {
        let dialInPin: string;

        try {
            dialInPin = await ctx.p1.getDialInPin();
        } catch (e) {
            console.error('dial-in.test.no-pin');
            ctx.skipSuiteTests = 'No dial-in pin is available.';
            throw e;
        }

        if (dialInPin.length === 0) {
            console.error('dial-in.test.no-pin');
            ctx.skipSuiteTests = 'The dial-in pin is empty.';
            throw new Error('no pin');
        }

        expect(dialInPin.length >= 8).toBe(true);
    });

    it('invite dial-in participant', async () => {
        await dialIn(await ctx.p1.getDialInPin());
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
