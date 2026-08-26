import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';
import { generateToken } from '../../helpers/token';

/**
 * Joins (or rejoins) p1 as a moderator with the given config.js overrides, granting the
 * recording/transcription/livestreaming JWT feature claims by default (see token.ts) so that the
 * dialog's behavior reflects only the config flags under test, not JWT feature availability.
 *
 * A fresh join is required (rather than ensureOneParticipant, which no-ops if already in the
 * conference) because each test in this file exercises a different config.js combination.
 */
async function joinWithConfig(configOverwrite: Record<string, unknown>): Promise<void> {
    await joinMuc({
        name: 'p1',
        token: generateToken({ moderator: true })
    }, { configOverwrite });
}

/**
 * Mirrors LocalRecordingManager.isSupported() plus the embedding guard that
 * supportsLocalRecording() adds — the same probe recordingButtonVisibility.spec.ts uses, because
 * these browser capability gates are frequently unmet in the automated test browser regardless of
 * the localRecording.disable config value.
 */
async function isLocalRecordingSupportedByBrowser(): Promise<boolean> {
    return ctx.p1.execute(() => {
        const browser = JitsiMeetJS.util.browser;
        const PREFERRED_MEDIA_TYPE = 'video/webm;codecs=vp8,opus';

        const isSupported = browser.isChromiumBased()
            && !browser.isElectron()
            && !browser.isReactNative()
            && !browser.isMobileDevice()

            // @ts-ignore
            && Boolean(navigator.mediaDevices.setCaptureHandleConfig)

            // @ts-ignore
            && typeof window.showSaveFilePicker !== 'undefined'
            && MediaRecorder.isTypeSupported(PREFERRED_MEDIA_TYPE);

        let embeddedOk = true;

        try {
            if (window.self !== window.top) {
                embeddedOk = window.self.location.host === window.parent.location.host;
            }
        } catch (e) {
            embeddedOk = false;
        }

        return isSupported && embeddedOk;
    });
}

/**
 * Fakes a "recording running" / "transcription running" state by dispatching the same low-level,
 * side-effect-free redux actions the app's own middleware dispatches once a session is actually
 * running, without going through the real start flow — which would either need a Jibri/Jigasi
 * backend (cloud recording/transcription) or hit the browser's native showSaveFilePicker dialog
 * (local recording), neither of which this environment can drive.
 *
 * - "recording running": SET_LOCAL_RECORDING_RUNNING only sets the reducer's localRecordingRunning
 *   flag (recording/middleware.ts has no side-effecting case for it, unlike START_LOCAL_RECORDING);
 *   isRecordingRunning() ORs it with cloud-recording state, so the dialog can't tell it apart from a
 *   real recording session.
 * - "transcription running": isRecorderTranscriptionsRunning() requires BOTH
 *   features/transcribing.isTranscribing (set by TRANSCRIBER_JOINED/LEFT, a pure reducer
 *   transition — see transcribing/reducer.ts) AND the conference metadata's
 *   recording.isTranscribingEnabled flag (set via UPDATE_CONFERENCE_METADATA).
 */
async function setRunningState(recordingRunning: boolean, transcriptionRunning: boolean): Promise<void> {
    await ctx.p1.execute((recording: boolean, transcription: boolean) => {
        const { dispatch } = APP.store;

        dispatch({ type: 'SET_LOCAL_RECORDING_RUNNING',
            running: recording });

        if (transcription) {
            dispatch({ type: 'TRANSCRIBER_JOINED',
                transcriberJID: 'fake-transcriber-for-testing' });
            dispatch({
                type: 'UPDATE_CONFERENCE_METADATA',
                metadata: { recording: { isTranscribingEnabled: true } }
            });
        } else {
            dispatch({ type: 'TRANSCRIBER_LEFT' });
            dispatch({ type: 'UPDATE_CONFERENCE_METADATA',
                metadata: null });
        }
    }, recordingRunning, transcriptionRunning);
}

setTestProperties(__filename, {
    description: 'Recording & Transcription dialog rendering across config.js flag combinations',
    usesBrowsers: [ 'p1' ]
});

