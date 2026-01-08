import { isEqual } from 'lodash-es';

import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

import { checkIframeApi } from './util';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Kick participants', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        const { p1, p2 } = ctx;

        if (!await checkIframeApi(p1)) {
            return;
        }

        await Promise.all([
            p1.switchToMainFrame(),
            p2.switchToMainFrame()
        ]);

        expect(await p1.getIframeAPI().getEventResult('isModerator')).toBe(true);

        expect(await p1.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();
        expect(await p2.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();
    });

    it('kick participant', async () => {
        await ctx.p2.getIframeAPI().clearEventResults('videoConferenceLeft');
        await ctx.p2.getIframeAPI().addEventListener('videoConferenceLeft');
        await ctx.p2.switchToMainFrame();
        await ctx.p2.getIframeAPI().executeCommand('hangup');
        await ctx.p2.driver.waitUntil(() =>
            ctx.p2.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 4000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        const { p1, p2, roomName } = ctx;

        const p1EpId = await p1.getEndpointId();
        const p2EpId = await p2.getEndpointId();

        const p1DisplayName = await p1.getLocalDisplayName();
        const p2DisplayName = await p2.getLocalDisplayName();

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p1.getIframeAPI().addEventListener('participantKickedOut');
        await p2.getIframeAPI().addEventListener('participantKickedOut');

        await p2.getIframeAPI().clearEventResults('videoConferenceLeft');
        await p2.getIframeAPI().addEventListener('videoConferenceLeft');

        await p1.getIframeAPI().executeCommand('kickParticipant', p2EpId);

        const eventP1 = await p1.driver.waitUntil(() => p1.getIframeAPI().getEventResult('participantKickedOut'), {
            timeout: 2000,
            timeoutMsg: 'participantKickedOut event not received on p1 side'
        });
        const eventP2 = await p2.driver.waitUntil(() => p2.getIframeAPI().getEventResult('participantKickedOut'), {
            timeout: 2000,
            timeoutMsg: 'participantKickedOut event not received on p2 side'
        });

        expect(eventP1).toBeDefined();
        expect(eventP2).toBeDefined();

        expect(isEqual(eventP1, {
            kicked: {
                id: p2EpId,
                local: false,
                name: p2DisplayName
            },
            kicker: {
                id: p1EpId,
                local: true,
                name: p1DisplayName
            }
        })).toBe(true);

        expect(isEqual(eventP2, {
            kicked: {
                id: 'local',
                local: true,
                name: p2DisplayName
            },
            kicker: {
                id: p1EpId,
                name: p1DisplayName
            }
        })).toBe(true);

        const eventConferenceLeftP2 = await p2.driver.waitUntil(() =>
            p2.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 4000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeftP2).toBeDefined();
        expect(eventConferenceLeftP2.roomName).toBe(roomName);
    });

    it('join after kick', async () => {
        const { p1 } = ctx;

        await p1.getIframeAPI().addEventListener('participantJoined');

        // join again
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });
        const { p2 } = ctx;

        await p1.switchToMainFrame();

        const event = await p1.driver.waitUntil(() => p1.getIframeAPI().getEventResult('participantJoined'), {
            timeout: 2000,
            timeoutMsg: 'participantJoined not received'
        });

        const p2DisplayName = await p2.getLocalDisplayName();

        expect(event).toBeDefined();
        expect(event.id).toBe(await p2.getEndpointId());
        expect(event.displayName).toBe(p2DisplayName);
        expect(event.formattedDisplayName).toBe(p2DisplayName);

    });
});
