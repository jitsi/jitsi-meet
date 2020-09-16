import { CONNECTION_INDICATOR_SAVE_LOGS } from './actionTypes';


/**
 * Create an action for saving the conference logs.
 *
 * @returns {{
 *     type: CONNECTION_INDICATOR_SAVE_LOGS
 * }}
 */
export function saveLogs() {
    return {
        type: CONNECTION_INDICATOR_SAVE_LOGS
    };
}
