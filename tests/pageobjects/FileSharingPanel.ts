import BasePageObject from './BasePageObject';

const FILE_SHARING_TAB_ID = 'file_sharing-tab';
const FILE_SHARING_PANEL_ID = 'file_sharing-tab-panel';
const UPLOAD_BUTTON_LABEL = 'Share file';
const DOWNLOAD_BUTTON_LABEL = 'Download';
const REMOVE_BUTTON_LABEL = 'Remove';

/**
 * Page object for the file sharing panel.
 */
export default class FileSharingPanel extends BasePageObject {
    /**
     * Opens the chat sidebar and navigates to the file sharing tab.
     */
    async open(): Promise<void> {
        if (!await this.participant.driver.$('#sideToolbarContainer').isExisting()) {
            await this.participant.getToolbar().clickChatButton();
        }
        await this.participant.driver.$(`#${FILE_SHARING_TAB_ID}`).click();
    }

    /**
     * Returns whether the file sharing panel is the currently active tab.
     */
    async isActive(): Promise<boolean> {
        return this.participant.execute(() => {
            // @ts-ignore
            const state = APP?.store?.getState?.();

            return state?.['features/chat']?.focusedTab === 'file_sharing-tab';
        });
    }

    /**
     * Returns whether the upload button is enabled (not disabled).
     */
    async isUploadButtonEnabled(): Promise<boolean> {
        const btn = this.participant.driver.$(`[aria-label="${UPLOAD_BUTTON_LABEL}"]`);

        return !await btn.getAttribute('disabled');
    }

    /**
     * Uploads a file via the hidden file input.
     *
     * @param {string} localFilePath - Local path to the file to upload.
     */
    async uploadFile(localFilePath: string): Promise<void> {
        const remotePath = await this.participant.driver.uploadFile(localFilePath);
        const input = this.participant.driver.$(`#${FILE_SHARING_PANEL_ID} input[type="file"]`);

        await input.addValue(remotePath);
    }

    /**
     * Waits until a file with the given name appears in the file list.
     *
     * @param {string} fileName - The file name to wait for.
     * @param {number} timeout - Timeout in milliseconds.
     */
    async waitForFile(fileName: string, timeout = 15_000): Promise<void> {
        await this.participant.driver.$(`#${FILE_SHARING_PANEL_ID} [title="${fileName}"]`)
            .waitForExist({ timeout, timeoutMsg: `File "${fileName}" did not appear within ${timeout}ms` });
    }

    /**
     * Waits until a file with the given name disappears from the file list.
     *
     * @param {string} fileName - The file name to wait for.
     * @param {number} timeout - Timeout in milliseconds.
     */
    async waitForFileGone(fileName: string, timeout = 15_000): Promise<void> {
        await this.participant.driver.$(`#${FILE_SHARING_PANEL_ID} [title="${fileName}"]`)
            .waitForExist({ timeout, reverse: true, timeoutMsg: `File "${fileName}" still present after ${timeout}ms` });
    }

    /**
     * Returns whether a file with the given name exists in the file list.
     *
     * @param {string} fileName - The file name to check.
     */
    async hasFile(fileName: string): Promise<boolean> {
        return this.participant.driver.$(`#${FILE_SHARING_PANEL_ID} [title="${fileName}"]`).isExisting();
    }

    /**
     * Clicks the download button for the given file. Hovers over the file item first to make action buttons visible.
     *
     * @param {string} fileName - The file name to download.
     */
    async downloadFile(fileName: string): Promise<void> {
        await this.hoverOverFileItem(fileName);
        await this.participant.driver
            .$(`button[aria-label="${DOWNLOAD_BUTTON_LABEL} ${fileName}"]`)
            .click();
    }

    /**
     * Clicks the remove button for the given file. Hovers over the file item first to make action buttons visible.
     *
     * @param {string} fileName - The file name to remove.
     */
    async removeFile(fileName: string): Promise<void> {
        await this.hoverOverFileItem(fileName);
        await this.participant.driver
            .$(`button[aria-label="${REMOVE_BUTTON_LABEL} ${fileName}"]`)
            .click();
    }

    /**
     * Returns whether the remove button exists in the DOM for the given file.
     * The remove button is only rendered when the participant has the 'file-upload' JWT feature.
     *
     * @param {string} fileName - The file name.
     */
    canRemoveFile(fileName: string) {
        return this.participant.driver
            .$(`button[aria-label="${REMOVE_BUTTON_LABEL} ${fileName}"]`)
            .isExisting();
    }

    /**
     * Returns whether the download button exists in the DOM for the given file.
     *
     * @param {string} fileName - The file name.
     */
    canDownloadFile(fileName: string) {
        return this.participant.driver
            .$(`button[aria-label="${DOWNLOAD_BUTTON_LABEL} ${fileName}"]`)
            .isExisting();
    }

    /**
     * Simulates dragging a file into the conference area and dispatches drag events.
     * A dragenter event sets the React isDragging state, then after a short delay a
     * dragover event triggers the file sharing tab to open.
     */
    async simulateDragIntoConference(): Promise<void> {
        await this.participant.driver.executeAsync((done: () => void) => {
            const el = document.querySelector('[data-testid="conference-drag-zone"]') ?? document.body;

            el.dispatchEvent(new DragEvent('dragenter', {
                bubbles: true,
                cancelable: true
            }));
            setTimeout(() => {
                el.dispatchEvent(new DragEvent('dragover', {
                    bubbles: true,
                    cancelable: true
                }));
                done();
            }, 200);
        });
    }

    /**
     * Returns whether the chat sidebar is currently open.
     */
    isChatOpen() {
        return this.participant.driver.$('#sideToolbarContainer').isExisting();
    }

    /**
     * Hovers over the file item element to make its action buttons visible.
     *
     * @param {string} fileName - The file name whose item should be hovered.
     */
    private async hoverOverFileItem(fileName: string): Promise<void> {
        await this.participant.driver.$(`#${FILE_SHARING_PANEL_ID} [title="${fileName}"]`).moveTo();
    }
}
