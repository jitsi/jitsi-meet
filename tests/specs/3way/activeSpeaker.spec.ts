import type { Participant } from '../../helpers/Participant';
import { ensureThreeParticipants, muteAudioAndCheck } from '../../helpers/participants';

describe('ActiveSpeaker', () => {
    it('testActiveSpeaker', async () => {
        await ensureThreeParticipants(ctx);

        const { p1, p2, p3 } = ctx;

        await muteAudioAndCheck(p1, p2);
        await muteAudioAndCheck(p2, p1);
        await muteAudioAndCheck(p3, p1);

        // participant1 becomes active speaker - check from participant2's perspective
        await testActiveSpeaker(p1, p2, p3);

        // participant3 becomes active speaker - check from participant2's perspective
        await testActiveSpeaker(p3, p2, p1);

        // participant2 becomes active speaker - check from participant1's perspective
        await testActiveSpeaker(p2, p1, p3);

        // check the displayed speakers, there should be only one speaker
        await assertOneDominantSpeaker(p1);
        await assertOneDominantSpeaker(p2);
        await assertOneDominantSpeaker(p3);
    });
});

/**
 * Tries to make given participant an active speaker by unmuting it.
 * Verifies from {@code participant2}'s perspective that the active speaker
 * has been displayed on the large video area. Mutes him back.
 *
 * @param {Participant} activeSpeaker - <tt>Participant</tt> instance of the participant who will be tested as an
 * active speaker.
 * @param {Participant} otherParticipant1 - <tt>Participant</tt> of the participant who will be observing and verifying
 * active speaker change.
 * @param {Participant} otherParticipant2 - Used only to print some debugging info.
 */
async function testActiveSpeaker(
        activeSpeaker: Participant, otherParticipant1: Participant, otherParticipant2: Participant) {
    activeSpeaker.log(`Start testActiveSpeaker for participant: ${activeSpeaker.name}`);

    const speakerEndpoint = await activeSpeaker.getEndpointId();

    // just a debug print to go in logs
    activeSpeaker.log('Unmuting in testActiveSpeaker');

    // Unmute
    await activeSpeaker.getToolbar().clickAudioUnmuteButton();

    // just a debug print to go in logs
    otherParticipant1.log(`Participant unmuted in testActiveSpeaker ${speakerEndpoint}`);
    otherParticipant2.log(`Participant unmuted in testActiveSpeaker ${speakerEndpoint}`);

    await activeSpeaker.getFilmstrip().assertAudioMuteIconIsDisplayed(activeSpeaker, true);

    // Verify that the user is now an active speaker from otherParticipant1's perspective
    const otherParticipant1Driver = otherParticipant1.driver;

    await otherParticipant1Driver.waitUntil(
        async () => await otherParticipant1.getLargeVideo().getResource() === speakerEndpoint,
        {
            timeout: 30_000, // 30 seconds
            timeoutMsg: 'Active speaker not displayed on large video.'
        });

    // just a debug print to go in logs
    activeSpeaker.log('Muting in testActiveSpeaker');

    // Mute back again
    await activeSpeaker.getToolbar().clickAudioMuteButton();

    // just a debug print to go in logs
    otherParticipant1.log(`Participant muted in testActiveSpeaker ${speakerEndpoint}`);
    otherParticipant2.log(`Participant muted in testActiveSpeaker ${speakerEndpoint}`);

    await otherParticipant1.getFilmstrip().assertAudioMuteIconIsDisplayed(activeSpeaker);
}

/**
 * Asserts that the number of small videos with the dominant speaker
 * indicator displayed equals 1.
 *
 * @param {Participant} participant - The participant to check.
 */
async function assertOneDominantSpeaker(participant: Participant) {
    expect(await participant.driver.$$(
        '//span[not(contains(@class, "tile-view"))]//span[contains(@class,"dominant-speaker")]').length).toBe(1);
}
