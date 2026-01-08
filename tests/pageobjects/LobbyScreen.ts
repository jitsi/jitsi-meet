import PreMeetingScreen from './PreMeetingScreen';

const DISPLAY_NAME_TEST_ID = 'lobby.nameField';
const JOIN_BUTTON_TEST_ID = 'lobby.knockButton';

/**
 * Page object for the Lobby screen.
 */
export default class LobbyScreen extends PreMeetingScreen {
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
        return this.participant.driver.$(`[data-testid="${DISPLAY_NAME_TEST_ID}"]`);
    }

    /**
     * Waits for lobby screen to load.
     */
    waitForLoading(): Promise<void> {
        return this.participant.driver.$('.lobby-screen').waitForDisplayed({ timeout: 6000 });
    }
}
