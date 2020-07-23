// @flow

import { getCurrentConference } from '../base/conference';
import { toState } from '../base/redux';

const JID_PATTERN = '[^@]+@[^/]+/(.+)';

/**
 * Returns a knocking participant by ID or JID.
 *
 * @param {Function | Object} stateful - The Redux state or a function that resolves to the Redux state.
 * @param {string} id - The ID or JID of the participant.
 * @returns {Object}
 */
export function getKnockingParticipantById(stateful: Function | Object, id: string): Object {
    const { knockingParticipants } = toState(stateful)['features/lobby'];
    const idToFind = getIdFromJid(id) || id;

    return knockingParticipants.find(p => p.id === idToFind);
}

/**
 * Approves (lets in) or rejects a knocking participant.
 *
 * @param {Function} getState - Function to get the Redux state.
 * @param {string} id - The id of the knocking participant.
 * @param {boolean} approved - True if the participant is approved, false otherwise.
 * @returns {Function}
 */
export function setKnockingParticipantApproval(getState: Function, id: string, approved: boolean) {
    const conference = getCurrentConference(getState());

    if (conference) {
        if (approved) {
            conference.lobbyApproveAccess(id);
        } else {
            conference.lobbyDenyAccess(id);
        }
    }
}

/**
 * Parses an ID from a JID, if a JID is provided, undefined otherwise.
 *
 * @param {string} jid - The JID to get the ID from.
 * @returns {?string}
 */
function getIdFromJid(jid: string): ?string {
    const match = new RegExp(JID_PATTERN, 'g').exec(jid) || [];

    return match[1];
}
