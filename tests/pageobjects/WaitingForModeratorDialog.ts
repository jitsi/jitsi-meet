import BaseDialog from './BaseDialog';

// Using selectors that are less likely to change
const LOGIN_BUTTON = '[aria-label="Log-in"]';
const CANCEL_BUTTON = '[aria-label="Cancel"]';

/**
 * Represents the waiting for moderator dialog in a particular participant.
 */
export default class WaitingForModeratorDialog extends BaseDialog {
    /**
     * Checks if the dialog is open.
     */
    isOpen() {
        return this.participant.driver.$(LOGIN_BUTTON).isExisting();
    }

    /**
     * Waits for the dialog to be open or closed.
     * @param reverse - if true, waits for dialog to close; if false, waits for dialog to open
     */
    async waitForOpen(reverse = false) {
        await this.participant.driver.waitUntil(async () => (reverse ? !(await this.isOpen()) : await this.isOpen()), {
            timeout: 10_000,
            timeoutMsg: `waiting for moderator dialog did not ${reverse ? 'close' : 'open'}`,
        });
    }

    /**
     * Clicks the login button to become a moderator.
     */
    override async clickOkButton() {
        const loginButton = this.participant.driver.$(LOGIN_BUTTON);

        await loginButton.waitForExist();
        await loginButton.waitForClickable();
        await loginButton.click();
    }

    /**
     * Clicks the cancel button to close the dialog.
     */
    override async clickCloseButton() {
        const cancelButton = this.participant.driver.$(CANCEL_BUTTON);

        await cancelButton.waitForExist();
        await cancelButton.waitForClickable();
        await cancelButton.click();
    }
}
