import BasePageObject from './BasePageObject';

const DIALOG_TITLE = '#dialog-title';
const CLOSE_BUTTON = '#modal-header-close-button';

const START_RECORDING = '[data-testid="recordingDialog.startRecording"]';
const STOP_RECORDING = '[data-testid="recordingDialog.stopRecording"]';
const START_TRANSCRIPTION = '[data-testid="recordingDialog.startTranscription"]';
const STOP_TRANSCRIPTION = '[data-testid="recordingDialog.stopTranscription"]';
const START_BOTH = '[data-testid="recordingDialog.startBoth"]';
const STOP_BOTH = '[data-testid="recordingDialog.stopBoth"]';

const RECORDING_OPTIONS_HEADER = '#recording-options';
const RECORDING_OPTIONS_BODY = '#recording-options-content';
const TRANSCRIPTION_OPTIONS_HEADER = '#transcription-options';
const SERVICE_SELECT = '#recording-service-select';
const SERVICE_SELECT_MENU = '#recording-service-select-menu';
const LANGUAGE_SELECT = '#transcription-language-select';
const LANGUAGE_SELECT_MENU = '#transcription-language-select-menu';
const FOLLOW_ME_RECORDER_SWITCH = '#recording-switch-follow-me';
const FILE_SHARING_SWITCH = '#recording-switch-share';
const LOCAL_RECORDING_ONLY_SELF_SWITCH = '#recording-switch-myself';

