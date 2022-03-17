/* eslint-disable no-undef */

import {
    ENTER_KEY,
    MODERATOR,
    FIRST_PARTICIPANT,
    SECOND_PARTICIPANT
} from '../helpers/constants';
import createBrowserSession from '../helpers/createBrowserSession';
import createMeetingRoom from '../helpers/createMeetingRoom';
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

    before(async () => {
        meetingUrl = await createMeetingUrl();
        await createMeetingRoom(meetingUrl);
        Participant1 = await createBrowserSession(FIRST_PARTICIPANT);
        await Participant1.url(meetingUrl);
        Participant2 = await createBrowserSession(SECOND_PARTICIPANT);
        await Participant2.url(meetingUrl);
    });

    it('should open jitsi-meet app and enable lobby by first participant', async () => {
        const prejoinTextInput = await $('.prejoin-input-area input');

        await prejoinTextInput.setValue(MODERATOR);
        const prejoinButton = PrejoinScreen.PrejoinButton;

        await prejoinButton.click();
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
        const prejoinTextInput = await Participant1.$('.prejoin-input-area input');

        await prejoinTextInput.setValue(FIRST_PARTICIPANT);
        await Participant1.keys(ENTER_KEY);
    });
    it('third participant should ask to join the meeting', async () => {
        const prejoinTextInput = await Participant2.$('.prejoin-input-area input');

        await prejoinTextInput.setValue(SECOND_PARTICIPANT);
        await Participant2.keys(ENTER_KEY);
    });
    it('Moderator should press the view button from lobby notification', async () => {
        const viewLobbyNotification = await LobbyNotification.Notification;

        await expect(viewLobbyNotification).toBeDisplayed();
        const viewLobbyBtn = await LobbyNotification.ViewLobby;

        await expect(viewLobbyBtn).toBeDisplayed();
        await viewLobbyBtn.click();
        const participantsPane = await ParticipantsPane.ParticipantsPaneView;

        await expect(participantsPane).toBeDisplayed();
    });

    after(async () => {
        await browser.deleteSession();
        await Participant1.deleteSession();
        await Participant2.deleteSession();
    });
});
