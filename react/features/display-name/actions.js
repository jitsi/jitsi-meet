import { openDialog } from '../../features/base/dialog';

import { DisplayNamePrompt } from './components';

/**
 * Signals to open a dialog with the {@code DisplayNamePrompt} component.
 *
 * @returns {Object}
 */
export function openDisplayNamePrompt() {
    return openDialog(DisplayNamePrompt);
}
