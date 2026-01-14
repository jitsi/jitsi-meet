import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'Test that conference requests work over XMPP',
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('XMPP Conference Request', () => {
    it('join with conferenceRequestUrl disabled', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                conferenceRequestUrl: ''
            }
        });
    });

    it('verifies conferenceRequestUrl is empty in config', async () => {
        const { p1, p2 } = ctx;

        const p1Config = await p1.execute(() => config.conferenceRequestUrl);
        const p2Config = await p2.execute(() => config.conferenceRequestUrl);

        expect(p1Config).toBe('');
        expect(p2Config).toBe('');
    });
});
