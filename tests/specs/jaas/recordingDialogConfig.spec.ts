import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { joinJaasMuc, generateJaasToken as t } from '../../helpers/jaas';

/**
 * Joins (or rejoins) p1 as a moderator granting only the given JWT feature claims, with no
 * config.js overrides anywhere in this file — see recordButtonProps() / isLiveStreamingButtonVisible()
 * in react/features/recording: on a JaaS (vpaas) tenant there is no config-only fallback once the
 * JWT lacks a feature claim, unlike the non-JaaS tenant, so toolbar visibility here is driven purely
 * by these feature claims against the environment's ambient (always-on, per expectations.jaas.*)
 * config. The config-driven side of this same dialog (no custom JWT, varying config.js instead) is
 * covered separately by tests/specs/misc/recordingDialogConfig.spec.ts.
 *
 * A fresh join is required (rather than ensureOneParticipant, which no-ops if already in the
 * conference) because each test in this file exercises a different set of JWT feature claims.
 */
async function joinWithFeatures(features: Record<string, boolean>): Promise<void> {
    await joinJaasMuc({
        name: 'p1',
        token: t({
            moderator: true,
            features
        })
    });
}

/**
 * Mirrors LocalRecordingManager.isSupported() plus the embedding guard that
 * supportsLocalRecording() adds — the same probe tests/specs/misc/recordingDialogConfig.spec.ts and
 * recordingButtonVisibility.spec.ts use, because these browser capability gates are frequently
 * unmet in the automated test browser regardless of any JWT feature claim.
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

setTestProperties(__filename, {
    description: 'Recording & Transcription dialog toolbar visibility across JWT feature claims',
    usesBrowsers: [ 'p1' ],
    useJaas: true
});

/*
 * Full 2^3 matrix over the three independently grantable JWT feature claims: recording,
 * transcription and livestreaming. No config.js override is used anywhere here — the environment's
 * ambient config is assumed to always enable recordingService, transcription and liveStreaming (see
 * expectations.jaas.*), so every combination below isolates the JWT-feature-gated branches of
 * getRecordButtonProps() and isLiveStreamingButtonVisible() rather than config:
 *
 *  - On a JaaS tenant, getRecordButtonProps() has no config-only fallback: the toolbar Record &
 *    Transcribe button's visibility reduces to localRecordingAvailable || recording || transcription
 *    (the JWT claims), since the ambient config enables both services.
 *  - The Live Streaming toolbar button is fully orthogonal and purely JWT-gated: only the
 *    livestreaming claim matters (see LiveStream/AbstractLiveStreamButton.ts).
 *
 * localRecordingAvailable also depends on browser capabilities (MediaRecorder/File System Access
 * support) that are frequently unmet in the automated test browser — probed once up front so the
 * per-combination expectations stay accurate regardless of what the test browser actually supports.
 */
describe('Recording dialog JWT feature matrix — recording × transcription × live streaming', () => {
    // A const-bound holder object, rather than a reassigned `let`, so the it() closures created
    // inside the loop below don't trip @typescript-eslint/no-loop-func — only its property (set
    // once, in 'setup', before any of the loop's tests run) actually changes.
    const localRecordingSupport = { byBrowser: false };

    it('setup', async () => {
        if (!expectations.jaas.recordingEnabled
                || !expectations.jaas.transcriptionEnabled
                || !expectations.jaas.liveStreamingEnabled) {
            ctx.skipSuiteTests = 'Recording, transcription and live streaming must all be enabled '
                + 'in this environment for the JWT feature claims to be the only variable';

            return;
        }

        await joinWithFeatures({
            recording: true,
            transcription: true,
            livestreaming: true
        });
        localRecordingSupport.byBrowser = await isLocalRecordingSupportedByBrowser();
    });

    const BOOLEANS = [ true, false ];

    for (const recordingFeature of BOOLEANS) {
        for (const transcriptionFeature of BOOLEANS) {
            for (const livestreamingFeature of BOOLEANS) {
                const title = `recording=${recordingFeature} `
                    + `transcription=${transcriptionFeature} `
                    + `livestreaming=${livestreamingFeature}`;

                it(title, async () => {
                    await joinWithFeatures({
                        recording: recordingFeature,
                        transcription: transcriptionFeature,
                        livestreaming: livestreamingFeature
                    });

                    const p1 = ctx.p1;

                    expect(await p1.getToolbar().hasLiveStreamingButton()).toBe(livestreamingFeature);

                    const dialogCanOpen = recordingFeature || transcriptionFeature || localRecordingSupport.byBrowser;

                    expect(await p1.getToolbar().hasRecordingButton()).toBe(dialogCanOpen);
                });
            }
        }
    }
});