/**
 * Page object for the unified Recording & Transcription dialog: two sections
 * (audio & video recording, transcription), each with its own immediate
 * start/stop button and a collapsible options accordion, plus footer buttons
 * acting on both services at once.
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
     * Whether the recording section currently offers a Start button, i.e.
     * recording is not running.
     */
    hasStartRecordingButton(): Promise<boolean> {
        return this.participant.driver.$(START_RECORDING).isExisting();
    }

    /**
     * Whether the recording section currently offers a Stop button, i.e.
     * recording is running.
     */
    hasStopRecordingButton(): Promise<boolean> {
        return this.participant.driver.$(STOP_RECORDING).isExisting();
    }

    /**
     * Whether the transcription section currently offers a Start button.
     */
    hasStartTranscriptionButton(): Promise<boolean> {
        return this.participant.driver.$(START_TRANSCRIPTION).isExisting();
    }

    /**
     * Whether the transcription section currently offers a Stop button.
     */
    hasStopTranscriptionButton(): Promise<boolean> {
        return this.participant.driver.$(STOP_TRANSCRIPTION).isExisting();
    }

    /**
     * Whether the footer shows the "Start both" button.
     */
    hasStartBothButton(): Promise<boolean> {
        return this.participant.driver.$(START_BOTH).isExisting();
    }

    /**
     * Whether the footer shows the "Stop both" button.
     */
    hasStopBothButton(): Promise<boolean> {
        return this.participant.driver.$(STOP_BOTH).isExisting();
    }

    /**
     * Whether the recording section Start button is enabled (a usable storage
     * service is selected).
     */
    isStartRecordingEnabled(): Promise<boolean> {
        return this.participant.driver.$(START_RECORDING).isEnabled();
    }

    /**
     * Whether the footer "Start both" button is enabled.
     */
    isStartBothEnabled(): Promise<boolean> {
        return this.participant.driver.$(START_BOTH).isEnabled();
    }

    /**
     * Starts the audio & video recording. The action applies immediately and
     * closes the dialog.
     */
    async startRecording(): Promise<void> {
        await this.participant.log('RecordingTranscriptionDialog: clicking start recording');

        return this.participant.driver.$(START_RECORDING).click();
    }

    /**
     * Stops the audio & video recording. The action applies immediately and
     * closes the dialog.
     */
    async stopRecording(): Promise<void> {
        await this.participant.log('RecordingTranscriptionDialog: clicking stop recording');

        return this.participant.driver.$(STOP_RECORDING).click();
    }

    /**
     * Starts the transcription. The action applies immediately and closes the
     * dialog.
     */
    async startTranscription(): Promise<void> {
        await this.participant.log('RecordingTranscriptionDialog: clicking start transcription');

        return this.participant.driver.$(START_TRANSCRIPTION).click();
    }

    /**
     * Stops the transcription. The action applies immediately and closes the
     * dialog.
     */
    async stopTranscription(): Promise<void> {
        await this.participant.log('RecordingTranscriptionDialog: clicking stop transcription');

        return this.participant.driver.$(STOP_TRANSCRIPTION).click();
    }

    /**
     * Starts every service which is not running yet.
     */
    async startBoth(): Promise<void> {
        await this.participant.log('RecordingTranscriptionDialog: clicking start both');

        return this.participant.driver.$(START_BOTH).click();
    }

    /**
     * Stops every running service.
     */
    async stopBoth(): Promise<void> {
        await this.participant.log('RecordingTranscriptionDialog: clicking stop both');

        return this.participant.driver.$(STOP_BOTH).click();
    }

    /**
     * Whether the recording options accordion exists.
     */
    hasRecordingOptions(): Promise<boolean> {
        return this.participant.driver.$(RECORDING_OPTIONS_HEADER).isExisting();
    }

    /**
     * Whether the transcription options accordion exists.
     */
    hasTranscriptionOptions(): Promise<boolean> {
        return this.participant.driver.$(TRANSCRIPTION_OPTIONS_HEADER).isExisting();
    }

    /**
     * Whether the recording options accordion is expanded.
     */
    async isRecordingOptionsExpanded(): Promise<boolean> {
        return await this.participant.driver.$(RECORDING_OPTIONS_HEADER)
            .getAttribute('aria-expanded') === 'true';
    }

    /**
     * Whether the transcription options accordion is expanded.
     */
    async isTranscriptionOptionsExpanded(): Promise<boolean> {
        return await this.participant.driver.$(TRANSCRIPTION_OPTIONS_HEADER)
            .getAttribute('aria-expanded') === 'true';
    }

    /**
     * Expands/collapses the recording options accordion.
     */
    toggleRecordingOptions(): Promise<void> {
        return this.participant.driver.$(RECORDING_OPTIONS_HEADER).click();
    }

    /**
     * Expands/collapses the transcription options accordion.
     */
    toggleTranscriptionOptions(): Promise<void> {
        return this.participant.driver.$(TRANSCRIPTION_OPTIONS_HEADER).click();
    }

    /**
     * Whether the storage service dropdown is visible (recording options
     * expanded).
     */
    hasServiceSelect(): Promise<boolean> {
        return this.participant.driver.$(SERVICE_SELECT).isExisting();
    }

    /**
     * Whether the transcription language dropdown is visible (transcription
     * options expanded).
     */
    hasLanguageSelect(): Promise<boolean> {
        return this.participant.driver.$(LANGUAGE_SELECT).isExisting();
    }

    /**
     * The currently selected storage service, as displayed on the dropdown
     * trigger.
     */
    getSelectedService(): Promise<string> {
        return this.participant.driver.$(SERVICE_SELECT).getText();
    }

    /**
     * The currently selected transcription language, as displayed on the
     * dropdown trigger.
     */
    getSelectedLanguage(): Promise<string> {
        return this.participant.driver.$(LANGUAGE_SELECT).getText();
    }

    /**
     * Picks a storage service by its visible label (e.g. "Recording service",
     * "Dropbox", "Local recording"). The recording options accordion must be
     * expanded.
     */
    selectService(label: string): Promise<void> {
        return this._selectDropdownOption(SERVICE_SELECT, SERVICE_SELECT_MENU, label);
    }

    /**
     * Picks a transcription language by its visible label (e.g. "English").
     * The transcription options accordion must be expanded.
     */
    selectLanguage(label: string): Promise<void> {
        return this._selectDropdownOption(LANGUAGE_SELECT, LANGUAGE_SELECT_MENU, label);
    }

    /**
     * Whether the "Recorder follows me" switch is shown (moderator with a
     * cloud based service selected).
     */
    hasFollowMeRecorderSwitch(): Promise<boolean> {
        return this.participant.driver.$(FOLLOW_ME_RECORDER_SWITCH).isExisting();
    }

    /**
     * Whether the "Recorder follows me" switch is enabled (it locks while a
     * recording is in progress).
     */
    isFollowMeRecorderEnabled(): Promise<boolean> {
        return this.participant.driver.$(FOLLOW_ME_RECORDER_SWITCH).isEnabled();
    }

    /**
     * Whether the "Share the recording link" switch is shown (Jitsi
     * recording service selected and sharing is enabled server-side).
     */
    hasFileSharingSwitch(): Promise<boolean> {
        return this.participant.driver.$(FILE_SHARING_SWITCH).isExisting();
    }

    /**
     * Whether the "Record only my audio and video streams" switch is shown
     * (local recording selected).
     */
    hasLocalRecordingOnlySelfSwitch(): Promise<boolean> {
        return this.participant.driver.$(LOCAL_RECORDING_ONLY_SELF_SWITCH).isExisting();
    }

    /**
     * Toggles the "Record only my audio and video streams" switch.
     */
    toggleLocalRecordingOnlySelfSwitch(): Promise<void> {
        return this.participant.driver.$(LOCAL_RECORDING_ONLY_SELF_SWITCH).click();
    }

    /**
     * The text content of the (expanded) recording options accordion body,
     * e.g. to check for the local-recording warning texts.
     */
    getRecordingOptionsBodyText(): Promise<string> {
        return this.participant.driver.$(RECORDING_OPTIONS_BODY).getText();
    }

    /**
     * Clicks the close (X) button to dismiss the dialog.
     */
    cancel(): Promise<void> {
        return this.participant.driver.$(CLOSE_BUTTON).click();
    }

    /**
     * Opens the given dropdown and picks the option with the given visible
     * label.
     */
    private async _selectDropdownOption(
            triggerSelector: string, menuSelector: string, optionLabel: string): Promise<void> {
        const driver = this.participant.driver;

        await driver.$(triggerSelector).click();

        await driver.$(menuSelector).waitForExist({
            timeout: 3000,
            timeoutMsg: 'Dropdown menu did not open'
        });

        const option = driver.$(menuSelector).$(`[role="menuitem"][aria-label="${optionLabel}"]`);

        await option.waitForExist({
            timeout: 3000,
            timeoutMsg: `Dropdown option "${optionLabel}" not found`
        });
        await option.click();
    }
}
