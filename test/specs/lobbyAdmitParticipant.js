import openSession from "../helpers/lobbyHelper"

import openParticipantsPane from "../helpers/openParticipantsPane"

describe('Activate lobby and admit participant', () => {
    it('should open jitsi-meet app, enable lobby and admit participant', async () => {
        let roomName;
        const capabilities = await browser.requestedCapabilities;
        switch(capabilities.browserName) {
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
            url: 'https://localhost:8080',
            roomName
        });
        await openSession({
            moderator: false,
            name: 'Participant 2',
            url: 'https://localhost:8080',
            roomName
        });

        const handles = await browser.getWindowHandles()

        await browser.switchToWindow(handles[0]);
        const notification = await $('#notifications-container');
        await expect(notification).toBeDisplayed();
        const lobbyAdmitBtn = await $('[data-testid="lobby.admit"]');
        await expect(lobbyAdmitBtn).toBeDisplayed();
        const lobbyRejectBtn = await $('[data-testid="lobby.reject"]');
        await expect(lobbyRejectBtn).toBeDisplayed();
        await lobbyAdmitBtn.click();
        await openParticipantsPane();
        await browser.deleteSession();
    });
});