/*
 * Full 2^4 matrix over the four independently togglable config.js flags: recordingService.enabled,
 * transcription.enabled, localRecording.disable and liveStreaming.enabled. Expected behavior for
 * each combination, derived from the source (AbstractStartRecordingDialog(Content), recording/
 * functions.ts#getRecordButtonProps, LiveStream/functions.ts#isLiveStreamingButtonVisible):
 *
 *  - The moderator token grants the recording/transcription/livestreaming JWT feature claims
 *    unconditionally (see joinWithConfig), so getRecordButtonProps() always takes its
 *    "isJwtFeatureEnabled(..., RECORDING)" branch once local recording is unavailable — meaning the
 *    toolbar button's visibility (and therefore whether the recording section can be inspected at
 *    all) reduces to recordingService.enabled || localRecordingAvailable, and does NOT by itself
 *    depend on transcription.enabled (that branch of the priority chain is never reached while the
 *    RECORDING claim is granted).
 *  - Whenever the dialog *can* open, the recording section always renders (same
 *    recordingService.enabled || localRecordingAvailable condition) — what changes is which
 *    storage service ends up selected by default: "Recording service" takes priority over "Local
 *    recording" in the dialog's constructor.
 *  - The transcription section, its Start button, and the footer's "Start both" button are each
 *    governed purely by transcription.enabled (independent of the other three flags, since nothing
 *    is actually started in these tests).
 *  - The Live Streaming toolbar button is fully orthogonal: only liveStreaming.enabled matters.
 *
 * localRecordingAvailable also depends on browser capabilities (MediaRecorder/File System Access
 * support) that are frequently unmet in the automated test browser — probed once up front, exactly
 * like recordingButtonVisibility.spec.ts does, so the per-combination expectations stay accurate
 * regardless of what the test browser actually supports.
 */
describe('Recording dialog config matrix — recording × transcription × local recording × live streaming', () => {
    // A const-bound holder object, rather than a reassigned `let`, so the it() closures created
    // inside the loop below don't trip @typescript-eslint/no-loop-func — only its property (set
    // once, in 'setup', before any of the loop's tests run) actually changes.
    const localRecordingSupport = { byBrowser: false };

    it('setup', async () => {
        if (!testsConfig.jwt.kid || !testsConfig.jwt.privateKeyPath) {
            ctx.skipSuiteTests = 'JWT signing is not configured in this environment '
                + '(JWT_KID/JWT_PRIVATE_KEY_PATH)';

            return;
        }

        await joinWithConfig({});
        localRecordingSupport.byBrowser = await isLocalRecordingSupportedByBrowser();
    });

    const BOOLEANS = [ true, false ];

    for (const recordingServiceEnabled of BOOLEANS) {
        for (const transcriptionEnabled of BOOLEANS) {
            for (const localRecordingDisabled of BOOLEANS) {
                for (const liveStreamingEnabled of BOOLEANS) {
                    const title = `recordingService.enabled=${recordingServiceEnabled} `
                        + `transcription.enabled=${transcriptionEnabled} `
                        + `localRecording.disable=${localRecordingDisabled} `
                        + `liveStreaming.enabled=${liveStreamingEnabled}`;

                    it(title, async () => {
                        await joinWithConfig({
                            recordingService: { enabled: recordingServiceEnabled },
                            transcription: { enabled: transcriptionEnabled },
                            localRecording: { disable: localRecordingDisabled },
                            liveStreaming: { enabled: liveStreamingEnabled }
                        });

                        const p1 = ctx.p1;

                        // Orthogonal to the other three flags — always checked.
                        expect(await p1.getToolbar().hasLiveStreamingButton()).toBe(liveStreamingEnabled);

                        const localRecordingAvailable = !localRecordingDisabled && localRecordingSupport.byBrowser;
                        const dialogCanOpen = recordingServiceEnabled || localRecordingAvailable;

                        expect(await p1.getToolbar().hasRecordingButton()).toBe(dialogCanOpen);

                        if (!dialogCanOpen) {
                            // Nothing else is inspectable: the dialog cannot be opened at all.
                            return;
                        }

                        const dialog = p1.getRecordingTranscriptionDialog();

                        await p1.getToolbar().clickRecordingButton();
                        await dialog.waitForDisplay();

                        // The recording section always renders here (same condition as
                        // dialogCanOpen); which service ends up selected is what differs.
                        await dialog.toggleRecordingOptions();
                        expect(await dialog.getSelectedService())
                            .toBe(recordingServiceEnabled ? 'Recording service' : 'Local recording');

                        expect(await dialog.hasTranscriptionOptions()).toBe(transcriptionEnabled);
                        expect(await dialog.hasStartTranscriptionButton()).toBe(transcriptionEnabled);

                        // The footer only makes sense when both sections are present; the recording
                        // section is always present on this branch, so this reduces to
                        // transcriptionEnabled.
                        expect(await dialog.hasStartBothButton()).toBe(transcriptionEnabled);

                        await dialog.cancel();
                    });
                }
            }
        }
    }
});

/*
 * With both services enabled and available, the 2x2 matrix of which one is actually running.
 * Expectations are read directly off web/StartRecordingDialogContent.tsx: each section swaps its
 * own Start/Stop button independently, and the footer's _renderFooter() shows "Stop both" whenever
 * ANY service is running and "Start both" whenever ANY service is NOT running — so in a mixed state
 * (one running, one not) BOTH footer buttons render at once: "Stop both" stops the running one,
 * "Start both" starts the missing one.
 */
