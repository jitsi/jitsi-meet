/* globals APP */

import { openDialog } from '../../features/base/dialog';

import { InviteDialog } from './components';

/**
 * Opens the Invite Dialog.
 *
 * @returns {Function}
 */
export function openInviteDialog() {
    return openDialog(InviteDialog, {
        conferenceUrl: encodeURI(APP.ConferenceUrl.getInviteUrl())
    });
}
