import { Participant } from '../../helpers/Participant';
import { config as testsConfig} from '../../helpers/TestsConfig';
import { ensureOneParticipant } from '../../helpers/participants';
import { assertDialInDisplayed, assertUrlDisplayed, isDialInEnabled, verifyMoreNumbersPage } from '../helpers/DialIn';

describe('Invite', () => {
    let p1: Participant;
    let dialInEnabled: boolean;

    it('setup', async () => {
        // This is a temporary hack to avoid failing when running against a jaas env. The same cases are covered in
        // jaas/dial/dialin.spec.ts.
        if (testsConfig.jaas.enabled) {
            ctx.skipSuiteTests = true;
            return;
        }

        await ensureOneParticipant();

        p1 = ctx.p1;
        dialInEnabled = await isDialInEnabled(p1);
    });

    it('url displayed', () => assertUrlDisplayed(p1));

    it('dial-in displayed', async () => {
        if (!dialInEnabled) {
            return;
        }
        await assertDialInDisplayed(p1);
    });

    it('view more numbers page', async () => {
        if (!dialInEnabled) {
            return;
        }

        await verifyMoreNumbersPage(p1);
    });
});
