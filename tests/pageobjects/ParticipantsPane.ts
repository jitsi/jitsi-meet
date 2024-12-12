import { Participant } from '../helpers/Participant';

/**
 * Classname of the closed/hidden participants pane
 */
const PARTICIPANTS_PANE = 'participants_pane';

/**
 * Represents the participants pane from the UI.
 */
export default class ParticipantsPane {
    private participant: Participant;

    /**
     * Initializes for a participant.
     *
     * @param {Participant} participant - The participant.
     */
    constructor(participant: Participant) {
        this.participant = participant;
    }

    /**
     * Checks if the pane is open.
     */
    async isOpen() {
        return this.participant.driver.$(`.${PARTICIPANTS_PANE}`).isExisting();
    }

    /**
     * Clicks the "participants" toolbar button to open the participants pane.
     */
    async open() {
        await this.participant.getToolbar().clickParticipantsPaneButton();

        await this.participant.driver.$(`.${PARTICIPANTS_PANE}`).waitForDisplayed();
    }

    /**
     * Clicks the "participants" toolbar button to close the participants pane.
     */
    async close() {
        await this.participant.getToolbar().clickCloseParticipantsPaneButton();

        await this.participant.driver.$(`.${PARTICIPANTS_PANE}`).waitForDisplayed({ reverse: true });
    }

    /**
     * Asserts that {@code participant} shows or doesn't show the video mute icon for the conference participant
     * identified by {@code testee}.
     *
     * @param {Participant} testee - The {@code Participant} for whom we're checking the status of audio muted icon.
     * @param {boolean} reverse - If {@code true}, the method will assert the absence of the "mute" icon;
     * otherwise, it will assert its presence.
     * @returns {Promise<void>}
     */
    async assertVideoMuteIconIsDisplayed(testee: Participant, reverse = false): Promise<void> {
        const isOpen = await this.isOpen();

        if (!isOpen) {
            await this.open();
        }

        const id = `participant-item-${await testee.getEndpointId()}`;
        const mutedIconXPath
            = `//div[@id='${id}']//div[contains(@class, 'indicators')]//*[local-name()='svg' and @id='videoMuted']`;

        await this.participant.driver.$(mutedIconXPath).waitForDisplayed({
            reverse,
            timeout: 2000,
            timeoutMsg: `Video mute icon is ${reverse ? '' : 'not'} displayed for ${testee.name}`
        });

        if (!isOpen) {
            await this.close();
        }
    }
}
