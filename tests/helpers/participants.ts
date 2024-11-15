import { Participant } from './Participant';

export type IContext = {
    p1: Participant;
    p2: Participant;
    p3: Participant;
    p4: Participant;
    roomName: string;
};

/**
 * Generate a random room name.
 *
 * @returns {string} - The random room name.
 */
function generateRandomRoomName(): string {
    return `jitsimeettorture-${crypto.randomUUID()}}`;
}

/**
 * Ensure that there is on participant.
 *
 * @param {IContext} context - The context.
 * @returns {Promise<void>}
 */
export async function ensureOneParticipant(context: IContext): Promise<void> {
    context.roomName = generateRandomRoomName();

    context.p1 = new Participant('participant1');

    await context.p1.joinConference(context, true);
}

/**
 * Ensure that there are three participants.
 *
 * @param {Object} context - The context.
 * @returns {Promise<void>}
 */
export async function ensureThreeParticipants(context: IContext): Promise<void> {
    context.roomName = generateRandomRoomName();

    const p1 = new Participant('participant1');
    const p2 = new Participant('participant2');
    const p3 = new Participant('participant3');

    context.p1 = p1;
    context.p2 = p2;
    context.p3 = p3;

    // these need to be all, so we get the error when one fails
    await Promise.all([
        p1.joinConference(context),
        p2.joinConference(context),
        p3.joinConference(context)
    ]);

    await Promise.all([
        p1.waitForRemoteStreams(2),
        p2.waitForRemoteStreams(2),
        p3.waitForRemoteStreams(2)
    ]);
}

/**
 * Toggles the mute state of a specific Meet conference participant and verifies that a specific other Meet
 * conference participants sees a specific mute state for the former.
 *
 * @param {Participant} testee - The {@code Participant} which represents the Meet conference participant whose
 * mute state is to be toggled.
 * @param {Participant} observer - The {@code Participant} which represents the Meet conference participant to verify
 * the mute state of {@code testee}.
 * @returns {Promise<void>}
 */
export async function toggleMuteAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickAudioMuteButton();

    await observer.getFilmstrip().assertAudioMuteIconIsDisplayed(testee);
    await testee.getFilmstrip().assertAudioMuteIconIsDisplayed(testee);
}
