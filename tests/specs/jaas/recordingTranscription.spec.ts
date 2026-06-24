import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true
});

/**
 * Joins a JaaS meeting as a moderator using the iFrame API wrapper.
 */
async function joinAsModerator(): Promise<Participant> {
    const p = await joinJaasMuc({ iFrameApi: true, token: t({ moderator: true }) });

    // joinMuc leaves an iFrame-API participant inside the iframe, but the iFrame API
    // (window.jitsiAPI) only exists in the main frame. Switch out so the first
    // getIframeAPI().executeCommand(...) in each test runs in the right context.
    await p.switchToMainFrame();

    return p;
}

/**
 * Waits for the "dialog.recording" notification to appear inside the current iframe context.
 * The notification fires whenever recording or transcription starts (or both).
 */
async function waitForRecordingNotification(p: Participant, timeoutMsg: string): Promise<void> {
    await p.driver.$('[data-testid="dialog.recording"]').waitForExist({
        timeout: 30_000,
        timeoutMsg
    });
}

/**
 * Dismisses the current "dialog.recording" notification (if it is showing) and waits for it
 * to disappear, so subsequent assertions start from a clean slate.
 */
async function dismissRecordingNotification(p: Participant): Promise<void> {
    const dismissButton = p.driver.$('[data-testid="dialog.recording-dismiss"]');

    if (await dismissButton.isExisting()) {
        await dismissButton.moveTo();
        await dismissButton.click();
        await p.driver.$('[data-testid="dialog.recording"]')
            .waitForExist({ reverse: true, timeout: 3_000 });
    }
}

/**
 * Waits until the recording feature state reports that a FILE-mode session is active.
 */
async function waitForRecordingRunning(p: Participant): Promise<void> {
    await p.driver.waitUntil(
        () => p.execute(() => Boolean(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            APP.store.getState()['features/recording'].sessionDatas.some(
                (s: any) => s.mode === 'file' && s.status !== 'off'))),
        { timeout: 30_000, timeoutMsg: 'Recording session did not become active' }
    );
}

/**
 * Waits until the transcription feature state reports that transcription is active.
 */
async function waitForTranscriptionRunning(p: Participant): Promise<void> {
    await p.driver.waitUntil(
        () => p.execute(() => Boolean(APP.store.getState()['features/transcribing'].isTranscribing)),
        { timeout: 30_000, timeoutMsg: 'Transcription did not become active' }
    );
}

/**
 * Waits until the transcription feature state reports that transcription is no longer active.
 */
async function waitForTranscriptionStopped(p: Participant): Promise<void> {
    await p.driver.waitUntil(
        () => p.execute(() => !APP.store.getState()['features/transcribing'].isTranscribing),
        { timeout: 20_000, timeoutMsg: 'Transcription did not stop' }
    );
}

/**
 * Waits until the recording feature state reports that no FILE session is active.
 */
async function waitForRecordingStopped(p: Participant): Promise<void> {
    await p.driver.waitUntil(
        () => p.execute(() => Boolean(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            APP.store.getState()['features/recording'].sessionDatas.every(
                (s: any) => s.mode !== 'file' || s.status === 'off'))),
        { timeout: 20_000, timeoutMsg: 'Recording session did not stop' }
    );
}

// ─── Nudge notification tests ────────────────────────────────────────────────

describe('Recording & transcription nudge notifications', () => {
    it('nudge shows "Start transcribing" action when only recording starts', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await p.getIframeAPI().executeCommand('startRecording', { mode: 'file' });
            await p.switchToIFrame();

            await waitForRecordingNotification(p, 'Recording-started notification did not appear');

            const nudgeButton = p.driver.$('[data-testid="dialog.startTranscribing"]');

            expect(await nudgeButton.isExisting()).toBe(true);
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file');
            await p.getIframeAPI().executeCommand('hangup');
        }
    });

    it('nudge shows "Start recording" action when only transcription starts', async () => {
        if (!expectations.jaas.transcriptionEnabled || !expectations.jaas.recordingEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await p.getIframeAPI().executeCommand('startRecording', { transcription: true });
            await p.switchToIFrame();

            await waitForRecordingNotification(p, 'Transcription-started notification did not appear');

            const nudgeButton = p.driver.$('[data-testid="dialog.startRecording"]');

            expect(await nudgeButton.isExisting()).toBe(true);
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file', true);
            await p.getIframeAPI().executeCommand('hangup');
        }
    });

    it('no spurious "recording started" notification when stopping transcription while recording runs', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await p.getIframeAPI().executeCommand('startRecording', {
                mode: 'file',
                transcription: true
            });

            await p.switchToIFrame();
            await waitForRecordingNotification(p, 'Recording+transcription start notification did not appear');
            await dismissRecordingNotification(p);
            await p.switchToMainFrame();

            // Stop only transcription while recording keeps running.
            await p.getIframeAPI().executeCommand('stopRecording', 'file', true);

            await p.switchToIFrame();

            // Give the UI time to settle — a spurious notification would appear within ~3 s.
            await p.driver.pause(4_000);

            // The description keys used on a new "recording started" notification —
            // neither must appear after a transcription-only stop.
            expect(await p.driver.$('[data-testid="recording.on"]').isExisting()).toBe(false);
            expect(await p.driver.$('[data-testid="recording.onWithTranscription"]').isExisting()).toBe(false);
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file');
            await p.getIframeAPI().executeCommand('hangup');
        }
    });
});

