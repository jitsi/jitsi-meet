/**
 * Retrieves pending DTMF tones if any. See {@link storePendingDTMF} for more info.
 *
 * @param {Object} state - The Redux state.
 * @returns {string}
 */
export function getPendingDtmf(state) {
    return state['features/invite'].pendingDtmf;
}
