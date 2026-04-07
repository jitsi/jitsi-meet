import BaseDialog from './BaseDialog';

const VB_DIALOG_CONTAINER = '#virtual-background-dialog';
const NONE_THUMBNAIL = '[aria-label="Remove background"]';
const SLIGHT_BLUR_THUMBNAIL = '[aria-label="Half Blur"]';
const BLUR_THUMBNAIL = '[aria-label="Blur"]';

/**
 * Page object for the Virtual Background tab inside the settings dialog.
 */
export default class VirtualBackgroundDialog extends BaseDialog {
    /**
     * Waits for the virtual background dialog container to be displayed.
     */
    async waitForDisplay(): Promise<void> {
        await this.participant.driver.$(VB_DIALOG_CONTAINER).waitForDisplayed({
            timeout: 5000,
            timeoutMsg: 'Virtual background dialog not displayed'
        });
    }

    /**
     * Returns true if the dialog container is currently displayed.
     */
    isDisplayed(): Promise<boolean> {
        return this.participant.driver.$(VB_DIALOG_CONTAINER).isDisplayed();
    }

    /**
     * Clicks the "Remove background" (None) thumbnail.
     */
    async clickNone(): Promise<void> {
        await this.participant.log('VirtualBackgroundDialog: clicking None thumbnail');
        const el = this.participant.driver.$(NONE_THUMBNAIL);

        await el.waitForClickable({ timeout: 3000, timeoutMsg: 'None thumbnail not clickable' });
        await el.click();
    }

    /**
     * Clicks the "Half Blur" (slight blur) thumbnail.
     */
    async clickSlightBlur(): Promise<void> {
        await this.participant.log('VirtualBackgroundDialog: clicking Slight Blur thumbnail');
        const el = this.participant.driver.$(SLIGHT_BLUR_THUMBNAIL);

        await el.waitForClickable({ timeout: 3000, timeoutMsg: 'Slight Blur thumbnail not clickable' });
        await el.click();
    }

    /**
     * Clicks the "Blur" (full blur) thumbnail.
     */
    async clickBlur(): Promise<void> {
        await this.participant.log('VirtualBackgroundDialog: clicking Blur thumbnail');
        const el = this.participant.driver.$(BLUR_THUMBNAIL);

        await el.waitForClickable({ timeout: 3000, timeoutMsg: 'Blur thumbnail not clickable' });
        await el.click();
    }

    /**
     * Returns true if the given thumbnail element has aria-checked="true" (selected in the dialog).
     *
     * @param {string} selector - CSS selector for the thumbnail element.
     */
    async isThumbnailChecked(selector: string): Promise<boolean> {
        const el = this.participant.driver.$(selector);

        await el.waitForExist({ timeout: 2000 });

        return (await el.getAttribute('aria-checked')) === 'true';
    }

    /**
     * Returns true if the None thumbnail is currently selected in the dialog.
     */
    isNoneChecked(): Promise<boolean> {
        return this.isThumbnailChecked(NONE_THUMBNAIL);
    }

    /**
     * Returns true if the Slight Blur thumbnail is currently selected in the dialog.
     */
    isSlightBlurChecked(): Promise<boolean> {
        return this.isThumbnailChecked(SLIGHT_BLUR_THUMBNAIL);
    }

    /**
     * Returns true if the Blur thumbnail is currently selected in the dialog.
     */
    isBlurChecked(): Promise<boolean> {
        return this.isThumbnailChecked(BLUR_THUMBNAIL);
    }

    /**
     * Clicks OK to apply the selected background and close the dialog.
     */
    confirm(): Promise<void> {
        return this.clickOkButton();
    }

    /**
     * Clicks the X button to cancel without applying any changes.
     */
    cancel(): Promise<void> {
        return this.clickCloseButton();
    }
}
