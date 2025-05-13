import BasePageObject from './BasePageObject';

/**
 * Page object for the visitors elements in moderator and visitor page.
 */
export default class Visitors extends BasePageObject {
    /**
     * Returns the visitors dialog element if any.
     */
    hasVisitorsDialog() {
        return this.participant.driver.$('aria/Joining meeting');
    }

    /**
     * Returns the visitors count shown in the conference info (subject) area.
     */
    getVisitorsCount() {
        return this.participant.driver.$('#visitorsCountLabel').getText();
    }

    /**
     * Returns the visitors count shown in the Participants pane.
     */
    async getVisitorsHeaderFromParticipantsPane() {
        const participantsPane = this.participant.getParticipantsPane();
        const isOpen = await participantsPane.isOpen();

        if (!isOpen) {
            await participantsPane.open();
        }

        return this.participant.driver.$('#visitor-list-header').getText();
    }
}
