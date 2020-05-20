// @flow

import { openDialog } from '../base/dialog';

import { SecurityDialog } from './components/security-dialog';

/**
 * Action that triggers opening the security options dialog.
 *
 * @returns {Function}
 */
export function openSecurityDialog() {
    return function(dispatch: (Object) => Object) {
        dispatch(openDialog(SecurityDialog));
    };
}
