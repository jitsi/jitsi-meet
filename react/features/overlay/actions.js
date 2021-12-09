// @flow

import {
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SET_FATAL_ERROR,
    SET_PAGE_RELOAD_OVERLAY_CANCELED,
    TOGGLE_SLOW_GUM_OVERLAY
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
export function mediaPermissionPromptVisibilityChanged(isVisible: boolean, browser: string) {
    return {
        type: MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
        browser,
        isVisible
    };
}

/**
 * Signals that the prompt for media permission is visible or not.
 *
 * @param {boolean} isVisible - If the value is true - the prompt for media
 * permission is visible otherwise the value is false/undefined.
 * @public
 * @returns {{
*     type: SLOW_GET_USER_MEDIA_OVERLAY,
*     isVisible: {boolean}
* }}
*/
export function toggleSlowGUMOverlay(isVisible: boolean) {
    return {
        type: TOGGLE_SLOW_GUM_OVERLAY,
        isVisible
    };
}

/**
 * The action indicates that an unrecoverable error has occurred and the reload
 * screen will be displayed or hidden.
 *
 * @param {Object} fatalError - A critical error which was not claimed by any
 * feature for error recovery (the recoverable flag was not set). If
 * {@code undefined} then any fatal error currently stored will be discarded.
 * @returns {{
 *     type: SET_FATAL_ERROR,
 *     fatalError: ?Error
 * }}
 */
export function setFatalError(fatalError: Object) {
    return {
        type: SET_FATAL_ERROR,
        fatalError
    };
}

/**
 * The action indicates that the overlay was canceled.
 *
 * @param {Object} error - The error that caused the display of the overlay.
 *
 * @returns {{
    *     type: SET_PAGE_RELOAD_OVERLAY_CANCELED,
    *     error: ?Error
    * }}
    */
export function setPageReloadOverlayCanceled(error: Object) {
    return {
        type: SET_PAGE_RELOAD_OVERLAY_CANCELED,
        error
    };
}
