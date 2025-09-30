import { Participant } from '../../helpers/Participant';
import { ensureOneParticipant } from '../../helpers/participants';
import { assertDialInDisplayed, assertUrlDisplayed, isDialInEnabled, verifyMoreNumbersPage } from '../helpers/DialIn';

describe('Invite', () => {
    let p1: Participant;
    let dialInEnabled: boolean;

    it('setup', async () => {
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
