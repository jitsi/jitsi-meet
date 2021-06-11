import { openDialog } from '../base/dialog';

import { PARTICIPANTS_PANE_CLOSE, PARTICIPANTS_PANE_OPEN } from './actionTypes';
import { ContextMenuLobbyParticipantReject, ContextMenuMeetingParticipantDetails } from './components/native';


/**
 * Action to open the participants pane.
 *
 * @returns {Object}
 */
export function open() {
    console.log(2);

    return {
        type: PARTICIPANTS_PANE_OPEN
    };
}

/**
 * Action to close the participants pane.
 *
 * @returns {Object}
 */
export function close() {
    return {
        type: PARTICIPANTS_PANE_CLOSE
    };
}

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
