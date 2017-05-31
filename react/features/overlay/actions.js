import { reload, replace } from '../../../modules/util/helpers';

import {
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
        const { locationURL } = getState()['features/base/connection'];

        logger.info(`Reloading the conference using URL: ${locationURL}`);

        // In an iframe reload with the reload() utility because the replace()
        // utility does not work on an iframe.
        if (window.self === window.top) {
            replace(locationURL);
        } else {
            reload();
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
