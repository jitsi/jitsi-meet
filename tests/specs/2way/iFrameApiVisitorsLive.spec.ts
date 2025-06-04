import { expect } from '@wdio/globals';

import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

describe('Visitors', () => {
    it('joining the meeting', async () => {
        const { webhooksProxy } = ctx;

        if (webhooksProxy) {
            webhooksProxy.defaultMeetingSettings = {
                visitorsEnabled: true,
                visitorsLive: false
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


    it('go live', async () => {
        await ensureTwoParticipants(ctx, {
            preferGenerateToken: true,
            visitor: true,
            skipWaitToJoin: true,
            skipInMeetingChecks: true
        });

        const { p1, p2 } = ctx;
        const p2Visitors = p2.getVisitors();
        const p1Visitors = p1.getVisitors();

        await p2.driver.waitUntil(async () => p2Visitors.isVisitorsQueueUIShown(), {
            timeout: 5000,
            timeoutMsg: 'Missing visitors queue UI'
        });

        await p1.driver.waitUntil(async () => await p1Visitors.getWaitingVisitorsInQueue()
                === 'Viewers waiting in queue: 1', {
            timeout: 15000,
            timeoutMsg: 'Missing visitors queue count in UI'
        });

        await p1Visitors.goLive();

        await p2.waitToJoinMUC();

        await p2.waitForSendReceiveData({
            checkSend: false,
            msg: 'Visitor is not receiving media'
        }).then(() => p2.waitForRemoteStreams(1));

        await p2.driver.waitUntil(() => p2Visitors.hasVisitorsDialog(), {
            timeout: 5000,
            timeoutMsg: 'Missing visitors dialog'
        });

        expect((await p1Visitors.getVisitorsCount()).trim()).toBe('1');
        expect((await p1Visitors.getVisitorsHeaderFromParticipantsPane()).trim()).toBe('Viewers 1');
    });
});
