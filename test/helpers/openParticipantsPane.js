

export default async function openParticipantsPane() {

    const video = await $('#largeVideo');
    await video.moveTo();
    const toolbox = await $('.toolbox-content-items');
    await expect(toolbox).toBeDisplayed();
    const participantsButton = await $("[aria-label='Participants']");
    await expect(participantsButton).toBeDisplayed();
    await participantsButton.click();
    const participantsPane = await $('.participants_pane');
    await expect(participantsPane).toBeDisplayed();
}