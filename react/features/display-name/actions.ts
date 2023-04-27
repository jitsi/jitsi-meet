import { openDialog } from '../base/dialog/actions';

import { DisplayNamePrompt } from './components';

/**
 * Signals to open a dialog with the {@code DisplayNamePrompt} component.
 *
 * @param {?Function} onPostSubmit - The function to invoke after a successful
 * submit of the dialog.
 * @returns {Object}
 */
export function openDisplayNamePrompt(onPostSubmit?: Function) {
    return openDialog(DisplayNamePrompt, {
        onPostSubmit
    });
}
