// @flow

import {
    INCOMING_CALL_ANSWERED,
    INCOMING_CALL_DECLINED,
    INCOMING_CALL_RECEIVED
} from './actionTypes';

/**
 * Answers a received incoming call.
 *
 * @returns {{
 *     type: INCOMING_CALL_ANSWERED
 * }}
 */
export function incomingCallAnswered() {
    return {
        type: INCOMING_CALL_ANSWERED
    };
}

/**
 * Declines a received incoming call.
 *
 * @returns {{
 *     type: INCOMING_CALL_DECLINED
 * }}
 */
export function incomingCallDeclined() {
    return {
        type: INCOMING_CALL_DECLINED
    };
}

/**
 * Shows a received incoming call.
 *
 * @param {Object} caller - The caller of an incoming call.
 * @returns {{
 *     type: INCOMING_CALL_RECEIVED,
 *     caller: Object
 * }}
 */
export function incomingCallReceived(caller: Object) {
    return {
        type: INCOMING_CALL_RECEIVED,
        caller
    };
}
