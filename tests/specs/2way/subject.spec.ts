import type { Participant } from '../../helpers/Participant';
import { ensureTwoParticipants } from '../../helpers/participants';

const MY_TEST_SUBJECT = 'My Test Subject';
const SUBJECT_XPATH = '//div[starts-with(@class, "subject-text")]';

describe('Subject', () => {
    it('joining the meeting', () => ensureTwoParticipants(ctx, {
        configOverwrite: {
            subject: MY_TEST_SUBJECT
        }
    }));

    it('check', async () => {
        await checkSubject(ctx.p1, MY_TEST_SUBJECT);
        await checkSubject(ctx.p2, MY_TEST_SUBJECT);
    });
});

/**
 * Check was subject set.
 *
 * @param participant
 * @param subject
 */
async function checkSubject(participant: Participant, subject: string) {
    const localTile = participant.driver.$(SUBJECT_XPATH);

    await localTile.moveTo();

    expect(await localTile.getText()).toBe(subject);
}
