import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { joinMuc } from '../../helpers/joinMuc';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

// Just make sure that users are given moderator rights as specified in the expectations config.
describe('Moderation', () => {
    let p1: Participant, p2: Participant;

    it('setup', async () => {
        p1 = await joinMuc({ name: 'p1' });
        p2 = await joinMuc({ name: 'p2' });
    });
    it('first moderator', async () => {
        if (expectations.moderation.firstModerator) {
            expect(await p1.isModerator()).toBe(true);
        } else {
            expect(await p1.isModerator()).toBe(false);
        }
    });
    it('all moderators', async () => {
        if (expectations.moderation.allModerators) {
            expect(await p1.isModerator()).toBe(true);
            expect(await p2.isModerator()).toBe(true);
        }
    });
    it('auto moderator promotion', async () => {
        if (expectations.moderation.autoModerator && !expectations.moderation.allModerators) {
            expect(await p1.isModerator()).toBe(true);
            expect(await p2.isModerator()).toBe(false);
            await p1.hangup();
            await p2.driver.waitUntil(async () => (await p2.isModerator()));
        }
    });
});
