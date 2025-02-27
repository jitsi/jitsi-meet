import BaseDialog from './BaseDialog';

const INPUT_KEY_XPATH = '//input[@name="lockKey"]';

/**
 * Represents the password dialog in a particular participant.
 */
export default class PasswordDialog extends BaseDialog {
    /**
     * Waiting for the dialog to appear.
     */
    async waitForDialog() {
        const input = this.participant.driver.$(INPUT_KEY_XPATH);

        await input.waitForExist({
            timeout: 5000,
            timeoutMsg: 'Password dialog not found'
        });
        await input.waitForDisplayed();
        await input.waitForStable();
    }

    /**
     * Sets a password and submits the dialog.
     * @param password
     */
    async submitPassword(password: string) {
        const passwordInput = this.participant.driver.$(INPUT_KEY_XPATH);

        await passwordInput.waitForExist();
        await passwordInput.click();
        await passwordInput.clearValue();

        await this.participant.driver.keys(password);

        await this.clickOkButton();
    }
}
