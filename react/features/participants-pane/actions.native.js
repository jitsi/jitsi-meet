// @flow

import { openDialog } from '../base/dialog';

import { SET_VOLUME } from './actionTypes';
import { ContextMenuLobbyParticipantReject, ContextMenuMeetingParticipantDetails } from './components/native';
export * from './actions.any';

/**
 * Displays the context menu for the selected lobby participant.
 *
 * @param {Object} participant - The selected lobby participant.
 * @returns {Function}
 */
export function showContextMenuReject(participant: Object) {
    return openDialog(ContextMenuLobbyParticipantReject, { participant });
}


/**
 * Displays the context menu for the selected meeting participant.
 *
 * @param {Object} participant - The selected meeting participant.
 * @returns {Function}
 */
export function showContextMenuDetails(participant: Object) {
    return openDialog(ContextMenuMeetingParticipantDetails, { participant });
}

/**
 * Sets the volume.
 *
 * @param {string} participantId - The participant ID associated with the audio.
 * @param {string} volume - The volume level.
 * @returns {{
 *     type: SET_VOLUME,
 *     participantId: string,
 *     volume: number
 * }}
 */
export function setVolume(participantId: string, volume: number) {
    return {
        type: SET_VOLUME,
        participantId,
        volume
    };
}
