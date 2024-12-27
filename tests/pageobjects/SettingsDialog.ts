import BaseDialog from './BaseDialog';

const EMAIL_FIELD = '#setEmail';
const HIDE_SELF_VIEW_CHECKBOX = '//input[@name="hide-self-view"]';
const SETTINGS_DIALOG_CONTENT = '.settings-pane';
const X_PATH_MORE_TAB = '//div[contains(@class, "settings-dialog")]//*[text()="General"]';
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
     * Selects the Profile tab to be displayed.
     */
    async openMoreTab() {
        await this.openTab(X_PATH_MORE_TAB);
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

    /**
     * Sets the state checked/selected of a checkbox in the settings dialog.
     */
    async setHideSelfView(hideSelfView: boolean) {
        await this.openMoreTab();

        const checkbox = this.participant.driver.$(HIDE_SELF_VIEW_CHECKBOX);

        await checkbox.waitForExist();

        if (hideSelfView !== await checkbox.isSelected()) {
            // we show a div with svg and text after the input and those elements grab the click
            // so we need to click on the parent element
            await this.participant.driver.$(`${HIDE_SELF_VIEW_CHECKBOX}//ancestor::div[1]`).click();
        }
    }
}
