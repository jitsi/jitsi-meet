import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import WebhookProxy from '../../helpers/WebhookProxy';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';
import { fetchJson } from '../../helpers/utils';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('JaaS CHAT_UPLOADED webhook.', () => {
    const tenant = testsConfig.jaas.tenant;
    const customerId = tenant?.replace('vpaas-magic-cookie-', '');
    let p1: Participant, p2: Participant;
    let webhooksProxy: WebhookProxy;
    let fqn: string;

    it('setup', async () => {
        const room = ctx.roomName;

        webhooksProxy = ctx.webhooksProxy;
        p1 = await joinJaasMuc({ name: 'p1', token: t({ room }) });
        p2 = await joinJaasMuc({ name: 'p2', token: t({ room }) });
        fqn = `${testsConfig.jaas.tenant}/${room}`;
    });

    it('test webhook', async () => {
        await p1.getChatPanel().sendMessage('foo');
        await p2.getChatPanel().sendMessage('bar');
        await p1.getChatPanel().sendMessage('baz');

        await p1.hangup();
        await p2.hangup();

        const event: {
            appId: string;
            customerId: string;
            data: {
                preAuthenticatedLink: string;
            };
            eventType: string;
            fqn: string;
        } = await webhooksProxy.waitForEvent('CHAT_UPLOADED');

        expect(event.appId).toBe(tenant);
        expect(event.customerId).toBe(customerId);
        expect(event.data.preAuthenticatedLink).toBeDefined();
        expect(event.eventType).toBe('CHAT_UPLOADED');
        expect(event.fqn).toBe(fqn);

        const uploadedChat: any = await fetchJson(event.data.preAuthenticatedLink);

        expect(uploadedChat.meetingFqn).toBe(fqn);
        expect(uploadedChat.messageType).toBe('CHAT');

        const messages = uploadedChat.messages;

        expect(messages).toBeDefined();
        expect(messages.length).toBe(3);
        expect(messages[0].content).toBe('foo');
        expect(messages[0].name).toBe('p1');
        expect(messages[1].content).toBe('bar');
        expect(messages[1].name).toBe('p2');
        expect(messages[2].content).toBe('baz');
        expect(messages[2].name).toBe('p1');
    });
});
