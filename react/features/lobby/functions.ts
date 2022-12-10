import { IReduxState } from '../app/types';
import { getCurrentConference } from '../base/conference/functions';

import { IKnockingParticipant } from './types';


/**
* Selector to return lobby enable state.
*
* @param {IReduxState} state - State object.
* @returns {boolean}
*/
export function getLobbyEnabled(state: IReduxState) {
    return state['features/lobby'].lobbyEnabled;
}

/**
* Selector to return a list of knocking participants.
*
* @param {IReduxState} state - State object.
* @returns {Array<Object>}
*/
export function getKnockingParticipants(state: IReduxState) {
    return state['features/lobby'].knockingParticipants;
}

/**
 * Selector to return lobby visibility.
 *
 * @param {IReduxState} state - State object.
 * @returns {any}
 */
export function getIsLobbyVisible(state: IReduxState) {
    return state['features/lobby'].lobbyVisible;
}

/**
 * Selector to return array with knocking participant ids.
 *
 * @param {IReduxState} state - State object.
 * @returns {Array}
 */
export function getKnockingParticipantsById(state: IReduxState) {
    return getKnockingParticipants(state).map(participant => participant.id);
}


/**
 * Function that handles the visibility of the lobby chat message.
 *
 * @param {Object} participant - Lobby Participant.
 * @returns {Function}
 */
export function showLobbyChatButton(
        participant: IKnockingParticipant
) {
    return function(state: IReduxState) {

        const { enableLobbyChat = true } = state['features/base/config'];
        const { lobbyMessageRecipient, isLobbyChatActive } = state['features/chat'];
        const conference = getCurrentConference(state);

        const lobbyLocalId = conference?.myLobbyUserId();

        if (!enableLobbyChat) {
            return false;
        }

        if (!isLobbyChatActive
        && (!participant.chattingWithModerator
        || participant.chattingWithModerator === lobbyLocalId)
        ) {
            return true;
        }

        if (isLobbyChatActive && lobbyMessageRecipient
        && participant.id !== lobbyMessageRecipient.id
            && (!participant.chattingWithModerator
                || participant.chattingWithModerator === lobbyLocalId)) {
            return true;
        }

        return false;
    };
}
