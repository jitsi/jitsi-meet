// @flow

import { SET_NETWORK_INFO, _STORE_NETWORK_INFO_CLEANUP } from './actionTypes';
import type { NetworkInfo } from './types';

/**
 * Up[dates the network info state.
 *
 * @param {NetworkInfo} networkInfo - The new network state to be set.
 * @returns {{
 *     type: SET_NETWORK_INFO,
 *     isOnline: boolean,
 *     networkType: string,
 *     details: Object
 * }}
 */
export function setNetworkInfo({ isOnline, networkType, details }: NetworkInfo): Object {
    return {
        type: SET_NETWORK_INFO,
        isOnline,
        networkType,
        details
    };
}

/**
 * Stored the cleanup function used to shutdown the {@code NetworkInfoService}.
 *
 * @param {Function} cleanup - The cleanup function to be called on {@code APP_WILL_UNMOUNT}.
 * @returns {{
 *     type: _STORE_NETWORK_INFO_CLEANUP,
 *     cleanup: Function
 * }}
 * @private
 */
export function _storeNetworkInfoCleanup(cleanup: Function): Object {
    return {
        type: _STORE_NETWORK_INFO_CLEANUP,
        cleanup
    };
}
