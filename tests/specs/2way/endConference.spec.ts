import { ensureTwoParticipants } from '../../helpers/participants';

describe('End Conference', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx));

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
