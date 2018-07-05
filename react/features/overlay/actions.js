import {
    SESSION_FAILED,
    getCurrentSession,
    setSession
} from '../base/session';

import {
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SET_FATAL_ERROR,
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
export function setFatalError(fatalError) {
    return {
        type: SET_FATAL_ERROR,
        fatalError
    };
}

/**
 * FIXME naming is not quite accurate - came from the previous method which was
 * reemitting the action. I feel that this part needs more discussion. Changing
 * it back to emitting the original action which caused the fatal error will
 * also require changes to how it's being detected (currently through the state
 * listener, but we'd have to go back to the middleware way).
 *
 * @returns {Function}
 */
export function reemitFatalError() {
    return (dispatch, getState) => {
        const state = getState();
        const { fatalError } = state['features/overlay'];

        if (fatalError) {
            const session = getCurrentSession(state);

            if (session) {
                dispatch(
                    setSession({
                        url: session.url,
                        state: SESSION_FAILED,
                        error: fatalError
                    }));
            } else {
                console.info('No current session!');
            }
            dispatch(setFatalError(undefined));
        } else {
            console.info('NO FATAL ERROR');
        }
    };
}
