// @flow

import { toggleDialog } from '../base/dialog';

import { SecurityDialog } from './components/security-dialog';

/**
 * Action that triggers toggle of the security options dialog.
 *
 * @returns {Function}
 */
export function toggleSecurityDialog() {
    return function(dispatch: (Object) => Object) {
        dispatch(toggleDialog(SecurityDialog));
    };
}
