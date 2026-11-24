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

        // Diagnostics for intermittent failures here. The Start button's enabled state is driven
        // by AbstractStartRecordingDialog's own local `this.state.selectedRecordingService` —
        // that's plain React state, not redux, so APP.store.getState() can't see it.
        // state['features/recording'].selectedRecordingService (read here previously) is a
        // write-only mirror: it's only ever set by dispatch, when a user manually changes the
        // dropdown via _onSelectedRecordingServiceChanged, and nothing reads it back into this
        // component — so it reads '' in this test regardless of the real bug, which is exactly
        // why it looked identical across every prior failure and told us nothing. Read the
        // dropdown's own rendered text instead: it's rendered straight from the real local state.
        await dialog.toggleRecordingOptions();

        const diagnostics = await p1.execute(() => ({
            recordingServiceConfig: config.recordingService,
            localRecordingConfig: config.localRecording,
            reduxRecordingServiceConfig: APP.store.getState()['features/base/config'].recordingService,
            reduxLocalRecordingConfig: APP.store.getState()['features/base/config'].localRecording,
            hasDropboxToken: Boolean(APP.store.getState()['features/dropbox'].token)
        }));
        const renderedSelectedService = await dialog.getSelectedService();

        await p1.log(`Recording dialog diagnostics: ${JSON.stringify({ ...diagnostics, renderedSelectedService })}`);

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
