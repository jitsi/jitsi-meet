import { Participant } from '../helpers/Participant';

const ASK_TO_UNMUTE_NOTIFICATION_ID = 'notify.hostAskedUnmute';
const JOIN_ONE_TEST_ID = 'notify.connectedOneMember';
const JOIN_TWO_TEST_ID = 'notify.connectedTwoMembers';
const JOIN_MULTIPLE_TEST_ID = 'notify.connectedThreePlusMembers';
const RAISE_HAND_NOTIFICATION_ID = 'notify.raisedHand';

/**
 * Gathers all notifications logic in the UI and obtaining those.
 */
export default class Notifications {
    private participant: Participant;

    /**
     * Represents the Audio Video Moderation menu in the participants pane.
     * @param participant
     */
    constructor(participant: Participant) {
        this.participant = participant;
    }

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
}
