import { setTestProperties } from '../../helpers/TestProperties';
import { ensureThreeParticipants, ensureTwoParticipants } from '../../helpers/participants';
import { unmuteVideoAndCheck } from '../helpers/mute';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

const ITERATIONS = 50;

/**
 * Reproduces the join/leave/mute choreography of avatars.spec.ts ("when video muted" followed by
 * "email persistence") that intermittently ends with the rejoined p1 receiving no media from the
 * bridge even though p2's audio is unmuted and flowing (the only expected media, as p2's video is
 * muted). After every join the same send/receive-bitrate checks used by the ensure* helpers are
 * performed, so a forwarding failure surfaces as "expected to receive media in 15s".
 */
describe('Receive media after rejoin', () => {
    it('setup the meeting', () =>
        ensureTwoParticipants({
            skipDisplayName: true
        })
    );

    for (let iteration = 1; iteration <= ITERATIONS; iteration++) {
        it(`iteration ${iteration}`, async () => {
            let { p1 } = ctx;

            if (p1.driver.isFirefox) {
                // matches the skip in avatars.spec.ts: with FF the source mapping from jvb is
                // known to go missing and the receive checks fail
                return;
            }

            // p2 leaves and rejoins while p1's video is muted (avatars.spec "when video muted")
            await ctx.p2.hangup();

            await p1.getToolbar().clickVideoMuteButton();
            await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

            // rejoins p2; the helper runs waitForSendReceiveData + waitForRemoteStreams for both
            await ensureTwoParticipants({
                skipDisplayName: true
            });
            const { p2 } = ctx;

            // p1 unmutes, then both mute video, leaving p2's mic as the only live media source
            await unmuteVideoAndCheck(p1, p2);

            await p1.getToolbar().clickVideoMuteButton();
            await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);
            await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p1);

            await p2.getToolbar().clickVideoMuteButton();
            await p2.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);
            await p1.getParticipantsPane().assertVideoMuteIconIsDisplayed(p2);

            // p3 joins briefly and leaves, as in the original run
            await ensureThreeParticipants({
                skipDisplayName: true,
                skipInMeetingChecks: true
            });
            const { p3 } = ctx;

            await p3.waitForIceConnected();
            await p3.waitForSendReceiveData();
            await p3.hangup();

            // p1's video back on, p2 stays video-muted - the exact state before the failure
            await unmuteVideoAndCheck(p1, p2);

            // p1 hangs up and rejoins (avatars.spec "email persistence"); the helper's
            // waitForSendReceiveData is the check that failed in the original run
            await p1.hangup();

            await ensureTwoParticipants({
                skipDisplayName: true
            });
            p1 = ctx.p1;

            // explicit re-check with the iteration in the failure message
            await p1.waitForSendReceiveData(15_000, `iteration ${iteration}: media after p1 rejoin`);
        });
    }
});
