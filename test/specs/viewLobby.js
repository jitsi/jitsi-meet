const LobbyNotification = require("../page-objects/notifications/LobbyNotification");
const Toolbox = require("../page-objects/Toolbox");
const ParticipantsPane = require("../page-objects/ParticipantsPane");
const SecurityDialog = require("../page-objects/SecurityDialog");
import {
    BASE_URL,
    DEFAULT_CONFIG,
    ENTER_KEY,
    FIRST_PARTICIPANT,
    SECOND_PARTICIPANT,
    THIRD_PARTICIPANT
} from "../helpers/constants"
import createFirefoxSession from "../helpers/firefoxSession";
import createChromeSession from "../helpers/chromeSession";

describe('Open jitsimeet app, enable lobby and view lobby', () => {
    let roomName;
    let capabilities;
    let Guest1;
    let Guest2;
    it('should open jitsi-meet app and enable lobby by first participant', async () => {
        capabilities = await browser.requestedCapabilities;
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
        await browser.url(`${BASE_URL}/${roomName}?${DEFAULT_CONFIG}`);
        const prejoinTextInput = await $('.prejoin-input-area input');
        await prejoinTextInput.setValue(FIRST_PARTICIPANT);
        await browser.keys(ENTER_KEY);
        const toolbox = await Toolbox.ToolboxView;
        await expect(toolbox).toBeDisplayed();
        const toolbarSecurityOption = await Toolbox.MoreActionOption;
        await expect(toolbarSecurityOption).toBeDisplayed();
        await toolbarSecurityOption.click();
        const overflowMenu = await Toolbox.OverflowMenu;
        await expect(overflowMenu).toBeDisplayed();
        const securityOptionsButton = await Toolbox.SecurityOptionButton;
        await expect(securityOptionsButton).toBeDisplayed();
        await securityOptionsButton.click();
        const securityDialog = await SecurityDialog.SecurityDialogView;
        await expect(securityDialog).toBeDisplayed();
        const lobbySwitch = await SecurityDialog.LobbySwitch;
        await expect(lobbySwitch).toBeDisplayed();
        await lobbySwitch.click();
        const lobbyEnabled = await SecurityDialog.LobbyEnabled;
        await expect(lobbyEnabled).toBeDisplayed();
        const securityDialogCloseButton = await SecurityDialog.SecurityDialogCloseButton;
        await expect(securityDialogCloseButton).toBeDisplayed();
        await securityDialogCloseButton.click();
    });
    it('second participant should ask to join the meeting', async () => {
        switch (capabilities.browserName) {
            case 'chrome':
                Guest1 = await createChromeSession()
                break;
            case 'firefox':
                Guest1 = await createFirefoxSession()
                break;
            default:
                return;
        }
        await Guest1.url(`${BASE_URL}/${roomName}?${DEFAULT_CONFIG}`);
        const prejoinTextInput = await Guest1.$('.prejoin-input-area input');
        await prejoinTextInput.setValue(SECOND_PARTICIPANT);
        await Guest1.keys(ENTER_KEY);
    });
    it('third participant should ask to join the meeting', async () => {
        switch (capabilities.browserName) {
            case 'chrome':
                Guest2 = await createChromeSession()
                break;
            case 'firefox':
                Guest2 = await createFirefoxSession()
                break;
            default:
                return;
        }
        await Guest2.url(`${BASE_URL}/${roomName}?${DEFAULT_CONFIG}`);
        const prejoinTextInput = await Guest2.$('.prejoin-input-area input');
        await prejoinTextInput.setValue(THIRD_PARTICIPANT);
        await Guest2.keys(ENTER_KEY);
    });
    it('Moderator should press the view button from lobby notification', async () => {
        const viewLobbyNotification = await LobbyNotification.Notification;
        await expect(viewLobbyNotification).toBeDisplayed();
        const viewLobbyBtn = await LobbyNotification.ViewLobby;
        await expect(viewLobbyBtn).toBeDisplayed();
        await viewLobbyBtn.click();
        const participantsPane = await ParticipantsPane.ParticipantsPaneView
        await expect(participantsPane).toBeDisplayed();
        await browser.deleteSession();
        await Guest1.deleteSession();
        await Guest2.deleteSession();
    });
});
