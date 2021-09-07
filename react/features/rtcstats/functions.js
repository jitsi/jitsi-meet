// @flow

import { toState } from '../base/redux';

import RTCStats from './RTCStats';

/**
 * Checks whether rtcstats is enabled or not.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function isRtcstatsEnabled(stateful: Function | Object) {
    // TODO: Remove when rtcstats is fully cimpatible with mobile.
    if (navigator.product === 'ReactNative') {
        return false;
    }

    const state = toState(stateful);
    const config = state['features/base/config'];

    return config?.analytics?.rtcstatsEnabled ?? false;
}

/**
 * Can the rtcstats service send data.
 *
 * @param {Function|Object} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function canSendRtcstatsData(stateful: Function | Object) {

    return isRtcstatsEnabled(stateful) && RTCStats.isInitialized();
}
