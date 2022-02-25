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
        const video = await $('#largeVideo');
        await video.moveTo();
        const toolbox = await $('.toolbox-content-items');
        await expect(toolbox).toBeDisplayed();
        const moreActions = await $('.toolbox-button-wth-dialog div');
        await moreActions.click();
        const securityOptions = await $('[aria-label="Security options"]');
        await securityOptions.click();
        const enableLobby = await $('[aria-label="cross"]');
        await expect(enableLobby).toBeDisplayed();
        await enableLobby.click();
        const lobbyEnabled = await $('[data-checked="true"]');
        await expect(lobbyEnabled).toBeDisplayed();
        const modalClose = await $('#modal-header-close-button');
        await expect(modalClose).toBeDisplayed();
        await modalClose.click();
    } else {
        await browser.newWindow(`${participant.url}/${participant.roomName}`, {});
        const prejoinTextInput = await $('.prejoin-input-area input');
        await prejoinTextInput.setValue('');
        await prejoinTextInput.setValue(participant.name);
        await browser.keys("\uE007");
    }
}
