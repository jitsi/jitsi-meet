// @ts-expect-error
import { Transport } from '../../../modules/transport';

import {
    SET_TRANSPORT,
    SUSPEND_DETECTED
} from './actionTypes';

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
 * Signals setting of a transport.
 *
 * @param {Transport} transport - The transport to save in the state.
 * @returns {{
 *      transport: Transport,
 *      type: string
 *  }}
 */
export function setTransport(transport?: Transport) {
    return {
        type: SET_TRANSPORT,
        transport
    };
}
