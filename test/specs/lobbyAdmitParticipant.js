const LobbyNotification = require("../page-objects/notifications/LobbyNotification");

const Toolbox = require("../page-objects/Toolbox");
const SecurityDialog = require("../page-objects/SecurityDialog");
import {
    ENTER_KEY,
    FIRST_PARTICIPANT,
    SECOND_PARTICIPANT
} from "../helpers/constants"
import createBrowserSession from "../helpers/createBrowserSession";
import openParticipantsPane from "../helpers/openParticipantsPane";
import createMeetingUrl from "../helpers/createMeetingUrl"
import createMeetingRoom from "../helpers/createMeetingRoom";

describe('Activate lobby and admit participant', () => {
    let meetingUrl;
    let Participant;
    it('should open jitsi-meet app and enable lobby by first participant', async () => {
        meetingUrl = await createMeetingUrl();
        await createMeetingRoom(meetingUrl)
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
    it('should open jitsi-meet with same room name where second participant wants to join', async () => {

        Participant = await createBrowserSession()
        await Participant.url(meetingUrl);
        const prejoinTextInput = await Participant.$('.prejoin-input-area input');
        await prejoinTextInput.setValue(SECOND_PARTICIPANT);
        await Participant.keys(ENTER_KEY);
    });
    it('Moderator should admit the user that wants to join the meeting', async () => {
        const notification = await LobbyNotification.Notification;
        await expect(notification).toBeDisplayed();
        const lobbyAdmitBtn = await LobbyNotification.AdmitLobby;
        await expect(lobbyAdmitBtn).toBeDisplayed();
        const lobbyRejectBtn = await LobbyNotification.RejectLobby;
        await expect(lobbyRejectBtn).toBeDisplayed();
        await lobbyAdmitBtn.click();
        await openParticipantsPane();
        await browser.deleteSession();
        await Participant.deleteSession();
    });
});
