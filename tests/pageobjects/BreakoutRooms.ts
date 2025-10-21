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

        const button = listItem.$(`button[title="${MORE_LABEL}"]`);

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

        // 2025-10-21T16:28:20.737Z INFO webdriver: BIDI RESULT {"id":48,"result":{"nodes":[{"sharedId":"f.CC595D3B0EA529D11DA54EA54EC8E1A9.d.AC4B929B2F37714F6A7D1AFFBDAC2B04.e.103","type":"node","value":{"attributes":{"class":"css-169oaf-participantsPane","id":"participants-pane"},"childNodeCount":3,"localName":"div","namespaceURI":"http://www.w3.org/1999/xhtml","nodeType":1,"shadowRoot":null}}]},"type":"success"}
        //
        //
        //
        // start query 2025-10-21T16:28:28.875Z
        // end query 2025-10-21T16:28:28.875Z
        // 2025-10-21T16:28:20.738Z INFO webdriver: BIDI COMMAND script.callFunction {"functionDeclaration":"<Function1111[function anonymous(\n) {\nreturn (/* __wdio script__ */function anonymous(\n) {\nconsole.log(\"start query\", new Date().toISOString()); const res = document.querySelectorAll(`#participants-pane .breakout-room-container`).length; console.log(\"end query\",new Date().toISOString()); return res;\n}/* __wdio script end__ */).apply(this, arguments);\n} bytes] anonymous>","awaitPromise":true,"arguments":[],"target":{"context":"CC595D3B0EA529D11DA54EA54EC8E1A9"}}
        // 2025-10-21T16:28:29.080Z INFO webdriver: BIDI RESULT {"id":49,"result":{"realm":"4934028136633545550.-854534272777004590","result":{"type":"number","value":2},"type":"success"},"type":"success"}
        //
        //
        //
        //
        // 2025-10-21T16:28:29.086Z INFO webdriver: BIDI COMMAND browsingContext.locateNodes {"locator":{"type":"css","value":"#participants-pane .breakout-room-container"},"context":"CC595D3B0EA529D11DA54EA54EC8E1A9"}


// [8546:62532126:1021/140916.958361:INFO:CONSOLE:12] "start query 2025-10-21T19:09:16.958Z", source:  (12)
// [8546:62532126:1021/140916.958526:INFO:CONSOLE:12] "end query 2025-10-21T19:09:16.958Z", source:  (12)



        const st = Date.now();

        console.log(`${new Date().toISOString()} took: start query`);
        // const b = await this.participant.driver.$$(`#participants-pane .${BREAKOUT_ROOMS_CLASS}`).length;
        const b = await this.participant.driver.execute(
            'console.log("start query", new Date().toISOString()); const res = document.querySelectorAll(`#participants-pane .breakout-room-container`).length; console.log("end query",new Date().toISOString()); return res;');

        console.log(`${new Date().toISOString()} took: `, Date.now() - st, 'ms to get breakout rooms count: ', b, this.participant.name, this.participant.driver.sessionId);

        return b;
    }

    /**
     * Adds a breakout room.
     */
    async addBreakoutRoom() {
        const participantsPane = this.participant.getParticipantsPane();

        if (!await participantsPane.isOpen()) {
            await participantsPane.open();
        }

        const addBreakoutButton = this.participant.driver.$(`button=${ADD_BREAKOUT_ROOM}`);

        await addBreakoutButton.waitForDisplayed();
        await addBreakoutButton.click();
    }

    /**
     * Returns all breakout rooms.
     */
    async getRooms(): Promise<BreakoutRoom[]> {
        const st = Date.now();
        const rooms = this.participant.driver.$$(`#participants-pane .${BREAKOUT_ROOMS_CLASS}`);

        console.log('took: ', Date.now() - st, 'ms to get breakout rooms');

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

        const leaveButton = this.participant.driver.$(`button=${LEAVE_ROOM_LABEL}`);

        await leaveButton.isClickable();
        await leaveButton.click();
    }

    /**
     * Auto assign participants to breakout rooms.
     */
    async autoAssignToBreakoutRooms() {
        const button = this.participant.driver.$(`button=${AUTO_ASSIGN_LABEL}`);

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

        const sendButton = this.participant.driver.$(`button=${roomName}`);

        await sendButton.waitForClickable();
        await sendButton.click();
    }
}
