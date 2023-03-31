import { openDialog } from '../base/dialog/actions';
import PageReloadDialog from '../base/dialog/components/native/PageReloadDialog';


/**
 * Signals that the prompt for media permission is visible or not.
 *
 * @param {boolean} _isVisible - If the value is true - the prompt for media
 * permission is visible otherwise the value is false/undefined.
 * @param {string} _browser - The name of the current browser.
 * @public
 * @returns {{
 *     type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
 *     browser: {string},
 *     isVisible: {boolean}
 * }}
 */
export function mediaPermissionPromptVisibilityChanged(_isVisible: boolean, _browser: string) {
    // Dummy.
}

/**
 * Opens {@link PageReloadDialog}.
 *
 * @returns {Function}
 */
export function openPageReloadDialog() {
    return openDialog(PageReloadDialog);
}
