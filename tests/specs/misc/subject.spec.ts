import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

const MY_TEST_SUBJECT = 'My Test Subject';
const SUBJECT_XPATH = '//div[starts-with(@class, "subject-text")]';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Subject', () => {
    it('setup', async () => {
        await ensureOneParticipant({
            configOverwrite: {
                subject: MY_TEST_SUBJECT
            }
        });
        await ensureTwoParticipants();
    });
    it('subject set locally', async () => await checkSubject(ctx.p1, MY_TEST_SUBJECT));
    it('subject set remotely', async () => await checkSubject(ctx.p2, MY_TEST_SUBJECT));
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
