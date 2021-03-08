// @flow

import { openDialog } from '../base/dialog/actions';

import { WaitForOwnerDialog, LoginDialog } from './components';


/**
 * Shows a notification dialog that authentication is required to create the.
 * Conference, so the local participant should authenticate or wait for a
 * host.
 *
 * @param {Function} onAuthNow - The callback to invoke if the local
 * participant wants to authenticate.
 * @param {Object} contentKey - Dialog description.
 *
 * @returns {Function}.
 */
export function openWaitForOwnerDialog(onAuthNow: ?Function, contentKey: Object) {
    return openDialog(WaitForOwnerDialog, {
        onAuthNow,
        contentKey
    }
    );
}

/**
 * Shows a authentication dialog where the local participant
 * should authenticate.
 *
 * @returns {Function}.
 */
export function openLoginDialog() {
    return openDialog(LoginDialog);
}


