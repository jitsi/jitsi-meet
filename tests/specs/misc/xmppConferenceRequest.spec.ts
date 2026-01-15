import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'Test that conference requests work over XMPP',
    usesBrowsers: [ 'p1' ]
});

describe('XMPP Conference Request', () => {
    it('join with conferenceRequestUrl disabled', async () => {
        await ensureOneParticipant({
            skipWaitToJoin: true,
            configOverwrite: {
                prejoinConfig: {
                    enabled: true
                }
            }
        });

        const { p1 } = ctx;

        // Update config before joining, because this option cannot be overridden with URL params.
        await p1.driver.execute(async () => {
            config.conferenceRequestUrl = '';
            APP.store.dispatch({
                type: 'OVERWRITE_CONFIG',
                config
            });
        });

        await p1.getPreJoinScreen().getJoinButton().click();
        await p1.waitForMucJoinedOrError();
        expect(await p1.isInMuc()).toBe(true);
    });
});
