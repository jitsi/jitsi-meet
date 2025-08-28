import { openDialog } from '../base/dialog/actions';

import { DisplayNamePrompt } from './components';

/**
 * Signals to open a dialog with the {@code DisplayNamePrompt} component.
 *
 * @param {Object} params - Map containing the callbacks to be executed in the prompt:
 * - onPostSubmit - The function to invoke after a successful submit of the dialog.
 * - validateInput - The function to invoke after a change in the display name value.
 * @returns {Object}
 */
export function openDisplayNamePrompt({ onPostSubmit, validateInput }: {
    onPostSubmit?: Function;
    validateInput?: Function;
}) {
    return openDialog(DisplayNamePrompt, {
        onPostSubmit,
        validateInput
    });
}
