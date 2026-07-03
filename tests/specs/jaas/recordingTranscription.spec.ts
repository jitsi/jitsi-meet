import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

setTestProperties(__filename, {
    useJaas: true
});

// Counter used to give each test its own room — see joinAsModerator().
let roomCounter = 0;

/**
 * Joins a JaaS meeting as a moderator using the iFrame API wrapper.
 *
 * Each call joins a unique room. All tests in this spec otherwise share ctx.roomName, and joinMuc
 * rejoins it each test, so prosody's per-room jibri start/stop throttle (mod_filter_iq_jibri,
 * max_number_room_attempts_per_minute, default 3 — both start and stop count) accumulates across
 * the suite and trips the "started a recording too quickly" policy error. A fresh room per test
 * resets that throttle, keeping each test's ≤2 start/stop attempts well under the limit. The
 * moderator token is room-agnostic (room defaults to '*'), so it is valid for any room.
 */
async function joinAsModerator(): Promise<Participant> {
    roomCounter += 1;

    const p = await joinJaasMuc(
        { iFrameApi: true, token: t({ moderator: true }) },
        { roomName: `${ctx.roomName}-${roomCounter}` });

    // joinJaasMuc leaves the driver focused inside the Jitsi iframe, but the iFrame API
    // (window.jitsiAPI) lives on the wrapper page. Switch to the main frame so executeCommand()
    // works, matching the setup in recording.spec.ts / transcriptions.spec.ts.
    await p.switchToMainFrame();

    return p;
}

/**
 * Sends the startRecording command and waits until jicofo actually accepts it (a live FILE
 * session shows up in the recording state), retrying on silent rejection.
 *
 * A start IQ that reaches jicofo right after joining can be rejected with policy-violation
 * (type=wait) while the conference is still being set up, and the client surfaces nothing —
 * the recording just never starts. The error type says "retry later", so do that. Waiting for
 * the JVB session before starting instead is NOT an option: jicofo does not allocate a session
 * for a lone participant at all, it does so only when a second endpoint (e.g. jibri) joins.
 *
 * Expects the driver on the main frame; leaves it there.
 */
async function startFileRecording(p: Participant, options: { mode: string; transcription?: boolean; }) {
    for (let attempt = 1; attempt <= 3; attempt++) {
        await p.getIframeAPI().executeCommand('startRecording', options);
        await p.switchToIFrame();

        const accepted = await p.driver.waitUntil(
            () => p.execute(() => Boolean(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                APP.store.getState()['features/recording'].sessionDatas.some(
                    (s: any) => s.mode === 'file' && (s.status === 'pending' || s.status === 'on')))),
            { timeout: 5_000, timeoutMsg: '' }
        ).catch(() => false);

        await p.switchToMainFrame();

        if (accepted) {
            return;
        }
    }

    throw new Error('startRecording was not accepted by jicofo after 3 attempts');
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
 * Waits until the recording feature state reports that a FILE-mode session is fully ON.
 * A PENDING session is not enough: jicofo rejects a stop request for a session whose jibri
 * is still starting (policy-violation/wait), so acting on a PENDING session races the backend.
 */
async function waitForRecordingRunning(p: Participant): Promise<void> {
    await p.driver.waitUntil(
        () => p.execute(() => Boolean(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            APP.store.getState()['features/recording'].sessionDatas.some(
                (s: any) => s.mode === 'file' && s.status === 'on'))),
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
 *
 * @param {Participant} p - The participant.
 * @param {number} timeout - How long to wait, in ms.
 */
async function waitForTranscriptionStopped(p: Participant, timeout = 20_000): Promise<void> {
    await p.driver.waitUntil(
        () => p.execute(() => !APP.store.getState()['features/transcribing'].isTranscribing),
        { timeout, timeoutMsg: 'Transcription did not stop' }
    );
}

/**
 * Waits until the recording feature state reports that no FILE session is active.
 *
 * @param {Participant} p - The participant.
 * @param {number} timeout - How long to wait, in ms.
 */
async function waitForRecordingStopped(p: Participant, timeout = 20_000): Promise<void> {
    await p.driver.waitUntil(
        () => p.execute(() => Boolean(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            APP.store.getState()['features/recording'].sessionDatas.every(
                (s: any) => s.mode !== 'file' || s.status === 'off'))),
        { timeout, timeoutMsg: 'Recording session did not stop' }
    );
}

/**
 * Best-effort wait, used in cleanup, for a stopRecording command to actually take effect before the
 * participant leaves. Never fails the test — a timeout here just means the stop was slow to reflect,
 * which must not turn a passing test red during teardown.
 *
 * @param {Participant} p - The participant.
 * @param {boolean} transcription - Whether transcription was also stopped (stopRecording(..., true)).
 */
async function waitForRecordingStopExecuted(p: Participant, transcription = false): Promise<void> {
    // Short, bounded wait — this is best-effort teardown, not an assertion, so don't burn the full
    // 20s assertion timeout here.
    const cleanupTimeout = 5_000;

    await p.switchToIFrame();

    try {
        await waitForRecordingStopped(p, cleanupTimeout);

        if (transcription) {
            await waitForTranscriptionStopped(p, cleanupTimeout);
        }
    } catch (e) {
        // Best-effort cleanup — ignore timeouts so teardown never fails the test.
    }
}

// ─── Nudge notification tests ────────────────────────────────────────────────

describe('Recording & transcription nudge notifications', () => {
    it('nudge shows "Start transcribing" action when only recording starts', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await startFileRecording(p, { mode: 'file' });
            await p.switchToIFrame();

            await waitForRecordingNotification(p, 'Recording-started notification did not appear');

            const nudgeButton = p.driver.$('[data-testid="dialog.startTranscribing"]');

            // A "recording pending" notification appears (same data-testid) before the "recording
            // started" notification that actually carries the nudge, so wait for the nudge to show up
            // rather than checking immediately. The iFrame startRecording path sets
            // isTranscribingEnabled:false, so transcription never auto-starts here and the
            // "Start transcribing" nudge always applies once recording is running.
            await nudgeButton.waitForExist({
                timeout: 30_000,
                timeoutMsg: '"Start transcribing" nudge did not appear'
            });
        } finally {
            await p.switchToMainFrame();
            await p.getIframeAPI().executeCommand('stopRecording', 'file');
            await waitForRecordingStopExecuted(p);
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
            await waitForRecordingStopExecuted(p, true);
        }
    });

    it('no spurious "recording started" notification when stopping transcription while recording runs', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await startFileRecording(p, {
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
            await waitForRecordingStopExecuted(p);
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
            await startFileRecording(p, { mode: 'file' });
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
            await waitForRecordingStopExecuted(p);
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
            await waitForRecordingStopExecuted(p, true);
        }
    });

    it('dialog opens with both toggles ON when both services are running', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await startFileRecording(p, {
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
            await waitForRecordingStopExecuted(p);
        }
    });

    it('can stop transcription independently while recording keeps running', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await startFileRecording(p, {
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
            await waitForRecordingStopExecuted(p);
        }
    });

    it('can stop recording independently while transcription keeps running', async () => {
        if (!expectations.jaas.recordingEnabled || !expectations.jaas.transcriptionEnabled) {
            return;
        }

        const p = await joinAsModerator();

        try {
            await startFileRecording(p, {
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
            await waitForRecordingStopExecuted(p, true);
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

        // This participant joined without the iFrame API, so hang up via the app, not window.jitsiAPI.
        await p.hangup();
    });
});
