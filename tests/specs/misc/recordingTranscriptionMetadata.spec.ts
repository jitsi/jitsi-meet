import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

/**
 * The recording stopped notifications, with or without the name of who stopped it and with or
 * without transcription.
 */
const RECORDING_STOPPED_NOTIFICATIONS = '[data-testid="recording.offBy"], [data-testid="recording.off"], '
    + '[data-testid="recording.offByWithTranscription"], [data-testid="recording.offWithTranscription"]';

/**
 * Whether the deployment runs the transcriptions in the backend (async transcription). The client
 * then does not invite the transcriber itself, so the invite cannot fail.
 */
async function isAsyncTranscription(): Promise<boolean> {
    return Boolean((await ctx.p1.getRoomMetadata())?.asyncTranscription);
}

setTestProperties(__filename, {
    description: 'Room metadata written by the Recording & Transcription dialog, as seen by a remote participant',
    usesBrowsers: [ 'p1', 'p2' ]
});

/*
 * Remote participants only learn that a recording or a transcription is starting from the recording
 * room metadata: a false→true transition of isRecordingRequested makes them wait for a file recording
 * session before showing the start notification. A local recording is never announced through it,
 * so starting a transcription while one runs must not set it, or they would wait for a file
 * recording session that never comes.
 *
 * The local recording is faked on p1 by the same side-effect-free SET_LOCAL_RECORDING_RUNNING action
 * recordingDialogConfig.spec.ts uses, and p1's conference.dial() is stubbed so no transcriber is
 * actually invited: the metadata update this test checks is written regardless of it, and is a real
 * room metadata update that p2 receives.
 */
