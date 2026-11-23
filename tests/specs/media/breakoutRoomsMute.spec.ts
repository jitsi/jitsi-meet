import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants, hangupAllParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

/**
 * Creates a breakout room, sends p2 to it and then joins it with p1, so that p1 can see p2's state there.
 *
 * @param {Participant} p1 - The moderator.
 * @param {Participant} p2 - The participant to move.
 * @returns {Promise<void>}
 */
async function moveBothToBreakoutRoom(p1: Participant, p2: Participant) {
    const p1BreakoutRooms = p1.getBreakoutRooms();

    await p1BreakoutRooms.addBreakoutRoom();
    await p1.driver.waitUntil(
        async () => await p1BreakoutRooms.getRoomsCount() === 1, {
            timeout: 5000,
            timeoutMsg: 'No breakout room added for p1'
        });

    const [ room ] = await p1BreakoutRooms.getRooms();

    await p1BreakoutRooms.sendParticipantToBreakoutRoom(p2, room.name);
    await p2.driver.waitUntil(
        async () => await p2.isInMuc() && await p2.isInBreakoutRoom(), {
            timeout: 10000,
            timeoutMsg: 'p2 did not move to the breakout room'
        });

    await (await p1BreakoutRooms.getRooms())[0].joinRoom();
    await p1.driver.waitUntil(
        async () => await p1.isInMuc() && await p1.isInBreakoutRoom(), {
            timeout: 10000,
            timeoutMsg: 'p1 did not join the breakout room'
        });
}

describe('Breakout rooms - microphone state after a move', () => {
    it('check support', async () => {
        await ensureTwoParticipants({
            skipInMeetingChecks: true,
            urlAppendString: '&config.prejoinConfig.enabled=false'
        });

        if (!await ctx.p1.isBreakoutRoomsSupported()) {
            ctx.skipSuiteTests = 'The environment does not support breakout rooms.';
        }
    });

    it('a participant who joined without media arrives muted', async () => {
        const { p1, p2 } = ctx;

        await moveBothToBreakoutRoom(p1, p2);

        await p1.waitForAudioMuted(p2, true);
        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);

        // The microphone is still available: unmuting works and p1 hears it.
        await p2.getToolbar().clickAudioUnmuteButton();
        await p1.waitForAudioMuted(p2, false);
    });

    it('an unmuted participant stays unmuted', async () => {
        await hangupAllParticipants();

        // Use a new meeting, so that the breakout room from the previous test is gone. Keep the room name suffix,
        // it matters in multi-shard testing.
        ctx.roomName += `new-${ctx.roomName}`;

        await ensureTwoParticipants();

        const { p1, p2 } = ctx;

        await p1.waitForAudioMuted(p2, false);

        await moveBothToBreakoutRoom(p1, p2);

        await p1.waitForAudioMuted(p2, false);
        await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2, true);
    });
});
