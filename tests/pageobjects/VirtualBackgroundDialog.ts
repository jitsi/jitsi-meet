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
     * Clicks a thumbnail and waits for it to become aria-checked.
     * Ensures React has finished re-rendering before the next click, preventing
     * rapid clicks from being swallowed during reconciliation.
     *
     * @param {string} selector - CSS selector for the thumbnail.
     * @param {string} label - Human-readable label for logging.
     */
    private async clickAndWaitChecked(selector: string, label: string): Promise<void> {
        await this.participant.log(`VirtualBackgroundDialog: clicking ${label} thumbnail`);
        const el = this.participant.driver.$(selector);

        await el.waitForClickable({ timeout: 3000, timeoutMsg: `${label} thumbnail not clickable` });
        await el.click();
        await this.participant.driver.waitUntil(
            async () => (await el.getAttribute('aria-checked')) === 'true',
            { timeout: 2000, timeoutMsg: `${label} thumbnail did not become checked after click` }
        );
    }

    /**
     * Clicks the "Remove background" (None) thumbnail.
     */
    clickNone(): Promise<void> {
        return this.clickAndWaitChecked(NONE_THUMBNAIL, 'None');
    }

    /**
     * Clicks the "Half Blur" (slight blur) thumbnail.
     */
    clickSlightBlur(): Promise<void> {
        return this.clickAndWaitChecked(SLIGHT_BLUR_THUMBNAIL, 'Slight Blur');
    }

    /**
     * Clicks the "Blur" (full blur) thumbnail.
     */
    clickBlur(): Promise<void> {
        return this.clickAndWaitChecked(BLUR_THUMBNAIL, 'Blur');
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
