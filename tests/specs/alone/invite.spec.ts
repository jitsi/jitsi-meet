import { Participant } from '../../helpers/Participant';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant } from '../../helpers/participants';
import { assertDialInDisplayed, assertUrlDisplayed, isDialInEnabled, verifyMoreNumbersPage } from '../helpers/DialIn';

describe('Invite', () => {
    let p1: Participant;

    it('setup', async () => {
        // This is a temporary hack to avoid failing when running against a jaas env. The same cases are covered in
        // jaas/dial/dialin.spec.ts.
        if (testsConfig.jaas.enabled) {
            ctx.skipSuiteTests = 'JaaS is configured.';

            return;
        }

        await ensureOneParticipant();

        p1 = ctx.p1;

    });

    // The URL should always be displayed.
    it('url displayed', () => assertUrlDisplayed(p1));

    it('config values', async () => {
        const dialInEnabled = await isDialInEnabled(p1);

        if (expectations.dialIn.enabled !== null) {
            expect(dialInEnabled).toBe(expectations.dialIn.enabled);
        }
    });

    it('dial-in displayed', async () => {
        if (expectations.dialIn.enabled !== null) {
            await assertDialInDisplayed(p1, expectations.dialIn.enabled);
        }
    });

    it('view more numbers page', async () => {
        if (expectations.dialIn.enabled === true) {
            // TODO: assert the page is NOT shown when the expectation is false.
            await verifyMoreNumbersPage(p1);
        }
    });
});
