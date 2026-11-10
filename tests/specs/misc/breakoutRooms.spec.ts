import type { ChainablePromiseElement } from 'webdriverio';

import type { IMessage } from '../../../react/features/chat/types';
import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import {
    checkSubject,
    ensureThreeParticipants,
    ensureTwoParticipants,
    hangupAllParticipants
} from '../../helpers/participants';

setTestProperties(__filename, {
    retry: true,
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

const MAIN_ROOM_NAME = 'Main room';
const BREAKOUT_ROOMS_LIST_ID = 'breakout-rooms-list';
const LIST_ITEM_CONTAINER = 'list-item-container';

/**
 * Retrieves a chat message from the participant's Redux store by its message text.
 *
 * @param {Participant} participant - The participant whose store to query.
 * @param {string} text - The message text to match.
 * @returns {Promise<IMessage | undefined>}
 */
async function getChatMessage(participant: Participant, text: string): Promise<IMessage | undefined> {
    return participant.execute((msgText: string) => {
        const messages = APP.store.getState()['features/chat']?.messages || [];

        return messages.find(m => m.message === msgText);
    }, text);
}

describe('Breakout rooms', () => {
    it('check support', async () => {
        await ensureTwoParticipants();

        if (!await ctx.p1.isBreakoutRoomsSupported()) {
            ctx.skipSuiteTests = 'The environment does not support breakout rooms.';
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
                timeout: 5000,
                timeoutMsg: 'No breakout room added for p1'
            });


        // second participant should also see one breakout room
        await p2.driver.waitUntil(
            async () => await p2.getBreakoutRooms().getRoomsCount() === 1, {
                timeout: 5000,
                timeoutMsg: 'No breakout room seen by p2'
            });
    });

    it('join breakout room', async () => {
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // there should be one breakout room
        await p1.driver.waitUntil(
            async () => await p1BreakoutRooms.getRoomsCount() === 1, {
                timeout: 5000,
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
                timeout: 5000,
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
                timeout: 5000,
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
                timeout: 5000,
                timeoutMsg: 'Breakout room was not removed for p1'
            });

        // the second participant should also see no breakout rooms
        await p2.driver.waitUntil(
            async () => await p2.getBreakoutRooms().getRoomsCount() === 0, {
                timeout: 5000,
                timeoutMsg: 'Breakout room was not removed for p2'
            });
    });

    it('auto assign', async () => {
        await ensureThreeParticipants();
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();

        // create two rooms
        await p1BreakoutRooms.addBreakoutRoom();
        await p1BreakoutRooms.addBreakoutRoom();

        // there should be two breakout rooms
        await p1.driver.waitUntil(
            async () => await p1BreakoutRooms.getRoomsCount() === 2, {
                timeout: 5000,
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
                timeout: 5000,
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
                timeout: 5000,
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
                    timeout: 5000,
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
        // Respect room name suffix as it is important in multi-shard testing
        ctx.roomName += `new-${ctx.roomName}`;

        await ensureTwoParticipants();
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
                timeout: 5000,
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
                timeout: 5000,
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
                timeout: 5000,
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
                timeout: 5000,
                timeoutMsg: 'The breakout room not found or not empty for p1'
            });

        await p2.driver.waitUntil(
            async () => {
                const list = await p2BreakoutRooms.getRooms();

                return list?.length === 1;
            }, {
                timeout: 5000,
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

    it('does not mark chat messages as edited when breakout rooms are updated', async () => {
        const { p1, p2 } = ctx;
        const p1BreakoutRooms = p1.getBreakoutRooms();
        const p2BreakoutRooms = p2.getBreakoutRooms();

        // 1. Resolve target breakout room name without assuming array ordering
        const existingRooms = await p1BreakoutRooms.getRooms();

        expect(existingRooms.length).toBeGreaterThan(0);
        const breakoutRoomName = existingRooms[0].name;

        // 2. Ensure p2 is in the main room before sending the message
        if (await p2.isInBreakoutRoom()) {
            await p2BreakoutRooms.leaveBreakoutRoom();

            await p1.driver.waitUntil(
                async () => {
                    const list = await p1BreakoutRooms.getRooms();
                    const room = list.find(r => r.name === breakoutRoomName);

                    return room?.participantCount === 0;
                }, {
                    timeout: 5000,
                    timeoutMsg: 'P2 did not leave breakout room before chat test'
                });
        }

        // 3. p2 sets initial display name and sends a message while in the main room
        const initialDisplayName = `P2-Main-${Date.now()}`;

        await p2.setLocalDisplayName(initialDisplayName);

        const testMsg = `Breakout chat test ${Date.now()}`;

        await p2.getChatPanel().sendMessage(testMsg);

        // Wait for message to arrive at p1
        await p1.driver.waitUntil(
            async () => Boolean(await getChatMessage(p1, testMsg)),
            {
                timeout: 5000,
                timeoutMsg: 'Message was not received by p1'
            }
        );

        const initialMsg = await getChatMessage(p1, testMsg);

        expect(initialMsg).toBeDefined();

        if (!initialMsg) {
            throw new Error('Expected chat message was not found');
        }

        expect(initialMsg.displayName).toBe(initialDisplayName);
        expect(initialMsg.isEdited).toBeFalsy();
        expect(initialMsg.editedAt).toBeUndefined();

        // 4. Update p2's display name so that breakout room participant data has an updated name
        const updatedDisplayName = `P2-Breakout-${Date.now()}`;

        await p2.setLocalDisplayName(updatedDisplayName);

        // 5. Ensure p1 participants pane is open and send p2 to the breakout room
        if (!await p1.getParticipantsPane().isOpen()) {
            await p1.getParticipantsPane().open();
        }

        await p1BreakoutRooms.sendParticipantToBreakoutRoom(p2, breakoutRoomName);

        await p1.driver.waitUntil(
            async () => {
                const list = await p1BreakoutRooms.getRooms();
                const room = list.find(r => r.name === breakoutRoomName);

                return room?.participantCount === 1;
            }, {
                timeout: 5000,
                timeoutMsg: 'P2 was not moved to the breakout room'
            });

        // 6. Wait for breakout-room display name sync to update p1's chat store
        await p1.driver.waitUntil(async () => {
            const updatedMsg = await getChatMessage(p1, testMsg);

            return updatedMsg?.displayName === updatedDisplayName;
        }, {
            timeout: 5000,
            timeoutMsg: 'Chat message display name was not updated to breakout room name'
        });

        // 7. Verify in Redux state that message retains its unedited status
        const finalMsg = await getChatMessage(p1, testMsg);

        expect(finalMsg).toBeDefined();

        if (!finalMsg) {
            throw new Error('Expected chat message was not found');
        }

        expect(finalMsg.displayName).toBe(updatedDisplayName);
        expect(finalMsg.isEdited).toBeFalsy();
        expect(finalMsg.editedAt).toBeUndefined();
        expect(finalMsg.message).toBe(testMsg);

        // 8. Verify in the DOM: open chat panel for p1 and scope strictly to this specific message
        if (!await p1.getChatPanel().isOpen()) {
            await p1.getToolbar().clickChatButton();
        }

        const messageElem = await p1.driver.$(`[id="${finalMsg.messageId}"]`);

        await messageElem.waitForExist({ timeout: 5000 });

        const editedLabel = await messageElem.$('div*=(edited)');

        expect(await editedLabel.isExisting()).toBe(false);

        // 9. Cleanup: bring p2 back to the main room and close p1 chat panel for suite isolation
        await p2BreakoutRooms.leaveBreakoutRoom();

        if (await p1.getChatPanel().isOpen()) {
            await p1.getToolbar().clickCloseChatButton();
        }
    });
});
