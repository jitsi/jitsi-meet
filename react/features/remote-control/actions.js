import { openDialog } from '../base/dialog';

import { RemoteControlAuthorizationDialog } from './components';

/**
 * Signals that the remote control authorization dialog should be displayed.
 *
 * @param {string} participantId - The id of the participant who is requesting
 * the authorization.
 * @returns {{
 *     type: OPEN_DIALOG,
 *     component: {RemoteControlAuthorizationDialog},
 *     componentProps: {
 *         participantId: {string}
 *      }
 * }}
 * @public
 */
export function openRemoteControlAuthorizationDialog(participantId) {
    return openDialog(RemoteControlAuthorizationDialog, { participantId });
}
