import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Chat', () => {
    let p1: Participant, p2: Participant;

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1', iFrameApi: true, token: testsConfig.jwt.preconfiguredToken });
        p2 = await joinMuc({ name: 'p2', iFrameApi: true });

        if (await p1.execute(() => config.disableIframeAPI)) {
            ctx.skipSuiteTests = 'The environment has the iFrame API disabled.';

            return;
        }

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

        expect(incomingMessageEvent).toMatchObject({
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
        await p2.getIframeAPI().executeCommand('toggleChat');

        await testSendGroupMessageWithChatOpen(p1, p2);

        await p1.getIframeAPI().clearEventResults('outgoingMessage');
        await p2.getIframeAPI().clearEventResults('chatUpdated');
        await p2.getIframeAPI().clearEventResults('incomingMessage');
    });

    it('private chat', async () => {
        const testMessage = 'Hello private world!';

        await p1.getIframeAPI().executeCommand('initiatePrivateChat', await p2.getEndpointId());
        await p1.getIframeAPI().executeCommand('sendChatMessage', testMessage, await p2.getEndpointId());

        const incomingMessageEvent = await p2.driver.waitUntil(
            () => p2.getIframeAPI().getEventResult('incomingMessage'), {
                timeout: 3000,
                timeoutMsg: 'Chat was not received'
            });

        expect(incomingMessageEvent).toMatchObject({
            from: await p1.getEndpointId(),
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
});

/**
 * Send a group message from [sender], verify that it was received correctly by [receiver].
 * @param sender the Participant that sends the message.
 * @param receiver the Participant that receives the message.
 */
async function testSendGroupMessageWithChatOpen(sender: Participant, receiver: Participant) {
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

    expect(incomingMessageEvent).toMatchObject({
        from: await sender.getEndpointId(),
        message: testMessage,
        nick: sender.name,
        privateMessage: false
    });
}
