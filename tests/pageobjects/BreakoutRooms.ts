import { Participant } from '../helpers/Participant';

import BaseDialog from './BaseDialog';
import BasePageObject from './BasePageObject';

const BREAKOUT_ROOMS_CLASS = 'breakout-room-container';
const ADD_BREAKOUT_ROOM = 'Add breakout room';
const MORE_LABEL = 'More';
const LEAVE_ROOM_LABEL = 'Leave breakout room';
const AUTO_ASSIGN_LABEL = 'Auto assign to breakout rooms';

/**
 * Represents a single breakout room and the operations for it.
 */
class BreakoutRoom extends BasePageObject {
    title: string;
    id: string;
    count: number;

    /**
     * Constructs a breakout room.
     */
    constructor(participant: Participant, title: string, id: string) {
        super(participant);

        this.title = title;
        this.id = id;

        const tMatch = title.match(/.*\((.*)\)/);

        if (tMatch) {
            this.count = parseInt(tMatch[1], 10);
        }
    }

    /**
     * Returns room name.
     */
    get name() {
        return this.title.split('(')[0].trim();
    }

    /**
     * Returns the number of participants in the room.
     */
    get participantCount() {
        return this.count;
    }

    /**
     * Collapses the breakout room.
     */
    collapse() {
        const collapseElem = this.participant.driver.$(
            `div[data-testid="${this.id}"]`);

        return collapseElem.click();
    }

    /**
     * Joins the breakout room.
     */
    async joinRoom() {
        const joinButton = this.participant.driver
            .$(`button[data-testid="join-room-${this.id}"]`);

        await joinButton.waitForClickable();
        await joinButton.click();
    }

    /**
     * Removes the breakout room.
     */
    async removeRoom() {
        await this.openContextMenu();

        const removeButton = this.participant.driver.$(`#remove-room-${this.id}`);

        await removeButton.waitForClickable();
        await removeButton.click();
    }

    /**
     * Renames the breakout room.
     */
    async renameRoom(newName: string) {
        await this.openContextMenu();

        const renameButton = this.participant.driver.$(`#rename-room-${this.id}`);

        await renameButton.click();

        const newNameInput = this.participant.driver.$('input[name="breakoutRoomName"]');

        await newNameInput.waitForStable();
        await newNameInput.setValue(newName);

        await new BaseDialog(this.participant).clickOkButton();
    }

    /**
     * Closes the breakout room.
     */
    async closeRoom() {
        await this.openContextMenu();

        const closeButton = this.participant.driver.$(`#close-room-${this.id}`);

        await closeButton.waitForClickable();
        await closeButton.click();
    }

    /**
     * Opens the context menu.
     * @private
     */
    private async openContextMenu() {
        const listItem = this.participant.driver.$(`div[data-testid="${this.id}"]`);

        await listItem.click();

        const button = listItem.$(`aria/${MORE_LABEL}`);

        await button.waitForClickable();
        await button.click();
    }
}

/**
 * All breakout rooms objects and operations.
 */
export default class BreakoutRooms extends BasePageObject {
    /**
     * Returns the number of breakout rooms.
     */
    async getRoomsCount() {
        const participantsPane = this.participant.getParticipantsPane();

        if (!await participantsPane.isOpen()) {
            await participantsPane.open();
        }

        return await this.participant.driver.$$(`.${BREAKOUT_ROOMS_CLASS}`).length;
    }

    /**
     * Adds a breakout room.
     */
    async addBreakoutRoom() {
        const participantsPane = this.participant.getParticipantsPane();

        if (!await participantsPane.isOpen()) {
            await participantsPane.open();
        }

        const addBreakoutButton = this.participant.driver.$(`aria/${ADD_BREAKOUT_ROOM}`);

        await addBreakoutButton.waitForDisplayed();
        await addBreakoutButton.click();
    }

    /**
     * Returns all breakout rooms.
     */
    async getRooms(): Promise<BreakoutRoom[]> {
        const rooms = this.participant.driver.$$(`.${BREAKOUT_ROOMS_CLASS}`);

        return rooms.map(async room => new BreakoutRoom(
                this.participant, await room.$('span').getText(), await room.getAttribute('data-testid')));
    }

    /**
     * Leave by clicking the leave button in participant pane.
     */
    async leaveBreakoutRoom() {
        const participantsPane = this.participant.getParticipantsPane();

        if (!await participantsPane.isOpen()) {
            await participantsPane.open();
        }

        const leaveButton = this.participant.driver.$(`aria/${LEAVE_ROOM_LABEL}`);

        await leaveButton.isClickable();
        await leaveButton.click();
    }

    /**
     * Auto assign participants to breakout rooms.
     */
    async autoAssignToBreakoutRooms() {
        const button = this.participant.driver.$(`aria/${AUTO_ASSIGN_LABEL}`);

        await button.waitForClickable();
        await button.click();
    }

    /**
     * Tries to send a participant to a breakout room.
     */
    async sendParticipantToBreakoutRoom(participant: Participant, roomName: string) {
        const participantsPane = this.participant.getParticipantsPane();

        await participantsPane.selectParticipant(participant);
        await participantsPane.openParticipantContextMenu(participant);

        const sendButton = this.participant.driver.$(`aria/${roomName}`);

        await sendButton.waitForClickable();
        await sendButton.click();
    }
}
