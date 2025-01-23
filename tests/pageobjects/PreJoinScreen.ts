import PreMeetingScreen from './PreMeetingScreen';

const DISPLAY_NAME_ID = 'premeeting-name-input';
const JOIN_BUTTON_TEST_ID = 'prejoin.joinMeeting';

/**
 * Page object for the PreJoin screen.
 */
export default class PreJoinScreen extends PreMeetingScreen {
    /**
     * Returns the join button element.
     */
    getJoinButton(): ChainablePromiseElement {
        return this.participant.driver.$(`[data-testid="${JOIN_BUTTON_TEST_ID}"]`);
    }

    /**
     * Returns the display name input element.
     */
    getDisplayNameInput(): ChainablePromiseElement {
        return this.participant.driver.$(`#${DISPLAY_NAME_ID}`);
    }

    /**
     * Waits for pre join screen to load.
     */
    waitForLoading(): Promise<void> {
        return this.participant.driver.$('[data-testid="prejoin.screen"]')
            .waitForDisplayed({ timeout: 3000 });
    }
}
