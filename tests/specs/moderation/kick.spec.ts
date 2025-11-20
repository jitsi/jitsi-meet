import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { expectations } from '../../helpers/expectations';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Kick', () => {
    let p1: Participant, p2: Participant;

    it('setup', async () => {
        await ensureTwoParticipants();
        p1 = ctx.p1;
        p2 = ctx.p2;

        // We verify elsewhere (moderation.spec.ts) that the first participant is a moderator.
        if (!await p1.isModerator()) {
            ctx.skipSuiteTests = 'the first participant is not a moderator';
        }
    });

    it('kick (p2p disabled)', () => kickAndCheck(p1, p2));

    it('setup (p2p enabled)', async () => {
        await p1.hangup();
        await p2.hangup();

        await ensureTwoParticipants({
            configOverwrite: {
                p2p: {
                    enabled: true
                }
            }
        });
        p1 = ctx.p1;
        p2 = ctx.p2;
    });

    it('kick (p2p enabled)', async () => {
        await kickAndCheck(p1, p2);
    });

    it('non-moderator cannot kick', async () => {
        if (!expectations.moderation.allModerators) {
            await ensureTwoParticipants();
            p2 = ctx.p2;
            expect(await p2.isModerator()).toBe(false);

            await p2.execute(
                epId => APP.conference._room.kickParticipant(epId, 'for funzies'),
                await p1.getEndpointId()
            );

            await p1.driver.pause(3000);
            expect(await p1.isInMuc()).toBe(true);
        }
    });
});

/**
 * Kicks the second participant and checks that the participant is removed from the conference and that dialogue is open.
 */
async function kickAndCheck(kicker: Participant, kickee: Participant) {
    await kicker.getFilmstrip().kickParticipant(await kickee.getEndpointId());
    await kicker.waitForParticipants(0);

    // check that the kicked participant sees the kick reason dialog
    await kickee.driver.waitUntil(
        async () => kickee.isLeaveReasonDialogOpen(), {
            timeout: 2000,
            timeoutMsg: 'No leave reason dialog shown for p2'
        });
}
