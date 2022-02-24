
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
        const notification = await $('#notifications-container');
        await expect(notification).toBeDisplayed();
        const lobbyAdmitBtn = await $('[data-testid="lobby.admit"]');
        await expect(lobbyAdmitBtn).toBeDisplayed();
        const lobbyRejectBtn = await $('[data-testid="lobby.reject"]');
        await expect(lobbyRejectBtn).toBeDisplayed();
        await openSession({
            moderator: false,
            name: 'Participant 3',
            url: BASE_URL,
            roomName: 'RoomNameTest'
        });
        await browser.switchToWindow(handles[0]);
        const viewLobbyNotification = await $('#notifications-container');
        await expect(viewLobbyNotification).toBeDisplayed();
        const viewLobbyBtn = await $('[data-testid="notify.viewLobby"]');
        await expect(viewLobbyBtn).toBeDisplayed();
        await viewLobbyBtn.click();
        const participantsPane = await $('.participants_pane')
        await expect(participantsPane).toBeDisplayed();
        await browser.deleteSession();
    });
});


