import { setTestProperties } from '../../helpers/TestProperties';
import { config as testsConfig } from '../../helpers/TestsConfig';
import { joinMuc } from '../../helpers/joinMuc';

/**
 * Joins (or rejoins) p1 as a moderator with the given config.js overrides, using the shared
 * preconfigured token (see TestsConfig.ts) rather than a self-signed one. This suite only ever
 * varies config.js, never JWT feature claims — on this (non-JaaS) tenant, getRecordButtonProps()
 * and friends fall back to config alone once the JWT carries no feature claims, so the shared
 * token is enough. The JWT-feature-driven side of this same dialog (only reachable on a JaaS
 * tenant, where that config-only fallback doesn't apply) is covered separately by
 * tests/specs/jaas/recordingDialogConfig.spec.ts.
 *
 * A fresh join is required (rather than ensureOneParticipant, which no-ops if already in the
 * conference) because each test in this file exercises a different config.js combination.
 *
 * Waits for p1's moderator role to actually land client-side before returning: the server grants
 * it (the JWT's moderator claim) on every join, but the toolbar's recording button renders the
 * non-moderator "Record" label (instead of "Record & Transcribe") until that presence update is
 * processed — a gap the rest of this file otherwise has no reason to guard against itself.
 */
async function joinWithConfig(configOverwrite: Record<string, unknown>): Promise<void> {
    await joinMuc({
        name: 'p1',
        token: testsConfig.jwt.preconfiguredToken
    }, { configOverwrite });

    await ctx.p1.driver.waitUntil(() => ctx.p1.isModerator(), {
        timeout: 5_000,
        timeoutMsg: 'p1 did not become a moderator in time'
    });
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
 * Whether Dropbox is configured as a recording storage integration in this deployment
 * (config.dropbox.appKey), independent of anything this file overrides. AbstractStartRecordingDialog
 * treats it as a fallback recording service whenever recordingService.enabled is false (and prefers
 * it over an empty selection, though local recording still wins over it when both are available) —
 * so wherever "is some recording service available" is checked, Dropbox has to be accounted for too
 * on any deployment where it happens to be configured, exactly like localRecordingSupport.byBrowser.
 */
async function isDropboxEnabledInDeployment(): Promise<boolean> {
    return ctx.p1.execute(() => typeof config.dropbox?.appKey === 'string');
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
 * Full 2^3 matrix over the three independently togglable config.js flags: recordingService.enabled,
 * transcription.enabled and localRecording.disable. Expected behavior for each combination, derived
 * from the source (AbstractStartRecordingDialog(Content), recording/functions.ts#getRecordButtonProps):
 *
 *  - Every environment this suite runs against grants the local participant a default "recording"
 *    JWT feature claim regardless of authentication — confirmed via diagnostics logged below
 *    (localParticipantFeatures.recording is "true" even with no token/JWT at all). getRecordButtonProps()
 *    checks that claim *before* falling back to config-only visibility, so that fallback (which would
 *    let transcription.enabled alone drive visibility) is unreachable here: the toolbar button's
 *    visibility (and therefore whether the recording section can be inspected at all) reduces to
 *    recordingService.enabled || dropboxAvailable || localRecordingAvailable, same as
 *    recordingEnabled in getRecordButtonProps (which ORs in Dropbox too) — transcription.enabled never
 *    factors into it.
 *  - Whenever the dialog *can* open, the recording section renders — what changes is which storage
 *    service ends up selected by default: "Recording service" takes priority, then "Local recording",
 *    then "Dropbox" (see the constructor's own priority chain in AbstractStartRecordingDialog.ts).
 *  - The transcription section, its Start button, and the footer's "Start both" button are each
 *    governed purely by transcription.enabled (independent of the other two flags, since nothing is
 *    actually started in these tests) — but only reachable at all when the dialog can open in the
 *    first place, i.e. when some recording service is also available.
 *
 * The Live Streaming toolbar button is JWT-feature-gated with no config-only fallback (see
 * LiveStream/AbstractLiveStreamButton.ts), so it can't be driven by config.js alone here — that's
 * covered on the JaaS side instead, by tests/specs/jaas/recordingDialogConfig.spec.ts.
 *
 * localRecordingAvailable also depends on browser capabilities (MediaRecorder/File System Access
 * support) that are frequently unmet in the automated test browser — probed once up front, exactly
 * like recordingButtonVisibility.spec.ts does, so the per-combination expectations stay accurate
 * regardless of what the test browser actually supports. dropboxAvailable is similarly probed once,
 * since it depends on this deployment's config rather than anything this file overrides.
 */
describe('Recording dialog config matrix — recording × transcription × local recording', () => {
    // A const-bound holder object, rather than a reassigned `let`, so the it() closures created
    // inside the loop below don't trip @typescript-eslint/no-loop-func — only its properties (set
    // once, in 'setup', before any of the loop's tests run) actually change.
    const environment = { dropboxAvailable: false, localRecordingByBrowser: false };

    it('setup', async () => {
        await joinWithConfig({});
        environment.localRecordingByBrowser = await isLocalRecordingSupportedByBrowser();
        environment.dropboxAvailable = await isDropboxEnabledInDeployment();
    });

    const BOOLEANS = [ true, false ];

    for (const recordingServiceEnabled of BOOLEANS) {
        for (const transcriptionEnabled of BOOLEANS) {
            for (const localRecordingDisabled of BOOLEANS) {
                const title = `recordingService.enabled=${recordingServiceEnabled} `
                    + `transcription.enabled=${transcriptionEnabled} `
                    + `localRecording.disable=${localRecordingDisabled}`;

                it(title, async () => {
                    await joinWithConfig({
                        recordingService: { enabled: recordingServiceEnabled },
                        transcription: { enabled: transcriptionEnabled },
                        localRecording: { disable: localRecordingDisabled }
                    });

                    const p1 = ctx.p1;

                    const localRecordingAvailable = !localRecordingDisabled && environment.localRecordingByBrowser;
                    const dialogCanOpen
                        = recordingServiceEnabled || localRecordingAvailable || environment.dropboxAvailable;

                    expect(await p1.getToolbar().hasRecordingButton()).toBe(dialogCanOpen);

                    if (!dialogCanOpen) {
                        // Nothing else is inspectable: the dialog cannot be opened at all.
                        return;
                    }

                    const dialog = p1.getRecordingTranscriptionDialog();

                    await p1.getToolbar().clickRecordingButton();
                    await dialog.waitForDisplay();

                    // The recording section always renders here (same condition as dialogCanOpen);
                    // which service ends up selected is what differs.
                    await dialog.toggleRecordingOptions();

                    const expectedService = recordingServiceEnabled ? 'Recording service'
                        : localRecordingAvailable ? 'Local recording'
                            : 'Dropbox';

                    expect(await dialog.getSelectedService()).toBe(expectedService);

                    expect(await dialog.hasTranscriptionOptions()).toBe(transcriptionEnabled);
                    expect(await dialog.hasStartTranscriptionButton()).toBe(transcriptionEnabled);

                    // The footer only makes sense when both sections are present; the recording
                    // section is always present on this branch, so this reduces to transcriptionEnabled.
                    expect(await dialog.hasStartBothButton()).toBe(transcriptionEnabled);

                    await dialog.cancel();
                });
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
