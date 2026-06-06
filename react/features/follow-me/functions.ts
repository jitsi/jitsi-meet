import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';

/**
 * Returns true if follow me is active and false otherwise.
 *
 * @param {Object|Function} stateful - Object or function that can be resolved
 * to the Redux state.
 * @returns {boolean} - True if follow me is active and false otherwise.
 */
export function isFollowMeActive(stateful: IStateful) {
    const state = toState(stateful);

    return Boolean(state['features/follow-me'].moderator);
}

/**
 * Returns true if follow me is active only for the recorder and false otherwise.
 *
 * @param {Object|Function} stateful - Object or function that can be resolved
 * to the Redux state.
 * @returns {boolean} - True if follow me is active and false otherwise.
 */
export function isFollowMeRecorderActive(stateful: IStateful) {
    const state = toState(stateful);

    return Boolean(state['features/follow-me'].recorder);
}
