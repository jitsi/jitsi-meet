import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureOneParticipant, joinSecondParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

/**
 * Waits until the avatar on the participant's large video exposes the expected name, or stops being exposed when
 * {@code expected} is {@code null}. The avatar is rendered after the stage switches to the remote participant, so a
 * single read right after joining can run too early.
 *
 * @param participant - The participant whose large video to check.
 * @param expected - The name screen readers should get, or {@code null} when the avatar must be decorative.
 */
async function waitForAvatarAccessibleName(participant: Participant, expected: string | null) {
    await participant.driver.waitUntil(
        async () => await participant.getLargeVideo().getAvatarAccessibleName() === expected, {
            timeout: 5000,
            timeoutMsg: `Expected the large video avatar of ${participant.name} to announce ${
                JSON.stringify(expected)} but it did not`
        });
}

describe('Large video avatar accessible name', () => {
    it('join with cameras off', async () => {
        // p1 keeps the default UI, where the stage name badge shows the remote participant's name. p2 hides the
        // display names, so the avatar is the only thing on p2's stage that can say who is shown.
        await ensureOneParticipant({
            configOverwrite: {
                startWithVideoMuted: true
            }
        });
        await joinSecondParticipant({
            configOverwrite: {
                hideDisplayName: true,
                startWithVideoMuted: true
            }
        });

        const { p1, p2 } = ctx;

        await Promise.all([ p1.waitForIceConnected(), p2.waitForIceConnected() ]);
        await Promise.all([ p1.waitForSendReceiveData(), p2.waitForSendReceiveData() ]);
    });

    it('announces the name when the stage name badge is hidden', async () => {
        const { p1, p2 } = ctx;

        await p2.getLargeVideo().waitForSwitchTo(await p1.getEndpointId());
        await waitForAvatarAccessibleName(p2, p1.name);
    });

    it('stays decorative when the stage name badge shows the name', async () => {
        const { p1, p2 } = ctx;

        await p1.getLargeVideo().waitForSwitchTo(await p2.getEndpointId());
        await p1.assertDisplayNameVisibleOnStage(p2.name);
        await waitForAvatarAccessibleName(p1, null);
    });
});
