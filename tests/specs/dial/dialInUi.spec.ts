import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant } from '../../helpers/participants';
import { assertDialInDisplayed, assertUrlDisplayed, isDialInEnabled, verifyMoreNumbersPage } from '../helpers/DialIn';

setTestProperties(__filename, {
    description: 'This tests verifies that the user interface for dial-in is displayed correctly (number, pin, \
        "more numbers" page).'
});

describe('Dial-in UI', () => {
    let p1: Participant;

    it('setup', async () => {
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
