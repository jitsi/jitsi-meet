/* eslint-disable no-undef */

import {
    ENTER_KEY,
    FIRST_PARTICIPANT,
    SECOND_PARTICIPANT,
    THIRD_PARTICIPANT
} from '../helpers/constants';
import createBrowserSession from '../helpers/createBrowserSession';
import createMeetingUrl from '../helpers/createMeetingUrl';

const ParticipantsPane = require('../page-objects/ParticipantsPane');
const PrejoinScreen = require('../page-objects/PrejoinScreen');
const SecurityDialog = require('../page-objects/SecurityDialog');
const Toolbox = require('../page-objects/Toolbox');
const LobbyNotification = require('../page-objects/notifications/LobbyNotification');

describe('Open jitsimeet app, enable lobby and view lobby', () => {
    let meetingUrl;
    let Participant1;
    let Participant2;
    let Participant3;

    before(async () => {
        meetingUrl = await createMeetingUrl();
        Participant1 = await createBrowserSession(FIRST_PARTICIPANT);
        await Participant1.url(meetingUrl);
        Participant2 = await createBrowserSession(SECOND_PARTICIPANT);
        await Participant2.url(meetingUrl);
        Participant3 = await createBrowserSession(THIRD_PARTICIPANT);
        await Participant3.url(meetingUrl);
    });

    it('should open jitsi-meet app and enable lobby by first participant', async () => {
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
    it('second participant should ask to join the meeting', async () => {
        const prejoinScreen = await new PrejoinScreen(Participant2);
        const prejoinTextInput = await prejoinScreen.PrejoinInput;

        await prejoinTextInput.setValue(SECOND_PARTICIPANT);
        await Participant2.keys(ENTER_KEY);
    });
    it('third participant should ask to join the meeting', async () => {
        const prejoinScreen = await new PrejoinScreen(Participant3);
        const prejoinTextInput = await prejoinScreen.PrejoinInput;

        await prejoinTextInput.setValue(THIRD_PARTICIPANT);
        await Participant3.keys(ENTER_KEY);
    });
    it('Moderator should press the view button from lobby notification', async () => {

        const lobbyNotification = new LobbyNotification(Participant1);
        const notification = await lobbyNotification.Notification;

        await expect(notification).toBeDisplayed();
        const viewLobbyBtn = await lobbyNotification.ViewLobby;

        await expect(viewLobbyBtn).toBeDisplayed();
        await viewLobbyBtn.click();
        const participantsPane = await new ParticipantsPane(Participant1);

        await expect(participantsPane.ParticipantsPaneView).toBeDisplayed();
        await Participant1 && Participant1.deleteSession();
        await Participant2 && Participant2.deleteSession();
        await Participant3 && Participant3.deleteSession();
    });

    after(async () => {
        // await Participant1.deleteSession();
        // await Participant2.deleteSession();
        // await Participant3.deleteSession();
        // await Participant1.closeWindow();
        // await Participant2.closeWindow();
        // await Participant3.closeWindow()
    });
});
