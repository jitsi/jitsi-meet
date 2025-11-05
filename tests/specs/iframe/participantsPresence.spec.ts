import { isEqual } from 'lodash-es';

import { P1, P2 } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants, parseJid } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Participants presence', () => {
    it('joining the meeting', async () => {
        await ensureTwoParticipants({}, { name: 'p1', iFrameApi: true });

        const { p1, p2 } = ctx;

        if (await p1.execute(() => config.disableIframeAPI)) {
            ctx.skipSuiteTests = 'The environment has the iFrame API disabled.';

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

    it('participants info',
        async () => {
            const { p1, roomName } = ctx;
            const roomsInfo = (await p1.getIframeAPI().getRoomsInfo()).rooms[0];

            expect(roomsInfo).toBeDefined();
            expect(roomsInfo.isMainRoom).toBe(true);

            expect(roomsInfo.id).toBeDefined();
            const { node: roomNode } = parseJid(roomsInfo.id);

            expect(roomNode).toBe(roomName);

            const { node, resource } = parseJid(roomsInfo.jid);
            const p1EpId = await p1.getEndpointId();

            expect(node).toBe(roomName);
            expect(resource).toBe(p1EpId);

            expect(roomsInfo.participants.length).toBe(2);
            expect(await p1.getIframeAPI().getNumberOfParticipants()).toBe(2);
        }
    );

    it('participants pane', async () => {
        const { p1 } = ctx;

        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(false);

        await p1.getIframeAPI().addEventListener('participantsPaneToggled');
        await p1.getIframeAPI().executeCommand('toggleParticipantsPane', true);

        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(true);
        expect((await p1.getIframeAPI().getEventResult('participantsPaneToggled'))?.open).toBe(true);

        await p1.getIframeAPI().executeCommand('toggleParticipantsPane', false);
        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(false);
        expect((await p1.getIframeAPI().getEventResult('participantsPaneToggled'))?.open).toBe(false);
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
        await p1.getIframeAPI().addEventListener('participantMenuButtonClick');

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

    it('overwrite names', async () => {
        const { p1, p2 } = ctx;

        const p1EpId = await p1.getEndpointId();
        const p2EpId = await p2.getEndpointId();

        const newP1Name = P1;
        const newP2Name = P2;
        const newNames: ({ id: string; name: string; })[] = [ {
            id: p2EpId,
            name: newP2Name
        }, {
            id: p1EpId,
            name: newP1Name
        } ];

        await p1.getIframeAPI().executeCommand('overwriteNames', newNames);

        await p1.switchToIFrame();

        expect(await p1.getLocalDisplayName()).toBe(newP1Name);

        expect(await p1.getFilmstrip().getRemoteDisplayName(p2EpId)).toBe(newP2Name);

    });

    it('hangup', async () => {
        const { p1, p2, roomName } = ctx;

        await p1.switchToMainFrame();
        await p2.switchToMainFrame();

        await p2.getIframeAPI().clearEventResults('videoConferenceLeft');
        await p2.getIframeAPI().addEventListener('videoConferenceLeft');
        await p2.getIframeAPI().addEventListener('readyToClose');

        await p2.getIframeAPI().executeCommand('hangup');

        const eventConferenceLeftP2 = await p2.driver.waitUntil(() =>
            p2.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 4000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeftP2).toBeDefined();
        expect(eventConferenceLeftP2.roomName).toBe(roomName);

        const eventReadyToCloseP2 = await p2.driver.waitUntil(() => p2.getIframeAPI().getEventResult('readyToClose'), {
            timeout: 2000,
            timeoutMsg: 'readyToClose not received'
        });

        expect(eventReadyToCloseP2).toBeDefined();
    });

    it('dispose conference', async () => {
        const { p1, roomName } = ctx;

        await p1.switchToMainFrame();

        await p1.getIframeAPI().clearEventResults('videoConferenceLeft');
        await p1.getIframeAPI().addEventListener('videoConferenceLeft');
        await p1.getIframeAPI().addEventListener('readyToClose');

        await p1.getIframeAPI().executeCommand('hangup');

        const eventConferenceLeft = await p1.driver.waitUntil(() =>
            p1.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 4000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeft).toBeDefined();
        expect(eventConferenceLeft.roomName).toBe(roomName);

        const eventReadyToClose = await p1.driver.waitUntil(() => p1.getIframeAPI().getEventResult('readyToClose'), {
            timeout: 2000,
            timeoutMsg: 'readyToClose not received'
        });

        expect(eventReadyToClose).toBeDefined();

        // dispose
        await p1.getIframeAPI().dispose();

        // check there is no iframe on the page
        await p1.driver.$('iframe').waitForExist({
            reverse: true,
            timeout: 2000,
            timeoutMsg: 'iframe is still on the page'
        });
    });
});
