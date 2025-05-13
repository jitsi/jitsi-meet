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

    /**
     * Whether the visitors queue UI is shown.
     */
    isVisitorsQueueUIShown() {
        return this.participant.driver.$('#visitors-waiting-queue').isDisplayed();
    }

    /**
     * Returns the name of the knocking participant (the only one) that is displayed on the notification.
     */
    async getWaitingVisitorsInQueue() {
        const goLiveNotification
            = this.participant.driver.$('//div[@data-testid="notify.waitingVisitors"]');

        await goLiveNotification.waitForDisplayed({
            timeout: 3000,
            timeoutMsg: 'Go live notification not displayed'
        });

        return await goLiveNotification.getText();
    }

    /**
     * Clicks the go live button in the visitors notification.
     */
    async goLive() {
        return this.participant.driver.$('//button[@data-testid="participantsPane.actions.goLive"]').click();
    }
}
