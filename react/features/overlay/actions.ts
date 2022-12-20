import {
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SET_FATAL_ERROR
} from './actionTypes';
// @ts-ignore
import { openDialog, PageReloadDialog } from '../base/dialog';


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
export function mediaPermissionPromptVisibilityChanged(isVisible: boolean, browser: string) {
    return {
        type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
        browser,
        isVisible
    };
}

/**
 * Opens {@link PageReloadDialog}.
 *
 * @protected
 * @returns {Action}
 */
export function fatalError(is?: boolean) {
    if(is) {
        openDialog(PageReloadDialog)
    }

    return false;
}
