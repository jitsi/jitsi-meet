import { appNavigate, reloadWithStoredParams } from '../app';
import { toURLString } from '../base/util';

import {
    CANCEL_FATAL_ERROR_OCCURRED,
    FATAL_ERROR_OCCURRED,
    MEDIA_PERMISSION_PROMPT_VISIBILITY_CHANGED,
    SUSPEND_DETECTED
} from './actionTypes';

const logger = require('jitsi-meet-logger').getLogger(__filename);

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
 * Reloads the page.
 *
 * @protected
 * @returns {Function}
 */
export function _reloadNow() {
    return (dispatch, getState) => {
        const { fatalErrorOccurred } = getState()['features/overlay'];

        fatalErrorOccurred && dispatch({ type: CANCEL_FATAL_ERROR_OCCURRED });

        const { locationURL } = getState()['features/base/connection'];

        logger.info(`Reloading the conference using URL: ${locationURL}`);

        if (navigator.product === 'ReactNative') {
            dispatch(appNavigate(toURLString(locationURL)));
        } else {
            dispatch(reloadWithStoredParams());
        }
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
 * To be called in order to adjust the state of the fatal error feature.
 *
 * @param {boolean} fatalErrorOccurred - If {@code true} it means that a fatal
 * error has occurred and the reload UI is to be displayed. When {@code false}
 * the reload screen will be dismissed and the fatal error (Redux action)
 * re-emitted with the recoverable flag set to {@code false}.
 * @param {Object} fatalErrorCause - The original Redux action which is
 * considered a fatal error from which the reload screen will be trying to
 * recover.
 * @returns {{
 *     type: FATAL_ERROR_OCCURRED,
 *     fatalErrorOccurred: boolean,
 *     fatalErrorCause: Action
 * }}
 */
export function setFatalErrorOccurred(fatalErrorOccurred, fatalErrorCause) {
    return {
        type: FATAL_ERROR_OCCURRED,
        fatalErrorOccurred,
        fatalErrorCause
    };
}
