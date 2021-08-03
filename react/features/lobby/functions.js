// @flow

/**
 * Selector to return lobby state.
 *
 * @param {any} state - State object.
 * @returns {any}
 */
export function getLobbyState(state: any) {
    return state['features/lobby'];
}


/**
 * Selector to return array with knocking participant ids.
 *
 * @param {any} state - State object.
 * @returns {Array}
 */
export function getKnockingParticipantsById(state: any) {
    const { knockingParticipants } = state['features/lobby'];

    return knockingParticipants.map(participant => participant.id);
}
