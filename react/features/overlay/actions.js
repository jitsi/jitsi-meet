import {
    SUSPEND_DETECTED,
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED
} from './actionTypes';
import './reducer';

/**
 * Signals that suspend was detected.
 *
 * @returns {{
 *     type: SUSPEND_DETECTED
 * }}
 * @public
 */
export function suspendDetected() {
    return {
        type: SUSPEND_DETECTED
    };
}

/**
 * Signals that the prompt for media permission is visible or not.
 *
 * @param {boolean} isVisible - If the value is true - the prompt for media
 * permission is visible otherwise the value is false/undefined.
 * @param {string} browser - The name of the current browser.
 * @returns {{
 *     type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
 *     isVisible: {boolean},
 *     browser: {string}
 * }}
 * @public
 */
export function mediaPermissionPromptVisibilityChanged(isVisible, browser) {
    return {
        type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
        isVisible,
        browser
    };
}
