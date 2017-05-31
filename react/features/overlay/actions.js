import {
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SUSPEND_DETECTED
} from './actionTypes';

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
export function mediaPermissionPromptVisibilityChanged(isVisible, browser) {
    return {
        type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
        browser,
        isVisible
    };
}

/**
 * Signals that suspend was detected.
 *
 * @public
 * @returns {{
 *     type: SUSPEND_DETECTED
 * }}
 */
export function suspendDetected() {
    return {
        type: SUSPEND_DETECTED
    };
}