describe('Recording & Transcription dialog — room metadata', () => {
    it('setup', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                recordingService: { enabled: true },
                transcription: { enabled: true }
            },
            skipInMeetingChecks: true
        });

        await ctx.p1.driver.waitUntil(() => ctx.p1.isModerator(), {
            timeout: 5_000,
            timeoutMsg: 'p1 did not become a moderator in time'
        });
    });

    it('starting transcription during a local recording does not request a recording', async () => {
        const { p1, p2 } = ctx;

        await p1.execute(() => {
            APP.conference._room.dial = () => Promise.resolve();

            APP.store.dispatch({ type: 'SET_LOCAL_RECORDING_RUNNING',
                running: true });
        });

        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        expect(await dialog.hasStopRecordingButton()).toBe(true);

        await dialog.startTranscription();

        await p2.driver.waitUntil(async () => (await p2.getRoomMetadata())?.recording?.isTranscribingEnabled, {
            timeout: 5_000,
            timeoutMsg: 'p2 did not receive isTranscribingEnabled in the room metadata'
        });

        expect((await p2.getRoomMetadata())?.recording?.isRecordingRequested).not.toBe(true);

        await p1.execute(() => {
            APP.store.dispatch({ type: 'SET_LOCAL_RECORDING_RUNNING',
                running: false });
            APP.conference._room.getMetadataHandler().setMetadata('recording', {
                isRecordingRequested: false,
                isTranscribingEnabled: false
            });
        });
    });

    /*
     * isTranscribingEnabled is written before the transcriber is invited. When inviting it fails,
     * the flag has to be cleared while isRecordingRequested stays for the recording started along
     * with it, and remote participants must stop waiting for the transcription: once the file
     * recording session is on, they get the recording-only start notification.
     *
     * p1's conference.dial() is stubbed to fail and its conference.startRecording() to do nothing,
     * so neither a transcriber nor a Jibri is involved; the file recording session turning on is
     * then faked on p2 with the RECORDING_SESSION_UPDATED action jicofo's update would produce.
     */
    it('a failed transcriber invite still lets remote participants see the recording start', async function() {
        if (await isAsyncTranscription()) {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.skip();
        }

        const { p1, p2 } = ctx;

        await p2.driver.waitUntil(async () => !(await p2.getRoomMetadata())?.recording?.isTranscribingEnabled, {
            timeout: 5_000,
            timeoutMsg: 'the room metadata of the previous test was not reset'
        });

        await p1.execute(() => {
            APP.conference._room.dial = () => Promise.reject(new Error('simulated transcriber invite failure'));
            APP.conference._room.startRecording = () => Promise.resolve();
        });

        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();

        // Start both stays disabled while the dialog validates the Dropbox token on deployments
        // with Dropbox enabled.
        await p1.driver.waitUntil(() => dialog.isStartBothEnabled(), {
            timeout: 5_000,
            timeoutMsg: 'Start both did not become enabled'
        });

        await dialog.startBoth();

        await p2.driver.waitUntil(async () => {
            const recording = (await p2.getRoomMetadata())?.recording;

            return recording?.isRecordingRequested && !recording.isTranscribingEnabled;
        }, {
            timeout: 5_000,
            timeoutMsg: 'p2 did not see the transcription flag cleared with the recording still requested'
        });

        await p2.driver.waitUntil(async () => {
            const intent = await p2.execute(() => APP.store.getState()['features/recording'].startRecordingIntent);

            return intent?.recording === true && intent.transcription === false;
        }, {
            timeout: 5_000,
            timeoutMsg: 'p2 is still waiting for the transcription'
        });

        const p1EndpointId = await p1.getEndpointId();

        await p2.execute((initiator: string) => {
            const { mode, status } = JitsiMeetJS.constants.recording;

            APP.store.dispatch({
                type: 'RECORDING_SESSION_UPDATED',
                sessionData: {
                    id: 'fake-file-recording-for-testing',
                    initiator,
                    mode: mode.FILE,
                    status: status.ON
                }
            });
        }, p1EndpointId);

        // "recording.onBy" when p1's display name is known, "recording.on" otherwise.
        await p2.driver.$('[data-testid="recording.onBy"], [data-testid="recording.on"]').waitForExist({
            timeout: 5_000,
            timeoutMsg: 'p2 did not get the recording started notification'
        });
        expect(await p2.driver.$(
            '[data-testid="recording.onByWithTranscription"], [data-testid="recording.onWithTranscription"]'
        ).isExisting()).toBe(false);

        await p2.execute(() => {
            const { mode, status } = JitsiMeetJS.constants.recording;

            APP.store.dispatch({
                type: 'RECORDING_SESSION_UPDATED',
                sessionData: {
                    id: 'fake-file-recording-for-testing',
                    mode: mode.FILE,
                    status: status.OFF
                }
            });
        });
        await p1.execute(() => {
            APP.conference._room.getMetadataHandler().setMetadata('recording', {
                isRecordingRequested: false,
                isTranscribingEnabled: false
            });
        });
    });

    /*
     * When the recording is stopped while the transcriber invite is still pending, a later failure
     * of that invite must only clear the transcription flag: it must not bring back the recording
     * request that was cancelled meanwhile.
     *
     * p1's conference.dial() is stubbed to stay pending until the test rejects it, and the file
     * recording session the dialog needs to offer Stop recording is faked on p1.
     */
    it('a failed transcriber invite does not restore a cancelled recording request', async function() {
        if (await isAsyncTranscription()) {
            // eslint-disable-next-line @typescript-eslint/no-invalid-this
            this.skip();
        }

        const { p1, p2 } = ctx;

        await p2.driver.waitUntil(async () => {
            const recording = (await p2.getRoomMetadata())?.recording;

            return !recording?.isTranscribingEnabled && !recording?.isRecordingRequested;
        }, {
            timeout: 5_000,
            timeoutMsg: 'the room metadata of the previous test was not reset'
        });

        // The previous test's cleanup stops its (fake) recording, which p2 notifies: wait for that
        // notification to go away, so it is not taken for one caused by this test.
        await p2.driver.$(RECORDING_STOPPED_NOTIFICATIONS).waitForExist({
            reverse: true,
            timeout: 15_000,
            timeoutMsg: 'the recording stopped notification of the previous test did not go away'
        });

        await p1.execute(() => {
            APP.conference._room.dial = () => new Promise((_resolve, reject) => {
                // @ts-ignore
                window.rejectTranscriberInvite
                    = () => reject(new Error('simulated transcriber invite failure'));
            });
            APP.conference._room.startRecording = () => Promise.resolve();
            APP.conference._room.stopRecording = () => Promise.resolve();
        });

        const dialog = p1.getRecordingTranscriptionDialog();

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();
        await p1.driver.waitUntil(() => dialog.isStartBothEnabled(), {
            timeout: 5_000,
            timeoutMsg: 'Start both did not become enabled'
        });
        await dialog.startBoth();

        await p2.driver.waitUntil(async () => (await p2.getRoomMetadata())?.recording?.isRecordingRequested, {
            timeout: 5_000,
            timeoutMsg: 'p2 did not see the recording requested'
        });

        await p1.execute(() => {
            const { mode, status } = JitsiMeetJS.constants.recording;

            APP.store.dispatch({
                type: 'RECORDING_SESSION_UPDATED',
                sessionData: {
                    id: 'fake-cancelled-file-recording-for-testing',
                    mode: mode.FILE,
                    status: status.ON
                }
            });
        });

        await p1.getToolbar().clickRecordingButton();
        await dialog.waitForDisplay();
        await dialog.stopRecording();

        await p2.driver.waitUntil(async () => !(await p2.getRoomMetadata())?.recording?.isRecordingRequested, {
            timeout: 5_000,
            timeoutMsg: 'p2 did not see the recording request cancelled'
        });

        // The recording never started (p2 has no file recording session): p2 must stop waiting for
        // it, and has no recording stop to notify.
        await p2.driver.waitUntil(
            async () => !await p2.execute(() => APP.store.getState()['features/recording'].startRecordingIntent), {
                timeout: 5_000,
                timeoutMsg: 'p2 is still waiting for the cancelled recording to start'
            });
        expect(await p2.driver.$(RECORDING_STOPPED_NOTIFICATIONS).isExisting()).toBe(false);

        await p1.execute(() => {
            // @ts-ignore
            window.rejectTranscriberInvite();
        });
        await p1.driver.waitUntil(
            () => p1.execute(() => APP.store.getState()['features/subtitles']._hasError), {
                timeout: 5_000,
                timeoutMsg: 'the transcriber invite failure was not handled on p1'
            });

        // Give any metadata update sent on the failure time to reach p2.
        await p2.driver.pause(2_000);

        const recording = (await p2.getRoomMetadata())?.recording;

        expect(recording?.isRecordingRequested).not.toBe(true);
        expect(recording?.isTranscribingEnabled).not.toBe(true);

        await p1.execute(() => {
            const { mode, status } = JitsiMeetJS.constants.recording;

            APP.store.dispatch({
                type: 'RECORDING_SESSION_UPDATED',
                sessionData: {
                    id: 'fake-cancelled-file-recording-for-testing',
                    mode: mode.FILE,
                    status: status.OFF
                }
            });
            APP.conference._room.getMetadataHandler().setMetadata('recording', {
                isRecordingRequested: false,
                isTranscribingEnabled: false
            });
        });
    });

    /*
     * A normal transcription stop can clear the transcription flag after the transcriber has already
     * left the meeting. That is still a stop, and remote participants must get the transcription
     * stopped notification.
     *
     * The running transcription is faked on p2 (TRANSCRIBER_JOINED, then TRANSCRIBER_LEFT before the
     * flag is cleared), while the flag itself is set and cleared by p1 in the real room metadata.
     */
    it('a transcription stop is notified when the transcriber left before the flag was cleared', async () => {
        const { p1, p2 } = ctx;

        await p2.driver.waitUntil(async () => !(await p2.getRoomMetadata())?.recording?.isTranscribingEnabled, {
            timeout: 5_000,
            timeoutMsg: 'the room metadata of the previous test was not reset'
        });

        // Start from no pending start/stop on p2, whatever the previous tests left behind.
        await p2.execute(() => {
            APP.store.dispatch({ type: 'SET_START_RECORDING_INTENT',
                intent: null });
            APP.store.dispatch({ type: 'SET_STOP_RECORDING_INTENT',
                intent: null });
        });

        await p1.execute(() => {
            APP.conference._room.getMetadataHandler().setMetadata('recording', {
                isTranscribingEnabled: true
            });
        });
        await p2.driver.waitUntil(async () => (await p2.getRoomMetadata())?.recording?.isTranscribingEnabled, {
            timeout: 5_000,
            timeoutMsg: 'p2 did not see the transcription flag set'
        });

        await p2.execute(() => {
            APP.store.dispatch({ type: 'TRANSCRIBER_JOINED',
                transcriberJID: 'fake-transcriber-for-testing' });
        });
        await p2.execute(() => {
            APP.store.dispatch({ type: 'TRANSCRIBER_LEFT',
                transcriberJID: 'fake-transcriber-for-testing',
                abruptly: false });
        });

        await p1.execute(() => {
            APP.conference._room.getMetadataHandler().setMetadata('recording', {
                isRecordingRequested: false,
                isTranscribingEnabled: false
            });
        });

        await p2.driver.$('[data-testid="transcribing.off"]').waitForExist({
            timeout: 5_000,
            timeoutMsg: 'p2 did not get the transcription stopped notification'
        });
    });
});
