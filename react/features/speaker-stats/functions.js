// @flow

/**
 * Checks if the speaker stats search is disabled.
 *
 * @param {*} state - The redux state.
 * @returns {boolean} - True if the speaker stats search is disabled and false otherwise.
 */
export function isSpeakerStatsSearchDisabled(state: Object) {
    return state['features/base/config']?.disableSpeakerStatsSearch;
}
