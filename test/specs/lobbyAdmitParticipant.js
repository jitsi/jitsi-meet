const LobbyNotification = require("../page-objects/notifications/LobbyNotification");
import openSession from "../helpers/lobbyHelper"
import { BASE_URL } from "../helpers/constants"

import openParticipantsPane from "../helpers/openParticipantsPane"

describe('Activate lobby and admit participant', () => {
    it('should open jitsi-meet app, enable lobby and admit participant', async () => {
        let roomName;
        const capabilities = await browser.requestedCapabilities;
        switch (capabilities.browserName) {
            case 'chrome':
                roomName = 'ChromeRoomNameTest'
                break;
            case 'firefox':
                roomName = 'FirefoxRoomNameTest'
                break;
            default:
                roomName = 'SafariRoomNameTest'
        }
        await openSession({
            moderator: true,
            name: 'Participant 1',
            url: BASE_URL,
            roomName
        });
        await openSession({
            moderator: false,
            name: 'Participant 2',
            url: BASE_URL,
            roomName
        });

        const handles = await browser.getWindowHandles()

        await browser.switchToWindow(handles[0]);
        const notification = await LobbyNotification.Notification;
        await expect(notification).toBeDisplayed();
        const lobbyAdmitBtn = await LobbyNotification.AdmitLobby;
        await expect(lobbyAdmitBtn).toBeDisplayed();
        const lobbyRejectBtn = await LobbyNotification.RejectLobby;
        await expect(lobbyRejectBtn).toBeDisplayed();
        await lobbyAdmitBtn.click();
        await openParticipantsPane();
        await browser.deleteSession();
    });
});
