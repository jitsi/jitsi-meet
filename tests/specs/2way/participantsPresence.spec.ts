import { isEqual } from 'lodash-es';

import { ensureTwoParticipants, parseJid } from '../../helpers/participants';

describe('Participants presence - ', () => {
    it('joining the meeting', async () => {
        context.iframeAPI = true;

        // ensure 2 participants one moderator and one guest, we will load both with iframeAPI
        await ensureTwoParticipants(context);

        const { p1, p2 } = context;

        // let's populate endpoint ids
        await Promise.all([
            p1.getEndpointId(),
            p2.getEndpointId()
        ]);

        // ROOM_CREATED
        await p1.switchToAPI();
        await p2.switchToAPI();

        expect(await p1.getIframeAPI().getEventResult('isModerator'))
            .withContext('Is p1 moderator')
            .toBeTrue();
        expect(await p2.getIframeAPI().getEventResult('isModerator'))
            .withContext('Is p2 non-moderator')
            .toBeFalse();

        // ROLE_CHANGED

        expect(await p1.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();
        expect(await p2.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();

        // USAGE

        // we will use it later
        // TODO figure out why adding those just before grantModerator and we miss the events
        await p1.getIframeAPI().addEventListener('participantRoleChanged');
        await p2.getIframeAPI().addEventListener('participantRoleChanged');
    });

    it('participants info',
        async () => {
            const { p1, roomName } = context;
            const roomsInfo = (await p1.getIframeAPI().getRoomsInfo()).rooms[0];

            expect(roomsInfo).toBeDefined();
            expect(roomsInfo.isMainRoom).toBeTrue();

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
        const { p1 } = context;

        await p1.switchToAPI();

        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(false);

        await p1.getIframeAPI().addEventListener('participantsPaneToggled');
        await p1.getIframeAPI().executeCommand('toggleParticipantsPane', true);

        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(true);
        expect((await p1.getIframeAPI().getEventResult('participantsPaneToggled'))?.open).toBe(true);

        await p1.getIframeAPI().executeCommand('toggleParticipantsPane', false);
        expect(await p1.getIframeAPI().isParticipantsPaneOpen()).toBe(false);
        expect((await p1.getIframeAPI().getEventResult('participantsPaneToggled'))?.open).toBe(false);
    });

    it('grant moderator', async () => {
        const { p1, p2 } = context;
        const p2EpId = await p2.getEndpointId();

        await p1.getIframeAPI().executeCommand('grantModerator', p2EpId);

        await p2.driver.waitUntil(async () => await p2.getIframeAPI().getEventResult('isModerator'), {
            timeout: 3000,
            timeoutMsg: 'Moderator role not granted'
        });

        const event1 = await p1.getIframeAPI().getEventResult('participantRoleChanged');

        expect(event1?.id).toBe(p2EpId);
        expect(event1?.role).toBe('moderator');

        const event2 = await p2.getIframeAPI().getEventResult('participantRoleChanged');

        expect(event2?.id).toBe(p2EpId);
        expect(event2?.role).toBe('moderator');

        // ROLE_CHANGED
    });

    it('kick participant', async () => {
        const { p1, p2 } = context;
        const p1EpId = await p1.getEndpointId();
        const p2EpId = await p2.getEndpointId();

        await p1.switchInPage();
        await p2.switchInPage();

        const p1DisplayName = await p1.getLocalDisplayName();
        const p2DisplayName = await p2.getLocalDisplayName();

        await p1.switchToAPI();
        await p2.switchToAPI();

        await p1.getIframeAPI().addEventListener('participantKickedOut');
        await p2.getIframeAPI().addEventListener('participantKickedOut');
        await p2.getIframeAPI().addEventListener('videoConferenceLeft');

        await p1.getIframeAPI().executeCommand('kickParticipant', p2EpId);

        const eventP1 = await p1.driver.waitUntil(async () =>
            await p1.getIframeAPI().getEventResult('participantKickedOut'), {
            timeout: 2000,
            timeoutMsg: 'participantKickedOut event not received on participant1 side'
        });
        const eventP2 = await p2.driver.waitUntil(async () =>
            await p2.getIframeAPI().getEventResult('participantKickedOut'), {
            timeout: 2000,
            timeoutMsg: 'participantKickedOut event not received on participant2 side'
        });

        // PARTICIPANT_LEFT

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
        })).toBeTrue();

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
        })).toBeTrue();

        const eventConferenceLeftP2 = await p2.driver.waitUntil(async () =>
            await p2.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 2000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeftP2).toBeDefined();
        expect(eventConferenceLeftP2.roomName).toBe(context.roomName);
    });

    it('join after kick', async () => {
        const { p1 } = context;

        await p1.getIframeAPI().addEventListener('participantJoined');
        await p1.getIframeAPI().addEventListener('participantMenuButtonClick');

        // join again
        await ensureTwoParticipants(context);

        // PARTICIPANT_JOINED

        await p1.switchToAPI();

        const event = await p1.driver.waitUntil(async () =>
            await p1.getIframeAPI().getEventResult('participantJoined'), {
            timeout: 2000,
            timeoutMsg: 'participantJoined not received'
        });

        const { p2 } = context;
        const p2DisplayName = await p2.getLocalDisplayName();

        expect(event).toBeDefined();
        expect(event.id).toBe(await p2.getEndpointId());
        expect(event.displayName).toBe(p2DisplayName);
        expect(event.formattedDisplayName).toBe(p2DisplayName);

    });

    it('overwrite names', async () => {
        const { p1, p2 } = context;

        const p1EpId = await p1.getEndpointId();
        const p2EpId = await p2.getEndpointId();

        const newP1Name = 'p1';
        const newP2Name = 'p2';
        const newNames: ({ id: string; name: string; })[] = [ {
            id: p2EpId,
            name: newP2Name
        }, {
            id: p1EpId,
            name: newP1Name
        } ];

        await p1.getIframeAPI().executeCommand('overwriteNames', newNames);

        await p1.switchInPage();

        expect(await p1.getLocalDisplayName()).toBe(newP1Name);

        expect(await p1.getFilmstrip().getRemoteDisplayName(p2EpId)).toBe(newP2Name);

    });

    it('hangup', async () => {
        const { p1, p2 } = context;

        await p1.switchToAPI();
        await p2.switchToAPI();

        await p2.getIframeAPI().addEventListener('videoConferenceLeft');
        await p2.getIframeAPI().addEventListener('readyToClose');

        await p2.getIframeAPI().executeCommand('hangup');

        const eventConferenceLeftP2 = await p2.driver.waitUntil(async () =>
            await p2.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 2000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeftP2).toBeDefined();
        expect(eventConferenceLeftP2.roomName).toBe(context.roomName);

        // PARTICIPANT_LEFT

        const eventReadyToCloseP2 = await p2.driver.waitUntil(async () =>
            await p2.getIframeAPI().getEventResult('readyToClose'), {
            timeout: 2000,
            timeoutMsg: 'readyToClose not received'
        });

        expect(eventReadyToCloseP2).toBeDefined();
    });

    it('dispose conference', async () => {
        const { p1 } = context;

        await p1.switchToAPI();

        await p1.getIframeAPI().addEventListener('videoConferenceLeft');
        await p1.getIframeAPI().addEventListener('readyToClose');

        await p1.getIframeAPI().executeCommand('hangup');

        // PARTICIPANT_LEFT
        // ROOM_DESTROYED

        const eventConferenceLeft = await p1.driver.waitUntil(async () =>
            await p1.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 2000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeft).toBeDefined();
        expect(eventConferenceLeft.roomName).toBe(context.roomName);

        // PARTICIPANT_LEFT

        const eventReadyToClose = await p1.driver.waitUntil(async () =>
            await p1.getIframeAPI().getEventResult('readyToClose'), {
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