// ─── Manage-mode (session active) dialog tests ───────────────────────────────

describe('Recording & transcription dialog — manage mode', () => {
    it('dialog opens with recording toggle ON when recording is running', async () => {
        if (!expectations.jaas.recordingEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await p.getIframeAPI().executeCommand('startRecording', { mode: 'file' });
            await p.switchToIFrame();

            await waitForRecordingRunning(p);

            await p.getToolbar().clickRecordingButton();

            const dialog = p.getRecordingTranscriptionDialog();

            await dialog.waitForDisplay();

            expect(await dialog.isRecordingToggleChecked()).toBe(true);
            expect(await dialog.isTranscriptionToggleChecked()).toBe(false);

            await dialog.cancel();
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file');
            await p.getIframeAPI().executeCommand('hangup');
        }
    });

    it('dialog opens with transcription toggle ON when transcription is running', async () => {
        if (!expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await p.getIframeAPI().executeCommand('startRecording', { transcription: true });
            await p.switchToIFrame();

            await waitForTranscriptionRunning(p);

            await p.getToolbar().clickRecordingButton();

            const dialog = p.getRecordingTranscriptionDialog();

            await dialog.waitForDisplay();

            expect(await dialog.isTranscriptionToggleChecked()).toBe(true);
            expect(await dialog.isRecordingToggleChecked()).toBe(false);

            await dialog.cancel();
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file', true);
            await p.getIframeAPI().executeCommand('hangup');
        }
    });

    it('dialog opens with both toggles ON when both services are running', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await p.getIframeAPI().executeCommand('startRecording', {
                mode: 'file',
                transcription: true
            });
            await p.switchToIFrame();

            await waitForRecordingRunning(p);
            await waitForTranscriptionRunning(p);

            await p.getToolbar().clickRecordingButton();

            const dialog = p.getRecordingTranscriptionDialog();

            await dialog.waitForDisplay();

            expect(await dialog.isRecordingToggleChecked()).toBe(true);
            expect(await dialog.isTranscriptionToggleChecked()).toBe(true);

            // Nothing changed yet — OK must be disabled.
            expect(await dialog.isOkButtonEnabled()).toBe(false);

            await dialog.cancel();
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file');
            await p.getIframeAPI().executeCommand('hangup');
        }
    });

    it('can stop transcription independently while recording keeps running', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await p.getIframeAPI().executeCommand('startRecording', {
                mode: 'file',
                transcription: true
            });
            await p.switchToIFrame();

            await waitForRecordingRunning(p);
            await waitForTranscriptionRunning(p);

            // Open dialog: both toggles on.
            await p.getToolbar().clickRecordingButton();

            const dialog = p.getRecordingTranscriptionDialog();

            await dialog.waitForDisplay();

            // Turn transcription off, leave recording on.
            await dialog.clickTranscriptionToggle();
            expect(await dialog.isTranscriptionToggleChecked()).toBe(false);
            expect(await dialog.isRecordingToggleChecked()).toBe(true);
            expect(await dialog.isOkButtonEnabled()).toBe(true);

            await dialog.confirm();

            // Transcription should stop.
            await waitForTranscriptionStopped(p);

            // Recording should still be running.
            const recordingStillOn = await p.execute(() => Boolean(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                APP.store.getState()['features/recording'].sessionDatas.some(
                    (s: any) => s.mode === 'file' && s.status !== 'off')
            ));

            expect(recordingStillOn).toBe(true);
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file');
            await p.getIframeAPI().executeCommand('hangup');
        }
    });

    it('can stop recording independently while transcription keeps running', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await p.getIframeAPI().executeCommand('startRecording', {
                mode: 'file',
                transcription: true
            });
            await p.switchToIFrame();

            await waitForRecordingRunning(p);
            await waitForTranscriptionRunning(p);

            // Open dialog: both toggles on.
            await p.getToolbar().clickRecordingButton();

            const dialog = p.getRecordingTranscriptionDialog();

            await dialog.waitForDisplay();

            // Turn recording off, leave transcription on.
            await dialog.clickRecordingToggle();
            expect(await dialog.isRecordingToggleChecked()).toBe(false);
            expect(await dialog.isTranscriptionToggleChecked()).toBe(true);
            expect(await dialog.isOkButtonEnabled()).toBe(true);

            await dialog.confirm();

            // Recording should stop.
            await waitForRecordingStopped(p);

            // Transcription should still be running.
            const transcriptionStillOn = await p.execute(
                () => Boolean(APP.store.getState()['features/transcribing'].isTranscribing)
            );

            expect(transcriptionStillOn).toBe(true);
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file', true);
            await p.getIframeAPI().executeCommand('hangup');
        }
    });
});

// ─── Button visibility ────────────────────────────────────────────────────────

describe('Recording button visibility', () => {
    it('moderator button has aria-label "Record & Transcribe"', async () => {
        if (!expectations.jaas.recordingEnabled) {
            return;
        }

        const p = await joinJaasMuc({ token: t({ moderator: true }) });

        expect(await p.getToolbar().hasRecordingButton()).toBe(true);

        // This participant joined without the iFrame API, so close it directly rather than via
        // getIframeAPI().executeCommand (window.jitsiAPI only exists in the iFrame-API wrapper page).
        await p.hangup();
    });
});
