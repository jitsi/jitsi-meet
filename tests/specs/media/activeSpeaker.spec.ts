import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import { checkForScreensharingTile, ensureThreeParticipants, hangupAllParticipants } from '../../helpers/participants';
import { muteAudioAndCheck } from '../helpers/mute';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2', 'p3' ]
});

describe('Active speaker', () => {
    it('testActiveSpeaker', async () => {
        await ensureThreeParticipants();

        const { p1, p2, p3 } = ctx;

        // Exit tile view to enter stage view (default for 3 participants is tile view)
        await p1.getToolbar().clickExitTileViewButton();
        await p1.waitForTileViewDisplayed(true);

        await p2.getToolbar().clickExitTileViewButton();
        await p2.waitForTileViewDisplayed(true);

        await p3.getToolbar().clickExitTileViewButton();
        await p3.waitForTileViewDisplayed(true);

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

    it('testLocalDominantSpeakerShowsLastRemote', async () => {
        await ensureThreeParticipants();

        const { p1, p2, p3 } = ctx;
        const p2EndpointId = await p2.getEndpointId();
        const p3EndpointId = await p3.getEndpointId();

        // p2 speaks first
        await p2.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId, 'P2 not displayed as dominant speaker on P1');
        await p2.getToolbar().clickAudioMuteButton();

        // p3 speaks second
        await p3.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p3EndpointId, 'P3 not displayed as dominant speaker on P1');
        await p3.getToolbar().clickAudioMuteButton();

        // Now p1 starts screenshare and becomes dominant speaker
        await p1.getToolbar().clickDesktopSharingButton();

        // p1 should see p3 (last remote dominant speaker) on stage
        await p1.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p3EndpointId, 'P1 should see P3 (last remote speaker) on stage when local is dominant');

        // Check that p2 and p3 tiles remain visible in filmstrip on p1
        await p1.driver.$(`//span[@id='participant_${p2EndpointId}']`).waitForDisplayed({
            timeout: 3_000,
            timeoutMsg: 'P2 tile should remain visible in filmstrip during screenshare'
        });
        await p1.driver.$(`//span[@id='participant_${p3EndpointId}']`).waitForDisplayed({
            timeout: 3_000,
            timeoutMsg: 'P3 tile should remain visible in filmstrip during screenshare'
        });

        await p1.getToolbar().clickAudioMuteButton();
        await p1.getToolbar().clickStopDesktopSharingButton();
    });

    it('testAlternatingLocalAndRemoteDominantSpeaker', async () => {
        await ensureThreeParticipants();

        const { p1, p2, p3 } = ctx;
        const p2EndpointId = await p2.getEndpointId();
        const p3EndpointId = await p3.getEndpointId();

        // Test alternating pattern: p2 -> p1 (local) -> p3 -> p1 (local) -> p2
        // This tests that local dominant speaker consistently shows last remote speaker

        // p2 speaks
        await p2.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId, 'P2 not shown on P1');
        await p2.getToolbar().clickAudioMuteButton();

        // p1 (local) speaks - should still show p2
        await p1.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId, 'P1 local dominant should show P2 (last remote)');
        await p1.getToolbar().clickAudioMuteButton();

        // p3 speaks
        await p3.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p3EndpointId, 'P3 not shown on P1');
        await p3.getToolbar().clickAudioMuteButton();

        // p1 (local) speaks again - should now show p3
        await p1.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p3EndpointId, 'P1 local dominant should show P3 (last remote)');
        await p1.getToolbar().clickAudioMuteButton();

        // p2 speaks again
        await p2.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId, 'P2 not shown on P1 after second speak');
        await p2.getToolbar().clickAudioMuteButton();

        // p1 (local) speaks - should show p2 again
        await p1.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(p2EndpointId, 'P1 local dominant should show P2 (last remote) again');
        await p1.getToolbar().clickAudioMuteButton();
    });

    it('testDominantSpeakerWithSimultaneousSpeakers', async () => {
        await ensureThreeParticipants();

        const { p1, p2, p3 } = ctx;
        const p2EndpointId = await p2.getEndpointId();
        const p3EndpointId = await p3.getEndpointId();

        // Multiple participants unmute simultaneously (this is the scenario we're testing)
        await p2.getToolbar().clickAudioUnmuteButton();
        await p3.getToolbar().clickAudioUnmuteButton();

        // Wait for one to become dominant (bridge will pick one)
        await p1.waitForAnyParticipantOnLargeVideo(
            [ p2EndpointId, p3EndpointId ],
            'No dominant speaker detected when multiple speak simultaneously');

        // Get which one was selected as dominant
        const firstDominant = await p1.getLargeVideo().getResource();

        // Mute both
        await Promise.all([
            p2.getToolbar().clickAudioMuteButton(),
            p3.getToolbar().clickAudioMuteButton()
        ]);

        // Now p1 becomes local dominant speaker
        // Should show the last remote dominant speaker (firstDominant)
        await p1.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(
            firstDominant,
            'Local dominant should show last remote dominant after simultaneous speakers');

        await p1.getToolbar().clickAudioMuteButton();
    });

    it('testRemoteTilesVisibleWhenRemoteStartsScreenshare', async () => {
        await hangupAllParticipants();
        await ensureThreeParticipants();

        const { p1, p2, p3 } = ctx;
        const p2EndpointId = await p2.getEndpointId();
        const p3EndpointId = await p3.getEndpointId();

        // Exit tile view on p1
        await p1.getToolbar().clickExitTileViewButton();
        await p1.waitForTileViewDisplayed(true);

        // Mute all participants
        await muteAudioAndCheck(p1, p2);
        await muteAudioAndCheck(p2, p1);
        await muteAudioAndCheck(p3, p1);

        // Verify both p2 and p3 are visible before screenshare
        await p1.driver.$(`//span[@id='participant_${p2EndpointId}']`).waitForDisplayed({
            timeout: 3_000,
            timeoutMsg: 'P2 tile should be visible before screenshare'
        });
        await p1.driver.$(`//span[@id='participant_${p3EndpointId}']`).waitForDisplayed({
            timeout: 3_000,
            timeoutMsg: 'P3 tile should be visible before screenshare'
        });

        // Unmute p3 to make them dominant speaker.
        await p3.getToolbar().clickAudioUnmuteButton();
        await p1.waitForParticipantOnLargeVideo(
            p3EndpointId,
            'P3 should be dominant speaker on P1 before screenshare'
        );
        await p3.getToolbar().clickAudioMuteButton();

        // p2 starts screensharing and becomes dominant speaker
        await p2.getToolbar().clickDesktopSharingButton();
        await p2.getToolbar().clickAudioUnmuteButton();

        // Check screenshare tiles are created
        await checkForScreensharingTile(p2, p1);
        await checkForScreensharingTile(p2, p2);

        // Wait for p2 to be on large video on p1
        await p1.waitForParticipantOnLargeVideo(
            `${p2EndpointId}-v1`,
            'P2 screenshare should be on large video on P1',
            10_000
        );

        // Verify that both p2 and p3 camera tiles remain visible in filmstrip
        // Even though p2 is screensharing, their camera tile should still be visible
        await p1.driver.$(`//span[@id='participant_${p2EndpointId}']`).waitForDisplayed({
            timeout: 3_000,
            timeoutMsg: 'P2 camera tile should remain visible in filmstrip during their screenshare'
        });
        await p1.driver.$(`//span[@id='participant_${p3EndpointId}']`).waitForDisplayed({
            timeout: 3_000,
            timeoutMsg: 'P3 tile should remain visible in filmstrip during P2 screenshare'
        });
    });

    it('testFilmstripTilesWithMultipleScreenshares', async () => {
        await hangupAllParticipants();
        await ensureThreeParticipants();

        const { p1, p2, p3 } = ctx;
        const p1EndpointId = await p1.getEndpointId();
        const p2EndpointId = await p2.getEndpointId();

        // Exit tile view on all participants
        await p1.getToolbar().clickExitTileViewButton();
        await p1.waitForTileViewDisplayed(true);

        // Mute all participants
        await muteAudioAndCheck(p1, p2);
        await muteAudioAndCheck(p2, p1);
        await muteAudioAndCheck(p3, p1);

        // p1 starts screensharing
        await p1.getToolbar().clickDesktopSharingButton();
        await checkForScreensharingTile(p1, p2);

        // p2 also starts screensharing
        await p2.getToolbar().clickDesktopSharingButton();
        await checkForScreensharingTile(p2, p1);

        // Verify all camera tiles are still visible on p3's view
        await p3.driver.$(`//span[@id='participant_${p1EndpointId}']`).waitForDisplayed({
            timeout: 3_000,
            timeoutMsg: 'P1 camera tile should be visible on P3 during multiple screenshares'
        });
        await p3.driver.$(`//span[@id='participant_${p2EndpointId}']`).waitForDisplayed({
            timeout: 3_000,
            timeoutMsg: 'P2 camera tile should be visible on P3 during multiple screenshares'
        });

        // Verify screenshare tiles are present
        await checkForScreensharingTile(p1, p3);
        await checkForScreensharingTile(p2, p3);
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
    await activeSpeaker.log(`Start testActiveSpeaker for participant: ${activeSpeaker.name}`);

    const speakerEndpoint = await activeSpeaker.getEndpointId();

    // just a debug print to go in logs
    await activeSpeaker.log('Unmuting in testActiveSpeaker');

    // Unmute
    await activeSpeaker.getToolbar().clickAudioUnmuteButton();

    // just a debug print to go in logs
    await otherParticipant1.log(`Participant unmuted in testActiveSpeaker ${speakerEndpoint}`);
    await otherParticipant2.log(`Participant unmuted in testActiveSpeaker ${speakerEndpoint}`);

    await activeSpeaker.getFilmstrip().assertAudioMuteIconIsDisplayed(activeSpeaker, true);

    // Verify that the user is now an active speaker from otherParticipant1's perspective
    await otherParticipant1.waitForParticipantOnLargeVideo(speakerEndpoint,
        `Active speaker ${activeSpeaker.name} not displayed on large video.`,
        30_000); // 30 seconds
    await otherParticipant2.waitForParticipantOnLargeVideo(speakerEndpoint,
        `Active speaker ${activeSpeaker.name} not displayed on large video.`,
        30_000); // 30 seconds

    // just a debug print to go in logs
    await activeSpeaker.log('Muting in testActiveSpeaker');

    // Mute back again
    await activeSpeaker.getToolbar().clickAudioMuteButton();

    // just a debug print to go in logs
    await otherParticipant1.log(`Participant muted in testActiveSpeaker ${speakerEndpoint}`);
    await otherParticipant2.log(`Participant muted in testActiveSpeaker ${speakerEndpoint}`);

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
