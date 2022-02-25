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
        const notification = await $('#notifications-container');
        await expect(notification).toBeDisplayed();
        const lobbyAdmitBtn = await $('[data-testid="lobby.admit"]');
        await expect(lobbyAdmitBtn).toBeDisplayed();
        const lobbyRejectBtn = await $('[data-testid="lobby.reject"]');
        await expect(lobbyRejectBtn).toBeDisplayed();
        await lobbyRejectBtn.click();
        await browser.switchToWindow(handles[1]);
        const rejectNotification = await $('#notifications-container');
        await expect(rejectNotification).toBeDisplayed();
        const rejectedMessage = await $('[data-testid="lobby.joinRejectedMessage"]');
        await expect(rejectedMessage).toBeDisplayed();
        await browser.deleteSession();
    });
});
