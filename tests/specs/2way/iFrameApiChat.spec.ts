import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { ensureTwoParticipants } from '../../helpers/participants';
import { fetchJson } from '../../helpers/utils';


describe('Chat', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants(ctx);

        const { p1, p2 } = ctx;

        if (await p1.execute(() => config.disableIframeAPI)) {
            // skip the test if iframeAPI is disabled
            ctx.skipSuiteTests = true;

            return;
        }

        // let's populate endpoint ids
        await Promise.all([
            p1.getEndpointId(),
            p2.getEndpointId()
        ]);
    });

    it('send message', async () => {
        const { p1, p2 } = ctx;

        await p1.switchToAPI();
        await p2.switchToAPI();

        await p2.getIframeAPI().addEventListener('chatUpdated');
        await p2.getIframeAPI().addEventListener('incomingMessage');
        await p1.getIframeAPI().addEventListener('outgoingMessage');

        const testMessage = 'Hello world';

        await p1.getIframeAPI().executeCommand('sendChatMessage', testMessage);

        const chatUpdatedEvent: {
            isOpen: boolean;
            unreadCount: number;
        } = await p2.driver.waitUntil(() => p2.getIframeAPI().getEventResult('chatUpdated'), {
            timeout: 3000,
            timeoutMsg: 'Chat was not updated'
        });

        expect(chatUpdatedEvent).toEqual({
            isOpen: false,
            unreadCount: 1
        });

        const incomingMessageEvent: {
            from: string;
            message: string;
            nick: string;
            privateMessage: boolean;
        } = await p2.getIframeAPI().getEventResult('incomingMessage');

        expect(incomingMessageEvent).toEqual({
            from: await p1.getEndpointId(),
            message: testMessage,
            nick: p1.name,
            privateMessage: false
        });

        const outgoingMessageEvent: {
            message: string;
            privateMessage: boolean;
        } = await p1.getIframeAPI().getEventResult('outgoingMessage');

        expect(outgoingMessageEvent).toEqual({
            message: testMessage,
            privateMessage: false
        });

        await p1.getIframeAPI().clearEventResults('outgoingMessage');
        await p2.getIframeAPI().clearEventResults('chatUpdated');
        await p2.getIframeAPI().clearEventResults('incomingMessage');
    });

    it('toggle chat', async () => {
        const { p1, p2 } = ctx;

        await p2.getIframeAPI().executeCommand('toggleChat');

        await testSendGroupMessageWithChatOpen(p1, p2);

        await p1.getIframeAPI().clearEventResults('outgoingMessage');
        await p2.getIframeAPI().clearEventResults('chatUpdated');
        await p2.getIframeAPI().clearEventResults('incomingMessage');
    });

    it('private chat', async () => {
        const { p1, p2 } = ctx;
        const testMessage = 'Hello private world!';
        const p2Id = await p2.getEndpointId();
        const p1Id = await p1.getEndpointId();

        await p1.getIframeAPI().executeCommand('initiatePrivateChat', p2Id);
        await p1.getIframeAPI().executeCommand('sendChatMessage', testMessage, p2Id);

        const incomingMessageEvent = await p2.driver.waitUntil(
            () => p2.getIframeAPI().getEventResult('incomingMessage'), {
                timeout: 3000,
                timeoutMsg: 'Chat was not received'
            });

        expect(incomingMessageEvent).toEqual({
            from: p1Id,
            message: testMessage,
            nick: p1.name,
            privateMessage: true
        });

        expect(await p1.getIframeAPI().getEventResult('outgoingMessage')).toEqual({
            message: testMessage,
            privateMessage: true
        });

        await p1.getIframeAPI().executeCommand('cancelPrivateChat');

        await p2.getIframeAPI().clearEventResults('chatUpdated');
        await p2.getIframeAPI().clearEventResults('incomingMessage');

        await testSendGroupMessageWithChatOpen(p1, p2);
    });

    it('chat upload chat', async () => {
        const { p1, p2, webhooksProxy } = ctx;

        await p1.getIframeAPI().executeCommand('hangup');
        await p2.getIframeAPI().executeCommand('hangup');

        if (webhooksProxy) {
            const event: {
                data: {
                    preAuthenticatedLink: string;
                };
                eventType: string;
            } = await webhooksProxy.waitForEvent('CHAT_UPLOADED', 20000);

            expect('CHAT_UPLOADED').toBe(event.eventType);
            expect(event.data.preAuthenticatedLink).toBeDefined();

            const uploadedChat: any = await fetchJson(event.data.preAuthenticatedLink);

            expect(uploadedChat.messageType).toBe('CHAT');
            expect(uploadedChat.messages).toBeDefined();
            expect(uploadedChat.messages.length).toBe(3);
        }
    });
});

/**
 * Test sending a group message with the chat open.
 * @param p1
 * @param p2
 */
async function testSendGroupMessageWithChatOpen(p1: Participant, p2: Participant) {
    const testMessage = 'Hello world again';

    await p1.getIframeAPI().executeCommand('sendChatMessage', testMessage);

    const chatUpdatedEvent: {
        isOpen: boolean;
        unreadCount: number;
    } = await p2.driver.waitUntil(() => p2.getIframeAPI().getEventResult('chatUpdated'), {
        timeout: 3000,
        timeoutMsg: 'Chat was not updated'
    });

    expect(chatUpdatedEvent).toEqual({
        isOpen: true,
        unreadCount: 0
    });

    const incomingMessageEvent = await p2.driver.waitUntil(
        () => p2.getIframeAPI().getEventResult('incomingMessage'), {
            timeout: 3000,
            timeoutMsg: 'Chat was not received'
        });

    expect(incomingMessageEvent).toEqual({
        from: await p1.getEndpointId(),
        message: testMessage,
        nick: p1.name,
        privateMessage: false
    });
}
