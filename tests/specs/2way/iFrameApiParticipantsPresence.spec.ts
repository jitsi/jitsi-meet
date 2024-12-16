import { isEqual } from 'lodash-es';

import type { Participant } from '../../helpers/Participant';
import { ensureTwoParticipants, parseJid } from '../../helpers/participants';

/**
 * Tests PARTICIPANT_LEFT webhook.
 */
async function checkParticipantLeftHook(p: Participant, reason: string) {
    const { webhooksProxy } = ctx;

    if (webhooksProxy) {
        // PARTICIPANT_LEFT webhook
        // @ts-ignore
        const event: {
            data: {
                conference: string;
                disconnectReason: string;
                isBreakout: boolean;
                participantId: string;
            };
            eventType: string;
        } = await webhooksProxy.waitForEvent('PARTICIPANT_LEFT');

        expect('PARTICIPANT_LEFT').toBe(event.eventType);
        expect(event.data.conference).toBe(ctx.conferenceJid);
        expect(event.data.disconnectReason).toBe(reason);
        expect(event.data.isBreakout).toBe(false);
        expect(event.data.participantId).toBe(await p.getEndpointId());
    }
}

describe('Participants presence - ', () => {
    it('joining the meeting', async () => {
        // ensure 2 participants one moderator and one guest, we will load both with iframeAPI
        await ensureTwoParticipants(ctx);

        const { p1, p2, webhooksProxy } = ctx;

        // let's populate endpoint ids
        await Promise.all([
            p1.getEndpointId(),
            p2.getEndpointId()
        ]);

        await p1.switchToAPI();
        await p2.switchToAPI();

        expect(await p1.getIframeAPI().getEventResult('isModerator')).toBe(true);
        expect(await p2.getIframeAPI().getEventResult('isModerator')).toBe(false);

        expect(await p1.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();
        expect(await p2.getIframeAPI().getEventResult('videoConferenceJoined')).toBeDefined();

        if (webhooksProxy) {
            // USAGE webhook
            // @ts-ignore
            const event: {
                data: [
                    { participantId: string; }
                ];
                eventType: string;
            } = await webhooksProxy.waitForEvent('USAGE');

            expect('USAGE').toBe(event.eventType);

            const p1EpId = await p1.getEndpointId();
            const p2EpId = await p2.getEndpointId();

            expect(event.data.filter(d => d.participantId === p1EpId
                || d.participantId === p2EpId).length).toBe(2);
        }

        // we will use it later
        // TODO figure out why adding those just before grantModerator and we miss the events
        await p1.getIframeAPI().addEventListener('participantRoleChanged');
        await p2.getIframeAPI().addEventListener('participantRoleChanged');
    });

    it('participants info',
        async () => {
            const { p1, roomName, webhooksProxy } = ctx;
            const roomsInfo = (await p1.getIframeAPI().getRoomsInfo()).rooms[0];

            expect(roomsInfo).toBeDefined();
            expect(roomsInfo.isMainRoom).toBe(true);

            expect(roomsInfo.id).toBeDefined();
            const { node: roomNode } = parseJid(roomsInfo.id);

            expect(roomNode).toBe(roomName);

            const { node, resource } = parseJid(roomsInfo.jid);

            ctx.conferenceJid = roomsInfo.jid.substring(0, roomsInfo.jid.indexOf('/'));

            const p1EpId = await p1.getEndpointId();

            expect(node).toBe(roomName);
            expect(resource).toBe(p1EpId);

            expect(roomsInfo.participants.length).toBe(2);
            expect(await p1.getIframeAPI().getNumberOfParticipants()).toBe(2);

            if (webhooksProxy) {
                // ROOM_CREATED webhook
                // @ts-ignore
                const event: {
                    data: {
                        conference: string;
                        isBreakout: boolean;
                    };
                    eventType: string;
                } = await webhooksProxy.waitForEvent('ROOM_CREATED');

                expect('ROOM_CREATED').toBe(event.eventType);
                expect(event.data.conference).toBe(ctx.conferenceJid);
                expect(event.data.isBreakout).toBe(false);
            }
        }
    );

    it('participants pane', async () => {
        const { p1 } = ctx;

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
        const { p1, p2, webhooksProxy } = ctx;
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

        if (webhooksProxy) {
            // ROLE_CHANGED webhook
            // @ts-ignore
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

            expect('ROLE_CHANGED').toBe(event.eventType);
            expect(event.data.role).toBe('moderator');
            expect(event.data.grantedBy.participantId).toBe(await p1.getEndpointId());
            expect(event.data.grantedTo.participantId).toBe(await p2.getEndpointId());
        }
    });

    it('kick participant', async () => {
        const { p1, p2, roomName } = ctx;
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

        await checkParticipantLeftHook(p2, 'kicked');

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

        const eventConferenceLeftP2 = await p2.driver.waitUntil(async () =>
            await p2.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 2000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeftP2).toBeDefined();
        expect(eventConferenceLeftP2.roomName).toBe(roomName);
    });

    it('join after kick', async () => {
        const { p1, webhooksProxy } = ctx;

        await p1.getIframeAPI().addEventListener('participantJoined');
        await p1.getIframeAPI().addEventListener('participantMenuButtonClick');

        webhooksProxy?.clearCache();

        // join again
        await ensureTwoParticipants(ctx);
        const { p2 } = ctx;

        if (webhooksProxy) {
            // PARTICIPANT_JOINED webhook
            // @ts-ignore
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

            expect('PARTICIPANT_JOINED').toBe(event.eventType);
            expect(event.data.conference).toBe(ctx.conferenceJid);
            expect(event.data.isBreakout).toBe(false);
            expect(event.data.moderator).toBe(false);
            expect(event.data.name).toBe(await p2.getLocalDisplayName());
            expect(event.data.participantId).toBe(await p2.getEndpointId());
        }

        await p1.switchToAPI();

        const event = await p1.driver.waitUntil(async () =>
            await p1.getIframeAPI().getEventResult('participantJoined'), {
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
        const { p1, p2, roomName } = ctx;

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
        expect(eventConferenceLeftP2.roomName).toBe(roomName);

        await checkParticipantLeftHook(p2, 'left');

        const eventReadyToCloseP2 = await p2.driver.waitUntil(async () =>
            await p2.getIframeAPI().getEventResult('readyToClose'), {
            timeout: 2000,
            timeoutMsg: 'readyToClose not received'
        });

        expect(eventReadyToCloseP2).toBeDefined();
    });

    it('dispose conference', async () => {
        const { conferenceJid, p1, roomName, webhooksProxy } = ctx;

        await p1.switchToAPI();

        await p1.getIframeAPI().addEventListener('videoConferenceLeft');
        await p1.getIframeAPI().addEventListener('readyToClose');

        await p1.getIframeAPI().executeCommand('hangup');

        const eventConferenceLeft = await p1.driver.waitUntil(async () =>
            await p1.getIframeAPI().getEventResult('videoConferenceLeft'), {
            timeout: 2000,
            timeoutMsg: 'videoConferenceLeft not received'
        });

        expect(eventConferenceLeft).toBeDefined();
        expect(eventConferenceLeft.roomName).toBe(roomName);

        await checkParticipantLeftHook(p1, 'left');
        if (webhooksProxy) {
            // ROOM_DESTROYED webhook
            // @ts-ignore
            const event: {
                data: {
                    conference: string;
                    isBreakout: boolean;
                };
                eventType: string;
            } = await webhooksProxy.waitForEvent('ROOM_DESTROYED');

            expect('ROOM_DESTROYED').toBe(event.eventType);
            expect(event.data.conference).toBe(conferenceJid);
            expect(event.data.isBreakout).toBe(false);
        }

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
