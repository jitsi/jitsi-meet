import { Participant } from '../../helpers/Participant';

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
export async function muteAudioAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickAudioMuteButton();

    await observer.getFilmstrip().assertAudioMuteIconIsDisplayed(testee);
    await testee.getFilmstrip().assertAudioMuteIconIsDisplayed(testee);

    await observer.getParticipantsPane().assertAudioMuteIconIsDisplayed(testee);
    await testee.getParticipantsPane().assertAudioMuteIconIsDisplayed(testee);

}

/**
 * Unmute audio, checks if the local UI has been updated accordingly and then does the verification from
 * the other observer participant perspective.
 * @param testee
 * @param observer
 */
export async function unmuteAudioAndCheck(testee: Participant, observer: Participant) {
    await testee.getNotifications().closeAskToUnmuteNotification(true);
    await testee.getNotifications().closeAVModerationMutedNotification(true);
    await testee.getToolbar().clickAudioUnmuteButton();

    await testee.getFilmstrip().assertAudioMuteIconIsDisplayed(testee, true);
    await observer.getFilmstrip().assertAudioMuteIconIsDisplayed(testee, true);

    await testee.getParticipantsPane().assertAudioMuteIconIsDisplayed(testee, true);
    await observer.getParticipantsPane().assertAudioMuteIconIsDisplayed(testee, true);
}

/**
 * Stop the video on testee and check on observer.
 * @param testee
 * @param observer
 */
export async function unmuteVideoAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getNotifications().closeAskToUnmuteNotification(true);
    await testee.getNotifications().closeAVModerationVideoMutedNotification(true);
    await testee.getToolbar().clickVideoUnmuteButton();

    await testee.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee, true);
    await observer.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee, true);
}

/**
 * Starts the video on testee and check on observer.
 * @param testee
 * @param observer
 */
export async function muteVideoAndCheck(testee: Participant, observer: Participant): Promise<void> {
    await testee.getToolbar().clickVideoMuteButton();

    await testee.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee);
    await observer.getParticipantsPane().assertVideoMuteIconIsDisplayed(testee);
}
