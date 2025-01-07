import BasePageObject from './BasePageObject';

const ASK_TO_UNMUTE_NOTIFICATION_ID = 'notify.hostAskedUnmute';
const JOIN_ONE_TEST_ID = 'notify.connectedOneMember';
const JOIN_TWO_TEST_ID = 'notify.connectedTwoMembers';
const JOIN_MULTIPLE_TEST_ID = 'notify.connectedThreePlusMembers';
const RAISE_HAND_NOTIFICATION_ID = 'notify.raisedHand';
const REENABLE_SELF_VIEW_NOTIFICATION_ID = 'notify.selfViewTitle';
const REENABLE_SELF_VIEW_CLOSE_NOTIFICATION = 'notify.selfViewTitle-dismiss';

/**
 * Gathers all notifications logic in the UI and obtaining those.
 */
export default class Notifications extends BasePageObject {
    /**
     * Waits for the raised hand notification to be displayed.
     * The notification on moderators page when the participant tries to unmute.
     */
    async waitForRaisedHandNotification() {
        const displayNameEl
            = this.participant.driver.$(`div[data-testid="${RAISE_HAND_NOTIFICATION_ID}"]`);

        await displayNameEl.waitForExist({ timeout: 2000 });
        await displayNameEl.waitForDisplayed();
    }

    /**
     * The notification on participants page when the moderator asks to unmute.
     */
    async waitForAskToUnmuteNotification() {
        const displayNameEl
            = this.participant.driver.$(`div[data-testid="${ASK_TO_UNMUTE_NOTIFICATION_ID}"]`);

        await displayNameEl.waitForExist({ timeout: 2000 });
        await displayNameEl.waitForDisplayed();
    }

    /**
     * Dismisses any join notifications.
     */
    async dismissAnyJoinNotification() {
        await Promise.allSettled(
            [ `${JOIN_ONE_TEST_ID}-dismiss`, `${JOIN_TWO_TEST_ID}-dismiss`, `${JOIN_MULTIPLE_TEST_ID}-dismiss` ]
                .map(async id => this.participant.driver.$(`#${id}"]`).click()));
    }

    /**
     * Waits for the self view notification to be displayed.
     */
    async waitForReEnableSelfViewNotification() {
        const el
            = this.participant.driver.$(`div[data-testid="${REENABLE_SELF_VIEW_NOTIFICATION_ID}"]`);

        await el.waitForExist({ timeout: 2000 });
        await el.waitForDisplayed();

    }

    /**
     * Closes the self view notification.
     */
    async closeReEnableSelfViewNotification() {
        await this.participant.driver.$(`div[data-testid="${REENABLE_SELF_VIEW_CLOSE_NOTIFICATION}"]`).click();
    }
}
