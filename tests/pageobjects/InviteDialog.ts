import BaseDialog from './BaseDialog';

const CONFERENCE_ID = 'conference-id';
const DIALOG_CONTAINER = 'invite-more-dialog';

/**
 * Represents the invite dialog in a particular participant.
 */
export default class InviteDialog extends BaseDialog {
    /**
     * Checks if the dialog is open.
     */
    async isOpen() {
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

        const elem = this.participant.driver.$(`.${CONFERENCE_ID}`);

        await elem.waitForExist({ timeout: 5000 });

        const fullText = await elem.getText();

        this.participant.log(`Extracted text in invite dialog: ${fullText}`);

        return fullText.split(':')[1].trim().replace(/[# ]/g, '');
    }
}
