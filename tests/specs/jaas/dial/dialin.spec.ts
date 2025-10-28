import type { Participant } from '../../../helpers/Participant';
import { setTestProperties } from '../../../helpers/TestProperties';
import { config as testsConfig } from '../../../helpers/TestsConfig';
import WebhookProxy from '../../../helpers/WebhookProxy';
import { expectations } from '../../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../../helpers/jaas';
import {
    assertDialInDisplayed, assertUrlDisplayed,
    dialIn,
    isDialInEnabled, verifyMoreNumbersPage,
} from '../../helpers/DialIn';

import { verifyEndedWebhook, verifyStartedWebhooks, waitForMedia } from './util';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true
});

describe('Dial-in', () => {
    let p1: Participant, webhooksProxy: WebhookProxy;
    const customerId: string = testsConfig.jaas.customerId || '';

    it('setup', async () => {
        const room = ctx.roomName;

        if (!process.env.DIAL_IN_REST_URL) {
            ctx.skipSuiteTests = 'DIAL_IN_REST_URL is not set.';

            return;
        }

        p1 = await joinJaasMuc({ name: 'p1', token: t({ room, moderator: true }) });
        webhooksProxy = ctx.webhooksProxy;
        if (!webhooksProxy) {
            console.error('WebhooksProxy is not available, will not verify webhooks.');
        }

        expect(await p1.isInMuc()).toBe(true);
        if (expectations.dialIn.enabled !== null) {
            expect(await isDialInEnabled(p1)).toBe(expectations.dialIn.enabled);
        }
        expect(customerId).toBeDefined();
    });

    it ('Invite UI', async () => {
        await assertUrlDisplayed(p1);
        if (expectations.dialIn.enabled !== null) {
            await assertDialInDisplayed(p1, expectations.dialIn.enabled);
        }
        if (expectations.dialIn.enabled === true) {
            // TODO: assert the page is NOT shown when the expectation is false.
            await verifyMoreNumbersPage(p1);
        }
    });

    it('dial-in', async () => {
        const dialInPin = await p1.getDialInPin();

        expect(dialInPin.length >= 8).toBe(true);

        await dialIn(dialInPin);
        await waitForMedia(p1);

        let startedPayload: any;

        if (webhooksProxy) {
            startedPayload
                = await verifyStartedWebhooks(webhooksProxy, 'in', 'DIAL_IN_STARTED', customerId);
        }

        const endpointId = await p1.execute(() => APP?.conference?.listMembers()[0].getId());

        await p1.getFilmstrip().kickParticipant(endpointId);

        if (webhooksProxy) {
            await verifyEndedWebhook(webhooksProxy, 'DIAL_IN_ENDED', customerId, startedPayload);
        }

        await p1.hangup();
    });
});
