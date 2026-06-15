import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    description: 'Recording button is shown to moderators and hidden from non-moderators',
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Recording button visibility', () => {
    let p1: Participant, p2: Participant;

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
    });

    it('moderator sees the recording button', async () => {
        expect(await p1.getToolbar().hasRecordingButton()).toBe(true);
    });

    it('non-moderator does not see the recording button', async () => {
        expect(await p2.getToolbar().hasRecordingButton()).toBe(false);
    });
});
