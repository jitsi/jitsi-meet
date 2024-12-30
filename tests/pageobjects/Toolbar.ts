import BasePageObject from './BasePageObject';

const AUDIO_MUTE = 'Mute microphone';
const AUDIO_UNMUTE = 'Unmute microphone';
const CHAT = 'Open chat';
const CLOSE_CHAT = 'Close chat';
const CLOSE_PARTICIPANTS_PANE = 'Close participants pane';
const HANGUP = 'Leave the meeting';
const OVERFLOW_MENU = 'More actions menu';
const OVERFLOW = 'More actions';
const PARTICIPANTS = 'Open participants pane';
const PROFILE = 'Edit your profile';
const RAISE_HAND = 'Raise your hand';
const SETTINGS = 'Open settings';
const ENTER_TILE_VIEW_BUTTON = 'Enter tile view';
const EXIT_TILE_VIEW_BUTTON = 'Exit tile view';
const VIDEO_QUALITY = 'Manage video quality';
const VIDEO_MUTE = 'Stop camera';
const VIDEO_UNMUTE = 'Start camera';

/**
 * The toolbar elements.
 */
export default class Toolbar extends BasePageObject {
    /**
     * Returns the button.
     *
     * @param {string} accessibilityCSSSelector - The selector to find the button.
     * @returns {WebdriverIO.Element} The button.
     * @private
     */
    private getButton(accessibilityCSSSelector: string) {
        return this.participant.driver.$(`aria/${accessibilityCSSSelector}`);
    }

    /**
     * The audio mute button.
     */
    get audioMuteBtn() {
        return this.getButton(AUDIO_MUTE);
    }

    /**
     * The audio unmute button.
     */
    get audioUnMuteBtn() {
        return this.getButton(AUDIO_UNMUTE);
    }

    /**
     * Clicks audio mute button.
     *
     * @returns {Promise<void>}
     */
    async clickAudioMuteButton(): Promise<void> {
        this.participant.log('Clicking on: Audio Mute Button');
        await this.audioMuteBtn.click();
    }

    /**
     * Clicks audio unmute button.
     *
     * @returns {Promise<void>}
     */
    async clickAudioUnmuteButton(): Promise<void> {
        this.participant.log('Clicking on: Audio Unmute Button');
        await this.audioUnMuteBtn.click();
    }

    /**
     * The video mute button.
     */
    get videoMuteBtn() {
        return this.getButton(VIDEO_MUTE);
    }

    /**
     * The video unmute button.
     */
    get videoUnMuteBtn() {
        return this.getButton(VIDEO_UNMUTE);
    }

    /**
     * Clicks video mute button.
     *
     * @returns {Promise<void>}
     */
    async clickVideoMuteButton(): Promise<void> {
        this.participant.log('Clicking on: Video Mute Button');
        await this.videoMuteBtn.click();
    }

    /**
     * Clicks video unmute button.
     *
     * @returns {Promise<void>}
     */
    async clickVideoUnmuteButton(): Promise<void> {
        this.participant.log('Clicking on: Video Unmute Button');
        await this.videoUnMuteBtn.click();
    }

    /**
     * Clicks Participants pane button.
     *
     * @returns {Promise<void>}
     */
    async clickCloseParticipantsPaneButton(): Promise<void> {
        this.participant.log('Clicking on: Close Participants pane Button');
        await this.getButton(CLOSE_PARTICIPANTS_PANE).click();
    }


    /**
     * Clicks Participants pane button.
     *
     * @returns {Promise<void>}
     */
    async clickParticipantsPaneButton(): Promise<void> {
        this.participant.log('Clicking on: Participants pane Button');

        // Special case for participants pane button, as it contains the number of participants and its label
        // is changing
        await this.participant.driver.$(`[aria-label^="${PARTICIPANTS}"]`).click();
    }

    /**
     * Clicks on the video quality toolbar button which opens the
     * dialog for adjusting max-received video quality.
     */
    async clickVideoQualityButton(): Promise<void> {
        return this.clickButtonInOverflowMenu(VIDEO_QUALITY);
    }

