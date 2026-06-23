import BasePageObject from './BasePageObject';

const DIALOG_TITLE = '#dialog-title';
const OK_BUTTON = '#modal-dialog-ok-button';
const CLOSE_BUTTON = '#modal-header-close-button';
const RECORDING_SWITCH = '#recording-switch-audio-video';
const TRANSCRIPTION_SWITCH = '#recording-switch-transcription';
const RECORDING_SWITCH_LABEL = '[for="recording-switch-audio-video"]';
const TRANSCRIPTION_SWITCH_LABEL = '[for="recording-switch-transcription"]';

/**
 * Page object for the unified Recording & Transcription dialog.
 */
export default class RecordingTranscriptionDialog extends BasePageObject {
    /**
     * Waits for the dialog to be displayed.
     */
    async waitForDisplay(): Promise<void> {
        await this.participant.driver.$(DIALOG_TITLE).waitForExist({
            timeout: 5000,
            timeoutMsg: 'Recording & Transcription dialog did not appear'
        });
    }

    /**
     * Returns whether the dialog is currently open.
     */
    async isDisplayed(): Promise<boolean> {
        return this.participant.driver.$(DIALOG_TITLE).isExisting();
    }

    /**
     * Returns the dialog title text.
     */
    getTitle(): Promise<string> {
        return this.participant.driver.$(DIALOG_TITLE).getText();
    }

    /**
     * Returns the OK button text.
     */
    getOkButtonText(): Promise<string> {
        return this.participant.driver.$(OK_BUTTON).getText();
    }

    /**
     * Returns whether the OK button is enabled (not disabled).
     */
    async isOkButtonEnabled(): Promise<boolean> {
        return this.participant.driver.$(OK_BUTTON).isEnabled();
    }

    /**
     * Returns whether the recording (audio/video) toggle exists in the dialog.
     */
    hasRecordingToggle(): Promise<boolean> {
        return this.participant.driver.$(RECORDING_SWITCH).isExisting();
    }

    /**
     * Returns whether the transcription toggle exists in the dialog.
     */
    hasTranscriptionToggle(): Promise<boolean> {
        return this.participant.driver.$(TRANSCRIPTION_SWITCH).isExisting();
    }

    /**
     * Returns whether the recording (audio/video) toggle is checked.
     */
    isRecordingToggleChecked(): Promise<boolean> {
        return this.participant.driver.$(RECORDING_SWITCH).isSelected();
    }

    /**
     * Returns whether the transcription toggle is checked.
     */
    isTranscriptionToggleChecked(): Promise<boolean> {
        return this.participant.driver.$(TRANSCRIPTION_SWITCH).isSelected();
    }

    /**
     * Clicks the recording (audio/video) toggle by clicking its associated label.
     */
    async clickRecordingToggle(): Promise<void> {
        await this.participant.log('RecordingTranscriptionDialog: clicking recording toggle');

        return this.participant.driver.$(RECORDING_SWITCH_LABEL).click();
    }

    /**
     * Clicks the transcription toggle by clicking its associated label.
     */
    async clickTranscriptionToggle(): Promise<void> {
        await this.participant.log('RecordingTranscriptionDialog: clicking transcription toggle');

        return this.participant.driver.$(TRANSCRIPTION_SWITCH_LABEL).click();
    }

    /**
     * Clicks the OK / "Apply changes" button to confirm.
     */
    confirm(): Promise<void> {
        return this.participant.driver.$(OK_BUTTON).click();
    }

    /**
     * Clicks the close (X) button to dismiss the dialog without applying changes.
     */
    cancel(): Promise<void> {
        return this.participant.driver.$(CLOSE_BUTTON).click();
    }
}
