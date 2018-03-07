/* @flow */

import { SET_CONNECTION_STATE } from './actionTypes';

/**
 * Sets the conference connection state of the testing feature.
 *
 * @param {string} connectionState - This is the lib-jitsi-meet event name. Can
 * be on of:
 * @returns {{
 *     type: SET_CONNECTION_STATE,
 *     connectionState: string
 * }}
 */
export function setConnectionState(connectionState: string) {
    return {
        type: SET_CONNECTION_STATE,
        connectionState
    };
}
