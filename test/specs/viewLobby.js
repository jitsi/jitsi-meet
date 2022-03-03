const LobbyNotification = require("../page-objects/notifications/LobbyNotification");
const ParticipantsPane = require("../page-objects/ParticipantsPane")
import openSession from "../helpers/lobbyHelper"
import { BASE_URL } from "../helpers/constants"

describe('Open jitsimeet app, enable lobby and view lobby', () => {
    it('should open jitsimeet app, enable lobby and view lobby', async () => {
        await openSession({
            moderator: true,
            name: 'Participant 1',
            url: BASE_URL,
            roomName: 'RoomNameTest'
        });
        await openSession({
            moderator: false,
            name: 'Participant 2',
            url: BASE_URL,
            roomName: 'RoomNameTest'
        });

        const handles = await browser.getWindowHandles()

        await browser.switchToWindow(handles[0]);
        const notification = await LobbyNotification.Notification;
        await expect(notification).toBeDisplayed();
        const lobbyAdmitBtn = await LobbyNotification.AdmitLobby;
        await expect(lobbyAdmitBtn).toBeDisplayed();
        const lobbyRejectBtn = await LobbyNotification.RejectLobby;
        await expect(lobbyRejectBtn).toBeDisplayed();
        await openSession({
            moderator: false,
            name: 'Participant 3',
            url: BASE_URL,
            roomName: 'RoomNameTest'
        });
        await browser.switchToWindow(handles[0]);
        const viewLobbyNotification = await LobbyNotification.Notification;
        await expect(viewLobbyNotification).toBeDisplayed();
        const viewLobbyBtn = await LobbyNotification.ViewLobby;
        await expect(viewLobbyBtn).toBeDisplayed();
        await viewLobbyBtn.click();
        const participantsPane = await ParticipantsPane.ParticipantsPaneView
        await expect(participantsPane).toBeDisplayed();
        await browser.deleteSession();
    });
});
