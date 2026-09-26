import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

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
    it('a failed transcriber invite still lets remote participants see the recording start', async () => {
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

        await p1.execute(() => {
            APP.conference._room.getMetadataHandler().setMetadata('recording', {
                isRecordingRequested: false,
                isTranscribingEnabled: false
            });
        });
    });
});
