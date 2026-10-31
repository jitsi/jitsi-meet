import { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants, joinThirdParticipant } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

/**
 * A YouTube id, so remote participants play it without a confirmation dialog.
 */
const VIDEO_ID = 'xvFZjo5PgG0';

describe('Shared video', () => {
    let p1: Participant, p2: Participant;
    let p1Id: string, p2Id: string;

    it('setup', async () => {
        await ensureTwoParticipants();
        p1 = ctx.p1;
        p2 = ctx.p2;
        p1Id = await p1.getEndpointId();
        p2Id = await p2.getEndpointId();
    });

    it('share and stop a video', async () => {
        await sendSharedVideoCommand(p1, VIDEO_ID, 'start');

        await waitForSharedVideoParticipant(p1);
        await waitForSharedVideoParticipant(p2);

        // The way stopSharedVideo() stops it: the owner clears its state, then sends the stop command.
        await p1.execute(() => APP.store.dispatch({ type: 'RESET_SHARED_VIDEO_STATUS' }));

        await waitForSharedVideoParticipant(p1, true);
        await waitForSharedVideoParticipant(p2, true);
    });

    it('start with the id of a participant', async () => {
        await sendSharedVideoCommand(p2, p1Id, 'start');
        await p1.driver.pause(3000);

        expect(await getParticipantInfo(p1, p1Id)).toEqual({ exists: true, fake: false });
        expect(await getParticipantInfo(p2, p1Id)).toEqual({ exists: true, fake: false });
    });

    it('stop with the id of another participant', async () => {
        await sendSharedVideoCommand(p2, p1Id, 'stop');
        await p1.driver.pause(3000);

        expect(await getParticipantInfo(p1, p1Id)).toEqual({ exists: true, fake: false });
        expect(await getParticipantInfo(p2, p1Id)).toEqual({ exists: true, fake: false });
    });

    it('stop with the id of the sender', async () => {
        await sendSharedVideoCommand(p2, p2Id, 'stop');
        await p1.driver.pause(3000);

        expect(await getParticipantInfo(p1, p2Id)).toEqual({ exists: true, fake: false });
        expect(await getParticipantInfo(p2, p2Id)).toEqual({ exists: true, fake: false });
    });

    it('late joiner sees all participants', async () => {
        // The last stop command stays in p2's presence, so the new participant receives it on join.
        const p3 = await joinThirdParticipant();

        await p3.waitToJoinMUC();
        await p3.waitForParticipants(2);
        await p3.driver.pause(3000);

        expect(await getParticipantInfo(p3, p1Id)).toEqual({ exists: true, fake: false });
        expect(await getParticipantInfo(p3, p2Id)).toEqual({ exists: true, fake: false });
    });
});

/**
 * Sends a shared video command the way sendShareVideoCommand() does.
 *
 * @param {Participant} sender - The participant to send the command.
 * @param {string} value - The id of the video.
 * @param {string} state - The playback state.
 * @returns {Promise<void>}
 */
async function sendSharedVideoCommand(sender: Participant, value: string, state: string) {
    await sender.execute((v, s) => {
        const room = APP.conference._room;

        room.sendCommandOnce('shared-video', {
            value: v,
            attributes: {
                from: room.myUserId(),
                muted: true,
                state: s,
                time: 0
            }
        });
    }, value, state);
}

/**
 * Returns whether the observer knows a participant with the given id, and whether it is a fake participant.
 *
 * @param {Participant} observer - The participant whose state to read.
 * @param {string} id - The id of the participant.
 * @returns {Promise<{ exists: boolean, fake: boolean }>}
 */
function getParticipantInfo(observer: Participant, id: string) {
    return observer.execute(participantId => {
        const { local, remote } = APP.store.getState()['features/base/participants'];
        const participant = local?.id === participantId ? local : remote.get(participantId);

        return {
            exists: Boolean(participant),
            fake: Boolean(participant?.fakeParticipant)
        };
    }, id);
}

/**
 * Waits for the shared video participant to show up, or to go away.
 *
 * @param {Participant} observer - The participant whose state to read.
 * @param {boolean} reverse - Whether to wait for it to go away.
 * @returns {Promise<void>}
 */
async function waitForSharedVideoParticipant(observer: Participant, reverse = false) {
    await observer.driver.waitUntil(
        async () => reverse !== (await observer.execute(videoId =>
            APP.store.getState()['features/base/participants'].remote.get(videoId)?.fakeParticipant
                === 'SharedVideo', VIDEO_ID)), {
            timeout: 10_000,
            timeoutMsg: `The shared video participant did not ${reverse ? 'leave' : 'join'} for ${observer.name}`
        });
}
