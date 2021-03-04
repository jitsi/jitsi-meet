// @flow

import { openDialog } from '../base/dialog/actions';

import { WaitForOwnerDialog } from './components/web';


/**
 * Displays the wait for owner dialog.
 *
 *
 * @returns {Function}
 */
export function showWaitForOwnerDialog() {
    return openDialog(WaitForOwnerDialog);
}


