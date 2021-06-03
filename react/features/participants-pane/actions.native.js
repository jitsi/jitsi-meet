import { openDialog } from '../base/dialog';

import { ContextMenuReject } from './components/native/ContextMenuReject';

/**
 * Displays the context menu for the selected lobby participant.
 *
 * @param {string} participant - The selected participant's id.
 * @returns {Function}
 */
export function showContextMenuReject(participant) {
    return openDialog(ContextMenuReject, { participant });
}
