import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { ensureTwoParticipants, hangupAllParticipants } from '../../helpers/participants';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2' ]
});

describe('Prejoin disabled', () => {
    it('joining with no prejoin - nested object', async () => {
        await ensureTwoParticipants({
            configOverwrite: {
                prejoinConfig: {
                    enabled: false
                }
            },
            skipInMeetingChecks: true,
        });

        await checkEveryoneMuted(ctx);

        await hangupAllParticipants();
    });
    it('joining with no prejoin - direct url param ', async () => {
        await ensureTwoParticipants({
            skipInMeetingChecks: true,
            urlAppendString: '&config.prejoinConfig.enabled=false'
        });

        await checkEveryoneMuted(ctx);
    });
    it('moving to a breakout room keeps the microphone muted', async () => {
        const { p1, p2 } = ctx;

        if (!await p1.isBreakoutRoomsSupported()) {
            return;
        }

        const p1BreakoutRooms = p1.getBreakoutRooms();

        await p1BreakoutRooms.addBreakoutRoom();
        await p1.driver.waitUntil(
            async () => await p1BreakoutRooms.getRoomsCount() === 1, {
                timeout: 5000,
                timeoutMsg: 'No breakout room added for p1'
            });

        await p1BreakoutRooms.sendParticipantToBreakoutRoom(p2, (await p1BreakoutRooms.getRooms())[0].name);
        await p2.driver.waitUntil(
            async () => await p2.isInMuc() && await p2.isInBreakoutRoom(), {
                timeout: 10000,
                timeoutMsg: 'p2 did not move to the breakout room'
            });

        // The move may create a local audio track, but it must not be unmuted.
        await p2.driver.waitUntil(
            async () => await p2.execute(() => APP.conference.isLocalAudioMuted()), {
                timeout: 5000,
                timeoutMsg: 'p2 has an unmuted microphone after the move to the breakout room'
            });
        await p2.driver.pause(2000);
        expect(await p2.execute(() => APP.conference.isLocalAudioMuted())).toBe(true);
    });
});

async function checkEveryoneMuted({ p1, p2 }: { p1: Participant; p2: Participant; }) {
    await p1.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
    await p1.getFilmstrip().assertAudioMuteIconIsDisplayed(p1);
    await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p2);
    await p2.getFilmstrip().assertAudioMuteIconIsDisplayed(p1);

    await p1.getParticipantsPane().assertAudioMuteIconIsDisplayed(p2);
    await p1.getParticipantsPane().assertAudioMuteIconIsDisplayed(p1);
    await p2.getParticipantsPane().assertAudioMuteIconIsDisplayed(p2);
    await p2.getParticipantsPane().assertAudioMuteIconIsDisplayed(p1);
}
