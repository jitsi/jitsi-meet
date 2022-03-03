const LobbyNotification = require("../page-objects/notifications/LobbyNotification");
const LobbyRejectNotification = require("../page-objects/notifications/LobbyRejectNotification");
import openSession from "../helpers/lobbyHelper"
import { BASE_URL } from "../helpers/constants"

describe('Activate lobby and reject participant', () => {
    it('should open jitsi-meet app, enable lobby and reject participant', async () => {
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
        await lobbyRejectBtn.click();
        await browser.switchToWindow(handles[1]);
        const rejectNotification = await LobbyNotification.Notification;
        await expect(rejectNotification).toBeDisplayed();
        const rejectedMessage = await LobbyRejectNotification.Notification;
        await expect(rejectedMessage).toBeDisplayed();
        await browser.deleteSession();
    });
});
