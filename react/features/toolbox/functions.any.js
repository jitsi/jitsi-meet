// @flow

/**
 * Indicates if the audio mute button is disabled or not.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioMuteButtonDisabled(state: Object) {
    const { available, muted, unmuteBlocked } = state['features/base/media'].audio;
    const { startSilent } = state['features/base/config'];

    return Boolean(!available || startSilent || (muted && unmuteBlocked));
}
