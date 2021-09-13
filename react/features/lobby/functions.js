// @flow

/**
* Selector to return lobby enable state.
*
* @param {any} state - State object.
* @returns {boolean}
*/
export function getLobbyEnabled(state: any) {
    return state['features/lobby'].lobbyEnabled;
}

/**
* Selector to return a list of knocking participants.
*
* @param {any} state - State object.
* @returns {Array<Object>}
*/
export function getKnockingParticipants(state: any) {
    return state['features/lobby'].knockingParticipants;
}

/**
 * Selector to return lobby visibility.
 *
 * @param {any} state - State object.
 * @returns {any}
 */
export function getIsLobbyVisible(state: any) {
    return state['features/lobby'].lobbyVisible;
}

/**
 * Selector to return array with knocking participant ids.
 *
 * @param {any} state - State object.
 * @returns {Array}
 */
export function getKnockingParticipantsById(state: any) {
    return getKnockingParticipants(state).map(participant => participant.id);
}
