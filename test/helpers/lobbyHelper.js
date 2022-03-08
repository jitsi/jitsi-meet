const Toolbox = require("../page-objects/Toolbox");
const PrejoinScreen = require("../page-objects/PrejoinScreen");
const SecurityDialog = require("../page-objects/SecurityDialog");
import { DEFAULT_CONFIG } from "../helpers/constants";
//import createBrowserUserSession from "../helpers/browserUserSession";

export default async function openSession(participant) {
    if (participant.moderator) {
        await browser.url(`${participant.url}/${participant.roomName}?${DEFAULT_CONFIG}`);
        const prejoinTextInput = await $('.prejoin-input-area input');
        await prejoinTextInput.setValue(participant.name);
        await browser.keys("\uE007"); //TODO change this
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
    } else {
        // const browserSession = await createBrowserUserSession()
        // await browserSession.url(`${participant.url}/${participant.roomName}?${DEFAULT_CONFIG}`);
        await browser.newWindow(`${participant.url}/${participant.roomName}?${DEFAULT_CONFIG}`);
        const prejoinTextInput = await PrejoinScreen.PrejoinInput;
        await expect(prejoinTextInput).toBeDisplayed();
        await prejoinTextInput.setValue(participant.name);
        await browser.keys("\uE007");
    }
}
