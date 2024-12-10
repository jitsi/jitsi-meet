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
}
