import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'Recording button is shown to moderators and hidden from non-moderators',
    usesBrowsers: [ 'p1', 'p2' ],
    useJaas: true
});

describe('Recording button visibility', () => {
    let p1: Participant, p2: Participant;
    let localRecordingAvailable: boolean;

    it('setup', async () => {
        if (!expectations.jaas.recordingEnabled) {
            ctx.skipSuiteTests = 'Recording is not enabled in this environment';

            return;
        }

        if (expectations.moderation.allModerators) {
            ctx.skipSuiteTests = 'Cannot test non-moderator visibility when all participants are moderators';

            return;
        }

        await ensureOneParticipant();
        p1 = ctx.p1;
        expect(await p1.isModerator()).toBe(true);

        await ensureTwoParticipants();
        p2 = ctx.p2;
        expect(await p2.isModerator()).toBe(false);

        // Mirror the app's supportsLocalRecording() exactly — LocalRecordingManager.isSupported()
        // plus the (!isEmbedded() || isEmbeddedFromSameDomain()) guard — so the test's expectation
        // matches what the app actually renders. These browser/capability gates are frequently unmet
        // in the automated test browser even though local recording works in a normal browser, in
        // which case the app correctly hides the button from non-moderators.
        localRecordingAvailable = await p2.execute(() => {
            const state = APP.store.getState();
            const { localRecording } = state['features/base/config'];

            const browser = JitsiMeetJS.util.browser;
            const PREFERRED_MEDIA_TYPE = 'video/webm;codecs=vp8,opus';

            // LocalRecordingManager.isSupported()
            const isSupported = browser.isChromiumBased()
                && !browser.isElectron()
                && !browser.isReactNative()
                && !browser.isMobileDevice()

                // @ts-ignore
                && Boolean(navigator.mediaDevices.setCaptureHandleConfig)

                // @ts-ignore
                && typeof window.showSaveFilePicker !== 'undefined'
                && MediaRecorder.isTypeSupported(PREFERRED_MEDIA_TYPE);

            // (!isEmbedded() || isEmbeddedFromSameDomain())
            let embeddedOk = true;

            try {
                if (window.self !== window.top) {
                    embeddedOk = window.self.location.host === window.parent.location.host;
                }
            } catch (e) {
                embeddedOk = false;
            }

            return localRecording?.disable !== true && isSupported && embeddedOk;
        });
    });

    it('moderator sees the recording button', async () => {
        expect(await p1.getToolbar().hasRecordingButton()).toBe(true);
    });

    it('non-moderator does not see the recording button when local recording is disabled', async () => {
        if (localRecordingAvailable) {
            return;
        }
        expect(await p2.getToolbar().hasRecordingButton()).toBe(false);
    });

    it('non-moderator sees the recording button when local recording is enabled', async () => {
        if (!localRecordingAvailable) {
            return;
        }

        // TEMP DIAGNOSTIC: hand-replicating supportsLocalRecording() keeps returning true while the
        // app hides the button. Dump the deployed config + each isSupported() sub-check so the run
        // log reveals exactly which value diverges from the app. Remove once the gate is identified.
        const diag = await p2.execute(() => {
            const browser = JitsiMeetJS.util.browser;
            const state = APP.store.getState();
            const config = state['features/base/config'];

            return {
                localRecording: config.localRecording,
                recordingService: config.recordingService,
                transcription: config.transcription,

                // The web RecordButton gates on state['features/toolbox'].toolbarButtons (the
                // computed list), NOT the raw config. This is the value that actually matters.
                configToolbarButtons: config.toolbarButtons,
                toolboxToolbarButtons: state['features/toolbox'].toolbarButtons,
                toolboxHasRecording: Boolean(state['features/toolbox'].toolbarButtons?.includes('recording')),
                isChromiumBased: browser.isChromiumBased(),
                isElectron: browser.isElectron(),
                isReactNative: browser.isReactNative(),
                isMobileDevice: browser.isMobileDevice(),

                // @ts-ignore
                setCaptureHandleConfig: Boolean(navigator.mediaDevices.setCaptureHandleConfig),

                // @ts-ignore
                showSaveFilePicker: typeof window.showSaveFilePicker !== 'undefined',
                typeSupported: MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus'),
                embedded: window.self !== window.top
            };
        });

        await p2.log(`recordingButtonVisibility diagnostic: ${JSON.stringify(diag)}`);

        expect(await p2.getToolbar().hasRecordingButton()).toBe(true);
    });
});
