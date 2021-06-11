// @flow

import { openDialog } from '../base/dialog';

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
