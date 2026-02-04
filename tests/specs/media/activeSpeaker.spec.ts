import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import {
    checkForScreensharingTile,
    ensureSevenParticipants,
    ensureThreeParticipants,
    hangupAllParticipants
} from '../../helpers/participants';
import { muteAudioAndCheck } from '../helpers/mute';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7' ]
});

describe('Active speaker', () => {
    it('testActiveSpeaker', async () => {
        await ensureThreeParticipants();
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

        await hangupAllParticipants();
    });

    /**
     * Test that the dominant speaker appears in the filmstrip in stage view
     * even when alphabetically last with limited visible slots.
     * This tests the fix for the bug where dominant speakers at the bottom of
     * the alphabetically sorted list would not appear when slots were limited.
     *
     * Note: This test verifies filmstrip ordering via Redux state
     * (visibleRemoteParticipants), not large video behavior.
     */
    it('testDominantSpeakerInFilmstripWithLimitedSlots', async () => {
        await ensureSevenParticipants();
        const { p1, p2, p3, p4, p5, p6, p7 } = ctx;

        // Resize p1's window to limit filmstrip slots to 2-3 tiles
        // This creates the condition where not all participants fit in the filmstrip
        await p1.driver.setWindowSize(1024, 600);
        await p1.driver.pause(1000); // Wait for layout to adjust

        // Mute all participants initially
        await muteAudioAndCheck(p1, p2);
        await muteAudioAndCheck(p2, p1);
        await muteAudioAndCheck(p3, p1);
        await muteAudioAndCheck(p4, p1);
        await muteAudioAndCheck(p5, p1);
        await muteAudioAndCheck(p6, p1);
        await muteAudioAndCheck(p7, p1);

        // Set display names to create alphabetical ordering
        // Names chosen so p7 ("Zoe") is alphabetically last: Alice, Bob, Charlie, David, Eve, Frank, Zoe
        await p1.setLocalDisplayName('Alice');
        await p2.setLocalDisplayName('Bob');
        await p3.setLocalDisplayName('Charlie');
        await p4.setLocalDisplayName('David');
        await p5.setLocalDisplayName('Eve');
        await p6.setLocalDisplayName('Frank');
        await p7.setLocalDisplayName('Zoe');

        // Wait for display names to propagate
        await p1.driver.pause(2000);

        // Test with multiple speakers: Eve (p5), Frank (p6), and Zoe (p7)
        // This verifies the fix works for different alphabetical positions
        const speakersToTest = [
            { participant: p5, name: 'Eve' },
            { participant: p6, name: 'Frank' },
            { participant: p7, name: 'Zoe' }
        ];

        for (const { participant, name } of speakersToTest) {
            const participantId = await participant.getEndpointId();

            await p1.log(`Testing ${name} (${participantId}) as dominant speaker`);

            // Make this participant the dominant speaker by unmuting
            await participant.getToolbar().clickAudioUnmuteButton();

            // Wait for the dominant speaker state to update and filmstrip to reorder
            await p1.driver.pause(2000);

            // Verify that the participant appears in the visible remote participants
            const filmstripState = await p1.execute(() => {
                const state = APP.store.getState();
                const filmstrip = state['features/filmstrip'];
                const participants = state['features/base/participants'];

                return {
                    dominantSpeaker: participants.dominantSpeaker,
                    remoteParticipants: filmstrip.remoteParticipants,
                    visibleRemoteParticipants: Array.from(filmstrip.visibleRemoteParticipants)
                };
            });

            await p1.log(`Dominant speaker: ${filmstripState.dominantSpeaker}`);
            await p1.log(`Visible remote participants: ${JSON.stringify(filmstripState.visibleRemoteParticipants)}`);
            await p1.log(`${name} endpoint ID: ${participantId}`);
            await p1.log(`Total remote: ${filmstripState.remoteParticipants.length}, Visible: ${filmstripState.visibleRemoteParticipants.length}`);

            // Verify we actually have slot limitation (fewer visible than total)
            expect(filmstripState.visibleRemoteParticipants.length).toBeLessThan(filmstripState.remoteParticipants.length);

            // Assert that the dominant speaker is in the visible participants
            // This is the key test - even though they may be alphabetically late and slots are limited,
            // they should still be visible because the fix reserves a slot for dominant speaker
            expect(filmstripState.visibleRemoteParticipants).toContain(participantId);

            // Verify the dominant speaker thumbnail is visible in the filmstrip
            await p1.driver.$(`//span[@id='participant_${participantId}']`).waitForDisplayed({
                timeout: 5_000,
                timeoutMsg: `${name} dominant speaker thumbnail not visible in filmstrip`
            });

            // Mute this participant back before testing the next one
            await participant.getToolbar().clickAudioMuteButton();
            await p1.driver.pause(1000);
        }

        await hangupAllParticipants();
    });

    /**
     * Test dominant speaker in filmstrip with screensharing active.
     * Verifies that dominant speaker is still visible when screen shares
     * take up some of the visible slots.
     */
    it('testDominantSpeakerWithScreensharing', async () => {
        await ensureSevenParticipants();
        const { p1, p2, p3, p4, p5, p6, p7 } = ctx;


        // Resize p1's window to limit filmstrip slots
        await p1.driver.setWindowSize(1024, 600);

        // Mute all audio initially
        await muteAudioAndCheck(p1, p2);
        await muteAudioAndCheck(p2, p1);
        await muteAudioAndCheck(p3, p1);
        await muteAudioAndCheck(p4, p1);
        await muteAudioAndCheck(p5, p1);
        await muteAudioAndCheck(p6, p1);
        await muteAudioAndCheck(p7, p1);

        // Set display names
        await p1.setLocalDisplayName('Alice');
        await p2.setLocalDisplayName('Bob');
        await p3.setLocalDisplayName('Charlie');
        await p4.setLocalDisplayName('David');
        await p5.setLocalDisplayName('Eve');
        await p6.setLocalDisplayName('Frank');
        await p7.setLocalDisplayName('Zoe');

        // Start screensharing from p2
        await p2.getToolbar().clickDesktopSharingButton();
        await checkForScreensharingTile(p2, p1);

        // Test with multiple speakers while screensharing is active
        const speakersToTest = [
            { participant: p5, name: 'Eve' },
            { participant: p6, name: 'Frank' },
            { participant: p7, name: 'Zoe' }
        ];

        for (const { participant, name } of speakersToTest) {
            const participantId = await participant.getEndpointId();

            await p1.log(`Testing ${name} (${participantId}) as dominant speaker with screensharing`);

            // Make this participant the dominant speaker by unmuting
            await participant.getToolbar().clickAudioUnmuteButton();

            // Wait for dominant speaker state to update and filmstrip to reorder
            await p1.driver.pause(2000);

            // Verify dominant speaker is still visible in filmstrip despite screenshare
            const filmstripState = await p1.execute(() => {
                const state = APP.store.getState();
                const filmstrip = state['features/filmstrip'];
                const participants = state['features/base/participants'];

                return {
                    dominantSpeaker: participants.dominantSpeaker,
                    remoteParticipants: filmstrip.remoteParticipants,
                    visibleRemoteParticipants: Array.from(filmstrip.visibleRemoteParticipants)
                };
            });

            await p1.log(`Dominant speaker (with screenshare): ${filmstripState.dominantSpeaker}`);
            await p1.log(`Visible remote participants with screenshare: ${JSON.stringify(filmstripState.visibleRemoteParticipants)}`);
            await p1.log(`${name} endpoint ID: ${participantId}`);
            await p1.log(`Total remote: ${filmstripState.remoteParticipants.length}, Visible: ${filmstripState.visibleRemoteParticipants.length}`);

            // Verify we have slot limitation even with screensharing
            expect(filmstripState.visibleRemoteParticipants.length).toBeLessThan(filmstripState.remoteParticipants.length);

            // The dominant speaker should still be in the visible participants despite screenshare taking slots
            expect(filmstripState.visibleRemoteParticipants).toContain(participantId);

            // Verify thumbnail visibility
            await p1.driver.$(`//span[@id='participant_${participantId}']`).waitForDisplayed({
                timeout: 5_000,
                timeoutMsg: `${name} not visible with screensharing active`
            });

            // Mute this participant back before testing the next one
            await participant.getToolbar().clickAudioMuteButton();
            await p1.driver.pause(1000);
        }

        // Clean up - stop screensharing
        await p2.getToolbar().clickStopDesktopSharingButton();

        await hangupAllParticipants();
    });

    /**
     * Test that filmstrip maintains stable ordering when multiple speakers alternate.
     * Verifies that the alphabetical sorting prevents visual reordering when the same
     * set of speakers take turns speaking.
     */
    it('testFilmstripStableOrderingWithMultipleSpeakers', async () => {
        await ensureSevenParticipants();
        const { p1, p2, p3, p4, p5, p6, p7 } = ctx;

        // Mute all
        await muteAudioAndCheck(p1, p2);
        await muteAudioAndCheck(p2, p1);
        await muteAudioAndCheck(p3, p1);
        await muteAudioAndCheck(p4, p1);
        await muteAudioAndCheck(p5, p1);
        await muteAudioAndCheck(p6, p1);
        await muteAudioAndCheck(p7, p1);

        // Set display names
        await p1.setLocalDisplayName('Alice');
        await p2.setLocalDisplayName('Bob');
        await p3.setLocalDisplayName('Charlie');
        await p4.setLocalDisplayName('David');
        await p5.setLocalDisplayName('Eve');
        await p6.setLocalDisplayName('Frank');
        await p7.setLocalDisplayName('Zoe');

        // Test cycling through Eve, Frank, and Zoe to verify stable ordering
        const speakersToTest = [
            { participant: p5, name: 'Eve' },
            { participant: p6, name: 'Frank' },
            { participant: p7, name: 'Zoe' }
        ];

        const states = [];

        for (const { participant, name } of speakersToTest) {
            const participantId = await participant.getEndpointId();

            await p1.log(`Testing ${name} (${participantId}) for stable ordering`);

            // Make this participant speak by unmuting
            await participant.getToolbar().clickAudioUnmuteButton();

            // Wait for filmstrip to update
            await p1.driver.pause(2000);

            // Capture filmstrip state
            const filmstripState = await p1.execute(() => {
                const state = APP.store.getState()['features/filmstrip'];

                return {
                    remoteParticipants: state.remoteParticipants,
                    visibleRemoteParticipants: Array.from(state.visibleRemoteParticipants)
                };
            });

            states.push({ name, id: participantId, state: filmstripState });

            // Mute back
            await participant.getToolbar().clickAudioMuteButton();
            await p1.driver.pause(1000);
        }

        const [ firstState, secondState, thirdState ] = states;

        // Helper function to get participant names in the order they appear
        const getVisibleParticipantNames = async (visibleIds: string[]) => {
            return await p1.execute(ids => {
                const state = APP.store.getState();
                const participants = state['features/base/participants'];

                return ids.map(id => {
                    const participant = participants.remote.get(id);

                    return participant?.name || 'Unknown';
                });
            }, visibleIds);
        };

        // Get the names of visible participants for each state
        const firstVisibleNames = await getVisibleParticipantNames(firstState.state.visibleRemoteParticipants);
        const secondVisibleNames = await getVisibleParticipantNames(secondState.state.visibleRemoteParticipants);
        const thirdVisibleNames = await getVisibleParticipantNames(thirdState.state.visibleRemoteParticipants);

        await p1.log(`Visible participants when ${firstState.name} speaks: ${JSON.stringify(firstVisibleNames)}`);
        await p1.log(`Visible participants when ${secondState.name} speaks: ${JSON.stringify(secondVisibleNames)}`);
        await p1.log(`Visible participants when ${thirdState.name} speaks: ${JSON.stringify(thirdVisibleNames)}`);

        // Verify that each dominant speaker appears in visible participants
        expect(firstState.state.visibleRemoteParticipants).toContain(firstState.id);
        expect(secondState.state.visibleRemoteParticipants).toContain(secondState.id);
        expect(thirdState.state.visibleRemoteParticipants).toContain(thirdState.id);

        // Helper function to check if an array is alphabetically sorted
        const isAlphabeticallySorted = (names: string[]) => {
            for (let i = 0; i < names.length - 1; i++) {
                if (names[i].localeCompare(names[i + 1]) > 0) {
                    return false;
                }
            }

            return true;
        };

        // Verify that visible participants maintain alphabetical order
        // This is the key test - when speakers alternate, the filmstrip order should remain stable
        expect(isAlphabeticallySorted(firstVisibleNames)).toBe(true);
        expect(isAlphabeticallySorted(secondVisibleNames)).toBe(true);
        expect(isAlphabeticallySorted(thirdVisibleNames)).toBe(true);

        await p1.log('Filmstrip maintains stable alphabetical ordering when speakers alternate');

        await hangupAllParticipants();
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
    const otherParticipant1Driver = otherParticipant1.driver;

    await otherParticipant1Driver.waitUntil(
        async () => await otherParticipant1.getLargeVideo().getResource() === speakerEndpoint,
        {
            timeout: 30_000, // 30 seconds
            timeoutMsg: 'Active speaker not displayed on large video.'
        });

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