    /**
     * Clicks on the profile toolbar button which opens or closes the profile panel.
     */
    async clickProfileButton(): Promise<void> {
        return this.clickButtonInOverflowMenu(PROFILE);
    }

    /**
     * Clicks on the raise hand button that enables participants will to speak.
     */
    async clickRaiseHandButton(): Promise<void> {
        this.participant.log('Clicking on: Raise hand Button');
        await this.getButton(RAISE_HAND).click();
    }

    /**
     * Clicks on the chat button that opens chat panel.
     */
    async clickChatButton(): Promise<void> {
        this.participant.log('Clicking on: Chat Button');
        await this.getButton(CHAT).click();
    }

    /**
     * Clicks on the chat button that closes chat panel.
     */
    async clickCloseChatButton(): Promise<void> {
        this.participant.log('Clicking on: Close Chat Button');
        await this.getButton(CLOSE_CHAT).click();
    }

    /**
     * Clicks on the tile view button which enables tile layout.
     */
    async clickEnterTileViewButton() {
        await this.getButton(ENTER_TILE_VIEW_BUTTON).click();
    }

    /**
     * Clicks on the tile view button which exits tile layout.
     */
    async clickExitTileViewButton() {
        await this.getButton(EXIT_TILE_VIEW_BUTTON).click();
    }

    /**
     * Clicks on the hangup button that ends the conference.
     */
    async clickHangupButton(): Promise<void> {
        this.participant.log('Clicking on: Hangup Button');
        await this.getButton(HANGUP).click();
    }

    /**
     * Clicks on the settings toolbar button which opens or closes the settings panel.
     */
    async clickSettingsButton() {
        await this.clickButtonInOverflowMenu(SETTINGS);
    }

    /**
     * Ensure the overflow menu is open and clicks on a specified button.
     * @param accessibilityLabel The accessibility label of the button to be clicked.
     * @private
     */
    private async clickButtonInOverflowMenu(accessibilityLabel: string) {
        await this.openOverflowMenu();

        // sometimes the overflow button tooltip is over the last entry in the menu,
        // so let's move focus away before clicking the button
        await this.participant.driver.$('#overflow-context-menu').moveTo();

        this.participant.log(`Clicking on: ${accessibilityLabel}`);
        await this.getButton(accessibilityLabel).click();

        await this.closeOverflowMenu();
    }

    /**
     * Checks if the overflow menu is open and visible.
     * @private
     */
    private async isOverflowMenuOpen() {
        return await this.participant.driver.$$(`aria/${OVERFLOW_MENU}`).length > 0;
    }

    /**
     * Clicks on the overflow toolbar button which opens or closes the overflow menu.
     * @private
     */
    private async clickOverflowButton(): Promise<void> {
        await this.getButton(OVERFLOW).click();
    }

    /**
     * Ensure the overflow menu is displayed.
     * @private
     */
    private async openOverflowMenu() {
        if (await this.isOverflowMenuOpen()) {
            return;
        }

        await this.clickOverflowButton();

        await this.waitForOverFlowMenu(true);
    }

    /**
     * Ensures the overflow menu is not displayed.
     * @private
     */
    private async closeOverflowMenu() {
        if (!await this.isOverflowMenuOpen()) {
            return;
        }

        await this.clickOverflowButton();

        await this.waitForOverFlowMenu(false);
    }

    /**
     * Waits for the overflow menu to be visible or hidden.
     * @param visible
     * @private
     */
    private async waitForOverFlowMenu(visible: boolean) {
        await this.getButton(OVERFLOW_MENU).waitForDisplayed({
            reverse: !visible,
            timeout: 3000,
            timeoutMsg: `Overflow menu is not ${visible ? 'visible' : 'hidden'}`
        });
    }

    /**
     * Gets the participant's avatar image element located in the toolbar.
     */
    async getProfileImage() {
        await this.openOverflowMenu();

        const elem = this.participant.driver.$(`[aria-label^="${PROFILE}"] img`);

        return await elem.isExisting() ? await elem.getAttribute('src') : null;
    }
}
