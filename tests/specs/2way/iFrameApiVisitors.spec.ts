import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

describe('Visitors', () => {
    it('joining the meeting', async () => {
        const { webhooksProxy } = ctx;

        if (webhooksProxy) {
            webhooksProxy.defaultMeetingSettings = {
                visitorsEnabled: true
            };
        }

        await ensureOneParticipant(ctx);

        const { p1 } = ctx;

        if (await p1.execute(() => config.disableIframeAPI)) {
            // skip the test if iframeAPI is disabled or visitors are not supported
            ctx.skipSuiteTests = true;

            return;
        }

        await p1.driver.waitUntil(() => p1.execute(() => APP.conference._room.isVisitorsSupported()), {
            timeout: 2000
        }).then(async () => {
            await p1.switchToAPI();
        }).catch(() => {
            ctx.skipSuiteTests = true;
        });
    });

    it('visitor joins', async () => {
        await ensureTwoParticipants(ctx, {
            preferGenerateToken: true,
            visitor: true,
            skipInMeetingChecks: true
        });

        const { p1, p2, webhooksProxy } = ctx;

        await p2.waitForSendReceiveData({
            checkSend: false,
            msg: 'Visitor is not receiving media'
        }).then(() => p2.waitForRemoteStreams(1));

        const p2Visitors = p2.getVisitors();
        const p1Visitors = p1.getVisitors();

        await p2.driver.waitUntil(() => p2Visitors.hasVisitorsDialog(), {
            timeout: 5000,
            timeoutMsg: 'Missing visitors dialog'
        });

        expect((await p1Visitors.getVisitorsCount()).trim()).toBe('1');
        expect((await p1Visitors.getVisitorsHeaderFromParticipantsPane()).trim()).toBe('Viewers 1');

        if (webhooksProxy) {
            // PARTICIPANT_JOINED webhook
            // @ts-ignore
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

            const jwtPayload = ctx.data[`${p2.name}-jwt-payload`];

            expect('PARTICIPANT_JOINED').toBe(event.eventType);
            expect(event.data.avatar).toBe(jwtPayload.context.user.avatar);
            expect(event.data.email).toBe(jwtPayload.context.user.email);
            expect(event.data.id).toBe(jwtPayload.context.user.id);
            expect(event.data.group).toBe(jwtPayload.context.group);
            expect(event.data.name).toBe(p2.name);
            expect(event.data.participantJid.indexOf('meet.jitsi') != -1).toBe(true);
            expect(event.data.name).toBe(p2.name);
            expect(event.data.role).toBe('visitor');
            expect(event.customerId).toBe(process.env.IFRAME_TENANT?.replace('vpaas-magic-cookie-', ''));

            await p2.switchToAPI();
            await p2.getIframeAPI().executeCommand('hangup');

            // PARTICIPANT_LEFT webhook
            // @ts-ignore
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
            expect(eventLeft.data.avatar).toBe(jwtPayload.context.user.avatar);
            expect(eventLeft.data.email).toBe(jwtPayload.context.user.email);
            expect(eventLeft.data.id).toBe(jwtPayload.context.user.id);
            expect(eventLeft.data.group).toBe(jwtPayload.context.group);
            expect(eventLeft.data.name).toBe(p2.name);
            expect(eventLeft.data.participantJid.indexOf('meet.jitsi') != -1).toBe(true);
            expect(eventLeft.data.name).toBe(p2.name);
            expect(eventLeft.data.role).toBe('visitor');
            expect(eventLeft.customerId).toBe(process.env.IFRAME_TENANT?.replace('vpaas-magic-cookie-', ''));
        }
    });
});
