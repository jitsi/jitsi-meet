import BaseDialog from './BaseDialog';

const EMAIL_FIELD = '#setEmail';
const FOLLOW_ME_CHECKBOX = '//input[@name="follow-me"]';
const HIDE_SELF_VIEW_CHECKBOX = '//input[@name="hide-self-view"]';
const SETTINGS_DIALOG_CONTENT = '.settings-pane';
const START_AUDIO_MUTED_CHECKBOX = '//input[@name="start-audio-muted"]';
const START_VIDEO_MUTED_CHECKBOX = '//input[@name="start-video-muted"]';
const X_PATH_MODERATOR_TAB = '//div[contains(@class, "settings-dialog")]//*[text()="Moderator"]';
const X_PATH_MORE_TAB = '//div[contains(@class, "settings-dialog")]//*[text()="General"]';
const X_PATH_PROFILE_TAB = '//div[contains(@class, "settings-dialog")]//*[text()="Profile"]';

/**
 * The settings dialog.
 */
export default class SettingsDialog extends BaseDialog {
    /**
     *  Waits for the settings dialog to be visible.
     */
    waitForDisplay() {
        return this.participant.driver.$(SETTINGS_DIALOG_CONTENT).waitForDisplayed();
    }

    /**
     * Displays a specific tab in the settings dialog.
     * @param xpath
     * @private
     */
    private async openTab(xpath: string) {
        const elem = this.participant.driver.$(xpath);

        await elem.waitForClickable();
        await elem.click();
    }

    /**
     * Selects the Profile tab to be displayed.
     */
    openProfileTab() {
        return this.openTab(X_PATH_PROFILE_TAB);
    }

    /**
     * Selects the More tab to be displayed.
     */
    openMoreTab() {
        return this.openTab(X_PATH_MORE_TAB);
    }

    /**
     * Selects the moderator tab to be displayed.
     */
    openModeratorTab() {
        return this.openTab(X_PATH_MODERATOR_TAB);
    }

    /**
     * Enters the passed in email into the email field.
     * @param email
     */
    async setEmail(email: string) {
        await this.openProfileTab();

        await this.participant.driver.$(EMAIL_FIELD).setValue(email);
    }

    /**
     * Returns the participant's email displayed in the settings dialog.
     */
    async getEmail() {
        await this.openProfileTab();

        return await this.participant.driver.$(EMAIL_FIELD).getValue();
    }

    /**
     * Clicks the OK button on the settings dialog to close the dialog and save any changes made.
     */
    submit() {
        return this.clickOkButton();
    }

    /**
     * Sets the start audio muted feature to enabled/disabled.
     * @param {boolean} enable - true for enabled and false for disabled.
     * @returns {Promise<void>}
     */
    async setStartAudioMuted(enable: boolean) {
        await this.openModeratorTab();

        await this.setCheckbox(START_AUDIO_MUTED_CHECKBOX, enable);
    }

    /**
     * Sets the start video muted feature to enabled/disabled.
     * @param {boolean} enable - true for enabled and false for disabled.
     * @returns {Promise<void>}
     */
    async setStartVideoMuted(enable: boolean) {
        await this.openModeratorTab();

        await this.setCheckbox(START_VIDEO_MUTED_CHECKBOX, enable);
    }

    /**
     * Sets the state checked/selected of a checkbox in the settings dialog.
     */
    async setHideSelfView(hideSelfView: boolean) {
        await this.openMoreTab();

        await this.setCheckbox(HIDE_SELF_VIEW_CHECKBOX, hideSelfView);
    }

    /**
     * Sets the follow me feature to enabled/disabled.
     * @param enable
     */
    async setFollowMe(enable: boolean) {
        await this.openModeratorTab();

        await this.setCheckbox(FOLLOW_ME_CHECKBOX, enable);
    }

    /**
     * Returns true if the follow me checkbox is displayed in the settings dialog.
     */
    async isFollowMeDisplayed() {
        const elem = this.participant.driver.$(X_PATH_MODERATOR_TAB);

        if (!await elem.isExisting()) {
            return false;
        }

        await this.openModeratorTab();

        return await this.participant.driver.$$(FOLLOW_ME_CHECKBOX).length > 0;
    }

    /**
     * Sets the state of a checkbox.
     * @param selector
     * @param enable
     * @private
     */
    private async setCheckbox(selector: string, enable: boolean) {
        const checkbox = this.participant.driver.$(selector);

        await checkbox.waitForExist();

        if (enable !== await checkbox.isSelected()) {
            // we show a div with svg and text after the input and those elements grab the click
            // so we need to click on the parent element
            await this.participant.driver.$(`${selector}//ancestor::div[1]`).click();
        }
    }
}
