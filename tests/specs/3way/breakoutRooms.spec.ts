import type { ChainablePromiseElement } from 'webdriverio';

import type { Participant } from '../../helpers/Participant';
import {
    checkSubject,
    ensureThreeParticipants,
    ensureTwoParticipants,
    hangupAllParticipants
} from '../../helpers/participants';

const MAIN_ROOM_NAME = 'Main room';
const BREAKOUT_ROOMS_LIST_ID = 'breakout-rooms-list';
const LIST_ITEM_CONTAINER = 'list-item-container';

describe('BreakoutRooms', () => {
    it('check support', async () => {
        await ensureTwoParticipants(ctx);

        if (!await ctx.p1.isBreakoutRoomsSupported()) {
            ctx.skipSuiteTests = true;
        }
    });

    it('add breakout room', async () => {
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // there should be no breakout rooms initially, list is sent with a small delay
        await p1.driver.pause(2000);
        expect(await p1BreakoutRooms.getRoomsCount()).toBe(0);

        // add one breakout room
        await p1BreakoutRooms.addBreakoutRoom();

        await p1.driver.waitUntil(
            async () => await p1BreakoutRooms.getRoomsCount() === 1, {
                timeout: 3000,
                timeoutMsg: 'No breakout room added for p1'
            });


        // second participant should also see one breakout room
        await p2.driver.waitUntil(
            async () => await p2.getBreakoutRooms().getRoomsCount() === 1, {
                timeout: 3000,
                timeoutMsg: 'No breakout room seen by p2'
            });
    });

    it('join breakout room', async () => {
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // there should be one breakout room
        await p1.driver.waitUntil(
            async () => await p1BreakoutRooms.getRoomsCount() === 1, {
                timeout: 3000,
                timeoutMsg: 'No breakout room seen by p1'
            });

        const roomsList = await p1BreakoutRooms.getRooms();

        expect(roomsList.length).toBe(1);

        // join the room
        await roomsList[0].joinRoom();

        // the participant should see the main room as the only breakout room
        await p1.driver.waitUntil(
            async () => {
                if (await p1BreakoutRooms.getRoomsCount() !== 1) {
                    return false;
                }

                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].name === MAIN_ROOM_NAME;
            }, {
                timeout: 5000,
                timeoutMsg: 'P1 did not join breakout room'
            });

        // the second participant should see one participant in the breakout room
        await p2.driver.waitUntil(
            async () => {
                const list = await p2.getBreakoutRooms().getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].participantCount === 1;
            }, {
                timeout: 3000,
                timeoutMsg: 'P2 is not seeing p1 in the breakout room'
            });
    });

    it('leave breakout room', async () => {
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // leave room
        await p1BreakoutRooms.leaveBreakoutRoom();

        // there should be one breakout room and that should not be the main room
        await p1.driver.waitUntil(
            async () => {
                if (await p1BreakoutRooms.getRoomsCount() !== 1) {
                    return false;
                }

                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].name !== MAIN_ROOM_NAME;
            }, {
                timeout: 5000,
                timeoutMsg: 'P1 did not leave breakout room'
            });

        // the second participant should see no participants in the breakout room
        await p2.driver.waitUntil(
            async () => {
                const list = await p2.getBreakoutRooms().getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].participantCount === 0;
            }, {
                timeout: 3000,
                timeoutMsg: 'P2 is seeing p1 in the breakout room'
            });
    });

    it('remove breakout room', async () => {
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // remove the room
        await (await p1BreakoutRooms.getRooms())[0].removeRoom();

        // there should be no breakout rooms
        await p1.driver.waitUntil(
            async () => await p1BreakoutRooms.getRoomsCount() === 0, {
                timeout: 3000,
                timeoutMsg: 'Breakout room was not removed for p1'
            });

        // the second participant should also see no breakout rooms
        await p2.driver.waitUntil(
            async () => await p2.getBreakoutRooms().getRoomsCount() === 0, {
                timeout: 3000,
                timeoutMsg: 'Breakout room was not removed for p2'
            });
    });

    it('auto assign', async () => {
        await ensureThreeParticipants(ctx);
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // create two rooms
        await p1BreakoutRooms.addBreakoutRoom();
        await p1BreakoutRooms.addBreakoutRoom();

        // there should be two breakout rooms
        await p1.driver.waitUntil(
            async () => await p1BreakoutRooms.getRoomsCount() === 2, {
                timeout: 3000,
                timeoutMsg: 'Breakout room was not created by p1'
            });

        // auto assign participants to rooms
        await p1BreakoutRooms.autoAssignToBreakoutRooms();

        // each room should have one participant
        await p1.driver.waitUntil(
            async () => {
                if (await p1BreakoutRooms.getRoomsCount() !== 2) {
                    return false;
                }

                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 2) {
                    return false;
                }

                return list[0].participantCount === 1 && list[1].participantCount === 1;
            }, {
                timeout: 5000,
                timeoutMsg: 'P1 did not auto assigned participants to breakout rooms'
            });

        // the second participant should see one participant in the main room
        const p2BreakoutRooms = p2.getBreakoutRooms();

        await p2.driver.waitUntil(
            async () => {
                if (await p2BreakoutRooms.getRoomsCount() !== 2) {
                    return false;
                }

                const list = await p2BreakoutRooms.getRooms();

                if (list?.length !== 2) {
                    return false;
                }

                return list[0].participantCount === 1 && list[1].participantCount === 1
                    && (list[0].name === MAIN_ROOM_NAME || list[1].name === MAIN_ROOM_NAME);
            }, {
                timeout: 3000,
                timeoutMsg: 'P2 is not seeing p1 in the main room'
            });
    });

    it('close breakout room', async () => {
        const { p1, p2, p3 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // there should be two non-empty breakout rooms
        await p1.driver.waitUntil(
            async () => {
                if (await p1BreakoutRooms.getRoomsCount() !== 2) {
                    return false;
                }

                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 2) {
                    return false;
                }

                return list[0].participantCount === 1 && list[1].participantCount === 1;
            }, {
                timeout: 3000,
                timeoutMsg: 'P1 is not seeing two breakout rooms'
            });

        // close the first room
        await (await p1BreakoutRooms.getRooms())[0].closeRoom();

        // there should be two rooms and first one should be empty
        await p1.driver.waitUntil(
            async () => {
                if (await p1BreakoutRooms.getRoomsCount() !== 2) {
                    return false;
                }

                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 2) {
                    return false;
                }

                return list[0].participantCount === 0 || list[1].participantCount === 0;
            }, {
                timeout: 5000,
                timeoutMsg: 'P1 is not seeing an empty breakout room'
            });

        // there should be two participants in the main room, either p2 or p3 got moved to the main room
        const checkParticipants = (p: Participant) =>
            p.driver.waitUntil(
                async () => {
                    const isInBreakoutRoom = await p.isInBreakoutRoom();
                    const breakoutRooms = p.getBreakoutRooms();

                    if (isInBreakoutRoom) {
                        if (await breakoutRooms.getRoomsCount() !== 2) {
                            return false;
                        }

                        const list = await breakoutRooms.getRooms();

                        if (list?.length !== 2) {
                            return false;
                        }

                        return list.every(r => { // eslint-disable-line arrow-body-style
                            return r.name === MAIN_ROOM_NAME ? r.participantCount === 2 : r.participantCount === 0;
                        });
                    }

                    if (await breakoutRooms.getRoomsCount() !== 2) {
                        return false;
                    }

                    const list = await breakoutRooms.getRooms();

                    if (list?.length !== 2) {
                        return false;
                    }

                    return list[0].participantCount + list[1].participantCount === 1;
                }, {
                    timeout: 3000,
                    timeoutMsg: `${p.name} is not seeing an empty breakout room and one with one participant`
                });

        await checkParticipants(p2);
        await checkParticipants(p3);
    });

    it('send participants to breakout room', async () => {
        await hangupAllParticipants();

        // because the participants rejoin so fast, the meeting is not properly ended,
        // so the previous breakout rooms would still be there.
        // To avoid this issue we use a different meeting
        ctx.roomName += '-breakout-rooms';

        await ensureTwoParticipants(ctx);
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // there should be no breakout rooms
        expect(await p1BreakoutRooms.getRoomsCount()).toBe(0);

        // add one breakout room
        await p1BreakoutRooms.addBreakoutRoom();

        // there should be one empty room
        await p1.driver.waitUntil(
            async () => await p1BreakoutRooms.getRoomsCount() === 1
                && (await p1BreakoutRooms.getRooms())[0].participantCount === 0, {
                timeout: 3000,
                timeoutMsg: 'No breakout room added for p1'
            });

        // send the second participant to the first breakout room
        await p1BreakoutRooms.sendParticipantToBreakoutRoom(p2, (await p1BreakoutRooms.getRooms())[0].name);

        // there should be one room with one participant
        await p1.driver.waitUntil(
            async () => {
                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].participantCount === 1;
            }, {
                timeout: 5000,
                timeoutMsg: 'P1 is not seeing p2 in the breakout room'
            });
    });

    it('collapse breakout room', async () => {
        const { p1 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // there should be one breakout room with one participant
        await p1.driver.waitUntil(
            async () => {
                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].participantCount === 1;
            }, {
                timeout: 3000,
                timeoutMsg: 'P1 is not seeing p2 in the breakout room'
            });

        // get id of the breakout room participant
        const breakoutList = p1.driver.$(`#${BREAKOUT_ROOMS_LIST_ID}`);
        const breakoutRoomItem = await breakoutList.$$(`.${LIST_ITEM_CONTAINER}`).find(
            async el => {
                const id = await el.getAttribute('id');

                return id !== '' && id !== null;
            }) as ChainablePromiseElement;

        const pId = await breakoutRoomItem.getAttribute('id');
        const breakoutParticipant = p1.driver.$(`//div[@id="${pId}"]`);

        expect(await breakoutParticipant.isDisplayed()).toBe(true);

        // collapse the first
        await (await p1BreakoutRooms.getRooms())[0].collapse();

        // the participant should not be visible
        expect(await breakoutParticipant.isDisplayed()).toBe(false);

        // the collapsed room should still have one participant
        expect((await p1BreakoutRooms.getRooms())[0].participantCount).toBe(1);
    });

    it('rename breakout room', async () => {
        const myNewRoomName = `breakout-${crypto.randomUUID()}`;
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // let's rename breakout room and see it in local and remote
        await (await p1BreakoutRooms.getRooms())[0].renameRoom(myNewRoomName);

        await p1.driver.waitUntil(
            async () => {
                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].name === myNewRoomName;
            }, {
                timeout: 3000,
                timeoutMsg: 'The breakout room was not renamed for p1'
            });

        await checkSubject(p2, myNewRoomName);

        const p2BreakoutRooms = p2.getBreakoutRooms();

        // leave room
        await p2BreakoutRooms.leaveBreakoutRoom();

        // there should be one empty room
        await p1.driver.waitUntil(
            async () => {
                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].participantCount === 0;
            }, {
                timeout: 3000,
                timeoutMsg: 'The breakout room not found or not empty for p1'
            });

        await p2.driver.waitUntil(
            async () => {
                const list = await p2BreakoutRooms.getRooms();

                return list?.length === 1;
            }, {
                timeout: 3000,
                timeoutMsg: 'The breakout room not seen by p2'
            });

        expect((await p2BreakoutRooms.getRooms())[0].name).toBe(myNewRoomName);

        // send the second participant to the first breakout room
        await p1BreakoutRooms.sendParticipantToBreakoutRoom(p2, myNewRoomName);

        // there should be one room with one participant
        await p1.driver.waitUntil(
            async () => {
                const list = await p1BreakoutRooms.getRooms();

                if (list?.length !== 1) {
                    return false;
                }

                return list[0].participantCount === 1;
            }, {
                timeout: 5000,
                timeoutMsg: 'The breakout room was not rename for p1'
            });

        await checkSubject(p2, myNewRoomName);
    });
});
