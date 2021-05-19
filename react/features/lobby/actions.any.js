// @flow

import { type Dispatch } from 'redux';

import {
    getCurrentConference
} from '../base/conference';

/**
 * Action to toggle lobby mode on or off.
 *
 * @param {boolean} enabled - The desired (new) state of the lobby mode.
 * @returns {Function}
 */
export function toggleLobbyMode(enabled: boolean) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const conference = getCurrentConference(getState);

        if (enabled) {
            conference.enableLobby();
        } else {
            conference.disableLobby();
        }
    };
}

/**
 * Approves (lets in) or rejects a knocking participant.
 *
 * @param {string} id - The id of the knocking participant.
 * @param {boolean} approved - True if the participant is approved, false otherwise.
 * @returns {Function}
 */
export function setKnockingParticipantApproval(id: string, approved: boolean) {
    return async (dispatch: Dispatch<any>, getState: Function) => {
        const conference = getCurrentConference(getState);

        if (conference) {
            if (approved) {
                conference.lobbyApproveAccess(id);
            } else {
                conference.lobbyDenyAccess(id);
            }
        }
    };
}
