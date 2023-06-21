import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';

/**
 * Checks whether watchrtc is enabled or not.
 *
 * @param {IStateful} stateful - The redux store or {@code getState} function.
 * @returns {boolean}
 */
export function isWatchRTCEnabled(stateful: IStateful) {
    const state = toState(stateful);
    const { analytics } = state['features/base/config'];

    return analytics?.watchRTCEnabled ?? false;
}