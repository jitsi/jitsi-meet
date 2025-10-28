import type { Participant } from '../../../helpers/Participant';
import { setTestProperties } from '../../../helpers/TestProperties';
import { config as testsConfig } from '../../../helpers/TestsConfig';
import WebhookProxy from '../../../helpers/WebhookProxy';
import { joinJaasMuc, generateJaasToken as t } from '../../../helpers/jaas';

import { waitForMedia } from './util';

setTestProperties(__filename, {
    requireWebhookProxy: true,
    useJaas: true,
});


describe('SIP jibri invite', () => {
    let p1: Participant, webhooksProxy: WebhookProxy;
    const customerId = testsConfig.jaas.customerId || '';
    const dialOutUrl = process.env.SIP_JIBRI_DIAL_OUT_URL || '';

    it('setup', async () => {
        const room = ctx.roomName;

        if (true) {
            // This is temporary until we figure out how to fix it and configure it properly.
            ctx.skipSuiteTests = 'This test is disabled as the code doesn\'t work anymore.';

            return;
        }

        if (!dialOutUrl) {
            ctx.skipSuiteTests = 'SIP_JIBRI_DIAL_OUT_URL is not set.';

            return;
        }

        p1 = await joinJaasMuc({ name: 'p1', iFrameApi: true, token: t({ room, moderator: true }) });
        webhooksProxy = ctx.webhooksProxy;

        expect(await p1.isInMuc()).toBe(true);
        expect(Boolean(await p1.execute(() => config.inviteServiceUrl))).toBe(true);
    });

    it('sip jibri', async () => {
        await p1.switchToMainFrame();
        await p1.getIframeAPI().inviteSIP(dialOutUrl);
        await p1.switchToIFrame();
        await p1.waitForParticipants(1);
        await waitForMedia(p1);

        const startedEvent: {
            customerId: string;
            data: {
                participantFullJid: string;
                participantId: string;
                participantJid: string;
                sipAddress: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('SIP_CALL_OUT_STARTED');

        expect('SIP_CALL_OUT_STARTED').toBe(startedEvent.eventType);
        expect(startedEvent.data.sipAddress).toBe(`sip:${process.env.SIP_JIBRI_DIAL_OUT_URL}`);
        expect(startedEvent.customerId).toBe(customerId);

        const endpointId = await p1.execute(() => APP?.conference?.listMembers()[0].getId());

        await p1.getFilmstrip().kickParticipant(endpointId);

        const endedEvent: {
            customerId: string;
            data: {
                direction: string;
                participantFullJid: string;
                participantId: string;
                participantJid: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('SIP_CALL_OUT_ENDED');

        expect('SIP_CALL_OUT_ENDED').toBe(endedEvent.eventType);
        expect(endedEvent.customerId).toBe(customerId);
        expect(endedEvent.data.participantFullJid).toBe(startedEvent.data.participantFullJid);
        expect(endedEvent.data.participantId).toBe(startedEvent.data.participantId);
        expect(endedEvent.data.participantJid).toBe(startedEvent.data.participantJid);
    });
});
