/**
 * The type of Redux action which sets the pending notification UID
 * to use it when hiding the notification is necessary, or unset it when
 * undefined (or no param) is passed.
 *
 * {
 *     type: SET_NOISY_AUDIO_INPUT_NOTIFICATION_UID
 *     uid: ?number
 * }
 */
export const SET_NOISY_AUDIO_INPUT_NOTIFICATION_UID = 'SET_NOISY_AUDIO_INPUT_NOTIFICATION_UID';
