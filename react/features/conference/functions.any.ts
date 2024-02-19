import { IStateful } from '../base/app/types';
import { toState } from '../base/redux/functions';
import { iAmVisitor } from '../visitors/functions';


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


/**
 *
 * Returns true if polls feature is disabled.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state
 * features/base/config.
 * @returns {boolean}.
 */
export function arePollsDisabled(stateful: IStateful) {
    const state = toState(stateful);

    return state['features/base/config']?.disablePolls || iAmVisitor(state);
}
