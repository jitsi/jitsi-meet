import { expect } from '@wdio/globals';

import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Endpoint text message iframe API commands and events', () => {
    let p1: Participant;
    let p2: Participant;

    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        p1 = ctx.p1;
        p2 = ctx.p2;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('endpointTextMessageReceived');
        await p2.getIframeAPI().addEventListener('endpointTextMessageReceived');
    });

    it('sends direct endpoint text message from p1 to p2', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();
        const testMessage = 'Hello from p1 direct';

        await p2.getIframeAPI().clearEventResults('endpointTextMessageReceived');
        await p1.getIframeAPI().clearEventResults('endpointTextMessageReceived');

        await p1.switchToMainFrame();
        await p1.getIframeAPI().sendEndpointTextMessage(p2EndpointId, testMessage);

        // p2 should receive the endpoint text message
        const receivedEvent = await p2.getIframeAPI().waitForEventResult(
            'endpointTextMessageReceived',
            'endpointTextMessageReceived event was not received by p2'
        );

        expect(receivedEvent?.data?.senderInfo?.id).toBe(p1EndpointId);
        expect(receivedEvent?.data?.eventData?.text).toBe(testMessage);

        // p1 sender should not receive their own targeted message
        const p1Received = await p1.getIframeAPI().getEventResult('endpointTextMessageReceived');

        expect(p1Received).toBeUndefined();
    });

    it('broadcasts endpoint text message to all participants when target is empty string', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const broadcastMessage = 'Broadcast announcement from p1';

        await p2.getIframeAPI().clearEventResults('endpointTextMessageReceived');

        await p1.switchToMainFrame();
        await p1.getIframeAPI().sendEndpointTextMessage('', broadcastMessage);

        const receivedEvent = await p2.getIframeAPI().waitForEventResult(
            'endpointTextMessageReceived',
            'broadcast endpointTextMessageReceived event was not received by p2'
        );

        expect(receivedEvent?.data?.senderInfo?.id).toBe(p1EndpointId);
        expect(receivedEvent?.data?.eventData?.text).toBe(broadcastMessage);
    });

    it('sends bidirectional endpoint text message from p2 to p1', async () => {
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();
        const replyMessage = 'Acknowledgment reply from p2';

        await p1.getIframeAPI().clearEventResults('endpointTextMessageReceived');

        await p2.switchToMainFrame();
        await p2.getIframeAPI().sendEndpointTextMessage(p1EndpointId, replyMessage);

        const receivedEvent = await p1.getIframeAPI().waitForEventResult(
            'endpointTextMessageReceived',
            'endpointTextMessageReceived reply was not received by p1'
        );

        expect(receivedEvent?.data?.senderInfo?.id).toBe(p2EndpointId);
        expect(receivedEvent?.data?.eventData?.text).toBe(replyMessage);
    });
});
