import { PAGE_RELOAD_APPLICATION_LOG } from './actionTypes';

/**
 * Sends a page reload application log message.
 *
 * @param {string} reason - The reason for the reload.
 * @returns {Object}
 */
export function sendPageReloadApplicationLog(reason?: string) {
    return {
        type: PAGE_RELOAD_APPLICATION_LOG,
        reason
    };
}
