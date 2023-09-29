import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState, NetInfoSubscription } from '@react-native-community/netinfo';
// eslint-disable-next-line lines-around-comment
// @ts-expect-error
import EventEmitter from 'events';

import { ONLINE_STATE_CHANGED_EVENT } from './events';
import type { NetworkInfo } from './types';

/**
 * The network info service implementation for iOS and Android. 'react-native-netinfo' seems to support windows as well,
 * but that has not been tested and is nto used by jitsi-meet.
 */
export default class NetworkInfoService extends EventEmitter {
    /**
     * Stores the native subscription for future cleanup.
     */
    _subscription?: NetInfoSubscription;

    /**
     * Converts library's structure to {@link NetworkInfo} used by jitsi-meet.
     *
     * @param {NetInfoState} netInfoState - The new state given by the native library.
     * @private
     * @returns {NetworkInfo}
     */
    static _convertNetInfoState(netInfoState: NetInfoState): NetworkInfo {
        return {
            isOnline: Boolean(netInfoState.isInternetReachable),

            details: netInfoState.details,
            networkType: netInfoState.type
        };
    }

    /**
     * Checks for support.
     *
     * @returns {boolean}
     */
    static isSupported() {
        return Boolean(NetInfo);
    }

    /**
     * Starts the service.
     *
     * @returns {void}
     */
    start() {
        this._subscription = NetInfo.addEventListener(netInfoState => {
            super.emit(ONLINE_STATE_CHANGED_EVENT, NetworkInfoService._convertNetInfoState(netInfoState));
        });
    }

    /**
     * Stops the service.
     *
     * @returns {void}
     */
    stop() {
        if (this._subscription) {
            this._subscription();
            this._subscription = undefined;
        }
    }
}