describe('Recording dialog config — mixed running state (recording vs transcription)', () => {
    it('setup', async () => {
        if (!testsConfig.jwt.kid || !testsConfig.jwt.privateKeyPath) {
            ctx.skipSuiteTests = 'JWT signing is not configured in this environment '
                + '(JWT_KID/JWT_PRIVATE_KEY_PATH)';
        }
    });

    const RUNNING_STATE_COMBINATIONS: Array<[boolean, boolean]> = [
        [ false, false ],
        [ true, false ],
        [ false, true ],
        [ true, true ]
    ];

    for (const [ recordingRunning, transcriptionRunning ] of RUNNING_STATE_COMBINATIONS) {
        it(`recording running=${recordingRunning}, transcription running=${transcriptionRunning}`, async () => {
            await joinWithConfig({
                recordingService: { enabled: true },
                transcription: { enabled: true }
            });
            await setRunningState(recordingRunning, transcriptionRunning);

            const dialog = ctx.p1.getRecordingTranscriptionDialog();

            await ctx.p1.getToolbar().clickRecordingButton();
            await dialog.waitForDisplay();

            expect(await dialog.hasStartRecordingButton()).toBe(!recordingRunning);
            expect(await dialog.hasStopRecordingButton()).toBe(recordingRunning);
            expect(await dialog.hasStartTranscriptionButton()).toBe(!transcriptionRunning);
            expect(await dialog.hasStopTranscriptionButton()).toBe(transcriptionRunning);

            expect(await dialog.hasStopBothButton()).toBe(recordingRunning || transcriptionRunning);
            expect(await dialog.hasStartBothButton()).toBe(!recordingRunning || !transcriptionRunning);

            await dialog.cancel();
        });
    }
});

describe('Recording dialog config — recordingService.sharingEnabled', () => {
    it('setup', async () => {
        if (!testsConfig.jwt.kid || !testsConfig.jwt.privateKeyPath) {
            ctx.skipSuiteTests = 'JWT signing is not configured in this environment '
                + '(JWT_KID/JWT_PRIVATE_KEY_PATH)';
        }
    });

    it('sharingEnabled: true shows the "share the recording link" switch', async () => {
        await joinWithConfig({
            recordingService: {
                enabled: true,
                sharingEnabled: true
            }
        });

        const dialog = ctx.p1.getRecordingTranscriptionDialog();

        await ctx.p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();
        await dialog.toggleRecordingOptions();

        expect(await dialog.getSelectedService()).toBe('Recording service');
        expect(await dialog.hasFileSharingSwitch()).toBe(true);

        await dialog.cancel();
    });

    it('sharingEnabled: false hides the "share the recording link" switch', async () => {
        await joinWithConfig({
            recordingService: {
                enabled: true,
                sharingEnabled: false
            }
        });

        const dialog = ctx.p1.getRecordingTranscriptionDialog();

        await ctx.p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();
        await dialog.toggleRecordingOptions();

        expect(await dialog.getSelectedService()).toBe('Recording service');
        expect(await dialog.hasFileSharingSwitch()).toBe(false);

        await dialog.cancel();
    });
});

describe('Recording dialog config — localRecording.notifyAllParticipants', () => {
    const NOTIFICATION_WARNING = 'will not be announced to other participants';

    let localRecordingSupported: boolean;

    it('setup', async () => {
        if (!testsConfig.jwt.kid || !testsConfig.jwt.privateKeyPath) {
            ctx.skipSuiteTests = 'JWT signing is not configured in this environment '
                + '(JWT_KID/JWT_PRIVATE_KEY_PATH)';

            return;
        }

        await joinWithConfig({
            localRecording: {
                disable: false,
                notifyAllParticipants: true
            },
            recordingService: { enabled: false }
        });
        localRecordingSupported = await isLocalRecordingSupportedByBrowser();
    });

    it('notifyAllParticipants: true — no "will not be announced" warning is shown', async () => {
        if (!localRecordingSupported) {
            return;
        }

        const dialog = ctx.p1.getRecordingTranscriptionDialog();

        await ctx.p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();
        await dialog.toggleRecordingOptions();

        expect(await dialog.getRecordingOptionsBodyText()).not.toContain(NOTIFICATION_WARNING);

        await dialog.cancel();
    });

    it('notifyAllParticipants: false — the warning clears once "record only myself" is on', async () => {
        if (!localRecordingSupported) {
            return;
        }

        await joinWithConfig({
            localRecording: {
                disable: false,
                notifyAllParticipants: false
            },
            recordingService: { enabled: false }
        });

        const dialog = ctx.p1.getRecordingTranscriptionDialog();

        await ctx.p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();
        await dialog.toggleRecordingOptions();

        expect(await dialog.getRecordingOptionsBodyText()).toContain(NOTIFICATION_WARNING);

        await dialog.toggleLocalRecordingOnlySelfSwitch();

        expect(await dialog.getRecordingOptionsBodyText()).not.toContain(NOTIFICATION_WARNING);

        await dialog.cancel();
    });
});
