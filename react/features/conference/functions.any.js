import { toState } from '../base/redux';
import { areThereNotifications } from '../notifications';
import { getOverlayToRender } from '../overlay';

/**
 * Tells whether or not the notifications should be displayed within
 * the conference feature based on the current Redux state.
 *
 * @param {Object|Function} stateful - The redux store state.
 * @returns {boolean}
 */
export function shouldDisplayNotifications(stateful) {
    const state = toState(stateful);
    const isAnyOverlayVisible = Boolean(getOverlayToRender(state));
    const { calleeInfoVisible } = state['features/invite'];

    return areThereNotifications(state)
      && !isAnyOverlayVisible
      && !calleeInfoVisible;
}
