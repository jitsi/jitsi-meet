import { IStore } from '../app/types';
import { updateSettings } from '../base/settings/actions';

/**
 * Appends a suffix to the display name.
 *
 * @param {string} displayName - The display name.
 * @param {string} suffix - Suffix that will be appended.
 * @returns {string} The formatted display name.
 */
export function appendSuffix(displayName: string, suffix = ''): string {
    return `${displayName || suffix}${
        displayName && suffix && displayName !== suffix ? ` (${suffix})` : ''}`;
}

/**
 * Dispatches an action to update the local participant's display name. A
 * name must be entered for the action to dispatch.
 *
 * It returns a boolean to comply the Dialog behaviour:
 *     {@code true} - the dialog should be closed.
 *     {@code false} - the dialog should be left open.
 *
 * @param {Function} dispatch - Redux dispatch function.
 * @param {Function} onPostSubmit - Function to be invoked after a successful display name change.
 * @param {string} displayName - The display name to save.
 * @returns {boolean}
 */
export function onSetDisplayName(dispatch: IStore['dispatch'], onPostSubmit?: Function) {
    return function(displayName: string) {
        if (!displayName?.trim()) {
            return false;
        }

        // Store display name in settings
        dispatch(updateSettings({
            displayName
        }));

        onPostSubmit?.();

        return true;
    };
}
