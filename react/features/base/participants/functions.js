/**
 * Returns local participant from Redux state.
 *
 * @param {(Function|Participant[])} participantsOrGetState - Either the
 * features/base/participants Redux state or Redux's getState function to be
 * used to retrieve the features/base/participants state.
 * @returns {(Participant|undefined)}
 */
export function getLocalParticipant(participantsOrGetState) {
    const participants = _getParticipants(participantsOrGetState);

    return participants.find(p => p.local);
}

/**
 * Returns participant by ID from Redux state.
 *
 * @param {(Function|Participant[])} participantsOrGetState - Either the
 * features/base/participants Redux state or Redux's getState function to be
 * used to retrieve the features/base/participants state.
 * @param {string} id - The ID of the participant to retrieve.
 * @private
 * @returns {(Participant|undefined)}
 */
export function getParticipantById(participantsOrGetState, id) {
    const participants = _getParticipants(participantsOrGetState);

    return participants.find(p => p.id === id);
}

/**
 * Returns array of participants from Redux state.
 *
 * @param {(Function|Participant[])} participantsOrGetState - Either the
 * features/base/participants Redux state or Redux's getState function to be
 * used to retrieve the features/base/participants state.
 * @private
 * @returns {Participant[]}
 */
function _getParticipants(participantsOrGetState) {
    const participants
        = typeof participantsOrGetState === 'function'
            ? participantsOrGetState()['features/base/participants']
            : participantsOrGetState;

    return participants || [];
}
