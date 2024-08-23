import { ConnectionFailedError } from '../base/connection/types';
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
 * @param {Error} conferenceError - The conference error that caused the reload.
 * @param {Error} configError - The conference error that caused the reload.
 * @param {Error} connectionError - The conference error that caused the reload.
 * @returns {Function}
 */
export function openPageReloadDialog(
        conferenceError?: Error, configError?: Error, connectionError?: ConnectionFailedError) {
    return openDialog(PageReloadDialog, {
        conferenceError,
        configError,
        connectionError
    });
}
