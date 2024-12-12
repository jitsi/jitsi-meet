import BaseDialog from './BaseDialog';

const EMAIL_FIELD = '#setEmail';
const SETTINGS_DIALOG_CONTENT = '.settings-pane';
const X_PATH_PROFILE_TAB = '//div[contains(@class, "settings-dialog")]//*[text()="Profile"]';

/**
 * The settings dialog.
 */
export default class SettingsDialog extends BaseDialog {
    /**
     *  Waits for the settings dialog to be visible.
     */
    async waitForDisplay() {
        await this.participant.driver.$(SETTINGS_DIALOG_CONTENT).waitForDisplayed();
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
    async openProfileTab() {
        await this.openTab(X_PATH_PROFILE_TAB);
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
    async submit() {
        await this.clickOkButton();
    }
}
