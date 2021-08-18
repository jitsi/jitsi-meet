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

/**
 * Gets whether participants in speaker stats should be ordered or not, and with what priority.
 *
 * @param {*} state - The redux state.
 * @returns {Array<string>} - The speaker stats order array or an empty array.
 */
export function getSpeakerStatsOrder(state: Object) {
    return state['features/base/config']?.speakerStatsOrder ?? [];
}
