import { Participant } from './Participant';

/**
 * Generate a random room name.
 */
function generateRandomRoomName(): string {
    return `jitsimeettorture-${crypto.randomUUID()}}`;
}

/**
 * Ensure that there is on participant.
 */
export async function ensureOneParticipant(context: Object): Promise<void> {
    context.roomName = generateRandomRoomName();

    context.p1 = new Participant('participant1');

    await context.p1.joinConference(context, true);
}

/**
 * Ensure that there are three participants.
 */
export async function ensureThreeParticipants(context: Object): Promise<void> {
    context.roomName = generateRandomRoomName();

    const p1 = new Participant('participant1');
    const p2 = new Participant('participant2');
    const p3 = new Participant('participant3');

    context.p1 = p1;
    context.p2 = p2;
    context.p3 = p3;

    await Promise.allSettled([
        p1.joinConference(context),
        p2.joinConference(context),
        p3.joinConference(context)
    ]);

    await Promise.allSettled([
        p1.waitForRemoteStreams(2),
        p2.waitForRemoteStreams(2),
        p3.waitForRemoteStreams(2)
    ]);
}

/**
 * Toggles the mute state of a specific Meet conference participant and verifies that a specific other Meet
 * conference participants sees a specific mute state for the former.
 *
 * @param testee The {@code Participant} which represents the Meet conference participant whose
 * mute state is to be toggled.
 * @param observer The {@code Participant} which represents the Meet conference participant to verify
 * the mute state of {@code testee}.
 */
export async function toggleMuteAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickAudioMuteButton();

    await observer.getFilmstrip().assertAudioMuteIconIsDisplayed(testee);
    await testee.getFilmstrip().assertAudioMuteIconIsDisplayed(testee);
}
