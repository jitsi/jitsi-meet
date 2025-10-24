import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Hangup', () => {
    it('joining the meeting', () => ensureTwoParticipants());

    it('hangup call and check', async () => {
        const { p1 } = ctx;
        const url = await p1.driver.getUrl();

        await p1.getToolbar().clickHangupButton();

        await p1.driver.waitUntil(
            async () => await p1.driver.getUrl() !== url,
            {
                timeout: 5000,
                timeoutMsg: 'p1 did not navigate away from the conference'
            }
        );
    });
});
