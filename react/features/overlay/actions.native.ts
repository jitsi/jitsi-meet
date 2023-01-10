/* eslint-disable max-len */

// @ts-ignore
import { PageReloadDialog, openDialog } from '../base/dialog';


/**
 * Signals that the prompt for media permission is visible or not.
 *
 * @param {boolean} isVisible - If the value is true - the prompt for media
 * permission is visible otherwise the value is false/undefined.
 * @param {string} browser - The name of the current browser.
 * @public
 * @returns {{
 *     type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
 *     browser: {string},
 *     isVisible: {boolean}
 * }}
 */
export function mediaPermissionPromptVisibilityChanged(isVisible: boolean, browser: string) { // eslint-disable-line @typescript-eslint/no-unused-vars
    // Dummy.
}

/**
 * Opens {@link PageReloadDialog}.
 *
 * @param {boolean} isFatal - If the value is true - we open PageReloadDialog.
 * @returns {Function}
 */
export function fatalError(isFatal: boolean) {
    if (isFatal) {
        return openDialog(PageReloadDialog);
    }

    return false;
}
