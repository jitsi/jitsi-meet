import { setTestProperties } from '../../helpers/TestProperties';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true
});

// JaaS deployments set deeplinking.[android|ios].appScheme to 'com.8x8.meet',
// which makes getDeepLinkingPage() short-circuit on mobile browsers (see
// react/features/deep-linking/functions.web.ts). This test verifies that
// behavior by emulating an iPhone and asserting the meeting is reached.
describe('JaaS mobile browser deep linking', () => {
    before(async () => {
        // Make Chrome look like an iPhone so Platform.OS resolves to 'ios' and
        // isMobileBrowser() returns true. emulate() persists for the session.
        await multiRemoteBrowser.getInstance('p1').emulate('device', 'iPhone 15');
    });

    it('does not show the deep linking page', async () => {
        // joinJaasMuc waits for the prejoin screen with a 3s timeout. If the
        // deep linking mobile page had rendered instead, that lookup would
        // throw, failing the test. Reaching the assertion below means the
        // prejoin was found.
        const p = await joinJaasMuc({
            token: t({ room: '*' })
        }, {
            skipWaitToJoin: true
        });

        // Belt-and-suspenders: the deep linking mobile page renders the
        // 'launchMeetingLabel' string; assert it isn't on the page.
        const deepLinkLabel = p.driver.$(
            '//*[contains(text(),"How do you want to join this meeting?")]');

        expect(await deepLinkLabel.isExisting()).toBe(false);
    });
});
