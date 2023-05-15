import { IStore } from '../app/types';
import { toggleDialog } from '../base/dialog/actions';

import { SecurityDialog } from './components/security-dialog';

/**
 * Action that triggers toggle of the security options dialog.
 *
 * @returns {Function}
 */
export function toggleSecurityDialog() {
    return function(dispatch: IStore['dispatch']) {
        dispatch(toggleDialog(SecurityDialog));
    };
}
