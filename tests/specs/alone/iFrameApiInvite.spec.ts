import type { Participant } from '../../helpers/Participant';
import { ensureOneParticipant } from '../../helpers/participants';
import {
    cleanup,
    dialIn,
    isDialInEnabled,
    retrievePin,
    waitForAudioFromDialInParticipant
} from '../helpers/DialIn';

describe('Invite iframeAPI', () => {
    it('join participant', async () => {
        await ensureOneParticipant(ctx);

        const { p1 } = ctx;

        // check for dial-in dial-out sip-jibri maybe
        if (await p1.execute(() => config.disableIframeAPI)) {
            // skip the test if iframeAPI is disabled
            ctx.skipSuiteTests = true;

            return;
        }

        ctx.data.dialOutDisabled = Boolean(!await p1.execute(() => config.dialOutAuthUrl));
        ctx.data.sipJibriDisabled = Boolean(!await p1.execute(() => config.inviteServiceUrl));

        // check dial-in is enabled
        if (!await isDialInEnabled(ctx.p1) || !process.env.DIAL_IN_REST_URL) {
            ctx.data.dialInDisabled = true;
        }
    });

    it('dial-in', async () => {
        if (ctx.data.dialInDisabled) {
            return;
        }

        const { p1 } = ctx;

        await retrievePin(p1);

        expect(ctx.data.dialInPin.length >= 8).toBe(true);

        await dialIn(p1);

        if (!await p1.isInMuc()) {
            // local participant did not join abort
            return;
        }

        await waitForAudioFromDialInParticipant(p1);

        await checkDialEvents(p1, 'in', 'DIAL_IN_STARTED', 'DIAL_IN_ENDED');
    });

    it('dial-out', async () => {
        if (ctx.data.dialOutDisabled || !process.env.DIAL_OUT_URL) {
            return;
        }

        const { p1 } = ctx;

        await p1.switchToAPI();

        await p1.getIframeAPI().invitePhone(process.env.DIAL_OUT_URL);

        await p1.switchInPage();

        await p1.waitForParticipants(1);

        await waitForAudioFromDialInParticipant(p1);

        await checkDialEvents(p1, 'out', 'DIAL_OUT_STARTED', 'DIAL_OUT_ENDED');
    });

    it('sip jibri', async () => {
        if (ctx.data.sipJibriDisabled || !process.env.SIP_JIBRI_DIAL_OUT_URL) {
            return;
        }

        const { p1 } = ctx;

        await p1.switchToAPI();

        await p1.getIframeAPI().inviteSIP(process.env.SIP_JIBRI_DIAL_OUT_URL);

        await p1.switchInPage();

        await p1.waitForParticipants(1);

        await waitForAudioFromDialInParticipant(p1);

        const { webhooksProxy } = ctx;

        if (webhooksProxy) {
            const customerId = process.env.IFRAME_TENANT?.replace('vpaas-magic-cookie-', '');
            const sipCallOutStartedEvent: {
                customerId: string;
                data: {
                    participantFullJid: string;
                    participantId: string;
                    participantJid: string;
                    sipAddress: string;
                };
                eventType: string;
            } = await webhooksProxy.waitForEvent('SIP_CALL_OUT_STARTED');

            expect('SIP_CALL_OUT_STARTED').toBe(sipCallOutStartedEvent.eventType);
            expect(sipCallOutStartedEvent.data.sipAddress).toBe(`sip:${process.env.SIP_JIBRI_DIAL_OUT_URL}`);
            expect(sipCallOutStartedEvent.customerId).toBe(customerId);

            const participantId = sipCallOutStartedEvent.data.participantId;
            const participantJid = sipCallOutStartedEvent.data.participantJid;
            const participantFullJid = sipCallOutStartedEvent.data.participantFullJid;

            await cleanup(p1);

            const sipCallOutEndedEvent: {
                customerId: string;
                data: {
                    direction: string;
                    participantFullJid: string;
                    participantId: string;
                    participantJid: string;
                };
                eventType: string;
            } = await webhooksProxy.waitForEvent('SIP_CALL_OUT_ENDED');

            expect('SIP_CALL_OUT_ENDED').toBe(sipCallOutEndedEvent.eventType);
            expect(sipCallOutEndedEvent.customerId).toBe(customerId);
            expect(sipCallOutEndedEvent.data.participantFullJid).toBe(participantFullJid);
            expect(sipCallOutEndedEvent.data.participantId).toBe(participantId);
            expect(sipCallOutEndedEvent.data.participantJid).toBe(participantJid);
        } else {
            await cleanup(p1);
        }
    });
});

/**
 * Checks the dial events for a participant and clean up at the end.
 * @param participant
 * @param startedEventName
 * @param endedEventName
 * @param direction
 */
async function checkDialEvents(participant: Participant, direction: string, startedEventName: string, endedEventName: string) {
    const { webhooksProxy } = ctx;

    if (webhooksProxy) {
        const customerId = process.env.IFRAME_TENANT?.replace('vpaas-magic-cookie-', '');
        const dialInStartedEvent: {
            customerId: string;
            data: {
                direction: string;
                participantFullJid: string;
                participantId: string;
                participantJid: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent(startedEventName);

        expect(startedEventName).toBe(dialInStartedEvent.eventType);
        expect(dialInStartedEvent.data.direction).toBe(direction);
        expect(dialInStartedEvent.customerId).toBe(customerId);

        const participantId = dialInStartedEvent.data.participantId;
        const participantJid = dialInStartedEvent.data.participantJid;
        const participantFullJid = dialInStartedEvent.data.participantFullJid;

        const usageEvent: {
            customerId: string;
            data: any;
            eventType: string;
        } = await webhooksProxy.waitForEvent('USAGE');

        expect('USAGE').toBe(usageEvent.eventType);
        expect(usageEvent.customerId).toBe(customerId);

        expect(usageEvent.data.some((el: any) =>
            el.participantId === participantId && el.callDirection === direction)).toBe(true);

        await cleanup(participant);

        const dialInEndedEvent: {
            customerId: string;
            data: {
                direction: string;
                participantFullJid: string;
                participantId: string;
                participantJid: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent(endedEventName);

        expect(endedEventName).toBe(dialInEndedEvent.eventType);
        expect(dialInEndedEvent.customerId).toBe(customerId);
        expect(dialInEndedEvent.data.participantFullJid).toBe(participantFullJid);
        expect(dialInEndedEvent.data.participantId).toBe(participantId);
        expect(dialInEndedEvent.data.participantJid).toBe(participantJid);
    } else {
        await cleanup(participant);
    }
}
