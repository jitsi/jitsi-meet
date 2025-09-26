import { expect } from '@wdio/globals';

import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import WebhookProxy from '../../helpers/WebhookProxy';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

/**
 * Tests the basic webhooks fired for participants joining, leaving, and creating/destroying a conference:
 * PARTICIPANT_JOINED, PARTICIPANT_LEFT, ROOM_CREATED, ROOM_DESTROYED, ROLE_CHANGED, USAGE.
 */
describe('Create/destroy/join/leave webhooks', () => {
    let conferenceJid: string = '';
    let p1: Participant, p2: Participant;
    let p1EpId: string, p2EpId: string;
    let webhooksProxy: WebhookProxy;
    let room: string;

    async function checkParticipantJoinedHook(p: Participant) {
        const event: {
            data: {
                conference: string;
                isBreakout: boolean;
                moderator: boolean;
                name: string;
                participantId: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('PARTICIPANT_JOINED');

        expect(event.eventType).toBe('PARTICIPANT_JOINED');
        expect(event.data.conference).toBe(conferenceJid);
        expect(event.data.isBreakout).toBe(false);
        expect(event.data.moderator).toBe(p.getToken()?.options?.moderator);
        expect(event.data.name).toBe(await p.getLocalDisplayName());
        expect(event.data.participantId).toBe(await p.getEndpointId());
        expect(event.data.name).toBe(p.name);
    }
    async function checkParticipantLeftHook(p: Participant, reason: string) {

        const event: {
            customerId: string;
            data: {
                conference: string;
                disconnectReason: string;
                group: string;
                id: string;
                isBreakout: boolean;
                name: string;
                participantId: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('PARTICIPANT_LEFT');

        expect(event.eventType).toBe('PARTICIPANT_LEFT');
        expect(event.data.conference).toBe(conferenceJid);
        expect(event.data.disconnectReason).toBe(reason);
        expect(event.data.isBreakout).toBe(false);
        expect(event.data.participantId).toBe(await p.getEndpointId());
        expect(event.data.name).toBe(p.name);

        const jwtPayload = p.getToken()?.payload;

        expect(event.data.id).toBe(jwtPayload?.context?.user?.id);
        expect(event.data.group).toBe(jwtPayload?.context?.group);
        expect(event.customerId).toBe(testsConfig.jaas.customerId);
    }

    it('setup', async () => {
        room = ctx.roomName;
        conferenceJid = `${room}@conference.${testsConfig.jaas.tenant}.${new URL(process.env.BASE_URL || '').hostname}`;
        webhooksProxy = ctx.webhooksProxy;
        p1 = await joinJaasMuc({ name: 'p1', iFrameApi: true, token: t({ room, moderator: true }) });
        p1EpId = await p1.getEndpointId();
        expect(await p1.isModerator()).toBe(true);
        await checkParticipantJoinedHook(p1);
        await p1.switchToMainFrame();
        p2 = await joinJaasMuc({ name: 'p2', token: t({ room }) });
        p2EpId = await p2.getEndpointId();
        expect(await p2.isModerator()).toBe(false);
        await checkParticipantJoinedHook(p2);
    });

    it('USAGE webhook', async () => {
        const event: {
            data: [
                { participantId: string; }
            ];
            eventType: string;
        } = await webhooksProxy.waitForEvent('USAGE');

        expect(event.eventType).toBe('USAGE');

        expect(event.data.some(d => d.participantId === p1EpId));
        expect(event.data.some(d => d.participantId === p2EpId));
    });

    it('ROOM_CREATED webhook', async () => {
        const event: {
            data: {
                conference: string;
                isBreakout: boolean;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('ROOM_CREATED');

        expect(event.eventType).toBe('ROOM_CREATED');
        expect(event.data.conference).toBe(conferenceJid);
        expect(event.data.isBreakout).toBe(false);
    });

    it('ROLE_CHANGED webhook', async () => {
        await p1.getIframeAPI().executeCommand('grantModerator', p2EpId);

        const event: {
            data: {
                grantedBy: {
                    participantId: string;
                };
                grantedTo: {
                    participantId: string;
                };
                role: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('ROLE_CHANGED');

        expect(event.eventType).toBe('ROLE_CHANGED');
        expect(event.data.role).toBe('moderator');
        expect(event.data.grantedBy.participantId).toBe(p1EpId);
        expect(event.data.grantedTo.participantId).toBe(p2EpId);
    });

    it('kick participant', async () => {
        webhooksProxy.clearCache();
        await p1.getIframeAPI().executeCommand('kickParticipant', p2EpId);
        await checkParticipantLeftHook(p2, 'kicked');
    });

    it('join after kick', async () => {
        webhooksProxy.clearCache();

        // join again
        p2 = await joinJaasMuc({ name: 'p2', token: t({ room }) });
        p2EpId = await p2.getEndpointId();

        await checkParticipantJoinedHook(p2);
    });

    it('hangup', async () => {
        await p2.hangup();
        await checkParticipantLeftHook(p2, 'left');
    });

    it('dispose conference', async () => {
        await p1.getIframeAPI().executeCommand('hangup');
        await checkParticipantLeftHook(p1, 'left');

        const event: {
            data: {
                conference: string;
                isBreakout: boolean;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('ROOM_DESTROYED');

        expect(event.eventType).toBe('ROOM_DESTROYED');
        expect(event.data.conference).toBe(conferenceJid);
        expect(event.data.isBreakout).toBe(false);
    });
});
