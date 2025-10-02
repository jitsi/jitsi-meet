import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { ensureOneParticipant, ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Grant moderator', () => {
    let p1: Participant, p2: Participant;

    it('setup', async () => {
        if (expectations.moderation.allModerators) {
            ctx.skipSuiteTests = true;
            console.log('Skipping because allModerators is expected.');

            return;
        }

        await ensureOneParticipant();
        p1 = ctx.p1;
        expect(await p1.isModerator()).toBe(true);

        const functionAvailable = await p1.execute(() => typeof APP.conference._room.grantOwner === 'function');

        if (expectations.moderation.grantModerator) {
            expect(functionAvailable).toBe(true);
        } else {
            if (!functionAvailable) {
                ctx.skipSuiteTests = true;
                console.log('Skipping because the grant moderator function is not available and not expected.');

                return;
            }
        }

        await ensureTwoParticipants();
        p2 = ctx.p2;
        expect(await p2.isModerator()).toBe(false);
    });

    it('grant moderator', async () => {
        await p1.getFilmstrip().grantModerator(p2);

        await p2.driver.waitUntil(
            () => p2.isModerator(),
            {
                timeout: 3000,
                timeoutMsg: 'p2 did not become moderator'
            }
        );

    });
});
