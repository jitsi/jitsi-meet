const Toolbox = require("../page-objects/Toolbox");
const PrejoinScreen = require("../page-objects/PrejoinScreen");
const SecurityDialog = require("../page-objects/SecurityDialog");
export default async function openSession(participant) {
    if (participant.moderator) {
        await browser.url(participant.url);
        const enterRoomField = await $('#enter_room_field');
        await expect(enterRoomField).toBeDisplayed();
        await enterRoomField.setValue(participant.roomName);
        const enterRoomBtn = await $('#enter_room_button');
        await expect(enterRoomBtn).toBeDisplayed();
        await enterRoomBtn.click();
        const prejoinTextInput = await $('.prejoin-input-area input');
        await prejoinTextInput.setValue(participant.name);
        await browser.keys("\uE007"); //TODO change this
        await prejoinTextInput.setValue('');
        const toolbox = await Toolbox.ToolboxView;
        await expect(toolbox).toBeDisplayed();
        const toolbarSecurityOption = await Toolbox.ToolboxSecurityOption;
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
    } else {
        await browser.newWindow(`${participant.url}/${participant.roomName}`, {});
        const prejoinScreen = await PrejoinScreen.PremeetingScreen;
        await expect(prejoinScreen).toBeDisplayed();
        const prejoinTextInput = await PrejoinScreen.PrejoinInput;
        await expect(prejoinTextInput).toBeDisplayed();
        await prejoinTextInput.setValue('');
        await prejoinTextInput.setValue(participant.name);
        await browser.keys("\uE007");
    }
}
