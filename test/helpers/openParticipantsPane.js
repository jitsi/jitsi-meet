const ParticipantsPane = require('../page-objects/ParticipantsPane');
const Toolbox = require('../page-objects/Toolbox');

/**
 * Open participants pane function.
 *
 * @returns {void}
 */
export default async function openParticipantsPane(userBrowser) {
    const getToolbox = await new Toolbox(userBrowser);
    const getToolboxView = await getToolbox.ToolboxView;

    await expect(getToolboxView).toBeDisplayed();
    const participantsButton = await getToolbox.ParticipantsPaneButton;

    await expect(participantsButton).toBeDisplayed();
    await participantsButton.click();

    const participantsPanePageObject = await new ParticipantsPane(userBrowser);
    const participantsPane = await participantsPanePageObject.ParticipantsPaneView;

    await expect(participantsPane).toBeDisplayed();
}
