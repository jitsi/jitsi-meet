// @flow

/**
 * Indicates if the audio mute button is disabled or not.
 *
 * @param {Object} state - The state from the Redux store.
 * @returns {boolean}
 */
export function isAudioMuteButtonDisabled(state: Object) {
    const { audio } = state['features/base/media'];

    return !(audio?.available && !audio?.blocked);
}
