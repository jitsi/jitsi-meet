import { openDialog } from '../base/dialog';

import { ContextMenuLobbyParticipantReject, ContextMenuMeetingParticipantDetails } from './components/native';

/**
 * Displays the context menu for the selected lobby participant.
 *
 * @param {Object} participant - The selected lobby participant.
 * @returns {Function}
 */
export function showContextMenuReject(participant) {
    return openDialog(ContextMenuLobbyParticipantReject, { participant });
}


/**
 * Displays the context menu for the selected meeting participant.
 *
 * @param {Object} participant - The selected meeting participant.
 * @returns {Function}
 */
export function showContextMenuDetails(participant) {
    return openDialog(ContextMenuMeetingParticipantDetails, { participant });
}
