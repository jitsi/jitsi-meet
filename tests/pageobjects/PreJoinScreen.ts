import PreMeetingScreen from './PreMeetingScreen';

const DISPLAY_NAME_ID = 'premeeting-name-input';
const ERROR_ON_JOIN = 'prejoin.errorMessage';
const JOIN_BUTTON_TEST_ID = 'prejoin.joinMeeting';
const JOIN_WITHOUT_AUDIO = 'prejoin.joinWithoutAudio';
const OPTIONS_BUTTON = 'prejoin.joinOptions';

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

    /**
     * Returns the error message displayed on the prejoin screen.
     */
    getErrorOnJoin() {
        return this.participant.driver.$(`[data-testid="${ERROR_ON_JOIN}"]`);
    }

    /**
     * Returns the join without audio button element.
     */
    getJoinWithoutAudioButton() {
        return this.participant.driver.$(`[data-testid="${JOIN_WITHOUT_AUDIO}"]`);
    }

    /**
     * Returns the join options button element.
     */
    getJoinOptions() {
        return this.participant.driver.$(`[data-testid="${OPTIONS_BUTTON}"]`);
    }
}
