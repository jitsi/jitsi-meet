import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants, hangupAllParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Prejoin disabled', () => {
    it('joining with no prejoin - nested object', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                prejoinConfig: {
                    enabled: false
                }
            },
            skipInMeetingChecks: true,
        });

        await checkEveryoneMuted(ctx);

        await hangupAllParticipants();
    });
    it('joining with no prejoin - direct url param ', async () => {
        await ensureTwoParticipants({
            skipInMeetingChecks: true,
            urlAppendString: '&config.prejoinConfig.enabled=false'
        });

        await checkEveryoneMuted(ctx);
    });
});

async function checkEveryoneMuted({ p1, p2 }: { p1: Participant; p2: Participant; }) {
    await p1.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
    await p1.getFilmstrip().assertAudioMuteIconIsDisplayed(p1);
    await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
    await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p1);

    await p1.getParticipantsPane().assertAudioMuteIconIsDisplayed(p2);
    await p1.getParticipantsPane().assertAudioMuteIconIsDisplayed(p1);
    await p2.getParticipantsPane().assertAudioMuteIconIsDisplayed(p2);
    await p2.getParticipantsPane().assertAudioMuteIconIsDisplayed(p1);
}
