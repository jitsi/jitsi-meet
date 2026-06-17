import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'Unified Recording & Transcription dialog structure',
    usesBrowsers: [ 'p1' ],
    useJaas: true
});

describe('Recording & Transcription dialog', () => {
    it('setup', async () => {
        if (!expectations.jaas.recordingEnabled) {
            ctx.skipSuiteTests = 'Recording is not enabled in this environment';

            return;
        }

        if (!expectations.moderation.firstModerator) {
            ctx.skipSuiteTests = 'First participant must be a moderator for these tests';

            return;
        }

        await ensureOneParticipant();
        expect(await ctx.p1.isModerator()).toBe(true);
    });

    it('dialog title is "Record & Transcribe"', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.getTitle()).toBe('Record & Transcribe');

        await dialog.cancel();
    });

    it('OK button reads "Apply changes"', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.getOkButtonText()).toBe('Apply changes');

        await dialog.cancel();
    });

    it('dialog contains recording and transcription toggles', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.hasRecordingToggle()).toBe(true);
        expect(await dialog.hasTranscriptionToggle()).toBe(true);

        await dialog.cancel();
    });

    it('OK button is disabled when nothing has changed from initial state', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        // No session is running and no toggles have been changed — nothing to apply.
        expect(await dialog.isOkButtonEnabled()).toBe(false);

        await dialog.cancel();
    });

    it('OK button enables after toggling recording on', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        const wasEnabled = await dialog.isOkButtonEnabled();

        await dialog.clickRecordingToggle();

        // If the toggle moved us away from the initial state the button must be enabled.
        // If it was already enabled (e.g. autoTranscribeOnRecord pre-checked transcription)
        // it should stay enabled.
        expect(await dialog.isOkButtonEnabled()).toBe(true);

        // Verify the button was NOT enabled before the toggle (catches regressions).
        expect(wasEnabled).toBe(false);

        await dialog.cancel();
    });

    it('OK button enables after toggling transcription on', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        // Snapshot state before any interaction.
        const initiallyEnabled = await dialog.isOkButtonEnabled();

        await dialog.clickTranscriptionToggle();

        expect(await dialog.isOkButtonEnabled()).toBe(true);
        expect(initiallyEnabled).toBe(false);

        await dialog.cancel();
    });

    it('toggling and then toggling back disables OK again', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        await dialog.clickRecordingToggle();
        expect(await dialog.isOkButtonEnabled()).toBe(true);

        // Toggle back to original state — should no longer differ from running state.
        await dialog.clickRecordingToggle();
        expect(await dialog.isOkButtonEnabled()).toBe(false);

        await dialog.cancel();
    });

    it('cancel closes the dialog without errors', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();
        await dialog.cancel();

        await p1.driver.$(
            '#dialog-title'
        ).waitForExist({ reverse: true, timeout: 3000, timeoutMsg: 'Dialog did not close after cancel' });
    });

    it('dialog reopens cleanly after cancel — button is still in toolbar', async () => {
        const p1 = ctx.p1;

        // Verify the button is still accessible and the dialog can be opened again.
        expect(await p1.getToolbar().hasRecordingButton()).toBe(true);

        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.getTitle()).toBe('Record & Transcribe');

        await dialog.cancel();
    });
});
