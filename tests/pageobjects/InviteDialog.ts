import BaseDialog from './BaseDialog';

const CONFERENCE_ID = 'conference-id';
const CONFERENCE_URL = 'invite-more-dialog-conference-url';
const DIALOG_CONTAINER = 'invite-more-dialog';
const MORE_NUMBERS = 'more-numbers';
const PHONE_NUMBER = 'phone-number';

/**
 * Represents the invite dialog in a particular participant.
 */
export default class InviteDialog extends BaseDialog {
    /**
     * Checks if the dialog is open.
     */
    isOpen() {
        return this.participant.driver.$(`.${DIALOG_CONTAINER}`).isExisting();
    }

    /**
     * Open the invite dialog, if the info dialog is closed.
     */
    async open() {
        if (await this.isOpen()) {
            return;
        }

        await this.participant.getParticipantsPane().clickInvite();
    }

    /**
     * Returns the PIN for the conference.
     */
    async getPinNumber() {
        await this.open();

        return (await this.getValueAfterColon(CONFERENCE_ID)).replace(/[# ]/g, '');
    }

    /**
     * Private helper to get values after colons. The invite dialog lists conference specific information
     * after a label, followed by a colon.
     *
     * @param className
     * @private
     */
    private async getValueAfterColon(className: string) {
        const elem = this.participant.driver.$(`.${className}`);

        await elem.waitForExist({ timeout: 5000 });

        const fullText = await elem.getText();

        this.participant.log(`Extracted text in invite dialog: ${fullText}`);

        return fullText.split(':')[1].trim();
    }

    /**
     * Returns the meeting url displayed in the dialog.
     */
    async getMeetingURL() {
        const elem = this.participant.driver.$(`.${CONFERENCE_URL}`);

        await elem.waitForExist();

        return (await elem.getText())?.trim();
    }

    /**
     * Waits for the dialog to be open or closed.
     * @param reverse
     */
    async waitTillOpen(reverse = false) {
        await this.participant.driver.waitUntil(
            /* eslint-disable no-extra-parens */
            async () => (reverse ? !await this.isOpen() : await this.isOpen()),
            {
                timeout: 2_000,
                timeoutMsg: `invite dialog did not ${reverse ? 'close' : 'open'}`
            }
        );
    }

    /**
     * Gets the string that contains the dial in number for the current conference.
     */
    getDialInNumber() {
        return this.getValueAfterColon(PHONE_NUMBER);
    }

    /**
     * Clicks the link to open a page to show all available dial in numbers.
     */
    async openDialInNumbersPage() {
        const moreNumbers = this.participant.driver.$(`.${MORE_NUMBERS}`);

        await moreNumbers.waitForExist();
        await moreNumbers.waitForClickable();
        await moreNumbers.click();
    }
}
