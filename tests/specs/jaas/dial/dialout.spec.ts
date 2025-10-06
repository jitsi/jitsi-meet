import type { Participant } from '../../../helpers/Participant';
import { setTestProperties } from '../../../helpers/TestProperties';
import { config as testsConfig } from '../../../helpers/TestsConfig';
import WebhookProxy from '../../../helpers/WebhookProxy';
import { joinJaasMuc, generateJaasToken as t } from '../../../helpers/jaas';

import { verifyEndedWebhook, verifyStartedWebhooks, waitForMedia } from './util';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true
});

describe('Dial-out', () => {
    let p1: Participant, webhooksProxy: WebhookProxy;
    const dialOutUrl = process.env.DIAL_OUT_URL || '';
    const customerId = testsConfig.jaas.customerId || '';

    it('setup', async () => {
        const room = ctx.roomName;

        if (!dialOutUrl) {
            ctx.skipSuiteTests = 'DIAL_OUT_URL is not set.';

            return;
        }

        webhooksProxy = ctx.webhooksProxy;
        p1 = await joinJaasMuc({ name: 'p1', iFrameApi: true, token: t({ room, moderator: true }) });

        expect(await p1.isInMuc()).toBe(true);
        expect(Boolean(await p1.execute(() => config.dialOutAuthUrl))).toBe(true);
    });

    it('dial-out', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().invitePhone(dialOutUrl);
        await p1.switchToIFrame();
        await p1.waitForParticipants(1);
        await waitForMedia(p1);

        const startedPayload
            = await verifyStartedWebhooks(webhooksProxy, 'out', 'DIAL_OUT_STARTED', customerId);
        const endpointId = await p1.execute(() => APP?.conference?.listMembers()[0].getId());

        await p1.getFilmstrip().kickParticipant(endpointId);

        await verifyEndedWebhook(webhooksProxy, 'DIAL_OUT_ENDED', customerId, startedPayload);
    });
});
