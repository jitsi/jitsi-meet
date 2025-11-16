import { Participant } from '../../../helpers/Participant';
import { setTestProperties } from '../../../helpers/TestProperties';
import { config as testsConfig } from '../../../helpers/TestsConfig';
import WebhookProxy from '../../../helpers/WebhookProxy';
import { joinJaasMuc, generateJaasToken as t } from '../../../helpers/jaas';

setTestProperties(__filename, {
    requireWebhookProxy: true,
    useJaas: true,
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

describe('Visitors triggered by visitor tokens', () => {
    let webhooksProxy: WebhookProxy;
    let room: string;

    async function verifyJoinedWebhook(participant: Participant) {
        const context = participant.getToken()?.payload.context;
        const event: {
            customerId: string;
            data: {
                avatar: string;
                email: string;
                group: string;
                id: string;
                name: string;
                participantJid: string;
                role: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('PARTICIPANT_JOINED');

        expect('PARTICIPANT_JOINED').toBe(event.eventType);
        expect(event.data.avatar).toBe(context.user.avatar);
        expect(event.data.email).toBe(context.user.email);
        expect(event.data.id).toBe(context.user.id);
        expect(event.data.group).toBe(context.group);
        expect(event.data.name).toBe(context.user.name);
        if (context.user.visitor) {
            expect(event.data.participantJid.indexOf('meet.jitsi') != -1).toBe(true);
            expect(event.data.role).toBe('visitor');
        }
        expect(event.customerId).toBe(testsConfig.jaas.customerId);
    }

    async function verifyLeftWebhook(participant: Participant) {
        const context = participant.getToken()?.payload.context;
        const eventLeft: {
            customerId: string;
            data: {
                avatar: string;
                email: string;
                group: string;
                id: string;
                name: string;
                participantJid: string;
                role: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('PARTICIPANT_LEFT');

        expect('PARTICIPANT_LEFT').toBe(eventLeft.eventType);
        expect(eventLeft.data.avatar).toBe(context.user.avatar);
        expect(eventLeft.data.email).toBe(context.user.email);
        expect(eventLeft.data.id).toBe(context.user.id);
        expect(eventLeft.data.group).toBe(context.group);
        expect(eventLeft.data.name).toBe(context.user.name);
        if (context.user.visitor) {
            expect(eventLeft.data.participantJid.indexOf('meet.jitsi') != -1).toBe(true);
            expect(eventLeft.data.role).toBe('visitor');
        }
        expect(eventLeft.customerId).toBe(testsConfig.jaas.customerId);
    }

    it('setup', async () => {
        webhooksProxy = ctx.webhooksProxy;
        webhooksProxy.defaultMeetingSettings = {
            visitorsEnabled: true
        };
        room = ctx.roomName;
    });

    it('test visitor tokens', async () => {

        webhooksProxy.clearCache();
        const moderatorToken = t({ room, displayName: 'Mo de Rator', moderator: true });
        const moderator = await joinJaasMuc({ name: 'p1', token: moderatorToken });

        expect(await moderator.isInMuc()).toBe(true);
        expect(await moderator.isModerator()).toBe(true);
        expect(await moderator.isVisitor()).toBe(false);
        await verifyJoinedWebhook(moderator);

        webhooksProxy.clearCache();
        // Joining with a participant token before any visitors
        const participantToken = t({ room, displayName: 'Parti Cipant' });
        const participant = await joinJaasMuc({ name: 'p2', token: participantToken });

        expect(await participant.isInMuc()).toBe(true);
        expect(await participant.isModerator()).toBe(false);
        expect(await participant.isVisitor()).toBe(false);
        await verifyJoinedWebhook(participant);

        webhooksProxy.clearCache();
        // Joining with a visitor token
        const visitorToken = t({ room, displayName: 'Visi Tor', visitor: true });
        const visitor = await joinJaasMuc({ name: 'p3', token: visitorToken });

        expect(await visitor.isInMuc()).toBe(true);
        expect(await visitor.isModerator()).toBe(false);
        expect(await visitor.isVisitor()).toBe(true);
        await verifyJoinedWebhook(visitor);

        webhooksProxy.clearCache();
        await participant.hangup();
        await verifyLeftWebhook(participant);

        webhooksProxy.clearCache();
        // Joining with a participant token after visitors -> visitor
        const participantToken2 = t({ room, displayName: 'Visi Tor 2' });
        const visitor2 = await joinJaasMuc({ name: 'p2', token: participantToken2 });

        expect(await visitor2.isInMuc()).toBe(true);
        expect(await visitor2.isModerator()).toBe(false);
        expect(await visitor2.isVisitor()).toBe(true);
        await verifyJoinedWebhook(visitor2);

        webhooksProxy.clearCache();
        await visitor.hangup();
        await verifyLeftWebhook(visitor);

        webhooksProxy.clearCache();
        await visitor2.hangup();
        await verifyLeftWebhook(visitor2);

        webhooksProxy.clearCache();
        await moderator.hangup();
        await verifyLeftWebhook(moderator);
    });
});
