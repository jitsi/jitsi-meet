import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';


/**
 * Tells whether or not the notifications should be displayed within
 * the conference feature based on the current Redux state.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function shouldDisplayNotifications(stateful: IStateful) {
    const state = toState(stateful);
    const { calleeInfoVisible } = state['features/invite'];

    return !calleeInfoVisible;
}
