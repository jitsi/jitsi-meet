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

    it('both sections offer Start buttons when nothing is running', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.hasStartRecordingButton()).toBe(true);
        expect(await dialog.hasStartTranscriptionButton()).toBe(true);
        expect(await dialog.hasStopRecordingButton()).toBe(false);
        expect(await dialog.hasStopTranscriptionButton()).toBe(false);

        await dialog.cancel();
    });

    it('footer shows only "Start both" when nothing is running', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.hasStartBothButton()).toBe(true);
        expect(await dialog.hasStopBothButton()).toBe(false);

        await dialog.cancel();
    });

    it('start buttons are enabled when a recording service is available', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.isStartRecordingEnabled()).toBe(true);
        expect(await dialog.isStartBothEnabled()).toBe(true);

        await dialog.cancel();
    });

    it('options accordions are collapsed by default', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.hasRecordingOptions()).toBe(true);
        expect(await dialog.hasTranscriptionOptions()).toBe(true);
        expect(await dialog.isRecordingOptionsExpanded()).toBe(false);
        expect(await dialog.isTranscriptionOptionsExpanded()).toBe(false);

        // The dropdowns are only rendered once the accordions are expanded.
        expect(await dialog.hasServiceSelect()).toBe(false);
        expect(await dialog.hasLanguageSelect()).toBe(false);

        await dialog.cancel();
    });

    it('expanding recording options reveals the storage service dropdown', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        await dialog.toggleRecordingOptions();
        expect(await dialog.isRecordingOptionsExpanded()).toBe(true);
        expect(await dialog.hasServiceSelect()).toBe(true);

        // A service is preselected — the trigger shows its name.
        expect((await dialog.getSelectedService()).length).toBeGreaterThan(0);

        // Collapsing hides the options again.
        await dialog.toggleRecordingOptions();
        expect(await dialog.isRecordingOptionsExpanded()).toBe(false);
        expect(await dialog.hasServiceSelect()).toBe(false);

        await dialog.cancel();
    });

    it('expanding transcription options allows changing the language', async () => {
        const p1 = ctx.p1;
        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        await dialog.toggleTranscriptionOptions();
        expect(await dialog.isTranscriptionOptionsExpanded()).toBe(true);
        expect(await dialog.hasLanguageSelect()).toBe(true);

        await dialog.selectLanguage('French');
        expect(await dialog.getSelectedLanguage()).toBe('French');

        await dialog.selectLanguage('English');
        expect(await dialog.getSelectedLanguage()).toBe('English');

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
