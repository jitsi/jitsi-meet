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

    async isOpen() {
        const input = this.participant.driver.$(INPUT_KEY_XPATH);

        try {
            await input.isExisting();

            return await input.isDisplayed();
        } catch (e) {
            return false;
        }
    }

    /**
     * Sets a password and submits the dialog.
     * @param password
     */
    async submitPassword(password: string) {
        const passwordInput = this.participant.driver.$(INPUT_KEY_XPATH);

        await passwordInput.waitForExist();
        await passwordInput.waitForStable();
        await passwordInput.click();
        await passwordInput.clearValue();

        await this.participant.driver.keys(password);

        // The driver reports the keys as sent whether or not the page receives them. Say so in the log when they did
        // not land, instead of leaving only the join timeout that follows.
        const typed = await passwordInput.getValue();

        if (typed !== password) {
            await this.participant.log(`The password typed through the driver did not land for ${
                this.participant.name}: the field holds "${typed}". The driver's input is not reaching the page.`);
        }

        await this.clickOkButton();
    }
}
