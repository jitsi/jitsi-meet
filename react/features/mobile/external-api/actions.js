// @flow

import { SCREEN_SHARE_PARTICIPANTS_UPDATED } from './actionTypes';

/**
 * Creates a (redux) action which signals that the list of known participants
 * with screen shares has changed.
 *
 * @param {string} participantIds - The participants which currently have active
 * screen share streams.
 * @returns {{
    *     type: SCREEN_SHARE_PARTICIPANTS_UPDATED,
    *     participantId: string
    * }}
    */
export function setParticipantsWithScreenShare(participantIds: Array<string>) {
    return {
        type: SCREEN_SHARE_PARTICIPANTS_UPDATED,
        participantIds
    };
}
