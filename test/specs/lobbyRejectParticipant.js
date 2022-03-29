/* eslint-disable no-undef */

import {
    ENTER_KEY,
    FIRST_PARTICIPANT,
    SECOND_PARTICIPANT
} from '../helpers/constants';
import createBrowserSession from '../helpers/createBrowserSession';
import createMeetingUrl from '../helpers/createMeetingUrl';

const PrejoinScreen = require('../page-objects/PrejoinScreen');
const SecurityDialog = require('../page-objects/SecurityDialog');
const Toolbox = require('../page-objects/Toolbox');
const LobbyNotification = require('../page-objects/notifications/LobbyNotification');
const LobbyRejectNotification = require('../page-objects/notifications/LobbyRejectNotification');

describe('Activate lobby and reject participant', () => {
    let meetingUrl;
    let Participant1;
    let Participant2;

    before(async () => {
        meetingUrl = await createMeetingUrl();
        Participant1 = await createBrowserSession(FIRST_PARTICIPANT);
        await Participant1.url(meetingUrl);
        Participant2 = await createBrowserSession(SECOND_PARTICIPANT);
        await Participant2.url(meetingUrl);
    });

    it('should open jitsi-meet app and enable lobby', async () => {
        const prejoinScreen = await new PrejoinScreen(Participant1);
        const prejoinTextInput = await prejoinScreen.PrejoinInput;

        await prejoinTextInput.setValue(FIRST_PARTICIPANT);
        const prejoinButton = await prejoinScreen.PrejoinButton;

        await prejoinButton.click();
        const toolboxOptions = await new Toolbox(Participant1);
        const toolbox = await toolboxOptions.ToolboxView;

        await expect(toolbox).toBeDisplayed();
        const toolbarSecurityOption = await toolboxOptions.MoreActionOption;

        await expect(toolbarSecurityOption).toBeDisplayed();
        await toolbarSecurityOption.click();
        const overflowMenu = await toolboxOptions.OverflowMenu;

        await expect(overflowMenu).toBeDisplayed();
        const securityOptionsButton = await toolboxOptions.SecurityOptionButton;

        await expect(securityOptionsButton).toBeDisplayed();
        await securityOptionsButton.click();

        const securityDialogView = await new SecurityDialog(Participant1);
        const securityDialog = await securityDialogView.SecurityDialogView;

        await expect(securityDialog).toBeDisplayed();
        const lobbySwitch = await securityDialogView.LobbySwitch;

        await expect(lobbySwitch).toBeDisplayed();
        await lobbySwitch.click();
        const lobbyEnabled = await securityDialogView.LobbyEnabled;

        await expect(lobbyEnabled).toBeDisplayed();
        const securityDialogCloseButton = await securityDialogView.SecurityDialogCloseButton;

        await expect(securityDialogCloseButton).toBeDisplayed();
        await securityDialogCloseButton.click();
    });
    it('should open jitsi-meet with same room name where second participant wants to join', async () => {
        const prejoinScreen = await new PrejoinScreen(Participant2);
        const prejoinTextInput = await prejoinScreen.PrejoinInput;

        await prejoinTextInput.setValue(SECOND_PARTICIPANT);
        await Participant2.keys(ENTER_KEY);
    });
    it('Moderator should reject the user that wants to join the meeting', async () => {
        const lobbyNotification = new LobbyNotification(Participant1);
        const notification = await lobbyNotification.Notification;

        await expect(notification).toBeDisplayed();
        const lobbyAdmitBtn = await lobbyNotification.AdmitLobby;

        await expect(lobbyAdmitBtn).toBeDisplayed();
        const lobbyRejectBtn = await lobbyNotification.RejectLobby;

        await expect(lobbyRejectBtn).toBeDisplayed();
        await lobbyRejectBtn.click();
        const rejectNotification = await new LobbyNotification(Participant2);

        await expect(rejectNotification.Notification).toBeDisplayed();

        const rejectedMessage = await new LobbyRejectNotification(Participant2);

        await expect(rejectedMessage.Notification).toBeDisplayed();
        await Participant1.deleteSession();
        await Participant2.deleteSession();
    });

    after(async () => {
        // await Participant1.deleteSession();
        // await Participant2.deleteSession();
        // await Participant1.closeWindow();
        // await Participant2.closeWindow();
    });
});
