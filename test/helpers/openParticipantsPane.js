const ParticipantsPane = require('../page-objects/ParticipantsPane');
const Toolbox = require('../page-objects/Toolbox');

/**
 * Open participants pane function.
 *
 * @returns {void}
 */
export default async function openParticipantsPane() {
    const getToolbox = await Toolbox.ToolboxView;

    await expect(getToolbox).toBeDisplayed();
    const participantsButton = await Toolbox.ParticipantsPaneButton;

    await expect(participantsButton).toBeDisplayed();
    await participantsButton.click();
    const participantsPane = await ParticipantsPane.ParticipantsPaneView;

    await expect(participantsPane).toBeDisplayed();
}
