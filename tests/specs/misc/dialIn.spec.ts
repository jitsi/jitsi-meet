import process from 'node:process';

import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant } from '../../helpers/participants';
import {
    assertDialInDisplayed,
    assertUrlDisplayed,
    cleanup,
    dialIn,
    isDialInEnabled, verifyMoreNumbersPage,
    waitForAudioFromDialInParticipant
} from '../helpers/DialIn';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1' ]
});

/**
 * This test is configured with two options:
 * 1. The dialIn.enabled expectation. If set to true we assert the config.js settings for dial-in are set, the dial-in
 * panel (including the PIN number) is displayed in the UI, and the "more numbers" page is displayed. If it's set to
 * false we assert the config.js settings are not set, and the PIN is not displayed.
 * 2. The DIAL_IN_REST_URL environment variable. If this is set and the environment supports dial-in, we invite a
 * dial-in participant via this URL and assert that it joins the conference and sends media.
 */
describe('Dial-in', () => {
    it('join participant', async () => {
        // The same cases are covered for JaaS in jaas/dial/dialin.spec.ts.
        if (testsConfig.jaas.enabled) {
            ctx.skipSuiteTests = 'JaaS is configured.';

            return;
        }

        await ensureOneParticipant();
        expect(await ctx.p1.isInMuc()).toBe(true);
    });

    it('dial in config.js values', async function() {
        if (expectations.dialIn.enabled === true) {
            expect(await isDialInEnabled(ctx.p1)).toBe(expectations.dialIn.enabled);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.skip();
        }
    });

    it('open/close invite dialog', async () => {
        await ctx.p1.getInviteDialog().open();
        await ctx.p1.getInviteDialog().clickCloseButton();
        await ctx.p1.getInviteDialog().waitTillOpen(true);
    });

    it('dial-in displayed', async function() {
        if (expectations.dialIn.enabled !== null) {
            await assertDialInDisplayed(ctx.p1, expectations.dialIn.enabled);
        } else {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.skip();
        }
    });

    it('skip the rest if dial-in is not expected', async () => {
        if (!expectations.dialIn.enabled) {
            ctx.skipSuiteTests = 'Dial-in is not expected';
        }
    });

    it('url displayed', () => assertUrlDisplayed(ctx.p1));


    it('view more numbers page', async () => {
        await verifyMoreNumbersPage(ctx.p1);
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

        if (!dialInPin.match(/^[0-9]+$/)) {
            throw new Error(`The dial-in PIN contains non-digit characters: ${dialInPin}`);
        }
        expect(dialInPin.length).toBeGreaterThanOrEqual(expectations.dialIn.minPinLength);
    });

    it('skip the rest if a dial-in URL is not configured', async () => {
        if (!process.env.DIAL_IN_REST_URL) {
            ctx.skipSuiteTests = 'DIAL_IN_REST_URL is not set.';
        }
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
