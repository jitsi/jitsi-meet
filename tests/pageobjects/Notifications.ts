import BasePageObject from './BasePageObject';

const AV_MODERATION_MUTED_NOTIFICATION_ID = 'notify.moderationInEffectTitle';
const ASK_TO_UNMUTE_NOTIFICATION_ID = 'notify.hostAskedUnmute';
const JOIN_ONE_TEST_ID = 'notify.connectedOneMember';
const JOIN_TWO_TEST_ID = 'notify.connectedTwoMembers';
const JOIN_MULTIPLE_TEST_ID = 'notify.connectedThreePlusMembers';
const YOU_ARE_MUTED_TEST_ID = 'notify.mutedTitle';
const LOBBY_ACCESS_DENIED_TEST_ID = 'lobby.joinRejectedMessage';
const LOBBY_ENABLED_TEST_ID = 'lobby.notificationLobbyEnabled';
const LOBBY_KNOCKING_PARTICIPANT_NOTIFICATION_XPATH
    = '//div[@data-testid="notify.participantWantsToJoin"]/div/div/span';
const LOBBY_NOTIFICATIONS_TITLE_TEST_ID = 'lobby.notificationTitle';
const LOBBY_PARTICIPANT_ACCESS_DENIED_TEST_ID = 'lobby.notificationLobbyAccessDenied';
const LOBBY_PARTICIPANT_ACCESS_GRANTED_TEST_ID = 'lobby.notificationLobbyAccessGranted';
const LOBBY_PARTICIPANT_ADMIT_TEST_ID = 'participantsPane.actions.admit';
const LOBBY_PARTICIPANT_REJECT_TEST_ID = 'participantsPane.actions.reject';
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
     * Closes the ask to unmute notification.
     */
    async closeAVModerationMutedNotification(skipNonExisting = false) {
        return this.closeNotification(AV_MODERATION_MUTED_NOTIFICATION_ID, skipNonExisting);
    }

    /**
     * Closes the ask to unmute notification.
     */
    async closeAskToUnmuteNotification(skipNonExisting = false) {
        return this.closeNotification(ASK_TO_UNMUTE_NOTIFICATION_ID, skipNonExisting);
    }

    /**
     * Dismisses any join notifications.
     */
    dismissAnyJoinNotification() {
        return Promise.allSettled(
            [ `${JOIN_ONE_TEST_ID}-dismiss`, `${JOIN_TWO_TEST_ID}-dismiss`, `${JOIN_MULTIPLE_TEST_ID}-dismiss` ]
                .map(id => this.participant.driver.$(`#${id}"]`).click()));
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
    closeReEnableSelfViewNotification() {
        return this.participant.driver.$(`div[data-testid="${REENABLE_SELF_VIEW_CLOSE_NOTIFICATION}"]`).click();
    }

    /**
     * The notification on participants page when Lobby is being enabled or disabled.
     */
    getLobbyEnabledText() {
        return this.getNotificationText(LOBBY_ENABLED_TEST_ID);
    }

    /**
     * Closes a specific lobby notification.
     * @param testId
     * @param skipNonExisting
     * @private
     */
    private async closeNotification(testId: string, skipNonExisting = false) {
        const notification = this.participant.driver.$(`[data-testid="${testId}"]`);

        if (skipNonExisting && !await notification.isExisting()) {
            return Promise.resolve();
        }

        await notification.waitForExist();
        await notification.waitForStable();

        const closeButton = notification.$('#close-notification');

        await closeButton.moveTo();
        await closeButton.click();
    }

    /**
     * Closes a specific lobby notification.
     * @param testId
     * @private
     */
    private async closeLobbyNotification(testId: string) {
        const notification = this.participant.driver.$(`[data-testid="${testId}"]`);

        await notification.waitForExist();
        await notification.waitForStable();

        const closeButton
            = this.participant.driver.$(`[data-testid="${LOBBY_NOTIFICATIONS_TITLE_TEST_ID}"]`)
                .$('#close-notification');

        await closeButton.moveTo();
        await closeButton.click();
    }

    /**
     * Closes the notification.
     */
    closeLobbyEnabled() {
        return this.closeLobbyNotification(LOBBY_ENABLED_TEST_ID);
    }

    /**
     * Returns the name of the knocking participant (the only one) that is displayed on the notification.
     */
    async getKnockingParticipantName() {
        const knockingParticipantNotification
            = this.participant.driver.$('//div[@data-testid="notify.participantWantsToJoin"]/div/div/span');

        await knockingParticipantNotification.waitForDisplayed({
            timeout: 3000,
            timeoutMsg: 'Knocking participant notification not displayed'
        });

        return await knockingParticipantNotification.getText();
    }

    /**
     * Admits the last knocking participant (it is the only one).
     */
    async allowLobbyParticipant() {
        const admitButton
            = this.participant.driver.$(`[data-testid="${LOBBY_PARTICIPANT_ADMIT_TEST_ID}"]`);

        await admitButton.waitForExist();
        await admitButton.waitForClickable();
        await admitButton.click();
    }

    /**
     * The notification that someone's access was approved.
     */
    getLobbyParticipantAccessGranted() {
        return this.getNotificationText(LOBBY_PARTICIPANT_ACCESS_GRANTED_TEST_ID);
    }

    /**
     * Closes the notification.
     */
    closeLobbyParticipantAccessGranted() {
        return this.closeLobbyNotification(LOBBY_PARTICIPANT_ACCESS_GRANTED_TEST_ID);
    }

    /**
     * Returns notification text if the notification is found in the next few seconds.
     * @return the notification text.
     */
    private async getNotificationText(testId: string) {
        const notificationElement = this.participant.driver.$(`[data-testid="${testId}"]`);

        await notificationElement.waitForExist({ timeout: 2_000 });

        return await notificationElement.getText();
    }

    /**
     * Rejects the last knocking participant (it is the only one).
     */
    async rejectLobbyParticipant() {
        const admitButton
            = this.participant.driver.$(`[data-testid="${LOBBY_PARTICIPANT_REJECT_TEST_ID}"]`);

        await admitButton.waitForExist();
        await admitButton.waitForClickable();
        await admitButton.click();
    }

    /**
     * The notification test that someone's access was denied.
     */
    getLobbyParticipantAccessDenied() {
        return this.getNotificationText(LOBBY_PARTICIPANT_ACCESS_DENIED_TEST_ID);
    }

    /**
     * Closes the notification.
     */
    closeLobbyParticipantAccessDenied() {
        return this.closeLobbyNotification(LOBBY_PARTICIPANT_ACCESS_DENIED_TEST_ID);
    }

    /**
     * Waits for the notification for access denied for entering the lobby is shown.
     */
    async waitForLobbyAccessDeniedNotification() {
        const displayNameEl
            = this.participant.driver.$(`div[data-testid="${LOBBY_ACCESS_DENIED_TEST_ID}"]`);

        await displayNameEl.waitForExist({ timeout: 2000 });
        await displayNameEl.waitForDisplayed();
    }

    /**
     * Will wait 3 seconds for the knocking participants to disappear and return true or will return false.
     * @return <tt>true</tt> if the knocking participants list was not displayed.
     */
    waitForHideOfKnockingParticipants() {
        return this.participant.driver.$(LOBBY_KNOCKING_PARTICIPANT_NOTIFICATION_XPATH)
            .waitForDisplayed({
                timeout: 3000,
                reverse: true
            });
    }

    /**
     * Closes local notification, for the participant that was denied.
     */
    async closeLocalLobbyAccessDenied() {
        await this.participant.driver.$('[data-testid="lobby.joinRejectedMessage"').waitForExist();

        const dismissButton
            = this.participant.driver.$('[data-testid="lobby.joinRejectedTitle-dismiss"]');

        await dismissButton.moveTo();
        await dismissButton.click();
    }

    /**
     * Closes the `you are muted` notification.
     */
    async closeYouAreMutedNotification() {
        return this.closeNotification(YOU_ARE_MUTED_TEST_ID, true);
    }
}
