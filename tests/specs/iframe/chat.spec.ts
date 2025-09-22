import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { joinMuc } from '../../helpers/joinMuc';

setTestProperties(__filename, {
    // Note this just for posterity. We don't depend on the framework doing anything for us because of this flag (we
    // pass it as a parameter directly)
    useIFrameApi: false,
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Chat', () => {
    let p1: Participant, p2: Participant;
    // Cache the endpoint IDs because Participant.getEndpointId() does not work in the main frame.
    let endpoint1: string, endpoint2: string;

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true });
        p2 = await joinMuc({ name: 'p2', iFrameApi: true });

        if (await p1.execute(() => config.disableIframeAPI)) {
            // skip the test if iframeAPI is disabled
            ctx.skipSuiteTests = true;

            return;
        }

        endpoint1 = await p1.getEndpointId();
        endpoint2 = await p2.getEndpointId();
        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

    });

    it('send message', async () => {
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
            from: endpoint1,
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
        await p2.getIframeAPI().executeCommand('toggleChat');

        await testSendGroupMessageWithChatOpen(p1, p2, endpoint1);

        await p1.getIframeAPI().clearEventResults('outgoingMessage');
        await p2.getIframeAPI().clearEventResults('chatUpdated');
        await p2.getIframeAPI().clearEventResults('incomingMessage');
    });

    it('private chat', async () => {
        const testMessage = 'Hello private world!';

        await p1.getIframeAPI().executeCommand('initiatePrivateChat', endpoint2);
        await p1.getIframeAPI().executeCommand('sendChatMessage', testMessage, endpoint2);

        const incomingMessageEvent = await p2.driver.waitUntil(
            () => p2.getIframeAPI().getEventResult('incomingMessage'), {
                timeout: 3000,
                timeoutMsg: 'Chat was not received'
            });

        expect(incomingMessageEvent).toEqual({
            from: endpoint1,
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

        await testSendGroupMessageWithChatOpen(p1, p2, endpoint1);
    });
});

/**
 * Send a group message from [sender], verify that it was received correctly by [receiver].
 * @param sender the Participant that sends the message.
 * @param receiver the Participant that receives the message.
 * @param senderEndpointId the endpoint ID of the sender.
 */
async function testSendGroupMessageWithChatOpen(sender: Participant, receiver: Participant, senderEndpointId: string) {
    const testMessage = 'Hello world again';

    await sender.getIframeAPI().executeCommand('sendChatMessage', testMessage);

    const chatUpdatedEvent: {
        isOpen: boolean;
        unreadCount: number;
    } = await receiver.driver.waitUntil(() => receiver.getIframeAPI().getEventResult('chatUpdated'), {
        timeout: 3000,
        timeoutMsg: 'Chat was not updated'
    });

    expect(chatUpdatedEvent).toEqual({
        isOpen: true,
        unreadCount: 0
    });

    const incomingMessageEvent = await receiver.driver.waitUntil(
        () => receiver.getIframeAPI().getEventResult('incomingMessage'), {
            timeout: 3000,
            timeoutMsg: 'Chat was not received'
        });

    expect(incomingMessageEvent).toEqual({
        from: senderEndpointId,
        message: testMessage,
        nick: sender.name,
        privateMessage: false
    });
}
