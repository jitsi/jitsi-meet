import { Participant } from '../../../helpers/Participant';
import WebhookProxy from '../../../helpers/WebhookProxy';

interface IStartedWebhookPayload {
    direction: string;
    participantFullJid: string;
    participantId: string;
    participantJid: string;
}

/**
 * Checks the dial events for a participant and clean up at the end.
 * @param webhooksProxy
 * @param startedEventName
 * @param direction
 * @param customerId
 */
export async function verifyStartedWebhooks(
        webhooksProxy: WebhookProxy,
        direction: 'in' | 'out',
        startedEventName: string,
        customerId: string): Promise<IStartedWebhookPayload> {

    const startedEvent: {
        customerId: string;
        data: IStartedWebhookPayload;
        eventType: string;
    } = await webhooksProxy.waitForEvent(startedEventName);

    expect(startedEventName).toBe(startedEvent.eventType);
    expect(startedEvent.data.direction).toBe(direction);
    expect(startedEvent.customerId).toBe(customerId);

    const usageEvent: {
        customerId: string;
        data: any;
        eventType: string;
    } = await webhooksProxy.waitForEvent('USAGE');

    expect('USAGE').toBe(usageEvent.eventType);
    expect(usageEvent.customerId).toBe(customerId);

    expect(usageEvent.data.some((el: any) =>
        el.participantId === startedEvent.data.participantId && el.callDirection === direction)).toBe(true);

    return startedEvent.data;
}

export async function verifyEndedWebhook(
        webhooksProxy: WebhookProxy,
        endedEventName: string,
        customerId: string,
        startedPayload: IStartedWebhookPayload) {
    const endedEvent: {
        customerId: string;
        data: {
            direction: string;
            participantFullJid: string;
            participantId: string;
            participantJid: string;
        };
        eventType: string;
    } = await webhooksProxy.waitForEvent(endedEventName);

    expect(endedEventName).toBe(endedEvent.eventType);
    expect(endedEvent.customerId).toBe(customerId);
    expect(endedEvent.data.participantFullJid).toBe(startedPayload.participantFullJid);
    expect(endedEvent.data.participantId).toBe(startedPayload.participantId);
    expect(endedEvent.data.participantJid).toBe(startedPayload.participantJid);
}

/**
 * Wait until there is at least one remote participant, ICE is connected, the participant has a stream, and data is
 * both received and sent.
 */
export async function waitForMedia(p: Participant) {
    await p.waitForParticipants(1);
    await p.waitForIceConnected();
    await p.waitForRemoteStreams(1);
    await p.waitForSendReceiveData(20_000);
}
