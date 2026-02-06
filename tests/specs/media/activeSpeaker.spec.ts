import type { Participant } from '../../helpers/Participant';
import { setTestProperties } from '../../helpers/TestProperties';
import {
    checkForScreensharingTile,
    ensureSixParticipants,
    ensureThreeParticipants,
    hangupAllParticipants
} from '../../helpers/participants';
import { muteAudioAndCheck } from '../helpers/mute';

setTestProperties(__filename, {
    usesBrowsers: [ 'p1', 'p2', 'p3', 'p4', 'p5', 'p6' ]
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
    it.skip('testDominantSpeakerInFilmstripWithLimitedSlots', async () => {
        await ensureSixParticipants({
            configOverwrite: {
                startWithAudioMuted: true
            }
        });
        const { p1, p2, p3, p4, p5, p6 } = ctx;

        // Resize p1's window to limit filmstrip slots to 2-3 tiles
        // This creates the condition where not all participants fit in the filmstrip
        await p1.driver.setWindowSize(1024, 600);
        await p1.driver.pause(1000); // Wait for layout to adjust

        // Set display names to create alphabetical ordering
        // Names chosen so p6 ("Zoe") is alphabetically last: Alice, Bob, Charlie, Eve, Frank, Zoe
        await setAlphabeticalDisplayNames(p1, p2, p3, p4, p5, p6);

        // Test with multiple speakers: Eve (p4), Frank (p5), and Zoe (p6)
        // This verifies the fix works for different alphabetical positions
        const speakersToTest = [
            { participant: p4, name: 'Eve' },
            { participant: p5, name: 'Frank' },
            { participant: p6, name: 'Zoe' }
        ];

        for (const { participant, name } of speakersToTest) {
            const participantId = await participant.getEndpointId();

            await p1.log(`Testing ${name} (${participantId}) as dominant speaker`);

            // Make this participant the dominant speaker by unmuting
            await participant.getToolbar().clickAudioUnmuteButton();

            // Wait for the dominant speaker to be detected
            await waitForDominantSpeaker(p1, participantId, name);

            // Verify that the participant appears in the visible remote participants
            const filmstripState = await getFilmstripState(p1);

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
            await p1.driver.pause(2000);
        }

        await hangupAllParticipants();
    });

    /**
     * Test dominant speaker in filmstrip with screensharing active.
     * Verifies that dominant speaker is still visible when screen shares
     * take up some of the visible slots.
     */
    it.skip('testDominantSpeakerWithScreensharing', async () => {
        await ensureSixParticipants({
            configOverwrite: {
                startWithAudioMuted: true
            }
        });
        const { p1, p2, p3, p4, p5, p6 } = ctx;

        // Resize p1's window to limit filmstrip slots
        await p1.driver.setWindowSize(1024, 600);
        await p1.driver.pause(1000); // Wait for layout to adjust

        // Set display names
        await setAlphabeticalDisplayNames(p1, p2, p3, p4, p5, p6);

        // Start screensharing from p2
        await p2.getToolbar().clickDesktopSharingButton();
        await checkForScreensharingTile(p2, p1);

        // Test with multiple speakers while screensharing is active
        const speakersToTest = [
            { participant: p4, name: 'Eve' },
            { participant: p5, name: 'Frank' },
            { participant: p6, name: 'Zoe' }
        ];

        for (const { participant, name } of speakersToTest) {
            const participantId = await participant.getEndpointId();

            await p1.log(`Testing ${name} (${participantId}) as dominant speaker with screensharing`);

            // Make this participant the dominant speaker by unmuting
            await participant.getToolbar().clickAudioUnmuteButton();

            // Wait for the dominant speaker to be detected
            await waitForDominantSpeaker(p1, participantId, name);

            // Verify dominant speaker is still visible in filmstrip despite screenshare
            const filmstripState = await getFilmstripState(p1);

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
    it.skip('testFilmstripStableOrderingWithMultipleSpeakers', async () => {
        await ensureSixParticipants({
            configOverwrite: {
                startWithAudioMuted: true
            }
        });
        const { p1, p2, p3, p4, p5, p6 } = ctx;

        // Resize p1's window to limit filmstrip slots
        await p1.driver.setWindowSize(1024, 600);
        await p1.driver.pause(1000); // Wait for layout to adjust

        // Set display names
        await setAlphabeticalDisplayNames(p1, p2, p3, p4, p5, p6);

        // First, have Eve, Frank, and Zoe all speak to get them into the active speakers list
        const speakersToTest = [
            { participant: p4, name: 'Eve' },
            { participant: p5, name: 'Frank' },
            { participant: p6, name: 'Zoe' }
        ];

        await p1.log('Initial round: getting all three speakers into active speakers list');

        for (const { participant, name } of speakersToTest) {
            const participantId = await participant.getEndpointId();

            await p1.log(`${name} (${participantId}) speaking for the first time`);
            await participant.getToolbar().clickAudioUnmuteButton();
            await waitForDominantSpeaker(p1, participantId, name);
            await participant.getToolbar().clickAudioMuteButton();
            await p1.driver.pause(1000);
        }

        // Now cycle through them again and verify they maintain alphabetical order (Eve, Frank, Zoe)
        await p1.log('Second round: verifying stable alphabetical ordering when speakers alternate');

        const states = [];

        for (const { participant, name } of speakersToTest) {
            const participantId = await participant.getEndpointId();

            await p1.log(`Testing ${name} (${participantId}) for stable ordering`);

            // Make this participant the dominant speaker
            await participant.getToolbar().clickAudioUnmuteButton();

            // Wait for the dominant speaker to be detected
            await waitForDominantSpeaker(p1, participantId, name);

            // Capture filmstrip state
            const filmstripState = await getFilmstripState(p1);

            states.push({ name, id: participantId, state: filmstripState });

            // Mute back
            await participant.getToolbar().clickAudioMuteButton();
            await p1.driver.pause(1000);
        }

        const [ eveState, frankState, zoeState ] = states;

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
        const eveVisibleNames = await getVisibleParticipantNames(eveState.state.visibleRemoteParticipants);
        const frankVisibleNames = await getVisibleParticipantNames(frankState.state.visibleRemoteParticipants);
        const zoeVisibleNames = await getVisibleParticipantNames(zoeState.state.visibleRemoteParticipants);

        await p1.log(`Visible participants when Eve is dominant: ${JSON.stringify(eveVisibleNames)}`);
        await p1.log(`Visible participants when Frank is dominant: ${JSON.stringify(frankVisibleNames)}`);
        await p1.log(`Visible participants when Zoe is dominant: ${JSON.stringify(zoeVisibleNames)}`);

        await p1.log(`Eve visible count: ${eveState.state.visibleRemoteParticipants.length}, total remote: ${eveState.state.remoteParticipants.length}`);
        await p1.log(`Frank visible count: ${frankState.state.visibleRemoteParticipants.length}, total remote: ${frankState.state.remoteParticipants.length}`);
        await p1.log(`Zoe visible count: ${zoeState.state.visibleRemoteParticipants.length}, total remote: ${zoeState.state.remoteParticipants.length}`);

        // Verify that each dominant speaker appears in visible participants
        expect(eveState.state.visibleRemoteParticipants).toContain(eveState.id);
        expect(frankState.state.visibleRemoteParticipants).toContain(frankState.id);
        expect(zoeState.state.visibleRemoteParticipants).toContain(zoeState.id);

        // Helper function to get the relative order of Eve, Frank, and Zoe
        const getSpeakersOrder = (names: string[]) => {
            return names.filter(n => [ 'Eve', 'Frank', 'Zoe' ].includes(n));
        };

        const eveOrder = getSpeakersOrder(eveVisibleNames);
        const frankOrder = getSpeakersOrder(frankVisibleNames);
        const zoeOrder = getSpeakersOrder(zoeVisibleNames);

        await p1.log(`Speakers order when Eve is dominant: ${JSON.stringify(eveOrder)}`);
        await p1.log(`Speakers order when Frank is dominant: ${JSON.stringify(frankOrder)}`);
        await p1.log(`Speakers order when Zoe is dominant: ${JSON.stringify(zoeOrder)}`);

        // Verify that the dominant speaker is always in the visible list (this tests the bug fix)
        expect(eveOrder).toContain('Eve');
        expect(frankOrder).toContain('Frank');
        expect(zoeOrder).toContain('Zoe');

        // Helper to check if array is alphabetically sorted
        const isAlphabeticallySorted = (names: string[]) => {
            for (let i = 0; i < names.length - 1; i++) {
                if (names[i].localeCompare(names[i + 1]) > 0) {
                    return false;
                }
            }

            return true;
        };

        // Verify that whatever speakers ARE visible maintain alphabetical order
        // This is the key test - when the same speakers alternate, visible speakers stay in alphabetical order
        expect(isAlphabeticallySorted(eveOrder)).toBe(true);
        expect(isAlphabeticallySorted(frankOrder)).toBe(true);
        expect(isAlphabeticallySorted(zoeOrder)).toBe(true);

        // Additionally verify order consistency: if multiple speakers are visible in multiple states,
        // their relative order should be the same
        // For example, if Eve and Frank are both visible when Zoe speaks, they should be [Eve, Frank]
        if (eveOrder.includes('Frank') && frankOrder.includes('Eve')) {
            // Both Eve and Frank visible in both states
            const eveAndFrankInEveState = eveOrder.filter(n => [ 'Eve', 'Frank' ].includes(n));
            const eveAndFrankInFrankState = frankOrder.filter(n => [ 'Eve', 'Frank' ].includes(n));

            expect(eveAndFrankInEveState).toEqual(eveAndFrankInFrankState);
        }

        await p1.log('Filmstrip maintains alphabetical ordering of visible speakers when dominant speaker changes');

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

/**
 * Wait for a participant to be detected as the dominant speaker.
 *
 * @param {Participant} observer - The participant observing the dominant speaker state.
 * @param {string} participantId - The endpoint ID of the expected dominant speaker.
 * @param {string} participantName - The name of the participant for logging.
 */
async function waitForDominantSpeaker(
        observer: Participant,
        participantId: string,
        participantName: string
): Promise<void> {
    await observer.driver.waitUntil(
        async () => {
            const state = await observer.execute(() => {
                const participants = APP.store.getState()['features/base/participants'];

                return participants.dominantSpeaker;
            });

            return state === participantId;
        },
        {
            timeout: 10000,
            timeoutMsg: `${participantName} (${participantId}) was not detected as dominant speaker within 10 seconds`
        }
    );

    // Wait a bit more for filmstrip state to update after dominant speaker changes
    await observer.driver.pause(1000);
}

/**
 * Get the current filmstrip state from Redux.
 *
 * @param {Participant} participant - The participant to query.
 * @returns {Promise<FilmstripState>} The filmstrip state.
 */
async function getFilmstripState(participant: Participant): Promise<{
    dominantSpeaker: string | null;
    remoteParticipants: string[];
    visibleRemoteParticipants: string[];
}> {
    return await participant.execute(() => {
        const state = APP.store.getState();
        const filmstrip = state['features/filmstrip'];
        const participants = state['features/base/participants'];

        return {
            dominantSpeaker: participants.dominantSpeaker,
            remoteParticipants: filmstrip.remoteParticipants,
            visibleRemoteParticipants: Array.from(filmstrip.visibleRemoteParticipants)
        };
    });
}

/**
 * Set display names for all 6 participants to create alphabetical ordering.
 */
async function setAlphabeticalDisplayNames(
        p1: Participant,
        p2: Participant,
        p3: Participant,
        p4: Participant,
        p5: Participant,
        p6: Participant
): Promise<void> {
    await p1.setLocalDisplayName('Alice');
    await p2.setLocalDisplayName('Bob');
    await p3.setLocalDisplayName('Charlie');
    await p4.setLocalDisplayName('Eve');
    await p5.setLocalDisplayName('Frank');
    await p6.setLocalDisplayName('Zoe');

    // Wait for display names to propagate
    await p1.driver.pause(2000);
}
