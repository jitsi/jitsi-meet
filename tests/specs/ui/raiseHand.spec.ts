import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Raise hand', () => {
    it('setup', async () => {
        await ensureTwoParticipants();
    });

    it('raised hand is visible to everyone', async () => {
        const { p1, p2 } = ctx;
        const p2EndpointId = await p2.getEndpointId();

        await p2.getToolbar().clickRaiseHandButton();

        await p1.getNotifications().waitForRaisedHandNotification();
        await waitForRaisedHand(p1, p2EndpointId, true);
        await waitForRaisedHand(p2, p2EndpointId, true);
    });

    it('lowered hand is visible to everyone', async () => {
        const { p1, p2 } = ctx;
        const p2EndpointId = await p2.getEndpointId();

        await p2.getToolbar().clickLowerHandButton();

        await waitForRaisedHand(p1, p2EndpointId, false);
        await waitForRaisedHand(p2, p2EndpointId, false);
    });
});

/**
 * Waits until the observer sees the given participant in (or out of) the raised hands queue.
 *
 * @param {Participant} observer - The participant whose state is checked.
 * @param {string} participantId - The endpoint ID of the participant who raised or lowered the hand.
 * @param {boolean} raised - Whether the hand is expected to be raised.
 * @returns {Promise<void>}
 */
async function waitForRaisedHand(observer: Participant, participantId: string, raised: boolean) {
    await observer.driver.waitUntil(
        async () => {
            const queue = await observer.execute(
                () => APP.store.getState()['features/base/participants'].raisedHandsQueue.map(({ id }) => id));

            return queue.includes(participantId) === raised;
        },
        {
            timeout: 5000,
            timeoutMsg: `${observer.name} did not see the hand of ${participantId} ${raised ? 'raised' : 'lowered'}`
        });
}
