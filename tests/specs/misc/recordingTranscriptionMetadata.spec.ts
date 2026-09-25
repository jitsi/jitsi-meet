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
});
