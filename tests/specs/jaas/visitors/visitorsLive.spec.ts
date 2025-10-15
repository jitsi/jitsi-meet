import { expect } from '@wdio/globals';

import { Participant } from '../../../helpers/Participant';
import { setTestProperties } from '../../../helpers/TestProperties';
import { joinMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true,
    useWebhookProxy: true,
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Visitors', () => {
    let visitor: Participant, moderator: Participant;

    it('setup', async () => {
        ctx.webhooksProxy.defaultMeetingSettings = {
            visitorsEnabled: true,
            visitorsLive: false
        };

        moderator = await joinMuc({
            name: 'p1',
            token: t({ room: ctx.roomName, displayName: 'Mo de Rator', moderator: true })
        });

        // TODO: Remove this in favor of configurable test expectations
        await moderator.driver.waitUntil(() => moderator.execute(() => APP.conference._room.isVisitorsSupported()), {
            timeout: 2000
        }).catch(e => {
            console.log(`Skipping test due to error: ${e}`);
            ctx.skipSuiteTests = true;
        });

        visitor = await joinMuc({
            name: 'p2',
            token: t({ room: ctx.roomName, displayName: 'Visi Tor', visitor: true })
        }, {
            skipWaitToJoin: true
        });
    });


    it('go live', async () => {

        const vVisitors = visitor.getVisitors();
        const mVisitors = moderator.getVisitors();

        await visitor.driver.waitUntil(async () => vVisitors.isVisitorsQueueUIShown(), {
            timeout: 5000,
            timeoutMsg: 'Missing visitors queue UI'
        });

        await moderator.driver.waitUntil(async () => await mVisitors.getWaitingVisitorsInQueue()
                === 'Viewers waiting in queue: 1', {
            timeout: 15000,
            timeoutMsg: 'Missing visitors queue count in UI'
        });

        await mVisitors.goLive();

        await visitor.waitToJoinMUC();
        await visitor.waitForReceiveMedia(15000, 'Visitor is not receiving media');
        await visitor.waitForRemoteStreams(1);

        await visitor.driver.waitUntil(() => vVisitors.hasVisitorsDialog(), {
            timeout: 5000,
            timeoutMsg: 'Missing visitors dialog'
        });

        expect((await mVisitors.getVisitorsCount()).trim()).toBe('1');
        expect((await mVisitors.getVisitorsHeaderFromParticipantsPane()).trim()).toBe('Viewers 1');
    });
});
