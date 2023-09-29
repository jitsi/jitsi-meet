
import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';

/**
 * Checks whether rtcstats is enabled or not.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function isRTCStatsEnabled(stateful: IStateful) {
    const state = toState(stateful);
    const { analytics } = state['features/base/config'];

    return analytics?.rtcstatsEnabled ?? false;
}

/**
 * Checks if the faceLandmarks data can be sent to the rtcstats server.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function canSendFaceLandmarksRTCStatsData(stateful: IStateful): boolean {
    const state = toState(stateful);
    const { faceLandmarks } = state['features/base/config'];

    return Boolean(faceLandmarks?.enableRTCStats && isRTCStatsEnabled(state));
}
